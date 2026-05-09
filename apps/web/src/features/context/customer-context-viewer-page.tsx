import { useDeferredValue, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { CalendarClock, CircleDashed, RefreshCcw, Waypoints } from 'lucide-react'
import { JsonViewer } from '@/components/data-display/json-viewer'
import { Badge, Button, Card, EmptyState, Input, PageHeader, Panel } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import {
  formatConfidence,
  formatDateTime,
  formatRelativeMinutes,
  humanizeEnum,
  safeJsonParse,
} from '@/lib/utils'
import { queryClient } from '@/app/providers'
import type { ContextFactResult } from '@/lib/types'

function describeTimelineLift(category: string, description: string) {
  const normalizedCategory = category.toLowerCase()
  const normalizedDescription = description.toLowerCase()

  if (normalizedCategory.includes('web')) {
    return {
      title: 'Enterprise intent and urgency',
      body: normalizedDescription.includes('trial')
        ? 'A trial activation raises timing urgency and tells the semantic layer this is active evaluation.'
        : 'Pricing page activity boosts commercial intent instead of being left behind in analytics logs.',
      tone: 'accent' as const,
    }
  }

  if (normalizedCategory.includes('sales')) {
    return {
      title: 'Conversion confidence',
      body: 'Rep activity becomes a reusable signal for probability, timing, and recommended sales motion.',
      tone: 'success' as const,
    }
  }

  if (normalizedCategory.includes('support')) {
    return {
      title: 'Risk and review posture',
      body: normalizedDescription.includes('resolved')
        ? 'Resolved support friction lowers drag on the account and supports a cleaner rollout story.'
        : 'Open support issues stay visible so downstream AI can acknowledge friction and avoid overconfidence.',
      tone: 'warning' as const,
    }
  }

  return {
    title: 'Reusable semantic signal',
    body: 'Context Layer attaches business meaning to the raw event so other product workflows can consume it consistently.',
    tone: 'neutral' as const,
  }
}

function sourceSystemLabel(category: string) {
  const normalizedCategory = category.toLowerCase()

  if (normalizedCategory.includes('web')) {
    return 'Web analytics'
  }

  if (normalizedCategory.includes('support')) {
    return 'Support system'
  }

  if (normalizedCategory.includes('sales')) {
    return 'CRM activity'
  }

  if (normalizedCategory.includes('email')) {
    return 'Engagement platform'
  }

  if (normalizedCategory.includes('billing')) {
    return 'Billing system'
  }

  return humanizeEnum(category)
}

export function CustomerContextViewerPage() {
  const { session } = useAuthSession()
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedFactId, setSelectedFactId] = useState<string | null>(null)
  const tenantSlug = session?.tenantSlug ?? 'demo'
  const actorEmail = session?.email ?? 'demo-admin@contextlayer.local'

  const usersQuery = useQuery({
    queryKey: ['userProfiles', tenantSlug],
    queryFn: () => api.getUserProfiles(tenantSlug),
    enabled: Boolean(session),
  })

  const selectedExternalUserId =
    location.pathname.split('/')[2] || usersQuery.data?.[0]?.externalUserId || '123'

  const contextQuery = useQuery({
    queryKey: ['userContext', tenantSlug, selectedExternalUserId],
    queryFn: () =>
      api.getUserContext({
        tenantSlug,
        externalUserId: selectedExternalUserId,
      }),
    enabled: Boolean(session && selectedExternalUserId),
  })

  const executionsQuery = useQuery({
    queryKey: ['selectorExecutions', tenantSlug, selectedExternalUserId],
    queryFn: () => api.getSelectorExecutions(tenantSlug, selectedExternalUserId),
    enabled: Boolean(session && selectedExternalUserId),
  })

  const recomputeMutation = useMutation({
    mutationFn: () =>
      api.queueContextRecompute({
        tenantSlug,
        externalUserId: selectedExternalUserId,
        triggeredBy: actorEmail,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['userContext', tenantSlug, selectedExternalUserId] }),
        queryClient.invalidateQueries({
          queryKey: ['selectorExecutions', tenantSlug, selectedExternalUserId],
        }),
      ])
    },
  })

  const deferredSearch = useDeferredValue(search)
  const filteredUsers = useMemo(() => {
    const term = deferredSearch.toLowerCase().trim()
    return (usersQuery.data ?? []).filter((user) =>
      [user.externalUserId, user.fullName, user.companyName, user.email]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [deferredSearch, usersQuery.data])

  const activeSelectedFactId = selectedFactId ?? contextQuery.data?.facts[0]?.id ?? null
  const selectedFact =
    contextQuery.data?.facts.find((fact) => fact.id === activeSelectedFactId) ?? contextQuery.data?.facts[0] ?? null

  const selectedProvenance = selectedFact
    ? safeJsonParse<Array<Record<string, unknown>>>(selectedFact.provenanceJson, [])
    : []
  const rawSourceSummary = safeJsonParse(contextQuery.data?.sourceSummary?.rawSummaryJson ?? '{}', {})

  if (!session) {
    return null
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Customer intelligence"
        title="Customer context viewer"
        description="Inspect a person-level context package with confidence, provenance, and execution history so humans and agents can work from the same grounded profile."
        actions={
          <Button type="button" onClick={() => recomputeMutation.mutate()} disabled={recomputeMutation.isPending}>
            <RefreshCcw className="mr-2 size-4" />
            Recompute profile
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[320px_1fr_380px]">
        <Panel eyebrow="People" title="Profiles">
          <div className="grid gap-4">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer, company, email"
            />
            <div className="grid gap-3">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => void navigate({ to: `/customers/${user.externalUserId}` })}
                  className="rounded-[24px] border border-ink-900/8 bg-ivory-25 px-4 py-4 text-left transition hover:border-copper-300"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-950">{user.fullName}</p>
                      <p className="mt-1 text-sm text-ink-600">{user.companyName}</p>
                    </div>
                    <Badge tone="neutral">User {user.externalUserId}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <p className="text-sm text-ink-700">{user.email}</p>
                    {user.isEmailMasked ? <Badge tone="warning">Masked</Badge> : null}
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-ink-500">
                    Seen {formatRelativeMinutes(user.lastSeenAtUtc)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <div className="grid gap-4">
          {contextQuery.data ? (
            <>
              <Panel
                eyebrow="360 profile"
                title={`${contextQuery.data.fullName} · ${contextQuery.data.companyName}`}
                action={
                  <div className="flex items-center gap-2">
                    <Badge tone={contextQuery.data.isStale ? 'warning' : 'success'}>
                      {contextQuery.data.isStale ? 'Stale' : 'Fresh'}
                    </Badge>
                    <Badge tone="accent">{formatConfidence(contextQuery.data.overallConfidence)}</Badge>
                  </div>
                }
              >
                <div className="rounded-[24px] bg-ink-950 px-5 py-5 text-ivory-50">
                  <p className="text-xs uppercase tracking-[0.18em] text-copper-300">Readable agent summary</p>
                  <p className="mt-3 text-lg leading-8">{contextQuery.data.summary}</p>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {contextQuery.data.facts.map((fact) => (
                    <button
                      key={fact.id}
                      type="button"
                      onClick={() => setSelectedFactId(fact.id)}
                      className="rounded-[24px] border border-ink-900/8 bg-ivory-25 px-4 py-4 text-left transition hover:border-sage-300"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-ink-950">{fact.attributeKey}</p>
                        <Badge tone={fact.confidence >= 0.9 ? 'success' : fact.confidence >= 0.75 ? 'accent' : 'warning'}>
                          {formatConfidence(fact.confidence)}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm text-ink-700">{fact.explanation}</p>
                      <div className="mt-4 flex flex-wrap gap-3 text-xs text-ink-500">
                        <span className="inline-flex items-center gap-2">
                          <CalendarClock className="size-3.5" />
                          Observed {formatDateTime(fact.observedAtUtc)}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <CircleDashed className="size-3.5" />
                          Fresh until {formatDateTime(fact.freshUntilUtc)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel eyebrow="Operational source" title="customer_ops_db summary">
                {contextQuery.data.sourceSummary ? (
                  <div className="grid gap-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {contextQuery.data.sourceSummary.highlights.map((highlight) => (
                        <Card key={highlight.label} className="bg-ivory-25">
                          <p className="text-xs uppercase tracking-[0.18em] text-sage-700">
                            {highlight.label}
                          </p>
                          <p className="mt-3 font-display text-3xl text-ink-950">{highlight.value}</p>
                          <p className="mt-2 text-sm leading-7 text-ink-700">{highlight.explanation}</p>
                        </Card>
                      ))}
                    </div>

                    <Card className="bg-ivory-25">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink-950">
                            {contextQuery.data.sourceSummary.accountName}
                          </p>
                          <p className="mt-1 text-sm text-ink-600">
                            {contextQuery.data.sourceSummary.externalAccountId} · {contextQuery.data.sourceSummary.domain}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge tone="neutral">{contextQuery.data.sourceSummary.activePlanName}</Badge>
                          <Badge tone="accent">{contextQuery.data.sourceSummary.subscriptionStatus}</Badge>
                        </div>
                      </div>
                    </Card>
                  </div>
                ) : (
                  <EmptyState
                    title="No operational source summary"
                    body="This profile does not yet have an attached customer_ops_db summary."
                  />
                )}
              </Panel>

              <Panel eyebrow="Cross-system timeline" title="How UCL turns source events into business meaning">
                {contextQuery.data.sourceSummary?.recentTimeline?.length ? (
                  <div className="relative grid gap-4 pl-8">
                    <div className="absolute bottom-2 left-3 top-3 w-px bg-copper-200" />
                    {contextQuery.data.sourceSummary.recentTimeline.map((event, index) => {
                      const lift = describeTimelineLift(event.category, event.description)
                      return (
                        <div key={`${event.occurredAtUtc}-${index}`} className="relative">
                          <div className="absolute -left-[31px] top-7 size-4 rounded-full border-4 border-ivory-100 bg-copper-500 shadow-sm" />
                          <Card className="bg-ivory-25">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex flex-wrap gap-2">
                                <Badge tone="neutral">{sourceSystemLabel(event.category)}</Badge>
                                <Badge tone={lift.tone}>{humanizeEnum(event.category)}</Badge>
                              </div>
                              <p className="text-xs uppercase tracking-[0.18em] text-ink-500">
                                {formatRelativeMinutes(event.occurredAtUtc)}
                              </p>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-start">
                              <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Source event</p>
                                <p className="mt-2 text-sm leading-7 text-ink-800">{event.description}</p>
                              </div>
                              <div className="flex items-center justify-center text-copper-600">
                                <Waypoints className="size-5" />
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Semantic interpretation</p>
                                <p className="mt-2 font-semibold text-ink-950">{lift.title}</p>
                                <p className="mt-2 text-sm leading-7 text-ink-700">{lift.body}</p>
                              </div>
                            </div>
                          </Card>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="No timeline yet"
                    body="This customer does not yet have recent cross-system events to translate into semantic context."
                  />
                )}
              </Panel>

              <Panel eyebrow="Timeline" title="Selector execution history">
                <div className="grid gap-3">
                  {(executionsQuery.data ?? []).map((execution) => (
                    <Card key={execution.id} className="bg-ivory-25">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-ink-950">{execution.selectorDefinition?.name}</p>
                          <p className="mt-1 text-sm text-ink-600">{execution.resultExplanation}</p>
                        </div>
                        <Badge tone={execution.status === 'SUCCEEDED' ? 'success' : execution.status === 'FAILED' ? 'danger' : 'warning'}>
                          {execution.status}
                        </Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-500">
                        <span>{formatDateTime(execution.requestedAtUtc)}</span>
                        <span>{execution.executionMode}</span>
                        <span>{formatConfidence(execution.resultConfidence)}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              </Panel>
            </>
          ) : (
            <EmptyState
              title="No context profile yet"
              body="Select a user on the left to inspect the current context snapshot and its provenance."
            />
          )}
        </div>

        <div className="grid gap-4">
          <Panel eyebrow="Snapshot history" title="Historical context snapshots">
            {contextQuery.data?.history?.length ? (
              <div className="grid gap-3">
                {contextQuery.data.history.map((snapshot) => (
                  <Card key={snapshot.snapshotId} className="bg-ivory-25">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink-950">Snapshot v{snapshot.snapshotVersion}</p>
                        <p className="mt-1 text-sm text-ink-700">{snapshot.summary}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={snapshot.isStale ? 'warning' : 'success'}>
                          {snapshot.isStale ? 'Stale' : 'Fresh'}
                        </Badge>
                        <Badge tone="accent">{formatConfidence(snapshot.overallConfidence)}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-500">
                      <span>{formatDateTime(snapshot.generatedAtUtc)}</span>
                      <span>{snapshot.factCount} facts</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No snapshot history"
                body="Run a recompute to build up a fuller history of semantic snapshots for this customer."
              />
            )}
          </Panel>

          <Panel eyebrow="Provenance" title={selectedFact?.attributeKey ?? 'Select a fact'}>
            {selectedFact ? (
              <div className="grid gap-4">
                <Card className="bg-ivory-25">
                  <p className="text-sm font-semibold text-ink-950">Explanation</p>
                  <p className="mt-3 text-sm leading-7 text-ink-700">{selectedFact.explanation}</p>
                </Card>
                <JsonViewer value={selectedProvenance} title="Evidence trail" height="h-64" />
              </div>
            ) : (
              <EmptyState
                title="Choose a fact"
                body="Click one of the facts in the profile summary to inspect the provenance chain behind it."
              />
            )}
          </Panel>

          <Panel eyebrow="Agent payload" title="Structured context package">
            <JsonViewer
              value={{
                sourceSummary: rawSourceSummary,
                summary: contextQuery.data?.summary,
                confidence: contextQuery.data?.overallConfidence,
                facts:
                  contextQuery.data?.facts.map((fact: ContextFactResult) => ({
                    attributeKey: fact.attributeKey,
                    value: safeJsonParse(fact.valueJson, fact.valueJson),
                    confidence: fact.confidence,
                    explanation: fact.explanation,
                  })) ?? [],
              }}
              title="Context payload"
              height="h-[360px]"
            />
          </Panel>
        </div>
      </div>
    </div>
  )
}
