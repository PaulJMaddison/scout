using System.Net;
using System.Net.Http.Json;
using ContextLayer.Application.Contracts;
using ContextLayer.Domain.Enums;
using ContextLayer.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ContextLayer.IntegrationTests;

public sealed class OnboardingIntegrationTests
{
    [Fact]
    public async Task SubmitOnboarding_ProvisionsTenantScopedStarterWorkspace_WithoutCrossTenantLeakage()
    {
        await using var factory = new OnboardingWebApplicationFactory();
        using var client = factory.CreateClient();

        var acmeResponse = await client.PostAsJsonAsync("/api/onboarding", CreateInput(
            tenantSlug: "acme-revenue",
            organisationName: "Acme Revenue Systems",
            adminEmail: "dana@acme.example",
            sourceSystems: ["Salesforce CRM", "Zendesk Support"],
            dataCategories: ["CRM", "Support"],
            aiUseCases: ["Sales copilot"]));
        var betaResponse = await client.PostAsJsonAsync("/api/onboarding", CreateInput(
            tenantSlug: "beta-ai",
            organisationName: "Beta AI Works",
            adminEmail: "alex@beta.example",
            sourceSystems: ["Stripe Billing", "Snowflake Warehouse"],
            dataCategories: ["Billing", "Warehouse"],
            aiUseCases: ["Executive account briefs"]));

        Assert.Equal(HttpStatusCode.Created, acmeResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Created, betaResponse.StatusCode);

        var acmeResult = await acmeResponse.Content.ReadFromJsonAsync<OnboardingResult>();
        var betaResult = await betaResponse.Content.ReadFromJsonAsync<OnboardingResult>();
        Assert.NotNull(acmeResult);
        Assert.NotNull(betaResult);
        Assert.NotEqual(acmeResult!.TenantId, betaResult!.TenantId);

        await using var scope = factory.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ContextLayerDbContext>();

        var acmeTenant = await dbContext.Tenants.SingleAsync(x => x.Slug == "acme-revenue");
        var betaTenant = await dbContext.Tenants.SingleAsync(x => x.Slug == "beta-ai");
        var acmeSources = await dbContext.DataSources
            .Where(x => x.TenantId == acmeTenant.Id)
            .Select(x => x.Name)
            .ToListAsync();
        var betaSources = await dbContext.DataSources
            .Where(x => x.TenantId == betaTenant.Id)
            .Select(x => x.Name)
            .ToListAsync();

        Assert.Contains(acmeSources, name => name.Contains("Salesforce CRM", StringComparison.Ordinal));
        Assert.DoesNotContain(acmeSources, name => name.Contains("Stripe Billing", StringComparison.Ordinal));
        Assert.Contains(betaSources, name => name.Contains("Stripe Billing", StringComparison.Ordinal));
        Assert.DoesNotContain(betaSources, name => name.Contains("Salesforce CRM", StringComparison.Ordinal));

        Assert.Equal(1, await dbContext.Workspaces.CountAsync(x => x.TenantId == acmeTenant.Id));
        Assert.Equal(1, await dbContext.Workspaces.CountAsync(x => x.TenantId == betaTenant.Id));
        Assert.Equal(1, await dbContext.OperatorAccounts.CountAsync(x => x.TenantId == acmeTenant.Id && x.Role == OperatorRole.TenantAdmin));
        Assert.Equal(1, await dbContext.OperatorAccounts.CountAsync(x => x.TenantId == betaTenant.Id && x.Role == OperatorRole.TenantAdmin));
        Assert.True(await dbContext.SemanticAttributeDefinitions.AnyAsync(x => x.TenantId == acmeTenant.Id && x.Key == "supportRisk"));
        Assert.False(await dbContext.SemanticAttributeDefinitions.AnyAsync(x => x.TenantId == betaTenant.Id && x.Key == "supportRisk"));
        Assert.Equal(2, await dbContext.OnboardingApplications.CountAsync());
        Assert.Equal(2, await dbContext.AuditEvents.CountAsync(x => x.Action == "onboarding.provisioned"));
    }

    private static SubmitOnboardingInput CreateInput(
        string tenantSlug,
        string organisationName,
        string adminEmail,
        IReadOnlyList<string> sourceSystems,
        IReadOnlyList<string> dataCategories,
        IReadOnlyList<string> aiUseCases)
        => new(
            OrganisationName: organisationName,
            TenantSlug: tenantSlug,
            PrimaryWorkspaceName: "Revenue workspace",
            AdminDisplayName: "Demo Admin",
            AdminEmail: adminEmail,
            AdminPassword: "DemoPassword123!",
            IntendedUseCase: "Generate trusted account briefs from existing business systems.",
            SourceSystems: sourceSystems,
            DataCategories: dataCategories,
            AiUseCases: aiUseCases,
            PiiSensitivityLevel: "moderate",
            PreferredDeploymentMode: "local-demo");

    private sealed class OnboardingWebApplicationFactory : WebApplicationFactory<Program>
    {
        private readonly InMemoryDatabaseRoot databaseRoot = new();
        private readonly string databaseName = $"onboarding-tests-{Guid.NewGuid():N}";

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.ConfigureAppConfiguration((_, config) =>
            {
                var settings = new Dictionary<string, string?>
                {
                    ["Platform:Mode"] = "BackendOnly",
                    ["Platform:EnableRest"] = "true",
                    ["Platform:EnableGraphQl"] = "true",
                    ["Platform:EnableOpenApi"] = "false",
                    ["Bootstrap:ApplyMigrationsOnStartup"] = "true",
                    ["Bootstrap:SeedDemoData"] = "false",
                    ["Auth:Issuer"] = "ContextLayer.Tests",
                    ["Auth:Audience"] = "ContextLayer.Tests",
                    ["Auth:SigningKey"] = "context-layer-tests-signing-key-1234567890",
                    ["Telemetry:OtlpEndpoint"] = string.Empty
                };

                config.AddInMemoryCollection(settings);
            });

            builder.ConfigureServices(services =>
            {
                services.RemoveAll<DbContextOptions<ContextLayerDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<ContextLayerDbContext>>();
                services.RemoveAll<ContextLayerDbContext>();
                services.RemoveAll<DbContextOptions<CustomerOpsDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<CustomerOpsDbContext>>();
                services.RemoveAll<CustomerOpsDbContext>();

                services.AddDbContext<ContextLayerDbContext>(options =>
                    options.UseInMemoryDatabase(databaseName, databaseRoot));
                services.AddDbContext<CustomerOpsDbContext>(options =>
                    options.UseInMemoryDatabase($"{databaseName}-ops", databaseRoot));
                services.AddScoped<ContextLayer.Application.Abstractions.IContextLayerDbContext>(provider =>
                    provider.GetRequiredService<ContextLayerDbContext>());
                services.AddScoped<ContextLayer.Application.Abstractions.ICustomerOpsDbContext>(provider =>
                    provider.GetRequiredService<CustomerOpsDbContext>());
            });
        }
    }
}
