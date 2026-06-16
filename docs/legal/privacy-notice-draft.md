# Privacy Notice Draft

This is a non-lawyer drafting aid for legal review. It is not legal advice and must not be used in production without review for the actual company, customers, processors, hosting region, retention periods, and support process.

## Product Boundary

KynticAI Scout turns authorised customer data into governed evidence packs that customer-owned AI tools, workflows, apps, reports, local LLMs, and agents can use. We do not build the brain. We build the nervous system.

The customer data plane is designed to run beside the customer's systems. Raw operational data, connector credentials, selectors, context facts, snapshots, provenance, local audit logs, and customer-specific configuration stay in the customer data plane by default.

The cloud control plane, where used, should hold commercial and operational metadata only: account records, contacts, licences, downloads, update channel metadata, support cases, optional aggregate usage, audit metadata, and entitlement state. It must not receive raw operational customer data by default.

## Personal Data Categories To Review

- lead capture contact details and attribution metadata
- account and billing contact metadata
- support contact details and support-case metadata
- cloud portal user identity, role, and audit metadata
- optional aggregate usage counts from a registered data plane
- first-party event tracking metadata only where the visitor has been told and consent has been collected where required

## Support Data Warning

Customers must not send raw operational records, connector credentials, database dumps, source logs, private keys, access tokens, AI prompt packages, documents, attachments, message bodies, or unredacted support bundles to cloud support by default.

If exceptional support access is needed, agree the scope, retention, redaction, approval path, and deletion expectation in writing first.

## Legal Review Points

- GDPR controller/processor roles
- UK GDPR and Data Protection Act 2018 obligations
- PECR rules for cookies, similar technologies, and marketing communications
- lawful basis for lead capture and first-party event tracking
- retention periods
- international transfer position
- subprocessors and hosting providers
- data subject rights route
- breach notification process

## Draft Wording To Validate

KynticAI Scout processes limited account, lead, support, licence, download, update-channel, and aggregate usage metadata to operate supported paid pilots. Customer operational data remains in the customer data plane by default and is not sent to the cloud control plane unless a separate written support or managed-service arrangement says otherwise.

## Mandatory Legal Review Notes

- This draft is not legal advice.
- Customer data-plane operation keeps raw operational data, connector credentials, selectors, facts, snapshots, and provenance local by default.
- Cloud control-plane processing is limited to metadata unless a separate reviewed arrangement says otherwise.
- Support data must be redacted; raw operational data must not be sent to cloud support by default.
- First-party event tracking needs notice, consent/lawful-basis assessment, minimisation, retention, and opt-out/withdrawal handling.
- GDPR, UK GDPR, and PECR review is required before production.
