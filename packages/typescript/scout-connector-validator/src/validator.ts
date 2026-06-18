import type {
  ConnectorManifest,
  ManifestValidationResult,
  ValidationIssue,
  ValidationErrorCode,
  ValidatorOptions,
} from './types.js'
import {
  KNOWN_SOURCE_TYPES,
  KNOWN_CAPABILITIES,
  KNOWN_SEMANTIC_ATTRIBUTES,
  UNSAFE_FIELD_NAMES,
  KNOWN_SCHEMA_TYPES,
  KNOWN_AUTH_TYPES,
  SEMVER_PATTERN,
  CONNECTOR_ID_PATTERN,
  HTTPS_URL_PATTERN,
  HTTP_URL_PATTERN,
  UNSAFE_DEFAULT_VALUES,
  UNSAFE_DEFAULT_PROPERTY_NAMES,
} from './schema.js'

// ── helpers ──────────────────────────────────────────────────────────────

function issue(
  code: ValidationErrorCode,
  path: string,
  message: string,
  severity: 'error' | 'warning',
): ValidationIssue {
  return { code, path, message, severity }
}

function addError(
  issues: ValidationIssue[],
  errors: string[],
  code: ValidationErrorCode,
  path: string,
  message: string,
): void {
  issues.push(issue(code, path, message, 'error'))
  errors.push(message)
}

function addWarning(
  issues: ValidationIssue[],
  warnings: string[],
  code: ValidationErrorCode,
  path: string,
  message: string,
): void {
  issues.push(issue(code, path, message, 'warning'))
  warnings.push(message)
}

// ── public entry point ───────────────────────────────────────────────────

/**
 * Validates a connector manifest against the public KynticAI Scout schema.
 * Returns errors for hard failures and warnings for non-blocking issues.
 * The `issues` array provides structured, machine-readable diagnostics.
 */
export function validateManifest(
  manifest: unknown,
  options?: ValidatorOptions,
): ManifestValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const issues: ValidationIssue[] = []

  if (manifest === null || manifest === undefined || typeof manifest !== 'object') {
    const msg = 'Manifest must be a non-null JSON object.'
    return {
      isValid: false,
      errors: [msg],
      warnings,
      issues: [issue('INVALID_MANIFEST_SHAPE', '', msg, 'error')],
    }
  }

  const obj = manifest as Record<string, unknown>

  validateConnectorId(obj, errors, warnings, issues, options)
  validateDisplayName(obj, errors, issues)
  validateVersion(obj, errors, issues)
  validateDescription(obj, errors, issues)
  validateSupportedSourceTypes(obj, errors, warnings, issues)
  validateRequiredConfigFields(obj, errors, warnings, issues)
  validateSafeMetadataFields(obj, errors, warnings, issues)
  validateSampleEntityMappings(obj, errors, warnings, issues)
  validateAliases(obj, errors, warnings, issues)
  validateCapabilities(obj, warnings, issues)
  validateConfigurationSchema(obj, errors, warnings, issues)
  validateSampleConfiguration(obj, errors, issues)
  validateAuthConfig(obj, errors, warnings, issues)
  validateEventShape(obj, errors, issues)

  return { isValid: errors.length === 0, errors, warnings, issues }
}

// ── field validators ─────────────────────────────────────────────────────

function validateConnectorId(
  obj: Record<string, unknown>,
  errors: string[],
  _warnings: string[],
  issues: ValidationIssue[],
  options?: ValidatorOptions,
): void {
  const id = obj['connectorId']
  if (typeof id !== 'string' || id.trim() === '') {
    addError(issues, errors, 'MISSING_REQUIRED_FIELD', 'connectorId',
      'connectorId is required and must be a non-empty string.')
    return
  }

  if (!CONNECTOR_ID_PATTERN.test(id)) {
    addError(issues, errors, 'INVALID_FORMAT', 'connectorId',
      'connectorId must start with a lowercase letter and contain only alphanumeric characters (camelCase).')
  }

  if (options?.knownConnectorIds !== undefined) {
    const normalised = id.toLowerCase()
    const duplicates = options.knownConnectorIds.filter(
      (existing) => existing.toLowerCase() === normalised,
    )
    if (duplicates.length > 0) {
      addError(issues, errors, 'DUPLICATE_ENTRY', 'connectorId',
        `connectorId '${id}' conflicts with existing connector(s): ${duplicates.join(', ')}.`)
    }
  }
}

