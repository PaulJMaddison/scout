using System.Text.Json;
using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Application.Contracts;
using KynticAI.Scout.Domain.Entities;
using KynticAI.Scout.Domain.Enums;
using KynticAI.Scout.Domain.Saas;
using Microsoft.EntityFrameworkCore;

namespace KynticAI.Scout.Application.Services;

public interface IBillingPlanCatalog
{
    Task<IReadOnlyList<BillingPlanDefinitionResult>> GetPlansAsync(CancellationToken cancellationToken);

    Task<BillingPlanDefinitionResult> GetPlanAsync(SubscriptionPlan plan, CancellationToken cancellationToken);
}

public interface IUsageMeteringService
{
    Task RecordAsync(UsageRecordInput input, CancellationToken cancellationToken, bool saveImmediately = true);

    Task<BillingUsageOverviewResult> GetUsageOverviewAsync(string tenantSlug, CancellationToken cancellationToken);
}

public interface IBillingEnforcementService
{
    Task EnsureWithinLimitAsync(
        Guid tenantId,
        BillingLimitMetric metric,
        long requestedQuantity,
        CancellationToken cancellationToken,
        Guid? workspaceId = null);
}

public interface IBillingProviderGateway
{
    string ProviderName { get; }

    Task<BillingProviderCustomerResult> EnsureCustomerAsync(BillingProviderCustomerRequest request, CancellationToken cancellationToken);

    Task<BillingProviderCheckoutResult> CreateCheckoutAsync(BillingProviderCheckoutRequest request, CancellationToken cancellationToken);

    Task<BillingProviderPortalResult> CreatePortalAsync(BillingProviderPortalRequest request, CancellationToken cancellationToken);
}

public sealed class PlanLimitExceededException : InvalidOperationException
{
    public PlanLimitExceededException(
        string tenantSlug,
        SubscriptionPlan plan,
        BillingLimitMetric metric,
        long limit,
        long currentUsage,
        long requestedQuantity)
        : base($"The {plan} plan allows {limit:N0} {DisplayName(metric).ToLowerInvariant()}. Current usage is {currentUsage:N0}; requested {requestedQuantity:N0}.")
    {
        TenantSlug = tenantSlug;
        Plan = plan;
        Metric = metric;
        Limit = limit;
        CurrentUsage = currentUsage;
        RequestedQuantity = requestedQuantity;
    }

    public string TenantSlug { get; }

    public SubscriptionPlan Plan { get; }

    public BillingLimitMetric Metric { get; }

    public long Limit { get; }

    public long CurrentUsage { get; }

    public long RequestedQuantity { get; }

    public static string DisplayName(BillingLimitMetric metric) => metric switch
    {
        BillingLimitMetric.ApiClients => "API clients",
        BillingLimitMetric.BlueprintImports => "blueprint imports",
        BillingLimitMetric.ContextLookups => "context lookups",
        BillingLimitMetric.Recomputations => "recomputations",
        BillingLimitMetric.RetentionDays => "retention days",
        BillingLimitMetric.SourceEvents => "source events",
        BillingLimitMetric.Workspaces => "workspaces",
        BillingLimitMetric.Selectors => "selectors",
        BillingLimitMetric.Users => "users",
        BillingLimitMetric.Tenants => "tenants",
        _ => metric.ToString()
    };
}

