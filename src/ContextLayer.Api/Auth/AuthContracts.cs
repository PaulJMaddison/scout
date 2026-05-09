namespace ContextLayer.Api.Auth;

public sealed record LoginRequest(
    string TenantSlug,
    string Email,
    string Password);

public sealed record AuthSessionResponse(
    string AccessToken,
    DateTime ExpiresAtUtc,
    AuthenticatedOperatorResponse Operator);

public sealed record AuthenticatedOperatorResponse(
    Guid TenantId,
    string TenantSlug,
    Guid OperatorAccountId,
    string Email,
    string DisplayName,
    string Role);
