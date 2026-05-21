using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace KynticAI.Scout.Infrastructure.Persistence;

public sealed class CustomerOpsDbContextFactory : IDesignTimeDbContextFactory<CustomerOpsDbContext>
{
    public CustomerOpsDbContext CreateDbContext(string[] args)
    {
        var providerName =
            Environment.GetEnvironmentVariable("Database__Provider")
            ?? Environment.GetEnvironmentVariable("DATABASE_PROVIDER")
            ?? Environment.GetEnvironmentVariable("Demo__DatabaseProvider")
            ?? Environment.GetEnvironmentVariable("DEMO_DATABASE_PROVIDER");
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__CustomerOps")
            ?? Environment.GetEnvironmentVariable("CUSTOMER_OPS_CONNECTION_STRING")
            ?? DatabaseProviderConfigurator.GetDefaultCustomerOpsConnectionString();

        var optionsBuilder = new DbContextOptionsBuilder<CustomerOpsDbContext>();
        DatabaseProviderConfigurator.Configure(optionsBuilder, providerName, connectionString);
        return new CustomerOpsDbContext(optionsBuilder.Options);
    }
}
