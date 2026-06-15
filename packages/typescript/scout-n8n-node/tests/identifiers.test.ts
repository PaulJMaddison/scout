import { describe, it, expect } from 'vitest'
import { validateTenantSlug, validateWorkspaceSlug } from '../src/validation/identifiers.js'

describe('validateTenantSlug', () => {
  it('accepts a simple slug', () => {
    expect(validateTenantSlug('demo').valid).toBe(true)
  })

  it('accepts a slug with hyphens', () => {
    expect(validateTenantSlug('pilot-alpha').valid).toBe(true)
  })

  it('accepts a two-character slug', () => {
    expect(validateTenantSlug('ab').valid).toBe(true)
  })

  it('rejects empty string', () => {
    const r = validateTenantSlug('')
    expect(r.valid).toBe(false)
    expect(r.error).toContain('empty')
  })

  it('rejects uppercase characters', () => {
    const r = validateTenantSlug('Demo')
    expect(r.valid).toBe(false)
    expect(r.error).toContain('lower-case')
  })

  it('rejects spaces', () => {
    const r = validateTenantSlug('my tenant')
    expect(r.valid).toBe(false)
  })

  it('rejects slug starting with a digit', () => {
    const r = validateTenantSlug('1demo')
    expect(r.valid).toBe(false)
  })

  it('rejects slug ending with a hyphen', () => {
    const r = validateTenantSlug('demo-')
    expect(r.valid).toBe(false)
  })

  it('rejects slug starting with a hyphen', () => {
    const r = validateTenantSlug('-demo')
    expect(r.valid).toBe(false)
  })

  it('rejects single-character slug', () => {
    const r = validateTenantSlug('a')
    expect(r.valid).toBe(false)
  })

  it('rejects slug over 64 characters', () => {
    const r = validateTenantSlug('a' + 'b'.repeat(64))
    expect(r.valid).toBe(false)
  })

  it('rejects special characters', () => {
    expect(validateTenantSlug('demo!').valid).toBe(false)
    expect(validateTenantSlug('demo@corp').valid).toBe(false)
    expect(validateTenantSlug('demo/path').valid).toBe(false)
  })
})

describe('validateWorkspaceSlug', () => {
  it('accepts empty string (workspace is optional)', () => {
    expect(validateWorkspaceSlug('').valid).toBe(true)
  })

  it('accepts a valid workspace slug', () => {
    expect(validateWorkspaceSlug('marketing').valid).toBe(true)
  })

  it('rejects invalid workspace slug', () => {
    const r = validateWorkspaceSlug('BAD WORKSPACE')
    expect(r.valid).toBe(false)
  })
})
