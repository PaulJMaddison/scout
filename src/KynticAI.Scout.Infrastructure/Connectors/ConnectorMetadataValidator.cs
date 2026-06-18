using System.Text.Json;
using System.Text.Json.Nodes;
using KynticAI.Scout.Application.Abstractions;

namespace KynticAI.Scout.Infrastructure.Connectors;

/// <summary>
/// Validates that a connector plugin's metadata is well-formed and conforms
/// to the public <see cref="IConnectorPlugin"/> contract.
/// </summary>
public static class ConnectorMetadataValidator
{
    private static readonly HashSet<string> SensitiveFieldNames = new(StringComparer.OrdinalIgnoreCase)
    {
        "password",
        "secret",
        "token",
        "credential",
        "credentials",
        "apiKey",
        "apiSecret",
        "accessToken",
        "refreshToken",
        "privateKey",
        "connectionString",
        "bearerToken",
        "clientSecret"
    };

    public static ConnectorMetadataValidationResult Validate(IConnectorPlugin plugin)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(plugin.ConnectorType))
            errors.Add("ConnectorType must not be empty.");
        else if (!IsCamelCaseIdentifier(plugin.ConnectorType))
            errors.Add("ConnectorType must start with a lowercase letter and contain only letters or numbers.");

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
        else
            ValidateAliases(plugin, errors);

        ValidateSchema(plugin.GetConfigurationSchema(), "ConfigurationSchema", errors);
        ValidateSchema(plugin.GetCredentialSchema(), "CredentialSchema", errors);
        ValidateSampleConfiguration(plugin, errors);
        ValidateSampleSecrets(plugin.GetSampleConfiguration(), errors);

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
        else if (schema["properties"] is not JsonObject)
            errors.Add($"{name} \"properties\" must be a JSON object.");

        if (schema["required"] is not null and not JsonArray)
            errors.Add($"{name} \"required\" must be an array when provided.");

        if (schema["required"] is JsonArray required && schema["properties"] is JsonObject properties)
        {
            foreach (var field in required)
            {
                var fieldName = field?.GetValue<string>();
                if (string.IsNullOrWhiteSpace(fieldName))
                {
                    errors.Add($"{name} \"required\" entries must be non-empty strings.");
                    continue;
                }

                if (!properties.ContainsKey(fieldName))
                    errors.Add($"{name} required field \"{fieldName}\" must also be declared in \"properties\".");
            }
        }
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

    private static void ValidateAliases(IConnectorPlugin plugin, List<string> errors)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { plugin.ConnectorType };
        foreach (var alias in plugin.Aliases)
        {
            if (string.IsNullOrWhiteSpace(alias))
            {
                errors.Add("Aliases must contain only non-empty values.");
                continue;
            }

            if (!seen.Add(alias))
                errors.Add($"Alias \"{alias}\" duplicates the connector type or another alias.");
        }
    }

    private static void ValidateSampleSecrets(JsonObject sampleConfiguration, List<string> errors)
        => ValidateSampleSecrets(sampleConfiguration, "SampleConfiguration", errors);

    private static void ValidateSampleSecrets(JsonNode? node, string path, List<string> errors)
    {
        if (node is JsonObject obj)
        {
            foreach (var kvp in obj)
            {
                var childPath = $"{path}.{kvp.Key}";
                if (SensitiveFieldNames.Contains(kvp.Key)
                    && kvp.Value is JsonValue value
                    && value.TryGetValue<string>(out var secretValue)
                    && !secretValue.StartsWith("secret://", StringComparison.Ordinal))
                {
                    errors.Add($"{childPath} must use a secret:// reference in sample configuration.");
                }

                ValidateSampleSecrets(kvp.Value, childPath, errors);
            }
        }
        else if (node is JsonArray array)
        {
            for (var i = 0; i < array.Count; i++)
            {
                ValidateSampleSecrets(array[i], $"{path}[{i}]", errors);
            }
        }
    }

    private static bool IsCamelCaseIdentifier(string value)
        => value.Length > 0
            && char.IsLower(value[0])
            && value.All(static c => char.IsLetterOrDigit(c));
}

public sealed record ConnectorMetadataValidationResult(
    bool IsValid,
    IReadOnlyList<string> Errors);
