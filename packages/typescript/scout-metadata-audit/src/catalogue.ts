/** Known semantic attribute keys from the public Scout domain model. */
export const SEMANTIC_ATTRIBUTE_KEYS: ReadonlySet<string> = new Set([
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
])

/** Recognised data source kinds in the public catalogue. */
export const DATA_SOURCE_KINDS: ReadonlySet<string> = new Set([
  'Crm',
  'SqlMetric',
  'EventStream',
  'ProductUsage',
])

/** All public connector capabilities. */
export const CONNECTOR_CAPABILITIES: ReadonlySet<string> = new Set([
  'FetchSubject',
  'Preview',
  'DryRun',
  'ScheduledSync',
  'EventTriggeredRecompute',
  'HealthCheck',
  'ConfigurationValidation',
  'SecureCredentialStorage',
])

/** Field name patterns that suggest identifier fields. */
const IDENTIFIER_PATTERNS = [
  /id$/i,
  /^id$/i,
  /userId/i,
  /externalId/i,
  /slug/i,
  /key$/i,
  /^tenant/i,
]

/** Field name patterns that suggest timestamp fields. */
const TIMESTAMP_PATTERNS = [
  /at$/i,
  /date/i,
  /time/i,
  /timestamp/i,
  /utc$/i,
  /observed/i,
  /created/i,
  /updated/i,
]

export function isSemanticAttribute(fieldName: string): boolean {
  return SEMANTIC_ATTRIBUTE_KEYS.has(fieldName)
}

export function isIdentifierField(fieldName: string): boolean {
  return IDENTIFIER_PATTERNS.some((p) => p.test(fieldName))
}

export function isTimestampField(fieldName: string): boolean {
  return TIMESTAMP_PATTERNS.some((p) => p.test(fieldName))
}
