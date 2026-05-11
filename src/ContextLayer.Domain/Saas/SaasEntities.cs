using ContextLayer.Domain.Common;
using ContextLayer.Domain.Entities;
using ContextLayer.Domain.Enums;

namespace ContextLayer.Domain.Saas;

public sealed class Workspace : AuditedTenantEntity
{
    private Workspace()
    {
    }

    public string Slug { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;

    public WorkspaceStatus Status { get; private set; }

    public bool IsDefault { get; private set; }

    public Tenant Tenant { get; private set; } = null!;

    public ICollection<WorkspaceMember> Members { get; } = new List<WorkspaceMember>();

    public static Workspace Create(
        Guid tenantId,
        string slug,
        string name,
        string description,
        bool isDefault,
        DateTime utcNow)
    {
        var workspace = new Workspace
        {
            TenantId = tenantId,
            Slug = slug.Trim().ToLowerInvariant(),
            Name = name.Trim(),
            Description = description.Trim(),
            IsDefault = isDefault,
            Status = WorkspaceStatus.Active
        };

        workspace.SetAuditTimestamps(utcNow);
        return workspace;
    }
}

public sealed class WorkspaceMember : AuditedTenantEntity
{
    private WorkspaceMember()
    {
    }

    public Guid WorkspaceId { get; private set; }

    public Guid OperatorAccountId { get; private set; }

    public WorkspaceMemberRole Role { get; private set; }

    public DateTime? InvitedAtUtc { get; private set; }

    public DateTime? AcceptedAtUtc { get; private set; }

    public Workspace Workspace { get; private set; } = null!;

    public OperatorAccount OperatorAccount { get; private set; } = null!;

    public static WorkspaceMember Create(
        Guid tenantId,
        Guid workspaceId,
        Guid operatorAccountId,
        WorkspaceMemberRole role,
        DateTime utcNow)
    {
        var member = new WorkspaceMember
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            OperatorAccountId = operatorAccountId,
            Role = role,
            InvitedAtUtc = utcNow,
            AcceptedAtUtc = utcNow
        };

        member.SetAuditTimestamps(utcNow);
        return member;
    }
}

public sealed class TenantSubscription : AuditedTenantEntity
{
    private TenantSubscription()
    {
    }

    public SubscriptionPlan Plan { get; private set; }

    public SubscriptionStatus Status { get; private set; }

    public string BillingCustomerReference { get; private set; } = string.Empty;

    public string EntitlementsJson { get; private set; } = "{}";

    public DateTime StartedAtUtc { get; private set; }

    public DateTime? TrialEndsAtUtc { get; private set; }

    public DateTime? CurrentPeriodEndsAtUtc { get; private set; }

    public Tenant Tenant { get; private set; } = null!;

    public static TenantSubscription Create(
        Guid tenantId,
        SubscriptionPlan plan,
        SubscriptionStatus status,
        string billingCustomerReference,
        string entitlementsJson,
        DateTime startedAtUtc,
        DateTime? trialEndsAtUtc,
        DateTime? currentPeriodEndsAtUtc,
        DateTime utcNow)
    {
        var subscription = new TenantSubscription
        {
            TenantId = tenantId,
            Plan = plan,
            Status = status,
            BillingCustomerReference = billingCustomerReference.Trim(),
            EntitlementsJson = string.IsNullOrWhiteSpace(entitlementsJson) ? "{}" : entitlementsJson.Trim(),
            StartedAtUtc = startedAtUtc,
            TrialEndsAtUtc = trialEndsAtUtc,
            CurrentPeriodEndsAtUtc = currentPeriodEndsAtUtc
        };

        subscription.SetAuditTimestamps(utcNow);
        return subscription;
    }
}

public sealed class BillingPlan : AuditedEntity
{
    private BillingPlan()
    {
    }

    public SubscriptionPlan Plan { get; private set; }

