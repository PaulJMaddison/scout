# Pilot Agreement Outline

This outline is not legal advice and is not ready for signature. It is a non-lawyer commercial template for solicitor review.

## Purpose

The agreement should cover a time-boxed Universal Context Layer paid pilot using a customer-owned data plane. The pilot proves agreed source-to-context workflows without claiming complete self-serve SaaS readiness.

## Core Terms To Cover

- parties, effective date, pilot term, renewal, and termination
- pilot scope, source systems, semantic attributes, and downstream consumer
- fees, expenses, taxes, payment timing, and late payment
- customer responsibilities for access, approvals, backups, restore, and data classification
- supplier responsibilities for configuration, implementation support, documentation, and handover
- acceptance criteria and process for disputed acceptance
- change control for additional systems, connectors, attributes, timelines, or support expectations
- confidentiality and publicity restrictions
- intellectual property and licence assumptions
- warranty disclaimers and liability limits
- suspension or termination for security, non-payment, or unlawful use
- governing law and dispute process

## Data Plane Boundary

The agreement should state that source records, connector credentials, selectors, context facts, context snapshots, local audit logs, and source-system integrations remain in the customer-owned data plane by default.

Hosted or private control-plane services should receive commercial metadata only by default, such as account, subscription, licence, support case, download, update channel, entitlement, and optional aggregate usage metadata.

## Licence And Usage Assumptions

The pilot should define:

- permitted pilot users
- permitted environments
- permitted source systems
- permitted downstream consumer
- usage and API lookup assumptions
- whether a time-limited pilot licence is issued
- whether enterprise/private connector modules are included
- offboarding, export, deletion, and licence expiry expectations

## Legal Review

Final terms require solicitor review for data protection, confidentiality, intellectual property, liability, indemnity, payment, tax, export controls, and regulatory obligations.
# Mandatory Legal Review Notes

- This draft is not legal advice.
- Customer data-plane operation keeps raw operational data, connector credentials, selectors, facts, snapshots, and provenance local by default.
- Cloud control-plane processing is limited to account, licence, download, update, support, entitlement, lead, audit, and aggregate usage metadata unless separately reviewed.
- Support data must be redacted; raw operational data must not be sent to cloud support by default.
- First-party event tracking needs notice, consent/lawful-basis assessment, minimisation, retention, and opt-out/withdrawal handling.
- GDPR, UK GDPR, and PECR review is required before production.
