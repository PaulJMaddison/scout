# WP3 Handoff

Date: 2026-06-19

## Summary

Implemented the smallest safe code change for connector-local API routing in Scout/open-core.

The new registered-connector event route is:

```text
POST /api/v1/connectors/{dataSourceId}/events/source-system?tenantSlug=<tenant>
```

It accepts the existing source-system event request body, validates through the same auth/signature path, and delegates to the existing local `IngestSourceSystemEventAsync()` service. The stored source event and user signal are now bound to the registered data source when `dataSourceId` is provided.

## Files Changed

Code:

- `src/KynticAI.Scout.Api/Rest/VersionedRestEndpointRouteBuilderExtensions.cs`
- `src/KynticAI.Scout.Application/Contracts/RestV1Contracts.cs`
- `src/KynticAI.Scout.Application/Services/KynticAI.ScoutService.cs`
- `src/KynticAI.Scout.Sdk/Abstractions.cs`
- `src/KynticAI.Scout.Sdk/KynticAI.ScoutClient.cs`
- `packages/typescript/scout-sdk/src/client.ts`

Tests:

- `tests/KynticAI.Scout.IntegrationTests/V1RestApiIntegrationTests.cs`
- `tests/KynticAI.Scout.Sdk.Tests/KynticAI.ScoutClientTests.cs`
- `packages/typescript/scout-sdk/tests/client.test.ts`

Docs:

- `docs/work-packages/wp3-runtime-upgrade-implementation/02-connector-local-api-routing.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/README.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/handoff.md`
- `docs/work-packages/wp3-runtime-upgrade-implementation/status.json`

## Verification

Passed so far:

- Focused .NET SDK connector-route test.
- Focused integration connector-route test.
- TypeScript SDK tests.
- TypeScript SDK build.
- `dotnet restore .\KynticAI.Scout.slnx`.
- `dotnet build .\KynticAI.Scout.slnx` with 0 warnings and 0 errors.
- Unit tests: 86 passed.
- SDK tests: 13 passed.
- V1 REST integration test filter: 6 passed.
- `git diff --check` with LF-to-CRLF working-copy warnings only.
- WP3 `status.json` parse validation.

One command mistake was recorded:

- `npm test -- --runInBand` failed because Vitest does not support Jest's `--runInBand` option. It was rerun as `npm test` and passed.

Final broader local verification is recorded in `status.json`.

## Data Boundary

The change is local-only. It does not call Cloud, does not add Cloud configuration, and does not add customer-data upload paths. Docker quick start and existing n8n/source-system event routes continue to use the existing local API route.

## Remaining Direct Paths

- `SqlConnectorPlugin` direct reads remain for selector-time compatibility.
- `MockConnectorPlugin` signal-backed direct local reads remain for mock/local compatibility.
- Application service and recompute processor EF writes remain the owned local persistence path.
- No connector-owned source-ingestion direct write path was added or left as the preferred path.

## Recommended Next Prompt

Implement the Scout operator migration CLI wrapper around `ILocalDataPlaneStorageAdapter.ExportAsync()` with dry-run, export, checkpoint resume, local validation reports, batch files, typed exit codes, and deterministic local upgrade simulation evidence. Keep Cloud out of the data plane and keep Enterprise/Fortress import behind the private local contract.
