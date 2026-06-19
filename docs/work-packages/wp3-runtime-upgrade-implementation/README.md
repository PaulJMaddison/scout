# WP3 Runtime Upgrade Implementation

This work package records Scout/open-core implementation work after WP2. The focus is practical local runtime upgrade groundwork that keeps Scout as the customer-owned data plane, keeps Cloud out of customer data movement, and avoids adding private Enterprise/Fortress internals to the public repo.

## Scope

- Implement small, public-safe runtime changes that move connector ingestion toward local Scout API boundaries.
- Refine the public local storage adapter boundary so Scout remains on its safe default while private Enterprise/Fortress adapters can be selected later by local configuration.
- Preserve existing Docker quick start, mock/local connectors, SDK compatibility, and event webhook routes.
- Keep customer payloads inside the local Scout environment.
- Record code files changed, API routes used or added, connector/storage changes, tests, commands, results, and remaining direct paths.

## Current Status

Step `03-storage-adapter-boundary` is implemented.

Scout now has an additive registered-connector ingestion route:

```text
POST /api/v1/connectors/{dataSourceId}/events/source-system?tenantSlug=<tenant>
```

The route delegates to the existing local source-system event ingestion service and binds accepted events/signals to the registered data source. Existing `/api/v1/events/source-system?tenantSlug=<tenant>` callers remain compatible.

Scout also now has a configured local storage adapter resolver. The resolver keeps `StorageAdapter:Provider=scout-postgres` as the default, returns the current Scout relational adapter by default, and can select a registered private `enterprise-runtime` adapter later without connector rewrites. If a private provider is configured but not registered, Scout fails closed locally.

## File Index

| File | Purpose |
| --- | --- |
| `02-connector-local-api-routing.md` | Implementation evidence for the registered-connector local API ingestion route. |
| `03-storage-adapter-boundary.md` | Implementation evidence for the configured local storage adapter resolver and safe Scout default. |
| `handoff.md` | Summary, verification, open risks, and recommended next prompt. |
| `status.json` | Machine-readable WP3 status and verification record. |

## Boundary Commitments

- Customer data remains in the local Scout data plane.
- No customer data goes to Cloud.
- The public repo does not gain Enterprise/Fortress private runtime internals.
- The default local storage provider remains `scout-postgres`; vector writes remain disabled unless a private local adapter is registered and configured.
- Existing Docker quick start and existing mock/local connectors remain compatible.
- Direct selector-time reads remain documented compatibility paths, not connector-owned direct ingestion writes.

## Recommended Next Prompt

Implement the Scout operator migration CLI wrapper around `ILocalDataPlaneStorageAdapter.ExportAsync()` with dry-run, real export, checkpoint resume, local reports, typed exit codes, and deterministic local upgrade simulation evidence. Keep Cloud out of the data plane.
