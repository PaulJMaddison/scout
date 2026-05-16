import { ContextLayerError } from './errors.js'
import type {
  AccountContextResult,
  AuditEvent,
  AuthSession,
  AuthenticatedOperator,
  ContextFactResult,
  ContextFactLookupOptions,
  ContextLayerClientOptions,
  ContextLayerErrorDetail,
  ContextProfileResult,
  ContextSnapshotResult,
  ContextSnapshotSummary,
  LoginRequest,
  MachineTokenRequest,
  MachineTokenResponse,
  PreviewSelectorInput,
  QueueRecomputeResult,
  SalesContextPackageResult,
  SelectorExecutionPreviewResult,
  SelectorValidationResult,
  SourceSystemEventAcceptedResult,
  SourceSystemEventRequest,
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

interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  hasMore: boolean
}

/**
 * Top-level SDK client exposing all Context Layer API surfaces.
 *
 * Create an instance with {@link createContextLayerClient}.
 */
export interface ContextLayerClient {
  /** Authentication and token management. */
  auth: {
    /** Log in as an interactive operator and receive a session with a JWT. */
    login(input: LoginRequest): Promise<AuthSession>
    /** Exchange client credentials for a scoped machine token. */
    getMachineToken(input: MachineTokenRequest): Promise<MachineTokenResponse>
    /** Retrieve the currently authenticated operator. */
    getCurrentOperator(): Promise<AuthenticatedOperator>
  }
  /** User context lookups. */
  users: {
    /** Retrieve the full context profile for a user. */
    getContext(tenantSlug: string, externalUserId: string): Promise<ContextProfileResult | null>
  }
  /** Account (company) context lookups. */
  accounts: {
    /** Retrieve the aggregated context for a business account. */
    getContext(tenantSlug: string, externalAccountId: string): Promise<AccountContextResult | null>
  }
  /** Context snapshot retrieval. */
  snapshots: {
    /** Retrieve a snapshot by its identifier. */
    getById(tenantSlug: string, snapshotId: string): Promise<ContextSnapshotResult | null>
    /** Retrieve the latest snapshot summary for a user. */
    getLatestForUser(tenantSlug: string, externalUserId: string): Promise<ContextSnapshotSummary | null>
    /** Retrieve the latest snapshot summary for an account. */
    getLatestForAccount(tenantSlug: string, externalAccountId: string): Promise<ContextSnapshotSummary | null>
  }
  /** Semantic fact lookups with filtering and pagination. */
  facts: {
    /** Retrieve semantic facts for a user, optionally filtered by attribute key. */
    getForUser(tenantSlug: string, externalUserId: string, options?: ContextFactLookupOptions): Promise<ContextFactResult[]>
    /** Retrieve semantic facts for an account, optionally filtered by attribute key. */
    getForAccount(tenantSlug: string, externalAccountId: string, options?: ContextFactLookupOptions): Promise<ContextFactResult[]>
  }
  /** Selector preview and validation (via GraphQL). */
  selectors: {
    /** Preview a selector definition against live source data. */
    preview(input: PreviewSelectorInput): Promise<SelectorExecutionPreviewResult>
    /** Validate a selector definition without executing it. */
    validate(input: ValidateSelectorInput): Promise<SelectorValidationResult>
  }
  /** Context recomputation. */
  recompute: {
    /** Queue a context recomputation for a user. */
    queueForUser(tenantSlug: string, externalUserId: string, triggeredBy: string): Promise<QueueRecomputeResult>
  }
  /** AI-safe context packages (UCL does not call an AI model). */
  packages: {
    /** Retrieve a scoped AI-safe context package for a user and sales objective. */
    getAiContextForUser(
      tenantSlug: string,
      externalUserId: string,
      salesObjective: string,
    ): Promise<SalesContextPackageResult | null>
  }
  /** Audit event log. */
  audit: {
    /** Retrieve audit events for a tenant. */
    getEvents(tenantSlug: string): Promise<AuditEvent[]>
  }
  /** Source-system event ingestion. */
  events: {
    /** Ingest a provider-neutral source-system event. */
    ingestSourceSystemEvent(
      tenantSlug: string,
      input: SourceSystemEventRequest,
    ): Promise<SourceSystemEventAcceptedResult>
  }
  /** Return a tenant-scoped client that omits the `tenantSlug` parameter from every call. */
  forTenant(tenantSlug: string): TenantScopedContextLayerClient
}

