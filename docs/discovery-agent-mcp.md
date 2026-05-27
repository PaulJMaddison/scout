# Discovery Agent MCP Server

KynticAI Scout includes a Model Context Protocol (MCP) server that exposes metadata-only discovery tools for AI agents. The server runs as a standalone Node.js process using stdio transport.

## Available Tools

| Tool | Input | Description |
|---|---|---|
| `scout_list_connectors` | None | Lists registered connector plugins with public metadata. |
| `scout_inspect_sample_schema` | `connectorType` (string) | Returns the configuration schema and sample config for a connector type or alias. |
| `scout_summarise_metadata` | None | Summarises connectors, semantic attribute keys, data source kinds, and capabilities. |
| `scout_validate_connector_manifest` | `manifest` (JSON string) | Validates a connector manifest against the expected structure. |

## Running the Server

```bash
cd packages/typescript/scout-discovery-mcp
npm install && npm run build
node dist/index.js
```

## MCP Client Configuration

```json
{
  "mcpServers": {
    "scout-discovery": {
      "command": "node",
      "args": ["packages/typescript/scout-discovery-mcp/dist/index.js"]
    }
  }
}
```

## Data Sources

All tools return local sample data. The server does not connect to any live Scout API or external service.

The sample dataset (`data/sample-connectors.json`) includes:

- **6 connectors:** sqlDatabase, restApi, mock, csvUpload, template, inMemoryInventory
- **13 semantic attribute keys:** the reserved canonical attributes used by the selector engine
- **4 data source kinds:** Crm, SqlMetric, EventStream, ProductUsage
- **8 connector capabilities:** FetchSubject, Preview, DryRun, ScheduledSync, EventTriggeredRecompute, HealthCheck, ConfigurationValidation, SecureCredentialStorage

## Manifest Validation

The `scout_validate_connector_manifest` tool mirrors the server-side `ConnectorMetadataValidator` and checks:

- Required fields: `connectorType`, `displayName`, `description`, `supportedDataSourceKinds`
- Schema structure: `configurationSchema` must have `"type": "object"` and `"properties"`
- Sample completeness: `sampleConfiguration` must include all `required` fields from the schema
- Data source kind recognition: warns if a kind is not in the public catalogue

## Open-Core Boundary

This MCP server is public-safe. It does not expose enterprise connector implementations, customer-specific schemas, Fortress features, or proprietary logic. See [connector-plugin-model.md](connector-plugin-model.md) for the open-core connector boundary.
