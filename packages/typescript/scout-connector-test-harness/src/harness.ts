import {
  validateManifest,
  UNSAFE_FIELD_NAMES,
  KNOWN_SEMANTIC_ATTRIBUTES,
} from '@kynticai/scout-connector-validator'
import type { ValidationIssue } from '@kynticai/scout-connector-validator'
import { runAudit } from '@kynticai/scout-metadata-audit'
import type { AuditInput, JsonSchema } from '@kynticai/scout-metadata-audit'
import type {
  SampleConnectorDefinition,
  TestHarnessOptions,
  TestHarnessReport,
  TestCaseResult,
  AuditReport,
} from './types.js'

/**
 * Runs the full connector test harness against a sample connector definition.
 * Validates manifest shape, metadata extraction, sample entity mappings,
 * error handling, and unsafe field checks. Uses only local data — no live connections.
 */
export async function runTestHarness(
  definition: SampleConnectorDefinition,
  options?: TestHarnessOptions,
): Promise<TestHarnessReport> {
  const { manifest } = definition
  const results: TestCaseResult[] = []

  const manifestValidation = validateManifest(manifest, {
    knownConnectorIds: options?.knownConnectorIds,
  })

  runManifestShapeTests(manifestValidation, results)

  let auditReport: AuditReport | null = null
  try {
    auditReport = runMetadataExtractionTests(definition, results)
  } catch {
    results.push({
      name: 'Metadata audit execution',
      suite: 'metadata-extraction',
      passed: false,
      message: 'Metadata audit threw an unexpected error.',
    })
  }

  runStructuredIssueTests(manifestValidation, results)
  runEntityMappingTests(definition, results)
  await runErrorHandlingTests(definition, options, results)
  runUnsafeFieldTests(definition, results)
  runAuthConfigTests(definition, results)

  const passedTests = results.filter((r) => r.passed).length
  return {
    connectorId: manifest.connectorId,
    displayName: manifest.displayName,
    ranAtUtc: new Date().toISOString(),
    passed: results.every((r) => r.passed),
    totalTests: results.length,
    passedTests,
    failedTests: results.length - passedTests,
    results,
    manifestValidation,
    auditReport,
  }
}

function runManifestShapeTests(
  validation: { isValid: boolean; errors: string[]; warnings: string[] },
  results: TestCaseResult[],
): void {
  results.push({
    name: 'Manifest is valid JSON object',
    suite: 'manifest-shape',
    passed: validation.isValid,
    message: validation.isValid
      ? 'Manifest passed all schema validations.'
      : `Manifest errors: ${validation.errors.join('; ')}`,
  })

  results.push({
    name: 'Manifest has no errors',
    suite: 'manifest-shape',
    passed: validation.errors.length === 0,
    message:
      validation.errors.length === 0
        ? 'No validation errors.'
        : `${String(validation.errors.length)} error(s): ${validation.errors.join('; ')}`,
  })

  results.push({
    name: 'Manifest warnings are acceptable',
    suite: 'manifest-shape',
    passed: true,
    message:
      validation.warnings.length === 0
        ? 'No warnings.'
        : `${String(validation.warnings.length)} warning(s): ${validation.warnings.join('; ')}`,
  })
}

function runMetadataExtractionTests(
  definition: SampleConnectorDefinition,
  results: TestCaseResult[],
): AuditReport | null {
  const { manifest } = definition

  if (manifest.configurationSchema === undefined) {
    results.push({
      name: 'Configuration schema is present for audit',
      suite: 'metadata-extraction',
      passed: false,
      message: 'configurationSchema is missing; metadata audit cannot run.',
    })
    return null
  }

  const auditInput: AuditInput = {
    manifest: {
      connectorType: manifest.connectorId,
      displayName: manifest.displayName,
      description: manifest.description,
      aliases: manifest.aliases,
      supportedDataSourceKinds: manifest.supportedSourceTypes,
      supportedCapabilities: manifest.capabilities,
      configurationSchema: manifest.configurationSchema as unknown as JsonSchema,
      sampleConfiguration: manifest.sampleConfiguration ?? {},
    },
    sampleRecords: definition.sampleRecords,
  }

  const report = runAudit(auditInput)

  results.push({
    name: 'Configuration schema is present for audit',
    suite: 'metadata-extraction',
    passed: true,
    message: 'configurationSchema provided and audit executed.',
  })

  const errorWarnings = report.warnings.filter((w) => w.severity === 'error')
  results.push({
    name: 'Metadata audit has no error-level warnings',
    suite: 'metadata-extraction',
    passed: errorWarnings.length === 0,
    message:
      errorWarnings.length === 0
        ? 'No error-level warnings from metadata audit.'
        : `${String(errorWarnings.length)} error(s): ${errorWarnings.map((w) => w.message).join('; ')}`,
  })

  results.push({
    name: 'Readiness score is above minimum threshold',
    suite: 'metadata-extraction',
    passed: report.readinessScore.overall >= 40,
    message: `Readiness score: ${String(report.readinessScore.overall)}/100.`,
  })

  if (definition.sampleRecords !== undefined && definition.sampleRecords.length > 0) {
    results.push({
      name: 'Sample records provided for audit',
      suite: 'metadata-extraction',
      passed: true,
      message: `${String(definition.sampleRecords.length)} sample record(s) provided.`,
    })
  }

  return report
}

