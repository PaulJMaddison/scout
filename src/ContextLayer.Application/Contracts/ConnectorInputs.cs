using ContextLayer.Domain.Enums;

namespace ContextLayer.Application.Contracts;

public sealed record RegisterConnectorInput(
    Guid? Id,
    string TenantSlug,
    string Name,
    string Description,
    DataSourceKind Kind,
    string ConnectorType,
    string ConfigurationJson,
    string? CredentialsJson);

public sealed record ValidateConnectorConfigurationInput(
    string ConnectorType,
    DataSourceKind Kind,
    string ConfigurationJson,
    string? CredentialsJson);

public sealed record CheckConnectorHealthInput(
    string TenantSlug,
    Guid DataSourceId,
    string? ExternalUserId,
    string? Mode);
