namespace ContextLayer.Sdk;

public sealed class ContextLayerClient : IContextLayerClient, IDisposable
{
    private readonly HttpClient httpClient;
    private readonly bool ownsHttpClient;

    public ContextLayerClient(ContextLayerClientOptions options)
        : this(new HttpClient(), options, ownsHttpClient: true)
    {
    }

    public ContextLayerClient(HttpClient httpClient, ContextLayerClientOptions options)
        : this(httpClient, options, ownsHttpClient: false)
    {
    }

    private ContextLayerClient(HttpClient httpClient, ContextLayerClientOptions options, bool ownsHttpClient)
    {
        this.httpClient = httpClient;
        this.ownsHttpClient = ownsHttpClient;
        var pipeline = new ContextLayerHttpPipeline(httpClient, options);
        Auth = new ContextLayerAuthClient(pipeline);
        Users = new ContextLayerUsersClient(pipeline);
        Accounts = new ContextLayerAccountsClient(pipeline);
        Snapshots = new ContextLayerSnapshotsClient(Users, Accounts, pipeline);
        Facts = new ContextLayerFactsClient(pipeline);
        Selectors = new ContextLayerSelectorsClient(pipeline);
        Recompute = new ContextLayerRecomputeClient(pipeline);
        Packages = new ContextLayerPackagesClient(pipeline);
        Audit = new ContextLayerAuditClient(pipeline);
        Events = new ContextLayerEventsClient(pipeline);
    }

    public IContextLayerAuthClient Auth { get; }

    public IContextLayerUsersClient Users { get; }

    public IContextLayerAccountsClient Accounts { get; }

    public IContextLayerSnapshotsClient Snapshots { get; }

    public IContextLayerFactsClient Facts { get; }

    public IContextLayerSelectorsClient Selectors { get; }

    public IContextLayerRecomputeClient Recompute { get; }

    public IContextLayerPackagesClient Packages { get; }

    public IContextLayerAuditClient Audit { get; }

    public IContextLayerEventsClient Events { get; }

    public IContextLayerTenantClient ForTenant(string tenantSlug)
        => new ContextLayerTenantClient(
            tenantSlug,
            Users,
            Accounts,
            Snapshots,
            Facts,
            Recompute,
            Packages,
            Audit,
            Events);

    public void Dispose()
    {
        if (ownsHttpClient)
        {
            httpClient.Dispose();
        }
    }
}

internal sealed class ContextLayerAuthClient(ContextLayerHttpPipeline pipeline) : IContextLayerAuthClient
{
    public Task<AuthSession> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
        => pipeline.SendAsync<AuthSession>(HttpMethod.Post, "/api/auth/login", request, cancellationToken);

    public Task<MachineTokenResponse> GetMachineTokenAsync(MachineTokenRequest request, CancellationToken cancellationToken = default)
        => pipeline.SendAsync<MachineTokenResponse>(HttpMethod.Post, "/api/auth/token", request, cancellationToken);

    public Task<AuthenticatedOperator> GetCurrentOperatorAsync(CancellationToken cancellationToken = default)
        => pipeline.SendAsync<AuthenticatedOperator>(HttpMethod.Get, "/api/auth/me", null, cancellationToken);
}

internal sealed class ContextLayerUsersClient(ContextLayerHttpPipeline pipeline) : IContextLayerUsersClient
{
    public Task<ContextProfileResult?> GetContextAsync(string tenantSlug, string externalUserId, CancellationToken cancellationToken = default)
        => pipeline.SendAsync<ContextProfileResult?>(
            HttpMethod.Get,
            $"/api/v1/context/users/{Uri.EscapeDataString(externalUserId)}?tenantSlug={Uri.EscapeDataString(tenantSlug)}",
            null,
            cancellationToken);
}

internal sealed class ContextLayerAccountsClient(ContextLayerHttpPipeline pipeline) : IContextLayerAccountsClient
{
    public Task<AccountContextResult?> GetContextAsync(string tenantSlug, string externalAccountId, CancellationToken cancellationToken = default)
        => pipeline.SendAsync<AccountContextResult?>(
            HttpMethod.Get,
            $"/api/v1/context/accounts/{Uri.EscapeDataString(externalAccountId)}?tenantSlug={Uri.EscapeDataString(tenantSlug)}",
            null,
            cancellationToken);
}

