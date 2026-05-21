#!/usr/bin/env sh
set -eu

START_CONTAINERS=0
USE_DOCKER=0
for arg in "$@"; do
  case "$arg" in
    --start-containers)
      START_CONTAINERS=1
      ;;
    --use-docker)
      USE_DOCKER=1
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
ROOT_ENV_PATH="$REPO_ROOT/.env"
ROOT_ENV_EXAMPLE_PATH="$REPO_ROOT/.env.example"
WEB_ENV_PATH="$REPO_ROOT/apps/web/.env.local"
DEMO_DATA_DIR="$REPO_ROOT/.demo-data"

DOTNET_CMD="$(sh "$SCRIPT_DIR/ensure-dotnet.sh" "$REPO_ROOT")"
NODE_BIN_DIR="$(sh "$SCRIPT_DIR/ensure-node.sh" "$REPO_ROOT")"
PATH="$NODE_BIN_DIR:$PATH"
export PATH

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

ensure_demo_licence_file() {
  licence_path="$DEMO_DATA_DIR/scout-demo.licence.json"
  if [ -f "$licence_path" ]; then
    return
  fi

  issued_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  expires_at="$(date -u -d "+2 years" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v+2y +"%Y-%m-%dT%H:%M:%SZ")"
  cat >"$licence_path" <<EOF
{
  "licenceKey": "scout_demo_local_productisation_preview",
  "plan": "Community",
  "licensedTo": "KynticAI Scout local demo",
  "issuedAtUtc": "$issued_at",
  "expiresAtUtc": "$expires_at",
  "entitlements": {
    "open-core": "enabled",
    "local-demo": "enabled",
    "self-hosted-admin-console": "enabled",
    "enterprise-connectors": "not-in-public-repo"
  }
}
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
if [ "$USE_DOCKER" -eq 1 ]; then
  if ! docker_available; then
    echo "Docker mode was requested, but Docker is not available on this machine." >&2
    exit 1
  fi
  MODE="docker"
fi

mkdir -p "$DEMO_DATA_DIR"
ensure_demo_licence_file

run_repo_command "\"$DOTNET_CMD\" tool restore"
run_repo_command "\"$DOTNET_CMD\" restore KynticAI.Scout.slnx"

if [ "$MODE" = "docker" ]; then
  DOCKER_DEMO_ENV="ASPNETCORE_ENVIRONMENT=Development Platform__Mode=Demo Bootstrap__ApplyMigrationsOnStartup=true Bootstrap__SeedDemoData=true Database__Provider=Postgres ConnectionStrings__Scout='Host=localhost;Port=5432;Database=scout_context_db;Username=postgres;Password=postgres' ConnectionStrings__CustomerOps='Host=localhost;Port=5432;Database=customer_ops_db;Username=postgres;Password=postgres' Licence__Mode=Community Licence__FilePath='$DEMO_DATA_DIR/scout-demo.licence.json' Telemetry__OtlpEndpoint='http://localhost:4317'"
  echo "Docker mode was requested. Bootstrapping PostgreSQL-backed demo infrastructure."
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

  run_repo_command "$DOCKER_DEMO_ENV \"$DOTNET_CMD\" tool run dotnet-ef database update --project src/KynticAI.Scout.Infrastructure --startup-project src/KynticAI.Scout.Api --context CustomerOpsDbContext"
  run_repo_command "$DOCKER_DEMO_ENV \"$DOTNET_CMD\" tool run dotnet-ef database update --project src/KynticAI.Scout.Infrastructure --startup-project src/KynticAI.Scout.Api --context ScoutDbContext"
  run_repo_command "$DOCKER_DEMO_ENV \"$DOTNET_CMD\" run --project src/KynticAI.Scout.Api -- bootstrap-demo"

  if [ "$START_CONTAINERS" -eq 1 ]; then
    run_repo_command "docker compose up -d api web"
  fi
else
  echo "Bootstrapping the default local two-database demo using SQLite files."
  run_repo_command "Platform__Mode=Demo Bootstrap__ApplyMigrationsOnStartup=true Bootstrap__SeedDemoData=true Database__Provider=Sqlite ConnectionStrings__Scout='Data Source=$DEMO_DATA_DIR/scout_context_demo.db' ConnectionStrings__CustomerOps='Data Source=$DEMO_DATA_DIR/customer_ops_demo.db' Licence__Mode=Community Licence__FilePath='$DEMO_DATA_DIR/scout-demo.licence.json' Telemetry__OtlpEndpoint='' \"$DOTNET_CMD\" run --project src/KynticAI.Scout.Api -- bootstrap-demo"
fi

run_repo_command "npm install" "$REPO_ROOT/apps/web"

cat <<EOF

Scout demo bootstrap complete.
Mode: $MODE

Start locally:
  sh ./scripts/start-demo.sh

Optional PostgreSQL package mode:
  sh ./scripts/setup-demo.sh --use-docker

Web app:           http://127.0.0.1:5173
API base:          http://127.0.0.1:5198
GraphQL:           http://127.0.0.1:5198/graphql
Health:            http://127.0.0.1:5198/health
EOF
