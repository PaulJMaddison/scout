# Linux Install Runbook

Use this for a Linux VM, container host, or Kubernetes-style rehearsal of the customer data plane.

## Prerequisites

- .NET runtime or approved container image
- PostgreSQL client tools
- secret store or platform environment variables
- persistent mounted path for Data Protection keys
- logging sink and backup target

## Steps

1. Build from the reviewed branch or release tag.
2. Configure PostgreSQL databases and migrations.
3. Mount Data Protection key storage at a backed-up path such as `/var/lib/ucl/data-protection-keys`.
4. Provide secrets through the host platform, not checked-in `.env` files.
5. Set `VITE_DEMO_FALLBACK=false` for customer-facing frontend builds.
6. Install entitled enterprise packages if required.
7. Register the data plane with cloud only using aggregate-safe metadata.
8. Run `scripts/check-production-env.sh`.
9. Run health, readiness, selector, connector, backup, and restore checks.

## Required Checks

```bash
./scripts/check-production-env.sh .env.production.local
curl -fsS https://<data-plane-host>/health/live
curl -fsS https://<data-plane-host>/health/ready
```

Run selector preview, event-ingestion authentication, audit read, backup dry-run, restore rehearsal, and support bundle redaction before first customer use.

## Logs And Backup

Send structured logs to the customer's approved sink. Do not log secrets, connection strings, source rows, context packages, message bodies, documents, or attachments. Back up PostgreSQL and Data Protection keys before go-live and rehearse restore.

## Environment And Secrets

Set PostgreSQL connection strings, signing keys, licence file path, API clients, connector credential references, and Data Protection paths through the platform secret store, systemd environment file, or orchestrator secret mechanism. Do not store production values in checked-in files.

## Common Failure Modes

- mounted Data Protection key path is not writable or backed up
- container env differs from the shell used for preflight
- migrations were not run against the intended PostgreSQL database
- connector credential is inline instead of a vault reference
- admin/API client has broader scopes than needed

## Rollback

Keep the previous container/image available. Roll back application first; restore database only if required by migration incompatibility and approved by the incident owner.
