#!/usr/bin/env bash
set -euo pipefail

ENTERPRISE_REPO="${1:-../scout-enterprise}"
CLOUD_REPO="${2:-../scout-cloud}"
BUILD_MISSING="${BUILD_MISSING:-false}"
SKIP_ENTERPRISE_CONNECTOR_SMOKE="${SKIP_ENTERPRISE_CONNECTOR_SMOKE:-false}"

PUBLIC_REPO="$(cd "$(dirname "$0")/.." && pwd)"

require_path() {
  local path="$1" purpose="$2"
  if [ ! -e "$path" ]; then
    echo "Missing $purpose: $path" >&2
    exit 1
  fi
  echo "OK: $purpose"
}

invoke_step() {
  local name="$1"
  shift
  echo ""
  echo "== $name =="
  "$@"
}

public_repo_checks() {
  require_path "$PUBLIC_REPO/docs/paid-pilot-end-to-end-rehearsal.md" "public paid-pilot rehearsal doc"
  require_path "$PUBLIC_REPO/docs/commercial-readiness-summary.md" "public readiness summary"
  require_path "$PUBLIC_REPO/scripts/check-production-env.ps1" "public production env check"
  require_path "$PUBLIC_REPO/scripts/m2m-and-webhook-smoke.sh" "public M2M/webhook smoke"
  require_path "$PUBLIC_REPO/scripts/licence-install-rehearsal.sh" "public licence install rehearsal"
}

cloud_repo_checks() {
  require_path "$CLOUD_REPO/apps/cloud-portal/package.json" "cloud portal package"
  require_path "$CLOUD_REPO/scripts/live-hosting-preflight.ps1" "cloud live-hosting preflight"
  require_path "$CLOUD_REPO/scripts/apply-cloud-migrations.ps1" "cloud migration script"
  require_path "$CLOUD_REPO/docs/cloud-portal-hosting-topology.md" "cloud portal topology doc"
  require_path "$CLOUD_REPO/docs/cloud-portal-auth.md" "cloud portal auth doc"
  require_path "$CLOUD_REPO/docs/licence-download-to-data-plane.md" "cloud licence download doc"
  local cloud_dist="$CLOUD_REPO/apps/cloud-portal/dist"
  if [ ! -d "$cloud_dist" ] && [ "$BUILD_MISSING" = "true" ]; then
    (cd "$CLOUD_REPO/apps/cloud-portal" && npm install && npm run build)
  fi
  require_path "$cloud_dist" "cloud portal production build folder"
}

enterprise_repo_checks() {
  require_path "$ENTERPRISE_REPO/docs/postgres-disposable-proof.md" "enterprise disposable Postgres proof"
  require_path "$ENTERPRISE_REPO/scripts/connector-smoke-test.ps1" "enterprise connector smoke script"
  require_path "$ENTERPRISE_REPO/scripts/start-postgres-proof.ps1" "enterprise Postgres proof script"
  require_path "$ENTERPRISE_REPO/scripts/package-enterprise-preview.ps1" "enterprise package dry-run script"
  if [ "$SKIP_ENTERPRISE_CONNECTOR_SMOKE" != "true" ]; then
    bash "$ENTERPRISE_REPO/scripts/connector-smoke-test.sh" \
      --provider postgres \
      --config-path "$ENTERPRISE_REPO/samples/postgres/connector-proof.config.json" \
      --selector-name CustomerContextRollup 2>/dev/null || \
    pwsh "$ENTERPRISE_REPO/scripts/connector-smoke-test.ps1" \
      -Provider postgres \
      -ConfigPath "$ENTERPRISE_REPO/samples/postgres/connector-proof.config.json" \
      -SelectorName CustomerContextRollup
  fi
}

flow_doc_checks() {
  local docs=(
    "$PUBLIC_REPO/docs/paid-pilot-end-to-end-rehearsal.md"
    "$CLOUD_REPO/docs/cloud-portal.md"
    "$CLOUD_REPO/docs/package-entitlement-flow.md"
    "$CLOUD_REPO/docs/support-data-redaction.md"
    "$CLOUD_REPO/docs/operations-readiness-evidence-template.md"
    "$ENTERPRISE_REPO/docs/postgres-disposable-proof.md"
    "$ENTERPRISE_REPO/docs/private-package-distribution.md"
    "$ENTERPRISE_REPO/docs/support-bundle-redaction.md"
  )
  for doc in "${docs[@]}"; do
    require_path "$doc" "flow document"
  done
}

invoke_step "Public repo checks" public_repo_checks
invoke_step "Cloud repo checks" cloud_repo_checks
invoke_step "Enterprise repo checks" enterprise_repo_checks
invoke_step "Lead to support flow docs" flow_doc_checks

echo ""
echo "Manual steps still required:"
echo "- real hosting, domains, DNS, TLS, reverse proxy, and HSTS validation"
echo "- real managed PostgreSQL target, backup owner, and restore evidence"
echo "- real secret-store references for JWT, licence signing, SMTP, billing, and lead challenges"
echo "- solicitor review of privacy, cookie/event consent, terms, pilot agreement, and data-processing assumptions"
echo "- first customer-approved connector endpoint, vault reference, and acceptance checklist"
echo "- real private package feed/object storage registration and signed download URLs if self-download is promised"
echo ""
echo "Paid-pilot local rehearsal checks completed. Nothing was pushed, published, released, or hosted."
