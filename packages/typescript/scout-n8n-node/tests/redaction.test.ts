import { describe, it, expect } from 'vitest'
import { redactSensitiveKeys } from '../src/validation/redaction.js'

describe('redactSensitiveKeys', () => {
  it('redacts top-level sensitive keys', () => {
    const input = { name: 'Alice', apiKey: 'sk-1234', role: 'admin' }
    const result = redactSensitiveKeys(input) as Record<string, unknown>
    expect(result['name']).toBe('Alice')
    expect(result['apiKey']).toBe('[REDACTED]')
    expect(result['role']).toBe('admin')
  })

  it('redacts nested sensitive keys', () => {
    const input = {
      config: {
        host: 'db.example.com',
        password: 'hunter2',
        port: 5432,
      },
    }
    const result = redactSensitiveKeys(input) as Record<string, Record<string, unknown>>
    expect(result['config']!['host']).toBe('db.example.com')
    expect(result['config']!['password']).toBe('[REDACTED]')
    expect(result['config']!['port']).toBe(5432)
  })

  it('redacts sensitive keys inside arrays', () => {
    const input = {
      items: [
        { id: 1, secret: 'abc' },
        { id: 2, value: 'safe' },
      ],
    }
    const result = redactSensitiveKeys(input) as Record<string, Array<Record<string, unknown>>>
    expect(result['items']![0]!['secret']).toBe('[REDACTED]')
    expect(result['items']![1]!['value']).toBe('safe')
  })

  it('handles deeply nested structures', () => {
    const input = {
      a: { b: { c: { d: { bearer_token: 'xyz', data: 42 } } } },
    }
    const result = redactSensitiveKeys(input) as Record<string, unknown>
    const deep = (result as Record<string, Record<string, Record<string, Record<string, Record<string, unknown>>>>>)
      ['a']!['b']!['c']!['d']!
    expect(deep['bearer_token']).toBe('[REDACTED]')
    expect(deep['data']).toBe(42)
  })

  it('does not mutate the original object', () => {
    const input = { password: 'original' }
    redactSensitiveKeys(input)
    expect(input.password).toBe('original')
  })

  it('handles null and undefined', () => {
    expect(redactSensitiveKeys(null)).toBeNull()
    expect(redactSensitiveKeys(undefined)).toBeUndefined()
  })

  it('handles primitive values', () => {
    expect(redactSensitiveKeys('hello')).toBe('hello')
    expect(redactSensitiveKeys(42)).toBe(42)
    expect(redactSensitiveKeys(true)).toBe(true)
  })

  it('handles empty objects and arrays', () => {
    expect(redactSensitiveKeys({})).toEqual({})
    expect(redactSensitiveKeys([])).toEqual([])
  })

  it('redacts a comprehensive set of sensitive key names', () => {
    const input: Record<string, string> = {
      api_key: 'v1',
      access_token: 'v2',
      auth_token: 'v3',
      client_secret: 'v4',
      private_key: 'v5',
      refresh_token: 'v6',
      session_token: 'v7',
      authorization: 'v8',
      cookie: 'v9',
      connection_string: 'v10',
      ssh_key: 'v11',
      ssl_cert: 'v12',
      passphrase: 'v13',
      encryption_key: 'v14',
      signing_key: 'v15',
      safe_field: 'should_remain',
    }
    const result = redactSensitiveKeys(input) as Record<string, string>
    for (const [key, val] of Object.entries(result)) {
      if (key === 'safe_field') {
        expect(val).toBe('should_remain')
      } else {
        expect(val).toBe('[REDACTED]')
      }
    }
  })

  it('enforces max depth protection', () => {
    const input = { a: { b: { c: 'deep' } } }
    const result = redactSensitiveKeys(input, 1)
    expect(result).toEqual({ a: { b: '[REDACTED]' } })
  })
})
