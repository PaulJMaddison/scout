import type {
  AgentRun,
  AgentRunResult,
  AuthenticatedOperator,
  AuditEvent,
  BackgroundWorkerStatus,
  BillingUsageOverview,
  BlueprintImportInput,
  BlueprintImportResult,
  ConnectorCatalogueEntry,
  ContextFactResult,
  ContextProfileResult,
  CreateAgentRunInput,
  DataSource,
  GroundedContextFactResult,
  LicenceStatus,
  LoginRequest,
  OnboardingResult,
  OperationalSummary,
  PagedResponse,
  PromptTemplate,
  PublishSelectorDefinitionInput,
  QueueContextRecomputeInput,
  QueueRecomputeResult,
  RunScheduledRecomputeInput,
  SalesContextPackageResult,
  SalesSupportResponse,
  ScheduledRecomputeDispatchResult,
  SelectorDefinition,
  SelectorExecution,
  SelectorExecutionMode,
  SelectorExecutionPreviewResult,
  SelectorValidationResult,
  SemanticAttributeDefinition,
  SubmitOnboardingInput,
  UploadBlueprintInput,
  UpsertDataSourceInput,
  UpsertPromptTemplateInput,
  UpsertSelectorDefinitionInput,
  UpsertSemanticAttributeInput,
  UserProfile,
} from '@/lib/types'
import { authStore } from '@/lib/auth'
import { prettyJson, safeJsonParse } from '@/lib/utils'
import { sampleBlueprint } from '@/features/bootstrap/bootstrap-studio-data'

type OperationName =
  | 'GetUserProfiles'
  | 'GetDataSources'
  | 'GetSemanticAttributes'
  | 'GetSelectors'
  | 'GetSelectorExecutions'
  | 'GetPromptTemplates'
  | 'GetAgentRuns'
  | 'GetAuditEvents'
  | 'GetOrganisationSettings'
  | 'GetWorkspaces'
  | 'GetOperatorAccounts'
  | 'UpdateOperatorAccount'
  | 'GetApiClients'
  | 'CreateApiClient'
  | 'RotateApiClient'
  | 'RevokeApiClient'
  | 'GetSourceSystemEvents'
  | 'GetBlueprintImports'
  | 'GetGovernancePolicies'
  | 'GetUserContext'
  | 'GetSalesContextPackage'
  | 'UpsertDataSource'
  | 'UpsertSemanticAttribute'
  | 'UpsertPromptTemplate'
  | 'UpsertSelector'
  | 'PublishSelector'
  | 'PreviewSelector'
  | 'ValidateSelector'
  | 'QueueContextRecompute'
  | 'RunScheduledRecompute'
  | 'CreateAgentRun'

interface MockSignal {
  id: string
  tenantId: string
  userProfileId: string
  dataSourceId: string
  key: string
  value: unknown
  valueType: ContextFactResult['valueType']
  observedAtUtc: string
  provenance: readonly unknown[]
}

interface ContextSnapshotRecord {
  id: string
  tenantId: string
  userProfileId: string
  generatedAtUtc: string
  summary: string
  overallConfidence: number
  isStale: boolean
  facts: ContextFactResult[]
}

interface MockState {
  tenantSlug: string
  tenantId: string
  dataSources: DataSource[]
  semanticAttributes: SemanticAttributeDefinition[]
  selectors: SelectorDefinition[]
  selectorExecutions: SelectorExecution[]
  users: UserProfile[]
  promptTemplates: PromptTemplate[]
  agentRuns: AgentRun[]
  auditEvents: AuditEvent[]
  signals: MockSignal[]
  snapshots: ContextSnapshotRecord[]
}

interface MockOperatorAccount {
  tenantSlug: string
  email: string
  password: string
  operator: AuthenticatedOperator
}

interface MockSelectorWeightedComponent {
  sourcePath?: string
  weight?: number
  map?: Record<string, unknown>
  defaultValue?: number
  expected?: string
  threshold?: number
  trueValue?: number
  falseValue?: number
}

interface MockSelectorFormulaVariable {
  name?: string
  sourcePath?: string
  multiplier?: number
  threshold?: number
  trueValue?: number
  falseValue?: number
}

interface MockSelectorRule {
  valuePath?: string
  map?: Record<string, unknown>
  thresholds?: Array<{ min?: number; max?: number; label?: string }>
  components?: MockSelectorWeightedComponent[]
  minimum?: number
  maximum?: number
  variables?: MockSelectorFormulaVariable[]
  expression?: string
}

const isoNow = () => new Date().toISOString()
const isoDaysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

const mappingKindLabels: Record<SelectorDefinition['mappingKind'], string> = {
  DIRECT_FIELD_MAPPING: 'Direct field mapping',
  WEIGHTED_SCORING: 'Weighted scoring',
  THRESHOLD_CLASSIFICATION: 'Threshold classification',
  STRING_TO_ENUM_MAPPING: 'String-to-enum mapping',
  FORMULA_METRIC: 'Formula metric',
}

const mockState = createSeedState()
seedInitialSnapshots(mockState)

const mockOperatorAccounts: MockOperatorAccount[] = [
  {
    tenantSlug: 'demo',
    email: 'admin@contextlayer.local',
    password: 'DemoAdmin123!',
    operator: {
      tenantId: mockState.tenantId,
      tenantSlug: 'demo',
      operatorAccountId: crypto.randomUUID(),
      email: 'admin@contextlayer.local',
      displayName: 'Dana Mercer',
      role: 'tenant_admin',
    },
  },
  {
    tenantSlug: 'demo',
    email: 'rep@contextlayer.local',
    password: 'DemoSales123!',
    operator: {
      tenantId: mockState.tenantId,
      tenantSlug: 'demo',
      operatorAccountId: crypto.randomUUID(),
      email: 'rep@contextlayer.local',
      displayName: 'Jordan Kim',
      role: 'sales_rep',
    },
  },
]

const connectorCatalogue: ConnectorCatalogueEntry[] = [
  connectorCatalogueEntry('sqlDatabase', 'SQL Database', 'Database', 'OpenCore', false, [
    'Generic SQL connector for local demo databases and PostgreSQL deployments.',
    'Opens configured database connections for health checks.',
  ]),
  connectorCatalogueEntry('restApi', 'REST API', 'API', 'OpenCore', false, [
    'Generic REST connector for JSON source payloads.',
    'Supports static responses for safe demos and previews.',
  ]),
  connectorCatalogueEntry('csvUpload', 'CSV upload', 'File', 'OpenCore', false, [
    'Demo-safe parsed rows for CSV and spreadsheet onboarding.',
    'Production file storage belongs behind a separate extension point.',
  ]),
  connectorCatalogueEntry('mockCrm', 'Mock CRM', 'Demo', 'OpenCore', false, [
    'Fictional CRM records for selectors and context snapshots.',
    'Safe local implementation included.',
  ]),
  connectorCatalogueEntry('mockBilling', 'Mock Billing', 'Demo', 'OpenCore', false, [
    'Fictional plan, invoice, and payment-risk records.',
    'Safe local implementation included.',
  ]),
  connectorCatalogueEntry('mockSupport', 'Mock Support', 'Demo', 'OpenCore', false, [
    'Fictional support tickets and satisfaction signals.',
    'Safe local implementation included.',
  ]),
  connectorCatalogueEntry('salesforce', 'Salesforce placeholder', 'CRM', 'SaaSManaged', true, [
    'Catalogue metadata only.',
    'No Salesforce implementation ships in the public repo.',
  ]),
  connectorCatalogueEntry('hubspot', 'HubSpot placeholder', 'CRM', 'SaaSManaged', true, [
    'Catalogue metadata only.',
    'No HubSpot implementation ships in the public repo.',
  ]),
  connectorCatalogueEntry('dynamics', 'Dynamics placeholder', 'CRM', 'Enterprise', true, [
    'Catalogue metadata only.',
    'No Dynamics implementation ships in the public repo.',
  ]),
  connectorCatalogueEntry('snowflake', 'Snowflake placeholder', 'Warehouse', 'Enterprise', true, [
    'Catalogue metadata only.',
    'No Snowflake implementation ships in the public repo.',
  ]),
  connectorCatalogueEntry('bigquery', 'BigQuery placeholder', 'Warehouse', 'Enterprise', true, [
    'Catalogue metadata only.',
    'No BigQuery implementation ships in the public repo.',
  ]),
  connectorCatalogueEntry('zendesk', 'Zendesk placeholder', 'Support', 'SaaSManaged', true, [
    'Catalogue metadata only.',
    'No Zendesk implementation ships in the public repo.',
  ]),
  connectorCatalogueEntry('netsuite', 'NetSuite placeholder', 'ERP', 'ComingSoon', true, [
    'Catalogue metadata only.',
    'No NetSuite implementation ships in the public repo.',
  ]),
]

export async function mockLogin(input: LoginRequest) {
  await new Promise((resolve) => window.setTimeout(resolve, 120))
  const account = mockOperatorAccounts.find(
    (entry) =>
      entry.tenantSlug === input.tenantSlug.trim().toLowerCase() &&
      entry.email === input.email.trim().toLowerCase() &&
      entry.password === input.password,
  )

  if (!account) {
    throw new Error('Invalid tenant or credentials.')
  }

  return {
    accessToken: `demo-${account.operator.role}-token`,
    expiresAtUtc: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    operator: account.operator,
  }
}

export async function mockGetMe() {
  await new Promise((resolve) => window.setTimeout(resolve, 60))
  const session = authStore.getSession()
  if (!session) {
    throw new Error('Not authenticated.')
  }

  return {
    tenantId: session.tenantId,
    tenantSlug: session.tenantSlug,
    operatorAccountId: session.operatorAccountId,
    email: session.email,
    displayName: session.displayName,
    role: session.role,
  } satisfies AuthenticatedOperator
}

export async function mockGetOperationalSummary() {
  await new Promise((resolve) => window.setTimeout(resolve, 90))
  const workers: BackgroundWorkerStatus[] = [
    {
      workerName: 'context-recompute-queue',
      isHealthy: true,
      message: 'Queue initialized.',
      lastHeartbeatUtc: isoNow(),
      queueDepth: mockState.selectorExecutions.filter((execution) => execution.status === 'PENDING').length,
    },
    {
      workerName: 'context-recompute-worker',
      isHealthy: true,
      message: 'Mock worker healthy.',
      lastHeartbeatUtc: isoNow(),
      queueDepth: 0,
    },
    {
      workerName: 'scheduled-recompute-worker',
      isHealthy: true,
      message: 'Mock dispatcher healthy.',
      lastHeartbeatUtc: isoNow(),
      queueDepth: 0,
    },
  ]

  return {
    tenant: mockState.tenantSlug,
    backgroundWorkers: workers,
    stats: {
      activeAgentRuns: mockState.agentRuns.length,
      failedAgentRuns: mockState.agentRuns.filter((run) => run.status === 'FAILED').length,
      pendingExecutions: mockState.selectorExecutions.filter(
        (execution) => execution.status === 'PENDING' || execution.status === 'RUNNING',
      ).length,
      staleSnapshots: mockState.snapshots.filter((snapshot) => snapshot.isStale).length,
    },
  } satisfies OperationalSummary
}

