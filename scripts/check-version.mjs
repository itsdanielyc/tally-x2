import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile("package.json", "utf8"));
const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
const version = manifest.version;
if (typeof version !== "string" || !/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(version)) throw new Error("Package version must use semantic versioning");
if (lock.version !== version || lock.packages?.[""]?.version !== version) throw new Error("Version drift between package.json and package-lock.json");
if (process.env.GITHUB_REF_TYPE === "tag" && process.env.GITHUB_REF_NAME !== `v${version}`) throw new Error("Tag does not match package version");
console.log(`Version consistent: ${version}`);
