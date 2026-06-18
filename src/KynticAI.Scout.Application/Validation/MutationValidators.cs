using System.Text.Json;
using KynticAI.Scout.Application.Contracts;
using FluentValidation;

namespace KynticAI.Scout.Application.Validation;

public sealed class UpsertDataSourceInputValidator : AbstractValidator<UpsertDataSourceInput>
{
    public UpsertDataSourceInputValidator()
    {
        RuleFor(x => x.TenantSlug).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2_000);
        RuleFor(x => x.ConnectionConfigJson).Must(BeValidJson).WithMessage("ConnectionConfigJson must be valid JSON.");
    }

    private static bool BeValidJson(string value) => IsValidJson(value, allowEmpty: true);

    internal static bool IsValidJson(string value, bool allowEmpty = false)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return allowEmpty;
        }

        try
        {
            JsonDocument.Parse(value);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}

public sealed class RegisterConnectorInputValidator : AbstractValidator<RegisterConnectorInput>
{
    public RegisterConnectorInputValidator()
    {
        RuleFor(x => x.TenantSlug).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2_000);
        RuleFor(x => x.ConnectorType).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ConfigurationJson)
            .Must(value => UpsertDataSourceInputValidator.IsValidJson(value))
            .WithMessage("ConfigurationJson must be valid JSON.");
        RuleFor(x => x.CredentialsJson)
            .Must(value => string.IsNullOrWhiteSpace(value) || UpsertDataSourceInputValidator.IsValidJson(value))
            .WithMessage("CredentialsJson must be valid JSON when supplied.");
    }
}

public sealed class ValidateConnectorConfigurationInputValidator : AbstractValidator<ValidateConnectorConfigurationInput>
{
    public ValidateConnectorConfigurationInputValidator()
    {
        RuleFor(x => x.ConnectorType).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ConfigurationJson)
            .Must(value => UpsertDataSourceInputValidator.IsValidJson(value))
            .WithMessage("ConfigurationJson must be valid JSON.");
        RuleFor(x => x.CredentialsJson)
            .Must(value => string.IsNullOrWhiteSpace(value) || UpsertDataSourceInputValidator.IsValidJson(value))
            .WithMessage("CredentialsJson must be valid JSON when supplied.");
    }
}

public sealed class CheckConnectorHealthInputValidator : AbstractValidator<CheckConnectorHealthInput>
{
    public CheckConnectorHealthInputValidator()
    {
        RuleFor(x => x.TenantSlug).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DataSourceId).NotEmpty();
        RuleFor(x => x.ExternalUserId).MaximumLength(200);
        RuleFor(x => x.Mode).MaximumLength(100);
    }
}

public sealed class UpsertSemanticAttributeInputValidator : AbstractValidator<UpsertSemanticAttributeInput>
{
    public UpsertSemanticAttributeInputValidator()
    {
        RuleFor(x => x.TenantSlug).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Key).NotEmpty().MaximumLength(100).Matches("^[a-zA-Z][a-zA-Z0-9]+$");
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2_000);
        RuleFor(x => x.ExampleValueJson)
            .Must(value => UpsertDataSourceInputValidator.IsValidJson(value, allowEmpty: true))
            .WithMessage("ExampleValueJson must be valid JSON.");
    }
}

public sealed class UpsertSelectorDefinitionInputValidator : AbstractValidator<UpsertSelectorDefinitionInput>
{
    public UpsertSelectorDefinitionInputValidator()
    {
        RuleFor(x => x.TenantSlug).NotEmpty().MaximumLength(100);
        RuleFor(x => x.TargetAttributeDefinitionId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2_000);
        RuleFor(x => x.ExpressionJson)
            .Must(value => UpsertDataSourceInputValidator.IsValidJson(value))
            .WithMessage("ExpressionJson must be valid JSON.");
        RuleFor(x => x.ExplanationTemplate).NotEmpty().MaximumLength(2_000);
        RuleFor(x => x.ValidationSchemaJson)
            .Must(value => UpsertDataSourceInputValidator.IsValidJson(value, allowEmpty: true))
            .WithMessage("ValidationSchemaJson must be valid JSON.");
        RuleFor(x => x.DefaultConfidence).InclusiveBetween(0.01m, 1.00m);
        RuleFor(x => x.FreshnessWindowMinutes).InclusiveBetween(1, 525_600);
        RuleFor(x => x.Priority).InclusiveBetween(0, 10_000);
        RuleFor(x => x.ScheduleIntervalMinutes)
            .Must(value => value is null || value.Value >= 5)
            .WithMessage("ScheduleIntervalMinutes must be at least 5 minutes when supplied.");
    }
}

