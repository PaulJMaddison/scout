---
title: Quickstart
description: Get a working KynticAI Scout demo running in three commands.
---

## Start the Demo

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

This starts:

| Service | URL |
|---|---|
| Admin console | [http://127.0.0.1:5173](http://127.0.0.1:5173) |
| API | [http://127.0.0.1:5198](http://127.0.0.1:5198) |
| GraphQL IDE | [http://127.0.0.1:5198/graphql](http://127.0.0.1:5198/graphql) |
| Health check | [http://127.0.0.1:5198/health/ready](http://127.0.0.1:5198/health/ready) |

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
curl "http://127.0.0.1:5198/api/rest/tenants/demo/users/123/context" \
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
- Explore the [TypeScript SDK](/apis/typescript-sdk/) or [.NET SDK](/apis/dotnet-sdk/).
- Learn about [Connector Basics](/concepts/connector-basics/).
