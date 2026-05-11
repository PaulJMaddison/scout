import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Copy, KeyRound, RefreshCcw, ShieldOff } from 'lucide-react'
import { queryClient } from '@/app/providers'
import { Badge, Button, Card, Field, Input, PageHeader, Panel } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import { AdminEmptyState, AdminErrorState, AdminLoadingState, StatusBadge, Timestamp } from '@/features/admin/admin-components'

export function ApiClientsPage() {
  const { session } = useAuthSession()
  const tenantSlug = session?.tenantSlug ?? 'demo'
  const [displayName, setDisplayName] = useState('Revenue automation client')
  const [workspaceSlug, setWorkspaceSlug] = useState('')
  const [scopes, setScopes] = useState('context:read events:ingest')
  const [shownSecret, setShownSecret] = useState<string | null>(null)
  const clientsQuery = useQuery({
    queryKey: ['apiClients', tenantSlug],
    queryFn: () => api.getApiClients(tenantSlug),
    enabled: Boolean(session),
  })
  const createMutation = useMutation({
    mutationFn: () =>
      api.createApiClient({
        tenantSlug,
        workspaceSlug: workspaceSlug.trim() || null,
        displayName,
        scopes: scopes.split(/\s+/).filter(Boolean),
      }),
    onSuccess: async (result) => {
      setShownSecret(`${result.clientId}:${result.apiKey}`)
      await queryClient.invalidateQueries({ queryKey: ['apiClients', tenantSlug] })
    },
  })
  const rotateMutation = useMutation({
    mutationFn: (clientId: string) => api.rotateApiClient(tenantSlug, clientId),
    onSuccess: async (result) => {
      setShownSecret(`${result.clientId}:${result.apiKey}`)
      await queryClient.invalidateQueries({ queryKey: ['apiClients', tenantSlug] })
    },
  })
  const revokeMutation = useMutation({
    mutationFn: (clientId: string) => api.revokeApiClient(tenantSlug, clientId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apiClients', tenantSlug] }),
  })

  if (!session) {
    return null
  }

  const clients = clientsQuery.data ?? []

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="API clients"
        title="Create, rotate, and revoke machine credentials without ever storing plaintext API keys."
        description="External systems use API clients for REST, GraphQL, and event ingestion. New keys are shown once, then only hashed values remain in the backend."
        actions={<Badge tone="warning">Copy new secrets before leaving this screen</Badge>}
      />

      {clientsQuery.isLoading ? <AdminLoadingState label="Loading API clients" /> : null}
      {clientsQuery.isError ? <AdminErrorState error={clientsQuery.error} /> : null}

      {shownSecret ? (
        <Card className="border-gold-600/24 bg-gold-500/12">
          <p className="font-semibold text-ink-950">API key shown once</p>
          <p className="mt-2 text-sm leading-6 text-ink-700">Store this secret in your external system now. The backend cannot show it again after this response.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code className="max-w-full overflow-x-auto rounded-2xl bg-ink-950 px-4 py-3 text-xs text-ivory-50">{shownSecret}</code>
            <Button type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(shownSecret)}>
              <Copy className="size-4" />
              Copy
            </Button>
          </div>
        </Card>
      ) : null}

      <Panel eyebrow="Create client" title="Issue a new machine credential">
        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Display name">
            <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </Field>
          <Field label="Workspace slug" hint="optional">
            <Input value={workspaceSlug} onChange={(event) => setWorkspaceSlug(event.target.value)} placeholder="default" />
          </Field>
          <Field label="Scopes" hint="space-separated, e.g. context:read events:ingest">
            <Input value={scopes} onChange={(event) => setScopes(event.target.value)} />
          </Field>
        </div>
        <div className="mt-5">
          <Button type="button" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !displayName.trim()}>
            <KeyRound className="size-4" />
            {createMutation.isPending ? 'Creating…' : 'Create API client'}
          </Button>
        </div>
        {createMutation.isError ? <p className="mt-4 text-sm font-semibold text-rosewood-700">{createMutation.error.message}</p> : null}
      </Panel>

      <Panel eyebrow="Clients" title="Machine access inventory">
        {clients.length === 0 && !clientsQuery.isLoading ? (
          <AdminEmptyState
            title="No API clients yet"
            body="Create a scoped client when a CRM, warehouse job, webhook sender, or customer-owned integration needs server-to-server access."
          />
        ) : (
          <div className="grid gap-4">
            {clients.map((client) => (
              <Card key={client.id} className="bg-ivory-25 shadow-none">
                <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr_auto] xl:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-2xl text-ink-950">{client.displayName}</h2>
                      <StatusBadge value={client.status} />
                    </div>
                    <p className="mt-2 break-all text-sm text-ink-700">{client.clientId}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-ink-500">Last used: <Timestamp value={client.lastUsedAtUtc} /></p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {client.scopes.map((scope) => (
                      <Badge key={scope} tone="neutral">{scope}</Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <Button type="button" variant="secondary" onClick={() => rotateMutation.mutate(client.clientId)} disabled={rotateMutation.isPending || client.status === 'Revoked'}>
                      <RefreshCcw className="size-4" />
                      Rotate
                    </Button>
                    <Button type="button" variant="danger" onClick={() => revokeMutation.mutate(client.clientId)} disabled={revokeMutation.isPending || client.status === 'Revoked'}>
                      <ShieldOff className="size-4" />
                      Revoke
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
