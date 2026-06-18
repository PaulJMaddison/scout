import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Discovery Agent CLI contract', () => {
  it('build output can produce a Tier 1 JSON handover document', () => {
    const distIndex = path.resolve('dist', 'index.js')
    if (!existsSync(distIndex)) {
      return
    }

    const root = mkdtempSync(path.join(tmpdir(), 'kyntic-discovery-cli-'))
    writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'cli-fixture', dependencies: {} }))
    const output = execFileSync(process.execPath, [distIndex, '--path', root, '--tier', '1'], {
      encoding: 'utf-8',
      cwd: path.resolve('.'),
      timeout: 12_000,
    })
    const parsed = JSON.parse(output) as { project_name: string; recommended_next_agent_prompt: string }

    expect(parsed.project_name).toBe('cli-fixture')
    expect(parsed.recommended_next_agent_prompt).toContain('cli-fixture')
  }, 15_000)
})
