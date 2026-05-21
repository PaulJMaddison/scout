using KynticAI.Scout.Domain.Enums;

namespace KynticAI.Scout.Infrastructure.Auth;

public static class RoleNames
{
    public const string PlatformOwner = "platform_owner";

    public const string TenantAdmin = "tenant_admin";

    public const string IntegrationAdmin = "integration_admin";

    public const string Analyst = "analyst";

    public const string SalesUser = "sales_rep";

    public const string ReadOnly = "read_only";

    public const string ApiClient = "api_client";

    public static readonly string[] TenantAdministrators = [PlatformOwner, TenantAdmin];

    public static readonly string[] IntegrationAdministrators = [PlatformOwner, TenantAdmin, IntegrationAdmin];

    public static readonly string[] Readers = [PlatformOwner, TenantAdmin, IntegrationAdmin, Analyst, SalesUser, ReadOnly, ApiClient];

    public static readonly string[] Analysts = [PlatformOwner, TenantAdmin, IntegrationAdmin, Analyst];

    public static readonly string[] SalesUsers = [PlatformOwner, TenantAdmin, Analyst, SalesUser];

    public static string ToClaimValue(OperatorRole role)
        => role switch
        {
            OperatorRole.PlatformOwner => PlatformOwner,
            OperatorRole.TenantAdmin => TenantAdmin,
            OperatorRole.IntegrationAdmin => IntegrationAdmin,
            OperatorRole.Analyst => Analyst,
            OperatorRole.SalesUser => SalesUser,
            OperatorRole.ReadOnly => ReadOnly,
            OperatorRole.ApiClient => ApiClient,
            _ => ReadOnly
        };

    public static OperatorRole FromClaimValue(string? value)
        => value?.Trim().ToLowerInvariant() switch
        {
            PlatformOwner => OperatorRole.PlatformOwner,
            TenantAdmin => OperatorRole.TenantAdmin,
            IntegrationAdmin => OperatorRole.IntegrationAdmin,
            Analyst => OperatorRole.Analyst,
            SalesUser => OperatorRole.SalesUser,
            "sales_user" => OperatorRole.SalesUser,
            ReadOnly => OperatorRole.ReadOnly,
            ApiClient => OperatorRole.ApiClient,
            _ => OperatorRole.ReadOnly
        };
}
