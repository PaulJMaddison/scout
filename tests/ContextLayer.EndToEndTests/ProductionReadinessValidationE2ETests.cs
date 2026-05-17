using ContextLayer.Infrastructure.Configuration;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace ContextLayer.EndToEndTests;

/// <summary>
/// Verifies the production readiness validator detects missing or unsafe
/// configuration when the app is started in production mode.
/// </summary>
public sealed class ProductionReadinessValidationE2ETests
{
    [Fact]
    public void DevelopmentMode_PassesAllChecks()
    {
        var config = BuildConfiguration(new Dictionary<string, string?>
        {
            ["Platform:Mode"] = "BackendOnly",
            ["Auth:SigningKey"] = "context-layer-tests-signing-key-1234567890",
            ["Auth:RequireSecureSigningKey"] = "false"
        });
        var env = new TestHostEnvironment { EnvironmentName = "Development" };

        var report = ProductionEnvironmentReadinessValidator.GetReport(config, env);

        Assert.False(report.ProductionShapeRequired, "Development mode should not require production shape.");
        Assert.True(report.ReadyForProductionStyleDeployment, "Development mode should pass readiness by default.");
    }

    [Fact]
    public void ProductionMode_WithMissingDatabaseProvider_ReportsBlocked()
    {
        var config = BuildConfiguration(new Dictionary<string, string?>
        {
            ["Platform:Mode"] = "SaaS",
            ["Bootstrap:SeedDemoData"] = "false",
            ["FeatureFlags:DemoExperience"] = "false",
            ["Auth:SigningKey"] = "production-secure-key-that-is-long-enough-for-validation-minimum-requirements-1234567890",
            ["Auth:RequireSecureSigningKey"] = "true",
            ["Platform:EnableOpenApi"] = "false",
            ["Cors:AllowedOrigins:0"] = "https://app.example.com",
            ["SecurityHeaders:Enabled"] = "true",
            ["SecurityHeaders:ContentSecurityPolicy"] = "default-src 'self'; frame-ancestors 'none'",
            ["DataProtection:RequirePersistentKeys"] = "true",
            ["DataProtection:KeyRingPath"] = "/mnt/keys"
        });
        var env = new TestHostEnvironment { EnvironmentName = "Production" };

        var report = ProductionEnvironmentReadinessValidator.GetReport(config, env);

        Assert.True(report.ProductionShapeRequired, "Production mode should require production shape.");
        Assert.False(report.ReadyForProductionStyleDeployment, "Missing database provider should block production readiness.");

        var dbCheck = report.Checks.SingleOrDefault(c => c.Key == "database-provider");
        Assert.NotNull(dbCheck);
        Assert.Equal("Blocked", dbCheck!.Status);
        Assert.Contains("Postgres", dbCheck.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ProductionMode_WithMissingConnectionStrings_ReportsBlocked()
    {
        var config = BuildConfiguration(new Dictionary<string, string?>
        {
            ["Platform:Mode"] = "SaaS",
            ["Database:Provider"] = "Postgres",
            ["Bootstrap:SeedDemoData"] = "false",
            ["FeatureFlags:DemoExperience"] = "false",
            ["Auth:SigningKey"] = "production-secure-key-that-is-long-enough-for-validation-minimum-requirements-1234567890",
            ["Auth:RequireSecureSigningKey"] = "true",
            ["Platform:EnableOpenApi"] = "false",
            ["Cors:AllowedOrigins:0"] = "https://app.example.com",
            ["SecurityHeaders:Enabled"] = "true",
            ["SecurityHeaders:ContentSecurityPolicy"] = "default-src 'self'; frame-ancestors 'none'",
            ["DataProtection:RequirePersistentKeys"] = "true",
            ["DataProtection:KeyRingPath"] = "/mnt/keys"
        });
        var env = new TestHostEnvironment { EnvironmentName = "Production" };

        var report = ProductionEnvironmentReadinessValidator.GetReport(config, env);

        var connCheck = report.Checks.SingleOrDefault(c => c.Key == "connection-strings");
        Assert.NotNull(connCheck);
        Assert.Equal("Blocked", connCheck!.Status);
        Assert.Contains("ConnectionStrings", connCheck.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ProductionMode_WithWeakSigningKey_ReportsBlocked()
    {
        var config = BuildConfiguration(new Dictionary<string, string?>
        {
            ["Platform:Mode"] = "SaaS",
            ["Database:Provider"] = "Postgres",
            ["ConnectionStrings:ContextLayer"] = "Host=db;Database=ucl;Username=app;Password=pass",
            ["ConnectionStrings:CustomerOps"] = "Host=db;Database=ops;Username=app;Password=pass",
            ["Bootstrap:SeedDemoData"] = "false",
            ["FeatureFlags:DemoExperience"] = "false",
            ["Auth:SigningKey"] = "short",
            ["Auth:RequireSecureSigningKey"] = "true",
            ["Platform:EnableOpenApi"] = "false",
            ["Cors:AllowedOrigins:0"] = "https://app.example.com",
            ["SecurityHeaders:Enabled"] = "true",
            ["SecurityHeaders:ContentSecurityPolicy"] = "default-src 'self'; frame-ancestors 'none'",
            ["DataProtection:RequirePersistentKeys"] = "true",
            ["DataProtection:KeyRingPath"] = "/mnt/keys"
        });
        var env = new TestHostEnvironment { EnvironmentName = "Production" };

        var report = ProductionEnvironmentReadinessValidator.GetReport(config, env);

        var authCheck = report.Checks.SingleOrDefault(c => c.Key == "auth-signing-key");
        Assert.NotNull(authCheck);
        Assert.Equal("Blocked", authCheck!.Status);
        Assert.Contains("SigningKey", authCheck.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ProductionMode_WithDemoSeedEnabled_ReportsBlocked()
    {
        var config = BuildConfiguration(new Dictionary<string, string?>
        {
            ["Platform:Mode"] = "SaaS",
            ["Database:Provider"] = "Postgres",
            ["ConnectionStrings:ContextLayer"] = "Host=db;Database=ucl;Username=app;Password=pass",
            ["ConnectionStrings:CustomerOps"] = "Host=db;Database=ops;Username=app;Password=pass",
            ["Bootstrap:SeedDemoData"] = "true",
            ["FeatureFlags:DemoExperience"] = "false",
            ["Auth:SigningKey"] = "production-secure-key-that-is-long-enough-for-validation-minimum-requirements-1234567890",
            ["Auth:RequireSecureSigningKey"] = "true",
            ["Platform:EnableOpenApi"] = "false",
            ["Cors:AllowedOrigins:0"] = "https://app.example.com",
            ["SecurityHeaders:Enabled"] = "true",
            ["SecurityHeaders:ContentSecurityPolicy"] = "default-src 'self'; frame-ancestors 'none'",
            ["DataProtection:RequirePersistentKeys"] = "true",
            ["DataProtection:KeyRingPath"] = "/mnt/keys"
        });
        var env = new TestHostEnvironment { EnvironmentName = "Production" };

        var report = ProductionEnvironmentReadinessValidator.GetReport(config, env);

        var seedCheck = report.Checks.SingleOrDefault(c => c.Key == "demo-seed");
        Assert.NotNull(seedCheck);
        Assert.Equal("Blocked", seedCheck!.Status);
    }

    [Fact]
    public void ProductionMode_WithOpenApiEnabled_ReportsBlocked()
    {
        var config = BuildConfiguration(new Dictionary<string, string?>
        {
            ["Platform:Mode"] = "SaaS",
            ["Database:Provider"] = "Postgres",
            ["ConnectionStrings:ContextLayer"] = "Host=db;Database=ucl;Username=app;Password=pass",
            ["ConnectionStrings:CustomerOps"] = "Host=db;Database=ops;Username=app;Password=pass",
            ["Bootstrap:SeedDemoData"] = "false",
            ["FeatureFlags:DemoExperience"] = "false",
            ["Auth:SigningKey"] = "production-secure-key-that-is-long-enough-for-validation-minimum-requirements-1234567890",
            ["Auth:RequireSecureSigningKey"] = "true",
            ["Platform:EnableOpenApi"] = "true",
            ["Cors:AllowedOrigins:0"] = "https://app.example.com",
            ["SecurityHeaders:Enabled"] = "true",
            ["SecurityHeaders:ContentSecurityPolicy"] = "default-src 'self'; frame-ancestors 'none'",
            ["DataProtection:RequirePersistentKeys"] = "true",
            ["DataProtection:KeyRingPath"] = "/mnt/keys"
        });
        var env = new TestHostEnvironment { EnvironmentName = "Production" };

        var report = ProductionEnvironmentReadinessValidator.GetReport(config, env);

        var openApiCheck = report.Checks.SingleOrDefault(c => c.Key == "openapi-exposure");
        Assert.NotNull(openApiCheck);
        Assert.Equal("Blocked", openApiCheck!.Status);
    }

    [Fact]
    public void ProductionMode_WithFullConfig_PassesAllChecks()
    {
        var config = BuildConfiguration(new Dictionary<string, string?>
        {
            ["Platform:Mode"] = "SaaS",
            ["Database:Provider"] = "Postgres",
            ["ConnectionStrings:ContextLayer"] = "Host=db;Database=ucl;Username=app;Password=pass",
            ["ConnectionStrings:CustomerOps"] = "Host=db;Database=ops;Username=app;Password=pass",
            ["Bootstrap:SeedDemoData"] = "false",
            ["FeatureFlags:DemoExperience"] = "false",
            ["Auth:SigningKey"] = "production-secure-key-that-is-long-enough-for-validation-minimum-requirements-1234567890",
            ["Auth:RequireSecureSigningKey"] = "true",
            ["Platform:EnableOpenApi"] = "false",
            ["Cors:AllowedOrigins:0"] = "https://app.example.com",
            ["SecurityHeaders:Enabled"] = "true",
            ["SecurityHeaders:ContentSecurityPolicy"] = "default-src 'self'; frame-ancestors 'none'",
            ["DataProtection:RequirePersistentKeys"] = "true",
            ["DataProtection:KeyRingPath"] = "/mnt/keys"
        });
        var env = new TestHostEnvironment { EnvironmentName = "Production" };

        var report = ProductionEnvironmentReadinessValidator.GetReport(config, env);

        Assert.True(report.ProductionShapeRequired, "Production mode should require production shape.");
        Assert.True(report.ReadyForProductionStyleDeployment, "Fully configured production environment should pass readiness.");

        foreach (var check in report.Checks)
        {
            Assert.NotEqual("Blocked", check.Status);
        }
    }

    [Fact]
    public void ThrowIfBlocked_ThrowsForBlockedReport()
    {
        var config = BuildConfiguration(new Dictionary<string, string?>
        {
            ["Platform:Mode"] = "SaaS",
            ["Auth:SigningKey"] = "short",
            ["Auth:RequireSecureSigningKey"] = "true"
        });
        var env = new TestHostEnvironment { EnvironmentName = "Production" };

        var report = ProductionEnvironmentReadinessValidator.GetReport(config, env);

        var exception = Assert.Throws<InvalidOperationException>(() =>
            ProductionEnvironmentReadinessValidator.ThrowIfBlocked(report));
        Assert.Contains("readiness failed", exception.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void ThrowIfBlocked_DoesNotThrowForDevelopment()
    {
        var config = BuildConfiguration(new Dictionary<string, string?>
        {
            ["Platform:Mode"] = "BackendOnly",
            ["Auth:RequireSecureSigningKey"] = "false"
        });
        var env = new TestHostEnvironment { EnvironmentName = "Development" };

        var report = ProductionEnvironmentReadinessValidator.GetReport(config, env);

        ProductionEnvironmentReadinessValidator.ThrowIfBlocked(report);
    }

    [Fact]
    public void ProductionMode_ReportContainsAllExpectedCheckKeys()
    {
        var config = BuildConfiguration(new Dictionary<string, string?>
        {
            ["Platform:Mode"] = "SaaS"
        });
        var env = new TestHostEnvironment { EnvironmentName = "Production" };

        var report = ProductionEnvironmentReadinessValidator.GetReport(config, env);

        var expectedKeys = new[]
        {
            "platform-mode",
            "database-provider",
            "connection-strings",
            "frontend-demo-fallback",
            "demo-seed",
            "demo-experience",
            "data-protection-keys",
            "auth-signing-key",
            "openapi-exposure",
            "cors-origins",
            "security-headers"
        };

        foreach (var key in expectedKeys)
        {
            Assert.Contains(report.Checks, c => c.Key == key);
        }
    }

    private static IConfiguration BuildConfiguration(Dictionary<string, string?> settings) =>
        new ConfigurationBuilder().AddInMemoryCollection(settings).Build();

    private sealed class TestHostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "ContextLayer.Api";
        public string ContentRootPath { get; set; } = Directory.GetCurrentDirectory();
        public IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
