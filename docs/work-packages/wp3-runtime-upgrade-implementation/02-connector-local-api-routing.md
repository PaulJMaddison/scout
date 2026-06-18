# 02 Connector Local API Routing

Date: 2026-06-19

Mode: smallest safe Scout/open-core code change. This step adds a registered-connector ingestion route that uses the existing local Scout source-system event service path. It does not add Cloud data movement, storage-specific connector writes, LanceDB, pgvector, private Enterprise/Fortress code, Docker changes, or package publication.

Evidence base:

- `C:\Kyntic\docs\source-of-truth-naming-map.md`
- `C:\Kyntic\UCL-local-aidocs\LOCAL_LAPTOP_TEST_COMMANDS.md`
- WP2 artefacts in `docs/work-packages/wp2-upgrade-and-lancedb-migration`
- Scout/open-core repo: `C:\Kyntic\UCL`

## Summary

Standard connector ingestion now has an additive local API route:

```text
POST /api/v1/connectors/{dataSourceId}/events/source-system?tenantSlug=<tenant>
```

The route accepts the existing `V1SourceSystemEventRequest` body and delegates to `IScoutService.IngestSourceSystemEventAsync()`. The application service now accepts an optional data-source ID on `SourceSystemEventInput`; when supplied, it resolves that registered data source within the same tenant and stores the accepted `SourceSystemEvent` and `UserSignal` with that data-source binding. When the ID is not supplied, the existing source-system matching behaviour remains unchanged.

Existing connector and webhook callers can continue using:

```text
POST /api/v1/events/source-system?tenantSlug=<tenant>
```

## Code Files Changed

- `src/KynticAI.Scout.Api/Rest/VersionedRestEndpointRouteBuilderExtensions.cs`
- `src/KynticAI.Scout.Application/Contracts/RestV1Contracts.cs`
- `src/KynticAI.Scout.Application/Services/KynticAI.ScoutService.cs`
- `src/KynticAI.Scout.Sdk/Abstractions.cs`
- `src/KynticAI.Scout.Sdk/KynticAI.ScoutClient.cs`
- `packages/typescript/scout-sdk/src/client.ts`

Test files changed:

- `tests/KynticAI.Scout.IntegrationTests/V1RestApiIntegrationTests.cs`
- `tests/KynticAI.Scout.Sdk.Tests/KynticAI.ScoutClientTests.cs`
- `packages/typescript/scout-sdk/tests/client.test.ts`

Documentation files changed:

- `docs/work-packages/wp3-runtime-upgrade-implementation/02-connector-local-api-routing.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/README.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/handoff.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/status.json`

## API Routes Used Or Added

Existing route preserved:

```text
POST /api/v1/events/source-system?tenantSlug=<tenant>
```

Added route:

```text
POST /api/v1/connectors/{dataSourceId}/events/source-system?tenantSlug=<tenant>
```

Both routes:

- require the existing `events:ingest` API-client scope or an authorised operator role;
- use the same webhook/API-key signature validation path;
- use the same tenant and workspace access checks;
- use the same billing, idempotency, audit, `SourceSystemEvent`, `UserSignal`, selector-match, and recompute queuing service path;
- keep all payloads inside the local Scout API environment.

## Connectors Changed

No existing executable connector plugin was rewritten.

Additive SDK helpers were added:

- .NET SDK: `IScoutEventsClient.IngestConnectorSourceSystemEventAsync(...)`
- .NET SDK tenant-scoped client: `IScopedEventsClient.IngestConnectorSourceSystemEventAsync(...)`
- TypeScript SDK: `client.events.ingestConnectorSourceSystemEvent(...)`
- TypeScript tenant-scoped client: `client.forTenant(...).events.ingestConnectorSourceSystemEvent(...)`

Existing paths preserved:

- Docker quick-start and smoke scripts still use `POST /api/v1/events/source-system?tenantSlug=demo`.
- Existing `packages/typescript/n8n-node` and `packages/typescript/scout-n8n-node` continue to use the canonical v1 source-system event route.
- Existing mock, CSV, REST, SQL, template, and in-memory connector plugins still fetch for selector execution as before.
- Existing signal-backed mock compatibility remains available.

## Tests Added Or Updated

Added integration coverage:

- `ConnectorSourceSystemEvents_RouteThroughLocalApiIngestPath_AndBindRegisteredDataSource`
  - creates a scoped API client with `events:ingest`;
  - posts to `/api/v1/connectors/{dataSourceId}/events/source-system`;
  - verifies `Accepted`;
  - verifies the event is stored locally as `Processed`;
  - verifies `SourceSystemEvent.DataSourceId` equals the registered data source;
  - verifies the local `UserSignal` is tied to the same data source.

Added SDK coverage:

- .NET: `EventsIngestConnectorSourceSystemEventAsync_UsesRegisteredConnectorRoute`
- TypeScript: `events.ingestConnectorSourceSystemEvent calls the registered connector ingest endpoint`

Existing route coverage remains:

- `EventsIngestSourceSystemEventAsync_UsesRestEventContractPath`
- `events.ingestSourceSystemEvent calls the v1 event contract endpoint`
- existing `V1RestApiIntegrationTests` source-system event, idempotency, tenant-scope, signature, and webhook-secret tests.

## Commands Run

Context and policy:

```text
Get-Content C:\Kyntic\docs\source-of-truth-naming-map.md
rg --files C:\Kyntic\UCL\docs\work-packages\wp2-upgrade-and-lancedb-migration C:\Kyntic\UCL\docs\work-packages\wp3-runtime-upgrade-implementation
Get-Content C:\Kyntic\UCL\docs\work-packages\wp2-upgrade-and-lancedb-migration\*.md
Get-Content C:\Kyntic\UCL\docs\work-packages\wp2-upgrade-and-lancedb-migration\status.json
Get-Content C:\Kyntic\UCL-local-aidocs\LOCAL_LAPTOP_TEST_COMMANDS.md
Get-Content C:\Kyntic\UCL\.agents\skills\testing-scout-backend\SKILL.md
git status --short
```

