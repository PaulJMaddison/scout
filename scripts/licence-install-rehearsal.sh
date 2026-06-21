#!/usr/bin/env bash
set -euo pipefail

LICENCE_PATH="${1:-.local/licences/pilot.scout-licence.json}"
BASE_URL="${2:-http://localhost:5198}"
TENANT_SLUG="${3:-demo}"
ADMIN_EMAIL="${4:-admin@scout.local}"
ADMIN_PASSWORD="${5:-DemoAdmin123!}"
SKIP_ENDPOINT_CHECK="${SKIP_ENDPOINT_CHECK:-false}"
CHECK_ONLY="${CHECK_ONLY:-false}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RESOLVED_LICENCE_PATH="$(cd "$REPO_ROOT" && realpath -m "$LICENCE_PATH")"

case "$RESOLVED_LICENCE_PATH" in
  "$REPO_ROOT"*) ;;
  *) echo "Licence rehearsal path must stay inside the public repo .local area, or pass an explicit protected local path after review." >&2; exit 1 ;;
esac

if [ ! -f "$RESOLVED_LICENCE_PATH" ]; then
  echo "No local licence file found at $RESOLVED_LICENCE_PATH"
  echo "Download a development licence from the cloud portal, then place it here outside git."
  echo "Cloud doc: use the private control-plane licence-download-to-data-plane guide."
  if [ "$CHECK_ONLY" = "true" ]; then exit 1; fi
  mkdir -p "$(dirname "$RESOLVED_LICENCE_PATH")"
  echo "Directory created. Licence file still needs to be downloaded manually."
  exit 0
fi

echo "Licence file exists outside tracked source: $RESOLVED_LICENCE_PATH"
echo "Set these environment values before starting the public data plane:"
echo "Licence__Mode=Licensed"
echo "Licence__FilePath=$RESOLVED_LICENCE_PATH"
echo "Licence__PublicKeyPem=<cloud licence public verification key, supplied from a secret/config store>"

if [ "$SKIP_ENDPOINT_CHECK" = "true" ]; then
  echo "Endpoint verification skipped by request."
  exit 0
fi

invoke_json() {
  local method="$1" url="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -sfS -X "$method" "$url" -H "Content-Type: application/json" -H "${AUTH_HEADER:-X-Noop: true}" -d "$body"
  else
    curl -sfS -X "$method" "$url" -H "Content-Type: application/json" -H "${AUTH_HEADER:-X-Noop: true}"
  fi
}

if ! curl -sfS "$BASE_URL/api/v1/health" > /dev/null 2>&1; then
  echo "Backend is not reachable at $BASE_URL."
  echo "Start it with:"
  echo "  Licence__Mode='Licensed' Licence__FilePath='$RESOLVED_LICENCE_PATH' dotnet run --project ./src/KynticAI.Scout.Api/KynticAI.Scout.Api.csproj --urls $BASE_URL"
  exit 2
fi

LOGIN_RESPONSE=$(invoke_json POST "$BASE_URL/api/auth/login" "{\"tenantSlug\":\"$TENANT_SLUG\",\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null || echo "$LOGIN_RESPONSE" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
AUTH_HEADER="Authorization: Bearer $ACCESS_TOKEN"

STATUS_RESPONSE=$(invoke_json GET "$BASE_URL/api/v1/licence/status?tenantSlug=$TENANT_SLUG")

echo "Licence status endpoint responded."
for field in mode status plan isValid source; do
  value=$(echo "$STATUS_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('$field',''))" 2>/dev/null || echo "")
  echo "$field: $value"
done

warnings=$(echo "$STATUS_RESPONSE" | python3 -c "import sys,json; w=json.load(sys.stdin).get('warnings',[]); print('; '.join(w) if w else '')" 2>/dev/null || echo "")
if [ -n "$warnings" ]; then
  echo "Warnings: $warnings"
fi
