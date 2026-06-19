using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Application.Contracts;
using KynticAI.Scout.Application.Services;
using KynticAI.Scout.Infrastructure.Configuration;
using Microsoft.Extensions.Options;

namespace KynticAI.Scout.Infrastructure.Services;

public sealed class CloudControlPlaneEntitlementClient(
    HttpClient httpClient,
    IOptions<ControlPlaneOptions> controlPlaneOptions,
    IOptions<LicenceOptions> licenceOptions,
    IClock clock) : IControlPlaneEntitlementClient
{
    public async Task<ControlPlaneEntitlementDecision> CheckAsync(
        ControlPlaneEntitlementCheckRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var controlPlane = controlPlaneOptions.Value;
        var warnings = new List<string>();
        if (!controlPlane.Enabled)
        {
            return LocalOnlyDecision(
                request,
                ControlPlaneEntitlementDecisionStatus.NotChecked,
                request.RequiredTier == ControlPlaneCommercialTier.Scout,
                "control-plane-disabled",
                "Cloud control-plane checks are disabled. Scout open-core operation remains local.");
        }

        var baseUri = ResolveBaseUri(controlPlane);
        if (baseUri is null)
        {
            return LocalOnlyDecision(
                request,
                ControlPlaneEntitlementDecisionStatus.Misconfigured,
                request.RequiredTier == ControlPlaneCommercialTier.Scout,
                "control-plane-misconfigured",
                "ControlPlane:BaseUrl must be configured before Cloud entitlement checks can run.");
        }

        var licenceKey = await ResolveLicenceKeyAsync(request.LicenceKey, warnings, cancellationToken);
        if (string.IsNullOrWhiteSpace(licenceKey))
        {
            warnings.Add("No local licence key is available for the Cloud entitlement check.");
            return LocalOnlyDecision(
                request,
                ControlPlaneEntitlementDecisionStatus.Misconfigured,
                request.RequiredTier == ControlPlaneCommercialTier.Scout,
                "licence-key-missing",
                "A Cloud entitlement check requires a local signed licence key.",
                warnings);
        }

        using var httpRequest = new HttpRequestMessage(
            HttpMethod.Get,
            new Uri(baseUri, $"api/v1/licences/{Uri.EscapeDataString(licenceKey)}/status"));
        AddSafeMetadataHeaders(httpRequest, controlPlane, request.Deployment);

        try
        {
            using var response = await httpClient.SendAsync(
                httpRequest,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                return RejectedDecision(request, controlPlane, licenceKey, response.StatusCode);
            }

            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            return ParseCloudDecision(request, controlPlane, licenceKey, body);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return CloudUnavailableDecision(request, controlPlane, licenceKey, "The Cloud entitlement check timed out.");
        }
        catch (HttpRequestException)
        {
            return CloudUnavailableDecision(request, controlPlane, licenceKey, "The Cloud entitlement check could not reach the configured control plane.");
        }
        catch (JsonException)
        {
            return new ControlPlaneEntitlementDecision(
                IsAllowed: request.RequiredTier == ControlPlaneCommercialTier.Scout,
                Status: ControlPlaneEntitlementDecisionStatus.InvalidCloudResponse,
                CapabilityKey: request.CapabilityKey,
                RequiredTier: request.RequiredTier,
                EffectiveTier: ControlPlaneCommercialTier.Scout,
                EffectiveTierName: ControlPlaneCommercialTier.Scout.ToString(),
                EffectiveTierRank: (int)ControlPlaneCommercialTier.Scout,
                CloudWasContacted: true,
                Source: "cloud-invalid-response",
                LicenceKeyFingerprint: Fingerprint(licenceKey),
                IsInGrace: false,
                OfflineGracePeriodDays: Math.Max(0, controlPlane.OfflineGracePeriodDays),
                CheckedAtUtc: clock.UtcNow,
                Message: "The Cloud entitlement response did not match the expected metadata contract.",
                EnterpriseFeatures: [],
                Entitlements: [],
                Warnings: ["Cloud returned an invalid entitlement response; no response body was retained."]);
        }
    }

    private ControlPlaneEntitlementDecision ParseCloudDecision(
        ControlPlaneEntitlementCheckRequest request,
        ControlPlaneOptions controlPlane,
        string licenceKey,
        string body)
    {
        using var document = JsonDocument.Parse(body);
        var root = document.RootElement;
        var status = ReadCloudStatus(root);
        var isInGrace = IsGraceStatus(status);
        var isValid = ReadBool(root, "isValid") ?? IsAcceptedStatus(status);
        var entitlementsElement = root.TryGetProperty("entitlements", out var entitlementsValue)
            ? entitlementsValue
            : default;
        var entitlements = ReadEntitlements(entitlementsElement);
        var enterpriseFeatures = ReadEnterpriseFeatures(entitlementsElement);
        var effectiveRank = ReadInt(root, "canonicalTierRank")
            ?? ReadInt(root, "canonicalTier")
            ?? RankFromPlan(ReadInt(root, "effectivePlan"))
            ?? RankFromEntitlements(entitlements)
            ?? 0;
        var effectiveTier = TierFromRank(effectiveRank);
        var effectiveTierName = ReadString(root, "canonicalTierName");
        if (string.IsNullOrWhiteSpace(effectiveTierName))
        {
            effectiveTierName = effectiveTier.ToString();
        }

        var allowed = isValid && effectiveRank >= (int)request.RequiredTier;
        var message = ReadString(root, "message");
        if (string.IsNullOrWhiteSpace(message))
        {
            message = allowed
                ? "Cloud entitlement check allowed the requested capability."
                : "Cloud entitlement check did not allow the requested capability.";
        }

        return new ControlPlaneEntitlementDecision(
            IsAllowed: allowed,
            Status: allowed
                ? ControlPlaneEntitlementDecisionStatus.Allowed
                : ControlPlaneEntitlementDecisionStatus.Denied,
            CapabilityKey: request.CapabilityKey,
            RequiredTier: request.RequiredTier,
            EffectiveTier: effectiveTier,
            EffectiveTierName: effectiveTierName,
            EffectiveTierRank: effectiveRank,
            CloudWasContacted: true,
            Source: "cloud-licence-status",
            LicenceKeyFingerprint: Fingerprint(licenceKey),
            IsInGrace: isInGrace,
            OfflineGracePeriodDays: Math.Max(0, controlPlane.OfflineGracePeriodDays),
            CheckedAtUtc: clock.UtcNow,
            Message: message,
            EnterpriseFeatures: enterpriseFeatures,
            Entitlements: entitlements,
            Warnings: []);
    }

    private ControlPlaneEntitlementDecision LocalOnlyDecision(
        ControlPlaneEntitlementCheckRequest request,
        ControlPlaneEntitlementDecisionStatus status,
        bool isAllowed,
        string source,
        string message,
        IReadOnlyList<string>? warnings = null)
        => new(
            IsAllowed: isAllowed,
            Status: status,
            CapabilityKey: request.CapabilityKey,
            RequiredTier: request.RequiredTier,
            EffectiveTier: ControlPlaneCommercialTier.Scout,
            EffectiveTierName: ControlPlaneCommercialTier.Scout.ToString(),
            EffectiveTierRank: (int)ControlPlaneCommercialTier.Scout,
            CloudWasContacted: false,
            Source: source,
            LicenceKeyFingerprint: "not-sent",
            IsInGrace: false,
            OfflineGracePeriodDays: Math.Max(0, controlPlaneOptions.Value.OfflineGracePeriodDays),
            CheckedAtUtc: clock.UtcNow,
            Message: message,
            EnterpriseFeatures: [],
            Entitlements: [],
            Warnings: warnings ?? []);

    private ControlPlaneEntitlementDecision RejectedDecision(
        ControlPlaneEntitlementCheckRequest request,
        ControlPlaneOptions controlPlane,
        string licenceKey,
        HttpStatusCode statusCode)
        => new(
            IsAllowed: request.RequiredTier == ControlPlaneCommercialTier.Scout,
            Status: ControlPlaneEntitlementDecisionStatus.CloudRejected,
            CapabilityKey: request.CapabilityKey,
            RequiredTier: request.RequiredTier,
            EffectiveTier: ControlPlaneCommercialTier.Scout,
            EffectiveTierName: ControlPlaneCommercialTier.Scout.ToString(),
            EffectiveTierRank: (int)ControlPlaneCommercialTier.Scout,
            CloudWasContacted: true,
            Source: "cloud-rejected",
            LicenceKeyFingerprint: Fingerprint(licenceKey),
            IsInGrace: false,
            OfflineGracePeriodDays: Math.Max(0, controlPlane.OfflineGracePeriodDays),
            CheckedAtUtc: clock.UtcNow,
            Message: $"Cloud entitlement check was rejected with HTTP {(int)statusCode}.",
            EnterpriseFeatures: [],
            Entitlements: [],
            Warnings: ["Cloud rejected the entitlement check; no response body was retained."]);

    private ControlPlaneEntitlementDecision CloudUnavailableDecision(
        ControlPlaneEntitlementCheckRequest request,
        ControlPlaneOptions controlPlane,
        string licenceKey,
        string message)
        => new(
            IsAllowed: request.RequiredTier == ControlPlaneCommercialTier.Scout,
            Status: ControlPlaneEntitlementDecisionStatus.CloudUnavailable,
            CapabilityKey: request.CapabilityKey,
            RequiredTier: request.RequiredTier,
            EffectiveTier: ControlPlaneCommercialTier.Scout,
            EffectiveTierName: ControlPlaneCommercialTier.Scout.ToString(),
            EffectiveTierRank: (int)ControlPlaneCommercialTier.Scout,
            CloudWasContacted: true,
            Source: "cloud-unavailable",
            LicenceKeyFingerprint: Fingerprint(licenceKey),
            IsInGrace: false,
            OfflineGracePeriodDays: Math.Max(0, controlPlane.OfflineGracePeriodDays),
            CheckedAtUtc: clock.UtcNow,
            Message: message,
            EnterpriseFeatures: [],
            Entitlements: [],
            Warnings: ["Paid private capabilities should fail closed unless a separate local signed-licence policy grants offline grace."]);

    private async Task<string?> ResolveLicenceKeyAsync(
        string? explicitLicenceKey,
        List<string> warnings,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(explicitLicenceKey))
        {
            return explicitLicenceKey.Trim();
        }

        var licencePath = licenceOptions.Value.FilePath;
        if (string.IsNullOrWhiteSpace(licencePath) || !File.Exists(licencePath))
        {
            return null;
        }

        try
        {
            var json = await File.ReadAllTextAsync(licencePath, cancellationToken);
            return ExtractLicenceKey(json);
        }
        catch (Exception exception) when (exception is JsonException or IOException or UnauthorizedAccessException)
        {
            warnings.Add("The local licence file could not be read for the Cloud entitlement check.");
            return null;
        }
    }

    private static Uri? ResolveBaseUri(ControlPlaneOptions controlPlane)
    {
        if (!string.IsNullOrWhiteSpace(controlPlane.BaseUrl)
            && Uri.TryCreate(controlPlane.BaseUrl.Trim(), UriKind.Absolute, out var baseUri)
            && (baseUri.Scheme == Uri.UriSchemeHttps || baseUri.Scheme == Uri.UriSchemeHttp))
        {
            return baseUri.AbsoluteUri.EndsWith("/", StringComparison.Ordinal)
                ? baseUri
                : new Uri($"{baseUri.AbsoluteUri}/");
        }

        return null;
    }

    private static void AddSafeMetadataHeaders(
        HttpRequestMessage request,
        ControlPlaneOptions controlPlane,
        ControlPlaneDeploymentMetadata? requestDeployment)
    {
        var deployment = requestDeployment ?? new ControlPlaneDeploymentMetadata();
        AddHeader(request, "X-KynticAI-Scout-Account-Id", deployment.AccountId, controlPlane.CustomerAccountId);
        AddHeader(request, "X-KynticAI-Scout-Data-Plane-Id", deployment.DataPlaneInstallationId, controlPlane.DataPlaneInstallationId);
        AddHeader(request, "X-KynticAI-Scout-Deployment-Name", deployment.DeploymentName, controlPlane.DeploymentName);
        AddHeader(request, "X-KynticAI-Scout-Deployment-Version", deployment.DeploymentVersion, controlPlane.DeploymentVersion);
        AddHeader(request, "X-KynticAI-Scout-Deployment-Region", deployment.DeploymentRegion, controlPlane.DeploymentRegion);
        AddHeader(request, "X-KynticAI-Scout-Environment-Type", deployment.EnvironmentType, controlPlane.EnvironmentType);
        AddHeader(request, "X-KynticAI-Scout-Update-Channel", deployment.UpdateChannel, controlPlane.UpdateChannel);
    }

    private static void AddHeader(HttpRequestMessage request, string name, params string?[] values)
    {
        var value = values.FirstOrDefault(static candidate => !string.IsNullOrWhiteSpace(candidate))?.Trim();
        if (string.IsNullOrWhiteSpace(value)
            || value.Contains('\r', StringComparison.Ordinal)
            || value.Contains('\n', StringComparison.Ordinal))
        {
            return;
        }

        request.Headers.TryAddWithoutValidation(name, value);
    }

    private static string? ExtractLicenceKey(string json)
    {
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;
        var direct = ReadString(root, "licenceKey");
        if (!string.IsNullOrWhiteSpace(direct))
        {
            return direct;
        }

        if (!root.TryGetProperty("payload", out var payloadElement)
            || payloadElement.ValueKind != JsonValueKind.String)
        {
            return null;
        }

        var payload = payloadElement.GetString();
        if (string.IsNullOrWhiteSpace(payload))
        {
            return null;
        }

        using var payloadDocument = JsonDocument.Parse(payload);
        return ReadString(payloadDocument.RootElement, "licenceKey");
    }

    private static IReadOnlyList<LicenceEntitlementResult> ReadEntitlements(JsonElement entitlements)
    {
        if (entitlements.ValueKind != JsonValueKind.Object)
        {
            return [];
        }

        return entitlements
            .EnumerateObject()
            .Select(property => new LicenceEntitlementResult(
                property.Name,
                property.Name.Equals("plan", StringComparison.OrdinalIgnoreCase)
                    ? CloudEnumName(property.Value, ["Free", "Pro", "Business", "Enterprise", "PrivateCloud"])
                    : property.Name.Equals("updateChannel", StringComparison.OrdinalIgnoreCase)
                        ? CloudEnumName(property.Value, ["Stable", "Preview", "EnterpriseLTS", "SecurityOnly"])
                        : JsonScalar(property.Value)))
            .OrderBy(entitlement => entitlement.Key)
            .ToList();
    }

    private static IReadOnlyList<string> ReadEnterpriseFeatures(JsonElement entitlements)
    {
        if (entitlements.ValueKind != JsonValueKind.Object
            || !entitlements.TryGetProperty("enterpriseFeatures", out var features)
            || features.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return features
            .EnumerateArray()
            .Select(JsonScalar)
            .Where(static value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Order(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string ReadCloudStatus(JsonElement root)
    {
        if (!root.TryGetProperty("status", out var status))
        {
            return "";
        }

        if (status.ValueKind == JsonValueKind.Number && status.TryGetInt32(out var value))
        {
            return value switch
            {
                0 => "Active",
                1 => "Grace",
                2 => "Expired",
                3 => "Revoked",
                4 => "Suspended",
                5 => "Invalid",
                _ => value.ToString()
            };
        }

        return JsonScalar(status);
    }

    private static bool IsAcceptedStatus(string status)
        => status.Equals("Active", StringComparison.OrdinalIgnoreCase)
           || status.Equals("Grace", StringComparison.OrdinalIgnoreCase)
           || status.Equals("grace_period", StringComparison.OrdinalIgnoreCase);

    private static bool IsGraceStatus(string status)
        => status.Equals("Grace", StringComparison.OrdinalIgnoreCase)
           || status.Equals("grace_period", StringComparison.OrdinalIgnoreCase);

    private static int? RankFromEntitlements(IReadOnlyList<LicenceEntitlementResult> entitlements)
    {
        var plan = entitlements.FirstOrDefault(static entitlement =>
            entitlement.Key.Equals("plan", StringComparison.OrdinalIgnoreCase));
        return string.IsNullOrWhiteSpace(plan?.Value) ? null : RankFromPlan(plan.Value);
    }

    private static int? RankFromPlan(int? plan)
        => plan switch
        {
            0 or 1 => (int)ControlPlaneCommercialTier.Scout,
            2 or 3 => (int)ControlPlaneCommercialTier.Fortress,
            4 => (int)ControlPlaneCommercialTier.Elite,
            _ => null
        };

    private static int? RankFromPlan(string plan)
        => plan.Trim() switch
        {
            var value when value.Equals("Free", StringComparison.OrdinalIgnoreCase) => (int)ControlPlaneCommercialTier.Scout,
            var value when value.Equals("Pro", StringComparison.OrdinalIgnoreCase) => (int)ControlPlaneCommercialTier.Scout,
            var value when value.Equals("Business", StringComparison.OrdinalIgnoreCase) => (int)ControlPlaneCommercialTier.Fortress,
            var value when value.Equals("Enterprise", StringComparison.OrdinalIgnoreCase) => (int)ControlPlaneCommercialTier.Fortress,
            var value when value.Equals("PrivateCloud", StringComparison.OrdinalIgnoreCase) => (int)ControlPlaneCommercialTier.Elite,
            var value when value.Equals("Scout", StringComparison.OrdinalIgnoreCase) => (int)ControlPlaneCommercialTier.Scout,
            var value when value.Equals("Fortress", StringComparison.OrdinalIgnoreCase) => (int)ControlPlaneCommercialTier.Fortress,
            var value when value.Equals("Elite", StringComparison.OrdinalIgnoreCase) => (int)ControlPlaneCommercialTier.Elite,
            _ => null
        };

    private static ControlPlaneCommercialTier TierFromRank(int rank)
        => rank switch
        {
            <= 0 => ControlPlaneCommercialTier.Scout,
            1 => ControlPlaneCommercialTier.Fortress,
            _ => ControlPlaneCommercialTier.Elite
        };

    private static int? ReadInt(JsonElement root, string propertyName)
        => root.TryGetProperty(propertyName, out var value) && value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var number)
            ? number
            : null;

    private static bool? ReadBool(JsonElement root, string propertyName)
        => root.TryGetProperty(propertyName, out var value) && value.ValueKind is JsonValueKind.True or JsonValueKind.False
            ? value.GetBoolean()
            : null;

    private static string ReadString(JsonElement root, string propertyName)
        => root.TryGetProperty(propertyName, out var value) ? JsonScalar(value) : "";

    private static string CloudEnumName(JsonElement value, string[] names)
    {
        if (value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var index) && index >= 0 && index < names.Length)
        {
            return names[index];
        }

        return JsonScalar(value);
    }

    private static string JsonScalar(JsonElement value) => value.ValueKind switch
    {
        JsonValueKind.String => value.GetString() ?? "",
        JsonValueKind.Number => value.GetRawText(),
        JsonValueKind.True => "true",
        JsonValueKind.False => "false",
        JsonValueKind.Array => string.Join(",", value.EnumerateArray().Select(JsonScalar)),
        JsonValueKind.Object => value.GetRawText(),
        _ => ""
    };

    private static string Fingerprint(string licenceKey)
    {
        if (string.IsNullOrWhiteSpace(licenceKey))
        {
            return "missing";
        }

        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(licenceKey.Trim()));
        return Convert.ToHexString(hash)[..16].ToLowerInvariant();
    }
}
