using KynticAI.Scout.Application.Contracts;

namespace KynticAI.Scout.Api.Rest;

public sealed record V1ErrorBody(
    string Code,
    string Message,
    string CorrelationId,
    IReadOnlyDictionary<string, string[]>? Details = null);

public sealed record V1ErrorResponse(V1ErrorBody Error);

public sealed record V1PagedResponse<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalCount,
    bool HasMore);

public sealed record V1RecomputeRequest(
    string ExternalUserId,
    string? TriggeredBy);

public sealed record V1AiSafeContextPackageRequest(
    string Objective);

public sealed record V1SelectorPreviewRequest(
    string ExternalUserId,
    Guid? SelectorDefinitionId,
    UpsertSelectorDefinitionInput? DraftSelector);

public sealed record V1SelectorValidateRequest(
    UpsertSelectorDefinitionInput DraftSelector,
    string? ExternalUserId);

public sealed record V1SourceSystemEventRequest(
    string? EventId,
    string? WorkspaceSlug,
    string SourceSystem,
    string EventType,
    object? Payload,
    string? PayloadJson,
    string? ExternalUserId,
    string? ExternalAccountId,
    DateTime? ObservedAtUtc);

public sealed record V1CreateApiClientRequest(
    string DisplayName,
    string? WorkspaceSlug,
    IReadOnlyList<string> Scopes);

public sealed record V1CreateWebhookSigningSecretRequest(
    string DisplayName,
    string? WorkspaceSlug);

public sealed record V1UpdateOperatorAccountRequest(
    string? TenantSlug,
    string DisplayName,
    string Role,
    bool IsActive);