public sealed class PublishSelectorDefinitionInputValidator : AbstractValidator<PublishSelectorDefinitionInput>
{
    public PublishSelectorDefinitionInputValidator()
    {
        RuleFor(x => x.TenantSlug).NotEmpty().MaximumLength(100);
        RuleFor(x => x.SelectorDefinitionId).NotEmpty();
    }
}

public sealed class QueueContextRecomputeInputValidator : AbstractValidator<QueueContextRecomputeInput>
{
    public QueueContextRecomputeInputValidator()
    {
        RuleFor(x => x.TenantSlug).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ExternalUserId).NotEmpty().MaximumLength(200);
        RuleFor(x => x.TriggeredBy).NotEmpty().MaximumLength(200);
    }
}

public sealed class UserContextLookupInputValidator : AbstractValidator<UserContextLookupInput>
{
    public UserContextLookupInputValidator()
    {
        RuleFor(x => x.TenantSlug).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ExternalUserId).NotEmpty().MaximumLength(200);
    }
}

public sealed class SalesContextPackageInputValidator : AbstractValidator<SalesContextPackageInput>
{
    public SalesContextPackageInputValidator()
    {
        RuleFor(x => x.TenantSlug).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ExternalUserId).NotEmpty().MaximumLength(200);
        RuleFor(x => x.SalesObjective).NotEmpty().MaximumLength(2_000);
    }
}

public sealed class PreviewSelectorInputValidator : AbstractValidator<PreviewSelectorInput>
{
    public PreviewSelectorInputValidator()
    {
        RuleFor(x => x.TenantSlug).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ExternalUserId).NotEmpty().MaximumLength(200);
        RuleFor(x => x)
            .Must(x => x.SelectorDefinitionId.HasValue ^ x.DraftSelector is not null)
            .WithMessage("Provide either SelectorDefinitionId or DraftSelector.");
        When(x => x.DraftSelector is not null, () =>
        {
            RuleFor(x => x.DraftSelector!).SetValidator(new UpsertSelectorDefinitionInputValidator());
        });
    }
}

public sealed class ValidateSelectorInputValidator : AbstractValidator<ValidateSelectorInput>
{
    public ValidateSelectorInputValidator()
    {
        RuleFor(x => x.TenantSlug).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DraftSelector).NotNull().SetValidator(new UpsertSelectorDefinitionInputValidator());
        RuleFor(x => x.ExternalUserId).MaximumLength(200);
    }
}

public sealed class RunScheduledRecomputeInputValidator : AbstractValidator<RunScheduledRecomputeInput>
{
    public RunScheduledRecomputeInputValidator()
    {
        RuleFor(x => x.TenantSlug).MaximumLength(100);
    }
}

public sealed class SourceSystemEventInputValidator : AbstractValidator<SourceSystemEventInput>
{
    public SourceSystemEventInputValidator()
    {
        RuleFor(x => x.TenantSlug).NotEmpty().MaximumLength(100);
        RuleFor(x => x.WorkspaceSlug).MaximumLength(100);
        RuleFor(x => x.EventId).NotEmpty().MaximumLength(160);
        RuleFor(x => x.SourceSystem).NotEmpty().MaximumLength(120);
        RuleFor(x => x.EventType).NotEmpty().MaximumLength(160);
        RuleFor(x => x.ExternalUserId).MaximumLength(200);
        RuleFor(x => x.ExternalAccountId).MaximumLength(200);
        RuleFor(x => x.PayloadJson)
            .NotEmpty()
            .Must(value => UpsertDataSourceInputValidator.IsValidJson(value))
            .WithMessage("PayloadJson must be valid JSON.");
    }
}

