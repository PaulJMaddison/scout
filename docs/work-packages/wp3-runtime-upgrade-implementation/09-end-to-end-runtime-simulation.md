# 09 - End-to-End Runtime Simulation

Date: 2026-06-19

## Summary

Ran a local Scout runtime simulation against temporary SQLite databases, ingested synthetic sample data through the registered-connector local API route, confirmed local storage, ran migration dry-run/export, validated the generated package with the Enterprise/Fortress import contract, and checked the optional Cloud entitlement boundary with safe metadata tests only.

The first full package attempt exposed an unacceptable performance issue: the Scout adapter rebuilt the full portable export set once per page. With a large seeded demo database this caused long-running exports and moving-target partial packages. The exporter was fixed to build one local snapshot and yield all pages from that snapshot in a single adapter call.

After the fix, the full seeded package completed in `72.95s`: `109693` records, `110` batches, `isValid=true`, `usesCloudDataPlane=false`. Enterprise/Fortress validation of that package completed in `59.22s`.

## Commands Run

```powershell
dotnet run --project src\KynticAI.Scout.Api -- bootstrap-demo
dotnet run --project src\KynticAI.Scout.Api

dotnet run --project tools\KynticAI.Scout.MigrationTool -- export --tenant demo --out <dry-run-dir> --dry-run --scope relationship-inputs --max-records 25 --purpose wp3-e2e-runtime-simulation-dry-run --correlation-id wp3-e2e-runtime-simulation-final-20260619083602

dotnet run --project tools\KynticAI.Scout.MigrationTool -- export --tenant demo --out C:\Users\pm\AppData\Local\Temp\scout-wp3-e2e-runtime-simulation-20260619083141\fast-full-fixed-scout-export-package-20260619095335 --scope source-events,user-signals,selector-executions,context-facts,provenance,audit-events --max-records 1000 --purpose wp3-e2e-runtime-simulation-fast-full-fixed-export --correlation-id wp3-e2e-runtime-simulation-final-20260619083602

cargo run --quiet --manifest-path C:\Users\pm\AppData\Local\Temp\scout-wp3-e2e-runtime-simulation-20260619083141\enterprise-validator\Cargo.toml -- C:\Users\pm\AppData\Local\Temp\scout-wp3-e2e-runtime-simulation-20260619083141\fast-full-fixed-scout-export-package-20260619095335 demo

dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --filter FullyQualifiedName~StorageAdapterBoundaryTests
dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --filter FullyQualifiedName~CloudControlPlaneEntitlementClientTests
cargo test -p ucl-vector --test scout_import_contract_tests
dotnet test .\tests\Ucl.Cloud.Tests\Ucl.Cloud.Tests.csproj --filter "FullyQualifiedName~Scout_runtime_entitlement_endpoints_expose_canonical_tier_shape_without_customer_data|FullyQualifiedName~Allowed_control_plane_metadata_supports_runtime_registration_heartbeat_and_pack_flags|FullyQualifiedName~Boundary_allowlists_reject_raw_and_derived_payloads_without_echoing_values|FullyQualifiedName~Scout_runtime_licence_status_and_entitlement_routes_expose_safe_canonical_shape|FullyQualifiedName~Data_plane_heartbeat_route_exposes_safe_aggregate_summary_without_key_hash"
```

Stopped stale/hanging Scout/export processes during the run before the fixed export proof. Port `5198` was clear after cleanup.

## Test Data Used

- Tenant: `demo`
- Registered connector: `mockCrm`
- Data source ID: `fda1e7aa-7a83-4cc3-8d5b-24ed1f7eab67`
- Event ID: `wp3-e2e-runtime-simulation-final-20260619083602`
- Source system: `mock_crm`
- Event type: `source.crm.contact_updated`
- External user ID: `123`
- Synthetic account reference: `Larkspur Logistics Group / ACC-WP3-E2E-001`
- Payload marker: `wp3-end-to-end-runtime-simulation`

## API Calls Made

```text
GET  http://127.0.0.1:5198/health
POST http://127.0.0.1:5198/api/auth/login
POST http://127.0.0.1:5198/api/rest/connectors/register
POST http://127.0.0.1:5198/api/v1/connectors/fda1e7aa-7a83-4cc3-8d5b-24ed1f7eab67/events/source-system?tenantSlug=demo
POST http://127.0.0.1:5198/graphql
```

