import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RelationshipJsonExplorer } from '@/features/intelligence/relationship-json-explorer'
import type { NextActionResult } from '@/lib/types'

const result = {
  tenantSlug: 'demo',
  subjectType: 'email',
  subjectIdentifier: 'a***@larkspur-logistics.example',
  objective: 'sale',
  purpose: 'customer_outreach',
  actorRole: 'sales_rep',
  exactLinkedRecords: {
    recordCounts: {
      CustomerAccount: 1,
      CustomerContact: 1,
    },
    records: [
      {
        citationId: 'EVID-01',
        recordType: 'CustomerAccount',
        recordId: 'account-1',
        externalId: 'ACC-2000',
        label: 'Larkspur Logistics Group',
        summary: 'Synthetic account summary.',
        observedAtUtc: '2026-06-16T10:00:00Z',
        isMasked: false,
        fields: {
          accountName: 'Larkspur Logistics Group',
          lifecycleStage: 'customer',
        },
      },
      {
        citationId: 'EVID-02',
        recordType: 'CustomerContact',
        recordId: 'contact-1',
        externalId: 'CON-10000',
        label: 'Contact CON-10000',
        summary: 'Masked contact summary.',
        observedAtUtc: '2026-06-16T11:00:00Z',
        isMasked: true,
        fields: {
          email: 'a***@larkspur-logistics.example',
          preferredChannel: 'email',
        },
      },
    ],
  },
  relationships: [
    {
      relationshipId: 'REL-01',
      relationshipType: 'EmailToContact',
      linkKind: 'deterministic',
      sourceType: 'email',
      sourceId: 'sha256:contact',
      targetType: 'CustomerContact',
      targetId: 'CON-10000',
      confidence: 1,
      weight: 1,
      rationale: 'Email resolved to this contact.',
      citationIds: ['EVID-02'],
    },
  ],
  similarWonLostPatterns: [],
  weightedSignals: [
    {
      signalKey: 'pricing-intent',
      label: 'Pricing and rollout intent',
      direction: 'positive',
      weight: 0.18,
      score: 0.92,
      contribution: 0.17,
      explanation: 'Fresh pricing activity supports the recommendation.',
      citationIds: ['EVID-01'],
    },
  ],
  recommendedNextAction: {
    action: 'Send a short email-led rollout note.',
    timing: 'Within 24 hours.',
    rationale: 'Fresh intent supports immediate outreach.',
    score: 0.84,
    citationIds: ['EVID-01', 'EVID-02'],
  },
  draftResponse: null,
  confidence: 0.84,
  caveats: ['Synthetic pattern evidence is directional.'],
  provenance: [
    {
      citationId: 'EVID-01',
      sourceEntityType: 'CustomerAccount',
      sourceEntityId: 'ACC-2000',
      evidenceType: 'exact-record',
      summary: 'Synthetic account summary.',
      isMasked: false,
    },
  ],
  governance: {
    isAllowed: true,
    dataPlane: 'customer-owned-data-plane',
    rawDataRetainedInCustomerDataPlane: true,
    cloudPayloadContainsRawCustomerData: false,
    appliedRules: ['cloud-aggregate-usage-payload-excludes-raw-and-derived-customer-intelligence'],
    maskedFields: ['contact.email'],
    deniedFields: [],
    cloudAggregateUsagePayloadJson: '{"payloadKind":"cloud-aggregate-usage"}',
  },
  evidencePack: {
    evidencePackId: 'EP-SYN-REL-001',
    packageVersion: '2026-06-16.relationship-intelligence.v1',
    generatedAtUtc: '2026-06-16T12:00:00Z',
    localDerivedEvidencePackageJson: '{"packageId":"EP-SYN-REL-001"}',
    cloudAggregateUsagePayloadJson: '{"payloadKind":"cloud-aggregate-usage"}',
    cloudPayloadContainsRawCustomerData: false,
  },
} satisfies NextActionResult

describe('RelationshipJsonExplorer', () => {
  it('surfaces exact data, attribution paths, masking, caveats, and handoff JSON', async () => {
    const user = userEvent.setup()
    render(<RelationshipJsonExplorer result={result} />)

    expect(screen.getByText('Relationship JSON explorer')).toBeInTheDocument()
    expect(screen.getByText('Exact data items JSON')).toBeInTheDocument()
    expect(screen.getAllByText('EVID-01').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /Attribution paths/i }))
    expect(screen.getByText('Attribution paths JSON')).toBeInTheDocument()
    expect(screen.getByText('Step 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Citations and caveats/i }))
    expect(screen.getByText('Send a short email-led rollout note.')).toBeInTheDocument()
    expect(screen.getByText('Synthetic pattern evidence is directional.')).toBeInTheDocument()
    expect(screen.getByText('contact.email')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Scout fallback and handoff JSON/i }))
    expect(screen.getByText('Scout fallback signals')).toBeInTheDocument()
    expect(screen.getByText('Handoff JSON boundary')).toBeInTheDocument()
    expect(screen.getByText('Aggregate only')).toBeInTheDocument()
  })
})
