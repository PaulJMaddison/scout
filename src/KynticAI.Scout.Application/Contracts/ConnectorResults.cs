namespace KynticAI.Scout.Application.Contracts;

public sealed record ConnectorPluginDefinitionResult(
    string ConnectorType,
    string DisplayName,
    string Description,
    IReadOnlyList<string> Aliases,
    IReadOnlyList<string> SupportedDataSourceKinds,
    IReadOnlyList<string> SupportedCapabilities,
    string ConfigurationSchemaJson,
    string CredentialSchemaJson,
    string SampleConfigurationJson);

public sealed record ConnectorCatalogueEntryResult(
    string ConnectorType,
    string DisplayName,
    string Description,
    string Category,
    string PublicStatus,
    string Availability,
    bool IsIncludedInOpenCore,
    bool RequiresCommercialAgreement,
    bool IsPlaceholder,
    bool IsEnabled,
    IReadOnlyList<string> SupportedDataSourceKinds,
    IReadOnlyList<string> Capabilities,
    string ConfigurationSchemaJson,
    string CredentialSchemaJson,
    string HealthCheckMode);

public sealed record ConnectorRegistrationResult(
    Guid DataSourceId,
    string Name,
    string Description,
    string ConnectorType,
    string SanitizedConfigurationJson,
    string Status);

public sealed record ConnectorConfigurationValidationResultModel(
    string ConnectorType,
    bool IsValid,
    IReadOnlyList<string> Errors,
    string SanitizedConfigurationJson,
    string ConfigurationSchemaJson);

public sealed record ConnectorHealthResult(
    Guid DataSourceId,
    string ConnectorType,
    bool IsHealthy,
    string Status,
    IReadOnlyList<string> Messages,
    string DetailsJson,
    DateTime CheckedAtUtc);
