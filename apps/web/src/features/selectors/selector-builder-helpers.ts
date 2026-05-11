import { z } from 'zod'
import type { SelectorDefinition, SelectorMappingKind, UpsertSelectorDefinitionInput } from '@/lib/types'
import { prettyJson, safeJsonParse } from '@/lib/utils'

const transformTypes = ['lower', 'upper', 'trim', 'number', 'string'] as const

export const selectorMappingOptions: Array<{
  value: SelectorMappingKind
  label: string
  description: string
}> = [
  {
    value: 'DIRECT_FIELD_MAPPING',
    label: 'Direct field mapping',
    description: 'Pass a source field through with optional normalisation steps.',
  },
  {
    value: 'WEIGHTED_SCORING',
    label: 'Weighted scoring',
    description: 'Blend several signals into a ranked commercial score.',
  },
  {
    value: 'THRESHOLD_CLASSIFICATION',
    label: 'Threshold classification',
    description: 'Classify activity into discrete buckets like low, medium, and high.',
  },
  {
    value: 'STRING_TO_ENUM_MAPPING',
    label: 'String-to-enum mapping',
    description: 'Translate raw source values into canonical semantic categories.',
  },
  {
    value: 'FORMULA_METRIC',
    label: 'Formula metric',
    description: 'Derive a metric from named variables and arithmetic.',
  },
]

export const selectorFormSchema = z
  .object({
    selectorId: z.string().optional().nullable(),
    previewExternalUserId: z.string().min(1, 'Preview user is required.'),
    name: z.string().min(3, 'Selector name is required.'),
    description: z.string().min(12, 'Describe what this selector does.'),
    dataSourceId: z.string().min(1, 'Choose a data source.'),
    targetAttributeDefinitionId: z.string().min(1, 'Choose a semantic attribute.'),
    mappingKind: z.enum([
      'DIRECT_FIELD_MAPPING',
      'WEIGHTED_SCORING',
      'THRESHOLD_CLASSIFICATION',
      'STRING_TO_ENUM_MAPPING',
      'FORMULA_METRIC',
    ] satisfies SelectorMappingKind[]),
    explanationTemplate: z.string().min(8, 'Add an explanation template for provenance.'),
    defaultConfidence: z.number().min(0).max(1),
    freshnessWindowMinutes: z.number().int().min(5).max(10_080),
    priority: z.number().int().min(0).max(100),
    scheduleIntervalMinutes: z.number().int().min(5).max(1_440).nullable(),
    requiredPaths: z
      .array(z.object({ value: z.string().min(1, 'Source path is required.') }))
      .min(1, 'Add at least one required path.'),
    transforms: z.array(
      z.object({
        path: z.string().min(1, 'Transform path is required.'),
        type: z.enum(transformTypes),
      }),
    ),
    directValuePath: z.string().optional(),
    stringEnumValuePath: z.string().optional(),
    stringEnumMappings: z.array(
      z.object({
        sourceValue: z.string().min(1),
        targetValue: z.string().min(1),
      }),
    ),
    thresholdValuePath: z.string().optional(),
    thresholdRules: z.array(
      z.object({
        min: z.number().nullable(),
        max: z.number().nullable(),
        label: z.string().min(1),
      }),
    ),
    weightedMinimum: z.number(),
    weightedMaximum: z.number(),
    weightedComponents: z.array(
      z.object({
        sourcePath: z.string().min(1),
        weight: z.number().min(0),
        mode: z.enum(['map', 'expected', 'threshold']),
        defaultValue: z.number().nullable(),
        expected: z.string(),
        threshold: z.number().nullable(),
        trueValue: z.number().nullable(),
        falseValue: z.number().nullable(),
        mappings: z.array(
          z.object({
            key: z.string().min(1),
            value: z.number(),
          }),
        ),
      }),
    ),
    formulaExpression: z.string().optional(),
    formulaVariables: z.array(
      z.object({
        name: z.string().min(1),
        sourcePath: z.string().min(1),
        mode: z.enum(['multiplier', 'threshold', 'passthrough']),
        multiplier: z.number().nullable(),
        threshold: z.number().nullable(),
        trueValue: z.number().nullable(),
        falseValue: z.number().nullable(),
      }),
    ),
  })
  .superRefine((value, context) => {
    if (value.mappingKind === 'DIRECT_FIELD_MAPPING' && !value.directValuePath?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['directValuePath'],
        message: 'Field mapping requires a source path.',
      })
    }

    if (value.mappingKind === 'STRING_TO_ENUM_MAPPING') {
      if (!value.stringEnumValuePath?.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['stringEnumValuePath'],
          message: 'String-to-enum mapping needs a source path.',
        })
      }

      if (value.stringEnumMappings.length === 0) {
        context.addIssue({
          code: 'custom',
          path: ['stringEnumMappings'],
          message: 'Add at least one enum mapping.',
        })
      }
    }

    if (value.mappingKind === 'THRESHOLD_CLASSIFICATION') {
      if (!value.thresholdValuePath?.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['thresholdValuePath'],
          message: 'Threshold classification needs a numeric source path.',
        })
      }

      if (value.thresholdRules.length === 0) {
        context.addIssue({
          code: 'custom',
          path: ['thresholdRules'],
          message: 'Add at least one threshold bucket.',
        })
      }
    }

    if (value.mappingKind === 'WEIGHTED_SCORING' && value.weightedComponents.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['weightedComponents'],
        message: 'Add at least one weighted component.',
      })
    }

    if (value.mappingKind === 'FORMULA_METRIC') {
      if (!value.formulaExpression?.trim()) {
        context.addIssue({
          code: 'custom',
          path: ['formulaExpression'],
          message: 'Formula selectors need an expression.',
        })
      }

      if (value.formulaVariables.length === 0) {
        context.addIssue({
          code: 'custom',
          path: ['formulaVariables'],
          message: 'Add at least one formula variable.',
        })
      }
    }
  })

