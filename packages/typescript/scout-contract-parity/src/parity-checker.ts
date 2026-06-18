import type {
  ContractParityInput,
  ContractParityReport,
  EnumShape,
  FieldShape,
  IssueCategory,
  ManifestFixture,
  ModelShape,
  ParityIssue,
  ParityIssueGroup,
} from './types.js'

const CATEGORY_DETAILS: Record<IssueCategory, { title: string, action: string, order: number }> = {
  'sdk-request-contract': {
    title: 'SDK request contract gaps',
    action: 'Decide whether the SDK should expose these request/input models directly, or keep a convenience method that maps to them.',
    order: 10,
  },
  'sdk-result-contract': {
    title: 'SDK result contract gaps',
    action: 'Add matching SDK result models for public responses, or document why the endpoint is intentionally not SDK-facing.',
    order: 20,
  },
  'rest-transport-contract': {
    title: 'REST transport DTO gaps',
    action: 'Keep REST wrapper/error DTOs transport-only or map them to existing SDK request and problem-detail shapes.',
    order: 30,
  },
  'connector-authoring-contract': {
    title: 'Connector authoring contract gaps',
    action: 'Align SDK and validator support for connector authoring surfaces that public connector authors can consume.',
    order: 40,
  },
  'admin-governance-contract': {
    title: 'Admin and governance contract gaps',
    action: 'Review whether admin, governance, SaaS, blueprint, and agent-run contracts should remain console/API-only or become SDK models.',
    order: 50,
  },
  'score-api-contract': {
    title: 'Score API contract gaps',
    action: 'Keep schema/kyntic-score.openapi.yaml and the TypeScript score client/types aligned for all public score surfaces.',
    order: 55,
  },
  'contract-parity': {
    title: 'Contract parity findings',
    action: 'Review the reported source and target contract before changing public API or SDK shapes.',
    order: 60,
  },
}

const TARGET_REFERENCES: Record<string, string> = {
  'dotnet-sdk': 'src/KynticAI.Scout.Sdk/KynticAI.ScoutModels.cs',
  'typescript-sdk': 'packages/typescript/scout-sdk/src/types.ts',
  'connector-manifest': 'packages/typescript/scout-connector-validator/src/types.ts',
}

export function runParityCheck(input: ContractParityInput, checkedAtUtc = '2026-01-01T00:00:00.000Z'): ContractParityReport {
  const issues: ParityIssue[] = []
  let modelsCompared = 0
  let enumsCompared = 0

  for (const apiModel of [...input.restModels, ...input.graphQlModels]) {
    const dotnetSdkModel = findMatchingModel(apiModel, input.dotnetSdkModels)
    const typescriptSdkModel = findMatchingModel(apiModel, input.typescriptSdkModels)

    if (dotnetSdkModel) {
      modelsCompared++
      issues.push(...compareModels(apiModel, dotnetSdkModel))
    } else if (isSdkFacing(apiModel.name)) {
      issues.push(missingModelIssue(apiModel, 'dotnet-sdk'))
    }

    if (typescriptSdkModel) {
      modelsCompared++
      issues.push(...compareModels(apiModel, typescriptSdkModel))
    } else if (isSdkFacing(apiModel.name)) {
      issues.push(missingModelIssue(apiModel, 'typescript-sdk'))
    }
  }

  for (const apiEnum of input.apiEnums) {
    const dotnetSdkEnum = findByCanonicalName(apiEnum, input.dotnetSdkEnums)
    const typescriptSdkEnum = findByCanonicalName(apiEnum, input.typescriptSdkEnums)

    if (dotnetSdkEnum) {
      enumsCompared++
      issues.push(...compareEnums(apiEnum, dotnetSdkEnum))
    }

    if (typescriptSdkEnum) {
      enumsCompared++
      issues.push(...compareEnums(apiEnum, typescriptSdkEnum))
    }
  }

  for (const manifest of input.manifests ?? []) {
    issues.push(...checkManifest(manifest, input.connectorManifest))
  }
  issues.push(...checkConnectorAuthoringSurface(input))
  issues.push(...checkScoreApiSurface(input))

  const sortedIssues = sortIssues(issues)
  const errorCount = sortedIssues.filter((issue) => issue.severity === 'error').length
  const warningCount = sortedIssues.length - errorCount

  return {
    isValid: errorCount === 0,
    checkedAtUtc,
    summary: {
      modelsCompared,
      enumsCompared,
      manifestsChecked: input.manifests?.length ?? 0,
      issueCount: issues.length,
      errorCount,
      warningCount,
    },
    issues: sortedIssues,
    warningGroups: groupWarnings(sortedIssues),
  }
}

