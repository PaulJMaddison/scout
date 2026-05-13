using ContextLayer.Application.Contracts;
using ContextLayer.Application.Services;
using ContextLayer.Domain.Entities;
using ContextLayer.Domain.Enums;
using ContextLayer.Infrastructure.Auth;
using HotChocolate;
using HotChocolate.Authorization;
using Microsoft.AspNetCore.Http;

namespace ContextLayer.Api.GraphQL;

public sealed class Query
{
    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin })]
    public Task<IReadOnlyList<Tenant>> Tenants(
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetTenantsAsync(cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst, RoleNames.SalesUser, RoleNames.ReadOnly, RoleNames.ApiClient })]
    public Task<IReadOnlyList<UserProfileResult>> UserProfiles(
        string tenantSlug,
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
    {
        GraphQlScopeGuard.RequireApiClientScope(httpContextAccessor, ApiScopes.ContextRead);
        return service.GetUserProfilesAsync(tenantSlug, cancellationToken);
    }

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst, RoleNames.ReadOnly })]
    public Task<IReadOnlyList<DataSource>> DataSources(
        string tenantSlug,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetDataSourcesAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public Task<IReadOnlyList<ConnectorPluginDefinitionResult>> ConnectorPlugins(
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetConnectorPluginsAsync(cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst, RoleNames.SalesUser, RoleNames.ReadOnly, RoleNames.ApiClient })]
    public Task<IReadOnlyList<ConnectorCatalogueEntryResult>> ConnectorCatalogue(
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
    {
        GraphQlScopeGuard.RequireApiClientScope(httpContextAccessor, ApiScopes.ContextRead);
        return service.GetConnectorCatalogueAsync(cancellationToken);
    }

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.ReadOnly })]
    public Task<LicenceStatusResult> LicenceStatus(
        [Service] ILicenceService service,
        CancellationToken cancellationToken)
        => service.GetStatusAsync(cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst })]
    public Task<IReadOnlyList<SemanticAttributeDefinition>> SemanticAttributes(
        string tenantSlug,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetSemanticAttributesAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst })]
    public Task<IReadOnlyList<SelectorDefinition>> Selectors(
        string tenantSlug,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetSelectorsAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst, RoleNames.SalesUser, RoleNames.ReadOnly, RoleNames.ApiClient })]
    public Task<IReadOnlyList<SelectorExecution>> SelectorExecutions(
        string tenantSlug,
        string? externalUserId,
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
    {
        GraphQlScopeGuard.RequireApiClientScope(httpContextAccessor, ApiScopes.ContextRead);
        return service.GetSelectorExecutionsAsync(tenantSlug, externalUserId, cancellationToken);
    }

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst, RoleNames.SalesUser, RoleNames.ReadOnly })]
    public Task<IReadOnlyList<PromptTemplate>> PromptTemplates(
        string tenantSlug,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetPromptTemplatesAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.Analyst, RoleNames.SalesUser })]
    public Task<IReadOnlyList<AgentRun>> AgentRuns(
        string tenantSlug,
        string? externalUserId,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetAgentRunsAsync(tenantSlug, externalUserId, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin })]
    public Task<IReadOnlyList<AuditEvent>> AuditEvents(
        string tenantSlug,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetAuditEventsAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst })]
    public Task<IReadOnlyList<SourceSystemEventHistoryResult>> SourceSystemEvents(
        string tenantSlug,
        string? workspaceSlug,
        string? sourceSystem,
        string? eventType,
        string? status,
        DateTime? fromUtc,
        DateTime? toUtc,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetSourceSystemEventsAsync(tenantSlug, workspaceSlug, sourceSystem, eventType, status, fromUtc, toUtc, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin })]
    public Task<SaasArchitectureOverviewResult> SaasArchitectureOverview(
        string tenantSlug,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetSaasArchitectureOverviewAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin })]
    public Task<OrganisationSettingsResult> OrganisationSettings(
        string tenantSlug,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetOrganisationSettingsAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst, RoleNames.ReadOnly })]
    public Task<IReadOnlyList<WorkspaceSummaryResult>> Workspaces(
        string tenantSlug,
        string? status,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetWorkspacesAsync(tenantSlug, status, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin })]
    public Task<IReadOnlyList<OperatorAccountSummaryResult>> OperatorAccounts(
        string tenantSlug,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetOperatorAccountsAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public Task<IReadOnlyList<ApiClientSummaryResult>> ApiClients(
        string tenantSlug,
        [Service] ApiClientKeyService service,
        CancellationToken cancellationToken)
        => service.ListAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public Task<IReadOnlyList<BlueprintImportHistoryResult>> BlueprintImports(
        string tenantSlug,
        string? status,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetBlueprintImportsAsync(tenantSlug, status, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst })]
    public Task<IReadOnlyList<GovernancePolicyResult>> GovernancePolicies(
        string tenantSlug,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetGovernancePoliciesAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public async Task<BillingPlanDefinitionResult> CurrentPlan(
        string tenantSlug,
        [Service] IUsageMeteringService usageMeteringService,
        [Service] IBillingPlanCatalog planCatalog,
        CancellationToken cancellationToken)
    {
        var overview = await usageMeteringService.GetUsageOverviewAsync(tenantSlug, cancellationToken);
        return await planCatalog.GetPlanAsync(Enum.Parse<SubscriptionPlan>(overview.Plan), cancellationToken);
    }

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public Task<BillingUsageOverviewResult> BillingUsage(
        string tenantSlug,
        [Service] IUsageMeteringService usageMeteringService,
        CancellationToken cancellationToken)
        => usageMeteringService.GetUsageOverviewAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst, RoleNames.SalesUser, RoleNames.ReadOnly, RoleNames.ApiClient })]
    public Task<ContextProfileResult?> UserContext(
        UserContextLookupInput input,
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
    {
        GraphQlScopeGuard.RequireApiClientScope(httpContextAccessor, ApiScopes.ContextRead);
        return service.GetUserContextAsync(input, cancellationToken);
    }

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst, RoleNames.SalesUser, RoleNames.ReadOnly, RoleNames.ApiClient })]
    public Task<AccountContextResult?> AccountContext(
        string tenantSlug,
        string externalAccountId,
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
    {
        GraphQlScopeGuard.RequireApiClientScope(httpContextAccessor, ApiScopes.ContextRead);
        return service.GetAccountContextAsync(tenantSlug, externalAccountId, cancellationToken);
    }

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst, RoleNames.SalesUser, RoleNames.ReadOnly, RoleNames.ApiClient })]
    public Task<ContextSnapshotResult?> ContextSnapshot(
        string tenantSlug,
        Guid snapshotId,
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
    {
        GraphQlScopeGuard.RequireApiClientScope(httpContextAccessor, ApiScopes.ContextRead);
        return service.GetContextSnapshotAsync(tenantSlug, snapshotId, cancellationToken);
    }

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst, RoleNames.SalesUser, RoleNames.ReadOnly, RoleNames.ApiClient })]
    public async Task<IReadOnlyList<ContextFactResult>> ContextFacts(
        string tenantSlug,
        string? externalUserId,
        string? externalAccountId,
        string? attributeKey,
        int? skip,
        int? take,
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
    {
        GraphQlScopeGuard.RequireApiClientScope(httpContextAccessor, ApiScopes.ContextRead);
        if (string.IsNullOrWhiteSpace(externalUserId) && string.IsNullOrWhiteSpace(externalAccountId))
        {
            throw new GraphQLException(ErrorBuilder.New()
                .SetMessage("Provide externalUserId or externalAccountId.")
                .SetCode("context.subject_required")
                .Build());
        }

        if (!string.IsNullOrWhiteSpace(externalUserId) && !string.IsNullOrWhiteSpace(externalAccountId))
        {
            throw new GraphQLException(ErrorBuilder.New()
                .SetMessage("Provide only one of externalUserId or externalAccountId.")
                .SetCode("context.subject_ambiguous")
                .Build());
        }

        var facts = new List<ContextFactResult>();
        if (!string.IsNullOrWhiteSpace(externalUserId))
        {
            var context = await service.GetUserContextAsync(new UserContextLookupInput(tenantSlug, externalUserId), cancellationToken);
            if (context is not null)
            {
                facts.AddRange(context.Facts);
            }
        }
        else
        {
            var account = await service.GetAccountContextAsync(tenantSlug, externalAccountId!, cancellationToken);
            if (account is not null)
            {
                foreach (var user in account.Users.Where(static user => user.LatestSnapshotId.HasValue))
                {
                    var snapshot = await service.GetContextSnapshotAsync(tenantSlug, user.LatestSnapshotId!.Value, cancellationToken);
                    if (snapshot is not null)
                    {
                        facts.AddRange(snapshot.Facts);
                    }
                }
            }
        }

        var filtered = facts.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(attributeKey))
        {
            filtered = filtered.Where(fact => fact.AttributeKey.Contains(attributeKey.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        var safeSkip = Math.Max(0, skip ?? 0);
        var safeTake = Math.Clamp(take ?? 50, 1, 200);
        return filtered
            .Skip(safeSkip)
            .Take(safeTake)
            .ToList();
    }

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.Analyst, RoleNames.SalesUser, RoleNames.ApiClient })]
    public Task<SalesContextPackageResult?> SalesContextPackage(
        SalesContextPackageInput input,
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
    {
        GraphQlScopeGuard.RequireApiClientScope(httpContextAccessor, ApiScopes.ContextRead);
        return service.GetSalesContextPackageAsync(input, cancellationToken);
    }
}
