# 08 End To End Upgrade Simulation

Date: 2026-06-19

Mode: local/dev simulation and evidence capture. No Scout runtime code, schema, API contract, package, Cloud endpoint, Enterprise/Fortress runtime code, LanceDB store, pgvector store, deployment file, release, tag, or public package was changed in this step.

Evidence base:

- `C:\Kyntic\docs\source-of-truth-naming-map.md`
- `C:\Kyntic\UCL-local-aidocs\LOCAL_LAPTOP_TEST_COMMANDS.md`
- WP2 artefacts `01` through `07`
- Scout/open-core repo: `C:\Kyntic\UCL`
- Enterprise/Fortress repo: `C:\Kyntic\universalcontextlayer-enterprise`
- Cloud/control-plane repo: `C:\Kyntic\universalcontextlayer-cloud`

## Environment Used

| Area | Value |
| --- | --- |
| Machine | Local Windows laptop, PowerShell, Europe/London local date `2026-06-19`. |
| Scout repo | `C:\Kyntic\UCL`. |
| Enterprise/Fortress repo | `C:\Kyntic\universalcontextlayer-enterprise`. |
| Cloud repo | `C:\Kyntic\universalcontextlayer-cloud`. |
| .NET | Global `C:\Program Files\dotnet\dotnet.exe`, targeting repo `net10.0` projects. |
| Python evidence helper | `C:\Python313\python.exe` used only to inspect local SQLite evidence. |
| Rust | Local Cargo toolchain in `C:\Kyntic\universalcontextlayer-enterprise\engine`. |
| Scout storage | Fresh temporary SQLite files under `C:\Users\pm\AppData\Local\Temp\kyntic-wp2-upgrade-simulation-20260619-000856`. |
| Heavy proof policy | Docker/PostgreSQL, browser/Playwright, LanceDB/native-store, pgvector, model-runtime, hosted endpoints, and live vendor connectors were not run because the matching opt-in env vars were not set. |

## Simulation Coverage

| Requirement | Result | Evidence |
| --- | --- | --- |
| Fresh Scout install | Partial pass. `bootstrap-demo` created a fresh local SQLite Scout/CustomerOps pair outside the repo. | Temp DB counts: 2 tenants, 2 workspaces, 80 user profiles, 6 data sources, 26 semantic attributes, 28 selector definitions, 366 context snapshots, 4,758 context facts, 9,882 provenance rows, and 727 audit events. |
| Ingest data through standard connector/API route | Passed through deterministic Scout integration tests. The attempted live temp-host API ingest did not complete before timeout. | `dotnet test .\tests\KynticAI.Scout.IntegrationTests\KynticAI.Scout.IntegrationTests.csproj --filter FullyQualifiedName~V1RestApiIntegrationTests` passed 5 tests, including source-system event ingestion, idempotency, signature rejection, tenant scoping, GraphQL event history, and local DB assertions. |
| Confirm Scout data stored locally | Passed in tests; partial in live temp host. | Integration tests assert `source_system_events`, recompute jobs, selector executions, and audit evidence through local test storage. The live temp DB itself had `source_system_events=0` because the HTTP event post was not reached before timeout. |
| Export Scout migration package or dry-run report | Passed as adapter contract test; operator CLI still missing. | `StorageAdapterBoundaryTests` passed 7 tests. Dry run validates source event/user-signal export without records, checks `usesCloudDataPlane=false`, rejects vector export without a private adapter, and full export maps 6 relational record kinds with tenant/layer metadata. |
| Validate Enterprise/Fortress import contract | Passed contract validation tests; live importer still missing. | `cargo test -p ucl-vector --test scout_import_contract_tests` passed 8 tests for `2026-06-18.scout-lancedb-import.v1`. |
| Confirm Cloud entitlement controls upgrade/download/update metadata only | Passed docs guard test. | `dotnet test .\tests\Ucl.Cloud.Tests\Ucl.Cloud.Tests.csproj --filter FullyQualifiedName~Scout_upgrade_onboarding_contract_keeps_cloud_metadata_only` passed 1 test. |
| Confirm no customer data is sent to Cloud | Passed for simulated local config and focused tests. | Temp Scout config set `ControlPlane__Enabled=false`, `ControlPlane__UsageReportingEnabled=false`, and `StorageAdapter__AllowCloudDataMovement=false`; log scan found no Cloud endpoint indicators. Enterprise and Cloud tests reject Cloud data-plane/import payload families. |
| Confirm rollback/retry path is documented | Passed as documentation coverage, not executable recovery proof. | Rollback guidance exists in `02-upgrade-architecture.md` and `05-migration-export-import.md`; this report records the concrete retry path and blockers below. |

## Commands Run

Context and policy:

