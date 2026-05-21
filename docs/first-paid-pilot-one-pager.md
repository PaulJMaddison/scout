# KynticAI Scout First Paid Pilot

KynticAI Scout turns existing business data into trusted semantic context that customer-owned AI tools, workflows, apps, reports, and agents can use.

We do not build the brain. We build the nervous system: the customer-controlled layer that carries trusted context from existing systems to the tools the customer already owns or wants to build.

## Who The Pilot Is For

The first paid pilot is for organisations that already have valuable operational data in CRM, support, billing, product usage, data warehouse, PostgreSQL/SQL databases, spreadsheets, or legacy systems, but cannot safely reuse that data as business meaning in AI-enabled workflows without brittle point-to-point integration.

Good first buyers are CTOs, product leaders, RevOps, customer success, support, data, and integration teams with a named workflow and a technical sponsor.

## Customer Data Plane

The pilot is based on a customer-owned data plane. Scout runs beside the customer's systems, inside an agreed customer-controlled environment or private pilot environment. Source records, connector credentials, selectors, context facts, context snapshots, provenance, and local audit logs stay in that data plane by default.

A future hosted/private control plane may manage commercial metadata such as accounts, licences, downloads, support cases, and update channels. It does not need raw operational customer data by default.

## Systems It Can Sit Beside

The open-core pilot can sit beside PostgreSQL or SQL databases, exported CSV or spreadsheet datasets, REST APIs, CRM-style records, support records, product usage summaries, billing summaries, data warehouse extracts, and internal workflow systems.

Vendor-specific paid connectors such as Salesforce, HubSpot, Microsoft 365, Zendesk, Snowflake, or NetSuite belong in private enterprise scope and are not included in the public open-core repo by default.

## What The Pilot Includes

- discovery of one valuable business workflow
- customer data-plane setup guidance
- production-style configuration rehearsal
- one to three source systems or safe exported datasets
- semantic attributes for the selected workflow
- selector mappings from source fields to context facts
- confidence, freshness, provenance, masking, and audit review
- REST, GraphQL, or SDK access for one downstream consumer
- executive playback and technical handover
- recommendation for rollout, support, or enterprise connector scope

## What The Pilot Does Not Include

- hands-off self-serve SaaS onboarding
- unlimited source systems or connector delivery
- customer-specific managed hosting unless separately agreed
- formal compliance certification
- live payment-provider billing
- production SSO, SAML, SCIM, or enterprise identity unless separately scoped
- vendor-specific paid connector implementation in the public repo

## Expected Timeline

Most first pilots should run for two to six weeks.

- Week 0 to 1: workflow discovery, source access, architecture, security, and success criteria.
- Week 1 to 2: data-plane setup, production rehearsal, source onboarding, and first semantic schema.
- Week 2 to 4: selector implementation, context snapshot validation, provenance review, and first API consumer.
- Week 4 to 6: operational hardening, stakeholder playback, handover, and rollout recommendation.

## Buyer Outcomes

The buyer should finish the pilot with:

- one workflow that consumes business context rather than raw source tables
- a working semantic contract over existing systems
- evidence that source systems can remain in place
- visible provenance, confidence, and freshness on every fact
- an agreed data-plane operating model
- a clear decision on enterprise connector, support, and rollout investment

## Sample Use Cases

- trusted context for energy pricing, procurement, and operational AI workflows
- sales account intelligence for next-best action
- customer success renewal and churn-risk context
- support prioritisation based on commercial and product signals
- product-led growth scoring from usage, billing, and CRM summaries
- operational readiness context for internal workflows
- trusted context packages for customer-owned AI agents

## Commercial Proof

An anonymised ERP platform pattern has already shown the commercial shape: existing operational systems stayed in place while a semantic layer translated fragmented records into reusable business meaning for a new web platform and AI-enabled workflows. The lesson for Scout is that buyers do not need to replace their core estate first; they can prove value by placing a governed data plane beside it.

See [Anonymised ERP Platform Pattern](anonymised-erp-platform-pattern.md).

Related buyer and technical proof:

- [Customer Data Plane](customer-data-plane.md)
- [Buyer FAQ](buyer-faq.md)
- [Public API Contract](public-api-contract.md)

## Success Criteria

A successful first paid pilot proves that:

- at least one source path produces context from real or customer-approved representative data
- at least one downstream consumer can look up context through REST, GraphQL, or SDK access
- context facts include value, confidence, freshness, explanation, and provenance
- a context snapshot is created and can be audited
- demo fallback is disabled for customer-facing use
- PostgreSQL, secrets, data protection keys, backups, restore, and observability responsibilities are documented
- the customer can explain what should be expanded next

## Recommended Next Step

Run a paid discovery and implementation pilot with a named workflow, named source systems, and named success criteria. Start with generic SQL/PostgreSQL, REST, CSV, or safe exported data, then scope private enterprise connectors only after the workflow value is clear.

Founder-led commercial anchors: discovery workshop GBP 1,500-3,000, starter paid pilot GBP 7,500-15,000, production pilot GBP 20,000-45,000, and enterprise rollout scoped from GBP 50,000.

Use [Paid Pilot Proof Package](paid-pilot-proof-package.md) for the demo script, one-page PDF content, data-plane diagram, screenshot checklist, and anonymised ERP pattern story.
