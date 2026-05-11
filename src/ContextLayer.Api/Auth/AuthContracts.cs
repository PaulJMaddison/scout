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
    Guid? WorkspaceId,
    string? WorkspaceSlug,
    Guid OperatorAccountId,
    string Email,
    string DisplayName,
    string Role);

public sealed record CreateApiClientRequest(
    string TenantSlug,
    string? WorkspaceSlug,
    string DisplayName,
    IReadOnlyList<string> Scopes);

public sealed record ApiClientCreatedResponse(
    Guid Id,
    Guid TenantId,
    Guid? WorkspaceId,
    string ClientId,
    string DisplayName,
    string ApiKey,
    IReadOnlyList<string> Scopes,
    DateTime CreatedAtUtc);

public sealed record RotateApiClientRequest(
    string TenantSlug);

public sealed record ApiClientRotatedResponse(
    Guid Id,
    string ClientId,
    string ApiKey,
    DateTime RotatedAtUtc);

public sealed record ApiClientSummaryResponse(
    Guid Id,
    Guid TenantId,
    Guid? WorkspaceId,
    string ClientId,
    string DisplayName,
    string Status,
    IReadOnlyList<string> Scopes,
    DateTime? LastUsedAtUtc,
    DateTime? RotatedAtUtc,
    DateTime? RevokedAtUtc);
