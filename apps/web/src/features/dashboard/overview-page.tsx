import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Clock3,
  Database,
  FileCog,
  ScrollText,
  ServerCog,
  Shield,
  Sparkle,
} from 'lucide-react'
import { JsonViewer } from '@/components/data-display/json-viewer'
import {
  Badge,
  Button,
  Card,
  MetricCard,
  PageHeader,
  Panel,
} from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import {
  formatConfidence,
  formatDateTime,
  formatRelativeMinutes,
  safeJsonParse,
} from '@/lib/utils'

export function OverviewPage() {
  const { session } = useAuthSession()
  const tenantSlug = session?.tenantSlug ?? 'demo'
  const isAdmin = session?.role === 'tenant_admin'

  const workspaceQuery = useQuery({
    queryKey: ['workspace-overview', tenantSlug],
    queryFn: async () => {
      const [users, dataSources, semanticAttributes, selectors, promptTemplates, auditEvents, executions] =
        await Promise.all([
          api.getUserProfiles(tenantSlug),
          api.getDataSources(tenantSlug),
          api.getSemanticAttributes(tenantSlug),
          api.getSelectors(tenantSlug),
          api.getPromptTemplates(tenantSlug),
          api.getAuditEvents(tenantSlug),
          api.getSelectorExecutions(tenantSlug),
        ])

      return {
        users,
        dataSources,
        semanticAttributes,
        selectors,
        promptTemplates,
        auditEvents,
        executions,
      }
    },
    enabled: Boolean(session),
  })

  const primaryUserId = workspaceQuery.data?.users[0]?.externalUserId ?? '123'

  const contextQuery = useQuery({
    queryKey: ['user-context', tenantSlug, primaryUserId],
    queryFn: () =>
      api.getUserContext({
        tenantSlug,
        externalUserId: primaryUserId,
      }),
    enabled: Boolean(session && primaryUserId),
  })

  const opsQuery = useQuery({
    queryKey: ['ops-summary', tenantSlug],
    queryFn: () => api.getOperationalSummary(),
    enabled: Boolean(session && isAdmin),
  })

  const insightCards = useMemo(() => {
    const selectors = workspaceQuery.data?.selectors ?? []
    const publishedSelectors = selectors.filter((selector) => selector.status === 'PUBLISHED')
    return [
      {
        label: 'Active connectors',
        value: String(workspaceQuery.data?.dataSources.length ?? 0),
        footnote: 'CRM, usage, and warehouse sources currently feeding the semantic layer.',
        accent: 'copper' as const,
      },
      {
        label: 'Published selectors',
        value: String(publishedSelectors.length),
        footnote: 'Production mapping logic currently shaping customer context.',
        accent: 'sage' as const,
      },
      {
        label: 'Schema attributes',
        value: String(workspaceQuery.data?.semanticAttributes.length ?? 0),
        footnote: 'Canonical attributes available to customer context and downstream agents.',
        accent: 'gold' as const,
      },
      {
        label: 'Current confidence',
        value: formatConfidence(contextQuery.data?.overallConfidence),
        footnote: 'Average confidence across the latest context snapshot for the primary demo account.',
        accent: 'copper' as const,
      },
      {
        label: 'Masked profiles',
        value: String(
          (workspaceQuery.data?.users ?? []).filter((user) => user.isEmailMasked).length,
        ),
        footnote: isAdmin
          ? 'Admins can inspect raw contact detail when policy allows.'
          : 'Sales views respect field-level masking for direct identifiers.',
        accent: 'sage' as const,
      },
    ]
  }, [contextQuery.data?.overallConfidence, isAdmin, workspaceQuery.data])

  if (!session) {
    return null
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Workspace pulse"
        title="Semantic operations at a glance"
        description="Keep an eye on selector quality, connector freshness, and the context packages your agents are actually consuming."
        actions={
          <>
            <Link to="/demo">
              <Button variant="ghost">
                Guided demo
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <Link to="/selectors">
              <Button variant="secondary">
                Refine selectors
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <Link to="/agent-playground">
              <Button>
                Open playground
                <Sparkle className="ml-2 size-4" />
              </Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {insightCards.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel eyebrow="Operational health" title="Tracing, workers, and queue posture">
          {isAdmin ? (
            <div className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card className="bg-ivory-25">
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-500">Workers online</p>
                  <p className="mt-3 font-display text-4xl text-ink-950">
                    {opsQuery.data?.backgroundWorkers.filter((worker) => worker.isHealthy).length ?? '—'}
                  </p>
                </Card>
                <Card className="bg-ivory-25">
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-500">Queue depth</p>
                  <p className="mt-3 font-display text-4xl text-ink-950">
                    {opsQuery.data?.backgroundWorkers.reduce((total, worker) => total + worker.queueDepth, 0) ?? '—'}
                  </p>
                </Card>
                <Card className="bg-ivory-25">
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-500">Failed agent runs</p>
                  <p className="mt-3 font-display text-4xl text-ink-950">
                    {opsQuery.data?.stats.failedAgentRuns ?? '—'}
                  </p>
                </Card>
                <Card className="bg-ivory-25">
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-500">Stale snapshots</p>
                  <p className="mt-3 font-display text-4xl text-ink-950">
                    {opsQuery.data?.stats.staleSnapshots ?? '—'}
                  </p>
                </Card>
              </div>

              <div className="grid gap-3">
                {(opsQuery.data?.backgroundWorkers ?? []).map((worker) => (
                  <div
                    key={worker.workerName}
                    className="rounded-[24px] border border-ink-900/8 bg-ivory-25 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-2xl bg-sage-500/12 text-sage-800">
                          <ServerCog className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="break-words font-semibold text-ink-950">{worker.workerName}</p>
                          <p className="text-sm text-ink-600">{worker.message}</p>
                        </div>
                      </div>
                      <Badge tone={worker.isHealthy ? 'success' : 'danger'}>
                        {worker.isHealthy ? 'Healthy' : 'Needs attention'}
                      </Badge>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-500">
                      <span>Queue depth {worker.queueDepth}</span>
                      <span>Heartbeat {formatDateTime(worker.lastHeartbeatUtc)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-sage-500/12 text-sage-800">
                  <Shield className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-ink-950">Sales workspace protections are active</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    Direct identifiers may be masked, grounded facts carry provenance, and admin-only operational telemetry stays outside rep workflows.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </Panel>

        <Panel eyebrow="Compliance posture" title="PII handling and AI visibility">
          <div className="grid gap-3">
            <Card className="bg-ivory-25">
              <p className="font-semibold text-ink-950">Field-level masking</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                User email addresses are masked for sales reps in list views. Admins retain access for connector and compliance operations.
              </p>
            </Card>
            <Card className="bg-ivory-25">
              <p className="font-semibold text-ink-950">AI-visible provenance</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                Every fact in the context package includes citation ids, confidence, freshness, source selector, and field-level provenance so the model never sees unsupported claims.
              </p>
            </Card>
            <Card className="bg-ivory-25">
              <p className="font-semibold text-ink-950">Read auditability</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                Context profile reads, sales package reads, and agent run requests are written to the audit trail for tenant-scoped review.
              </p>
            </Card>
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          eyebrow="Snapshot spotlight"
          title={contextQuery.data ? `${contextQuery.data.fullName} · ${contextQuery.data.companyName}` : 'Loading latest context'}
          action={
            contextQuery.data?.isStale ? (
              <Badge tone="warning">Stale profile</Badge>
            ) : (
              <Badge tone="success">Fresh snapshot</Badge>
            )
          }
        >
          {contextQuery.data ? (
            <div className="grid gap-5">
              <div className="rounded-[24px] bg-ink-950 px-5 py-5 text-ivory-50">
                <p className="text-xs uppercase tracking-[0.18em] text-copper-300">Agent-ready summary</p>
                <p className="mt-3 text-lg leading-8">{contextQuery.data.summary}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {contextQuery.data.facts.map((fact) => (
                  <Card key={fact.id} className="bg-ivory-25">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-ink-950">{fact.attributeKey}</p>
                      <Badge tone={fact.confidence >= 0.9 ? 'success' : fact.confidence >= 0.75 ? 'accent' : 'warning'}>
                        {formatConfidence(fact.confidence)}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-ink-700">{fact.explanation}</p>
                    <p className="mt-4 text-xs uppercase tracking-[0.18em] text-ink-500">
                      Fresh until {formatDateTime(fact.freshUntilUtc)}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card className="bg-ivory-25">Loading customer context…</Card>
          )}
        </Panel>

        <Panel eyebrow="Context payload" title="What the agent actually sees">
          <JsonViewer
            value={{
              summary: contextQuery.data?.summary,
              confidence: contextQuery.data?.overallConfidence,
              facts: contextQuery.data?.facts.map((fact) => ({
                attributeKey: fact.attributeKey,
                value: safeJsonParse(fact.valueJson, fact.valueJson),
                confidence: fact.confidence,
                provenance: safeJsonParse(fact.provenanceJson, []),
              })),
            }}
            height="h-[420px]"
          />
        </Panel>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[0.9fr_1.1fr]">
        <Panel eyebrow="Execution flow" title="Recent selector activity">
          <div className="grid gap-3">
            {(workspaceQuery.data?.executions ?? []).slice(0, 5).map((execution) => (
              <div
                key={execution.id}
                className="rounded-[24px] border border-ink-900/8 bg-ivory-25 px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-ink-950">{execution.selectorDefinition?.name}</p>
                    <p className="mt-1 text-sm text-ink-600">
                      {execution.userProfile?.fullName} · {execution.selectorDefinition?.targetAttributeDefinition?.displayName}
                    </p>
                  </div>
                  <Badge tone={execution.status === 'SUCCEEDED' ? 'success' : execution.status === 'FAILED' ? 'danger' : 'warning'}>
                    {execution.status}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="size-3.5" />
                    {formatRelativeMinutes(execution.requestedAtUtc)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <FileCog className="size-3.5" />
                    {execution.executionMode}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Operational notes" title="What changed recently">
          <div className="grid gap-3">
            {(workspaceQuery.data?.auditEvents ?? []).slice(0, 6).map((event) => (
              <div key={event.id} className="grid gap-2 rounded-[24px] border border-ink-900/8 bg-ivory-25 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-2xl bg-sage-500/12 text-sage-800">
                      {event.entityType === 'DataSource' ? (
                        <Database className="size-4" />
                      ) : (
                        <ScrollText className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="break-words font-semibold text-ink-950">{event.action}</p>
                      <p className="text-sm text-ink-600">
                        {event.entityType} · {event.actor}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-500">
                    {formatDateTime(event.createdAtUtc)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  )
}