function validateDisplayName(
  obj: Record<string, unknown>,
  errors: string[],
  issues: ValidationIssue[],
): void {
  if (typeof obj['displayName'] !== 'string' || (obj['displayName'] as string).trim() === '') {
    addError(issues, errors, 'MISSING_REQUIRED_FIELD', 'displayName',
      'displayName is required and must be a non-empty string.')
  }
}

function validateVersion(
  obj: Record<string, unknown>,
  errors: string[],
  issues: ValidationIssue[],
): void {
  const version = obj['version']
  if (typeof version !== 'string' || version.trim() === '') {
    addError(issues, errors, 'MISSING_REQUIRED_FIELD', 'version',
      'version is required and must be a non-empty string.')
    return
  }

  if (!SEMVER_PATTERN.test(version)) {
    addError(issues, errors, 'INVALID_FORMAT', 'version',
      'version must follow semantic versioning (MAJOR.MINOR.PATCH).')
  }
}

function validateDescription(
  obj: Record<string, unknown>,
  errors: string[],
  issues: ValidationIssue[],
): void {
  if (typeof obj['description'] !== 'string' || (obj['description'] as string).trim() === '') {
    addError(issues, errors, 'MISSING_REQUIRED_FIELD', 'description',
      'description is required and must be a non-empty string.')
  }
}

function validateSupportedSourceTypes(
  obj: Record<string, unknown>,
  errors: string[],
  warnings: string[],
  issues: ValidationIssue[],
): void {
  const types = obj['supportedSourceTypes']
  if (!Array.isArray(types) || types.length === 0) {
    addError(issues, errors, 'MISSING_REQUIRED_FIELD', 'supportedSourceTypes',
      'supportedSourceTypes must be a non-empty array.')
    return
  }

  const knownSet = new Set(KNOWN_SOURCE_TYPES)
  const seen = new Set<string>()

  for (let i = 0; i < types.length; i++) {
    const t = types[i]
    if (typeof t !== 'string') {
      addError(issues, errors, 'INVALID_FORMAT', `supportedSourceTypes[${String(i)}]`,
        'Each entry in supportedSourceTypes must be a string.')
    } else {
      if (seen.has(t)) {
        addWarning(issues, warnings, 'DUPLICATE_ENTRY', `supportedSourceTypes[${String(i)}]`,
          `Duplicate source type '${t}' in supportedSourceTypes.`)
      }
      seen.add(t)

      if (!knownSet.has(t)) {
        addWarning(issues, warnings, 'UNKNOWN_VALUE', `supportedSourceTypes[${String(i)}]`,
          `Source type '${t}' is not a recognised public kind. Known types: ${KNOWN_SOURCE_TYPES.join(', ')}.`)
      }
    }
  }
}

