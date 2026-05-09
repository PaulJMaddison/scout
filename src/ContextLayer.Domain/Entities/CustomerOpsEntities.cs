using ContextLayer.Domain.Common;

namespace ContextLayer.Domain.Entities;

public sealed class CustomerOpsTenant : AuditedEntity
{
    private CustomerOpsTenant()
    {
    }

    public string Slug { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public ICollection<CustomerAccount> Accounts { get; } = new List<CustomerAccount>();

    public ICollection<CustomerContact> Contacts { get; } = new List<CustomerContact>();

    public ICollection<CustomerUser> Users { get; } = new List<CustomerUser>();

    public static CustomerOpsTenant Create(string slug, string name, DateTime utcNow)
    {
        var tenant = new CustomerOpsTenant
        {
            Slug = slug.Trim().ToLowerInvariant(),
            Name = name.Trim()
        };

        tenant.SetAuditTimestamps(utcNow);
        return tenant;
    }
}

public sealed class CustomerAccount : CustomerOpsTenantEntity
{
    private CustomerAccount()
    {
    }

    public string ExternalAccountId { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public string Domain { get; private set; } = string.Empty;

    public string Industry { get; private set; } = string.Empty;

    public string Segment { get; private set; } = string.Empty;

    public string Region { get; private set; } = string.Empty;

    public string LifecycleStage { get; private set; } = string.Empty;

    public string AccountOwner { get; private set; } = string.Empty;

    public int EmployeeCount { get; private set; }

    public decimal AnnualRevenue { get; private set; }

    public CustomerOpsTenant Tenant { get; private set; } = null!;

    public ICollection<CustomerContact> Contacts { get; } = new List<CustomerContact>();

    public ICollection<CustomerUser> Users { get; } = new List<CustomerUser>();

    public ICollection<CustomerSubscription> Subscriptions { get; } = new List<CustomerSubscription>();

    public ICollection<SalesOpportunity> Opportunities { get; } = new List<SalesOpportunity>();

    public ICollection<SalesActivity> SalesActivities { get; } = new List<SalesActivity>();

    public ICollection<SupportTicket> SupportTickets { get; } = new List<SupportTicket>();

    public ICollection<ProductUsageSummary> ProductUsageSummaries { get; } = new List<ProductUsageSummary>();

    public ICollection<BillingMetric> BillingMetrics { get; } = new List<BillingMetric>();

    public ICollection<WebConversionEvent> WebConversionEvents { get; } = new List<WebConversionEvent>();

    public static CustomerAccount Create(
        Guid customerOpsTenantId,
        string externalAccountId,
        string name,
        string domain,
        string industry,
        string segment,
        string region,
        string lifecycleStage,
        string accountOwner,
        int employeeCount,
        decimal annualRevenue,
        DateTime utcNow)
    {
        var account = new CustomerAccount
        {
            CustomerOpsTenantId = customerOpsTenantId,
            ExternalAccountId = externalAccountId.Trim(),
            Name = name.Trim(),
            Domain = domain.Trim().ToLowerInvariant(),
            Industry = industry.Trim(),
            Segment = segment.Trim(),
            Region = region.Trim(),
            LifecycleStage = lifecycleStage.Trim(),
            AccountOwner = accountOwner.Trim(),
            EmployeeCount = employeeCount,
            AnnualRevenue = annualRevenue
        };

        account.SetAuditTimestamps(utcNow);
        return account;
    }
}

public sealed class CustomerContact : CustomerOpsTenantEntity
{
    private CustomerContact()
    {
    }

    public Guid CustomerAccountId { get; private set; }

    public string ExternalContactId { get; private set; } = string.Empty;

    public string ExternalUserId { get; private set; } = string.Empty;

    public string FullName { get; private set; } = string.Empty;

    public string Email { get; private set; } = string.Empty;

    public string JobTitle { get; private set; } = string.Empty;

