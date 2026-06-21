import { writeFile } from 'node:fs/promises'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createKynticDiscoveryMcpServer } from './buyer-server.js'
import {
  createLocalDiscoveryReport,
  readApprovedJsonFile,
  renderLocalReportMarkdown,
} from './buyer-report.js'
import {
  createDiscoverySignature,
  DISCOVERY_SIGNATURE_SCHEMA_ID,
  exportDiscoverySignature,
  submitApprovedHandoff,
  validateApprovedHandoff,
  type ApprovedHandoffConfig,
  type ApprovedHandoffOptions,
  type DiscoverySignature,
} from './signature.js'
import { assertDiscoveryWritableFile } from './safe-paths.js'
import type { AuditTier } from './types.js'

interface BuyerCliOptions {
  help: boolean
  mcp: boolean
  path?: string
  tier: AuditTier
  audit: boolean
  handover: boolean
  connectorType?: string
  manifestPath?: string
  metadataPath?: string
  signatureOnly: boolean
  format: 'json' | 'markdown'
  outPath?: string
  exportSignaturePath?: string
  allowHandoff: boolean
  consentHandoff: boolean
  handoffEndpoint?: string
  handoffConfigPath?: string
  submitHandoff: boolean
}

export async function runBuyerCli(argv: string[]): Promise<void> {
  const options = parseBuyerArgs(argv)
  if (options.help) {
    process.stdout.write(helpText())
    return
  }

  const handoff = await loadHandoffOptions(options)
  if (options.mcp) {
    const server = createKynticDiscoveryMcpServer({ handoff })
    await server.connect(new StdioServerTransport())
    return
  }

  const approvedMetadata = options.metadataPath !== undefined
    ? await readApprovedJsonFile(options.metadataPath)
    : undefined
  const manifest = options.manifestPath !== undefined
    ? await readApprovedJsonFile(options.manifestPath)
    : undefined

  if (options.signatureOnly) {
    if (approvedMetadata === undefined) {
      throw new Error('--signature requires --metadata with an approved Discovery Signature draft JSON file.')
    }

    const signature = createDiscoverySignature(approvedMetadata)
    const exportResult = options.exportSignaturePath !== undefined
      ? await exportDiscoverySignature(signature, options.exportSignaturePath)
      : undefined
    const output = options.submitHandoff
      ? {
          signature,
          ...(exportResult !== undefined ? { export: exportResult } : {}),
          handoff: await submitSignatureIfApproved(signature, handoff),
        }
      : exportResult !== undefined
        ? { signature, export: exportResult }
      : signature
    await writeOutput(JSON.stringify(output, null, 2), options.outPath)
    return
  }

  const report = await createLocalDiscoveryReport({
    codebasePath: options.path,
    auditTier: options.tier,
    includeAudit: options.audit,
    includeHandover: options.handover,
    connectorType: options.connectorType,
    manifest,
    approvedMetadata,
    handoff,
    submitHandoff: options.submitHandoff,
  })
  if (options.exportSignaturePath !== undefined) {
    if (report.discoverySignature === undefined) {
      throw new Error('--export-signature requires --metadata so a Discovery Signature can be generated.')
    }
    await exportDiscoverySignature(report.discoverySignature, options.exportSignaturePath)
  }
  const output = options.format === 'markdown'
    ? renderLocalReportMarkdown(report)
    : JSON.stringify(report, null, 2)
  await writeOutput(output, options.outPath)
}

function parseBuyerArgs(argv: string[]): BuyerCliOptions {
  const options: BuyerCliOptions = {
    help: false,
    mcp: false,
    tier: 1,
    audit: false,
    handover: false,
    signatureOnly: false,
    format: 'json',
    allowHandoff: false,
    consentHandoff: false,
    submitHandoff: false,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    switch (arg) {
      case '--help':
      case '-h':
        options.help = true
        break
      case '--mcp':
        options.mcp = true
        break
      case '--path':
      case '-p':
        options.path = readValue(argv, ++index, arg)
        break
      case '--tier': {
        const tier = Number.parseInt(readValue(argv, ++index, arg), 10)
        if (tier !== 1 && tier !== 2 && tier !== 3) {
          throw new Error('--tier must be 1, 2, or 3.')
        }
        options.tier = tier
        break
      }
      case '--audit':
        options.audit = true
        break
      case '--handover':
        options.handover = true
        if (options.tier === 1) options.tier = 3
        break
      case '--connector-type':
        options.connectorType = readValue(argv, ++index, arg)
        break
      case '--manifest':
        options.manifestPath = readValue(argv, ++index, arg)
        break
      case '--metadata':
        options.metadataPath = readValue(argv, ++index, arg)
        break
      case '--signature':
        options.signatureOnly = true
        break
      case '--format': {
        const format = readValue(argv, ++index, arg)
        if (format !== 'json' && format !== 'markdown') {
          throw new Error('--format must be json or markdown.')
        }
        options.format = format
        break
      }
      case '--out':
        options.outPath = readValue(argv, ++index, arg)
        break
      case '--export-signature':
        options.exportSignaturePath = readValue(argv, ++index, arg)
        break
      case '--allow-handoff':
        options.allowHandoff = true
        break
      case '--consent-handoff':
        options.consentHandoff = true
        break
      case '--handoff-endpoint':
        options.handoffEndpoint = readValue(argv, ++index, arg)
        break
      case '--handoff-config':
        options.handoffConfigPath = readValue(argv, ++index, arg)
        break
      case '--submit-handoff':
        options.submitHandoff = true
        break
      default:
        throw new Error(`Unknown argument '${arg}'. Use --help for usage.`)
    }
  }

  return options
}

