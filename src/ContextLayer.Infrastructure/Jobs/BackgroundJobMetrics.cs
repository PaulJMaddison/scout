using System.Diagnostics.Metrics;
using ContextLayer.Application.Abstractions;
using Microsoft.Extensions.Hosting;

namespace ContextLayer.Infrastructure.Jobs;

internal sealed class BackgroundJobMetrics(
    IBackgroundJobMonitor backgroundJobMonitor,
    TimeProvider timeProvider)
    : IHostedService
{
    private static readonly Meter Meter = new("ContextLayer.BackgroundJobs");

    private readonly ObservableGauge<int> queueDepthGauge = Meter.CreateObservableGauge(
        "contextlayer_background_queue_depth",
        () => ObserveQueueDepth(backgroundJobMonitor),
        unit: "items",
        description: "Current pending queue depth for Context Layer background queues.");

    private readonly ObservableGauge<int> workerHealthGauge = Meter.CreateObservableGauge(
        "contextlayer_background_worker_healthy",
        () => ObserveWorkerHealth(backgroundJobMonitor),
        description: "Whether each Context Layer background worker reports healthy status (1 healthy, 0 unhealthy).");

    private readonly ObservableGauge<double> heartbeatAgeGauge = Meter.CreateObservableGauge(
        "contextlayer_background_worker_heartbeat_age_seconds",
        () => ObserveHeartbeatAge(backgroundJobMonitor, timeProvider),
        unit: "s",
        description: "Age in seconds since the last heartbeat for each Context Layer background worker.");

    public Task StartAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private static IEnumerable<Measurement<int>> ObserveQueueDepth(IBackgroundJobMonitor backgroundJobMonitor)
    {
        foreach (var worker in backgroundJobMonitor.GetWorkers())
        {
            yield return new Measurement<int>(
                worker.QueueDepth,
                new KeyValuePair<string, object?>("worker", worker.WorkerName));
        }
    }

    private static IEnumerable<Measurement<int>> ObserveWorkerHealth(IBackgroundJobMonitor backgroundJobMonitor)
    {
        foreach (var worker in backgroundJobMonitor.GetWorkers())
        {
            yield return new Measurement<int>(
                worker.IsHealthy ? 1 : 0,
                new KeyValuePair<string, object?>("worker", worker.WorkerName));
        }
    }

    private static IEnumerable<Measurement<double>> ObserveHeartbeatAge(
        IBackgroundJobMonitor backgroundJobMonitor,
        TimeProvider timeProvider)
    {
        var utcNow = timeProvider.GetUtcNow().UtcDateTime;
        foreach (var worker in backgroundJobMonitor.GetWorkers())
        {
            yield return new Measurement<double>(
                Math.Max(0d, (utcNow - worker.LastHeartbeatUtc).TotalSeconds),
                new KeyValuePair<string, object?>("worker", worker.WorkerName));
        }
    }
}
