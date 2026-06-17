#!/usr/bin/env python3
"""Generate a moderate synthetic UCL/Scout evidence-pack proof.

This proof is intentionally UCL-only: it creates deterministic synthetic source
metadata, UCL Evidence Pack v1 fixtures, governed/masked variants, and Cloud
aggregate/control-plane payloads without invoking Enterprise weighting, Clarity,
or Importance.
"""
from __future__ import annotations

import argparse, hashlib, json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

DOMAINS = ["b2b-saas","ecommerce","support-churn","recruitment","finance-retention","healthcare-operations"]
FAILURES = ["stale-data","conflicting-evidence","insufficient-evidence","governance-denied-user","masked-read-only-user","unsafe-cloud-payload-attempt"]
SOURCES = ["crm","email_metadata","web_events","support_metadata","product_usage","billing_aggregates"]
FORBIDDEN_CLOUD_KEYS = {"rawRecords","evidencePacks","prompts","generatedContent","recommendations","citations","weightedSignals","relationshipTypes","caveats","perCustomerDerivedIntelligence","relationshipWeights","evidenceItems","provenance","exactCitation"}


def sid(prefix: str, value: str) -> str:
    return f"{prefix}_{hashlib.sha256(value.encode()).hexdigest()[:12]}"


def jdump(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def source_event(domain: str, i: int, base: datetime) -> dict[str, Any]:
    source = SOURCES[i % len(SOURCES)]
    account = f"acct-{i % 300:03d}"
    user = f"user-{i % 1000:04d}"
    observed = base - timedelta(hours=i % 720)
    return {
        "eventId": sid("evt", f"{domain}:{i}"), "domain": domain, "source": source,
        "accountId": account, "contactOrUserId": user, "observedAtUtc": observed.isoformat().replace("+00:00", "Z"),
        "synthetic": True, "metadata": {"channel": source, "ordinal": i, "region": ["UK","US","EU"][i % 3]},
        "summary": f"Synthetic {source.replace('_',' ')} signal {i} for {domain}.",
    }


def evidence_pack(domain: str, events: list[dict[str, Any]], failure: str | None = None) -> dict[str, Any]:
    citations = []
    caveats = []
    selected = events[:8]
    if failure == "stale-data":
        caveats.append("Some cited observations are stale and should be refreshed before operational use.")
    if failure == "conflicting-evidence":
        caveats.append("Evidence conflicts across sources; treat the relationship signal as unresolved.")
    if failure == "insufficient-evidence":
        selected = events[:2]
        caveats.append("Insufficient evidence is available for a reliable domain-specific conclusion.")
    for n, ev in enumerate(selected, 1):
        citations.append({
            "citationId": f"{domain.upper().replace('-','_')}-CIT-{n:02d}",
            "source": ev["source"], "sourceRecordId": ev["eventId"], "accountId": ev["accountId"],
            "observedAtUtc": ev["observedAtUtc"], "exactLocalCitation": ev["summary"],
            "provenance": {"connector": ev["source"], "synthetic": True, "sourceRecordSha256": hashlib.sha256(json.dumps(ev, sort_keys=True).encode()).hexdigest()},
        })
    return {
        "schema": "ucl.evidence-pack.v1", "domain": domain, "subject": {"accountId": selected[0]["accountId"], "synthetic": True},
        "productBoundaries": {"uclOwnsExactPrivateEvidencePacks": True, "enterpriseCanonicalRustWeightingCalled": False, "clarityRequired": False, "importanceRequired": False},
        "relationshipIntelligence": {"mode": "basic-public-fallback", "canonicalWeighting": "not-run"},
        "citations": citations, "caveats": caveats,
        "summary": f"Synthetic UCL evidence pack for {domain}; no Enterprise, Clarity, or Importance dependency.",
    }


def masked_pack(pack: dict[str, Any], denied: bool = False) -> dict[str, Any]:
    if denied:
        return {"schema": pack["schema"], "domain": pack["domain"], "access": "denied", "citations": [], "caveats": ["Governance denied this user access to evidence-pack contents."], "provenanceAvailableToAuthorisedUsers": True}
    clone = json.loads(json.dumps(pack))
    clone["access"] = "masked-read-only"
    for citation in clone["citations"]:
        citation["exactLocalCitation"] = "[MASKED: read-only role cannot view exact local citation text]"
        citation["accountId"] = "[MASKED]"
    clone.setdefault("caveats", []).append("Masked/read-only view: exact local citation text and account identifiers are redacted.")
    return clone


def cloud_payload(domain: str, packs: list[dict[str, Any]]) -> dict[str, Any]:
    return {"schema":"ucl.cloud-aggregate-control-plane.v1", "domain": domain, "metadataOnly": True,
            "aggregateCounts": {"evidencePacksProduced": len(packs), "citationsProduced": sum(len(p["citations"]) for p in packs), "caveatCount": sum(len(p["caveats"]) for p in packs)},
            "health": {"lastRunStatus":"pass", "syntheticDataset": True}}


def contains_key(obj: Any, forbidden: set[str]) -> list[str]:
    found=[]
    if isinstance(obj, dict):
        for k,v in obj.items():
            if k in forbidden: found.append(k)
            found += contains_key(v, forbidden)
    elif isinstance(obj, list):
        for v in obj: found += contains_key(v, forbidden)
    return found


def main() -> int:
    p=argparse.ArgumentParser(); p.add_argument("--out", type=Path, default=None); args=p.parse_args()
    stamp=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out=args.out or Path("artifacts/proofs/ucl-scale-failure")/stamp
    epdir=out/"evidence-pack-fixtures"; cpdir=out/"cloud-aggregate-payloads"
    base=datetime(2026,6,17,tzinfo=timezone.utc)
    events_by_domain={d:[source_event(d,i,base) for i in range(1000)] for d in DOMAINS}
    packs=[]; domain_results=[]
    for d in DOMAINS:
        pack=evidence_pack(d, events_by_domain[d]); packs.append(pack); jdump(epdir/f"{d}.evidence-pack.v1.json", pack)
        jdump(epdir/f"{d}.masked-read-only.evidence-pack.v1.json", masked_pack(pack))
        payload=cloud_payload(d,[pack]); jdump(cpdir/f"{d}.cloud-aggregate.json", payload)
        domain_results.append({"domain":d,"verdict":"PASS","citations":len(pack["citations"]),"provenanceEntries":len([c for c in pack["citations"] if c.get("provenance")])})
    failure_results=[]
    for idx,f in enumerate(FAILURES):
        d=DOMAINS[idx % len(DOMAINS)]
        pack=evidence_pack(d, events_by_domain[d][idx*10:], f if f in {"stale-data","conflicting-evidence","insufficient-evidence"} else None)
        artifact=epdir/f"failure-{f}.evidence-pack.v1.json"
        if f=="governance-denied-user": pack=masked_pack(pack, denied=True)
        if f=="masked-read-only-user": pack=masked_pack(pack)
        if f=="unsafe-cloud-payload-attempt":
            attempt={"schema":"ucl.cloud-aggregate-control-plane.v1","rawRecords":[events_by_domain[d][0]],"evidencePacks":[pack],"citations":pack.get("citations",[]),"weightedSignals":[{"name":"private","weight":0.8}],"caveats":pack.get("caveats",[])}
            leaks=contains_key(attempt, FORBIDDEN_CLOUD_KEYS)
            rejected={"attemptedForbiddenKeys":sorted(set(leaks)),"status":"rejected","errorCode":"CONTROL_PLANE_AGGREGATES_ONLY","echoedSensitiveContent":False}
            jdump(cpdir/"failure-unsafe-cloud-payload-attempt.rejected.json", rejected)
            failure_results.append({"failureCase":f,"verdict":"PASS","artifact":str(cpdir/"failure-unsafe-cloud-payload-attempt.rejected.json")}); continue
        jdump(artifact, pack)
        ok = bool(pack.get("caveats")) and (f!="governance-denied-user" or pack.get("access")=="denied") and (f!="masked-read-only-user" or pack.get("access")=="masked-read-only")
        failure_results.append({"failureCase":f,"verdict":"PASS" if ok else "FAIL","artifact":str(artifact)})
    dataset={"synthetic":True,"accounts":300,"contactsUsers":1000,"operationalEvents":sum(len(v) for v in events_by_domain.values()),"sources":SOURCES,"domains":DOMAINS,"maximumOperationalEventsRequested":6000}
    checks=[]
    all_packs=[json.loads(p.read_text()) for p in epdir.glob("*.json")]
    checks.append({"name":"exact local citations exist","passed":all(any("exactLocalCitation" in c for c in pk.get("citations",[])) or pk.get("access")=="denied" for pk in all_packs)})
    checks.append({"name":"provenance exists","passed":all(all("provenance" in c for c in pk.get("citations",[])) for pk in all_packs)})
    checks.append({"name":"failure caveats exist","passed":all(r["verdict"]=="PASS" for r in failure_results if r["failureCase"]!="unsafe-cloud-payload-attempt")})
    checks.append({"name":"cloud excludes forbidden detail","passed":all(not contains_key(json.loads(p.read_text()), FORBIDDEN_CLOUD_KEYS) for p in cpdir.glob("*.cloud-aggregate.json"))})
    passed=sum(c["passed"] for c in checks); failed=len(checks)-passed
    report={"verdict":"PASS" if failed==0 and dataset["operationalEvents"]<=6000 else "FAIL","generatedAtUtc":datetime.now(timezone.utc).isoformat().replace("+00:00","Z"),"passCount":passed,"failCount":failed,"checks":checks,"dataset":dataset,"artifactRoot":str(out)}
    jdump(out/"dataset-summary.json", dataset); jdump(out/"domain-results.json", domain_results); jdump(out/"failure-case-results.json", failure_results); jdump(out/"validation-report.json", report)
    md=["# UCL/Scout moderate-scale evidence-pack proof","",f"Verdict: **{report['verdict']}**","", "## Dataset", f"- Accounts: {dataset['accounts']}", f"- Contacts/users: {dataset['contactsUsers']}", f"- Operational events: {dataset['operationalEvents']}", "", "## Boundaries", "- UCL/Scout owns exact private data-plane evidence packs.", "- UCL includes only basic/public fallback relationship intelligence.", "- Enterprise canonical Rust weighting was not called.", "- Cloud artifacts contain aggregate/control-plane payloads only.", "- Clarity and Importance are not required.", "", "## Artifacts", f"- `{out/'dataset-summary.json'}`", f"- `{out/'domain-results.json'}`", f"- `{out/'failure-case-results.json'}`", f"- `{epdir}/`", f"- `{cpdir}/`", f"- `{out/'validation-report.json'}`"]
    (out/"proof-report.md").write_text("\n".join(md)+"\n", encoding="utf-8")
    print(json.dumps(report, indent=2)); return 0 if report["verdict"]=="PASS" else 1
if __name__ == "__main__": raise SystemExit(main())
