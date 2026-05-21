import { describe, expect, it, vi } from 'vitest'
import { createScoutClient } from '../src/client.js'

describe('Scout TypeScript SDK', () => {
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

    const client = createScoutClient({
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

    const client = createScoutClient({
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

    const client = createScoutClient({
      baseUrl: 'http://127.0.0.1:5198',
      fetch: fetchMock as typeof fetch,
    })

    const result = await client.accounts.getContext('demo', 'ACC-123')

    expect(result?.externalAccountId).toBe('ACC-123')
  })

  it('auth.getMachineToken calls the machine token endpoint', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      expect(url).toBe('http://127.0.0.1:5198/api/auth/token')
      expect(init?.method).toBe('POST')

      return new Response(
        JSON.stringify({
          accessToken: 'machine-token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          scope: 'context:read',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const client = createScoutClient({
      baseUrl: 'http://127.0.0.1:5198',
      fetch: fetchMock as typeof fetch,
    })

    const token = await client.auth.getMachineToken({
      grantType: 'client_credentials',
      clientId: 'workflow-client',
      clientSecret: 'secret',
      scope: 'context:read',
    })

    expect(token.accessToken).toBe('machine-token')
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

    const client = createScoutClient({
      baseUrl: 'http://127.0.0.1:5198/api/v1',
      fetch: fetchMock as typeof fetch,
    })

    const result = await client.snapshots.getById('demo', 'snap-1')

    expect(result?.snapshotVersion).toBe(3)
  })

  it('packages.getAiContextForUser calls the v1 REST package path', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      expect(url).toBe('http://127.0.0.1:5198/api/v1/context/users/123/ai-safe-context-package?tenantSlug=demo')
      expect(init?.method).toBe('POST')

      return new Response(
        JSON.stringify({
          snapshotId: 'snap-1',
          tenantSlug: 'demo',
          externalUserId: '123',
          fullName: 'Avery Stone',
          companyName: 'Larkspur Logistics Group',
          jobTitle: 'VP Revenue',
          segment: 'enterprise',
          salesObjective: 'Prepare a renewal-risk brief.',
          summary: 'Grounded context package.',
          overallConfidence: 0.91,
          generatedAtUtc: '2026-05-11T10:00:00Z',
          isStale: false,
          humanReviewRecommended: true,
          missingInformation: [],
          weakSignalMessages: [],
          facts: [],
          contextPackageJson: '{}',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const client = createScoutClient({
      baseUrl: 'http://127.0.0.1:5198',
      fetch: fetchMock as typeof fetch,
    })

    const result = await client.packages.getAiContextForUser('demo', '123', 'Prepare a renewal-risk brief.')

    expect(result?.contextPackageJson).toBe('{}')
  })

  it('facts.getForUser calls the v1 REST fact lookup with filters', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      expect(url).toBe(
        'http://127.0.0.1:5198/api/v1/context/users/123/facts?tenantSlug=demo&attributeKey=health&page=2&pageSize=10',
      )
      expect(init?.method).toBe('GET')

      return new Response(
        JSON.stringify({
          items: [
            {
              id: 'fact-1',
              attributeKey: 'accountHealth',
              valueJson: '"green"',
              valueType: 'string',
              confidence: 0.9,
              observedAtUtc: '2026-05-11T10:00:00Z',
              freshUntilUtc: null,
              sourceSelectorDefinitionId: 'selector-1',
              explanation: 'Healthy account.',
              provenanceJson: '[]',
            },
          ],
          page: 2,
          pageSize: 10,
          totalCount: 11,
          hasMore: false,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const client = createScoutClient({
      baseUrl: 'http://127.0.0.1:5198',
      fetch: fetchMock as typeof fetch,
    })

    const facts = await client.facts.getForUser('demo', '123', {
      attributeKey: 'health',
      page: 2,
      pageSize: 10,
    })

    expect(facts).toHaveLength(1)
    expect(facts[0]?.attributeKey).toBe('accountHealth')
  })

  it('events.ingestSourceSystemEvent calls the v1 event contract endpoint', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      expect(url).toBe('http://127.0.0.1:5198/api/v1/events/source-system?tenantSlug=demo')
      expect(init?.method).toBe('POST')
      expect(JSON.parse(init?.body as string)).toMatchObject({
        eventId: 'evt-sdk-001',
        sourceSystem: 'product',
        eventType: 'source.product_usage.rollup_ready',
        externalUserId: '123',
      })

      return new Response(
        JSON.stringify({
          eventId: 'evt-sdk-001',
          tenantId: 'tenant-1',
          tenantSlug: 'demo',
          workspaceId: null,
          userProfileId: 'user-1',
          storedSignalCount: 1,
          matchedSelectorCount: 2,
          status: 'Processed',
          isDuplicate: false,
          acceptedAtUtc: '2026-05-11T10:00:00Z',
        }),
        { status: 202, headers: { 'Content-Type': 'application/json' } },
      )
    })

    const client = createScoutClient({
      baseUrl: 'http://127.0.0.1:5198',
      fetch: fetchMock as typeof fetch,
    })

    const result = await client.events.ingestSourceSystemEvent('demo', {
      eventId: 'evt-sdk-001',
      sourceSystem: 'product',
      eventType: 'source.product_usage.rollup_ready',
      externalUserId: '123',
      payload: {
        activeDays30: 22,
      },
    })

    expect(result.status).toBe('Processed')
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

    const client = createScoutClient({
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

    const client = createScoutClient({
      baseUrl: 'http://127.0.0.1:5198',
      fetch: fetchMock as typeof fetch,
    })

    await expect(
      client.auth.login({
        tenantSlug: '',
        email: 'admin@scout.local',
        password: 'bad',
      }),
    ).rejects.toMatchObject({
      name: 'ScoutError',
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

  it('surfaces typed errors from the v1 error envelope', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          error: {
            code: 'context.user_not_found',
            message: 'User context was not found.',
            correlationId: 'corr-v1',
            details: {
              externalUserId: ['No context exists for this user.'],
            },
          },
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    )

    const client = createScoutClient({
      baseUrl: 'http://127.0.0.1:5198',
      fetch: fetchMock as typeof fetch,
    })

    await expect(client.users.getContext('demo', 'missing')).rejects.toMatchObject({
      name: 'ScoutError',
      status: 404,
      code: 'context.user_not_found',
      correlationId: 'corr-v1',
      details: [
        {
          target: 'externalUserId',
          message: 'No context exists for this user.',
        },
      ],
    })
  })
})
