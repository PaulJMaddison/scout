import { Database, PlugZap, RefreshCcw, Shield, Workflow } from 'lucide-react'
import { Card, PageHeader, Panel } from '@/components/ui/primitives'
import { CodeBlock, FlowStep } from '@/features/marketing/marketing-components'
import {
  csharpSdkExample,
  graphQlContextLookup,
  restContextLookup,
  typeScriptSdkExample,
  webhookExample,
} from '@/features/marketing/marketing-content'

export function IntegrationLayerPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Backend integration layer"
        title="One governed context contract for products, workflows, analytics, copilots, and agents."
        description="Use it as a backend-only service, an internal platform component, or the data plane behind a product. It can ingest or fetch source data, interpret it through selectors, and publish governed semantic context back to the systems that need business meaning."
      />

      <section className="grid gap-4 xl:grid-cols-4">
        <FlowStep
          step="Connectors"
          title="Connect many source types"
          body="The connector model supports SQL databases, REST APIs, file uploads, mock/demo sources, and the shape needed for future CRM, telemetry, billing, and support connectors."
        />
        <FlowStep
          step="Selectors"
          title="Translate raw signals"
          body="Selectors map raw fields and metrics into reusable business attributes. They can be previewed, validated, scheduled, or triggered by upstream events."
          tone="neutral"
        />
        <FlowStep
          step="Context facts"
          title="Store evidence-rich context"
          body="Facts are stored with confidence, freshness, provenance, snapshots, masking, and auditability so they remain safe to reuse."
          tone="warning"
        />
        <FlowStep
          step="Consumption"
          title="Serve many consumers"
          body="Downstream systems can query context over GraphQL, REST, SDKs, governed context packages, or direct internal services. SaaS metadata also models future webhook delivery."
          tone="success"
        />
      </section>

      <section className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
        <Panel eyebrow="Connector plugin model" title="A connector contract that supports real operational onboarding">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ['SQL database connector', 'Read subject-level rows, roll-ups, or views from operational and warehouse stores.'],
              ['REST API connector', 'Fetch subject-level payloads from modern service APIs and internal platforms.'],
              ['File upload connector', 'Accept CSV, export, or spreadsheet-driven data drops during staged onboarding.'],
              ['Mock connector', 'Support deterministic demos, previews, and onboarding rehearsals without claiming live enterprise integrations.'],
              ['Private enterprise connectors', 'The public repo can describe interfaces and patterns without shipping paid CRM, warehouse, email, chat, calendar, analytics, work-management, or knowledge-system implementations here.'],
              ['Shared runtime features', 'Raw payloads, normalised payloads, provenance, freshness, validation, health checks, preview, dry run, scheduled sync, and event-triggered recompute.'],
            ].map(([title, body]) => (
              <Card key={title} className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <PlugZap className="mt-1 size-5 text-copper-700" />
                  <div>
                    <p className="font-semibold text-ink-950">{title}</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">{body}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Backend-only mode" title="Run the API without the React frontend when you want a pure integration service">
          <div className="grid gap-3">
            {[
              ['GraphQL and REST enabled', 'Expose flexible queries and simpler integration endpoints at the same time.'],
              ['Health and OpenAPI', 'Run readiness checks and publish Swagger when the REST surface is enabled.'],
              ['SQLite and PostgreSQL', 'Use SQLite for local development and PostgreSQL for production deployments.'],
              ['Machine-to-machine authentication', 'Issue service-client tokens for backend integrations rather than requiring console login.'],
              ['Opt-in demo seeding', 'Seed demo data explicitly for workshops, and deploy with no seed data for customer environments.'],
              ['Connector bootstrap', 'Provide connector configuration through environment variables or admin APIs depending operating model.'],
            ].map(([title, body]) => (
              <Card key={title} className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <Workflow className="mt-1 size-5 text-sage-700" />
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

      <section className="grid gap-4 2xl:grid-cols-[1.05fr_0.95fr]">
        <Panel eyebrow="What external systems can ask" title="The API surface answers business questions, not just technical ones">
          <div className="grid gap-3">
            {[
              'What do we know about customer X?',
              'What semantic facts are available for this account?',
              'Which source systems contributed to this recommendation?',
              'Which facts are fresh, stale, low confidence, or masked?',
              'What should an AI agent, workflow, or app be allowed to see?',
              'What changed since the last context snapshot?',
              'Which selectors should run after a source system event?',
            ].map((question) => (
              <Card key={question} className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <Database className="mt-1 size-5 text-copper-700" />
                  <p className="text-sm font-semibold leading-7 text-ink-950">{question}</p>
                </div>
              </Card>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Governance built in" title="Every consumer sees the semantic layer, not the raw estate">
          <div className="grid gap-3">
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Shield className="mt-1 size-5 text-sage-700" />
                <div>
                  <p className="font-semibold text-ink-950">Tenant and workspace scoping</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    Context can be isolated by tenant and workspace so multiple products or business units can share the platform safely.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <RefreshCcw className="mt-1 size-5 text-gold-700" />
                <div>
                  <p className="font-semibold text-ink-950">Preview, validation, and recompute controls</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    Selectors and connectors can be previewed before publish, validated against expected input, and recomputed asynchronously when source events land.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Panel>
      </section>

      <Panel eyebrow="Paid pilot use" title="Implementation-led onboarding is the right first customer path">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Start with one workflow', 'Pick a real business workflow and prove that semantic context improves it.'],
            ['Use safe source access', 'Start with SQL, REST, CSV, or commercially scoped private connectors, with credentials controlled by the customer.'],
            ['Harden before go-live', 'Disable demo fallback, use PostgreSQL, persist Data Protection keys, scope API clients, and test restore.'],
          ].map(([title, body]) => (
            <Card key={title} className="bg-ivory-25">
              <p className="font-semibold text-ink-950">{title}</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">{body}</p>
            </Card>
          ))}
        </div>
      </Panel>

      <section className="grid gap-4 2xl:grid-cols-2">
        <CodeBlock title="GraphQL context lookup" language="graphql" code={graphQlContextLookup} />
        <CodeBlock title="REST context lookup" language="http" code={restContextLookup} />
        <CodeBlock title="Webhook event example" language="json" code={webhookExample} />
        <Card className="bg-[linear-gradient(180deg,rgba(255,248,240,0.96),rgba(252,246,239,0.96))]">
          <p className="text-xs uppercase tracking-[0.18em] text-sage-700">SDK shape</p>
          <div className="mt-4 grid gap-4">
            <CodeBlock title="TypeScript" language="ts" code={typeScriptSdkExample} />
            <CodeBlock title="C#" language="csharp" code={csharpSdkExample} />
          </div>
        </Card>
      </section>
    </div>
  )
}
