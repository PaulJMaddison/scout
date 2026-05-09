namespace ContextLayer.Infrastructure.Auth;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    public string Issuer { get; set; } = "ContextLayer";

    public string Audience { get; set; } = "ContextLayer.Console";

    public string SigningKey { get; set; } = "context-layer-dev-signing-key-change-me";

    public int AccessTokenMinutes { get; set; } = 120;
}
