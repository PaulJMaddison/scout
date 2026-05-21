import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui/primitives'
import { copyText } from '@/lib/utils'

export function CodeBlock({
  title,
  code,
  language = 'text',
  copyable = false,
}: {
  title: string
  code: string
  language?: string
  copyable?: boolean
}) {
  const [copied, setCopied] = useState(false)

  return (
    <Card className="bg-ink-950 text-ivory-50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-copper-300">{title}</p>
          <p className="mt-1 text-xs text-ivory-300/70">{language}</p>
        </div>
        {copyable ? (
          <Button
            type="button"
            variant="secondary"
            className="border-white/12 bg-white/8 text-ivory-100 hover:bg-white/14"
            onClick={async () => {
              await copyText(code)
              setCopied(true)
              setTimeout(() => setCopied(false), 1800)
            }}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        ) : null}
      </div>
      <pre className="mt-4 overflow-x-auto rounded-[20px] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-ivory-100">
        <code>{code}</code>
      </pre>
    </Card>
  )
}

export function FlowStep({
  step,
  title,
  body,
  tone = 'accent',
}: {
  step: string
  title: string
  body: string
  tone?: 'accent' | 'success' | 'warning' | 'neutral'
}) {
  return (
    <Card className="bg-ivory-25">
      <Badge tone={tone}>{step}</Badge>
      <h3 className="mt-4 font-display text-2xl text-ink-950">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-ink-700">{body}</p>
    </Card>
  )
}

export function Timeline({
  items,
}: {
  items: Array<{
    label: string
    title: string
    body: string
  }>
}) {
  return (
    <div className="relative grid gap-4">
      <div className="absolute left-5 top-5 hidden h-[calc(100%-2.5rem)] w-px bg-ink-900/10 md:block" />
      {items.map((item, index) => (
        <div key={item.title} className="relative grid gap-3 md:grid-cols-[3.5rem_1fr]">
          <div className="relative z-10 flex size-10 items-center justify-center rounded-full bg-ink-950 text-sm font-semibold text-ivory-50">
            {index + 1}
          </div>
          <Card className="bg-ivory-25 shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper-700">{item.label}</p>
            <h3 className="mt-3 font-display text-2xl text-ink-950">{item.title}</h3>
            <p className="mt-2 text-sm leading-7 text-ink-700">{item.body}</p>
          </Card>
        </div>
      ))}
    </div>
  )
}

export function BeforeAfter({
  before,
  after,
}: {
  before: Array<string>
  after: Array<string>
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-rosewood-500/16 bg-rosewood-500/8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rosewood-800">Before Scout</p>
        <div className="mt-4 grid gap-3">
          {before.map((line) => (
            <p key={line} className="rounded-2xl bg-white/60 px-4 py-3 text-sm leading-6 text-ink-800">
              {line}
            </p>
          ))}
        </div>
      </Card>
      <Card className="border-sage-600/16 bg-sage-600/10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage-800">After Scout</p>
        <div className="mt-4 grid gap-3">
          {after.map((line) => (
            <p key={line} className="rounded-2xl bg-white/60 px-4 py-3 text-sm leading-6 text-ink-800">
              {line}
            </p>
          ))}
        </div>
      </Card>
    </div>
  )
}

export function FaqCard({
  question,
  answer,
}: {
  question: string
  answer: string
}) {
  return (
    <details className="rounded-[24px] border border-ink-900/8 bg-ivory-50/88 p-5 shadow-[0_18px_45px_rgba(24,18,15,0.08)]">
      <summary className="cursor-pointer list-none pr-6 font-semibold text-ink-950">
        {question}
      </summary>
      <p className="mt-4 text-sm leading-7 text-ink-700">{answer}</p>
    </details>
  )
}
