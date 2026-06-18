import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  Building2,
  Cable,
  DatabaseZap,
  FileSearch,
  GitBranch,
  PlugZap,
  RadioTower,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { Badge, Button, Card, MetricCard, PageHeader, Panel } from '@/components/ui/primitives'
import { BeforeAfter, Timeline } from '@/features/marketing/marketing-components'

const plainEnglishPillars = [
  {
    icon: Cable,
    title: 'Connect data you already own',
    body: 'Scout connects to existing operational sources: PostgreSQL tables, generic SQL views, REST APIs, webhooks, CSV-style imports, and safe demo connectors. Source systems remain the operational truth.',
  },
  {
    icon: FileSearch,
    title: 'Turn records into business meaning',
    body: 'Selectors map raw fields and events into governed facts such as adoption health, commercial fit, support risk, buying intent, confidence, freshness, and provenance.',
  },
  {
    icon: Sparkles,
    title: 'Use the outcomes elsewhere',
    body: 'Profiles, evidence packs, GraphQL, REST, SDKs, and webhook/event history let apps, dashboards, agents, local LLMs, and workflows consume trusted context.',
  },
] as const

const firstUseSteps = [
  ['1', 'Install and self-test', 'Run the Docker quick start. The start script builds the web/API images, starts Postgres, tests connectors and webhooks, then opens the local install report.'],
  ['2', 'Open the console', 'Sign in to the demo tenant, then start on the guided demo page before moving into data sources and admin tools.'],
  ['3', 'Connect a dataset', 'Use Data Sources to pick an executable connector, validate the sample configuration, register it, run health, and send a source event.'],
  ['4', 'Read the outcomes', 'Open the customer profile, relationship intelligence, example sales support, GraphQL, REST, or the Postgres-backed records to see what Scout computed.'],
] as const

const includedScoutParts = [
  ['Docker stack', 'Self-contained web app, API, PostgreSQL, migrations, seeded demo tenant, observability services, and health checks.'],
  ['Connector layer', 'Executable generic connectors for SQL/PostgreSQL, REST, CSV/demo-style payloads, mock CRM/billing/support, inventory, plus a connector template for private builds.'],
  ['Semantic layer', 'Selectors, schema registry, recomputation, exact linked records, context facts, evidence snapshots, provenance, freshness, confidence, masking, and audit logs.'],
  ['Outcome surfaces', '360 customer profile, relationship intelligence, example sales support, event history, connector lab, GraphQL, REST, SDK-shaped examples, and admin governance pages.'],
] as const

const postgresOutcomeSteps = [
  ['Point Scout at a table or view', 'Use the SQL Database/PostgreSQL connector with the built-in customer operations database or an approved external PostgreSQL connection.'],
  ['Map columns to semantic facts', 'Selectors decide which columns become trusted attributes, how confidence is scored, how freshness is calculated, and which source created the evidence.'],
  ['Trigger recompute', 'A connector health check, source event, webhook, or selector run updates the customer context stored in Scout.'],
  ['Consume the result', 'Read the outcome through the customer profile, relationship intelligence, example agent evidence pack, GraphQL, REST, or downstream product workflow.'],
] as const

