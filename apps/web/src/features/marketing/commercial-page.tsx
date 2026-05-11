import { Building2, CloudCog, Handshake, LifeBuoy, Lock, ServerCog } from 'lucide-react'
import { Card, PageHeader, Panel } from '@/components/ui/primitives'

export function CommercialPage() {
  const offerings: Array<{
    title: string
    body: string
    icon: typeof CloudCog
  }> = [
    { title: 'Managed SaaS', body: 'Use UCL as a managed service with hosted runtime, upgrades, monitoring, and operational support.', icon: CloudCog },
    { title: 'Private cloud or single tenant', body: 'Deploy with stronger isolation, customer-controlled networking, and enterprise operational controls.', icon: Lock },
    { title: 'Enterprise connectors and governance add-ons', body: 'Commercial packaging may later include connectors, enterprise controls, and support-backed rollout assets that do not belong in the public repo by default.', icon: ServerCog },
    { title: 'Implementation services', body: 'Accelerate source onboarding, semantic schema design, selector packs, and product integration work.', icon: Handshake },
    { title: 'Support and SLA', body: 'Provide named support, operational guidance, and response expectations for production teams.', icon: LifeBuoy },
    { title: 'Commercial rollout help', body: 'Work with CTOs, architects, and product teams on platform shape, governance, rollout sequencing, and operating model.', icon: Building2 },
  ]

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Commercial options"
        title="This page explains the commercial paths for managed SaaS, private cloud, enterprise support, and implementation help."
        description="The commercial story should be clear without weakening the public project. Buyers need to understand what they can use today, what they may want help with later, and why managed deployment, enterprise connectors, governance depth, support, or implementation help could make commercial sense."
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
