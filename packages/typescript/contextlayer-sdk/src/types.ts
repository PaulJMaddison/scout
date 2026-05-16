/** Credentials for an interactive operator login. */
export interface LoginRequest {
  /** Tenant identifier (slug). */
  tenantSlug: string
  /** Operator email address. */
  email: string
  /** Operator password. */
  password: string
}

/** The authenticated operator returned after a successful login or token introspection. */
export interface AuthenticatedOperator {
  /** Internal tenant identifier. */
  tenantId: string
  /** Tenant slug used in API calls. */
  tenantSlug: string
  /** Unique operator account identifier. */
  operatorAccountId: string
  /** Operator email address. */
  email: string
  /** Human-readable display name. */
  displayName: string
  /** Operator role within the tenant (e.g. `"tenant_admin"` or `"sales_rep"`). */
  role: 'tenant_admin' | 'sales_rep' | string
}

/** Session returned after a successful interactive login. */
export interface AuthSession {
  /** JWT bearer token. */
  accessToken: string
  /** Token expiry timestamp (ISO 8601 UTC). */
  expiresAtUtc: string
  /** The authenticated operator. */
  operator: AuthenticatedOperator
}

/** Request body for machine-to-machine token exchange. */
export interface MachineTokenRequest {
  /** Must be `"client_credentials"`. */
  grantType: 'client_credentials'
  /** API client identifier. */
  clientId: string
  /** API client secret. */
  clientSecret: string
  /** Space-separated scope list (e.g. `"context:read context:write"`). */
  scope?: string | null
}

/** Response from a successful machine token exchange. */
export interface MachineTokenResponse {
  /** JWT bearer token. */
  accessToken: string
  /** Token type (typically `"Bearer"`). */
  tokenType: 'Bearer' | string
  /** Token lifetime in seconds. */
  expiresIn: number
  /** Granted scopes. */
  scope: string
}

/** A single semantic fact derived by the selector engine. */
export interface ContextFactResult {
  /** Unique fact identifier. */
  id: string
  /** Canonical semantic attribute key (e.g. `"health"`, `"churn_risk"`). */
  attributeKey: string
  /** Fact value serialised as JSON. */
  valueJson: string
  /** Value type descriptor (e.g. `"string"`, `"number"`, `"object"`). */
  valueType: string
  /** Confidence score between 0 and 1. */
  confidence: number
  /** When the fact was observed (ISO 8601 UTC). */
  observedAtUtc: string
  /** When the fact expires (ISO 8601 UTC), or `null` if evergreen. */
  freshUntilUtc?: string | null
  /** Selector definition that produced this fact. */
  sourceSelectorDefinitionId: string
  /** Human-readable explanation of how this fact was derived. */
  explanation: string
  /** Provenance metadata serialised as JSON. */
  provenanceJson: string
}

/** Filtering and pagination options for fact lookups. */
export interface ContextFactLookupOptions {
  /** Filter by semantic attribute key. */
  attributeKey?: string | null
  /** Page number (1-based). */
  page?: number | null
  /** Number of facts per page. */
  pageSize?: number | null
}

/** Generic paginated result envelope. */
export interface PageResult<T> {
  /** Items on the current page. */
  items: T[]
  /** Current page number (1-based). */
  page: number
  /** Requested page size. */
  pageSize: number
  /** Total number of matching items. */
  totalCount: number
  /** Whether more pages are available. */
  hasMore: boolean
}

/** Payload for ingesting a provider-neutral source-system event. */
export interface SourceSystemEventRequest {
  /** Caller-assigned event identifier for idempotency. */
  eventId?: string | null
  /** Optional workspace slug for multi-workspace tenants. */
  workspaceSlug?: string | null
  /** Source system name (e.g. `"crm"`, `"product"`, `"web"`). */
  sourceSystem: string
  /** Event type URN (e.g. `"source.product_usage.rollup_ready"`). */
  eventType: string
  /** Structured event payload (serialised automatically). */
  payload?: unknown
  /** Pre-serialised JSON payload (alternative to `payload`). */
  payloadJson?: string | null
  /** External user identifier the event relates to. */
  externalUserId?: string | null
  /** External account identifier the event relates to. */
  externalAccountId?: string | null
  /** When the event was observed (ISO 8601 UTC). */
  observedAtUtc?: string | null
}

