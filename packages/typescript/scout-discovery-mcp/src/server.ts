import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  listConnectors,
  inspectSampleSchema,
  summariseMetadata,
  validateConnectorManifest,
  validateExtendedConnectorManifest,
} from './tools.js'

export function createDiscoveryServer(): McpServer {
  const server = new McpServer({
    name: 'scout-discovery',
    version: '2.8.0',
  })

  server.tool(
    'scout_list_connectors',
    'Lists all registered KynticAI Scout connector plugins with public metadata. ' +
      'Returns connector type, display name, description, aliases, and supported data source kinds.',
    {},
    async () => ({
      content: [{ type: 'text' as const, text: JSON.stringify(listConnectors(), null, 2) }],
    }),
  )

  server.tool(
    'scout_inspect_sample_schema',
    'Inspects the configuration schema and sample configuration for a specific connector. ' +
      'Accepts a connector type identifier or alias.',
    { connectorType: z.string().describe('Connector type or alias to inspect (e.g. "sqlDatabase", "restApi", "mock").') },
    async ({ connectorType }) => ({
      content: [{ type: 'text' as const, text: JSON.stringify(inspectSampleSchema(connectorType), null, 2) }],
    }),
  )

  server.tool(
    'scout_summarise_metadata',
    'Summarises all available public metadata: registered connectors, ' +
      'semantic attribute keys, data source kinds, and connector capabilities.',
    {},
    async () => ({
      content: [{ type: 'text' as const, text: JSON.stringify(summariseMetadata(), null, 2) }],
    }),
  )

  server.tool(
    'scout_validate_connector_manifest',
    'Validates a connector manifest JSON against the expected KynticAI Scout connector structure. ' +
      'Checks required fields, schema structure, and sample configuration completeness.',
    { manifest: z.string().describe('JSON string of the connector manifest to validate.') },
    async ({ manifest }) => {
      let parsed: unknown
      try {
        parsed = JSON.parse(manifest)
      } catch {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                { isValid: false, errors: ['manifest is not valid JSON.'], warnings: [] },
                null,
                2,
              ),
            },
          ],
        }
      }
      return {
        content: [
          { type: 'text' as const, text: JSON.stringify(validateConnectorManifest(parsed), null, 2) },
        ],
      }
    },
  )

  server.tool(
    'scout_validate_connector_manifest_v2',
    'Validates an extended connector manifest against the full KynticAI Scout public schema. ' +
      'Checks connector ID format, semver version, supported source types, required config fields, ' +
      'safe metadata fields (rejects credential/PII leaks), and sample entity mappings.',
    {
      manifest: z.string().describe('JSON string of the extended connector manifest to validate.'),
      knownConnectorIds: z
        .string()
        .optional()
        .describe('Optional comma-separated list of existing connector IDs to check for duplicates.'),
    },
    async ({ manifest, knownConnectorIds }) => {
      let parsed: unknown
      try {
        parsed = JSON.parse(manifest)
      } catch {
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                { isValid: false, errors: ['manifest is not valid JSON.'], warnings: [] },
                null,
                2,
              ),
            },
          ],
        }
      }
      const options = knownConnectorIds !== undefined
        ? { knownConnectorIds: knownConnectorIds.split(',').map((id) => id.trim()) }
        : undefined
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(validateExtendedConnectorManifest(parsed, options), null, 2),
          },
        ],
      }
    },
  )

  return server
}
