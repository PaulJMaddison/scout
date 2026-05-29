---
title: Quickstart
description: Get a working KynticAI Scout demo running locally.
---

## Pick a Run Mode

Scout supports two local paths:

| Path | Use it when |
|---|---|
| Docker API | You want the fastest API-only smoke test with no local .NET setup. |
| Local demo scripts | You want the API plus the React admin console and seeded demo data. |

## Docker API

From the repository root:

```bash
docker compose -f deploy/docker-compose.yml up -d scout-api --build
```

Verify the API:

```bash
curl http://127.0.0.1:8080/health/ready
```

The Docker API exposes:

| Service | URL |
|---|---|
| API | [http://127.0.0.1:8080](http://127.0.0.1:8080) |
| GraphQL IDE | [http://127.0.0.1:8080/graphql](http://127.0.0.1:8080/graphql) |
| REST API docs | [http://127.0.0.1:8080/api-docs](http://127.0.0.1:8080/api-docs) |
| Health check | [http://127.0.0.1:8080/health/ready](http://127.0.0.1:8080/health/ready) |

## Full Local Demo

After [installing](/getting-started/installation/) Scout, start the API and
admin console:

### Linux / macOS

```bash
sh ./scripts/start-demo.sh
```

### Windows (PowerShell)

```powershell
./scripts/start-demo.ps1
```

This starts the admin console at [http://127.0.0.1:5173](http://127.0.0.1:5173)
and the API at [http://127.0.0.1:5198](http://127.0.0.1:5198).

The examples below use the script ports. For Docker, replace `5198` with
`8080`.

## Log In

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) and log in with the
demo credentials:

| Field | Value |
|---|---|
| Tenant | `demo` |
| Email | `admin@scout.local` |
| Password | `DemoAdmin123!` |

## Make Your First API Call

Authenticate and fetch user context via the REST API:

```bash
# 1. Get a bearer token
TOKEN=$(curl -s -X POST http://127.0.0.1:5198/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"tenantSlug":"demo","email":"admin@scout.local","password":"DemoAdmin123!"}' \
  | jq -r '.accessToken')

# 2. Fetch user context
curl "http://127.0.0.1:5198/api/v1/context/users/123?tenantSlug=demo" \
  -H "Authorization: Bearer $TOKEN"
```

## Try GraphQL

Query the same context through GraphQL:

```graphql
query {
  userContext(input: { tenantSlug: "demo", externalUserId: "123" }) {
    fullName
    companyName
    summary
    overallConfidence
    facts {
      attributeKey
      confidence
      explanation
    }
  }
}
```

Send this query to `http://127.0.0.1:5198/graphql` with an `Authorization:
Bearer <token>` header, or use the built-in Banana Cake Pop GraphQL IDE at
the same URL.

## Explore the Demo Data

The seeded demo includes realistic B2B SaaS data: 2 tenants, 30 accounts,
80+ contacts, 200 sales activities, 560 product usage rows, and 100 support
tickets.

Recommended records to explore:

| Tenant | User ID | Name | Company |
|---|---|---|---|
| `demo` | `123` | Avery Stone | Larkspur Logistics Group |
| `demo` | `126` | Priya Nwosu | Brindle Care Network |
| `summit` | `132` | Elena Petrov | Emberforge Robotics |

## What's Next?

- Read the [API Overview](/apis/overview/) for the full surface area.
- Explore the [TypeScript SDK](/sdks/typescript/) or [.NET SDK](/sdks/dotnet/).
- Learn about [Connector Authoring](/connectors/authoring/).
