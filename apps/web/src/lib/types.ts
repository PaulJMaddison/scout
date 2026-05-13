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

export type ConnectorCatalogueAvailability = 'OpenCore' | 'Enterprise' | 'SaaSManaged' | 'ComingSoon'

export type ConnectorPublicStatus =
  | 'PublicGenericExample'
  | 'PaidEnterpriseImplementation'
  | 'PlannedConnector'
  | 'CustomerSpecificConnector'

export interface ConnectorCatalogueEntry {
  connectorType: string
  displayName: string
  description: string
  category: string
  publicStatus: ConnectorPublicStatus
  availability: ConnectorCatalogueAvailability
  isIncludedInOpenCore: boolean
  requiresCommercialAgreement: boolean
  isPlaceholder: boolean
  isEnabled: boolean
  supportedDataSourceKinds: string[]
  capabilities: string[]
  configurationSchemaJson: string
  credentialSchemaJson: string
  healthCheckMode: string
}

export interface BillingPlanLimit {
  metric: string
  displayName: string
  limit?: number | null
  window: string
  enforcement: string
  notes: string
  used?: number | null
  remaining?: number | null
  isUnlimited: boolean
}

export interface BillingUsageMetric {
  metric: string
  displayName: string
  quantity: number
  limit?: number | null
  remaining?: number | null
  window: string
  windowStartUtc: string
  windowEndUtc: string
}

export interface BillingUsageOverview {
  tenantId: string
  tenantSlug: string
  tenantName: string
  plan: 'Free' | 'Pro' | 'Business' | 'Enterprise' | string
  status: string
  currentPeriodStartUtc: string
  currentPeriodEndUtc: string
  retentionDays: number
  limits: BillingPlanLimit[]
  usage: BillingUsageMetric[]
  providerIntegrationStatus: string
}

export interface OrganisationSettings {
  tenantId: string
  tenantSlug: string
  tenantName: string
  isActive: boolean
  createdAtUtc: string
  updatedAtUtc: string
  plan?: string | null
  subscriptionStatus?: string | null
  workspaceCount: number
  userCount: number
  apiClientCount: number
}

export interface WorkspaceSummary {
  id: string
  slug: string
  name: string
  description: string
  status: string
  isDefault: boolean
}

export interface OperatorWorkspaceMembership {
  workspaceId: string
  workspaceSlug: string
  workspaceName: string
  role: string
  acceptedAtUtc?: string | null
}

export interface OperatorAccountSummary {
  id: string
  tenantId: string
  email: string
  displayName: string
  role: string
  isActive: boolean
  lastLoginAtUtc?: string | null
  createdAtUtc: string
  updatedAtUtc: string
  workspaces: OperatorWorkspaceMembership[]
}

export interface UpdateOperatorAccountInput {
  tenantSlug: string
  operatorAccountId: string
  displayName: string
  role: string
  isActive: boolean
}

export interface ApiClientSummary {
  id: string
  tenantId: string
  workspaceId?: string | null
  clientId: string
  displayName: string
  status: string
  scopes: string[]
  lastUsedAtUtc?: string | null
  rotatedAtUtc?: string | null
  revokedAtUtc?: string | null
}

export interface CreateApiClientInput {
  tenantSlug: string
  workspaceSlug?: string | null
  displayName: string
  scopes: string[]
}

export interface ApiClientCreatedResult extends ApiClientSummary {
  apiKey: string
  createdAtUtc: string
}

export interface ApiClientRotatedResult {
  id: string
  clientId: string
  apiKey: string
  rotatedAtUtc: string
}

export interface SourceSystemEventHistory {
  id: string
  tenantId: string
  workspaceId?: string | null
  eventId: string
  sourceSystem: string
  eventType: string
  status: string
  externalUserId?: string | null
  externalAccountId?: string | null
  userProfileId?: string | null
  dataSourceId?: string | null
  matchedSelectorCount: number
  processingSummary: string
  errorMessage?: string | null
  deadLetterReason?: string | null
  correlationId: string
  receivedAtUtc: string
  observedAtUtc: string
  processedAtUtc?: string | null
  deadLetteredAtUtc?: string | null
  payloadJson: string
}

