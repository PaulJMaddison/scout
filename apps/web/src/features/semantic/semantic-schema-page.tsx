import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Orbit } from 'lucide-react'
import { queryClient } from '@/app/providers'
import { Badge, Button, Card, Field, Input, PageHeader, Panel, Select, Textarea } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import { prettyJson } from '@/lib/utils'
import type { SemanticAttributeDefinition, SemanticDataType } from '@/lib/types'

const schemaForm = z.object({
  id: z.string().optional().nullable(),
  key: z.string().min(2),
  displayName: z.string().min(3),
  description: z.string().min(12),
  dataType: z.enum(['JSON', 'STRING', 'NUMBER', 'PERCENTAGE', 'ENUM', 'BOOLEAN', 'DATETIME'] satisfies SemanticDataType[]),
  exampleValueJson: z.string().min(1),
  isSystem: z.boolean(),
})

type SemanticFormValues = z.infer<typeof schemaForm>

function toFormValues(attribute?: SemanticAttributeDefinition): SemanticFormValues {
  return {
    id: attribute?.id ?? null,
    key: attribute?.key ?? '',
    displayName: attribute?.displayName ?? '',
    description: attribute?.description ?? '',
    dataType: attribute?.dataType ?? 'STRING',
    exampleValueJson: attribute?.exampleValueJson ?? '"example"',
    isSystem: attribute?.isSystem ?? false,
  }
}

export function SemanticSchemaPage() {
  const { session } = useAuthSession()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const tenantSlug = session?.tenantSlug ?? 'demo'

  const attributesQuery = useQuery({
    queryKey: ['semanticAttributes', tenantSlug],
    queryFn: () => api.getSemanticAttributes(tenantSlug),
    enabled: Boolean(session),
  })
  const selectorsQuery = useQuery({
    queryKey: ['selectors', tenantSlug],
    queryFn: () => api.getSelectors(tenantSlug),
    enabled: Boolean(session),
  })

  const form = useForm<SemanticFormValues>({
    resolver: zodResolver(schemaForm),
    defaultValues: toFormValues(),
  })
  const watchedValues = useWatch({ control: form.control })

  useEffect(() => {
    const selected = attributesQuery.data?.find((item) => item.id === selectedId)
    if (selected) {
      form.reset(toFormValues(selected))
    }
  }, [attributesQuery.data, form, selectedId])

  const usageByAttribute = useMemo(() => {
    const map = new Map<string, number>()
    for (const selector of selectorsQuery.data ?? []) {
      map.set(
        selector.targetAttributeDefinitionId,
        (map.get(selector.targetAttributeDefinitionId) ?? 0) + 1,
      )
    }
    return map
  }, [selectorsQuery.data])

  const saveMutation = useMutation({
    mutationFn: async (values: SemanticFormValues) =>
      api.upsertSemanticAttribute({
        ...values,
        id: values.id ?? null,
        tenantSlug,
      }),
    onSuccess: async (saved) => {
      setSelectedId(saved.id)
      await queryClient.invalidateQueries({ queryKey: ['semanticAttributes', tenantSlug] })
      form.reset(toFormValues(saved))
    },
  })

  if (!session) {
    return null
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Canonical model"
        title="Create the shared business vocabulary that context consumers can trust."
        description="Define the canonical attributes selectors are allowed to populate so every workflow uses the same trusted meaning for customers, risk, intent, and opportunity."
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSelectedId(null)
              form.reset(toFormValues())
            }}
          >
            New attribute
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel eyebrow="Registry" title="Available attributes">
          <div className="grid gap-3">
            {(attributesQuery.data ?? []).map((attribute) => (
              <button
                key={attribute.id}
                type="button"
                onClick={() => setSelectedId(attribute.id)}
                className="rounded-[24px] border border-ink-900/8 bg-ivory-25 px-4 py-4 text-left transition hover:border-sage-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-950">{attribute.displayName}</p>
                    <p className="mt-1 text-sm text-ink-600">{attribute.key}</p>
                  </div>
                  <Badge tone={attribute.isSystem ? 'accent' : 'neutral'}>
                    {attribute.dataType}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink-700">{attribute.description}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-2">
                    <Orbit className="size-3.5" />
                    {usageByAttribute.get(attribute.id) ?? 0} selectors
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="Attribute editor" title="Define the contract">
          <form
            className="grid gap-5"
            onSubmit={form.handleSubmit(async (values) => {
              await saveMutation.mutateAsync(values)
            })}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Attribute key" error={form.formState.errors.key?.message}>
                <Input {...form.register('key')} placeholder="conversionProbability" />
              </Field>
              <Field label="Display name" error={form.formState.errors.displayName?.message}>
                <Input {...form.register('displayName')} />
              </Field>
            </div>

            <Field label="Description" error={form.formState.errors.description?.message}>
              <Textarea {...form.register('description')} className="min-h-[110px]" />
            </Field>

            <div className="grid gap-5 md:grid-cols-[1fr_1fr_auto]">
              <Field label="Data type" error={form.formState.errors.dataType?.message}>
                <Select {...form.register('dataType')}>
                  <option value="STRING">String</option>
                  <option value="NUMBER">Number</option>
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="ENUM">Enum</option>
                  <option value="BOOLEAN">Boolean</option>
                  <option value="DATETIME">Datetime</option>
                  <option value="JSON">JSON</option>
                </Select>
              </Field>
              <Field label="Example value JSON" error={form.formState.errors.exampleValueJson?.message}>
                <Input {...form.register('exampleValueJson')} />
              </Field>
              <label className="mt-9 inline-flex items-center gap-3 rounded-2xl border border-ink-900/8 bg-ivory-25 px-4 py-3 text-sm font-medium text-ink-800">
                <input type="checkbox" {...form.register('isSystem')} className="size-4 accent-[#af5c2b]" />
                System attribute
              </label>
            </div>

            <div className="flex gap-3">
              <Button type="submit">Save attribute</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSelectedId(null)
                  form.reset(toFormValues())
                }}
              >
                Reset
              </Button>
            </div>
          </form>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card className="bg-ivory-25">
              <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Registry hint</p>
              <h3 className="mt-3 font-display text-2xl text-ink-950">Name for downstream readers</h3>
              <p className="mt-3 text-sm leading-7 text-ink-700">
                Prefer business-language keys and descriptions so prompt builders, analysts, and sales teams can reason about the attribute without reading source SQL.
              </p>
            </Card>
            <Panel eyebrow="JSON preview" title="Example payload">
              <pre className="overflow-auto rounded-[24px] bg-ink-950 p-4 text-xs leading-6 text-ivory-100">
                <code>
                  {prettyJson({
                    key: watchedValues.key,
                    dataType: watchedValues.dataType,
                    example: watchedValues.exampleValueJson,
                    isSystem: watchedValues.isSystem,
                  })}
                </code>
              </pre>
            </Panel>
          </div>
        </Panel>
      </div>
    </div>
  )
}
