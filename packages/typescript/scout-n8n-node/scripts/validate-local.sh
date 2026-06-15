#!/usr/bin/env bash
# validate-local.sh — Local package-readiness checks for @kynticai/scout-n8n-node.
#
# Usage:  bash scripts/validate-local.sh
#
# Runs npm install, test, build, and pack --dry-run in sequence.
# Exits non-zero on the first failure so CI or a developer gets
# clear feedback.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== KynticAI Scout n8n node — local validation ==="
echo "Package directory: $PKG_DIR"
echo ""

cd "$PKG_DIR"

echo "--- Step 1/4: npm install ---"
npm install
echo ""

echo "--- Step 2/4: npm test ---"
npm test
echo ""

echo "--- Step 3/4: npm run build ---"
npm run build
echo ""

echo "--- Step 4/4: npm pack --dry-run ---"
npm pack --dry-run
echo ""

echo "=== All local validation checks passed ==="
