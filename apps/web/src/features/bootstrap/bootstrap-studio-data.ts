import { z } from 'zod'
import type { DataSourceKind, SelectorMappingKind, SemanticDataType } from '@/lib/types'

const dataSourceKindSchema = z.enum([
  'CRM',
  'SQL_METRIC',
  'PRODUCT_USAGE',
  'EVENT_STREAM',
  'API_PAYLOAD',
  'MOCK',
] satisfies DataSourceKind[])

const semanticDataTypeSchema = z.enum([
  'JSON',
  'STRING',
  'NUMBER',
  'PERCENTAGE',
  'ENUM',
  'BOOLEAN',
  'DATETIME',
] satisfies SemanticDataType[])

const selectorMappingKindSchema = z.enum([
  'DIRECT_FIELD_MAPPING',
  'WEIGHTED_SCORING',
  'THRESHOLD_CLASSIFICATION',
  'STRING_TO_ENUM_MAPPING',
  'FORMULA_METRIC',
] satisfies SelectorMappingKind[])

export const contextLayerBlueprintSchema = z.object({
  version: z.string().min(1),
  name: z.string().min(3),
  tenantSlug: z.string().min(1),
  sourceArtifacts: z.array(
    z.object({
      label: z.string().min(1),
      purpose: z.string().min(1),
      example: z.string().min(1),
    }),
  ).default([]),
  dataSources: z.array(
    z.object({
      name: z.string().min(3),
      description: z.string().min(10),
      kind: dataSourceKindSchema,
      connectionConfig: z.record(z.string(), z.unknown()),
    }),
  ).min(1),
  semanticAttributes: z.array(
    z.object({
      key: z.string().min(2),
      displayName: z.string().min(3),
      description: z.string().min(12),
      dataType: semanticDataTypeSchema,
      exampleValueJson: z.string().min(1),
      isSystem: z.boolean().default(true),
    }),
  ).min(1),
  selectors: z.array(
    z.object({
      name: z.string().min(3),
      description: z.string().min(12),
      dataSourceName: z.string().min(1),
      targetAttributeKey: z.string().min(2),
      mappingKind: selectorMappingKindSchema,
      expression: z.record(z.string(), z.unknown()),
      explanationTemplate: z.string().min(8),
      validationSchema: z.record(z.string(), z.unknown()).default({}),
      defaultConfidence: z.number().min(0).max(1),
      freshnessWindowMinutes: z.number().int().min(5),
      priority: z.number().int().min(0).max(100),
      scheduleIntervalMinutes: z.number().int().min(5).nullable().optional(),
      publish: z.boolean().default(true),
    }),
  ).min(1),
  promptTemplates: z.array(
    z.object({
      name: z.string().min(3),
      description: z.string().min(10),
      systemPrompt: z.string().min(10),
      developerPrompt: z.string().min(10),
      userPromptTemplate: z.string().min(10),
      outputSchema: z.record(z.string(), z.unknown()),
      guardrails: z.array(z.string()).default([]),
    }),
  ).default([]),
  rolloutNotes: z.array(z.string()).default([]),
})

export type ContextLayerBlueprint = z.infer<typeof contextLayerBlueprintSchema>

export const bootstrapArtifacts = [
  {
    label: 'Operational schema export',
    purpose: 'Give the model table names, columns, and primary joins from the source estate.',
    example: 'Postgres schema dump for accounts, contacts, subscriptions, support tickets, usage, and billing.',
  },
  {
    label: 'CRM sample records',
    purpose: 'Show how real opportunities, contacts, activities, and lifecycle stages are encoded.',
    example: 'CSV export from Salesforce or HubSpot with 50 to 200 representative rows.',
  },
  {
    label: 'Warehouse KPI definitions',
    purpose: 'Clarify what the business means by engagement, conversion, churn, or expansion.',
    example: 'Metric glossary, dbt models, Looker explores, or SQL snippets used by RevOps today.',
  },
  {
    label: 'Support and success exports',
    purpose: 'Expose risk, friction, escalation, and satisfaction signals that affect sales motions.',
    example: 'Zendesk or Intercom ticket samples, customer health score docs, and renewal notes.',
  },
] as const

