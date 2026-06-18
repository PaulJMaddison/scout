using KynticAI.Scout.Domain.Enums;

namespace KynticAI.Scout.Domain.Entities;

public sealed record RelationshipWeight(
    RelationshipType RelationshipType,
    string Objective,
    decimal Weight,
    string Direction,
    string Rationale);

public sealed record UclRelationship(
    string RelationshipId,
    RelationshipType RelationshipType,
    string LinkKind,
    string SourceType,
    string SourceId,
    string TargetType,
    string TargetId,
    decimal Confidence,
    RelationshipWeight Weight,
    string EvidenceSummary,
    IReadOnlyList<string> CitationIds);

public sealed record OutcomeSignal(
    string OutcomeId,
    string Objective,
    string Outcome,
    string SourceEntityType,
    string SourceEntityId,
    Guid CustomerAccountId,
    Guid? CustomerContactId,
    decimal Score,
    DateTime ObservedAtUtc,
    IReadOnlyList<string> CitationIds);

public sealed record SimilarPatternMatch(
    string MatchId,
    string MatchedSubjectType,
    string MatchedSubjectId,
    string MatchedAccountId,
    string Outcome,
    decimal SimilarityScore,
    decimal OutcomeWeight,
    IReadOnlyList<RelationshipType> RelationshipTypes,
    IReadOnlyList<string> Reasons,
    IReadOnlyList<string> CitationIds);

public sealed record RecommendationEvidence(
    string CitationId,
    string EvidenceType,
    string SourceEntityType,
    string SourceEntityId,
    string Summary,
    decimal Weight,
    bool IsMasked);

public sealed record EvidencePack(
    string EvidencePackId,
    string TenantSlug,
    string SubjectType,
    string SubjectIdentifierHash,
    string Objective,
    string Purpose,
    string ActorRole,
    decimal Confidence,
    DateTime GeneratedAtUtc,
    IReadOnlyList<UclRelationship> Relationships,
    IReadOnlyList<OutcomeSignal> OutcomeSignals,
    IReadOnlyList<SimilarPatternMatch> SimilarPatternMatches,
    IReadOnlyList<RecommendationEvidence> RecommendationEvidence,
    string LocalDerivedEvidencePackageJson,
    string CloudAggregateUsagePayloadJson,
    bool CloudPayloadContainsRawCustomerData);
