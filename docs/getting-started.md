# Getting Started with KynticAI Scout

This guide covers three ways to get a running Scout instance: local development with the .NET SDK, Docker with SQLite (quickest), and Docker with PostgreSQL (production-like).

---

## Prerequisites

You need **one** of the following:

| Approach | Requirements |
|---|---|
| **Local (.NET SDK)** | .NET 10.0 SDK, Node.js 22+ (or let the setup scripts install repo-local copies) |
| **Docker** | Docker Engine 24+ and Docker Compose v2 |

---

## Option 1 — Local Quick Start (SQLite)

Three commands to a running demo:

```bash
git clone https://github.com/PaulJMaddison/scout.git
cd scout
sh ./scripts/setup-demo.sh   # downloads repo-local runtimes, seeds demo data (~2 min)
sh ./scripts/start-demo.sh   # starts API on :5198 + web app on :5173
```

Then open [http://127.0.0.1:5173](http://127.0.0.1:5173) and log in:

| Field | Value |
|---|---|
| Tenant | `demo` |
| Email | `admin@scout.local` |
| Password | `DemoAdmin123!` |

> **Windows?** Use `./scripts/setup-demo.ps1` and `./scripts/start-demo.ps1` instead.

---

## Option 2 — Docker Quick Start (SQLite)

Run the API in a single container with no external dependencies:

```bash
git clone https://github.com/PaulJMaddison/scout.git
cd scout
docker compose -f deploy/docker-compose.yml up scout-api --build
```

The API starts on [http://localhost:8080](http://localhost:8080) with seeded demo data.

To customise settings, copy the example environment file first:

```bash
cp deploy/.env.example deploy/.env
# edit deploy/.env as needed
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up scout-api --build
```

---

## Option 3 — Production Setup with PostgreSQL

Use the `postgres` profile to start PostgreSQL 16 (with pgvector) alongside the API:

```bash
cp deploy/.env.example deploy/.env
```

Edit `deploy/.env` for production values:

```env
PLATFORM_MODE=BackendOnly
SEED_DEMO_DATA=false
AUTH_SIGNING_KEY=<replace-with-48+-byte-random-secret>
POSTGRES_PASSWORD=<strong-password>
ENABLE_OPENAPI=false
```

Then start all services:

```bash
docker compose -f deploy/docker-compose.yml --env-file deploy/.env --profile postgres up --build
```

The API starts on [http://localhost:8080](http://localhost:8080) backed by PostgreSQL.

---

## First API Calls

Once the API is running, try these requests to verify everything works.

### Health Check

```bash
curl http://localhost:8080/health/ready
```

Expected response:

```json
{"status":"ok","service":"KynticAI.Scout.Api","checks":[{"name":"scout-db","status":"ok"},{"name":"customer-ops-db","status":"ok"}]}
```

### Platform Configuration

```bash
curl http://localhost:8080/api/platform/config
```

Returns the effective runtime mode, enabled features, and endpoint configuration.

### Authenticate and Query Context

Most API and GraphQL endpoints require a JWT token. Log in first:

```bash
# 1. Log in with demo credentials
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"tenantSlug":"demo","email":"admin@scout.local","password":"DemoAdmin123!"}' \
  | jq -r '.accessToken')

# 2. Fetch user context (REST)
curl http://localhost:8080/api/rest/tenants/demo/users/123/context \
  -H "Authorization: Bearer $TOKEN"

# 3. GraphQL introspection
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"{ __schema { queryType { name } } }"}'
```

Or open [http://localhost:8080/graphql](http://localhost:8080/graphql) in a browser for the Banana Cake Pop GraphQL IDE (you will need to set the `Authorization: Bearer <token>` header).

### OpenAPI / Swagger

When `Platform__EnableOpenApi=true` (the default for development), browse the full API reference:

| UI | URL |
|---|---|
| **Scalar** (recommended) | [http://localhost:8080/api-docs](http://localhost:8080/api-docs) |
| **Swagger UI** | [http://localhost:8080/swagger](http://localhost:8080/swagger) |

See [API Documentation](api/README.md) for details on exporting the spec and authentication.

---

## SDK Usage

### TypeScript

```bash
npm install @kynticai/scout-sdk
```

```typescript
import { createScoutClient } from '@kynticai/scout-sdk'

const scout = createScoutClient({
  baseUrl: 'http://localhost:8080',
  accessToken: process.env.SCOUT_TOKEN,
})

const context = await scout.users.getContext('demo', '123')
console.log(context?.fullName, context?.overallConfidence)

const facts = await scout.facts.getForUser('demo', '123', { attributeKey: 'health' })
console.log(facts)
```

### .NET

```bash
dotnet add package KynticAI.Scout.Sdk
```

```csharp
using KynticAI.Scout.Sdk;

var client = new ScoutClient(new ScoutOptions
{
    BaseUrl = "http://localhost:8080",
    AccessToken = Environment.GetEnvironmentVariable("SCOUT_TOKEN"),
});

var context = await client.Users.GetContextAsync("demo", "123");
Console.WriteLine($"{context.FullName} — confidence: {context.OverallConfidence}");
```

---

## Building the Docker Image Manually

```bash
docker build -t scout-api -f src/KynticAI.Scout.Api/Dockerfile .
docker run --rm -p 8080:8080 \
  -e Database__Provider=Sqlite \
  -e "ConnectionStrings__Scout=Data Source=/var/lib/scout/scout_context.db" \
  -e "ConnectionStrings__CustomerOps=Data Source=/var/lib/scout/customer_ops.db" \
  -e Bootstrap__ApplyMigrationsOnStartup=true \
  -e Bootstrap__SeedDemoData=true \
  -e "Auth__SigningKey=change-me-to-at-least-32-bytes-random" \
  scout-api
```

---

## Running Tests

```bash
# If you ran setup-demo.sh, use the repo-local SDK:
./.dotnet/dotnet test KynticAI.Scout.slnx

# Or with a global .NET 10 SDK on your PATH:
dotnet test KynticAI.Scout.slnx
```

```bash
# TypeScript SDK tests
cd packages/typescript/scout-sdk
npm install && npm test

# Web app tests and lint (from repo root)
cd apps/web
npm install && npm run lint && npm test
```

---

## Configuration Reference

See the full list of environment variables in [deploy/.env.example](../deploy/.env.example) and the root [.env.example](../.env.example).

Key settings:

| Variable | Description | Default |
|---|---|---|
| `Platform__Mode` | `BackendOnly`, `LocalDemo`, or `SaaS` | `BackendOnly` |
| `Database__Provider` | `Sqlite` or `Postgres` | `Sqlite` |
| `Bootstrap__SeedDemoData` | Seed fictional demo data on startup | `false` |
| `Auth__SigningKey` | JWT signing key (48+ bytes for production) | dev placeholder |
| `Platform__EnableOpenApi` | Enable API docs at `/api-docs` and `/swagger` | `true` |
| `Platform__EnableGraphQl` | Enable GraphQL endpoint at `/graphql` | `true` |

---

## Further Reading

- [Public API Contract](public-api-contract.md) — GraphQL, REST, SDK, auth, pagination, error contracts
- [Connector Plugin Model](connector-plugin-model.md) — how to build and register connectors
- [Connector Authoring Guide](connector-authoring.md) — step-by-step guide to writing a new connector
- [Connector Test Harness](connector-test-harness.md) — local-only validation tool for connector authors
- [Connector Manifest Validator](connector-manifest-validator.md) — public manifest schema and CLI
- [Customer Data Plane](customer-data-plane.md) — where data lives and what the customer owns
- [Integration Layer](integration-layer.md) — how source systems and consumers integrate
- [SDK Development](sdk-development.md) — guide for TypeScript and .NET SDK contributors
- [Production Install Checklist](production-install-checklist.md) — pre-deployment safety checks
- [Hosted Deployment](hosted-deployment.md) — Render Blueprint and cloud hosting
