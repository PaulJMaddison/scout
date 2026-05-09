using System.Text.Json;
using System.Security.Claims;
using ContextLayer.Domain.Entities;
using ContextLayer.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ContextLayer.Infrastructure.Auth;

public sealed class AuthenticationService(
    ContextLayerDbContext dbContext,
    PasswordHashingService passwordHashingService,
    JwtTokenService jwtTokenService,
    TimeProvider timeProvider)
{
    public async Task<LoginResult> LoginAsync(string tenantSlug, string email, string password, CancellationToken cancellationToken)
    {
        var normalizedTenantSlug = tenantSlug.Trim().ToLowerInvariant();
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;

        var tenant = await dbContext.Tenants.FirstOrDefaultAsync(x => x.Slug == normalizedTenantSlug, cancellationToken)
            ?? throw new InvalidOperationException("Invalid tenant or credentials.");

        var account = await dbContext.OperatorAccounts
            .FirstOrDefaultAsync(
                x => x.TenantId == tenant.Id && x.Email == normalizedEmail && x.IsActive,
                cancellationToken)
            ?? throw new InvalidOperationException("Invalid tenant or credentials.");

        if (!passwordHashingService.VerifyPassword(password, account.PasswordHash))
        {
            dbContext.AuditEvents.Add(AuditEvent.Create(
                tenant.Id,
                normalizedEmail,
                "auth.login.failed",
                nameof(OperatorAccount),
                account.Id.ToString("D"),
                Guid.NewGuid().ToString("N"),
                JsonSerializer.Serialize(new { tenantSlug = normalizedTenantSlug, email = normalizedEmail }),
                null,
                null,
                utcNow));
            await dbContext.SaveChangesAsync(cancellationToken);
            throw new InvalidOperationException("Invalid tenant or credentials.");
        }

        account.MarkLogin(utcNow);
        var token = jwtTokenService.CreateToken(tenant, account);

        dbContext.AuditEvents.Add(AuditEvent.Create(
            tenant.Id,
            account.Email,
            "auth.login.succeeded",
            nameof(OperatorAccount),
            account.Id.ToString("D"),
            Guid.NewGuid().ToString("N"),
            JsonSerializer.Serialize(new
            {
                tenantSlug = tenant.Slug,
                account.Email,
                role = RoleNames.ToClaimValue(account.Role)
            }),
            null,
            JsonSerializer.Serialize(new { token.ExpiresAtUtc }),
            utcNow));

        await dbContext.SaveChangesAsync(cancellationToken);

        return new LoginResult(
            token.AccessToken,
            token.ExpiresAtUtc,
            new AuthenticatedOperator(
                tenant.Id,
                tenant.Slug,
                account.Id,
                account.Email,
                account.DisplayName,
                RoleNames.ToClaimValue(account.Role)));
    }

    public async Task<AuthenticatedOperator?> GetCurrentOperatorAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var accountIdValue = principal.FindFirst("sub")?.Value ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(accountIdValue, out var accountId))
        {
            return null;
        }

        var account = await dbContext.OperatorAccounts
            .Include(x => x.Tenant)
            .FirstOrDefaultAsync(x => x.Id == accountId && x.IsActive, cancellationToken);
        if (account is null)
        {
            return null;
        }

        return new AuthenticatedOperator(
            account.TenantId,
            account.Tenant.Slug,
            account.Id,
            account.Email,
            account.DisplayName,
            RoleNames.ToClaimValue(account.Role));
    }
}

public sealed record LoginResult(
    string AccessToken,
    DateTime ExpiresAtUtc,
    AuthenticatedOperator Operator);

public sealed record AuthenticatedOperator(
    Guid TenantId,
    string TenantSlug,
    Guid OperatorAccountId,
    string Email,
    string DisplayName,
    string Role);
