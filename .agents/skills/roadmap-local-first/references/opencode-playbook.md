# OpenCode playbook — Bababou local-first

Use this reference only when the task needs orchestration. `AGENTS.md` remains canonical.

## Capability routing

| Need | Preferred repository capability |
| --- | --- |
| Plan current work | `docs/roadmap.md` + OpenCode todo tool |
| Determine validation cost before edit | `bash scripts/agent-quality-gate.sh --preflight` |
| Dependency-free P0 regression | `node --experimental-strip-types --test unit-tests/ciScopeBehavior.test.ts unit-tests/agentPreflightBehavior.test.ts unit-tests/opencodeAgentContract.test.ts` |
| Canonical scope | `bash scripts/ci-scope.sh <base> WORKTREE` before commit; `<base> HEAD` after commit |
| Converge deterministic mutations | `bash scripts/agent-quality-gate.sh --fix` |
| Exact pre-publication proof | `bash scripts/agent-publish.sh` |
| Quality/CI failure accounting | skill `quality-follow-up` |
| Family/legal/privacy/publication | skill `protect-family-privacy` |
| Legacy HTML → Next migration | skill `next-migrate-locale-pages` |
| Next runtime verification | skill `next-dev-loop` + Next DevTools MCP |
| Browser/UI verification | skill `agent-browser` |
| Cache Components | matching `next-cache-components-*` skill |
| Independent pre-publish review | subagent `bababou-reviewer` / command `/review-local` |
| GitHub PR/check inspection | authenticated `gh` or available GitHub integration; inspect run → job → step → focused logs |
| Vercel/Preview diagnostics | available Vercel integration; preserve exact-SHA validation |
| Documentation/PDF extraction | `liteparse` only when the task actually contains such documents |
| Stripe-specific work | Stripe skills only when the task explicitly touches retained Stripe/payment behavior |

## Small-model discipline

A smaller model should not infer hidden steps. Use this fixed loop:

```text
status/diff
→ preflight
→ one roadmap item
→ smallest matching skill(s)
→ minimal patch
→ closest test
→ --fix
→ diff review
→ reviewer
→ commit
→ agent-publish.sh
→ PR/roadmap evidence
```

Do not perform the next expensive step merely because it exists. The canonical scope decides whether build, SAST, dependencies or Preview are required.

For an agent/quality-only batch, run the dependency-free P0 regression suite after the targeted check and before declaring local validation complete. It needs no `node_modules` and is therefore the preferred broad regression check while GitHub-hosted runners are unavailable.

## Evidence levels

Keep these distinct in reports:

- **executed** — command/tool actually ran on the current revision;
- **static contract** — source/test inspection indicates intended behavior but runtime was not executed;
- **blocked/unavailable** — runner, credentials, provider or environment prevented execution;
- **not required** — canonical scope explicitly excludes the check.

Never promote static inspection to an executed pass.

## GitHub Actions with no credits/runners

When a GitHub job has no allocated runner, `steps=null`, or no step logs:

1. classify it as infrastructure/quota evidence;
2. do not manually rerun while the user has said credits are unavailable;
3. run the local equivalent when one exists;
4. preserve any genuinely runner-only validation as unfinished evidence;
5. do not weaken workflow rules or add CI-skip directives.

## Protected project boundaries

Before editing related surfaces, load the appropriate skill and preserve these invariants:

- `public/404.html` remains the protected visual 404 source unless the user explicitly approves architecture change;
- legacy HTML is not deleted or permanently redirected before proven parity;
- Google Translate remains fallback where native i18n is incomplete;
- homepage/index publication disclosures are owner-controlled;
- legal documents are not auto-translated to manufacture missing homologues.

## Review handoff

Use `/review-local` after deterministic fixes converge and before the final publication proof. The reviewer is intentionally read-only and should return:

1. concrete defects/risks by severity;
2. missing tests or evidence;
3. scope/roadmap/PR-description inconsistencies;
4. no findings statement when appropriate.

The primary agent owns fixes. The reviewer does not.

## Workstation OpenCode smoke

After pulling agent/config changes, validate the actual workstation binary before treating OpenCode integration as proven:

```bash
opencode --version
opencode agent list
```

The agent list must include both `bababou` and `bababou-reviewer`. This verifies that OpenCode can parse the project configuration and discover the repository-local agents without spending a model call.

If either agent is missing, stop and inspect the installed OpenCode version/config schema before using `/roadmap-local`, `/quality-local` or `/review-local`. Do not change the repository model setting to work around discovery: the repository intentionally inherits the workstation-selected model.
