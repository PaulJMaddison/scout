# KynticAI n8n Node

Local-only n8n community node package for sending provider-neutral source-system events to KynticAI Scout.

This package is intentionally write-only: it posts events to Scout and does not read data back from Scout, inspect credentials outside n8n's credential store, or call any hosted KynticAI service by default.

## Local Development

```bash
cd packages/typescript/n8n-node
npm install
npm run build
npm test
npm run validate:local
```

`validate:local` runs the TypeScript build, Vitest suite, and `npm pack --dry-run`.
It does not publish the package.

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

Local validation before each send:

- `baseUrl` must be an absolute HTTP or HTTPS URL without embedded credentials, query strings, or fragments.
- `tenantSlug` and `workspaceSlug` are trimmed, lowercased, and checked as slug values.
- each input item must be a JSON object that can be serialised without circular references, functions, symbols, or BigInt values.
- mapped IDs and event fields are checked against the Scout REST contract length limits before the HTTP request is made.
- field mappings cannot point at names that look like credentials or secrets.

Payload redaction is enabled by default. Keys such as `apiKey`, `token`, `secret`, `password`, `authorization`, `cookie`, `clientSecret`, `accessToken`, `refreshToken`, `privateKey`, `credential`, and `signature` are replaced with `[REDACTED]` recursively before the payload is sent to Scout. HTTP error messages reported by the node include status/code hints only and do not echo request headers, API keys, or payload fragments.

Deterministic local fixtures live in `fixtures/`:

- `source-event-item.json`
- `source-event-expected.json`

## Publication Blocker

Current n8n verification guidance requires community-node package metadata and provenance-backed publication. This local slice adds the package metadata and tests, but it does not add automated release machinery, publish scripts, marketplace submission files, or repository automation.
