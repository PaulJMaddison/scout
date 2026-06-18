# 01 Discovery Audit

Date: 2026-06-18

Mode: read-only discovery. No code, schema, API, package, deployment, or runtime changes were made.

Evidence base:

- `C:\Kyntic\docs\source-of-truth-naming-map.md`
- Scout/open-core repo: `C:\Kyntic\UCL`
- Enterprise/Fortress repo: `C:\Kyntic\universalcontextlayer-enterprise`
- Cloud/control-plane repo: `C:\Kyntic\universalcontextlayer-cloud`

## Scout Storage Map

Scout persistence is EF Core over `ScoutDbContext` and `CustomerOpsDbContext`. `src/KynticAI.Scout.Infrastructure/Persistence/DatabaseProviderConfigurator.cs` resolves SQLite for local demo-style connection strings and PostgreSQL otherwise. Hosted/production configuration is PostgreSQL-oriented, but the open-core repo does not define pgvector or LanceDB storage in Scout itself.

Primary Scout context:

| Storage area | Tables/entities | Notes |
| --- | --- | --- |
| Tenancy and users | `tenants`, `user_profiles`, `operator_accounts` | Tenant/user/operator identity for local data-plane work. |
| Source definitions | `data_sources`, `connector_credentials`, `semantic_attribute_definitions`, `selector_definitions` | Connector configuration, credential references, semantic attributes, selector definitions, and selector trigger metadata. |
| Event ingestion | `source_system_events`, `user_signals` | Source-system events and derived user-signal rows. `source_system_events` stores payload JSON and status. `user_signals` stores signal value JSON and provenance JSON. |
| Selector/recompute pipeline | `selector_executions`, `recompute_jobs` | Selector execution result JSON, provenance JSON, raw source data JSON, pipeline trace JSON, recompute status, and queue/audit metadata. |
| Context materialisation | `context_snapshots`, `context_facts` | Current/stale context snapshots and materialised facts. `context_facts` stores value JSON, provenance JSON, confidence/freshness, expiry, and review status. |
| Provenance/audit | `provenance_metadata`, `audit_events` | `provenance_metadata` links selector executions/context facts to source systems, source records, evidence JSON, and observed timestamps. `audit_events` records data-plane actions. |
| Agent/demo support | `prompt_templates`, `agent_runs` | Public admin/demo surfaces and prompt/agent run tracking. |
| SaaS/admin metadata | `saas_workspaces`, `saas_workspace_members`, `saas_tenant_subscriptions`, `saas_billing_plans`, `saas_billing_plan_limits`, `saas_api_clients`, `saas_webhook_signing_secrets`, `saas_connector_installations`, `saas_connector_catalogue_entries`, `saas_context_packages`, `saas_billing_usage_records`, `saas_onboarding_states`, `saas_onboarding_applications`, `saas_blueprint_imports`, `saas_pii_rules`, `saas_audit_policies` | Public-safe admin, usage, API-client, connector catalogue/install, onboarding, blueprint, and governance metadata. |

CustomerOps context:

| Storage area | Tables/entities | Notes |
| --- | --- | --- |
| Demo/customer operational records | `customer_ops_tenants`, `accounts`, `contacts`, `users`, `products`, `plans`, `subscriptions`, `opportunities`, `sales_activities`, `email_engagement_events`, `support_tickets`, `product_usage_summaries`, `billing_metrics`, `web_conversion_events`, `customer_contact_signals`, `customer_email_signals`, `customer_context_rollups` | These are current local/demo B2B operational tables, not a general canonical exact-data item store for Enterprise/Fortress. |

Where requested concepts are stored today:

| Concept | Current Scout storage |
| --- | --- |
| Ingestion events | `source_system_events` plus `audit_events`; status includes received/processed/ignored/failed/dead-lettered paths. |
| Signals | `user_signals` for event-derived signal values and provenance; next-action weighted signals are runtime result objects, not first-class tables. |
| Selectors | `selector_definitions`; execution attempts and outputs in `selector_executions`; recompute orchestration in `recompute_jobs`. |
| Context facts | `context_snapshots` and `context_facts`. |
| Provenance | JSON fields on source events, user signals, selector executions, context facts, plus `provenance_metadata`. |
| Relationships | Public fallback relationship records are runtime/domain result shapes and evidence-pack contract artefacts. They are not persisted as canonical relationship-set tables in Scout. |
| Relationship sets, attribution paths, outcomes | Contract/sample shapes exist under Scout tests/docs/contracts, but Scout does not currently persist them as native tables. |
| Vectors/embeddings | No Scout EF vector table, pgvector column, LanceDB store, or embedding pipeline was found. Public evidence-pack validators deliberately reject embedding/vector payload families. |

Implication: Scout currently stores event payloads, user-level signals, selector outputs, context facts, provenance, and demo operational data. It does not yet store the exact data item, relationship set, attribution path, outcome, and vector/index model that Enterprise/Fortress expects as the richer local analysis substrate.

## Connector Routing Map

There are two different connector/data paths in Scout today.

API-routed ingestion:

- The .NET SDK sends source-system events to `POST /api/v1/events/source-system`.
- The TypeScript SDK sends source-system events to `POST /api/v1/events/source-system`.
- `packages/typescript/n8n-node` builds the same `/api/v1/events/source-system` URL and sends API-client headers.
- The API validates actor scope and, for API-key/webhook actors, validates the Scout webhook signature headers before accepting events.

In-process selector connector execution:

- `src/KynticAI.Scout.Application/Selectors/SelectorExecutionEngine.cs` resolves the configured connector plugin from `DataSource.ConnectionConfigJson`, resolves credentials, calls `connector.FetchAsync`, applies selector rules/transforms, and writes selector execution outputs.
- The built-in generic connector plugins are fetch-oriented. `SqlConnectorPlugin`, `RestApiConnectorPlugin`, `CsvUploadConnectorPlugin`, and `InMemoryInventoryConnectorPlugin` return payload/provenance to the selector engine; they do not write source records into Scout through the local REST API.
- `SqlConnectorPlugin` can read the current Scout database, the CustomerOps database, or an external PostgreSQL database. That means connector data access can be direct/in-process rather than always API-routed.
- `IConnectorPlugin` and `ConnectorContractRules.ValidateIngestEvent` define a connector ingest event shape and validation rules, but discovery did not find a corresponding persisted local API route that writes connector events through that contract.

Potential stale connector route:

- `packages/typescript/scout-n8n-node` posts to an older `/api/tenants/{tenantSlug}/events/source` route. Discovery did not find that route in the current API. If this package is still used, it will break ingestion until it is retired or realigned with `/api/v1/events/source-system`.

Conclusion: SDK/event ingestion already routes through the local API. Selector-time connector fetches do not. They run in process and usually read from source systems or local demo stores, then selector/recompute code writes Scout facts.

## API Ingestion Map

The current public ingestion path is `POST /api/v1/events/source-system` in `src/KynticAI.Scout.Api/Rest/VersionedRestEndpointRouteBuilderExtensions.cs`.

High-level flow in `KynticAI.ScoutService.IngestSourceSystemEventAsync`:

1. Validate the source-system event input.
2. Resolve tenant, workspace, current actor, source system, event type, event ID, and observed timestamp.
3. Deduplicate by tenant, source system, and event ID.
4. Enforce the source-event billing limit.
5. Resolve the target user by external user/account routing keys.
6. Resolve the data source by source-system name.
7. Create `SourceSystemEvent` with payload JSON, header/actor JSON, correlation ID, status, and observed timestamp.
8. Add a `source-system.event.received` audit event and usage metering record.
9. If the event is `source_record.deleted`, mark it ignored and do not recompute selectors automatically.
10. If no user is resolved, mark the event failed and dead-lettered, with audit metadata.
11. If a user is resolved, create one `UserSignal` keyed as `{sourceSystem}.{eventType}` with payload JSON and provenance JSON.
12. Match published selectors by data source/source-system/event trigger.
13. If no selectors match, mark the event processed without recompute.
14. If selectors match, create `SelectorExecution` rows, create a `RecomputeJob`, mark the event processed, save, and enqueue `ContextRecomputeRequest`.

