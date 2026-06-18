# SaaS Billing And Usage Metering

KynticAI Scout now includes billing foundations without bundling a payment provider.

## Plans And Canonical Commercial Tiers

The public Scout repo keeps local billing and metering foundations provider-neutral. Seeded local plan values such as `Free`, `Pro`, `Business`, and `Enterprise` are legacy compatibility values in this open-core repo, not the canonical Cloud commercial product model.

Use these canonical tiers when aligning Scout documentation with Cloud commercial control:

| Canonical tier | Legacy/local compatibility values | Meaning |
| --- | --- | --- |
| Scout | `Free`; deprecated `Pro` | Public/open-core customer-owned data-plane tier. |
| Fortress | `Business`; `Enterprise` | Paid private runtime and Enterprise/Fortress extension tier. |
| Elite | `PrivateCloud` in Cloud as a highest-rank compatibility alias pending contract review | Operator-assisted strategic tier above Fortress. |

The Cloud control plane owns commercial subscription/licence/entitlement metadata for paid paths. Scout local billing records remain safe, provider-neutral usage and limit foundations so the open-source demo keeps working without Stripe, Paddle, or Cloud.

Each plan can define limits for:

- tenants
- workspaces
- users
- API clients
- selectors
- context lookups
- recomputations
- source events
- blueprint imports
- retention days

Plan definitions live in `saas_billing_plans`, and individual limits live in `saas_billing_plan_limits`. If a local demo database does not contain plan rows yet, the application falls back to safe in-code defaults so the open-source demo keeps working.

## Metering

Usage events are recorded in `saas_billing_usage_records` with tenant and optional workspace scope. The current implementation meters:

- successful context profile, account, and snapshot lookups
- queued recomputations
- accepted source-system events
- applied blueprint imports

The REST dashboard endpoint is:

```http
GET /api/v1/billing/usage
Authorization: Bearer <tenant-admin-jwt>
```

GraphQL exposes:

```graphql
query BillingUsage($tenantSlug: String!) {
  currentPlan(tenantSlug: $tenantSlug) {
    plan
    displayName
    limits {
      metric
      limit
      window
    }
  }

  billingUsage(tenantSlug: $tenantSlug) {
    plan
    status
    retentionDays
    usage {
      metric
      quantity
      limit
      remaining
    }
  }
}
```

The React admin console shows the same data at `/billing`.

## Enforcement

Write-side actions call the shared enforcement service before work is queued or persisted. Limit failures return a consistent REST error:

```json
{
  "error": {
    "code": "billing.limit_exceeded",
    "message": "The Pro plan allows 25,000 source events. Current usage is 25,000; requested 1.",
    "correlationId": "request-id",
    "details": {
      "metric": ["SourceEvents"],
      "plan": ["Pro"]
    }
  }
}
```

GraphQL maps the same condition to `BILLING_LIMIT_EXCEEDED` with extensions for tenant, plan, metric, limit, current usage, and requested quantity.

## Payment Provider Integration

No Stripe or Paddle code is included in the public repository. The clean extension seam is `IBillingProviderGateway`.

A provider module should:

- map Scout plans to provider price IDs
- create or reconcile provider customers
- create checkout and billing portal sessions
- receive provider webhooks in a SaaS-only module
- update `TenantSubscription` state from trusted provider events
- avoid making provider state the source of truth for internal usage records

The open-source repo registers a no-op provider gateway that reports `NotConnected`. This keeps local development safe while making the production integration point explicit.