internal sealed class ContextLayerSnapshotsClient(
    IContextLayerUsersClient usersClient,
    IContextLayerAccountsClient accountsClient,
    ContextLayerHttpPipeline pipeline) : IContextLayerSnapshotsClient
{
    public Task<ContextSnapshotResult?> GetByIdAsync(string tenantSlug, Guid snapshotId, CancellationToken cancellationToken = default)
        => pipeline.SendAsync<ContextSnapshotResult?>(
            HttpMethod.Get,
            $"/api/v1/context/snapshots/{Uri.EscapeDataString(snapshotId.ToString())}?tenantSlug={Uri.EscapeDataString(tenantSlug)}",
            null,
            cancellationToken);

    public async Task<ContextSnapshotSummary?> GetLatestForUserAsync(string tenantSlug, string externalUserId, CancellationToken cancellationToken = default)
    {
        var context = await usersClient.GetContextAsync(tenantSlug, externalUserId, cancellationToken);
        if (context is null)
        {
            return null;
        }

        return new ContextSnapshotSummary(
            context.SnapshotId,
            context.History.FirstOrDefault(x => x.SnapshotId == context.SnapshotId)?.SnapshotVersion ?? 0,
            context.Summary,
            context.OverallConfidence,
            context.GeneratedAtUtc,
            context.IsStale,
            context.Facts.Count);
    }

    public async Task<ContextSnapshotSummary?> GetLatestForAccountAsync(string tenantSlug, string externalAccountId, CancellationToken cancellationToken = default)
    {
        var context = await accountsClient.GetContextAsync(tenantSlug, externalAccountId, cancellationToken);
        if (context is null)
        {
            return null;
        }

        var latestUser = context.Users
            .Where(x => x.LatestSnapshotId.HasValue && x.GeneratedAtUtc.HasValue)
            .OrderByDescending(x => x.GeneratedAtUtc)
            .FirstOrDefault();
        if (latestUser?.LatestSnapshotId is null)
        {
            return null;
        }

        var snapshot = await GetByIdAsync(tenantSlug, latestUser.LatestSnapshotId.Value, cancellationToken);
        return snapshot is null
            ? new ContextSnapshotSummary(
                latestUser.LatestSnapshotId.Value,
                0,
                latestUser.Summary ?? string.Empty,
                latestUser.OverallConfidence ?? 0,
                latestUser.GeneratedAtUtc ?? DateTime.MinValue,
                latestUser.IsStale,
                0)
            : new ContextSnapshotSummary(
                snapshot.SnapshotId,
                snapshot.SnapshotVersion,
                snapshot.Summary,
                snapshot.OverallConfidence,
                snapshot.GeneratedAtUtc,
                snapshot.IsStale,
                snapshot.Facts.Count);
    }
}

internal sealed class ContextLayerFactsClient(ContextLayerHttpPipeline pipeline) : IContextLayerFactsClient
{
    public async Task<IReadOnlyList<ContextFactResult>> GetForUserAsync(
        string tenantSlug,
        string externalUserId,
        ContextFactLookupOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        var page = await pipeline.SendAsync<PageResult<ContextFactResult>>(
            HttpMethod.Get,
            $"/api/v1/context/users/{Uri.EscapeDataString(externalUserId)}/facts{BuildFactQuery(tenantSlug, options)}",
            null,
            cancellationToken);
        return page.Items;
    }

    public async Task<IReadOnlyList<ContextFactResult>> GetForAccountAsync(
        string tenantSlug,
        string externalAccountId,
        ContextFactLookupOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        var page = await pipeline.SendAsync<PageResult<ContextFactResult>>(
            HttpMethod.Get,
            $"/api/v1/context/accounts/{Uri.EscapeDataString(externalAccountId)}/facts{BuildFactQuery(tenantSlug, options)}",
            null,
            cancellationToken);
        return page.Items;
    }

    private static string BuildFactQuery(string tenantSlug, ContextFactLookupOptions? options)
    {
        var values = new List<string>
        {
            "tenantSlug=" + Uri.EscapeDataString(tenantSlug)
        };
        if (!string.IsNullOrWhiteSpace(options?.AttributeKey))
        {
            values.Add("attributeKey=" + Uri.EscapeDataString(options.AttributeKey));
        }
        if (options?.Page is not null)
        {
            values.Add("page=" + options.Page.Value.ToString(System.Globalization.CultureInfo.InvariantCulture));
        }
        if (options?.PageSize is not null)
        {
            values.Add("pageSize=" + options.PageSize.Value.ToString(System.Globalization.CultureInfo.InvariantCulture));
        }

        return "?" + string.Join("&", values);
    }
}

internal sealed class ContextLayerSelectorsClient(ContextLayerHttpPipeline pipeline) : IContextLayerSelectorsClient
{
    public async Task<SelectorExecutionPreviewResult> PreviewAsync(PreviewSelectorInput input, CancellationToken cancellationToken = default)
        => await pipeline.SendGraphQlAsync<SelectorExecutionPreviewResult>(
            "PreviewSelector",
            """
            mutation PreviewSelector($input: PreviewSelectorInput!) {
              previewSelector(input: $input) {
                mode
                isSuccess
                selectorName
                rawSourceDataJson
                normalizedSourceDataJson
                validationErrors
                valueJson
                valueType
                confidence
                observedAtUtc
                freshUntilUtc
                explanation
                provenanceJson
                pipelineTraceJson
              }
            }
            """,
            new { input },
            "previewSelector",
            cancellationToken)
        ?? throw new ContextLayerException("Selector preview returned no result.");

