import { expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

it("snapshot artifacts keep their own OS pixels and shared structure only", async () => {
  const directory = join(process.cwd(), "artifacts", "snapshot-filter-test");
  await mkdir(directory, { recursive: true });
  for (const name of ["home-chromium-win32.png", "home-chromium-linux.png", "home-chromium-darwin.png", "home.aria.yml"]) await writeFile(join(directory, name), "fixture");
  await promisify(execFile)(process.execPath, ["scripts/filter-snapshots.mjs", directory, "linux"]);
  expect((await readdir(directory)).sort()).toEqual(["home-chromium-linux.png", "home.aria.yml"]);
});
