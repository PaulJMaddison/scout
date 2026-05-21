import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentPropsWithoutRef, PropsWithChildren, ReactNode } from 'react'
import { cn } from '@/lib/utils'

const buttonStyles = cva(
  'inline-flex max-w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold leading-5 whitespace-normal text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper-500/40 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-copper-500 text-ivory-50 shadow-[0_10px_30px_rgba(175,92,43,0.32)] hover:bg-copper-400',
        secondary: 'border border-ink-900/10 bg-ivory-50 text-ink-950 hover:bg-ivory-100',
        ghost: 'text-ink-700 hover:bg-ivory-100',
        danger: 'bg-rosewood-600 text-ivory-50 hover:bg-rosewood-500',
      },
      size: {
        sm: 'px-3 py-2 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-5 py-3 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export function Button({
  className,
  variant,
  size,
  ...props
}: ComponentPropsWithoutRef<'button'> & VariantProps<typeof buttonStyles>) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />
}

export function Card({
  className,
  children,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={cn(
        'rounded-[24px] border border-ink-900/8 bg-ivory-50/88 p-5 shadow-[0_18px_45px_rgba(24,18,15,0.08)] backdrop-blur sm:rounded-[28px] sm:p-6',
        'min-w-0 overflow-hidden',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function Panel({
  title,
  eyebrow,
  action,
  className,
  children,
}: PropsWithChildren<{
  title: string
  eyebrow?: string
  action?: ReactNode
  className?: string
}>) {
  return (
    <Card className={className}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-4 sm:mb-5">
        <div className="min-w-0 flex-1">
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage-700">{eyebrow}</p> : null}
          <h2 className="mt-2 break-words font-display text-lg leading-tight text-ink-950 sm:text-xl">{title}</h2>
        </div>
        {action ? <div className="max-w-full shrink-0">{action}</div> : null}
      </header>
      {children}
    </Card>
  )
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: PropsWithChildren<{
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent'
  className?: string
}>) {
  const toneClasses = {
    neutral: 'bg-ink-950/6 text-ink-700',
    success: 'bg-sage-600/14 text-sage-800',
    warning: 'bg-gold-500/18 text-umber-900',
    danger: 'bg-rosewood-500/14 text-rosewood-800',
    accent: 'bg-copper-500/14 text-copper-900',
  } satisfies Record<string, string>

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        'max-w-full break-words whitespace-normal leading-5 text-left',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: PropsWithChildren<{
  label: string
  hint?: string
  error?: string
  className?: string
}>) {
  return (
    <label className={cn('grid gap-2', className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-ink-900">{label}</span>
        {hint ? <span className="text-xs text-ink-500">{hint}</span> : null}
      </div>
      {children}
      {error ? <span className="text-xs font-medium text-rosewood-700">{error}</span> : null}
    </label>
  )
}

const inputBase =
  'min-w-0 w-full rounded-2xl border border-ink-900/10 bg-ivory-25 px-4 py-3 text-sm text-ink-950 shadow-inner shadow-white/40 outline-none transition placeholder:text-ink-500 focus:border-copper-400 focus:ring-4 focus:ring-copper-400/12'

export function Input(props: ComponentPropsWithoutRef<'input'>) {
  return <input className={cn(inputBase, props.className)} {...props} />
}

export function Select(props: ComponentPropsWithoutRef<'select'>) {
  return <select className={cn(inputBase, 'appearance-none', props.className)} {...props} />
}

export function Textarea(props: ComponentPropsWithoutRef<'textarea'>) {
  return (
    <textarea
      className={cn(inputBase, 'min-h-[140px] resize-y py-3', props.className)}
      {...props}
    />
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-end 2xl:justify-between">
      <div className="max-w-3xl min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage-700">{eyebrow}</p>
        <h1 className="mt-3 break-words font-display text-[clamp(2.4rem,4vw,4rem)] leading-[0.98] tracking-normal text-ink-950">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-700 sm:text-base">{description}</p>
      </div>
      {actions ? <div className="flex max-w-full flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  footnote,
  accent = 'copper',
}: {
  label: string
  value: string
  footnote: string
  accent?: 'copper' | 'sage' | 'gold'
}) {
  const tones = {
    copper: 'from-copper-500/18 to-transparent',
    sage: 'from-sage-500/18 to-transparent',
    gold: 'from-gold-500/18 to-transparent',
  }

  return (
    <Card className="relative overflow-hidden">
      <div className={cn('absolute inset-x-0 top-0 h-24 bg-gradient-to-b', tones[accent])} />
      <div className="relative">
        <p className="text-sm font-medium text-ink-600">{label}</p>
        <p className="mt-5 font-display text-[clamp(2rem,4vw,3rem)] leading-none text-ink-950">{value}</p>
        <p className="mt-3 text-sm leading-6 text-ink-600">{footnote}</p>
      </div>
    </Card>
  )
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <Card className="flex min-h-[220px] flex-col items-center justify-center text-center">
      <h3 className="font-display text-2xl text-ink-950">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-ink-600">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  )
}

export function Divider() {
  return <div className="h-px w-full bg-ink-900/8" />
}
