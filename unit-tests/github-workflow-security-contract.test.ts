import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function workflows() {
	const directory = new URL("../.github/workflows/", import.meta.url);
	const names = (await readdir(directory)).filter((name) => /\.ya?ml$/.test(name)).sort();
	return Promise.all(
		names.map(async (name) => ({
			name,
			source: await readFile(new URL(name, directory), "utf8"),
		})),
	);
}

test("PR workflows do not use the privileged pull_request_target trigger", async () => {
	for (const workflow of await workflows()) {
		assert.doesNotMatch(
			workflow.source,
			/^\s*pull_request_target\s*:/m,
			`${workflow.name} must not execute PR code with pull_request_target privileges`,
		);
	}
});

test("workflows never request write-all or persist checkout credentials explicitly", async () => {
	for (const workflow of await workflows()) {
		assert.doesNotMatch(
			workflow.source,
			/permissions:\s*write-all/,
			`${workflow.name} must use least-privilege named permissions`,
		);
		assert.doesNotMatch(
			workflow.source,
			/persist-credentials:\s*true/,
			`${workflow.name} must not persist checkout credentials`,
		);
	}
});

test("shell steps do not directly interpolate untrusted PR text", async () => {
	const dangerousExpression = /\$\{\{\s*github\.event\.pull_request\.(?:title|body|head\.ref)\s*\}\}/;

	for (const workflow of await workflows()) {
		const lines = workflow.source.split("\n");
		let inRunBlock = false;
		let runIndent = -1;

		for (const line of lines) {
			const indent = line.match(/^\s*/)?.[0].length ?? 0;
			if (/^\s*run:\s*(?:\||>)?\s*$/.test(line)) {
				inRunBlock = true;
				runIndent = indent;
				continue;
			}
			if (inRunBlock && line.trim() !== "" && indent <= runIndent) {
				inRunBlock = false;
			}
			if (inRunBlock) {
				assert.doesNotMatch(
					line,
					dangerousExpression,
					`${workflow.name} must pass untrusted PR text through env instead of direct shell interpolation`,
				);
			}
		}
	}
});
