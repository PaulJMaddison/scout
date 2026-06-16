# Public API Contract

This page explains the public KynticAI Scout API contract for context consumers, selector tooling, provenance review, machine-to-machine access, and SDK usage.

Scout does not need to call an AI model to be useful. The core contract is that a customer-owned data plane turns approved operational signals into governed semantic context and evidence, then exposes that context to customer-owned apps, reports, workflows, agents, local LLMs, and AI tools through GraphQL, REST, SDKs, and context packages.

## Boundary

The public repo includes the open-core API surface, SDK scaffolds, selector engine, generic connectors, mock connectors, context facts, snapshots, provenance, audit, and extension points.

It does not include paid enterprise connector implementations, hosted account management, live billing, production SSO, vendor-certified connector packs, customer-specific mappings, or managed SaaS operations.

## Tenant And Workspace Scoping

Every context lookup is tenant-scoped. Human operators normally inherit their tenant from the signed-in JWT. API clients can request a tenant through query/input only when their credentials and role allow it.

Workspace concepts exist for API clients, event ingestion, webhook secrets, onboarding, and future control-plane metadata. Current context facts and snapshots are tenant-scoped in the open core. Treat workspace scoping for context facts as a future hardening area, not a production promise.

## Machine-To-Machine Auth

Create a scoped API client with a tenant-admin token:

```bash
curl -X POST "http://127.0.0.1:5198/api/v1/api-clients?tenantSlug=demo" \
  -H "Authorization: Bearer <tenant-admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Workflow context consumer",
    "workspaceSlug": "primary",
    "scopes": ["context:read", "context:write", "selectors:write", "audit:read"]
  }'
```

Exchange client credentials for a bearer token:

```bash
curl -X POST "http://127.0.0.1:5198/api/auth/token" \
  -H "Content-Type: application/json" \
  -d '{
    "grantType": "client_credentials",
    "clientId": "<client-id>",
    "clientSecret": "<client-secret>",
    "scope": "context:read context:write"
  }'
```

Canonical scopes are documented in [API Scope Contract](api-scopes.md). New integrations should use colon-form scopes such as `context:read`, `context:write`, `selectors:write`, `events:ingest`, and `audit:read`.

## REST V1 Examples

List the connector catalogue with executable/public boundary labels:

```bash
curl "http://127.0.0.1:5198/api/v1/connectors/catalogue?page=1&pageSize=100" \
  -H "Authorization: Bearer <token>"
```

Each connector row includes `availability`, `publicStatus`, `isIncludedInOpenCore`, `requiresCommercialAgreement`, and `isPlaceholder`. For example, `postgresql` is a public generic example that resolves to the open-core SQL connector, while `sqlServer`, `hubspot`, `salesforce`, `sharepoint`, `gmail`, and `legacy-dotnet-handlers` are metadata-only paid/private or customer-specific entries.

Read user context:

```bash
curl "http://127.0.0.1:5198/api/v1/context/users/123?tenantSlug=demo" \
  -H "Authorization: Bearer <token>"
```

Read account context:

```bash
curl "http://127.0.0.1:5198/api/v1/context/accounts/acct-123?tenantSlug=demo" \
  -H "Authorization: Bearer <token>"
```

Read semantic facts for a user:

```bash
curl "http://127.0.0.1:5198/api/v1/context/users/123/facts?tenantSlug=demo&attributeKey=health&page=1&pageSize=25" \
  -H "Authorization: Bearer <token>"
```

Read semantic facts aggregated from the latest account-user snapshots:

```bash
curl "http://127.0.0.1:5198/api/v1/context/accounts/acct-123/facts?tenantSlug=demo&page=1&pageSize=25" \
  -H "Authorization: Bearer <token>"
```

Retrieve a context snapshot:

```bash
curl "http://127.0.0.1:5198/api/v1/context/snapshots/<snapshot-id>?tenantSlug=demo" \
  -H "Authorization: Bearer <token>"
```

Request recomputation:

```bash
curl -X POST "http://127.0.0.1:5198/api/v1/context/recompute?tenantSlug=demo" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "externalUserId": "123",
    "triggeredBy": "crm-webhook"
  }'
```

Preview a selector:

