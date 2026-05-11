import { useDeferredValue, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
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
        : 'Open support issues stay visible so downstream consumers can acknowledge friction and avoid overconfidence.',
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
  const navigate = useNavigate()
  const routeParams = useParams({ strict: false })
  const [search, setSearch] = useState('')
  const [selectedFactId, setSelectedFactId] = useState<string | null>(null)
  const tenantSlug = session?.tenantSlug ?? 'demo'
  const actorEmail = session?.email ?? 'demo-admin@contextlayer.local'
  const routeExternalUserId =
    typeof routeParams.externalUserId === 'string' ? routeParams.externalUserId : undefined

  const usersQuery = useQuery({
    queryKey: ['userProfiles', tenantSlug],
    queryFn: () => api.getUserProfiles(tenantSlug),
    enabled: Boolean(session),
    placeholderData: (previousData) => previousData,
  })

  const selectedExternalUserId = routeExternalUserId ?? usersQuery.data?.[0]?.externalUserId ?? '123'

  const contextQuery = useQuery({
    queryKey: ['userContext', tenantSlug, selectedExternalUserId],
    queryFn: () =>
      api.getUserContext({
        tenantSlug,
        externalUserId: selectedExternalUserId,
      }),
    enabled: Boolean(session && selectedExternalUserId),
    placeholderData: (previousData) => previousData,
  })

  const executionsQuery = useQuery({
    queryKey: ['selectorExecutions', tenantSlug, selectedExternalUserId],
    queryFn: () => api.getSelectorExecutions(tenantSlug, selectedExternalUserId),
    enabled: Boolean(session && selectedExternalUserId),
    placeholderData: (previousData) => previousData,
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
  const contextProfile = contextQuery.data ?? null
  const isProfileLoading = contextQuery.isPending && !contextProfile

  if (!session) {
    return null
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Customer intelligence"
        title="Turn a raw user record into a trusted 360 degree customer context profile."
        description="Inspect the semantic facts, confidence, provenance, source timeline, and snapshot history that let humans, apps, workflows, copilots, and agents work from the same grounded customer context."
        actions={
          <Button type="button" onClick={() => recomputeMutation.mutate()} disabled={recomputeMutation.isPending}>
            <RefreshCcw className="mr-2 size-4" />
            Recompute profile
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)_360px]">
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
                  onClick={() =>
                    void navigate({
                      to: '/customers/$externalUserId',
                      params: { externalUserId: user.externalUserId },
                    })
                  }
                  className="min-w-0 rounded-[20px] border border-ink-900/8 bg-ivory-25 px-4 py-4 text-left transition hover:border-copper-300"
                >
                  <div className="grid min-w-0 gap-2">
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink-950">{user.fullName}</p>
                        <p className="mt-1 truncate text-sm text-ink-600">{user.companyName}</p>
                      </div>
                      <Badge tone="neutral" className="shrink-0">User {user.externalUserId}</Badge>
                    </div>
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="min-w-0 break-all text-sm leading-6 text-ink-700">{user.email}</p>
                      {user.isEmailMasked ? <Badge tone="warning">Masked</Badge> : null}
                    </div>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-ink-500">
                    Seen {formatRelativeMinutes(user.lastSeenAtUtc)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <div className="grid min-w-0 gap-4">
          {contextProfile ? (
            <>
              <Panel
                eyebrow="360 profile"
                title={`${contextProfile.fullName} · ${contextProfile.companyName}`}
                action={
                  <div className="flex items-center gap-2">
                    <Badge tone={contextProfile.isStale ? 'warning' : 'success'}>
                      {contextProfile.isStale ? 'Stale' : 'Fresh'}
                    </Badge>
                    <Badge tone="accent">{formatConfidence(contextProfile.overallConfidence)}</Badge>
                  </div>
                }
              >
                <div className="rounded-[24px] bg-ink-950 px-5 py-5 text-ivory-50">
                  <p className="text-xs uppercase tracking-[0.18em] text-copper-300">Readable consumer summary</p>
                  <p className="mt-3 text-lg leading-8">{contextProfile.summary}</p>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {contextProfile.facts.map((fact) => (
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
                {contextProfile.sourceSummary ? (
                  <div className="grid gap-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {contextProfile.sourceSummary.highlights.map((highlight) => (
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
                          <p className="font-semibold text-ink-950">{contextProfile.sourceSummary.accountName}</p>
                          <p className="mt-1 text-sm text-ink-600">
                            {contextProfile.sourceSummary.externalAccountId} · {contextProfile.sourceSummary.domain}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge tone="neutral">{contextProfile.sourceSummary.activePlanName}</Badge>
                          <Badge tone="accent">{contextProfile.sourceSummary.subscriptionStatus}</Badge>
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
                {contextProfile.sourceSummary?.recentTimeline?.length ? (
                  <div className="relative grid gap-4 pl-8">
                    <div className="absolute bottom-2 left-3 top-3 w-px bg-copper-200" />
                    {contextProfile.sourceSummary.recentTimeline.map((event, index) => {
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
          ) : isProfileLoading ? (
            <Panel eyebrow="360 profile" title="Loading the featured customer story">
              <div className="grid gap-3">
                <Card className="bg-ivory-25">
                  <p className="font-semibold text-ink-950">Resolving the unified customer profile</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    Context Layer is pulling the current semantic snapshot, operational summary, and selector history for this customer.
                  </p>
                </Card>
              </div>
            </Panel>
          ) : (
            <EmptyState
              title="No context profile yet"
              body="Select a user on the left to inspect the current context snapshot and its provenance."
            />
          )}
        </div>

        <div className="grid min-w-0 gap-4 xl:col-span-2 2xl:col-span-1">
          <Panel eyebrow="Snapshot history" title="Historical context snapshots">
            {contextProfile?.history?.length ? (
              <div className="grid gap-3">
                {contextProfile.history.map((snapshot) => (
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

          <Panel eyebrow="Consumer payload" title="Structured context package">
            <JsonViewer
              value={{
                sourceSummary: rawSourceSummary,
                summary: contextProfile?.summary,
                confidence: contextProfile?.overallConfidence,
                facts:
                  contextProfile?.facts.map((fact: ContextFactResult) => ({
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
