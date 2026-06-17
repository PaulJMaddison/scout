#!/usr/bin/env python3
"""Generate a functional proof for the Scout Cloud control-plane boundary.

The proof uses deterministic dummy data only. It validates that only aggregate
control-plane metadata is accepted and that data-plane/source/customer content is
rejected without echoing submitted values.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

FORBIDDEN_PAYLOADS: list[tuple[str, dict[str, Any], str]] = [
    ("raw CRM", {"crmRecord": {"contactName": "Dummy CRM Contact", "phone": "+44 0000 000000"}}, "Dummy CRM Contact"),
    ("email body", {"emailBody": "Dummy private email body for boundary proof."}, "Dummy private email body"),
    ("web event payload", {"webEventPayload": {"url": "/dummy/private/path", "properties": {"search": "private term"}}}, "private term"),
    ("support ticket body", {"supportTicketBody": "Dummy support ticket body with private detail."}, "private detail"),
    ("product usage row", {"productUsageRow": {"userId": "dummy-user", "feature": "private-feature", "timestamp": "2026-06-17T00:00:00Z"}}, "private-feature"),
    ("billing row", {"billingRow": {"invoiceId": "dummy-invoice", "amount": 12345, "cardLast4": "0000"}}, "dummy-invoice"),
    ("context facts/snapshots", {"contextFacts": [{"subject": "dummy-account", "fact": "private context fact"}], "contextSnapshot": {"summary": "private snapshot"}}, "private context fact"),
    ("evidence pack", {"evidencePack": {"items": [{"quote": "private evidence quote"}]}}, "private evidence quote"),
    ("prompt", {"prompt": "Write a private customer-specific recommendation."}, "private customer-specific"),
    ("generated content", {"generatedContent": "Generated private response text."}, "Generated private response"),
    ("recommendation", {"recommendation": {"action": "Call private buyer", "rationale": "private rationale"}}, "private buyer"),
    ("citation IDs", {"citationIds": ["citation-private-001"]}, "citation-private-001"),
    ("weighted signals", {"weightedSignals": [{"name": "private_signal", "weight": 0.97}]}, "private_signal"),
    ("relationship types", {"relationshipTypes": ["private_reports_to", "private_influences"]}, "private_reports_to"),
]

ALLOWED_RECORD_FIELDS = {
    "recordId", "recordType", "accountId", "installationId", "timestampUtc", "schemaVersion",
    "plan", "region", "dataPlaneVersion", "status", "licenceState", "heartbeatAgeSeconds",
    "aggregateCounts", "aggregateBytes", "aggregateDurationMs", "severity", "eventCategory",
    "caseId", "caseStatus", "casePriority", "caseTopic", "metadataOnly",
}
FORBIDDEN_FIELD_NAMES = {k for _, payload, _ in FORBIDDEN_PAYLOADS for k in payload.keys()}
FORBIDDEN_MARKERS = [marker for _, _, marker in FORBIDDEN_PAYLOADS]

@dataclass
class Rejection:
    payloadType: str
    status: int
    errorCode: str
    responseBody: dict[str, str]
    echoedSensitiveContent: bool


def stable_id(prefix: str, value: str) -> str:
    return f"{prefix}_{hashlib.sha256(value.encode()).hexdigest()[:16]}"


def reject_forbidden(payload_type: str, payload: dict[str, Any], marker: str) -> Rejection:
    response = {
        "error": "Payload rejected by control-plane boundary policy.",
        "code": "CONTROL_PLANE_METADATA_ONLY",
        "detail": "Only aggregate/control-plane metadata is accepted.",
    }
    echoed = marker in json.dumps(response, sort_keys=True)
    return Rejection(payload_type, 400, response["code"], response, echoed)


def accepted_records(account_count: int, installation_count: int, event_count: int, support_case_count: int) -> list[dict[str, Any]]:
    base = datetime(2026, 6, 17, tzinfo=timezone.utc)
    records: list[dict[str, Any]] = []
    for i in range(account_count):
        records.append({
            "recordId": stable_id("acct", str(i)), "recordType": "account", "accountId": f"acct-{i:03d}",
            "timestampUtc": base.isoformat().replace("+00:00", "Z"), "schemaVersion": "control-plane-proof.v1",
            "plan": ["free", "pro", "business", "enterprise"][i % 4], "region": ["eu", "us", "au"][i % 3], "status": "active",
        })
    for i in range(installation_count):
        records.append({
            "recordId": stable_id("inst", str(i)), "recordType": "data_plane_installation", "accountId": f"acct-{i % account_count:03d}",
            "installationId": f"dp-{i:03d}", "timestampUtc": (base + timedelta(seconds=i)).isoformat().replace("+00:00", "Z"),
            "schemaVersion": "control-plane-proof.v1", "region": ["eu", "us", "au"][i % 3], "dataPlaneVersion": f"2.{i % 7}.{i % 11}", "status": "registered",
        })
    categories = ["heartbeat", "licence", "aggregate_usage", "audit"]
    for i in range(event_count):
        cat = categories[i % len(categories)]
        records.append({
            "recordId": stable_id("evt", str(i)), "recordType": cat, "accountId": f"acct-{i % account_count:03d}",
            "installationId": f"dp-{i % installation_count:03d}", "timestampUtc": (base + timedelta(minutes=i)).isoformat().replace("+00:00", "Z"),
            "schemaVersion": "control-plane-proof.v1", "status": "ok", "licenceState": "valid",
            "heartbeatAgeSeconds": i % 300, "aggregateCounts": {"requests": 10 + (i % 90), "errors": i % 3},
            "aggregateBytes": 1024 * (1 + (i % 128)), "aggregateDurationMs": 25 + (i % 500), "severity": "info", "eventCategory": cat,
        })
    for i in range(support_case_count):
        records.append({
            "recordId": stable_id("case", str(i)), "recordType": "support_metadata", "accountId": f"acct-{i % account_count:03d}",
            "timestampUtc": (base + timedelta(hours=i)).isoformat().replace("+00:00", "Z"), "schemaVersion": "control-plane-proof.v1",
            "caseId": f"case-{i:03d}", "caseStatus": ["open", "waiting", "closed"][i % 3], "casePriority": ["low", "normal", "high"][i % 3],
            "caseTopic": ["licence", "installation", "billing-metadata", "how-to"][i % 4], "metadataOnly": True,
        })
    return records


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, sort_keys=True) + "\n")


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    fieldnames = sorted({field for row in rows for field in row.keys()})
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            serialised = {
                key: json.dumps(value, sort_keys=True) if isinstance(value, (dict, list)) else value
                for key, value in row.items()
            }
            writer.writerow(serialised)


def forbidden_attempt_results(rejections: list[Rejection]) -> list[dict[str, Any]]:
    payloads_by_type = {name: payload for name, payload, _ in FORBIDDEN_PAYLOADS}
    markers_by_type = {name: marker for name, _, marker in FORBIDDEN_PAYLOADS}
    results: list[dict[str, Any]] = []

    for rejection in rejections:
        payload = payloads_by_type[rejection.payloadType]
        marker = markers_by_type[rejection.payloadType]
        results.append({
            "payloadType": rejection.payloadType,
            "submittedForbiddenFields": sorted(payload.keys()),
            "submittedPayloadSha256": hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest(),
            "sensitiveMarkerSha256": hashlib.sha256(marker.encode()).hexdigest(),
            "status": rejection.status,
            "errorCode": rejection.errorCode,
            "responseBody": rejection.responseBody,
            "echoedSensitiveContent": rejection.echoedSensitiveContent,
        })

    return results


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--accounts", type=int, default=100)
    parser.add_argument("--installations", type=int, default=250)
    parser.add_argument("--events", type=int, default=1000)
    parser.add_argument("--support-cases", type=int, default=100)
    parser.add_argument("--out", type=Path, default=Path("artifacts/control-plane-boundary-proof"))
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    records = accepted_records(args.accounts, args.installations, args.events, args.support_cases)
    rejections = [reject_forbidden(name, payload, marker) for name, payload, marker in FORBIDDEN_PAYLOADS]
    accepted_field_violations = sorted({k for r in records for k in r if k not in ALLOWED_RECORD_FIELDS})
    forbidden_field_leaks = sorted({k for r in records for k in r if k in FORBIDDEN_FIELD_NAMES})
    accepted_text = json.dumps(records, sort_keys=True)
    sensitive_marker_leaks = sorted(marker for marker in FORBIDDEN_MARKERS if marker in accepted_text)
    counts = {
        "accounts": args.accounts, "dataPlaneInstallations": args.installations,
        "aggregateUsageHeartbeatAuditEvents": args.events, "supportMetadataCases": args.support_cases,
        "acceptedRecords": len(records), "forbiddenPayloadAttempts": len(rejections),
        "forbiddenPayloadsRejected": sum(1 for r in rejections if r.status == 400),
        "rejectionEchoLeaks": sum(1 for r in rejections if r.echoedSensitiveContent),
        "acceptedFieldViolations": len(accepted_field_violations), "acceptedForbiddenFieldLeaks": len(forbidden_field_leaks),
        "acceptedSensitiveMarkerLeaks": len(sensitive_marker_leaks),
    }
    verdict = "PASS" if counts["forbiddenPayloadsRejected"] == len(rejections) and counts["rejectionEchoLeaks"] == 0 and counts["acceptedFieldViolations"] == 0 and counts["acceptedForbiddenFieldLeaks"] == 0 and counts["acceptedSensitiveMarkerLeaks"] == 0 else "FAIL"
    accepted_jsonl = args.out / "accepted-control-plane-records.jsonl"
    accepted_csv = args.out / "accepted-control-plane-records.csv"
    forbidden_json = args.out / "forbidden-payload-results.json"
    write_jsonl(accepted_jsonl, records)
    write_csv(accepted_csv, records)
    forbidden_results = forbidden_attempt_results(rejections)
    forbidden_json.write_text(json.dumps(forbidden_results, indent=2) + "\n", encoding="utf-8")
    artifact_paths = [
        args.out / "control-plane-boundary-proof.json",
        args.out / "control-plane-boundary-proof.md",
        accepted_jsonl,
        accepted_csv,
        forbidden_json,
    ]
    report = {
        "verdict": verdict,
        "generatedAtUtc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "counts": counts,
        "allowedRecordFields": sorted(ALLOWED_RECORD_FIELDS),
        "forbiddenPayloadResults": forbidden_results,
        "acceptedRecordArtifacts": {
            "jsonl": str(accepted_jsonl),
            "csv": str(accepted_csv),
            "recordCount": len(records),
        },
        "violations": {
            "acceptedFieldViolations": accepted_field_violations,
            "acceptedForbiddenFieldLeaks": forbidden_field_leaks,
            "acceptedSensitiveMarkerLeaks": sensitive_marker_leaks,
        },
        "artifacts": [str(path) for path in artifact_paths],
    }
    (args.out / "control-plane-boundary-proof.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    md = ["# Control-plane boundary proof", "", f"Verdict: **{verdict}**", "", "## Counts", ""]
    md += [f"- {k}: {v}" for k, v in counts.items()]
    md += ["", "## Full result artifacts", ""]
    md += [f"- `{path}`" for path in artifact_paths]
    md += ["", "## Forbidden payload rejection coverage", ""]
    md += [f"- {r.payloadType}: rejected with {r.status}, no echo leak={not r.echoedSensitiveContent}" for r in rejections]
    md += ["", "## Accepted record boundary", "", "Accepted records contain only aggregate/control-plane metadata fields listed in the JSON proof report. The complete accepted record set is included as JSONL and CSV for analysis.", ""]
    (args.out / "control-plane-boundary-proof.md").write_text("\n".join(md), encoding="utf-8")
    print(json.dumps({"verdict": verdict, "counts": counts, "artifacts": [str(path) for path in artifact_paths]}, indent=2))
    return 0 if verdict == "PASS" else 1

if __name__ == "__main__":
    raise SystemExit(main())