public sealed class BillingPlanCatalog(IScoutDbContext dbContext) : IBillingPlanCatalog
{
    private static readonly IReadOnlyList<PlanDefinition> DefaultPlans =
    [
        new(
            SubscriptionPlan.Free,
            "Free",
            "For local evaluation, proof-of-concepts, and small internal pilots.",
            true,
            10,
            "provider-plan-free",
            [
                Limit(BillingLimitMetric.Tenants, 1, "account", "hard", "One tenant per Free subscription."),
                Limit(BillingLimitMetric.Workspaces, 1, "active", "hard", "One active workspace."),
                Limit(BillingLimitMetric.Users, 5, "active", "hard", "Five operator users."),
                Limit(BillingLimitMetric.ApiClients, 1, "active", "hard", "One machine client."),
                Limit(BillingLimitMetric.Selectors, 5, "active", "hard", "Five selector definitions."),
                Limit(BillingLimitMetric.ContextLookups, 1_000, "monthly", "hard", "Successful context reads per calendar month."),
                Limit(BillingLimitMetric.Recomputations, 100, "monthly", "hard", "Manual or event-triggered recomputations per calendar month."),
                Limit(BillingLimitMetric.SourceEvents, 1_000, "monthly", "hard", "Accepted source-system events per calendar month."),
                Limit(BillingLimitMetric.BlueprintImports, 1, "monthly", "hard", "Applied blueprint imports per calendar month."),
                Limit(BillingLimitMetric.RetentionDays, 30, "retention", "policy", "Usage and audit retention target in days.")
            ]),
        new(
            SubscriptionPlan.Pro,
            "Pro",
            "For teams standardising customer context across a few systems.",
            true,
            20,
            "provider-plan-pro",
            [
                Limit(BillingLimitMetric.Tenants, 1, "account", "hard", "One tenant per Pro subscription."),
                Limit(BillingLimitMetric.Workspaces, 3, "active", "hard", "Three active workspaces."),
                Limit(BillingLimitMetric.Users, 25, "active", "hard", "Twenty-five operator users."),
                Limit(BillingLimitMetric.ApiClients, 5, "active", "hard", "Five machine clients."),
                Limit(BillingLimitMetric.Selectors, 50, "active", "hard", "Fifty selector definitions."),
                Limit(BillingLimitMetric.ContextLookups, 25_000, "monthly", "hard", "Successful context reads per calendar month."),
                Limit(BillingLimitMetric.Recomputations, 2_500, "monthly", "hard", "Manual or event-triggered recomputations per calendar month."),
                Limit(BillingLimitMetric.SourceEvents, 25_000, "monthly", "hard", "Accepted source-system events per calendar month."),
                Limit(BillingLimitMetric.BlueprintImports, 10, "monthly", "hard", "Applied blueprint imports per calendar month."),
                Limit(BillingLimitMetric.RetentionDays, 90, "retention", "policy", "Usage and audit retention target in days.")
            ]),
        new(
            SubscriptionPlan.Business,
            "Business",
            "For production teams with multiple workspaces and integration surfaces.",
            true,
            30,
            "provider-plan-business",
            [
                Limit(BillingLimitMetric.Tenants, 3, "account", "contract", "Multi-tenant organisations can be modelled by contract."),
                Limit(BillingLimitMetric.Workspaces, 10, "active", "hard", "Ten active workspaces."),
                Limit(BillingLimitMetric.Users, 100, "active", "hard", "One hundred operator users."),
                Limit(BillingLimitMetric.ApiClients, 20, "active", "hard", "Twenty machine clients."),
                Limit(BillingLimitMetric.Selectors, 250, "active", "hard", "Two hundred and fifty selector definitions."),
                Limit(BillingLimitMetric.ContextLookups, 250_000, "monthly", "hard", "Successful context reads per calendar month."),
                Limit(BillingLimitMetric.Recomputations, 25_000, "monthly", "hard", "Manual or event-triggered recomputations per calendar month."),
                Limit(BillingLimitMetric.SourceEvents, 250_000, "monthly", "hard", "Accepted source-system events per calendar month."),
                Limit(BillingLimitMetric.BlueprintImports, 50, "monthly", "hard", "Applied blueprint imports per calendar month."),
                Limit(BillingLimitMetric.RetentionDays, 365, "retention", "policy", "Usage and audit retention target in days.")
            ]),
        new(
            SubscriptionPlan.Enterprise,
            "Enterprise",
            "For private-cloud, managed SaaS, and custom commercial agreements.",
            false,
            40,
            "provider-plan-enterprise",
            [
                Limit(BillingLimitMetric.Tenants, null, "contract", "contract", "Custom tenant allowance."),
                Limit(BillingLimitMetric.Workspaces, null, "active", "contract", "Custom workspace allowance."),
                Limit(BillingLimitMetric.Users, null, "active", "contract", "Custom user allowance."),
                Limit(BillingLimitMetric.ApiClients, null, "active", "contract", "Custom machine-client allowance."),
                Limit(BillingLimitMetric.Selectors, null, "active", "contract", "Custom selector allowance."),
                Limit(BillingLimitMetric.ContextLookups, null, "monthly", "contract", "Contracted volume."),
                Limit(BillingLimitMetric.Recomputations, null, "monthly", "contract", "Contracted volume."),
                Limit(BillingLimitMetric.SourceEvents, null, "monthly", "contract", "Contracted volume."),
                Limit(BillingLimitMetric.BlueprintImports, null, "monthly", "contract", "Contracted volume."),
                Limit(BillingLimitMetric.RetentionDays, 2_555, "retention", "policy", "Seven-year default unless the contract says otherwise.")
            ])
    ];

