---
title: Open Source vs Enterprise
description: What ships in the free KynticAI Scout open-source core and what requires a commercial licence.
---

KynticAI follows an **open-core** model. The public **Scout** repository is
the free, MIT-licensed foundation. **Fortress** is the private enterprise
edition available under a commercial licence.

## What's Included in Scout (Open Source)

Scout is a complete, self-hostable context infrastructure platform. The
open-source repository includes:

| Area | What You Get |
|---|---|
| **Semantic Engine** | Selector execution, fact materialisation, confidence scoring |
| **Context Snapshots** | Point-in-time business profiles with provenance |
| **GraphQL + REST APIs** | Full query surface for all context data |
| **TypeScript SDK** | Typed client for Node.js and browser environments |
| **.NET SDK** | Typed client for C# applications |
| **Admin Console** | React-based UI for data sources, selectors, schemas, and context |
| **SQLite Local Mode** | Zero-dependency local development and demos |
| **PostgreSQL Support** | Production database with migrations |
| **Generic Connectors** | SQL, REST, CSV, and mock connector plugins |
| **Extension Interfaces** | Stable contracts for building custom connectors and extensions |
| **Audit & Provenance** | Traceable access, recomputation, and governance records |
| **Blueprint Import** | AI-generated configuration import (no AI API calls required) |
| **Docker Support** | Single-container and Compose-based deployment |
| **Demo Data** | Realistic seeded B2B SaaS dataset for evaluation |

## What Requires a Commercial Licence (Fortress)

Fortress is the enterprise edition of KynticAI. It extends the Scout core
with capabilities designed for production enterprise deployments. Fortress
is not included in the Scout repository and is not open source.

Enterprise capabilities include:

- Vendor-certified connectors (e.g. Salesforce, HubSpot, Dynamics,
  Snowflake, SAP, and others)
- Enterprise SSO / SAML / SCIM identity integration
- Advanced governance and compliance exports
- Credential vault integrations
- Managed deployment packs and installers
- SLA-backed support

:::note
Fortress internals are not published in the Scout repository. The list
above describes the *category* of enterprise capability, not implementation
details.
:::

## How They Relate

Scout defines stable public extension interfaces. Fortress implements those
interfaces in a separate private codebase. Enterprise modules plug into the
Scout core via dependency injection — no forking required.

```
┌─────────────────────────────────────────────┐
│  KynticAI Scout (open source, MIT)          │
│  Semantic engine, APIs, SDKs, admin UI,     │
│  generic connectors, extension contracts    │
├─────────────────────────────────────────────┤
│  KynticAI Fortress (commercial licence)     │
│  Enterprise connectors, SSO, governance,    │
│  compliance, managed deployment             │
└─────────────────────────────────────────────┘
```

## Enquiries

For enterprise licensing, pilot programmes, or technical questions about
Fortress, visit [kyntic.ai](https://kyntic.ai).

## Next Steps

- [What is KynticAI Scout?](/getting-started/what-is-scout/) for an
  introduction to the platform.
- [Connector Basics](/concepts/connector-basics/) for how data flows from
  source systems into the semantic layer.
