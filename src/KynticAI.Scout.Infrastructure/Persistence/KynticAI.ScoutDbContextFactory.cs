using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace KynticAI.Scout.Infrastructure.Persistence;

public sealed class ScoutDbContextFactory : IDesignTimeDbContextFactory<ScoutDbContext>
{
    public ScoutDbContext CreateDbContext(string[] args)
    {
        var providerName =
            Environment.GetEnvironmentVariable("Database__Provider")
            ?? Environment.GetEnvironmentVariable("DATABASE_PROVIDER")
            ?? Environment.GetEnvironmentVariable("Demo__DatabaseProvider")
            ?? Environment.GetEnvironmentVariable("DEMO_DATABASE_PROVIDER");
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__Scout")
            ?? Environment.GetEnvironmentVariable("SCOUT_CONNECTION_STRING")
            ?? DatabaseProviderConfigurator.GetDefaultScoutConnectionString();

        var optionsBuilder = new DbContextOptionsBuilder<ScoutDbContext>();
        DatabaseProviderConfigurator.Configure(optionsBuilder, providerName, connectionString);
        return new ScoutDbContext(optionsBuilder.Options);
    }
}
