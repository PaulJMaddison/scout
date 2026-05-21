namespace KynticAI.Scout.Application.Contracts;

public sealed record LicenceEntitlementResult(
    string Key,
    string Value);

public sealed record LicenceStatusResult(
    string Mode,
    string Status,
    string Plan,
    string LicenceKeyFingerprint,
    string LicensedTo,
    string Source,
    DateTime? IssuedAtUtc,
    DateTime? ExpiresAtUtc,
    DateTime? LastCheckedAtUtc,
    bool IsValid,
    bool IsExpired,
    bool IsInOfflineGracePeriod,
    int OfflineGracePeriodDays,
    string ControlPlaneBaseUrl,
    string UpdateChannel,
    bool UsageReportingEnabled,
    IReadOnlyList<LicenceEntitlementResult> Entitlements,
    IReadOnlyList<string> Warnings);

public sealed record LocalLicenceDocument(
    string LicenceKey,
    string Plan,
    string LicensedTo,
    DateTime IssuedAtUtc,
    DateTime? ExpiresAtUtc,
    IReadOnlyDictionary<string, string> Entitlements);