    public async Task<IReadOnlyList<BillingPlanDefinitionResult>> GetPlansAsync(CancellationToken cancellationToken)
    {
        var storedPlans = await dbContext.BillingPlans
            .AsNoTracking()
            .Include(x => x.Limits)
            .OrderBy(x => x.SortOrder)
            .ToListAsync(cancellationToken);

        if (storedPlans.Count == 0)
        {
            return DefaultPlans.Select(ToResult).ToList();
        }

        return storedPlans.Select(ToResult).ToList();
    }

    public async Task<BillingPlanDefinitionResult> GetPlanAsync(SubscriptionPlan plan, CancellationToken cancellationToken)
    {
        var plans = await GetPlansAsync(cancellationToken);
        return plans.FirstOrDefault(x => string.Equals(x.Plan, plan.ToString(), StringComparison.Ordinal))
            ?? ToResult(DefaultPlans.First(x => x.Plan == plan));
    }

    internal static IReadOnlyList<PlanDefinition> GetDefaultPlanDefinitions() => DefaultPlans;

    private static PlanLimitDefinition Limit(BillingLimitMetric metric, long? limit, string window, string enforcement, string notes)
        => new(metric, limit, window, enforcement, notes);

    private static BillingPlanDefinitionResult ToResult(PlanDefinition plan)
        => new(
            plan.Plan.ToString(),
            plan.DisplayName,
            plan.Description,
            plan.IsPublic,
            plan.SortOrder,
            plan.BillingProviderPlanReference,
            plan.Limits.Select(limit => ToResult(limit, null, null)).ToList());

    private static BillingPlanDefinitionResult ToResult(BillingPlan plan)
        => new(
            plan.Plan.ToString(),
            plan.DisplayName,
            plan.Description,
            plan.IsPublic,
            plan.SortOrder,
            plan.BillingProviderPlanReference,
            plan.Limits
                .OrderBy(x => x.Metric)
                .Select(limit => ToResult(new PlanLimitDefinition(limit.Metric, limit.Limit, limit.Window, limit.Enforcement, limit.Notes), null, null))
                .ToList());

    internal static BillingPlanLimitResult ToResult(PlanLimitDefinition limit, long? used, long? remaining)
        => new(
            limit.Metric.ToString(),
            PlanLimitExceededException.DisplayName(limit.Metric),
            limit.Limit,
            limit.Window,
            limit.Enforcement,
            limit.Notes,
            used,
            remaining,
            limit.Limit is null);

    internal sealed record PlanDefinition(
        SubscriptionPlan Plan,
        string DisplayName,
        string Description,
        bool IsPublic,
        int SortOrder,
        string BillingProviderPlanReference,
        IReadOnlyList<PlanLimitDefinition> Limits);

