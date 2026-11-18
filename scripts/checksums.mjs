import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const directory = resolve(process.argv[2] ?? "release");
const BUNDLE_EXTENSION = /\.(exe|dmg|deb|AppImage)$/;

/** Time O(bytes), space O(stream buffer): hash bundles without loading them whole. */
async function checksum(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

const files = (await readdir(directory)).filter((file) => BUNDLE_EXTENSION.test(file)).sort();
if (!files.length) throw new Error("No release bundles found for checksums");
const lines = [];
for (const file of files) lines.push(`${await checksum(join(directory, file))}  ${file}`);
await writeFile(join(directory, `SHA256SUMS-${process.platform}-${process.arch}.txt`), lines.join("\n") + "\n");
console.log(`Checksums written for ${files.length} bundles`);
