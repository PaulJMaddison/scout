import { env } from '@/lib/env'
import { authStore } from '@/lib/auth'
import type { OperationName } from '@/mocks/mock-api'
import type {
  AgentRun,
  AgentRunResult,
  AuthSession,
  AuditEvent,
  AuthenticatedOperator,
  ApiClientCreatedResult,
  ApiClientRotatedResult,
  ApiClientSummary,
  BillingUsageOverview,
  BlueprintImportHistory,
  BlueprintImportInput,
  BlueprintImportResult,
  CheckConnectorHealthInput,
  ConnectorConfigurationValidationResult,
  ConnectorCatalogueEntry,
  ConnectorHealthResult,
  ConnectorPluginDefinition,
  ConnectorRegistrationResult,
  ContextProfileResult,
  CreateApiClientInput,
  CreateAgentRunInput,
  DataSource,
  DataSourceKind,
  GovernancePolicy,
  IngestSourceSystemEventInput,
  LoginRequest,
  LicenceStatus,
  NextActionInput,
  NextActionResult,
  OnboardingResult,
  OperatorAccountSummary,
  OrganisationSettings,
  OperationalSummary,
  PagedResponse,
  PromptTemplate,
  PublishSelectorDefinitionInput,
  QueueContextRecomputeInput,
  QueueRecomputeResult,
  RegisterConnectorInput,
  RunScheduledRecomputeInput,
  SalesContextPackageInput,
  SalesContextPackageResult,
  ScheduledRecomputeDispatchResult,
  SelectorDefinition,
  SelectorExecution,
  SelectorExecutionPreviewResult,
  SelectorValidationResult,
  SemanticAttributeDefinition,
  SubmitOnboardingInput,
  UploadBlueprintInput,
  UpsertDataSourceInput,
  UpdateOperatorAccountInput,
  UpsertPromptTemplateInput,
  UpsertSelectorDefinitionInput,
  UpsertSemanticAttributeInput,
  UserProfile,
  UserContextLookupInput,
  ValidateSelectorInput,
  PreviewSelectorInput,
  SourceSystemEventHistory,
  SourceSystemEventAcceptedResult,
  ValidateConnectorConfigurationInput,
  WorkspaceSummary,
} from '@/lib/types'

type ApiMode = 'unknown' | 'live' | 'demo'

class ApiModeStore {
  private mode: ApiMode = 'unknown'
  private listeners = new Set<() => void>()

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.mode

  setMode = (mode: ApiMode) => {
    this.mode = mode
    for (const listener of this.listeners) {
      listener()
    }
  }
}

export const apiModeStore = new ApiModeStore()

const restDataSourceKinds: Record<DataSourceKind, number> = {
  CRM: 1,
  SQL_METRIC: 2,
  EVENT_STREAM: 3,
  PRODUCT_USAGE: 4,
}

interface GraphQlEnvelope<T> {
  data?: T
  errors?: Array<{ message: string }>
}

