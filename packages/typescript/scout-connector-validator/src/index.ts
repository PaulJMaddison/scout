export { validateManifest } from './validator.js'
export {
  KNOWN_SOURCE_TYPES,
  KNOWN_CAPABILITIES,
  KNOWN_SEMANTIC_ATTRIBUTES,
  UNSAFE_FIELD_NAMES,
  KNOWN_SCHEMA_TYPES,
  SEMVER_PATTERN,
  CONNECTOR_ID_PATTERN,
} from './schema.js'
export type {
  ConnectorManifest,
  ConnectorEventShape,
  RequiredConfigField,
  SampleEntityMapping,
  JsonSchemaObject,
  JsonSchemaProperty,
  ManifestValidationResult,
  ValidatorOptions,
} from './types.js'