export async function mockSubmitOnboarding(input: SubmitOnboardingInput) {
  await new Promise((resolve) => window.setTimeout(resolve, 520))
  const tenantSlug = input.tenantSlug.trim().toLowerCase()
  const workspaceSlug = slugify(input.primaryWorkspaceName)
  const createdSemanticAttributes = [
    'customerIdentity',
    'aiReadinessSummary',
    ...(input.dataCategories.some((category) => /crm/i.test(category)) ? ['accountHealth', 'buyingIntent'] : []),
    ...(input.dataCategories.some((category) => /product|usage/i.test(category)) ? ['productUsageMaturity'] : []),
    ...(input.dataCategories.some((category) => /support/i.test(category)) ? ['supportRisk'] : []),
    ...(input.dataCategories.some((category) => /billing/i.test(category)) ? ['billingReadiness'] : []),
    ...(input.dataCategories.some((category) => /marketing/i.test(category)) ? ['marketingEngagement'] : []),
    ...(input.dataCategories.some((category) => /warehouse|sql|spreadsheet/i.test(category)) ? ['sourceCoverage'] : []),
  ]
  const uniqueAttributes = [...new Set(createdSemanticAttributes)]

  return {
    onboardingApplicationId: crypto.randomUUID(),
    tenantId: crypto.randomUUID(),
    tenantSlug,
    workspaceId: crypto.randomUUID(),
    workspaceSlug,
    adminOperatorAccountId: crypto.randomUUID(),
    createdSemanticAttributes: uniqueAttributes,
    createdSelectors: uniqueAttributes.map((attribute) => `Starter ${humanizeKey(attribute)} selector`),
    createdDataSources: input.sourceSystems.map((system) => `${system} starter source`),
    nextSteps: [
      {
        title: 'Review semantic schema',
        description: 'Inspect the starter attributes and tune names before teams rely on them.',
        action: '/semantic-schema',
      },
      {
        title: 'Connect real systems',
        description: 'Replace mock starter sources with safe connector registrations.',
        action: '/data-sources',
      },
      {
        title: 'Validate selectors',
        description: 'Preview generated mappings against sample records before publishing production selectors.',
        action: '/selectors',
      },
      {
        title: 'Generate trusted context',
        description: 'Use the workspace to generate the first AI-ready context snapshot and package.',
        action: `/customers?workspace=${workspaceSlug}`,
      },
      {
        title: 'Plan deployment',
        description: deploymentGuidance(input.preferredDeploymentMode),
        action: '/commercial',
      },
    ],
  } satisfies OnboardingResult
}

export async function mockGetConnectorCatalogue(): Promise<PagedResponse<ConnectorCatalogueEntry>> {
  await new Promise((resolve) => window.setTimeout(resolve, 120))
  return {
    items: connectorCatalogue,
    page: 1,
    pageSize: 100,
    totalCount: connectorCatalogue.length,
    hasMore: false,
  }
}

export async function mockGetLicenceStatus(): Promise<LicenceStatus> {
  await new Promise((resolve) => window.setTimeout(resolve, 120))
  return {
    mode: 'Community',
    status: 'Community',
    plan: 'Community',
    licenceKeyFingerprint: 'demo-preview',
    licensedTo: 'Universal Context Layer local demo',
    source: '.demo-data/ucl-demo.licence.json',
    issuedAtUtc: isoDaysAgo(1),
    expiresAtUtc: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString(),
    lastCheckedAtUtc: new Date().toISOString(),
    isValid: true,
    isExpired: false,
    isInOfflineGracePeriod: false,
    offlineGracePeriodDays: 30,
    controlPlaneBaseUrl: '',
    updateChannel: 'stable',
    usageReportingEnabled: false,
    entitlements: [
      { key: 'open-core', value: 'enabled' },
      { key: 'local-demo', value: 'enabled' },
      { key: 'self-hosted-admin-console', value: 'enabled' },
      { key: 'enterprise-connectors', value: 'not-in-public-repo' },
    ],
    warnings: [],
  }
}

export async function mockGetBillingUsage(tenantSlug = 'demo'): Promise<BillingUsageOverview> {
  await new Promise((resolve) => window.setTimeout(resolve, 140))
  const now = new Date()
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  const limits = [
    ['Workspaces', 'Workspaces', 3, 1, 'active'],
    ['Users', 'Users', 25, 6, 'active'],
    ['ApiClients', 'API clients', 5, 1, 'active'],
    ['Selectors', 'Selectors', 50, mockState.selectors.length, 'active'],
    ['ContextLookups', 'Context lookups', 25_000, 1840, 'monthly'],
    ['Recomputations', 'Recomputations', 2_500, 42, 'monthly'],
    ['SourceEvents', 'Source events', 25_000, 9700, 'monthly'],
    ['BlueprintImports', 'Blueprint imports', 10, 1, 'monthly'],
    ['RetentionDays', 'Retention days', 90, 90, 'retention'],
  ] as const

  return {
    tenantId: 'tenant-demo',
    tenantSlug,
    tenantName: tenantSlug === 'demo' ? 'Demo Sales Workspace' : `${tenantSlug} Workspace`,
    plan: 'Pro',
    status: 'Active',
    currentPeriodStartUtc: periodStart.toISOString(),
    currentPeriodEndUtc: periodEnd.toISOString(),
    retentionDays: 90,
    limits: limits.map(([metric, displayName, limit, used, window]) => ({
      metric,
      displayName,
      limit,
      window,
      enforcement: metric === 'RetentionDays' ? 'policy' : 'hard',
      notes: `${displayName} allowance for the local fictional demo.`,
      used,
      remaining: Math.max(0, limit - used),
      isUnlimited: false,
    })),
    usage: limits
      .filter(([metric]) => ['ContextLookups', 'Recomputations', 'SourceEvents', 'BlueprintImports'].includes(metric))
      .map(([metric, displayName, limit, used, window]) => ({
        metric,
        displayName,
        quantity: used,
        limit,
        remaining: Math.max(0, limit - used),
        window,
        windowStartUtc: periodStart.toISOString(),
        windowEndUtc: periodEnd.toISOString(),
      })),
    providerIntegrationStatus: 'NotConnected',
  }
}

export async function mockUploadBlueprint(input: UploadBlueprintInput): Promise<BlueprintImportResult> {
  await new Promise((resolve) => window.setTimeout(resolve, 160))
  return blueprintResult('Uploaded', input.blueprintJson, false)
}

export async function mockValidateBlueprint(input: BlueprintImportInput): Promise<BlueprintImportResult> {
  await new Promise((resolve) => window.setTimeout(resolve, 180))
  return blueprintResult('Validated', input.blueprintJson ?? prettyJson(sampleBlueprint), false)
}

export async function mockPreviewBlueprint(input: BlueprintImportInput): Promise<BlueprintImportResult> {
  await new Promise((resolve) => window.setTimeout(resolve, 180))
  return blueprintResult('PreviewReady', input.blueprintJson ?? prettyJson(sampleBlueprint), false)
}

export async function mockImportBlueprint(input: BlueprintImportInput): Promise<BlueprintImportResult> {
  await new Promise((resolve) => window.setTimeout(resolve, 420))
  const result = blueprintResult('Imported', input.blueprintJson ?? prettyJson(sampleBlueprint), true)
  return result
}

export async function mockGraphqlRequest<T>(
  operationName: OperationName,
  variables: Record<string, unknown> | undefined,
): Promise<T> {
  await new Promise((resolve) => window.setTimeout(resolve, 120))

  switch (operationName) {
    case 'GetUserProfiles':
      return { userProfiles: listUsers(assertTenant(variables)) } as T
    case 'GetDataSources':
      return { dataSources: listDataSources(assertTenant(variables)) } as T
    case 'GetSemanticAttributes':
      return { semanticAttributes: listSemanticAttributes(assertTenant(variables)) } as T
    case 'GetSelectors':
      return { selectors: listSelectors(assertTenant(variables)) } as T
    case 'GetSelectorExecutions':
      return {
        selectorExecutions: listSelectorExecutions(
          assertTenant(variables),
          (variables?.externalUserId as string | undefined) ?? undefined,
        ),
      } as T
    case 'GetPromptTemplates':
      return { promptTemplates: listPromptTemplates(assertTenant(variables)) } as T
    case 'GetAgentRuns':
      return {
        agentRuns: listAgentRuns(
          assertTenant(variables),
          (variables?.externalUserId as string | undefined) ?? undefined,
        ),
      } as T
    case 'GetAuditEvents':
      return { auditEvents: listAuditEvents(assertTenant(variables)) } as T
    case 'GetOrganisationSettings':
      return {
        organisationSettings: {
          tenantId: mockState.tenantId,
          tenantSlug: mockState.tenantSlug,
          tenantName: 'Demo Sales Workspace',
          isActive: true,
          createdAtUtc: isoDaysAgo(30),
          updatedAtUtc: isoNow(),
          plan: 'Pro',
          subscriptionStatus: 'Active',
          workspaceCount: 1,
          userCount: mockOperatorAccounts.length,
          apiClientCount: 0,
        },
      } as T
    case 'GetWorkspaces':
      return {
        workspaces: [
          {
            id: crypto.randomUUID(),
            slug: 'default',
            name: 'Default workspace',
            description: 'Seeded workspace for the fictional local demo tenant.',
            status: 'Active',
            isDefault: true,
          },
        ],
      } as T
    case 'GetOperatorAccounts':
      return {
        operatorAccounts: mockOperatorAccounts.map((account) => ({
          id: account.operator.operatorAccountId,
          tenantId: account.operator.tenantId,
          email: account.operator.email,
          displayName: account.operator.displayName,
          role: account.operator.role === 'tenant_admin' ? 'TenantAdmin' : 'SalesUser',
          isActive: true,
          lastLoginAtUtc: isoDaysAgo(1),
          createdAtUtc: isoDaysAgo(30),
          updatedAtUtc: isoDaysAgo(1),
          workspaces: [
            {
              workspaceId: crypto.randomUUID(),
              workspaceSlug: 'default',
              workspaceName: 'Default workspace',
              role: account.operator.role === 'tenant_admin' ? 'Owner' : 'Member',
              acceptedAtUtc: isoDaysAgo(30),
            },
          ],
        })),
      } as T
    case 'UpdateOperatorAccount':
      return { updateOperatorAccount: variables?.input } as T
    case 'GetApiClients':
      return { apiClients: [] } as T
    case 'CreateApiClient':
      return {
        createApiClient: {
          id: crypto.randomUUID(),
          tenantId: mockState.tenantId,
          workspaceId: null,
          clientId: `ucl_demo_${crypto.randomUUID().replaceAll('-', '').slice(0, 16)}`,
          displayName: (variables?.input as { displayName?: string } | undefined)?.displayName ?? 'Demo client',
          apiKey: `ucl_live_${crypto.randomUUID().replaceAll('-', '')}`,
          scopes: (variables?.input as { scopes?: string[] } | undefined)?.scopes ?? ['context:read'],
          createdAtUtc: isoNow(),
        },
      } as T
    case 'RotateApiClient':
      return {
        rotateApiClient: {
          id: crypto.randomUUID(),
          clientId: variables?.clientId,
          apiKey: `ucl_live_${crypto.randomUUID().replaceAll('-', '')}`,
          rotatedAtUtc: isoNow(),
        },
      } as T
    case 'RevokeApiClient':
      return { revokeApiClient: true } as T
    case 'GetSourceSystemEvents':
      return { sourceSystemEvents: [] } as T
    case 'GetBlueprintImports':
      return { blueprintImports: [] } as T
    case 'GetGovernancePolicies':
      return { governancePolicies: [] } as T
    case 'GetUserContext':
      return {
        userContext: getUserContext(
          assertTenant(variables),
          variables?.input as { externalUserId: string; tenantSlug: string },
        ),
      } as T
    case 'GetSalesContextPackage':
      return {
        salesContextPackage: getSalesContextPackage(
          assertTenant(variables),
          variables?.input as { externalUserId: string; tenantSlug: string; salesObjective: string },
        ),
      } as T
    case 'UpsertDataSource':
      return { upsertDataSource: upsertDataSource(variables?.input as UpsertDataSourceInput) } as T
    case 'UpsertSemanticAttribute':
      return {
        upsertSemanticAttribute: upsertSemanticAttribute(
          variables?.input as UpsertSemanticAttributeInput,
        ),
      } as T
    case 'UpsertPromptTemplate':
      return {
        upsertPromptTemplate: upsertPromptTemplate(
          variables?.input as UpsertPromptTemplateInput,
        ),
      } as T
    case 'UpsertSelector':
      return { upsertSelector: upsertSelector(variables?.input as UpsertSelectorDefinitionInput) } as T
    case 'PublishSelector':
      return {
        publishSelector: publishSelector(variables?.input as PublishSelectorDefinitionInput),
      } as T
    case 'PreviewSelector':
      return { previewSelector: previewSelector(variables?.input) } as T
    case 'ValidateSelector':
      return { validateSelector: validateSelector(variables?.input) } as T
    case 'QueueContextRecompute':
      return {
        queueContextRecompute: queueContextRecompute(variables?.input as QueueContextRecomputeInput),
      } as T
    case 'RunScheduledRecompute':
      return {
        runScheduledRecompute: runScheduledRecompute(
          variables?.input as RunScheduledRecomputeInput | undefined,
        ),
      } as T
    case 'CreateAgentRun':
      return { createAgentRun: createAgentRun(variables?.input as CreateAgentRunInput) } as T
    default:
      throw new Error(`Mock transport does not support ${operationName}.`)
  }
}

