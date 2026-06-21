import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { readApprovedJsonFile } from '../src/buyer-report.js'
import {
  createDiscoverySignature,
  DISCOVERY_SIGNATURE_SCHEMA_ID,
  DiscoverySignatureValidationError,
  exportDiscoverySignature,
  submitApprovedHandoff,
  validateApprovedHandoff,
  validateDiscoverySignature,
  type DiscoverySignature,
} from '../src/signature.js'

const fixturePath = path.resolve('examples', 'synthetic-approved-metadata.json')

function loadSyntheticSignature(): DiscoverySignature {
  return JSON.parse(readFileSync(fixturePath, 'utf-8')) as DiscoverySignature
}

describe('KynticAI Discovery MCP buyer wrapper', () => {
  it('validates and canonicalises a Discovery Signature v1 from synthetic metadata only', () => {
    const signature = createDiscoverySignature(loadSyntheticSignature())

    expect(signature.schemaVersion).toBe(DISCOVERY_SIGNATURE_SCHEMA_ID)
    expect(signature.companyType).toBe('B2B software company')
    expect(signature.targetWorkflow).toContain('Revenue conversion')
    expect(signature.approvedForSyntheticDemoBuild.approved).toBe(true)
    expect(signature.approvedForSyntheticDemoBuild.approvalReference).toBe('LOCAL-SMOKE-001')
    expect(signature.sourceSystemFamilies).toEqual(['CRM', 'Product usage', 'Support desk', 'Website analytics'])
    expect(signature.conversionPoints).toEqual(['demo_request', 'pricing_view', 'trial_signup'])

    const validation = validateDiscoverySignature(signature)
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toHaveLength(0)

    const json = JSON.stringify(signature)
    expect(json).not.toContain('records')
    expect(json).not.toContain('rawPayload')
    expect(json).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  })

  it('rejects forbidden raw data and raw-looking record arrays', () => {
    const unsafe = {
      ...loadSyntheticSignature(),
      connectorManifests: [
        { id: '1', status: 'open', createdAt: '2026-06-21T10:00:00Z' },
        { id: '2', status: 'closed', createdAt: '2026-06-21T11:00:00Z' },
      ],
      records: [],
    }

    const validation = validateDiscoverySignature(unsafe)
    expect(validation.isValid).toBe(false)
    expect(validation.errors.join('\n')).toContain('records')
    expect(validation.errors.join('\n')).toContain('raw record output')
  })

  it('rejects forbidden credential fields and token-like URLs', () => {
    const unsafe = {
      ...loadSyntheticSignature(),
      connectorManifests: [
        {
          connectorType: 'restApi',
          displayName: 'REST API',
          safeMetadataFields: ['apiKey'],
          sampleEntityMappings: [
            {
              sourceField: 'endpoint',
              semanticAttribute: 'conversionProbability',
              description: 'https://user:pass@example.invalid/path?token=abc',
            },
          ],
        },
      ],
    }

    const validation = validateDiscoverySignature(unsafe)
    expect(validation.isValid).toBe(false)
    expect(validation.errors.join('\n')).toContain('credential-like field name')
    expect(validation.errors.join('\n')).toContain('URL with embedded credentials')
    expect(validation.errors.join('\n')).not.toContain('user:pass')
  })

  it('rejects forbidden long payloads and sanitises absolute local paths in errors', () => {
    const unsafe = {
      ...loadSyntheticSignature(),
      governanceNotes: [
        'x'.repeat(900),
        'Review accidentally mentioned C:\\Users\\Admin\\private\\source.txt',
      ],
    }

    const validation = validateDiscoverySignature(unsafe)
    expect(validation.isValid).toBe(false)
    expect(validation.errors.join('\n')).toContain('too long')
    expect(validation.errors.join('\n')).toContain('[REDACTED_PATH]')
    expect(validation.errors.join('\n')).not.toContain('C:\\Users\\Admin')
  })

  it('rejects the full forbidden payload checklist by name', () => {
    const unsafe = {
      ...loadSyntheticSignature(),
      credentials: { user: 'demo' },
      tokens: ['redacted-token-placeholder'],
      connectionString: 'Host=example.invalid;Database=demo;',
      rawPayload: { kind: 'raw' },
      sourceRows: [{ rowNumber: 1 }],
      promptPackage: { name: 'unsafe-prompt-package' },
      analyticsPayload: { eventName: 'unsafe-event' },
      connectorManifests: [
        { id: '1', payload: {}, createdAt: '2026-06-21T10:00:00Z' },
        { id: '2', payload: {}, createdAt: '2026-06-21T11:00:00Z' },
      ],
      governanceNotes: ['x'.repeat(900), 'Review mentioned C:\\Users\\Admin\\private\\source.txt'],
    }

    const validation = validateDiscoverySignature(unsafe)
    const errors = validation.errors.join('\n')

    expect(validation.isValid).toBe(false)
    expect(errors).toContain('credentials')
    expect(errors).toContain('tokens')
    expect(errors).toContain('connectionString')
    expect(errors).toContain('rawPayload')
    expect(errors).toContain('sourceRows')
    expect(errors).toContain('promptPackage')
    expect(errors).toContain('analyticsPayload')
    expect(errors).toContain('raw record output')
    expect(errors).toContain('too long')
    expect(errors).toContain('[REDACTED_PATH]')
    expect(errors).not.toContain('C:\\Users\\Admin')
  })

  it('refuses forbidden approved metadata file names before reading JSON', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'kyntic-discovery-safe-reader-'))
    const blockedPath = path.join(root, 'service-account.json')
    writeFileSync(blockedPath, '{"metadataOnly":false}')

    await expect(readApprovedJsonFile(blockedPath)).rejects.toThrow('Refusing to read')
  })

  it('exports a validated Discovery Signature to a chosen local path', async () => {
    const root = mkdtempSync(path.join(tmpdir(), 'kyntic-discovery-export-'))
    const outputPath = path.join(root, 'discovery-signature.json')
    const result = await exportDiscoverySignature(createDiscoverySignature(loadSyntheticSignature()), outputPath)

    expect(result.exported).toBe(true)
    expect(result.path).toBe(path.resolve(outputPath))
    expect(JSON.parse(readFileSync(outputPath, 'utf-8'))).toMatchObject({
      schemaVersion: DISCOVERY_SIGNATURE_SCHEMA_ID,
      approvedForSyntheticDemoBuild: { approved: true },
    })
  })

  it('keeps handoff disabled by default', () => {
    const result = validateApprovedHandoff({ allowHandoff: false, consent: false })

    expect(result.enabled).toBe(false)
    expect(result.submitted).toBe(false)
    expect(result.reason).toContain('disabled')
  })

  it('submits only the Discovery Signature when endpoint, config, and consent are explicit', async () => {
    const signature = createDiscoverySignature(loadSyntheticSignature())
    const calls: Array<{ input: string; body: string }> = []
    const result = await submitApprovedHandoff(
      signature,
      {
        allowHandoff: true,
        consent: true,
        endpoint: 'https://example.invalid/discovery',
        config: {
          approved: true,
          endpoint: 'https://example.invalid/discovery',
          allowedPayload: DISCOVERY_SIGNATURE_SCHEMA_ID,
          approvalReference: 'IT-APPROVAL-001',
        },
      },
      async (input, init) => {
        calls.push({ input, body: init.body })
        return { status: 202, ok: true }
      },
    )

    expect(result.submitted).toBe(true)
    expect(result.status).toBe(202)
    expect(calls).toHaveLength(1)
    expect(calls[0]?.input).toBe('https://example.invalid/discovery')
    expect(JSON.parse(calls[0]?.body ?? '{}')).toEqual(signature)
    expect(JSON.parse(calls[0]?.body ?? '{}')).not.toHaveProperty('signature')
    expect(JSON.parse(calls[0]?.body ?? '{}')).not.toHaveProperty('approvalReference')
  })

  it('built CLI can produce a Discovery Signature from the synthetic fixture', () => {
    const distEntry = path.resolve('dist', 'kyntic-discovery-mcp.js')
    if (!existsSync(distEntry)) {
      return
    }

    const output = execFileSync(process.execPath, [distEntry, '--metadata', fixturePath, '--signature'], {
      encoding: 'utf-8',
      cwd: path.resolve('.'),
      timeout: 12_000,
    })
    const parsed = JSON.parse(output) as DiscoverySignature

    expect(parsed.schemaVersion).toBe(DISCOVERY_SIGNATURE_SCHEMA_ID)
    expect(parsed.approvedForSyntheticDemoBuild.approvalReference).toBe('LOCAL-SMOKE-001')
  }, 15_000)
})
