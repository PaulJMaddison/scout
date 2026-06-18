# WP2 Upgrade And LanceDB Migration

This work package records the discovery, architecture design, connector-routing implementation, storage-adapter boundary, Scout-side migration export/validation contract, Enterprise/Fortress LanceDB import contract, Cloud entitlement/onboarding alignment, and local/dev end-to-end simulation for the upgrade path from KynticAI Scout to Elite/Fortress, with a focus on storage, connector routing, local ingestion, LanceDB/vector expectations, Cloud entitlement touchpoints, data-boundary guarantees, and likely breakage during migration.

## Scope

- Discover how KynticAI Scout currently stores source events, selector executions, context facts, provenance, relationships, signals, and demo/customer operational records.
- Discover how connectors currently fetch or write data, and whether connector traffic already routes through the local API.
- Discover what Enterprise/Fortress expects for local vector storage, LanceDB, pgvector, relationship sets, attribution paths, outcomes, and governed JSON handoff.
- Discover what Cloud already provides for licence, entitlement, download/update, data-plane registration, heartbeat, and Fortress instance metadata checks.
- Design the canonical local upgrade architecture that keeps Scout as the customer-owned Docker data plane, routes connector writes through local APIs where practical, and lets storage switch to Enterprise/Fortress LanceDB/vector DB without connector rewrites.
- Realign practical connector ingestion paths to the current local Scout API where a stale route is found.
- Document the Cloud-side signup/onboarding path for upgrading a Scout user to Fortress or Elite without moving Scout data or derived intelligence into Cloud.
- Record upgrade and migration risks. The first two artefacts made no code, schema, API, package, deployment, or runtime changes. The third artefact made a scoped TypeScript n8n package route update only. The fourth artefact added a public storage adapter contract and safe Scout default without adding LanceDB, pgvector schema, private runtime code, or Cloud data movement. The fifth artefact implements Scout-side relational export/dry-run validation and specifies the private Enterprise/Fortress import contract without faking the importer. The sixth artefact implements and documents the private Enterprise/Fortress LanceDB import validation/mapping contract. The seventh artefact documents the Cloud upgrade entitlement/onboarding flow and confirms Cloud remains commercial/control-plane metadata only. The eighth artefact records the local/dev upgrade simulation, what passed, what failed, data-boundary evidence, and remaining blockers.

## Repos Involved

| Area | Repo | Local folder |
| --- | --- | --- |
| Scout/open-core | `UCL` | `C:\Kyntic\UCL` |
| Enterprise/Fortress | `universalcontextlayer-enterprise` | `C:\Kyntic\universalcontextlayer-enterprise` |
| Cloud/control plane | `universalcontextlayer-cloud` | `C:\Kyntic\universalcontextlayer-cloud` |
| Naming source of truth | KynticAI docs | `C:\Kyntic\docs\source-of-truth-naming-map.md` |

## Canonical Product Boundaries

- KynticAI Scout is the public/open-core, customer-owned data-plane product. It owns public ingestion, selector execution, local context facts, provenance, audit, safe connector abstractions, and public fallback intelligence.
- Enterprise/Fortress is the private paid extension path. It owns proprietary relationship-set analysis, attribution paths, comparable examples, governed JSON handoff, private connector/runtime packages, and the Rust engine/vector DB boundary.
- Elite is the operator-assisted strategic product on top of Fortress. It can add reviewed outcome loops and private/local model/operator packs, while raw customer data remains in the customer-owned data plane.
- Cloud is the optional commercial/control-plane layer. It owns accounts, subscriptions, licences, entitlements, private artefact metadata, downloads/update checks, data-plane registration, heartbeat, support metadata, and aggregate-only usage metadata.
- Cloud must not receive raw customer data, connector output, vectors, context facts, prompt packages, derived relationship intelligence, relationship sets, attribution paths, or private ranking details by default.
- Clarity and Importance are separate KynticAI products and are not required dependencies for Scout, Enterprise/Fortress, Cloud, or Elite.

## File Index

| File | Purpose |
| --- | --- |
| `README.md` | Work-package scope, repos, canonical boundaries, and artefact index. |
| `01-discovery-audit.md` | Read-only discovery audit of Scout storage, connector routing, API ingestion, Enterprise/Fortress vector expectations, Cloud entitlements, and upgrade/migration risks. |
| `02-upgrade-architecture.md` | Canonical Scout to Elite/Fortress upgrade architecture, connector routing principle, local API/storage abstraction requirements, Cloud entitlement role, rollback plan, data-boundary guarantees, and implementation tasks. |
| `03-local-api-connector-routing.md` | Connector ingestion audit and scoped implementation realigning the older `scout-n8n-node` package to `POST /api/v1/events/source-system?tenantSlug=<tenant>`. |
| `04-storage-adapter-boundary.md` | Public local storage adapter contracts, safe Scout `scout-postgres` default, Enterprise/Fortress LanceDB/vector expectations, migration/export/import requirements, config flags, tests, commands, and results. |
| `05-migration-export-import.md` | Scout-side relational export format, Enterprise/Fortress import contract, API/CLI entrypoints, dry-run behaviour, validation checks, failure modes, rollback guidance, tests, commands, results, and remaining private importer blockers. |
| `06-enterprise-lancedb-import-contract.md` | Enterprise/Fortress side of the LanceDB/vector DB import contract, required Scout export fields, validation rules, data-boundary guarantees, tests, commands, results, and remaining private importer gaps. |
| `07-cloud-upgrade-entitlement-flow.md` | Cloud-side Scout to Fortress/Elite signup and onboarding states, entitlement changes, download/update-channel changes, customer steps, data-boundary guarantees, tests, commands, results, and remaining gaps. |
| `08-end-to-end-upgrade-simulation.md` | Local/dev upgrade simulation covering fresh Scout SQLite bootstrap, API ingestion proof through deterministic tests, Scout export dry-run proof, Enterprise/Fortress import contract validation, Cloud metadata-only entitlement guard, data-boundary verification, rollback/retry path, and remaining blockers. |
| `handoff.md` | Summary, findings, decisions, open questions, and recommended next prompt. |
| `status.json` | Machine-readable current step, related repos, completed steps, open risks, and next prompt. |
