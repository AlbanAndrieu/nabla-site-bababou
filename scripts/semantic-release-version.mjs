import { readFile, writeFile } from "node:fs/promises";

async function writeVersion(path, version) {
  const content = await readFile(path, "utf8");
  const json = JSON.parse(content);

  json.version = version;

  if (path === "package-lock.json" && json.packages?.[""]) {
    json.packages[""].version = version;
  }

  await writeFile(path, `${JSON.stringify(json, null, 2)}\n`);
}

export async function prepare(_pluginConfig, context) {
  const version = context.nextRelease.version;

  await Promise.all([
    writeVersion("package.json", version),
    writeVersion("package-lock.json", version),
  ]);

  context.logger.log(`Synchronized package metadata to ${version}`);
}