function validateRequiredConfigFields(
  obj: Record<string, unknown>,
  errors: string[],
  warnings: string[],
  issues: ValidationIssue[],
): void {
  const fields = obj['requiredConfigFields']
  if (!Array.isArray(fields) || fields.length === 0) {
    addError(issues, errors, 'MISSING_REQUIRED_FIELD', 'requiredConfigFields',
      'requiredConfigFields must be a non-empty array of field definitions.')
    return
  }

  const unsafeSet = new Set(UNSAFE_FIELD_NAMES.map((f) => f.toLowerCase()))

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i] as Record<string, unknown> | undefined
    const path = `requiredConfigFields[${String(i)}]`

    if (field === undefined || field === null || typeof field !== 'object') {
      addError(issues, errors, 'INVALID_FORMAT', path, `${path} must be an object.`)
      continue
    }

    if (typeof field['name'] !== 'string' || (field['name'] as string).trim() === '') {
      addError(issues, errors, 'MISSING_REQUIRED_FIELD', `${path}.name`,
        `${path}.name is required and must be a non-empty string.`)
    } else if (unsafeSet.has((field['name'] as string).toLowerCase())) {
      addWarning(issues, warnings, 'INVALID_AUTH_CONFIG', `${path}.name`,
        `${path}.name '${field['name'] as string}' resembles a credential field. ` +
        'Connector config should reference secure credential storage rather than accepting secrets directly.')
    }

    if (typeof field['type'] !== 'string' || (field['type'] as string).trim() === '') {
      addError(issues, errors, 'MISSING_REQUIRED_FIELD', `${path}.type`,
        `${path}.type is required and must be a non-empty string.`)
    } else {
      const knownTypes = new Set(KNOWN_SCHEMA_TYPES)
      if (!knownTypes.has(field['type'] as string)) {
        addError(issues, errors, 'UNKNOWN_VALUE', `${path}.type`,
          `${path}.type '${field['type'] as string}' is not a recognised JSON Schema type.`)
      }
    }

    if (typeof field['description'] !== 'string' || (field['description'] as string).trim() === '') {
      addError(issues, errors, 'MISSING_REQUIRED_FIELD', `${path}.description`,
        `${path}.description is required and must be a non-empty string.`)
    }
  }
}

function validateSafeMetadataFields(
  obj: Record<string, unknown>,
  errors: string[],
  warnings: string[],
  issues: ValidationIssue[],
): void {
  const fields = obj['safeMetadataFields']
  if (!Array.isArray(fields)) {
    addError(issues, errors, 'INVALID_FORMAT', 'safeMetadataFields',
      'safeMetadataFields must be an array.')
    return
  }

  const unsafeSet = new Set(UNSAFE_FIELD_NAMES.map((f) => f.toLowerCase()))
  const seen = new Set<string>()

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]
    const path = `safeMetadataFields[${String(i)}]`

    if (typeof field !== 'string' || field.trim() === '') {
      addError(issues, errors, 'INVALID_FORMAT', path,
        'Each entry in safeMetadataFields must be a non-empty string.')
      continue
    }

    if (unsafeSet.has(field.toLowerCase())) {
      addError(issues, errors, 'UNSAFE_FIELD_NAME', path,
        `safeMetadataFields contains unsafe field '${field}'. ` +
        'Credential, secret, and PII fields must not be exposed in public metadata.')
    }

    if (seen.has(field.toLowerCase())) {
      addWarning(issues, warnings, 'DUPLICATE_ENTRY', path,
        `Duplicate entry '${field}' in safeMetadataFields.`)
    }
    seen.add(field.toLowerCase())
  }
}

function validateSampleEntityMappings(
  obj: Record<string, unknown>,
  errors: string[],
  warnings: string[],
  issues: ValidationIssue[],
): void {
  const mappings = obj['sampleEntityMappings']
  if (!Array.isArray(mappings) || mappings.length === 0) {
    addError(issues, errors, 'MISSING_REQUIRED_FIELD', 'sampleEntityMappings',
      'sampleEntityMappings must be a non-empty array.')
    return
  }

  const knownAttributes = new Set(KNOWN_SEMANTIC_ATTRIBUTES)

  for (let i = 0; i < mappings.length; i++) {
    const mapping = mappings[i] as Record<string, unknown> | undefined
    const path = `sampleEntityMappings[${String(i)}]`

    if (mapping === undefined || mapping === null || typeof mapping !== 'object') {
      addError(issues, errors, 'INVALID_FORMAT', path, `${path} must be an object.`)
      continue
    }

    if (typeof mapping['sourceField'] !== 'string' || (mapping['sourceField'] as string).trim() === '') {
      addError(issues, errors, 'MISSING_REQUIRED_FIELD', `${path}.sourceField`,
        `${path}.sourceField is required and must be a non-empty string.`)
    }

    if (typeof mapping['semanticAttribute'] !== 'string' || (mapping['semanticAttribute'] as string).trim() === '') {
      addError(issues, errors, 'MISSING_REQUIRED_FIELD', `${path}.semanticAttribute`,
        `${path}.semanticAttribute is required and must be a non-empty string.`)
    } else if (!knownAttributes.has(mapping['semanticAttribute'] as string)) {
      addWarning(issues, warnings, 'UNKNOWN_VALUE', `${path}.semanticAttribute`,
        `${path}.semanticAttribute '${mapping['semanticAttribute'] as string}' ` +
        'is not a recognised public semantic attribute.')
    }

    if (mapping['description'] !== undefined && typeof mapping['description'] !== 'string') {
      addError(issues, errors, 'INVALID_FORMAT', `${path}.description`,
        `${path}.description, if provided, must be a string.`)
    }
  }
}

