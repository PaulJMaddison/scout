import { describe, expect, it, vi } from 'vitest'
import { createContextLayerClient } from '../src/client.js'

describe('context layer TypeScript SDK', () => {
  it('users.getContext calls the v1 REST path and adds tracing/auth headers', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      expect(url).toBe('http://127.0.0.1:5198/api/v1/context/users/123?tenantSlug=demo')
      expect(init?.method).toBe('GET')
      const headers = init?.headers as Record<string, string>
      expect(headers.Authorization).toBe('Bearer token-123')
      expect(headers['X-Request-Id']).toBeTruthy()

      return new Response(
        JSON.stringify({
          snapshotId: 'snap-1',
          tenantSlug: 'demo',
          externalUserId: '123',
          fullName: 'Avery Stone',
          companyName: 'Larkspur Logistics Group',
          summary: 'High intent account.',
          overallConfidence: 0.91,
          generatedAtUtc: '2026-05-11T10:00:00Z',
          isStale: false,
          sourceSummary: null,
          history: [],
          facts: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const client = createContextLayerClient({
      baseUrl: 'http://127.0.0.1:5198',
      accessToken: 'token-123',
      fetch: fetchMock as typeof fetch,
    })

    const result = await client.users.getContext('demo', '123')

    expect(result?.externalUserId).toBe('123')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('tenant scoped client delegates to the same user context API', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          snapshotId: 'snap-1',
          tenantSlug: 'demo',
          externalUserId: '123',
          fullName: 'Avery Stone',
          companyName: 'Larkspur Logistics Group',
          summary: 'High intent account.',
          overallConfidence: 0.91,
          generatedAtUtc: '2026-05-11T10:00:00Z',
          isStale: false,
          sourceSummary: null,
          history: [],
          facts: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const client = createContextLayerClient({
      baseUrl: 'http://127.0.0.1:5198',
      fetch: fetchMock as typeof fetch,
    })

    const demo = client.forTenant('demo')
    const result = await demo.users.getContext('123')

    expect(demo.tenantSlug).toBe('demo')
    expect(result?.companyName).toBe('Larkspur Logistics Group')
  })

  it('accounts.getContext calls the account REST path', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input.toString()
      expect(url).toBe('http://127.0.0.1:5198/api/v1/context/accounts/ACC-123?tenantSlug=demo')

      return new Response(
        JSON.stringify({
          tenantSlug: 'demo',
          externalAccountId: 'ACC-123',
          accountName: 'Larkspur Logistics Group',
          domain: 'larkspur.example',
          industry: 'Logistics',
          segment: 'Enterprise',
          region: 'EMEA',
          lifecycleStage: 'customer',
          users: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const client = createContextLayerClient({
      baseUrl: 'http://127.0.0.1:5198',
      fetch: fetchMock as typeof fetch,
    })

    const result = await client.accounts.getContext('demo', 'ACC-123')

    expect(result?.externalAccountId).toBe('ACC-123')
  })

  it('snapshots.getById calls the v1 REST path without double prefixing', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input.toString()
      expect(url).toBe('http://127.0.0.1:5198/api/v1/context/snapshots/snap-1?tenantSlug=demo')

      return new Response(
        JSON.stringify({
          snapshotId: 'snap-1',
          tenantId: 'tenant-1',
          tenantSlug: 'demo',
          userProfileId: 'user-1',
          externalUserId: '123',
          fullName: 'Avery Stone',
          companyName: 'Larkspur Logistics Group',
          snapshotVersion: 3,
          summary: 'Snapshot summary.',
          overallConfidence: 0.91,
          generatedAtUtc: '2026-05-11T10:00:00Z',
          isStale: false,
          facts: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const client = createContextLayerClient({
      baseUrl: 'http://127.0.0.1:5198/api/v1',
      fetch: fetchMock as typeof fetch,
    })

    const result = await client.snapshots.getById('demo', 'snap-1')

    expect(result?.snapshotVersion).toBe(3)
  })

  it('retries transient failures before returning a successful payload', async () => {
    let attempts = 0
    const fetchMock = vi.fn(async () => {
      attempts += 1
      if (attempts === 1) {
        return new Response(
          JSON.stringify({
            title: 'Rate limited',
            detail: 'Try again soon.',
            retryable: true,
          }),
          { status: 429, headers: { 'Content-Type': 'application/json' } },
        )
      }

      return new Response(
        JSON.stringify({
          snapshotId: 'snap-1',
          tenantSlug: 'demo',
          externalUserId: '123',
          fullName: 'Avery Stone',
          companyName: 'Larkspur Logistics Group',
          summary: 'Recovered after retry.',
          overallConfidence: 0.91,
          generatedAtUtc: '2026-05-11T10:00:00Z',
          isStale: false,
          sourceSummary: null,
          history: [],
          facts: [],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const client = createContextLayerClient({
      baseUrl: 'http://127.0.0.1:5198',
      fetch: fetchMock as typeof fetch,
      maxRetries: 2,
      retryBaseDelayMs: 0,
    })

    const result = await client.users.getContext('demo', '123')

    expect(result?.summary).toBe('Recovered after retry.')
    expect(attempts).toBe(2)
  })

  it('surfaces typed errors from problem details responses', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          title: 'Validation failed',
          detail: 'The login payload was invalid.',
          code: 'validation_failed',
          correlationId: 'corr-123',
          retryable: false,
          errors: [
            {
              code: 'required',
              target: 'tenantSlug',
              message: 'Tenant slug is required.',
            },
          ],
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Id': 'req-123',
          },
        },
      ),
    )

    const client = createContextLayerClient({
      baseUrl: 'http://127.0.0.1:5198',
      fetch: fetchMock as typeof fetch,
    })

    await expect(
      client.auth.login({
        tenantSlug: '',
        email: 'admin@contextlayer.local',
        password: 'bad',
      }),
    ).rejects.toMatchObject({
      name: 'ContextLayerError',
      status: 400,
      code: 'validation_failed',
      correlationId: 'corr-123',
      details: [
        {
          target: 'tenantSlug',
        },
      ],
    })
  })
})
