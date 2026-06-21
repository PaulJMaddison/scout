# Paid Pilot Setup

This page describes the first operator-assisted Scout pilot setup flow in the open-core repo. It is a public-safe planning and proof surface for a supported paid pilot, not a claim that Scout is complete self-serve SaaS.

## Setup Flow

The `apps/web` console includes a Pilot Setup page for tenant operators. It guides an operator through:

- choosing one pilot outcome, such as revenue conversion, retention risk, support escalation, or product adoption;
- choosing an open-core, local proof, event-contract, or private/customer-specific source path;
- declaring the source owner and purpose;
- marking approved fields/categories in scope;
- marking sensitive fields, message bodies, documents, attachments, credentials, or other categories out of scope;
- recording the retention note, masking note, and sign-off status;
- running the existing connector validation endpoint where an executable open-core plugin is available, or recording a local/private review result where the public repo intentionally has only metadata;
- producing a pilot readiness JSON summary for operator review.

## Data Scope Approval

The first slice uses a local/demo-backed approval shape in the web console. It tracks:

- source owner;
- purpose;
- fields and categories in scope;
- fields and categories out of scope;
- sensitive or PII marker;
- retention note;
- masking note;
- sign-off status.

This is enough for a local paid-pilot rehearsal and for discussing the scope with a customer operator. Before a production-style pilot, signed approval records and dry-run evidence should be persisted in a customer-approved store with audit history, named approvers, timestamps, and export/review controls.

## Connector Readiness

The Connector Catalogue and Pilot Setup surfaces use explicit maturity labels:

- `Executable open-core`: a registered public Scout plugin is available in this build.
- `Mock/local proof`: the path is suitable for deterministic local proof, dry-run, or approved export work.
- `Private/customer-specific`: the path needs scoped paid/private delivery or customer-specific implementation.
- `Placeholder`: catalogue metadata only; no runtime vendor connector ships in the public repo.
- `Not vendor-certified`: the listing must not be read as vendor certification.

Open-core examples such as SQL/PostgreSQL, generic REST, CSV/imports, mock connectors, and provider-neutral event contracts can support the first proof. Vendor-specific CRM, support, warehouse, email, chat, calendar, work-management, or knowledge-system connectors remain metadata-only here unless a scoped private/customer proof implements and validates them outside the public repo.

## Relationship JSON Review

The Relationship JSON Explorer makes the next-action package inspectable before a downstream consumer uses it. Operators can review:

- exact linked data items and citation IDs;
- relationship links and fallback weights;
- attribution paths derived from exact records and citations;
- recommended action, confidence, caveats, and provenance;
- masking decisions and governance rules;
- Scout fallback signals and handoff JSON;
- Cloud aggregate usage payload boundaries.

The open-core Scout fallback output is not canonical private analysis. Advanced relationship-set analysis, attribution-path comparison, outcome matching, and governed JSON handoff can be added by private extensions when included in a paid scope.

## Boundary

The setup flow must not:

- claim complete self-serve SaaS;
- claim vendor-certified connectors;
- move private connector, identity, deployment, or analysis code into the public repo;
- send raw or derived customer intelligence to Cloud;
- use demo fallback data as customer data in a paid or production-style environment.

For production-style pilot readiness, also use the [Production Install Checklist](production-install-checklist.md), [Customer Data Plane](customer-data-plane.md), [Connector Catalogue](connector-marketplace.md), and [Supported Pilot](paid-pilot.md) docs.
