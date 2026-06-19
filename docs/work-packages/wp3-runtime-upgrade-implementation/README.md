# WP3 Runtime Upgrade Implementation

This work package records Scout/open-core implementation work after WP2 plus the private Enterprise/Fortress import-side contract summary needed for the Scout migration path. The focus is practical local runtime upgrade groundwork that keeps Scout as the customer-owned data plane, keeps Cloud out of customer data movement, and avoids adding private Enterprise/Fortress internals to the public repo.

## Scope

- Implement small, public-safe runtime changes that move connector ingestion toward local Scout API boundaries.
- Refine the public local storage adapter boundary so Scout remains on its safe default while private Enterprise/Fortress adapters can be selected later by local configuration.
- Implement or record private Enterprise/Fortress import-side contracts in the Enterprise repo when the work belongs behind the paid/private boundary.
- Add Scout-side local migration export and validation tooling that operators can run before moving to Elite/Fortress.
- Preserve existing Docker quick start, mock/local connectors, SDK compatibility, and event webhook routes.
- Keep customer payloads inside the local Scout/Fortress customer-owned environment.
- Record code files changed, API routes used or added, connector/storage/import changes, tests, commands, results, and remaining direct paths.

## Current Status

Step `10-final-review` is the latest recorded step. It closes WP3 with a final evidence pack, investor-safe summary, customer-safe summary, next-work-package list, data-boundary review, repo-boundary review, and commit-readiness review across Scout/open-core, Cloud/control plane, and Enterprise/Fortress.

The final verdict is that WP3 is a real, tested runtime-upgrade foundation, not a production SaaS release. Scout/open-core is ready for the final evidence-pack commit after final validation. Enterprise/Fortress is clean with the import-contract batch present, subject to xhigh review before release, pilot, or investor-visible Rust/vector claims. Cloud WP3 compatibility commits are present and focused validation passed, but the current Cloud working tree has unrelated brand/AGENTS changes and should not be committed as WP3.

Step `09-end-to-end-runtime-simulation` verifies local Scout startup, registered-connector ingestion, local SQLite storage, migration dry run, full local export package generation, Enterprise/Fortress package contract validation, and optional Cloud entitlement checks using safe metadata only.

Earlier steps remain implemented and recorded: `04-scout-migration-export` in Scout/open-core, `05-enterprise-import-contract` in the Enterprise/Fortress repo, and `06-scout-cloud-licence-client` for the disabled-by-default Scout Cloud licence/entitlement client.

Scout now has an additive registered-connector ingestion route:

```text
POST /api/v1/connectors/{dataSourceId}/events/source-system?tenantSlug=<tenant>
```

The route delegates to the existing local source-system event ingestion service and binds accepted events/signals to the registered data source. Existing `/api/v1/events/source-system?tenantSlug=<tenant>` callers remain compatible.

Scout also now has a configured local storage adapter resolver. The resolver keeps `StorageAdapter:Provider=scout-postgres` as the default, returns the current Scout relational adapter by default, and can select a registered private `enterprise-runtime` adapter later without connector rewrites. If a private provider is configured but not registered, Scout fails closed locally.

Scout now has a local migration export CLI:

```text
dotnet run --project tools/KynticAI.Scout.MigrationTool -- export --tenant <tenant-slug> --out <local-folder> [options]
```

It supports dry runs, package generation, validation reports, tenant/context metadata, source events, signals, selectors, relationship inputs where Scout has them, provenance, and audit events. It rejects Cloud upload options and records explicit exclusions for connector credentials, webhook secrets, API key material, data-source connection config, source-event headers, key-ring files, environment files, licence/private key/certificate files, and Cloud staging locations.

Enterprise/Fortress now has a package-level Scout migration import contract in `ucl-vector`. It validates `kynticai.scout.storage-portable-export.v1` batches, rejects Cloud data-plane packages and cross-tenant anchors, prepares deterministic Fortress import records, and can build the existing LanceDB import batch only after a private/local embedding provider supplies dense embeddings.

Cloud now emits new signed licence downloads in the Scout-compatible `Scout-LICENCE-v1` envelope with `Scout-` licence keys, while preserving verification compatibility for previous `UCL-LICENCE-v1` envelopes. The existing licence status, validation, account entitlement, deployment registration, and heartbeat routes expose the optional runtime-check metadata Scout needs without moving customer data to Cloud. Data-plane heartbeat/status responses now include parsed `lastSafeUsageSummary` aggregate counters beside the existing `lastUsageSummaryJson` compatibility field, and the API-key hash remains excluded from JSON.

