import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, ClipboardCheck, Database, PlugZap, RadioTower, RefreshCcw, ShieldCheck } from 'lucide-react'
import { JsonViewer } from '@/components/data-display/json-viewer'
import { Badge, Button, Field, Input, PageHeader, Panel, Select, Textarea } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import { queryClient } from '@/app/providers'
import { formatDateTime, prettyJson, safeJsonParse } from '@/lib/utils'
import type { ConnectorPluginDefinition, DataSource, DataSourceKind } from '@/lib/types'

const dataSourceKindOptions = ['CRM', 'SQL_METRIC', 'PRODUCT_USAGE', 'EVENT_STREAM'] as const

const dataSourceKindLabels: Record<DataSourceKind, string> = {
  CRM: 'CRM',
  SQL_METRIC: 'SQL metric',
  PRODUCT_USAGE: 'Product usage',
  EVENT_STREAM: 'Event stream',
}

const pluginKindMap: Record<string, DataSourceKind> = {
  Crm: 'CRM',
  SqlMetric: 'SQL_METRIC',
  ProductUsage: 'PRODUCT_USAGE',
  EventStream: 'EVENT_STREAM',
}

const connectorSchema = z.object({
  id: z.string().optional().nullable(),
  name: z.string().min(3),
  description: z.string().min(10),
  kind: z.enum(dataSourceKindOptions),
  connectorType: z.string().min(1),
  configurationJson: z.string().refine((value) => isJsonObjectText(value), {
    message: 'Configuration must be a JSON object.',
  }),
  credentialsJson: z.string().optional().refine((value) => isJsonObjectText(value ?? '', true), {
    message: 'Credentials must be blank or a JSON object.',
  }),
  healthExternalUserId: z.string().optional(),
  eventSourceSystem: z.string().min(2),
  eventType: z.string().min(2),
  eventExternalUserId: z.string().optional(),
  eventExternalAccountId: z.string().optional(),
  eventPayloadJson: z.string().refine((value) => isJsonObjectText(value), {
    message: 'Event payload must be a JSON object.',
  }),
})

type DataSourceFormValues = z.infer<typeof connectorSchema>

function isJsonObjectText(value: string, allowEmpty = false) {
  if (allowEmpty && !value.trim()) {
    return true
  }

  try {
    const parsed = JSON.parse(value)
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
  } catch {
    return false
  }
}

function normalizePluginKind(kind?: string): DataSourceKind {
  return pluginKindMap[kind ?? ''] ?? 'CRM'
}

function connectorMatches(plugin: ConnectorPluginDefinition, connectorType: string) {
  return plugin.connectorType === connectorType || plugin.aliases.includes(connectorType)
}

function defaultEventValues(kind: DataSourceKind) {
  switch (kind) {
    case 'CRM':
      return {
        eventSourceSystem: 'customer_contact_signals',
        eventType: 'source.crm.contact_updated',
        eventPayloadJson: prettyJson({
          preferred_channel: 'email',
          stakeholder_seniority: 'executive',
          decision_maker_likelihood: 0.86,
          source: 'connector-lab',
        }),
      }
    case 'EVENT_STREAM':
      return {
        eventSourceSystem: 'customer_email_signals',
        eventType: 'source.email.engagement.updated',
        eventPayloadJson: prettyJson({
          engagement_channel_signal: 'reply',
          email_reply_count_30d: 3,
          source: 'connector-lab',
        }),
      }
    case 'PRODUCT_USAGE':
    case 'SQL_METRIC':
      return {
        eventSourceSystem: 'customer_context_rollups',
        eventType: 'source.product_usage.rollup_ready',
        eventPayloadJson: prettyJson({
          active_days_30: 26,
          pricing_page_visits_30: 4,
          automation_runs_30: 18,
          source: 'connector-lab',
        }),
      }
  }
}

