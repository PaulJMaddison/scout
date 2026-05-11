using System.Text.Json;
using System.Text.Json.Nodes;
using ContextLayer.Application.Abstractions;
using ContextLayer.Domain.Entities;
using ContextLayer.Domain.Enums;

namespace ContextLayer.Infrastructure.Connectors;

internal abstract class ConnectorPluginBase : IConnectorPlugin
{
    public abstract string ConnectorType { get; }

    public abstract string DisplayName { get; }

    public abstract string Description { get; }

    public virtual IReadOnlyList<string> Aliases => Array.Empty<string>();

    public abstract IReadOnlyList<DataSourceKind> SupportedDataSourceKinds { get; }

    public virtual IReadOnlyList<ConnectorCapability> SupportedCapabilities =>
    [
        ConnectorCapability.FetchSubject,
        ConnectorCapability.Preview,
        ConnectorCapability.DryRun,
        ConnectorCapability.ScheduledSync,
        ConnectorCapability.EventTriggeredRecompute,
        ConnectorCapability.HealthCheck,
        ConnectorCapability.ConfigurationValidation,
        ConnectorCapability.SecureCredentialStorage
    ];

    public abstract JsonObject GetConfigurationSchema();

    public virtual JsonObject GetCredentialSchema()
        => new()
        {
            ["type"] = "object",
            ["properties"] = new JsonObject()
        };

    public abstract JsonObject GetSampleConfiguration();

    public virtual Task<ConnectorConfigurationValidationResult> ValidateConfigurationAsync(
        ConnectorConfigurationValidationRequest request,
        CancellationToken cancellationToken)
    {
        var errors = new List<string>();
        if (!SupportedDataSourceKinds.Contains(request.DataSourceKind))
        {
            errors.Add($"Connector '{ConnectorType}' does not support data source kind '{request.DataSourceKind}'.");
        }

        return Task.FromResult(new ConnectorConfigurationValidationResult(
            errors.Count == 0,
            errors,
            SanitizeConfiguration(request.Configuration).ToJsonString(),
            GetConfigurationSchema().ToJsonString()));
    }

    public virtual Task<ConnectorHealthCheckResult> CheckHealthAsync(
        ConnectorHealthCheckRequest request,
        CancellationToken cancellationToken)
    {
        return Task.FromResult(new ConnectorHealthCheckResult(
            true,
            "healthy",
            [$"Connector '{ConnectorType}' accepted the health-check request."],
            "{}",
            DateTime.UtcNow));
    }

    public abstract Task<ConnectorFetchResult> FetchAsync(
        ConnectorFetchRequest request,
        CancellationToken cancellationToken);

    protected static ConnectorSubject ToSubject(UserProfile userProfile)
        => new(
            userProfile.ExternalUserId,
            userProfile.FullName,
            userProfile.Email,
            userProfile.CompanyName,
            userProfile.JobTitle,
            userProfile.Segment);

    protected static JsonObject SanitizeConfiguration(JsonObject configuration)
    {
        var clone = configuration.DeepClone() as JsonObject ?? new JsonObject();
        if (clone["credentials"] is JsonObject credentials)
        {
            foreach (var key in credentials.Select(static item => item.Key).ToList())
            {
                credentials[key] = "***";
            }
        }

        return clone;
    }

    protected static JsonObject ParseObject(JsonNode? node, string name)
        => node as JsonObject ?? throw new InvalidOperationException($"{name} must be a JSON object.");

    protected static string Serialize(object value) => JsonSerializer.Serialize(value);
}
