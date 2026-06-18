# WP2 Handoff

## Summary For The Next Prompt

This read-only discovery audit mapped the current Scout to Elite/Fortress upgrade path across Scout/open-core, Enterprise/Fortress, Cloud, and the naming source of truth. Scout currently persists source events, user signals, selector executions, context facts, provenance, audit metadata, admin/SaaS metadata, and demo CustomerOps records. Enterprise/Fortress expects local data items, relationship sets, attribution paths, outcome events, governed JSON handoff, and LanceDB/pgvector-capable vector storage. Cloud already provides licence, entitlement, download/update, data-plane registration, heartbeat, and Fortress instance metadata checks, but must not receive raw data, vectors, or relationship intelligence.

The next prompt should design the migration contract and adapter plan before any implementation.

## Key Findings

- Scout storage is PostgreSQL-capable EF Core with SQLite demo fallback. It does not currently contain native vector tables, pgvector columns, LanceDB storage, or a persisted canonical relationship-set model.
- The public event ingestion route is `POST /api/v1/events/source-system`. It writes `SourceSystemEvent`, `UserSignal`, maybe `SelectorExecution`, `RecomputeJob`, `ContextFact`, `ProvenanceMetadata`, and audit records through local Scout services.
- SDK event ingestion routes through the local API. Selector connector plugins are in-process fetchers and do not write source records through the REST API.
- One older n8n package appears to use a stale `/api/tenants/{tenantSlug}/events/source` route.
- Scout relationship intelligence is currently public fallback/proof-mode. It declares Enterprise/Fortress as canonical owner for relationship weighting/traversal and produces handoff/evidence artefacts rather than persisted canonical Enterprise outputs.
- Enterprise/Fortress expects vector-ready `UclEntity` records with stable `postgres_pk`, `entity_type`, `layer`, metadata, and 384-dimension embeddings.
- LanceDB is the primary local vector-store expectation. pgvector is present as a companion/fallback migration path but live write/search wiring is partial in the audited seams.
- Enterprise/Fortress relationship analysis expects tenant-scoped data items, relationship edges, attribution paths, relationship sets, outcome events, and citation/provenance IDs. Cloud aggregate-only payloads are explicitly insufficient.
- Cloud can gate upgrade access through signed licences, account entitlements, downloads/update checks, data-plane registration, heartbeat, and Fortress instance metadata.
- Cloud must not be used as the migration staging area for Scout source records, context facts, vectors, evidence packs, relationship sets, attribution paths, or derived intelligence.

## Decisions Already Made

- This step was read-only discovery only.
- No code, schema, API, package, runtime, deployment, or test changes were made.
- The canonical boundaries from `C:\Kyntic\docs\source-of-truth-naming-map.md` remain the source of truth.
- KynticAI Scout remains the public/open-core customer-owned data plane.
- Enterprise/Fortress remains the private paid local runtime/vector/relationship-analysis owner.
- Elite remains the operator-assisted strategic product on top of Fortress.
- Cloud remains optional commercial/control-plane metadata and must stay aggregate/licence/support/update only by default.
- The next useful work is a migration contract and adapter design, not direct implementation.

## Open Questions

- What is the canonical local persisted data-item schema that bridges Scout events/facts/demo records into Enterprise/Fortress inputs?
- Should connector writes be routed through the Scout local API, a new local ingestion API, or a private Enterprise/Fortress adapter boundary?
- Which Scout identifiers should become Enterprise/Fortress `postgres_pk`, `entity_type`, `layer`, citation IDs, and provenance IDs during backfill?
- Should relationship sets, attribution paths, and outcome events live in new Scout public tables, private Enterprise/Fortress tables, or private extension tables attached to Scout?
- How should migration replay avoid normal billing/source-event limits, duplicate suppression side effects, recompute noise, and misleading audit telemetry?
- What is the compatibility plan for the older n8n route package?
- What is the first live proof target: LanceDB-only backfill, pgvector companion table, or dual-write with both?
- How should Cloud entitlement success be represented locally without sending migration state or raw customer data back to Cloud?
- What rollback contract separates public Scout data, private Fortress data, LanceDB/vector storage, and Cloud metadata?

## Recommended Next Action

Run a design prompt that creates `02-migration-contract-and-adapter-plan.md` for this work package. It should define canonical local data items, relationship sets, attribution paths, outcome events, vector ID/layer mapping, connector write routing, backfill/replay rules, entitlement gates, rollback boundaries, and proof criteria. Do not start code changes until that contract is reviewed.
