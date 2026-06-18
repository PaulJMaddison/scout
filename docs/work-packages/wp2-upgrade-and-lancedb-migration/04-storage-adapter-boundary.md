# 04 Storage Adapter Boundary

Date: 2026-06-18

Mode: scoped public contract implementation and documentation. This step added a storage adapter boundary in Scout/open-core without importing Enterprise/Fortress code, adding LanceDB, adding pgvector schema, changing existing persistence flows, or moving customer data to Cloud.

Evidence base:

- `C:\Kyntic\docs\source-of-truth-naming-map.md`
- `C:\Kyntic\UCL-local-aidocs\LOCAL_LAPTOP_TEST_COMMANDS.md`
- `docs/work-packages/wp2-upgrade-and-lancedb-migration/01-discovery-audit.md`
- `docs/work-packages/wp2-upgrade-and-lancedb-migration/02-upgrade-architecture.md`
- `docs/work-packages/wp2-upgrade-and-lancedb-migration/03-local-api-connector-routing.md`
- Scout/open-core repo: `C:\Kyntic\UCL`
- Enterprise/Fortress repo for contract comparison only: `C:\Kyntic\universalcontextlayer-enterprise`

## Current Scout Storage Interfaces

Scout storage remains EF Core over local relational storage:

- `IScoutDbContext` exposes tenants, users, data sources, selectors, selector executions, context snapshots, context facts, provenance metadata, source-system events, user signals, audit records, SaaS/admin metadata, connector catalogue/install records, and billing/onboarding/governance metadata.
- `ICustomerOpsDbContext` exposes the local demo/customer-ops records used by the B2B sales/support demo path.
- `DatabaseProviderConfigurator` selects SQLite for local demo-style connection strings and PostgreSQL otherwise. Production configuration remains PostgreSQL-oriented.
- `IConnectorPlugin` remains the selector-time fetch boundary. It does not write source records, vectors, LanceDB rows, or relationship sets directly.
- `IContextSourceConnector` and the existing enterprise-extension seams remain public extension points for paid/private implementations.

Scout still does not persist canonical vectors, LanceDB rows, pgvector rows, relationship-set indexes, attribution-path stores, or outcome-event stores as first-class public tables.

## Required Adapter Contracts

Added `src/KynticAI.Scout.Application/Abstractions/StorageAdapterContracts.cs` with a local data-plane adapter boundary:

- `ILocalDataPlaneStorageAdapter`
  - `GetCapabilitiesAsync()`
  - `CheckHealthAsync()`
  - `ExportAsync()`
  - `ImportAsync()`
  - `WriteVectorAsync()`
- Provider keys:
  - `disabled`
  - `scout-postgres`
  - `enterprise-runtime`
  - `dual-write`
- Scope flags:
  - source events, user signals, selector executions, context facts, provenance, data items, relationship sets, attribution paths, outcome events, and vectors.
- Result and request contracts:
  - `StorageAdapterRequestContext`
  - `StorageAdapterCapabilities`
  - `StorageAdapterHealthResult`
  - `StoragePortableRecord`
  - `StorageExportBatch`
  - `StorageImportResult`
  - `StorageVectorRecord`
  - `StorageVectorWriteResult`

Contract guarantees:

- Every operation carries tenant context, purpose, correlation ID, and optional idempotency key.
- The boundary is local data-plane first.
- Capability reporting includes whether Cloud data movement is used. Scout defaults to `false`.
- Vector writes are explicit and can be skipped or failed without faking embeddings.
- Export/import/backfill are contract surfaces only in the open-source default until a reviewed migration runner is implemented.

## Postgres/Vector Adapter Behaviour

Implemented a safe default `ScoutPostgresStorageAdapter` in `src/KynticAI.Scout.Infrastructure/Extensions/EnterpriseExtensionDefaults.cs`.

Behaviour:

- Adapter key: `scout-postgres`.
- Reports current Scout relational scopes as supported:
  - source events
  - user signals
  - selector executions
  - context facts
  - provenance
- Uses existing EF-backed Scout storage through `IScoutDbContext`.
- Health check performs a local Scout database probe only.
- Does not use Cloud as a data plane.
- Does not write vectors.
- Does not generate embeddings.
- Does not claim pgvector support.
- Export/import return explicit `NotSupported` results in the open-source default.
- `WriteVectorAsync()` returns `Skipped` with a typed `NotConfigured` error unless a private/local adapter replaces the default.

This keeps Scout functional with current storage and creates a contract slot for a future local pgvector companion adapter or dual-write adapter without changing connector packages.

## LanceDB/Fortress Adapter Expectations

The Enterprise/Fortress adapter must be supplied by the private runtime, not by Scout/open-core.

Expected private adapter behaviour:

- Register an `ILocalDataPlaneStorageAdapter` implementation with provider key `enterprise-runtime` or a reviewed private provider key.
- Keep all source payloads, exact data items, relationship sets, attribution paths, outcome events, vectors, embeddings, migration logs, checkpoints, and dead letters inside the customer-owned environment.
- Map Scout/Fortress vector anchors deterministically:
  - `id`
  - `entity_type`
  - `postgres_pk`
  - `layer`
  - `embedding`
  - `metadata_json`
  - `created_at`
  - `updated_at`
