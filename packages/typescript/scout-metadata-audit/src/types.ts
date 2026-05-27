/** Input connector manifest for audit. */
export interface ConnectorManifest {
  connectorType: string
  displayName: string
  description: string
  aliases?: string[]
  supportedDataSourceKinds: string[]
  supportedCapabilities?: string[]
  configurationSchema: JsonSchema
  credentialSchema?: JsonSchema
  sampleConfiguration: Record<string, unknown>
}

/** Minimal JSON Schema representation. */
export interface JsonSchema {
  type: string
  required?: string[]
  properties: Record<string, SchemaProperty>
}

/** A single property within a JSON Schema. */
export interface SchemaProperty {
  type: string
  description?: string
  enum?: string[]
  default?: unknown
  format?: string
  items?: SchemaProperty
  required?: string[]
  properties?: Record<string, SchemaProperty>
}

/** Sample record supplied for audit. */
export interface SampleRecord {
  externalUserId: string
  observedAtUtc?: string
  payload: Record<string, unknown>
}

/** Input to the audit runner. */
export interface AuditInput {
  manifest: ConnectorManifest
  sampleSchema?: JsonSchema
  sampleRecords?: SampleRecord[]
}

/** Summary of a schema field. */
export interface FieldSummary {
  name: string
  type: string
  required: boolean
  hasDescription: boolean
  hasDefault: boolean
  classification: FieldClassification
}

/** Classification assigned to a field. */
export type FieldClassification =
  | 'semantic-attribute'
  | 'identifier'
  | 'timestamp'
  | 'configuration'
  | 'payload'
  | 'unknown'

/** A warning about missing or incomplete metadata. */
export interface MetadataWarning {
  severity: 'error' | 'warning' | 'info'
  field: string
  message: string
}

/** Safe recommendation from the audit. */
export interface Recommendation {
  category: 'schema' | 'metadata' | 'sample-data' | 'capabilities' | 'general'
  message: string
}

/** Full audit report. */
export interface AuditReport {
  connectorType: string
  displayName: string
  auditedAtUtc: string
  schemaSummary: SchemaSummary
  fieldClassifications: FieldSummary[]
  warnings: MetadataWarning[]
  readinessScore: ReadinessScore
  recommendations: Recommendation[]
}

/** High-level schema summary. */
export interface SchemaSummary {
  totalFields: number
  requiredFields: number
  optionalFields: number
  documentedFields: number
  undocumentedFields: number
  fieldTypes: Record<string, number>
}

/** Readiness score breakdown. */
export interface ReadinessScore {
  overall: number
  breakdown: ReadinessBreakdown
}

/** Individual scoring dimensions. */
export interface ReadinessBreakdown {
  manifestCompleteness: number
  schemaQuality: number
  sampleDataCoverage: number
  capabilityBreadth: number
  documentationCoverage: number
}
