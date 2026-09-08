import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

import githubActionsFormatter from "../scripts/eslint-github-formatter.mjs";

test("ESLint uses GitHub Actions annotations while keeping the GitLab fallback", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  assert.equal(
    packageJson.scripts?.lint,
    "eslint --format ./scripts/eslint-github-formatter.mjs .",
  );
  assert.equal(packageJson.devDependencies?.["eslint-formatter-gitlab"], "^7.2.0");
  await access(new URL("../.gitlab-ci.yml", import.meta.url));
});

test("GitLab fallback remains available but is not the primary npm lint path", async () => {
  const gitlabCi = await readFile(
    new URL("../.gitlab-ci.yml", import.meta.url),
    "utf8",
  );

  assert.match(gitlabCi, /npx eslint --format gitlab \./);
});

test("GitHub Actions formatter emits annotations and escapes workflow commands", () => {
  const previous = process.env.GITHUB_ACTIONS;
  const previousWorkspace = process.env.GITHUB_WORKSPACE;
  process.env.GITHUB_ACTIONS = "true";
  process.env.GITHUB_WORKSPACE = "/workspace";

  try {
    const output = githubActionsFormatter([
      {
        filePath: "/workspace/app/example.ts",
        messages: [
          {
            ruleId: "no-console",
            severity: 2,
            message: "bad, value: 100%\nnext",
            line: 4,
            column: 2,
            endLine: 4,
            endColumn: 9,
          },
        ],
        errorCount: 1,
        warningCount: 0,
        fatalErrorCount: 0,
        fixableErrorCount: 0,
        fixableWarningCount: 0,
        suppressedMessages: [],
      },
    ] as never);

    assert.equal(
      output,
      "::error file=app/example.ts,line=4,col=2,endLine=4,endColumn=9,title=ESLint no-console::bad, value: 100%25%0Anext\n",
    );
  } finally {
    if (previous === undefined) delete process.env.GITHUB_ACTIONS;
    else process.env.GITHUB_ACTIONS = previous;
    if (previousWorkspace === undefined) delete process.env.GITHUB_WORKSPACE;
    else process.env.GITHUB_WORKSPACE = previousWorkspace;
  }
});


test("Quality and Copilot GitHub Actions are pinned to immutable SHAs", async () => {
  for (const workflowPath of [
    "../.github/workflows/ci.yml",
    "../.github/workflows/copilot-setup-steps.yml",
  ]) {
    const workflow = await readFile(new URL(workflowPath, import.meta.url), "utf8");
    const refs = workflow
      .split("\n")
      .map((line) => line.match(/uses:\s+([^@\s]+)@([^\s#]+)/))
      .filter((match): match is RegExpMatchArray => match !== null);

    assert.ok(refs.length > 0);
    for (const ref of refs) {
      assert.match(
        ref[2],
        /^[0-9a-f]{40}$/,
        `${ref[1]} in ${workflowPath} must use an immutable commit SHA`,
      );
    }
  }
});