Recompute/materialisation flow in `ContextRecomputeProcessor`:

- Loads pending selector executions for the correlation ID.
- Runs selector execution against the connector plugin path.
- Stores selector execution result JSON, provenance JSON, raw source data JSON, and pipeline trace JSON.
- Writes `ProvenanceMetadata` for selector executions.
- Resolves candidate facts by confidence/priority/observation timing.
- Marks old snapshots stale, creates a new `ContextSnapshot`, creates `ContextFact` rows, and writes context-fact provenance metadata.
- Emits audit events for recompute completion/failure.

This path is useful for Scout context facts and auditability. It is not yet an Elite/Fortress upgrade pipeline because it does not persist canonical exact data items, relationship sets, attribution paths, historical outcome events, or vector records as first-class local data-plane assets.

## Enterprise/Fortress Storage Expectations

Enterprise/Fortress expects a richer local data-plane substrate than Scout currently persists.

Vector and LanceDB expectations:

- `engine/crates/ucl-vector` owns the LanceDB-backed vector storage boundary.
- Default vector configuration uses a local storage path like `data/vector-store` and a default table name like `ucl_vectors`.
- The canonical LanceDB/Arrow vector schema contains:
  - `id`
  - `entity_type`
  - `postgres_pk`
  - `layer`
  - `embedding`
  - `metadata_json`
  - `created_at`
  - `updated_at`
- Embeddings are dense `Float32` vectors with the current default dimension of 384.
- Vectors are anchored back to relational/local source identity through `postgres_pk`, `entity_type`, and `layer`.
- `UclEntity` carries `id`, `entity_type`, `postgres_pk`, `layer`, attributes, metadata, and timestamps. CDC-style entities can be created from attributes, but callers must set `postgres_pk` and `layer` before vector storage has a stable relational anchor.
- `ucl-embed` generates 384-dimension embeddings through a local ONNX model/tokenizer path. It is local-process work and does not call external embedding APIs.

Pipeline expectations:

- The Rust pipeline normalises source events, applies a tenant/context filter, embeds entities, writes vectors, then synthesises governed local output.
- Vector writes have retry/dead-letter handling. Dead-letter output is metadata-only and local.
- `CompositeVectorWriter` can fan writes to multiple targets. It succeeds when at least one target writes successfully, and errors when all targets fail or no target exists.
- LanceDB writes require a dense embedding. Null-embedding requests are skipped for LanceDB rather than faked.
- The pgvector target is currently a placeholder write target in the private vector write seam. It documents the future requirements for a PostgreSQL client/pool and the `entity_embeddings` table.

PostgreSQL/pgvector expectations:

- Enterprise/Fortress includes a migration for an `entity_embeddings` companion table with tenant, entity type, source Postgres primary key, layer, nullable `vector(384)` embedding, metadata JSON, and timestamps.
- The Enterprise/Fortress Docker Postgres init path enables the `vector` extension on both the context-layer and customer-ops databases.
- This pgvector lane is a fallback/dual-write expectation, not proof that Scout already has pgvector storage.

Relationship-analysis expectations:

- `engine/crates/ucl-core/src/relationship_analysis.rs` defines the local analysis input shape around data items, relationship edges, attribution paths, relationship sets, outcome events, and tenant-scoped relationship queries.
- The Enterprise/Fortress analysis boundary rejects Cloud aggregate-only payloads as insufficient.
- Relationship sets and index records are expected to be egress-safe and citation/provenance backed.
- `engine/crates/ucl-vector/src/relationship_set_index.rs` converts relationship-set index records into vector-ready scored entities, using the relationship set ID as the source primary-key anchor and tenant as the layer.
- The Scout evidence adapter maps Scout exact linked records and weighted signals into `UclEntity`/context items, but this is an adapter over evidence artefacts, not a Scout-native persisted relationship-set/vector model.

