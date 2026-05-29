/** Full manifest for a public KynticAI Scout connector. */
export interface ConnectorManifest {
  connectorId: string
  displayName: string
  version: string
  description: string
  supportedSourceTypes: string[]
  requiredConfigFields: RequiredConfigField[]
  safeMetadataFields: string[]
  sampleEntityMappings: SampleEntityMapping[]
  aliases?: string[]
  capabilities?: string[]
  configurationSchema?: JsonSchemaObject
  sampleConfiguration?: Record<string, unknown>
  eventShape?: ConnectorEventShape
}

/** A required configuration field declared by the connector. */
export interface RequiredConfigField {
  name: string
  type: string
  description: string
}

/** A sample entity mapping demonstrating how source fields map to semantic attributes. */
export interface SampleEntityMapping {
  sourceField: string
  semanticAttribute: string
  description?: string
}

/** Provider-neutral event shape emitted by the connector into Scout. */
export interface ConnectorEventShape {
  sourceSystem: string
  entityType: string
  sourceIdField: string
  timestampField?: string
  payloadRoot?: string
}

/** Minimal JSON Schema object representation. */
export interface JsonSchemaObject {
  type: 'object'
  required?: string[]
  properties: Record<string, JsonSchemaProperty>
}

/** A single property within a JSON Schema. */
export interface JsonSchemaProperty {
  type: string
  description?: string
  enum?: string[]
  default?: unknown
  format?: string
  items?: JsonSchemaProperty
  required?: string[]
  properties?: Record<string, JsonSchemaProperty>
}

/** Result of a connector manifest validation. */
export interface ManifestValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/** Options for the manifest validator. */
export interface ValidatorOptions {
  /** Known connector IDs to check for duplicates. */
  knownConnectorIds?: string[]
}