function assertTenant(variables: Record<string, unknown> | undefined) {
  const tenantSlug =
    (variables?.tenantSlug as string | undefined) ??
    ((variables?.input as { tenantSlug?: string } | undefined)?.tenantSlug ?? 'demo')

  if (tenantSlug !== mockState.tenantSlug) {
    throw new Error(`Unknown mock tenant '${tenantSlug}'.`)
  }

  return tenantSlug
}

function listUsers(tenantSlug: string) {
  void tenantSlug
  const shouldMaskEmail = authStore.getSession()?.role === 'sales_rep'
  return [...mockState.users]
    .map((user) => ({
      ...user,
      email: shouldMaskEmail ? maskEmail(user.email) : user.email,
      isEmailMasked: shouldMaskEmail,
    }))
    .sort((left, right) => left.externalUserId.localeCompare(right.externalUserId))
}

function listDataSources(tenantSlug: string) {
  void tenantSlug
  return [...mockState.dataSources].sort((left, right) => left.name.localeCompare(right.name))
}

function listSemanticAttributes(tenantSlug: string) {
  void tenantSlug
  return [...mockState.semanticAttributes].sort((left, right) => left.key.localeCompare(right.key))
}

function listSelectors(tenantSlug: string) {
  void tenantSlug
  return [...mockState.selectors]
    .map((selector) => ({
      ...selector,
      dataSource: mockState.dataSources.find((item) => item.id === selector.dataSourceId) ?? null,
      targetAttributeDefinition:
        mockState.semanticAttributes.find(
          (item) => item.id === selector.targetAttributeDefinitionId,
        ) ?? null,
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

function listSelectorExecutions(tenantSlug: string, externalUserId?: string) {
  void tenantSlug
  const filteredUsers = externalUserId
    ? mockState.users.filter((user) => user.externalUserId === externalUserId).map((user) => user.id)
    : null

  return [...mockState.selectorExecutions]
    .filter((execution) => (filteredUsers ? filteredUsers.includes(execution.userProfileId) : true))
    .map((execution) => ({
      ...execution,
      selectorDefinition:
        mockState.selectors.find((item) => item.id === execution.selectorDefinitionId) ?? null,
      userProfile: mockState.users.find((item) => item.id === execution.userProfileId) ?? null,
    }))
    .sort((left, right) => right.requestedAtUtc.localeCompare(left.requestedAtUtc))
}

function listPromptTemplates(tenantSlug: string) {
  void tenantSlug
  return [...mockState.promptTemplates]
}

function listAgentRuns(tenantSlug: string, externalUserId?: string) {
  void tenantSlug
  const filteredUsers = externalUserId
    ? mockState.users.filter((user) => user.externalUserId === externalUserId).map((user) => user.id)
    : null

  return [...mockState.agentRuns]
    .filter((run) => (filteredUsers ? filteredUsers.includes(run.userProfileId) : true))
    .sort((left, right) => right.requestedAtUtc.localeCompare(left.requestedAtUtc))
}

function listAuditEvents(tenantSlug: string) {
  void tenantSlug
  return [...mockState.auditEvents].sort((left, right) =>
    right.createdAtUtc.localeCompare(left.createdAtUtc),
  )
}

function getUserContext(
  tenantSlug: string,
  input: { externalUserId: string; tenantSlug: string },
): ContextProfileResult | null {
  void tenantSlug
  const user = mockState.users.find((entry) => entry.externalUserId === input.externalUserId)
  if (!user) {
    return null
  }

  const snapshot = latestSnapshotForUser(user.id)
  if (!snapshot) {
    return null
  }

  return {
    snapshotId: snapshot.id,
    tenantSlug: mockState.tenantSlug,
    externalUserId: user.externalUserId,
    fullName: user.fullName,
    companyName: user.companyName,
    summary: snapshot.summary,
    overallConfidence: snapshot.overallConfidence,
    generatedAtUtc: snapshot.generatedAtUtc,
    isStale: snapshot.isStale || snapshot.facts.some((fact) => isFactStale(fact)),
    facts: [...snapshot.facts].sort((left, right) => left.attributeKey.localeCompare(right.attributeKey)),
  }
}

function getSalesContextPackage(
  tenantSlug: string,
  input: { externalUserId: string; tenantSlug: string; salesObjective: string },
): SalesContextPackageResult | null {
  void tenantSlug
  const user = mockState.users.find((entry) => entry.externalUserId === input.externalUserId)
  if (!user) {
    return null
  }

  const snapshot = latestSnapshotForUser(user.id)
  if (!snapshot) {
    return null
  }

  return buildSalesContextPackage(user, snapshot, input.salesObjective)
}

function upsertDataSource(input: UpsertDataSourceInput) {
  const now = isoNow()
  const existingIndex = input.id
    ? mockState.dataSources.findIndex((item) => item.id === input.id)
    : -1

  if (existingIndex >= 0) {
    const current = mockState.dataSources[existingIndex]
    const updated: DataSource = {
      ...current,
      name: input.name,
      description: input.description,
      kind: input.kind,
      connectionConfigJson: input.connectionConfigJson,
      updatedAtUtc: now,
    }
    mockState.dataSources[existingIndex] = updated
    appendAudit('data-source.updated', 'DataSource', updated.id, current, updated)
    return updated
  }

  const created: DataSource = {
    id: crypto.randomUUID(),
    tenantId: mockState.tenantId,
    name: input.name,
    description: input.description,
    kind: input.kind,
    status: 'ACTIVE',
    connectionConfigJson: input.connectionConfigJson,
    lastSuccessfulSyncAtUtc: now,
    createdAtUtc: now,
    updatedAtUtc: now,
  }
  mockState.dataSources.push(created)
  appendAudit('data-source.created', 'DataSource', created.id, null, created)
  return created
}

function upsertSemanticAttribute(input: UpsertSemanticAttributeInput) {
  const now = isoNow()
  const existingIndex = input.id
    ? mockState.semanticAttributes.findIndex((item) => item.id === input.id)
    : -1

  if (existingIndex >= 0) {
    const current = mockState.semanticAttributes[existingIndex]
    const updated: SemanticAttributeDefinition = {
      ...current,
      displayName: input.displayName,
      description: input.description,
      dataType: input.dataType,
      exampleValueJson: input.exampleValueJson,
      updatedAtUtc: now,
    }
    mockState.semanticAttributes[existingIndex] = updated
    appendAudit('semantic-attribute.updated', 'SemanticAttributeDefinition', updated.id, current, updated)
    return updated
  }

  const created: SemanticAttributeDefinition = {
    id: crypto.randomUUID(),
    tenantId: mockState.tenantId,
    key: input.key,
    displayName: input.displayName,
    description: input.description,
    dataType: input.dataType,
    exampleValueJson: input.exampleValueJson,
    isSystem: input.isSystem,
    createdAtUtc: now,
    updatedAtUtc: now,
  }
  mockState.semanticAttributes.push(created)
  appendAudit('semantic-attribute.created', 'SemanticAttributeDefinition', created.id, null, created)
  return created
}

function upsertPromptTemplate(input: UpsertPromptTemplateInput) {
  const now = isoNow()
  const existingIndex = input.id
    ? mockState.promptTemplates.findIndex((item) => item.id === input.id)
    : -1

  if (existingIndex >= 0) {
    const current = mockState.promptTemplates[existingIndex]
    const updated: PromptTemplate = {
      ...current,
      name: input.name,
      description: input.description,
      systemPrompt: input.systemPrompt,
      developerPrompt: input.developerPrompt,
      userPromptTemplate: input.userPromptTemplate,
      outputSchemaJson: input.outputSchemaJson,
      guardrailsJson: input.guardrailsJson,
      version: current.version + 1,
      updatedAtUtc: now,
    }
    mockState.promptTemplates[existingIndex] = updated
    appendAudit('prompt-template.updated', 'PromptTemplate', updated.id, current, updated)
    return updated
  }

  const created: PromptTemplate = {
    id: crypto.randomUUID(),
    tenantId: mockState.tenantId,
    name: input.name,
    description: input.description,
    systemPrompt: input.systemPrompt,
    developerPrompt: input.developerPrompt,
    userPromptTemplate: input.userPromptTemplate,
    outputSchemaJson: input.outputSchemaJson,
    guardrailsJson: input.guardrailsJson,
    version: 1,
    isActive: true,
    createdAtUtc: now,
    updatedAtUtc: now,
  }
  mockState.promptTemplates.unshift(created)
  appendAudit('prompt-template.created', 'PromptTemplate', created.id, null, created)
  return created
}

function upsertSelector(input: UpsertSelectorDefinitionInput) {
  const now = isoNow()
  const dataSource = mockState.dataSources.find((item) => item.id === input.dataSourceId)
  const targetAttribute = mockState.semanticAttributes.find(
    (item) => item.id === input.targetAttributeDefinitionId,
  )

  if (!dataSource || !targetAttribute) {
    throw new Error('Selector must reference an existing data source and semantic attribute.')
  }

  const existingIndex = input.id
    ? mockState.selectors.findIndex((item) => item.id === input.id)
    : -1

  if (existingIndex >= 0) {
    const current = mockState.selectors[existingIndex]
    const updated: SelectorDefinition = {
      ...current,
      ...input,
      id: current.id,
      status: current.status,
      version: current.version + 1,
      createdAtUtc: current.createdAtUtc,
      updatedAtUtc: now,
      dataSource,
      targetAttributeDefinition: targetAttribute,
    }
    mockState.selectors[existingIndex] = updated
    appendAudit('selector.updated', 'SelectorDefinition', updated.id, current, updated)
    return updated
  }

  const created: SelectorDefinition = {
    id: crypto.randomUUID(),
    tenantId: mockState.tenantId,
    dataSourceId: input.dataSourceId ?? null,
    targetAttributeDefinitionId: input.targetAttributeDefinitionId,
    name: input.name,
    description: input.description,
    mappingKind: input.mappingKind,
    expressionJson: input.expressionJson,
    explanationTemplate: input.explanationTemplate,
    validationSchemaJson: input.validationSchemaJson,
    status: 'DRAFT',
    version: 1,
    defaultConfidence: input.defaultConfidence,
    freshnessWindowMinutes: input.freshnessWindowMinutes,
    priority: input.priority,
    scheduleIntervalMinutes: input.scheduleIntervalMinutes ?? null,
    publishedAtUtc: null,
    createdAtUtc: now,
    updatedAtUtc: now,
    dataSource,
    targetAttributeDefinition: targetAttribute,
  }
  mockState.selectors.unshift(created)
  appendAudit('selector.created', 'SelectorDefinition', created.id, null, created)
  return created
}

function publishSelector(input: PublishSelectorDefinitionInput) {
  const selector = mockState.selectors.find((item) => item.id === input.selectorDefinitionId)
  if (!selector) {
    throw new Error('Selector not found.')
  }

  const before = structuredClone(selector)
  selector.status = 'PUBLISHED'
  selector.version += 1
  selector.publishedAtUtc = isoNow()
  selector.updatedAtUtc = selector.publishedAtUtc
  appendAudit('selector.published', 'SelectorDefinition', selector.id, before, selector)
  return selector
}

function previewSelector(input: unknown) {
  const parsed = input as { externalUserId: string; selectorDefinitionId?: string; draftSelector?: UpsertSelectorDefinitionInput }
  const user = getUserByExternalId(parsed.externalUserId)
  const selector = parsed.selectorDefinitionId
    ? mockState.selectors.find((item) => item.id === parsed.selectorDefinitionId)
    : hydrateDraftSelector(parsed.draftSelector!)

  if (!selector) {
    throw new Error('Selector preview requires a selector or draft selector.')
  }

  return executeSelector(selector, user, 'PREVIEW')
}

function validateSelector(input: unknown) {
  const parsed = input as { externalUserId?: string; draftSelector: UpsertSelectorDefinitionInput }
  const user = parsed.externalUserId ? getUserByExternalId(parsed.externalUserId) : mockState.users[0]
  const selector = hydrateDraftSelector(parsed.draftSelector)
  const result = executeSelector(selector, user, 'DRY_RUN')

  return {
    isValid: result.validationErrors.length === 0,
    validationErrors: result.validationErrors,
    rawSourceDataJson: result.rawSourceDataJson,
    normalizedSourceDataJson: result.normalizedSourceDataJson,
    pipelineTraceJson: result.pipelineTraceJson,
  } satisfies SelectorValidationResult
}

function queueContextRecompute(input: QueueContextRecomputeInput) {
  const user = getUserByExternalId(input.externalUserId)
  const publishedSelectors = mockState.selectors.filter((selector) => selector.status === 'PUBLISHED')
  const correlationId = crypto.randomUUID().replace(/-/g, '')
  const requestedAtUtc = isoNow()
  const executions = publishedSelectors.map((selector) => {
    const preview = executeSelector(selector, user, 'LIVE')
    const execution: SelectorExecution = {
      id: crypto.randomUUID(),
      tenantId: mockState.tenantId,
      selectorDefinitionId: selector.id,
      userProfileId: user.id,
      correlationId,
      triggeredBy: input.triggeredBy,
      executionMode: 'LIVE',
      status: preview.isSuccess ? 'SUCCEEDED' : 'FAILED',
      rawSourceDataJson: preview.rawSourceDataJson,
      validationErrorsJson: prettyJson(preview.validationErrors),
      pipelineTraceJson: preview.pipelineTraceJson,
      resultValueJson: preview.valueJson ?? 'null',
      resultValueType: preview.valueType ?? 'JSON',
      resultConfidence: preview.confidence ?? 0,
      resultObservedAtUtc: preview.observedAtUtc ?? null,
      resultExplanation: preview.explanation ?? '',
      resultProvenanceJson: preview.provenanceJson ?? '[]',
      requestedAtUtc,
      startedAtUtc: requestedAtUtc,
      completedAtUtc: isoNow(),
      errorMessage: preview.isSuccess ? null : preview.validationErrors.join('; '),
      selectorDefinition: selector,
      userProfile: user,
    }
    return execution
  })

  mockState.selectorExecutions.unshift(...executions)
  recomputeSnapshot(user.id, executions)
  appendAudit(
    'context.recompute.queued',
    'UserProfile',
    user.id,
    null,
    { externalUserId: user.externalUserId, executionCount: executions.length, correlationId },
  )

  return {
    correlationId,
    tenantId: mockState.tenantId,
    userProfileId: user.id,
    executionCount: executions.length,
  } satisfies QueueRecomputeResult
}

function runScheduledRecompute(input?: RunScheduledRecomputeInput) {
  void input
  let queued = 0
  let skipped = 0

  for (const user of mockState.users) {
    const snapshot = latestSnapshotForUser(user.id)
    if (!snapshot || snapshot.facts.some((fact) => isFactStale(fact))) {
      queueContextRecompute({
        tenantSlug: mockState.tenantSlug,
        externalUserId: user.externalUserId,
        triggeredBy: 'scheduler',
      })
      queued += 1
    } else {
      skipped += 1
    }
  }

  return {
    queuedUserCount: queued,
    skippedUserCount: skipped,
  } satisfies ScheduledRecomputeDispatchResult
}

function createAgentRun(input: CreateAgentRunInput) {
  const user = getUserByExternalId(input.externalUserId)
  const snapshot = latestSnapshotForUser(user.id)
  const promptTemplate = mockState.promptTemplates.find((item) => item.id === input.promptTemplateId)

  if (!snapshot || !promptTemplate) {
    throw new Error('Prompt template or context snapshot not found.')
  }

  const contextPackage = buildSalesContextPackage(user, snapshot, input.salesObjective)
  const output = buildSalesSupportResponse(contextPackage)
  const providerName = input.providerName?.trim() || 'mock'
  const validationErrors: string[] = []

  const now = isoNow()
  const run: AgentRun = {
    id: crypto.randomUUID(),
    tenantId: mockState.tenantId,
    userProfileId: user.id,
    promptTemplateId: promptTemplate.id,
    contextSnapshotId: snapshot.id,
    providerName,
    modelName: input.modelName,
    salesObjective: input.salesObjective,
    attemptCount: 1,
    status: 'COMPLETED',
    confidence: snapshot.overallConfidence,
    inputJson: prettyJson({
      providerName,
      modelName: input.modelName,
      salesObjective: input.salesObjective,
      promptTemplate: {
        id: promptTemplate.id,
        name: promptTemplate.name,
        systemPrompt: promptTemplate.systemPrompt,
        developerPrompt: promptTemplate.developerPrompt,
        userPromptTemplate: promptTemplate.userPromptTemplate,
        outputSchemaJson: promptTemplate.outputSchemaJson,
        guardrailsJson: promptTemplate.guardrailsJson,
      },
      contextPackage: safeJsonParse(contextPackage.contextPackageJson, {}),
    }),
    outputJson: prettyJson(output),
    provenanceJson: prettyJson(
      contextPackage.facts.map((fact) => ({
        citationId: fact.citationId,
        factId: fact.factId,
        attributeKey: fact.attributeKey,
        displayName: fact.displayName,
        valueJson: fact.valueJson,
        confidence: fact.confidence,
        observedAtUtc: fact.observedAtUtc,
        freshUntilUtc: fact.freshUntilUtc,
        isFresh: fact.isFresh,
        isLowConfidence: fact.isLowConfidence,
        explanation: fact.explanation,
        provenance: safeJsonParse(fact.provenanceJson, []),
      })),
    ),
    requestedAtUtc: now,
    completedAtUtc: now,
    failureReason: null,
  }

  mockState.agentRuns.unshift(run)
  appendAudit('agent-run.completed', 'AgentRun', run.id, null, run)

  return {
    agentRunId: run.id,
    status: run.status,
    providerName,
    modelName: input.modelName,
    salesObjective: input.salesObjective,
    confidence: run.confidence,
    attemptCount: 1,
    humanReviewRecommended: output.humanReviewRecommended,
    contextPackageJson: contextPackage.contextPackageJson,
    outputJson: run.outputJson,
    provenanceJson: run.provenanceJson,
    validationErrorsJson: prettyJson(validationErrors),
    failureReason: null,
  } satisfies AgentRunResult
}

function executeSelector(
  selector: SelectorDefinition,
  user: UserProfile,
  mode: SelectorExecutionMode,
): SelectorExecutionPreviewResult {
  const dataSource = mockState.dataSources.find((item) => item.id === selector.dataSourceId)
  const attribute = mockState.semanticAttributes.find(
    (item) => item.id === selector.targetAttributeDefinitionId,
  )

  if (!dataSource || !attribute) {
    throw new Error(`Selector ${selector.name} is missing data source or target attribute.`)
  }

  const expression = safeJsonParse<Record<string, unknown>>(selector.expressionJson, {})
  const validation = safeJsonParse<{ requiredPaths?: string[] }>(
    selector.validationSchemaJson,
    {},
  )
  const rawSource = buildSourcePayload(user.id, dataSource.id, dataSource.connectionConfigJson)
  const normalized = structuredClone(rawSource)
  const trace: unknown[] = [{ stage: 'fetch', connectorType: extractConnectorType(dataSource.connectionConfigJson), rawSource }]

  for (const transform of safeJsonParse<Array<{ path: string; type: string }>>(
    prettyJson(expression.transforms ?? []),
    [],
  )) {
    const current = getPathValue(normalized, transform.path)
    if (current === undefined) {
      continue
    }

    const transformed = applyTransform(current, transform.type)
    setPathValue(normalized, transform.path, transformed)
    trace.push({ stage: 'transform', path: transform.path, type: transform.type, before: current, after: transformed })
  }

  const validationErrors = (validation.requiredPaths ?? [])
    .filter((path) => getPathValue(normalized, path) === undefined)
    .map((path) => `Required path '${path}' was not found in the source payload.`)
  trace.push({ stage: 'validate', validationErrors })

  if (validationErrors.length > 0) {
    return {
      mode,
      isSuccess: false,
      selectorName: selector.name,
      rawSourceDataJson: prettyJson(rawSource),
      normalizedSourceDataJson: prettyJson(normalized),
      validationErrors,
      valueJson: null,
      valueType: null,
      confidence: null,
      observedAtUtc: null,
      freshUntilUtc: null,
      explanation: null,
      provenanceJson: null,
      pipelineTraceJson: prettyJson(trace),
    }
  }

  const observedAtUtc = latestObservedAtForSelector(user.id, dataSource.id)
  const evaluation = evaluateRule(selector, attribute, normalized)
  const freshUntilUtc = new Date(
    new Date(observedAtUtc).getTime() + selector.freshnessWindowMinutes * 60000,
  ).toISOString()

  const fact: ContextFactResult = {
    id: crypto.randomUUID(),
    attributeKey: attribute.key,
    valueJson: prettyJson(evaluation.value).trim(),
    valueType: inferValueType(attribute.dataType, evaluation.value),
    confidence: Number(selector.defaultConfidence.toFixed(2)),
    observedAtUtc,
    freshUntilUtc,
    sourceSelectorDefinitionId: selector.id,
    explanation: interpolateTemplate(selector.explanationTemplate, {
      ...flattenRecord(normalized),
      ...evaluation.tokens,
    }),
    provenanceJson: prettyJson([
      {
        dataSourceId: dataSource.id,
        dataSourceName: dataSource.name,
        selectorId: selector.id,
        selectorName: selector.name,
        ruleType: mappingKindLabels[selector.mappingKind],
        observedAtUtc,
        sourcePaths: evaluation.sourcePaths,
      },
    ]),
  }

  trace.push({
    stage: 'map',
    mappingKind: selector.mappingKind,
    attributeKey: attribute.key,
    result: fact,
  })

  return {
    mode,
    isSuccess: true,
    selectorName: selector.name,
    rawSourceDataJson: prettyJson(rawSource),
    normalizedSourceDataJson: prettyJson(normalized),
    validationErrors: [],
    valueJson: fact.valueJson,
    valueType: fact.valueType,
    confidence: fact.confidence,
    observedAtUtc: fact.observedAtUtc,
    freshUntilUtc: fact.freshUntilUtc,
    explanation: fact.explanation,
    provenanceJson: fact.provenanceJson,
    pipelineTraceJson: prettyJson(trace),
  }
}

function evaluateRule(
  selector: SelectorDefinition,
  attribute: SemanticAttributeDefinition,
  normalized: Record<string, unknown>,
) {
  const expression = safeJsonParse<Record<string, unknown>>(selector.expressionJson, {})
  const rule = (expression.rule ?? {}) as MockSelectorRule
  const mappedPath = rule.valuePath ?? ''

  switch (selector.mappingKind) {
    case 'DIRECT_FIELD_MAPPING': {
      const value = getPathValue(normalized, mappedPath)
      return {
        value,
        sourcePaths: mappedPath ? [mappedPath] : [],
        tokens: { sourceValue: value },
      }
    }
    case 'STRING_TO_ENUM_MAPPING': {
      const sourceValue = getPathValue(normalized, mappedPath)
      const mappedValue = rule.map?.[String(sourceValue)] ?? sourceValue
      return {
        value: mappedValue,
        sourcePaths: mappedPath ? [mappedPath] : [],
        tokens: { sourceValue, mappedValue },
      }
    }
    case 'THRESHOLD_CLASSIFICATION': {
      const sourceValue = Number(getPathValue(normalized, mappedPath) ?? 0)
      const threshold = (rule.thresholds ?? []).find((entry) => {
        const meetsMin = entry.min === undefined || sourceValue >= entry.min
        const meetsMax = entry.max === undefined || sourceValue < entry.max
        return meetsMin && meetsMax
      })
      const classifiedValue = threshold?.label ?? 'unknown'
      return {
        value: classifiedValue,
        sourcePaths: mappedPath ? [mappedPath] : [],
        tokens: { sourceValue, classifiedValue },
      }
    }
    case 'WEIGHTED_SCORING': {
      let total = 0
      const sourcePaths: string[] = []

      for (const component of rule.components ?? []) {
        const sourcePath = component.sourcePath ?? ''
        const current = getPathValue(normalized, sourcePath)
        sourcePaths.push(sourcePath)
        let componentValue = 0

        if (component.map) {
          componentValue = Number(component.map[String(current)] ?? component.defaultValue ?? 0)
        } else if (component.expected !== undefined) {
          componentValue =
            String(current) === String(component.expected)
              ? Number(component.trueValue ?? 0)
              : Number(component.falseValue ?? 0)
        } else if (component.threshold !== undefined) {
          componentValue =
            Number(current ?? 0) >= Number(component.threshold)
              ? Number(component.trueValue ?? 0)
              : Number(component.falseValue ?? 0)
        }

        total += componentValue * Number(component.weight ?? 1)
      }

      const min = Number(rule.minimum ?? 0)
      const max = Number(rule.maximum ?? 100)
      const weightedScore = Math.max(min, Math.min(max, total))
      return {
        value: weightedScore,
        sourcePaths,
        tokens: { weightedScore },
      }
    }
    case 'FORMULA_METRIC': {
      const sourcePaths: string[] = []
      const variableValues: Record<string, number> = {}

      for (const variable of rule.variables ?? []) {
        const sourcePath = variable.sourcePath ?? ''
        const variableName = variable.name ?? ''
        sourcePaths.push(sourcePath)
        const sourceValue = Number(getPathValue(normalized, sourcePath) ?? 0)

        if (variable.multiplier !== undefined) {
          variableValues[variableName] = sourceValue * Number(variable.multiplier)
          continue
        }

        if (variable.threshold !== undefined) {
          variableValues[variableName] =
            sourceValue >= Number(variable.threshold)
              ? Number(variable.trueValue ?? 0)
              : Number(variable.falseValue ?? 0)
          continue
        }

        variableValues[variableName] = sourceValue
      }

      const expressionSource = String(rule.expression ?? '0')
      const formulaValue = evaluateFormulaExpression(expressionSource, variableValues)
      return {
        value: attribute.dataType === 'PERCENTAGE' ? Math.max(0, Math.min(100, formulaValue)) : formulaValue,
        sourcePaths,
        tokens: { formulaValue, ...variableValues },
      }
    }
    default:
      return { value: null, sourcePaths: [], tokens: {} }
  }
}

function recomputeSnapshot(userProfileId: string, executions: SelectorExecution[]) {
  const successfulExecutions = executions.filter((execution) => execution.status === 'SUCCEEDED')
  const winners = new Map<string, ContextFactResult>()

  for (const execution of successfulExecutions) {
    const selector = mockState.selectors.find((item) => item.id === execution.selectorDefinitionId)
    const attribute = selector?.targetAttributeDefinition
      ?? mockState.semanticAttributes.find((item) => item.id === selector?.targetAttributeDefinitionId)

    if (!selector || !attribute) {
      continue
    }

    const candidate: ContextFactResult = {
      id: crypto.randomUUID(),
      attributeKey: attribute.key,
      valueJson: execution.resultValueJson,
      valueType: execution.resultValueType,
      confidence: execution.resultConfidence,
      observedAtUtc: execution.resultObservedAtUtc ?? execution.requestedAtUtc,
      freshUntilUtc: new Date(
        new Date(execution.resultObservedAtUtc ?? execution.requestedAtUtc).getTime() +
          selector.freshnessWindowMinutes * 60000,
      ).toISOString(),
      sourceSelectorDefinitionId: selector.id,
      explanation: execution.resultExplanation,
      provenanceJson: execution.resultProvenanceJson,
    }

    const current = winners.get(attribute.key)
    if (!current) {
      winners.set(attribute.key, candidate)
      continue
    }

    const currentSelector = mockState.selectors.find((item) => item.id === current.sourceSelectorDefinitionId)
    const currentPriority = currentSelector?.priority ?? 0
    const nextPriority = selector.priority

    const shouldReplace =
      nextPriority > currentPriority ||
      (nextPriority === currentPriority && candidate.confidence > current.confidence) ||
      (nextPriority === currentPriority &&
        candidate.confidence === current.confidence &&
        candidate.observedAtUtc > current.observedAtUtc)

    if (shouldReplace) {
      winners.set(attribute.key, candidate)
    }
  }

  const facts = [...winners.values()]
  const user = mockState.users.find((entry) => entry.id === userProfileId)
  if (!user) {
    return
  }

  const summary = [
    percentageSummary(facts, 'conversionProbability', 'conversion probability'),
    verbSummary(facts, 'preferredChannel', 'prefers'),
    verbSummary(facts, 'planInterest', 'interested in'),
    percentageSummary(facts, 'churnRisk', 'churn risk'),
    valueSummary(facts, 'engagementLevel', 'recent engagement'),
  ]
    .filter(Boolean)
    .join(', ')

  const snapshot: ContextSnapshotRecord = {
    id: crypto.randomUUID(),
    tenantId: mockState.tenantId,
    userProfileId,
    generatedAtUtc: isoNow(),
    summary,
    overallConfidence:
      facts.length > 0
        ? Number((facts.reduce((sum, fact) => sum + fact.confidence, 0) / facts.length).toFixed(2))
        : 0,
    isStale: facts.some((fact) => isFactStale(fact)),
    facts,
  }

  mockState.snapshots.unshift(snapshot)
  appendAudit('context.snapshot.materialized', 'ContextSnapshot', snapshot.id, null, {
    user: user.externalUserId,
    factCount: facts.length,
  })
}

function latestSnapshotForUser(userProfileId: string) {
  return mockState.snapshots
    .filter((snapshot) => snapshot.userProfileId === userProfileId)
    .sort((left, right) => right.generatedAtUtc.localeCompare(left.generatedAtUtc))[0]
}

function latestObservedAtForSelector(userProfileId: string, dataSourceId: string) {
  const signal = [...mockState.signals]
    .filter((entry) => entry.userProfileId === userProfileId && entry.dataSourceId === dataSourceId)
    .sort((left, right) => right.observedAtUtc.localeCompare(left.observedAtUtc))[0]

  return signal?.observedAtUtc ?? isoNow()
}

function hydrateDraftSelector(input: UpsertSelectorDefinitionInput): SelectorDefinition {
  const dataSource = mockState.dataSources.find((item) => item.id === input.dataSourceId) ?? null
  const attribute =
    mockState.semanticAttributes.find((item) => item.id === input.targetAttributeDefinitionId) ?? null

  return {
    id: input.id ?? crypto.randomUUID(),
    tenantId: mockState.tenantId,
    dataSourceId: input.dataSourceId ?? null,
    targetAttributeDefinitionId: input.targetAttributeDefinitionId,
    name: input.name,
    description: input.description,
    mappingKind: input.mappingKind,
    expressionJson: input.expressionJson,
    explanationTemplate: input.explanationTemplate,
    validationSchemaJson: input.validationSchemaJson,
    status: 'DRAFT',
    version: 1,
    defaultConfidence: input.defaultConfidence,
    freshnessWindowMinutes: input.freshnessWindowMinutes,
    priority: input.priority,
    scheduleIntervalMinutes: input.scheduleIntervalMinutes ?? null,
    publishedAtUtc: null,
    createdAtUtc: isoNow(),
    updatedAtUtc: isoNow(),
    dataSource,
    targetAttributeDefinition: attribute,
  }
}

function buildSalesContextPackage(
  user: UserProfile,
  snapshot: ContextSnapshotRecord,
  salesObjective: string,
): SalesContextPackageResult {
  const facts: GroundedContextFactResult[] = [...snapshot.facts]
    .sort((left, right) => left.attributeKey.localeCompare(right.attributeKey))
    .map((fact, index) => ({
      citationId: `FACT-${String(index + 1).padStart(2, '0')}`,
      factId: fact.id,
      attributeKey: fact.attributeKey,
      displayName: semanticDisplayName(fact.attributeKey),
      valueJson: fact.valueJson,
      valueType: fact.valueType,
      confidence: fact.confidence,
      observedAtUtc: fact.observedAtUtc,
      freshUntilUtc: fact.freshUntilUtc ?? null,
      isFresh: !isFactStale(fact),
      isLowConfidence: fact.confidence < 0.75,
      explanation: fact.explanation,
      provenanceJson: fact.provenanceJson,
    }))

  const missingInformation = requiredSalesAttributeKeys.filter(
    (attributeKey) => facts.every((fact) => fact.attributeKey !== attributeKey),
  ).map((attributeKey) => `No grounded fact is currently available for '${attributeKey}'.`)

  const weakSignalMessages = [
    ...(snapshot.isStale ? ['The latest context snapshot is marked stale and should be treated as provisional.'] : []),
    ...facts.flatMap((fact) => {
      const messages: string[] = []
      if (!fact.isFresh) {
        messages.push(`${fact.displayName} is stale and should be revalidated before acting.`)
      }
      if (fact.isLowConfidence) {
        messages.push(`${fact.displayName} is low confidence at ${Math.round(fact.confidence * 100)}%.`)
      }
      return messages
    }),
  ]

  const humanReviewRecommended =
    weakSignalMessages.length > 0 ||
    missingInformation.length > 0 ||
    facts.filter((fact) => fact.isFresh && !fact.isLowConfidence).length < 3

  const contextPackage = {
    packageVersion: '2026-05-09',
    salesObjective,
    subject: {
      externalUserId: user.externalUserId,
      fullName: user.fullName,
      companyName: user.companyName,
      jobTitle: user.jobTitle,
      segment: user.segment,
    },
    snapshot: {
      snapshotId: snapshot.id,
      summary: snapshot.summary,
      overallConfidence: snapshot.overallConfidence,
      generatedAtUtc: snapshot.generatedAtUtc,
      isStale: snapshot.isStale,
    },
    humanReviewRecommended,
    missingInformation,
    weakSignalMessages,
    facts: facts.map((fact) => ({
      citationId: fact.citationId,
      factId: fact.factId,
      attributeKey: fact.attributeKey,
      displayName: fact.displayName,
      value: safeJsonParse(fact.valueJson, fact.valueJson),
      valueJson: fact.valueJson,
      valueType: fact.valueType,
      confidence: fact.confidence,
      observedAtUtc: fact.observedAtUtc,
      freshUntilUtc: fact.freshUntilUtc,
      isFresh: fact.isFresh,
      isLowConfidence: fact.isLowConfidence,
      explanation: fact.explanation,
      provenance: safeJsonParse(fact.provenanceJson, []),
    })),
  }

  return {
    snapshotId: snapshot.id,
    tenantSlug: mockState.tenantSlug,
    externalUserId: user.externalUserId,
    fullName: user.fullName,
    companyName: user.companyName,
    jobTitle: user.jobTitle,
    segment: user.segment,
    salesObjective,
    summary: snapshot.summary,
    overallConfidence: snapshot.overallConfidence,
    generatedAtUtc: snapshot.generatedAtUtc,
    isStale: snapshot.isStale || facts.some((fact) => !fact.isFresh),
    humanReviewRecommended,
    missingInformation,
    weakSignalMessages,
    facts,
    contextPackageJson: prettyJson(contextPackage),
  }
}

function buildSalesSupportResponse(contextPackage: SalesContextPackageResult): SalesSupportResponse {
  const preferredChannel = String(packageFactValue(contextPackage, 'preferredChannel', 'email'))
  const planInterest = String(packageFactValue(contextPackage, 'planInterest', 'enterprise'))
  const engagementLevel = String(packageFactValue(contextPackage, 'engagementLevel', 'medium'))
  const conversionProbability = Number(packageFactValue(contextPackage, 'conversionProbability', 0))
  const churnRisk = Number(packageFactValue(contextPackage, 'churnRisk', 0))
  const conversionCitation = packageCitation(contextPackage, 'conversionProbability')
  const channelCitation = packageCitation(contextPackage, 'preferredChannel')
  const planCitation = packageCitation(contextPackage, 'planInterest')
  const engagementCitation = packageCitation(contextPackage, 'engagementLevel')
  const churnCitation = packageCitation(contextPackage, 'churnRisk')
  const humanReviewReason = contextPackage.humanReviewRecommended
    ? contextPackage.weakSignalMessages[0] ??
      contextPackage.missingInformation[0] ??
      'Available signals are not strong enough to automate without review.'
    : ''

  return {
    salesObjective: contextPackage.salesObjective,
    outreachStrategy: {
      summary: `${contextPackage.fullName} should receive a ${preferredChannel} first-touch anchored on ${planInterest} intent and current product momentum.`,
      recommendedChannel: preferredChannel,
      timingRecommendation:
        engagementLevel === 'high'
          ? 'Reach out within 24 hours while the engagement signal is still fresh.'
          : 'Reach out within the next three business days and verify intent before escalating.',
      keyTalkingPoints: [
        {
          text: `Lead with the ${conversionProbability}% conversion signal and the current ${planInterest} plan interest.`,
          citations: [conversionCitation, planCitation].filter(Boolean) as string[],
          confidence: contextPackage.overallConfidence,
        },
        {
          text: `Use ${preferredChannel} as the primary channel because it is the strongest recorded preference.`,
          citations: channelCitation ? [channelCitation] : [],
          confidence: contextPackage.overallConfidence,
        },
        {
          text: `Reference the ${engagementLevel} engagement pattern so the outreach feels grounded in real usage rather than generic expansion messaging.`,
          citations: engagementCitation ? [engagementCitation] : [],
          confidence: contextPackage.overallConfidence,
        },
      ],
      risks: [
        {
          text: `Keep the conversation anchored in customer value because churn risk is currently ${churnRisk}%.`,
          citations: churnCitation ? [churnCitation] : [],
          confidence: Math.max(0.55, contextPackage.overallConfidence - 0.05),
        },
      ],
      confidence: contextPackage.overallConfidence,
      humanReviewRecommended: contextPackage.humanReviewRecommended,
      humanReviewReason,
    },
    personalizedEmailDraft: {
      subjectLine: `${contextPackage.companyName}: next step for ${planInterest} planning`,
      previewText: `Grounded outreach built from fresh context for ${contextPackage.fullName}.`,
      body:
        `Hi ${contextPackage.fullName},\n\n` +
        `I’m reaching out because your current context suggests strong momentum toward ${planInterest} planning, and the recent engagement pattern from ${contextPackage.companyName} looks like a good fit for a focused working session.\n\n` +
        `If helping your team move toward ${contextPackage.salesObjective.toLowerCase()} is still a priority, I’d suggest a short conversation to align on the next milestone and what success should look like operationally.\n\n` +
        'Would a 20-minute working session next week be useful?\n\nBest,\nContext Layer Sales',
      callToAction: 'Propose a 20-minute working session next week.',
      supportingClaims: [
        {
          text: `The profile currently shows ${planInterest} interest and ${engagementLevel} recent engagement.`,
          citations: [planCitation, engagementCitation].filter(Boolean) as string[],
          confidence: contextPackage.overallConfidence,
        },
        {
          text: `${preferredChannel} should be the first touch because it is the explicit preferred channel on record.`,
          citations: channelCitation ? [channelCitation] : [],
          confidence: contextPackage.overallConfidence,
        },
      ],
      confidence: contextPackage.overallConfidence,
      humanReviewRecommended: contextPackage.humanReviewRecommended,
      humanReviewReason,
    },
    followUpRecommendations: {
      recommendations: [
        {
          action: 'Send the first outreach touch.',
          timing: preferredChannel === 'email' ? 'Within 24 hours.' : 'Within the next business day.',
          rationale: `The preferred channel is ${preferredChannel} and the latest engagement signal is ${engagementLevel}.`,
          citations: [channelCitation, engagementCitation].filter(Boolean) as string[],
          confidence: contextPackage.overallConfidence,
        },
        {
          action: 'If there is no reply, follow up with a commercial proof point.',
          timing: 'Three business days after the first outreach.',
          rationale: `Use the ${conversionProbability}% conversion signal and ${planInterest} interest to keep the sequence grounded in value.`,
          citations: [conversionCitation, planCitation].filter(Boolean) as string[],
          confidence: Math.max(0.55, contextPackage.overallConfidence - 0.03),
        },
        {
          action: 'Request account-owner review before any executive escalation if the context still feels weak.',
          timing: 'Before escalating the sequence.',
          rationale:
            humanReviewReason || `Churn risk is currently ${churnRisk}% and should stay visible as outreach progresses.`,
          citations: churnCitation ? [churnCitation] : [],
          confidence: Math.max(0.55, contextPackage.overallConfidence - 0.08),
        },
      ],
      lowConfidenceSignals: contextPackage.weakSignalMessages,
      missingInformation: contextPackage.missingInformation,
      confidence: contextPackage.overallConfidence,
      humanReviewRecommended: contextPackage.humanReviewRecommended,
      humanReviewReason,
    },
    missingInformation: contextPackage.missingInformation,
    humanReviewRecommended: contextPackage.humanReviewRecommended,
    humanReviewReason,
    overallConfidence: contextPackage.overallConfidence,
  }
}

const requiredSalesAttributeKeys = [
  'conversionProbability',
  'preferredChannel',
  'planInterest',
  'churnRisk',
  'engagementLevel',
] as const

function semanticDisplayName(attributeKey: string) {
  return (
    mockState.semanticAttributes.find((attribute) => attribute.key === attributeKey)?.displayName ??
    attributeKey
  )
}

function factValue(facts: ContextFactResult[], key: string) {
  const fact = facts.find((entry) => entry.attributeKey === key)
  if (!fact) {
    return null
  }

  return safeJsonParse<string | number | boolean | null>(fact.valueJson, fact.valueJson)
}

function packageFactValue(
  contextPackage: SalesContextPackageResult,
  key: string,
  fallback: string | number,
) {
  const fact = contextPackage.facts.find((entry) => entry.attributeKey === key)
  if (!fact) {
    return fallback
  }

  return safeJsonParse<string | number | boolean>(fact.valueJson, fallback)
}

function packageCitation(contextPackage: SalesContextPackageResult, key: string) {
  return contextPackage.facts.find((entry) => entry.attributeKey === key)?.citationId ?? null
}

function percentageSummary(facts: ContextFactResult[], key: string, label: string) {
  const raw = factValue(facts, key)
  return raw === null ? null : `${raw}% ${label}`
}

function verbSummary(facts: ContextFactResult[], key: string, verb: string) {
  const raw = factValue(facts, key)
  return raw === null ? null : `${verb} ${raw}`
}

function valueSummary(facts: ContextFactResult[], key: string, label: string) {
  const raw = factValue(facts, key)
  return raw === null ? null : `${label} ${raw}`
}

function inferValueType(dataType: SemanticAttributeDefinition['dataType'], value: unknown): ContextFactResult['valueType'] {
  switch (dataType) {
    case 'PERCENTAGE':
    case 'NUMBER':
      return 'NUMBER'
    case 'BOOLEAN':
      return 'BOOLEAN'
    case 'DATETIME':
      return 'DATETIME'
    case 'ENUM':
      return 'ENUM'
    default:
      if (typeof value === 'string') {
        return 'STRING'
      }
      if (typeof value === 'number') {
        return 'NUMBER'
      }
      if (typeof value === 'boolean') {
        return 'BOOLEAN'
      }
      return 'JSON'
  }
}

function extractConnectorType(configJson: string) {
  return safeJsonParse<{ connectorType?: string }>(configJson, {}).connectorType ?? 'mockSignal'
}

function buildSourcePayload(userProfileId: string, dataSourceId: string, configJson: string) {
  const config = safeJsonParse<Record<string, unknown>>(configJson, {})
  const connectorType = String(config.connectorType ?? 'mockSignal')

  if (connectorType === 'mockSignal') {
    const payload: Record<string, unknown> = {}
    for (const signal of mockState.signals.filter(
      (entry) => entry.userProfileId === userProfileId && entry.dataSourceId === dataSourceId,
    )) {
      setPathValue(payload, signal.key, signal.value)
    }
    return payload
  }

  if (connectorType === 'mockPayload') {
    const records = safeJsonParse<Array<Record<string, unknown>>>(
      prettyJson(config.records ?? []),
      [],
    )
    const match = records.find((entry) => entry.externalUserId === getUserById(userProfileId).externalUserId)
    return (match?.payload as Record<string, unknown> | undefined) ?? {}
  }

  if (connectorType === 'apiPayload') {
    return safeJsonParse<Record<string, unknown>>(prettyJson(config.payload ?? {}), {})
  }

  if (connectorType === 'sqlTable') {
    const rows = safeJsonParse<Array<Record<string, unknown>>>(prettyJson(config.rows ?? []), [])
    const user = getUserById(userProfileId)
    const row = rows.find((entry) => entry.external_user_id === user.externalUserId)
    if (!row) {
      return {}
    }

    const payload: Record<string, unknown> = {}
    const columns = (config.columns as string[] | undefined) ?? []
    for (const column of columns) {
      payload[column] = row[column]
    }
    return payload
  }

  return {}
}

function applyTransform(value: unknown, type: string) {
  if (type === 'lower' && typeof value === 'string') {
    return value.toLowerCase()
  }
  if (type === 'upper' && typeof value === 'string') {
    return value.toUpperCase()
  }
  if (type === 'trim' && typeof value === 'string') {
    return value.trim()
  }
  if (type === 'number') {
    return Number(value)
  }
  if (type === 'string') {
    return String(value)
  }
  return value
}

function interpolateTemplate(template: string, tokens: Record<string, unknown>) {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, token) => {
    const normalizedToken = token.trim()
    const value = tokens[normalizedToken]
    if (value === undefined || value === null) {
      return 'unknown'
    }
    return String(value)
  })
}

function flattenRecord(input: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const output: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    const combined = `${prefix}${key}`
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(output, flattenRecord(value as Record<string, unknown>, combined))
    } else {
      output[combined] = value
    }
  }
  return output
}

