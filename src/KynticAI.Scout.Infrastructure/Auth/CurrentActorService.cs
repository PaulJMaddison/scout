using System.Security.Claims;
using KynticAI.Scout.Application.Abstractions;
using Microsoft.AspNetCore.Http;

namespace KynticAI.Scout.Infrastructure.Auth;

public sealed class CurrentActorService(IHttpContextAccessor httpContextAccessor) : ICurrentActorService
{
    public ActorContext GetCurrentActor()
    {
        var principal = httpContextAccessor.HttpContext?.User;
        if (principal?.Identity?.IsAuthenticated != true)
        {
            return ActorContext.System();
        }

        _ = Guid.TryParse(principal.FindFirstValue("tenant_id"), out var tenantId);
        _ = Guid.TryParse(principal.FindFirstValue("workspace_id"), out var workspaceId);

        return new ActorContext(
            SubjectId: principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? principal.FindFirstValue(ClaimTypes.Name) ?? principal.FindFirstValue("sub") ?? "unknown",
            TenantId: tenantId == Guid.Empty ? null : tenantId,
            TenantSlug: principal.FindFirstValue("tenant_slug") ?? "unknown",
            WorkspaceId: workspaceId == Guid.Empty ? null : workspaceId,
            WorkspaceSlug: principal.FindFirstValue("workspace_slug"),
            Email: principal.FindFirstValue(ClaimTypes.Email) ?? principal.FindFirstValue("email") ?? "unknown@scout.local",
            DisplayName: principal.FindFirstValue("display_name") ?? principal.Identity?.Name ?? "Unknown",
            Role: RoleNames.FromClaimValue(principal.FindFirstValue(ClaimTypes.Role)),
            IsAuthenticated: true,
            IsSystem: false);
    }
}
