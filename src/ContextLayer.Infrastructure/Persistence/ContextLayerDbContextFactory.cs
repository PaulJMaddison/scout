using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ContextLayer.Infrastructure.Persistence;

public sealed class ContextLayerDbContextFactory : IDesignTimeDbContextFactory<ContextLayerDbContext>
{
    public ContextLayerDbContext CreateDbContext(string[] args)
    {
        var providerName =
            Environment.GetEnvironmentVariable("Database__Provider")
            ?? Environment.GetEnvironmentVariable("DATABASE_PROVIDER")
            ?? Environment.GetEnvironmentVariable("Demo__DatabaseProvider")
            ?? Environment.GetEnvironmentVariable("DEMO_DATABASE_PROVIDER");
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__ContextLayer")
            ?? Environment.GetEnvironmentVariable("CONTEXT_LAYER_CONNECTION_STRING")
            ?? DatabaseProviderConfigurator.GetDefaultContextLayerConnectionString();

        var optionsBuilder = new DbContextOptionsBuilder<ContextLayerDbContext>();
        DatabaseProviderConfigurator.Configure(optionsBuilder, providerName, connectionString);
        return new ContextLayerDbContext(optionsBuilder.Options);
    }
}
