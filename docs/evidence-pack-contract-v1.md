# UCL Evidence Pack Contract v1

`UclEvidencePackV1` is the stable local evidence-pack contract for Scout/UCL cross-repo use. It is emitted inside the customer-owned data plane and may contain exact authorised records, citations, provenance, relationships, fallback/demo weighted signals, recommendations, caveats, draft response content, and governance decisions.

`UclCloudAggregateUsageV1` is a separate Cloud/control-plane usage contract. It carries aggregate usage metadata only: package version, tenant/control-plane slug, feature/event/status, timestamps, feature counters, governance counters, and explicit data-boundary flags. It must not contain records, facts, snapshots, evidence packs, prompts, generated content, recommendations, citations, relationship types, weighted signals, caveats, hashed subject/account identifiers, or per-customer derived intelligence.

## Contract Artifacts

| Artifact | Path |
|---|---|
| .NET DTOs | `src/KynticAI.Scout.Application/Contracts/UclEvidencePackContracts.cs` |
| Local evidence-pack schema | `schema/ucl-evidence-pack-v1.schema.json` |
| Cloud aggregate usage schema | `schema/ucl-cloud-aggregate-usage-v1.schema.json` |
| Full local golden fixtures | `samples/evidence-pack/v1/local-full-evidence-packs.json` |
| Governed/masked golden fixtures | `samples/evidence-pack/v1/local-governed-masked-evidence-packs.json` |
| Cloud aggregate usage fixtures | `samples/evidence-pack/v1/cloud-aggregate-usage-payloads.json` |
| Unsafe Cloud payload examples | `samples/evidence-pack/v1/unsafe-cloud-payload-examples.json` |

## Enterprise Weighting Boundary

Scout may include basic/public fallback or demo weights in the local `UclEvidencePackV1` payload so open-core tests and demos remain executable. Those weights are not canonical. The local pack includes `relationshipWeighting` metadata with `scoutWeightsAreCanonical: false` and `canonicalOwner: "Enterprise"`.

Enterprise consumes `UclEvidencePackV1` as the stable input contract for canonical Rust relationship weighting, traversal, and outcome-pattern hardening. Enterprise must not require Cloud to receive local evidence packs or derived customer intelligence.

## Fixture Coverage

The v1 golden fixtures cover B2B SaaS, ecommerce, support churn, recruitment, finance retention, and healthcare operations. Healthcare fixtures are operational and synthetic only; they do not include patient-level data.

Unit tests in `tests/KynticAI.Scout.UnitTests/UclEvidencePackContractTests.cs` validate the golden fixtures, citation/provenance integrity, masking behaviour, Cloud aggregate exclusions, and rejection of deliberately unsafe Cloud payload examples.
