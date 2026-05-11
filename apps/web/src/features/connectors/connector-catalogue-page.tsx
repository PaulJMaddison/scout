import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, LockKeyhole, PlugZap, ShieldCheck, Sparkles } from 'lucide-react'
import { Badge, Button, Card, PageHeader, Panel } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import type { ConnectorCatalogueAvailability, ConnectorCatalogueEntry } from '@/lib/types'
import { cn, prettyJson, safeJsonParse } from '@/lib/utils'

const availabilityLabels: Record<ConnectorCatalogueAvailability, string> = {
  OpenCore: 'Open core',
  Enterprise: 'Enterprise placeholder',
  SaaSManaged: 'SaaS managed placeholder',
  ComingSoon: 'Coming soon',
}

const availabilityTones: Record<ConnectorCatalogueAvailability, 'success' | 'warning' | 'accent' | 'neutral'> = {
  OpenCore: 'success',
  Enterprise: 'warning',
  SaaSManaged: 'accent',
  ComingSoon: 'neutral',
}

const filters: Array<ConnectorCatalogueAvailability | 'All'> = [
  'All',
  'OpenCore',
  'SaaSManaged',
  'Enterprise',
  'ComingSoon',
]

export function ConnectorCataloguePage() {
  const [activeFilter, setActiveFilter] = useState<ConnectorCatalogueAvailability | 'All'>('All')
  const catalogueQuery = useQuery({
    queryKey: ['connectorCatalogue'],
    queryFn: () => api.getConnectorCatalogue(),
  })

  const entries = useMemo(() => catalogueQuery.data ?? [], [catalogueQuery.data])
  const filteredEntries = useMemo(
    () =>
      entries.filter((entry) => activeFilter === 'All' || entry.availability === activeFilter),
    [activeFilter, entries],
  )
  const counts = useMemo(
    () =>
      entries.reduce(
        (accumulator, entry) => {
          accumulator[entry.availability] += 1
          return accumulator
        },
        { OpenCore: 0, Enterprise: 0, SaaSManaged: 0, ComingSoon: 0 } satisfies Record<ConnectorCatalogueAvailability, number>,
      ),
    [entries],
  )

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Connector marketplace"
        title="A catalogue buyers can understand, with an open-core boundary developers can trust."
        description="Universal Context Layer exposes connector metadata, schemas, health-check expectations, and credential boundaries without shipping paid enterprise integrations in the public repository."
        actions={
          <Badge tone="warning" className="max-w-md">
            Enterprise, SaaS-managed, and coming-soon entries are catalogue placeholders only.
          </Badge>
        }
      />

      <section className="grid gap-4 xl:grid-cols-4">
        <Card className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(126,159,128,0.2),transparent_42%),rgba(255,251,246,0.92)]">
          <CheckCircle2 className="size-6 text-sage-700" />
          <p className="mt-5 font-display text-3xl text-ink-950">{counts.OpenCore}</p>
          <p className="mt-2 text-sm font-semibold text-ink-700">Open-core connectors included here</p>
        </Card>
        <Card className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(175,92,43,0.18),transparent_44%),rgba(255,251,246,0.92)]">
          <Sparkles className="size-6 text-copper-700" />
          <p className="mt-5 font-display text-3xl text-ink-950">{counts.SaaSManaged}</p>
          <p className="mt-2 text-sm font-semibold text-ink-700">Managed placeholder listings</p>
        </Card>
        <Card className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(224,171,83,0.22),transparent_42%),rgba(255,251,246,0.92)]">
          <LockKeyhole className="size-6 text-umber-800" />
          <p className="mt-5 font-display text-3xl text-ink-950">{counts.Enterprise}</p>
          <p className="mt-2 text-sm font-semibold text-ink-700">Enterprise placeholder listings</p>
        </Card>
        <Card className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(38,34,30,0.1),transparent_42%),rgba(255,251,246,0.92)]">
          <PlugZap className="size-6 text-ink-700" />
          <p className="mt-5 font-display text-3xl text-ink-950">{counts.ComingSoon}</p>
          <p className="mt-2 text-sm font-semibold text-ink-700">Coming-soon connector shapes</p>
        </Card>
      </section>

      <Panel eyebrow="Repository boundary" title="The public repo ships safe generic connectors, not paid vendor implementations">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[24px] border border-sage-700/16 bg-sage-50/70 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 size-5 text-sage-700" />
              <div>
                <p className="font-semibold text-ink-950">Included and executable</p>
                <p className="mt-2 text-sm leading-7 text-ink-700">
                  SQL, REST API, CSV upload, and local mock CRM, billing, and support connectors are safe extension points for demos, tests, and self-hosted onboarding.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[24px] border border-gold-700/18 bg-gold-50/70 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 size-5 text-umber-800" />
              <div>
                <p className="font-semibold text-ink-950">Catalogue only</p>
                <p className="mt-2 text-sm leading-7 text-ink-700">
                  Salesforce, HubSpot, Dynamics, Snowflake, BigQuery, Zendesk, and NetSuite are visible as marketplace metadata only. Their real integrations belong in private/commercial packages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter}
            type="button"
            variant={activeFilter === filter ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveFilter(filter)}
          >
            {filter === 'All' ? 'All connectors' : availabilityLabels[filter]}
          </Button>
        ))}
      </div>

      {catalogueQuery.isLoading ? (
        <Card className="min-h-[220px] animate-pulse bg-ivory-50/60" />
      ) : catalogueQuery.isError ? (
        <Card className="border-rosewood-600/20 bg-rosewood-50/70">
          <p className="font-semibold text-rosewood-800">Connector catalogue could not be loaded.</p>
          <p className="mt-2 text-sm text-rosewood-700">{catalogueQuery.error.message}</p>
        </Card>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          {filteredEntries.map((entry) => (
            <ConnectorCard key={entry.connectorType} entry={entry} />
          ))}
        </section>
      )}
    </div>
  )
}

