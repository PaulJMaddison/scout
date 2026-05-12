import { Link } from '@tanstack/react-router'
import { ArrowRight, Building2, DatabaseZap, GitBranch, ShieldCheck, Sparkles, Workflow } from 'lucide-react'
import { Badge, Button, Card, MetricCard, PageHeader, Panel } from '@/components/ui/primitives'
import { BeforeAfter, Timeline } from '@/features/marketing/marketing-components'

export function LandingPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Universal Context Layer"
        title="This page introduces Universal Context Layer as context infrastructure for turning existing business data into trusted semantic context."
        description="Businesses do not need to rip out legacy systems or use our AI. UCL sits beside CRM, billing, support, product, warehouse, spreadsheets, and older SQL systems, then maps raw data into trusted facts that apps, workflows, reports, copilots, and agents can use."
        actions={
          <>
            <Link to="/demo">
              <Button>
                See the sales demo
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/platform">
              <Button variant="secondary">Explore the platform</Button>
            </Link>
            <Link to="/pricing">
              <Button variant="secondary">Paid pilot path</Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
        <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_15%_10%,rgba(220,180,145,0.22),transparent_28%),radial-gradient(circle_at_90%_0%,rgba(130,152,126,0.18),transparent_28%),linear-gradient(135deg,#16110d_0%,#231912_48%,#39291d_100%)] px-7 py-8 text-ivory-50 shadow-[0_28px_80px_rgba(24,18,15,0.28)] sm:px-9">
          <div className="grid gap-7">
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">No rip-and-replace</Badge>
              <Badge tone="neutral">Selectors create trusted facts</Badge>
              <Badge tone="success">GraphQL, REST, SDKs, webhooks</Badge>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-copper-300">What buyers should understand first</p>
              <h2 className="mt-4 max-w-4xl font-display text-[clamp(3rem,6vw,6rem)] leading-[0.94] text-ivory-50">
                Existing systems stay. Meaning becomes reusable.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-ivory-200">
                Universal Context Layer gives CEOs, CTOs, product leaders, and integration teams a practical route from scattered operational data to structured context with confidence, provenance, freshness, and masking.
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {[
                ['Raw estate', 'CRM notes, usage events, invoices, tickets, support sentiment, and spreadsheet exports remain in their systems of record.'],
                ['Semantic layer', 'Selectors translate source signals into facts such as renewal risk, product fit, adoption health, and preferred channel.'],
                ['Reusable context', 'Apps, reports, agents, and product workflows receive structured context packages instead of brittle joins or copied database rows.'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                  <p className="font-semibold text-ivory-50">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-ivory-200">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Panel eyebrow="Buyer proof" title="The commercial point is not another AI feature">
          <div className="grid gap-3">
            {[
              [Building2, 'For CEOs', 'Make existing customer, product, billing, and support data more useful without starting a systems replacement programme.'],
              [DatabaseZap, 'For CTOs', 'Put a semantic contract over fragmented systems so new apps and agents do not each build their own integration logic.'],
              [Sparkles, 'For product leaders', 'Ship AI-assisted workflows that can explain which facts, sources, and freshness windows shaped a recommendation.'],
              [Workflow, 'For integration teams', 'Create a reusable layer for mappings, recomputes, source events, API clients, audit, and tenant/workspace scoping.'],
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

      <Panel eyebrow="Anonymised ERP platform pattern" title="Recent implementation experience showed the pattern clearly">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Card className="bg-ivory-25 shadow-none">
            <p className="text-sm leading-7 text-ink-700">
              A recent ERP platform engagement involved legacy databases, CRM-style records, operational systems, and fragmented business data. The customer did not need to rip out those systems first. A semantic context layer over existing operational data let a new web platform and AI-enabled workflows consume business meaning rather than raw records.
            </p>
          </Card>
          <Card className="bg-ivory-25 shadow-none">
            <p className="text-sm leading-7 text-ink-700">
              This is an anonymised implementation pattern, not a named case study. It supports the paid pilot motion: prove one valuable workflow, keep customer operational data controlled, and expand the context layer once the value is clear.
            </p>
          </Card>
        </div>
      </Panel>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="1 semantic layer" value="Many systems" footnote="Connect source systems once, then let multiple products and workflows consume the same governed context." accent="copper" />
        <MetricCard label="Evidence attached" value="Always" footnote="Facts carry confidence, provenance, freshness, masking, and audit visibility so teams can review the basis for decisions." accent="sage" />
        <MetricCard label="Sellable today" value="Paid pilot" footnote="Use open core plus supported implementation to prove a customer-owned data plane before future managed control-plane operations." accent="gold" />
      </section>

      <Panel eyebrow="Before and after" title="The product changes what downstream systems are allowed to depend on">
        <BeforeAfter
          before={[
            'AI agents receive raw records, stale CRM notes, and hand-built prompts with little evidence.',
            'Product teams duplicate integration logic for each workflow and each source system.',
            'Business users cannot see why a recommendation was made or whether the source data was fresh.',
          ]}
          after={[
            'Agents receive scoped context packages with trusted facts, confidence, provenance, freshness, and masking.',
            'Selectors centralise how raw source data becomes semantic meaning across products and workflows.',
            'Teams can audit reads, recomputes, source events, and permission boundaries by tenant and workspace.',
          ]}
        />
      </Panel>

      <section className="grid gap-4 2xl:grid-cols-[0.96fr_1.04fr]">
        <Panel eyebrow="How it works" title="A practical path from raw records to business outcomes">
          <Timeline
            items={[
              {
                label: 'Connect',
                title: 'Connect the systems that already hold the truth',
                body: 'Use SQL, REST, CSV, mock demo connectors, and safe extension points for CRM, support, billing, warehouse, and product systems.',
              },
              {
                label: 'Map',
                title: 'Define selectors that translate source data',
                body: 'Selectors map raw fields, events, and metrics into canonical semantic attributes with confidence and freshness logic.',
              },
              {
                label: 'Package',
                title: 'Generate trusted context snapshots',
                body: 'Snapshots and context packages expose structured facts with provenance, masking, freshness, and audit trails.',
              },
              {
                label: 'Use',
                title: 'Power better workflows and AI recommendations',
                body: 'Sales, support, onboarding, product, marketing, and internal copilots can work from the same governed context layer.',
              },
            ]}
          />
        </Panel>

        <Panel eyebrow="Business outcomes" title="What the layer should improve">
          <div className="grid gap-3">
            {[
              ['Faster AI rollout', 'Teams can build AI workflows on semantic context rather than waiting for a full data-platform replacement.'],
              ['Less integration waste', 'One mapping layer reduces repeated joins, bespoke ETL, and duplicated interpretation code.'],
              ['Clearer recommendations', 'Sales recommendations can cite adoption, support, billing, lifecycle, and engagement signals.'],
              ['Safer customer context', 'Masking and provenance are part of the context contract rather than a late prompt-writing patch.'],
              ['More credible pilots', 'A demo can show exactly how raw customer data becomes a better recommendation, not just a polished chat response.'],
            ].map(([title, body]) => (
              <Card key={title} className="bg-ivory-25 shadow-none">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 size-5 text-sage-700" />
                  <div>
                    <p className="font-semibold text-ink-950">{title}</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">{body}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Panel>
      </section>

      <Panel eyebrow="Choose your path" title="Start open, self-host, or buy managed delivery later">
        <div className="grid gap-4 lg:grid-cols-5">
          {[
            ['Open source core', 'Run the demo, inspect selectors, and learn the architecture.'],
            ['Self-hosted backend', 'Deploy GraphQL, REST, SDKs, API clients, and webhooks around your systems.'],
            ['Future control plane', 'Use private cloud/control-plane services later for account, licence, and operational workflows.'],
            ['Private cloud', 'Use single-tenant isolation, regional control, and enterprise governance.'],
            ['Integration layer', 'Embed UCL behind a product or platform as the semantic contract.'],
          ].map(([title, body]) => (
            <Card key={title} className="bg-ivory-25 shadow-none">
              <GitBranch className="size-5 text-copper-700" />
              <p className="mt-4 font-semibold text-ink-950">{title}</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">{body}</p>
            </Card>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="What you can buy now" title="Start with a paid pilot, not a pretend self-serve SaaS">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Discovery workshop', 'Map the first workflow, source systems, governance constraints, and success criteria.'],
            ['Starter paid pilot', 'Build a first customer data plane and one downstream context consumer with implementation support.'],
            ['Production pilot', 'Add PostgreSQL, secrets, backups, audit, masking, scoped API clients, and handover for production-style use.'],
          ].map(([title, body]) => (
            <Card key={title} className="bg-ivory-25 shadow-none">
              <p className="font-semibold text-ink-950">{title}</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">{body}</p>
            </Card>
          ))}
        </div>
      </Panel>
    </div>
  )
}
