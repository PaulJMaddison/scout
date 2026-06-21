# @kynticai/scout-discovery-mcp

MCP (Model Context Protocol) server for **KynticAI Scout** discovery. Exposes metadata-only inspection tools that let AI agents explore the Scout connector catalogue, semantic attribute keys, and configuration schemas without accessing live data or enterprise internals.

For the buyer-facing IT-manager journey, use the `kyntic-discovery-mcp`
wrapper in [`apps/discovery-agent`](../../../apps/discovery-agent). The
wrapper reuses this package for connector catalogue inspection, connector
manifest validation, and metadata quality reports, then combines it with the
local Discovery Agent codebase audit and metadata-only Discovery Signature
generation.

## Tools

| Tool | Description |
|---|---|
| `scout_list_connectors` | Lists all registered connector plugins with type, display name, description, aliases, and supported data source kinds. Output is sorted deterministically. |
| `scout_inspect_sample_schema` | Returns the configuration schema and sample configuration for a specific connector type or alias. |
| `scout_summarise_metadata` | Summarises all public metadata: connector count, semantic attribute keys, data source kinds, and capabilities. |
| `scout_validate_connector_manifest` | Validates a connector manifest JSON against the expected Scout connector structure (v1 format). |
| `scout_validate_connector_manifest_v2` | Validates an extended manifest against the full public schema — checks connector ID format, semver, source types, safe metadata fields, and sample entity mappings. |
| `scout_read_connector_manifest` | Returns the full manifest for a connector type or alias, including configurationSchema and sampleConfiguration. |
| `scout_validate_manifest_schema_compatibility` | Checks that a manifest's configurationSchema is compatible with a provided target schema (field presence, type alignment, required-field coverage). |
| `scout_summarise_connectors` | Detailed connector summary: per-connector field counts, capability coverage matrix, data source kind distribution, alias totals. |
| `scout_metadata_quality_report` | Runs the metadata audit runner against a manifest and optional sample records. Returns readiness scores, field classifications, warnings, and recommendations. |

All tools operate on **local sample data only**. No live API connections, no customer data, no enterprise internals.

### Stable Tool Schemas

Tool input/output schemas are documented in [`data/tool-schemas.json`](./data/tool-schemas.json). Breaking changes to these schemas require a major version bump and compatibility notes.

## Quick Start

```bash
cd packages/typescript/scout-discovery-mcp
npm install
npm run build
```

### Run as a standalone MCP server (stdio transport)

```bash
node dist/index.js
```

### Configure in an MCP client

Add to your MCP client configuration (e.g. Claude Desktop, Cursor, or any MCP-compatible agent):

```json
{
  "mcpServers": {
    "scout-discovery": {
      "command": "node",
      "args": ["packages/typescript/scout-discovery-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

## External Developer Guide

### Error Handling

All tools return structured JSON responses. Error responses follow a consistent shape:

```json
{
  "error": "Human-readable error message.",
  "hint": "Suggested next step (where applicable).",
  "availableTypes": ["csvUpload", "mock", "restApi", "sqlDatabase", "..."]
}
```

Error messages are sanitised — they never contain absolute file paths, credentials, tokens, or stack traces.

### Input Validation

- **Connector type lookups** are case-insensitive and accept aliases (e.g. `"crmApi"` resolves to `"restApi"`).
- Empty, whitespace-only, or excessively long inputs (>200 characters) are rejected with a clear error.
- Manifest validation tools accept a **JSON string** parameter; invalid JSON returns a structured error without throwing.

### Output Guarantees

- **Deterministic ordering**: all array outputs (connector lists, aliases, capabilities, data source kinds) are sorted alphabetically. Calling the same tool twice always yields identical output.
- **No enterprise internals**: outputs never reference Fortress, LanceDB, vendor-specific connectors (Salesforce, HubSpot, Dynamics, SAP, SharePoint), embedded LLMs, or vector pipelines.
- **No secret leakage**: absolute paths, credential-like values, and Bearer tokens are redacted from error messages and report output.

### Example: List Available Connectors

```typescript
// Response shape from scout_list_connectors
{
  "connectors": [
    {
      "connectorType": "csvUpload",
      "displayName": "CSV Upload",
      "description": "Schema-on-read CSV file connector for local flat-file ingestion.",
      "aliases": [],
      "supportedDataSourceKinds": ["Crm", "SqlMetric"]
    },
    // ... more connectors, sorted by connectorType
  ],
  "totalCount": 6
}
```

### Example: Validate a Custom Connector Manifest

```typescript
// Call scout_validate_connector_manifest with a JSON string:
const manifest = JSON.stringify({
  connectorType: "myConnector",
  displayName: "My Connector",
  description: "Custom connector for my data source.",
  supportedDataSourceKinds: ["Crm"],
  supportedCapabilities: ["FetchSubject", "Preview"],
  configurationSchema: {
    type: "object",
    required: ["endpoint"],
    properties: {
      endpoint: { type: "string", description: "API endpoint URL." }
    }
  },
  sampleConfiguration: {
    endpoint: "https://api.example.com/v1"
  }
})

