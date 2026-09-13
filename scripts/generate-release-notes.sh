#!/usr/bin/env bash
# Generate comprehensive release notes for a GitHub Release.
#
# Usage:
#   ./scripts/generate-release-notes.sh <tag> [previous_tag]
#
# Produces a Markdown document with sections:
#   What's Changed · Features · Bug Fixes · Performance · Breaking Changes
#   Documentation · New Contributors · Full Changelog
#
# Requires: gh (GitHub CLI), git, jq (optional — falls back to grep parsing)

set -euo pipefail

TAG="${1:?Usage: $0 <tag> [previous_tag]}"
PREV_TAG="${2:-}"

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
if [ -z "$REPO" ]; then
  # Fallback: derive from git remote
  REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
  REPO=$(echo "$REMOTE_URL" | sed -E 's#.*github\.com[:/]##; s#\.git$##')
fi

# ── Resolve previous tag if not supplied ────────────────────────────────────
if [ -z "$PREV_TAG" ]; then
  # Use git describe to find the previous tag — works for both direct (v*)
  # and package-scoped (packages/*/v*) tags.
  PREV_TAG=$(git describe --tags --abbrev=0 "${TAG}^" 2>/dev/null || echo "")
fi

if [ -z "$PREV_TAG" ]; then
  echo "⚠️  Could not determine previous tag — generating notes for the entire history."
  LOG_RANGE="${TAG}"
else
  LOG_RANGE="${PREV_TAG}..${TAG}"
fi

# ── Collect commits ─────────────────────────────────────────────────────────
declare -A SECTIONS=()
SECTIONS[feat]=""
SECTIONS[fix]=""
SECTIONS[perf]=""
SECTIONS[docs]=""
SECTIONS[breaking]=""
SECTIONS[chore]=""

NEW_CONTRIBUTORS=""
ALL_CHANGES=""

while IFS= read -r line; do
  SHA="${line%%|*}"
  rest="${line#*|}"
  AUTHOR="${rest%%|*}"
  rest="${rest#*|}"
  SUBJECT="${rest%%|*}"
  rest="${rest#*|}"
  AUTHOR_NAME="${rest%%|*}"
  AUTHOR_EMAIL="${rest#*|}"
  SHORT_SHA="${SHA:0:7}"

  # Parse Conventional Commit prefix
  TYPE=""
  DESC="$SUBJECT"
  if [[ "$SUBJECT" =~ ^([a-z]+)(\(.+\))?!:\ (.+)$ ]]; then
    TYPE="${BASH_REMATCH[1]}"
    DESC="${BASH_REMATCH[3]}"
  elif [[ "$SUBJECT" =~ ^([a-z]+)(\(.+\))?:\ (.+)$ ]]; then
    TYPE="${BASH_REMATCH[1]}"
    DESC="${BASH_REMATCH[3]}"
  fi

  # Link PR numbers — handles formats: (#123), #123, Merge pull request #123
  PR_LINK=""
  if [[ "$SUBJECT" =~ \(\#([0-9]+)\) ]]; then
    PR_NUM="${BASH_REMATCH[1]}"
    PR_LINK="([#${PR_NUM}](https://github.com/${REPO}/pull/${PR_NUM}))"
  elif [[ "$SUBJECT" =~ \ #[0-9]+ ]]; then
    PR_NUM="${BASH_REMATCH[0]##\ #}"
    PR_LINK="([#${PR_NUM}](https://github.com/${REPO}/pull/${PR_NUM}))"
  fi

  LINE="- ${DESC} ${PR_LINK} (${SHORT_SHA})"

  case "$TYPE" in
    feat)       SECTIONS[feat]+="${LINE}"$'\n' ;;
    fix)        SECTIONS[fix]+="${LINE}"$'\n' ;;
    perf)       SECTIONS[perf]+="${LINE}"$'\n' ;;
    docs)       SECTIONS[docs]+="${LINE}"$'\n' ;;
    chore)      SECTIONS[chore]+="${LINE}"$'\n' ;;
    refactor)   SECTIONS[chore]+="${LINE}"$'\n' ;;
    test|ci|build) ;;  # skip hidden sections
    *)          ALL_CHANGES+="${LINE}"$'\n' ;;
  esac

  # Track breaking changes
  if [[ "$SUBJECT" =~ \!:\  ]] || [[ "$TYPE" == "feat!" ]] || [[ "$TYPE" == "fix!" ]]; then
    SECTIONS[breaking]+="${LINE}"$'\n'
  fi