    public string DisplayName { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;

    public bool IsPublic { get; private set; }

    public int SortOrder { get; private set; }

    public string BillingProviderPlanReference { get; private set; } = string.Empty;

    public ICollection<BillingPlanLimit> Limits { get; } = new List<BillingPlanLimit>();

    public static BillingPlan Create(
        SubscriptionPlan plan,
        string displayName,
        string description,
        bool isPublic,
        int sortOrder,
        string billingProviderPlanReference,
        DateTime utcNow)
    {
        var billingPlan = new BillingPlan
        {
            Plan = plan,
            DisplayName = displayName.Trim(),
            Description = description.Trim(),
            IsPublic = isPublic,
            SortOrder = sortOrder,
            BillingProviderPlanReference = billingProviderPlanReference.Trim()
        };

        billingPlan.SetAuditTimestamps(utcNow);
        return billingPlan;
    }

    public void Update(
        string displayName,
        string description,
        bool isPublic,
        int sortOrder,
        string billingProviderPlanReference,
        DateTime utcNow)
    {
        DisplayName = displayName.Trim();
        Description = description.Trim();
        IsPublic = isPublic;
        SortOrder = sortOrder;
        BillingProviderPlanReference = billingProviderPlanReference.Trim();
        SetAuditTimestamps(utcNow);
    }
}

public sealed class BillingPlanLimit : AuditedEntity
{
    private BillingPlanLimit()
    {
    }

    public Guid BillingPlanId { get; private set; }

    public BillingLimitMetric Metric { get; private set; }

    public long? Limit { get; private set; }

    public string Window { get; private set; } = string.Empty;

    public string Enforcement { get; private set; } = string.Empty;

    public string Notes { get; private set; } = string.Empty;

    public BillingPlan BillingPlan { get; private set; } = null!;

    public static BillingPlanLimit Create(
        Guid billingPlanId,
        BillingLimitMetric metric,
        long? limit,
        string window,
        string enforcement,
        string notes,
        DateTime utcNow)
    {
        var planLimit = new BillingPlanLimit
        {
            BillingPlanId = billingPlanId,
            Metric = metric,
            Limit = limit,
            Window = window.Trim(),
            Enforcement = enforcement.Trim(),
            Notes = notes.Trim()
        };

        planLimit.SetAuditTimestamps(utcNow);
        return planLimit;
    }

    public void Update(long? limit, string window, string enforcement, string notes, DateTime utcNow)
    {
        Limit = limit;
        Window = window.Trim();
        Enforcement = enforcement.Trim();
        Notes = notes.Trim();
        SetAuditTimestamps(utcNow);
    }
}

public sealed class ApiClient : AuditedTenantEntity
{
    private ApiClient()
    {
    }

    public Guid? WorkspaceId { get; private set; }

    public string ClientId { get; private set; } = string.Empty;

    public string DisplayName { get; private set; } = string.Empty;

    public string SecretHash { get; private set; } = string.Empty;

    public string ScopesJson { get; private set; } = "[]";

    public ApiClientStatus Status { get; private set; }

    public DateTime? LastUsedAtUtc { get; private set; }

    public DateTime? RotatedAtUtc { get; private set; }

    public DateTime? RevokedAtUtc { get; private set; }

    public Tenant Tenant { get; private set; } = null!;

    public Workspace? Workspace { get; private set; }

    public static ApiClient Create(
        Guid tenantId,
        Guid? workspaceId,
        string clientId,
        string displayName,
        string secretHash,
        string scopesJson,
        DateTime utcNow)
    {
        var client = new ApiClient
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ClientId = clientId.Trim(),
            DisplayName = displayName.Trim(),
            SecretHash = secretHash.Trim(),
            ScopesJson = string.IsNullOrWhiteSpace(scopesJson) ? "[]" : scopesJson.Trim(),
            Status = ApiClientStatus.Active
        };

        client.SetAuditTimestamps(utcNow);
        return client;
    }

    public void MarkUsed(DateTime utcNow)
    {
        LastUsedAtUtc = utcNow;
        SetAuditTimestamps(utcNow);
    }

    public void RotateSecret(string secretHash, DateTime utcNow)
    {
        SecretHash = secretHash.Trim();
        RotatedAtUtc = utcNow;
        Status = ApiClientStatus.Active;
        SetAuditTimestamps(utcNow);
    }

    public void Revoke(DateTime utcNow)
    {
        Status = ApiClientStatus.Revoked;
        RevokedAtUtc = utcNow;
        SetAuditTimestamps(utcNow);
    }
}

public sealed class ConnectorInstallation : AuditedTenantEntity
{
    private ConnectorInstallation()
    {
    }

    public Guid WorkspaceId { get; private set; }

    public Guid DataSourceId { get; private set; }

    public string ConnectorType { get; private set; } = string.Empty;