function getPathValue(source: unknown, path: string) {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined
    }
    return (current as Record<string, unknown>)[segment]
  }, source)
}

function setPathValue(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.')
  let cursor: Record<string, unknown> = target
  parts.forEach((segment, index) => {
    if (index === parts.length - 1) {
      cursor[segment] = value
      return
    }

    if (!cursor[segment] || typeof cursor[segment] !== 'object') {
      cursor[segment] = {}
    }
    cursor = cursor[segment] as Record<string, unknown>
  })
}

function evaluateFormulaExpression(expression: string, variables: Record<string, number>) {
  const source = Object.entries(variables).reduce(
    (current, [key, value]) =>
      current.replaceAll(new RegExp(`\\b${escapeRegExp(key)}\\b`, 'g'), value.toString()),
    expression,
  )
  const calculated = Function(`"use strict"; return (${source});`)()
  return Number(calculated)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isFactStale(fact: ContextFactResult) {
  return fact.freshUntilUtc ? new Date(fact.freshUntilUtc).getTime() < Date.now() : false
}

function appendAudit(
  action: string,
  entityType: string,
  entityId: string,
  before: unknown,
  after: unknown,
) {
  mockState.auditEvents.unshift({
    id: crypto.randomUUID(),
    tenantId: mockState.tenantId,
    actor: 'demo-admin@contextlayer.local',
    action,
    entityType,
    entityId,
    correlationId: crypto.randomUUID().replace(/-/g, ''),
    metadataJson: prettyJson({ source: 'mock-api' }),
    beforeJson: before ? prettyJson(before) : null,
    afterJson: after ? prettyJson(after) : null,
    createdAtUtc: isoNow(),
  })
}

function getUserByExternalId(externalUserId: string) {
  const user = mockState.users.find((entry) => entry.externalUserId === externalUserId)
  if (!user) {
    throw new Error(`User '${externalUserId}' was not found in demo mode.`)
  }
  return user
}

function getUserById(userId: string) {
  const user = mockState.users.find((entry) => entry.id === userId)
  if (!user) {
    throw new Error(`User '${userId}' was not found in demo mode.`)
  }
  return user
}

function seedInitialSnapshots(state: MockState) {
  for (const user of state.users) {
    const executions = state.selectors
      .filter((selector) => selector.status === 'PUBLISHED')
      .map((selector) => {
        const preview = executeSelector(selector, user, 'LIVE')
        return {
          id: crypto.randomUUID(),
          tenantId: state.tenantId,
          selectorDefinitionId: selector.id,
          userProfileId: user.id,
          correlationId: crypto.randomUUID().replace(/-/g, ''),
          triggeredBy: 'seed',
          executionMode: 'LIVE',
          status: preview.isSuccess ? 'SUCCEEDED' : 'FAILED',
          rawSourceDataJson: preview.rawSourceDataJson,
          validationErrorsJson: prettyJson(preview.validationErrors),
          pipelineTraceJson: preview.pipelineTraceJson,
          resultValueJson: preview.valueJson ?? 'null',
          resultValueType: preview.valueType ?? 'JSON',
          resultConfidence: preview.confidence ?? 0,
          resultObservedAtUtc: preview.observedAtUtc ?? isoNow(),
          resultExplanation: preview.explanation ?? '',
          resultProvenanceJson: preview.provenanceJson ?? '[]',
          requestedAtUtc: isoNow(),
          startedAtUtc: isoNow(),
          completedAtUtc: isoNow(),
          errorMessage: null,
          selectorDefinition: selector,
          userProfile: user,
        } satisfies SelectorExecution
      })
    state.selectorExecutions.unshift(...executions)
    recomputeSnapshot(user.id, executions)
  }
}

function createSeedState(): MockState {
  const tenantId = crypto.randomUUID()
  const now = Date.now()
  const at = (deltaHours: number) => new Date(now - deltaHours * 3600_000).toISOString()

  const dataSources: DataSource[] = [
    {
      id: crypto.randomUUID(),
      tenantId,
      name: 'CRM Signals API',
      description: 'CRM-style contact and deal properties served through a generic API contract.',
      kind: 'CRM',
      status: 'ACTIVE',
      connectionConfigJson: prettyJson({ connectorType: 'mockSignal', provider: 'crmApi', mode: 'demo' }),
      lastSuccessfulSyncAtUtc: at(1),
      createdAtUtc: at(96),
      updatedAtUtc: at(1),
    },
    {
      id: crypto.randomUUID(),
      tenantId,
      name: 'Product Usage Stream',
      description: 'Signal stream aggregated from product activity.',
      kind: 'PRODUCT_USAGE',
      status: 'ACTIVE',
      connectionConfigJson: prettyJson({ connectorType: 'mockSignal', provider: 'telemetryStream', mode: 'demo' }),
      lastSuccessfulSyncAtUtc: at(1),
      createdAtUtc: at(96),
      updatedAtUtc: at(1),
    },
    {
      id: crypto.randomUUID(),
      tenantId,
      name: 'Warehouse KPIs',
      description: 'Warehouse model with demand, support, and health metrics.',
      kind: 'SQL_METRIC',
      status: 'ACTIVE',
      connectionConfigJson: prettyJson({ connectorType: 'mockSignal', provider: 'warehouseSql', mode: 'demo' }),
      lastSuccessfulSyncAtUtc: at(1),
      createdAtUtc: at(96),
      updatedAtUtc: at(1),
    },
  ]

  const semanticAttributes: SemanticAttributeDefinition[] = [
    createAttribute(tenantId, 'conversionProbability', 'Conversion Probability', 'PERCENTAGE', '85', true, at),
    createAttribute(tenantId, 'preferredChannel', 'Preferred Channel', 'ENUM', '"email"', true, at),
    createAttribute(tenantId, 'planInterest', 'Plan Interest', 'ENUM', '"enterprise"', true, at),
    createAttribute(tenantId, 'churnRisk', 'Churn Risk', 'PERCENTAGE', '12', true, at),
    createAttribute(tenantId, 'engagementLevel', 'Engagement Level', 'ENUM', '"high"', true, at),
  ]

  const users: UserProfile[] = [
    createUser(tenantId, '123', 'Avery Stone', 'avery.stone@larkspur-logistics.example', 'Larkspur Logistics Group', 'VP Revenue Operations', 'enterprise', at),
    createUser(tenantId, '241', 'Priya Nwosu', 'priya@meadow-retail.example', 'Meadow Retail Collective', 'Director of Sales Ops', 'growth', at),
    createUser(tenantId, '812', 'Marco Chen', 'marco@hearthline-labs.example', 'Hearthline Labs', 'Head of Commercial', 'starter', at),
  ]

  const selectors: SelectorDefinition[] = [
    createSelector(tenantId, dataSources[0], semanticAttributes[1], 'Preferred Channel from CRM', 'DIRECT_FIELD_MAPPING', {
      transforms: [{ path: 'crm.preferredChannel', type: 'lower' }],
      rule: { valuePath: 'crm.preferredChannel' },
    }, { requiredPaths: ['crm.preferredChannel'] }, 'Preferred channel resolved from CRM contact preference as {{sourceValue}}.', 0.96, 1440, 10, 60, at),
    createSelector(tenantId, dataSources[0], semanticAttributes[2], 'Plan Interest from CRM', 'STRING_TO_ENUM_MAPPING', {
      transforms: [{ path: 'crm.planInterest', type: 'lower' }],
      rule: {
        valuePath: 'crm.planInterest',
        map: { enterprise: 'enterprise', growth: 'growth', starter: 'starter' },
      },
    }, { requiredPaths: ['crm.planInterest'] }, 'Plan interest resolved from CRM as {{mappedValue}}.', 0.94, 1440, 10, 60, at),
    createSelector(tenantId, dataSources[1], semanticAttributes[4], 'Engagement Level from Usage', 'THRESHOLD_CLASSIFICATION', {
      rule: {
        valuePath: 'usage.activityScore',
        thresholds: [
          { min: 80, label: 'high' },
          { min: 50, max: 80, label: 'medium' },
          { min: 0, max: 50, label: 'low' },
        ],
      },
    }, { requiredPaths: ['usage.activityScore'] }, 'Engagement level classified from activity score {{sourceValue}}.', 0.91, 720, 8, 30, at),
    createSelector(tenantId, dataSources[2], semanticAttributes[0], 'Conversion Probability Score', 'WEIGHTED_SCORING', {
      rule: {
        minimum: 0,
        maximum: 100,
        components: [
          { sourcePath: 'warehouse.opportunityStage', weight: 1, map: { proposal: 60, negotiation: 75, discovery: 35 }, defaultValue: 20 },
          { sourcePath: 'warehouse.planInterest', weight: 1, expected: 'enterprise', trueValue: 10, falseValue: 0 },
          { sourcePath: 'warehouse.activeDays30', weight: 1, threshold: 20, trueValue: 10, falseValue: 0 },
          { sourcePath: 'warehouse.featureEvents7', weight: 1, threshold: 50, trueValue: 5, falseValue: 0 },
        ],
      },
    }, { requiredPaths: ['warehouse.opportunityStage', 'warehouse.planInterest', 'warehouse.activeDays30', 'warehouse.featureEvents7'] }, 'Conversion score combined stage {{warehouseopportunityStage}}, plan interest {{warehouseplanInterest}}, and {{warehouseactiveDays30}} active days.', 0.89, 180, 9, 30, at),
    createSelector(tenantId, dataSources[2], semanticAttributes[3], 'Churn Risk Score', 'FORMULA_METRIC', {
      rule: {
        expression: '15 + support_ticket_score + low_nps_penalty - active_days_credit',
        variables: [
          { name: 'support_ticket_score', sourcePath: 'warehouse.supportTickets30', multiplier: 2 },
          { name: 'low_nps_penalty', sourcePath: 'warehouse.nps', threshold: 50, trueValue: 0, falseValue: 5 },
          { name: 'active_days_credit', sourcePath: 'warehouse.activeDays30', threshold: 20, trueValue: 10, falseValue: 0 },
        ],
      },
    }, { requiredPaths: ['warehouse.supportTickets30', 'warehouse.nps', 'warehouse.activeDays30'] }, 'Churn risk combined support ticket score {{support_ticket_score}}, NPS penalty {{low_nps_penalty}}, and active-day credit {{active_days_credit}}.', 0.88, 180, 7, 30, at),
  ]

  const promptTemplates: PromptTemplate[] = [
    {
      id: crypto.randomUUID(),
      tenantId,
      name: 'Intelligent Sales Support v1',
      description: 'Grounded sales orchestration template for strategy, email generation, and follow-up planning.',
      systemPrompt:
        "You are Context Layer's Intelligent Sales Support agent. Use only the supplied grounded context package. Never invent missing details. Every claim must cite one or more citationIds from the context package.",
      developerPrompt:
        'Act like a senior enterprise sales strategist reviewing CRM, warehouse, and usage intelligence. If any fact is low confidence, stale, or missing, say so clearly, lower your confidence, and recommend human review. Return JSON only.',
      userPromptTemplate:
        "Generate sales support output for {{user.fullName}} at {{user.companyName}}. The sales objective is '{{salesObjective}}'. Produce an outreach strategy, a personalised email draft, and follow-up recommendations grounded in the context package.",
      outputSchemaJson: prettyJson({
        type: 'object',
        required: [
          'salesObjective',
          'outreachStrategy',
          'personalizedEmailDraft',
          'followUpRecommendations',
          'missingInformation',
          'humanReviewRecommended',
          'humanReviewReason',
          'overallConfidence',
        ],
      }),
      guardrailsJson: prettyJson([
        'Only use facts included in the context package.',
        'Cite one or more citationIds for every talking point, risk, supporting claim, and follow-up recommendation.',
        'Return missingInformation instead of guessing.',
        'Acknowledge stale or low-confidence signals and recommend human review when needed.',
      ]),
      version: 1,
      isActive: true,
      createdAtUtc: at(72),
      updatedAtUtc: at(1),
    },
  ]

  const signals = seedSignals(tenantId, dataSources, users, at)
  const auditEvents: AuditEvent[] = []

  return {
    tenantSlug: 'demo',
    tenantId,
    dataSources,
    semanticAttributes,
    selectors,
    selectorExecutions: [],
    users,
    promptTemplates,
    agentRuns: [],
    auditEvents,
    signals,
    snapshots: [],
  }
}

function createAttribute(
  tenantId: string,
  key: string,
  displayName: string,
  dataType: SemanticAttributeDefinition['dataType'],
  exampleValueJson: string,
  isSystem: boolean,
  at: (deltaHours: number) => string,
): SemanticAttributeDefinition {
  return {
    id: crypto.randomUUID(),
    tenantId,
    key,
    displayName,
    description: `${displayName} semantic attribute.`,
    dataType,
    exampleValueJson,
    isSystem,
    createdAtUtc: at(72),
    updatedAtUtc: at(1),
  }
}

function createUser(
  tenantId: string,
  externalUserId: string,
  fullName: string,
  email: string,
  companyName: string,
  jobTitle: string,
  segment: string,
  at: (deltaHours: number) => string,
): UserProfile {
  return {
    id: crypto.randomUUID(),
    tenantId,
    externalUserId,
    fullName,
    email,
    isEmailMasked: false,
    companyName,
    jobTitle,
    segment,
    lastSeenAtUtc: at(1),
    createdAtUtc: at(120),
    updatedAtUtc: at(1),
  }
}

function maskEmail(email: string) {
  const separatorIndex = email.indexOf('@')
  if (separatorIndex <= 1) {
    return '***'
  }

  return `${email.slice(0, 1)}***${email.slice(separatorIndex)}`
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return slug || 'primary'
}

function humanizeKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (first) => first.toUpperCase())
}

