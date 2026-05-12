import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  DatabaseZap,
  Fingerprint,
  Loader2,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from 'lucide-react'
import { Badge, Button, Card, Field, Input, PageHeader, Select, Textarea } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import type { OnboardingResult, SubmitOnboardingInput } from '@/lib/types'
import { cn } from '@/lib/utils'

type StepKey = 'company' | 'systems' | 'ai' | 'governance' | 'review'

interface StepDefinition {
  key: StepKey
  title: string
  eyebrow: string
  description: string
  icon: typeof Building2
}

const steps: StepDefinition[] = [
  {
    key: 'company',
    title: 'Company and first admin',
    eyebrow: 'Step 1',
    description: 'Create the tenant, workspace, and first admin identity.',
    icon: Building2,
  },
  {
    key: 'systems',
    title: 'Existing systems',
    eyebrow: 'Step 2',
    description: 'Tell UCL where useful business context already lives.',
    icon: DatabaseZap,
  },
  {
    key: 'ai',
    title: 'AI-ready context goals',
    eyebrow: 'Step 3',
    description: 'Shape the starter semantic schema around the workflows you want to power.',
    icon: Sparkles,
  },
  {
    key: 'governance',
    title: 'Sensitivity and deployment',
    eyebrow: 'Step 4',
    description: 'Set the guardrails that influence next steps and production readiness.',
    icon: ShieldCheck,
  },
  {
    key: 'review',
    title: 'Review and provision',
    eyebrow: 'Step 5',
    description: 'Generate the starter workspace without storing connector credentials.',
    icon: Fingerprint,
  },
]

const sourceSystemOptions = [
  'Salesforce CRM',
  'HubSpot CRM',
  'Zendesk Support',
  'Stripe Billing',
  'Segment Events',
  'Snowflake Warehouse',
  'PostgreSQL',
  'Google Sheets',
  'Legacy SQL',
  'Marketo',
]

const dataCategoryOptions = [
  'CRM',
  'Product usage',
  'Support',
  'Billing',
  'Marketing',
  'Warehouse',
  'Spreadsheets',
  'Legacy SQL',
]

const aiUseCaseOptions = [
  'Sales copilot',
  'Customer health summarisation',
  'Support triage',
  'Renewal risk detection',
  'Executive account briefs',
  'Workflow automation',
  'Agentic data retrieval',
  'Personalised outreach',
]

const defaultForm: SubmitOnboardingInput = {
  organisationName: '',
  tenantSlug: '',
  primaryWorkspaceName: 'Revenue workspace',
  adminDisplayName: '',
  adminEmail: '',
  adminPassword: '',
  intendedUseCase: '',
  sourceSystems: ['Salesforce CRM', 'Zendesk Support', 'Snowflake Warehouse'],
  dataCategories: ['CRM', 'Support', 'Warehouse'],
  aiUseCases: ['Sales copilot', 'Executive account briefs'],
  piiSensitivityLevel: 'moderate',
  preferredDeploymentMode: 'local-demo',
}

