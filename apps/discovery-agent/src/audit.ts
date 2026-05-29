import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import type {
  ApiEndpoint,
  AuditOptions,
  AuditTier,
  CouplingHotspot,
  DataFlow,
  DiscoveryAudit,
  EntryPoint,
  FileSummary,
  PackageInventory,
  SchemaObject,
  SecurityFinding,
  TechDebtScore,
  TechStackSummary,
  Tier1QuickScan,
  Tier2SemanticIndex,
  Tier3GovernanceReport,
  TypeSignature,
} from './types.js'

const DEFAULT_MAX_FILES = 6000
const DEFAULT_MAX_FILE_BYTES = 384 * 1024
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
  'bin',
  'obj',
  'coverage',
  'dist',
  'node_modules',
  'out',
  'playwright-report',
  'support-bundles',
  'test-results',
  'artifacts-private',
  'private-packages',
])

const SECRET_FILE_PATTERNS = [
  /^\.env/i,
  /\.pem$/i,
  /\.key$/i,
  /\.pfx$/i,
  /\.p12$/i,
  /\.lic(?:ence)?(?:\.json)?$/i,
]

const TEXT_EXTENSIONS = new Set([
  '.cs',
  '.csproj',
  '.fs',
  '.go',
  '.graphql',
  '.java',
  '.js',
  '.json',
  '.jsx',
  '.kt',
  '.md',
  '.mjs',
  '.py',
  '.rs',
  '.sql',
  '.sln',
  '.slnx',
  '.toml',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
])

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  '.cs': 'C#',
  '.fs': 'F#',
  '.go': 'Go',
  '.java': 'Java',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript React',
  '.kt': 'Kotlin',
  '.mjs': 'JavaScript',
  '.py': 'Python',
  '.rs': 'Rust',
  '.sql': 'SQL',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript React',
}

export async function auditCodebase(options: AuditOptions): Promise<DiscoveryAudit> {
  const rootPath = path.resolve(options.path)
  const auditDate = new Date().toISOString()
  const files = await collectFiles(rootPath, options.maxFiles ?? DEFAULT_MAX_FILES)
  const texts = await readTextFiles(rootPath, files, options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES)
  const tier1 = await runTier1(rootPath, files, texts)
  const result: DiscoveryAudit = {
    projectName: tier1.projectName,
    auditDate,
    tier: options.tier,
    rootPath,
    tier1,
  }

  if (options.tier >= 2) {
    result.tier2 = runTier2(texts, tier1)
  }

  if (options.tier >= 3) {
    const tier2 = result.tier2 ?? runTier2(texts, tier1)
    result.tier2 = tier2
    result.tier3 = runTier3(texts, tier1, tier2)
  }

  return result
}

export async function runThreeTierAudit(rootPath: string): Promise<DiscoveryAudit> {
  return auditCodebase({ path: rootPath, tier: 3 })
}

async function collectFiles(rootPath: string, maxFiles: number): Promise<FileSummary[]> {
  const files: FileSummary[] = []
  let stopped = false

  async function visit(directory: string): Promise<void> {
    if (stopped) return
    let entries
    try {
      entries = await readdir(directory, { withFileTypes: true })
    } catch {
      return
    }

    entries.sort((left, right) => left.name.localeCompare(right.name))
    for (const entry of entries) {
      if (stopped) return
      const absolute = path.join(directory, entry.name)
      const relative = toRelative(rootPath, absolute)
      if (entry.isDirectory()) {
        if (!IGNORE_DIRECTORIES.has(entry.name)) {
          await visit(absolute)
        }
        continue
      }

      if (!entry.isFile() || SECRET_FILE_PATTERNS.some((pattern) => pattern.test(entry.name))) {
        continue
      }

      let info
      try {
        info = await stat(absolute)
      } catch {
        continue
      }

      files.push({
        path: relative,
        extension: path.extname(entry.name).toLowerCase(),
        bytes: info.size,
      })

      if (files.length >= maxFiles) {
        stopped = true
        return
      }
    }
  }

  await visit(rootPath)
  return files
}

