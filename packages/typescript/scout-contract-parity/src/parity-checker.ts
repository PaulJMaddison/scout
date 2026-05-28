import type {
  ContractParityInput,
  ContractParityReport,
  EnumShape,
  FieldShape,
  ManifestFixture,
  ModelShape,
  ParityIssue,
} from './types.js'

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

  const errorCount = issues.filter((issue) => issue.severity === 'error').length
  const warningCount = issues.length - errorCount

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
    issues: sortIssues(issues),
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
        source: source.surface,
        target: target.surface,
        model: source.name,
        field: sourceField.name,
        message: `${target.surface} ${target.name} appears to rename '${sourceField.name}' to '${rename.name}'.`,
      })
    } else {
      issues.push({
        kind: 'missing-field',
        severity: 'error',
        source: source.surface,
        target: target.surface,
        model: source.name,
        field: sourceField.name,
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
    source: source.surface,
    target: target.surface,
    model: source.name,
    expected,
    actual,
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
        source: 'connector-manifest',
        target: 'connector-manifest',
        model: manifest.name,
        field,
        message: `Connector manifest '${manifest.name}' uses unsupported field '${field}'.`,
      })
    }
  }

  for (const sourceType of manifest.supportedSourceTypes ?? []) {
    if (!allowedSourceTypes.has(sourceType)) {
      issues.push({
        kind: 'unsupported-manifest-feature',
        severity: 'error',
        source: 'connector-manifest',
        target: 'connector-manifest',
        model: manifest.name,
        field: 'supportedSourceTypes',
        message: `Connector manifest '${manifest.name}' declares unsupported source type '${sourceType}'.`,
      })
    }
  }

  for (const capability of manifest.capabilities ?? []) {
    if (!allowedCapabilities.has(capability)) {
      issues.push({
        kind: 'unsupported-manifest-feature',
        severity: 'error',
        source: 'connector-manifest',
        target: 'connector-manifest',
        model: manifest.name,
        field: 'capabilities',
        message: `Connector manifest '${manifest.name}' declares unsupported capability '${capability}'.`,
      })
    }
  }

  return issues
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
    source: source.surface,
    target,
    model: source.name,
    message: `${target} has no matching model for ${source.surface} ${source.name}.`,
  }
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
    `${a.severity}:${a.kind}:${a.model ?? ''}:${a.field ?? ''}`.localeCompare(
      `${b.severity}:${b.kind}:${b.model ?? ''}:${b.field ?? ''}`,
    ),
  )
}
