namespace ContextLayer.Application.Abstractions;

public interface IBackgroundJobMonitor
{
    void UpdateQueueDepth(string queueName, int queueDepth);

    void ReportHeartbeat(string workerName, bool isHealthy, string message, DateTime utcNow);

    IReadOnlyList<BackgroundWorkerStatus> GetWorkers();
}

public sealed record BackgroundWorkerStatus(
    string WorkerName,
    bool IsHealthy,
    string Message,
    DateTime LastHeartbeatUtc,
    int QueueDepth);
