using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Infrastructure.Configuration;
using Microsoft.Extensions.Options;

namespace KynticAI.Scout.Infrastructure.Extensions;

internal sealed class LocalDataPlaneStorageAdapterResolver(
    IEnumerable<ILocalDataPlaneStorageAdapter> adapters,
    IOptions<StorageAdapterOptions> options)
    : ILocalDataPlaneStorageAdapterResolver
{
    private readonly IReadOnlyDictionary<string, ILocalDataPlaneStorageAdapter> adaptersByKey = BuildLookup(adapters);

    public string DefaultProviderKey => NormalizeConfiguredProvider(options.Value.Provider);

    public IReadOnlyList<string> RegisteredProviderKeys { get; } = adapters
        .Select(static adapter => adapter.AdapterKey)
        .Where(static adapterKey => !string.IsNullOrWhiteSpace(adapterKey))
        .Distinct(StringComparer.OrdinalIgnoreCase)
        .OrderBy(static adapterKey => adapterKey, StringComparer.OrdinalIgnoreCase)
        .ToList();

    public ILocalDataPlaneStorageAdapter? Resolve(string? providerKey = null)
    {
        var selectedProviderKey = NormalizeConfiguredProvider(providerKey ?? DefaultProviderKey);
        if (string.Equals(selectedProviderKey, StorageAdapterProviderKeys.Disabled, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return adaptersByKey.TryGetValue(selectedProviderKey, out var adapter)
            ? adapter
            : null;
    }

    public ILocalDataPlaneStorageAdapter GetRequiredAdapter(string? providerKey = null)
    {
        var selectedProviderKey = NormalizeConfiguredProvider(providerKey ?? DefaultProviderKey);
        var adapter = Resolve(selectedProviderKey);
        if (adapter is not null)
        {
            return adapter;
        }

        var registeredProviders = RegisteredProviderKeys.Count == 0
            ? "<none>"
            : string.Join(", ", RegisteredProviderKeys);
        throw new InvalidOperationException(
            $"Storage adapter provider '{selectedProviderKey}' is not registered. Registered providers: {registeredProviders}. " +
            "Use 'scout-postgres' for the open-source Scout default or register a local private-runtime adapter in the customer-owned environment.");
    }

    private static IReadOnlyDictionary<string, ILocalDataPlaneStorageAdapter> BuildLookup(
        IEnumerable<ILocalDataPlaneStorageAdapter> adapters)
    {
        var dictionary = new Dictionary<string, ILocalDataPlaneStorageAdapter>(StringComparer.OrdinalIgnoreCase);
        foreach (var adapter in adapters)
        {
            var adapterKey = NormalizeConfiguredProvider(adapter.AdapterKey);
            dictionary[adapterKey] = adapter;
        }

        return dictionary;
    }

    private static string NormalizeConfiguredProvider(string? providerKey)
        => string.IsNullOrWhiteSpace(providerKey)
            ? StorageAdapterProviderKeys.ScoutPostgres
            : providerKey.Trim();
}
