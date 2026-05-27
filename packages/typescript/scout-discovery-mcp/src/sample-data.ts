import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { SampleDataset, ConnectorMetadata } from './types.js'

const currentDir = dirname(fileURLToPath(import.meta.url))
const dataPath = resolve(currentDir, '..', 'data', 'sample-connectors.json')

let cachedDataset: SampleDataset | undefined

function loadDataset(): SampleDataset {
  if (cachedDataset !== undefined) return cachedDataset
  const raw = readFileSync(dataPath, 'utf-8')
  cachedDataset = JSON.parse(raw) as SampleDataset
  return cachedDataset
}

export function getConnectors(): ConnectorMetadata[] {
  return loadDataset().connectors
}

export function getConnectorByType(connectorType: string): ConnectorMetadata | undefined {
  const normalised = connectorType.trim().toLowerCase()
  return getConnectors().find(
    (c) =>
      c.connectorType.toLowerCase() === normalised ||
      c.aliases.some((a) => a.toLowerCase() === normalised),
  )
}

export function getSemanticAttributeKeys(): string[] {
  return loadDataset().semanticAttributeKeys
}

export function getDataSourceKinds(): string[] {
  return loadDataset().dataSourceKinds
}

export function getConnectorCapabilities(): string[] {
  return loadDataset().connectorCapabilities
}

export function resetCache(): void {
  cachedDataset = undefined
}