function compareModels(source: ModelShape, target: ModelShape): ParityIssue[] {
  const issues: ParityIssue[] = []
  const sourceFields = new Map(source.fields.map((field) => [field.name, field]))
  const targetFields = new Map(target.fields.map((field) => [field.name, field]))
  const missing = [...sourceFields.values()].filter((field) => !targetFields.has(field.name))
  const extra = [...targetFields.values()].filter((field) => !sourceFields.has(field.name))
  const usedExtra = new Set<string>()

  for (const sourceField of missing) {
    const rename = findLikelyRename(sourceField, extra.filter((field) => !usedExtra.has(field.name)))
    if (rename) {
      usedExtra.add(rename.name)
      issues.push({
        kind: 'renamed-field',
        severity: 'error',
        category: 'contract-parity',
        source: source.surface,
        target: target.surface,
        model: source.name,
        field: sourceField.name,
        ...referenceFields(source.sourceFile, target.sourceFile ?? TARGET_REFERENCES[target.surface]),
        message: `${target.surface} ${target.name} appears to rename '${sourceField.name}' to '${rename.name}'.`,
      })
    } else {
      issues.push({
        kind: 'missing-field',
        severity: 'error',
        category: 'contract-parity',
        source: source.surface,
        target: target.surface,
        model: source.name,
        field: sourceField.name,
        ...referenceFields(source.sourceFile, target.sourceFile ?? TARGET_REFERENCES[target.surface]),
        message: `${target.surface} ${target.name} is missing field '${sourceField.name}' from ${source.surface} ${source.name}.`,
      })
    }
  }

  return issues
}

function compareEnums(source: EnumShape, target: EnumShape): ParityIssue[] {
  const expected = [...new Set(source.values)].sort()
  const actual = [...new Set(target.values)].sort()
  if (expected.join('\0') === actual.join('\0')) return []

  return [{
    kind: 'enum-mismatch',
    severity: 'error',
    category: 'contract-parity',
    source: source.surface,
    target: target.surface,
    model: source.name,
    expected,
    actual,
    ...referenceFields(source.sourceFile, target.sourceFile ?? TARGET_REFERENCES[target.surface]),
    message: `${target.surface} ${target.name} enum values differ from ${source.surface} ${source.name}.`,
  }]
}

function checkManifest(
  manifest: ManifestFixture,
  supported: ContractParityInput['connectorManifest'],
): ParityIssue[] {
  const issues: ParityIssue[] = []
  const allowedFields = new Set(supported.allowedFields)
  const allowedSourceTypes = new Set(supported.sourceTypes)
  const allowedCapabilities = new Set(supported.capabilities)

  for (const field of manifest.fields ?? []) {
    if (!allowedFields.has(field)) {
      issues.push({
        kind: 'unsupported-manifest-feature',
        severity: 'error',
        category: 'connector-authoring-contract',
        source: 'connector-manifest',
        target: 'connector-manifest',
        model: manifest.name,
        field,
        ...referenceFields(manifest.sourceFile, 'packages/typescript/scout-connector-validator/src/types.ts'),
        message: `Connector manifest '${manifest.name}' uses unsupported field '${field}'.`,
      })
    }
  }

  for (const sourceType of manifest.supportedSourceTypes ?? []) {
    if (!allowedSourceTypes.has(sourceType)) {
      issues.push({
        kind: 'unsupported-manifest-feature',
        severity: 'error',
        category: 'connector-authoring-contract',
        source: 'connector-manifest',
        target: 'connector-manifest',
        model: manifest.name,
        field: 'supportedSourceTypes',
        ...referenceFields(manifest.sourceFile, 'packages/typescript/scout-connector-validator/src/schema.ts'),
        message: `Connector manifest '${manifest.name}' declares unsupported source type '${sourceType}'.`,
      })
    }
  }

  for (const capability of manifest.capabilities ?? []) {
    if (!allowedCapabilities.has(capability)) {
      issues.push({
        kind: 'unsupported-manifest-feature',
        severity: 'error',
        category: 'connector-authoring-contract',
        source: 'connector-manifest',
        target: 'connector-manifest',
        model: manifest.name,
        field: 'capabilities',
        ...referenceFields(manifest.sourceFile, 'packages/typescript/scout-connector-validator/src/schema.ts'),
        message: `Connector manifest '${manifest.name}' declares unsupported capability '${capability}'.`,
      })
    }
  }

  return issues
}

