# WP3 Handoff

Date: 2026-06-19

## Summary

Implemented the smallest safe code changes for connector-local API routing and storage adapter selection in Scout/open-core, then added Scout-side local migration export/dry-run validation tooling, then added the private Enterprise/Fortress import-side contract for Scout migration packages in the Enterprise repo. The latest Scout slice adds the optional Scout-side Cloud licence/entitlement client, and the Cloud compatibility slice aligns signed licence downloads and entitlement/status response contracts for those optional checks.

The registered-connector event route is:

```text
POST /api/v1/connectors/{dataSourceId}/events/source-system?tenantSlug=<tenant>
```

It accepts the existing source-system event request body, validates through the same auth/signature path, and delegates to the existing local `IngestSourceSystemEventAsync()` service. The stored source event and user signal are bound to the registered data source when `dataSourceId` is provided.

The storage boundary includes `ILocalDataPlaneStorageAdapterResolver`. It reads `StorageAdapter:Provider`, keeps `scout-postgres` as the default, selects any registered local adapter by provider key, and fails closed when a configured private provider such as `enterprise-runtime` is missing.

The Scout migration export CLI is:

```text
dotnet run --project tools/KynticAI.Scout.MigrationTool -- export --tenant <tenant-slug> --out <local-folder> [options]
```

It supports dry runs, local export package generation, validation reports, tenant/context metadata, source events, signals, selectors, relationship inputs where Scout has them, provenance, and audit events. It rejects `--upload`/`--cloud-upload`, writes no Cloud artefacts, and explicitly excludes connector credentials, webhook secrets, API key material, data-source connection config, source-event headers, key-ring files, local environment files, licence/private key/certificate files, and Cloud staging locations.

The Enterprise/Fortress import contract now lives in `engine/crates/ucl-vector/src/scout_migration_package.rs`. It mirrors Scout `kynticai.scout.storage-portable-export.v1` batches without importing Scout packages, validates local-only package shape and tenant/layer anchors, prepares deterministic Fortress import records, and only builds the existing LanceDB import batch after local embeddings are supplied by the private runtime.

Cloud now emits new signed licence downloads as `Scout-LICENCE-v1` envelopes with `Scout-` licence keys. It still verifies previously issued `UCL-LICENCE-v1` envelopes. The existing Cloud routes for licence status, validation, account entitlements, data-plane registration, deployment heartbeat, and licensing heartbeat expose Scout/Fortress/Elite canonical tier metadata while preserving legacy numeric `PlanCode` compatibility.

Scout now exposes `IControlPlaneEntitlementClient` with a disabled-by-default `CloudControlPlaneEntitlementClient`. When explicitly enabled and called, it checks `GET /api/v1/licences/{licenceKey}/status`, maps canonical Cloud tier metadata to Scout/Fortress/Elite capability decisions, accepts Cloud `Grace` status when `isValid=true`, and fails closed for paid capabilities if Cloud is unavailable. It sends only licence and safe deployment/control-plane metadata, uses no request body, and never returns the raw licence key.

## Files Changed

Scout/open-core code for the optional Cloud licence client step:

- `src/KynticAI.Scout.Application/Contracts/ControlPlaneEntitlementContracts.cs`
- `src/KynticAI.Scout.Application/Services/IControlPlaneEntitlementClient.cs`
- `src/KynticAI.Scout.Infrastructure/Services/CloudControlPlaneEntitlementClient.cs`
- `src/KynticAI.Scout.Infrastructure/Configuration/RuntimeOptions.cs`
- `src/KynticAI.Scout.Infrastructure/DependencyInjection.cs`
- `src/KynticAI.Scout.Api/appsettings.json`
- `src/KynticAI.Scout.Api/appsettings.Production.json`
- `tests/KynticAI.Scout.UnitTests/CloudControlPlaneEntitlementClientTests.cs`

Scout/open-core code for the migration export step:

