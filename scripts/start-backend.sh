#!/usr/bin/env sh
set -eu

USE_DOCKER=0
SEED_DEMO_DATA=0
for arg in "$@"; do
  case "$arg" in
    --use-docker)
      USE_DOCKER=1
      ;;
    --seed-demo-data)
      SEED_DEMO_DATA=1
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
BACKEND_DATA_DIR="$REPO_ROOT/.backend-data"
BACKEND_RUNTIME_DIR="$REPO_ROOT/.backend-runtime"
API_PID_FILE="$BACKEND_RUNTIME_DIR/api.pid"
API_LOG="$BACKEND_RUNTIME_DIR/api.log"
API_ERR_LOG="$BACKEND_RUNTIME_DIR/api-error.log"

DOTNET_CMD="$(sh "$SCRIPT_DIR/ensure-dotnet.sh" "$REPO_ROOT")"

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

mkdir -p "$BACKEND_DATA_DIR" "$BACKEND_RUNTIME_DIR"
stop_tracked_process "$API_PID_FILE"

seed_value=false
if [ "$SEED_DEMO_DATA" -eq 1 ]; then
  seed_value=true
fi

if [ "$USE_DOCKER" -eq 1 ]; then
  if ! docker_available; then
    echo "Docker mode was requested, but Docker is not available on this machine." >&2
    exit 1
  fi

  (
    cd "$REPO_ROOT"
    docker compose up -d postgres
  )

  API_ENV_PREFIX="ASPNETCORE_ENVIRONMENT=Development ASPNETCORE_URLS=http://127.0.0.1:5198 Platform__Mode=BackendOnly Bootstrap__ApplyMigrationsOnStartup=true Bootstrap__SeedDemoData=$seed_value Database__Provider=Postgres ConnectionStrings__ContextLayer='Host=localhost;Port=5432;Database=context_layer_db;Username=postgres;Password=postgres' ConnectionStrings__CustomerOps='Host=localhost;Port=5432;Database=customer_ops_db;Username=postgres;Password=postgres'"
else
  API_ENV_PREFIX="ASPNETCORE_ENVIRONMENT=Development ASPNETCORE_URLS=http://127.0.0.1:5198 Platform__Mode=BackendOnly Bootstrap__ApplyMigrationsOnStartup=true Bootstrap__SeedDemoData=$seed_value Database__Provider=Sqlite ConnectionStrings__ContextLayer='Data Source=$BACKEND_DATA_DIR/context_layer.db' ConnectionStrings__CustomerOps='Data Source=$BACKEND_DATA_DIR/customer_ops.db' Telemetry__OtlpEndpoint=''"
fi

(
  cd "$REPO_ROOT"
  nohup sh -lc "$API_ENV_PREFIX \"$DOTNET_CMD\" run --project src/ContextLayer.Api" >"$API_LOG" 2>"$API_ERR_LOG" &
  echo $! >"$API_PID_FILE"
)

wait_for_url "http://127.0.0.1:5198/health"

echo
echo "Context Layer backend is running."
echo "API:      http://127.0.0.1:5198"
echo "GraphQL:  http://127.0.0.1:5198/graphql"
echo "REST doc: http://127.0.0.1:5198/swagger"
echo "Health:   http://127.0.0.1:5198/health"