```bash
curl -X POST "http://127.0.0.1:5198/api/v1/selectors/preview?tenantSlug=demo" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "externalUserId": "123",
    "selectorDefinitionId": "<selector-id>",
    "draftSelector": null
  }'
```

Validate a selector draft:

```bash
curl -X POST "http://127.0.0.1:5198/api/v1/selectors/validate?tenantSlug=demo" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "externalUserId": "123",
    "draftSelector": {
      "tenantSlug": "demo",
      "targetAttributeDefinitionId": "<attribute-id>",
      "name": "Preferred Channel",
      "description": "Map approved source field to a semantic channel.",
      "mappingKind": "DIRECT_FIELD_MAPPING",
      "expressionJson": "{\"rule\":{\"valuePath\":\"crm.preferredChannel\"}}",
      "explanationTemplate": "Preferred channel resolved from CRM as {{sourceValue}}.",
      "validationSchemaJson": "{\"requiredPaths\":[\"crm.preferredChannel\"]}",
      "defaultConfidence": 0.9,
      "freshnessWindowMinutes": 1440,
      "priority": 10
    }
  }'
```

Retrieve a governed context/evidence package without Scout calling an AI model:

```bash
curl -X POST "http://127.0.0.1:5198/api/v1/context/users/123/ai-safe-context-package?tenantSlug=demo" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "Prepare a renewal-risk brief for the account team."
  }'
```

Look up audit and provenance activity:

```bash
curl "http://127.0.0.1:5198/api/v1/audit-events?tenantSlug=demo&action=context&page=1&pageSize=25" \
  -H "Authorization: Bearer <token>"
```

## Webhook And Event Contracts

External systems can notify the customer data plane that approved source data changed. Webhooks are useful when the source system is a legacy application, ETL job, internal workflow, or vendor connector that should trigger selector recomputation without giving downstream consumers direct access to raw records.

Common event names for public examples and paid-pilot planning:

```json
{
  "eventId": "evt-demo-001",
  "eventType": "source.account.updated",
  "tenantSlug": "demo",
  "workspaceSlug": "primary",
  "occurredAtUtc": "2026-05-12T08:25:00Z",
  "externalAccountId": "ACC-DEMO-0123",
  "externalUserId": "123",
  "sourceSystem": "crm",
  "payload": {
    "changedFields": ["opportunityStage", "planInterest"]
  }
}
```

Use `source.account.updated`, `source.user.updated`, `source.support_ticket.updated`, `source.billing_status.updated`, `source.product_usage.rollup_ready`, `source.web_conversion.received`, and `context.recompute.requested` as starting vocabulary for pilots. Signing, timestamp tolerance, replay protection, and recomputation behaviour are documented in [Webhook Events](webhook-events.md).

The public repo includes the executable provider-neutral source-system event endpoint at `POST /api/v1/events/source-system`, event contracts, idempotency, webhook signing, audit records, and recomputation triggers. It does not include paid vendor webhook handlers, customer-specific event adapters, or private .NET handler packages.

## Pagination, Filtering, And Errors

List endpoints that support pagination return:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 25,
  "totalCount": 0,
  "hasMore": false
}
```

Errors use the v1 envelope:

```json
{
  "error": {
    "code": "context.user_not_found",
    "message": "User context was not found.",
    "correlationId": "crm-context-read-123",
    "details": null
  }
}
```

## GraphQL Examples

GraphQL samples live in [samples/graphql/demo-queries.graphql](../samples/graphql/demo-queries.graphql). They cover user context, account context, context snapshots, semantic catalogues, selector preview, selector validation, recomputation, audit events, governed context packages, prompt templates, and the mock agent-run path.

Use `salesContextPackage` when the consumer only needs grounded context. Use `createAgentRun` only for the example AI workflow where Scout calls the configured mock or provider-backed structured LLM client.

Direct semantic fact lookup is available when the consumer needs a narrow attribute rather than the full context payload:

```graphql
query DemoSemanticFactLookup {
  contextFacts(
    tenantSlug: "demo"
    externalUserId: "123"
    attributeKey: "health"
    skip: 0
    take: 25
  ) {
    attributeKey
    value
    confidence
    freshnessStatus
    provenance {
      sourceSystem
      sourceRecordId
    }
  }
}
```

## TypeScript SDK

```ts
import { createScoutClient } from '@kynticai/scout-sdk'

