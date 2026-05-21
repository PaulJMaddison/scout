using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Nodes;
using KynticAI.Scout.Application.Abstractions;

namespace KynticAI.Scout.Infrastructure.Extensions;

// The implementations in this file are intentionally safe OSS defaults.
// They keep the public core functional and testable without shipping paid enterprise
// connector, auth, governance, compliance, billing, or private deployment features.
internal sealed class MockContextSourceConnector : IContextSourceConnector
{
    public string ConnectorKey => "mock";

    public ValueTask<ContextSourceHealthResult> CheckHealthAsync(
        ContextSourceHealthRequest request,
        CancellationToken cancellationToken = default)
        => ValueTask.FromResult(new ContextSourceHealthResult(
            true,
            "healthy",
            ["Mock connector is active."],
            new JsonObject
            {
                ["tenantSlug"] = request.Tenant.TenantSlug,
                ["connectorKey"] = ConnectorKey
            },
            [],
            DateTime.UtcNow));

    public async IAsyncEnumerable<ContextSourceRecord> ReadAsync(
        ContextSourceReadRequest request,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await Task.Yield();

        yield return new ContextSourceRecord(
            request.SubjectKey,
            new JsonObject
            {
                ["subjectKey"] = request.SubjectKey,
                ["tenantSlug"] = request.Tenant.TenantSlug,
                ["connectorKey"] = ConnectorKey,
                ["mode"] = "mock"
            },
            DateTime.UtcNow,
            DateTime.UtcNow.AddHours(1),
            [new JsonObject
            {
                ["source"] = ConnectorKey,
                ["kind"] = "mock"
            }],
            new JsonObject());
    }
}

internal sealed class DefaultConnectorConfigurationValidator : IConnectorConfigurationValidator
{
    public string ConnectorKey => "*";

    public ValueTask<EnterpriseConnectorConfigurationValidationResult> ValidateAsync(
        EnterpriseConnectorConfigurationValidationRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var errors = new List<ExtensionError>();
        if (request.Configuration.Count == 0)
        {
            errors.Add(new ExtensionError(
                ExtensionErrorCode.ValidationFailed,
                "Connector configuration must include at least one property.",
                "configuration"));
        }

        return ValueTask.FromResult(new EnterpriseConnectorConfigurationValidationResult(
            errors.Count == 0,
            request.Configuration.DeepClone() as JsonObject ?? new JsonObject(),
            new JsonObject
            {
                ["type"] = "object",
                ["additionalProperties"] = true
            },
            [],
            errors));
    }
}

internal sealed class NullCredentialProvider : ICredentialProvider
{
    public string ProviderKey => "none";

    public ValueTask<CredentialProviderResult> GetCredentialsAsync(
        CredentialProviderRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return ValueTask.FromResult(new CredentialProviderResult(
            false,
            ProviderKey,
            request.CredentialSetKey,
            new Dictionary<string, string>(),
            null,
            [new ExtensionError(
                ExtensionErrorCode.NotConfigured,
                "No enterprise credential provider is configured for this environment.",
                request.CredentialSetKey)]));
    }
}

internal sealed class DevelopmentSecretResolver : ISecretResolver
{
    public string ResolverKey => "development";

    public ValueTask<SecretResolveResult> ResolveSecretAsync(
        SecretResolveRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (request.SecretReference.StartsWith("plain://", StringComparison.OrdinalIgnoreCase))
        {
            return ValueTask.FromResult(new SecretResolveResult(
                true,
                ResolverKey,
                request.SecretReference,
                request.SecretReference["plain://".Length..],
                null,
                []));
        }

        return ValueTask.FromResult(new SecretResolveResult(
            false,
            ResolverKey,
            request.SecretReference,
            null,
            null,
            [new ExtensionError(
                ExtensionErrorCode.InvalidSecretReference,
                "Only plain:// development secret references are supported by the open source resolver.",
                request.SecretReference)]));
    }
}

internal sealed class DenyByDefaultPolicyEvaluator : IPolicyEvaluator
{
    public string PolicyKey => "default";

    public ValueTask<PolicyEvaluationResult> EvaluateAsync(
        PolicyEvaluationRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return ValueTask.FromResult(new PolicyEvaluationResult(
            false,
            PolicyKey,
            request.Action,
            "No enterprise policy evaluator is configured. The request was denied by default.",
            [],
            [],
            [new ExtensionError(
                ExtensionErrorCode.NotConfigured,
                "No policy evaluator is configured.",
                request.Action)]));
    }
}

internal sealed class NoopContextGovernanceHook : IContextGovernanceHook
{
    public string HookKey => "noop-context-governance";

    public ValueTask<ContextGovernanceResult> EvaluateAsync(
        ContextGovernanceRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var decisions = request.Facts
            .Select(fact => new ContextGovernanceDecision(
                fact.Key,
                true,
                false,
                fact.Value?.DeepClone(),
                "No enterprise context governance hook is configured."))
            .ToList();
        return ValueTask.FromResult(new ContextGovernanceResult(decisions, []));
    }
}

internal sealed class DefaultPiiMaskingProvider : IPiiMaskingProvider
{
    public string ProviderKey => "default";

    public ValueTask<PiiMaskingResult> MaskAsync(
        PiiMaskingRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var masked = request.Fields
            .Select(static field => new MaskedFieldValue(
                field.FieldName,
                MaskValue(field.Value, field.Classification),
                WasMasked(field.Classification, field.Value),
                ResolveStrategy(field.Classification, field.Value),
                field.Classification))
            .ToList();

        return ValueTask.FromResult(new PiiMaskingResult(true, masked, []));
    }

