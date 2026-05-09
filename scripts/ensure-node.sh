#!/usr/bin/env sh
set -eu

REPO_ROOT="$1"
REQUIRED_NODE_VERSION="v22.20.0"

version_to_int() {
  echo "$1" | awk -F. '{ printf("%d%03d%03d\n", $1, $2, $3); }'
}

required_node_value="$(version_to_int "$(echo "$REQUIRED_NODE_VERSION" | sed 's/^v//')")"

get_platform_suffix() {
  os_name="$(uname -s)"
  arch_name="$(uname -m)"

  case "$os_name" in
    Linux)
      case "$arch_name" in
        x86_64) printf '%s\n' 'linux-x64' ;;
        aarch64|arm64) printf '%s\n' 'linux-arm64' ;;
        *) echo "Unsupported Linux architecture '$arch_name' for the bundled Node.js bootstrap." >&2; exit 1 ;;
      esac
      ;;
    Darwin)
      case "$arch_name" in
        x86_64) printf '%s\n' 'darwin-x64' ;;
        arm64) printf '%s\n' 'darwin-arm64' ;;
        *) echo "Unsupported macOS architecture '$arch_name' for the bundled Node.js bootstrap." >&2; exit 1 ;;
      esac
      ;;
    *)
      echo "Unsupported operating system '$os_name' for the bundled Node.js bootstrap." >&2
      exit 1
      ;;
  esac
}

node_meets_requirement() {
  node_path="$1"
  if [ ! -x "$node_path" ]; then
    return 1
  fi

  installed_version="$("$node_path" --version 2>/dev/null || true)"
  if [ -z "$installed_version" ]; then
    return 1
  fi

  installed_value="$(version_to_int "$(echo "$installed_version" | sed 's/^v//')")"
  [ "$installed_value" -ge "$required_node_value" ]
}

install_local_node() {
  platform_suffix="$(get_platform_suffix)"
  install_root="$REPO_ROOT/.node"
  runtime_directory="$REPO_ROOT/.demo-runtime"
  archive_root="node-$REQUIRED_NODE_VERSION-$platform_suffix"
  archive_path="$runtime_directory/$archive_root.tar.xz"
  download_uri="https://nodejs.org/dist/$REQUIRED_NODE_VERSION/$archive_root.tar.xz"

  mkdir -p "$runtime_directory"
  echo ">> Downloading Node.js $REQUIRED_NODE_VERSION"
  curl -fsSL "$download_uri" -o "$archive_path"

  rm -rf "$install_root"
  mkdir -p "$install_root"
  echo ">> Installing Node.js $REQUIRED_NODE_VERSION into $install_root"
  tar -xJf "$archive_path" -C "$install_root"

  install_directory="$install_root/$archive_root"
  if ! node_meets_requirement "$install_directory/bin/node"; then
    echo "The local Node.js installation did not produce a compatible runtime at '$install_directory/bin/node'." >&2
    exit 1
  fi

  printf '%s\n' "$install_directory/bin"
}

platform_suffix="$(get_platform_suffix)"
local_install_root="$REPO_ROOT/.node/node-$REQUIRED_NODE_VERSION-$platform_suffix"
if node_meets_requirement "$local_install_root/bin/node" && [ -x "$local_install_root/bin/npm" ]; then
  printf '%s\n' "$local_install_root/bin"
  exit 0
fi

if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
  global_node="$(command -v node)"
  if node_meets_requirement "$global_node"; then
    printf '%s\n' "$(dirname "$global_node")"
    exit 0
  fi
fi

install_local_node
