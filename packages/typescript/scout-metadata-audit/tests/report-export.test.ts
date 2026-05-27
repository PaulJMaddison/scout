import { describe, expect, it } from 'vitest'
import { runAudit } from '../src/audit-runner.js'
import { deriveManifestValidation, exportJson, exportMarkdown } from '../src/report-export.js'
import type { AuditInput, AuditReport, ConnectorManifest, SampleRecord } from '../src/types.js'

// ---------------------------------------------------------------------------
// Helpers — all data is fake/local, no live connections
// ---------------------------------------------------------------------------

function makeManifest(overrides: Partial<ConnectorManifest> = {}): ConnectorManifest {
  return {
    connectorType: 'fakeCrm',
    displayName: 'Fake CRM',
    description: 'Fictional connector for export tests.',
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

function makeReport(overrides: Partial<AuditInput> = {}): AuditReport {
  return runAudit(makeInput(overrides))
}

// ---------------------------------------------------------------------------
// deriveManifestValidation
// ---------------------------------------------------------------------------

describe('deriveManifestValidation', () => {
  it('returns isValid true for a well-formed manifest', () => {
    const report = makeReport()
    const v = deriveManifestValidation(report)
    expect(v.isValid).toBe(true)
    expect(v.errors).toEqual([])
  })

  it('returns isValid false when manifest has error-severity warnings', () => {
    const report = makeReport({ manifest: makeManifest({ displayName: '' }) })
    const v = deriveManifestValidation(report)
    expect(v.isValid).toBe(false)
    expect(v.errors.length).toBeGreaterThan(0)
  })

  it('captures manifest-level warnings', () => {
    const report = makeReport({
      manifest: makeManifest({ supportedDataSourceKinds: ['FictionalKind'] }),
    })
    const v = deriveManifestValidation(report)
    expect(v.warnings.length).toBeGreaterThan(0)
  })

  it('does not include sample record warnings in manifest validation', () => {
    const records: SampleRecord[] = [{ externalUserId: '', payload: {} }]
    const report = makeReport({ sampleRecords: records })
    const v = deriveManifestValidation(report)
    expect(v.errors.every((e) => !e.includes('externalUserId'))).toBe(true)
  })

  it('captures configurationSchema errors', () => {
    const report = makeReport({
      manifest: makeManifest({
        configurationSchema: { type: 'array' as 'object', required: [], properties: {} },
      }),
    })
    const v = deriveManifestValidation(report)
    expect(v.isValid).toBe(false)
    expect(v.errors.some((e) => e.includes('configurationSchema'))).toBe(true)
  })

  it('captures sampleConfiguration errors', () => {
    const report = makeReport({ manifest: makeManifest({ sampleConfiguration: {} }) })
    const v = deriveManifestValidation(report)
    expect(v.isValid).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// exportJson
// ---------------------------------------------------------------------------

describe('exportJson', () => {
  it('returns valid JSON', () => {
    const report = makeReport()
    const json = exportJson(report)
    const parsed = JSON.parse(json) as Record<string, unknown>
    expect(parsed).toBeDefined()
  })

  it('includes all top-level audit report keys', () => {
    const report = makeReport()
    const parsed = JSON.parse(exportJson(report)) as Record<string, unknown>
    expect(parsed['connectorType']).toBe('fakeCrm')
    expect(parsed['displayName']).toBe('Fake CRM')
    expect(parsed['auditedAtUtc']).toBeTruthy()
    expect(parsed['schemaSummary']).toBeDefined()
    expect(parsed['fieldClassifications']).toBeDefined()
    expect(parsed['warnings']).toBeDefined()
    expect(parsed['readinessScore']).toBeDefined()
    expect(parsed['recommendations']).toBeDefined()
  })

  it('includes manifestValidation section', () => {
    const report = makeReport()
    const parsed = JSON.parse(exportJson(report)) as Record<string, unknown>
    const mv = parsed['manifestValidation'] as Record<string, unknown>
    expect(mv).toBeDefined()
    expect(typeof mv['isValid']).toBe('boolean')
    expect(Array.isArray(mv['errors'])).toBe(true)
    expect(Array.isArray(mv['warnings'])).toBe(true)
  })

  it('uses provided validation summary when given', () => {
    const report = makeReport()
    const customValidation = { isValid: false, errors: ['Custom error'], warnings: [] }
    const parsed = JSON.parse(exportJson(report, customValidation)) as Record<string, unknown>
    const mv = parsed['manifestValidation'] as Record<string, unknown>
    expect(mv['isValid']).toBe(false)
    expect((mv['errors'] as string[])[0]).toBe('Custom error')
  })

  it('preserves readiness score breakdown in JSON', () => {
    const report = makeReport()
    const parsed = JSON.parse(exportJson(report)) as Record<string, unknown>
    const rs = parsed['readinessScore'] as Record<string, unknown>
    const bd = rs['breakdown'] as Record<string, unknown>
    expect(typeof bd['manifestCompleteness']).toBe('number')
    expect(typeof bd['schemaQuality']).toBe('number')
    expect(typeof bd['sampleDataCoverage']).toBe('number')
    expect(typeof bd['capabilityBreadth']).toBe('number')
    expect(typeof bd['documentationCoverage']).toBe('number')
  })

  it('preserves field classifications in JSON', () => {
    const report = makeReport()
    const parsed = JSON.parse(exportJson(report)) as Record<string, unknown>
    const fields = parsed['fieldClassifications'] as Array<Record<string, unknown>>
    expect(fields.length).toBe(4)
    expect(fields.some((f) => f['classification'] === 'semantic-attribute')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// exportMarkdown
// ---------------------------------------------------------------------------

describe('exportMarkdown', () => {
  it('returns a non-empty string', () => {
    const report = makeReport()
    const md = exportMarkdown(report)
    expect(md.length).toBeGreaterThan(0)
  })

  it('includes the report header with connector name', () => {
    const report = makeReport()
    const md = exportMarkdown(report)
    expect(md).toContain('# Metadata Audit Report — Fake CRM')
  })

  it('includes schema summary section', () => {
    const report = makeReport()
    const md = exportMarkdown(report)
    expect(md).toContain('## Schema Summary')
    expect(md).toContain('Total fields')
    expect(md).toContain('Required fields')
    expect(md).toContain('Documented fields')
  })

  it('includes field types subsection', () => {
    const report = makeReport()
    const md = exportMarkdown(report)
    expect(md).toContain('### Field Types')
    expect(md).toContain('`string`')
    expect(md).toContain('`number`')
  })

  it('includes field classifications table', () => {
    const report = makeReport()
    const md = exportMarkdown(report)
    expect(md).toContain('## Field Classifications')
    expect(md).toContain('`tableName`')
    expect(md).toContain('`conversionProbability`')
    expect(md).toContain('semantic-attribute')
    expect(md).toContain('identifier')
    expect(md).toContain('timestamp')
    expect(md).toContain('configuration')
  })

  it('includes connector manifest validation section', () => {
    const report = makeReport()
    const md = exportMarkdown(report)
    expect(md).toContain('## Connector Manifest Validation')
    expect(md).toContain('**Result:** Pass')
  })

  it('shows fail result for invalid manifest', () => {
    const report = makeReport({ manifest: makeManifest({ displayName: '' }) })
    const md = exportMarkdown(report)
    expect(md).toContain('**Result:** Fail')
    expect(md).toContain('### Errors')
  })

  it('includes metadata completeness warnings section', () => {
    const report = makeReport()
    const md = exportMarkdown(report)
    expect(md).toContain('## Metadata Completeness Warnings')
  })

  it('includes readiness score section with all components', () => {
    const report = makeReport()
    const md = exportMarkdown(report)
    expect(md).toContain('## Readiness Score')
    expect(md).toContain('Manifest completeness')
    expect(md).toContain('Schema quality')
    expect(md).toContain('Sample data coverage')
    expect(md).toContain('Capability breadth')
    expect(md).toContain('Documentation coverage')
  })

  it('includes recommendations section', () => {
    const report = makeReport()
    const md = exportMarkdown(report)
    expect(md).toContain('## Recommendations')
  })

  it('uses provided validation summary when given', () => {
    const report = makeReport()
    const customValidation = { isValid: false, errors: ['Custom error from validator'], warnings: [] }
    const md = exportMarkdown(report, customValidation)
    expect(md).toContain('**Result:** Fail')
    expect(md).toContain('Custom error from validator')
  })

  it('renders warnings with severity labels', () => {
    const report = makeReport({ manifest: makeManifest({ displayName: '' }) })
    const md = exportMarkdown(report)
    expect(md).toContain('Error')
  })

  it('renders info-level warnings for missing sample records', () => {
    const report = makeReport({ sampleRecords: undefined })
    const md = exportMarkdown(report)
    expect(md).toContain('Info')
  })
})

// ---------------------------------------------------------------------------
// Round-trip: JSON export is parseable and matches report structure
// ---------------------------------------------------------------------------

describe('round-trip consistency', () => {
  it('JSON export contains same connectorType as original report', () => {
    const report = makeReport()
    const parsed = JSON.parse(exportJson(report)) as AuditReport
    expect(parsed.connectorType).toBe(report.connectorType)
  })

  it('JSON export contains same readiness overall score', () => {
    const report = makeReport()
    const parsed = JSON.parse(exportJson(report)) as AuditReport
    expect(parsed.readinessScore.overall).toBe(report.readinessScore.overall)
  })

  it('JSON export contains same number of warnings', () => {
    const report = makeReport()
    const parsed = JSON.parse(exportJson(report)) as AuditReport
    expect(parsed.warnings.length).toBe(report.warnings.length)
  })

  it('JSON export contains same number of field classifications', () => {
    const report = makeReport()
    const parsed = JSON.parse(exportJson(report)) as AuditReport
    expect(parsed.fieldClassifications.length).toBe(report.fieldClassifications.length)
  })
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('export edge cases', () => {
  it('handles report with no warnings', () => {
    const report = makeReport()
    report.warnings = []
    const md = exportMarkdown(report)
    expect(md).toContain('No warnings.')
    const json = exportJson(report)
    const parsed = JSON.parse(json) as Record<string, unknown>
    expect((parsed['warnings'] as unknown[]).length).toBe(0)
  })

  it('handles report with no recommendations', () => {
    const report = makeReport()
    report.recommendations = []
    const md = exportMarkdown(report)
    expect(md).toContain('No recommendations.')
  })

  it('handles report with no field classifications', () => {
    const report = makeReport()
    report.fieldClassifications = []
    const md = exportMarkdown(report)
    expect(md).toContain('No fields found.')
  })

  it('handles manifest validation with only warnings, no errors', () => {
    const report = makeReport({
      manifest: makeManifest({ supportedDataSourceKinds: ['FictionalKind'] }),
    })
    const v = deriveManifestValidation(report)
    expect(v.isValid).toBe(true)
    expect(v.warnings.length).toBeGreaterThan(0)
    const md = exportMarkdown(report)
    expect(md).toContain('**Result:** Pass')
  })

  it('markdown overall score matches header table', () => {
    const report = makeReport()
    const md = exportMarkdown(report)
    const overallStr = `${String(report.readinessScore.overall)}%`
    const occurrences = md.split(overallStr).length - 1
    expect(occurrences).toBeGreaterThanOrEqual(2)
  })
})