export type SelectorBuilderFormValues = z.infer<typeof selectorFormSchema>

export function createEmptySelectorForm(
  previewExternalUserId: string,
  dataSourceId?: string,
  targetAttributeDefinitionId?: string,
): SelectorBuilderFormValues {
  return {
    selectorId: null,
    previewExternalUserId,
    name: 'New selector',
    description: 'Map one or more business signals into a canonical semantic attribute.',
    dataSourceId: dataSourceId ?? '',
    targetAttributeDefinitionId: targetAttributeDefinitionId ?? '',
    mappingKind: 'DIRECT_FIELD_MAPPING',
    explanationTemplate: 'Resolved from {{sourceValue}}.',
    defaultConfidence: 0.9,
    freshnessWindowMinutes: 180,
    priority: 5,
    scheduleIntervalMinutes: 30,
    requiredPaths: [{ value: 'crm.preferredChannel' }],
    transforms: [{ path: 'crm.preferredChannel', type: 'lower' }],
    directValuePath: 'crm.preferredChannel',
    stringEnumValuePath: 'crm.planInterest',
    stringEnumMappings: [{ sourceValue: 'enterprise', targetValue: 'enterprise' }],
    thresholdValuePath: 'usage.activityScore',
    thresholdRules: [
      { min: 80, max: null, label: 'high' },
      { min: 50, max: 80, label: 'medium' },
      { min: 0, max: 50, label: 'low' },
    ],
    weightedMinimum: 0,
    weightedMaximum: 100,
    weightedComponents: [
      {
        sourcePath: 'warehouse.opportunityStage',
        weight: 1,
        mode: 'map',
        defaultValue: 20,
        expected: '',
        threshold: null,
        trueValue: null,
        falseValue: null,
        mappings: [
          { key: 'proposal', value: 60 },
          { key: 'discovery', value: 35 },
        ],
      },
    ],
    formulaExpression: '15 + support_ticket_score + low_nps_penalty - active_days_credit',
    formulaVariables: [
      {
        name: 'support_ticket_score',
        sourcePath: 'warehouse.supportTickets30',
        mode: 'multiplier',
        multiplier: 2,
        threshold: null,
        trueValue: null,
        falseValue: null,
      },
    ],
  }
}

