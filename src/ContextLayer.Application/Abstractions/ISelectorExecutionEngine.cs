using ContextLayer.Domain.Entities;
using ContextLayer.Domain.Enums;

namespace ContextLayer.Application.Abstractions;

public interface ISelectorExecutionEngine
{
    Task<SelectorPipelineOutcome> ExecuteAsync(
        SelectorRuntimeContext runtimeContext,
        UserProfile userProfile,
        SelectorExecutionMode mode,
        CancellationToken cancellationToken);

    Task<SelectorPipelineOutcome> ValidateAsync(
        SelectorRuntimeContext runtimeContext,
        UserProfile? userProfile,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<SelectorPipelineOutcome>> ExecuteSelectorsAsync(
        IReadOnlyList<SelectorRuntimeContext> runtimeContexts,
        UserProfile userProfile,
        SelectorExecutionMode mode,
        CancellationToken cancellationToken);
}

public sealed record SelectorRuntimeContext(
    SelectorDefinition Selector,
    DataSource DataSource,
    SemanticAttributeDefinition TargetAttributeDefinition);

public sealed record SelectorPipelineOutcome(
    string Mode,
    bool IsSuccess,
    string SelectorName,
    string RawSourceDataJson,
    string NormalizedSourceDataJson,
    IReadOnlyList<string> ValidationErrors,
    SelectorCandidateFact? CandidateFact,
    string PipelineTraceJson);

public sealed record SelectorCandidateFact(
    Guid SelectorDefinitionId,
    Guid AttributeDefinitionId,
    string AttributeKey,
    string ValueJson,
    FactValueType ValueType,
    decimal Confidence,
    DateTime ObservedAtUtc,
    DateTime? FreshUntilUtc,
    string Explanation,
    string ProvenanceJson,
    string RawSourceDataJson,
    string NormalizedSourceDataJson,
    string ValidationErrorsJson,
    string PipelineTraceJson,
    int Priority);
