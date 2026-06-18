# 02 Upgrade Architecture

Date: 2026-06-18

Mode: architecture design only. No code, schema, API, package, deployment, or runtime changes were made.

Evidence base:

- `C:\Kyntic\docs\source-of-truth-naming-map.md`
- `docs/work-packages/wp2-upgrade-and-lancedb-migration/01-discovery-audit.md`
- Scout/open-core repo: `C:\Kyntic\UCL`
- Enterprise/Fortress repo: `C:\Kyntic\universalcontextlayer-enterprise`
- Cloud/control-plane repo: `C:\Kyntic\universalcontextlayer-cloud`

## Target Architecture

The canonical upgrade architecture keeps KynticAI Scout as the local, customer-owned Docker data plane. Scout remains the public/open-core entrypoint for ingestion, local APIs, connector abstractions, provenance, audit, governance, and public fallback intelligence. Customer source records, exact data items, context facts, relationship evidence, credentials, vectors, embeddings, prompts, and generated customer content stay inside the customer-owned environment by default.

Enterprise/Fortress installs into the same customer-controlled environment as the private paid extension path. It adds the proprietary local runtime, canonical relationship-set analysis, attribution paths, comparable-example analysis, outcome matching, governed JSON handoff, and the Enterprise/Fortress Rust engine/vector DB boundary. Elite sits above Fortress as the operator-assisted strategic product path; it may add reviewed outcome loops and private/local model or operator packs, but it does not change the rule that raw and derived customer intelligence remains local.

Cloud stays out of the data plane. It controls account, subscription, licence, entitlement, private artefact, download, update, data-plane registration, heartbeat, support, and safe aggregate usage metadata. Cloud authorises the upgrade and distributes metadata needed to install or update private runtime packages, but it never stores, stages, migrates, indexes, or analyses customer data.

Logical flow:

1. Connectors, SDKs, assisted imports, and local operators send writes to the local Scout API where practical.
2. Scout persists public/open-core source events, exact data items where available, context facts, provenance, audit, and governance records in local customer-owned storage.
3. A local storage abstraction decides whether vector and relationship work targets Scout-compatible storage, Enterprise/Fortress LanceDB/vector DB, pgvector companion storage, or a local dual-write bridge.
4. Enterprise/Fortress consumes local data-plane records through the adapter/storage contract, writes local vectors and relationship-set indexes, and produces governed JSON handoff locally.
5. Cloud gates entitlement and update metadata only. It receives no source payloads, derived relationship intelligence, vectors, evidence packs, attribution paths, relationship sets, or customer-specific recommendations.

## Connector Routing Principle

Connectors should write through the local Scout API where practical. The local API is the stable public boundary for source-system events, exact data items, provenance, audit, and future canonical upgrade inputs. Connector authors should not need to know whether the deployed customer environment stores vectors in Scout-compatible PostgreSQL/pgvector storage, Enterprise/Fortress LanceDB, or a dual-write local transition path.

Existing SDK and n8n event ingestion already follows the intended pattern through `POST /api/v1/events/source-system`. The stale `packages/typescript/scout-n8n-node` route should be realigned or retired before it is presented as an upgrade-safe connector path.

Selector-time connector plugins may continue to fetch in process for local selector execution, but the target architecture should separate fetch from canonical write. Any connector path that creates durable source records, exact data items, outcome events, relationship inputs, or upgrade backfill material should write through a local API or local adapter boundary that preserves the same authentication, tenancy, idempotency, provenance, and audit rules.

Private Enterprise/Fortress connector modules should follow the same rule. They can add paid connector capability, but they should not bypass Scout's local data-plane contract or write customer data to Cloud. If a private connector needs a richer local ingestion shape than Scout currently exposes, the preferred path is a versioned local API extension or private local adapter, not connector-specific direct writes into LanceDB or private tables.

## Local API Contract Principle

The local API contract is the upgrade seam. It should present stable, versioned operations for ingestion and migration inputs while hiding the backing storage choice from connectors and operator workflows.

Required contract properties:

- Local-only execution by default. The API runs inside the customer-owned Scout/Fortress environment and does not require Cloud for runtime data movement.
- Tenant, workspace, actor, source-system, source-record, citation, provenance, and correlation identifiers on every durable write.
- Idempotency keys for normal ingestion and migration backfill, so retries cannot duplicate records, vectors, relationship sets, or outcome events.
- Typed validation and typed errors for unsupported source shapes, missing provenance, invalid tenancy, blocked credentials, unavailable vector stores, and entitlement-gated private capability.
- Compatibility across Scout, Enterprise/Fortress, and Elite. New paid extension fields should be optional or versioned so public Scout connectors do not break.
- A local backfill/replay mode that can bypass normal billing limits, duplicate-suppression side effects, selector recompute noise, and user-facing audit confusion while still writing local migration audit records.
- Explicit provenance and governance fields so Enterprise/Fortress can build relationship sets and attribution paths without inferring lineage from opaque payload JSON.
- No storage-specific promises in public connector contracts. LanceDB table names, vector dimensions, pgvector extension details, and private relationship-engine internals stay behind local adapters.

