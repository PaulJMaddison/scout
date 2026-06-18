# Cloud Commercial Control Contract

KynticAI Scout is the public/open-core UCL data plane. KynticAI Cloud is the optional commercial/control-plane layer that manages account, licence, entitlement, download, support, update, registration, and aggregate usage metadata for paid/private deployments.

This document aligns the public Scout repo with the Cloud WP1 control-plane contract in `C:\Kyntic\universalcontextlayer-cloud\docs\work-packages\wp1-cloud-control-plane\`.

## Boundary Summary

Scout remains useful without Cloud. The Docker quick start and customer-owned deployments run the data plane locally or inside the customer's infrastructure. PostgreSQL, SQLite demo data, Data Protection keys, connector configuration, selectors, exact data items, relationships, attribution paths, context snapshots, governed JSON packages, local audit, and customer API access stay in that customer-controlled data plane by default.

Cloud is commercial control. It may manage:

- account and user metadata for the commercial relationship;
- subscription, licence, entitlement, and update-channel metadata;
- private download/package metadata and signed object references where configured;
- data-plane registration tokens, installation IDs, safe health status, and deployment version metadata;
- support case metadata and approved support text;
- aggregate usage counters from an explicit allowlist;
- audit events for licence, entitlement, download, update, support, and account operations.

Cloud is not the Scout runtime, not the customer data plane, and not a raw operational data store.

## Scout Local Docker And Customer-Owned Data Plane

The Scout Docker path starts the API, web console, PostgreSQL, telemetry, Prometheus, Grafana, and Tempo for local evaluation. Demo/customer data and Data Protection keys live in Docker volumes unless an operator deliberately configures a different customer-controlled storage path.

In customer environments, the same data-plane rule applies:

- source connectors run beside customer systems;
- connector credentials stay in the customer secret path;
- source events, exact linked records, context facts, snapshots, relationships, attribution paths, outcomes, governed JSON packages, and local audit remain local by default;
- downstream AI tools, workflows, reports, apps, and local model runtimes consume Scout outputs inside the customer's approved environment;
- Cloud contact is optional and limited to commercial/control-plane metadata.

## Cloud Licence And Entitlement Role

Cloud can issue, validate, revoke, suspend, or reactivate commercial licences when those endpoints exist in the Cloud control plane. It can also expose entitlement summaries, private download metadata, update-channel metadata, and safe data-plane heartbeat/config metadata.

The current Cloud compatibility model keeps legacy plan values while exposing canonical commercial tiers:

| Canonical tier | Legacy compatibility values | Role |
| --- | --- | --- |
| Scout | `Free`; deprecated `Pro` | Public/open-core data-plane tier. |
| Fortress | `Business`; `Enterprise` | Paid private runtime and Enterprise/Fortress extension tier. |
| Elite | `PrivateCloud` as highest-rank compatibility alias pending contract review | Operator-assisted strategic tier above Fortress. |

Scout open-core use must not require a Cloud licence. Cloud licences gate private paid artefacts, paid support paths, update metadata, and private runtime entitlements.

## Data That Must Never Go To Cloud By Default

Cloud must not receive these by default:

- source credentials, connector credentials, private keys, tokens, or connection strings;
- raw CRM, ERP, support, billing, product, warehouse, email, chat, calendar, document, or analytics records;
- exact data items, exact linked records, local source payloads, context facts, or context snapshots;
- relationship sets, relationship types, attribution paths, outcome records, evidence packs, prompt context packages, prompts, generated customer content, recommendations, caveats, confidence, weighted signals, citation IDs, or per-entity relationship metadata;
- local databases, raw logs, local audit trails, or support bundles outside an approved secure support process;
- customer-specific connector mappings, customer schemas, paid connector code, private deployment secrets, or enterprise implementation details.

Allowed Cloud payloads are commercial/control-plane metadata and aggregate counters only, for example package version, deployment version, safe health status, active user count, workspace count, API client count, context lookup count, selector execution count, connector health-check count, storage estimates, update/download/licence/support counts, and anomaly count.

## Upgrade Path

| Path | Scout-side behaviour | Cloud-side role |
| --- | --- | --- |
| Scout to Fortress | Keep the data plane customer-owned; add private connector/runtime packages, private deployment support, and Enterprise/Fortress analysis outside the public repo. | Record subscription/licence entitlement, expose private download/update metadata, register deployment metadata, and accept aggregate-only usage/health. |
| Fortress to Elite | Keep Fortress runtime and raw outcome data in the customer environment; add approved Elite model/operator packs and outcome-review governance. | Record Elite entitlement and operator/support metadata without ingesting raw outcome records or derived relationship intelligence by default. |
| Paid tier to Scout/open-core | Remove or expire private runtime entitlements and private artefact access while preserving open-core Scout use and customer-owned data. | Keep commercial audit/account history and deny private downloads/update checks where entitlement no longer applies. |

Upgrades and downgrades should be auditable, additive where possible, and never require moving customer operational data into Cloud.

## Documentation Contract

Scout docs should describe Cloud as optional commercial control. They should not describe Cloud as a hosted Scout data plane, a required runtime dependency, a raw customer-data store, a complete self-serve SaaS, or a store for derived customer intelligence.

When in doubt, use the naming source of truth at `C:\Kyntic\docs\source-of-truth-naming-map.md` and the Cloud WP1 catalogue at `C:\Kyntic\universalcontextlayer-cloud\docs\work-packages\wp1-cloud-control-plane\product-catalogue.md`.
