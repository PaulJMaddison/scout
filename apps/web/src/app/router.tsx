/* eslint-disable react-refresh/only-export-components */
import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router'
import { AppShell } from '@/components/shell/app-shell'
import { authStore } from '@/lib/auth'

interface RouterContext {
  auth: typeof authStore
}

function requireAuthenticatedSession(context: RouterContext, redirectUrl: string) {
  const session = context.auth.getSession()
  if (!session) {
    throw redirect({
      to: '/login',
      search: {
        redirect: redirectUrl,
      },
    })
  }

  return session
}

type ConsoleRole = NonNullable<ReturnType<typeof authStore.getSession>>['role']

function requireRole(context: RouterContext, redirectUrl: string, allowedRoles: ConsoleRole[]) {
  const session = requireAuthenticatedSession(context, redirectUrl)
  if (!allowedRoles.includes(session.role)) {
    throw redirect({ to: '/overview' })
  }

  return session
}

function RootLayout() {
  return <Outlet />
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

const marketingRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'marketing',
  component: AppShell,
})

const indexRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/',
  component: lazyRouteComponent(() => import('@/features/marketing/landing-page'), 'LandingPage'),
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: lazyRouteComponent(() => import('@/features/auth/login-page'), 'LoginPage'),
})

const platformRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/platform',
  component: lazyRouteComponent(() => import('@/features/marketing/platform-page'), 'PlatformPage'),
})

const integrationLayerRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/integration-layer',
  component: lazyRouteComponent(
    () => import('@/features/marketing/integration-layer-page'),
    'IntegrationLayerPage',
  ),
})

const integrationsRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/integrations',
  component: lazyRouteComponent(
    () => import('@/features/marketing/integrations-page'),
    'IntegrationsPage',
  ),
})

const useCasesRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/use-cases',
  component: lazyRouteComponent(() => import('@/features/marketing/use-cases-page'), 'UseCasesPage'),
})

const connectorCatalogueRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/connectors',
  component: lazyRouteComponent(
    () => import('@/features/connectors/connector-catalogue-page'),
    'ConnectorCataloguePage',
  ),
})

const openCoreRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/open-core',
  component: lazyRouteComponent(() => import('@/features/marketing/open-core-page'), 'OpenCorePage'),
})

const commercialRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/commercial',
  component: lazyRouteComponent(() => import('@/features/marketing/commercial-page'), 'CommercialPage'),
})

const pricingRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/pricing',
  component: lazyRouteComponent(() => import('@/features/marketing/pricing-page'), 'PricingPage'),
})

const docsRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/docs',
  component: lazyRouteComponent(() => import('@/features/marketing/docs-page'), 'DocsPage'),
})

const onboardingRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/onboarding',
  component: lazyRouteComponent(() => import('@/features/onboarding/onboarding-page'), 'OnboardingPage'),
})

const faqRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/faq',
  component: lazyRouteComponent(() => import('@/features/marketing/faq-page'), 'FaqPage'),
})

const publicDemoRoute = createRoute({
  getParentRoute: () => marketingRoute,
  path: '/demo',
  component: lazyRouteComponent(() => import('@/features/demo/demo-mode-page'), 'DemoModePage'),
})

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  beforeLoad: ({ context, location }) => {
    requireAuthenticatedSession(context, location.href)
  },
  component: AppShell,
})

const overviewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/overview',
  component: lazyRouteComponent(() => import('@/features/dashboard/overview-page'), 'OverviewPage'),
})

const storySourceSignalsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/story/source-signals',
  component: lazyRouteComponent(
    () => import('@/features/demo/story-source-signals-page'),
    'StorySourceSignalsPage',
  ),
})

const storyContextLayerRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/story/context-layer',
  component: lazyRouteComponent(
    () => import('@/features/demo/story-context-layer-page'),
    'StoryContextLayerPage',
  ),
})

const storyAiWorkflowRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/story/ai-workflow',
  component: lazyRouteComponent(
    () => import('@/features/demo/story-ai-workflow-page'),
    'StoryAiWorkflowPage',
  ),
})

const storyOutcomesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/story/outcomes',
  component: lazyRouteComponent(
    () => import('@/features/demo/story-outcomes-page'),
    'StoryOutcomesPage',
  ),
})

const dataSourcesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/data-sources',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['tenant_admin'])
  },
  component: lazyRouteComponent(
    () => import('@/features/data-sources/data-sources-page'),
    'DataSourcesPage',
  ),
})

const selectorsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/selectors',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['tenant_admin'])
  },
  component: lazyRouteComponent(
    () => import('@/features/selectors/selector-builder-page'),
    'SelectorBuilderPage',
  ),
})

const semanticRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/semantic-schema',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['tenant_admin'])
  },
  component: lazyRouteComponent(
    () => import('@/features/semantic/semantic-schema-page'),
    'SemanticSchemaPage',
  ),
})

const bootstrapStudioRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/bootstrap-studio',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['tenant_admin'])
  },
  component: lazyRouteComponent(
    () => import('@/features/bootstrap/bootstrap-studio-page'),
    'BootstrapStudioPage',
  ),
})

const customersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/customers',
  component: lazyRouteComponent(
    () => import('@/features/context/customer-context-viewer-page'),
    'CustomerContextViewerPage',
  ),
})

const customerRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/customers/$externalUserId',
  component: lazyRouteComponent(
    () => import('@/features/context/customer-context-viewer-page'),
    'CustomerContextViewerPage',
  ),
})

const playgroundRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/agent-playground',
  component: lazyRouteComponent(
    () => import('@/features/agents/agent-playground-page'),
    'AgentPlaygroundPage',
  ),
})

const auditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/audit',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['tenant_admin'])
  },
  component: lazyRouteComponent(() => import('@/features/audit/audit-log-page'), 'AuditLogPage'),
})

const billingRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/billing',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['tenant_admin'])
  },
  component: lazyRouteComponent(() => import('@/features/billing/usage-dashboard-page'), 'UsageDashboardPage'),
})

const organisationSettingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin/organisation',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['platform_owner', 'tenant_admin'])
  },
  component: lazyRouteComponent(
    () => import('@/features/admin/organisation-settings-page'),
    'OrganisationSettingsPage',
  ),
})

const workspaceSettingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin/workspaces',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['platform_owner', 'tenant_admin', 'integration_admin', 'analyst', 'read_only'])
  },
  component: lazyRouteComponent(
    () => import('@/features/admin/workspace-settings-page'),
    'WorkspaceSettingsPage',
  ),
})

const usersRolesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin/users',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['platform_owner', 'tenant_admin'])
  },
  component: lazyRouteComponent(() => import('@/features/admin/users-roles-page'), 'UsersRolesPage'),
})

const apiClientsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin/api-clients',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['platform_owner', 'tenant_admin', 'integration_admin'])
  },
  component: lazyRouteComponent(() => import('@/features/admin/api-clients-page'), 'ApiClientsPage'),
})

const adminUsageRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin/usage',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['platform_owner', 'tenant_admin', 'integration_admin'])
  },
  component: lazyRouteComponent(() => import('@/features/billing/usage-dashboard-page'), 'UsageDashboardPage'),
})

const adminConnectorsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin/connectors',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['platform_owner', 'tenant_admin', 'integration_admin', 'analyst', 'read_only'])
  },
  component: lazyRouteComponent(
    () => import('@/features/connectors/connector-catalogue-page'),
    'ConnectorCataloguePage',
  ),
})

const webhookEventsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin/events',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['platform_owner', 'tenant_admin', 'integration_admin', 'analyst'])
  },
  component: lazyRouteComponent(
    () => import('@/features/admin/webhook-event-history-page'),
    'WebhookEventHistoryPage',
  ),
})

const blueprintImportsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin/blueprint-imports',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['platform_owner', 'tenant_admin', 'integration_admin'])
  },
  component: lazyRouteComponent(
    () => import('@/features/admin/blueprint-imports-page'),
    'BlueprintImportsPage',
  ),
})

const dataGovernanceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin/governance',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['platform_owner', 'tenant_admin', 'integration_admin', 'analyst'])
  },
  component: lazyRouteComponent(() => import('@/features/admin/data-governance-page'), 'DataGovernancePage'),
})

const auditExportRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin/audit-export',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['platform_owner', 'tenant_admin'])
  },
  component: lazyRouteComponent(() => import('@/features/admin/audit-export-page'), 'AuditExportPage'),
})

const licenceStatusRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin/licence',
  beforeLoad: ({ context, location }) => {
    requireRole(context, location.href, ['platform_owner', 'tenant_admin', 'integration_admin', 'read_only'])
  },
  component: lazyRouteComponent(() => import('@/features/admin/licence-status-page'), 'LicenceStatusPage'),
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  marketingRoute.addChildren([
    indexRoute,
    platformRoute,
    useCasesRoute,
    integrationsRoute,
    integrationLayerRoute,
    connectorCatalogueRoute,
    openCoreRoute,
    pricingRoute,
    commercialRoute,
    docsRoute,
    publicDemoRoute,
    onboardingRoute,
    faqRoute,
  ]),
  appRoute.addChildren([
    storySourceSignalsRoute,
    storyContextLayerRoute,
    storyAiWorkflowRoute,
    storyOutcomesRoute,
    overviewRoute,
    dataSourcesRoute,
    selectorsRoute,
    semanticRoute,
    bootstrapStudioRoute,
    customersRoute,
    customerRoute,
    playgroundRoute,
    auditRoute,
    billingRoute,
    organisationSettingsRoute,
    workspaceSettingsRoute,
    usersRolesRoute,
    apiClientsRoute,
    adminUsageRoute,
    adminConnectorsRoute,
    webhookEventsRoute,
    blueprintImportsRoute,
    dataGovernanceRoute,
    auditExportRoute,
    licenceStatusRoute,
  ]),
])

export const router = createRouter({
  routeTree,
  context: {
    auth: authStore,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
