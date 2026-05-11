using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace ContextLayer.Infrastructure.Persistence;

internal static class DatabaseProviderConfigurator
{
    private const string PostgresProviderName = "postgres";
    private const string SqliteProviderName = "sqlite";

    public static void ConfigureContextLayer(DbContextOptionsBuilder optionsBuilder, IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("ContextLayer")
            ?? configuration["CONTEXT_LAYER_CONNECTION_STRING"]
            ?? GetDefaultContextLayerConnectionString();

        Configure(optionsBuilder, ResolveProvider(configuration, connectionString), connectionString);
    }

    public static void ConfigureCustomerOps(DbContextOptionsBuilder optionsBuilder, IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("CustomerOps")
            ?? configuration["CUSTOMER_OPS_CONNECTION_STRING"]
            ?? GetDefaultCustomerOpsConnectionString();

        Configure(optionsBuilder, ResolveProvider(configuration, connectionString), connectionString);
    }

    public static void Configure(DbContextOptionsBuilder<ContextLayerDbContext> optionsBuilder, string? providerName, string connectionString) =>
        Configure((DbContextOptionsBuilder)optionsBuilder, providerName, connectionString);

    public static void Configure(DbContextOptionsBuilder<CustomerOpsDbContext> optionsBuilder, string? providerName, string connectionString) =>
        Configure((DbContextOptionsBuilder)optionsBuilder, providerName, connectionString);

    public static string ResolveProvider(IConfiguration configuration, string? connectionString)
    {
        var providerName =
            configuration["Database:Provider"]
            ?? configuration["DATABASE_PROVIDER"]
            ?? configuration["Demo:DatabaseProvider"]
            ?? configuration["DEMO_DATABASE_PROVIDER"];

        return ResolveProvider(providerName, connectionString);
    }

    public static string ResolveProvider(string? providerName, string? connectionString)
    {
        if (string.Equals(providerName, SqliteProviderName, StringComparison.OrdinalIgnoreCase))
        {
            return SqliteProviderName;
        }

        if (string.Equals(providerName, PostgresProviderName, StringComparison.OrdinalIgnoreCase)
            || string.Equals(providerName, "postgresql", StringComparison.OrdinalIgnoreCase))
        {
            return PostgresProviderName;
        }

        return LooksLikeSqlite(connectionString) ? SqliteProviderName : PostgresProviderName;
    }

    public static string GetDefaultContextLayerConnectionString() =>
        $"Data Source={GetDefaultDemoDataPath("context_layer_demo.db")}";

    public static string GetDefaultCustomerOpsConnectionString() =>
        $"Data Source={GetDefaultDemoDataPath("customer_ops_demo.db")}";

    private static void Configure(DbContextOptionsBuilder optionsBuilder, string? providerName, string connectionString)
    {
        var resolvedProvider = ResolveProvider(providerName, connectionString);
        if (string.Equals(resolvedProvider, SqliteProviderName, StringComparison.OrdinalIgnoreCase))
        {
            optionsBuilder.UseSqlite(connectionString);
            return;
        }

        optionsBuilder.UseNpgsql(NormalizePostgresConnectionString(connectionString), builder => builder.MigrationsHistoryTable("__ef_migrations_history"));
    }

    private static string NormalizePostgresConnectionString(string connectionString)
    {
        if (!Uri.TryCreate(connectionString, UriKind.Absolute, out var uri)
            || (!string.Equals(uri.Scheme, "postgres", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(uri.Scheme, "postgresql", StringComparison.OrdinalIgnoreCase)))
        {
            return connectionString;
        }

        var userInfoParts = uri.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            Username = userInfoParts.Length > 0 ? Uri.UnescapeDataString(userInfoParts[0]) : string.Empty,
            Password = userInfoParts.Length > 1 ? Uri.UnescapeDataString(userInfoParts[1]) : string.Empty
        };

        if (!uri.IsDefaultPort)
        {
            builder.Port = uri.Port;
        }

        var queryValues = ParseQuery(uri.Query);
        if (queryValues.TryGetValue("sslmode", out var sslMode)
            && Enum.TryParse<SslMode>(NormalizeSslMode(sslMode), ignoreCase: true, out var parsedSslMode))
        {
            builder.SslMode = parsedSslMode;
        }

        return builder.ConnectionString;
    }

    private static Dictionary<string, string> ParseQuery(string query)
    {
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(query))
        {
            return values;
        }

        foreach (var pair in query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var parts = pair.Split('=', 2);
            var key = Uri.UnescapeDataString(parts[0]);
            var value = parts.Length > 1 ? Uri.UnescapeDataString(parts[1]) : string.Empty;
            values[key] = value;
        }

        return values;
    }

    private static string NormalizeSslMode(string value)
        => value.Replace("-", string.Empty, StringComparison.Ordinal).Replace("_", string.Empty, StringComparison.Ordinal);

    private static bool LooksLikeSqlite(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return false;
        }

        var value = connectionString.Trim();
        return value.Contains("Data Source=", StringComparison.OrdinalIgnoreCase)
            || value.Contains("Filename=", StringComparison.OrdinalIgnoreCase)
            || value.EndsWith(".db", StringComparison.OrdinalIgnoreCase)
            || value.EndsWith(".sqlite", StringComparison.OrdinalIgnoreCase);
    }

    private static string GetDefaultDemoDataPath(string fileName)
    {
        var demoDataDirectory = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), ".demo-data"));
        Directory.CreateDirectory(demoDataDirectory);
        return Path.Combine(demoDataDirectory, fileName);
    }
}
