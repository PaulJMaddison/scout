using ContextLayer.Domain.Enums;

namespace ContextLayer.Application.Abstractions;

public interface ICurrentActorService
{
    ActorContext GetCurrentActor();
}

public sealed record ActorContext(
    string SubjectId,
    string TenantSlug,
    string Email,
    string DisplayName,
    OperatorRole Role,
    bool IsAuthenticated,
    bool IsSystem)
{
    public bool CanViewSensitivePii => IsSystem || Role == OperatorRole.TenantAdmin;

    public static ActorContext System()
        => new(
            SubjectId: "system",
            TenantSlug: "system",
            Email: "system@contextlayer.local",
            DisplayName: "System",
            Role: OperatorRole.TenantAdmin,
            IsAuthenticated: false,
            IsSystem: true);
}
