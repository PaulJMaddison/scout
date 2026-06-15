export { validateManifest } from './validator.js'
export {
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
export type {
  ConnectorManifest,
  AuthConfig,
  RequiredConfigField,
  SampleEntityMapping,
  JsonSchemaObject,
  JsonSchemaProperty,
  ManifestValidationResult,
  ValidationIssue,
  ValidationErrorCode,
  ValidatorOptions,
} from './types.js'
