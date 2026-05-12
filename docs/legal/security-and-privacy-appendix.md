# Security And Privacy Appendix

This appendix is a non-lawyer template for pilot scoping. Final security, privacy, and contractual terms require solicitor and security review.

## Customer-Owned Data Plane

The customer data plane is the default location for operational data processing. It contains source connectors, connector credentials, selectors, semantic attributes, context facts, context snapshots, local audit logs, API clients, and data-plane administration.

## Hosted Control-Plane Boundary

No raw operational data is sent to a hosted control plane by default. Control-plane metadata may include account records, customer contacts, plans, subscriptions, licence state, data-plane registration, support cases, download artefacts, update channels, audit events for commercial operations, and optional aggregate usage metrics.

## Credential Handling

- credentials are stored in the customer-approved secret route
- least-privilege access is required for source systems
- clear API keys and client secrets are shown only once where applicable
- credentials, key rings, local databases, and support bundles are not committed
- rotation and revocation owners must be named before go-live

## Audit Logs

Audit logs should cover connector registration, selector changes, context recompute, context lookup, API key activity, permission denial, support bundle export, and licence actions where applicable.

## Backups And Restore

Backup ownership must be explicit. The context-layer database, customer source database or extract store, and ASP.NET Data Protection key ring must be backed up together where protected credentials depend on the key ring.

Restore must be tested into a disposable environment before calling the pilot production-style.

## Incident Notification

The parties should agree:

- incident contact list
- severity classification
- first-notification target
- update cadence
- evidence preservation route
- support bundle sharing process
- customer approval before exporting raw data

## Offboarding

Offboarding should include export of agreed configuration, deletion or return of pilot support bundles, revocation of source credentials, removal of temporary users, licence expiry or revocation, and confirmation of retained audit records.

## Legal Review

This appendix does not replace a data processing agreement, security schedule, or privacy notice. Final terms require solicitor review.
