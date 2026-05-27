using System.Text.Json.Nodes;
using KynticAI.Scout.Application.Abstractions;

namespace KynticAI.Scout.Infrastructure.Connectors;

/// <summary>
/// Validates that a connector plugin's metadata is well-formed and conforms
/// to the public <see cref="IConnectorPlugin"/> contract.
/// </summary>
public static class ConnectorMetadataValidator
{
    public static ConnectorMetadataValidationResult Validate(IConnectorPlugin plugin)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(plugin.ConnectorType))
            errors.Add("ConnectorType must not be empty.");

        if (string.IsNullOrWhiteSpace(plugin.DisplayName))
            errors.Add("DisplayName must not be empty.");

        if (string.IsNullOrWhiteSpace(plugin.Description))
            errors.Add("Description must not be empty.");

        if (plugin.SupportedDataSourceKinds is null || plugin.SupportedDataSourceKinds.Count == 0)
            errors.Add("SupportedDataSourceKinds must contain at least one entry.");

        if (plugin.SupportedCapabilities is null || plugin.SupportedCapabilities.Count == 0)
            errors.Add("SupportedCapabilities must contain at least one entry.");

        if (plugin.Aliases is null)
            errors.Add("Aliases must not be null (use an empty list if there are none).");

        ValidateSchema(plugin.GetConfigurationSchema(), "ConfigurationSchema", errors);
        ValidateSchema(plugin.GetCredentialSchema(), "CredentialSchema", errors);
        ValidateSampleConfiguration(plugin, errors);

        return new ConnectorMetadataValidationResult(errors.Count == 0, errors);
    }

    private static void ValidateSchema(JsonObject? schema, string name, List<string> errors)
    {
        if (schema is null)
        {
            errors.Add($"{name} must not be null.");
            return;
        }

        var typeNode = schema["type"];
        if (typeNode is null || typeNode.GetValue<string>() != "object")
            errors.Add($"{name} must have \"type\": \"object\".");

        if (schema["properties"] is null)
            errors.Add($"{name} must include a \"properties\" key.");
    }

    private static void ValidateSampleConfiguration(IConnectorPlugin plugin, List<string> errors)
    {
        var sample = plugin.GetSampleConfiguration();
        if (sample is null)
        {
            errors.Add("GetSampleConfiguration() must not return null.");
            return;
        }

        var schema = plugin.GetConfigurationSchema();
        if (schema?["required"] is JsonArray required)
        {
            foreach (var field in required)
            {
                var fieldName = field?.GetValue<string>();
                if (fieldName is not null && sample[fieldName] is null)
                    errors.Add($"Sample configuration is missing required field \"{fieldName}\".");
            }
        }
    }
}

public sealed record ConnectorMetadataValidationResult(
    bool IsValid,
    IReadOnlyList<string> Errors);