/** Result returned after a source-system event is accepted. */
export interface SourceSystemEventAcceptedResult {
  /** Assigned event identifier. */
  eventId: string
  /** Tenant that received the event. */
  tenantId: string
  /** Tenant slug. */
  tenantSlug: string
  /** Workspace identifier, if applicable. */
  workspaceId?: string | null
  /** Matched user profile identifier, if resolved. */
  userProfileId?: string | null
  /** Number of signals stored from this event. */
  storedSignalCount: number
  /** Number of selectors that matched this event. */
  matchedSelectorCount: number
  /** Processing status. */
  status: string
  /** Whether this event was a duplicate of a previously ingested event. */
  isDuplicate: boolean
  /** Timestamp when the event was accepted (ISO 8601 UTC). */
  acceptedAtUtc: string
}

/** A key operational metric surfaced from source data. */
export interface OperationalHighlightResult {
  /** Metric label. */
  label: string
  /** Metric value. */
  value: string
  /** Human-readable explanation of the metric. */
  explanation: string
}

/** A single entry in the operational timeline. */
export interface OperationalTimelineEventResult {
  /** Event category. */
  category: string
  /** Event description. */
  description: string
  /** When the event occurred (ISO 8601 UTC). */
  occurredAtUtc: string
}

export interface OperationalSourceSummaryResult {
  externalAccountId: string
  accountName: string
  domain: string
  industry: string
  region: string
  lifecycleStage: string
  activePlanName: string
  subscriptionStatus: string
  monthlyRecurringRevenue: number
  openOpportunities: number
  openSupportTickets: number
  pricingPageVisits30d: number
  activeDays30: number
  emailReplies30d: number
  highlights: OperationalHighlightResult[]
  recentTimeline: OperationalTimelineEventResult[]
  rawSummaryJson: string
}

/** A historical snapshot entry in a user's context profile. */
export interface ContextSnapshotHistoryResult {
  /** Snapshot identifier. */
  snapshotId: string
  /** Monotonically increasing snapshot version. */
  snapshotVersion: number
  /** AI-generated summary text. */
  summary: string
  /** Aggregate confidence score (0 to 1). */
  overallConfidence: number
  /** When the snapshot was generated (ISO 8601 UTC). */
  generatedAtUtc: string
  /** Whether the snapshot has expired. */
  isStale: boolean
  /** Number of facts in this snapshot. */
  factCount: number
}

/** A full context snapshot with all facts. */
export interface ContextSnapshotResult {
  /** Snapshot identifier. */
  snapshotId: string
  /** Internal tenant identifier. */
  tenantId: string
  /** Tenant slug. */
  tenantSlug: string
  /** Internal user profile identifier. */
  userProfileId: string
  /** External user identifier. */
  externalUserId: string
  /** User's full name. */
  fullName: string
  /** User's company name. */
  companyName: string
  /** Monotonically increasing snapshot version. */
  snapshotVersion: number
  /** AI-generated summary text. */
  summary: string
  /** Aggregate confidence score (0 to 1). */
  overallConfidence: number
  /** When the snapshot was generated (ISO 8601 UTC). */
  generatedAtUtc: string
  /** Whether the snapshot has expired. */
  isStale: boolean
  /** All semantic facts in this snapshot. */
  facts: ContextFactResult[]
}

/** Full context profile for a user, including operational source data, history, and facts. */
export interface ContextProfileResult {
  /** Current snapshot identifier. */
  snapshotId: string
  /** Tenant slug. */
  tenantSlug: string
  /** External user identifier. */
  externalUserId: string
  /** User's full name. */
  fullName: string
  /** User's company name. */
  companyName: string
  /** AI-generated summary text. */
  summary: string
  /** Aggregate confidence score (0 to 1). */
  overallConfidence: number
  /** When the context was generated (ISO 8601 UTC). */
  generatedAtUtc: string
  /** Whether the context has expired. */
  isStale: boolean
  /** Operational source summary from connected systems. */
  sourceSummary?: OperationalSourceSummaryResult | null
  /** Snapshot version history. */
  history: ContextSnapshotHistoryResult[]
  /** Current semantic facts. */
  facts: ContextFactResult[]
}