```text
Get-Content C:\Kyntic\UCL\.agents\skills\testing-scout-backend\SKILL.md
Get-ChildItem C:\Kyntic\UCL\docs\work-packages\wp2-upgrade-and-lancedb-migration
Get-Content C:\Kyntic\UCL\docs\work-packages\wp2-upgrade-and-lancedb-migration\*.md
Get-Content C:\Kyntic\UCL\docs\work-packages\wp2-upgrade-and-lancedb-migration\status.json
Get-Content C:\Kyntic\docs\source-of-truth-naming-map.md
Get-Content C:\Kyntic\UCL-local-aidocs\LOCAL_LAPTOP_TEST_COMMANDS.md
git status --short
git -C C:\Kyntic\universalcontextlayer-enterprise status --short
git -C C:\Kyntic\universalcontextlayer-cloud status --short
```

Fresh Scout SQLite bootstrap and attempted live host smoke:

```text
dotnet run --project src\KynticAI.Scout.Api -- bootstrap-demo
dotnet run --no-build --project src\KynticAI.Scout.Api
GET  http://127.0.0.1:<dynamic-port>/health
POST http://127.0.0.1:<dynamic-port>/api/auth/login
POST http://127.0.0.1:<dynamic-port>/api/v1/events/source-system?tenantSlug=demo
POST http://127.0.0.1:<dynamic-port>/graphql
python -  # local SQLite evidence query
```

Scout verification:

```text
dotnet restore .\KynticAI.Scout.slnx
dotnet build .\KynticAI.Scout.slnx
dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --filter FullyQualifiedName~StorageAdapterBoundaryTests
dotnet test .\tests\KynticAI.Scout.IntegrationTests\KynticAI.Scout.IntegrationTests.csproj --filter FullyQualifiedName~V1RestApiIntegrationTests
dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj
```

Enterprise/Fortress verification:

```text
cargo test -p ucl-vector --test scout_import_contract_tests
```

Cloud verification:

```text
dotnet test .\tests\Ucl.Cloud.Tests\Ucl.Cloud.Tests.csproj --filter FullyQualifiedName~Scout_upgrade_onboarding_contract_keeps_cloud_metadata_only
```

## URLs Used

The live temp Scout host used dynamic localhost ports:

- `http://127.0.0.1:65185/health`
- `http://127.0.0.1:65042/health`
- `http://127.0.0.1:65042/api/auth/login`
- `http://127.0.0.1:65042/api/v1/events/source-system?tenantSlug=demo`
- `http://127.0.0.1:65042/graphql`

No Cloud URL was configured or called in the Scout temp-host run.

## Test Data Used

Fresh Scout bootstrap data:

- Demo tenant `demo`.
- Demo admin `admin@scout.local`.
- Seeded user `123`.
- Seeded local demo dataset from `bootstrap-demo`.

Attempted live API event payload:

```json
{
  "eventId": "wp2-upgrade-sim-<timestamp>",
  "workspaceSlug": "primary",
  "sourceSystem": "wp2-simulation-connector",
  "eventType": "source_record.upserted",
  "externalUserId": "123",
  "externalAccountId": "ACC-WP2-SIM",
  "observedAtUtc": "2026-06-19T09:30:00Z",
  "payload": {
    "syntheticRecord": {
      "accountId": "ACC-WP2-SIM",
      "externalUserId": "123",
      "health": "green",
      "activeDays30": 27,
      "note": "Synthetic local-only upgrade simulation event"
    },
    "boundary": {
      "classification": "synthetic-test-data",
      "cloudDataPlaneAllowed": false
    }
  }
}
```

The event payload was synthetic. No customer credentials, source exports, vectors, embeddings, relationship sets, attribution paths, prompts, generated content, or real customer identifiers were used.

## What Passed

- Fresh local Scout SQLite bootstrap completed and produced local Scout and CustomerOps databases outside the repo.
- Scout build passed with 0 warnings and 0 errors.
- Scout SDK tests passed: 12 tests.
- Scout storage-adapter tests passed: 7 tests, including export, dry run, tenant/layer metadata, vector-scope rejection, and `usesCloudDataPlane=false`.
- Scout v1 REST integration tests passed: 5 tests, including source-system event ingestion through `POST /api/v1/events/source-system`, local storage assertions, idempotency, tenant scoping, and signature rejection.
- Enterprise/Fortress Scout import contract tests passed: 8 tests validating local boundary flags, dense 384-dimension finite embeddings, tenant/layer match, citation/provenance requirements, forbidden raw-payload metadata, and mapping to vector write requests.
- Cloud metadata-only upgrade onboarding guard passed: 1 test.
- Local temp Scout log scan found no Cloud endpoint indicators.

## What Failed Or Stayed Partial

