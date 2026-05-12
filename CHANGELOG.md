# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by Keep a Changelog and this project follows semantic versioning.

## [Unreleased]

## [2.3.0] - 2026-05-12

### Added

- Added first-class webhook signing secrets with create, list, rotate, and revoke REST endpoints, hashed storage, workspace scoping, timestamp checks, replay checks, and audit events.
- Added a public-safe governance hook seam so private enterprise policy packages can mask or suppress returned context without placing paid implementation code in the public repository.
- Added a canonical API scope contract document and pilot readiness scripts for local paid-pilot checks without GitHub Actions.
- Added a paid pilot readiness runbook covering PostgreSQL smoke checks, backup/restore rehearsal, support bundle dry runs, upgrade/rollback rehearsal, and customer handover.

### Changed

- Formalised `context:write` as an official scope and aligned public docs, SDK examples, and REST behaviour around the canonical scope set.
- Reworded public copy towards paid pilot, customer data plane, self-hosted context infrastructure, and future/private cloud control-plane language.
- Kept legacy API-key webhook HMAC compatibility, but marked dedicated webhook signing secrets as the recommended production model.

### Security

- Kept the public repository limited to open-core code, public interfaces, no-op/default implementations, placeholders, docs, scripts, and examples with fictional data.
- Reconfirmed that paid enterprise connector implementations, private governance policy implementation, and hosted cloud/control-plane implementation remain outside the public repository.
- Extended local artefact ignore coverage for runtime data, logs, generated licences, keys, certificates, and support bundles.

## [2.2.0] - 2026-05-12

### Added

- Added public-safe catalogue placeholders and docs for paid/private email, chat, calendar, product analytics, work management, and knowledge-system connector families.
- Added release notes for the v2.2.0 public open-core release aligned with the private enterprise connector-suite release.
- Added paid pilot documentation, a production install checklist, and an anonymised ERP platform implementation pattern for buyer proof.

### Changed

- Clarified that real Microsoft 365 / Outlook, Gmail / Google Workspace, Slack, Microsoft Teams, Outlook Calendar, Google Calendar, Segment, Amplitude, Mixpanel, PostHog, Jira, Linear, Confluence, Notion, SharePoint, and Google Drive implementations live in private enterprise packages.
- Folded in public data-plane hardening for REST/GraphQL scope checks, correlation-friendly errors, and webhook safety documentation.
- Updated pricing, commercial, docs, connector catalogue, open-core, and integrations copy for a paid-pilot-first commercial motion rather than complete self-serve SaaS.
- Updated public version metadata to `2.2.0`.

### Security

- Reconfirmed that the public repo contains placeholders/interfaces only for paid enterprise connectors and does not include private connector implementation code.
- Documented the metadata-only and explicit opt-in safety model for communication and knowledge connectors.
- Added production guidance that `VITE_DEMO_FALLBACK=true` is local-demo only and must not mask API failures in customer environments.

## [2.1.1] - 2026-05-11

### Security

- Pinned the released TanStack frontend dependencies to exact known-installed versions after a reported npm supply-chain advisory affecting later `@tanstack/*` package versions.
- Kept the locked web app on `@tanstack/react-query` `5.100.9`, `@tanstack/react-query-devtools` `5.100.9`, `@tanstack/react-router` `1.169.2`, and `@tanstack/react-router-devtools` `1.166.13`.
- Documented that release builds should use `npm ci` with the committed lockfile rather than floating dependency ranges during active supply-chain incidents.

## [2.1.0] - 2026-05-11

### Added

- Prepared the public open-core relaunch with clearer commercial boundaries across README, docs, and marketing copy.
- Added release notes for the coordinated public, enterprise, and cloud repository split.
- Clarified context consumer patterns for AI tools, workflows, reports, applications, copilots, agents, and non-AI automation.
- Documented product positioning for CEOs, CTOs, product teams, and engineers.

### Changed

