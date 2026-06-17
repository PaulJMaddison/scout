# Control-plane boundary proof

Verdict: **PASS**

## Counts

- accounts: 100
- dataPlaneInstallations: 250
- aggregateUsageHeartbeatAuditEvents: 1000
- supportMetadataCases: 100
- acceptedRecords: 1450
- forbiddenPayloadAttempts: 14
- forbiddenPayloadsRejected: 14
- rejectionEchoLeaks: 0
- acceptedFieldViolations: 0
- acceptedForbiddenFieldLeaks: 0
- acceptedSensitiveMarkerLeaks: 0

## Full result artifacts

- `artifacts/control-plane-boundary-proof/control-plane-boundary-proof.json`
- `artifacts/control-plane-boundary-proof/control-plane-boundary-proof.md`
- `artifacts/control-plane-boundary-proof/accepted-control-plane-records.jsonl`
- `artifacts/control-plane-boundary-proof/accepted-control-plane-records.csv`
- `artifacts/control-plane-boundary-proof/forbidden-payload-results.json`

## Forbidden payload rejection coverage

- raw CRM: rejected with 400, no echo leak=True
- email body: rejected with 400, no echo leak=True
- web event payload: rejected with 400, no echo leak=True
- support ticket body: rejected with 400, no echo leak=True
- product usage row: rejected with 400, no echo leak=True
- billing row: rejected with 400, no echo leak=True
- context facts/snapshots: rejected with 400, no echo leak=True
- evidence pack: rejected with 400, no echo leak=True
- prompt: rejected with 400, no echo leak=True
- generated content: rejected with 400, no echo leak=True
- recommendation: rejected with 400, no echo leak=True
- citation IDs: rejected with 400, no echo leak=True
- weighted signals: rejected with 400, no echo leak=True
- relationship types: rejected with 400, no echo leak=True

## Accepted record boundary

Accepted records contain only aggregate/control-plane metadata fields listed in the JSON proof report. The complete accepted record set is included as JSONL and CSV for analysis.