public sealed class UpsertPromptTemplateInputValidator : AbstractValidator<UpsertPromptTemplateInput>
{
    public UpsertPromptTemplateInputValidator()
    {
        RuleFor(x => x.TenantSlug).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2_000);
        RuleFor(x => x.SystemPrompt).NotEmpty().MaximumLength(8_000);
        RuleFor(x => x.DeveloperPrompt).NotEmpty().MaximumLength(8_000);
        RuleFor(x => x.UserPromptTemplate).NotEmpty().MaximumLength(8_000);
        RuleFor(x => x.OutputSchemaJson)
            .Must(value => UpsertDataSourceInputValidator.IsValidJson(value))
            .WithMessage("OutputSchemaJson must be valid JSON.");
        RuleFor(x => x.GuardrailsJson)
            .Must(value => UpsertDataSourceInputValidator.IsValidJson(value))
            .WithMessage("GuardrailsJson must be valid JSON.");
    }
}

public sealed class CreateAgentRunInputValidator : AbstractValidator<CreateAgentRunInput>
{
    public CreateAgentRunInputValidator()
    {
        RuleFor(x => x.TenantSlug).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ExternalUserId).NotEmpty().MaximumLength(200);
        RuleFor(x => x.PromptTemplateId).NotEmpty();
        RuleFor(x => x.ModelName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.SalesObjective).NotEmpty().MaximumLength(2_000);
        RuleFor(x => x.ProviderName).MaximumLength(200);
    }
}

public sealed class NextActionInputValidator : AbstractValidator<NextActionInput>
{
    private static readonly string[] AllowedSubjectTypes = ["email", "contact", "account"];
    private static readonly string[] AllowedObjectives = ["sale", "sales", "conversion", "convert", "churn", "support", "retention", "retain"];

    public NextActionInputValidator()
    {
        RuleFor(x => x.TenantSlug).NotEmpty().MaximumLength(100);
        RuleFor(x => x.SubjectType)
            .NotEmpty()
            .MaximumLength(40)
            .Must(value => AllowedSubjectTypes.Contains(value.Trim().ToLowerInvariant()))
            .WithMessage("SubjectType must be email, contact, or account.");
        RuleFor(x => x.SubjectIdentifier).NotEmpty().MaximumLength(320);
        RuleFor(x => x.Objective)
            .NotEmpty()
            .MaximumLength(80)
            .Must(value => AllowedObjectives.Contains(value.Trim().ToLowerInvariant()))
            .WithMessage("Objective must be sale, conversion, churn, support, or retention.");
        RuleFor(x => x.Purpose).NotEmpty().MaximumLength(300);
        RuleFor(x => x.ActorRole).NotEmpty().MaximumLength(80);
    }
}

public sealed class SubmitOnboardingInputValidator : AbstractValidator<SubmitOnboardingInput>
{
    private static readonly string[] AllowedPiiSensitivityLevels = ["low", "moderate", "high", "regulated"];
    private static readonly string[] AllowedDeploymentModes = ["local-demo", "self-hosted", "managed-saas", "private-cloud"];

    public SubmitOnboardingInputValidator()
    {
        RuleFor(x => x.OrganisationName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.TenantSlug)
            .NotEmpty()
            .MaximumLength(100)
            .Matches("^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$")
            .WithMessage("TenantSlug must be lowercase letters, numbers, and hyphens.");
        RuleFor(x => x.PrimaryWorkspaceName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.AdminDisplayName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.AdminEmail).NotEmpty().EmailAddress().MaximumLength(320);
        RuleFor(x => x.AdminPassword).NotEmpty().MinimumLength(12).MaximumLength(200);
        RuleFor(x => x.IntendedUseCase).NotEmpty().MaximumLength(2_000);
        RuleFor(x => x.SourceSystems).NotEmpty().Must(x => x.Count <= 20);
        RuleForEach(x => x.SourceSystems).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DataCategories).NotEmpty().Must(x => x.Count <= 20);
        RuleForEach(x => x.DataCategories).NotEmpty().MaximumLength(100);
        RuleFor(x => x.AiUseCases).NotEmpty().Must(x => x.Count <= 20);
        RuleForEach(x => x.AiUseCases).NotEmpty().MaximumLength(160);
        RuleFor(x => x.PiiSensitivityLevel)
            .Must(value => AllowedPiiSensitivityLevels.Contains(value.Trim().ToLowerInvariant()))
            .WithMessage("PiiSensitivityLevel must be low, moderate, high, or regulated.");
        RuleFor(x => x.PreferredDeploymentMode)
            .Must(value => AllowedDeploymentModes.Contains(value.Trim().ToLowerInvariant()))
            .WithMessage("PreferredDeploymentMode must be local-demo, self-hosted, managed-saas, or private-cloud.");
    }
}
