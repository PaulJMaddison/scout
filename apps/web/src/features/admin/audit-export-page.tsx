import { useMutation, useQuery } from '@tanstack/react-query'
import { Download, FileArchive, ShieldCheck } from 'lucide-react'
import { Badge, Button, Card, PageHeader, Panel } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import { formatDateTime } from '@/lib/utils'
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '@/features/admin/admin-components'

function download(filename: string, content: string, contentType: string) {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function AuditExportPage() {
  const { session } = useAuthSession()
  const tenantSlug = session?.tenantSlug ?? 'demo'
  const auditQuery = useQuery({
    queryKey: ['auditEvents', tenantSlug],
    queryFn: () => api.getAuditEvents(tenantSlug),
    enabled: Boolean(session),
  })
  const exportMutation = useMutation({
    mutationFn: (format: 'json' | 'csv') => api.exportAuditEvents(tenantSlug, format),
    onSuccess: (result) => download(result.fileName, result.content, result.contentType),
  })

  if (!session) {
    return null
  }

  const events = auditQuery.data ?? []

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Audit export"
        title="Export tenant audit evidence for security review, onboarding, and customer assurance."
        description="The export uses the same tenant-isolated audit stream as the console and records an audit event when an administrator creates a file."
        actions={<Badge tone="warning">Exports include up to the latest 1,000 events</Badge>}
      />

      {auditQuery.isLoading ? <AdminLoadingState label="Loading audit stream" /> : null}
      {auditQuery.isError ? <AdminErrorState error={auditQuery.error} /> : null}

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel eyebrow="Create export" title="Choose an evidence file format">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-ivory-25 shadow-none">
              <FileArchive className="size-6 text-copper-700" />
              <p className="mt-4 font-semibold text-ink-950">JSON export</p>
              <p className="mt-2 text-sm leading-6 text-ink-700">Best for incident review, automated checks, or preserving full metadata fields.</p>
              <Button className="mt-4" type="button" onClick={() => exportMutation.mutate('json')} disabled={exportMutation.isPending}>
                <Download className="size-4" />
                Export JSON
              </Button>
            </Card>
            <Card className="bg-ivory-25 shadow-none">
              <ShieldCheck className="size-6 text-sage-700" />
              <p className="mt-4 font-semibold text-ink-950">CSV export</p>
              <p className="mt-2 text-sm leading-6 text-ink-700">Best for customer security questionnaires, spreadsheets, and quick filtering.</p>
              <Button className="mt-4" type="button" variant="secondary" onClick={() => exportMutation.mutate('csv')} disabled={exportMutation.isPending}>
                <Download className="size-4" />
                Export CSV
              </Button>
            </Card>
          </div>
          {exportMutation.isError ? <p className="mt-4 text-sm font-semibold text-rosewood-700">{exportMutation.error.message}</p> : null}
        </Panel>

        <Panel eyebrow="Preview" title="Latest audit events">
          {events.length === 0 && !auditQuery.isLoading ? (
            <AdminEmptyState title="No audit events yet" body="Audit records will appear when users sign in, selectors change, context is read, API clients rotate, or exports are created." />
          ) : (
            <div className="grid gap-3">
              {events.slice(0, 8).map((event) => (
                <Card key={event.id} className="bg-ivory-25 p-4 shadow-none">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-950">{event.action}</p>
                      <p className="mt-1 text-sm text-ink-600">{event.actor} · {event.entityType}</p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-ink-500">{formatDateTime(event.createdAtUtc)}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </div>
  )
}
