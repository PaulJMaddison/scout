using KynticAI.Scout.Application.Abstractions;

namespace KynticAI.Scout.Infrastructure.Connectors;

internal sealed class ConnectorRegistry(IEnumerable<IConnectorPlugin> plugins) : IConnectorRegistry
{
    private readonly IReadOnlyDictionary<string, IConnectorPlugin> lookup = BuildLookup(plugins);
    private readonly IReadOnlyList<IConnectorPlugin> orderedPlugins = plugins
        .DistinctBy(static plugin => plugin.ConnectorType, StringComparer.OrdinalIgnoreCase)
        .OrderBy(static plugin => plugin.DisplayName, StringComparer.OrdinalIgnoreCase)
        .ToList();

    public IReadOnlyList<IConnectorPlugin> GetPlugins() => orderedPlugins;

    public bool TryGetPlugin(string connectorType, out IConnectorPlugin plugin)
        => lookup.TryGetValue(Normalize(connectorType), out plugin!);

    public IConnectorPlugin GetRequiredPlugin(string connectorType)
    {
        if (TryGetPlugin(connectorType, out var plugin))
        {
            return plugin;
        }

        throw new InvalidOperationException($"Connector type '{connectorType}' is not registered.");
    }

    private static IReadOnlyDictionary<string, IConnectorPlugin> BuildLookup(IEnumerable<IConnectorPlugin> plugins)
    {
        var dictionary = new Dictionary<string, IConnectorPlugin>(StringComparer.OrdinalIgnoreCase);
        foreach (var plugin in plugins)
        {
            dictionary[Normalize(plugin.ConnectorType)] = plugin;
            foreach (var alias in plugin.Aliases)
            {
                dictionary[Normalize(alias)] = plugin;
            }
        }

        return dictionary;
    }

    private static string Normalize(string connectorType) => connectorType.Trim();
}
