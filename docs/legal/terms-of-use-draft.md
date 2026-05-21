# Terms Of Use Draft

This is a non-lawyer drafting aid for legal review. It is not legal advice. Production terms must be reviewed for the legal entity, open-source licence posture, paid pilot contract, support obligations, data protection position, acceptable use, and liability limits.

## Draft Scope

KynticAI Scout provides open-core context infrastructure and may provide supported paid pilot services. It turns existing business data into governed semantic context for customer-owned AI tools, workflows, apps, reports, and agents.

The current commercial offer is a supported paid pilot, not a complete self-serve SaaS.

## Customer Data Plane

Customers are responsible for the operational data, credentials, source systems, selectors, context facts, local audit logs, and connector configuration in their customer data plane unless a separate managed-service agreement says otherwise.

The cloud control plane, if used, is intended for commercial and operational metadata such as accounts, licences, downloads, support, update channels, aggregate usage, and entitlement status. It must not receive raw operational data by default.

## Acceptable Use Draft Points

- do not upload secrets, private keys, connector credentials, database dumps, or raw operational customer data to public forms or support channels
- do not use the software to bypass customer consent, role-based access, or data protection controls
- do not claim vendor-certified connectors unless a written certification exists
- do not represent the current paid pilot as complete self-serve SaaS
- preserve open-source licence notices when using the public repo

## Support Data Warning

Customers must redact support material before sharing it. Raw source rows, message bodies, documents, attachments, prompt packages, local databases, and credentials should not be sent to cloud support by default.

## Review Required

Review UK GDPR, PECR, consumer/business terms, open-source notices, paid pilot services wording, warranty disclaimers, limitation of liability, export controls, and security incident notification before production.

## Mandatory Legal Review Notes

- This draft is not legal advice.
- Customer data-plane operation keeps raw operational data, connector credentials, selectors, facts, snapshots, and provenance local by default.
- Cloud control-plane processing is limited to commercial and operational metadata unless separately reviewed.
- Support data must be redacted; raw operational data must not be sent to cloud support by default.
- First-party event tracking needs notice, consent/lawful-basis assessment, minimisation, retention, and opt-out/withdrawal handling.
- GDPR, UK GDPR, and PECR review is required before production.
