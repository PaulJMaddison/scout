import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { auditCodebase } from './audit.js'
import { createLocalDiscoveryReport } from './buyer-report.js'
import { generateHandover } from './handover.js'
import {
  getInspectionGuide,
  listInspectionGuides,
  renderBuyerWorkflowPrompt,
  renderInspectionGuideMarkdown,
  type InspectionDomain,
} from './inspection-guides.js'
import {
  createDiscoverySignature,
  exportDiscoverySignature,
  submitApprovedHandoff,
  validateApprovedHandoff,
  type ApprovedHandoffOptions,
  DiscoverySignatureValidationError,
} from './signature.js'
import type { AuditTier } from './types.js'
import {
  listConnectors,
  produceMetadataQualityReport,
  readConnectorManifest,
  summariseConnectors,
  summariseMetadata,
  validateConnectorManifest,
  validateExtendedConnectorManifest,
} from '@kynticai/scout-discovery-mcp/tools'

const tierSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])

const inspectionDomains = [
  'local-codebase-shape',
  'database-schema-metadata',
  'crm-metadata',
  'website-conversion-points',
  'analytics-property-event-metadata',
  'support-metadata',
  'billing-metadata',
  'product-metadata',
  'ecommerce-metadata',
  'docs-system-metadata',
] as const

const inspectionDomainSchema = z.enum(inspectionDomains)

export interface KynticDiscoveryMcpServerOptions {
  handoff?: ApprovedHandoffOptions
}

export function createKynticDiscoveryMcpServer(options: KynticDiscoveryMcpServerOptions = {}): McpServer {
  const server = new McpServer({
    name: 'kynticai-discovery-mcp',
    version: '0.1.0',
  })

  registerResources(server)
  registerPrompts(server)
  registerTools(server, options)

  return server
}

function registerResources(server: McpServer): void {
  server.registerResource(
    'kynticai-discovery-workflow',
    'kynticai-discovery://workflow',
    {
      title: 'KynticAI Discovery MCP Workflow',
      description: 'IT-manager review journey and safe-output rules.',
      mimeType: 'text/markdown',
    },
    (uri) => ({
      contents: [{ uri: uri.href, mimeType: 'text/markdown', text: renderBuyerWorkflowPrompt() }],
    }),
  )

  for (const guide of listInspectionGuides()) {
    server.registerResource(
      `kynticai-discovery-guide-${guide.id}`,
      `kynticai-discovery://guides/${guide.id}`,
      {
        title: guide.title,
        description: guide.purpose,
        mimeType: 'text/markdown',
      },
      (uri) => ({
        contents: [{ uri: uri.href, mimeType: 'text/markdown', text: renderInspectionGuideMarkdown(guide) }],
      }),
    )
  }
}

function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    'kynticai_discovery_buyer_journey',
    {
      title: 'KynticAI Discovery MCP Buyer Journey',
      description: 'Guide Claude or Codex through local discovery, metadata review, signature approval, and optional handoff.',
    },
    () => ({
      description: 'Safe IT-manager journey for KynticAI Discovery MCP.',
      messages: [{ role: 'user', content: { type: 'text', text: renderBuyerWorkflowPrompt() } }],
    }),
  )

  server.registerPrompt(
    'kynticai_discovery_inspection_guide',
    {
      title: 'KynticAI Discovery MCP Inspection Guide',
      description: 'Load one metadata-only inspection guide.',
      argsSchema: { domain: inspectionDomainSchema },
    },
    ({ domain }) => {
      const guide = getInspectionGuide(domain)
      return {
        description: guide.purpose,
        messages: [{ role: 'user', content: { type: 'text', text: renderInspectionGuideMarkdown(guide) } }],
      }
    },
  )
}

