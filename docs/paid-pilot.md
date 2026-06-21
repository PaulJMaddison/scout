# Supported Pilot

KynticAI Scout can be evaluated through a supported pilot for teams that want to turn authorised operational data into governed context for their own AI-enabled products, workflows, apps, reports, and agents.

This page is intentionally public-safe. It describes the shape of a pilot without publishing private pricing anchors, internal sales strategy, customer-specific delivery plans, or private enterprise implementation details.

## Who It Is For

A pilot is a good fit for teams that already have useful data in CRM, support, product usage, billing, warehouse, spreadsheets, legacy SQL systems, or internal applications, but need a safer way to expose business meaning to downstream systems.

Common sponsors include:

- technical leaders who need an integration layer before rolling out AI-enabled systems
- product teams adding context-aware workflows to an existing product
- revenue, success, or support leaders who need clearer account or user context
- data and integration teams who want reusable semantic contracts rather than point-to-point joins

## What The Pilot Delivers

A supported pilot normally focuses on one valuable workflow and one customer-owned Scout data plane.

Typical deliverables include:

- a Scout deployment in a customer-controlled or agreed evaluation environment
- one tenant and one primary workspace configured for the pilot
- selected source paths, such as generic SQL, REST, CSV, or approved exported datasets
- a first semantic schema for the chosen workflow
- selector definitions that map source data into context facts
- context snapshots with confidence, freshness, provenance, masking, and auditability
- REST, GraphQL, SDK, or export access for one downstream consumer
- a technical handover for the customer's team

The customer can bring their own AI tools, workflow engine, internal app, reporting layer, or agent runtime. Scout provides the governed context those systems consume.

## Scope Boundaries

Pilot scope should be agreed before work starts. The public repo should not imply unlimited delivery, hands-off operations, or customer-specific connector coverage.

Typical scope includes:

- a named workflow and success criteria
- a limited set of source systems or safe exported datasets
- an agreed data-handling and credential route
- a defined downstream consumer
- production-readiness review where a production-style environment is in scope
- written handover and next-step recommendations

Typical exclusions include:

- unlimited connector delivery
- unmanaged production support
- customer-specific long-term hosting operations
- live payment-provider billing
- full hosted SaaS account management
- formal compliance certification
- vendor-certified connector claims unless separately validated

## Technical Checklist

Before a pilot moves beyond local evaluation, confirm:

- deployment mode and environment ownership
- PostgreSQL or another approved production-style database where applicable
- source systems and access method
- customer secret storage and credential handling
- data categories, PII expectations, masking, and retention
- tenant and workspace structure
- semantic attributes and selectors
- downstream consumer API path
- audit, provenance, observability, backup, and restore expectations
- support bundle and log redaction boundaries

## Success Criteria

A pilot is successful when:

- the customer can explain what the Scout data plane does
- source systems remain in place
- at least one useful business entity resolves into a semantic profile
- every context fact has provenance, confidence, freshness, and audit history
- a downstream system can consume context without joining raw source tables itself
- the customer can identify the next operational step from evidence, not guesswork

## What Is Not Included By Default

The open source repo does not include:

- live payment-provider billing
- hosted SaaS account management
- a production licence portal
- real paid vendor connector implementations
- SSO, SAML, SCIM, or enterprise identity implementation
- customer-specific deployment automation
- formal compliance certification

Those paths require separate commercial, legal, security, and delivery review.

## Related Documents

- [First Paid Pilot One-Pager](first-paid-pilot-one-pager.md)
- [Paid Pilot Setup](paid-pilot-setup.md)
- [Pilot SOW Template](pilot-sow-template.md)
- [Customer Data Plane](customer-data-plane.md)
- [Buyer FAQ](buyer-faq.md)
- [Public API Contract](public-api-contract.md)
- [Production Install Rehearsal](production-install-rehearsal.md)
- [First Real Connector Proof](first-real-connector-proof.md)
- [Pilot Agreement Outline](legal/pilot-agreement-outline.md)