function ConnectorCard({ entry }: { entry: ConnectorCatalogueEntry }) {
  const schema = safeJsonParse<Record<string, unknown>>(entry.configurationSchemaJson, {})
  const credentialSchema = safeJsonParse<Record<string, unknown>>(entry.credentialSchemaJson, {})

  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        entry.isPlaceholder
          ? 'bg-[linear-gradient(145deg,rgba(255,248,240,0.96),rgba(247,231,203,0.7))]'
          : 'bg-[linear-gradient(145deg,rgba(255,251,246,0.96),rgba(232,240,225,0.64))]',
      )}
    >
      <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-[80px] bg-ink-950/5" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage-700">{entry.category}</p>
            <h2 className="mt-2 font-display text-2xl text-ink-950">{entry.displayName}</h2>
          </div>
          <Badge tone={availabilityTones[entry.availability]}>{availabilityLabels[entry.availability]}</Badge>
        </div>

        <p className="mt-4 text-sm leading-7 text-ink-700">{entry.description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {entry.supportedDataSourceKinds.map((kind) => (
            <Badge key={kind} tone="neutral">
              {kind}
            </Badge>
          ))}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-3xl border border-ink-900/8 bg-white/42 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper-800">Health check</p>
            <p className="mt-2 text-sm leading-6 text-ink-700">{entry.healthCheckMode}</p>
          </div>
          <div className="rounded-3xl border border-ink-900/8 bg-white/42 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-copper-800">Credential boundary</p>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              {entry.isPlaceholder
                ? 'Schema only; no vendor credential flow is implemented here.'
                : 'Credentials flow through the connector credential abstraction, never page-local storage.'}
            </p>
          </div>
        </div>

        <details className="mt-5 rounded-3xl border border-ink-900/8 bg-ink-950/[0.03] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-ink-950">View schemas and capabilities</summary>
          <div className="mt-4 grid gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage-700">Capabilities</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {entry.capabilities.map((capability) => (
                  <Badge key={capability} tone="neutral">
                    {capability}
                  </Badge>
                ))}
              </div>
            </div>
            <pre className="max-h-56 overflow-auto rounded-2xl bg-ink-950 p-4 text-xs leading-6 text-ivory-100">
              {prettyJson({ configuration: schema, credentials: credentialSchema })}
            </pre>
          </div>
        </details>
      </div>
    </Card>
  )
}
