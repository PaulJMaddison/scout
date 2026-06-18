# WP2 Handoff

## Summary For The Next Prompt

This connector-routing step created `03-local-api-connector-routing.md` and made a scoped implementation change in the older `packages/typescript/scout-n8n-node` package. The stale `/api/tenants/{tenantSlug}/events/source` POST target now routes to the current local Scout source-system event endpoint:

```text
POST /api/v1/events/source-system?tenantSlug=<tenant>
```

The previous architecture decision still stands: Scout remains the local customer-owned Docker data plane, connector writes should use local Scout APIs or local adapter boundaries where practical, vector/storage choices stay hidden behind local contracts, and Cloud remains limited to licence, entitlement, private artefact, download, update, registration, heartbeat, support, and safe aggregate metadata.

No server API, schema, Docker, SDK contract, Cloud, Enterprise/Fortress, vector, LanceDB, pgvector, or selector-storage changes were made.

## Latest Implementation

- Added `buildSourceSystemEventUrl()` to `packages/typescript/scout-n8n-node/src/nodes/sourceEventMapper.ts`.
- Updated `packages/typescript/scout-n8n-node/src/nodes/KynticAiScout.node.ts` to post to `/api/v1/events/source-system?tenantSlug=<tenant>`.
- Exported the helper from `packages/typescript/scout-n8n-node/src/index.ts`.
- Added route coverage in `packages/typescript/scout-n8n-node/tests/url.test.ts`.
- Updated `packages/typescript/scout-n8n-node/README.md`.
- Created `03-local-api-connector-routing.md` and updated WP2 README/status/handoff.

## Verification

- `npm test` in `packages/typescript/scout-n8n-node`: passed after `npm install`, 5 test files, 115 tests.
- `npm run build` in `packages/typescript/scout-n8n-node`: passed after `npm install`.
- `dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj`: passed, 12 tests.
- Initial `npm test` and `npm run build` failed before `npm install` because `vitest` and `tsc` were not present locally.
- `npm install` reported 2 critical npm audit findings in the existing dependency tree.
- Docker, browser, native-store, LanceDB, pgvector, live connector, and external dependency proof paths were not run because the local laptop policy requires opt-in environment variables and they were not set.

## Key Decisions

- KynticAI Scout remains the public/open-core local data plane for ingestion, APIs, connector abstractions, provenance, audit, governance, and public fallback intelligence.
- Enterprise/Fortress installs locally as the paid private extension path for the Enterprise/Fortress Rust engine/vector DB, relationship sets, attribution paths, outcome matching, comparable-example analysis, and governed JSON handoff.
- Elite sits above Fortress for operator-assisted strategic work, while raw and derived customer intelligence still stays in the customer-owned environment.
- Connectors should write through the local Scout API or a local adapter boundary where practical. Connector packages should not need rewrites when storage switches from Scout-compatible storage to Enterprise/Fortress LanceDB/vector DB.
- The local API contract is the upgrade seam. It needs versioned ingestion/backfill shapes, idempotency, tenant/workspace/source/provenance identifiers, typed errors, and a quiet local migration mode.
- The storage abstraction must support Scout-compatible storage, Enterprise/Fortress LanceDB/vector DB, pgvector companion storage, and local dual-write migration without using Cloud as a staging target.
- Cloud entitlement success means the customer may download and run paid local capability. It is not proof that local LanceDB, pgvector, embeddings, data mapping, or relationship analysis are ready.
- Rollback is local-first: Scout backups and local provider config recover the data plane; Cloud downgrade or licence revocation must not delete customer data.
- The stale `packages/typescript/scout-n8n-node` source-event route has now been realigned to the current local API route.

## Data-Boundary Commitments

- Cloud must not receive raw operational data, connector payloads, credentials, exact data items, context facts, selector outputs, provenance details, vectors, embeddings, relationship sets, attribution paths, outcome events, prompts, generated customer content, recommendations, citation IDs, weighted signals, evidence packs, or customer-specific derived intelligence.
- Cloud may receive only commercial/control-plane metadata and explicitly allowlisted aggregate usage counters.
- Local migration logs, checkpoints, dead letters, failed payloads, and support bundles are customer data and remain local unless explicitly exported after review/redaction.
- Cross-tenant leakage in mapping, vector search, relationship traversal, or governed JSON handoff is a security defect and must fail closed.

## Open Implementation Tasks

- Define canonical local data-item, outcome-event, relationship-set, attribution-path, citation, and provenance persistence contracts.
- Design versioned local API shapes for canonical writes and migration backfill.
- Implement provider selection for Scout-compatible storage, Enterprise/Fortress LanceDB/vector DB, pgvector companion storage, and local dual-write migration.
- Build deterministic Scout-to-Fortress ID and layer mapping.
- Add resumable local backfill, checkpoints, local dead letters, rollback hooks, and operator-visible status.
- Add local preflight and post-upgrade verification for Docker state, database migrations, backups, LanceDB/native dependencies, pgvector, embedding assets, tenant isolation, and governed JSON handoff.
- Wire Cloud entitlement to local onboarding using only licence, artefact, version, channel, and safe config metadata.
- Add focused tests and xhigh review gates before implementation is marked complete.

## Recommended Next Action

Run a design prompt that creates `04-migration-contract-and-adapter-plan.md` for this work package. It should turn `02-upgrade-architecture.md` and `03-local-api-connector-routing.md` into concrete local API contracts, storage provider interfaces, data-item and relationship-set schemas, deterministic ID mapping rules, backfill/replay semantics, entitlement gates, rollback proof criteria, and test coverage. Do not start vector, LanceDB, pgvector, or relationship-set persistence changes until that contract is reviewed.
