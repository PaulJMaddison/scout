import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, Code2, FileJson, GitBranch, ShieldCheck, TerminalSquare } from 'lucide-react'
import { Button, Card, PageHeader, Panel } from '@/components/ui/primitives'
import { CodeBlock, Timeline } from '@/features/marketing/marketing-components'
import { graphQlContextLookup, restContextLookup, typeScriptSdkExample, webhookExample } from '@/features/marketing/marketing-content'

export function DocsPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Documentation"
        title="APIs, architecture notes, and demo flows for understanding KynticAI Scout."
        description="Use these docs to evaluate the open source core, run the local demo, inspect the control-plane/data-plane split, understand connector boundaries, and see how authorised customer data becomes governed evidence."
        actions={
          <>
            <a href="https://github.com/PaulJMaddison/scout" target="_blank" rel="noreferrer">
              <Button>
                View repository
                <ArrowRight className="size-4" />
              </Button>
            </a>
            <Link to="/demo">
              <Button variant="secondary">Open the demo story</Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          [TerminalSquare, 'Run locally', 'Use the setup scripts to start the SQLite demo with fictional tenant, customer, selector, and context data.'],
          [GitBranch, 'Understand open core', 'Read the open-core boundary, enterprise extension points, and connector marketplace docs.'],
          [ShieldCheck, 'Plan a paid pilot', 'Review the paid pilot offer, production install checklist, and anonymised ERP platform pattern before customer onboarding.'],
        ].map(([Icon, title, body]) => (
          <Card key={title as string} className="bg-ivory-25">
            <Icon className="size-5 text-copper-700" />
            <h2 className="mt-4 font-display text-2xl text-ink-950">{title as string}</h2>
            <p className="mt-2 text-sm leading-7 text-ink-700">{body as string}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel eyebrow="Suggested reading order" title="A path for CEOs, CTOs, product leaders, and integration teams">
          <Timeline
            items={[
              {
                label: 'First',
                title: 'Start with the platform page',
                body: 'Understand the product promise: existing business data becomes semantic context without replacing legacy systems.',
              },
              {
                label: 'Second',
                title: 'Walk through the sales demo',
                body: 'See how authorised customer data becomes evidence-backed next-action recommendations with confidence and provenance.',
              },
              {
                label: 'Third',
                title: 'Read integration and control-plane docs',
                body: 'Review REST, GraphQL, source events, API clients, onboarding, billing metering, and connector extension points.',
              },
              {
                label: 'Fourth',
                title: 'Try a blueprint import',
                body: 'Use an AI-generated JSON blueprint to preview sources, semantic attributes, selectors, prompt templates, PII rules, and audit policies.',
              },
            ]}
          />
        </Panel>

        <Panel eyebrow="Documentation map" title="Core documents in the repository">
          <div className="grid gap-3">
            {[
              ['README.md', 'Project overview, runtime modes, REST examples, screenshots, onboarding, and setup.'],
              ['docs/control-plane-data-plane.md', 'Customer-owned data-plane model, future hosted control-plane seam, licence posture, and local-data boundaries.'],
              ['docs/saas-architecture.md', 'Tenant, workspace, subscription, API client, audit, billing usage, and onboarding architecture.'],
              ['docs/billing-metering.md', 'Plan catalogue, usage recording, limit enforcement, and future payment-provider integration.'],
              ['docs/webhook-events.md', 'Provider-neutral event contract, signatures, idempotency, recompute triggers, and dead letters.'],
              ['docs/connector-marketplace.md', 'Connector catalogue, availability labels, safe mock connectors, and enterprise placeholders.'],
              ['docs/paid-pilot.md', 'Paid pilot buyer profile, scope, packages, success criteria, and implementation-led commercial path.'],
              ['docs/first-real-connector-proof.md', 'Verified generic SQL connector proof from source data to selectors, facts, snapshots, API response, and provenance.'],
              ['docs/production-install-checklist.md', 'Production mode, PostgreSQL, secrets, demo fallback, backups, audit, observability, and support boundaries.'],
              ['docs/anonymised-erp-platform-pattern.md', 'Anonymised ERP platform implementation pattern showing why semantic context beats raw records.'],
              ['docs/scout-blueprint.schema.json', 'Blueprint JSON schema for AI-assisted bootstrap imports.'],
            ].map(([title, body]) => (
              <Card key={title} className="bg-ivory-25 shadow-none">
                <div className="flex items-start gap-3">
                  <BookOpen className="mt-1 size-5 text-sage-700" />
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

      <section className="grid gap-4 2xl:grid-cols-2">
        <CodeBlock title="GraphQL context lookup" language="graphql" code={graphQlContextLookup} />
        <CodeBlock title="REST context lookup" language="http" code={restContextLookup} />
        <CodeBlock title="TypeScript SDK shape" language="ts" code={typeScriptSdkExample} />
        <CodeBlock title="Webhook event example" language="json" code={webhookExample} />
      </section>

      <Panel eyebrow="Builder reminder" title="The docs should help teams avoid brittle AI integrations">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [Code2, 'Do not prompt over raw chaos', 'Use selectors and context snapshots to give agents structured facts instead of arbitrary tables.'],
            [FileJson, 'Keep evidence attached', 'Confidence, provenance, freshness, and masking are part of the context contract.'],
            [ShieldCheck, 'Keep commercial claims honest', 'Enterprise connectors and payment-provider integrations are extension points, not bundled public implementations.'],
          ].map(([Icon, title, body]) => (
            <Card key={title as string} className="bg-[linear-gradient(180deg,rgba(255,248,240,0.96),rgba(252,246,239,0.96))]">
              <Icon className="size-5 text-copper-700" />
              <p className="mt-4 font-semibold text-ink-950">{title as string}</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">{body as string}</p>
            </Card>
          ))}
        </div>
      </Panel>
    </div>
  )
}
