#!/usr/bin/env sh
set -eu

KEEP_VOLUMES=0
SKIP_RECREATE=0

for arg in "$@"; do
  case "$arg" in
    --keep-volumes)
      KEEP_VOLUMES=1
      ;;
    --skip-recreate)
      SKIP_RECREATE=1
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
DEMO_DATA_DIR="$REPO_ROOT/.demo-data"
DEMO_RUNTIME_DIR="$REPO_ROOT/.demo-runtime"

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

docker_available() {
  if ! command -v docker >/dev/null 2>&1; then
    return 1
  fi

  docker version >/dev/null 2>&1
}

stop_tracked_process "$DEMO_RUNTIME_DIR/api.pid"
stop_tracked_process "$DEMO_RUNTIME_DIR/web.pid"
rm -rf "$DEMO_RUNTIME_DIR"

if docker_available; then
  if [ "$KEEP_VOLUMES" -eq 1 ]; then
    DOWN_COMMAND="docker compose down --remove-orphans"
  else
    DOWN_COMMAND="docker compose down --remove-orphans -v"
  fi

  echo ">> $DOWN_COMMAND"
  (
    cd "$REPO_ROOT"
    sh -lc "$DOWN_COMMAND"
  )
fi

if [ "$KEEP_VOLUMES" -eq 0 ]; then
  rm -rf "$DEMO_DATA_DIR"
fi

if [ "$SKIP_RECREATE" -eq 0 ]; then
  sh "$SCRIPT_DIR/setup-demo.sh"
fi
