# 08 Docker Startup Smoke Test

Date: 2026-06-19

Mode: Docker/local startup smoke test after WP3 runtime changes. This step used the explicit opt-in paths for Docker/PostgreSQL and browser checks on this laptop. It did not publish packages, run hosted Cloud endpoints, run live vendor connectors, or add private Enterprise/Fortress code to Scout.

Evidence base:

- `C:\Kyntic\docs\source-of-truth-naming-map.md`
- `C:\Kyntic\UCL-local-aidocs\LOCAL_LAPTOP_TEST_COMMANDS.md`
- WP3 implementation notes in this folder
- Scout/open-core repo: `C:\Kyntic\UCL`

## Summary

The fresh Docker startup path passed after starting Docker Desktop and clearing one stale repo-local Vite process that was occupying port `5173`.

The command below reset the Compose stack, rebuilt the API and web images, created fresh Docker volumes, started PostgreSQL, ran startup migrations and demo seeding, waited for API and web readiness, logged in as the demo tenant admin, validated and registered the standard mock CRM connector, ran connector health, sent source-event webhooks through local and LAN URLs, and wrote `.local/scout-install-report.html`.

```powershell
$env:KYNTIC_RUN_EXTERNAL_DOTNET_TESTS='1'
$env:KYNTIC_RUN_BROWSER_TESTS='1'
.\scripts\start-scout-docker.ps1 -Reset -NoOpenReport
```

Result: passed.

## URLs Tested

- API readiness: `http://127.0.0.1:5198/health/ready`
- API base: `http://127.0.0.1:5198`
- GraphQL: `http://127.0.0.1:5198/graphql`
- OpenAPI/Scalar: `http://127.0.0.1:5198/api-docs`
- Web console: `http://127.0.0.1:5173`
- LAN API readiness: `http://192.168.1.145:5198/health/ready`
- LAN web console: `http://192.168.1.145:5173`
- LAN webhook: `http://192.168.1.145:5198/api/v1/events/source-system?tenantSlug=demo`
- Registered connector ingestion route: `http://127.0.0.1:5198/api/v1/connectors/{dataSourceId}/events/source-system?tenantSlug=demo`

## Docker And Health Results

Preflight:

```powershell
docker version
docker compose version
docker compose config --quiet
Get-NetTCPConnection -State Listen -LocalPort 5198,5173,5432,3000,9090,4317,4318,9464,3200
```

Results:

- Docker CLI was installed, but Docker Desktop Linux engine was initially not running.
- `docker compose version` passed: Docker Compose `v5.1.3`.
- `docker compose config --quiet` passed.
- Port `5173` was occupied by an old `node.exe` Vite process from `C:\Kyntic\UCL\apps\web`.
- The stale Vite process was stopped and Docker Desktop was started.
- Docker engine became ready with server version `29.4.3`.

Post-start checks:

```powershell
docker compose ps
docker inspect --format '{{.State.Health.Status}}' scout-postgres
docker inspect --format '{{.State.Health.Status}}' scout-api
Invoke-WebRequest -Uri 'http://127.0.0.1:5198/health/ready' -UseBasicParsing -TimeoutSec 10
Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 10
```

Results:

- `scout-postgres`: healthy.
- `scout-api`: healthy.
- `/health/ready`: `200`, with `scout-db` and `customer-ops-db` checks returned in the health payload.
- Web root: `200`, returned HTML.
- `docker compose ps` showed API on `5198`, web on `5173`, PostgreSQL on `5432`, Grafana on `3000`, Prometheus on `9090`, Tempo on `3200`, and OTLP ports on `4317`, `4318`, and `9464`.
- Cleanup: `docker compose down` passed and stopped/removed the smoke-test containers and network.

## Connector And API Ingestion

The Docker start script validated and registered the standard mock CRM connector, then ran connector health. Additional direct proof was run against the WP3 registered-connector ingestion route:

```powershell
POST /api/v1/connectors/21bf08a7-8eb8-4c85-91da-b8196bedcf1d/events/source-system?tenantSlug=demo
```

Payload summary:

- `eventId`: `wp3-registered-connector-smoke-20260619064523`
- `sourceSystem`: `mock_crm`
- `eventType`: `source.crm.contact_updated`
- `externalUserId`: `123`
- `externalAccountId`: `acct-larkspur-logistics`

Result:

- Ingest status: `Processed`.
- Stored signal count: `1`.
- Matched selector count: `0`.
- Data source ID: `21bf08a7-8eb8-4c85-91da-b8196bedcf1d`.

