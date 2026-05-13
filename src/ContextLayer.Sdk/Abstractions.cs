namespace ContextLayer.Sdk;

public interface IContextLayerClient
{
    IContextLayerAuthClient Auth { get; }
    IContextLayerUsersClient Users { get; }
    IContextLayerAccountsClient Accounts { get; }
    IContextLayerSnapshotsClient Snapshots { get; }
    IContextLayerFactsClient Facts { get; }
    IContextLayerSelectorsClient Selectors { get; }
    IContextLayerRecomputeClient Recompute { get; }
    IContextLayerPackagesClient Packages { get; }
    IContextLayerAuditClient Audit { get; }
    IContextLayerEventsClient Events { get; }
    IContextLayerTenantClient ForTenant(string tenantSlug);
}

public interface IContextLayerTenantClient
{
    string TenantSlug { get; }
    IScopedUsersClient Users { get; }
    IScopedAccountsClient Accounts { get; }
    IScopedSnapshotsClient Snapshots { get; }
    IScopedFactsClient Facts { get; }
    IScopedRecomputeClient Recompute { get; }
    IScopedPackagesClient Packages { get; }
    IScopedAuditClient Audit { get; }
    IScopedEventsClient Events { get; }
}

public interface IContextLayerAuthClient
{
    Task<AuthSession> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<MachineTokenResponse> GetMachineTokenAsync(MachineTokenRequest request, CancellationToken cancellationToken = default);
    Task<AuthenticatedOperator> GetCurrentOperatorAsync(CancellationToken cancellationToken = default);
}

public interface IContextLayerUsersClient
{
    Task<ContextProfileResult?> GetContextAsync(string tenantSlug, string externalUserId, CancellationToken cancellationToken = default);
}

public interface IContextLayerAccountsClient
{
    Task<AccountContextResult?> GetContextAsync(string tenantSlug, string externalAccountId, CancellationToken cancellationToken = default);
}

public interface IContextLayerSnapshotsClient
{
    Task<ContextSnapshotResult?> GetByIdAsync(string tenantSlug, Guid snapshotId, CancellationToken cancellationToken = default);
    Task<ContextSnapshotSummary?> GetLatestForUserAsync(string tenantSlug, string externalUserId, CancellationToken cancellationToken = default);
    Task<ContextSnapshotSummary?> GetLatestForAccountAsync(string tenantSlug, string externalAccountId, CancellationToken cancellationToken = default);
}

public interface IContextLayerFactsClient
{
    Task<IReadOnlyList<ContextFactResult>> GetForUserAsync(string tenantSlug, string externalUserId, ContextFactLookupOptions? options = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ContextFactResult>> GetForAccountAsync(string tenantSlug, string externalAccountId, ContextFactLookupOptions? options = null, CancellationToken cancellationToken = default);
}

public interface IContextLayerSelectorsClient
{
    Task<SelectorExecutionPreviewResult> PreviewAsync(PreviewSelectorInput input, CancellationToken cancellationToken = default);
    Task<SelectorValidationResult> ValidateAsync(ValidateSelectorInput input, CancellationToken cancellationToken = default);
}

public interface IContextLayerRecomputeClient
{
    Task<QueueRecomputeResult> QueueForUserAsync(string tenantSlug, string externalUserId, string triggeredBy, CancellationToken cancellationToken = default);
}

public interface IContextLayerPackagesClient
{
    Task<SalesContextPackageResult?> GetAiContextForUserAsync(string tenantSlug, string externalUserId, string salesObjective, CancellationToken cancellationToken = default);
}

public interface IContextLayerAuditClient
{
    Task<IReadOnlyList<AuditEvent>> GetEventsAsync(string tenantSlug, CancellationToken cancellationToken = default);
}

public interface IContextLayerEventsClient
{
    Task<SourceSystemEventAcceptedResult> IngestSourceSystemEventAsync(string tenantSlug, SourceSystemEventRequest request, CancellationToken cancellationToken = default);
}

public interface IScopedUsersClient
{
    Task<ContextProfileResult?> GetContextAsync(string externalUserId, CancellationToken cancellationToken = default);
}

public interface IScopedAccountsClient
{
    Task<AccountContextResult?> GetContextAsync(string externalAccountId, CancellationToken cancellationToken = default);
}

public interface IScopedSnapshotsClient
{
    Task<ContextSnapshotResult?> GetByIdAsync(Guid snapshotId, CancellationToken cancellationToken = default);
    Task<ContextSnapshotSummary?> GetLatestForUserAsync(string externalUserId, CancellationToken cancellationToken = default);
    Task<ContextSnapshotSummary?> GetLatestForAccountAsync(string externalAccountId, CancellationToken cancellationToken = default);
}

public interface IScopedFactsClient
{
    Task<IReadOnlyList<ContextFactResult>> GetForUserAsync(string externalUserId, ContextFactLookupOptions? options = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ContextFactResult>> GetForAccountAsync(string externalAccountId, ContextFactLookupOptions? options = null, CancellationToken cancellationToken = default);
}

public interface IScopedRecomputeClient
{
    Task<QueueRecomputeResult> QueueForUserAsync(string externalUserId, string triggeredBy, CancellationToken cancellationToken = default);
}

public interface IScopedPackagesClient
{
    Task<SalesContextPackageResult?> GetAiContextForUserAsync(string externalUserId, string salesObjective, CancellationToken cancellationToken = default);
}

public interface IScopedAuditClient
{
    Task<IReadOnlyList<AuditEvent>> GetEventsAsync(CancellationToken cancellationToken = default);
}

public interface IScopedEventsClient
{
    Task<SourceSystemEventAcceptedResult> IngestSourceSystemEventAsync(SourceSystemEventRequest request, CancellationToken cancellationToken = default);
}
