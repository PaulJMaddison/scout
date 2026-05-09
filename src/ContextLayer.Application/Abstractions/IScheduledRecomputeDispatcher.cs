using ContextLayer.Application.Contracts;

namespace ContextLayer.Application.Abstractions;

public interface IScheduledRecomputeDispatcher
{
    Task<ScheduledRecomputeDispatchResult> DispatchDueUsersAsync(string? tenantSlug, CancellationToken cancellationToken);
}
