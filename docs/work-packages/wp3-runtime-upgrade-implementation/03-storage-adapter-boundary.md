# 03 Storage Adapter Boundary

Date: 2026-06-19

Mode: scoped Scout/open-core refinement. This step does not import private Enterprise/Fortress code, does not add LanceDB or pgvector dependencies, does not change connector writes, and does not move customer data to Cloud.

Evidence base:

- `C:\Kyntic\docs\source-of-truth-naming-map.md`
- `C:\Kyntic\UCL-local-aidocs\LOCAL_LAPTOP_TEST_COMMANDS.md`
- WP2 storage/export artefacts in `docs/work-packages/wp2-upgrade-and-lancedb-migration`
- Existing WP3 connector route artefact in `docs/work-packages/wp3-runtime-upgrade-implementation/02-connector-local-api-routing.md`
- Scout/open-core repo: `C:\Kyntic\UCL`

## Summary

Scout already had the public `ILocalDataPlaneStorageAdapter` contract and the safe `scout-postgres` default from WP2. This step refines the boundary by adding a configured adapter resolver so future operator tools, local APIs, or private runtime modules can ask for the selected local storage adapter without coupling to a concrete implementation.

The default remains:

```text
StorageAdapter__Provider=scout-postgres
StorageAdapter__VectorProvider=disabled
StorageAdapter__AllowCloudDataMovement=false
```

If a customer-owned Enterprise/Fortress runtime later registers a local adapter with provider key `enterprise-runtime`, the same resolver can select it through local configuration. If `enterprise-runtime` is configured without a registered private adapter, Scout fails closed with a clear local error instead of silently falling back, faking vector support, or calling Cloud.

## Code Files Changed

- `src/KynticAI.Scout.Application/Abstractions/StorageAdapterContracts.cs`
- `src/KynticAI.Scout.Infrastructure/Extensions/LocalDataPlaneStorageAdapterResolver.cs`
- `src/KynticAI.Scout.Infrastructure/Extensions/EnterpriseExtensionServiceCollectionExtensions.cs`
- `tests/KynticAI.Scout.UnitTests/StorageAdapterBoundaryTests.cs`

Documentation files changed:

- `docs/work-packages/wp3-runtime-upgrade-implementation/03-storage-adapter-boundary.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/README.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/handoff.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/status.json`

## Interfaces And Contracts Added

Added `ILocalDataPlaneStorageAdapterResolver` to the public application abstraction layer.

Contract members:

- `DefaultProviderKey`
- `RegisteredProviderKeys`
- `Resolve(string? providerKey = null)`
- `GetRequiredAdapter(string? providerKey = null)`

Added `LocalDataPlaneStorageAdapterResolver` in infrastructure. It:

- reads `StorageAdapterOptions.Provider`;
- treats a blank provider as `scout-postgres`;
- returns the matching registered `ILocalDataPlaneStorageAdapter`;
- returns `null` for the explicit `disabled` provider through `Resolve`;
- throws a clear `InvalidOperationException` from `GetRequiredAdapter` when the configured provider is missing;
- keeps provider selection local and does not call Cloud.

Existing extension point preserved:

```csharp
services.AddLocalDataPlaneStorageAdapter<T>();
```

The default registration still adds `ScoutPostgresStorageAdapter`. Private Enterprise/Fortress code can register its own local adapter from the private runtime without putting that implementation in Scout/open-core.

## Default Adapter Behaviour

Default provider key: `scout-postgres`.

Default behaviour is unchanged:

- current Scout relational storage remains EF-backed and PostgreSQL-compatible, with SQLite still available for local demo-style connection strings through existing database configuration;
- source events, user signals, selector executions, context facts, provenance metadata, and audit events remain the exportable Scout relational scopes;
- `UsesCustomerOwnedDataPlane=true`;
- `UsesCloudDataPlane=false`;
- vector writes remain disabled in Scout/open-core;
- dense embedding generation is not claimed;
- LanceDB, pgvector, relationship-set, attribution-path, outcome-event, and private importer storage are not faked in Scout.

The resolver makes this default explicit for future callers. It does not reroute existing connector writes or selector execution paths.

## Enterprise/Fortress Extension Point

Enterprise/Fortress should supply a private local adapter from the private runtime when that work is ready.

Expected private registration shape:

```csharp
services.AddLocalDataPlaneStorageAdapter<EnterpriseRuntimeStorageAdapter>();
```

Expected local configuration:

```text
StorageAdapter__Provider=enterprise-runtime
StorageAdapter__VectorProvider=enterprise-runtime
StorageAdapter__EnableEnterpriseRuntime=true
StorageAdapter__EnableVectorWrites=true
StorageAdapter__AllowCloudDataMovement=false
```

The private adapter remains responsible for LanceDB/vector DB, local embeddings, relationship sets, attribution paths, outcome events, retry/checkpoint/dead-letter state, and any pgvector companion proof. Those stores must remain inside the customer-owned environment. Cloud may gate licence, entitlement, download, update, and safe aggregate metadata only; it is not a data-plane storage provider.

## Config And Environment Variables

Public-safe defaults remain in the API appsettings files:

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

Environment equivalents:

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

Selecting `enterprise-runtime` is only valid when a private local adapter is registered in the same customer-owned runtime.

## Tests Run

Focused verification:

```text
dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --filter FullyQualifiedName~StorageAdapterBoundaryTests
```

Result: passed; 10 tests.

Local policy verification:

```text
dotnet restore .\KynticAI.Scout.slnx
dotnet build .\KynticAI.Scout.slnx
dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-build
dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj --no-build
git diff --check
Get-Content -Raw docs\work-packages\wp3-runtime-upgrade-implementation\status.json | ConvertFrom-Json | Out-Null
```

Results:

- Restore passed; all projects up to date.
- Build passed; 0 warnings, 0 errors.
- Unit tests passed; 89 tests.
- SDK tests passed; 13 tests.
- `git diff --check` passed with LF-to-CRLF working-copy warnings only.
- WP3 `status.json` parse validation passed.

## Skipped Checks

- Docker/PostgreSQL proof was not run because `KYNTIC_RUN_EXTERNAL_DOTNET_TESTS` was not set and this task did not explicitly opt in.
- Browser/Playwright proof was not run because `KYNTIC_RUN_BROWSER_TESTS` was not set.
- LanceDB/native-store, pgvector, model-runtime, hosted endpoint, vendor sandbox, live connector proof, package publication, release, and deployment checks were not run.
- xhigh review gates were not run and remain required before release, pilot, or investor-visible technical proof that depends on this storage/data-model/security-sensitive boundary.

## Remaining Risks

- The Scout operator migration CLI wrapper is still not implemented.
- Private Enterprise/Fortress LanceDB/vector DB adapter and importer are still not implemented in Scout/open-core and must remain private/local.
- Scout still has no native canonical relationship-set, attribution-path, outcome-event, vector, LanceDB, or pgvector persistence.
- Live LanceDB/native-store, local embedding, and pgvector proof remain opt-in private/runtime work.
- The resolver now fails closed for a missing configured provider, but no production operator UX exists yet to guide remediation.
