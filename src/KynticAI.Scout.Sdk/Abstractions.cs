namespace KynticAI.Scout.Sdk;

public interface IScoutClient
{
    IScoutAuthClient Auth { get; }
    IScoutUsersClient Users { get; }
    IScoutAccountsClient Accounts { get; }
    IScoutSnapshotsClient Snapshots { get; }
    IScoutFactsClient Facts { get; }
    IScoutSelectorsClient Selectors { get; }
    IScoutRecomputeClient Recompute { get; }
    IScoutPackagesClient Packages { get; }
    IScoutAuditClient Audit { get; }
    IScoutEventsClient Events { get; }
    IScoutTenantClient ForTenant(string tenantSlug);
}

public interface IScoutTenantClient
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

public interface IScoutAuthClient
{
    Task<AuthSession> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<MachineTokenResponse> GetMachineTokenAsync(MachineTokenRequest request, CancellationToken cancellationToken = default);
    Task<AuthenticatedOperator> GetCurrentOperatorAsync(CancellationToken cancellationToken = default);
}

public interface IScoutUsersClient
{
    Task<ContextProfileResult?> GetContextAsync(string tenantSlug, string externalUserId, CancellationToken cancellationToken = default);
}

public interface IScoutAccountsClient
{
    Task<AccountContextResult?> GetContextAsync(string tenantSlug, string externalAccountId, CancellationToken cancellationToken = default);
}

public interface IScoutSnapshotsClient
{
    Task<ContextSnapshotResult?> GetByIdAsync(string tenantSlug, Guid snapshotId, CancellationToken cancellationToken = default);
    Task<ContextSnapshotSummary?> GetLatestForUserAsync(string tenantSlug, string externalUserId, CancellationToken cancellationToken = default);
    Task<ContextSnapshotSummary?> GetLatestForAccountAsync(string tenantSlug, string externalAccountId, CancellationToken cancellationToken = default);
}

public interface IScoutFactsClient
{
    Task<IReadOnlyList<ContextFactResult>> GetForUserAsync(string tenantSlug, string externalUserId, ContextFactLookupOptions? options = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ContextFactResult>> GetForAccountAsync(string tenantSlug, string externalAccountId, ContextFactLookupOptions? options = null, CancellationToken cancellationToken = default);
}

public interface IScoutSelectorsClient
{
    Task<SelectorExecutionPreviewResult> PreviewAsync(PreviewSelectorInput input, CancellationToken cancellationToken = default);
    Task<SelectorValidationResult> ValidateAsync(ValidateSelectorInput input, CancellationToken cancellationToken = default);
}

public interface IScoutRecomputeClient
{
    Task<QueueRecomputeResult> QueueForUserAsync(string tenantSlug, string externalUserId, string triggeredBy, CancellationToken cancellationToken = default);
}

public interface IScoutPackagesClient
{
    Task<SalesContextPackageResult?> GetAiContextForUserAsync(string tenantSlug, string externalUserId, string salesObjective, CancellationToken cancellationToken = default);
}

public interface IScoutAuditClient
{
    Task<IReadOnlyList<AuditEvent>> GetEventsAsync(string tenantSlug, CancellationToken cancellationToken = default);
}

public interface IScoutEventsClient
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
