import type {
  ApiEndpoint,
  AuditTier,
  DiscoveryAudit,
  HandoverDocument,
  HandoverOutput,
} from './types.js'
import { auditCodebase } from './audit.js'

export async function generateHandover(rootPath: string, tier: AuditTier = 3): Promise<HandoverOutput> {
  const audit = await auditCodebase({ path: rootPath, tier })
  const json = toHandoverDocument(audit)
  return {
    json,
    markdown: renderHandoverMarkdown(json),
  }
}

export function toHandoverDocument(audit: DiscoveryAudit): HandoverDocument {
  const apiSurface = audit.tier2?.endpoints ?? []
  const keyEntities = (audit.tier2?.types ?? [])
    .filter((item) => item.kind === 'class' || item.kind === 'interface' || item.kind === 'record' || item.kind === 'type')
    .slice(0, 40)
    .map((item) => ({
      name: item.name,
      file: item.file,
      description: `${item.kind} detected from signature: ${item.signature}`,
    }))

  const dataStores = audit.tier1.techStack.databases.map((database) => ({
    type: database.toLowerCase(),
    purpose: inferDataStorePurpose(database, audit.tier2?.schemas.map((schema) => schema.name) ?? []),
  }))

  return {
    project_name: audit.projectName,
    audit_date: audit.auditDate,
    tech_stack: audit.tier1.techStack,
    entry_points: audit.tier2?.entryPoints ?? audit.tier1.entryPoints,
    api_surface: apiSurface,
    key_entities: keyEntities,
    data_stores: dataStores,
    security_surface: (audit.tier3?.securitySurface ?? []).map((item) => `${item.area}: ${item.notes.join(' ')}`),
    ...(audit.tier3 ? { governance_report: audit.tier3 } : {}),
    recommended_next_agent_prompt: buildRecommendedPrompt(audit, apiSurface),
  }
}

export function renderHandoverMarkdown(handover: HandoverDocument): string {
  const lines: string[] = []
  lines.push(`# ${handover.project_name} Handover`)
  lines.push('')
  lines.push(`Audit date: ${handover.audit_date}`)
  lines.push('')
  lines.push('## Tech Stack')
  lines.push(`- Languages: ${joinOrNone(handover.tech_stack.languages)}`)
  lines.push(`- Frameworks: ${joinOrNone(handover.tech_stack.frameworks)}`)
  lines.push(`- Databases: ${joinOrNone(handover.tech_stack.databases)}`)
  lines.push('')
  lines.push('## Entry Points')
  for (const entry of handover.entry_points.slice(0, 20)) {
    lines.push(`- ${entry.type}: ${entry.file} — ${entry.description}`)
  }
  if (handover.entry_points.length === 0) lines.push('- None detected.')
  lines.push('')
  lines.push('## API Surface')
  for (const endpoint of handover.api_surface.slice(0, 40)) {
    lines.push(`- ${endpoint.method} ${endpoint.path} (${endpoint.auth}) — ${endpoint.file}`)
  }
  if (handover.api_surface.length === 0) lines.push('- None detected.')
  lines.push('')
  lines.push('## Key Entities')
  for (const entity of handover.key_entities.slice(0, 30)) {
    lines.push(`- ${entity.name}: ${entity.file}`)
  }
  if (handover.key_entities.length === 0) lines.push('- None detected.')
  lines.push('')
  lines.push('## Data Stores')
  for (const store of handover.data_stores) {
    lines.push(`- ${store.type}: ${store.purpose}`)
  }
  if (handover.data_stores.length === 0) lines.push('- None detected.')
  lines.push('')
  lines.push('## Security Surface')
  for (const item of handover.security_surface) {
    lines.push(`- ${item}`)
  }
  if (handover.security_surface.length === 0) lines.push('- No explicit security surface detected by the local scan.')
  if (handover.governance_report) {
    lines.push('')
    lines.push('## Governance Report')
    lines.push(`- Tech debt score: ${handover.governance_report.techDebtScore.overall}/100`)
    for (const finding of handover.governance_report.techDebtScore.findings) {
      lines.push(`- ${finding}`)
    }
  }
  lines.push('')
  lines.push('## Recommended Next Agent Prompt')
  lines.push('')
  lines.push('```text')
  lines.push(handover.recommended_next_agent_prompt)
  lines.push('```')

  return `${lines.join('\n')}\n`
}

function buildRecommendedPrompt(audit: DiscoveryAudit, endpoints: ApiEndpoint[]): string {
  const stack = audit.tier1.techStack
  const parts = [
    `You are working in ${audit.projectName}.`,
    `Tech stack detected: languages=${joinOrNone(stack.languages)}; frameworks=${joinOrNone(stack.frameworks)}; databases=${joinOrNone(stack.databases)}.`,
    `Start by reading the repo instructions, then inspect the entry points: ${audit.tier1.entryPoints.slice(0, 8).map((item) => item.file).join(', ') || 'none detected'}.`,
    `Public API endpoints detected: ${endpoints.slice(0, 12).map((item) => `${item.method} ${item.path}`).join(', ') || 'none detected'}.`,
    'Preserve unrelated local changes, avoid secrets, and verify changed behaviour with focused local tests before reporting completion.',
  ]

  return parts.join(' ')
}

function inferDataStorePurpose(database: string, schemas: string[]): string {
  if (schemas.length === 0) return 'Detected from dependencies or configuration.'
  return `Detected with schema objects including ${schemas.slice(0, 8).join(', ')}.`
}

function joinOrNone(values: string[]): string {
  return values.length > 0 ? values.join(', ') : 'none detected'
}
