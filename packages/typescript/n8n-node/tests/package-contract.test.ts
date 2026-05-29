import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

describe('n8n package contract', () => {
  const packageJson = JSON.parse(readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))

  it('declares the canonical local package and n8n community metadata', () => {
    expect(packageJson.name).toBe('@kyntic/n8n-node')
    expect(packageJson.keywords).toContain('n8n-community-node-package')
    expect(packageJson.n8n.nodes).toEqual(['dist/nodes/KynticAi/KynticAi.node.js'])
    expect(packageJson.n8n.credentials).toEqual(['dist/credentials/KynticAiApi.credentials.js'])
    expect(packageJson.scripts.build).toContain('scripts/copy-assets.cjs')
  })

  it('keeps publish and marketplace automation out of the local package', () => {
    expect(packageJson.scripts.publish).toBeUndefined()
    expect(packageJson.scripts.release).toBeUndefined()
  })
})