function deploymentGuidance(mode: SubmitOnboardingInput['preferredDeploymentMode']) {
  if (mode === 'self-hosted') {
    return 'Prepare PostgreSQL, signing keys, and your connector secret store for the self-hosted control plane.'
  }
  if (mode === 'managed-saas') {
    return 'Invite your integration admin and move starter sources to managed SaaS connector registrations.'
  }
  if (mode === 'private-cloud') {
    return 'Schedule the private cloud network and identity review before moving credentials into the environment.'
  }
  return 'Keep exploring with local demo data, then switch to backend-only or SaaS mode when you are ready.'
}

function connectorCatalogueEntry(
  connectorType: string,
  displayName: string,
  category: string,
  availability: ConnectorCatalogueEntry['availability'],
  isPlaceholder: boolean,
  descriptionParts: string[],
): ConnectorCatalogueEntry {
  return {
    connectorType,
    displayName,
    description: descriptionParts.join(' '),
    category,
    availability,
    isIncludedInOpenCore: availability === 'OpenCore',
    requiresCommercialAgreement: availability === 'Enterprise' || availability === 'SaaSManaged',
    isPlaceholder,
    isEnabled: true,
    supportedDataSourceKinds:
      category === 'Warehouse'
        ? ['SqlMetric', 'ProductUsage']
        : category === 'File'
          ? ['Crm', 'SqlMetric', 'ProductUsage', 'EventStream']
          : ['Crm', 'EventStream'],
    capabilities: isPlaceholder
      ? ['catalogueOnly', 'configurationSchema', 'futureHealthCheck', 'futureCredentialStorage']
      : ['configurationValidation', 'healthCheck', 'preview', 'dryRun', 'eventTriggeredRecompute', 'secureCredentialStorage'],
    configurationSchemaJson: prettyJson({
      type: 'object',
      description: isPlaceholder
        ? 'Placeholder schema for a future commercial connector. It is intentionally non-executable in the public repo.'
        : 'Open-core demo/generic connector configuration schema.',
    }),
    credentialSchemaJson: prettyJson({
      type: 'object',
      description: isPlaceholder
        ? 'Future credentials would be stored through the connector credential abstraction.'
        : 'Credentials are optional for safe demo connectors and stored through the connector credential abstraction when present.',
    }),
    healthCheckMode: isPlaceholder
      ? 'Unavailable in open source; safe metadata only.'
      : 'Local deterministic validation or generic health-check through the plugin abstraction.',
  }
}

