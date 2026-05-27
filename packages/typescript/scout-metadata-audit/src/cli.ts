#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runAudit } from './audit-runner.js'
import { exportJson, exportMarkdown } from './report-export.js'
import type { AuditInput } from './types.js'

type OutputFormat = 'json' | 'markdown'

function main(): void {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage()
    process.exit(args.length === 0 ? 1 : 0)
  }

  let inputPath: string | undefined
  let format: OutputFormat = 'json'
  let outputPath: string | undefined

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!
    if (arg === '--format' || arg === '-f') {
      const next = args[i + 1]
      if (next === 'json' || next === 'markdown') {
        format = next
        i++
      } else {
        process.stderr.write('Error: --format must be "json" or "markdown".\n')
        process.exit(1)
      }
    } else if (arg === '--output' || arg === '-o') {
      outputPath = args[i + 1]
      i++
    } else if (!inputPath) {
      inputPath = arg
    }
  }

  if (!inputPath) {
    process.stderr.write('Error: input file path is required.\n')
    process.exit(1)
  }

  const raw = readFileSync(resolve(inputPath), 'utf-8')
  const input = JSON.parse(raw) as AuditInput
  const report = runAudit(input)

  const content = format === 'markdown' ? exportMarkdown(report) : exportJson(report)

  if (outputPath) {
    writeFileSync(resolve(outputPath), content, 'utf-8')
  } else {
    process.stdout.write(content + '\n')
  }
}

function printUsage(): void {
  const usage = `
scout-metadata-audit — local metadata audit runner for KynticAI Scout

Usage:
  scout-metadata-audit <input.json> [options]

Options:
  --format, -f <json|markdown>   Output format (default: json)
  --output, -o <path>            Write output to file instead of stdout
  --help, -h                     Show this help

Input JSON shape:
  {
    "manifest": {              // required — connector manifest
      "connectorType": "...",
      "displayName": "...",
      "description": "...",
      "supportedDataSourceKinds": ["Crm"],
      "configurationSchema": { "type": "object", "properties": { ... } },
      "sampleConfiguration": { ... }
    },
    "sampleSchema": { ... },   // optional — override schema for field analysis
    "sampleRecords": [ ... ]   // optional — sample records for coverage analysis
  }

Output:
  JSON or Markdown audit report with schema summary, field classifications,
  connector manifest validation, metadata completeness warnings,
  readiness score components, and recommendations.

No live database or external service connections are made.
`.trim()

  process.stdout.write(usage + '\n')
}

main()
