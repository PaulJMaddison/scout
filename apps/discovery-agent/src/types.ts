export type AuditTier = 1 | 2 | 3

export interface AuditOptions {
  path: string
  tier: AuditTier
  maxFiles?: number
  maxFileBytes?: number
}

export interface FileSummary {
  path: string
  extension: string
  bytes: number
}

export interface PackageInventory {
  path: string
  ecosystem: 'node' | 'dotnet' | 'rust' | 'python' | 'java' | 'go' | 'other'
  name?: string
  version?: string
  targetFrameworks?: string[]
  scripts?: Record<string, string>
  dependencies: string[]
}

export interface TechStackSummary {
  languages: string[]
  frameworks: string[]
  databases: string[]
  packageManagers: string[]
}

export interface EntryPoint {
  file: string
  type: 'api' | 'cli' | 'worker' | 'web' | 'library' | 'container' | 'config'
  description: string
}

export interface Tier1QuickScan {
  projectName: string
  rootPath: string
  fileCount: number
  directoryCount: number
  scannedFileCount: number
  skippedFileCount: number
  fileTree: string[]
  languageBreakdown: Record<string, number>
  packages: PackageInventory[]
  techStack: TechStackSummary
  entryPoints: EntryPoint[]
}

export interface ApiEndpoint {
  method: string
  path: string
  file: string
  auth: string
  description?: string
}

export interface TypeSignature {
  name: string
  kind: 'class' | 'interface' | 'record' | 'type' | 'function' | 'enum'
  file: string
  signature: string
}

export interface SchemaObject {
  name: string
  type: 'table' | 'dbset' | 'json-schema' | 'migration' | 'graphql'
  file: string
  description: string
}

export interface Tier2SemanticIndex {
  endpoints: ApiEndpoint[]
  types: TypeSignature[]
  schemas: SchemaObject[]
  entryPoints: EntryPoint[]
  keyBusinessLogicPatterns: string[]
}

export interface DataFlow {
  name: string
  sources: string[]
  processors: string[]
  sinks: string[]
  evidence: string[]
}

export interface SecurityFinding {
  area: string
  files: string[]
  notes: string[]
}

export interface CouplingHotspot {
  module: string
  inboundReferences: number
  outboundReferences: number
  files: string[]
}

export interface TechDebtScore {
  overall: number
  documentation: number
  testCoverage: number
  maintainability: number
  dependencyRisk: number
  findings: string[]
}

export interface Tier3GovernanceReport {
  dataFlows: DataFlow[]
  securitySurface: SecurityFinding[]
  coupling: CouplingHotspot[]
  techDebtScore: TechDebtScore
}

export interface DiscoveryAudit {
  projectName: string
  auditDate: string
  tier: AuditTier
  rootPath: string
  tier1: Tier1QuickScan
  tier2?: Tier2SemanticIndex
  tier3?: Tier3GovernanceReport
}

export interface HandoverDocument {
  project_name: string
  audit_date: string
  tech_stack: TechStackSummary
  entry_points: EntryPoint[]
  api_surface: ApiEndpoint[]
  key_entities: Array<{ name: string; file: string; description: string }>
  data_stores: Array<{ type: string; purpose: string }>
  security_surface: string[]
  governance_report?: Tier3GovernanceReport
  recommended_next_agent_prompt: string
}

export interface HandoverOutput {
  json: HandoverDocument
  markdown: string
}

export interface DiscoveryStatus {
  state: 'idle' | 'running' | 'complete' | 'failed'
  lastRunStartedAtUtc?: string
  lastRunCompletedAtUtc?: string
  lastPath?: string
  highestTierCompleted?: AuditTier
  error?: string
}
