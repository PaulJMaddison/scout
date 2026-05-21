namespace KynticAI.Scout.Application.Abstractions;

public interface IStructuredLlmClientRegistry
{
    string DefaultProviderName { get; }

    IStructuredLlmClient? Resolve(string? providerName);
}