async function readTextFiles(
  rootPath: string,
  files: FileSummary[],
  maxFileBytes: number,
): Promise<Map<string, string>> {
  const texts = new Map<string, string>()
  for (const file of files) {
    if (file.bytes > maxFileBytes || !TEXT_EXTENSIONS.has(file.extension)) {
      continue
    }

    try {
      texts.set(file.path, await readFile(path.join(rootPath, file.path), 'utf-8'))
    } catch {
      // Binary or locked files are ignored; the audit remains deterministic and local.
    }
  }

  return texts
}

async function runTier1(
  rootPath: string,
  files: FileSummary[],
  texts: Map<string, string>,
): Promise<Tier1QuickScan> {
  const packages = readPackageInventory(texts)
  const projectName = inferProjectName(rootPath, packages, texts)
  const languageBreakdown = buildLanguageBreakdown(files)
  const techStack = inferTechStack(languageBreakdown, packages, texts)
  const entryPoints = inferEntryPoints(texts, packages)
  const directoryCount = new Set(files.map((file) => path.dirname(file.path)).filter((dir) => dir !== '.')).size

  return {
    projectName,
    rootPath,
    fileCount: files.length,
    directoryCount,
    scannedFileCount: texts.size,
    skippedFileCount: Math.max(0, files.length - texts.size),
    fileTree: files.slice(0, 250).map((file) => file.path),
    languageBreakdown,
    packages,
    techStack,
    entryPoints,
  }
}

function runTier2(texts: Map<string, string>, tier1: Tier1QuickScan): Tier2SemanticIndex {
  const endpoints = findApiEndpoints(texts)
  const types = findTypeSignatures(texts)
  const schemas = findSchemas(texts)
  const keyBusinessLogicPatterns = findBusinessLogicPatterns(texts)

  return {
    endpoints,
    types,
    schemas,
    entryPoints: tier1.entryPoints,
    keyBusinessLogicPatterns,
  }
}

function runTier3(
  texts: Map<string, string>,
  tier1: Tier1QuickScan,
  tier2: Tier2SemanticIndex,
): Tier3GovernanceReport {
  return {
    dataFlows: inferDataFlows(tier1, tier2),
    securitySurface: findSecuritySurface(texts),
    coupling: findCoupling(texts),
    techDebtScore: scoreTechDebt(texts, tier1, tier2),
  }
}

function readPackageInventory(texts: Map<string, string>): PackageInventory[] {
  const packages: PackageInventory[] = []

  for (const [file, text] of texts) {
    const name = path.basename(file).toLowerCase()
    if (name === 'package.json') {
      packages.push(readNodePackage(file, text))
    } else if (name.endsWith('.csproj')) {
      packages.push(readDotnetPackage(file, text))
    } else if (name === 'cargo.toml') {
      packages.push(readRustPackage(file, text))
    } else if (name === 'pyproject.toml') {
      packages.push(readPythonPackage(file, text))
    } else if (name === 'go.mod') {
      packages.push(readGoPackage(file, text))
    }
  }

  return packages.sort((left, right) => left.path.localeCompare(right.path))
}

function readNodePackage(file: string, text: string): PackageInventory {
  try {
    const json = JSON.parse(text) as {
      name?: string
      version?: string
      scripts?: Record<string, string>
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    return {
      path: file,
      ecosystem: 'node',
      name: json.name,
      version: json.version,
      scripts: json.scripts,
      dependencies: [
        ...Object.keys(json.dependencies ?? {}),
        ...Object.keys(json.devDependencies ?? {}),
      ].sort(),
    }
  } catch {
    return { path: file, ecosystem: 'node', dependencies: [] }
  }
}

function readDotnetPackage(file: string, text: string): PackageInventory {
  const dependencies = [...text.matchAll(/<PackageReference\s+Include="([^"]+)"/g)].map((match) => match[1] ?? '')
  const targetFrameworks = [
    ...text.matchAll(/<TargetFrameworks?>([^<]+)<\/TargetFrameworks?>/g),
  ].flatMap((match) => (match[1] ?? '').split(';').map((value) => value.trim()).filter(Boolean))
  return {
    path: file,
    ecosystem: 'dotnet',
    name: path.basename(file, '.csproj'),
    targetFrameworks,
    dependencies: dependencies.sort(),
  }
}

function readRustPackage(file: string, text: string): PackageInventory {
  const name = text.match(/^\s*name\s*=\s*"([^"]+)"/m)?.[1]
  const version = text.match(/^\s*version\s*=\s*"([^"]+)"/m)?.[1]
  const dependencies = [...text.matchAll(/^\s*([A-Za-z0-9_-]+)\s*=\s*(?:"|\{)/gm)]
    .map((match) => match[1] ?? '')
    .filter((value) => !['name', 'version', 'edition'].includes(value))
  return { path: file, ecosystem: 'rust', name, version, dependencies: [...new Set(dependencies)].sort() }
}

function readPythonPackage(file: string, text: string): PackageInventory {
  const name = text.match(/^\s*name\s*=\s*"([^"]+)"/m)?.[1]
  const version = text.match(/^\s*version\s*=\s*"([^"]+)"/m)?.[1]
  const dependencies = [...text.matchAll(/"([A-Za-z0-9_.-]+)(?:[<>=!~ ].*)?"/g)].map((match) => match[1] ?? '')
  return { path: file, ecosystem: 'python', name, version, dependencies: [...new Set(dependencies)].sort() }
}

