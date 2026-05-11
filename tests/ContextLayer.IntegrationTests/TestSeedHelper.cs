using ContextLayer.Infrastructure.Seed;
using Microsoft.Extensions.DependencyInjection;

namespace ContextLayer.IntegrationTests;

internal static class TestSeedHelper
{
    public static void SeedDemoData(IServiceCollection services)
    {
        using var serviceProvider = services.BuildServiceProvider();
        DemoDataSeeder.SeedAsync(serviceProvider).GetAwaiter().GetResult();
    }
}
