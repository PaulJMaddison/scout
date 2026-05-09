#!/usr/bin/env sh
set -eu

REPO_ROOT="$1"
GLOBAL_JSON_PATH="$REPO_ROOT/global.json"

if [ ! -f "$GLOBAL_JSON_PATH" ]; then
  echo "Could not find '$GLOBAL_JSON_PATH'." >&2
  exit 1
fi

required_sdk_version="$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$GLOBAL_JSON_PATH" | head -n 1)"
if [ -z "$required_sdk_version" ]; then
  echo "The SDK version was not found in '$GLOBAL_JSON_PATH'." >&2
  exit 1
fi

version_to_int() {
  echo "$1" | awk -F. '{ printf("%d%03d%03d\n", $1, $2, $3); }'
}

dotnet_meets_requirement() {
  dotnet_path="$1"
  required_version="$2"
  if [ ! -x "$dotnet_path" ]; then
    return 1
  fi

  required_major_minor="$(echo "$required_version" | awk -F. '{ print $1 "." $2 }')"
  required_value="$(version_to_int "$required_version")"

  sdk_list="$("$dotnet_path" --list-sdks 2>/dev/null || true)"
  old_ifs="$IFS"
  IFS='
'
  for line in $sdk_list; do
    installed_version="$(echo "$line" | awk '{ print $1 }')"
    case "$installed_version" in
      "$required_major_minor".*)
        installed_value="$(version_to_int "$installed_version")"
        if [ "$installed_value" -ge "$required_value" ]; then
          IFS="$old_ifs"
          return 0
        fi
        ;;
    esac
  done
  IFS="$old_ifs"

  return 1
}

install_local_dotnet_sdk() {
  install_directory="$REPO_ROOT/.dotnet"
  runtime_directory="$REPO_ROOT/.demo-runtime"
  mkdir -p "$runtime_directory"

  install_script_path="$runtime_directory/dotnet-install.sh"
  echo ">> Downloading .NET SDK installer for $required_sdk_version"
  curl -fsSL "https://dot.net/v1/dotnet-install.sh" -o "$install_script_path"
  chmod +x "$install_script_path"

  echo ">> Installing .NET SDK $required_sdk_version into $install_directory"
  "$install_script_path" --version "$required_sdk_version" --install-dir "$install_directory" --no-path >/dev/null

  local_dotnet="$install_directory/dotnet"
  if ! dotnet_meets_requirement "$local_dotnet" "$required_sdk_version"; then
    echo "The local .NET SDK installation did not produce a compatible SDK at '$local_dotnet'." >&2
    exit 1
  fi

  printf '%s\n' "$local_dotnet"
}

local_dotnet="$REPO_ROOT/.dotnet/dotnet"
if dotnet_meets_requirement "$local_dotnet" "$required_sdk_version"; then
  printf '%s\n' "$local_dotnet"
  exit 0
fi

if command -v dotnet >/dev/null 2>&1; then
  global_dotnet="$(command -v dotnet)"
  if dotnet_meets_requirement "$global_dotnet" "$required_sdk_version"; then
    printf '%s\n' "$global_dotnet"
    exit 0
  fi
fi

install_local_dotnet_sdk
