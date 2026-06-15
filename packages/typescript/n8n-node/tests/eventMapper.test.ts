import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  REDACTED_VALUE,
  buildEventUrl,
  buildScoutEvent,
  formatSafeHttpError,
  redactSensitiveData,
  validateCredentials,
  validateMappingOptions,
  type KynticAiItemInput,
  type ScoutSourceSystemEvent,
} from '../src/nodes/KynticAi/eventMapper'

const fixtureDir = path.join(__dirname, '..', 'fixtures')

function readFixture<T>(fileName: string): T {
  return JSON.parse(readFileSync(path.join(fixtureDir, fileName), 'utf8')) as T
}

describe('KynticAI n8n event mapping', () => {
  it('maps deterministic fixture input to the Scout source-system event contract', () => {
    const event = buildScoutEvent(readFixture<KynticAiItemInput>('source-event-item.json'), 0, {
      eventIdField: 'eventId',
      workspaceSlug: 'primary',
      sourceSystem: 'n8n',
      eventType: 'source.n8n.event_received',
      externalUserIdField: 'externalUserId',
      externalAccountIdField: 'externalAccountId',
      observedAtField: 'observedAtUtc',
      includeN8nMetadata: true,
      workflowId: 'wf-fixture',
      executionId: 'exec-fixture',
    })

    expect(event).toEqual(readFixture<ScoutSourceSystemEvent>('source-event-expected.json'))
  })

  it('creates a deterministic fallback event id when the observed timestamp is configured', () => {
    const event = buildScoutEvent(
      { observedAtUtc: '2026-05-29T09:10:11Z', value: 42 },
      3,
      {
        sourceSystem: 'Product Events',
        eventType: 'product_usage.updated',
        observedAtField: 'observedAtUtc',
      },
    )

    expect(event.eventId).toBe('n8n-product-events-product-usage-updated-20260529091011-3')
  })

  it('rejects invalid observed timestamps before sending to Scout', () => {
    expect(() =>
      buildScoutEvent(
        { observed: 'not-a-date' },
        0,
        {
          sourceSystem: 'n8n',
          eventType: 'source.n8n.event_received',
          observedAtField: 'observed',
        },
      ),
    ).toThrow('Observed at field value must be a valid ISO 8601 timestamp')
  })

  it('redacts sensitive payload fields recursively without mutating the source item', () => {
    const item = {
      value: 'kept',
      apiKey: 'source-api-key',
      nested: {
        accessToken: 'source-token',
      },
    }

    const event = buildScoutEvent(item, 0, {
      sourceSystem: 'n8n',
      eventType: 'source.n8n.event_received',
      observedAtField: 'missing',
    })

    expect(event.payload).toMatchObject({
      value: 'kept',
      apiKey: REDACTED_VALUE,
      nested: {
        accessToken: REDACTED_VALUE,
      },
    })
    expect(item.apiKey).toBe('source-api-key')
    expect(item.nested.accessToken).toBe('source-token')
  })

  it('rejects payloads that are not JSON-safe objects', () => {
    const circular: Record<string, unknown> = { value: 'loop' }
    circular.self = circular

    expect(() =>
      buildScoutEvent(circular, 0, {
        sourceSystem: 'n8n',
        eventType: 'source.n8n.event_received',
      }),
    ).toThrow('Input item JSON contains a circular reference')

    expect(() =>
      buildScoutEvent([] as unknown as KynticAiItemInput, 0, {
        sourceSystem: 'n8n',
        eventType: 'source.n8n.event_received',
      }),
    ).toThrow('Input item JSON must be a JSON object')
  })

  it('validates credentials without leaking credential values', () => {
    expect(validateCredentials({
      baseUrl: ' https://scout.example.test/base/ ',
      apiClientId: ' client-123 ',
      apiKey: ' local-secret ',
    })).toEqual({
      baseUrl: 'https://scout.example.test/base',
      apiClientId: 'client-123',
      apiKey: 'local-secret',
    })

    expect(() =>
      validateCredentials({
        baseUrl: 'https://user:secret@scout.example.test',
        apiClientId: 'client-123',
        apiKey: 'local-secret',
      }),
    ).toThrow('Base URL must not include credentials')
    expect(() =>
      validateCredentials({
        baseUrl: 'https://scout.example.test',
        apiClientId: 'client-123',
        apiKey: '',
      }),
    ).toThrow('API key is required')
  })

  it('validates mapping fields and rejects sensitive field references', () => {
    expect(validateMappingOptions({
      workspaceSlug: 'Primary',
      sourceSystem: 'n8n',
      eventType: 'source.n8n.event_received',
    })).toMatchObject({
      workspaceSlug: 'primary',
      sourceSystem: 'n8n',
      eventType: 'source.n8n.event_received',
    })

    expect(() =>
      validateMappingOptions({
        eventIdField: 'apiKey',
        sourceSystem: 'n8n',
        eventType: 'source.n8n.event_received',
      }),
    ).toThrow('Event ID field cannot target a field that looks like a credential or secret')
  })

  it('builds the scoped Scout event URL with a normalised tenant slug and base path', () => {
    expect(buildEventUrl('https://scout.example.test/base/', 'Demo-Tenant')).toBe(
      'https://scout.example.test/base/api/v1/events/source-system?tenantSlug=demo-tenant',
    )
  })

  it('formats safe HTTP errors without echoing secrets or payload fragments', () => {
    const message = formatSafeHttpError({
      response: {
        status: 401,
        data: {
          error: {
            code: 'auth.invalid',
            message: 'API key local-secret was rejected',
          },
        },
      },
    })

    expect(message).toBe('KynticAI Scout event ingest failed (HTTP 401, code auth.invalid).')
    expect(message).not.toContain('local-secret')
  })

  it('can redact arbitrary diagnostic objects before logging or assertion output', () => {
    expect(redactSensitiveData({
      headers: {
        authorization: 'Bearer local-secret',
        requestId: 'req-123',
      },
      body: {
        refreshToken: 'refresh-secret',
      },
    })).toEqual({
      headers: {
        authorization: REDACTED_VALUE,
        requestId: 'req-123',
      },
      body: {
        refreshToken: REDACTED_VALUE,
      },
    })
  })
})
