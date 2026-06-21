import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PilotSetupPage } from '@/features/pilot/pilot-setup-page'

const { apiMocks } = vi.hoisted(() => ({
  apiMocks: {
    getConnectorCatalogue: vi.fn(),
    getConnectorPlugins: vi.fn(),
    validateConnectorConfiguration: vi.fn(),
  },
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

vi.mock('@/lib/auth', () => ({
  useAuthSession: () => ({
    session: {
      accessToken: 'token',
      expiresAtUtc: '2026-06-21T14:00:00Z',
      tenantId: 'tenant-1',
      tenantSlug: 'demo',
      operatorAccountId: 'operator-1',
      email: 'admin@scout.local',
      displayName: 'Dana Mercer',
      role: 'tenant_admin',
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
      <PilotSetupPage />
    </QueryClientProvider>,
  )
}

describe('PilotSetupPage', () => {
  beforeEach(() => {
    apiMocks.getConnectorCatalogue.mockReset()
    apiMocks.getConnectorPlugins.mockReset()
    apiMocks.validateConnectorConfiguration.mockReset()

    apiMocks.getConnectorCatalogue.mockResolvedValue([
      {
        connectorType: 'mockCrm',
        displayName: 'Mock CRM',
        description: 'Fictional CRM records for selectors and context snapshots.',
        category: 'Demo',
        publicStatus: 'PublicGenericExample',
        availability: 'OpenCore',
        isIncludedInOpenCore: true,
        requiresCommercialAgreement: false,
        isPlaceholder: false,
        isEnabled: true,
        supportedDataSourceKinds: ['Crm'],
        capabilities: ['configurationValidation', 'healthCheck', 'preview', 'dryRun'],
        configurationSchemaJson: '{}',
        credentialSchemaJson: '{}',
        healthCheckMode: 'Local deterministic validation.',
      },
      {
        connectorType: 'salesforce',
        displayName: 'Salesforce placeholder',
        description: 'Catalogue metadata only.',
        category: 'CRM',
        publicStatus: 'PaidEnterpriseImplementation',
        availability: 'SaaSManaged',
        isIncludedInOpenCore: false,
        requiresCommercialAgreement: true,
        isPlaceholder: true,
        isEnabled: true,
        supportedDataSourceKinds: ['Crm'],
        capabilities: ['catalogueOnly'],
        configurationSchemaJson: '{}',
        credentialSchemaJson: '{}',
        healthCheckMode: 'Unavailable in open source.',
      },
    ])
    apiMocks.getConnectorPlugins.mockResolvedValue([
      {
        connectorType: 'mockCrm',
        displayName: 'Mock CRM',
        description: 'Fictional CRM records.',
        aliases: [],
        supportedDataSourceKinds: ['Crm'],
        supportedCapabilities: ['ConfigurationValidation', 'HealthCheck'],
        configurationSchemaJson: '{}',
        credentialSchemaJson: '{}',
        sampleConfigurationJson: '{}',
      },
    ])
    apiMocks.validateConnectorConfiguration.mockResolvedValue({
      connectorType: 'mockCrm',
      isValid: true,
      errors: [],
      sanitizedConfigurationJson: '{"connectorType":"mockCrm"}',
      configurationSchemaJson: '{}',
    })
  })

  it('renders data-scope approval and produces a readiness summary after dry-run', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByText('Operator-assisted setup for the first Scout pilot.')).toBeInTheDocument()
    expect(screen.getByLabelText('Source owner')).toHaveValue('admin@scout.local')
    expect(screen.getByText('Data scope approval')).toBeInTheDocument()
    expect(screen.getAllByText('PII/sensitive data marker').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Email, chat, or document body text').length).toBeGreaterThan(0)
    expect((await screen.findAllByText('Not vendor-certified')).length).toBeGreaterThan(0)

    await user.selectOptions(screen.getByLabelText('Sign-off status'), 'approved-for-dry-run')
    await user.click(screen.getByRole('button', { name: /Run connector dry-run/i }))

    await waitFor(() => expect(apiMocks.validateConnectorConfiguration).toHaveBeenCalledTimes(1))
    expect((await screen.findAllByText('Connector dry-run passed')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Ready for operator review').length).toBeGreaterThan(0)
    expect(screen.getByText('Pilot readiness JSON')).toBeInTheDocument()
  })
})
