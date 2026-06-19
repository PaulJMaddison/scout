using System.Net;
using System.Text;
using System.Text.Json;
using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Application.Contracts;
using KynticAI.Scout.Infrastructure.Configuration;
using KynticAI.Scout.Infrastructure.Services;
using Microsoft.Extensions.Options;

namespace KynticAI.Scout.UnitTests;

public sealed class CloudControlPlaneEntitlementClientTests
{
    [Fact]
    public async Task Disabled_control_plane_keeps_scout_open_core_local_and_does_not_call_cloud()
    {
        var handler = new CapturingHandler(_ => throw new InvalidOperationException("Cloud should not be called."));
        var client = CreateClient(handler, new ControlPlaneOptions { Enabled = false });

        var scoutDecision = await client.CheckAsync(new ControlPlaneEntitlementCheckRequest(
            ControlPlaneCapabilityKeys.ScoutOpenCore,
            ControlPlaneCommercialTier.Scout));
        var fortressDecision = await client.CheckAsync(new ControlPlaneEntitlementCheckRequest(
            ControlPlaneCapabilityKeys.FortressRuntime,
            ControlPlaneCommercialTier.Fortress));

        Assert.True(scoutDecision.IsAllowed);
        Assert.False(fortressDecision.IsAllowed);
        Assert.False(scoutDecision.CloudWasContacted);
        Assert.Equal(ControlPlaneEntitlementDecisionStatus.NotChecked, scoutDecision.Status);
        Assert.Empty(handler.Captures);
    }

