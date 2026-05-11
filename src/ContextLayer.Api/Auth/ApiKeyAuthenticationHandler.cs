using System.Security.Claims;
using System.Text.Encodings.Web;
using ContextLayer.Domain.Enums;
using ContextLayer.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ContextLayer.Api.Auth;

public sealed class ApiKeyAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    ContextLayerDbContext dbContext,
    ContextLayer.Infrastructure.Auth.PasswordHashingService passwordHashingService,
    TimeProvider timeProvider)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "ContextLayerApiKey";
    public const string ClientIdHeaderName = "X-API-Client-Id";
    public const string ApiKeyHeaderName = "X-API-Key";
    public const string RawApiKeyItemName = "ContextLayer.ApiKey.Raw";

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var (clientId, apiKey) = ResolveCredentials(Request);
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(apiKey))
        {
            return AuthenticateResult.NoResult();
        }

        var client = await dbContext.ApiClients
            .AsTracking()
            .Include(x => x.Tenant)
            .Include(x => x.Workspace)
            .FirstOrDefaultAsync(x => x.ClientId == clientId.Trim(), Context.RequestAborted);

        if (client is null
            || client.Status != ApiClientStatus.Active
            || !passwordHashingService.VerifyPassword(apiKey.Trim(), client.SecretHash))
        {
            return AuthenticateResult.Fail("Invalid API client credentials.");
        }

        Context.Items[RawApiKeyItemName] = apiKey.Trim();
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        client.MarkUsed(utcNow);
        await dbContext.SaveChangesAsync(Context.RequestAborted);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, $"client:{client.ClientId}"),
            new("client_id", client.ClientId),
            new("tenant_id", client.TenantId.ToString("D")),
            new("tenant_slug", client.Tenant.Slug),
            new("display_name", client.DisplayName),
            new(ClaimTypes.Email, $"{client.ClientId}@machines.contextlayer.local"),
            new(ClaimTypes.Role, ContextLayer.Infrastructure.Auth.RoleNames.ApiClient)
        };

        if (client.Workspace is not null)
        {
            claims.Add(new Claim("workspace_id", client.Workspace.Id.ToString("D")));
            claims.Add(new Claim("workspace_slug", client.Workspace.Slug));
        }

        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme.Name));
        return AuthenticateResult.Success(new AuthenticationTicket(principal, Scheme.Name));
    }

    private static (string? ClientId, string? ApiKey) ResolveCredentials(HttpRequest request)
    {
        var clientId = request.Headers[ClientIdHeaderName].FirstOrDefault();
        var apiKey = request.Headers[ApiKeyHeaderName].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(clientId) && !string.IsNullOrWhiteSpace(apiKey))
        {
            return (clientId, apiKey);
        }

        var authorization = request.Headers.Authorization.FirstOrDefault();
        const string apiKeyPrefix = "ApiKey ";
        if (!string.IsNullOrWhiteSpace(authorization)
            && authorization.StartsWith(apiKeyPrefix, StringComparison.OrdinalIgnoreCase))
        {
            var credential = authorization[apiKeyPrefix.Length..].Trim();
            var separatorIndex = credential.IndexOf(':', StringComparison.Ordinal);
            if (separatorIndex > 0 && separatorIndex < credential.Length - 1)
            {
                return (credential[..separatorIndex], credential[(separatorIndex + 1)..]);
            }
        }

        return (null, null);
    }
}
