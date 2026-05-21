#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:5173}"
TENANT_SLUG="${2:-demo}"
EMAIL="${3:-admin@scout.local}"
PASSWORD="${4:-DemoAdmin123!}"
TARGET_PATH="${5:-/demo}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEMO_DIR="$REPO_ROOT/.demo"
LOG_PATH="$DEMO_DIR/open-demo-browser.log"
ERR_PATH="$DEMO_DIR/open-demo-browser.err.log"

NODE_PATH=$(command -v node) || { echo "node is not installed" >&2; exit 1; }

mkdir -p "$DEMO_DIR"
rm -f "$LOG_PATH" "$ERR_PATH"

"$NODE_PATH" \
  "$REPO_ROOT/scripts/open-demo-browser.mjs" \
  "--base-url=$BASE_URL" \
  "--tenant=$TENANT_SLUG" \
  "--email=$EMAIL" \
  "--password=$PASSWORD" \
  "--target=$TARGET_PATH" \
  > "$LOG_PATH" 2> "$ERR_PATH" &

BG_PID=$!

DEADLINE=$((SECONDS + 45))

while [ $SECONDS -lt $DEADLINE ]; do
  if [ -f "$LOG_PATH" ]; then
    if grep -q "READY:" "$LOG_PATH" 2>/dev/null; then
      READY_URL=$(grep "READY:" "$LOG_PATH" | sed 's/.*READY://')
      echo "Browser launched and signed in at $READY_URL"
      echo "Background process id: $BG_PID"
      exit 0
    fi
  fi

  if [ -f "$ERR_PATH" ]; then
    if grep -q "ERROR:" "$ERR_PATH" 2>/dev/null; then
      cat "$ERR_PATH" >&2
      exit 1
    fi
  fi

  sleep 0.5
done

echo "WARNING: Browser process started but the ready signal did not arrive within 45 seconds."
echo "Process id: $BG_PID"
if [ -f "$LOG_PATH" ]; then
  cat "$LOG_PATH"
fi
