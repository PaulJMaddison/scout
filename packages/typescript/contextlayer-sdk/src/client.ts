import { ContextLayerError } from './errors.js'
import type {
  AccountContextResult,
  AuditEvent,
  AuthSession,
  AuthenticatedOperator,
  ContextFactResult,
  ContextLayerClientOptions,
  ContextLayerErrorDetail,
  ContextProfileResult,
  ContextSnapshotResult,
  ContextSnapshotSummary,
  LoginRequest,
  PreviewSelectorInput,
  QueueRecomputeResult,
  SalesContextPackageResult,
  SelectorExecutionPreviewResult,
  SelectorValidationResult,
  ValidateSelectorInput,
} from './types.js'

interface GraphQlEnvelope<TData> {
  data?: TData
  errors?: Array<{
    message: string
    extensions?: {
      correlationId?: string
      code?: string
      httpStatus?: number
      retryable?: boolean
    }
  }>
}

export interface ContextLayerClient {
  auth: {
    login(input: LoginRequest): Promise<AuthSession>
    getCurrentOperator(): Promise<AuthenticatedOperator>
  }
  users: {
    getContext(tenantSlug: string, externalUserId: string): Promise<ContextProfileResult | null>
  }
  accounts: {
    getContext(tenantSlug: string, externalAccountId: string): Promise<AccountContextResult | null>
  }
  snapshots: {
    getById(tenantSlug: string, snapshotId: string): Promise<ContextSnapshotResult | null>
    getLatestForUser(tenantSlug: string, externalUserId: string): Promise<ContextSnapshotSummary | null>
    getLatestForAccount(tenantSlug: string, externalAccountId: string): Promise<ContextSnapshotSummary | null>
  }
  facts: {
    getForUser(tenantSlug: string, externalUserId: string): Promise<ContextFactResult[]>
    getForAccount(tenantSlug: string, externalAccountId: string): Promise<ContextFactResult[]>
  }
  selectors: {
    preview(input: PreviewSelectorInput): Promise<SelectorExecutionPreviewResult>
    validate(input: ValidateSelectorInput): Promise<SelectorValidationResult>
  }
  recompute: {
    queueForUser(tenantSlug: string, externalUserId: string, triggeredBy: string): Promise<QueueRecomputeResult>
  }
  packages: {
    getAiContextForUser(
      tenantSlug: string,
      externalUserId: string,
      salesObjective: string,
    ): Promise<SalesContextPackageResult | null>
  }
  audit: {
    getEvents(tenantSlug: string): Promise<AuditEvent[]>
  }
  forTenant(tenantSlug: string): TenantScopedContextLayerClient
}

export interface TenantScopedContextLayerClient {
  tenantSlug: string
  users: {
    getContext(externalUserId: string): Promise<ContextProfileResult | null>
  }
  accounts: {
    getContext(externalAccountId: string): Promise<AccountContextResult | null>
  }
  snapshots: {
    getById(snapshotId: string): Promise<ContextSnapshotResult | null>
    getLatestForUser(externalUserId: string): Promise<ContextSnapshotSummary | null>
    getLatestForAccount(externalAccountId: string): Promise<ContextSnapshotSummary | null>
  }
  facts: {
    getForUser(externalUserId: string): Promise<ContextFactResult[]>
    getForAccount(externalAccountId: string): Promise<ContextFactResult[]>
  }
  recompute: {
    queueForUser(externalUserId: string, triggeredBy: string): Promise<QueueRecomputeResult>
  }
  packages: {
    getAiContextForUser(
      externalUserId: string,
      salesObjective: string,
    ): Promise<SalesContextPackageResult | null>
  }
  audit: {
    getEvents(): Promise<AuditEvent[]>
  }
}

class HttpPipeline {
  private readonly baseUrl: string
  private readonly graphqlEndpoint: string
  private readonly accessToken: string | undefined
  private readonly getAccessToken: ContextLayerClientOptions['getAccessToken'] | undefined
  private readonly defaultHeaders: Record<string, string>
  private readonly maxRetries: number
  private readonly retryBaseDelayMs: number
  private readonly userAgent: string
  private readonly requestIdHeaderName: string
  private readonly fetchFn: typeof fetch

