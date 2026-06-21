import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { assertDiscoveryWritableFile } from './safe-paths.js'

export const DISCOVERY_SIGNATURE_SCHEMA_ID = 'kynticai.discovery-signature.v1'

export const DISCOVERY_SIGNATURE_V1_JSON_SCHEMA = {
  $id: DISCOVERY_SIGNATURE_SCHEMA_ID,
  type: 'object',
  additionalProperties: false,
  required: [
    'schemaVersion',
    'companyType',
    'targetWorkflow',
    'sourceSystemFamilies',
    'connectorManifests',
    'conversionPoints',
    'governanceNotes',
    'closestSyntheticDomain',
    'approvedForSyntheticDemoBuild',
  ],
  properties: {
    schemaVersion: { const: DISCOVERY_SIGNATURE_SCHEMA_ID },
    companyType: { type: 'string', minLength: 1, maxLength: 160 },
    targetWorkflow: { type: 'string', minLength: 1, maxLength: 220 },
    sourceSystemFamilies: { type: 'array', items: { type: 'string' }, maxItems: 40 },
    connectorManifests: { type: 'array', items: { type: 'object' }, maxItems: 25 },
    conversionPoints: { type: 'array', items: { type: 'string' }, maxItems: 80 },
    governanceNotes: { type: 'array', items: { type: 'string' }, maxItems: 40 },
    closestSyntheticDomain: { type: 'string', minLength: 1, maxLength: 180 },
    approvedForSyntheticDemoBuild: {
      type: 'object',
      additionalProperties: false,
      required: ['approved', 'approvedBy', 'approvedAtUtc'],
      properties: {
        approved: { const: true },
        approvedBy: { type: 'string', minLength: 1, maxLength: 120 },
        approvedAtUtc: { type: 'string', minLength: 1, maxLength: 80 },
        approvalReference: { type: 'string', minLength: 1, maxLength: 120 },
      },
    },
  },
} as const

export interface DiscoverySignatureOptions {
  generatedAtUtc?: string
}

export interface DiscoverySignatureConnectorManifest {
  connectorId?: string
  connectorType?: string
  displayName: string
  version?: string
  supportedSourceTypes?: string[]
  supportedDataSourceKinds?: string[]
  safeMetadataFields?: string[]
  sampleEntityMappings?: Array<{
    sourceField: string
    semanticAttribute: string
    description?: string
  }>
  capabilities?: string[]
}

export interface DiscoverySignatureApproval {
  approved: true
  approvedBy: string
  approvedAtUtc: string
  approvalReference?: string
}

export interface DiscoverySignature {
  schemaVersion: typeof DISCOVERY_SIGNATURE_SCHEMA_ID
  companyType: string
  targetWorkflow: string
  sourceSystemFamilies: string[]
  connectorManifests: DiscoverySignatureConnectorManifest[]
  conversionPoints: string[]
  governanceNotes: string[]
  closestSyntheticDomain: string
  approvedForSyntheticDemoBuild: DiscoverySignatureApproval
}

export interface DiscoverySignatureValidationResult {
  isValid: boolean
  errors: string[]
}

export interface DiscoverySignatureExportResult {
  exported: true
  path: string
  byteLength: number
}

export interface ApprovedHandoffConfig {
  approved: true
  endpoint: string
  allowedPayload: typeof DISCOVERY_SIGNATURE_SCHEMA_ID
  approvalReference: string
}

export interface ApprovedHandoffOptions {
  allowHandoff: boolean
  consent: boolean
  endpoint?: string
  config?: ApprovedHandoffConfig
}

export interface HandoffResult {
  enabled: boolean
  submitted: boolean
  reason?: string
  endpoint?: string
  status?: number
  ok?: boolean
}

export type DiscoveryHandoffFetch = (
  input: string,
  init: { method: 'POST'; headers: Record<string, string>; body: string },
) => Promise<{ status: number; ok: boolean }>

const defaultHandoffFetch: DiscoveryHandoffFetch = async (input, init) => {
  const response = await fetch(input, init)
  return { status: response.status, ok: response.ok }
}

export class DiscoverySignatureValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(`Discovery Signature validation failed: ${issues.join('; ')}`)
    this.name = 'DiscoverySignatureValidationError'
  }
}

