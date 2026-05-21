using KynticAI.Scout.Infrastructure.Seed;
using Microsoft.Extensions.DependencyInjection;

namespace KynticAI.Scout.IntegrationTests;

internal static class TestSeedHelper
{
    public static void SeedDemoData(IServiceCollection services)
    {
        using var serviceProvider = services.BuildServiceProvider();
        DemoDataSeeder.SeedAsync(serviceProvider).GetAwaiter().GetResult();
    }
}
