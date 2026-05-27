import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  validateManifest,
  KNOWN_SOURCE_TYPES,
  KNOWN_CAPABILITIES,
  KNOWN_SEMANTIC_ATTRIBUTES,
  UNSAFE_FIELD_NAMES,
} from '../src/index.js'

const currentDir = dirname(fileURLToPath(import.meta.url))
const samplePath = resolve(currentDir, '..', 'data', 'sample-manifest.json')

function loadSampleManifest(): Record<string, unknown> {
  return JSON.parse(readFileSync(samplePath, 'utf-8')) as Record<string, unknown>
}

function validManifest(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    connectorId: 'testConnector',
    displayName: 'Test Connector',
    version: '1.0.0',
    description: 'A test connector for validation.',
    supportedSourceTypes: ['Crm'],
    requiredConfigFields: [
      { name: 'endpoint', type: 'string', description: 'API endpoint.' },
    ],
    safeMetadataFields: ['connectorId', 'displayName'],
    sampleEntityMappings: [
      {
        sourceField: 'deal_probability',
        semanticAttribute: 'conversionProbability',
        description: 'Maps deal probability to conversion probability.',
      },
    ],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Valid manifest
// ---------------------------------------------------------------------------

describe('valid manifest', () => {
  it('accepts a well-formed manifest', () => {
    const result = validateManifest(validManifest())
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('accepts the bundled sample manifest', () => {
    const manifest = loadSampleManifest()
    const result = validateManifest(manifest)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('accepts a manifest with all optional fields', () => {
    const result = validateManifest(
      validManifest({
        aliases: ['testAlias'],
        capabilities: ['FetchSubject', 'Preview'],
        configurationSchema: {
          type: 'object',
          required: ['endpoint'],
          properties: {
            endpoint: { type: 'string', description: 'API endpoint.' },
          },
        },
        sampleConfiguration: { endpoint: 'https://api.example.com' },
      }),
    )
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('accepts a manifest with a pre-release version', () => {
    const result = validateManifest(validManifest({ version: '1.0.0-beta.1' }))
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Missing fields
// ---------------------------------------------------------------------------

describe('missing fields', () => {
  it('rejects null input', () => {
    const result = validateManifest(null)
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('non-null')]),
    )
  })

  it('rejects undefined input', () => {
    const result = validateManifest(undefined)
    expect(result.isValid).toBe(false)
  })

  it('rejects a manifest missing connectorId', () => {
    const m = validManifest()
    delete m['connectorId']
    const result = validateManifest(m)
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('connectorId')]),
    )
  })

  it('rejects a manifest with empty connectorId', () => {
    const result = validateManifest(validManifest({ connectorId: '  ' }))
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('connectorId')]),
    )
  })

  it('rejects a manifest missing displayName', () => {
    const m = validManifest()
    delete m['displayName']
    const result = validateManifest(m)
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('displayName')]),
    )
  })

  it('rejects a manifest missing version', () => {
    const m = validManifest()
    delete m['version']
    const result = validateManifest(m)
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('version')]),
    )
  })

  it('rejects a manifest with invalid semver', () => {
    const result = validateManifest(validManifest({ version: 'not-a-version' }))
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('semantic versioning')]),
    )
  })

  it('rejects a manifest missing description', () => {
    const m = validManifest()
    delete m['description']
    const result = validateManifest(m)
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('description')]),
    )
  })

  it('rejects a manifest missing supportedSourceTypes', () => {
    const m = validManifest()
    delete m['supportedSourceTypes']
    const result = validateManifest(m)
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('supportedSourceTypes')]),
    )
  })

  it('rejects a manifest with empty supportedSourceTypes', () => {
    const result = validateManifest(validManifest({ supportedSourceTypes: [] }))
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('supportedSourceTypes')]),
    )
  })

  it('rejects a manifest missing requiredConfigFields', () => {
    const m = validManifest()
    delete m['requiredConfigFields']
    const result = validateManifest(m)
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('requiredConfigFields')]),
    )
  })

  it('rejects a manifest with empty requiredConfigFields', () => {
    const result = validateManifest(validManifest({ requiredConfigFields: [] }))
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('requiredConfigFields')]),
    )
  })

  it('rejects a requiredConfigField missing name', () => {
    const result = validateManifest(
      validManifest({
        requiredConfigFields: [
          { type: 'string', description: 'A field.' },
        ],
      }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('requiredConfigFields[0].name')]),
    )
  })

  it('rejects a requiredConfigField with invalid type', () => {
    const result = validateManifest(
      validManifest({
        requiredConfigFields: [
          { name: 'field', type: 'invalidType', description: 'A field.' },
        ],
      }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining("'invalidType'")]),
    )
  })

  it('rejects a manifest missing sampleEntityMappings', () => {
    const m = validManifest()
    delete m['sampleEntityMappings']
    const result = validateManifest(m)
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('sampleEntityMappings')]),
    )
  })

  it('rejects a manifest with empty sampleEntityMappings', () => {
    const result = validateManifest(validManifest({ sampleEntityMappings: [] }))
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('sampleEntityMappings')]),
    )
  })

  it('rejects a sampleEntityMapping missing sourceField', () => {
    const result = validateManifest(
      validManifest({
        sampleEntityMappings: [
          { semanticAttribute: 'conversionProbability' },
        ],
      }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('sourceField')]),
    )
  })

  it('rejects a sampleEntityMapping missing semanticAttribute', () => {
    const result = validateManifest(
      validManifest({
        sampleEntityMappings: [
          { sourceField: 'deal_probability' },
        ],
      }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('semanticAttribute')]),
    )
  })

  it('rejects safeMetadataFields that is not an array', () => {
    const result = validateManifest(validManifest({ safeMetadataFields: 'notAnArray' }))
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('safeMetadataFields')]),
    )
  })
})

