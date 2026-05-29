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
  const normalisedBaseUrl = baseUrl.replace(/\/+$/, '')
  return `${normalisedBaseUrl}/api/v1/events/source-system?tenantSlug=${encodeURIComponent(tenantSlug)}`
}

export function buildScoutEvent(
  item: KynticAiItemInput,
  itemIndex: number,
  options: KynticAiEventMappingOptions,
): ScoutSourceSystemEvent {
  const observedAtUtc = toIsoTimestamp(readString(item, options.observedAtField) ?? new Date().toISOString())
  const eventId =
    readString(item, options.eventIdField) ??
    buildDeterministicFallbackEventId(options.sourceSystem, options.eventType, itemIndex, observedAtUtc)

  return {
    eventId,
    workspaceSlug: emptyToUndefined(options.workspaceSlug),
    sourceSystem: options.sourceSystem,
    eventType: options.eventType,
    externalUserId: readString(item, options.externalUserIdField),
    externalAccountId: readString(item, options.externalAccountIdField),
    observedAtUtc,
    payload: buildPayload(item, options),
  }
}

function buildPayload(
  item: KynticAiItemInput,
  options: KynticAiEventMappingOptions,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...item }

  if (options.includeN8nMetadata) {
    payload.metadata = {
      ...(isRecord(payload.metadata) ? payload.metadata : {}),
      n8nWorkflowId: emptyToUndefined(options.workflowId),
      n8nExecutionId: emptyToUndefined(options.executionId),
    }
  }

  return payload
}

function buildDeterministicFallbackEventId(
  sourceSystem: string,
  eventType: string,
  itemIndex: number,
  observedAtUtc: string,
): string {
  const safeSource = slugify(sourceSystem)
  const safeEvent = slugify(eventType)
  const safeTime = observedAtUtc.replace(/[^0-9]/g, '').slice(0, 14)
  return `n8n-${safeSource}-${safeEvent}-${safeTime}-${itemIndex}`
}

function readString(item: KynticAiItemInput, fieldName?: string): string | undefined {
  const key = emptyToUndefined(fieldName)
  if (!key) return undefined

  const value = item[key]
  if (typeof value === 'string') return emptyToUndefined(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return undefined
}

function toIsoTimestamp(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid observedAtUtc value: ${value}`)
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