    public string Seniority { get; private set; } = string.Empty;

    public string Department { get; private set; } = string.Empty;

    public string PreferredChannel { get; private set; } = string.Empty;

    public bool IsDecisionMaker { get; private set; }

    public CustomerOpsTenant Tenant { get; private set; } = null!;

    public CustomerAccount Account { get; private set; } = null!;

    public ICollection<CustomerUser> Users { get; } = new List<CustomerUser>();

    public ICollection<SalesOpportunity> Opportunities { get; } = new List<SalesOpportunity>();

    public ICollection<SalesActivity> SalesActivities { get; } = new List<SalesActivity>();

    public ICollection<EmailEngagementEvent> EmailEngagementEvents { get; } = new List<EmailEngagementEvent>();

    public ICollection<SupportTicket> SupportTickets { get; } = new List<SupportTicket>();

    public ICollection<ProductUsageSummary> ProductUsageSummaries { get; } = new List<ProductUsageSummary>();

    public ICollection<WebConversionEvent> WebConversionEvents { get; } = new List<WebConversionEvent>();

    public static CustomerContact Create(
        Guid customerOpsTenantId,
        Guid customerAccountId,
        string externalContactId,
        string externalUserId,
        string fullName,
        string email,
        string jobTitle,
        string seniority,
        string department,
        string preferredChannel,
        bool isDecisionMaker,
        DateTime utcNow)
    {
        var contact = new CustomerContact
        {
            CustomerOpsTenantId = customerOpsTenantId,
            CustomerAccountId = customerAccountId,
            ExternalContactId = externalContactId.Trim(),
            ExternalUserId = externalUserId.Trim(),
            FullName = fullName.Trim(),
            Email = email.Trim().ToLowerInvariant(),
            JobTitle = jobTitle.Trim(),
            Seniority = seniority.Trim(),
            Department = department.Trim(),
            PreferredChannel = preferredChannel.Trim().ToLowerInvariant(),
            IsDecisionMaker = isDecisionMaker
        };

        contact.SetAuditTimestamps(utcNow);
        return contact;
    }
}

public sealed class CustomerUser : CustomerOpsTenantEntity
{
    private CustomerUser()
    {
    }

    public Guid CustomerAccountId { get; private set; }

    public Guid CustomerContactId { get; private set; }

    public string ExternalUserId { get; private set; } = string.Empty;

    public string WorkspaceRole { get; private set; } = string.Empty;

    public DateTime ActivatedAtUtc { get; private set; }

    public DateTime? LastSeenAtUtc { get; private set; }

    public bool IsTrialUser { get; private set; }

    public CustomerOpsTenant Tenant { get; private set; } = null!;

    public CustomerAccount Account { get; private set; } = null!;

    public CustomerContact Contact { get; private set; } = null!;

    public static CustomerUser Create(
        Guid customerOpsTenantId,
        Guid customerAccountId,
        Guid customerContactId,
        string externalUserId,
        string workspaceRole,
        DateTime activatedAtUtc,
        DateTime? lastSeenAtUtc,
        bool isTrialUser,
        DateTime utcNow)
    {
        var user = new CustomerUser
        {
            CustomerOpsTenantId = customerOpsTenantId,
            CustomerAccountId = customerAccountId,
            CustomerContactId = customerContactId,
            ExternalUserId = externalUserId.Trim(),
            WorkspaceRole = workspaceRole.Trim(),
            ActivatedAtUtc = activatedAtUtc,
            LastSeenAtUtc = lastSeenAtUtc,
            IsTrialUser = isTrialUser
        };

        user.SetAuditTimestamps(utcNow);
        return user;
    }
}

public sealed class ProductCatalogItem : AuditedEntity
{
    private ProductCatalogItem()
    {
    }

