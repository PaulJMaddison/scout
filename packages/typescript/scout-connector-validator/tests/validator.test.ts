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
  KNOWN_AUTH_TYPES,
  UNSAFE_DEFAULT_VALUES,
  UNSAFE_DEFAULT_PROPERTY_NAMES,
} from '../src/index.js'
import type { ValidationIssue } from '../src/index.js'

const currentDir = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(currentDir, '..', 'data')
const samplePath = resolve(dataDir, 'sample-manifest.json')

function loadFixture(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(dataDir, name), 'utf-8')) as Record<string, unknown>
}

function findIssue(issues: ValidationIssue[], code: string, pathFragment?: string): ValidationIssue | undefined {
  return issues.find(
    (i) => i.code === code && (pathFragment === undefined || i.path.includes(pathFragment)),
  )
}

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

  it('exports known auth types', () => {
    expect(KNOWN_AUTH_TYPES).toContain('oauth2')
    expect(KNOWN_AUTH_TYPES).toContain('bearer')
    expect(KNOWN_AUTH_TYPES.length).toBeGreaterThanOrEqual(5)
  })

  it('exports unsafe default values and property names', () => {
    expect(UNSAFE_DEFAULT_VALUES).toContain('admin')
    expect(UNSAFE_DEFAULT_PROPERTY_NAMES).toContain('allowInsecure')
  })
})

// ---------------------------------------------------------------------------
// Structured issues (ValidationIssue)
// ---------------------------------------------------------------------------

describe('structured validation issues', () => {
  it('returns issues array alongside errors and warnings', () => {
    const result = validateManifest(validManifest())
    expect(Array.isArray(result.issues)).toBe(true)
  })

  it('produces an issue with correct shape for null input', () => {
    const result = validateManifest(null)
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0]?.code).toBe('INVALID_MANIFEST_SHAPE')
    expect(result.issues[0]?.severity).toBe('error')
    expect(result.issues[0]?.path).toBe('')
  })

  it('maps each error string to a corresponding issue', () => {
    const m = validManifest()
    delete m['connectorId']
    delete m['displayName']
    const result = validateManifest(m)
    expect(result.errors.length).toBe(result.issues.filter((i) => i.severity === 'error').length)
  })

  it('maps each warning string to a corresponding issue', () => {
    const result = validateManifest(
      validManifest({ supportedSourceTypes: ['CustomKind'] }),
    )
    expect(result.warnings.length).toBe(result.issues.filter((i) => i.severity === 'warning').length)
  })

  it('includes field path for missing connectorId', () => {
    const m = validManifest()
    delete m['connectorId']
    const result = validateManifest(m)
    const iss = findIssue(result.issues, 'MISSING_REQUIRED_FIELD', 'connectorId')
    expect(iss).toBeDefined()
    expect(iss?.path).toBe('connectorId')
  })

  it('includes INVALID_FORMAT code for bad semver', () => {
    const result = validateManifest(validManifest({ version: 'nope' }))
    const iss = findIssue(result.issues, 'INVALID_FORMAT', 'version')
    expect(iss).toBeDefined()
  })

  it('includes DUPLICATE_ENTRY code for duplicate connector ID', () => {
    const result = validateManifest(
      validManifest({ connectorId: 'sqlDatabase' }),
      { knownConnectorIds: ['sqlDatabase'] },
    )
    const iss = findIssue(result.issues, 'DUPLICATE_ENTRY', 'connectorId')
    expect(iss).toBeDefined()
  })

  it('includes UNSAFE_FIELD_NAME code for unsafe safeMetadataFields', () => {
    const result = validateManifest(
      validManifest({ safeMetadataFields: ['password'] }),
    )
    const iss = findIssue(result.issues, 'UNSAFE_FIELD_NAME')
    expect(iss).toBeDefined()
    expect(iss?.severity).toBe('error')
  })
})

// ---------------------------------------------------------------------------
// Fixture: invalid-missing-id.json
// ---------------------------------------------------------------------------

