using ContextLayer.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ContextLayer.Infrastructure.Persistence.CustomerOps;

internal sealed class CustomerOpsTenantConfiguration : IEntityTypeConfiguration<CustomerOpsTenant>
{
    public void Configure(EntityTypeBuilder<CustomerOpsTenant> builder)
    {
        builder.ToTable("customer_ops_tenants");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Slug).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique();
    }
}

internal sealed class CustomerAccountConfiguration : IEntityTypeConfiguration<CustomerAccount>
{
    public void Configure(EntityTypeBuilder<CustomerAccount> builder)
    {
        builder.ToTable("accounts");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ExternalAccountId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Domain).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Industry).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Segment).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Region).HasMaxLength(120).IsRequired();
        builder.Property(x => x.LifecycleStage).HasMaxLength(80).IsRequired();
        builder.Property(x => x.AccountOwner).HasMaxLength(200).IsRequired();
        builder.Property(x => x.AnnualRevenue).HasPrecision(18, 2);
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.ExternalAccountId }).IsUnique();
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.Domain }).IsUnique();
        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.Accounts)
            .HasForeignKey(x => x.CustomerOpsTenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class CustomerContactConfiguration : IEntityTypeConfiguration<CustomerContact>
{
    public void Configure(EntityTypeBuilder<CustomerContact> builder)
    {
        builder.ToTable("contacts");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ExternalContactId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.ExternalUserId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.FullName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(320).IsRequired();
        builder.Property(x => x.JobTitle).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Seniority).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Department).HasMaxLength(120).IsRequired();
        builder.Property(x => x.PreferredChannel).HasMaxLength(40).IsRequired();
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.ExternalContactId }).IsUnique();
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.ExternalUserId });
        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.Contacts)
            .HasForeignKey(x => x.CustomerOpsTenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Account)
            .WithMany(x => x.Contacts)
            .HasForeignKey(x => x.CustomerAccountId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class CustomerUserConfiguration : IEntityTypeConfiguration<CustomerUser>
{
    public void Configure(EntityTypeBuilder<CustomerUser> builder)
    {
        builder.ToTable("users");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ExternalUserId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.WorkspaceRole).HasMaxLength(100).IsRequired();
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.ExternalUserId }).IsUnique();
        builder.HasOne(x => x.Tenant)
            .WithMany(x => x.Users)
            .HasForeignKey(x => x.CustomerOpsTenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Account)
            .WithMany(x => x.Users)
            .HasForeignKey(x => x.CustomerAccountId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Contact)
            .WithMany(x => x.Users)
            .HasForeignKey(x => x.CustomerContactId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class ProductCatalogItemConfiguration : IEntityTypeConfiguration<ProductCatalogItem>
{
    public void Configure(EntityTypeBuilder<ProductCatalogItem> builder)
    {
        builder.ToTable("products");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Sku).HasMaxLength(60).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Category).HasMaxLength(100).IsRequired();
        builder.HasIndex(x => x.Sku).IsUnique();
    }
}