function validateAliases(
  obj: Record<string, unknown>,
  errors: string[],
  warnings: string[],
  issues: ValidationIssue[],
): void {
  if (obj['aliases'] === undefined) return

  if (!Array.isArray(obj['aliases'])) {
    addError(issues, errors, 'INVALID_FORMAT', 'aliases',
      'aliases, if provided, must be an array of strings.')
    return
  }

  const seen = new Set<string>()
  for (let i = 0; i < (obj['aliases'] as unknown[]).length; i++) {
    const alias = (obj['aliases'] as unknown[])[i]
    const path = `aliases[${String(i)}]`

    if (typeof alias !== 'string' || alias.trim() === '') {
      addError(issues, errors, 'INVALID_FORMAT', path,
        'Each entry in aliases must be a non-empty string.')
    } else {
      if (seen.has(alias.toLowerCase())) {
        addWarning(issues, warnings, 'DUPLICATE_ENTRY', path,
          `Duplicate alias '${alias}'.`)
      }
      seen.add(alias.toLowerCase())
    }
  }
}

function validateCapabilities(
  obj: Record<string, unknown>,
  warnings: string[],
  issues: ValidationIssue[],
): void {
  if (obj['capabilities'] === undefined) return

  if (!Array.isArray(obj['capabilities'])) {
    addWarning(issues, warnings, 'INVALID_FORMAT', 'capabilities',
      'capabilities, if provided, must be an array of strings.')
    return
  }

  const knownSet = new Set(KNOWN_CAPABILITIES)
  const seen = new Set<string>()

  for (let i = 0; i < (obj['capabilities'] as unknown[]).length; i++) {
    const cap = (obj['capabilities'] as unknown[])[i]
    const path = `capabilities[${String(i)}]`

    if (typeof cap !== 'string') {
      addWarning(issues, warnings, 'INVALID_FORMAT', path,
        'Each entry in capabilities must be a string.')
    } else {
      if (seen.has(cap)) {
        addWarning(issues, warnings, 'DUPLICATE_ENTRY', path,
          `Duplicate capability '${cap}'.`)
      }
      seen.add(cap)

      if (!knownSet.has(cap)) {
        addWarning(issues, warnings, 'UNKNOWN_VALUE', path,
          `Capability '${cap}' is not a recognised public capability.`)
      }
    }
  }
}

