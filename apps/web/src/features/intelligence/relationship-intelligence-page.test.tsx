import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { RelationshipIntelligencePage } from '@/features/intelligence/relationship-intelligence-page'

const { apiMocks } = vi.hoisted(() => ({
  apiMocks: {
    generateNextAction: vi.fn(),
  },
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

vi.mock('@/lib/auth', () => ({
  useAuthSession: () => ({
    session: {
      accessToken: 'token',
      expiresAtUtc: '2026-06-16T14:00:00Z',
      tenantId: 'tenant-1',
      tenantSlug: 'demo',
      operatorAccountId: 'operator-1',
      email: 'rep@scout.local',
      displayName: 'Jordan Kim',
      role: 'sales_rep',
    },
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}))

vi.mock('@/lib/api', () => ({
  api: apiMocks,
}))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RelationshipIntelligencePage />
    </QueryClientProvider>,
  )
}

describe('RelationshipIntelligencePage', () => {
  beforeEach(() => {
    apiMocks.generateNextAction.mockReset()
    apiMocks.generateNextAction.mockResolvedValue({
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
          WebConversionEvent: 1,
        },
        records: [
          {
            citationId: 'EVID-01',
            recordType: 'CustomerAccount',
            recordId: 'account-1',
            externalId: 'ACC-2000',
            label: 'Larkspur Logistics Group',
            summary: 'Synthetic enterprise account.',
            observedAtUtc: '2026-06-16T10:00:00Z',
            isMasked: false,
            fields: {
              externalAccountId: 'ACC-2000',
              name: 'Larkspur Logistics Group',
            },
          },
          {
            citationId: 'EVID-02',
            recordType: 'CustomerContact',
            recordId: 'contact-1',
            externalId: 'CON-10000',
            label: 'Contact CON-10000',
            summary: 'Masked synthetic contact.',
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
      similarWonLostPatterns: [
        {
          matchId: 'PAT-01',
          matchedSubjectType: 'contact',
          matchedSubjectId: 'sha256:won',
          matchedAccountId: 'ACC-SYN-WON-01',
          outcome: 'won',
          similarityScore: 0.83,
          outcomeWeight: 0.82,
          relationshipTypes: ['SameSegment', 'SimilarWebJourney'],
          reasons: ['Similar synthetic account closed won.'],
          citationIds: ['PAT-01', 'EVID-01'],
        },
      ],
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
        action: 'Send a short email-led enterprise rollout note.',
        timing: 'Within 24 hours.',
        rationale: 'Fresh intent supports immediate outreach.',
        score: 0.84,
        citationIds: ['EVID-01', 'EVID-02'],
      },
      draftResponse: {
        channel: 'email',
        subject: 'Larkspur Logistics Group: rollout planning',
        body: 'Hi Avery,\n\nRecent synthetic signals support a rollout planning note [EVID-01].',
        citationIds: ['EVID-01'],
        requiresHumanReview: true,
      },
      confidence: 0.84,
      caveats: ['Synthetic pattern evidence is directional.'],
      provenance: [
        {
          citationId: 'EVID-01',
          sourceEntityType: 'CustomerAccount',
          sourceEntityId: 'ACC-2000',
          evidenceType: 'exact-record',
          summary: 'Synthetic enterprise account.',
          isMasked: false,
        },
        {
          citationId: 'PAT-01',
          sourceEntityType: 'SimilarPatternMatch',
          sourceEntityId: 'PAT-01',
          evidenceType: 'similar-won-pattern',
          summary: 'Similar synthetic account closed won.',
          isMasked: true,
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
        localDerivedEvidencePackageJson: '{"records":2}',
        cloudAggregateUsagePayloadJson: '{"payloadKind":"cloud-aggregate-usage"}',
        cloudPayloadContainsRawCustomerData: false,
      },
    })
  })

  it('renders cited relationship intelligence and governance indicators', async () => {
    renderPage()

    await waitFor(() =>
      expect(screen.getByText('Send a short email-led enterprise rollout note.')).toBeInTheDocument(),
    )

    expect(screen.getByLabelText('Identifier')).toHaveValue('avery.stone@larkspur-logistics.example')
    expect(screen.getByText('Draft response with citations')).toBeInTheDocument()
    expect(screen.getByText('Won pattern')).toBeInTheDocument()
    expect(screen.getByText('Cloud aggregate usage')).toBeInTheDocument()
    expect(screen.getByText('contact.email')).toBeInTheDocument()
    expect(screen.getAllByText('EVID-01').length).toBeGreaterThan(0)
  })
})
