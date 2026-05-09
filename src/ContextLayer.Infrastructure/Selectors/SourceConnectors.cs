using System.Data;
using System.Data.Common;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using ContextLayer.Domain.Entities;
using ContextLayer.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace ContextLayer.Infrastructure.Selectors;

internal sealed class MockSignalSourceConnector(ContextLayerDbContext dbContext) : ISelectorSourceConnector
{
    public string ConnectorType => "mockSignal";

    public async Task<SourceFetchResult> FetchAsync(
        SelectorDefinition selector,
        UserProfile userProfile,
        DataSource dataSource,
        JsonObject connectionConfig,
        CancellationToken cancellationToken)
    {
        var signals = await dbContext.UserSignals
            .AsNoTracking()
            .Where(x => x.UserProfileId == userProfile.Id && x.DataSourceId == dataSource.Id)
            .OrderByDescending(x => x.ObservedAtUtc)
            .ToListAsync(cancellationToken);

        if (signals.Count == 0)
        {
            throw new InvalidOperationException($"No mock signals exist for data source '{dataSource.Name}' and user '{userProfile.ExternalUserId}'.");
        }

        var latestPerKey = signals
            .GroupBy(x => x.Key, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.OrderByDescending(x => x.ObservedAtUtc).First())
            .ToList();

        var payload = new JsonObject();
        foreach (var signal in latestPerKey)
        {
            ConnectorJsonPathWriter.SetNestedValue(payload, signal.Key, JsonNode.Parse(signal.ValueJson));
        }

        return new SourceFetchResult(
            JsonSerializer.Serialize(payload),
            payload,
            latestPerKey.Max(x => x.ObservedAtUtc),
            JsonSerializer.Serialize(latestPerKey.Select(signal => new
            {
                source = ConnectorType,
                signal.Id,
                signal.Key,
                signal.ObservedAtUtc,
                signal.ProvenanceJson
            })));
    }
}

internal sealed class MockPayloadSourceConnector : ISelectorSourceConnector
{
    public string ConnectorType => "mockPayload";

    public Task<SourceFetchResult> FetchAsync(
        SelectorDefinition selector,
        UserProfile userProfile,
        DataSource dataSource,
        JsonObject connectionConfig,
        CancellationToken cancellationToken)
    {
        var records = connectionConfig["records"]?.AsArray()
            ?? throw new InvalidOperationException("Mock payload connector requires a records array.");

        var record = records
            .Select(node => node as JsonObject)
            .FirstOrDefault(item => item?["externalUserId"]?.GetValue<string>() == userProfile.ExternalUserId)
            ?? throw new InvalidOperationException($"No mock payload record exists for user '{userProfile.ExternalUserId}'.");

        var payload = record["payload"] as JsonObject
            ?? throw new InvalidOperationException("Mock payload record requires a payload object.");
        var observedAtUtc = record["observedAtUtc"]?.GetValue<DateTime?>() ?? DateTime.UtcNow;

        return Task.FromResult(new SourceFetchResult(
            payload.ToJsonString(),
            (JsonObject)payload.DeepClone(),
            observedAtUtc,
            JsonSerializer.Serialize(new[]
            {
                new
                {
                    source = ConnectorType,
                    dataSourceId = dataSource.Id,
                    userProfile.ExternalUserId,
                    observedAtUtc
                }
            })));
    }
}

internal sealed class ApiPayloadSourceConnector : ISelectorSourceConnector
{
    public string ConnectorType => "apiPayload";

