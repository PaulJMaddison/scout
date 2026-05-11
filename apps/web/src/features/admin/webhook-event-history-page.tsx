import { useDeferredValue, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RadioTower, Search } from 'lucide-react'
import { Badge, Card, Input, PageHeader, Panel } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import { AdminEmptyState, AdminErrorState, AdminLoadingState, StatusBadge, Timestamp } from '@/features/admin/admin-components'

export function WebhookEventHistoryPage() {
  const { session } = useAuthSession()
  const tenantSlug = session?.tenantSlug ?? 'demo'
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const eventsQuery = useQuery({
    queryKey: ['sourceSystemEvents', tenantSlug],
    queryFn: () => api.getSourceSystemEvents(tenantSlug),
    enabled: Boolean(session),
  })
  const events = useMemo(() => {
    const term = deferredSearch.toLowerCase().trim()
    return (eventsQuery.data ?? []).filter((event) =>
      [event.eventId, event.sourceSystem, event.eventType, event.status, event.externalUserId, event.externalAccountId]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [deferredSearch, eventsQuery.data])

  if (!session) {
    return null
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Webhook and event history"
        title="Inspect source-system events from receipt through selector-triggered recomputation."
        description="Integration teams can verify signatures, idempotency, tenant routing, processing status, dead letters, and which events actually triggered context work."
        actions={<Badge tone="accent">{events.length} visible events</Badge>}
      />

      {eventsQuery.isLoading ? <AdminLoadingState label="Loading source events" /> : null}
      {eventsQuery.isError ? <AdminErrorState error={eventsQuery.error} /> : null}

      <Panel eyebrow="Event stream" title="Provider-neutral event contract">
        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-11" placeholder="Search event id, source, type, user, account, or status" />
        </div>

        {events.length === 0 && !eventsQuery.isLoading ? (
          <AdminEmptyState
            title="No source events yet"
            body="When CRMs, billing tools, support systems, or warehouse jobs send events, this stream proves what was received, ignored, processed, or moved to dead letter."
          />
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <Card key={event.id} className="bg-ivory-25 shadow-none">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <RadioTower className="size-5 text-copper-700" />
                      <h2 className="font-display text-xl text-ink-950">{event.eventType}</h2>
                      <StatusBadge value={event.status} />
                    </div>
                    <p className="mt-2 break-all text-sm text-ink-700">{event.eventId}</p>
                    <p className="mt-2 text-sm leading-6 text-ink-600">{event.processingSummary || event.deadLetterReason || event.errorMessage || 'No processing summary recorded yet.'}</p>
                  </div>
                  <div className="text-right text-xs uppercase tracking-[0.18em] text-ink-500">
                    <Timestamp value={event.receivedAtUtc} />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="neutral">{event.sourceSystem}</Badge>
                  <Badge tone="accent">{event.matchedSelectorCount} selector matches</Badge>
                  {event.externalUserId ? <Badge tone="neutral">User {event.externalUserId}</Badge> : null}
                  {event.externalAccountId ? <Badge tone="neutral">Account {event.externalAccountId}</Badge> : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