export function buildSelectorInput(
  values: SelectorBuilderFormValues,
  tenantSlug: string,
): UpsertSelectorDefinitionInput {
  const transforms = values.transforms
    .filter((item) => item.path.trim())
    .map((item) => ({ path: item.path.trim(), type: item.type }))

  const expression = {
    transforms,
    rule: buildRule(values),
  }

  const validationSchema = {
    requiredPaths: values.requiredPaths.map((item) => item.value.trim()).filter(Boolean),
  }

  return {
    id: values.selectorId ?? null,
    tenantSlug,
    dataSourceId: values.dataSourceId,
    targetAttributeDefinitionId: values.targetAttributeDefinitionId,
    name: values.name.trim(),
    description: values.description.trim(),
    mappingKind: values.mappingKind,
    expressionJson: prettyJson(expression),
    explanationTemplate: values.explanationTemplate.trim(),
    validationSchemaJson: prettyJson(validationSchema),
    defaultConfidence: values.defaultConfidence,
    freshnessWindowMinutes: values.freshnessWindowMinutes,
    priority: values.priority,
    scheduleIntervalMinutes: values.scheduleIntervalMinutes,
  }
}

function buildRule(values: SelectorBuilderFormValues) {
  switch (values.mappingKind) {
    case 'DIRECT_FIELD_MAPPING':
      return {
        valuePath: values.directValuePath?.trim(),
      }
    case 'STRING_TO_ENUM_MAPPING':
      return {
        valuePath: values.stringEnumValuePath?.trim(),
        map: Object.fromEntries(
          values.stringEnumMappings
            .filter((item) => item.sourceValue.trim() && item.targetValue.trim())
            .map((item) => [item.sourceValue.trim(), item.targetValue.trim()]),
        ),
      }
    case 'THRESHOLD_CLASSIFICATION':
      return {
        valuePath: values.thresholdValuePath?.trim(),
        thresholds: values.thresholdRules.map((rule) => ({
          ...(rule.min !== null ? { min: rule.min } : {}),
          ...(rule.max !== null ? { max: rule.max } : {}),
          label: rule.label.trim(),
        })),
      }
    case 'WEIGHTED_SCORING':
      return {
        minimum: values.weightedMinimum,
        maximum: values.weightedMaximum,
        components: values.weightedComponents.map((component) => {
          const base = {
            sourcePath: component.sourcePath.trim(),
            weight: component.weight,
          }

          if (component.mode === 'map') {
            return {
              ...base,
              defaultValue: component.defaultValue ?? 0,
              map: Object.fromEntries(
                component.mappings
                  .filter((item) => item.key.trim())
                  .map((item) => [item.key.trim(), item.value]),
              ),
            }
          }

          if (component.mode === 'expected') {
            return {
              ...base,
              expected: component.expected.trim(),
              trueValue: component.trueValue ?? 0,
              falseValue: component.falseValue ?? 0,
            }
          }

          return {
            ...base,
            threshold: component.threshold ?? 0,
            trueValue: component.trueValue ?? 0,
            falseValue: component.falseValue ?? 0,
          }
        }),
      }
    case 'FORMULA_METRIC':
      return {
        expression: values.formulaExpression?.trim(),
        variables: values.formulaVariables.map((item) => {
          if (item.mode === 'multiplier') {
            return {
              name: item.name.trim(),
              sourcePath: item.sourcePath.trim(),
              multiplier: item.multiplier ?? 1,
            }
          }

          if (item.mode === 'threshold') {
            return {
              name: item.name.trim(),
              sourcePath: item.sourcePath.trim(),
              threshold: item.threshold ?? 0,
              trueValue: item.trueValue ?? 0,
              falseValue: item.falseValue ?? 0,
            }
          }

          return {
            name: item.name.trim(),
            sourcePath: item.sourcePath.trim(),
          }
        }),
      }
  }
}

