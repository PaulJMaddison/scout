using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Domain.Entities;
using Microsoft.EntityFrameworkCore;

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

internal sealed class ScoutPostgresStorageAdapter(IScoutDbContext dbContext) : ILocalDataPlaneStorageAdapter
{
    private const string ExportContractVersion = "kynticai.scout.storage-portable-export.v1";

    private static readonly StorageAdapterDataScope ExportableScopes =
        StorageAdapterDataScope.SourceEvents
        | StorageAdapterDataScope.UserSignals
        | StorageAdapterDataScope.SelectorExecutions
        | StorageAdapterDataScope.ContextFacts
        | StorageAdapterDataScope.Provenance
        | StorageAdapterDataScope.AuditEvents;

    public string AdapterKey => StorageAdapterProviderKeys.ScoutPostgres;

    public ValueTask<StorageAdapterCapabilities> GetCapabilitiesAsync(
        StorageAdapterCapabilitiesRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return ValueTask.FromResult(new StorageAdapterCapabilities(
            AdapterKey,
            StorageAdapterProviderKeys.ScoutPostgres,
            StorageAdapterProviderKeys.Disabled,
            StorageAdapterDataScope.SourceEvents
                | StorageAdapterDataScope.UserSignals
                | StorageAdapterDataScope.SelectorExecutions
                | StorageAdapterDataScope.ContextFacts
                | StorageAdapterDataScope.Provenance
                | StorageAdapterDataScope.AuditEvents,
            SupportsExport: true,
            SupportsImport: false,
            SupportsBackfill: false,
            SupportsVectorWrites: false,
            SupportsDenseEmbeddings: false,
            SupportsDualWrite: false,
            UsesCustomerOwnedDataPlane: true,
            UsesCloudDataPlane: false,
            RequiresEnterpriseRuntime: false,
            ExpectedEmbeddingDimensions: null,
            RequiredConfigurationKeys: ["Database:Provider", "ConnectionStrings:Scout"],
            Notes:
            [
                "Scout uses the existing EF-backed relational store for source events, signals, selector outputs, context facts, provenance, and audit.",
                "Scout can export current relational migration records in the storage-portable v1 contract.",
                "The open source default does not import into Enterprise/Fortress or write vectors. Configure a local Enterprise/Fortress storage adapter for those paths."
            ]));
    }