// ---------------------------------------------------------------------------
// Unknown source types
// ---------------------------------------------------------------------------

describe('unknown source types', () => {
  it('warns about an unrecognised source type', () => {
    const result = validateManifest(
      validManifest({ supportedSourceTypes: ['FictionalSource'] }),
    )
    expect(result.isValid).toBe(true)
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('FictionalSource')]),
    )
  })

  it('accepts all known source types without warnings', () => {
    const result = validateManifest(
      validManifest({ supportedSourceTypes: [...KNOWN_SOURCE_TYPES] }),
    )
    expect(result.isValid).toBe(true)
    expect(
      result.warnings.filter((w) => w.includes('source type')),
    ).toHaveLength(0)
  })

  it('warns about unrecognised semantic attributes', () => {
    const result = validateManifest(
      validManifest({
        sampleEntityMappings: [
          {
            sourceField: 'custom_field',
            semanticAttribute: 'unknownAttribute',
          },
        ],
      }),
    )
    expect(result.isValid).toBe(true)
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('unknownAttribute')]),
    )
  })

  it('warns about unrecognised capabilities', () => {
    const result = validateManifest(
      validManifest({ capabilities: ['CustomCapability'] }),
    )
    expect(result.isValid).toBe(true)
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('CustomCapability')]),
    )
  })
})

// ---------------------------------------------------------------------------
// Unsafe field names
// ---------------------------------------------------------------------------

describe('unsafe field names', () => {
  it('rejects password in safeMetadataFields', () => {
    const result = validateManifest(
      validManifest({ safeMetadataFields: ['password'] }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('password')]),
    )
  })

  it('rejects apiKey in safeMetadataFields (case-insensitive)', () => {
    const result = validateManifest(
      validManifest({ safeMetadataFields: ['APIKEY'] }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('APIKEY')]),
    )
  })

  it('rejects token in safeMetadataFields', () => {
    const result = validateManifest(
      validManifest({ safeMetadataFields: ['token'] }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('token')]),
    )
  })

  it('rejects connectionString in safeMetadataFields', () => {
    const result = validateManifest(
      validManifest({ safeMetadataFields: ['connectionString'] }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('connectionString')]),
    )
  })

  it('rejects all known unsafe field names', () => {
    for (const unsafeField of UNSAFE_FIELD_NAMES) {
      const result = validateManifest(
        validManifest({ safeMetadataFields: [unsafeField] }),
      )
      expect(
        result.isValid,
        `Expected '${unsafeField}' to be rejected as unsafe`,
      ).toBe(false)
    }
  })

  it('warns about duplicate entries in safeMetadataFields', () => {
    const result = validateManifest(
      validManifest({ safeMetadataFields: ['connectorId', 'connectorId'] }),
    )
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('Duplicate')]),
    )
  })
})

