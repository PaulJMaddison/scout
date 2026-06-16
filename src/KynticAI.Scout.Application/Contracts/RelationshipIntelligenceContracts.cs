namespace KynticAI.Scout.Application.Contracts;

public sealed record NextActionInput(
    string TenantSlug,
    string SubjectType,
    string SubjectIdentifier,
    string Objective,
    string Purpose,
    string ActorRole);

public sealed record ExactLinkedRecordsSummaryResult(
    IReadOnlyDictionary<string, int> RecordCounts,
    IReadOnlyList<ExactLinkedRecordSummaryResult> Records);

public sealed record ExactLinkedRecordSummaryResult(
    string CitationId,
    string RecordType,
    string RecordId,
    string ExternalId,
    string Label,
    string Summary,
    DateTime? ObservedAtUtc,
    bool IsMasked,
    IReadOnlyDictionary<string, string> Fields);

public sealed record RelationshipResult(
    string RelationshipId,
    string RelationshipType,
    string LinkKind,
    string SourceType,
    string SourceId,
    string TargetType,
    string TargetId,
    decimal Confidence,
    decimal Weight,
    string Rationale,
    IReadOnlyList<string> CitationIds);

public sealed record SimilarPatternMatchResult(
    string MatchId,
    string MatchedSubjectType,
    string MatchedSubjectId,
    string MatchedAccountId,
    string Outcome,
    decimal SimilarityScore,
    decimal OutcomeWeight,
    IReadOnlyList<string> RelationshipTypes,
    IReadOnlyList<string> Reasons,
    IReadOnlyList<string> CitationIds);

public sealed record WeightedSignalResult(
    string SignalKey,
    string Label,
    string Direction,
    decimal Weight,
    decimal Score,
    decimal Contribution,
    string Explanation,
    IReadOnlyList<string> CitationIds);

public sealed record RecommendedNextActionResult(
    string Action,
    string Timing,
    string Rationale,
    decimal Score,
    IReadOnlyList<string> CitationIds);

public sealed record DraftResponseResult(
    string Channel,
    string Subject,
    string Body,
    IReadOnlyList<string> CitationIds,
    bool RequiresHumanReview);

public sealed record ProvenanceCitationResult(
    string CitationId,
    string SourceEntityType,
    string SourceEntityId,
    string EvidenceType,
    string Summary,
    bool IsMasked);

public sealed record GovernanceDecisionResult(
    bool IsAllowed,
    string DataPlane,
    bool RawDataRetainedInCustomerDataPlane,
    bool CloudPayloadContainsRawCustomerData,
    IReadOnlyList<string> AppliedRules,
    IReadOnlyList<string> MaskedFields,
    IReadOnlyList<string> DeniedFields,
    string CloudControlPlanePayloadJson);

public sealed record EvidencePackResult(
    string EvidencePackId,
    string PackageVersion,
    DateTime GeneratedAtUtc,
    string LocalDataPlanePackageJson,
    string CloudControlPlanePayloadJson,
    bool CloudPayloadContainsRawCustomerData);

public sealed record NextActionResult(
    string TenantSlug,
    string SubjectType,
    string SubjectIdentifier,
    string Objective,
    string Purpose,
    string ActorRole,
    ExactLinkedRecordsSummaryResult ExactLinkedRecords,
    IReadOnlyList<RelationshipResult> Relationships,
    IReadOnlyList<SimilarPatternMatchResult> SimilarWonLostPatterns,
    IReadOnlyList<WeightedSignalResult> WeightedSignals,
    RecommendedNextActionResult RecommendedNextAction,
    DraftResponseResult? DraftResponse,
    decimal Confidence,
    IReadOnlyList<string> Caveats,
    IReadOnlyList<ProvenanceCitationResult> Provenance,
    GovernanceDecisionResult Governance,
    EvidencePackResult EvidencePack);
