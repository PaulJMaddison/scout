using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ContextLayer.Application.Abstractions;
using ContextLayer.Application.Contracts;
using ContextLayer.Application.Services;
using ContextLayer.Domain.Entities;
using ContextLayer.Infrastructure.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ContextLayer.Infrastructure.Services;

public sealed class LocalLicenceService(
    IOptions<LicenceOptions> licenceOptions,
    IOptions<ControlPlaneOptions> controlPlaneOptions,
    IContextLayerDbContext dbContext,
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
                document = JsonSerializer.Deserialize<LocalLicenceDocument>(json, JsonOptions);
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

        var isWellFormed = !string.IsNullOrWhiteSpace(document.LicenceKey)
            && document.LicenceKey.StartsWith("ucl_", StringComparison.OrdinalIgnoreCase)
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
        var isValid = !string.IsNullOrWhiteSpace(document.LicenceKey)
            && document.LicenceKey.StartsWith("ucl_", StringComparison.OrdinalIgnoreCase)
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
