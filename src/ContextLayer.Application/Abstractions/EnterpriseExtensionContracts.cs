using System.Text.Json.Nodes;

namespace ContextLayer.Application.Abstractions;

public sealed record TenantContext(
    Guid TenantId,
    string TenantSlug,
    string? EnvironmentKey = null,
    string? CorrelationId = null);

public sealed record EnterpriseActorContext(
    string ActorId,
    string DisplayName,
    string? Email,
    IReadOnlyList<string> Roles);

public enum ExtensionErrorCode
{
    None = 0,
    NotSupported = 1,
    NotConfigured = 2,
    ValidationFailed = 3,
    NotFound = 4,
    AccessDenied = 5,
    Conflict = 6,
    Timeout = 7,
    ExternalDependencyFailed = 8,
    InvalidSecretReference = 9,
    UnsafeOperation = 10,
    Cancelled = 11,
    Unknown = 12
}

public sealed record ExtensionError(
    ExtensionErrorCode Code,
    string Message,
    string? Target = null,
    bool IsTransient = false);

public enum MaskingStrategy
{
    None = 0,
    Redact = 1,
    Partial = 2,
    Hash = 3,
    Tokenize = 4
}

public sealed record ContextSourceRecord(
    string SubjectKey,
    JsonObject Payload,
    DateTime ObservedAtUtc,
    DateTime? FreshUntilUtc,
    JsonArray Provenance,
    JsonObject Diagnostics);

public sealed record ContextSourceHealthRequest(
    TenantContext Tenant,
    string ConnectorKey,
    JsonObject Configuration,
    string? CredentialSetKey = null,
    string? SubjectKey = null);

public sealed record ContextSourceHealthResult(
    bool IsHealthy,
    string Status,
    IReadOnlyList<string> Messages,
    JsonObject Details,
    IReadOnlyList<ExtensionError> Errors,
    DateTime CheckedAtUtc);

public sealed record ContextSourceReadRequest(
    TenantContext Tenant,
    string ConnectorKey,
    string SubjectKey,
    JsonObject Configuration,
    string? CredentialSetKey = null,
    JsonObject? Hints = null);

public sealed record EnterpriseConnectorConfigurationValidationRequest(
    TenantContext Tenant,
    string ConnectorKey,
    JsonObject Configuration,
    JsonObject? Metadata = null);

public sealed record EnterpriseConnectorConfigurationValidationResult(
    bool IsValid,
    JsonObject SanitizedConfiguration,
    JsonObject Schema,
    IReadOnlyList<string> Warnings,
    IReadOnlyList<ExtensionError> Errors);

public sealed record CredentialProviderRequest(
    TenantContext Tenant,
    string ProviderKey,
    string CredentialSetKey,
    JsonObject? Metadata = null);

public sealed record CredentialProviderResult(
    bool Succeeded,
    string ProviderKey,
    string CredentialSetKey,
    IReadOnlyDictionary<string, string> Credentials,
    DateTimeOffset? ExpiresAtUtc,
    IReadOnlyList<ExtensionError> Errors);

public sealed record SecretResolveRequest(
    TenantContext Tenant,
    string ResolverKey,
    string SecretReference,
    JsonObject? Metadata = null);

public sealed record SecretResolveResult(
    bool Succeeded,
    string ResolverKey,
    string SecretReference,
    string? SecretValue,
    DateTimeOffset? ExpiresAtUtc,
    IReadOnlyList<ExtensionError> Errors);

public sealed record PolicyFact(
    string Key,
    string? Value,
    JsonNode? ValueNode = null);

public sealed record PolicyEvaluationRequest(
    TenantContext Tenant,
    string PolicyKey,
    string Action,
    string ResourceType,
    string ResourceKey,
    EnterpriseActorContext Actor,
    IReadOnlyList<PolicyFact> Facts,
    JsonObject? Payload = null);

public sealed record PolicyEvaluationResult(
    bool Allowed,
    string PolicyKey,
    string Action,
    string DecisionReason,
    JsonArray Obligations,
    JsonArray Warnings,
    IReadOnlyList<ExtensionError> Errors);

public sealed record PiiFieldValue(
    string FieldName,
    string? Value,
    string Classification);

public sealed record PiiMaskingRequest(
    TenantContext Tenant,
    string ProviderKey,
    EnterpriseActorContext Actor,
    string ResourceType,
    string ResourceKey,
    IReadOnlyList<PiiFieldValue> Fields,
    JsonObject? Metadata = null);