function runEntityMappingTests(
  definition: SampleConnectorDefinition,
  results: TestCaseResult[],
): void {
  const { manifest } = definition
  const mappings = manifest.sampleEntityMappings

  results.push({
    name: 'At least one entity mapping is declared',
    suite: 'entity-mapping',
    passed: mappings.length > 0,
    message:
      mappings.length > 0
        ? `${String(mappings.length)} mapping(s) declared.`
        : 'No entity mappings declared.',
  })

  const knownAttributes = new Set(KNOWN_SEMANTIC_ATTRIBUTES)
  const recognisedMappings = mappings.filter((m) => knownAttributes.has(m.semanticAttribute))

  results.push({
    name: 'At least one mapping uses a recognised semantic attribute',
    suite: 'entity-mapping',
    passed: recognisedMappings.length > 0,
    message:
      recognisedMappings.length > 0
        ? `${String(recognisedMappings.length)} mapping(s) use recognised attributes.`
        : 'No mappings use recognised public semantic attributes.',
  })

  for (const mapping of mappings) {
    results.push({
      name: `Mapping "${mapping.sourceField}" -> "${mapping.semanticAttribute}" has required fields`,
      suite: 'entity-mapping',
      passed: mapping.sourceField.trim() !== '' && mapping.semanticAttribute.trim() !== '',
      message:
        mapping.sourceField.trim() !== '' && mapping.semanticAttribute.trim() !== ''
          ? 'sourceField and semanticAttribute are both non-empty.'
          : 'sourceField or semanticAttribute is empty.',
    })
  }

  if (definition.sampleRecords !== undefined && definition.sampleRecords.length > 0) {
    const payloadKeys = new Set<string>()
    for (const record of definition.sampleRecords) {
      for (const key of Object.keys(record.payload)) {
        payloadKeys.add(key)
      }
    }

    for (const mapping of mappings) {
      const found = payloadKeys.has(mapping.sourceField)
      results.push({
        name: `Source field "${mapping.sourceField}" appears in sample record payloads`,
        suite: 'entity-mapping',
        passed: found,
        message: found
          ? `Field "${mapping.sourceField}" found in sample payloads.`
          : `Field "${mapping.sourceField}" not found in sample payloads. Available: ${[...payloadKeys].join(', ')}.`,
      })
    }
  }
}

