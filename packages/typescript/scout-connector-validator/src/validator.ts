import type {
  ConnectorManifest,
  ManifestValidationResult,
  ValidatorOptions,
} from './types.js'
import {
  KNOWN_SOURCE_TYPES,
  KNOWN_CAPABILITIES,
  KNOWN_SEMANTIC_ATTRIBUTES,
  UNSAFE_FIELD_NAMES,
  KNOWN_SCHEMA_TYPES,
  SEMVER_PATTERN,
  CONNECTOR_ID_PATTERN,
} from './schema.js'

/**
 * Validates a connector manifest against the public KynticAI Scout schema.
 * Returns errors for hard failures and warnings for non-blocking issues.
 */
export function validateManifest(
  manifest: unknown,
  options?: ValidatorOptions,
): ManifestValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (manifest === null || manifest === undefined || typeof manifest !== 'object') {
    return { isValid: false, errors: ['Manifest must be a non-null JSON object.'], warnings }
  }

  const obj = manifest as Record<string, unknown>

  validateConnectorId(obj, errors, options)
  validateDisplayName(obj, errors)
  validateVersion(obj, errors)
  validateDescription(obj, errors)
  validateSupportedSourceTypes(obj, errors, warnings)
  validateRequiredConfigFields(obj, errors)
  validateSafeMetadataFields(obj, errors, warnings)
  validateSampleEntityMappings(obj, errors, warnings)
  validateAliases(obj, errors)
  validateCapabilities(obj, warnings)
  validateConfigurationSchema(obj, errors)
  validateSampleConfiguration(obj, errors)
  validateEventShape(obj, errors)

  return { isValid: errors.length === 0, errors, warnings }
}

function validateConnectorId(
  obj: Record<string, unknown>,
  errors: string[],
  options?: ValidatorOptions,
): void {
  const id = obj['connectorId']
  if (typeof id !== 'string' || id.trim() === '') {
    errors.push('connectorId is required and must be a non-empty string.')
    return
  }

  if (!CONNECTOR_ID_PATTERN.test(id)) {
    errors.push(
      'connectorId must start with a lowercase letter and contain only alphanumeric characters (camelCase).',
    )
  }

  if (options?.knownConnectorIds !== undefined) {
    const normalised = id.toLowerCase()
    const duplicates = options.knownConnectorIds.filter(
      (existing) => existing.toLowerCase() === normalised,
    )
    if (duplicates.length > 0) {
      errors.push(`connectorId '${id}' conflicts with existing connector(s): ${duplicates.join(', ')}.`)
    }
  }
}

function validateDisplayName(obj: Record<string, unknown>, errors: string[]): void {
  if (typeof obj['displayName'] !== 'string' || (obj['displayName'] as string).trim() === '') {
    errors.push('displayName is required and must be a non-empty string.')
  }
}

function validateVersion(obj: Record<string, unknown>, errors: string[]): void {
  const version = obj['version']
  if (typeof version !== 'string' || version.trim() === '') {
    errors.push('version is required and must be a non-empty string.')
    return
  }

  if (!SEMVER_PATTERN.test(version)) {
    errors.push('version must follow semantic versioning (MAJOR.MINOR.PATCH).')
  }
}

function validateDescription(obj: Record<string, unknown>, errors: string[]): void {
  if (typeof obj['description'] !== 'string' || (obj['description'] as string).trim() === '') {
    errors.push('description is required and must be a non-empty string.')
  }
}

function validateSupportedSourceTypes(
  obj: Record<string, unknown>,
  errors: string[],
  warnings: string[],
): void {
  const types = obj['supportedSourceTypes']
  if (!Array.isArray(types) || types.length === 0) {
    errors.push('supportedSourceTypes must be a non-empty array.')
    return
  }

  const knownSet = new Set(KNOWN_SOURCE_TYPES)
  for (const t of types) {
    if (typeof t !== 'string') {
      errors.push('Each entry in supportedSourceTypes must be a string.')
    } else if (!knownSet.has(t)) {
      warnings.push(`Source type '${t}' is not a recognised public kind. Known types: ${KNOWN_SOURCE_TYPES.join(', ')}.`)
    }
  }
}

function validateRequiredConfigFields(
  obj: Record<string, unknown>,
  errors: string[],
): void {
  const fields = obj['requiredConfigFields']
  if (!Array.isArray(fields) || fields.length === 0) {
    errors.push('requiredConfigFields must be a non-empty array of field definitions.')
    return
  }

  for (let i = 0; i < fields.length; i++) {
    const field = fields[i] as Record<string, unknown> | undefined
    if (field === undefined || field === null || typeof field !== 'object') {
      errors.push(`requiredConfigFields[${String(i)}] must be an object.`)
      continue
    }

    if (typeof field['name'] !== 'string' || (field['name'] as string).trim() === '') {
      errors.push(`requiredConfigFields[${String(i)}].name is required and must be a non-empty string.`)
    }

    if (typeof field['type'] !== 'string' || (field['type'] as string).trim() === '') {
      errors.push(`requiredConfigFields[${String(i)}].type is required and must be a non-empty string.`)
    } else {
      const knownTypes = new Set(KNOWN_SCHEMA_TYPES)
      if (!knownTypes.has(field['type'] as string)) {
        errors.push(
          `requiredConfigFields[${String(i)}].type '${field['type'] as string}' is not a recognised JSON Schema type.`,
        )
      }
    }

    if (typeof field['description'] !== 'string' || (field['description'] as string).trim() === '') {
      errors.push(`requiredConfigFields[${String(i)}].description is required and must be a non-empty string.`)
    }
  }
}

