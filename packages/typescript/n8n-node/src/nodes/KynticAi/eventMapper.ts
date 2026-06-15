export const REDACTED_VALUE = '[REDACTED]'

const TENANT_SLUG_MAX_LENGTH = 100
const WORKSPACE_SLUG_MAX_LENGTH = 100
const EVENT_ID_MAX_LENGTH = 160
const SOURCE_SYSTEM_MAX_LENGTH = 120
const EVENT_TYPE_MAX_LENGTH = 160
const EXTERNAL_ID_MAX_LENGTH = 200
const FIELD_NAME_MAX_LENGTH = 200
const CREDENTIAL_VALUE_MAX_LENGTH = 4096

const SENSITIVE_KEY_PATTERN =
  /api[-_ ]?key|apikey|token|secret|password|passphrase|authorization|cookie|client[-_ ]?secret|clientsecret|access[-_ ]?token|accesstoken|refresh[-_ ]?token|refreshtoken|private[-_ ]?key|privatekey|credential|signature/i

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/

export interface KynticAiCredentials {
  baseUrl: string
  apiClientId: string
  apiKey: string
}

export interface KynticAiItemInput {
  [key: string]: unknown
}

export interface KynticAiEventMappingOptions {
  eventIdField?: string
  workspaceSlug?: string
  sourceSystem: string
  eventType: string
  externalUserIdField?: string
  externalAccountIdField?: string
  observedAtField?: string
  includeN8nMetadata?: boolean
  workflowId?: string
  executionId?: string
}

export interface ScoutSourceSystemEvent {
  eventId: string
  workspaceSlug?: string
  sourceSystem: string
  eventType: string
  payload: Record<string, unknown>
  externalUserId?: string
  externalAccountId?: string
  observedAtUtc: string
}

export function buildEventUrl(baseUrl: string, tenantSlug: string): string {
  const normalisedBaseUrl = normaliseBaseUrl(baseUrl)
  const normalisedTenantSlug = normaliseSlug('Tenant slug', tenantSlug, TENANT_SLUG_MAX_LENGTH)
  return `${normalisedBaseUrl}/api/v1/events/source-system?tenantSlug=${encodeURIComponent(normalisedTenantSlug)}`
}

export function validateCredentials(credentials: Partial<KynticAiCredentials>): KynticAiCredentials {
  return {
    baseUrl: normaliseBaseUrl(credentials.baseUrl),
    apiClientId: requireString('API client ID', credentials.apiClientId, CREDENTIAL_VALUE_MAX_LENGTH),
    apiKey: requireString('API key', credentials.apiKey, CREDENTIAL_VALUE_MAX_LENGTH),
  }
}

export function validateMappingOptions(options: KynticAiEventMappingOptions): KynticAiEventMappingOptions {
  return {
    eventIdField: normaliseFieldName('Event ID field', options.eventIdField),
    workspaceSlug: normaliseOptionalSlug('Workspace slug', options.workspaceSlug, WORKSPACE_SLUG_MAX_LENGTH),
    sourceSystem: requireString('Source system', options.sourceSystem, SOURCE_SYSTEM_MAX_LENGTH),
    eventType: requireString('Event type', options.eventType, EVENT_TYPE_MAX_LENGTH),
    externalUserIdField: normaliseFieldName('External user ID field', options.externalUserIdField),
    externalAccountIdField: normaliseFieldName('External account ID field', options.externalAccountIdField),
    observedAtField: normaliseFieldName('Observed at field', options.observedAtField),
    includeN8nMetadata: options.includeN8nMetadata === true,
    workflowId: normaliseOptionalString('n8n workflow ID', options.workflowId, EXTERNAL_ID_MAX_LENGTH),
    executionId: normaliseOptionalString('n8n execution ID', options.executionId, EXTERNAL_ID_MAX_LENGTH),
  }
}

