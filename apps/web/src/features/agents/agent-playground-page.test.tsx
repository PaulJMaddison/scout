import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { AgentPlaygroundPage } from '@/features/agents/agent-playground-page'

const { apiMocks } = vi.hoisted(() => ({
  apiMocks: {
    getUserProfiles: vi.fn(),
    getPromptTemplates: vi.fn(),
    getSalesContextPackage: vi.fn(),
    getAgentRuns: vi.fn(),
    createAgentRun: vi.fn(),
  },
}))

vi.mock('@/lib/auth', () => ({
  useAuthSession: () => ({
    session: {
      accessToken: 'token',
      expiresAtUtc: '2026-05-09T14:00:00Z',
      tenantId: 'tenant-1',
      tenantSlug: 'demo',
      operatorAccountId: 'operator-1',
      email: 'rep@contextlayer.local',
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
      <AgentPlaygroundPage />
    </QueryClientProvider>,
  )
}

describe('AgentPlaygroundPage', () => {
  beforeEach(() => {
    Object.values(apiMocks).forEach((mock) => mock.mockReset())

    apiMocks.getUserProfiles.mockResolvedValue([
      {
        id: 'user-profile-1',
        tenantId: 'tenant-1',
        externalUserId: '123',
        fullName: 'Avery Stone',
        email: 'a***@northstarlogistics.io',
        isEmailMasked: true,
        companyName: 'Northstar Logistics',
        jobTitle: 'VP Revenue Operations',
        segment: 'enterprise',
        lastSeenAtUtc: '2026-05-09T11:00:00Z',
      },
    ])
    apiMocks.getPromptTemplates.mockResolvedValue([
      {
        id: 'prompt-1',
        tenantId: 'tenant-1',
        name: 'Intelligent Sales Support v1',
        description: 'Grounded sales support.',
        systemPrompt: 'Only use grounded facts.',
        developerPrompt: 'Cite context facts.',
        userPromptTemplate: 'Generate support output.',
        outputSchemaJson: '{"type":"object"}',
        guardrailsJson: '["Cite grounded facts.","Recommend human review when evidence is weak."]',
        version: 1,
        isActive: true,
        createdAtUtc: '2026-05-08T10:00:00Z',
        updatedAtUtc: '2026-05-09T10:00:00Z',
      },
    ])
    apiMocks.getSalesContextPackage.mockResolvedValue({
      snapshotId: 'snapshot-1',
      tenantSlug: 'demo',
      externalUserId: '123',
      fullName: 'Avery Stone',
      companyName: 'Northstar Logistics',
      jobTitle: 'VP Revenue Operations',
      segment: 'enterprise',
      salesObjective: 'Book a discovery call.',
      summary: '85% conversion probability, prefers email, and shows high product engagement.',
      overallConfidence: 0.84,
      generatedAtUtc: '2026-05-09T11:30:00Z',
      isStale: false,
      humanReviewRecommended: true,
      missingInformation: [],
      weakSignalMessages: ['Churn risk is low confidence.'],
      facts: [
        {
          citationId: 'FACT-01',
          factId: 'fact-1',
          attributeKey: 'conversionProbability',
          displayName: 'Conversion Probability',
          valueJson: '85',
          valueType: 'NUMBER',
          confidence: 0.93,
          observedAtUtc: '2026-05-09T11:05:00Z',
          freshUntilUtc: '2026-05-09T12:05:00Z',
          isFresh: true,
          isLowConfidence: false,
          explanation: 'Strong pipeline and usage signals support a high conversion score.',
          provenanceJson: '[{"source":"warehouse","field":"conversionProbability"}]',
        },
      ],
      contextPackageJson: '{"facts":[{"citationId":"FACT-01"}]}',
    })
    apiMocks.getAgentRuns.mockResolvedValue([
      {
        id: 'run-1',
        tenantId: 'tenant-1',
        userProfileId: 'user-profile-1',
        promptTemplateId: 'prompt-1',
        contextSnapshotId: 'snapshot-1',
        providerName: 'mock',
        modelName: 'gpt-5.5',
        salesObjective: 'Book a discovery call.',
        attemptCount: 1,
        status: 'COMPLETED',
        confidence: 0.82,
        inputJson: '{"contextPackage":{"snapshotId":"snapshot-1"}}',
        outputJson: JSON.stringify({
          salesObjective: 'Book a discovery call.',
          outreachStrategy: {
            summary: 'Lead with enterprise rollout timing and recent product momentum.',
            recommendedChannel: 'email',
            timingRecommendation: 'Send within the next business day.',
            keyTalkingPoints: [
              { text: 'Conversion intent is currently high.', citations: ['FACT-01'], confidence: 0.93 },
            ],
            risks: [],
            confidence: 0.82,
            humanReviewRecommended: true,
            humanReviewReason: 'Churn risk remains low confidence.',
          },
          personalizedEmailDraft: {
            subjectLine: 'Avery, a fast path to enterprise rollout at Northstar',
            previewText: 'Using recent product momentum to frame next steps.',
            body: 'Avery, your team’s recent product engagement suggests this is a good moment to discuss enterprise rollout.',
            callToAction: 'Would a 20-minute conversation next week make sense?',
            supportingClaims: [
              { text: 'Recent engagement is high.', citations: ['FACT-01'], confidence: 0.88 },
            ],
            confidence: 0.81,
            humanReviewRecommended: true,
            humanReviewReason: 'Needs a rep to confirm timing.',
          },
          followUpRecommendations: {
            recommendations: [
              {
                action: 'Send a short enterprise rollout email.',
                timing: 'Tomorrow morning',
                rationale: 'High engagement and conversion intent support immediate outreach.',
                citations: ['FACT-01'],
                confidence: 0.83,
              },
            ],
            lowConfidenceSignals: ['Churn risk remains low confidence.'],
            missingInformation: [],
            confidence: 0.8,
            humanReviewRecommended: true,
            humanReviewReason: 'Low-confidence risk signal present.',
          },
          missingInformation: [],
          humanReviewRecommended: true,
          humanReviewReason: 'Low-confidence risk signal present.',
          overallConfidence: 0.82,
        }),
        provenanceJson: JSON.stringify([
          {
            citationId: 'FACT-01',
            factId: 'fact-1',
            attributeKey: 'conversionProbability',
            displayName: 'Conversion Probability',
            valueJson: '85',
            confidence: 0.93,
            observedAtUtc: '2026-05-09T11:05:00Z',
            freshUntilUtc: '2026-05-09T12:05:00Z',
            isFresh: true,
            isLowConfidence: false,
            explanation: 'Strong pipeline and usage signals support a high conversion score.',
            provenance: [{ source: 'warehouse', field: 'conversionProbability' }],
          },
        ]),
        requestedAtUtc: '2026-05-09T11:31:00Z',
        completedAtUtc: '2026-05-09T11:31:30Z',
        failureReason: null,
      },
    ])
    apiMocks.createAgentRun.mockResolvedValue(null)
  })

  it('renders grounded recommendation evidence for the latest agent run', async () => {
    renderPage()

    await waitFor(() =>
      expect(screen.getByText('Why this was recommended')).toBeInTheDocument(),
    )

    expect(screen.getAllByText('FACT-01').length).toBeGreaterThan(0)
    expect(
      screen.getAllByText(/Lead with enterprise rollout timing and recent product momentum/i).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getByText(/The model only sees the grounded package below/i),
    ).toBeInTheDocument()
  })
})
