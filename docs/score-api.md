# KynticAI Score API Contract

The public KynticAI Score API contract is defined at `schema/kyntic-score.openapi.yaml` using OpenAPI 3.1.

This is a contract-only surface. It defines request and response shapes that a local or hosted score service can implement; Scout does not calculate scores itself.

## Endpoints

| Method | Path | Response type |
|---|---|---|
| `POST` | `/v1/scores/investment` | `InvestmentScore` |
| `POST` | `/v1/scores/credit` | `CreditScore` |
| `POST` | `/v1/scores/job` | `JobScore` |

Each score response includes:

- `rating`: numeric 0-100 rating.
- `supportingEvidence`: up to five evidence points.
- `riskFlags`: up to three risk flags.
- `confidenceInterval`: lower and upper bounds for the rating.

## TypeScript Client

The TypeScript SDK exports `createKynticScoreClient`:

```ts
import { createKynticScoreClient } from '@kynticai/scout-sdk'

const scores = createKynticScoreClient({
  baseUrl: 'http://127.0.0.1:3016',
  accessToken: process.env.SCORE_TOKEN,
})

const result = await scores.createInvestmentScore({
  subject: {
    name: 'Example Infrastructure Ltd',
    sector: 'Industrial software',
  },
  horizon: 'medium_term',
  evidence: [
    {
      id: 'ev-001',
      summary: 'Recurring revenue grew across the last four quarters.',
      source: 'management-account-summary',
      weight: 0.8,
    },
  ],
})
```

The SDK validates response limits locally so consumers fail fast if a service returns a rating outside 0-100, more than five evidence points, more than three risk flags, or an invalid confidence interval.

## Samples

Sample request bodies live in `samples/score-api`:

- `investment-score-request.json`
- `credit-score-request.json`
- `job-score-request.json`
