import { useMemo, useState } from 'react'
import { Braces, GitBranch, ListTree, ShieldCheck, Waypoints } from 'lucide-react'
import { JsonViewer } from '@/components/data-display/json-viewer'
import { Badge, Button, Panel } from '@/components/ui/primitives'
import { cn, formatConfidence, formatDateTime, humanizeEnum, safeJsonParse } from '@/lib/utils'
import type { ExactLinkedRecordSummaryResult, NextActionResult, RelationshipResult } from '@/lib/types'

const explorerSections = [
  { id: 'exact', label: 'Exact data items', icon: ListTree },
  { id: 'relationships', label: 'Relationships', icon: GitBranch },
  { id: 'attribution', label: 'Attribution paths', icon: Waypoints },
  { id: 'governance', label: 'Citations and caveats', icon: ShieldCheck },
  { id: 'handoff', label: 'Scout fallback and handoff JSON', icon: Braces },
] as const

type ExplorerSection = (typeof explorerSections)[number]['id']

interface AttributionPathStep {
  step: number
  citationId: string
  recordType: string
  label: string
  observedAtUtc?: string | null
  summary: string
  relationshipIds: string[]
}

function labelize(value: string) {
  return humanizeEnum(value.replace(/([a-z0-9])([A-Z])/g, '$1_$2'))
}

function buildAttributionPathSteps(
  records: ExactLinkedRecordSummaryResult[],
  relationships: RelationshipResult[],
): AttributionPathStep[] {
  return [...records]
    .sort((left, right) => String(left.observedAtUtc ?? '').localeCompare(String(right.observedAtUtc ?? '')))
    .map((record, index) => ({
      step: index + 1,
      citationId: record.citationId,
      recordType: record.recordType,
      label: record.label,
      observedAtUtc: record.observedAtUtc,
      summary: record.summary,
      relationshipIds: relationships
        .filter((relationship) => relationship.citationIds.includes(record.citationId))
        .map((relationship) => relationship.relationshipId),
    }))
}