function registerTools(server: McpServer, options: KynticDiscoveryMcpServerOptions): void {
  server.tool(
    'kyntic_get_inspection_guide',
    'Returns metadata-only inspection guidance for local codebase, database, CRM, website, analytics, support, billing, product, ecommerce, or docs-system metadata.',
    { domain: inspectionDomainSchema.describe('Guide domain to return.') },
    async ({ domain }) => jsonText(getInspectionGuide(domain)),
  )

  server.tool(
    'kyntic_audit_codebase',
    'Runs the existing local-only KynticAI Discovery Agent codebase audit.',
    {
      path: z.string().describe('Local path to audit.'),
      tier: tierSchema.describe('Audit tier: 1, 2, or 3.'),
    },
    async ({ path, tier }) => jsonText(await auditCodebase({ path, tier })),
  )

  server.tool(
    'kyntic_generate_handover',
    'Runs the existing KynticAI Discovery Agent handover generator for approved local codebase shape.',
    {
      path: z.string().describe('Local path to audit.'),
      tier: tierSchema.optional().describe('Audit tier for handover. Defaults to 3.'),
    },
    async ({ path, tier }) => jsonText(await generateHandover(path, tier ?? 3)),
  )

  server.tool(
    'kyntic_list_connector_catalogue',
    'Inspects the public KynticAI Scout connector catalogue and metadata summary.',
    {},
    async () => jsonText({
      connectors: listConnectors(),
      summary: summariseConnectors(),
      metadata: summariseMetadata(),
    }),
  )

  server.tool(
    'kyntic_read_connector_manifest',
    'Reads a public KynticAI Scout connector manifest by type or alias.',
    { connectorType: z.string().describe('Connector type or alias.') },
    async ({ connectorType }) => jsonText(readConnectorManifest(connectorType)),
  )

  server.tool(
    'kyntic_validate_connector_manifest',
    'Validates a connector manifest locally against the KynticAI Scout public schemas.',
    { manifest: z.string().describe('JSON string of the connector manifest.') },
    async ({ manifest }) => {
      const parsed = parseJson(manifest)
      if (!parsed.ok) return jsonText(parsed.error)
      return jsonText({
        v1: validateConnectorManifest(parsed.value),
        v2: validateExtendedConnectorManifest(parsed.value),
      })
    },
  )

  server.tool(
    'kyntic_metadata_quality_report',
    'Produces a metadata quality report from a connector manifest only. Raw sample records are intentionally not accepted by this wrapper.',
    { manifest: z.string().describe('JSON string of the connector manifest.') },
    async ({ manifest }) => {
      const parsed = parseJson(manifest)
      if (!parsed.ok) return jsonText(parsed.error)
      return jsonText(produceMetadataQualityReport(parsed.value))
    },
  )

  server.tool(
    'kyntic_generate_discovery_signature',
    'Generates a metadata-only Discovery Signature after IT-manager approval.',
    { approvedMetadata: z.string().describe('JSON string matching kynticai.discovery-signature.v1.') },
    async ({ approvedMetadata }) => {
      const parsed = parseJson(approvedMetadata)
      if (!parsed.ok) return jsonText(parsed.error)
      try {
        return jsonText(createDiscoverySignature(parsed.value))
      } catch (error) {
        return jsonText(signatureError(error))
      }
    },
  )

  server.tool(
    'kyntic_export_discovery_signature',
    'Validates a KynticAI Discovery Signature and writes it to a chosen local filesystem path.',
    {
      signature: z.string().describe('Discovery Signature JSON string matching kynticai.discovery-signature.v1.'),
      outputPath: z.string().describe('Local filesystem path for the exported signature JSON.'),
    },
    async ({ signature, outputPath }) => {
      const parsed = parseJson(signature)
      if (!parsed.ok) return jsonText(parsed.error)
      try {
        return jsonText(await exportDiscoverySignature(createDiscoverySignature(parsed.value), outputPath))
      } catch (error) {
        return jsonText(signatureError(error))
      }
    },
  )

  server.tool(
    'kyntic_create_local_report',
    'Creates a local buyer-facing report with connector catalogue metadata, optional codebase audit, optional manifest validation, and optional Discovery Signature.',
    {
      codebasePath: z.string().optional().describe('Optional local codebase path to audit.'),
      tier: tierSchema.optional().describe('Optional audit tier. Defaults to 1 for audit and 3 for handover.'),
      includeAudit: z.boolean().optional().describe('Whether to include a local codebase audit.'),
      includeHandover: z.boolean().optional().describe('Whether to include a local handover.'),
      connectorType: z.string().optional().describe('Optional connector type or alias to inspect.'),
      manifest: z.string().optional().describe('Optional connector manifest JSON string.'),
      approvedMetadata: z.string().optional().describe('Optional JSON string matching kynticai.discovery-signature.v1.'),
    },
    async ({ codebasePath, tier, includeAudit, includeHandover, connectorType, manifest, approvedMetadata }) => {
      const parsedManifest = manifest !== undefined ? parseJson(manifest) : undefined
      if (parsedManifest !== undefined && !parsedManifest.ok) return jsonText(parsedManifest.error)
      const parsedApprovedMetadata = approvedMetadata !== undefined ? parseJson(approvedMetadata) : undefined
      if (parsedApprovedMetadata !== undefined && !parsedApprovedMetadata.ok) return jsonText(parsedApprovedMetadata.error)

      try {
        return jsonText(await createLocalDiscoveryReport({
          codebasePath,
          auditTier: tier as AuditTier | undefined,
          includeAudit,
          includeHandover,
          connectorType,
          manifest: parsedManifest?.value,
          approvedMetadata: parsedApprovedMetadata?.value,
          handoff: options.handoff,
        }))
      } catch (error) {
        return jsonText(signatureError(error))
      }
    },
  )

  server.tool(
    'kyntic_submit_approved_handoff',
    'Submits only a Discovery Signature to an approved endpoint. Disabled unless the server was started with --allow-handoff, --consent-handoff, --handoff-endpoint, and approved config.',
    { signature: z.string().describe('Discovery Signature JSON string generated by kyntic_generate_discovery_signature.') },
    async ({ signature }) => {
      const parsed = parseJson(signature)
      if (!parsed.ok) return jsonText(parsed.error)
      const handoff = validateApprovedHandoff(options.handoff ?? { allowHandoff: false, consent: false })
      if (!handoff.enabled) return jsonText(handoff)
      try {
        return jsonText(await submitApprovedHandoff(createDiscoverySignature(parsed.value), options.handoff ?? { allowHandoff: false, consent: false }))
      } catch (error) {
        return jsonText(signatureError(error))
      }
    },
  )
}

function jsonText(value: unknown): { content: Array<{ type: 'text'; text: string }> } {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] }
}

function parseJson(value: string): { ok: true; value: unknown } | { ok: false; error: object } {
  try {
    return { ok: true, value: JSON.parse(value) as unknown }
  } catch {
    return { ok: false, error: { error: 'Input is not valid JSON.' } }
  }
}

function signatureError(error: unknown): object {
  if (error instanceof DiscoverySignatureValidationError) {
    return { error: error.message, issues: error.issues }
  }

  return { error: error instanceof Error ? error.message : String(error) }
}
