import { Link } from '@tanstack/react-router'
import { ArrowRight, Bot, Boxes, Building2, Cable, ShieldCheck, Waypoints } from 'lucide-react'
import { Badge, Button, Card, PageHeader, Panel } from '@/components/ui/primitives'
import { CodeBlock, FlowStep } from '@/features/marketing/marketing-components'
import {
  blueprintExample,
  blueprintPrompt,
  csharpSdkExample,
  typeScriptSdkExample,
} from '@/features/marketing/marketing-content'

export function PlatformPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="KynticAI Scout"
        title="Turn exact authorised customer data into governed evidence packs for approved consumers."
        description="It does not replace your systems. It gives CRM, ERP, warehouse, support, billing, telemetry, web events, email engagement, spreadsheets, SQL databases, and internal applications a shared evidence layer."
        actions={
          <>
            <Link to="/integration-layer">
              <Button>
                See the integration layer
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/open-core">
              <Button variant="secondary">Open core boundary</Button>
            </Link>
            <Link to="/pricing">
              <Button variant="secondary">Paid pilot path</Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden border-none bg-[radial-gradient(circle_at_top_left,rgba(220,180,145,0.18),transparent_28%),linear-gradient(135deg,#16110d_0%,#1f1712_45%,#2e2118_100%)] px-8 py-8 text-ivory-50 shadow-[0_28px_80px_rgba(24,18,15,0.28)]">
          <div className="grid gap-6">
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">Open source core</Badge>
              <Badge tone="neutral">Backend integration layer</Badge>
              <Badge tone="success">Optional Cloud/control-plane metadata</Badge>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-copper-300">What it does</p>
              <h2 className="mt-4 max-w-4xl font-display text-5xl leading-[1.02] text-ivory-50">
                Scout is data-plane infrastructure for evidence-backed AI workflows.
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-ivory-200">
                KynticAI Scout sits beside the systems you already run, maps authorised fields and events into governed
                business evidence, and publishes that context through APIs, SDKs, governed context packages, and internal
                services. The React UI in this repository is the docs/demo/admin console for evaluating the data plane.
                The durable product value is the backend customer-owned data plane.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-copper-300">For buyers</p>
                <p className="mt-3 text-lg font-semibold text-ivory-50">Use existing systems more effectively</p>
                <p className="mt-2 text-sm leading-7 text-ivory-200">
                  Existing data becomes more useful because it is translated into cited business evidence rather than left as disconnected records.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-copper-300">For CTOs</p>
                <p className="mt-3 text-lg font-semibold text-ivory-50">Reduce point-to-point integration</p>
                <p className="mt-2 text-sm leading-7 text-ivory-200">
                  Connect source systems once, define selectors once, and let multiple teams consume the same semantic layer.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/6 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.18em] text-copper-300">For product teams</p>
                <p className="mt-3 text-lg font-semibold text-ivory-50">Ground recommendations in evidence</p>
                <p className="mt-2 text-sm leading-7 text-ivory-200">
                  AI and workflow logic receive structured evidence with exact record citations, freshness, confidence, provenance, masking rules, and similar outcome patterns.
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Panel eyebrow="Who this is for" title="a shared data plane for business systems and platform teams">
          <div className="grid gap-3">
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Building2 className="mt-1 size-5 text-copper-700" />
                <div>
                  <p className="font-semibold text-ink-950">CEO and commercial leadership</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    Keep existing systems in place, make the data already held by the business more useful, and give teams one
                    clearer basis for sales, support, onboarding, and customer success decisions.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Waypoints className="mt-1 size-5 text-sage-700" />
                <div>
                  <p className="font-semibold text-ink-950">CTO and platform leadership</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    Introduce a semantic integration layer that reduces brittle point-to-point joins, centralises governance,
                    and gives new systems a stable contract over a mixed legacy estate.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Bot className="mt-1 size-5 text-gold-700" />
                <div>
                  <p className="font-semibold text-ink-950">Product and AI delivery teams</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    Build product workflows, copilots, and automation against semantic profiles instead of teaching every
                    feature how to interpret each upstream system.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Panel>
      </section>

      <Panel eyebrow="Architecture flow" title="How the platform works in practice">
        <div className="grid gap-4 xl:grid-cols-4">
          <FlowStep
            step="1. Connect"
            title="Connect existing systems"
            body="Attach CRM, ERP, billing, support, telemetry, warehouse, SharePoint, Excel exports, internal APIs, or older SQL databases through connectors rather than embedding direct schema knowledge into every new application."
          />
          <FlowStep
            step="2. Interpret"
            title="Run selectors"
            body="Admin-defined selectors map raw data into semantic attributes using direct mappings, weighted scoring, thresholds, formula metrics, enum normalisation, and source conflict resolution."
            tone="neutral"
          />
          <FlowStep
            step="3. Govern"
            title="Store governed evidence"
            body="Context facts, exact linked records, and snapshots retain confidence, freshness, provenance, auditability, masking status, recomputation history, and similar-pattern references so recommendations can be trusted and traced."
            tone="warning"
          />
          <FlowStep
            step="4. Reuse"
            title="Serve many consumers"
            body="New systems consume context through GraphQL, REST, SDKs, governed context packages, or direct services. The same evidence layer can support sales, support, onboarding, product, marketing, success, workflow automation, and local/open-source LLM handoff."
            tone="success"
          />
        </div>
      </Panel>

      <Panel eyebrow="Customer data plane" title="The paid pilot proves the self-hosted semantic layer first">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Runs beside customer systems', 'Connector configuration, selectors, exact linked records, context facts, snapshots, evidence packs, provenance, and audit logs stay in the customer-controlled environment by default.'],
            ['Feeds customer-owned consumers', 'Customer apps, workflows, reports, copilots, local LLMs, and agents can consume context without adopting our AI stack.'],
            ['Optional Cloud stays separate', 'Accounts, billing, licences, downloads, support, update channels, and aggregate usage are commercial control-plane concerns, not the customer data plane.'],
          ].map(([title, body]) => (
            <Card key={title} className="bg-ivory-25">
              <p className="font-semibold text-ink-950">{title}</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">{body}</p>
            </Card>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Anonymised ERP platform pattern" title="Existing systems can stay while the new platform consumes meaning">
        <p className="text-sm leading-7 text-ink-700">
          A recent ERP platform engagement showed the same architectural pattern: legacy databases, CRM-style records, operational systems, and fragmented business data stayed in place while a semantic data plane helped a new web platform and AI-enabled workflows consume business meaning rather than raw records. The details remain anonymised and customer-specific, but the repeatable pattern is what Scout productises.
        </p>
      </Panel>

      <section className="grid gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
        <Panel eyebrow="Bring your own AI" title="Scout supplies the governed business context">
          <div className="grid gap-3">
            {[
              ['Not another AI app', 'Scout does not need to own the model, agent, copilot, or orchestration layer. Customers can use their own AI stack.'],
              ['Useful beyond AI', 'The same semantic facts can feed internal apps, workflow automation, dashboards, and decision systems.'],
              ['Safer model inputs', 'AI fails when it only sees raw IDs, stale tables, or disconnected records. Scout gives it business meaning, evidence, confidence, and guardrails.'],
            ].map(([title, body]) => (
              <Card key={title} className="bg-ivory-25">
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

        <Panel eyebrow="Context consumers" title="Scout creates the context. Your systems consume it.">
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {[
              ['Apps', 'Internal and customer-facing products can show trusted account, customer, product, and billing meaning.'],
              ['Agents', 'Agents can receive scoped evidence packages with exact-record citations, freshness, similar-pattern references, masking, and audit visibility.'],
              ['Workflows', 'Automation can trigger from semantic state changes rather than raw events alone.'],
              ['Analytics', 'Reporting tools can use shared business facts with confidence and provenance.'],
              ['Copilots', 'Internal copilots can answer questions from governed customer and account context.'],
              ['Automation', 'Support, onboarding, marketing, and success systems can reuse the same context contract.'],
            ].map(([title, body]) => (
              <Card key={title} className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <Boxes className="mt-1 size-5 text-copper-700" />
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

      <section className="grid gap-4 2xl:grid-cols-[1.1fr_0.9fr]">
        <Panel eyebrow="Use cases" title="One semantic layer, many downstream workflows">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ['Sales intelligence', 'Prioritise accounts, explain risk, and ground next-best-action recommendations with email, web, CRM, opportunity, support, usage, billing, and outcome evidence.'],
              ['Customer success', 'Surface onboarding drag, adoption health, and likely expansion signals.'],
              ['Support prioritisation', 'Combine severity, account value, and relationship state in one context view.'],
              ['Product onboarding', 'Show onboarding agents what the customer has already done and where risk remains.'],
              ['Risk scoring', 'Blend billing, support, and product telemetry into governed operational risk signals.'],
              ['Marketing personalisation', 'Use common semantic attributes rather than fragile point-to-point campaign joins.'],
              ['Third party AI agents', 'Prepare allowed evidence packages with citations, freshness, and masking decisions.'],
              ['Workflow automation', 'Trigger recomputes and downstream actions from semantic state changes rather than raw events alone.'],
            ].map(([title, body]) => (
              <Card key={title} className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <Boxes className="mt-1 size-5 text-copper-700" />
                  <div>
                    <p className="font-semibold text-ink-950">{title}</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">{body}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="SDK shape" title="Give product teams a simpler consumer contract">
          <div className="grid gap-4">
            <CodeBlock title="TypeScript SDK example" language="ts" code={typeScriptSdkExample} />
            <CodeBlock title="C# SDK example" language="csharp" code={csharpSdkExample} />
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
        <Panel eyebrow="AI-assisted onboarding" title="Use AI to turn source system evidence into a Scout blueprint">
          <p className="text-sm leading-7 text-ink-700">
            Teams can analyse schema exports, sample rows, API payloads, CRM field lists, warehouse descriptions,
            support tickets, billing records, usage events, and KPI notes with Codex, Claude, or another engineering tool.
            The output can become a governed blueprint for sources, attributes, selectors, confidence rules, freshness,
            provenance, masking, and implementation gaps.
          </p>
          <div className="mt-4">
            <CodeBlock title="Copyable blueprint prompt" language="prompt" code={blueprintPrompt} copyable />
          </div>
        </Panel>

        <CodeBlock title="Blueprint JSON example" language="json" code={blueprintExample} />
      </section>

      <Panel eyebrow="Commercially credible positioning" title="What to understand before you buy, build, or pilot">
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="bg-ivory-25">
            <div className="flex items-start gap-3">
              <Cable className="mt-1 size-5 text-copper-700" />
              <div>
                <p className="font-semibold text-ink-950">No rip-and-replace requirement</p>
                <p className="mt-2 text-sm leading-7 text-ink-700">
                  Scout is an add-on layer beside the systems you already have, which makes the rollout path far more realistic.
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-ivory-25">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 size-5 text-sage-700" />
              <div>
                <p className="font-semibold text-ink-950">Evidence-led recommendations</p>
                <p className="mt-2 text-sm leading-7 text-ink-700">
                  Each recommendation can show the facts, freshness, source systems, and audit trail behind it.
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-ivory-25">
            <div className="flex items-start gap-3">
              <Bot className="mt-1 size-5 text-gold-700" />
              <div>
                <p className="font-semibold text-ink-950">Bring your own AI consumption</p>
                <p className="mt-2 text-sm leading-7 text-ink-700">
                  Models, agents, copilots, and product features work from structured business context instead of raw records or unsupported joins.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Panel>
    </div>
  )
}
