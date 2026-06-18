import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { auditCodebase } from './audit.js'
import { generateHandover } from './handover.js'
import { createDiscoveryAgentServer } from './server.js'
import type { AuditTier } from './types.js'

interface CliOptions {
  path: string
  tier: AuditTier
  format: 'json' | 'markdown'
  mcp: boolean
  auditOnly: boolean
  help: boolean
}

export async function runCli(argv: string[]): Promise<void> {
  const options = parseArgs(argv)
  if (options.help) {
    process.stdout.write(helpText())
    return
  }

  if (options.mcp) {
    const server = createDiscoveryAgentServer()
    await server.connect(new StdioServerTransport())
    return
  }

  if (options.auditOnly) {
    const audit = await auditCodebase({ path: options.path, tier: options.tier })
    process.stdout.write(`${JSON.stringify(audit, null, 2)}\n`)
    return
  }

  const handover = await generateHandover(options.path, options.tier)
  process.stdout.write(options.format === 'markdown' ? handover.markdown : `${JSON.stringify(handover.json, null, 2)}\n`)
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    path: '.',
    tier: 1,
    format: 'json',
    mcp: false,
    auditOnly: false,
    help: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    switch (arg) {
      case '--path':
      case '-p':
        options.path = readValue(argv, ++index, arg)
        break
      case '--tier': {
        const value = Number.parseInt(readValue(argv, ++index, arg), 10)
        if (value !== 1 && value !== 2 && value !== 3) {
          throw new Error('--tier must be 1, 2, or 3.')
        }
        options.tier = value
        break
      }
      case '--format': {
        const value = readValue(argv, ++index, arg)
        if (value !== 'json' && value !== 'markdown') {
          throw new Error('--format must be json or markdown.')
        }
        options.format = value
        break
      }
      case '--mcp':
        options.mcp = true
        break
      case '--audit-only':
        options.auditOnly = true
        break
      case '--help':
      case '-h':
        options.help = true
        break
      default:
        throw new Error(`Unknown argument '${arg}'. Use --help for usage.`)
    }
  }

  return options
}

function readValue(argv: string[], index: number, option: string): string {
  const value = argv[index]
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${option} requires a value.`)
  }

  return value
}

function helpText(): string {
  return `KynticAI Discovery Agent

Local-only codebase audit and MCP server.

Usage:
  kyntic-discovery-agent --path . --tier 1
  kyntic-discovery-agent --path . --tier 3 --format markdown
  kyntic-discovery-agent --path . --tier 2 --audit-only
  kyntic-discovery-agent --mcp

Options:
  --path, -p       Local codebase path to audit. Defaults to current directory.
  --tier          1 quick scan, 2 semantic index, 3 governance report. Defaults to 1.
  --format        json or markdown for handover output. Defaults to json.
  --audit-only    Return the raw audit structure instead of the handover document.
  --mcp           Start the MCP stdio server.
  --help, -h      Show this help text.
`
}
