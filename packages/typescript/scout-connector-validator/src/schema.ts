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