function readGoPackage(file: string, text: string): PackageInventory {
  const name = text.match(/^module\s+(.+)$/m)?.[1]?.trim()
  const dependencies = [...text.matchAll(/^\s*([A-Za-z0-9_.\/-]+)\s+v[0-9]/gm)].map((match) => match[1] ?? '')
  return { path: file, ecosystem: 'go', name, dependencies: [...new Set(dependencies)].sort() }
}

function inferProjectName(rootPath: string, packages: PackageInventory[], texts: Map<string, string>): string {
  const solution = [...texts.keys()].find((file) => path.dirname(file) === '.' && (file.endsWith('.slnx') || file.endsWith('.sln')))
  if (solution !== undefined) {
    return path.basename(solution, path.extname(solution))
  }

  const rootPackage = packages.find((item) => path.dirname(item.path) === '.')
  return rootPackage?.name ?? packages[0]?.name ?? path.basename(rootPath)
}

function buildLanguageBreakdown(files: FileSummary[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const file of files) {
    const language = LANGUAGE_BY_EXTENSION[file.extension]
    if (language !== undefined) {
      result[language] = (result[language] ?? 0) + 1
    }
  }

  return Object.fromEntries(Object.entries(result).sort((a, b) => b[1] - a[1]))
}

function inferTechStack(
  languageBreakdown: Record<string, number>,
  packages: PackageInventory[],
  texts: Map<string, string>,
): TechStackSummary {
  const dependencies = packages.flatMap((item) => item.dependencies).map((item) => item.toLowerCase())
  const allText = [...texts.entries()]
    .filter(([file]) => /(^|[/\\])(appsettings|docker-compose|package|cargo|.*\.csproj|.*\.toml|.*\.yaml|.*\.yml|.*\.json)$/i.test(file))
    .map(([, text]) => text.toLowerCase())
    .join('\n')

  const frameworks = new Set<string>()
  addIf(frameworks, dependencies.some((item) => item.includes('react')), 'React')
  addIf(frameworks, dependencies.some((item) => item.includes('vite')), 'Vite')
  addIf(frameworks, dependencies.some((item) => item.includes('astro')), 'Astro')
  addIf(frameworks, dependencies.some((item) => item.includes('hotchocolate')), 'Hot Chocolate GraphQL')
  addIf(frameworks, dependencies.some((item) => item.includes('swashbuckle') || item.includes('scalar')), 'OpenAPI')
  addIf(frameworks, dependencies.some((item) => item.includes('entityframeworkcore')), 'Entity Framework Core')
  addIf(frameworks, dependencies.some((item) => item.includes('@modelcontextprotocol/sdk')), 'Model Context Protocol')
  addIf(frameworks, dependencies.some((item) => item.includes('vitest')), 'Vitest')
  addIf(frameworks, dependencies.some((item) => item.includes('xunit')), 'xUnit')

  const databases = new Set<string>()
  addIf(databases, /postgres|npgsql/.test(allText) || dependencies.some((item) => item.includes('npgsql')), 'PostgreSQL')
  addIf(databases, /sqlite|microsoft\.data\.sqlite/.test(allText), 'SQLite')
  addIf(databases, /redis/.test(allText) || dependencies.some((item) => item.includes('redis')), 'Redis')
  addIf(databases, /mongodb|mongo/.test(allText), 'MongoDB')
  addIf(databases, /mysql|mariadb/.test(allText), 'MySQL/MariaDB')
  addIf(databases, /sqlserver|mssql/.test(allText), 'SQL Server')

  return {
    languages: Object.keys(languageBreakdown),
    frameworks: [...frameworks].sort(),
    databases: [...databases].sort(),
    packageManagers: [...new Set(packages.map((item) => item.ecosystem))].sort(),
  }
}

