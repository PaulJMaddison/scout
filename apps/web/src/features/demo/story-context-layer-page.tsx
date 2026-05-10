import { Link } from '@tanstack/react-router'
import { ArrowRight, FileSearch, Shapes, Sparkles, Waypoints } from 'lucide-react'
import { Badge, Button, Card, PageHeader, Panel } from '@/components/ui/primitives'
import {
  executiveStorySteps,
  factCitationLabel,
  getTimelineNarrative,
  getTimelineSourceSystem,
  shortTimeLabel,
  useExecutiveDemoData,
} from '@/features/demo/executive-demo-data'
import { ExecutiveStoryFooter } from '@/features/demo/executive-story-footer'

export function StoryContextLayerPage() {
  const { featuredFacts, groundedFacts, publishedSelectors, recentTimeline } = useExecutiveDemoData()

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Step 3 of 5"
        title="Turn fragmented events into reusable business meaning"
        description="This is the semantic lift: governed selectors interpret raw events and resolve them into canonical facts that every product workflow and AI agent can trust."
        actions={
          <Link to={executiveStorySteps[3].to}>
            <Button>
              Show the AI interaction timeline
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[0.94fr_1.06fr]">
        <Panel eyebrow="Semantic brief" title="The reusable customer context now available to the product">
          <div className="grid gap-4">
            <Card className="bg-ink-950 text-ivory-50">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 size-5 text-copper-300" />
                <div>
                  <p className="font-display text-3xl">The model no longer sees “User 123”.</p>
                  <p className="mt-3 text-sm leading-7 text-ivory-200">
                    It sees a profile with semantic attributes, confidence, freshness, and evidence. The same context can also power prioritisation, account views, playbooks, and product workflows outside the model.
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid gap-3 md:grid-cols-2">
              {featuredFacts.map((fact, index) => (
                <Card key={fact.key} className="bg-ivory-25">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-sage-700">{fact.label}</p>
                      <p className="mt-3 font-display text-3xl text-ink-950">{fact.value}</p>
                    </div>
                    <Badge tone={index % 2 === 0 ? 'accent' : 'success'}>
                      {factCitationLabel(fact.key, groundedFacts)}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-ink-700">{fact.explanation}</p>
                </Card>
              ))}
            </div>
          </div>
        </Panel>

        <Panel eyebrow="Selector mechanics" title="This interpretation is governed, not improvised">
          <div className="grid gap-3">
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Shapes className="mt-1 size-5 text-copper-700" />
                <div>
                  <p className="font-semibold text-ink-950">Selectors create the semantic contract</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    Admins define how raw fields, thresholds, scores, and formulas become canonical attributes like conversion probability, plan interest, churn risk, and sales urgency.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <FileSearch className="mt-1 size-5 text-sage-700" />
                <div>
                  <p className="font-semibold text-ink-950">Every fact carries provenance</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    The product stores where the value came from, when it was observed, how fresh it is, and which selector generated it. That makes the layer auditable and reusable.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-ivory-25">
              <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Published selector logic in this demo</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {publishedSelectors.slice(0, 6).map((selector) => (
                  <Badge key={selector.id} tone="neutral">
                    {selector.name}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </Panel>
      </section>

      <Panel eyebrow="Semantic timeline" title="The exact lift from raw event to canonical meaning">
        <div className="relative grid gap-4 pl-8">
          <div className="absolute bottom-2 left-3 top-3 w-px bg-copper-200" />
          {recentTimeline.slice().reverse().map((event, index) => {
            const narrative = getTimelineNarrative(event)
            return (
              <div key={`${event.occurredAtUtc}-${index}`} className="relative">
                <div className="absolute -left-[31px] top-7 size-4 rounded-full border-4 border-ivory-100 bg-copper-500 shadow-sm" />
                <Card className="bg-ivory-25">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="neutral">{getTimelineSourceSystem(event.category)}</Badge>
                      <Badge tone={narrative.tone}>{narrative.semanticLift}</Badge>
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-ink-500">
                      {shortTimeLabel(event.occurredAtUtc)}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-start">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Raw signal</p>
                      <p className="mt-2 text-sm leading-7 text-ink-800">{event.description}</p>
                    </div>
                    <div className="flex items-center justify-center text-copper-600">
                      <Waypoints className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Selector interpretation</p>
                      <p className="mt-2 text-sm leading-7 text-ink-700">{narrative.businessMeaning}</p>
                    </div>
                    <div className="flex items-center justify-center text-copper-600">
                      <Waypoints className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Context package effect</p>
                      <p className="mt-2 text-sm leading-7 text-ink-700">
                        The event now contributes to the same grounded profile that powers prioritisation, customer views, and AI recommendations.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>
      </Panel>

      <ExecutiveStoryFooter currentPath="/story/context-layer" />
    </div>
  )
}