export interface BlueprintImportHistory {
  id: string
  tenantId: string
  workspaceId?: string | null
  workspaceSlug?: string | null
  name: string
  status: string
  uploadedBy: string
  validationIssueCount: number
  previewChangeCount: number
  importSummaryJson: string
  uploadedAtUtc: string
  validatedAtUtc?: string | null
  importedAtUtc?: string | null
}

export interface GovernancePolicy {
  id: string
  tenantId: string
  blueprintImportId?: string | null
  policyType: string
  key: string
  displayName: string
  description: string
  status: string
  definitionJson: string
  createdAtUtc: string
  updatedAtUtc: string
}

export interface LicenceEntitlement {
  key: string
  value: string
}

export interface LicenceStatus {
  mode: string
  status: string
  plan: string
  licenceKeyFingerprint: string
  licensedTo: string
  source: string
  issuedAtUtc?: string | null
  expiresAtUtc?: string | null
  lastCheckedAtUtc?: string | null
  isValid: boolean
  isExpired: boolean
  isInOfflineGracePeriod: boolean
  offlineGracePeriodDays: number
  controlPlaneBaseUrl: string
  updateChannel: string
  usageReportingEnabled: boolean
  entitlements: LicenceEntitlement[]
  warnings: string[]
}

export interface PagedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  hasMore: boolean
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

export interface UpsertPromptTemplateInput {
  id?: string | null
  tenantSlug: string
  name: string
  description: string
  systemPrompt: string
  developerPrompt: string
  userPromptTemplate: string
  outputSchemaJson: string
  guardrailsJson: string
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

export interface SubmitOnboardingInput {
  organisationName: string
  tenantSlug: string
  primaryWorkspaceName: string
  adminDisplayName: string
  adminEmail: string
  adminPassword: string
  intendedUseCase: string
  sourceSystems: string[]
  dataCategories: string[]
  aiUseCases: string[]
  piiSensitivityLevel: 'low' | 'moderate' | 'high' | 'regulated'
  preferredDeploymentMode: 'local-demo' | 'self-hosted' | 'managed-saas' | 'private-cloud'
}

export interface OnboardingNextStepResult {
  title: string
  description: string
  action: string
}

export interface OnboardingResult {
  onboardingApplicationId: string
  tenantId: string
  tenantSlug: string
  workspaceId: string
  workspaceSlug: string
  adminOperatorAccountId: string
  createdSemanticAttributes: string[]
  createdSelectors: string[]
  createdDataSources: string[]
  nextSteps: OnboardingNextStepResult[]
}

export interface UploadBlueprintInput {
  tenantSlug: string
  workspaceSlug?: string | null
  name?: string | null
  blueprintJson: string
}

export interface BlueprintImportInput {
  tenantSlug: string
  importId?: string | null
  blueprintJson?: string | null
}

export interface BlueprintValidationIssueResult {
  path: string
  message: string
  severity: string
  line?: number | null
  bytePositionInLine?: number | null
}

export interface BlueprintChangeResult {
  entityType: string
  name: string
  action: string
  path: string
}

export interface BlueprintImportSummaryResult {
  dataSources: number
  semanticAttributes: number
  selectors: number
  promptTemplates: number
  piiRules: number
  auditPolicies: number
}

export interface BlueprintImportResult {
  importId?: string | null
  status: string
  isValid: boolean
  blueprintName: string
  blueprintSchemaJson: string
  issues: BlueprintValidationIssueResult[]
  preview: BlueprintChangeResult[]
  createdDataSources: string[]
  createdSemanticAttributes: string[]
  createdSelectors: string[]
  createdPromptTemplates: string[]
  createdPiiRules: string[]
  createdAuditPolicies: string[]
  summary: BlueprintImportSummaryResult
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
  workspaceId?: string | null
  workspaceSlug?: string | null
  operatorAccountId: string
  email: string
  displayName: string
  role: 'platform_owner' | 'tenant_admin' | 'integration_admin' | 'analyst' | 'sales_rep' | 'read_only' | 'api_client'
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
