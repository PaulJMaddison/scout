/**
 * Structured validation issue with a machine-readable code and field path.
 * Use `code` for programmatic handling; `message` for human-readable detail.
 */
export interface ValidationIssue {
  /** Machine-readable error code for programmatic handling. */
  code: ValidationErrorCode
  /** Dot-delimited path to the offending field, e.g. `requiredConfigFields[0].name`. */
  path: string
  /** Human-readable description of the problem. */
  message: string
  /** `error` blocks acceptance; `warning` is advisory. */
  severity: 'error' | 'warning'
}

/** Machine-readable error codes emitted by the manifest validator. */
export type ValidationErrorCode =
  | 'INVALID_MANIFEST_SHAPE'
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_FORMAT'
  | 'UNSAFE_FIELD_NAME'
  | 'DUPLICATE_ENTRY'
  | 'UNKNOWN_VALUE'
  | 'INVALID_AUTH_CONFIG'
  | 'MALFORMED_URL'
  | 'UNSAFE_DEFAULT'
  | 'SCHEMA_MISMATCH'

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
  /** Optional authentication configuration block. */
  authConfig?: AuthConfig
  /** Optional provider-neutral event shape emitted by the connector. */
  eventShape?: ConnectorEventShape
}

/** Authentication configuration for a connector. */
export interface AuthConfig {
  type: string
  scopes?: string[]
  tokenUrl?: string
  authoriseUrl?: string
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
  /** Structured issues with machine-readable codes, field paths, and severity. */
  issues: ValidationIssue[]
}

/** Options for the manifest validator. */
export interface ValidatorOptions {
  /** Known connector IDs to check for duplicates. */
  knownConnectorIds?: string[]
}
