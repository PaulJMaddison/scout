namespace ContextLayer.Sdk;

public sealed record LoginRequest(string TenantSlug, string Email, string Password);

public sealed record AuthenticatedOperator(
    Guid TenantId,
    string TenantSlug,
    Guid OperatorAccountId,
    string Email,
    string DisplayName,
    string Role);

public sealed record AuthSession(
    string AccessToken,
    DateTime ExpiresAtUtc,
    AuthenticatedOperator Operator);

public sealed record UserContextLookupInput(string TenantSlug, string ExternalUserId);

public sealed record SalesContextPackageInput(string TenantSlug, string ExternalUserId, string SalesObjective);

public sealed record QueueContextRecomputeInput(string TenantSlug, string ExternalUserId, string TriggeredBy);

public sealed record PreviewSelectorInput(
    string TenantSlug,
    string ExternalUserId,
    Guid? SelectorDefinitionId,
    UpsertSelectorDefinitionInput? DraftSelector);

public sealed record ValidateSelectorInput(
    string TenantSlug,
    UpsertSelectorDefinitionInput DraftSelector,
    string? ExternalUserId);

public sealed record UpsertSelectorDefinitionInput(
    Guid? Id,
    string TenantSlug,
    Guid? DataSourceId,
    Guid TargetAttributeDefinitionId,
    string Name,
    string Description,
    string MappingKind,
    string ExpressionJson,
    string ExplanationTemplate,
    string ValidationSchemaJson,
    decimal DefaultConfidence,
    int FreshnessWindowMinutes,
    int Priority,
    int? ScheduleIntervalMinutes);

public sealed record ContextFactResult(
    Guid Id,
    string AttributeKey,
    string ValueJson,
    string ValueType,
    decimal Confidence,
    DateTime ObservedAtUtc,
    DateTime? FreshUntilUtc,
    Guid SourceSelectorDefinitionId,
    string Explanation,
    string ProvenanceJson);

public sealed record OperationalHighlightResult(string Label, string Value, string Explanation);

public sealed record OperationalTimelineEventResult(string Category, string Description, DateTime OccurredAtUtc);

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

public sealed record AccountContextResult(
    string TenantSlug,
    string ExternalAccountId,
    string AccountName,
    string Summary,
    decimal OverallConfidence,
    DateTime GeneratedAtUtc,
    bool IsStale,
    IReadOnlyList<ContextFactResult> Facts,
    IReadOnlyList<ContextSnapshotHistoryResult> History);

public sealed record GroundedContextFactResult(
    string CitationId,
    Guid FactId,
    string AttributeKey,
    string DisplayName,
    string ValueJson,
    string ValueType,
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

public sealed record QueueRecomputeResult(string CorrelationId, Guid TenantId, Guid UserProfileId, int ExecutionCount);

public sealed record SelectorExecutionPreviewResult(
    string Mode,
    bool IsSuccess,
    string SelectorName,
    string RawSourceDataJson,
    string NormalizedSourceDataJson,
    IReadOnlyList<string> ValidationErrors,
    string? ValueJson,
    string? ValueType,
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

public sealed record AuditEvent(
    Guid Id,
    Guid? TenantId,
    string Actor,
    string Action,
    string EntityType,
    string EntityId,
    string CorrelationId,
    string MetadataJson,
    string? BeforeJson,
    string? AfterJson,
    DateTime CreatedAtUtc);

public sealed record ContextSnapshotSummary(
    Guid SnapshotId,
    int SnapshotVersion,
    string Summary,
    decimal OverallConfidence,
    DateTime GeneratedAtUtc,
    bool IsStale,
    int FactCount);
