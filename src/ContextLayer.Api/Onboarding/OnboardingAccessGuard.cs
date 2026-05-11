using ContextLayer.Infrastructure.Configuration;
using Microsoft.Extensions.Options;

namespace ContextLayer.Api.Onboarding;

public sealed class OnboardingAccessGuard(
    IOptions<PlatformOptions> platformOptions,
    IOptions<FeatureFlagOptions> featureFlagOptions,
    IHostEnvironment environment,
    ILogger<OnboardingAccessGuard> logger)
{
    public bool IsAnonymousOnboardingAllowed()
    {
        var flags = featureFlagOptions.Value;
        if (!flags.AnonymousOnboarding)
        {
            return false;
        }

        if (IsHostedOrProduction() && !flags.AllowProductionOnboarding)
        {
            return false;
        }

        return environment.IsDevelopment()
            || string.Equals(platformOptions.Value.Mode, PlatformModes.LocalDemo, StringComparison.OrdinalIgnoreCase)
            || flags.AllowProductionOnboarding;
    }

    public IResult? DenyAnonymousIfDisabled(HttpContext httpContext, string? tenantSlug, string surface)
    {
        if (IsAnonymousOnboardingAllowed())
        {
            return null;
        }

        LogDeniedAttempt(tenantSlug, surface);
        return Results.Problem(
            title: "Onboarding is disabled",
            detail: "Anonymous onboarding is disabled for this deployment. Enable FeatureFlags:AnonymousOnboarding only for local demos, or deliberately set FeatureFlags:AllowProductionOnboarding for a controlled private setup window.",
            statusCode: StatusCodes.Status403Forbidden,
            extensions: new Dictionary<string, object?>
            {
                ["correlationId"] = httpContext.Response.Headers["X-Request-Id"].FirstOrDefault() ?? httpContext.TraceIdentifier,
                ["code"] = "onboarding.disabled"
            });
    }

    public void EnsureOnboardingAllowed(string? tenantSlug, string surface)
    {
        if (IsAnonymousOnboardingAllowed())
        {
            return;
        }

        LogDeniedAttempt(tenantSlug, surface);
        throw new UnauthorizedAccessException("Onboarding is disabled for this deployment.");
    }

    private bool IsHostedOrProduction()
        => environment.IsProduction()
            || string.Equals(platformOptions.Value.Mode, PlatformModes.SaaS, StringComparison.OrdinalIgnoreCase);

    private void LogDeniedAttempt(string? tenantSlug, string surface)
        => logger.LogWarning(
            "Audit onboarding.disabled_attempt surface={Surface} tenantSlug={TenantSlug} environment={EnvironmentName} platformMode={PlatformMode}",
            surface,
            string.IsNullOrWhiteSpace(tenantSlug) ? "<empty>" : tenantSlug,
            environment.EnvironmentName,
            platformOptions.Value.Mode);
}