    public async Task<SelectorValidationResult> ValidateAsync(ValidateSelectorInput input, CancellationToken cancellationToken = default)
        => await pipeline.SendGraphQlAsync<SelectorValidationResult>(
            "ValidateSelector",
            """
            mutation ValidateSelector($input: ValidateSelectorInput!) {
              validateSelector(input: $input) {
                isValid
                validationErrors
                rawSourceDataJson
                normalizedSourceDataJson
                pipelineTraceJson
              }
            }
            """,
            new { input },
            "validateSelector",
            cancellationToken)
        ?? throw new ContextLayerException("Selector validation returned no result.");
}

internal sealed class ContextLayerRecomputeClient(ContextLayerHttpPipeline pipeline) : IContextLayerRecomputeClient
{
    public async Task<QueueRecomputeResult> QueueForUserAsync(string tenantSlug, string externalUserId, string triggeredBy, CancellationToken cancellationToken = default)
        => await pipeline.SendGraphQlAsync<QueueRecomputeResult>(
            "QueueContextRecompute",
            """
            mutation QueueContextRecompute($input: QueueContextRecomputeInput!) {
              queueContextRecompute(input: $input) {
                correlationId
                tenantId
                userProfileId
                executionCount
              }
            }
            """,
            new { input = new QueueContextRecomputeInput(tenantSlug, externalUserId, triggeredBy) },
            "queueContextRecompute",
            cancellationToken)
        ?? throw new ContextLayerException("Recompute request returned no result.");
}

internal sealed class ContextLayerPackagesClient(ContextLayerHttpPipeline pipeline) : IContextLayerPackagesClient
{
    public Task<SalesContextPackageResult?> GetAiContextForUserAsync(string tenantSlug, string externalUserId, string salesObjective, CancellationToken cancellationToken = default)
        => pipeline.SendAsync<SalesContextPackageResult?>(
            HttpMethod.Post,
            $"/api/v1/context/users/{Uri.EscapeDataString(externalUserId)}/ai-safe-context-package?tenantSlug={Uri.EscapeDataString(tenantSlug)}",
            new { objective = salesObjective },
            cancellationToken);
}

internal sealed class ContextLayerAuditClient(ContextLayerHttpPipeline pipeline) : IContextLayerAuditClient
{
    public async Task<IReadOnlyList<AuditEvent>> GetEventsAsync(string tenantSlug, CancellationToken cancellationToken = default)
    {
        var result = await pipeline.SendGraphQlAsync<IReadOnlyList<AuditEvent>>(
            "GetAuditEvents",
            """
            query GetAuditEvents($tenantSlug: String!) {
              auditEvents(tenantSlug: $tenantSlug) {
                id
                tenantId
                actor
                action
                entityType
                entityId
                correlationId
                metadataJson
                beforeJson
                afterJson
                createdAtUtc
              }
            }
            """,
            new { tenantSlug },
            "auditEvents",
            cancellationToken);

        return result ?? Array.Empty<AuditEvent>();
    }
}

internal sealed class ContextLayerEventsClient(ContextLayerHttpPipeline pipeline) : IContextLayerEventsClient
{
    public Task<SourceSystemEventAcceptedResult> IngestSourceSystemEventAsync(
        string tenantSlug,
        SourceSystemEventRequest request,
        CancellationToken cancellationToken = default)
        => pipeline.SendAsync<SourceSystemEventAcceptedResult>(
            HttpMethod.Post,
            $"/api/v1/events/source-system?tenantSlug={Uri.EscapeDataString(tenantSlug)}",
            request,
            cancellationToken);
}

internal sealed class ContextLayerTenantClient : IContextLayerTenantClient
{
    public ContextLayerTenantClient(
        string tenantSlug,
        IContextLayerUsersClient usersClient,
        IContextLayerAccountsClient accountsClient,
        IContextLayerSnapshotsClient snapshotsClient,
        IContextLayerFactsClient factsClient,
        IContextLayerRecomputeClient recomputeClient,
        IContextLayerPackagesClient packagesClient,
        IContextLayerAuditClient auditClient,
        IContextLayerEventsClient eventsClient)
    {
        TenantSlug = tenantSlug;
        Users = new ScopedUsersClient(tenantSlug, usersClient);
        Accounts = new ScopedAccountsClient(tenantSlug, accountsClient);
        Snapshots = new ScopedSnapshotsClient(tenantSlug, snapshotsClient);
        Facts = new ScopedFactsClient(tenantSlug, factsClient);
        Recompute = new ScopedRecomputeClient(tenantSlug, recomputeClient);
        Packages = new ScopedPackagesClient(tenantSlug, packagesClient);
        Audit = new ScopedAuditClient(tenantSlug, auditClient);
        Events = new ScopedEventsClient(tenantSlug, eventsClient);
    }

