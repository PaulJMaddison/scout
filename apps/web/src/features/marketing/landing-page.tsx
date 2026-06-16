import { Link } from '@tanstack/react-router'
import { ArrowRight, Building2, DatabaseZap, GitBranch, ShieldCheck, Sparkles, Workflow } from 'lucide-react'
import { Badge, Button, Card, MetricCard, PageHeader, Panel } from '@/components/ui/primitives'
import { BeforeAfter, Timeline } from '@/features/marketing/marketing-components'

export function LandingPage() {
  return (
    <div className="grid gap-8">
      <section className="grid gap-6 rounded-[28px] border border-ink-900/8 bg-ivory-50/82 p-6 shadow-[0_18px_45px_rgba(24,18,15,0.08)] sm:p-8 xl:grid-cols-[0.9fr_1.1fr] xl:items-center">
        <div className="min-w-0">
          <img
            src="/brand/kynticai-logo-lockup.png"
            alt="KynticAI"
            className="h-16 w-auto max-w-full"
          />
          <div className="mt-8 h-0.5 w-24 bg-copper-500" />
          <p className="mt-6 font-display text-[clamp(2rem,3.3vw,3.25rem)] italic leading-tight text-ink-700">
            Most systems were designed to manage work, not empower.
          </p>
          <p className="mt-4 max-w-xl text-sm leading-7 text-ink-600">
            Scout is the governed customer data plane from KynticAI: exact linked records, semantic context, provenance, selectors, connectors, evidence packs, and SDKs for AI-enabled products.
          </p>
        </div>
        <div className="grid gap-4 rounded-[24px] border border-copper-500/18 bg-ivory-25 p-5 md:grid-cols-[14rem_1fr] md:items-center">
          <img
            src="/brand/kynticai-logo-mark.png"
            alt="KynticAI Sovereign Rust K mark"
            className="aspect-square w-full max-w-[14rem] rounded-[18px] object-contain"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper-700">Sovereign Rust identity</p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-ink-950">Aged book discipline, industrial data infrastructure.</h2>
            <p className="mt-3 text-sm leading-7 text-ink-700">
              The KynticAI mark now anchors the demo in the same visual language as the company site: parchment surfaces, amethyst text, copper action states, and sober enterprise proof.
            </p>
          </div>
        </div>
      </section>

      <PageHeader
        eyebrow="KynticAI Scout"
        title="The customer-owned data plane for governed AI evidence packs."
        description="Your SAP. Your Postgres. Your CRM. Scout keeps authorised operational data inside the customer data plane, maps source signals into evidence with provenance, and serves governed context to apps, workflows, reports, local LLMs, and agents."
        actions={
          <>
            <Link to="/pilot">
              <Button>
                Request paid pilot scope
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="secondary">
                Open the data-plane demo
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/platform">
              <Button variant="secondary">Explore the data plane</Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[1.12fr_0.88fr]">
        <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,#1A1818_0%,#2f2433_52%,#4A2E19_100%)] px-7 py-8 text-ivory-50 shadow-[0_28px_80px_rgba(24,18,15,0.28)] sm:px-9">
          <div className="grid gap-7">
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">No rip-and-replace</Badge>
              <Badge tone="neutral">Selectors create trusted facts</Badge>
              <Badge tone="success">GraphQL, REST, SDKs, webhooks</Badge>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-copper-300">What buyers should understand first</p>
              <h2 className="mt-4 max-w-4xl font-display text-[clamp(3rem,6vw,6rem)] leading-[0.94] text-ivory-50">
                Existing systems stay. Evidence becomes reusable.
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-ivory-200">
                KynticAI Scout gives CEOs, CTOs, product leaders, and integration teams a practical route from scattered authorised data to structured evidence with confidence, provenance, freshness, and masking. Built by an Enterprise Architect with 26 years across 100+ commercial projects.
              </p>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {[
                ['Exact customer data plane', 'Email address, replies, meetings booked, pricing visits, registrations, CRM contacts, opportunities, tickets, usage, billing health, and won/lost outcomes remain customer-owned.'],
                ['Evidence layer', 'Selectors and relationship links translate source signals into facts such as conversion probability, support drag, product fit, adoption health, and recommended next action.'],
                ['Reusable evidence pack', 'Apps, reports, agents, local LLMs, and product workflows receive governed packs with citations instead of brittle joins or copied database rows.'],
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
              A recent ERP platform engagement involved legacy databases, CRM-style records, operational systems, and fragmented business data. The customer did not need to rip out those systems first. A semantic data plane over existing operational data let a new web platform and AI-enabled workflows consume business meaning rather than raw records.
            </p>
          </Card>
          <Card className="bg-ivory-25 shadow-none">
            <p className="text-sm leading-7 text-ink-700">
              This is an anonymised implementation pattern, not a named case study. It supports the paid pilot motion: prove one valuable workflow, keep customer operational data controlled, and expand the data plane once the value is clear.
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
            'Agents receive scoped evidence packages with trusted facts, confidence, provenance, freshness, similar-pattern references, and masking.',
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
                title: 'Generate governed evidence packs',
                body: 'Snapshots and context packages expose structured facts, similar patterns, provenance, masking, freshness, and audit trails.',
              },
              {
                label: 'Use',
                title: 'Power better workflows and AI recommendations',
                body: 'Sales, support, onboarding, product, marketing, internal copilots, and local/open-source LLMs can work from the same governed data plane.',
              },
            ]}
          />
        </Panel>

        <Panel eyebrow="Business outcomes" title="What the layer should improve">
          <div className="grid gap-3">
            {[
              ['Faster AI rollout', 'Teams can build AI workflows on semantic context rather than waiting for a full data-platform replacement.'],
              ['Less integration waste', 'One mapping layer reduces repeated joins, bespoke ETL, and duplicated interpretation code.'],
              ['Clearer recommendations', 'Sales recommendations can cite email engagement, web conversion, pricing-page visits, registration, CRM, opportunity, support, usage, billing, and sale outcome signals.'],
              ['Safer customer context', 'Masking and provenance are part of the context contract rather than a late prompt-writing patch.'],
              ['More credible pilots', 'A demo can show exactly how authorised customer-owned data becomes an evidence-backed recommendation, not just a polished chat response.'],
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
            ['Optional Cloud/control plane', 'Use commercial control-plane services later for accounts, licences, downloads, support access, update channels, and aggregate usage metadata.'],
            ['Private cloud', 'Use single-tenant isolation, regional control, and enterprise governance.'],
            ['Integration layer', 'Embed Scout behind a product or platform as the semantic contract.'],
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
