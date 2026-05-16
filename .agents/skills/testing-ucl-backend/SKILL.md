---
name: testing-ucl-backend
description: Test the UCL open-source backend end-to-end. Use when verifying .NET SDK, API, or script changes.
---

# Testing UCL Backend

## Prerequisites

- .NET 10 SDK installed at `/home/ubuntu/.dotnet` (or via `scripts/ensure-dotnet.sh`)
- `PATH` must include `/home/ubuntu/.dotnet`
- Node.js (for frontend/demo scripts)

## Build

```bash
export PATH="/home/ubuntu/.dotnet:$PATH"
dotnet build ContextLayer.slnx
```

## Test Suite

Three test projects, 73+ tests total:

```bash
# All tests
dotnet test ContextLayer.slnx

# SDK tests only (fastest, good for URI/HTTP pipeline changes)
dotnet test tests/ContextLayer.Sdk.Tests/

# Unit tests
dotnet test tests/ContextLayer.UnitTests/

# Integration tests (slowest, ~1 min, uses WebApplicationFactory)
dotnet test tests/ContextLayer.IntegrationTests/
```

## Running the Backend Locally

SQLite mode (no Docker needed):
```bash
./scripts/start-backend.sh --seed-demo-data
```

This starts the API at `http://127.0.0.1:5198` with demo data seeded.

- Health: `GET /health`
- REST API: `GET /api/v1/...`
- GraphQL: `POST /graphql`
- Swagger: `GET /swagger`

### Demo Credentials
- Email: `admin@contextlayer.local`
- Password: `DemoAdmin123!`
- Tenant: `demo`

### Login to get a token
```bash
curl -X POST http://127.0.0.1:5198/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"demo","email":"admin@contextlayer.local","password":"DemoAdmin123!"}'
```

## Script Permissions

Existing `.sh` scripts may not have execute permission after clone. Run:
```bash
chmod +x scripts/*.sh
```

## Known Cross-Platform Issues

- `Uri.TryCreate(path, UriKind.Absolute)` behaves differently on Linux vs Windows. Paths starting with `/` are treated as `file:///` URIs on Linux. The fix in `ContextLayerHttpPipeline.BuildUri()` adds `&& absolute.Scheme != Uri.UriSchemeFile`.
- `realpath -m` (GNU coreutils) may not work on stock macOS — needs a fallback if macOS support is required.
- PowerShell scripts reference `C:\` paths — Bash equivalents use relative sibling paths (`../universalcontextlayer-enterprise`).

## Cleanup

Stop the backend after testing:
```bash
kill $(cat .backend-runtime/api.pid)
```