export const codexBootstrapPrompt = `You are creating a Context Layer import blueprint for a governed Universal Context Layer rollout.

Inputs you will receive:
1. Operational schemas from CRMs, warehouses, billing, support, product telemetry, or other source systems.
2. Sample rows and KPI definitions from those systems.
3. Commercial goals for the AI or product workflows this UCL should support.

Your job:
1. Identify the source systems that should become Context Layer data sources.
2. Propose canonical semantic attributes that describe customer state in business language.
3. Draft selectors that map source signals into those semantic attributes.
4. Draft at least one grounded AI prompt template for Intelligent Sales Support.
5. Return one JSON file that exactly follows the ContextLayerBlueprint format below.

Important rules:
- Do not invent source columns that are not evidenced in the uploaded material.
- Use business-aware names for semantic attributes.
- Keep every selector explainable and governable.
- Prefer deterministic rules over vague heuristics.
- Assume humans will review and approve the blueprint before production use.

Output format:
Return JSON only with this top-level shape:
{
  "version": "1.0",
  "name": "string",
  "tenantSlug": "string",
  "sourceArtifacts": [{ "label": "string", "purpose": "string", "example": "string" }],
  "dataSources": [
    {
      "name": "string",
      "description": "string",
      "kind": "CRM | SQL_METRIC | PRODUCT_USAGE | EVENT_STREAM | API_PAYLOAD | MOCK",
      "connectionConfig": { "connectorType": "string", "...": "any evidenced config fields" }
    }
  ],
  "semanticAttributes": [
    {
      "key": "string",
      "displayName": "string",
      "description": "string",
      "dataType": "JSON | STRING | NUMBER | PERCENTAGE | ENUM | BOOLEAN | DATETIME",
      "exampleValueJson": "stringified JSON value",
      "isSystem": true
    }
  ],
  "selectors": [
    {
      "name": "string",
      "description": "string",
      "dataSourceName": "string",
      "targetAttributeKey": "string",
      "mappingKind": "DIRECT_FIELD_MAPPING | WEIGHTED_SCORING | THRESHOLD_CLASSIFICATION | STRING_TO_ENUM_MAPPING | FORMULA_METRIC",
      "expression": { "rule": {}, "transforms": [] },
      "explanationTemplate": "string",
      "validationSchema": { "requiredPaths": [] },
      "defaultConfidence": 0.0,
      "freshnessWindowMinutes": 60,
      "priority": 10,
      "scheduleIntervalMinutes": 60,
      "publish": true
    }
  ],
  "promptTemplates": [
    {
      "name": "string",
      "description": "string",
      "systemPrompt": "string",
      "developerPrompt": "string",
      "userPromptTemplate": "string",
      "outputSchema": {},
      "guardrails": ["string"]
    }
  ],
  "rolloutNotes": ["string"]
}`

