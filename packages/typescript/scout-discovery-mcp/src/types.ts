/** Metadata for a registered connector plugin. */
export interface ConnectorMetadata {
  connectorType: string
  displayName: string
  description: string
  aliases: string[]
  supportedDataSourceKinds: string[]
  supportedCapabilities: string[]
  configurationSchema: JsonSchema
  sampleConfiguration: Record<string, unknown>
}

/** Minimal JSON Schema representation used by connector config schemas. */
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

/** Top-level shape of the sample data file. */
export interface SampleDataset {
  connectors: ConnectorMetadata[]
  semanticAttributeKeys: string[]
  dataSourceKinds: string[]
  connectorCapabilities: string[]
}

/** Result of a connector manifest validation. */
export interface ManifestValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}
