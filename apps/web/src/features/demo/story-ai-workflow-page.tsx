import { Link } from '@tanstack/react-router'
import { ArrowRight, Bot, MailCheck, MessageCircleReply, Sparkles, Target } from 'lucide-react'
import { Badge, Button, Card, PageHeader, Panel } from '@/components/ui/primitives'
import { executiveStorySteps, shortTimeLabel, useExecutiveDemoData } from '@/features/demo/executive-demo-data'
import { ExecutiveStoryFooter } from '@/features/demo/executive-story-footer'

export function StoryAiWorkflowPage() {
  const { interactionTimeline, latestOutput, salesPackageQuery } = useExecutiveDemoData()

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Step 4 of 5"
        title="Show one example consumer using a governed evidence pack."
        description="In this sales support example, a model receives exact cited business context, produces a next-best-action recommendation, and the product explains why that recommendation was made. Other consumers can use the same data plane."
        actions={
          <Link to={executiveStorySteps[4].to}>
            <Button>
              Finish with rollout and ROI
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel eyebrow="Interaction rule" title="The example model is never left to infer business meaning alone">
          <div className="grid gap-4">
            <Card className="bg-ink-950 text-ivory-50">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 size-5 text-copper-300" />
                <div>
                  <p className="font-display text-3xl">Grounded context in, explainable action out.</p>
                  <p className="mt-3 text-sm leading-7 text-ivory-200">
                    This recommendation engine works from a structured evidence package with {salesPackageQuery.data?.facts.length ?? 0} cited facts, confidence metadata, freshness rules, and masking decisions. Scout creates the context; the sales assistant is just one consumer.
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid gap-3 2xl:grid-cols-3">
              <Card className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <Bot className="mt-1 size-5 shrink-0 text-copper-700" />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-950">Advice</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">
                      The model recommends a channel, message, and next-best action using grounded facts rather than guesswork.
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <MessageCircleReply className="mt-1 size-5 shrink-0 text-sage-700" />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-950">Action</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">
                      The rep or workflow receives a usable recommendation that already includes the business rationale and citations.
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <Target className="mt-1 size-5 shrink-0 text-gold-700" />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-950">Result</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">
                      The product can prioritise the account, guide the next interaction, and explain exactly which evidence drove the recommendation.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Panel>

        <Panel eyebrow="Live proof" title="Current output from Intelligent Sales Support">
          <div className="grid gap-3">
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Bot className="mt-1 size-5 text-copper-700" />
                <div>
                  <p className="font-semibold text-ink-950">Outreach strategy</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    {latestOutput?.outreachStrategy.summary ??
                      'Generate the AI run to show the live strategy here.'}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <MailCheck className="mt-1 size-5 text-sage-700" />
                <div>
                  <p className="font-semibold text-ink-950">Email draft direction</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    {latestOutput?.personalizedEmailDraft.subjectLine ??
                      'The email draft will appear once the grounded run is available.'}
                  </p>
                  {latestOutput?.personalizedEmailDraft.previewText ? (
                    <p className="mt-2 text-sm leading-7 text-ink-600">
                      {latestOutput.personalizedEmailDraft.previewText}
                    </p>
                  ) : null}
                </div>
              </div>
            </Card>
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Target className="mt-1 size-5 text-gold-700" />
                <div>
                  <p className="font-semibold text-ink-950">Recommended next move</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    {latestOutput?.followUpRecommendations.recommendations[0]?.action ??
                      'The first grounded follow-up recommendation appears here.'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Panel>
      </section>

      <Panel eyebrow="Interaction timeline" title="The product story from signal to recommendation to business effect">
        <div className="relative grid gap-4 pl-8">
          <div className="absolute bottom-2 left-3 top-3 w-px bg-copper-200" />
          {interactionTimeline.map((beat) => (
            <div key={beat.id} className="relative">
              <div className="absolute -left-[31px] top-7 size-4 rounded-full border-4 border-ivory-100 bg-copper-500 shadow-sm" />
              <Card className="bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(248,241,231,0.98))]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="neutral">{beat.sourceSystem}</Badge>
                    <Badge tone={beat.tone}>{beat.semanticLift}</Badge>
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-500">
                    {shortTimeLabel(beat.occurredAtUtc)}
                  </p>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Signal</p>
                    <p className="mt-2 text-sm leading-7 text-ink-800">{beat.sourceSignal}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Context now available</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">{beat.contextNow}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Example consumer advice</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">{beat.aiAdvice}</p>
                    <p className="mt-3 rounded-[20px] bg-copper-500/10 px-3 py-3 text-sm leading-7 text-copper-900">
                      Recommended action: {beat.advisedAction}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Product result</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">{beat.result}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {beat.citations.map((citation) => (
                        <Badge key={`${beat.id}-${citation}`} tone="accent">
                          {citation}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </Panel>

      <ExecutiveStoryFooter currentPath="/story/ai-workflow" />
    </div>
  )
}