function validateConfigurationSchema(
  obj: Record<string, unknown>,
  errors: string[],
  warnings: string[],
  issues: ValidationIssue[],
): void {
  const schema = obj['configurationSchema']
  if (schema === undefined) return

  if (typeof schema !== 'object' || schema === null) {
    addError(issues, errors, 'INVALID_FORMAT', 'configurationSchema',
      'configurationSchema, if provided, must be a JSON object.')
    return
  }

  const schemaObj = schema as Record<string, unknown>
  if (schemaObj['type'] !== 'object') {
    addError(issues, errors, 'SCHEMA_MISMATCH', 'configurationSchema.type',
      'configurationSchema must have "type": "object".')
  }

  if (schemaObj['properties'] === undefined || typeof schemaObj['properties'] !== 'object') {
    addError(issues, errors, 'SCHEMA_MISMATCH', 'configurationSchema.properties',
      'configurationSchema must include a "properties" key with an object value.')
    return
  }

  const properties = schemaObj['properties'] as Record<string, unknown>
  const unsafePropNames = new Set(UNSAFE_DEFAULT_PROPERTY_NAMES.map((n) => n.toLowerCase()))
  const unsafeDefaults = new Set(
    UNSAFE_DEFAULT_VALUES.filter((v): v is string => typeof v === 'string').map((v) => v.toLowerCase()),
  )
  const boolUnsafe = UNSAFE_DEFAULT_VALUES.includes(true)

  for (const [key, value] of Object.entries(properties)) {
    if (typeof value !== 'object' || value === null) continue
    const prop = value as Record<string, unknown>
    const propPath = `configurationSchema.properties.${key}`

    if (prop['default'] !== undefined) {
      const defVal = prop['default']

      if (unsafePropNames.has(key.toLowerCase()) && defVal === true) {
        addWarning(issues, warnings, 'UNSAFE_DEFAULT', `${propPath}.default`,
          `Property '${key}' has an unsafe default value of true. ` +
          'Security-sensitive properties should default to the secure state.')
      } else if (typeof defVal === 'string' && unsafeDefaults.has(defVal.toLowerCase())) {
        addWarning(issues, warnings, 'UNSAFE_DEFAULT', `${propPath}.default`,
          `Property '${key}' has an unsafe default value '${defVal}'. ` +
          'Avoid defaults that resemble credentials or insecure settings.')
      } else if (typeof defVal === 'boolean' && defVal === true && boolUnsafe && unsafePropNames.has(key.toLowerCase())) {
        addWarning(issues, warnings, 'UNSAFE_DEFAULT', `${propPath}.default`,
          `Property '${key}' defaults to true. Security-sensitive booleans should default to false.`)
      }
    }
  }
}

function validateSampleConfiguration(
  obj: Record<string, unknown>,
  errors: string[],
  issues: ValidationIssue[],
): void {
  const sample = obj['sampleConfiguration']
  if (sample === undefined) return

  if (typeof sample !== 'object' || sample === null) {
    addError(issues, errors, 'INVALID_FORMAT', 'sampleConfiguration',
      'sampleConfiguration, if provided, must be a JSON object.')
    return
  }

  const schema = obj['configurationSchema']
  if (typeof schema !== 'object' || schema === null) return

  const schemaObj = schema as Record<string, unknown>
  const required = schemaObj['required']
  if (!Array.isArray(required)) return

  const sampleObj = sample as Record<string, unknown>
  for (const field of required) {
    if (typeof field === 'string' && sampleObj[field] === undefined) {
      addError(issues, errors, 'SCHEMA_MISMATCH', `sampleConfiguration.${field}`,
        `sampleConfiguration is missing required schema field "${field}".`)
    }
  }

  for (const [key, value] of Object.entries(sampleObj)) {
    if (typeof value === 'string') {
      validateUrlValue(value, `sampleConfiguration.${key}`, errors, issues)
    }
  }
}

function validateUrlValue(
  value: string,
  path: string,
  errors: string[],
  issues: ValidationIssue[],
): void {
  if (!value.startsWith('http://') && !value.startsWith('https://')) return

  if (HTTPS_URL_PATTERN.test(value)) return

  if (HTTP_URL_PATTERN.test(value)) {
    addError(issues, errors, 'MALFORMED_URL', path,
      `URL at '${path}' uses http:// — production connectors should use https://.`)
    return
  }

  addError(issues, errors, 'MALFORMED_URL', path,
    `URL at '${path}' is malformed. Expected a valid URL starting with https://.`)
}