    public string Sku { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public string Category { get; private set; } = string.Empty;

    public ICollection<ProductPlan> Plans { get; } = new List<ProductPlan>();

    public static ProductCatalogItem Create(string sku, string name, string category, DateTime utcNow)
    {
        var item = new ProductCatalogItem
        {
            Sku = sku.Trim().ToUpperInvariant(),
            Name = name.Trim(),
            Category = category.Trim()
        };

        item.SetAuditTimestamps(utcNow);
        return item;
    }
}

public sealed class ProductPlan : AuditedEntity
{
    private ProductPlan()
    {
    }

    public Guid ProductCatalogItemId { get; private set; }

    public string Code { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public string Tier { get; private set; } = string.Empty;

    public decimal MonthlyPrice { get; private set; }

    public decimal AnnualPrice { get; private set; }

    public int IncludedSeats { get; private set; }

    public ProductCatalogItem ProductCatalogItem { get; private set; } = null!;

    public ICollection<CustomerSubscription> Subscriptions { get; } = new List<CustomerSubscription>();

    public static ProductPlan Create(
        Guid productCatalogItemId,
        string code,
        string name,
        string tier,
        decimal monthlyPrice,
        decimal annualPrice,
        int includedSeats,
        DateTime utcNow)
    {
        var plan = new ProductPlan
        {
            ProductCatalogItemId = productCatalogItemId,
            Code = code.Trim().ToUpperInvariant(),
            Name = name.Trim(),
            Tier = tier.Trim().ToLowerInvariant(),
            MonthlyPrice = monthlyPrice,
            AnnualPrice = annualPrice,
            IncludedSeats = includedSeats
        };

        plan.SetAuditTimestamps(utcNow);
        return plan;
    }
}

public sealed class CustomerSubscription : CustomerOpsTenantEntity
{
    private CustomerSubscription()
    {
    }

    public Guid CustomerAccountId { get; private set; }

    public Guid ProductCatalogItemId { get; private set; }

    public Guid ProductPlanId { get; private set; }

    public string ExternalSubscriptionId { get; private set; } = string.Empty;

    public string Status { get; private set; } = string.Empty;

    public int SeatsPurchased { get; private set; }

    public decimal MonthlyRecurringRevenue { get; private set; }

    public DateTime StartedAtUtc { get; private set; }

    public DateTime? TrialEndsAtUtc { get; private set; }

    public DateTime? RenewalAtUtc { get; private set; }

    public CustomerOpsTenant Tenant { get; private set; } = null!;

    public CustomerAccount Account { get; private set; } = null!;

    public ProductCatalogItem ProductCatalogItem { get; private set; } = null!;

    public ProductPlan ProductPlan { get; private set; } = null!;

    public static CustomerSubscription Create(
        Guid customerOpsTenantId,
        Guid customerAccountId,
        Guid productCatalogItemId,
        Guid productPlanId,
        string externalSubscriptionId,
        string status,
        int seatsPurchased,
        decimal monthlyRecurringRevenue,
        DateTime startedAtUtc,
        DateTime? trialEndsAtUtc,
        DateTime? renewalAtUtc,
        DateTime utcNow)
    {
        var subscription = new CustomerSubscription
        {
            CustomerOpsTenantId = customerOpsTenantId,
            CustomerAccountId = customerAccountId,
            ProductCatalogItemId = productCatalogItemId,
            ProductPlanId = productPlanId,
            ExternalSubscriptionId = externalSubscriptionId.Trim(),
            Status = status.Trim().ToLowerInvariant(),
            SeatsPurchased = seatsPurchased,
            MonthlyRecurringRevenue = monthlyRecurringRevenue,
            StartedAtUtc = startedAtUtc,
            TrialEndsAtUtc = trialEndsAtUtc,
            RenewalAtUtc = renewalAtUtc
        };

        subscription.SetAuditTimestamps(utcNow);
        return subscription;
    }
}

public sealed class SalesOpportunity : CustomerOpsTenantEntity
{
    private SalesOpportunity()
    {
    }