function inferEntryPoints(texts: Map<string, string>, packages: PackageInventory[]): EntryPoint[] {
  const entryPoints: EntryPoint[] = []
  for (const [file, text] of texts) {
    const base = path.basename(file).toLowerCase()
    if (base === 'program.cs' && /Map(Get|Post|Put|Delete|Patch|GraphQL)|WebApplication\.CreateBuilder/.test(text)) {
      entryPoints.push({ file, type: 'api', description: 'ASP.NET Core API host.' })
    } else if (base === 'index.ts' || base === 'index.js' || base === 'main.ts' || base === 'main.tsx') {
      entryPoints.push({ file, type: base.endsWith('tsx') ? 'web' : 'library', description: 'Node or browser entry module.' })
    } else if (base === 'cli.ts' || base === 'cli.js') {
      entryPoints.push({ file, type: 'cli', description: 'Command-line entry module.' })
    } else if (base === 'dockerfile') {
      entryPoints.push({ file, type: 'container', description: 'Container image entry point.' })
    }
  }

  for (const item of packages) {
    if (item.ecosystem !== 'node' || item.scripts === undefined) continue
    for (const [script, command] of Object.entries(item.scripts)) {
      if (/^(start|dev|serve)$/.test(script)) {
        entryPoints.push({
          file: item.path,
          type: command.includes('vite') ? 'web' : 'cli',
          description: `npm script '${script}' runs '${redactCommand(command)}'.`,
        })
      }
    }
  }

  return uniqueBy(entryPoints, (item) => `${item.type}:${item.file}:${item.description}`).slice(0, 80)
}

function findApiEndpoints(texts: Map<string, string>): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = []
  for (const [file, text] of texts) {
    const csharpMap = /(?:app|group|[\w]+Group|authGroup|apiClientsGroup|opsGroup)\.Map(Get|Post|Put|Delete|Patch)\(\s*"([^"]*)"/g
    for (const match of text.matchAll(csharpMap)) {
      endpoints.push({
        method: (match[1] ?? 'GET').toUpperCase(),
        path: match[2] === '' ? '/' : (match[2] ?? '/'),
        file,
        auth: inferEndpointAuth(text, match.index ?? 0),
      })
    }

    if (text.includes('MapGraphQL(')) {
      const graphQlPath = text.match(/MapGraphQL\("([^"]+)"\)/)?.[1] ?? '/graphql'
      endpoints.push({ method: 'POST', path: graphQlPath, file, auth: 'bearer', description: 'GraphQL endpoint.' })
    }

    const jsRoutes = /(?:app|router)\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g
    for (const match of text.matchAll(jsRoutes)) {
      endpoints.push({
        method: (match[1] ?? 'get').toUpperCase(),
        path: match[2] ?? '/',
        file,
        auth: inferEndpointAuth(text, match.index ?? 0),
      })
    }

    const httpAttribute = /\[Http(Get|Post|Put|Delete|Patch)(?:\("([^"]*)"\))?\]/g
    for (const match of text.matchAll(httpAttribute)) {
      endpoints.push({
        method: (match[1] ?? 'Get').toUpperCase(),
        path: match[2] ?? '(controller route)',
        file,
        auth: inferEndpointAuth(text, match.index ?? 0),
      })
    }
  }

  return uniqueBy(endpoints, (item) => `${item.method}:${item.path}:${item.file}`).slice(0, 300)
}

