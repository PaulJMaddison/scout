using System.Text;
using System.Threading.RateLimiting;
using ContextLayer.Api.Auth;
using ContextLayer.Api.GraphQL;
using ContextLayer.Api.Middleware;
using ContextLayer.Application.Abstractions;
using ContextLayer.Application;
using ContextLayer.Infrastructure;
using ContextLayer.Infrastructure.Auth;
using ContextLayer.Infrastructure.Persistence;
using ContextLayer.Infrastructure.Seed;
using HotChocolate.AspNetCore.Authorization;
using HotChocolate.Types;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "http://127.0.0.1:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("WebApp", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddProblemDetails();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var authOptions = builder.Configuration.GetSection(AuthOptions.SectionName).Get<AuthOptions>() ?? new AuthOptions();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = authOptions.Issuer,
            ValidAudience = authOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authOptions.SigningKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("auth", policy =>
    {
        policy.PermitLimit = 5;
        policy.Window = TimeSpan.FromMinutes(1);
        policy.QueueLimit = 0;
    });
    options.AddTokenBucketLimiter("graphql", policy =>
    {
        policy.TokenLimit = 60;
        policy.TokensPerPeriod = 60;
        policy.QueueLimit = 0;
        policy.ReplenishmentPeriod = TimeSpan.FromMinutes(1);
        policy.AutoReplenishment = true;
    });
});

builder.Services
    .AddContextLayerApplication()
    .AddContextLayerInfrastructure(builder.Configuration);

builder.Services
    .AddGraphQLServer()
    .AddQueryType<Query>()
    .AddMutationType<Mutation>()
    .AddType<DateTimeType>()
    .AddAuthorization()
    .ModifyRequestOptions(options =>
    {
        options.IncludeExceptionDetails = builder.Environment.IsDevelopment();
    })
    .AddErrorFilter<GraphQlErrorFilter>();

builder.Services
    .AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService("ContextLayer.Api"))
    .WithTracing(tracing =>
    {
        tracing
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddSource("ContextLayer.Ai");

        var otlpEndpoint = builder.Configuration["Telemetry:OtlpEndpoint"];
        if (!string.IsNullOrWhiteSpace(otlpEndpoint))
        {
            tracing.AddOtlpExporter(options => options.Endpoint = new Uri(otlpEndpoint));
        }
    })
    .WithMetrics(metrics =>
    {
        metrics
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation()
            .AddMeter("ContextLayer.BackgroundJobs");

        var otlpEndpoint = builder.Configuration["Telemetry:OtlpEndpoint"];
        if (!string.IsNullOrWhiteSpace(otlpEndpoint))
        {
            metrics.AddOtlpExporter(options => options.Endpoint = new Uri(otlpEndpoint));
        }
    });

var app = builder.Build();
var bootstrapOnly = args.Any(static arg =>
    string.Equals(arg, "bootstrap-demo", StringComparison.OrdinalIgnoreCase)
    || string.Equals(arg, "seed-demo", StringComparison.OrdinalIgnoreCase));

app.UseExceptionHandler();
app.UseMiddleware<RequestContextMiddleware>();
await DemoDataSeeder.SeedAsync(app.Services);
if (bootstrapOnly)
{
    return;
}

app.UseCors("WebApp");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

var authGroup = app.MapGroup("/api/auth");
authGroup.MapPost("/login", async (
        LoginRequest request,
        AuthenticationService authenticationService,
        CancellationToken cancellationToken) =>
    {
        try
        {
            var result = await authenticationService.LoginAsync(request.TenantSlug, request.Email, request.Password, cancellationToken);
            return Results.Ok(new AuthSessionResponse(
                result.AccessToken,
                result.ExpiresAtUtc,
                new AuthenticatedOperatorResponse(
                    result.Operator.TenantId,
                    result.Operator.TenantSlug,
                    result.Operator.OperatorAccountId,
                    result.Operator.Email,
                    result.Operator.DisplayName,
                    result.Operator.Role)));
        }
        catch (InvalidOperationException)
        {
            return Results.Unauthorized();
        }
    })
    .AllowAnonymous()
    .RequireRateLimiting("auth");

