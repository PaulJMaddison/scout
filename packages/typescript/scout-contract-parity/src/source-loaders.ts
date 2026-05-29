import { readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import type {
  ConnectorManifestShape,
  ContractParityInput,
  ContractSurface,
  EnumShape,
  FieldShape,
  ManifestFixture,
  ModelShape,
} from './types.js'

const REST_CONTRACT_FILES = [
  'src/KynticAI.Scout.Api/Rest/RestContracts.cs',
  'src/KynticAI.Scout.Api/Rest/VersionedRestContracts.cs',
  'src/KynticAI.Scout.Application/Contracts/Inputs.cs',
  'src/KynticAI.Scout.Application/Contracts/Results.cs',
  'src/KynticAI.Scout.Application/Contracts/ConnectorInputs.cs',
  'src/KynticAI.Scout.Application/Contracts/ConnectorResults.cs',
] as const

const GRAPHQL_CONTRACT_FILES = [
  'src/KynticAI.Scout.Application/Contracts/Inputs.cs',
  'src/KynticAI.Scout.Application/Contracts/Results.cs',
  'src/KynticAI.Scout.Application/Contracts/ConnectorInputs.cs',
  'src/KynticAI.Scout.Application/Contracts/ConnectorResults.cs',
] as const

export function loadFromRepo(repoRoot: string): ContractParityInput {
  const root = resolve(repoRoot)
  const restModels = parseCSharpModels(root, REST_CONTRACT_FILES, 'rest')
  const graphQlModels = parseCSharpModels(root, GRAPHQL_CONTRACT_FILES, 'graphql')
  const dotnetSdkModels = parseCSharpModels(root, ['src/KynticAI.Scout.Sdk/KynticAI.ScoutModels.cs'], 'dotnet-sdk')
  const typescriptSdkModels = parseTypeScriptInterfaces(
    read(root, 'packages/typescript/scout-sdk/src/types.ts'),
    'typescript-sdk',
    'packages/typescript/scout-sdk/src/types.ts',
  )

  return {
    restModels,
    graphQlModels: uniqueModels(graphQlModels),
    dotnetSdkModels,
    typescriptSdkModels,
    apiEnums: parseCSharpEnums(
      read(root, 'src/KynticAI.Scout.Domain/Enums/DomainEnums.cs'),
      'rest',
      'src/KynticAI.Scout.Domain/Enums/DomainEnums.cs',
    ).concat(parseCSharpEnums(
      read(root, 'src/KynticAI.Scout.Application/Abstractions/IConnectorPlugin.cs'),
      'connector-manifest',
      'src/KynticAI.Scout.Application/Abstractions/IConnectorPlugin.cs',
    )),
    dotnetSdkEnums: [],
    typescriptSdkEnums: parseTypeScriptEnums(
      read(root, 'packages/typescript/scout-sdk/src/types.ts'),
      'typescript-sdk',
      'packages/typescript/scout-sdk/src/types.ts',
    ),
    connectorManifest: loadConnectorManifestShape(root),
    manifests: loadManifestFixtures(root),
  }
}

export function readFixture(path: string): ContractParityInput {
  return JSON.parse(readFileSync(resolve(path), 'utf-8')) as ContractParityInput
}

function parseCSharpModels(root: string, files: readonly string[], surface: ContractSurface): ModelShape[] {
  return files.flatMap((file) => parseCSharpRecords(read(root, file), surface, file))
}

function parseCSharpRecords(source: string, surface: ContractSurface, sourceFile: string): ModelShape[] {
  const models: ModelShape[] = []
  const recordRegex = /public\s+sealed\s+record\s+(\w+)\s*\(([\s\S]*?)\);/g
  let match: RegExpExecArray | null

  while ((match = recordRegex.exec(source)) !== null) {
    const name = match[1]!
    const body = match[2]!
    models.push({
      name,
      surface,
      sourceFile,
      fields: splitParameters(body).map(parseCSharpField).filter((field): field is FieldShape => field !== undefined),
    })
  }

  return models
}

function parseCSharpField(parameter: string): FieldShape | undefined {
  const cleaned = parameter
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\s*=\s*[^,]+$/g, '')
    .trim()
  const match = /^(?:[\w<>]+\s+)?([\w<>?]+)\s+(\w+)$/.exec(cleaned)
  if (!match) return undefined
  return {
    type: cleanCSharpType(match[1]!),
    name: toCamelCase(match[2]!),
    optional: match[1]!.includes('?'),
  }
}

