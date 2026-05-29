---
title: n8n Node
description: Local KynticAI Scout n8n node for source-system event ingestion.
---

The local n8n package lives in `packages/typescript/n8n-node`.

It is a write-only node for sending provider-neutral source-system events to:

```http
POST /api/v1/events/source-system?tenantSlug=<tenant>
```

## Local Checks

```bash
cd packages/typescript/n8n-node
npm install
npm run build
npm test
```

## Credentials

- `baseUrl`
- `apiClientId`
- `apiKey`

The API client should have the `events:ingest` scope.

## Mapping

Each input item maps to one Scout event. Configure the tenant, source system,
event type, optional workspace slug, event ID field, external user ID field,
external account ID field, and observed-at field.

Publication, marketplace submission, release automation, tags, and workflow
changes are outside this local package slice.
