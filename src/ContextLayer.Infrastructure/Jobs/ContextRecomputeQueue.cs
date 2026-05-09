using System.Threading.Channels;
using ContextLayer.Application.Abstractions;

namespace ContextLayer.Infrastructure.Jobs;

internal sealed class ContextRecomputeQueue : IContextRecomputeQueue
{
    private readonly IBackgroundJobMonitor backgroundJobMonitor;
    private readonly Channel<ContextRecomputeRequest> channel = Channel.CreateUnbounded<ContextRecomputeRequest>(
        new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });
    private int pendingCount;

    public ContextRecomputeQueue(IBackgroundJobMonitor backgroundJobMonitor)
    {
        this.backgroundJobMonitor = backgroundJobMonitor;
        backgroundJobMonitor.UpdateQueueDepth("context-recompute-queue", 0);
    }

    public async ValueTask EnqueueAsync(ContextRecomputeRequest request, CancellationToken cancellationToken)
    {
        await channel.Writer.WriteAsync(request, cancellationToken);
        backgroundJobMonitor.UpdateQueueDepth("context-recompute-queue", Interlocked.Increment(ref pendingCount));
    }

    public async IAsyncEnumerable<ContextRecomputeRequest> ReadAllAsync([System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await foreach (var request in channel.Reader.ReadAllAsync(cancellationToken))
        {
            backgroundJobMonitor.UpdateQueueDepth("context-recompute-queue", Math.Max(0, Interlocked.Decrement(ref pendingCount)));
            yield return request;
        }
    }
}
