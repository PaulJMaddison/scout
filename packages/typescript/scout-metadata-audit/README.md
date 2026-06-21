# @kynticai/scout-metadata-audit

Local-only metadata audit runner for KynticAI Scout connector manifests and sample data.

This tool analyses a connector manifest, optional schema, and optional sample records offline. It produces a structured report containing a schema summary, field classifications, missing metadata warnings, a connector readiness score, and safe recommendations. No live database, API, or customer connection is made.

## Usage

### CLI

```bash
cd packages/typescript/scout-metadata-audit
npm install && npm run build
node dist/cli.js data/sample-audit-input.json
```

The CLI reads a JSON file matching the `AuditInput` shape and writes the audit report to stdout.

### Programmatic

```ts
import { runAudit } from '@kynticai/scout-metadata-audit'
import type { AuditInput } from '@kynticai/scout-metadata-audit'

const input: AuditInput = {
  manifest: {
    connectorType: 'myCrm',
    displayName: 'My CRM Connector',
    description: 'Fictional CRM connector.',
    supportedDataSourceKinds: ['Crm'],
    configurationSchema: {
      type: 'object',
      required: ['tableName'],
      properties: {
        tableName: { type: 'string', description: 'Source table.' },
      },
    },
    sampleConfiguration: { tableName: 'contacts' },
  },
  sampleRecords: [
    {
      externalUserId: 'user-001',
      observedAtUtc: '2026-01-15T09:00:00Z',
      payload: { score: 82 },
    },
  ],
}

const report = runAudit(input)
console.log(JSON.stringify(report, null, 2))
```

## Input Shape

```jsonc
{
  "manifest": {                          // required
    "connectorType": "...",
    "displayName": "...",
    "description": "...",
    "aliases": [],                       // optional
    "supportedDataSourceKinds": ["Crm"],
    "supportedCapabilities": ["FetchSubject"], // optional
    "configurationSchema": { ... },
    "credentialSchema": { ... },         // optional
    "sampleConfiguration": { ... }
  },
  "sampleSchema": { ... },              // optional — overrides configurationSchema for field analysis
  "sampleRecords": [ ... ]              // optional — sample records for coverage analysis
}
```

See `data/sample-audit-input.json` for a complete example and `data/sample-audit-incomplete.json` for a deliberately incomplete manifest.

## Output

The audit report includes:

| Section | Description |
|---|---|
| `schemaSummary` | Total, required, optional, documented, and undocumented field counts plus type distribution. |
| `fieldClassifications` | Per-field classification: `semantic-attribute`, `identifier`, `timestamp`, `configuration`, `payload`, or `unknown`. |
| `warnings` | Missing or incomplete metadata with `error`, `warning`, or `info` severity. |
| `readinessScore` | Overall 0-100 score with breakdown: manifest completeness, schema quality, sample data coverage, capability breadth, documentation coverage. |
| `recommendations` | Safe, actionable suggestions grouped by `schema`, `metadata`, `sample-data`, `capabilities`, or `general`. |

## Field Classification

Fields are classified based on name patterns and the public Scout catalogue:

- **semantic-attribute** — matches one of the 13 reserved semantic attribute keys (e.g. `conversionProbability`, `churnRisk`).
- **identifier** — matches identifier patterns (`*Id`, `*userId`, `slug`, `*key`, `tenant*`).
- **timestamp** — matches temporal patterns (`*At`, `*date`, `*time`, `*utc`) or has `format: "date-time"`.
- **payload** — object or array typed fields.
- **configuration** — all other scalar fields.

## Readiness Score

The overall score is a weighted average of five dimensions:

| Dimension | Weight | What it measures |
|---|---|---|
| Manifest completeness | 30% | Required metadata fields present and non-empty. |
| Schema quality | 25% | Schema structure, required array, no validation errors. |
| Sample data coverage | 20% | Sample records present, with IDs, timestamps, and payloads. |
| Capability breadth | 10% | Fraction of the 8 public capabilities declared. |
| Documentation coverage | 15% | Fraction of schema properties with descriptions. |

## Tests

```bash
npm test
```

All tests use fake/local data. No external services or enterprise internals are referenced.

## Open-Core Boundary

This package is public-safe. It uses only the public Scout connector catalogue (6 connector types, 13 semantic attribute keys, 4 data source kinds, 8 capabilities). It does not reference enterprise connectors, private runtime features, private vector-store integrations, embedded LLMs, or customer data.
