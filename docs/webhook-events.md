# Webhook And Source-System Events

KynticAI Scout accepts provider-neutral source-system events at:

```http
POST /api/v1/events/source-system
```

The endpoint is designed for customer data-plane integrations where CRM, support, billing, warehouse, product, marketing, or legacy systems notify Scout that source data changed. Scout stores each event, validates signatures, deduplicates by event ID, matches selectors, and queues recomputation jobs when a user can be resolved.

In the local Docker install the API is published on `0.0.0.0:5198`, so a sender on the same trusted LAN/VPN can use an IP address instead of DNS:

```text
http://<host-ip>:5198/api/v1/events/source-system?tenantSlug=demo
```

IP-only HTTP is intended for local evaluation, workshops, private customer networks, VPNs, or static private IP installs. Public internet webhook endpoints should use HTTPS with stable DNS or a reverse proxy.

## Authentication And Signature

Use an API client created through `/api/v1/api-clients` with the `events:ingest` scope. For production-style pilots, create a separate webhook signing secret through `/api/v1/webhook-signing-secrets` and send:

```http
X-API-Client-Id: <clientId>
X-API-Key: <apiKey>
X-Scout-Webhook-Secret-Id: <webhookSecretId>
X-Scout-Webhook-Secret: <one-time-returned-webhook-secret>
X-Scout-Webhook-Timestamp: 2026-05-11T15:45:00.0000000Z
X-Scout-Webhook-Signature: sha256=<hex-hmac>
```

Signature input is:

```text
{timestamp}.{eventId}.{raw-request-body}
```

Webhook signing secrets are separate from API keys and are stored only as hashes. They can be created, listed, rotated, and revoked independently of API clients.

Timestamps must be within five minutes of the API server clock. Event IDs are replay-protected for webhook-secret-authenticated requests. The legacy API-key HMAC shape `{timestamp}.{raw-request-body}` remains accepted for compatibility, but it is not recommended for production pilots.

Provider-specific signature formats for Slack, GitHub, Stripe, or other vendors should plug in through a public provider adapter seam or a private enterprise implementation. Do not add private provider adapters to the public repo.

## Event Contract

```json
{
  "eventId": "evt_01HX9Y4QQQK8M5R2H4",
  "workspaceSlug": "primary",
  "sourceSystem": "warehouse",
  "eventType": "product_usage.updated",
  "externalUserId": "123",
  "externalAccountId": "acct-123",
  "observedAtUtc": "2026-05-11T15:45:00Z",
  "payload": {
    "activeDays30": 24,
    "featureEvents7": 58
  }
}
```

Rules:

- `eventId` is required and idempotent per tenant and source system.
- `workspaceSlug` is optional; Scout routes to the actor workspace or default workspace when omitted.
- `externalUserId` is preferred for selector recomputation.
- `externalAccountId` can be used when Scout can resolve an account contact to a user profile.
- `payload` can be any JSON object; alternatively send `payloadJson` when your client already has a serialized payload string.

Supported event types:

- `customer.created`
- `customer.updated`
- `account.updated`
- `opportunity.stage_changed`
- `product_usage.updated`
- `support_ticket.created`
- `billing.payment_failed`
- `email.engaged`
- `lifecycle.converted`
- `source_record.deleted`

## Processing States

- `Received`: signature and JSON validation passed, and the event was stored.
- `Ignored`: duplicate events and delete notifications are recorded but do not queue recomputation.
- `Processed`: Scout stored a user signal and, when selectors matched, queued selector executions plus a recomputation job.
- `Failed`: Scout could not process the event.
- `DeadLettered`: Scout retained a failed event for inspection, usually because routing keys did not resolve to a user profile.

Audit events are written for received, ignored, processed, and failed events.

## Examples

Customer created:

```json
{
  "eventId": "crm_customer_10001",
  "workspaceSlug": "primary",
  "sourceSystem": "crm",
  "eventType": "customer.created",
  "externalUserId": "123",
  "externalAccountId": "acct-123",
  "payload": {
    "name": "Avery Stone",
    "email": "avery@example.test",
    "company": "Acme Corp"
  }
}
```

Customer updated:

```json
{
  "eventId": "crm_customer_10001_update_2",
  "workspaceSlug": "primary",
  "sourceSystem": "crm",
  "eventType": "customer.updated",
  "externalUserId": "123",
  "externalAccountId": "acct-123",
  "payload": {
    "lifecycleStage": "Customer",
    "owner": "Jordan Kim"
  }
}
```

Account updated:

```json
{
  "eventId": "crm_account_acct_123_update_5",
  "workspaceSlug": "primary",
  "sourceSystem": "crm",
  "eventType": "account.updated",
  "externalAccountId": "acct-123",
  "payload": {
    "health": "Green",
    "renewalDate": "2026-09-30"
  }
}
```

Opportunity stage changed:

```json
{
  "eventId": "crm_oppty_778_stage_3",
  "sourceSystem": "crm",
  "eventType": "opportunity.stage_changed",
  "externalUserId": "123",
  "externalAccountId": "acct-123",
  "payload": {
    "opportunityId": "oppty-778",
    "previousStage": "Discovery",
    "stage": "Proposal"
  }
}
```

Product usage updated:

```json
{
  "eventId": "product_usage_user_123_20260511",
  "workspaceSlug": "primary",
  "sourceSystem": "product",
  "eventType": "product_usage.updated",
  "externalUserId": "123",
  "externalAccountId": "acct-123",
  "payload": {
    "activeDays30": 24,
    "featureEvents7": 58
  }
}
```

Support ticket created:

```json
{
  "eventId": "support_ticket_4451_created",
  "workspaceSlug": "primary",
  "sourceSystem": "support",
  "eventType": "support_ticket.created",
  "externalUserId": "123",
  "externalAccountId": "acct-123",
  "payload": {
    "ticketId": "4451",
    "priority": "High",
    "category": "Onboarding"
  }
}
```

Billing payment failed:

```json
{
  "eventId": "stripe_evt_9001",
  "sourceSystem": "billing",
  "eventType": "billing.payment_failed",
  "externalAccountId": "acct-123",
  "payload": {
    "invoiceId": "inv-9001",
    "amountDue": 1200,
    "currency": "USD"
  }
}
```

Email engaged:

```json
{
  "eventId": "marketing_email_881_opened",
  "workspaceSlug": "primary",
  "sourceSystem": "marketing",
  "eventType": "email.engaged",
  "externalUserId": "123",
  "externalAccountId": "acct-123",
  "payload": {
    "campaignId": "onboarding-nudge",
    "engagement": "opened"
  }
}
```

Lifecycle converted:

```json
{
  "eventId": "lifecycle_user_123_converted",
  "workspaceSlug": "primary",
  "sourceSystem": "lifecycle",
  "eventType": "lifecycle.converted",
  "externalUserId": "123",
  "externalAccountId": "acct-123",
  "payload": {
    "fromStage": "Trial",
    "toStage": "Paid"
  }
}
```

Source record deleted:

```json
{
  "eventId": "crm_contact_123_deleted",
  "workspaceSlug": "primary",
  "sourceSystem": "crm",
  "eventType": "source_record.deleted",
  "externalUserId": "123",
  "externalAccountId": "acct-123",
  "payload": {
    "object": "Contact",
    "sourceRecordId": "123"
  }
}
```

Inspect history through GraphQL:

```graphql
query EventHistory {
  sourceSystemEvents(
    tenantSlug: "demo"
    workspaceSlug: "primary"
    sourceSystem: "warehouse"
    status: "processed"
  ) {
    eventId
    eventType
    status
    matchedSelectorCount
    correlationId
    receivedAtUtc
  }
}
```
