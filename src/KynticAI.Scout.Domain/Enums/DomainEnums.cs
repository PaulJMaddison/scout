namespace KynticAI.Scout.Domain.Enums;

public enum DataSourceKind
{
    Crm = 1,
    SqlMetric = 2,
    EventStream = 3,
    ProductUsage = 4
}

public enum DataSourceStatus
{
    Active = 1,
    Disabled = 2
}

public enum SelectorStatus
{
    Draft = 1,
    Published = 2,
    Disabled = 3
}

public enum SelectorMappingKind
{
    DirectFieldMapping = 1,
    WeightedScoring = 2,
    ThresholdClassification = 3,
    StringToEnumMapping = 4,
    FormulaMetric = 5,
    RawField = DirectFieldMapping,
    ComputedMetric = FormulaMetric
}

public enum SelectorExecutionStatus
{
    Pending = 1,
    Running = 2,
    Succeeded = 3,
    Failed = 4
}

public enum SelectorExecutionMode
{
    Live = 1,
    Preview = 2,
    DryRun = 3,
    Scheduled = 4
}

public enum SemanticDataType
{
    Percentage = 1,
    Text = 2,
    Enum = 3,
    EnumSet = 4,
    Number = 5,
    Boolean = 6,
    Json = 7
}

public enum FactValueType
{
    String = 1,
    Number = 2,
    Boolean = 3,
    Json = 4,
    Enum = 5,
    EnumSet = 6
}

public enum AgentRunStatus
{
    Pending = 1,
    Running = 2,
    Completed = 3,
    Failed = 4
}

public enum OperatorRole
{
    TenantAdmin = 1,
    SalesUser = 2,
    PlatformOwner = 3,
    IntegrationAdmin = 4,
    Analyst = 5,
    ReadOnly = 6,
    ApiClient = 7
}

public enum RecomputeJobStatus
{
    Pending = 1,
    Running = 2,
    Completed = 3,
    Failed = 4
}

public enum WorkspaceStatus
{
    Active = 1,
    Archived = 2
}

public enum WorkspaceMemberRole
{
    Owner = 1,
    Admin = 2,
    Member = 3,
    Viewer = 4
}

public enum SubscriptionPlan
{
    Free = 1,
    Pro = 2,
    Business = 4,
    Enterprise = 5
}

public enum SubscriptionStatus
{
    Trialing = 1,
    Active = 2,
    PastDue = 3,
    Paused = 4,
    Cancelled = 5
}

public enum ApiClientStatus
{
    Active = 1,
    Disabled = 2,
    Revoked = 3
}

public enum WebhookSigningSecretStatus
{
    Active = 1,
    Revoked = 2
}

public enum ConnectorInstallationStatus
{
    Draft = 1,
    Active = 2,
    Degraded = 3,
    Disabled = 4
}

public enum ConnectorCatalogueAvailability
{
    OpenCore = 1,
    Enterprise = 2,
    SaaSManaged = 3,
    ComingSoon = 4
}

public enum ContextPackageStatus
{
    Generated = 1,
    Superseded = 2,
    Revoked = 3
}

public enum BillingUsageMetric
{
    ContextSnapshotGenerated = 1,
    ContextPackageGenerated = 2,
    SelectorExecution = 3,
    ApiRequest = 4,
    WebhookDelivery = 5,
    ConnectorSync = 6,
    ContextLookup = 7,
    RecomputeRequested = 8,
    SourceEventIngested = 9,
    BlueprintImported = 10
}

public enum BillingLimitMetric
{
    Tenants = 1,
    Workspaces = 2,
    Users = 3,
    ApiClients = 4,
    Selectors = 5,
    ContextLookups = 6,
    Recomputations = 7,
    SourceEvents = 8,
    BlueprintImports = 9,
    RetentionDays = 10
}

public enum OnboardingStepStatus
{
    NotStarted = 1,
    InProgress = 2,
    Completed = 3,
    Skipped = 4
}

public enum SourceSystemEventStatus
{
    Received = 1,
    Ignored = 2,
    Processed = 3,
    Failed = 4,
    DeadLettered = 5
}

public enum BlueprintImportStatus
{
    Uploaded = 1,
    Validated = 2,
    Rejected = 3,
    Imported = 4
}

public enum GovernancePolicyStatus
{
    Active = 1,
    Disabled = 2
}
