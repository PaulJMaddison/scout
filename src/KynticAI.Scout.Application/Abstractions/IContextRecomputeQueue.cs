namespace KynticAI.Scout.Application.Abstractions;

public interface IContextRecomputeQueue
{
    ValueTask EnqueueAsync(ContextRecomputeRequest request, CancellationToken cancellationToken);
}

public sealed record ContextRecomputeRequest(
    Guid TenantId,
    Guid UserProfileId,
    string CorrelationId,
    IReadOnlyList<Guid> SelectorExecutionIds);
