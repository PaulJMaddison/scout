using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Application.Contracts;
using KynticAI.Scout.Domain.Entities;
using KynticAI.Scout.Domain.Enums;
using KynticAI.Scout.Domain.Saas;
using Microsoft.EntityFrameworkCore;

namespace KynticAI.Scout.Application.Services;

public sealed class BlueprintImportService(
    IScoutDbContext dbContext,
    IClock clock,
    ICurrentActorService currentActorService,
    IBillingEnforcementService billingEnforcementService,
    IUsageMeteringService usageMeteringService)
    : IBlueprintImportService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false
    };

    public async Task<BlueprintImportResult> UploadAsync(UploadBlueprintInput input, CancellationToken cancellationToken)
    {
        var tenant = await GetTenantAsync(input.TenantSlug, cancellationToken);
        var workspace = await ResolveWorkspaceAsync(tenant.Id, input.WorkspaceSlug, cancellationToken);
        var actor = currentActorService.GetCurrentActor();
        var utcNow = clock.UtcNow;
        var blueprintName = TryReadString(input.BlueprintJson, "name") ?? input.Name ?? "Scout Blueprint";
        var import = BlueprintImport.Create(
            tenant.Id,
            workspace?.Id,
            input.Name ?? blueprintName,
            input.BlueprintJson,
            Hash(input.BlueprintJson),
            actor.Email,
            utcNow);

        dbContext.BlueprintImports.Add(import);
        dbContext.AuditEvents.Add(AuditEvent.Create(
            tenant.Id,
            actor.Email,
            "blueprint.uploaded",
            nameof(BlueprintImport),
            import.Id.ToString("D"),
            Guid.NewGuid().ToString("N"),
            JsonSerializer.Serialize(new { import.Name, workspaceSlug = workspace?.Slug }),
            null,
            null,
            utcNow));
        await dbContext.SaveChangesAsync(cancellationToken);

        return BuildResult(import.Id, "Uploaded", false, blueprintName, [new("$.blueprint", "Blueprint uploaded. Run validation before importing.", "info", null, null)], [], [], [], [], [], [], []);
    }

    public async Task<BlueprintImportResult> ValidateAsync(BlueprintImportInput input, CancellationToken cancellationToken)
    {
        var context = await ResolveContextAsync(input, cancellationToken);
        var evaluation = await EvaluateAsync(context.Tenant.Id, context.BlueprintJson, cancellationToken);
        var utcNow = clock.UtcNow;
        if (context.Import is not null)
        {
            if (evaluation.Issues.Any(static issue => issue.Severity == "error"))
            {
                context.Import.MarkRejected(Serialize(evaluation.Issues), Serialize(evaluation.Preview), utcNow);
                AddAudit(context.Tenant.Id, "blueprint.rejected", context.Import.Id, evaluation.Issues.Count);
            }
            else
            {
                context.Import.MarkValidated(Serialize(evaluation.Issues), Serialize(evaluation.Preview), utcNow);
                AddAudit(context.Tenant.Id, "blueprint.validated", context.Import.Id, evaluation.Issues.Count);
            }

            await dbContext.SaveChangesAsync(cancellationToken);
        }
        else
        {
            AddAudit(context.Tenant.Id, evaluation.IsValid ? "blueprint.validated" : "blueprint.rejected", Hash(context.BlueprintJson), evaluation.Issues.Count);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return BuildResult(context.Import?.Id, evaluation.IsValid ? "Validated" : "Rejected", evaluation.IsValid, evaluation.BlueprintName, evaluation.Issues, evaluation.Preview, [], [], [], [], [], []);
    }

    public async Task<BlueprintImportResult> PreviewAsync(BlueprintImportInput input, CancellationToken cancellationToken)
    {
        var context = await ResolveContextAsync(input, cancellationToken);
        var evaluation = await EvaluateAsync(context.Tenant.Id, context.BlueprintJson, cancellationToken);
        return BuildResult(context.Import?.Id, evaluation.IsValid ? "PreviewReady" : "Rejected", evaluation.IsValid, evaluation.BlueprintName, evaluation.Issues, evaluation.Preview, [], [], [], [], [], []);
    }

    public async Task<BlueprintImportResult> ImportAsync(BlueprintImportInput input, CancellationToken cancellationToken)
    {
        var context = await ResolveContextAsync(input, cancellationToken);
        var evaluation = await EvaluateAsync(context.Tenant.Id, context.BlueprintJson, cancellationToken);
        var utcNow = clock.UtcNow;
        if (!evaluation.IsValid || evaluation.Blueprint is null)
        {
            if (context.Import is not null)
            {
                context.Import.MarkRejected(Serialize(evaluation.Issues), Serialize(evaluation.Preview), utcNow);
                AddAudit(context.Tenant.Id, "blueprint.rejected", context.Import.Id, evaluation.Issues.Count);
                await dbContext.SaveChangesAsync(cancellationToken);
            }
            else
            {
                AddAudit(context.Tenant.Id, "blueprint.rejected", Hash(context.BlueprintJson), evaluation.Issues.Count);
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            return BuildResult(context.Import?.Id, "Rejected", false, evaluation.BlueprintName, evaluation.Issues, evaluation.Preview, [], [], [], [], [], []);
        }

        await billingEnforcementService.EnsureWithinLimitAsync(context.Tenant.Id, BillingLimitMetric.BlueprintImports, 1, cancellationToken, context.WorkspaceId);
        var dataSources = await dbContext.DataSources.Where(x => x.TenantId == context.Tenant.Id).ToListAsync(cancellationToken);
        var attributes = await dbContext.SemanticAttributeDefinitions.Where(x => x.TenantId == context.Tenant.Id).ToListAsync(cancellationToken);
        var selectors = await dbContext.SelectorDefinitions.Where(x => x.TenantId == context.Tenant.Id).ToListAsync(cancellationToken);
        var prompts = await dbContext.PromptTemplates.Where(x => x.TenantId == context.Tenant.Id).ToListAsync(cancellationToken);
        var piiRules = await dbContext.PiiRules.Where(x => x.TenantId == context.Tenant.Id).ToListAsync(cancellationToken);
        var auditPolicies = await dbContext.AuditPolicies.Where(x => x.TenantId == context.Tenant.Id).ToListAsync(cancellationToken);
        var importId = context.Import?.Id;
        var changedSources = new List<string>();
        var changedAttributes = new List<string>();
        var changedSelectors = new List<string>();
        var changedPrompts = new List<string>();
        var changedPiiRules = new List<string>();
        var changedAuditPolicies = new List<string>();

        foreach (var source in evaluation.Blueprint.DataSources)
        {
            var existing = dataSources.FirstOrDefault(x => string.Equals(x.Name, source.Name, StringComparison.OrdinalIgnoreCase));
            var configJson = Serialize(source.ConnectionConfig);
            if (existing is null)
            {
                existing = DataSource.Create(context.Tenant.Id, source.Name, source.Description, source.Kind, configJson, utcNow);
                dbContext.DataSources.Add(existing);
                dataSources.Add(existing);
            }
            else
            {
                existing.Update(source.Name, source.Description, source.Kind, configJson, utcNow);
            }

            changedSources.Add(source.Name);
        }

        foreach (var attribute in evaluation.Blueprint.SemanticAttributes)
        {
            var existing = attributes.FirstOrDefault(x => string.Equals(x.Key, attribute.Key, StringComparison.OrdinalIgnoreCase));
            if (existing is null)
            {
                existing = SemanticAttributeDefinition.Create(context.Tenant.Id, attribute.Key, attribute.DisplayName, attribute.Description, attribute.DataType, attribute.ExampleValueJson, attribute.IsSystem, utcNow);
                dbContext.SemanticAttributeDefinitions.Add(existing);
                attributes.Add(existing);
            }
            else
            {
                existing.Update(attribute.DisplayName, attribute.Description, attribute.DataType, attribute.ExampleValueJson, utcNow);
            }

            changedAttributes.Add(attribute.Key);
        }

        foreach (var prompt in evaluation.Blueprint.PromptTemplates)
        {
            var existing = prompts.FirstOrDefault(x => string.Equals(x.Name, prompt.Name, StringComparison.OrdinalIgnoreCase));
            if (existing is null)
            {
                existing = PromptTemplate.Create(context.Tenant.Id, prompt.Name, prompt.Description, prompt.SystemPrompt, prompt.DeveloperPrompt, prompt.UserPromptTemplate, Serialize(prompt.OutputSchema), Serialize(prompt.Guardrails), utcNow);
                dbContext.PromptTemplates.Add(existing);
                prompts.Add(existing);
            }
            else
            {
                existing.Update(prompt.Name, prompt.Description, prompt.SystemPrompt, prompt.DeveloperPrompt, prompt.UserPromptTemplate, Serialize(prompt.OutputSchema), Serialize(prompt.Guardrails), utcNow);
            }

            changedPrompts.Add(prompt.Name);
        }

        foreach (var selector in evaluation.Blueprint.Selectors)
        {
            var attribute = attributes.First(x => string.Equals(x.Key, selector.TargetAttributeKey, StringComparison.OrdinalIgnoreCase));
            var source = dataSources.First(x => string.Equals(x.Name, selector.DataSourceName, StringComparison.OrdinalIgnoreCase));
            var existing = selectors.FirstOrDefault(x => string.Equals(x.Name, selector.Name, StringComparison.OrdinalIgnoreCase));
            if (existing is null)
            {
                existing = SelectorDefinition.Create(context.Tenant.Id, source.Id, attribute.Id, selector.Name, selector.Description, selector.MappingKind, Serialize(selector.Expression), selector.ExplanationTemplate, Serialize(selector.ValidationSchema), selector.DefaultConfidence, selector.FreshnessWindowMinutes, selector.Priority, selector.ScheduleIntervalMinutes, utcNow);
                dbContext.SelectorDefinitions.Add(existing);
                selectors.Add(existing);
            }
            else
            {
                existing.Update(source.Id, attribute.Id, selector.Name, selector.Description, selector.MappingKind, Serialize(selector.Expression), selector.ExplanationTemplate, Serialize(selector.ValidationSchema), selector.DefaultConfidence, selector.FreshnessWindowMinutes, selector.Priority, selector.ScheduleIntervalMinutes, utcNow);
            }

            if (selector.Publish)
            {
                existing.Publish(utcNow);
            }

            changedSelectors.Add(selector.Name);
        }

        foreach (var rule in evaluation.Blueprint.PiiRules)
        {
            var existing = piiRules.FirstOrDefault(x => string.Equals(x.Key, rule.Key, StringComparison.OrdinalIgnoreCase));
            if (existing is null)
            {
                existing = PiiRule.Create(context.Tenant.Id, importId, rule.Key, rule.DisplayName, rule.Description, Serialize(rule.Rule), utcNow);
                dbContext.PiiRules.Add(existing);
                piiRules.Add(existing);
            }
            else
            {
                existing.Update(importId, rule.DisplayName, rule.Description, Serialize(rule.Rule), utcNow);
            }

            changedPiiRules.Add(rule.Key);
        }

        foreach (var policy in evaluation.Blueprint.AuditPolicies)
        {
            var existing = auditPolicies.FirstOrDefault(x => string.Equals(x.Key, policy.Key, StringComparison.OrdinalIgnoreCase));
            if (existing is null)
            {
                existing = AuditPolicy.Create(context.Tenant.Id, importId, policy.Key, policy.DisplayName, policy.Description, Serialize(policy.Policy), utcNow);
                dbContext.AuditPolicies.Add(existing);
                auditPolicies.Add(existing);
            }
            else
            {
                existing.Update(importId, policy.DisplayName, policy.Description, Serialize(policy.Policy), utcNow);
            }

            changedAuditPolicies.Add(policy.Key);
        }

        var summary = new BlueprintImportSummaryResult(changedSources.Count, changedAttributes.Count, changedSelectors.Count, changedPrompts.Count, changedPiiRules.Count, changedAuditPolicies.Count);
        if (context.Import is not null)
        {
            context.Import.MarkImported(Serialize(evaluation.Issues), Serialize(evaluation.Preview), Serialize(summary), utcNow);
            AddAudit(context.Tenant.Id, "blueprint.imported", context.Import.Id, evaluation.Preview.Count);
        }
        await usageMeteringService.RecordAsync(
            new UsageRecordInput(
                context.Tenant.Id,
                context.WorkspaceId,
                BillingUsageMetric.BlueprintImported,
                1,
                "blueprint-import",
                new { importId, blueprintName = evaluation.BlueprintName, selectorCount = changedSelectors.Count }),
            cancellationToken,
            saveImmediately: false);

        await dbContext.SaveChangesAsync(cancellationToken);
        return BuildResult(context.Import?.Id, "Imported", true, evaluation.BlueprintName, evaluation.Issues, evaluation.Preview, changedSources, changedAttributes, changedSelectors, changedPrompts, changedPiiRules, changedAuditPolicies);
    }

    private async Task<BlueprintEvaluation> EvaluateAsync(Guid tenantId, string blueprintJson, CancellationToken cancellationToken)
    {
        var issues = new List<BlueprintValidationIssueResult>();
        BlueprintDocument? blueprint = null;
        try
        {
            using var document = JsonDocument.Parse(blueprintJson);
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                issues.Add(Error("$", "Blueprint root must be a JSON object."));
            }
            else
            {
                blueprint = ParseBlueprint(document.RootElement, issues);
            }
        }
        catch (JsonException exception)
        {
            issues.Add(new BlueprintValidationIssueResult("$", exception.Message, "error", exception.LineNumber, exception.BytePositionInLine));
        }

        if (blueprint is null || issues.Any(static issue => issue.Severity == "error"))
        {
            return new BlueprintEvaluation(blueprint?.Name ?? "Invalid blueprint", false, blueprint, issues, []);
        }

        var preview = await BuildPreviewAsync(tenantId, blueprint, cancellationToken);
        return new BlueprintEvaluation(blueprint.Name, true, blueprint, issues, preview);
    }

    private static BlueprintDocument? ParseBlueprint(JsonElement root, List<BlueprintValidationIssueResult> issues)
    {
        var name = RequiredString(root, "name", "$.name", issues);
        var version = RequiredString(root, "version", "$.version", issues);
        var tenantSlug = OptionalString(root, "tenantSlug") ?? string.Empty;
        var dataSources = ParseArray(root, "dataSources", "$.dataSources", issues, ParseDataSource);
        var attributes = ParseArray(root, "semanticAttributes", "$.semanticAttributes", issues, ParseAttribute);
        var selectors = ParseArray(root, "selectors", "$.selectors", issues, ParseSelector);
        var prompts = ParseArray(root, "promptTemplates", "$.promptTemplates", issues, ParsePrompt);
        var piiRules = ParseArray(root, "piiRules", "$.piiRules", issues, ParsePiiRule);
        var auditPolicies = ParseArray(root, "auditPolicies", "$.auditPolicies", issues, ParseAuditPolicy);

        AddDuplicateIssues(dataSources.Select(x => x.Name), "$.dataSources", "name", issues);
        AddDuplicateIssues(attributes.Select(x => x.Key), "$.semanticAttributes", "key", issues);
        AddDuplicateIssues(selectors.Select(x => x.Name), "$.selectors", "name", issues);

        var sourceNames = dataSources.Select(x => x.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var attributeKeys = attributes.Select(x => x.Key).ToHashSet(StringComparer.OrdinalIgnoreCase);
        for (var index = 0; index < selectors.Count; index++)
        {
            if (!sourceNames.Contains(selectors[index].DataSourceName))
            {
                issues.Add(Error($"$.selectors[{index}].dataSourceName", $"Selector references unknown data source '{selectors[index].DataSourceName}'."));
            }
            if (!attributeKeys.Contains(selectors[index].TargetAttributeKey))
            {
                issues.Add(Error($"$.selectors[{index}].targetAttributeKey", $"Selector references unknown semantic attribute '{selectors[index].TargetAttributeKey}'."));
            }
        }

        if (string.IsNullOrWhiteSpace(version) || string.IsNullOrWhiteSpace(name) || dataSources.Count == 0 || attributes.Count == 0 || selectors.Count == 0)
        {
            return null;
        }

        return new BlueprintDocument(version, name, tenantSlug, dataSources, attributes, selectors, prompts, piiRules, auditPolicies);
    }

    private async Task<IReadOnlyList<BlueprintChangeResult>> BuildPreviewAsync(Guid tenantId, BlueprintDocument blueprint, CancellationToken cancellationToken)
    {
        var existingSourceNames = await dbContext.DataSources.Where(x => x.TenantId == tenantId).Select(x => x.Name).ToListAsync(cancellationToken);
        var existingAttributeKeys = await dbContext.SemanticAttributeDefinitions.Where(x => x.TenantId == tenantId).Select(x => x.Key).ToListAsync(cancellationToken);
        var existingSelectorNames = await dbContext.SelectorDefinitions.Where(x => x.TenantId == tenantId).Select(x => x.Name).ToListAsync(cancellationToken);
        var existingPromptNames = await dbContext.PromptTemplates.Where(x => x.TenantId == tenantId).Select(x => x.Name).ToListAsync(cancellationToken);
        var existingPiiRuleKeys = await dbContext.PiiRules.Where(x => x.TenantId == tenantId).Select(x => x.Key).ToListAsync(cancellationToken);
        var existingAuditPolicyKeys = await dbContext.AuditPolicies.Where(x => x.TenantId == tenantId).Select(x => x.Key).ToListAsync(cancellationToken);
        var changes = new List<BlueprintChangeResult>();
        changes.AddRange(blueprint.DataSources.Select((item, index) => Change("DataSource", item.Name, existingSourceNames.Contains(item.Name, StringComparer.OrdinalIgnoreCase), $"$.dataSources[{index}]")));
        changes.AddRange(blueprint.SemanticAttributes.Select((item, index) => Change("SemanticAttribute", item.Key, existingAttributeKeys.Contains(item.Key, StringComparer.OrdinalIgnoreCase), $"$.semanticAttributes[{index}]")));
        changes.AddRange(blueprint.Selectors.Select((item, index) => Change("SelectorDefinition", item.Name, existingSelectorNames.Contains(item.Name, StringComparer.OrdinalIgnoreCase), $"$.selectors[{index}]")));
        changes.AddRange(blueprint.PromptTemplates.Select((item, index) => Change("PromptTemplate", item.Name, existingPromptNames.Contains(item.Name, StringComparer.OrdinalIgnoreCase), $"$.promptTemplates[{index}]")));
        changes.AddRange(blueprint.PiiRules.Select((item, index) => Change("PiiRule", item.Key, existingPiiRuleKeys.Contains(item.Key, StringComparer.OrdinalIgnoreCase), $"$.piiRules[{index}]")));
        changes.AddRange(blueprint.AuditPolicies.Select((item, index) => Change("AuditPolicy", item.Key, existingAuditPolicyKeys.Contains(item.Key, StringComparer.OrdinalIgnoreCase), $"$.auditPolicies[{index}]")));
        return changes;
    }

    private static BlueprintChangeResult Change(string entityType, string name, bool exists, string path)
        => new(entityType, name, exists ? "Update" : "Create", path);

    private async Task<ResolvedBlueprintContext> ResolveContextAsync(BlueprintImportInput input, CancellationToken cancellationToken)
    {
        var tenant = await GetTenantAsync(input.TenantSlug, cancellationToken);
        BlueprintImport? import = null;
        var blueprintJson = input.BlueprintJson;
        if (input.ImportId.HasValue)
        {
            import = await dbContext.BlueprintImports.FirstOrDefaultAsync(x => x.TenantId == tenant.Id && x.Id == input.ImportId.Value, cancellationToken)
                ?? throw new InvalidOperationException($"Blueprint import '{input.ImportId}' was not found.");
            blueprintJson = import.BlueprintJson;
        }

        if (string.IsNullOrWhiteSpace(blueprintJson))
        {
            throw new InvalidOperationException("BlueprintJson or ImportId is required.");
        }

        return new ResolvedBlueprintContext(tenant, import?.WorkspaceId, import, blueprintJson);
    }

    private async Task<Tenant> GetTenantAsync(string tenantSlug, CancellationToken cancellationToken)
    {
        var normalizedSlug = tenantSlug.Trim().ToLowerInvariant();
        var actor = currentActorService.GetCurrentActor();
        if (!actor.IsSystem && !actor.IsPlatformOwner && !string.Equals(actor.TenantSlug, normalizedSlug, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Cross-tenant blueprint imports are not permitted.");
        }

        return await dbContext.Tenants.FirstOrDefaultAsync(x => x.Slug == normalizedSlug, cancellationToken)
            ?? throw new InvalidOperationException($"Tenant '{tenantSlug}' was not found.");
    }

    private async Task<Workspace?> ResolveWorkspaceAsync(Guid tenantId, string? workspaceSlug, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(workspaceSlug))
        {
            return await dbContext.Workspaces
                .AsNoTracking()
                .Where(x => x.TenantId == tenantId && x.Status == WorkspaceStatus.Active)
                .OrderByDescending(x => x.IsDefault)
                .ThenBy(x => x.Name)
                .FirstOrDefaultAsync(cancellationToken);
        }

        var normalizedSlug = workspaceSlug.Trim().ToLowerInvariant();
        return await dbContext.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.TenantId == tenantId && x.Slug == normalizedSlug, cancellationToken)
            ?? throw new InvalidOperationException($"Workspace '{workspaceSlug}' was not found.");
    }

    private void AddAudit(Guid tenantId, string action, Guid importId, int count)
        => AddAudit(tenantId, action, importId.ToString("D"), count);

    private void AddAudit(Guid tenantId, string action, string entityId, int count)
    {
        var actor = currentActorService.GetCurrentActor();
        dbContext.AuditEvents.Add(AuditEvent.Create(
            tenantId,
            actor.Email,
            action,
            nameof(BlueprintImport),
            entityId,
            Guid.NewGuid().ToString("N"),
            JsonSerializer.Serialize(new { count }),
            null,
            null,
            clock.UtcNow));
    }

    private static BlueprintImportResult BuildResult(
        Guid? importId,
        string status,
        bool isValid,
        string blueprintName,
        IReadOnlyList<BlueprintValidationIssueResult> issues,
        IReadOnlyList<BlueprintChangeResult> preview,
        IReadOnlyList<string> dataSources,
        IReadOnlyList<string> attributes,
        IReadOnlyList<string> selectors,
        IReadOnlyList<string> prompts,
        IReadOnlyList<string> piiRules,
        IReadOnlyList<string> auditPolicies)
        => new(
            importId,
            status,
            isValid,
            blueprintName,
            BlueprintJsonSchema.SchemaJson,
            issues,
            preview,
            dataSources,
            attributes,
            selectors,
            prompts,
            piiRules,
            auditPolicies,
            new BlueprintImportSummaryResult(dataSources.Count, attributes.Count, selectors.Count, prompts.Count, piiRules.Count, auditPolicies.Count));

    private static List<T> ParseArray<T>(JsonElement root, string propertyName, string path, List<BlueprintValidationIssueResult> issues, Func<JsonElement, string, List<BlueprintValidationIssueResult>, T?> parser)
        where T : class
    {
        if (!root.TryGetProperty(propertyName, out var array) || array.ValueKind != JsonValueKind.Array)
        {
            issues.Add(Error(path, $"{propertyName} must be an array."));
            return [];
        }

        var results = new List<T>();
        var index = 0;
        foreach (var item in array.EnumerateArray())
        {
            if (item.ValueKind != JsonValueKind.Object)
            {
                issues.Add(Error($"{path}[{index}]", "Array item must be an object."));
            }
            else if (parser(item, $"{path}[{index}]", issues) is { } parsed)
            {
                results.Add(parsed);
            }

            index++;
        }

        if (results.Count == 0)
        {
            issues.Add(Error(path, $"{propertyName} must contain at least one valid item."));
        }

        return results;
    }

    private static BlueprintDataSource? ParseDataSource(JsonElement item, string path, List<BlueprintValidationIssueResult> issues)
    {
        var name = RequiredString(item, "name", $"{path}.name", issues);
        var description = RequiredString(item, "description", $"{path}.description", issues);
        var kindText = RequiredString(item, "kind", $"{path}.kind", issues);
        var config = RequiredObject(item, "connectionConfig", $"{path}.connectionConfig", issues);
        if (!TryParseDataSourceKind(kindText, out var kind))
        {
            issues.Add(Error($"{path}.kind", $"Unsupported data source kind '{kindText}'."));
        }

        return HasRequired(name, description, kindText, config) && TryParseDataSourceKind(kindText, out kind)
            ? new BlueprintDataSource(name!, description!, kind, JsonElementToObject(config!.Value))
            : null;
    }

    private static BlueprintSemanticAttribute? ParseAttribute(JsonElement item, string path, List<BlueprintValidationIssueResult> issues)
    {
        var key = RequiredString(item, "key", $"{path}.key", issues);
        var displayName = RequiredString(item, "displayName", $"{path}.displayName", issues);
        var description = RequiredString(item, "description", $"{path}.description", issues);
        var dataTypeText = RequiredString(item, "dataType", $"{path}.dataType", issues);
        var example = RequiredString(item, "exampleValueJson", $"{path}.exampleValueJson", issues);
        if (!TryParseSemanticDataType(dataTypeText, out var dataType))
        {
            issues.Add(Error($"{path}.dataType", $"Unsupported semantic data type '{dataTypeText}'."));
        }
        if (!string.IsNullOrWhiteSpace(example) && !IsValidJson(example))
        {
            issues.Add(Error($"{path}.exampleValueJson", "exampleValueJson must be a string containing valid JSON."));
        }

        return HasRequired(key, displayName, description, dataTypeText, example) && TryParseSemanticDataType(dataTypeText, out dataType)
            ? new BlueprintSemanticAttribute(key!, displayName!, description!, dataType, example!, OptionalBool(item, "isSystem") ?? true)
            : null;
    }

    private static BlueprintSelector? ParseSelector(JsonElement item, string path, List<BlueprintValidationIssueResult> issues)
    {
        var name = RequiredString(item, "name", $"{path}.name", issues);
        var description = RequiredString(item, "description", $"{path}.description", issues);
        var dataSourceName = RequiredString(item, "dataSourceName", $"{path}.dataSourceName", issues);
        var targetAttributeKey = RequiredString(item, "targetAttributeKey", $"{path}.targetAttributeKey", issues);
        var mappingKindText = RequiredString(item, "mappingKind", $"{path}.mappingKind", issues);
        var expression = RequiredObject(item, "expression", $"{path}.expression", issues);
        var explanation = RequiredString(item, "explanationTemplate", $"{path}.explanationTemplate", issues);
        var validationSchema = OptionalObject(item, "validationSchema") ?? new Dictionary<string, object?>();
        var confidence = RequiredDecimal(item, "defaultConfidence", $"{path}.defaultConfidence", issues);
        var freshness = RequiredInt(item, "freshnessWindowMinutes", $"{path}.freshnessWindowMinutes", issues);
        var priority = RequiredInt(item, "priority", $"{path}.priority", issues);
        var schedule = OptionalInt(item, "scheduleIntervalMinutes");
        if (!TryParseSelectorMappingKind(mappingKindText, out var mappingKind))
        {
            issues.Add(Error($"{path}.mappingKind", $"Unsupported selector mapping kind '{mappingKindText}'."));
        }
        if (confidence is < 0 or > 1)
        {
            issues.Add(Error($"{path}.defaultConfidence", "defaultConfidence must be between 0 and 1."));
        }

        return HasRequired(name, description, dataSourceName, targetAttributeKey, mappingKindText, expression, explanation, confidence, freshness, priority)
            && TryParseSelectorMappingKind(mappingKindText, out mappingKind)
            ? new BlueprintSelector(name!, description!, dataSourceName!, targetAttributeKey!, mappingKind, JsonElementToObject(expression!.Value), explanation!, validationSchema, confidence!.Value, freshness!.Value, priority!.Value, schedule, OptionalBool(item, "publish") ?? true)
            : null;
    }

    private static BlueprintPromptTemplate? ParsePrompt(JsonElement item, string path, List<BlueprintValidationIssueResult> issues)
    {
        var name = RequiredString(item, "name", $"{path}.name", issues);
        var description = RequiredString(item, "description", $"{path}.description", issues);
        var system = RequiredString(item, "systemPrompt", $"{path}.systemPrompt", issues);
        var developer = RequiredString(item, "developerPrompt", $"{path}.developerPrompt", issues);
        var user = RequiredString(item, "userPromptTemplate", $"{path}.userPromptTemplate", issues);
        var outputSchema = OptionalObject(item, "outputSchema") ?? new Dictionary<string, object?>();
        var guardrails = OptionalStringArray(item, "guardrails");
        return HasRequired(name, description, system, developer, user)
            ? new BlueprintPromptTemplate(name!, description!, system!, developer!, user!, outputSchema, guardrails)
            : null;
    }

    private static BlueprintPiiRule? ParsePiiRule(JsonElement item, string path, List<BlueprintValidationIssueResult> issues)
    {
        var key = RequiredString(item, "key", $"{path}.key", issues);
        var displayName = RequiredString(item, "displayName", $"{path}.displayName", issues);
        var description = RequiredString(item, "description", $"{path}.description", issues);
        var rule = OptionalObject(item, "rule") ?? OptionalObject(item, "ruleJson") ?? new Dictionary<string, object?>();
        return HasRequired(key, displayName, description) ? new BlueprintPiiRule(key!, displayName!, description!, rule) : null;
    }

    private static BlueprintAuditPolicy? ParseAuditPolicy(JsonElement item, string path, List<BlueprintValidationIssueResult> issues)
    {
        var key = RequiredString(item, "key", $"{path}.key", issues);
        var displayName = RequiredString(item, "displayName", $"{path}.displayName", issues);
        var description = RequiredString(item, "description", $"{path}.description", issues);
        var policy = OptionalObject(item, "policy") ?? OptionalObject(item, "policyJson") ?? new Dictionary<string, object?>();
        return HasRequired(key, displayName, description) ? new BlueprintAuditPolicy(key!, displayName!, description!, policy) : null;
    }

    private static void AddDuplicateIssues(IEnumerable<string> values, string path, string propertyName, List<BlueprintValidationIssueResult> issues)
    {
        foreach (var duplicate in values.GroupBy(x => x, StringComparer.OrdinalIgnoreCase).Where(static group => group.Count() > 1).Select(static group => group.Key))
        {
            issues.Add(Error(path, $"Duplicate {propertyName} '{duplicate}'."));
        }
    }

    private static string? RequiredString(JsonElement item, string propertyName, string path, List<BlueprintValidationIssueResult> issues)
    {
        if (!item.TryGetProperty(propertyName, out var value) || value.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(value.GetString()))
        {
            issues.Add(Error(path, $"{propertyName} is required."));
            return null;
        }

        return value.GetString()!.Trim();
    }

    private static string? OptionalString(JsonElement item, string propertyName)
        => item.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;

    private static JsonElement? RequiredObject(JsonElement item, string propertyName, string path, List<BlueprintValidationIssueResult> issues)
    {
        if (!item.TryGetProperty(propertyName, out var value) || value.ValueKind != JsonValueKind.Object)
        {
            issues.Add(Error(path, $"{propertyName} must be an object."));
            return null;
        }

        return value;
    }

    private static Dictionary<string, object?>? OptionalObject(JsonElement item, string propertyName)
        => item.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.Object ? JsonElementToObject(value) : null;

    private static decimal? RequiredDecimal(JsonElement item, string propertyName, string path, List<BlueprintValidationIssueResult> issues)
    {
        if (!item.TryGetProperty(propertyName, out var value) || !value.TryGetDecimal(out var result))
        {
            issues.Add(Error(path, $"{propertyName} must be a number."));
            return null;
        }

        return result;
    }

    private static int? RequiredInt(JsonElement item, string propertyName, string path, List<BlueprintValidationIssueResult> issues)
    {
        if (!item.TryGetProperty(propertyName, out var value) || !value.TryGetInt32(out var result))
        {
            issues.Add(Error(path, $"{propertyName} must be an integer."));
            return null;
        }

        return result;
    }

    private static int? OptionalInt(JsonElement item, string propertyName)
        => item.TryGetProperty(propertyName, out var value) && value.ValueKind != JsonValueKind.Null && value.TryGetInt32(out var result) ? result : null;

    private static bool? OptionalBool(JsonElement item, string propertyName)
        => item.TryGetProperty(propertyName, out var value) && value.ValueKind is JsonValueKind.True or JsonValueKind.False ? value.GetBoolean() : null;

    private static IReadOnlyList<string> OptionalStringArray(JsonElement item, string propertyName)
    {
        if (!item.TryGetProperty(propertyName, out var value) || value.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return value.EnumerateArray()
            .Where(static element => element.ValueKind == JsonValueKind.String)
            .Select(static element => element.GetString()!)
            .ToList();
    }

    private static Dictionary<string, object?> JsonElementToObject(JsonElement element)
        => JsonSerializer.Deserialize<Dictionary<string, object?>>(element.GetRawText(), JsonOptions) ?? [];

    private static bool HasRequired(params object?[] values) => values.All(static value => value is not null);

    private static BlueprintValidationIssueResult Error(string path, string message)
        => new(path, message, "error", null, null);

    private static bool TryParseDataSourceKind(string? value, out DataSourceKind kind)
    {
        var normalized = NormalizeEnumName(value);
        if (string.Equals(normalized, "APIPAYLOAD", StringComparison.OrdinalIgnoreCase)
            || string.Equals(normalized, "MOCK", StringComparison.OrdinalIgnoreCase))
        {
            kind = DataSourceKind.EventStream;
            return true;
        }

        return Enum.TryParse(normalized, true, out kind);
    }

    private static bool TryParseSemanticDataType(string? value, out SemanticDataType dataType)
    {
        var normalized = NormalizeEnumName(value);
        if (string.Equals(normalized, "STRING", StringComparison.OrdinalIgnoreCase))
        {
            dataType = SemanticDataType.Text;
            return true;
        }
        if (string.Equals(normalized, "DATETIME", StringComparison.OrdinalIgnoreCase))
        {
            dataType = SemanticDataType.Text;
            return true;
        }

        return Enum.TryParse(normalized, true, out dataType);
    }

    private static bool TryParseSelectorMappingKind(string? value, out SelectorMappingKind kind)
        => Enum.TryParse(NormalizeEnumName(value), true, out kind);

    private static string NormalizeEnumName(string? value)
        => (value ?? string.Empty).Replace("_", string.Empty, StringComparison.Ordinal).Replace("-", string.Empty, StringComparison.Ordinal);

    private static bool IsValidJson(string value)
    {
        try
        {
            JsonDocument.Parse(value);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static string Serialize<T>(T value) => JsonSerializer.Serialize(value, JsonOptions);

    private static string Hash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string? TryReadString(string json, string propertyName)
    {
        try
        {
            using var document = JsonDocument.Parse(json);
            return document.RootElement.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.String
                ? value.GetString()
                : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private sealed record ResolvedBlueprintContext(Tenant Tenant, Guid? WorkspaceId, BlueprintImport? Import, string BlueprintJson);

    private sealed record BlueprintEvaluation(
        string BlueprintName,
        bool IsValid,
        BlueprintDocument? Blueprint,
        IReadOnlyList<BlueprintValidationIssueResult> Issues,
        IReadOnlyList<BlueprintChangeResult> Preview);

    private sealed record BlueprintDocument(
        string Version,
        string Name,
        string TenantSlug,
        IReadOnlyList<BlueprintDataSource> DataSources,
        IReadOnlyList<BlueprintSemanticAttribute> SemanticAttributes,
        IReadOnlyList<BlueprintSelector> Selectors,
        IReadOnlyList<BlueprintPromptTemplate> PromptTemplates,
        IReadOnlyList<BlueprintPiiRule> PiiRules,
        IReadOnlyList<BlueprintAuditPolicy> AuditPolicies);

    private sealed record BlueprintDataSource(string Name, string Description, DataSourceKind Kind, Dictionary<string, object?> ConnectionConfig);

    private sealed record BlueprintSemanticAttribute(string Key, string DisplayName, string Description, SemanticDataType DataType, string ExampleValueJson, bool IsSystem);

    private sealed record BlueprintSelector(
        string Name,
        string Description,
        string DataSourceName,
        string TargetAttributeKey,
        SelectorMappingKind MappingKind,
        Dictionary<string, object?> Expression,
        string ExplanationTemplate,
        Dictionary<string, object?> ValidationSchema,
        decimal DefaultConfidence,
        int FreshnessWindowMinutes,
        int Priority,
        int? ScheduleIntervalMinutes,
        bool Publish);

    private sealed record BlueprintPromptTemplate(
        string Name,
        string Description,
        string SystemPrompt,
        string DeveloperPrompt,
        string UserPromptTemplate,
        Dictionary<string, object?> OutputSchema,
        IReadOnlyList<string> Guardrails);

    private sealed record BlueprintPiiRule(string Key, string DisplayName, string Description, Dictionary<string, object?> Rule);

    private sealed record BlueprintAuditPolicy(string Key, string DisplayName, string Description, Dictionary<string, object?> Policy);
}

internal static class BlueprintJsonSchema
{
    public const string SchemaJson = """
        {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "$id": "https://scout.dev/schemas/scout-blueprint.schema.json",
          "title": "ScoutBlueprint",
          "type": "object",
          "required": ["version", "name", "dataSources", "semanticAttributes", "selectors"],
          "properties": {
            "version": { "type": "string" },
            "name": { "type": "string", "minLength": 3 },
            "tenantSlug": { "type": "string" },
            "sourceArtifacts": { "type": "array", "items": { "type": "object" } },
            "dataSources": { "type": "array", "minItems": 1, "items": { "type": "object", "required": ["name", "description", "kind", "connectionConfig"] } },
            "semanticAttributes": { "type": "array", "minItems": 1, "items": { "type": "object", "required": ["key", "displayName", "description", "dataType", "exampleValueJson"] } },
            "selectors": { "type": "array", "minItems": 1, "items": { "type": "object", "required": ["name", "description", "dataSourceName", "targetAttributeKey", "mappingKind", "expression", "explanationTemplate", "defaultConfidence", "freshnessWindowMinutes", "priority"] } },
            "promptTemplates": { "type": "array", "items": { "type": "object" } },
            "piiRules": { "type": "array", "items": { "type": "object", "required": ["key", "displayName", "description"] } },
            "auditPolicies": { "type": "array", "items": { "type": "object", "required": ["key", "displayName", "description"] } }
          }
        }
        """;
}