const TOP_LEVEL_KEYS = new Set([
  'schemaVersion',
  'companyType',
  'targetWorkflow',
  'sourceSystemFamilies',
  'connectorManifests',
  'conversionPoints',
  'governanceNotes',
  'closestSyntheticDomain',
  'approvedForSyntheticDemoBuild',
])

const CONNECTOR_MANIFEST_KEYS = new Set([
  'connectorId',
  'connectorType',
  'displayName',
  'version',
  'supportedSourceTypes',
  'supportedDataSourceKinds',
  'safeMetadataFields',
  'sampleEntityMappings',
  'capabilities',
])

const APPROVAL_KEYS = new Set(['approved', 'approvedBy', 'approvedAtUtc', 'approvalReference'])
const MAPPING_KEYS = new Set(['sourceField', 'semanticAttribute', 'description'])

const FORBIDDEN_KEY_PATTERNS = [
  /^records?$/i,
  /^rows?$/i,
  /^query(?:[-_ ]?(?:output|results?))?$/i,
  /^credentials?$/i,
  /^tokens?$/i,
  /^connection[-_ ]?strings?$/i,
  /^raw(?:[-_ ]?(?:payloads?|data|exports?))?$/i,
  /^source[-_ ]?documents?$/i,
  /^pii$/i,
  /^vectors?$/i,
  /^embeddings?$/i,
  /^prompt[-_ ]?packages?$/i,
  /^local[-_ ]?logs?$/i,
  /^logs?$/i,
]

