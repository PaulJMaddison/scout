#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createDiscoveryServer } from './server.js'

const server = createDiscoveryServer()
const transport = new StdioServerTransport()
await server.connect(transport)
