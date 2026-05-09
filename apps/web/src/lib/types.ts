export type DataSourceKind =
  | 'CRM'
  | 'SQL_METRIC'
  | 'PRODUCT_USAGE'
  | 'EVENT_STREAM'
  | 'API_PAYLOAD'
  | 'MOCK'

export type DataSourceStatus = 'ACTIVE' | 'INACTIVE' | 'ERROR'

export type SemanticDataType =
  | 'JSON'
  | 'STRING'
  | 'NUMBER'
  | 'PERCENTAGE'
  | 'ENUM'
  | 'BOOLEAN'
  | 'DATETIME'

export type SelectorMappingKind =
  | 'DIRECT_FIELD_MAPPING'
  | 'WEIGHTED_SCORING'
  | 'THRESHOLD_CLASSIFICATION'
  | 'STRING_TO_ENUM_MAPPING'
  | 'FORMULA_METRIC'

export type SelectorStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export type FactValueType =
  | 'STRING'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'JSON'
  | 'ENUM'
  | 'DATETIME'

export type SelectorExecutionStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'

export type SelectorExecutionMode = 'LIVE' | 'PREVIEW' | 'DRY_RUN' | 'SCHEDULED'

export type AgentRunStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'

export interface Tenant {
  id: string
  slug: string
  name: string
  isActive: boolean
  createdAtUtc: string
  updatedAtUtc: string
}

export interface UserProfile {
  id: string
  tenantId: string
  externalUserId: string
  fullName: string
  email: string
  isEmailMasked: boolean
  companyName: string
  jobTitle: string
  segment: string
  lastSeenAtUtc: string
  createdAtUtc?: string
  updatedAtUtc?: string
}

export interface DataSource {
  id: string
  tenantId: string
  name: string
  description: string
  kind: DataSourceKind
  status: DataSourceStatus
  connectionConfigJson: string
  lastSuccessfulSyncAtUtc?: string | null
  createdAtUtc: string
  updatedAtUtc: string
}

export interface SemanticAttributeDefinition {
  id: string
  tenantId: string
  key: string
  displayName: string
  description: string
  dataType: SemanticDataType
  exampleValueJson: string
  isSystem: boolean
  createdAtUtc: string
  updatedAtUtc: string
}

export interface SelectorDefinition {
  id: string
  tenantId: string
  dataSourceId?: string | null
  targetAttributeDefinitionId: string
  name: string
  description: string
  mappingKind: SelectorMappingKind
  expressionJson: string
  explanationTemplate: string
  validationSchemaJson: string
  status: SelectorStatus
  version: number
  defaultConfidence: number
  freshnessWindowMinutes: number
  priority: number
  scheduleIntervalMinutes?: number | null
  publishedAtUtc?: string | null
  createdAtUtc: string
  updatedAtUtc: string
  dataSource?: DataSource | null
  targetAttributeDefinition?: SemanticAttributeDefinition | null
}

export interface SelectorExecution {
  id: string
  tenantId: string
  selectorDefinitionId: string
  userProfileId: string
  correlationId: string
  triggeredBy: string
  executionMode: SelectorExecutionMode
  status: SelectorExecutionStatus
  rawSourceDataJson: string
  validationErrorsJson: string
  pipelineTraceJson: string
  resultValueJson: string
  resultValueType: FactValueType
  resultConfidence: number
  resultObservedAtUtc?: string | null
  resultExplanation: string
  resultProvenanceJson: string
  requestedAtUtc: string
  startedAtUtc?: string | null
  completedAtUtc?: string | null
  errorMessage?: string | null
  selectorDefinition?: SelectorDefinition | null
  userProfile?: UserProfile | null
}

export interface ContextFactResult {
  id: string
  attributeKey: string
  valueJson: string
  valueType: FactValueType
  confidence: number
  observedAtUtc: string
  freshUntilUtc?: string | null
  sourceSelectorDefinitionId: string
  explanation: string
  provenanceJson: string
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
  history?: ContextSnapshotHistoryResult[]
  facts: ContextFactResult[]
}

