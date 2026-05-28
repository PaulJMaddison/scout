import { describe, expect, it } from 'vitest'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const currentDir = dirname(fileURLToPath(import.meta.url))
const packageRoot = resolve(currentDir, '..')
const cliPath = resolve(packageRoot, 'dist', 'cli.js')
const passFixturePath = resolve(packageRoot, 'data', 'fixture-pass.json')
const failFixturePath = resolve(packageRoot, 'data', 'fixture-fail.json')

describe('contract parity CLI', () => {
  it('exits 0 for passing fixtures', () => {
    const result = spawnSync(process.execPath, [cliPath, '--fixture', passFixturePath], {
      cwd: packageRoot,
      encoding: 'utf-8',
    })

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Scout contract parity: PASS')
  })

  it('exits 1 and prints findings for failing fixtures', () => {
    const result = spawnSync(process.execPath, [cliPath, '--fixture', failFixturePath], {
      cwd: packageRoot,
      encoding: 'utf-8',
    })

    expect(result.status).toBe(1)
    expect(result.stdout).toContain('Scout contract parity: FAIL')
    expect(result.stdout).toContain('unsupported capability')
  })

  it('supports JSON output', () => {
    const result = spawnSync(process.execPath, [cliPath, '--fixture', passFixturePath, '--format', 'json'], {
      cwd: packageRoot,
      encoding: 'utf-8',
    })

    expect(result.status).toBe(0)
    expect(JSON.parse(result.stdout)).toMatchObject({ isValid: true })
  })
})