const bootstrap = createScoutClient({
  baseUrl: 'http://127.0.0.1:5198',
})

const token = await bootstrap.auth.getMachineToken({
  grantType: 'client_credentials',
  clientId: process.env.SCOUT_CLIENT_ID!,
  clientSecret: process.env.SCOUT_CLIENT_SECRET!,
  scope: 'context:read context:write audit:read',
})

const scout = createScoutClient({
  baseUrl: 'http://127.0.0.1:5198',
  accessToken: token.accessToken,
})

const context = await scout.users.getContext('demo', '123')
const account = await scout.accounts.getContext('demo', 'acct-123')
const facts = await scout.facts.getForUser('demo', '123', {
  attributeKey: 'health',
  page: 1,
  pageSize: 25,
})
const accountFacts = await scout.facts.getForAccount('demo', 'acct-123')
const snapshot = await scout.snapshots.getById('demo', context!.snapshotId)
const packageResult = await scout.packages.getAiContextForUser(
  'demo',
  '123',
  'Prepare a renewal-risk brief for the account team.',
)
const accepted = await scout.events.ingestSourceSystemEvent('demo', {
  eventId: 'evt-demo-001',
  sourceSystem: 'product',
  eventType: 'source.product_usage.rollup_ready',
  externalUserId: '123',
  payload: { activeDays30: 22 },
})
```

## C# SDK

```csharp
using KynticAI.Scout.Sdk;

using var bootstrap = new ScoutClient(new ScoutClientOptions
{
    BaseUrl = "http://127.0.0.1:5198"
});

var token = await bootstrap.Auth.GetMachineTokenAsync(
    new MachineTokenRequest(
        "client_credentials",
        Environment.GetEnvironmentVariable("SCOUT_CLIENT_ID")!,
        Environment.GetEnvironmentVariable("SCOUT_CLIENT_SECRET")!,
        "context:read context:write audit:read"));

using var scout = new ScoutClient(new ScoutClientOptions
{
    BaseUrl = "http://127.0.0.1:5198",
    AccessToken = token.AccessToken
});

var context = await scout.Users.GetContextAsync("demo", "123");
var account = await scout.Accounts.GetContextAsync("demo", "acct-123");
var facts = await scout.Facts.GetForUserAsync(
    "demo",
    "123",
    new ContextFactLookupOptions("health", 1, 25));
var accountFacts = await scout.Facts.GetForAccountAsync("demo", "acct-123");
var snapshot = await scout.Snapshots.GetByIdAsync("demo", context!.SnapshotId);
var packageResult = await scout.Packages.GetAiContextForUserAsync(
    "demo",
    "123",
    "Prepare a renewal-risk brief for the account team.");
var accepted = await scout.Events.IngestSourceSystemEventAsync(
    "demo",
    new SourceSystemEventRequest(
        EventId: "evt-demo-001",
        WorkspaceSlug: null,
        SourceSystem: "product",
        EventType: "source.product_usage.rollup_ready",
        Payload: new Dictionary<string, object?> { ["activeDays30"] = 22 },
        PayloadJson: null,
        ExternalUserId: "123",
        ExternalAccountId: null,
        ObservedAtUtc: null));
```

## Interactive API Documentation

When `Platform__EnableOpenApi=true` (the default in Development), interactive API documentation is available:

| UI | URL | Notes |
|---|---|---|
| **Scalar** (recommended) | `/api-docs` | Modern, searchable API reference |
| **Swagger UI** | `/swagger` | Classic OpenAPI explorer |

See [docs/api/README.md](api/README.md) for full details on viewing docs locally, exporting the OpenAPI spec, and authentication.

## Honest Gaps

The current public API is strong enough for local demos, backend-only integration tests, SDK examples, and first paid-pilot discovery. It is not yet a complete self-serve SaaS contract.

Known next steps:

- add first-class workspace scoping to context facts and snapshots if a customer pilot needs workspace-level isolation
- move more GraphQL list operations to explicit pagination contracts
- keep enterprise connector implementations, managed deployment code, and customer-specific mappings outside this public repo
