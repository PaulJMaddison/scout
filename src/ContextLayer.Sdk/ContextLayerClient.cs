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
        Snapshots = new ContextLayerSnapshotsClient(Users, Accounts);
        Facts = new ContextLayerFactsClient(Users, Accounts);
        Selectors = new ContextLayerSelectorsClient(pipeline);
        Recompute = new ContextLayerRecomputeClient(pipeline);
        Packages = new ContextLayerPackagesClient(pipeline);
        Audit = new ContextLayerAuditClient(pipeline);
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

    public IContextLayerTenantClient ForTenant(string tenantSlug)
        => new ContextLayerTenantClient(
            tenantSlug,
            Users,
            Accounts,
            Snapshots,
            Facts,
            Recompute,
            Packages,
            Audit);

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

    public Task<AuthenticatedOperator> GetCurrentOperatorAsync(CancellationToken cancellationToken = default)
        => pipeline.SendAsync<AuthenticatedOperator>(HttpMethod.Get, "/api/auth/me", null, cancellationToken);
}

internal sealed class ContextLayerUsersClient(ContextLayerHttpPipeline pipeline) : IContextLayerUsersClient
{
    public Task<ContextProfileResult?> GetContextAsync(string tenantSlug, string externalUserId, CancellationToken cancellationToken = default)
        => pipeline.SendGraphQlAsync<ContextProfileResult>(
            "GetUserContext",
            """
            query GetUserContext($input: UserContextLookupInput!) {
              userContext(input: $input) {
                snapshotId
                tenantSlug
                externalUserId
                fullName
                companyName
                summary
                overallConfidence
                generatedAtUtc
                isStale
                sourceSummary {
                  externalAccountId
                  accountName
                  domain
                  industry
                  region
                  lifecycleStage
                  activePlanName
                  subscriptionStatus
                  monthlyRecurringRevenue
                  openOpportunities
                  openSupportTickets
                  pricingPageVisits30d
                  activeDays30
                  emailReplies30d
                  highlights {
                    label
                    value
                    explanation
                  }
                  recentTimeline {
                    category
                    description
                    occurredAtUtc
                  }
                  rawSummaryJson
                }
                history {
                  snapshotId
                  snapshotVersion
                  summary
                  overallConfidence
                  generatedAtUtc
                  isStale
                  factCount
                }
                facts {
                  id
                  attributeKey
                  valueJson
                  valueType
                  confidence
                  observedAtUtc
                  freshUntilUtc
                  sourceSelectorDefinitionId
                  explanation
                  provenanceJson
                }
              }
            }
            """,
            new { input = new UserContextLookupInput(tenantSlug, externalUserId) },
            "userContext",
            cancellationToken);
}

internal sealed class ContextLayerAccountsClient(ContextLayerHttpPipeline pipeline) : IContextLayerAccountsClient
{
    public Task<AccountContextResult?> GetContextAsync(string tenantSlug, string externalAccountId, CancellationToken cancellationToken = default)
        => pipeline.SendAsync<AccountContextResult?>(
            HttpMethod.Get,
            $"/v1/accounts/{Uri.EscapeDataString(externalAccountId)}/context?tenantSlug={Uri.EscapeDataString(tenantSlug)}",
            null,
            cancellationToken);
}

internal sealed class ContextLayerSnapshotsClient(
    IContextLayerUsersClient usersClient,
    IContextLayerAccountsClient accountsClient) : IContextLayerSnapshotsClient
{
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

        var historyEntry = context.History.FirstOrDefault(x => x.GeneratedAtUtc == context.GeneratedAtUtc);
        return historyEntry is null
            ? new ContextSnapshotSummary(Guid.Empty, 0, context.Summary, context.OverallConfidence, context.GeneratedAtUtc, context.IsStale, context.Facts.Count)
            : new ContextSnapshotSummary(
                historyEntry.SnapshotId,
                historyEntry.SnapshotVersion,
                historyEntry.Summary,
                historyEntry.OverallConfidence,
                historyEntry.GeneratedAtUtc,
                historyEntry.IsStale,
                historyEntry.FactCount);
    }
}

