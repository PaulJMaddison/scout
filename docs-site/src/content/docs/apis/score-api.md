---
title: Score API Contract
description: OpenAPI 3.1 contract and TypeScript client surface for KynticAI Score requests.
---

The Score API contract is defined in `schema/kyntic-score.openapi.yaml`.
It is a contract-only surface for services that implement score calculation
outside the Scout API process.

| Method | Path | Response type |
|---|---|---|
| `POST` | `/v1/scores/investment` | `InvestmentScore` |
| `POST` | `/v1/scores/credit` | `CreditScore` |
| `POST` | `/v1/scores/job` | `JobScore` |

Each response has a 0-100 `rating`, up to five supporting evidence points, up
to three risk flags, and a confidence interval.

## TypeScript Client

```ts
import { createKynticScoreClient } from '@kynticai/scout-sdk'

const scores = createKynticScoreClient({
  baseUrl: 'http://127.0.0.1:3016',
  accessToken: process.env.SCORE_TOKEN,
})

const result = await scores.createJobScore({
  candidate: { name: 'Example Candidate' },
  role: {
    title: 'Principal Platform Engineer',
    requiredSkills: ['observability', 'technical leadership'],
  },
  evidence: [
    {
      id: 'ev-001',
      summary: 'Candidate has led production reliability work.',
      source: 'structured-interview-notes',
      weight: 0.85,
    },
  ],
})
```

The client validates the response limits locally so consumers detect contract
drift before using the score.

## Samples

Sample request bodies live in `samples/score-api`.