export function inflateSelectorForm(
  selector: SelectorDefinition,
  previewExternalUserId: string,
): SelectorBuilderFormValues {
  const expression = safeJsonParse<Record<string, unknown>>(selector.expressionJson, {})
  const validation = safeJsonParse<{ requiredPaths?: string[] }>(
    selector.validationSchemaJson,
    {},
  )
  const transforms = Array.isArray(expression.transforms)
    ? expression.transforms
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item) => ({
          path: String(item.path ?? ''),
          type: (item.type ?? 'lower') as (typeof transformTypes)[number],
        }))
    : []
  const rule = (expression.rule ?? {}) as Record<string, unknown>

  const base = createEmptySelectorForm(
    previewExternalUserId,
    selector.dataSourceId ?? undefined,
    selector.targetAttributeDefinitionId,
  )

  const next: SelectorBuilderFormValues = {
    ...base,
    selectorId: selector.id,
    name: selector.name,
    description: selector.description,
    dataSourceId: selector.dataSourceId ?? '',
    targetAttributeDefinitionId: selector.targetAttributeDefinitionId,
    mappingKind: selector.mappingKind,
    explanationTemplate: selector.explanationTemplate,
    defaultConfidence: selector.defaultConfidence,
    freshnessWindowMinutes: selector.freshnessWindowMinutes,
    priority: selector.priority,
    scheduleIntervalMinutes: selector.scheduleIntervalMinutes ?? null,
    requiredPaths: (validation.requiredPaths ?? []).map((path) => ({ value: String(path) })),
    transforms,
    directValuePath: String(rule.valuePath ?? ''),
    stringEnumValuePath: String(rule.valuePath ?? ''),
    stringEnumMappings: Object.entries(rule.map ?? {}).map(([sourceValue, targetValue]) => ({
      sourceValue,
      targetValue: String(targetValue),
    })),
    thresholdValuePath: String(rule.valuePath ?? ''),
    thresholdRules: Array.isArray(rule.thresholds)
      ? rule.thresholds
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          .map((item) => ({
            min: typeof item.min === 'number' ? item.min : null,
            max: typeof item.max === 'number' ? item.max : null,
            label: String(item.label ?? ''),
          }))
      : base.thresholdRules,
    weightedMinimum: Number(rule.minimum ?? base.weightedMinimum),
    weightedMaximum: Number(rule.maximum ?? base.weightedMaximum),
    weightedComponents: Array.isArray(rule.components)
      ? rule.components
          .filter((component): component is Record<string, unknown> => typeof component === 'object' && component !== null)
          .map((component) => ({
            sourcePath: String(component.sourcePath ?? ''),
            weight: Number(component.weight ?? 1),
            mode: component.map ? 'map' : component.expected !== undefined ? 'expected' : 'threshold',
            defaultValue:
              component.defaultValue !== undefined ? Number(component.defaultValue) : null,
            expected: String(component.expected ?? ''),
            threshold:
              component.threshold !== undefined ? Number(component.threshold) : null,
            trueValue:
              component.trueValue !== undefined ? Number(component.trueValue) : null,
            falseValue:
              component.falseValue !== undefined ? Number(component.falseValue) : null,
            mappings: Object.entries((component.map ?? {}) as Record<string, unknown>).map(([key, value]) => ({
              key,
              value: Number(value),
            })),
          }))
      : base.weightedComponents,
    formulaExpression: String(rule.expression ?? base.formulaExpression ?? ''),
    formulaVariables: Array.isArray(rule.variables)
      ? rule.variables
          .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
          .map((item) => ({
            name: String(item.name ?? ''),
            sourcePath: String(item.sourcePath ?? ''),
            mode:
              item.multiplier !== undefined
                ? 'multiplier'
                : item.threshold !== undefined
                  ? 'threshold'
                  : 'passthrough',
            multiplier: item.multiplier !== undefined ? Number(item.multiplier) : null,
            threshold: item.threshold !== undefined ? Number(item.threshold) : null,
            trueValue: item.trueValue !== undefined ? Number(item.trueValue) : null,
            falseValue: item.falseValue !== undefined ? Number(item.falseValue) : null,
          }))
      : base.formulaVariables,
  }

  if (next.requiredPaths.length === 0) {
    next.requiredPaths = base.requiredPaths
  }

  return next
}
