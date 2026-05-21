# Security And Privacy Appendix

This is a non-lawyer security/privacy appendix for legal review. It is not legal advice and must be adapted before use with a customer or production site.

## Product Boundary

KynticAI Scout does not need to own the customer's AI stack. It provides the governed data plane between existing systems and customer-owned AI tools, workflows, apps, reports, and agents.

## Customer Data Plane

The customer data plane keeps operational data under customer control by default:

- source records and connector output
- connector credentials and vault references
- selectors and semantic mappings
- context facts, snapshots, and provenance
- local API clients, audit logs, and admin configuration

## Cloud Control Plane Metadata

The cloud control plane should only need:

- account and contact metadata
- subscription and entitlement metadata
- licence and download metadata
- update-channel metadata
- support-case metadata
- optional aggregate usage counts
- control-plane audit events

It must not receive raw operational customer data by default.

## Support Data Handling

Customers must not send raw operational data, local databases, connector credentials, private keys, source logs, prompt packages, message bodies, documents, attachments, or unredacted support bundles to cloud support by default. Support bundles must be redacted before sharing.

## Event Tracking

First-party event tracking requires notice, minimisation, retention controls, and GDPR/PECR review before production. Consent may be required depending on the event purpose and storage technology.

## Credential Handling

- store credentials in the customer-approved secret route
- use least-privilege source-system access
- show clear API keys and client secrets only once where applicable
- never commit credentials, key rings, local databases, logs, support bundles, or licence signing keys
- name rotation and revocation owners before go-live

## Audit Logs

Audit logs should cover connector registration, selector changes, context recompute, context lookup, API key activity, permission denial, support bundle export, licence actions, data-plane registration, and aggregate usage reporting where applicable.

## Backups And Restore

Backup ownership must be explicit. The scout database, source database or approved extract store, and ASP.NET Data Protection key ring must be backed up together where protected credentials depend on the key ring. Restore must be tested into a disposable environment before calling the pilot production-style.

## Incident And Offboarding

The parties should agree incident contacts, severity classification, first-notification target, update cadence, evidence preservation, support bundle sharing process, and customer approval before any exceptional raw-data export.

Offboarding should include export of agreed configuration, deletion or return of pilot support bundles, revocation of source credentials, removal of temporary users, licence expiry or revocation, package access removal, and retained audit records.

## Minimum Operational Controls

- strong signing keys and scoped API clients
- persistent Data Protection keys
- PostgreSQL for production-style deployments
- demo fallback disabled
- demo seed data disabled
- structured logs without secrets or raw payloads
- backup/restore rehearsal
- incident owner and support owner
- offboarding, export, and deletion expectations

## Mandatory Legal Review Notes

- This appendix is not legal advice.
- Customer data-plane operation keeps raw operational data, connector credentials, selectors, facts, snapshots, and provenance local by default.
- Cloud control-plane processing is limited to metadata unless separately reviewed.
- Support data must be redacted; raw operational data must not be sent to cloud support by default.
- First-party event tracking needs notice, consent/lawful-basis assessment, minimisation, retention, and opt-out/withdrawal handling.
- GDPR, UK GDPR, and PECR review is required before production.