public sealed record MaskedFieldValue(
    string FieldName,
    string? Value,
    bool WasMasked,
    MaskingStrategy Strategy,
    string Classification);

public sealed record PiiMaskingResult(
    bool Succeeded,
    IReadOnlyList<MaskedFieldValue> Fields,
    IReadOnlyList<ExtensionError> Errors);

public sealed record AuditExportRequest(
    TenantContext Tenant,
    string ExporterKey,
    string StreamKey,
    JsonArray Events,
    JsonObject? Metadata = null);

public sealed record AuditExportResult(
    bool Succeeded,
    string ExporterKey,
    string StreamKey,
    int ExportedEventCount,
    string Status,
    IReadOnlyList<ExtensionError> Errors);

public sealed record ContextPackageExportRequest(
    TenantContext Tenant,
    string ExporterKey,
    string PackageKey,
    JsonObject ContextPackage,
    JsonObject? Metadata = null);

public sealed record ContextPackageExportResult(
    bool Succeeded,
    string ExporterKey,
    string PackageKey,
    string Format,
    string Content,
    IReadOnlyList<ExtensionError> Errors);

public sealed record EnterpriseAuthChallengeRequest(
    TenantContext Tenant,
    string ProviderKey,
    string RedirectUri,
    JsonObject? Metadata = null);

public sealed record EnterpriseAuthChallengeResult(
    bool Succeeded,
    string ProviderKey,
    string? RedirectUri,
    JsonObject Payload,
    IReadOnlyList<ExtensionError> Errors);

public sealed record EnterpriseAuthenticationRequest(
    TenantContext Tenant,
    string ProviderKey,
    JsonObject Payload,
    JsonObject? Metadata = null);

public sealed record EnterpriseAuthenticatedPrincipal(
    string SubjectId,
    string DisplayName,
    string? Email,
    IReadOnlyList<string> Roles,
    JsonObject Claims);

public sealed record EnterpriseAuthResult(
    bool Succeeded,
    string ProviderKey,
    EnterpriseAuthenticatedPrincipal? Principal,
    IReadOnlyList<ExtensionError> Errors);

public sealed record SelectorApprovalSubmissionRequest(
    TenantContext Tenant,
    string WorkflowKey,
    string SelectorKey,
    string SelectorName,
    string TargetAttributeKey,
    EnterpriseActorContext SubmittedBy,
    JsonObject SelectorDefinition,
    JsonObject? Metadata = null);

public sealed record SelectorApprovalResult(
    bool Succeeded,
    string WorkflowKey,
    string ApprovalRequestId,
    string Status,
    IReadOnlyList<ExtensionError> Errors);

public sealed record SelectorApprovalDecisionRequest(
    TenantContext Tenant,
    string WorkflowKey,
    string ApprovalRequestId,
    string Decision,
    EnterpriseActorContext DecidedBy,
    string? Comment = null);

public sealed record SelectorApprovalDecisionResult(
    bool Succeeded,
    string WorkflowKey,
    string ApprovalRequestId,
    string Status,
    IReadOnlyList<ExtensionError> Errors);

public sealed record EnvironmentPromotionPlanRequest(
    TenantContext Tenant,
    string ServiceKey,
    string SourceEnvironment,
    string TargetEnvironment,
    JsonObject Artifact,
    EnterpriseActorContext RequestedBy,
    JsonObject? Metadata = null);

public sealed record EnvironmentPromotionPlanResult(
    bool Succeeded,
    string ServiceKey,
    string PromotionId,
    JsonArray Steps,
    JsonArray Warnings,
    IReadOnlyList<ExtensionError> Errors);

public sealed record EnvironmentPromotionExecutionRequest(
    TenantContext Tenant,
    string ServiceKey,
    string PromotionId,
    EnterpriseActorContext RequestedBy,
    JsonObject? Metadata = null);

public sealed record EnvironmentPromotionExecutionResult(
    bool Succeeded,
    string ServiceKey,
    string PromotionId,
    string Status,
    JsonArray AppliedSteps,
    IReadOnlyList<ExtensionError> Errors);

public sealed record UsageMeteringRecord(
    TenantContext Tenant,
    string MeterKey,
    string Dimension,
    decimal Quantity,
    DateTime ObservedAtUtc,
    JsonObject? Metadata = null);

public sealed record UsageMeteringResult(
    bool Succeeded,
    string SinkKey,
    string MeterKey,
    IReadOnlyList<ExtensionError> Errors);
