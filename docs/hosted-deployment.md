# Hosted PostgreSQL Deployment

This guide describes the first production-like deployment shape for the public KynticAI Scout repo: React as a static site, ASP.NET Core as a Docker web service, PostgreSQL as managed databases, and SQLite only for local demo mode.

It is not the full future managed control plane. The open-core backend still operates as the customer data plane: connectors, selectors, context facts, provenance, audit logs, and credentials stay in the customer-controlled environment unless the customer explicitly exports them.

## Target Architecture

- `apps/web` builds to static files with `npm run build` and can be hosted by Render Static Sites, Netlify, Cloudflare Pages, S3/CloudFront, or the bundled nginx image.
- `src/KynticAI.Scout.Api` builds with `src/KynticAI.Scout.Api/Dockerfile` and listens on port `8080`.
- Hosted mode uses PostgreSQL for both `ScoutDbContext` and `CustomerOpsDbContext`.
- Local demo mode remains SQLite-backed and does not require Docker.

## Render Deployment

The repository includes a root `render.yaml` blueprint with:

- `kynticai-scout-web`: static React site built from `apps/web`.
- `kynticai-scout-api`: Docker web service with `/health/ready` as the readiness check.
- `scout-db`: managed PostgreSQL database for tenants, users, workspaces, selectors, audit, billing, onboarding, API clients, and context snapshots.
- `scout-customer-ops-db`: managed PostgreSQL database for source/demo operational data.

After creating the Render Blueprint, set these secrets and verify generated service URLs:

```text
Auth__SigningKey=<48+ byte random secret>
Cors__AllowedOrigins__0=https://<frontend-domain>
SaaS__PublicBaseUrl=https://<api-domain>
ControlPlane__Enabled=false
Licence__Mode=Community
Licence__FilePath=/var/lib/scout/licence.json
DataProtection__KeyRingPath=/var/lib/scout/data-protection-keys
DataProtection__RequirePersistentKeys=true
VITE_API_BASE_URL=https://<api-domain>
VITE_GRAPHQL_ENDPOINT=https://<api-domain>/graphql
VITE_PILOT_LEAD_ENDPOINT=https://<cloud-api-domain>/api/v1/crm/leads
VITE_TURNSTILE_SITE_KEY=<optional-turnstile-site-key>
VITE_DEMO_FALLBACK=false
Telemetry__OtlpEndpoint=<optional OTLP endpoint>
```

Render supports Blueprint fields such as `runtime: docker`, `runtime: static`, `preDeployCommand`, `healthCheckPath`, `rootDir`, and managed Postgres `fromDatabase` environment variables. If you rename services, update the frontend API URL and backend CORS origin at the same time.

## Backend Docker Image

Build locally:

```powershell
docker build -f src/KynticAI.Scout.Api/Dockerfile -t scout-api .
```

Run in hosted-style mode:

```powershell
docker run --rm -p 8080:8080 `
  -e ASPNETCORE_ENVIRONMENT=Production `
  -e Platform__Mode=SaaS `
  -e Database__Provider=Postgres `
  -e Bootstrap__ApplyMigrationsOnStartup=false `
  -e Bootstrap__SeedDemoData=false `
  -e ConnectionStrings__Scout="<managed PostgreSQL connection string>" `
  -e ConnectionStrings__CustomerOps="<managed PostgreSQL connection string>" `
  -e Auth__Issuer=Scout `
  -e Auth__Audience=KynticAI.Scout.Api `
  -e Auth__SigningKey="<48+ byte random secret>" `
  -e DataProtection__KeyRingPath="/var/lib/scout/data-protection-keys" `
  -e DataProtection__RequirePersistentKeys=true `
  -v scout-data-protection-keys:/var/lib/scout/data-protection-keys `
  -e Cors__AllowedOrigins__0="https://<frontend-domain>" `
  scout-api
```

## Database Migration Command

Hosted environments should migrate before starting a new application version:

```powershell
docker run --rm `
  -e ASPNETCORE_ENVIRONMENT=Production `
  -e Platform__Mode=SaaS `
  -e Database__Provider=Postgres `
  -e Bootstrap__ApplyMigrationsOnStartup=true `
  -e Bootstrap__SeedDemoData=false `
  -e ConnectionStrings__Scout="<managed PostgreSQL connection string>" `
  -e ConnectionStrings__CustomerOps="<managed PostgreSQL connection string>" `
  -e Auth__SigningKey="<48+ byte random secret>" `
  -e DataProtection__KeyRingPath="/var/lib/scout/data-protection-keys" `
  -e DataProtection__RequirePersistentKeys=true `
  -v scout-data-protection-keys:/var/lib/scout/data-protection-keys `
  scout-api migrate
```

The `migrate` command applies EF Core migrations and seeds safe connector catalogue metadata only. It does not seed demo accounts or fictional customer records.

## Demo Seed Command

Demo seeding is intentionally limited to `LocalDemo`/`Demo` mode:

```powershell
.\scripts\setup-demo.ps1
```

or:

```powershell
ASPNETCORE_ENVIRONMENT=Development `
Platform__Mode=LocalDemo `
Database__Provider=Sqlite `
Bootstrap__ApplyMigrationsOnStartup=true `
Bootstrap__SeedDemoData=true `
dotnet run --project src/KynticAI.Scout.Api -- seed-demo
```

Do not set `Bootstrap__SeedDemoData=true` in hosted SaaS deployments.