function demoConfiguration(plugin: ConnectorPluginDefinition) {
  const sample = safeJsonParse<Record<string, unknown>>(plugin.sampleConfigurationJson, {})
  if (plugin.connectorType === 'restApi') {
    return {
      baseUrl: 'https://local-preview.kyntic.example',
      method: 'GET',
      observedAtPath: 'meta.observedAtUtc',
      staticResponses: [
        {
          externalUserId: '123',
          observedAtUtc: '2026-05-11T10:45:00Z',
          payload: {
            crm: {
              preferredChannel: 'email',
              lifecycleStage: 'customer',
              opportunityStage: 'proposal',
            },
            meta: {
              observedAtUtc: '2026-05-11T10:45:00Z',
            },
          },
        },
      ],
    }
  }

  return sample
}

function toFormValues(dataSource?: DataSource, plugin?: ConnectorPluginDefinition): DataSourceFormValues {
  const config = safeJsonParse<Record<string, unknown>>(dataSource?.connectionConfigJson ?? '{}', {})
  const connectorType = String(config.connectorType ?? plugin?.connectorType ?? 'mockCrm')
  const kind = dataSource?.kind ?? normalizePluginKind(plugin?.supportedDataSourceKinds[0])
  const eventDefaults = defaultEventValues(kind)
  const configuration = dataSource
    ? config
    : plugin
      ? demoConfiguration(plugin)
      : {
          scenario: 'safe-local-demo',
          records: [
            {
              externalUserId: '123',
              observedAtUtc: '2026-05-11T10:45:00Z',
              payload: { crm: { preferredChannel: 'email' } },
            },
          ],
        }

  return {
    id: dataSource?.id ?? null,
    name: dataSource?.name ?? (plugin ? `${plugin.displayName} demo source` : 'Mock CRM demo source'),
    description: dataSource?.description ?? plugin?.description ?? 'Safe local demo source for customer context testing.',
    kind,
    connectorType,
    configurationJson: prettyJson(configuration),
    credentialsJson: '{}',
    healthExternalUserId: '123',
    eventSourceSystem: eventDefaults.eventSourceSystem,
    eventType: eventDefaults.eventType,
    eventExternalUserId: '123',
    eventExternalAccountId: 'acct-larkspur-logistics',
    eventPayloadJson: eventDefaults.eventPayloadJson,
  }
}

function statusTone(status?: string): 'success' | 'warning' {
  return status?.toLowerCase() === 'active' ? 'success' : 'warning'
}

