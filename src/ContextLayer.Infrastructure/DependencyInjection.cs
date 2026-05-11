using ContextLayer.Application.Abstractions;
using ContextLayer.Application.Services;
using ContextLayer.Infrastructure.Auth;
using ContextLayer.Infrastructure.AI;
using ContextLayer.Infrastructure.Connectors;
using ContextLayer.Infrastructure.Extensions;
using ContextLayer.Infrastructure.Jobs;
using ContextLayer.Infrastructure.Onboarding;
using ContextLayer.Infrastructure.Persistence;
using ContextLayer.Infrastructure.Selectors;
using ContextLayer.Infrastructure.Services;
using ContextLayer.Infrastructure.Configuration;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace ContextLayer.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddContextLayerInfrastructure(this IServiceCollection services, IConfiguration configuration, IHostEnvironment? environment = null)
    {
        var platformOptions = configuration.GetSection(PlatformOptions.SectionName).Get<PlatformOptions>() ?? new PlatformOptions();
        var dataProtectionOptions = configuration.GetSection(DataProtectionKeyOptions.SectionName).Get<DataProtectionKeyOptions>() ?? new DataProtectionKeyOptions();
        var hostedMode = (environment?.IsProduction() ?? false)
            || string.Equals(platformOptions.Mode, PlatformModes.SaaS, StringComparison.OrdinalIgnoreCase);
        if (hostedMode
            && dataProtectionOptions.RequirePersistentKeys
            && string.IsNullOrWhiteSpace(dataProtectionOptions.KeyRingPath))
        {
            throw new InvalidOperationException("DataProtection:KeyRingPath must be set to persistent storage before running in Production or SaaS mode with connector credential protection.");
        }

        services.AddDbContext<ContextLayerDbContext>(options =>
            DatabaseProviderConfigurator.ConfigureContextLayer(options, configuration));

        services.AddDbContext<CustomerOpsDbContext>(options =>
            DatabaseProviderConfigurator.ConfigureCustomerOps(options, configuration));

        services.AddScoped<IContextLayerDbContext>(provider => provider.GetRequiredService<ContextLayerDbContext>());
        services.AddScoped<ICustomerOpsDbContext>(provider => provider.GetRequiredService<CustomerOpsDbContext>());
        var dataProtection = services
            .AddDataProtection()
            .SetApplicationName(string.IsNullOrWhiteSpace(dataProtectionOptions.ApplicationName)
                ? "UniversalContextLayer"
                : dataProtectionOptions.ApplicationName);
        if (!string.IsNullOrWhiteSpace(dataProtectionOptions.KeyRingPath))
        {
            dataProtection.PersistKeysToFileSystem(new DirectoryInfo(dataProtectionOptions.KeyRingPath));
        }

        services.AddHttpClient("context-layer-connectors");
        services.AddHttpContextAccessor();
        services.Configure<AuthOptions>(configuration.GetSection(AuthOptions.SectionName));
        services.Configure<PlatformOptions>(configuration.GetSection(PlatformOptions.SectionName));
        services.Configure<FeatureFlagOptions>(configuration.GetSection(FeatureFlagOptions.SectionName));
        services.Configure<SaaSOptions>(configuration.GetSection(SaaSOptions.SectionName));
        services.Configure<ControlPlaneOptions>(configuration.GetSection(ControlPlaneOptions.SectionName));
        services.Configure<LicenceOptions>(configuration.GetSection(LicenceOptions.SectionName));
        services.Configure<BootstrapOptions>(configuration.GetSection(BootstrapOptions.SectionName));
        services.Configure<DataProtectionKeyOptions>(configuration.GetSection(DataProtectionKeyOptions.SectionName));
        services.Configure<TelemetryOptions>(configuration.GetSection(TelemetryOptions.SectionName));
        services.Configure<RateLimitOptions>(configuration.GetSection(RateLimitOptions.SectionName));
        services.Configure<ConnectorBootstrapOptions>(configuration.GetSection(ConnectorBootstrapOptions.SectionName));
        services.Configure<LlmOptions>(configuration.GetSection(LlmOptions.SectionName));
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<PasswordHashingService>();
        services.AddSingleton<JwtTokenService>();
        services.AddScoped<AuthenticationService>();
        services.AddScoped<MachineClientAuthenticationService>();
        services.AddScoped<ApiClientKeyService>();
        services.AddScoped<ICurrentActorService, CurrentActorService>();
        services.AddSingleton<IBackgroundJobMonitor, InMemoryBackgroundJobMonitor>();
        services.AddSingleton<BackgroundJobMetrics>();
        services.AddSingleton<IHostedService>(provider => provider.GetRequiredService<BackgroundJobMetrics>());
        services.AddScoped<ContextRecomputeProcessor>();
        services.AddScoped<ISalesSupportAgentService, SalesSupportAgentService>();
        services.AddScoped<IStructuredLlmClient, MockStructuredLlmClient>();
        services.AddScoped<IStructuredLlmClientRegistry, StructuredLlmClientRegistry>();
        services.AddScoped<ISelectorExecutionEngine, SelectorExecutionEngine>();
        services.AddScoped<IOnboardingService, SaasOnboardingService>();
        services.AddScoped<IScheduledRecomputeDispatcher, ScheduledRecomputeDispatcher>();
        services.AddScoped<IConnectorPlugin, MockConnectorPlugin>();
        services.AddScoped<IConnectorPlugin, RestApiConnectorPlugin>();
        services.AddScoped<IConnectorPlugin, SqlConnectorPlugin>();
        services.AddScoped<IConnectorPlugin, CsvUploadConnectorPlugin>();
        services.AddScoped<IConnectorPlugin, MockCrmConnectorPlugin>();
        services.AddScoped<IConnectorPlugin, MockBillingConnectorPlugin>();
        services.AddScoped<IConnectorPlugin, MockSupportConnectorPlugin>();
        services.AddScoped<IConnectorRegistry, ConnectorRegistry>();
        services.AddScoped<IConnectorCredentialStore, ProtectedConnectorCredentialStore>();
        services.AddSingleton<ILicenceKeyGenerator, StaticLicenceKeyGenerator>();
        services.AddSingleton<ILicenceValidator, OfflineLicenceValidator>();
        services.AddScoped<ILicenceService, LocalLicenceService>();
        services.AddEnterpriseExtensionDefaults();
        services.AddSingleton<ContextRecomputeQueue>();
        services.AddSingleton<IContextRecomputeQueue>(provider => provider.GetRequiredService<ContextRecomputeQueue>());
        services.AddHostedService<ContextRecomputeWorker>();
        services.AddHostedService<ScheduledRecomputeWorker>();
        services.AddSingleton<IClock, SystemClock>();

        return services;
    }
}