// ---------------------------------------------------------------------------
// Duplicate connector IDs
// ---------------------------------------------------------------------------

describe('duplicate connector IDs', () => {
  it('detects a duplicate connector ID', () => {
    const result = validateManifest(validManifest({ connectorId: 'sqlDatabase' }), {
      knownConnectorIds: ['sqlDatabase', 'restApi', 'mock'],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('sqlDatabase')]),
    )
  })

  it('detects a case-insensitive duplicate', () => {
    const result = validateManifest(validManifest({ connectorId: 'restapi' }), {
      knownConnectorIds: ['restApi'],
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('restApi')]),
    )
  })

  it('passes when no known IDs conflict', () => {
    const result = validateManifest(validManifest({ connectorId: 'uniqueConnector' }), {
      knownConnectorIds: ['sqlDatabase', 'restApi'],
    })
    expect(result.isValid).toBe(true)
  })

  it('passes when knownConnectorIds is not provided', () => {
    const result = validateManifest(validManifest())
    expect(result.isValid).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Connector ID format
// ---------------------------------------------------------------------------

describe('connector ID format', () => {
  it('rejects a connector ID starting with uppercase', () => {
    const result = validateManifest(validManifest({ connectorId: 'BadId' }))
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('lowercase')]),
    )
  })

  it('rejects a connector ID with hyphens', () => {
    const result = validateManifest(validManifest({ connectorId: 'my-connector' }))
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('camelCase')]),
    )
  })

  it('accepts a valid camelCase ID', () => {
    const result = validateManifest(validManifest({ connectorId: 'myCrmConnector' }))
    expect(result.isValid).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Configuration schema validation
// ---------------------------------------------------------------------------

describe('configuration schema', () => {
  it('rejects a schema without type: object', () => {
    const result = validateManifest(
      validManifest({
        configurationSchema: { type: 'array', properties: {} },
      }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('"type": "object"')]),
    )
  })

  it('rejects a schema without properties', () => {
    const result = validateManifest(
      validManifest({
        configurationSchema: { type: 'object' },
      }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('"properties"')]),
    )
  })

  it('rejects sampleConfiguration missing required schema fields', () => {
    const result = validateManifest(
      validManifest({
        configurationSchema: {
          type: 'object',
          required: ['endpoint', 'apiVersion'],
          properties: {
            endpoint: { type: 'string' },
            apiVersion: { type: 'string' },
          },
        },
        sampleConfiguration: { endpoint: 'https://example.com' },
      }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('apiVersion')]),
    )
  })
})

// ---------------------------------------------------------------------------
// Schema constants
// ---------------------------------------------------------------------------

describe('schema constants', () => {
  it('exports all 4 known source types', () => {
    expect(KNOWN_SOURCE_TYPES).toContain('Crm')
    expect(KNOWN_SOURCE_TYPES).toContain('SqlMetric')
    expect(KNOWN_SOURCE_TYPES).toContain('EventStream')
    expect(KNOWN_SOURCE_TYPES).toContain('ProductUsage')
    expect(KNOWN_SOURCE_TYPES).toHaveLength(4)
  })

  it('exports all 8 known capabilities', () => {
    expect(KNOWN_CAPABILITIES).toContain('FetchSubject')
    expect(KNOWN_CAPABILITIES).toContain('Preview')
    expect(KNOWN_CAPABILITIES).toHaveLength(8)
  })

  it('exports all 13 semantic attribute keys', () => {
    expect(KNOWN_SEMANTIC_ATTRIBUTES).toHaveLength(13)
    expect(KNOWN_SEMANTIC_ATTRIBUTES).toContain('conversionProbability')
    expect(KNOWN_SEMANTIC_ATTRIBUTES).toContain('recentFeatureAdoption')
  })

  it('exports a non-empty unsafe field names list', () => {
    expect(UNSAFE_FIELD_NAMES.length).toBeGreaterThan(0)
    expect(UNSAFE_FIELD_NAMES).toContain('password')
    expect(UNSAFE_FIELD_NAMES).toContain('apiKey')
  })
})
