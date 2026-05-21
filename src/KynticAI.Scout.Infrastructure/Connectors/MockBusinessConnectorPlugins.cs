using System.Text.Json;
using System.Text.Json.Nodes;
using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Domain.Enums;

namespace KynticAI.Scout.Infrastructure.Connectors;

internal abstract class MockBusinessConnectorPluginBase : ConnectorPluginBase
{
    protected abstract string PayloadRoot { get; }

    protected abstract JsonObject SamplePayload { get; }

    public override IReadOnlyList<ConnectorCapability> SupportedCapabilities =>
    [
        ConnectorCapability.FetchSubject,
        ConnectorCapability.Preview,
        ConnectorCapability.DryRun,
        ConnectorCapability.EventTriggeredRecompute,
        ConnectorCapability.HealthCheck,
        ConnectorCapability.ConfigurationValidation,
        ConnectorCapability.SecureCredentialStorage
    ];

    public override JsonObject GetConfigurationSchema()
        => new()
        {
            ["type"] = "object",
            ["required"] = new JsonArray("records"),
            ["properties"] = new JsonObject
            {
                ["scenario"] = new JsonObject { ["type"] = "string" },
                ["records"] = new JsonObject
                {
                    ["type"] = "array",
                    ["description"] = "Fictional demo records keyed by externalUserId."
                }
            }
        };

    public override JsonObject GetSampleConfiguration()
        => new()
        {
            ["scenario"] = "safe-local-demo",
            ["records"] = new JsonArray
            {
                new JsonObject
                {
                    ["externalUserId"] = "123",
                    ["observedAtUtc"] = "2026-05-11T10:45:00Z",
                    ["payload"] = new JsonObject
                    {
                        [PayloadRoot] = SamplePayload.DeepClone()
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
        if (request.Configuration["records"] is not JsonArray records || records.Count == 0)
        {
            errors.Add($"{DisplayName} requires a non-empty records array.");
        }

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
        var records = request.Configuration["records"] as JsonArray
            ?? throw new InvalidOperationException($"{DisplayName} requires records.");
        var record = records
            .Select(static item => item as JsonObject)
            .FirstOrDefault(item => item?["externalUserId"]?.GetValue<string>() == request.Subject.ExternalUserId)
            ?? throw new InvalidOperationException($"No {DisplayName} record exists for user '{request.Subject.ExternalUserId}'.");
        var payload = ParseObject(record["payload"], "payload");
        var observedAtUtc = record["observedAtUtc"] switch
        {
            JsonValue value when value.TryGetValue<DateTime>(out var dateTime) => dateTime,
            JsonValue value when value.TryGetValue<string>(out var stringValue) && DateTime.TryParse(stringValue, out var parsed) => parsed,
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
                    mode = "safe-local-demo",
                    request.Subject.ExternalUserId,
                    observedAtUtc
                }
            }),
            observedAtUtc,
            null,
            "{}"));
    }
}

internal sealed class MockCrmConnectorPlugin : MockBusinessConnectorPluginBase
{
    public override string ConnectorType => "mockCrm";

    public override string DisplayName => "Mock CRM Connector";

    public override string Description => "Returns fictional CRM account, contact, and opportunity fields for demos and tests.";

    public override IReadOnlyList<string> Aliases => ["mock-crm", "demoCrm"];

    public override IReadOnlyList<DataSourceKind> SupportedDataSourceKinds => [DataSourceKind.Crm, DataSourceKind.EventStream];

    protected override string PayloadRoot => "crm";

    protected override JsonObject SamplePayload => new()
    {
        ["lifecycleStage"] = "customer",
        ["opportunityStage"] = "proposal",
        ["preferredChannel"] = "email"
    };
}

internal sealed class MockBillingConnectorPlugin : MockBusinessConnectorPluginBase
{
    public override string ConnectorType => "mockBilling";

    public override string DisplayName => "Mock Billing Connector";

    public override string Description => "Returns fictional plan, renewal, invoice, and payment signals for demos and tests.";

    public override IReadOnlyList<string> Aliases => ["mock-billing", "demoBilling"];

    public override IReadOnlyList<DataSourceKind> SupportedDataSourceKinds => [DataSourceKind.SqlMetric, DataSourceKind.EventStream];

    protected override string PayloadRoot => "billing";

    protected override JsonObject SamplePayload => new()
    {
        ["activePlanName"] = "Growth",
        ["subscriptionStatus"] = "active",
        ["monthlyRecurringRevenue"] = 2400,
        ["paymentRisk"] = "low"
    };
}

internal sealed class MockSupportConnectorPlugin : MockBusinessConnectorPluginBase
{
    public override string ConnectorType => "mockSupport";

    public override string DisplayName => "Mock Support Connector";

    public override string Description => "Returns fictional ticket and satisfaction signals for demos and tests.";

    public override IReadOnlyList<string> Aliases => ["mock-support", "demoSupport"];

    public override IReadOnlyList<DataSourceKind> SupportedDataSourceKinds => [DataSourceKind.Crm, DataSourceKind.EventStream];

    protected override string PayloadRoot => "support";

    protected override JsonObject SamplePayload => new()
    {
        ["openTickets"] = 1,
        ["lastTicketPriority"] = "normal",
        ["satisfactionTrend"] = "stable"
    };
}
