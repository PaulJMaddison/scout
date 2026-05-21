using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using KynticAI.Scout.Application.Abstractions;
using KynticAI.Scout.Application.Contracts;
using KynticAI.Scout.Application.Services;
using KynticAI.Scout.Domain.Entities;
using KynticAI.Scout.Infrastructure.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace KynticAI.Scout.Infrastructure.Services;

public sealed partial class LocalLicenceService(
    IOptions<LicenceOptions> licenceOptions,
    IOptions<ControlPlaneOptions> controlPlaneOptions,
    IScoutDbContext dbContext,
    ICurrentActorService currentActorService,
    IClock clock) : ILicenceService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<LicenceStatusResult> GetStatusAsync(CancellationToken cancellationToken)
    {
        var licence = licenceOptions.Value;
        var controlPlane = controlPlaneOptions.Value;
        var utcNow = clock.UtcNow;
        var warnings = new List<string>();
        var source = string.IsNullOrWhiteSpace(licence.FilePath) ? "community-mode" : licence.FilePath;
        LocalLicenceDocument? document = null;

        if (!string.IsNullOrWhiteSpace(licence.FilePath)
            && File.Exists(licence.FilePath))
        {
            try
            {
                var json = await File.ReadAllTextAsync(licence.FilePath, cancellationToken);
                document = ParseLicenceDocument(json, licence, warnings);
                if (document is null)
                {
                    warnings.Add("The local licence file could not be parsed.");
                }
            }
            catch (Exception exception) when (exception is JsonException or IOException or UnauthorizedAccessException)
            {
                warnings.Add($"The local licence file could not be read: {exception.Message}");
            }
        }
        else if (!string.Equals(licence.Mode, "Community", StringComparison.OrdinalIgnoreCase))
        {
            warnings.Add("No local licence file was found. The instance is running with community entitlements.");
        }

        var status = document is null
            ? BuildCommunityStatus(licence, controlPlane, source, utcNow, warnings)
            : BuildLicensedStatus(document, licence, controlPlane, source, utcNow, warnings);

        await WriteLicenceAuditAsync(status, document is not null, cancellationToken);
        return status;
    }

    private static LicenceStatusResult BuildCommunityStatus(
        LicenceOptions licence,
        ControlPlaneOptions controlPlane,
        string source,
        DateTime utcNow,
        IReadOnlyList<string> warnings)
        => new(
            Mode: "Community",
            Status: licence.RequireValidLicence ? "LicenceRequired" : "Community",
            Plan: "Community",
            LicenceKeyFingerprint: "community",
            LicensedTo: "Open source community",
            Source: source,
            IssuedAtUtc: null,
            ExpiresAtUtc: null,
            LastCheckedAtUtc: utcNow,
            IsValid: !licence.RequireValidLicence,
            IsExpired: false,
            IsInOfflineGracePeriod: false,
            OfflineGracePeriodDays: licence.OfflineGracePeriodDays,
            ControlPlaneBaseUrl: controlPlane.BaseUrl,
            UpdateChannel: controlPlane.UpdateChannel,
            UsageReportingEnabled: controlPlane.UsageReportingEnabled,
            Entitlements:
            [
                new("open-core", "enabled"),
                new("local-demo", "enabled"),
                new("enterprise-connectors", "not-in-public-repo")
            ],
            Warnings: warnings);

    private static LicenceStatusResult BuildLicensedStatus(
        LocalLicenceDocument document,
        LicenceOptions licence,
        ControlPlaneOptions controlPlane,
        string source,
        DateTime utcNow,
        IReadOnlyList<string> existingWarnings)
    {
        var warnings = existingWarnings.ToList();
        var isExpired = document.ExpiresAtUtc.HasValue && document.ExpiresAtUtc.Value < utcNow;
        if (isExpired)
        {
            warnings.Add("The local licence has expired. Paid-only modules should remain disabled until a new licence is installed.");
        }

        var isWellFormed = IsRecognisedLicenceKey(document.LicenceKey)
            && !string.IsNullOrWhiteSpace(document.Plan)
            && !string.IsNullOrWhiteSpace(document.LicensedTo);

        if (!isWellFormed)
        {
            warnings.Add("The local licence file is missing required fields.");
        }

        var isInGrace = isExpired
            && document.ExpiresAtUtc.HasValue
            && document.ExpiresAtUtc.Value.AddDays(Math.Max(0, licence.OfflineGracePeriodDays)) >= utcNow;

        return new LicenceStatusResult(
            Mode: licence.Mode,
            Status: isWellFormed && !isExpired ? "Active" : isInGrace ? "OfflineGrace" : "Invalid",
            Plan: document.Plan,
            LicenceKeyFingerprint: StaticLicenceKeyGenerator.Fingerprint(document.LicenceKey),
            LicensedTo: document.LicensedTo,
            Source: source,
            IssuedAtUtc: document.IssuedAtUtc,
            ExpiresAtUtc: document.ExpiresAtUtc,
            LastCheckedAtUtc: utcNow,
            IsValid: isWellFormed && (!isExpired || isInGrace),
            IsExpired: isExpired,
            IsInOfflineGracePeriod: isInGrace,
            OfflineGracePeriodDays: licence.OfflineGracePeriodDays,
            ControlPlaneBaseUrl: controlPlane.BaseUrl,
            UpdateChannel: controlPlane.UpdateChannel,
            UsageReportingEnabled: controlPlane.UsageReportingEnabled,
            Entitlements: document.Entitlements.Select(entry => new LicenceEntitlementResult(entry.Key, entry.Value)).OrderBy(x => x.Key).ToList(),
            Warnings: warnings);
    }

    private async Task WriteLicenceAuditAsync(LicenceStatusResult status, bool hasLocalDocument, CancellationToken cancellationToken)
    {
        var actor = currentActorService.GetCurrentActor();
        if (hasLocalDocument
            && status.IsValid
            && !await dbContext.AuditEvents.AnyAsync(x =>
                x.Action == "licence.added"
                && x.EntityId == status.LicenceKeyFingerprint,
                cancellationToken))
        {
            dbContext.AuditEvents.Add(AuditEvent.Create(
                actor.TenantId,
                actor.Email,
                "licence.added",
                "Licence",
                status.LicenceKeyFingerprint,
                Guid.NewGuid().ToString("N"),
                JsonSerializer.Serialize(new
                {
                    status.Mode,
                    status.Plan,
                    status.LicensedTo,
                    status.Source
                }, JsonOptions),
                null,
                null,
                clock.UtcNow));
        }

        var action = status.IsExpired
            ? "licence.expired"
            : status.IsValid
                ? "licence.checked"
                : "licence.invalid";

        dbContext.AuditEvents.Add(AuditEvent.Create(
            actor.TenantId,
            actor.Email,
            action,
            "Licence",
            status.LicenceKeyFingerprint,
            Guid.NewGuid().ToString("N"),
            JsonSerializer.Serialize(new
            {
                status.Mode,
                status.Status,
                status.Plan,
                status.LicensedTo,
                status.Source,
                status.IsInOfflineGracePeriod,
                status.OfflineGracePeriodDays
            }, JsonOptions),
            null,
            null,
            clock.UtcNow));
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}