export function LandingPage() {
  return (
    <div className="grid gap-8">
      <section className="grid gap-6 rounded-[28px] border border-ink-900/8 bg-ivory-50/88 p-6 shadow-[0_18px_45px_rgba(24,18,15,0.08)] sm:p-8 xl:grid-cols-[1.04fr_0.96fr] xl:items-start">
        <div className="min-w-0 space-y-6">
          <img
            src="/brand/kynticai-logo-lockup.png"
            alt="KynticAI"
            className="h-16 w-auto max-w-full"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage-700">Start here</p>
            <h1 className="mt-3 max-w-4xl font-display text-[clamp(2.7rem,5.4vw,5.8rem)] leading-[0.96] tracking-normal text-ink-950">
              Scout turns existing data into governed evidence your products can use.
            </h1>
          </div>
          <p className="max-w-3xl text-base leading-8 text-ink-700">
            For a new user, think of Scout as a self-hosted data plane. It does not replace CRM, ERP, support, billing, product telemetry, spreadsheets, or Postgres. It connects to those sources, translates selected fields and events into trusted business facts, stores the evidence with provenance, and exposes useful outcomes through the console, APIs, SDK-style contracts, and downstream workflows.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">Docker-first install</Badge>
            <Badge tone="neutral">Customer-owned Postgres data plane</Badge>
            <Badge tone="success">GraphQL, REST, webhooks, connector lab</Badge>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/login">
              <Button>
                Open the console
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="secondary">
                Start guided walkthrough
                <BookOpen className="size-4" />
              </Button>
            </Link>
            <Link to="/connectors">
              <Button variant="secondary">
                See connectors
                <PlugZap className="size-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-[24px] border border-copper-500/18 bg-ivory-25 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper-700">First 20 minutes</p>
          <h2 className="mt-3 font-display text-3xl leading-tight text-ink-950">Use the demo in this order</h2>
          <div className="mt-5 grid gap-3">
            {firstUseSteps.map(([number, title, body]) => (
              <div key={title} className="grid grid-cols-[2.2rem_1fr] gap-3 rounded-[18px] border border-ink-900/8 bg-white/70 p-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-copper-500 text-sm font-bold text-ivory-50">
                  {number}
                </span>
                <div>
                  <p className="font-semibold text-ink-950">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-700">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PageHeader
        eyebrow="Plain-English model"
        title="Connect sources, define meaning, then consume governed outcomes."
        description="The pages below explain the practical workflow before the commercial story: what Scout includes, how existing datasets are connected, and how outcomes come out of the Postgres-backed data plane."
        actions={
          <>
            <Link to="/platform">
              <Button>
                Explore the data plane
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary">
                Open admin console
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[0.98fr_1.02fr]">
        <Panel eyebrow="What Scout does" title="A beginner view of the system">
          <div className="grid gap-3">
            {plainEnglishPillars.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-[20px] border border-ink-900/8 bg-ivory-25 px-4 py-4">
                <div className="flex items-start gap-3">
                  <Icon className="mt-1 size-5 shrink-0 text-copper-700" />
                  <div>
                    <p className="font-semibold text-ink-950">{title}</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="What is included" title="The repo gives you a working data-plane console">
          <div className="grid gap-3 md:grid-cols-2">
            {includedScoutParts.map(([title, body]) => (
              <div key={title} className="rounded-[20px] border border-ink-900/8 bg-ivory-25 px-4 py-4">
                <p className="font-semibold text-ink-950">{title}</p>
                <p className="mt-2 text-sm leading-7 text-ink-700">{body}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <Panel eyebrow="Connecting existing datasets" title="How Postgres, SQL, REST, CSV-style payloads, and webhooks become outcomes">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[20px] border border-ink-900/8 bg-ivory-25 px-5 py-5">
            <DatabaseZap className="size-6 text-copper-700" />
            <h3 className="mt-4 font-display text-2xl leading-tight text-ink-950">Getting outcomes from a Postgres-backed dataset</h3>
            <p className="mt-3 text-sm leading-7 text-ink-700">
              The Docker install runs Scout with PostgreSQL. A SQL/PostgreSQL connector can read an approved table or view, selectors convert columns into business facts, and the resulting context appears in profiles, relationship intelligence, evidence packages, APIs, and admin history. The demo uses seeded customer operations tables so people can see the path before wiring in their own estate.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {postgresOutcomeSteps.map(([title, body], index) => (
              <div key={title} className="rounded-[20px] border border-ink-900/8 bg-white/70 px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sage-700 text-xs font-bold text-ivory-50">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-ink-950">{title}</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">{body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            [PlugZap, 'Connector Lab', 'Validate and register executable connector plugins from the console.'],
            [RadioTower, 'Source events and webhooks', 'Send events by loopback, LAN IP, REST, or source-system webhook URLs.'],
            [Workflow, 'Outcome consumers', 'Use GraphQL, REST, profiles, relationship intelligence, and evidence packs once context has been computed.'],
          ].map(([Icon, title, body]) => (
            <div key={title as string} className="rounded-[20px] border border-ink-900/8 bg-ivory-25 px-4 py-4">
              <Icon className="size-5 text-copper-700" />
              <p className="mt-3 font-semibold text-ink-950">{title as string}</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">{body as string}</p>
            </div>
          ))}
        </div>
      </Panel>

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