// Response:
{
  "isValid": true,
  "errors": [],
  "warnings": []
}
```

### Example: Run a Metadata Quality Report

```typescript
// Call scout_metadata_quality_report with manifest + optional sampleRecords:
// Response shape:
{
  "connectorType": "myConnector",
  "displayName": "My Connector",
  "auditedAtUtc": "2026-06-15T12:00:00.000Z",
  "overallReadiness": 72,
  "readinessBreakdown": {
    "manifestCompleteness": 90,
    "schemaQuality": 80,
    "sampleDataCoverage": 50,
    "capabilityBreadth": 60,
    "documentationCoverage": 80
  },
  "schemaSummary": { "totalFields": 3, "requiredFields": 1, "documentedFields": 3 },
  "fieldClassifications": [
    { "name": "endpoint", "type": "string", "classification": "configuration" }
  ],
  "warningCount": 0,
  "warnings": [],
  "recommendationCount": 2,
  "recommendations": [
    { "category": "sample-data", "message": "Provide sample records for deeper analysis." }
  ]
}
```

## Development

```bash
npm run build    # compile TypeScript
npm run test     # run vitest suite (117 tests)
```

### Project Structure

```
src/
  index.ts          Entry point — starts MCP server on stdio
  server.ts         Tool registration using @modelcontextprotocol/sdk
  tools.ts          Tool implementations with input validation and output sanitisation
  sample-data.ts    Loads and caches local sample connector data
  types.ts          TypeScript type definitions
tests/
  server.test.ts       Core tool tests (registration, list, inspect, summarise, validate)
  expanded-tools.test.ts  Extended tool tests (read manifest, compatibility, summarise, quality report)
  hardening.test.ts    OSS-022 hardening tests (invalid input, safe errors, determinism, no leakage)
data/
  sample-connectors.json   Local sample connector metadata
  tool-schemas.json        Stable public tool schema reference
  fixture-*.json           Test fixtures for manifest validation and compatibility
```

## Connector Manifest Validation

The `scout_validate_connector_manifest` tool checks that a connector manifest includes:

- Non-empty `connectorType`, `displayName`, and `description`
- At least one supported data source kind
- A `configurationSchema` with `"type": "object"` and `"properties"`
- A `sampleConfiguration` that includes all `required` fields from the schema

The `scout_validate_connector_manifest_v2` tool additionally checks:

- Connector ID format (kebab-case)
- Semver version
- Supported source types against the public catalogue
- Required config fields
- Safe metadata fields (rejects credential/PII leaks)
- Sample entity mappings

This mirrors the server-side `ConnectorMetadataValidator` in the .NET codebase.

## Scope and Boundaries

This package is part of the **public open-core** Scout repository.

- **Included:** Generic protocol connectors (SQL, REST, CSV, mock), example connectors, public semantic attribute keys, data source kinds, and connector capabilities.
- **Not included:** Enterprise vendor-specific connectors (Salesforce, HubSpot, Dynamics, SAP, etc.), Fortress features, LanceDB, embedded LLMs, vector pipelines, or customer data.

See [connector-authoring.md](../../docs/connector-authoring.md) and [connector-plugin-model.md](../../docs/connector-plugin-model.md) for the full connector contract documentation.

## Compatibility Notes

- All tool outputs are now deterministically sorted. This is a non-breaking improvement — previously ordering was insertion-order dependent.
- Error responses for unknown connector types now include sanitised input and sorted `availableTypes`.
- Empty/whitespace-only connector type inputs now return a structured error instead of a generic "not found".
- The `sanitiseOutput` function is exported for use by downstream packages.
- Tool schemas are documented in `data/tool-schemas.json` — treat this as the public contract.

## Licence

MIT
