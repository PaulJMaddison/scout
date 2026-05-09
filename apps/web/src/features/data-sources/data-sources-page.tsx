import { useEffect, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Database } from 'lucide-react'
import { JsonViewer } from '@/components/data-display/json-viewer'
import { Badge, Button, Field, Input, PageHeader, Panel, Select, Textarea } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import { queryClient } from '@/app/providers'
import { formatDateTime, prettyJson, safeJsonParse } from '@/lib/utils'
import type { DataSource, DataSourceKind } from '@/lib/types'

const connectorSchema = z.object({
  id: z.string().optional().nullable(),
  name: z.string().min(3),
  description: z.string().min(10),
  kind: z.enum(['CRM', 'SQL_METRIC', 'PRODUCT_USAGE', 'EVENT_STREAM', 'API_PAYLOAD', 'MOCK'] satisfies DataSourceKind[]),
  connectorType: z.string().min(1),
  provider: z.string().min(1),
  mode: z.string().min(1),
  tableName: z.string().optional(),
  columns: z.string().optional(),
  payloadJson: z.string().optional(),
})

type DataSourceFormValues = z.infer<typeof connectorSchema>

function toFormValues(dataSource?: DataSource): DataSourceFormValues {
  const config = safeJsonParse<Record<string, unknown>>(dataSource?.connectionConfigJson ?? '{}', {})
  return {
    id: dataSource?.id ?? null,
    name: dataSource?.name ?? '',
    description: dataSource?.description ?? '',
    kind: dataSource?.kind ?? 'CRM',
    connectorType: String(config.connectorType ?? 'mockSignal'),
    provider: String(config.provider ?? 'hubspot'),
    mode: String(config.mode ?? 'demo'),
    tableName: String(config.tableName ?? ''),
    columns: Array.isArray(config.columns) ? config.columns.join(', ') : '',
    payloadJson: config.payload ? prettyJson(config.payload) : '',
  }
}

export function DataSourcesPage() {
  const { session } = useAuthSession()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const tenantSlug = session?.tenantSlug ?? 'demo'

  const dataSourcesQuery = useQuery({
    queryKey: ['dataSources', tenantSlug],
    queryFn: () => api.getDataSources(tenantSlug),
    enabled: Boolean(session),
  })

  const form = useForm<DataSourceFormValues>({
    resolver: zodResolver(connectorSchema),
    defaultValues: toFormValues(),
  })
  const watchedValues = useWatch({ control: form.control })

  useEffect(() => {
    const selected = dataSourcesQuery.data?.find((item) => item.id === selectedId)
    if (selected) {
      form.reset(toFormValues(selected))
    }
  }, [dataSourcesQuery.data, form, selectedId])

  const compiledConfig = {
    connectorType: watchedValues.connectorType,
    provider: watchedValues.provider,
    mode: watchedValues.mode,
    ...(watchedValues.tableName?.trim() ? { tableName: watchedValues.tableName.trim() } : {}),
    ...(watchedValues.columns?.trim()
      ? {
          columns: watchedValues.columns
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        }
      : {}),
    ...(watchedValues.payloadJson?.trim()
      ? { payload: safeJsonParse(watchedValues.payloadJson, {}) }
      : {}),
  }

  const saveMutation = useMutation({
    mutationFn: async (values: DataSourceFormValues) =>
      api.upsertDataSource({
        id: values.id ?? null,
        tenantSlug,
        name: values.name,
        description: values.description,
        kind: values.kind,
        connectionConfigJson: prettyJson(compiledConfig),
      }),
    onSuccess: async (saved) => {
      setSelectedId(saved.id)
      await queryClient.invalidateQueries({ queryKey: ['dataSources', tenantSlug] })
      form.reset(toFormValues(saved))
    },
  })

  if (!session) {
    return null
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Connector estate"
        title="Data source management"
        description="Configure the systems feeding selectors, preview connector payload shape, and keep raw inputs legible before they enter the semantic layer."
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSelectedId(null)
              form.reset(toFormValues())
            }}
          >
            New source
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel eyebrow="Connected systems" title="Current sources">
          <div className="grid gap-3">
            {(dataSourcesQuery.data ?? []).map((dataSource) => (
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
                  <Badge tone={dataSource.status === 'ACTIVE' ? 'success' : 'warning'}>
                    {dataSource.kind}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-ink-500">
                  <Database className="size-3.5" />
                  Last sync {formatDateTime(dataSource.lastSuccessfulSyncAtUtc)}
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Source editor"
          title="Connection profile"
          action={
            saveMutation.isPending ? (
              <Badge tone="warning">Saving…</Badge>
            ) : (
              <Badge tone="neutral">{selectedId ? 'Editing existing source' : 'Creating new source'}</Badge>
            )
          }
        >
          <form
            className="grid gap-5"
            onSubmit={form.handleSubmit(async (values) => {
              await saveMutation.mutateAsync(values)
            })}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Display name" error={form.formState.errors.name?.message}>
                <Input {...form.register('name')} />
              </Field>
              <Field label="Data source kind" error={form.formState.errors.kind?.message}>
                <Select {...form.register('kind')}>
                  <option value="CRM">CRM</option>
                  <option value="SQL_METRIC">SQL metric</option>
                  <option value="PRODUCT_USAGE">Product usage</option>
                  <option value="EVENT_STREAM">Event stream</option>
                  <option value="API_PAYLOAD">API payload</option>
                  <option value="MOCK">Mock</option>
                </Select>
              </Field>
            </div>

            <Field label="Description" error={form.formState.errors.description?.message}>
              <Textarea {...form.register('description')} className="min-h-[110px]" />
            </Field>

            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Connector type" error={form.formState.errors.connectorType?.message}>
                <Select {...form.register('connectorType')}>
                  <option value="mockSignal">mockSignal</option>
                  <option value="mockPayload">mockPayload</option>
                  <option value="apiPayload">apiPayload</option>
                  <option value="sqlTable">sqlTable</option>
                </Select>
              </Field>
              <Field label="Provider" error={form.formState.errors.provider?.message}>
                <Input {...form.register('provider')} />
              </Field>
              <Field label="Mode" error={form.formState.errors.mode?.message}>
                <Input {...form.register('mode')} />
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Table name">
                <Input {...form.register('tableName')} placeholder="customer_metrics" />
              </Field>
              <Field label="Columns">
                <Input {...form.register('columns')} placeholder="preferred_channel, nps, support_tickets_30" />
              </Field>
            </div>

            <Field label="Mock/API payload JSON">
              <Textarea {...form.register('payloadJson')} className="min-h-[140px]" />
            </Field>

            <div className="flex flex-wrap gap-3">
              <Button type="submit">Save data source</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  form.reset(toFormValues())
                  setSelectedId(null)
                }}
              >
                Reset form
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <JsonViewer value={compiledConfig} title="Connection config preview" height="h-72" />
          </div>
        </Panel>
      </div>
    </div>
  )
}
