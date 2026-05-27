#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runTestHarness } from './harness.js'
import type { SampleConnectorDefinition } from './types.js'

const args = process.argv.slice(2)

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
scout-connector-test — KynticAI Scout Connector Test Harness

Usage:
  scout-connector-test <manifest.json> [options]

Options:
  --records <file.json>   Path to a JSON file with sample records (array).
  --known-ids <id,...>    Comma-separated list of existing connector IDs.
  --json                  Output raw JSON report instead of human-readable text.
  --help, -h              Show this help message.

The manifest file must follow the public KynticAI Scout connector manifest
schema. See docs/connector-authoring.md for the full specification.

Example:
  scout-connector-test ./my-connector-manifest.json --records ./sample-records.json
`)
  process.exit(0)
}

const manifestPath = resolve(args[0])
let manifestData: unknown
try {
  manifestData = JSON.parse(readFileSync(manifestPath, 'utf-8'))
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err)
  console.error(`Failed to read manifest: ${msg}`)
  process.exit(1)
}

let sampleRecords: Array<{ externalUserId: string; observedAtUtc?: string; payload: Record<string, unknown> }> | undefined
const recordsIdx = args.indexOf('--records')
if (recordsIdx !== -1 && args[recordsIdx + 1] !== undefined) {
  const recordsPath = resolve(args[recordsIdx + 1])
  try {
    sampleRecords = JSON.parse(readFileSync(recordsPath, 'utf-8')) as typeof sampleRecords
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`Failed to read records file: ${msg}`)
    process.exit(1)
  }
}

let knownConnectorIds: string[] | undefined
const knownIdx = args.indexOf('--known-ids')
if (knownIdx !== -1 && args[knownIdx + 1] !== undefined) {
  knownConnectorIds = args[knownIdx + 1].split(',').map((s: string) => s.trim())
}

const jsonOutput = args.includes('--json')

const definition: SampleConnectorDefinition = {
  manifest: manifestData as SampleConnectorDefinition['manifest'],
  sampleRecords,
}

const report = await runTestHarness(definition, { knownConnectorIds })

if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log()
  console.log(`KynticAI Scout Connector Test Harness`)
  console.log(`${'='.repeat(50)}`)
  console.log(`Connector:  ${report.connectorId}`)
  console.log(`Name:       ${report.displayName}`)
  console.log(`Ran at:     ${report.ranAtUtc}`)
  console.log()
  console.log(`Result:     ${report.passed ? 'PASSED' : 'FAILED'}`)
  console.log(`Tests:      ${String(report.passedTests)}/${String(report.totalTests)} passed`)
  console.log()

  for (const result of report.results) {
    const icon = result.passed ? '[PASS]' : '[FAIL]'
    console.log(`  ${icon} [${result.suite}] ${result.name}`)
    if (!result.passed) {
      console.log(`         ${result.message}`)
    }
  }

  console.log()
  if (!report.passed) {
    process.exit(1)
  }
}
