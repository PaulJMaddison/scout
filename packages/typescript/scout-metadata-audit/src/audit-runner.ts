import type {
  AuditInput,
  AuditReport,
  FieldClassification,
  FieldSummary,
  MetadataWarning,
  Recommendation,
  ReadinessBreakdown,
  ReadinessScore,
  SchemaSummary,
  SchemaProperty,
  JsonSchema,
} from './types.js'
import {
  CONNECTOR_CAPABILITIES,
  DATA_SOURCE_KINDS,
  isIdentifierField,
  isSemanticAttribute,
  isTimestampField,
} from './catalogue.js'

/**
 * Runs a local metadata audit against a connector manifest, optional schema,
 * and optional sample records. Returns a structured report with schema summary,
 * field classifications, warnings, readiness score, and recommendations.
 *
 * This function uses only the data passed in — no live connections.
 */
export function runAudit(input: AuditInput): AuditReport {
  const { manifest } = input

  const schema = input.sampleSchema ?? manifest.configurationSchema
  const fields = summariseFields(schema)
  const schemaSummary = buildSchemaSummary(fields)
  const warnings = collectWarnings(input)
  const recommendations = collectRecommendations(input, fields, warnings)
  const readiness = calculateReadiness(input, fields, warnings)

  return {
    connectorType: manifest.connectorType,
    displayName: manifest.displayName,
    auditedAtUtc: new Date().toISOString(),
    schemaSummary,
    fieldClassifications: fields,
    warnings,
    readinessScore: readiness,
    recommendations,
  }
}

function classifyField(name: string, prop: SchemaProperty): FieldClassification {
  if (isSemanticAttribute(name)) return 'semantic-attribute'
  if (isIdentifierField(name)) return 'identifier'
  if (isTimestampField(name) || prop.format === 'date-time') return 'timestamp'
  if (prop.type === 'object' || prop.type === 'array') return 'payload'
  return 'configuration'
}

function summariseFields(schema: JsonSchema): FieldSummary[] {
  const required = new Set(schema.required ?? [])
  const result: FieldSummary[] = []

  for (const [name, prop] of Object.entries(schema.properties)) {
    if (prop === undefined) continue
    result.push({
      name,
      type: prop.type,
      required: required.has(name),
      hasDescription: typeof prop.description === 'string' && prop.description.trim().length > 0,
      hasDefault: prop.default !== undefined,
      classification: classifyField(name, prop),
    })
  }

  return result
}

function buildSchemaSummary(fields: FieldSummary[]): SchemaSummary {
  const typeCounts: Record<string, number> = {}
  let documented = 0
  let required = 0

  for (const f of fields) {
    typeCounts[f.type] = (typeCounts[f.type] ?? 0) + 1
    if (f.hasDescription) documented++
    if (f.required) required++
  }

  return {
    totalFields: fields.length,
    requiredFields: required,
    optionalFields: fields.length - required,
    documentedFields: documented,
    undocumentedFields: fields.length - documented,
    fieldTypes: typeCounts,
  }
}

function collectWarnings(input: AuditInput): MetadataWarning[] {
  const { manifest, sampleRecords } = input
  const warnings: MetadataWarning[] = []

  if (!manifest.connectorType || manifest.connectorType.trim() === '') {
    warnings.push({ severity: 'error', field: 'connectorType', message: 'connectorType is empty.' })
  }
  if (!manifest.displayName || manifest.displayName.trim() === '') {
    warnings.push({ severity: 'error', field: 'displayName', message: 'displayName is empty.' })
  }
  if (!manifest.description || manifest.description.trim() === '') {
    warnings.push({ severity: 'error', field: 'description', message: 'description is empty.' })
  }

  if (!manifest.supportedDataSourceKinds || manifest.supportedDataSourceKinds.length === 0) {
    warnings.push({
      severity: 'error',
      field: 'supportedDataSourceKinds',
      message: 'At least one data source kind is required.',
    })
  } else {
    for (const kind of manifest.supportedDataSourceKinds) {
      if (!DATA_SOURCE_KINDS.has(kind)) {
        warnings.push({
          severity: 'warning',
          field: 'supportedDataSourceKinds',
          message: `Data source kind '${kind}' is not in the public catalogue.`,
        })
      }
    }
  }

  if (manifest.supportedCapabilities !== undefined) {
    for (const cap of manifest.supportedCapabilities) {
      if (!CONNECTOR_CAPABILITIES.has(cap)) {
        warnings.push({
          severity: 'warning',
          field: 'supportedCapabilities',
          message: `Capability '${cap}' is not in the public catalogue.`,
        })
      }
    }
  } else {
    warnings.push({
      severity: 'info',
      field: 'supportedCapabilities',
      message: 'No capabilities declared. Consider listing supported capabilities explicitly.',
    })
  }

  const configSchema = manifest.configurationSchema
  if (!configSchema) {
    warnings.push({ severity: 'error', field: 'configurationSchema', message: 'configurationSchema is missing.' })
  } else {
    if (configSchema.type !== 'object') {
      warnings.push({
        severity: 'error',
        field: 'configurationSchema.type',
        message: 'configurationSchema must have "type": "object".',
      })
    }
    if (!configSchema.properties || Object.keys(configSchema.properties).length === 0) {
      warnings.push({
        severity: 'error',
        field: 'configurationSchema.properties',
        message: 'configurationSchema must define at least one property.',
      })
    }

    for (const [name, prop] of Object.entries(configSchema.properties ?? {})) {
      if (prop === undefined) continue
      if (!prop.description || prop.description.trim() === '') {
        warnings.push({
          severity: 'info',
          field: `configurationSchema.properties.${name}`,
          message: `Field '${name}' has no description.`,
        })
      }
    }
  }

  validateSampleConfig(manifest, warnings)
  validateSampleRecords(sampleRecords, warnings)

  return warnings
}

