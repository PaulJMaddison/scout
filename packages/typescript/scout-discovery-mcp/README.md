# @kynticai/scout-discovery-mcp

MCP (Model Context Protocol) server for **KynticAI Scout** discovery. Exposes metadata-only inspection tools that let AI agents explore the Scout connector catalogue, semantic attribute keys, and configuration schemas without accessing live data or enterprise internals.

## Tools

| Tool | Description |
|---|---|
| `scout_list_connectors` | Lists all registered connector plugins with type, display name, description, aliases, and supported data source kinds. |
| `scout_inspect_sample_schema` | Returns the configuration schema and sample configuration for a specific connector type or alias. |
| `scout_summarise_metadata` | Summarises all public metadata: connector count, semantic attribute keys, data source kinds, and capabilities. |
| `scout_validate_connector_manifest` | Validates a connector manifest JSON against the expected Scout connector structure. |

All tools operate on **local sample data only**. No live API connections, no customer data, no enterprise internals.

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

## Development

```bash
npm run build    # compile TypeScript
npm run test     # run vitest suite (27 tests)
```

### Project Structure

```
src/
  index.ts          Entry point — starts MCP server on stdio
  server.ts         Tool registration using @modelcontextprotocol/sdk
  tools.ts          Tool implementations (list, inspect, summarise, validate)
  sample-data.ts    Loads and caches local sample connector data
  types.ts          TypeScript type definitions
tests/
  server.test.ts    Tests for tool registration, sample responses, manifest validation
data/
  sample-connectors.json   Local sample connector metadata
```

## Connector Manifest Validation

The `scout_validate_connector_manifest` tool checks that a connector manifest includes:

- Non-empty `connectorType`, `displayName`, and `description`
- At least one supported data source kind
- A `configurationSchema` with `"type": "object"` and `"properties"`
- A `sampleConfiguration` that includes all `required` fields from the schema

This mirrors the server-side `ConnectorMetadataValidator` in the .NET codebase.

## Scope and Boundaries

This package is part of the **public open-core** Scout repository.

- **Included:** Generic protocol connectors (SQL, REST, CSV, mock), example connectors, public semantic attribute keys, data source kinds, and connector capabilities.
- **Not included:** Enterprise vendor-specific connectors (Salesforce, HubSpot, Dynamics, SAP, etc.), Fortress features, LanceDB, embedded LLMs, vector pipelines, or customer data.

See [connector-authoring.md](../../docs/connector-authoring.md) and [connector-plugin-model.md](../../docs/connector-plugin-model.md) for the full connector contract documentation.

## Licence

MIT