    public Guid CustomerAccountId { get; private set; }

    public Guid? CustomerContactId { get; private set; }

    public string ExternalOpportunityId { get; private set; } = string.Empty;

    public string Name { get; private set; } = string.Empty;

    public string Stage { get; private set; } = string.Empty;

    public decimal Amount { get; private set; }

    public int ProbabilityPercent { get; private set; }

    public DateTime CloseDateUtc { get; private set; }

    public string OpportunityType { get; private set; } = string.Empty;

    public bool IsOpen { get; private set; }

    public CustomerOpsTenant Tenant { get; private set; } = null!;

    public CustomerAccount Account { get; private set; } = null!;

    public CustomerContact? Contact { get; private set; }

    public static SalesOpportunity Create(
        Guid customerOpsTenantId,
        Guid customerAccountId,
        Guid? customerContactId,
        string externalOpportunityId,
        string name,
        string stage,
        decimal amount,
        int probabilityPercent,
        DateTime closeDateUtc,
        string opportunityType,
        bool isOpen,
        DateTime utcNow)
    {
        var opportunity = new SalesOpportunity
        {
            CustomerOpsTenantId = customerOpsTenantId,
            CustomerAccountId = customerAccountId,
            CustomerContactId = customerContactId,
            ExternalOpportunityId = externalOpportunityId.Trim(),
            Name = name.Trim(),
            Stage = stage.Trim().ToLowerInvariant(),
            Amount = amount,
            ProbabilityPercent = probabilityPercent,
            CloseDateUtc = closeDateUtc,
            OpportunityType = opportunityType.Trim().ToLowerInvariant(),
            IsOpen = isOpen
        };

        opportunity.SetAuditTimestamps(utcNow);
        return opportunity;
    }
}

public sealed class SalesActivity : CustomerOpsTenantEntity
{
    private SalesActivity()
    {
    }

    public Guid CustomerAccountId { get; private set; }

    public Guid? CustomerContactId { get; private set; }

    public string ActivityType { get; private set; } = string.Empty;

    public string Direction { get; private set; } = string.Empty;

    public string Outcome { get; private set; } = string.Empty;

    public string Summary { get; private set; } = string.Empty;

    public DateTime OccurredAtUtc { get; private set; }

    public CustomerOpsTenant Tenant { get; private set; } = null!;

    public CustomerAccount Account { get; private set; } = null!;

    public CustomerContact? Contact { get; private set; }

    public static SalesActivity Create(
        Guid customerOpsTenantId,
        Guid customerAccountId,
        Guid? customerContactId,
        string activityType,
        string direction,
        string outcome,
        string summary,
        DateTime occurredAtUtc,
        DateTime utcNow)
    {
        var activity = new SalesActivity
        {
            CustomerOpsTenantId = customerOpsTenantId,
            CustomerAccountId = customerAccountId,
            CustomerContactId = customerContactId,
            ActivityType = activityType.Trim().ToLowerInvariant(),
            Direction = direction.Trim().ToLowerInvariant(),
            Outcome = outcome.Trim().ToLowerInvariant(),
            Summary = summary.Trim(),
            OccurredAtUtc = occurredAtUtc
        };

        activity.SetAuditTimestamps(utcNow);
        return activity;
    }
}

public sealed class EmailEngagementEvent : CustomerOpsTenantEntity
{
    private EmailEngagementEvent()
    {
    }

    public Guid CustomerContactId { get; private set; }

    public string CampaignName { get; private set; } = string.Empty;

    public string EventType { get; private set; } = string.Empty;

    public string Channel { get; private set; } = string.Empty;

    public string MetadataJson { get; private set; } = "{}";

    public DateTime OccurredAtUtc { get; private set; }

    public CustomerOpsTenant Tenant { get; private set; } = null!;

    public CustomerContact Contact { get; private set; } = null!;