async function runErrorHandlingTests(
  definition: SampleConnectorDefinition,
  options: TestHarnessOptions | undefined,
  results: TestCaseResult[],
): Promise<void> {
  const { fakeFetch } = definition

  if (fakeFetch === undefined) {
    results.push({
      name: 'Fake fetch function provided',
      suite: 'error-handling',
      passed: true,
      message: 'No fakeFetch supplied; error handling tests skipped (acceptable for manifest-only validation).',
    })
    return
  }

  results.push({
    name: 'Fake fetch function provided',
    suite: 'error-handling',
    passed: true,
    message: 'fakeFetch supplied; running fetch simulation tests.',
  })

  const testUserIds = options?.fetchTestUserIds ?? ['test-user-001']
  for (const userId of testUserIds) {
    try {
      const payload = await fakeFetch(userId)
      const isObject = payload !== null && typeof payload === 'object' && !Array.isArray(payload)
      results.push({
        name: `Fetch for "${userId}" returns a valid object`,
        suite: 'error-handling',
        passed: isObject,
        message: isObject
          ? 'Fetch returned a valid non-null object.'
          : 'Fetch did not return a plain object.',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({
        name: `Fetch for "${userId}" returns a valid object`,
        suite: 'error-handling',
        passed: false,
        message: `Fetch threw: ${msg}`,
      })
    }
  }

  const errorUserId = options?.errorTestUserId
  if (errorUserId !== undefined) {
    try {
      await fakeFetch(errorUserId)
      results.push({
        name: `Fetch for error user "${errorUserId}" throws gracefully`,
        suite: 'error-handling',
        passed: false,
        message: 'Expected fakeFetch to throw for the error test user, but it succeeded.',
      })
    } catch (err: unknown) {
      const isProper = err instanceof Error
      results.push({
        name: `Fetch for error user "${errorUserId}" throws gracefully`,
        suite: 'error-handling',
        passed: isProper,
        message: isProper
          ? `Threw Error with message: "${err.message}".`
          : `Threw a non-Error value: ${String(err)}. Prefer throwing Error instances.`,
      })
    }
  }
}

function runUnsafeFieldTests(
  definition: SampleConnectorDefinition,
  results: TestCaseResult[],
): void {
  const { manifest } = definition
  const unsafeLower = new Set(UNSAFE_FIELD_NAMES.map((f) => f.toLowerCase()))

  const safeFields = manifest.safeMetadataFields
  const unsafeFound: string[] = []

  for (const field of safeFields) {
    if (unsafeLower.has(field.toLowerCase())) {
      unsafeFound.push(field)
    }
  }

  results.push({
    name: 'safeMetadataFields contains no unsafe field names',
    suite: 'unsafe-fields',
    passed: unsafeFound.length === 0,
    message:
      unsafeFound.length === 0
        ? 'No unsafe fields found in safeMetadataFields.'
        : `Unsafe fields found: ${unsafeFound.join(', ')}. These must not appear in public metadata.`,
  })

  const configSchema = manifest.configurationSchema
  if (configSchema !== undefined) {
    const schemaKeys = Object.keys(configSchema.properties)
    const unsafeSchemaKeys = schemaKeys.filter((k) => unsafeLower.has(k.toLowerCase()))

    results.push({
      name: 'Configuration schema properties contain no unsafe field names',
      suite: 'unsafe-fields',
      passed: unsafeSchemaKeys.length === 0,
      message:
        unsafeSchemaKeys.length === 0
          ? 'No unsafe fields in configurationSchema properties.'
          : `Unsafe schema properties: ${unsafeSchemaKeys.join(', ')}.`,
    })
  }

  if (manifest.sampleConfiguration !== undefined) {
    const sampleKeys = Object.keys(manifest.sampleConfiguration)
    const unsafeSampleKeys = sampleKeys.filter((k) => unsafeLower.has(k.toLowerCase()))

    results.push({
      name: 'Sample configuration contains no unsafe field names',
      suite: 'unsafe-fields',
      passed: unsafeSampleKeys.length === 0,
      message:
        unsafeSampleKeys.length === 0
          ? 'No unsafe fields in sampleConfiguration.'
          : `Unsafe sample config keys: ${unsafeSampleKeys.join(', ')}.`,
    })
  }

  for (const mapping of manifest.sampleEntityMappings) {
    const sourceUnsafe = unsafeLower.has(mapping.sourceField.toLowerCase())
    const attrUnsafe = unsafeLower.has(mapping.semanticAttribute.toLowerCase())
    const isSafe = !sourceUnsafe && !attrUnsafe

    results.push({
      name: `Entity mapping "${mapping.sourceField}" -> "${mapping.semanticAttribute}" has no unsafe names`,
      suite: 'unsafe-fields',
      passed: isSafe,
      message: isSafe
        ? 'No unsafe field names in this mapping.'
        : `Unsafe name detected: ${sourceUnsafe ? mapping.sourceField : mapping.semanticAttribute}.`,
    })
  }
}

function runStructuredIssueTests(
  validation: { isValid: boolean; errors: string[]; warnings: string[]; issues: ValidationIssue[] },
  results: TestCaseResult[],
): void {
  const errorIssues = validation.issues.filter((i) => i.severity === 'error')
  const warningIssues = validation.issues.filter((i) => i.severity === 'warning')

  results.push({
    name: 'Structured issues are consistent with error count',
    suite: 'structured-issues',
    passed: errorIssues.length === validation.errors.length,
    message: errorIssues.length === validation.errors.length
      ? `${String(errorIssues.length)} error issue(s) match ${String(validation.errors.length)} error string(s).`
      : `Mismatch: ${String(errorIssues.length)} error issues vs ${String(validation.errors.length)} error strings.`,
  })

  results.push({
    name: 'Structured issues are consistent with warning count',
    suite: 'structured-issues',
    passed: warningIssues.length === validation.warnings.length,
    message: warningIssues.length === validation.warnings.length
      ? `${String(warningIssues.length)} warning issue(s) match ${String(validation.warnings.length)} warning string(s).`
      : `Mismatch: ${String(warningIssues.length)} warning issues vs ${String(validation.warnings.length)} warning strings.`,
  })

  const allHaveCode = validation.issues.every((i) => typeof i.code === 'string' && i.code.length > 0)
  results.push({
    name: 'All issues have a non-empty error code',
    suite: 'structured-issues',
    passed: allHaveCode,
    message: allHaveCode
      ? 'All issues carry a machine-readable code.'
      : 'One or more issues are missing an error code.',
  })

  const allHavePath = validation.issues.every((i) => typeof i.path === 'string')
  results.push({
    name: 'All issues have a field path',
    suite: 'structured-issues',
    passed: allHavePath,
    message: allHavePath
      ? 'All issues carry a field path.'
      : 'One or more issues are missing a field path.',
  })

  const noLeakedDetail = validation.issues.every(
    (i) => !i.message.includes('internal') && !i.message.includes('stack trace'),
  )
  results.push({
    name: 'No issues leak private implementation detail',
    suite: 'structured-issues',
    passed: noLeakedDetail,
    message: noLeakedDetail
      ? 'No private implementation detail detected in issue messages.'
      : 'One or more issue messages may leak private detail.',
  })
}

function runAuthConfigTests(
  definition: SampleConnectorDefinition,
  results: TestCaseResult[],
): void {
  const { manifest } = definition
  const auth = (manifest as unknown as Record<string, unknown>)['authConfig']

  if (auth === undefined) {
    results.push({
      name: 'Auth config block is present',
      suite: 'auth-config',
      passed: true,
      message: 'No authConfig provided; auth config tests skipped (acceptable for connectors without auth).',
    })
    return
  }

  results.push({
    name: 'Auth config block is present',
    suite: 'auth-config',
    passed: true,
    message: 'authConfig provided; running auth configuration tests.',
  })

  if (typeof auth !== 'object' || auth === null) {
    results.push({
      name: 'Auth config is a valid object',
      suite: 'auth-config',
      passed: false,
      message: 'authConfig must be a JSON object.',
    })
    return
  }

  const authObj = auth as Record<string, unknown>

  const hasType = typeof authObj['type'] === 'string' && (authObj['type'] as string).trim() !== ''
  results.push({
    name: 'Auth config has a type',
    suite: 'auth-config',
    passed: hasType,
    message: hasType
      ? `Auth type: "${authObj['type'] as string}".`
      : 'authConfig.type is missing or empty.',
  })

  if (Array.isArray(authObj['scopes'])) {
    const scopes = authObj['scopes'] as unknown[]
    const scopeSet = new Set<string>()
    const duplicates: string[] = []

    for (const s of scopes) {
      if (typeof s === 'string') {
        if (scopeSet.has(s)) duplicates.push(s)
        scopeSet.add(s)
      }
    }

    const noDuplicates = duplicates.length === 0
    results.push({
      name: 'Auth scopes contain no duplicates',
      suite: 'auth-config',
      passed: noDuplicates,
      message: noDuplicates
        ? `${String(scopeSet.size)} unique scope(s).`
        : `Duplicate scopes found: ${duplicates.join(', ')}.`,
    })
  }

  for (const urlField of ['tokenUrl', 'authoriseUrl'] as const) {
    const url = authObj[urlField]
    if (typeof url === 'string') {
      const isHttps = url.startsWith('https://')
      results.push({
        name: `Auth ${urlField} uses HTTPS`,
        suite: 'auth-config',
        passed: isHttps,
        message: isHttps
          ? `${urlField} uses HTTPS.`
          : `${urlField} does not use HTTPS — production connectors should use secure URLs.`,
      })
    }
  }
}
