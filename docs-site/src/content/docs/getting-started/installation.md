---
title: Installation
description: How to install and set up KynticAI Scout for local development.
---

## Prerequisites

You need **one** of the following:

| Approach | Requirements |
|---|---|
| **Local (.NET SDK)** | .NET 10.0 SDK, Node.js 22+ (or let the setup scripts install repo-local copies) |
| **Docker** | Docker Engine 24+ and Docker Compose v2 |

No global .NET SDK or Node.js install is strictly required — the provided
setup scripts download repo-local runtimes automatically.

## Clone the Repository

```bash
git clone https://github.com/PaulJMaddison/scout.git
cd scout
```

## Option 1 — Local Install (Recommended)

The setup script downloads repo-local .NET and Node.js runtimes, installs
npm dependencies, builds the solution, seeds demo data into a local SQLite
database, and prepares the admin console.

### Linux / macOS

```bash
sh ./scripts/setup-demo.sh
```

### Windows (PowerShell)

```powershell
./scripts/setup-demo.ps1
```

This typically takes around two minutes on a fresh clone.

## Option 2 — Docker

Run the API in a single container with no external dependencies:

```bash
docker compose -f deploy/docker-compose.yml up scout-api --build
```

The API starts on [http://localhost:8080](http://localhost:8080) with seeded
demo data and a SQLite database.

### Docker with PostgreSQL

For a production-like setup with PostgreSQL 16 (including pgvector):

```bash
cp deploy/.env.example deploy/.env
# Edit deploy/.env with production values
docker compose -f deploy/docker-compose.yml --env-file deploy/.env --profile postgres up --build
```

## Verify the Installation

After setup completes, check that the API is responding:

```bash
curl http://localhost:8080/health/ready
```

Expected response:

```json
{
  "status": "ok",
  "service": "KynticAI.Scout.Api",
  "checks": [
    { "name": "scout-db", "status": "ok" },
    { "name": "customer-ops-db", "status": "ok" }
  ]
}
```

## What's Next?

Follow the [Quickstart](/getting-started/quickstart/) to start the demo
and make your first API calls.