function createRequestId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `req-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

async function parseError(response: Response) {
  try {
    const payload = (await response.json()) as {
      title?: string
      detail?: string
      error?: { message?: string }
      errors?: Array<{ message: string }>
    }
    return payload.error?.message || payload.detail || payload.title || payload.errors?.map((entry) => entry.message).join('\n') || `Request failed with ${response.status}.`
  } catch {
    return `Request failed with ${response.status}.`
  }
}

async function restRequest<TData>(
  path: string,
  init?: RequestInit,
  options?: { allowDemoFallback?: boolean; fallback?: () => Promise<TData> | TData },
) {
  try {
    const requestId = createRequestId()
    const response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
        ...(authStore.getAccessToken()
          ? { Authorization: `Bearer ${authStore.getAccessToken()}` }
          : {}),
        ...init?.headers,
      },
    })

    if (!response.ok) {
      const message = await parseError(response)
      const error = new Error(message)
      ;(error as Error & { status?: number }).status = response.status
      throw error
    }

    apiModeStore.setMode('live')
    if (response.status === 204) {
      return undefined as TData
    }

    return (await response.json()) as TData
  } catch (error) {
    const status = (error as Error & { status?: number }).status
    if (!options?.allowDemoFallback || !env.demoFallbackEnabled || status === 401 || status === 403) {
      throw error
    }

    if (!options.fallback) {
      throw error
    }

    const fallback = await options.fallback()
    apiModeStore.setMode('demo')
    return fallback
  }
}

async function graphqlRequest<TData>(
  operationName: OperationName,
  query: string,
  variables?: Record<string, unknown>,
) {
  try {
    const requestId = createRequestId()
    const response = await fetch(env.graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
        ...(authStore.getAccessToken()
          ? { Authorization: `Bearer ${authStore.getAccessToken()}` }
          : {}),
      },
      body: JSON.stringify({
        operationName,
        query,
        variables,
      }),
    })

    if (!response.ok) {
      const message = await parseError(response)
      const error = new Error(message)
      ;(error as Error & { status?: number }).status = response.status
      throw error
    }

    const payload = (await response.json()) as GraphQlEnvelope<TData>
    if (payload.errors?.length) {
      throw new Error(payload.errors.map((entry) => entry.message).join('\n'))
    }

    apiModeStore.setMode('live')
    return payload.data as TData
  } catch (error) {
    const status = (error as Error & { status?: number }).status
    if (!env.demoFallbackEnabled || status === 401 || status === 403) {
      throw error
    }

    const fallback = await mockGraphqlFallback<TData>(operationName, variables)
    apiModeStore.setMode('demo')
    return fallback
  }
}

async function mockGraphqlFallback<TData>(
  operationName: OperationName,
  variables?: Record<string, unknown>,
) {
  const { mockGraphqlRequest } = await import('@/mocks/mock-api')
  return mockGraphqlRequest<TData>(operationName, variables)
}

export const api = {
  async login(input: LoginRequest) {
    const data = await restRequest<{
      accessToken: string
      expiresAtUtc: string
      operator: AuthenticatedOperator
    }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      {
        allowDemoFallback: true,
        fallback: async () => {
          const { mockLogin } = await import('@/mocks/mock-api')
          return mockLogin(input)
        },
      },
    )

    return {
      accessToken: data.accessToken,
      expiresAtUtc: data.expiresAtUtc,
      ...data.operator,
    } satisfies AuthSession
  },

  async getMe() {
    const data = await restRequest<AuthenticatedOperator>(
      '/api/auth/me',
      {
        method: 'GET',
      },
      {
        allowDemoFallback: true,
        fallback: async () => {
          const { mockGetMe } = await import('@/mocks/mock-api')
          return mockGetMe()
        },
      },
    )
    return data
  },

  async getOperationalSummary() {
    return restRequest<OperationalSummary>(
      '/api/ops/summary',
      {
        method: 'GET',
      },
      {
        allowDemoFallback: true,
        fallback: async () => {
          const { mockGetOperationalSummary } = await import('@/mocks/mock-api')
          return mockGetOperationalSummary()
        },
      },
    )
  },

  async submitOnboarding(input: SubmitOnboardingInput) {
    return restRequest<OnboardingResult>(
      '/api/onboarding',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      {
        allowDemoFallback: true,
        fallback: async () => {
          const { mockSubmitOnboarding } = await import('@/mocks/mock-api')
          return mockSubmitOnboarding(input)
        },
      },
    )
  },

  async getConnectorCatalogue() {
    const data = await restRequest<PagedResponse<ConnectorCatalogueEntry>>(
      '/api/v1/connectors/catalogue?page=1&pageSize=100',
      {
        method: 'GET',
      },
      {
        allowDemoFallback: true,
        fallback: async () => {
          const { mockGetConnectorCatalogue } = await import('@/mocks/mock-api')
          return mockGetConnectorCatalogue()
        },
      },
    )
    return data.items
  },

  async getConnectorPlugins() {
    return restRequest<ConnectorPluginDefinition[]>('/api/rest/connectors/plugins', {
      method: 'GET',
    })
  },

  async validateConnectorConfiguration(input: ValidateConnectorConfigurationInput) {
    return restRequest<ConnectorConfigurationValidationResult>('/api/rest/connectors/validate', {
      method: 'POST',
      body: JSON.stringify({
        connectorType: input.connectorType,
        kind: restDataSourceKinds[input.kind],
        configurationJson: input.configurationJson,
        credentialsJson: input.credentialsJson?.trim() ? input.credentialsJson : null,
      }),
    })
  },

  async registerConnector(input: RegisterConnectorInput) {
    return restRequest<ConnectorRegistrationResult>('/api/rest/connectors/register', {
      method: 'POST',
      body: JSON.stringify({
        id: input.id ?? null,
        tenantSlug: input.tenantSlug,
        name: input.name,
        description: input.description,
        kind: restDataSourceKinds[input.kind],
        connectorType: input.connectorType,
        configurationJson: input.configurationJson,
        credentialsJson: input.credentialsJson?.trim() ? input.credentialsJson : null,
      }),
    })
  },

  async checkConnectorHealth(input: CheckConnectorHealthInput) {
    return restRequest<ConnectorHealthResult>('/api/rest/connectors/health', {
      method: 'POST',
      body: JSON.stringify({
        tenantSlug: input.tenantSlug,
        dataSourceId: input.dataSourceId,
        externalUserId: input.externalUserId?.trim() ? input.externalUserId : null,
        mode: input.mode?.trim() ? input.mode : null,
      }),
    })
  },

  async ingestSourceSystemEvent(input: IngestSourceSystemEventInput) {
    const payload = input.payloadJson?.trim()
      ? undefined
      : input.payload ?? {}
    return restRequest<SourceSystemEventAcceptedResult>(
      `/api/v1/events/source-system?tenantSlug=${encodeURIComponent(input.tenantSlug)}`,
      {
        method: 'POST',
        body: JSON.stringify({
          eventId: input.eventId?.trim() || null,
          workspaceSlug: input.workspaceSlug?.trim() || null,
          sourceSystem: input.sourceSystem,
          eventType: input.eventType,
          payload,
          payloadJson: input.payloadJson?.trim() || null,
          externalUserId: input.externalUserId?.trim() || null,
          externalAccountId: input.externalAccountId?.trim() || null,
          observedAtUtc: input.observedAtUtc?.trim() || null,
        }),
      },
    )
  },

  async getBillingUsage(tenantSlug: string) {
    return restRequest<BillingUsageOverview>(
      `/api/v1/billing/usage?tenantSlug=${encodeURIComponent(tenantSlug)}`,
      {
        method: 'GET',
      },
      {
        allowDemoFallback: true,
        fallback: async () => {
          const { mockGetBillingUsage } = await import('@/mocks/mock-api')
          return mockGetBillingUsage(tenantSlug)
        },
      },
    )
  },

  async getLicenceStatus() {
    return restRequest<LicenceStatus>(
      '/api/v1/licence/status',
      { method: 'GET' },
      {
        allowDemoFallback: true,
        fallback: async () => {
          const { mockGetLicenceStatus } = await import('@/mocks/mock-api')
          return mockGetLicenceStatus()
        },
      },
    )
  },

  async getOrganisationSettings(tenantSlug: string) {
    const data = await graphqlRequest<{ organisationSettings: OrganisationSettings }>(
      'GetOrganisationSettings',
      `
        query GetOrganisationSettings($tenantSlug: String!) {
          organisationSettings(tenantSlug: $tenantSlug) {
            tenantId
            tenantSlug
            tenantName
            isActive
            createdAtUtc
            updatedAtUtc
            plan
            subscriptionStatus
            workspaceCount
            userCount
            apiClientCount
          }
        }
      `,
      { tenantSlug },
    )
    return data.organisationSettings
  },

  async getWorkspaces(tenantSlug: string) {
    const data = await graphqlRequest<{ workspaces: WorkspaceSummary[] }>(
      'GetWorkspaces',
      `
        query GetWorkspaces($tenantSlug: String!) {
          workspaces(tenantSlug: $tenantSlug, status: null) {
            id
            slug
            name
            description
            status
            isDefault
          }
        }
      `,
      { tenantSlug },
    )
    return data.workspaces
  },

  async getOperatorAccounts(tenantSlug: string) {
    const data = await graphqlRequest<{ operatorAccounts: OperatorAccountSummary[] }>(
      'GetOperatorAccounts',
      `
        query GetOperatorAccounts($tenantSlug: String!) {
          operatorAccounts(tenantSlug: $tenantSlug) {
            id
            tenantId
            email
            displayName
            role
            isActive
            lastLoginAtUtc
            createdAtUtc
            updatedAtUtc
            workspaces {
              workspaceId
              workspaceSlug
              workspaceName
              role
              acceptedAtUtc
            }
          }
        }
      `,
      { tenantSlug },
    )
    return data.operatorAccounts
  },

  async updateOperatorAccount(input: UpdateOperatorAccountInput) {
    return restRequest<OperatorAccountSummary>(
      `/api/v1/admin/users/${input.operatorAccountId}?tenantSlug=${encodeURIComponent(input.tenantSlug)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          tenantSlug: input.tenantSlug,
          displayName: input.displayName,
          role: input.role,
          isActive: input.isActive,
        }),
      },
      {
        allowDemoFallback: true,
        fallback: async () => {
          const data = await mockGraphqlFallback<{ updateOperatorAccount: OperatorAccountSummary }>('UpdateOperatorAccount', { input })
          return data.updateOperatorAccount
        },
      },
    )
  },

  async getApiClients(tenantSlug: string) {
    const data = await graphqlRequest<{ apiClients: ApiClientSummary[] }>(
      'GetApiClients',
      `
        query GetApiClients($tenantSlug: String!) {
          apiClients(tenantSlug: $tenantSlug) {
            id
            tenantId
            workspaceId
            clientId
            displayName
            status
            scopes
            lastUsedAtUtc
            rotatedAtUtc
            revokedAtUtc
          }
        }
      `,
      { tenantSlug },
    )
    return data.apiClients
  },

  async createApiClient(input: CreateApiClientInput) {
    return restRequest<ApiClientCreatedResult>(
      `/api/v1/api-clients?tenantSlug=${encodeURIComponent(input.tenantSlug)}`,
      {
        method: 'POST',
        body: JSON.stringify({
          displayName: input.displayName,
          workspaceSlug: input.workspaceSlug,
          scopes: input.scopes,
        }),
      },
      {
        allowDemoFallback: true,
        fallback: async () => {
          const data = await mockGraphqlFallback<{ createApiClient: ApiClientCreatedResult }>('CreateApiClient', { input })
          return data.createApiClient
        },
      },
    )
  },

  async rotateApiClient(tenantSlug: string, clientId: string) {
    return restRequest<ApiClientRotatedResult>(
      `/api/v1/api-clients/${encodeURIComponent(clientId)}/rotate?tenantSlug=${encodeURIComponent(tenantSlug)}`,
      { method: 'POST' },
      {
        allowDemoFallback: true,
        fallback: async () => {
          const data = await mockGraphqlFallback<{ rotateApiClient: ApiClientRotatedResult }>('RotateApiClient', { tenantSlug, clientId })
          return data.rotateApiClient
        },
      },
    )
  },

  async revokeApiClient(tenantSlug: string, clientId: string) {
    await restRequest<void>(
      `/api/v1/api-clients/${encodeURIComponent(clientId)}?tenantSlug=${encodeURIComponent(tenantSlug)}`,
      { method: 'DELETE' },
      {
        allowDemoFallback: true,
        fallback: async () => {
          await mockGraphqlFallback<{ revokeApiClient: boolean }>('RevokeApiClient', { tenantSlug, clientId })
        },
      },
    )
    return true
  },

  async getSourceSystemEvents(tenantSlug: string) {
    const data = await graphqlRequest<{ sourceSystemEvents: SourceSystemEventHistory[] }>(
      'GetSourceSystemEvents',
      `
        query GetSourceSystemEvents($tenantSlug: String!) {
          sourceSystemEvents(
            tenantSlug: $tenantSlug
            workspaceSlug: null
            sourceSystem: null
            eventType: null
            status: null
            fromUtc: null
            toUtc: null
          ) {
            id
            tenantId
            workspaceId
            eventId
            sourceSystem
            eventType
            status
            externalUserId
            externalAccountId
            userProfileId
            dataSourceId
            matchedSelectorCount
            processingSummary
            errorMessage
            deadLetterReason
            correlationId
            receivedAtUtc
            observedAtUtc
            processedAtUtc
            deadLetteredAtUtc
            payloadJson
          }
        }
      `,
      { tenantSlug },
    )
    return data.sourceSystemEvents
  },

  async getBlueprintImports(tenantSlug: string) {
    const data = await graphqlRequest<{ blueprintImports: BlueprintImportHistory[] }>(
      'GetBlueprintImports',
      `
        query GetBlueprintImports($tenantSlug: String!) {
          blueprintImports(tenantSlug: $tenantSlug, status: null) {
            id
            tenantId
            workspaceId
            workspaceSlug
            name
            status
            uploadedBy
            validationIssueCount
            previewChangeCount
            importSummaryJson
            uploadedAtUtc
            validatedAtUtc
            importedAtUtc
          }
        }
      `,
      { tenantSlug },
    )
    return data.blueprintImports
  },

  async getGovernancePolicies(tenantSlug: string) {
    const data = await graphqlRequest<{ governancePolicies: GovernancePolicy[] }>(
      'GetGovernancePolicies',
      `
        query GetGovernancePolicies($tenantSlug: String!) {
          governancePolicies(tenantSlug: $tenantSlug) {
            id
            tenantId
            blueprintImportId
            policyType
            key
            displayName
            description
            status
            definitionJson
            createdAtUtc
            updatedAtUtc
          }
        }
      `,
      { tenantSlug },
    )
    return data.governancePolicies
  },

  async exportAuditEvents(tenantSlug: string, format: 'json' | 'csv') {
    const response = await fetch(
      `${env.apiBaseUrl}/api/v1/audit-events/export?tenantSlug=${encodeURIComponent(tenantSlug)}&format=${format}`,
      {
        headers: {
          ...(authStore.getAccessToken()
            ? { Authorization: `Bearer ${authStore.getAccessToken()}` }
            : {}),
        },
      },
    )
    if (!response.ok) {
      throw new Error(await parseError(response))
    }

    return {
      content: await response.text(),
      fileName:
        response.headers
          .get('content-disposition')
          ?.match(/filename="?([^"]+)"?/)?.[1] ?? `scout-audit.${format}`,
      contentType: response.headers.get('content-type') ?? (format === 'json' ? 'application/json' : 'text/csv'),
    }
  },

  async uploadBlueprint(input: UploadBlueprintInput) {
    return restRequest<BlueprintImportResult>(
      '/api/v1/blueprints/upload',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      {
        allowDemoFallback: true,
        fallback: async () => {
          const { mockUploadBlueprint } = await import('@/mocks/mock-api')
          return mockUploadBlueprint(input)
        },
      },
    )
  },

  async validateBlueprint(input: BlueprintImportInput) {
    return restRequest<BlueprintImportResult>(
      '/api/v1/blueprints/validate',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      {
        allowDemoFallback: true,
        fallback: async () => {
          const { mockValidateBlueprint } = await import('@/mocks/mock-api')
          return mockValidateBlueprint(input)
        },
      },
    )
  },

  async previewBlueprint(input: BlueprintImportInput) {
    return restRequest<BlueprintImportResult>(
      '/api/v1/blueprints/preview',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      {
        allowDemoFallback: true,
        fallback: async () => {
          const { mockPreviewBlueprint } = await import('@/mocks/mock-api')
          return mockPreviewBlueprint(input)
        },
      },
    )
  },

  async importBlueprint(input: BlueprintImportInput) {
    return restRequest<BlueprintImportResult>(
      '/api/v1/blueprints/import',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      {
        allowDemoFallback: true,
        fallback: async () => {
          const { mockImportBlueprint } = await import('@/mocks/mock-api')
          return mockImportBlueprint(input)
        },
      },
    )
  },

  async getUserProfiles(tenantSlug: string) {
    const data = await graphqlRequest<{ userProfiles: UserProfile[] }>(
      'GetUserProfiles',
      `
        query GetUserProfiles($tenantSlug: String!) {
          userProfiles(tenantSlug: $tenantSlug) {
            id
            tenantId
            externalUserId
            fullName
            email
            isEmailMasked
            companyName
            jobTitle
            segment
            lastSeenAtUtc
          }
        }
      `,
      { tenantSlug },
    )
    return data.userProfiles
  },

  async getDataSources(tenantSlug: string) {
    const data = await graphqlRequest<{ dataSources: DataSource[] }>(
      'GetDataSources',
      `
        query GetDataSources($tenantSlug: String!) {
          dataSources(tenantSlug: $tenantSlug) {
            id
            tenantId
            name
            description
            kind
            status
            connectionConfigJson
            lastSuccessfulSyncAtUtc
            createdAtUtc
            updatedAtUtc
          }
        }
      `,
      { tenantSlug },
    )
    return data.dataSources
  },

  async getSemanticAttributes(tenantSlug: string) {
    const data = await graphqlRequest<{ semanticAttributes: SemanticAttributeDefinition[] }>(
      'GetSemanticAttributes',
      `
        query GetSemanticAttributes($tenantSlug: String!) {
          semanticAttributes(tenantSlug: $tenantSlug) {
            id
            tenantId
            key
            displayName
            description
            dataType
            exampleValueJson
            isSystem
            createdAtUtc
            updatedAtUtc
          }
        }
      `,
      { tenantSlug },
    )
    return data.semanticAttributes
  },

  async getSelectors(tenantSlug: string) {
    const data = await graphqlRequest<{ selectors: SelectorDefinition[] }>(
      'GetSelectors',
      `
        query GetSelectors($tenantSlug: String!) {
          selectors(tenantSlug: $tenantSlug) {
            id
            tenantId
            dataSourceId
            targetAttributeDefinitionId
            name
            description
            mappingKind
            expressionJson
            explanationTemplate
            validationSchemaJson
            status
            version
            defaultConfidence
            freshnessWindowMinutes
            priority
            scheduleIntervalMinutes
            publishedAtUtc
            createdAtUtc
            updatedAtUtc
            dataSource {
              id
              name
              kind
            }
            targetAttributeDefinition {
              id
              key
              displayName
              dataType
            }
          }
        }
      `,
      { tenantSlug },
    )
    return data.selectors
  },

  async getSelectorExecutions(tenantSlug: string, externalUserId?: string) {
    const data = await graphqlRequest<{ selectorExecutions: SelectorExecution[] }>(
      'GetSelectorExecutions',
      `
        query GetSelectorExecutions($tenantSlug: String!, $externalUserId: String) {
          selectorExecutions(tenantSlug: $tenantSlug, externalUserId: $externalUserId) {
            id
            tenantId
            selectorDefinitionId
            userProfileId
            correlationId
            triggeredBy
            executionMode
            status
            rawSourceDataJson
            validationErrorsJson
            pipelineTraceJson
            resultValueJson
            resultValueType
            resultConfidence
            resultObservedAtUtc
            resultExplanation
            resultProvenanceJson
            requestedAtUtc
            startedAtUtc
            completedAtUtc
            errorMessage
            selectorDefinition {
              id
              name
              mappingKind
              priority
              targetAttributeDefinition {
                key
                displayName
              }
            }
            userProfile {
              id
              externalUserId
              fullName
              companyName
            }
          }
        }
      `,
      { tenantSlug, externalUserId },
    )
    return data.selectorExecutions
  },

  async getPromptTemplates(tenantSlug: string) {
    const data = await graphqlRequest<{ promptTemplates: PromptTemplate[] }>(
      'GetPromptTemplates',
      `
        query GetPromptTemplates($tenantSlug: String!) {
          promptTemplates(tenantSlug: $tenantSlug) {
            id
            tenantId
            name
            description
            systemPrompt
            developerPrompt
            userPromptTemplate
            outputSchemaJson
            guardrailsJson
            version
            isActive
            createdAtUtc
            updatedAtUtc
          }
        }
      `,
      { tenantSlug },
    )
    return data.promptTemplates
  },

  async getAgentRuns(tenantSlug: string, externalUserId?: string) {
    const data = await graphqlRequest<{ agentRuns: AgentRun[] }>(
      'GetAgentRuns',
      `
        query GetAgentRuns($tenantSlug: String!, $externalUserId: String) {
          agentRuns(tenantSlug: $tenantSlug, externalUserId: $externalUserId) {
            id
            tenantId
            userProfileId
            promptTemplateId
            contextSnapshotId
            providerName
            modelName
            salesObjective
            attemptCount
            status
            confidence
            inputJson
            outputJson
            provenanceJson
            requestedAtUtc
            completedAtUtc
            failureReason
          }
        }
      `,
      { tenantSlug, externalUserId },
    )
    return data.agentRuns
  },

  async getAuditEvents(tenantSlug: string) {
    const data = await graphqlRequest<{ auditEvents: AuditEvent[] }>(
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
    )
    return data.auditEvents
  },

  async getUserContext(input: UserContextLookupInput) {
    const data = await graphqlRequest<{ userContext: ContextProfileResult | null }>(
      'GetUserContext',
      `
        query GetUserContext($input: UserContextLookupInput!) {
          userContext(input: $input) {
            snapshotId
            tenantSlug
            externalUserId
            fullName
            companyName
            summary
            overallConfidence
            generatedAtUtc
            isStale
            sourceSummary {
              externalAccountId
              accountName
              domain
              industry
              region
              lifecycleStage
              activePlanName
              subscriptionStatus
              monthlyRecurringRevenue
              openOpportunities
              openSupportTickets
              pricingPageVisits30d
              activeDays30
              emailReplies30d
              highlights {
                label
                value
                explanation
              }
              recentTimeline {
                category
                description
                occurredAtUtc
              }
              rawSummaryJson
            }
            history {
              snapshotId
              snapshotVersion
              summary
              overallConfidence
              generatedAtUtc
              isStale
              factCount
            }
            facts {
              id
              attributeKey
              valueJson
              valueType
              confidence
              observedAtUtc
              freshUntilUtc
              sourceSelectorDefinitionId
              explanation
              provenanceJson
            }
          }
        }
      `,
      { input },
    )
    return data.userContext
  },

  async getSalesContextPackage(input: SalesContextPackageInput) {
    const data = await graphqlRequest<{ salesContextPackage: SalesContextPackageResult | null }>(
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
      { input },
    )
    return data.salesContextPackage
  },

  async generateNextAction(input: NextActionInput) {
    return restRequest<NextActionResult>(
      `/api/v1/intelligence/next-action?tenantSlug=${encodeURIComponent(input.tenantSlug)}`,
      {
        method: 'POST',
        body: JSON.stringify({
          tenant: input.tenantSlug,
          subjectType: input.subjectType,
          subjectIdentifier: input.subjectIdentifier,
          objective: input.objective,
          purpose: input.purpose,
          actorRole: input.actorRole,
        }),
      },
      {
        allowDemoFallback: true,
        fallback: async () => {
          const { mockGenerateNextAction } = await import('@/mocks/mock-api')
          return mockGenerateNextAction(input)
        },
      },
    )
  },

  async upsertDataSource(input: UpsertDataSourceInput) {
    const data = await graphqlRequest<{ upsertDataSource: DataSource }>(
      'UpsertDataSource',
      `
        mutation UpsertDataSource($input: UpsertDataSourceInput!) {
          upsertDataSource(input: $input) {
            id
            tenantId
            name
            description
            kind
            status
            connectionConfigJson
            lastSuccessfulSyncAtUtc
            createdAtUtc
            updatedAtUtc
          }
        }
      `,
      { input },
    )
    return data.upsertDataSource
  },

  async upsertSemanticAttribute(input: UpsertSemanticAttributeInput) {
    const data = await graphqlRequest<{ upsertSemanticAttribute: SemanticAttributeDefinition }>(
      'UpsertSemanticAttribute',
      `
        mutation UpsertSemanticAttribute($input: UpsertSemanticAttributeInput!) {
          upsertSemanticAttribute(input: $input) {
            id
            tenantId
            key
            displayName
            description
            dataType
            exampleValueJson
            isSystem
            createdAtUtc
            updatedAtUtc
          }
        }
      `,
      { input },
    )
    return data.upsertSemanticAttribute
  },

  async upsertPromptTemplate(input: UpsertPromptTemplateInput) {
    const data = await graphqlRequest<{ upsertPromptTemplate: PromptTemplate }>(
      'UpsertPromptTemplate',
      `
        mutation UpsertPromptTemplate($input: UpsertPromptTemplateInput!) {
          upsertPromptTemplate(input: $input) {
            id
            tenantId
            name
            description
            systemPrompt
            developerPrompt
            userPromptTemplate
            outputSchemaJson
            guardrailsJson
            version
            isActive
            createdAtUtc
            updatedAtUtc
          }
        }
      `,
      { input },
    )
    return data.upsertPromptTemplate
  },

  async upsertSelector(input: UpsertSelectorDefinitionInput) {
    const data = await graphqlRequest<{ upsertSelector: SelectorDefinition }>(
      'UpsertSelector',
      `
        mutation UpsertSelector($input: UpsertSelectorDefinitionInput!) {
          upsertSelector(input: $input) {
            id
            tenantId
            dataSourceId
            targetAttributeDefinitionId
            name
            description
            mappingKind
            expressionJson
            explanationTemplate
            validationSchemaJson
            status
            version
            defaultConfidence
            freshnessWindowMinutes
            priority
            scheduleIntervalMinutes
            publishedAtUtc
            createdAtUtc
            updatedAtUtc
          }
        }
      `,
      { input },
    )
    return data.upsertSelector
  },

  async publishSelector(input: PublishSelectorDefinitionInput) {
    const data = await graphqlRequest<{ publishSelector: SelectorDefinition }>(
      'PublishSelector',
      `
        mutation PublishSelector($input: PublishSelectorDefinitionInput!) {
          publishSelector(input: $input) {
            id
            status
            version
            publishedAtUtc
            updatedAtUtc
          }
        }
      `,
      { input },
    )
    return data.publishSelector
  },

  async previewSelector(input: PreviewSelectorInput) {
    const data = await graphqlRequest<{ previewSelector: SelectorExecutionPreviewResult }>(
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
    )
    return data.previewSelector
  },

  async validateSelector(input: ValidateSelectorInput) {
    const data = await graphqlRequest<{ validateSelector: SelectorValidationResult }>(
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
    )
    return data.validateSelector
  },

  async queueContextRecompute(input: QueueContextRecomputeInput) {
    const data = await graphqlRequest<{ queueContextRecompute: QueueRecomputeResult }>(
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
      { input },
    )
    return data.queueContextRecompute
  },

  async runScheduledRecompute(input: RunScheduledRecomputeInput) {
    const data = await graphqlRequest<{ runScheduledRecompute: ScheduledRecomputeDispatchResult }>(
      'RunScheduledRecompute',
      `
        mutation RunScheduledRecompute($input: RunScheduledRecomputeInput!) {
          runScheduledRecompute(input: $input) {
            queuedUserCount
            skippedUserCount
          }
        }
      `,
      { input },
    )
    return data.runScheduledRecompute
  },

  async createAgentRun(input: CreateAgentRunInput) {
    const data = await graphqlRequest<{ createAgentRun: AgentRunResult }>(
      'CreateAgentRun',
      `
        mutation CreateAgentRun($input: CreateAgentRunInput!) {
          createAgentRun(input: $input) {
            agentRunId
            status
            providerName
            modelName
            salesObjective
            confidence
            attemptCount
            humanReviewRecommended
            contextPackageJson
            outputJson
            provenanceJson
            validationErrorsJson
            failureReason
          }
        }
      `,
      { input },
    )
    return data.createAgentRun
  },
}
