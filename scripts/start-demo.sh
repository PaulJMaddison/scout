#!/usr/bin/env sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
DEMO_DATA_DIR="$REPO_ROOT/.demo-data"
DEMO_RUNTIME_DIR="$REPO_ROOT/.demo-runtime"
API_PID_FILE="$DEMO_RUNTIME_DIR/api.pid"
WEB_PID_FILE="$DEMO_RUNTIME_DIR/web.pid"
API_LOG="$DEMO_RUNTIME_DIR/api.log"
API_ERR_LOG="$DEMO_RUNTIME_DIR/api-error.log"
WEB_LOG="$DEMO_RUNTIME_DIR/web.log"
WEB_ERR_LOG="$DEMO_RUNTIME_DIR/web-error.log"

if [ -x "$REPO_ROOT/.dotnet/dotnet" ]; then
  DOTNET_CMD="$REPO_ROOT/.dotnet/dotnet"
else
  DOTNET_CMD="dotnet"
fi

docker_available() {
  if ! command -v docker >/dev/null 2>&1; then
    return 1
  fi

  docker version >/dev/null 2>&1
}

stop_tracked_process() {
  pid_file="$1"
  if [ ! -f "$pid_file" ]; then
    return
  fi

  pid_value="$(head -n 1 "$pid_file" 2>/dev/null || true)"
  if [ -n "$pid_value" ]; then
    kill "$pid_value" >/dev/null 2>&1 || true
  fi
  rm -f "$pid_file"
}

wait_for_url() {
  url="$1"
  attempts="${2:-45}"
  delay_seconds="${3:-2}"
  attempt=1
  while [ "$attempt" -le "$attempts" ]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    attempt=$((attempt + 1))
    sleep "$delay_seconds"
  done

  echo "Timed out waiting for $url" >&2
  exit 1
}

mkdir -p "$DEMO_DATA_DIR" "$DEMO_RUNTIME_DIR"
stop_tracked_process "$API_PID_FILE"
stop_tracked_process "$WEB_PID_FILE"

MODE="sqlite"
if docker_available; then
  MODE="docker"
fi

if [ "$MODE" = "docker" ]; then
  (
    cd "$REPO_ROOT"
    docker compose up -d postgres otel-collector prometheus tempo grafana
    "$DOTNET_CMD" run --project src/ContextLayer.Api -- bootstrap-demo
  )
  API_ENV_PREFIX="ASPNETCORE_ENVIRONMENT=Development ASPNETCORE_URLS=http://127.0.0.1:5198"
else
  (
    cd "$REPO_ROOT"
    Database__Provider=Sqlite \
    ConnectionStrings__ContextLayer="Data Source=$DEMO_DATA_DIR/context_layer_demo.db" \
    ConnectionStrings__CustomerOps="Data Source=$DEMO_DATA_DIR/customer_ops_demo.db" \
    Telemetry__OtlpEndpoint="" \
    "$DOTNET_CMD" run --project src/ContextLayer.Api -- bootstrap-demo
  )
  API_ENV_PREFIX="ASPNETCORE_ENVIRONMENT=Development ASPNETCORE_URLS=http://127.0.0.1:5198 Database__Provider=Sqlite ConnectionStrings__ContextLayer='Data Source=$DEMO_DATA_DIR/context_layer_demo.db' ConnectionStrings__CustomerOps='Data Source=$DEMO_DATA_DIR/customer_ops_demo.db' Telemetry__OtlpEndpoint=''"
fi

(
  cd "$REPO_ROOT"
  nohup sh -lc "$API_ENV_PREFIX \"$DOTNET_CMD\" run --project src/ContextLayer.Api" >"$API_LOG" 2>"$API_ERR_LOG" &
  echo $! >"$API_PID_FILE"
)

wait_for_url "http://127.0.0.1:5198/health"

(
  cd "$REPO_ROOT/apps/web"
  nohup sh -lc "BROWSER=none npm run dev -- --host 127.0.0.1 --port 5173" >"$WEB_LOG" 2>"$WEB_ERR_LOG" &
  echo $! >"$WEB_PID_FILE"
)

wait_for_url "http://127.0.0.1:5173"

echo
echo "Context Layer is running."
echo "Mode: $MODE"
echo "Web:     http://127.0.0.1:5173"
echo "API:     http://127.0.0.1:5198"
echo "GraphQL: http://127.0.0.1:5198/graphql"