Discovery:

```text
rg --files src tests packages apps scripts samples docs | rg -i "connector|ingest|source-system|sourceevent|event|seed|demo|import|customerops|sdk|n8n"
rg -n "SourceSystemEvent|IngestSourceSystem|source-system|events/source|/api/v1/events|/api/tenants|DbContext|SaveChanges|Add\(|ExecuteSql|INSERT|UPDATE|DELETE|CustomerOps|ICustomerOps|IConnectorPlugin|FetchAsync|seed|bootstrap|demo" src tests packages apps scripts samples docs -g "!docs/work-packages/wp2-upgrade-and-lancedb-migration/**"
rg -n "ingestSourceSystemEvent|events/source-system|source-system" apps\web packages\typescript src\KynticAI.Scout.Sdk samples scripts tests -g "!**/node_modules/**"
```

Focused verification already run:

```text
dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj --filter FullyQualifiedName~KynticAI.Scout.Sdk.Tests.ScoutClientTests.EventsIngestConnectorSourceSystemEventAsync_UsesRegisteredConnectorRoute
dotnet test .\tests\KynticAI.Scout.IntegrationTests\KynticAI.Scout.IntegrationTests.csproj --filter FullyQualifiedName~ConnectorSourceSystemEvents_RouteThroughLocalApiIngestPath_AndBindRegisteredDataSource
npm test -- --runInBand
npm test
npm run build
```

Final local verification:

```text
dotnet restore .\KynticAI.Scout.slnx
dotnet build .\KynticAI.Scout.slnx
dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj
dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj
dotnet test .\tests\KynticAI.Scout.IntegrationTests\KynticAI.Scout.IntegrationTests.csproj --filter FullyQualifiedName~V1RestApiIntegrationTests
git diff --check
Get-Content -Raw docs\work-packages\wp3-runtime-upgrade-implementation\status.json | ConvertFrom-Json | Out-Null
```

## Results

- Focused .NET SDK connector-route test: passed; 1 test.
- Focused integration connector-route test: passed; 1 test.
- `npm test -- --runInBand`: failed because Vitest does not recognise Jest's `--runInBand` option.
- `npm test` in `packages/typescript/scout-sdk`: passed; 3 files, 17 tests.
- `npm run build` in `packages/typescript/scout-sdk`: passed.
- `dotnet restore .\KynticAI.Scout.slnx`: passed; all projects up to date.
- `dotnet build .\KynticAI.Scout.slnx`: passed; 0 warnings; 0 errors.
- `dotnet test .\tests\KynticAI.Scout.UnitTests\KynticAI.Scout.UnitTests.csproj --no-build`: passed; 86 tests.
- `dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj --no-build`: passed; 13 tests.
- `dotnet test .\tests\KynticAI.Scout.IntegrationTests\KynticAI.Scout.IntegrationTests.csproj --no-build --filter FullyQualifiedName~V1RestApiIntegrationTests`: passed; 6 tests.
- `git diff --check`: passed; printed LF-to-CRLF working-copy warnings only.
- `Get-Content -Raw docs\work-packages\wp3-runtime-upgrade-implementation\status.json | ConvertFrom-Json | Out-Null`: passed.

## Data Boundary

- The new route runs in the local Scout API process.
- The new route does not call Cloud.
- The new route does not add a Cloud configuration option.
- Customer source payloads, source events, user signals, audit rows, selector matches, and recompute work remain inside the local Scout data plane.
- `StorageAdapter__AllowCloudDataMovement` remains unchanged and false by default.

## Backwards Compatibility

- The existing `/api/v1/events/source-system` route is unchanged.
- Existing Docker quick-start scripts do not need changes.
- Existing n8n packages do not need changes.
- Existing direct selector fetch connectors still work.
- Existing SDK event methods still work.
- `SourceSystemEventInput.DataSourceId` is optional and defaults to `null`, so existing service callers retain source-system-name matching.

## Remaining Direct Paths

No connector source-ingestion direct write path to Scout storage internals was found or left in place for this slice.

Remaining direct local paths are compatibility/read or application-owned paths:

- `SqlConnectorPlugin` can still read from the current Scout database, CustomerOps database, or an external PostgreSQL database during selector execution.
- `MockConnectorPlugin` signal-backed mode still reads local `UserSignals` for compatibility with existing mock/local selectors.
- `KynticAI.ScoutService.IngestSourceSystemEventAsync()` still owns the application-level EF writes for events, signals, audit, selector executions, usage records, and recompute jobs.
- `ContextRecomputeProcessor` still owns application-level selector execution and context-fact writes after recompute.
- `ProtectedConnectorCredentialStore` still owns encrypted local connector credential persistence.

These are not connector-owned storage-specific ingestion writes, and they remain local.

## Skipped Checks

- Docker/PostgreSQL proof was not run because `KYNTIC_RUN_EXTERNAL_DOTNET_TESTS` was not set and the task did not explicitly opt in.
- Browser/Playwright proof was not run because `KYNTIC_RUN_BROWSER_TESTS` was not set.
- LanceDB/native-store, pgvector, model-runtime, hosted endpoint, vendor sandbox, and live connector proof were not run.
- xhigh review gates were not run in this implementation turn and remain required before release/pilot claims involving public API, SDK, connector contracts, data-model, storage-boundary, or security-sensitive changes.
