import { Link } from '@tanstack/react-router'
import { ArrowRight, Database, Files, MessageSquareWarning, Radar, Waypoints } from 'lucide-react'
import { Badge, Button, Card, PageHeader, Panel } from '@/components/ui/primitives'
import {
  executiveStorySteps,
  getTimelineSourceSystem,
  shortTimeLabel,
  useExecutiveDemoData,
} from '@/features/demo/executive-demo-data'
import { ExecutiveStoryFooter } from '@/features/demo/executive-story-footer'
import { safeJsonParse } from '@/lib/utils'

export function StorySourceSignalsPage() {
  const { contextQuery, featuredUser, recentTimeline } = useExecutiveDemoData()
  const rawSummary = safeJsonParse<Record<string, unknown>>(
    contextQuery.data?.sourceSummary?.rawSummaryJson ?? '{}',
    {},
  )

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Step 2 of 5"
        title="What the legacy estate already knows"
        description="This page is the problem statement. These are real operational signals that already exist, but they are fragmented across systems and too raw for AI to use safely on their own."
        actions={
          <Link to={executiveStorySteps[2].to}>
            <Button>
              Show the semantic lift
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel eyebrow="Raw account picture" title={`${featuredUser?.fullName ?? 'Featured user'} in the source systems`}>
          <div className="grid gap-4">
            <Card className="bg-ivory-25">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">CRM record</Badge>
                <Badge tone="neutral">Product usage rollup</Badge>
                <Badge tone="neutral">Support history</Badge>
                <Badge tone="neutral">Web conversion trail</Badge>
              </div>
              <p className="mt-4 text-sm leading-7 text-ink-700">
                The business already has these facts. The problem is that each system captures a fragment of the customer, and none of them provide one trusted commercial interpretation across the product.
              </p>
            </Card>

            <div className="grid gap-3 md:grid-cols-2">
              <Card className="bg-ivory-25">
                <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Operational identity</p>
                <p className="mt-3 font-display text-3xl text-ink-950">User {featuredUser?.externalUserId ?? '123'}</p>
                <p className="mt-2 text-sm leading-7 text-ink-700">
                  One identifier spread across CRM, support, usage, and web systems with no shared narrative above it.
                </p>
              </Card>
              <Card className="bg-ivory-25">
                <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Visible account signals</p>
                <div className="mt-3 grid gap-2 text-sm text-ink-700">
                  <p>Pricing visits: {contextQuery.data?.sourceSummary?.pricingPageVisits30d ?? '—'}</p>
                  <p>Open opportunities: {contextQuery.data?.sourceSummary?.openOpportunities ?? '—'}</p>
                  <p>Email replies: {contextQuery.data?.sourceSummary?.emailReplies30d ?? '—'}</p>
                  <p>Support tickets: {contextQuery.data?.sourceSummary?.openSupportTickets ?? '—'}</p>
                </div>
              </Card>
            </div>

            <Card className="bg-ink-950 text-ivory-50">
              <div className="flex items-start gap-3">
                <MessageSquareWarning className="mt-1 size-5 text-copper-300" />
                <div>
                  <p className="font-semibold text-ivory-50">Why AI fails from here</p>
                  <p className="mt-2 text-sm leading-7 text-ivory-200">
                    If you send these fragments directly into an LLM, it sees raw IDs, disconnected events, and inconsistent business semantics. The output may be articulate, but it is not reliably grounded.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Panel>

        <Panel eyebrow="Event sequence" title="The raw customer timeline before Context Layer">
          <div className="relative grid gap-4 pl-8">
            <div className="absolute bottom-2 left-3 top-3 w-px bg-ink-300/70" />
            {recentTimeline.slice().reverse().map((event, index) => (
              <div key={`${event.occurredAtUtc}-${index}`} className="relative">
                <div className="absolute -left-[31px] top-7 size-4 rounded-full border-4 border-ivory-100 bg-ink-500 shadow-sm" />
                <Card className="bg-ivory-25">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="neutral">{getTimelineSourceSystem(event.category)}</Badge>
                      <Badge tone="warning">{event.category}</Badge>
                    </div>
                    <p className="text-xs uppercase tracking-[0.18em] text-ink-500">
                      {shortTimeLabel(event.occurredAtUtc)}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-sage-700">What happened</p>
                      <p className="mt-2 text-sm leading-7 text-ink-800">{event.description}</p>
                    </div>
                    <div className="flex items-center justify-center text-ink-500">
                      <Waypoints className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-sage-700">What the source system alone can say</p>
                      <p className="mt-2 text-sm leading-7 text-ink-700">
                        {getTimelineSourceSystem(event.category)} recorded the activity, but the product still lacks one reusable business interpretation.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <Panel eyebrow="What the estate looks like to software" title="Operational fragments, not product-ready meaning">
          <div className="grid gap-3">
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Database className="mt-1 size-5 text-copper-700" />
                <div>
                  <p className="font-semibold text-ink-950">Data is still system-shaped</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    Each source stores its own terms, thresholds, field names, and assumptions. That is fine for operations, but weak for shared product intelligence.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Files className="mt-1 size-5 text-sage-700" />
                <div>
                  <p className="font-semibold text-ink-950">No canonical customer brief</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    Different teams can look at the same account and reach different conclusions because no semantic layer is reconciling the signals consistently.
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-ivory-25">
              <div className="flex items-start gap-3">
                <Radar className="mt-1 size-5 text-gold-700" />
                <div>
                  <p className="font-semibold text-ink-950">AI sees symptoms, not business meaning</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    Without a context layer, the model has to infer intent, urgency, risk, and fit from raw traces. That is exactly where hallucination and inconsistent judgement creep in.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </Panel>

        <Panel eyebrow="Illustrative raw payload" title="This is useful data, but it is not yet a reusable context product">
          <Card className="bg-ink-950 text-ivory-50">
            <pre className="overflow-x-auto whitespace-pre-wrap break-words text-sm leading-7 text-ivory-100">
              {JSON.stringify(
                {
                  externalAccountId: rawSummary.externalAccountId ?? contextQuery.data?.sourceSummary?.externalAccountId,
                  accountName: contextQuery.data?.sourceSummary?.accountName,
                  activePlanName: contextQuery.data?.sourceSummary?.activePlanName,
                  pricingPageVisits30d: contextQuery.data?.sourceSummary?.pricingPageVisits30d,
                  openOpportunities: contextQuery.data?.sourceSummary?.openOpportunities,
                  openSupportTickets: contextQuery.data?.sourceSummary?.openSupportTickets,
                  emailReplies30d: contextQuery.data?.sourceSummary?.emailReplies30d,
                  activeDays30: contextQuery.data?.sourceSummary?.activeDays30,
                },
                null,
                2,
              )}
            </pre>
          </Card>
        </Panel>
      </section>

      <ExecutiveStoryFooter currentPath="/story/source-signals" />
    </div>
  )
}
