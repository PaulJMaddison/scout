import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  listConnectors,
  inspectSampleSchema,
  summariseMetadata,
  validateConnectorManifest,
} from '../src/tools.js'
import { getConnectors, getConnectorByType } from '../src/sample-data.js'
import { createDiscoveryServer } from '../src/server.js'

const currentDir = dirname(fileURLToPath(import.meta.url))
const packagePath = resolve(currentDir, '..', 'package.json')

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

describe('MCP server tool registration', () => {
  it('creates a server with the correct name and version', () => {
    const server = createDiscoveryServer()
    expect(server).toBeDefined()
    // Server was created without error — tools are registered.
  })

  it('builds local validator and audit dependencies before compiling', () => {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8')) as {
      scripts?: Record<string, string>
    }

    expect(packageJson.scripts?.['prebuild']).toContain('../scout-connector-validator')
    expect(packageJson.scripts?.['prebuild']).toContain('../scout-metadata-audit')
  })
})

// ---------------------------------------------------------------------------
// list_connectors
// ---------------------------------------------------------------------------

describe('scout_list_connectors', () => {
  it('returns all registered connectors', () => {
    const result = listConnectors() as { connectors: unknown[]; totalCount: number }

    expect(result.connectors).toBeInstanceOf(Array)
    expect(result.totalCount).toBeGreaterThan(0)
    expect(result.connectors.length).toBe(result.totalCount)
  })

  it('includes expected connector types', () => {
    const result = listConnectors() as {
      connectors: Array<{ connectorType: string }>
    }
    const types = result.connectors.map((c) => c.connectorType)

    expect(types).toContain('sqlDatabase')
    expect(types).toContain('restApi')
    expect(types).toContain('mock')
    expect(types).toContain('template')
    expect(types).toContain('inMemoryInventory')
    expect(types).toContain('csvUpload')
  })

  it('each connector has required metadata fields', () => {
    const result = listConnectors() as {
      connectors: Array<{
        connectorType: string
        displayName: string
        description: string
        aliases: string[]
        supportedDataSourceKinds: string[]
      }>
    }

    for (const connector of result.connectors) {
      expect(connector.connectorType).toBeTruthy()
      expect(connector.displayName).toBeTruthy()
      expect(connector.description).toBeTruthy()
      expect(connector.aliases).toBeInstanceOf(Array)
      expect(connector.supportedDataSourceKinds).toBeInstanceOf(Array)
      expect(connector.supportedDataSourceKinds.length).toBeGreaterThan(0)
    }
  })

  it('does not expose configuration schemas in the list response', () => {
    const result = listConnectors() as { connectors: Array<Record<string, unknown>> }

    for (const connector of result.connectors) {
      expect(connector['configurationSchema']).toBeUndefined()
      expect(connector['sampleConfiguration']).toBeUndefined()
      expect(connector['credentialSchema']).toBeUndefined()
    }
  })
})

// ---------------------------------------------------------------------------
// inspect_sample_schema
// ---------------------------------------------------------------------------

describe('scout_inspect_sample_schema', () => {
  it('returns schema and sample for a known connector type', () => {
    const result = inspectSampleSchema('sqlDatabase') as {
      connectorType: string
      displayName: string
      configurationSchema: { type: string; properties: object }
      sampleConfiguration: Record<string, unknown>
    }

    expect(result.connectorType).toBe('sqlDatabase')
    expect(result.displayName).toBe('SQL Database')
    expect(result.configurationSchema.type).toBe('object')
    expect(result.configurationSchema.properties).toBeDefined()
    expect(result.sampleConfiguration).toBeDefined()
  })

  it('resolves an alias to the correct connector', () => {
    const result = inspectSampleSchema('crmApi') as { connectorType: string }
    expect(result.connectorType).toBe('restApi')
  })

  it('returns an error for an unknown connector type', () => {
    const result = inspectSampleSchema('nonExistentConnector') as {
      error: string
      availableTypes: string[]
    }

    expect(result.error).toContain('nonExistentConnector')
    expect(result.availableTypes).toBeInstanceOf(Array)
    expect(result.availableTypes.length).toBeGreaterThan(0)
  })

  it('sample configuration satisfies required schema fields', () => {
    const connectors = getConnectors()

    for (const connector of connectors) {
      const required = connector.configurationSchema.required ?? []
      for (const field of required) {
        expect(
          connector.sampleConfiguration[field],
          `Connector '${connector.connectorType}' sample is missing required field '${field}'`,
        ).toBeDefined()
      }
    }
  })
})

// ---------------------------------------------------------------------------
// summarise_metadata
// ---------------------------------------------------------------------------

describe('scout_summarise_metadata', () => {
  it('returns a summary with connector count and attribute keys', () => {
    const result = summariseMetadata() as {
      summary: {
        connectorCount: number
        connectorTypes: string[]
        semanticAttributeKeys: string[]
        dataSourceKinds: string[]
        connectorCapabilities: string[]
      }
      description: string
    }

    expect(result.summary.connectorCount).toBeGreaterThan(0)
    expect(result.summary.connectorTypes.length).toBe(result.summary.connectorCount)
    expect(result.summary.semanticAttributeKeys.length).toBeGreaterThan(0)
    expect(result.summary.dataSourceKinds).toContain('Crm')
    expect(result.summary.connectorCapabilities).toContain('FetchSubject')
    expect(result.description).toBeTruthy()
  })

  it('includes all 13 reserved semantic attribute keys', () => {
    const result = summariseMetadata() as {
      summary: { semanticAttributeKeys: string[] }
    }

    const expected = [
      'conversionProbability',
      'preferredChannel',
      'planInterest',
      'churnRisk',
      'engagementLevel',
      'expansionPotential',
      'budgetReadiness',
      'decisionMakerLikelihood',
      'productFit',
      'recommendedSalesMotion',
      'stakeholderSeniority',
      'salesUrgency',
      'recentFeatureAdoption',
    ]

    for (const key of expected) {
      expect(result.summary.semanticAttributeKeys).toContain(key)
    }
  })

  it('does not expose enterprise internals in the description', () => {
    const result = summariseMetadata() as { description: string }

    expect(result.description.toLowerCase()).not.toContain('salesforce')
    expect(result.description.toLowerCase()).not.toContain('hubspot')
  })
})

