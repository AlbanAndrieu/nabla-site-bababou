#!/usr/bin/env bash
# Read-only triage: separate failures before runner assignment from code failures.
set -euo pipefail

repo="${1:-}"
run_id="${2:-}"
expected_sha="${3:-}"

if [[ ! "$repo" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ || ! "$run_id" =~ ^[1-9][0-9]*$ ]]; then
    echo 'Usage: diagnose-actions-startup.sh OWNER/REPO RUN_ID [EXPECTED_40_CHAR_SHA]' >&2
    exit 4
fi
if [[ -n "$expected_sha" && ! "$expected_sha" =~ ^[a-f0-9]{40}$ ]]; then
    echo 'ACTIONS_DIAG_INVALID_SHA: expected a lowercase full Git SHA' >&2
    exit 4
fi
for command in gh jq; do
    if ! command -v "$command" >/dev/null 2>&1; then
        printf 'ACTIONS_DIAG_MISSING_TOOL: %s\n' "$command" >&2
        exit 4
    fi
done

# Only two GETs. Never rerun jobs or mutate repository/billing settings.
if ! run_json="$(gh api --method GET "repos/$repo/actions/runs/$run_id")"; then
    echo 'ACTIONS_DIAG_API_ERROR: cannot read run metadata' >&2
    exit 4
fi
if ! jobs_json="$(gh api --method GET "repos/$repo/actions/runs/$run_id/jobs?per_page=100")"; then
    echo 'ACTIONS_DIAG_API_ERROR: cannot read run jobs' >&2
    exit 4
fi
if ! jq -e '.id and .status and .head_sha' <<< "$run_json" >/dev/null || \
    ! jq -e '(.total_count | type == "number") and (.jobs | type == "array")' <<< "$jobs_json" >/dev/null; then
    echo 'ACTIONS_DIAG_INVALID_API: missing run or jobs fields' >&2
    exit 4
fi

run_sha="$(jq -r '.head_sha' <<< "$run_json")"
if [[ -n "$expected_sha" && "$run_sha" != "$expected_sha" ]]; then
    printf 'ACTIONS_DIAG_SHA_MISMATCH: requested=%s actual=%s\n' "$expected_sha" "$run_sha" >&2
    exit 4
fi
job_count="$(jq -r '.total_count' <<< "$jobs_json")"
returned_count="$(jq -r '.jobs | length' <<< "$jobs_json")"
if ((job_count > returned_count)); then
    echo 'ACTIONS_DIAG_INCOMPLETE: paginated job list needs further inspection' >&2
    exit 4
fi
status="$(jq -r '.status' <<< "$run_json")"
conclusion="$(jq -r '.conclusion // "none"' <<< "$run_json")"
printf 'ACTIONS_RUN repo=%s run=%s sha=%s status=%s conclusion=%s jobs=%s\n' \
    "$repo" "$run_id" "$run_sha" "$status" "$conclusion" "$job_count"

if [[ "$status" != completed ]]; then
    echo 'ACTIONS_DIAG_PENDING: queued/running jobs are not failed tests'
    exit 3
fi
if jq -e '[.jobs[] | select(.conclusion == "failure" and ((.steps // []) | length) == 0)] | length > 0' \
    <<< "$jobs_json" >/dev/null; then
    jq -r '.jobs[] | select(.conclusion == "failure" and ((.steps // []) | length) == 0) |
        "ACTIONS_PRE_RUN_FAILURE job_id=\(.id) name=\(.name) runner_id=\(.runner_id // 0) steps=0"' \
        <<< "$jobs_json"
    echo 'ACTIONS_DIAG_EXTERNAL: job failed before executable steps; no code-test verdict.'
    echo 'Check Settings > Billing & licensing > Budgets and usage > Actions, repository Actions permissions, and runner provisioning.'
    echo 'Do not disable quality gates or spend credits on repeated failed reruns.'
    exit 2
fi
if [[ "$conclusion" == success ]]; then
    echo 'ACTIONS_DIAG_SUCCESS: workflow completed successfully'
    exit 0
fi
if jq -e '[.jobs[] | select(.conclusion == "failure" and ((.steps // []) | length) > 0)] | length > 0' \
    <<< "$jobs_json" >/dev/null; then
    jq -r '.jobs[] | select(.conclusion == "failure" and ((.steps // []) | length) > 0) |
        "ACTIONS_STEP_FAILURE job_id=\(.id) name=\(.name) steps=\(.steps | length)"' <<< "$jobs_json"
    echo 'ACTIONS_DIAG_TEST_FAILURE: investigate the first failed step and logs'
    exit 1
fi
printf 'ACTIONS_DIAG_OTHER: conclusion=%s needs investigation\n' "$conclusion"
exit 4
