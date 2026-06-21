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

Public status: local package readiness exists, but npm publication and n8n marketplace submission are not claimed.

## Local Build

```bash
cd packages/typescript/n8n-node
npm install
npm run build
npm test
npm run validate:local
```

`validate:local` runs the local build, focused tests, and `npm pack --dry-run`.
It does not publish to npm.

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

## Local Validation And Redaction

The node validates local configuration before sending an item:

- `baseUrl` must be an absolute HTTP or HTTPS URL without embedded credentials, query strings, or fragments.
- tenant and workspace slugs are trimmed, lowercased, and checked as slug values.
- input items must be JSON objects without circular references, functions, symbols, or BigInt values.
- mapped IDs and event names are checked against the Scout REST contract length limits.
- mapped field names cannot point at obvious credential or secret fields.

Payload keys such as `apiKey`, `token`, `secret`, `password`, `authorization`, `cookie`, `clientSecret`, `accessToken`, `refreshToken`, `privateKey`, `credential`, and `signature` are recursively replaced with `[REDACTED]` before the event is sent. Node HTTP errors report status/code hints only and do not echo request headers, API keys, or payload fragments.

Deterministic fixtures for local package checks live under:

```text
packages/typescript/n8n-node/fixtures
```

## Publication Blockers

Current n8n guidance expects community-node package metadata, node/credential entries in `package.json`, and release provenance for verified publication. This repository slice includes the local package metadata and tests, but deliberately does not add publish scripts, GitHub workflows, marketplace submission files, tags, releases, or deployment automation.

Before any package publication is reopened, decide whether the canonical plan package name `@kyntic/n8n-node` should remain or change to an n8n-verified naming pattern.
