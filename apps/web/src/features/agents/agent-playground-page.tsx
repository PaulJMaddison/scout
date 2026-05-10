import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Bot, Mail, Send, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react'
import { JsonViewer } from '@/components/data-display/json-viewer'
import {
  Badge,
  Button,
  Card,
  Divider,
  Field,
  Input,
  PageHeader,
  Panel,
  Select,
  Textarea,
} from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import { queryClient } from '@/app/providers'
import { formatConfidence, formatDateTime, safeJsonParse } from '@/lib/utils'
import type { AgentRunResult, RecommendationEvidence, SalesSupportResponse } from '@/lib/types'

export function AgentPlaygroundPage() {
  const { session } = useAuthSession()
  const [selectedUser, setSelectedUser] = useState('123')
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<string>('')
  const [modelName, setModelName] = useState('gpt-5.5')
  const [providerName, setProviderName] = useState('mock')
  const [salesObjective, setSalesObjective] = useState(
    'Book a 20-minute discovery call about enterprise plan rollout in the next seven days.',
  )
  const tenantSlug = session?.tenantSlug ?? 'demo'

  const usersQuery = useQuery({
    queryKey: ['userProfiles', tenantSlug],
    queryFn: () => api.getUserProfiles(tenantSlug),
    enabled: Boolean(session),
  })

  const promptTemplatesQuery = useQuery({
    queryKey: ['promptTemplates', tenantSlug],
    queryFn: () => api.getPromptTemplates(tenantSlug),
    enabled: Boolean(session),
  })

  const activePromptTemplate =
    promptTemplatesQuery.data?.find((template) => template.id === selectedPromptTemplate) ??
    promptTemplatesQuery.data?.[0] ??
    null

  const contextPackageQuery = useQuery({
    queryKey: ['salesContextPackage', tenantSlug, selectedUser, salesObjective],
    queryFn: () =>
      api.getSalesContextPackage({
        tenantSlug,
        externalUserId: selectedUser,
        salesObjective,
      }),
    enabled: Boolean(session && selectedUser && salesObjective.trim()),
  })

  const agentRunsQuery = useQuery({
    queryKey: ['agentRuns', tenantSlug, selectedUser],
    queryFn: () => api.getAgentRuns(tenantSlug, selectedUser),
    enabled: Boolean(session && selectedUser),
  })

  const generateMutation = useMutation({
    mutationFn: () =>
      api.createAgentRun({
        tenantSlug,
        externalUserId: selectedUser,
        promptTemplateId: activePromptTemplate?.id ?? '',
        modelName,
        salesObjective,
        providerName,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agentRuns', tenantSlug, selectedUser] })
    },
  })

  const latestRun = useMemo<AgentRunResult | null>(() => {
    if (generateMutation.data) {
      return generateMutation.data
    }

    const historicalRun = agentRunsQuery.data?.[0]
    if (!historicalRun) {
      return null
    }

    const parsedInput = safeJsonParse<{ contextPackage?: unknown }>(historicalRun.inputJson, {})

    return {
      agentRunId: historicalRun.id,
      status: historicalRun.status,
      providerName: historicalRun.providerName,
      modelName: historicalRun.modelName,
      salesObjective: historicalRun.salesObjective,
      confidence: historicalRun.confidence,
      attemptCount: historicalRun.attemptCount,
      humanReviewRecommended: false,
      contextPackageJson: JSON.stringify(parsedInput.contextPackage ?? {}, null, 2),
      outputJson: historicalRun.outputJson,
      provenanceJson: historicalRun.provenanceJson,
      validationErrorsJson: '[]',
      failureReason: historicalRun.failureReason ?? null,
    }
  }, [agentRunsQuery.data, generateMutation.data])

  const parsedOutput = useMemo(() => {
    return latestRun ? safeJsonParse<SalesSupportResponse | null>(latestRun.outputJson, null) : null
  }, [latestRun])

  const validationErrors = useMemo(() => {
    return latestRun ? safeJsonParse<string[]>(latestRun.validationErrorsJson, []) : []
  }, [latestRun])

  const recommendationEvidence = useMemo(() => {
    return latestRun ? safeJsonParse<RecommendationEvidence[]>(latestRun.provenanceJson, []) : []
  }, [latestRun])

  const guardrails = useMemo(() => {
    return activePromptTemplate
      ? safeJsonParse<string[]>(activePromptTemplate.guardrailsJson, [])
      : []
  }, [activePromptTemplate])

  if (!session) {
    return null
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Rep copilot"
        title="Generate sales recommendations grounded in real customer context"
        description="Build the context package for a sales objective, then produce a strategy, email draft, and follow-up plan that cite the exact facts behind the advice."
        actions={
          <Button
            type="button"
            onClick={() => generateMutation.mutate()}
            disabled={!activePromptTemplate?.id || !salesObjective.trim() || generateMutation.isPending}
          >
            <Send className="mr-2 size-4" />
            Generate recommendation
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Panel eyebrow="Controls" title="Generation inputs">
          <div className="grid gap-5">
            <Field label="Customer">
              <Select value={selectedUser} onChange={(event) => setSelectedUser(event.target.value)}>
                {(usersQuery.data ?? []).map((user) => (
                  <option key={user.id} value={user.externalUserId}>
                    {user.fullName} · {user.companyName}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Sales objective" hint="Required for grounded planning">
              <Textarea
                value={salesObjective}
                onChange={(event) => setSalesObjective(event.target.value)}
                className="min-h-[170px]"
              />
            </Field>

            <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-1">
              <Field label="Prompt template">
                <Select
                  value={activePromptTemplate?.id ?? ''}
                  onChange={(event) => setSelectedPromptTemplate(event.target.value)}
                >
                  {(promptTemplatesQuery.data ?? []).map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Model">
                <Input value={modelName} onChange={(event) => setModelName(event.target.value)} />
              </Field>
            </div>

            <Field label="Provider">
              <Input value={providerName} onChange={(event) => setProviderName(event.target.value)} />
            </Field>

            <Card className="bg-ink-950 text-ivory-50">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 size-5 text-copper-300" />
                <div>
                  <p className="font-display text-2xl">Guardrails in effect</p>
                  <p className="mt-2 text-sm leading-7 text-ivory-200">
                    The model only sees the grounded package below, must cite facts, and should recommend human review whenever the evidence gets thin.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-2">
                {guardrails.map((guardrail) => (
                  <div
                    key={guardrail}
                    className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-ivory-100"
                  >
                    {guardrail}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Panel>

        <div className="grid gap-4 xl:col-span-1">
          <Panel
            eyebrow="Grounded package"
            title={contextPackageQuery.data?.fullName ?? 'Context package'}
            action={
              contextPackageQuery.data ? (
                <div className="flex flex-wrap gap-2">
                  <Badge tone={contextPackageQuery.data.isStale ? 'warning' : 'success'}>
                    {contextPackageQuery.data.isStale ? 'Stale signals present' : 'Fresh snapshot'}
                  </Badge>
                  <Badge
                    tone={contextPackageQuery.data.humanReviewRecommended ? 'warning' : 'accent'}
                  >
                    {contextPackageQuery.data.humanReviewRecommended
                      ? 'Human review recommended'
                      : formatConfidence(contextPackageQuery.data.overallConfidence)}
                  </Badge>
                </div>
              ) : null
            }
          >
            {contextPackageQuery.data ? (
              <div className="grid gap-4">
                <Card className="bg-ivory-25">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-sage-700">
                        Sales objective
                      </p>
                      <h3 className="mt-3 font-display text-3xl text-ink-950">
                        {contextPackageQuery.data.salesObjective}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-ink-700">
                        {contextPackageQuery.data.summary}
                      </p>
                    </div>
                    <div className="rounded-[24px] border border-ink-900/8 bg-ivory-50 px-4 py-4 text-sm text-ink-700">
                      <p>Snapshot generated {formatDateTime(contextPackageQuery.data.generatedAtUtc)}</p>
                      <p className="mt-1">{formatConfidence(contextPackageQuery.data.overallConfidence)}</p>
                    </div>
                  </div>
                </Card>

                {(contextPackageQuery.data.weakSignalMessages.length > 0 ||
                  contextPackageQuery.data.missingInformation.length > 0) && (
                  <Card className="bg-gold-500/10">
                    <div className="flex items-start gap-3">
                      <TriangleAlert className="mt-1 size-5 text-gold-700" />
                      <div className="grid gap-3">
                        <div>
                          <p className="font-semibold text-ink-950">Review before sending</p>
                          <p className="text-sm text-ink-700">
                            The context package has weak or missing signals that the model must acknowledge.
                          </p>
                        </div>
                        {contextPackageQuery.data.weakSignalMessages.map((signal) => (
                          <Badge key={signal} tone="warning" className="justify-start">
                            {signal}
                          </Badge>
                        ))}
                        {contextPackageQuery.data.missingInformation.map((item) => (
                          <Badge key={item} tone="danger" className="justify-start">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </Card>
                )}

                <Panel
                  eyebrow="Fact sheet"
                  title="Semantic facts with citations"
                  className="bg-ivory-50/70"
                >
                  <div className="grid gap-3">
                    {contextPackageQuery.data.facts.map((fact) => (
                      <Card key={fact.factId} className="bg-ivory-25 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-sage-700">
                              {fact.citationId}
                            </p>
                            <h4 className="mt-2 font-display text-2xl text-ink-950">
                              {fact.displayName}
                            </h4>
                            <p className="mt-2 text-sm text-ink-700">
                              {JSON.stringify(safeJsonParse(fact.valueJson, fact.valueJson))}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge tone={fact.isLowConfidence ? 'warning' : 'success'}>
                              {formatConfidence(fact.confidence)}
                            </Badge>
                            <Badge tone={fact.isFresh ? 'accent' : 'warning'}>
                              {fact.isFresh ? 'Fresh' : 'Stale'}
                            </Badge>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-ink-700">{fact.explanation}</p>
                      </Card>
                    ))}
                  </div>
                </Panel>

                <JsonViewer
                  value={safeJsonParse(contextPackageQuery.data.contextPackageJson, {})}
                  title="Context package JSON sent to the model"
                  height="h-72 lg:h-80 2xl:h-[420px]"
                />
              </div>
            ) : (
              <Card className="bg-ivory-25">
                <p className="text-sm leading-7 text-ink-700">
                  Choose a user and objective to build the grounded payload the model will receive.
                </p>
              </Card>
            )}
          </Panel>
        </div>

        <div className="grid gap-4 xl:col-span-2 2xl:col-span-1">
          <Panel
            eyebrow="Generated recommendation"
            title="Sales support output"
            action={
              latestRun ? (
                <div className="flex flex-wrap gap-2">
                  <Badge tone="accent">{latestRun.providerName}</Badge>
                  <Badge tone={parsedOutput?.humanReviewRecommended ? 'warning' : 'success'}>
                    {formatConfidence(latestRun.confidence)}
                  </Badge>
                </div>
              ) : (
                <Badge tone="neutral">Waiting for run</Badge>
              )
            }
          >
            {parsedOutput ? (
              <div className="grid gap-4">
                {validationErrors.length > 0 && (
                  <Card className="bg-rosewood-500/10">
                    <p className="font-semibold text-rosewood-900">Validation warnings</p>
                    <div className="mt-3 grid gap-2">
                      {validationErrors.map((error) => (
                        <Badge key={error} tone="danger" className="justify-start">
                          {error}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                <Card className="bg-ink-950 text-ivory-50">
                  <div className="flex items-center gap-3">
                    <Bot className="size-5 text-copper-300" />
                    <p className="font-display text-2xl">Outreach strategy</p>
                  </div>
                  <p className="mt-4 text-sm leading-7">{parsedOutput.outreachStrategy.summary}</p>
                  <div className="mt-5 grid gap-3">
                    {parsedOutput.outreachStrategy.keyTalkingPoints.map((point) => (
                      <div
                        key={`${point.text}-${point.citations.join('-')}`}
                        className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-4"
                      >
                        <p className="text-sm leading-7 text-ivory-100">{point.text}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {point.citations.map((citation) => (
                            <Badge key={citation} tone="accent">
                              {citation}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="bg-ivory-25">
                  <div className="flex items-center gap-3">
                    <Mail className="size-5 text-sage-700" />
                    <div>
                      <p className="font-display text-2xl text-ink-950">Personalized email draft</p>
                      <p className="text-sm text-ink-600">
                        Tailored to the selected objective and grounded facts.
                      </p>
                    </div>
                  </div>
                  <Divider />
                  <div className="grid gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Subject line</p>
                      <p className="mt-2 font-semibold text-ink-950">
                        {parsedOutput.personalizedEmailDraft.subjectLine}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Preview</p>
                      <p className="mt-2 text-sm text-ink-700">
                        {parsedOutput.personalizedEmailDraft.previewText}
                      </p>
                    </div>
                    <pre className="overflow-x-auto rounded-[24px] border border-ink-900/8 bg-ivory-50 px-4 py-4 text-sm leading-7 text-ink-800 whitespace-pre-wrap">
                      {parsedOutput.personalizedEmailDraft.body}
                    </pre>
                    <div className="flex flex-wrap gap-2">
                      {parsedOutput.personalizedEmailDraft.supportingClaims.flatMap((claim) =>
                        claim.citations.map((citation) => (
                          <Badge key={`${claim.text}-${citation}`} tone="neutral">
                            {citation}
                          </Badge>
                        )),
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="bg-ivory-25">
                  <div className="flex items-center gap-3">
                    <Sparkles className="size-5 text-copper-700" />
                    <div>
                      <p className="font-display text-2xl text-ink-950">Follow-up recommendations</p>
                      <p className="text-sm text-ink-600">Actionable next steps with rationale and citations.</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {parsedOutput.followUpRecommendations.recommendations.map((recommendation) => (
                      <div
                        key={`${recommendation.action}-${recommendation.timing}`}
                        className="rounded-[22px] border border-ink-900/8 bg-ivory-50 px-4 py-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-semibold text-ink-950">{recommendation.action}</p>
                          <Badge tone="success">{formatConfidence(recommendation.confidence)}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-ink-600">{recommendation.timing}</p>
                        <p className="mt-3 text-sm leading-7 text-ink-700">
                          {recommendation.rationale}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {recommendation.citations.map((citation) => (
                            <Badge key={citation} tone="accent">
                              {citation}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {recommendationEvidence.length > 0 && (
                  <Card className="bg-sage-600/10">
                    <p className="font-display text-2xl text-ink-950">Why this was recommended</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">
                      These are the grounded facts the model actually cited while generating the strategy.
                    </p>
                    <div className="mt-4 grid gap-3">
                      {recommendationEvidence.map((fact) => (
                        <div
                          key={`${fact.citationId}-${fact.factId}`}
                          className="rounded-[22px] border border-ink-900/8 bg-ivory-50 px-4 py-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-sage-700">
                                {fact.citationId}
                              </p>
                              <p className="mt-2 font-semibold text-ink-950">{fact.displayName}</p>
                              <p className="mt-2 text-sm text-ink-600">
                                {JSON.stringify(safeJsonParse(fact.valueJson, fact.valueJson))}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge tone={fact.isLowConfidence ? 'warning' : 'success'}>
                                {formatConfidence(fact.confidence)}
                              </Badge>
                              <Badge tone={fact.isFresh ? 'accent' : 'warning'}>
                                {fact.isFresh ? 'Fresh' : 'Stale'}
                              </Badge>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-ink-700">{fact.explanation}</p>
                          <p className="mt-2 text-xs text-ink-500">
                            Observed {formatDateTime(fact.observedAtUtc)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {(parsedOutput.humanReviewRecommended ||
                  parsedOutput.followUpRecommendations.lowConfidenceSignals.length > 0) && (
                  <Card className="bg-gold-500/10">
                    <div className="flex items-start gap-3">
                      <TriangleAlert className="mt-1 size-5 text-gold-800" />
                      <div>
                        <p className="font-semibold text-ink-950">Why this needs review</p>
                        <p className="mt-2 text-sm leading-7 text-ink-700">
                          {parsedOutput.humanReviewReason || 'The model detected weak or missing evidence.'}
                        </p>
                        <div className="mt-3 grid gap-2">
                          {parsedOutput.followUpRecommendations.lowConfidenceSignals.map((signal) => (
                            <Badge key={signal} tone="warning" className="justify-start">
                              {signal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                <JsonViewer value={parsedOutput} title="Structured model output" height="h-64 lg:h-72 2xl:h-[320px]" />
              </div>
            ) : (
              <Card className="bg-ivory-25">
                <p className="text-sm leading-7 text-ink-700">
                  Generate a recommendation to inspect how the grounded package translates into a strategy, an email draft, and follow-up guidance.
                </p>
              </Card>
            )}

            {latestRun && (
              <p className="mt-4 text-xs text-ink-500">
                Provider {latestRun.providerName} · model {latestRun.modelName} · attempts {latestRun.attemptCount}
              </p>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
