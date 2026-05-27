import { describe, expect, it } from 'vitest'
import { runAudit } from '../src/audit-runner.js'
import type { AuditInput, AuditReport, ConnectorManifest, SampleRecord } from '../src/types.js'

// ---------------------------------------------------------------------------
// Helpers — all data is fake/local, no live connections
// ---------------------------------------------------------------------------

function makeManifest(overrides: Partial<ConnectorManifest> = {}): ConnectorManifest {
  return {
    connectorType: 'fakeCrm',
    displayName: 'Fake CRM',
    description: 'Fictional connector for audit tests.',
    aliases: ['testCrm'],
    supportedDataSourceKinds: ['Crm'],
    supportedCapabilities: [
      'FetchSubject',
      'Preview',
      'DryRun',
      'HealthCheck',
      'ConfigurationValidation',
      'SecureCredentialStorage',
    ],
    configurationSchema: {
      type: 'object',
      required: ['tableName'],
      properties: {
        tableName: { type: 'string', description: 'Source table name.' },
        userIdColumn: { type: 'string', description: 'User ID column.' },
        observedAtUtc: { type: 'string', format: 'date-time', description: 'Timestamp column.' },
        conversionProbability: { type: 'number', description: 'Semantic attribute: conversion probability.' },
      },
    },
    sampleConfiguration: {
      tableName: 'contacts',
      userIdColumn: 'id',
    },
    ...overrides,
  }
}

function makeSampleRecords(): SampleRecord[] {
  return [
    {
      externalUserId: 'user-001',
      observedAtUtc: '2026-01-15T09:00:00Z',
      payload: { fullName: 'Avery Stone', score: 82 },
    },
    {
      externalUserId: 'user-002',
      observedAtUtc: '2026-01-15T09:30:00Z',
      payload: { fullName: 'Jordan Blake', score: 44 },
    },
  ]
}

