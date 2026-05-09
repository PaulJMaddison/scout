using System.Text.Json.Nodes;
using ContextLayer.Domain.Entities;

namespace ContextLayer.Infrastructure.Selectors;

internal interface ISelectorSourceConnector
{
    string ConnectorType { get; }

    Task<SourceFetchResult> FetchAsync(
        SelectorDefinition selector,
        UserProfile userProfile,
        DataSource dataSource,
        JsonObject connectionConfig,
        CancellationToken cancellationToken);
}

internal sealed record SourceFetchResult(
    string RawSourceDataJson,
    JsonObject Payload,
    DateTime ObservedAtUtc,
    string ProvenanceJson);
