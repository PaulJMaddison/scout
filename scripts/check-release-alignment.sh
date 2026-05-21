#!/usr/bin/env bash
set -euo pipefail

EXPECTED_BRANCH="${1:-main}"
HOSTING_PLAN="${2:-MainAfterPromotion}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

invoke_git() {
  git "$@" 2>/dev/null || echo ""
}

write_value() {
  local name="$1" value="${2:-(none)}"
  echo "$name: $value"
}

BRANCH=$(invoke_git branch --show-current)
UPSTREAM=$(invoke_git rev-parse --abbrev-ref --symbolic-full-name "@{upstream}")
STATUS=$(invoke_git status --short)
LATEST_TAG=$(invoke_git describe --tags --abbrev=0)
AHEAD="unknown"
BEHIND="unknown"

if [ -n "$UPSTREAM" ]; then
  COUNTS=$(invoke_git rev-list --left-right --count "HEAD...@{upstream}")
  if [ -n "$COUNTS" ]; then
    AHEAD=$(echo "$COUNTS" | awk '{print $1}')
    BEHIND=$(echo "$COUNTS" | awk '{print $2}')
  fi
fi

echo "KynticAI Scout public release alignment"
write_value "Repository" "$REPO_ROOT"
write_value "Current branch" "$BRANCH"
write_value "Expected readiness branch" "$EXPECTED_BRANCH"
write_value "Upstream" "$UPSTREAM"
write_value "Ahead" "$AHEAD"
write_value "Behind" "$BEHIND"
write_value "Latest tag" "$LATEST_TAG"

if [ -z "$STATUS" ]; then
  write_value "Working tree clean" "True"
else
  write_value "Working tree clean" "False"
fi

write_value "Hosting plan" "$HOSTING_PLAN"

if command -v gh > /dev/null 2>&1; then
  RELEASE=$(gh release list --limit 1 --json tagName,name,isDraft,isPrerelease,publishedAt 2>/dev/null || echo "[]")
  if [ "$RELEASE" != "[]" ] && [ -n "$RELEASE" ]; then
    TAG_NAME=$(echo "$RELEASE" | python3 -c "import sys,json; r=json.load(sys.stdin); print(r[0]['tagName'] if r else '(none)')" 2>/dev/null || echo "(none)")
    write_value "Latest GitHub release" "$TAG_NAME"
  else
    write_value "Latest GitHub release" "(none)"
  fi
else
  write_value "Latest GitHub release" "gh not available"
fi

if [ "$BRANCH" != "$EXPECTED_BRANCH" ]; then
  echo "WARNING: Current branch is not the expected readiness branch."
fi

if [ "$HOSTING_PLAN" = "FeaturePreviewOnly" ]; then
  echo "WARNING: Feature branch hosting must remain private preview only. Production hosting should use main or a reviewed tag after promotion."
fi

if [ "$HOSTING_PLAN" = "MainAfterPromotion" ] && [ "$BRANCH" != "main" ]; then
  echo "WARNING: Production hosting should point at main only after this branch is reviewed and promoted."
fi

if [ "$HOSTING_PLAN" = "TagAfterPromotion" ] && [ -z "$LATEST_TAG" ]; then
  echo "WARNING: Tag-based hosting is planned but no tag was found locally."
fi

if [ -n "$STATUS" ]; then
  echo "WARNING: Working tree is not clean. Review local changes before release or hosting decisions."
fi

echo "No merge, tag, release, push, or hosting change was performed."
