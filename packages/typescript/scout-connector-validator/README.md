# @kynticai/scout-connector-validator

Public connector manifest validator for **KynticAI Scout**.

Validates connector manifest JSON files against the expected schema for public Scout connectors. Checks connector ID format, semantic versioning, supported source types, required configuration fields, safe metadata fields (rejects credential/PII leaks), and sample entity mappings.

## Installation

```bash
npm install @kynticai/scout-connector-validator
```

## Library Usage

```typescript
import { validateManifest } from '@kynticai/scout-connector-validator'

const manifest = {
  connectorId: 'myCrmConnector',
  displayName: 'My CRM Connector',
  version: '1.0.0',
  description: 'Connects to a fictional CRM.',
  supportedSourceTypes: ['Crm'],
  requiredConfigFields: [
    { name: 'endpoint', type: 'string', description: 'API base URL.' },
  ],
  safeMetadataFields: ['connectorId', 'displayName', 'version'],
  sampleEntityMappings: [
    {
      sourceField: 'deal_probability',
      semanticAttribute: 'conversionProbability',
      description: 'Maps deal probability to conversion probability.',
    },
  ],
}

const result = validateManifest(manifest)

if (result.isValid) {
  console.log('Manifest is valid.')
} else {
  console.error('Errors:', result.errors)
}

if (result.warnings.length > 0) {
  console.warn('Warnings:', result.warnings)
}
```

### Duplicate ID Detection

Pass `knownConnectorIds` to check for conflicts with existing connectors:

```typescript
const result = validateManifest(manifest, {
  knownConnectorIds: ['sqlDatabase', 'restApi', 'mock'],
})
```

## CLI Usage

```bash
# Validate a single manifest
npx scout-validate-manifest ./my-connector-manifest.json

# Validate a directory of manifests with duplicate ID detection
npx scout-validate-manifest ./manifests/ --check-duplicates
```

## Manifest Schema

| Field | Type | Required | Description |
|---|---|---|---|
| `connectorId` | `string` | Yes | Unique camelCase identifier (must start with a lowercase letter). |
| `displayName` | `string` | Yes | Human-readable name for the admin UI. |
| `version` | `string` | Yes | Semantic version (`MAJOR.MINOR.PATCH`). |
| `description` | `string` | Yes | Short technical description. |
| `supportedSourceTypes` | `string[]` | Yes | At least one of: `Crm`, `SqlMetric`, `EventStream`, `ProductUsage`. |
| `requiredConfigFields` | `RequiredConfigField[]` | Yes | Configuration fields the connector requires. |
| `safeMetadataFields` | `string[]` | Yes | Fields safe to expose in public metadata. |
| `sampleEntityMappings` | `SampleEntityMapping[]` | Yes | Sample mappings from source fields to semantic attributes. |
| `aliases` | `string[]` | No | Alternative names for the connector. |
| `capabilities` | `string[]` | No | Supported capabilities (e.g. `FetchSubject`, `Preview`). |
| `configurationSchema` | `JsonSchemaObject` | No | Full JSON Schema for the connector configuration. |
| `sampleConfiguration` | `object` | No | Example configuration satisfying all required schema fields. |

### RequiredConfigField

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Field name. |
| `type` | `string` | JSON Schema type (`string`, `number`, `integer`, `boolean`, `array`, `object`). |
| `description` | `string` | Human-readable description. |

### SampleEntityMapping

| Field | Type | Description |
|---|---|---|
| `sourceField` | `string` | Name of the field in the source system. |
| `semanticAttribute` | `string` | Target KynticAI Scout semantic attribute key. |
| `description` | `string` (optional) | Explanation of the mapping. |

## Validation Rules

- **Connector ID**: Must start with a lowercase letter and use camelCase (no hyphens or underscores).
- **Version**: Must follow semantic versioning (`MAJOR.MINOR.PATCH`, optional pre-release suffix).
- **Source types**: Unknown types produce warnings, not errors.
- **Safe metadata fields**: Fields matching known credential/PII patterns (`password`, `secret`, `token`, `apiKey`, `connectionString`, etc.) are rejected.
- **Entity mappings**: Unknown semantic attributes produce warnings, not errors.
- **Duplicate IDs**: Checked only when `knownConnectorIds` is provided.

## Exports

The package exports the validator function, all schema constants, and TypeScript types:

```typescript
import {
  validateManifest,
  KNOWN_SOURCE_TYPES,
  KNOWN_CAPABILITIES,
  KNOWN_SEMANTIC_ATTRIBUTES,
  UNSAFE_FIELD_NAMES,
  KNOWN_SCHEMA_TYPES,
  SEMVER_PATTERN,
  CONNECTOR_ID_PATTERN,
} from '@kynticai/scout-connector-validator'
```

## Licence

MIT
