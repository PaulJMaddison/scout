/* eslint-disable react-refresh/only-export-components */
import {
  Outlet,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  redirect,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
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

function requireRole(context: RouterContext, redirectUrl: string, allowedRoles: Array<'tenant_admin' | 'sales_rep'>) {
  const session = requireAuthenticatedSession(context, redirectUrl)
  if (!allowedRoles.includes(session.role)) {
    throw redirect({ to: '/overview' })
  }

  return session
}

function RootLayout() {
  return (
    <>
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  )
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    if (authStore.getSession()) {
      throw redirect({ to: '/demo' })
    }

    throw redirect({ to: '/login' })
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: lazyRouteComponent(() => import('@/features/auth/login-page'), 'LoginPage'),
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

const demoRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/demo',
  component: lazyRouteComponent(() => import('@/features/demo/demo-mode-page'), 'DemoModePage'),
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

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  appRoute.addChildren([
    demoRoute,
    overviewRoute,
    dataSourcesRoute,
    selectorsRoute,
    semanticRoute,
    customersRoute,
    customerRoute,
    playgroundRoute,
    auditRoute,
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