    public async ValueTask<StorageAdapterHealthResult> CheckHealthAsync(
        StorageAdapterHealthRequest request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var tenantProbeCount = await dbContext.Tenants
                .AsNoTracking()
                .Take(1)
                .CountAsync(cancellationToken);

            return new StorageAdapterHealthResult(
                AdapterKey,
                StorageAdapterReadiness.Available,
                "Scout relational storage is reachable.",
                DateTime.UtcNow,
                [],
                new JsonObject
                {
                    ["tenantSlug"] = request.Context.Tenant.TenantSlug,
                    ["tenantProbeCount"] = tenantProbeCount,
                    ["usesCloudDataPlane"] = false
                });
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception exception)
        {
            return new StorageAdapterHealthResult(
                AdapterKey,
                StorageAdapterReadiness.Unavailable,
                "Scout relational storage health check failed.",
                DateTime.UtcNow,
                [new ExtensionError(
                    ExtensionErrorCode.ExternalDependencyFailed,
                    "Scout relational storage health check failed.",
                    AdapterKey,
                    IsTransient: true)],
                new JsonObject
                {
                    ["tenantSlug"] = request.Context.Tenant.TenantSlug,
                    ["errorType"] = exception.GetType().Name,
                    ["usesCloudDataPlane"] = false
                });
        }
    }

    public async IAsyncEnumerable<StorageExportBatch> ExportAsync(
        StorageExportRequest request,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var batch = await BuildExportBatchAsync(request, cancellationToken);
        yield return batch;
    }

    public ValueTask<StorageImportResult> ImportAsync(
        StorageImportRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return ValueTask.FromResult(new StorageImportResult(
            false,
            AdapterKey,
            request.Scope,
            ImportedRecords: 0,
            SkippedRecords: request.Records.Count,
            request.Checkpoint,
            [new ExtensionError(
                ExtensionErrorCode.NotSupported,
                "The Scout storage adapter contract is available, but full migration import is not implemented in the open source default.",
                request.Scope.ToString())],
            new JsonObject
            {
                ["adapterKey"] = AdapterKey,
                ["quietMigrationMode"] = request.QuietMigrationMode,
                ["dryRun"] = request.DryRun,
                ["usesCloudDataPlane"] = false
            }));
    }

    public ValueTask<StorageVectorWriteResult> WriteVectorAsync(
        StorageVectorWriteRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return ValueTask.FromResult(new StorageVectorWriteResult(
            StorageVectorWriteStatus.Skipped,
            AdapterKey,
            request.Record.Id,
            WrittenRecords: 0,
            "Scout open source storage does not write vectors. Configure a local Enterprise/Fortress adapter for vector writes.",
            [new ExtensionError(
                ExtensionErrorCode.NotConfigured,
                "No vector storage provider is configured in the Scout open source default.",
                request.TargetProvider ?? StorageAdapterProviderKeys.Disabled)],
            new JsonObject
            {
                ["adapterKey"] = AdapterKey,
                ["targetProvider"] = request.TargetProvider ?? StorageAdapterProviderKeys.Disabled,
                ["hasEmbedding"] = request.Record.Embedding is not null,
                ["allowNullEmbedding"] = request.AllowNullEmbedding,
                ["usesCloudDataPlane"] = false
            }));
    }

    private async Task<StorageExportBatch> BuildExportBatchAsync(
        StorageExportRequest request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var findings = new List<StorageMigrationValidationFinding>();
        var errors = new List<ExtensionError>();
        var maxRecords = request.MaxRecords;

        if (request.Scope == StorageAdapterDataScope.None)
        {
            AddFinding(
                findings,
                errors,
                StorageMigrationValidationSeverity.Error,
                "scope.none",
                "A migration export scope must be selected.",
                target: nameof(request.Scope));
        }

        if (maxRecords <= 0)
        {
            AddFinding(
                findings,
                errors,
                StorageMigrationValidationSeverity.Error,
                "max_records.invalid",
                "MaxRecords must be greater than zero.",
                target: nameof(request.MaxRecords));
            maxRecords = 0;
        }

        var unsupportedScopes = request.Scope & ~ExportableScopes;
        if (unsupportedScopes != StorageAdapterDataScope.None)
        {
            AddFinding(
                findings,
                errors,
                StorageMigrationValidationSeverity.Error,
                "scope.unsupported_by_scout_export",
                "The Scout open-source adapter can export current relational records only. Relationship sets, attribution paths, outcome events, data items, vectors, and private Enterprise/Fortress imports require a local private adapter contract.",
                target: unsupportedScopes.ToString());
        }

        var tenant = await ResolveTenantAsync(request.Context.Tenant, findings, errors, cancellationToken);
        if (tenant is null || errors.Count > 0 && (request.Scope == StorageAdapterDataScope.None || maxRecords == 0))
        {
            return CreateExportBatch(request, [], [], errors, findings, request.Checkpoint, true);
        }

        var records = tenant is null
            ? []
            : await BuildPortableRecordsAsync(request.Scope & ExportableScopes, tenant, findings, errors, cancellationToken);

        var orderedRecords = records
            .OrderBy(static record => record.RecordKind, StringComparer.Ordinal)
            .ThenBy(static record => record.ObservedAtUtc)
            .ThenBy(static record => record.RecordId, StringComparer.Ordinal)
            .ToList();

        var startIndex = ResolveStartIndex(request.Checkpoint, orderedRecords, findings, errors);
        if (startIndex is null)
        {
            return CreateExportBatch(request, orderedRecords, [], errors, findings, request.Checkpoint, true);
        }

        var selectedRecords = request.DryRun || maxRecords == 0
            ? []
            : orderedRecords.Skip(startIndex.Value).Take(maxRecords).ToList();

        var nextIndex = startIndex.Value + selectedRecords.Count;
        var isFinal = request.DryRun || nextIndex >= orderedRecords.Count;
        var nextCheckpoint = isFinal || selectedRecords.Count == 0
            ? null
            : EncodeCheckpoint(selectedRecords[^1]);

        if (request.DryRun)
        {
            AddFinding(
                findings,
                errors,
                StorageMigrationValidationSeverity.Info,
                "dry_run",
                "Dry run completed without returning portable records.",
                target: nameof(request.DryRun));
        }

        return CreateExportBatch(request, orderedRecords, selectedRecords, errors, findings, nextCheckpoint, isFinal);
    }

    private async Task<Tenant?> ResolveTenantAsync(
        TenantContext tenantContext,
        List<StorageMigrationValidationFinding> findings,
        List<ExtensionError> errors,
        CancellationToken cancellationToken)
    {
        var tenant = await dbContext.Tenants
            .AsNoTracking()
            .SingleOrDefaultAsync(candidate => candidate.Id == tenantContext.TenantId, cancellationToken);

        if (tenant is null)
        {
            AddFinding(
                findings,
                errors,
                StorageMigrationValidationSeverity.Error,
                "tenant.not_found",
                "The requested tenant was not found in local Scout storage.",
                target: tenantContext.TenantId.ToString("D"));
            return null;
        }

        if (!string.Equals(tenant.Slug, tenantContext.TenantSlug, StringComparison.OrdinalIgnoreCase))
        {
            AddFinding(
                findings,
                errors,
                StorageMigrationValidationSeverity.Error,
                "tenant.mismatch",
                "The tenant ID and slug do not refer to the same local Scout tenant. Migration export fails closed to avoid cross-tenant leakage.",
                target: tenantContext.TenantSlug);
            return null;
        }

        return tenant;
    }

    private async Task<List<StoragePortableRecord>> BuildPortableRecordsAsync(
        StorageAdapterDataScope scope,
        Tenant tenant,
        List<StorageMigrationValidationFinding> findings,
        List<ExtensionError> errors,
        CancellationToken cancellationToken)
    {
        var records = new List<StoragePortableRecord>();

        if (scope.HasFlag(StorageAdapterDataScope.SourceEvents))
        {
            var sourceEvents = await dbContext.SourceSystemEvents
                .AsNoTracking()
                .Where(sourceEvent => sourceEvent.TenantId == tenant.Id)
                .OrderBy(sourceEvent => sourceEvent.ObservedAtUtc)
                .ThenBy(sourceEvent => sourceEvent.Id)
                .ToListAsync(cancellationToken);

            records.AddRange(sourceEvents.Select(sourceEvent => MapSourceEvent(sourceEvent, tenant, findings, errors)));
        }

        if (scope.HasFlag(StorageAdapterDataScope.UserSignals))
        {
            var userSignals = await dbContext.UserSignals
                .AsNoTracking()
                .Where(signal => signal.TenantId == tenant.Id)
                .OrderBy(signal => signal.ObservedAtUtc)
                .ThenBy(signal => signal.Id)
                .ToListAsync(cancellationToken);

            records.AddRange(userSignals.Select(signal => MapUserSignal(signal, tenant, findings, errors)));
        }

        if (scope.HasFlag(StorageAdapterDataScope.SelectorExecutions))
        {
            var selectorExecutions = await dbContext.SelectorExecutions
                .AsNoTracking()
                .Where(execution => execution.TenantId == tenant.Id)
                .OrderBy(execution => execution.RequestedAtUtc)
                .ThenBy(execution => execution.Id)
                .ToListAsync(cancellationToken);

            records.AddRange(selectorExecutions.Select(execution => MapSelectorExecution(execution, tenant, findings, errors)));
        }

        if (scope.HasFlag(StorageAdapterDataScope.ContextFacts))
        {
            var contextFacts = await dbContext.ContextFacts
                .AsNoTracking()
                .Where(fact => fact.TenantId == tenant.Id)
                .OrderBy(fact => fact.ObservedAtUtc)
                .ThenBy(fact => fact.Id)
                .ToListAsync(cancellationToken);

            records.AddRange(contextFacts.Select(fact => MapContextFact(fact, tenant, findings, errors)));
        }

        if (scope.HasFlag(StorageAdapterDataScope.Provenance))
        {
            var provenanceRows = await dbContext.ProvenanceMetadata
                .AsNoTracking()
                .Where(provenance => provenance.TenantId == tenant.Id)
                .OrderBy(provenance => provenance.ObservedAtUtc)
                .ThenBy(provenance => provenance.Id)
                .ToListAsync(cancellationToken);

            records.AddRange(provenanceRows.Select(provenance => MapProvenance(provenance, tenant, findings, errors)));
        }

        if (scope.HasFlag(StorageAdapterDataScope.AuditEvents))
        {
            var auditEvents = await dbContext.AuditEvents
                .AsNoTracking()
                .Where(auditEvent => auditEvent.TenantId == tenant.Id)
                .OrderBy(auditEvent => auditEvent.CreatedAtUtc)
                .ThenBy(auditEvent => auditEvent.Id)
                .ToListAsync(cancellationToken);

            records.AddRange(auditEvents.Select(auditEvent => MapAuditEvent(auditEvent, tenant, findings, errors)));
        }

        return records;
    }

    private static StoragePortableRecord MapSourceEvent(
        SourceSystemEvent sourceEvent,
        Tenant tenant,
        List<StorageMigrationValidationFinding> findings,
        List<ExtensionError> errors)
    {
        var recordId = sourceEvent.Id.ToString("D");
        var payload = ParseJsonObject(sourceEvent.PayloadJson, "source_system_event", recordId, "payloadJson", findings, errors);
        var metadata = CreateBaseMetadata("source_system_events", "source_system_event", recordId, tenant, sourceEvent.CreatedAtUtc, sourceEvent.UpdatedAtUtc);
        metadata["workspaceId"] = sourceEvent.WorkspaceId?.ToString("D");
        metadata["dataSourceId"] = sourceEvent.DataSourceId?.ToString("D");
        metadata["userProfileId"] = sourceEvent.UserProfileId?.ToString("D");
        metadata["externalUserId"] = sourceEvent.ExternalUserId;
        metadata["externalAccountId"] = sourceEvent.ExternalAccountId;
        metadata["eventType"] = sourceEvent.EventType;
        metadata["status"] = sourceEvent.Status.ToString();
        metadata["headers"] = ParseJsonObject(sourceEvent.HeadersJson, "source_system_event", recordId, "headersJson", findings, errors);
        metadata["processingSummary"] = sourceEvent.ProcessingSummary;
        metadata["errorMessage"] = sourceEvent.ErrorMessage;
        metadata["deadLetterReason"] = sourceEvent.DeadLetterReason;
        metadata["matchedSelectorCount"] = sourceEvent.MatchedSelectorCount;
        metadata["correlationId"] = sourceEvent.CorrelationId;
        metadata["receivedAtUtc"] = FormatUtc(sourceEvent.ReceivedAtUtc);
        metadata["processedAtUtc"] = FormatUtc(sourceEvent.ProcessedAtUtc);
        metadata["deadLetteredAtUtc"] = FormatUtc(sourceEvent.DeadLetteredAtUtc);

        return new StoragePortableRecord(
            "source_system_event",
            recordId,
            sourceEvent.SourceSystem,
            sourceEvent.EventId,
            sourceEvent.ObservedAtUtc,
            payload,
            new JsonArray
            {
                new JsonObject
                {
                    ["kind"] = "source_event",
                    ["sourceSystem"] = sourceEvent.SourceSystem,
                    ["sourceRecordId"] = sourceEvent.EventId,
                    ["correlationId"] = sourceEvent.CorrelationId
                }
            },
            metadata);
    }

    private static StoragePortableRecord MapUserSignal(
        UserSignal signal,
        Tenant tenant,
        List<StorageMigrationValidationFinding> findings,
        List<ExtensionError> errors)
    {
        var recordId = signal.Id.ToString("D");
        var payload = new JsonObject
        {
            ["key"] = signal.Key,
            ["value"] = ParseJsonNode(signal.ValueJson, "user_signal", recordId, "valueJson", findings, errors),
            ["valueType"] = signal.ValueType.ToString()
        };
        var metadata = CreateBaseMetadata("user_signals", "user_signal", recordId, tenant, signal.CreatedAtUtc, signal.UpdatedAtUtc);
        metadata["userProfileId"] = signal.UserProfileId.ToString("D");
        metadata["dataSourceId"] = signal.DataSourceId?.ToString("D");

        return new StoragePortableRecord(
            "user_signal",
            recordId,
            "scout-user-signals",
            signal.Id.ToString("D"),
            signal.ObservedAtUtc,
            payload,
            ParseJsonArray(signal.ProvenanceJson, "user_signal", recordId, "provenanceJson", findings, errors),
            metadata);
    }

    private static StoragePortableRecord MapSelectorExecution(
        SelectorExecution execution,
        Tenant tenant,
        List<StorageMigrationValidationFinding> findings,
        List<ExtensionError> errors)
    {
        var recordId = execution.Id.ToString("D");
        var observedAtUtc = execution.ResultObservedAtUtc
            ?? execution.CompletedAtUtc
            ?? execution.RequestedAtUtc;
        var payload = new JsonObject
        {
            ["resultValue"] = ParseJsonNode(execution.ResultValueJson, "selector_execution", recordId, "resultValueJson", findings, errors),
            ["rawSourceData"] = ParseJsonNode(execution.RawSourceDataJson, "selector_execution", recordId, "rawSourceDataJson", findings, errors),
            ["validationErrors"] = ParseJsonNode(execution.ValidationErrorsJson, "selector_execution", recordId, "validationErrorsJson", findings, errors),
            ["pipelineTrace"] = ParseJsonNode(execution.PipelineTraceJson, "selector_execution", recordId, "pipelineTraceJson", findings, errors)
        };
        var metadata = CreateBaseMetadata("selector_executions", "selector_execution", recordId, tenant, execution.CreatedAtUtc, execution.UpdatedAtUtc);
        metadata["selectorDefinitionId"] = execution.SelectorDefinitionId.ToString("D");
        metadata["userProfileId"] = execution.UserProfileId.ToString("D");
        metadata["correlationId"] = execution.CorrelationId;
        metadata["status"] = execution.Status.ToString();
        metadata["executionMode"] = execution.ExecutionMode.ToString();
        metadata["triggeredBy"] = execution.TriggeredBy;
        metadata["requestedAtUtc"] = FormatUtc(execution.RequestedAtUtc);
        metadata["startedAtUtc"] = FormatUtc(execution.StartedAtUtc);
        metadata["completedAtUtc"] = FormatUtc(execution.CompletedAtUtc);
        metadata["errorMessage"] = execution.ErrorMessage;
        metadata["resultValueType"] = execution.ResultValueType.ToString();
        metadata["resultConfidence"] = (double)execution.ResultConfidence;
        metadata["resultObservedAtUtc"] = FormatUtc(execution.ResultObservedAtUtc);
        metadata["resultExplanation"] = execution.ResultExplanation;

        return new StoragePortableRecord(
            "selector_execution",
            recordId,
            "scout-selectors",
            execution.SelectorDefinitionId.ToString("D"),
            observedAtUtc,
            payload,
            ParseJsonArray(execution.ResultProvenanceJson, "selector_execution", recordId, "resultProvenanceJson", findings, errors),
            metadata);
    }

    private static StoragePortableRecord MapContextFact(
        ContextFact fact,
        Tenant tenant,
        List<StorageMigrationValidationFinding> findings,
        List<ExtensionError> errors)
    {
        var recordId = fact.Id.ToString("D");
        var payload = new JsonObject
        {
            ["attributeKey"] = fact.AttributeKey,
            ["value"] = ParseJsonNode(fact.ValueJson, "context_fact", recordId, "valueJson", findings, errors),
            ["valueType"] = fact.ValueType.ToString()
        };
        var metadata = CreateBaseMetadata("context_facts", "context_fact", recordId, tenant, fact.CreatedAtUtc, fact.UpdatedAtUtc);
        metadata["contextSnapshotId"] = fact.ContextSnapshotId.ToString("D");
        metadata["semanticAttributeDefinitionId"] = fact.SemanticAttributeDefinitionId.ToString("D");
        metadata["sourceSelectorDefinitionId"] = fact.SourceSelectorDefinitionId.ToString("D");
        metadata["confidence"] = (double)fact.Confidence;
        metadata["explanation"] = fact.Explanation;
        metadata["freshUntilUtc"] = FormatUtc(fact.FreshUntilUtc);

        return new StoragePortableRecord(
            "context_fact",
            recordId,
            "scout-context",
            fact.AttributeKey,
            fact.ObservedAtUtc,
            payload,
            ParseJsonArray(fact.ProvenanceJson, "context_fact", recordId, "provenanceJson", findings, errors),
            metadata);
    }

    private static StoragePortableRecord MapProvenance(
        ProvenanceMetadata provenance,
        Tenant tenant,
        List<StorageMigrationValidationFinding> findings,
        List<ExtensionError> errors)
    {
        var recordId = provenance.Id.ToString("D");
        var payload = ParseJsonObject(provenance.MetadataJson, "provenance_metadata", recordId, "metadataJson", findings, errors);
        var metadata = CreateBaseMetadata("provenance_metadata", "provenance_metadata", recordId, tenant, provenance.CreatedAtUtc, provenance.UpdatedAtUtc);
        metadata["selectorExecutionId"] = provenance.SelectorExecutionId?.ToString("D");
        metadata["contextFactId"] = provenance.ContextFactId?.ToString("D");
        metadata["kind"] = provenance.Kind;

        return new StoragePortableRecord(
            "provenance_metadata",
            recordId,
            provenance.SourceSystem,
            provenance.SourceRecordKey,
            provenance.ObservedAtUtc,
            payload,
            new JsonArray
            {
                new JsonObject
                {
                    ["kind"] = provenance.Kind,
                    ["sourceSystem"] = provenance.SourceSystem,
                    ["sourceRecordKey"] = provenance.SourceRecordKey,
                    ["selectorExecutionId"] = provenance.SelectorExecutionId?.ToString("D"),
                    ["contextFactId"] = provenance.ContextFactId?.ToString("D")
                }
            },
            metadata);
    }

    private static StoragePortableRecord MapAuditEvent(
        AuditEvent auditEvent,
        Tenant tenant,
        List<StorageMigrationValidationFinding> findings,
        List<ExtensionError> errors)
    {
        var recordId = auditEvent.Id.ToString("D");
        var payload = new JsonObject
        {
            ["metadata"] = ParseJsonObject(auditEvent.MetadataJson, "audit_event", recordId, "metadataJson", findings, errors),
            ["before"] = ParseOptionalJsonNode(auditEvent.BeforeJson, "audit_event", recordId, "beforeJson", findings, errors),
            ["after"] = ParseOptionalJsonNode(auditEvent.AfterJson, "audit_event", recordId, "afterJson", findings, errors)
        };
        var metadata = CreateBaseMetadata("audit_events", "audit_event", recordId, tenant, auditEvent.CreatedAtUtc, auditEvent.CreatedAtUtc);
        metadata["actor"] = auditEvent.Actor;
        metadata["action"] = auditEvent.Action;
        metadata["entityType"] = auditEvent.EntityType;
        metadata["entityId"] = auditEvent.EntityId;
        metadata["correlationId"] = auditEvent.CorrelationId;

        return new StoragePortableRecord(
            "audit_event",
            recordId,
            "scout-audit",
            auditEvent.EntityId,
            auditEvent.CreatedAtUtc,
            payload,
            new JsonArray
            {
                new JsonObject
                {
                    ["actor"] = auditEvent.Actor,
                    ["action"] = auditEvent.Action,
                    ["entityType"] = auditEvent.EntityType,
                    ["entityId"] = auditEvent.EntityId,
                    ["correlationId"] = auditEvent.CorrelationId
                }
            },
            metadata);
    }

    private static JsonObject CreateBaseMetadata(
        string sourceTable,
        string entityType,
        string recordId,
        Tenant tenant,
        DateTime createdAtUtc,
        DateTime updatedAtUtc)
        => new()
        {
            ["contractVersion"] = ExportContractVersion,
            ["adapterKey"] = StorageAdapterProviderKeys.ScoutPostgres,
            ["sourceTable"] = sourceTable,
            ["tenantContext"] = new JsonObject
            {
                ["tenantId"] = tenant.Id.ToString("D"),
                ["tenantSlug"] = tenant.Slug,
                ["layer"] = tenant.Slug
            },
            ["fortressAnchor"] = new JsonObject
            {
                ["entity_type"] = entityType,
                ["postgres_pk"] = $"{sourceTable}:{recordId}",
                ["layer"] = tenant.Slug
            },
            ["createdAtUtc"] = FormatUtc(createdAtUtc),
            ["updatedAtUtc"] = FormatUtc(updatedAtUtc),
            ["usesCloudDataPlane"] = false
        };

    private static StorageExportBatch CreateExportBatch(
        StorageExportRequest request,
        IReadOnlyList<StoragePortableRecord> checkedRecords,
        IReadOnlyList<StoragePortableRecord> selectedRecords,
        IReadOnlyList<ExtensionError> errors,
        IReadOnlyList<StorageMigrationValidationFinding> findings,
        string? nextCheckpoint,
        bool isFinal)
    {
        var countsByKind = checkedRecords
            .GroupBy(static record => record.RecordKind, StringComparer.Ordinal)
            .ToDictionary(static group => group.Key, static group => group.Count(), StringComparer.Ordinal);
        var validationReport = new StorageMigrationValidationReport(
            ExportContractVersion,
            findings.All(static finding => finding.Severity != StorageMigrationValidationSeverity.Error),
            DateTime.UtcNow,
            checkedRecords.Count,
            checkedRecords.Count,
            0,
            countsByKind,
            findings.ToList());

        return new StorageExportBatch(
            $"scout-export-{Guid.NewGuid():N}",
            request.Scope,
            selectedRecords,
            nextCheckpoint,
            isFinal,
            errors,
            new JsonObject
            {
                ["adapterKey"] = StorageAdapterProviderKeys.ScoutPostgres,
                ["contractVersion"] = ExportContractVersion,
                ["quietMigrationMode"] = request.QuietMigrationMode,
                ["dryRun"] = request.DryRun,
                ["usesCloudDataPlane"] = false,
                ["checkedRecordCount"] = checkedRecords.Count,
                ["returnedRecordCount"] = selectedRecords.Count,
                ["countsByRecordKind"] = CountsToJsonObject(countsByKind)
            },
            validationReport);
    }

    private static int? ResolveStartIndex(
        string? checkpoint,
        IReadOnlyList<StoragePortableRecord> orderedRecords,
        List<StorageMigrationValidationFinding> findings,
        List<ExtensionError> errors)
    {
        if (string.IsNullOrWhiteSpace(checkpoint))
        {
            return 0;
        }

        if (!TryDecodeCheckpoint(checkpoint, out var decodedCheckpoint))
        {
            AddFinding(
                findings,
                errors,
                StorageMigrationValidationSeverity.Error,
                "checkpoint.invalid",
                "The supplied export checkpoint could not be decoded.",
                target: nameof(checkpoint));
            return null;
        }

        var index = orderedRecords
            .Select((record, recordIndex) => new { record, recordIndex })
            .FirstOrDefault(candidate =>
                string.Equals(candidate.record.RecordKind, decodedCheckpoint.RecordKind, StringComparison.Ordinal)
                && string.Equals(candidate.record.RecordId, decodedCheckpoint.RecordId, StringComparison.Ordinal));

        if (index is null)
        {
            AddFinding(
                findings,
                errors,
                StorageMigrationValidationSeverity.Error,
                "checkpoint.not_found",
                "The supplied export checkpoint does not match a record in the current local Scout export set.",
                target: nameof(checkpoint));
            return null;
        }

        return index.recordIndex + 1;
    }

    private static string EncodeCheckpoint(StoragePortableRecord record)
    {
        var checkpointJson = JsonSerializer.Serialize(new ScoutExportCheckpoint(record.RecordKind, record.RecordId));
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(checkpointJson));
    }

    private static bool TryDecodeCheckpoint(string checkpoint, out ScoutExportCheckpoint decodedCheckpoint)
    {
        decodedCheckpoint = new ScoutExportCheckpoint(string.Empty, string.Empty);

        try
        {
            var json = Encoding.UTF8.GetString(Convert.FromBase64String(checkpoint));
            var parsed = JsonSerializer.Deserialize<ScoutExportCheckpoint>(json);
            if (parsed is null || string.IsNullOrWhiteSpace(parsed.RecordKind) || string.IsNullOrWhiteSpace(parsed.RecordId))
            {
                return false;
            }

            decodedCheckpoint = parsed;
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static JsonNode? ParseOptionalJsonNode(
        string? json,
        string recordKind,
        string recordId,
        string target,
        List<StorageMigrationValidationFinding> findings,
        List<ExtensionError> errors)
        => string.IsNullOrWhiteSpace(json)
            ? null
            : ParseJsonNode(json, recordKind, recordId, target, findings, errors);

    private static JsonObject ParseJsonObject(
        string json,
        string recordKind,
        string recordId,
        string target,
        List<StorageMigrationValidationFinding> findings,
        List<ExtensionError> errors)
    {
        var parsed = ParseJsonNode(json, recordKind, recordId, target, findings, errors);
        if (parsed is JsonObject parsedObject)
        {
            return parsedObject;
        }

        AddFinding(
            findings,
            errors,
            StorageMigrationValidationSeverity.Error,
            "json.expected_object",
            "The migration export expected a JSON object.",
            recordKind,
            recordId,
            target);

        return new JsonObject
        {
            ["_invalidJsonKind"] = parsed?.GetValueKind().ToString() ?? "null"
        };
    }

    private static JsonArray ParseJsonArray(
        string json,
        string recordKind,
        string recordId,
        string target,
        List<StorageMigrationValidationFinding> findings,
        List<ExtensionError> errors)
    {
        var parsed = ParseJsonNode(json, recordKind, recordId, target, findings, errors);
        if (parsed is JsonArray parsedArray)
        {
            return parsedArray;
        }

        AddFinding(
            findings,
            errors,
            StorageMigrationValidationSeverity.Error,
            "json.expected_array",
            "The migration export expected a JSON array.",
            recordKind,
            recordId,
            target);

        return [];
    }

    private static JsonNode? ParseJsonNode(
        string json,
        string recordKind,
        string recordId,
        string target,
        List<StorageMigrationValidationFinding> findings,
        List<ExtensionError> errors)
    {
        try
        {
            return JsonNode.Parse(string.IsNullOrWhiteSpace(json) ? "null" : json);
        }
        catch (JsonException exception)
        {
            AddFinding(
                findings,
                errors,
                StorageMigrationValidationSeverity.Error,
                "json.invalid",
                $"The migration export could not parse JSON for {target}: {exception.Message}",
                recordKind,
                recordId,
                target);

            return new JsonObject
            {
                ["_rawJson"] = json
            };
        }
    }

    private static void AddFinding(
        List<StorageMigrationValidationFinding> findings,
        List<ExtensionError> errors,
        StorageMigrationValidationSeverity severity,
        string code,
        string message,
        string? recordKind = null,
        string? recordId = null,
        string? target = null)
    {
        findings.Add(new StorageMigrationValidationFinding(severity, code, message, recordKind, recordId, target));

        if (severity == StorageMigrationValidationSeverity.Error)
        {
            errors.Add(new ExtensionError(
                ExtensionErrorCode.ValidationFailed,
                message,
                target ?? recordId ?? recordKind ?? code));
        }
    }

    private static JsonObject CountsToJsonObject(IReadOnlyDictionary<string, int> counts)
    {
        var result = new JsonObject();
        foreach (var (key, value) in counts)
        {
            result[key] = value;
        }

        return result;
    }

    private static string? FormatUtc(DateTime? value)
        => value.HasValue ? FormatUtc(value.Value) : null;

    private static string FormatUtc(DateTime value)
        => value.Kind == DateTimeKind.Utc
            ? value.ToString("O")
            : DateTime.SpecifyKind(value, DateTimeKind.Utc).ToString("O");

    private sealed record ScoutExportCheckpoint(string RecordKind, string RecordId);
}
