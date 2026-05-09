using ContextLayer.Application.Contracts;
using ContextLayer.Application.Services;
using ContextLayer.Domain.Entities;
using ContextLayer.Infrastructure.Auth;
using HotChocolate.Authorization;

namespace ContextLayer.Api.GraphQL;

public sealed class Query
{
    [Authorize(Roles = new[] { RoleNames.TenantAdmin })]
    public Task<IReadOnlyList<Tenant>> Tenants(
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetTenantsAsync(cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin, RoleNames.SalesRep })]
    public Task<IReadOnlyList<UserProfileResult>> UserProfiles(
        string tenantSlug,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetUserProfilesAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin })]
    public Task<IReadOnlyList<DataSource>> DataSources(
        string tenantSlug,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetDataSourcesAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin })]
    public Task<IReadOnlyList<SemanticAttributeDefinition>> SemanticAttributes(
        string tenantSlug,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetSemanticAttributesAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin })]
    public Task<IReadOnlyList<SelectorDefinition>> Selectors(
        string tenantSlug,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetSelectorsAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin, RoleNames.SalesRep })]
    public Task<IReadOnlyList<SelectorExecution>> SelectorExecutions(
        string tenantSlug,
        string? externalUserId,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetSelectorExecutionsAsync(tenantSlug, externalUserId, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin, RoleNames.SalesRep })]
    public Task<IReadOnlyList<PromptTemplate>> PromptTemplates(
        string tenantSlug,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetPromptTemplatesAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin, RoleNames.SalesRep })]
    public Task<IReadOnlyList<AgentRun>> AgentRuns(
        string tenantSlug,
        string? externalUserId,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetAgentRunsAsync(tenantSlug, externalUserId, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin })]
    public Task<IReadOnlyList<AuditEvent>> AuditEvents(
        string tenantSlug,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetAuditEventsAsync(tenantSlug, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin, RoleNames.SalesRep })]
    public Task<ContextProfileResult?> UserContext(
        UserContextLookupInput input,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetUserContextAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin, RoleNames.SalesRep })]
    public Task<SalesContextPackageResult?> SalesContextPackage(
        SalesContextPackageInput input,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.GetSalesContextPackageAsync(input, cancellationToken);
}
