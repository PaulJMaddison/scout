import { Building2, CloudCog, Handshake, LifeBuoy, Lock, ServerCog } from 'lucide-react'
import { Card, PageHeader, Panel } from '@/components/ui/primitives'

export function CommercialPage() {
  const offerings: Array<{
    title: string
    body: string
    icon: typeof CloudCog
  }> = [
    { title: 'Future private cloud control plane', body: 'A paid/private cloud offering can manage accounts, licences, downloads, support, update channels, and aggregate usage without requiring raw operational data by default.', icon: CloudCog },
    { title: 'Private cloud or single tenant', body: 'A paid/private deployment can add stronger isolation, customer-controlled networking, and commercial operations around the customer-owned data plane.', icon: Lock },
    { title: 'Enterprise connectors and governance add-ons', body: 'Paid/private packages provide real CRM, warehouse, email, chat, calendar, analytics, work management, and knowledge connectors, plus SSO/SAML, SCIM, vault integrations, advanced governance, compliance exports, deployment packs, and SLA tooling outside the public repo.', icon: ServerCog },
    { title: 'Implementation services', body: 'Accelerate source onboarding, semantic schema design, selector packs, and product integration work.', icon: Handshake },
    { title: 'Support and SLA', body: 'Provide named support, operational guidance, and response expectations for production teams.', icon: LifeBuoy },
    { title: 'Commercial rollout help', body: 'Work with CTOs, architects, and product teams on platform shape, governance, rollout sequencing, and operating model.', icon: Building2 },
  ]

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Commercial options"
        title="Paid/private enterprise and cloud options beside the public open-core repository."
        description="The public repo contains the safe open core and self-hosted data-plane foundations. Commercial modules can add real enterprise connectors with metadata-only defaults, enterprise identity, vaults, advanced governance, compliance exports, deployment packs, SLA tooling, hosted account management, billing, licence portals, downloads, update channels, support portals, and cloud operations."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {offerings.map(({ title, body, icon: Icon }) => {
          return (
            <Card key={title} className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Icon className="mt-1 size-5 text-copper-700" />
                <div>
                  <p className="font-semibold text-ink-950">{title}</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">{body}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </section>

      <Panel eyebrow="What you can buy now" title="The current commercial offer is a supported paid pilot">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ['Discovery workshop', 'Scope the first workflow, source systems, buyer outcome, and production-readiness path.'],
            ['Starter paid pilot', 'Implement one customer data plane and one downstream context consumer with support.'],
            ['Production pilot', 'Harden the pilot with PostgreSQL, secrets, audit, masking, backup/restore, and handover.'],
            ['Enterprise rollout design', 'Plan private connectors, governance, support, and operating model for a larger estate.'],
          ].map(([title, body]) => (
            <Card key={title} className="bg-ivory-25">
              <p className="font-semibold text-ink-950">{title}</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">{body}</p>
            </Card>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Not self-serve SaaS yet" title="Confidence without overclaiming">
        <p className="text-sm leading-7 text-ink-700">
          KynticAI Scout is sellable today as open core plus implementation-led paid pilot. Fully managed account signup, live billing, licence portal, support portal, automated connector provisioning, and hands-off SaaS operations are future/private cloud-control-plane work.
        </p>
      </Panel>

      <section className="grid gap-4 2xl:grid-cols-[1fr_1fr]">
        <Panel eyebrow="For CTOs" title="Why a technical buyer might pay later">
          <div className="grid gap-3">
            {[
              'To avoid owning the full runtime, monitoring, upgrade, and support burden internally.',
              'To get private deployment, governance hardening, connector delivery, or operational assurances faster than building everything alone.',
              'To accelerate rollout into several teams while keeping a clean open core underneath the commercial packaging.',
            ].map((line) => (
              <Card key={line} className="bg-ivory-25">
                <p className="text-sm leading-7 text-ink-700">{line}</p>
              </Card>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="For CEOs and product leaders" title="Why a commercial option can still be rational">
          <div className="grid gap-3">
            {[
              'The business can keep existing systems rather than funding a broad replacement programme first.',
              'Existing data becomes more commercially useful because it powers several workflows through one semantic layer.',
              'Recommendations become easier to trust because evidence, freshness, and provenance remain visible.',
              'Time to value is often faster with managed deployment, implementation help, or commercial support.',
            ].map((line) => (
              <Card key={line} className="bg-ivory-25">
                <p className="text-sm leading-7 text-ink-700">{line}</p>
              </Card>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  )
}
