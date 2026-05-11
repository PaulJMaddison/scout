import { Link } from '@tanstack/react-router'
import { ArrowRight, Building2, CloudCog, GitBranch, LockKeyhole, ServerCog } from 'lucide-react'
import { Badge, Button, Card, PageHeader, Panel } from '@/components/ui/primitives'
import { BeforeAfter } from '@/features/marketing/marketing-components'

const plans = [
  {
    name: 'Free',
    label: 'Open evaluation',
    body: 'Use the local demo, inspect the open source core, and understand selectors, snapshots, REST, GraphQL, and seeded fictional data.',
    bestFor: 'Learning, workshops, proof-of-concepts',
  },
  {
    name: 'Pro',
    label: 'Team pilot',
    body: 'Run a small production-minded pilot with tenant-scoped users, API clients, selectors, context lookups, recomputes, source events, and blueprint imports.',
    bestFor: 'Small teams proving value',
  },
  {
    name: 'Business',
    label: 'Production rollout',
    body: 'Support more workspaces, users, API clients, selectors, usage volume, retention, and operational integration surfaces.',
    bestFor: 'Cross-functional production teams',
  },
  {
    name: 'Enterprise',
    label: 'Commercial agreement',
    body: 'Use private cloud, managed SaaS, custom retention, support, enterprise governance, and connector work through a paid agreement.',
    bestFor: 'Larger or regulated estates',
  },
]

export function PricingPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Pricing and deployment"
        title="This page explains how Universal Context Layer can be adopted as open source core, self-hosted backend, managed SaaS, private cloud, or integration layer."
        description="There is no payment provider wired into the public repository. The product has plan and usage foundations so Stripe, Paddle, or a contracted billing process can be attached later without changing the core metering logic."
        actions={
          <>
            <Link to="/docs">
              <Button>
                See billing foundations
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/open-core">
              <Button variant="secondary">Open core boundary</Button>
            </Link>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-4">
        {plans.map((plan) => (
          <Card key={plan.name} className="bg-ivory-25">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-3xl text-ink-950">{plan.name}</h2>
              <Badge tone={plan.name === 'Enterprise' ? 'accent' : 'neutral'}>{plan.label}</Badge>
            </div>
            <p className="mt-4 text-sm leading-7 text-ink-700">{plan.body}</p>
            <div className="mt-5 rounded-2xl border border-ink-900/8 bg-white/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage-700">Best for</p>
              <p className="mt-2 text-sm font-semibold text-ink-950">{plan.bestFor}</p>
            </div>
          </Card>
        ))}
      </section>

      <Panel eyebrow="Deployment options" title="Choose the operating model before choosing the commercial model">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            [GitBranch, 'Open source core', 'Run locally with SQLite and fictional seed data. Useful for evaluation and learning.'],
            [ServerCog, 'Self-hosted backend', 'Deploy the API and workers with PostgreSQL while retaining your own operations model.'],
            [CloudCog, 'Managed SaaS', 'Use a hosted control plane when speed and managed operations matter more than owning runtime.'],
            [LockKeyhole, 'Private cloud', 'Use stronger tenant isolation, regional deployment, and enterprise governance controls.'],
            [Building2, 'Integration layer', 'Embed UCL behind a product or internal platform as the semantic contract over source systems.'],
          ].map(([Icon, title, body]) => (
            <Card key={title as string} className="bg-[linear-gradient(180deg,rgba(255,248,240,0.96),rgba(252,246,239,0.96))]">
              <Icon className="size-5 text-copper-700" />
              <p className="mt-4 font-semibold text-ink-950">{title as string}</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">{body as string}</p>
            </Card>
          ))}
        </div>
      </Panel>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel eyebrow="Commercial boundary" title="What is intentionally not in the public repo">
          <BeforeAfter
            before={[
              'No Stripe or Paddle integration is bundled.',
              'No paid Salesforce, HubSpot, Dynamics, Snowflake, BigQuery, Zendesk, or NetSuite implementation is shipped.',
              'No customer-specific deployment pack or private-cloud automation is included.',
            ]}
            after={[
              'Clean billing-provider interfaces and no-op provider defaults are present.',
              'Connector, credential, health-check, and catalogue extension points are safe to build against.',
              'The open core remains credible while commercial modules can live outside the public repository.',
            ]}
          />
        </Panel>

        <Panel eyebrow="Usage foundations" title="Plan limits are already modelled for hosted SaaS operation">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              'Tenants',
              'Workspaces',
              'Users',
              'API clients',
              'Selectors',
              'Context lookups',
              'Recomputations',
              'Source events',
              'Blueprint imports',
              'Retention days',
            ].map((item) => (
              <Card key={item} className="bg-ivory-25 py-4 shadow-none">
                <p className="text-sm font-semibold text-ink-950">{item}</p>
              </Card>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  )
}
