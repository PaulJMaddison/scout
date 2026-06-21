#!/usr/bin/env node
import { pathToFileURL } from 'node:url'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createDiscoveryServer } from './server.js'

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createDiscoveryServer()
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

export { createDiscoveryServer } from './server.js'
export {
  inspectSampleSchema,
  listConnectors,
  produceMetadataQualityReport,
  readConnectorManifest,
  sanitiseOutput,
  summariseConnectors,
  summariseMetadata,
  validateConnectorManifest,
  validateExtendedConnectorManifest,
  validateManifestSchemaCompatibility,
} from './tools.js'
export type * from './types.js'