    private static string? MaskValue(string? value, string classification)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        if (classification.Contains("email", StringComparison.OrdinalIgnoreCase) && value.Contains('@', StringComparison.Ordinal))
        {
            var parts = value.Split('@', 2);
            var prefix = parts[0];
            return prefix.Length <= 1
                ? $"*@{parts[1]}"
                : $"{prefix[0]}***@{parts[1]}";
        }

        if (classification.Contains("phone", StringComparison.OrdinalIgnoreCase))
        {
            var digits = new string(value.Where(char.IsDigit).ToArray());
            return digits.Length < 4 ? "***" : $"***{digits[^4..]}";
        }

        if (classification.Contains("direct_identifier", StringComparison.OrdinalIgnoreCase)
            || classification.Contains("pii", StringComparison.OrdinalIgnoreCase))
        {
            return "***REDACTED***";
        }

        return value;
    }

    private static bool WasMasked(string classification, string? value)
        => !string.Equals(value, MaskValue(value, classification), StringComparison.Ordinal);

    private static MaskingStrategy ResolveStrategy(string classification, string? value)
        => WasMasked(classification, value) ? MaskingStrategy.Partial : MaskingStrategy.None;
}

internal sealed class NoOpAuditExporter : IAuditExporter
{
    public string ExporterKey => "noop";

    public ValueTask<AuditExportResult> ExportAsync(
        AuditExportRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return ValueTask.FromResult(new AuditExportResult(
            true,
            ExporterKey,
            request.StreamKey,
            request.Events.Count,
            "skipped",
            []));
    }
}

internal sealed class JsonContextPackageExporter : IContextPackageExporter
{
    public string ExporterKey => "json";

    public ValueTask<ContextPackageExportResult> ExportAsync(
        ContextPackageExportRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return ValueTask.FromResult(new ContextPackageExportResult(
            true,
            ExporterKey,
            request.PackageKey,
            "application/json",
            request.ContextPackage.ToJsonString(),
            []));
    }
}

internal sealed class DisabledEnterpriseAuthProvider : IEnterpriseAuthProvider
{
    public string ProviderKey => "disabled";

    public ValueTask<EnterpriseAuthChallengeResult> ChallengeAsync(
        EnterpriseAuthChallengeRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return ValueTask.FromResult(new EnterpriseAuthChallengeResult(
            false,
            ProviderKey,
            null,
            new JsonObject(),
            [new ExtensionError(
                ExtensionErrorCode.NotSupported,
                "Enterprise authentication is not available in the open source build.",
                request.ProviderKey)]));
    }

    public ValueTask<EnterpriseAuthResult> AuthenticateAsync(
        EnterpriseAuthenticationRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return ValueTask.FromResult(new EnterpriseAuthResult(
            false,
            ProviderKey,
            null,
            [new ExtensionError(
                ExtensionErrorCode.NotSupported,
                "Enterprise authentication is not available in the open source build.",
                request.ProviderKey)]));
    }
}

internal sealed class ImmediateSelectorApprovalWorkflow : ISelectorApprovalWorkflow
{
    public string WorkflowKey => "immediate";

    public ValueTask<SelectorApprovalResult> SubmitAsync(
        SelectorApprovalSubmissionRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var approvalId = $"approval-{Guid.NewGuid():N}";
        return ValueTask.FromResult(new SelectorApprovalResult(
            true,
            WorkflowKey,
            approvalId,
            "approved",
            []));
    }

    public ValueTask<SelectorApprovalDecisionResult> DecideAsync(
        SelectorApprovalDecisionRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return ValueTask.FromResult(new SelectorApprovalDecisionResult(
            true,
            WorkflowKey,
            request.ApprovalRequestId,
            request.Decision.Trim().ToLowerInvariant(),
            []));
    }
}

internal sealed class DisabledEnvironmentPromotionService : IEnvironmentPromotionService
{
    public string ServiceKey => "disabled";

    public ValueTask<EnvironmentPromotionPlanResult> PlanPromotionAsync(
        EnvironmentPromotionPlanRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return ValueTask.FromResult(new EnvironmentPromotionPlanResult(
            false,
            ServiceKey,
            $"promotion-{Guid.NewGuid():N}",
            [],
            [],
            [new ExtensionError(
                ExtensionErrorCode.NotSupported,
                "Environment promotion is not available in the open source build.",
                request.TargetEnvironment)]));
    }

    public ValueTask<EnvironmentPromotionExecutionResult> PromoteAsync(
        EnvironmentPromotionExecutionRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return ValueTask.FromResult(new EnvironmentPromotionExecutionResult(
            false,
            ServiceKey,
            request.PromotionId,
            "not_supported",
            [],
            [new ExtensionError(
                ExtensionErrorCode.NotSupported,
                "Environment promotion is not available in the open source build.",
                request.PromotionId)]));
    }
}

internal sealed class InMemoryUsageMeteringSink : IUsageMeteringSink
{
    private static readonly ConcurrentQueue<UsageMeteringRecord> Records = new();

    public string SinkKey => "in-memory";

    public ValueTask<UsageMeteringResult> RecordAsync(
        UsageMeteringRecord record,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        Records.Enqueue(record);

        return ValueTask.FromResult(new UsageMeteringResult(
            true,
            SinkKey,
            record.MeterKey,
            []));
    }
}