export function DataSourcesPage() {
  const { session } = useAuthSession()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [initialConnectorApplied, setInitialConnectorApplied] = useState(false)
  const tenantSlug = session?.tenantSlug ?? 'demo'

  const dataSourcesQuery = useQuery({
    queryKey: ['dataSources', tenantSlug],
    queryFn: () => api.getDataSources(tenantSlug),
    enabled: Boolean(session),
  })
  const connectorPluginsQuery = useQuery({
    queryKey: ['connectorPlugins'],
    queryFn: () => api.getConnectorPlugins(),
    enabled: Boolean(session),
  })

  const form = useForm<DataSourceFormValues>({
    resolver: zodResolver(connectorSchema),
    defaultValues: toFormValues(),
  })
  const watchedValues = useWatch({ control: form.control })
  const connectorType = watchedValues.connectorType ?? 'mockCrm'
  const selectedPlugin = useMemo(
    () => connectorPluginsQuery.data?.find((plugin) => connectorMatches(plugin, connectorType)),
    [connectorPluginsQuery.data, connectorType],
  )
  const compiledConfig = safeJsonParse<Record<string, unknown>>(watchedValues.configurationJson ?? '{}', {})

  const applyPlugin = useCallback((plugin: ConnectorPluginDefinition) => {
    setSelectedId(null)
    form.reset(toFormValues(undefined, plugin))
  }, [form])

  useEffect(() => {
    if (initialConnectorApplied || !connectorPluginsQuery.data?.length) {
      return
    }

    const requestedConnectorType = new URLSearchParams(window.location.search).get('connectorType')
    const requestedPlugin = connectorPluginsQuery.data.find((plugin) =>
      requestedConnectorType ? connectorMatches(plugin, requestedConnectorType) : plugin.connectorType === 'mockCrm',
    ) ?? connectorPluginsQuery.data[0]
    applyPlugin(requestedPlugin)
    setInitialConnectorApplied(true)
  }, [applyPlugin, connectorPluginsQuery.data, initialConnectorApplied])

  useEffect(() => {
    const selected = dataSourcesQuery.data?.find((item) => item.id === selectedId)
    if (selected) {
      const matchingPlugin = connectorPluginsQuery.data?.find((plugin) =>
        connectorMatches(
          plugin,
          String(safeJsonParse<Record<string, unknown>>(selected.connectionConfigJson, {}).connectorType ?? ''),
        ),
      )
      form.reset(toFormValues(selected, matchingPlugin))
    }
  }, [connectorPluginsQuery.data, dataSourcesQuery.data, form, selectedId])

  const validateMutation = useMutation({
    mutationFn: async () => {
      const values = form.getValues()
      return api.validateConnectorConfiguration({
        connectorType: values.connectorType,
        kind: values.kind,
        configurationJson: values.configurationJson,
        credentialsJson: values.credentialsJson,
      })
    },
  })

  const registerMutation = useMutation({
    mutationFn: async () => {
      const values = form.getValues()
      return api.registerConnector({
        id: values.id ?? null,
        tenantSlug,
        name: values.name,
        description: values.description,
        kind: values.kind,
        connectorType: values.connectorType,
        configurationJson: values.configurationJson,
        credentialsJson: values.credentialsJson,
      })
    },
    onSuccess: async (result) => {
      setSelectedId(result.dataSourceId)
      form.setValue('id', result.dataSourceId)
      await queryClient.invalidateQueries({ queryKey: ['dataSources', tenantSlug] })
    },
  })

  const healthMutation = useMutation({
    mutationFn: async () => {
      const values = form.getValues()
      const dataSourceId = values.id ?? selectedId
      if (!dataSourceId) {
        throw new Error('Register or select a connector before running health.')
      }

      return api.checkConnectorHealth({
        tenantSlug,
        dataSourceId,
        externalUserId: values.healthExternalUserId || '123',
        mode: 'preview',
      })
    },
  })

  const eventMutation = useMutation({
    mutationFn: async () => {
      const values = form.getValues()
      return api.ingestSourceSystemEvent({
        tenantSlug,
        eventId: `connector-lab-${Date.now()}`,
        sourceSystem: values.eventSourceSystem,
        eventType: values.eventType,
        payloadJson: values.eventPayloadJson,
        externalUserId: values.eventExternalUserId || '123',
        externalAccountId: values.eventExternalAccountId || null,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['sourceSystemEvents', tenantSlug] })
    },
  })

  if (!session) {
    return null
  }

  const plugins = connectorPluginsQuery.data ?? []
  const dataSources = dataSourcesQuery.data ?? []

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Connector lab"
        title="Register sources, validate standard connectors, and add a live source event."
        description="This Docker demo now exposes the real connector path: choose an executable plugin, inspect the sample configuration, register it as a tenant data source, run health, and send a provider-neutral event into the customer data plane."
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={form.handleSubmit(async () => {
                await validateMutation.mutateAsync()
              })}
            >
              <ClipboardCheck className="size-4" />
              Validate
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(async () => {
                await registerMutation.mutateAsync()
              })}
            >
              <PlugZap className="size-4" />
              Register connector
            </Button>
          </>
        }
      />

      <Panel
        eyebrow="Standard connectors"
        title="Executable plugins in this Docker build"
        action={<Badge tone="success">{plugins.length} plugins</Badge>}
      >
        {connectorPluginsQuery.isError ? (
          <p className="text-sm font-semibold text-rosewood-700">{connectorPluginsQuery.error.message}</p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {plugins.map((plugin) => {
            const active = connectorMatches(plugin, connectorType)
            return (
              <button
                key={plugin.connectorType}
                type="button"
                className={`rounded-[24px] border px-4 py-4 text-left transition ${
                  active
                    ? 'border-copper-400 bg-copper-500/10'
                    : 'border-ink-900/8 bg-ivory-25 hover:border-copper-300'
                }`}
                onClick={() => applyPlugin(plugin)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-950">{plugin.displayName}</p>
                    <p className="mt-1 text-sm leading-6 text-ink-600">{plugin.description}</p>
                  </div>
                  {active ? <CheckCircle2 className="mt-1 size-5 shrink-0 text-sage-700" /> : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone="success">Executable</Badge>
                  {plugin.supportedDataSourceKinds.map((kind) => (
                    <Badge key={kind} tone="neutral">
                      {dataSourceKindLabels[normalizePluginKind(kind)]}
                    </Badge>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <Panel eyebrow="Connected systems" title="Tenant data sources">
          <div className="grid gap-3">
            {dataSources.map((dataSource) => (
              <button
                key={dataSource.id}
                type="button"
                className="rounded-[24px] border border-ink-900/8 bg-ivory-25 px-4 py-4 text-left transition hover:border-copper-300"
                onClick={() => setSelectedId(dataSource.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-950">{dataSource.name}</p>
                    <p className="mt-1 text-sm leading-6 text-ink-600">{dataSource.description}</p>
                  </div>
                  <Badge tone={statusTone(dataSource.status)}>{dataSource.kind}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                  <Database className="size-3.5" />
                  <span>Last sync {formatDateTime(dataSource.lastSuccessfulSyncAtUtc)}</span>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Connection profile"
          title="Validate and register a connector"
          action={
            selectedPlugin ? (
              <Badge tone="accent">{selectedPlugin.connectorType}</Badge>
            ) : (
              <Badge tone="neutral">Custom connector</Badge>
            )
          }
        >
          <form className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Display name" error={form.formState.errors.name?.message}>
                <Input {...form.register('name')} />
              </Field>
              <Field label="Data source kind" error={form.formState.errors.kind?.message}>
                <Select {...form.register('kind')}>
                  {dataSourceKindOptions.map((kind) => (
                    <option key={kind} value={kind}>
                      {dataSourceKindLabels[kind]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Description" error={form.formState.errors.description?.message}>
              <Textarea {...form.register('description')} className="min-h-[96px]" />
            </Field>

            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Connector type" error={form.formState.errors.connectorType?.message} className="md:col-span-2">
                <Select
                  value={watchedValues.connectorType ?? ''}
                  onChange={(event) => {
                    const plugin = plugins.find((item) => connectorMatches(item, event.target.value))
                    if (plugin) {
                      applyPlugin(plugin)
                    } else {
                      form.setValue('connectorType', event.target.value)
                    }
                  }}
                >
                  {plugins.map((plugin) => (
                    <option key={plugin.connectorType} value={plugin.connectorType}>
                      {plugin.displayName} ({plugin.connectorType})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Health subject" hint="demo user">
                <Input {...form.register('healthExternalUserId')} placeholder="123" />
              </Field>
            </div>

            <div className="grid gap-5 2xl:grid-cols-2">
              <Field label="Configuration JSON" error={form.formState.errors.configurationJson?.message}>
                <Textarea {...form.register('configurationJson')} className="min-h-[260px] font-mono text-xs leading-6" />
              </Field>
              <Field label="Credentials JSON" hint="blank or object" error={form.formState.errors.credentialsJson?.message}>
                <Textarea {...form.register('credentialsJson')} className="min-h-[260px] font-mono text-xs leading-6" />
              </Field>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={form.handleSubmit(async () => {
                  await validateMutation.mutateAsync()
                })}
                disabled={validateMutation.isPending}
              >
                <ClipboardCheck className="size-4" />
                {validateMutation.isPending ? 'Validating...' : 'Validate configuration'}
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(async () => {
                  await registerMutation.mutateAsync()
                })}
                disabled={registerMutation.isPending}
              >
                <ShieldCheck className="size-4" />
                {registerMutation.isPending ? 'Registering...' : 'Register or update'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => healthMutation.mutate()}
                disabled={healthMutation.isPending || !(form.getValues().id ?? selectedId)}
              >
                <RefreshCcw className="size-4" />
                {healthMutation.isPending ? 'Checking...' : 'Run health'}
              </Button>
            </div>
          </form>

          <div className="mt-6 grid gap-4 2xl:grid-cols-2">
            <JsonViewer value={compiledConfig} title="Connection config preview" height="h-72" />
            <div className="grid gap-3">
              {validateMutation.data ? (
                <div className="rounded-[24px] border border-ink-900/8 bg-ivory-25 p-4">
                  <p className="font-semibold text-ink-950">
                    Validation {validateMutation.data.isValid ? 'passed' : 'needs changes'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone={validateMutation.data.isValid ? 'success' : 'danger'}>
                      {validateMutation.data.isValid ? 'Valid' : 'Invalid'}
                    </Badge>
                    <Badge tone="neutral">{validateMutation.data.connectorType}</Badge>
                  </div>
                  {validateMutation.data.errors.length ? (
                    <ul className="mt-3 grid gap-2 text-sm text-rosewood-700">
                      {validateMutation.data.errors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
              {registerMutation.data ? (
                <div className="rounded-[24px] border border-sage-700/16 bg-sage-50/70 p-4">
                  <p className="font-semibold text-ink-950">Registered {registerMutation.data.name}</p>
                  <p className="mt-2 break-all text-sm text-ink-700">{registerMutation.data.dataSourceId}</p>
                  <Badge tone="success" className="mt-3">{registerMutation.data.status}</Badge>
                </div>
              ) : null}
              {healthMutation.data ? (
                <div className="rounded-[24px] border border-ink-900/8 bg-ivory-25 p-4">
                  <p className="font-semibold text-ink-950">Health {healthMutation.data.status}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge tone={healthMutation.data.isHealthy ? 'success' : 'warning'}>
                      {healthMutation.data.isHealthy ? 'Healthy' : 'Check details'}
                    </Badge>
                    <Badge tone="neutral">{healthMutation.data.connectorType}</Badge>
                  </div>
                  <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink-700">
                    {healthMutation.data.messages.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {validateMutation.isError ? <p className="text-sm font-semibold text-rosewood-700">{validateMutation.error.message}</p> : null}
              {registerMutation.isError ? <p className="text-sm font-semibold text-rosewood-700">{registerMutation.error.message}</p> : null}
              {healthMutation.isError ? <p className="text-sm font-semibold text-rosewood-700">{healthMutation.error.message}</p> : null}
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        eyebrow="Add a data item"
        title="Send a provider-neutral source event into the demo data plane"
        action={<Badge tone="accent">Stored as user signal</Badge>}
      >
        <form className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
            <Field label="Source system" error={form.formState.errors.eventSourceSystem?.message}>
              <Input {...form.register('eventSourceSystem')} />
            </Field>
            <Field label="Event type" error={form.formState.errors.eventType?.message}>
              <Input {...form.register('eventType')} />
            </Field>
            <Field label="External user">
              <Input {...form.register('eventExternalUserId')} placeholder="123" />
            </Field>
            <Field label="External account">
              <Input {...form.register('eventExternalAccountId')} placeholder="acct-larkspur-logistics" />
            </Field>
          </div>

          <Field label="Event payload JSON" error={form.formState.errors.eventPayloadJson?.message}>
            <Textarea {...form.register('eventPayloadJson')} className="min-h-[180px] font-mono text-xs leading-6" />
          </Field>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={form.handleSubmit(async () => {
                await eventMutation.mutateAsync()
              })}
              disabled={eventMutation.isPending}
            >
              <RadioTower className="size-4" />
              {eventMutation.isPending ? 'Sending...' : 'Send source event'}
            </Button>
            <Link to="/admin/events">
              <Button type="button" variant="secondary">Open event history</Button>
            </Link>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.location.assign('/customers/123')
              }}
            >
              Open Avery profile
            </Button>
          </div>

          {eventMutation.data ? (
            <div className="rounded-[24px] border border-sage-700/16 bg-sage-50/70 p-4">
              <p className="font-semibold text-ink-950">Event accepted</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="success">{eventMutation.data.status}</Badge>
                <Badge tone="neutral">{eventMutation.data.storedSignalCount} stored signal</Badge>
                <Badge tone="accent">{eventMutation.data.matchedSelectorCount} selector matches</Badge>
                {eventMutation.data.isDuplicate ? <Badge tone="warning">Duplicate</Badge> : null}
              </div>
              <p className="mt-3 break-all text-sm text-ink-700">{eventMutation.data.eventId}</p>
            </div>
          ) : null}
          {eventMutation.isError ? <p className="text-sm font-semibold text-rosewood-700">{eventMutation.error.message}</p> : null}
        </form>
      </Panel>
    </div>
  )
}
