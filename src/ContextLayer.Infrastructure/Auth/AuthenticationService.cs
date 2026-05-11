using System.Text.Json;
using System.Security.Claims;
using ContextLayer.Domain.Entities;
using ContextLayer.Domain.Enums;
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

        var tenant = await dbContext.Tenants.FirstOrDefaultAsync(x => x.Slug == normalizedTenantSlug, cancellationToken);
        if (tenant is null)
        {
            await AuditFailedLoginAsync(null, normalizedEmail, normalizedTenantSlug, utcNow, cancellationToken);
            throw new InvalidOperationException("Invalid tenant or credentials.");
        }

        var account = await dbContext.OperatorAccounts
            .FirstOrDefaultAsync(
                x => x.TenantId == tenant.Id && x.Email == normalizedEmail && x.IsActive,
                cancellationToken)
            ?? throw await CreateFailedLoginExceptionAsync(tenant.Id, normalizedEmail, normalizedTenantSlug, utcNow, cancellationToken);

        if (!passwordHashingService.VerifyPassword(password, account.PasswordHash))
        {
            await AuditFailedLoginAsync(tenant.Id, normalizedEmail, normalizedTenantSlug, utcNow, cancellationToken);
            throw new InvalidOperationException("Invalid tenant or credentials.");
        }

        var workspace = await dbContext.WorkspaceMembers
            .AsNoTracking()
            .Include(x => x.Workspace)
            .Where(x => x.TenantId == tenant.Id && x.OperatorAccountId == account.Id && x.Workspace.Status == WorkspaceStatus.Active)
            .OrderByDescending(x => x.Workspace.IsDefault)
            .ThenBy(x => x.Workspace.Name)
            .Select(x => x.Workspace)
            .FirstOrDefaultAsync(cancellationToken);

        account.MarkLogin(utcNow);
        var token = jwtTokenService.CreateToken(tenant, account, workspace);

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
                workspaceSlug = workspace?.Slug,
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
                workspace?.Id,
                workspace?.Slug,
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

        var workspace = await dbContext.WorkspaceMembers
            .AsNoTracking()
            .Include(x => x.Workspace)
            .Where(x => x.TenantId == account.TenantId && x.OperatorAccountId == account.Id && x.Workspace.Status == WorkspaceStatus.Active)
            .OrderByDescending(x => x.Workspace.IsDefault)
            .ThenBy(x => x.Workspace.Name)
            .Select(x => x.Workspace)
            .FirstOrDefaultAsync(cancellationToken);

        return new AuthenticatedOperator(
            account.TenantId,
            account.Tenant.Slug,
            workspace?.Id,
            workspace?.Slug,
            account.Id,
            account.Email,
            account.DisplayName,
            RoleNames.ToClaimValue(account.Role));
    }

    private async Task<OperatorAccount> AuditFailedLoginAsync(
        Guid? tenantId,
        string normalizedEmail,
        string normalizedTenantSlug,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        dbContext.AuditEvents.Add(AuditEvent.Create(
            tenantId,
            normalizedEmail,
            "auth.login.failed",
            nameof(OperatorAccount),
            normalizedEmail,
            Guid.NewGuid().ToString("N"),
            JsonSerializer.Serialize(new { tenantSlug = normalizedTenantSlug, email = normalizedEmail }),
            null,
            null,
            utcNow));
        await dbContext.SaveChangesAsync(cancellationToken);
        throw new InvalidOperationException("Invalid tenant or credentials.");
    }

    private async Task<InvalidOperationException> CreateFailedLoginExceptionAsync(
        Guid? tenantId,
        string normalizedEmail,
        string normalizedTenantSlug,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        await AuditFailedLoginAsync(tenantId, normalizedEmail, normalizedTenantSlug, utcNow, cancellationToken);
        return new InvalidOperationException("Invalid tenant or credentials.");
    }
}

public sealed record LoginResult(
    string AccessToken,
    DateTime ExpiresAtUtc,
    AuthenticatedOperator Operator);

public sealed record AuthenticatedOperator(
    Guid TenantId,
    string TenantSlug,
    Guid? WorkspaceId,
    string? WorkspaceSlug,
    Guid OperatorAccountId,
    string Email,
    string DisplayName,
    string Role);
