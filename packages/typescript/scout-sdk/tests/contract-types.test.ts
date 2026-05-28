import { describe, expect, it } from 'vitest'
import type {
  ConnectorCatalogueEntryResult,
  ConnectorPluginDefinitionResult,
  PublishSelectorDefinitionInput,
  QueueContextRecomputeInput,
  RunScheduledRecomputeInput,
  SalesContextPackageInput,
  ScheduledRecomputeDispatchResult,
  UserContextLookupInput,
  UserProfileResult,
} from '../src/types.js'

describe('Scout TypeScript SDK contract types', () => {
  it('exports public request and result contract shapes used by parity checks', () => {
    const lookup: UserContextLookupInput = {
      tenantSlug: 'demo',
      externalUserId: 'user-123',
    }
    const salesPackage: SalesContextPackageInput = {
      tenantSlug: 'demo',
      externalUserId: lookup.externalUserId,
      salesObjective: 'Prepare renewal context.',
    }
    const recompute: QueueContextRecomputeInput = {
      tenantSlug: 'demo',
      externalUserId: lookup.externalUserId,
      triggeredBy: 'sdk-test',
    }
    const publish: PublishSelectorDefinitionInput = {
      tenantSlug: 'demo',
      selectorDefinitionId: 'selector-123',
    }
    const runScheduled: RunScheduledRecomputeInput = {
      tenantSlug: null,
    }
    const dispatch: ScheduledRecomputeDispatchResult = {
      queuedUserCount: 2,
      skippedUserCount: 1,
    }
    const plugin: ConnectorPluginDefinitionResult = {
      connectorType: 'restApi',
      displayName: 'REST API',
      description: 'Generic REST connector.',
      aliases: [],
      supportedDataSourceKinds: ['Crm'],
      supportedCapabilities: ['FetchSubject'],
      configurationSchemaJson: '{"type":"object","properties":{}}',
      credentialSchemaJson: '{"type":"object","properties":{}}',
      sampleConfigurationJson: '{}',
    }
    const catalogueEntry: ConnectorCatalogueEntryResult = {
      connectorType: 'restApi',
      displayName: 'REST API',
      description: 'Generic REST connector.',
      category: 'API',
      publicStatus: 'PublicGenericExample',
      availability: 'OpenCore',
      isIncludedInOpenCore: true,
      requiresCommercialAgreement: false,
      isPlaceholder: false,
      isEnabled: true,
      supportedDataSourceKinds: ['Crm'],
      capabilities: ['FetchSubject'],
      configurationSchemaJson: '{"type":"object","properties":{}}',
      credentialSchemaJson: '{"type":"object","properties":{}}',
      healthCheckMode: 'HEAD request or static-response validation.',
    }
    const profile: UserProfileResult = {
      id: 'profile-123',
      tenantId: 'tenant-123',
      externalUserId: lookup.externalUserId,
      fullName: 'Avery Stone',
      email: 'avery@example.com',
      companyName: 'Larkspur Logistics Group',
      jobTitle: 'VP Revenue',
      segment: 'enterprise',
      lastSeenAtUtc: '2026-05-11T10:00:00Z',
      isEmailMasked: false,
    }

    expect([
      salesPackage.salesObjective,
      recompute.triggeredBy,
      publish.selectorDefinitionId,
      runScheduled.tenantSlug,
      dispatch.queuedUserCount,
      plugin.connectorType,
      catalogueEntry.publicStatus,
      profile.externalUserId,
    ]).toEqual(['Prepare renewal context.', 'sdk-test', 'selector-123', null, 2, 'restApi', 'PublicGenericExample', 'user-123'])
  })
})
