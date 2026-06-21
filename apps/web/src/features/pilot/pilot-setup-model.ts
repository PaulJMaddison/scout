import type {
  ConnectorCatalogueEntry,
  ConnectorConfigurationValidationResult,
  ConnectorPluginDefinition,
  DataSourceKind,
  ValidateConnectorConfigurationInput,
} from '@/lib/types'
import { getConnectorMaturityLabels, type ConnectorMaturityLabel } from '@/features/connectors/connector-readiness'
import { prettyJson } from '@/lib/utils'

export type PilotOutcomeId =
  | 'revenue-conversion'
  | 'retention-risk'
  | 'support-escalation'
  | 'product-adoption'

export type PilotSignOffStatus = 'draft' | 'owner-review' | 'approved-for-dry-run' | 'blocked'

export interface PilotOutcomeOption {
  id: PilotOutcomeId
  label: string
  purpose: string
  successCriteria: string
}

export interface PilotSourceOption {
  connectorType: string
  label: string
  dataSourceKind: DataSourceKind
  description: string
  dryRunMode: 'connector-validation' | 'event-contract' | 'local-demo-proof' | 'private-scope-review'
  defaultConfiguration: Record<string, unknown>
}

export interface ScopeFieldOption {
  id: string
  label: string
  category: string
  isSensitiveOrPii: boolean
  defaultInScope: boolean
  retention: string
  masking: string
}

export interface PilotSetupDraft {
  outcomeId: PilotOutcomeId
  connectorType: string
  sourceOwner: string
  purpose: string
  scopedFieldIds: string[]
  signOffStatus: PilotSignOffStatus
  retentionNote: string
  maskingNote: string
}

export interface DataScopeApproval {
  sourceOwner: string
  purpose: string
  inScopeFields: ScopeFieldOption[]
  outOfScopeFields: ScopeFieldOption[]
  hasSensitiveOrPiiInScope: boolean
  sensitiveCategoryLabels: string[]
  retentionNote: string
  maskingNote: string
  signOffStatus: PilotSignOffStatus
}

export interface PilotDryRunResult {
  status: 'passed' | 'needs-review' | 'blocked'
  mode: 'live-endpoint' | 'local-simulation' | 'private-scope'
  title: string
  messages: string[]
  checkedAtUtc: string
  validation?: ConnectorConfigurationValidationResult
}

export interface PilotReadinessItem {
  label: string
  status: 'complete' | 'needs-review' | 'blocked'
  detail: string
}

export interface PilotReadinessSummary {
  status: 'ready-for-operator-review' | 'needs-scope-signoff' | 'needs-dry-run' | 'blocked'
  label: string
  items: PilotReadinessItem[]
}

export const pilotOutcomeOptions: PilotOutcomeOption[] = [
  {
    id: 'revenue-conversion',
    label: 'Revenue conversion',
    purpose: 'customer_outreach',
    successCriteria: 'A downstream team can inspect cited context and choose a next sales action.',
  },
  {
    id: 'retention-risk',
    label: 'Retention risk',
    purpose: 'renewal_review',
    successCriteria: 'A success team can inspect renewal risk signals without joining raw source tables.',
  },
  {
    id: 'support-escalation',
    label: 'Support escalation',
    purpose: 'support_followup',
    successCriteria: 'A support lead can review cited support, usage, and account signals before follow-up.',
  },
  {
    id: 'product-adoption',
    label: 'Product adoption',
    purpose: 'adoption_review',
    successCriteria: 'A product workflow can consume scoped usage and context signals for one account cohort.',
  },
]

