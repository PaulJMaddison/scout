import type { ConnectorCatalogueEntry } from '@/lib/types'

export interface ConnectorMaturityLabel {
  label: string
  tone: 'neutral' | 'success' | 'warning' | 'danger' | 'accent'
  detail: string
}

function isMockOrLocalProof(entry: ConnectorCatalogueEntry) {
  const searchable = `${entry.connectorType} ${entry.displayName} ${entry.category}`.toLowerCase()
  return (
    searchable.includes('mock') ||
    searchable.includes('csv') ||
    searchable.includes('file') ||
    searchable.includes('event') ||
    entry.capabilities.some((capability) => capability.toLowerCase().includes('preview')) ||
    entry.capabilities.some((capability) => capability.toLowerCase().includes('dryrun'))
  )
}

export function getConnectorMaturityLabels(
  entry: ConnectorCatalogueEntry,
  isExecutable: boolean,
): ConnectorMaturityLabel[] {
  const labels: ConnectorMaturityLabel[] = []

  if (isExecutable && entry.availability === 'OpenCore' && !entry.isPlaceholder) {
    labels.push({
      label: 'Executable open-core',
      tone: 'success',
      detail: 'Registered plugin path is available in the public Scout build.',
    })
  }

  if (isMockOrLocalProof(entry) && !entry.isPlaceholder) {
    labels.push({
      label: 'Mock/local proof',
      tone: 'accent',
      detail: 'Safe deterministic proof path for demos, dry-runs, or approved exports.',
    })
  }

  if (
    entry.publicStatus === 'CustomerSpecificConnector' ||
    entry.availability === 'Enterprise' ||
    entry.availability === 'SaaSManaged'
  ) {
    labels.push({
      label: 'Private/customer-specific',
      tone: 'warning',
      detail: 'Requires scoped private implementation or customer-specific delivery work.',
    })
  }

  if (entry.isPlaceholder || entry.availability === 'ComingSoon') {
    labels.push({
      label: 'Placeholder',
      tone: 'neutral',
      detail: 'Catalogue metadata only; no executable vendor connector is included here.',
    })
  }

  labels.push({
    label: 'Not vendor-certified',
    tone: entry.isPlaceholder ? 'warning' : 'neutral',
    detail: 'Public Scout metadata must not be read as vendor certification.',
  })

  return labels
}
