# Next Work Packages

Date: 2026-06-19

## WP4 - Production Enterprise/Fortress Importer

Goal: turn the validated package contract into a production importer CLI/API.

Acceptance:

- Consumes Scout export folders directly.
- Supports progress, cancellation, checkpoints, retry, dead-letter handling, and rollback guidance.
- Requires local embedding provider configuration before vector writes.
- Keeps raw package data and generated vectors in the customer-owned environment.
- Passes xhigh Rust/vector review before release or pilot claims.

## WP5 - Migration Operator UX

Goal: wrap Scout export and Enterprise/Fortress import in a practical operator flow.

Acceptance:

- Provides clear preflight checks.
- Shows scope, record counts, package path, validation findings, and blocked secret fields.
- Produces a customer-safe handoff report.
- Supports no-build execution paths for packaged installs.
- Documents recovery and rerun behaviour.

## WP6 - Cloud Entitlement Operations

Goal: harden the optional Cloud commercial/control-plane layer.

Acceptance:

- Adds dedicated licence suspend/reactivate proof.
- Adds atomic Scout/Fortress/Elite tier movement proof.
- Defines offline grace-token policy and key custody.
- Runs live endpoint proof only with explicit environment approval.
- Keeps Cloud payloads limited to commercial/control-plane metadata and safe aggregate counters.

## WP7 - Production SaaS Readiness

Goal: close the gap between technical upgrade proof and production SaaS claims.

Acceptance:

- Account, billing, licence, support, backup/restore, monitoring, incident, security, legal, and release evidence are documented.
- Cloud full test suite is green or residual blockers are explicitly accepted.
- No marketing or investor wording claims complete self-serve SaaS before the evidence supports it.

## WP8 - Dependency And Security Triage

Goal: clear known non-functional blockers surfaced during WP3.

Acceptance:

- Triage Docker web npm audit output.
- Resolve or explicitly route the Cloud analytics-pixel guard failure.
- Re-run affected builds/tests after fixes.
- Keep third-party analytics and telemetry out of customer data paths unless explicitly approved and safe.

## WP9 - Live Proof Gates

Goal: run carefully scoped live or native proof only when prerequisites are available.

Acceptance:

- Vendor sandbox/live connector proof uses approved credentials and acceptance criteria.
- LanceDB/native-store and pgvector proof use explicit opt-in env vars.
- Hosted Cloud endpoint proof uses explicit approval.
- Results are logged with skipped checks and residual risk.
