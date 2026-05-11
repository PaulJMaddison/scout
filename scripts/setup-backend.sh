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

DOTNET_CMD="$(sh "$SCRIPT_DIR/ensure-dotnet.sh" "$REPO_ROOT")"

run_repo_command() {
  command_text="$1"
  echo ">> $command_text"
  (
    cd "$REPO_ROOT"
    sh -lc "$command_text"
  )
}

docker_available() {
  if ! command -v docker >/dev/null 2>&1; then
    return 1
  fi

  docker version >/dev/null 2>&1
}

mkdir -p "$BACKEND_DATA_DIR"
run_repo_command "\"$DOTNET_CMD\" tool restore"
run_repo_command "\"$DOTNET_CMD\" restore ContextLayer.slnx"

if [ "$USE_DOCKER" -eq 1 ]; then
  if ! docker_available; then
    echo "Docker mode was requested, but Docker is not available on this machine." >&2
    exit 1
  fi

  run_repo_command "docker compose up -d postgres"
  run_repo_command "Database__Provider=Postgres ConnectionStrings__ContextLayer='Host=localhost;Port=5432;Database=context_layer_db;Username=postgres;Password=postgres' ConnectionStrings__CustomerOps='Host=localhost;Port=5432;Database=customer_ops_db;Username=postgres;Password=postgres' \"$DOTNET_CMD\" tool run dotnet-ef database update --project src/ContextLayer.Infrastructure --startup-project src/ContextLayer.Api --context CustomerOpsDbContext"
  run_repo_command "Database__Provider=Postgres ConnectionStrings__ContextLayer='Host=localhost;Port=5432;Database=context_layer_db;Username=postgres;Password=postgres' ConnectionStrings__CustomerOps='Host=localhost;Port=5432;Database=customer_ops_db;Username=postgres;Password=postgres' \"$DOTNET_CMD\" tool run dotnet-ef database update --project src/ContextLayer.Infrastructure --startup-project src/ContextLayer.Api --context ContextLayerDbContext"

  if [ "$SEED_DEMO_DATA" -eq 1 ]; then
    run_repo_command "Platform__Mode=BackendOnly Bootstrap__ApplyMigrationsOnStartup=true Bootstrap__SeedDemoData=true Database__Provider=Postgres ConnectionStrings__ContextLayer='Host=localhost;Port=5432;Database=context_layer_db;Username=postgres;Password=postgres' ConnectionStrings__CustomerOps='Host=localhost;Port=5432;Database=customer_ops_db;Username=postgres;Password=postgres' \"$DOTNET_CMD\" run --project src/ContextLayer.Api -- bootstrap"
  fi
else
  seed_value=false
  if [ "$SEED_DEMO_DATA" -eq 1 ]; then
    seed_value=true
  fi

  run_repo_command "Platform__Mode=BackendOnly Bootstrap__ApplyMigrationsOnStartup=true Bootstrap__SeedDemoData=$seed_value Database__Provider=Sqlite ConnectionStrings__ContextLayer='Data Source=$BACKEND_DATA_DIR/context_layer.db' ConnectionStrings__CustomerOps='Data Source=$BACKEND_DATA_DIR/customer_ops.db' Telemetry__OtlpEndpoint='' \"$DOTNET_CMD\" run --project src/ContextLayer.Api -- bootstrap"
fi

cat <<EOF

Context Layer backend bootstrap complete.

Start locally:
  sh ./scripts/start-backend.sh

Optional seeded demo data:
  sh ./scripts/setup-backend.sh --seed-demo-data

Optional PostgreSQL mode:
  sh ./scripts/setup-backend.sh --use-docker

API base:          http://127.0.0.1:5198
GraphQL:           http://127.0.0.1:5198/graphql
REST docs:         http://127.0.0.1:5198/swagger
Health:            http://127.0.0.1:5198/health
EOF
