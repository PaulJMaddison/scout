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

public sealed record SaasWorkspaceSummaryResult(
    Guid Id,
    string Slug,
    string Name,
    string Status,
    bool IsDefault,
    int MemberCount,
    int ConnectorCount,
    int OnboardingCompletedSteps,
    int OnboardingTotalSteps);

public sealed record SaasSubscriptionSummaryResult(
    string Plan,
    string Status,
    string BillingCustomerReference,
    DateTime StartedAtUtc,
    DateTime? TrialEndsAtUtc,
    DateTime? CurrentPeriodEndsAtUtc,
    string EntitlementsJson);

public sealed record SaasApiClientSummaryResult(
    Guid Id,
    Guid? WorkspaceId,
    string ClientId,
    string DisplayName,
    string Status,
    IReadOnlyList<string> Scopes,
    DateTime? LastUsedAtUtc);

public sealed record SaasUsageSummaryResult(
    string Metric,
    long Quantity,
    DateTime WindowStartUtc,
    DateTime WindowEndUtc);

public sealed record SaasArchitectureOverviewResult(
    Guid TenantId,
    string TenantSlug,
    string TenantName,
    string Mode,
    IReadOnlyList<string> EnabledFeatureFlags,
    SaasSubscriptionSummaryResult? Subscription,
    IReadOnlyList<SaasWorkspaceSummaryResult> Workspaces,
    IReadOnlyList<SaasApiClientSummaryResult> ApiClients,
    IReadOnlyList<SaasUsageSummaryResult> Usage);

public sealed record OrganisationSettingsResult(
    Guid TenantId,
    string TenantSlug,
    string TenantName,
    bool IsActive,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    string? Plan,
    string? SubscriptionStatus,
    int WorkspaceCount,
    int UserCount,
    int ApiClientCount);

public sealed record OperatorWorkspaceMembershipResult(
    Guid WorkspaceId,
    string WorkspaceSlug,
    string WorkspaceName,
    string Role,
    DateTime? AcceptedAtUtc);

public sealed record OperatorAccountSummaryResult(
    Guid Id,
    Guid TenantId,
    string Email,
    string DisplayName,
    string Role,
    bool IsActive,
    DateTime? LastLoginAtUtc,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    IReadOnlyList<OperatorWorkspaceMembershipResult> Workspaces);

public sealed record UpdateOperatorAccountInput(
    string TenantSlug,
    Guid OperatorAccountId,
    string DisplayName,
    string Role,
    bool IsActive);

public sealed record BlueprintImportHistoryResult(
    Guid Id,
    Guid TenantId,
    Guid? WorkspaceId,
    string? WorkspaceSlug,
    string Name,
    string Status,
    string UploadedBy,
    int ValidationIssueCount,
    int PreviewChangeCount,
    string ImportSummaryJson,
    DateTime UploadedAtUtc,
    DateTime? ValidatedAtUtc,
    DateTime? ImportedAtUtc);

public sealed record GovernancePolicyResult(
    Guid Id,
    Guid TenantId,
    Guid? BlueprintImportId,
    string PolicyType,
    string Key,
    string DisplayName,
    string Description,
    string Status,
    string DefinitionJson,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);

public sealed record AuditEventExportResult(
    string FileName,
    string ContentType,
    string Content);
