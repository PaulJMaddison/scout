import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import {
  formatConfidence,
  formatDateTime,
  humanizeEnum,
  safeJsonParse,
} from '@/lib/utils'
import type {
  AgentRun,
  ContextFactResult,
  GroundedContextFactResult,
  OperationalTimelineEventResult,
  SalesSupportResponse,
} from '@/lib/types'

export const featuredUserId = '123'
export const featuredObjective =
  'Book a 20-minute discovery call for enterprise rollout next week, using product momentum and pricing intent to justify urgency.'

export const executiveStorySteps = [
  { to: '/demo', label: '1. Why UCL' },
  { to: '/story/source-signals', label: '2. Legacy Signals' },
  { to: '/story/context-layer', label: '3. Semantic Timeline' },
  { to: '/story/ai-workflow', label: '4. Example Consumer Timeline' },
  { to: '/story/outcomes', label: '5. Rollout and ROI' },
] as const

export interface ExecutiveInteractionBeat {
  id: string
  occurredAtUtc: string
  sourceSystem: string
  sourceSignal: string
  semanticLift: string
  contextNow: string
  aiAdvice: string
  advisedAction: string
  result: string
  citations: string[]
  tone: 'neutral' | 'success' | 'warning' | 'accent'
}

export function formatDemoValue(fact: ContextFactResult | null) {
  if (!fact) {
    return 'Unavailable'
  }

  const parsed = safeJsonParse<unknown>(fact.valueJson, fact.valueJson)

  if (typeof parsed === 'number') {
    if (
      fact.attributeKey.toLowerCase().includes('probability') ||
      fact.attributeKey.toLowerCase().includes('risk') ||
      fact.attributeKey.toLowerCase().includes('potential') ||
      fact.attributeKey.toLowerCase().includes('readiness')
    ) {
      return `${parsed.toFixed(1)}%`
    }

    return parsed.toFixed(1)
  }

  if (typeof parsed === 'string') {
    return parsed.replaceAll('"', '')
  }

  if (Array.isArray(parsed)) {
    return parsed.join(', ')
  }

  return JSON.stringify(parsed)
}

export function getFact(facts: ContextFactResult[] | undefined, attributeKey: string) {
  return facts?.find((fact) => fact.attributeKey === attributeKey) ?? null
}

export function getTimelineSourceSystem(category: string) {
  const normalized = category.toLowerCase()

  if (normalized.includes('web')) {
    return 'Web analytics'
  }

  if (normalized.includes('support')) {
    return 'Support system'
  }

  if (normalized.includes('sales')) {
    return 'CRM activity'
  }

  if (normalized.includes('email')) {
    return 'Engagement platform'
  }

  if (normalized.includes('billing')) {
    return 'Billing system'
  }

  if (normalized.includes('product') || normalized.includes('usage')) {
    return 'Product telemetry'
  }

  return humanizeEnum(category)
}

export function getTimelineNarrative(event: OperationalTimelineEventResult) {
  const normalizedCategory = event.category.toLowerCase()
  const normalizedDescription = event.description.toLowerCase()

  if (normalizedCategory.includes('web')) {
    return {
      semanticLift: 'Raises enterprise intent and timing urgency',
      businessMeaning:
        normalizedDescription.includes('trial')
          ? 'A live trial event tells the semantic layer this is active evaluation, not passive browsing.'
          : 'Repeated pricing activity is converted into commercial intent instead of staying trapped in analytics.',
      tone: 'accent' as const,
    }
  }

  if (normalizedCategory.includes('sales')) {
    return {
      semanticLift: 'Improves conversion confidence and sales motion',
      businessMeaning:
        'Rep activity becomes a reusable signal for probability, timing, and the next best commercial move.',
      tone: 'success' as const,
    }
  }

  if (normalizedCategory.includes('support')) {
    return {
      semanticLift: 'Keeps risk visible instead of letting consumers overreach',
      businessMeaning:
        normalizedDescription.includes('resolved')
          ? 'Resolved support friction lowers drag and supports a cleaner expansion story.'
          : 'Open issues stay inside the context package so downstream systems acknowledge risk explicitly.',
      tone: 'warning' as const,
    }
  }

  if (normalizedCategory.includes('email')) {
    return {
      semanticLift: 'Reinforces preferred channel and engagement level',
      businessMeaning:
        'Engagement evidence helps the example consumer recommend contact strategy from actual response behaviour.',
      tone: 'success' as const,
    }
  }

  if (normalizedCategory.includes('billing')) {
    return {
      semanticLift: 'Shapes budget readiness and expansion potential',
      businessMeaning:
        'Billing and commercial posture become structured readiness signals that consumers can cite safely.',
      tone: 'accent' as const,
    }
  }

  return {
    semanticLift: 'Feeds reusable semantic context',
    businessMeaning:
      'UCL turns the raw event into a governed signal that the rest of the product can trust.',
    tone: 'neutral' as const,
  }
}

