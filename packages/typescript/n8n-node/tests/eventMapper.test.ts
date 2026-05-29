import { describe, expect, it } from 'vitest'

import { buildEventUrl, buildScoutEvent } from '../src/nodes/KynticAi/eventMapper'

describe('KynticAI n8n event mapping', () => {
  it('maps input item fields to the Scout source-system event contract', () => {
    const event = buildScoutEvent(
      {
        id: 'evt-100',
        userId: 'user-123',
        accountId: 'acct-456',
        observed: '2026-05-29T09:10:11Z',
        health: 'green',
      },
      0,
      {
        eventIdField: 'id',
        workspaceSlug: 'primary',
        sourceSystem: 'n8n',
        eventType: 'source.n8n.event_received',
        externalUserIdField: 'userId',
        externalAccountIdField: 'accountId',
        observedAtField: 'observed',
        includeN8nMetadata: true,
        workflowId: 'wf-1',
        executionId: 'exec-1',
      },
    )

    expect(event).toMatchObject({
      eventId: 'evt-100',
      workspaceSlug: 'primary',
      sourceSystem: 'n8n',
      eventType: 'source.n8n.event_received',
      externalUserId: 'user-123',
      externalAccountId: 'acct-456',
      observedAtUtc: '2026-05-29T09:10:11.000Z',
      payload: {
        health: 'green',
        metadata: {
          n8nWorkflowId: 'wf-1',
          n8nExecutionId: 'exec-1',
        },
      },
    })
  })

  it('creates a deterministic fallback event id when no field is configured', () => {
    const event = buildScoutEvent(
      { value: 42 },
      3,
      {
        sourceSystem: 'Product Events',
        eventType: 'product_usage.updated',
        observedAtField: 'missing',
      },
    )

    expect(event.eventId).toMatch(/^n8n-product-events-product-usage-updated-\d{14}-3$/)
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
    ).toThrow('Invalid observedAtUtc value')
  })

  it('builds the scoped Scout event URL without changing the base URL path', () => {
    expect(buildEventUrl('https://scout.example.test/', 'demo tenant')).toBe(
      'https://scout.example.test/api/v1/events/source-system?tenantSlug=demo%20tenant',
    )
  })
})
