# WP3 Handoff

Date: 2026-06-19

## Final Review Addendum

The WP3 final evidence pack is now present:

- `10-final-review.md`
- `investor-summary.md`
- `customer-safe-summary.md`
- `next-work-packages.md`

Final commit-readiness review:

- Scout/open-core (`C:\Kyntic\UCL`, branch `pjm/cloud-entitlement-compatibility`) was clean before the final evidence-pack docs were added. It is ready for a final docs/status commit after final validation. Suggested commit message: `docs: add WP3 final evidence pack`.
- Cloud/control plane (`C:\Kyntic\universalcontextlayer-cloud`, branch `codex/canonical-relationship-weighting`) has unrelated uncommitted `AGENTS.md` and brand image changes. Do not bundle those into a WP3 commit. The WP3 Cloud compatibility commits are present and focused validation passed, but the full Cloud suite still has the known analytics-pixel guard failure.
- Enterprise/Fortress (`C:\Kyntic\universalcontextlayer-enterprise`, branch `pjm/ucl-evidence-pack-v1-adapter`) is clean. The Scout migration package import contract is present, with xhigh Rust/vector review still required before pilot, release, or investor-visible technical proof claims.

Final boundary verdict: WP3 proves a local runtime-upgrade foundation, not production SaaS. Scout remains the customer-owned data plane. Cloud remains commercial/control-plane metadata only. Enterprise/Fortress remains the private paid runtime boundary.

Final validation for this review passed:

- Scout `status.json` parse, `git diff --check`, restore, build, unit tests, and SDK tests.
- Cloud `git diff --check`, restore, build, and focused Scout entitlement/status/heartbeat metadata tests.
- Enterprise/Fortress `git diff --check` and `cargo test -p ucl-vector --test scout_import_contract_tests`.

## Summary

Implemented the smallest safe code changes for connector-local API routing and storage adapter selection in Scout/open-core, then added Scout-side local migration export/dry-run validation tooling, then added the private Enterprise/Fortress import-side contract for Scout migration packages in the Enterprise repo. The Scout-side Cloud slice adds the optional Scout-side Cloud licence/entitlement client, and the Cloud compatibility slice aligns signed licence downloads and entitlement/status response contracts for those optional checks. The latest Scout slice runs an end-to-end local runtime simulation after WP3 and verifies local Scout startup, connector ingestion, local storage, migration dry run, full package generation, Enterprise/Fortress package validation, and optional Cloud entitlement checks with safe metadata only.

The runtime simulation found and fixed an unacceptable migration package performance issue. Scout was rebuilding the full portable export set once per package page; the adapter now builds one snapshot and yields all pages from that snapshot. The fixed full seeded local package exported `109693` records in `110` batches in `72.95s`, with `isValid=true` and `usesCloudDataPlane=false`. Enterprise/Fortress validation of that exact package passed in `59.22s`.

The same run fixed package compatibility issues found by the Enterprise validator: exported timestamps are normalised to UTC, and `user_signal`, `selector_execution`, and `context_fact` records now carry usable local provenance references when original provenance is nested or event-shaped.

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

Cloud now emits new signed licence downloads as `Scout-LICENCE-v1` envelopes with `Scout-` licence keys. It still verifies previously issued `UCL-LICENCE-v1` envelopes. The existing Cloud routes for licence status, validation, account entitlements, data-plane registration, deployment heartbeat, and licensing heartbeat expose Scout/Fortress/Elite canonical tier metadata while preserving legacy numeric `PlanCode` compatibility. The latest Cloud test update adds hosted REST proof for the actual Scout-facing `GET /api/v1/licences/{licenceKey}/status`, `GET /api/v1/accounts/{accountId}/entitlements`, and `POST /api/v1/data-planes/heartbeat` JSON shape. Heartbeat/status responses include parsed `lastSafeUsageSummary` aggregate counters beside the legacy `lastUsageSummaryJson` field and do not expose `apiKeyHash`.

