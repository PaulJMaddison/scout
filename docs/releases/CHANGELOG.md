# Cross-Repository Changelog

All notable changes across the three KynticAI Scout repositories are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note:** Each repository also maintains its own root-level `CHANGELOG.md` with
> repo-specific detail. This file provides a consolidated cross-repo view for
> coordinated releases.

---

## [Unreleased]

<!-- Add entries here as work is merged to main before the next release. -->

---

## [2.8.0] - 2026-05-21

### Open-Source (`scout`)

#### Changed
- Rebranded the public open-source repository, SDKs, docs, local demo, admin console, package metadata, and screenshots to KynticAI Scout.
- Removed the temporary website build path from the open-source repo so the main company website can become the public web presence.
- Aligned default release readiness checks with `main` as the public readiness branch.

#### Security
- Removed personal contact details from public product surfaces and kept company-level contact defaults.

---

## [2.7.0] - 2026-05-13

Coordinated release across all three repositories.

### Open-Source (`scout`)

#### Added
- Customer data-plane installation and production-readiness runbooks for paid-pilot delivery.
- Commercial readiness, hosting alignment, observability, machine-to-machine identity, support expectation, privacy, cookie/consent, terms, and paid-pilot legal draft documentation.
- Production environment readiness checks for production-style data-plane configuration.
- GitHub Actions CI workflow (build, test, upload results on every push/PR to main).
- GitHub Actions release workflow (build, test, create GitHub Release on `v*` tags).

#### Changed
- Updated public release metadata to `2.7.0`.
- Strengthened the public open-core story around demos, install runbooks, public API/SDK/context package docs, and paid-pilot boundaries.

#### Security
- Reconfirmed that the public repo does not include paid enterprise implementations, private cloud/control-plane implementation, real licence signing keys, customer-specific code, or raw customer operational data.

### Enterprise (`scout-enterprise`)

#### Added
- 25+ vendor adapter seams for connectors: SQL Server, PostgreSQL, REST/CRM, email, chat, calendar, product analytics, work management, and knowledge systems.
- OIDC, SAML, and SCIM identity integrations.
- Credential vault abstractions for Azure Key Vault, AWS Secrets Manager, and HashiCorp Vault.
- Governance modules: data masking, retention policies, compliance exports.
- Deployment packs and observability instrumentation via OpenTelemetry.

#### Changed
- Updated enterprise release metadata to `2.7.0`.
- Expanded commercial readiness and relational query plan validation test coverage to 132 tests.

#### Security
- Maintained metadata-first ingestion defaults across all connector families.
- Ensured support bundles are PII-redacted and secret-free.

### Cloud (`scout-cloud`)

#### Added
- Account management, licensing, and subscription workflows.
- Data-plane registration and heartbeat monitoring.
- Mini CRM for pilot lead tracking.
- React-based cloud portal (`apps/cloud-portal`) for administrative operations.
- Stripe billing integration foundations.
- RSA licence entitlement signing and validation.

#### Changed
- Updated cloud release metadata to `2.7.0`.
- Expanded operations readiness and commercial validation test coverage to 55 tests.

#### Security
- Strict data boundary enforced: no raw customer records, connector credentials, context facts, or operational source data cross into the control plane.

---

## [2.3.0] - 2026-05-12

Coordinated release across all three repositories.

### Open-Source (`scout`)

#### Added
- First-class webhook signing secrets with create, list, rotate, and revoke REST endpoints.
- Public-safe governance hook seam for private enterprise policy injection.
- Canonical API scope contract document and pilot readiness scripts.
- Paid pilot readiness runbook covering PostgreSQL smoke checks, backup/restore rehearsal, support bundle dry runs, upgrade/rollback rehearsal, and customer handover.

#### Changed
- Formalised `context:write` as an official scope.
- Reworded public copy towards paid pilot, customer data plane, and self-hosted language.

#### Security
- Kept the public repository limited to open-core code, public interfaces, and fictional data.
- Extended local artefact ignore coverage for runtime data, logs, keys, and certificates.

### Enterprise (`scout-enterprise`)

#### Added
- SQL Server and PostgreSQL connector implementations with query plan validation.
- Support bundle generation with automatic PII redaction.
- Entitlement flow verification for licence-gated features.

#### Changed
- Standardised selector contract definitions with provenance and freshness metadata.

### Cloud (`scout-cloud`)

#### Added
- Account provisioning and subscription lifecycle APIs.
- Data-plane heartbeat endpoints for health monitoring.
- Update channel management (Stable/Beta release tracks).

#### Changed
- Migrated authentication to CloudAuth scheme for users and data-plane agents.

---

## Template

Use this template when adding a new release entry:

```markdown
## [X.Y.Z] - YYYY-MM-DD

Coordinated release across all three repositories.

### Open-Source (`scout`)

#### Added
- Description of new features or capabilities.

#### Changed
- Description of changes to existing functionality.

#### Fixed
- Description of bug fixes.

#### Removed
- Description of removed features or deprecated items.

#### Security
- Description of security-related changes.

#### Breaking Changes
- Description of breaking changes with migration guidance.

### Enterprise (`scout-enterprise`)

#### Added
-

#### Changed
-

#### Fixed
-

#### Security
-

### Cloud (`scout-cloud`)

#### Added
-

#### Changed
-

#### Fixed
-

#### Security
-
```

### Categories

| Category | Use for |
|---|---|
| **Added** | New features, endpoints, connectors, documentation |
| **Changed** | Changes to existing functionality, behaviour, or configuration |
| **Fixed** | Bug fixes, regression fixes, performance fixes |
| **Removed** | Removed features, deprecated endpoints, deleted files |
| **Security** | Security patches, boundary enforcement, secret hygiene |
| **Breaking Changes** | API contract changes, schema migrations, SDK interface changes that require consumer updates |

### Guidelines

1. Write entries in the **past tense** ("Added", "Fixed", not "Adds", "Fixes").
2. Group entries by repository, then by category.
3. Link to relevant PRs or issues where possible.
4. Note any migration steps required under Breaking Changes.
5. Keep entries concise but specific enough to be actionable.
