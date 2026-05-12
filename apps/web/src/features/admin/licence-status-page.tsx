import { useQuery } from '@tanstack/react-query'
import { Badge, Card, MetricCard, PageHeader, Panel } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { AdminErrorState, AdminLoadingState, DetailRow, StatusBadge, Timestamp } from '@/features/admin/admin-components'
import { CloudCog, Download, FileKey2, ShieldCheck, WifiOff } from 'lucide-react'

export function LicenceStatusPage() {
  const licenceQuery = useQuery({
    queryKey: ['licenceStatus'],
    queryFn: api.getLicenceStatus,
  })

  const licence = licenceQuery.data
  const postureItems = licence
    ? [
        {
          Icon: ShieldCheck,
          title: 'Customer-owned data plane',
          body: 'Connectors, selectors, context snapshots, facts, provenance, and audit logs run in the customer environment.',
        },
        {
          Icon: CloudCog,
          title: 'Hosted control-plane seam',
          body: licence.controlPlaneBaseUrl ? `Configured at ${licence.controlPlaneBaseUrl}` : 'Not connected in this open-core build.',
        },
        {
          Icon: WifiOff,
          title: 'Offline operation',
          body: licence.isInOfflineGracePeriod ? 'The licence is in offline grace.' : 'The instance can run without a hosted service in community mode.',
        },
        {
          Icon: Download,
          title: 'Distribution path',
          body: 'Future paid modules can be delivered through private containers or package feeds without changing the open core.',
        },
      ]
    : []

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="Licence and deployment status"
        title="Licence status for community mode, paid self-hosted mode, or a future control-plane-connected mode."
        description="It is intentionally conservative: customer operational data stays in this environment, and the public repo only models the licence and update seams for future commercial modules."
        actions={licence ? <StatusBadge value={licence.status} /> : <Badge tone="neutral">Checking</Badge>}
      />

      {licenceQuery.isLoading ? <AdminLoadingState label="Checking licence and deployment status" /> : null}
      {licenceQuery.isError ? <AdminErrorState error={licenceQuery.error} /> : null}

      {licence ? (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Mode" value={licence.mode} footnote="Community mode remains useful without paid modules." accent="sage" />
            <MetricCard label="Plan" value={licence.plan} footnote="Plan metadata is local and provider-neutral." accent="gold" />
            <MetricCard label="Update channel" value={licence.updateChannel || 'stable'} footnote="Future private registries can use this seam." accent="copper" />
            <MetricCard label="Offline grace" value={`${licence.offlineGracePeriodDays} days`} footnote="Designed for customer-owned environments." accent="sage" />
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
            <Panel eyebrow="Local licence" title={licence.licensedTo}>
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailRow label="Status" value={<StatusBadge value={licence.status} />} />
                <DetailRow label="Fingerprint" value={licence.licenceKeyFingerprint} />
                <DetailRow label="Source" value={licence.source} />
                <DetailRow label="Last checked" value={<Timestamp value={licence.lastCheckedAtUtc} />} />
                <DetailRow label="Issued" value={<Timestamp value={licence.issuedAtUtc} />} />
                <DetailRow label="Expires" value={<Timestamp value={licence.expiresAtUtc} />} />
              </div>
              {licence.warnings.length ? (
                <div className="mt-4 rounded-3xl border border-gold-500/30 bg-gold-500/10 p-4 text-sm leading-6 text-ink-800">
                  {licence.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}
            </Panel>

            <Panel eyebrow="Control plane posture" title="No customer data leaves the data plane">
              <div className="grid gap-3">
                {postureItems.map(({ Icon, title, body }) => (
                  <Card key={title} className="bg-ivory-25 shadow-none">
                    <div className="flex gap-3">
                      <Icon className="mt-1 size-5 text-sage-700" />
                      <div>
                        <p className="font-semibold text-ink-950">{title}</p>
                        <p className="mt-1 text-sm leading-6 text-ink-700">{body}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Panel>
          </section>

          <Panel eyebrow="Entitlements" title="What this instance is allowed to use">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {licence.entitlements.map((entitlement) => (
                <Card key={entitlement.key} className="bg-ivory-25 shadow-none">
                  <div className="flex items-start gap-3">
                    <FileKey2 className="mt-1 size-5 text-copper-700" />
                    <div>
                      <p className="text-sm font-semibold text-ink-950">{entitlement.key}</p>
                      <p className="mt-1 text-sm leading-6 text-ink-700">{entitlement.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Panel>
        </>
      ) : null}
    </div>
  )
}
