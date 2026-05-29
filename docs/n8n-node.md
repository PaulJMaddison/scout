# KynticAI n8n Node

The local `@kyntic/n8n-node` package lives at:

```text
packages/typescript/n8n-node
```

It is a write-only n8n community node that sends provider-neutral source-system events to KynticAI Scout:

```http
POST /api/v1/events/source-system?tenantSlug=<tenant>
```

The node does not read data back from Scout, publish packages, add release automation, or submit anything to the n8n marketplace.

## Local Build

```bash
cd packages/typescript/n8n-node
npm install
npm run build
npm test
```

## Credentials

Create n8n credentials with:

- `baseUrl`: Scout API base URL.
- `apiClientId`: machine API client identifier.
- `apiKey`: machine API key with the `events:ingest` scope.

## Event Mapping

Each incoming n8n item becomes one Scout event. Configure:

- tenant slug
- optional workspace slug
- source system
- event type
- optional event ID field
- optional external user ID field
- optional external account ID field
- optional observed-at timestamp field

When no event ID field is configured, the node creates a deterministic local fallback ID from the source system, event type, timestamp, and item index. Production workflows should prefer a stable upstream event ID for idempotency.

## Publication Blockers

Current n8n guidance expects community-node package metadata, node/credential entries in `package.json`, and release provenance for verified publication. This repository slice includes the local package metadata and tests, but deliberately does not add publish scripts, GitHub workflows, marketplace submission files, tags, releases, or deployment automation.

Before any package publication is reopened, decide whether the canonical plan package name `@kyntic/n8n-node` should remain or change to an n8n-verified naming pattern.
