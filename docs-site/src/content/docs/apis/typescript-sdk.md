---
title: TypeScript SDK
description: Using the KynticAI Scout TypeScript SDK to query semantic context.
---

The `@kynticai/scout-sdk` package provides a typed TypeScript client for
the KynticAI Scout REST API.

## Installation

```bash
npm install @kynticai/scout-sdk
```

The SDK is published as an ES module and ships with full TypeScript type
declarations.

## Quick Example

```typescript
import { createScoutClient } from '@kynticai/scout-sdk'

const scout = createScoutClient({
  baseUrl: 'http://localhost:8080',
  accessToken: process.env.SCOUT_TOKEN,
})

// Fetch user context
const context = await scout.users.getContext('demo', '123')
console.log(context?.fullName, context?.overallConfidence)

// Read semantic facts
const facts = await scout.facts.getForUser('demo', '123', {
  attributeKey: 'health',
})
console.log(facts)
```

## Client Configuration

| Option | Type | Description |
|---|---|---|
| `baseUrl` | `string` | Scout API base URL |
| `accessToken` | `string` | Bearer token for authentication |
| `tenantSlug` | `string` *(optional)* | Default tenant for all requests |

## Available Methods

### Users

| Method | Description |
|---|---|
| `scout.users.getContext(tenant, userId)` | Fetch full user context |
| `scout.users.list(tenant, options?)` | List users with pagination |

### Facts

| Method | Description |
|---|---|
| `scout.facts.getForUser(tenant, userId, options?)` | Semantic facts for a user |
| `scout.facts.getForAccount(tenant, accountId, options?)` | Facts aggregated for an account |

### Context

| Method | Description |
|---|---|
| `scout.context.recompute(tenant, request)` | Queue a recomputation |
| `scout.context.getSnapshot(tenant, snapshotId)` | Retrieve a context snapshot |

### Connectors

| Method | Description |
|---|---|
| `scout.connectors.catalogue(options?)` | List available connectors |

## Source

The SDK source lives at
[`packages/typescript/scout-sdk`](https://github.com/PaulJMaddison/scout/tree/main/packages/typescript/scout-sdk)
in the Scout repository.

## Next Steps

- [.NET SDK](/apis/dotnet-sdk/) for .NET integration teams.
- [API Overview](/apis/overview/) for the full REST and GraphQL surface.
