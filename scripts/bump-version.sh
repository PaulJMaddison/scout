#!/usr/bin/env bash
set -euo pipefail

# bump-version.sh -- Update version numbers across all relevant files in a UCL repo.
#
# Usage:
#   ./scripts/bump-version.sh X.Y.Z [--dry-run]
#
# The version argument must match the pattern MAJOR.MINOR.PATCH (without the v prefix).
# Use --dry-run to preview what would change without modifying files.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

DRY_RUN=false
VERSION=""

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=true
      ;;
    -*)
      echo "ERROR: Unknown flag: $arg" >&2
      echo "Usage: $0 X.Y.Z [--dry-run]" >&2
      exit 1
      ;;
    *)
      if [ -z "$VERSION" ]; then
        VERSION="$arg"
      else
        echo "ERROR: Unexpected argument: $arg" >&2
        echo "Usage: $0 X.Y.Z [--dry-run]" >&2
        exit 1
      fi
      ;;
  esac
done

if [ -z "$VERSION" ]; then
  echo "ERROR: Version argument is required." >&2
  echo "Usage: $0 X.Y.Z [--dry-run]" >&2
  exit 1
fi

# Strip leading v if provided
VERSION="${VERSION#v}"

# Validate version format: MAJOR.MINOR.PATCH
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "ERROR: Version must match the pattern X.Y.Z (e.g. 2.8.0)." >&2
  exit 1
fi

echo "Universal Context Layer — Bump Version"
echo "======================================="
echo "New version: $VERSION"
echo "Repo:        $REPO_ROOT"
echo "Dry run:     $DRY_RUN"
echo ""

MODIFIED_FILES=()

# Helper: update a file using sed. Accepts a sed expression, a file path, and a description.
update_file() {
  local sed_expr="$1"
  local file_path="$2"
  local description="$3"

  if [ ! -f "$file_path" ]; then
    return
  fi

  # Check if the sed expression would change anything
  if ! sed "$sed_expr" "$file_path" | diff -q "$file_path" - >/dev/null 2>&1; then
    if [ "$DRY_RUN" = true ]; then
      echo "[DRY RUN] Would update: $file_path ($description)"
    else
      sed -i "$sed_expr" "$file_path"
      echo "Updated: $file_path ($description)"
    fi
    MODIFIED_FILES+=("$file_path")
  fi
}

# --- .csproj files: Update <Version>, <VersionPrefix>, <AssemblyVersion>, <FileVersion>, <InformationalVersion> ---

while IFS= read -r csproj; do
  update_file "s|<Version>[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*</Version>|<Version>${VERSION}</Version>|g" \
    "$csproj" "Version"
  update_file "s|<VersionPrefix>[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*</VersionPrefix>|<VersionPrefix>${VERSION}</VersionPrefix>|g" \
    "$csproj" "VersionPrefix"
  update_file "s|<AssemblyVersion>[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*</AssemblyVersion>|<AssemblyVersion>${VERSION}.0</AssemblyVersion>|g" \
    "$csproj" "AssemblyVersion"
  update_file "s|<FileVersion>[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*</FileVersion>|<FileVersion>${VERSION}.0</FileVersion>|g" \
    "$csproj" "FileVersion"
  update_file "s|<InformationalVersion>[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*</InformationalVersion>|<InformationalVersion>${VERSION}</InformationalVersion>|g" \
    "$csproj" "InformationalVersion"
done < <(find "$REPO_ROOT" -name "*.csproj" -not -path "*/bin/*" -not -path "*/obj/*" 2>/dev/null)

# --- Directory.Build.props ---

DIRECTORY_BUILD_PROPS="$REPO_ROOT/Directory.Build.props"
if [ -f "$DIRECTORY_BUILD_PROPS" ]; then
  update_file "s|<Version>[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*</Version>|<Version>${VERSION}</Version>|g" \
    "$DIRECTORY_BUILD_PROPS" "Version"
  update_file "s|<AssemblyVersion>[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*</AssemblyVersion>|<AssemblyVersion>${VERSION}.0</AssemblyVersion>|g" \
    "$DIRECTORY_BUILD_PROPS" "AssemblyVersion"
  update_file "s|<FileVersion>[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*</FileVersion>|<FileVersion>${VERSION}.0</FileVersion>|g" \
    "$DIRECTORY_BUILD_PROPS" "FileVersion"
  update_file "s|<InformationalVersion>[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*</InformationalVersion>|<InformationalVersion>${VERSION}</InformationalVersion>|g" \
    "$DIRECTORY_BUILD_PROPS" "InformationalVersion"
  update_file "s|<VersionPrefix>[0-9][0-9]*\.[0-9][0-9]*\.[0-9][0-9]*</VersionPrefix>|<VersionPrefix>${VERSION}</VersionPrefix>|g" \
    "$DIRECTORY_BUILD_PROPS" "VersionPrefix"
fi

# --- package.json files ---

while IFS= read -r pkg_json; do
  # Only update the top-level "version" field (first occurrence)
  if [ "$DRY_RUN" = true ]; then
    if grep -q '"version"' "$pkg_json" 2>/dev/null; then
      CURRENT=$(grep -m1 '"version"' "$pkg_json" | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
      if [ "$CURRENT" != "$VERSION" ]; then
        echo "[DRY RUN] Would update: $pkg_json (version $CURRENT -> $VERSION)"
        MODIFIED_FILES+=("$pkg_json")
      fi
    fi
  else
    if grep -q '"version"' "$pkg_json" 2>/dev/null; then
      CURRENT=$(grep -m1 '"version"' "$pkg_json" | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
      if [ "$CURRENT" != "$VERSION" ]; then
        sed -i "0,/\"version\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/s/\"version\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"version\": \"${VERSION}\"/" "$pkg_json"
        echo "Updated: $pkg_json (version $CURRENT -> $VERSION)"
        MODIFIED_FILES+=("$pkg_json")
      fi
    fi
  fi
done < <(find "$REPO_ROOT" -name "package.json" -not -path "*/node_modules/*" -not -path "*/bin/*" -not -path "*/obj/*" 2>/dev/null)

# --- Chart.yaml (Helm) ---

while IFS= read -r chart_yaml; do
  update_file "s|^version:.*|version: ${VERSION}|" "$chart_yaml" "chart version"
  update_file "s|^appVersion:.*|appVersion: ${VERSION}|" "$chart_yaml" "app version"
done < <(find "$REPO_ROOT" -name "Chart.yaml" -not -path "*/bin/*" -not -path "*/obj/*" 2>/dev/null)

# --- Summary ---

echo ""
if [ ${#MODIFIED_FILES[@]} -eq 0 ]; then
  echo "No files needed updating (already at version $VERSION or no matching files found)."
else
  # Deduplicate
  UNIQUE_FILES=($(printf '%s\n' "${MODIFIED_FILES[@]}" | sort -u))
  echo "Files modified (${#UNIQUE_FILES[@]}):"
  for f in "${UNIQUE_FILES[@]}"; do
    echo "  $f"
  done
fi

if [ "$DRY_RUN" = true ]; then
  echo ""
  echo "Dry run complete. No files were modified."
fi