    [Fact]
    public async Task Active_fortress_response_allows_fortress_capability_and_sends_only_safe_metadata()
    {
        var handler = new CapturingHandler(_ => JsonResponse(new
        {
            licenceKey = "Scout-20260619-ABCDEF123456",
            status = 0,
            isValid = true,
            entitlements = new
            {
                plan = 2,
                maxUsers = 25,
                updateChannel = 0,
                enterpriseFeatures = new[] { "fortress-runtime", "private-deployment-pack" }
            },
            message = "Licence validation completed.",
            effectivePlan = 2,
            canonicalTier = 1,
            canonicalTierName = "Fortress",
            canonicalTierRank = 1
        }));
        var client = CreateClient(handler, new ControlPlaneOptions
        {
            Enabled = true,
            BaseUrl = "https://cloud.example.invalid",
            CustomerAccountId = "account-123",
            DataPlaneInstallationId = "installation-456",
            DeploymentName = "northstar-scout",
            DeploymentVersion = "2.8.0",
            DeploymentRegion = "uk-south",
            EnvironmentType = "PaidSelfHosted",
            UpdateChannel = "Stable"
        });

        var decision = await client.CheckAsync(new ControlPlaneEntitlementCheckRequest(
            ControlPlaneCapabilityKeys.FortressRuntime,
            ControlPlaneCommercialTier.Fortress,
            LicenceKey: "Scout-20260619-ABCDEF123456"));

        Assert.True(decision.IsAllowed);
        Assert.Equal(ControlPlaneEntitlementDecisionStatus.Allowed, decision.Status);
        Assert.Equal(ControlPlaneCommercialTier.Fortress, decision.EffectiveTier);
        Assert.Contains("fortress-runtime", decision.EnterpriseFeatures);
        Assert.DoesNotContain("Scout-20260619-ABCDEF123456", decision.LicenceKeyFingerprint);
        Assert.Single(handler.Captures);

        var capture = handler.Captures.Single();
        Assert.Equal(HttpMethod.Get, capture.Method);
        Assert.Equal("https://cloud.example.invalid/api/v1/licences/Scout-20260619-ABCDEF123456/status", capture.RequestUri);
        Assert.False(capture.HasBody);
        Assert.Equal("account-123", capture.Headers["X-KynticAI-Scout-Account-Id"]);
        Assert.Equal("installation-456", capture.Headers["X-KynticAI-Scout-Data-Plane-Id"]);
        Assert.Equal("2.8.0", capture.Headers["X-KynticAI-Scout-Deployment-Version"]);
        Assert.DoesNotContain(capture.Headers.Keys, key => key.Contains("payload", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(capture.Headers.Keys, key => key.Contains("record", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(capture.Headers.Keys, key => key.Contains("embedding", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Fortress_response_does_not_allow_elite_only_capability()
    {
        var handler = new CapturingHandler(_ => JsonResponse(new
        {
            status = 0,
            isValid = true,
            entitlements = new
            {
                plan = 2,
                enterpriseFeatures = new[] { "fortress-runtime" }
            },
            canonicalTierName = "Fortress",
            canonicalTierRank = 1
        }));
        var client = CreateClient(handler, EnabledOptions());

        var decision = await client.CheckAsync(new ControlPlaneEntitlementCheckRequest(
            ControlPlaneCapabilityKeys.EliteOperatorPack,
            ControlPlaneCommercialTier.Elite,
            LicenceKey: "Scout-20260619-ABCDEF123456"));

        Assert.False(decision.IsAllowed);
        Assert.Equal(ControlPlaneEntitlementDecisionStatus.Denied, decision.Status);
        Assert.Equal(ControlPlaneCommercialTier.Fortress, decision.EffectiveTier);
        Assert.True(decision.CloudWasContacted);
    }

    [Fact]
    public async Task Grace_status_is_allowed_when_tier_satisfies_request()
    {
        var handler = new CapturingHandler(_ => JsonResponse(new
        {
            status = 1,
            isValid = true,
            entitlements = new
            {
                plan = 4,
                updateChannel = 0,
                enterpriseFeatures = new[] { "elite-operator-pack" }
            },
            canonicalTierName = "Elite",
            canonicalTierRank = 2
        }));
        var options = EnabledOptions();
        options.OfflineGracePeriodDays = 14;
        var client = CreateClient(handler, options);

        var decision = await client.CheckAsync(new ControlPlaneEntitlementCheckRequest(
            ControlPlaneCapabilityKeys.EliteOperatorPack,
            ControlPlaneCommercialTier.Elite,
            LicenceKey: "Scout-20260619-ABCDEF123456"));

        Assert.True(decision.IsAllowed);
        Assert.True(decision.IsInGrace);
        Assert.Equal(14, decision.OfflineGracePeriodDays);
        Assert.Equal(ControlPlaneCommercialTier.Elite, decision.EffectiveTier);
    }

    [Fact]
    public async Task Cloud_unavailable_fails_closed_for_paid_capability()
    {
        var handler = new CapturingHandler(_ => throw new HttpRequestException("No route."));
        var options = EnabledOptions();
        options.OfflineGracePeriodDays = 7;
        var client = CreateClient(handler, options);

        var decision = await client.CheckAsync(new ControlPlaneEntitlementCheckRequest(
            ControlPlaneCapabilityKeys.FortressRuntime,
            ControlPlaneCommercialTier.Fortress,
            LicenceKey: "Scout-20260619-ABCDEF123456"));

        Assert.False(decision.IsAllowed);
        Assert.Equal(ControlPlaneEntitlementDecisionStatus.CloudUnavailable, decision.Status);
        Assert.True(decision.CloudWasContacted);
        Assert.Equal(7, decision.OfflineGracePeriodDays);
        Assert.Contains(decision.Warnings, warning => warning.Contains("fail closed", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Cloud_rejection_does_not_block_scout_open_core_capability()
    {
        var handler = new CapturingHandler(_ => new HttpResponseMessage(HttpStatusCode.Forbidden));
        var client = CreateClient(handler, EnabledOptions());

        var decision = await client.CheckAsync(new ControlPlaneEntitlementCheckRequest(
            ControlPlaneCapabilityKeys.ScoutOpenCore,
            ControlPlaneCommercialTier.Scout,
            LicenceKey: "Scout-20260619-ABCDEF123456"));

        Assert.True(decision.IsAllowed);
        Assert.Equal(ControlPlaneEntitlementDecisionStatus.CloudRejected, decision.Status);
        Assert.True(decision.CloudWasContacted);
    }

    [Fact]
    public async Task Missing_request_licence_key_can_be_loaded_from_local_signed_envelope_without_echoing_raw_key()
    {
        var licencePath = Path.Combine(Path.GetTempPath(), $"scout-cloud-client-{Guid.NewGuid():N}.json");
        await File.WriteAllTextAsync(licencePath, JsonSerializer.Serialize(new
        {
            format = "Scout-LICENCE-v1",
            payload = JsonSerializer.Serialize(new
            {
                licenceKey = "Scout-20260619-FROMFILE",
                issuedTo = "Northstar Components Ltd"
            }, new JsonSerializerOptions(JsonSerializerDefaults.Web)),
            signature = "not-needed-for-cloud-status-lookup"
        }, new JsonSerializerOptions(JsonSerializerDefaults.Web)));

        try
        {
            var handler = new CapturingHandler(_ => JsonResponse(new
            {
                status = 0,
                isValid = true,
                entitlements = new
                {
                    plan = 2,
                    enterpriseFeatures = new[] { "fortress-runtime" }
                },
                canonicalTierName = "Fortress",
                canonicalTierRank = 1
            }));
            var client = CreateClient(handler, EnabledOptions(), new LicenceOptions { FilePath = licencePath });

            var decision = await client.CheckAsync(new ControlPlaneEntitlementCheckRequest(
                ControlPlaneCapabilityKeys.FortressRuntime,
                ControlPlaneCommercialTier.Fortress));

            Assert.True(decision.IsAllowed);
            Assert.Equal("https://cloud.example.invalid/api/v1/licences/Scout-20260619-FROMFILE/status", handler.Captures.Single().RequestUri);
            Assert.DoesNotContain("Scout-20260619-FROMFILE", decision.Message);
            Assert.DoesNotContain("Scout-20260619-FROMFILE", decision.LicenceKeyFingerprint);
        }
        finally
        {
            File.Delete(licencePath);
        }
    }

    private static CloudControlPlaneEntitlementClient CreateClient(
        CapturingHandler handler,
        ControlPlaneOptions controlPlaneOptions,
        LicenceOptions? licenceOptions = null)
        => new(
            new HttpClient(handler),
            Options.Create(controlPlaneOptions),
            Options.Create(licenceOptions ?? new LicenceOptions { FilePath = string.Empty }),
            new TestClock());

    private static ControlPlaneOptions EnabledOptions()
        => new()
        {
            Enabled = true,
            BaseUrl = "https://cloud.example.invalid"
        };

    private static HttpResponseMessage JsonResponse(object body)
        => new(HttpStatusCode.OK)
        {
            Content = new StringContent(
                JsonSerializer.Serialize(body, new JsonSerializerOptions(JsonSerializerDefaults.Web)),
                Encoding.UTF8,
                "application/json")
        };

    private sealed class CapturingHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
    {
        public List<RequestCapture> Captures { get; } = [];

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Captures.Add(new RequestCapture(
                request.Method,
                request.RequestUri?.ToString() ?? "",
                request.Content is not null,
                request.Headers.ToDictionary(header => header.Key, header => string.Join(",", header.Value))));
            return Task.FromResult(responder(request));
        }
    }

    private sealed record RequestCapture(
        HttpMethod Method,
        string RequestUri,
        bool HasBody,
        IReadOnlyDictionary<string, string> Headers);

    private sealed class TestClock : IClock
    {
        public DateTime UtcNow { get; } = new(2026, 6, 19, 12, 0, 0, DateTimeKind.Utc);
    }
}
