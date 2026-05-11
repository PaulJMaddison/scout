import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Badge, Card, EmptyState } from '@/components/ui/primitives'
import { formatDateTime } from '@/lib/utils'

export function AdminLoadingState({ label = 'Loading admin data' }: { label?: string }) {
  return (
    <Card className="min-h-[220px] animate-pulse bg-ivory-50/70">
      <p className="text-sm font-semibold text-ink-700">{label}…</p>
    </Card>
  )
}

export function AdminErrorState({ error }: { error: unknown }) {
  return (
    <Card className="border-rosewood-500/20 bg-rosewood-500/8">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-1 size-5 text-rosewood-700" />
        <div>
          <p className="font-semibold text-rosewood-800">This admin view could not be loaded.</p>
          <p className="mt-2 text-sm leading-6 text-rosewood-700">
            {error instanceof Error ? error.message : 'The backend returned an unexpected error.'}
          </p>
        </div>
      </div>
    </Card>
  )
}

export function AdminEmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return <EmptyState title={title} body={body} action={action} />
}

export function DetailRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-ink-900/8 bg-ivory-25 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage-700">{label}</p>
      <div className="mt-2 break-words text-sm font-semibold text-ink-950">{value ?? '—'}</div>
    </div>
  )
}

export function StatusBadge({ value }: { value?: string | null }) {
  const normalized = value?.toLowerCase() ?? ''
  const tone =
    normalized.includes('active') || normalized.includes('processed') || normalized.includes('imported')
      ? 'success'
      : normalized.includes('failed') || normalized.includes('revoked') || normalized.includes('dead')
        ? 'danger'
        : normalized.includes('pending') || normalized.includes('uploaded') || normalized.includes('trial')
          ? 'warning'
          : 'neutral'
  return <Badge tone={tone}>{value ?? 'Unknown'}</Badge>
}

export function Timestamp({ value }: { value?: string | null }) {
  return <span>{value ? formatDateTime(value) : 'Not recorded'}</span>
}
