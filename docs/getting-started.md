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

Expected response: `Healthy`

### List Tenants

```bash
curl http://localhost:8080/api/v1/tenants
```

Returns the available tenants (the demo seed creates `demo` and `summit`).

### GraphQL Introspection

```bash
curl -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { queryType { name } types { name } } }"}'
```

Or open [http://localhost:8080/graphql](http://localhost:8080/graphql) in a browser for the Banana Cake Pop GraphQL IDE.

### Get User Context (authenticated)

```bash
# 1. Obtain a token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"grantType":"client_credentials","clientId":"crm-service","clientSecret":"replace-me","scope":"context:read context:write"}' \
  | jq -r '.accessToken')

# 2. Fetch user context
curl "http://localhost:8080/api/v1/context/users/123?tenantSlug=demo" \
  -H "Authorization: Bearer $TOKEN"
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
