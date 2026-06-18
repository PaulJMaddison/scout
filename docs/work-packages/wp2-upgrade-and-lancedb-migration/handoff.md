# WP2 Handoff

## Final Evidence Pack

WP2 now has the requested final persisted evidence pack:

- `09-final-review.md`
- `investor-summary.md`
- `customer-safe-summary.md`
- `next-work-packages.md`

The final review keeps the claim boundary explicit: WP2 is ready to commit as evidence and local upgrade-contract groundwork, but it is not a claim of production SaaS readiness, live customer upgrade readiness, vendor-certified connector coverage, or completed LanceDB/pgvector migration.

Recommended next package: WP3, Scout Operator Migration CLI And Deterministic Local Upgrade Harness.

## Summary For The Next Prompt

This step now includes `08-end-to-end-upgrade-simulation.md`, a local/dev simulation report for the Scout to Enterprise/Fortress upgrade path. A fresh temporary Scout SQLite bootstrap succeeded, focused Scout API/storage tests passed, Enterprise/Fortress import-contract tests passed, and the Cloud metadata-only onboarding guard passed. The live temp Scout API smoke remained partial because demo startup/recompute processing ran long and the HTTP event post did not complete before timeout.

This step now includes `07-cloud-upgrade-entitlement-flow.md`, the Scout-side summary of the Cloud upgrade entitlement/onboarding flow for moving a Scout user to Fortress or Elite. Cloud controls account, subscription, licence, entitlement, download/update metadata, support/onboarding state, deployment registration metadata, aggregate allowed usage metadata, audit, and reconciliation only; it does not receive Scout exports, LanceDB files, vectors, relationship sets, attribution paths, prompts, generated customer content, citation IDs, weighted signals, or derived customer intelligence.

This work package also now includes `06-enterprise-lancedb-import-contract.md`, the Enterprise/Fortress side of the Scout upgrade import contract for LanceDB/vector DB. The private Enterprise repo has a typed `ucl-vector` contract that validates normalised local import batches derived from Scout export plus local Enterprise embeddings, rejects Cloud/control-plane-only or raw-payload shapes, and maps valid records into the existing Enterprise vector `WriteRequest` path.

The prior implementation step created `05-migration-export-import.md` and implemented the safe Scout-side part of the migration tooling: local relational export and dry-run validation behind `ILocalDataPlaneStorageAdapter`. Scout now exports source events, user signals, selector executions, context facts, provenance metadata, and audit events as `kynticai.scout.storage-portable-export.v1` portable records with tenant/layer metadata and deterministic Enterprise/Fortress anchor fields.

No Enterprise/Fortress code was imported into Scout. No LanceDB dependency, pgvector schema, vector table, relationship-set persistence, private importer, Docker change, package publication, Cloud data movement, or customer-data upload path was added.

## Latest Implementation