async function loadHandoffOptions(options: BuyerCliOptions): Promise<ApprovedHandoffOptions> {
  if (!options.allowHandoff) {
    return { allowHandoff: false, consent: false }
  }

  const config = options.handoffConfigPath !== undefined
    ? parseApprovedHandoffConfig(await readApprovedJsonFile(options.handoffConfigPath))
    : undefined

  return {
    allowHandoff: true,
    consent: options.consentHandoff,
    endpoint: options.handoffEndpoint,
    config,
  }
}

function parseApprovedHandoffConfig(value: unknown): ApprovedHandoffConfig {
  if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>)['approved'] === true &&
    typeof (value as Record<string, unknown>)['endpoint'] === 'string' &&
    (value as Record<string, unknown>)['allowedPayload'] === DISCOVERY_SIGNATURE_SCHEMA_ID &&
    typeof (value as Record<string, unknown>)['approvalReference'] === 'string'
  ) {
    return value as ApprovedHandoffConfig
  }

  throw new Error(`Handoff config must approve ${DISCOVERY_SIGNATURE_SCHEMA_ID} with endpoint and approvalReference.`)
}

async function submitSignatureIfApproved(
  signature: DiscoverySignature,
  handoff: ApprovedHandoffOptions,
): Promise<object> {
  const validation = validateApprovedHandoff(handoff)
  if (!validation.enabled) {
    return validation
  }

  return submitApprovedHandoff(signature, handoff)
}

async function writeOutput(output: string, outPath: string | undefined): Promise<void> {
  if (outPath !== undefined) {
    assertDiscoveryWritableFile(outPath)
    await writeFile(outPath, `${output}\n`, 'utf-8')
    return
  }

  process.stdout.write(`${output}\n`)
}

function readValue(argv: string[], index: number, option: string): string {
  const value = argv[index]
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${option} requires a value.`)
  }

  return value
}

function helpText(): string {
  return `KynticAI Discovery MCP

Buyer-facing local discovery wrapper for KynticAI Scout metadata and approved synthetic-demo handoff.

Usage:
  kyntic-discovery-mcp --mcp
  kyntic-discovery-mcp --path . --audit --tier 2
  kyntic-discovery-mcp --path . --handover
  kyntic-discovery-mcp --manifest ./connector-manifest.json
  kyntic-discovery-mcp --metadata ./approved-signature.json --signature
  kyntic-discovery-mcp --metadata ./approved-signature.json --signature --export-signature ./discovery-signature.json
  kyntic-discovery-mcp --metadata ./approved-signature.json --signature --submit-handoff --allow-handoff --consent-handoff --handoff-endpoint https://example.invalid/discovery --handoff-config ./handoff-approved.json

Options:
  --mcp                Start the MCP stdio server.
  --path, -p           Local codebase path to audit when --audit or --handover is set.
  --tier               1 quick scan, 2 semantic index, 3 governance report. Defaults to 1.
  --audit              Include local codebase audit output.
  --handover           Include local handover output. Defaults tier to 3 unless overridden.
  --connector-type     Inspect one public connector manifest by type or alias.
  --manifest           Approved connector manifest JSON file for validation and metadata quality report.
  --metadata           Approved Discovery Signature draft JSON file.
  --signature          Output only the Discovery Signature. Requires --metadata.
  --format             json or markdown for the local report. Defaults to json.
  --out                Write output to a local file instead of stdout.
  --export-signature   Write the validated Discovery Signature to a chosen local path.
  --allow-handoff      Enable handoff checks. Network remains disabled without endpoint, approved config, and consent.
  --consent-handoff    Explicit operator consent to send the Discovery Signature only.
  --handoff-endpoint   Approved https endpoint for optional Discovery Signature handoff.
  --handoff-config     Approved handoff config JSON.
  --submit-handoff     Submit only the Discovery Signature when handoff validation passes.
  --help, -h           Show this help text.

Safe-output contract:
  Local report output is the default. Network handoff is disabled unless --submit-handoff, --allow-handoff, --consent-handoff, --handoff-endpoint, and --handoff-config are all present and valid.
`
}
