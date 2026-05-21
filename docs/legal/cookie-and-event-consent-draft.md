# Cookie And Event Consent Draft

This is a non-lawyer drafting aid for legal review. It is not legal advice and must not be used in production until GDPR, UK GDPR, PECR, cookie, analytics, and marketing rules have been reviewed for the live site.

## Default Position

Only strictly necessary cookies or storage should run before consent. First-party event tracking for marketing, conversion attribution, or product analytics needs a clear notice and a consent or lawful-basis assessment before production.

## Customer Data Plane Boundary

First-party public-site events may be used to understand interest in KynticAI Scout. They are not the same as customer operational data. Raw customer source records, connector credentials, context facts, selector output, prompt packages, support bundles, documents, message bodies, and attachments must not be sent to cloud event tracking by default.

## Consent Requirements

Before enabling first-party event tracking:

- identify each event name and field
- classify whether fields can identify a person
- avoid collecting free-text content
- avoid collecting raw customer operational data
- explain the purpose in the notice
- collect consent where PECR/GDPR requires it
- honour reject and withdraw choices
- retain event data only for the agreed period
- document the processor/subprocessor path

## Safe Event Fields

Prefer coarse metadata:

- page path
- campaign code
- referrer class
- consent state
- timestamp
- browser family
- approximate country/region where lawful and necessary

Avoid:

- emails in URLs
- customer names
- source IDs
- message or document text
- database query output
- connector payloads
- prompt content
- secrets, tokens, and keys

## Support Warning

Support cases and support bundles must not be used as an analytics sink. Customers must not send raw operational data to cloud support by default.

## Mandatory Legal Review Notes

- This draft is not legal advice.
- Customer data-plane operation keeps raw operational data, connector credentials, selectors, facts, snapshots, and provenance local by default.
- Cloud control-plane processing is limited to account, licence, download, update, support, entitlement, lead, audit, and aggregate usage metadata unless separately reviewed.
- Support data must be redacted; raw operational data must not be sent to cloud support by default.
- First-party event tracking requires a GDPR/PECR review before production.
