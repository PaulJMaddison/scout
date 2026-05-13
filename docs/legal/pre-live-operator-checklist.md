# Pre-Live Operator Checklist

This document is not legal advice. It is a practical checklist for solicitor, accountant, and data-protection review before the website or paid-pilot offer is promoted publicly.

## Operator Details

Before launch, replace template wording with the real operating details that will contract with customers:

- legal trading name
- company number, if incorporated
- registered office or trading address, if applicable
- VAT status, if applicable
- contact email for sales, privacy, and support
- contracting entity for invoices and SOWs
- payment terms and accepted payment methods

Do not run paid adverts with placeholder operator details on the privacy, terms, SOW, invoice, or email footer.

## Privacy And Data Protection

Confirm before collecting lead or customer data:

- whether ICO registration is required in the UK
- controller/processor role for website enquiries, cloud CRM data, and customer data-plane work
- retention period for lead data, rejected leads, support cases, audit logs, and pilot records
- lawful basis for processing paid-pilot enquiries
- whether subprocessors include hosting, email, analytics, CAPTCHA, CRM, or observability providers
- whether international transfer terms are needed

The hosted cloud/control-plane mini CRM should store commercial metadata only by default. Raw customer operational data, source records, connector credentials, context facts, snapshots, and prompt packages belong in the customer-owned data plane unless the customer signs a specific secure transfer route.

## Lead Capture

The public website form should disclose:

- name, work email, company, source-system description, and target workflow
- campaign attribution such as UTM parameters, referrer, and landing page path
- abuse-review data as salted IP and user-agent hashes
- optional Turnstile or hCaptcha processing if enabled
- support or sales email notifications if used

Avoid asking prospects for secrets, credentials, connection strings, raw exports, or sensitive operational data in the form.

## Commercial Documents

Before first signature, ask a solicitor to review:

- pilot agreement or SOW
- privacy policy
- data processing assumptions or DPA
- security and privacy appendix
- support model and incident response language
- licence, usage, payment, suspension, and termination terms
- offboarding, export, delete, and backup ownership language

The templates in this repository are useful preparation material, not final legal documents.
# Mandatory Legal Review Notes

- This draft is not legal advice.
- Customer data-plane operation keeps raw operational data, connector credentials, selectors, facts, snapshots, and provenance local by default.
- Cloud control-plane processing is limited to account, licence, download, update, support, entitlement, lead, audit, and aggregate usage metadata unless separately reviewed.
- Support data must be redacted; raw operational data must not be sent to cloud support by default.
- First-party event tracking needs notice, consent/lawful-basis assessment, minimisation, retention, and opt-out/withdrawal handling.
- GDPR, UK GDPR, and PECR review is required before production.