- Added `AuditEvents` to `StorageAdapterDataScope`.
- Added migration validation contracts: `StorageMigrationValidationSeverity`, `StorageMigrationValidationFinding`, and `StorageMigrationValidationReport`.
- Added `DryRun` to `StorageExportRequest` and `StorageImportRequest`.
- Added `ValidationReport` to `StorageExportBatch`.
- Updated `ScoutPostgresStorageAdapter` to report `SupportsExport=true` for current Scout relational scopes.
- Implemented `ScoutPostgresStorageAdapter.ExportAsync()` for source events, user signals, selector executions, context facts, provenance metadata, and audit events.
- Implemented tenant ID/slug validation, unsupported-scope validation, checkpoint validation, JSON shape validation, counts by record kind, and dry-run validation without returned records.
- Kept `ImportAsync()` explicitly unsupported in Scout/open-core until the private Enterprise/Fortress importer contract is ready.
- Kept `WriteVectorAsync()` explicitly skipped in Scout/open-core unless a private/local adapter replaces it.
- Added unit coverage in `tests/KynticAI.Scout.UnitTests/StorageAdapterBoundaryTests.cs`.
- Created `05-migration-export-import.md` and updated WP2 README/status/handoff.
- Added Enterprise `engine/crates/ucl-vector/src/scout_import.rs`.
- Added Enterprise `engine/crates/ucl-vector/tests/scout_import_contract_tests.rs`.
- Updated Enterprise `engine/crates/ucl-vector/src/lib.rs`, `Cargo.toml`, and `README.md`.
- Added Enterprise `docs/scout-lancedb-import-contract.md`.
- Updated Enterprise root `AGENTS.md` sprint state.
- Created `06-enterprise-lancedb-import-contract.md` and updated WP2 README/status/handoff for the Enterprise import contract.
- Created `07-cloud-upgrade-entitlement-flow.md` after the Cloud onboarding contract update.
- Updated Cloud docs and `CommercialReadinessDeliverablesTests` to guard the metadata-only Scout to Fortress/Elite upgrade boundary.
- Created `08-end-to-end-upgrade-simulation.md`.
- Ran a fresh temporary Scout SQLite bootstrap under `C:\Users\pm\AppData\Local\Temp\kyntic-wp2-upgrade-simulation-20260619-000856`.
- Attempted a live localhost Scout API ingest smoke; recorded the timeout/recompute blocker and preserved deterministic integration-test evidence for the source-system event route.
- Updated WP2 README/status/handoff for the simulation step.

## Verification

- Fresh Scout SQLite bootstrap: passed; temp DB contained 2 tenants, 2 workspaces, 80 user profiles, 6 data sources, 28 selector definitions, 366 context snapshots, 4,758 context facts, 9,882 provenance rows, and 727 audit events.
- Live temp Scout API ingest smoke: partial/failed; startup processed long-running demo recompute work and the event post did not complete before timeout. The temp DB had `source_system_events=0` after the attempt.
- `dotnet restore .\KynticAI.Scout.slnx`: passed; all projects up to date.
- `dotnet build .\KynticAI.Scout.slnx`: passed; 0 warnings; 0 errors.
- `dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --filter FullyQualifiedName~StorageAdapterBoundaryTests`: passed; 7 tests.
- `dotnet test .\tests\KynticAI.Scout.IntegrationTests\KynticAI.Scout.IntegrationTests.csproj --filter FullyQualifiedName~V1RestApiIntegrationTests`: passed; 5 tests.
- `dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj`: passed; 12 tests.
- Enterprise `cargo test -p ucl-vector --test scout_import_contract_tests`: passed; 8 tests.
- Cloud `dotnet test .\tests\Ucl.Cloud.Tests\Ucl.Cloud.Tests.csproj --filter FullyQualifiedName~Scout_upgrade_onboarding_contract_keeps_cloud_metadata_only`: passed; 1 test.
- Enterprise `cargo fmt -p ucl-vector`: passed.
- Enterprise `cargo test -p ucl-vector`: passed; includes the new contract tests.
- Enterprise `cargo fetch --locked`: passed.
- Enterprise `cargo build --workspace`: passed with existing `ucl-engine` dead-code warnings.
- Enterprise `cargo test --workspace`: passed with existing `ucl-pipeline` test warnings and ignored explicit model/native-style tests.
- `dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-restore`: passed; 86 tests.
- `dotnet restore .\KynticAI.Scout.slnx`: passed; all projects up to date.
- `dotnet build .\KynticAI.Scout.slnx`: passed; 0 warnings; 0 errors.
- `dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj`: passed; 12 tests.
- `git diff --check`: passed; printed only LF-to-CRLF working-copy warnings.
- `Get-Content -Raw docs\work-packages\wp2-upgrade-and-lancedb-migration\status.json | ConvertFrom-Json | Out-Null`: passed.

Docker/PostgreSQL, browser, LanceDB/native-store, pgvector, model-runtime, live connector, and Enterprise/Fortress proof should remain skipped unless the relevant opt-in environment variables are set and Paul explicitly asks.

## Key Decisions

