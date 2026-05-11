using System.Text.Json;
using ContextLayer.Domain.Entities;
using ContextLayer.Infrastructure.Persistence;

namespace ContextLayer.Api.Middleware;

public sealed class PermissionDeniedAuditMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        await next(context);

        if (context.Response.StatusCode != StatusCodes.Status403Forbidden
            || context.User.Identity?.IsAuthenticated != true)
        {
            return;
        }

        var dbContext = context.RequestServices.GetService<ContextLayerDbContext>();
        if (dbContext is null)
        {
            return;
        }

        var actor = context.User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
            ?? context.User.FindFirst("email")?.Value
            ?? context.User.Identity?.Name
            ?? "unknown";
        var subject = context.User.FindFirst("sub")?.Value
            ?? context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? "unknown";
        var tenantId = Guid.TryParse(context.User.FindFirst("tenant_id")?.Value, out var parsedTenantId)
            ? parsedTenantId
            : (Guid?)null;

        dbContext.AuditEvents.Add(AuditEvent.Create(
            tenantId,
            actor,
            "auth.permission.denied",
            "HttpRequest",
            subject,
            context.TraceIdentifier,
            JsonSerializer.Serialize(new
            {
                path = context.Request.Path.Value,
                method = context.Request.Method,
                tenantSlug = context.User.FindFirst("tenant_slug")?.Value,
                workspaceSlug = context.User.FindFirst("workspace_slug")?.Value
            }),
            null,
            null,
            DateTime.UtcNow));
        await dbContext.SaveChangesAsync(context.RequestAborted);
    }
}
