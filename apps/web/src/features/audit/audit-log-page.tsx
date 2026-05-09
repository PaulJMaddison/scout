import { useDeferredValue, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { Badge, Card, Input, PageHeader, Panel } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import { formatDateTime } from '@/lib/utils'

export function AuditLogPage() {
  const { session } = useAuthSession()
  const [search, setSearch] = useState('')
  const [visibleCount, setVisibleCount] = useState(30)
  const tenantSlug = session?.tenantSlug ?? 'demo'

  const auditQuery = useQuery({
    queryKey: ['auditEvents', tenantSlug],
    queryFn: () => api.getAuditEvents(tenantSlug),
    enabled: Boolean(session),
  })

  const deferredSearch = useDeferredValue(search)
  const filteredEvents = useMemo(() => {
    const term = deferredSearch.toLowerCase().trim()
    return (auditQuery.data ?? []).filter((event) =>
      [event.action, event.actor, event.entityType, event.entityId]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [auditQuery.data, deferredSearch])
  const visibleEvents = filteredEvents.slice(0, visibleCount)

  if (!session) {
    return null
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Change intelligence"
        title="Audit log"
        description="Review mutations, recomputes, publishes, and agent activity across the workspace. This view is optimized for operational traceability rather than raw event volume."
      />

      <Panel eyebrow="Event stream" title="Recent audit events">
        <div className="mb-5 relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setVisibleCount(30)
            }}
            className="pl-11"
            placeholder="Search action, actor, entity, or id"
          />
        </div>

        <div className="grid gap-3">
          {visibleEvents.map((event) => (
            <Card key={event.id} className="bg-ivory-25">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words font-semibold text-ink-950">{event.action}</p>
                    <Badge tone="neutral">{event.entityType}</Badge>
                  </div>
                  <p className="mt-2 break-all text-sm text-ink-700">
                    Actor: {event.actor} · Entity: {event.entityId}
                  </p>
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-ink-500">
                  {formatDateTime(event.createdAtUtc)}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {visibleCount < filteredEvents.length ? (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              className="rounded-full border border-ink-900/10 bg-ivory-50 px-4 py-2 text-sm font-semibold text-ink-900 transition hover:bg-ivory-100"
              onClick={() => setVisibleCount((current) => current + 30)}
            >
              Show more events
            </button>
          </div>
        ) : null}
      </Panel>
    </div>
  )
}
