# 04 - Scout Migration Export

Date: 2026-06-19

## Summary

Scout now has local migration export tooling for an operator preparing a customer-owned upgrade path to Elite/Fortress. The implementation stays in the public Scout boundary: it reads Scout relational data through the local storage adapter, writes local package files, validates the package shape, excludes secrets and unsafe credentials, and has no Cloud upload mode.

The CLI is intentionally small and repo-local:

```powershell
dotnet run --project tools\KynticAI.Scout.MigrationTool -- export --tenant <tenant-slug> --out <local-folder> [options]
```

## Command Usage

Dry-run validation only:

```powershell
dotnet run --project tools\KynticAI.Scout.MigrationTool -- export --tenant demo --out C:\Temp\scout-export-dry-run --dry-run --scope relationship-inputs --max-records 25
```

Export package generation:

```powershell
dotnet run --project tools\KynticAI.Scout.MigrationTool -- export --tenant demo --out C:\Temp\scout-export --scope relationship-inputs --max-records 50
```

Supported options:

- `--dry-run`: writes `manifest.json` and `validation-report.json`, and does not write `batches/`.
- `--scope`: comma-separated scopes. Aliases include `all`, `relationship-inputs`, `tenant-metadata`, `source-events`, `user-signals`, `selectors`, `selector-executions`, `context-snapshots`, `context-facts`, `provenance`, `audit-events`, `data-items`, `relationship-sets`, `attribution-paths`, `outcome-events`, and `vectors`.
- `--max-records`: records per export batch.
- `--checkpoint`: resumes from the adapter checkpoint token.
- `--provider`: selects a registered local storage adapter provider. The default is configured `StorageAdapter:Provider`.
- `--tenant-id`: optional guard requiring the local tenant ID and slug to match.
- `--purpose`, `--correlation-id`: provenance metadata for the export request.
- `--settings`: optional local appsettings JSON file.

`--upload` and `--cloud-upload` are rejected. The tool writes only local files.

## Export Format

Package kind:

```text
kynticai.scout.migration-export-package.v1
```

Portable storage contract:

```text
kynticai.scout.storage-portable-export.v1
```

Dry run output:

- `manifest.json`
- `validation-report.json`

Export package output:

- `manifest.json`
- `validation-report.json`
- `batches/batch-000001.json`
- Additional `batches/batch-*.json` files when the export requires more than one batch.

Each exported record uses the existing `StoragePortableRecord` shape:

- `recordKind`
- `recordId`
- `sourceSystem`
- `sourceRecordId`
- `observedAtUtc`
- `payload`
- `provenance`
- `metadata`

The default Scout export scopes include:

- Tenant/context metadata: tenant, workspaces, data-source summaries, semantic attributes.
- Source events: payloads and source identifiers, with request headers excluded.
- Signals: user signal key/value records and provenance.
- Selectors: selector definitions and selector execution outputs.
- Relationship inputs where Scout has them: context snapshots, context facts, selector provenance, source events, and user signals.
- Provenance metadata.
- Audit events.

`relationship-sets`, `attribution-paths`, `outcome-events`, and `vectors` remain parsed scope aliases but are not exportable by the open-source Scout default adapter unless a future local provider supplies those records.

## Validation Fields

`validation-report.json` includes:

- `packageKind`
- `contractVersion`
- `generatedAtUtc`
- `dryRun`
- `isValid`
- `tenantSlug`
- `tenantId`
- `scope`
- `checkedRecords`
- `exportedRecords`
- `batchCount`
- `countsByRecordKind`
- `findings`
- `errors`
- `excludedFilesAndFields`
- `usesCloudDataPlane`
- `cloudUploadSupported`

Validation fails closed for:

- Missing or mismatched tenant context.
- Unsupported export scope for the selected local adapter.
- Adapter health or capabilities reporting Cloud data-plane use.
- Export batch diagnostics reporting Cloud data-plane use.
- Invalid JSON in exported payload, provenance, or metadata fields.
- JSON keys that look like secrets or unsafe credentials, including password, secret, token, API key, authorisation, credential, connection string, private key, webhook secret, signing secret, bearer, cookie, or session secret variants.

Provenance fields accept existing Scout array-shaped provenance and object-shaped provenance. Object-shaped provenance is wrapped as a single portable provenance entry so existing demo data validates cleanly.

## Files Excluded

The package manifest and validation report explicitly record these exclusions:

- `connector_credentials` table.
- `saas_webhook_signing_secrets` table.
- `saas_api_clients` API key material.
- `data_sources.connection_config_json`.
- `source_system_events.headers_json`.
- Data-protection key-ring files.
- Local `.env` files.
- Licence, private key, and certificate files.
- Cloud upload or staging locations.

