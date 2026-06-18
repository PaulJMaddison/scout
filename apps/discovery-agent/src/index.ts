#!/usr/bin/env node
import { runCli } from './cli.js'

await runCli(process.argv.slice(2))

export { auditCodebase, runThreeTierAudit } from './audit.js'
export { generateHandover, renderHandoverMarkdown, toHandoverDocument } from './handover.js'
export { createDiscoveryAgentServer, getDiscoveryStatus } from './server.js'
export type * from './types.js'
