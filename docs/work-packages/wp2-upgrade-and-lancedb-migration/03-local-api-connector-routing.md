# 03 Local API Connector Routing

Date: 2026-06-18

Mode: scoped implementation and documentation. This step audited the connector ingestion routes in Scout/open-core and made the smallest safe change found: realigning the older `packages/typescript/scout-n8n-node` package to the current local source-system event API.

Evidence base:

- `C:\Kyntic\docs\source-of-truth-naming-map.md`
- `C:\Kyntic\UCL-local-aidocs\LOCAL_LAPTOP_TEST_COMMANDS.md`
- `docs/work-packages/wp2-upgrade-and-lancedb-migration/01-discovery-audit.md`
- `docs/work-packages/wp2-upgrade-and-lancedb-migration/02-upgrade-architecture.md`
- Scout/open-core repo: `C:\Kyntic\UCL`

## Existing Connector Paths Found

API-routed source-system ingestion:

- `.NET SDK`: `src/KynticAI.Scout.Sdk/KynticAI.ScoutClient.cs` sends source-system events to `POST /api/v1/events/source-system?tenantSlug=<tenant>`.
- TypeScript SDK: `packages/typescript/scout-sdk/src/client.ts` sends source-system events to `POST /api/v1/events/source-system?tenantSlug=<tenant>`.
- Current local n8n package: `packages/typescript/n8n-node/src/nodes/KynticAi/eventMapper.ts` builds `POST /api/v1/events/source-system?tenantSlug=<tenant>`.
- Older n8n package before this step: `packages/typescript/scout-n8n-node/src/nodes/KynticAiScout.node.ts` posted to stale route `/api/tenants/{tenantSlug}/events/source`.

In-process selector connector fetch path:

- `src/KynticAI.Scout.Infrastructure/Selectors/SelectorExecutionEngine.cs` resolves a connector plugin from `DataSource.ConnectionConfigJson`, resolves connector credentials, calls `IConnectorPlugin.FetchAsync`, applies selector rules, and returns selector outcomes for Scout service code to persist.
- `SqlConnectorPlugin` fetches via SQL `select` from the current Scout database, CustomerOps database, or an external PostgreSQL connection. It is direct data access for selector-time reads, not a connector-owned write path.
- `RestApiConnectorPlugin` fetches from generic HTTP APIs or configured static responses. It does not persist source records directly.
- `CsvUploadConnectorPlugin`, `InMemoryInventoryConnectorPlugin`, `MockConnectorPlugin`, mock business plugins, and template plugins read from local configuration or in-memory/demo data and return `ConnectorFetchResult`.
- `ProtectedConnectorCredentialStore` writes connector credentials into Scout storage when configuration secrets are saved or resolved, but that is credential management, not source-record ingestion.

## Direct Storage Writes Found

No connector source-ingestion code was found writing source-system events, exact data items, vectors, LanceDB rows, pgvector rows, context facts, or relationship sets directly to storage-specific internals.

Direct storage writes still exist behind Scout application services and infrastructure where they belong today:

- `KynticAI.ScoutService.IngestSourceSystemEventAsync` persists accepted source-system events, user signals, audit records, billing usage records, selector executions, and recompute jobs after local API validation.
- `ContextRecomputeProcessor` persists selector execution results, provenance metadata, context snapshots, and context facts after selector execution.
- `ProtectedConnectorCredentialStore` persists encrypted connector credential references.

Direct reads found:

- `SqlConnectorPlugin` can read from Scout, CustomerOps, or an external PostgreSQL database during selector execution. This remains compatible with current local demos, but it is not the canonical future write path for durable connector ingestion or upgrade backfill material.

## API Routes Used Or Added

Canonical route used:

```text
POST /api/v1/events/source-system?tenantSlug=<tenant>
```

Server implementation:

- `src/KynticAI.Scout.Api/Rest/VersionedRestEndpointRouteBuilderExtensions.cs`
- Route name: `V1IngestSourceSystemEvent`
- Request contract: `V1SourceSystemEventRequest`
- Application service: `IngestSourceSystemEventAsync`

No server API routes were added in this step. The smallest safe change was to align the stale connector package with the existing v1 route rather than adding a compatibility endpoint for the older `/api/tenants/{tenantSlug}/events/source` path.

## Connector Changes Made

Updated `packages/typescript/scout-n8n-node`:

- Added `buildSourceSystemEventUrl()` in `src/nodes/sourceEventMapper.ts`.
- Updated `src/nodes/KynticAiScout.node.ts` to post to `POST /api/v1/events/source-system?tenantSlug=<tenant>`.
- Exported the route helper from `src/index.ts`.
- Added focused tests in `tests/url.test.ts` to pin the canonical v1 route and reject invalid tenant slugs before URL construction.
- Updated `README.md` to document the local API route and state that the node does not write directly to Scout database tables, connector internals, vector stores, or Cloud services.

No changes were made to:

- Server API routes or request contracts.
- Docker compose or quick-start configuration.
- Current `packages/typescript/n8n-node`, which already used the v1 route.
- SDK contracts.
- In-process mock/local connector demos.
- Selector execution storage behaviour.

