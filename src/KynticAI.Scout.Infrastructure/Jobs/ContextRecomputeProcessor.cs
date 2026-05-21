using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Domain.Constants;
using KynticAI.Scout.Domain.Entities;
using KynticAI.Scout.Domain.Enums;
using KynticAI.Scout.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace KynticAI.Scout.Infrastructure.Jobs;

internal sealed class ContextRecomputeProcessor(
    ScoutDbContext dbContext,
    IClock clock,
    ISelectorExecutionEngine selectorExecutionEngine,
    ILogger<ContextRecomputeProcessor> logger)
{
    public async Task ProcessAsync(ContextRecomputeRequest request, CancellationToken cancellationToken)
    {
        var tenant = await dbContext.Tenants.FirstAsync(x => x.Id == request.TenantId, cancellationToken);
        var user = await dbContext.UserProfiles.FirstAsync(x => x.Id == request.UserProfileId, cancellationToken);
        var recomputeJob = await dbContext.RecomputeJobs
            .FirstOrDefaultAsync(x => x.TenantId == request.TenantId && x.CorrelationId == request.CorrelationId, cancellationToken);
        recomputeJob?.MarkRunning(clock.UtcNow);
        if (recomputeJob is not null)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var executions = await dbContext.SelectorExecutions
            .Include(x => x.SelectorDefinition)
                .ThenInclude(x => x.TargetAttributeDefinition)
            .Include(x => x.SelectorDefinition)
                .ThenInclude(x => x.DataSource)
            .Where(x => request.SelectorExecutionIds.Contains(x.Id))
            .OrderBy(x => x.RequestedAtUtc)
            .ToListAsync(cancellationToken);

        var successfulFacts = new List<SelectorCandidateFact>();
        foreach (var execution in executions)
        {
            execution.MarkRunning(clock.UtcNow);
            await dbContext.SaveChangesAsync(cancellationToken);

            var selector = execution.SelectorDefinition;
            var dataSource = selector.DataSource;
            if (dataSource is null)
            {
                execution.MarkFailed(
                    $"Selector '{selector.Name}' does not reference a data source.",
                    "{}",
                    "[]",
                    JsonSerializer.Serialize(new { selector = selector.Name, error = "Missing data source." }),
                    clock.UtcNow);
                await dbContext.SaveChangesAsync(cancellationToken);
                continue;
            }

            var runtimeContext = new SelectorRuntimeContext(selector, dataSource, selector.TargetAttributeDefinition);
            var outcome = await selectorExecutionEngine.ExecuteAsync(runtimeContext, user, execution.ExecutionMode, cancellationToken);
            if (outcome.IsSuccess && outcome.CandidateFact is { } candidateFact)
            {
                execution.MarkSucceeded(
                    candidateFact.ValueJson,
                    candidateFact.ValueType,
                    candidateFact.Confidence,
                    candidateFact.ObservedAtUtc,
                    candidateFact.Explanation,
                    candidateFact.ProvenanceJson,
                    candidateFact.RawSourceDataJson,
                    candidateFact.ValidationErrorsJson,
                    candidateFact.PipelineTraceJson,
                    clock.UtcNow);
                successfulFacts.Add(candidateFact);
                dbContext.ProvenanceMetadata.Add(CreateProvenanceRecord(
                    tenant.Id,
                    execution.Id,
                    null,
                    "selector-execution",
                    candidateFact.AttributeKey,
                    candidateFact.ObservedAtUtc,
                    candidateFact.ProvenanceJson));
            }
            else
            {
                var errorMessage = outcome.ValidationErrors.Count > 0
                    ? string.Join("; ", outcome.ValidationErrors)
                    : $"Selector '{selector.Name}' did not produce a value.";
                execution.MarkFailed(
                    errorMessage,
                    outcome.RawSourceDataJson,
                    JsonSerializer.Serialize(outcome.ValidationErrors),
                    outcome.PipelineTraceJson,
                    clock.UtcNow);
                logger.LogWarning("Selector {SelectorId} failed for user {ExternalUserId}: {ErrorMessage}", execution.SelectorDefinitionId, user.ExternalUserId, errorMessage);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
        }

        if (successfulFacts.Count == 0)
        {
            recomputeJob?.MarkFailed(
                "No selectors produced facts.",
                JsonSerializer.Serialize(new { request.CorrelationId, request.UserProfileId }),
                clock.UtcNow);
            dbContext.AuditEvents.Add(AuditEvent.Create(
                tenant.Id,
                "system",
                "context.recompute.failed",
                nameof(UserProfile),
                user.Id.ToString("D"),
                request.CorrelationId,
                JsonSerializer.Serialize(new { reason = "No selectors produced facts." }),
                null,
                null,
                clock.UtcNow));
            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        var resolvedFacts = ResolveConflicts(successfulFacts);
        var previousSnapshot = await dbContext.ContextSnapshots
            .Where(x => x.TenantId == tenant.Id && x.UserProfileId == user.Id && !x.IsStale)
            .OrderByDescending(x => x.GeneratedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

        if (previousSnapshot is not null)
        {
            previousSnapshot.MarkStale(clock.UtcNow);
        }

        var snapshot = ContextSnapshot.Create(
            tenant.Id,
            user.Id,
            (previousSnapshot?.SnapshotVersion ?? 0) + 1,
            BuildSummary(resolvedFacts),
            Math.Round(resolvedFacts.Average(x => x.Confidence), 4),
            clock.UtcNow);

        if (resolvedFacts.Any(x => x.FreshUntilUtc.HasValue && x.FreshUntilUtc.Value < clock.UtcNow))
        {
            snapshot.MarkStale(clock.UtcNow);
        }

        dbContext.ContextSnapshots.Add(snapshot);
        foreach (var fact in resolvedFacts)
        {
            var contextFact = ContextFact.Create(
                tenant.Id,
                snapshot.Id,
                fact.AttributeDefinitionId,
                fact.SelectorDefinitionId,
                fact.AttributeKey,
                fact.ValueJson,
                fact.ValueType,
                fact.Confidence,
                fact.ObservedAtUtc,
                fact.FreshUntilUtc,
                fact.Explanation,
                fact.ProvenanceJson,
                clock.UtcNow);
            dbContext.ContextFacts.Add(contextFact);
            dbContext.ProvenanceMetadata.Add(CreateProvenanceRecord(
                tenant.Id,
                null,
                contextFact.Id,
                "context-fact",
                fact.AttributeKey,
                fact.ObservedAtUtc,
                fact.ProvenanceJson));
        }

        recomputeJob?.MarkCompleted(
            snapshot.Summary,
            JsonSerializer.Serialize(new
            {
                snapshotId = snapshot.Id,
                snapshotVersion = snapshot.SnapshotVersion,
                factCount = resolvedFacts.Count
            }),
            clock.UtcNow);
        dbContext.AuditEvents.Add(AuditEvent.Create(
            tenant.Id,
            "system",
            "context.recompute.completed",
            nameof(ContextSnapshot),
            snapshot.Id.ToString("D"),
            request.CorrelationId,
            JsonSerializer.Serialize(new
            {
                tenant = tenant.Slug,
                user = user.ExternalUserId,
                snapshotVersion = snapshot.SnapshotVersion,
                factCount = resolvedFacts.Count
            }),
            null,
            JsonSerializer.Serialize(new { snapshot.Summary, snapshot.OverallConfidence, snapshot.IsStale }),
            clock.UtcNow));

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static ProvenanceMetadata CreateProvenanceRecord(
        Guid tenantId,
        Guid? selectorExecutionId,
        Guid? contextFactId,
        string kind,
        string sourceRecordKey,
        DateTime observedAtUtc,
        string provenanceJson)
    {
        var sourceSystem = "unknown";
        if (JsonNode.Parse(provenanceJson) is JsonObject provenanceObject)
        {
            sourceSystem =
                provenanceObject["connectorType"]?.GetValue<string>()
                ?? provenanceObject["source"]?["source"]?.GetValue<string>()
                ?? provenanceObject["source"]?.AsArray().FirstOrDefault()?["source"]?.GetValue<string>()
                ?? provenanceObject["selector"]?["name"]?.GetValue<string>()
                ?? sourceSystem;
        }

        return ProvenanceMetadata.Create(
            tenantId,
            selectorExecutionId,
            contextFactId,
            kind,
            sourceSystem,
            sourceRecordKey,
            provenanceJson,
            observedAtUtc,
            observedAtUtc);
    }

    private static IReadOnlyList<SelectorCandidateFact> ResolveConflicts(IReadOnlyList<SelectorCandidateFact> candidates)
    {
        var resolved = new List<SelectorCandidateFact>();
        foreach (var attributeGroup in candidates.GroupBy(x => x.AttributeKey, StringComparer.OrdinalIgnoreCase))
        {
            var ordered = attributeGroup
                .OrderByDescending(x => x.Priority)
                .ThenByDescending(x => x.Confidence)
                .ThenByDescending(x => x.ObservedAtUtc)
                .ToList();

            var winner = ordered[0];
            if (ordered.Count > 1)
            {
                winner = winner with
                {
                    ProvenanceJson = AppendConflictResolution(winner.ProvenanceJson, ordered)
                };
            }

            resolved.Add(winner);
        }

        return resolved;
    }

    private static string AppendConflictResolution(string provenanceJson, IReadOnlyList<SelectorCandidateFact> candidates)
    {
        var provenance = JsonNode.Parse(provenanceJson) as JsonObject ?? new JsonObject();
        provenance["conflictResolution"] = JsonSerializer.SerializeToNode(new
        {
            strategy = "priority-confidence-observedAt",
            chosenSelectorDefinitionId = candidates[0].SelectorDefinitionId,
            competingSelectors = candidates.Skip(1).Select(candidate => new
            {
                candidate.SelectorDefinitionId,
                candidate.Confidence,
                candidate.Priority,
                candidate.ObservedAtUtc,
                candidate.ValueJson
            })
        });
        return provenance.ToJsonString();
    }

    private static string BuildSummary(IReadOnlyCollection<SelectorCandidateFact> facts)
    {
        var lookup = facts.ToDictionary(x => x.AttributeKey, StringComparer.OrdinalIgnoreCase);
        var segments = new List<string>();

        if (lookup.TryGetValue(SemanticAttributeKeys.ConversionProbability, out var conversion))
        {
            segments.Add($"{ExtractDisplayValue(conversion.ValueJson)}% conversion probability");
        }

        if (lookup.TryGetValue(SemanticAttributeKeys.PreferredChannel, out var channel))
        {
            segments.Add($"prefers {ExtractDisplayValue(channel.ValueJson)}");
        }

        if (lookup.TryGetValue(SemanticAttributeKeys.PlanInterest, out var planInterest))
        {
            var planValue = ExtractDisplayValue(planInterest.ValueJson);
            if (!string.IsNullOrWhiteSpace(planValue))
            {
                segments.Add($"interested in {char.ToUpperInvariant(planValue[0]) + planValue[1..]} plans");
            }
        }

        if (lookup.TryGetValue(SemanticAttributeKeys.ChurnRisk, out var churnRisk))
        {
            segments.Add($"{ExtractDisplayValue(churnRisk.ValueJson)}% churn risk");
        }

        if (lookup.TryGetValue(SemanticAttributeKeys.EngagementLevel, out var engagement))
        {
            segments.Add($"recent engagement {ExtractDisplayValue(engagement.ValueJson)}");
        }

        if (lookup.TryGetValue(SemanticAttributeKeys.ExpansionPotential, out var expansionPotential))
        {
            segments.Add($"{ExtractDisplayValue(expansionPotential.ValueJson)}% expansion potential");
        }

        if (lookup.TryGetValue(SemanticAttributeKeys.SalesUrgency, out var salesUrgency))
        {
            segments.Add($"sales urgency {ExtractDisplayValue(salesUrgency.ValueJson)}");
        }

        return string.Join(", ", segments);
    }

    private static string ExtractDisplayValue(string valueJson)
    {
        using var document = JsonDocument.Parse(valueJson);
        return document.RootElement.ValueKind switch
        {
            JsonValueKind.String => document.RootElement.GetString() ?? string.Empty,
            JsonValueKind.Number => document.RootElement.GetDecimal().ToString("0.##", CultureInfo.InvariantCulture),
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            _ => document.RootElement.GetRawText()
        };
    }
}
