import { Link } from '@tanstack/react-router'
import { AppWindow, DatabaseZap, FileSearch, FileUp, ShieldCheck, Sparkles, TrendingUp, WandSparkles } from 'lucide-react'
import { Badge, Card, MetricCard, PageHeader, Panel } from '@/components/ui/primitives'
import { useExecutiveDemoData } from '@/features/demo/executive-demo-data'
import { ExecutiveStoryFooter } from '@/features/demo/executive-story-footer'

export function StoryOutcomesPage() {
  const {
    contextQuery,
    dataSourcesQuery,
    groundedFacts,
    interactionTimeline,
    isAdmin,
    publishedSelectors,
    semanticAttributesQuery,
  } = useExecutiveDemoData()

  const roiCards = [
    {
      label: 'Faster rep prep',
      value: '1 brief',
      footnote: 'The rep gets one grounded customer brief instead of hopping between CRM, support, product usage, and billing tabs.',
      accent: 'copper' as const,
    },
    {
      label: 'Safer example output',
      value: `${groundedFacts.length}`,
      footnote: 'Cited facts are shipped with confidence and freshness, which lowers unsupported recommendations.',
      accent: 'sage' as const,
    },
    {
      label: 'Reusable context',
      value: `${contextQuery.data?.facts.length ?? 0}`,
      footnote: 'The same semantic facts can power multiple product features instead of being rebuilt per workflow.',
      accent: 'gold' as const,
    },
    {
      label: 'Rollout speed',
      value: `${publishedSelectors.length}`,
      footnote: 'Selectors let teams operationalise the model of the business incrementally rather than waiting for a full replatforming project.',
      accent: 'copper' as const,
    },
  ]

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Step 5 of 5"
        title="Connect the data plane to rollout, governance, and ROI."
        description="This closing page ties the semantic layer to product value, adoption realism, and the governance posture buyers need before trusting apps, workflows, analytics, copilots, or agents with customer-facing decisions."
      />

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {roiCards.map((item) => (
          <MetricCard
            key={item.label}
            label={item.label}
            value={item.value}
            footnote={item.footnote}
            accent={item.accent}
          />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel eyebrow="Commercial outcome" title="The product value becomes obvious within a few clicks">
          <div className="grid gap-3">
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <TrendingUp className="mt-1 size-5 text-copper-700" />
                <div>
                  <p className="font-semibold text-ink-950">Better prioritisation</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    The product can now rank the account using conversion probability, enterprise intent, urgency, and risk together instead of treating those as separate disconnected signals.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <WandSparkles className="mt-1 size-5 text-sage-700" />
                <div>
                  <p className="font-semibold text-ink-950">More useful AI interactions</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    The example sales support consumer produces a strategy, an email draft, and follow-up guidance that are explainable because they are tied to the same evidence package your humans can inspect.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 size-5 text-gold-700" />
                <div>
                  <p className="font-semibold text-ink-950">Less hand waving in governance reviews</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    Confidence, freshness, provenance, masking, and audit are not post-hoc controls. They are native parts of the context product.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Panel>

        <Panel eyebrow="Rollout realism" title="How a buyer can adopt this without ripping out the estate">
          <div className="grid gap-3">
            <Card className="bg-ink-950 text-ivory-50">
              <p className="text-xs uppercase tracking-[0.18em] text-copper-300">What to say live</p>
              <p className="mt-3 text-base leading-8 text-ivory-100">
                "We are not asking you to replace your systems. We are adding one semantic contract above them so the rest of your product and your AI tools can finally interpret customers consistently."
              </p>
            </Card>
            <Card className="bg-ivory-25">
              <p className="font-semibold text-ink-950">1. Connect the existing systems</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                Start with CRM, support, usage, billing, and web events. The operational data remains the source of truth.
              </p>
            </Card>
            <Card className="bg-ivory-25">
              <p className="font-semibold text-ink-950">2. Define the semantic contract</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                Publish canonical attributes and selector logic once, then let multiple product workflows consume the same meaning.
              </p>
            </Card>
            <Card className="bg-ivory-25">
              <p className="font-semibold text-ink-950">3. Ship grounded AI features safely</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">
                Give AI systems, apps, and workflows evidence packages with citations, not raw fragments. That makes the product more useful and easier to defend commercially.
              </p>
            </Card>
          </div>
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.04fr_0.96fr]">
        <Panel eyebrow="AI-assisted onboarding" title="AI can help bootstrap the context model itself">
          <div className="grid gap-3">
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 size-5 text-copper-700" />
                <div>
                  <p className="font-semibold text-ink-950">Use AI to accelerate discovery, not bypass governance</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    Tools like Codex or Claude can inspect schemas, sample CRM exports, KPI definitions, and operational documentation to draft a discovery report that Scout can operationalise into attributes and selectors.
                  </p>
                </div>
              </div>
            </Card>
            <div className="grid gap-3 md:grid-cols-2">
              <Card className="bg-ivory-25">
                <p className="font-semibold text-ink-950">What AI can draft</p>
                <div className="mt-2 grid gap-2 text-sm text-ink-700">
                  <p>Candidate entities and relationships</p>
                  <p>Proposed semantic attributes</p>
                  <p>Draft selector logic and transformation rules</p>
                  <p>Data quality warnings and rollout notes</p>
                </div>
              </Card>
              <Card className="bg-ivory-25">
                <p className="font-semibold text-ink-950">What humans still approve</p>
                <div className="mt-2 grid gap-2 text-sm text-ink-700">
                  <p>Which attributes become production truth</p>
                  <p>Which selectors are published</p>
                  <p>How masking and provenance are enforced</p>
                  <p>Which workflows and AI systems are allowed to consume the context</p>
                </div>
              </Card>
            </div>
          </div>
        </Panel>

        <Panel eyebrow="Proof screens" title="Where to go next in the live product">
          <div className="grid gap-3 md:grid-cols-2">
            <Link to="/customers/$externalUserId" params={{ externalUserId: '123' }}>
              <Card className="h-full bg-ivory-25 transition hover:border-copper-300">
                <div className="flex items-start gap-3">
                  <AppWindow className="mt-1 size-5 text-copper-700" />
                  <div>
                    <p className="font-semibold text-ink-950">360 customer profile</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">
                      Show the full profile, snapshot history, provenance, and the raw operational summary.
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/agent-playground">
              <Card className="h-full bg-ivory-25 transition hover:border-copper-300">
                <div className="flex items-start gap-3">
                  <WandSparkles className="mt-1 size-5 text-sage-700" />
                  <div>
                    <p className="font-semibold text-ink-950">Example Sales Support consumer</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">
                      Show the evidence package, the generated outreach, and the "why this was recommended" trace.
                    </p>
                  </div>
                </div>
              </Card>
            </Link>

            {isAdmin ? (
              <Link to="/data-sources">
                <Card className="h-full bg-ivory-25 transition hover:border-copper-300">
                  <div className="flex items-start gap-3">
                    <DatabaseZap className="mt-1 size-5 text-gold-700" />
                    <div>
                      <p className="font-semibold text-ink-950">Source systems</p>
                      <p className="mt-2 text-sm leading-7 text-ink-700">
                        Reinforce the two-database story and show how the operational estate feeds the semantic layer.
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ) : null}

            {isAdmin ? (
              <Link to="/bootstrap-studio">
                <Card className="h-full bg-ivory-25 transition hover:border-copper-300">
                  <div className="flex items-start gap-3">
                    <FileUp className="mt-1 size-5 text-copper-700" />
                    <div>
                      <p className="font-semibold text-ink-950">Bootstrap studio</p>
                      <p className="mt-2 text-sm leading-7 text-ink-700">
                        Show how Codex or Claude can analyse schemas and CRM exports, then generate an import-ready Scout blueprint.
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ) : null}

            {isAdmin ? (
              <Link to="/semantic-schema">
                <Card className="h-full bg-ivory-25 transition hover:border-copper-300">
                  <div className="flex items-start gap-3">
                    <FileSearch className="mt-1 size-5 text-copper-700" />
                    <div>
                      <p className="font-semibold text-ink-950">Semantic contract</p>
                      <p className="mt-2 text-sm leading-7 text-ink-700">
                        Show the canonical business attributes the rest of the product is allowed to depend on.
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ) : null}
          </div>

          <Card className="mt-4 bg-ink-950 text-ivory-50">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">{dataSourcesQuery.data?.length ?? 0} connectors</Badge>
              <Badge tone="success">{publishedSelectors.length} published selectors</Badge>
              <Badge tone="neutral">{semanticAttributesQuery.data?.length ?? 0} semantic attributes</Badge>
              <Badge tone="warning">{interactionTimeline.length} timeline beats</Badge>
            </div>
          </Card>
        </Panel>
      </section>

      <ExecutiveStoryFooter currentPath="/story/outcomes" />
    </div>
  )
}
