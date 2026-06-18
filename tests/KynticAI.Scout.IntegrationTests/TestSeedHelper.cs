using KynticAI.Scout.Infrastructure.Auth;
using KynticAI.Scout.Infrastructure.Seed;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace KynticAI.Scout.IntegrationTests;

internal static class TestSeedHelper
{
    private const int FastPasswordHashIterationCount = 1_000;

    public static void UseFastPasswordHashing(IServiceCollection services)
    {
        services.RemoveAll<PasswordHashingService>();
        services.AddSingleton(new PasswordHashingService(FastPasswordHashIterationCount));
    }

    public static void SeedDemoData(IServiceCollection services)
    {
        UseFastPasswordHashing(services);

        using var serviceProvider = services.BuildServiceProvider();
        DemoDataSeeder.SeedAsync(serviceProvider).GetAwaiter().GetResult();
    }
}
