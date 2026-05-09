using ContextLayer.Domain.Enums;

namespace ContextLayer.Application.Contracts;

public sealed record ContextFactResult(
    Guid Id,
    string AttributeKey,
    string ValueJson,
    FactValueType ValueType,
    decimal Confidence,
    DateTime ObservedAtUtc,
    DateTime? FreshUntilUtc,
    Guid SourceSelectorDefinitionId,
    string Explanation,
    string ProvenanceJson);

public sealed record UserProfileResult(
    Guid Id,
    Guid TenantId,
    string ExternalUserId,
    string FullName,
    string Email,
    string CompanyName,
    string JobTitle,
    string Segment,
    DateTime LastSeenAtUtc,
    bool IsEmailMasked);

public sealed record OperationalHighlightResult(
    string Label,
    string Value,
    string Explanation);

public sealed record OperationalTimelineEventResult(
    string Category,
    string Description,
    DateTime OccurredAtUtc);

public sealed record OperationalSourceSummaryResult(
    string ExternalAccountId,
    string AccountName,
    string Domain,
    string Industry,
    string Region,
    string LifecycleStage,
    string ActivePlanName,
    string SubscriptionStatus,
    decimal MonthlyRecurringRevenue,
    int OpenOpportunities,
    int OpenSupportTickets,
    int PricingPageVisits30d,
    int ActiveDays30,
    int EmailReplies30d,
    IReadOnlyList<OperationalHighlightResult> Highlights,
    IReadOnlyList<OperationalTimelineEventResult> RecentTimeline,
    string RawSummaryJson);

public sealed record ContextSnapshotHistoryResult(
    Guid SnapshotId,
    int SnapshotVersion,
    string Summary,
    decimal OverallConfidence,
    DateTime GeneratedAtUtc,
    bool IsStale,
    int FactCount);

public sealed record ContextProfileResult(
    Guid SnapshotId,
    string TenantSlug,
    string ExternalUserId,
    string FullName,
    string CompanyName,
    string Summary,
    decimal OverallConfidence,
    DateTime GeneratedAtUtc,
    bool IsStale,
    OperationalSourceSummaryResult? SourceSummary,
    IReadOnlyList<ContextSnapshotHistoryResult> History,
    IReadOnlyList<ContextFactResult> Facts);

public sealed record GroundedContextFactResult(
    string CitationId,
    Guid FactId,
    string AttributeKey,
    string DisplayName,
    string ValueJson,
    FactValueType ValueType,
    decimal Confidence,
    DateTime ObservedAtUtc,
    DateTime? FreshUntilUtc,
    bool IsFresh,
    bool IsLowConfidence,
    string Explanation,
    string ProvenanceJson);

public sealed record SalesContextPackageResult(
    Guid SnapshotId,
    string TenantSlug,
    string ExternalUserId,
    string FullName,
    string CompanyName,
    string JobTitle,
    string Segment,
    string SalesObjective,
    string Summary,
    decimal OverallConfidence,
    DateTime GeneratedAtUtc,
    bool IsStale,
    bool HumanReviewRecommended,
    IReadOnlyList<string> MissingInformation,
    IReadOnlyList<string> WeakSignalMessages,
    IReadOnlyList<GroundedContextFactResult> Facts,
    string ContextPackageJson);

public sealed record QueueRecomputeResult(
    string CorrelationId,
    Guid TenantId,
    Guid UserProfileId,
    int ExecutionCount);

public sealed record AgentRunResult(
    Guid AgentRunId,
    AgentRunStatus Status,
    string ProviderName,
    string ModelName,
    string SalesObjective,
    decimal Confidence,
    int AttemptCount,
    bool HumanReviewRecommended,
    string ContextPackageJson,
    string OutputJson,
    string ProvenanceJson,
    string ValidationErrorsJson,
    string? FailureReason);

public sealed record SelectorExecutionPreviewResult(
    string Mode,
    bool IsSuccess,
    string SelectorName,
    string RawSourceDataJson,
    string NormalizedSourceDataJson,
    IReadOnlyList<string> ValidationErrors,
    string? ValueJson,
    FactValueType? ValueType,
    decimal? Confidence,
    DateTime? ObservedAtUtc,
    DateTime? FreshUntilUtc,
    string? Explanation,
    string? ProvenanceJson,
    string PipelineTraceJson);

public sealed record SelectorValidationResult(
    bool IsValid,
    IReadOnlyList<string> ValidationErrors,
    string RawSourceDataJson,
    string NormalizedSourceDataJson,
    string PipelineTraceJson);

public sealed record ScheduledRecomputeDispatchResult(
    int QueuedUserCount,
    int SkippedUserCount);
