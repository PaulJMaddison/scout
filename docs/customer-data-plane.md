# Customer Data Plane

This page explains how KynticAI Scout runs beside customer systems as a customer-controlled data plane for governed evidence and semantic context.

We do not build the brain. We build the nervous system. Scout carries trusted business context from existing operational systems to the customer's own AI tools, workflows, reports, apps, local LLMs, and agents.

## What It Is

The customer data plane is the part of Scout that runs near the customer's source systems. It owns:

- source access and connector configuration
- selector definitions and selector execution
- semantic attributes and context facts
- context snapshots, context packages, and governed evidence packs
- confidence, freshness, explanations, provenance, masking, and audit
- API clients, local users, roles, scopes, and operational configuration
- REST, GraphQL, SDK, and internal-service access for downstream consumers

The customer data plane is the thing a paid pilot proves.

## What It Sits Beside

Scout can sit beside CRM, ERP, SQL databases, data warehouses, support desks, billing systems, product telemetry, spreadsheets, SharePoint, email engagement exports, web events, old .NET systems, and other operational sources.

Those systems remain systems of record. Scout does not require the customer to replace them before proving value.

## What Leaves The Data Plane By Default

By default, raw operational records, connector credentials, context facts, context snapshots, prompt context packages, message bodies, document bodies, attachments, local databases, logs with sensitive payloads, and customer-specific mappings should not leave the customer-controlled data plane.

An optional hosted or private control plane can manage commercial metadata such as accounts, licences, downloads, update channels, support access, entitlement metadata, and optional aggregate usage. It should not receive raw operational customer data by default.

## How Context Is Produced

1. Approved source signals are read from existing systems or safe exports.
2. Selectors map authorised fields, events, and metrics into semantic attributes.
3. Context facts are written with confidence, freshness, explanation, and provenance.
4. Evidence packs can link email address, email reply or meeting booked, web search, pricing-page visit, account registration, CRM contact, opportunity, support ticket, product usage, billing status, and won/lost sale outcome.
5. Context snapshots version the facts for a user, account, workflow, or other business entity.
6. Downstream consumers retrieve context through REST, GraphQL, SDKs, internal services, or governed context packages.
7. In the wider UCL direction, the private Rust relationship engine weights the evidence pack before a local/open-source LLM recommends a next-best action.

## Why It Matters Commercially

The paid value is implementation speed, connector work, selector design, governance, support, production rehearsal, and operational confidence.

A buyer can prove one workflow without a replatforming programme. A CTO can verify boundaries, scopes, API contracts, provenance, audit, backup expectations, and integration behaviour before expanding into private enterprise connectors or future hosted control-plane services.

## Open Core Boundary

The public repo includes the reusable open core: local demo, customer data-plane foundations, APIs, SDKs, generic connectors, mock connectors, selector engine, provenance, audit, docs, and extension points.

Paid/private scope can include enterprise connector implementations, SSO, SCIM, advanced governance, compliance exports, deployment packs, SLAs, private cloud support, and future hosted control-plane operations. Those paid implementations are intentionally not shipped in this public repository.