/** Aggregated context for a business account (company). */
export interface AccountContextResult {
  /** Tenant slug. */
  tenantSlug: string
  /** External account identifier. */
  externalAccountId: string
  /** Account (company) name. */
  accountName: string
  /** Primary domain. */
  domain: string
  /** Industry classification. */
  industry: string
  /** Customer segment. */
  segment: string
  /** Geographic region. */
  region: string
  /** Lifecycle stage (e.g. `"active"`, `"onboarding"`, `"churned"`). */
  lifecycleStage: string
  /** Users associated with this account. */
  users: AccountContextUserResult[]
}

/** A user listed within an account context result. */
export interface AccountContextUserResult {
  /** External user identifier. */
  externalUserId: string
  /** User's full name. */
  fullName: string
  /** User's email address. */
  email: string
  /** User's job title. */
  jobTitle: string
  /** Latest snapshot identifier, if a context profile exists. */
  latestSnapshotId?: string | null
  /** Latest summary text. */
  summary?: string | null
  /** Latest confidence score (0 to 1). */
  overallConfidence?: number | null
  /** When the latest snapshot was generated (ISO 8601 UTC). */
  generatedAtUtc?: string | null
  /** Whether the latest snapshot has expired. */
  isStale: boolean
}

/** Lightweight snapshot summary (without full fact data). */
export interface ContextSnapshotSummary {
  /** Snapshot identifier. */
  snapshotId: string
  /** Monotonically increasing snapshot version. */
  snapshotVersion: number
  /** AI-generated summary text. */
  summary: string
  /** Aggregate confidence score (0 to 1). */
  overallConfidence: number
  /** When the snapshot was generated (ISO 8601 UTC). */
  generatedAtUtc: string
  /** Whether the snapshot has expired. */
  isStale: boolean
  /** Number of facts in this snapshot. */
  factCount: number
}

export interface GroundedContextFactResult {
  citationId: string
  factId: string
  attributeKey: string
  displayName: string
  valueJson: string
  valueType: string
  confidence: number
  observedAtUtc: string
  freshUntilUtc?: string | null
  isFresh: boolean
  isLowConfidence: boolean
  explanation: string
  provenanceJson: string
}

/** AI-safe context package scoped for a sales objective. UCL does not call an AI model. */
export interface SalesContextPackageResult {
  /** Snapshot identifier. */
  snapshotId: string
  /** Tenant slug. */
  tenantSlug: string
  /** External user identifier. */
  externalUserId: string
  /** User's full name. */
  fullName: string
  /** User's company name. */
  companyName: string
  /** User's job title. */
  jobTitle: string
  /** Customer segment. */
  segment: string
  /** The sales objective provided in the request. */
  salesObjective: string
  /** AI-generated summary text. */
  summary: string
  /** Aggregate confidence score (0 to 1). */
  overallConfidence: number
  /** When the package was generated (ISO 8601 UTC). */
  generatedAtUtc: string
  /** Whether the underlying snapshot has expired. */
  isStale: boolean
  /** Whether a human should review this package before use. */
  humanReviewRecommended: boolean
  /** Descriptions of information that could not be sourced. */
  missingInformation: string[]
  /** Warnings about low-confidence signals. */
  weakSignalMessages: string[]
  /** Grounded facts with citation identifiers. */
  facts: GroundedContextFactResult[]
  /** Full context package serialised as JSON for downstream consumers. */
  contextPackageJson: string
}

export interface UpsertSelectorDefinitionInput {
  id?: string | null
  tenantSlug: string
  dataSourceId?: string | null
  targetAttributeDefinitionId: string
  name: string
  description: string
  mappingKind: string
  expressionJson: string
  explanationTemplate: string
  validationSchemaJson: string
  defaultConfidence: number
  freshnessWindowMinutes: number
  priority: number
  scheduleIntervalMinutes?: number | null
}

export interface PreviewSelectorInput {
  tenantSlug: string
  externalUserId: string
  selectorDefinitionId?: string | null
  draftSelector?: UpsertSelectorDefinitionInput | null
}

export interface ValidateSelectorInput {
  tenantSlug: string
  draftSelector: UpsertSelectorDefinitionInput
  externalUserId?: string | null
}

