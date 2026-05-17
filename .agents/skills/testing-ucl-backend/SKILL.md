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

Four test projects, 127+ tests total:

```bash
# All tests
dotnet test ContextLayer.slnx

# SDK tests only (fastest, good for URI/HTTP pipeline changes)
dotnet test tests/ContextLayer.Sdk.Tests/

# Unit tests
dotnet test tests/ContextLayer.UnitTests/

# Integration tests (uses WebApplicationFactory)
dotnet test tests/ContextLayer.IntegrationTests/

# E2E tests (requires running API; start with start-backend.sh first)
dotnet test tests/ContextLayer.E2ETests/
```

## Running the Backend Locally

SQLite mode (no Docker needed):
```bash
./scripts/start-backend.sh --seed-demo-data
```

This starts the API at `http://127.0.0.1:5198` with demo data seeded.

- Health: `GET /health` and `GET /health/live`
- REST API: `GET /api/v1/...`
- GraphQL: `POST /graphql`
- Scalar docs: `GET /api-docs` (interactive API docs UI)
- Swagger: `GET /swagger`
- Root `/` redirects to `/api-docs`

### Demo Credentials

See `README.md` in the repo root for demo tenant, email, and password.

### Login to get a token
```bash
curl -X POST http://127.0.0.1:5198/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"<TENANT>","email":"<EMAIL>","password":"<PASSWORD>"}'
```

Replace `<TENANT>`, `<EMAIL>`, and `<PASSWORD>` with the demo credentials from the README.

## Verifying API Documentation

Scalar (at `/api-docs`) and Swagger (at `/swagger`) need CSP to be skipped for their paths so JS/CSS can load. The CSP exemption is in `Program.cs` — it skips `Content-Security-Policy` for `/api-docs` and `/swagger` prefixes while preserving it for all other paths.

To verify docs are working:
```bash
# CSP should be ABSENT on docs paths
curl -s -D - -o /dev/null http://127.0.0.1:5198/api-docs/ | grep -i content-security-policy
# (should return nothing)

# CSP should be PRESENT on API paths
curl -s -D - -o /dev/null http://127.0.0.1:5198/health/live | grep -i content-security-policy
# Content-Security-Policy: default-src 'none'; ...

# Other security headers should be present on ALL paths
curl -s -D - -o /dev/null http://127.0.0.1:5198/api-docs/ | grep -i x-content-type-options
# X-Content-Type-Options: nosniff
```

If `dotnet run` or `start-backend.sh` uses stale build artifacts, clean and rebuild:
```bash
find src tests -name obj -type d -exec rm -rf {} + 2>/dev/null
dotnet build ContextLayer.slnx
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