    public Task<SourceFetchResult> FetchAsync(
        SelectorDefinition selector,
        UserProfile userProfile,
        DataSource dataSource,
        JsonObject connectionConfig,
        CancellationToken cancellationToken)
    {
        var responses = connectionConfig["responses"]?.AsArray()
            ?? throw new InvalidOperationException("API payload connector requires a responses array.");

        var response = responses
            .Select(node => node as JsonObject)
            .FirstOrDefault(item => item?["externalUserId"]?.GetValue<string>() == userProfile.ExternalUserId)
            ?? throw new InvalidOperationException($"No API payload exists for user '{userProfile.ExternalUserId}'.");

        var payload = response["payload"] as JsonObject
            ?? throw new InvalidOperationException("API payload response requires a payload object.");
        var observedAtUtc = response["observedAtUtc"]?.GetValue<DateTime?>() ?? DateTime.UtcNow;

        return Task.FromResult(new SourceFetchResult(
            payload.ToJsonString(),
            (JsonObject)payload.DeepClone(),
            observedAtUtc,
            JsonSerializer.Serialize(new[]
            {
                new
                {
                    source = ConnectorType,
                    endpoint = response["endpoint"]?.GetValue<string>(),
                    statusCode = response["statusCode"]?.GetValue<int?>(),
                    userProfile.ExternalUserId,
                    observedAtUtc
                }
            })));
    }
}

