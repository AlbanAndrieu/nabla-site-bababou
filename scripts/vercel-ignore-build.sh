#!/usr/bin/env bash
set -euo pipefail

# Vercel's Ignored Build Step uses an inverted exit convention:
#   0 => skip the deployment
#   1 => continue building
#
# This repository is still in a hybrid Next.js/static migration. Keep the
# decision deliberately fail-open: unknown changes build a Preview, while only
# documentation, repository-maintenance and semantic-release metadata commits
# are skipped.
#
# IMPORTANT: public/** is still production runtime content until each legacy
# page has a native Next.js replacement, so changes below public/ must always
# trigger a deployment.

commit_subject="$(git log -1 --pretty=%s)"
if [[ "$commit_subject" =~ ^chore\(release\):\ [0-9]+\.[0-9]+\.[0-9]+\ \[skip\ ci\]$ ]]; then
  echo "Semantic-release metadata commit detected; skip duplicate deployment."
  exit 0
fi

if ! git rev-parse HEAD^ >/dev/null 2>&1; then
  echo "No parent commit available; build deployment."
  exit 1
fi

changed_files="$(git diff --name-only HEAD^ HEAD)"

if [[ -z "$changed_files" ]]; then
  echo "No changed files detected; skip deployment."
  exit 0
fi

echo "Changed files:"
printf '%s\n' "$changed_files"

while IFS= read -r file; do
  case "$file" in
    public/*)
      echo "Legacy/static runtime changed: $file"
      exit 1
      ;;
    .github/workflows/playwright.yml)
      echo "Playwright workflow changed; build Preview for end-to-end validation."
      exit 1
      ;;
    docs/*|*.md|.github/ISSUE_TEMPLATE/*|.github/PULL_REQUEST_TEMPLATE.md|.agents/*|.cursor/*|.claude/*)
      ;;
    .github/workflows/*)
      ;;
    *)
      echo "Deploy-relevant change detected: $file"
      exit 1
      ;;
  esac
done <<< "$changed_files"

echo "Only documentation/repository maintenance changed; skip Vercel deployment."
exit 0