export function buildScoutEvent(
  item: KynticAiItemInput,
  itemIndex: number,
  options: KynticAiEventMappingOptions,
): ScoutSourceSystemEvent {
  const validOptions = validateMappingOptions(options)
  const sourceItem = requireRecord('Input item JSON', item)
  const observedAtUtc = toIsoTimestamp(
    readBoundedString(sourceItem, validOptions.observedAtField, 'Observed at field value', 80) ??
      new Date().toISOString(),
  )
  const eventId =
    readBoundedString(sourceItem, validOptions.eventIdField, 'Event ID field value', EVENT_ID_MAX_LENGTH) ??
    buildDeterministicFallbackEventId(validOptions.sourceSystem, validOptions.eventType, itemIndex, observedAtUtc)

  return {
    eventId,
    workspaceSlug: validOptions.workspaceSlug,
    sourceSystem: validOptions.sourceSystem,
    eventType: validOptions.eventType,
    externalUserId: readBoundedString(
      sourceItem,
      validOptions.externalUserIdField,
      'External user ID field value',
      EXTERNAL_ID_MAX_LENGTH,
    ),
    externalAccountId: readBoundedString(
      sourceItem,
      validOptions.externalAccountIdField,
      'External account ID field value',
      EXTERNAL_ID_MAX_LENGTH,
    ),
    observedAtUtc,
    payload: buildPayload(sourceItem, validOptions),
  }
}

export function redactSensitiveData(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value, createRedactingReplacer({ tolerateUnsafeValues: true })))
  } catch {
    return REDACTED_VALUE
  }
}

export function formatSafeHttpError(error: unknown): string {
  const statusCode = readStatusCode(error)
  const errorCode = readSafeErrorCode(error)
  const details = [statusCode ? `HTTP ${statusCode}` : undefined, errorCode ? `code ${errorCode}` : undefined]
    .filter(Boolean)
    .join(', ')

  if (details) {
    return `KynticAI Scout event ingest failed (${details}).`
  }

  return 'KynticAI Scout event ingest failed before a response was accepted.'
}

function buildPayload(
  item: KynticAiItemInput,
  options: KynticAiEventMappingOptions,
): Record<string, unknown> {
  const payload = toJsonPayloadObject(item)

  if (options.includeN8nMetadata) {
    payload.metadata = {
      ...(isRecord(payload.metadata) ? payload.metadata : {}),
      n8nWorkflowId: emptyToUndefined(options.workflowId),
      n8nExecutionId: emptyToUndefined(options.executionId),
    }
  }

  return payload
}

function toJsonPayloadObject(item: KynticAiItemInput): Record<string, unknown> {
  const serialised = JSON.stringify(item, createRedactingReplacer({ tolerateUnsafeValues: false }))
  if (!serialised) {
    throw new Error('Input item JSON must be serialisable as a JSON object.')
  }

  const parsed = JSON.parse(serialised)
  if (!isRecord(parsed)) {
    throw new Error('Input item JSON must be a JSON object.')
  }

  return parsed
}

function createRedactingReplacer(options: { tolerateUnsafeValues: boolean }) {
  const seen = new WeakSet<object>()

  return (key: string, value: unknown): unknown => {
    if (key && isSensitiveKey(key)) {
      return REDACTED_VALUE
    }

    if (typeof value === 'bigint') {
      if (options.tolerateUnsafeValues) return value.toString()
      throw new Error('Input item JSON contains a BigInt value, which cannot be sent as JSON.')
    }

    if (typeof value === 'function' || typeof value === 'symbol') {
      if (options.tolerateUnsafeValues) return undefined
      throw new Error('Input item JSON contains a non-JSON value.')
    }

    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        if (options.tolerateUnsafeValues) return '[Circular]'
        throw new Error('Input item JSON contains a circular reference.')
      }

      seen.add(value)
    }

    return value
  }
}

function buildDeterministicFallbackEventId(
  sourceSystem: string,
  eventType: string,
  itemIndex: number,
  observedAtUtc: string,
): string {
  const safeSource = slugify(sourceSystem) || 'source'
  const safeEvent = slugify(eventType) || 'event'
  const safeTime = observedAtUtc.replace(/[^0-9]/g, '').slice(0, 14)
  return `n8n-${safeSource}-${safeEvent}-${safeTime}-${itemIndex}`
}