Data-source export rows include `connectionConfigExcluded=true`; source event records include `headersExcluded=true`.

## Test Data Used

Unit tests use an in-memory Scout graph with:

- Tenant `pilot-alpha`.
- One user profile.
- One CRM data source.
- One semantic attribute.
- One selector definition and successful selector execution.
- One source event and derived user signal.
- One context snapshot and context fact.
- One provenance metadata row.
- One audit event.

The local CLI proof used the demo SQLite databases created by:

```powershell
dotnet run --no-build --project src\KynticAI.Scout.Api -- bootstrap-demo
```

with local SQLite connection strings under:

```text
C:\Users\pm\AppData\Local\Temp\scout-migration-cli-proof-20260619014447
```

## Tests Added Or Updated

Updated `tests/KynticAI.Scout.UnitTests/StorageAdapterBoundaryTests.cs` with coverage for:

- Tenant metadata, selector definition, and context snapshot export.
- Source event header exclusion.
- Object-shaped provenance preservation as portable provenance arrays.
- Unsafe credential-looking keys failing validation.
- Dry run writing only manifest and validation report files.
- Export package writing manifest, validation report, and batch files.

Updated `tests/KynticAI.Scout.UnitTests/KynticAI.Scout.UnitTests.csproj` to reference the new migration tool project.

## Commands Run

```powershell
dotnet restore .\KynticAI.Scout.slnx
dotnet build .\tools\KynticAI.Scout.MigrationTool\KynticAI.Scout.MigrationTool.csproj --no-restore
dotnet build .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-restore
dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-build --filter FullyQualifiedName~StorageAdapterBoundaryTests
dotnet build .\KynticAI.Scout.slnx --no-restore
dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-build
dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj --no-build
dotnet run --no-build --project src\KynticAI.Scout.Api -- bootstrap-demo
dotnet run --no-build --project tools\KynticAI.Scout.MigrationTool -- export --tenant demo --out C:\Users\pm\AppData\Local\Temp\scout-migration-cli-proof-20260619014447\dry-run --dry-run --scope relationship-inputs --max-records 25
dotnet run --no-build --project tools\KynticAI.Scout.MigrationTool -- export --tenant demo --out C:\Users\pm\AppData\Local\Temp\scout-migration-cli-proof-20260619014447\export --scope relationship-inputs --max-records 50
```

One early `dotnet restore` failed because NuGet audit treated deprecated/vulnerable `SQLitePCLRaw.lib.e_sqlite3` 2.1.11 as an error. The fix updates Scout Infrastructure to use `SQLitePCLRaw.bundle_e_sqlite3` 3.0.3, which brings in the replacement `SourceGear.sqlite3` path.

Dependency audit sources:

- [SQLitePCLRaw.lib.e_sqlite3 2.1.11](https://www.nuget.org/packages/SQLitePCLRaw.lib.e_sqlite3/2.1.11)
- [SQLitePCLRaw.bundle_e_sqlite3 3.0.3](https://www.nuget.org/packages/SQLitePCLRaw.bundle_e_sqlite3/3.0.3)

One early parallel build attempt hit a shared `obj` file lock between two simultaneous project builds. The same unit test project build passed when rerun serially.

## Results

- Restore: passed after the SQLitePCLRaw package update.
- Tool build: passed with 0 warnings and 0 errors.
- Unit test project build: passed with 0 warnings and 0 errors.
- Focused storage adapter/tool tests: passed; 16 tests.
- Full solution build: passed with 0 warnings and 0 errors.
- Unit tests: passed; 95 tests.
- SDK tests: passed; 13 tests.
- Local dry run: passed; `isValid=true`, `checkedRecords=179`, `exportedRecords=0`, `batchCount=1`, no `batches/` directory.
- Local export package: passed; `isValid=true`, `checkedRecords=179`, `exportedRecords=179`, `batchCount=4`, wrote `batch-000001.json` through `batch-000004.json`.
- CLI proof printed one non-blocking EF query warning about row limiting without `OrderBy`; export validation and package generation still passed.

Skipped checks:

- Docker/PostgreSQL proof was not run because `KYNTIC_RUN_EXTERNAL_DOTNET_TESTS` was not set.
- Browser proof was not run because `KYNTIC_RUN_BROWSER_TESTS` was not set.
- Live Enterprise/Fortress importer, LanceDB/native-store, pgvector, hosted endpoint, package publication, release, deployment, and xhigh review gates were not run.
