using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ContextLayer.Domain.Entities;
using ContextLayer.Domain.Saas;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace ContextLayer.Infrastructure.Auth;

public sealed class JwtTokenService(IOptions<AuthOptions> options, TimeProvider timeProvider)
{
    public AuthTokenResult CreateToken(Tenant tenant, OperatorAccount account, Workspace? workspace)
    {
        var authOptions = options.Value;
        var issuedAt = timeProvider.GetUtcNow().UtcDateTime;
        var expiresAt = issuedAt.AddMinutes(authOptions.AccessTokenMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, account.Id.ToString("D")),
            new(ClaimTypes.NameIdentifier, account.Id.ToString("D")),
            new(JwtRegisteredClaimNames.Email, account.Email),
            new(ClaimTypes.Email, account.Email),
            new("tenant_id", tenant.Id.ToString("D")),
            new("tenant_slug", tenant.Slug),
            new("display_name", account.DisplayName),
            new(ClaimTypes.Role, RoleNames.ToClaimValue(account.Role))
        };

        if (workspace is not null)
        {
            claims.Add(new Claim("workspace_id", workspace.Id.ToString("D")));
            claims.Add(new Claim("workspace_slug", workspace.Slug));
        }

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authOptions.SigningKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = authOptions.Issuer,
            Audience = authOptions.Audience,
            Expires = expiresAt,
            NotBefore = issuedAt,
            IssuedAt = issuedAt,
            SigningCredentials = credentials
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(descriptor);

        return new AuthTokenResult(handler.WriteToken(token), expiresAt);
    }

    public AuthTokenResult CreateMachineToken(
        Tenant tenant,
        MachineClientOptions machineClient,
        IReadOnlyList<string> grantedScopes,
        Workspace? workspace = null)
    {
        var authOptions = options.Value;
        var issuedAt = timeProvider.GetUtcNow().UtcDateTime;
        var expiresAt = issuedAt.AddMinutes(authOptions.AccessTokenMinutes);
        var subject = $"client:{machineClient.ClientId}";
        var role = RoleNames.FromClaimValue(machineClient.Role);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, subject),
            new(ClaimTypes.NameIdentifier, subject),
            new("client_id", machineClient.ClientId),
            new("tenant_id", tenant.Id.ToString("D")),
            new("tenant_slug", tenant.Slug),
            new("display_name", string.IsNullOrWhiteSpace(machineClient.DisplayName) ? machineClient.ClientId : machineClient.DisplayName),
            new(ClaimTypes.Email, $"{machineClient.ClientId}@machines.contextlayer.local"),
            new(JwtRegisteredClaimNames.Email, $"{machineClient.ClientId}@machines.contextlayer.local"),
            new(ClaimTypes.Role, RoleNames.ToClaimValue(role))
        };

        if (workspace is not null)
        {
            claims.Add(new Claim("workspace_id", workspace.Id.ToString("D")));
            claims.Add(new Claim("workspace_slug", workspace.Slug));
        }

        if (grantedScopes.Count > 0)
        {
            claims.Add(new Claim("scope", string.Join(' ', grantedScopes)));
        }

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authOptions.SigningKey));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Issuer = authOptions.Issuer,
            Audience = authOptions.Audience,
            Expires = expiresAt,
            NotBefore = issuedAt,
            IssuedAt = issuedAt,
            SigningCredentials = credentials
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(descriptor);

        return new AuthTokenResult(handler.WriteToken(token), expiresAt);
    }
}

public sealed record AuthTokenResult(string AccessToken, DateTime ExpiresAtUtc);