const SECRET_KEY_PATTERN = /(?:password|secret|token|api[-_ ]?key|credential|private[-_ ]?key|connection[-_ ]?string|client[-_ ]?secret|bearer|oauth)/i
const PERSONAL_VALUE_KEY_PATTERN = /^(?:customer|contact|user)?(?:email|phone|address|fullName|firstName|lastName|externalUserId|subjectId|customerId|userId)$/i
const EMAIL_VALUE_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
const BEARER_VALUE_PATTERN = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/i
const JWT_VALUE_PATTERN = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/
const WINDOWS_PATH_PATTERN = /[A-Z]:[\\/][^\s"']+/i
const UNIX_PRIVATE_PATH_PATTERN = /\/(?:home|Users|tmp|var|etc|root|opt|mnt|Volumes)\/[^\s"']+/i
const CREDIT_CARD_LIKE_PATTERN = /\b(?:\d[ -]*?){13,19}\b/
const LONG_SECRET_LIKE_PATTERN = /\b[A-Za-z0-9+/]{48,}={0,2}\b/
const URL_QUERY_SECRET_NAME_PATTERN = /(?:token|secret|key|credential|password|signature|sig|code)/i
const RAW_RECORD_ARRAY_KEYS = new Set(['id', 'email', 'phone', 'externalUserId', 'subjectId', 'customerId', 'userId', 'payload', 'createdAt', 'updatedAt'])

export function createDiscoverySignature(
  signature: unknown,
  _options: DiscoverySignatureOptions = {},
): DiscoverySignature {
  const validation = validateDiscoverySignature(signature)
  if (!validation.isValid) {
    throw new DiscoverySignatureValidationError(validation.errors)
  }

  return canonicalise(signature) as DiscoverySignature
}

export function validateDiscoverySignature(signature: unknown): DiscoverySignatureValidationResult {
  const errors: string[] = []
  if (!isPlainObject(signature)) {
    return { isValid: false, errors: ['Discovery Signature must be a JSON object.'] }
  }

  validateAllowedKeys(signature, TOP_LEVEL_KEYS, '$', errors)
  requireLiteral(signature, 'schemaVersion', DISCOVERY_SIGNATURE_SCHEMA_ID, '$', errors)
  requireString(signature, 'companyType', '$', errors)
  requireString(signature, 'targetWorkflow', '$', errors)
  requireString(signature, 'closestSyntheticDomain', '$', errors)
  requireStringArray(signature, 'sourceSystemFamilies', '$', errors)
  requireStringArray(signature, 'conversionPoints', '$', errors)
  requireStringArray(signature, 'governanceNotes', '$', errors)
  validateConnectorManifests(signature['connectorManifests'], '$.connectorManifests', errors)
  validateApproval(signature['approvedForSyntheticDemoBuild'], '$.approvedForSyntheticDemoBuild', errors)
  scanUnsafeMetadata(signature, '$', errors)

  return { isValid: errors.length === 0, errors: [...new Set(errors.map(sanitiseDiagnostic))] }
}

export const validateApprovedMetadata = validateDiscoverySignature

export async function exportDiscoverySignature(
  signature: DiscoverySignature,
  filePath: string,
): Promise<DiscoverySignatureExportResult> {
  const validation = validateDiscoverySignature(signature)
  if (!validation.isValid) {
    throw new DiscoverySignatureValidationError(validation.errors)
  }

  assertDiscoveryWritableFile(filePath)
  const resolvedPath = path.resolve(filePath)
  const output = `${JSON.stringify(canonicalise(signature), null, 2)}\n`
  await writeFile(resolvedPath, output, 'utf-8')

  return {
    exported: true,
    path: resolvedPath,
    byteLength: Buffer.byteLength(output, 'utf-8'),
  }
}

export function validateApprovedHandoff(options: ApprovedHandoffOptions): HandoffResult {
  if (!options.allowHandoff) {
    return {
      enabled: false,
      submitted: false,
      reason: 'Network handoff is disabled. Configure an approved endpoint and pass explicit handoff consent.',
    }
  }

  if (!options.consent) {
    return {
      enabled: false,
      submitted: false,
      reason: 'Network handoff requires the explicit --consent-handoff flag.',
    }
  }

  if (!isNonEmptyString(options.endpoint)) {
    return { enabled: false, submitted: false, reason: 'Missing approved handoff endpoint.' }
  }

  if (options.config === undefined) {
    return { enabled: false, submitted: false, reason: 'Missing approved handoff config.' }
  }

  const endpoint = options.endpoint
  if (!isSafeHttpsUrl(endpoint)) {
    return {
      enabled: false,
      submitted: false,
      reason: 'Approved handoff endpoint must be an https URL without embedded credentials or token query parameters.',
    }
  }

  if (options.config.approved !== true) {
    return { enabled: false, submitted: false, reason: 'Handoff config is not approved.' }
  }

  if (options.config.allowedPayload !== DISCOVERY_SIGNATURE_SCHEMA_ID) {
    return { enabled: false, submitted: false, reason: 'Handoff config does not allow KynticAI Discovery Signature v1 payloads.' }
  }

  if (options.config.endpoint !== endpoint) {
    return { enabled: false, submitted: false, reason: 'Handoff endpoint does not match the approved config.' }
  }

  if (!isNonEmptyString(options.config.approvalReference)) {
    return { enabled: false, submitted: false, reason: 'Handoff config is missing an approval reference.' }
  }

  return { enabled: true, submitted: false, endpoint }
}

export async function submitApprovedHandoff(
  signature: DiscoverySignature,
  options: ApprovedHandoffOptions,
  fetchImpl: DiscoveryHandoffFetch = defaultHandoffFetch,
): Promise<HandoffResult> {
  const signatureValidation = validateDiscoverySignature(signature)
  if (!signatureValidation.isValid) {
    return {
      enabled: false,
      submitted: false,
      reason: `Discovery Signature validation failed: ${signatureValidation.errors.join('; ')}`,
    }
  }

  const validation = validateApprovedHandoff(options)
  if (!validation.enabled || options.endpoint === undefined) {
    return validation
  }

  const response = await fetchImpl(options.endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(canonicalise(signature)),
  })

  return {
    enabled: true,
    submitted: true,
    endpoint: options.endpoint,
    status: response.status,
    ok: response.ok,
  }
}

function validateConnectorManifests(value: unknown, pathLabel: string, errors: string[]): void {
  if (!Array.isArray(value)) {
    errors.push(`${pathLabel} must be an array.`)
    return
  }
  if (value.length === 0) {
    errors.push(`${pathLabel} must include at least one connector manifest summary.`)
  }
  if (value.length > 25) {
    errors.push(`${pathLabel} contains too many connector manifest summaries.`)
  }

  value.forEach((item, index) => {
    const itemPath = `${pathLabel}[${index}]`
    if (!isPlainObject(item)) {
      errors.push(`${itemPath} must be an object.`)
      return
    }

    validateAllowedKeys(item, CONNECTOR_MANIFEST_KEYS, itemPath, errors)
    if (!isNonEmptyString(item['connectorId']) && !isNonEmptyString(item['connectorType'])) {
      errors.push(`${itemPath} must include connectorId or connectorType.`)
    }
    requireString(item, 'displayName', itemPath, errors)
    for (const key of ['supportedSourceTypes', 'supportedDataSourceKinds', 'safeMetadataFields', 'capabilities']) {
      if (item[key] !== undefined) {
        requireStringArray(item, key, itemPath, errors)
      }
    }
    if (Array.isArray(item['safeMetadataFields'])) {
      for (const field of item['safeMetadataFields']) {
        if (typeof field === 'string' && SECRET_KEY_PATTERN.test(field)) {
          errors.push(`${itemPath}.safeMetadataFields contains a credential-like field name.`)
        }
      }
    }
    validateSampleEntityMappings(item['sampleEntityMappings'], `${itemPath}.sampleEntityMappings`, errors)
  })
}

function validateSampleEntityMappings(value: unknown, pathLabel: string, errors: string[]): void {
  if (value === undefined) return
  if (!Array.isArray(value)) {
    errors.push(`${pathLabel} must be an array when present.`)
    return
  }
  if (value.length > 80) {
    errors.push(`${pathLabel} contains too many sample mappings.`)
  }

  value.forEach((item, index) => {
    const itemPath = `${pathLabel}[${index}]`
    if (!isPlainObject(item)) {
      errors.push(`${itemPath} must be an object.`)
      return
    }

    validateAllowedKeys(item, MAPPING_KEYS, itemPath, errors)
    requireString(item, 'sourceField', itemPath, errors)
    requireString(item, 'semanticAttribute', itemPath, errors)
    if (item['description'] !== undefined) {
      requireString(item, 'description', itemPath, errors)
    }
  })
}

function validateApproval(value: unknown, pathLabel: string, errors: string[]): void {
  if (!isPlainObject(value)) {
    errors.push(`${pathLabel} must be an object.`)
    return
  }

  validateAllowedKeys(value, APPROVAL_KEYS, pathLabel, errors)
  if (value['approved'] !== true) {
    errors.push(`${pathLabel}.approved must be true.`)
  }
  requireString(value, 'approvedBy', pathLabel, errors)
  requireString(value, 'approvedAtUtc', pathLabel, errors)
  if (value['approvalReference'] !== undefined) {
    requireString(value, 'approvalReference', pathLabel, errors)
  }
}

function validateAllowedKeys(
  value: Record<string, unknown>,
  allowedKeys: Set<string>,
  pathLabel: string,
  errors: string[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      errors.push(`${pathLabel}.${key} is not allowed in ${DISCOVERY_SIGNATURE_SCHEMA_ID}.`)
    }
  }
}

