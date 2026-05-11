using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ContextLayer.Application.Abstractions;
using ContextLayer.Application.Contracts;
using ContextLayer.Api.Auth;
using ContextLayer.Application.Services;
using ContextLayer.Infrastructure.Auth;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;

namespace ContextLayer.Api.Rest;

public static class VersionedRestEndpointRouteBuilderExtensions
{
    private const int DefaultPage = 1;
    private const int DefaultPageSize = 50;
    private const int MaxPageSize = 200;

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static IEndpointRouteBuilder MapContextLayerV1RestApi(this IEndpointRouteBuilder endpoints)
    {
        var v1 = endpoints.MapGroup("/api/v1")
            .WithTags("REST API v1");
        v1.AddEndpointFilter(async (context, next) =>
        {
            EndpointHttpContext.Set(context.HttpContext);
            try
            {
                return await next(context);
            }
            finally
            {
                EndpointHttpContext.Clear();
            }
        });

        v1.MapGet("/health", () => Results.Ok(new
            {
                status = "ok",
                version = "v1",
                service = "ContextLayer.Api"
            }))
            .AllowAnonymous()
            .WithName("V1Health");

        v1.MapGet("/connectors/catalogue", async (
                string? availability,
                string? category,
                string? q,
                int? page,
                int? pageSize,
                IContextLayerService service,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var entries = await service.GetConnectorCatalogueAsync(cancellationToken);
                var filtered = entries.AsEnumerable();
                if (!string.IsNullOrWhiteSpace(availability))
                {
                    filtered = filtered.Where(x => string.Equals(x.Availability, availability.Trim(), StringComparison.OrdinalIgnoreCase));
                }

                if (!string.IsNullOrWhiteSpace(category))
                {
                    filtered = filtered.Where(x => string.Equals(x.Category, category.Trim(), StringComparison.OrdinalIgnoreCase));
                }

                if (!string.IsNullOrWhiteSpace(q))
                {
                    var term = q.Trim();
                    filtered = filtered.Where(x =>
                        x.DisplayName.Contains(term, StringComparison.OrdinalIgnoreCase)
                        || x.Description.Contains(term, StringComparison.OrdinalIgnoreCase)
                        || x.ConnectorType.Contains(term, StringComparison.OrdinalIgnoreCase));
                }

                return Results.Ok(Page(filtered.ToList(), page, pageSize));
            }))
            .AllowAnonymous()
            .WithName("V1ListConnectorCatalogue");

        var reader = v1.MapGroup(string.Empty)
            .RequireAuthorization(new AuthorizeAttribute
            {
                Roles = string.Join(',', RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst, RoleNames.SalesUser, RoleNames.ReadOnly, RoleNames.ApiClient)
            })
            .RequireApiClientScope(ApiScopes.ContextRead);
        var writer = v1.MapGroup(string.Empty)
            .RequireAuthorization(new AuthorizeAttribute
            {
                Roles = string.Join(',', RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst, RoleNames.ApiClient)
            })
            .RequireApiClientScope(ApiScopes.ContextWrite);
        var selectorWriter = v1.MapGroup(string.Empty)
            .RequireAuthorization(new AuthorizeAttribute
            {
                Roles = string.Join(',', RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst, RoleNames.ApiClient)
            })
            .RequireApiClientScope(ApiScopes.SelectorsWrite);
        var eventIngestor = v1.MapGroup(string.Empty)
            .RequireAuthorization(new AuthorizeAttribute
            {
                Roles = string.Join(',', RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst, RoleNames.ApiClient)
            })
            .RequireApiClientScope(ApiScopes.EventsIngest);
        var auditReader = v1.MapGroup(string.Empty)
            .RequireAuthorization(new AuthorizeAttribute
            {
                Roles = string.Join(',', RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.Analyst, RoleNames.ReadOnly, RoleNames.ApiClient)
            })
            .RequireApiClientScope(ApiScopes.AuditRead);
        var billingReader = v1.MapGroup(string.Empty)
            .RequireAuthorization(new AuthorizeAttribute
            {
                Roles = string.Join(',', RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.ApiClient)
            })
            .RequireApiClientScope(ApiScopes.BillingRead);
        var blueprintWriter = v1.MapGroup(string.Empty)
            .RequireAuthorization(new AuthorizeAttribute
            {
                Roles = string.Join(',', RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.ApiClient)
            })
            .RequireApiClientScope(ApiScopes.BlueprintsWrite);
        var admin = v1.MapGroup(string.Empty)
            .RequireAuthorization(new AuthorizeAttribute
            {
                Roles = string.Join(',', RoleNames.PlatformOwner, RoleNames.TenantAdmin, RoleNames.IntegrationAdmin, RoleNames.ApiClient)
            })
            .RequireApiClientScope(ApiScopes.AdminManage);