    public static EmailEngagementEvent Create(
        Guid customerOpsTenantId,
        Guid customerContactId,
        string campaignName,
        string eventType,
        string channel,
        string metadataJson,
        DateTime occurredAtUtc,
        DateTime utcNow)
    {
        var engagement = new EmailEngagementEvent
        {
            CustomerOpsTenantId = customerOpsTenantId,
            CustomerContactId = customerContactId,
            CampaignName = campaignName.Trim(),
            EventType = eventType.Trim().ToLowerInvariant(),
            Channel = channel.Trim().ToLowerInvariant(),
            MetadataJson = string.IsNullOrWhiteSpace(metadataJson) ? "{}" : metadataJson.Trim(),
            OccurredAtUtc = occurredAtUtc
        };

        engagement.SetAuditTimestamps(utcNow);
        return engagement;
    }
}

public sealed class SupportTicket : CustomerOpsTenantEntity
{
    private SupportTicket()
    {
    }

    public Guid CustomerAccountId { get; private set; }

    public Guid? CustomerContactId { get; private set; }

    public string ExternalTicketId { get; private set; } = string.Empty;

    public string Severity { get; private set; } = string.Empty;

    public string Status { get; private set; } = string.Empty;

    public string Category { get; private set; } = string.Empty;

    public string Subject { get; private set; } = string.Empty;

    public DateTime OpenedAtUtc { get; private set; }

    public DateTime? ClosedAtUtc { get; private set; }

    public int? SatisfactionScore { get; private set; }

    public CustomerOpsTenant Tenant { get; private set; } = null!;

    public CustomerAccount Account { get; private set; } = null!;

    public CustomerContact? Contact { get; private set; }

    public static SupportTicket Create(
        Guid customerOpsTenantId,
        Guid customerAccountId,
        Guid? customerContactId,
        string externalTicketId,
        string severity,
        string status,
        string category,
        string subject,
        DateTime openedAtUtc,
        DateTime? closedAtUtc,
        int? satisfactionScore,
        DateTime utcNow)
    {
        var ticket = new SupportTicket
        {
            CustomerOpsTenantId = customerOpsTenantId,
            CustomerAccountId = customerAccountId,
            CustomerContactId = customerContactId,
            ExternalTicketId = externalTicketId.Trim(),
            Severity = severity.Trim().ToLowerInvariant(),
            Status = status.Trim().ToLowerInvariant(),
            Category = category.Trim().ToLowerInvariant(),
            Subject = subject.Trim(),
            OpenedAtUtc = openedAtUtc,
            ClosedAtUtc = closedAtUtc,
            SatisfactionScore = satisfactionScore
        };

        ticket.SetAuditTimestamps(utcNow);
        return ticket;
    }
}

public sealed class ProductUsageSummary : CustomerOpsTenantEntity
{
    private ProductUsageSummary()
    {
    }

    public Guid CustomerAccountId { get; private set; }

    public Guid? CustomerContactId { get; private set; }

    public DateTime SummaryDateUtc { get; private set; }

    public int ActiveDays30 { get; private set; }

    public int Sessions7d { get; private set; }

    public int KeyFeatureEvents7d { get; private set; }

    public int PricingPageVisits30d { get; private set; }

    public int AutomationRuns30d { get; private set; }

    public int SeatsUsed { get; private set; }

    public int SeatsPurchased { get; private set; }

    public int FeatureAdoptionScore { get; private set; }

    public CustomerOpsTenant Tenant { get; private set; } = null!;

    public CustomerAccount Account { get; private set; } = null!;

    public CustomerContact? Contact { get; private set; }

