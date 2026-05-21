# SaaS Billing And Usage Metering

KynticAI Scout now includes billing foundations without bundling a payment provider.

## Plans

The seeded plan catalogue contains `Free`, `Pro`, `Business`, and `Enterprise`.

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
