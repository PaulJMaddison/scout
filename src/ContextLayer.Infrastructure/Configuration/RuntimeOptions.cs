using ContextLayer.Domain.Enums;

namespace ContextLayer.Infrastructure.Configuration;

public sealed class PlatformOptions
{
    public const string SectionName = "Platform";

    public string Mode { get; set; } = PlatformModes.BackendOnly;

    public bool EnableGraphQl { get; set; } = true;

    public bool EnableRest { get; set; } = true;

    public bool EnableOpenApi { get; set; } = true;
}

public static class PlatformModes
{
    public const string LocalDemo = "LocalDemo";

    public const string BackendOnly = "BackendOnly";

    public const string SaaS = "SaaS";
}

public sealed class FeatureFlagOptions
{
    public const string SectionName = "FeatureFlags";

    public bool DemoExperience { get; set; } = true;

    public bool OpenCoreApis { get; set; } = true;

    public bool SaaSControlPlane { get; set; } = false;

    public bool HostedBillingUsage { get; set; } = false;

    public bool Webhooks { get; set; } = false;

    public bool EnterpriseConnectorExtensions { get; set; } = false;

    public IReadOnlyList<string> EnabledFlags()
    {
        var flags = new List<string>();
        AddIf(flags, DemoExperience, "demo-experience");
        AddIf(flags, OpenCoreApis, "open-core-apis");
        AddIf(flags, SaaSControlPlane, "saas-control-plane");
        AddIf(flags, HostedBillingUsage, "hosted-billing-usage");
        AddIf(flags, Webhooks, "webhooks");
        AddIf(flags, EnterpriseConnectorExtensions, "enterprise-connector-extensions");
        return flags;
    }

    private static void AddIf(List<string> flags, bool enabled, string key)
    {
        if (enabled)
        {
            flags.Add(key);
        }
    }
}

public sealed class SaaSOptions
{
    public const string SectionName = "SaaS";

    public string PublicBaseUrl { get; set; } = "http://127.0.0.1:5198";

    public string ApiIssuer { get; set; } = "ContextLayer.SaaS";

    public bool RequireWorkspaceScope { get; set; } = false;

    public bool PersistApiClients { get; set; } = true;
}

public sealed class ControlPlaneOptions
{
    public const string SectionName = "ControlPlane";

    public bool Enabled { get; set; } = false;

    public string BaseUrl { get; set; } = string.Empty;

    public string CustomerAccountId { get; set; } = string.Empty;

    public string UpdateChannel { get; set; } = "stable";

    public bool UsageReportingEnabled { get; set; } = false;

    public int OfflineGracePeriodDays { get; set; } = 30;
}

public sealed class LicenceOptions
{
    public const string SectionName = "Licence";

    public string Mode { get; set; } = "Community";

    public string FilePath { get; set; } = ".demo-data/ucl-demo.licence.json";

    public bool RequireValidLicence { get; set; } = false;

    public int OfflineGracePeriodDays { get; set; } = 30;
}

public sealed class BootstrapOptions
{
    public const string SectionName = "Bootstrap";

    public bool ApplyMigrationsOnStartup { get; set; } = true;

    public bool SeedDemoData { get; set; } = false;
}

public sealed class TelemetryOptions
{
    public const string SectionName = "Telemetry";

    public string ServiceName { get; set; } = "ContextLayer.Api";

    public string ServiceNamespace { get; set; } = "UniversalContextLayer";

    public string DeploymentEnvironment { get; set; } = "local";

    public string OtlpEndpoint { get; set; } = string.Empty;
}

public sealed class RateLimitOptions
{
    public const string SectionName = "RateLimits";

    public int AuthPermitLimit { get; set; } = 5;

    public int AuthWindowSeconds { get; set; } = 60;

    public int GraphQlTokenLimit { get; set; } = 60;

    public int GraphQlTokensPerPeriod { get; set; } = 60;

    public int GraphQlReplenishmentSeconds { get; set; } = 60;
}

public sealed class ConnectorBootstrapOptions
{
    public const string SectionName = "ConnectorBootstrap";

    public bool Enabled { get; set; } = false;

    public List<ConnectorBootstrapDefinition> Definitions { get; set; } = [];
}

public sealed class ConnectorBootstrapDefinition
{
    public string TenantSlug { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public DataSourceKind Kind { get; set; } = DataSourceKind.Crm;

    public string ConnectorType { get; set; } = string.Empty;

    public string ConfigurationJson { get; set; } = "{}";

    public string? CredentialsJson { get; set; }
}
