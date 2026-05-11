using ContextLayer.Domain.Common;
using ContextLayer.Domain.Enums;
using ContextLayer.Domain.Saas;

namespace ContextLayer.Domain.Entities;

public sealed class Tenant : Entity
{
    private Tenant()
    {
    }

    public string Slug { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public bool IsActive { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public DateTime UpdatedAtUtc { get; private set; }

    public ICollection<UserProfile> UserProfiles { get; } = new List<UserProfile>();

    public ICollection<OperatorAccount> OperatorAccounts { get; } = new List<OperatorAccount>();

    public ICollection<DataSource> DataSources { get; } = new List<DataSource>();

    public ICollection<SemanticAttributeDefinition> SemanticAttributes { get; } = new List<SemanticAttributeDefinition>();

    public ICollection<SelectorDefinition> SelectorDefinitions { get; } = new List<SelectorDefinition>();

    public ICollection<PromptTemplate> PromptTemplates { get; } = new List<PromptTemplate>();

    public ICollection<Workspace> Workspaces { get; } = new List<Workspace>();

    public ICollection<TenantSubscription> Subscriptions { get; } = new List<TenantSubscription>();

    public ICollection<ApiClient> ApiClients { get; } = new List<ApiClient>();

    public ICollection<BillingUsageRecord> BillingUsageRecords { get; } = new List<BillingUsageRecord>();

    public static Tenant Create(string slug, string name, DateTime utcNow)
    {
        return new Tenant
        {
            Slug = slug.Trim().ToLowerInvariant(),
            Name = name.Trim(),
            IsActive = true,
            CreatedAtUtc = utcNow,
            UpdatedAtUtc = utcNow
        };
    }

    public void Rename(string name, DateTime utcNow)
    {
        Name = name.Trim();
        UpdatedAtUtc = utcNow;
    }
}

public sealed class UserProfile : AuditedTenantEntity
{
    private UserProfile()
    {
    }

    public string ExternalUserId { get; private set; } = string.Empty;

    public string FullName { get; private set; } = string.Empty;

    public string Email { get; private set; } = string.Empty;

    public string CompanyName { get; private set; } = string.Empty;

    public string JobTitle { get; private set; } = string.Empty;

    public string Segment { get; private set; } = string.Empty;

    public DateTime LastSeenAtUtc { get; private set; }

    public Tenant Tenant { get; private set; } = null!;

    public ICollection<UserSignal> Signals { get; } = new List<UserSignal>();

    public ICollection<ContextSnapshot> ContextSnapshots { get; } = new List<ContextSnapshot>();

    public static UserProfile Create(
        Guid tenantId,
        string externalUserId,
        string fullName,
        string email,
        string companyName,
        string jobTitle,
        string segment,
        DateTime lastSeenAtUtc,
        DateTime utcNow)
    {
        var profile = new UserProfile
        {
            TenantId = tenantId,
            ExternalUserId = externalUserId.Trim(),
            FullName = fullName.Trim(),
            Email = email.Trim(),
            CompanyName = companyName.Trim(),
            JobTitle = jobTitle.Trim(),
            Segment = segment.Trim(),
            LastSeenAtUtc = lastSeenAtUtc
        };

        profile.SetAuditTimestamps(utcNow);
        return profile;
    }

    public void Touch(DateTime lastSeenAtUtc, DateTime utcNow)
    {
        LastSeenAtUtc = lastSeenAtUtc;
        SetAuditTimestamps(utcNow);
    }
}

public sealed class OperatorAccount : AuditedTenantEntity
{
    private OperatorAccount()
    {
    }

    public string Email { get; private set; } = string.Empty;

    public string DisplayName { get; private set; } = string.Empty;

    public string PasswordHash { get; private set; } = string.Empty;

    public OperatorRole Role { get; private set; }

    public bool IsActive { get; private set; }

    public DateTime? LastLoginAtUtc { get; private set; }

    public Tenant Tenant { get; private set; } = null!;

    public ICollection<WorkspaceMember> WorkspaceMemberships { get; } = new List<WorkspaceMember>();

    public static OperatorAccount Create(
        Guid tenantId,
        string email,
        string displayName,
        string passwordHash,
        OperatorRole role,
        DateTime utcNow)
    {
        var account = new OperatorAccount
        {
            TenantId = tenantId,
            Email = email.Trim().ToLowerInvariant(),
            DisplayName = displayName.Trim(),
            PasswordHash = passwordHash.Trim(),
            Role = role,
            IsActive = true
        };

        account.SetAuditTimestamps(utcNow);
        return account;
    }

    public void UpdateProfile(string displayName, OperatorRole role, DateTime utcNow)
    {
        DisplayName = displayName.Trim();
        Role = role;
        SetAuditTimestamps(utcNow);
    }

    public void UpdatePasswordHash(string passwordHash, DateTime utcNow)
    {
        PasswordHash = passwordHash.Trim();
        SetAuditTimestamps(utcNow);
    }

    public void MarkLogin(DateTime utcNow)
    {
        LastLoginAtUtc = utcNow;
        SetAuditTimestamps(utcNow);
    }

    public void SetActive(bool isActive, DateTime utcNow)
    {
        IsActive = isActive;
        SetAuditTimestamps(utcNow);
    }
}

public sealed class DataSource : AuditedTenantEntity
{
    private DataSource()
    {
    }

    public string Name { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;

    public DataSourceKind Kind { get; private set; }

    public DataSourceStatus Status { get; private set; }

    public string ConnectionConfigJson { get; private set; } = "{}";

    public DateTime? LastSuccessfulSyncAtUtc { get; private set; }

    public Tenant Tenant { get; private set; } = null!;

    public ICollection<SelectorDefinition> SelectorDefinitions { get; } = new List<SelectorDefinition>();

    public ICollection<ConnectorInstallation> ConnectorInstallations { get; } = new List<ConnectorInstallation>();

    public static DataSource Create(
        Guid tenantId,
        string name,
        string description,
        DataSourceKind kind,
        string connectionConfigJson,
        DateTime utcNow)
    {
        var dataSource = new DataSource
        {
            TenantId = tenantId,
            Name = name.Trim(),
            Description = description.Trim(),
            Kind = kind,
            Status = DataSourceStatus.Active,
            ConnectionConfigJson = string.IsNullOrWhiteSpace(connectionConfigJson) ? "{}" : connectionConfigJson.Trim()
        };

        dataSource.SetAuditTimestamps(utcNow);
        return dataSource;
    }

    public void Update(string name, string description, DataSourceKind kind, string connectionConfigJson, DateTime utcNow)
    {
        Name = name.Trim();
        Description = description.Trim();
        Kind = kind;
        ConnectionConfigJson = string.IsNullOrWhiteSpace(connectionConfigJson) ? "{}" : connectionConfigJson.Trim();
        SetAuditTimestamps(utcNow);
    }

    public void MarkSynced(DateTime utcNow)
    {
        LastSuccessfulSyncAtUtc = utcNow;
        SetAuditTimestamps(utcNow);
    }
}

public sealed class SemanticAttributeDefinition : AuditedTenantEntity
{
    private SemanticAttributeDefinition()
    {
    }

    public string Key { get; private set; } = string.Empty;

    public string DisplayName { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;

    public SemanticDataType DataType { get; private set; }

    public string ExampleValueJson { get; private set; } = "{}";

    public bool IsSystem { get; private set; }

    public Tenant Tenant { get; private set; } = null!;

    public ICollection<SelectorDefinition> SelectorDefinitions { get; } = new List<SelectorDefinition>();

    public static SemanticAttributeDefinition Create(
        Guid tenantId,
        string key,
        string displayName,
        string description,
        SemanticDataType dataType,
        string exampleValueJson,
        bool isSystem,
        DateTime utcNow)
    {
        var definition = new SemanticAttributeDefinition
        {
            TenantId = tenantId,
            Key = key.Trim(),
            DisplayName = displayName.Trim(),
            Description = description.Trim(),
            DataType = dataType,
            ExampleValueJson = string.IsNullOrWhiteSpace(exampleValueJson) ? "{}" : exampleValueJson.Trim(),
            IsSystem = isSystem
        };

        definition.SetAuditTimestamps(utcNow);
        return definition;
    }

    public void Update(string displayName, string description, SemanticDataType dataType, string exampleValueJson, DateTime utcNow)
    {
        DisplayName = displayName.Trim();
        Description = description.Trim();
        DataType = dataType;
        ExampleValueJson = string.IsNullOrWhiteSpace(exampleValueJson) ? "{}" : exampleValueJson.Trim();
        SetAuditTimestamps(utcNow);
    }
}

public sealed class SelectorDefinition : AuditedTenantEntity
{
    private SelectorDefinition()
    {
    }

    public Guid? DataSourceId { get; private set; }

    public Guid TargetAttributeDefinitionId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;

    public SelectorMappingKind MappingKind { get; private set; }

    public SelectorStatus Status { get; private set; }

    public int Version { get; private set; }

    public string ExpressionJson { get; private set; } = "{}";

    public string ExplanationTemplate { get; private set; } = string.Empty;

    public string ValidationSchemaJson { get; private set; } = "{}";

    public decimal DefaultConfidence { get; private set; }

    public int FreshnessWindowMinutes { get; private set; }

    public int Priority { get; private set; }

    public int? ScheduleIntervalMinutes { get; private set; }

    public DateTime? PublishedAtUtc { get; private set; }

    public Tenant Tenant { get; private set; } = null!;

    public DataSource? DataSource { get; private set; }

    public SemanticAttributeDefinition TargetAttributeDefinition { get; private set; } = null!;

    public ICollection<SelectorExecution> Executions { get; } = new List<SelectorExecution>();

    public static SelectorDefinition Create(
        Guid tenantId,
        Guid? dataSourceId,
        Guid targetAttributeDefinitionId,
        string name,
        string description,
        SelectorMappingKind mappingKind,
        string expressionJson,
        string explanationTemplate,
        string validationSchemaJson,
        decimal defaultConfidence,
        int freshnessWindowMinutes,
        int priority,
        int? scheduleIntervalMinutes,
        DateTime utcNow)
    {
        var selector = new SelectorDefinition
        {
            TenantId = tenantId,
            DataSourceId = dataSourceId,
            TargetAttributeDefinitionId = targetAttributeDefinitionId,
            Name = name.Trim(),
            Description = description.Trim(),
            MappingKind = mappingKind,
            Status = SelectorStatus.Draft,
            Version = 1,
            ExpressionJson = expressionJson.Trim(),
            ExplanationTemplate = explanationTemplate.Trim(),
            ValidationSchemaJson = string.IsNullOrWhiteSpace(validationSchemaJson) ? "{}" : validationSchemaJson.Trim(),
            DefaultConfidence = defaultConfidence,
            FreshnessWindowMinutes = freshnessWindowMinutes,
            Priority = priority,
            ScheduleIntervalMinutes = scheduleIntervalMinutes
        };

        selector.SetAuditTimestamps(utcNow);
        return selector;
    }

    public void Update(
        Guid? dataSourceId,
        Guid targetAttributeDefinitionId,
        string name,
        string description,
        SelectorMappingKind mappingKind,
        string expressionJson,
        string explanationTemplate,
        string validationSchemaJson,
        decimal defaultConfidence,
        int freshnessWindowMinutes,
        int priority,
        int? scheduleIntervalMinutes,
        DateTime utcNow)
    {
        DataSourceId = dataSourceId;
        TargetAttributeDefinitionId = targetAttributeDefinitionId;
        Name = name.Trim();
        Description = description.Trim();
        MappingKind = mappingKind;
        ExpressionJson = expressionJson.Trim();
        ExplanationTemplate = explanationTemplate.Trim();
        ValidationSchemaJson = string.IsNullOrWhiteSpace(validationSchemaJson) ? "{}" : validationSchemaJson.Trim();
        DefaultConfidence = defaultConfidence;
        FreshnessWindowMinutes = freshnessWindowMinutes;
        Priority = priority;
        ScheduleIntervalMinutes = scheduleIntervalMinutes;
        Version++;
        Status = SelectorStatus.Draft;
        PublishedAtUtc = null;
        SetAuditTimestamps(utcNow);
    }

    public void Publish(DateTime utcNow)
    {
        Status = SelectorStatus.Published;
        PublishedAtUtc = utcNow;
        SetAuditTimestamps(utcNow);
    }
}

public sealed class SelectorExecution : AuditedTenantEntity
{
    private SelectorExecution()
    {
    }

    public Guid SelectorDefinitionId { get; private set; }

    public Guid UserProfileId { get; private set; }

    public string CorrelationId { get; private set; } = string.Empty;

    public SelectorExecutionStatus Status { get; private set; }

    public SelectorExecutionMode ExecutionMode { get; private set; }

    public string TriggeredBy { get; private set; } = string.Empty;

    public DateTime RequestedAtUtc { get; private set; }

    public DateTime? StartedAtUtc { get; private set; }

    public DateTime? CompletedAtUtc { get; private set; }

    public string? ErrorMessage { get; private set; }

    public string ResultValueJson { get; private set; } = "{}";

    public FactValueType ResultValueType { get; private set; }

    public decimal ResultConfidence { get; private set; }

    public DateTime? ResultObservedAtUtc { get; private set; }

    public string ResultExplanation { get; private set; } = string.Empty;

    public string ResultProvenanceJson { get; private set; } = "[]";

    public string RawSourceDataJson { get; private set; } = "{}";

    public string ValidationErrorsJson { get; private set; } = "[]";

    public string PipelineTraceJson { get; private set; } = "{}";

    public SelectorDefinition SelectorDefinition { get; private set; } = null!;

    public UserProfile UserProfile { get; private set; } = null!;

    public static SelectorExecution Create(
        Guid tenantId,
        Guid selectorDefinitionId,
        Guid userProfileId,
        string correlationId,
        string triggeredBy,
        SelectorExecutionMode executionMode,
        DateTime utcNow)
    {
        var execution = new SelectorExecution
        {
            TenantId = tenantId,
            SelectorDefinitionId = selectorDefinitionId,
            UserProfileId = userProfileId,
            CorrelationId = correlationId,
            TriggeredBy = triggeredBy.Trim(),
            ExecutionMode = executionMode,
            RequestedAtUtc = utcNow,
            Status = SelectorExecutionStatus.Pending
        };

        execution.SetAuditTimestamps(utcNow);
        return execution;
    }

    public void MarkRunning(DateTime utcNow)
    {
        Status = SelectorExecutionStatus.Running;
        StartedAtUtc = utcNow;
        SetAuditTimestamps(utcNow);
    }

    public void MarkSucceeded(
        string resultValueJson,
        FactValueType resultValueType,
        decimal resultConfidence,
        DateTime observedAtUtc,
        string explanation,
        string provenanceJson,
        string rawSourceDataJson,
        string validationErrorsJson,
        string pipelineTraceJson,
        DateTime utcNow)
    {
        Status = SelectorExecutionStatus.Succeeded;
        CompletedAtUtc = utcNow;
        ResultValueJson = resultValueJson;
        ResultValueType = resultValueType;
        ResultConfidence = resultConfidence;
        ResultObservedAtUtc = observedAtUtc;
        ResultExplanation = explanation;
        ResultProvenanceJson = provenanceJson;
        RawSourceDataJson = rawSourceDataJson;
        ValidationErrorsJson = validationErrorsJson;
        PipelineTraceJson = pipelineTraceJson;
        ErrorMessage = null;
        SetAuditTimestamps(utcNow);
    }

    public void MarkFailed(
        string errorMessage,
        string rawSourceDataJson,
        string validationErrorsJson,
        string pipelineTraceJson,
        DateTime utcNow)
    {
        Status = SelectorExecutionStatus.Failed;
        CompletedAtUtc = utcNow;
        ErrorMessage = errorMessage;
        RawSourceDataJson = rawSourceDataJson;
        ValidationErrorsJson = validationErrorsJson;
        PipelineTraceJson = pipelineTraceJson;
        SetAuditTimestamps(utcNow);
    }
}

public sealed class ContextSnapshot : AuditedTenantEntity
{
    private ContextSnapshot()
    {
    }

    public Guid UserProfileId { get; private set; }

    public int SnapshotVersion { get; private set; }

    public string Summary { get; private set; } = string.Empty;

    public decimal OverallConfidence { get; private set; }

    public bool IsStale { get; private set; }

    public DateTime GeneratedAtUtc { get; private set; }

    public UserProfile UserProfile { get; private set; } = null!;

    public ICollection<ContextFact> Facts { get; } = new List<ContextFact>();

    public ICollection<AgentRun> AgentRuns { get; } = new List<AgentRun>();

    public ICollection<ContextPackage> ContextPackages { get; } = new List<ContextPackage>();

    public static ContextSnapshot Create(
        Guid tenantId,
        Guid userProfileId,
        int snapshotVersion,
        string summary,
        decimal overallConfidence,
        DateTime generatedAtUtc)
    {
        var snapshot = new ContextSnapshot
        {
            TenantId = tenantId,
            UserProfileId = userProfileId,
            SnapshotVersion = snapshotVersion,
            Summary = summary.Trim(),
            OverallConfidence = overallConfidence,
            GeneratedAtUtc = generatedAtUtc,
            IsStale = false
        };

        snapshot.SetAuditTimestamps(generatedAtUtc);
        return snapshot;
    }

    public void MarkStale(DateTime utcNow)
    {
        IsStale = true;
        SetAuditTimestamps(utcNow);
    }
}

public sealed class ContextFact : AuditedTenantEntity
{
    private ContextFact()
    {
    }

    public Guid ContextSnapshotId { get; private set; }

    public Guid SemanticAttributeDefinitionId { get; private set; }

    public Guid SourceSelectorDefinitionId { get; private set; }

    public string AttributeKey { get; private set; } = string.Empty;

    public string ValueJson { get; private set; } = "{}";

    public FactValueType ValueType { get; private set; }

    public decimal Confidence { get; private set; }

    public DateTime ObservedAtUtc { get; private set; }

    public string Explanation { get; private set; } = string.Empty;

    public string ProvenanceJson { get; private set; } = "[]";

    public DateTime? FreshUntilUtc { get; private set; }

    public ContextSnapshot ContextSnapshot { get; private set; } = null!;

    public SemanticAttributeDefinition SemanticAttributeDefinition { get; private set; } = null!;

    public SelectorDefinition SourceSelectorDefinition { get; private set; } = null!;

    public static ContextFact Create(
        Guid tenantId,
        Guid contextSnapshotId,
        Guid semanticAttributeDefinitionId,
        Guid sourceSelectorDefinitionId,
        string attributeKey,
        string valueJson,
        FactValueType valueType,
        decimal confidence,
        DateTime observedAtUtc,
        DateTime? freshUntilUtc,
        string explanation,
        string provenanceJson,
        DateTime utcNow)
    {
        var fact = new ContextFact
        {
            TenantId = tenantId,
            ContextSnapshotId = contextSnapshotId,
            SemanticAttributeDefinitionId = semanticAttributeDefinitionId,
            SourceSelectorDefinitionId = sourceSelectorDefinitionId,
            AttributeKey = attributeKey.Trim(),
            ValueJson = valueJson,
            ValueType = valueType,
            Confidence = confidence,
            ObservedAtUtc = observedAtUtc,
            FreshUntilUtc = freshUntilUtc,
            Explanation = explanation.Trim(),
            ProvenanceJson = provenanceJson
        };

        fact.SetAuditTimestamps(utcNow);
        return fact;
    }
}

public sealed class PromptTemplate : AuditedTenantEntity
{
    private PromptTemplate()
    {
    }

    public string Name { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;

    public int Version { get; private set; }

    public string SystemPrompt { get; private set; } = string.Empty;

    public string DeveloperPrompt { get; private set; } = string.Empty;

    public string UserPromptTemplate { get; private set; } = string.Empty;

    public string OutputSchemaJson { get; private set; } = "{}";

    public string GuardrailsJson { get; private set; } = "[]";

    public bool IsActive { get; private set; }

    public Tenant Tenant { get; private set; } = null!;

    public ICollection<AgentRun> AgentRuns { get; } = new List<AgentRun>();

    public static PromptTemplate Create(
        Guid tenantId,
        string name,
        string description,
        string systemPrompt,
        string developerPrompt,
        string userPromptTemplate,
        string outputSchemaJson,
        string guardrailsJson,
        DateTime utcNow)
    {
        var template = new PromptTemplate
        {
            TenantId = tenantId,
            Name = name.Trim(),
            Description = description.Trim(),
            Version = 1,
            SystemPrompt = systemPrompt.Trim(),
            DeveloperPrompt = developerPrompt.Trim(),
            UserPromptTemplate = userPromptTemplate.Trim(),
            OutputSchemaJson = outputSchemaJson.Trim(),
            GuardrailsJson = guardrailsJson.Trim(),
            IsActive = true
        };

        template.SetAuditTimestamps(utcNow);
        return template;
    }

    public void Update(
        string name,
        string description,
        string systemPrompt,
        string developerPrompt,
        string userPromptTemplate,
        string outputSchemaJson,
        string guardrailsJson,
        DateTime utcNow)
    {
        Name = name.Trim();
        Description = description.Trim();
        Version++;
        SystemPrompt = systemPrompt.Trim();
        DeveloperPrompt = developerPrompt.Trim();
        UserPromptTemplate = userPromptTemplate.Trim();
        OutputSchemaJson = outputSchemaJson.Trim();
        GuardrailsJson = guardrailsJson.Trim();
        SetAuditTimestamps(utcNow);
    }
}

public sealed class AgentRun : AuditedTenantEntity
{
    private AgentRun()
    {
    }

    public Guid UserProfileId { get; private set; }

    public Guid PromptTemplateId { get; private set; }

    public Guid ContextSnapshotId { get; private set; }

    public AgentRunStatus Status { get; private set; }

    public string ProviderName { get; private set; } = string.Empty;

    public string ModelName { get; private set; } = string.Empty;

    public string SalesObjective { get; private set; } = string.Empty;

    public int AttemptCount { get; private set; }

    public string InputJson { get; private set; } = "{}";

    public string OutputJson { get; private set; } = "{}";

    public string ProvenanceJson { get; private set; } = "[]";

    public decimal Confidence { get; private set; }

    public DateTime RequestedAtUtc { get; private set; }

    public DateTime? CompletedAtUtc { get; private set; }

    public string? FailureReason { get; private set; }

    public UserProfile UserProfile { get; private set; } = null!;

    public PromptTemplate PromptTemplate { get; private set; } = null!;

    public ContextSnapshot ContextSnapshot { get; private set; } = null!;

    public static AgentRun Create(
        Guid tenantId,
        Guid userProfileId,
        Guid promptTemplateId,
        Guid contextSnapshotId,
        string providerName,
        string modelName,
        string salesObjective,
        string inputJson,
        DateTime utcNow)
    {
        var run = new AgentRun
        {
            TenantId = tenantId,
            UserProfileId = userProfileId,
            PromptTemplateId = promptTemplateId,
            ContextSnapshotId = contextSnapshotId,
            Status = AgentRunStatus.Pending,
            ProviderName = providerName.Trim(),
            ModelName = modelName.Trim(),
            SalesObjective = salesObjective.Trim(),
            AttemptCount = 0,
            InputJson = inputJson.Trim(),
            RequestedAtUtc = utcNow
        };

        run.SetAuditTimestamps(utcNow);
        return run;
    }

    public void MarkRunning(int attemptCount, DateTime utcNow)
    {
        Status = AgentRunStatus.Running;
        AttemptCount = attemptCount;
        SetAuditTimestamps(utcNow);
    }

    public void MarkCompleted(string outputJson, string provenanceJson, decimal confidence, int attemptCount, DateTime utcNow)
    {
        Status = AgentRunStatus.Completed;
        AttemptCount = attemptCount;
        OutputJson = outputJson.Trim();
        ProvenanceJson = provenanceJson.Trim();
        Confidence = confidence;
        CompletedAtUtc = utcNow;
        FailureReason = null;
        SetAuditTimestamps(utcNow);
    }

    public void MarkFailed(string failureReason, int attemptCount, DateTime utcNow)
    {
        Status = AgentRunStatus.Failed;
        AttemptCount = attemptCount;
        FailureReason = failureReason.Trim();
        CompletedAtUtc = utcNow;
        SetAuditTimestamps(utcNow);
    }
}

public sealed class AuditEvent : Entity
{
    private AuditEvent()
    {
    }

    public Guid? TenantId { get; private set; }

    public string Actor { get; private set; } = string.Empty;

    public string Action { get; private set; } = string.Empty;

    public string EntityType { get; private set; } = string.Empty;

    public string EntityId { get; private set; } = string.Empty;

    public string CorrelationId { get; private set; } = string.Empty;

    public string MetadataJson { get; private set; } = "{}";

    public string? BeforeJson { get; private set; }

    public string? AfterJson { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public static AuditEvent Create(
        Guid? tenantId,
        string actor,
        string action,
        string entityType,
        string entityId,
        string correlationId,
        string metadataJson,
        string? beforeJson,
        string? afterJson,
        DateTime utcNow)
    {
        return new AuditEvent
        {
            TenantId = tenantId,
            Actor = actor.Trim(),
            Action = action.Trim(),
            EntityType = entityType.Trim(),
            EntityId = entityId.Trim(),
            CorrelationId = correlationId.Trim(),
            MetadataJson = metadataJson.Trim(),
            BeforeJson = beforeJson,
            AfterJson = afterJson,
            CreatedAtUtc = utcNow
        };
    }
}

public sealed class UserSignal : AuditedTenantEntity
{
    private UserSignal()
    {
    }

    public Guid UserProfileId { get; private set; }

    public Guid? DataSourceId { get; private set; }

    public string Key { get; private set; } = string.Empty;

    public string ValueJson { get; private set; } = "{}";

    public FactValueType ValueType { get; private set; }

    public DateTime ObservedAtUtc { get; private set; }

    public string ProvenanceJson { get; private set; } = "[]";

    public UserProfile UserProfile { get; private set; } = null!;

    public DataSource? DataSource { get; private set; }

    public static UserSignal Create(
        Guid tenantId,
        Guid userProfileId,
        Guid? dataSourceId,
        string key,
        string valueJson,
        FactValueType valueType,
        DateTime observedAtUtc,
        string provenanceJson,
        DateTime utcNow)
    {
        var signal = new UserSignal
        {
            TenantId = tenantId,
            UserProfileId = userProfileId,
            DataSourceId = dataSourceId,
            Key = key.Trim(),
            ValueJson = valueJson.Trim(),
            ValueType = valueType,
            ObservedAtUtc = observedAtUtc,
            ProvenanceJson = provenanceJson.Trim()
        };

        signal.SetAuditTimestamps(utcNow);
        return signal;
    }
}