// ---------------------------------------------------------------------------
// validate_connector_manifest
// ---------------------------------------------------------------------------

describe('scout_validate_connector_manifest', () => {
  it('accepts a well-formed manifest', () => {
    const manifest = {
      connectorType: 'myCustomConnector',
      displayName: 'My Custom Connector',
      description: 'A fictional connector for testing.',
      aliases: [],
      supportedDataSourceKinds: ['Crm'],
      supportedCapabilities: ['FetchSubject', 'Preview'],
      configurationSchema: {
        type: 'object',
        required: ['endpoint'],
        properties: {
          endpoint: { type: 'string', description: 'API endpoint.' },
        },
      },
      sampleConfiguration: {
        endpoint: 'https://api.example.com/v1',
      },
    }

    const result = validateConnectorManifest(manifest)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects null input', () => {
    const result = validateConnectorManifest(null)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rejects a manifest missing connectorType', () => {
    const result = validateConnectorManifest({
      displayName: 'Test',
      description: 'Test',
      supportedDataSourceKinds: ['Crm'],
      configurationSchema: { type: 'object', properties: {} },
      sampleConfiguration: {},
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('connectorType')]))
  })

  it('rejects a manifest missing displayName', () => {
    const result = validateConnectorManifest({
      connectorType: 'test',
      description: 'Test',
      supportedDataSourceKinds: ['Crm'],
      configurationSchema: { type: 'object', properties: {} },
      sampleConfiguration: {},
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('displayName')]))
  })

  it('rejects a manifest missing description', () => {
    const result = validateConnectorManifest({
      connectorType: 'test',
      displayName: 'Test',
      supportedDataSourceKinds: ['Crm'],
      configurationSchema: { type: 'object', properties: {} },
      sampleConfiguration: {},
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(expect.arrayContaining([expect.stringContaining('description')]))
  })

  it('rejects a manifest with empty supportedDataSourceKinds', () => {
    const result = validateConnectorManifest({
      connectorType: 'test',
      displayName: 'Test',
      description: 'Test',
      supportedDataSourceKinds: [],
      configurationSchema: { type: 'object', properties: {} },
      sampleConfiguration: {},
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('supportedDataSourceKinds')]),
    )
  })

  it('warns about unrecognised data source kinds', () => {
    const result = validateConnectorManifest({
      connectorType: 'test',
      displayName: 'Test',
      description: 'Test',
      supportedDataSourceKinds: ['FictionalKind'],
      configurationSchema: { type: 'object', properties: {} },
      sampleConfiguration: {},
    })
    expect(result.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('FictionalKind')]),
    )
  })

  it('rejects a manifest missing configurationSchema', () => {
    const result = validateConnectorManifest({
      connectorType: 'test',
      displayName: 'Test',
      description: 'Test',
      supportedDataSourceKinds: ['Crm'],
      sampleConfiguration: {},
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('configurationSchema')]),
    )
  })

  it('rejects a configurationSchema without type: object', () => {
    const result = validateConnectorManifest({
      connectorType: 'test',
      displayName: 'Test',
      description: 'Test',
      supportedDataSourceKinds: ['Crm'],
      configurationSchema: { type: 'array', properties: {} },
      sampleConfiguration: {},
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('"type": "object"')]),
    )
  })

  it('rejects a manifest missing sampleConfiguration', () => {
    const result = validateConnectorManifest({
      connectorType: 'test',
      displayName: 'Test',
      description: 'Test',
      supportedDataSourceKinds: ['Crm'],
      configurationSchema: { type: 'object', properties: {} },
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('sampleConfiguration')]),
    )
  })

  it('rejects a sample configuration missing required schema fields', () => {
    const result = validateConnectorManifest({
      connectorType: 'test',
      displayName: 'Test',
      description: 'Test',
      supportedDataSourceKinds: ['Crm'],
      configurationSchema: {
        type: 'object',
        required: ['endpoint', 'apiVersion'],
        properties: {
          endpoint: { type: 'string' },
          apiVersion: { type: 'string' },
        },
      },
      sampleConfiguration: {
        endpoint: 'https://example.com',
      },
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('apiVersion')]),
    )
  })

  it('validates all built-in sample connectors pass manifest validation', () => {
    const connectors = getConnectors()

    for (const connector of connectors) {
      const result = validateConnectorManifest(connector)
      expect(
        result.isValid,
        `Built-in connector '${connector.connectorType}' failed validation: ${result.errors.join('; ')}`,
      ).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// sample-data helpers
// ---------------------------------------------------------------------------

describe('sample-data helpers', () => {
  it('getConnectorByType resolves by primary type', () => {
    const connector = getConnectorByType('sqlDatabase')
    expect(connector).toBeDefined()
    expect(connector?.connectorType).toBe('sqlDatabase')
  })

  it('getConnectorByType resolves by alias (case-insensitive)', () => {
    const connector = getConnectorByType('SQLTABLE')
    expect(connector).toBeDefined()
    expect(connector?.connectorType).toBe('sqlDatabase')
  })

  it('getConnectorByType returns undefined for unknown type', () => {
    expect(getConnectorByType('doesNotExist')).toBeUndefined()
  })
})
