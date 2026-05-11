using ContextLayer.Infrastructure.Auth;
using Microsoft.AspNetCore.Http;

namespace ContextLayer.Api.GraphQL;

internal static class GraphQlScopeGuard
{
    public static void RequireApiClientScope(IHttpContextAccessor httpContextAccessor, string requiredScope)
    {
        var user = httpContextAccessor.HttpContext?.User;
        if (user?.IsInRole(RoleNames.ApiClient) != true)
        {
            return;
        }

        var scopes = user.FindAll("scope")
            .SelectMany(claim => claim.Value.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Select(ApiScopes.Normalize)
            .ToHashSet(StringComparer.Ordinal);

        if (!scopes.Contains(requiredScope))
        {
            throw new UnauthorizedAccessException($"API client scope '{requiredScope}' is required.");
        }
    }
}
