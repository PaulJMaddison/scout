# Getting Started with Universal Context Layer

This guide covers three ways to get a running UCL instance: local development with the .NET SDK, Docker with SQLite (quickest), and Docker with PostgreSQL (production-like).

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
git clone https://github.com/PaulJMaddison/universalcontextlayer.git
cd universalcontextlayer
sh ./scripts/setup-demo.sh   # downloads repo-local runtimes, seeds demo data (~2 min)
sh ./scripts/start-demo.sh   # starts API on :5198 + web app on :5173
```

Then open [http://127.0.0.1:5173](http://127.0.0.1:5173) and log in:

| Field | Value |
|---|---|
| Tenant | `demo` |
| Email | `admin@contextlayer.local` |
| Password | `DemoAdmin123!` |

> **Windows?** Use `./scripts/setup-demo.ps1` and `./scripts/start-demo.ps1` instead.

---

## Option 2 — Docker Quick Start (SQLite)

Run the API in a single container with no external dependencies:

```bash
git clone https://github.com/PaulJMaddison/universalcontextlayer.git
cd universalcontextlayer
docker compose -f deploy/docker-compose.yml up ucl-api --build
```

The API starts on [http://localhost:8080](http://localhost:8080) with seeded demo data.

To customise settings, copy the example environment file first:

```bash
cp deploy/.env.example deploy/.env
# edit deploy/.env as needed
docker compose -f deploy/docker-compose.yml --env-file deploy/.env up ucl-api --build
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
{"status":"ok","service":"ContextLayer.Api","checks":[{"name":"context-layer-db","status":"ok"},{"name":"customer-ops-db","status":"ok"}]}
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
  -d '{"tenantSlug":"demo","email":"admin@contextlayer.local","password":"DemoAdmin123!"}' \
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

When `Platform__EnableOpenApi=true` (the default for development), browse the full API reference at:

```
http://localhost:8080/swagger
```

---

## SDK Usage

### TypeScript

```bash
npm install @universalcontextlayer/sdk
```

```typescript
import { createContextLayerClient } from '@universalcontextlayer/sdk'

const ucl = createContextLayerClient({
  baseUrl: 'http://localhost:8080',
  accessToken: process.env.CONTEXT_LAYER_TOKEN,
})

const context = await ucl.users.getContext('demo', '123')
console.log(context?.fullName, context?.overallConfidence)

const facts = await ucl.facts.getForUser('demo', '123', { attributeKey: 'health' })
console.log(facts)
```

### .NET

```bash
dotnet add package ContextLayer.Sdk
```

```csharp
using ContextLayer.Sdk;

var client = new ContextLayerClient(new ContextLayerOptions
{
    BaseUrl = "http://localhost:8080",
    AccessToken = Environment.GetEnvironmentVariable("CONTEXT_LAYER_TOKEN"),
});

var context = await client.Users.GetContextAsync("demo", "123");
Console.WriteLine($"{context.FullName} — confidence: {context.OverallConfidence}");
```

---

## Building the Docker Image Manually

```bash
docker build -t ucl-api -f src/ContextLayer.Api/Dockerfile .
docker run --rm -p 8080:8080 \
  -e Database__Provider=Sqlite \
  -e "ConnectionStrings__ContextLayer=Data Source=/var/lib/ucl/context_layer.db" \
  -e "ConnectionStrings__CustomerOps=Data Source=/var/lib/ucl/customer_ops.db" \
  -e Bootstrap__ApplyMigrationsOnStartup=true \
  -e Bootstrap__SeedDemoData=true \
  -e "Auth__SigningKey=change-me-to-at-least-32-bytes-random" \
  ucl-api
```

---

## Running Tests

```bash
# With repo-local .NET SDK
dotnet test ContextLayer.slnx

# Or using the setup script's SDK
./.dotnet/dotnet test ContextLayer.slnx
```

All 73 core tests should pass.

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
| `Platform__EnableOpenApi` | Enable Swagger UI at `/swagger` | `true` |
| `Platform__EnableGraphQl` | Enable GraphQL endpoint at `/graphql` | `true` |

---

## Further Reading

- [Public API Contract](public-api-contract.md) — GraphQL, REST, SDK, auth, pagination, error contracts
- [Connector Plugin Model](connector-plugin-model.md) — how to build and register connectors
- [Customer Data Plane](customer-data-plane.md) — where data lives and what the customer owns
- [Integration Layer](integration-layer.md) — how source systems and consumers integrate
- [SDK Development](sdk-development.md) — guide for TypeScript and .NET SDK contributors
- [Production Install Checklist](production-install-checklist.md) — pre-deployment safety checks
- [Hosted Deployment](hosted-deployment.md) — Render Blueprint and cloud hosting