internal sealed class ProductPlanConfiguration : IEntityTypeConfiguration<ProductPlan>
{
    public void Configure(EntityTypeBuilder<ProductPlan> builder)
    {
        builder.ToTable("plans");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(60).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Tier).HasMaxLength(60).IsRequired();
        builder.Property(x => x.MonthlyPrice).HasPrecision(18, 2);
        builder.Property(x => x.AnnualPrice).HasPrecision(18, 2);
        builder.HasIndex(x => x.Code).IsUnique();
        builder.HasOne(x => x.ProductCatalogItem)
            .WithMany(x => x.Plans)
            .HasForeignKey(x => x.ProductCatalogItemId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class CustomerSubscriptionConfiguration : IEntityTypeConfiguration<CustomerSubscription>
{
    public void Configure(EntityTypeBuilder<CustomerSubscription> builder)
    {
        builder.ToTable("subscriptions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ExternalSubscriptionId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(60).IsRequired();
        builder.Property(x => x.MonthlyRecurringRevenue).HasPrecision(18, 2);
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.ExternalSubscriptionId }).IsUnique();
        builder.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.CustomerOpsTenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Account)
            .WithMany(x => x.Subscriptions)
            .HasForeignKey(x => x.CustomerAccountId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.ProductCatalogItem)
            .WithMany()
            .HasForeignKey(x => x.ProductCatalogItemId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ProductPlan)
            .WithMany(x => x.Subscriptions)
            .HasForeignKey(x => x.ProductPlanId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class SalesOpportunityConfiguration : IEntityTypeConfiguration<SalesOpportunity>
{
    public void Configure(EntityTypeBuilder<SalesOpportunity> builder)
    {
        builder.ToTable("opportunities");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ExternalOpportunityId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Stage).HasMaxLength(80).IsRequired();
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.OpportunityType).HasMaxLength(80).IsRequired();
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.ExternalOpportunityId }).IsUnique();
        builder.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.CustomerOpsTenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Account)
            .WithMany(x => x.Opportunities)
            .HasForeignKey(x => x.CustomerAccountId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Contact)
            .WithMany(x => x.Opportunities)
            .HasForeignKey(x => x.CustomerContactId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class SalesActivityConfiguration : IEntityTypeConfiguration<SalesActivity>
{
    public void Configure(EntityTypeBuilder<SalesActivity> builder)
    {
        builder.ToTable("sales_activities");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ActivityType).HasMaxLength(80).IsRequired();
        builder.Property(x => x.Direction).HasMaxLength(40).IsRequired();
        builder.Property(x => x.Outcome).HasMaxLength(80).IsRequired();
        builder.Property(x => x.Summary).HasMaxLength(1_000).IsRequired();
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.OccurredAtUtc });
        builder.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.CustomerOpsTenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Account)
            .WithMany(x => x.SalesActivities)
            .HasForeignKey(x => x.CustomerAccountId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Contact)
            .WithMany(x => x.SalesActivities)
            .HasForeignKey(x => x.CustomerContactId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class EmailEngagementEventConfiguration : IEntityTypeConfiguration<EmailEngagementEvent>
{
    public void Configure(EntityTypeBuilder<EmailEngagementEvent> builder)
    {
        builder.ToTable("email_engagement_events");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CampaignName).HasMaxLength(200).IsRequired();
        builder.Property(x => x.EventType).HasMaxLength(60).IsRequired();
        builder.Property(x => x.Channel).HasMaxLength(60).IsRequired();
        builder.Property(x => x.MetadataJson).HasColumnType("jsonb").IsRequired();
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.OccurredAtUtc });
        builder.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.CustomerOpsTenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Contact)
            .WithMany(x => x.EmailEngagementEvents)
            .HasForeignKey(x => x.CustomerContactId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class SupportTicketConfiguration : IEntityTypeConfiguration<SupportTicket>
{
    public void Configure(EntityTypeBuilder<SupportTicket> builder)
    {
        builder.ToTable("support_tickets");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ExternalTicketId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Severity).HasMaxLength(60).IsRequired();
        builder.Property(x => x.Status).HasMaxLength(60).IsRequired();
        builder.Property(x => x.Category).HasMaxLength(80).IsRequired();
        builder.Property(x => x.Subject).HasMaxLength(300).IsRequired();
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.ExternalTicketId }).IsUnique();
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.Status });
        builder.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.CustomerOpsTenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Account)
            .WithMany(x => x.SupportTickets)
            .HasForeignKey(x => x.CustomerAccountId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Contact)
            .WithMany(x => x.SupportTickets)
            .HasForeignKey(x => x.CustomerContactId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class ProductUsageSummaryConfiguration : IEntityTypeConfiguration<ProductUsageSummary>
{
    public void Configure(EntityTypeBuilder<ProductUsageSummary> builder)
    {
        builder.ToTable("product_usage_summaries");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.SummaryDateUtc });
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.CustomerContactId, x.SummaryDateUtc });
        builder.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.CustomerOpsTenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Account)
            .WithMany(x => x.ProductUsageSummaries)
            .HasForeignKey(x => x.CustomerAccountId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Contact)
            .WithMany(x => x.ProductUsageSummaries)
            .HasForeignKey(x => x.CustomerContactId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class BillingMetricConfiguration : IEntityTypeConfiguration<BillingMetric>
{
    public void Configure(EntityTypeBuilder<BillingMetric> builder)
    {
        builder.ToTable("billing_metrics");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.MonthlyRecurringRevenue).HasPrecision(18, 2);
        builder.Property(x => x.AnnualRecurringRevenue).HasPrecision(18, 2);
        builder.Property(x => x.BillingStatus).HasMaxLength(80).IsRequired();
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.MetricDateUtc });
        builder.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.CustomerOpsTenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Account)
            .WithMany(x => x.BillingMetrics)
            .HasForeignKey(x => x.CustomerAccountId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

internal sealed class WebConversionEventConfiguration : IEntityTypeConfiguration<WebConversionEvent>
{
    public void Configure(EntityTypeBuilder<WebConversionEvent> builder)
    {
        builder.ToTable("web_conversion_events");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.EventType).HasMaxLength(80).IsRequired();
        builder.Property(x => x.Page).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Campaign).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Referrer).HasMaxLength(200).IsRequired();
        builder.Property(x => x.IntentScore).HasPrecision(10, 2);
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.OccurredAtUtc });
        builder.HasOne(x => x.Tenant)
            .WithMany()
            .HasForeignKey(x => x.CustomerOpsTenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Account)
            .WithMany(x => x.WebConversionEvents)
            .HasForeignKey(x => x.CustomerAccountId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Contact)
            .WithMany(x => x.WebConversionEvents)
            .HasForeignKey(x => x.CustomerContactId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class CustomerContactSignalConfiguration : IEntityTypeConfiguration<CustomerContactSignal>
{
    public void Configure(EntityTypeBuilder<CustomerContactSignal> builder)
    {
        builder.ToTable("customer_contact_signals");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TenantSlug).HasColumnName("tenant_slug").HasMaxLength(100).IsRequired();
        builder.Property(x => x.ExternalUserId).HasColumnName("external_user_id").HasMaxLength(100).IsRequired();
        builder.Property(x => x.PreferredChannel).HasColumnName("preferred_channel").HasMaxLength(40).IsRequired();
        builder.Property(x => x.StakeholderSeniority).HasColumnName("stakeholder_seniority").HasMaxLength(100).IsRequired();
        builder.Property(x => x.DecisionMakerLikelihood).HasColumnName("decision_maker_likelihood").HasPrecision(5, 2);
        builder.Property(x => x.ObservedAtUtc).HasColumnName("observed_at_utc");
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.ExternalUserId }).IsUnique();
    }
}