function parseLatestOutput(latestRun: AgentRun | null) {
  if (!latestRun) {
    return null
  }

  return safeJsonParse<SalesSupportResponse | null>(latestRun.outputJson, null)
}

function buildInteractionTimeline(
  recentTimeline: OperationalTimelineEventResult[],
  facts: ContextFactResult[],
  groundedFacts: GroundedContextFactResult[],
  latestOutput: SalesSupportResponse | null,
) {
  const conversionProbability = formatDemoValue(getFact(facts, 'conversionProbability'))
  const preferredChannel = formatDemoValue(getFact(facts, 'preferredChannel'))
  const planInterest = formatDemoValue(getFact(facts, 'planInterest'))
  const engagementLevel = formatDemoValue(getFact(facts, 'engagementLevel'))
  const churnRisk = formatDemoValue(getFact(facts, 'churnRisk'))
  const salesUrgency = formatDemoValue(getFact(facts, 'salesUrgency'))
  const expansionPotential = formatDemoValue(getFact(facts, 'expansionPotential'))
  const budgetReadiness = formatDemoValue(getFact(facts, 'budgetReadiness'))
  const recommendedSalesMotion = formatDemoValue(getFact(facts, 'recommendedSalesMotion'))
  const productFit = formatDemoValue(getFact(facts, 'productFit'))

  const firstAction =
    latestOutput?.followUpRecommendations.recommendations[0]?.action ??
    'Send the first grounded outreach'
  const secondAction =
    latestOutput?.followUpRecommendations.recommendations[1]?.action ??
    'Follow up with commercial proof'
  const strategySummary =
    latestOutput?.outreachStrategy.summary ??
    'Use the freshest enterprise-ready signals to drive outreach.'

  return [...recentTimeline]
    .slice()
    .reverse()
    .map<ExecutiveInteractionBeat>((event, index) => {
      const category = event.category.toLowerCase()
      const signalText = `${getTimelineSourceSystem(event.category)}: ${event.description}`

      if (category.includes('support') && event.description.toLowerCase().includes('resolved')) {
        return {
          id: `beat-${index}`,
          occurredAtUtc: event.occurredAtUtc,
          sourceSystem: getTimelineSourceSystem(event.category),
          sourceSignal: signalText,
          semanticLift: `Product fit stays at ${productFit} with support drag controlled rather than ignored.`,
          contextNow: 'The context layer records that implementation friction has been resolved, which keeps expansion conversations credible.',
          aiAdvice:
            'Re-open the enterprise rollout conversation, but anchor it in resolved operational trust rather than aggressive upsell language.',
          advisedAction: 'Acknowledge the resolved onboarding issue before proposing the next rollout milestone.',
          result:
            'The recommendation engine keeps the account expansion-ready instead of suppressing it because of stale support context.',
          citations: ['FACT-02', 'FACT-09'],
          tone: 'success',
        }
      }

      if (category.includes('support')) {
        return {
          id: `beat-${index}`,
          occurredAtUtc: event.occurredAtUtc,
          sourceSystem: getTimelineSourceSystem(event.category),
          sourceSignal: signalText,
          semanticLift: `Churn risk remains visible at ${churnRisk} and any recommendation must acknowledge friction.`,
          contextNow:
            'Open support issues stay attached to the same account profile, so the consumer sees operational risk instead of assuming a clean sales motion.',
          aiAdvice:
            'Pause any overconfident enterprise push, acknowledge the support issue, and keep a human review posture until the account is stable.',
          advisedAction:
            'Frame the next rep touch as a value and implementation conversation rather than a hard commercial close.',
          result:
            'The product keeps the recommendation honest. The account is still live, but the recommendation is guarded instead of blindly optimistic.',
          citations: ['FACT-02', 'FACT-13'],
          tone: 'warning',
        }
      }

      if (category.includes('sales')) {
        return {
          id: `beat-${index}`,
          occurredAtUtc: event.occurredAtUtc,
          sourceSystem: getTimelineSourceSystem(event.category),
          sourceSignal: signalText,
          semanticLift: `Conversion probability rises to ${conversionProbability} and the motion becomes ${humanizeEnum(recommendedSalesMotion)}.`,
          contextNow:
            'Rep activity is no longer isolated in CRM history. It directly strengthens the commercial read on timing, probability, and motion.',
          aiAdvice: strategySummary,
          advisedAction: secondAction,
          result:
            'The account stays in the high-priority enterprise queue, and the rep gets a grounded reason to keep pushing now rather than later.',
          citations: ['FACT-03', 'FACT-11', 'FACT-13'],
          tone: 'success',
        }
      }

      if (category.includes('web') && event.description.toLowerCase().includes('trial')) {
        return {
          id: `beat-${index}`,
          occurredAtUtc: event.occurredAtUtc,
          sourceSystem: getTimelineSourceSystem(event.category),
          sourceSignal: signalText,
          semanticLift: `Sales urgency locks at ${salesUrgency} and plan interest is reinforced as ${planInterest}.`,
          contextNow:
            'A fresh trial activation becomes a timing signal the rest of the product can reuse, not just another event in a web stream.',
          aiAdvice:
            'Treat this as active evaluation. Reach out within 24 hours with an enterprise rollout angle while product momentum is fresh.',
          advisedAction: firstAction,
          result:
            'The recommendation engine moves the account into an immediate outreach window instead of letting the signal decay unseen.',
          citations: ['FACT-07', 'FACT-12'],
          tone: 'accent',
        }
      }

      if (category.includes('web')) {
        return {
          id: `beat-${index}`,
          occurredAtUtc: event.occurredAtUtc,
          sourceSystem: getTimelineSourceSystem(event.category),
          sourceSignal: signalText,
          semanticLift: `Enterprise intent is reinforced, budget readiness reaches ${budgetReadiness}, and the consumer has a reason to lead with ROI.`,
          contextNow:
            'Pricing behaviour becomes a commercial readiness signal that the sales support consumer can cite directly instead of guessing from generic firmographics.',
          aiAdvice:
            'Lead with business impact and rollout value, not a product tour. The pricing signal suggests the buyer is already thinking commercially.',
          advisedAction:
            'Use a short email-first outreach with a specific enterprise value proposition and a scheduling CTA.',
          result:
            `Preferred channel stays ${preferredChannel}, engagement stays ${engagementLevel}, and the account looks increasingly expansion-ready at ${expansionPotential}.`,
          citations: ['FACT-01', 'FACT-05', 'FACT-07', 'FACT-08'],
          tone: 'accent',
        }
      }

      return {
        id: `beat-${index}`,
        occurredAtUtc: event.occurredAtUtc,
        sourceSystem: getTimelineSourceSystem(event.category),
        sourceSignal: signalText,
        semanticLift: 'This event was normalised into the shared account context.',
        contextNow:
          'The product can now reuse the same commercial interpretation across workflows instead of rebuilding logic per feature.',
        aiAdvice:
          'Use the latest grounded context package, cite the relevant facts, and avoid inventing details outside the evidence.',
        advisedAction: 'Continue with the grounded outreach sequence.',
        result: `The example consumer sees ${groundedFacts.length} cited facts instead of a raw user identifier.`,
        citations: groundedFacts.slice(0, 2).map((fact) => fact.citationId),
        tone: 'neutral',
      }
    })
}

