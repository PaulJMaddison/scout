#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runAudit } from './audit-runner.js'
import type { AuditInput } from './types.js'

function main(): void {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage()
    process.exit(args.length === 0 ? 1 : 0)
  }

  const inputPath = resolve(args[0]!)
  const raw = readFileSync(inputPath, 'utf-8')
  const input = JSON.parse(raw) as AuditInput

  const report = runAudit(input)
  process.stdout.write(JSON.stringify(report, null, 2) + '\n')
}

function printUsage(): void {
  const usage = `
scout-metadata-audit — local metadata audit runner for KynticAI Scout

Usage:
  scout-metadata-audit <input.json>

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
  JSON audit report with schema summary, field classifications,
  missing metadata warnings, readiness score, and recommendations.

No live database or external service connections are made.
`.trim()

  process.stdout.write(usage + '\n')
}

main()