    public static ProductUsageSummary Create(
        Guid customerOpsTenantId,
        Guid customerAccountId,
        Guid? customerContactId,
        DateTime summaryDateUtc,
        int activeDays30,
        int sessions7d,
        int keyFeatureEvents7d,
        int pricingPageVisits30d,
        int automationRuns30d,
        int seatsUsed,
        int seatsPurchased,
        int featureAdoptionScore,
        DateTime utcNow)
    {
        var summary = new ProductUsageSummary
        {
            CustomerOpsTenantId = customerOpsTenantId,
            CustomerAccountId = customerAccountId,
            CustomerContactId = customerContactId,
            SummaryDateUtc = summaryDateUtc,
            ActiveDays30 = activeDays30,
            Sessions7d = sessions7d,
            KeyFeatureEvents7d = keyFeatureEvents7d,
            PricingPageVisits30d = pricingPageVisits30d,
            AutomationRuns30d = automationRuns30d,
            SeatsUsed = seatsUsed,
            SeatsPurchased = seatsPurchased,
            FeatureAdoptionScore = featureAdoptionScore
        };

        summary.SetAuditTimestamps(utcNow);
        return summary;
    }
}

public sealed class BillingMetric : CustomerOpsTenantEntity
{
    private BillingMetric()
    {
    }

    public Guid CustomerAccountId { get; private set; }

    public DateTime MetricDateUtc { get; private set; }

    public decimal MonthlyRecurringRevenue { get; private set; }

    public decimal AnnualRecurringRevenue { get; private set; }

    public int DaysPastDue { get; private set; }

    public int PaymentFailures30d { get; private set; }

    public int ExpansionSeatDelta { get; private set; }

    public string BillingStatus { get; private set; } = string.Empty;

    public CustomerOpsTenant Tenant { get; private set; } = null!;

    public CustomerAccount Account { get; private set; } = null!;

    public static BillingMetric Create(
        Guid customerOpsTenantId,
        Guid customerAccountId,
        DateTime metricDateUtc,
        decimal monthlyRecurringRevenue,
        decimal annualRecurringRevenue,
        int daysPastDue,
        int paymentFailures30d,
        int expansionSeatDelta,
        string billingStatus,
        DateTime utcNow)
    {
        var metric = new BillingMetric
        {
            CustomerOpsTenantId = customerOpsTenantId,
            CustomerAccountId = customerAccountId,
            MetricDateUtc = metricDateUtc,
            MonthlyRecurringRevenue = monthlyRecurringRevenue,
            AnnualRecurringRevenue = annualRecurringRevenue,
            DaysPastDue = daysPastDue,
            PaymentFailures30d = paymentFailures30d,
            ExpansionSeatDelta = expansionSeatDelta,
            BillingStatus = billingStatus.Trim().ToLowerInvariant()
        };

        metric.SetAuditTimestamps(utcNow);
        return metric;
    }
}

public sealed class WebConversionEvent : CustomerOpsTenantEntity
{
    private WebConversionEvent()
    {
    }

    public Guid CustomerAccountId { get; private set; }

    public Guid? CustomerContactId { get; private set; }

    public string EventType { get; private set; } = string.Empty;

    public string Page { get; private set; } = string.Empty;

    public string Campaign { get; private set; } = string.Empty;

    public string Referrer { get; private set; } = string.Empty;

    public decimal IntentScore { get; private set; }

    public DateTime OccurredAtUtc { get; private set; }

    public CustomerOpsTenant Tenant { get; private set; } = null!;

    public CustomerAccount Account { get; private set; } = null!;

    public CustomerContact? Contact { get; private set; }

    public static WebConversionEvent Create(
        Guid customerOpsTenantId,
        Guid customerAccountId,
        Guid? customerContactId,
        string eventType,
        string page,
        string campaign,
        string referrer,
        decimal intentScore,
        DateTime occurredAtUtc,
        DateTime utcNow)
    {
        var conversionEvent = new WebConversionEvent
        {
            CustomerOpsTenantId = customerOpsTenantId,
            CustomerAccountId = customerAccountId,
            CustomerContactId = customerContactId,
            EventType = eventType.Trim().ToLowerInvariant(),
            Page = page.Trim().ToLowerInvariant(),
            Campaign = campaign.Trim(),
            Referrer = referrer.Trim(),
            IntentScore = intentScore,
            OccurredAtUtc = occurredAtUtc
        };

        conversionEvent.SetAuditTimestamps(utcNow);
        return conversionEvent;
    }
}

public sealed class CustomerContactSignal : CustomerOpsTenantEntity
{
    private CustomerContactSignal()
    {
    }