authGroup.MapGet("/me", [Microsoft.AspNetCore.Authorization.Authorize] async (
        HttpContext httpContext,
        AuthenticationService authenticationService,
        CancellationToken cancellationToken) =>
    {
        var currentOperator = await authenticationService.GetCurrentOperatorAsync(httpContext.User, cancellationToken);
        return currentOperator is null
            ? Results.Unauthorized()
            : Results.Ok(new AuthenticatedOperatorResponse(
                currentOperator.TenantId,
                currentOperator.TenantSlug,
                currentOperator.OperatorAccountId,
                currentOperator.Email,
                currentOperator.DisplayName,
                currentOperator.Role));
    });

var opsGroup = app.MapGroup("/api/ops")
    .RequireAuthorization(new AuthorizeAttribute { Roles = RoleNames.TenantAdmin });
opsGroup.MapGet("/summary", async (
        ContextLayerDbContext dbContext,
        ICurrentActorService currentActorService,
        IBackgroundJobMonitor backgroundJobMonitor,
        CancellationToken cancellationToken) =>
    {
        var actor = currentActorService.GetCurrentActor();
        var tenant = await dbContext.Tenants.FirstOrDefaultAsync(x => x.Slug == actor.TenantSlug, cancellationToken);
        if (tenant is null)
        {
            return Results.NotFound();
        }

        var activeAgentRuns = await dbContext.AgentRuns.CountAsync(
            x => x.TenantId == tenant.Id && x.RequestedAtUtc >= DateTime.UtcNow.AddDays(-1),
            cancellationToken);
        var failedAgentRuns = await dbContext.AgentRuns.CountAsync(
            x => x.TenantId == tenant.Id && x.Status == ContextLayer.Domain.Enums.AgentRunStatus.Failed,
            cancellationToken);
        var pendingExecutions = await dbContext.SelectorExecutions.CountAsync(
            x => x.TenantId == tenant.Id && (x.Status == ContextLayer.Domain.Enums.SelectorExecutionStatus.Pending || x.Status == ContextLayer.Domain.Enums.SelectorExecutionStatus.Running),
            cancellationToken);
        var staleSnapshots = await dbContext.ContextSnapshots.CountAsync(
            x => x.TenantId == tenant.Id && x.IsStale,
            cancellationToken);

        return Results.Ok(new
        {
            tenant = tenant.Slug,
            backgroundWorkers = backgroundJobMonitor.GetWorkers(),
            stats = new
            {
                activeAgentRuns,
                failedAgentRuns,
                pendingExecutions,
                staleSnapshots
            }
        });
    });

app.MapGet("/", () => Results.Redirect("/graphql"));
app.MapGet("/health", async (ContextLayerDbContext contextLayerDbContext, CustomerOpsDbContext customerOpsDbContext, CancellationToken cancellationToken) =>
{
    var contextLayerReady = await contextLayerDbContext.Database.CanConnectAsync(cancellationToken);
    var customerOpsReady = await customerOpsDbContext.Database.CanConnectAsync(cancellationToken);
    return Results.Ok(new
    {
        status = contextLayerReady && customerOpsReady ? "ok" : "degraded",
        service = "ContextLayer.Api",
        checks = new[]
        {
            new { name = "self", status = "ok" },
            new { name = "context-layer-db", status = contextLayerReady ? "ok" : "error" },
            new { name = "customer-ops-db", status = customerOpsReady ? "ok" : "error" }
        }
    });
});
app.MapGet("/health/live", () => Results.Ok(new
{
    status = "ok",
    service = "ContextLayer.Api"
}));
app.MapGet("/health/ready", async (ContextLayerDbContext contextLayerDbContext, CustomerOpsDbContext customerOpsDbContext, CancellationToken cancellationToken) =>
{
    var contextLayerReady = await contextLayerDbContext.Database.CanConnectAsync(cancellationToken);
    var customerOpsReady = await customerOpsDbContext.Database.CanConnectAsync(cancellationToken);
    return contextLayerReady && customerOpsReady
        ? Results.Ok(new
        {
            status = "ok",
            service = "ContextLayer.Api",
            checks = new[]
            {
                new { name = "context-layer-db", status = "ok" },
                new { name = "customer-ops-db", status = "ok" }
            }
        })
        : Results.Problem(
            title: "Database unavailable",
            detail: "The API cannot reach one or more configured PostgreSQL databases.",
            statusCode: StatusCodes.Status503ServiceUnavailable);
});
app.MapGraphQL("/graphql").RequireAuthorization().RequireRateLimiting("graphql");

app.Run();

public partial class Program;