## Frontend Static Build

For local development, the frontend defaults to `http://localhost:5198`. For static production hosting, set the build-time API URL explicitly:

```powershell
cd apps/web
$env:VITE_API_BASE_URL="https://<api-domain>"
$env:VITE_GRAPHQL_ENDPOINT="https://<api-domain>/graphql"
$env:VITE_DEMO_FALLBACK="false"
npm ci
npm run build
```

If the frontend and API are served from the same origin, set `VITE_API_BASE_URL=` and `VITE_GRAPHQL_ENDPOINT=/graphql`.

For paid-ad traffic, set `VITE_PILOT_LEAD_ENDPOINT` to the private cloud/control-plane mini CRM endpoint and, if using Cloudflare Turnstile, set `VITE_TURNSTILE_SITE_KEY` at build time. The cloud API must hold the matching Turnstile secret in secure configuration.

## Health Checks

- `/health/live`: process liveness, no database dependency.
- `/health/ready`: readiness check with both database connections.
- `/health`: diagnostic summary with database status.
- `/api/v1/health`: versioned REST health endpoint.

Use `/health/ready` for Render and other rolling deployment platforms.

## Production Settings

- `ASPNETCORE_ENVIRONMENT=Production`
- `Platform__Mode=SaaS`
- `Database__Provider=Postgres`
- `Bootstrap__ApplyMigrationsOnStartup=false`
- `Bootstrap__SeedDemoData=false`
- `Auth__SigningKey`: high-entropy secret, at least 48 bytes recommended.
- `DataProtection__KeyRingPath`: persistent file-system path or mounted volume for ASP.NET Data Protection keys.
- `DataProtection__RequirePersistentKeys=true`: required for Production/SaaS mode so protected connector credentials remain readable after restarts.
- `Cors__AllowedOrigins__0`: exact frontend origin, no trailing slash.
- `RateLimits__*`: tune auth and GraphQL limits per plan and deployment size.
- `Telemetry__OtlpEndpoint`: optional OTLP collector endpoint.
- `ControlPlane__Enabled=false`: keep disabled unless a private hosted control-plane service is available.
- `Licence__Mode=Community`: default for the public repo; paid self-hosted deployments can point `Licence__FilePath` at a mounted local licence file.

Production uses secure cookie policy, HSTS, forwarded proxy headers, JWT signing-key validation, persistent Data Protection key storage, JSON console logging, explicit CORS origins, and configurable rate limits.

The bundled web nginx image sets `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and a baseline `Content-Security-Policy` that permits the optional Cloudflare Turnstile script/frame. If hosting on Render Static Sites, Netlify, Cloudflare Pages, or S3/CloudFront, reproduce equivalent headers in that platform rather than relying on this nginx config.

## Connector Credential Protection

Connector secrets are stored through `IConnectorCredentialStore` as protected references, not plaintext configuration. ASP.NET Data Protection encrypts those stored values. In container or self-hosted deployments the key ring must be persisted, otherwise a restart or new container may be unable to decrypt existing connector credentials.

Use a mounted directory such as `/var/lib/scout/data-protection-keys` and keep it backed up with the application database. Do not copy the key ring into source control or support bundles.

## Logging And OpenTelemetry

Production logs are written to stdout/stderr for the hosting platform to collect. OpenTelemetry tracing and metrics are enabled for ASP.NET Core, outbound HTTP calls, runtime metrics, and background job metrics. Set `Telemetry__OtlpEndpoint` or `OTEL_EXPORTER_OTLP_ENDPOINT` to export to an OTLP collector.

## Backup And Restore

For managed PostgreSQL, prefer the provider's scheduled backups and point-in-time recovery. Keep both databases on the same backup schedule because context snapshots reference source-system records by tenant and external identifiers.

Manual backup:

```bash
pg_dump "$SCOUT_DATABASE_URL" --format=custom --file=scout-context.dump
pg_dump "$CUSTOMER_OPS_DATABASE_URL" --format=custom --file=customer-ops.dump
```

Manual restore into empty databases:

```bash
pg_restore --clean --if-exists --dbname "$SCOUT_DATABASE_URL" scout-context.dump
pg_restore --clean --if-exists --dbname "$CUSTOMER_OPS_DATABASE_URL" customer-ops.dump
```

After restore, run the hosted migration command once, then check `/health/ready` and perform a tenant-scoped smoke test through REST or GraphQL.

## Support Bundle

The public repo does not ship private SLA tooling, but a safe support bundle can be produced manually without including connector credentials or raw customer records:

```bash
mkdir -p support-bundle
curl -H "Authorization: Bearer $ADMIN_TOKEN" "$SCOUT_API/api/platform/config" > support-bundle/platform-config.json
curl -H "Authorization: Bearer $ADMIN_TOKEN" "$SCOUT_API/api/v1/licence/status" > support-bundle/licence-status.json
curl -H "Authorization: Bearer $ADMIN_TOKEN" "$SCOUT_API/api/v1/health" > support-bundle/health.json
curl -H "Authorization: Bearer $ADMIN_TOKEN" "$SCOUT_API/api/v1/audit-events?pageSize=200" > support-bundle/audit-events-redacted.json
tar -czf scout-support-bundle.tgz support-bundle
```

Review the bundle before sharing it. Do not include `.env`, connector credential stores, database dumps, raw source event payloads, context packages, or customer-specific blueprint files unless the customer has explicitly approved that transfer.
