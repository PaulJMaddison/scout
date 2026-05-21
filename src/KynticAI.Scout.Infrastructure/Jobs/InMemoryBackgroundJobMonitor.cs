using System.Collections.Concurrent;
using KynticAI.Scout.Application.Abstractions;

namespace KynticAI.Scout.Infrastructure.Jobs;

internal sealed class InMemoryBackgroundJobMonitor : IBackgroundJobMonitor
{
    private readonly ConcurrentDictionary<string, BackgroundWorkerStatus> workers = new(StringComparer.OrdinalIgnoreCase);

    public void UpdateQueueDepth(string queueName, int queueDepth)
    {
        workers.AddOrUpdate(
            queueName,
            _ => new BackgroundWorkerStatus(queueName, true, "Queue initialized.", DateTime.UtcNow, queueDepth),
            (_, current) => current with { QueueDepth = queueDepth });
    }

    public void ReportHeartbeat(string workerName, bool isHealthy, string message, DateTime utcNow)
    {
        workers.AddOrUpdate(
            workerName,
            _ => new BackgroundWorkerStatus(workerName, isHealthy, message, utcNow, 0),
            (_, current) => current with
            {
                IsHealthy = isHealthy,
                Message = message,
                LastHeartbeatUtc = utcNow
            });
    }

    public IReadOnlyList<BackgroundWorkerStatus> GetWorkers()
        => workers.Values.OrderBy(x => x.WorkerName, StringComparer.OrdinalIgnoreCase).ToList();
}