    public string TenantSlug { get; private set; } = string.Empty;

    public string ExternalUserId { get; private set; } = string.Empty;

    public string PreferredChannel { get; private set; } = string.Empty;

    public string StakeholderSeniority { get; private set; } = string.Empty;

    public decimal DecisionMakerLikelihood { get; private set; }

    public DateTime ObservedAtUtc { get; private set; }

    public static CustomerContactSignal Create(
        Guid customerOpsTenantId,
        string tenantSlug,
        string externalUserId,
        string preferredChannel,
        string stakeholderSeniority,
        decimal decisionMakerLikelihood,
        DateTime observedAtUtc,
        DateTime utcNow)
    {
        var signal = new CustomerContactSignal
        {
            CustomerOpsTenantId = customerOpsTenantId,
            TenantSlug = tenantSlug.Trim().ToLowerInvariant(),
            ExternalUserId = externalUserId.Trim(),
            PreferredChannel = preferredChannel.Trim().ToLowerInvariant(),
            StakeholderSeniority = stakeholderSeniority.Trim().ToLowerInvariant(),
            DecisionMakerLikelihood = decisionMakerLikelihood,
            ObservedAtUtc = observedAtUtc
        };

        signal.SetAuditTimestamps(utcNow);
        return signal;
    }
}

public sealed class CustomerEmailSignal : CustomerOpsTenantEntity
{
    private CustomerEmailSignal()
    {
    }

    public string TenantSlug { get; private set; } = string.Empty;

    public string ExternalUserId { get; private set; } = string.Empty;

    public string EngagementChannelSignal { get; private set; } = string.Empty;

    public int EmailOpenCount30d { get; private set; }

    public int EmailClickCount30d { get; private set; }

    public int EmailReplyCount30d { get; private set; }

    public DateTime ObservedAtUtc { get; private set; }

    public static CustomerEmailSignal Create(
        Guid customerOpsTenantId,
        string tenantSlug,
        string externalUserId,
        string engagementChannelSignal,
        int emailOpenCount30d,
        int emailClickCount30d,
        int emailReplyCount30d,
        DateTime observedAtUtc,
        DateTime utcNow)
    {
        var signal = new CustomerEmailSignal
        {
            CustomerOpsTenantId = customerOpsTenantId,
            TenantSlug = tenantSlug.Trim().ToLowerInvariant(),
            ExternalUserId = externalUserId.Trim(),
            EngagementChannelSignal = engagementChannelSignal.Trim().ToLowerInvariant(),
            EmailOpenCount30d = emailOpenCount30d,
            EmailClickCount30d = emailClickCount30d,
            EmailReplyCount30d = emailReplyCount30d,
            ObservedAtUtc = observedAtUtc
        };

        signal.SetAuditTimestamps(utcNow);
        return signal;
    }
}

public sealed class CustomerContextRollup : CustomerOpsTenantEntity
{
    private CustomerContextRollup()
    {
    }

    public string TenantSlug { get; private set; } = string.Empty;

    public string ExternalUserId { get; private set; } = string.Empty;

    public string PlanInterestSignal { get; private set; } = string.Empty;

    public int ActivityScore { get; private set; }

    public int ActiveDays30 { get; private set; }

    public int PricingPageVisits30 { get; private set; }

    public int AutomationRuns30 { get; private set; }

    public decimal SeatUtilizationRatio { get; private set; }

    public int FeatureAdoptionScore { get; private set; }

