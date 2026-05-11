using System.Text.Json;
using ContextLayer.Application.Abstractions;
using ContextLayer.Domain.Constants;
using ContextLayer.Domain.Entities;
using ContextLayer.Domain.Enums;
using ContextLayer.Domain.Saas;
using ContextLayer.Infrastructure.Auth;
using ContextLayer.Infrastructure.Jobs;
using ContextLayer.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ContextLayer.Infrastructure.Seed;

public static class DemoDataSeeder
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static async Task SeedAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken = default)
    {
        await using var scope = serviceProvider.CreateAsyncScope();
        var contextDbContext = scope.ServiceProvider.GetRequiredService<ContextLayerDbContext>();
        var customerOpsDbContext = scope.ServiceProvider.GetRequiredService<CustomerOpsDbContext>();
        var clock = scope.ServiceProvider.GetRequiredService<IClock>();
        var passwordHashingService = scope.ServiceProvider.GetRequiredService<PasswordHashingService>();
        var processor = scope.ServiceProvider.GetRequiredService<ContextRecomputeProcessor>();

        await MigrateAsync(contextDbContext, cancellationToken);
        await MigrateAsync(customerOpsDbContext, cancellationToken);

        var hasContextData = await contextDbContext.Tenants.AnyAsync(cancellationToken);
        var hasOperationalData = await customerOpsDbContext.CustomerOpsTenants.AnyAsync(cancellationToken);
        if (hasContextData && hasOperationalData)
        {
            return;
        }

        var utcNow = clock.UtcNow;
        var scenarios = BuildAccountScenarios();

        await SeedOperationalDatabaseAsync(customerOpsDbContext, scenarios, utcNow, cancellationToken);
        await SeedContextLayerDatabaseAsync(contextDbContext, customerOpsDbContext, passwordHashingService, processor, utcNow, cancellationToken);
    }

    private static async Task MigrateAsync(DbContext dbContext, CancellationToken cancellationToken)
    {
        if (string.Equals(dbContext.Database.ProviderName, "Npgsql.EntityFrameworkCore.PostgreSQL", StringComparison.Ordinal))
        {
            await dbContext.Database.MigrateAsync(cancellationToken);
        }
        else
        {
            await dbContext.Database.EnsureCreatedAsync(cancellationToken);
        }
    }

    private static async Task SeedOperationalDatabaseAsync(
        CustomerOpsDbContext dbContext,
        IReadOnlyList<AccountScenario> scenarios,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        var tenants = new Dictionary<string, CustomerOpsTenant>(StringComparer.OrdinalIgnoreCase)
        {
            ["demo"] = CustomerOpsTenant.Create("demo", "Demo Sales Workspace", utcNow),
            ["summit"] = CustomerOpsTenant.Create("summit", "Summit Commercial Workspace", utcNow)
        };

        dbContext.CustomerOpsTenants.AddRange(tenants.Values);

        var product = ProductCatalogItem.Create("CTX-SALES", "Context Layer Sales Copilot", "revenue-ai", utcNow);
        var plans = new[]
        {
            ProductPlan.Create(product.Id, "STARTER", "Starter", "starter", 299m, 3_000m, 10, utcNow),
            ProductPlan.Create(product.Id, "GROWTH", "Growth", "growth", 1_250m, 13_500m, 50, utcNow),
            ProductPlan.Create(product.Id, "ENTERPRISE", "Enterprise", "enterprise", 4_950m, 54_000m, 150, utcNow)
        };

        dbContext.ProductCatalogItems.Add(product);
        dbContext.ProductPlans.AddRange(plans);

        var firstNames = new[]
        {
            "Avery", "Morgan", "Jordan", "Taylor", "Riley", "Parker", "Quinn", "Rowan", "Elliot", "Skyler",
            "Harper", "Reese", "Dakota", "Logan", "Cameron", "Milan", "Kendall", "Sage", "Phoenix", "Sawyer"
        };
        var lastNames = new[]
        {
            "Stone", "Mercer", "Kim", "Alvarez", "Patel", "Brooks", "Diaz", "Bell", "Nguyen", "Reyes",
            "Morrison", "Campbell", "Turner", "Walsh", "Bennett", "Foster", "Chambers", "Nwosu", "Petrov", "Reese"
        };
        var departments = new[] { "Revenue", "Operations", "Success", "Marketing", "Product", "Finance" };
        var workspaceRoles = new[] { "admin", "manager", "member", "champion" };

        var accounts = new List<CustomerAccount>();
        var contacts = new List<CustomerContact>();
        var users = new List<CustomerUser>();
        var subscriptions = new List<CustomerSubscription>();
        var opportunities = new List<SalesOpportunity>();
        var activities = new List<SalesActivity>();
        var emailEvents = new List<EmailEngagementEvent>();
        var supportTickets = new List<SupportTicket>();
        var usageSummaries = new List<ProductUsageSummary>();
        var billingMetrics = new List<BillingMetric>();
        var webEvents = new List<WebConversionEvent>();
        var contactSignals = new List<CustomerContactSignal>();
        var emailSignals = new List<CustomerEmailSignal>();
        var contextRollups = new List<CustomerContextRollup>();

        var userIdCounter = 123;
        var contactIdCounter = 10_000;
        var accountIdCounter = 2_000;
        var subscriptionIdCounter = 5_000;
        var opportunityIdCounter = 8_000;
        var ticketIdCounter = 12_000;
        var random = new Random(20260509);

        foreach (var (scenario, index) in scenarios.Select((item, index) => (item, index)))
        {
            var tenant = tenants[scenario.TenantSlug];
            var account = CustomerAccount.Create(
                tenant.Id,
                $"ACC-{accountIdCounter++:0000}",
                scenario.AccountName,
                scenario.Domain,
                scenario.Industry,
                scenario.Segment,
                scenario.Region,
                scenario.LifecycleStage,
                scenario.AccountOwner,
                scenario.EmployeeCount,
                scenario.AnnualRevenue,
                utcNow);
            accounts.Add(account);

            var primaryExternalUserId = scenario.PrimaryExternalUserId ?? userIdCounter.ToString();
            if (scenario.PrimaryExternalUserId is null)
            {
                userIdCounter++;
            }
            else
            {
                userIdCounter = Math.Max(userIdCounter + 1, int.Parse(scenario.PrimaryExternalUserId, System.Globalization.CultureInfo.InvariantCulture) + 1);
            }

            var primaryContact = CustomerContact.Create(
                tenant.Id,
                account.Id,
                $"CON-{contactIdCounter++:0000}",
                primaryExternalUserId,
                scenario.PrimaryContactName,
                $"{NormalizeEmail(scenario.PrimaryContactName)}@{scenario.Domain}",
                scenario.PrimaryJobTitle,
                scenario.StakeholderSeniority,
                scenario.Department,
                scenario.PreferredChannel,
                scenario.IsDecisionMaker,
                utcNow);
            contacts.Add(primaryContact);

            var primaryUser = CustomerUser.Create(
                tenant.Id,
                account.Id,
                primaryContact.Id,
                primaryContact.ExternalUserId,
                "admin",
                utcNow.AddDays(-Math.Max(14, scenario.ActiveDays30)),
                utcNow.AddMinutes(-random.Next(10, 180)),
                scenario.TrialActivatedRecently,
                utcNow);
            users.Add(primaryUser);

            var contactCount = index < 20 ? 3 : 2;
            for (var contactIndex = 1; contactIndex < contactCount; contactIndex++)
            {
                var fullName = $"{firstNames[(index + contactIndex) % firstNames.Length]} {lastNames[(index * 3 + contactIndex) % lastNames.Length]}";
                var seniority = contactIndex == 1 ? "director" : "manager";
                var contact = CustomerContact.Create(
                    tenant.Id,
                    account.Id,
                    $"CON-{contactIdCounter++:0000}",
                    userIdCounter.ToString(),
                    fullName,
                    $"{NormalizeEmail(fullName)}@{scenario.Domain}",
                    contactIndex == 1 ? "Director of Revenue Operations" : "Revenue Operations Manager",
                    seniority,
                    departments[(index + contactIndex) % departments.Length],
                    contactIndex == 1 ? scenario.PreferredChannel : "email",
                    contactIndex == 1 && scenario.IsDecisionMaker,
                    utcNow);
                contacts.Add(contact);
                users.Add(CustomerUser.Create(
                    tenant.Id,
                    account.Id,
                    contact.Id,
                    contact.ExternalUserId,
                    workspaceRoles[(index + contactIndex) % workspaceRoles.Length],
                    utcNow.AddDays(-Math.Max(10, scenario.ActiveDays30 - 2)),
                    utcNow.AddMinutes(-random.Next(60, 480)),
                    scenario.TrialActivatedRecently && contactIndex == 1,
                    utcNow));
                userIdCounter++;
            }

            var plan = plans.Single(x => x.Tier == scenario.PlanTier);
            var subscription = CustomerSubscription.Create(
                tenant.Id,
                account.Id,
                product.Id,
                plan.Id,
                $"SUB-{subscriptionIdCounter++:0000}",
                scenario.SubscriptionStatus,
                scenario.SeatsPurchased,
                scenario.MonthlyRecurringRevenue,
                utcNow.AddMonths(-6),
                scenario.TrialActivatedRecently ? utcNow.AddDays(12) : null,
                utcNow.AddMonths(6),
                utcNow);
            subscriptions.Add(subscription);

            var opportunityCount = index < 20 ? 2 : 1;
            for (var opportunityIndex = 0; opportunityIndex < opportunityCount; opportunityIndex++)
            {
                opportunities.Add(SalesOpportunity.Create(
                    tenant.Id,
                    account.Id,
                    primaryContact.Id,
                    $"OPP-{opportunityIdCounter++:0000}",
                    opportunityIndex == 0
                        ? $"{scenario.AccountName} {TitleCase(scenario.PlanInterestSignal)} Expansion"
                        : $"{scenario.AccountName} Executive Alignment",
                    opportunityIndex == 0 ? scenario.OpportunityStage : "discovery",
                    opportunityIndex == 0 ? scenario.OpportunityAmount : Math.Round(scenario.OpportunityAmount * 0.45m, 2),
                    opportunityIndex == 0 ? scenario.OpenOpportunityProbability : Math.Max(20, scenario.OpenOpportunityProbability - 18),
                    utcNow.AddDays(14 + opportunityIndex * 21),
                    opportunityIndex == 0 ? "expansion" : "cross-sell",
                    true,
                    utcNow));
            }

            var activityCount = index < 20 ? 7 : 6;
            for (var activityIndex = 0; activityIndex < activityCount; activityIndex++)
            {
                var occurredAtUtc = utcNow.AddDays(-activityIndex * 3).AddHours(-random.Next(1, 12));
                var isPositive = activityIndex < Math.Max(2, scenario.RecentSalesActivityScore / 20);
                activities.Add(SalesActivity.Create(
                    tenant.Id,
                    account.Id,
                    primaryContact.Id,
                    activityIndex % 3 == 0 ? "call" : activityIndex % 3 == 1 ? "email" : "meeting",
                    "outbound",
                    isPositive ? "positive_reply" : activityIndex % 2 == 0 ? "no_response" : "follow_up_needed",
                    isPositive
                        ? $"Rep secured momentum around {scenario.RecommendedSalesMotionSignal.Replace('_', ' ')}."
                        : $"Rep noted blockers related to {scenario.LifecycleStage} readiness.",
                    occurredAtUtc,
                    utcNow));
            }

            var supportCount = index < 10 ? 4 : 3;
            for (var supportIndex = 0; supportIndex < supportCount; supportIndex++)
            {
                var isOpen = supportIndex < scenario.OpenSupportTickets30;
                var isSevere = supportIndex < scenario.SevereOpenTickets30;
                supportTickets.Add(SupportTicket.Create(
                    tenant.Id,
                    account.Id,
                    primaryContact.Id,
                    $"TCK-{ticketIdCounter++:0000}",
                    isSevere ? "critical" : supportIndex % 2 == 0 ? "medium" : "low",
                    isOpen ? "open" : "resolved",
                    supportIndex % 2 == 0 ? "integration" : "workflow",
                    isOpen
                        ? $"Open issue affecting {scenario.RecommendedSalesMotionSignal.Replace('_', ' ')} rollout."
                        : $"Resolved onboarding issue for {scenario.AccountName}.",
                    utcNow.AddDays(-(supportIndex + 1) * 4),
                    isOpen ? null : utcNow.AddDays(-(supportIndex + 1) * 3),
                    isOpen ? null : scenario.LatestSatisfactionScore,
                    utcNow));
            }

            var emailReplyGoal = Math.Min(4, Math.Max(0, scenario.RecentSalesActivityScore / 30));
            var emailOpenGoal = Math.Max(2, Math.Min(8, scenario.PricingPageVisits30 / 2 + 2));
            var emailClickGoal = Math.Max(1, Math.Min(5, scenario.PricingPageVisits30 / 3 + 1));
            for (var openIndex = 0; openIndex < emailOpenGoal; openIndex++)
            {
                emailEvents.Add(EmailEngagementEvent.Create(
                    tenant.Id,
                    primaryContact.Id,
                    "Enterprise Expansion Sequence",
                    "open",
                    "email",
                    Serialize(new { subject = "Scaling Context Layer across the revenue team" }),
                    utcNow.AddDays(-openIndex - 1),
                    utcNow));
            }

            for (var clickIndex = 0; clickIndex < emailClickGoal; clickIndex++)
            {
                emailEvents.Add(EmailEngagementEvent.Create(
                    tenant.Id,
                    primaryContact.Id,
                    "Enterprise Expansion Sequence",
                    "click",
                    "email",
                    Serialize(new { destination = "/pricing/enterprise" }),
                    utcNow.AddDays(-clickIndex - 2).AddHours(-2),
                    utcNow));
            }

            for (var replyIndex = 0; replyIndex < emailReplyGoal; replyIndex++)
            {
                emailEvents.Add(EmailEngagementEvent.Create(
                    tenant.Id,
                    primaryContact.Id,
                    "Executive Outreach",
                    replyIndex == 0 && scenario.TrialActivatedRecently ? "meeting_booked" : "reply",
                    "email",
                    Serialize(new { sentiment = replyIndex == 0 ? "engaged" : "interested" }),
                    utcNow.AddDays(-replyIndex - 3).AddHours(-4),
                    utcNow));
            }

            for (var billingIndex = 0; billingIndex < 4; billingIndex++)
            {
                billingMetrics.Add(BillingMetric.Create(
                    tenant.Id,
                    account.Id,
                    utcNow.Date.AddMonths(-billingIndex),
                    scenario.MonthlyRecurringRevenue,
                    scenario.MonthlyRecurringRevenue * 12,
                    Math.Max(0, scenario.DaysPastDue - billingIndex * 2),
                    billingIndex == 0 ? scenario.PaymentFailures30 : Math.Max(0, scenario.PaymentFailures30 - 1),
                    billingIndex == 0 ? scenario.ExpansionSeatDelta : Math.Max(0, scenario.ExpansionSeatDelta - billingIndex * 2),
                    scenario.PaymentFailures30 > 1 || scenario.DaysPastDue > 15 ? "watch" : "healthy",
                    utcNow));
            }

            var pricingPageEvents = Math.Max(2, scenario.PricingPageVisits30);
            for (var webIndex = 0; webIndex < pricingPageEvents; webIndex++)
            {
                webEvents.Add(WebConversionEvent.Create(
                    tenant.Id,
                    account.Id,
                    primaryContact.Id,
                    webIndex % 4 == 0 ? "trial_activated" : "pricing_viewed",
                    webIndex % 4 == 0 ? "trial-start" : "pricing",
                    "enterprise-demand",
                    webIndex % 2 == 0 ? "google" : "email",
                    12m + webIndex,
                    utcNow.AddDays(-Math.Min(webIndex, 25)).AddHours(-webIndex),
                    utcNow));
            }

            foreach (var user in users.Where(x => x.CustomerAccountId == account.Id).ToList())
            {
                var contact = contacts.Single(x => x.Id == user.CustomerContactId);
                for (var dayIndex = 0; dayIndex < 7; dayIndex++)
                {
                    var isPrimaryUser = user.Id == primaryUser.Id;
                    var usageFactor = isPrimaryUser ? 1m : 0.72m;
                    var activeDays = Math.Max(2, (int)Math.Round(scenario.ActiveDays30 * usageFactor) - dayIndex);
                    var sessions = Math.Max(1, (int)Math.Round(scenario.Sessions7d * usageFactor) - dayIndex);
                    var featureEvents = Math.Max(1, (int)Math.Round(scenario.KeyFeatureEvents7d * usageFactor) - (dayIndex * 2));
                    var automationRuns = Math.Max(0, (int)Math.Round(scenario.AutomationRuns30 * usageFactor) - (dayIndex * 3));
                    var seatsUsed = Math.Max(1, (int)Math.Round(scenario.SeatsUsed * (isPrimaryUser ? 1m : 0.65m)));
                    var featureAdoption = Math.Max(20, scenario.FeatureAdoptionScore - dayIndex * 3 - (isPrimaryUser ? 0 : 10));
                    usageSummaries.Add(ProductUsageSummary.Create(
                        tenant.Id,
                        account.Id,
                        contact.Id,
                        utcNow.Date.AddDays(-dayIndex),
                        activeDays,
                        sessions,
                        featureEvents,
                        Math.Max(0, scenario.PricingPageVisits30 - dayIndex),
                        automationRuns,
                        seatsUsed,
                        scenario.SeatsPurchased,
                        featureAdoption,
                        utcNow));
                }
            }
        }

        dbContext.CustomerAccounts.AddRange(accounts);
        dbContext.CustomerContacts.AddRange(contacts);
        dbContext.CustomerUsers.AddRange(users);
        dbContext.CustomerSubscriptions.AddRange(subscriptions);
        dbContext.SalesOpportunities.AddRange(opportunities);
        dbContext.SalesActivities.AddRange(activities);
        dbContext.EmailEngagementEvents.AddRange(emailEvents);
        dbContext.SupportTickets.AddRange(supportTickets);
        dbContext.ProductUsageSummaries.AddRange(usageSummaries);
        dbContext.BillingMetrics.AddRange(billingMetrics);
        dbContext.WebConversionEvents.AddRange(webEvents);

        foreach (var user in users)
        {
            var contact = contacts.Single(x => x.Id == user.CustomerContactId);
            var account = accounts.Single(x => x.Id == user.CustomerAccountId);
            var latestUsage = usageSummaries
                .Where(x => x.CustomerContactId == contact.Id)
                .OrderByDescending(x => x.SummaryDateUtc)
                .First();
            var contactEmailEvents = emailEvents.Where(x => x.CustomerContactId == contact.Id).ToList();
            var openCount = contactEmailEvents.Count(x => x.EventType == "open" && x.OccurredAtUtc >= utcNow.AddDays(-30));
            var clickCount = contactEmailEvents.Count(x => x.EventType == "click" && x.OccurredAtUtc >= utcNow.AddDays(-30));
            var replyCount = contactEmailEvents.Count(x => (x.EventType == "reply" || x.EventType == "meeting_booked") && x.OccurredAtUtc >= utcNow.AddDays(-30));
            var accountTickets = supportTickets.Where(x => x.CustomerAccountId == account.Id && x.OpenedAtUtc >= utcNow.AddDays(-30)).ToList();
            var openSupportCount = accountTickets.Count(x => x.Status == "open");
            var severeOpenSupportCount = accountTickets.Count(x => x.Status == "open" && x.Severity == "critical");
            var latestSatisfaction = accountTickets.Where(x => x.SatisfactionScore.HasValue).Select(x => x.SatisfactionScore!.Value).DefaultIfEmpty(8).Max();
            var latestBilling = billingMetrics.Where(x => x.CustomerAccountId == account.Id).OrderByDescending(x => x.MetricDateUtc).First();
            var openOpportunities = opportunities.Where(x => x.CustomerAccountId == account.Id && x.IsOpen).ToList();
            var openOpportunityProbability = openOpportunities.Select(x => x.ProbabilityPercent).DefaultIfEmpty(0).Max();
            var recentActivities = activities.Where(x => x.CustomerAccountId == account.Id && x.OccurredAtUtc >= utcNow.AddDays(-30)).ToList();
            var positiveActivityCount = recentActivities.Count(x => x.Outcome == "positive_reply");
            var recentSalesActivityScore = Math.Clamp((positiveActivityCount * 20) + (recentActivities.Count * 5), 0, 100);
            var pricingPageVisits = webEvents.Count(x => x.CustomerContactId == contact.Id && x.Page == "pricing" && x.OccurredAtUtc >= utcNow.AddDays(-30));
            var trialActivatedRecently = webEvents.Any(x => x.CustomerContactId == contact.Id && x.EventType == "trial_activated" && x.OccurredAtUtc >= utcNow.AddDays(-21));
            var seatUtilizationRatio = latestUsage.SeatsPurchased == 0
                ? 0m
                : Math.Round((decimal)latestUsage.SeatsUsed / latestUsage.SeatsPurchased, 4);
            var enterpriseInterestScore = Math.Clamp(
                pricingPageVisits * 7
                + (openOpportunityProbability / 2)
                + (replyCount * 6)
                + (latestUsage.FeatureAdoptionScore / 4)
                + (latestBilling.MonthlyRecurringRevenue >= 4_000m ? 12 : 0),
                0,
                100);
            var productFitScore = Math.Clamp(
                (int)Math.Round(latestUsage.FeatureAdoptionScore * 0.45m)
                + latestUsage.ActiveDays30
                + (latestSatisfaction * 3)
                - (severeOpenSupportCount * 10),
                0,
                100);
            var budgetReadinessScore = Math.Clamp(
                35
                + (latestBilling.MonthlyRecurringRevenue >= 4_000m ? 20 : 8)
                + (openOpportunityProbability / 3)
                + (latestBilling.ExpansionSeatDelta * 2)
                - (latestBilling.DaysPastDue * 2)
                - (latestBilling.PaymentFailures30d * 18),
                0,
                100);
            var supportDragScore = Math.Clamp(
                (openSupportCount * 10)
                + (severeOpenSupportCount * 20)
                + (latestSatisfaction < 7 ? 10 : 0),
                0,
                100);
            var activityScore = Math.Clamp(
                (int)Math.Round((latestUsage.FeatureAdoptionScore * 0.35m)
                + (latestUsage.ActiveDays30 * 1.5m)
                + (recentSalesActivityScore * 0.2m)
                + (replyCount * 5m)
                + (pricingPageVisits * 2m)
                - (supportDragScore * 0.25m)),
                0,
                100);
            var planInterestSignal =
                enterpriseInterestScore >= 70 || latestBilling.MonthlyRecurringRevenue >= 4_000m
                    ? "enterprise"
                    : enterpriseInterestScore >= 40 ? "growth" : "starter";
            var recommendedSalesMotionSignal =
                supportDragScore >= 45
                    ? "save_at_risk"
                    : trialActivatedRecently || openOpportunityProbability >= 70
                        ? "accelerate_enterprise"
                        : seatUtilizationRatio >= 0.85m
                            ? "expand_multithread"
                            : "nurture_value";
            var recentFeatureAdoptionSignal =
                latestUsage.FeatureAdoptionScore >= 85 && latestUsage.AutomationRuns30d >= 60
                    ? "deepening"
                    : latestUsage.FeatureAdoptionScore >= 65
                        ? "expanding"
                        : latestUsage.FeatureAdoptionScore >= 45 ? "steady" : "stalled";
            var salesUrgencyScore = Math.Clamp(
                (trialActivatedRecently ? 35 : 0)
                + (openOpportunityProbability / 2)
                + (pricingPageVisits * 3)
                + (replyCount * 7),
                0,
                100);

            contactSignals.Add(CustomerContactSignal.Create(
                account.CustomerOpsTenantId,
                tenants[account.CustomerOpsTenantId == tenants["demo"].Id ? "demo" : "summit"].Slug,
                contact.ExternalUserId,
                contact.PreferredChannel,
                contact.Seniority,
                ComputeDecisionMakerLikelihood(contact),
                user.LastSeenAtUtc ?? utcNow,
                utcNow));
            emailSignals.Add(CustomerEmailSignal.Create(
                account.CustomerOpsTenantId,
                tenants[account.CustomerOpsTenantId == tenants["demo"].Id ? "demo" : "summit"].Slug,
                contact.ExternalUserId,
                replyCount > 0 || clickCount > openCount / 2 ? "email" : contact.PreferredChannel,
                openCount,
                clickCount,
                replyCount,
                contactEmailEvents.Select(x => x.OccurredAtUtc).DefaultIfEmpty(user.LastSeenAtUtc ?? utcNow).Max(),
                utcNow));
            contextRollups.Add(CustomerContextRollup.Create(
                account.CustomerOpsTenantId,
                tenants[account.CustomerOpsTenantId == tenants["demo"].Id ? "demo" : "summit"].Slug,
                contact.ExternalUserId,
                planInterestSignal,
                activityScore,
                latestUsage.ActiveDays30,
                pricingPageVisits,
                latestUsage.AutomationRuns30d,
                seatUtilizationRatio,
                latestUsage.FeatureAdoptionScore,
                openSupportCount,
                severeOpenSupportCount,
                latestSatisfaction,
                latestBilling.MonthlyRecurringRevenue,
                latestBilling.DaysPastDue,
                latestBilling.PaymentFailures30d,
                latestBilling.ExpansionSeatDelta,
                openOpportunityProbability,
                recentSalesActivityScore,
                trialActivatedRecently,
                enterpriseInterestScore,
                productFitScore,
                budgetReadinessScore,
                recommendedSalesMotionSignal,
                recentFeatureAdoptionSignal,
                salesUrgencyScore,
                supportDragScore,
                user.LastSeenAtUtc ?? utcNow,
                utcNow));
        }

        dbContext.CustomerContactSignals.AddRange(contactSignals);
        dbContext.CustomerEmailSignals.AddRange(emailSignals);
        dbContext.CustomerContextRollups.AddRange(contextRollups);

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedContextLayerDatabaseAsync(
        ContextLayerDbContext contextDbContext,
        CustomerOpsDbContext customerOpsDbContext,
        PasswordHashingService passwordHashingService,
        ContextRecomputeProcessor processor,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        var opsTenants = await customerOpsDbContext.CustomerOpsTenants
            .AsNoTracking()
            .OrderBy(x => x.Slug)
            .ToListAsync(cancellationToken);
        var contacts = await customerOpsDbContext.CustomerContacts
            .AsNoTracking()
            .Include(x => x.Account)
            .OrderBy(x => x.ExternalUserId)
            .ToListAsync(cancellationToken);
        var customerUsers = await customerOpsDbContext.CustomerUsers
            .AsNoTracking()
            .OrderBy(x => x.ExternalUserId)
            .ToListAsync(cancellationToken);

        var tenants = new List<Tenant>();
        var operatorAccounts = new List<OperatorAccount>();
        var userProfiles = new List<UserProfile>();
        var dataSources = new List<DataSource>();
        var attributes = new List<SemanticAttributeDefinition>();
        var selectors = new List<SelectorDefinition>();
        var promptTemplates = new List<PromptTemplate>();
        var workspaces = new List<Workspace>();
        var workspaceMembers = new List<WorkspaceMember>();
        var billingPlans = CreateBillingPlans(utcNow);
        var billingPlanLimits = CreateBillingPlanLimits(billingPlans, utcNow);
        var subscriptions = new List<TenantSubscription>();
        var apiClients = new List<ApiClient>();
        var connectorInstallations = new List<ConnectorInstallation>();
        var onboardingStates = new List<OnboardingState>();
        var billingUsageRecords = new List<BillingUsageRecord>();
        var workspaceByTenantId = new Dictionary<Guid, Workspace>();

        foreach (var opsTenant in opsTenants)
        {
            var tenant = Tenant.Create(opsTenant.Slug, opsTenant.Name, utcNow);
            tenants.Add(tenant);
            var workspace = Workspace.Create(
                tenant.Id,
                "default",
                opsTenant.Slug == "demo" ? "Demo Revenue Workspace" : "Summit Commercial Workspace",
                "Default workspace for the fictional local demo tenant.",
                true,
                utcNow);
            workspaces.Add(workspace);
            workspaceByTenantId[tenant.Id] = workspace;

            if (opsTenant.Slug == "demo")
            {
                operatorAccounts.Add(OperatorAccount.Create(tenant.Id, "owner@contextlayer.local", "Pat Quinn", passwordHashingService.HashPassword("DemoOwner123!"), OperatorRole.PlatformOwner, utcNow));
                operatorAccounts.Add(OperatorAccount.Create(tenant.Id, "admin@contextlayer.local", "Dana Mercer", passwordHashingService.HashPassword("DemoAdmin123!"), OperatorRole.TenantAdmin, utcNow));
                operatorAccounts.Add(OperatorAccount.Create(tenant.Id, "integrations@contextlayer.local", "Riley Chen", passwordHashingService.HashPassword("DemoIntegrations123!"), OperatorRole.IntegrationAdmin, utcNow));
                operatorAccounts.Add(OperatorAccount.Create(tenant.Id, "analyst@contextlayer.local", "Morgan Lee", passwordHashingService.HashPassword("DemoAnalyst123!"), OperatorRole.Analyst, utcNow));
                operatorAccounts.Add(OperatorAccount.Create(tenant.Id, "rep@contextlayer.local", "Jordan Kim", passwordHashingService.HashPassword("DemoSales123!"), OperatorRole.SalesUser, utcNow));
                operatorAccounts.Add(OperatorAccount.Create(tenant.Id, "readonly@contextlayer.local", "Taylor Brooks", passwordHashingService.HashPassword("DemoReadOnly123!"), OperatorRole.ReadOnly, utcNow));
            }
            else
            {
                operatorAccounts.Add(OperatorAccount.Create(tenant.Id, "admin@summit.contextlayer.local", "Maya Sullivan", passwordHashingService.HashPassword("SummitAdmin123!"), OperatorRole.TenantAdmin, utcNow));
                operatorAccounts.Add(OperatorAccount.Create(tenant.Id, "integrations@summit.contextlayer.local", "Avery Patel", passwordHashingService.HashPassword("SummitIntegrations123!"), OperatorRole.IntegrationAdmin, utcNow));
                operatorAccounts.Add(OperatorAccount.Create(tenant.Id, "analyst@summit.contextlayer.local", "Casey Nguyen", passwordHashingService.HashPassword("SummitAnalyst123!"), OperatorRole.Analyst, utcNow));
                operatorAccounts.Add(OperatorAccount.Create(tenant.Id, "rep@summit.contextlayer.local", "Leo Grant", passwordHashingService.HashPassword("SummitSales123!"), OperatorRole.SalesUser, utcNow));
                operatorAccounts.Add(OperatorAccount.Create(tenant.Id, "readonly@summit.contextlayer.local", "Jamie Walsh", passwordHashingService.HashPassword("SummitReadOnly123!"), OperatorRole.ReadOnly, utcNow));
            }

            var tenantOperators = operatorAccounts.Where(x => x.TenantId == tenant.Id).ToList();
            workspaceMembers.AddRange(tenantOperators.Select(account => WorkspaceMember.Create(
                tenant.Id,
                workspace.Id,
                account.Id,
                account.Role is OperatorRole.PlatformOwner or OperatorRole.TenantAdmin or OperatorRole.IntegrationAdmin
                    ? WorkspaceMemberRole.Admin
                    : account.Role == OperatorRole.ReadOnly ? WorkspaceMemberRole.Viewer : WorkspaceMemberRole.Member,
                utcNow)));
            subscriptions.Add(TenantSubscription.Create(
                tenant.Id,
                opsTenant.Slug == "demo" ? SubscriptionPlan.Pro : SubscriptionPlan.Business,
                SubscriptionStatus.Active,
                $"demo-billing-{tenant.Slug}",
                Serialize(new
                {
                    mode = "fictional-demo",
                    maxWorkspaces = 1,
                    maxApiClients = 2,
                    maxConnectors = 5,
                    hostedBilling = false
                }),
                utcNow.AddDays(-14),
                null,
                utcNow.AddMonths(1),
                utcNow));
            apiClients.Add(ApiClient.Create(
                tenant.Id,
                workspace.Id,
                tenant.Slug == "demo" ? "svc-demo-admin" : "svc-summit-admin",
                tenant.Slug == "demo" ? "Demo Service Client" : "Summit Service Client",
                passwordHashingService.HashPassword(tenant.Slug == "demo" ? "SvcSecret123!" : "SummitSvcSecret123!"),
                Serialize(new[] { "context.read", "context.recompute", "connectors.read" }),
                utcNow));
            onboardingStates.AddRange(new[]
            {
                OnboardingState.Create(tenant.Id, workspace.Id, "create-workspace", OnboardingStepStatus.Completed, Serialize(new { source = "seed" }), utcNow),
                OnboardingState.Create(tenant.Id, workspace.Id, "connect-source-system", OnboardingStepStatus.Completed, Serialize(new { source = "seed" }), utcNow),
                OnboardingState.Create(tenant.Id, workspace.Id, "define-semantic-mapping", OnboardingStepStatus.Completed, Serialize(new { source = "seed" }), utcNow),
                OnboardingState.Create(tenant.Id, workspace.Id, "generate-context-package", OnboardingStepStatus.Completed, Serialize(new { source = "seed" }), utcNow),
                OnboardingState.Create(tenant.Id, workspace.Id, "configure-webhooks", OnboardingStepStatus.NotStarted, Serialize(new { publicDemo = true }), utcNow)
            });

            var tenantContacts = contacts.Where(x => x.CustomerOpsTenantId == opsTenant.Id).ToList();
            foreach (var contact in tenantContacts)
            {
                var user = customerUsers.First(x => x.CustomerContactId == contact.Id);
                userProfiles.Add(UserProfile.Create(
                    tenant.Id,
                    contact.ExternalUserId,
                    contact.FullName,
                    contact.Email,
                    contact.Account.Name,
                    contact.JobTitle,
                    contact.Account.Segment,
                    user.LastSeenAtUtc ?? utcNow,
                    utcNow));
            }

            var tenantAttributes = CreateSemanticAttributes(tenant.Id, utcNow);
            attributes.AddRange(tenantAttributes);

            var contactSignalsSource = DataSource.Create(
                tenant.Id,
                "Customer Ops Contact Signals",
                "Direct SQL connector into customer_ops_db contact-level signal rollups.",
                DataSourceKind.Crm,
                Serialize(new
                {
                    connectorType = "sqlTable",
                    mode = "customerOpsDatabase",
                    tableName = "customer_contact_signals",
                    tenantSlug = tenant.Slug,
                    tenantSlugColumn = "tenant_slug",
                    userIdColumn = "external_user_id",
                    observedAtColumn = "observed_at_utc",
                    columns = new[]
                    {
                        "tenant_slug",
                        "external_user_id",
                        "preferred_channel",
                        "stakeholder_seniority",
                        "decision_maker_likelihood",
                        "observed_at_utc"
                    }
                }),
                utcNow);
            var emailSignalsSource = DataSource.Create(
                tenant.Id,
                "Customer Ops Email Signals",
                "Direct SQL connector into customer_ops_db email engagement rollups.",
                DataSourceKind.EventStream,
                Serialize(new
                {
                    connectorType = "sqlTable",
                    mode = "customerOpsDatabase",
                    tableName = "customer_email_signals",
                    tenantSlug = tenant.Slug,
                    tenantSlugColumn = "tenant_slug",
                    userIdColumn = "external_user_id",
                    observedAtColumn = "observed_at_utc",
                    columns = new[]
                    {
                        "tenant_slug",
                        "external_user_id",
                        "engagement_channel_signal",
                        "email_open_count_30d",
                        "email_click_count_30d",
                        "email_reply_count_30d",
                        "observed_at_utc"
                    }
                }),
                utcNow);
            var contextRollupSource = DataSource.Create(
                tenant.Id,
                "Customer Ops Context Rollups",
                "Direct SQL connector into customer_ops_db commercial, support, billing, and usage rollups.",
                DataSourceKind.SqlMetric,
                Serialize(new
                {
                    connectorType = "sqlTable",
                    mode = "customerOpsDatabase",
                    tableName = "customer_context_rollups",
                    tenantSlug = tenant.Slug,
                    tenantSlugColumn = "tenant_slug",
                    userIdColumn = "external_user_id",
                    observedAtColumn = "observed_at_utc",
                    columns = new[]
                    {
                        "tenant_slug",
                        "external_user_id",
                        "plan_interest_signal",
                        "activity_score",
                        "active_days_30",
                        "pricing_page_visits_30",
                        "automation_runs_30",
                        "seat_utilization_ratio",
                        "feature_adoption_score",
                        "open_support_tickets_30",
                        "severe_open_tickets_30",
                        "latest_satisfaction_score",
                        "monthly_recurring_revenue",
                        "days_past_due",
                        "payment_failures_30",
                        "expansion_seat_delta",
                        "open_opportunity_probability",
                        "recent_sales_activity_score",
                        "trial_activated_recently",
                        "enterprise_interest_score",
                        "product_fit_score",
                        "budget_readiness_score",
                        "recommended_sales_motion_signal",
                        "recent_feature_adoption_signal",
                        "sales_urgency_score",
                        "support_drag_score",
                        "observed_at_utc"
                    }
                }),
                utcNow);

            dataSources.AddRange(contactSignalsSource, emailSignalsSource, contextRollupSource);
            connectorInstallations.AddRange(new[]
            {
                ConnectorInstallation.Create(
                    tenant.Id,
                    workspace.Id,
                    contactSignalsSource.Id,
                    "sqlTable",
                    Serialize(new[] { "preview", "scheduledSync", "provenance" }),
                    utcNow),
                ConnectorInstallation.Create(
                    tenant.Id,
                    workspace.Id,
                    emailSignalsSource.Id,
                    "sqlTable",
                    Serialize(new[] { "preview", "scheduledSync", "provenance" }),
                    utcNow),
                ConnectorInstallation.Create(
                    tenant.Id,
                    workspace.Id,
                    contextRollupSource.Id,
                    "sqlTable",
                    Serialize(new[] { "preview", "scheduledSync", "provenance" }),
                    utcNow)
            });
            billingUsageRecords.AddRange(new[]
            {
                BillingUsageRecord.Create(
                    tenant.Id,
                    workspace.Id,
                    BillingUsageMetric.SelectorExecution,
                    tenantContacts.Count * 10,
                    utcNow.Date.AddDays(-1),
                    utcNow.Date,
                    "seed",
                    Serialize(new { demo = true }),
                    utcNow),
                BillingUsageRecord.Create(
                    tenant.Id,
                    workspace.Id,
                    BillingUsageMetric.ContextSnapshotGenerated,
                    tenantContacts.Count,
                    utcNow.Date.AddDays(-1),
                    utcNow.Date,
                    "seed",
                    Serialize(new { demo = true }),
                    utcNow)
            });
            selectors.AddRange(CreateSelectors(tenant.Id, tenantAttributes, contactSignalsSource, emailSignalsSource, contextRollupSource, utcNow));
            promptTemplates.Add(CreatePromptTemplate(tenant.Id, utcNow));
        }

        foreach (var selector in selectors)
        {
            selector.Publish(utcNow);
        }

        contextDbContext.Tenants.AddRange(tenants);
        contextDbContext.Workspaces.AddRange(workspaces);
        contextDbContext.OperatorAccounts.AddRange(operatorAccounts);
        contextDbContext.WorkspaceMembers.AddRange(workspaceMembers);
        contextDbContext.BillingPlans.AddRange(billingPlans);
        contextDbContext.BillingPlanLimits.AddRange(billingPlanLimits);
        contextDbContext.TenantSubscriptions.AddRange(subscriptions);
        contextDbContext.ApiClients.AddRange(apiClients);
        contextDbContext.UserProfiles.AddRange(userProfiles);
        contextDbContext.DataSources.AddRange(dataSources);
        contextDbContext.ConnectorInstallations.AddRange(connectorInstallations);
        contextDbContext.SemanticAttributeDefinitions.AddRange(attributes);
        contextDbContext.SelectorDefinitions.AddRange(selectors);
        contextDbContext.PromptTemplates.AddRange(promptTemplates);
        contextDbContext.OnboardingStates.AddRange(onboardingStates);
        contextDbContext.BillingUsageRecords.AddRange(billingUsageRecords);
        await contextDbContext.SaveChangesAsync(cancellationToken);

        foreach (var tenant in tenants)
        {
            var tenantSelectors = selectors.Where(x => x.TenantId == tenant.Id).ToList();
            var tenantProfiles = userProfiles.Where(x => x.TenantId == tenant.Id).ToList();
            foreach (var userProfile in tenantProfiles)
            {
                var correlationId = "seed-" + Guid.NewGuid().ToString("N");
                var executions = tenantSelectors
                    .Select(selector => SelectorExecution.Create(tenant.Id, selector.Id, userProfile.Id, correlationId, "seed", SelectorExecutionMode.Live, utcNow))
                    .ToList();
                contextDbContext.SelectorExecutions.AddRange(executions);
                contextDbContext.RecomputeJobs.Add(RecomputeJob.Create(
                    tenant.Id,
                    userProfile.Id,
                    correlationId,
                    "seed",
                    executions.Count,
                    $"Seed recompute for {userProfile.ExternalUserId}.",
                    Serialize(new
                    {
                        mode = "seed",
                        tenant = tenant.Slug,
                        userProfile.ExternalUserId,
                        executionCount = executions.Count
                    }),
                    utcNow));
                await contextDbContext.SaveChangesAsync(cancellationToken);

                await processor.ProcessAsync(
                    new ContextRecomputeRequest(tenant.Id, userProfile.Id, correlationId, executions.Select(x => x.Id).ToList()),
                    cancellationToken);

                var latestSnapshot = await contextDbContext.ContextSnapshots
                    .AsNoTracking()
                    .Where(x => x.TenantId == tenant.Id && x.UserProfileId == userProfile.Id)
                    .OrderByDescending(x => x.GeneratedAtUtc)
                    .FirstOrDefaultAsync(cancellationToken);
                if (latestSnapshot is not null && workspaceByTenantId.TryGetValue(tenant.Id, out var workspace))
                {
                    contextDbContext.ContextPackages.Add(ContextPackage.Create(
                        tenant.Id,
                        workspace.Id,
                        latestSnapshot.Id,
                        $"{tenant.Slug}-{userProfile.ExternalUserId}-sales-demo",
                        "sales-copilot",
                        Serialize(new
                        {
                            schemaVersion = "2026-05-11",
                            generatedFor = userProfile.ExternalUserId,
                            channels = new[] { "graphql", "rest", "sdk" },
                            publicDemo = true
                        }),
                        Serialize(new[] { "graphql", "rest", "sdk" }),
                        utcNow,
                        utcNow.AddDays(7)));
                    contextDbContext.BillingUsageRecords.Add(BillingUsageRecord.Create(
                        tenant.Id,
                        workspace.Id,
                        BillingUsageMetric.ContextPackageGenerated,
                        1,
                        utcNow.Date,
                        utcNow.Date.AddDays(1),
                        "seed",
                        Serialize(new { userProfile.ExternalUserId, publicDemo = true }),
                        utcNow));
                    await contextDbContext.SaveChangesAsync(cancellationToken);
                }
            }
        }
    }

    private static IReadOnlyList<BillingPlan> CreateBillingPlans(DateTime utcNow)
        =>
        [
            BillingPlan.Create(SubscriptionPlan.Free, "Free", "Safe local evaluation and proof-of-concepts.", true, 10, "provider-plan-free", utcNow),
            BillingPlan.Create(SubscriptionPlan.Pro, "Pro", "Small teams standardising semantic context across a few systems.", true, 20, "provider-plan-pro", utcNow),
            BillingPlan.Create(SubscriptionPlan.Business, "Business", "Production teams with multiple workspaces and integration surfaces.", true, 30, "provider-plan-business", utcNow),
            BillingPlan.Create(SubscriptionPlan.Enterprise, "Enterprise", "Private-cloud, managed SaaS, and custom commercial agreements.", false, 40, "provider-plan-enterprise", utcNow)
        ];

    private static IReadOnlyList<BillingPlanLimit> CreateBillingPlanLimits(
        IReadOnlyList<BillingPlan> plans,
        DateTime utcNow)
    {
        var byPlan = plans.ToDictionary(x => x.Plan);
        var limits = new List<BillingPlanLimit>();
        Add(byPlan[SubscriptionPlan.Free], BillingLimitMetric.Tenants, 1, "account", "hard", "One tenant per Free subscription.");
        Add(byPlan[SubscriptionPlan.Free], BillingLimitMetric.Workspaces, 1, "active", "hard", "One active workspace.");
        Add(byPlan[SubscriptionPlan.Free], BillingLimitMetric.Users, 5, "active", "hard", "Five operator users.");
        Add(byPlan[SubscriptionPlan.Free], BillingLimitMetric.ApiClients, 1, "active", "hard", "One machine client.");
        Add(byPlan[SubscriptionPlan.Free], BillingLimitMetric.Selectors, 5, "active", "hard", "Five selectors.");
        Add(byPlan[SubscriptionPlan.Free], BillingLimitMetric.ContextLookups, 1_000, "monthly", "hard", "Monthly context reads.");
        Add(byPlan[SubscriptionPlan.Free], BillingLimitMetric.Recomputations, 100, "monthly", "hard", "Monthly recomputations.");
        Add(byPlan[SubscriptionPlan.Free], BillingLimitMetric.SourceEvents, 1_000, "monthly", "hard", "Monthly source-system events.");
        Add(byPlan[SubscriptionPlan.Free], BillingLimitMetric.BlueprintImports, 1, "monthly", "hard", "Monthly blueprint imports.");
        Add(byPlan[SubscriptionPlan.Free], BillingLimitMetric.RetentionDays, 30, "retention", "policy", "Retention target.");

        AddPlan(byPlan[SubscriptionPlan.Pro], 1, 3, 25, 5, 50, 25_000, 2_500, 25_000, 10, 90);
        AddPlan(byPlan[SubscriptionPlan.Business], 3, 10, 100, 20, 250, 250_000, 25_000, 250_000, 50, 365);
        AddPlan(byPlan[SubscriptionPlan.Enterprise], null, null, null, null, null, null, null, null, null, 2_555);
        return limits;

        void Add(BillingPlan plan, BillingLimitMetric metric, long? limit, string window, string enforcement, string notes)
            => limits.Add(BillingPlanLimit.Create(plan.Id, metric, limit, window, enforcement, notes, utcNow));

        void AddPlan(BillingPlan plan, long? tenants, long? workspaces, long? users, long? apiClients, long? selectors, long? contextLookups, long? recomputations, long? sourceEvents, long? blueprintImports, long retentionDays)
        {
            Add(plan, BillingLimitMetric.Tenants, tenants, "account", tenants is null ? "contract" : "hard", "Tenant allowance.");
            Add(plan, BillingLimitMetric.Workspaces, workspaces, "active", workspaces is null ? "contract" : "hard", "Active workspace allowance.");
            Add(plan, BillingLimitMetric.Users, users, "active", users is null ? "contract" : "hard", "Operator user allowance.");
            Add(plan, BillingLimitMetric.ApiClients, apiClients, "active", apiClients is null ? "contract" : "hard", "Machine-client allowance.");
            Add(plan, BillingLimitMetric.Selectors, selectors, "active", selectors is null ? "contract" : "hard", "Selector definition allowance.");
            Add(plan, BillingLimitMetric.ContextLookups, contextLookups, "monthly", contextLookups is null ? "contract" : "hard", "Monthly context reads.");
            Add(plan, BillingLimitMetric.Recomputations, recomputations, "monthly", recomputations is null ? "contract" : "hard", "Monthly recomputations.");
            Add(plan, BillingLimitMetric.SourceEvents, sourceEvents, "monthly", sourceEvents is null ? "contract" : "hard", "Monthly source-system events.");
            Add(plan, BillingLimitMetric.BlueprintImports, blueprintImports, "monthly", blueprintImports is null ? "contract" : "hard", "Monthly blueprint imports.");
            Add(plan, BillingLimitMetric.RetentionDays, retentionDays, "retention", "policy", "Retention target.");
        }
    }

    private static IReadOnlyList<SemanticAttributeDefinition> CreateSemanticAttributes(Guid tenantId, DateTime utcNow)
    {
        return new[]
        {
            SemanticAttributeDefinition.Create(tenantId, SemanticAttributeKeys.ConversionProbability, "Conversion Probability", "Likelihood that the profile converts into a commercial opportunity.", SemanticDataType.Percentage, "82", true, utcNow),
            SemanticAttributeDefinition.Create(tenantId, SemanticAttributeKeys.PreferredChannel, "Preferred Channel", "Most effective outreach channel from operational evidence.", SemanticDataType.Enum, "\"email\"", true, utcNow),
            SemanticAttributeDefinition.Create(tenantId, SemanticAttributeKeys.PlanInterest, "Plan Interest", "Commercial packaging interest derived from pricing and pipeline signals.", SemanticDataType.Enum, "\"enterprise\"", true, utcNow),
            SemanticAttributeDefinition.Create(tenantId, SemanticAttributeKeys.EngagementLevel, "Engagement Level", "Current product engagement band.", SemanticDataType.Enum, "\"high\"", true, utcNow),
            SemanticAttributeDefinition.Create(tenantId, SemanticAttributeKeys.ChurnRisk, "Churn Risk", "Likelihood the account degrades or stalls without intervention.", SemanticDataType.Percentage, "18", true, utcNow),
            SemanticAttributeDefinition.Create(tenantId, SemanticAttributeKeys.ExpansionPotential, "Expansion Potential", "Upsell or seat expansion headroom.", SemanticDataType.Percentage, "76", true, utcNow),
            SemanticAttributeDefinition.Create(tenantId, SemanticAttributeKeys.BudgetReadiness, "Budget Readiness", "Signal that funding and buying process are in place.", SemanticDataType.Percentage, "71", true, utcNow),
            SemanticAttributeDefinition.Create(tenantId, SemanticAttributeKeys.DecisionMakerLikelihood, "Decision Maker Likelihood", "Confidence that the selected person can influence the final commercial decision.", SemanticDataType.Percentage, "84", true, utcNow),
            SemanticAttributeDefinition.Create(tenantId, SemanticAttributeKeys.ProductFit, "Product Fit", "How well current behavior and usage match the product's ideal profile.", SemanticDataType.Percentage, "79", true, utcNow),
            SemanticAttributeDefinition.Create(tenantId, SemanticAttributeKeys.RecommendedSalesMotion, "Recommended Sales Motion", "Best next commercial motion for the rep.", SemanticDataType.Enum, "\"accelerate_enterprise\"", true, utcNow),
            SemanticAttributeDefinition.Create(tenantId, SemanticAttributeKeys.StakeholderSeniority, "Stakeholder Seniority", "Normalized seniority band for the active contact.", SemanticDataType.Enum, "\"vp\"", true, utcNow),
            SemanticAttributeDefinition.Create(tenantId, SemanticAttributeKeys.SalesUrgency, "Sales Urgency", "Urgency classification based on trial timing, pricing activity, and pipeline readiness.", SemanticDataType.Enum, "\"high\"", true, utcNow),
            SemanticAttributeDefinition.Create(tenantId, SemanticAttributeKeys.RecentFeatureAdoption, "Recent Feature Adoption", "Normalized feature adoption trend.", SemanticDataType.Enum, "\"deepening\"", true, utcNow)
        };
    }

    private static IReadOnlyList<SelectorDefinition> CreateSelectors(
        Guid tenantId,
        IReadOnlyList<SemanticAttributeDefinition> attributes,
        DataSource contactSignalsSource,
        DataSource emailSignalsSource,
        DataSource contextRollupSource,
        DateTime utcNow)
    {
        Guid Attribute(string key) => attributes.Single(x => x.Key == key).Id;

        return new[]
        {
            SelectorDefinition.Create(
                tenantId,
                contactSignalsSource.Id,
                Attribute(SemanticAttributeKeys.PreferredChannel),
                "Preferred Channel from Contact Preference",
                "Maps contact-level channel preference from customer_ops_db into the semantic layer.",
                SelectorMappingKind.DirectFieldMapping,
                Serialize(new
                {
                    transforms = new[] { new { path = "preferred_channel", type = "lower" } },
                    rule = new { valuePath = "preferred_channel" },
                    confidence = new { baseConfidence = 0.96m, base_ = 0.96m }
                }).Replace("\"base_\"", "\"base\"", StringComparison.Ordinal),
                "Preferred channel resolved from the contact record as {{sourceValue}}.",
                Serialize(new { requiredPaths = new[] { "preferred_channel" } }),
                0.96m,
                1_440,
                10,
                120,
                utcNow),
            SelectorDefinition.Create(
                tenantId,
                emailSignalsSource.Id,
                Attribute(SemanticAttributeKeys.PreferredChannel),
                "Preferred Channel from Email Engagement",
                "Uses email response behavior to override or confirm preferred outreach channel.",
                SelectorMappingKind.DirectFieldMapping,
                Serialize(new
                {
                    rule = new { valuePath = "engagement_channel_signal" },
                    confidence = new { baseConfidence = 0.89m, stalePenaltyPerHour = 0.0005m, minimum = 0.55m }
                }),
                "Preferred channel reinforced by email engagement as {{sourceValue}}.",
                Serialize(new { requiredPaths = new[] { "engagement_channel_signal" } }),
                0.89m,
                720,
                11,
                60,
                utcNow),
            SelectorDefinition.Create(
                tenantId,
                contextRollupSource.Id,
                Attribute(SemanticAttributeKeys.PlanInterest),
                "Plan Interest from Commercial Intent",
                "Normalizes commercial packaging intent into starter, growth, or enterprise.",
                SelectorMappingKind.StringToEnumMapping,
                Serialize(new
                {
                    rule = new
                    {
                        valuePath = "plan_interest_signal",
                        map = new
                        {
                            starter = "starter",
                            growth = "growth",
                            enterprise = "enterprise"
                        }
                    },
                    confidence = new { baseConfidence = 0.91m }
                }),
                "Plan interest normalized to {{mappedValue}} from operational demand signals.",
                Serialize(new { requiredPaths = new[] { "plan_interest_signal" } }),
                0.91m,
                1_440,
                12,
                120,
                utcNow),
            SelectorDefinition.Create(
                tenantId,
                contextRollupSource.Id,
                Attribute(SemanticAttributeKeys.EngagementLevel),
                "Engagement Level from Activity Score",
                "Classifies overall engagement from a blended product and commercial activity score.",
                SelectorMappingKind.ThresholdClassification,
                Serialize(new
                {
                    rule = new
                    {
                        valuePath = "activity_score",
                        thresholds = new object[]
                        {
                            new { min = 80, label = "high" },
                            new { min = 50, max = 80, label = "medium" },
                            new { min = 0, max = 50, label = "low" }
                        }
                    },
                    confidence = new { baseConfidence = 0.9m }
                }),
                "Engagement level classified from activity score {{activityscore}}.",
                Serialize(new { requiredPaths = new[] { "activity_score" } }),
                0.90m,
                360,
                10,
                60,
                utcNow),
            SelectorDefinition.Create(
                tenantId,
                contextRollupSource.Id,
                Attribute(SemanticAttributeKeys.ConversionProbability),
                "Conversion Probability Composite",
                "Weighted scoring across pipeline, activity, enterprise intent, email responsiveness, and support drag.",
                SelectorMappingKind.WeightedScoring,
                Serialize(new
                {
                    rule = new
                    {
                        minimum = 0,
                        maximum = 100,
                        components = new object[]
                        {
                            new { sourcePath = "open_opportunity_probability", multiplier = 0.55m },
                            new { sourcePath = "recent_sales_activity_score", multiplier = 0.20m },
                            new { sourcePath = "enterprise_interest_score", multiplier = 0.20m },
                            new { sourcePath = "trial_activated_recently", expected = "true", trueValue = 12, falseValue = 0 },
                            new { sourcePath = "support_drag_score", multiplier = -0.15m }
                        }
                    },
                    confidence = new { baseConfidence = 0.92m, stalePenaltyPerHour = 0.0008m, minimum = 0.6m }
                }),
                "Conversion probability blended pipeline {{openopportunityprobability}}, engagement {{recentsalesactivityscore}}, enterprise intent {{enterpriseinterestscore}}, trial timing {{trialactivatedrecently}}, and support drag {{supportdragscore}}.",
                Serialize(new
                {
                    requiredPaths = new[]
                    {
                        "open_opportunity_probability",
                        "recent_sales_activity_score",
                        "enterprise_interest_score",
                        "trial_activated_recently",
                        "support_drag_score"
                    }
                }),
                0.92m,
                180,
                15,
                30,
                utcNow),
            SelectorDefinition.Create(
                tenantId,
                contextRollupSource.Id,
                Attribute(SemanticAttributeKeys.ChurnRisk),
                "Churn Risk Formula",
                "Derived churn signal from support, billing friction, and healthy usage credits.",
                SelectorMappingKind.FormulaMetric,
                Serialize(new
                {
                    rule = new
                    {
                        expression = "12 + (severe_open_tickets * 14) + (payment_failures * 9) + days_past_due_penalty - activity_credit",
                        variables = new object[]
                        {
                            new { name = "severe_open_tickets", sourcePath = "severe_open_tickets_30", multiplier = 1m },
                            new { name = "payment_failures", sourcePath = "payment_failures_30", multiplier = 1m },
                            new { name = "days_past_due_penalty", sourcePath = "days_past_due", threshold = 15, trueValue = 12, falseValue = 0 },
                            new { name = "activity_credit", sourcePath = "active_days_30", threshold = 18, trueValue = 16, falseValue = 4 }
                        }
                    },
                    confidence = new { baseConfidence = 0.88m, stalePenaltyPerHour = 0.001m, minimum = 0.58m }
                }),
                "Churn risk derived from severe tickets {{severe_open_tickets}}, payment failures {{payment_failures}}, days-past-due penalty {{days_past_due_penalty}}, and activity credit {{activity_credit}}.",
                Serialize(new
                {
                    requiredPaths = new[]
                    {
                        "severe_open_tickets_30",
                        "payment_failures_30",
                        "days_past_due",
                        "active_days_30"
                    }
                }),
                0.88m,
                240,
                13,
                45,
                utcNow),
            SelectorDefinition.Create(
                tenantId,
                contextRollupSource.Id,
                Attribute(SemanticAttributeKeys.ExpansionPotential),
                "Expansion Potential Formula",
                "Derived expansion signal from seat utilization, automation usage, adoption depth, and revenue scale.",
                SelectorMappingKind.FormulaMetric,
                Serialize(new
                {
                    rule = new
                    {
                        expression = "20 + seat_utilization_score + adoption_bonus + automation_bonus + revenue_bonus",
                        maximum = 95m,
                        variables = new object[]
                        {
                            new { name = "seat_utilization_score", sourcePath = "seat_utilization_ratio", multiplier = 40m },
                            new { name = "adoption_bonus", sourcePath = "feature_adoption_score", threshold = 75, trueValue = 18, falseValue = 6 },
                            new { name = "automation_bonus", sourcePath = "automation_runs_30", threshold = 60, trueValue = 14, falseValue = 4 },
                            new { name = "revenue_bonus", sourcePath = "monthly_recurring_revenue", threshold = 4000, trueValue = 12, falseValue = 4 }
                        }
                    },
                    confidence = new { baseConfidence = 0.9m, stalePenaltyPerHour = 0.0008m, minimum = 0.6m }
                }),
                "Expansion potential is capped at {{formulaValue}} after combining seat utilization {{seat_utilization_score}}, adoption bonus {{adoption_bonus}}, automation bonus {{automation_bonus}}, and revenue bonus {{revenue_bonus}}.",
                Serialize(new
                {
                    requiredPaths = new[]
                    {
                        "seat_utilization_ratio",
                        "feature_adoption_score",
                        "automation_runs_30",
                        "monthly_recurring_revenue"
                    }
                }),
                0.90m,
                300,
                14,
                60,
                utcNow),
            SelectorDefinition.Create(
                tenantId,
                contextRollupSource.Id,
                Attribute(SemanticAttributeKeys.BudgetReadiness),
                "Budget Readiness Score",
                "Directly surfaces the blended budget-readiness score from customer_ops_db rollups.",
                SelectorMappingKind.DirectFieldMapping,
                Serialize(new
                {
                    rule = new { valuePath = "budget_readiness_score" },
                    confidence = new { baseConfidence = 0.84m, stalePenaltyPerHour = 0.0006m, minimum = 0.5m }
                }),
                "Budget readiness score resolved to {{sourceValue}} from billing and pipeline signals.",
                Serialize(new { requiredPaths = new[] { "budget_readiness_score" } }),
                0.84m,
                720,
                11,
                120,
                utcNow),
            SelectorDefinition.Create(
                tenantId,
                contactSignalsSource.Id,
                Attribute(SemanticAttributeKeys.DecisionMakerLikelihood),
                "Decision Maker Likelihood",
                "Maps contact seniority and ownership context into a decision-maker likelihood score.",
                SelectorMappingKind.DirectFieldMapping,
                Serialize(new
                {
                    rule = new { valuePath = "decision_maker_likelihood" },
                    confidence = new { baseConfidence = 0.87m }
                }),
                "Decision maker likelihood resolved to {{sourceValue}} based on contact seniority and ownership.",
                Serialize(new { requiredPaths = new[] { "decision_maker_likelihood" } }),
                0.87m,
                1_440,
                10,
                180,
                utcNow),
            SelectorDefinition.Create(
                tenantId,
                contextRollupSource.Id,
                Attribute(SemanticAttributeKeys.ProductFit),
                "Product Fit Score",
                "Directly surfaces the product-fit score from operational usage and support evidence.",
                SelectorMappingKind.DirectFieldMapping,
                Serialize(new
                {
                    rule = new { valuePath = "product_fit_score" },
                    confidence = new { baseConfidence = 0.9m }
                }),
                "Product fit score resolved to {{sourceValue}} from usage depth and support outcomes.",
                Serialize(new { requiredPaths = new[] { "product_fit_score" } }),
                0.90m,
                360,
                10,
                60,
                utcNow),
            SelectorDefinition.Create(
                tenantId,
                contextRollupSource.Id,
                Attribute(SemanticAttributeKeys.RecommendedSalesMotion),
                "Recommended Sales Motion",
                "Normalizes the next-best motion from operational rollups.",
                SelectorMappingKind.StringToEnumMapping,
                Serialize(new
                {
                    rule = new
                    {
                        valuePath = "recommended_sales_motion_signal",
                        map = new
                        {
                            accelerate_enterprise = "accelerate_enterprise",
                            expand_multithread = "expand_multithread",
                            save_at_risk = "save_at_risk",
                            nurture_value = "nurture_value"
                        }
                    },
                    confidence = new { baseConfidence = 0.86m }
                }),
                "Recommended sales motion normalized to {{mappedValue}} from blended account conditions.",
                Serialize(new { requiredPaths = new[] { "recommended_sales_motion_signal" } }),
                0.86m,
                240,
                13,
                45,
                utcNow),
            SelectorDefinition.Create(
                tenantId,
                contactSignalsSource.Id,
                Attribute(SemanticAttributeKeys.StakeholderSeniority),
                "Stakeholder Seniority",
                "Direct mapping from normalized contact seniority.",
                SelectorMappingKind.DirectFieldMapping,
                Serialize(new
                {
                    transforms = new[] { new { path = "stakeholder_seniority", type = "lower" } },
                    rule = new { valuePath = "stakeholder_seniority" },
                    confidence = new { baseConfidence = 0.95m }
                }),
                "Stakeholder seniority resolved from the contact record as {{sourceValue}}.",
                Serialize(new { requiredPaths = new[] { "stakeholder_seniority" } }),
                0.95m,
                2_880,
                9,
                180,
                utcNow),
            SelectorDefinition.Create(
                tenantId,
                contextRollupSource.Id,
                Attribute(SemanticAttributeKeys.SalesUrgency),
                "Sales Urgency Classification",
                "Classifies sales urgency from trial timing, pricing activity, and deal momentum.",
                SelectorMappingKind.ThresholdClassification,
                Serialize(new
                {
                    rule = new
                    {
                        valuePath = "sales_urgency_score",
                        thresholds = new object[]
                        {
                            new { min = 75, label = "high" },
                            new { min = 45, max = 75, label = "medium" },
                            new { min = 0, max = 45, label = "low" }
                        }
                    },
                    confidence = new { baseConfidence = 0.9m }
                }),
                "Sales urgency classified from urgency score {{salesurgencyscore}}.",
                Serialize(new { requiredPaths = new[] { "sales_urgency_score" } }),
                0.90m,
                180,
                12,
                30,
                utcNow),
            SelectorDefinition.Create(
                tenantId,
                contextRollupSource.Id,
                Attribute(SemanticAttributeKeys.RecentFeatureAdoption),
                "Recent Feature Adoption",
                "Normalizes recent feature adoption trend from product activity.",
                SelectorMappingKind.StringToEnumMapping,
                Serialize(new
                {
                    rule = new
                    {
                        valuePath = "recent_feature_adoption_signal",
                        map = new
                        {
                            deepening = "deepening",
                            expanding = "expanding",
                            steady = "steady",
                            stalled = "stalled"
                        }
                    },
                    confidence = new { baseConfidence = 0.89m }
                }),
                "Feature adoption trend normalized to {{mappedValue}} from recent usage.",
                Serialize(new { requiredPaths = new[] { "recent_feature_adoption_signal" } }),
                0.89m,
                300,
                11,
                60,
                utcNow)
        };
    }

    private static PromptTemplate CreatePromptTemplate(Guid tenantId, DateTime utcNow)
    {
        return PromptTemplate.Create(
            tenantId,
            "Intelligent Sales Support v1",
            "Grounded sales orchestration template for strategy, email generation, and follow-up planning.",
            "You are Context Layer's Intelligent Sales Support agent. Use only the supplied grounded context package. Never invent missing details. Every claim must cite one or more citationIds from the context package.",
            "Act like a senior enterprise sales strategist reviewing CRM, warehouse, support, billing, and usage intelligence. If any fact is low confidence, stale, or missing, say so clearly, lower your confidence, and recommend human review. Return JSON only.",
            "Generate sales support output for {{user.fullName}} at {{user.companyName}}. The sales objective is '{{salesObjective}}'. Produce an outreach strategy, a personalised email draft, and follow-up recommendations grounded in the context package.",
            """
            {
              "type": "object",
              "properties": {
                "salesObjective": { "type": "string" },
                "outreachStrategy": {
                  "type": "object",
                  "properties": {
                    "summary": { "type": "string" },
                    "recommendedChannel": { "type": "string" },
                    "timingRecommendation": { "type": "string" },
                    "keyTalkingPoints": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "text": { "type": "string" },
                          "citations": { "type": "array", "items": { "type": "string" } },
                          "confidence": { "type": "number" }
                        },
                        "required": ["text", "citations", "confidence"]
                      }
                    },
                    "risks": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "text": { "type": "string" },
                          "citations": { "type": "array", "items": { "type": "string" } },
                          "confidence": { "type": "number" }
                        },
                        "required": ["text", "citations", "confidence"]
                      }
                    },
                    "confidence": { "type": "number" },
                    "humanReviewRecommended": { "type": "boolean" },
                    "humanReviewReason": { "type": "string" }
                  },
                  "required": ["summary", "recommendedChannel", "timingRecommendation", "keyTalkingPoints", "risks", "confidence", "humanReviewRecommended", "humanReviewReason"]
                },
                "personalizedEmailDraft": {
                  "type": "object",
                  "properties": {
                    "subjectLine": { "type": "string" },
                    "previewText": { "type": "string" },
                    "body": { "type": "string" },
                    "callToAction": { "type": "string" },
                    "supportingClaims": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "text": { "type": "string" },
                          "citations": { "type": "array", "items": { "type": "string" } },
                          "confidence": { "type": "number" }
                        },
                        "required": ["text", "citations", "confidence"]
                      }
                    },
                    "confidence": { "type": "number" },
                    "humanReviewRecommended": { "type": "boolean" },
                    "humanReviewReason": { "type": "string" }
                  },
                  "required": ["subjectLine", "previewText", "body", "callToAction", "supportingClaims", "confidence", "humanReviewRecommended", "humanReviewReason"]
                },
                "followUpRecommendations": {
                  "type": "object",
                  "properties": {
                    "recommendations": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "action": { "type": "string" },
                          "timing": { "type": "string" },
                          "rationale": { "type": "string" },
                          "citations": { "type": "array", "items": { "type": "string" } },
                          "confidence": { "type": "number" }
                        },
                        "required": ["action", "timing", "rationale", "citations", "confidence"]
                      }
                    },
                    "lowConfidenceSignals": { "type": "array", "items": { "type": "string" } },
                    "missingInformation": { "type": "array", "items": { "type": "string" } },
                    "confidence": { "type": "number" },
                    "humanReviewRecommended": { "type": "boolean" },
                    "humanReviewReason": { "type": "string" }
                  },
                  "required": ["recommendations", "lowConfidenceSignals", "missingInformation", "confidence", "humanReviewRecommended", "humanReviewReason"]
                },
                "missingInformation": { "type": "array", "items": { "type": "string" } },
                "humanReviewRecommended": { "type": "boolean" },
                "humanReviewReason": { "type": "string" },
                "overallConfidence": { "type": "number" }
              },
              "required": ["salesObjective", "outreachStrategy", "personalizedEmailDraft", "followUpRecommendations", "missingInformation", "humanReviewRecommended", "humanReviewReason", "overallConfidence"]
            }
            """,
            Serialize(new[]
            {
                "Only use the facts included in the context package.",
                "Cite one or more citationIds for every talking point, risk, supporting claim, and follow-up recommendation.",
                "If information is missing, return it in missingInformation instead of guessing.",
                "If any signal is stale or low confidence, acknowledge it explicitly and recommend human review."
            }),
            utcNow);
    }

    private static decimal ComputeDecisionMakerLikelihood(CustomerContact contact)
    {
        var baseScore = contact.Seniority switch
        {
            "cxo" => 92m,
            "vp" => 85m,
            "director" => 66m,
            "manager" => 42m,
            _ => 28m
        };

        if (contact.IsDecisionMaker)
        {
            baseScore += 8m;
        }

        return Math.Clamp(baseScore, 0m, 100m);
    }

    private static string NormalizeEmail(string fullName)
        => fullName.Trim().ToLowerInvariant().Replace(" ", ".", StringComparison.Ordinal);

    private static string TitleCase(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return value;
        }

        return string.Join(" ", value.Split('_', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(segment => char.ToUpperInvariant(segment[0]) + segment[1..]));
    }

    private static string Serialize<T>(T value) => JsonSerializer.Serialize(value, JsonOptions);

    private static IReadOnlyList<AccountScenario> BuildAccountScenarios()
    {
        var scenarios = new List<AccountScenario>
        {
            new(
                "demo",
                "Larkspur Logistics Group",
                "larkspur-logistics.example",
                "Logistics",
                "enterprise",
                "North America",
                "expansion",
                "Nina Alvarez",
                "123",
                "Avery Stone",
                "VP Revenue Operations",
                "Revenue Operations",
                "vp",
                "email",
                true,
                "enterprise",
                "active",
                "enterprise",
                "accelerate_enterprise",
                "deepening",
                "proposal",
                2_400,
                185_000_000m,
                180,
                166,
                27,
                42,
                58,
                11,
                144,
                92,
                1,
                0,
                8,
                0,
                0,
                28,
                78,
                82,
                true,
                92,
                91,
                84,
                88,
                12,
                14_800m,
                65_000m),
            new(
                "demo",
                "Brindle Care Network",
                "brindle-care.example",
                "Healthcare",
                "mid-market",
                "North America",
                "renewal",
                "Tariq Monroe",
                null,
                "Priya Nwosu",
                "Director of Digital Operations",
                "Operations",
                "director",
                "phone",
                false,
                "growth",
                "active",
                "growth",
                "save_at_risk",
                "steady",
                "negotiation",
                860,
                64_000_000m,
                84,
                39,
                12,
                15,
                18,
                4,
                28,
                51,
                3,
                1,
                6,
                21,
                2,
                4,
                34,
                36,
                false,
                41,
                57,
                38,
                32,
                56,
                5_400m,
                28_000m),
            new(
                "demo",
                "Quartz Legal Systems",
                "quartz-legal.example",
                "Legal Tech",
                "mid-market",
                "Europe",
                "evaluation",
                "Bianca Reed",
                null,
                "Marcus Bell",
                "Chief Financial Officer",
                "Finance",
                "cxo",
                "email",
                true,
                "growth",
                "trial",
                "enterprise",
                "expand_multithread",
                "expanding",
                "discovery",
                540,
                43_000_000m,
                60,
                47,
                21,
                26,
                33,
                9,
                72,
                78,
                1,
                0,
                9,
                0,
                0,
                12,
                59,
                64,
                true,
                79,
                84,
                62,
                71,
                14,
                6_950m,
                48_000m),
            new(
                "summit",
                "Emberforge Robotics",
                "emberforge-robotics.example",
                "Manufacturing",
                "enterprise",
                "North America",
                "trial",
                "Holly Barrett",
                null,
                "Elena Petrov",
                "VP Commercial Systems",
                "Revenue Operations",
                "vp",
                "email",
                true,
                "enterprise",
                "trial",
                "enterprise",
                "accelerate_enterprise",
                "deepening",
                "proposal",
                1_900,
                220_000_000m,
                140,
                121,
                25,
                38,
                49,
                10,
                96,
                89,
                1,
                0,
                8,
                0,
                0,
                22,
                74,
                79,
                true,
                88,
                93,
                82,
                92,
                10,
                12_900m,
                72_000m),
            new(
                "summit",
                "Willowbank Finance Group",
                "willowbank-finance.example",
                "Financial Services",
                "enterprise",
                "Europe",
                "expansion",
                "Grace Doyle",
                null,
                "Calvin Reese",
                "Revenue Operations Manager",
                "Revenue Operations",
                "manager",
                "email",
                false,
                "enterprise",
                "active",
                "enterprise",
                "nurture_value",
                "steady",
                "discovery",
                1_300,
                148_000_000m,
                110,
                84,
                18,
                20,
                27,
                6,
                58,
                73,
                2,
                0,
                7,
                0,
                1,
                8,
                42,
                53,
                false,
                67,
                76,
                58,
                46,
                26,
                8_750m,
                39_000m)
        };

        var genericAccountNames = new[]
        {
            "Silverline Energy", "Bright Path Commerce", "Oakbridge Analytics", "Blue Harbor Retail", "Iron Peak Mobility",
            "Riverbend Insurance", "Beacon Education Labs", "Lumina Security", "ForgeWorks Supply", "Pinnacle Property Group",
            "Veridian Foods", "Aster BioSystems", "Cloudcrest Media", "Sunline Telecom", "Fairmont Aviation",
            "Greenfield Capital", "Delta Construction Partners", "Nova Civic Tech", "Arcwell Hospitality", "TerraGrid Utilities",
            "Summerset Pharma", "Onyx Advisory Partners", "Horizon Travel Group", "Keystone Manufacturing", "Redwood Freight"
        };
        var industries = new[]
        {
            "Energy", "Retail", "Analytics", "Mobility", "Insurance",
            "Education", "Security", "Supply Chain", "Property", "Food",
            "Biotech", "Media", "Telecom", "Aviation", "Capital Markets",
            "Construction", "Civic Tech", "Hospitality", "Utilities", "Pharma"
        };
        var regions = new[] { "North America", "Europe", "APAC" };
        var owners = new[] { "Dana Mercer", "Jordan Kim", "Maya Sullivan", "Leo Grant", "Tariq Monroe", "Bianca Reed" };
        var planTiers = new[] { "starter", "growth", "enterprise" };
        var seniorities = new[] { "director", "vp", "manager" };
        var channels = new[] { "email", "phone", "email", "email", "sms" };

        for (var index = 0; index < genericAccountNames.Length; index++)
        {
            var tenantSlug = index < 10 ? "demo" : "summit";
            var accountName = genericAccountNames[index];
            var planTier = planTiers[index % planTiers.Length];
            var preferredChannel = channels[index % channels.Length];
            var activeDays = 10 + (index % 16);
            var featureAdoption = 42 + ((index * 7) % 46);
            var pricingVisits = 3 + (index % 8);
            var automationRuns = 18 + (index * 5 % 82);
            var seatsPurchased = 20 + (index * 7 % 110);
            var seatsUsed = Math.Max(10, seatsPurchased - (index % 12));
            var monthlyRecurringRevenue = planTier == "enterprise"
                ? 7_800m + (index * 130)
                : planTier == "growth" ? 2_400m + (index * 95) : 480m + (index * 35);
            scenarios.Add(new AccountScenario(
                tenantSlug,
                accountName,
                $"{accountName.ToLowerInvariant().Replace(" ", string.Empty, StringComparison.Ordinal)}.com",
                industries[index % industries.Length],
                planTier == "starter" ? "smb" : planTier == "growth" ? "mid-market" : "enterprise",
                regions[index % regions.Length],
                index % 4 == 0 ? "trial" : index % 4 == 1 ? "evaluation" : index % 4 == 2 ? "expansion" : "renewal",
                owners[index % owners.Length],
                null,
                $"{(index % 2 == 0 ? "Morgan" : "Taylor")} {lastName(index)}",
                index % 3 == 0 ? "Head of Revenue Systems" : index % 3 == 1 ? "VP Operations" : "Director of Growth",
                index % 3 == 0 ? "Revenue Operations" : index % 3 == 1 ? "Operations" : "Marketing",
                seniorities[index % seniorities.Length],
                preferredChannel,
                index % 3 != 2,
                planTier,
                index % 4 == 0 ? "trial" : "active",
                planTier == "starter" ? "growth" : planTier,
                index % 5 == 0 ? "save_at_risk" : index % 2 == 0 ? "expand_multithread" : "nurture_value",
                featureAdoption >= 80 ? "deepening" : featureAdoption >= 60 ? "expanding" : featureAdoption >= 45 ? "steady" : "stalled",
                index % 3 == 0 ? "proposal" : index % 3 == 1 ? "negotiation" : "discovery",
                180 + (index * 55),
                9_500_000m + (index * 2_750_000m),
                seatsPurchased,
                seatsUsed,
                activeDays,
                12 + (index % 16),
                18 + (index % 36),
                pricingVisits,
                automationRuns,
                featureAdoption,
                1 + (index % 3),
                index % 6 == 0 ? 1 : 0,
                6 + (index % 4),
                index % 7 == 0 ? 18 : 0,
                index % 8 == 0 ? 2 : 0,
                Math.Max(0, seatsPurchased - seatsUsed),
                32 + (index % 44),
                34 + (index % 45),
                index % 4 == 0,
                36 + (index % 54),
                48 + (index % 40),
                42 + (index % 44),
                28 + (index % 60),
                8 + (index % 28),
                monthlyRecurringRevenue,
                18_000m + (index * 2_100m)));
        }

        return scenarios;

        static string lastName(int index)
        {
            var lastNames = new[]
            {
                "Campbell", "Foster", "Diaz", "Chambers", "Turner", "Bennett",
                "Morrison", "Walsh", "Alvarez", "Patel", "Reed", "Nguyen"
            };
            return lastNames[index % lastNames.Length];
        }
    }

    private sealed record AccountScenario(
        string TenantSlug,
        string AccountName,
        string Domain,
        string Industry,
        string Segment,
        string Region,
        string LifecycleStage,
        string AccountOwner,
        string? PrimaryExternalUserId,
        string PrimaryContactName,
        string PrimaryJobTitle,
        string Department,
        string StakeholderSeniority,
        string PreferredChannel,
        bool IsDecisionMaker,
        string PlanTier,
        string SubscriptionStatus,
        string PlanInterestSignal,
        string RecommendedSalesMotionSignal,
        string RecentFeatureAdoptionSignal,
        string OpportunityStage,
        int EmployeeCount,
        decimal AnnualRevenue,
        int SeatsPurchased,
        int SeatsUsed,
        int ActiveDays30,
        int Sessions7d,
        int KeyFeatureEvents7d,
        int PricingPageVisits30,
        int AutomationRuns30,
        int FeatureAdoptionScore,
        int OpenSupportTickets30,
        int SevereOpenTickets30,
        int LatestSatisfactionScore,
        int DaysPastDue,
        int PaymentFailures30,
        int ExpansionSeatDelta,
        int OpenOpportunityProbability,
        int RecentSalesActivityScore,
        bool TrialActivatedRecently,
        int EnterpriseInterestScore,
        int ProductFitScore,
        int BudgetReadinessScore,
        int SalesUrgencyScore,
        int SupportDragScore,
        decimal MonthlyRecurringRevenue,
        decimal OpportunityAmount);
}
