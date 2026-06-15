import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mapSourceEvent } from '../src/nodes/sourceEventMapper.js'
import type { SourceEventInput } from '../src/nodes/sourceEventMapper.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixturesDir = join(__dirname, '..', 'fixtures', 'source-events')

function loadFixture(name: string): Record<string, unknown> {
  const raw = readFileSync(join(fixturesDir, name), 'utf-8')
  return JSON.parse(raw) as Record<string, unknown>
}

function fixtureToInput(fixture: Record<string, unknown>): SourceEventInput {
  return {
    tenantSlug: fixture['tenantSlug'] as string,
    workspaceSlug: fixture['workspaceSlug'] as string | undefined,
    sourceSystem: fixture['sourceSystem'] as string,
    eventType: fixture['eventType'] as string,
    externalUserId: fixture['externalUserId'] as string | undefined,
    externalAccountId: fixture['externalAccountId'] as string | undefined,
    payload: fixture['payload'] as Record<string, unknown> | undefined,
    mappingFields: fixture['mappingFields'] as string[] | undefined,
    observedAtUtc: fixture['observedAtUtc'] as string | undefined,
  }
}

describe('source event mapping — fixture-based', () => {
  describe('valid fixtures', () => {
    it('maps CRM deal-updated event', () => {
      const fixture = loadFixture('valid-crm-deal-updated.json')
      const result = mapSourceEvent(fixtureToInput(fixture))
      expect(result.ok).toBe(true)
      expect(result.payload!.tenantSlug).toBe('demo')
      expect(result.payload!.sourceSystem).toBe('crm')
      expect(result.payload!.eventType).toBe('source.crm.deal_updated')
      expect(result.payload!.externalUserId).toBe('usr-42')
      expect(result.payload!.externalAccountId).toBe('acc-100')
      expect(result.payload!.payload).toBeDefined()
      expect(result.payload!.observedAtUtc).toBe('2026-06-15T10:00:00Z')
    })

    it('maps product usage rollup event', () => {
      const fixture = loadFixture('valid-product-usage-rollup.json')
      const result = mapSourceEvent(fixtureToInput(fixture))
      expect(result.ok).toBe(true)
      expect(result.payload!.sourceSystem).toBe('product')
      expect(result.payload!.eventType).toBe('source.product_usage.rollup_ready')
    })

    it('maps web page-view event with workspace', () => {
      const fixture = loadFixture('valid-web-page-view.json')
      const result = mapSourceEvent(fixtureToInput(fixture))
      expect(result.ok).toBe(true)
      expect(result.payload!.workspaceSlug).toBe('marketing')
    })

    it('maps billing renewal event', () => {
      const fixture = loadFixture('valid-billing-renewal.json')
      const result = mapSourceEvent(fixtureToInput(fixture))
      expect(result.ok).toBe(true)
      expect(result.payload!.tenantSlug).toBe('pilot-alpha')
      expect(result.payload!.sourceSystem).toBe('billing')
    })

    it('produces redacted output that hides sensitive payload keys', () => {
      const input: SourceEventInput = {
        tenantSlug: 'demo',
        sourceSystem: 'crm',
        eventType: 'source.crm.sync',
        payload: {
          contactName: 'Alice',
          api_key: 'sk-live-SECRET',
          notes: 'Follow up on renewal',
        },
      }
      const result = mapSourceEvent(input)
      expect(result.ok).toBe(true)
      const redacted = result.redactedPayload as Record<string, unknown>
      const redactedPayload = (redacted as Record<string, Record<string, unknown>>)['payload']!
      expect(redactedPayload['api_key']).toBe('[REDACTED]')
      expect(redactedPayload['contactName']).toBe('Alice')
    })
  })

  describe('invalid fixtures', () => {
    it('rejects event with secret mapping field', () => {
      const fixture = loadFixture('invalid-secret-in-payload.json')
      const result = mapSourceEvent(fixtureToInput(fixture))
      expect(result.ok).toBe(false)
      expect(result.error).toContain('api_key')
      expect(result.error).toContain('credential or secret')
    })

    it('rejects event with invalid tenant slug', () => {
      const fixture = loadFixture('invalid-bad-tenant.json')
      const result = mapSourceEvent(fixtureToInput(fixture))
      expect(result.ok).toBe(false)
      expect(result.error).toContain('lower-case')
    })
  })

  describe('edge cases', () => {
    it('rejects empty sourceSystem', () => {
      const result = mapSourceEvent({
        tenantSlug: 'demo',
        sourceSystem: '',
        eventType: 'source.test.event',
      })
      expect(result.ok).toBe(false)
      expect(result.error).toContain('sourceSystem')
    })

    it('rejects empty eventType', () => {
      const result = mapSourceEvent({
        tenantSlug: 'demo',
        sourceSystem: 'crm',
        eventType: '',
      })
      expect(result.ok).toBe(false)
      expect(result.error).toContain('eventType')
    })

    it('accepts event with no optional fields', () => {
      const result = mapSourceEvent({
        tenantSlug: 'demo',
        sourceSystem: 'crm',
        eventType: 'source.crm.ping',
      })
      expect(result.ok).toBe(true)
      expect(result.payload!.externalUserId).toBeUndefined()
      expect(result.payload!.externalAccountId).toBeUndefined()
      expect(result.payload!.payload).toBeUndefined()
      expect(result.payload!.workspaceSlug).toBeUndefined()
    })

    it('trims sourceSystem and eventType', () => {
      const result = mapSourceEvent({
        tenantSlug: 'demo',
        sourceSystem: '  crm  ',
        eventType: '  source.crm.event  ',
      })
      expect(result.ok).toBe(true)
      expect(result.payload!.sourceSystem).toBe('crm')
      expect(result.payload!.eventType).toBe('source.crm.event')
    })

    it('rejects invalid workspace slug', () => {
      const result = mapSourceEvent({
        tenantSlug: 'demo',
        workspaceSlug: 'BAD!!',
        sourceSystem: 'crm',
        eventType: 'source.crm.event',
      })
      expect(result.ok).toBe(false)
      expect(result.error).toContain('Workspace slug')
    })

    it('rejects multiple secret fields at once', () => {
      const result = mapSourceEvent({
        tenantSlug: 'demo',
        sourceSystem: 'crm',
        eventType: 'source.crm.event',
        mappingFields: ['name', 'password', 'email'],
      })
      expect(result.ok).toBe(false)
      expect(result.error).toContain('password')
    })
  })
})
