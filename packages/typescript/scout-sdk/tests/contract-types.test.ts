import { describe, expect, it } from 'vitest'
import type {
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
      profile.externalUserId,
    ]).toEqual(['Prepare renewal context.', 'sdk-test', 'selector-123', null, 2, 'user-123'])
  })
})
