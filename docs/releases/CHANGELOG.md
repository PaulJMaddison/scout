# Changelog

Public KynticAI Scout changes are documented in this file. Private package changes should stay in private changelogs.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note:** Each repository also maintains its own root-level `CHANGELOG.md` with
> repo-specific detail. This file provides the public Scout release view.

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

Public Scout release.

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

### Private Package Coordination

- Private package changes are tracked in private changelogs and are not documented in the public repo.

---

## [2.3.0] - 2026-05-12

Public Scout release.

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

### Private Package Coordination

- Private package changes are tracked in private changelogs and are not documented in the public repo.

---

## Template

Use this template when adding a new release entry:

```markdown
## [X.Y.Z] - YYYY-MM-DD

Public Scout release.

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

### Private Package Coordination
- Keep private package details in private changelogs.
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