  constructor(options: ContextLayerClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '')
    this.graphqlEndpoint = options.graphqlEndpoint ?? `${this.baseUrl}/graphql`
    this.accessToken = options.accessToken
    this.getAccessToken = options.getAccessToken
    this.defaultHeaders = options.defaultHeaders ?? {}
    this.maxRetries = options.maxRetries ?? 2
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? 200
    this.userAgent = options.userAgent ?? 'ContextLayer.TypeScriptSdk/2.0.0'
    this.requestIdHeaderName = options.requestIdHeaderName ?? 'X-Request-Id'
    this.fetchFn = options.fetch ?? globalThis.fetch
    if (!this.fetchFn) {
      throw new Error('A fetch implementation is required.')
    }
  }

  async request<T>(path: string, init: RequestInit): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      const headers = await this.buildHeaders(init.headers)
      const response = await this.fetchFn(this.resolveUrl(path), { ...init, headers })
      if (response.ok) {
        return (await response.json()) as T
      }

      if (attempt >= this.maxRetries || !this.shouldRetry(response.status)) {
        throw await this.createError(response)
      }

      await this.delay(this.retryBaseDelayMs * 2 ** attempt)
    }
  }

  async graphql<T>(operationName: string, query: string, variables: unknown, fieldName: string): Promise<T | null> {
    const envelope = await this.request<GraphQlEnvelope<Record<string, T | null>>>(
      this.graphqlEndpoint,
      {
        method: 'POST',
        body: JSON.stringify({ operationName, query, variables }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    if (envelope.errors?.length) {
      const first = envelope.errors[0]!
      throw new ContextLayerError(first.message, {
        status: first.extensions?.httpStatus,
        correlationId: first.extensions?.correlationId,
        code: first.extensions?.code,
        retryable: first.extensions?.retryable,
      })
    }

    return envelope.data?.[fieldName] ?? null
  }

  private async buildHeaders(headers?: HeadersInit): Promise<Record<string, string>> {
    const token = this.accessToken ?? (await this.getAccessToken?.())
    const requestHeaders: Record<string, string> = {
      Accept: 'application/json',
      [this.requestIdHeaderName]: this.createRequestId(),
      'User-Agent': this.userAgent,
      ...this.defaultHeaders,
      ...(this.normalizeHeaders(headers)),
    }

    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`
    }

    return requestHeaders
  }

  private normalizeHeaders(headers?: HeadersInit): Record<string, string> {
    if (!headers) {
      return {}
    }

    if (headers instanceof Headers) {
      return Object.fromEntries(headers.entries())
    }

    if (Array.isArray(headers)) {
      return Object.fromEntries(headers)
    }

    return { ...headers }
  }

  private async createError(response: Response): Promise<ContextLayerError> {
    const correlationId = response.headers.get(this.requestIdHeaderName) ?? undefined

    try {
      const body = (await response.json()) as {
        title?: string
        detail?: string
        code?: string
        correlationId?: string
        retryable?: boolean
        errors?: ContextLayerErrorDetail[]
      }

      return new ContextLayerError(body.detail ?? body.title ?? `Request failed with ${response.status}.`, {
        status: response.status,
        correlationId: body.correlationId ?? correlationId,
        code: body.code,
        retryable: body.retryable,
        details: body.errors,
      })
    } catch {
      return new ContextLayerError(`Request failed with ${response.status}.`, {
        status: response.status,
        correlationId,
      })
    }
  }

  private shouldRetry(status: number): boolean {
    return status === 408 || status === 429 || status >= 500
  }

  private resolveUrl(path: string): string {
    if (/^https?:\/\//.test(path)) {
      return path
    }

    let resolvedPath = path.startsWith('/') ? path : `/${path}`
    if (this.baseUrl.toLowerCase().endsWith('/api/v1') && resolvedPath.toLowerCase().startsWith('/api/v1')) {
      resolvedPath = resolvedPath.slice('/api/v1'.length) || '/'
    }

    return `${this.baseUrl}${resolvedPath}`
  }

  private createRequestId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `req-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export function createContextLayerClient(options: ContextLayerClientOptions): ContextLayerClient {
  const pipeline = new HttpPipeline(options)

  const users = {
    async getContext(tenantSlug: string, externalUserId: string): Promise<ContextProfileResult | null> {
      return pipeline.request<ContextProfileResult>(
        `/api/v1/context/users/${encodeURIComponent(externalUserId)}?tenantSlug=${encodeURIComponent(tenantSlug)}`,
        {
          method: 'GET',
        },
      )
    },
  }

  const accounts = {
    async getContext(tenantSlug: string, externalAccountId: string): Promise<AccountContextResult | null> {
      return pipeline.request<AccountContextResult>(
        `/api/v1/context/accounts/${encodeURIComponent(externalAccountId)}?tenantSlug=${encodeURIComponent(tenantSlug)}`,
        {
          method: 'GET',
        },
      )
    },
  }

  const snapshots = {
    async getById(tenantSlug: string, snapshotId: string): Promise<ContextSnapshotResult | null> {
      return pipeline.request<ContextSnapshotResult>(
        `/api/v1/context/snapshots/${encodeURIComponent(snapshotId)}?tenantSlug=${encodeURIComponent(tenantSlug)}`,
        {
          method: 'GET',
        },
      )
    },
    async getLatestForUser(tenantSlug: string, externalUserId: string): Promise<ContextSnapshotSummary | null> {
      const context = await users.getContext(tenantSlug, externalUserId)
      if (!context) {
        return null
      }

      const historyEntry = context.history.find((entry) => entry.snapshotId === context.snapshotId)
      return {
        snapshotId: context.snapshotId,
        snapshotVersion: historyEntry?.snapshotVersion ?? 0,
        summary: context.summary,
        overallConfidence: context.overallConfidence,
        generatedAtUtc: context.generatedAtUtc,
        isStale: context.isStale,
        factCount: context.facts.length,
      }
    },
    async getLatestForAccount(tenantSlug: string, externalAccountId: string): Promise<ContextSnapshotSummary | null> {
      const context = await accounts.getContext(tenantSlug, externalAccountId)
      if (!context) {
        return null
      }

      const latestUser = [...context.users]
        .filter((user) => user.latestSnapshotId && user.generatedAtUtc)
        .sort((left, right) => right.generatedAtUtc!.localeCompare(left.generatedAtUtc!))[0]
      if (!latestUser?.latestSnapshotId) {
        return null
      }

      const snapshot = await snapshots.getById(tenantSlug, latestUser.latestSnapshotId)
      return snapshot
        ? {
            snapshotId: snapshot.snapshotId,
            snapshotVersion: snapshot.snapshotVersion,
            summary: snapshot.summary,
            overallConfidence: snapshot.overallConfidence,
            generatedAtUtc: snapshot.generatedAtUtc,
            isStale: snapshot.isStale,
            factCount: snapshot.facts.length,
          }
        : {
            snapshotId: latestUser.latestSnapshotId,
            snapshotVersion: 0,
            summary: latestUser.summary ?? '',
            overallConfidence: latestUser.overallConfidence ?? 0,
            generatedAtUtc: latestUser.generatedAtUtc ?? '',
            isStale: latestUser.isStale,
            factCount: 0,
          }
    },
  }

  const facts = {
    async getForUser(tenantSlug: string, externalUserId: string): Promise<ContextFactResult[]> {
      return (await users.getContext(tenantSlug, externalUserId))?.facts ?? []
    },
    async getForAccount(tenantSlug: string, externalAccountId: string): Promise<ContextFactResult[]> {
      await accounts.getContext(tenantSlug, externalAccountId)
      return []
    },
  }

  const selectors = {
    async preview(input: PreviewSelectorInput): Promise<SelectorExecutionPreviewResult> {
      const result = await pipeline.graphql<SelectorExecutionPreviewResult>(
        'PreviewSelector',
        `
          mutation PreviewSelector($input: PreviewSelectorInput!) {
            previewSelector(input: $input) {
              mode
              isSuccess
              selectorName
              rawSourceDataJson
              normalizedSourceDataJson
              validationErrors
              valueJson
              valueType
              confidence
              observedAtUtc
              freshUntilUtc
              explanation
              provenanceJson
              pipelineTraceJson
            }
          }
        `,
        { input },
        'previewSelector',
      )

      if (!result) {
        throw new ContextLayerError('Selector preview returned no result.')
      }

      return result
    },
    async validate(input: ValidateSelectorInput): Promise<SelectorValidationResult> {
      const result = await pipeline.graphql<SelectorValidationResult>(
        'ValidateSelector',
        `
          mutation ValidateSelector($input: ValidateSelectorInput!) {
            validateSelector(input: $input) {
              isValid
              validationErrors
              rawSourceDataJson
              normalizedSourceDataJson
              pipelineTraceJson
            }
          }
        `,
        { input },
        'validateSelector',
      )

      if (!result) {
        throw new ContextLayerError('Selector validation returned no result.')
      }

      return result
    },
  }

  const recompute = {
    async queueForUser(
      tenantSlug: string,
      externalUserId: string,
      triggeredBy: string,
    ): Promise<QueueRecomputeResult> {
      const result = await pipeline.graphql<QueueRecomputeResult>(
        'QueueContextRecompute',
        `
          mutation QueueContextRecompute($input: QueueContextRecomputeInput!) {
            queueContextRecompute(input: $input) {
              correlationId
              tenantId
              userProfileId
              executionCount
            }
          }
        `,
        {
          input: {
            tenantSlug,
            externalUserId,
            triggeredBy,
          },
        },
        'queueContextRecompute',
      )

      if (!result) {
        throw new ContextLayerError('Context recompute returned no result.')
      }

      return result
    },
  }

  const packages = {
    async getAiContextForUser(
      tenantSlug: string,
      externalUserId: string,
      salesObjective: string,
    ): Promise<SalesContextPackageResult | null> {
      return pipeline.graphql<SalesContextPackageResult>(
        'GetSalesContextPackage',
        `
          query GetSalesContextPackage($input: SalesContextPackageInput!) {
            salesContextPackage(input: $input) {
              snapshotId
              tenantSlug
              externalUserId
              fullName
              companyName
              jobTitle
              segment
              salesObjective
              summary
              overallConfidence
              generatedAtUtc
              isStale
              humanReviewRecommended
              missingInformation
              weakSignalMessages
              facts {
                citationId
                factId
                attributeKey
                displayName
                valueJson
                valueType
                confidence
                observedAtUtc
                freshUntilUtc
                isFresh
                isLowConfidence
                explanation
                provenanceJson
              }
              contextPackageJson
            }
          }
        `,
        {
          input: {
            tenantSlug,
            externalUserId,
            salesObjective,
          },
        },
        'salesContextPackage',
      )
    },
  }

  const audit = {
    async getEvents(tenantSlug: string): Promise<AuditEvent[]> {
      return (
        (await pipeline.graphql<AuditEvent[]>(
          'GetAuditEvents',
          `
            query GetAuditEvents($tenantSlug: String!) {
              auditEvents(tenantSlug: $tenantSlug) {
                id
                tenantId
                actor
                action
                entityType
                entityId
                correlationId
                metadataJson
                beforeJson
                afterJson
                createdAtUtc
              }
            }
          `,
          { tenantSlug },
          'auditEvents',
        )) ?? []
      )
    },
  }

  const auth = {
    login(input: LoginRequest): Promise<AuthSession> {
      return pipeline.request<AuthSession>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
        headers: {
          'Content-Type': 'application/json',
        },
      })
    },
    getCurrentOperator(): Promise<AuthenticatedOperator> {
      return pipeline.request<AuthenticatedOperator>('/api/auth/me', {
        method: 'GET',
      })
    },
  }

  return {
    auth,
    users,
    accounts,
    snapshots,
    facts,
    selectors,
    recompute,
    packages,
    audit,
    forTenant(tenantSlug: string): TenantScopedContextLayerClient {
      return {
        tenantSlug,
        users: {
          getContext(externalUserId: string) {
            return users.getContext(tenantSlug, externalUserId)
          },
        },
        accounts: {
          getContext(externalAccountId: string) {
            return accounts.getContext(tenantSlug, externalAccountId)
          },
        },
        snapshots: {
          getById(snapshotId: string) {
            return snapshots.getById(tenantSlug, snapshotId)
          },
          getLatestForUser(externalUserId: string) {
            return snapshots.getLatestForUser(tenantSlug, externalUserId)
          },
          getLatestForAccount(externalAccountId: string) {
            return snapshots.getLatestForAccount(tenantSlug, externalAccountId)
          },
        },
        facts: {
          getForUser(externalUserId: string) {
            return facts.getForUser(tenantSlug, externalUserId)
          },
          getForAccount(externalAccountId: string) {
            return facts.getForAccount(tenantSlug, externalAccountId)
          },
        },
        recompute: {
          queueForUser(externalUserId: string, triggeredBy: string) {
            return recompute.queueForUser(tenantSlug, externalUserId, triggeredBy)
          },
        },
        packages: {
          getAiContextForUser(externalUserId: string, salesObjective: string) {
            return packages.getAiContextForUser(tenantSlug, externalUserId, salesObjective)
          },
        },
        audit: {
          getEvents() {
            return audit.getEvents(tenantSlug)
          },
        },
      }
    },
  }
}