- The live temp Scout API smoke did not complete the HTTP event post before timeout. Startup began processing seeded demo recompute work and wrote a very large API log. The temp database remained useful as fresh-install evidence, but it is not live-ingest evidence.
- The temp database confirmed `source_system_events=0` and `user_signals=0` after the timed-out host attempts, so the live-host event must be retried after the demo startup/recompute path is made quieter or after an API test host/harness is used.
- No real Scout migration package file was produced because the operator CLI wrapper specified in `05-migration-export-import.md` is not implemented.
- No Enterprise/Fortress production importer CLI/API exists yet to consume `kynticai.scout.storage-portable-export.v1`.
- No live LanceDB, native-store, pgvector, or local embedding model proof was run.
- No browser screenshot was captured because browser/Playwright proof is opt-in on this laptop and was not enabled.

## Screens And API Evidence

Screens were not captured. Practical API/code evidence used instead:

- Scout temp-host health/login/source-event URLs were attempted on localhost dynamic ports.
- `V1RestApiIntegrationTests` passed and asserts the source-system event route returns accepted, persists a `SourceSystemEvent`, creates local recompute/selector evidence where selectors match, handles duplicate events, rejects bad signatures, and keeps tenant scope closed.
- `StorageAdapterBoundaryTests` passed and asserts dry-run export returns validation evidence without records and without Cloud data-plane use.
- `scout_import_contract_tests` passed and asserts Enterprise/Fortress rejects Cloud data-plane, cross-tenant, wrong-dimension, non-finite, missing-citation/provenance, and raw-payload shapes.
- Cloud docs guard passed and asserts Cloud onboarding remains entitlement/download/update/support/heartbeat metadata only.

## Data-Boundary Verification

Scout local temp host was configured with:

```text
ControlPlane__Enabled=false
ControlPlane__BaseUrl=
ControlPlane__UsageReportingEnabled=false
StorageAdapter__Provider=scout-postgres
StorageAdapter__VectorProvider=disabled
StorageAdapter__EnableEnterpriseRuntime=false
StorageAdapter__EnableVectorWrites=false
StorageAdapter__EnableDualWrite=false
StorageAdapter__AllowCloudDataMovement=false
StorageAdapter__EnterpriseRuntimeBaseUrl=
```

Local log scan checked these indicators and found no hits:

```text
universalcontextlayer-cloud
/api/v1/data-planes
/api/v1/usage-reports
ControlPlaneUsageReporter
UsageReportingEnabled=true
```

Cloud boundary result:

- Cloud may gate account, subscription, licence, entitlement, download artefact metadata, update-channel metadata, registration metadata, heartbeat health/status, support metadata, and allowlisted aggregate counters.
- Cloud must not receive Scout export files, raw source records, context facts, context snapshots, local evidence packs, credentials, vectors, embeddings, relationship sets, attribution paths, outcome records, prompts, generated content, citation IDs, weighted signals, local migration checkpoints, local dead letters, local databases, or support bundles by default.

## Rollback And Retry Path

Simulation cleanup/rollback:

- Stop the temporary API process.
- Keep or delete `C:\Users\pm\AppData\Local\Temp\kyntic-wp2-upgrade-simulation-20260619-000856`; it contains synthetic local test databases and logs only.
- No repo database, Docker volume, Cloud state, Enterprise/Fortress store, LanceDB directory, pgvector table, package, tag, or release was changed.

Real upgrade retry path:

1. Take a Scout database backup and snapshot any existing private local stores.
2. Run Scout export dry run through the future operator CLI.
3. Run Enterprise/Fortress import dry run locally against `kynticai.scout.storage-portable-export.v1`.
4. Generate embeddings locally and validate `2026-06-18.scout-lancedb-import.v1` batches.
5. Import with local checkpoints and local dead letters.
6. Switch local routing/provider config only after import verification passes.
7. If import fails before routing switch, keep Scout active and retry from the local checkpoint.
8. If import fails after routing switch, switch provider config back to Scout-compatible storage and rebuild private vector/relationship stores locally from Scout export.
9. If Cloud entitlement is revoked or downgraded, deny future private downloads/updates but do not delete Scout, Enterprise/Fortress, LanceDB, pgvector, checkpoint, dead-letter, or customer data.

## Remaining Blockers

- Implement the Scout operator CLI wrapper that produces local export batches and dry-run reports from `ILocalDataPlaneStorageAdapter.ExportAsync()`.
- Implement the private Enterprise/Fortress importer that consumes Scout portable export batches, generates local embeddings, emits `2026-06-18.scout-lancedb-import.v1`, writes through `ucl-vector`, and records checkpoints/dead letters.
- Make the local demo/API startup smoke suitable for quick post-bootstrap ingest proof, or add a dedicated local API simulation harness that avoids long demo recompute processing.
- Prove live LanceDB/native-store, pgvector fallback, and local embedding model paths with opt-in environment variables.
- Add relationship-set, attribution-path, outcome-event, exact-data-item, governed JSON handoff, retry, dead-letter, and rollback proof.
- Run xhigh review gates before treating this storage/data-model/security-sensitive upgrade path as complete.
