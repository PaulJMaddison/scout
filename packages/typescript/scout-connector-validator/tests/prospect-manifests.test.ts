import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { validateManifest } from '../src/index.js'

const currentDir = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(currentDir, '..', 'data')

const prospectManifestFiles = [
  ['prospectCrmMetadata', 'prospect-crm-metadata.json'],
  ['prospectWebAnalytics', 'prospect-web-analytics.json'],
  ['prospectConversionEvents', 'prospect-conversion-events.json'],
] as const

function loadManifest(fileName: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(dataDir, fileName), 'utf-8')) as Record<string, unknown>
}

describe('prospect metadata connector manifests', () => {
  it.each(prospectManifestFiles)('validates %s as a safe metadata-only manifest', (connectorId, fileName) => {
    const manifest = loadManifest(fileName)
    const result = validateManifest(manifest)

    expect(manifest['connectorId']).toBe(connectorId)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)

    const serialised = JSON.stringify(manifest).toLowerCase()
    expect(serialised).not.toContain('password')
    expect(serialised).not.toContain('secret')
    expect(serialised).not.toContain('token')
    expect(serialised).not.toContain('connectionstring')
    expect(serialised).not.toContain('rawpayload')
    expect(serialised).not.toContain('sourcerows')
    expect(serialised).not.toContain('promptpackage')
    expect(serialised).not.toMatch(/[a-z]:\\/)
    expect(serialised).not.toMatch(/\/users\//)
  })

  it('has no duplicate prospect connector IDs', () => {
    const manifests = prospectManifestFiles.map(([, fileName]) => loadManifest(fileName))
    const ids = manifests.map((manifest) => manifest['connectorId'])

    expect(new Set(ids).size).toBe(ids.length)
  })
})
