using KynticAI.Scout.Domain.Enums;

namespace KynticAI.Scout.Application.Contracts;

public sealed record UpsertDataSourceInput(
    Guid? Id,
    string TenantSlug,
    string Name,
    string Description,
    DataSourceKind Kind,
    string ConnectionConfigJson);

public sealed record UpsertSemanticAttributeInput(
    Guid? Id,
    string TenantSlug,
    string Key,
    string DisplayName,
    string Description,
    SemanticDataType DataType,
    string ExampleValueJson,
    bool IsSystem);

public sealed record UpsertSelectorDefinitionInput(
    Guid? Id,
    string TenantSlug,
    Guid? DataSourceId,
    Guid TargetAttributeDefinitionId,
    string Name,
    string Description,
    SelectorMappingKind MappingKind,
    string ExpressionJson,
    string ExplanationTemplate,
    string ValidationSchemaJson,
    decimal DefaultConfidence,
    int FreshnessWindowMinutes,
    int Priority,
    int? ScheduleIntervalMinutes);

public sealed record PublishSelectorDefinitionInput(
    string TenantSlug,
    Guid SelectorDefinitionId);

public sealed record QueueContextRecomputeInput(
    string TenantSlug,
    string ExternalUserId,
    string TriggeredBy);

public sealed record UserContextLookupInput(
    string TenantSlug,
    string ExternalUserId);

public sealed record SalesContextPackageInput(
    string TenantSlug,
    string ExternalUserId,
    string SalesObjective);

public sealed record PreviewSelectorInput(
    string TenantSlug,
    string ExternalUserId,
    Guid? SelectorDefinitionId,
    UpsertSelectorDefinitionInput? DraftSelector);

public sealed record ValidateSelectorInput(
    string TenantSlug,
    UpsertSelectorDefinitionInput DraftSelector,
    string? ExternalUserId);

public sealed record RunScheduledRecomputeInput(
    string? TenantSlug);

public sealed record UpsertPromptTemplateInput(
    Guid? Id,
    string TenantSlug,
    string Name,
    string Description,
    string SystemPrompt,
    string DeveloperPrompt,
    string UserPromptTemplate,
    string OutputSchemaJson,
    string GuardrailsJson);

public sealed record CreateAgentRunInput(
    string TenantSlug,
    string ExternalUserId,
    Guid PromptTemplateId,
    string ModelName,
    string SalesObjective,
    string? ProviderName);
