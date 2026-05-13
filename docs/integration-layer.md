# Integration Layer

Universal Context Layer sits beside existing business systems and turns approved operational signals into governed semantic context for customer-owned consumers.

This page explains how external systems integrate with the open-core UCL data plane without implying that paid enterprise connector implementations ship in this public repository. The goal is practical: let a CTO or integration lead see how one paid pilot can prove a useful workflow while CRM, ERP, SQL, support, billing, files, emails, telemetry, and old applications stay in place.

## Integration Shape

UCL is the nervous system, not the brain. It does not require customers to use UCL's AI, move raw operational data into a hosted control plane, or replatform systems of record.

The customer data plane is responsible for:

- source access approved by the customer
- connector configuration and health checks
- selector execution
- semantic facts and context snapshots
- provenance, confidence, freshness, masking, and audit
- GraphQL, REST, SDK, context package, and event contracts for downstream consumers

The optional cloud control plane, when used commercially, should manage metadata such as accounts, licences, downloads, support access, update channels, and aggregate usage. It should not receive raw operational data, connector credentials, context facts, or context packages by default.

## Source System Patterns

| Source system | Public integration pattern | Paid/private boundary |
| --- | --- | --- |
| SQL Server and PostgreSQL | Use a generic SQL/table style source, approved read-only views, or exported rollup tables. Selectors map stable columns into semantic facts. | Customer SQL handlers, private network access, credential vault wiring, and production schema packs are commercial implementation work. |
| CRM systems | Use mock CRM examples and selector contracts publicly to show account, contact, opportunity, stage, owner, and buying-group context. | Real HubSpot, Salesforce, Dynamics, or customer CRM sync is paid/private connector work. |
| Support systems | Use support-status and ticket-count examples for churn, risk, service drag, and escalation facts. | Real Zendesk or other support desk sync, ticket body ingestion, attachment handling, and tenant credentials stay private. |
| Billing systems | Use fictional billing signals such as seat delta, payment health, MRR trend, and invoice status. | NetSuite, Stripe, Paddle, ERP finance, or customer billing integrations are private unless explicitly released as safe generic examples. |
| Product telemetry | Use event contracts and safe activity rollups such as active days, feature events, and workspace activity score. | Customer event pipelines, proprietary analytics schemas, and production telemetry ingestion are customer-specific. |
| Email metadata | Use metadata-only examples such as reply status, engagement channel, and sequence state. | Message bodies, attachments, mailbox sync, tenant consent, and vendor API credentials are paid/private and require explicit customer approval. |
| First-party web events | Use conversion-event contracts for pricing visits, form submissions, campaign source, and journey milestones. | Production tracking scripts, tag-manager deployment, attribution models, and customer web identifiers are outside the public repo. |
| Legacy .NET applications | Have the old application call REST/GraphQL, request context packages, or emit signed events when approved business events occur. | Paid .NET handlers, IIS modules, internal adapters, private installers, and customer-specific code remain private. |

## Consumer Patterns

External consumers should call UCL through stable contracts rather than rebuilding joins across source systems.

| Consumer | Recommended UCL contract | Example use |
| --- | --- | --- |
| Customer-owned AI tools | AI-safe context package retrieval | Fetch scoped facts, citations, freshness, redactions, and guardrails before calling the customer's chosen model. |
| Internal apps | GraphQL context lookup | Render account or user context in an operator workspace without reading every source system directly. |
| Reports and dashboards | REST context lookup or snapshot retrieval | Use shared semantic facts in revenue, support, adoption, or risk reporting. |
| Workflow automation | REST facts, recomputation, and events | Recompute context after source changes and act only when facts meet freshness and confidence thresholds. |
| Product experiences | SDK context lookup | Add trusted account or user context to customer-facing flows without duplicating integration logic. |

UCL does not need to call an AI model. It prepares the governed semantic context that the customer's own AI stack, workflow engine, report, app, or service can consume.

## Event Contracts

Events let external systems notify UCL that source data changed. A first paid pilot should keep events narrow and auditable:

- `source.account.updated`
- `source.user.updated`
- `source.support_ticket.updated`
- `source.billing_status.updated`
- `source.product_usage.rollup_ready`
- `source.web_conversion.received`
- `context.recompute.requested`

Webhook signing, replay protection, tenant scoping, and recomputation expectations are documented in [Webhook Events](webhook-events.md). Event contracts are useful even when no vendor connector is available because a legacy app, ETL job, or workflow engine can emit a small approved change event.

## Selector Boundary

Selectors are where raw operational signals become semantic facts. In a paid pilot, a selector should name:

- source fields or events
- tenant and workspace scope
- output semantic attribute
- mapping logic
- confidence policy
- freshness window
- provenance requirements
- masking expectations
- human review conditions

The public repo includes selector examples and validation flows. Customer-specific selector packs, enterprise governance policy, and production rollout support may be paid/private work.

## API and SDK Surface

Use [Public API Contract](public-api-contract.md) for concrete examples covering:

- GraphQL context lookup
- REST context lookup
- account context lookup
- semantic fact lookup
- context snapshot retrieval
- recomputation request
- selector preview and validation
- audit/provenance lookup
- AI-safe context package retrieval
- machine-to-machine auth
- tenant/workspace scoping
- error response shape
- pagination and filtering
- TypeScript and C# SDK usage

Use [Connector Marketplace Skeleton](connector-marketplace.md) to identify which connector paths are public examples, paid/private implementations, planned connectors, placeholders, or customer-specific work.

## First Pilot Recommendation

Start with one workflow and a small source set:

1. Pick one business decision, such as renewal risk, expansion readiness, account routing, service escalation, or onboarding next best action.
2. Identify the minimum approved signals from SQL, CRM, support, billing, telemetry, email metadata, or web events.
3. Build selectors for the semantic facts needed by the workflow.
4. Expose a context snapshot or AI-safe package to one customer-owned consumer.
5. Measure whether the workflow became faster, more accurate, safer, or easier to audit.

That is the commercial proof: UCL creates a reusable semantic layer over existing systems before anyone commits to wider enterprise integration.
