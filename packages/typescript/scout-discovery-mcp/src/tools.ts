import {
  getConnectors,
  getConnectorByType,
  getSemanticAttributeKeys,
  getDataSourceKinds,
  getConnectorCapabilities,
} from './sample-data.js'
import type { ManifestValidationResult } from './types.js'
import {
  validateManifest as validateExtendedManifest,
  type ManifestValidationResult as ExtendedValidationResult,
  type ValidatorOptions,
} from '@kynticai/scout-connector-validator'
import {
  runAudit,
  type AuditInput,
  type AuditReport,
} from '@kynticai/scout-metadata-audit'

/** Sensitive patterns stripped from all public output. */
const REDACT_PATTERNS: RegExp[] = [
  /\/home\/[^\s"']+/gi,
  /\/Users\/[^\s"']+/gi,
  /\/tmp\/[^\s"']+/gi,
  /[A-Z]:\\[^\s"']+/gi,
  /(?:password|secret|token|apiKey|credential|connectionString)\s*[:=]\s*[^\s"',}]+/gi,
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /\b[A-Za-z0-9+/]{40,}={0,2}\b/g,
]

/** Strip absolute paths, secrets, and credential-like values from a string. */
export function sanitiseOutput(value: string): string {
  let result = value
  for (const pattern of REDACT_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]')
  }
  return result
}

/**
 * Lists all registered connector plugins with public metadata.
 * Returns connector type, display name, description, aliases, and supported data source kinds.
 * Output is sorted by connectorType for deterministic ordering.
 */
export function listConnectors(): object {
  const connectors = getConnectors()
    .map((c) => ({
      connectorType: c.connectorType,
      displayName: c.displayName,
      description: c.description,
      aliases: [...c.aliases].sort(),
      supportedDataSourceKinds: [...c.supportedDataSourceKinds].sort(),
    }))
    .sort((a, b) => a.connectorType.localeCompare(b.connectorType))

  return {
    connectors,
    totalCount: connectors.length,
  }
}

/**
 * Inspects the configuration schema and sample configuration for a connector.
 * Accepts a connectorType or alias.
 */
export function inspectSampleSchema(connectorType: string): object {
  const sanitised = connectorType.trim().slice(0, 200)
  if (sanitised.length === 0) {
    return {
      error: 'connectorType must be a non-empty string.',
      availableTypes: getConnectors().map((c) => c.connectorType).sort(),
    }
  }

  const connector = getConnectorByType(sanitised)
  if (connector === undefined) {
    return {
      error: `Connector type '${sanitiseOutput(sanitised)}' not found.`,
      availableTypes: getConnectors().map((c) => c.connectorType).sort(),
    }
  }

  return {
    connectorType: connector.connectorType,
    displayName: connector.displayName,
    configurationSchema: connector.configurationSchema,
    sampleConfiguration: connector.sampleConfiguration,
    supportedCapabilities: [...connector.supportedCapabilities].sort(),
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
      connectorTypes: connectors.map((c) => c.connectorType).sort(),
      semanticAttributeKeys: [...getSemanticAttributeKeys()].sort(),
      dataSourceKinds: [...getDataSourceKinds()].sort(),
      connectorCapabilities: [...getConnectorCapabilities()].sort(),
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

/**
 * Validates an extended connector manifest using the public schema validator.
 * Supports the full manifest format with version, requiredConfigFields,
 * safeMetadataFields, and sampleEntityMappings.
 */
export function validateExtendedConnectorManifest(
  manifest: unknown,
  options?: ValidatorOptions,
): ExtendedValidationResult {
  return validateExtendedManifest(manifest, options)
}

/**
 * Reads the full manifest for a given connector type or alias.
 * Returns every field including configurationSchema, sampleConfiguration,
 * supportedCapabilities, and aliases.
 */
export function readConnectorManifest(connectorType: string): object {
  const sanitised = connectorType.trim().slice(0, 200)
  if (sanitised.length === 0) {
    return {
      error: 'connectorType must be a non-empty string.',
      hint: 'Use scout_list_connectors to see available types and aliases.',
      availableTypes: getConnectors().map((c) => c.connectorType).sort(),
    }
  }

  const connector = getConnectorByType(sanitised)
  if (connector === undefined) {
    return {
      error: `Connector type '${sanitiseOutput(sanitised)}' not found.`,
      hint: 'Use scout_list_connectors to see available types and aliases.',
      availableTypes: getConnectors().map((c) => c.connectorType).sort(),
    }
  }

  return {
    connectorType: connector.connectorType,
    displayName: connector.displayName,
    description: connector.description,
    aliases: [...connector.aliases].sort(),
    supportedDataSourceKinds: [...connector.supportedDataSourceKinds].sort(),
    supportedCapabilities: [...connector.supportedCapabilities].sort(),
    configurationSchema: connector.configurationSchema,
    sampleConfiguration: connector.sampleConfiguration,
  }
}

/**
 * Validates that a manifest's configurationSchema is compatible with a
 * provided set of field declarations. Checks that required schema fields
 * exist, types match, and sample configuration covers all required fields.
 */
export function validateManifestSchemaCompatibility(
  manifest: unknown,
  schema: unknown,
): object {
  const issues: string[] = []
  const compatible: string[] = []

  if (manifest === null || manifest === undefined || typeof manifest !== 'object') {
    return { isCompatible: false, issues: ['manifest must be a non-null JSON object.'], compatible }
  }
  if (schema === null || schema === undefined || typeof schema !== 'object') {
    return { isCompatible: false, issues: ['schema must be a non-null JSON object.'], compatible }
  }

  const manifestObj = manifest as Record<string, unknown>
  const schemaObj = schema as Record<string, unknown>

  const manifestSchema = manifestObj['configurationSchema'] as Record<string, unknown> | undefined
  if (manifestSchema === undefined || typeof manifestSchema !== 'object') {
    issues.push('Manifest is missing configurationSchema.')
    return { isCompatible: false, issues, compatible }
  }

  const manifestProps = manifestSchema['properties'] as Record<string, unknown> | undefined
  if (manifestProps === undefined || typeof manifestProps !== 'object') {
    issues.push('Manifest configurationSchema has no properties.')
    return { isCompatible: false, issues, compatible }
  }

  const schemaProps = schemaObj['properties'] as Record<string, unknown> | undefined
  if (schemaProps === undefined || typeof schemaProps !== 'object') {
    issues.push('Provided schema has no properties.')
    return { isCompatible: false, issues, compatible }
  }

  const schemaRequired = Array.isArray(schemaObj['required'])
    ? (schemaObj['required'] as string[])
    : []

  for (const fieldName of schemaRequired) {
    if (manifestProps[fieldName] === undefined) {
      issues.push(`Required schema field '${fieldName}' is not declared in the manifest configurationSchema.`)
    }
  }

  for (const [fieldName, schemaProp] of Object.entries(schemaProps)) {
    const manifestProp = manifestProps[fieldName] as Record<string, unknown> | undefined
    if (manifestProp === undefined) {
      issues.push(`Schema field '${fieldName}' is not present in the manifest configurationSchema.`)
      continue
    }

    const schemaPropObj = schemaProp as Record<string, unknown>
    if (
      typeof schemaPropObj['type'] === 'string' &&
      typeof manifestProp['type'] === 'string' &&
      schemaPropObj['type'] !== manifestProp['type']
    ) {
      issues.push(
        `Type mismatch for field '${fieldName}': schema expects '${schemaPropObj['type'] as string}', manifest declares '${manifestProp['type'] as string}'.`,
      )
    } else {
      compatible.push(fieldName)
    }
  }

  const sampleConfig = manifestObj['sampleConfiguration'] as Record<string, unknown> | undefined
  if (sampleConfig !== undefined && typeof sampleConfig === 'object') {
    for (const fieldName of schemaRequired) {
      if (sampleConfig[fieldName] === undefined) {
        issues.push(`Sample configuration is missing required field '${fieldName}'.`)
      }
    }
  }

  return {
    isCompatible: issues.length === 0,
    issues,
    compatible,
    manifestFieldCount: Object.keys(manifestProps).length,
    schemaFieldCount: Object.keys(schemaProps).length,
  }
}

/**
 * Produces a detailed summary of all available connectors, including
 * capability coverage, data source kind distribution, and per-connector
 * detail. More detailed than summariseMetadata.
 */
export function summariseConnectors(): object {
  const connectors = getConnectors()

  const capabilityMap: Record<string, string[]> = {}
  const sourceKindMap: Record<string, string[]> = {}

  for (const c of connectors) {
    for (const cap of c.supportedCapabilities) {
      if (capabilityMap[cap] === undefined) capabilityMap[cap] = []
      capabilityMap[cap].push(c.connectorType)
    }
    for (const kind of c.supportedDataSourceKinds) {
      if (sourceKindMap[kind] === undefined) sourceKindMap[kind] = []
      sourceKindMap[kind].push(c.connectorType)
    }
  }

  const connectorDetails = connectors
    .map((c) => ({
      connectorType: c.connectorType,
      displayName: c.displayName,
      description: c.description,
      aliasCount: c.aliases.length,
      capabilityCount: c.supportedCapabilities.length,
      dataSourceKindCount: c.supportedDataSourceKinds.length,
      schemaFieldCount: Object.keys(c.configurationSchema.properties).length,
      requiredFieldCount: (c.configurationSchema.required ?? []).length,
    }))
    .sort((a, b) => a.connectorType.localeCompare(b.connectorType))

  const allCapabilities = getConnectorCapabilities()
  const fullCoverageConnectors = connectors.filter(
    (c) => c.supportedCapabilities.length === allCapabilities.length,
  )

  return {
    totalConnectors: connectors.length,
    connectors: connectorDetails,
    capabilityCoverage: capabilityMap,
    dataSourceKindCoverage: sourceKindMap,
    fullCoverageConnectors: fullCoverageConnectors.map((c) => c.connectorType),
    totalAliases: connectors.reduce((sum, c) => sum + c.aliases.length, 0),
    description:
      'Detailed connector summary for local development. ' +
      'Enterprise vendor-specific connectors are not included.',
  }
}

/**
 * Produces a local metadata quality report by running the metadata audit
 * runner against a connector manifest and optional sample records.
 * Reuses the @kynticai/scout-metadata-audit package.
 */
export function produceMetadataQualityReport(
  manifest: unknown,
  sampleRecords?: unknown,
): object {
  if (manifest === null || manifest === undefined || typeof manifest !== 'object') {
    return {
      error: 'manifest must be a non-null JSON object.',
      hint: 'Provide a connector manifest with connectorType, displayName, description, configurationSchema, and sampleConfiguration.',
    }
  }

  const manifestObj = manifest as Record<string, unknown>

  const requiredFields = ['connectorType', 'displayName', 'description', 'configurationSchema', 'sampleConfiguration']
  const missingFields = requiredFields.filter(
    (f) => manifestObj[f] === undefined || manifestObj[f] === null,
  )
  if (missingFields.length > 0) {
    return {
      error: `Manifest is missing required fields: ${missingFields.join(', ')}.`,
      hint: 'Ensure the manifest includes all required fields before running a quality report.',
    }
  }

  let parsedRecords: Array<{ externalUserId: string; observedAtUtc?: string; payload: Record<string, unknown> }> | undefined
  if (sampleRecords !== undefined && sampleRecords !== null) {
    if (!Array.isArray(sampleRecords)) {
      return {
        error: 'sampleRecords must be an array of sample record objects.',
        hint: 'Each record should have externalUserId (string), optional observedAtUtc (string), and payload (object).',
      }
    }
    parsedRecords = sampleRecords as Array<{ externalUserId: string; observedAtUtc?: string; payload: Record<string, unknown> }>
  }

  const auditInput = {
    manifest: manifestObj as unknown as AuditInput['manifest'],
    ...(parsedRecords !== undefined ? { sampleRecords: parsedRecords } : {}),
  } as AuditInput

  const report: AuditReport = runAudit(auditInput)

  const sanitisedWarnings = report.warnings.map((w) => ({
    ...w,
    message: sanitiseOutput(w.message),
  }))
  const sanitisedRecommendations = report.recommendations.map((r) => ({
    ...r,
    message: sanitiseOutput(r.message),
  }))

  return {
    connectorType: report.connectorType,
    displayName: report.displayName,
    auditedAtUtc: report.auditedAtUtc,
    overallReadiness: report.readinessScore.overall,
    readinessBreakdown: report.readinessScore.breakdown,
    schemaSummary: report.schemaSummary,
    fieldClassifications: report.fieldClassifications,
    warningCount: sanitisedWarnings.length,
    warnings: sanitisedWarnings,
    recommendationCount: sanitisedRecommendations.length,
    recommendations: sanitisedRecommendations,
  }
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
