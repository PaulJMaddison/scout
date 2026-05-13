using System.Data;
using System.Data.Common;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using ContextLayer.Application.Abstractions;
using ContextLayer.Domain.Enums;
using ContextLayer.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ContextLayer.Infrastructure.Connectors;

internal sealed class SqlConnectorPlugin(
    ContextLayerDbContext contextLayerDbContext,
    CustomerOpsDbContext customerOpsDbContext) : ConnectorPluginBase
{
    public override string ConnectorType => "sqlDatabase";

    public override string DisplayName => "SQL Database Connector";

    public override string Description => "Fetches subject rows from the current context database, customer operations database, or an external PostgreSQL connection.";

    public override IReadOnlyList<string> Aliases => ["sqlTable", "postgresql"];

    public override IReadOnlyList<DataSourceKind> SupportedDataSourceKinds => [DataSourceKind.SqlMetric, DataSourceKind.Crm, DataSourceKind.ProductUsage];

    public override JsonObject GetConfigurationSchema()
        => new()
        {
            ["type"] = "object",
            ["required"] = new JsonArray("tableName", "userIdColumn", "columns"),
            ["properties"] = new JsonObject
            {
                ["mode"] = new JsonObject { ["type"] = "string" },
                ["tableName"] = new JsonObject { ["type"] = "string" },
                ["userIdColumn"] = new JsonObject { ["type"] = "string" },
                ["tenantSlugColumn"] = new JsonObject { ["type"] = "string" },
                ["tenantSlug"] = new JsonObject { ["type"] = "string" },
                ["observedAtColumn"] = new JsonObject { ["type"] = "string" },
                ["columns"] = new JsonObject { ["type"] = "array" },
                ["connectionString"] = new JsonObject { ["type"] = "string" },
                ["credentials"] = new JsonObject { ["type"] = "object" }
            }
        };

    public override JsonObject GetCredentialSchema()
        => new()
        {
            ["type"] = "object",
            ["description"] = "Optional external PostgreSQL connection string. Local demo modes use configured application databases instead.",
            ["properties"] = new JsonObject
            {
                ["connectionString"] = new JsonObject { ["type"] = "string", ["secret"] = true }
            }
        };

    public override JsonObject GetSampleConfiguration()
        => new()
        {
            ["mode"] = "customerOpsDatabase",
            ["tableName"] = "customer_context_rollups",
            ["tenantSlug"] = "demo",
            ["tenantSlugColumn"] = "tenant_slug",
            ["userIdColumn"] = "external_user_id",
            ["observedAtColumn"] = "observed_at_utc",
            ["columns"] = new JsonArray("plan_interest_signal", "active_days_30")
        };

    public override async Task<ConnectorConfigurationValidationResult> ValidateConfigurationAsync(
        ConnectorConfigurationValidationRequest request,
        CancellationToken cancellationToken)
    {
        var baseline = await base.ValidateConfigurationAsync(request, cancellationToken);
        var errors = baseline.Errors.ToList();
        foreach (var field in new[] { "tableName", "userIdColumn" })
        {
            var identifier = request.Configuration[field]?.GetValue<string>();
            if (string.IsNullOrWhiteSpace(identifier) || !identifier.All(static c => char.IsLetterOrDigit(c) || c == '_'))
            {
                errors.Add($"SQL connector field '{field}' is required and must contain only letters, numbers, or underscores.");
            }
        }

        if (request.Configuration["columns"] is not JsonArray columns || columns.Count == 0)
        {
            errors.Add("SQL connector requires a non-empty columns array.");
        }

        return baseline with
        {
            IsValid = errors.Count == 0,
            Errors = errors
        };
    }

    public override async Task<ConnectorHealthCheckResult> CheckHealthAsync(
        ConnectorHealthCheckRequest request,
        CancellationToken cancellationToken)
    {
        var connection = await OpenConnectionAsync(request.Configuration, request.Credentials, cancellationToken);
        try
        {
            return new ConnectorHealthCheckResult(
                true,
                "healthy",
                [$"Successfully opened SQL connection for connector '{ConnectorType}'."],
                "{}",
                DateTime.UtcNow);
        }
        finally
        {
            if (connection != contextLayerDbContext.Database.GetDbConnection()
                && connection != customerOpsDbContext.Database.GetDbConnection())
            {
                await connection.DisposeAsync();
            }
        }
    }

    public override async Task<ConnectorFetchResult> FetchAsync(
        ConnectorFetchRequest request,
        CancellationToken cancellationToken)
    {
        var configuration = request.Configuration;
        var tableName = GetIdentifier(configuration, "tableName");
        var userIdColumn = GetIdentifier(configuration, "userIdColumn");
        var tenantSlugColumn = configuration["tenantSlugColumn"]?.GetValue<string>();
        var observedAtColumn = configuration["observedAtColumn"]?.GetValue<string>();
        var columns = configuration["columns"]?.AsArray()
            .Select(static node => node?.GetValue<string>() ?? string.Empty)
            .Where(static value => !string.IsNullOrWhiteSpace(value))
            .ToArray() ?? throw new InvalidOperationException("SQL connector requires a columns array.");
        var connection = await OpenConnectionAsync(configuration, request.Credentials, cancellationToken);
        var disposeConnection = connection != contextLayerDbContext.Database.GetDbConnection()
            && connection != customerOpsDbContext.Database.GetDbConnection();

        try
        {
            await using var command = connection.CreateCommand();
            var selectColumns = columns.Select(QuoteIdentifier).ToList();
            if (!string.IsNullOrWhiteSpace(observedAtColumn) && columns.All(x => !string.Equals(x, observedAtColumn, StringComparison.OrdinalIgnoreCase)))
            {
                selectColumns.Add(QuoteIdentifier(observedAtColumn));
            }

            if (!string.IsNullOrWhiteSpace(tenantSlugColumn) && columns.All(x => !string.Equals(x, tenantSlugColumn, StringComparison.OrdinalIgnoreCase)))
            {
                selectColumns.Add(QuoteIdentifier(tenantSlugColumn));
            }

            var whereClauses = new List<string> { $"{QuoteIdentifier(userIdColumn)} = @userId" };
            if (!string.IsNullOrWhiteSpace(tenantSlugColumn))
            {
                whereClauses.Add($"{QuoteIdentifier(tenantSlugColumn)} = @tenantSlug");
            }

            var orderByClause = string.IsNullOrWhiteSpace(observedAtColumn)
                ? string.Empty
                : $" order by {QuoteIdentifier(observedAtColumn)} desc";
            command.CommandText = string.Create(
                CultureInfo.InvariantCulture,
                $"select {string.Join(", ", selectColumns)} from {QuoteIdentifier(tableName)} where {string.Join(" and ", whereClauses)}{orderByClause} limit 1");

            var userParameter = command.CreateParameter();
            userParameter.ParameterName = "@userId";
            userParameter.Value = request.Subject.ExternalUserId;
            command.Parameters.Add(userParameter);

            if (!string.IsNullOrWhiteSpace(tenantSlugColumn))
            {
                var tenantParameter = command.CreateParameter();
                tenantParameter.ParameterName = "@tenantSlug";
                tenantParameter.Value = configuration["tenantSlug"]?.GetValue<string>() ?? throw new InvalidOperationException("SQL connector requires tenantSlug when tenantSlugColumn is configured.");
                command.Parameters.Add(tenantParameter);
            }

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                throw new InvalidOperationException($"No SQL row exists for user '{request.Subject.ExternalUserId}' in table '{tableName}'.");
            }

            var payload = new JsonObject();
            var observedAtUtc = DateTime.UtcNow;
            for (var index = 0; index < reader.FieldCount; index++)
            {
                var name = reader.GetName(index);
                var value = reader.IsDBNull(index) ? null : reader.GetValue(index);
                if (string.Equals(name, observedAtColumn, StringComparison.OrdinalIgnoreCase))
                {
                    observedAtUtc = value switch
                    {
                        DateTime dateTime => DateTime.SpecifyKind(dateTime, DateTimeKind.Utc),
                        DateTimeOffset offset => offset.UtcDateTime,
                        string stringValue when DateTime.TryParse(stringValue, out var parsed) => parsed,
                        _ => observedAtUtc
                    };
                    continue;
                }

                payload[name] = JsonValue.Create(value);
            }

            return new ConnectorFetchResult(
                payload.ToJsonString(),
                payload,
                JsonSerializer.Serialize(new[]
                {
                    new
                    {
                        source = ConnectorType,
                        tableName,
                        request.Subject.ExternalUserId,
                        observedAtUtc
                    }
                }),
                observedAtUtc,
                null,
                "{}");
        }
        finally
        {
            if (disposeConnection)
            {
                await connection.DisposeAsync();
            }
        }
    }

    private async Task<DbConnection> OpenConnectionAsync(JsonObject configuration, JsonObject credentials, CancellationToken cancellationToken)
    {
        var mode = configuration["mode"]?.GetValue<string>() ?? "customerOpsDatabase";
        return mode.Trim().ToLowerInvariant() switch
        {
            "currentdatabase" => await OpenSharedConnectionAsync(contextLayerDbContext.Database.GetDbConnection(), cancellationToken),
            "customeropsdatabase" => await OpenSharedConnectionAsync(customerOpsDbContext.Database.GetDbConnection(), cancellationToken),
            "connectionstring" => await OpenExternalConnectionAsync(configuration["connectionString"]?.GetValue<string>() ?? credentials["connectionString"]?.GetValue<string>(), cancellationToken),
            _ => throw new InvalidOperationException($"SQL connector mode '{mode}' is not supported.")
        };
    }

    private static async Task<DbConnection> OpenSharedConnectionAsync(DbConnection connection, CancellationToken cancellationToken)
    {
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        return connection;
    }

    private static async Task<DbConnection> OpenExternalConnectionAsync(string? connectionString, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("SQL connector requires a connectionString in configuration or credentials.");
        }

        var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        return connection;
    }

    private static string GetIdentifier(JsonObject config, string key)
    {
        var value = config[key]?.GetValue<string>();
        if (string.IsNullOrWhiteSpace(value) || !value.All(static c => char.IsLetterOrDigit(c) || c == '_'))
        {
            throw new InvalidOperationException($"SQL connector field '{key}' contains unsupported characters.");
        }

        return value;
    }

    private static string QuoteIdentifier(string identifier) => "\"" + identifier.Replace("\"", "\"\"", StringComparison.Ordinal) + "\"";
}