    public ConnectorInstallationStatus Status { get; private set; }

    public string CapabilitiesJson { get; private set; } = "[]";

    public string HealthJson { get; private set; } = "{}";

    public DateTime? LastCheckedAtUtc { get; private set; }

    public Workspace Workspace { get; private set; } = null!;

    public DataSource DataSource { get; private set; } = null!;

    public static ConnectorInstallation Create(
        Guid tenantId,
        Guid workspaceId,
        Guid dataSourceId,
        string connectorType,
        string capabilitiesJson,
        DateTime utcNow)
    {
        var installation = new ConnectorInstallation
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            DataSourceId = dataSourceId,
            ConnectorType = connectorType.Trim(),
            CapabilitiesJson = string.IsNullOrWhiteSpace(capabilitiesJson) ? "[]" : capabilitiesJson.Trim(),
            Status = ConnectorInstallationStatus.Active,
            LastCheckedAtUtc = utcNow
        };

        installation.SetAuditTimestamps(utcNow);
        return installation;
    }
}

public sealed class ConnectorCatalogueEntry : AuditedEntity
{
    private ConnectorCatalogueEntry()
    {
    }

    public string ConnectorType { get; private set; } = string.Empty;

    public string DisplayName { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;

    public string Category { get; private set; } = string.Empty;

    public ConnectorCatalogueAvailability Availability { get; private set; }

    public string SupportedDataSourceKindsJson { get; private set; } = "[]";

    public string CapabilitiesJson { get; private set; } = "[]";

    public string ConfigurationSchemaJson { get; private set; } = "{}";

    public string CredentialSchemaJson { get; private set; } = "{}";

    public string HealthCheckMode { get; private set; } = string.Empty;

    public bool IsEnabled { get; private set; }

    public bool IsPlaceholder { get; private set; }

    public int SortOrder { get; private set; }

    public static ConnectorCatalogueEntry Create(
        string connectorType,
        string displayName,
        string description,
        string category,
        ConnectorCatalogueAvailability availability,
        string supportedDataSourceKindsJson,
        string capabilitiesJson,
        string configurationSchemaJson,
        string credentialSchemaJson,
        string healthCheckMode,
        bool isEnabled,
        bool isPlaceholder,
        int sortOrder,
        DateTime utcNow)
    {
        var entry = new ConnectorCatalogueEntry
        {
            ConnectorType = connectorType.Trim(),
            DisplayName = displayName.Trim(),
            Description = description.Trim(),
            Category = category.Trim(),
            Availability = availability,
            SupportedDataSourceKindsJson = string.IsNullOrWhiteSpace(supportedDataSourceKindsJson) ? "[]" : supportedDataSourceKindsJson.Trim(),
            CapabilitiesJson = string.IsNullOrWhiteSpace(capabilitiesJson) ? "[]" : capabilitiesJson.Trim(),
            ConfigurationSchemaJson = string.IsNullOrWhiteSpace(configurationSchemaJson) ? "{}" : configurationSchemaJson.Trim(),
            CredentialSchemaJson = string.IsNullOrWhiteSpace(credentialSchemaJson) ? "{}" : credentialSchemaJson.Trim(),
            HealthCheckMode = healthCheckMode.Trim(),
            IsEnabled = isEnabled,
            IsPlaceholder = isPlaceholder,
            SortOrder = sortOrder
        };

        entry.SetAuditTimestamps(utcNow);
        return entry;
    }
}

public sealed class BlueprintImport : AuditedTenantEntity
{
    private BlueprintImport()
    {
    }

    public Guid? WorkspaceId { get; private set; }

    public string Name { get; private set; } = string.Empty;

    public string BlueprintJson { get; private set; } = "{}";

    public string ContentHash { get; private set; } = string.Empty;

    public BlueprintImportStatus Status { get; private set; }

    public string UploadedBy { get; private set; } = string.Empty;

    public string ValidationIssuesJson { get; private set; } = "[]";

    public string PreviewJson { get; private set; } = "{}";

    public string ImportSummaryJson { get; private set; } = "{}";

    public DateTime UploadedAtUtc { get; private set; }

    public DateTime? ValidatedAtUtc { get; private set; }

    public DateTime? ImportedAtUtc { get; private set; }

    public Workspace? Workspace { get; private set; }