function inferEndpointAuth(text: string, index: number): string {
  const before = text.slice(Math.max(0, index - 220), index)
  const after = text.slice(index, Math.min(text.length, index + 360))
  const statementWindow = `${before}${after}`
  if (/AllowAnonymous\(\)|\[AllowAnonymous\]/.test(after)) return 'anonymous'
  if (/RequireAuthorization|\[Authorize/.test(statementWindow)) return 'bearer'
  if (/api[-_]?key|ApiKey/i.test(statementWindow)) return 'api-key'
  return 'unknown'
}

function findTypeSignatures(texts: Map<string, string>): TypeSignature[] {
  const signatures: TypeSignature[] = []
  for (const [file, text] of texts) {
    const lines = text.split(/\r?\n/)
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.length > 240) continue
      const csharp = trimmed.match(/^(?:public|internal|private|protected)?\s*(?:sealed\s+|static\s+|partial\s+|abstract\s+)?(class|interface|record|enum)\s+([A-Za-z_][A-Za-z0-9_]*)/)
      if (csharp) {
        signatures.push({ kind: csharp[1] as TypeSignature['kind'], name: csharp[2] ?? '', file, signature: trimmed })
        continue
      }

      const csharpMethod = trimmed.match(/^(?:public|internal|private|protected)\s+(?:static\s+)?(?:async\s+)?[\w<>, ?.[\]]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\([^;]*\)/)
      if (csharpMethod) {
        signatures.push({ kind: 'function', name: csharpMethod[1] ?? '', file, signature: trimmed })
        continue
      }

      const tsType = trimmed.match(/^(?:export\s+)?(?:declare\s+)?(interface|class|type|enum)\s+([A-Za-z_][A-Za-z0-9_]*)/)
      if (tsType) {
        signatures.push({ kind: tsType[1] as TypeSignature['kind'], name: tsType[2] ?? '', file, signature: trimmed })
        continue
      }

      const tsFunction = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/)
        ?? trimmed.match(/^(?:export\s+)?const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?\(/)
      if (tsFunction) {
        signatures.push({ kind: 'function', name: tsFunction[1] ?? '', file, signature: trimmed })
      }
    }
  }

  return uniqueBy(signatures, (item) => `${item.kind}:${item.name}:${item.file}`).slice(0, 500)
}

function findSchemas(texts: Map<string, string>): SchemaObject[] {
  const schemas: SchemaObject[] = []
  for (const [file, text] of texts) {
    for (const match of text.matchAll(/DbSet<([A-Za-z_][A-Za-z0-9_]*)>\s+([A-Za-z_][A-Za-z0-9_]*)/g)) {
      schemas.push({
        name: match[2] ?? match[1] ?? 'DbSet',
        type: 'dbset',
        file,
        description: `Entity Framework DbSet for ${(match[1] ?? 'an entity')}.`,
      })
    }

    for (const match of text.matchAll(/CreateTable\(\s*name:\s*"([^"]+)"/g)) {
      schemas.push({ name: match[1] ?? 'table', type: 'migration', file, description: 'EF migration table.' })
    }

    for (const match of text.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?([A-Za-z0-9_.-]+)/gi)) {
      schemas.push({ name: match[1] ?? 'table', type: 'table', file, description: 'SQL table declaration.' })
    }

    if (path.basename(file).endsWith('.schema.json') || /"\$schema"\s*:/.test(text)) {
      const title = text.match(/"title"\s*:\s*"([^"]+)"/)?.[1] ?? path.basename(file)
      schemas.push({ name: title, type: 'json-schema', file, description: 'JSON Schema contract.' })
    }

    if (file.endsWith('.graphql') || /\btype\s+Query\b|\btype\s+Mutation\b/.test(text)) {
      schemas.push({ name: path.basename(file), type: 'graphql', file, description: 'GraphQL schema or resolver contract.' })
    }
  }

  return uniqueBy(schemas, (item) => `${item.type}:${item.name}:${item.file}`).slice(0, 400)
}

function findBusinessLogicPatterns(texts: Map<string, string>): string[] {
  const patterns = new Map<string, string[]>()
  const rules: Array<[string, RegExp]> = [
    ['Authentication and machine identity', /\b(auth|jwt|bearer|api.?key|client_credentials)\b/i],
    ['Connector registration and validation', /\bconnector|manifest|source system|data source\b/i],
    ['Context recomputation pipeline', /\brecompute|selector|context package|semantic attribute\b/i],
    ['Billing or metering boundary', /\bbilling|usage|meter|licen[cs]e|subscription\b/i],
    ['Audit and governance boundary', /\baudit|governance|policy|redact|mask\b/i],
    ['Webhook or event ingestion', /\bwebhook|event ingestion|source-system|eventType\b/i],
  ]

  for (const [file, text] of texts) {
    for (const [name, pattern] of rules) {
      if (pattern.test(text)) {
        const files = patterns.get(name) ?? []
        files.push(file)
        patterns.set(name, files)
      }
    }
  }

  return [...patterns.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([name, files]) => `${name}: ${files.slice(0, 6).join(', ')}${files.length > 6 ? ` (+${files.length - 6} more)` : ''}`)
}