- Enforce tenant isolation through `layer` or an equivalent tenant scope. Ambiguous or cross-tenant mappings must fail closed.
- Require dense local embeddings for LanceDB writes. Null embeddings must be skipped, dead-lettered, or routed to a metadata-capable local target according to policy; they must not be faked.
- Report provider readiness as unavailable/unproven until a local LanceDB/native-store proof has passed.
- Apply local retry and dead-letter policy with metadata-only operator diagnostics.
- Avoid exposing LanceDB table names, private scoring internals, raw embeddings, or private relationship-engine internals through public Scout APIs.

## Migration/Export/Import Requirements

The boundary now has method slots, but the migration runner is not implemented in Scout.

Required follow-on work:

- Define deterministic ID mapping from Scout tenant/workspace/source/fact IDs to `postgres_pk`, `entity_type`, `layer`, citation IDs, provenance IDs, outcome IDs, and relationship-set IDs.
- Add resumable local export batches with checkpoints.
- Add local import/upsert semantics with idempotency keys.
- Add quiet migration mode so backfill does not trigger normal billing limits, duplicate-suppression side effects, recompute noise, or misleading user-facing audit entries.
- Add local dead-letter records and retry metadata.
- Preserve provenance, citation IDs, masking decisions, and governance context.
- Keep Cloud out of migration state. Cloud may gate licence/download/update metadata only.
- Add rollback rules for Scout relational storage, private Fortress tables, local vector stores, and local checkpoint/dead-letter stores.

The open-source default intentionally returns `NotSupported` for export/import until those behaviours are designed, reviewed, and tested.

## Config Flags And Environment Variables

Added `StorageAdapterOptions` in `src/KynticAI.Scout.Infrastructure/Configuration/RuntimeOptions.cs` and registered it in infrastructure DI.

Config section:

```json
"StorageAdapter": {
  "Provider": "scout-postgres",
  "VectorProvider": "disabled",
  "EnableEnterpriseRuntime": false,
  "EnableVectorWrites": false,
  "EnableDualWrite": false,
  "AllowCloudDataMovement": false,
  "EnterpriseRuntimeBaseUrl": "",
  "ExpectedEmbeddingDimensions": 384,
  "ExportCheckpointPath": ".demo-data/storage-adapter-checkpoints"
}
```

Environment-variable equivalents:

```text
StorageAdapter__Provider=scout-postgres
StorageAdapter__VectorProvider=disabled
StorageAdapter__EnableEnterpriseRuntime=false
StorageAdapter__EnableVectorWrites=false
StorageAdapter__EnableDualWrite=false
StorageAdapter__AllowCloudDataMovement=false
StorageAdapter__EnterpriseRuntimeBaseUrl=
StorageAdapter__ExpectedEmbeddingDimensions=384
StorageAdapter__ExportCheckpointPath=.demo-data/storage-adapter-checkpoints
```

Public defaults were added to:

- `src/KynticAI.Scout.Api/appsettings.json`
- `src/KynticAI.Scout.Api/appsettings.Development.json`
- `src/KynticAI.Scout.Api/appsettings.Production.json`

`AllowCloudDataMovement` defaults to `false` and must remain false for raw customer data, vectors, relationship sets, attribution paths, outcomes, evidence packs, prompts, generated content, and customer-specific derived intelligence.

## Tests Added Or Updated

Added `tests/KynticAI.Scout.UnitTests/StorageAdapterBoundaryTests.cs`.

Coverage:

- `StorageAdapterOptions` defaults keep Cloud data movement, vector writes, dual write, and Enterprise runtime disabled.
- The default adapter reports `scout-postgres` capabilities, customer-owned data-plane use, and vector writes disabled.
- The default adapter health check uses local Scout storage only.
- Vector writes are skipped by the open-source default with a typed error and no Cloud data movement.

## Commands Run

