import type { ContractParityReport, ParityIssue } from './types.js'

export function exportJson(report: ContractParityReport): string {
  return JSON.stringify(report, null, 2)
}

export function exportText(report: ContractParityReport): string {
  const lines = [
    `Scout contract parity: ${report.isValid ? 'PASS' : 'FAIL'}`,
    `Models compared: ${String(report.summary.modelsCompared)}`,
    `Enums compared: ${String(report.summary.enumsCompared)}`,
    `Manifests checked: ${String(report.summary.manifestsChecked)}`,
    `Issues: ${String(report.summary.issueCount)} (${String(report.summary.errorCount)} error, ${String(report.summary.warningCount)} warning)`,
  ]

  const errors = report.issues.filter((issue) => issue.severity === 'error')
  if (errors.length > 0) {
    lines.push('', 'Errors:')
    for (const issue of errors) {
      lines.push(formatIssue(issue))
    }
  }

  if (report.warningGroups.length > 0) {
    lines.push('', 'Warnings:')
    for (const group of report.warningGroups) {
      lines.push(``, `${group.title} (${String(group.issues.length)})`, `Action: ${group.action}`)
      for (const issue of group.issues) {
        lines.push(formatIssue(issue))
        if (issue.sourceReference || issue.targetReference) {
          lines.push(formatReferences(issue))
        }
      }
    }
  }

  return lines.join('\n')
}

function formatIssue(issue: ParityIssue): string {
  const model = issue.model ? ` ${issue.model}` : ''
  const field = issue.field ? `.${issue.field}` : ''
  return `- [${issue.severity.toUpperCase()}] ${issue.kind}${model}${field}: ${issue.message}`
}

function formatReferences(issue: ParityIssue): string {
  const refs = [
    issue.sourceReference ? `source ${issue.sourceReference}` : undefined,
    issue.targetReference ? `target ${issue.targetReference}` : undefined,
  ].filter((ref): ref is string => ref !== undefined)
  return `  References: ${refs.join('; ')}`
}
