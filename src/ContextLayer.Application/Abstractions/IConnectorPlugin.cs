using System.Text.Json.Nodes;
using ContextLayer.Domain.Entities;
using ContextLayer.Domain.Enums;

namespace ContextLayer.Application.Abstractions;

public interface IConnectorPlugin
{
    string ConnectorType { get; }

    string DisplayName { get; }

    string Description { get; }

    IReadOnlyList<string> Aliases { get; }

    IReadOnlyList<DataSourceKind> SupportedDataSourceKinds { get; }

    IReadOnlyList<ConnectorCapability> SupportedCapabilities { get; }

    JsonObject GetConfigurationSchema();

    JsonObject GetCredentialSchema();

    JsonObject GetSampleConfiguration();

    Task<ConnectorConfigurationValidationResult> ValidateConfigurationAsync(
        ConnectorConfigurationValidationRequest request,
        CancellationToken cancellationToken);

    Task<ConnectorHealthCheckResult> CheckHealthAsync(
        ConnectorHealthCheckRequest request,
        CancellationToken cancellationToken);

    Task<ConnectorFetchResult> FetchAsync(
        ConnectorFetchRequest request,
        CancellationToken cancellationToken);
}

public interface IConnectorRegistry
{
    IReadOnlyList<IConnectorPlugin> GetPlugins();

    bool TryGetPlugin(string connectorType, out IConnectorPlugin plugin);

    IConnectorPlugin GetRequiredPlugin(string connectorType);
}

public interface IConnectorCredentialStore
{
    Task<JsonObject> PersistCredentialsAsync(
        Guid tenantId,
        Guid dataSourceId,
        string connectorType,
        JsonObject credentials,
        CancellationToken cancellationToken);

    Task<JsonObject> ResolveConfigurationSecretsAsync(
        Guid tenantId,
        JsonObject configuration,
        CancellationToken cancellationToken);
}

public enum ConnectorCapability
{
    FetchSubject = 1,
    Preview = 2,
    DryRun = 3,
    ScheduledSync = 4,
    EventTriggeredRecompute = 5,
    HealthCheck = 6,
    ConfigurationValidation = 7,
    SecureCredentialStorage = 8
}

public enum ConnectorRunMode
{
    Live = 1,
    Preview = 2,
    DryRun = 3,
    ScheduledSync = 4,
    EventTriggeredRecompute = 5
}

public sealed record ConnectorConfigurationValidationRequest(
    string ConnectorType,
    DataSourceKind DataSourceKind,
    JsonObject Configuration,
    JsonObject Credentials);

public sealed record ConnectorConfigurationValidationResult(
    bool IsValid,
    IReadOnlyList<string> Errors,
    string SanitizedConfigurationJson,
    string SchemaJson);

public sealed record ConnectorHealthCheckRequest(
    string ConnectorType,
    DataSourceKind DataSourceKind,
    JsonObject Configuration,
    JsonObject Credentials,
    ConnectorSubject? Subject,
    ConnectorRunMode Mode);

public sealed record ConnectorHealthCheckResult(
    bool IsHealthy,
    string Status,
    IReadOnlyList<string> Messages,
    string DetailsJson,
    DateTime CheckedAtUtc);

public sealed record ConnectorFetchRequest(
    string ConnectorType,
    SelectorDefinition Selector,
    DataSource DataSource,
    UserProfile Subject,
    JsonObject Configuration,
    JsonObject Credentials,
    ConnectorRunMode Mode,
    ConnectorExecutionTrigger Trigger);

public sealed record ConnectorFetchResult(
    string RawPayloadJson,
    JsonObject NormalizedPayload,
    string ProvenanceJson,
    DateTime ObservedAtUtc,
    DateTime? FreshUntilUtc,
    string DiagnosticsJson);

public sealed record ConnectorExecutionTrigger(
    string Kind,
    string? SourceEventId,
    string? TriggeredBy);

public sealed record ConnectorSubject(
    string ExternalUserId,
    string FullName,
    string Email,
    string CompanyName,
    string JobTitle,
    string Segment);