    public int OpenSupportTickets30 { get; private set; }

    public int SevereOpenTickets30 { get; private set; }

    public int LatestSatisfactionScore { get; private set; }

    public decimal MonthlyRecurringRevenue { get; private set; }

    public int DaysPastDue { get; private set; }

    public int PaymentFailures30 { get; private set; }

    public int ExpansionSeatDelta { get; private set; }

    public int OpenOpportunityProbability { get; private set; }

    public int RecentSalesActivityScore { get; private set; }

    public bool TrialActivatedRecently { get; private set; }

    public int EnterpriseInterestScore { get; private set; }

    public int ProductFitScore { get; private set; }

    public int BudgetReadinessScore { get; private set; }

    public string RecommendedSalesMotionSignal { get; private set; } = string.Empty;

    public string RecentFeatureAdoptionSignal { get; private set; } = string.Empty;

    public int SalesUrgencyScore { get; private set; }

    public int SupportDragScore { get; private set; }

    public DateTime ObservedAtUtc { get; private set; }

    public static CustomerContextRollup Create(
        Guid customerOpsTenantId,
        string tenantSlug,
        string externalUserId,
        string planInterestSignal,
        int activityScore,
        int activeDays30,
        int pricingPageVisits30,
        int automationRuns30,
        decimal seatUtilizationRatio,
        int featureAdoptionScore,
        int openSupportTickets30,
        int severeOpenTickets30,
        int latestSatisfactionScore,
        decimal monthlyRecurringRevenue,
        int daysPastDue,
        int paymentFailures30,
        int expansionSeatDelta,
        int openOpportunityProbability,
        int recentSalesActivityScore,
        bool trialActivatedRecently,
        int enterpriseInterestScore,
        int productFitScore,
        int budgetReadinessScore,
        string recommendedSalesMotionSignal,
        string recentFeatureAdoptionSignal,
        int salesUrgencyScore,
        int supportDragScore,
        DateTime observedAtUtc,
        DateTime utcNow)
    {
        var rollup = new CustomerContextRollup
        {
            CustomerOpsTenantId = customerOpsTenantId,
            TenantSlug = tenantSlug.Trim().ToLowerInvariant(),
            ExternalUserId = externalUserId.Trim(),
            PlanInterestSignal = planInterestSignal.Trim().ToLowerInvariant(),
            ActivityScore = activityScore,
            ActiveDays30 = activeDays30,
            PricingPageVisits30 = pricingPageVisits30,
            AutomationRuns30 = automationRuns30,
            SeatUtilizationRatio = seatUtilizationRatio,
            FeatureAdoptionScore = featureAdoptionScore,
            OpenSupportTickets30 = openSupportTickets30,
            SevereOpenTickets30 = severeOpenTickets30,
            LatestSatisfactionScore = latestSatisfactionScore,
            MonthlyRecurringRevenue = monthlyRecurringRevenue,
            DaysPastDue = daysPastDue,
            PaymentFailures30 = paymentFailures30,
            ExpansionSeatDelta = expansionSeatDelta,
            OpenOpportunityProbability = openOpportunityProbability,
            RecentSalesActivityScore = recentSalesActivityScore,
            TrialActivatedRecently = trialActivatedRecently,
            EnterpriseInterestScore = enterpriseInterestScore,
            ProductFitScore = productFitScore,
            BudgetReadinessScore = budgetReadinessScore,
            RecommendedSalesMotionSignal = recommendedSalesMotionSignal.Trim().ToLowerInvariant(),
            RecentFeatureAdoptionSignal = recentFeatureAdoptionSignal.Trim().ToLowerInvariant(),
            SalesUrgencyScore = salesUrgencyScore,
            SupportDragScore = supportDragScore,
            ObservedAtUtc = observedAtUtc
        };

        rollup.SetAuditTimestamps(utcNow);
        return rollup;
    }
}
