using KynticAI.Scout.Application.Contracts;
using KynticAI.Scout.Application.Services;
using KynticAI.Scout.Api.Auth;
using KynticAI.Scout.Api.Onboarding;
using KynticAI.Scout.Domain.Entities;
using KynticAI.Scout.Infrastructure.Auth;
using HotChocolate.Authorization;
using Microsoft.AspNetCore.Http;

namespace KynticAI.Scout.Api.GraphQL;

public sealed class Mutation
{
    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin })]
    public Task<OperatorAccountSummaryResult> UpdateOperatorAccount(
        UpdateOperatorAccountInput input,
        [Service] IScoutService service,
        CancellationToken cancellationToken)
        => service.UpdateOperatorAccountAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public Task<ApiClientCreatedResult> CreateApiClient(
        CreateApiClientRequest input,
        [Service] ApiClientKeyService service,
        CancellationToken cancellationToken)
        => service.CreateAsync(input.TenantSlug, input.WorkspaceSlug, input.DisplayName, input.Scopes, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public Task<ApiClientRotatedResult> RotateApiClient(
        string tenantSlug,
        string clientId,
        [Service] ApiClientKeyService service,
        CancellationToken cancellationToken)
        => service.RotateAsync(tenantSlug, clientId, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public async Task<bool> RevokeApiClient(
        string tenantSlug,
        string clientId,
        [Service] ApiClientKeyService service,
        CancellationToken cancellationToken)
    {
        await service.RevokeAsync(tenantSlug, clientId, cancellationToken);
        return true;
    }

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin })]
    public async Task<OnboardingResult> SubmitOnboarding(
        SubmitOnboardingInput input,
        [Service] OnboardingAccessGuard onboardingAccessGuard,
        [Service] IOnboardingService service,
        CancellationToken cancellationToken)
    {
        onboardingAccessGuard.EnsureOnboardingAllowed(input.TenantSlug, "graphql");
        return await service.SubmitAsync(input, cancellationToken);
    }

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public Task<BlueprintImportResult> UploadBlueprint(
        UploadBlueprintInput input,
        [Service] IBlueprintImportService service,
        CancellationToken cancellationToken)
        => service.UploadAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public Task<BlueprintImportResult> ValidateBlueprint(
        BlueprintImportInput input,
        [Service] IBlueprintImportService service,
        CancellationToken cancellationToken)
        => service.ValidateAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public Task<BlueprintImportResult> PreviewBlueprint(
        BlueprintImportInput input,
        [Service] IBlueprintImportService service,
        CancellationToken cancellationToken)
        => service.PreviewAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public Task<BlueprintImportResult> ImportBlueprint(
        BlueprintImportInput input,
        [Service] IBlueprintImportService service,
        CancellationToken cancellationToken)
        => service.ImportAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public Task<DataSource> UpsertDataSource(
        UpsertDataSourceInput input,
        [Service] IScoutService service,
        CancellationToken cancellationToken)
        => service.UpsertDataSourceAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public Task<ConnectorRegistrationResult> RegisterConnector(
        RegisterConnectorInput input,
        [Service] IScoutService service,
        CancellationToken cancellationToken)
        => service.RegisterConnectorAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public Task<ConnectorConfigurationValidationResultModel> ValidateConnectorConfiguration(
        ValidateConnectorConfigurationInput input,
        [Service] IScoutService service,
        CancellationToken cancellationToken)
        => service.ValidateConnectorConfigurationAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public Task<ConnectorHealthResult> CheckConnectorHealth(
        CheckConnectorHealthInput input,
        [Service] IScoutService service,
        CancellationToken cancellationToken)
        => service.CheckConnectorHealthAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst })]
    public Task<SemanticAttributeDefinition> UpsertSemanticAttribute(
        UpsertSemanticAttributeInput input,
        [Service] IScoutService service,
        CancellationToken cancellationToken)
        => service.UpsertSemanticAttributeAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst })]
    public Task<SelectorDefinition> UpsertSelector(
        UpsertSelectorDefinitionInput input,
        [Service] IScoutService service,
        CancellationToken cancellationToken)
        => service.UpsertSelectorAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst })]
    public Task<SelectorDefinition> PublishSelector(
        PublishSelectorDefinitionInput input,
        [Service] IScoutService service,
        CancellationToken cancellationToken)
        => service.PublishSelectorAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst, RoleNames.SalesUser, RoleNames.ApiClient })]
    public Task<QueueRecomputeResult> QueueContextRecompute(
        QueueContextRecomputeInput input,
        [Service] IHttpContextAccessor httpContextAccessor,
        [Service] IScoutService service,
        CancellationToken cancellationToken)
    {
        GraphQlScopeGuard.RequireApiClientScope(httpContextAccessor, ApiScopes.ContextWrite);
        return service.QueueContextRecomputeAsync(input, cancellationToken);
    }

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst })]
    public Task<SelectorExecutionPreviewResult> PreviewSelector(
        PreviewSelectorInput input,
        [Service] IScoutService service,
        CancellationToken cancellationToken)
        => service.PreviewSelectorAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst })]
    public Task<SelectorValidationResult> ValidateSelector(
        ValidateSelectorInput input,
        [Service] IScoutService service,
        CancellationToken cancellationToken)
        => service.ValidateSelectorAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin })]
    public Task<ScheduledRecomputeDispatchResult> RunScheduledRecompute(
        RunScheduledRecomputeInput input,
        [Service] IScoutService service,
        CancellationToken cancellationToken)
        => service.RunScheduledRecomputeAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.Analyst })]
    public Task<PromptTemplate> UpsertPromptTemplate(
        UpsertPromptTemplateInput input,
        [Service] IScoutService service,
        CancellationToken cancellationToken)
        => service.UpsertPromptTemplateAsync(input, cancellationToken);

    [Authorize(Roles = new[] { RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.Analyst, RoleNames.SalesUser })]
    public Task<AgentRunResult> CreateAgentRun(
        CreateAgentRunInput input,
        [Service] IScoutService service,
        CancellationToken cancellationToken)
        => service.CreateAgentRunAsync(input, cancellationToken);
}