Scout now exposes `IControlPlaneEntitlementClient` with a disabled-by-default `CloudControlPlaneEntitlementClient`. When explicitly enabled and called, it checks `GET /api/v1/licences/{licenceKey}/status`, maps canonical Cloud tier metadata to Scout/Fortress/Elite capability decisions, accepts Cloud `Grace` status when `isValid=true`, and fails closed for paid capabilities if Cloud is unavailable. It sends only licence and safe deployment/control-plane metadata, uses no request body, and never returns the raw licence key.

The Docker startup smoke test passed using `.\scripts\start-scout-docker.ps1 -Reset -NoOpenReport` after starting Docker Desktop and stopping one stale repo-local Vite process on port `5173`. The stack rebuilt API/web images, created fresh Docker volumes, ran PostgreSQL-backed startup migrations and demo seeding, returned healthy API and Postgres checks, served web locally and over LAN, validated and registered the mock CRM connector, and accepted local/LAN source events. A direct call to `POST /api/v1/connectors/{dataSourceId}/events/source-system?tenantSlug=demo` returned `Processed` with one stored signal. The migration dry run against the live Postgres stack returned `isValid=true`, `checkedRecords=2357`, `usesCloudDataPlane=false`, and `cloudUploadSupported=false`.

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

- `C:\Kyntic\universalcontextlayer-cloud\src\Ucl.Cloud.Api\Domain.cs`
- `C:\Kyntic\universalcontextlayer-cloud\src\Ucl.Cloud.Api\SecurityAndServices.cs`
- `C:\Kyntic\universalcontextlayer-cloud\src\Ucl.Cloud.Api\Program.cs`
- `C:\Kyntic\universalcontextlayer-cloud\apps\cloud-portal\src\app\api-client.ts`
- `C:\Kyntic\universalcontextlayer-cloud\tests\Ucl.Cloud.Tests\ControlPlaneServiceTests.cs`
- `C:\Kyntic\universalcontextlayer-cloud\tests\Ucl.Cloud.Tests\CloudApiHostingTests.cs`
- `C:\Kyntic\universalcontextlayer-cloud\docs\licence-download-to-data-plane.md`

Scout web e2e test fixes from the Docker startup smoke step:

- `apps/web/tests/e2e/agent-playground.spec.ts`
- `apps/web/tests/e2e/selector-builder.spec.ts`

Scout/open-core code changed in the end-to-end runtime simulation step:

- `src/KynticAI.Scout.Infrastructure/Extensions/EnterpriseExtensionDefaults.cs`
- `tests/KynticAI.Scout.UnitTests/StorageAdapterBoundaryTests.cs`

Docs:

- `docs/work-packages/wp3-runtime-upgrade-implementation/02-connector-local-api-routing.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/03-storage-adapter-boundary.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/04-scout-migration-export.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/05-enterprise-import-contract.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/06-scout-cloud-licence-client.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/07-cloud-entitlement-compatibility.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/08-docker-startup-smoke-test.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/README.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/handoff.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/status.json`
- `C:\Kyntic\universalcontextlayer-enterprise\engine\crates\ucl-vector\README.md`
- `C:\Kyntic\universalcontextlayer-enterprise\docs\scout-lancedb-import-contract.md`
- `C:\Kyntic\universalcontextlayer-enterprise\AGENTS.md`

## Verification

Passed for the Docker startup smoke step:

