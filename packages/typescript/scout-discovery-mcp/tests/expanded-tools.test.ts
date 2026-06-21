import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  readConnectorManifest,
  validateManifestSchemaCompatibility,
  summariseConnectors,
  produceMetadataQualityReport,
} from '../src/tools.js'
import { getConnectors } from '../src/sample-data.js'

const currentDir = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(currentDir, '..', 'data')

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(resolve(dataDir, name), 'utf-8'))
}

// ---------------------------------------------------------------------------
// scout_read_connector_manifest
// ---------------------------------------------------------------------------

describe('scout_read_connector_manifest', () => {
  it('returns the full manifest for a known connector type', () => {
    const result = readConnectorManifest('sqlDatabase') as {
      connectorType: string
      displayName: string
      configurationSchema: { type: string; properties: object }
      sampleConfiguration: Record<string, unknown>
      supportedCapabilities: string[]
      aliases: string[]
    }

    expect(result.connectorType).toBe('sqlDatabase')
    expect(result.displayName).toBe('SQL Database')
    expect(result.configurationSchema).toBeDefined()
    expect(result.configurationSchema.type).toBe('object')
    expect(result.sampleConfiguration).toBeDefined()
    expect(result.supportedCapabilities).toBeInstanceOf(Array)
    expect(result.supportedCapabilities.length).toBeGreaterThan(0)
    expect(result.aliases).toBeInstanceOf(Array)
  })

  it('resolves an alias to the correct full manifest', () => {
    const result = readConnectorManifest('crmApi') as {
      connectorType: string
      displayName: string
      description: string
    }

    expect(result.connectorType).toBe('restApi')
    expect(result.displayName).toBe('REST API')
    expect(result.description).toBeTruthy()
  })

  it('includes all manifest fields unlike inspectSampleSchema', () => {
    const result = readConnectorManifest('mock') as Record<string, unknown>

    expect(result['connectorType']).toBeDefined()
    expect(result['displayName']).toBeDefined()
    expect(result['description']).toBeDefined()
    expect(result['aliases']).toBeDefined()
    expect(result['supportedDataSourceKinds']).toBeDefined()
    expect(result['supportedCapabilities']).toBeDefined()
    expect(result['configurationSchema']).toBeDefined()
    expect(result['sampleConfiguration']).toBeDefined()
  })

  it('returns a structured error for an unknown connector type', () => {
    const result = readConnectorManifest('nonExistent') as {
      error: string
      hint: string
      availableTypes: string[]
    }

    expect(result.error).toContain('nonExistent')
    expect(result.hint).toBeTruthy()
    expect(result.availableTypes).toBeInstanceOf(Array)
    expect(result.availableTypes.length).toBeGreaterThan(0)
  })

  it('is case-insensitive for connector type lookup', () => {
    const result = readConnectorManifest('SQLDATABASE') as { connectorType: string }
    expect(result.connectorType).toBe('sqlDatabase')
  })

  it('returns all known connectors when queried individually', () => {
    const allConnectors = getConnectors()
    for (const connector of allConnectors) {
      const result = readConnectorManifest(connector.connectorType) as { connectorType: string }
      expect(result.connectorType).toBe(connector.connectorType)
    }
  })
})

// ---------------------------------------------------------------------------
// scout_validate_manifest_schema_compatibility
// ---------------------------------------------------------------------------

