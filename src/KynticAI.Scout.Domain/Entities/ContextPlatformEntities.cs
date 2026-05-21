using KynticAI.Scout.Domain.Common;
using KynticAI.Scout.Domain.Enums;
using KynticAI.Scout.Domain.Saas;

namespace KynticAI.Scout.Domain.Entities;

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

public sealed class ConnectorCredential : AuditedTenantEntity
{
    private ConnectorCredential()
    {
    }

    public Guid DataSourceId { get; private set; }

    public string ConnectorType { get; private set; } = string.Empty;

    public string SecretKey { get; private set; } = string.Empty;

    public string SecretReference { get; private set; } = string.Empty;

    public string ProtectedValue { get; private set; } = string.Empty;

    public DataSource DataSource { get; private set; } = null!;

    public static ConnectorCredential Create(
        Guid tenantId,
        Guid dataSourceId,
        string connectorType,
        string secretKey,
        string secretReference,
        string protectedValue,
        DateTime utcNow)
    {
        var credential = new ConnectorCredential
        {
            TenantId = tenantId,
            DataSourceId = dataSourceId,
            ConnectorType = connectorType.Trim(),
            SecretKey = secretKey.Trim(),
            SecretReference = secretReference.Trim(),
            ProtectedValue = protectedValue.Trim()
        };

        credential.SetAuditTimestamps(utcNow);
        return credential;
    }

    public void Rotate(string protectedValue, DateTime utcNow)
    {
        ProtectedValue = protectedValue.Trim();
        SetAuditTimestamps(utcNow);
    }
}

public sealed class SourceSystemEvent : AuditedTenantEntity
{
    private SourceSystemEvent()
    {
    }

    public Guid? WorkspaceId { get; private set; }

    public string EventId { get; private set; } = string.Empty;

    public string SourceSystem { get; private set; } = string.Empty;

    public string EventType { get; private set; } = string.Empty;

    public string? ExternalUserId { get; private set; }

    public string? ExternalAccountId { get; private set; }

    public Guid? UserProfileId { get; private set; }

    public Guid? DataSourceId { get; private set; }

    public SourceSystemEventStatus Status { get; private set; }

    public string PayloadJson { get; private set; } = "{}";

    public string HeadersJson { get; private set; } = "{}";

    public string ProcessingSummary { get; private set; } = string.Empty;

    public string? ErrorMessage { get; private set; }

    public string? DeadLetterReason { get; private set; }

    public int MatchedSelectorCount { get; private set; }

    public string CorrelationId { get; private set; } = string.Empty;

    public DateTime ReceivedAtUtc { get; private set; }

    public DateTime ObservedAtUtc { get; private set; }

    public DateTime? ProcessedAtUtc { get; private set; }

    public DateTime? DeadLetteredAtUtc { get; private set; }

    public Tenant Tenant { get; private set; } = null!;

    public UserProfile? UserProfile { get; private set; }

    public DataSource? DataSource { get; private set; }

    public Workspace? Workspace { get; private set; }

    public static SourceSystemEvent Create(
        Guid tenantId,
        Guid? workspaceId,
        string eventId,
        string sourceSystem,
        string eventType,
        string? externalUserId,
        string? externalAccountId,
        Guid? userProfileId,
        Guid? dataSourceId,
        string payloadJson,
        string headersJson,
        string correlationId,
        DateTime observedAtUtc,
        DateTime utcNow)
    {
        var sourceEvent = new SourceSystemEvent
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            EventId = eventId.Trim(),
            SourceSystem = sourceSystem.Trim(),
            EventType = eventType.Trim(),
            ExternalUserId = string.IsNullOrWhiteSpace(externalUserId) ? null : externalUserId.Trim(),
            ExternalAccountId = string.IsNullOrWhiteSpace(externalAccountId) ? null : externalAccountId.Trim(),
            UserProfileId = userProfileId,
            DataSourceId = dataSourceId,
            PayloadJson = string.IsNullOrWhiteSpace(payloadJson) ? "{}" : payloadJson.Trim(),
            HeadersJson = string.IsNullOrWhiteSpace(headersJson) ? "{}" : headersJson.Trim(),
            CorrelationId = correlationId.Trim(),
            ObservedAtUtc = observedAtUtc,
            ReceivedAtUtc = utcNow,
            Status = SourceSystemEventStatus.Received
        };

        sourceEvent.SetAuditTimestamps(utcNow);
        return sourceEvent;
    }

    public void MarkIgnored(string summary, DateTime utcNow)
    {
        Status = SourceSystemEventStatus.Ignored;
        ProcessingSummary = summary.Trim();
        ProcessedAtUtc = utcNow;
        SetAuditTimestamps(utcNow);
    }

    public void MarkProcessed(int matchedSelectorCount, string summary, DateTime utcNow)
    {
        Status = SourceSystemEventStatus.Processed;
        MatchedSelectorCount = matchedSelectorCount;
        ProcessingSummary = summary.Trim();
        ErrorMessage = null;
        DeadLetterReason = null;
        ProcessedAtUtc = utcNow;
        SetAuditTimestamps(utcNow);
    }

    public void MarkFailed(string errorMessage, DateTime utcNow)
    {
        Status = SourceSystemEventStatus.Failed;
        ErrorMessage = errorMessage.Trim();
        ProcessedAtUtc = utcNow;
        SetAuditTimestamps(utcNow);
    }

    public void MarkDeadLettered(string reason, DateTime utcNow)
    {
        Status = SourceSystemEventStatus.DeadLettered;
        DeadLetterReason = reason.Trim();
        DeadLetteredAtUtc = utcNow;
        SetAuditTimestamps(utcNow);
    }
}
