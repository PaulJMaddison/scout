using ContextLayer.Application.Contracts;
using ContextLayer.Application.Services;
using ContextLayer.Domain.Entities;
using ContextLayer.Infrastructure.Auth;
using HotChocolate.Authorization;

namespace ContextLayer.Api.GraphQL;

public sealed class Mutation
{
    [Authorize(Roles = new[] { RoleNames.TenantAdmin })]
    public Task<DataSource> UpsertDataSource(
        UpsertDataSourceInput input,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.UpsertDataSourceAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin })]
    public Task<SemanticAttributeDefinition> UpsertSemanticAttribute(
        UpsertSemanticAttributeInput input,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.UpsertSemanticAttributeAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin })]
    public Task<SelectorDefinition> UpsertSelector(
        UpsertSelectorDefinitionInput input,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.UpsertSelectorAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin })]
    public Task<SelectorDefinition> PublishSelector(
        PublishSelectorDefinitionInput input,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.PublishSelectorAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin, RoleNames.SalesRep })]
    public Task<QueueRecomputeResult> QueueContextRecompute(
        QueueContextRecomputeInput input,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.QueueContextRecomputeAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin })]
    public Task<SelectorExecutionPreviewResult> PreviewSelector(
        PreviewSelectorInput input,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.PreviewSelectorAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin })]
    public Task<SelectorValidationResult> ValidateSelector(
        ValidateSelectorInput input,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.ValidateSelectorAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin })]
    public Task<ScheduledRecomputeDispatchResult> RunScheduledRecompute(
        RunScheduledRecomputeInput input,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.RunScheduledRecomputeAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin })]
    public Task<PromptTemplate> UpsertPromptTemplate(
        UpsertPromptTemplateInput input,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.UpsertPromptTemplateAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.TenantAdmin, RoleNames.SalesRep })]
    public Task<AgentRunResult> CreateAgentRun(
        CreateAgentRunInput input,
        [Service] IContextLayerService service,
        CancellationToken cancellationToken)
        => service.CreateAgentRunAsync(input, cancellationToken);
}
