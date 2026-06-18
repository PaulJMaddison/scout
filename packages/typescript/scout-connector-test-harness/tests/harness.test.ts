import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runTestHarness } from '../src/harness.js'
import type {
  SampleConnectorDefinition,
  TestHarnessOptions,
  TestCaseResult,
} from '../src/types.js'

const currentDir = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(currentDir, '..', 'data')
const samplePath = resolve(dataDir, 'sample-connector.json')

function loadFixtureDefinition(name: string): SampleConnectorDefinition {
  return JSON.parse(readFileSync(resolve(dataDir, name), 'utf-8')) as SampleConnectorDefinition
}

function loadSampleDefinition(): SampleConnectorDefinition {
  return JSON.parse(readFileSync(samplePath, 'utf-8')) as SampleConnectorDefinition
}

function validDefinition(
  overrides?: Partial<SampleConnectorDefinition>,
): SampleConnectorDefinition {
  const base = loadSampleDefinition()
  return { ...base, ...overrides }
}

function findResult(results: TestCaseResult[], nameFragment: string): TestCaseResult | undefined {
  return results.find((r) => r.name.includes(nameFragment))
}

// ---------------------------------------------------------------------------
// Valid connector — full pass
// ---------------------------------------------------------------------------

describe('valid sample connector', () => {
  it('passes all tests for the bundled sample connector', async () => {
    const definition = loadSampleDefinition()
    const report = await runTestHarness(definition)
    expect(report.passed).toBe(true)
    expect(report.failedTests).toBe(0)
    expect(report.connectorId).toBe('sampleCrm')
    expect(report.displayName).toBe('Sample CRM Connector')
  })

  it('returns a non-null audit report', async () => {
    const definition = loadSampleDefinition()
    const report = await runTestHarness(definition)
    expect(report.auditReport).not.toBeNull()
    expect(report.auditReport?.connectorType).toBe('sampleCrm')
  })

  it('includes manifest validation result', async () => {
    const definition = loadSampleDefinition()
    const report = await runTestHarness(definition)
    expect(report.manifestValidation.isValid).toBe(true)
    expect(report.manifestValidation.errors).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Local package build contract
// ---------------------------------------------------------------------------

describe('package build contract', () => {
  it('builds local validator and audit dependencies before compiling', () => {
    const packageJson = JSON.parse(readFileSync(resolve(currentDir, '..', 'package.json'), 'utf-8')) as {
      scripts?: Record<string, string>
    }

    expect(packageJson.scripts?.['prebuild']).toContain('../scout-connector-validator')
    expect(packageJson.scripts?.['prebuild']).toContain('../scout-metadata-audit')
  })
})

// ---------------------------------------------------------------------------
// Manifest shape validation
// ---------------------------------------------------------------------------

describe('manifest shape tests', () => {
  it('fails when connectorId is missing', async () => {
    const def = validDefinition()
    const manifest = { ...def.manifest } as Record<string, unknown>
    delete manifest['connectorId']
    def.manifest = manifest as typeof def.manifest
    const report = await runTestHarness(def)
    expect(report.passed).toBe(false)
    const result = findResult(report.results, 'Manifest is valid')
    expect(result?.passed).toBe(false)
  })

  it('fails when version is invalid', async () => {
    const def = validDefinition()
    def.manifest = { ...def.manifest, version: 'bad' }
    const report = await runTestHarness(def)
    expect(report.passed).toBe(false)
  })

  it('fails when supportedSourceTypes is empty', async () => {
    const def = validDefinition()
    def.manifest = { ...def.manifest, supportedSourceTypes: [] }
    const report = await runTestHarness(def)
    expect(report.passed).toBe(false)
  })

  it('fails when requiredConfigFields is empty', async () => {
    const def = validDefinition()
    def.manifest = { ...def.manifest, requiredConfigFields: [] }
    const report = await runTestHarness(def)
    expect(report.passed).toBe(false)
  })

  it('fails when sampleEntityMappings is empty', async () => {
    const def = validDefinition()
    def.manifest = { ...def.manifest, sampleEntityMappings: [] }
    const report = await runTestHarness(def)
    expect(report.passed).toBe(false)
  })

  it('reports warnings as non-failures', async () => {
    const def = validDefinition()
    def.manifest = {
      ...def.manifest,
      supportedSourceTypes: ['CustomKind'],
    }
    const report = await runTestHarness(def)
    const warningResult = findResult(report.results, 'warnings are acceptable')
    expect(warningResult?.passed).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Metadata extraction
// ---------------------------------------------------------------------------

describe('metadata extraction tests', () => {
  it('produces audit report with field classifications', async () => {
    const def = validDefinition()
    const report = await runTestHarness(def)
    expect(report.auditReport).not.toBeNull()
    expect(report.auditReport!.fieldClassifications.length).toBeGreaterThan(0)
  })

  it('fails when configurationSchema is missing', async () => {
    const def = validDefinition()
    def.manifest = { ...def.manifest, configurationSchema: undefined }
    const report = await runTestHarness(def)
    const result = findResult(report.results, 'Configuration schema is present')
    expect(result?.passed).toBe(false)
  })

  it('includes readiness score check', async () => {
    const def = validDefinition()
    const report = await runTestHarness(def)
    const result = findResult(report.results, 'Readiness score')
    expect(result).toBeDefined()
    expect(result?.suite).toBe('metadata-extraction')
  })

  it('acknowledges sample records when provided', async () => {
    const def = validDefinition()
    const report = await runTestHarness(def)
    const result = findResult(report.results, 'Sample records provided')
    expect(result?.passed).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Entity mapping
// ---------------------------------------------------------------------------

describe('entity mapping tests', () => {
  it('validates at least one recognised semantic attribute', async () => {
    const def = validDefinition()
    const report = await runTestHarness(def)
    const result = findResult(report.results, 'recognised semantic attribute')
    expect(result?.passed).toBe(true)
  })

  it('checks source fields against sample record payloads', async () => {
    const def = validDefinition()
    const report = await runTestHarness(def)
    const result = findResult(report.results, 'deal_probability')
    expect(result?.passed).toBe(true)
  })

  it('fails when source field is not in sample payloads', async () => {
    const def = validDefinition()
    def.manifest = {
      ...def.manifest,
      sampleEntityMappings: [
        {
          sourceField: 'nonExistentField',
          semanticAttribute: 'conversionProbability',
          description: 'Mapping to a missing field.',
        },
      ],
    }
    const report = await runTestHarness(def)
    const result = findResult(report.results, '"nonExistentField" appears in sample')
    expect(result?.passed).toBe(false)
  })

  it('fails when mapping has empty sourceField', async () => {
    const def = validDefinition()
    def.manifest = {
      ...def.manifest,
      sampleEntityMappings: [
        {
          sourceField: '',
          semanticAttribute: 'conversionProbability',
        },
      ],
    }
    const report = await runTestHarness(def)
    const failedMappings = report.results.filter(
      (r) => r.suite === 'entity-mapping' && !r.passed,
    )
    expect(failedMappings.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Error handling (fake fetch)
// ---------------------------------------------------------------------------

describe('error handling tests', () => {
  it('skips gracefully when no fakeFetch is provided', async () => {
    const def = validDefinition()
    delete def.fakeFetch
    const report = await runTestHarness(def)
    const result = findResult(report.results, 'Fake fetch function provided')
    expect(result?.passed).toBe(true)
    expect(result?.message).toContain('skipped')
  })

  it('passes when fakeFetch returns a valid object', async () => {
    const def = validDefinition()
    def.fakeFetch = (_userId: string) => ({ status: 'active', score: 85 })
    const report = await runTestHarness(def, { fetchTestUserIds: ['user-001'] })
    const result = findResult(report.results, 'Fetch for "user-001"')
    expect(result?.passed).toBe(true)
  })

  it('fails when fakeFetch throws unexpectedly', async () => {
    const def = validDefinition()
    def.fakeFetch = (_userId: string) => {
      throw new Error('Connection refused')
    }
    const report = await runTestHarness(def, { fetchTestUserIds: ['user-001'] })
    const result = findResult(report.results, 'Fetch for "user-001"')
    expect(result?.passed).toBe(false)
    expect(result?.message).toContain('Connection refused')
  })

  it('validates error user throws an Error instance', async () => {
    const def = validDefinition()
    def.fakeFetch = (userId: string) => {
      if (userId === 'bad-user') throw new Error('User not found')
      return { status: 'active' }
    }
    const report = await runTestHarness(def, {
      fetchTestUserIds: ['user-001'],
      errorTestUserId: 'bad-user',
    })
    const errorResult = findResult(report.results, 'error user')
    expect(errorResult?.passed).toBe(true)
    expect(errorResult?.message).toContain('User not found')
  })

  it('warns when error user throws a non-Error value', async () => {
    const def = validDefinition()
    def.fakeFetch = (userId: string) => {
      if (userId === 'bad-user') throw 'string error'
      return { status: 'active' }
    }
    const report = await runTestHarness(def, {
      fetchTestUserIds: ['user-001'],
      errorTestUserId: 'bad-user',
    })
    const errorResult = findResult(report.results, 'error user')
    expect(errorResult?.passed).toBe(false)
    expect(errorResult?.message).toContain('non-Error')
  })

  it('fails when error user does not throw', async () => {
    const def = validDefinition()
    def.fakeFetch = (_userId: string) => ({ status: 'ok' })
    const report = await runTestHarness(def, {
      fetchTestUserIds: ['user-001'],
      errorTestUserId: 'bad-user',
    })
    const errorResult = findResult(report.results, 'error user')
    expect(errorResult?.passed).toBe(false)
    expect(errorResult?.message).toContain('Expected')
  })

  it('supports async fakeFetch', async () => {
    const def = validDefinition()
    def.fakeFetch = async (_userId: string) => {
      return Promise.resolve({ status: 'active', score: 90 })
    }
    const report = await runTestHarness(def, { fetchTestUserIds: ['user-001'] })
    const result = findResult(report.results, 'Fetch for "user-001"')
    expect(result?.passed).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Unsafe fields
// ---------------------------------------------------------------------------

describe('unsafe field tests', () => {
  it('passes when no unsafe fields are present', async () => {
    const def = validDefinition()
    const report = await runTestHarness(def)
    const results = report.results.filter((r) => r.suite === 'unsafe-fields')
    expect(results.every((r) => r.passed)).toBe(true)
  })

  it('fails when safeMetadataFields contains "password"', async () => {
    const def = validDefinition()
    def.manifest = {
      ...def.manifest,
      safeMetadataFields: ['connectorId', 'password'],
    }
    const report = await runTestHarness(def)
    const result = findResult(report.results, 'no unsafe field names')
    expect(result?.passed).toBe(false)
    expect(result?.message).toContain('password')
  })

  it('fails when safeMetadataFields contains "apiKey"', async () => {
    const def = validDefinition()
    def.manifest = {
      ...def.manifest,
      safeMetadataFields: ['connectorId', 'apiKey'],
    }
    const report = await runTestHarness(def)
    const result = findResult(report.results, 'no unsafe field names')
    expect(result?.passed).toBe(false)
    expect(result?.message).toContain('apiKey')
  })

  it('detects unsafe fields in configurationSchema properties', async () => {
    const def = validDefinition()
    def.manifest = {
      ...def.manifest,
      configurationSchema: {
        type: 'object' as const,
        required: ['endpoint'],
        properties: {
          endpoint: { type: 'string', description: 'API endpoint.' },
          password: { type: 'string', description: 'User password.' },
        },
      },
    }
    const report = await runTestHarness(def)
    const result = findResult(report.results, 'Configuration schema properties')
    expect(result?.passed).toBe(false)
    expect(result?.message).toContain('password')
  })

  it('detects unsafe field names in entity mapping sourceField', async () => {
    const def = validDefinition()
    def.manifest = {
      ...def.manifest,
      sampleEntityMappings: [
        {
          sourceField: 'apiSecret',
          semanticAttribute: 'conversionProbability',
          description: 'Bad mapping.',
        },
      ],
    }
    const report = await runTestHarness(def)
    const result = findResult(report.results, '"apiSecret" -> "conversionProbability" has no unsafe')
    expect(result?.passed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Known connector ID duplicate check
// ---------------------------------------------------------------------------

describe('duplicate connector ID check', () => {
  it('fails when connectorId conflicts with a known ID', async () => {
    const def = validDefinition()
    const report = await runTestHarness(def, {
      knownConnectorIds: ['sampleCrm'],
    })
    expect(report.passed).toBe(false)
    const result = findResult(report.results, 'Manifest has no errors')
    expect(result?.passed).toBe(false)
    expect(result?.message).toContain('conflicts')
  })
})

// ---------------------------------------------------------------------------
// Report shape
// ---------------------------------------------------------------------------

describe('report shape', () => {
  it('includes all expected top-level fields', async () => {
    const def = validDefinition()
    const report = await runTestHarness(def)
    expect(report.connectorId).toBeDefined()
    expect(report.displayName).toBeDefined()
    expect(report.ranAtUtc).toBeDefined()
    expect(typeof report.passed).toBe('boolean')
    expect(typeof report.totalTests).toBe('number')
    expect(typeof report.passedTests).toBe('number')
    expect(typeof report.failedTests).toBe('number')
    expect(Array.isArray(report.results)).toBe(true)
    expect(report.manifestValidation).toBeDefined()
  })

  it('every result has name, suite, passed, and message', async () => {
    const def = validDefinition()
    const report = await runTestHarness(def)
    for (const result of report.results) {
      expect(typeof result.name).toBe('string')
      expect(typeof result.suite).toBe('string')
      expect(typeof result.passed).toBe('boolean')
      expect(typeof result.message).toBe('string')
    }
  })

  it('covers all seven test suites', async () => {
    const def = validDefinition()
    def.fakeFetch = (_userId: string) => ({ status: 'ok' })
    const report = await runTestHarness(def, { fetchTestUserIds: ['user-001'] })
    const suites = new Set(report.results.map((r) => r.suite))
    expect(suites.has('manifest-shape')).toBe(true)
    expect(suites.has('structured-issues')).toBe(true)
    expect(suites.has('metadata-extraction')).toBe(true)
    expect(suites.has('entity-mapping')).toBe(true)
    expect(suites.has('error-handling')).toBe(true)
    expect(suites.has('unsafe-fields')).toBe(true)
    expect(suites.has('auth-config')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Structured issues suite
// ---------------------------------------------------------------------------

describe('structured issue tests', () => {
  it('validates that issues are consistent for a valid connector', async () => {
    const def = validDefinition()
    const report = await runTestHarness(def)
    const issueResults = report.results.filter((r) => r.suite === 'structured-issues')
    expect(issueResults.length).toBeGreaterThanOrEqual(4)
    expect(issueResults.every((r) => r.passed)).toBe(true)
  })

  it('validates issues are consistent for an invalid connector', async () => {
    const def = validDefinition()
    def.manifest = { ...def.manifest, version: 'bad' }
    const report = await runTestHarness(def)
    const issueResults = report.results.filter((r) => r.suite === 'structured-issues')
    expect(issueResults.every((r) => r.passed)).toBe(true)
  })

  it('detects no private detail leakage in issue messages', async () => {
    const def = validDefinition()
    const report = await runTestHarness(def)
    const leakResult = findResult(report.results, 'No issues leak private')
    expect(leakResult?.passed).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Auth config suite
// ---------------------------------------------------------------------------

describe('auth config tests', () => {
  it('skips gracefully when no authConfig is provided', async () => {
    const def = validDefinition()
    const report = await runTestHarness(def)
    const result = findResult(report.results, 'Auth config block is present')
    expect(result?.passed).toBe(true)
    expect(result?.message).toContain('skipped')
  })

  it('passes for a valid oauth2 authConfig', async () => {
    const def = validDefinition()
    const manifest = def.manifest as Record<string, unknown>
    manifest['authConfig'] = {
      type: 'oauth2',
      scopes: ['read', 'write'],
      tokenUrl: 'https://auth.example.com/token',
      authoriseUrl: 'https://auth.example.com/authorise',
    }
    const report = await runTestHarness(def)
    const authResults = report.results.filter((r) => r.suite === 'auth-config')
    expect(authResults.every((r) => r.passed)).toBe(true)
  })

  it('detects duplicate scopes', async () => {
    const def = validDefinition()
    const manifest = def.manifest as Record<string, unknown>
    manifest['authConfig'] = {
      type: 'oauth2',
      scopes: ['read', 'write', 'read'],
      tokenUrl: 'https://auth.example.com/token',
    }
    const report = await runTestHarness(def)
    const scopeResult = findResult(report.results, 'Auth scopes contain no duplicates')
    expect(scopeResult?.passed).toBe(false)
    expect(scopeResult?.message).toContain('read')
  })

  it('detects non-HTTPS tokenUrl', async () => {
    const def = validDefinition()
    const manifest = def.manifest as Record<string, unknown>
    manifest['authConfig'] = {
      type: 'oauth2',
      tokenUrl: 'http://insecure.example.com/token',
    }
    const report = await runTestHarness(def)
    const urlResult = findResult(report.results, 'tokenUrl uses HTTPS')
    expect(urlResult?.passed).toBe(false)
  })

  it('detects non-HTTPS authoriseUrl', async () => {
    const def = validDefinition()
    const manifest = def.manifest as Record<string, unknown>
    manifest['authConfig'] = {
      type: 'oauth2',
      authoriseUrl: 'http://insecure.example.com/auth',
    }
    const report = await runTestHarness(def)
    const urlResult = findResult(report.results, 'authoriseUrl uses HTTPS')
    expect(urlResult?.passed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Fixture: invalid-missing-id
// ---------------------------------------------------------------------------

describe('fixture: invalid-missing-id', () => {
  it('fails the harness for a manifest without connectorId', async () => {
    const def = loadFixtureDefinition('invalid-missing-id.json')
    const report = await runTestHarness(def)
    expect(report.passed).toBe(false)
    const result = findResult(report.results, 'Manifest is valid')
    expect(result?.passed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Fixture: invalid-auth-config
// ---------------------------------------------------------------------------

describe('fixture: invalid-auth-config', () => {
  it('detects invalid auth config in harness', async () => {
    const def = loadFixtureDefinition('invalid-auth-config.json')
    const report = await runTestHarness(def)
    const scopeResult = findResult(report.results, 'Auth scopes contain no duplicates')
    expect(scopeResult?.passed).toBe(false)
  })

  it('detects non-HTTPS authoriseUrl in fixture', async () => {
    const def = loadFixtureDefinition('invalid-auth-config.json')
    const report = await runTestHarness(def)
    const urlResult = findResult(report.results, 'authoriseUrl uses HTTPS')
    expect(urlResult?.passed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Fixture: invalid-duplicate-scopes
// ---------------------------------------------------------------------------

describe('fixture: invalid-duplicate-scopes', () => {
  it('still passes overall (duplicates are warnings)', async () => {
    const def = loadFixtureDefinition('invalid-duplicate-scopes.json')
    const report = await runTestHarness(def)
    expect(report.manifestValidation.warnings.length).toBeGreaterThan(0)
    expect(report.manifestValidation.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('Duplicate')]),
    )
  })
})

// ---------------------------------------------------------------------------
// Fixture: invalid-malformed-urls
// ---------------------------------------------------------------------------

describe('fixture: invalid-malformed-urls', () => {
  it('fails for http:// URL in sample configuration', async () => {
    const def = loadFixtureDefinition('invalid-malformed-urls.json')
    const report = await runTestHarness(def)
    expect(report.passed).toBe(false)
    const manifestResult = findResult(report.results, 'Manifest has no errors')
    expect(manifestResult?.passed).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Fixture: invalid-unsafe-defaults
// ---------------------------------------------------------------------------

describe('fixture: invalid-unsafe-defaults', () => {
  it('reports warnings for unsafe defaults', async () => {
    const def = loadFixtureDefinition('invalid-unsafe-defaults.json')
    const report = await runTestHarness(def)
    expect(report.manifestValidation.warnings.length).toBeGreaterThan(0)
    expect(report.manifestValidation.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('admin')]),
    )
  })
})

// ---------------------------------------------------------------------------
// Fixture: invalid-bad-metadata
// ---------------------------------------------------------------------------

describe('fixture: invalid-bad-metadata', () => {
  it('warns about credential-like config field name', async () => {
    const def = loadFixtureDefinition('invalid-bad-metadata.json')
    const report = await runTestHarness(def)
    expect(report.manifestValidation.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('password')]),
    )
  })
})
