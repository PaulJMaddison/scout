import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
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
    email: 'admin@scout.local',
    password: 'DemoAdmin123!',
  },
  {
    label: 'Sales rep',
    email: 'rep@scout.local',
    password: 'DemoSales123!',
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
      email: 'admin@scout.local',
      password: 'DemoAdmin123!',
    },
  })

  return (
    <main className="login-page relative min-h-[100dvh] overflow-x-hidden overflow-y-auto lg:h-[100dvh] lg:overflow-hidden">
      <div className="absolute inset-0 brand-paper" />
      <div className="login-shell relative grid min-h-[100dvh] w-full content-center gap-5 px-5 py-4 sm:px-8 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:items-center lg:gap-8 xl:px-12">
        <section className="login-hero-column min-w-0">
          <img
            src="/brand/kynticai-logo-lockup.png"
            alt="KynticAI"
            className="h-16 w-auto max-w-full"
          />
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-copper-700">
            KynticAI Scout demo console
          </p>
          <h1 className="login-hero-title mt-4 max-w-[14ch] font-display text-[clamp(3rem,5.4vw,5.2rem)] leading-[0.96] text-ink-950">
            Your data, your firewall, any AI model.
          </h1>
          <p className="login-hero-copy mt-4 max-w-2xl text-base leading-7 text-ink-700">
            Scout reads CRM records, warehouse metrics, product signals, and support history, then creates governed semantic profiles that apps, workflows, copilots, agents, and AI tools can cite, trust, and use.
          </p>

          <div className="login-compact-proof mt-5 flex flex-wrap gap-2">
            {[
              'Unified semantic layer',
              'Selector-driven enrichment',
              'Commercial-grade guardrails',
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-copper-400/22 bg-ivory-50/84 px-3 py-1.5 text-xs font-semibold tracking-[0.02em] text-ink-800"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <Card className="login-access-card ml-auto flex w-full max-w-[28rem] flex-col border-copper-500/14 p-5 sm:p-6 lg:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage-700">Workspace access</p>
            <h2 className="mt-2 font-display text-[2.35rem] leading-tight text-ink-950">Enter the admin console</h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              Sign in with a tenant-scoped operator account. The backend issues JWT access tokens, applies rate limits, and enforces role-based access for admin and sales workflows.
            </p>
          </div>

          <div className="mt-4 rounded-[20px] border border-sage-300/50 bg-sage-100/65 px-4 py-3 text-sm text-ink-800">
            <p className="font-semibold text-ink-950">Demo credentials are preloaded.</p>
            <p className="mt-1 leading-6">
              Tenant <span className="font-semibold">demo</span>, email <span className="font-semibold">admin@scout.local</span>, password <span className="font-semibold">DemoAdmin123!</span>.
            </p>
          </div>

          <form
            className="login-form mt-5 grid gap-4"
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

            <Button type="submit" size="lg" className="mt-2 w-full">
              {form.formState.isSubmitting ? 'Signing in…' : 'Enter console'}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </form>

          <div className="login-account-grid mt-4 grid gap-2 sm:grid-cols-2">
            {sampleAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                className="login-account-option rounded-[20px] border border-ink-900/8 bg-ivory-25 px-4 py-3 text-left transition hover:border-copper-400/60 hover:bg-copper-50/60"
                onClick={() => {
                  form.setValue('tenantSlug', 'demo', { shouldDirty: true })
                  form.setValue('email', account.email, { shouldDirty: true })
                  form.setValue('password', account.password, { shouldDirty: true })
                  setErrorMessage(null)
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink-950">{account.label}</p>
                  <span className="rounded-full bg-sage-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sage-800">
                    demo
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-ink-600">{account.email}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </main>
  )
}