function validateSafeMetadataFields(
  obj: Record<string, unknown>,
  errors: string[],
  warnings: string[],
): void {
  const fields = obj['safeMetadataFields']
  if (!Array.isArray(fields)) {
    errors.push('safeMetadataFields must be an array.')
    return
  }

  const unsafeSet = new Set(UNSAFE_FIELD_NAMES.map((f) => f.toLowerCase()))
  const seen = new Set<string>()

  for (const field of fields) {
    if (typeof field !== 'string' || field.trim() === '') {
      errors.push('Each entry in safeMetadataFields must be a non-empty string.')
      continue
    }

    if (unsafeSet.has(field.toLowerCase())) {
      errors.push(
        `safeMetadataFields contains unsafe field '${field}'. ` +
          'Credential, secret, and PII fields must not be exposed in public metadata.',
      )
    }

    if (seen.has(field.toLowerCase())) {
      warnings.push(`Duplicate entry '${field}' in safeMetadataFields.`)
    }
    seen.add(field.toLowerCase())
  }
}

function validateSampleEntityMappings(
  obj: Record<string, unknown>,
  errors: string[],
  warnings: string[],
): void {
  const mappings = obj['sampleEntityMappings']
  if (!Array.isArray(mappings) || mappings.length === 0) {
    errors.push('sampleEntityMappings must be a non-empty array.')
    return
  }

  const knownAttributes = new Set(KNOWN_SEMANTIC_ATTRIBUTES)

  for (let i = 0; i < mappings.length; i++) {
    const mapping = mappings[i] as Record<string, unknown> | undefined
    if (mapping === undefined || mapping === null || typeof mapping !== 'object') {
      errors.push(`sampleEntityMappings[${String(i)}] must be an object.`)
      continue
    }

    if (typeof mapping['sourceField'] !== 'string' || (mapping['sourceField'] as string).trim() === '') {
      errors.push(`sampleEntityMappings[${String(i)}].sourceField is required and must be a non-empty string.`)
    }

    if (typeof mapping['semanticAttribute'] !== 'string' || (mapping['semanticAttribute'] as string).trim() === '') {
      errors.push(`sampleEntityMappings[${String(i)}].semanticAttribute is required and must be a non-empty string.`)
    } else if (!knownAttributes.has(mapping['semanticAttribute'] as string)) {
      warnings.push(
        `sampleEntityMappings[${String(i)}].semanticAttribute '${mapping['semanticAttribute'] as string}' ` +
          'is not a recognised public semantic attribute.',
      )
    }

    if (mapping['description'] !== undefined && typeof mapping['description'] !== 'string') {
      errors.push(`sampleEntityMappings[${String(i)}].description, if provided, must be a string.`)
    }
  }
}

function validateAliases(obj: Record<string, unknown>, errors: string[]): void {
  if (obj['aliases'] === undefined) return

  if (!Array.isArray(obj['aliases'])) {
    errors.push('aliases, if provided, must be an array of strings.')
    return
  }

  for (const alias of obj['aliases'] as unknown[]) {
    if (typeof alias !== 'string' || alias.trim() === '') {
      errors.push('Each entry in aliases must be a non-empty string.')
    }
  }
}

function validateCapabilities(obj: Record<string, unknown>, warnings: string[]): void {
  if (obj['capabilities'] === undefined) return

  if (!Array.isArray(obj['capabilities'])) {
    warnings.push('capabilities, if provided, must be an array of strings.')
    return
  }

  const knownSet = new Set(KNOWN_CAPABILITIES)
  for (const cap of obj['capabilities'] as unknown[]) {
    if (typeof cap !== 'string') {
      warnings.push('Each entry in capabilities must be a string.')
    } else if (!knownSet.has(cap)) {
      warnings.push(`Capability '${cap}' is not a recognised public capability.`)
    }
  }
}

function validateConfigurationSchema(obj: Record<string, unknown>, errors: string[]): void {
  const schema = obj['configurationSchema']
  if (schema === undefined) return

  if (typeof schema !== 'object' || schema === null) {
    errors.push('configurationSchema, if provided, must be a JSON object.')
    return
  }

  const schemaObj = schema as Record<string, unknown>
  if (schemaObj['type'] !== 'object') {
    errors.push('configurationSchema must have "type": "object".')
  }

  if (schemaObj['properties'] === undefined || typeof schemaObj['properties'] !== 'object') {
    errors.push('configurationSchema must include a "properties" key with an object value.')
  }
}

function validateSampleConfiguration(obj: Record<string, unknown>, errors: string[]): void {
  const sample = obj['sampleConfiguration']
  if (sample === undefined) return

  if (typeof sample !== 'object' || sample === null) {
    errors.push('sampleConfiguration, if provided, must be a JSON object.')
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
      errors.push(`sampleConfiguration is missing required schema field "${field}".`)
    }
  }
}

function validateEventShape(obj: Record<string, unknown>, errors: string[]): void {
  const eventShape = obj['eventShape']
  if (eventShape === undefined) return

  if (typeof eventShape !== 'object' || eventShape === null || Array.isArray(eventShape)) {
    errors.push('eventShape, if provided, must be a JSON object.')
    return
  }

  const shape = eventShape as Record<string, unknown>
  for (const field of ['sourceSystem', 'entityType', 'sourceIdField']) {
    if (typeof shape[field] !== 'string' || (shape[field] as string).trim() === '') {
      errors.push(`eventShape.${field} is required and must be a non-empty string.`)
    }
  }

  for (const field of ['timestampField', 'payloadRoot']) {
    if (shape[field] !== undefined && typeof shape[field] !== 'string') {
      errors.push(`eventShape.${field}, if provided, must be a string.`)
    }
  }
}
