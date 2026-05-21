using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KynticAI.Scout.Infrastructure.Persistence.CustomerOpsMigrations
{
    /// <inheritdoc />
    public partial class CustomerOpsInitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "customer_contact_signals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    external_user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    preferred_channel = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    stakeholder_seniority = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    decision_maker_likelihood = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    observed_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CustomerOpsTenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customer_contact_signals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "customer_context_rollups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    external_user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    plan_interest_signal = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    activity_score = table.Column<int>(type: "integer", nullable: false),
                    active_days_30 = table.Column<int>(type: "integer", nullable: false),
                    pricing_page_visits_30 = table.Column<int>(type: "integer", nullable: false),
                    automation_runs_30 = table.Column<int>(type: "integer", nullable: false),
                    seat_utilization_ratio = table.Column<decimal>(type: "numeric(8,4)", precision: 8, scale: 4, nullable: false),
                    feature_adoption_score = table.Column<int>(type: "integer", nullable: false),
                    open_support_tickets_30 = table.Column<int>(type: "integer", nullable: false),
                    severe_open_tickets_30 = table.Column<int>(type: "integer", nullable: false),
                    latest_satisfaction_score = table.Column<int>(type: "integer", nullable: false),
                    monthly_recurring_revenue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    days_past_due = table.Column<int>(type: "integer", nullable: false),
                    payment_failures_30 = table.Column<int>(type: "integer", nullable: false),
                    expansion_seat_delta = table.Column<int>(type: "integer", nullable: false),
                    open_opportunity_probability = table.Column<int>(type: "integer", nullable: false),
                    recent_sales_activity_score = table.Column<int>(type: "integer", nullable: false),
                    trial_activated_recently = table.Column<bool>(type: "boolean", nullable: false),
                    enterprise_interest_score = table.Column<int>(type: "integer", nullable: false),
                    product_fit_score = table.Column<int>(type: "integer", nullable: false),
                    budget_readiness_score = table.Column<int>(type: "integer", nullable: false),
                    recommended_sales_motion_signal = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    recent_feature_adoption_signal = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    sales_urgency_score = table.Column<int>(type: "integer", nullable: false),
                    support_drag_score = table.Column<int>(type: "integer", nullable: false),
                    observed_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CustomerOpsTenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customer_context_rollups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "customer_email_signals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    tenant_slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    external_user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    engagement_channel_signal = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    email_open_count_30d = table.Column<int>(type: "integer", nullable: false),
                    email_click_count_30d = table.Column<int>(type: "integer", nullable: false),
                    email_reply_count_30d = table.Column<int>(type: "integer", nullable: false),
                    observed_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CustomerOpsTenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customer_email_signals", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "customer_ops_tenants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customer_ops_tenants", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "products",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Sku = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "accounts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExternalAccountId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Domain = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Industry = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Segment = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Region = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    LifecycleStage = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    AccountOwner = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EmployeeCount = table.Column<int>(type: "integer", nullable: false),
                    AnnualRevenue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CustomerOpsTenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_accounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_accounts_customer_ops_tenants_CustomerOpsTenantId",
                        column: x => x.CustomerOpsTenantId,
                        principalTable: "customer_ops_tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "plans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductCatalogItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Tier = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    MonthlyPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    AnnualPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    IncludedSeats = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_plans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_plans_products_ProductCatalogItemId",
                        column: x => x.ProductCatalogItemId,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "billing_metrics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    MetricDateUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MonthlyRecurringRevenue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    AnnualRecurringRevenue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    DaysPastDue = table.Column<int>(type: "integer", nullable: false),
                    PaymentFailures30d = table.Column<int>(type: "integer", nullable: false),
                    ExpansionSeatDelta = table.Column<int>(type: "integer", nullable: false),
                    BillingStatus = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CustomerOpsTenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_billing_metrics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_billing_metrics_accounts_CustomerAccountId",
                        column: x => x.CustomerAccountId,
                        principalTable: "accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_billing_metrics_customer_ops_tenants_CustomerOpsTenantId",
                        column: x => x.CustomerOpsTenantId,
                        principalTable: "customer_ops_tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "contacts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExternalContactId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ExternalUserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FullName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    JobTitle = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Seniority = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Department = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    PreferredChannel = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    IsDecisionMaker = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CustomerOpsTenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contacts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_contacts_accounts_CustomerAccountId",
                        column: x => x.CustomerAccountId,
                        principalTable: "accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_contacts_customer_ops_tenants_CustomerOpsTenantId",
                        column: x => x.CustomerOpsTenantId,
                        principalTable: "customer_ops_tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "subscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductCatalogItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExternalSubscriptionId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    SeatsPurchased = table.Column<int>(type: "integer", nullable: false),
                    MonthlyRecurringRevenue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TrialEndsAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RenewalAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CustomerOpsTenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_subscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_subscriptions_accounts_CustomerAccountId",
                        column: x => x.CustomerAccountId,
                        principalTable: "accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_subscriptions_customer_ops_tenants_CustomerOpsTenantId",
                        column: x => x.CustomerOpsTenantId,
                        principalTable: "customer_ops_tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_subscriptions_plans_ProductPlanId",
                        column: x => x.ProductPlanId,
                        principalTable: "plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_subscriptions_products_ProductCatalogItemId",
                        column: x => x.ProductCatalogItemId,
                        principalTable: "products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "email_engagement_events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerContactId = table.Column<Guid>(type: "uuid", nullable: false),
                    CampaignName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    EventType = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Channel = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    MetadataJson = table.Column<string>(type: "jsonb", nullable: false),
                    OccurredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CustomerOpsTenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_email_engagement_events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_email_engagement_events_contacts_CustomerContactId",
                        column: x => x.CustomerContactId,
                        principalTable: "contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_email_engagement_events_customer_ops_tenants_CustomerOpsTen~",
                        column: x => x.CustomerOpsTenantId,
                        principalTable: "customer_ops_tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "opportunities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerContactId = table.Column<Guid>(type: "uuid", nullable: true),
                    ExternalOpportunityId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Stage = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ProbabilityPercent = table.Column<int>(type: "integer", nullable: false),
                    CloseDateUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    OpportunityType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    IsOpen = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CustomerOpsTenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_opportunities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_opportunities_accounts_CustomerAccountId",
                        column: x => x.CustomerAccountId,
                        principalTable: "accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_opportunities_contacts_CustomerContactId",
                        column: x => x.CustomerContactId,
                        principalTable: "contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_opportunities_customer_ops_tenants_CustomerOpsTenantId",
                        column: x => x.CustomerOpsTenantId,
                        principalTable: "customer_ops_tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "product_usage_summaries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerContactId = table.Column<Guid>(type: "uuid", nullable: true),
                    SummaryDateUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ActiveDays30 = table.Column<int>(type: "integer", nullable: false),
                    Sessions7d = table.Column<int>(type: "integer", nullable: false),
                    KeyFeatureEvents7d = table.Column<int>(type: "integer", nullable: false),
                    PricingPageVisits30d = table.Column<int>(type: "integer", nullable: false),
                    AutomationRuns30d = table.Column<int>(type: "integer", nullable: false),
                    SeatsUsed = table.Column<int>(type: "integer", nullable: false),
                    SeatsPurchased = table.Column<int>(type: "integer", nullable: false),
                    FeatureAdoptionScore = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CustomerOpsTenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_usage_summaries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_product_usage_summaries_accounts_CustomerAccountId",
                        column: x => x.CustomerAccountId,
                        principalTable: "accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_product_usage_summaries_contacts_CustomerContactId",
                        column: x => x.CustomerContactId,
                        principalTable: "contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_product_usage_summaries_customer_ops_tenants_CustomerOpsTen~",
                        column: x => x.CustomerOpsTenantId,
                        principalTable: "customer_ops_tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sales_activities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerContactId = table.Column<Guid>(type: "uuid", nullable: true),
                    ActivityType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Direction = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Outcome = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Summary = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    OccurredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CustomerOpsTenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sales_activities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_sales_activities_accounts_CustomerAccountId",
                        column: x => x.CustomerAccountId,
                        principalTable: "accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_sales_activities_contacts_CustomerContactId",
                        column: x => x.CustomerContactId,
                        principalTable: "contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_sales_activities_customer_ops_tenants_CustomerOpsTenantId",
                        column: x => x.CustomerOpsTenantId,
                        principalTable: "customer_ops_tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "support_tickets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerContactId = table.Column<Guid>(type: "uuid", nullable: true),
                    ExternalTicketId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Severity = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Status = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Category = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Subject = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    OpenedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ClosedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SatisfactionScore = table.Column<int>(type: "integer", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CustomerOpsTenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_support_tickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_support_tickets_accounts_CustomerAccountId",
                        column: x => x.CustomerAccountId,
                        principalTable: "accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_support_tickets_contacts_CustomerContactId",
                        column: x => x.CustomerContactId,
                        principalTable: "contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_support_tickets_customer_ops_tenants_CustomerOpsTenantId",
                        column: x => x.CustomerOpsTenantId,
                        principalTable: "customer_ops_tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerContactId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExternalUserId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    WorkspaceRole = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ActivatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSeenAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsTrialUser = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CustomerOpsTenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_users_accounts_CustomerAccountId",
                        column: x => x.CustomerAccountId,
                        principalTable: "accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_users_contacts_CustomerContactId",
                        column: x => x.CustomerContactId,
                        principalTable: "contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_users_customer_ops_tenants_CustomerOpsTenantId",
                        column: x => x.CustomerOpsTenantId,
                        principalTable: "customer_ops_tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "web_conversion_events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerAccountId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerContactId = table.Column<Guid>(type: "uuid", nullable: true),
                    EventType = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Page = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Campaign = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Referrer = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IntentScore = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    OccurredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CustomerOpsTenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_web_conversion_events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_web_conversion_events_accounts_CustomerAccountId",
                        column: x => x.CustomerAccountId,
                        principalTable: "accounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_web_conversion_events_contacts_CustomerContactId",
                        column: x => x.CustomerContactId,
                        principalTable: "contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_web_conversion_events_customer_ops_tenants_CustomerOpsTenan~",
                        column: x => x.CustomerOpsTenantId,
                        principalTable: "customer_ops_tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_accounts_CustomerOpsTenantId_Domain",
                table: "accounts",
                columns: new[] { "CustomerOpsTenantId", "Domain" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_accounts_CustomerOpsTenantId_ExternalAccountId",
                table: "accounts",
                columns: new[] { "CustomerOpsTenantId", "ExternalAccountId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_billing_metrics_CustomerAccountId",
                table: "billing_metrics",
                column: "CustomerAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_billing_metrics_CustomerOpsTenantId_MetricDateUtc",
                table: "billing_metrics",
                columns: new[] { "CustomerOpsTenantId", "MetricDateUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_contacts_CustomerAccountId",
                table: "contacts",
                column: "CustomerAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_contacts_CustomerOpsTenantId_ExternalContactId",
                table: "contacts",
                columns: new[] { "CustomerOpsTenantId", "ExternalContactId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_contacts_CustomerOpsTenantId_ExternalUserId",
                table: "contacts",
                columns: new[] { "CustomerOpsTenantId", "ExternalUserId" });

            migrationBuilder.CreateIndex(
                name: "IX_customer_contact_signals_CustomerOpsTenantId_external_user_~",
                table: "customer_contact_signals",
                columns: new[] { "CustomerOpsTenantId", "external_user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_customer_context_rollups_CustomerOpsTenantId_external_user_~",
                table: "customer_context_rollups",
                columns: new[] { "CustomerOpsTenantId", "external_user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_customer_email_signals_CustomerOpsTenantId_external_user_id",
                table: "customer_email_signals",
                columns: new[] { "CustomerOpsTenantId", "external_user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_customer_ops_tenants_Slug",
                table: "customer_ops_tenants",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_email_engagement_events_CustomerContactId",
                table: "email_engagement_events",
                column: "CustomerContactId");

            migrationBuilder.CreateIndex(
                name: "IX_email_engagement_events_CustomerOpsTenantId_OccurredAtUtc",
                table: "email_engagement_events",
                columns: new[] { "CustomerOpsTenantId", "OccurredAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_opportunities_CustomerAccountId",
                table: "opportunities",
                column: "CustomerAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_opportunities_CustomerContactId",
                table: "opportunities",
                column: "CustomerContactId");

            migrationBuilder.CreateIndex(
                name: "IX_opportunities_CustomerOpsTenantId_ExternalOpportunityId",
                table: "opportunities",
                columns: new[] { "CustomerOpsTenantId", "ExternalOpportunityId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_plans_Code",
                table: "plans",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_plans_ProductCatalogItemId",
                table: "plans",
                column: "ProductCatalogItemId");

            migrationBuilder.CreateIndex(
                name: "IX_product_usage_summaries_CustomerAccountId",
                table: "product_usage_summaries",
                column: "CustomerAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_product_usage_summaries_CustomerContactId",
                table: "product_usage_summaries",
                column: "CustomerContactId");

            migrationBuilder.CreateIndex(
                name: "IX_product_usage_summaries_CustomerOpsTenantId_CustomerContact~",
                table: "product_usage_summaries",
                columns: new[] { "CustomerOpsTenantId", "CustomerContactId", "SummaryDateUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_product_usage_summaries_CustomerOpsTenantId_SummaryDateUtc",
                table: "product_usage_summaries",
                columns: new[] { "CustomerOpsTenantId", "SummaryDateUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_products_Sku",
                table: "products",
                column: "Sku",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_sales_activities_CustomerAccountId",
                table: "sales_activities",
                column: "CustomerAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_sales_activities_CustomerContactId",
                table: "sales_activities",
                column: "CustomerContactId");

            migrationBuilder.CreateIndex(
                name: "IX_sales_activities_CustomerOpsTenantId_OccurredAtUtc",
                table: "sales_activities",
                columns: new[] { "CustomerOpsTenantId", "OccurredAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_subscriptions_CustomerAccountId",
                table: "subscriptions",
                column: "CustomerAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_subscriptions_CustomerOpsTenantId_ExternalSubscriptionId",
                table: "subscriptions",
                columns: new[] { "CustomerOpsTenantId", "ExternalSubscriptionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_subscriptions_ProductCatalogItemId",
                table: "subscriptions",
                column: "ProductCatalogItemId");

            migrationBuilder.CreateIndex(
                name: "IX_subscriptions_ProductPlanId",
                table: "subscriptions",
                column: "ProductPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_support_tickets_CustomerAccountId",
                table: "support_tickets",
                column: "CustomerAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_support_tickets_CustomerContactId",
                table: "support_tickets",
                column: "CustomerContactId");

            migrationBuilder.CreateIndex(
                name: "IX_support_tickets_CustomerOpsTenantId_ExternalTicketId",
                table: "support_tickets",
                columns: new[] { "CustomerOpsTenantId", "ExternalTicketId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_support_tickets_CustomerOpsTenantId_Status",
                table: "support_tickets",
                columns: new[] { "CustomerOpsTenantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_users_CustomerAccountId",
                table: "users",
                column: "CustomerAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_users_CustomerContactId",
                table: "users",
                column: "CustomerContactId");

            migrationBuilder.CreateIndex(
                name: "IX_users_CustomerOpsTenantId_ExternalUserId",
                table: "users",
                columns: new[] { "CustomerOpsTenantId", "ExternalUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_web_conversion_events_CustomerAccountId",
                table: "web_conversion_events",
                column: "CustomerAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_web_conversion_events_CustomerContactId",
                table: "web_conversion_events",
                column: "CustomerContactId");

            migrationBuilder.CreateIndex(
                name: "IX_web_conversion_events_CustomerOpsTenantId_OccurredAtUtc",
                table: "web_conversion_events",
                columns: new[] { "CustomerOpsTenantId", "OccurredAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "billing_metrics");

            migrationBuilder.DropTable(
                name: "customer_contact_signals");

            migrationBuilder.DropTable(
                name: "customer_context_rollups");

            migrationBuilder.DropTable(
                name: "customer_email_signals");

            migrationBuilder.DropTable(
                name: "email_engagement_events");

            migrationBuilder.DropTable(
                name: "opportunities");

            migrationBuilder.DropTable(
                name: "product_usage_summaries");

            migrationBuilder.DropTable(
                name: "sales_activities");

            migrationBuilder.DropTable(
                name: "subscriptions");

            migrationBuilder.DropTable(
                name: "support_tickets");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "web_conversion_events");

            migrationBuilder.DropTable(
                name: "plans");

            migrationBuilder.DropTable(
                name: "contacts");

            migrationBuilder.DropTable(
                name: "products");

            migrationBuilder.DropTable(
                name: "accounts");

            migrationBuilder.DropTable(
                name: "customer_ops_tenants");
        }
    }
}
