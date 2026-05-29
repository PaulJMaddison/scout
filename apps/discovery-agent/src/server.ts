import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { auditCodebase, runThreeTierAudit } from './audit.js'
import { generateHandover } from './handover.js'
import type { AuditTier, DiscoveryStatus } from './types.js'

const tierSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])

let status: DiscoveryStatus = { state: 'idle' }

export function createDiscoveryAgentServer(): McpServer {
  const server = new McpServer({
    name: 'kyntic-discovery-agent',
    version: '0.1.0',
  })

  server.tool(
    'audit_codebase',
    'Runs a local-only KynticAI Discovery Agent audit against a codebase path at tier 1, 2, or 3.',
    {
      path: z.string().describe('Local path to audit.'),
      tier: tierSchema.describe('Audit depth: 1 quick scan, 2 semantic index, or 3 governance report.'),
    },
    async ({ path, tier }) => {
      const audit = await runTracked(path, tier, () => auditCodebase({ path, tier }))
      return { content: [{ type: 'text' as const, text: JSON.stringify(audit, null, 2) }] }
    },
  )

  server.tool(
    'generate_handover',
    'Produces a Markdown and JSON handover suitable for Codex goal prompt injection.',
    {
      path: z.string().describe('Local path to audit.'),
    },
    async ({ path }) => {
      const handover = await runTracked(path, 3, () => generateHandover(path, 3))
      return { content: [{ type: 'text' as const, text: JSON.stringify(handover, null, 2) }] }
    },
  )

  server.tool(
    'run_three_tier_audit',
    'Runs Tier 1, Tier 2, and Tier 3 in a single local audit pass.',
    {
      path: z.string().describe('Local path to audit.'),
    },
    async ({ path }) => {
      const audit = await runTracked(path, 3, () => runThreeTierAudit(path))
      return { content: [{ type: 'text' as const, text: JSON.stringify(audit, null, 2) }] }
    },
  )

  server.tool(
    'check_status',
    'Returns the current in-memory Discovery Agent audit state for this MCP server process.',
    {},
    async () => ({ content: [{ type: 'text' as const, text: JSON.stringify(status, null, 2) }] }),
  )

  return server
}

export function getDiscoveryStatus(): DiscoveryStatus {
  return status
}

async function runTracked<T>(rootPath: string, tier: AuditTier, action: () => Promise<T>): Promise<T> {
  status = {
    state: 'running',
    lastPath: rootPath,
    lastRunStartedAtUtc: new Date().toISOString(),
  }

  try {
    const result = await action()
    status = {
      state: 'complete',
      lastPath: rootPath,
      lastRunStartedAtUtc: status.lastRunStartedAtUtc,
      lastRunCompletedAtUtc: new Date().toISOString(),
      highestTierCompleted: tier,
    }
    return result
  } catch (error) {
    status = {
      state: 'failed',
      lastPath: rootPath,
      lastRunStartedAtUtc: status.lastRunStartedAtUtc,
      lastRunCompletedAtUtc: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    }
    throw error
  }
}