export const sampleBlueprint: ContextLayerBlueprint = {
  version: '1.0',
  name: 'Northstar Logistics intelligent sales blueprint',
  tenantSlug: 'demo',
  sourceArtifacts: bootstrapArtifacts.map((artifact) => ({ ...artifact })),
  dataSources: [
    {
      name: 'Customer Ops Contact Signals',
      description: 'Direct SQL connector into customer_ops_db contact-level signal rollups.',
      kind: 'CRM',
      connectionConfig: {
        connectorType: 'sqlTable',
        mode: 'customerOpsDatabase',
        tableName: 'customer_contact_signals',
        tenantSlugColumn: 'tenant_slug',
        userIdColumn: 'external_user_id',
        observedAtColumn: 'observed_at_utc',
        columns: [
          'tenant_slug',
          'external_user_id',
          'preferred_channel',
          'stakeholder_seniority',
          'decision_maker_likelihood',
          'observed_at_utc',
        ],
      },
    },
    {
      name: 'Customer Ops Email Signals',
      description: 'Direct SQL connector into customer_ops_db email engagement rollups.',
      kind: 'EVENT_STREAM',
      connectionConfig: {
        connectorType: 'sqlTable',
        mode: 'customerOpsDatabase',
        tableName: 'customer_email_signals',
        tenantSlugColumn: 'tenant_slug',
        userIdColumn: 'external_user_id',
        observedAtColumn: 'observed_at_utc',
        columns: [
          'tenant_slug',
          'external_user_id',
          'engagement_channel_signal',
          'email_open_count_30d',
          'email_click_count_30d',
          'email_reply_count_30d',
          'observed_at_utc',
        ],
      },
    },
    {
      name: 'Customer Ops Context Rollups',
      description: 'Direct SQL connector into customer_ops_db commercial, support, billing, and usage rollups.',
      kind: 'SQL_METRIC',
      connectionConfig: {
        connectorType: 'sqlTable',
        mode: 'customerOpsDatabase',
        tableName: 'customer_context_rollups',
        tenantSlugColumn: 'tenant_slug',
        userIdColumn: 'external_user_id',
        observedAtColumn: 'observed_at_utc',
        columns: [
          'plan_interest_signal',
          'activity_score',
          'pricing_page_visits_30',
          'open_opportunity_probability',
          'recent_sales_activity_score',
          'support_drag_score',
          'enterprise_interest_score',
          'budget_readiness_score',
          'recommended_sales_motion_signal',
          'sales_urgency_score',
          'product_fit_score',
        ],
      },
    },
  ],
  semanticAttributes: [
    {
      key: 'conversionProbability',
      displayName: 'Conversion Probability',
      description: 'Likelihood that the profile converts into a commercial opportunity.',
      dataType: 'PERCENTAGE',
      exampleValueJson: '82',
      isSystem: true,
    },
    {
      key: 'preferredChannel',
      displayName: 'Preferred Channel',
      description: 'Most effective outreach channel from operational evidence.',
      dataType: 'ENUM',
      exampleValueJson: '"email"',
      isSystem: true,
    },
    {
      key: 'planInterest',
      displayName: 'Plan Interest',
      description: 'Commercial packaging interest derived from pricing and pipeline signals.',
      dataType: 'ENUM',
      exampleValueJson: '"enterprise"',
      isSystem: true,
    },
    {
      key: 'expansionPotential',
      displayName: 'Expansion Potential',
      description: 'Upsell or seat expansion headroom.',
      dataType: 'PERCENTAGE',
      exampleValueJson: '76',
      isSystem: true,
    },
    {
      key: 'recommendedSalesMotion',
      displayName: 'Recommended Sales Motion',
      description: 'Best next commercial motion for the rep.',
      dataType: 'ENUM',
      exampleValueJson: '"accelerate_enterprise"',
      isSystem: true,
    },
  ],
  selectors: [
    {
      name: 'Preferred Channel from Contact Preference',
      description: 'Maps contact-level channel preference from customer_ops_db into the semantic layer.',
      dataSourceName: 'Customer Ops Contact Signals',
      targetAttributeKey: 'preferredChannel',
      mappingKind: 'DIRECT_FIELD_MAPPING',
      expression: {
        transforms: [{ path: 'preferred_channel', type: 'lower' }],
        rule: { valuePath: 'preferred_channel' },
        confidence: { base: 0.96 },
      },
      explanationTemplate: 'Preferred channel resolved from the contact record as {{sourceValue}}.',
      validationSchema: { requiredPaths: ['preferred_channel'] },
      defaultConfidence: 0.96,
      freshnessWindowMinutes: 1440,
      priority: 10,
      scheduleIntervalMinutes: 120,
      publish: true,
    },
    {
      name: 'Plan Interest from Commercial Intent',
      description: 'Normalizes commercial packaging intent into starter, growth, or enterprise.',
      dataSourceName: 'Customer Ops Context Rollups',
      targetAttributeKey: 'planInterest',
      mappingKind: 'STRING_TO_ENUM_MAPPING',
      expression: {
        rule: {
          valuePath: 'plan_interest_signal',
          map: {
            starter: 'starter',
            growth: 'growth',
            enterprise: 'enterprise',
          },
        },
        confidence: { baseConfidence: 0.91 },
      },
      explanationTemplate: 'Plan interest normalized to {{mappedValue}} from operational demand signals.',
      validationSchema: { requiredPaths: ['plan_interest_signal'] },
      defaultConfidence: 0.91,
      freshnessWindowMinutes: 1440,
      priority: 12,
      scheduleIntervalMinutes: 120,
      publish: true,
    },
    {
      name: 'Conversion Probability Composite',
      description: 'Weighted scoring across pipeline, activity, enterprise intent, and support drag.',
      dataSourceName: 'Customer Ops Context Rollups',
      targetAttributeKey: 'conversionProbability',
      mappingKind: 'WEIGHTED_SCORING',
      expression: {
        rule: {
          minimum: 0,
          maximum: 100,
          components: [
            { sourcePath: 'open_opportunity_probability', multiplier: 0.55 },
            { sourcePath: 'recent_sales_activity_score', multiplier: 0.2 },
            { sourcePath: 'enterprise_interest_score', multiplier: 0.2 },
            { sourcePath: 'trial_activated_recently', expected: 'true', trueValue: 12, falseValue: 0 },
            { sourcePath: 'support_drag_score', multiplier: -0.15 },
          ],
        },
        confidence: { baseConfidence: 0.92, stalePenaltyPerHour: 0.0008, minimum: 0.6 },
      },
      explanationTemplate:
        'Conversion probability blended pipeline {{openopportunityprobability}}, engagement {{recentsalesactivityscore}}, enterprise intent {{enterpriseinterestscore}}, trial timing {{trialactivatedrecently}}, and support drag {{supportdragscore}}.',
      validationSchema: {
        requiredPaths: [
          'open_opportunity_probability',
          'recent_sales_activity_score',
          'enterprise_interest_score',
          'trial_activated_recently',
          'support_drag_score',
        ],
      },
      defaultConfidence: 0.92,
      freshnessWindowMinutes: 180,
      priority: 15,
      scheduleIntervalMinutes: 30,
      publish: true,
    },
    {
      name: 'Expansion Potential Formula',
      description: 'Derived expansion signal from utilization, adoption depth, automation, and revenue scale.',
      dataSourceName: 'Customer Ops Context Rollups',
      targetAttributeKey: 'expansionPotential',
      mappingKind: 'FORMULA_METRIC',
      expression: {
        rule: {
          expression: '20 + seat_utilization_score + adoption_bonus + automation_bonus + revenue_bonus',
          variables: [
            { name: 'seat_utilization_score', sourcePath: 'seat_utilization_ratio', multiplier: 40 },
            { name: 'adoption_bonus', sourcePath: 'feature_adoption_score', threshold: 75, trueValue: 18, falseValue: 6 },
            { name: 'automation_bonus', sourcePath: 'automation_runs_30', threshold: 60, trueValue: 14, falseValue: 4 },
            { name: 'revenue_bonus', sourcePath: 'monthly_recurring_revenue', threshold: 4000, trueValue: 12, falseValue: 4 },
          ],
        },
        confidence: { baseConfidence: 0.9, stalePenaltyPerHour: 0.0008, minimum: 0.6 },
      },
      explanationTemplate:
        'Expansion potential combined seat utilization {{seat_utilization_score}}, adoption bonus {{adoption_bonus}}, automation bonus {{automation_bonus}}, and revenue bonus {{revenue_bonus}}.',
      validationSchema: {
        requiredPaths: [
          'seat_utilization_ratio',
          'feature_adoption_score',
          'automation_runs_30',
          'monthly_recurring_revenue',
        ],
      },
      defaultConfidence: 0.9,
      freshnessWindowMinutes: 300,
      priority: 14,
      scheduleIntervalMinutes: 60,
      publish: true,
    },
    {
      name: 'Recommended Sales Motion',
      description: 'Normalizes the next-best motion from operational rollups.',
      dataSourceName: 'Customer Ops Context Rollups',
      targetAttributeKey: 'recommendedSalesMotion',
      mappingKind: 'STRING_TO_ENUM_MAPPING',
      expression: {
        rule: {
          valuePath: 'recommended_sales_motion_signal',
          map: {
            accelerate_enterprise: 'accelerate_enterprise',
            expand_multithread: 'expand_multithread',
            save_at_risk: 'save_at_risk',
            nurture_value: 'nurture_value',
          },
        },
        confidence: { baseConfidence: 0.86 },
      },
      explanationTemplate: 'Recommended sales motion normalized to {{mappedValue}} from blended account conditions.',
      validationSchema: { requiredPaths: ['recommended_sales_motion_signal'] },
      defaultConfidence: 0.86,
      freshnessWindowMinutes: 240,
      priority: 13,
      scheduleIntervalMinutes: 45,
      publish: true,
    },
  ],
  promptTemplates: [
    {
      name: 'AI-Assisted UCL Bootstrap',
      description: 'Template used by Context Layer to import an AI-drafted semantic blueprint into the workspace.',
      systemPrompt:
        'You are Context Layer’s bootstrap architect. Use only the provided source materials and return governed JSON only.',
      developerPrompt:
        'Draft canonical business attributes, deterministic selectors, and import-ready configuration. Do not invent source fields or undocumented business logic.',
      userPromptTemplate:
        'Create a ContextLayerBlueprint for {{tenant.slug}} using the uploaded schemas, CRM extracts, KPI notes, and product workflow goals.',
      outputSchema: {
        type: 'object',
        required: ['version', 'name', 'tenantSlug', 'dataSources', 'semanticAttributes', 'selectors'],
      },
      guardrails: [
        'Return JSON only.',
        'Do not invent source tables or columns.',
        'Prefer deterministic selectors over opaque heuristics.',
        'Flag missing information instead of guessing.',
      ],
    },
  ],
  rolloutNotes: [
    'Start with the three operational data sources already proven in the demo.',
    'Publish only the selectors that pass preview validation against real user records.',
    'Keep AI output grounded in the imported prompt template until tenant-specific prompt tuning is approved.',
  ],
}