        reader.MapGet("/workspaces", async (
                string? tenantSlug,
                string? status,
                int? page,
                int? pageSize,
                IContextLayerService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async httpContext =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug);
                var workspaces = await service.GetWorkspacesAsync(resolvedTenantSlug, status, cancellationToken);
                return Results.Ok(Page(workspaces, page, pageSize));
            }))
            .WithName("V1ListWorkspaces");

        reader.MapGet("/licence/status", async (
                ILicenceService service,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
                Results.Ok(await service.GetStatusAsync(cancellationToken))))
            .WithName("V1GetLicenceStatus");

        reader.MapGet("/context/users/{externalUserId}", async (
                string externalUserId,
                string? tenantSlug,
                IContextLayerService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async httpContext =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug);
                var result = await service.GetUserContextAsync(new UserContextLookupInput(resolvedTenantSlug, externalUserId), cancellationToken);
                return result is null ? NotFound(httpContext, "context.user_not_found", "User context was not found.") : Results.Ok(result);
            }))
            .WithName("V1GetUserContext");

        reader.MapGet("/context/accounts/{externalAccountId}", async (
                string externalAccountId,
                string? tenantSlug,
                IContextLayerService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async httpContext =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug);
                var result = await service.GetAccountContextAsync(resolvedTenantSlug, externalAccountId, cancellationToken);
                return result is null ? NotFound(httpContext, "context.account_not_found", "Account context was not found.") : Results.Ok(result);
            }))
            .WithName("V1GetAccountContext");

        reader.MapGet("/context/snapshots/{snapshotId:guid}", async (
                Guid snapshotId,
                string? tenantSlug,
                IContextLayerService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async httpContext =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug);
                var result = await service.GetContextSnapshotAsync(resolvedTenantSlug, snapshotId, cancellationToken);
                return result is null ? NotFound(httpContext, "context.snapshot_not_found", "Context snapshot was not found.") : Results.Ok(result);
            }))
            .WithName("V1GetContextSnapshot");

        writer.MapPost("/context/recompute", async (
                V1RecomputeRequest request,
                string? tenantSlug,
                IContextLayerService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug);
                var triggeredBy = string.IsNullOrWhiteSpace(request.TriggeredBy)
                    ? actorService.GetCurrentActor().Email
                    : request.TriggeredBy.Trim();
                var result = await service.QueueContextRecomputeAsync(
                    new QueueContextRecomputeInput(resolvedTenantSlug, request.ExternalUserId, triggeredBy),
                    cancellationToken);
                return Results.Accepted(value: result);
            }))
            .WithName("V1QueueContextRecompute");

        selectorWriter.MapPost("/selectors/preview", async (
                V1SelectorPreviewRequest request,
                string? tenantSlug,
                IContextLayerService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug);
                var input = new PreviewSelectorInput(
                    resolvedTenantSlug,
                    request.ExternalUserId,
                    request.SelectorDefinitionId,
                    request.DraftSelector);
                return Results.Ok(await service.PreviewSelectorAsync(input, cancellationToken));
            }))
            .WithName("V1PreviewSelector");

        selectorWriter.MapPost("/selectors/validate", async (
                V1SelectorValidateRequest request,
                string? tenantSlug,
                IContextLayerService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug);
                var draft = request.DraftSelector with { TenantSlug = resolvedTenantSlug };
                var input = new ValidateSelectorInput(resolvedTenantSlug, draft, request.ExternalUserId);
                return Results.Ok(await service.ValidateSelectorAsync(input, cancellationToken));
            }))
            .WithName("V1ValidateSelector");

        reader.MapGet("/semantic-attributes", async (
                string? tenantSlug,
                string? q,
                string? dataType,
                int? page,
                int? pageSize,
                IContextLayerService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug);
                var attributes = await service.GetSemanticAttributesAsync(resolvedTenantSlug, cancellationToken);
                var filtered = attributes.AsEnumerable();
                if (!string.IsNullOrWhiteSpace(q))
                {
                    filtered = filtered.Where(x =>
                        x.Key.Contains(q.Trim(), StringComparison.OrdinalIgnoreCase)
                        || x.DisplayName.Contains(q.Trim(), StringComparison.OrdinalIgnoreCase));
                }

                if (!string.IsNullOrWhiteSpace(dataType))
                {
                    filtered = filtered.Where(x => string.Equals(x.DataType.ToString(), dataType.Trim(), StringComparison.OrdinalIgnoreCase));
                }

                return Results.Ok(Page(filtered.ToList(), page, pageSize));
            }))
            .WithName("V1ListSemanticAttributes");

        auditReader.MapGet("/audit-events", async (
                string? tenantSlug,
                string? action,
                string? entityType,
                DateTime? fromUtc,
                DateTime? toUtc,
                int? page,
                int? pageSize,
                IContextLayerService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug);
                var auditEvents = await service.GetAuditEventsAsync(resolvedTenantSlug, cancellationToken);
                var filtered = auditEvents.AsEnumerable();
                if (!string.IsNullOrWhiteSpace(action))
                {
                    filtered = filtered.Where(x => x.Action.Contains(action.Trim(), StringComparison.OrdinalIgnoreCase));
                }
                if (!string.IsNullOrWhiteSpace(entityType))
                {
                    filtered = filtered.Where(x => string.Equals(x.EntityType, entityType.Trim(), StringComparison.OrdinalIgnoreCase));
                }
                if (fromUtc.HasValue)
                {
                    filtered = filtered.Where(x => x.CreatedAtUtc >= fromUtc.Value);
                }
                if (toUtc.HasValue)
                {
                    filtered = filtered.Where(x => x.CreatedAtUtc <= toUtc.Value);
                }

                return Results.Ok(Page(filtered.ToList(), page, pageSize));
            }))
            .WithName("V1ListAuditEvents");

        admin.MapGet("/audit-events/export", async (
                string? tenantSlug,
                string? format,
                IContextLayerService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveRequestedTenantSlug(actorService, tenantSlug);
                var export = await service.ExportAuditEventsAsync(resolvedTenantSlug, format ?? "json", cancellationToken);
                return Results.File(
                    Encoding.UTF8.GetBytes(export.Content),
                    export.ContentType,
                    export.FileName);
            }))
            .WithName("V1ExportAuditEvents");

        admin.MapGet("/admin/organisation", async (
                string? tenantSlug,
                IContextLayerService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveRequestedTenantSlug(actorService, tenantSlug);
                return Results.Ok(await service.GetOrganisationSettingsAsync(resolvedTenantSlug, cancellationToken));
            }))
            .WithName("V1GetOrganisationSettings");

        admin.MapGet("/admin/users", async (
                string? tenantSlug,
                int? page,
                int? pageSize,
                IContextLayerService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveRequestedTenantSlug(actorService, tenantSlug);
                var users = await service.GetOperatorAccountsAsync(resolvedTenantSlug, cancellationToken);
                return Results.Ok(Page(users, page, pageSize));
            }))
            .WithName("V1ListOperatorAccounts");

        admin.MapPatch("/admin/users/{id:guid}", async (
                Guid id,
                V1UpdateOperatorAccountRequest request,
                string? tenantSlug,
                IContextLayerService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveRequestedTenantSlug(actorService, tenantSlug ?? request.TenantSlug);
                return Results.Ok(await service.UpdateOperatorAccountAsync(
                    new UpdateOperatorAccountInput(
                        resolvedTenantSlug,
                        id,
                        request.DisplayName,
                        request.Role,
                        request.IsActive),
                    cancellationToken));
            }))
            .WithName("V1UpdateOperatorAccount");

        admin.MapGet("/blueprints", async (
                string? tenantSlug,
                string? status,
                int? page,
                int? pageSize,
                IContextLayerService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveRequestedTenantSlug(actorService, tenantSlug);
                var imports = await service.GetBlueprintImportsAsync(resolvedTenantSlug, status, cancellationToken);
                return Results.Ok(Page(imports, page, pageSize));
            }))
            .WithName("V1ListBlueprintImports");

        admin.MapGet("/governance/policies", async (
                string? tenantSlug,
                int? page,
                int? pageSize,
                IContextLayerService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveRequestedTenantSlug(actorService, tenantSlug);
                var policies = await service.GetGovernancePoliciesAsync(resolvedTenantSlug, cancellationToken);
                return Results.Ok(Page(policies, page, pageSize));
            }))
            .WithName("V1ListGovernancePolicies");

        billingReader.MapGet("/billing/usage", async (
                string? tenantSlug,
                IUsageMeteringService usageMeteringService,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug);
                return Results.Ok(await usageMeteringService.GetUsageOverviewAsync(resolvedTenantSlug, cancellationToken));
            }))
            .WithName("V1GetBillingUsage");

        eventIngestor.MapPost("/events/source-system", async (
                HttpRequest httpRequest,
                string? tenantSlug,
                IContextLayerService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug);
                var body = await ReadBodyAsync(httpRequest, cancellationToken);
                if (!ValidateWebhookSignature(httpRequest.HttpContext, body))
                {
                    return Error(httpRequest.HttpContext, StatusCodes.Status401Unauthorized, "webhook.signature_invalid", "Webhook signature validation failed.");
                }

                var request = JsonSerializer.Deserialize<V1SourceSystemEventRequest>(body, JsonOptions)
                    ?? throw new InvalidOperationException("A source-system event body is required.");
                var payloadJson = request.PayloadJson
                    ?? JsonSerializer.Serialize(request.Payload ?? new { }, JsonOptions);
                var result = await service.IngestSourceSystemEventAsync(
                    new SourceSystemEventInput(
                        resolvedTenantSlug,
                        request.WorkspaceSlug,
                        request.EventId ?? httpRequest.Headers["X-UCL-Event-Id"].FirstOrDefault() ?? Guid.NewGuid().ToString("N"),
                        request.SourceSystem,
                        request.EventType,
                        payloadJson,
                        request.ExternalUserId,
                        request.ExternalAccountId,
                        request.ObservedAtUtc),
                    cancellationToken);
                return Results.Accepted(value: result);
            }))
            .WithName("V1IngestSourceSystemEvent");

        admin.MapPost("/api-clients", async (
                V1CreateApiClientRequest request,
                string? tenantSlug,
                ApiClientKeyService apiClientKeyService,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug);
                var result = await apiClientKeyService.CreateAsync(
                    resolvedTenantSlug,
                    request.WorkspaceSlug,
                    request.DisplayName,
                    request.Scopes,
                    cancellationToken);
                return Results.Created($"/api/v1/api-clients/{result.ClientId}", result);
            }))
            .WithName("V1CreateApiClient");

        blueprintWriter.MapPost("/blueprints/upload", async (
                UploadBlueprintInput request,
                string? tenantSlug,
                IBlueprintImportService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug ?? request.TenantSlug);
                return Results.Created(
                    "/api/v1/blueprints",
                    await service.UploadAsync(request with { TenantSlug = resolvedTenantSlug }, cancellationToken));
            }))
            .WithName("V1UploadBlueprint");

        blueprintWriter.MapPost("/blueprints/validate", async (
                BlueprintImportInput request,
                string? tenantSlug,
                IBlueprintImportService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug ?? request.TenantSlug);
                return Results.Ok(await service.ValidateAsync(request with { TenantSlug = resolvedTenantSlug }, cancellationToken));
            }))
            .WithName("V1ValidateBlueprint");

        blueprintWriter.MapPost("/blueprints/preview", async (
                BlueprintImportInput request,
                string? tenantSlug,
                IBlueprintImportService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug ?? request.TenantSlug);
                return Results.Ok(await service.PreviewAsync(request with { TenantSlug = resolvedTenantSlug }, cancellationToken));
            }))
            .WithName("V1PreviewBlueprint");

        blueprintWriter.MapPost("/blueprints/import", async (
                BlueprintImportInput request,
                string? tenantSlug,
                IBlueprintImportService service,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug ?? request.TenantSlug);
                return Results.Ok(await service.ImportAsync(request with { TenantSlug = resolvedTenantSlug }, cancellationToken));
            }))
            .WithName("V1ImportBlueprint");

        admin.MapPost("/api-clients/{id}/rotate", async (
                string id,
                string? tenantSlug,
                ApiClientKeyService apiClientKeyService,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug);
                return Results.Ok(await apiClientKeyService.RotateAsync(resolvedTenantSlug, id, cancellationToken));
            }))
            .WithName("V1RotateApiClient");

        admin.MapDelete("/api-clients/{id}", async (
                string id,
                string? tenantSlug,
                ApiClientKeyService apiClientKeyService,
                ICurrentActorService actorService,
                CancellationToken cancellationToken) =>
            await ExecuteAsync(async _ =>
            {
                var resolvedTenantSlug = ResolveTenantSlug(actorService, tenantSlug);
                await apiClientKeyService.RevokeAsync(resolvedTenantSlug, id, cancellationToken);
                return Results.NoContent();
            }))
            .WithName("V1RevokeApiClient");

        return endpoints;
    }

    private static RouteGroupBuilder RequireApiClientScope(this RouteGroupBuilder group, string requiredScope)
    {
        group.AddEndpointFilter(async (context, next) =>
        {
            var user = context.HttpContext.User;
            if (!user.IsInRole(RoleNames.ApiClient))
            {
                return await next(context);
            }

            var scopes = user.FindAll("scope")
                .SelectMany(claim => claim.Value.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                .Select(ApiScopes.Normalize)
                .ToHashSet(StringComparer.Ordinal);
            if (scopes.Contains(requiredScope))
            {
                return await next(context);
            }

            return Error(
                context.HttpContext,
                StatusCodes.Status403Forbidden,
                "authorization.scope_denied",
                $"API client scope '{requiredScope}' is required.");
        });

        return group;
    }

    private static string ResolveTenantSlug(ICurrentActorService actorService, string? requestedTenantSlug)
    {
        var actor = actorService.GetCurrentActor();
        if (string.IsNullOrWhiteSpace(requestedTenantSlug))
        {
            return actor.TenantSlug;
        }

        var normalizedRequestedTenantSlug = requestedTenantSlug.Trim().ToLowerInvariant();
        if (actor.IsSystem || actor.IsPlatformOwner)
        {
            return normalizedRequestedTenantSlug;
        }

        if (string.Equals(actor.TenantSlug, normalizedRequestedTenantSlug, StringComparison.OrdinalIgnoreCase))
        {
            return normalizedRequestedTenantSlug;
        }

        throw new UnauthorizedAccessException("Cross-tenant access is not permitted.");
    }

    private static string ResolveRequestedTenantSlug(ICurrentActorService actorService, string? requestedTenantSlug)
    {
        if (!string.IsNullOrWhiteSpace(requestedTenantSlug))
        {
            return requestedTenantSlug.Trim().ToLowerInvariant();
        }

        return actorService.GetCurrentActor().TenantSlug;
    }

    private static V1PagedResponse<T> Page<T>(IReadOnlyList<T> items, int? page, int? pageSize)
    {
        var resolvedPage = Math.Max(DefaultPage, page ?? DefaultPage);
        var resolvedPageSize = Math.Clamp(pageSize ?? DefaultPageSize, 1, MaxPageSize);
        var skipped = (resolvedPage - 1) * resolvedPageSize;
        var pageItems = items.Skip(skipped).Take(resolvedPageSize).ToList();
        return new V1PagedResponse<T>(
            pageItems,
            resolvedPage,
            resolvedPageSize,
            items.Count,
            skipped + pageItems.Count < items.Count);
    }

    private static async Task<IResult> ExecuteAsync(Func<HttpContext, Task<IResult>> action)
    {
        try
        {
            return await action(EndpointHttpContext.Current);
        }
        catch (ValidationException exception)
        {
            return Error(
                EndpointHttpContext.Current,
                StatusCodes.Status400BadRequest,
                "validation.failed",
                "The request did not pass validation.",
                exception.Errors
                    .GroupBy(error => string.IsNullOrWhiteSpace(error.PropertyName) ? "request" : error.PropertyName)
                    .ToDictionary(group => group.Key, group => group.Select(error => error.ErrorMessage).ToArray()));
        }
        catch (UnauthorizedAccessException exception)
        {
            return Error(EndpointHttpContext.Current, StatusCodes.Status403Forbidden, "authorization.denied", exception.Message);
        }
        catch (PlanLimitExceededException exception)
        {
            return Error(
                EndpointHttpContext.Current,
                StatusCodes.Status402PaymentRequired,
                "billing.limit_exceeded",
                exception.Message,
                new Dictionary<string, string[]>
                {
                    ["tenantSlug"] = [exception.TenantSlug],
                    ["plan"] = [exception.Plan.ToString()],
                    ["metric"] = [exception.Metric.ToString()],
                    ["limit"] = [exception.Limit.ToString(System.Globalization.CultureInfo.InvariantCulture)],
                    ["currentUsage"] = [exception.CurrentUsage.ToString(System.Globalization.CultureInfo.InvariantCulture)],
                    ["requestedQuantity"] = [exception.RequestedQuantity.ToString(System.Globalization.CultureInfo.InvariantCulture)]
                });
        }
        catch (InvalidOperationException exception)
        {
            return Error(EndpointHttpContext.Current, StatusCodes.Status400BadRequest, "request.invalid", exception.Message);
        }
    }

    private static IResult NotFound(HttpContext httpContext, string code, string message)
        => Error(httpContext, StatusCodes.Status404NotFound, code, message);

    private static IResult Error(
        HttpContext httpContext,
        int statusCode,
        string code,
        string message,
        IReadOnlyDictionary<string, string[]>? details = null)
    {
        var correlationId = httpContext.Response.Headers["X-Request-Id"].FirstOrDefault()
            ?? httpContext.TraceIdentifier;
        return Results.Json(
            new V1ErrorResponse(new V1ErrorBody(code, message, correlationId, details)),
            statusCode: statusCode);
    }

    private static async Task<string> ReadBodyAsync(HttpRequest request, CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(request.Body, Encoding.UTF8);
        return await reader.ReadToEndAsync(cancellationToken);
    }

    private static bool ValidateWebhookSignature(HttpContext httpContext, string body)
    {
        if (!string.Equals(httpContext.User.Identity?.AuthenticationType, ApiKeyAuthenticationHandler.SchemeName, StringComparison.Ordinal))
        {
            return true;
        }

        var rawApiKey = httpContext.Items[ApiKeyAuthenticationHandler.RawApiKeyItemName] as string;
        var signature = httpContext.Request.Headers["X-UCL-Webhook-Signature"].FirstOrDefault();
        var timestamp = httpContext.Request.Headers["X-UCL-Webhook-Timestamp"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(rawApiKey)
            || string.IsNullOrWhiteSpace(signature)
            || string.IsNullOrWhiteSpace(timestamp)
            || !DateTimeOffset.TryParse(timestamp, out var parsedTimestamp)
            || Math.Abs((DateTimeOffset.UtcNow - parsedTimestamp.ToUniversalTime()).TotalMinutes) > 5)
        {
            return false;
        }

        var signedPayload = $"{timestamp}.{body}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(rawApiKey));
        var expected = "sha256=" + Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(signedPayload))).ToLowerInvariant();
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expected),
            Encoding.UTF8.GetBytes(signature.Trim().ToLowerInvariant()));
    }

    private sealed class EndpointHttpContext
    {
        private static readonly AsyncLocal<HttpContext?> CurrentContext = new();

        public static HttpContext Current
            => CurrentContext.Value ?? throw new InvalidOperationException("No endpoint HttpContext is available.");

        public static void Set(HttpContext httpContext)
            => CurrentContext.Value = httpContext;

        public static void Clear()
            => CurrentContext.Value = null;
    }
}
