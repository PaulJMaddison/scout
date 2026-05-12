import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CreditCard, Gauge, LockKeyhole, PlugZap } from 'lucide-react'
import { Badge, Card, MetricCard, PageHeader, Panel } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import { formatDateTime } from '@/lib/utils'

function formatNumber(value?: number | null) {
  return value === null || value === undefined ? 'Unlimited' : new Intl.NumberFormat().format(value)
}

function percentUsed(used?: number | null, limit?: number | null) {
  if (!limit || used === null || used === undefined) {
    return 0
  }

  return Math.min(100, Math.round((used / limit) * 100))
}

function toneForUsage(value: number) {
  if (value >= 90) {
    return 'danger' as const
  }

  if (value >= 70) {
    return 'warning' as const
  }

  return 'success' as const
}

export function UsageDashboardPage() {
  const { session } = useAuthSession()
  const tenantSlug = session?.tenantSlug ?? 'demo'
  const usageQuery = useQuery({
    queryKey: ['billing-usage', tenantSlug],
    queryFn: () => api.getBillingUsage(tenantSlug),
    enabled: Boolean(session),
  })

  const highWater = useMemo(() => {
    const limits = usageQuery.data?.limits ?? []
    return [...limits]
      .filter((limit) => !limit.isUnlimited && limit.limit)
      .sort((a, b) => percentUsed(b.used, b.limit) - percentUsed(a.used, a.limit))[0]
  }, [usageQuery.data?.limits])
  const providerNotes = [
    {
      icon: CreditCard,
      title: 'Billing provider gateway',
      body: 'Checkout, portal, customer, and plan mapping interfaces are present but backed by a no-op provider.',
    },
    {
      icon: Gauge,
      title: 'Metering service',
      body: 'Usage records are captured tenant-by-tenant and workspace-aware where available.',
    },
    {
      icon: LockKeyhole,
      title: 'Limit enforcement',
      body: highWater ? `${highWater.displayName} is currently ${percentUsed(highWater.used, highWater.limit)}% used.` : 'No high-water signal yet.',
    },
    {
      icon: PlugZap,
      title: 'Future provider hooks',
      body: 'Webhook handling can reconcile external subscription state without changing core usage logic.',
    },
  ]

  if (!session) {
    return null
  }

  const usage = usageQuery.data

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Billing and usage"
        title="Meter the context layer before a payment provider ever touches it."
        description="This dashboard shows the future control-plane billing foundation: plan limits, current usage, hard enforcement points, retention policy, and the clean seam where a private billing provider can be attached later."
      />

      <section className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          label="Current plan"
          value={usage?.plan ?? '—'}
          footnote={`${usage?.status ?? 'Loading'} subscription state for ${tenantSlug}.`}
          accent="copper"
        />
        <MetricCard
          label="Context lookups"
          value={formatNumber(usage?.usage.find((metric) => metric.metric === 'ContextLookups')?.quantity)}
          footnote="Successful GraphQL and REST context reads this period."
          accent="sage"
        />
        <MetricCard
          label="Source events"
          value={formatNumber(usage?.usage.find((metric) => metric.metric === 'SourceEvents')?.quantity)}
          footnote="Accepted webhook or source-system events this period."
          accent="gold"
        />
        <MetricCard
          label="Retention"
          value={usage ? `${usage.retentionDays}d` : '—'}
          footnote="Policy target used by future retention workers."
          accent="copper"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <Panel
          eyebrow="Plan limits"
          title="Hard limits are enforced before write-side work is queued."
          action={<Badge tone={usage?.providerIntegrationStatus === 'NotConnected' ? 'warning' : 'success'}>{usage?.providerIntegrationStatus ?? 'Loading'}</Badge>}
        >
          <div className="grid gap-3">
            {(usage?.limits ?? []).map((limit) => {
              const usedPercent = percentUsed(limit.used, limit.limit)
              return (
                <Card key={limit.metric} className="bg-ivory-25 p-4 shadow-none">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-950">{limit.displayName}</p>
                      <p className="mt-1 text-sm leading-6 text-ink-600">{limit.notes}</p>
                    </div>
                    <Badge tone={limit.isUnlimited ? 'accent' : toneForUsage(usedPercent)}>
                      {limit.enforcement}
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-600">
                    <span>{formatNumber(limit.used)} used</span>
                    <span>{formatNumber(limit.limit)} limit</span>
                    <span>{formatNumber(limit.remaining)} remaining</span>
                    <span>{limit.window}</span>
                  </div>
                  {!limit.isUnlimited ? (
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-950/8">
                      <div
                        className="h-full rounded-full bg-copper-500 transition-all"
                        style={{ width: `${usedPercent}%` }}
                      />
                    </div>
                  ) : null}
                </Card>
              )
            })}
          </div>
        </Panel>

        <div className="grid gap-4">
          <Panel eyebrow="Period" title="Current metering window">
            <div className="grid gap-3 text-sm text-ink-700">
              <div className="rounded-3xl border border-ink-900/8 bg-ivory-25 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-ink-500">Starts</p>
                <p className="mt-2 font-semibold text-ink-950">{formatDateTime(usage?.currentPeriodStartUtc)}</p>
              </div>
              <div className="rounded-3xl border border-ink-900/8 bg-ivory-25 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-ink-500">Ends</p>
                <p className="mt-2 font-semibold text-ink-950">{formatDateTime(usage?.currentPeriodEndUtc)}</p>
              </div>
            </div>
          </Panel>

          <Panel eyebrow="Integration seam" title="Provider-neutral until you plug in Stripe or Paddle">
            <div className="grid gap-3">
              {providerNotes.map(({ icon: Icon, title, body }) => (
                <Card key={title} className="bg-ivory-25 p-4 shadow-none">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sage-500/12 text-sage-800">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-ink-950">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-ink-600">{body}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      {usageQuery.isError ? (
        <Card className="border-rosewood-500/20 bg-rosewood-500/8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 size-5 text-rosewood-700" />
            <p className="text-sm leading-6 text-rosewood-800">
              Billing usage could not be loaded. The demo fallback will still show fictional usage if enabled.
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
