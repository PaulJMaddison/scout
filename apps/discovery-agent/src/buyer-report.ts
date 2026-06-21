import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { auditCodebase } from './audit.js'
import { generateHandover } from './handover.js'
import { listInspectionGuides, renderBuyerWorkflowPrompt } from './inspection-guides.js'
import { assertDiscoveryReadableFile, SAFE_OUTPUT_CONTRACT } from './safe-paths.js'
import {
  createDiscoverySignature,
  submitApprovedHandoff,
  validateApprovedHandoff,
  type ApprovedHandoffOptions,
  type DiscoverySignature,
  type DiscoverySignatureOptions,
  type HandoffResult,
} from './signature.js'
import type { AuditTier, DiscoveryAudit, HandoverOutput } from './types.js'
import {
  listConnectors,
  produceMetadataQualityReport,
  readConnectorManifest,
  summariseConnectors,
  summariseMetadata,
  validateConnectorManifest,
  validateExtendedConnectorManifest,
} from '@kynticai/scout-discovery-mcp/tools'

export interface LocalDiscoveryReportOptions extends DiscoverySignatureOptions {
  codebasePath?: string
  auditTier?: AuditTier
  includeAudit?: boolean
  includeHandover?: boolean
  connectorType?: string
  manifest?: unknown
  approvedMetadata?: unknown
  handoff?: ApprovedHandoffOptions
  submitHandoff?: boolean
}

export interface LocalDiscoveryReport {
  schemaVersion: 'kynticai-discovery-local-report/v1'
  product: 'KynticAI Discovery MCP'
  generatedAtUtc: string
  safeOutputContract: string[]
  buyerJourney: string[]
  inspectionGuides: Array<{ id: string; title: string }>
  connectorCatalogue: {
    list: object
    summary: object
    metadataSummary: object
    selectedManifest?: object
  }
  codebase?: {
    audit?: DiscoveryAudit
    handover?: HandoverOutput
  }
  manifestValidation?: {
    v1: object
    v2: object
    metadataQualityReport: object
  }
  discoverySignature?: DiscoverySignature
  handoff: HandoffResult
}

export async function createLocalDiscoveryReport(options: LocalDiscoveryReportOptions = {}): Promise<LocalDiscoveryReport> {
  const generatedAtUtc = options.generatedAtUtc ?? new Date().toISOString()
  const connectorCatalogue: LocalDiscoveryReport['connectorCatalogue'] = {
    list: listConnectors(),
    summary: summariseConnectors(),
    metadataSummary: summariseMetadata(),
  }

  if (options.connectorType !== undefined) {
    connectorCatalogue.selectedManifest = readConnectorManifest(options.connectorType)
  }

  const report: LocalDiscoveryReport = {
    schemaVersion: 'kynticai-discovery-local-report/v1',
    product: 'KynticAI Discovery MCP',
    generatedAtUtc,
    safeOutputContract: SAFE_OUTPUT_CONTRACT,
    buyerJourney: [
      'Run local discovery on approved paths.',
      'Review connector catalogue and manifest metadata.',
      'Approve a metadata-only Discovery Signature draft.',
      'Validate and export a Discovery Signature using schema kynticai.discovery-signature.v1.',
      'Optionally hand off only the Discovery Signature to an approved KynticAI endpoint.',
      'KynticAI builds a synthetic demo from the approved signature.',
    ],
    inspectionGuides: listInspectionGuides().map((guide) => ({ id: guide.id, title: guide.title })),
    connectorCatalogue,
    handoff: validateApprovedHandoff(options.handoff ?? { allowHandoff: false, consent: false }),
  }

  if (options.includeAudit === true && options.codebasePath !== undefined) {
    const audit = await auditCodebase({ path: options.codebasePath, tier: options.auditTier ?? 1 })
    report.codebase = { ...(report.codebase ?? {}), audit }
  }

  if (options.includeHandover === true && options.codebasePath !== undefined) {
    const handover = await generateHandover(options.codebasePath, options.auditTier ?? 3)
    report.codebase = { ...(report.codebase ?? {}), handover }
  }

  if (options.manifest !== undefined) {
    report.manifestValidation = {
      v1: validateConnectorManifest(options.manifest),
      v2: validateExtendedConnectorManifest(options.manifest),
      metadataQualityReport: produceMetadataQualityReport(options.manifest),
    }
  }

  if (options.approvedMetadata !== undefined) {
    report.discoverySignature = createDiscoverySignature(options.approvedMetadata, { generatedAtUtc })
    if (options.submitHandoff === true) {
      report.handoff = await submitApprovedHandoff(
        report.discoverySignature,
        options.handoff ?? { allowHandoff: false, consent: false },
      )
    }
  }

  return report
}

export async function readApprovedJsonFile(filePath: string): Promise<unknown> {
  assertDiscoveryReadableFile(filePath)
  if (path.extname(filePath).toLowerCase() !== '.json') {
    throw new Error('KynticAI Discovery MCP only reads approved JSON metadata files.')
  }

  return JSON.parse(await readFile(filePath, 'utf-8'))
}

export function renderLocalReportMarkdown(report: LocalDiscoveryReport): string {
  const lines = [
    '# KynticAI Discovery MCP Local Report',
    '',
    renderBuyerWorkflowPrompt(),
    '',
    '## Safe Output Contract',
    ...report.safeOutputContract.map((item) => `- ${item}`),
    '',
    '## Connector Catalogue',
    `- Connector count: ${connectorCount(report.connectorCatalogue.list)}`,
    `- Metadata summary included: ${report.connectorCatalogue.metadataSummary !== undefined ? 'yes' : 'no'}`,
    '',
  ]

  if (report.codebase?.audit !== undefined) {
    lines.push('## Local Codebase Audit', `- Project: ${report.codebase.audit.projectName}`, `- Tier: ${report.codebase.audit.tier}`, '')
  }

  if (report.manifestValidation !== undefined) {
    lines.push('## Connector Manifest', `- V1 result included: yes`, `- V2 result included: yes`, `- Metadata quality report included: yes`, '')
  }

  if (report.discoverySignature !== undefined) {
    lines.push(
      '## Discovery Signature',
      `- Schema: ${report.discoverySignature.schemaVersion}`,
      `- Company type: ${report.discoverySignature.companyType}`,
      `- Target workflow: ${report.discoverySignature.targetWorkflow}`,
      `- Approved for synthetic demo build: ${report.discoverySignature.approvedForSyntheticDemoBuild.approved ? 'yes' : 'no'}`,
      '',
    )
  }

  lines.push('## Handoff', `- Enabled: ${report.handoff.enabled ? 'yes' : 'no'}`, `- Submitted: ${report.handoff.submitted ? 'yes' : 'no'}`, '')

  return lines.join('\n')
}

function connectorCount(value: object): number {
  const connectors = (value as { connectors?: unknown[] }).connectors
  return Array.isArray(connectors) ? connectors.length : 0
}
