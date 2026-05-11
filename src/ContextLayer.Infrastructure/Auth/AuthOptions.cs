namespace ContextLayer.Infrastructure.Auth;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    public string Issuer { get; set; } = "ContextLayer";

    public string Audience { get; set; } = "ContextLayer.Console";

    public string SigningKey { get; set; } = "context-layer-development-only-change-before-production";

    public int AccessTokenMinutes { get; set; } = 30;

    public bool RequireSecureSigningKey { get; set; } = true;

    public int MinimumSigningKeyLength { get; set; } = 32;

    public List<MachineClientOptions> MachineClients { get; set; } = [];
}

public sealed class MachineClientOptions
{
    public string ClientId { get; set; } = string.Empty;

    public string ClientSecret { get; set; } = string.Empty;

    public string TenantSlug { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public string Role { get; set; } = RoleNames.TenantAdmin;

    public List<string> Scopes { get; set; } = [];
}
