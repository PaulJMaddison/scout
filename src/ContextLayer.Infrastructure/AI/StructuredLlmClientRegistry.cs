using ContextLayer.Application.Abstractions;
using Microsoft.Extensions.Options;

namespace ContextLayer.Infrastructure.AI;

public sealed class StructuredLlmClientRegistry(
    IEnumerable<IStructuredLlmClient> clients,
    IOptions<LlmOptions> options)
    : IStructuredLlmClientRegistry
{
    private readonly IReadOnlyDictionary<string, IStructuredLlmClient> clientsByProvider =
        clients.ToDictionary(client => client.ProviderName, StringComparer.OrdinalIgnoreCase);

    public string DefaultProviderName => options.Value.DefaultProvider;

    public IStructuredLlmClient? Resolve(string? providerName)
    {
        var selectedProviderName = string.IsNullOrWhiteSpace(providerName)
            ? DefaultProviderName
            : providerName.Trim();

        return clientsByProvider.TryGetValue(selectedProviderName, out var client)
            ? client
            : null;
    }
}
