# @kynticai/scout-connector-test-harness

Local test harness for validating KynticAI Scout connectors against public interfaces. Designed for connector authors to verify their work before submitting.

## What It Tests

| Suite | Checks |
|---|---|
| **manifest-shape** | connectorId, displayName, version (semver), description, supportedSourceTypes, requiredConfigFields, safeMetadataFields, sampleEntityMappings, configurationSchema, sampleConfiguration |
| **metadata-extraction** | Runs the `@kynticai/scout-metadata-audit` against the manifest's configurationSchema and optional sample records. Checks for error-level warnings and a minimum readiness score. |
| **entity-mapping** | At least one mapping declared, at least one uses a recognised public semantic attribute, source fields match sample record payloads when provided. |
| **error-handling** | Optional `fakeFetch` function: validates returned objects, tests graceful error throwing (proper `Error` instances), supports async fetch functions. |
| **unsafe-fields** | Checks safeMetadataFields, configurationSchema properties, sampleConfiguration keys, and entity mapping field names against the public unsafe-field blocklist (passwords, tokens, secrets, PII). |

## Installation

```bash
npm install @kynticai/scout-connector-test-harness
```

Or from the monorepo:

```bash
cd packages/typescript/scout-connector-test-harness
npm install
npm run build
```

## CLI Usage

```bash
# Validate a manifest file
npx scout-connector-test ./my-connector-manifest.json

# With sample records
npx scout-connector-test ./manifest.json --records ./sample-records.json

# Check for duplicate connector IDs
npx scout-connector-test ./manifest.json --known-ids sqlDatabase,restApi,mock

# JSON output for programmatic consumption
npx scout-connector-test ./manifest.json --json
```

## Programmatic Usage

```typescript
import { runTestHarness } from '@kynticai/scout-connector-test-harness'
import type { SampleConnectorDefinition } from '@kynticai/scout-connector-test-harness'

const definition: SampleConnectorDefinition = {
  manifest: {
    connectorId: 'myCustomCrm',
    displayName: 'My Custom CRM Connector',
    version: '1.0.0',
    description: 'Fetches customer data from My CRM.',
    supportedSourceTypes: ['Crm'],
    requiredConfigFields: [
      { name: 'endpoint', type: 'string', description: 'CRM API base URL.' },
    ],
    safeMetadataFields: ['connectorId', 'displayName', 'version'],
    sampleEntityMappings: [
      {
        sourceField: 'deal_probability',
        semanticAttribute: 'conversionProbability',
        description: 'Maps deal probability to conversion probability.',
      },
    ],
    configurationSchema: {
      type: 'object',
      required: ['endpoint'],
      properties: {
        endpoint: { type: 'string', description: 'CRM API base URL.' },
      },
    },
    sampleConfiguration: {
      endpoint: 'https://api.mycrm.example.com/v1',
    },
  },
  sampleRecords: [
    {
      externalUserId: 'user-001',
      observedAtUtc: '2026-05-20T10:00:00Z',
      payload: { deal_probability: 0.82, contact_channel: 'email' },
    },
  ],
  fakeFetch: (userId) => {
    if (userId === 'missing') throw new Error('User not found')
    return { deal_probability: 0.75, contact_channel: 'phone' }
  },
}

const report = await runTestHarness(definition, {
  knownConnectorIds: ['sqlDatabase', 'restApi', 'mock'],
  fetchTestUserIds: ['user-001', 'user-002'],
  errorTestUserId: 'missing',
})

console.log(`${report.passed ? 'PASSED' : 'FAILED'}: ${report.passedTests}/${report.totalTests}`)

for (const result of report.results) {
  if (!result.passed) {
    console.log(`  [FAIL] [${result.suite}] ${result.name}: ${result.message}`)
  }
}
```

## Manifest Format

The manifest must follow the public KynticAI Scout connector manifest schema. See [Connector Authoring Guide](../../../docs/connector-authoring.md) for the full specification.

Minimum required fields:

```json
{
  "connectorId": "myConnector",
  "displayName": "My Connector",
  "version": "1.0.0",
  "description": "Short description of the connector.",
  "supportedSourceTypes": ["Crm"],
  "requiredConfigFields": [
    { "name": "endpoint", "type": "string", "description": "API endpoint." }
  ],
  "safeMetadataFields": ["connectorId", "displayName"],
  "sampleEntityMappings": [
    { "sourceField": "source_field", "semanticAttribute": "conversionProbability" }
  ]
}
```

## Sample Records Format

```json
[
  {
    "externalUserId": "user-001",
    "observedAtUtc": "2026-05-20T10:00:00Z",
    "payload": {
      "deal_probability": 0.82,
      "contact_channel": "email"
    }
  }
]
```

## Report Structure

The `TestHarnessReport` includes:

- `connectorId` / `displayName` — from the manifest
- `passed` — overall pass/fail
- `totalTests` / `passedTests` / `failedTests` — counts
- `results` — array of `TestCaseResult` with `name`, `suite`, `passed`, `message`
- `manifestValidation` — raw output from `@kynticai/scout-connector-validator`
- `auditReport` — raw output from `@kynticai/scout-metadata-audit` (null if schema missing)

## Dependencies

- [`@kynticai/scout-connector-validator`](../scout-connector-validator) — manifest shape validation
- [`@kynticai/scout-metadata-audit`](../scout-metadata-audit) — metadata extraction audit

## Licence

MIT
