# ContextLayer.Sdk

`ContextLayer.Sdk` is the typed .NET SDK scaffold for Universal Context Layer. It wraps the local/private product API behind stable client interfaces so application teams do not need to hand-roll REST and GraphQL calls during pilots.

This SDK is public open-core scaffolding for pilots and local integration work. Treat NuGet publishing, semantic version promises, and managed support as deliberate future release work.

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
- machine-to-machine token exchange
- tenant scoping
- user context lookup
- account context lookup
- context snapshot retrieval
- semantic fact lookup with REST filtering and pagination options
- selector preview and validation
- context recompute requests
- AI context package retrieval
- provider-neutral source-system event ingestion
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
var facts = await contextLayer.Facts.GetForUserAsync(
    "demo",
    "123",
    new ContextFactLookupOptions("health", 1, 25));
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
var facts = await demo.Facts.GetForUserAsync(
    "123",
    new ContextFactLookupOptions("health"));
var auditEvents = await demo.Audit.GetEventsAsync();
```

## Authentication

```csharp
var session = await contextLayer.Auth.LoginAsync(
    new LoginRequest("demo", "admin@contextlayer.local", "DemoAdmin123!"));
```

Machine-to-machine clients can exchange credentials for a scoped bearer token:

```csharp
var token = await contextLayer.Auth.GetMachineTokenAsync(
    new MachineTokenRequest(
        "client_credentials",
        Environment.GetEnvironmentVariable("UCL_CLIENT_ID")!,
        Environment.GetEnvironmentVariable("UCL_CLIENT_SECRET")!,
        "context:read context:write audit:read"));
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

## Source-System Events

This posts to the open-core provider-neutral event endpoint. It does not implement paid vendor handlers or customer-specific .NET adapters.

```csharp
var accepted = await contextLayer.Events.IngestSourceSystemEventAsync(
    "demo",
    new SourceSystemEventRequest(
        EventId: "evt-demo-001",
        WorkspaceSlug: null,
        SourceSystem: "product",
        EventType: "source.product_usage.rollup_ready",
        Payload: new Dictionary<string, object?>
        {
            ["activeDays30"] = 22,
            ["lastFeature"] = "renewal-report"
        },
        PayloadJson: null,
        ExternalUserId: "123",
        ExternalAccountId: null,
        ObservedAtUtc: null));

var scopedAccepted = await demo.Events.IngestSourceSystemEventAsync(
    new SourceSystemEventRequest(
        EventId: "evt-demo-002",
        WorkspaceSlug: null,
        SourceSystem: "web",
        EventType: "source.web_conversion.received",
        Payload: new Dictionary<string, object?>
        {
            ["pricingPageVisits30d"] = 4
        },
        PayloadJson: null,
        ExternalUserId: null,
        ExternalAccountId: "ACC-123",
        ObservedAtUtc: null));
```

## AI Context Package

This retrieves a scoped context package only. UCL does not call an AI model in this method.

```csharp
var packageResult = await contextLayer.Packages.GetAiContextForUserAsync(
    "demo",
    "123",
    "Generate an account brief for the next renewal call.");
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
- REST v1 semantic fact filtering
- source-system event ingestion route construction
- tenant-scoped client behavior
- transient retry handling
- typed problem-details error mapping
