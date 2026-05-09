using ContextLayer.Application.Abstractions;
using ContextLayer.Infrastructure.Auth;
using ContextLayer.Infrastructure.AI;
using ContextLayer.Infrastructure.Jobs;
using ContextLayer.Infrastructure.Persistence;
using ContextLayer.Infrastructure.Selectors;
using ContextLayer.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace ContextLayer.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddContextLayerInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ContextLayerDbContext>(options =>
            DatabaseProviderConfigurator.ConfigureContextLayer(options, configuration));

        services.AddDbContext<CustomerOpsDbContext>(options =>
            DatabaseProviderConfigurator.ConfigureCustomerOps(options, configuration));

        services.AddScoped<IContextLayerDbContext>(provider => provider.GetRequiredService<ContextLayerDbContext>());
        services.AddScoped<ICustomerOpsDbContext>(provider => provider.GetRequiredService<CustomerOpsDbContext>());
        services.AddHttpContextAccessor();
        services.Configure<AuthOptions>(configuration.GetSection(AuthOptions.SectionName));
        services.Configure<LlmOptions>(configuration.GetSection(LlmOptions.SectionName));
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<PasswordHashingService>();
        services.AddSingleton<JwtTokenService>();
        services.AddScoped<AuthenticationService>();
        services.AddScoped<ICurrentActorService, CurrentActorService>();
        services.AddSingleton<IBackgroundJobMonitor, InMemoryBackgroundJobMonitor>();
        services.AddSingleton<BackgroundJobMetrics>();
        services.AddSingleton<IHostedService>(provider => provider.GetRequiredService<BackgroundJobMetrics>());
        services.AddScoped<ContextRecomputeProcessor>();
        services.AddScoped<ISalesSupportAgentService, SalesSupportAgentService>();
        services.AddScoped<IStructuredLlmClient, MockStructuredLlmClient>();
        services.AddScoped<IStructuredLlmClientRegistry, StructuredLlmClientRegistry>();
        services.AddScoped<ISelectorExecutionEngine, SelectorExecutionEngine>();
        services.AddScoped<IScheduledRecomputeDispatcher, ScheduledRecomputeDispatcher>();
        services.AddScoped<ISelectorSourceConnector, MockSignalSourceConnector>();
        services.AddScoped<ISelectorSourceConnector, MockPayloadSourceConnector>();
        services.AddScoped<ISelectorSourceConnector, ApiPayloadSourceConnector>();
        services.AddScoped<ISelectorSourceConnector, SqlTableSourceConnector>();
        services.AddSingleton<ContextRecomputeQueue>();
        services.AddSingleton<IContextRecomputeQueue>(provider => provider.GetRequiredService<ContextRecomputeQueue>());
        services.AddHostedService<ContextRecomputeWorker>();
        services.AddHostedService<ScheduledRecomputeWorker>();
        services.AddSingleton<IClock, SystemClock>();

        return services;
    }
}
