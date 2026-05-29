# KynticAI n8n Node

Local-only n8n community node package for sending provider-neutral source-system events to KynticAI Scout.

This package is intentionally write-only: it posts events to Scout and does not read data back from Scout, inspect credentials outside n8n's credential store, or call any hosted KynticAI service by default.

## Local Development

```bash
cd packages/typescript/n8n-node
npm install
npm run build
npm test
```

The package is not published from this repository state. The canonical plan's publish and marketplace steps remain blocked until release and workflow work is explicitly reopened.

## Node Behaviour

The `KynticAI Scout` node maps each incoming n8n item to:

```http
POST /api/v1/events/source-system?tenantSlug=<tenant>
```

Required credentials:

- `baseUrl`: Scout API base URL.
- `apiClientId`: machine API client identifier.
- `apiKey`: machine API key with the `events:ingest` scope.

Configurable node fields:

- tenant slug
- workspace slug
- source system
- event type
- event ID field
- external user ID field
- external account ID field
- observed-at timestamp field
- n8n workflow/execution metadata inclusion

## Publication Blocker

Current n8n verification guidance requires community-node package metadata and provenance-backed publication. This local slice adds the package metadata and tests, but it does not add automated release machinery, publish scripts, marketplace submission files, or repository automation.