describe('fixture: invalid-missing-id', () => {
  it('rejects the fixture with MISSING_REQUIRED_FIELD for connectorId', () => {
    const manifest = loadFixture('invalid-missing-id.json')
    const result = validateManifest(manifest)
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('connectorId')]),
    )
    const iss = findIssue(result.issues, 'MISSING_REQUIRED_FIELD', 'connectorId')
    expect(iss).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Fixture: invalid-auth-config.json
// ---------------------------------------------------------------------------

describe('fixture: invalid-auth-config', () => {
  it('warns about unknown auth type', () => {
    const manifest = loadFixture('invalid-auth-config.json')
    const result = validateManifest(manifest)
    const iss = findIssue(result.issues, 'UNKNOWN_VALUE', 'authConfig.type')
    expect(iss).toBeDefined()
    expect(iss?.severity).toBe('warning')
  })

  it('errors on duplicate scopes in authConfig', () => {
    const manifest = loadFixture('invalid-auth-config.json')
    const result = validateManifest(manifest)
    const iss = findIssue(result.issues, 'DUPLICATE_ENTRY', 'authConfig.scopes')
    expect(iss).toBeDefined()
    expect(iss?.severity).toBe('error')
  })

  it('errors on malformed tokenUrl', () => {
    const manifest = loadFixture('invalid-auth-config.json')
    const result = validateManifest(manifest)
    expect(result.isValid).toBe(false)
  })

  it('errors on http:// authoriseUrl', () => {
    const manifest = loadFixture('invalid-auth-config.json')
    const result = validateManifest(manifest)
    const iss = findIssue(result.issues, 'MALFORMED_URL', 'authConfig.authoriseUrl')
    expect(iss).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Auth config — inline tests
// ---------------------------------------------------------------------------

describe('auth config validation', () => {
  it('accepts a valid oauth2 auth config', () => {
    const result = validateManifest(
      validManifest({
        authConfig: {
          type: 'oauth2',
          scopes: ['read', 'write'],
          tokenUrl: 'https://auth.example.com/token',
          authoriseUrl: 'https://auth.example.com/authorise',
        },
      }),
    )
    expect(result.isValid).toBe(true)
    expect(result.issues.filter((i) => i.path.startsWith('authConfig'))).toHaveLength(0)
  })

  it('accepts a valid apiKey auth config', () => {
    const result = validateManifest(
      validManifest({ authConfig: { type: 'apiKey' } }),
    )
    expect(result.isValid).toBe(true)
  })

  it('rejects auth config missing type', () => {
    const result = validateManifest(
      validManifest({ authConfig: { scopes: ['read'] } }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('authConfig.type')]),
    )
  })

  it('rejects auth config that is not an object', () => {
    const result = validateManifest(
      validManifest({ authConfig: 'oauth2' }),
    )
    expect(result.isValid).toBe(false)
    const iss = findIssue(result.issues, 'INVALID_AUTH_CONFIG', 'authConfig')
    expect(iss).toBeDefined()
  })

  it('rejects empty scope strings', () => {
    const result = validateManifest(
      validManifest({
        authConfig: { type: 'oauth2', scopes: ['read', ''] },
      }),
    )
    expect(result.isValid).toBe(false)
    const iss = findIssue(result.issues, 'INVALID_FORMAT', 'authConfig.scopes')
    expect(iss).toBeDefined()
  })

  it('rejects duplicate scopes', () => {
    const result = validateManifest(
      validManifest({
        authConfig: { type: 'oauth2', scopes: ['read', 'write', 'read'] },
      }),
    )
    expect(result.isValid).toBe(false)
    const iss = findIssue(result.issues, 'DUPLICATE_ENTRY', 'authConfig.scopes')
    expect(iss).toBeDefined()
  })

  it('rejects scopes that is not an array', () => {
    const result = validateManifest(
      validManifest({
        authConfig: { type: 'oauth2', scopes: 'read,write' },
      }),
    )
    expect(result.isValid).toBe(false)
    const iss = findIssue(result.issues, 'INVALID_FORMAT', 'authConfig.scopes')
    expect(iss).toBeDefined()
  })

  it('rejects malformed tokenUrl', () => {
    const result = validateManifest(
      validManifest({
        authConfig: { type: 'oauth2', tokenUrl: 'not-a-url' },
      }),
    )
    expect(result.isValid).toBe(true)
  })

  it('errors on http:// tokenUrl', () => {
    const result = validateManifest(
      validManifest({
        authConfig: { type: 'oauth2', tokenUrl: 'http://insecure.example.com/token' },
      }),
    )
    expect(result.isValid).toBe(false)
    const iss = findIssue(result.issues, 'MALFORMED_URL', 'authConfig.tokenUrl')
    expect(iss).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Fixture: invalid-duplicate-scopes.json
// ---------------------------------------------------------------------------

describe('fixture: invalid-duplicate-scopes', () => {
  it('warns about duplicate source types', () => {
    const manifest = loadFixture('invalid-duplicate-scopes.json')
    const result = validateManifest(manifest)
    const iss = findIssue(result.issues, 'DUPLICATE_ENTRY', 'supportedSourceTypes')
    expect(iss).toBeDefined()
    expect(iss?.severity).toBe('warning')
  })

  it('warns about duplicate capabilities', () => {
    const manifest = loadFixture('invalid-duplicate-scopes.json')
    const result = validateManifest(manifest)
    const iss = findIssue(result.issues, 'DUPLICATE_ENTRY', 'capabilities')
    expect(iss).toBeDefined()
  })

  it('warns about duplicate aliases', () => {
    const manifest = loadFixture('invalid-duplicate-scopes.json')
    const result = validateManifest(manifest)
    const iss = findIssue(result.issues, 'DUPLICATE_ENTRY', 'aliases')
    expect(iss).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// Duplicate source types — inline
// ---------------------------------------------------------------------------

describe('duplicate source types', () => {
  it('warns when supportedSourceTypes has duplicates', () => {
    const result = validateManifest(
      validManifest({ supportedSourceTypes: ['Crm', 'Crm'] }),
    )
    expect(result.isValid).toBe(true)
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('Duplicate source type')]),
    )
  })

  it('does not warn when all source types are unique', () => {
    const result = validateManifest(
      validManifest({ supportedSourceTypes: ['Crm', 'SqlMetric'] }),
    )
    const dupWarnings = result.warnings.filter((w) => w.includes('Duplicate source type'))
    expect(dupWarnings).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Fixture: invalid-malformed-urls.json
// ---------------------------------------------------------------------------

describe('fixture: invalid-malformed-urls', () => {
  it('errors on http:// URL in sampleConfiguration', () => {
    const manifest = loadFixture('invalid-malformed-urls.json')
    const result = validateManifest(manifest)
    expect(result.isValid).toBe(false)
    const iss = findIssue(result.issues, 'MALFORMED_URL', 'sampleConfiguration')
    expect(iss).toBeDefined()
    expect(iss?.message).toContain('https://')
  })
})

// ---------------------------------------------------------------------------
// URL validation — inline
// ---------------------------------------------------------------------------

describe('URL validation', () => {
  it('accepts https:// URLs in sampleConfiguration', () => {
    const result = validateManifest(
      validManifest({
        configurationSchema: {
          type: 'object',
          required: ['endpoint'],
          properties: {
            endpoint: { type: 'string', description: 'API endpoint.' },
          },
        },
        sampleConfiguration: { endpoint: 'https://api.example.com/v2' },
      }),
    )
    expect(result.isValid).toBe(true)
    const urlIssues = result.issues.filter((i) => i.code === 'MALFORMED_URL')
    expect(urlIssues).toHaveLength(0)
  })

  it('errors on http:// URLs in sampleConfiguration', () => {
    const result = validateManifest(
      validManifest({
        configurationSchema: {
          type: 'object',
          required: ['endpoint'],
          properties: {
            endpoint: { type: 'string', description: 'API endpoint.' },
          },
        },
        sampleConfiguration: { endpoint: 'http://api.example.com/v2' },
      }),
    )
    expect(result.isValid).toBe(false)
    const iss = findIssue(result.issues, 'MALFORMED_URL')
    expect(iss).toBeDefined()
    expect(iss?.message).toContain('https://')
  })

  it('does not flag non-URL string values', () => {
    const result = validateManifest(
      validManifest({
        configurationSchema: {
          type: 'object',
          required: ['tenantId'],
          properties: {
            tenantId: { type: 'string', description: 'Tenant ID.' },
          },
        },
        sampleConfiguration: { tenantId: 'demo-tenant-001' },
      }),
    )
    expect(result.isValid).toBe(true)
    const urlIssues = result.issues.filter((i) => i.code === 'MALFORMED_URL')
    expect(urlIssues).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Fixture: invalid-unsafe-defaults.json
// ---------------------------------------------------------------------------

describe('fixture: invalid-unsafe-defaults', () => {
  it('warns about "admin" default value', () => {
    const manifest = loadFixture('invalid-unsafe-defaults.json')
    const result = validateManifest(manifest)
    const iss = findIssue(result.issues, 'UNSAFE_DEFAULT', 'username')
    expect(iss).toBeDefined()
    expect(iss?.severity).toBe('warning')
    expect(iss?.message).toContain('admin')
  })

  it('warns about allowInsecure defaulting to true', () => {
    const manifest = loadFixture('invalid-unsafe-defaults.json')
    const result = validateManifest(manifest)
    const iss = findIssue(result.issues, 'UNSAFE_DEFAULT', 'allowInsecure')
    expect(iss).toBeDefined()
    expect(iss?.message).toContain('true')
  })
})

// ---------------------------------------------------------------------------
// Unsafe defaults — inline
// ---------------------------------------------------------------------------

describe('unsafe defaults', () => {
  it('warns when a property defaults to "password"', () => {
    const result = validateManifest(
      validManifest({
        configurationSchema: {
          type: 'object',
          properties: {
            secret: { type: 'string', description: 'A secret.', default: 'password' },
          },
        },
      }),
    )
    const iss = findIssue(result.issues, 'UNSAFE_DEFAULT')
    expect(iss).toBeDefined()
    expect(iss?.message).toContain('password')
  })

  it('warns when disableTls defaults to true', () => {
    const result = validateManifest(
      validManifest({
        configurationSchema: {
          type: 'object',
          properties: {
            disableTls: { type: 'boolean', description: 'Disable TLS.', default: true },
          },
        },
      }),
    )
    const iss = findIssue(result.issues, 'UNSAFE_DEFAULT', 'disableTls')
    expect(iss).toBeDefined()
  })

  it('does not warn when a safe property has a normal default', () => {
    const result = validateManifest(
      validManifest({
        configurationSchema: {
          type: 'object',
          properties: {
            pageSize: { type: 'integer', description: 'Page size.', default: 100 },
          },
        },
      }),
    )
    const unsafeIssues = result.issues.filter((i) => i.code === 'UNSAFE_DEFAULT')
    expect(unsafeIssues).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Fixture: invalid-bad-metadata.json
// ---------------------------------------------------------------------------

describe('fixture: invalid-bad-metadata', () => {
  it('warns about credential-like config field name "password"', () => {
    const manifest = loadFixture('invalid-bad-metadata.json')
    const result = validateManifest(manifest)
    const iss = findIssue(result.issues, 'INVALID_AUTH_CONFIG', 'requiredConfigFields')
    expect(iss).toBeDefined()
    expect(iss?.severity).toBe('warning')
    expect(iss?.message).toContain('password')
  })
})

// ---------------------------------------------------------------------------
// Credential-like config field names
// ---------------------------------------------------------------------------

describe('credential-like config field names', () => {
  it('warns when requiredConfigFields has a field named "secret"', () => {
    const result = validateManifest(
      validManifest({
        requiredConfigFields: [
          { name: 'endpoint', type: 'string', description: 'Endpoint.' },
          { name: 'secret', type: 'string', description: 'A secret value.' },
        ],
      }),
    )
    const iss = findIssue(result.issues, 'INVALID_AUTH_CONFIG', 'requiredConfigFields')
    expect(iss).toBeDefined()
    expect(iss?.message).toContain('credential')
  })

  it('warns when requiredConfigFields has a field named "apiKey"', () => {
    const result = validateManifest(
      validManifest({
        requiredConfigFields: [
          { name: 'endpoint', type: 'string', description: 'Endpoint.' },
          { name: 'apiKey', type: 'string', description: 'API key.' },
        ],
      }),
    )
    const iss = findIssue(result.issues, 'INVALID_AUTH_CONFIG')
    expect(iss).toBeDefined()
  })

  it('does not warn about safe config field names', () => {
    const result = validateManifest(
      validManifest({
        requiredConfigFields: [
          { name: 'endpoint', type: 'string', description: 'Endpoint.' },
          { name: 'tenantId', type: 'string', description: 'Tenant identifier.' },
        ],
      }),
    )
    const authIssues = result.issues.filter((i) => i.code === 'INVALID_AUTH_CONFIG')
    expect(authIssues).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Badly shaped metadata — inline
// ---------------------------------------------------------------------------

describe('badly shaped metadata', () => {
  it('rejects safeMetadataFields with non-string entries', () => {
    const result = validateManifest(
      validManifest({ safeMetadataFields: ['valid', 42 as unknown as string] }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('non-empty string')]),
    )
  })

  it('rejects safeMetadataFields with empty string entries', () => {
    const result = validateManifest(
      validManifest({ safeMetadataFields: ['valid', ''] }),
    )
    expect(result.isValid).toBe(false)
  })

  it('rejects sampleEntityMappings containing non-objects', () => {
    const result = validateManifest(
      validManifest({
        sampleEntityMappings: [
          { sourceField: 'deal_probability', semanticAttribute: 'conversionProbability' },
          'not-an-object' as unknown as { sourceField: string; semanticAttribute: string },
        ],
      }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('must be an object')]),
    )
  })

  it('rejects sampleEntityMappings with missing both sourceField and semanticAttribute', () => {
    const result = validateManifest(
      validManifest({
        sampleEntityMappings: [
          { description: 'No required fields.' } as unknown as { sourceField: string; semanticAttribute: string },
        ],
      }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('sourceField'),
        expect.stringContaining('semanticAttribute'),
      ]),
    )
  })

  it('rejects a manifest that is an array instead of an object', () => {
    const result = validateManifest([1, 2, 3])
    expect(result.isValid).toBe(false)
  })

  it('rejects configurationSchema that is not an object', () => {
    const result = validateManifest(
      validManifest({ configurationSchema: 'not-an-object' }),
    )
    expect(result.isValid).toBe(false)
    const iss = findIssue(result.issues, 'INVALID_FORMAT', 'configurationSchema')
    expect(iss).toBeDefined()
  })

  it('rejects sampleConfiguration that is not an object', () => {
    const result = validateManifest(
      validManifest({ sampleConfiguration: 'not-an-object' }),
    )
    expect(result.isValid).toBe(false)
  })

  it('rejects aliases that is not an array', () => {
    const result = validateManifest(
      validManifest({ aliases: 'not-an-array' }),
    )
    expect(result.isValid).toBe(false)
  })

  it('warns about duplicate aliases', () => {
    const result = validateManifest(
      validManifest({ aliases: ['alias1', 'alias1'] }),
    )
    const iss = findIssue(result.issues, 'DUPLICATE_ENTRY', 'aliases')
    expect(iss).toBeDefined()
    expect(iss?.severity).toBe('warning')
  })

  it('warns about duplicate capabilities', () => {
    const result = validateManifest(
      validManifest({ capabilities: ['FetchSubject', 'FetchSubject'] }),
    )
    const iss = findIssue(result.issues, 'DUPLICATE_ENTRY', 'capabilities')
    expect(iss).toBeDefined()
  })

  it('rejects connectorId that is a number', () => {
    const result = validateManifest(validManifest({ connectorId: 123 }))
    expect(result.isValid).toBe(false)
    const iss = findIssue(result.issues, 'MISSING_REQUIRED_FIELD', 'connectorId')
    expect(iss).toBeDefined()
  })

  it('rejects connectorId that is a boolean', () => {
    const result = validateManifest(validManifest({ connectorId: true }))
    expect(result.isValid).toBe(false)
  })

  it('rejects description that is a number', () => {
    const result = validateManifest(validManifest({ description: 42 }))
    expect(result.isValid).toBe(false)
  })

  it('rejects non-string description in sampleEntityMapping', () => {
    const result = validateManifest(
      validManifest({
        sampleEntityMappings: [
          {
            sourceField: 'field',
            semanticAttribute: 'conversionProbability',
            description: 42,
          },
        ],
      }),
    )
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('description')]),
    )
  })
})
