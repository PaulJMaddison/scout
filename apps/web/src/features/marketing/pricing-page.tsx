import { Link } from '@tanstack/react-router'
import { ArrowRight, Building2, CloudCog, GitBranch, LockKeyhole, ServerCog } from 'lucide-react'
import { Badge, Button, Card, PageHeader, Panel } from '@/components/ui/primitives'
import { BeforeAfter } from '@/features/marketing/marketing-components'

const plans = [
  {
    name: 'Free open core',
    label: 'Available now',
    body: 'Run the local demo, inspect the open source core, and understand selectors, snapshots, REST, GraphQL, SDKs, and fictional seed data.',
    bestFor: 'Learning, internal evaluation, technical due diligence',
  },
  {
    name: 'Discovery workshop',
    label: 'GBP 1,500-3,000',
    body: 'Map the first workflow, source systems, governance constraints, customer data-plane shape, and pilot success criteria before implementation starts. Usually credited against a paid pilot agreed within 30 days.',
    bestFor: 'Buyers deciding where the first pilot should land',
  },
  {
    name: 'Starter paid pilot',
    label: 'GBP 7,500-15,000',
    body: 'Implementation-led pilot for one workflow, one environment, selected source systems or safe exports, and one downstream consumer.',
    bestFor: 'Teams proving value in two to four weeks',
  },
  {
    name: 'Production pilot',
    label: 'GBP 20,000-45,000',
    body: 'Production-style customer data plane with PostgreSQL, production secrets, backup/restore review, scoped API clients, masking, audit, and handover.',
    bestFor: 'Teams preparing for real operational use',
  },
  {
    name: 'Enterprise/private deployment',
    label: 'Scoped from GBP 50,000',
    body: 'Private enterprise connector modules, governance hardening, customer-specific deployment design, and support model through a paid agreement.',
    bestFor: 'Larger or regulated estates',
  },
  {
    name: 'Future private cloud/control plane',
    label: 'Future/private work',
    body: 'Hosted account management, billing, licences, downloads, support access, update channels, entitlement metadata, and optional aggregate usage.',
    bestFor: 'Customers that later want managed commercial operations',
  },
]

export function PricingPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Pricing and deployment"
        title="What you can use now, what you can buy as a paid pilot, and what remains future control-plane work."
        description="There is no live card payment, self-service subscription, or complete managed control-plane operation in the public repository. The commercial path today is open core plus supported paid pilot, with private enterprise modules and future cloud/control-plane work scoped separately."
        actions={
          <>
            <Link to="/docs">
              <Button>
                See billing foundations
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/open-core">
              <Button variant="secondary">Open core boundary</Button>
            </Link>
          </>
        }
      />

      <Panel eyebrow="What you can buy now" title="The practical commercial motion is implementation-led">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Discovery workshop', 'GBP 1,500-3,000 to pick the first workflow, source systems, customer data-plane shape, and success criteria.'],
            ['Starter paid pilot', 'GBP 7,500-15,000 for one workflow, selected source systems or safe exports, and one useful consumer.'],
            ['Production pilot', 'GBP 20,000-45,000 for PostgreSQL, secrets, backups, audit, masking, and customer handover.'],
          ].map(([title, body]) => (
            <Card key={title} className="bg-ivory-25">
              <p className="font-semibold text-ink-950">{title}</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">{body}</p>
            </Card>
          ))}
        </div>
      </Panel>

      <section className="grid gap-4 xl:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className="bg-ivory-25">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-3xl text-ink-950">{plan.name}</h2>
              <Badge tone={plan.name === 'Enterprise' ? 'accent' : 'neutral'}>{plan.label}</Badge>
            </div>
            <p className="mt-4 text-sm leading-7 text-ink-700">{plan.body}</p>
            <div className="mt-5 rounded-2xl border border-ink-900/8 bg-white/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage-700">Best for</p>
              <p className="mt-2 text-sm font-semibold text-ink-950">{plan.bestFor}</p>
            </div>
          </Card>
        ))}
      </section>

      <Panel eyebrow="Deployment options" title="Choose the operating model before choosing the commercial model">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            [GitBranch, 'Open source core', 'Run locally with SQLite and fictional seed data. Useful for evaluation and learning.'],
            [ServerCog, 'Self-hosted backend', 'Deploy the API and workers with PostgreSQL while retaining your own operations model.'],
            [CloudCog, 'Future control plane', 'Use a hosted control plane when speed and managed operations matter more than owning runtime.'],
            [LockKeyhole, 'Private cloud', 'Use stronger tenant isolation, regional deployment, and enterprise governance controls.'],
            [Building2, 'Integration layer', 'Embed UCL behind a product or internal platform as the semantic contract over source systems.'],
          ].map(([Icon, title, body]) => (
            <Card key={title as string} className="bg-[linear-gradient(180deg,rgba(255,248,240,0.96),rgba(252,246,239,0.96))]">
              <Icon className="size-5 text-copper-700" />
              <p className="mt-4 font-semibold text-ink-950">{title as string}</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">{body as string}</p>
            </Card>
          ))}
        </div>
      </Panel>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel eyebrow="Commercial boundary" title="What is intentionally not in the public repo">
          <BeforeAfter
            before={[
              'No live payment-provider integration is bundled.',
              'No paid CRM, warehouse, support, ERP, email, chat, calendar, analytics, issue, project, or knowledge-system connector implementation is shipped.',
              'No hands-off self-service account, licence, support, or hosted billing portal is included.',
            ]}
            after={[
              'Clean billing-provider interfaces and no-op provider defaults are present.',
              'Connector, credential, health-check, and catalogue extension points are safe to build against.',
              'The open core remains credible while paid pilot delivery, private connector modules, and future control-plane work can live outside the public repository.',
            ]}
          />
        </Panel>

        <Panel eyebrow="What is not self-serve yet" title="Do not confuse the pilot offer with complete SaaS operations">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              'Live card payment',
              'Hosted account portal',
              'Licence portal',
              'Support portal',
              'Automated connector provisioning',
              'Vendor-certified connector delivery',
              'Hands-off production operations',
              'Customer-specific compliance sign-off',
            ].map((item) => (
              <Card key={item} className="bg-ivory-25 py-4 shadow-none">
                <p className="text-sm font-semibold text-ink-950">{item}</p>
              </Card>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  )
}
