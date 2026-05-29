// KynticAI Scout -- Connector Template
//
// Copy this file into your connector project and update the marked sections.
// Register the resulting class as IConnectorPlugin in the DI container.
//
// This template uses only local/fake data and has no external dependencies.

using System.Text.Json;
using System.Text.Json.Nodes;
using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Domain.Enums;

namespace KynticAI.Scout.Infrastructure.Connectors;

// Authoring note: rename this class to match your connector (e.g. AcmeCrmConnectorPlugin).
internal sealed class TemplateConnectorPlugin : ConnectorPluginBase
{
    // Authoring note: use a unique camelCase identifier for your connector type.
    public override string ConnectorType => "template";

    // Human-readable name shown in the admin console.
    public override string DisplayName => "Template Connector";

    // Short description of what this connector does.
    public override string Description =>
        "Starter template for authoring a KynticAI Scout connector. Replace with your own implementation.";

    // Optional aliases that the connector registry will also resolve.
    public override IReadOnlyList<string> Aliases => [];

    // Data source kinds this connector can serve.
    public override IReadOnlyList<DataSourceKind> SupportedDataSourceKinds =>
        [DataSourceKind.Crm];

    // Return a JSON Schema describing the configuration this connector accepts.
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
                    ["description"] = "Array of demo records keyed by externalUserId."
                }
            }
        };

    // Return an example configuration for documentation and tests.
    public override JsonObject GetSampleConfiguration()
        => new()
        {
            ["records"] = new JsonArray
            {
                new JsonObject
                {
                    ["externalUserId"] = "123",
                    ["observedAtUtc"] = "2026-01-15T09:00:00Z",
                    ["payload"] = new JsonObject
                    {
                        ["status"] = "active",
                        ["score"] = 85
                    }
                }
            }
        };

    // Add connector-specific validation beyond the base data-source-kind check.
    public override async Task<ConnectorConfigurationValidationResult> ValidateConfigurationAsync(
        ConnectorConfigurationValidationRequest request,
        CancellationToken cancellationToken)
    {
        var baseline = await base.ValidateConfigurationAsync(request, cancellationToken);
        var errors = baseline.Errors.ToList();

        if (request.Configuration["records"] is not JsonArray { Count: > 0 })
        {
            errors.Add("Template connector requires a non-empty records array.");
        }

        return baseline with
        {
            IsValid = errors.Count == 0,
            Errors = errors
        };
    }

    // Implement the data fetch for a single subject.
    public override Task<ConnectorFetchResult> FetchAsync(
        ConnectorFetchRequest request,
        CancellationToken cancellationToken)
    {
        var records = request.Configuration["records"] as JsonArray
            ?? throw new InvalidOperationException("Template connector requires records.");

        var record = records
            .Select(static item => item as JsonObject)
            .FirstOrDefault(item =>
                item?["externalUserId"]?.GetValue<string>() == request.Subject.ExternalUserId)
            ?? throw new InvalidOperationException(
                $"No template connector record exists for user '{request.Subject.ExternalUserId}'.");

        var payload = ParseObject(record["payload"], "payload");
        var observedAtUtc = record["observedAtUtc"] switch
        {
            JsonValue v when v.TryGetValue<DateTime>(out var dt) => dt,
            JsonValue v when v.TryGetValue<string>(out var s) && DateTime.TryParse(s, out var p) => p,
            _ => DateTime.UtcNow
        };

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
}
