using KynticAI.Scout.Domain.Enums;

namespace KynticAI.Scout.Application.Contracts;

public sealed record BillingPlanDefinitionResult(
    string Plan,
    string DisplayName,
    string Description,
    bool IsPublic,
    int SortOrder,
    string BillingProviderPlanReference,
    IReadOnlyList<BillingPlanLimitResult> Limits);

public sealed record BillingPlanLimitResult(
    string Metric,
    string DisplayName,
    long? Limit,
    string Window,
    string Enforcement,
    string Notes,
    long? Used,
    long? Remaining,
    bool IsUnlimited);

public sealed record BillingUsageMetricResult(
    string Metric,
    string DisplayName,
    long Quantity,
    long? Limit,
    long? Remaining,
    string Window,
    DateTime WindowStartUtc,
    DateTime WindowEndUtc);

public sealed record BillingUsageOverviewResult(
    Guid TenantId,
    string TenantSlug,
    string TenantName,
    string Plan,
    string Status,
    DateTime CurrentPeriodStartUtc,
    DateTime CurrentPeriodEndUtc,
    int RetentionDays,
    IReadOnlyList<BillingPlanLimitResult> Limits,
    IReadOnlyList<BillingUsageMetricResult> Usage,
    string ProviderIntegrationStatus);

public sealed record UsageRecordInput(
    Guid TenantId,
    Guid? WorkspaceId,
    BillingUsageMetric Metric,
    long Quantity,
    string Source,
    object? Dimensions);

public sealed record BillingProviderCustomerRequest(
    Guid TenantId,
    string TenantSlug,
    string TenantName,
    string AdminEmail);

public sealed record BillingProviderCustomerResult(
    string ProviderName,
    string CustomerReference,
    string Status);

public sealed record BillingProviderCheckoutRequest(
    Guid TenantId,
    string TenantSlug,
    SubscriptionPlan Plan,
    string SuccessUrl,
    string CancelUrl);

public sealed record BillingProviderCheckoutResult(
    string ProviderName,
    string CheckoutUrl,
    string Status);

public sealed record BillingProviderPortalRequest(
    Guid TenantId,
    string TenantSlug,
    string ReturnUrl);

public sealed record BillingProviderPortalResult(
    string ProviderName,
    string PortalUrl,
    string Status);
