# @universalcontextlayer/sdk

Typed TypeScript SDK for Universal Context Layer. It gives application teams a stable client surface instead of requiring them to work directly with the full GraphQL schema.

## SDK Folder Structure

```text
packages/typescript/contextlayer-sdk/
  src/
    client.ts
    errors.ts
    index.ts
    types.ts
  tests/
    client.test.ts
  package.json
  tsconfig.json
  vitest.config.ts
  README.md
```

## Supported Capabilities

- authentication
- tenant scoping
- user context lookup
- account context lookup
- context snapshot retrieval
- semantic fact lookup
- selector preview and validation
- context recompute requests
- AI context package retrieval
- audit event lookup
- typed error handling
- retries for transient failures
- request tracing headers

## Install

```bash
npm install @universalcontextlayer/sdk
```

## Quick Start

```ts
import { createContextLayerClient } from '@universalcontextlayer/sdk'

const contextLayer = createContextLayerClient({
  baseUrl: 'http://127.0.0.1:5198',
  accessToken: process.env.CONTEXT_LAYER_TOKEN,
})

const context = await contextLayer.users.getContext('demo', '123')
const facts = await contextLayer.facts.getForUser('demo', '123')
const snapshot = await contextLayer.snapshots.getLatestForUser('demo', '123')
const account = await contextLayer.accounts.getContext('demo', 'ACC-123')
```

## Tenant Scoped Usage

```ts
const demo = contextLayer.forTenant('demo')

const context = await demo.users.getContext('123')
const account = await demo.accounts.getContext('ACC-123')
const facts = await demo.facts.getForUser('123')
const auditEvents = await demo.audit.getEvents()
```

## Authentication

```ts
const session = await contextLayer.auth.login({
  tenantSlug: 'demo',
  email: 'admin@contextlayer.local',
  password: 'DemoAdmin123!',
})
```

Or provide a lazy token provider:

```ts
const contextLayer = createContextLayerClient({
  baseUrl: 'http://127.0.0.1:5198',
  getAccessToken: async () => process.env.CONTEXT_LAYER_TOKEN,
})
```

## Selector Preview

```ts
const preview = await contextLayer.selectors.preview({
  tenantSlug: 'demo',
  externalUserId: '123',
  draftSelector: {
    tenantSlug: 'demo',
    targetAttributeDefinitionId: '00000000-0000-0000-0000-000000000001',
    name: 'Preferred Channel',
    description: 'Test selector preview.',
    mappingKind: 'DIRECT_FIELD_MAPPING',
    expressionJson: '{"rule":{"valuePath":"crm.preferredChannel"}}',
    explanationTemplate: 'Preferred channel {{sourceValue}}.',
    validationSchemaJson: '{"requiredPaths":["crm.preferredChannel"]}',
    defaultConfidence: 0.9,
    freshnessWindowMinutes: 60,
    priority: 100,
  },
})
```

## Context Recompute

```ts
const queued = await contextLayer.recompute.queueForUser('demo', '123', 'crm-webhook')
```

## AI Context Package

```ts
const pkg = await contextLayer.packages.getAiContextForUser(
  'demo',
  '123',
  'Generate an account brief for the next renewal call.',
)
```

## Error Handling

```ts
import { ContextLayerError } from '@universalcontextlayer/sdk'

try {
  await contextLayer.users.getContext('demo', 'missing-user')
} catch (error) {
  if (error instanceof ContextLayerError) {
    console.log(error.code)
    console.log(error.correlationId)
  }
}
```

## Local Development

```bash
cd packages/typescript/contextlayer-sdk
npm install
npm run build
npm test
npm run pack:dry-run
```

Run the local API first:

```bash
./scripts/start-demo.ps1
```

## Versioning

- npm package version tracks the product release line, currently `1.1.x`
- additive API coverage can ship in minor versions
- breaking client contract changes require a major bump

## Packaging

- package name: `@universalcontextlayer/sdk`
- published files: `dist/` and `README.md`
- module format: ESM with type declarations

## Tests

Current tests cover:

- GraphQL user context lookup
- tenant-scoped delegation
- REST account context lookup
- transient retry handling
- typed problem-details error mapping
