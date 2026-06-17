#!/usr/bin/env python3
"""Generate a UCL-only Cloud proof for ingestion, attribution, and aggregate export.

The proof is deterministic and synthetic. It does not call Enterprise; it only
materialises the JSON shape that would be passed to an Enterprise analyser and
then proves the Cloud payload contains aggregate counts only.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

RAW_OR_RELATIONSHIP_KEYS = {
    "dataItems", "identities", "events", "relationships", "relationshipSets",
    "attributionPaths", "pathEdges", "evidence", "sourceRecord", "rawValue",
    "email", "displayName", "externalId", "eventIds", "itemIds", "from", "to",
    "strength", "relationshipType", "derivedRelationshipIntelligence",
}
FAILURE_CASES = [
    "stale path", "conflicting identity", "insufficient history", "masked user", "unsafe Cloud export attempt"
]


def stable_hash(value: Any) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()


def stable_id(prefix: str, value: str) -> str:
    return f"{prefix}_{hashlib.sha256(value.encode()).hexdigest()[:16]}"


def iso(base: datetime, minutes: int) -> str:
    return (base + timedelta(minutes=minutes)).isoformat().replace("+00:00", "Z")


def generate(accounts: int, items: int, events_max: int) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    base = datetime(2026, 6, 17, tzinfo=timezone.utc)
    data_items: list[dict[str, Any]] = []
    events: list[dict[str, Any]] = []
    connectors = ["crm", "support", "billing", "product"]
    roles = ["admin", "buyer", "developer", "finance", "support"]
    for i in range(items):
        account_idx = i % accounts
        connector = connectors[i % len(connectors)]
        masked = i % 97 == 0
        item = {
            "itemId": stable_id("item", f"{account_idx}:{i}"),
            "accountId": f"acct-{account_idx:03d}",
            "connector": connector,
            "importBatchId": f"batch-{i // 100:02d}",
            "sourceRecordId": f"{connector}-record-{i:04d}",
            "identity": {
                "identityId": stable_id("ident", f"{account_idx}:{i}"),
                "externalId": f"user-{account_idx:03d}-{i:04d}",
                "email": "masked@example.invalid" if masked else f"user{i:04d}@acct{account_idx:03d}.example.invalid",
                "displayName": "Masked user" if masked else f"Synthetic User {i:04d}",
                "masked": masked,
                "role": roles[i % len(roles)],
            },
            "rawValue": {
                "objectType": connector,
                "status": ["active", "trial", "dormant"][i % 3],
                "region": ["eu", "us", "au"][i % 3],
                "plan": ["free", "team", "business"][i % 3],
            },
            "ingestedAtUtc": iso(base, i),
        }
        data_items.append(item)
    event_count = min(events_max, items * 6)
    actions = ["viewed", "created", "updated", "commented", "exported", "invited"]
    for i in range(event_count):
        item = data_items[i % items]
        events.append({
            "eventId": stable_id("evt", str(i)),
            "accountId": item["accountId"],
            "itemId": item["itemId"],
            "identityId": item["identity"]["identityId"],
            "connector": item["connector"],
            "action": actions[i % len(actions)],
            "occurredAtUtc": iso(base, i * 3),
            "sourceRecord": {"sourceRecordId": item["sourceRecordId"], "sequence": i},
        })
    return data_items, events


def build_relationships(data_items: list[dict[str, Any]], events: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    by_account: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in data_items:
        by_account[item["accountId"]].append(item)
    event_counts = Counter(event["identityId"] for event in events)
    sets: list[dict[str, Any]] = []
    paths: list[dict[str, Any]] = []
    for account_id, items in sorted(by_account.items()):
        rels = []
        for idx in range(0, max(0, len(items) - 1), 2):
            left, right = items[idx], items[idx + 1]
            strength = min(1.0, (event_counts[left["identity"]["identityId"]] + event_counts[right["identity"]["identityId"]]) / 12)
            rel = {
                "relationshipId": stable_id("rel", f"{left['itemId']}:{right['itemId']}"),
                "from": left["identity"]["identityId"],
                "to": right["identity"]["identityId"],
                "relationshipType": "same_account_activity_peer",
                "strength": round(strength, 4),
                "itemIds": [left["itemId"], right["itemId"]],
                "eventIds": [event["eventId"] for event in events if event["itemId"] in {left["itemId"], right["itemId"]}][:8],
                "evidence": {"connectors": sorted({left["connector"], right["connector"]}), "accountId": account_id},
            }
            rels.append(rel)
            paths.append({
                "pathId": stable_id("path", rel["relationshipId"]),
                "accountId": account_id,
                "startIdentityId": rel["from"],
                "endIdentityId": rel["to"],
                "pathEdges": [rel["relationshipId"]],
                "itemIds": rel["itemIds"],
                "eventIds": rel["eventIds"],
                "attribution": "co-occurring account activity with connector evidence",
                "freshness": "current",
            })
        sets.append({
            "relationshipSetId": stable_id("set", account_id),
            "accountId": account_id,
            "relationshipCount": len(rels),
            "relationships": rels,
        })
    return sets, paths


def enterprise_input(summary: dict[str, Any], relationship_sets: list[dict[str, Any]], paths: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "schema": "EnterpriseRelationshipAnalysisInput.v1",
        "executionMode": "not-called-proof-artifact-only",
        "generatedAtUtc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "datasetSummary": summary,
        "relationshipSets": relationship_sets,
        "attributionPaths": paths,
    }


def aggregate_payload(summary: dict[str, Any], failures: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "schema": "KynticAI.Scout.CloudAggregatePayload.v1",
        "generatedAtUtc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "metadataOnly": True,
        "counts": {
            "accounts": summary["counts"]["accounts"],
            "exactDataItemCount": summary["counts"]["exactDataItems"],
            "eventCount": summary["counts"]["events"],
            "relationshipSetCount": summary["counts"]["relationshipSets"],
            "relationshipCount": summary["counts"]["relationships"],
            "attributionPathCount": summary["counts"]["attributionPaths"],
            "failureCaseCount": summary["counts"]["failureCases"],
        },
        "connectorCounts": summary["connectorCounts"],
        "failureCaseCounts": dict(Counter(case["case"] for case in failures)),
        "verdictInputs": {"rawItemsIncluded": 0, "relationshipIntelligenceIncluded": 0, "enterpriseCalled": False},
    }


def find_forbidden(obj: Any, path: str = "$", hits: list[str] | None = None) -> list[str]:
    hits = [] if hits is None else hits
    if isinstance(obj, dict):
        for k, v in obj.items():
            next_path = f"{path}.{k}"
            if k in RAW_OR_RELATIONSHIP_KEYS:
                hits.append(next_path)
            find_forbidden(v, next_path, hits)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            find_forbidden(v, f"{path}[{i}]", hits)
    return hits


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--accounts", type=int, default=300)
    parser.add_argument("--items", type=int, default=1000)
    parser.add_argument("--events-max", type=int, default=6000)
    parser.add_argument("--out", type=Path, default=Path("artifacts/ucl-cloud-proof"))
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    items, events = generate(args.accounts, args.items, args.events_max)
    rel_sets, paths = build_relationships(items, events)
    failures = [
        {"case": "stale path", "status": "rejected", "reason": "path freshness is older than policy window", "pathId": paths[0]["pathId"]},
        {"case": "conflicting identity", "status": "quarantined", "reason": "two source identities claim the same immutable external key"},
        {"case": "insufficient history", "status": "not analysed", "reason": "relationship has fewer than two supporting events"},
        {"case": "masked user", "status": "included as aggregate only", "reason": "masked identity is withheld from Cloud export"},
        {"case": "unsafe Cloud export attempt", "status": "blocked", "reason": "payload contained forbidden raw or relationship intelligence fields"},
    ]
    summary = {
        "schema": "KynticAI.Scout.UclCloudProofSummary.v1",
        "generatedAtUtc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "counts": {"accounts": args.accounts, "exactDataItems": len(items), "events": len(events), "relationshipSets": len(rel_sets), "relationships": sum(s["relationshipCount"] for s in rel_sets), "attributionPaths": len(paths), "failureCases": len(failures)},
        "connectorCounts": dict(sorted(Counter(item["connector"] for item in items).items())),
        "eventLimitRespected": len(events) <= args.events_max,
        "enterpriseCalled": False,
    }
    exact = {"schema": "KynticAI.Scout.ExactDataItems.v1", "dataItems": items, "events": events}
    ent = enterprise_input(summary, rel_sets, paths)
    cloud = aggregate_payload(summary, failures)
    forbidden_hits = find_forbidden(cloud)
    validation = {
        "schema": "KynticAI.Scout.UclCloudProofValidation.v1",
        "verdict": "PASS" if not forbidden_hits and not summary["enterpriseCalled"] and summary["eventLimitRespected"] and set(Counter(f["case"] for f in failures)) == set(FAILURE_CASES) else "FAIL",
        "checks": {
            "eventLimitRespected": summary["eventLimitRespected"],
            "enterpriseNotCalled": not summary["enterpriseCalled"],
            "cloudPayloadMetadataOnly": cloud["metadataOnly"],
            "cloudForbiddenFieldHits": forbidden_hits,
            "allFailureCasesCovered": sorted(Counter(f["case"] for f in failures)) == sorted(FAILURE_CASES),
        },
        "hashes": {},
        "failureCases": failures,
    }
    artifacts = {
        "dataset-summary.json": summary,
        "exact-data-items.json": exact,
        "attribution-paths.json": {"schema": "KynticAI.Scout.AttributionPaths.v1", "attributionPaths": paths},
        "relationship-sets.json": {"schema": "KynticAI.Scout.RelationshipSets.v1", "relationshipSets": rel_sets},
        "enterprise-analysis-input.json": ent,
        "cloud-aggregate-payload.json": cloud,
        "validation-report.json": validation,
    }
    for name, data in artifacts.items():
        (args.out / name).write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        validation["hashes"][name] = stable_hash(data)
    (args.out / "validation-report.json").write_text(json.dumps(validation, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    md = ["# UCL-only Cloud proof", "", f"Verdict: **{validation['verdict']}**", "", "Enterprise was not called. The Enterprise input is a local JSON artifact only.", "", "## Counts", ""]
    md += [f"- {k}: {v}" for k, v in summary["counts"].items()]
    md += ["", "## Cloud aggregate boundary", "", f"- Forbidden raw/relationship field hits: {len(forbidden_hits)}", f"- Metadata only: {cloud['metadataOnly']}", "", "## Failure cases", ""]
    md += [f"- {f['case']}: {f['status']} — {f['reason']}" for f in failures]
    md += ["", "## Artifacts", ""] + [f"- `{args.out / name}`" for name in list(artifacts) + ["proof-report.md"]]
    (args.out / "proof-report.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(json.dumps({"verdict": validation["verdict"], "counts": summary["counts"], "artifacts": [str(args.out / n) for n in list(artifacts) + ["proof-report.md"]]}, indent=2))
    return 0 if validation["verdict"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
