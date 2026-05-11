import { Link } from '@tanstack/react-router'
import { ArrowRight, DatabaseZap, ShieldCheck, Sparkles, Waypoints } from 'lucide-react'
import { Badge, Button, Card, MetricCard, PageHeader, Panel } from '@/components/ui/primitives'
import {
  executiveStorySteps,
  featuredObjective,
  useExecutiveDemoData,
} from '@/features/demo/executive-demo-data'
import { ExecutiveStoryFooter } from '@/features/demo/executive-story-footer'

export function DemoModePage() {
  const {
    contextQuery,
    featuredFacts,
    featuredUser,
    statHighlights,
  } = useExecutiveDemoData()

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Step 1 of 5"
        title="This demo page shows how raw customer data becomes better AI sales recommendations."
        description="Universal Context Layer turns fragmented CRM, product, billing, support, and warehouse data into a governed semantic layer that your own systems can consume."
        actions={
          <Link to={executiveStorySteps[1].to}>
            <Button>
              Start the walkthrough
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,rgba(220,180,145,0.18),transparent_28%),linear-gradient(135deg,#16110d_0%,#1f1712_45%,#2e2118_100%)] px-8 py-8 text-ivory-50 shadow-[0_28px_80px_rgba(24,18,15,0.28)]">
          <div className="grid gap-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">Legacy systems stay in place</Badge>
              <ArrowRight className="size-4 text-copper-300" />
              <Badge tone="neutral">Context Layer interprets the signals</Badge>
              <ArrowRight className="size-4 text-copper-300" />
              <Badge tone="success">Consumers get reusable business context</Badge>
            </div>

            <div className="grid gap-4">
              <p className="text-xs uppercase tracking-[0.22em] text-copper-300">Executive framing</p>
              <h2 className="max-w-4xl font-display text-5xl leading-[1.02] text-ivory-50">
                Your existing systems already contain the signals AI needs.
                UCL turns them into meaning your systems can use.
              </h2>
              <p className="max-w-3xl text-base leading-8 text-ivory-200">
                Universal Context Layer reads the operational estate exactly where it already lives, converts
                disconnected events into governed business meaning, and gives product workflows, analytics, copilots, and agents a
                shared semantic contract they can cite, trust, and reuse.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-copper-300">Before</p>
                <p className="mt-3 text-lg font-semibold text-ivory-50">Raw CRM IDs and siloed metrics</p>
                <p className="mt-2 text-sm leading-7 text-ivory-200">
                  AI only sees contact records, logs, and disconnected events, so the product gives weak and inconsistent recommendations.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-copper-300">Middle</p>
                <p className="mt-3 text-lg font-semibold text-ivory-50">Semantic context with confidence and provenance</p>
                <p className="mt-2 text-sm leading-7 text-ivory-200">
                  Selectors map signals into canonical attributes like conversion probability, preferred channel, and expansion potential.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-copper-300">After</p>
                <p className="mt-3 text-lg font-semibold text-ivory-50">Grounded decisions that are explainable</p>
                <p className="mt-2 text-sm leading-7 text-ivory-200">
                  Apps, workflows, and AI systems receive structured profiles, cited facts, and warnings when signals are weak.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          <Card className="bg-[radial-gradient(circle_at_top_right,rgba(175,92,43,0.12),transparent_26%),linear-gradient(180deg,rgba(255,248,240,0.96),rgba(252,246,239,0.96))]">
            <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Featured account</p>
            <h3 className="mt-3 font-display text-4xl text-ink-950">
              {contextQuery.data?.companyName ?? featuredUser?.companyName ?? 'Larkspur Logistics Group'}
            </h3>
            <p className="mt-3 text-sm leading-7 text-ink-700">
              {contextQuery.data?.summary ??
                'This account demonstrates the core value of the product: legacy operational signals become one grounded commercial brief for product workflows and AI.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {featuredFacts.map((fact) => (
                <Badge key={fact.key} tone="accent">
                  {fact.label}: {fact.value}
                </Badge>
              ))}
            </div>
          </Card>

          <Panel eyebrow="What this walkthrough proves" title="The story you can tell live">
            <div className="grid gap-3">
              <Card className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <DatabaseZap className="mt-1 size-5 text-copper-700" />
                  <div>
                    <p className="font-semibold text-ink-950">You do not need to replatform first</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">
                      The first pages show how CRM, support, usage, billing, and web events stay where they are and still become usable by downstream systems.
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <Waypoints className="mt-1 size-5 text-sage-700" />
                  <div>
                    <p className="font-semibold text-ink-950">The semantic lift is visible, not magical</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">
                      You can walk through the exact timeline from raw signal to canonical business meaning to a governed example recommendation.
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 size-5 text-gold-700" />
                  <div>
                    <p className="font-semibold text-ink-950">Trust and governance stay intact</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">
                      Confidence, freshness, provenance, masking, and audit are part of the context layer, not an afterthought after the example demo.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </Panel>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {statHighlights.map((item, index) => (
          <MetricCard
            key={item.label}
            label={item.label}
            value={item.value}
            footnote={item.body}
            accent={index % 3 === 0 ? 'copper' : index % 3 === 1 ? 'sage' : 'gold'}
          />
        ))}
      </section>

      <section className="grid gap-4 2xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          eyebrow="Commercial model"
          title="Paid pilot options on top of the open-source core"
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Card className="bg-ivory-25">
              <p className="text-xs uppercase tracking-[0.18em] text-copper-700">Discovery workshop</p>
              <p className="mt-3 font-semibold text-ink-950">Pick the first workflow and success criteria</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                Map source systems, governance constraints, downstream consumers, and the first customer data-plane shape before implementation starts.
              </p>
            </Card>

            <Card className="bg-ivory-25">
              <p className="text-xs uppercase tracking-[0.18em] text-copper-700">Starter paid pilot</p>
              <p className="mt-3 font-semibold text-ink-950">Prove one valuable context consumer</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                Use open core plus supported implementation to connect selected sources or safe exports, build selectors, and expose governed context.
              </p>
            </Card>

            <Card className="bg-ivory-25">
              <p className="text-xs uppercase tracking-[0.18em] text-copper-700">Production pilot</p>
              <p className="mt-3 font-semibold text-ink-950">Harden the customer-owned data plane</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                Add PostgreSQL, production secrets, audit, masking, backup and restore testing, API scopes, and handover around the first workflow.
              </p>
            </Card>

            <Card className="bg-ivory-25">
              <p className="text-xs uppercase tracking-[0.18em] text-copper-700">Connector accelerator</p>
              <p className="mt-3 font-semibold text-ink-950">Commercially scoped private connector delivery</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                Paid build-out for private connector modules and selector packs where generic SQL, REST, CSV, or exports are not enough.
              </p>
            </Card>

            <Card className="bg-ivory-25">
              <p className="text-xs uppercase tracking-[0.18em] text-copper-700">AI rollout advisory</p>
              <p className="mt-3 font-semibold text-ink-950">Context design tied to product and revenue outcomes</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                Workshops for semantic schema design, context package design, bring your own AI rollout, governance, KPI definition, and how to turn legacy data into useful product workflows.
              </p>
            </Card>

            <Card className="bg-ivory-25">
              <p className="text-xs uppercase tracking-[0.18em] text-copper-700">Future control plane</p>
              <p className="mt-3 font-semibold text-ink-950">Not complete self-serve SaaS yet</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                Hosted account management, live billing, licence portal, support portal, and update-channel automation are future/private cloud work.
              </p>
            </Card>
          </div>
        </Panel>

        <Panel eyebrow="Commercial contact" title="Talk to Paul about pilots, deployment, or licensing support">
          <Card className="bg-[linear-gradient(180deg,rgba(255,248,240,0.96),rgba(252,246,239,0.96))]">
            <p className="text-sm leading-7 text-ink-700">
              The MIT-licensed core stays open source. Paid engagement is available now for discovery workshops, starter pilots, production pilots, private connector scoping, and commercially supported implementation.
            </p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[20px] border border-ink-900/8 bg-white/70 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Email</p>
                <a
                  href="mailto:paul.maddison.delimeg@gmail.com"
                  className="mt-2 block text-base font-semibold text-ink-950 underline decoration-copper-300 underline-offset-4"
                >
                  paul.maddison.delimeg@gmail.com
                </a>
              </div>
              <div className="rounded-[20px] border border-ink-900/8 bg-white/70 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Phone</p>
                <a
                  href="tel:+447742031553"
                  className="mt-2 block text-base font-semibold text-ink-950 underline decoration-copper-300 underline-offset-4"
                >
                  +44 7742 031553
                </a>
              </div>
            </div>
          </Card>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Panel eyebrow="Walkthrough structure" title="What the next four pages will show">
          <div className="grid gap-3">
            <Card className="bg-ivory-25">
              <p className="font-semibold text-ink-950">2. Legacy Signals</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                The raw timeline from web, CRM, support, and usage systems, plus the reason AI struggles when these signals remain disconnected.
              </p>
            </Card>
            <Card className="bg-ivory-25">
              <p className="font-semibold text-ink-950">3. Semantic Timeline</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                How Context Layer maps those events into canonical facts with confidence, freshness, provenance, and selector logic.
              </p>
            </Card>
            <Card className="bg-ivory-25">
              <p className="font-semibold text-ink-950">4. Example Consumer Timeline</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                The exact moment where grounded context improves the sales support recommendation, the advised action, and the business result.
              </p>
            </Card>
            <Card className="bg-ivory-25">
              <p className="font-semibold text-ink-950">5. Rollout and ROI</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                The commercial case, the governance posture, and how AI can even help bootstrap the context model itself.
              </p>
            </Card>
          </div>
        </Panel>

        <Panel eyebrow="Grounded objective" title="Example consumer: Intelligent Sales Support">
          <Card className="bg-ink-950 text-ivory-50">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 size-5 text-copper-300" />
              <div>
            <p className="font-display text-2xl">Example consumer: Intelligent Sales Support</p>
                <p className="mt-3 text-sm leading-7 text-ivory-200">{featuredObjective}</p>
              </div>
            </div>
          </Card>

          <div className="mt-4 grid gap-3">
            <Card className="bg-ivory-25">
              <p className="text-xs uppercase tracking-[0.18em] text-sage-700">What the model receives</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                A structured context package with semantic attributes, confidence scores, freshness metadata, and citations.
              </p>
            </Card>
            <Card className="bg-ivory-25">
              <p className="text-xs uppercase tracking-[0.18em] text-sage-700">What the model does not receive</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                A vague CRM identifier, disconnected table rows, or unsupported claims about the customer.
              </p>
            </Card>
            <Card className="bg-ivory-25">
              <p className="text-xs uppercase tracking-[0.18em] text-sage-700">What the product gains</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                Better prioritisation, faster rep preparation, safer recommendations, and a clearer route from existing systems to measurable product value.
              </p>
            </Card>
          </div>
        </Panel>
      </section>

      <ExecutiveStoryFooter currentPath="/demo" />
    </div>
  )
}
