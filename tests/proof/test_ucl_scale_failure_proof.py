#!/usr/bin/env python3
import json, subprocess, sys, tempfile, unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "ucl-scale-failure-proof.py"
FORBIDDEN = {"rawRecords","evidencePacks","prompts","generatedContent","recommendations","citations","weightedSignals","relationshipTypes","caveats","perCustomerDerivedIntelligence","relationshipWeights","evidenceItems","provenance","exactCitation"}

def contains_key(obj, forbidden):
    if isinstance(obj, dict):
        return [k for k,v in obj.items() if k in forbidden] + sum((contains_key(v, forbidden) for v in obj.values()), [])
    if isinstance(obj, list):
        return sum((contains_key(v, forbidden) for v in obj), [])
    return []

class UclScaleFailureProofTests(unittest.TestCase):
    def test_proof_outputs_and_boundaries(self):
        with tempfile.TemporaryDirectory() as td:
            out = Path(td) / "proof"
            subprocess.run([sys.executable, str(SCRIPT), "--out", str(out)], cwd=ROOT, check=True)
            report = json.loads((out / "validation-report.json").read_text())
            dataset = json.loads((out / "dataset-summary.json").read_text())
            self.assertEqual(report["verdict"], "PASS")
            self.assertEqual(dataset["accounts"], 300)
            self.assertEqual(dataset["contactsUsers"], 1000)
            self.assertLessEqual(dataset["operationalEvents"], 6000)
            packs = list((out / "evidence-pack-fixtures").glob("*.json"))
            self.assertGreaterEqual(len(packs), 12)
            for path in packs:
                pack = json.loads(path.read_text())
                self.assertFalse(pack.get("productBoundaries", {}).get("enterpriseCanonicalRustWeightingCalled", False))
                for citation in pack.get("citations", []):
                    self.assertIn("exactLocalCitation", citation)
                    self.assertIn("provenance", citation)
            for path in (out / "cloud-aggregate-payloads").glob("*.cloud-aggregate.json"):
                payload = json.loads(path.read_text())
                self.assertTrue(payload["metadataOnly"])
                self.assertEqual([], contains_key(payload, FORBIDDEN))

if __name__ == "__main__": unittest.main()
