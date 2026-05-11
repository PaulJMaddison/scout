namespace ContextLayer.Api.Auth;

public sealed record MachineTokenRequest(
    string GrantType,
    string ClientId,
    string ClientSecret,
    string? Scope);

public sealed record MachineTokenResponse(
    string AccessToken,
    string TokenType,
    int ExpiresIn,
    string Scope);
