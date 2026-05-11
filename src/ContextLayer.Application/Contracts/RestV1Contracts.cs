using ContextLayer.Domain.Enums;

namespace ContextLayer.Application.Contracts;

public sealed record WorkspaceSummaryResult(
    Guid Id,
    string Slug,
    string Name,
    string Description,
    string Status,
    bool IsDefault);

public sealed record ContextSnapshotResult(
    Guid SnapshotId,
    Guid TenantId,
    string TenantSlug,
    Guid UserProfileId,
    string ExternalUserId,
    string FullName,
    string CompanyName,
    int SnapshotVersion,
    string Summary,
    decimal OverallConfidence,
    DateTime GeneratedAtUtc,
    bool IsStale,
    IReadOnlyList<ContextFactResult> Facts);

public sealed record AccountContextUserResult(
    string ExternalUserId,
    string FullName,
    string Email,
    string JobTitle,
    Guid? LatestSnapshotId,
    string? Summary,
    decimal? OverallConfidence,
    DateTime? GeneratedAtUtc,
    bool IsStale);

public sealed record AccountContextResult(
    string TenantSlug,
    string ExternalAccountId,
    string AccountName,
    string Domain,
    string Industry,
    string Segment,
    string Region,
    string LifecycleStage,
    IReadOnlyList<AccountContextUserResult> Users);

public sealed record SourceSystemEventInput(
    string TenantSlug,
    string? WorkspaceSlug,
    string EventId,
    string SourceSystem,
    string EventType,
    string PayloadJson,
    string? ExternalUserId,
    string? ExternalAccountId,
    DateTime? ObservedAtUtc);

public sealed record SourceSystemEventAcceptedResult(
    string EventId,
    Guid TenantId,
    string TenantSlug,
    Guid? WorkspaceId,
    Guid? UserProfileId,
    int StoredSignalCount,
    int MatchedSelectorCount,
    string Status,
    bool IsDuplicate,
    DateTime AcceptedAtUtc);

public sealed record SourceSystemEventHistoryResult(
    Guid Id,
    Guid TenantId,
    Guid? WorkspaceId,
    string EventId,
    string SourceSystem,
    string EventType,
    string Status,
    string? ExternalUserId,
    string? ExternalAccountId,
    Guid? UserProfileId,
    Guid? DataSourceId,
    int MatchedSelectorCount,
    string ProcessingSummary,
    string? ErrorMessage,
    string? DeadLetterReason,
    string CorrelationId,
    DateTime ReceivedAtUtc,
    DateTime ObservedAtUtc,
    DateTime? ProcessedAtUtc,
    DateTime? DeadLetteredAtUtc,
    string PayloadJson);
