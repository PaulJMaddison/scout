import type {
  ConnectorManifest,
  ManifestValidationResult,
  ValidationIssue,
  ValidationErrorCode,
  ValidatorOptions,
} from '@kynticai/scout-connector-validator'
import type {
  AuditReport,
  SampleRecord,
} from '@kynticai/scout-metadata-audit'

/** A sample connector definition supplied to the test harness. */
export interface SampleConnectorDefinition {
  /** Full connector manifest in the public KynticAI Scout format. */
  manifest: ConnectorManifest
  /** Optional sample records for metadata extraction and entity mapping tests. */
  sampleRecords?: SampleRecord[]
  /** Optional fake fetch function simulating a connector run. */
  fakeFetch?: FakeFetchFn
}

/**
 * Simulates a connector fetch for a given external user ID.
 * Returns a normalised payload object or throws on failure.
 */
export type FakeFetchFn = (externalUserId: string) => Record<string, unknown> | Promise<Record<string, unknown>>

/** Options for the test harness runner. */
export interface TestHarnessOptions {
  /** Known connector IDs to check for duplicates. */
  knownConnectorIds?: string[]
  /** External user IDs to test against the fake fetch function. */
  fetchTestUserIds?: string[]
  /** External user ID expected to trigger an error from the fake fetch. */
  errorTestUserId?: string
}

/** A single test case result. */
export interface TestCaseResult {
  name: string
  suite: TestSuite
  passed: boolean
  message: string
}

/** Test suite categories. */
export type TestSuite =
  | 'manifest-shape'
  | 'structured-issues'
  | 'metadata-extraction'
  | 'entity-mapping'
  | 'error-handling'
  | 'unsafe-fields'
  | 'auth-config'

/** Full test harness report. */
export interface TestHarnessReport {
  connectorId: string
  displayName: string
  ranAtUtc: string
  passed: boolean
  totalTests: number
  passedTests: number
  failedTests: number
  results: TestCaseResult[]
  manifestValidation: ManifestValidationResult
  auditReport: AuditReport | null
}

export type { ConnectorManifest, ManifestValidationResult, ValidationIssue, ValidationErrorCode, ValidatorOptions }
export type { AuditReport, SampleRecord }
