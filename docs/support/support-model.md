# Support Model

This support model is a pilot template. It is not a contractual service level agreement until reviewed and agreed in a signed order or SOW.

## Scope

Support covers the agreed Scout paid pilot data plane, agreed open-core connector path, semantic mappings, context lookup path, and pilot handover. Private enterprise connectors, managed hosting, and production operations are covered only if named in the SOW.

## Support Channel And Hours

Support channel: `[agreed email, shared channel, or support portal]`

Support hours: `[UK business hours or agreed pilot window]`

Named contacts: `[customer owner]`, `[technical owner]`, `[supplier owner]`

## Severity Definitions

- Severity 1: agreed pilot playback or production-style validation is blocked by total environment unavailability or critical data-plane failure.
- Severity 2: a connector, selector, authentication, or context lookup issue blocks agreed pilot progress.
- Severity 3: non-blocking defect, mapping issue, documentation correction, or workaround-supported issue.
- Severity 4: question, enhancement request, future connector request, or commercial scope discussion.

## Responsibilities

Customer responsibilities:

- provide timely source-system access and approvals
- own backups, restore tests, and credential rotation unless separately agreed
- approve support bundle contents before export
- identify incident and escalation contacts

Supplier responsibilities:

- triage issues in the agreed support channel
- protect secrets and customer data
- document workaround or fix recommendations
- identify whether an issue is open-core, private enterprise, control-plane, infrastructure, or customer source-system related

## Support Bundles

Support bundles should contain redacted configuration, version details, health output, selected audit metadata, and logs agreed by the customer. They should exclude raw source data, secrets, API keys, connection strings, local databases, licence private keys, and Data Protection key rings by default.

## Legal Review

Response targets, service credits, liability, and regulated incident obligations require solicitor and commercial review.
