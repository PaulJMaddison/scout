import { startTransition, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { FlaskConical, Play, RefreshCcw, Save, Send, Wand2 } from 'lucide-react'
import { queryClient } from '@/app/providers'
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
import { formatConfidence } from '@/lib/utils'
import {
  buildSelectorInput,
  createEmptySelectorForm,
  inflateSelectorForm,
  selectorFormSchema,
  selectorMappingOptions,
  type SelectorBuilderFormValues,
} from '@/features/selectors/selector-builder-helpers'

function ruleTone(mappingKind: SelectorBuilderFormValues['mappingKind']) {
  switch (mappingKind) {
    case 'DIRECT_FIELD_MAPPING':
      return 'accent' as const
    case 'WEIGHTED_SCORING':
      return 'success' as const
    case 'THRESHOLD_CLASSIFICATION':
      return 'warning' as const
    case 'STRING_TO_ENUM_MAPPING':
      return 'neutral' as const
    case 'FORMULA_METRIC':
      return 'accent' as const
  }
}

export function SelectorBuilderPage() {
  const { session } = useAuthSession()
  const [selectorSearch, setSelectorSearch] = useState('')
  const tenantSlug = session?.tenantSlug ?? 'demo'
  const actorEmail = session?.email ?? 'demo-admin@contextlayer.local'

  const usersQuery = useQuery({
    queryKey: ['userProfiles', tenantSlug],
    queryFn: () => api.getUserProfiles(tenantSlug),
    enabled: Boolean(session),
  })
  const dataSourcesQuery = useQuery({
    queryKey: ['dataSources', tenantSlug],
    queryFn: () => api.getDataSources(tenantSlug),
    enabled: Boolean(session),
  })
  const semanticAttributesQuery = useQuery({
    queryKey: ['semanticAttributes', tenantSlug],
    queryFn: () => api.getSemanticAttributes(tenantSlug),
    enabled: Boolean(session),
  })
  const selectorsQuery = useQuery({
    queryKey: ['selectors', tenantSlug],
    queryFn: () => api.getSelectors(tenantSlug),
    enabled: Boolean(session),
  })

  const initialUser = usersQuery.data?.[0]?.externalUserId ?? '123'
  const initialDataSourceId = dataSourcesQuery.data?.[0]?.id
  const initialAttributeId =
    semanticAttributesQuery.data?.find((attribute) => attribute.key === 'preferredChannel')?.id
    ?? semanticAttributesQuery.data?.[0]?.id

  const form = useForm<SelectorBuilderFormValues>({
    resolver: zodResolver(selectorFormSchema),
    defaultValues: createEmptySelectorForm(initialUser, initialDataSourceId, initialAttributeId),
  })

  useEffect(() => {
    const current = form.getValues()
    if (!current.previewExternalUserId && usersQuery.data?.[0]?.externalUserId) {
      form.setValue('previewExternalUserId', usersQuery.data[0].externalUserId)
    }
    if (!current.dataSourceId && dataSourcesQuery.data?.[0]?.id) {
      form.setValue('dataSourceId', dataSourcesQuery.data[0].id)
    }
    if (!current.targetAttributeDefinitionId && semanticAttributesQuery.data?.[0]?.id) {
      form.setValue('targetAttributeDefinitionId', semanticAttributesQuery.data[0].id)
    }
  }, [dataSourcesQuery.data, form, semanticAttributesQuery.data, usersQuery.data])

  const requiredPathsArray = useFieldArray({ control: form.control, name: 'requiredPaths' })
  const transformsArray = useFieldArray({ control: form.control, name: 'transforms' })
  const stringMappingsArray = useFieldArray({ control: form.control, name: 'stringEnumMappings' })
  const thresholdsArray = useFieldArray({ control: form.control, name: 'thresholdRules' })
  const weightedComponentsArray = useFieldArray({ control: form.control, name: 'weightedComponents' })
  const formulaVariablesArray = useFieldArray({ control: form.control, name: 'formulaVariables' })

  const values = useWatch({ control: form.control }) as SelectorBuilderFormValues
  const previewExternalUserId = values.previewExternalUserId || initialUser
  const weightedComponentModes = values.weightedComponents.map((component) => component.mode)
  const formulaVariableModes = values.formulaVariables.map((item) => item.mode)
  const compiledInput = useMemo(
    () => buildSelectorInput(values, tenantSlug),
    [tenantSlug, values],
  )

  const previewMutation = useMutation({
    mutationFn: () =>
      api.previewSelector({
        tenantSlug,
        externalUserId: previewExternalUserId,
        draftSelector: compiledInput,
      }),
  })
  const validateMutation = useMutation({
    mutationFn: () =>
      api.validateSelector({
        tenantSlug,
        externalUserId: previewExternalUserId,
        draftSelector: compiledInput,
      }),
  })
  const saveMutation = useMutation({
    mutationFn: () => api.upsertSelector(compiledInput),
    onSuccess: async (selector) => {
      await queryClient.invalidateQueries({ queryKey: ['selectors', tenantSlug] })
      startTransition(() => {
        form.reset(inflateSelectorForm(selector, previewExternalUserId))
      })
    },
  })
  const publishMutation = useMutation({
    mutationFn: async () => {
      const saved = await api.upsertSelector(compiledInput)
      return api.publishSelector({
        tenantSlug,
        selectorDefinitionId: saved.id,
      })
    },
    onSuccess: async (selector) => {
      await queryClient.invalidateQueries({ queryKey: ['selectors', tenantSlug] })
      startTransition(() => {
        form.reset(inflateSelectorForm(selector, previewExternalUserId))
      })
    },
  })
  const recomputeMutation = useMutation({
    mutationFn: () =>
      api.queueContextRecompute({
        tenantSlug,
        externalUserId: previewExternalUserId,
        triggeredBy: actorEmail,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['selectorExecutions', tenantSlug, previewExternalUserId],
      })
    },
  })
  const scheduledMutation = useMutation({
    mutationFn: () => api.runScheduledRecompute({ tenantSlug }),
  })

  const filteredSelectors = useMemo(() => {
    const term = selectorSearch.trim().toLowerCase()
    return (selectorsQuery.data ?? []).filter((selector) =>
      [selector.name, selector.description, selector.targetAttributeDefinition?.displayName]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [selectorSearch, selectorsQuery.data])

  if (!session) {
    return null
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Semantic mapping studio"
        title="Selector builder"
        description="Define the mapping logic that turns raw operational fields into business-aware context facts. Preview the output, validate shape, and publish with explainability intact."
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={form.handleSubmit(async () => {
                await validateMutation.mutateAsync()
              })}
            >
              <FlaskConical className="mr-2 size-4" />
              Dry-run validate
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={form.handleSubmit(async () => {
                await previewMutation.mutateAsync()
              })}
            >
              <Play className="mr-2 size-4" />
              Preview output
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={form.handleSubmit(async () => {
                await saveMutation.mutateAsync()
              })}
            >
              <Save className="mr-2 size-4" />
              Save draft
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(async () => {
                await publishMutation.mutateAsync()
              })}
            >
              <Send className="mr-2 size-4" />
              Publish selector
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)_360px] 2xl:grid-cols-[320px_minmax(0,1fr)_420px]">
        <Panel
          eyebrow="Selector catalog"
          title="Existing selectors"
          action={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                startTransition(() => {
                  form.reset(
                    createEmptySelectorForm(
                      previewExternalUserId,
                      initialDataSourceId,
                      initialAttributeId,
                    ),
                  )
                })
              }}
            >
              New
            </Button>
          }
        >
          <div className="grid gap-4">
            <Input
              value={selectorSearch}
              onChange={(event) => setSelectorSearch(event.target.value)}
              placeholder="Search selectors"
            />
            <Field label="Preview user">
              <Select {...form.register('previewExternalUserId')}>
                {(usersQuery.data ?? []).map((user) => (
                  <option key={user.id} value={user.externalUserId}>
                    {user.fullName} · {user.companyName}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-3">
              {filteredSelectors.map((selector) => (
                <button
                  key={selector.id}
                  type="button"
                  onClick={() =>
                    startTransition(() => {
                      form.reset(inflateSelectorForm(selector, previewExternalUserId))
                    })
                  }
                  className="rounded-[24px] border border-ink-900/8 bg-ivory-25 px-4 py-4 text-left transition hover:border-copper-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-950">{selector.name}</p>
                      <p className="mt-1 text-sm text-ink-600">
                        {selector.targetAttributeDefinition?.displayName}
                      </p>
                    </div>
                    <Badge tone={selector.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                      {selector.status}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-ink-700">{selector.description}</p>
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          eyebrow="Rule authoring"
          title={values.name || 'New selector'}
          action={<Badge tone={ruleTone(values.mappingKind)}>{values.mappingKind}</Badge>}
        >
          <form className="grid gap-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Selector name" error={form.formState.errors.name?.message}>
                <Input {...form.register('name')} />
              </Field>
              <Field label="Target semantic attribute" error={form.formState.errors.targetAttributeDefinitionId?.message}>
                <Select {...form.register('targetAttributeDefinitionId')}>
                  {(semanticAttributesQuery.data ?? []).map((attribute) => (
                    <option key={attribute.id} value={attribute.id}>
                      {attribute.displayName}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Description" error={form.formState.errors.description?.message}>
              <Textarea {...form.register('description')} className="min-h-[110px]" />
            </Field>

            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Data source" error={form.formState.errors.dataSourceId?.message}>
                <Select {...form.register('dataSourceId')}>
                  {(dataSourcesQuery.data ?? []).map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Confidence" error={form.formState.errors.defaultConfidence?.message}>
                <Input type="number" step="0.01" min="0" max="1" {...form.register('defaultConfidence', { valueAsNumber: true })} />
              </Field>
              <Field label="Priority" error={form.formState.errors.priority?.message}>
                <Input type="number" min="0" max="100" {...form.register('priority', { valueAsNumber: true })} />
              </Field>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Freshness window (minutes)" error={form.formState.errors.freshnessWindowMinutes?.message}>
                <Input type="number" min="5" {...form.register('freshnessWindowMinutes', { valueAsNumber: true })} />
              </Field>
              <Field label="Schedule interval (minutes)">
                <Input
                  type="number"
                  min="5"
                  {...form.register('scheduleIntervalMinutes', {
                    setValueAs: (value) => (value === '' ? null : Number(value)),
                  })}
                />
              </Field>
            </div>

            <div className="grid gap-3">
              <p className="text-sm font-semibold text-ink-900">Rule type</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {selectorMappingOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => form.setValue('mappingKind', option.value, { shouldDirty: true })}
                    className={`rounded-[24px] border px-4 py-4 text-left transition ${
                      values.mappingKind === option.value
                        ? 'border-copper-400 bg-copper-500/10'
                        : 'border-ink-900/8 bg-ivory-25 hover:border-copper-300'
                    }`}
                  >
                    <p className="font-semibold text-ink-950">{option.label}</p>
                    <p className="mt-2 text-sm leading-6 text-ink-700">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <Divider />

            <Field label="Explanation template" error={form.formState.errors.explanationTemplate?.message} hint="Use tokens like {{sourceValue}}, {{weightedScore}}, or custom flattened source fields.">
              <Textarea {...form.register('explanationTemplate')} className="min-h-[90px]" />
            </Field>

            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">Required source paths</p>
                <Button type="button" size="sm" variant="secondary" onClick={() => requiredPathsArray.append({ value: '' })}>
                  Add path
                </Button>
              </div>
              {requiredPathsArray.fields.map((field, index) => (
                <div key={field.id} className="flex gap-3">
                  <Input {...form.register(`requiredPaths.${index}.value`)} />
                  <Button type="button" variant="ghost" onClick={() => requiredPathsArray.remove(index)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-900">Transforms</p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => transformsArray.append({ path: '', type: 'lower' })}
                >
                  Add transform
                </Button>
              </div>
              {transformsArray.fields.map((field, index) => (
                <div key={field.id} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                  <Input {...form.register(`transforms.${index}.path`)} placeholder="crm.preferredChannel" />
                  <Select {...form.register(`transforms.${index}.type`)}>
                    <option value="lower">lower</option>
                    <option value="upper">upper</option>
                    <option value="trim">trim</option>
                    <option value="number">number</option>
                    <option value="string">string</option>
                  </Select>
                  <Button type="button" variant="ghost" onClick={() => transformsArray.remove(index)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            {values.mappingKind === 'DIRECT_FIELD_MAPPING' ? (
              <Field label="Source path" error={form.formState.errors.directValuePath?.message}>
                <Input {...form.register('directValuePath')} placeholder="crm.preferredChannel" />
              </Field>
            ) : null}

            {values.mappingKind === 'STRING_TO_ENUM_MAPPING' ? (
              <div className="grid gap-4">
                <Field label="Source path" error={form.formState.errors.stringEnumValuePath?.message}>
                  <Input {...form.register('stringEnumValuePath')} placeholder="crm.planInterest" />
                </Field>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-900">Enum mappings</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => stringMappingsArray.append({ sourceValue: '', targetValue: '' })}
                  >
                    Add mapping
                  </Button>
                </div>
                {stringMappingsArray.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <Input {...form.register(`stringEnumMappings.${index}.sourceValue`)} placeholder="enterprise_contacted" />
                    <Input {...form.register(`stringEnumMappings.${index}.targetValue`)} placeholder="enterprise" />
                    <Button type="button" variant="ghost" onClick={() => stringMappingsArray.remove(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}

            {values.mappingKind === 'THRESHOLD_CLASSIFICATION' ? (
              <div className="grid gap-4">
                <Field label="Numeric source path" error={form.formState.errors.thresholdValuePath?.message}>
                  <Input {...form.register('thresholdValuePath')} placeholder="usage.activityScore" />
                </Field>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-900">Threshold buckets</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => thresholdsArray.append({ min: 0, max: null, label: '' })}
                  >
                    Add bucket
                  </Button>
                </div>
                {thresholdsArray.fields.map((field, index) => (
                  <div key={field.id} className="grid gap-3 md:grid-cols-[120px_120px_1fr_auto]">
                    <Input type="number" {...form.register(`thresholdRules.${index}.min`, { setValueAs: (value) => (value === '' ? null : Number(value)) })} placeholder="Min" />
                    <Input type="number" {...form.register(`thresholdRules.${index}.max`, { setValueAs: (value) => (value === '' ? null : Number(value)) })} placeholder="Max" />
                    <Input {...form.register(`thresholdRules.${index}.label`)} placeholder="high" />
                    <Button type="button" variant="ghost" onClick={() => thresholdsArray.remove(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}

            {values.mappingKind === 'WEIGHTED_SCORING' ? (
              <div className="grid gap-4">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Minimum">
                    <Input type="number" {...form.register('weightedMinimum', { valueAsNumber: true })} />
                  </Field>
                  <Field label="Maximum">
                    <Input type="number" {...form.register('weightedMaximum', { valueAsNumber: true })} />
                  </Field>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-900">Weighted components</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      weightedComponentsArray.append({
                        sourcePath: '',
                        weight: 1,
                        mode: 'map',
                        defaultValue: 0,
                        expected: '',
                        threshold: null,
                        trueValue: null,
                        falseValue: null,
                        mappings: [{ key: '', value: 0 }],
                      })
                    }
                  >
                    Add component
                  </Button>
                </div>
                {weightedComponentsArray.fields.map((field, index) => (
                  <Card key={field.id} className="bg-ivory-25">
                    <div className="grid gap-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <Input {...form.register(`weightedComponents.${index}.sourcePath`)} placeholder="warehouse.opportunityStage" />
                        <Input type="number" {...form.register(`weightedComponents.${index}.weight`, { valueAsNumber: true })} placeholder="Weight" />
                        <Select {...form.register(`weightedComponents.${index}.mode`)}>
                          <option value="map">map</option>
                          <option value="expected">expected</option>
                          <option value="threshold">threshold</option>
                        </Select>
                      </div>
                      {weightedComponentModes[index] === 'map' ? (
                        <div className="grid gap-3">
                          <Input type="number" {...form.register(`weightedComponents.${index}.defaultValue`, { setValueAs: (value) => (value === '' ? null : Number(value)) })} placeholder="Default value" />
                          {field.mappings.map((_mapping, mappingIndex) => (
                            <div key={`${field.id}-mapping-${mappingIndex}`} className="grid gap-3 md:grid-cols-2">
                              <Input {...form.register(`weightedComponents.${index}.mappings.${mappingIndex}.key`)} placeholder="proposal" />
                              <Input type="number" {...form.register(`weightedComponents.${index}.mappings.${mappingIndex}.value`, { valueAsNumber: true })} placeholder="60" />
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {weightedComponentModes[index] === 'expected' ? (
                        <div className="grid gap-3 md:grid-cols-3">
                          <Input {...form.register(`weightedComponents.${index}.expected`)} placeholder="enterprise" />
                          <Input type="number" {...form.register(`weightedComponents.${index}.trueValue`, { setValueAs: (value) => (value === '' ? null : Number(value)) })} placeholder="True value" />
                          <Input type="number" {...form.register(`weightedComponents.${index}.falseValue`, { setValueAs: (value) => (value === '' ? null : Number(value)) })} placeholder="False value" />
                        </div>
                      ) : null}
                      {weightedComponentModes[index] === 'threshold' ? (
                        <div className="grid gap-3 md:grid-cols-3">
                          <Input type="number" {...form.register(`weightedComponents.${index}.threshold`, { setValueAs: (value) => (value === '' ? null : Number(value)) })} placeholder="Threshold" />
                          <Input type="number" {...form.register(`weightedComponents.${index}.trueValue`, { setValueAs: (value) => (value === '' ? null : Number(value)) })} placeholder="True value" />
                          <Input type="number" {...form.register(`weightedComponents.${index}.falseValue`, { setValueAs: (value) => (value === '' ? null : Number(value)) })} placeholder="False value" />
                        </div>
                      ) : null}
                      <Button type="button" variant="ghost" onClick={() => weightedComponentsArray.remove(index)}>
                        Remove component
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : null}

            {values.mappingKind === 'FORMULA_METRIC' ? (
              <div className="grid gap-4">
                <Field label="Formula expression" error={form.formState.errors.formulaExpression?.message}>
                  <Input {...form.register('formulaExpression')} placeholder="15 + support_ticket_score - active_days_credit" />
                </Field>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-900">Variables</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      formulaVariablesArray.append({
                        name: '',
                        sourcePath: '',
                        mode: 'multiplier',
                        multiplier: 1,
                        threshold: null,
                        trueValue: null,
                        falseValue: null,
                      })
                    }
                  >
                    Add variable
                  </Button>
                </div>
                {formulaVariablesArray.fields.map((field, index) => (
                  <Card key={field.id} className="bg-ivory-25">
                    <div className="grid gap-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <Input {...form.register(`formulaVariables.${index}.name`)} placeholder="support_ticket_score" />
                        <Input {...form.register(`formulaVariables.${index}.sourcePath`)} placeholder="warehouse.supportTickets30" />
                        <Select {...form.register(`formulaVariables.${index}.mode`)}>
                          <option value="multiplier">multiplier</option>
                          <option value="threshold">threshold</option>
                          <option value="passthrough">passthrough</option>
                        </Select>
                      </div>
                      {formulaVariableModes[index] === 'multiplier' ? (
                        <Input type="number" {...form.register(`formulaVariables.${index}.multiplier`, { setValueAs: (value) => (value === '' ? null : Number(value)) })} placeholder="Multiplier" />
                      ) : null}
                      {formulaVariableModes[index] === 'threshold' ? (
                        <div className="grid gap-3 md:grid-cols-3">
                          <Input type="number" {...form.register(`formulaVariables.${index}.threshold`, { setValueAs: (value) => (value === '' ? null : Number(value)) })} placeholder="Threshold" />
                          <Input type="number" {...form.register(`formulaVariables.${index}.trueValue`, { setValueAs: (value) => (value === '' ? null : Number(value)) })} placeholder="True value" />
                          <Input type="number" {...form.register(`formulaVariables.${index}.falseValue`, { setValueAs: (value) => (value === '' ? null : Number(value)) })} placeholder="False value" />
                        </div>
                      ) : null}
                      <Button type="button" variant="ghost" onClick={() => formulaVariablesArray.remove(index)}>
                        Remove variable
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : null}
          </form>
        </Panel>

        <div className="grid gap-4">
          <Panel
            eyebrow="Runtime preview"
            title="Validation and transformed output"
            action={
              previewMutation.data ? (
                <Badge tone={previewMutation.data.isSuccess ? 'success' : 'danger'}>
                  {previewMutation.data.isSuccess ? 'Preview ready' : 'Preview failed'}
                </Badge>
              ) : (
                <Badge tone="neutral">No preview yet</Badge>
              )
            }
          >
            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={form.handleSubmit(async () => {
                    await previewMutation.mutateAsync()
                  })}
                >
                  <Play className="mr-2 size-4" />
                  Preview
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={form.handleSubmit(async () => {
                    await validateMutation.mutateAsync()
                  })}
                >
                  <Wand2 className="mr-2 size-4" />
                  Validate
                </Button>
              </div>

              {previewMutation.data?.isSuccess ? (
                <Card className="bg-ink-950 text-ivory-50">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-copper-300">Transformed attribute</p>
                      <p className="mt-2 font-display text-2xl">{previewMutation.data.selectorName}</p>
                    </div>
                    <Badge tone="success">{formatConfidence(previewMutation.data.confidence)}</Badge>
                  </div>
                  <p className="mt-4 text-sm leading-7">{previewMutation.data.explanation}</p>
                </Card>
              ) : null}

              {validateMutation.data?.validationErrors.length ? (
                <Card className="border-rosewood-500/30 bg-rosewood-500/8">
                  <p className="font-semibold text-rosewood-800">Validation errors</p>
                  <ul className="mt-3 grid gap-2 text-sm text-rosewood-800">
                    {validateMutation.data.validationErrors.map((error) => (
                      <li key={error}>• {error}</li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              <div className="grid gap-4">
                <JsonViewer value={compiledInput} title="Compiled selector input" height="h-64" />
                <JsonViewer value={previewMutation.data?.rawSourceDataJson ?? '{}'} title="Raw source payload" height="h-56" />
                <JsonViewer value={previewMutation.data?.normalizedSourceDataJson ?? '{}'} title="Normalized source payload" height="h-56" />
                <JsonViewer value={previewMutation.data?.pipelineTraceJson ?? validateMutation.data?.pipelineTraceJson ?? '[]'} title="Pipeline trace" height="h-72" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => recomputeMutation.mutate()}
                  disabled={recomputeMutation.isPending}
                >
                  <RefreshCcw className="mr-2 size-4" />
                  Recompute user
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => scheduledMutation.mutate()}
                  disabled={scheduledMutation.isPending}
                >
                  <Send className="mr-2 size-4" />
                  Run scheduled jobs
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  )
}
