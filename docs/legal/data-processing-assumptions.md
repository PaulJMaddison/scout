# Data Processing Assumptions

This document is not legal advice. It is a practical assumptions list for solicitor and data protection review before a paid pilot.

## Default Position

Universal Context Layer is designed around a customer-owned data plane. Raw operational data, connector credentials, context facts, context snapshots, selectors, and local audit logs stay in the customer-controlled environment by default.

The hosted or private control plane, if used, should manage commercial metadata only by default. It should not require raw customer operational data.

## Data Categories

The pilot should classify each source field before use:

- commercial account metadata
- product usage summaries
- support status summaries
- billing status summaries
- CRM-style opportunity or contact metadata
- operational workflow state
- identifiers and contact details
- special category or highly sensitive data, if any

Message bodies, document bodies, attachments, detailed ticket descriptions, and free-text notes are excluded unless explicitly approved.

## Roles And Responsibilities

Customer responsibilities:

- confirm lawful basis and internal approvals
- approve source fields and masking rules
- own source credentials and rotation
- own customer environment backups unless separately agreed
- approve support bundle export
- decide retention and deletion expectations

Supplier responsibilities:

- process only agreed pilot data
- avoid committing secrets or raw data
- keep provenance visible
- document connector, selector, and context output behaviour
- report suspected incidents through the agreed route

## Backups, Restore, Export, And Delete

The customer should own backup and restore for the customer data plane unless the SOW says otherwise. Restore rehearsals should include both the context-layer database and any customer-ops/source database used by the pilot.

Offboarding should define:

- export format for agreed semantic configuration and context metadata
- deletion or return of support bundles
- licence expiry or revocation
- credential revocation
- removal of temporary access

## Legal Review

A solicitor should review controller/processor roles, international transfer assumptions, data processing agreement terms, retention, audit rights, and incident notification obligations.