    public static BlueprintImport Create(
        Guid tenantId,
        Guid? workspaceId,
        string name,
        string blueprintJson,
        string contentHash,
        string uploadedBy,
        DateTime utcNow)
    {
        var import = new BlueprintImport
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            Name = string.IsNullOrWhiteSpace(name) ? "Context Layer Blueprint" : name.Trim(),
            BlueprintJson = string.IsNullOrWhiteSpace(blueprintJson) ? "{}" : blueprintJson.Trim(),
            ContentHash = contentHash.Trim(),
            UploadedBy = uploadedBy.Trim(),
            UploadedAtUtc = utcNow,
            Status = BlueprintImportStatus.Uploaded
        };

        import.SetAuditTimestamps(utcNow);
        return import;
    }

    public void MarkValidated(string validationIssuesJson, string previewJson, DateTime utcNow)
    {
        ValidationIssuesJson = string.IsNullOrWhiteSpace(validationIssuesJson) ? "[]" : validationIssuesJson.Trim();
        PreviewJson = string.IsNullOrWhiteSpace(previewJson) ? "{}" : previewJson.Trim();
        Status = BlueprintImportStatus.Validated;
        ValidatedAtUtc = utcNow;
        SetAuditTimestamps(utcNow);
    }

    public void MarkRejected(string validationIssuesJson, string previewJson, DateTime utcNow)
    {
        ValidationIssuesJson = string.IsNullOrWhiteSpace(validationIssuesJson) ? "[]" : validationIssuesJson.Trim();
        PreviewJson = string.IsNullOrWhiteSpace(previewJson) ? "{}" : previewJson.Trim();
        Status = BlueprintImportStatus.Rejected;
        ValidatedAtUtc = utcNow;
        SetAuditTimestamps(utcNow);
    }

    public void MarkImported(string validationIssuesJson, string previewJson, string importSummaryJson, DateTime utcNow)
    {
        ValidationIssuesJson = string.IsNullOrWhiteSpace(validationIssuesJson) ? "[]" : validationIssuesJson.Trim();
        PreviewJson = string.IsNullOrWhiteSpace(previewJson) ? "{}" : previewJson.Trim();
        ImportSummaryJson = string.IsNullOrWhiteSpace(importSummaryJson) ? "{}" : importSummaryJson.Trim();
        Status = BlueprintImportStatus.Imported;
        ValidatedAtUtc ??= utcNow;
        ImportedAtUtc = utcNow;
        SetAuditTimestamps(utcNow);
    }
}

public sealed class PiiRule : AuditedTenantEntity
{
    private PiiRule()
    {
    }

    public Guid? BlueprintImportId { get; private set; }

    public string Key { get; private set; } = string.Empty;

    public string DisplayName { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;

    public string RuleJson { get; private set; } = "{}";

    public GovernancePolicyStatus Status { get; private set; }

    public BlueprintImport? BlueprintImport { get; private set; }

    public static PiiRule Create(Guid tenantId, Guid? blueprintImportId, string key, string displayName, string description, string ruleJson, DateTime utcNow)
    {
        var rule = new PiiRule
        {
            TenantId = tenantId,
            BlueprintImportId = blueprintImportId,
            Key = key.Trim(),
            DisplayName = displayName.Trim(),
            Description = description.Trim(),
            RuleJson = string.IsNullOrWhiteSpace(ruleJson) ? "{}" : ruleJson.Trim(),
            Status = GovernancePolicyStatus.Active
        };

        rule.SetAuditTimestamps(utcNow);
        return rule;
    }

    public void Update(Guid? blueprintImportId, string displayName, string description, string ruleJson, DateTime utcNow)
    {
        BlueprintImportId = blueprintImportId;
        DisplayName = displayName.Trim();
        Description = description.Trim();
        RuleJson = string.IsNullOrWhiteSpace(ruleJson) ? "{}" : ruleJson.Trim();
        Status = GovernancePolicyStatus.Active;
        SetAuditTimestamps(utcNow);
    }
}

public sealed class AuditPolicy : AuditedTenantEntity
{
    private AuditPolicy()
    {
    }

    public Guid? BlueprintImportId { get; private set; }

    public string Key { get; private set; } = string.Empty;

    public string DisplayName { get; private set; } = string.Empty;

    public string Description { get; private set; } = string.Empty;

    public string PolicyJson { get; private set; } = "{}";