export function useExecutiveDemoData() {
  const { session } = useAuthSession()
  const tenantSlug = session?.tenantSlug ?? 'demo'
  const isAdmin = session?.role === 'tenant_admin'

  const usersQuery = useQuery({
    queryKey: ['demo-users', tenantSlug],
    queryFn: () => api.getUserProfiles(tenantSlug),
    enabled: Boolean(session),
    placeholderData: (previousData) => previousData,
  })

  const featuredUser =
    usersQuery.data?.find((user) => user.externalUserId === featuredUserId) ?? usersQuery.data?.[0] ?? null

  const activeUserId = featuredUser?.externalUserId ?? featuredUserId

  const contextQuery = useQuery({
    queryKey: ['demo-context', tenantSlug, activeUserId],
    queryFn: () =>
      api.getUserContext({
        tenantSlug,
        externalUserId: activeUserId,
      }),
    enabled: Boolean(session && activeUserId),
    placeholderData: (previousData) => previousData,
  })

  const salesPackageQuery = useQuery({
    queryKey: ['demo-package', tenantSlug, activeUserId],
    queryFn: () =>
      api.getSalesContextPackage({
        tenantSlug,
        externalUserId: activeUserId,
        salesObjective: featuredObjective,
      }),
    enabled: Boolean(session && activeUserId),
    placeholderData: (previousData) => previousData,
  })

  const latestRunQuery = useQuery({
    queryKey: ['demo-agent-runs', tenantSlug, activeUserId],
    queryFn: async () => {
      const runs = await api.getAgentRuns(tenantSlug, activeUserId)
      return runs[0] ?? null
    },
    enabled: Boolean(session && activeUserId),
    placeholderData: (previousData) => previousData,
  })

  const dataSourcesQuery = useQuery({
    queryKey: ['demo-data-sources', tenantSlug],
    queryFn: () => api.getDataSources(tenantSlug),
    enabled: Boolean(session),
    placeholderData: (previousData) => previousData,
  })

  const selectorsQuery = useQuery({
    queryKey: ['demo-selectors', tenantSlug],
    queryFn: () => api.getSelectors(tenantSlug),
    enabled: Boolean(session),
    placeholderData: (previousData) => previousData,
  })

  const semanticAttributesQuery = useQuery({
    queryKey: ['demo-semantic-attributes', tenantSlug],
    queryFn: () => api.getSemanticAttributes(tenantSlug),
    enabled: Boolean(session),
    placeholderData: (previousData) => previousData,
  })

  const featuredFacts = useMemo(() => {
    const facts = contextQuery.data?.facts ?? []

    return [
      {
        key: 'conversionProbability',
        label: 'Conversion probability',
        value: formatDemoValue(getFact(facts, 'conversionProbability')),
        explanation: getFact(facts, 'conversionProbability')?.explanation ?? 'Waiting for signal resolution.',
      },
      {
        key: 'preferredChannel',
        label: 'Preferred channel',
        value: formatDemoValue(getFact(facts, 'preferredChannel')),
        explanation: getFact(facts, 'preferredChannel')?.explanation ?? 'Waiting for channel evidence.',
      },
      {
        key: 'planInterest',
        label: 'Plan interest',
        value: formatDemoValue(getFact(facts, 'planInterest')),
        explanation: getFact(facts, 'planInterest')?.explanation ?? 'Waiting for commercial demand signals.',
      },
      {
        key: 'expansionPotential',
        label: 'Expansion potential',
        value: formatDemoValue(getFact(facts, 'expansionPotential')),
        explanation: getFact(facts, 'expansionPotential')?.explanation ?? 'Waiting for usage and revenue signals.',
      },
    ]
  }, [contextQuery.data?.facts])

  const latestOutput = useMemo(() => parseLatestOutput(latestRunQuery.data ?? null), [latestRunQuery.data])
  const publishedSelectors = useMemo(
    () => selectorsQuery.data?.filter((selector) => selector.status === 'PUBLISHED') ?? [],
    [selectorsQuery.data],
  )
  const recentTimeline = useMemo(
    () => contextQuery.data?.sourceSummary?.recentTimeline ?? [],
    [contextQuery.data?.sourceSummary?.recentTimeline],
  )
  const groundedFacts = useMemo(
    () => salesPackageQuery.data?.facts ?? [],
    [salesPackageQuery.data?.facts],
  )
  const interactionTimeline = useMemo(
    () => buildInteractionTimeline(recentTimeline, contextQuery.data?.facts ?? [], groundedFacts, latestOutput),
    [contextQuery.data?.facts, groundedFacts, latestOutput, recentTimeline],
  )

  const statHighlights = useMemo(() => {
    const uniqueSystems = new Set(recentTimeline.map((event) => getTimelineSourceSystem(event.category))).size
    const activeConnectors =
      dataSourcesQuery.data?.filter((source) => source.status === 'ACTIVE').length ?? 0

    return [
      {
        label: 'Operational systems',
        value: String(Math.max(uniqueSystems, activeConnectors || 0)),
        body: 'Legacy systems contributing meaningful signals without forcing replatforming.',
      },
      {
        label: 'Resolved semantic facts',
        value: String(contextQuery.data?.facts.length ?? 0),
        body: 'Reusable business facts available to product workflows, analytics, copilots, and agents.',
      },
      {
        label: 'Citations',
        value: String(groundedFacts.length),
        body: 'Evidence-backed facts sent to the model with confidence and freshness metadata.',
      },
      {
        label: 'Snapshot confidence',
        value: formatConfidence(contextQuery.data?.overallConfidence),
        body: 'Overall trust level of the current business-aware customer brief.',
      },
    ]
  }, [contextQuery.data?.facts.length, contextQuery.data?.overallConfidence, dataSourcesQuery.data, groundedFacts.length, recentTimeline])

  return {
    session,
    tenantSlug,
    isAdmin,
    featuredUser,
    contextQuery,
    salesPackageQuery,
    latestRunQuery,
    dataSourcesQuery,
    selectorsQuery,
    semanticAttributesQuery,
    publishedSelectors,
    featuredFacts,
    recentTimeline,
    groundedFacts,
    interactionTimeline,
    latestOutput,
    statHighlights,
    activeUserId,
  }
}

export function factCitationLabel(factKey: string, groundedFacts: GroundedContextFactResult[]) {
  return groundedFacts.find((fact) => fact.attributeKey === factKey)?.citationId ?? 'FACT'
}

export function shortTimeLabel(occurredAtUtc: string) {
  return formatDateTime(occurredAtUtc)
}
