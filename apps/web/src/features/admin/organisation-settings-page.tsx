import { useQuery } from '@tanstack/react-query'
import { Building2, KeyRound, UsersRound, Workflow } from 'lucide-react'
import { Badge, Card, MetricCard, PageHeader, Panel } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import { DetailRow, AdminErrorState, AdminLoadingState, Timestamp } from '@/features/admin/admin-components'

export function OrganisationSettingsPage() {
  const { session } = useAuthSession()
  const tenantSlug = session?.tenantSlug ?? 'demo'
  const settingsQuery = useQuery({
    queryKey: ['organisationSettings', tenantSlug],
    queryFn: () => api.getOrganisationSettings(tenantSlug),
    enabled: Boolean(session),
  })

  if (!session) {
    return null
  }

  const settings = settingsQuery.data

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Organisation settings"
        title="Manage the tenant boundary customers trust for users, workspaces, API clients, and billing."
        description="This screen gives early customers a clear control-plane view of their organisation without exposing internal implementation tables."
        actions={<Badge tone={settings?.isActive ? 'success' : 'warning'}>{settings?.isActive ? 'Active tenant' : 'Tenant inactive'}</Badge>}
      />

      {settingsQuery.isLoading ? <AdminLoadingState /> : null}
      {settingsQuery.isError ? <AdminErrorState error={settingsQuery.error} /> : null}

      {settings ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Workspaces" value={String(settings.workspaceCount)} footnote="Bounded areas for teams, products, or integration scopes." accent="sage" />
            <MetricCard label="Users" value={String(settings.userCount)} footnote="Human operators with tenant-scoped roles." accent="copper" />
            <MetricCard label="API clients" value={String(settings.apiClientCount)} footnote="Active machine clients for external systems." accent="gold" />
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <Panel eyebrow="Tenant record" title={settings.tenantName}>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="Tenant slug" value={settings.tenantSlug} />
                <DetailRow label="Tenant ID" value={settings.tenantId} />
                <DetailRow label="Created" value={<Timestamp value={settings.createdAtUtc} />} />
                <DetailRow label="Last updated" value={<Timestamp value={settings.updatedAtUtc} />} />
              </div>
            </Panel>

            <Panel eyebrow="Commercial state" title="Plan and operating posture">
              <div className="grid gap-3 md:grid-cols-2">
                <Card className="bg-ivory-25 shadow-none">
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-1 size-5 text-copper-700" />
                    <div>
                      <p className="font-semibold text-ink-950">Plan</p>
                      <p className="mt-2 text-sm leading-6 text-ink-700">{settings.plan ?? 'No subscription record yet'}</p>
                    </div>
                  </div>
                </Card>
                <Card className="bg-ivory-25 shadow-none">
                  <div className="flex items-start gap-3">
                    <Workflow className="mt-1 size-5 text-sage-700" />
                    <div>
                      <p className="font-semibold text-ink-950">Subscription status</p>
                      <p className="mt-2 text-sm leading-6 text-ink-700">{settings.subscriptionStatus ?? 'No provider connected'}</p>
                    </div>
                  </div>
                </Card>
                <Card className="bg-ivory-25 shadow-none">
                  <div className="flex items-start gap-3">
                    <UsersRound className="mt-1 size-5 text-copper-700" />
                    <div>
                      <p className="font-semibold text-ink-950">Role model</p>
                      <p className="mt-2 text-sm leading-6 text-ink-700">Platform owner, tenant admin, integration admin, analyst, sales user, read-only, and API client roles are enforced by the API.</p>
                    </div>
                  </div>
                </Card>
                <Card className="bg-ivory-25 shadow-none">
                  <div className="flex items-start gap-3">
                    <KeyRound className="mt-1 size-5 text-sage-700" />
                    <div>
                      <p className="font-semibold text-ink-950">Security boundary</p>
                      <p className="mt-2 text-sm leading-6 text-ink-700">Tenant and workspace claims are issued at login and checked again server-side for admin reads and writes.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </Panel>
          </section>
        </>
      ) : null}
    </div>
  )
}
