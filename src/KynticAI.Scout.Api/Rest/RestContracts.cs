using KynticAI.Scout.Application.Contracts;

namespace KynticAI.Scout.Api.Rest;

public sealed record RecomputeUserContextRequest(
    string TriggeredBy);

public sealed record SalesContextPackageRequest(
    string SalesObjective);

public sealed record PreviewSelectorRestRequest(
    Guid? SelectorDefinitionId,
    UpsertSelectorDefinitionInput? DraftSelector);

public sealed record ValidateSelectorRestRequest(
    UpsertSelectorDefinitionInput DraftSelector,
    string? ExternalUserId);
