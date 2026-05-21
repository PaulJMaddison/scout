import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Clock3,
  DatabaseZap,
  FileCheck2,
  Mail,
  ServerCog,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import { Badge, Button, Card, Field, Input, PageHeader, Panel, Textarea } from '@/components/ui/primitives'
import { pilotContactEmail, pilotLeadEndpoint, turnstileSiteKey } from '@/features/marketing/site-constants'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback': () => void
          theme: 'light'
        },
      ) => string
      remove: (widgetId: string) => void
    }
  }
}

interface PilotFormState {
  name: string
  workEmail: string
  company: string
  sourceSystems: string
  targetWorkflow: string
  website: string
}

const emptyPilotForm: PilotFormState = {
  name: '',
  workEmail: '',
  company: '',
  sourceSystems: '',
  targetWorkflow: '',
  website: '',
}

function getAttribution() {
  if (typeof window === 'undefined') {
    return {
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      utmTerm: '',
      utmContent: '',
      referrer: '',
      landingPagePath: '',
    }
  }
  const params = new URLSearchParams(window.location.search)
  return {
    utmSource: params.get('utm_source') ?? '',
    utmMedium: params.get('utm_medium') ?? '',
    utmCampaign: params.get('utm_campaign') ?? '',
    utmTerm: params.get('utm_term') ?? '',
    utmContent: params.get('utm_content') ?? '',
    referrer: document.referrer,
    landingPagePath: `${window.location.pathname}${window.location.search}`.slice(0, 500),
  }
}

function buildPilotMailto(form: PilotFormState) {
  const subject = encodeURIComponent(`Paid pilot scope request - ${form.company || 'KynticAI Scout'}`)
  const body = encodeURIComponent(
    [
      'Paid pilot scope request',
      '',
      `Name: ${form.name}`,
      `Work email: ${form.workEmail}`,
      `Company: ${form.company}`,
      '',
      'Source systems:',
      form.sourceSystems,
      '',
      'Target workflow:',
      form.targetWorkflow,
      '',
      'Please reply with availability for a paid pilot scoping call.',
    ].join('\n'),
  )

  return `mailto:${pilotContactEmail}?subject=${subject}&body=${body}`
}