    internal sealed record PlanLimitDefinition(
        BillingLimitMetric Metric,
        long? Limit,
        string Window,
        string Enforcement,
        string Notes);
}

public sealed class UsageMeteringService(
    IScoutDbContext dbContext,
    IClock clock,
    IBillingPlanCatalog planCatalog)
    : IUsageMeteringService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task RecordAsync(UsageRecordInput input, CancellationToken cancellationToken, bool saveImmediately = true)
    {
        if (input.Quantity <= 0)
        {
            return;
        }

        var utcNow = clock.UtcNow;
        var (windowStart, windowEnd) = GetCurrentMonthlyWindow(utcNow);
        dbContext.BillingUsageRecords.Add(BillingUsageRecord.Create(
            input.TenantId,
            input.WorkspaceId,
            input.Metric,
            input.Quantity,
            windowStart,
            windowEnd,
            input.Source,
            JsonSerializer.Serialize(input.Dimensions ?? new { }, JsonOptions),
            utcNow));

        if (saveImmediately)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<BillingUsageOverviewResult> GetUsageOverviewAsync(string tenantSlug, CancellationToken cancellationToken)
    {
        var normalizedSlug = tenantSlug.Trim().ToLowerInvariant();
        var tenant = await dbContext.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Slug == normalizedSlug, cancellationToken)
            ?? throw new InvalidOperationException($"Tenant '{tenantSlug}' was not found.");
        var subscription = await GetActiveSubscriptionAsync(tenant.Id, cancellationToken);
        var plan = subscription?.Plan ?? SubscriptionPlan.Free;
        var planDefinition = await planCatalog.GetPlanAsync(plan, cancellationToken);
        var limits = ToLimitDefinitions(planDefinition);
        var (windowStart, windowEnd) = GetCurrentMonthlyWindow(clock.UtcNow);
        var usageByMetric = await dbContext.BillingUsageRecords
            .AsNoTracking()
            .Where(x => x.TenantId == tenant.Id && x.WindowStartUtc >= windowStart && x.WindowEndUtc <= windowEnd)
            .GroupBy(x => x.Metric)
            .Select(group => new { Metric = group.Key, Quantity = group.Sum(x => x.Quantity) })
            .ToDictionaryAsync(x => x.Metric, x => x.Quantity, cancellationToken);
        var resourceUsage = await GetResourceUsageAsync(tenant.Id, cancellationToken);

        var limitResults = limits
            .Select(limit =>
            {
                var used = GetUsed(limit.Metric, usageByMetric, resourceUsage);
                var remaining = limit.Limit is null ? (long?)null : Math.Max(0, limit.Limit.Value - used);
                return BillingPlanCatalog.ToResult(limit, used, remaining);
            })
            .ToList();
        var meteredUsage = limits
            .Where(limit => ToUsageMetric(limit.Metric).HasValue)
            .Select(limit =>
            {
                var used = GetUsed(limit.Metric, usageByMetric, resourceUsage);
                return new BillingUsageMetricResult(
                    limit.Metric.ToString(),
                    PlanLimitExceededException.DisplayName(limit.Metric),
                    used,
                    limit.Limit,
                    limit.Limit is null ? null : Math.Max(0, limit.Limit.Value - used),
                    limit.Window,
                    windowStart,
                    windowEnd);
            })
            .ToList();

        var retentionDays = (int)(limits.FirstOrDefault(x => x.Metric == BillingLimitMetric.RetentionDays)?.Limit ?? 0);
        return new BillingUsageOverviewResult(
            tenant.Id,
            tenant.Slug,
            tenant.Name,
            plan.ToString(),
            subscription?.Status.ToString() ?? SubscriptionStatus.Trialing.ToString(),
            windowStart,
            subscription?.CurrentPeriodEndsAtUtc ?? windowEnd,
            retentionDays,
            limitResults,
            meteredUsage,
            "NotConnected");
    }

    internal static (DateTime WindowStartUtc, DateTime WindowEndUtc) GetCurrentMonthlyWindow(DateTime utcNow)
    {
        var start = new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        return (start, start.AddMonths(1));
    }

    internal static BillingUsageMetric? ToUsageMetric(BillingLimitMetric metric) => metric switch
    {
        BillingLimitMetric.ContextLookups => BillingUsageMetric.ContextLookup,
        BillingLimitMetric.Recomputations => BillingUsageMetric.RecomputeRequested,
        BillingLimitMetric.SourceEvents => BillingUsageMetric.SourceEventIngested,
        BillingLimitMetric.BlueprintImports => BillingUsageMetric.BlueprintImported,
        _ => null
    };

    internal static IReadOnlyList<BillingPlanCatalog.PlanLimitDefinition> ToLimitDefinitions(BillingPlanDefinitionResult plan)
        => plan.Limits
            .Select(limit => new BillingPlanCatalog.PlanLimitDefinition(
                Enum.Parse<BillingLimitMetric>(limit.Metric),
                limit.Limit,
                limit.Window,
                limit.Enforcement,
                limit.Notes))
            .ToList();

    private async Task<TenantSubscription?> GetActiveSubscriptionAsync(Guid tenantId, CancellationToken cancellationToken)
        => await dbContext.TenantSubscriptions
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.Status != SubscriptionStatus.Cancelled)
            .OrderByDescending(x => x.StartedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);

    private async Task<Dictionary<BillingLimitMetric, long>> GetResourceUsageAsync(Guid tenantId, CancellationToken cancellationToken)
        => new()
        {
            [BillingLimitMetric.Tenants] = 1,
            [BillingLimitMetric.Workspaces] = await dbContext.Workspaces.CountAsync(x => x.TenantId == tenantId && x.Status == WorkspaceStatus.Active, cancellationToken),
            [BillingLimitMetric.Users] = await dbContext.OperatorAccounts.CountAsync(x => x.TenantId == tenantId, cancellationToken),
            [BillingLimitMetric.ApiClients] = await dbContext.ApiClients.CountAsync(x => x.TenantId == tenantId && x.Status == ApiClientStatus.Active, cancellationToken),
            [BillingLimitMetric.Selectors] = await dbContext.SelectorDefinitions.CountAsync(x => x.TenantId == tenantId && x.Status != SelectorStatus.Disabled, cancellationToken)
        };

    private static long GetUsed(
        BillingLimitMetric metric,
        IReadOnlyDictionary<BillingUsageMetric, long> usageByMetric,
        IReadOnlyDictionary<BillingLimitMetric, long> resourceUsage)
    {
        if (resourceUsage.TryGetValue(metric, out var resourceCount))
        {
            return resourceCount;
        }

        var usageMetric = ToUsageMetric(metric);
        return usageMetric.HasValue && usageByMetric.TryGetValue(usageMetric.Value, out var quantity) ? quantity : 0;
    }
}

