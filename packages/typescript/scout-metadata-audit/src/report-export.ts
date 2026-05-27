import type {
  AuditReport,
  FieldSummary,
  ManifestValidationSummary,
  MetadataWarning,
  ReadinessBreakdown,
} from './types.js'

/**
 * Derives a manifest validation summary from audit warnings.
 * Manifest-related warnings are those targeting top-level manifest fields
 * (not schema field-level or sample record issues).
 */
export function deriveManifestValidation(report: AuditReport): ManifestValidationSummary {
  const manifestFields = new Set([
    'connectorType',
    'displayName',
    'description',
    'supportedDataSourceKinds',
    'supportedCapabilities',
    'configurationSchema',
    'configurationSchema.type',
    'configurationSchema.properties',
    'sampleConfiguration',
  ])

  const errors: string[] = []
  const warnings: string[] = []

  for (const w of report.warnings) {
    const isManifestField =
      manifestFields.has(w.field) || w.field.startsWith('sampleConfiguration.')

    if (!isManifestField) continue

    if (w.severity === 'error') {
      errors.push(w.message)
    } else if (w.severity === 'warning') {
      warnings.push(w.message)
    }
  }

  return { isValid: errors.length === 0, errors, warnings }
}

/** JSON export: structured report with optional manifest validation summary. */
export function exportJson(
  report: AuditReport,
  validation?: ManifestValidationSummary,
): string {
  const output = {
    ...report,
    manifestValidation: validation ?? deriveManifestValidation(report),
  }
  return JSON.stringify(output, null, 2)
}

/** Markdown export: developer-facing technical report. */
export function exportMarkdown(
  report: AuditReport,
  validation?: ManifestValidationSummary,
): string {
  const v = validation ?? deriveManifestValidation(report)
  const sections: string[] = []

  sections.push(renderHeader(report))
  sections.push(renderSchemaSummary(report))
  sections.push(renderFieldClassifications(report.fieldClassifications))
  sections.push(renderManifestValidation(v))
  sections.push(renderMetadataWarnings(report.warnings))
  sections.push(renderReadinessScore(report.readinessScore.overall, report.readinessScore.breakdown))
  sections.push(renderRecommendations(report))

  return sections.join('\n')
}

function renderHeader(report: AuditReport): string {
  return [
    `# Metadata Audit Report — ${report.displayName}`,
    '',
    `| Property | Value |`,
    `|---|---|`,
    `| Connector type | \`${report.connectorType}\` |`,
    `| Display name | ${report.displayName} |`,
    `| Audited at (UTC) | ${report.auditedAtUtc} |`,
    `| Overall readiness | ${String(report.readinessScore.overall)}% |`,
    '',
  ].join('\n')
}

function renderSchemaSummary(report: AuditReport): string {
  const s = report.schemaSummary
  const lines: string[] = [
    '## Schema Summary',
    '',
    `| Metric | Count |`,
    `|---|---|`,
    `| Total fields | ${String(s.totalFields)} |`,
    `| Required fields | ${String(s.requiredFields)} |`,
    `| Optional fields | ${String(s.optionalFields)} |`,
    `| Documented fields | ${String(s.documentedFields)} |`,
    `| Undocumented fields | ${String(s.undocumentedFields)} |`,
    '',
  ]

  if (Object.keys(s.fieldTypes).length > 0) {
    lines.push('### Field Types')
    lines.push('')
    lines.push('| Type | Count |')
    lines.push('|---|---|')
    for (const [type, count] of Object.entries(s.fieldTypes)) {
      lines.push(`| \`${type}\` | ${String(count)} |`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

function renderFieldClassifications(fields: FieldSummary[]): string {
  if (fields.length === 0) {
    return ['## Field Classifications', '', 'No fields found.', ''].join('\n')
  }

  const lines: string[] = [
    '## Field Classifications',
    '',
    '| Field | Type | Required | Documented | Classification |',
    '|---|---|---|---|---|',
  ]

  for (const f of fields) {
    lines.push(
      `| \`${f.name}\` | \`${f.type}\` | ${f.required ? 'Yes' : 'No'} | ${f.hasDescription ? 'Yes' : 'No'} | ${f.classification} |`,
    )
  }

  lines.push('')
  return lines.join('\n')
}

function renderManifestValidation(v: ManifestValidationSummary): string {
  const lines: string[] = [
    '## Connector Manifest Validation',
    '',
    `**Result:** ${v.isValid ? 'Pass' : 'Fail'}`,
    '',
  ]

  if (v.errors.length > 0) {
    lines.push('### Errors')
    lines.push('')
    for (const e of v.errors) {
      lines.push(`- ${e}`)
    }
    lines.push('')
  }

  if (v.warnings.length > 0) {
    lines.push('### Warnings')
    lines.push('')
    for (const w of v.warnings) {
      lines.push(`- ${w}`)
    }
    lines.push('')
  }

  if (v.errors.length === 0 && v.warnings.length === 0) {
    lines.push('No validation issues found.')
    lines.push('')
  }

  return lines.join('\n')
}

function severityLabel(severity: MetadataWarning['severity']): string {
  if (severity === 'error') return '🔴 Error'
  if (severity === 'warning') return '🟡 Warning'
  return '🔵 Info'
}

function renderMetadataWarnings(warnings: MetadataWarning[]): string {
  if (warnings.length === 0) {
    return ['## Metadata Completeness Warnings', '', 'No warnings.', ''].join('\n')
  }

  const lines: string[] = [
    '## Metadata Completeness Warnings',
    '',
    '| Severity | Field | Message |',
    '|---|---|---|',
  ]

  for (const w of warnings) {
    lines.push(`| ${severityLabel(w.severity)} | \`${w.field}\` | ${w.message} |`)
  }

  lines.push('')
  return lines.join('\n')
}

function renderReadinessScore(overall: number, breakdown: ReadinessBreakdown): string {
  return [
    '## Readiness Score',
    '',
    `**Overall: ${String(overall)}%**`,
    '',
    '| Component | Score |',
    '|---|---|',
    `| Manifest completeness | ${String(breakdown.manifestCompleteness)}% |`,
    `| Schema quality | ${String(breakdown.schemaQuality)}% |`,
    `| Sample data coverage | ${String(breakdown.sampleDataCoverage)}% |`,
    `| Capability breadth | ${String(breakdown.capabilityBreadth)}% |`,
    `| Documentation coverage | ${String(breakdown.documentationCoverage)}% |`,
    '',
  ].join('\n')
}

function renderRecommendations(report: AuditReport): string {
  if (report.recommendations.length === 0) {
    return ['## Recommendations', '', 'No recommendations.', ''].join('\n')
  }

  const lines: string[] = ['## Recommendations', '']

  for (const r of report.recommendations) {
    lines.push(`- **[${r.category}]** ${r.message}`)
  }

  lines.push('')
  return lines.join('\n')
}
