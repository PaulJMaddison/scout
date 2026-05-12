import { useDeferredValue, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Search, ShieldCheck, UserCog } from 'lucide-react'
import { queryClient } from '@/app/providers'
import { Badge, Button, Card, Field, Input, PageHeader, Panel, Select } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import { formatDateTime } from '@/lib/utils'
import { AdminEmptyState, AdminErrorState, AdminLoadingState, StatusBadge } from '@/features/admin/admin-components'
import type { OperatorAccountSummary } from '@/lib/types'

const roleOptions = ['PlatformOwner', 'TenantAdmin', 'IntegrationAdmin', 'Analyst', 'SalesUser', 'ReadOnly']

function canManageUsers(role?: string) {
  return role === 'platform_owner' || role === 'tenant_admin'
}

export function UsersRolesPage() {
  const { session } = useAuthSession()
  const tenantSlug = session?.tenantSlug ?? 'demo'
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<OperatorAccountSummary | null>(null)
  const deferredSearch = useDeferredValue(search)
  const usersQuery = useQuery({
    queryKey: ['operatorAccounts', tenantSlug],
    queryFn: () => api.getOperatorAccounts(tenantSlug),
    enabled: Boolean(session),
  })
  const updateMutation = useMutation({
    mutationFn: (user: OperatorAccountSummary) =>
      api.updateOperatorAccount({
        tenantSlug,
        operatorAccountId: user.id,
        displayName: user.displayName,
        role: user.role,
        isActive: user.isActive,
      }),
    onSuccess: async () => {
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: ['operatorAccounts', tenantSlug] })
    },
  })

  const users = useMemo(() => {
    const term = deferredSearch.toLowerCase().trim()
    return (usersQuery.data ?? []).filter((user) =>
      [user.displayName, user.email, user.role, ...user.workspaces.map((workspace) => workspace.workspaceName)]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
  }, [deferredSearch, usersQuery.data])

  if (!session) {
    return null
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Users and roles"
        title="Give every operator the smallest useful role inside the tenant and workspace boundary."
        description="Paid pilot and customer data-plane operators need a clear place to see who can configure mappings, manage integrations, inspect context, and administer machine access."
        actions={<Badge tone={canManageUsers(session.role) ? 'success' : 'neutral'}>{canManageUsers(session.role) ? 'Role editing enabled' : 'Read only for your role'}</Badge>}
      />

      {usersQuery.isLoading ? <AdminLoadingState label="Loading users" /> : null}
      {usersQuery.isError ? <AdminErrorState error={usersQuery.error} /> : null}

      <Panel eyebrow="Directory" title="Tenant users">
        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-500" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-11" placeholder="Search user, email, role, or workspace" />
        </div>

        {users.length === 0 && !usersQuery.isLoading ? (
          <AdminEmptyState
            title="No users match this view"
            body="Invite or provision users during onboarding so admins, integration owners, analysts, and sales users can work without sharing credentials."
          />
        ) : (
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id} className="bg-ivory-25 shadow-none">
                <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr_auto] xl:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl text-ink-950">{user.displayName}</h2>
                      <StatusBadge value={user.isActive ? 'Active' : 'Disabled'} />
                    </div>
                    <p className="mt-2 break-all text-sm text-ink-700">{user.email}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-ink-500">Last login: {user.lastLoginAtUtc ? formatDateTime(user.lastLoginAtUtc) : 'not recorded'}</p>
                  </div>
                  <div className="grid gap-2">
                    <Badge tone="accent">{user.role}</Badge>
                    <div className="flex flex-wrap gap-2">
                      {user.workspaces.map((workspace) => (
                        <Badge key={workspace.workspaceId} tone="neutral">
                          {workspace.workspaceName} · {workspace.role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button type="button" variant="secondary" disabled={!canManageUsers(session.role)} onClick={() => setEditing(user)}>
                    <UserCog className="size-4" />
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Panel>

      {editing ? (
        <Panel eyebrow="Role change" title={`Update ${editing.email}`}>
          <div className="grid gap-4 lg:grid-cols-3">
            <Field label="Display name">
              <Input value={editing.displayName} onChange={(event) => setEditing({ ...editing, displayName: event.target.value })} />
            </Field>
            <Field label="Role">
              <Select value={editing.role} onChange={(event) => setEditing({ ...editing, role: event.target.value })}>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={editing.isActive ? 'active' : 'disabled'} onChange={(event) => setEditing({ ...editing, isActive: event.target.value === 'active' })}>
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </Select>
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button type="button" onClick={() => updateMutation.mutate(editing)} disabled={updateMutation.isPending}>
              <ShieldCheck className="size-4" />
              {updateMutation.isPending ? 'Saving…' : 'Save user'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
          {updateMutation.isError ? <p className="mt-4 text-sm font-semibold text-rosewood-700">{updateMutation.error.message}</p> : null}
        </Panel>
      ) : null}
    </div>
  )
}
