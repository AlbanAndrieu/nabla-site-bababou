#!/usr/bin/env bash
set -euo pipefail

# Vercel's Ignored Build Step has inverted exit codes:
#   0 = skip deployment, 1 = build.
# public/** is a production asset tree in the hybrid Next/static site, including
# markdown files. A generic *.md maintenance exemption is therefore unsafe.

git_ref="${VERCEL_GIT_COMMIT_REF:-}"
if [[ "$git_ref" == vercel-preview-* ]]; then
  echo "Validated checkpoint $git_ref; build exact deployment."
  exit 1
fi

base_sha="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [[ -z "$base_sha" ]] || ! git cat-file -e "$base_sha^{commit}" 2>/dev/null; then
  echo "No verified previous deployment SHA; build rather than risk skipping changes."
  exit 1
fi
if ! git merge-base --is-ancestor "$base_sha" HEAD 2>/dev/null; then
  echo "Previous deployment SHA is not an ancestor of HEAD; build rather than guess scope."
  exit 1
fi

# Disable rename detection: a rename FROM public/ INTO docs/ also deletes
# a served asset and must build even when the destination is maintenance.
# A NUL-delimited diff is required: Git may quote filenames containing spaces,
# tabs or newlines in line-delimited output. Never infer scope from such quotes.
changes="$(mktemp)"
trap 'rm -f "$changes"' EXIT
if ! git -c core.quotePath=false diff --no-renames --no-ext-diff --name-only -z "$base_sha" HEAD >"$changes"; then
  echo "Cannot compare deployment refs; build rather than risk skipping changes."
  exit 1
fi
if [[ ! -s "$changes" ]]; then
  echo "No changed files detected since $base_sha; skip deployment."
  exit 0
fi

echo "Changed files since $base_sha:"
while IFS= read -r -d '' file; do
  # Render the filename safely in logs, including newline/control characters.
  printf '  %q\n' "$file"
  case "$file" in
    .assetsignore|docs/*|unit-tests/*|.github/*|.vscode/*|.idea/*|.agents/*|.cursor/*|.claude/*)
      ;;
    *.md)
      # Only root-level Markdown is unquestionably repository documentation.
      # public/**/*.md, app/**/*.md and any other nested Markdown must build.
      if [[ "$file" != */* ]]; then
        continue
      fi
      echo "Deploy-relevant change detected: $file"
      exit 1
      ;;
    *)
      echo "Deploy-relevant change detected: $file"
      exit 1
      ;;
  esac
done <"$changes"

echo "Only root documentation, tests, editor metadata, agent instructions, retired asset metadata, or GitHub maintenance changed; skip Vercel deployment."
exit 0