export function PilotPage() {
  const [form, setForm] = useState<PilotFormState>(emptyPilotForm)
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'submitted' | 'failed'>('idle')
  const [spamChallengeToken, setSpamChallengeToken] = useState('')
  const turnstileRef = useRef<HTMLDivElement | null>(null)
  const mailtoHref = useMemo(() => buildPilotMailto(form), [form])

  useEffect(() => {
    if (!turnstileSiteKey || !turnstileRef.current) {
      return
    }

    let widgetId = ''
    const render = () => {
      if (!turnstileRef.current || !window.turnstile || widgetId) {
        return
      }
      widgetId = window.turnstile.render(turnstileRef.current, {
        sitekey: turnstileSiteKey,
        theme: 'light',
        callback: setSpamChallengeToken,
        'expired-callback': () => setSpamChallengeToken(''),
      })
    }

    if (!window.turnstile) {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = render
      document.head.appendChild(script)
    } else {
      render()
    }

    return () => {
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId)
      }
    }
  }, [])

  function updateField(field: keyof PilotFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pilotLeadEndpoint) {
      setSubmitState('submitting')
      try {
        const response = await fetch(pilotLeadEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            workEmail: form.workEmail,
            company: form.company,
            sourceSystems: form.sourceSystems,
            targetWorkflow: form.targetWorkflow,
            submissionSource: 'Website',
            website: form.website,
            spamChallengeToken,
            ...getAttribution(),
          }),
        })
        if (!response.ok) {
          throw new Error(`Lead submission failed with ${response.status}`)
        }
        setSubmitState('submitted')
        setForm(emptyPilotForm)
        setSpamChallengeToken('')
        return
      } catch {
        setSubmitState('failed')
      }
    }
    window.location.href = mailtoHref
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Paid pilot"
        title="Turn existing business data into trusted context for AI workflows in 2-6 weeks."
        description="KynticAI Scout is for teams that already have useful data in CRM, ERP, SQL databases, warehouses, support, billing, product, spreadsheets, or internal systems, but need a governed semantic layer that apps, workflows, reports, copilots, and agents can safely consume."
        actions={
          <a href="#pilot-request">
            <Button>
              Request paid pilot scope
              <ArrowRight className="size-4" />
            </Button>
          </a>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_15%_10%,rgba(220,180,145,0.22),transparent_30%),radial-gradient(circle_at_88%_5%,rgba(130,152,126,0.2),transparent_28%),linear-gradient(135deg,#16110d_0%,#211812_52%,#342419_100%)] px-7 py-8 text-ivory-50 shadow-[0_28px_80px_rgba(24,18,15,0.28)] sm:px-9">
          <div className="grid gap-7">
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">Verified generic SQL proof</Badge>
              <Badge tone="success">Customer-owned data plane</Badge>
              <Badge tone="neutral">No hosted raw operational data by default</Badge>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-copper-300">What the pilot proves</p>
              <h2 className="mt-4 max-w-4xl font-display text-[clamp(3rem,6vw,5.8rem)] leading-[0.94] text-ivory-50">
                From source data to reusable semantic context.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-ivory-200">
                The pilot connects one valuable slice of the existing estate, maps it through selectors, creates evidence-rich context facts and snapshots, then exposes that context to one downstream workflow or AI consumer.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['Source data in', 'SQL views, PostgreSQL tables, CSV exports, or scoped safe extracts selected during discovery.'],
                ['Selectors and facts', 'Mappings create confidence, freshness, provenance, masking, and audit-friendly semantic facts.'],
                ['Context out', 'GraphQL, REST, SDK-shaped consumers, reports, workflows, copilots, or agentic processes use the same contract.'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                  <p className="font-semibold text-ivory-50">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-ivory-200">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Panel eyebrow="Right buyer" title="For teams with a real workflow, not an AI experiment in search of a problem">
          <div className="grid gap-3">
            {[
              [BriefcaseBusiness, 'Commercial and operational leaders', 'You want existing data to improve sales, support, pricing, onboarding, retention, or workflow decisions without replacing core systems first.'],
              [ServerCog, 'CTO and platform teams', 'You need a repeatable semantic contract over existing databases, exports, APIs, and operational systems.'],
              [Workflow, 'Product and AI delivery teams', 'You want agents and AI-assisted workflows to work from evidence, freshness, provenance, and controlled context rather than raw records.'],
            ].map(([Icon, title, body]) => (
              <Card key={title as string} className="bg-ivory-25 shadow-none">
                <div className="flex items-start gap-3">
                  <Icon className="mt-1 size-5 text-copper-700" />
                  <div>
                    <p className="font-semibold text-ink-950">{title as string}</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">{body as string}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {[
          [DatabaseZap, 'Verified generic SQL connector proof', 'The public repo now includes a documented end-to-end SQL path: source rows, selector mapping, context facts, snapshots, API lookup response, and provenance trail.'],
          [ShieldCheck, 'Customer-owned data plane', 'Connector configuration, selectors, facts, snapshots, audit logs, and operational data stay in the customer-controlled environment by default.'],
          [ServerCog, 'Hosted control plane boundary', 'Future hosted cloud/control-plane services are for commercial metadata such as accounts, licences, downloads, updates, and support. They do not require raw customer operational data by default.'],
          [FileCheck2, 'Pilot includes and excludes', 'The pilot includes scoped discovery, one workflow, selected source systems, selector implementation, API exposure, and handover. It excludes hands-off SaaS, live payment signup, broad data migration, and unscoped vendor connector delivery.'],
          [Clock3, '2-6 week timeline', 'A starter pilot can usually fit a two to four week build after discovery. Production-style hardening, governance, and additional systems can extend the scope toward six weeks.'],
          [BadgeCheck, 'Anonymised ERP platform pattern', 'Recent ERP platform work showed the repeatable pattern: leave legacy systems in place, add semantic context over operational data, and feed new web and AI-enabled workflows.'],
        ].map(([Icon, title, body]) => (
          <Card key={title as string} className="bg-ivory-25">
            <Icon className="size-5 text-copper-700" />
            <h2 className="mt-4 font-display text-2xl text-ink-950">{title as string}</h2>
            <p className="mt-2 text-sm leading-7 text-ink-700">{body as string}</p>
          </Card>
        ))}
      </section>

      <Panel eyebrow="Why now" title="Trusted context for energy pricing, procurement, and operational AI workflows">
        <p className="max-w-5xl text-sm leading-7 text-ink-700">
          The sharpest first wedge is energy buying and pricing: contract data, usage signals, supplier terms, ERP records, pricing spreadsheets, and support context already exist, but they are often too fragmented for reliable workflow automation. Scout gives those systems a shared semantic layer so pricing reviews, procurement decisions, renewals, and AI-assisted operations can work from governed facts rather than scattered extracts.
        </p>
      </Panel>

      <section className="grid gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
        <Panel eyebrow="Scope" title="What a paid pilot includes">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              'Scoping workshop for one high-value workflow and buyer outcome.',
              'Source-system review for safe SQL, PostgreSQL, CSV, REST, or private connector access.',
              'Semantic attribute and selector design for the first context slice.',
              'Context fact and snapshot generation with confidence, freshness, provenance, and masking decisions.',
              'GraphQL or REST exposure for one downstream consumer.',
              'Production-readiness review covering secrets, PostgreSQL, backups, restore, observability, API clients, and support handover.',
            ].map((item) => (
              <Card key={item} className="bg-ivory-25 py-4 shadow-none">
                <p className="text-sm leading-7 text-ink-700">{item}</p>
              </Card>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Exclusions" title="What the pilot does not promise">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              'A complete self-serve SaaS account and billing platform.',
              'A broad replacement of CRM, ERP, warehouse, support, billing, or product systems.',
              'Unscoped paid vendor connectors in the public repository.',
              'Legal, regulatory, security, or data-protection sign-off without customer review.',
              'Guaranteed model accuracy or automated decisions without human approval.',
              'Hands-off production operations unless separately contracted.',
            ].map((item) => (
              <Card key={item} className="bg-ivory-25 py-4 shadow-none">
                <p className="text-sm leading-7 text-ink-700">{item}</p>
              </Card>
            ))}
          </div>
        </Panel>
      </section>

      <Panel eyebrow="Pilot request" title="Request a paid pilot scope" className="scroll-mt-6" action={<Mail className="size-5 text-copper-700" />}>
        <form id="pilot-request" className="grid gap-4" onSubmit={handleSubmit}>
          <Field label="Website" className="hidden">
            <Input
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={(event) => updateField('website', event.target.value)}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Name">
              <Input
                required
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                autoComplete="name"
              />
            </Field>
            <Field label="Work email">
              <Input
                required
                type="email"
                value={form.workEmail}
                onChange={(event) => updateField('workEmail', event.target.value)}
                autoComplete="email"
              />
            </Field>
            <Field label="Company">
              <Input
                required
                value={form.company}
                onChange={(event) => updateField('company', event.target.value)}
                autoComplete="organization"
              />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Source systems">
              <Textarea
                required
                value={form.sourceSystems}
                onChange={(event) => updateField('sourceSystems', event.target.value)}
                placeholder="For example: PostgreSQL, ERP, CRM, warehouse, support, billing, CSV exports"
              />
            </Field>
            <Field label="Target workflow">
              <Textarea
                required
                value={form.targetWorkflow}
                onChange={(event) => updateField('targetWorkflow', event.target.value)}
                placeholder="For example: pricing workflow, renewal risk, support prioritisation, sales recommendations"
              />
            </Field>
          </div>
          {turnstileSiteKey ? <div ref={turnstileRef} /> : null}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-900/8 bg-ivory-25 px-4 py-4">
            <p className="max-w-3xl text-sm leading-7 text-ink-700" aria-live="polite">
              {submitState === 'submitted'
                ? 'Thanks. The pilot request has been captured, and the next step is a scoping reply.'
                : pilotLeadEndpoint
                  ? 'Submitting sends this enquiry to the Scout pilot CRM. Do not include secrets, credentials, or raw operational data in the request.'
                  : <>Submitting opens a prefilled email to <a className="font-semibold text-copper-800 underline" href={`mailto:${pilotContactEmail}`}>{pilotContactEmail}</a>. Do not include secrets, credentials, or raw operational data in the request.</>}
              {submitState === 'failed' ? ' The CRM endpoint did not accept the request, so the email fallback will open.' : null}
            </p>
            <Button type="submit" disabled={submitState === 'submitting'}>
              {submitState === 'submitting' ? 'Submitting request' : 'Request paid pilot scope'}
            </Button>
          </div>
          <p className="text-sm leading-7 text-ink-700">
            The form collects your name, work email, company, source-system summary, target workflow, attribution metadata, and abuse-prevention signals so we can assess pilot fit and reply commercially. Do not submit raw operational data, credentials, source exports, support logs, documents, attachments, prompt content, or secrets. By submitting, you consent to commercial contact about the paid pilot. The <a className="font-semibold text-copper-800 underline" href="/privacy">privacy notice</a>, <a className="font-semibold text-copper-800 underline" href="/terms">terms</a>, cookie/event consent draft, pilot agreement outline, and data-processing assumptions are drafts pending solicitor review.
          </p>
        </form>
      </Panel>
    </div>
  )
}
