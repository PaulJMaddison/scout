import { env } from '@/lib/env'
import { authStore } from '@/lib/auth'
import { mockGraphqlRequest } from '@/mocks/mock-api'
import type {
  AgentRun,
  AgentRunResult,
  AuthSession,
  AuditEvent,
  AuthenticatedOperator,
  ContextProfileResult,
  CreateAgentRunInput,
  DataSource,
  LoginRequest,
  OperationalSummary,
  PromptTemplate,
  PublishSelectorDefinitionInput,
  QueueContextRecomputeInput,
  QueueRecomputeResult,
  RunScheduledRecomputeInput,
  SalesContextPackageInput,
  SalesContextPackageResult,
  ScheduledRecomputeDispatchResult,
  SelectorDefinition,
  SelectorExecution,
  SelectorExecutionPreviewResult,
  SelectorValidationResult,
  SemanticAttributeDefinition,
  UpsertDataSourceInput,
  UpsertPromptTemplateInput,
  UpsertSelectorDefinitionInput,
  UpsertSemanticAttributeInput,
  UserProfile,
  UserContextLookupInput,
  ValidateSelectorInput,
  PreviewSelectorInput,
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
    const payload = (await response.json()) as { title?: string; detail?: string; errors?: Array<{ message: string }> }
    return payload.detail || payload.title || payload.errors?.map((entry) => entry.message).join('\n') || `Request failed with ${response.status}.`
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
  operationName: Parameters<typeof mockGraphqlRequest>[0],
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

    const fallback = await mockGraphqlRequest<TData>(operationName, variables)
    apiModeStore.setMode('demo')
    return fallback
  }
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