## Storage Abstraction Requirements

The storage abstraction must allow the same connector and local API contracts to run against different local storage targets without connector rewrites.

Minimum requirements:

- A canonical local data-item boundary for source records, exact data items, context facts, provenance references, citation IDs, outcome events, and relationship-analysis inputs.
- A vector-store boundary that can target Enterprise/Fortress LanceDB/vector DB, pgvector companion storage, Scout-compatible local fallback storage, or a local dual-write bridge during migration.
- Stable vector anchors: `id`, `entity_type`, `postgres_pk`, `layer`, `embedding`, `metadata_json`, `created_at`, and `updated_at`, with deterministic mapping from Scout tenant/workspace/source/fact IDs to Enterprise/Fortress anchors.
- Tenant isolation through an explicit `layer` or tenant-scoped equivalent. Cross-tenant reads, writes, search, or relationship traversal must fail closed.
- Dense embedding handling that never fakes vectors. If the local embedding model, tokenizer, native LanceDB dependency, or pgvector target is unavailable, the write path must skip, dead-letter, or fail locally according to policy.
- Resumable backfill with local checkpoints, local dead-letter records, local retry metadata, and clear operator-visible status.
- Local relationship-set and attribution-path storage owned by Enterprise/Fortress or a private extension table set, with citation and provenance references back to Scout data-plane records.
- Provider selection through local configuration. Switching from Scout-compatible storage to Enterprise/Fortress LanceDB/vector DB should be an operator-controlled local config change plus migration, not a connector package change.
- Cloud exclusion. No storage provider may use Cloud as a staging, backup, indexing, or migration target for customer data or derived intelligence.

## Scout To Elite/Fortress Upgrade Sequence

1. Paid signup or upgrade starts in Cloud. Cloud resolves the account, subscription, canonical tier, active licence, entitlements, allowed artefacts, update channel, and any safe installer metadata.
2. Cloud issues or refreshes a signed licence and exposes entitlement-filtered download/update metadata for the private Enterprise/Fortress package. The payload contains no customer data and no migration content.
3. The customer runs local onboarding against the existing Scout Docker deployment. The local preflight checks Scout version, local database connectivity, backup readiness, disk space, configured source systems, connector package versions, local model/vector prerequisites, and whether pgvector or LanceDB is enabled.
4. The installer downloads and installs Enterprise/Fortress into the customer-owned environment. Fortress runs on the same local network and storage boundary as Scout. Cloud may know the safe deployment version and health status, but not the local data inventory.
5. The local upgrader takes a Scout backup and records an upgrade checkpoint. Any required public Scout migrations, private extension migrations, LanceDB directory setup, pgvector extension checks, or local config additions happen after the checkpoint.
6. The local adapter maps Scout source events, user signals, selector outputs, context facts, provenance, audit records, and any canonical exact data items into the Enterprise/Fortress local data-item contract. Mapping must be deterministic for `postgres_pk`, `entity_type`, `layer`, citation IDs, provenance IDs, and outcome IDs.
7. Backfill runs locally. It writes vectors to LanceDB or the configured local vector target, builds relationship-set and attribution-path inputs locally, records local checkpoints and dead letters, and avoids normal source-event billing, user-facing recompute noise, and misleading operational audit telemetry.
8. Verification runs locally. It checks tenant isolation, idempotency, vector anchor consistency, relationship-set citation coverage, governed JSON handoff shape, local search behaviour, rollback readiness, and Cloud payload filtering.
9. Routing switches locally. Connectors continue to write through Scout's local API, while storage/provider configuration points vector and canonical relationship-analysis work at Enterprise/Fortress. Scout remains the local ingestion, provenance, audit, and public-safe control surface.
10. Elite onboarding may then enable operator-assisted review, outcome-loop configuration, private/local model packs, or customer-specific hardening. These remain local unless the customer explicitly exports a redacted support artefact.

## Cloud Entitlement Role

Cloud is necessary for the commercial upgrade path but not for customer data movement.

Allowed Cloud responsibilities:

- Account, subscription, canonical tier, licence, entitlement, and grace-period checks.
- Private artefact catalogue metadata, download authorization, signed download URLs, release/update notes, and update channel metadata.
- Optional data-plane registration and heartbeat using deployment version, health status, and explicitly allowlisted aggregate usage counters.
- Fortress instance metadata such as safe status, update channel, config version, desired safe config JSON, and heartbeat timestamps.
- Paid onboarding orchestration that tells the customer which local installer, package, channel, and entitlement state applies.