done < <(git log "${LOG_RANGE}" --pretty=format:'%H|%an|%s|%an|%ae' --no-merges 2>/dev/null || echo "")

# ── Collect new contributors ────────────────────────────────────────────────
PREV_TAG_AUTHORS=""
if [ -n "$PREV_TAG" ]; then
  PREV_TAG_AUTHORS=$(git log "${PREV_TAG}" --pretty=format:'%ae' --no-merges 2>/dev/null | sort -u || echo "")
fi

NEW_CONTRIBUTORS=""
while IFS= read -r line; do
  [ -z "$line" ] && continue
  AUTHOR_EMAIL=$(echo "$line" | cut -d'|' -f5)
  AUTHOR_NAME=$(echo "$line" | cut -d'|' -f4)
  if ! echo "$PREV_TAG_AUTHORS" | grep -qF "$AUTHOR_EMAIL" 2>/dev/null; then
    # Check if already listed
    if ! echo "$NEW_CONTRIBUTORS" | grep -qF "$AUTHOR_NAME"; then
      NEW_CONTRIBUTORS+="@${AUTHOR_NAME} "
    fi
  fi
done < <(git log "${LOG_RANGE}" --pretty=format:'%H|%an|%s|%an|%ae' --no-merges 2>/dev/null || echo "")

# ── Build output ────────────────────────────────────────────────────────────
OUT=""
OUT+="## What's Changed"$'\n\n'

HAS_CONTENT=false

if [ -n "${SECTIONS[breaking]}" ]; then
  OUT+="### ⚠️ Breaking Changes"$'\n\n'
  OUT+="${SECTIONS[breaking]}"$'\n'
  HAS_CONTENT=true
fi

if [ -n "${SECTIONS[feat]}" ]; then
  OUT+="### 🚀 Features"$'\n\n'
  OUT+="${SECTIONS[feat]}"$'\n'
  HAS_CONTENT=true
fi

if [ -n "${SECTIONS[fix]}" ]; then
  OUT+="### 🐛 Bug Fixes"$'\n\n'
  OUT+="${SECTIONS[fix]}"$'\n'
  HAS_CONTENT=true
fi

if [ -n "${SECTIONS[perf]}" ]; then
  OUT+="### ⚡ Performance Improvements"$'\n\n'
  OUT+="${SECTIONS[perf]}"$'\n'
  HAS_CONTENT=true
fi

if [ -n "${SECTIONS[docs]}" ]; then
  OUT+="### 📚 Documentation"$'\n\n'
  OUT+="${SECTIONS[docs]}"$'\n'
  HAS_CONTENT=true
fi

if [ -n "${SECTIONS[chore]}" ]; then
  OUT+="### 🔧 Miscellaneous"$'\n\n'
  OUT+="${SECTIONS[chore]}"$'\n'
  HAS_CONTENT=true
fi

if [ -n "$ALL_CHANGES" ] && [ "$HAS_CONTENT" = false ]; then
  OUT+="${ALL_CHANGES}"$'\n'
fi

# ── New contributors ────────────────────────────────────────────────────────
TRIMMED=$(echo "$NEW_CONTRIBUTORS" | xargs 2>/dev/null || echo "")
if [ -n "$TRIMMED" ]; then
  OUT+="### 🎉 New Contributors"$'\n\n'
  for name in $TRIMMED; do
    OUT+="- ${name} made their first contribution"$'\n'
  done
  OUT+=$'\n'
fi

# ── Full changelog link ─────────────────────────────────────────────────────
if [ -n "$PREV_TAG" ]; then
  OUT+="**Full Changelog**: https://github.com/${REPO}/compare/${PREV_TAG}...${TAG}"$'\n'
else
  OUT+="**Full Changelog**: https://github.com/${REPO}/releases/tag/${TAG}"$'\n'
fi

echo "$OUT"
