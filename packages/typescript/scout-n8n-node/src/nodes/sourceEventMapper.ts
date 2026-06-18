/**
 * Maps raw n8n input items into Scout SourceSystemEvent payloads.
 *
 * The mapper applies field-level validation, tenant/workspace
 * identifier checks, and sensitive-key redaction before the
 * payload is sent to the Scout API.
 */

import { validateTenantSlug, validateWorkspaceSlug } from '../validation/identifiers.js'
import { validateMappingFields } from '../validation/fields.js'
import { redactSensitiveKeys } from '../validation/redaction.js'

export interface SourceEventInput {
  tenantSlug: string
  workspaceSlug?: string | undefined
  sourceSystem: string
  eventType: string
  externalUserId?: string | undefined
  externalAccountId?: string | undefined
  payload?: Record<string, unknown> | undefined
  mappingFields?: readonly string[] | undefined
  observedAtUtc?: string | undefined
}

export interface SourceEventPayload {
  tenantSlug: string
  workspaceSlug?: string | undefined
  sourceSystem: string
  eventType: string
  externalUserId?: string | undefined
  externalAccountId?: string | undefined
  payload?: Record<string, unknown> | undefined
  observedAtUtc?: string | undefined
}

export interface MapResult {
  ok: boolean
  payload?: SourceEventPayload
  redactedPayload?: unknown
  error?: string
}

export function buildSourceSystemEventUrl(sanitisedBaseUrl: string, tenantSlug: string): string {
  const tenantResult = validateTenantSlug(tenantSlug)
  if (!tenantResult.valid) {
    throw new Error(tenantResult.error ?? 'Tenant slug is invalid.')
  }

  return `${sanitisedBaseUrl.replace(/\/+$/, '')}/api/v1/events/source-system?tenantSlug=${encodeURIComponent(tenantSlug)}`
}

export function mapSourceEvent(input: SourceEventInput): MapResult {
  const tenantResult = validateTenantSlug(input.tenantSlug)
  if (!tenantResult.valid) {
    return { ok: false, error: tenantResult.error! }
  }

  if (input.workspaceSlug !== undefined && input.workspaceSlug !== '') {
    const wsResult = validateWorkspaceSlug(input.workspaceSlug)
    if (!wsResult.valid) {
      return { ok: false, error: wsResult.error! }
    }
  }

  if (input.sourceSystem.trim().length === 0) {
    return { ok: false, error: 'sourceSystem must not be empty.' }
  }

  if (input.eventType.trim().length === 0) {
    return { ok: false, error: 'eventType must not be empty.' }
  }

  if (input.mappingFields !== undefined && input.mappingFields.length > 0) {
    const fieldsResult = validateMappingFields(input.mappingFields)
    if (!fieldsResult.valid) {
      return { ok: false, error: fieldsResult.error! }
    }
  }

  const payload: SourceEventPayload = {
    tenantSlug: input.tenantSlug,
    sourceSystem: input.sourceSystem.trim(),
    eventType: input.eventType.trim(),
  }

  if (input.workspaceSlug !== undefined && input.workspaceSlug !== '') {
    payload.workspaceSlug = input.workspaceSlug
  }
  if (input.externalUserId !== undefined && input.externalUserId !== '') {
    payload.externalUserId = input.externalUserId
  }
  if (input.externalAccountId !== undefined && input.externalAccountId !== '') {
    payload.externalAccountId = input.externalAccountId
  }
  if (input.payload !== undefined) {
    payload.payload = input.payload
  }
  if (input.observedAtUtc !== undefined && input.observedAtUtc !== '') {
    payload.observedAtUtc = input.observedAtUtc
  }

  const redactedPayload = redactSensitiveKeys(payload)

  return { ok: true, payload, redactedPayload }
}
