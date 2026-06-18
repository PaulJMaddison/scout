/** Known public data source kinds for KynticAI Scout connectors. */
export const KNOWN_SOURCE_TYPES: readonly string[] = [
  'Crm',
  'SqlMetric',
  'EventStream',
  'ProductUsage',
] as const

/** Known public connector capabilities. */
export const KNOWN_CAPABILITIES: readonly string[] = [
  'FetchSubject',
  'Preview',
  'DryRun',
  'ScheduledSync',
  'EventTriggeredRecompute',
  'HealthCheck',
  'ConfigurationValidation',
  'SecureCredentialStorage',
] as const

/** Known public semantic attribute keys. */
export const KNOWN_SEMANTIC_ATTRIBUTES: readonly string[] = [
  'conversionProbability',
  'preferredChannel',
  'planInterest',
  'churnRisk',
  'engagementLevel',
  'expansionPotential',
  'budgetReadiness',
  'decisionMakerLikelihood',
  'productFit',
  'recommendedSalesMotion',
  'stakeholderSeniority',
  'salesUrgency',
  'recentFeatureAdoption',
] as const

/**
 * Field names that must never appear in safeMetadataFields.
 * These are sensitive fields that could leak credentials or PII.
 */
export const UNSAFE_FIELD_NAMES: readonly string[] = [
  'password',
  'secret',
  'token',
  'credential',
  'apiKey',
  'apiSecret',
  'accessToken',
  'refreshToken',
  'privateKey',
  'connectionString',
  'ssn',
  'socialSecurityNumber',
  'creditCard',
  'creditCardNumber',
  'cvv',
  'pin',
  'encryptionKey',
  'masterKey',
  'sessionToken',
  'bearerToken',
  'oauthToken',
  'clientSecret',
] as const

/** Known JSON Schema property types. */
export const KNOWN_SCHEMA_TYPES: readonly string[] = [
  'string',
  'number',
  'integer',
  'boolean',
  'array',
  'object',
] as const

/** Semver pattern: MAJOR.MINOR.PATCH with optional pre-release suffix. */
export const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/

/** Connector ID pattern: camelCase alphanumeric, starting with lowercase. */
export const CONNECTOR_ID_PATTERN = /^[a-z][a-zA-Z0-9]*$/

/** Known public auth types for connector authentication blocks. */
export const KNOWN_AUTH_TYPES: readonly string[] = [
  'none',
  'apiKey',
  'basic',
  'oauth2',
  'bearer',
] as const

/**
 * URL pattern: must start with https:// (http:// triggers a warning).
 * Rejects obviously malformed values.
 */
export const HTTPS_URL_PATTERN = /^https:\/\/[^\s/$.?#].[^\s]*$/i
export const HTTP_URL_PATTERN = /^http:\/\/[^\s/$.?#].[^\s]*$/i

/**
 * Default values considered unsafe in public connector schemas.
 * These indicate credentials or insecure-by-default settings.
 */
export const UNSAFE_DEFAULT_VALUES: readonly (string | boolean)[] = [
  'admin',
  'root',
  'password',
  'changeme',
  'test',
  'default',
  true, // e.g. allowInsecure: true
] as const

/** Property names whose defaults are security-sensitive. */
export const UNSAFE_DEFAULT_PROPERTY_NAMES: readonly string[] = [
  'allowInsecure',
  'disableTls',
  'skipCertificateValidation',
  'insecure',
  'trustAllCerts',
  'disableAuth',
  'allowHttp',
] as const
