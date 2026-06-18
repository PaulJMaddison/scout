# WP2 Handoff

## Summary For The Next Prompt

This step created `05-migration-export-import.md` and implemented the safe Scout-side part of the migration tooling: local relational export and dry-run validation behind `ILocalDataPlaneStorageAdapter`. Scout now exports source events, user signals, selector executions, context facts, provenance metadata, and audit events as `kynticai.scout.storage-portable-export.v1` portable records with tenant/layer metadata and deterministic Enterprise/Fortress anchor fields.

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

## Verification

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
- Cloud remains licence, entitlement, artefact, update, registration, heartbeat, support, and safe aggregate metadata only. It is not a migration, import, vector, dead-letter, or backup layer.

## Data-Boundary Commitments

- Raw customer operational data, source payloads, credentials, exact data items, context facts, selector outputs, provenance details, relationship sets, attribution paths, outcome events, prompts, generated content, vectors, embeddings, migration logs, checkpoints, failed payloads, and customer-specific derived intelligence stay local.
- `StorageAdapterOptions.AllowCloudDataMovement` defaults to `false` and must remain false for customer data and derived intelligence.
- Cross-tenant leakage in export, import, layer mapping, vector search, relationship traversal, or governed JSON handoff is a security defect and must fail closed.
- Support bundles or failed migration payloads are customer data and remain local unless explicitly reviewed, redacted, and exported by the customer.

## Open Implementation Tasks

- Implement the operator CLI wrapper that repeatedly calls `ExportAsync()`, writes local export batches/reports, and can hand off to the private local importer once available.
- Implement the private Enterprise/Fortress importer for `kynticai.scout.storage-portable-export.v1`.
- Implement local embeddings/vector writes and LanceDB/native-store proof in Enterprise/Fortress, not Scout/open-core.
- Define and persist canonical relationship-set, attribution-path, outcome-event, and exact data-item records where required.
- Add local checkpoint, retry, and dead-letter persistence for end-to-end import/backfill.
- Add private import validation for citation/provenance coverage and governed JSON handoff readiness.
- Run xhigh review gates before this storage/data-model/security-sensitive work is marked complete.

## Recommended Next Action

Implement the local operator migration CLI wrapper in Scout or a reviewed private tooling repo. It should call `ILocalDataPlaneStorageAdapter.ExportAsync()` in dry-run and real modes, persist local batch JSON and validation reports, support checkpoint resume, and stop before import unless the private Enterprise/Fortress `kynticai.scout.storage-portable-export.v1` importer is present and has passed local dry-run validation. Do not add LanceDB, pgvector, native-store proof, or private importer code to Scout/open-core.
