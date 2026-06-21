import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  ClipboardCheck,
  DatabaseZap,
  FileCheck2,
  ListChecks,
  PlayCircle,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import { JsonViewer } from '@/components/data-display/json-viewer'
import { Badge, Button, Field, Input, PageHeader, Panel, Select, Textarea } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import { cn, formatDateTime, humanizeEnum, prettyJson } from '@/lib/utils'
import { getConnectorMaturityLabels } from '@/features/connectors/connector-readiness'
import {
  buildConnectorValidationInput,
  buildDataScopeApproval,
  buildDefaultPilotSetupDraft,
  buildEndpointDryRunResult,
  buildLocalDryRunResult,
  buildPilotReadinessSummary,
  getPilotOutcome,
  getPilotSourceOption,
  pilotOutcomeOptions,
  pilotSourceOptions,
  scopeFieldOptions,
  type PilotDryRunResult,
  type PilotSetupDraft,
  type PilotSignOffStatus,
} from '@/features/pilot/pilot-setup-model'
import type { ConnectorPluginDefinition } from '@/lib/types'

function statusTone(status: 'complete' | 'needs-review' | 'blocked') {
  if (status === 'complete') {
    return 'success' as const
  }
  if (status === 'blocked') {
    return 'danger' as const
  }
  return 'warning' as const
}

function dryRunTone(status?: PilotDryRunResult['status']) {
  if (status === 'passed') {
    return 'success' as const
  }
  if (status === 'blocked') {
    return 'danger' as const
  }
  return 'warning' as const
}

function connectorMatches(plugin: ConnectorPluginDefinition, connectorType: string) {
  return plugin.connectorType === connectorType || plugin.aliases.includes(connectorType)
}

