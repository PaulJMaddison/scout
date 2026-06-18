#!/usr/bin/env node
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runParityCheck } from './parity-checker.js'
import { exportJson, exportText } from './report.js'
import { loadFromRepo, readFixture } from './source-loaders.js'

type OutputFormat = 'json' | 'text'

function main(): void {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    printUsage()
    process.exit(0)
  }

  let repoRoot = resolve(process.cwd(), '..', '..', '..')
  let fixture: string | undefined
  let output: string | undefined
  let format: OutputFormat = 'text'

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!
    if (arg === '--repo-root') {
      repoRoot = resolve(requireValue(args, ++i, arg))
    } else if (arg === '--fixture') {
      fixture = requireValue(args, ++i, arg)
    } else if (arg === '--format') {
      const value = requireValue(args, ++i, arg)
      if (value !== 'json' && value !== 'text') {
        process.stderr.write('Error: --format must be "json" or "text".\n')
        process.exit(1)
      }
      format = value
    } else if (arg === '--output' || arg === '-o') {
      output = requireValue(args, ++i, arg)
    } else {
      process.stderr.write(`Error: unknown argument '${arg}'.\n`)
      process.exit(1)
    }
  }

  const input = fixture ? readFixture(fixture) : loadFromRepo(repoRoot)
  const report = runParityCheck(input, new Date().toISOString())
  const content = format === 'json' ? exportJson(report) : exportText(report)

  if (output) {
    writeFileSync(resolve(output), content, 'utf-8')
  } else {
    process.stdout.write(content + '\n')
  }

  process.exit(report.isValid ? 0 : 1)
}

function requireValue(args: string[], index: number, option: string): string {
  const value = args[index]
  if (!value) {
    process.stderr.write(`Error: ${option} requires a value.\n`)
    process.exit(1)
  }
  return value
}

function printUsage(): void {
  process.stdout.write(`Scout contract parity checker

Usage:
  scout-contract-parity [--repo-root <path>] [--fixture <path>] [--format text|json] [--output <path>]

Options:
  --repo-root <path>      Scout repository root. Defaults to ../../.. from this package.
  --fixture <path>        Read deterministic contract snapshot JSON instead of parsing the repo.
  --format <text|json>    Output format. Defaults to text.
  --output, -o <path>     Write report to a file instead of stdout.
  --help, -h              Show this help.
`)
}

main()
