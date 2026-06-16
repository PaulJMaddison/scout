import { Link } from '@tanstack/react-router'
import { ArrowRight, BarChart3, Headphones, Megaphone, Rocket, ShieldAlert, UsersRound } from 'lucide-react'
import { Badge, Button, Card, PageHeader, Panel } from '@/components/ui/primitives'
import { BeforeAfter, Timeline } from '@/features/marketing/marketing-components'

const useCases = [
  {
    title: 'Sales recommendations',
    audience: 'Revenue teams',
    body: 'Turn email reply, meeting booked, web search, pricing visit, registration, CRM contact, opportunity, product usage, billing, support, and won/lost outcome signals into a next-best-action recommendation.',
    icon: UsersRound,
  },
  {
    title: 'Customer success health',
    audience: 'CS and account management',
    body: 'Combine onboarding, adoption, support, billing, engagement, and similar retained/lost patterns into trusted health signals that show whether the account needs help, expansion, or review.',
    icon: BarChart3,
  },
  {
    title: 'Support prioritisation',
    audience: 'Support operations',
    body: 'Put ticket severity in context with account value, renewal risk, product adoption, billing status, and relationship state so teams can prioritise with evidence.',
    icon: Headphones,
  },
  {
    title: 'Product onboarding',
    audience: 'Product leaders',
    body: 'Give onboarding flows and in-product assistants structured context about where a customer is blocked, which features they use, and what success looks like.',
    icon: Rocket,
  },
  {
    title: 'Marketing personalisation',
    audience: 'Growth and lifecycle',
    body: 'Use shared semantic attributes such as lifecycle stage, product fit, and preferred channel instead of bespoke joins for each campaign.',
    icon: Megaphone,
  },
  {
    title: 'Risk and governance',
    audience: 'Ops and compliance',
    body: 'Expose freshness, confidence, provenance, masking, and audit trails so AI-assisted workflows can be reviewed and controlled.',
    icon: ShieldAlert,
  },
]

export function UseCasesPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Use cases"
        title="Turn authorised customer data into evidence-backed recommendations across sales, support, product, marketing, and operations."
        description="The same customer-owned data plane can serve many teams because selectors turn source data into trusted evidence once, then expose it through context snapshots, APIs, SDKs, and governed packages."
        actions={
          <>
            <Link to="/demo">
              <Button>
                See the sales walkthrough
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/integrations">
              <Button variant="secondary">How integrations work</Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel eyebrow="Workflow example" title="From raw customer signals to better AI sales recommendations">
          <Timeline
            items={[
              {
                label: 'Source estate',
                title: 'Signals already exist across the business',
                body: 'Email address, replies, meetings booked, web searches, pricing visits, registrations, CRM contacts, opportunities, support tickets, product usage, billing status, and won/lost outcomes remain in their current systems.',
              },
              {
                label: 'Selectors',
                title: 'Signals become trusted commercial evidence',
                body: 'Selectors calculate attributes such as conversion probability, support drag, budget readiness, plan interest, similar successful pattern, and recommended next action.',
              },
              {
                label: 'Context package',
                title: 'The local AI consumer receives a structured brief',
                body: 'The package includes allowed facts, confidence, provenance, freshness, masking decisions, similar-pattern references, and warnings when supporting evidence is weak.',
              },
              {
                label: 'Outcome',
                title: 'The recommendation is clearer and easier to defend',
                body: 'Sales teams see why a recommendation exists, which source systems contributed, and whether the data is fresh enough to act on. The goal is to increase conversion probability, not guarantee a sale.',
              },
            ]}
          />
        </Panel>

        <Panel eyebrow="Before and after" title="What changes for teams">
          <BeforeAfter
            before={[
              'Each team builds its own data interpretation in spreadsheets, SQL views, prompts, or product code.',
              'AI tools are asked to infer business meaning from raw records and inconsistent field names.',
              'Recommendations are hard to trust because source evidence and freshness are not visible.',
            ]}
            after={[
              'Shared selectors define how raw data becomes canonical facts for every consumer.',
              'AI agents receive structured context with confidence, provenance, freshness, and masking.',
              'Business users can inspect the evidence behind recommendations and workflows.',
            ]}
          />
        </Panel>
      </section>

      <Panel eyebrow="Outcome catalogue" title="Use cases grouped by business outcome, not by technology">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {useCases.map(({ title, audience, body, icon: Icon }) => (
            <Card key={title} className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-copper-500/12 text-copper-800">
                  <Icon className="size-5" />
                </div>
                <div>
                  <Badge tone="neutral">{audience}</Badge>
                  <h2 className="mt-4 font-display text-2xl text-ink-950">{title}</h2>
                  <p className="mt-2 text-sm leading-7 text-ink-700">{body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Anonymised ERP platform pattern" title="The same pattern works beyond the sales demo">
        <p className="text-sm leading-7 text-ink-700">
          A recent ERP platform engagement showed why this matters. Legacy databases, CRM-style records, operational systems, and fragmented business data were not replaced first. A semantic data plane over existing data let a new web platform and AI-enabled workflows consume customer, account, workflow, and operational meaning. Scout productises that pattern for paid pilots while keeping the customer-specific mappings and data under customer control.
        </p>
      </Panel>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          ['CEO view', 'Use existing data to improve sales, retention, support, and customer experience without first funding a broad platform replacement.'],
          ['CTO view', 'Reduce repeated integration work by giving applications one semantic contract over a mixed operational estate.'],
          ['Product view', 'Ship AI-assisted features that can explain facts, freshness, provenance, and masking rather than hiding the basis for a recommendation.'],
        ].map(([title, body]) => (
          <Card key={title} className="bg-[linear-gradient(180deg,rgba(255,248,240,0.96),rgba(252,246,239,0.96))]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage-700">{title}</p>
            <p className="mt-4 text-sm leading-7 text-ink-700">{body}</p>
          </Card>
        ))}
      </section>
    </div>
  )
}
