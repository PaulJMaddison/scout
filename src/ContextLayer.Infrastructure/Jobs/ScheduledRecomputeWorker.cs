using ContextLayer.Application.Abstractions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ContextLayer.Infrastructure.Jobs;

internal sealed class ScheduledRecomputeWorker(
    IServiceScopeFactory scopeFactory,
    IBackgroundJobMonitor backgroundJobMonitor,
    IClock clock,
    ILogger<ScheduledRecomputeWorker> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        backgroundJobMonitor.ReportHeartbeat("scheduled-recompute-worker", true, "Worker started.", clock.UtcNow);
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(1));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                backgroundJobMonitor.ReportHeartbeat("scheduled-recompute-worker", true, "Dispatching scheduled recompute.", clock.UtcNow);
                await using var scope = scopeFactory.CreateAsyncScope();
                var dispatcher = scope.ServiceProvider.GetRequiredService<IScheduledRecomputeDispatcher>();
                await dispatcher.DispatchDueUsersAsync(null, stoppingToken);
                backgroundJobMonitor.ReportHeartbeat("scheduled-recompute-worker", true, "Scheduled recompute dispatch completed.", clock.UtcNow);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                backgroundJobMonitor.ReportHeartbeat("scheduled-recompute-worker", false, ex.Message, clock.UtcNow);
                logger.LogError(ex, "Scheduled recompute dispatch failed.");
            }
        }
    }
}
