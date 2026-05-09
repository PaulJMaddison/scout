import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/primitives'
import { copyText, prettyJson } from '@/lib/utils'

export function JsonViewer({
  value,
  title,
  height = 'h-64',
}: {
  value: unknown
  title?: string
  height?: string
}) {
  const rendered = typeof value === 'string' ? value : prettyJson(value)

  return (
    <div className="overflow-hidden rounded-[24px] border border-ink-900/8 bg-ink-950">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ivory-300/70">
          {title ?? 'Structured payload'}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-ivory-100 hover:bg-white/10"
          onClick={() => void copyText(rendered)}
        >
          <Copy className="mr-2 size-4" />
          Copy
        </Button>
      </div>
      <pre className={`${height} overflow-auto px-4 py-4 text-xs leading-6 text-ivory-100`}>
        <code>{rendered}</code>
      </pre>
    </div>
  )
}
