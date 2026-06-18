import { Mail, ShieldCheck } from 'lucide-react'
import { Card, PageHeader, Panel } from '@/components/ui/primitives'
import { pilotContactEmail, siteOperatorLocation, siteOperatorName } from '@/features/marketing/site-constants'

export function PrivacyPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Privacy"
        title="Privacy policy for KynticAI Scout enquiries."
        description="This policy covers the public docs/demo app and paid-pilot enquiries. It is a practical template for the current project stage and must be reviewed by a solicitor before being used as a final customer-facing legal document."
      />

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel eyebrow="Operator" title="Who operates this app" action={<Mail className="size-5 text-copper-700" />}>
          <div className="grid gap-3">
            <Card className="bg-ivory-25 shadow-none">
              <p className="text-sm leading-7 text-ink-700">Operator: {siteOperatorName}.</p>
            </Card>
            <Card className="bg-ivory-25 shadow-none">
              <p className="text-sm leading-7 text-ink-700">Location: {siteOperatorLocation}.</p>
            </Card>
            <Card className="bg-ivory-25 shadow-none">
              <p className="text-sm leading-7 text-ink-700">
                Contact email: <a className="font-semibold text-copper-800 underline" href={`mailto:${pilotContactEmail}`}>{pilotContactEmail}</a>.
              </p>
            </Card>
          </div>
        </Panel>

        <Panel eyebrow="Data principle" title="Do not send raw operational data through the public docs/demo app">
          <p className="text-sm leading-7 text-ink-700">
            KynticAI Scout is designed around a customer-owned data plane. Paid-pilot discussions may describe source systems, workflows, and desired outcomes, but raw customer operational data, credentials, secrets, production exports, and personal data should not be submitted through the public docs/demo app or email enquiry flow unless a written agreement and secure transfer route are in place.
          </p>
        </Panel>
      </section>

      <Panel eyebrow="Enquiry data" title="What the pilot form asks for">
        <div className="grid gap-3 md:grid-cols-2">
          {[
            'Name, work email, company, source-system description, and target workflow.',
            'Campaign attribution such as UTM parameters, referrer, and landing page path may be captured to understand which adverts or pages generated an enquiry.',
            'The lead endpoint may store salted hashes of IP address and user agent for abuse review. Raw IP address and raw user-agent values should not be stored in the CRM database.',
            'Information is used to assess pilot fit, reply to the enquiry, prepare scoping discussions, and maintain a commercial record of the conversation.',
            'The form can submit to the private cloud mini CRM when configured, or fall back to a prefilled email. It does not create a payment account or hosted customer workspace.',
            'If analytics, CRM, email, or form tooling is added to a live deployment, that deployment should disclose the processors and retention policy used.',
          ].map((item) => (
            <Card key={item} className="bg-ivory-25 shadow-none">
              <p className="text-sm leading-7 text-ink-700">{item}</p>
            </Card>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Customer-owned data plane" title="How pilot data should be handled">
        <div className="grid gap-3 md:grid-cols-2">
          {[
            'Operational source data should remain in the customer-controlled environment by default.',
            'Connector credentials should be created, stored, rotated, and revoked by the customer or through an agreed secure vault process.',
            'Hosted control-plane services, where used later, should hold commercial metadata by default rather than raw operational data.',
            'Backups, restore tests, audit logs, deletion, export, offboarding, and retention must be agreed in the pilot SOW or data-processing terms.',
          ].map((item) => (
            <Card key={item} className="bg-ivory-25 shadow-none">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 size-5 text-sage-700" />
                <p className="text-sm leading-7 text-ink-700">{item}</p>
              </div>
            </Card>
          ))}
        </div>
      </Panel>
    </div>
  )
}
