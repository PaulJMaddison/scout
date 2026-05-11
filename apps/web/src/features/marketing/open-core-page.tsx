import { GitBranch, LockKeyhole, MonitorCog, Scale, Server, ShieldCheck } from 'lucide-react'
import { Card, PageHeader, Panel } from '@/components/ui/primitives'

export function OpenCorePage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Open core strategy"
        title="This page explains what belongs in the open source core and what should stay in future commercial extension modules."
        description="This site needs to be honest about the commercial boundary. The open source project should remain useful, teachable, and deployable. Paid options can be described clearly without placing enterprise implementation code into the public repository."
      />

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel eyebrow="Public repo" title="What belongs in this repository">
          <div className="grid gap-3">
            {[
              ['Open source core runtime', 'Backend services, GraphQL, REST, selector execution, context snapshots, provenance, audit, and backend-only mode.'],
              ['Demo and admin console', 'The React site continues to function as the public product site, learning experience, seeded demo, and admin console.'],
              ['Extension interfaces', 'Public abstractions, plugin contracts, SDKs, documentation, samples, and guides that make the product understandable and extensible.'],
              ['Honest product framing', 'Clear explanation of what is open source today, what is roadmap, and what would later sit behind a commercial support or deployment model.'],
            ].map(([title, body]) => (
              <Card key={title} className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <GitBranch className="mt-1 size-5 text-copper-700" />
                  <div>
                    <p className="font-semibold text-ink-950">{title}</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">{body}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Commercial boundary" title="What should not be quietly folded into the public repo">
          <div className="grid gap-3">
            {[
              ['Enterprise-only implementation code', 'Do not place paid connectors, enterprise identity, private cloud deployment assets, or commercial operations code into the public repository unless explicitly intended as open source.'],
              ['Pretend implementations', 'Do not imply Salesforce, HubSpot, enterprise SSO, or other paid options exist here if they are only planned. Describe them as future or commercial options instead.'],
              ['Weak open source positioning', 'The public project should not read like a crippled trial. It should stand on its own as a real core product and learning platform.'],
            ].map(([title, body]) => (
              <Card key={title} className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-1 size-5 text-rosewood-700" />
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

      <Panel eyebrow="Repository strategy" title="A credible open core path from today to later commercial packaging">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-[linear-gradient(180deg,rgba(255,248,240,0.96),rgba(252,246,239,0.96))]">
            <div className="flex items-start gap-3">
              <Server className="mt-1 size-5 text-copper-700" />
              <div>
                <p className="font-semibold text-ink-950">`universalcontextlayer`</p>
                <p className="mt-2 text-sm leading-7 text-ink-700">
                  Public open source core, seeded demo, admin console, documentation, integration patterns, and backend runtime.
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-[linear-gradient(180deg,rgba(255,248,240,0.96),rgba(252,246,239,0.96))]">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 size-5 text-sage-700" />
              <div>
                <p className="font-semibold text-ink-950">`universalcontextlayer-enterprise`</p>
                <p className="mt-2 text-sm leading-7 text-ink-700">
                  Future private repository for enterprise extensions, commercial deployment assets, and support-backed features that should not live in the public repo.
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-[linear-gradient(180deg,rgba(255,248,240,0.96),rgba(252,246,239,0.96))]">
            <div className="flex items-start gap-3">
              <MonitorCog className="mt-1 size-5 text-gold-700" />
              <div>
                <p className="font-semibold text-ink-950">`universalcontextlayer-cloud`</p>
                <p className="mt-2 text-sm leading-7 text-ink-700">
                  Optional future repository for managed SaaS infrastructure, operations, deployment automation, and cloud-specific platform concerns.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Panel>

      <section className="grid gap-4 2xl:grid-cols-[0.92fr_1.08fr]">
        <Panel eyebrow="Why this matters" title="A clearer boundary makes both open source and commercial options stronger">
          <div className="grid gap-3">
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Scale className="mt-1 size-5 text-copper-700" />
                <div>
                  <p className="font-semibold text-ink-950">For open source users</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    They can learn, prototype, and even deploy the core platform without wondering whether the public repo is only a marketing shell.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 size-5 text-sage-700" />
                <div>
                  <p className="font-semibold text-ink-950">For commercial buyers</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    They can see a credible core product today and understand what they would be paying for later: managed operations, private deployment, governance depth, enterprise connectors, support, or implementation help.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Panel>

        <Panel eyebrow="Practical message" title="How the site should explain the model">
          <div className="grid gap-3">
            {[
              'The React UI is the public site, demo, and admin console. The long-term product value is the backend semantic integration layer.',
              'The public repo remains the open source core and demo, not a throwaway marketing artefact.',
              'Enterprise features can be discussed commercially without pretending they already exist in this repository.',
              'One website is enough for now. Later, if the SaaS grows, the marketing/docs site and hosted product can be split cleanly.',
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
