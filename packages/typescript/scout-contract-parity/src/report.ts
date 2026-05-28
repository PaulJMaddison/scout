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

  if (report.issues.length > 0) {
    lines.push('', 'Findings:')
    for (const issue of report.issues) {
      lines.push(formatIssue(issue))
    }
  }

  return lines.join('\n')
}

function formatIssue(issue: ParityIssue): string {
  const model = issue.model ? ` ${issue.model}` : ''
  const field = issue.field ? `.${issue.field}` : ''
  return `- [${issue.severity.toUpperCase()}] ${issue.kind}${model}${field}: ${issue.message}`
}