- Updated public version metadata to `2.1.0`.
- Reframed public SaaS wording as SaaS/control-plane foundations rather than hosted SaaS implementation.
- Clarified that paid enterprise connectors, SSO/SAML, SCIM, vault integrations, advanced governance, compliance exports, deployment packs, SLA tooling, hosted account management, billing, licence portals, download portals, update channels, support portals, and cloud operations are paid/private offerings outside the public repo.
- Tightened website and README copy so enterprise/cloud options are marketed without implying their code ships in open source.

### Security

- Re-audited the public boundary so real enterprise/cloud implementation code, private signing keys, vendor credentials, customer-specific code, and raw customer data remain out of the public repository.
- Kept blueprint import as user-provided JSON; it does not call external AI APIs.

## [2.0.0] - 2026-05-11

### Added

- Repositioned Universal Context Layer as open-core context infrastructure rather than primarily an AI app.
- Added marketing pages for the platform, use cases, integrations, open-core model, pricing/deployment, docs, demo, and FAQ.
- Added a self-hosted customer admin console covering organisation settings, workspace settings, users and roles, API clients, usage and limits, connector catalogue, webhook events, blueprint imports, data governance, audit export, and licence/update status.
- Added SaaS-control-plane foundations for tenants, workspaces, users, subscriptions, API clients, connectors, selector definitions, context packages, audit events, billing usage, onboarding, feature flags, and hosted-mode configuration.
- Added customer-owned data-plane architecture documentation and configuration for optional control-plane connection settings, local licence files, offline grace periods, and community mode.
- Added production-minded JWT authentication, API client authentication, API key hashing, rotation, revocation, and last-used tracking.
- Added versioned REST API v1 endpoints with tenant/workspace scoping, API key auth, pagination, filtering, correlation IDs, consistent error responses, and OpenAPI metadata.
- Added webhook/source-system event ingestion with signatures, idempotency, event history, selector trigger matching, recompute job creation, dead-letter handling, and audit events.
- Added connector marketplace skeleton with open-core connectors, demo-safe mock connectors, enterprise/vendor placeholders, health-check and credential abstractions, and clear public repo boundaries.
- Added AI-assisted blueprint JSON import with schema, validation, preview, apply, REST/GraphQL endpoints, audit events, and Bootstrap Studio UI.
- Added billing and usage metering foundations with Free, Pro, Business, and Enterprise plan metadata without a live payment-provider integration.
- Added TypeScript and .NET SDK scaffolds for context consumers.
- Added PostgreSQL hosted-mode, Docker, Render deployment guidance, backup/restore documentation, support bundle guidance, and local SQLite setup preservation.
- Added maintainer guardrails for the open core boundary across the README, contributing guide, security guidance, roadmap, and boundary-specific documentation.
- Added public enterprise extension contracts and safe default implementations so future private enterprise packages can plug into the open source core without forking it.
- Added explicit documentation for the expected public, enterprise, and optional future cloud repository split.

### Changed

- Updated README, docs, and website copy to explain that UCL creates governed context for customer-owned systems, reports, workflows, copilots, agents, and apps.
- Clarified that the AI sales playground is one example consumer, not the required product architecture.
- Documented the split between a future hosted control plane and the self-hosted customer data plane, including what data must stay local.
- Clarified the commercial model so the public repository reads as a credible open source core rather than a stripped-down teaser.
- Reworked connector wording and examples to stay generic in the public repo rather than implying that premium commercial connectors ship here today.
- Replaced real-looking demo organisations and domains with clearly fictional names and reserved example domains.
- Updated public package and app descriptions so they describe the project as an open source core, demo, and admin console rather than a commercial-only demo.

### Removed

- Removed an internal strategy document that did not belong in the public repository.
- Removed stale v1.2 release notes because the productisation scope is now released as v2.0.0.

### Security

- Added tenant and workspace scoping checks across admin, GraphQL, REST, API-client, and event-ingestion flows.
- Added permission-denied audit coverage for blocked role changes and cross-tenant access attempts.
- Preserved the rule that raw customer operational data, connector credentials, context facts, and prompt packages do not need to leave the customer data plane.
- Tightened public-repo hygiene by standardising development-only signing key placeholders, extending ignore rules for likely private artefacts, and reinforcing guidance against committing secrets, customer data, or paid enterprise implementation code.

