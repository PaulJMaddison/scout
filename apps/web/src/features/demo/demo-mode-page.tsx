import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Database,
  FileSearch,
  MailCheck,
  Radar,
  Shapes,
  Sparkles,
  Target,
  TrendingUp,
  Waypoints,
  Workflow,
} from 'lucide-react'
import { Badge, Button, Card, MetricCard, PageHeader, Panel } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import {
  formatConfidence,
  formatDateTime,
  formatRelativeMinutes,
  humanizeEnum,
  safeJsonParse,
} from '@/lib/utils'
import type {
  AgentRun,
  ContextFactResult,
  OperationalTimelineEventResult,
} from '@/lib/types'

const featuredUserId = '123'
const featuredObjective =
  'Book a 20-minute discovery call for enterprise rollout next week, using product momentum and pricing intent to justify urgency.'

function formatDemoValue(fact: ContextFactResult | null) {
  if (!fact) {
    return 'Unavailable'
  }

  const parsed = safeJsonParse<unknown>(fact.valueJson, fact.valueJson)

  if (typeof parsed === 'number') {
    if (
      fact.attributeKey.toLowerCase().includes('probability') ||
      fact.attributeKey.toLowerCase().includes('risk')
    ) {
      return `${parsed.toFixed(1)}%`
    }

    if (
      fact.attributeKey.toLowerCase().includes('potential') ||
      fact.attributeKey.toLowerCase().includes('readiness')
    ) {
      return `${parsed.toFixed(0)}%`
    }

    return parsed.toFixed(1)
  }

  if (typeof parsed === 'string') {
    return parsed
  }

  if (Array.isArray(parsed)) {
    return parsed.join(', ')
  }

  return JSON.stringify(parsed)
}

function getFact(facts: ContextFactResult[] | undefined, attributeKey: string) {
  return facts?.find((fact) => fact.attributeKey === attributeKey) ?? null
}

function parseLatestOutput(latestRun: AgentRun | null) {
  if (!latestRun) {
    return null
  }

  return safeJsonParse<{
    outreachStrategy?: { summary?: string; keyTalkingPoints?: Array<{ text: string; citations: string[] }> }
    personalizedEmailDraft?: { subjectLine?: string; previewText?: string }
    followUpRecommendations?: { recommendations?: Array<{ action?: string; rationale?: string; citations?: string[] }> }
  } | null>(latestRun.outputJson, null)
}