    public GovernancePolicyStatus Status { get; private set; }

    public BlueprintImport? BlueprintImport { get; private set; }

    public static AuditPolicy Create(Guid tenantId, Guid? blueprintImportId, string key, string displayName, string description, string policyJson, DateTime utcNow)
    {
        var policy = new AuditPolicy
        {
            TenantId = tenantId,
            BlueprintImportId = blueprintImportId,
            Key = key.Trim(),
            DisplayName = displayName.Trim(),
            Description = description.Trim(),
            PolicyJson = string.IsNullOrWhiteSpace(policyJson) ? "{}" : policyJson.Trim(),
            Status = GovernancePolicyStatus.Active
        };

        policy.SetAuditTimestamps(utcNow);
        return policy;
    }

    public void Update(Guid? blueprintImportId, string displayName, string description, string policyJson, DateTime utcNow)
    {
        BlueprintImportId = blueprintImportId;
        DisplayName = displayName.Trim();
        Description = description.Trim();
        PolicyJson = string.IsNullOrWhiteSpace(policyJson) ? "{}" : policyJson.Trim();
        Status = GovernancePolicyStatus.Active;
        SetAuditTimestamps(utcNow);
    }
}

public sealed class ContextPackage : AuditedTenantEntity
{
    private ContextPackage()
    {
    }

    public Guid WorkspaceId { get; private set; }

    public Guid ContextSnapshotId { get; private set; }

    public string PackageKey { get; private set; } = string.Empty;

    public string Audience { get; private set; } = string.Empty;

    public ContextPackageStatus Status { get; private set; }

    public string ManifestJson { get; private set; } = "{}";

    public string DeliveryChannelsJson { get; private set; } = "[]";

    public DateTime GeneratedAtUtc { get; private set; }

    public DateTime? ExpiresAtUtc { get; private set; }

    public Workspace Workspace { get; private set; } = null!;

    public ContextSnapshot ContextSnapshot { get; private set; } = null!;

    public static ContextPackage Create(
        Guid tenantId,
        Guid workspaceId,
        Guid contextSnapshotId,
        string packageKey,
        string audience,
        string manifestJson,
        string deliveryChannelsJson,
        DateTime generatedAtUtc,
        DateTime? expiresAtUtc)
    {
        var package = new ContextPackage
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ContextSnapshotId = contextSnapshotId,
            PackageKey = packageKey.Trim(),
            Audience = audience.Trim(),
            ManifestJson = string.IsNullOrWhiteSpace(manifestJson) ? "{}" : manifestJson.Trim(),
            DeliveryChannelsJson = string.IsNullOrWhiteSpace(deliveryChannelsJson) ? "[]" : deliveryChannelsJson.Trim(),
            Status = ContextPackageStatus.Generated,
            GeneratedAtUtc = generatedAtUtc,
            ExpiresAtUtc = expiresAtUtc
        };

        package.SetAuditTimestamps(generatedAtUtc);
        return package;
    }
}

public sealed class BillingUsageRecord : AuditedTenantEntity
{
    private BillingUsageRecord()
    {
    }

    public Guid? WorkspaceId { get; private set; }

    public BillingUsageMetric Metric { get; private set; }

    public long Quantity { get; private set; }

    public DateTime WindowStartUtc { get; private set; }

    public DateTime WindowEndUtc { get; private set; }

    public string Source { get; private set; } = string.Empty;

    public string DimensionsJson { get; private set; } = "{}";

    public Tenant Tenant { get; private set; } = null!;

    public Workspace? Workspace { get; private set; }

    public static BillingUsageRecord Create(
        Guid tenantId,
        Guid? workspaceId,
        BillingUsageMetric metric,
        long quantity,
        DateTime windowStartUtc,
        DateTime windowEndUtc,
        string source,
        string dimensionsJson,
        DateTime utcNow)
    {
        var record = new BillingUsageRecord
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            Metric = metric,
            Quantity = quantity,
            WindowStartUtc = windowStartUtc,
            WindowEndUtc = windowEndUtc,
            Source = source.Trim(),
            DimensionsJson = string.IsNullOrWhiteSpace(dimensionsJson) ? "{}" : dimensionsJson.Trim()
        };

        record.SetAuditTimestamps(utcNow);
        return record;
    }
}