export const pilotSourceOptions: PilotSourceOption[] = [
  {
    connectorType: 'mockCrm',
    label: 'Mock CRM or approved CRM export',
    dataSourceKind: 'CRM',
    description: 'Safe local CRM-shaped records for the first operator-assisted proof.',
    dryRunMode: 'connector-validation',
    defaultConfiguration: {
      scenario: 'pilot-approved-crm-export',
      records: [{ externalUserId: '123', payload: { crm: { preferredChannel: 'email' } } }],
    },
  },
  {
    connectorType: 'postgresql',
    label: 'PostgreSQL table or read-only view',
    dataSourceKind: 'SQL_METRIC',
    description: 'Open-core SQL connector path for approved tables, views, or read replicas.',
    dryRunMode: 'connector-validation',
    defaultConfiguration: {
      connectorType: 'postgresql',
      mode: 'dry-run',
      table: 'approved_pilot_context_view',
      keyColumn: 'external_user_id',
      columns: ['external_user_id', 'account_id', 'lifecycle_stage', 'pricing_page_visits_30d'],
    },
  },
  {
    connectorType: 'restApi',
    label: 'Generic REST API preview',
    dataSourceKind: 'CRM',
    description: 'Generic JSON preview using static responses or a customer-approved internal endpoint.',
    dryRunMode: 'connector-validation',
    defaultConfiguration: {
      baseUrl: 'https://local-preview.kyntic.example',
      method: 'GET',
      staticResponses: [
        {
          externalUserId: '123',
          payload: { crm: { lifecycleStage: 'customer', opportunityStage: 'proposal' } },
        },
      ],
    },
  },
  {
    connectorType: 'csvUpload',
    label: 'CSV or spreadsheet export',
    dataSourceKind: 'SQL_METRIC',
    description: 'Assisted import path for fictional or customer-approved rows.',
    dryRunMode: 'local-demo-proof',
    defaultConfiguration: {
      importMode: 'operator-assisted',
      fileHandling: 'approved-export-only',
      sampleColumns: ['external_user_id', 'account_id', 'support_status'],
    },
  },
  {
    connectorType: 'productTelemetryEvents',
    label: 'Product telemetry event contract',
    dataSourceKind: 'EVENT_STREAM',
    description: 'Provider-neutral source-system events for approved product usage rollups.',
    dryRunMode: 'event-contract',
    defaultConfiguration: {
      eventType: 'source.product_usage.rollup_ready',
      requiredKeys: ['externalUserId', 'activeDays30', 'featureAdoptionScore'],
    },
  },
  {
    connectorType: 'salesforce',
    label: 'Private CRM connector request',
    dataSourceKind: 'CRM',
    description: 'Catalogue-only vendor path that requires scoped private/customer validation.',
    dryRunMode: 'private-scope-review',
    defaultConfiguration: {
      requestedConnector: 'salesforce',
      publicRepoStatus: 'metadata-only',
    },
  },
]

export const scopeFieldOptions: ScopeFieldOption[] = [
  {
    id: 'contact-email',
    label: 'Contact email address',
    category: 'Identity',
    isSensitiveOrPii: true,
    defaultInScope: true,
    retention: 'Pilot window plus agreed evidence-retention period.',
    masking: 'Mask for non-admin review and cite by stable identifier where possible.',
  },
  {
    id: 'account-profile',
    label: 'Account profile and lifecycle stage',
    category: 'CRM',
    isSensitiveOrPii: false,
    defaultInScope: true,
    retention: 'Retain while the pilot workflow is active.',
    masking: 'Show account labels to approved operators only.',
  },
  {
    id: 'opportunity-stage',
    label: 'Opportunity stage and next step',
    category: 'Sales',
    isSensitiveOrPii: false,
    defaultInScope: true,
    retention: 'Retain current stage and provenance until replaced by a fresher snapshot.',
    masking: 'Mask commercial amounts unless explicitly approved.',
  },
  {
    id: 'web-conversion',
    label: 'First-party web conversion events',
    category: 'Web',
    isSensitiveOrPii: true,
    defaultInScope: true,
    retention: 'Retain event summaries only for the agreed pilot period.',
    masking: 'Keep browser or campaign identifiers out of operator views unless approved.',
  },
  {
    id: 'product-usage',
    label: 'Product usage rollups',
    category: 'Product',
    isSensitiveOrPii: false,
    defaultInScope: true,
    retention: 'Retain aggregate rollups; do not import raw clickstream events by default.',
    masking: 'Use aggregate counts rather than raw session detail.',
  },
  {
    id: 'support-status',
    label: 'Support ticket status and severity',
    category: 'Support',
    isSensitiveOrPii: true,
    defaultInScope: true,
    retention: 'Retain status, severity, and citation only for the pilot window.',
    masking: 'Do not include ticket bodies or attachments without separate approval.',
  },
  {
    id: 'message-body',
    label: 'Email, chat, or document body text',
    category: 'Communications',
    isSensitiveOrPii: true,
    defaultInScope: false,
    retention: 'Out of scope for the first pilot setup unless separately approved.',
    masking: 'Body text remains excluded; metadata-only patterns should be used first.',
  },
  {
    id: 'credentials',
    label: 'Connector credentials and secrets',
    category: 'Secrets',
    isSensitiveOrPii: true,
    defaultInScope: false,
    retention: 'Never store in page-local setup records.',
    masking: 'Use protected references through the connector credential abstraction.',
  },
]