- `Directory.Packages.props`
- `KynticAI.Scout.slnx`
- `src/KynticAI.Scout.Application/Abstractions/StorageAdapterContracts.cs`
- `src/KynticAI.Scout.Infrastructure/Extensions/EnterpriseExtensionDefaults.cs`
- `src/KynticAI.Scout.Infrastructure/KynticAI.Scout.Infrastructure.csproj`
- `tools/KynticAI.Scout.MigrationTool/KynticAI.Scout.MigrationTool.csproj`
- `tools/KynticAI.Scout.MigrationTool/Program.cs`
- `tests/KynticAI.Scout.UnitTests/KynticAI.Scout.UnitTests.csproj`
- `tests/KynticAI.Scout.UnitTests/StorageAdapterBoundaryTests.cs`

Scout/open-core code from earlier WP3 steps:

- `src/KynticAI.Scout.Api/Rest/VersionedRestEndpointRouteBuilderExtensions.cs`
- `src/KynticAI.Scout.Application/Abstractions/StorageAdapterContracts.cs`
- `src/KynticAI.Scout.Application/Contracts/RestV1Contracts.cs`
- `src/KynticAI.Scout.Application/Services/KynticAI.ScoutService.cs`
- `src/KynticAI.Scout.Infrastructure/Extensions/LocalDataPlaneStorageAdapterResolver.cs`
- `src/KynticAI.Scout.Infrastructure/Extensions/EnterpriseExtensionServiceCollectionExtensions.cs`
- `src/KynticAI.Scout.Sdk/Abstractions.cs`
- `src/KynticAI.Scout.Sdk/KynticAI.ScoutClient.cs`
- `packages/typescript/scout-sdk/src/client.ts`

Enterprise/Fortress code:

- `C:\Kyntic\universalcontextlayer-enterprise\engine\crates\ucl-vector\src\lib.rs`
- `C:\Kyntic\universalcontextlayer-enterprise\engine\crates\ucl-vector\src\scout_migration_package.rs`
- `C:\Kyntic\universalcontextlayer-enterprise\engine\crates\ucl-vector\tests\scout_import_contract_tests.rs`

Cloud code:

- `C:\Kyntic\universalcontextlayer-cloud\src\Ucl.Cloud.Api\SecurityAndServices.cs`
- `C:\Kyntic\universalcontextlayer-cloud\src\Ucl.Cloud.Api\Program.cs`
- `C:\Kyntic\universalcontextlayer-cloud\apps\cloud-portal\src\app\api-client.ts`
- `C:\Kyntic\universalcontextlayer-cloud\tests\Ucl.Cloud.Tests\ControlPlaneServiceTests.cs`
- `C:\Kyntic\universalcontextlayer-cloud\docs\licence-download-to-data-plane.md`

Docs:

- `docs/work-packages/wp3-runtime-upgrade-implementation/02-connector-local-api-routing.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/03-storage-adapter-boundary.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/04-scout-migration-export.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/05-enterprise-import-contract.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/06-scout-cloud-licence-client.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/07-cloud-entitlement-compatibility.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/README.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/handoff.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/status.json`
- `C:\Kyntic\universalcontextlayer-enterprise\engine\crates\ucl-vector\README.md`
- `C:\Kyntic\universalcontextlayer-enterprise\docs\scout-lancedb-import-contract.md`
- `C:\Kyntic\universalcontextlayer-enterprise\AGENTS.md`

## Verification

Passed for the Scout optional Cloud licence client step:

- `dotnet build .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-restore`: passed with 0 warnings and 0 errors.
- `dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-build --filter FullyQualifiedName~CloudControlPlaneEntitlementClientTests`: passed; 7 tests.
- `dotnet restore .\KynticAI.Scout.slnx`: passed; all projects up to date.
- `dotnet build .\KynticAI.Scout.slnx --no-restore`: passed with 0 warnings and 0 errors.
- `dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-build`: passed; 102 tests.
- `dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj --no-build`: passed; 13 tests.
- WP3 `status.json`, `appsettings.json`, and `appsettings.Production.json` parse validation passed.
- `git diff --check`: passed with LF-to-CRLF working-copy warnings only.

