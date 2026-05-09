#!/usr/bin/env sh
set -eu

START_CONTAINERS=0
if [ "${1:-}" = "--start-containers" ]; then
  START_CONTAINERS=1
fi

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
ROOT_ENV_PATH="$REPO_ROOT/.env"
ROOT_ENV_EXAMPLE_PATH="$REPO_ROOT/.env.example"
WEB_ENV_PATH="$REPO_ROOT/apps/web/.env.local"
DEMO_DATA_DIR="$REPO_ROOT/.demo-data"

if [ -x "$REPO_ROOT/.dotnet/dotnet" ]; then
  DOTNET_CMD="$REPO_ROOT/.dotnet/dotnet"
else
  DOTNET_CMD="dotnet"
fi

assert_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command '$1' was not found in PATH." >&2
    exit 1
  fi
}

ensure_file_from_example() {
  target_path="$1"
  example_path="$2"
  if [ ! -f "$target_path" ]; then
    cp "$example_path" "$target_path"
  fi
}

set_web_env() {
  cat >"$WEB_ENV_PATH" <<'EOF'
VITE_API_BASE_URL=http://127.0.0.1:5198
VITE_GRAPHQL_ENDPOINT=http://127.0.0.1:5198/graphql
VITE_DEMO_FALLBACK=false
EOF
}

run_repo_command() {
  command_text="$1"
  working_directory="${2:-$REPO_ROOT}"
  echo ">> $command_text"
  (
    cd "$working_directory"
    sh -lc "$command_text"
  )
}

docker_available() {
  if ! command -v docker >/dev/null 2>&1; then
    return 1
  fi

  docker version >/dev/null 2>&1
}

assert_command node
assert_command npm
ensure_file_from_example "$ROOT_ENV_PATH" "$ROOT_ENV_EXAMPLE_PATH"
set_web_env

MODE="sqlite"
if docker_available; then
  MODE="docker"
fi

mkdir -p "$DEMO_DATA_DIR"

run_repo_command "\"$DOTNET_CMD\" tool restore"
run_repo_command "\"$DOTNET_CMD\" restore ContextLayer.slnx"

if [ "$MODE" = "docker" ]; then
  echo "Docker is available. Bootstrapping PostgreSQL-backed demo infrastructure."
  run_repo_command "docker compose up -d postgres otel-collector prometheus tempo grafana"

  postgres_ready=0
  attempt=1
  while [ "$attempt" -le 30 ]; do
    if docker compose exec -T postgres sh -lc 'pg_isready -U "${POSTGRES_USER:-postgres}" -d postgres' >/dev/null 2>&1; then
      postgres_ready=1
      break
    fi
    attempt=$((attempt + 1))
    sleep 2
  done

  if [ "$postgres_ready" -ne 1 ]; then
    echo "PostgreSQL did not become ready within the expected time window." >&2
    exit 1
  fi

  run_repo_command "\"$DOTNET_CMD\" tool run dotnet-ef database update --project src/ContextLayer.Infrastructure --startup-project src/ContextLayer.Api --context CustomerOpsDbContext"
  run_repo_command "\"$DOTNET_CMD\" tool run dotnet-ef database update --project src/ContextLayer.Infrastructure --startup-project src/ContextLayer.Api --context ContextLayerDbContext"
  run_repo_command "\"$DOTNET_CMD\" run --project src/ContextLayer.Api -- bootstrap-demo"

  if [ "$START_CONTAINERS" -eq 1 ]; then
    run_repo_command "docker compose up -d api web"
  fi
else
  echo "Docker is not available. Bootstrapping the local two-database demo using SQLite files."
  run_repo_command "Database__Provider=Sqlite ConnectionStrings__ContextLayer='Data Source=$DEMO_DATA_DIR/context_layer_demo.db' ConnectionStrings__CustomerOps='Data Source=$DEMO_DATA_DIR/customer_ops_demo.db' Telemetry__OtlpEndpoint='' \"$DOTNET_CMD\" run --project src/ContextLayer.Api -- bootstrap-demo"
fi

run_repo_command "npm install" "$REPO_ROOT/apps/web"

cat <<EOF

Context Layer demo bootstrap complete.
Mode: $MODE

Start locally:
  sh ./scripts/start-demo.sh

Web app:           http://127.0.0.1:5173
API base:          http://127.0.0.1:5198
GraphQL:           http://127.0.0.1:5198/graphql
Health:            http://127.0.0.1:5198/health
EOF
