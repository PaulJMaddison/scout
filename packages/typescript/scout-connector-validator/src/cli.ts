#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, extname } from 'node:path'
import { validateManifest } from './validator.js'
import type { ValidatorOptions } from './types.js'

const args = process.argv.slice(2)

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`Usage: scout-validate-manifest <file|directory> [--check-duplicates]

Validates one or more KynticAI Scout connector manifest JSON files.

Arguments:
  file|directory          Path to a manifest JSON file, or a directory of manifests.

Options:
  --check-duplicates      Check for duplicate connector IDs across all provided manifests.
  --help, -h              Show this help message.

Examples:
  scout-validate-manifest ./my-connector-manifest.json
  scout-validate-manifest ./manifests/ --check-duplicates`)
  process.exit(0)
}

const checkDuplicates = args.includes('--check-duplicates')
const paths = args.filter((a) => !a.startsWith('--'))

function collectManifestPaths(target: string): string[] {
  const resolved = resolve(target)
  const stat = statSync(resolved, { throwIfNoEntry: false })
  if (stat === undefined) {
    console.error(`Path not found: ${resolved}`)
    process.exit(1)
  }

  if (stat.isFile()) return [resolved]

  if (stat.isDirectory()) {
    return readdirSync(resolved)
      .filter((f) => extname(f) === '.json')
      .map((f) => resolve(resolved, f))
  }

  return []
}

const files: string[] = []
for (const p of paths) {
  files.push(...collectManifestPaths(p))
}

if (files.length === 0) {
  console.error('No JSON manifest files found.')
  process.exit(1)
}

let hasErrors = false
const seenIds: string[] = []

for (const file of files) {
  let parsed: unknown
  try {
    const raw = readFileSync(file, 'utf-8')
    parsed = JSON.parse(raw)
  } catch (err) {
    console.error(`\n[FAIL] ${file}`)
    console.error(`  Could not parse JSON: ${err instanceof Error ? err.message : String(err)}`)
    hasErrors = true
    continue
  }

  const options: ValidatorOptions = {}
  if (checkDuplicates) {
    options.knownConnectorIds = seenIds
  }

  const result = validateManifest(parsed, options)

  if (result.isValid) {
    console.log(`\n[PASS] ${file}`)
  } else {
    console.error(`\n[FAIL] ${file}`)
    hasErrors = true
  }

  for (const error of result.errors) {
    console.error(`  ERROR: ${error}`)
  }
  for (const warning of result.warnings) {
    console.warn(`  WARN:  ${warning}`)
  }

  if (typeof parsed === 'object' && parsed !== null && 'connectorId' in parsed) {
    const id = (parsed as Record<string, unknown>)['connectorId']
    if (typeof id === 'string') {
      seenIds.push(id)
    }
  }
}

console.log(`\n${String(files.length)} manifest(s) checked. ${hasErrors ? 'Validation failed.' : 'All valid.'}`)
process.exit(hasErrors ? 1 : 0)
