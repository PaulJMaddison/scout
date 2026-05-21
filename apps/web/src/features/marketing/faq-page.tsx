import { PageHeader, Panel } from '@/components/ui/primitives'
import { FaqCard } from '@/features/marketing/marketing-components'
import { faqEntries } from '@/features/marketing/marketing-content'

export function FaqPage() {
  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="FAQ"
        title="Common buyer and builder questions about KynticAI Scout."
        description="These are the questions most technical and commercial stakeholders ask when they are deciding whether Scout is a demo, a real backend layer, an open source core, or the start of a managed platform."
      />

      <Panel eyebrow="Frequently asked questions" title="The short answers decision-makers usually want first">
        <div className="grid gap-3">
          {faqEntries.map((entry) => (
            <FaqCard key={entry.question} question={entry.question} answer={entry.answer} />
          ))}
        </div>
      </Panel>
    </div>
  )
}