function makeInput(overrides: Partial<AuditInput> = {}): AuditInput {
  return {
    manifest: makeManifest(),
    sampleRecords: makeSampleRecords(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Report structure
// ---------------------------------------------------------------------------

describe('audit report structure', () => {
  it('returns a report with all required top-level keys', () => {
    const report = runAudit(makeInput())

    expect(report.connectorType).toBe('fakeCrm')
    expect(report.displayName).toBe('Fake CRM')
    expect(report.auditedAtUtc).toBeTruthy()
    expect(report.schemaSummary).toBeDefined()
    expect(report.fieldClassifications).toBeInstanceOf(Array)
    expect(report.warnings).toBeInstanceOf(Array)
    expect(report.readinessScore).toBeDefined()
    expect(report.recommendations).toBeInstanceOf(Array)
  })

  it('auditedAtUtc is a valid ISO date', () => {
    const report = runAudit(makeInput())
    const parsed = new Date(report.auditedAtUtc)
    expect(parsed.getTime()).not.toBeNaN()
  })
})

// ---------------------------------------------------------------------------
// Schema summary
// ---------------------------------------------------------------------------

describe('schema summary', () => {
  it('counts total, required, and optional fields', () => {
    const report = runAudit(makeInput())
    const s = report.schemaSummary

    expect(s.totalFields).toBe(4)
    expect(s.requiredFields).toBe(1)
    expect(s.optionalFields).toBe(3)
  })

  it('counts documented vs undocumented fields', () => {
    const report = runAudit(makeInput())
    const s = report.schemaSummary

    expect(s.documentedFields).toBe(4)
    expect(s.undocumentedFields).toBe(0)
  })

  it('tracks field types', () => {
    const report = runAudit(makeInput())
    expect(report.schemaSummary.fieldTypes['string']).toBe(3)
    expect(report.schemaSummary.fieldTypes['number']).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Field classification
// ---------------------------------------------------------------------------

describe('field classification', () => {
  it('classifies semantic attribute fields', () => {
    const report = runAudit(makeInput())
    const cp = report.fieldClassifications.find((f) => f.name === 'conversionProbability')
    expect(cp).toBeDefined()
    expect(cp!.classification).toBe('semantic-attribute')
  })

  it('classifies identifier fields', () => {
    const report = runAudit(makeInput())
    const uid = report.fieldClassifications.find((f) => f.name === 'userIdColumn')
    expect(uid).toBeDefined()
    expect(uid!.classification).toBe('identifier')
  })

  it('classifies timestamp fields', () => {
    const report = runAudit(makeInput())
    const ts = report.fieldClassifications.find((f) => f.name === 'observedAtUtc')
    expect(ts).toBeDefined()
    expect(ts!.classification).toBe('timestamp')
  })

  it('classifies configuration fields', () => {
    const report = runAudit(makeInput())
    const tn = report.fieldClassifications.find((f) => f.name === 'tableName')
    expect(tn).toBeDefined()
    expect(tn!.classification).toBe('configuration')
  })
})

// ---------------------------------------------------------------------------
// Missing metadata warnings
// ---------------------------------------------------------------------------

describe('missing metadata warnings', () => {
  it('flags empty displayName', () => {
    const report = runAudit(makeInput({ manifest: makeManifest({ displayName: '' }) }))
    expect(report.warnings.some((w) => w.field === 'displayName' && w.severity === 'error')).toBe(true)
  })

  it('flags empty description', () => {
    const report = runAudit(makeInput({ manifest: makeManifest({ description: '' }) }))
    expect(report.warnings.some((w) => w.field === 'description' && w.severity === 'error')).toBe(true)
  })

  it('flags empty supportedDataSourceKinds', () => {
    const report = runAudit(makeInput({ manifest: makeManifest({ supportedDataSourceKinds: [] }) }))
    expect(report.warnings.some((w) => w.field === 'supportedDataSourceKinds' && w.severity === 'error')).toBe(true)
  })

  it('warns about unrecognised data source kinds', () => {
    const report = runAudit(
      makeInput({ manifest: makeManifest({ supportedDataSourceKinds: ['FictionalKind'] }) }),
    )
    expect(
      report.warnings.some(
        (w) => w.field === 'supportedDataSourceKinds' && w.severity === 'warning',
      ),
    ).toBe(true)
  })

  it('flags missing required fields in sampleConfiguration', () => {
    const manifest = makeManifest({ sampleConfiguration: { userIdColumn: 'id' } })
    const report = runAudit(makeInput({ manifest }))
    expect(
      report.warnings.some(
        (w) => w.field === 'sampleConfiguration.tableName' && w.severity === 'error',
      ),
    ).toBe(true)
  })

  it('flags empty sampleConfiguration', () => {
    const manifest = makeManifest({ sampleConfiguration: {} })
    const report = runAudit(makeInput({ manifest }))
    expect(
      report.warnings.some(
        (w) => w.field === 'sampleConfiguration' && w.severity === 'error',
      ),
    ).toBe(true)
  })

  it('reports info when no sample records provided', () => {
    const report = runAudit(makeInput({ sampleRecords: undefined }))
    expect(
      report.warnings.some((w) => w.field === 'sampleRecords' && w.severity === 'info'),
    ).toBe(true)
  })

  it('warns about records with empty payloads', () => {
    const records: SampleRecord[] = [
      { externalUserId: 'u1', payload: {} },
    ]
    const report = runAudit(makeInput({ sampleRecords: records }))
    expect(
      report.warnings.some(
        (w) => w.field.includes('payload') && w.severity === 'warning',
      ),
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Readiness score
// ---------------------------------------------------------------------------

describe('readiness score', () => {
  it('returns a score between 0 and 100', () => {
    const report = runAudit(makeInput())
    expect(report.readinessScore.overall).toBeGreaterThanOrEqual(0)
    expect(report.readinessScore.overall).toBeLessThanOrEqual(100)
  })

  it('has all breakdown dimensions', () => {
    const report = runAudit(makeInput())
    const b = report.readinessScore.breakdown

    expect(b.manifestCompleteness).toBeGreaterThanOrEqual(0)
    expect(b.schemaQuality).toBeGreaterThanOrEqual(0)
    expect(b.sampleDataCoverage).toBeGreaterThanOrEqual(0)
    expect(b.capabilityBreadth).toBeGreaterThanOrEqual(0)
    expect(b.documentationCoverage).toBeGreaterThanOrEqual(0)
  })

  it('scores higher for a well-formed manifest than an incomplete one', () => {
    const good = runAudit(makeInput())
    const bad = runAudit(
      makeInput({
        manifest: makeManifest({
          displayName: '',
          description: '',
          supportedDataSourceKinds: [],
          supportedCapabilities: [],
          sampleConfiguration: {},
        }),
        sampleRecords: undefined,
      }),
    )

    expect(good.readinessScore.overall).toBeGreaterThan(bad.readinessScore.overall)
  })

  it('sample data coverage is 0 when no records are provided', () => {
    const report = runAudit(makeInput({ sampleRecords: undefined }))
    expect(report.readinessScore.breakdown.sampleDataCoverage).toBe(0)
  })

  it('capability breadth reflects declared capabilities', () => {
    const full = runAudit(
      makeInput({
        manifest: makeManifest({
          supportedCapabilities: [
            'FetchSubject',
            'Preview',
            'DryRun',
            'ScheduledSync',
            'EventTriggeredRecompute',
            'HealthCheck',
            'ConfigurationValidation',
            'SecureCredentialStorage',
          ],
        }),
      }),
    )
    const partial = runAudit(
      makeInput({ manifest: makeManifest({ supportedCapabilities: ['FetchSubject'] }) }),
    )

    expect(full.readinessScore.breakdown.capabilityBreadth).toBeGreaterThan(
      partial.readinessScore.breakdown.capabilityBreadth,
    )
  })
})

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

describe('recommendations', () => {
  it('recommends adding descriptions for undocumented fields', () => {
    const manifest = makeManifest({
      configurationSchema: {
        type: 'object',
        required: ['tableName'],
        properties: {
          tableName: { type: 'string' },
        },
      },
    })
    const report = runAudit(makeInput({ manifest }))
    expect(report.recommendations.some((r) => r.category === 'schema' && r.message.includes('descriptions'))).toBe(
      true,
    )
  })

  it('recommends sample records when none provided', () => {
    const report = runAudit(makeInput({ sampleRecords: undefined }))
    expect(report.recommendations.some((r) => r.category === 'sample-data')).toBe(true)
  })

  it('recommends aliases when none provided', () => {
    const report = runAudit(makeInput({ manifest: makeManifest({ aliases: [] }) }))
    expect(report.recommendations.some((r) => r.category === 'metadata' && r.message.includes('aliases'))).toBe(true)
  })

  it('recommends HealthCheck if not declared', () => {
    const report = runAudit(
      makeInput({ manifest: makeManifest({ supportedCapabilities: ['FetchSubject'] }) }),
    )
    expect(
      report.recommendations.some((r) => r.category === 'capabilities' && r.message.includes('HealthCheck')),
    ).toBe(true)
  })

  it('recommends fixing errors when present', () => {
    const report = runAudit(makeInput({ manifest: makeManifest({ displayName: '' }) }))
    expect(report.recommendations.some((r) => r.category === 'general' && r.message.includes('error'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Complete well-formed manifest — no errors expected
// ---------------------------------------------------------------------------

describe('well-formed manifest', () => {
  it('produces zero error-severity warnings for a complete manifest', () => {
    const report = runAudit(makeInput())
    const errors = report.warnings.filter((w) => w.severity === 'error')
    expect(errors).toEqual([])
  })

  it('readiness score is above 60 for a complete manifest with records', () => {
    const report = runAudit(makeInput())
    expect(report.readinessScore.overall).toBeGreaterThanOrEqual(60)
  })
})

// ---------------------------------------------------------------------------
// sampleSchema override
// ---------------------------------------------------------------------------

describe('sampleSchema override', () => {
  it('uses sampleSchema instead of configurationSchema when provided', () => {
    const report = runAudit(
      makeInput({
        sampleSchema: {
          type: 'object',
          required: ['alpha'],
          properties: {
            alpha: { type: 'string', description: 'Custom field.' },
            beta: { type: 'number', description: 'Another custom field.' },
          },
        },
      }),
    )

    expect(report.schemaSummary.totalFields).toBe(2)
    expect(report.fieldClassifications.map((f) => f.name)).toContain('alpha')
    expect(report.fieldClassifications.map((f) => f.name)).toContain('beta')
  })
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('handles manifest with no aliases gracefully', () => {
    const report = runAudit(makeInput({ manifest: makeManifest({ aliases: undefined }) }))
    expect(report).toBeDefined()
    expect(report.connectorType).toBe('fakeCrm')
  })

  it('handles manifest with no supportedCapabilities gracefully', () => {
    const report = runAudit(makeInput({ manifest: makeManifest({ supportedCapabilities: undefined }) }))
    expect(report.warnings.some((w) => w.field === 'supportedCapabilities' && w.severity === 'info')).toBe(true)
  })

  it('handles records missing observedAtUtc', () => {
    const records: SampleRecord[] = [
      { externalUserId: 'u1', payload: { score: 10 } },
    ]
    const report = runAudit(makeInput({ sampleRecords: records }))
    expect(report.warnings.some((w) => w.field.includes('observedAtUtc') && w.severity === 'info')).toBe(true)
  })

  it('handles records missing externalUserId', () => {
    const records: SampleRecord[] = [
      { externalUserId: '', payload: { score: 10 } },
    ]
    const report = runAudit(makeInput({ sampleRecords: records }))
    expect(report.warnings.some((w) => w.field.includes('externalUserId') && w.severity === 'warning')).toBe(true)
  })
})
