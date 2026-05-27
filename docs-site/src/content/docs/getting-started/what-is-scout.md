---
title: What is KynticAI Scout?
description: An introduction to KynticAI Scout — open-source context infrastructure for AI-enabled products.
---

## Overview

**KynticAI Scout** is open-source context infrastructure for AI-enabled
products. It sits beside your existing systems — CRM, ERP, support desk,
billing, data warehouses — and creates a governed semantic layer above them
so that downstream consumers receive trusted business meaning instead of raw
records.

Scout does not replace any source system. It does not call an AI model. It
builds the *nervous system* that carries business context from existing
operational data to AI tools, copilots, workflow engines, reporting
dashboards, and internal applications.

## Key Capabilities

| Capability | Description |
|---|---|
| **Selector Engine** | Admin-authored rules that turn raw fields into canonical semantic attributes |
| **Context Snapshots** | Reusable business profiles with confidence, freshness, and provenance |
| **Semantic Facts** | Discrete governed units of business meaning with audit metadata |
| **GraphQL + REST APIs** | Every context surface available through both query styles |
| **TypeScript & .NET SDKs** | Typed client libraries for integration teams |
| **AI-Safe Context Packages** | Scoped, grounded context bundles — Scout does not call an AI model |
| **Connector Framework** | Generic SQL, REST, CSV, mock connectors and extension points |
| **Audit & Provenance** | Every read, recompute, and context access is traceable |
| **Blueprint Import** | AI-generated configuration validated and imported without calling AI APIs |
| **Admin Console** | React-based UI for data sources, selectors, schemas, and context viewer |

## Architecture

Scout operates as a **customer data plane** — it runs in your environment
and your data stays under your control.

```
Existing Systems ──► Connectors ──► Selector Engine ──► Semantic Schema
                                                            │
                                                    Context Snapshots
                                                            │
                                              GraphQL / REST / SDKs
                                                            │
                                                    Downstream Consumers
                                              (copilots, apps, reports,
                                               workflows, agents)
```

An optional hosted control plane manages only commercial metadata —
accounts, licences, and downloads. It never receives raw customer data.

## Licence

KynticAI Scout is released under the [MIT Licence](https://github.com/PaulJMaddison/scout/blob/main/LICENSE).

## Next Steps

- [Install Scout](/getting-started/installation/) on your machine.
- Follow the [Quickstart](/getting-started/quickstart/) to run a local demo.
- Explore the [API Overview](/apis/overview/).