public sealed class StaticLicenceKeyGenerator : ILicenceKeyGenerator
{
    public string GenerateFingerprint(string licenceKey) => Fingerprint(licenceKey);

    public static string Fingerprint(string licenceKey)
    {
        if (string.IsNullOrWhiteSpace(licenceKey))
        {
            return "missing";
        }

        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(licenceKey.Trim()));
        return Convert.ToHexString(hash)[..16].ToLowerInvariant();
    }
}

public sealed class OfflineLicenceValidator : ILicenceValidator
{
    public LicenceValidationResult Validate(LocalLicenceDocument document, DateTime utcNow)
    {
        var warnings = new List<string>();
        var isExpired = document.ExpiresAtUtc.HasValue && document.ExpiresAtUtc.Value < utcNow;
        var isValid = LocalLicenceService.IsRecognisedLicenceKey(document.LicenceKey)
            && !string.IsNullOrWhiteSpace(document.Plan)
            && !string.IsNullOrWhiteSpace(document.LicensedTo)
            && !isExpired;

        if (!isValid)
        {
            warnings.Add("The licence is expired or missing required public fields.");
        }

        return new LicenceValidationResult(isValid, isExpired, warnings);
    }
}

public sealed partial class LocalLicenceService
{
    internal static bool IsRecognisedLicenceKey(string licenceKey)
        => licenceKey.StartsWith("scout_", StringComparison.OrdinalIgnoreCase)
           || licenceKey.StartsWith("Scout-", StringComparison.OrdinalIgnoreCase);

