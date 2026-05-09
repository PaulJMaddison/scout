using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

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
            ?? "Host=localhost;Port=5432;Database=context_layer_db;Username=postgres;Password=postgres";

        Configure(optionsBuilder, ResolveProvider(configuration, connectionString), connectionString);
    }

    public static void ConfigureCustomerOps(DbContextOptionsBuilder optionsBuilder, IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("CustomerOps")
            ?? configuration["CUSTOMER_OPS_CONNECTION_STRING"]
            ?? "Host=localhost;Port=5432;Database=customer_ops_db;Username=postgres;Password=postgres";

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

    private static void Configure(DbContextOptionsBuilder optionsBuilder, string? providerName, string connectionString)
    {
        var resolvedProvider = ResolveProvider(providerName, connectionString);
        if (string.Equals(resolvedProvider, SqliteProviderName, StringComparison.OrdinalIgnoreCase))
        {
            optionsBuilder.UseSqlite(connectionString);
            return;
        }

        optionsBuilder.UseNpgsql(connectionString, builder => builder.MigrationsHistoryTable("__ef_migrations_history"));
    }

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
}
