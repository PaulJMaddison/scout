import { describe, expect, it } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runParityCheck, exportText, readFixture } from '../src/index.js'

const currentDir = dirname(fileURLToPath(import.meta.url))
const passFixturePath = resolve(currentDir, '..', 'data', 'fixture-pass.json')
const failFixturePath = resolve(currentDir, '..', 'data', 'fixture-fail.json')

describe('contract parity checker', () => {
  it('passes deterministic parity fixtures without issues', () => {
    const report = runParityCheck(readFixture(passFixturePath))

    expect(report.isValid).toBe(true)
    expect(report.summary.issueCount).toBe(0)
    expect(exportText(report)).toContain('Scout contract parity: PASS')
  })

  it('reports missing fields, renamed fields, enum mismatches, and unsupported manifest features', () => {
    const report = runParityCheck(readFixture(failFixturePath))
    const messages = report.issues.map((issue) => issue.message)

    expect(report.isValid).toBe(false)
    expect(report.issues.map((issue) => issue.kind)).toEqual(
      expect.arrayContaining([
        'missing-field',
        'renamed-field',
        'enum-mismatch',
        'unsupported-manifest-feature',
      ]),
    )
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringContaining("missing field 'provenanceJson'"),
        expect.stringContaining("rename 'sourceSelectorDefinitionId' to 'sourceSelectorId'"),
        expect.stringContaining('enum values differ'),
        expect.stringContaining("unsupported field 'oauth2Flows'"),
        expect.stringContaining("unsupported source type 'Warehouse'"),
        expect.stringContaining("unsupported capability 'BulkSync'"),
      ]),
    )
  })

  it('renders stable text report summaries', () => {
    const text = exportText(runParityCheck(readFixture(failFixturePath)))

    expect(text).toContain('Scout contract parity: FAIL')
    expect(text).toContain('Models compared: 2')
    expect(text).toContain('Enums compared: 2')
    expect(text).toContain('Manifests checked: 1')
    expect(text).toContain('[ERROR] enum-mismatch DataSourceKind')
  })
})
