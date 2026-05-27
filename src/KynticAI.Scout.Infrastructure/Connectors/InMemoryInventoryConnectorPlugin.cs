using System.Text.Json;
using System.Text.Json.Nodes;
using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Domain.Enums;

namespace KynticAI.Scout.Infrastructure.Connectors;

/// <summary>
/// Example connector that returns fictional inventory data from an in-memory
/// dataset. Demonstrates the <see cref="IConnectorPlugin"/> contract without
/// any external dependencies, network calls, or enterprise internals.
/// </summary>
internal sealed class InMemoryInventoryConnectorPlugin : ConnectorPluginBase
{
    public override string ConnectorType => "inMemoryInventory";

    public override string DisplayName => "In-Memory Inventory Connector";

    public override string Description =>
        "Returns fictional warehouse inventory records for demos and connector-authoring examples. No external dependencies.";

    public override IReadOnlyList<string> Aliases => ["demoInventory"];

    public override IReadOnlyList<DataSourceKind> SupportedDataSourceKinds =>
        [DataSourceKind.ProductUsage, DataSourceKind.SqlMetric];

    public override IReadOnlyList<ConnectorCapability> SupportedCapabilities =>
    [
        ConnectorCapability.FetchSubject,
        ConnectorCapability.Preview,
        ConnectorCapability.DryRun,
        ConnectorCapability.HealthCheck,
        ConnectorCapability.ConfigurationValidation
    ];

    public override JsonObject GetConfigurationSchema()
        => new()
        {
            ["type"] = "object",
            ["required"] = new JsonArray("warehouseId"),
            ["properties"] = new JsonObject
            {
                ["warehouseId"] = new JsonObject
                {
                    ["type"] = "string",
                    ["description"] = "Identifier for the fictional warehouse."
                },
                ["records"] = new JsonObject
                {
                    ["type"] = "array",
                    ["description"] = "Optional override records. When absent, built-in demo data is used."
                }
            }
        };

    public override JsonObject GetCredentialSchema()
        => new()
        {
            ["type"] = "object",
            ["description"] = "No credentials required for in-memory demo data.",
            ["properties"] = new JsonObject()
        };

    public override JsonObject GetSampleConfiguration()
        => new()
        {
            ["warehouseId"] = "warehouse-north",
            ["records"] = new JsonArray
            {
                new JsonObject
                {
                    ["externalUserId"] = "123",
                    ["observedAtUtc"] = "2026-01-20T08:00:00Z",
                    ["payload"] = new JsonObject
                    {
                        ["inventory"] = new JsonObject
                        {
                            ["skuCount"] = 42,
                            ["lowStockAlerts"] = 3,
                            ["fulfilmentRate"] = 0.97
                        }
                    }
                }
            }
        };

    public override async Task<ConnectorConfigurationValidationResult> ValidateConfigurationAsync(
        ConnectorConfigurationValidationRequest request,
        CancellationToken cancellationToken)
    {
        var baseline = await base.ValidateConfigurationAsync(request, cancellationToken);
        var errors = baseline.Errors.ToList();

        if (string.IsNullOrWhiteSpace(request.Configuration["warehouseId"]?.GetValue<string>()))
            errors.Add("In-memory inventory connector requires a non-empty warehouseId.");

        return baseline with
        {
            IsValid = errors.Count == 0,
            Errors = errors
        };
    }

    public override Task<ConnectorFetchResult> FetchAsync(
        ConnectorFetchRequest request,
        CancellationToken cancellationToken)
    {
        var warehouseId = request.Configuration["warehouseId"]?.GetValue<string>() ?? "default";

        if (request.Configuration["records"] is JsonArray overrides)
        {
            return Task.FromResult(FetchFromRecords(overrides, request));
        }

        return Task.FromResult(FetchBuiltInDemo(warehouseId, request));
    }

    private static ConnectorFetchResult FetchFromRecords(JsonArray records, ConnectorFetchRequest request)
    {
        var record = records
            .Select(static item => item as JsonObject)
            .FirstOrDefault(item =>
                item?["externalUserId"]?.GetValue<string>() == request.Subject.ExternalUserId)
            ?? throw new InvalidOperationException(
                $"No inventory record exists for user '{request.Subject.ExternalUserId}'.");

        var payload = ParseObject(record["payload"], "payload");
        var observedAtUtc = ParseObservedAt(record);

        return BuildResult("inMemoryInventory", request, payload, observedAtUtc);
    }

    private static ConnectorFetchResult FetchBuiltInDemo(string warehouseId, ConnectorFetchRequest request)
    {
        var payload = new JsonObject
        {
            ["inventory"] = new JsonObject
            {
                ["warehouseId"] = warehouseId,
                ["skuCount"] = 128,
                ["lowStockAlerts"] = 5,
                ["fulfilmentRate"] = 0.94,
                ["lastRestockUtc"] = "2026-01-18T06:00:00Z"
            }
        };

        return BuildResult("inMemoryInventory", request, payload, DateTime.UtcNow);
    }

    private static ConnectorFetchResult BuildResult(
        string source,
        ConnectorFetchRequest request,
        JsonObject payload,
        DateTime observedAtUtc)
    {
        return new ConnectorFetchResult(
            payload.ToJsonString(),
            (JsonObject)payload.DeepClone(),
            JsonSerializer.Serialize(new[]
            {
                new
                {
                    source,
                    request.Subject.ExternalUserId,
                    observedAtUtc,
                    mode = request.Mode.ToString()
                }
            }),
            observedAtUtc,
            null,
            "{}");
    }

    private static DateTime ParseObservedAt(JsonObject record)
    {
        return record["observedAtUtc"] switch
        {
            JsonValue v when v.TryGetValue<DateTime>(out var dt) => dt,
            JsonValue v when v.TryGetValue<string>(out var s) && DateTime.TryParse(s, out var p) => p,
            _ => DateTime.UtcNow
        };
    }
}
