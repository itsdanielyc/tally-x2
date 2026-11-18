import { expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { removeTemporaryDirectory, temporaryDirectory } from "./helpers";

const execute = promisify(execFile);

it("release version gate rejects lock drift and mismatched tags", async () => {
  const directory = await temporaryDirectory();
  const script = resolve("scripts/check-version.mjs");
  const environment = { ...process.env, GITHUB_REF_TYPE: "branch", GITHUB_REF_NAME: "test" };
  try {
    await writeFile(join(directory, "package.json"), JSON.stringify({ version: "0.1.0" }));
    await writeFile(join(directory, "package-lock.json"), JSON.stringify({ version: "0.2.0", packages: { "": { version: "0.1.0" } } }));
    await expect(execute(process.execPath, [script], { cwd: directory, env: environment })).rejects.toThrow();
    await writeFile(join(directory, "package-lock.json"), JSON.stringify({ version: "0.1.0", packages: { "": { version: "0.1.0" } } }));
    expect((await execute(process.execPath, [script], { cwd: directory, env: environment })).stdout).toContain("Version consistent: 0.1.0");
    await expect(execute(process.execPath, [script], { cwd: directory, env: { ...environment, GITHUB_REF_TYPE: "tag", GITHUB_REF_NAME: "v0.2.0" } })).rejects.toThrow();
  } finally { await removeTemporaryDirectory(directory); }
});

it("release checksums match the known SHA256 vector and exclude builder metadata", async () => {
  const directory = await temporaryDirectory();
  try {
    await writeFile(join(directory, "tally-0.1.0-x64.exe"), "abc");
    await writeFile(join(directory, "builder-debug.yml"), "not an asset");
    await execute(process.execPath, ["scripts/checksums.mjs", directory]);
    const content = await readFile(join(directory, `SHA256SUMS-${process.platform}-${process.arch}.txt`), "utf8");
    expect(content).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad  tally-0.1.0-x64.exe\n");
  } finally { await removeTemporaryDirectory(directory); }
});