function requireLiteral(
  value: Record<string, unknown>,
  key: string,
  expected: string,
  pathLabel: string,
  errors: string[],
): void {
  if (value[key] !== expected) {
    errors.push(`${pathLabel}.${key} must be ${expected}.`)
  }
}

function requireString(
  value: Record<string, unknown>,
  key: string,
  pathLabel: string,
  errors: string[],
): void {
  const child = value[key]
  if (!isNonEmptyString(child)) {
    errors.push(`${pathLabel}.${key} must be a non-empty string.`)
    return
  }

  scanStringValue(child, `${pathLabel}.${key}`, errors)
}

function requireStringArray(
  value: Record<string, unknown>,
  key: string,
  pathLabel: string,
  errors: string[],
): void {
  const child = value[key]
  if (!Array.isArray(child)) {
    errors.push(`${pathLabel}.${key} must be an array of strings.`)
    return
  }
  if (child.length === 0) {
    errors.push(`${pathLabel}.${key} must include at least one value.`)
  }
  if (child.length > 100) {
    errors.push(`${pathLabel}.${key} contains too many values.`)
  }

  child.forEach((item, index) => {
    if (!isNonEmptyString(item)) {
      errors.push(`${pathLabel}.${key}[${index}] must be a non-empty string.`)
      return
    }

    scanStringValue(item, `${pathLabel}.${key}[${index}]`, errors)
  })
}