LAN proof:

- LAN IP detected: `192.168.1.145`.
- LAN API health returned `200`.
- LAN web returned `200`.
- The start script's LAN source-event webhook smoke passed and printed the LAN webhook URL.

## Migration Dry Run

Command:

```powershell
$env:KYNTIC_RUN_EXTERNAL_DOTNET_TESTS='1'
$env:Database__Provider='Postgres'
$env:ConnectionStrings__Scout='Host=localhost;Port=5432;Database=scout_context_db;Username=postgres;Password=postgres'
$env:ConnectionStrings__CustomerOps='Host=localhost;Port=5432;Database=customer_ops_db;Username=postgres;Password=postgres'
$env:ControlPlane__Enabled='false'
$env:Telemetry__OtlpEndpoint=''
dotnet run --project tools\KynticAI.Scout.MigrationTool -- export --tenant demo --out C:\Users\pm\AppData\Local\Temp\scout-wp3-docker-smoke-dry-run-20260619 --dry-run --scope relationship-inputs --max-records 25
```

Result:

- Exit code: `0`.
- `isValid=true`.
- `checkedRecords=2357`.
- `exportedRecords=0`.
- `batchCount=1`.
- `usesCloudDataPlane=false`.
- `cloudUploadSupported=false`.
- `batches/` directory was not created.

Known non-blocking warning:

- EF Core printed the existing row-limiting-without-`OrderBy` warning during export enumeration. Validation and dry-run output still passed.

## Optional Cloud Licence Checks

Disabled/default check:

```powershell
Get-Content -Raw src\KynticAI.Scout.Api\appsettings.json | ConvertFrom-Json | Select-Object -ExpandProperty ControlPlane
docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' scout-api | Select-String -Pattern '^ControlPlane__|^Licence__|^StorageAdapter__'
```

Results:

- `ControlPlane.Enabled=false` in `appsettings.json`.
- The running Docker API container had no `ControlPlane__*` override.
- Migration dry-run was executed with `ControlPlane__Enabled=false`.

Mocked/enabled check:

```powershell
dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --filter FullyQualifiedName~CloudControlPlaneEntitlementClientTests
```

Result: passed; 7 tests.

## UI Health And Browser Proof

HTTP UI health:

- `Invoke-WebRequest http://127.0.0.1:5173`: `200`.
- `Invoke-WebRequest http://192.168.1.145:5173`: `200`.

The first opt-in Playwright run failed because the local Playwright Chromium binary was missing:

```powershell
$env:KYNTIC_RUN_BROWSER_TESTS='1'
npm run test:e2e
```

Local prerequisite fix:

```powershell
npx playwright install chromium
```

After installing Chromium, Playwright found two stale e2e assertions where tests expected old page headings even though the pages loaded correctly. The screenshots showed the current UI copy:

- Agent playground H1 now says `Intelligent Sales Support uses Scout evidence packs to generate grounded sales recommendations.`
- Selector builder H1 now says `Map raw fields into business meaning that apps, workflows, and AI can use.`

Fix:

- Updated `apps/web/tests/e2e/agent-playground.spec.ts`.
- Updated `apps/web/tests/e2e/selector-builder.spec.ts`.

Rerun:

```powershell
$env:KYNTIC_RUN_BROWSER_TESTS='1'
npm run test:e2e
```

Result: passed; 6 tests.

## Additional Verification

Because web e2e test files changed:

```powershell
npm run lint
npm run test
npm run build
```

Results:

- `npm run lint`: passed.
- `npm run test`: passed; 4 files, 4 tests.
- `npm run build`: passed.

## Fixes Made

Code/test files changed:

- `apps/web/tests/e2e/agent-playground.spec.ts`
- `apps/web/tests/e2e/selector-builder.spec.ts`

The changes align e2e assertions with the current UI copy. No API, database, Docker Compose, Cloud entitlement, storage adapter, migration tool, or connector runtime code needed changes.

Local environment actions:

- Stopped a stale repo-local Vite process occupying port `5173`.
- Started Docker Desktop.
- Installed the local Playwright Chromium browser bundle.

## Remaining Blockers

- No live Cloud endpoint was used; the optional enabled Cloud licence path was verified with the existing mocked unit tests.
- Docker web image build printed existing npm audit output: 3 vulnerabilities, 1 low and 2 high. This did not block startup, but should be triaged separately.
- LanceDB/native-store, pgvector fallback, model runtime, vendor sandbox/live connector, hosted endpoint, package publication, release, deployment, and xhigh review gates were not run.
