using System.Diagnostics;

namespace KynticAI.Scout.Api.Middleware;

public sealed class RequestContextMiddleware(RequestDelegate next, ILogger<RequestContextMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext httpContext)
    {
        var requestId = httpContext.Request.Headers["X-Request-Id"].FirstOrDefault()
            ?? Activity.Current?.TraceId.ToString()
            ?? httpContext.TraceIdentifier;

        httpContext.Response.Headers["X-Request-Id"] = requestId;

        using (logger.BeginScope(new Dictionary<string, object?>
        {
            ["requestId"] = requestId,
            ["path"] = httpContext.Request.Path.Value
        }))
        {
            Activity.Current?.SetTag("app.request_id", requestId);
            await next(httpContext);
        }
    }
}
