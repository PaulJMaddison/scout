import {
  getConnectors,
  getConnectorByType,
  getSemanticAttributeKeys,
  getDataSourceKinds,
  getConnectorCapabilities,
} from './sample-data.js'
import type { ManifestValidationResult } from './types.js'

/**
 * Lists all registered connector plugins with public metadata.
 * Returns connector type, display name, description, aliases, and supported data source kinds.
 */
export function listConnectors(): object {
  return {
    connectors: getConnectors().map((c) => ({
      connectorType: c.connectorType,
      displayName: c.displayName,
      description: c.description,
      aliases: c.aliases,
      supportedDataSourceKinds: c.supportedDataSourceKinds,
    })),
    totalCount: getConnectors().length,
  }
}

/**
 * Inspects the configuration schema and sample configuration for a connector.
 * Accepts a connectorType or alias.
 */
export function inspectSampleSchema(connectorType: string): object {
  const connector = getConnectorByType(connectorType)
  if (connector === undefined) {
    return {
      error: `Connector type '${connectorType}' not found.`,
      availableTypes: getConnectors().map((c) => c.connectorType),
    }
  }

  return {
    connectorType: connector.connectorType,
    displayName: connector.displayName,
    configurationSchema: connector.configurationSchema,
    sampleConfiguration: connector.sampleConfiguration,
    supportedCapabilities: connector.supportedCapabilities,
  }
}

/**
 * Summarises all available public metadata: connector count,
 * semantic attribute keys, data source kinds, and capabilities.
 */
export function summariseMetadata(): object {
  const connectors = getConnectors()

  return {
    summary: {
      connectorCount: connectors.length,
      connectorTypes: connectors.map((c) => c.connectorType),
      semanticAttributeKeys: getSemanticAttributeKeys(),
      dataSourceKinds: getDataSourceKinds(),
      connectorCapabilities: getConnectorCapabilities(),
    },
    description:
      'KynticAI Scout public metadata. Connectors listed are generic protocol-level ' +
      'adapters and safe examples. Enterprise vendor-specific connectors are not included.',
  }
}

/**
 * Validates a connector manifest JSON against the expected structure.
 * Checks required fields, schema structure, and sample configuration completeness.
 */
export function validateConnectorManifest(manifest: unknown): ManifestValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (manifest === null || manifest === undefined || typeof manifest !== 'object') {
    return { isValid: false, errors: ['Manifest must be a non-null JSON object.'], warnings }
  }

  const obj = manifest as Record<string, unknown>

  if (typeof obj['connectorType'] !== 'string' || (obj['connectorType'] as string).trim() === '') {
    errors.push('connectorType must be a non-empty string.')
  }

  if (typeof obj['displayName'] !== 'string' || (obj['displayName'] as string).trim() === '') {
    errors.push('displayName must be a non-empty string.')
  }

  if (typeof obj['description'] !== 'string' || (obj['description'] as string).trim() === '') {
    errors.push('description must be a non-empty string.')
  }

  if (!Array.isArray(obj['supportedDataSourceKinds']) || (obj['supportedDataSourceKinds'] as unknown[]).length === 0) {
    errors.push('supportedDataSourceKinds must be a non-empty array.')
  } else {
    const validKinds = new Set(getDataSourceKinds())
    for (const kind of obj['supportedDataSourceKinds'] as unknown[]) {
      if (typeof kind !== 'string' || !validKinds.has(kind)) {
        warnings.push(`Data source kind '${String(kind)}' is not a recognised public kind.`)
      }
    }
  }

  if (obj['supportedCapabilities'] !== undefined) {
    if (!Array.isArray(obj['supportedCapabilities']) || (obj['supportedCapabilities'] as unknown[]).length === 0) {
      errors.push('supportedCapabilities, if provided, must be a non-empty array.')
    }
  }

  if (obj['aliases'] !== undefined && !Array.isArray(obj['aliases'])) {
    errors.push('aliases, if provided, must be an array.')
  }

  validateSchemaField(obj, 'configurationSchema', errors)
  validateSchemaField(obj, 'credentialSchema', warnings)
  validateSampleConfig(obj, errors)

  return { isValid: errors.length === 0, errors, warnings }
}

function validateSchemaField(
  obj: Record<string, unknown>,
  fieldName: string,
  issues: string[],
): void {
  const schema = obj[fieldName]
  if (schema === undefined) {
    if (fieldName === 'configurationSchema') {
      issues.push('configurationSchema is required.')
    }
    return
  }

  if (typeof schema !== 'object' || schema === null) {
    issues.push(`${fieldName} must be a JSON object.`)
    return
  }

  const schemaObj = schema as Record<string, unknown>
  if (schemaObj['type'] !== 'object') {
    issues.push(`${fieldName} must have "type": "object".`)
  }
  if (schemaObj['properties'] === undefined || typeof schemaObj['properties'] !== 'object') {
    issues.push(`${fieldName} must include a "properties" key with an object value.`)
  }
}

function validateSampleConfig(obj: Record<string, unknown>, errors: string[]): void {
  const sample = obj['sampleConfiguration']
  if (sample === undefined) {
    errors.push('sampleConfiguration is required.')
    return
  }

  if (typeof sample !== 'object' || sample === null) {
    errors.push('sampleConfiguration must be a JSON object.')
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
      errors.push(`sampleConfiguration is missing required field "${field}".`)
    }
  }
}
