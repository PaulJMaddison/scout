export type ContractSurface = 'rest' | 'graphql' | 'dotnet-sdk' | 'typescript-sdk' | 'connector-manifest'

export interface FieldShape {
  name: string
  type: string
  optional?: boolean
}

export interface ModelShape {
  name: string
  surface: ContractSurface
  fields: FieldShape[]
  sourceFile?: string
}

export interface EnumShape {
  name: string
  surface: ContractSurface
  values: string[]
  sourceFile?: string
}

export interface ConnectorManifestShape {
  allowedFields: string[]
  sourceTypes: string[]
  capabilities: string[]
}

export interface ManifestFixture {
  name: string
  fields?: string[]
  supportedSourceTypes?: string[]
  capabilities?: string[]
  sourceFile?: string
}

export interface ContractParityInput {
  restModels: ModelShape[]
  graphQlModels: ModelShape[]
  dotnetSdkModels: ModelShape[]
  typescriptSdkModels: ModelShape[]
  apiEnums: EnumShape[]
  dotnetSdkEnums: EnumShape[]
  typescriptSdkEnums: EnumShape[]
  connectorManifest: ConnectorManifestShape
  manifests?: ManifestFixture[]
}

export type IssueKind =
  | 'missing-field'
  | 'renamed-field'
  | 'enum-mismatch'
  | 'unsupported-manifest-feature'
  | 'missing-model'
  | 'missing-enum'

export type IssueCategory =
  | 'sdk-request-contract'
  | 'sdk-result-contract'
  | 'rest-transport-contract'
  | 'connector-authoring-contract'
  | 'admin-governance-contract'
  | 'contract-parity'

export interface ParityIssue {
  kind: IssueKind
  severity: 'error' | 'warning'
  category: IssueCategory
  source: string
  target: string
  model?: string
  field?: string
  expected?: string[]
  actual?: string[]
  sourceReference?: string
  targetReference?: string
  message: string
}

export interface ParityIssueGroup {
  category: IssueCategory
  title: string
  action: string
  issues: ParityIssue[]
}

export interface ContractParityReport {
  isValid: boolean
  checkedAtUtc: string
  summary: {
    modelsCompared: number
    enumsCompared: number
    manifestsChecked: number
    issueCount: number
    errorCount: number
    warningCount: number
  }
  issues: ParityIssue[]
  warningGroups: ParityIssueGroup[]
}