Passed for the Scout migration export step:

- `dotnet restore .\KynticAI.Scout.slnx`: passed after updating the SQLitePCLRaw dependency away from the deprecated/vulnerable transitive native package flagged by NuGet audit.
- `dotnet build .\tools\KynticAI.Scout.MigrationTool\KynticAI.Scout.MigrationTool.csproj --no-restore`: passed with 0 warnings and 0 errors.
- `dotnet build .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-restore`: passed with 0 warnings and 0 errors.
- `dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-build --filter FullyQualifiedName~StorageAdapterBoundaryTests`: passed; 16 tests.
- `dotnet build .\KynticAI.Scout.slnx --no-restore`: passed with 0 warnings and 0 errors.
- `dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-build`: passed; 95 tests.
- `dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj --no-build`: passed; 13 tests.
- `dotnet run --no-build --project src\KynticAI.Scout.Api -- bootstrap-demo`: passed against temporary local SQLite demo databases.
- `dotnet run --no-build --project tools\KynticAI.Scout.MigrationTool -- export --tenant demo --out C:\Users\pm\AppData\Local\Temp\scout-migration-cli-proof-20260619014447\dry-run --dry-run --scope relationship-inputs --max-records 25`: passed; `isValid=true`, `checkedRecords=179`, `exportedRecords=0`, `batchCount=1`, no `batches/` directory.
- `dotnet run --no-build --project tools\KynticAI.Scout.MigrationTool -- export --tenant demo --out C:\Users\pm\AppData\Local\Temp\scout-migration-cli-proof-20260619014447\export --scope relationship-inputs --max-records 50`: passed; `isValid=true`, `checkedRecords=179`, `exportedRecords=179`, `batchCount=4`.

Known non-blocking Scout export warning:

- The local CLI proof printed one EF query warning about row limiting without `OrderBy`; validation, dry run, and package generation still passed.

One earlier Scout command issue was recorded:

- A parallel build attempt hit a shared `obj` file lock between simultaneous project builds. The same unit test project build passed when rerun serially.

Passed in earlier Scout WP3 steps:

- Focused .NET SDK connector-route test.
- Focused integration connector-route test.
- Focused storage adapter boundary tests: 10 passed.
- TypeScript SDK tests.
- TypeScript SDK build.
- `dotnet restore .\KynticAI.Scout.slnx`.
- `dotnet build .\KynticAI.Scout.slnx` with 0 warnings and 0 errors.
- Unit tests: 89 passed.
- SDK tests: 13 passed.
- V1 REST integration test filter: 6 passed.
- Scout `git diff --check` with LF-to-CRLF working-copy warnings only.
- WP3 `status.json` parse validation.

Passed for the Enterprise import contract step:

- `cargo fmt -p ucl-vector`.
- `cargo fmt --check -p ucl-vector`.
- `cargo test -p ucl-vector --test scout_import_contract_tests`: passed; 14 tests.
- `cargo test -p ucl-vector`: passed; unit tests, import contract tests, write-path tests, and doctest.
- `cargo test --workspace`: passed; existing `ucl-pipeline` test warnings about an unused import and unused variable were printed.

Passed for the Cloud entitlement compatibility step:

- `dotnet restore .\UclCloudControlPlane.slnx`: passed.
- `dotnet build .\UclCloudControlPlane.slnx --no-restore`: passed with 0 warnings and 0 errors.
- `dotnet test .\tests\Ucl.Cloud.Tests\Ucl.Cloud.Tests.csproj --filter "FullyQualifiedName~ControlPlaneServiceTests.Scout_runtime_entitlement_endpoints_expose_canonical_tier_shape_without_customer_data|FullyQualifiedName~ControlPlaneServiceTests.Signed_licence_download_shape_is_scout_runtime_compatible_and_keeps_legacy_envelope_verification|FullyQualifiedName~ControlPlaneServiceTests.Allowed_control_plane_metadata_supports_runtime_registration_heartbeat_and_pack_flags|FullyQualifiedName~ControlPlaneServiceTests.Boundary_allowlists_reject_raw_and_derived_payloads_without_echoing_values"`: passed; 6 tests.
- `npm run build` in `C:\Kyntic\universalcontextlayer-cloud\apps\cloud-portal`: passed, including the control-plane boundary check and TypeScript checks; Vite reported the existing large-chunk warning.
- Cloud `git diff --check`: passed with LF-to-CRLF working-copy warnings only.
- Scout WP3 `status.json` parse validation: passed.
- Scoped Scout WP3 `git diff --check`: passed with LF-to-CRLF working-copy warnings only.

