import { Link } from '@tanstack/react-router'
import { ArrowRight, Cable, Database, FileSpreadsheet, PlugZap, RefreshCcw, ShieldCheck, Webhook } from 'lucide-react'
import { Button, Card, PageHeader, Panel } from '@/components/ui/primitives'
import { CodeBlock, FlowStep, Timeline } from '@/features/marketing/marketing-components'
import { graphQlContextLookup, restContextLookup, webhookExample } from '@/features/marketing/marketing-content'

export function IntegrationsPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Integrations"
        title="This page explains how Universal Context Layer connects existing systems without forcing the business to replace them."
        description="UCL can act as a self-hosted backend, future managed integration layer, private-cloud service, or embedded product component. It accepts source events, reads operational systems inside the customer environment, runs selectors, and exposes trusted context through GraphQL, REST, SDKs, and webhooks."
        actions={
          <>
            <Link to="/connectors">
              <Button>
                Browse connector catalogue
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/docs">
              <Button variant="secondary">Read API examples</Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-4">
        <FlowStep
          step="Sources"
          title="Connect operational systems"
          body="Start with SQL, REST, CSV, mock CRM, mock billing, and mock support connectors. Enterprise connectors are extension points, not bundled paid integrations."
        />
        <FlowStep
          step="Events"
          title="Ingest changes"
          body="External systems can send provider-neutral source events such as account updates, payment failures, support tickets, usage changes, and lifecycle conversions."
          tone="neutral"
        />
        <FlowStep
          step="Selectors"
          title="Recompute meaning"
          body="Selector triggers match relevant source events and create background recomputation jobs for affected users or accounts."
          tone="warning"
        />
        <FlowStep
          step="Consumers"
          title="Expose context"
          body="Consumers read semantic profiles, account context, snapshots, selector previews, semantic attributes, audit events, and usage data through versioned APIs."
          tone="success"
        />
      </section>

      <section className="grid gap-4 2xl:grid-cols-[0.95fr_1.05fr]">
        <Panel eyebrow="Integration workflow" title="What happens when a source system changes">
          <Timeline
            items={[
              {
                label: 'Event received',
                title: 'A source system sends a signed event',
                body: 'The API validates tenant, workspace, API client, idempotency key, and webhook signature before accepting the event.',
              },
              {
                label: 'Routing',
                title: 'The event is routed to matching selectors',
                body: 'UCL checks event type, source system, subject identifiers, and workspace scope to decide whether recomputation is useful.',
              },
              {
                label: 'Recompute',
                title: 'Background jobs update semantic facts',
                body: 'Selectors read or use source data, calculate facts, and update snapshots with confidence, provenance, freshness, and masking.',
              },
              {
                label: 'Consumption',
                title: 'Downstream systems read a stable contract',
                body: 'Apps, agents, reporting, and workflows consume context through GraphQL, REST, SDKs, or future webhook delivery.',
              },
            ]}
          />
        </Panel>

        <Panel eyebrow="Source types" title="Integration teams can start safely and extend deliberately">
          <div className="grid gap-3">
            {[
              [Database, 'SQL and warehouse data', 'Use views, roll-ups, and subject-level rows from operational databases and analytics stores.'],
              [Cable, 'REST and internal APIs', 'Fetch account, customer, usage, billing, support, or product payloads from services the business already runs.'],
              [FileSpreadsheet, 'CSV and spreadsheet stages', 'Support early onboarding and data discovery without pretending the first integration is production-grade.'],
              [PlugZap, 'Connector marketplace skeleton', 'Show CRM, warehouse, support, ERP, email, chat, calendar, analytics, issue, project, and knowledge-system connectors as paid/private placeholders only.'],
              [Webhook, 'Source-system events', 'Accept lifecycle, usage, billing, support, marketing, and deletion events through a neutral event contract.'],
              [ShieldCheck, 'Credentials and health', 'Credential and health abstractions keep real connector secrets out of the public demo implementation.'],
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

      <section className="grid gap-4 2xl:grid-cols-3">
        <CodeBlock title="REST context lookup" language="http" code={restContextLookup} />
        <CodeBlock title="GraphQL context lookup" language="graphql" code={graphQlContextLookup} />
        <CodeBlock title="Source or webhook event shape" language="json" code={webhookExample} />
      </section>

      <Panel eyebrow="Operational controls" title="The integration layer is built for hosted multi-tenant operation">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [ShieldCheck, 'Tenant and workspace scope', 'API clients, source events, selectors, snapshots, audit events, and usage records stay tenant-scoped.'],
            [RefreshCcw, 'Recompute queue', 'Source events can trigger background recomputation without blocking the caller.'],
            [Webhook, 'Idempotency and dead letters', 'Duplicate events are ignored safely, bad signatures are rejected, and failed events can be inspected.'],
          ].map(([Icon, title, body]) => (
            <Card key={title as string} className="bg-[linear-gradient(180deg,rgba(255,248,240,0.96),rgba(252,246,239,0.96))]">
              <Icon className="size-5 text-sage-700" />
              <p className="mt-4 font-semibold text-ink-950">{title as string}</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">{body as string}</p>
            </Card>
          ))}
        </div>
      </Panel>
    </div>
  )
}
