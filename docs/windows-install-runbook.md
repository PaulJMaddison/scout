# Windows Install Runbook

Use this for a Windows Server or Windows workstation rehearsal of the customer data plane.

## Prerequisites

- .NET SDK/runtime matching `global.json`
- PostgreSQL client tools for backup/restore checks
- IIS, Windows Service, container runtime, or approved process supervisor
- access to the customer secret store
- persistent directory for Data Protection keys

## Steps

1. Restore/build from the reviewed branch or release tag.
2. Create PostgreSQL databases and apply migrations.
3. Store environment variables in the approved host mechanism, not in git.
4. Set `DataProtection__KeyRingPath` to a backed-up NTFS directory with restricted ACLs.
5. Configure admin credentials and least-privilege API clients.
6. Install enterprise packages only if the licence entitles them.
7. Register with the cloud control plane only if the pilot uses it.
8. Run `scripts\check-production-env.ps1`.
9. Run health checks and a selector/connector smoke test.
10. Confirm logs, backups, support bundle redaction, and rollback.

## Required Checks

```powershell
.\scripts\check-production-env.ps1 -EnvFile .env.production.local
Invoke-RestMethod https://<data-plane-host>/health/live
Invoke-RestMethod https://<data-plane-host>/health/ready
```

Run selector preview, event-ingestion authentication, audit read, backup dry-run, restore rehearsal, and support bundle redaction before first customer use.

## Environment And Secrets

Set PostgreSQL connection strings, signing keys, licence file path, API clients, connector credential references, and Data Protection paths through the approved Windows host/secret mechanism. Do not store production values in checked-in files.

## Common Failure Modes

- service account cannot read the Data Protection key directory
- IIS/container environment variables differ from the shell used for preflight
- migrations were not run against the intended PostgreSQL database
- connector credential is inline instead of a vault reference
- admin/API client has broader scopes than needed

## Rollback

- stop the service
- restore the previous package/container
- restore the database only if migrations are not backwards compatible
- preserve audit and incident notes
- rotate any exposed credential