function checkConnectorAuthoringSurface(input: ContractParityInput): ParityIssue[] {
  const issues: ParityIssue[] = []
  const dataSourceKind = input.apiEnums.find((shape) => shape.name === 'DataSourceKind')
  if (dataSourceKind !== undefined) {
    issues.push(...compareEnumToManifestSet(
      dataSourceKind,
      input.connectorManifest.sourceTypes,
      'supportedSourceTypes',
      'Public connector manifest source types must match the public DataSourceKind enum.',
      'packages/typescript/scout-connector-validator/src/schema.ts',
    ))
  }

  const connectorCapability = input.apiEnums.find((shape) => shape.name === 'ConnectorCapability')
  if (connectorCapability !== undefined) {
    issues.push(...compareEnumToManifestSet(
      connectorCapability,
      input.connectorManifest.capabilities,
      'capabilities',
      'Public connector manifest capabilities must match the public ConnectorCapability enum.',
      'packages/typescript/scout-connector-validator/src/schema.ts',
    ))
  }

  return issues
}

function checkScoreApiSurface(input: ContractParityInput): ParityIssue[] {
  if (input.scoreApi === undefined) return []

  const issues: ParityIssue[] = []
  const expectedPaths = [
    '/v1/scores/investment',
    '/v1/scores/credit',
    '/v1/scores/job',
  ]
  const expectedSchemas = [
    'InvestmentScoreRequest',
    'CreditScoreRequest',
    'JobScoreRequest',
    'InvestmentScore',
    'CreditScore',
    'JobScore',
    'ConfidenceInterval',
    'ScoreEvidencePoint',
    'ScoreRiskFlag',
  ]
  const sdkModels = new Set(input.typescriptSdkModels.map((model) => model.name))

  for (const scorePath of expectedPaths) {
    if (!input.scoreApi.paths.includes(scorePath)) {
      issues.push(scoreIssue(
        'path',
        scorePath,
        `Score OpenAPI contract is missing path '${scorePath}'.`,
        input.scoreApi.sourceFile,
        'packages/typescript/scout-sdk/src/score-client.ts',
      ))
    }
    if (!input.scoreApi.sdkClientPaths.includes(scorePath)) {
      issues.push(scoreIssue(
        'path',
        scorePath,
        `TypeScript score client does not call '${scorePath}'.`,
        'packages/typescript/scout-sdk/src/score-client.ts',
        input.scoreApi.sourceFile,
      ))
    }
  }

  for (const schema of expectedSchemas) {
    if (!input.scoreApi.schemas.includes(schema)) {
      issues.push(scoreIssue(
        'schema',
        schema,
        `Score OpenAPI contract is missing schema '${schema}'.`,
        input.scoreApi.sourceFile,
        'packages/typescript/scout-sdk/src/types.ts',
      ))
    }

    if (!sdkModels.has(schema)) {
      issues.push(scoreIssue(
        'schema',
        schema,
        `TypeScript SDK is missing exported score model '${schema}'.`,
        'packages/typescript/scout-sdk/src/types.ts',
        input.scoreApi.sourceFile,
      ))
    }
  }

  return issues
}

function scoreIssue(
  field: string,
  model: string,
  message: string,
  sourceReference: string,
  targetReference: string,
): ParityIssue {
  return {
    kind: 'missing-score-contract',
    severity: 'error',
    category: 'score-api-contract',
    source: 'score-openapi',
    target: 'typescript-sdk',
    model,
    field,
    sourceReference,
    targetReference,
    message,
  }
}

function compareEnumToManifestSet(
  source: EnumShape,
  manifestValues: string[],
  field: string,
  messagePrefix: string,
  targetReference: string,
): ParityIssue[] {
  const expected = [...new Set(source.values)].sort()
  const actual = [...new Set(manifestValues)].sort()
  if (expected.join('\0') === actual.join('\0')) return []

  return [{
    kind: 'enum-mismatch',
    severity: 'error',
    category: 'connector-authoring-contract',
    source: source.surface,
    target: 'connector-manifest',
    model: source.name,
    field,
    expected,
    actual,
    ...referenceFields(source.sourceFile, targetReference),
    message: `${messagePrefix} Expected ${expected.join(', ')}; manifest allows ${actual.join(', ')}.`,
  }]
}

function findLikelyRename(sourceField: FieldShape, candidates: FieldShape[]): FieldShape | undefined {
  let best: { field: FieldShape, score: number } | undefined
  for (const candidate of candidates) {
    if (normaliseType(candidate.type) !== normaliseType(sourceField.type)) continue
    const score = similarity(sourceField.name, candidate.name)
    if (score >= 0.55 && (best === undefined || score > best.score)) {
      best = { field: candidate, score }
    }
  }

  return best?.field
}

