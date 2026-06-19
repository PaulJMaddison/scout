namespace KynticAI.Scout.Application.Contracts;

public enum ControlPlaneCommercialTier
{
    Scout = 0,
    Fortress = 1,
    Elite = 2
}

public enum ControlPlaneEntitlementDecisionStatus
{
    NotChecked = 0,
    Allowed = 1,
    Denied = 2,
    Misconfigured = 3,
    CloudUnavailable = 4,
    CloudRejected = 5,
    InvalidCloudResponse = 6
}

public static class ControlPlaneCapabilityKeys
{
    public const string ScoutOpenCore = "scout-open-core";
    public const string FortressRuntime = "fortress-runtime";
    public const string RelationshipSetEngine = "relationship-set-engine";
    public const string EliteOperatorPack = "elite-operator-pack";
}

public sealed record ControlPlaneDeploymentMetadata(
    string? AccountId = null,
    string? DataPlaneInstallationId = null,
    string? DeploymentName = null,
    string? DeploymentVersion = null,
    string? DeploymentRegion = null,
    string? EnvironmentType = null,
    string? UpdateChannel = null);

public sealed record ControlPlaneEntitlementCheckRequest(
    string CapabilityKey,
    ControlPlaneCommercialTier RequiredTier,
    string? LicenceKey = null,
    ControlPlaneDeploymentMetadata? Deployment = null);

public sealed record ControlPlaneEntitlementDecision(
    bool IsAllowed,
    ControlPlaneEntitlementDecisionStatus Status,
    string CapabilityKey,
    ControlPlaneCommercialTier RequiredTier,
    ControlPlaneCommercialTier EffectiveTier,
    string EffectiveTierName,
    int EffectiveTierRank,
    bool CloudWasContacted,
    string Source,
    string LicenceKeyFingerprint,
    bool IsInGrace,
    int OfflineGracePeriodDays,
    DateTime CheckedAtUtc,
    string Message,
    IReadOnlyList<string> EnterpriseFeatures,
    IReadOnlyList<LicenceEntitlementResult> Entitlements,
    IReadOnlyList<string> Warnings);
