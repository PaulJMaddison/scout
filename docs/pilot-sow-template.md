# Paid Pilot Statement Of Work Template

This template is a commercial and delivery starting point only. It is not legal advice and must be reviewed by the parties' solicitors before signature.

## 1. Parties And Scope

This Statement of Work is between `[Customer legal name]` and `[Supplier legal name]` for a time-boxed Universal Context Layer paid pilot. The pilot will prove one agreed workflow using a customer-owned UCL data plane and the source systems listed in this SOW.

The pilot does not create a general self-serve SaaS subscription unless a separate agreement says so.

## 2. Pilot Objectives

- prove that existing customer data can be mapped into trusted semantic context
- keep systems of record in place
- expose governed context to one agreed downstream consumer
- validate confidence, freshness, provenance, audit, and masking expectations
- agree a practical rollout, support, and enterprise connector recommendation

## 3. Source Systems In Scope

| Source system | Access method | Environment | Data categories | Owner |
| --- | --- | --- | --- | --- |
| `[System 1]` | `[SQL, PostgreSQL, REST, CSV export, other]` | `[sandbox, staging, production read-only]` | `[commercial/product/support/etc.]` | `[Customer owner]` |
| `[System 2]` | `[Access method]` | `[Environment]` | `[Data categories]` | `[Customer owner]` |

Only the systems listed above are in scope. Additional systems require change control.

## 4. Semantic Attributes In Scope

| Attribute | Purpose | Source evidence | Freshness expectation |
| --- | --- | --- | --- |
| `[attributeKey]` | `[Buyer outcome supported]` | `[Fields/events/exports]` | `[for example 24 hours]` |
| `[attributeKey]` | `[Buyer outcome supported]` | `[Fields/events/exports]` | `[Freshness]` |

Attributes must include confidence, freshness, explanation, and provenance in the resulting context facts.

## 5. Connector Assumptions

- Open-core pilot work will use generic SQL/PostgreSQL, REST, CSV, mock-safe, or exported data paths where practical.
- Vendor-specific paid connectors are not included unless explicitly listed in this SOW and delivered from a private enterprise module.
- Customer credentials will be least-privilege and supplied through the customer's approved secret route.
- The supplier will not ask for permanent access to raw operational data outside the agreed data plane.

## 6. Deliverables

- pilot architecture note
- production-style install rehearsal record
- source connector configuration for the agreed path
- semantic attribute definitions
- selector mappings
- context facts and context snapshot for the agreed entity or workflow
- REST, GraphQL, or SDK lookup example
- provenance and audit review
- support and handover notes
- final playback with rollout recommendation

## 7. Implementation Phases

1. Discovery and access confirmation.
2. Data-plane setup and production rehearsal.
3. Source onboarding and sample data validation.
4. Semantic model and selector implementation.
5. Context snapshot and API lookup validation.
6. Security, privacy, support, and handover review.
7. Playback and next-step recommendation.

## 8. Customer Responsibilities

- provide business owner, technical owner, and security/privacy contact
- approve source systems, data categories, and success criteria
- provide safe source access or approved exports
- own backup and restore of customer-owned environments unless separately agreed
- approve credential storage, rotation, and offboarding process
- provide timely review of mappings, context output, and pilot acceptance

## 9. Supplier Responsibilities

- configure and support the UCL pilot implementation within the agreed scope
- implement or configure agreed open-core connector paths
- document selectors, semantic attributes, provenance, and API access
- avoid committing customer secrets, raw operational data, logs, support bundles, or generated licence files
- identify gaps that need enterprise connector or private control-plane scope
- provide handover and rollout recommendation

## 10. Security And Privacy Responsibilities

- Customer remains controller or owner of its operational data unless the legal agreement states otherwise.
- UCL data-plane source records, credentials, context facts, snapshots, and local audit logs remain in the customer-controlled data plane by default.
- Hosted or private control-plane services should receive commercial metadata only by default, such as account, licence, support, download, update, entitlement, and optional aggregate usage metadata.
- Both parties will agree masking, retention, audit access, and support bundle handling before customer-facing use.

## 11. Data Processing Assumptions

- Source data is limited to the fields and exports approved for the pilot.
- Free-text bodies, documents, attachments, message bodies, and highly sensitive data are excluded unless explicitly approved in writing.
- Support bundles exclude secrets, key rings, raw source records, connector credentials, local databases, and unnecessary PII by default.
- Any production data processing must be supported by the customer's lawful basis and internal approvals.

## 12. Acceptance Criteria

The pilot is accepted when:

- the agreed source path reads approved source data
- selectors map source data into agreed semantic attributes
- context facts include value, confidence, freshness, explanation, and provenance
- a context snapshot is created for the agreed entity or workflow
- one downstream consumer can retrieve context through the agreed API route
- audit/provenance records are visible to authorised operators
- handover documentation and remaining gaps have been delivered

## 13. Support Model

Support channel: `[email/shared channel/ticketing route]`

Support hours: `[UK business hours or agreed window]`

Named contacts: `[Customer contacts]`, `[Supplier contacts]`

Severity targets are placeholders until agreed in the commercial agreement:

- Severity 1: pilot environment unavailable for agreed playback or critical workflow validation.
- Severity 2: major connector, selector, or API issue blocks agreed pilot progress.
- Severity 3: non-blocking defect or documentation issue.
- Severity 4: question, enhancement, or future-scope request.

## 14. Exclusions

- unmanaged production operations
- unlimited connector implementation
- self-serve SaaS account management
- live payment-provider billing
- production SSO/SCIM/SAML unless separately scoped
- formal penetration testing or certification unless separately procured
- legal, tax, regulatory, or data protection advice

## 15. Change Control

Changes to source systems, semantic attributes, downstream consumers, timeline, support expectations, or production responsibilities require written approval from both parties. The supplier will provide impact on timing, fee, risk, and acceptance criteria before work proceeds.

## 16. Pricing Placeholders

Pilot fee: `[fixed fee or range]`

Expenses: `[included, pre-approved only, or not applicable]`

Optional extension rate: `[day rate, weekly rate, or fixed extension package]`

Ongoing support or enterprise connector pricing: `[to be scoped after pilot playback]`

## 17. Legal Review Disclaimer

This SOW template is provided for commercial scoping and delivery planning. Final agreement terms, liability, intellectual property, data protection, confidentiality, payment, warranty, and termination provisions require solicitor review.