export function OnboardingPage() {
  const [stepIndex, setStepIndex] = useState(0)
  const [form, setForm] = useState<SubmitOnboardingInput>(defaultForm)
  const [result, setResult] = useState<OnboardingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const currentStep = steps[stepIndex]
  const StepIcon = currentStep.icon

  function update<K extends keyof SubmitOnboardingInput>(key: K, value: SubmitOnboardingInput[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function updateOrganisationName(value: string) {
    setForm((current) => ({
      ...current,
      organisationName: value,
      tenantSlug: current.tenantSlug ? current.tenantSlug : slugify(value),
    }))
  }

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const response = await api.submitOnboarding(form)
      setResult(response)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Onboarding could not be completed.')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return <SuccessScreen result={result} form={form} onReset={() => setResult(null)} />
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Demo/private setup"
        title="Turn existing systems into trusted semantic context."
        description="Create a private starter workspace, admin account, semantic schema, and selector set. This flow is for local demos or deliberately enabled private setup only, and it stores no production connector credentials."
        actions={<Badge tone="success">Local/private setup</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-copper-400/14 blur-3xl" />
          <div className="relative grid gap-6">
            <StepRail activeIndex={stepIndex} />

            <section className="rounded-[28px] border border-ink-900/8 bg-white/45 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage-700">{currentStep.eyebrow}</p>
                  <h2 className="mt-2 font-display text-3xl leading-tight text-ink-950">{currentStep.title}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-650">{currentStep.description}</p>
                </div>
                <StepIcon className="size-9 text-copper-600" />
              </div>

              <div className="mt-7">
                {currentStep.key === 'company' ? (
                  <CompanyStep form={form} onUpdate={update} onOrganisationChange={updateOrganisationName} />
                ) : null}
                {currentStep.key === 'systems' ? <SystemsStep form={form} onUpdate={update} /> : null}
                {currentStep.key === 'ai' ? <AiStep form={form} onUpdate={update} /> : null}
                {currentStep.key === 'governance' ? <GovernanceStep form={form} onUpdate={update} /> : null}
                {currentStep.key === 'review' ? <ReviewStep form={form} /> : null}
              </div>
            </section>

            {error ? (
              <div className="rounded-3xl border border-rosewood-500/20 bg-rosewood-500/10 px-4 py-3 text-sm font-medium text-rosewood-800">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={stepIndex === 0 || submitting}
                onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              {stepIndex < steps.length - 1 ? (
                <Button
                  type="button"
                  disabled={!canContinue(form, currentStep.key)}
                  onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}
                >
                  Continue
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button type="button" disabled={!canSubmit(form) || submitting} onClick={() => void submit()}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Provision starter workspace
                </Button>
              )}
            </div>
          </div>
        </Card>

        <ContextPreview form={form} />
      </div>
    </div>
  )
}

function CompanyStep({
  form,
  onUpdate,
  onOrganisationChange,
}: {
  form: SubmitOnboardingInput
  onUpdate: <K extends keyof SubmitOnboardingInput>(key: K, value: SubmitOnboardingInput[K]) => void
  onOrganisationChange: (value: string) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Organisation name">
        <Input value={form.organisationName} onChange={(event) => onOrganisationChange(event.target.value)} placeholder="Acme Revenue Systems" />
      </Field>
      <Field label="Tenant slug" hint="lowercase, hyphen safe">
        <Input value={form.tenantSlug} onChange={(event) => onUpdate('tenantSlug', slugify(event.target.value))} placeholder="acme-revenue" />
      </Field>
      <Field label="Primary workspace name">
        <Input value={form.primaryWorkspaceName} onChange={(event) => onUpdate('primaryWorkspaceName', event.target.value)} placeholder="Revenue workspace" />
      </Field>
      <Field label="First admin name">
        <Input value={form.adminDisplayName} onChange={(event) => onUpdate('adminDisplayName', event.target.value)} placeholder="Dana Mercer" />
      </Field>
      <Field label="Admin email">
        <Input type="email" value={form.adminEmail} onChange={(event) => onUpdate('adminEmail', event.target.value)} placeholder="dana@example.com" />
      </Field>
      <Field label="Temporary admin password" hint="12+ chars">
        <Input type="password" value={form.adminPassword} onChange={(event) => onUpdate('adminPassword', event.target.value)} placeholder="Use a strong demo password" />
      </Field>
    </div>
  )
}

function SystemsStep({
  form,
  onUpdate,
}: {
  form: SubmitOnboardingInput
  onUpdate: <K extends keyof SubmitOnboardingInput>(key: K, value: SubmitOnboardingInput[K]) => void
}) {
  return (
    <div className="grid gap-7">
      <ChoiceGroup
        title="Source systems currently in use"
        description="These become starter data sources with mock connector configs."
        options={sourceSystemOptions}
        selected={form.sourceSystems}
        onToggle={(value) => onUpdate('sourceSystems', toggle(form.sourceSystems, value))}
      />
      <ChoiceGroup
        title="Data categories available"
        description="These influence which semantic attributes and selectors are generated."
        options={dataCategoryOptions}
        selected={form.dataCategories}
        onToggle={(value) => onUpdate('dataCategories', toggle(form.dataCategories, value))}
      />
    </div>
  )
}

function AiStep({
  form,
  onUpdate,
}: {
  form: SubmitOnboardingInput
  onUpdate: <K extends keyof SubmitOnboardingInput>(key: K, value: SubmitOnboardingInput[K]) => void
}) {
  return (
    <div className="grid gap-6">
      <Field label="Intended use case" hint="what success looks like">
        <Textarea
          value={form.intendedUseCase}
          onChange={(event) => onUpdate('intendedUseCase', event.target.value)}
          placeholder="Example: Give sales and support agents a trustworthy account brief assembled from CRM, product usage, billing, and support signals."
        />
      </Field>
      <ChoiceGroup
        title="AI use cases to power"
        description="UCL turns source-specific fields into reusable semantic context for these workflows."
        options={aiUseCaseOptions}
        selected={form.aiUseCases}
        onToggle={(value) => onUpdate('aiUseCases', toggle(form.aiUseCases, value))}
      />
    </div>
  )
}

function GovernanceStep({
  form,
  onUpdate,
}: {
  form: SubmitOnboardingInput
  onUpdate: <K extends keyof SubmitOnboardingInput>(key: K, value: SubmitOnboardingInput[K]) => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="PII sensitivity level">
        <Select
          value={form.piiSensitivityLevel}
          onChange={(event) => onUpdate('piiSensitivityLevel', event.target.value as SubmitOnboardingInput['piiSensitivityLevel'])}
        >
          <option value="low">Low: mostly non-sensitive metadata</option>
          <option value="moderate">Moderate: business contact data</option>
          <option value="high">High: user-level behavioural data</option>
          <option value="regulated">Regulated: special governance required</option>
        </Select>
      </Field>
      <Field label="Preferred deployment mode">
        <Select
          value={form.preferredDeploymentMode}
          onChange={(event) => onUpdate('preferredDeploymentMode', event.target.value as SubmitOnboardingInput['preferredDeploymentMode'])}
        >
          <option value="local-demo">Local demo</option>
          <option value="self-hosted">Self-hosted</option>
          <option value="managed-saas">Future managed control plane</option>
          <option value="private-cloud">Private cloud</option>
        </Select>
      </Field>
      <Card className="md:col-span-2 bg-sage-600/10 shadow-none">
        <div className="flex gap-3">
          <ShieldCheck className="mt-1 size-5 shrink-0 text-sage-700" />
          <div>
            <p className="font-semibold text-ink-950">Secure onboarding default</p>
            <p className="mt-1 text-sm leading-6 text-ink-650">
              This step creates starter sources, semantic definitions, and selector drafts. Real production credentials stay outside this setup flow and should be added later through connector registration.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

function ReviewStep({ form }: { form: SubmitOnboardingInput }) {
  const rows = [
    ['Tenant', form.tenantSlug],
    ['Workspace', form.primaryWorkspaceName],
    ['Admin', form.adminEmail],
    ['Systems', form.sourceSystems.join(', ')],
    ['Data categories', form.dataCategories.join(', ')],
    ['AI use cases', form.aiUseCases.join(', ')],
    ['PII level', form.piiSensitivityLevel],
    ['Deployment', form.preferredDeploymentMode],
  ]

  return (
    <div className="grid gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-2 rounded-2xl border border-ink-900/8 bg-ivory-50/70 px-4 py-3 sm:grid-cols-[150px_1fr]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">{label}</p>
          <p className="min-w-0 break-words text-sm font-medium text-ink-900">{value}</p>
        </div>
      ))}
    </div>
  )
}

function ChoiceGroup({
  title,
  description,
  options,
  selected,
  onToggle,
}: {
  title: string
  description: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div>
      <div className="mb-3">
        <p className="text-sm font-semibold text-ink-950">{title}</p>
        <p className="mt-1 text-sm leading-6 text-ink-600">{description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition',
                active
                  ? 'border-copper-500 bg-copper-500 text-ivory-50 shadow-[0_12px_26px_rgba(175,92,43,0.22)]'
                  : 'border-ink-900/10 bg-ivory-50 text-ink-700 hover:border-copper-300 hover:bg-copper-50',
              )}
              onClick={() => onToggle(option)}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepRail({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="grid gap-2 lg:grid-cols-5">
      {steps.map((step, index) => {
        const active = index === activeIndex
        const complete = index < activeIndex
        return (
          <div
            key={step.key}
            className={cn(
              'rounded-2xl border px-4 py-3 transition',
              active ? 'border-copper-400 bg-copper-500/12' : complete ? 'border-sage-500/20 bg-sage-500/10' : 'border-ink-900/8 bg-white/35',
            )}
          >
            <div className="flex items-center gap-2">
              {complete ? <CheckCircle2 className="size-4 text-sage-700" /> : <step.icon className="size-4 text-copper-700" />}
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">{step.eyebrow}</p>
            </div>
            <p className="mt-2 text-sm font-semibold leading-5 text-ink-950">{step.title}</p>
          </div>
        )
      })}
    </div>
  )
}

function ContextPreview({ form }: { form: SubmitOnboardingInput }) {
  const previewAttributes = inferAttributes(form)

  return (
    <aside className="grid content-start gap-4">
      <Card className="bg-ink-950 text-ivory-50">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper-300">Transformation preview</p>
        <h3 className="mt-3 font-display text-2xl leading-tight">Systems become semantic context</h3>
        <div className="mt-6 grid gap-3">
          <PreviewLane icon={DatabaseZap} label="Sources" items={form.sourceSystems} />
          <PreviewLane icon={Waypoints} label="Semantic layer" items={previewAttributes} />
          <PreviewLane icon={Sparkles} label="AI use cases" items={form.aiUseCases} />
        </div>
      </Card>
      <Card>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage-700">What gets created</p>
        <div className="mt-4 grid gap-3">
          <MiniOutcome label="Tenant" value={form.tenantSlug || 'tenant-slug'} />
          <MiniOutcome label="Workspace" value={form.primaryWorkspaceName || 'Primary workspace'} />
          <MiniOutcome label="Admin" value={form.adminEmail || 'admin@example.com'} />
          <MiniOutcome label="Starter selectors" value={`${previewAttributes.length} generated`} />
        </div>
      </Card>
    </aside>
  )
}

function PreviewLane({ icon: Icon, label, items }: { icon: typeof DatabaseZap; label: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-copper-300" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ivory-300">{label}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(items.length ? items : ['Waiting for input']).map((item) => (
          <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-ivory-100">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function MiniOutcome({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-ivory-100/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">{label}</p>
      <p className="mt-1 min-w-0 break-words text-sm font-semibold text-ink-950">{value}</p>
    </div>
  )
}

function SuccessScreen({
  result,
  form,
  onReset,
}: {
  result: OnboardingResult
  form: SubmitOnboardingInput
  onReset: () => void
}) {
  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Workspace provisioned"
        title="Your starter context layer is ready."
        description="The backend created a tenant, workspace, admin account, starter semantic schema, published starter selectors, setup state, and audit events. Connector entries are safe placeholders only."
        actions={<Badge tone="success">Tenant: {result.tenantSlug}</Badge>}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <div className="flex items-start gap-4">
            <div className="rounded-3xl bg-sage-500/14 p-3 text-sage-800">
              <CheckCircle2 className="size-7" />
            </div>
            <div>
              <h2 className="font-display text-3xl text-ink-950">{form.organisationName}</h2>
              <p className="mt-2 text-sm leading-6 text-ink-650">
                Workspace `{result.workspaceSlug}` was generated with {result.createdDataSources.length} starter sources, {result.createdSemanticAttributes.length} semantic attributes, and {result.createdSelectors.length} selectors.
              </p>
            </div>
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-2">
            <MiniOutcome label="Tenant ID" value={result.tenantId} />
            <MiniOutcome label="Workspace ID" value={result.workspaceId} />
            <MiniOutcome label="Admin operator ID" value={result.adminOperatorAccountId} />
            <MiniOutcome label="Onboarding application" value={result.onboardingApplicationId} />
          </div>
          <div className="mt-7 flex flex-wrap gap-2">
            {result.createdSemanticAttributes.map((attribute) => (
              <Badge key={attribute} tone="accent">{attribute}</Badge>
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage-700">Next steps</p>
          <div className="mt-4 grid gap-3">
            {result.nextSteps.map((step) => (
              <a key={step.title} href={step.action} className="rounded-2xl border border-ink-900/8 bg-ivory-100/80 p-4 transition hover:border-copper-300 hover:bg-copper-50">
                <p className="font-semibold text-ink-950">{step.title}</p>
                <p className="mt-1 text-sm leading-6 text-ink-600">{step.description}</p>
              </a>
            ))}
          </div>
          <Button type="button" variant="secondary" className="mt-5 w-full" onClick={onReset}>
            Start another onboarding
          </Button>
        </Card>
      </div>
    </div>
  )
}

function canContinue(form: SubmitOnboardingInput, step: StepKey) {
  if (step === 'company') {
    return Boolean(form.organisationName && form.tenantSlug && form.primaryWorkspaceName && form.adminDisplayName && form.adminEmail && form.adminPassword.length >= 12)
  }
  if (step === 'systems') {
    return form.sourceSystems.length > 0 && form.dataCategories.length > 0
  }
  if (step === 'ai') {
    return Boolean(form.intendedUseCase.trim() && form.aiUseCases.length > 0)
  }
  return true
}

function canSubmit(form: SubmitOnboardingInput) {
  return steps.every((step) => canContinue(form, step.key))
}

function toggle(values: string[], value: string) {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value]
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)
}

function inferAttributes(form: SubmitOnboardingInput) {
  const attributes = ['customerIdentity', 'aiReadinessSummary']
  const categories = form.dataCategories.join(' ').toLowerCase()
  if (categories.includes('crm')) {
    attributes.push('accountHealth', 'buyingIntent')
  }
  if (categories.includes('product') || categories.includes('usage')) {
    attributes.push('productUsageMaturity')
  }
  if (categories.includes('support')) {
    attributes.push('supportRisk')
  }
  if (categories.includes('billing')) {
    attributes.push('billingReadiness')
  }
  if (categories.includes('marketing')) {
    attributes.push('marketingEngagement')
  }
  if (categories.includes('warehouse') || categories.includes('sql') || categories.includes('spreadsheet')) {
    attributes.push('sourceCoverage')
  }
  return [...new Set(attributes)]
}