function scanUnsafeMetadata(value: unknown, pathLabel: string, errors: string[]): void {
  if (typeof value === 'string') {
    scanStringValue(value, pathLabel, errors)
    return
  }

  if (Array.isArray(value)) {
    if (looksLikeRawRecordArray(value)) {
      errors.push(`${pathLabel} looks like raw record output, not Discovery Signature metadata.`)
      return
    }
    value.forEach((item, index) => scanUnsafeMetadata(item, `${pathLabel}[${index}]`, errors))
    return
  }

  if (!isPlainObject(value)) {
    return
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${pathLabel}.${key}`
    if (FORBIDDEN_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
      errors.push(`${childPath} is forbidden in a Discovery Signature.`)
      continue
    }
    if (SECRET_KEY_PATTERN.test(key)) {
      errors.push(`${childPath} looks like a credential field name.`)
      continue
    }
    if (PERSONAL_VALUE_KEY_PATTERN.test(key) && typeof child === 'string') {
      errors.push(`${childPath} looks like a personal data value.`)
      continue
    }

    scanUnsafeMetadata(child, childPath, errors)
  }
}

function scanStringValue(value: string, pathLabel: string, errors: string[]): void {
  if (value.length > 800) {
    errors.push(`${pathLabel} is too long for a Discovery Signature metadata value.`)
  }
  if (EMAIL_VALUE_PATTERN.test(value)) {
    errors.push(`${pathLabel} contains an email address value.`)
  }
  if (BEARER_VALUE_PATTERN.test(value) || JWT_VALUE_PATTERN.test(value) || LONG_SECRET_LIKE_PATTERN.test(value)) {
    errors.push(`${pathLabel} contains a token-like value.`)
  }
  if (WINDOWS_PATH_PATTERN.test(value) || UNIX_PRIVATE_PATH_PATTERN.test(value)) {
    errors.push(`${pathLabel} contains an absolute local path ([REDACTED_PATH]).`)
  }
  if (CREDIT_CARD_LIKE_PATTERN.test(value.replace(/\s/g, '')) && value.replace(/\D/g, '').length >= 13) {
    errors.push(`${pathLabel} contains a payment-card-like value.`)
  }
  if (looksLikeUnsafeUrl(value)) {
    errors.push(`${pathLabel} contains a URL with embedded credentials or token-like query parameters.`)
  }
}

function looksLikeRawRecordArray(value: unknown[]): boolean {
  if (value.length < 2 || value.length > 200) {
    return value.length > 200
  }
  if (!value.every(isPlainObject)) {
    return false
  }

  const objects = value as Array<Record<string, unknown>>
  const averageKeyCount = objects.reduce((sum, item) => sum + Object.keys(item).length, 0) / objects.length
  const hasRecordKeys = objects.some((item) => Object.keys(item).some((key) => RAW_RECORD_ARRAY_KEYS.has(key)))
  return averageKeyCount >= 3 && hasRecordKeys
}

function looksLikeUnsafeUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) {
    return false
  }

  try {
    const url = new URL(value)
    if (url.username.length > 0 || url.password.length > 0) {
      return true
    }
    for (const [key, queryValue] of url.searchParams.entries()) {
      if (URL_QUERY_SECRET_NAME_PATTERN.test(key)) {
        return true
      }
      if (BEARER_VALUE_PATTERN.test(queryValue) || JWT_VALUE_PATTERN.test(queryValue) || LONG_SECRET_LIKE_PATTERN.test(queryValue)) {
        return true
      }
    }
    return false
  } catch {
    return false
  }
}

function canonicalise(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalise(item))
    if (items.every((item) => item === null || ['boolean', 'number', 'string'].includes(typeof item))) {
      return [...items].sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)))
    }

    return items
  }

  if (!isPlainObject(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, child]) => child !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalise(child)]),
  )
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isSafeHttpsUrl(value: string): boolean {
  if (looksLikeUnsafeUrl(value)) {
    return false
  }

  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function sanitiseDiagnostic(value: string): string {
  return value
    .replace(WINDOWS_PATH_PATTERN, '[REDACTED_PATH]')
    .replace(UNIX_PRIVATE_PATH_PATTERN, '[REDACTED_PATH]')
    .replace(BEARER_VALUE_PATTERN, '[REDACTED_TOKEN]')
    .replace(JWT_VALUE_PATTERN, '[REDACTED_TOKEN]')
    .replace(LONG_SECRET_LIKE_PATTERN, '[REDACTED_TOKEN]')
}
