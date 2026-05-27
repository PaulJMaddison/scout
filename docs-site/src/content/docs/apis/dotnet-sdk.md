---
title: .NET SDK
description: Using the KynticAI Scout .NET SDK to query semantic context from C# applications.
---

The `KynticAI.Scout.Sdk` NuGet package provides a typed C# client for the
KynticAI Scout REST API.

## Installation

```bash
dotnet add package KynticAI.Scout.Sdk
```

## Quick Example

```csharp
using KynticAI.Scout.Sdk;

var client = new ScoutClient(new ScoutOptions
{
    BaseUrl = "http://localhost:8080",
    AccessToken = Environment.GetEnvironmentVariable("SCOUT_TOKEN"),
});

// Fetch user context
var context = await client.Users.GetContextAsync("demo", "123");
Console.WriteLine($"{context.FullName} — confidence: {context.OverallConfidence}");

// Read semantic facts
var facts = await client.Facts.GetForUserAsync("demo", "123");
foreach (var fact in facts)
{
    Console.WriteLine($"{fact.AttributeKey}: {fact.Confidence}");
}
```

## Client Configuration

| Option | Type | Description |
|---|---|---|
| `BaseUrl` | `string` | Scout API base URL |
| `AccessToken` | `string` | Bearer token for authentication |
| `TenantSlug` | `string?` | Optional default tenant for all requests |

## Available Methods

### Users

| Method | Description |
|---|---|
| `GetContextAsync(tenant, userId)` | Fetch full user context |
| `ListAsync(tenant, options?)` | List users with pagination |

### Facts

| Method | Description |
|---|---|
| `GetForUserAsync(tenant, userId, options?)` | Semantic facts for a user |
| `GetForAccountAsync(tenant, accountId, options?)` | Facts aggregated for an account |

### Context

| Method | Description |
|---|---|
| `RecomputeAsync(tenant, request)` | Queue a recomputation |
| `GetSnapshotAsync(tenant, snapshotId)` | Retrieve a context snapshot |

### Connectors

| Method | Description |
|---|---|
| `GetCatalogueAsync(options?)` | List available connectors |

## Source

The SDK source lives at
[`src/KynticAI.Scout.Sdk`](https://github.com/PaulJMaddison/scout/tree/main/src/KynticAI.Scout.Sdk)
in the Scout repository.

## Next Steps

- [TypeScript SDK](/apis/typescript-sdk/) for Node.js and browser integrations.
- [API Overview](/apis/overview/) for the full REST and GraphQL surface.
