import { useQuery } from '@tanstack/react-query'
import { Boxes, CheckCircle2, PlugZap, UsersRound } from 'lucide-react'
import { Badge, Card, MetricCard, PageHeader, Panel } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import { AdminEmptyState, AdminErrorState, AdminLoadingState, DetailRow, StatusBadge } from '@/features/admin/admin-components'

export function WorkspaceSettingsPage() {
  const { session } = useAuthSession()
  const tenantSlug = session?.tenantSlug ?? 'demo'
  const workspacesQuery = useQuery({
    queryKey: ['workspaces', tenantSlug],
    queryFn: () => api.getWorkspaces(tenantSlug),
    enabled: Boolean(session),
  })
  const overviewQuery = useQuery({
    queryKey: ['saas-admin-overview', tenantSlug],
    queryFn: async () => ({
      users: await api.getOperatorAccounts(tenantSlug),
      connectors: await api.getConnectorCatalogue(),
    }),
    enabled: Boolean(session),
  })

  if (!session) {
    return null
  }

  const workspaces = workspacesQuery.data ?? []
  const defaultWorkspace = workspaces.find((workspace) => workspace.isDefault)

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Workspace settings"
        title="Control the workspace scopes where teams connect systems and expose trusted context."
        description="Workspaces let a tenant separate sales demos, production integrations, private-cloud pilots, or product teams without creating new organisations."
        actions={defaultWorkspace ? <Badge tone="accent">Default: {defaultWorkspace.name}</Badge> : null}
      />

      {workspacesQuery.isLoading ? <AdminLoadingState label="Loading workspaces" /> : null}
      {workspacesQuery.isError ? <AdminErrorState error={workspacesQuery.error} /> : null}

      {workspaces.length === 0 && !workspacesQuery.isLoading ? (
        <AdminEmptyState
          title="No workspaces yet"
          body="Create a workspace during onboarding so source systems, API clients, and selectors can be scoped before customers connect production data."
        />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Workspaces" value={String(workspaces.length)} footnote="Active and archived workspace records for this tenant." accent="sage" />
            <MetricCard label="Users loaded" value={String(overviewQuery.data?.users.length ?? '—')} footnote="Operators that can be assigned through workspace membership records." accent="copper" />
            <MetricCard label="Catalogue connectors" value={String(overviewQuery.data?.connectors.length ?? '—')} footnote="Connectors that can be installed or requested by integration teams." accent="gold" />
          </section>

          <Panel eyebrow="Workspace inventory" title="Each workspace is a safe operating surface">
            <div className="grid gap-4 xl:grid-cols-2">
              {workspaces.map((workspace) => (
                <Card key={workspace.id} className="bg-ivory-25 shadow-none">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl text-ink-950">{workspace.name}</h2>
                      <p className="mt-2 text-sm leading-7 text-ink-700">{workspace.description || 'No description supplied yet.'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {workspace.isDefault ? <Badge tone="accent">Default</Badge> : null}
                      <StatusBadge value={workspace.status} />
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <DetailRow label="Slug" value={workspace.slug} />
                    <DetailRow label="Workspace ID" value={workspace.id} />
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {[
                      [UsersRound, 'Members', 'Workspace membership controls who can read or administer this scope.'],
                      [PlugZap, 'Connectors', 'Connector installs should bind to a workspace before production credentials are added.'],
                      [Boxes, 'Selectors', 'Selectors can be reviewed against workspace source systems before broad rollout.'],
                    ].map(([Icon, title, body]) => (
                      <div key={title as string} className="rounded-2xl border border-ink-900/8 bg-white/45 p-3">
                        <Icon className="size-4 text-sage-700" />
                        <p className="mt-2 text-sm font-semibold text-ink-950">{title as string}</p>
                        <p className="mt-1 text-xs leading-5 text-ink-600">{body as string}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </Panel>

          <Card className="bg-sage-600/10">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-1 size-5 text-sage-700" />
              <p className="text-sm leading-7 text-ink-700">
                Early customers can start with one workspace and add more when they need environment separation, regional deployment boundaries, or team-level API clients.
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
