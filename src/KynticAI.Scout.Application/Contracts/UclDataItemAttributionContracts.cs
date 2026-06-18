using System.Text.Json;

namespace KynticAI.Scout.Application.Contracts;

public static class UclDataItemAttributionContractVersions
{
    public const string DataItemKind = "ucl.data-item";
    public const string DataItemV1 = "ucl.data-item.v1";
    public const string RelationshipSetKind = "ucl.relationship-set";
    public const string RelationshipSetV1 = "ucl.relationship-set.v1";
    public const string EnterpriseRelationshipAnalysisInputKind = "ucl.enterprise-relationship-analysis-input";
    public const string EnterpriseRelationshipAnalysisInputV1 = "ucl.enterprise-relationship-analysis-input.v1";
    public const string CloudAggregateControlPlanePayloadKind = "ucl.cloud-aggregate-control-plane-payload";
    public const string CloudAggregateControlPlanePayloadV1 = "ucl.cloud-aggregate-control-plane-payload.v1";
    public const string BasicFallbackOnlyScope = "basic-public-fallback-only";
    public const string CustomerOwnedDataPlane = "customer-owned-data-plane";
}

public sealed record DataItem(
    string ItemKind,
    string ItemVersion,
    string DataItemId,
    string DataItemType,
    string SourceMode,
    string SourceSystem,
    string SourceRecordId,
    DateTime ObservedAtUtc,
    DateTime IngestedAtUtc,
    string DataPlane,
    IReadOnlyList<DataItemIdentity> Identities,
    JsonElement ExactPayload);

public sealed record DataItemIdentity(
    string IdentityType,
    string IdentityValue,
    string NormalizedValue,
    bool IsPrimary,
    string LinkScope);

public sealed record RelationshipEdge(
    string EdgeId,
    string RelationshipType,
    string LinkKind,
    string SourceDataItemId,
    string TargetDataItemId,
    string IdentityType,
    string IdentityValue,
    decimal Confidence,
    IReadOnlyList<string> CitationDataItemIds);

public sealed record AttributionEvent(
    string EventId,
    string DataItemId,
    int Sequence,
    string EventType,
    DateTime OccurredAtUtc,
    string Label);

public sealed record AttributionPath(
    string PathId,
    string SubjectIdentityType,
    string SubjectIdentityValue,
    string Objective,
    IReadOnlyList<AttributionEvent> Events,
    IReadOnlyList<string> PossibleNextActions,
    OutcomeEvent? Outcome);

public sealed record RelationshipSet(
    string SetKind,
    string SetVersion,
    string RelationshipSetId,
    string SubjectDataItemId,
    string Objective,
    string AnalysisScope,
    IReadOnlyList<RelationshipEdge> Edges,
    IReadOnlyList<AttributionPath> AttributionPaths,
    IReadOnlyList<OutcomeEvent> HistoricalOutcomes);

public sealed record OutcomeEvent(
    string OutcomeEventId,
    string DataItemId,
    string OutcomeType,
    bool Converted,
    decimal OutcomeValue,
    DateTime OccurredAtUtc,
    IReadOnlyList<string> CitationDataItemIds);

public sealed record EnterpriseRelationshipAnalysisInput(
    string InputKind,
    string InputVersion,
    string InputId,
    DateTime GeneratedAtUtc,
    string TenantSlug,
    string DataPlane,
    string Producer,
    string PublicFallbackAnalysisScope,
    bool CloudControlPlaneRequired,
    bool EnterpriseOnlyInternalsIncluded,
    IReadOnlyList<DataItem> DataItems,
    IReadOnlyList<RelationshipSet> RelationshipSets,
    IReadOnlyList<string> RequiredEnterpriseOutputs);

public sealed record CloudAggregateControlPlanePayload(
    string PayloadKind,
    string PayloadVersion,
    string TenantSlug,
    string Feature,
    string EventName,
    string Status,
    DateTime GeneratedAtUtc,
    CloudAggregateControlPlaneCounters Counters,
    CloudAggregateControlPlaneBoundary DataBoundary);

public sealed record CloudAggregateControlPlaneCounters(
    int DataItemCount,
    int RelationshipSetCount,
    int AttributionPathCount,
    int HistoricalOutcomeCount,
    int PossibleActionCount);

public sealed record CloudAggregateControlPlaneBoundary(
    bool RawDataRetainedInCustomerDataPlane,
    bool ContainsRawCustomerData,
    bool ContainsDataItems,
    bool ContainsExactPayloads,
    bool ContainsIdentities,
    bool ContainsRelationshipEdges,
    bool ContainsAttributionPaths,
    bool ContainsOutcomeEvents,
    bool ContainsEnterpriseAnalysisInput);
