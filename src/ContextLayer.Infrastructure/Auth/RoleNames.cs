using ContextLayer.Domain.Enums;

namespace ContextLayer.Infrastructure.Auth;

public static class RoleNames
{
    public const string TenantAdmin = "tenant_admin";

    public const string SalesRep = "sales_rep";

    public static string ToClaimValue(OperatorRole role)
        => role switch
        {
            OperatorRole.TenantAdmin => TenantAdmin,
            OperatorRole.SalesRep => SalesRep,
            _ => SalesRep
        };

    public static OperatorRole FromClaimValue(string? value)
        => string.Equals(value, TenantAdmin, StringComparison.OrdinalIgnoreCase)
            ? OperatorRole.TenantAdmin
            : OperatorRole.SalesRep;
}
