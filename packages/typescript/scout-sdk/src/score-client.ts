import { ScoutError } from './errors.js'
import type {
  CreditScore,
  CreditScoreRequest,
  InvestmentScore,
  InvestmentScoreRequest,
  JobScore,
  JobScoreRequest,
  KynticScoreClientOptions,
  ScoreBase,
} from './types.js'

export const SCORE_API_PATHS = {
  investment: '/v1/scores/investment',
  credit: '/v1/scores/credit',
  job: '/v1/scores/job',
} as const

/** Client for services implementing `schema/kyntic-score.openapi.yaml`. */
export interface KynticScoreClient {
  createInvestmentScore(input: InvestmentScoreRequest): Promise<InvestmentScore>
  createCreditScore(input: CreditScoreRequest): Promise<CreditScore>
  createJobScore(input: JobScoreRequest): Promise<JobScore>
}

export function createKynticScoreClient(options: KynticScoreClientOptions): KynticScoreClient {
  const pipeline = new ScoreHttpPipeline(options)

  return {
    async createInvestmentScore(input: InvestmentScoreRequest): Promise<InvestmentScore> {
      const result = await pipeline.post<InvestmentScore>(SCORE_API_PATHS.investment, input)
      return validateScoreResponse(result, 'InvestmentScore')
    },
    async createCreditScore(input: CreditScoreRequest): Promise<CreditScore> {
      const result = await pipeline.post<CreditScore>(SCORE_API_PATHS.credit, input)
      return validateScoreResponse(result, 'CreditScore')
    },
    async createJobScore(input: JobScoreRequest): Promise<JobScore> {
      const result = await pipeline.post<JobScore>(SCORE_API_PATHS.job, input)
      return validateScoreResponse(result, 'JobScore')
    },
  }
}

class ScoreHttpPipeline {
  private readonly baseUrl: string
  private readonly fetchFn: typeof fetch
  private readonly accessToken: string | undefined
  private readonly getAccessToken: KynticScoreClientOptions['getAccessToken'] | undefined
  private readonly apiKey: string | undefined
  private readonly defaultHeaders: Record<string, string>

  constructor(options: KynticScoreClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '')
    this.fetchFn = options.fetch ?? globalThis.fetch
    this.accessToken = options.accessToken
    this.getAccessToken = options.getAccessToken
    this.apiKey = options.apiKey
    this.defaultHeaders = options.defaultHeaders ?? {}
    if (!this.fetchFn) {
      throw new Error('A fetch implementation is required.')
    }
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await this.fetchFn(`${this.baseUrl}${path}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: await this.buildHeaders(),
    })

    if (!response.ok) {
      throw await this.toError(response)
    }

    return (await response.json()) as T
  }

  private async buildHeaders(): Promise<Record<string, string>> {
    const token = this.accessToken ?? (await this.getAccessToken?.())
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(this.apiKey ? { 'X-API-Key': this.apiKey } : {}),
    }
  }

  private async toError(response: Response): Promise<ScoutError> {
    try {
      const body = (await response.json()) as {
        code?: string
        message?: string
        correlationId?: string
        details?: Array<{ target?: string; message: string }>
      }
      return new ScoutError(body.message ?? `Score request failed with ${response.status}.`, {
        status: response.status,
        code: body.code,
        correlationId: body.correlationId,
        details: body.details,
      })
    } catch {
      return new ScoutError(`Score request failed with ${response.status}.`, { status: response.status })
    }
  }
}

function validateScoreResponse<TScore extends ScoreBase>(score: TScore, expectedType: TScore['scoreType']): TScore {
  if (score.scoreType !== expectedType) {
    throw new ScoutError(`Score response type '${String(score.scoreType)}' did not match '${expectedType}'.`, {
      code: 'score.invalid_response',
    })
  }
  if (score.rating < 0 || score.rating > 100) {
    throw new ScoutError('Score response rating must be between 0 and 100.', {
      code: 'score.invalid_response',
    })
  }
  if (score.supportingEvidence.length > 5) {
    throw new ScoutError('Score response must include no more than five supporting evidence points.', {
      code: 'score.invalid_response',
    })
  }
  if (score.riskFlags.length > 3) {
    throw new ScoutError('Score response must include no more than three risk flags.', {
      code: 'score.invalid_response',
    })
  }
  if (
    score.confidenceInterval.lower < 0
    || score.confidenceInterval.upper > 100
    || score.confidenceInterval.lower > score.confidenceInterval.upper
    || score.confidenceInterval.level <= 0
    || score.confidenceInterval.level > 1
  ) {
    throw new ScoutError('Score response confidence interval is invalid.', {
      code: 'score.invalid_response',
    })
  }

  return score
}