export function buildDefaultPilotSetupDraft(operatorEmail = 'operator@scout.local'): PilotSetupDraft {
  const defaultOutcome = pilotOutcomeOptions[0]

  return {
    outcomeId: defaultOutcome.id,
    connectorType: 'mockCrm',
    sourceOwner: operatorEmail,
    purpose: defaultOutcome.purpose,
    scopedFieldIds: scopeFieldOptions
      .filter((field) => field.defaultInScope)
      .map((field) => field.id),
    signOffStatus: 'owner-review',
    retentionNote: 'Keep approved pilot summaries for the pilot window, then review or purge.',
    maskingNote: 'Mask direct identifiers for non-admin views and keep credentials outside setup records.',
  }
}

export function getPilotOutcome(outcomeId: PilotOutcomeId) {
  return pilotOutcomeOptions.find((option) => option.id === outcomeId) ?? pilotOutcomeOptions[0]
}

export function getPilotSourceOption(connectorType: string) {
  return pilotSourceOptions.find((option) => option.connectorType === connectorType) ?? pilotSourceOptions[0]
}

export function buildDataScopeApproval(draft: PilotSetupDraft): DataScopeApproval {
  const scoped = new Set(draft.scopedFieldIds)
  const inScopeFields = scopeFieldOptions.filter((field) => scoped.has(field.id))
  const outOfScopeFields = scopeFieldOptions.filter((field) => !scoped.has(field.id))
  const sensitiveCategoryLabels = Array.from(
    new Set(inScopeFields.filter((field) => field.isSensitiveOrPii).map((field) => field.category)),
  )

  return {
    sourceOwner: draft.sourceOwner.trim(),
    purpose: draft.purpose.trim(),
    inScopeFields,
    outOfScopeFields,
    hasSensitiveOrPiiInScope: sensitiveCategoryLabels.length > 0,
    sensitiveCategoryLabels,
    retentionNote: draft.retentionNote.trim(),
    maskingNote: draft.maskingNote.trim(),
    signOffStatus: draft.signOffStatus,
  }
}

export function buildConnectorValidationInput(
  draft: PilotSetupDraft,
  plugin?: ConnectorPluginDefinition,
): ValidateConnectorConfigurationInput {
  const source = getPilotSourceOption(draft.connectorType)
  const configuration = {
    connectorType: plugin?.connectorType ?? source.connectorType,
    pilotSetupMode: 'operator-assisted',
    ...source.defaultConfiguration,
  }

  return {
    connectorType: plugin?.connectorType ?? source.connectorType,
    kind: source.dataSourceKind,
    configurationJson: prettyJson(configuration),
    credentialsJson: '{}',
  }
}