export function PilotSetupPage() {
  const { session } = useAuthSession()
  const [draft, setDraft] = useState<PilotSetupDraft>(() =>
    buildDefaultPilotSetupDraft(session?.email ?? 'operator@scout.local'),
  )
  const [dryRunResult, setDryRunResult] = useState<PilotDryRunResult | null>(null)
  const tenantSlug = session?.tenantSlug ?? 'demo'

  const catalogueQuery = useQuery({
    queryKey: ['connectorCatalogue'],
    queryFn: () => api.getConnectorCatalogue(),
  })
  const pluginsQuery = useQuery({
    queryKey: ['connectorPlugins'],
    queryFn: () => api.getConnectorPlugins(),
    enabled: Boolean(session),
  })

  const catalogue = useMemo(() => catalogueQuery.data ?? [], [catalogueQuery.data])
  const plugins = useMemo(() => pluginsQuery.data ?? [], [pluginsQuery.data])
  const executableConnectorTypes = useMemo(
    () => new Set(plugins.flatMap((plugin) => [plugin.connectorType, ...plugin.aliases])),
    [plugins],
  )
  const selectedSource = getPilotSourceOption(draft.connectorType)
  const selectedOutcome = getPilotOutcome(draft.outcomeId)
  const selectedEntry = catalogue.find((entry) => entry.connectorType === selectedSource.connectorType)
  const selectedPlugin = plugins.find((plugin) => connectorMatches(plugin, selectedSource.connectorType))
  const selectedMaturity = selectedEntry
    ? getConnectorMaturityLabels(selectedEntry, executableConnectorTypes.has(selectedEntry.connectorType))
    : []
  const approval = buildDataScopeApproval(draft)
  const readiness = buildPilotReadinessSummary(draft, approval, dryRunResult)

  const dryRunMutation = useMutation({
    mutationFn: async () => {
      if (
        selectedSource.dryRunMode !== 'connector-validation' ||
        selectedEntry?.isPlaceholder ||
        selectedEntry?.availability !== 'OpenCore'
      ) {
        return buildLocalDryRunResult(draft, selectedEntry)
      }

      if (!selectedPlugin) {
        return buildLocalDryRunResult(draft, selectedEntry)
      }

      try {
        const validation = await api.validateConnectorConfiguration(
          buildConnectorValidationInput(draft, selectedPlugin),
        )
        return buildEndpointDryRunResult(validation)
      } catch (error) {
        const fallback = buildLocalDryRunResult(draft, selectedEntry)
        return {
          ...fallback,
          messages: [
            `Connector validation endpoint unavailable: ${(error as Error).message}`,
            ...fallback.messages,
          ],
        }
      }
    },
    onSuccess: (result) => setDryRunResult(result),
  })

  function updateDraft(patch: Partial<PilotSetupDraft>) {
    setDraft((current) => ({ ...current, ...patch }))
  }

  function toggleScopeField(fieldId: string) {
    setDraft((current) => {
      const scoped = new Set(current.scopedFieldIds)
      if (scoped.has(fieldId)) {
        scoped.delete(fieldId)
      } else {
        scoped.add(fieldId)
      }

      return {
        ...current,
        scopedFieldIds: Array.from(scoped),
      }
    })
  }

  if (!session) {
    return null
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Pilot setup"
        title="Operator-assisted setup for the first Scout pilot."
        description="Choose the pilot outcome, approve the data scope, dry-run the source path, and produce a readiness summary without implying self-serve SaaS or vendor-certified connectors."
        actions={
          <Link to="/relationship-intelligence">
            <Button type="button" variant="secondary">
              <FileCheck2 className="size-4" />
              Inspect relationship JSON
            </Button>
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {readiness.items.map((item) => (
          <div key={item.label} className="rounded-[24px] border border-ink-900/8 bg-ivory-50/88 p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-ink-950">{item.label}</p>
              <Badge tone={statusTone(item.status)}>{humanizeEnum(item.status)}</Badge>
            </div>
            <p className="mt-3 text-sm leading-7 text-ink-700">{item.detail}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 2xl:grid-cols-[1fr_0.9fr]">
        <Panel
          eyebrow="Step 1"
          title="Choose the paid-pilot outcome"
          action={<Badge tone="neutral">Tenant {tenantSlug}</Badge>}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {pilotOutcomeOptions.map((outcome) => {
              const active = draft.outcomeId === outcome.id
              return (
                <button
                  key={outcome.id}
                  type="button"
                  className={cn(
                    'rounded-[22px] border px-4 py-4 text-left transition',
                    active
                      ? 'border-copper-400 bg-copper-500/10'
                      : 'border-ink-900/8 bg-ivory-25 hover:border-copper-300',
                  )}
                  onClick={() =>
                    updateDraft({
                      outcomeId: outcome.id,
                      purpose: outcome.purpose,
                    })
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-950">{outcome.label}</p>
                      <p className="mt-2 text-sm leading-7 text-ink-700">{outcome.successCriteria}</p>
                    </div>
                    {active ? <CheckCircle2 className="mt-1 size-5 shrink-0 text-sage-700" /> : null}
                  </div>
                  <Badge tone="accent" className="mt-4">{outcome.purpose}</Badge>
                </button>
              )
            })}
          </div>
        </Panel>

        <Panel
          eyebrow="Step 2"
          title="Declare source ownership and purpose"
          action={<Badge tone={approval.sourceOwner ? 'success' : 'warning'}>Owner required</Badge>}
        >
          <div className="grid gap-5">
            <Field label="Source owner">
              <Input
                value={draft.sourceOwner}
                onChange={(event) => updateDraft({ sourceOwner: event.target.value })}
                placeholder="name@example.com"
              />
            </Field>
            <Field label="Purpose">
              <Input
                value={draft.purpose}
                onChange={(event) => updateDraft({ purpose: event.target.value })}
                placeholder={selectedOutcome.purpose}
              />
            </Field>
            <Field label="Sign-off status">
              <Select
                value={draft.signOffStatus}
                onChange={(event) => updateDraft({ signOffStatus: event.target.value as PilotSignOffStatus })}
              >
                <option value="draft">Draft</option>
                <option value="owner-review">Owner review</option>
                <option value="approved-for-dry-run">Approved for dry-run</option>
                <option value="blocked">Blocked</option>
              </Select>
            </Field>
          </div>
        </Panel>
      </div>

      <Panel
        eyebrow="Step 3"
        title="Choose the source path and connector readiness"
        action={<Badge tone={catalogueQuery.isError ? 'warning' : 'success'}>{catalogue.length || pilotSourceOptions.length} catalogue paths</Badge>}
      >
        {catalogueQuery.isError ? (
          <p className="mb-4 text-sm font-semibold text-rosewood-700">{catalogueQuery.error.message}</p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {pilotSourceOptions.map((source) => {
            const entry = catalogue.find((item) => item.connectorType === source.connectorType)
            const active = draft.connectorType === source.connectorType
            const labels = entry
              ? getConnectorMaturityLabels(entry, executableConnectorTypes.has(entry.connectorType))
              : []

            return (
              <button
                key={source.connectorType}
                type="button"
                className={cn(
                  'rounded-[22px] border px-4 py-4 text-left transition',
                  active
                    ? 'border-copper-400 bg-copper-500/10'
                    : 'border-ink-900/8 bg-ivory-25 hover:border-copper-300',
                )}
                onClick={() => {
                  updateDraft({ connectorType: source.connectorType })
                  setDryRunResult(null)
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-950">{source.label}</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">{source.description}</p>
                  </div>
                  {active ? <DatabaseZap className="mt-1 size-5 shrink-0 text-copper-700" /> : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="neutral">{source.dataSourceKind}</Badge>
                  {labels.map((label) => (
                    <Badge key={label.label} tone={label.tone}>
                      {label.label}
                    </Badge>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-5 rounded-[24px] border border-ink-900/8 bg-ink-950/[0.03] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink-950">{selectedSource.label}</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">{selectedSource.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedMaturity.map((label) => (
                <Badge key={label.label} tone={label.tone}>
                  {label.label}
                </Badge>
              ))}
            </div>
          </div>
          <JsonViewer
            value={buildConnectorValidationInput(draft, selectedPlugin)}
            title="Dry-run request preview"
            height="h-60"
          />
        </div>
      </Panel>

      <div className="grid gap-4 2xl:grid-cols-[1fr_0.9fr]">
        <Panel
          eyebrow="Step 4"
          title="Approve the data scope"
          action={
            <Badge tone={approval.hasSensitiveOrPiiInScope ? 'warning' : 'success'}>
              {approval.hasSensitiveOrPiiInScope ? 'PII/sensitive data marker' : 'No sensitive scope'}
            </Badge>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            {scopeFieldOptions.map((field) => {
              const checked = draft.scopedFieldIds.includes(field.id)
              return (
                <label
                  key={field.id}
                  className={cn(
                    'grid cursor-pointer gap-3 rounded-[22px] border px-4 py-4 transition',
                    checked ? 'border-sage-500 bg-sage-500/10' : 'border-ink-900/8 bg-ivory-25',
                  )}
                >
                  <span className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleScopeField(field.id)}
                      className="mt-1 size-4 accent-copper-600"
                    />
                    <span>
                      <span className="font-semibold text-ink-950">{field.label}</span>
                      <span className="mt-1 block text-sm leading-6 text-ink-700">{field.masking}</span>
                    </span>
                  </span>
                  <span className="flex flex-wrap gap-2">
                    <Badge tone="neutral">{field.category}</Badge>
                    {field.isSensitiveOrPii ? <Badge tone="warning">Sensitive/PII</Badge> : null}
                    <Badge tone={checked ? 'success' : 'neutral'}>{checked ? 'In scope' : 'Out of scope'}</Badge>
                  </span>
                </label>
              )
            })}
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field label="Retention note">
              <Textarea
                value={draft.retentionNote}
                onChange={(event) => updateDraft({ retentionNote: event.target.value })}
                className="min-h-[120px]"
              />
            </Field>
            <Field label="Masking note">
              <Textarea
                value={draft.maskingNote}
                onChange={(event) => updateDraft({ maskingNote: event.target.value })}
                className="min-h-[120px]"
              />
            </Field>
          </div>
        </Panel>

        <Panel
          eyebrow="Data scope approval"
          title="Source owner, purpose, fields, PII, retention, masking, and sign-off"
          action={<Badge tone={statusTone(readiness.items[3].status)}>{humanizeEnum(readiness.items[3].status)}</Badge>}
        >
          <div className="grid gap-4">
            <div className="rounded-[22px] border border-ink-900/8 bg-ivory-25 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Owner and purpose</p>
              <p className="mt-2 font-semibold text-ink-950">{approval.sourceOwner || 'Owner not declared'}</p>
              <p className="mt-2 text-sm leading-7 text-ink-700">{approval.purpose || 'Purpose not declared'}</p>
            </div>

            <div className="rounded-[22px] border border-ink-900/8 bg-ivory-25 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Fields in scope</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {approval.inScopeFields.map((field) => (
                  <Badge key={field.id} tone={field.isSensitiveOrPii ? 'warning' : 'success'}>
                    {field.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-ink-900/8 bg-ivory-25 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Fields out of scope</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {approval.outOfScopeFields.map((field) => (
                  <Badge key={field.id} tone="neutral">
                    {field.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-ink-900/8 bg-ivory-25 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-sage-700">PII/sensitive data marker</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {approval.hasSensitiveOrPiiInScope ? (
                  approval.sensitiveCategoryLabels.map((category) => (
                    <Badge key={category} tone="warning">
                      {category}
                    </Badge>
                  ))
                ) : (
                  <Badge tone="success">No sensitive categories selected</Badge>
                )}
              </div>
            </div>

            <JsonViewer
              value={approval}
              title="Local approval record preview"
              height="h-72"
            />
          </div>
        </Panel>
      </div>

      <section className="grid gap-4 2xl:grid-cols-[0.8fr_1.2fr]">
        <Panel
          eyebrow="Step 5"
          title="Run or simulate connector validation"
          action={
            dryRunResult ? (
              <Badge tone={dryRunTone(dryRunResult.status)}>{humanizeEnum(dryRunResult.status)}</Badge>
            ) : (
              <Badge tone="neutral">Not run</Badge>
            )
          }
        >
          <div className="grid gap-4">
            <div className="rounded-[22px] border border-ink-900/8 bg-ivory-25 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 size-5 text-sage-700" />
                <div>
                  <p className="font-semibold text-ink-950">Boundary guardrails</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    The dry-run validates configuration shape or records a local/private review result. It does not claim vendor certification, move private connector code into Scout, or send customer intelligence to Cloud.
                  </p>
                </div>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => dryRunMutation.mutate()}
              disabled={dryRunMutation.isPending}
              className="w-fit"
            >
              <PlayCircle className="size-4" />
              {dryRunMutation.isPending ? 'Running dry-run...' : 'Run connector dry-run'}
            </Button>

            {pluginsQuery.isError ? (
              <p className="text-sm font-semibold text-rosewood-700">{pluginsQuery.error.message}</p>
            ) : null}

            {dryRunResult ? (
              <div className="rounded-[22px] border border-ink-900/8 bg-ivory-25 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-950">{dryRunResult.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink-500">
                      {formatDateTime(dryRunResult.checkedAtUtc)} · {humanizeEnum(dryRunResult.mode)}
                    </p>
                  </div>
                  <Badge tone={dryRunTone(dryRunResult.status)}>{humanizeEnum(dryRunResult.status)}</Badge>
                </div>
                <ul className="mt-4 grid gap-2 text-sm leading-7 text-ink-700">
                  {dryRunResult.messages.map((message) => (
                    <li key={message} className="flex items-start gap-2">
                      <ClipboardCheck className="mt-1 size-4 shrink-0 text-copper-700" />
                      <span>{message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel
          eyebrow="Pilot readiness summary"
          title={readiness.label}
          action={
            <Badge
              tone={
                readiness.status === 'ready-for-operator-review'
                  ? 'success'
                  : readiness.status === 'blocked'
                    ? 'danger'
                    : 'warning'
              }
            >
              {humanizeEnum(readiness.status)}
            </Badge>
          }
        >
          <div className="grid gap-4">
            <div className="rounded-[22px] border border-ink-900/8 bg-ivory-25 p-4">
              <div className="flex items-start gap-3">
                {readiness.status === 'ready-for-operator-review' ? (
                  <CheckCircle2 className="mt-1 size-5 text-sage-700" />
                ) : readiness.status === 'blocked' ? (
                  <TriangleAlert className="mt-1 size-5 text-rosewood-700" />
                ) : (
                  <ListChecks className="mt-1 size-5 text-copper-700" />
                )}
                <div>
                  <p className="font-semibold text-ink-950">Demo-to-pilot converter output</p>
                  <p className="mt-2 text-sm leading-7 text-ink-700">
                    {selectedOutcome.label} using {selectedSource.label.toLowerCase()} for {approval.sourceOwner || 'an undeclared owner'}.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {readiness.items.map((item) => (
                <div key={item.label} className="rounded-[22px] border border-ink-900/8 bg-ivory-25 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-ink-950">{item.label}</p>
                    <Badge tone={statusTone(item.status)}>{humanizeEnum(item.status)}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-ink-700">{item.detail}</p>
                </div>
              ))}
            </div>

            <JsonViewer
              value={{
                readiness,
                approval,
                dryRun: dryRunResult,
                connector: {
                  connectorType: selectedSource.connectorType,
                  maturity: selectedMaturity,
                  request: buildConnectorValidationInput(draft, selectedPlugin),
                },
                productionPersistenceFollowUp:
                  'Persist signed approval records and dry-run evidence in a customer-approved store before production-style pilot operation.',
              }}
              title="Pilot readiness JSON"
              height="h-[420px]"
            />

            <pre className="sr-only">{prettyJson({ readiness, approval })}</pre>
          </div>
        </Panel>
      </section>
    </div>
  )
}
