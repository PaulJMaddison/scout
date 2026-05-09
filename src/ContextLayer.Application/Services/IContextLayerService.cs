using ContextLayer.Application.Contracts;
using ContextLayer.Domain.Entities;

namespace ContextLayer.Application.Services;

public interface IContextLayerService
{
    Task<IReadOnlyList<Tenant>> GetTenantsAsync(CancellationToken cancellationToken);

    Task<IReadOnlyList<DataSource>> GetDataSourcesAsync(string tenantSlug, CancellationToken cancellationToken);

    Task<IReadOnlyList<SemanticAttributeDefinition>> GetSemanticAttributesAsync(string tenantSlug, CancellationToken cancellationToken);

    Task<IReadOnlyList<SelectorDefinition>> GetSelectorsAsync(string tenantSlug, CancellationToken cancellationToken);

    Task<IReadOnlyList<SelectorExecution>> GetSelectorExecutionsAsync(string tenantSlug, string? externalUserId, CancellationToken cancellationToken);

    Task<IReadOnlyList<PromptTemplate>> GetPromptTemplatesAsync(string tenantSlug, CancellationToken cancellationToken);

    Task<IReadOnlyList<AgentRun>> GetAgentRunsAsync(string tenantSlug, string? externalUserId, CancellationToken cancellationToken);

    Task<IReadOnlyList<AuditEvent>> GetAuditEventsAsync(string tenantSlug, CancellationToken cancellationToken);

    Task<IReadOnlyList<UserProfileResult>> GetUserProfilesAsync(string tenantSlug, CancellationToken cancellationToken);

    Task<DataSource> UpsertDataSourceAsync(UpsertDataSourceInput input, CancellationToken cancellationToken);

    Task<SemanticAttributeDefinition> UpsertSemanticAttributeAsync(UpsertSemanticAttributeInput input, CancellationToken cancellationToken);

    Task<SelectorDefinition> UpsertSelectorAsync(UpsertSelectorDefinitionInput input, CancellationToken cancellationToken);

    Task<SelectorDefinition> PublishSelectorAsync(PublishSelectorDefinitionInput input, CancellationToken cancellationToken);

    Task<PromptTemplate> UpsertPromptTemplateAsync(UpsertPromptTemplateInput input, CancellationToken cancellationToken);

    Task<QueueRecomputeResult> QueueContextRecomputeAsync(QueueContextRecomputeInput input, CancellationToken cancellationToken);

    Task<ContextProfileResult?> GetUserContextAsync(UserContextLookupInput input, CancellationToken cancellationToken);

    Task<SalesContextPackageResult?> GetSalesContextPackageAsync(SalesContextPackageInput input, CancellationToken cancellationToken);

    Task<AgentRunResult> CreateAgentRunAsync(CreateAgentRunInput input, CancellationToken cancellationToken);

    Task<SelectorExecutionPreviewResult> PreviewSelectorAsync(PreviewSelectorInput input, CancellationToken cancellationToken);

    Task<SelectorValidationResult> ValidateSelectorAsync(ValidateSelectorInput input, CancellationToken cancellationToken);

    Task<ScheduledRecomputeDispatchResult> RunScheduledRecomputeAsync(RunScheduledRecomputeInput input, CancellationToken cancellationToken);
}
