import { AlertTriangle, FileText, Mail } from 'lucide-react'
import { Card, PageHeader, Panel } from '@/components/ui/primitives'
import { pilotContactEmail, siteOperatorLocation, siteOperatorName } from '@/features/marketing/site-constants'

export function TermsPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Terms and disclaimer"
        title="Terms, disclaimers, and pilot contracting notes."
        description="These terms explain the public website position. They are not a final customer agreement, data-processing agreement, support agreement, or legal advice. Paid pilots require written scope and solicitor review before signature."
      />

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel eyebrow="Operator details" title="Website operator" action={<Mail className="size-5 text-copper-700" />}>
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

        <Panel eyebrow="No overclaiming" title="The website does not offer hands-off SaaS">
          <p className="text-sm leading-7 text-ink-700">
            Universal Context Layer is currently positioned as open source core plus implementation-led paid pilot, with private enterprise extensions and future/private cloud-control-plane work. The public site does not create a live subscription, payment account, licence portal, hosted production environment, or automated enterprise connector deployment.
          </p>
        </Panel>
      </section>

      <Panel eyebrow="Commercial terms" title="Paid pilots need written scope">
        <div className="grid gap-3 md:grid-cols-2">
          {[
            'Pilot scope, deliverables, systems in scope, data access, support hours, pricing, acceptance criteria, and change control should be agreed in a written SOW.',
            'Any licence, usage, support, warranty, liability, confidentiality, intellectual property, data-processing, security, or privacy terms require legal review before signature.',
            'Customer operational data, credentials, and production access should only be shared through approved secure processes.',
            'No statement on this public website should be treated as a guarantee of outcome, regulatory compliance, model accuracy, or production availability.',
          ].map((item) => (
            <Card key={item} className="bg-ivory-25 shadow-none">
              <div className="flex items-start gap-3">
                <FileText className="mt-1 size-5 text-copper-700" />
                <p className="text-sm leading-7 text-ink-700">{item}</p>
              </div>
            </Card>
          ))}
        </div>
      </Panel>

      <Panel eyebrow="Disclaimer" title="Use professional review before relying on these documents" action={<AlertTriangle className="size-5 text-gold-700" />}>
        <p className="text-sm leading-7 text-ink-700">
          This site and repository include practical commercial, security, privacy, support, and pilot templates to help prepare for sales conversations. They are not legal advice. Final customer-facing documents must be reviewed by a qualified solicitor and adapted to the contracting entity, jurisdiction, customer requirements, and deployment model.
        </p>
      </Panel>
    </div>
  )
}