function findMatchingModel(model: ModelShape, models: ModelShape[]): ModelShape | undefined {
  return findByCanonicalName(model, models)
}

function findByCanonicalName<T extends { name: string }>(shape: T, shapes: T[]): T | undefined {
  const canonical = canonicalName(shape.name)
  return shapes.find((candidate) => canonicalName(candidate.name) === canonical)
}

function canonicalName(name: string): string {
  let value = name
  if (value.startsWith('V1')) value = value.slice(2)
  return value.toLowerCase()
}

function isSdkFacing(name: string): boolean {
  return !name.includes('ApiClient') && !name.includes('WebhookSigningSecret') && !name.includes('OperatorAccount')
}

function missingModelIssue(source: ModelShape, target: string): ParityIssue {
  return {
    kind: 'missing-model',
    severity: 'warning',
    category: classifyMissingModel(source.name),
    source: source.surface,
    target,
    model: source.name,
    ...referenceFields(source.sourceFile, TARGET_REFERENCES[target]),
    message: `${target} has no matching model for ${source.surface} ${source.name}.`,
  }
}

function referenceFields(sourceReference?: string, targetReference?: string): Pick<ParityIssue, 'sourceReference' | 'targetReference'> {
  return {
    ...(sourceReference ? { sourceReference } : {}),
    ...(targetReference ? { targetReference } : {}),
  }
}

function classifyMissingModel(name: string): IssueCategory {
  if (name.startsWith('V1') || name.endsWith('RestRequest') || name === 'RecomputeUserContextRequest' || name === 'SalesContextPackageRequest') {
    return 'rest-transport-contract'
  }

  if (name.includes('Connector') || name.includes('DataSource') || name === 'SourceSystemEventRequest') {
    return 'connector-authoring-contract'
  }

  if (/(Governance|Operator|Organisation|Saas|Blueprint|PromptTemplate|AgentRun|AuditEventExport)/.test(name)) {
    return 'admin-governance-contract'
  }

  if (name.endsWith('Input') || name.endsWith('Request')) {
    return 'sdk-request-contract'
  }

  if (name.endsWith('Result') || name.endsWith('Summary') || name.endsWith('Event')) {
    return 'sdk-result-contract'
  }

  return 'contract-parity'
}

function similarity(left: string, right: string): number {
  const a = left.toLowerCase()
  const b = right.toLowerCase()
  const distance = levenshtein(a, b)
  return 1 - distance / Math.max(a.length, b.length, 1)
}

function levenshtein(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, i) => i)
  for (let i = 1; i <= left.length; i++) {
    const current = [i]
    for (let j = 1; j <= right.length; j++) {
      current[j] = Math.min(
        (current[j - 1] ?? 0) + 1,
        (previous[j] ?? 0) + 1,
        (previous[j - 1] ?? 0) + (left[i - 1] === right[j - 1] ? 0 : 1),
      )
    }
    previous.splice(0, previous.length, ...current)
  }
  return previous[right.length] ?? 0
}

function normaliseType(type: string): string {
  const value = type.toLowerCase()
  if (value.includes('guid')) return 'string'
  if (value.includes('datetime')) return 'string'
  if (value.includes('decimal') || value.includes('int') || value.includes('number')) return 'number'
  if (value.includes('bool')) return 'boolean'
  return value.replace(/[?[\]\s]/g, '')
}

function sortIssues(issues: ParityIssue[]): ParityIssue[] {
  return [...issues].sort((a, b) =>
    `${a.severity}:${a.category}:${a.kind}:${a.model ?? ''}:${a.field ?? ''}:${a.target}`.localeCompare(
      `${b.severity}:${b.category}:${b.kind}:${b.model ?? ''}:${b.field ?? ''}:${b.target}`,
    ),
  )
}

function groupWarnings(issues: ParityIssue[]): ParityIssueGroup[] {
  const groups = new Map<IssueCategory, ParityIssue[]>()
  for (const issue of issues) {
    if (issue.severity !== 'warning') continue
    const existing = groups.get(issue.category) ?? []
    existing.push(issue)
    groups.set(issue.category, existing)
  }

  return [...groups.entries()]
    .map(([category, categoryIssues]) => ({
      category,
      title: CATEGORY_DETAILS[category].title,
      action: CATEGORY_DETAILS[category].action,
      issues: categoryIssues,
    }))
    .sort((a, b) => CATEGORY_DETAILS[a.category].order - CATEGORY_DETAILS[b.category].order)
}