function inferDataFlows(tier1: Tier1QuickScan, tier2: Tier2SemanticIndex): DataFlow[] {
  const flows: DataFlow[] = []
  if (tier2.endpoints.some((endpoint) => endpoint.path.includes('events') || endpoint.path.includes('webhook'))) {
    flows.push({
      name: 'External event ingestion',
      sources: ['HTTP clients', 'webhooks', 'source-system events'],
      processors: tier2.endpoints.filter((endpoint) => endpoint.path.includes('events') || endpoint.path.includes('webhook')).map((endpoint) => endpoint.file),
      sinks: tier1.techStack.databases,
      evidence: tier2.endpoints.filter((endpoint) => endpoint.path.includes('events') || endpoint.path.includes('webhook')).map((endpoint) => `${endpoint.method} ${endpoint.path}`),
    })
  }

  if (tier2.schemas.length > 0) {
    flows.push({
      name: 'Application persistence',
      sources: ['API handlers', 'background workers', 'local CLI tools'],
      processors: tier2.schemas.slice(0, 8).map((schema) => schema.file),
      sinks: [...new Set(tier2.schemas.map((schema) => schema.name))].slice(0, 12),
      evidence: tier2.schemas.slice(0, 8).map((schema) => `${schema.type}:${schema.name}`),
    })
  }

  if (flows.length === 0) {
    flows.push({
      name: 'No explicit data flow inferred',
      sources: [],
      processors: [],
      sinks: [],
      evidence: ['No API endpoint plus persistence schema combination was found in the scanned files.'],
    })
  }

  return flows
}

function findSecuritySurface(texts: Map<string, string>): SecurityFinding[] {
  const rules: Array<[string, RegExp, string]> = [
    ['Authentication', /\b(AddAuthentication|UseAuthentication|Authorize|JWT|Bearer|client_credentials)\b/i, 'Authentication or token validation code is present.'],
    ['Authorisation', /\b(RequireAuthorization|Roles|scope|permission|policy)\b/i, 'Role, scope, or policy checks are present.'],
    ['CORS and browser boundary', /\b(Cors|AllowedOrigins|Content-Security-Policy|X-Frame-Options)\b/i, 'Browser origin or security header controls are present.'],
    ['Webhook integrity', /\b(webhook|signature|HMAC|sha256|secret)\b/i, 'Webhook or request-signing code is present.'],
    ['Secret handling', /\b(secret|password|api.?key|token)\b/i, 'Secret-bearing configuration names are present; values were not read from ignored secret files.'],
  ]

  return rules
    .map(([area, pattern, note]): SecurityFinding | undefined => {
      const files = [...texts.entries()]
        .filter(([, text]) => pattern.test(text))
        .map(([file]) => file)
        .slice(0, 12)
      return files.length > 0 ? { area, files, notes: [note] } : undefined
    })
    .filter((item): item is SecurityFinding => item !== undefined)
}

function findCoupling(texts: Map<string, string>): CouplingHotspot[] {
  const moduleRefs = new Map<string, { inbound: number; outbound: number; files: Set<string> }>()
  const files = [...texts.keys()].filter((file) => /\.(cs|ts|tsx|js|mjs|rs|py)$/.test(file))
  const modules = [...new Set(files.map(topModule))]

  for (const file of files) {
    const module = topModule(file)
    const text = texts.get(file) ?? ''
    const refs = extractReferences(text)
    const entry = moduleRefs.get(module) ?? { inbound: 0, outbound: 0, files: new Set<string>() }
    entry.files.add(file)
    entry.outbound += refs.length
    moduleRefs.set(module, entry)

    for (const candidate of modules) {
      if (candidate !== module && refs.some((ref) => ref.toLowerCase().includes(candidate.toLowerCase()))) {
        const target = moduleRefs.get(candidate) ?? { inbound: 0, outbound: 0, files: new Set<string>() }
        target.inbound += 1
        moduleRefs.set(candidate, target)
      }
    }
  }

  return [...moduleRefs.entries()]
    .map(([module, value]) => ({
      module,
      inboundReferences: value.inbound,
      outboundReferences: value.outbound,
      files: [...value.files].slice(0, 8),
    }))
    .sort((left, right) => (right.inboundReferences + right.outboundReferences) - (left.inboundReferences + left.outboundReferences))
    .slice(0, 10)
}