public sealed class OnboardingState : AuditedTenantEntity
{
    private OnboardingState()
    {
    }

    public Guid WorkspaceId { get; private set; }

    public string StepKey { get; private set; } = string.Empty;

    public OnboardingStepStatus Status { get; private set; }

    public string StateJson { get; private set; } = "{}";

    public DateTime? CompletedAtUtc { get; private set; }

    public Workspace Workspace { get; private set; } = null!;

    public static OnboardingState Create(
        Guid tenantId,
        Guid workspaceId,
        string stepKey,
        OnboardingStepStatus status,
        string stateJson,
        DateTime utcNow)
    {
        var state = new OnboardingState
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            StepKey = stepKey.Trim(),
            Status = status,
            StateJson = string.IsNullOrWhiteSpace(stateJson) ? "{}" : stateJson.Trim(),
            CompletedAtUtc = status == OnboardingStepStatus.Completed ? utcNow : null
        };

        state.SetAuditTimestamps(utcNow);
        return state;
    }
}

public sealed class OnboardingApplication : AuditedEntity
{
    private OnboardingApplication()
    {
    }

    public Guid? TenantId { get; private set; }

    public Guid? WorkspaceId { get; private set; }

    public Guid? AdminOperatorAccountId { get; private set; }

    public string OrganisationName { get; private set; } = string.Empty;

    public string TenantSlug { get; private set; } = string.Empty;

    public string PrimaryWorkspaceName { get; private set; } = string.Empty;

    public string AdminEmail { get; private set; } = string.Empty;

    public string AdminDisplayName { get; private set; } = string.Empty;

    public string IntendedUseCase { get; private set; } = string.Empty;

    public string SourceSystemsJson { get; private set; } = "[]";

    public string DataCategoriesJson { get; private set; } = "[]";

    public string AiUseCasesJson { get; private set; } = "[]";

    public string PiiSensitivityLevel { get; private set; } = string.Empty;

    public string PreferredDeploymentMode { get; private set; } = string.Empty;

    public string Status { get; private set; } = string.Empty;

    public string NextStepsJson { get; private set; } = "[]";

    public Tenant? Tenant { get; private set; }

    public Workspace? Workspace { get; private set; }

    public OperatorAccount? AdminOperatorAccount { get; private set; }

    public static OnboardingApplication Create(
        string organisationName,
        string tenantSlug,
        string primaryWorkspaceName,
        string adminEmail,
        string adminDisplayName,
        string intendedUseCase,
        string sourceSystemsJson,
        string dataCategoriesJson,
        string aiUseCasesJson,
        string piiSensitivityLevel,
        string preferredDeploymentMode,
        DateTime utcNow)
    {
        var application = new OnboardingApplication
        {
            OrganisationName = organisationName.Trim(),
            TenantSlug = tenantSlug.Trim().ToLowerInvariant(),
            PrimaryWorkspaceName = primaryWorkspaceName.Trim(),
            AdminEmail = adminEmail.Trim().ToLowerInvariant(),
            AdminDisplayName = adminDisplayName.Trim(),
            IntendedUseCase = intendedUseCase.Trim(),
            SourceSystemsJson = string.IsNullOrWhiteSpace(sourceSystemsJson) ? "[]" : sourceSystemsJson.Trim(),
            DataCategoriesJson = string.IsNullOrWhiteSpace(dataCategoriesJson) ? "[]" : dataCategoriesJson.Trim(),
            AiUseCasesJson = string.IsNullOrWhiteSpace(aiUseCasesJson) ? "[]" : aiUseCasesJson.Trim(),
            PiiSensitivityLevel = piiSensitivityLevel.Trim(),
            PreferredDeploymentMode = preferredDeploymentMode.Trim(),
            Status = "submitted"
        };

        application.SetAuditTimestamps(utcNow);
        return application;
    }

    public void MarkProvisioned(
        Guid tenantId,
        Guid workspaceId,
        Guid adminOperatorAccountId,
        string nextStepsJson,
        DateTime utcNow)
    {
        TenantId = tenantId;
        WorkspaceId = workspaceId;
        AdminOperatorAccountId = adminOperatorAccountId;
        NextStepsJson = string.IsNullOrWhiteSpace(nextStepsJson) ? "[]" : nextStepsJson.Trim();
        Status = "provisioned";
        SetAuditTimestamps(utcNow);
    }
}