## Backwards Compatibility Notes

- Existing Docker quick start should remain compatible because no Docker, server route, database, seed, or configuration files were changed.
- Existing mock/local connector demos are preserved. The in-process connector plugin model still fetches data for selector execution as before.
- The older `@kynticai/scout-n8n-node` package keeps its existing node parameters, mapper payload shape, and credential descriptor. Only the event POST target changed from the stale route to the current v1 local API route.
- The current v1 endpoint resolves tenant identity from the query string and authenticated actor. The older package's mapper still includes `tenantSlug` in its payload object for compatibility with its existing tests and redacted diagnostics; the canonical tenant routing value is the query parameter.
- Deployments or reverse proxies that only allowed the old `/api/tenants/{tenantSlug}/events/source` path must allow `POST /api/v1/events/source-system?tenantSlug=<tenant>`.
- This step does not create canonical exact-data-item, relationship-set, attribution-path, outcome-event, vector, LanceDB, or pgvector persistence. Those remain follow-on WP2 tasks.

## Tests Added Or Updated

Updated:

- `packages/typescript/scout-n8n-node/tests/url.test.ts`

Coverage added:

- Builds `https://scout.example.com/base/api/v1/events/source-system?tenantSlug=pilot-alpha`.
- Rejects invalid tenant slugs before building the route.

Existing checks relied on:

- `tests/KynticAI.Scout.Sdk.Tests/KynticAI.ScoutClientTests.cs` still verifies the .NET SDK uses `http://127.0.0.1:5198/api/v1/events/source-system?tenantSlug=demo`.

## Commands Run

Discovery and audit:

```text
Get-Content C:\Kyntic\docs\source-of-truth-naming-map.md
Get-Content C:\Kyntic\UCL-local-aidocs\LOCAL_LAPTOP_TEST_COMMANDS.md
git status --short
Get-Content docs/work-packages/wp2-upgrade-and-lancedb-migration/*
rg --files | rg -i "connector|ingest|source-system|n8n|sdk|events|selector"
rg -n "source-system|events/source|/api/v1/events|/api/tenants|IngestSourceSystem|SourceSystemEvent|IConnectorPlugin|FetchAsync|DbContext|SaveChanges|INSERT|Npgsql|Sqlite|DataSource" src tests packages apps scripts docs samples
rg -n "api/tenants|events/source|source-system|buildEventUrl|Ingest Source Event" packages\typescript\scout-n8n-node packages\typescript\n8n-node docs docs-site samples
rg -n "SaveChangesAsync|Add\(|Update\(|Remove\(|ExecuteSql|INSERT|UPDATE|DELETE|Database\.|DbConnection|DbCommand|Npgsql|Sqlite|File\.Write|WriteAll|Lance|Vector" src\KynticAI.Scout.Infrastructure\Connectors src\KynticAI.Scout.Infrastructure\Selectors src\KynticAI.Scout.Application packages\typescript\n8n-node packages\typescript\scout-n8n-node samples\connector-template
```

Focused package verification:

```text
npm test
npm run build
npm install
npm test
npm run build
```

Backend route-contract verification:

```text
dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj
```

Opt-in proof checks:

```text
Test-Path C:\Kyntic\UCL\.dotnet\dotnet.exe
Get-ChildItem Env:KYNTIC_RUN_BROWSER_TESTS,Env:KYNTIC_RUN_EXTERNAL_DOTNET_TESTS,Env:KYNTIC_RUN_NATIVE_STORE_TESTS -ErrorAction SilentlyContinue
```

## Results

- `npm test` before dependency install: failed because `vitest` was not recognised. Cause: package-local `node_modules` was absent.
- `npm run build` before dependency install: failed because `tsc` was not recognised. Cause: package-local `node_modules` was absent.
- `npm install`: succeeded, added 142 packages, reported 2 critical npm audit findings in the dependency tree.
- `npm test` after install: passed, 5 test files, 115 tests.
- `npm run build` after install: passed.
- `dotnet test .\tests\KynticAI.Scout.Sdk.Tests\KynticAI.Scout.Sdk.Tests.csproj`: passed, 12 tests.
- Docker, browser, native-store, LanceDB, pgvector, live connector, and external dependency smoke checks were not run. The local laptop policy requires explicit opt-in environment variables for those paths, and the relevant env vars were not set.

## Outcome

The canonical connector-to-local-API route for source-system event ingestion is now implemented in both n8n packages that were found in the repo:

- `packages/typescript/n8n-node`: already used `POST /api/v1/events/source-system?tenantSlug=<tenant>`.
- `packages/typescript/scout-n8n-node`: updated in this step to use `POST /api/v1/events/source-system?tenantSlug=<tenant>`.

The remaining connector routing gap is not a stale event route. It is the larger architecture task from WP2: define a canonical local data-item and relationship-analysis write contract for durable connector ingestion, migration backfill, and future Enterprise/Fortress vector or relationship-set providers without exposing storage-specific internals to connector packages.
