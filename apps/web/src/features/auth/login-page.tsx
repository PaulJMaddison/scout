import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight, KeyRound, Layers2, ShieldCheck, Sparkles } from 'lucide-react'
import { Button, Card, Field, Input } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'

const loginSchema = z.object({
  tenantSlug: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

type LoginFormValues = z.infer<typeof loginSchema>

const sampleAccounts = [
  {
    label: 'Tenant admin',
    email: 'admin@contextlayer.local',
    password: 'DemoAdmin123!',
    note: 'Full console access, selector publishing, audit, and operations visibility.',
  },
  {
    label: 'Sales rep',
    email: 'rep@contextlayer.local',
    password: 'DemoSales123!',
    note: 'Grounded customer context, recommendations, and recompute access with PII masking.',
  },
] as const

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuthSession()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      tenantSlug: 'demo',
      email: 'admin@contextlayer.local',
      password: 'DemoAdmin123!',
    },
  })

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(175,92,43,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(115,133,107,0.16),transparent_28%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-8 px-6 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-700">
            Context Layer
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.02] tracking-tight text-ink-950 lg:text-7xl">
            Business-aware context for every agentic decision.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-700">
            Turn raw CRM records, warehouse metrics, product signals, and connector payloads into grounded semantic context that sales teams and AI agents can actually trust.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Layers2,
                title: 'Unified semantic layer',
                body: 'Map operational systems into canonical customer meaning instead of raw IDs and disconnected metrics.',
              },
              {
                icon: Sparkles,
                title: 'Selector-driven enrichment',
                body: 'Preview transformations, inspect provenance, and publish attribute logic with confidence trails.',
              },
              {
                icon: ShieldCheck,
                title: 'Commercial-grade guardrails',
                body: 'Deliver structured payloads, traceable context facts, and explainable recommendations.',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.title} className="min-h-[220px]">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-copper-500/12 text-copper-700">
                    <Icon className="size-6" />
                  </div>
                  <h2 className="mt-6 font-display text-2xl text-ink-950">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-ink-700">{item.body}</p>
                </Card>
              )
            })}
          </div>
        </section>

        <Card className="mx-auto w-full max-w-xl p-8 lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage-700">Workspace access</p>
            <h2 className="mt-3 font-display text-3xl text-ink-950">Enter the admin console</h2>
            <p className="mt-3 text-sm leading-7 text-ink-700">
              Sign in with a tenant-scoped operator account. The backend issues JWT access tokens, applies rate limits, and enforces role-based access for admin and sales workflows.
            </p>
          </div>

          <form
            className="mt-8 grid gap-5"
            onSubmit={form.handleSubmit(async (values) => {
              setErrorMessage(null)
              try {
                const session = await api.login(values)
                signIn(session)
                await navigate({ to: '/demo' })
              } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in.')
              }
            })}
          >
            <Field label="Tenant slug" error={form.formState.errors.tenantSlug?.message}>
              <Input {...form.register('tenantSlug')} />
            </Field>

            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register('email')} />
            </Field>

            <Field label="Password" error={form.formState.errors.password?.message}>
              <Input type="password" autoComplete="current-password" {...form.register('password')} />
            </Field>

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-300/70 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {errorMessage}
              </div>
            ) : null}

            <Button type="submit" size="lg" className="mt-3 w-full">
              {form.formState.isSubmitting ? 'Signing in…' : 'Enter console'}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </form>

          <div className="mt-8 grid gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
              <KeyRound className="size-4" />
              Seed accounts
            </div>
            {sampleAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                className="rounded-[24px] border border-ink-900/8 bg-ivory-25 px-4 py-4 text-left transition hover:border-copper-400/60 hover:bg-copper-50/60"
                onClick={() => {
                  form.setValue('tenantSlug', 'demo', { shouldDirty: true })
                  form.setValue('email', account.email, { shouldDirty: true })
                  form.setValue('password', account.password, { shouldDirty: true })
                  setErrorMessage(null)
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink-950">{account.label}</p>
                  <span className="rounded-full bg-sage-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sage-800">
                    demo
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-700">{account.email}</p>
                <p className="mt-3 text-sm leading-6 text-ink-600">{account.note}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </main>
  )
}