public sealed class BillingEnforcementService(
    IScoutDbContext dbContext,
    IClock clock,
    IBillingPlanCatalog planCatalog)
    : IBillingEnforcementService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task EnsureWithinLimitAsync(
        Guid tenantId,
        BillingLimitMetric metric,
        long requestedQuantity,
        CancellationToken cancellationToken,
        Guid? workspaceId = null)
    {
        var tenant = await dbContext.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == tenantId, cancellationToken)
            ?? throw new InvalidOperationException("Tenant was not found.");
        var subscription = await dbContext.TenantSubscriptions
            .AsNoTracking()
            .Where(x => x.TenantId == tenantId && x.Status != SubscriptionStatus.Cancelled)
            .OrderByDescending(x => x.StartedAtUtc)
            .FirstOrDefaultAsync(cancellationToken);
        var plan = subscription?.Plan ?? SubscriptionPlan.Free;
        var planDefinition = await planCatalog.GetPlanAsync(plan, cancellationToken);
        var limit = UsageMeteringService.ToLimitDefinitions(planDefinition).FirstOrDefault(x => x.Metric == metric);
        if (limit is null || limit.Limit is null)
        {
            return;
        }

        var currentUsage = await GetCurrentUsageAsync(tenantId, metric, cancellationToken);
        if (currentUsage + requestedQuantity <= limit.Limit.Value)
        {
            return;
        }

        var utcNow = clock.UtcNow;
        dbContext.AuditEvents.Add(AuditEvent.Create(
            tenantId,
            "system",
            "billing.limit_exceeded",
            "Billing",
            metric.ToString(),
            Guid.NewGuid().ToString("N"),
            JsonSerializer.Serialize(new
            {
                tenantSlug = tenant.Slug,
                workspaceId,
                plan = plan.ToString(),
                metric = metric.ToString(),
                limit = limit.Limit.Value,
                currentUsage,
                requestedQuantity
            }, JsonOptions),
            null,
            null,
            utcNow));
        await dbContext.SaveChangesAsync(cancellationToken);
        throw new PlanLimitExceededException(tenant.Slug, plan, metric, limit.Limit.Value, currentUsage, requestedQuantity);
    }

    private async Task<long> GetCurrentUsageAsync(Guid tenantId, BillingLimitMetric metric, CancellationToken cancellationToken)
    {
        var usageMetric = UsageMeteringService.ToUsageMetric(metric);
        if (usageMetric.HasValue)
        {
            var (windowStart, windowEnd) = UsageMeteringService.GetCurrentMonthlyWindow(clock.UtcNow);
            return await dbContext.BillingUsageRecords
                .AsNoTracking()
                .Where(x => x.TenantId == tenantId && x.Metric == usageMetric.Value && x.WindowStartUtc >= windowStart && x.WindowEndUtc <= windowEnd)
                .SumAsync(x => x.Quantity, cancellationToken);
        }

        return metric switch
        {
            BillingLimitMetric.Tenants => 1,
            BillingLimitMetric.Workspaces => await dbContext.Workspaces.CountAsync(x => x.TenantId == tenantId && x.Status == WorkspaceStatus.Active, cancellationToken),
            BillingLimitMetric.Users => await dbContext.OperatorAccounts.CountAsync(x => x.TenantId == tenantId, cancellationToken),
            BillingLimitMetric.ApiClients => await dbContext.ApiClients.CountAsync(x => x.TenantId == tenantId && x.Status == ApiClientStatus.Active, cancellationToken),
            BillingLimitMetric.Selectors => await dbContext.SelectorDefinitions.CountAsync(x => x.TenantId == tenantId && x.Status != SelectorStatus.Disabled, cancellationToken),
            _ => 0
        };
    }
}

public sealed class NoopBillingProviderGateway : IBillingProviderGateway
{
    public string ProviderName => "not-configured";

    public Task<BillingProviderCustomerResult> EnsureCustomerAsync(BillingProviderCustomerRequest request, CancellationToken cancellationToken)
        => Task.FromResult(new BillingProviderCustomerResult(ProviderName, string.Empty, "No billing provider is configured in the open-source repo."));

    public Task<BillingProviderCheckoutResult> CreateCheckoutAsync(BillingProviderCheckoutRequest request, CancellationToken cancellationToken)
        => Task.FromResult(new BillingProviderCheckoutResult(ProviderName, string.Empty, "Checkout is disabled until Stripe or Paddle is plugged in."));

    public Task<BillingProviderPortalResult> CreatePortalAsync(BillingProviderPortalRequest request, CancellationToken cancellationToken)
        => Task.FromResult(new BillingProviderPortalResult(ProviderName, string.Empty, "Billing portal is disabled until Stripe or Paddle is plugged in."));
}