function validateAuthConfig(
  obj: Record<string, unknown>,
  errors: string[],
  warnings: string[],
  issues: ValidationIssue[],
): void {
  const auth = obj['authConfig']
  if (auth === undefined) return

  if (typeof auth !== 'object' || auth === null) {
    addError(issues, errors, 'INVALID_AUTH_CONFIG', 'authConfig',
      'authConfig, if provided, must be a JSON object.')
    return
  }

  const authObj = auth as Record<string, unknown>

  if (typeof authObj['type'] !== 'string' || (authObj['type'] as string).trim() === '') {
    addError(issues, errors, 'MISSING_REQUIRED_FIELD', 'authConfig.type',
      'authConfig.type is required and must be a non-empty string.')
  } else {
    const knownAuthTypes = new Set(KNOWN_AUTH_TYPES)
    if (!knownAuthTypes.has(authObj['type'] as string)) {
      addWarning(issues, warnings, 'UNKNOWN_VALUE', 'authConfig.type',
        `authConfig.type '${authObj['type'] as string}' is not a recognised authentication type. ` +
        `Known types: ${KNOWN_AUTH_TYPES.join(', ')}.`)
    }
  }

  if (authObj['scopes'] !== undefined) {
    if (!Array.isArray(authObj['scopes'])) {
      addError(issues, errors, 'INVALID_FORMAT', 'authConfig.scopes',
        'authConfig.scopes must be an array of strings.')
    } else {
      const seen = new Set<string>()
      for (let i = 0; i < (authObj['scopes'] as unknown[]).length; i++) {
        const scope = (authObj['scopes'] as unknown[])[i]
        const path = `authConfig.scopes[${String(i)}]`

        if (typeof scope !== 'string' || scope.trim() === '') {
          addError(issues, errors, 'INVALID_FORMAT', path,
            'Each scope must be a non-empty string.')
        } else {
          if (seen.has(scope)) {
            addError(issues, errors, 'DUPLICATE_ENTRY', path,
              `Duplicate scope '${scope}' in authConfig.scopes.`)
          }
          seen.add(scope)
        }
      }
    }
  }

  if (authObj['tokenUrl'] !== undefined) {
    if (typeof authObj['tokenUrl'] !== 'string') {
      addError(issues, errors, 'INVALID_FORMAT', 'authConfig.tokenUrl',
        'authConfig.tokenUrl must be a string.')
    } else {
      validateUrlValue(authObj['tokenUrl'] as string, 'authConfig.tokenUrl', errors, issues)
    }
  }

  if (authObj['authoriseUrl'] !== undefined) {
    if (typeof authObj['authoriseUrl'] !== 'string') {
      addError(issues, errors, 'INVALID_FORMAT', 'authConfig.authoriseUrl',
        'authConfig.authoriseUrl must be a string.')
    } else {
      validateUrlValue(authObj['authoriseUrl'] as string, 'authConfig.authoriseUrl', errors, issues)
    }
  }
}

function validateEventShape(
  obj: Record<string, unknown>,
  errors: string[],
  issues: ValidationIssue[],
): void {
  const eventShape = obj['eventShape']
  if (eventShape === undefined) return

  if (typeof eventShape !== 'object' || eventShape === null || Array.isArray(eventShape)) {
    addError(issues, errors, 'INVALID_FORMAT', 'eventShape',
      'eventShape, if provided, must be a JSON object.')
    return
  }

  const shape = eventShape as Record<string, unknown>
  for (const field of ['sourceSystem', 'entityType', 'sourceIdField']) {
    if (typeof shape[field] !== 'string' || (shape[field] as string).trim() === '') {
      addError(issues, errors, 'MISSING_REQUIRED_FIELD', `eventShape.${field}`,
        `eventShape.${field} is required and must be a non-empty string.`)
    }
  }

  for (const field of ['timestampField', 'payloadRoot']) {
    if (shape[field] !== undefined && typeof shape[field] !== 'string') {
      addError(issues, errors, 'INVALID_FORMAT', `eventShape.${field}`,
        `eventShape.${field}, if provided, must be a string.`)
    }
  }
}