- `docker version`: initially showed Docker CLI installed but Docker Desktop Linux engine not running.
- `docker compose version`: passed; Docker Compose `v5.1.3`.
- `docker compose config --quiet`: passed.
- `Get-NetTCPConnection -State Listen -LocalPort 5198,5173,5432,3000,9090,4317,4318,9464,3200`: found stale repo-local Vite on `5173`; stopped before Docker startup.
- `Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe' -WindowStyle Hidden` plus readiness loop: Docker engine became ready; server version `29.4.3`.
- `.\scripts\start-scout-docker.ps1 -Reset -NoOpenReport` with `KYNTIC_RUN_EXTERNAL_DOTNET_TESTS=1` and `KYNTIC_RUN_BROWSER_TESTS=1`: passed; rebuilt API/web images, seeded demo data, generated `.local/scout-install-report.html`, printed local and LAN URLs, and reported `scout-api` and `scout-postgres` healthy.
- `docker compose ps`: API, web, Postgres, Grafana, Prometheus, Tempo, and OTLP collector running on expected ports.
- `docker inspect --format '{{.State.Health.Status}}' scout-postgres`: `healthy`.
- `docker inspect --format '{{.State.Health.Status}}' scout-api`: `healthy`.
- `Invoke-WebRequest http://127.0.0.1:5198/health/ready`: `200`, with DB health checks.
- `Invoke-WebRequest http://127.0.0.1:5173`: `200`, returned HTML.
- `Invoke-WebRequest http://192.168.1.145:5198/health/ready`: `200`.
- `Invoke-WebRequest http://192.168.1.145:5173`: `200`.
- Direct registered-connector ingestion route: passed; event `wp3-registered-connector-smoke-20260619064523` returned `Processed`, `storedSignalCount=1`, `matchedSelectorCount=0`.
- `dotnet run --project tools\KynticAI.Scout.MigrationTool -- export --tenant demo --out C:\Users\pm\AppData\Local\Temp\scout-wp3-docker-smoke-dry-run-20260619 --dry-run --scope relationship-inputs --max-records 25`: passed; `isValid=true`, `checkedRecords=2357`, `exportedRecords=0`, `batchCount=1`, `usesCloudDataPlane=false`, `cloudUploadSupported=false`.
- `Get-Content -Raw src\KynticAI.Scout.Api\appsettings.json | ConvertFrom-Json | Select-Object -ExpandProperty ControlPlane`: passed; `Enabled=false`.
- `docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' scout-api | Select-String -Pattern '^ControlPlane__|^Licence__|^StorageAdapter__'`: no ControlPlane override found in the container environment.
- `dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --filter FullyQualifiedName~CloudControlPlaneEntitlementClientTests`: passed; 7 tests.
- First `npm run test:e2e` failed because the local Playwright Chromium binary was missing; `npx playwright install chromium` fixed the local prerequisite.
- Second `npm run test:e2e` found stale e2e assertions for current UI headings; assertions were updated in two test files.
- Final `npm run test:e2e`: passed; 6 tests.
- `npm run lint` in `apps\web`: passed.
- `npm run test` in `apps\web`: passed; 4 files, 4 tests.
- `npm run build` in `apps\web`: passed.
- `docker compose down`: passed; stopped/removed the smoke-test containers and network.

Passed for the end-to-end runtime simulation step:

- Local Scout API started on `http://127.0.0.1:5198` against temporary SQLite databases under `C:\Users\pm\AppData\Local\Temp\scout-wp3-e2e-runtime-simulation-20260619083141`.
- `POST /api/v1/connectors/fda1e7aa-7a83-4cc3-8d5b-24ed1f7eab67/events/source-system?tenantSlug=demo`: passed; event `wp3-e2e-runtime-simulation-final-20260619083602` returned `Processed` with `storedSignalCount=1`.
- GraphQL `sourceSystemEvents` and direct SQLite probe confirmed the event and one matching signal were stored locally and bound to the registered data source.
- Relationship-input dry run passed on the large seeded local database; `checkedRecords=107738`, `exportedRecords=0`.
- First full export attempts exposed the repeated full-snapshot pagination bug and were stopped.
- Fixed full package export passed: `109693` records, `110` batches, `72.95s`, `isValid=true`, `usesCloudDataPlane=false`.
- Temporary Enterprise validator passed against the full fixed package: `59.22s`.
- `dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --filter FullyQualifiedName~StorageAdapterBoundaryTests`: passed; 21 tests.
- `dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --filter FullyQualifiedName~CloudControlPlaneEntitlementClientTests`: passed; 7 tests.
- `cargo test -p ucl-vector --test scout_import_contract_tests`: passed; 14 tests.
- Cloud safe metadata/control-plane focused tests: passed; 9 tests.

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
- `dotnet test .\tests\Ucl.Cloud.Tests\Ucl.Cloud.Tests.csproj --filter FullyQualifiedName~CloudApiHostingTests.Scout_runtime_licence_status_and_entitlement_routes_expose_safe_canonical_shape`: passed; 1 test.
- `dotnet test .\tests\Ucl.Cloud.Tests\Ucl.Cloud.Tests.csproj --filter "FullyQualifiedName~ControlPlaneServiceTests.Scout_runtime_entitlement_endpoints_expose_canonical_tier_shape_without_customer_data|FullyQualifiedName~ControlPlaneServiceTests.Allowed_control_plane_metadata_supports_runtime_registration_heartbeat_and_pack_flags|FullyQualifiedName~ControlPlaneServiceTests.Boundary_allowlists_reject_raw_and_derived_payloads_without_echoing_values|FullyQualifiedName~CloudApiHostingTests.Scout_runtime_licence_status_and_entitlement_routes_expose_safe_canonical_shape|FullyQualifiedName~CloudApiHostingTests.Data_plane_heartbeat_route_exposes_safe_aggregate_summary_without_key_hash"`: passed; 9 tests.
- `npm run build` in `C:\Kyntic\universalcontextlayer-cloud\apps\cloud-portal`: passed, including the control-plane boundary check and TypeScript checks; Vite reported the existing large-chunk warning.
- Cloud `git diff --check`: passed with LF-to-CRLF working-copy warnings only.
- Scout WP3 `status.json` parse validation: passed.
- Scoped Scout WP3 `git diff --check`: passed with LF-to-CRLF working-copy warnings only.

Known Cloud full-suite blocker:

- `dotnet test .\UclCloudControlPlane.slnx --no-build`: failed because existing `Ucl.Cloud.Tests.AnalyticsPixelTests.Marketing_helper_uses_send_beacon_session_storage_and_no_third_party_scripts` found `googletagmanager`; latest run after the heartbeat compatibility update had 614 passed, 1 failed.

One earlier command mistake was recorded:

- `npm test -- --runInBand` failed because Vitest does not support Jest's `--runInBand` option. It was rerun as `npm test` and passed.

Command issues from the Docker startup smoke step:

- Docker Desktop was installed but not running during preflight; starting Docker Desktop resolved it.
- Port `5173` was occupied by a stale repo-local Vite process; stopping that process allowed the Docker web container to bind.
- Docker web image build printed existing npm audit output: 3 vulnerabilities, 1 low and 2 high.
- First Playwright run failed because the Chromium browser bundle was missing; `npx playwright install chromium` resolved it.
- Second Playwright run exposed stale e2e expectations for current UI copy; updating assertions resolved it.
- The migration dry run printed the existing EF row-limiting-without-`OrderBy` warning; validation still passed.

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
- The Scout export CLI now completes a large seeded local package quickly enough for client proof, but no production operator UX wraps it yet.
- The optional Scout Cloud entitlement client exists, but it is not wired into private Enterprise/Fortress runtime gates in the public repo.
- The Docker startup smoke passed, but the Docker web build reported npm audit vulnerabilities that still need a separate dependency/security triage.
- xhigh review gates remain required before release, pilot, or investor-visible technical proof that depends on this Rust engine/vector boundary.

## Recommended Next Prompt

Build the production Enterprise/Fortress importer CLI/API for validated Scout export folders, then rerun the fast full local package export and import it into a local private runtime target with xhigh review gates.
