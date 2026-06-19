using KynticAI.Scout.Application.Contracts;

namespace KynticAI.Scout.Application.Services;

public interface IControlPlaneEntitlementClient
{
    Task<ControlPlaneEntitlementDecision> CheckAsync(
        ControlPlaneEntitlementCheckRequest request,
        CancellationToken cancellationToken = default);
}