function blueprintResult(status: string, blueprintJson: string, imported: boolean): BlueprintImportResult {
  const parsed = safeJsonParse<Record<string, unknown>>(blueprintJson, {})
  const dataSources = Array.isArray(parsed.dataSources) ? parsed.dataSources : []
  const attributes = Array.isArray(parsed.semanticAttributes) ? parsed.semanticAttributes : []
  const selectors = Array.isArray(parsed.selectors) ? parsed.selectors : []
  const prompts = Array.isArray(parsed.promptTemplates) ? parsed.promptTemplates : []
  const piiRules = Array.isArray(parsed.piiRules) ? parsed.piiRules : []
  const auditPolicies = Array.isArray(parsed.auditPolicies) ? parsed.auditPolicies : []
  const issues =
    dataSources.length && attributes.length && selectors.length
      ? []
      : [{ path: '$', message: 'Blueprint must include dataSources, semanticAttributes, and selectors.', severity: 'error', line: null, bytePositionInLine: null }]
  const preview = [
    ...dataSources.map((item, index) => ({
      entityType: 'DataSource',
      name: String((item as { name?: unknown }).name ?? `Data source ${index + 1}`),
      action: 'Create',
      path: `$.dataSources[${index}]`,
    })),
    ...attributes.map((item, index) => ({
      entityType: 'SemanticAttribute',
      name: String((item as { key?: unknown }).key ?? `attribute${index + 1}`),
      action: 'Create',
      path: `$.semanticAttributes[${index}]`,
    })),
    ...selectors.map((item, index) => ({
      entityType: 'SelectorDefinition',
      name: String((item as { name?: unknown }).name ?? `Selector ${index + 1}`),
      action: 'Create',
      path: `$.selectors[${index}]`,
    })),
    ...prompts.map((item, index) => ({
      entityType: 'PromptTemplate',
      name: String((item as { name?: unknown }).name ?? `Prompt ${index + 1}`),
      action: 'Create',
      path: `$.promptTemplates[${index}]`,
    })),
    ...piiRules.map((item, index) => ({
      entityType: 'PiiRule',
      name: String((item as { key?: unknown }).key ?? `piiRule${index + 1}`),
      action: 'Create',
      path: `$.piiRules[${index}]`,
    })),
    ...auditPolicies.map((item, index) => ({
      entityType: 'AuditPolicy',
      name: String((item as { key?: unknown }).key ?? `auditPolicy${index + 1}`),
      action: 'Create',
      path: `$.auditPolicies[${index}]`,
    })),
  ]

  return {
    importId: crypto.randomUUID(),
    status: issues.length ? 'Rejected' : status,
    isValid: issues.length === 0,
    blueprintName: String(parsed.name ?? 'Context Layer Blueprint'),
    blueprintSchemaJson: prettyJson({ title: 'ContextLayerBlueprint', type: 'object' }),
    issues,
    preview,
    createdDataSources: imported ? preview.filter((item) => item.entityType === 'DataSource').map((item) => item.name) : [],
    createdSemanticAttributes: imported ? preview.filter((item) => item.entityType === 'SemanticAttribute').map((item) => item.name) : [],
    createdSelectors: imported ? preview.filter((item) => item.entityType === 'SelectorDefinition').map((item) => item.name) : [],
    createdPromptTemplates: imported ? preview.filter((item) => item.entityType === 'PromptTemplate').map((item) => item.name) : [],
    createdPiiRules: imported ? preview.filter((item) => item.entityType === 'PiiRule').map((item) => item.name) : [],
    createdAuditPolicies: imported ? preview.filter((item) => item.entityType === 'AuditPolicy').map((item) => item.name) : [],
    summary: {
      dataSources: dataSources.length,
      semanticAttributes: attributes.length,
      selectors: selectors.length,
      promptTemplates: prompts.length,
      piiRules: piiRules.length,
      auditPolicies: auditPolicies.length,
    },
  }
}

