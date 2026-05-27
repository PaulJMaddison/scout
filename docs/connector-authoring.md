# Connector Authoring Guide

This document describes how to author a new connector for KynticAI Scout. It covers the public `IConnectorPlugin` contract, metadata requirements, validation helpers, and the open-core boundary.

## Prerequisites

- .NET 10 SDK
- Familiarity with the [Connector Plugin Model](connector-plugin-model.md)
- The public Scout solution (`KynticAI.Scout.slnx`)

## Interface Contract

Every connector implements `IConnectorPlugin` (defined in `src/KynticAI.Scout.Application/Abstractions/IConnectorPlugin.cs`). The recommended approach is to extend `ConnectorPluginBase` in the Infrastructure layer, which provides default implementations for health checks, credential schema, configuration sanitisation, and utility helpers.

### Required Members

| Member | Type | Description |
|---|---|---|
| `ConnectorType` | `string` | Unique lowercase identifier (e.g. `"inMemoryInventory"`). |
| `DisplayName` | `string` | Human-readable name for admin UI. |
| `Description` | `string` | Short technical description. |
| `SupportedDataSourceKinds` | `IReadOnlyList<DataSourceKind>` | At least one of `Crm`, `SqlMetric`, `EventStream`, `ProductUsage`. |
| `GetConfigurationSchema()` | `JsonObject` | JSON Schema with `"type": "object"` and a `"properties"` key. |
| `GetSampleConfiguration()` | `JsonObject` | Example configuration satisfying all `required` fields in the schema. |
| `FetchAsync(...)` | `Task<ConnectorFetchResult>` | Returns normalised payload, provenance, and observation timestamp. |

### Optional Overrides

| Member | Default Behaviour |
|---|---|
| `Aliases` | Empty list. |
| `SupportedCapabilities` | All capabilities enabled. |
| `GetCredentialSchema()` | Empty object schema. |
| `ValidateConfigurationAsync(...)` | Checks that the data source kind is supported. |
| `CheckHealthAsync(...)` | Returns healthy. |

## Step-by-Step

1. **Copy the template.** Start from `samples/connector-template/TemplateConnectorPlugin.cs`.

2. **Rename and customise.** Update `ConnectorType`, `DisplayName`, `Description`, and `SupportedDataSourceKinds`.

3. **Define the configuration schema.** Return a JSON Schema object from `GetConfigurationSchema()`. Include a `required` array for mandatory fields.

4. **Provide a sample configuration.** `GetSampleConfiguration()` must return a JSON object that satisfies all `required` fields in the schema.

5. **Implement validation.** Override `ValidateConfigurationAsync` to add connector-specific checks. Always call `base.ValidateConfigurationAsync` first.

6. **Implement fetch.** `FetchAsync` receives the full request context (subject, data source, selector, configuration, credentials, run mode). Return a `ConnectorFetchResult` with:
   - `RawPayloadJson` — the raw response as a JSON string.
   - `NormalizedPayload` — a `JsonObject` the selector engine can traverse.
   - `ProvenanceJson` — an array of provenance entries (source, user ID, timestamp, mode).
   - `ObservedAtUtc` — when the data was observed.
   - `FreshUntilUtc` — optional expiry hint.
   - `DiagnosticsJson` — optional diagnostics blob.

7. **Register in DI.** Add the plugin to the service collection:
   ```csharp
   services.AddScoped<IConnectorPlugin, YourConnectorPlugin>();
   ```

8. **Validate metadata.** Use `ConnectorMetadataValidator.Validate(plugin)` to verify the connector's metadata is well-formed before shipping.

## Metadata Validation

The `ConnectorMetadataValidator` helper (in `src/KynticAI.Scout.Infrastructure/Connectors/ConnectorMetadataValidator.cs`) checks that a plugin:

- Has a non-empty `ConnectorType`, `DisplayName`, and `Description`.
- Declares at least one supported data source kind.
- Declares at least one supported capability.
- Returns non-null `Aliases`.
- Returns a `ConfigurationSchema` and `CredentialSchema` with `"type": "object"` and `"properties"`.
- Returns a `SampleConfiguration` that includes all `required` fields from the schema.

Usage in tests:

```csharp
var result = ConnectorMetadataValidator.Validate(plugin);
Assert.True(result.IsValid, string.Join("; ", result.Errors));
```

## Run Modes

Connectors should handle at least `Live` and `Preview` modes. The `ConnectorRunMode` enum defines:

| Mode | Behaviour |
|---|---|
| `Live` | Full execution with real data access. |
| `Preview` | Read-only, safe for demos. Use static responses if available. |
| `DryRun` | Validate without side effects. |
| `ScheduledSync` | Triggered by a scheduler. |
| `EventTriggeredRecompute` | Triggered by a source-system event. |

## Credential Handling

- Return a `CredentialSchema` from `GetCredentialSchema()` marking secret fields with `["secret"] = true`.
- At runtime, credentials arrive as `JsonObject` values. Persisted configurations use `secret://` references resolved by `IConnectorCredentialStore`.
- Never log or serialise raw credential values.

## Open-Core Boundary

The public Scout repository includes:

- Generic protocol connectors (SQL, REST, CSV, mock).
- Fictional demo connectors with local data only.
- The connector template and authoring documentation.

The public repository must **not** include:

- Vendor-specific connector implementations (Salesforce, HubSpot, Dynamics, etc.).
- Customer-specific schemas or mappings.
- Managed sync logic or credential vault integrations.
- Private Fortress implementation details.

Vendor connectors belong in a separate private repository and depend on the public `IConnectorPlugin` contract.

## Example Connectors

| Connector | File | Purpose |
|---|---|---|
| Template | `samples/connector-template/TemplateConnectorPlugin.cs` | Copy-paste starting point. |
| In-Memory Inventory | `src/.../Connectors/InMemoryInventoryConnectorPlugin.cs` | Fictional warehouse data, demonstrates built-in demo fallback. |
| Mock CRM | `src/.../Connectors/MockBusinessConnectorPlugins.cs` | Fictional CRM fields. |
| Mock Billing | `src/.../Connectors/MockBusinessConnectorPlugins.cs` | Fictional billing signals. |
| Mock Support | `src/.../Connectors/MockBusinessConnectorPlugins.cs` | Fictional ticket data. |

## Tests

The test suite in `tests/KynticAI.Scout.UnitTests/ConnectorAuthoringTests.cs` verifies:

- Template and example connectors implement `IConnectorPlugin`.
- All registered connectors pass `ConnectorMetadataValidator`.
- Configuration validation rejects invalid inputs and accepts sample configurations.
- `FetchAsync` returns expected payloads for known subjects.
- The validator catches common authoring errors (empty type, missing schema fields, missing sample fields).
