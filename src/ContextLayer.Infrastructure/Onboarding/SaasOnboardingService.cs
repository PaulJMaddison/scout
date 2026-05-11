using System.Text.Json;
using System.Text.RegularExpressions;
using ContextLayer.Application.Contracts;
using ContextLayer.Application.Services;
using ContextLayer.Domain.Entities;
using ContextLayer.Domain.Enums;
using ContextLayer.Domain.Saas;
using ContextLayer.Infrastructure.Auth;
using ContextLayer.Infrastructure.Persistence;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace ContextLayer.Infrastructure.Onboarding;

public sealed class SaasOnboardingService(
    ContextLayerDbContext dbContext,
    PasswordHashingService passwordHashingService,
    IValidator<SubmitOnboardingInput> validator,
    TimeProvider timeProvider)
    : IOnboardingService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<OnboardingResult> SubmitAsync(SubmitOnboardingInput input, CancellationToken cancellationToken)
    {
        await validator.ValidateAndThrowAsync(input, cancellationToken);

        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        var tenantSlug = input.TenantSlug.Trim().ToLowerInvariant();
        var adminEmail = input.AdminEmail.Trim().ToLowerInvariant();
        var sourceSystems = Clean(input.SourceSystems);
        var dataCategories = Clean(input.DataCategories);
        var aiUseCases = Clean(input.AiUseCases);
        var workspaceSlug = Slugify(input.PrimaryWorkspaceName, "primary");
        var correlationId = Guid.NewGuid().ToString("N");

        if (await dbContext.Tenants.AnyAsync(x => x.Slug == tenantSlug, cancellationToken))
        {
            throw new InvalidOperationException("A tenant with this slug already exists.");
        }

        var tenant = Tenant.Create(tenantSlug, input.OrganisationName, utcNow);
        var workspace = Workspace.Create(
            tenant.Id,
            workspaceSlug,
            input.PrimaryWorkspaceName,
            $"Primary workspace for {input.OrganisationName.Trim()}.",
            isDefault: true,
            utcNow);
        var admin = OperatorAccount.Create(
            tenant.Id,
            adminEmail,
            input.AdminDisplayName,
            passwordHashingService.HashPassword(input.AdminPassword),
            OperatorRole.TenantAdmin,
            utcNow);
        var member = WorkspaceMember.Create(tenant.Id, workspace.Id, admin.Id, WorkspaceMemberRole.Owner, utcNow);
        var subscription = TenantSubscription.Create(
            tenant.Id,
            SubscriptionPlan.Free,
            SubscriptionStatus.Trialing,
            string.Empty,
            ToJson(new
            {
                source = "onboarding",
                provider = "not-configured",
                paymentProviderRequired = false
            }),
            utcNow,
            utcNow.AddDays(14),
            utcNow.AddMonths(1),
            utcNow);
        var application = OnboardingApplication.Create(
            input.OrganisationName,
            tenantSlug,
            input.PrimaryWorkspaceName,
            adminEmail,
            input.AdminDisplayName,
            input.IntendedUseCase,
            ToJson(sourceSystems),
            ToJson(dataCategories),
            ToJson(aiUseCases),
            input.PiiSensitivityLevel.Trim().ToLowerInvariant(),
            input.PreferredDeploymentMode.Trim().ToLowerInvariant(),
            utcNow);

        var dataSources = BuildDataSources(tenant.Id, sourceSystems, utcNow);
        var starterAttributes = BuildStarterAttributes(tenant.Id, dataCategories, aiUseCases, utcNow);
        var starterSelectors = BuildStarterSelectors(tenant.Id, dataSources, starterAttributes, sourceSystems, utcNow);
        var onboardingStates = BuildOnboardingStates(
            tenant.Id,
            workspace.Id,
            sourceSystems,
            dataCategories,
            aiUseCases,
            input.PreferredDeploymentMode,
            utcNow);
        var nextSteps = BuildNextSteps(input.PreferredDeploymentMode, workspaceSlug);

        application.MarkProvisioned(tenant.Id, workspace.Id, admin.Id, ToJson(nextSteps), utcNow);

        dbContext.Tenants.Add(tenant);
        dbContext.Workspaces.Add(workspace);
        dbContext.OperatorAccounts.Add(admin);
        dbContext.WorkspaceMembers.Add(member);
        dbContext.TenantSubscriptions.Add(subscription);
        dbContext.OnboardingApplications.Add(application);
        dbContext.DataSources.AddRange(dataSources);
        dbContext.SemanticAttributeDefinitions.AddRange(starterAttributes);
        dbContext.SelectorDefinitions.AddRange(starterSelectors);
        dbContext.OnboardingStates.AddRange(onboardingStates);
        dbContext.AuditEvents.Add(AuditEvent.Create(
            tenant.Id,
            adminEmail,
            "onboarding.provisioned",
            nameof(OnboardingApplication),
            application.Id.ToString(),
            correlationId,
            ToJson(new
            {
                tenantSlug,
                workspaceSlug,
                sourceSystems,
                dataCategories,
                aiUseCases,
                input.PiiSensitivityLevel,
                input.PreferredDeploymentMode
            }),
            beforeJson: null,
            afterJson: ToJson(new
            {
                tenantId = tenant.Id,
                workspaceId = workspace.Id,
                adminOperatorAccountId = admin.Id,
                semanticAttributeCount = starterAttributes.Count,
                selectorCount = starterSelectors.Count,
                dataSourceCount = dataSources.Count
            }),
            utcNow));

        await dbContext.SaveChangesAsync(cancellationToken);

        return new OnboardingResult(
            application.Id,
            tenant.Id,
            tenant.Slug,
            workspace.Id,
            workspace.Slug,
            admin.Id,
            starterAttributes.Select(x => x.Key).ToArray(),
            starterSelectors.Select(x => x.Name).ToArray(),
            dataSources.Select(x => x.Name).ToArray(),
            nextSteps);
    }

    private static List<DataSource> BuildDataSources(Guid tenantId, IReadOnlyList<string> sourceSystems, DateTime utcNow)
    {
        IReadOnlyList<string> systems = sourceSystems.Count == 0 ? ["Starter CRM"] : sourceSystems;

        return systems
            .Select(system => DataSource.Create(
                tenantId,
                $"{system} starter source",
                $"Safe onboarding placeholder for mapping {system} into semantic context. Replace with a real connector when ready.",
                InferKind(system),
                ToJson(new
                {
                    connectorType = "mock",
                    onboarding = true,
                    sourceSystem = system,
                    secretStorage = "not-configured",
                    note = "No production credentials are stored by onboarding."
                }),
                utcNow))
            .ToList();
    }

    private static List<SemanticAttributeDefinition> BuildStarterAttributes(
        Guid tenantId,
        IReadOnlyList<string> dataCategories,
        IReadOnlyList<string> aiUseCases,
        DateTime utcNow)
    {
        var attributes = new List<StarterAttribute>
        {
            new("customerIdentity", "Customer identity", "Stable account and user identity used to join context across systems.", SemanticDataType.Json, new { externalId = "acct_123", domain = "example.test" }),
            new("aiReadinessSummary", "AI readiness summary", "Human-readable summary of which trusted context is available for AI workflows.", SemanticDataType.Text, "CRM, product usage, support, and billing context are available.")
        };

        if (Has(dataCategories, "crm") || Has(aiUseCases, "sales"))
        {
            attributes.Add(new("accountHealth", "Account health", "High-level account health signal synthesized from CRM and lifecycle data.", SemanticDataType.Enum, "healthy"));
            attributes.Add(new("buyingIntent", "Buying intent", "Likelihood that the account is ready for a next-best action.", SemanticDataType.Percentage, 0.74m));
        }

        if (Has(dataCategories, "product") || Has(dataCategories, "usage"))
        {
            attributes.Add(new("productUsageMaturity", "Product usage maturity", "Normalized product adoption stage for AI workflows.", SemanticDataType.Enum, "expanding"));
        }

        if (Has(dataCategories, "support"))
        {
            attributes.Add(new("supportRisk", "Support risk", "Risk score derived from ticket volume, severity, and recency.", SemanticDataType.Percentage, 0.18m));
        }

        if (Has(dataCategories, "billing"))
        {
            attributes.Add(new("billingReadiness", "Billing readiness", "Whether commercial and subscription context is ready for AI use.", SemanticDataType.Percentage, 0.91m));
        }

        if (Has(dataCategories, "marketing"))
        {
            attributes.Add(new("marketingEngagement", "Marketing engagement", "Normalized engagement band from campaign and web signals.", SemanticDataType.Enum, "warm"));
        }

        if (Has(dataCategories, "warehouse") || Has(dataCategories, "sql") || Has(dataCategories, "spreadsheet"))
        {
            attributes.Add(new("sourceCoverage", "Source coverage", "Coverage summary for warehouse, spreadsheet, and SQL-backed mappings.", SemanticDataType.Json, new { completeness = 0.68m, mappedSources = dataCategories }));
        }

        return attributes
            .GroupBy(attribute => attribute.Key, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .Select(attribute => SemanticAttributeDefinition.Create(
                tenantId,
                attribute.Key,
                attribute.DisplayName,
                attribute.Description,
                attribute.DataType,
                ToJson(attribute.ExampleValue),
                isSystem: false,
                utcNow))
            .ToList();
    }

    private static List<SelectorDefinition> BuildStarterSelectors(
        Guid tenantId,
        IReadOnlyList<DataSource> dataSources,
        IReadOnlyList<SemanticAttributeDefinition> attributes,
        IReadOnlyList<string> sourceSystems,
        DateTime utcNow)
    {
        var primarySource = dataSources.FirstOrDefault();
        return attributes.Select((attribute, index) =>
        {
            var sourceName = primarySource?.Name ?? "starter source";
            var selector = SelectorDefinition.Create(
                tenantId,
                primarySource?.Id,
                attribute.Id,
                $"Starter {attribute.DisplayName} selector",
                $"Draft-safe selector showing how {sourceName} can produce {attribute.DisplayName.ToLowerInvariant()} context.",
                ChooseMappingKind(attribute.DataType),
                ToJson(new
                {
                    mode = "starter",
                    sourceSystems,
                    targetAttribute = attribute.Key,
                    valuePath = $"$.{ToSnakeCase(attribute.Key)}",
                    confidence = new
                    {
                        baseScore = 0.72m,
                        requiresHumanReview = true
                    }
                }),
                $"Generated from onboarding starter mapping for {attribute.DisplayName}. Review source fields before production use.",
                ToJson(new
                {
                    required = new[] { "$.external_user_id" },
                    piiHandling = "respect-tenant-sensitivity-level"
                }),
                0.72m,
                1_440,
                index + 1,
                scheduleIntervalMinutes: null,
                utcNow);
            selector.Publish(utcNow);
            return selector;
        }).ToList();
    }

    private static List<OnboardingState> BuildOnboardingStates(
        Guid tenantId,
        Guid workspaceId,
        IReadOnlyList<string> sourceSystems,
        IReadOnlyList<string> dataCategories,
        IReadOnlyList<string> aiUseCases,
        string preferredDeploymentMode,
        DateTime utcNow)
    {
        return
        [
            OnboardingState.Create(tenantId, workspaceId, "company-profile", OnboardingStepStatus.Completed, ToJson(new { sourceSystems, dataCategories, aiUseCases }), utcNow),
            OnboardingState.Create(tenantId, workspaceId, "starter-semantic-schema", OnboardingStepStatus.Completed, ToJson(new { generated = true }), utcNow),
            OnboardingState.Create(tenantId, workspaceId, "starter-selectors", OnboardingStepStatus.Completed, ToJson(new { generated = true, safeMode = true }), utcNow),
            OnboardingState.Create(tenantId, workspaceId, "connect-real-systems", OnboardingStepStatus.InProgress, ToJson(new { preferredDeploymentMode }), utcNow),
            OnboardingState.Create(tenantId, workspaceId, "generate-first-context-package", OnboardingStepStatus.NotStarted, ToJson(new { requiresTrustedSourceData = true }), utcNow)
        ];
    }

    private static IReadOnlyList<OnboardingNextStepResult> BuildNextSteps(string preferredDeploymentMode, string workspaceSlug)
    {
        var deploymentCopy = preferredDeploymentMode.Trim().ToLowerInvariant() switch
        {
            "self-hosted" => "Prepare PostgreSQL, signing keys, and your connector secret store for the self-hosted control plane.",
            "managed-saas" => "Invite your integration admin and move starter sources to managed SaaS connector registrations.",
            "private-cloud" => "Schedule the private cloud network and identity review before moving credentials into the environment.",
            _ => "Keep exploring with local demo data, then switch to backend-only or SaaS mode when you are ready."
        };

        return
        [
            new OnboardingNextStepResult("Review semantic schema", "Inspect the starter attributes and tune names before teams rely on them.", "/semantic-schema"),
            new OnboardingNextStepResult("Connect real systems", "Replace mock starter sources with safe connector registrations. No paid enterprise connector code is bundled here.", "/data-sources"),
            new OnboardingNextStepResult("Validate selectors", "Preview the generated mappings against sample records before publishing production selectors.", "/selectors"),
            new OnboardingNextStepResult("Generate trusted context", "Use the workspace to generate the first AI-ready context snapshot and package.", $"/customers?workspace={workspaceSlug}"),
            new OnboardingNextStepResult("Plan deployment", deploymentCopy, "/commercial")
        ];
    }

    private static SelectorMappingKind ChooseMappingKind(SemanticDataType dataType)
        => dataType switch
        {
            SemanticDataType.Percentage => SelectorMappingKind.WeightedScoring,
            SemanticDataType.Enum => SelectorMappingKind.ThresholdClassification,
            SemanticDataType.EnumSet => SelectorMappingKind.StringToEnumMapping,
            SemanticDataType.Number => SelectorMappingKind.FormulaMetric,
            _ => SelectorMappingKind.DirectFieldMapping
        };

    private static DataSourceKind InferKind(string value)
    {
        var normalized = value.Trim().ToLowerInvariant();
        if (normalized.Contains("crm", StringComparison.Ordinal) || normalized.Contains("salesforce", StringComparison.Ordinal) || normalized.Contains("hubspot", StringComparison.Ordinal))
        {
            return DataSourceKind.Crm;
        }

        if (normalized.Contains("product", StringComparison.Ordinal) || normalized.Contains("usage", StringComparison.Ordinal) || normalized.Contains("telemetry", StringComparison.Ordinal))
        {
            return DataSourceKind.ProductUsage;
        }

        if (normalized.Contains("warehouse", StringComparison.Ordinal) || normalized.Contains("sql", StringComparison.Ordinal) || normalized.Contains("billing", StringComparison.Ordinal) || normalized.Contains("spreadsheet", StringComparison.Ordinal))
        {
            return DataSourceKind.SqlMetric;
        }

        return DataSourceKind.EventStream;
    }

    private static bool Has(IReadOnlyList<string> values, string fragment)
        => values.Any(value => value.Contains(fragment, StringComparison.OrdinalIgnoreCase));

    private static IReadOnlyList<string> Clean(IReadOnlyList<string> values)
        => values
            .Select(value => value.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(20)
            .ToArray();

    private static string Slugify(string value, string fallback)
    {
        var normalized = Regex.Replace(value.Trim().ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrWhiteSpace(normalized) ? fallback : normalized[..Math.Min(normalized.Length, 100)];
    }

    private static string ToSnakeCase(string value)
        => Regex.Replace(value, "([a-z0-9])([A-Z])", "$1_$2").ToLowerInvariant();

    private static string ToJson<T>(T value)
        => JsonSerializer.Serialize(value, JsonOptions);

    private sealed record StarterAttribute(
        string Key,
        string DisplayName,
        string Description,
        SemanticDataType DataType,
        object ExampleValue);
}