```text
rg --files docs\work-packages\wp2-upgrade-and-lancedb-migration
Get-Content -Raw docs\work-packages\wp2-upgrade-and-lancedb-migration\01-discovery-audit.md
Get-Content -Raw docs\work-packages\wp2-upgrade-and-lancedb-migration\02-upgrade-architecture.md
Get-Content -Raw docs\work-packages\wp2-upgrade-and-lancedb-migration\03-local-api-connector-routing.md
Get-Content -Raw docs\work-packages\wp2-upgrade-and-lancedb-migration\README.md
Get-Content -Raw docs\work-packages\wp2-upgrade-and-lancedb-migration\handoff.md
Get-Content -Raw docs\work-packages\wp2-upgrade-and-lancedb-migration\status.json
Get-Content -Raw C:\Kyntic\docs\source-of-truth-naming-map.md
Get-Content -Raw C:\Kyntic\UCL-local-aidocs\LOCAL_LAPTOP_TEST_COMMANDS.md
git status --short
Get-Content -Raw C:\Kyntic\UCL\.agents\skills\testing-scout-backend\SKILL.md
rg -n "interface I.*(Storage|Store|Repository|Persistence|Vector|Embedding|Context|Fact|Source|Event|Signal)|class .*DbContext|DatabaseProvider|Npgsql|Sqlite|pgvector|Lance|Vector|Embedding|SaveChangesAsync" src tests
rg --files src tests | rg "(Persistence|Storage|Vector|Embedding|Context|Source|Signal|Provenance|Selector|Configuration|Options|ServiceCollection|DependencyInjection|DbContext|Tests)"
Get-Content -Raw src\KynticAI.Scout.Application\Abstractions\EnterpriseExtensionInterfaces.cs
Get-Content -Raw src\KynticAI.Scout.Application\Abstractions\EnterpriseExtensionContracts.cs
Get-Content -Raw src\KynticAI.Scout.Application\Abstractions\IKynticAI.ScoutDbContext.cs
Get-Content -Raw src\KynticAI.Scout.Infrastructure\Persistence\KynticAI.ScoutDbContext.cs
Get-Content -Raw src\KynticAI.Scout.Infrastructure\Persistence\EntityConfigurations.cs
Get-Content -Raw src\KynticAI.Scout.Infrastructure\DependencyInjection.cs
Get-Content -Raw src\KynticAI.Scout.Infrastructure\Extensions\EnterpriseExtensionDefaults.cs
Get-Content -Raw src\KynticAI.Scout.Infrastructure\Extensions\EnterpriseExtensionServiceCollectionExtensions.cs
Get-Content -Raw src\KynticAI.Scout.Infrastructure\Configuration\RuntimeOptions.cs
Get-Content -Raw src\KynticAI.Scout.Application\DependencyInjection.cs
Get-Content -Raw src\KynticAI.Scout.Application\Contracts\UclDataItemAttributionContracts.cs
Get-Content -Raw src\KynticAI.Scout.Application\Contracts\UclEvidencePackContracts.cs
Get-Content -Raw src\KynticAI.Scout.Application\Validation\UclDataItemAttributionContractValidators.cs
Get-Content -Raw src\KynticAI.Scout.Application\Validation\UclEvidencePackContractValidators.cs
rg -n "struct UclEntity|UclEntity|postgres_pk|entity_embeddings|lance|Lance|VectorRecord|embedding|CompositeVectorWriter|relationship_set_index|RelationshipSet|AttributionPath|OutcomeEvent" engine src tests docs -g "*.rs" -g "*.cs" -g "*.md"
Get-Content -Raw engine\crates\ucl-core\src\entity.rs
Get-Content -Raw engine\crates\ucl-vector\src\schema.rs
Get-Content -Raw engine\crates\ucl-vector\src\store.rs
Get-Content -Raw engine\crates\ucl-vector\src\write_path.rs
Get-Content -Raw engine\crates\ucl-vector\src\relationship_set_index.rs
Get-Content -Raw src\UniversalContextLayer.Enterprise.AspNetCore\HybridVectorSearch.cs
dotnet restore .\KynticAI.Scout.slnx
dotnet build .\KynticAI.Scout.slnx
dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj
dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj
git diff --check
Get-Content -Raw docs\work-packages\wp2-upgrade-and-lancedb-migration\status.json | ConvertFrom-Json | Out-Null
```

## Results

- `dotnet restore .\KynticAI.Scout.slnx`: passed; all projects up to date.
- `dotnet build .\KynticAI.Scout.slnx`: passed; 0 warnings, 0 errors.
- `dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj`: passed; 83 tests.
- `dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj`: passed; 12 tests.
- `git diff --check`: passed; printed only LF-to-CRLF working-copy warnings.
- `Get-Content -Raw docs\work-packages\wp2-upgrade-and-lancedb-migration\status.json | ConvertFrom-Json | Out-Null`: passed.

Skipped:

- Docker/PostgreSQL, browser, LanceDB/native-store, pgvector, model-runtime, live connector, and Enterprise/Fortress proof were not run. The local laptop policy keeps those paths opt-in and the matching environment variables were not set.

## Outcome

Scout now has a public, typed local storage adapter boundary. The default implementation keeps Scout on its existing EF/PostgreSQL-compatible relational storage and explicitly skips vector writes. Enterprise/Fortress can replace or add a local adapter from the private runtime to use LanceDB/vector DB or a dual-write path without importing private code into Scout/open-core and without sending customer intelligence to Cloud.

## Remaining Blockers

- No production migration/export/import runner exists yet.
- No Scout-native canonical relationship-set, attribution-path, outcome-event, vector, pgvector, or LanceDB persistence exists.
- The private Enterprise/Fortress LanceDB adapter still needs local native-store proof.
- The pgvector write path remains a future local adapter/proof task.
- xhigh review gates are still required before marking this storage/data-model/security-sensitive boundary complete.