function validateSampleConfig(
  manifest: AuditInput['manifest'],
  warnings: MetadataWarning[],
): void {
  const sample = manifest.sampleConfiguration
  if (!sample || Object.keys(sample).length === 0) {
    warnings.push({
      severity: 'error',
      field: 'sampleConfiguration',
      message: 'sampleConfiguration is missing or empty.',
    })
    return
  }

  const required = manifest.configurationSchema?.required ?? []
  for (const field of required) {
    if (sample[field] === undefined) {
      warnings.push({
        severity: 'error',
        field: `sampleConfiguration.${field}`,
        message: `Required field '${field}' is missing from sampleConfiguration.`,
      })
    }
  }
}

function validateSampleRecords(
  records: AuditInput['sampleRecords'],
  warnings: MetadataWarning[],
): void {
  if (!records || records.length === 0) {
    warnings.push({
      severity: 'info',
      field: 'sampleRecords',
      message: 'No sample records provided. Supply records for deeper field analysis.',
    })
    return
  }

  for (let i = 0; i < records.length; i++) {
    const r = records[i]!
    if (!r.externalUserId || r.externalUserId.trim() === '') {
      warnings.push({
        severity: 'warning',
        field: `sampleRecords[${String(i)}].externalUserId`,
        message: 'Record is missing externalUserId.',
      })
    }
    if (!r.observedAtUtc) {
      warnings.push({
        severity: 'info',
        field: `sampleRecords[${String(i)}].observedAtUtc`,
        message: 'Record has no observedAtUtc. Consider adding timestamps for provenance.',
      })
    }
    if (!r.payload || Object.keys(r.payload).length === 0) {
      warnings.push({
        severity: 'warning',
        field: `sampleRecords[${String(i)}].payload`,
        message: 'Record has an empty payload.',
      })
    }
  }
}

function collectRecommendations(
  input: AuditInput,
  fields: FieldSummary[],
  warnings: MetadataWarning[],
): Recommendation[] {
  const recs: Recommendation[] = []
  const { manifest, sampleRecords } = input

  const undocumented = fields.filter((f) => !f.hasDescription)
  if (undocumented.length > 0) {
    recs.push({
      category: 'schema',
      message: `Add descriptions to undocumented fields: ${undocumented.map((f) => f.name).join(', ')}.`,
    })
  }

  const semanticFields = fields.filter((f) => f.classification === 'semantic-attribute')
  if (semanticFields.length === 0) {
    recs.push({
      category: 'schema',
      message: 'No fields match known semantic attribute keys. Consider mapping output fields to Scout semantic attributes.',
    })
  }

  if (!manifest.supportedCapabilities || manifest.supportedCapabilities.length === 0) {
    recs.push({
      category: 'capabilities',
      message: 'Declare supportedCapabilities explicitly so consumers know what the connector can do.',
    })
  } else {
    if (!manifest.supportedCapabilities.includes('HealthCheck')) {
      recs.push({
        category: 'capabilities',
        message: 'Consider supporting HealthCheck for operational monitoring.',
      })
    }
    if (!manifest.supportedCapabilities.includes('ConfigurationValidation')) {
      recs.push({
        category: 'capabilities',
        message: 'Consider supporting ConfigurationValidation for admin-time error detection.',
      })
    }
  }

  if (!sampleRecords || sampleRecords.length === 0) {
    recs.push({
      category: 'sample-data',
      message: 'Provide sample records to enable deeper payload and field coverage analysis.',
    })
  } else if (sampleRecords.length < 2) {
    recs.push({
      category: 'sample-data',
      message: 'Add at least two sample records to demonstrate variation across subjects.',
    })
  }

  if (!manifest.aliases || manifest.aliases.length === 0) {
    recs.push({
      category: 'metadata',
      message: 'Consider adding aliases so the connector is discoverable under alternative names.',
    })
  }

  const errors = warnings.filter((w) => w.severity === 'error')
  if (errors.length > 0) {
    recs.push({
      category: 'general',
      message: `Fix ${String(errors.length)} error(s) flagged in the warnings before publishing.`,
    })
  }

  if (!manifest.credentialSchema) {
    recs.push({
      category: 'metadata',
      message: 'Define a credentialSchema even if empty to signal no secrets are needed.',
    })
  }

  return recs
}

