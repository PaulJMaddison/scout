import { useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import {
  Activity,
  AppWindow,
  DatabaseZap,
  Flag,
  FileSearch,
  LayoutDashboard,
  Menu,
  ScrollText,
  Shapes,
  WandSparkles,
  X,
} from 'lucide-react'
import { Badge, Button } from '@/components/ui/primitives'
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

const navigation: NavigationItem[] = [
  { to: '/demo', label: 'CEO Demo', icon: Flag, roles: ['tenant_admin', 'sales_rep'] },
  { to: '/overview', label: 'Overview', icon: LayoutDashboard, roles: ['tenant_admin', 'sales_rep'] },
  { to: '/data-sources', label: 'Data Sources', icon: DatabaseZap, roles: ['tenant_admin'] },
  { to: '/selectors', label: 'Selector Builder', icon: Shapes, roles: ['tenant_admin'] },
  { to: '/semantic-schema', label: 'Schema Registry', icon: FileSearch, roles: ['tenant_admin'] },
  { to: '/customers', label: 'Customer Context', icon: AppWindow, roles: ['tenant_admin', 'sales_rep'] },
  { to: '/agent-playground', label: 'Agent Playground', icon: WandSparkles, roles: ['tenant_admin', 'sales_rep'] },
  { to: '/audit', label: 'Audit Log', icon: ScrollText, roles: ['tenant_admin'] },
]

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
  const visibleNavigation = useMemo(
    () => navigation.filter((item) => item.roles.includes(currentRole)),
    [currentRole],
  )
  const activeLabel = useMemo(() => {
    return visibleNavigation.find((item) => location.pathname.startsWith(item.to))?.label ?? 'Console'
  }, [location.pathname, visibleNavigation])

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1800px] gap-4 px-4 py-4 lg:px-6">
        <aside
          className={cn(
            'fixed inset-y-4 left-4 z-40 w-[290px] rounded-[32px] border border-ink-900/8 bg-ink-950 px-5 py-5 shadow-[0_24px_60px_rgba(24,18,15,0.28)] transition lg:static lg:translate-x-0',
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

          <nav className="mt-8 grid gap-2">
            {visibleNavigation.map((item) => {
              const Icon = item.icon
              const active = location.pathname.startsWith(item.to)
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
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

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

        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col overflow-hidden rounded-[34px] border border-ink-900/8 bg-ivory-100/84 shadow-[0_24px_60px_rgba(24,18,15,0.12)] backdrop-blur">
          <header className="flex items-center justify-between border-b border-ink-900/8 px-5 py-4 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-ink-900/10 bg-ivory-50 p-2 text-ink-900 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sage-700">
                  {session.tenantSlug}
                </p>
                <h2 className="mt-1 font-display text-xl text-ink-950">{activeLabel}</h2>
              </div>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <Badge tone="neutral">
                <Activity className="mr-2 size-3.5" />
                Profiles grounded in provenance
              </Badge>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
