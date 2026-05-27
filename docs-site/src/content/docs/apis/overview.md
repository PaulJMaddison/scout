---
title: API Overview
description: An overview of the KynticAI Scout API surfaces — REST, GraphQL, and SDKs.
---

KynticAI Scout exposes context through three complementary surfaces: a REST
API, a GraphQL API, and typed client SDKs for TypeScript and .NET.

## REST API (v1)

The REST API follows standard resource conventions. All context endpoints
are tenant-scoped and require a bearer token.

### Key Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/context/users/{id}?tenantSlug=…` | User context lookup |
| `GET` | `/api/v1/context/accounts/{id}?tenantSlug=…` | Account context lookup |
| `GET` | `/api/v1/context/users/{id}/facts?tenantSlug=…` | Semantic facts for a user |
| `GET` | `/api/v1/context/snapshots/{id}?tenantSlug=…` | Retrieve a context snapshot |
| `POST` | `/api/v1/context/recompute?tenantSlug=…` | Queue a context recomputation |
| `GET` | `/api/v1/connectors/catalogue` | List available connectors |
| `POST` | `/api/v1/selectors/preview?tenantSlug=…` | Preview a selector |
| `POST` | `/api/v1/selectors/validate?tenantSlug=…` | Validate a selector draft |

### Authentication

Obtain a bearer token by logging in or exchanging client credentials:

```bash
# Interactive login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"tenantSlug":"demo","email":"admin@scout.local","password":"DemoAdmin123!"}'

# Machine-to-machine token exchange
curl -X POST http://localhost:8080/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grantType": "client_credentials",
    "clientId": "<client-id>",
    "clientSecret": "<client-secret>",
    "scope": "context:read context:write"
  }'
```

Use the returned `accessToken` as a `Bearer` token in subsequent requests.

### API Documentation UI

When `Platform__EnableOpenApi=true` (the default for development), browse
the full reference:

| UI | URL |
|---|---|
| **Scalar** (recommended) | [http://localhost:8080/api-docs](http://localhost:8080/api-docs) |
| **Swagger UI** | [http://localhost:8080/swagger](http://localhost:8080/swagger) |

## GraphQL API

The GraphQL API is powered by [Hot Chocolate](https://chillicream.com/docs/hotchocolate)
and exposes the same context surfaces as REST.

**Endpoint:** `http://localhost:8080/graphql`

An interactive GraphQL IDE (Banana Cake Pop) is available at the same URL
in a browser. Set the `Authorization: Bearer <token>` header to
authenticate.

### Example Query

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

## SDKs

Typed client libraries wrap the REST and GraphQL APIs for common
development environments:

- [TypeScript SDK](/apis/typescript-sdk/) — `@kynticai/scout-sdk`
- [.NET SDK](/apis/dotnet-sdk/) — `KynticAI.Scout.Sdk`

## Scopes

API clients are assigned scopes that control access. The canonical scopes
are:

| Scope | Description |
|---|---|
| `context:read` | Read user and account context, facts, and snapshots |
| `context:write` | Trigger recomputation and write context data |
| `selectors:write` | Create and update selector definitions |
| `events:ingest` | Submit events for context recomputation |
| `audit:read` | Read audit and provenance records |

## Next Steps

- [TypeScript SDK reference](/apis/typescript-sdk/)
- [.NET SDK reference](/apis/dotnet-sdk/)
- [Connector Basics](/concepts/connector-basics/)
