# ContextLayer.Sdk

`ContextLayer.Sdk` is the typed .NET SDK scaffold for Universal Context Layer. It wraps the local/private product API behind stable client interfaces so application teams do not need to hand-roll REST and GraphQL calls during pilots.

This SDK lives in the private product workspace today. Treat it as local/private scaffolding until NuGet publishing is deliberately configured and reviewed.

## SDK Folder Structure

```text
src/ContextLayer.Sdk/
  Abstractions.cs
  ContextLayerClient.cs
  ContextLayerClientOptions.cs
  ContextLayerErrors.cs
  ContextLayerHttpPipeline.cs
  ContextLayerModels.cs
  README.md
tests/ContextLayer.Sdk.Tests/
  ContextLayerClientTests.cs
```

## Supported Capabilities

- authentication
- tenant scoping
- user context lookup
- account context lookup
- context snapshot retrieval
- semantic fact lookup
- selector preview and validation
- context recompute requests
- AI context package retrieval
- audit event lookup
- typed error handling
- retry behavior for transient failures
- request tracing headers

## Install

```bash
dotnet add reference src/ContextLayer.Sdk/ContextLayer.Sdk.csproj
```

## Quick Start

```csharp
using ContextLayer.Sdk;

using var contextLayer = new ContextLayerClient(new ContextLayerClientOptions
{
    BaseUrl = "http://127.0.0.1:5198",
    AccessToken = "<token>"
});

var context = await contextLayer.Users.GetContextAsync("demo", "123");
var facts = await contextLayer.Facts.GetForUserAsync("demo", "123");
var snapshot = await contextLayer.Snapshots.GetLatestForUserAsync("demo", "123");
var snapshotById = await contextLayer.Snapshots.GetByIdAsync("demo", snapshot!.SnapshotId);
var packageResult = await contextLayer.Packages.GetAiContextForUserAsync(
    "demo",
    "123",
    "Generate an account brief for the next renewal call.");
```

## Tenant Scoped Usage

```csharp
var demo = contextLayer.ForTenant("demo");

var context = await demo.Users.GetContextAsync("123");
var account = await demo.Accounts.GetContextAsync("ACC-123");
var facts = await demo.Facts.GetForUserAsync("123");
var auditEvents = await demo.Audit.GetEventsAsync();
```

## Authentication

```csharp
var session = await contextLayer.Auth.LoginAsync(
    new LoginRequest("demo", "admin@contextlayer.local", "DemoAdmin123!"));
```

Or provide a token callback:

```csharp
var client = new ContextLayerClient(new ContextLayerClientOptions
{
    BaseUrl = "http://127.0.0.1:5198",
    AccessTokenProvider = async cancellationToken =>
    {
        return await Task.FromResult("<token>");
    }
});
```

## Selector Preview

```csharp
var preview = await contextLayer.Selectors.PreviewAsync(
    new PreviewSelectorInput(
        "demo",
        "123",
        null,
        new UpsertSelectorDefinitionInput(
            null,
            "demo",
            Guid.Parse("00000000-0000-0000-0000-000000000001"),
            Guid.Parse("00000000-0000-0000-0000-000000000002"),
            "Preferred Channel",
            "Test selector preview.",
            "DIRECT_FIELD_MAPPING",
            "{\"rule\":{\"valuePath\":\"crm.preferredChannel\"}}",
            "Preferred channel {{sourceValue}}.",
            "{\"requiredPaths\":[\"crm.preferredChannel\"]}",
            0.9m,
            60,
            100,
            null)));
```

## Recompute Request

```csharp
var queued = await contextLayer.Recompute.QueueForUserAsync("demo", "123", "crm-webhook");
```

## Error Handling

```csharp
try
{
    var context = await contextLayer.Users.GetContextAsync("demo", "missing-user");
}
catch (ContextLayerException ex)
{
    Console.WriteLine(ex.Code);
    Console.WriteLine(ex.CorrelationId);
}
```

## Local Development

```bash
./.dotnet/dotnet.exe test tests/ContextLayer.Sdk.Tests/ContextLayer.Sdk.Tests.csproj
./.dotnet/dotnet.exe pack src/ContextLayer.Sdk/ContextLayer.Sdk.csproj -c Release
```

The SDK targets the repo-local API started by the demo scripts:

```bash
./scripts/start-demo.ps1
```

## Versioning

- SDK versioning follows the private product line until package publishing is deliberately configured.
- Additive client methods and model fields can ship in minor releases.
- Breaking changes require a major version bump.

## Packaging

- NuGet package id: `ContextLayer.Sdk`
- package output: `src/ContextLayer.Sdk/bin/<Configuration>/`
- symbols: `.snupkg`
- Publishing is not configured as part of this private hardening pass.

## Tests

Current tests cover:

- REST v1 user, account, and snapshot route construction
- tenant-scoped client behavior
- transient retry handling
- typed problem-details error mapping
