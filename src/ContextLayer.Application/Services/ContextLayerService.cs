using System.Text.Json;
using System.Text.Json.Serialization;
using ContextLayer.Application.Abstractions;
using ContextLayer.Application.Contracts;
using ContextLayer.Domain.Entities;
using ContextLayer.Domain.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace ContextLayer.Application.Services;

public sealed class ContextLayerService(
    IContextLayerDbContext dbContext,
    ICustomerOpsDbContext customerOpsDbContext,
    IClock clock,
    IContextRecomputeQueue recomputeQueue,
    IValidator<UpsertDataSourceInput> upsertDataSourceValidator,
    IValidator<UpsertSemanticAttributeInput> upsertSemanticAttributeValidator,
    IValidator<UpsertSelectorDefinitionInput> upsertSelectorValidator,
    IValidator<PublishSelectorDefinitionInput> publishSelectorValidator,
    IValidator<QueueContextRecomputeInput> queueContextRecomputeValidator,
    IValidator<UserContextLookupInput> userContextLookupValidator,
    IValidator<SalesContextPackageInput> salesContextPackageValidator,
    IValidator<PreviewSelectorInput> previewSelectorValidator,
    IValidator<ValidateSelectorInput> validateSelectorValidator,
    IValidator<RunScheduledRecomputeInput> runScheduledRecomputeValidator,
    IValidator<UpsertPromptTemplateInput> upsertPromptTemplateValidator,
    IValidator<CreateAgentRunInput> createAgentRunValidator,
    ISalesSupportAgentService salesSupportAgentService,
    ICurrentActorService currentActorService,
    IStructuredLlmClientRegistry llmClientRegistry,
    ISelectorExecutionEngine selectorExecutionEngine,
    IScheduledRecomputeDispatcher scheduledRecomputeDispatcher)
    : IContextLayerService
{
    public async Task<IReadOnlyList<Tenant>> GetTenantsAsync(CancellationToken cancellationToken)
    {
        var actor = currentActorService.GetCurrentActor();
        var query = dbContext.Tenants.AsNoTracking();
        if (!actor.IsSystem)
        {
            var normalizedSlug = NormalizeSlug(actor.TenantSlug);
            query = query.Where(x => x.Slug == normalizedSlug);
        }

        return await query.OrderBy(x => x.Name).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<DataSource>> GetDataSourcesAsync(string tenantSlug, CancellationToken cancellationToken)
    {
        var tenant = await GetTenantAsync(tenantSlug, cancellationToken);
        return await dbContext.DataSources
            .AsNoTracking()
            .Where(x => x.TenantId == tenant.Id)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SemanticAttributeDefinition>> GetSemanticAttributesAsync(string tenantSlug, CancellationToken cancellationToken)
    {
        var tenant = await GetTenantAsync(tenantSlug, cancellationToken);
        return await dbContext.SemanticAttributeDefinitions
            .AsNoTracking()
            .Where(x => x.TenantId == tenant.Id)
            .OrderBy(x => x.Key)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SelectorDefinition>> GetSelectorsAsync(string tenantSlug, CancellationToken cancellationToken)
    {
        var tenant = await GetTenantAsync(tenantSlug, cancellationToken);
        return await dbContext.SelectorDefinitions
            .AsNoTracking()
            .Include(x => x.DataSource)
            .Include(x => x.TargetAttributeDefinition)
            .Where(x => x.TenantId == tenant.Id)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SelectorExecution>> GetSelectorExecutionsAsync(
        string tenantSlug,
        string? externalUserId,
        CancellationToken cancellationToken)
    {
        var tenant = await GetTenantAsync(tenantSlug, cancellationToken);
        var query = dbContext.SelectorExecutions
            .AsNoTracking()
            .Include(x => x.SelectorDefinition)
            .Include(x => x.UserProfile)
            .Where(x => x.TenantId == tenant.Id);

        if (!string.IsNullOrWhiteSpace(externalUserId))
        {
            var normalizedExternalUserId = externalUserId.Trim();
            query = query.Where(x => x.UserProfile.ExternalUserId == normalizedExternalUserId);
        }

        return await query.OrderByDescending(x => x.RequestedAtUtc).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PromptTemplate>> GetPromptTemplatesAsync(string tenantSlug, CancellationToken cancellationToken)
    {
        var tenant = await GetTenantAsync(tenantSlug, cancellationToken);
        return await dbContext.PromptTemplates
            .AsNoTracking()
            .Where(x => x.TenantId == tenant.Id)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AgentRun>> GetAgentRunsAsync(string tenantSlug, string? externalUserId, CancellationToken cancellationToken)
    {
        var tenant = await GetTenantAsync(tenantSlug, cancellationToken);
        var query = dbContext.AgentRuns
            .AsNoTracking()
            .Include(x => x.UserProfile)
            .Include(x => x.ContextSnapshot)
            .Where(x => x.TenantId == tenant.Id);

        if (!string.IsNullOrWhiteSpace(externalUserId))
        {
            var normalizedExternalUserId = externalUserId.Trim();
            query = query.Where(x => x.UserProfile.ExternalUserId == normalizedExternalUserId);
        }

        return await query.OrderByDescending(x => x.RequestedAtUtc).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AuditEvent>> GetAuditEventsAsync(string tenantSlug, CancellationToken cancellationToken)
    {
        var tenant = await GetTenantAsync(tenantSlug, cancellationToken);
        return await dbContext.AuditEvents
            .AsNoTracking()
            .Where(x => x.TenantId == tenant.Id)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Take(200)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<UserProfileResult>> GetUserProfilesAsync(string tenantSlug, CancellationToken cancellationToken)
    {
        var tenant = await GetTenantAsync(tenantSlug, cancellationToken);
        var actor = currentActorService.GetCurrentActor();
        var users = await dbContext.UserProfiles
            .AsNoTracking()
            .Where(x => x.TenantId == tenant.Id)
            .OrderBy(x => x.ExternalUserId)
            .ToListAsync(cancellationToken);

        return users
            .Select(user => new UserProfileResult(
                user.Id,
                user.TenantId,
                user.ExternalUserId,
                user.FullName,
                actor.CanViewSensitivePii ? user.Email : MaskEmail(user.Email),
                user.CompanyName,
                user.JobTitle,
                user.Segment,
                user.LastSeenAtUtc,
                !actor.CanViewSensitivePii))
            .ToList();
    }

    public async Task<DataSource> UpsertDataSourceAsync(UpsertDataSourceInput input, CancellationToken cancellationToken)
    {
        await upsertDataSourceValidator.ValidateAndThrowAsync(input, cancellationToken);
        var tenant = await GetTenantAsync(input.TenantSlug, cancellationToken);
        var utcNow = clock.UtcNow;

        DataSource entity;
        if (input.Id is { } id)
        {
            entity = await dbContext.DataSources.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenant.Id, cancellationToken)
                ?? throw new InvalidOperationException($"Data source '{id}' was not found.");
            var before = Serialize(entity);
            entity.Update(input.Name, input.Description, input.Kind, input.ConnectionConfigJson, utcNow);
            dbContext.AuditEvents.Add(CreateAuditEvent(tenant.Id, "system", "data-source.updated", nameof(DataSource), entity.Id, before, Serialize(entity), utcNow));
        }
        else
        {
            entity = DataSource.Create(tenant.Id, input.Name, input.Description, input.Kind, input.ConnectionConfigJson, utcNow);
            dbContext.DataSources.Add(entity);
            dbContext.AuditEvents.Add(CreateAuditEvent(tenant.Id, "system", "data-source.created", nameof(DataSource), entity.Id, null, Serialize(entity), utcNow));
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<SemanticAttributeDefinition> UpsertSemanticAttributeAsync(
        UpsertSemanticAttributeInput input,
        CancellationToken cancellationToken)
    {
        await upsertSemanticAttributeValidator.ValidateAndThrowAsync(input, cancellationToken);
        var tenant = await GetTenantAsync(input.TenantSlug, cancellationToken);
        var utcNow = clock.UtcNow;

        SemanticAttributeDefinition entity;
        if (input.Id is { } id)
        {
            entity = await dbContext.SemanticAttributeDefinitions
                .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenant.Id, cancellationToken)
                ?? throw new InvalidOperationException($"Semantic attribute '{id}' was not found.");
            var before = Serialize(entity);
            entity.Update(input.DisplayName, input.Description, input.DataType, input.ExampleValueJson, utcNow);
            dbContext.AuditEvents.Add(CreateAuditEvent(tenant.Id, "system", "semantic-attribute.updated", nameof(SemanticAttributeDefinition), entity.Id, before, Serialize(entity), utcNow));
        }
        else
        {
            var keyExists = await dbContext.SemanticAttributeDefinitions.AnyAsync(
                x => x.TenantId == tenant.Id && x.Key == input.Key,
                cancellationToken);
            if (keyExists)
            {
                throw new InvalidOperationException($"Semantic attribute key '{input.Key}' already exists.");
            }

            entity = SemanticAttributeDefinition.Create(
                tenant.Id,
                input.Key,
                input.DisplayName,
                input.Description,
                input.DataType,
                input.ExampleValueJson,
                input.IsSystem,
                utcNow);
            dbContext.SemanticAttributeDefinitions.Add(entity);
            dbContext.AuditEvents.Add(CreateAuditEvent(tenant.Id, "system", "semantic-attribute.created", nameof(SemanticAttributeDefinition), entity.Id, null, Serialize(entity), utcNow));
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<SelectorDefinition> UpsertSelectorAsync(UpsertSelectorDefinitionInput input, CancellationToken cancellationToken)
    {
        await upsertSelectorValidator.ValidateAndThrowAsync(input, cancellationToken);
        var tenant = await GetTenantAsync(input.TenantSlug, cancellationToken);
        var utcNow = clock.UtcNow;

        var targetAttribute = await dbContext.SemanticAttributeDefinitions.FirstOrDefaultAsync(
            x => x.Id == input.TargetAttributeDefinitionId && x.TenantId == tenant.Id,
            cancellationToken) ?? throw new InvalidOperationException("Target attribute does not exist in the tenant.");

        if (input.DataSourceId.HasValue)
        {
            var dataSourceExists = await dbContext.DataSources.AnyAsync(
                x => x.Id == input.DataSourceId && x.TenantId == tenant.Id,
                cancellationToken);
            if (!dataSourceExists)
            {
                throw new InvalidOperationException("Data source does not exist in the tenant.");
            }
        }

        SelectorDefinition entity;
        if (input.Id is { } id)
        {
            entity = await dbContext.SelectorDefinitions.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenant.Id, cancellationToken)
                ?? throw new InvalidOperationException($"Selector '{id}' was not found.");
            var before = Serialize(entity);
            entity.Update(
                input.DataSourceId,
                targetAttribute.Id,
                input.Name,
                input.Description,
                input.MappingKind,
                input.ExpressionJson,
                input.ExplanationTemplate,
                input.ValidationSchemaJson,
                input.DefaultConfidence,
                input.FreshnessWindowMinutes,
                input.Priority,
                input.ScheduleIntervalMinutes,
                utcNow);
            dbContext.AuditEvents.Add(CreateAuditEvent(tenant.Id, "system", "selector.updated", nameof(SelectorDefinition), entity.Id, before, Serialize(entity), utcNow));
        }
        else
        {
            entity = SelectorDefinition.Create(
                tenant.Id,
                input.DataSourceId,
                targetAttribute.Id,
                input.Name,
                input.Description,
                input.MappingKind,
                input.ExpressionJson,
                input.ExplanationTemplate,
                input.ValidationSchemaJson,
                input.DefaultConfidence,
                input.FreshnessWindowMinutes,
                input.Priority,
                input.ScheduleIntervalMinutes,
                utcNow);
            dbContext.SelectorDefinitions.Add(entity);
            dbContext.AuditEvents.Add(CreateAuditEvent(tenant.Id, "system", "selector.created", nameof(SelectorDefinition), entity.Id, null, Serialize(entity), utcNow));
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<SelectorDefinition> PublishSelectorAsync(PublishSelectorDefinitionInput input, CancellationToken cancellationToken)
    {
        await publishSelectorValidator.ValidateAndThrowAsync(input, cancellationToken);
        var tenant = await GetTenantAsync(input.TenantSlug, cancellationToken);
        var utcNow = clock.UtcNow;

        var selector = await dbContext.SelectorDefinitions
            .FirstOrDefaultAsync(x => x.Id == input.SelectorDefinitionId && x.TenantId == tenant.Id, cancellationToken)
            ?? throw new InvalidOperationException($"Selector '{input.SelectorDefinitionId}' was not found.");

        var before = Serialize(selector);
        selector.Publish(utcNow);
        dbContext.AuditEvents.Add(CreateAuditEvent(tenant.Id, "system", "selector.published", nameof(SelectorDefinition), selector.Id, before, Serialize(selector), utcNow));
        await dbContext.SaveChangesAsync(cancellationToken);
        return selector;
    }

    public async Task<PromptTemplate> UpsertPromptTemplateAsync(UpsertPromptTemplateInput input, CancellationToken cancellationToken)
    {
        await upsertPromptTemplateValidator.ValidateAndThrowAsync(input, cancellationToken);
        var tenant = await GetTenantAsync(input.TenantSlug, cancellationToken);
        var utcNow = clock.UtcNow;

        PromptTemplate entity;
        if (input.Id is { } id)
        {
            entity = await dbContext.PromptTemplates.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenant.Id, cancellationToken)
                ?? throw new InvalidOperationException($"Prompt template '{id}' was not found.");
            var before = Serialize(entity);
            entity.Update(
                input.Name,
                input.Description,
                input.SystemPrompt,
                input.DeveloperPrompt,
                input.UserPromptTemplate,
                input.OutputSchemaJson,
                input.GuardrailsJson,
                utcNow);
            dbContext.AuditEvents.Add(CreateAuditEvent(tenant.Id, "system", "prompt-template.updated", nameof(PromptTemplate), entity.Id, before, Serialize(entity), utcNow));
        }
        else
        {
            entity = PromptTemplate.Create(
                tenant.Id,
                input.Name,
                input.Description,
                input.SystemPrompt,
                input.DeveloperPrompt,
                input.UserPromptTemplate,
                input.OutputSchemaJson,
                input.GuardrailsJson,
                utcNow);
            dbContext.PromptTemplates.Add(entity);
            dbContext.AuditEvents.Add(CreateAuditEvent(tenant.Id, "system", "prompt-template.created", nameof(PromptTemplate), entity.Id, null, Serialize(entity), utcNow));
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }

    public async Task<QueueRecomputeResult> QueueContextRecomputeAsync(QueueContextRecomputeInput input, CancellationToken cancellationToken)
    {
        await queueContextRecomputeValidator.ValidateAndThrowAsync(input, cancellationToken);
        var tenant = await GetTenantAsync(input.TenantSlug, cancellationToken);
        var user = await GetUserProfileAsync(tenant.Id, input.ExternalUserId, cancellationToken);
        var selectors = await dbContext.SelectorDefinitions
            .Where(x => x.TenantId == tenant.Id && x.Status == SelectorStatus.Published)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        if (selectors.Count == 0)
        {
            throw new InvalidOperationException("No published selectors are available for the tenant.");
        }

        var utcNow = clock.UtcNow;
        var correlationId = Guid.NewGuid().ToString("N");
        var executions = selectors
            .Select(selector => SelectorExecution.Create(tenant.Id, selector.Id, user.Id, correlationId, input.TriggeredBy, SelectorExecutionMode.Live, utcNow))
            .ToList();
        var recomputeJob = RecomputeJob.Create(
            tenant.Id,
            user.Id,
            correlationId,
            input.TriggeredBy,
            executions.Count,
            $"Manual recompute requested for {user.ExternalUserId}.",
            JsonSerializer.Serialize(new
            {
                mode = "manual",
                user.ExternalUserId,
                selectorCount = executions.Count
            }),
            utcNow);

        dbContext.SelectorExecutions.AddRange(executions);
        dbContext.RecomputeJobs.Add(recomputeJob);
        dbContext.AuditEvents.Add(CreateAuditEvent(tenant.Id, input.TriggeredBy, "context.recompute.queued", nameof(UserProfile), user.Id, null, JsonSerializer.Serialize(new
        {
            user.ExternalUserId,
            correlationId,
            executionCount = executions.Count
        }), utcNow));

        await dbContext.SaveChangesAsync(cancellationToken);
        await recomputeQueue.EnqueueAsync(new ContextRecomputeRequest(tenant.Id, user.Id, correlationId, executions.Select(x => x.Id).ToList()), cancellationToken);

        return new QueueRecomputeResult(correlationId, tenant.Id, user.Id, executions.Count);
    }

    public async Task<ContextProfileResult?> GetUserContextAsync(UserContextLookupInput input, CancellationToken cancellationToken)
    {
        await userContextLookupValidator.ValidateAndThrowAsync(input, cancellationToken);
        var tenant = await GetTenantAsync(input.TenantSlug, cancellationToken);
        var user = await dbContext.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.TenantId == tenant.Id && x.ExternalUserId == input.ExternalUserId.Trim(), cancellationToken);

        if (user is null)
        {
            return null;
        }

        var snapshot = await dbContext.ContextSnapshots
            .AsNoTracking()
            .Include(x => x.Facts)
            .Where(x => x.TenantId == tenant.Id && x.UserProfileId == user.Id)
            .OrderByDescending(x => x.GeneratedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (snapshot is null)
        {
            return null;
        }

        await WriteReadAuditAsync(
            tenant.Id,
            actor: currentActorService.GetCurrentActor(),
            action: "context-profile.read",
            entityType: nameof(UserProfile),
            entityId: user.Id,
            metadata: new
            {
                user.ExternalUserId,
                factCount = snapshot.Facts.Count,
                maskedFields = Array.Empty<string>()
            },
            cancellationToken);

        var sourceSummary = await BuildOperationalSourceSummaryAsync(tenant.Slug, user.ExternalUserId, cancellationToken);
        var history = await dbContext.ContextSnapshots
            .AsNoTracking()
            .Where(x => x.TenantId == tenant.Id && x.UserProfileId == user.Id)
            .OrderByDescending(x => x.GeneratedAtUtc)
            .Take(6)
            .Select(x => new ContextSnapshotHistoryResult(
                x.Id,
                x.SnapshotVersion,
                x.Summary,
                x.OverallConfidence,
                x.GeneratedAtUtc,
                x.IsStale,
                x.Facts.Count))
            .ToListAsync(cancellationToken);

        var facts = snapshot.Facts
            .OrderBy(x => x.AttributeKey)
            .Select(x => new ContextFactResult(
                x.Id,
                x.AttributeKey,
                x.ValueJson,
                x.ValueType,
                x.Confidence,
                x.ObservedAtUtc,
                x.FreshUntilUtc,
                x.SourceSelectorDefinitionId,
                x.Explanation,
                x.ProvenanceJson))
            .ToList();

        return new ContextProfileResult(
            snapshot.Id,
            tenant.Slug,
            user.ExternalUserId,
            user.FullName,
            user.CompanyName,
            snapshot.Summary,
            snapshot.OverallConfidence,
            snapshot.GeneratedAtUtc,
            snapshot.IsStale || snapshot.Facts.Any(x => x.FreshUntilUtc.HasValue && x.FreshUntilUtc.Value < clock.UtcNow),
            sourceSummary,
            history,
            facts);
    }

    public async Task<SalesContextPackageResult?> GetSalesContextPackageAsync(SalesContextPackageInput input, CancellationToken cancellationToken)
    {
        await salesContextPackageValidator.ValidateAndThrowAsync(input, cancellationToken);
        var tenant = await GetTenantAsync(input.TenantSlug, cancellationToken);
        var user = await dbContext.UserProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.TenantId == tenant.Id && x.ExternalUserId == input.ExternalUserId.Trim(), cancellationToken);

        if (user is null)
        {
            return null;
        }

        var snapshot = await GetLatestContextSnapshotAsync(tenant.Id, user.Id, cancellationToken);
        if (snapshot is null)
        {
            return null;
        }

        await WriteReadAuditAsync(
            tenant.Id,
            actor: currentActorService.GetCurrentActor(),
            action: "sales-context.read",
            entityType: nameof(UserProfile),
            entityId: user.Id,
            metadata: new
            {
                user.ExternalUserId,
                input.SalesObjective,
                snapshotId = snapshot.Id
            },
            cancellationToken);

        return salesSupportAgentService.BuildContextPackage(
            tenant,
            user,
            snapshot,
            input.SalesObjective,
            clock.UtcNow);
    }

    public async Task<AgentRunResult> CreateAgentRunAsync(CreateAgentRunInput input, CancellationToken cancellationToken)
    {
        await createAgentRunValidator.ValidateAndThrowAsync(input, cancellationToken);
        var tenant = await GetTenantAsync(input.TenantSlug, cancellationToken);
        var user = await GetUserProfileAsync(tenant.Id, input.ExternalUserId, cancellationToken);
        var promptTemplate = await dbContext.PromptTemplates
            .FirstOrDefaultAsync(x => x.Id == input.PromptTemplateId && x.TenantId == tenant.Id, cancellationToken)
            ?? throw new InvalidOperationException("Prompt template was not found.");

        var snapshot = await GetLatestContextSnapshotAsync(tenant.Id, user.Id, cancellationToken)
            ?? throw new InvalidOperationException("No context snapshot exists for the user.");

        var utcNow = clock.UtcNow;
        var contextPackage = salesSupportAgentService.BuildContextPackage(
            tenant,
            user,
            snapshot,
            input.SalesObjective,
            utcNow);
        var selectedProvider = string.IsNullOrWhiteSpace(input.ProviderName)
            ? llmClientRegistry.DefaultProviderName
            : input.ProviderName.Trim();

        var promptEnvelope = salesSupportAgentService.BuildPromptEnvelope(
            promptTemplate,
            contextPackage,
            input.ModelName,
            selectedProvider);

        var run = AgentRun.Create(
            tenant.Id,
            user.Id,
            promptTemplate.Id,
            snapshot.Id,
            selectedProvider,
            input.ModelName,
            input.SalesObjective,
            promptEnvelope.InputJson,
            utcNow);
        dbContext.AgentRuns.Add(run);
        dbContext.AuditEvents.Add(CreateAuditEvent(
            tenant.Id,
            currentActorService.GetCurrentActor().Email,
            "agent-run.requested",
            nameof(AgentRun),
            run.Id,
            null,
            JsonSerializer.Serialize(new
            {
                selectedProvider,
                input.ModelName,
                input.SalesObjective,
                snapshotId = snapshot.Id
            }),
            utcNow));
        await dbContext.SaveChangesAsync(cancellationToken);

        run.MarkRunning(1, clock.UtcNow);
        await dbContext.SaveChangesAsync(cancellationToken);

        var generation = await salesSupportAgentService.GenerateAsync(
            promptTemplate,
            contextPackage,
            promptEnvelope,
            selectedProvider,
            cancellationToken);

        if (generation.FailureReason is null)
        {
            run.MarkCompleted(generation.OutputJson, generation.ProvenanceJson, generation.Confidence, generation.AttemptCount, clock.UtcNow);
            dbContext.AuditEvents.Add(CreateAuditEvent(
                tenant.Id,
                "system",
                "agent-run.completed",
                nameof(AgentRun),
                run.Id,
                null,
                JsonSerializer.Serialize(new
                {
                    generation.ProviderName,
                    generation.ModelName,
                    generation.SalesObjective,
                    generation.AttemptCount,
                    generation.HumanReviewRecommended,
                    contextPackage.SnapshotId
                }),
                clock.UtcNow));
        }
        else
        {
            run.MarkFailed(generation.FailureReason, generation.AttemptCount, clock.UtcNow);
            dbContext.AuditEvents.Add(CreateAuditEvent(
                tenant.Id,
                "system",
                "agent-run.failed",
                nameof(AgentRun),
                run.Id,
                null,
                JsonSerializer.Serialize(new
                {
                    generation.ProviderName,
                    generation.ModelName,
                    generation.SalesObjective,
                    generation.AttemptCount,
                    generation.ValidationErrorsJson,
                    generation.FailureReason
                }),
                clock.UtcNow));
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return new AgentRunResult(
            run.Id,
            run.Status,
            generation.ProviderName,
            generation.ModelName,
            generation.SalesObjective,
            run.Confidence,
            generation.AttemptCount,
            generation.HumanReviewRecommended,
            generation.ContextPackageJson,
            run.OutputJson,
            run.ProvenanceJson,
            generation.ValidationErrorsJson,
            run.FailureReason);
    }

    public async Task<SelectorExecutionPreviewResult> PreviewSelectorAsync(PreviewSelectorInput input, CancellationToken cancellationToken)
    {
        await previewSelectorValidator.ValidateAndThrowAsync(input, cancellationToken);
        var tenant = await GetTenantAsync(input.TenantSlug, cancellationToken);
        var user = await GetUserProfileAsync(tenant.Id, input.ExternalUserId, cancellationToken);
        var runtimeContext = input.SelectorDefinitionId.HasValue
            ? await BuildRuntimeContextAsync(tenant, input.SelectorDefinitionId.Value, cancellationToken)
            : await BuildRuntimeContextFromDraftAsync(tenant, input.DraftSelector!, cancellationToken);

        var outcome = await selectorExecutionEngine.ExecuteAsync(runtimeContext, user, SelectorExecutionMode.Preview, cancellationToken);
        return MapPreviewResult(outcome);
    }

    public async Task<SelectorValidationResult> ValidateSelectorAsync(ValidateSelectorInput input, CancellationToken cancellationToken)
    {
        await validateSelectorValidator.ValidateAndThrowAsync(input, cancellationToken);
        var tenant = await GetTenantAsync(input.TenantSlug, cancellationToken);
        var runtimeContext = await BuildRuntimeContextFromDraftAsync(tenant, input.DraftSelector, cancellationToken);
        UserProfile? user = null;
        if (!string.IsNullOrWhiteSpace(input.ExternalUserId))
        {
            user = await GetUserProfileAsync(tenant.Id, input.ExternalUserId, cancellationToken);
        }

        var outcome = await selectorExecutionEngine.ValidateAsync(runtimeContext, user, cancellationToken);
        return new SelectorValidationResult(
            outcome.IsSuccess,
            outcome.ValidationErrors,
            outcome.RawSourceDataJson,
            outcome.NormalizedSourceDataJson,
            outcome.PipelineTraceJson);
    }

    public async Task<ScheduledRecomputeDispatchResult> RunScheduledRecomputeAsync(RunScheduledRecomputeInput input, CancellationToken cancellationToken)
    {
        await runScheduledRecomputeValidator.ValidateAndThrowAsync(input, cancellationToken);
        return await scheduledRecomputeDispatcher.DispatchDueUsersAsync(input.TenantSlug, cancellationToken);
    }

    private async Task<Tenant> GetTenantAsync(string tenantSlug, CancellationToken cancellationToken)
    {
        var normalizedSlug = NormalizeSlug(tenantSlug);
        var actor = currentActorService.GetCurrentActor();
        if (!actor.IsSystem
            && !string.Equals(actor.TenantSlug, normalizedSlug, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Cross-tenant access is not permitted.");
        }

        return await dbContext.Tenants.FirstOrDefaultAsync(x => x.Slug == normalizedSlug, cancellationToken)
            ?? throw new InvalidOperationException($"Tenant '{tenantSlug}' was not found.");
    }

    private async Task<UserProfile> GetUserProfileAsync(Guid tenantId, string externalUserId, CancellationToken cancellationToken)
    {
        return await dbContext.UserProfiles
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.ExternalUserId == externalUserId.Trim(), cancellationToken)
            ?? throw new InvalidOperationException($"User '{externalUserId}' was not found.");
    }

    private async Task<ContextSnapshot?> GetLatestContextSnapshotAsync(Guid tenantId, Guid userProfileId, CancellationToken cancellationToken)
    {
        return await dbContext.ContextSnapshots
            .Include(x => x.Facts)
                .ThenInclude(x => x.SemanticAttributeDefinition)
            .Include(x => x.Facts)
                .ThenInclude(x => x.SourceSelectorDefinition)
            .OrderByDescending(x => x.GeneratedAtUtc)
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.UserProfileId == userProfileId, cancellationToken);
    }

    private async Task<OperationalSourceSummaryResult?> BuildOperationalSourceSummaryAsync(
        string tenantSlug,
        string externalUserId,
        CancellationToken cancellationToken)
    {
        var actor = currentActorService.GetCurrentActor();
        var opsTenant = await customerOpsDbContext.CustomerOpsTenants
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Slug == tenantSlug, cancellationToken);
        if (opsTenant is null)
        {
            return null;
        }

        var contact = await customerOpsDbContext.CustomerContacts
            .AsNoTracking()
            .Include(x => x.Account)
            .FirstOrDefaultAsync(
                x => x.CustomerOpsTenantId == opsTenant.Id && x.ExternalUserId == externalUserId,
                cancellationToken);
        if (contact is null)
        {
            return null;
        }

        var accountId = contact.CustomerAccountId;
        var latestSubscription = await customerOpsDbContext.CustomerSubscriptions
            .AsNoTracking()
            .Include(x => x.ProductPlan)
            .Where(x => x.CustomerOpsTenantId == opsTenant.Id && x.CustomerAccountId == accountId)
            .OrderByDescending(x => x.UpdatedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
        var latestBilling = await customerOpsDbContext.BillingMetrics
            .AsNoTracking()
            .Where(x => x.CustomerOpsTenantId == opsTenant.Id && x.CustomerAccountId == accountId)
            .OrderByDescending(x => x.MetricDateUtc)
            .FirstOrDefaultAsync(cancellationToken);
        var latestUsage = await customerOpsDbContext.ProductUsageSummaries
            .AsNoTracking()
            .Where(x => x.CustomerOpsTenantId == opsTenant.Id && x.CustomerContactId == contact.Id)
            .OrderByDescending(x => x.SummaryDateUtc)
            .FirstOrDefaultAsync(cancellationToken);
        var openOpportunities = await customerOpsDbContext.SalesOpportunities.CountAsync(
            x => x.CustomerOpsTenantId == opsTenant.Id && x.CustomerAccountId == accountId && x.IsOpen,
            cancellationToken);
        var openSupportTickets = await customerOpsDbContext.SupportTickets.CountAsync(
            x => x.CustomerOpsTenantId == opsTenant.Id
                && x.CustomerAccountId == accountId
                && x.Status != "resolved"
                && x.Status != "closed",
            cancellationToken);
        var pricingPageVisits30d = await customerOpsDbContext.WebConversionEvents.CountAsync(
            x => x.CustomerOpsTenantId == opsTenant.Id
                && x.CustomerContactId == contact.Id
                && x.Page == "pricing"
                && x.OccurredAtUtc >= clock.UtcNow.AddDays(-30),
            cancellationToken);
        var emailReplies30d = await customerOpsDbContext.EmailEngagementEvents.CountAsync(
            x => x.CustomerOpsTenantId == opsTenant.Id
                && x.CustomerContactId == contact.Id
                && (x.EventType == "reply" || x.EventType == "meeting_booked")
                && x.OccurredAtUtc >= clock.UtcNow.AddDays(-30),
            cancellationToken);

        var recentActivities = await customerOpsDbContext.SalesActivities
            .AsNoTracking()
            .Where(x => x.CustomerOpsTenantId == opsTenant.Id && x.CustomerAccountId == accountId)
            .OrderByDescending(x => x.OccurredAtUtc)
            .Take(3)
            .Select(x => new OperationalTimelineEventResult("sales-activity", x.Summary, x.OccurredAtUtc))
            .ToListAsync(cancellationToken);
        var recentSupport = await customerOpsDbContext.SupportTickets
            .AsNoTracking()
            .Where(x => x.CustomerOpsTenantId == opsTenant.Id && x.CustomerAccountId == accountId)
            .OrderByDescending(x => x.OpenedAtUtc)
            .Take(2)
            .Select(x => new OperationalTimelineEventResult("support-ticket", $"{x.Severity}: {x.Subject}", x.OpenedAtUtc))
            .ToListAsync(cancellationToken);
        var recentConversions = await customerOpsDbContext.WebConversionEvents
            .AsNoTracking()
            .Where(x => x.CustomerOpsTenantId == opsTenant.Id && x.CustomerContactId == contact.Id)
            .OrderByDescending(x => x.OccurredAtUtc)
            .Take(3)
            .Select(x => new OperationalTimelineEventResult("web-conversion", $"{x.EventType} on {x.Page}", x.OccurredAtUtc))
            .ToListAsync(cancellationToken);

        var highlights = new List<OperationalHighlightResult>
        {
            new("Open opportunities", openOpportunities.ToString(), "Open pipeline attached to the account in customer_ops_db."),
            new("Pricing visits (30d)", pricingPageVisits30d.ToString(), "Repeated pricing page visits often correlate with commercial intent."),
            new("Email replies (30d)", emailReplies30d.ToString(), "Recent replies reinforce channel fit and rep timing."),
            new("Active days (30d)", latestUsage?.ActiveDays30.ToString() ?? "0", "Usage recency helps estimate urgency, fit, and expansion potential."),
            new("Open support tickets", openSupportTickets.ToString(), "Unresolved tickets can reduce readiness and raise human-review needs.")
        };

        var contactEmail = actor.CanViewSensitivePii ? contact.Email : MaskEmail(contact.Email);

        var rawSummaryJson = JsonSerializer.Serialize(new
        {
            account = new
            {
                contact.Account.ExternalAccountId,
                contact.Account.Name,
                contact.Account.Domain,
                contact.Account.Industry,
                contact.Account.Region,
                contact.Account.Segment,
                contact.Account.LifecycleStage,
                contact.Account.AccountOwner,
                contact.Account.EmployeeCount,
                contact.Account.AnnualRevenue
            },
            contact = new
            {
                contact.ExternalContactId,
                contact.ExternalUserId,
                contact.FullName,
                Email = contactEmail,
                contact.JobTitle,
                contact.Seniority,
                contact.Department,
                contact.PreferredChannel,
                contact.IsDecisionMaker
            },
            subscription = latestSubscription is null
                ? null
                : new
                {
                    latestSubscription.ExternalSubscriptionId,
                    latestSubscription.Status,
                    latestSubscription.SeatsPurchased,
                    latestSubscription.MonthlyRecurringRevenue,
                    latestSubscription.StartedAtUtc,
                    latestSubscription.TrialEndsAtUtc,
                    latestSubscription.RenewalAtUtc,
                    activePlan = latestSubscription.ProductPlan.Name,
                    latestSubscription.ProductPlan.Tier
                },
            billing = latestBilling,
            latestUsage,
            counters = new
            {
                openOpportunities,
                openSupportTickets,
                pricingPageVisits30d,
                emailReplies30d
            }
        });

        return new OperationalSourceSummaryResult(
            contact.Account.ExternalAccountId,
            contact.Account.Name,
            contact.Account.Domain,
            contact.Account.Industry,
            contact.Account.Region,
            contact.Account.LifecycleStage,
            latestSubscription?.ProductPlan.Name ?? "No active plan",
            latestSubscription?.Status ?? "none",
            latestBilling?.MonthlyRecurringRevenue ?? latestSubscription?.MonthlyRecurringRevenue ?? 0m,
            openOpportunities,
            openSupportTickets,
            pricingPageVisits30d,
            latestUsage?.ActiveDays30 ?? 0,
            emailReplies30d,
            highlights,
            recentActivities
                .Concat(recentSupport)
                .Concat(recentConversions)
                .OrderByDescending(x => x.OccurredAtUtc)
                .Take(8)
                .ToList(),
            rawSummaryJson);
    }

    private async Task<SelectorRuntimeContext> BuildRuntimeContextAsync(Tenant tenant, Guid selectorDefinitionId, CancellationToken cancellationToken)
    {
        var selector = await dbContext.SelectorDefinitions
            .Include(x => x.DataSource)
            .Include(x => x.TargetAttributeDefinition)
            .FirstOrDefaultAsync(x => x.Id == selectorDefinitionId && x.TenantId == tenant.Id, cancellationToken)
            ?? throw new InvalidOperationException($"Selector '{selectorDefinitionId}' was not found.");
        var dataSource = selector.DataSource ?? throw new InvalidOperationException($"Selector '{selector.Name}' does not reference a data source.");
        return new SelectorRuntimeContext(selector, dataSource, selector.TargetAttributeDefinition);
    }

    private async Task<SelectorRuntimeContext> BuildRuntimeContextFromDraftAsync(
        Tenant tenant,
        UpsertSelectorDefinitionInput draftSelector,
        CancellationToken cancellationToken)
    {
        if (!string.Equals(tenant.Slug, NormalizeSlug(draftSelector.TenantSlug), StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Draft selector tenant slug does not match the target tenant.");
        }

        var targetAttribute = await dbContext.SemanticAttributeDefinitions
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == draftSelector.TargetAttributeDefinitionId && x.TenantId == tenant.Id, cancellationToken)
            ?? throw new InvalidOperationException("Draft selector target attribute does not exist in the tenant.");

        var dataSource = draftSelector.DataSourceId.HasValue
            ? await dbContext.DataSources.AsNoTracking().FirstOrDefaultAsync(x => x.Id == draftSelector.DataSourceId && x.TenantId == tenant.Id, cancellationToken)
            : null;

        if (dataSource is null)
        {
            throw new InvalidOperationException("Draft selectors require a data source.");
        }

        var selector = SelectorDefinition.Create(
            tenant.Id,
            draftSelector.DataSourceId,
            draftSelector.TargetAttributeDefinitionId,
            draftSelector.Name,
            draftSelector.Description,
            draftSelector.MappingKind,
            draftSelector.ExpressionJson,
            draftSelector.ExplanationTemplate,
            draftSelector.ValidationSchemaJson,
            draftSelector.DefaultConfidence,
            draftSelector.FreshnessWindowMinutes,
            draftSelector.Priority,
            draftSelector.ScheduleIntervalMinutes,
            clock.UtcNow);

        return new SelectorRuntimeContext(selector, dataSource, targetAttribute);
    }

    private static string NormalizeSlug(string tenantSlug) => tenantSlug.Trim().ToLowerInvariant();

    private static SelectorExecutionPreviewResult MapPreviewResult(SelectorPipelineOutcome outcome)
    {
        return new SelectorExecutionPreviewResult(
            outcome.Mode,
            outcome.IsSuccess,
            outcome.SelectorName,
            outcome.RawSourceDataJson,
            outcome.NormalizedSourceDataJson,
            outcome.ValidationErrors,
            outcome.CandidateFact?.ValueJson,
            outcome.CandidateFact?.ValueType,
            outcome.CandidateFact?.Confidence,
            outcome.CandidateFact?.ObservedAtUtc,
            outcome.CandidateFact?.FreshUntilUtc,
            outcome.CandidateFact?.Explanation,
            outcome.CandidateFact?.ProvenanceJson,
            outcome.PipelineTraceJson);
    }

    private static AuditEvent CreateAuditEvent(
        Guid? tenantId,
        string actor,
        string action,
        string entityType,
        Guid entityId,
        string? beforeJson,
        string? afterJson,
        DateTime utcNow)
    {
        return AuditEvent.Create(tenantId, actor, action, entityType, entityId.ToString("D"), Guid.NewGuid().ToString("N"), "{}", beforeJson, afterJson, utcNow);
    }

    private async Task WriteReadAuditAsync(
        Guid tenantId,
        ActorContext actor,
        string action,
        string entityType,
        Guid entityId,
        object metadata,
        CancellationToken cancellationToken)
    {
        dbContext.AuditEvents.Add(CreateAuditEvent(
            tenantId,
            actor.Email,
            action,
            entityType,
            entityId,
            null,
            JsonSerializer.Serialize(metadata),
            clock.UtcNow));
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static string MaskEmail(string email)
    {
        var separatorIndex = email.IndexOf('@');
        if (separatorIndex <= 1)
        {
            return "***";
        }

        var local = email[..separatorIndex];
        var domain = email[separatorIndex..];
        return $"{local[0]}***{domain}";
    }

    private static readonly JsonSerializerOptions AuditSerializerOptions = new()
    {
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = false
    };

    private static string Serialize<T>(T instance) => JsonSerializer.Serialize(instance, AuditSerializerOptions);
}
