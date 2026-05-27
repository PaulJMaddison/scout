---
title: Connector Basics
description: How KynticAI Scout connectors bring data from existing systems into the semantic layer.
---

Connectors are the bridge between your existing operational systems and the
Scout semantic layer. They fetch raw data from source systems so that the
Selector Engine can transform it into governed semantic facts.

## How Connectors Work

```
Source System ──► Connector ──► Raw Payload ──► Selector Engine ──► Semantic Facts
```

1. A **connector** connects to a source system (database, REST API, file,
   or mock fixture) and retrieves raw records for a given subject.
2. The **Selector Engine** applies admin-authored mapping rules to turn raw
   fields into canonical semantic attributes.
3. The resulting **semantic facts** carry confidence scores, provenance, and
   freshness metadata.

## Built-in Connector Types

Scout ships with three built-in connector plugins in the open-source core:

| Type | Aliases | Description |
|---|---|---|
| `sqlDatabase` | `sqlTable` | Generic SQL queries against relational databases |
| `restApi` | `apiPayload`, `crmApi`, `billingApi`, `telemetryApi`, `supportApi` | HTTP-backed operational APIs |
| `mock` | `mockPayload`, `mockSignal`, `fileUpload` | Deterministic demo fixtures and tests |

These connectors are generic by design. They demonstrate the connector
contract without encoding vendor-specific logic.

## Connector Plugin Contract

Every connector implements the `IConnectorPlugin` interface, which declares:

- **Metadata** — connector type, display name, and supported capabilities.
- **Configuration schema** — what settings the connector requires.
- **Validation** — checks that a configuration is well-formed before use.
- **Health check** — verifies connectivity to the source system.
- **Fetch** — retrieves raw records for a given subject.

The `IConnectorRegistry` resolves connectors by canonical type or alias at
runtime.

## Credential Storage

Connector credentials are stored as protected references (`secret://…`)
rather than inline values. At execution time, the `IConnectorCredentialStore`
resolves these references so that secrets are never exposed in configuration
JSON.

```json
{
  "credentials": {
    "apiKey": "secret://tenant/data-source/apiKey"
  }
}
```

## Open-Source Boundary

The public repository ships generic connector contracts and safe example
implementations. It intentionally does not include vendor-specific
enterprise connectors.

Commercial connectors for services such as Salesforce, HubSpot, Dynamics,
and others are available as part of
[KynticAI Fortress](https://kyntic.ai) — the enterprise edition. Enterprise
connectors implement the same `IConnectorPlugin` contract and plug into
Scout without forking the core.

For enterprise connector enquiries, visit [kyntic.ai](https://kyntic.ai).

## Writing a Custom Connector

To build your own connector:

1. Implement `IConnectorPlugin` in a separate assembly.
2. Register it with the `IConnectorRegistry` via dependency injection.
3. Provide a configuration schema and validation logic.
4. Return raw payloads from `FetchAsync` — the Selector Engine handles
   semantic mapping.

The generic SQL and REST connectors in the Scout source serve as reference
implementations.

## Next Steps

- [Open Source vs Enterprise](/concepts/open-source-vs-enterprise/) for the
  full product boundary.
- [API Overview](/apis/overview/) for querying context produced by connectors.
