using System.Text.Json.Nodes;

namespace KynticAI.Scout.Application.Abstractions;

public static class StorageAdapterProviderKeys
{
    public const string Disabled = "disabled";
    public const string ScoutPostgres = "scout-postgres";
    public const string EnterpriseRuntime = "enterprise-runtime";
    public const string DualWrite = "dual-write";
}

[Flags]
public enum StorageAdapterDataScope
{
    None = 0,
    SourceEvents = 1,
    UserSignals = 2,
    SelectorExecutions = 4,
    ContextFacts = 8,
    Provenance = 16,
    DataItems = 32,
    RelationshipSets = 64,
    AttributionPaths = 128,
    OutcomeEvents = 256,
    Vectors = 512,
    AuditEvents = 1024,
    SelectorDefinitions = 2048,
    ContextSnapshots = 4096,
    TenantMetadata = 8192,
    All = SourceEvents
        | UserSignals
        | SelectorExecutions
        | ContextFacts
        | Provenance
        | DataItems
        | RelationshipSets
        | AttributionPaths
        | OutcomeEvents
        | Vectors
        | AuditEvents
        | SelectorDefinitions
        | ContextSnapshots
        | TenantMetadata
}

public enum StorageAdapterReadiness
{
    Available = 0,
    Degraded = 1,
    Unproven = 2,
    Disabled = 3,
    Unavailable = 4
}

public enum StorageVectorWriteStatus
{
    Written = 0,
    Skipped = 1,
    Failed = 2
}

public sealed record StorageAdapterRequestContext(
    TenantContext Tenant,
    string Purpose,
    string CorrelationId,
    string? IdempotencyKey = null,
    EnterpriseActorContext? Actor = null,
    JsonObject? Metadata = null);

public sealed record StorageAdapterCapabilitiesRequest(
    StorageAdapterRequestContext Context);

public sealed record StorageAdapterCapabilities(
    string AdapterKey,
    string ProviderKind,
    string VectorProviderKind,
    StorageAdapterDataScope SupportedScopes,
    bool SupportsExport,
    bool SupportsImport,
    bool SupportsBackfill,
    bool SupportsVectorWrites,
    bool SupportsDenseEmbeddings,
    bool SupportsDualWrite,
    bool UsesCustomerOwnedDataPlane,
    bool UsesCloudDataPlane,
    bool RequiresEnterpriseRuntime,
    int? ExpectedEmbeddingDimensions,
    IReadOnlyList<string> RequiredConfigurationKeys,
    IReadOnlyList<string> Notes);

public sealed record StorageAdapterHealthRequest(
    StorageAdapterRequestContext Context);

public sealed record StorageAdapterHealthResult(
    string AdapterKey,
    StorageAdapterReadiness Readiness,
    string Status,
    DateTime CheckedAtUtc,
    IReadOnlyList<ExtensionError> Errors,
    JsonObject Diagnostics);

public sealed record StoragePortableRecord(
    string RecordKind,
    string RecordId,
    string SourceSystem,
    string SourceRecordId,
    DateTime ObservedAtUtc,
    JsonObject Payload,
    JsonArray Provenance,
    JsonObject Metadata);

public enum StorageMigrationValidationSeverity
{
    Info = 0,
    Warning = 1,
    Error = 2
}

public sealed record StorageMigrationValidationFinding(
    StorageMigrationValidationSeverity Severity,
    string Code,
    string Message,
    string? RecordKind = null,
    string? RecordId = null,
    string? Target = null);

public sealed record StorageMigrationValidationReport(
    string ContractVersion,
    bool IsValid,
    DateTime GeneratedAtUtc,
    int CheckedRecords,
    int ExportableRecords,
    int SkippedRecords,
    IReadOnlyDictionary<string, int> CountsByRecordKind,
    IReadOnlyList<StorageMigrationValidationFinding> Findings);

public sealed record StorageExportRequest(
    StorageAdapterRequestContext Context,
    StorageAdapterDataScope Scope,
    string? Checkpoint = null,
    int MaxRecords = 500,
    bool QuietMigrationMode = true,
    bool DryRun = false);

public sealed record StorageExportBatch(
    string BatchId,
    StorageAdapterDataScope Scope,
    IReadOnlyList<StoragePortableRecord> Records,
    string? NextCheckpoint,
    bool IsFinal,
    IReadOnlyList<ExtensionError> Errors,
    JsonObject Diagnostics,
    StorageMigrationValidationReport? ValidationReport = null);

public sealed record StorageImportRequest(
    StorageAdapterRequestContext Context,
    StorageAdapterDataScope Scope,
    IReadOnlyList<StoragePortableRecord> Records,
    bool QuietMigrationMode = true,
    string? Checkpoint = null,
    bool DryRun = false);

public sealed record StorageImportResult(
    bool Succeeded,
    string AdapterKey,
    StorageAdapterDataScope Scope,
    int ImportedRecords,
    int SkippedRecords,
    string? NextCheckpoint,
    IReadOnlyList<ExtensionError> Errors,
    JsonObject Diagnostics);

public sealed record StorageVectorRecord(
    string Id,
    string EntityType,
    string PostgresPk,
    string Layer,
    IReadOnlyList<float>? Embedding,
    JsonObject Metadata,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);

public sealed record StorageVectorWriteRequest(
    StorageAdapterRequestContext Context,
    StorageVectorRecord Record,
    bool AllowNullEmbedding = false,
    string? TargetProvider = null);

public sealed record StorageVectorWriteResult(
    StorageVectorWriteStatus Status,
    string ProviderKey,
    string RecordId,
    int WrittenRecords,
    string? Reason,
    IReadOnlyList<ExtensionError> Errors,
    JsonObject Diagnostics);

public interface ILocalDataPlaneStorageAdapterResolver
{
    string DefaultProviderKey { get; }

    IReadOnlyList<string> RegisteredProviderKeys { get; }

    ILocalDataPlaneStorageAdapter? Resolve(string? providerKey = null);

    ILocalDataPlaneStorageAdapter GetRequiredAdapter(string? providerKey = null);
}

public interface ILocalDataPlaneStorageAdapter
{
    string AdapterKey { get; }

    ValueTask<StorageAdapterCapabilities> GetCapabilitiesAsync(
        StorageAdapterCapabilitiesRequest request,
        CancellationToken cancellationToken = default);

    ValueTask<StorageAdapterHealthResult> CheckHealthAsync(
        StorageAdapterHealthRequest request,
        CancellationToken cancellationToken = default);

    IAsyncEnumerable<StorageExportBatch> ExportAsync(
        StorageExportRequest request,
        CancellationToken cancellationToken = default);

    ValueTask<StorageImportResult> ImportAsync(
        StorageImportRequest request,
        CancellationToken cancellationToken = default);

    ValueTask<StorageVectorWriteResult> WriteVectorAsync(
        StorageVectorWriteRequest request,
        CancellationToken cancellationToken = default);
}