function parseTypeScriptInterfaces(source: string, surface: ContractSurface, sourceFile: string): ModelShape[] {
  const models: ModelShape[] = []
  const interfaceRegex = /export\s+interface\s+(\w+)(?:<[^>]+>)?\s*\{([\s\S]*?)\n\}/g
  let match: RegExpExecArray | null

  while ((match = interfaceRegex.exec(source)) !== null) {
    const fields: FieldShape[] = []
    for (const line of match[2]!.split('\n')) {
      const cleaned = line.replace(/\/\*.*?\*\//g, '').trim()
      const fieldMatch = /^(\w+)(\?)?:\s*([^/]+)$/.exec(cleaned)
      if (!fieldMatch) continue
      fields.push({
        name: fieldMatch[1]!,
        optional: fieldMatch[2] === '?',
        type: fieldMatch[3]!.trim(),
      })
    }
    models.push({ name: match[1]!, surface, sourceFile, fields })
  }

  return models
}

function parseCSharpEnums(source: string, surface: ContractSurface, sourceFile: string): EnumShape[] {
  const enums: EnumShape[] = []
  const enumRegex = /public\s+enum\s+(\w+)\s*\{([\s\S]*?)\n\}/g
  let match: RegExpExecArray | null

  while ((match = enumRegex.exec(source)) !== null) {
    const values = match[2]!
      .split('\n')
      .map((line) => line.replace(/=.*/, '').replace(',', '').trim())
      .filter((line) => /^[A-Z]\w+$/.test(line))
    enums.push({ name: match[1]!, surface, values, sourceFile })
  }

  return enums
}

function parseTypeScriptEnums(source: string, surface: ContractSurface, sourceFile: string): EnumShape[] {
  const enums: EnumShape[] = []
  const unionRegex = /export\s+type\s+(\w+)\s*=\s*([^;\n]+)/g
  let match: RegExpExecArray | null

  while ((match = unionRegex.exec(source)) !== null) {
    const values = [...match[2]!.matchAll(/'([^']+)'/g)].map((value) => value[1]!)
    if (values.length > 0) {
      enums.push({ name: match[1]!, surface, values, sourceFile })
    }
  }

  return enums
}

function loadConnectorManifestShape(root: string): ConnectorManifestShape {
  const types = read(root, 'packages/typescript/scout-connector-validator/src/types.ts')
  const schema = read(root, 'packages/typescript/scout-connector-validator/src/schema.ts')
  const manifestInterface = /export\s+interface\s+ConnectorManifest\s*\{([\s\S]*?)\n\}/.exec(types)?.[1] ?? ''
  return {
    allowedFields: [...manifestInterface.matchAll(/^\s*(\w+)\??:/gm)].map((match) => match[1]!),
    sourceTypes: parseConstArray(schema, 'KNOWN_SOURCE_TYPES'),
    capabilities: parseConstArray(schema, 'KNOWN_CAPABILITIES'),
  }
}

function loadManifestFixtures(root: string): ManifestFixture[] {
  const candidates = [
    join(root, 'packages/typescript/scout-connector-validator/data'),
    join(root, 'samples/connectors'),
    join(root, 'samples/connector-template'),
  ]
  const manifests: ManifestFixture[] = []

  for (const directory of candidates) {
    const stat = statSync(directory, { throwIfNoEntry: false })
    if (!stat?.isDirectory()) continue
    for (const file of readdirSync(directory).filter((entry) => entry.endsWith('.json'))) {
      const fullPath = join(directory, file)
      const raw = JSON.parse(readFileSync(fullPath, 'utf-8')) as Record<string, unknown>
      if (typeof raw['connectorId'] !== 'string') continue
      manifests.push({
        name: basename(fullPath),
        sourceFile: fullPath.slice(root.length + 1).replace(/\\/g, '/'),
        fields: Object.keys(raw),
        supportedSourceTypes: readStringArray(raw, 'supportedSourceTypes'),
        capabilities: readStringArray(raw, 'capabilities'),
      })
    }
  }

  return manifests
}

function parseConstArray(source: string, name: string): string[] {
  const body = new RegExp(`const\\s+${name}[^=]*=\\s*\\[([\\s\\S]*?)\\]`).exec(source)?.[1] ?? ''
  return [...body.matchAll(/'([^']+)'/g)].map((match) => match[1]!)
}

function splitParameters(body: string): string[] {
  const parts: string[] = []
  let current = ''
  let depth = 0

  for (const char of body) {
    if (char === '<' || char === '(') depth++
    if (char === '>' || char === ')') depth--
    if (char === ',' && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += char
  }

  if (current.trim().length > 0) parts.push(current)
  return parts
}

function uniqueModels(models: ModelShape[]): ModelShape[] {
  const seen = new Set<string>()
  return models.filter((model) => {
    const key = `${model.name}:${model.fields.map((field) => field.name).join(',')}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function read(root: string, path: string): string {
  return readFileSync(join(root, path), 'utf-8')
}

function readStringArray(obj: Record<string, unknown>, key: string): string[] {
  const value = obj[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function cleanCSharpType(type: string): string {
  return type.replace(/^IReadOnlyList<(.+)>$/, '$1[]').replace(/\?$/, '')
}

function toCamelCase(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1)
}
