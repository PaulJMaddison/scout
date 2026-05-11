import { useQuery } from '@tanstack/react-query'
import { FileJson, WandSparkles } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Badge, Button, Card, PageHeader, Panel } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import { prettyJson, safeJsonParse } from '@/lib/utils'
import { AdminEmptyState, AdminErrorState, AdminLoadingState, StatusBadge, Timestamp } from '@/features/admin/admin-components'

export function BlueprintImportsPage() {
  const { session } = useAuthSession()
  const tenantSlug = session?.tenantSlug ?? 'demo'
  const importsQuery = useQuery({
    queryKey: ['blueprintImports', tenantSlug],
    queryFn: () => api.getBlueprintImports(tenantSlug),
    enabled: Boolean(session),
  })

  if (!session) {
    return null
  }

  const imports = importsQuery.data ?? []

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Blueprint imports"
        title="Review every AI-assisted blueprint before and after it changes the semantic model."
        description="Blueprint history lets admins explain which generated file created data sources, semantic attributes, selectors, prompt templates, PII rules, and audit policies."
        actions={
          <Link to="/bootstrap-studio">
            <Button type="button">
              <WandSparkles className="size-4" />
              Open Bootstrap Studio
            </Button>
          </Link>
        }
      />

      {importsQuery.isLoading ? <AdminLoadingState label="Loading blueprint imports" /> : null}
      {importsQuery.isError ? <AdminErrorState error={importsQuery.error} /> : null}

      <Panel eyebrow="Import ledger" title="Blueprint files applied to this tenant">
        {imports.length === 0 && !importsQuery.isLoading ? (
          <AdminEmptyState
            title="No blueprint imports yet"
            body="Ask Codex, Claude, or ChatGPT to analyse sample schemas and create a ContextLayerBlueprint, then validate and import it through Bootstrap Studio."
            action={
              <Link to="/bootstrap-studio">
                <Button type="button">Import first blueprint</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4">
            {imports.map((item) => {
              const summary = safeJsonParse<Record<string, unknown>>(item.importSummaryJson, {})
              return (
                <Card key={item.id} className="bg-ivory-25 shadow-none">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <FileJson className="size-5 text-copper-700" />
                        <h2 className="font-display text-2xl text-ink-950">{item.name}</h2>
                        <StatusBadge value={item.status} />
                      </div>
                      <p className="mt-2 text-sm text-ink-700">Uploaded by {item.uploadedBy}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink-500">Uploaded <Timestamp value={item.uploadedAtUtc} /></p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.workspaceSlug ? <Badge tone="neutral">{item.workspaceSlug}</Badge> : null}
                      <Badge tone={item.validationIssueCount ? 'warning' : 'success'}>{item.validationIssueCount} issues</Badge>
                      <Badge tone="accent">{item.previewChangeCount} preview changes</Badge>
                    </div>
                  </div>
                  <pre className="mt-4 max-h-44 overflow-auto rounded-2xl bg-ink-950 p-4 text-xs leading-6 text-ivory-100">
                    {prettyJson(summary)}
                  </pre>
                </Card>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}