export function RelationshipJsonExplorer({ result }: { result: NextActionResult }) {
  const [activeSection, setActiveSection] = useState<ExplorerSection>('exact')
  const localPackage = useMemo(
    () => safeJsonParse<Record<string, unknown>>(result.evidencePack.localDerivedEvidencePackageJson, {}),
    [result.evidencePack.localDerivedEvidencePackageJson],
  )
  const cloudUsage = useMemo(
    () => safeJsonParse<Record<string, unknown>>(result.evidencePack.cloudAggregateUsagePayloadJson, {}),
    [result.evidencePack.cloudAggregateUsagePayloadJson],
  )
  const attributionSteps = useMemo(
    () => buildAttributionPathSteps(result.exactLinkedRecords.records, result.relationships),
    [result.exactLinkedRecords.records, result.relationships],
  )

  return (
    <Panel
      eyebrow="Relationship JSON explorer"
      title="Inspect exact data, attribution paths, masking, confidence, and handoff JSON"
      action={<Badge tone="accent">Scout fallback output</Badge>}
    >
      <div className="grid gap-5">
        <div className="flex flex-wrap gap-2">
          {explorerSections.map((section) => {
            const Icon = section.icon
            const active = activeSection === section.id
            return (
              <Button
                key={section.id}
                type="button"
                size="sm"
                variant={active ? 'primary' : 'secondary'}
                onClick={() => setActiveSection(section.id)}
              >
                <Icon className="size-4" />
                {section.label}
              </Button>
            )
          })}
        </div>

        {activeSection === 'exact' ? (
          <section className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {result.exactLinkedRecords.records.map((record) => (
                <div key={`${record.citationId}-${record.recordId}`} className="rounded-[22px] border border-ink-900/8 bg-ivory-25 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Badge tone={record.isMasked ? 'warning' : 'success'}>{record.citationId}</Badge>
                      <h3 className="mt-3 font-display text-xl text-ink-950">{record.label}</h3>
                      <p className="mt-1 text-sm text-ink-600">{labelize(record.recordType)}</p>
                    </div>
                    {record.isMasked ? <Badge tone="warning">Masked</Badge> : null}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-ink-700">{record.summary}</p>
                  <div className="mt-4 grid gap-2">
                    {Object.entries(record.fields).slice(0, 4).map(([field, value]) => (
                      <div key={`${record.citationId}-${field}`} className="rounded-[16px] bg-ivory-50 px-3 py-3">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-sage-700">{labelize(field)}</p>
                        <p className="mt-1 break-words text-sm text-ink-800">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <JsonViewer value={result.exactLinkedRecords} title="Exact data items JSON" height="h-[360px]" />
          </section>
        ) : null}

        {activeSection === 'relationships' ? (
          <section className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              {result.relationships.map((relationship) => (
                <div key={relationship.relationshipId} className="rounded-[22px] border border-ink-900/8 bg-ivory-25 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="neutral">{relationship.relationshipId}</Badge>
                        <Badge tone={relationship.linkKind === 'probabilistic' ? 'accent' : 'success'}>
                          {relationship.linkKind}
                        </Badge>
                      </div>
                      <h3 className="mt-3 font-display text-xl text-ink-950">
                        {labelize(relationship.relationshipType)}
                      </h3>
                      <p className="mt-1 break-words text-sm text-ink-600">
                        {relationship.sourceType} to {relationship.targetType}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="success">{formatConfidence(relationship.confidence)}</Badge>
                      <Badge tone="accent">Weight {formatConfidence(relationship.weight)}</Badge>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-ink-700">{relationship.rationale}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {relationship.citationIds.map((citationId) => (
                      <Badge key={citationId} tone="neutral">
                        {citationId}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <JsonViewer value={result.relationships} title="Relationships JSON" height="h-[360px]" />
          </section>
        ) : null}

        {activeSection === 'attribution' ? (
          <section className="grid gap-4">
            <div className="relative grid gap-4 pl-8">
              <div className="absolute bottom-2 left-3 top-3 w-px bg-copper-200" />
              {attributionSteps.map((step) => (
                <div key={`${step.step}-${step.citationId}`} className="relative">
                  <div className="absolute -left-[31px] top-6 size-4 rounded-full border-4 border-ivory-100 bg-copper-500 shadow-sm" />
                  <div className="rounded-[22px] border border-ink-900/8 bg-ivory-25 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge tone="accent">Step {step.step}</Badge>
                          <Badge tone="neutral">{step.citationId}</Badge>
                          <Badge tone="neutral">{labelize(step.recordType)}</Badge>
                        </div>
                        <h3 className="mt-3 font-display text-xl text-ink-950">{step.label}</h3>
                      </div>
                      <p className="text-xs uppercase tracking-[0.18em] text-ink-500">
                        {formatDateTime(step.observedAtUtc)}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-ink-700">{step.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {step.relationshipIds.length ? (
                        step.relationshipIds.map((relationshipId) => (
                          <Badge key={relationshipId} tone="success">
                            {relationshipId}
                          </Badge>
                        ))
                      ) : (
                        <Badge tone="neutral">No direct relationship citation</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <JsonViewer value={attributionSteps} title="Attribution paths JSON" height="h-[360px]" />
          </section>
        ) : null}

        {activeSection === 'governance' ? (
          <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
            <div className="grid gap-3">
              <div className="rounded-[22px] border border-sage-700/16 bg-sage-50/70 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Recommended action</p>
                <h3 className="mt-3 font-display text-2xl text-ink-950">{result.recommendedNextAction.action}</h3>
                <p className="mt-3 text-sm leading-7 text-ink-700">{result.recommendedNextAction.rationale}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="success">{formatConfidence(result.recommendedNextAction.score)}</Badge>
                  {result.recommendedNextAction.citationIds.map((citationId) => (
                    <Badge key={citationId} tone="accent">
                      {citationId}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="rounded-[22px] border border-gold-500/22 bg-gold-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Caveats</p>
                <ul className="mt-3 grid gap-2 text-sm leading-7 text-ink-800">
                  {result.caveats.map((caveat) => (
                    <li key={caveat}>{caveat}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[22px] border border-ink-900/8 bg-ivory-25 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Masking decisions</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.governance.maskedFields.length ? (
                    result.governance.maskedFields.map((field) => (
                      <Badge key={field} tone="warning">
                        {field}
                      </Badge>
                    ))
                  ) : (
                    <Badge tone="success">No masked fields in this view</Badge>
                  )}
                </div>
              </div>
            </div>

            <JsonViewer
              value={{
                recommendedNextAction: result.recommendedNextAction,
                confidence: result.confidence,
                caveats: result.caveats,
                provenance: result.provenance,
                governance: result.governance,
              }}
              title="Citations, confidence, and masking JSON"
              height="h-[520px]"
            />
          </section>
        ) : null}

        {activeSection === 'handoff' ? (
          <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="grid gap-3">
              <div className="rounded-[22px] border border-ink-900/8 bg-ivory-25 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Scout fallback signals</p>
                <div className="mt-3 grid gap-2">
                  {result.weightedSignals.map((signal) => (
                    <div
                      key={signal.signalKey}
                      className={cn(
                        'rounded-[18px] px-3 py-3',
                        signal.contribution < 0 ? 'bg-rosewood-500/10' : 'bg-ivory-50',
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-ink-950">{signal.label}</p>
                        <Badge tone={signal.contribution < 0 ? 'danger' : 'success'}>
                          {formatConfidence(signal.score)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-ink-700">{signal.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[22px] border border-ink-900/8 bg-ivory-25 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Handoff JSON boundary</p>
                <p className="mt-3 text-sm leading-7 text-ink-700">
                  Local handoff JSON stays in the customer-owned data plane. The Cloud payload shown here is aggregate usage metadata only.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="success">Raw data retained locally</Badge>
                  <Badge tone={result.evidencePack.cloudPayloadContainsRawCustomerData ? 'danger' : 'success'}>
                    {result.evidencePack.cloudPayloadContainsRawCustomerData ? 'Cloud payload risk' : 'Aggregate only'}
                  </Badge>
                </div>
              </div>
            </div>

            <JsonViewer
              value={{
                scoutFallbackSignals: result.weightedSignals,
                localDerivedPackage: localPackage,
                cloudAggregateUsagePayload: cloudUsage,
              }}
              title="Scout fallback and handoff JSON"
              height="h-[560px]"
            />
          </section>
        ) : null}
      </div>
    </Panel>
  )
}