function scoreTechDebt(
  texts: Map<string, string>,
  tier1: Tier1QuickScan,
  tier2: Tier2SemanticIndex,
): TechDebtScore {
  const textEntries = [...texts.entries()]
  const todoCount = textEntries.reduce((sum, [, text]) => sum + countMatches(text, /\b(TODO|FIXME|HACK)\b/g), 0)
  const sourceFiles = textEntries.filter(([file]) => /\.(cs|ts|tsx|js|mjs|rs|py)$/.test(file) && !/(^|[/\\])(tests?|specs?)([/\\]|$)|\.test\.|\.spec\./i.test(file)).length
  const testFiles = textEntries.filter(([file]) => /(^|[/\\])(tests?|specs?)([/\\]|$)|\.test\.|\.spec\./i.test(file)).length
  const largeFiles = textEntries.filter(([, text]) => text.split(/\r?\n/).length > 900).map(([file]) => file)
  const dependencyRisk = tier1.packages.filter((item) => item.dependencies.length > 80).length

  const documentation = clampScore(100 - Math.max(0, 12 - countDocs(textEntries)) * 6)
  const testCoverage = clampScore(sourceFiles === 0 ? 100 : Math.round((testFiles / sourceFiles) * 180))
  const maintainability = clampScore(100 - todoCount * 2 - largeFiles.length * 5 - Math.max(0, tier2.endpoints.length - 120))
  const dependency = clampScore(100 - dependencyRisk * 10)
  const overall = Math.round((documentation + testCoverage + maintainability + dependency) / 4)
  const findings: string[] = []

  if (todoCount > 0) findings.push(`${todoCount} TODO/FIXME/HACK markers found in scanned text files.`)
  if (largeFiles.length > 0) findings.push(`${largeFiles.length} large source files exceed 900 lines.`)
  if (testFiles === 0 && sourceFiles > 0) findings.push('No local test files were detected for the scanned source files.')
  if (dependencyRisk > 0) findings.push(`${dependencyRisk} package manifests have more than 80 dependencies.`)
  if (findings.length === 0) findings.push('No high-signal maintainability warnings were detected by the local heuristic scan.')

  return {
    overall,
    documentation,
    testCoverage,
    maintainability,
    dependencyRisk: dependency,
    findings,
  }
}

function countDocs(entries: Array<[string, string]>): number {
  return entries.filter(([file]) => file.toLowerCase().endsWith('.md')).length
}

function countMatches(text: string, pattern: RegExp): number {
  return [...text.matchAll(pattern)].length
}

function extractReferences(text: string): string[] {
  const refs = [
    ...text.matchAll(/^\s*import\s+.*?\s+from\s+['"]([^'"]+)['"]/gm),
    ...text.matchAll(/^\s*using\s+([A-Za-z0-9_.]+);/gm),
    ...text.matchAll(/^\s*use\s+([A-Za-z0-9_:]+)::/gm),
  ].map((match) => match[1] ?? '')

  return refs.filter(Boolean)
}

function topModule(file: string): string {
  const parts = file.split(/[\\/]/)
  if (parts[0] === 'src' && parts.length > 1) return parts[1] ?? 'src'
  if (parts[0] === 'apps' && parts.length > 1) return `apps/${parts[1] ?? ''}`
  if (parts[0] === 'packages' && parts.length > 2) return `packages/${parts[2] ?? parts[1] ?? ''}`
  return parts[0] ?? '.'
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function addIf(set: Set<string>, condition: boolean, value: string): void {
  if (condition) set.add(value)
}

function uniqueBy<T>(items: T[], keySelector: (item: T) => string): T[] {
  const seen = new Set<string>()
  const result: T[] = []
  for (const item of items) {
    const key = keySelector(item)
    if (!seen.has(key)) {
      result.push(item)
      seen.add(key)
    }
  }

  return result
}

function toRelative(rootPath: string, absolutePath: string): string {
  return path.relative(rootPath, absolutePath).replace(/\\/g, '/')
}

function redactCommand(command: string): string {
  return command.replace(/(--?(?:token|secret|password|key)\s+)[^\s]+/gi, '$1[redacted]')
}