/** Result of previewing a selector definition against live data. */
export interface SelectorExecutionPreviewResult {
  /** Execution mode. */
  mode: string
  /** Whether the selector executed successfully. */
  isSuccess: boolean
  /** Selector name. */
  selectorName: string
  /** Raw source data retrieved by the connector (JSON). */
  rawSourceDataJson: string
  /** Normalised source data after field mapping (JSON). */
  normalizedSourceDataJson: string
  /** Validation errors encountered during execution. */
  validationErrors: string[]
  /** Extracted value (JSON). */
  valueJson?: string | null
  /** Value type descriptor. */
  valueType?: string | null
  /** Confidence score (0 to 1). */
  confidence?: number | null
  /** Observation timestamp (ISO 8601 UTC). */
  observedAtUtc?: string | null
  /** Freshness expiry timestamp (ISO 8601 UTC). */
  freshUntilUtc?: string | null
  /** Human-readable explanation. */
  explanation?: string | null
  /** Provenance metadata (JSON). */
  provenanceJson?: string | null
  /** Full pipeline execution trace (JSON). */
  pipelineTraceJson: string
}

/** Result of validating a selector definition. */
export interface SelectorValidationResult {
  /** Whether the selector definition is valid. */
  isValid: boolean
  /** Validation errors, if any. */
  validationErrors: string[]
  /** Raw source data used during validation (JSON). */
  rawSourceDataJson: string
  /** Normalised source data (JSON). */
  normalizedSourceDataJson: string
  /** Pipeline execution trace (JSON). */
  pipelineTraceJson: string
}

/** Result of queuing a context recomputation. */
export interface QueueRecomputeResult {
  /** Correlation identifier for tracing the recompute job. */
  correlationId: string
  /** Tenant that owns the user profile. */
  tenantId: string
  /** Internal user profile identifier. */
  userProfileId: string
  /** Number of selector executions triggered. */
  executionCount: number
}

/** An audit trail entry recording a governance-relevant action. */
export interface AuditEvent {
  /** Unique audit event identifier. */
  id: string
  /** Tenant identifier (null for cross-tenant events). */
  tenantId?: string | null
  /** The actor (user, service, or system) that performed the action. */
  actor: string
  /** Action performed (e.g. `"context.read"`, `"recompute.queued"`). */
  action: string
  /** Entity type affected. */
  entityType: string
  /** Entity identifier. */
  entityId: string
  /** Request correlation identifier. */
  correlationId: string
  /** Additional metadata (JSON). */
  metadataJson: string
  /** Entity state before the action (JSON), if applicable. */
  beforeJson?: string | null
  /** Entity state after the action (JSON), if applicable. */
  afterJson?: string | null
  /** When the event was recorded (ISO 8601 UTC). */
  createdAtUtc: string
}

/** A single validation or error detail returned in a problem-details response. */
export interface ContextLayerErrorDetail {
  /** Machine-readable error code. */
  code?: string | null
  /** The field or target this error applies to. */
  target?: string | null
  /** Human-readable error message. */
  message: string
}

/** Configuration options for {@link createContextLayerClient}. */
export interface ContextLayerClientOptions {
  /** Base URL of the Context Layer API (e.g. `"http://127.0.0.1:5198"`). */
  baseUrl: string
  /** Override the GraphQL endpoint (defaults to `{baseUrl}/graphql`). */
  graphqlEndpoint?: string
  /** Static JWT bearer token. Mutually exclusive with `getAccessToken`. */
  accessToken?: string
  /** Lazy token provider called before each request. Mutually exclusive with `accessToken`. */
  getAccessToken?: (() => Promise<string | undefined> | string | undefined)
  /** Additional headers sent with every request. */
  defaultHeaders?: Record<string, string>
  /** Maximum number of retries for transient failures (default `2`). */
  maxRetries?: number
  /** Base delay in milliseconds for exponential backoff (default `200`). */
  retryBaseDelayMs?: number
  /** User-Agent header value. */
  userAgent?: string
  /** Header name used for request correlation (default `"X-Request-Id"`). */
  requestIdHeaderName?: string
  /** Custom `fetch` implementation (defaults to `globalThis.fetch`). */
  fetch?: typeof fetch
}
