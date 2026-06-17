# UCL-only Cloud proof

Verdict: **PASS**

Enterprise was not called. The Enterprise input is a local JSON artifact only.

## Counts

- accounts: 300
- exactDataItems: 1000
- events: 6000
- relationshipSets: 300
- relationships: 400
- attributionPaths: 400
- failureCases: 5

## Cloud aggregate boundary

- Forbidden raw/relationship field hits: 0
- Metadata only: True

## Failure cases

- stale path: rejected — path freshness is older than policy window
- conflicting identity: quarantined — two source identities claim the same immutable external key
- insufficient history: not analysed — relationship has fewer than two supporting events
- masked user: included as aggregate only — masked identity is withheld from Cloud export
- unsafe Cloud export attempt: blocked — payload contained forbidden raw or relationship intelligence fields

## Artifacts

- `artifacts/ucl-cloud-proof/dataset-summary.json`
- `artifacts/ucl-cloud-proof/exact-data-items.json`
- `artifacts/ucl-cloud-proof/attribution-paths.json`
- `artifacts/ucl-cloud-proof/relationship-sets.json`
- `artifacts/ucl-cloud-proof/enterprise-analysis-input.json`
- `artifacts/ucl-cloud-proof/cloud-aggregate-payload.json`
- `artifacts/ucl-cloud-proof/validation-report.json`
- `artifacts/ucl-cloud-proof/proof-report.md`
