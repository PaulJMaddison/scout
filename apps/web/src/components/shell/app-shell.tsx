import { useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import {
  Activity,
  AppWindow,
  DatabaseZap,
  Flag,
  FileSearch,
  FileUp,
  LayoutDashboard,
  Menu,
  ScrollText,
  Shapes,
  Sparkles,
  TrendingUp,
  Waypoints,
  WandSparkles,
  X,
} from 'lucide-react'
import { Badge, Button } from '@/components/ui/primitives'
import { executiveStorySteps } from '@/features/demo/executive-demo-data'
import { useAuthSession } from '@/lib/auth'
import { apiModeStore } from '@/lib/api'
import type { AuthenticatedOperator } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useSyncExternalStore } from 'react'

type OperatorRole = AuthenticatedOperator['role']

interface NavigationItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  roles: OperatorRole[]
}

interface NavigationSection {
  title: string
  items: NavigationItem[]
}

const navigationSections: NavigationSection[] = [
  {
    title: 'Executive Walkthrough',
    items: [
      { to: '/demo', label: executiveStorySteps[0].label, icon: Flag, roles: ['tenant_admin', 'sales_rep'] },
      {
        to: '/story/source-signals',
        label: executiveStorySteps[1].label,
        icon: DatabaseZap,
        roles: ['tenant_admin', 'sales_rep'],
      },
      {
        to: '/story/context-layer',
        label: executiveStorySteps[2].label,
        icon: Waypoints,
        roles: ['tenant_admin', 'sales_rep'],
      },
      {
        to: '/story/ai-workflow',
        label: executiveStorySteps[3].label,
        icon: Sparkles,
        roles: ['tenant_admin', 'sales_rep'],
      },
      {
        to: '/story/outcomes',
        label: executiveStorySteps[4].label,
        icon: TrendingUp,
        roles: ['tenant_admin', 'sales_rep'],
      },
    ],
  },
  {
    title: 'Product Proof',
    items: [
      { to: '/customers', label: '360 Customer Profile', icon: AppWindow, roles: ['tenant_admin', 'sales_rep'] },
      { to: '/agent-playground', label: 'Grounded AI Playground', icon: WandSparkles, roles: ['tenant_admin', 'sales_rep'] },
      { to: '/overview', label: 'Operational Overview', icon: LayoutDashboard, roles: ['tenant_admin', 'sales_rep'] },
    ],
  },
  {
    title: 'Admin Console',
    items: [
      { to: '/data-sources', label: 'Data Sources', icon: DatabaseZap, roles: ['tenant_admin'] },
      { to: '/selectors', label: 'Selector Builder', icon: Shapes, roles: ['tenant_admin'] },
      { to: '/semantic-schema', label: 'Schema Registry', icon: FileSearch, roles: ['tenant_admin'] },
      { to: '/bootstrap-studio', label: 'Bootstrap Studio', icon: FileUp, roles: ['tenant_admin'] },
      { to: '/audit', label: 'Audit Log', icon: ScrollText, roles: ['tenant_admin'] },
    ],
  },
]