Cloud now also has hosted REST regression coverage proving `GET /api/v1/licences/{licenceKey}/status` and `GET /api/v1/accounts/{accountId}/entitlements` expose the canonical Scout/Fortress/Elite shape over the real API route and avoid raw customer payload or derived intelligence markers.

Scout now has `IControlPlaneEntitlementClient` and `CloudControlPlaneEntitlementClient` for optional Cloud checks. The default config keeps `ControlPlane:Enabled=false`; when enabled and called, the client performs a metadata-only licence status check, maps Cloud canonical tiers to Scout/Fortress/Elite decisions, accepts Cloud grace status, fails closed for paid capabilities when Cloud is unavailable, and never returns raw licence keys.

The end-to-end local runtime simulation found and fixed a serious migration export performance issue. Scout was rebuilding the full portable export set once per package page; the adapter now builds one export snapshot and yields all pages from that snapshot. The fixed full seeded local package exported `109693` records in `110` batches in `72.95s`, with `isValid=true` and `usesCloudDataPlane=false`. Enterprise/Fortress validation of that exact package passed in `59.22s`.

The simulation also fixed portable export compatibility gaps for Enterprise/Fortress import preparation: SQLite-materialised timestamps are normalised to UTC, and `user_signal`, `selector_execution`, and `context_fact` records now include usable local provenance references when source provenance is nested or event-shaped.

The smoke pass fixed stale Playwright e2e assertions for current UI copy in the agent playground and selector builder tests. No API, database, Docker Compose, Cloud entitlement, storage adapter, migration tool, or connector runtime code needed changes.

## File Index

| File | Purpose |
| --- | --- |
| `02-connector-local-api-routing.md` | Implementation evidence for the registered-connector local API ingestion route. |
| `03-storage-adapter-boundary.md` | Implementation evidence for the configured local storage adapter resolver and safe Scout default. |
| `04-scout-migration-export.md` | Implementation evidence for Scout-side local migration export, dry-run validation, export package format, exclusions, tests, and CLI proof. |
| `05-enterprise-import-contract.md` | Enterprise/Fortress import-side contract summary for Scout migration packages. |
| `06-scout-cloud-licence-client.md` | Scout-side optional Cloud licence/entitlement client implementation evidence, config, metadata boundary, tests, and results. |
| `07-cloud-entitlement-compatibility.md` | Cloud compatibility evidence for optional Scout runtime licence/entitlement checks, response shape, tests, and boundary checks. |
| `08-docker-startup-smoke-test.md` | Fresh Docker/PostgreSQL startup smoke-test evidence, URLs, ingestion checks, migration dry run, UI/browser proof, fixes, and blockers. |
| `09-end-to-end-runtime-simulation.md` | Local runtime simulation evidence, API calls, storage proof, fixed full export timing, Enterprise/Fortress validation, Cloud boundary verification, fixes, and blockers. |
| `10-final-review.md` | Final WP3 evidence pack and commit-readiness review across Scout, Cloud, and Enterprise/Fortress. |
| `investor-summary.md` | Investor-safe WP3 summary with claim boundaries and evidence highlights. |
| `customer-safe-summary.md` | Customer-safe WP3 summary focused on data boundaries and practical readiness. |
| `next-work-packages.md` | Recommended next work packages after WP3. |
| `handoff.md` | Summary, verification, open risks, and recommended next prompt. |
| `status.json` | Machine-readable WP3 status and verification record. |

## Boundary Commitments

- Customer data remains in the local Scout/Fortress data plane.
- No customer data goes to Cloud.
- The public repo does not gain Enterprise/Fortress private runtime internals.
- The default local storage provider remains `scout-postgres`; vector writes remain disabled unless a private local adapter is registered and configured.
- Enterprise/Fortress package validation lives in the private repo and does not make UCL depend on private packages.
- Scout migration export writes local files only and has no Cloud upload path.
- Scout migration export fails closed when selected adapters report Cloud data-plane use or unsafe credential-looking JSON keys.
- Existing Docker quick start and existing mock/local connectors remain compatible.
- Direct selector-time reads remain documented compatibility paths, not connector-owned direct ingestion writes.
- Optional Cloud runtime checks use commercial/control-plane metadata only: licence status, entitlement tier, deployment registration, heartbeat health, and aggregate counters.
- The Scout Cloud licence client is disabled by default and sends no customer raw data or derived intelligence.

## Recommended Next Prompt

Build the production Enterprise/Fortress importer CLI/API for validated Scout export folders, then rerun the fast full local package export and import it into a local private runtime target with xhigh review gates. Keep the Cloud analytics/test blocker and Docker npm audit triage separate from the WP3 final evidence-pack commit.