export interface GroundedContextFactResult {
  citationId: string
  factId: string
  attributeKey: string
  displayName: string
  valueJson: string
  valueType: FactValueType
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

export interface CitedInsight {
  text: string
  citations: string[]
  confidence: number
}

export interface OutreachStrategy {
  summary: string
  recommendedChannel: string
  timingRecommendation: string
  keyTalkingPoints: CitedInsight[]
  risks: CitedInsight[]
  confidence: number
  humanReviewRecommended: boolean
  humanReviewReason: string
}

export interface PersonalizedEmailDraft {
  subjectLine: string
  previewText: string
  body: string
  callToAction: string
  supportingClaims: CitedInsight[]
  confidence: number
  humanReviewRecommended: boolean
  humanReviewReason: string
}

export interface FollowUpRecommendation {
  action: string
  timing: string
  rationale: string
  citations: string[]
  confidence: number
}

export interface FollowUpRecommendationSet {
  recommendations: FollowUpRecommendation[]
  lowConfidenceSignals: string[]
  missingInformation: string[]
  confidence: number
  humanReviewRecommended: boolean
  humanReviewReason: string
}

export interface SalesSupportResponse {
  salesObjective: string
  outreachStrategy: OutreachStrategy
  personalizedEmailDraft: PersonalizedEmailDraft
  followUpRecommendations: FollowUpRecommendationSet
  missingInformation: string[]
  humanReviewRecommended: boolean
  humanReviewReason: string
  overallConfidence: number
}

export interface RecommendationEvidence {
  citationId: string
  factId: string
  attributeKey: string
  displayName: string
  valueJson: string
  confidence: number
  observedAtUtc: string
  freshUntilUtc?: string | null
  isFresh: boolean
  isLowConfidence: boolean
  explanation: string
  provenance: unknown
}

export interface PromptTemplate {
  id: string
  tenantId: string
  name: string
  description: string
  systemPrompt: string
  developerPrompt: string
  userPromptTemplate: string
  outputSchemaJson: string
  guardrailsJson: string
  version: number
  isActive: boolean
  createdAtUtc: string
  updatedAtUtc: string
}

export interface AgentRun {
  id: string
  tenantId: string
  userProfileId: string
  promptTemplateId: string
  contextSnapshotId: string
  providerName: string
  modelName: string
  salesObjective: string
  attemptCount: number
  status: AgentRunStatus
  confidence: number
  inputJson: string
  outputJson: string
  provenanceJson: string
  requestedAtUtc: string
  completedAtUtc?: string | null
  failureReason?: string | null
}

export interface AgentRunResult {
  agentRunId: string
  status: AgentRunStatus
  providerName: string
  modelName: string
  salesObjective: string
  confidence: number
  attemptCount: number
  humanReviewRecommended: boolean
  contextPackageJson: string
  outputJson: string
  provenanceJson: string
  validationErrorsJson: string
  failureReason?: string | null
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

export interface QueueRecomputeResult {
  correlationId: string
  tenantId: string
  userProfileId: string
  executionCount: number
}

export interface SelectorExecutionPreviewResult {
  mode: string
  isSuccess: boolean
  selectorName: string
  rawSourceDataJson: string
  normalizedSourceDataJson: string
  validationErrors: string[]
  valueJson?: string | null
  valueType?: FactValueType | null
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

export interface ScheduledRecomputeDispatchResult {
  queuedUserCount: number
  skippedUserCount: number
}

export interface BackgroundWorkerStatus {
  workerName: string
  isHealthy: boolean
  message: string
  lastHeartbeatUtc: string
  queueDepth: number
}

export interface OperationalSummary {
  tenant: string
  backgroundWorkers: BackgroundWorkerStatus[]
  stats: {
    activeAgentRuns: number
    failedAgentRuns: number
    pendingExecutions: number
    staleSnapshots: number
  }
}

export interface UpsertDataSourceInput {
  id?: string | null
  tenantSlug: string
  name: string
  description: string
  kind: DataSourceKind
  connectionConfigJson: string
}

export interface UpsertSemanticAttributeInput {
  id?: string | null
  tenantSlug: string
  key: string
  displayName: string
  description: string
  dataType: SemanticDataType
  exampleValueJson: string
  isSystem: boolean
}

export interface UpsertSelectorDefinitionInput {
  id?: string | null
  tenantSlug: string
  dataSourceId?: string | null
  targetAttributeDefinitionId: string
  name: string
  description: string
  mappingKind: SelectorMappingKind
  expressionJson: string
  explanationTemplate: string
  validationSchemaJson: string
  defaultConfidence: number
  freshnessWindowMinutes: number
  priority: number
  scheduleIntervalMinutes?: number | null
}

export interface PublishSelectorDefinitionInput {
  tenantSlug: string
  selectorDefinitionId: string
}

export interface QueueContextRecomputeInput {
  tenantSlug: string
  externalUserId: string
  triggeredBy: string
}

export interface UserContextLookupInput {
  tenantSlug: string
  externalUserId: string
}

export interface SalesContextPackageInput {
  tenantSlug: string
  externalUserId: string
  salesObjective: string
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

export interface RunScheduledRecomputeInput {
  tenantSlug?: string | null
}

export interface CreateAgentRunInput {
  tenantSlug: string
  externalUserId: string
  promptTemplateId: string
  modelName: string
  salesObjective: string
  providerName?: string | null
}

export interface AuthenticatedOperator {
  tenantId: string
  tenantSlug: string
  operatorAccountId: string
  email: string
  displayName: string
  role: 'tenant_admin' | 'sales_rep'
}

export interface AuthSession extends AuthenticatedOperator {
  accessToken: string
  expiresAtUtc: string
}

export interface LoginRequest {
  tenantSlug: string
  email: string
  password: string
}