- Scout remains the public/open-core local data plane and exports only the relational records it actually stores today.
- `scout-postgres` is the implemented export provider. Local SQLite development uses the same EF model behind the adapter.
- The export contract version is `kynticai.scout.storage-portable-export.v1`.
- Exported Enterprise/Fortress anchors use `fortressAnchor.entity_type`, `fortressAnchor.postgres_pk`, and `fortressAnchor.layer`.
- The tenant slug is used as the initial local `layer`; tenant ID/slug mismatches fail closed.
- Dry run validates and reports without returning records or writing data.
- Scout does not claim vector persistence or private import capability.
- Enterprise/Fortress must provide the private/local importer for LanceDB/vector DB, pgvector fallback, relationship sets, attribution paths, outcome events, retry/dead-letter stores, and governed JSON handoff.
- Enterprise/Fortress now owns the `2026-06-18.scout-lancedb-import.v1` validation/mapping contract in `ucl-vector`.
- Scout does not need to export embeddings; Enterprise/Fortress generates embeddings locally before LanceDB import rows are valid.
- LanceDB import rows require dense finite embeddings, tenant/layer consistency, citation/provenance coverage, and idempotency keys.
- Cloud remains licence, entitlement, artefact, update, registration, heartbeat, support, and safe aggregate metadata only. It is not a migration, import, vector, dead-letter, or backup layer.
- Cloud upgrade/onboarding state is currently derived from existing commercial/control-plane metadata until a dedicated persisted onboarding entity or read model is implemented.
- Cloud entitlement success means the customer may access paid local capability; local Scout/Fortress preflight, backup, storage migration, LanceDB/pgvector proof, vector backfill, relationship indexing, and governed JSON verification remain customer-environment work.
- End-to-end upgrade proof remains partial until the Scout operator export CLI, private Enterprise/Fortress importer, and quick deterministic local API smoke exist.

## Data-Boundary Commitments

- Raw customer operational data, source payloads, credentials, exact data items, context facts, selector outputs, provenance details, relationship sets, attribution paths, outcome events, prompts, generated content, vectors, embeddings, migration logs, checkpoints, failed payloads, and customer-specific derived intelligence stay local.
- `StorageAdapterOptions.AllowCloudDataMovement` defaults to `false` and must remain false for customer data and derived intelligence.
- Cross-tenant leakage in export, import, layer mapping, vector search, relationship traversal, or governed JSON handoff is a security defect and must fail closed.
- Support bundles or failed migration payloads are customer data and remain local unless explicitly reviewed, redacted, and exported by the customer.

## Open Implementation Tasks

- Implement the operator CLI wrapper that repeatedly calls `ExportAsync()`, writes local export batches/reports, and can hand off to the private local importer once available.
- Add a deterministic local upgrade simulation harness or quieter demo startup path so fresh Scout install plus API event ingestion can complete without long-running seeded recompute work.
- Implement the private Enterprise/Fortress importer for `kynticai.scout.storage-portable-export.v1`, local embedding generation, and `2026-06-18.scout-lancedb-import.v1` batch creation.
- Implement local embeddings/vector writes and LanceDB/native-store proof in Enterprise/Fortress, not Scout/open-core.
- Define and persist canonical relationship-set, attribution-path, outcome-event, and exact data-item records where required.
- Add local checkpoint, retry, and dead-letter persistence for end-to-end import/backfill.
- Add private import validation for citation/provenance coverage and governed JSON handoff readiness.
- Run xhigh review gates before this storage/data-model/security-sensitive work is marked complete.
- Implement a Cloud persisted onboarding read model or workflow endpoint if the operator portal needs first-class Scout to Fortress/Elite upgrade state instead of deriving it from account/subscription/licence/download/data-plane/Fortress/support/reconciliation metadata.

## Recommended Next Action

Implement WP3: the Scout operator migration CLI wrapper and deterministic local upgrade simulation harness. The CLI should run `ILocalDataPlaneStorageAdapter.ExportAsync()` dry runs and real exports with checkpoint resume, write local validation reports and batch files, and expose enough deterministic output for the next end-to-end upgrade simulation. Keep Cloud out of the data plane and keep Enterprise/Fortress import behind the private local contract.