function isNavigationItemActive(pathname: string, itemPath: string) {
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`)
}

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { session, signOut } = useAuthSession()
  const apiMode = useSyncExternalStore(
    apiModeStore.subscribe,
    apiModeStore.getSnapshot,
    apiModeStore.getSnapshot,
  )
  const currentRole = session?.role ?? 'sales_rep'
  const visibleSections = useMemo(
    () =>
      navigationSections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => item.roles.includes(currentRole)),
        }))
        .filter((section) => section.items.length > 0),
    [currentRole],
  )
  const visibleNavigation = useMemo(
    () => visibleSections.flatMap((section) => section.items),
    [visibleSections],
  )
  const activeLabel = useMemo(() => {
    return visibleNavigation.find((item) => isNavigationItemActive(location.pathname, item.to))?.label ?? 'Console'
  }, [location.pathname, visibleNavigation])

  if (!session) {
    return null
  }

  return (
    <div className="min-h-[100dvh] bg-transparent">
      <div className="console-shell mx-auto flex min-h-[100dvh] max-w-[1800px] gap-3 px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 lg:px-6">
        <aside
          className={cn(
            'console-sidebar fixed inset-y-3 left-3 z-40 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[28px] border border-ink-900/8 bg-ink-950 px-4 py-4 shadow-[0_24px_60px_rgba(24,18,15,0.28)] transition sm:inset-y-4 sm:left-4 sm:w-[290px] sm:rounded-[32px] sm:px-5 sm:py-5 lg:static lg:max-h-[calc(100dvh-2rem)] lg:translate-x-0',
            mobileOpen ? 'translate-x-0' : '-translate-x-[120%]',
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-copper-300">
                Context Layer
              </p>
              <h1 className="mt-3 font-display text-2xl text-ivory-50">Semantic Console</h1>
            </div>
            <button
              type="button"
              className="rounded-full p-2 text-ivory-200 hover:bg-white/10 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-8 rounded-[26px] border border-white/10 bg-white/5 p-4 text-ivory-100">
            <p className="text-xs uppercase tracking-[0.2em] text-ivory-300/70">Workspace</p>
            <p className="mt-3 text-lg font-semibold">{session.tenantSlug}</p>
            <p className="mt-1 text-sm text-ivory-300/80">{session.displayName}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="accent">{session.role === 'tenant_admin' ? 'Tenant Admin' : 'Sales Rep'}</Badge>
              <Badge tone={apiMode === 'live' ? 'success' : apiMode === 'demo' ? 'warning' : 'neutral'}>
                {apiMode === 'live' ? 'Live GraphQL' : apiMode === 'demo' ? 'Demo mode' : 'Connecting'}
              </Badge>
            </div>
          </div>

          <div className="mt-8 min-h-0 flex-1 overflow-y-auto pr-1">
            <nav className="grid gap-6">
              {visibleSections.map((section) => (
                <div key={section.title} className="grid gap-2">
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ivory-300/58">
                    {section.title}
                  </p>
                  <div className="grid gap-2">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const active = isNavigationItemActive(location.pathname, item.to)
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={cn(
                            'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                            active
                              ? 'bg-copper-500 text-ivory-50 shadow-[0_18px_45px_rgba(175,92,43,0.28)]'
                              : 'text-ivory-200 hover:bg-white/8',
                          )}
                          onClick={() => setMobileOpen(false)}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="min-w-0 break-words">{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="mt-auto pt-8">
            <Button
              type="button"
              variant="secondary"
              className="w-full border-white/12 bg-white/6 text-ivory-100 hover:bg-white/12"
              onClick={() => {
                signOut()
                void navigate({ to: '/login' })
              }}
            >
              Sign out
            </Button>
          </div>
        </aside>

        <div className="console-main-shell flex min-h-[calc(100dvh-1.5rem)] min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-ink-900/8 bg-ivory-100/84 shadow-[0_24px_60px_rgba(24,18,15,0.12)] backdrop-blur sm:min-h-[calc(100dvh-2rem)] sm:rounded-[34px] lg:max-h-[calc(100dvh-2rem)]">
          <header className="console-shell-header flex flex-wrap items-center justify-between gap-4 border-b border-ink-900/8 px-4 py-4 sm:px-5 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-ink-900/10 bg-ivory-50 p-2 text-ink-900 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage-700">
                  {session.tenantSlug}
                </p>
                <h2 className="mt-1 truncate font-display text-xl text-ink-950">{activeLabel}</h2>
              </div>
            </div>
            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <Badge tone="neutral">
                <Activity className="mr-2 size-3.5" />
                Profiles grounded in provenance
              </Badge>
            </div>
          </header>

          <main className="console-shell-main min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