Known Cloud full-suite blocker:

- `dotnet test .\UclCloudControlPlane.slnx --no-build`: failed because existing `Ucl.Cloud.Tests.AnalyticsPixelTests.Marketing_helper_uses_send_beacon_session_storage_and_no_third_party_scripts` found `googletagmanager`; 610 passed, 1 failed.

One earlier command mistake was recorded:

- `npm test -- --runInBand` failed because Vitest does not support Jest's `--runInBand` option. It was rerun as `npm test` and passed.

## Data Boundary

The Scout changes are local-first. They do not require Cloud, do not add customer-data upload paths, and do not import private Enterprise/Fortress code into Scout. Docker quick start and existing n8n/source-system event routes continue to use the existing local API route. `StorageAdapter__AllowCloudDataMovement` remains false by default. The migration export CLI writes local files only, rejects Cloud upload flags, and fails closed if adapter capabilities, health, or batch diagnostics report Cloud data-plane use.

The optional Cloud licence client is disabled by default. When enabled and called, it sends only licence status metadata and optional deployment/control-plane headers: account ID, data-plane installation ID, deployment name, version, region, environment type, and update channel. It sends no request body and does not send raw records, exact data items, context facts/snapshots, prompts, relationship intelligence, relationship sets, attribution paths, outcome records, recommendations, weighted signals, citation IDs, embeddings, vectors, connector credentials, local databases, logs, migration exports, checkpoints, dead letters, or support bundles.

The Enterprise package contract rejects Scout export batches whose diagnostics or record metadata indicate Cloud data-plane use. Scout payload content remains local package input and is not copied into vector metadata by the preparation layer.

The Cloud compatibility tests reject or avoid raw customer records, exact data items, context facts/snapshots, prompt context packages, local logs/databases, relationship intelligence, relationship sets, attribution paths, outcome records, recommendations, caveats, weighted signals, citation IDs, embeddings, vectors, record identifiers, source credentials, and connector credentials. Allowed Cloud payloads remain commercial/control-plane metadata and aggregate counters only.

## Remaining Direct Paths

- `SqlConnectorPlugin` direct reads remain for selector-time compatibility.
- `MockConnectorPlugin` signal-backed direct local reads remain for mock/local compatibility.
- Application service and recompute processor EF writes remain the owned local persistence path.
- No connector-owned source-ingestion direct write path was added or left as the preferred path.
- `scout-postgres` remains the configured default storage adapter.
- `enterprise-runtime` can only be selected when a private local adapter is registered.

## Remaining Gaps

- No production Enterprise/Fortress importer CLI/API consumes Scout export files yet.
- Local embedding generation, live LanceDB/native-store proof, pgvector fallback proof, checkpoints, dead letters, retry, rollback, relationship-set, attribution-path, outcome-event, and governed JSON handoff wiring remain future work.
- The Scout export CLI exists, but no production operator UX wraps it yet.
- The optional Scout Cloud entitlement client exists, but it is not wired into private Enterprise/Fortress runtime gates in the public repo.
- xhigh review gates remain required before release, pilot, or investor-visible technical proof that depends on this Rust engine/vector boundary.

## Recommended Next Prompt

Wire the optional Scout `IControlPlaneEntitlementClient` into the private Enterprise/Fortress runtime gates for `fortress-runtime`, `relationship-set-engine`, and `elite-operator-pack` capabilities. Preserve local signed-licence offline grace and send only Cloud commercial/control-plane metadata.
