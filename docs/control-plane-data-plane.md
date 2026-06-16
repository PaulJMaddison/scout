# Control Plane And Data Plane

KynticAI Scout is designed as context infrastructure with a customer-owned data plane and an optional hosted control-plane relationship.

The important rule is simple: operational customer data does not need to leave the customer environment for Scout to be useful.

## Customer Data Plane

The customer data plane is the self-hosted Scout runtime. It manages source connectors, connector credentials, customer-approved mappings, selector execution, semantic attributes, exact linked records, context snapshots, context facts, evidence packs, provenance, audit logs, GraphQL, REST, API keys, local users, local roles, and access to customer operational systems.

Typical data-plane components:

- ASP.NET Core Scout backend
- PostgreSQL in production or SQLite for the local demo
- customer connector configuration and credentials
- selector definitions and selector execution history
- semantic schema, exact linked records, context snapshots, context facts, evidence packs, and provenance
- audit events, source events, recompute jobs, and governance policies
- GraphQL, REST, SDK, and webhook/event ingestion endpoints

The public repository includes safe generic connectors, mock connectors, and paid/private connector placeholders only. Paid enterprise connector code, customer-specific mappings, private Rust relationship-weighting modules, and private deployment packs should live outside this repo.

## Hosted Control Plane

The hosted control plane is an optional commercial seam, not a requirement for the open-core product. It may manage accounts, plans, licences, downloads, documentation, support access, update channels, and optional aggregate usage reporting.

Paid/private Cloud/control-plane modules may also manage hosted account management, billing, commercial licence portals, download portals, support portals, and cloud operations. They are commercial implementations outside this public repo.

Control-plane metadata should be limited to operational account information, licence state, package/update metadata, support access, entitlement metadata, and optional aggregate usage. It must not require raw CRM records, ERP records, support tickets, product usage, billing events, customer emails, chat messages, calendar descriptions, issue descriptions, documents, attachments, warehouse rows, analytics event payloads, local evidence-pack JSON, exact linked records, context facts, citations, weighted signals, recommendations, confidence, caveats, or per-entity relationship metadata to leave the customer environment.

## Evidence Pack Boundary

When Scout generates a next-best-action evidence pack, the local customer data plane may use exact authorised records such as normalised email address, CRM contact/account, account registration/profile, sales activity, opportunities, email replies, meetings booked, web conversion and pricing-page events, support tickets, product usage summaries, billing health, and won/lost outcome signals.

The optional Cloud/control-plane payload for next-action usage is a Cloud aggregate usage payload only. It may carry tenant/control-plane identifiers, package version, feature usage counters, health/status, timestamps, and audit/control-plane event metadata. It must not carry raw records, context facts or snapshots, local evidence packs, prompts, generated content, recommendations, citation IDs, weighted signals, relationship type names, confidence, caveats, hashed subject/account identifiers, or per-entity relationship metadata.

## v2 Public Repo Foundations

The v2 public repo includes the first safe foundations:

- `ControlPlane` configuration for base URL, update channel, customer account ID, usage reporting flag, and offline grace period
- `Licence` configuration for community mode, local licence file path, paid-mode enforcement flag, and offline grace period
- `/api/platform/config` so operators can inspect runtime mode and feature flags
- `/api/v1/licence/status` and GraphQL `licenceStatus`
- a self-hosted admin console page at `/admin/licence`
- audit events for licence checks, invalid licences, and expired licences
- seeded local demo licence file generation in setup/start scripts

These foundations deliberately do not integrate a payment provider, phone home, or unlock private connector code.

## Mermaid View

```mermaid
flowchart LR
    subgraph Customer["Customer environment"]
        Sources["CRM, ERP, support, warehouse, product DB, billing, spreadsheets, legacy SQL"]
        DataPlane["Scout data plane\nconnectors, selectors, exact records, evidence packs, APIs"]
        Consumers["Customer consumers\napps, reports, copilots, agents, workflows"]
        Sources --> DataPlane
        DataPlane --> Consumers
    end

    subgraph Hosted["Optional hosted control plane"]
        Account["accounts and licences"]
        Downloads["downloads and update channels"]
        Support["docs and support access"]
        Usage["optional aggregate usage metadata"]
    end

    Account -. licence status only .-> DataPlane
    Downloads -. package metadata .-> DataPlane
    DataPlane -. optional aggregate usage only .-> Usage
```

## What Must Stay Local

- source records and raw payloads
- connector credentials
- selector source data
- exact linked records
- context facts and context snapshots
- provenance records
- local evidence packs and prompt context packages that include customer data
- tenant audit logs unless the customer explicitly exports them

## Future Private Work

Future paid or private repositories may add Rust relationship weighting, SSO, enterprise connectors, commercial licence signing, hosted account management, private cloud deployment packs, compliance reporting, support bundles, and SLA tooling. Those modules should plug into the public extension interfaces without turning the open-core repo into a crippled teaser.