internal sealed class ContextLayerFactsClient(
    IContextLayerUsersClient usersClient,
    IContextLayerAccountsClient accountsClient) : IContextLayerFactsClient
{
    public async Task<IReadOnlyList<ContextFactResult>> GetForUserAsync(string tenantSlug, string externalUserId, CancellationToken cancellationToken = default)
        => (await usersClient.GetContextAsync(tenantSlug, externalUserId, cancellationToken))?.Facts ?? Array.Empty<ContextFactResult>();

    public async Task<IReadOnlyList<ContextFactResult>> GetForAccountAsync(string tenantSlug, string externalAccountId, CancellationToken cancellationToken = default)
        => (await accountsClient.GetContextAsync(tenantSlug, externalAccountId, cancellationToken))?.Facts ?? Array.Empty<ContextFactResult>();
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
        => pipeline.SendGraphQlAsync<SalesContextPackageResult>(
            "GetSalesContextPackage",
            """
            query GetSalesContextPackage($input: SalesContextPackageInput!) {
              salesContextPackage(input: $input) {
                snapshotId
                tenantSlug
                externalUserId
                fullName
                companyName
                jobTitle
                segment
                salesObjective
                summary
                overallConfidence
                generatedAtUtc
                isStale
                humanReviewRecommended
                missingInformation
                weakSignalMessages
                facts {
                  citationId
                  factId
                  attributeKey
                  displayName
                  valueJson
                  valueType
                  confidence
                  observedAtUtc
                  freshUntilUtc
                  isFresh
                  isLowConfidence
                  explanation
                  provenanceJson
                }
                contextPackageJson
              }
            }
            """,
            new { input = new SalesContextPackageInput(tenantSlug, externalUserId, salesObjective) },
            "salesContextPackage",
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
        IContextLayerAuditClient auditClient)
    {
        TenantSlug = tenantSlug;
        Users = new ScopedUsersClient(tenantSlug, usersClient);
        Accounts = new ScopedAccountsClient(tenantSlug, accountsClient);
        Snapshots = new ScopedSnapshotsClient(tenantSlug, snapshotsClient);
        Facts = new ScopedFactsClient(tenantSlug, factsClient);
        Recompute = new ScopedRecomputeClient(tenantSlug, recomputeClient);
        Packages = new ScopedPackagesClient(tenantSlug, packagesClient);
        Audit = new ScopedAuditClient(tenantSlug, auditClient);
    }

    public string TenantSlug { get; }

    public IScopedUsersClient Users { get; }

    public IScopedAccountsClient Accounts { get; }

    public IScopedSnapshotsClient Snapshots { get; }

    public IScopedFactsClient Facts { get; }

    public IScopedRecomputeClient Recompute { get; }

    public IScopedPackagesClient Packages { get; }

    public IScopedAuditClient Audit { get; }
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
    public Task<ContextSnapshotSummary?> GetLatestForUserAsync(string externalUserId, CancellationToken cancellationToken = default)
        => inner.GetLatestForUserAsync(tenantSlug, externalUserId, cancellationToken);

    public Task<ContextSnapshotSummary?> GetLatestForAccountAsync(string externalAccountId, CancellationToken cancellationToken = default)
        => inner.GetLatestForAccountAsync(tenantSlug, externalAccountId, cancellationToken);
}

internal sealed class ScopedFactsClient(string tenantSlug, IContextLayerFactsClient inner) : IScopedFactsClient
{
    public Task<IReadOnlyList<ContextFactResult>> GetForUserAsync(string externalUserId, CancellationToken cancellationToken = default)
        => inner.GetForUserAsync(tenantSlug, externalUserId, cancellationToken);

    public Task<IReadOnlyList<ContextFactResult>> GetForAccountAsync(string externalAccountId, CancellationToken cancellationToken = default)
        => inner.GetForAccountAsync(tenantSlug, externalAccountId, cancellationToken);
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
