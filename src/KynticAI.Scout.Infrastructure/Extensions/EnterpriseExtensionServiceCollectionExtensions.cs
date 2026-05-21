using KynticAI.Scout.Application.Abstractions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace KynticAI.Scout.Infrastructure.Extensions;

public static class EnterpriseExtensionServiceCollectionExtensions
{
    public static IServiceCollection AddContextSourceConnector<T>(
        this IServiceCollection services)
        where T : class, IContextSourceConnector
    {
        services.AddScoped<IContextSourceConnector, T>();
        return services;
    }

    public static IServiceCollection AddConnectorConfigurationValidator<T>(
        this IServiceCollection services)
        where T : class, IConnectorConfigurationValidator
    {
        services.AddScoped<IConnectorConfigurationValidator, T>();
        return services;
    }

    public static IServiceCollection AddCredentialProvider<T>(
        this IServiceCollection services)
        where T : class, ICredentialProvider
    {
        services.AddScoped<ICredentialProvider, T>();
        return services;
    }

    public static IServiceCollection AddSecretResolver<T>(
        this IServiceCollection services)
        where T : class, ISecretResolver
    {
        services.AddScoped<ISecretResolver, T>();
        return services;
    }

    public static IServiceCollection AddPolicyEvaluator<T>(
        this IServiceCollection services)
        where T : class, IPolicyEvaluator
    {
        services.AddScoped<IPolicyEvaluator, T>();
        return services;
    }

    public static IServiceCollection AddContextGovernanceHook<T>(
        this IServiceCollection services)
        where T : class, IContextGovernanceHook
    {
        services.AddScoped<IContextGovernanceHook, T>();
        return services;
    }

    public static IServiceCollection AddPiiMaskingProvider<T>(
        this IServiceCollection services)
        where T : class, IPiiMaskingProvider
    {
        services.AddScoped<IPiiMaskingProvider, T>();
        return services;
    }

    public static IServiceCollection AddAuditExporter<T>(
        this IServiceCollection services)
        where T : class, IAuditExporter
    {
        services.AddScoped<IAuditExporter, T>();
        return services;
    }

    public static IServiceCollection AddContextPackageExporter<T>(
        this IServiceCollection services)
        where T : class, IContextPackageExporter
    {
        services.AddScoped<IContextPackageExporter, T>();
        return services;
    }

    public static IServiceCollection AddEnterpriseAuthProvider<T>(
        this IServiceCollection services)
        where T : class, IEnterpriseAuthProvider
    {
        services.AddScoped<IEnterpriseAuthProvider, T>();
        return services;
    }

    public static IServiceCollection AddSelectorApprovalWorkflow<T>(
        this IServiceCollection services)
        where T : class, ISelectorApprovalWorkflow
    {
        services.AddScoped<ISelectorApprovalWorkflow, T>();
        return services;
    }

    public static IServiceCollection AddEnvironmentPromotionService<T>(
        this IServiceCollection services)
        where T : class, IEnvironmentPromotionService
    {
        services.AddScoped<IEnvironmentPromotionService, T>();
        return services;
    }

    public static IServiceCollection AddUsageMeteringSink<T>(
        this IServiceCollection services)
        where T : class, IUsageMeteringSink
    {
        services.AddScoped<IUsageMeteringSink, T>();
        return services;
    }

    public static IServiceCollection AddEnterpriseExtensionDefaults(this IServiceCollection services)
    {
        services.TryAddEnumerable(ServiceDescriptor.Scoped<IContextSourceConnector, MockContextSourceConnector>());
        services.TryAddEnumerable(ServiceDescriptor.Scoped<IConnectorConfigurationValidator, DefaultConnectorConfigurationValidator>());
        services.TryAddEnumerable(ServiceDescriptor.Scoped<ICredentialProvider, NullCredentialProvider>());
        services.TryAddEnumerable(ServiceDescriptor.Scoped<ISecretResolver, DevelopmentSecretResolver>());
        services.TryAddEnumerable(ServiceDescriptor.Scoped<IPolicyEvaluator, DenyByDefaultPolicyEvaluator>());
        services.TryAddEnumerable(ServiceDescriptor.Scoped<IContextGovernanceHook, NoopContextGovernanceHook>());
        services.TryAddEnumerable(ServiceDescriptor.Scoped<IPiiMaskingProvider, DefaultPiiMaskingProvider>());
        services.TryAddEnumerable(ServiceDescriptor.Scoped<IAuditExporter, NoOpAuditExporter>());
        services.TryAddEnumerable(ServiceDescriptor.Scoped<IContextPackageExporter, JsonContextPackageExporter>());
        services.TryAddEnumerable(ServiceDescriptor.Scoped<IEnterpriseAuthProvider, DisabledEnterpriseAuthProvider>());
        services.TryAddEnumerable(ServiceDescriptor.Scoped<ISelectorApprovalWorkflow, ImmediateSelectorApprovalWorkflow>());
        services.TryAddEnumerable(ServiceDescriptor.Scoped<IEnvironmentPromotionService, DisabledEnvironmentPromotionService>());
        services.TryAddEnumerable(ServiceDescriptor.Scoped<IUsageMeteringSink, InMemoryUsageMeteringSink>());
        return services;
    }
}
