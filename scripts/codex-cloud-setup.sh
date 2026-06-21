#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() {
  printf '\n[%s] %s\n' "$(date -u '+%H:%M:%S')" "$*"
}

run_as_root() {
  if [ "$(id -u)" = "0" ]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    log "Skipping root command because sudo is unavailable: $*"
  fi
}

apt_install() {
  if [ "${CODEX_CLOUD_APT:-1}" != "1" ] || ! command -v apt-get >/dev/null 2>&1; then
    return 0
  fi

  log "Installing base OS packages"
  run_as_root apt-get update
  run_as_root apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    build-essential \
    pkg-config \
    python3 \
    python3-venv \
    python3-pip \
    xz-utils
}

ensure_dotnet() {
  export DOTNET_ROOT="${DOTNET_ROOT:-$HOME/.dotnet}"
  export PATH="$DOTNET_ROOT:$DOTNET_ROOT/tools:$PATH"

  if command -v dotnet >/dev/null 2>&1; then
    log "Using dotnet $(dotnet --version)"
    return 0
  fi

  local version="${DOTNET_VERSION:-10.0.203}"
  log "Installing .NET SDK ${version}"
  mkdir -p "$DOTNET_ROOT" .codex-cloud/tmp
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o .codex-cloud/tmp/dotnet-install.sh
  bash .codex-cloud/tmp/dotnet-install.sh --version "$version" --install-dir "$DOTNET_ROOT"
  dotnet --info
}

ensure_node() {
  local min_version="${NODE_MIN_VERSION:-22.12.0}"

  if node_satisfies_min "$min_version"; then
    log "Using node $(node --version) and npm $(npm --version)"
    return 0
  fi

  if command -v node >/dev/null 2>&1; then
    log "Node $(node --version) is older than the required version ${min_version}"
  fi

  install_node_tarball "$min_version"

  if ! node_satisfies_min "$min_version"; then
    log "Node.js ${min_version}+ and npm are required. Current node is $(node --version 2>/dev/null || printf 'not installed')."
    return 1
  fi

  log "Using node $(node --version) and npm $(npm --version)"
}

node_satisfies_min() {
  local min_version="$1"

  command -v node >/dev/null 2>&1 || return 1
  command -v npm >/dev/null 2>&1 || return 1

  node - "$min_version" <<'NODE'
const min = process.argv[2].split('.').map(Number)
const current = process.versions.node.split('.').map(Number)
for (let i = 0; i < 3; i += 1) {
  if (current[i] > min[i]) process.exit(0)
  if (current[i] < min[i]) process.exit(1)
}
process.exit(0)
NODE
}

install_node_tarball() {
  local node_version="${NODE_VERSION:-$1}"
  local node_tag="v${node_version#v}"
  local arch

  case "$(uname -m)" in
    x86_64|amd64) arch="x64" ;;
    aarch64|arm64) arch="arm64" ;;
    *)
      log "Unsupported CPU architecture for Node.js tarball install: $(uname -m)"
      return 1
      ;;
  esac

  local install_dir="$ROOT_DIR/.codex-cloud/node-${node_tag}-linux-${arch}"
  local archive="$ROOT_DIR/.codex-cloud/tmp/node-${node_tag}-linux-${arch}.tar.xz"

  if [ ! -x "$install_dir/bin/node" ]; then
    log "Installing Node.js ${node_tag} into ${install_dir}"
    mkdir -p "$ROOT_DIR/.codex-cloud/tmp" "$install_dir"
    curl -fsSL "https://nodejs.org/dist/${node_tag}/node-${node_tag}-linux-${arch}.tar.xz" -o "$archive"
    rm -rf "$install_dir"
    mkdir -p "$install_dir"
    tar -xJf "$archive" -C "$install_dir" --strip-components=1
  fi

  export PATH="$install_dir/bin:$PATH"
}

npm_install_dir() {
  local dir="$1"
  if [ ! -f "$dir/package.json" ]; then
    log "Expected package.json was not found in ${dir}"
    return 1
  fi

  log "Installing npm dependencies in ${dir}"
  if [ -f "$dir/package-lock.json" ]; then
    npm --prefix "$dir" ci --include=dev
  else
    npm --prefix "$dir" install --include=dev
  fi
}

optional_services() {
  if [ "${CODEX_CLOUD_START_SERVICES:-0}" != "1" ]; then
    log "Skipping Docker services. Set CODEX_CLOUD_START_SERVICES=1 to start docker compose."
    return 0
  fi

  if ! command -v docker >/dev/null 2>&1; then
    log "Docker is not available in this environment"
    return 0
  fi

  if [ -f docker-compose.yml ]; then
    log "Starting docker compose services"
    docker compose pull || true
    docker compose up -d
  fi
}

optional_ollama_models() {
  if [ -z "${CODEX_CLOUD_OLLAMA_MODELS:-}" ]; then
    log "Skipping Ollama model pulls. Set CODEX_CLOUD_OLLAMA_MODELS='qwen2.5:7b' if needed."
    return 0
  fi

  if ! command -v ollama >/dev/null 2>&1; then
    log "Ollama is not available in this environment"
    return 0
  fi

  for model in ${CODEX_CLOUD_OLLAMA_MODELS}; do
    log "Pulling Ollama model ${model}"
    ollama pull "$model"
  done
}

optional_smoke() {
  if [ "${CODEX_CLOUD_RUN_SMOKE:-0}" != "1" ]; then
    log "Skipping smoke checks. Set CODEX_CLOUD_RUN_SMOKE=1 to run restore/build checks."
    return 0
  fi

  log "Running Scout smoke checks"
  dotnet build KynticAI.Scout.slnx --no-restore
  npm --prefix apps/web run build
  npm --prefix docs-site run build
}

log "Preparing KynticAI Scout Codex Cloud environment"
mkdir -p .codex-cloud/{cache,data,evidence,logs,models,tmp}

apt_install
ensure_dotnet
ensure_node

log "Restoring .NET solution"
dotnet restore KynticAI.Scout.slnx

for dir in \
  apps/web \
  apps/discovery-agent \
  docs-site \
  packages/typescript/scout-sdk \
  packages/typescript/n8n-node \
  packages/typescript/scout-n8n-node
do
  npm_install_dir "$dir"
done

optional_services
optional_ollama_models
optional_smoke

log "Scout cloud setup complete"
log "Typical next step: dotnet test KynticAI.Scout.slnx --no-restore --filter 'Category!=Integration'"