export function buildLocalDryRunResult(
  draft: PilotSetupDraft,
  entry?: ConnectorCatalogueEntry,
): PilotDryRunResult {
  const source = getPilotSourceOption(draft.connectorType)
  const maturityLabels = entry ? getConnectorMaturityLabels(entry, false) : []

  if (source.dryRunMode === 'private-scope-review' || entry?.isPlaceholder) {
    return {
      status: 'needs-review',
      mode: 'private-scope',
      title: 'Private scope review required',
      checkedAtUtc: new Date().toISOString(),
      messages: [
        'This catalogue entry is not executable in the public Scout repo.',
        'No vendor certification or live vendor access is implied.',
        'A paid pilot would need a customer-approved private connector proof before operational use.',
      ],
    }
  }

  if (source.dryRunMode === 'event-contract') {
    return {
      status: 'passed',
      mode: 'local-simulation',
      title: 'Event contract dry-run simulated',
      checkedAtUtc: new Date().toISOString(),
      messages: [
        'Provider-neutral source-system event shape is available for an approved product usage rollup.',
        'No raw clickstream, prompt, recommendation, or derived relationship intelligence leaves the data plane.',
      ],
    }
  }

  if (source.dryRunMode === 'local-demo-proof') {
    return {
      status: 'passed',
      mode: 'local-simulation',
      title: 'Local demo dry-run recorded',
      checkedAtUtc: new Date().toISOString(),
      messages: [
        'Operator-assisted import proof uses approved rows only.',
        'Production persistence for signed approvals remains a follow-up outside this local setup record.',
      ],
    }
  }

  return {
    status: 'needs-review',
    mode: 'local-simulation',
    title: 'Local connector dry-run simulated',
    checkedAtUtc: new Date().toISOString(),
    messages: [
      'Live connector validation was not available, so the wizard retained a local operator-review result.',
      ...maturityLabels.slice(0, 2).map((label: ConnectorMaturityLabel) => `${label.label}: ${label.detail}`),
    ],
  }
}

export function buildEndpointDryRunResult(
  validation: ConnectorConfigurationValidationResult,
): PilotDryRunResult {
  return {
    status: validation.isValid ? 'passed' : 'blocked',
    mode: 'live-endpoint',
    title: validation.isValid ? 'Connector dry-run passed' : 'Connector dry-run blocked',
    checkedAtUtc: new Date().toISOString(),
    messages: validation.errors.length
      ? validation.errors
      : ['Configuration validation completed through the existing connector endpoint.'],
    validation,
  }
}

export function buildPilotReadinessSummary(
  draft: PilotSetupDraft,
  approval: DataScopeApproval,
  dryRun?: PilotDryRunResult | null,
): PilotReadinessSummary {
  const items: PilotReadinessItem[] = [
    {
      label: 'Pilot outcome',
      status: draft.outcomeId ? 'complete' : 'needs-review',
      detail: getPilotOutcome(draft.outcomeId).successCriteria,
    },
    {
      label: 'Source owner',
      status: approval.sourceOwner ? 'complete' : 'blocked',
      detail: approval.sourceOwner || 'Declare the customer/operator owner before a dry-run.',
    },
    {
      label: 'Data scope',
      status: approval.inScopeFields.length > 0 ? 'complete' : 'blocked',
      detail: `${approval.inScopeFields.length} in scope, ${approval.outOfScopeFields.length} out of scope.`,
    },
    {
      label: 'Scope sign-off',
      status:
        approval.signOffStatus === 'approved-for-dry-run'
          ? 'complete'
          : approval.signOffStatus === 'blocked'
            ? 'blocked'
            : 'needs-review',
      detail: approval.signOffStatus.replaceAll('-', ' '),
    },
    {
      label: 'Connector dry-run',
      status: dryRun?.status === 'passed' ? 'complete' : dryRun?.status === 'blocked' ? 'blocked' : 'needs-review',
      detail: dryRun?.title ?? 'Run or simulate validation before pilot handover.',
    },
  ]

  if (items.some((item) => item.status === 'blocked')) {
    return {
      status: 'blocked',
      label: 'Blocked before pilot handover',
      items,
    }
  }

  if (approval.signOffStatus !== 'approved-for-dry-run') {
    return {
      status: 'needs-scope-signoff',
      label: 'Needs data-scope sign-off',
      items,
    }
  }

  if (!dryRun || dryRun.status !== 'passed') {
    return {
      status: 'needs-dry-run',
      label: 'Needs connector dry-run evidence',
      items,
    }
  }

  return {
    status: 'ready-for-operator-review',
    label: 'Ready for operator review',
    items,
  }
}
