using ContextLayer.Application.Contracts;
using ContextLayer.Application.Services;
using ContextLayer.Application.Validation;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace ContextLayer.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddContextLayerApplication(this IServiceCollection services)
    {
        services.AddScoped<IContextLayerService, ContextLayerService>();
        services.AddScoped<IBlueprintImportService, BlueprintImportService>();
        services.AddScoped<IBillingPlanCatalog, BillingPlanCatalog>();
        services.AddScoped<IUsageMeteringService, UsageMeteringService>();
        services.AddScoped<IBillingEnforcementService, BillingEnforcementService>();
        services.AddScoped<IBillingProviderGateway, NoopBillingProviderGateway>();
        services.AddValidatorsFromAssemblyContaining<UpsertDataSourceInputValidator>();
        return services;
    }
}
