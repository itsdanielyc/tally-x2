import { readdir, realpath, unlink } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

const PLATFORM_NAMES = new Set(["linux", "win32", "darwin"]);
const workspace = await realpath(process.cwd());
const root = await realpath(resolve(process.argv[2] ?? "tests/ui/__snapshots__"));
const platform = process.argv[3] ?? process.platform;
if (!root.startsWith(workspace + sep)) throw new Error("Snapshot filtering must stay inside the workspace");
if (!PLATFORM_NAMES.has(platform)) throw new Error("Unknown snapshot platform");

/** Time O(files), space O(directory depth): never follow links outside the root. */
async function filter(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error("Snapshot directories must not contain symlinks");
    if (entry.isDirectory()) await filter(path);
    else if (entry.name.endsWith(".png") && !entry.name.endsWith(`-${platform}.png`)) await unlink(path);
  }
}

await filter(root);
console.log(`Snapshot artifact contains only ${platform} pixels and shared structure`);
