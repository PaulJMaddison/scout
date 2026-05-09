using System.Security.Claims;
using ContextLayer.Application.Abstractions;
using Microsoft.AspNetCore.Http;

namespace ContextLayer.Infrastructure.Auth;

public sealed class CurrentActorService(IHttpContextAccessor httpContextAccessor) : ICurrentActorService
{
    public ActorContext GetCurrentActor()
    {
        var principal = httpContextAccessor.HttpContext?.User;
        if (principal?.Identity?.IsAuthenticated != true)
        {
            return ActorContext.System();
        }

        return new ActorContext(
            SubjectId: principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue(ClaimTypes.Name) ?? principal.FindFirstValue("sub") ?? "unknown",
            TenantSlug: principal.FindFirstValue("tenant_slug") ?? "unknown",
            Email: principal.FindFirstValue(ClaimTypes.Email) ?? principal.FindFirstValue("email") ?? "unknown@contextlayer.local",
            DisplayName: principal.FindFirstValue("display_name") ?? principal.Identity?.Name ?? "Unknown",
            Role: RoleNames.FromClaimValue(principal.FindFirstValue(ClaimTypes.Role)),
            IsAuthenticated: true,
            IsSystem: false);
    }
}
