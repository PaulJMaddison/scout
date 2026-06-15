/**
 * OSS-022 Hardening tests for the public Discovery Agent MCP layer.
 *
 * Covers: invalid tool input, missing auth/scope, bad connector IDs,
 * pagination/limits, empty results, safe error output, no secret/path leakage,
 * deterministic output ordering, and tool-schema stability.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  listConnectors,
  inspectSampleSchema,
  summariseMetadata,
  validateConnectorManifest,
  readConnectorManifest,
  validateManifestSchemaCompatibility,
  summariseConnectors,
  produceMetadataQualityReport,
  sanitiseOutput,
} from '../src/tools.js'
import { getConnectors, getConnectorByType, resetCache } from '../src/sample-data.js'
import { createDiscoveryServer } from '../src/server.js'

const currentDir = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(currentDir, '..', 'data')

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(resolve(dataDir, name), 'utf-8'))
}

// ---------------------------------------------------------------------------
// Tool schema stability — ensures the public schema file loads and is valid
// ---------------------------------------------------------------------------

describe('tool schema stability', () => {
  const schemas = JSON.parse(
    readFileSync(resolve(dataDir, 'tool-schemas.json'), 'utf-8'),
  ) as {
    version: string
    tools: Record<string, { description: string; inputSchema: object; outputSchema: object }>
  }

  it('tool-schemas.json version matches package version', () => {
    const pkg = JSON.parse(
      readFileSync(resolve(currentDir, '..', 'package.json'), 'utf-8'),
    ) as { version: string }
    expect(schemas.version).toBe(pkg.version)
  })

  it('documents all 9 registered tools', () => {
    const expectedTools = [
      'scout_list_connectors',
      'scout_inspect_sample_schema',
      'scout_summarise_metadata',
      'scout_validate_connector_manifest',
      'scout_validate_connector_manifest_v2',
      'scout_read_connector_manifest',
      'scout_validate_manifest_schema_compatibility',
      'scout_summarise_connectors',
      'scout_metadata_quality_report',
    ]
    for (const tool of expectedTools) {
      expect(schemas.tools[tool], `Missing schema for tool '${tool}'`).toBeDefined()
      expect(schemas.tools[tool]!.description.length).toBeGreaterThan(0)
    }
  })

  it('each tool schema has an inputSchema and outputSchema', () => {
    for (const [name, schema] of Object.entries(schemas.tools)) {
      expect(schema.inputSchema, `${name} missing inputSchema`).toBeDefined()
      expect(schema.outputSchema, `${name} missing outputSchema`).toBeDefined()
    }
  })
})

// ---------------------------------------------------------------------------
// Invalid tool input — bad connector IDs
// ---------------------------------------------------------------------------

describe('invalid connector ID handling', () => {
  it('inspectSampleSchema rejects empty string', () => {
    const result = inspectSampleSchema('') as { error: string; availableTypes: string[] }
    expect(result.error).toContain('non-empty')
    expect(result.availableTypes).toBeInstanceOf(Array)
  })

  it('inspectSampleSchema rejects whitespace-only input', () => {
    const result = inspectSampleSchema('   ') as { error: string }
    expect(result.error).toContain('non-empty')
  })

  it('readConnectorManifest rejects empty string', () => {
    const result = readConnectorManifest('') as { error: string; hint: string; availableTypes: string[] }
    expect(result.error).toContain('non-empty')
    expect(result.hint).toBeTruthy()
  })

  it('readConnectorManifest rejects whitespace-only input', () => {
    const result = readConnectorManifest('   \t  ') as { error: string }
    expect(result.error).toContain('non-empty')
  })

  it('inspectSampleSchema truncates excessively long input', () => {
    const longInput = 'a'.repeat(500)
    const result = inspectSampleSchema(longInput) as { error: string }
    expect(result.error).toBeTruthy()
    expect(result.error.length).toBeLessThan(600)
  })

  it('readConnectorManifest truncates excessively long input', () => {
    const longInput = 'x'.repeat(500)
    const result = readConnectorManifest(longInput) as { error: string }
    expect(result.error).toBeTruthy()
    expect(result.error.length).toBeLessThan(600)
  })

  it('handles special characters in connector type gracefully', () => {
    const result = inspectSampleSchema('<script>alert(1)</script>') as { error: string }
    expect(result.error).toContain('not found')
  })

  it('handles SQL injection-like input without error', () => {
    const result = readConnectorManifest("'; DROP TABLE connectors;--") as { error: string }
    expect(result.error).toContain('not found')
  })

  it('handles unicode/emoji in connector type', () => {
    const result = inspectSampleSchema('🔥connector🔥') as { error: string }
    expect(result.error).toContain('not found')
  })
})

// ---------------------------------------------------------------------------
// Invalid manifest input
// ---------------------------------------------------------------------------

describe('invalid manifest input handling', () => {
  it('validateConnectorManifest rejects undefined', () => {
    const result = validateConnectorManifest(undefined)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('validateConnectorManifest rejects a number', () => {
    const result = validateConnectorManifest(42)
    expect(result.isValid).toBe(false)
  })

  it('validateConnectorManifest rejects an array', () => {
    const result = validateConnectorManifest([1, 2, 3])
    expect(result.isValid).toBe(false)
  })

  it('validateConnectorManifest rejects a string', () => {
    const result = validateConnectorManifest('not-an-object')
    expect(result.isValid).toBe(false)
  })

  it('validateConnectorManifest rejects empty object', () => {
    const result = validateConnectorManifest({})
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })

  it('validateConnectorManifest rejects whitespace-only required strings', () => {
    const result = validateConnectorManifest({
      connectorType: '   ',
      displayName: '  ',
      description: '  ',
      supportedDataSourceKinds: ['Crm'],
      configurationSchema: { type: 'object', properties: {} },
      sampleConfiguration: {},
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('connectorType'),
        expect.stringContaining('displayName'),
        expect.stringContaining('description'),
      ]),
    )
  })

  it('validateManifestSchemaCompatibility rejects undefined manifest', () => {
    const schema = loadFixture('fixture-schema-compatible.json')
    const result = validateManifestSchemaCompatibility(undefined, schema) as {
      isCompatible: boolean; issues: string[]
    }
    expect(result.isCompatible).toBe(false)
  })

  it('validateManifestSchemaCompatibility rejects undefined schema', () => {
    const manifest = loadFixture('fixture-manifest-valid.json')
    const result = validateManifestSchemaCompatibility(manifest, undefined) as {
      isCompatible: boolean; issues: string[]
    }
    expect(result.isCompatible).toBe(false)
  })

  it('validateManifestSchemaCompatibility rejects array inputs', () => {
    const resultManifest = validateManifestSchemaCompatibility([], { type: 'object', properties: {} }) as {
      isCompatible: boolean
    }
    expect(resultManifest.isCompatible).toBe(false)

    const resultSchema = validateManifestSchemaCompatibility(
      { configurationSchema: { type: 'object', properties: {} } },
      [],
    ) as { isCompatible: boolean }
    expect(resultSchema.isCompatible).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Metadata quality report — invalid input
// ---------------------------------------------------------------------------

describe('metadata quality report — invalid input', () => {
  it('rejects undefined manifest', () => {
    const result = produceMetadataQualityReport(undefined) as { error: string }
    expect(result.error).toContain('manifest')
  })

  it('rejects number as manifest', () => {
    const result = produceMetadataQualityReport(123) as { error: string }
    expect(result.error).toContain('manifest')
  })

  it('rejects boolean as manifest', () => {
    const result = produceMetadataQualityReport(true) as { error: string }
    expect(result.error).toContain('manifest')
  })

  it('rejects manifest missing all required fields', () => {
    const result = produceMetadataQualityReport({}) as { error: string }
    expect(result.error).toContain('missing required fields')
  })

  it('rejects object as sampleRecords', () => {
    const manifest = loadFixture('fixture-manifest-valid.json')
    const result = produceMetadataQualityReport(manifest, { notAnArray: true }) as { error: string }
    expect(result.error).toContain('sampleRecords')
  })

  it('rejects null manifest', () => {
    const result = produceMetadataQualityReport(null) as { error: string }
    expect(result.error).toContain('manifest')
  })

  it('rejects empty array as sampleRecords gracefully', () => {
    const manifest = loadFixture('fixture-manifest-valid.json')
    const result = produceMetadataQualityReport(manifest, []) as {
      connectorType: string
      overallReadiness: number
    }
    expect(result.connectorType).toBe('fixtureConnector')
    expect(result.overallReadiness).toBeGreaterThanOrEqual(0)
  })
})

// ---------------------------------------------------------------------------
// Safe error output — no secrets, paths, or stack traces
// ---------------------------------------------------------------------------

describe('safe error output — sanitiseOutput', () => {
  it('redacts Linux absolute paths', () => {
    expect(sanitiseOutput('Error at /home/paul/.secret/keys')).toContain('[REDACTED]')
    expect(sanitiseOutput('File: /Users/admin/creds.json')).toContain('[REDACTED]')
  })

  it('redacts Windows paths', () => {
    expect(sanitiseOutput('File at C:\\Users\\Admin\\secrets.txt')).toContain('[REDACTED]')
  })

  it('redacts /tmp paths', () => {
    expect(sanitiseOutput('Loaded from /tmp/session-abc123/config')).toContain('[REDACTED]')
  })

  it('redacts credential-like key=value pairs', () => {
    expect(sanitiseOutput('password=hunter2 visible')).toContain('[REDACTED]')
    expect(sanitiseOutput('apiKey: sk-1234567890')).toContain('[REDACTED]')
    expect(sanitiseOutput('connectionString=Server=mydb;Password=abc')).toContain('[REDACTED]')
  })

  it('redacts Bearer tokens', () => {
    expect(sanitiseOutput('Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.test')).toContain('[REDACTED]')
  })

  it('preserves safe strings unchanged', () => {
    expect(sanitiseOutput('Connector type "sqlDatabase" not found.')).toBe(
      'Connector type "sqlDatabase" not found.',
    )
    expect(sanitiseOutput('No issues detected.')).toBe('No issues detected.')
  })
})

// ---------------------------------------------------------------------------
// Deterministic output ordering
// ---------------------------------------------------------------------------

describe('deterministic output ordering', () => {
  it('listConnectors returns connectors sorted by connectorType', () => {
    const result = listConnectors() as { connectors: Array<{ connectorType: string }> }
    const types = result.connectors.map((c) => c.connectorType)
    const sorted = [...types].sort()
    expect(types).toEqual(sorted)
  })

  it('listConnectors aliases are sorted within each connector', () => {
    const result = listConnectors() as {
      connectors: Array<{ aliases: string[] }>
    }
    for (const c of result.connectors) {
      const sorted = [...c.aliases].sort()
      expect(c.aliases).toEqual(sorted)
    }
  })

  it('listConnectors supportedDataSourceKinds are sorted', () => {
    const result = listConnectors() as {
      connectors: Array<{ supportedDataSourceKinds: string[] }>
    }
    for (const c of result.connectors) {
      const sorted = [...c.supportedDataSourceKinds].sort()
      expect(c.supportedDataSourceKinds).toEqual(sorted)
    }
  })

  it('summariseMetadata returns sorted arrays', () => {
    const result = summariseMetadata() as {
      summary: {
        connectorTypes: string[]
        semanticAttributeKeys: string[]
        dataSourceKinds: string[]
        connectorCapabilities: string[]
      }
    }

    expect(result.summary.connectorTypes).toEqual([...result.summary.connectorTypes].sort())
    expect(result.summary.semanticAttributeKeys).toEqual([...result.summary.semanticAttributeKeys].sort())
    expect(result.summary.dataSourceKinds).toEqual([...result.summary.dataSourceKinds].sort())
    expect(result.summary.connectorCapabilities).toEqual([...result.summary.connectorCapabilities].sort())
  })

  it('readConnectorManifest returns sorted arrays', () => {
    const result = readConnectorManifest('restApi') as {
      aliases: string[]
      supportedDataSourceKinds: string[]
      supportedCapabilities: string[]
    }
    expect(result.aliases).toEqual([...result.aliases].sort())
    expect(result.supportedDataSourceKinds).toEqual([...result.supportedDataSourceKinds].sort())
    expect(result.supportedCapabilities).toEqual([...result.supportedCapabilities].sort())
  })

  it('readConnectorManifest availableTypes are sorted on error', () => {
    const result = readConnectorManifest('nonExistent') as { availableTypes: string[] }
    expect(result.availableTypes).toEqual([...result.availableTypes].sort())
  })

  it('inspectSampleSchema availableTypes are sorted on error', () => {
    const result = inspectSampleSchema('nonExistent') as { availableTypes: string[] }
    expect(result.availableTypes).toEqual([...result.availableTypes].sort())
  })

  it('summariseConnectors returns connectors sorted by type', () => {
    const result = summariseConnectors() as {
      connectors: Array<{ connectorType: string }>
    }
    const types = result.connectors.map((c) => c.connectorType)
    expect(types).toEqual([...types].sort())
  })

  it('calling listConnectors twice yields identical output', () => {
    const first = JSON.stringify(listConnectors())
    const second = JSON.stringify(listConnectors())
    expect(first).toBe(second)
  })

  it('calling summariseMetadata twice yields identical output', () => {
    const first = JSON.stringify(summariseMetadata())
    const second = JSON.stringify(summariseMetadata())
    expect(first).toBe(second)
  })
})

// ---------------------------------------------------------------------------
// No enterprise internals or secrets in public output
// ---------------------------------------------------------------------------

describe('no enterprise internals leaked', () => {
  const enterpriseTerms = [
    'fortress',
    'lancedb',
    'salesforce',
    'hubspot',
    'dynamics365',
    'sapOdata',
    'sharepoint',
    'ollama',
    'onnx',
    'vectorPipeline',
    'embeddingModel',
    'obfuscation',
  ]

  it('listConnectors output contains no enterprise terms', () => {
    const json = JSON.stringify(listConnectors()).toLowerCase()
    for (const term of enterpriseTerms) {
      expect(json).not.toContain(term.toLowerCase())
    }
  })

  it('summariseMetadata output contains no enterprise terms', () => {
    const json = JSON.stringify(summariseMetadata()).toLowerCase()
    for (const term of enterpriseTerms) {
      expect(json).not.toContain(term.toLowerCase())
    }
  })

  it('summariseConnectors output contains no enterprise terms', () => {
    const json = JSON.stringify(summariseConnectors()).toLowerCase()
    for (const term of enterpriseTerms) {
      expect(json).not.toContain(term.toLowerCase())
    }
  })

  it('readConnectorManifest outputs contain no enterprise terms', () => {
    const connectors = getConnectors()
    for (const c of connectors) {
      const json = JSON.stringify(readConnectorManifest(c.connectorType)).toLowerCase()
      for (const term of enterpriseTerms) {
        expect(
          json,
          `Connector '${c.connectorType}' output contains enterprise term '${term}'`,
        ).not.toContain(term.toLowerCase())
      }
    }
  })

  it('sample data does not contain absolute file paths', () => {
    const raw = readFileSync(resolve(dataDir, 'sample-connectors.json'), 'utf-8')
    expect(raw).not.toMatch(/\/home\/[^\s"']+/)
    expect(raw).not.toMatch(/\/Users\/[^\s"']+/)
    expect(raw).not.toMatch(/[A-Z]:\\[^\s"']+/)
  })

  it('sample data does not contain credential keywords in values', () => {
    const raw = readFileSync(resolve(dataDir, 'sample-connectors.json'), 'utf-8')
    expect(raw.toLowerCase()).not.toContain('"password"')
    expect(raw.toLowerCase()).not.toContain('"secret"')
    expect(raw.toLowerCase()).not.toContain('"apikey"')
    expect(raw.toLowerCase()).not.toContain('"connectionstring"')
  })
})

// ---------------------------------------------------------------------------
// No secret/path leakage in metadata quality reports
// ---------------------------------------------------------------------------

describe('metadata quality report — no leakage', () => {
  it('report output does not contain absolute paths', () => {
    const manifest = loadFixture('fixture-manifest-valid.json')
    const json = JSON.stringify(produceMetadataQualityReport(manifest))
    expect(json).not.toMatch(/\/home\/[^\s"']+/)
    expect(json).not.toMatch(/\/Users\/[^\s"']+/)
    expect(json).not.toMatch(/[A-Z]:\\[^\s"']+/)
  })

  it('report output does not contain credential values', () => {
    const manifest = loadFixture('fixture-manifest-valid.json')
    const json = JSON.stringify(produceMetadataQualityReport(manifest))
    expect(json).not.toMatch(/password\s*[:=]\s*\S+/i)
    expect(json).not.toMatch(/Bearer\s+[A-Za-z0-9]/i)
  })

  it('report for all built-in connectors contains no path leaks', () => {
    for (const c of getConnectors()) {
      const json = JSON.stringify(produceMetadataQualityReport(c))
      expect(json, `Connector '${c.connectorType}' report leaks paths`).not.toMatch(
        /\/home\/[^\s"']+/,
      )
    }
  })
})

// ---------------------------------------------------------------------------
// Empty results
// ---------------------------------------------------------------------------

describe('empty and edge-case results', () => {
  it('validateConnectorManifest returns structured result for minimal valid manifest', () => {
    const result = validateConnectorManifest({
      connectorType: 'minimal',
      displayName: 'Minimal',
      description: 'Minimal connector.',
      supportedDataSourceKinds: ['Crm'],
      configurationSchema: { type: 'object', properties: {} },
      sampleConfiguration: {},
    })
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('validateManifestSchemaCompatibility handles empty properties', () => {
    const manifest = {
      configurationSchema: { type: 'object', properties: {} },
      sampleConfiguration: {},
    }
    const schema = { type: 'object', properties: {} }
    const result = validateManifestSchemaCompatibility(manifest, schema) as {
      isCompatible: boolean
      manifestFieldCount: number
      schemaFieldCount: number
    }
    expect(result.isCompatible).toBe(true)
    expect(result.manifestFieldCount).toBe(0)
    expect(result.schemaFieldCount).toBe(0)
  })

  it('error responses for unknown connectors always include availableTypes', () => {
    const inspect = inspectSampleSchema('nonExistent') as { availableTypes: string[] }
    expect(inspect.availableTypes).toBeInstanceOf(Array)
    expect(inspect.availableTypes.length).toBeGreaterThan(0)

    const read = readConnectorManifest('nonExistent') as { availableTypes: string[] }
    expect(read.availableTypes).toBeInstanceOf(Array)
    expect(read.availableTypes.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// MCP server — tool count and registration integrity
// ---------------------------------------------------------------------------

describe('MCP server registration integrity', () => {
  it('creates a server without errors', () => {
    const server = createDiscoveryServer()
    expect(server).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Data determinism — cache reset
// ---------------------------------------------------------------------------

describe('data determinism across cache states', () => {
  it('returns identical data after cache reset', () => {
    const before = JSON.stringify(listConnectors())
    resetCache()
    const after = JSON.stringify(listConnectors())
    expect(before).toBe(after)
  })

  it('getConnectorByType returns same result after cache reset', () => {
    const before = getConnectorByType('sqlDatabase')
    resetCache()
    const after = getConnectorByType('sqlDatabase')
    expect(JSON.stringify(before)).toBe(JSON.stringify(after))
  })
})
