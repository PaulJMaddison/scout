# @kynticai/scout-n8n-node

> KynticAI Scout community node for [n8n](https://n8n.io/) — ingest source-system events into the Scout semantic layer.

**Status:** local package readiness only. Not published to npm, not submitted to the n8n marketplace, no releases or tags created, no CI/CD configured.

## What This Node Does

The KynticAI Scout n8n node lets n8n workflows push source-system events (CRM updates, product usage, billing signals, web analytics) into a KynticAI Scout instance. Scout's selector engine then transforms these raw events into semantic context facts with confidence scores and provenance metadata.

Events are sent to the local Scout API route:

```text
POST /api/v1/events/source-system?tenantSlug=<tenant>
```

The node does not write directly to Scout database tables, connector internals, vector stores, or Cloud services.

### Key Safety Features

- **URL validation** — rejects embedded credentials, query strings, fragments, and non-HTTP(S) protocols in the API base URL.
- **Tenant/workspace slug validation** — enforces the Scout slug format (lower-case alphanumeric + hyphens).
- **Mapping-field validation** — rejects target fields that look like credentials or secrets (e.g. `api_key`, `password`, `bearer_token`).
- **Recursive sensitive-key redaction** — all log-safe output has credential-like keys replaced with `[REDACTED]` before any logging.
- **No credential logging** — API keys, bearer tokens, cookies, private keys, raw customer payloads, and secret-like fields are never logged or included in error output.

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **n8n** ≥ 1.0 (peer dependency — not required for tests)

## Install

```bash
cd packages/typescript/scout-n8n-node
npm install
```

## Build

```bash
npm run build
```

Compiled output lands in `dist/`.

## Test

```bash
npm test
```

Runs the full Vitest suite covering URL validation, identifier validation, field/secret rejection, recursive redaction, and fixture-based source-event mapping.

## Local Validation (All-in-One)

```bash
bash scripts/validate-local.sh
```

Runs install → test → build → `npm pack --dry-run` in sequence and exits on the first failure.

## Pack Dry-Run

```bash
npm run pack:dry-run
```

Lists the files that would be included in a published tarball without actually publishing.

## Installing in n8n (Local / Self-Hosted)

1. Build the package: `npm run build`
2. Create a tarball: `npm pack`
3. In your n8n instance's custom nodes directory, install the tarball:
   ```bash
   cd ~/.n8n/custom
   npm install /path/to/kynticai-scout-n8n-node-2.8.0.tgz
   ```
4. Restart n8n. The **KynticAI Scout** node and **KynticAI Scout API** credential will appear in the node palette.

## Node Configuration

| Parameter           | Required | Description                                                    |
|---------------------|----------|----------------------------------------------------------------|
| Tenant Slug         | Yes      | Scout tenant identifier (lower-case slug).                     |
| Workspace Slug      | No       | Optional workspace within the tenant.                          |
| Source System        | Yes      | Originating system name (e.g. `crm`, `product`, `web`).       |
| Event Type           | Yes      | Event type URN (e.g. `source.crm.deal_updated`).              |
| External User ID     | No       | External user identifier the event relates to.                 |
| External Account ID  | No       | External account identifier the event relates to.              |
| Payload (JSON)       | No       | Structured event payload. Sensitive keys are redacted in logs. |
| Mapping Fields       | No       | Comma-separated target field names to validate.                |

## Credential Configuration

| Parameter | Description                                              |
|-----------|----------------------------------------------------------|
| Base URL  | Root URL of the Scout API (e.g. `https://scout.example.com`). |
| API Key   | Bearer token or machine API key.                         |

The credential test sends a `GET /health/live` request to verify connectivity.

## Project Structure

```
scout-n8n-node/
├── src/
│   ├── index.ts                                 Package entry point
│   ├── credentials/
│   │   └── KynticAiScoutApi.credentials.ts      n8n credential descriptor
│   ├── nodes/
│   │   ├── KynticAiScout.node.ts                n8n node descriptor
│   │   └── sourceEventMapper.ts                 Event mapping + validation
│   └── validation/
│       ├── index.ts                             Re-exports
│       ├── url.ts                               Base-URL validation
│       ├── identifiers.ts                       Tenant/workspace slug validation
│       ├── fields.ts                            Mapping-field + secret rejection
│       └── redaction.ts                         Recursive sensitive-key redaction
├── tests/                                       Vitest test suite
├── fixtures/source-events/                      JSON test fixtures
├── scripts/validate-local.sh                    All-in-one local validation
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Licence

MIT — see the repository root [LICENSE](../../../LICENSE) file.
