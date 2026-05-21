namespace KynticAI.Scout.Application.Abstractions;

public sealed record LlmPromptMessage(
    string Role,
    string Content);

public sealed record StructuredLlmRequest(
    string ModelName,
    IReadOnlyList<LlmPromptMessage> Messages,
    string OutputSchemaJson,
    string ContextPackageJson,
    string CorrelationId);

public sealed record StructuredLlmResponse(
    string ProviderName,
    string OutputJson);

public interface IStructuredLlmClient
{
    string ProviderName { get; }

    Task<StructuredLlmResponse> GenerateStructuredJsonAsync(StructuredLlmRequest request, CancellationToken cancellationToken);
}
