using KynticAI.Scout.Application.Contracts;

namespace KynticAI.Scout.Application.Abstractions;

public interface IScheduledRecomputeDispatcher
{
    Task<ScheduledRecomputeDispatchResult> DispatchDueUsersAsync(string? tenantSlug, CancellationToken cancellationToken);
}
