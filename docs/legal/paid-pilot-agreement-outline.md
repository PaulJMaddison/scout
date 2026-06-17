# Paid Pilot Agreement Outline

This is a non-lawyer commercial/legal outline for solicitor review. It is not legal advice and is not a production contract.

## Pilot Purpose

KynticAI Scout turns authorised customer data into exact data items, relationships, attribution paths, and governed JSON that customer-owned AI tools, workflows, apps, reports, local LLMs, and agents can use. The paid pilot proves the customer data-plane pattern in a controlled scope.

## Scope To Define

- customer sponsor and technical owner
- source systems in scope
- connector proof approach
- semantic facts and selectors in scope
- downstream consumers in scope
- pilot dates
- success criteria
- support channel and named support owner
- backup and restore ownership
- incident owner and escalation path
- deliverables and acceptance evidence

## Data Boundary

The customer data plane holds raw operational records, connector credentials, selectors, exact data items, relationships, attribution paths, facts, snapshots, provenance, and local audit logs by default. The cloud control plane, if used, holds commercial metadata, licences, downloads, update channels, support metadata, entitlement state, and optional aggregate usage only.

Raw operational data must not be sent to cloud support by default. Any exceptional support data transfer needs written approval, redaction, retention, and deletion terms.

## Event Tracking And Consent

First-party event tracking for lead capture, attribution, product telemetry, or conversion analysis must be reviewed for GDPR and PECR before production. The agreement should state who provides notices, collects consent where needed, and responds to data subject requests.

## Exit And Offboarding

The agreement should cover export, deletion, revocation of licences and tokens, return or deletion of support data, connector credential rotation, and destruction of temporary access.

## Not Yet In Scope

- complete self-serve SaaS
- vendor-certified connector suite
- live payment automation unless separately configured
- SLA-backed support without a named process
- cloud storage of raw operational customer data by default

## Mandatory Legal Review Notes

- This outline is not legal advice.
- Customer data-plane operation keeps raw operational data, connector credentials, selectors, exact data items, relationships, attribution paths, facts, snapshots, and provenance local by default.
- Cloud control-plane processing is limited to account, licence, download, update, support, entitlement, lead, audit, and aggregate usage metadata unless separately reviewed.
- Support data must be redacted; raw operational data must not be sent to cloud support by default.
- First-party event tracking needs notice, consent/lawful-basis assessment, minimisation, retention, and opt-out/withdrawal handling.
- GDPR, UK GDPR, and PECR review is required before production.
