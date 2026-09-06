#!/usr/bin/env bash
set -euo pipefail

# Vercel's Ignored Build Step uses an inverted exit convention:
#   0 => skip the deployment
#   1 => continue building
#
# Bababou remains a hybrid Next.js/static migration. public/** is production
# runtime content until each legacy page is explicitly retired, so it is never
# classified as maintenance-only.
#
# Compare against the last successful Vercel deployment when available. This is
# important for on-demand checkpoint branches: a PR may contain several commits,
# and HEAD^ alone can miss an earlier deploy-relevant change.

git_ref="${VERCEL_GIT_COMMIT_REF:-}"

# Explicit Preview checkpoint refs are CI-validated publication targets.
# Always build the checkpoint so Vercel and Playwright validate the exact PR SHA,
# even when the changed files themselves would normally be maintenance-only.
if [[ "$git_ref" == vercel-preview-* ]]; then
  echo "Validated checkpoint $git_ref; build exact deployment."
  exit 1
fi

commit_subject="$(git log -1 --pretty=%s)"
if [[ "$commit_subject" =~ ^chore\(release\):\ [0-9]+\.[0-9]+\.[0-9]+\ \[skip\ ci\]$ ]]; then
  echo "Semantic-release metadata commit detected; skip duplicate deployment."
  exit 0
fi

base_sha="${VERCEL_GIT_PREVIOUS_SHA:-}"

if [[ -z "$base_sha" ]] || ! git cat-file -e "$base_sha^{commit}" 2>/dev/null; then
  if git rev-parse HEAD^ >/dev/null 2>&1; then
    base_sha="$(git rev-parse HEAD^)"
    echo "VERCEL_GIT_PREVIOUS_SHA unavailable; falling back to parent commit $base_sha."
  else
    echo "No comparison base available; build deployment."
    exit 1
  fi
fi

changed_files="$(git diff --name-only "$base_sha" HEAD)"

if [[ -z "$changed_files" ]]; then
  echo "No changed files detected since $base_sha; skip deployment."
  exit 0
fi

echo "Changed files since $base_sha:"
printf '%s\n' "$changed_files"

while IFS= read -r file; do
  case "$file" in
    docs/*|unit-tests/*|*.md|.github/*|.github/**/*|.vscode/*|.idea/*|.agents/*|.agents/**/*|.cursor/*|.cursor/**/*|.claude/*|.claude/**/*)
      ;;
    *)
      echo "Deploy-relevant change detected: $file"
      exit 1
      ;;
  esac
done <<< "$changed_files"

echo "Only documentation, tests, editor metadata, agent instructions, or GitHub maintenance changed; skip Vercel deployment."
exit 0
