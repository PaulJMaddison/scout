namespace ContextLayer.Application.Abstractions;

// These interfaces define stable public extension points for the open source core.
// Safe defaults and mock implementations live in this repository, while paid enterprise
// implementations are expected to live in a separate private repository.
public interface IContextSourceConnector
{
    string ConnectorKey { get; }

    ValueTask<ContextSourceHealthResult> CheckHealthAsync(
        ContextSourceHealthRequest request,
        CancellationToken cancellationToken = default);

    IAsyncEnumerable<ContextSourceRecord> ReadAsync(
        ContextSourceReadRequest request,
        CancellationToken cancellationToken = default);
}

public interface IConnectorConfigurationValidator
{
    string ConnectorKey { get; }

    ValueTask<EnterpriseConnectorConfigurationValidationResult> ValidateAsync(
        EnterpriseConnectorConfigurationValidationRequest request,
        CancellationToken cancellationToken = default);
}

public interface ICredentialProvider
{
    string ProviderKey { get; }

    ValueTask<CredentialProviderResult> GetCredentialsAsync(
        CredentialProviderRequest request,
        CancellationToken cancellationToken = default);
}

public interface ISecretResolver
{
    string ResolverKey { get; }

    ValueTask<SecretResolveResult> ResolveSecretAsync(
        SecretResolveRequest request,
        CancellationToken cancellationToken = default);
}

public interface IPolicyEvaluator
{
    string PolicyKey { get; }

    ValueTask<PolicyEvaluationResult> EvaluateAsync(
        PolicyEvaluationRequest request,
        CancellationToken cancellationToken = default);
}

public interface IPiiMaskingProvider
{
    string ProviderKey { get; }

    ValueTask<PiiMaskingResult> MaskAsync(
        PiiMaskingRequest request,
        CancellationToken cancellationToken = default);
}

public interface IAuditExporter
{
    string ExporterKey { get; }

    ValueTask<AuditExportResult> ExportAsync(
        AuditExportRequest request,
        CancellationToken cancellationToken = default);
}

public interface IContextPackageExporter
{
    string ExporterKey { get; }

    ValueTask<ContextPackageExportResult> ExportAsync(
        ContextPackageExportRequest request,
        CancellationToken cancellationToken = default);
}

public interface IEnterpriseAuthProvider
{
    string ProviderKey { get; }

    ValueTask<EnterpriseAuthChallengeResult> ChallengeAsync(
        EnterpriseAuthChallengeRequest request,
        CancellationToken cancellationToken = default);

    ValueTask<EnterpriseAuthResult> AuthenticateAsync(
        EnterpriseAuthenticationRequest request,
        CancellationToken cancellationToken = default);
}

public interface ISelectorApprovalWorkflow
{
    string WorkflowKey { get; }

    ValueTask<SelectorApprovalResult> SubmitAsync(
        SelectorApprovalSubmissionRequest request,
        CancellationToken cancellationToken = default);

    ValueTask<SelectorApprovalDecisionResult> DecideAsync(
        SelectorApprovalDecisionRequest request,
        CancellationToken cancellationToken = default);
}

public interface IEnvironmentPromotionService
{
    string ServiceKey { get; }

    ValueTask<EnvironmentPromotionPlanResult> PlanPromotionAsync(
        EnvironmentPromotionPlanRequest request,
        CancellationToken cancellationToken = default);

    ValueTask<EnvironmentPromotionExecutionResult> PromoteAsync(
        EnvironmentPromotionExecutionRequest request,
        CancellationToken cancellationToken = default);
}

public interface IUsageMeteringSink
{
    string SinkKey { get; }

    ValueTask<UsageMeteringResult> RecordAsync(
        UsageMeteringRecord record,
        CancellationToken cancellationToken = default);
}
