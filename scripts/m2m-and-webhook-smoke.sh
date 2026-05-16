#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:5198}"
TENANT_SLUG="${2:-demo}"
ADMIN_EMAIL="${3:-admin@contextlayer.local}"
ADMIN_PASSWORD="${4:-DemoAdmin123!}"

invoke_json() {
  local method="$1" url="$2" body="${3:-}" extra_headers="${4:-}"
  local -a curl_args=(-sfS -X "$method" "$url" -H "Content-Type: application/json")
  if [ -n "$extra_headers" ]; then
    while IFS= read -r hdr; do
      [ -n "$hdr" ] && curl_args+=(-H "$hdr")
    done <<< "$extra_headers"
  fi
  if [ -n "$body" ]; then
    curl_args+=(-d "$body")
  fi
  curl "${curl_args[@]}"
}

invoke_status() {
  local method="$1" url="$2" body="${3:-}" extra_headers="${4:-}"
  local -a curl_args=(-s -o /dev/null -w "%{http_code}" -X "$method" "$url" -H "Content-Type: application/json")
  if [ -n "$extra_headers" ]; then
    while IFS= read -r hdr; do
      [ -n "$hdr" ] && curl_args+=(-H "$hdr")
    done <<< "$extra_headers"
  fi
  if [ -n "$body" ]; then
    curl_args+=(-d "$body")
  fi
  curl "${curl_args[@]}"
}

compute_webhook_signature() {
  local secret="$1" timestamp="$2" event_id="$3" body="$4"
  local payload="$timestamp.$event_id.$body"
  echo -n "$payload" | openssl dgst -sha256 -hmac "$secret" -hex 2>/dev/null | sed 's/^.* /sha256=/'
}

if ! curl -sfS "$BASE_URL/api/v1/health" > /dev/null 2>&1; then
  echo "Backend is not reachable at $BASE_URL."
  echo "Start it with:"
  echo "  ./scripts/start-demo.sh"
  echo "or:"
  echo "  dotnet run --project ./src/ContextLayer.Api/ContextLayer.Api.csproj --urls $BASE_URL"
  exit 2
fi

LOGIN_RESPONSE=$(invoke_json POST "$BASE_URL/api/auth/login" "{\"tenantSlug\":\"$TENANT_SLUG\",\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
ADMIN_AUTH="Authorization: Bearer $ACCESS_TOKEN"

CLIENT_RESPONSE=$(invoke_json POST "$BASE_URL/api/v1/api-clients" \
  "{\"displayName\":\"Local M2M and webhook smoke\",\"workspaceSlug\":\"primary\",\"scopes\":[\"context:read\",\"events:ingest\",\"admin:manage\"]}" \
  "$ADMIN_AUTH")
CLIENT_ID=$(echo "$CLIENT_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['clientId'])")
API_KEY=$(echo "$CLIENT_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['apiKey'])")

TOKEN_RESPONSE=$(invoke_json POST "$BASE_URL/api/auth/token" \
  "{\"grantType\":\"client_credentials\",\"clientId\":\"$CLIENT_ID\",\"clientSecret\":\"$API_KEY\",\"scope\":\"context:read events:ingest\"}")
M2M_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

invoke_json GET "$BASE_URL/api/v1/workspaces?tenantSlug=$TENANT_SLUG" "" "Authorization: Bearer $M2M_TOKEN" > /dev/null

API_KEY_HEADERS="X-API-Client-Id: $CLIENT_ID
X-API-Key: $API_KEY"

SECRET_RESPONSE=$(invoke_json POST "$BASE_URL/api/v1/webhook-signing-secrets" \
  "{\"displayName\":\"Local webhook smoke\",\"workspaceSlug\":\"primary\"}" \
  "$API_KEY_HEADERS")
SECRET_ID=$(echo "$SECRET_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['secretId'])")
SECRET_VALUE=$(echo "$SECRET_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['secret'])")

EVENT_ID="evt-local-smoke-$(cat /proc/sys/kernel/random/uuid 2>/dev/null || python3 -c 'import uuid; print(uuid.uuid4().hex)')"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
EVENT_BODY="{\"eventId\":\"$EVENT_ID\",\"workspaceSlug\":\"primary\",\"sourceSystem\":\"local-smoke\",\"eventType\":\"account.updated\",\"externalUserId\":\"user-123\",\"externalAccountId\":\"acct-123\",\"observedAtUtc\":\"$TIMESTAMP\",\"payload\":{\"health\":\"green\",\"aggregateOnly\":true}}"

SIGNATURE=$(compute_webhook_signature "$SECRET_VALUE" "$TIMESTAMP" "$EVENT_ID" "$EVENT_BODY")

SIGNED_HEADERS="X-API-Client-Id: $CLIENT_ID
X-API-Key: $API_KEY
X-UCL-Webhook-Secret-Id: $SECRET_ID
X-UCL-Webhook-Secret: $SECRET_VALUE
X-UCL-Webhook-Timestamp: $TIMESTAMP
X-UCL-Webhook-Signature: $SIGNATURE"

ACCEPTED=$(invoke_status POST "$BASE_URL/api/v1/events/source-system" "$EVENT_BODY" "$SIGNED_HEADERS")
REPLAY=$(invoke_status POST "$BASE_URL/api/v1/events/source-system" "$EVENT_BODY" "$SIGNED_HEADERS")

BAD_EVENT_ID="${EVENT_ID}-bad"
BAD_EVENT_BODY="{\"eventId\":\"$BAD_EVENT_ID\",\"workspaceSlug\":\"primary\",\"sourceSystem\":\"local-smoke\",\"eventType\":\"account.updated\",\"externalUserId\":\"user-123\",\"externalAccountId\":\"acct-123\",\"observedAtUtc\":\"$TIMESTAMP\",\"payload\":{\"health\":\"green\",\"aggregateOnly\":true}}"

BAD_HEADERS="X-API-Client-Id: $CLIENT_ID
X-API-Key: $API_KEY
X-UCL-Webhook-Secret-Id: $SECRET_ID
X-UCL-Webhook-Secret: $SECRET_VALUE
X-UCL-Webhook-Timestamp: $TIMESTAMP
X-UCL-Webhook-Signature: sha256=bad"

BAD=$(invoke_status POST "$BASE_URL/api/v1/events/source-system" "$BAD_EVENT_BODY" "$BAD_HEADERS")

if [ "$ACCEPTED" != "202" ] || [ "$REPLAY" != "401" ] || [ "$BAD" != "401" ]; then
  echo "Unexpected webhook smoke statuses. accepted=$ACCEPTED replay=$REPLAY bad=$BAD" >&2
  exit 1
fi

echo "M2M token request succeeded."
echo "Scoped API call succeeded."
echo "Webhook signing secret created."
echo "Signed event accepted, replay rejected, and bad signature rejected."
echo "No secrets were printed."
