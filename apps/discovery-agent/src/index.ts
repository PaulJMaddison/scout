#!/usr/bin/env node
import { pathToFileURL } from 'node:url'
import { runCli } from './cli.js'

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli(process.argv.slice(2))
}

export { auditCodebase, runThreeTierAudit } from './audit.js'
export { createLocalDiscoveryReport, readApprovedJsonFile, renderLocalReportMarkdown } from './buyer-report.js'
export { runBuyerCli } from './buyer-cli.js'
export { createKynticDiscoveryMcpServer } from './buyer-server.js'
export { generateHandover, renderHandoverMarkdown, toHandoverDocument } from './handover.js'
export { getInspectionGuide, listInspectionGuides, renderBuyerWorkflowPrompt, renderInspectionGuideMarkdown } from './inspection-guides.js'
export { createDiscoveryAgentServer, getDiscoveryStatus } from './server.js'
export {
  createDiscoverySignature,
  DISCOVERY_SIGNATURE_SCHEMA_ID,
  DISCOVERY_SIGNATURE_V1_JSON_SCHEMA,
  exportDiscoverySignature,
  submitApprovedHandoff,
  validateApprovedHandoff,
  validateApprovedMetadata,
  validateDiscoverySignature,
} from './signature.js'
export type * from './types.js'