Known partial/proof limits:

- Enterprise/Fortress has an ASP.NET vector search provider boundary for LanceDB and pgvector, but both live provider paths are marked unproven/partial until backed by a running data-plane/native store proof.
- pgvector write integration is a documented placeholder, not a completed live write target.
- Model assets, native LanceDB dependencies, PostgreSQL/pgvector, and live/vector search proof are explicit opt-in proof paths, not routine local checks.

## Cloud Entitlement Touchpoints

Cloud already provides the commercial/control-plane pieces needed to gate access to private packages and runtime metadata, while keeping raw customer data out of Cloud.

Canonical tier compatibility:

- `ProductTierCompatibility` defines canonical tiers `Scout`, `Fortress`, and `Elite`.
- Legacy plan codes remain compatibility aliases: `Free`/`Pro` map to Scout, `Business`/`Enterprise` map to Fortress, and `PrivateCloud` maps to Elite.
- Entitlement checks use tier-rank compatibility, so higher canonical tiers can satisfy lower required tiers.

Licence and entitlement API:

- REST endpoints include account licence list/create, account entitlements, licence status/validate, licence revoke, and licence download.
- GraphQL exposes equivalent licence, entitlement, and validation touchpoints.
- `LicenceService` can create signed licence JSON, validate licence status/signature, resolve account entitlements from an active/grace signed licence or an active/trial subscription, revoke a licence, and return signed licence JSON.

Licensing heartbeat:

- `POST /api/v1/licensing/heartbeat` processes licence heartbeat without raw customer payloads.
- Heartbeat logic compares subscription canonical tier against licence entitlements, applies offline grace handling, returns safe config update metadata, persists heartbeat records, and updates linked Fortress instance metadata.

Data-plane registration and heartbeat:

- Cloud supports registration-token creation, anonymous data-plane registration with public deployment metadata, and authenticated data-plane heartbeat.
- Heartbeat accepts deployment version, health status, and allowlisted aggregate `safeUsageSummary` counters only.
- The Cloud data boundary rejects raw operational fields, credentials, connector data, and derived intelligence payload families.

Download/update entitlement:

- Cloud stores download artefact metadata, entitled plans, release/update notes, object keys, and update channel metadata.
- Download metadata, download requests, signed URL generation, and update checks are filtered through current account entitlements.
- Signed URL generation requires an artefact storage provider to be configured; object-store/live signed fetch proof remains a deployment/proof concern.

Fortress instance metadata:

- Cloud stores `FortressInstance` metadata linked to account, licence, and optionally data-plane installation.
- Stored fields are operational metadata such as hosting model, status, health, deployment region, Fortress version, update channel, config version, desired safe config JSON, and heartbeat timestamps.
- Fortress instance operations queue safe policy/config update metadata and audit the action. They do not store raw source records, vectors, relationship sets, attribution paths, connector output, or derived customer intelligence.

Conclusion: Cloud can gate the upgrade commercially and operationally through licences, entitlements, downloads, update channels, deployment registration, heartbeat, and Fortress instance metadata. Cloud does not provide local data/vector migration and must not be used as a staging area for raw Scout data, evidence packs, vectors, or relationship intelligence.

## Upgrade Risks