function createSelector(
  tenantId: string,
  dataSource: DataSource,
  attribute: SemanticAttributeDefinition,
  name: string,
  mappingKind: SelectorDefinition['mappingKind'],
  expression: Record<string, unknown>,
  validationSchema: Record<string, unknown>,
  explanationTemplate: string,
  defaultConfidence: number,
  freshnessWindowMinutes: number,
  priority: number,
  scheduleIntervalMinutes: number,
  at: (deltaHours: number) => string,
): SelectorDefinition {
  return {
    id: crypto.randomUUID(),
    tenantId,
    dataSourceId: dataSource.id,
    targetAttributeDefinitionId: attribute.id,
    name,
    description: `${name} selector.`,
    mappingKind,
    expressionJson: prettyJson(expression),
    explanationTemplate,
    validationSchemaJson: prettyJson(validationSchema),
    status: 'PUBLISHED',
    version: 2,
    defaultConfidence,
    freshnessWindowMinutes,
    priority,
    scheduleIntervalMinutes,
    publishedAtUtc: at(18),
    createdAtUtc: at(72),
    updatedAtUtc: at(18),
    dataSource,
    targetAttributeDefinition: attribute,
  }
}

function seedSignals(
  tenantId: string,
  dataSources: DataSource[],
  users: UserProfile[],
  at: (deltaHours: number) => string,
) {
  const [crm, usage, warehouse] = dataSources
  const signalRows = [
    ['123', crm.id, 'crm.preferredChannel', 'email', 'ENUM', at(12), [{ source: 'crmApi', field: 'preferredChannel' }]],
    ['123', crm.id, 'crm.planInterest', 'enterprise', 'ENUM', at(10), [{ source: 'crmApi', field: 'planInterest' }]],
    ['123', usage.id, 'usage.activityScore', 91, 'NUMBER', at(2), [{ source: 'telemetryStream', field: 'activityScore' }]],
    ['123', warehouse.id, 'warehouse.opportunityStage', 'proposal', 'ENUM', at(2), [{ source: 'warehouse', field: 'opportunityStage' }]],
    ['123', warehouse.id, 'warehouse.planInterest', 'enterprise', 'ENUM', at(2), [{ source: 'warehouse', field: 'planInterest' }]],
    ['123', warehouse.id, 'warehouse.activeDays30', 26, 'NUMBER', at(2), [{ source: 'warehouse', field: 'activeDays30' }]],
    ['123', warehouse.id, 'warehouse.featureEvents7', 58, 'NUMBER', at(2), [{ source: 'warehouse', field: 'featureEvents7' }]],
    ['123', warehouse.id, 'warehouse.supportTickets30', 1, 'NUMBER', at(2), [{ source: 'warehouse', field: 'supportTickets30' }]],
    ['123', warehouse.id, 'warehouse.nps', 42, 'NUMBER', at(2), [{ source: 'warehouse', field: 'nps' }]],
    ['241', crm.id, 'crm.preferredChannel', 'phone', 'ENUM', at(18), [{ source: 'crmApi', field: 'preferredChannel' }]],
    ['241', crm.id, 'crm.planInterest', 'growth', 'ENUM', at(18), [{ source: 'crmApi', field: 'planInterest' }]],
    ['241', usage.id, 'usage.activityScore', 63, 'NUMBER', at(6), [{ source: 'telemetryStream', field: 'activityScore' }]],
    ['241', warehouse.id, 'warehouse.opportunityStage', 'discovery', 'ENUM', at(6), [{ source: 'warehouse', field: 'opportunityStage' }]],
    ['241', warehouse.id, 'warehouse.planInterest', 'growth', 'ENUM', at(6), [{ source: 'warehouse', field: 'planInterest' }]],
    ['241', warehouse.id, 'warehouse.activeDays30', 16, 'NUMBER', at(6), [{ source: 'warehouse', field: 'activeDays30' }]],
    ['241', warehouse.id, 'warehouse.featureEvents7', 35, 'NUMBER', at(6), [{ source: 'warehouse', field: 'featureEvents7' }]],
    ['241', warehouse.id, 'warehouse.supportTickets30', 3, 'NUMBER', at(6), [{ source: 'warehouse', field: 'supportTickets30' }]],
    ['241', warehouse.id, 'warehouse.nps', 54, 'NUMBER', at(6), [{ source: 'warehouse', field: 'nps' }]],
    ['812', crm.id, 'crm.preferredChannel', 'email', 'ENUM', at(30), [{ source: 'crmApi', field: 'preferredChannel' }]],
    ['812', crm.id, 'crm.planInterest', 'starter', 'ENUM', at(30), [{ source: 'crmApi', field: 'planInterest' }]],
    ['812', usage.id, 'usage.activityScore', 38, 'NUMBER', at(12), [{ source: 'telemetryStream', field: 'activityScore' }]],
    ['812', warehouse.id, 'warehouse.opportunityStage', 'discovery', 'ENUM', at(12), [{ source: 'warehouse', field: 'opportunityStage' }]],
    ['812', warehouse.id, 'warehouse.planInterest', 'starter', 'ENUM', at(12), [{ source: 'warehouse', field: 'planInterest' }]],
    ['812', warehouse.id, 'warehouse.activeDays30', 8, 'NUMBER', at(12), [{ source: 'warehouse', field: 'activeDays30' }]],
    ['812', warehouse.id, 'warehouse.featureEvents7', 18, 'NUMBER', at(12), [{ source: 'warehouse', field: 'featureEvents7' }]],
    ['812', warehouse.id, 'warehouse.supportTickets30', 4, 'NUMBER', at(12), [{ source: 'warehouse', field: 'supportTickets30' }]],
    ['812', warehouse.id, 'warehouse.nps', 33, 'NUMBER', at(12), [{ source: 'warehouse', field: 'nps' }]],
  ] as const

  return signalRows.map(([externalUserId, dataSourceId, key, value, valueType, observedAtUtc, provenance]) => ({
    id: crypto.randomUUID(),
    tenantId,
    userProfileId: users.find((user) => user.externalUserId === externalUserId)!.id,
    dataSourceId,
    key,
    value,
    valueType,
    observedAtUtc,
    provenance,
  }))
}