/** A tenant-scoped view of the SDK client. All methods omit the `tenantSlug` parameter. */
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
    getForUser(externalUserId: string, options?: ContextFactLookupOptions): Promise<ContextFactResult[]>
    getForAccount(externalAccountId: string, options?: ContextFactLookupOptions): Promise<ContextFactResult[]>
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
  events: {
    ingestSourceSystemEvent(input: SourceSystemEventRequest): Promise<SourceSystemEventAcceptedResult>
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
        error?: {
          code?: string
          message?: string
          correlationId?: string
          details?: Record<string, string[]>
        }
      }
      if (body.error) {
        const details = Object.entries(body.error.details ?? {}).flatMap(([target, messages]) =>
          messages.map((message) => ({
            target,
            message,
          })),
        )

        return new ContextLayerError(body.error.message ?? `Request failed with ${response.status}.`, {
          status: response.status,
          correlationId: body.error.correlationId ?? correlationId,
          code: body.error.code,
          details,
        })
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

/**
 * Create a new Context Layer SDK client.
 *
 * @example
 * ```ts
 * const ucl = createContextLayerClient({
 *   baseUrl: 'http://127.0.0.1:5198',
 *   accessToken: process.env.CONTEXT_LAYER_TOKEN,
 * })
 *
 * const context = await ucl.users.getContext('demo', '123')
 * ```
 */
export function createContextLayerClient(options: ContextLayerClientOptions): ContextLayerClient {
  const pipeline = new HttpPipeline(options)

  const buildQuery = (params: Record<string, string | number | null | undefined>) => {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        search.set(key, String(value))
      }
    }

    const query = search.toString()
    return query ? `?${query}` : ''
  }

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
    async getForUser(
      tenantSlug: string,
      externalUserId: string,
      options?: ContextFactLookupOptions,
    ): Promise<ContextFactResult[]> {
      const query = buildQuery({
        tenantSlug,
        attributeKey: options?.attributeKey,
        page: options?.page,
        pageSize: options?.pageSize,
      })
      const page = await pipeline.request<PageResult<ContextFactResult>>(
        `/api/v1/context/users/${encodeURIComponent(externalUserId)}/facts${query}`,
        {
          method: 'GET',
        },
      )
      return page.items
    },
    async getForAccount(
      tenantSlug: string,
      externalAccountId: string,
      options?: ContextFactLookupOptions,
    ): Promise<ContextFactResult[]> {
      const query = buildQuery({
        tenantSlug,
        attributeKey: options?.attributeKey,
        page: options?.page,
        pageSize: options?.pageSize,
      })
      const page = await pipeline.request<PageResult<ContextFactResult>>(
        `/api/v1/context/accounts/${encodeURIComponent(externalAccountId)}/facts${query}`,
        {
          method: 'GET',
        },
      )
      return page.items
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
      return pipeline.request<SalesContextPackageResult>(
        `/api/v1/context/users/${encodeURIComponent(externalUserId)}/ai-safe-context-package?tenantSlug=${encodeURIComponent(tenantSlug)}`,
        {
          method: 'POST',
          body: JSON.stringify({
            objective: salesObjective,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
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

  const events = {
    ingestSourceSystemEvent(
      tenantSlug: string,
      input: SourceSystemEventRequest,
    ): Promise<SourceSystemEventAcceptedResult> {
      return pipeline.request<SourceSystemEventAcceptedResult>(
        `/api/v1/events/source-system?tenantSlug=${encodeURIComponent(tenantSlug)}`,
        {
          method: 'POST',
          body: JSON.stringify(input),
          headers: {
            'Content-Type': 'application/json',
          },
        },
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
    getMachineToken(input: MachineTokenRequest): Promise<MachineTokenResponse> {
      return pipeline.request<MachineTokenResponse>('/api/auth/token', {
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
    events,
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
          getForUser(externalUserId: string, options?: ContextFactLookupOptions) {
            return facts.getForUser(tenantSlug, externalUserId, options)
          },
          getForAccount(externalAccountId: string, options?: ContextFactLookupOptions) {
            return facts.getForAccount(tenantSlug, externalAccountId, options)
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
        events: {
          ingestSourceSystemEvent(input: SourceSystemEventRequest) {
            return events.ingestSourceSystemEvent(tenantSlug, input)
          },
        },
      }
    },
  }
}