    public string TenantSlug { get; }

    public IScopedUsersClient Users { get; }

    public IScopedAccountsClient Accounts { get; }

    public IScopedSnapshotsClient Snapshots { get; }

    public IScopedFactsClient Facts { get; }

    public IScopedRecomputeClient Recompute { get; }

    public IScopedPackagesClient Packages { get; }

    public IScopedAuditClient Audit { get; }

    public IScopedEventsClient Events { get; }
}

internal sealed class ScopedUsersClient(string tenantSlug, IContextLayerUsersClient inner) : IScopedUsersClient
{
    public Task<ContextProfileResult?> GetContextAsync(string externalUserId, CancellationToken cancellationToken = default)
        => inner.GetContextAsync(tenantSlug, externalUserId, cancellationToken);
}

internal sealed class ScopedAccountsClient(string tenantSlug, IContextLayerAccountsClient inner) : IScopedAccountsClient
{
    public Task<AccountContextResult?> GetContextAsync(string externalAccountId, CancellationToken cancellationToken = default)
        => inner.GetContextAsync(tenantSlug, externalAccountId, cancellationToken);
}

internal sealed class ScopedSnapshotsClient(string tenantSlug, IContextLayerSnapshotsClient inner) : IScopedSnapshotsClient
{
    public Task<ContextSnapshotResult?> GetByIdAsync(Guid snapshotId, CancellationToken cancellationToken = default)
        => inner.GetByIdAsync(tenantSlug, snapshotId, cancellationToken);

    public Task<ContextSnapshotSummary?> GetLatestForUserAsync(string externalUserId, CancellationToken cancellationToken = default)
        => inner.GetLatestForUserAsync(tenantSlug, externalUserId, cancellationToken);

    public Task<ContextSnapshotSummary?> GetLatestForAccountAsync(string externalAccountId, CancellationToken cancellationToken = default)
        => inner.GetLatestForAccountAsync(tenantSlug, externalAccountId, cancellationToken);
}

internal sealed class ScopedFactsClient(string tenantSlug, IContextLayerFactsClient inner) : IScopedFactsClient
{
    public Task<IReadOnlyList<ContextFactResult>> GetForUserAsync(string externalUserId, ContextFactLookupOptions? options = null, CancellationToken cancellationToken = default)
        => inner.GetForUserAsync(tenantSlug, externalUserId, options, cancellationToken);

    public Task<IReadOnlyList<ContextFactResult>> GetForAccountAsync(string externalAccountId, ContextFactLookupOptions? options = null, CancellationToken cancellationToken = default)
        => inner.GetForAccountAsync(tenantSlug, externalAccountId, options, cancellationToken);
}

internal sealed class ScopedRecomputeClient(string tenantSlug, IContextLayerRecomputeClient inner) : IScopedRecomputeClient
{
    public Task<QueueRecomputeResult> QueueForUserAsync(string externalUserId, string triggeredBy, CancellationToken cancellationToken = default)
        => inner.QueueForUserAsync(tenantSlug, externalUserId, triggeredBy, cancellationToken);
}

internal sealed class ScopedPackagesClient(string tenantSlug, IContextLayerPackagesClient inner) : IScopedPackagesClient
{
    public Task<SalesContextPackageResult?> GetAiContextForUserAsync(string externalUserId, string salesObjective, CancellationToken cancellationToken = default)
        => inner.GetAiContextForUserAsync(tenantSlug, externalUserId, salesObjective, cancellationToken);
}

internal sealed class ScopedAuditClient(string tenantSlug, IContextLayerAuditClient inner) : IScopedAuditClient
{
    public Task<IReadOnlyList<AuditEvent>> GetEventsAsync(CancellationToken cancellationToken = default)
        => inner.GetEventsAsync(tenantSlug, cancellationToken);
}

internal sealed class ScopedEventsClient(string tenantSlug, IContextLayerEventsClient inner) : IScopedEventsClient
{
    public Task<SourceSystemEventAcceptedResult> IngestSourceSystemEventAsync(SourceSystemEventRequest request, CancellationToken cancellationToken = default)
        => inner.IngestSourceSystemEventAsync(tenantSlug, request, cancellationToken);
}
