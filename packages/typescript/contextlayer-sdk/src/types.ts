export interface LoginRequest {
  tenantSlug: string
  email: string
  password: string
}

export interface AuthenticatedOperator {
  tenantId: string
  tenantSlug: string
  operatorAccountId: string
  email: string
  displayName: string
  role: 'tenant_admin' | 'sales_rep' | string
}

export interface AuthSession {
  accessToken: string
  expiresAtUtc: string
  operator: AuthenticatedOperator
}

export interface MachineTokenRequest {
  grantType: 'client_credentials'
  clientId: string
  clientSecret: string
  scope?: string | null
}

export interface MachineTokenResponse {
  accessToken: string
  tokenType: 'Bearer' | string
  expiresIn: number
  scope: string
}

export interface ContextFactResult {
  id: string
  attributeKey: string
  valueJson: string
  valueType: string
  confidence: number
  observedAtUtc: string
  freshUntilUtc?: string | null
  sourceSelectorDefinitionId: string
  explanation: string
  provenanceJson: string
}

export interface ContextFactLookupOptions {
  attributeKey?: string | null
  page?: number | null
  pageSize?: number | null
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  hasMore: boolean
}

export interface SourceSystemEventRequest {
  eventId?: string | null
  workspaceSlug?: string | null
  sourceSystem: string
  eventType: string
  payload?: unknown
  payloadJson?: string | null
  externalUserId?: string | null
  externalAccountId?: string | null
  observedAtUtc?: string | null
}

export interface SourceSystemEventAcceptedResult {
  eventId: string
  tenantId: string
  tenantSlug: string
  workspaceId?: string | null
  userProfileId?: string | null
  storedSignalCount: number
  matchedSelectorCount: number
  status: string
  isDuplicate: boolean
  acceptedAtUtc: string
}

export interface OperationalHighlightResult {
  label: string
  value: string
  explanation: string
}

export interface OperationalTimelineEventResult {
  category: string
  description: string
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

export interface ContextSnapshotHistoryResult {
  snapshotId: string
  snapshotVersion: number
  summary: string
  overallConfidence: number
  generatedAtUtc: string
  isStale: boolean
  factCount: number
}

export interface ContextSnapshotResult {
  snapshotId: string
  tenantId: string
  tenantSlug: string
  userProfileId: string
  externalUserId: string
  fullName: string
  companyName: string
  snapshotVersion: number
  summary: string
  overallConfidence: number
  generatedAtUtc: string
  isStale: boolean
  facts: ContextFactResult[]
}

export interface ContextProfileResult {
  snapshotId: string
  tenantSlug: string
  externalUserId: string
  fullName: string
  companyName: string
  summary: string
  overallConfidence: number
  generatedAtUtc: string
  isStale: boolean
  sourceSummary?: OperationalSourceSummaryResult | null
  history: ContextSnapshotHistoryResult[]
  facts: ContextFactResult[]
}

export interface AccountContextResult {
  tenantSlug: string
  externalAccountId: string
  accountName: string
  domain: string
  industry: string
  segment: string
  region: string
  lifecycleStage: string
  users: AccountContextUserResult[]
}

export interface AccountContextUserResult {
  externalUserId: string
  fullName: string
  email: string
  jobTitle: string
  latestSnapshotId?: string | null
  summary?: string | null
  overallConfidence?: number | null
  generatedAtUtc?: string | null
  isStale: boolean
}

export interface ContextSnapshotSummary {
  snapshotId: string
  snapshotVersion: number
  summary: string
  overallConfidence: number
  generatedAtUtc: string
  isStale: boolean
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

export interface SalesContextPackageResult {
  snapshotId: string
  tenantSlug: string
  externalUserId: string
  fullName: string
  companyName: string
  jobTitle: string
  segment: string
  salesObjective: string
  summary: string
  overallConfidence: number
  generatedAtUtc: string
  isStale: boolean
  humanReviewRecommended: boolean
  missingInformation: string[]
  weakSignalMessages: string[]
  facts: GroundedContextFactResult[]
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

export interface SelectorExecutionPreviewResult {
  mode: string
  isSuccess: boolean
  selectorName: string
  rawSourceDataJson: string
  normalizedSourceDataJson: string
  validationErrors: string[]
  valueJson?: string | null
  valueType?: string | null
  confidence?: number | null
  observedAtUtc?: string | null
  freshUntilUtc?: string | null
  explanation?: string | null
  provenanceJson?: string | null
  pipelineTraceJson: string
}

export interface SelectorValidationResult {
  isValid: boolean
  validationErrors: string[]
  rawSourceDataJson: string
  normalizedSourceDataJson: string
  pipelineTraceJson: string
}

export interface QueueRecomputeResult {
  correlationId: string
  tenantId: string
  userProfileId: string
  executionCount: number
}

export interface AuditEvent {
  id: string
  tenantId?: string | null
  actor: string
  action: string
  entityType: string
  entityId: string
  correlationId: string
  metadataJson: string
  beforeJson?: string | null
  afterJson?: string | null
  createdAtUtc: string
}

export interface ContextLayerErrorDetail {
  code?: string | null
  target?: string | null
  message: string
}

export interface ContextLayerClientOptions {
  baseUrl: string
  graphqlEndpoint?: string
  accessToken?: string
  getAccessToken?: (() => Promise<string | undefined> | string | undefined)
  defaultHeaders?: Record<string, string>
  maxRetries?: number
  retryBaseDelayMs?: number
  userAgent?: string
  requestIdHeaderName?: string
  fetch?: typeof fetch
}