internal sealed class CustomerEmailSignalConfiguration : IEntityTypeConfiguration<CustomerEmailSignal>
{
    public void Configure(EntityTypeBuilder<CustomerEmailSignal> builder)
    {
        builder.ToTable("customer_email_signals");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TenantSlug).HasColumnName("tenant_slug").HasMaxLength(100).IsRequired();
        builder.Property(x => x.ExternalUserId).HasColumnName("external_user_id").HasMaxLength(100).IsRequired();
        builder.Property(x => x.EngagementChannelSignal).HasColumnName("engagement_channel_signal").HasMaxLength(40).IsRequired();
        builder.Property(x => x.EmailOpenCount30d).HasColumnName("email_open_count_30d");
        builder.Property(x => x.EmailClickCount30d).HasColumnName("email_click_count_30d");
        builder.Property(x => x.EmailReplyCount30d).HasColumnName("email_reply_count_30d");
        builder.Property(x => x.ObservedAtUtc).HasColumnName("observed_at_utc");
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.ExternalUserId }).IsUnique();
    }
}

internal sealed class CustomerContextRollupConfiguration : IEntityTypeConfiguration<CustomerContextRollup>
{
    public void Configure(EntityTypeBuilder<CustomerContextRollup> builder)
    {
        builder.ToTable("customer_context_rollups");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TenantSlug).HasColumnName("tenant_slug").HasMaxLength(100).IsRequired();
        builder.Property(x => x.ExternalUserId).HasColumnName("external_user_id").HasMaxLength(100).IsRequired();
        builder.Property(x => x.PlanInterestSignal).HasColumnName("plan_interest_signal").HasMaxLength(80).IsRequired();
        builder.Property(x => x.ActivityScore).HasColumnName("activity_score");
        builder.Property(x => x.ActiveDays30).HasColumnName("active_days_30");
        builder.Property(x => x.PricingPageVisits30).HasColumnName("pricing_page_visits_30");
        builder.Property(x => x.AutomationRuns30).HasColumnName("automation_runs_30");
        builder.Property(x => x.SeatUtilizationRatio).HasColumnName("seat_utilization_ratio").HasPrecision(8, 4);
        builder.Property(x => x.FeatureAdoptionScore).HasColumnName("feature_adoption_score");
        builder.Property(x => x.OpenSupportTickets30).HasColumnName("open_support_tickets_30");
        builder.Property(x => x.SevereOpenTickets30).HasColumnName("severe_open_tickets_30");
        builder.Property(x => x.LatestSatisfactionScore).HasColumnName("latest_satisfaction_score");
        builder.Property(x => x.MonthlyRecurringRevenue).HasColumnName("monthly_recurring_revenue").HasPrecision(18, 2);
        builder.Property(x => x.DaysPastDue).HasColumnName("days_past_due");
        builder.Property(x => x.PaymentFailures30).HasColumnName("payment_failures_30");
        builder.Property(x => x.ExpansionSeatDelta).HasColumnName("expansion_seat_delta");
        builder.Property(x => x.OpenOpportunityProbability).HasColumnName("open_opportunity_probability");
        builder.Property(x => x.RecentSalesActivityScore).HasColumnName("recent_sales_activity_score");
        builder.Property(x => x.TrialActivatedRecently).HasColumnName("trial_activated_recently");
        builder.Property(x => x.EnterpriseInterestScore).HasColumnName("enterprise_interest_score");
        builder.Property(x => x.ProductFitScore).HasColumnName("product_fit_score");
        builder.Property(x => x.BudgetReadinessScore).HasColumnName("budget_readiness_score");
        builder.Property(x => x.RecommendedSalesMotionSignal).HasColumnName("recommended_sales_motion_signal").HasMaxLength(120).IsRequired();
        builder.Property(x => x.RecentFeatureAdoptionSignal).HasColumnName("recent_feature_adoption_signal").HasMaxLength(120).IsRequired();
        builder.Property(x => x.SalesUrgencyScore).HasColumnName("sales_urgency_score");
        builder.Property(x => x.SupportDragScore).HasColumnName("support_drag_score");
        builder.Property(x => x.ObservedAtUtc).HasColumnName("observed_at_utc");
        builder.HasIndex(x => new { x.CustomerOpsTenantId, x.ExternalUserId }).IsUnique();
    }
}
