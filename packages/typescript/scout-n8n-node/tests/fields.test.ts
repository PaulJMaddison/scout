import { describe, it, expect } from 'vitest'
import { validateMappingField, validateMappingFields } from '../src/validation/fields.js'

describe('validateMappingField', () => {
  it('accepts a normal business field', () => {
    expect(validateMappingField('dealStage').valid).toBe(true)
  })

  it('accepts dotted notation', () => {
    expect(validateMappingField('contact.firstName').valid).toBe(true)
  })

  it('accepts underscored field', () => {
    expect(validateMappingField('adoption_score').valid).toBe(true)
  })

  it('accepts leading underscore', () => {
    expect(validateMappingField('_internalId').valid).toBe(true)
  })

  it('rejects empty field name', () => {
    const r = validateMappingField('')
    expect(r.valid).toBe(false)
    expect(r.error).toContain('empty')
  })

  it('rejects field starting with a digit', () => {
    const r = validateMappingField('1field')
    expect(r.valid).toBe(false)
  })

  // Credential/secret field rejections
  const secretFields = [
    'api_key', 'apiKey', 'API_KEY',
    'api_secret', 'apiSecret',
    'access_token', 'accessToken',
    'auth_token', 'authToken',
    'bearer_token', 'bearerToken',
    'client_secret', 'clientSecret',
    'private_key', 'privateKey',
    'secret_key', 'secretKey',
    'session_token', 'sessionToken',
    'refresh_token', 'refreshToken',
    'password', 'Password', 'PASSWORD',
    'passwd',
    'credential', 'credentials',
    'token', 'Token',
    'secret', 'Secret',
    'cookie', 'Cookie',
    'authorization', 'Authorization',
    'x_api_key',
    'x_auth_token',
    'connection_string', 'connectionString',
    'database_password', 'db_password',
    'encryption_key', 'signing_key',
    'ssh_key', 'ssl_cert', 'ssl_key',
  ]

  for (const field of secretFields) {
    it(`rejects secret-like field "${field}"`, () => {
      const r = validateMappingField(field)
      expect(r.valid).toBe(false)
      expect(r.error).toContain('credential or secret')
    })
  }

  it('accepts a field that merely contains "key" as a substring', () => {
    expect(validateMappingField('keyboard_layout').valid).toBe(true)
  })

  it('accepts a field that merely contains "token" as a substring', () => {
    expect(validateMappingField('tokenisation_method').valid).toBe(true)
  })

  it('rejects hyphenated secret-like fields via format check', () => {
    expect(validateMappingField('x-api-key').valid).toBe(false)
    expect(validateMappingField('x-auth-token').valid).toBe(false)
  })
})

describe('validateMappingFields', () => {
  it('accepts an array of valid fields', () => {
    const r = validateMappingFields(['dealStage', 'contact.name', 'revenue'])
    expect(r.valid).toBe(true)
  })

  it('rejects if any field is a secret', () => {
    const r = validateMappingFields(['dealStage', 'api_key', 'revenue'])
    expect(r.valid).toBe(false)
    expect(r.error).toContain('api_key')
  })

  it('accepts an empty array', () => {
    expect(validateMappingFields([]).valid).toBe(true)
  })
})