    private static LocalLicenceDocument? ParseLicenceDocument(string json, LicenceOptions licence, List<string> warnings)
    {
        using var document = JsonDocument.Parse(json);
        if (document.RootElement.TryGetProperty("payload", out var payloadElement)
            && document.RootElement.TryGetProperty("signature", out var signatureElement))
        {
            var format = document.RootElement.TryGetProperty("format", out var formatElement)
                ? formatElement.GetString()
                : "";
            if (!string.Equals(format, "Scout-LICENCE-v1", StringComparison.Ordinal))
            {
                warnings.Add("The cloud licence envelope format is not recognised.");
                return null;
            }

            var payload = payloadElement.GetString();
            var signature = signatureElement.GetString();
            if (string.IsNullOrWhiteSpace(payload) || string.IsNullOrWhiteSpace(signature))
            {
                warnings.Add("The cloud licence envelope is missing its payload or signature.");
                return null;
            }

            if (!string.IsNullOrWhiteSpace(licence.PublicKeyPem))
            {
                if (!VerifyCloudEnvelope(payload, signature, licence.PublicKeyPem, warnings))
                {
                    return null;
                }
            }
            else
            {
                warnings.Add("The cloud licence envelope signature was not verified because Licence:PublicKeyPem is not configured. Use this only for local development rehearsal.");
            }

            return ParseCloudPayload(payload);
        }

        return JsonSerializer.Deserialize<LocalLicenceDocument>(json, JsonOptions);
    }

    private static bool VerifyCloudEnvelope(string payload, string signature, string publicKeyPem, List<string> warnings)
    {
        try
        {
            using var rsa = RSA.Create();
            rsa.ImportFromPem(publicKeyPem);
            var signatureBytes = Convert.FromBase64String(signature);
            var payloadBytes = Encoding.UTF8.GetBytes(payload);
            if (rsa.VerifyData(payloadBytes, signatureBytes, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1))
            {
                return true;
            }

            warnings.Add("The cloud licence envelope signature is invalid.");
            return false;
        }
        catch (Exception exception) when (exception is CryptographicException or FormatException)
        {
            warnings.Add("The cloud licence envelope signature could not be verified.");
            return false;
        }
    }

    private static LocalLicenceDocument ParseCloudPayload(string payload)
    {
        using var cloudPayload = JsonDocument.Parse(payload);
        var root = cloudPayload.RootElement;
        var entitlements = ReadCloudEntitlements(root.TryGetProperty("entitlements", out var value) ? value : default);
        var plan = entitlements.TryGetValue("plan", out var planValue) ? planValue : "Cloud";
        return new LocalLicenceDocument(
            LicenceKey: GetString(root, "licenceKey"),
            Plan: plan,
            LicensedTo: GetString(root, "issuedTo"),
            IssuedAtUtc: GetDate(root, "issuedAt") ?? DateTime.UtcNow,
            ExpiresAtUtc: GetDate(root, "expiresAt"),
            Entitlements: entitlements);
    }

    private static IReadOnlyDictionary<string, string> ReadCloudEntitlements(JsonElement entitlements)
    {
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (entitlements.ValueKind != JsonValueKind.Object)
        {
            return values;
        }

        foreach (var property in entitlements.EnumerateObject())
        {
            values[property.Name] = property.Name.Equals("plan", StringComparison.OrdinalIgnoreCase)
                ? CloudEnumName(property.Value, ["Free", "Pro", "Business", "Enterprise", "PrivateCloud"])
                : property.Name.Equals("updateChannel", StringComparison.OrdinalIgnoreCase)
                    ? CloudEnumName(property.Value, ["Stable", "Preview", "EnterpriseLTS", "SecurityOnly"])
                    : JsonScalar(property.Value);
        }

        return values;
    }

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

    private static string GetString(JsonElement root, string propertyName)
        => root.TryGetProperty(propertyName, out var value) ? value.GetString() ?? "" : "";

    private static DateTime? GetDate(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var value))
        {
            return null;
        }

        if (value.TryGetDateTimeOffset(out var offset))
        {
            return offset.UtcDateTime;
        }

        return value.TryGetDateTime(out var date) ? DateTime.SpecifyKind(date, DateTimeKind.Utc) : null;
    }
}