### Fixed

- Capped percentage selector outputs so formula-based semantic attributes cannot display impossible values above 100%.
- Updated the expansion potential demo selector and Bootstrap Studio blueprint to use a realistic capped score.
- Hardened the Windows reset script so it stops repo API processes before deleting SQLite demo databases.
- Hardened REST admin tenant resolution so cross-tenant admin reads are rejected instead of silently falling back to the actor tenant.

## [1.1.0] - 2026-05-10

### Added

- Outcome-led page positioning across the product so every screen explains what it does for the user before showing configuration, data, or controls.
- More detailed fresh-laptop setup documentation for the default SQLite demo path, repo-local .NET and Node bootstrap, restart, reset, and verification commands.

### Changed

- Rewrote the landing hero to clearly state that Context Layer turns existing business data into AI-ready context.
- Updated dashboard, data source, selector builder, schema registry, customer context, AI playground, audit, bootstrap, and walkthrough page headers to lead with user value.
- Refreshed README screenshots from the latest running SQLite-backed UI.

### Removed

- Removed GitHub Actions workflows so the repository does not consume paid GitHub Actions minutes.

## [1.0.0] - 2026-05-10

### Added

- Production-ready local demo flow with dual-database operational and semantic context separation.
- Default SQLite laptop install path with repo-local .NET 10 and Node.js bootstrap so the demo can run without Docker, PostgreSQL, or preinstalled developer tooling.
- Optional Docker/PostgreSQL mode for production-like package demos and observability.
- Executive walkthrough pages covering legacy source signals, semantic timelines, AI interaction timelines, rollout, ROI, and governance.
- Bootstrap Studio for Codex or Claude assisted source-system analysis, prompt generation, blueprint upload, and import into Context Layer.
- Responsive regression coverage for login, mobile, and core product routes.

### Changed

- Promoted the project to `1.0.0` as the first complete commercial demo release.
- Reframed local setup around a zero-friction SQLite quick start while preserving the two-database architecture and PostgreSQL path.
- Refined the login experience so laptop and desktop viewports fit without scrolling, while mobile remains naturally scrollable.
- Improved the customer profile People panel, provenance panels, JSON viewers, and app shell responsiveness.
- Refreshed README screenshots from the live running app.

### Fixed

- Fixed prompt-template audit serialization cycles during Bootstrap Studio imports.
- Fixed clipped profile rows, overflowing code panels, taskbar-unsafe demo browser sizing, and repeated responsive layout regressions.

## [0.1.1] - 2026-05-09

### Added

- Executive demo storytelling flow at `/demo` covering business value, technical integration posture, and rollout credibility.
- Cross-system UCL event timeline showing how raw operational events become semantic business meaning.
- AI-assisted onboarding narrative showing how tools like Codex or Claude can draft a discovery report, semantic blueprint, and selector candidates for admin review.
- Refreshed screenshot gallery including executive demo, UCL timeline, and AI bootstrap visuals.

### Changed

- Reframed the demo from CEO-only language to broader executive and technical decision-maker language.
- Improved the customer context viewer so the transformation from source events to semantic interpretation is directly visible.
- Updated release metadata and package versions to `0.1.1`.

### Release notes

- This follow-up release is focused on making the product easier to sell and evaluate: clearer narrative, stronger technical credibility, and better documentation for live demos.

## [0.1.0] - 2026-05-09

### Added

- Initial open-source release of the Universal Context Layer commercial demo.
- Dual-database architecture demonstrating separation between operational source data and semantic AI context.
- React frontend for dashboard, data sources, selector builder, schema registry, context viewer, AI playground, and audit log.
- ASP.NET Core + GraphQL backend with selector execution, grounded context generation, and seed data.
- Demo bootstrap scripts, Docker Compose configuration, and seeded executive walkthrough data.
- Screenshot-driven README and architecture documentation.

### Release notes

- Licensed under MIT for permissive reuse, modification, and commercial experimentation.
- Prepared as the first public release for local demos, evaluation, and extension by other teams.
