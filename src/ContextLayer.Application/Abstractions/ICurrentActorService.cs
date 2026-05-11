using ContextLayer.Domain.Enums;

namespace ContextLayer.Application.Abstractions;

public interface ICurrentActorService
{
    ActorContext GetCurrentActor();
}

public sealed record ActorContext(
    string SubjectId,
    Guid? TenantId,
    string TenantSlug,
    Guid? WorkspaceId,
    string? WorkspaceSlug,
    string Email,
    string DisplayName,
    OperatorRole Role,
    bool IsAuthenticated,
    bool IsSystem)
{
    public bool IsPlatformOwner => Role == OperatorRole.PlatformOwner;

    public bool CanViewSensitivePii => IsSystem || Role is OperatorRole.PlatformOwner or OperatorRole.TenantAdmin;

    public static ActorContext System()
        => new(
            SubjectId: "system",
            TenantId: null,
            TenantSlug: "system",
            WorkspaceId: null,
            WorkspaceSlug: null,
            Email: "system@contextlayer.local",
            DisplayName: "System",
            Role: OperatorRole.TenantAdmin,
            IsAuthenticated: false,
            IsSystem: true);
}
