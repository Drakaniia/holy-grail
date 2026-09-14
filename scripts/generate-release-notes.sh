#!/usr/bin/env bash
# Generate concise release notes for a GitHub Release.
#
# Usage:
#   ./scripts/generate-release-notes.sh <tag> [previous_tag]
#
# Produces a concise Markdown document with only:
#   What's Changed · New Contributors · Full Changelog
# PRs/commits are listed with references and contributor attribution.
# No separate sections for Features / Bug Fixes / Breaking Changes etc.
#
# Requires: gh (GitHub CLI), git

set -euo pipefail

TAG="${1:?Usage: $0 <tag> [previous_tag]}"
PREV_TAG="${2:-}"

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
if [ -z "$REPO" ]; then
  REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
  REPO=$(echo "$REMOTE_URL" | sed -E 's#.*github\.com[:/]##; s#\.git$##')
fi

# ── Resolve previous tag if not supplied ────────────────────────────────────
if [ -z "$PREV_TAG" ]; then
  PREV_TAG=$(git describe --tags --abbrev=0 "${TAG}^" 2>/dev/null || echo "")
fi

if [ -z "$PREV_TAG" ]; then
  echo "⚠️  Could not determine previous tag — generating notes for the entire history." >&2
  LOG_RANGE="${TAG}"
else
  LOG_RANGE="${PREV_TAG}..${TAG}"
fi

# ── Collect What's Changed (all commits/PRs, no categorization) ─────────────
CHANGES=""
while IFS= read -r line; do
  [ -z "$line" ] && continue
  SHA="${line%%|*}"
  rest="${line#*|}"
  AUTHOR="${rest%%|*}"
  rest="${rest#*|}"
  SUBJECT="${rest%%|*}"
  SHORT_SHA="${SHA:0:7}"

  # Link PR numbers — handles formats: (#123), #123
  PR_LINK=""
  if [[ "$SUBJECT" =~ \(\#([0-9]+)\) ]]; then
    PR_NUM="${BASH_REMATCH[1]}"
    PR_LINK=" ([#${PR_NUM}](https://github.com/${REPO}/pull/${PR_NUM}))"
  elif [[ "$SUBJECT" =~ \ \#([0-9]+) ]]; then
    PR_NUM=$(echo "$SUBJECT" | grep -oE '#[0-9]+' | head -1 | tr -d '#')
    if [ -n "$PR_NUM" ]; then
      PR_LINK=" ([#${PR_NUM}](https://github.com/${REPO}/pull/${PR_NUM}))"
    fi
  fi

  CHANGES+="- ${SUBJECT}${PR_LINK} by @${AUTHOR} in ${SHORT_SHA}"$'\n'
done < <(git log "${LOG_RANGE}" --pretty=format:'%H|%an|%s' --no-merges 2>/dev/null || echo "")

# ── Collect New Contributors ────────────────────────────────────────────────
PREV_AUTHORS=""
if [ -n "$PREV_TAG" ]; then
  PREV_AUTHORS=$(git log "${PREV_TAG}" --pretty=format:'%ae' --no-merges 2>/dev/null | sort -u || echo "")
fi

NEW_CONTRIBUTORS=""
SEEN=""
while IFS= read -r line; do
  [ -z "$line" ] && continue
  AUTHOR_NAME=$(echo "$line" | cut -d'|' -f2)
  AUTHOR_EMAIL=$(echo "$line" | cut -d'|' -f4)
  # Skip if email already seen in previous history
  if [ -n "$PREV_AUTHORS" ] && echo "$PREV_AUTHORS" | grep -qF "$AUTHOR_EMAIL" 2>/dev/null; then
    continue
  fi
  if echo "$SEEN" | grep -qF "@${AUTHOR_NAME}"; then
    continue
  fi
  SEEN+="@${AUTHOR_NAME} "
  NEW_CONTRIBUTORS+="- @${AUTHOR_NAME} made their first contribution"$'\n'
done < <(git log "${LOG_RANGE}" --pretty=format:'%H|%an|%s|%ae' --no-merges 2>/dev/null || echo "")

# ── Build concise output ────────────────────────────────────────────────────
OUT=""
OUT+="## What's Changed"$'\n\n'
if [ -n "$CHANGES" ]; then
  OUT+="${CHANGES}"$'\n'
else
  OUT+="_No significant changes in this range._"$'\n\n'
fi

if [ -n "$NEW_CONTRIBUTORS" ]; then
  OUT+="## New Contributors"$'\n\n'
  OUT+="${NEW_CONTRIBUTORS}"$'\n'
fi

if [ -n "$PREV_TAG" ]; then
  OUT+="**Full Changelog**: https://github.com/${REPO}/compare/${PREV_TAG}...${TAG}"$'\n'
else
  OUT+="**Full Changelog**: https://github.com/${REPO}/releases/tag/${TAG}"$'\n'
fi

echo "$OUT"