Ingest result: `Processed`, `storedSignalCount=1`, `matchedSelectorCount=0`.

Local SQLite confirmation:

- `source_system_events` contains `wp3-e2e-runtime-simulation-final-20260619083602`.
- `user_signals` contains one `mock_crm.source.crm.contact_updated` signal for the registered data source.
- The stored event remained in the local Scout database at `C:\Users\pm\AppData\Local\Temp\scout-wp3-e2e-runtime-simulation-20260619083141\scout_context_demo.db`.

## Export Files Created

Full fixed package:

```text
C:\Users\pm\AppData\Local\Temp\scout-wp3-e2e-runtime-simulation-20260619083141\fast-full-fixed-scout-export-package-20260619095335\manifest.json
C:\Users\pm\AppData\Local\Temp\scout-wp3-e2e-runtime-simulation-20260619083141\fast-full-fixed-scout-export-package-20260619095335\validation-report.json
C:\Users\pm\AppData\Local\Temp\scout-wp3-e2e-runtime-simulation-20260619083141\fast-full-fixed-scout-export-package-20260619095335\batches\batch-000001.json ... batch-000110.json
```

Package result:

- Scope: `source-events,user-signals,selector-executions,context-facts,provenance,audit-events`
- Elapsed export time: `72.95s`
- `checkedRecords=109693`
- `exportedRecords=109693`
- `batchCount=110`
- `isValid=true`
- `usesCloudDataPlane=false`

The relationship-inputs dry run was also valid. On the large seeded database it checked `107738` relationship-input records and exported `0` records because it was a dry run.

## Validation Result

Enterprise/Fortress package validation used a temporary Rust harness that imports the private `ucl-vector` crate and calls `ScoutPortableExportBatch::from_json(...).prepare_import_plan(Some("demo"))` for each batch.

Result:

- Package validation: passed.
- Enterprise validation elapsed time: `59.22s`.
- Validated package: `fast-full-fixed-scout-export-package-20260619095335`.
- Built-in Enterprise contract tests: `cargo test -p ucl-vector --test scout_import_contract_tests` passed; `14` tests.

## Data Boundary Verification

- Scout ran locally against temporary SQLite databases.
- Migration export wrote local files only.
- Package manifest reported `usesCloudDataPlane=false`.
- `ControlPlane:Enabled=false` remained the Scout default.
- Optional Cloud entitlement path was checked with mocked Scout tests and Cloud route tests using safe metadata only.
- No raw customer records, source payloads, context facts/snapshots, relationship intelligence, relationship sets, attribution paths, outcomes, recommendations, citations, embeddings, vectors, local databases, logs, export packages, checkpoints, dead letters, connector credentials, or source credentials were sent to Cloud.
- Cloud tests passed for canonical tier metadata, allowed control-plane metadata, heartbeat safe aggregate summary, and rejection of raw/derived payload families.

## Fixes Made

- Fixed Scout export pagination so `ExportAsync` builds the portable record set once and yields all pages from one snapshot. This removed the repeated full-scan behaviour that made the package path too slow.
- Normalised exported `DateTime` values to UTC so SQLite-materialised timestamps serialize with a UTC designator.
- Added Enterprise-compatible local provenance references for `user_signal`, `selector_execution`, and `context_fact` records when original provenance lacks a top-level local reference.
- Promoted event-derived `eventId` provenance into `sourceRecordId` where possible.
- Added focused storage adapter tests for all fixes and for single-snapshot multi-page export.

Code files changed:

- `src/KynticAI.Scout.Infrastructure/Extensions/EnterpriseExtensionDefaults.cs`
- `tests/KynticAI.Scout.UnitTests/StorageAdapterBoundaryTests.cs`

## Remaining Blockers

- No production Enterprise/Fortress importer CLI/API consumes Scout export folders yet; validation is contract-level.
- Live Cloud endpoint proof was not run; optional Cloud path was verified with local/mocked safe metadata tests.
- Large package generation is now usable for local client proof, but a production operator UX should add a no-build command path, clear progress output, cancellation, and resumable checkpoints.
- xhigh review gates remain required before release, pilot, or investor-visible claims that depend on the Rust engine/vector boundary.
