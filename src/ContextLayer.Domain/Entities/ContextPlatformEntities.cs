using ContextLayer.Domain.Common;
using ContextLayer.Domain.Enums;

namespace ContextLayer.Domain.Entities;

public sealed class RecomputeJob : AuditedTenantEntity
{
    private RecomputeJob()
    {
    }

    public Guid UserProfileId { get; private set; }

    public string CorrelationId { get; private set; } = string.Empty;

    public string TriggeredBy { get; private set; } = string.Empty;

    public RecomputeJobStatus Status { get; private set; }

    public int SelectorExecutionCount { get; private set; }

    public string Summary { get; private set; } = string.Empty;

    public string MetadataJson { get; private set; } = "{}";

    public DateTime RequestedAtUtc { get; private set; }

    public DateTime? StartedAtUtc { get; private set; }

    public DateTime? CompletedAtUtc { get; private set; }

    public string? FailureReason { get; private set; }

    public UserProfile UserProfile { get; private set; } = null!;

    public static RecomputeJob Create(
        Guid tenantId,
        Guid userProfileId,
        string correlationId,
        string triggeredBy,
        int selectorExecutionCount,
        string summary,
        string metadataJson,
        DateTime utcNow)
    {
        var job = new RecomputeJob
        {
            TenantId = tenantId,
            UserProfileId = userProfileId,
            CorrelationId = correlationId.Trim(),
            TriggeredBy = triggeredBy.Trim(),
            SelectorExecutionCount = selectorExecutionCount,
            Summary = summary.Trim(),
            MetadataJson = string.IsNullOrWhiteSpace(metadataJson) ? "{}" : metadataJson.Trim(),
            RequestedAtUtc = utcNow,
            Status = RecomputeJobStatus.Pending
        };

        job.SetAuditTimestamps(utcNow);
        return job;
    }

    public void MarkRunning(DateTime utcNow)
    {
        Status = RecomputeJobStatus.Running;
        StartedAtUtc = utcNow;
        SetAuditTimestamps(utcNow);
    }

    public void MarkCompleted(string summary, string metadataJson, DateTime utcNow)
    {
        Status = RecomputeJobStatus.Completed;
        Summary = summary.Trim();
        MetadataJson = string.IsNullOrWhiteSpace(metadataJson) ? "{}" : metadataJson.Trim();
        CompletedAtUtc = utcNow;
        FailureReason = null;
        SetAuditTimestamps(utcNow);
    }

    public void MarkFailed(string failureReason, string metadataJson, DateTime utcNow)
    {
        Status = RecomputeJobStatus.Failed;
        FailureReason = failureReason.Trim();
        MetadataJson = string.IsNullOrWhiteSpace(metadataJson) ? "{}" : metadataJson.Trim();
        CompletedAtUtc = utcNow;
        SetAuditTimestamps(utcNow);
    }
}

public sealed class ProvenanceMetadata : AuditedTenantEntity
{
    private ProvenanceMetadata()
    {
    }

    public Guid? SelectorExecutionId { get; private set; }

    public Guid? ContextFactId { get; private set; }

    public string Kind { get; private set; } = string.Empty;

    public string SourceSystem { get; private set; } = string.Empty;

    public string SourceRecordKey { get; private set; } = string.Empty;

    public string MetadataJson { get; private set; } = "{}";

    public DateTime ObservedAtUtc { get; private set; }

    public SelectorExecution? SelectorExecution { get; private set; }

    public ContextFact? ContextFact { get; private set; }

    public static ProvenanceMetadata Create(
        Guid tenantId,
        Guid? selectorExecutionId,
        Guid? contextFactId,
        string kind,
        string sourceSystem,
        string sourceRecordKey,
        string metadataJson,
        DateTime observedAtUtc,
        DateTime utcNow)
    {
        var provenance = new ProvenanceMetadata
        {
            TenantId = tenantId,
            SelectorExecutionId = selectorExecutionId,
            ContextFactId = contextFactId,
            Kind = kind.Trim(),
            SourceSystem = sourceSystem.Trim(),
            SourceRecordKey = sourceRecordKey.Trim(),
            MetadataJson = string.IsNullOrWhiteSpace(metadataJson) ? "{}" : metadataJson.Trim(),
            ObservedAtUtc = observedAtUtc
        };

        provenance.SetAuditTimestamps(utcNow);
        return provenance;
    }
}
