import { execFileSync } from "node:child_process";

const readCommand = (command, args) => execFileSync(command, args, { encoding: "utf8" }).trim();
const repository = process.env.GITHUB_REPOSITORY ?? readCommand("gh", ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]);
const commit = process.argv[2] ?? process.env.GITHUB_SHA ?? readCommand("git", ["rev-parse", "HEAD"]);
if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error("Release gate requires a full commit SHA");
for (const workflow of ["ci.yml", "installers.yml"]) {
  const runs = JSON.parse(readCommand("gh", ["run", "list", "--repo", repository, "--workflow", workflow, "--commit", commit, "--status", "success", "--limit", "1", "--json", "databaseId"]));
  if (!runs.length) throw new Error(`No green ${workflow} run exists for ${commit}`);
  console.log(`${workflow}: green run ${runs[0].databaseId} for ${commit}`);
}
