import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { createKynticScoreClient, SCORE_API_PATHS } from '../src/score-client.js'
import type {
  CreditScoreRequest,
  InvestmentScoreRequest,
  JobScoreRequest,
} from '../src/types.js'

const validInvestmentRequest: InvestmentScoreRequest = {
  subject: {
    name: 'Example Infrastructure Ltd',
    sector: 'Industrial software',
  },
  horizon: 'medium_term',
  evidence: [
    {
      id: 'ev-001',
      summary: 'Recurring revenue grew across the last four quarters.',
      source: 'management-account-summary',
      weight: 0.8,
    },
  ],
}

describe('Kyntic Score TypeScript client', () => {
  it('calls the investment score contract path with bearer auth', async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      expect(String(input)).toBe(`http://127.0.0.1:3016${SCORE_API_PATHS.investment}`)
      expect(init?.method).toBe('POST')
      expect(init?.headers).toMatchObject({
        Authorization: 'Bearer score-token',
        'Content-Type': 'application/json',
      })
      expect(JSON.parse(init?.body as string)).toMatchObject({
        subject: { name: 'Example Infrastructure Ltd' },
      })

      return new Response(JSON.stringify({
        scoreType: 'InvestmentScore',
        rating: 82,
        supportingEvidence: [
          { summary: 'Recurring revenue growth.', source: 'management-account-summary', weight: 0.8 },
        ],
        riskFlags: [
          { code: 'customer_concentration', severity: 'moderate', summary: 'Revenue is concentrated.' },
        ],
        confidenceInterval: { lower: 76, upper: 88, level: 0.95 },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    })

    const client = createKynticScoreClient({
      baseUrl: 'http://127.0.0.1:3016',
      accessToken: 'score-token',
      fetch: fetchMock as typeof fetch,
    })

    const score = await client.createInvestmentScore(validInvestmentRequest)

    expect(score.scoreType).toBe('InvestmentScore')
    expect(score.rating).toBe(82)
  })

  it('calls the credit and job score paths with typed requests', async () => {
    const seenPaths: string[] = []
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      seenPaths.push(String(input))
      const isCredit = String(input).endsWith(SCORE_API_PATHS.credit)
      return new Response(JSON.stringify({
        scoreType: isCredit ? 'CreditScore' : 'JobScore',
        rating: isCredit ? 71 : 89,
        supportingEvidence: [],
        riskFlags: [],
        confidenceInterval: { lower: isCredit ? 66 : 84, upper: isCredit ? 76 : 93, level: 0.95 },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    })

    const client = createKynticScoreClient({
      baseUrl: 'http://score.local',
      apiKey: 'local-key',
      fetch: fetchMock as typeof fetch,
    })

    const creditRequest: CreditScoreRequest = {
      subject: { name: 'Example Infrastructure Ltd', entityType: 'company' },
      evidence: [{ id: 'credit-1', summary: 'Positive cashflow.' }],
    }
    const jobRequest: JobScoreRequest = {
      candidate: { name: 'Example Candidate' },
      role: { title: 'Principal Platform Engineer', requiredSkills: ['observability'] },
      evidence: [{ id: 'job-1', summary: 'Led reliability programmes.' }],
    }

    await expect(client.createCreditScore(creditRequest)).resolves.toMatchObject({ scoreType: 'CreditScore' })
    await expect(client.createJobScore(jobRequest)).resolves.toMatchObject({ scoreType: 'JobScore' })

    expect(seenPaths).toEqual([
      `http://score.local${SCORE_API_PATHS.credit}`,
      `http://score.local${SCORE_API_PATHS.job}`,
    ])
  })

  it('rejects score responses that breach the public contract limits', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({
        scoreType: 'InvestmentScore',
        rating: 101,
        supportingEvidence: [],
        riskFlags: [],
        confidenceInterval: { lower: 50, upper: 90, level: 0.95 },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )

    const client = createKynticScoreClient({
      baseUrl: 'http://score.local',
      fetch: fetchMock as typeof fetch,
    })

    await expect(client.createInvestmentScore(validInvestmentRequest)).rejects.toMatchObject({
      code: 'score.invalid_response',
    })
  })

  it('keeps SDK paths aligned with the OpenAPI 3.1 contract', () => {
    const spec = readFileSync(resolve('..', '..', '..', 'schema', 'kyntic-score.openapi.yaml'), 'utf-8')

    expect(spec).toContain('openapi: 3.1.0')
    expect(spec).toContain(SCORE_API_PATHS.investment)
    expect(spec).toContain(SCORE_API_PATHS.credit)
    expect(spec).toContain(SCORE_API_PATHS.job)
    expect(spec).toContain('InvestmentScore:')
    expect(spec).toContain('CreditScore:')
    expect(spec).toContain('JobScore:')
    expect(spec).toContain('maximum: 100')
    expect(spec).toContain('maxItems: 5')
    expect(spec).toContain('maxItems: 3')
    expect(spec).toContain('ConfidenceInterval:')
  })
})
