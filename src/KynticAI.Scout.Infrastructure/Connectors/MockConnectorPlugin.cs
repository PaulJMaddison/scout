using System.Text.Json;
using System.Text.Json.Nodes;
using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Domain.Enums;
using KynticAI.Scout.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace KynticAI.Scout.Infrastructure.Connectors;

internal sealed class MockConnectorPlugin(ScoutDbContext dbContext) : ConnectorPluginBase
{
    public override string ConnectorType => "mock";

    public override string DisplayName => "Mock Connector";

    public override string Description => "Returns seeded records for demos, file-driven previews, and deterministic tests.";

    public override IReadOnlyList<string> Aliases => ["mockPayload", "mockSignal", "fileUpload"];

    public override IReadOnlyList<DataSourceKind> SupportedDataSourceKinds =>
        Enum.GetValues<DataSourceKind>();

    public override JsonObject GetConfigurationSchema()
        => new()
        {
            ["type"] = "object",
            ["required"] = new JsonArray("records"),
            ["properties"] = new JsonObject
            {
                ["records"] = new JsonObject
                {
                    ["type"] = "array",
                    ["description"] = "Seeded subject records keyed by externalUserId."
                }
            }
        };

    public override JsonObject GetSampleConfiguration()
        => new()
        {
            ["records"] = new JsonArray
            {
                new JsonObject
                {
                    ["externalUserId"] = "123",
                    ["observedAtUtc"] = "2026-05-11T10:15:00Z",
                    ["payload"] = new JsonObject
                    {
                        ["crm"] = new JsonObject
                        {
                            ["preferredChannel"] = "email"
                        }
                    }
                }
            }
        };

    public override async Task<ConnectorConfigurationValidationResult> ValidateConfigurationAsync(
        ConnectorConfigurationValidationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await base.ValidateConfigurationAsync(request, cancellationToken);
        var errors = result.Errors.ToList();
        if (request.Configuration["records"] is not JsonArray
            && !string.Equals(request.ConnectorType, "mockSignal", StringComparison.OrdinalIgnoreCase))
        {
            errors.Add("Mock connector requires a records array unless it is running in signal-backed mode.");
        }

        return result with
        {
            IsValid = errors.Count == 0,
            Errors = errors
        };
    }

    public override Task<ConnectorFetchResult> FetchAsync(
        ConnectorFetchRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Configuration["records"] is JsonArray records)
        {
            var record = records
                .Select(static item => item as JsonObject)
                .FirstOrDefault(item => item?["externalUserId"]?.GetValue<string>() == request.Subject.ExternalUserId)
                ?? throw new InvalidOperationException($"No mock connector record exists for user '{request.Subject.ExternalUserId}'.");
            var payload = ParseObject(record["payload"], "payload");
            var observedAtUtc = record["observedAtUtc"]?.GetValue<DateTime?>() ?? DateTime.UtcNow;

            return Task.FromResult(new ConnectorFetchResult(
                payload.ToJsonString(),
                (JsonObject)payload.DeepClone(),
                JsonSerializer.Serialize(new[]
                {
                    new
                    {
                        source = ConnectorType,
                        request.Subject.ExternalUserId,
                        observedAtUtc,
                        mode = request.Mode.ToString()
                    }
                }),
                observedAtUtc,
                null,
                "{}"));
        }

        return FetchSignalsAsync(request, cancellationToken);
    }

    private async Task<ConnectorFetchResult> FetchSignalsAsync(ConnectorFetchRequest request, CancellationToken cancellationToken)
    {
        var signals = await dbContext.UserSignals
            .AsNoTracking()
            .Where(x => x.UserProfileId == request.Subject.Id && x.DataSourceId == request.DataSource.Id)
            .OrderByDescending(x => x.ObservedAtUtc)
            .ToListAsync(cancellationToken);

        if (signals.Count == 0)
        {
            throw new InvalidOperationException($"No mock signals exist for data source '{request.DataSource.Name}' and user '{request.Subject.ExternalUserId}'.");
        }

        var latestPerKey = signals
            .GroupBy(x => x.Key, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.OrderByDescending(x => x.ObservedAtUtc).First())
            .ToList();

        var payload = new JsonObject();
        foreach (var signal in latestPerKey)
        {
            SetNestedValue(payload, signal.Key, JsonNode.Parse(signal.ValueJson));
        }

        return new ConnectorFetchResult(
            payload.ToJsonString(),
            payload,
            JsonSerializer.Serialize(latestPerKey.Select(signal => new
            {
                source = ConnectorType,
                signal.Id,
                signal.Key,
                signal.ObservedAtUtc,
                signal.ProvenanceJson
            })),
            latestPerKey.Max(x => x.ObservedAtUtc),
            null,
            "{}");
    }

    private static void SetNestedValue(JsonObject root, string path, JsonNode? value)
    {
        var segments = path.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        JsonObject current = root;
        for (var index = 0; index < segments.Length - 1; index++)
        {
            if (current[segments[index]] is not JsonObject child)
            {
                child = new JsonObject();
                current[segments[index]] = child;
            }

            current = child;
        }

        current[segments[^1]] = value;
    }
}
