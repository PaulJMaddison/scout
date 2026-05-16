#!/usr/bin/env bash
set -euo pipefail

ENTERPRISE_REPO="${1:-../universalcontextlayer-enterprise}"
CLOUD_REPO="${2:-../universalcontextlayer-cloud}"
SKIP_ENTERPRISE_CONNECTOR_SMOKE="${SKIP_ENTERPRISE_CONNECTOR_SMOKE:-false}"

PUBLIC_REPO="$(cd "$(dirname "$0")/.." && pwd)"

require_path() {
  local path="$1"
  if [ ! -e "$path" ]; then
    echo "Required rehearsal path is missing: $path" >&2
    exit 1
  fi
}

invoke_repo_script() {
  local repo="$1" script="$2"
  shift 2
  local path="$repo/$script"
  require_path "$path"
  bash "$path" "$@"
}

echo "Paid pilot end-to-end local rehearsal check"
echo "Public repo: $PUBLIC_REPO"
echo "Enterprise repo: $ENTERPRISE_REPO"
echo "Cloud repo: $CLOUD_REPO"

require_path "$PUBLIC_REPO/docs/paid-pilot-end-to-end-rehearsal.md"
require_path "$PUBLIC_REPO/docs/commercial-readiness-summary.md"
require_path "$PUBLIC_REPO/scripts/check-release-alignment.sh"
require_path "$PUBLIC_REPO/scripts/check-production-env.sh"

require_path "$ENTERPRISE_REPO/docs/live-connector-proof-pack.md"
require_path "$ENTERPRISE_REPO/scripts/connector-smoke-test.ps1"
require_path "$ENTERPRISE_REPO/scripts/check-package-readiness.ps1"

require_path "$CLOUD_REPO/docs/live-hosting-preflight.md"
require_path "$CLOUD_REPO/scripts/check-cloud-production-env.ps1"
require_path "$CLOUD_REPO/scripts/live-hosting-preflight.ps1"

invoke_repo_script "$PUBLIC_REPO" "scripts/check-release-alignment.sh"
invoke_repo_script "$ENTERPRISE_REPO" "scripts/check-release-alignment.sh" 2>/dev/null || \
  invoke_repo_script "$ENTERPRISE_REPO" "scripts/check-release-alignment.ps1" 2>/dev/null || \
  echo "WARNING: Enterprise release alignment check not available as .sh"
invoke_repo_script "$CLOUD_REPO" "scripts/check-release-alignment.sh" 2>/dev/null || \
  invoke_repo_script "$CLOUD_REPO" "scripts/check-release-alignment.ps1" 2>/dev/null || \
  echo "WARNING: Cloud release alignment check not available as .sh"

if [ "$SKIP_ENTERPRISE_CONNECTOR_SMOKE" != "true" ]; then
  CONNECTOR_SMOKE="$ENTERPRISE_REPO/scripts/connector-smoke-test.ps1"
  require_path "$CONNECTOR_SMOKE"
  if [ -f "$ENTERPRISE_REPO/scripts/connector-smoke-test.sh" ]; then
    bash "$ENTERPRISE_REPO/scripts/connector-smoke-test.sh" \
      --provider postgres \
      --config-path "$ENTERPRISE_REPO/docs/examples/postgresql-connector.config.json"
    bash "$ENTERPRISE_REPO/scripts/connector-smoke-test.sh" \
      --provider sqlserver \
      --config-path "$ENTERPRISE_REPO/docs/examples/sql-server-connector.config.json"
  else
    echo "WARNING: Enterprise connector smoke test only available as .ps1"
  fi
fi

echo "Manual/live blockers still expected:"
echo "- real hosting, domains, DNS, TLS, payment credentials, licence signing keys, and customer connector endpoints are not configured by this rehearsal"
echo "- real cloud account/licence/data-plane registration requires a local running cloud API or next-week hosting"
echo "- real SQL/PostgreSQL connector preview requires customer-approved endpoint and vault reference"
echo "- No raw operational data is sent to cloud; this rehearsal uses aggregate/support metadata boundaries only"
echo "Paid pilot rehearsal check completed without publishing, pushing, releasing, or configuring production."
