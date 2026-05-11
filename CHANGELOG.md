# Changelog

All notable changes to this project will be documented in this file.

The format is inspired by Keep a Changelog and this project follows semantic versioning.

## [Unreleased]

### Fixed

- Capped percentage selector outputs so formula-based semantic attributes cannot display impossible values above 100%.
- Updated the expansion potential demo selector and Bootstrap Studio blueprint to use a realistic capped score.
- Hardened the Windows reset script so it stops repo API processes before deleting SQLite demo databases.

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