function getTimelineSourceSystem(category: string) {
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

function getTimelineNarrative(event: OperationalTimelineEventResult) {
  const normalizedCategory = event.category.toLowerCase()
  const normalizedDescription = event.description.toLowerCase()

  if (normalizedCategory.includes('web')) {
    return {
      semanticLift: 'Raises enterprise intent and timing urgency',
      businessMeaning:
        normalizedDescription.includes('trial')
          ? 'A fresh trial event tells the context layer this is active evaluation, not just passive browsing.'
          : 'Repeated pricing interactions strengthen plan interest and push the account higher in the queue.',
      tone: 'accent' as const,
    }
  }

  if (normalizedCategory.includes('sales')) {
    return {
      semanticLift: 'Improves conversion confidence and recommended sales motion',
      businessMeaning:
        'Recorded rep momentum becomes a reusable signal for probability, urgency, and the next best enterprise conversation.',
      tone: 'success' as const,
    }
  }

  if (normalizedCategory.includes('support')) {
    return {
      semanticLift: 'Feeds risk, confidence, and review guardrails',
      businessMeaning:
        normalizedDescription.includes('resolved')
          ? 'Resolved support friction reduces downside risk and supports a cleaner expansion motion.'
          : 'An open issue introduces caution so AI can acknowledge risk instead of overconfidently pushing outreach.',
      tone: 'warning' as const,
    }
  }

  if (normalizedCategory.includes('email')) {
    return {
      semanticLift: 'Reinforces preferred channel and engagement level',
      businessMeaning:
        'Engagement evidence helps the model choose contact strategy based on actual responsiveness rather than guesswork.',
      tone: 'success' as const,
    }
  }

  if (normalizedCategory.includes('billing')) {
    return {
      semanticLift: 'Shapes budget readiness and expansion potential',
      businessMeaning:
        'Billing strength gives the semantic layer a grounded commercial read on readiness to move upmarket.',
      tone: 'accent' as const,
    }
  }

  return {
    semanticLift: 'Feeds reusable semantic context',
    businessMeaning:
      'Context Layer turns the raw event into a governed signal that can be reused safely by downstream AI features.',
    tone: 'neutral' as const,
  }
}

function ExecutiveStat({
  label,
  value,
  body,
}: {
  label: string
  value: string
  body: string
}) {
  return (
    <Card className="bg-ivory-50/94">
      <p className="text-xs uppercase tracking-[0.18em] text-sage-700">{label}</p>
      <p className="mt-3 font-display text-4xl text-ink-950">{value}</p>
      <p className="mt-3 text-sm leading-7 text-ink-700">{body}</p>
    </Card>
  )
}

export function DemoModePage() {
  const { session } = useAuthSession()
  const tenantSlug = session?.tenantSlug ?? 'demo'
  const isAdmin = session?.role === 'tenant_admin'

  const usersQuery = useQuery({
    queryKey: ['demo-users', tenantSlug],
    queryFn: () => api.getUserProfiles(tenantSlug),
    enabled: Boolean(session),
  })

  const featuredUser =
    usersQuery.data?.find((user) => user.externalUserId === featuredUserId) ?? usersQuery.data?.[0] ?? null

  const contextQuery = useQuery({
    queryKey: ['demo-context', tenantSlug, featuredUser?.externalUserId ?? featuredUserId],
    queryFn: () =>
      api.getUserContext({
        tenantSlug,
        externalUserId: featuredUser?.externalUserId ?? featuredUserId,
      }),
    enabled: Boolean(session && (featuredUser?.externalUserId ?? featuredUserId)),
  })

  const salesPackageQuery = useQuery({
    queryKey: ['demo-package', tenantSlug, featuredUser?.externalUserId ?? featuredUserId],
    queryFn: () =>
      api.getSalesContextPackage({
        tenantSlug,
        externalUserId: featuredUser?.externalUserId ?? featuredUserId,
        salesObjective: featuredObjective,
      }),
    enabled: Boolean(session && (featuredUser?.externalUserId ?? featuredUserId)),
  })

  const latestRunQuery = useQuery({
    queryKey: ['demo-agent-runs', tenantSlug, featuredUser?.externalUserId ?? featuredUserId],
    queryFn: async () => {
      const runs = await api.getAgentRuns(tenantSlug, featuredUser?.externalUserId ?? featuredUserId)
      return runs[0] ?? null
    },
    enabled: Boolean(session && (featuredUser?.externalUserId ?? featuredUserId)),
  })

  const dataSourcesQuery = useQuery({
    queryKey: ['demo-data-sources', tenantSlug],
    queryFn: () => api.getDataSources(tenantSlug),
    enabled: Boolean(session && isAdmin),
  })

  const selectorsQuery = useQuery({
    queryKey: ['demo-selectors', tenantSlug],
    queryFn: () => api.getSelectors(tenantSlug),
    enabled: Boolean(session && isAdmin),
  })

  const semanticAttributesQuery = useQuery({
    queryKey: ['demo-semantic-attributes', tenantSlug],
    queryFn: () => api.getSemanticAttributes(tenantSlug),
    enabled: Boolean(session),
  })

  const featuredFacts = useMemo(() => {
    const facts = contextQuery.data?.facts ?? []
    return [
      {
        key: 'conversionProbability',
        label: 'Conversion probability',
        prompt: 'Should this account be prioritized now?',
        fact: getFact(facts, 'conversionProbability'),
        accent: 'copper' as const,
      },
      {
        key: 'preferredChannel',
        label: 'Preferred channel',
        prompt: 'How should sales actually make first contact?',
        fact: getFact(facts, 'preferredChannel'),
        accent: 'sage' as const,
      },
      {
        key: 'planInterest',
        label: 'Plan interest',
        prompt: 'What commercial motion fits the buyer today?',
        fact: getFact(facts, 'planInterest'),
        accent: 'gold' as const,
      },
      {
        key: 'expansionPotential',
        label: 'Expansion potential',
        prompt: 'Is this customer worth an enterprise push?',
        fact: getFact(facts, 'expansionPotential'),
        accent: 'copper' as const,
      },
    ]
  }, [contextQuery.data?.facts])

  const latestOutput = parseLatestOutput(latestRunQuery.data ?? null)
  const publishedSelectors =
    selectorsQuery.data?.filter((selector) => selector.status === 'PUBLISHED') ?? []
  const semanticAttributes = semanticAttributesQuery.data ?? []
  const activeConnectors =
    dataSourcesQuery.data?.filter((source) => source.status === 'ACTIVE').length ?? 0
  const recentTimeline = contextQuery.data?.sourceSummary?.recentTimeline ?? []
  const uniqueSystems = new Set(recentTimeline.map((event) => getTimelineSourceSystem(event.category))).size
  const stats = [
    {
      label: 'Systems reconciled',
      value: String(Math.max(uniqueSystems, activeConnectors || 0)),
      footnote: 'Operational systems contributing meaningful commercial signals to this profile.',
      accent: 'copper' as const,
    },
    {
      label: 'Timeline signals',
      value: String(recentTimeline.length),
      footnote: 'Recent cross-system events that now carry semantic interpretation instead of staying siloed.',
      accent: 'sage' as const,
    },
    {
      label: 'Grounded facts',
      value: String(contextQuery.data?.facts.length ?? 0),
      footnote: 'Reusable semantic attributes now available to product workflows and AI orchestration.',
      accent: 'gold' as const,
    },
    {
      label: 'Citations for AI',
      value: String(salesPackageQuery.data?.facts.length ?? 0),
      footnote: 'Evidence-backed facts available to the model so recommendations stay grounded.',
      accent: 'copper' as const,
    },
  ]

  if (!session) {
    return null
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Executive walkthrough"
        title="Show how legacy customer data becomes grounded AI context"
        description="This page is designed for a cold executive audience. It starts with fragmented operational signals, shows how Context Layer interprets them into shared business meaning, and ends with explainable AI action."
        actions={
          <>
            <Link
              to="/customers/$externalUserId"
              params={{ externalUserId: featuredUser?.externalUserId ?? featuredUserId }}
            >
              <Button variant="secondary">
                Open full 360 profile
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <Link to="/agent-playground">
              <Button>
                Run grounded AI demo
                <Sparkles className="ml-2 size-4" />
              </Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
        <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,rgba(220,180,145,0.18),transparent_28%),linear-gradient(135deg,#16110d_0%,#1f1712_45%,#2e2118_100%)] px-8 py-8 text-ivory-50 shadow-[0_28px_80px_rgba(24,18,15,0.28)]">
          <div className="grid gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">customer_ops_db</Badge>
              <ArrowRight className="size-4 text-copper-300" />
              <Badge tone="neutral">Context Layer selectors</Badge>
              <ArrowRight className="size-4 text-copper-300" />
              <Badge tone="success">AI-ready semantic profile</Badge>
            </div>

            <div className="grid gap-4">
              <p className="text-xs uppercase tracking-[0.22em] text-copper-300">Featured story</p>
              <h2 className="max-w-4xl font-display text-5xl leading-[1.02] text-ivory-50">
                {contextQuery.data?.fullName ?? featuredUser?.fullName ?? 'Loading customer'} turns from
                a raw CRM identity into a reusable commercial brief.
              </h2>
              <p className="max-w-3xl text-base leading-8 text-ivory-200">
                Instead of sending “User {featuredUser?.externalUserId ?? featuredUserId}” into an AI workflow,
                Context Layer assembles behavioral, revenue, support, and pipeline signals into one grounded
                profile with confidence, freshness, and provenance.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-copper-300">Raw operational identity</p>
                <p className="mt-3 text-lg font-semibold text-ivory-50">
                  User {featuredUser?.externalUserId ?? featuredUserId}
                </p>
                <p className="mt-2 text-sm leading-7 text-ivory-200">
                  Fragmented across CRM, web events, support, product usage, and billing systems.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-copper-300">Universal Context Layer</p>
                <p className="mt-3 text-lg font-semibold text-ivory-50">
                  {publishedSelectors.length || 'Live'} selector rules
                </p>
                <p className="mt-2 text-sm leading-7 text-ivory-200">
                  Admin-defined logic turns raw source signals into canonical business facts in `context_layer_db`.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-copper-300">AI outcome</p>
                <p className="mt-3 text-lg font-semibold text-ivory-50">
                  {salesPackageQuery.data ? `${salesPackageQuery.data.facts.length} cited facts` : 'Grounded payload'}
                </p>
                <p className="mt-2 text-sm leading-7 text-ivory-200">
                  The model gets a structured brief it can cite, qualify, and safely turn into sales actions.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="bg-[radial-gradient(circle_at_top_right,rgba(175,92,43,0.12),transparent_26%),linear-gradient(180deg,rgba(255,248,240,0.96),rgba(252,246,239,0.96))]">
            <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Why this account matters</p>
            <h3 className="mt-3 font-display text-4xl text-ink-950">
              {contextQuery.data?.companyName ?? featuredUser?.companyName ?? 'Loading account'}
            </h3>
            <p className="mt-3 text-sm leading-7 text-ink-700">
              {contextQuery.data?.summary ??
                'Loading the current grounded summary for the featured enterprise expansion story.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge tone="accent">
                {contextQuery.data ? formatConfidence(contextQuery.data.overallConfidence) : 'Loading'}
              </Badge>
              <Badge tone={contextQuery.data?.isStale ? 'warning' : 'success'}>
                {contextQuery.data?.isStale ? 'Signals need refresh' : 'Fresh snapshot'}
              </Badge>
              <Badge tone="neutral">
                {contextQuery.data?.sourceSummary?.activePlanName ?? 'Plan loading'}
              </Badge>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <ExecutiveStat
              label="Enterprise intent"
              value={String(contextQuery.data?.sourceSummary?.pricingPageVisits30d ?? 0)}
              body="Pricing-page revisits are being interpreted as commercial interest instead of sitting unused in web analytics."
            />
            <ExecutiveStat
              label="Revenue motion"
              value={String(contextQuery.data?.sourceSummary?.openOpportunities ?? 0)}
              body="Open opportunity context is already reconciled into the semantic layer, so AI can prioritize active motions."
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {stats.map((item) => (
          <MetricCard
            key={item.label}
            label={item.label}
            value={item.value}
            footnote={item.footnote}
            accent={item.accent}
          />
        ))}
      </section>

      <section className="grid gap-4 2xl:grid-cols-[0.85fr_1fr_0.9fr]">
        <Panel eyebrow="Before UCL" title="What the legacy estate knows">
          <div className="grid gap-3">
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Database className="mt-1 size-5 text-copper-700" />
                <div>
                  <p className="font-semibold text-ink-950">Fragmented raw identifiers</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    CRM sees a contact record, web analytics sees page events, support sees tickets, and billing sees plan activity.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-ivory-25">
              <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Source-of-truth snapshot</p>
              <div className="mt-4 grid gap-3 text-sm text-ink-700">
                <div className="flex items-center justify-between gap-4">
                  <span>Operational ID</span>
                  <span className="font-semibold text-ink-950">User {featuredUser?.externalUserId ?? featuredUserId}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Account</span>
                  <span className="font-semibold text-ink-950">{contextQuery.data?.sourceSummary?.accountName ?? 'Loading'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Plan</span>
                  <span className="font-semibold text-ink-950">{contextQuery.data?.sourceSummary?.activePlanName ?? 'Loading'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Pricing visits (30d)</span>
                  <span className="font-semibold text-ink-950">{contextQuery.data?.sourceSummary?.pricingPageVisits30d ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Open support tickets</span>
                  <span className="font-semibold text-ink-950">{contextQuery.data?.sourceSummary?.openSupportTickets ?? '—'}</span>
                </div>
              </div>
            </Card>

            <Card className="bg-rosewood-500/8">
              <p className="font-semibold text-ink-950">Without a context layer, AI has to guess.</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                A model can see the fragments, but it cannot reliably infer commercial meaning like “enterprise-ready, email-first, expansion-worthy” without governed semantic lift.
              </p>
            </Card>
          </div>
        </Panel>

        <Panel eyebrow="Inside Context Layer" title="How raw signals become business meaning">
          <div className="grid gap-4">
            <Card className="bg-ink-950 text-ivory-50">
              <div className="flex items-start gap-3">
                <Shapes className="mt-1 size-5 text-copper-300" />
                <div>
                  <p className="font-semibold text-ivory-50">Selector-driven semantic lift</p>
                  <p className="mt-2 text-sm leading-7 text-ivory-200">
                    Each attribute below was created by selectors that pull operational data, normalize it, score confidence, and persist a canonical fact with provenance.
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid gap-3 md:grid-cols-2">
              {featuredFacts.map((item) => (
                <Card key={item.key} className="bg-ivory-25">
                  <p className="text-xs uppercase tracking-[0.18em] text-sage-700">{item.prompt}</p>
                  <div className="mt-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl text-ink-950">{item.label}</p>
                      <p className="mt-2 text-4xl font-display text-ink-950">{formatDemoValue(item.fact)}</p>
                    </div>
                    <Badge tone={item.fact?.confidence && item.fact.confidence >= 0.85 ? 'success' : 'warning'}>
                      {item.fact ? formatConfidence(item.fact.confidence) : 'No data'}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-ink-700">
                    {item.fact?.explanation ?? 'No semantic fact available yet.'}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </Panel>

        <Panel eyebrow="AI with context" title="What the model can safely do">
          <div className="grid gap-3">
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Bot className="mt-1 size-5 text-gold-700" />
                <div>
                  <p className="font-semibold text-ink-950">Grounded recommendation</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    {latestOutput?.outreachStrategy?.summary ??
                      'Open the agent playground to generate the latest recommendation from the grounded package.'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <MailCheck className="mt-1 size-5 text-sage-700" />
                <div>
                  <p className="font-semibold text-ink-950">Personalized outreach</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    {latestOutput?.personalizedEmailDraft?.subjectLine ??
                      'The model can draft an email once it has the grounded context package.'}
                  </p>
                  {latestOutput?.personalizedEmailDraft?.previewText ? (
                    <p className="mt-2 text-sm leading-7 text-ink-600">
                      {latestOutput.personalizedEmailDraft.previewText}
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>

            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Target className="mt-1 size-5 text-copper-700" />
                <div>
                  <p className="font-semibold text-ink-950">Next action with citations</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    {latestOutput?.followUpRecommendations?.recommendations?.[0]?.action ??
                      'Follow-up guidance appears here once a run exists.'}
                  </p>
                  {latestOutput?.followUpRecommendations?.recommendations?.[0]?.citations?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {latestOutput.followUpRecommendations.recommendations[0].citations.map((citation) => (
                        <Badge key={citation} tone="accent">
                          {citation}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <Panel eyebrow="Cross-system timeline" title="How fragmented events become reusable context">
          {recentTimeline.length ? (
            <div className="grid gap-4">
              <Card className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <Workflow className="mt-1 size-5 text-copper-700" />
                  <div>
                    <p className="font-semibold text-ink-950">This is the missing narrative layer</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">
                      The left side of the business already emits these events. Context Layer makes them intelligible to software by attaching business meaning, confidence, freshness, and provenance before AI ever sees them.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="relative grid gap-4 pl-8">
                <div className="absolute bottom-2 left-3 top-3 w-px bg-copper-200" />
                {recentTimeline.map((event, index) => {
                  const narrative = getTimelineNarrative(event)
                  return (
                    <div key={`${event.occurredAtUtc}-${index}`} className="relative">
                      <div className="absolute -left-[31px] top-7 size-4 rounded-full border-4 border-ivory-100 bg-copper-500 shadow-sm" />
                      <Card className="bg-ivory-25">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap gap-2">
                            <Badge tone="neutral">{getTimelineSourceSystem(event.category)}</Badge>
                            <Badge tone={narrative.tone}>{humanizeEnum(event.category)}</Badge>
                          </div>
                          <p className="text-xs uppercase tracking-[0.18em] text-ink-500">
                            {formatRelativeMinutes(event.occurredAtUtc)}
                          </p>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-start">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Raw event</p>
                            <p className="mt-2 text-sm leading-7 text-ink-800">{event.description}</p>
                          </div>
                          <div className="flex items-center justify-center text-copper-600">
                            <Waypoints className="size-5" />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Semantic lift</p>
                            <p className="mt-2 font-semibold text-ink-950">{narrative.semanticLift}</p>
                            <p className="mt-2 text-sm leading-7 text-ink-700">{narrative.businessMeaning}</p>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <Card className="bg-ivory-25">Loading the event timeline from `customer_ops_db`…</Card>
          )}
        </Panel>

        <Panel eyebrow="Commercial outcome" title="Why this creates ROI">
          <div className="grid gap-3">
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <TrendingUp className="mt-1 size-5 text-copper-700" />
                <div>
                  <p className="font-semibold text-ink-950">Sharper prioritization</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    Pricing visits, trial activation, sales momentum, and product engagement are already reconciled into one account-level opportunity read.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <BriefcaseBusiness className="mt-1 size-5 text-sage-700" />
                <div>
                  <p className="font-semibold text-ink-950">Faster rep preparation</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    Reps no longer need to hop between CRM, support, usage, and billing tabs. The semantic layer gives them one grounded customer brief.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Radar className="mt-1 size-5 text-gold-700" />
                <div>
                  <p className="font-semibold text-ink-950">Safer AI behavior</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    The recommendation is anchored to {salesPackageQuery.data?.facts.length ?? 0} cited facts, carries {formatConfidence(contextQuery.data?.overallConfidence)} overall confidence, and can flag weak signals for review.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-ink-950 text-ivory-50">
              <p className="text-xs uppercase tracking-[0.18em] text-copper-300">What to say out loud</p>
              <p className="mt-3 text-base leading-8 text-ivory-100">
                “We are not replacing legacy systems. We are making them intelligible to AI by creating one semantic context layer the rest of the product can trust.”
              </p>
            </Card>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[0.92fr_1.08fr]">
        <Panel eyebrow="AI-assisted onboarding" title="How AI can bootstrap the Universal Context Layer">
          <div className="grid gap-4">
            <Card className="bg-ink-950 text-ivory-50">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 size-5 text-copper-300" />
                <div>
                  <p className="font-semibold text-ivory-50">Use AI to accelerate semantic design, not replace governance</p>
                  <p className="mt-2 text-sm leading-7 text-ivory-200">
                    Tools like Codex or Claude can inspect schemas, CRM exports, representative samples, KPI definitions,
                    and documentation to generate a structured discovery report. Context Layer can then turn that report
                    into reviewable selectors, attributes, and rollout recommendations.
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid gap-3 md:grid-cols-2">
              <Card className="bg-ivory-25">
                <p className="text-xs uppercase tracking-[0.18em] text-sage-700">What AI reviews</p>
                <div className="mt-4 grid gap-3 text-sm text-ink-700">
                  <div className="flex items-start gap-3">
                    <Database className="mt-0.5 size-4 text-copper-700" />
                    <span>Database schemas, table names, and field semantics from operational systems</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <BriefcaseBusiness className="mt-0.5 size-4 text-sage-700" />
                    <span>CRM entities, opportunity stages, rep notes, lifecycle definitions, and account taxonomies</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Workflow className="mt-0.5 size-4 text-gold-700" />
                    <span>Usage metrics, support patterns, billing signals, and web conversion events across the customer journey</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-ivory-25">
                <p className="text-xs uppercase tracking-[0.18em] text-sage-700">What AI produces</p>
                <div className="mt-4 grid gap-3 text-sm text-ink-700">
                  <div className="flex items-start gap-3">
                    <FileSearch className="mt-0.5 size-4 text-copper-700" />
                    <span>A structured discovery report with candidate business entities and relationships</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shapes className="mt-0.5 size-4 text-sage-700" />
                    <span>Draft semantic attributes and selector logic the admin can approve, edit, or reject</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Radar className="mt-0.5 size-4 text-gold-700" />
                    <span>Data quality flags, confidence notes, and rollout risks before anything reaches production AI</span>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="bg-ivory-25">
              <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Why this sings for buyers</p>
              <p className="mt-3 text-sm leading-7 text-ink-700">
                Instead of asking a prospect to spend months hand-modeling every legacy system, you can show how AI shortens
                the onboarding curve: it drafts the context blueprint, Context Layer operationalizes it, and humans keep the
                final approval over what becomes production semantic truth.
              </p>
            </Card>
          </div>
        </Panel>

        <Panel eyebrow="Generated blueprint" title="Example AI discovery report feeding UCL">
          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-3">
              <ExecutiveStat
                label="Detected source domains"
                value={String(Math.max(activeConnectors, uniqueSystems || 0))}
                body="The discovery report groups raw operational systems into coherent commercial domains before selector authoring begins."
              />
              <ExecutiveStat
                label="Candidate semantic attributes"
                value={String(semanticAttributes.length || 0)}
                body="AI can draft a proposed business vocabulary that admins refine before it becomes the reusable semantic contract."
              />
              <ExecutiveStat
                label="Draft selector patterns"
                value={String(publishedSelectors.length || 0)}
                body="Suggested mappings, formulas, and scoring rules can be turned into governed selectors rather than bespoke one-off prompts."
              />
            </div>

            <Card className="bg-ivory-25">
              <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Example discovery report</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="grid gap-3">
                  <div>
                    <p className="font-semibold text-ink-950">Recommended canonical entities</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">
                      Account, Person, Subscription, Opportunity, Support Case, Usage Window, Billing Health, and Web Intent.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-ink-950">Draft business questions to operationalize</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">
                      Which accounts are expansion-ready? Who prefers email over meetings? Which support issues should weaken AI confidence? Which usage patterns indicate enterprise fit?
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-ink-950">Suggested rollout sequence</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">
                      1. Inventory schemas and CRM objects. 2. Draft semantic attributes. 3. Generate selectors. 4. Review confidence and masking. 5. Publish AI-safe context packages.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div>
                    <p className="font-semibold text-ink-950">Sample data quality warnings</p>
                    <div className="mt-2 grid gap-2">
                      <Badge tone="warning" className="justify-start">
                        Support severity labels vary across legacy ticket exports and need normalization.
                      </Badge>
                      <Badge tone="warning" className="justify-start">
                        Opportunity owners are missing on a subset of CRM records, which may weaken decision-maker confidence.
                      </Badge>
                      <Badge tone="accent" className="justify-start">
                        Pricing-page activity is strong enough to recommend an enterprise-intent selector immediately.
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-ink-950">Human approval checkpoint</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">
                      Nothing becomes production semantic truth automatically. The report is structured input into UCL, and admins still approve attributes, selectors, provenance rules, and masking policy.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel eyebrow="Live semantic payload" title="What the model will actually see">
          <div className="grid gap-3">
            {(salesPackageQuery.data?.facts ?? []).slice(0, 5).map((fact) => (
              <Card key={fact.factId} className="bg-ivory-25">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-sage-700">{fact.citationId}</p>
                    <p className="mt-2 font-semibold text-ink-950">{fact.displayName}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={fact.isLowConfidence ? 'warning' : 'success'}>
                      {formatConfidence(fact.confidence)}
                    </Badge>
                    <Badge tone={fact.isFresh ? 'accent' : 'warning'}>
                      {fact.isFresh ? 'Fresh' : 'Stale'}
                    </Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-ink-700">{fact.explanation}</p>
              </Card>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Best proof points"
          title="Open the strongest supporting screens"
          action={
            latestRunQuery.data ? (
              <Badge tone="success">Latest AI run {formatDateTime(latestRunQuery.data.requestedAtUtc)}</Badge>
            ) : null
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Link
              to="/customers/$externalUserId"
              params={{ externalUserId: featuredUser?.externalUserId ?? featuredUserId }}
            >
              <Card className="h-full bg-ivory-25 transition hover:border-copper-300">
                <QuickLinkTitle
                  title="Customer context viewer"
                  body="Drill into the full 360 profile, snapshot history, provenance, and operational summary."
                />
              </Card>
            </Link>

            <Link to="/agent-playground">
              <Card className="h-full bg-ivory-25 transition hover:border-copper-300">
                <QuickLinkTitle
                  title="AI sales playground"
                  body="Show the recommendation, email draft, and follow-up action that the grounded package enables."
                />
              </Card>
            </Link>

            {isAdmin ? (
              <Link to="/selectors">
                <Card className="h-full bg-ivory-25 transition hover:border-copper-300">
                  <QuickLinkTitle
                    title="Selector builder"
                    body="Preview the exact admin-authored logic that maps source fields into semantic attributes."
                  />
                </Card>
              </Link>
            ) : null}

            {isAdmin ? (
              <Link to="/data-sources">
                <Card className="h-full bg-ivory-25 transition hover:border-copper-300">
                  <QuickLinkTitle
                    title="Data sources"
                    body="Reinforce the two-database story by showing the operational connector estate feeding the context layer."
                  />
                </Card>
              </Link>
            ) : null}
          </div>
        </Panel>
      </section>
    </div>
  )
}

function QuickLinkTitle({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="font-display text-2xl text-ink-950">{title}</p>
      <p className="mt-3 text-sm leading-7 text-ink-700">{body}</p>
    </div>
  )
}
