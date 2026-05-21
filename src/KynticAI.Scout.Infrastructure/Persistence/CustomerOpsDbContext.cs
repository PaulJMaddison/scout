using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace KynticAI.Scout.Infrastructure.Persistence;

public sealed class CustomerOpsDbContext(DbContextOptions<CustomerOpsDbContext> options)
    : DbContext(options), ICustomerOpsDbContext
{
    public DbSet<CustomerOpsTenant> CustomerOpsTenants => Set<CustomerOpsTenant>();

    public DbSet<CustomerAccount> CustomerAccounts => Set<CustomerAccount>();

    public DbSet<CustomerContact> CustomerContacts => Set<CustomerContact>();

    public DbSet<CustomerUser> CustomerUsers => Set<CustomerUser>();

    public DbSet<ProductCatalogItem> ProductCatalogItems => Set<ProductCatalogItem>();

    public DbSet<ProductPlan> ProductPlans => Set<ProductPlan>();

    public DbSet<CustomerSubscription> CustomerSubscriptions => Set<CustomerSubscription>();

    public DbSet<SalesOpportunity> SalesOpportunities => Set<SalesOpportunity>();

    public DbSet<SalesActivity> SalesActivities => Set<SalesActivity>();

    public DbSet<EmailEngagementEvent> EmailEngagementEvents => Set<EmailEngagementEvent>();

    public DbSet<SupportTicket> SupportTickets => Set<SupportTicket>();

    public DbSet<ProductUsageSummary> ProductUsageSummaries => Set<ProductUsageSummary>();

    public DbSet<BillingMetric> BillingMetrics => Set<BillingMetric>();

    public DbSet<WebConversionEvent> WebConversionEvents => Set<WebConversionEvent>();

    public DbSet<CustomerContactSignal> CustomerContactSignals => Set<CustomerContactSignal>();

    public DbSet<CustomerEmailSignal> CustomerEmailSignals => Set<CustomerEmailSignal>();

    public DbSet<CustomerContextRollup> CustomerContextRollups => Set<CustomerContextRollup>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(CustomerOpsDbContext).Assembly,
            type => type.Namespace == "KynticAI.Scout.Infrastructure.Persistence.CustomerOps");
    }
}