describe('scout_validate_manifest_schema_compatibility', () => {
  it('reports compatible when manifest schema matches target schema', () => {
    const manifest = loadFixture('fixture-manifest-valid.json')
    const schema = loadFixture('fixture-schema-compatible.json')
    const result = validateManifestSchemaCompatibility(manifest, schema) as {
      isCompatible: boolean
      issues: string[]
      compatible: string[]
      manifestFieldCount: number
      schemaFieldCount: number
    }

    expect(result.isCompatible).toBe(true)
    expect(result.issues).toHaveLength(0)
    expect(result.compatible).toContain('endpoint')
    expect(result.compatible).toContain('tenantId')
    expect(result.compatible).toContain('pageSize')
    expect(result.manifestFieldCount).toBeGreaterThan(0)
    expect(result.schemaFieldCount).toBeGreaterThan(0)
  })

  it('reports incompatible when types mismatch', () => {
    const manifest = loadFixture('fixture-manifest-valid.json')
    const schema = loadFixture('fixture-schema-incompatible.json')
    const result = validateManifestSchemaCompatibility(manifest, schema) as {
      isCompatible: boolean
      issues: string[]
    }

    expect(result.isCompatible).toBe(false)
    expect(result.issues).toEqual(
      expect.arrayContaining([expect.stringContaining('endpoint')]),
    )
  })

  it('reports missing fields from manifest', () => {
    const manifest = loadFixture('fixture-manifest-valid.json')
    const schema = loadFixture('fixture-schema-incompatible.json')
    const result = validateManifestSchemaCompatibility(manifest, schema) as {
      isCompatible: boolean
      issues: string[]
    }

    expect(result.issues).toEqual(
      expect.arrayContaining([expect.stringContaining('secretKey')]),
    )
  })

  it('checks required fields in sample configuration', () => {
    const manifest = loadFixture('fixture-manifest-valid.json')
    const schema = loadFixture('fixture-schema-incompatible.json')
    const result = validateManifestSchemaCompatibility(manifest, schema) as {
      issues: string[]
    }

    expect(result.issues).toEqual(
      expect.arrayContaining([expect.stringContaining('secretKey')]),
    )
  })

  it('rejects null manifest', () => {
    const schema = loadFixture('fixture-schema-compatible.json')
    const result = validateManifestSchemaCompatibility(null, schema) as {
      isCompatible: boolean
      issues: string[]
    }

    expect(result.isCompatible).toBe(false)
    expect(result.issues).toEqual(
      expect.arrayContaining([expect.stringContaining('manifest')]),
    )
  })

  it('rejects null schema', () => {
    const manifest = loadFixture('fixture-manifest-valid.json')
    const result = validateManifestSchemaCompatibility(manifest, null) as {
      isCompatible: boolean
      issues: string[]
    }

    expect(result.isCompatible).toBe(false)
    expect(result.issues).toEqual(
      expect.arrayContaining([expect.stringContaining('schema')]),
    )
  })

  it('handles manifest without configurationSchema', () => {
    const manifest = { connectorType: 'test', displayName: 'Test' }
    const schema = loadFixture('fixture-schema-compatible.json')
    const result = validateManifestSchemaCompatibility(manifest, schema) as {
      isCompatible: boolean
      issues: string[]
    }

    expect(result.isCompatible).toBe(false)
    expect(result.issues).toEqual(
      expect.arrayContaining([expect.stringContaining('configurationSchema')]),
    )
  })

  it('validates all built-in connectors against their own schema', () => {
    const connectors = getConnectors()
    for (const connector of connectors) {
      const result = validateManifestSchemaCompatibility(
        connector,
        connector.configurationSchema,
      ) as { isCompatible: boolean; issues: string[] }

      expect(
        result.isCompatible,
        `Built-in connector '${connector.connectorType}' is not self-compatible: ${result.issues.join('; ')}`,
      ).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// scout_summarise_connectors
// ---------------------------------------------------------------------------

describe('scout_summarise_connectors', () => {
  it('returns total connector count matching the catalogue', () => {
    const result = summariseConnectors() as { totalConnectors: number }
    expect(result.totalConnectors).toBe(getConnectors().length)
  })

  it('includes per-connector details', () => {
    const result = summariseConnectors() as {
      connectors: Array<{
        connectorType: string
        displayName: string
        description: string
        aliasCount: number
        capabilityCount: number
        dataSourceKindCount: number
        schemaFieldCount: number
        requiredFieldCount: number
      }>
    }

    expect(result.connectors.length).toBe(getConnectors().length)
    for (const detail of result.connectors) {
      expect(detail.connectorType).toBeTruthy()
      expect(detail.displayName).toBeTruthy()
      expect(detail.description).toBeTruthy()
      expect(detail.capabilityCount).toBeGreaterThan(0)
      expect(detail.dataSourceKindCount).toBeGreaterThan(0)
      expect(detail.schemaFieldCount).toBeGreaterThan(0)
    }
  })

  it('includes capability coverage matrix', () => {
    const result = summariseConnectors() as {
      capabilityCoverage: Record<string, string[]>
    }

    expect(result.capabilityCoverage['FetchSubject']).toBeDefined()
    expect(result.capabilityCoverage['FetchSubject'].length).toBeGreaterThan(0)
    expect(result.capabilityCoverage['Preview']).toBeDefined()
  })

  it('includes data source kind coverage', () => {
    const result = summariseConnectors() as {
      dataSourceKindCoverage: Record<string, string[]>
    }

    expect(result.dataSourceKindCoverage['Crm']).toBeDefined()
    expect(result.dataSourceKindCoverage['Crm'].length).toBeGreaterThan(0)
  })

  it('identifies full-coverage connectors', () => {
    const result = summariseConnectors() as {
      fullCoverageConnectors: string[]
    }

    expect(result.fullCoverageConnectors).toBeInstanceOf(Array)
  })

  it('counts total aliases across all connectors', () => {
    const result = summariseConnectors() as { totalAliases: number }
    const expected = getConnectors().reduce((sum, c) => sum + c.aliases.length, 0)
    expect(result.totalAliases).toBe(expected)
  })

  it('does not expose enterprise internals in the description', () => {
    const result = summariseConnectors() as { description: string }

    expect(result.description.toLowerCase()).not.toContain('salesforce')
    expect(result.description.toLowerCase()).not.toContain('hubspot')
  })
})

// ---------------------------------------------------------------------------
// scout_metadata_quality_report
// ---------------------------------------------------------------------------

describe('scout_metadata_quality_report', () => {
  it('produces a quality report for a valid manifest', () => {
    const manifest = loadFixture('fixture-manifest-valid.json')
    const result = produceMetadataQualityReport(manifest) as {
      connectorType: string
      displayName: string
      auditedAtUtc: string
      overallReadiness: number
      readinessBreakdown: Record<string, number>
      schemaSummary: {
        totalFields: number
        requiredFields: number
        documentedFields: number
      }
      fieldClassifications: Array<{ name: string; classification: string }>
      warningCount: number
      warnings: unknown[]
      recommendationCount: number
      recommendations: unknown[]
    }

    expect(result.connectorType).toBe('fixtureConnector')
    expect(result.displayName).toBe('Fixture Connector')
    expect(result.auditedAtUtc).toBeTruthy()
    expect(result.overallReadiness).toBeGreaterThanOrEqual(0)
    expect(result.overallReadiness).toBeLessThanOrEqual(100)
    expect(result.schemaSummary.totalFields).toBeGreaterThan(0)
    expect(result.fieldClassifications.length).toBeGreaterThan(0)
    expect(result.warningCount).toBe(result.warnings.length)
    expect(result.recommendationCount).toBe(result.recommendations.length)
  })

  it('includes readiness breakdown dimensions', () => {
    const manifest = loadFixture('fixture-manifest-valid.json')
    const result = produceMetadataQualityReport(manifest) as {
      readinessBreakdown: {
        manifestCompleteness: number
        schemaQuality: number
        sampleDataCoverage: number
        capabilityBreadth: number
        documentationCoverage: number
      }
    }

    expect(result.readinessBreakdown.manifestCompleteness).toBeGreaterThanOrEqual(0)
    expect(result.readinessBreakdown.schemaQuality).toBeGreaterThanOrEqual(0)
    expect(result.readinessBreakdown.sampleDataCoverage).toBeGreaterThanOrEqual(0)
    expect(result.readinessBreakdown.capabilityBreadth).toBeGreaterThanOrEqual(0)
    expect(result.readinessBreakdown.documentationCoverage).toBeGreaterThanOrEqual(0)
  })

  it('classifies semantic attribute fields correctly', () => {
    const manifest = loadFixture('fixture-manifest-valid.json')
    const result = produceMetadataQualityReport(manifest) as {
      fieldClassifications: Array<{ name: string; classification: string }>
    }

    const conversionField = result.fieldClassifications.find(
      (f) => f.name === 'conversionProbability',
    )
    expect(conversionField).toBeDefined()
    expect(conversionField?.classification).toBe('semantic-attribute')

    const churnField = result.fieldClassifications.find(
      (f) => f.name === 'churnRisk',
    )
    expect(churnField).toBeDefined()
    expect(churnField?.classification).toBe('semantic-attribute')
  })

  it('produces a report with sample records', () => {
    const manifest = loadFixture('fixture-manifest-valid.json')
    const sampleRecords = loadFixture('fixture-sample-records.json')
    const result = produceMetadataQualityReport(manifest, sampleRecords) as {
      connectorType: string
      overallReadiness: number
      schemaSummary: { totalFields: number }
    }

    expect(result.connectorType).toBe('fixtureConnector')
    expect(result.overallReadiness).toBeGreaterThanOrEqual(0)
    expect(result.schemaSummary.totalFields).toBeGreaterThan(0)
  })

  it('reports warnings for an invalid manifest', () => {
    const manifest = loadFixture('fixture-manifest-invalid.json')
    const result = produceMetadataQualityReport(manifest) as {
      error: string
    }

    expect(result.error).toBeTruthy()
  })

  it('rejects null manifest input', () => {
    const result = produceMetadataQualityReport(null) as { error: string }
    expect(result.error).toContain('manifest')
  })

  it('rejects non-object manifest input', () => {
    const result = produceMetadataQualityReport('not-an-object') as { error: string }
    expect(result.error).toContain('manifest')
  })

  it('rejects non-array sample records', () => {
    const manifest = loadFixture('fixture-manifest-valid.json')
    const result = produceMetadataQualityReport(manifest, 'not-an-array') as { error: string }
    expect(result.error).toContain('sampleRecords')
  })

  it('produces a report for all built-in connectors', () => {
    const connectors = getConnectors()
    for (const connector of connectors) {
      const result = produceMetadataQualityReport(connector) as {
        connectorType: string
        overallReadiness: number
      }

      expect(
        result.connectorType,
        `Built-in connector '${connector.connectorType}' should produce a valid quality report`,
      ).toBe(connector.connectorType)
      expect(result.overallReadiness).toBeGreaterThanOrEqual(0)
    }
  })

  it('returns structured hint for missing manifest fields', () => {
    const manifest = { connectorType: 'test' }
    const result = produceMetadataQualityReport(manifest) as {
      error: string
      hint: string
    }

    expect(result.error).toContain('missing required fields')
    expect(result.hint).toBeTruthy()
  })
})