function calculateReadiness(
  input: AuditInput,
  fields: FieldSummary[],
  warnings: MetadataWarning[],
): ReadinessScore {
  const breakdown = calculateBreakdown(input, fields, warnings)

  const weights = {
    manifestCompleteness: 0.3,
    schemaQuality: 0.25,
    sampleDataCoverage: 0.2,
    capabilityBreadth: 0.1,
    documentationCoverage: 0.15,
  } as const

  const overall = Math.round(
    breakdown.manifestCompleteness * weights.manifestCompleteness +
      breakdown.schemaQuality * weights.schemaQuality +
      breakdown.sampleDataCoverage * weights.sampleDataCoverage +
      breakdown.capabilityBreadth * weights.capabilityBreadth +
      breakdown.documentationCoverage * weights.documentationCoverage,
  )

  return { overall, breakdown }
}

function calculateBreakdown(
  input: AuditInput,
  fields: FieldSummary[],
  warnings: MetadataWarning[],
): ReadinessBreakdown {
  const { manifest, sampleRecords } = input

  const manifestChecks = [
    manifest.connectorType?.trim().length > 0,
    manifest.displayName?.trim().length > 0,
    manifest.description?.trim().length > 0,
    manifest.supportedDataSourceKinds?.length > 0,
    manifest.configurationSchema !== undefined,
    manifest.sampleConfiguration !== undefined && Object.keys(manifest.sampleConfiguration).length > 0,
    manifest.aliases !== undefined,
  ]
  const manifestCompleteness = score(manifestChecks)

  const schemaChecks = [
    manifest.configurationSchema?.type === 'object',
    Object.keys(manifest.configurationSchema?.properties ?? {}).length > 0,
    (manifest.configurationSchema?.required ?? []).length > 0,
    warnings.filter((w) => w.severity === 'error' && w.field.startsWith('configurationSchema')).length === 0,
    warnings.filter((w) => w.severity === 'error' && w.field.startsWith('sampleConfiguration')).length === 0,
  ]
  const schemaQuality = score(schemaChecks)

  const sampleChecks = [
    sampleRecords !== undefined && sampleRecords.length > 0,
    sampleRecords !== undefined && sampleRecords.length >= 2,
    sampleRecords !== undefined && sampleRecords.every((r) => r.externalUserId?.trim().length > 0),
    sampleRecords !== undefined && sampleRecords.every((r) => r.observedAtUtc !== undefined),
    sampleRecords !== undefined && sampleRecords.every((r) => Object.keys(r.payload ?? {}).length > 0),
  ]
  const sampleDataCoverage = score(sampleChecks)

  const allCaps = [...CONNECTOR_CAPABILITIES]
  const declared = new Set(manifest.supportedCapabilities ?? [])
  const capabilityBreadth = allCaps.length > 0 ? Math.round((declared.size / allCaps.length) * 100) : 0

  const documentationCoverage =
    fields.length > 0
      ? Math.round((fields.filter((f) => f.hasDescription).length / fields.length) * 100)
      : 0

  return {
    manifestCompleteness,
    schemaQuality,
    sampleDataCoverage,
    capabilityBreadth,
    documentationCoverage,
  }
}

function score(checks: boolean[]): number {
  if (checks.length === 0) return 0
  const passed = checks.filter(Boolean).length
  return Math.round((passed / checks.length) * 100)
}
