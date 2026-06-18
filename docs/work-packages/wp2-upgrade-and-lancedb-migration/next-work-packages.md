# Next Work Packages

Date: 2026-06-19

## Recommended Work Package 3

Recommended WP3: Scout Operator Migration CLI And Deterministic Local Upgrade Harness.

Objective:

- Turn the WP2 adapter/export contract into an operator-runnable local tool that can produce dry-run reports, export batches, checkpoints, and deterministic simulation evidence without moving customer data to Cloud.

Primary deliverables:

- A Scout operator CLI wrapper around `ILocalDataPlaneStorageAdapter.ExportAsync()`.
- Local output folder structure for validation reports, batch files, checkpoints, and summaries.
- Resume and retry handling for export checkpoints.
- Dry-run and real-export modes with typed exit codes.
- Tenant/layer and unsupported-scope error reporting that is easy for operators to act on.
- A deterministic local upgrade simulation harness that can prove fresh Scout bootstrap, API ingestion, dry-run export, real export, and no Cloud data-plane calls without long-running seeded recompute timeouts.
- Updated WP3 evidence docs and tests.

Acceptance criteria:

- CLI dry run returns a validation report and no payload records.
- CLI real export writes local batch files for implemented Scout scopes.
- Resume from checkpoint is covered by tests.
- Invalid tenant/layer, unsupported scope, invalid checkpoint, and bad JSON cases are covered.
- Simulation harness proves source-system event ingestion through the v1 local API and then exports the resulting local record.
- `usesCloudDataPlane=false` is visible in exported diagnostics.
- No Docker/PostgreSQL, browser, LanceDB/native-store, pgvector, model-runtime, hosted endpoint, or vendor proof runs unless explicitly opted in.

## Remaining Technical Gaps

- Production Scout operator export CLI is missing.
- Private Enterprise/Fortress importer CLI/API is missing.
- Local embedding generation is not wired into an import runner.
- Live LanceDB/native-store proof is not run.
- pgvector fallback proof is not run.
- Relationship-set, attribution-path, outcome-event, exact-data-item, checkpoint, retry, dead-letter, and rollback stores still need end-to-end importer wiring.
- Governed JSON handoff verification is not yet part of the upgrade simulation.
- Scout does not persist canonical relationship sets, attribution paths, outcome events, vectors, or exact data items as first-class public tables.
- Deterministic fresh Scout install plus API ingest smoke needs a quieter harness than the current demo startup path.
- xhigh review gates remain required for public API, connector-contract, data-model, storage-boundary, Rust engine, Cloud entitlement, and security-sensitive changes.

## Remaining Ops And Commercial Gaps

- Cloud has no dedicated persisted upgrade onboarding entity or state-machine endpoint.
- Cloud has no atomic Scout/Fortress/Elite tier-move endpoint.
- Dedicated licence suspend/reactivate endpoints remain target additions.
- Production signed binary delivery still needs private object-storage proof and signed URL fetch proof.
- Live billing, production secrets, key custody, backup/restore evidence, portal auth hardening, legal review, and support-process review remain outside WP2.
- Customer-specific connector validation and vendor certification are not claimed.
- No live customer pilot, acceptance, revenue, or production rollout proof is created by WP2.

## Suggested Prompt List

1. Implement WP3: build the Scout operator migration CLI wrapper around `ILocalDataPlaneStorageAdapter.ExportAsync()` with dry-run, export, checkpoint resume, local reports, typed exit codes, and tests. Keep Cloud out of the data plane.
2. Add a deterministic local upgrade simulation harness that bootstraps Scout, posts a source-system event through `POST /api/v1/events/source-system`, exports the resulting local record, and verifies no Cloud data-plane calls.
3. Implement the private Enterprise/Fortress importer for `kynticai.scout.storage-portable-export.v1`, generating local embeddings and `2026-06-18.scout-lancedb-import.v1` batches without calling Cloud.
4. Add Enterprise/Fortress local checkpoint, retry, and dead-letter persistence for Scout import backfill, including tenant/layer and citation/provenance validation.
5. Prove live LanceDB/native-store and pgvector fallback paths behind explicit opt-in environment variables, and record the proof without making it a routine local test.
6. Implement Cloud metadata-only upgrade onboarding read model or workflow endpoint derived from account, subscription, licence, artefact, data-plane, Fortress instance, support, and reconciliation state.
7. Run xhigh review gates for the Scout storage/export boundary, Enterprise/Fortress Rust import/vector boundary, Cloud entitlement/onboarding boundary, and data-boundary claims before pilot, release, or investor-visible proof.
