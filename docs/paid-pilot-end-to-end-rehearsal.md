# Paid Pilot End-To-End Rehearsal

This is a local-only rehearsal runbook. It proves the supported paid pilot flow without real hosting, real domains, real TLS, real payment credentials, real licence signing keys, real customer secrets, or real customer connector endpoints.

## Repositories

- Public open-core/customer data plane: this repository.
- Private extension repository: provide a local path with `SCOUT_PRIVATE_EXTENSION_REPO` or the script parameter.
- Private control-plane repository: provide a local path with `SCOUT_PRIVATE_CONTROL_REPO` or the script parameter.

## Preflight

```powershell
$env:SCOUT_PRIVATE_EXTENSION_REPO = "<local-private-extension-repo>"
$env:SCOUT_PRIVATE_CONTROL_REPO = "<local-private-control-plane-repo>"

.\scripts\paid-pilot-local-rehearsal.ps1
.\scripts\paid-pilot-rehearsal-check.ps1
.\scripts\check-release-alignment.ps1
.\scripts\check-production-env.ps1 -EnvFile .env.production.local
```

Use placeholder local files only. Do not paste real customer credentials into these repos.

## Rehearsal Steps

1. Public website and local demo explain the product.
   - Run the company website build and the public local demo.
   - Confirm the narrative says: we do not build the brain, we build the nervous system.
   - Confirm it presents a supported paid pilot, not complete self-serve SaaS.

2. Lead capture path is tested locally.
   - If the cloud API is running locally, submit a fictional lead only.
   - If the public docs/demo app is not wired to the Cloud API in the current build, document the API request that the form will make and keep this as a manual step.

3. Cloud account is created.
   - Use the cloud local seed/demo operator account.
   - Create a fictional customer account in the cloud portal/API.

4. Subscription or entitlement is set manually.
   - Use manual/noop billing.
   - Record plan, pilot dates, and entitled package names.
   - Do not configure live payment credentials.

5. Licence is issued.
   - Use local development signing keys only.
   - Keep generated licence files outside git.
   - Record the licence ID and entitled features.

6. Data-plane registration token is created.
   - Create a short-lived registration token in the cloud control plane.
   - Do not include raw customer data in registration metadata.

7. Customer data plane registers and heartbeats.
   - Register the local public data plane against the local cloud API if available.
   - Heartbeat payload must include deployment status and aggregate counts only.

8. Enterprise package delivery method is selected.
   - Choose private NuGet, GitHub Packages, signed ZIP/bundle, private repo collaborator access, or deployment-pack handoff.
   - Record the selected method and customer entitlement.

9. SQL/PostgreSQL connector dry-run runs.
   - Use fictional local configs.
   - Run the private extension connector smoke script from the explicitly configured private extension repository.
   - Never print connection strings or inline credentials.

10. Selector/context snapshot path is exercised.
   - In the customer data plane, run a selector preview and create/read a context snapshot where the local demo supports it.
   - If a live connector host is not available, mark the connector execution as manual and attach the validated config summary.

11. Aggregate usage is reported to cloud.
   - Send aggregate usage only: counts, health, version, and feature totals.
   - Confirm cloud rejects obvious raw operational data.

12. Support case is opened.
   - Open a fictional support case in the cloud portal/API.
   - Confirm severity, owner, customer contact, and data-plane reference are present.

13. Audit trail exists.
   - Verify audit events for account, licence, registration, heartbeat, download/update check, support case, and usage reporting.

14. No raw operational data is sent to cloud.
   - Review registration metadata, usage payloads, support case text, logs, and screenshots.
   - Anything containing source rows, message bodies, documents, attachments, prompt packages, local database dumps, keys, or connector credentials fails the rehearsal.

15. M2M and webhook smoke is exercised locally.
   - Run `.\scripts\m2m-and-webhook-smoke.ps1` only against a local seeded backend.
   - Confirm machine token request, scoped API call, signed event acceptance, bad signature rejection, and replay rejection.

16. Licence install rehearsal is checked.
   - Download a development licence from the local cloud portal.
   - Place it in an ignored local path.
   - Run `.\scripts\licence-install-rehearsal.ps1`.
   - Verify the public data plane licence status endpoint, or record the schema mismatch before the first customer install.

## Evidence To Keep

- command transcript with secrets redacted
- branch alignment output
- production env preflight output
- cloud live-hosting preflight output
- account/licence/registration IDs from local fake data
- connector config validation summary
- support case reference
- audit event references
- explicit list of manual steps that remain
