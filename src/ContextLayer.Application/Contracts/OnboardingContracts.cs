namespace ContextLayer.Application.Contracts;

public sealed record SubmitOnboardingInput(
    string OrganisationName,
    string TenantSlug,
    string PrimaryWorkspaceName,
    string AdminDisplayName,
    string AdminEmail,
    string AdminPassword,
    string IntendedUseCase,
    IReadOnlyList<string> SourceSystems,
    IReadOnlyList<string> DataCategories,
    IReadOnlyList<string> AiUseCases,
    string PiiSensitivityLevel,
    string PreferredDeploymentMode);

public sealed record OnboardingNextStepResult(
    string Title,
    string Description,
    string Action);

public sealed record OnboardingResult(
    Guid OnboardingApplicationId,
    Guid TenantId,
    string TenantSlug,
    Guid WorkspaceId,
    string WorkspaceSlug,
    Guid AdminOperatorAccountId,
    IReadOnlyList<string> CreatedSemanticAttributes,
    IReadOnlyList<string> CreatedSelectors,
    IReadOnlyList<string> CreatedDataSources,
    IReadOnlyList<OnboardingNextStepResult> NextSteps);
