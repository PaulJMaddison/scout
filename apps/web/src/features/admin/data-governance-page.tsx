import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { EyeOff, FileCheck2, ShieldCheck } from 'lucide-react'
import { Badge, Button, Card, PageHeader, Panel } from '@/components/ui/primitives'
import { JsonViewer } from '@/components/data-display/json-viewer'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import { safeJsonParse } from '@/lib/utils'
import { AdminEmptyState, AdminErrorState, AdminLoadingState, StatusBadge } from '@/features/admin/admin-components'
import type { GovernancePolicy } from '@/lib/types'

export function DataGovernancePage() {
  const { session } = useAuthSession()
  const tenantSlug = session?.tenantSlug ?? 'demo'
  const [selectedPolicy, setSelectedPolicy] = useState<GovernancePolicy | null>(null)
  const policiesQuery = useQuery({
    queryKey: ['governancePolicies', tenantSlug],
    queryFn: () => api.getGovernancePolicies(tenantSlug),
    enabled: Boolean(session),
  })
  const grouped = useMemo(() => {
    const policies = policiesQuery.data ?? []
    return {
      piiRules: policies.filter((policy) => policy.policyType === 'PII rule'),
      auditPolicies: policies.filter((policy) => policy.policyType === 'Audit policy'),
    }
  }, [policiesQuery.data])

  if (!session) {
    return null
  }

  const policies = policiesQuery.data ?? []

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Data governance"
        title="Show customers which masking and audit policies govern AI-ready context."
        description="Governance policies make the semantic layer explainable: what is sensitive, how it should be masked, and which context access patterns must be audited."
        actions={<Badge tone="accent">{policies.length} active policy records</Badge>}
      />

      {policiesQuery.isLoading ? <AdminLoadingState label="Loading governance policies" /> : null}
      {policiesQuery.isError ? <AdminErrorState error={policiesQuery.error} /> : null}

      {policies.length === 0 && !policiesQuery.isLoading ? (
        <AdminEmptyState
          title="No governance policies yet"
          body="Import a blueprint with PII rules and audit policies so customers can see how context is masked, retained, and traced before production rollout."
        />
      ) : (
        <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
          <div className="grid gap-5">
            <PolicyPanel icon={<EyeOff className="size-5 text-copper-700" />} title="PII rules" policies={grouped.piiRules} onSelect={setSelectedPolicy} />
            <PolicyPanel icon={<FileCheck2 className="size-5 text-sage-700" />} title="Audit policies" policies={grouped.auditPolicies} onSelect={setSelectedPolicy} />
          </div>

          <Panel eyebrow="Policy definition" title={selectedPolicy?.displayName ?? 'Select a policy'}>
            {selectedPolicy ? (
              <div className="grid gap-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge value={selectedPolicy.status} />
                  <Badge tone="neutral">{selectedPolicy.policyType}</Badge>
                  <Badge tone="accent">{selectedPolicy.key}</Badge>
                </div>
                <p className="text-sm leading-7 text-ink-700">{selectedPolicy.description}</p>
                <JsonViewer value={safeJsonParse(selectedPolicy.definitionJson, {})} title="Policy JSON" height="h-[360px]" />
              </div>
            ) : (
              <AdminEmptyState
                title="Choose a governance policy"
                body="Policy JSON is shown here so security and integration teams can review exactly what the blueprint imported."
              />
            )}
          </Panel>
        </section>
      )}
    </div>
  )
}

function PolicyPanel({
  icon,
  title,
  policies,
  onSelect,
}: {
  icon: ReactNode
  title: string
  policies: GovernancePolicy[]
  onSelect: (policy: GovernancePolicy) => void
}) {
  return (
    <Panel eyebrow="Governance" title={title}>
      {policies.length === 0 ? (
        <Card className="bg-ivory-25 shadow-none">
          <p className="text-sm leading-6 text-ink-600">No {title.toLowerCase()} have been imported yet.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {policies.map((policy) => (
            <Card key={policy.id} className="bg-ivory-25 shadow-none">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {icon}
                  <div>
                    <p className="font-semibold text-ink-950">{policy.displayName}</p>
                    <p className="mt-1 text-sm leading-6 text-ink-600">{policy.description}</p>
                  </div>
                </div>
                <Button type="button" size="sm" variant="secondary" onClick={() => onSelect(policy)}>
                  <ShieldCheck className="size-4" />
                  Inspect
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Panel>
  )
}