internal sealed class SqlTableSourceConnector(
    ContextLayerDbContext contextLayerDbContext,
    CustomerOpsDbContext customerOpsDbContext) : ISelectorSourceConnector
{
    public string ConnectorType => "sqlTable";

    public async Task<SourceFetchResult> FetchAsync(
        SelectorDefinition selector,
        UserProfile userProfile,
        DataSource dataSource,
        JsonObject connectionConfig,
        CancellationToken cancellationToken)
    {
        var mode = connectionConfig["mode"]?.GetValue<string>() ?? "customerOpsDatabase";
        var tableName = GetIdentifier(connectionConfig, "tableName");
        var userIdColumn = GetIdentifier(connectionConfig, "userIdColumn");
        var tenantSlugColumn = connectionConfig["tenantSlugColumn"]?.GetValue<string>();
        var observedAtColumn = connectionConfig["observedAtColumn"]?.GetValue<string>();
        var columns = connectionConfig["columns"]?.AsArray().Select(node => node?.GetValue<string>() ?? string.Empty).Where(static value => !string.IsNullOrWhiteSpace(value)).ToArray()
            ?? throw new InvalidOperationException("SQL table connector requires a columns array.");

        foreach (var column in columns)
        {
            ValidateIdentifier(column, nameof(columns));
        }

        if (!string.IsNullOrWhiteSpace(observedAtColumn))
        {
            ValidateIdentifier(observedAtColumn, nameof(observedAtColumn));
        }

        if (!string.IsNullOrWhiteSpace(tenantSlugColumn))
        {
            ValidateIdentifier(tenantSlugColumn, nameof(tenantSlugColumn));
        }

        var disposeConnection =
            !string.Equals(mode, "currentDatabase", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(mode, "customerOpsDatabase", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(mode, "connectionAlias", StringComparison.OrdinalIgnoreCase);
        var connection = await OpenConnectionAsync(mode, connectionConfig, cancellationToken);
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

            var whereClauses = new List<string>
            {
                $"{QuoteIdentifier(userIdColumn)} = @userId"
            };
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

            var parameter = command.CreateParameter();
            parameter.ParameterName = "@userId";
            parameter.Value = userProfile.ExternalUserId;
            command.Parameters.Add(parameter);

            if (!string.IsNullOrWhiteSpace(tenantSlugColumn))
            {
                var tenantParameter = command.CreateParameter();
                tenantParameter.ParameterName = "@tenantSlug";
                tenantParameter.Value = ResolveTenantSlug(connectionConfig, dataSource, selector);
                command.Parameters.Add(tenantParameter);
            }

            await using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (!await reader.ReadAsync(cancellationToken))
            {
                throw new InvalidOperationException($"No SQL table row exists for user '{userProfile.ExternalUserId}' in table '{tableName}'.");
            }

            var payload = new JsonObject();
            DateTime observedAtUtc = DateTime.UtcNow;
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
                        _ => observedAtUtc
                    };
                    continue;
                }

                payload[name] = JsonValue.Create(value);
            }

            return new SourceFetchResult(
                payload.ToJsonString(),
                payload,
                observedAtUtc,
                JsonSerializer.Serialize(new[]
                {
                    new
                    {
                        source = ConnectorType,
                        mode,
                        tableName,
                        userIdColumn,
                        tenantSlugColumn,
                        columns,
                        userProfile.ExternalUserId,
                        observedAtUtc
                    }
                }));
        }
        finally
        {
            if (disposeConnection)
            {
                await connection.DisposeAsync();
            }
        }
    }

    private async Task<DbConnection> OpenConnectionAsync(string mode, JsonObject connectionConfig, CancellationToken cancellationToken)
    {
        return mode.ToLowerInvariant() switch
        {
            "currentdatabase" => await OpenCurrentDbConnectionAsync(cancellationToken),
            "customeropsdatabase" => await OpenCustomerOpsDbConnectionAsync(cancellationToken),
            "connectionalias" => await OpenAliasedConnectionAsync(connectionConfig, cancellationToken),
            "connectionstring" => await OpenNpgsqlConnectionAsync(connectionConfig, cancellationToken),
            _ => throw new InvalidOperationException($"SQL table connector mode '{mode}' is not supported.")
        };
    }

    private async Task<DbConnection> OpenCurrentDbConnectionAsync(CancellationToken cancellationToken)
    {
        var connection = contextLayerDbContext.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        return connection;
    }

    private async Task<DbConnection> OpenCustomerOpsDbConnectionAsync(CancellationToken cancellationToken)
    {
        var connection = customerOpsDbContext.Database.GetDbConnection();
        if (connection.State != ConnectionState.Open)
        {
            await connection.OpenAsync(cancellationToken);
        }

        return connection;
    }

    private async Task<DbConnection> OpenAliasedConnectionAsync(JsonObject connectionConfig, CancellationToken cancellationToken)
    {
        var alias = connectionConfig["connectionAlias"]?.GetValue<string>()
            ?? throw new InvalidOperationException("SQL table connector mode 'connectionAlias' requires a connectionAlias.");
        return alias.Trim().ToLowerInvariant() switch
        {
            "customerops" => await OpenCustomerOpsDbConnectionAsync(cancellationToken),
            "contextlayer" => await OpenCurrentDbConnectionAsync(cancellationToken),
            _ => throw new InvalidOperationException($"SQL table connector connection alias '{alias}' is not supported.")
        };
    }

    private static async Task<DbConnection> OpenNpgsqlConnectionAsync(JsonObject connectionConfig, CancellationToken cancellationToken)
    {
        var connectionString = connectionConfig["connectionString"]?.GetValue<string>()
            ?? throw new InvalidOperationException("SQL table connector mode 'connectionString' requires a connectionString.");
        var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        return connection;
    }

    private static string GetIdentifier(JsonObject config, string key)
    {
        var value = config[key]?.GetValue<string>()
            ?? throw new InvalidOperationException($"SQL table connector requires '{key}'.");
        ValidateIdentifier(value, key);
        return value;
    }

    private static void ValidateIdentifier(string value, string name)
    {
        if (string.IsNullOrWhiteSpace(value) || !value.All(character => char.IsLetterOrDigit(character) || character == '_'))
        {
            throw new InvalidOperationException($"SQL identifier '{name}' contains unsupported characters.");
        }
    }

    private static string QuoteIdentifier(string identifier) => "\"" + identifier.Replace("\"", "\"\"", StringComparison.Ordinal) + "\"";

    private static string ResolveTenantSlug(JsonObject connectionConfig, DataSource dataSource, SelectorDefinition selector)
    {
        var tenantSlug = connectionConfig["tenantSlug"]?.GetValue<string>();
        if (!string.IsNullOrWhiteSpace(tenantSlug))
        {
            return tenantSlug.Trim().ToLowerInvariant();
        }

        var metadata = new
        {
            dataSource = dataSource.Name,
            selector = selector.Name
        };
        throw new InvalidOperationException($"SQL table connector requires tenantSlug when tenantSlugColumn is configured. Source metadata: {JsonSerializer.Serialize(metadata)}");
    }
}

file static class ConnectorJsonPathWriter
{
    public static void SetNestedValue(JsonObject root, string path, JsonNode? value)
    {
        var segments = path.Split('.', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        JsonObject current = root;
        for (var index = 0; index < segments.Length - 1; index++)
        {
            if (current[segments[index]] is not JsonObject child)
            {
                child = new JsonObject();
                current[segments[index]] = child;
            }

            current = child;
        }

        current[segments[^1]] = value;
    }
}