function normaliseBaseUrl(value: unknown): string {
  const rawValue = requireString('Base URL', value, CREDENTIAL_VALUE_MAX_LENGTH)
  let parsed: URL

  try {
    parsed = new URL(rawValue)
  } catch {
    throw new Error('Base URL must be a valid absolute HTTP or HTTPS URL.')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Base URL must use HTTP or HTTPS.')
  }

  if (parsed.username || parsed.password) {
    throw new Error('Base URL must not include credentials.')
  }

  if (parsed.search || parsed.hash) {
    throw new Error('Base URL must not include a query string or fragment.')
  }

  return parsed.toString().replace(/\/+$/, '')
}

function normaliseOptionalSlug(label: string, value: unknown, maxLength: number): string | undefined {
  const normalised = normaliseOptionalString(label, value, maxLength)?.toLowerCase()
  if (!normalised) return undefined
  return validateSlug(label, normalised)
}

function normaliseSlug(label: string, value: unknown, maxLength: number): string {
  return validateSlug(label, requireString(label, value, maxLength).toLowerCase())
}

function validateSlug(label: string, value: string): string {
  if (!SLUG_PATTERN.test(value)) {
    throw new Error(`${label} must use lowercase letters, numbers, and hyphens, without leading or trailing hyphens.`)
  }

  return value
}

function normaliseFieldName(label: string, value: unknown): string | undefined {
  const fieldName = normaliseOptionalString(label, value, FIELD_NAME_MAX_LENGTH)
  if (!fieldName) return undefined

  if (isSensitiveKey(fieldName)) {
    throw new Error(`${label} cannot target a field that looks like a credential or secret.`)
  }

  return fieldName
}

function readBoundedString(
  item: KynticAiItemInput,
  fieldName: string | undefined,
  label: string,
  maxLength: number,
): string | undefined {
  const value = readString(item, fieldName)
  if (value === undefined) return undefined
  return requireString(label, value, maxLength)
}

function readString(item: KynticAiItemInput, fieldName?: string): string | undefined {
  const key = emptyToUndefined(fieldName)
  if (!key) return undefined

  const value = item[key]
  if (typeof value === 'string') return emptyToUndefined(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return undefined
}

function requireString(label: string, value: unknown, maxLength: number): string {
  const normalised = normaliseOptionalString(label, value, maxLength)
  if (!normalised) {
    throw new Error(`${label} is required.`)
  }

  return normalised
}

function normaliseOptionalString(label: string, value: unknown, maxLength: number): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string.`)
  }

  const trimmed = value.trim()
  if (!trimmed) return undefined

  if (trimmed.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`)
  }

  return trimmed
}

function toIsoTimestamp(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Observed at field value must be a valid ISO 8601 timestamp.')
  }

  return parsed.toISOString()
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function emptyToUndefined(value?: string): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function requireRecord(label: string, value: unknown): KynticAiItemInput {
  if (!isRecord(value)) {
    throw new Error(`${label} must be a JSON object.`)
  }

  return value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key)
}

function readStatusCode(error: unknown): string | undefined {
  const value =
    readNestedValue(error, ['httpCode']) ??
    readNestedValue(error, ['statusCode']) ??
    readNestedValue(error, ['status']) ??
    readNestedValue(error, ['response', 'status']) ??
    readNestedValue(error, ['response', 'statusCode'])

  if (typeof value === 'number' && Number.isInteger(value)) return String(value)
  if (typeof value === 'string' && /^\d{3}$/.test(value)) return value
  return undefined
}

function readSafeErrorCode(error: unknown): string | undefined {
  const value =
    readNestedValue(error, ['code']) ??
    readNestedValue(error, ['error', 'code']) ??
    readNestedValue(error, ['response', 'data', 'error', 'code']) ??
    readNestedValue(error, ['response', 'body', 'error', 'code'])

  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!/^[a-z0-9_.:-]{1,80}$/i.test(trimmed)) return undefined
  if (isSensitiveKey(trimmed)) return undefined
  return trimmed
}

function readNestedValue(value: unknown, path: string[]): unknown {
  let current = value

  for (const segment of path) {
    if (!isRecord(current)) return undefined
    current = current[segment]
  }

  return current
}