1. Scout has no native vector store. Enterprise/Fortress expects LanceDB vector rows anchored by stable `postgres_pk`, `entity_type`, and `layer`, with 384-dimension embeddings.
2. Scout has no native exact data item, relationship set, attribution path, or outcome-event persistence model. Enterprise/Fortress relationship analysis expects those concepts as local inputs.
3. CustomerOps tables are demo/B2B-shaped operational tables. They are useful discovery evidence but should not be treated as the durable canonical data-item schema for all customers/domains.
4. Selector connectors are in-process fetchers, not a local API-routed write path for canonical source records. Upgrading connector writes will need a public/private routing decision.
5. The event ingestion API stores `SourceSystemEvent` and `UserSignal` rows, then maybe selector executions and facts. It does not write full operational source records or relationship sets.
6. The older `packages/typescript/scout-n8n-node` route appears stale and may break ingestion if users still depend on it.
7. Scout's next-action relationship intelligence is fallback/proof-mode. It declares Enterprise/Fortress as the canonical owner of relationship weighting/traversal and does not call a live Fortress engine.
8. Scout evidence-pack and data-item attribution contracts are designed to avoid leaking derived relationship intelligence and vectors. A migration must not bypass those boundaries.
9. Enterprise/Fortress LanceDB and pgvector live search/write paths are partially proven or placeholder in several seams. Treat live vector proof as a separate opt-in validation step.
10. pgvector dual-write is not a Scout capability today. Enabling it requires Enterprise/Fortress migration and database extension prerequisites.
11. Vector backfill needs deterministic ID mapping. Existing Scout IDs include source event IDs, signal IDs, selector execution IDs, context fact IDs, and demo operational IDs, but no single canonical data-item ID strategy is established.
12. Replay/backfill through the existing Scout ingestion endpoint could trigger billing limits, duplicate checks, selector side effects, recompute jobs, audit noise, and changed fact freshness.
13. Cloud can grant access to private packages and config, but cannot bridge missing local data-plane storage. Treat entitlement success as necessary but not sufficient for upgrade readiness.
14. Cloud still has legacy plan-code compatibility surfaces. Any Elite/Fortress upgrade UX must be careful about canonical tier labels versus stored compatibility aliases.

## Migration Risks

1. Backfilling from `source_system_events` and `user_signals` may not reconstruct exact operational records, relationship edges, or historical outcomes with enough fidelity for Enterprise/Fortress analysis.
2. Backfilling from CustomerOps demo tables may overfit the migration to B2B sales/support concepts instead of the general Scout data-plane contract.
3. Backfilling from `context_facts` may lose raw source context and produce derived facts where Enterprise/Fortress expects citation-backed source data items.
4. A dual-write migration must define whether Scout remains source of truth for events/facts while Fortress owns vectors/relationship sets, or whether private Enterprise/Fortress tables become the richer local source of truth.
5. Tenant/workspace/user mapping must be normalised into the Enterprise/Fortress `layer` and tenant fields before vector writes. Cross-tenant leakage would be a serious security defect.
6. Dense embeddings may be unavailable during first upgrade if ONNX model assets, tokenizer files, native dependencies, or LanceDB are missing. Null embeddings are tolerated by some write seams but skipped by LanceDB.
7. LanceDB upsert/retry/dead-letter behaviour must be made resumable and auditable for upgrade backfills.
8. pgvector fallback requires PostgreSQL extension availability and the `entity_embeddings` companion table. Managed database extension enablement may require operator action.
9. The migration must preserve provenance IDs, citation IDs, masking decisions, and governance context so vectors and governed JSON can be traced without exposing raw values outside the data plane.
10. Existing selector recompute and audit flows may need a quiet/backfill mode to avoid confusing normal operational telemetry with migration activity.
11. Private package download/update entitlement must be checked before installing Fortress/Elite runtime pieces, but raw migration state must stay local.
12. Rollback needs clear separation between Scout public tables, private Fortress tables/vector store, and Cloud metadata. Cloud licence rollback must not delete local customer data.
13. Public Scout docs must not describe Enterprise-only implementation details as open-core features. Any outward-facing wording from this work package needs a public-safety review before release.

## Discovery Outcome

The upgrade path is not a simple "turn on LanceDB" switch. Scout already has useful local ingestion, selector, context, provenance, audit, SDK, and admin surfaces, but Enterprise/Fortress expects a richer local data-item and relationship-analysis substrate plus vector indexing. Cloud can authorise and distribute private runtime capability, but it deliberately does not and should not hold the local data needed for migration.

Recommended next step: design the migration contract and adapter plan before code changes. The plan should define canonical local data items, relationship sets, attribution paths, outcome events, vector ID/layer mapping, connector write routing, backfill/replay rules, entitlement gates, and proof criteria for LanceDB/pgvector.
