# Customer Data Plane

This page explains how Universal Context Layer runs beside customer systems as a customer-controlled data plane for semantic context.

We do not build the brain. We build the nervous system. UCL carries trusted business context from existing operational systems to the customer's own AI tools, workflows, reports, apps, and agents.

## What It Is

The customer data plane is the part of UCL that runs near the customer's source systems. It owns:

- source access and connector configuration
- selector definitions and selector execution
- semantic attributes and context facts
- context snapshots and context packages
- confidence, freshness, explanations, provenance, masking, and audit
- API clients, local users, roles, scopes, and operational configuration
- REST, GraphQL, SDK, and internal-service access for downstream consumers

The customer data plane is the thing a paid pilot proves.

## What It Sits Beside

UCL can sit beside CRM, ERP, SQL databases, data warehouses, support desks, billing systems, product telemetry, spreadsheets, SharePoint, email exports, old .NET systems, and other operational sources.

Those systems remain systems of record. UCL does not require the customer to replace them before proving value.

## What Leaves The Data Plane By Default

By default, raw operational records, connector credentials, context facts, context snapshots, prompt context packages, message bodies, document bodies, attachments, local databases, logs with sensitive payloads, and customer-specific mappings should not leave the customer-controlled data plane.

An optional hosted or private control plane can manage commercial metadata such as accounts, licences, downloads, update channels, support access, entitlement metadata, and optional aggregate usage. It should not receive raw operational customer data by default.

## How Context Is Produced

1. Approved source signals are read from existing systems or safe exports.
2. Selectors map raw fields, events, and metrics into semantic attributes.
3. Context facts are written with confidence, freshness, explanation, and provenance.
4. Context snapshots version the facts for a user, account, workflow, or other business entity.
5. Downstream consumers retrieve context through REST, GraphQL, SDKs, internal services, or AI-safe context packages.

## Why It Matters Commercially

The paid value is implementation speed, connector work, selector design, governance, support, production rehearsal, and operational confidence.

A buyer can prove one workflow without a replatforming programme. A CTO can verify boundaries, scopes, API contracts, provenance, audit, backup expectations, and integration behaviour before expanding into private enterprise connectors or future hosted control-plane services.

## Open Core Boundary

The public repo includes the reusable open core: local demo, customer data-plane foundations, APIs, SDKs, generic connectors, mock connectors, selector engine, provenance, audit, docs, and extension points.

Paid/private scope can include enterprise connector implementations, SSO, SCIM, advanced governance, compliance exports, deployment packs, SLAs, private cloud support, and future hosted control-plane operations. Those paid implementations are intentionally not shipped in this public repository.
