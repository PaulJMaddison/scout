import { describe, it, expect } from 'vitest'
import { validateBaseUrl } from '../src/validation/url.js'

describe('validateBaseUrl', () => {
  it('accepts a valid HTTPS URL', () => {
    const r = validateBaseUrl('https://scout.example.com')
    expect(r.valid).toBe(true)
    expect(r.sanitised).toBe('https://scout.example.com')
  })

  it('accepts a valid HTTP URL (local development)', () => {
    const r = validateBaseUrl('http://localhost:5198')
    expect(r.valid).toBe(true)
    expect(r.sanitised).toBe('http://localhost:5198')
  })

  it('strips trailing slashes', () => {
    const r = validateBaseUrl('https://scout.example.com/')
    expect(r.valid).toBe(true)
    expect(r.sanitised).toBe('https://scout.example.com')
  })

  it('strips multiple trailing slashes', () => {
    const r = validateBaseUrl('https://scout.example.com///')
    expect(r.valid).toBe(true)
    expect(r.sanitised).toBe('https://scout.example.com')
  })

  it('preserves path segments', () => {
    const r = validateBaseUrl('https://scout.example.com/api/v1')
    expect(r.valid).toBe(true)
    expect(r.sanitised).toBe('https://scout.example.com/api/v1')
  })

  it('rejects empty string', () => {
    const r = validateBaseUrl('')
    expect(r.valid).toBe(false)
    expect(r.error).toContain('empty')
  })

  it('rejects whitespace-only string', () => {
    const r = validateBaseUrl('   ')
    expect(r.valid).toBe(false)
    expect(r.error).toContain('empty')
  })

  it('rejects malformed URL', () => {
    const r = validateBaseUrl('not a url')
    expect(r.valid).toBe(false)
    expect(r.error).toContain('not a valid URL')
  })

  it('rejects embedded username', () => {
    const r = validateBaseUrl('https://admin@scout.example.com')
    expect(r.valid).toBe(false)
    expect(r.error).toContain('embedded credentials')
  })

  it('rejects embedded username and password', () => {
    const r = validateBaseUrl('https://admin:secret@scout.example.com')
    expect(r.valid).toBe(false)
    expect(r.error).toContain('embedded credentials')
  })

  it('rejects query string', () => {
    const r = validateBaseUrl('https://scout.example.com?key=abc')
    expect(r.valid).toBe(false)
    expect(r.error).toContain('query string')
  })

  it('rejects fragment', () => {
    const r = validateBaseUrl('https://scout.example.com#section')
    expect(r.valid).toBe(false)
    expect(r.error).toContain('fragment')
  })

  it('rejects FTP protocol', () => {
    const r = validateBaseUrl('ftp://files.example.com')
    expect(r.valid).toBe(false)
    expect(r.error).toContain('Unsupported protocol')
  })

  it('rejects file:// protocol', () => {
    const r = validateBaseUrl('file:///etc/passwd')
    expect(r.valid).toBe(false)
    expect(r.error).toContain('Unsupported protocol')
  })

  it('rejects javascript: protocol', () => {
    // URL constructor may throw or parse oddly — either way it should not pass
    const r = validateBaseUrl('javascript:alert(1)')
    expect(r.valid).toBe(false)
  })

  it('trims surrounding whitespace', () => {
    const r = validateBaseUrl('  https://scout.example.com  ')
    expect(r.valid).toBe(true)
    expect(r.sanitised).toBe('https://scout.example.com')
  })

  it('rejects data: URIs', () => {
    const r = validateBaseUrl('data:text/html,<h1>hi</h1>')
    expect(r.valid).toBe(false)
  })
})