Disallowed Cloud responsibilities:

- Receiving, storing, staging, indexing, analysing, backing up, or transforming raw customer operational data.
- Receiving Scout source events, exact data items, context facts, selector outputs, connector payloads, credentials, vectors, embeddings, relationship sets, attribution paths, evidence packs, prompts, generated customer content, recommendations, citation IDs, or weighted signals.
- Acting as a migration bridge between Scout and Enterprise/Fortress.
- Using entitlement success as proof that local storage, LanceDB, pgvector, embeddings, or relationship analysis are ready.

Cloud entitlement success means "the customer may download and run the paid local capability." It does not mean "Cloud participates in the data-plane upgrade."

## Rollback Plan

Rollback is local-first and must preserve Scout as the recoverable customer-owned data plane.

- Before install, record the current Scout version, config, local database state, Docker compose state, connector package versions, and backup location.
- Before migration, take a Scout database backup and snapshot any local vector/private extension volumes that already exist.
- If entitlement, download, or install fails before local migrations, leave Scout unchanged and retry after entitlement or artefact resolution.
- If migration fails before routing switches, disable the Enterprise/Fortress provider in local config, stop the private runtime containers, keep Scout routing unchanged, and retain local logs/checkpoints for operator review.
- If migration fails after routing switches, switch the local provider config back to Scout-compatible storage, stop Enterprise/Fortress runtime services, and keep private LanceDB/pgvector/relationship stores isolated for rebuild or inspection.
- If public Scout migrations were applied and need reversal, restore from the Scout backup rather than attempting ad hoc table surgery.
- If only vector or relationship indexes are corrupt, rebuild them locally from Scout source records and provenance rather than restoring Cloud state.
- If a Cloud licence is revoked or downgraded, Cloud disables future private downloads/updates and the local runtime follows the signed licence grace policy. Licence rollback must not delete local customer data.
- Deleting private Fortress data, LanceDB directories, pgvector companion tables, or support bundles must require an explicit local operator action.

## Data-Boundary Guarantees

- Scout remains a local customer-owned Docker data plane.
- Enterprise/Fortress and Elite paid capabilities run in the customer-owned environment unless a separately approved deployment model says otherwise.
- Connectors write to local Scout APIs or local adapter boundaries where practical. Connectors never send customer data to Cloud as part of the upgrade path.
- Storage switching happens behind local APIs and storage abstractions. Connector packages should not change when the vector target changes.
- Cloud receives only commercial/control-plane metadata and explicitly allowlisted aggregate usage. It never receives raw data or derived customer intelligence by default.
- Connector credentials, source payloads, exact data items, context facts, selector outputs, provenance details, relationship sets, attribution paths, outcome events, prompts, generated content, vectors, embeddings, and citation-level metadata remain local.
- Local migration logs, dead letters, support bundles, and failed payloads are customer data. They remain local unless the customer explicitly exports a reviewed and redacted artefact.
- Cross-tenant leakage in mapping, vector search, relationship traversal, or governed JSON handoff is a security defect. The architecture must fail closed on ambiguous tenant/layer mapping.

## Open Implementation Tasks

1. Define the canonical local data-item, outcome-event, relationship-set, attribution-path, citation, and provenance persistence contract shared by Scout and Enterprise/Fortress.
2. Design versioned local API shapes for canonical writes and migration backfill, including idempotency, local-only auth, typed errors, tenant mapping, and quiet migration audit mode.
3. Implement the storage abstraction provider model for Scout-compatible storage, Enterprise/Fortress LanceDB/vector DB, pgvector companion storage, and local dual-write migration.
4. Build the deterministic Scout-to-Fortress mapping for `postgres_pk`, `entity_type`, `layer`, citation IDs, provenance IDs, outcome IDs, and relationship-set IDs.
5. Add a resumable local backfill runner with checkpoints, dead letters, retry policy, local operator status, and rollback hooks.
6. Realign or retire the stale `packages/typescript/scout-n8n-node` route so public connector packages use the current local ingestion API.
7. Add local preflight and post-upgrade verification for Docker state, database migrations, backup readiness, LanceDB/native dependencies, pgvector extension availability, embedding assets, tenant isolation, and governed JSON handoff.
8. Add Cloud entitlement-to-local-onboarding wiring that passes only licence, artefact, version, channel, and safe config metadata.
9. Add focused tests for API compatibility, connector routing, storage provider switching, tenant isolation, backfill idempotency, rollback paths, and Cloud payload filtering.
10. Run xhigh review gates before implementation is marked complete because the work touches public API, connector contracts, data models, storage boundaries, and security-sensitive data boundaries.
