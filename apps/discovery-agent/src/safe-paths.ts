const IGNORE_DIRECTORIES = new Set([
  '.git',
  '.vs',
  '.vscode',
  '.idea',
  '.astro',
  '.demo',
  '.demo-data',
  '.demo-runtime',
  '.dotnet',
  '.next',
  '.turbo',
  '.venv',
  '__pycache__',
  'bin',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'obj',
  'out',
  'playwright-report',
  'support-bundles',
  'target',
  'test-results',
  'vendor',
  'artifacts-private',
  'database-dumps',
  'db-dumps',
  'dumps',
  'exports',
  'private-packages',
  'raw-exports',
])

const SENSITIVE_DIRECTORY_PATTERNS = [
  /(^|[/\\])(?:raw[-_. ]?exports?|customer[-_. ]?exports?|database[-_. ]?dumps?|db[-_. ]?dumps?|dumps?|support[-_. ]?bundles?)([/\\]|$)/i,
]

const SENSITIVE_FILE_PATTERNS = [
  /^\.env(?:\.|$)/i,
  /\.(?:pem|key|pfx|p12|ppk|asc|gpg)$/i,
  /\.lic(?:ence)?(?:\.(?:json|txt|xml))?$/i,
  /(?:^|[-_.])local[-_.]?licen[cs]e(?:[-_.].*)?\.(?:json|txt|xml|lic)$/i,
  /(?:^|[-_.])service[-_.]?account(?:[-_.].*)?\.json$/i,
  /(?:^|[-_.])tokens?(?:[-_.].*)?\.(?:json|txt|yaml|yml|env)$/i,
  /(?:^|[-_.])(?:access|refresh)[-_.]?token(?:[-_.].*)?\.(?:json|txt|yaml|yml|env)$/i,
  /(?:^|[-_.])(?:raw[-_.]?exports?|customer[-_.]?exports?|database[-_.]?dumps?|db[-_.]?dumps?|dumps?|backup|support[-_.]?bundle)(?:[-_.].*)?\.(?:json|csv|tsv|sql|dump|bak|zip|gz|tar|tgz|7z)$/i,
]

export const SAFE_OUTPUT_CONTRACT = [
  'KynticAI Discovery MCP reads local code and approved Discovery Signature metadata only.',
  'It never reads .env files, private keys, local licence files, service-account JSON, token files, dependency folders, build outputs, raw exports, database dumps, or support bundles.',
  'Discovery Signature output uses schema kynticai.discovery-signature.v1 and excludes raw customer data, query output, credentials, tokens, connection strings, raw payloads, source documents, PII, vectors, embeddings, prompt packages, and local logs.',
  'Network handoff is disabled unless an approved endpoint is configured and the operator passes explicit handoff consent.',
]

export function shouldSkipDiscoveryDirectory(name: string, relativePath: string = name): boolean {
  const normalisedName = name.toLowerCase()
  const normalisedPath = normalisePath(relativePath)
  return IGNORE_DIRECTORIES.has(normalisedName) ||
    SENSITIVE_DIRECTORY_PATTERNS.some((pattern) => pattern.test(normalisedPath))
}

export function shouldSkipDiscoveryFile(name: string, relativePath: string = name): boolean {
  const normalisedPath = normalisePath(relativePath)
  return SENSITIVE_FILE_PATTERNS.some((pattern) => pattern.test(name) || pattern.test(normalisedPath)) ||
    SENSITIVE_DIRECTORY_PATTERNS.some((pattern) => pattern.test(normalisedPath))
}

export function assertDiscoveryReadableFile(filePath: string): void {
  assertLocalFilePath(filePath, 'read')
  const normalised = normalisePath(filePath)
  const fileName = normalised.split('/').pop() ?? normalised
  const directories = normalised.split('/').slice(0, -1)
  for (const directory of directories) {
    if (shouldSkipDiscoveryDirectory(directory, normalised)) {
      throw new Error(`Refusing to read '${fileName}' because its path is outside the safe discovery boundary.`)
    }
  }

  if (shouldSkipDiscoveryFile(fileName, normalised)) {
    throw new Error(`Refusing to read '${fileName}' because it is outside the safe discovery boundary.`)
  }
}

export function assertDiscoveryWritableFile(filePath: string): void {
  assertLocalFilePath(filePath, 'write')
  const normalised = normalisePath(filePath)
  const fileName = normalised.split('/').pop() ?? normalised
  const directories = normalised.split('/').slice(0, -1)
  for (const directory of directories) {
    if (shouldSkipDiscoveryDirectory(directory, normalised)) {
      throw new Error(`Refusing to write '${fileName}' because its path is outside the safe discovery boundary.`)
    }
  }

  if (shouldSkipDiscoveryFile(fileName, normalised)) {
    throw new Error(`Refusing to write '${fileName}' because it is outside the safe discovery boundary.`)
  }
}

function assertLocalFilePath(filePath: string, operation: 'read' | 'write'): void {
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(filePath)) {
    throw new Error(`Refusing to ${operation} remote paths because Discovery file paths must be local filesystem paths.`)
  }
}

function normalisePath(value: string): string {
  return value.replace(/\\/g, '/')
}
