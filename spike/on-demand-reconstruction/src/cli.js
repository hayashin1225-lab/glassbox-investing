#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { resolveIdentity } from "./identity.js";
import { buildSearchPlan } from "./search-plan.js";
import { retrieveLive } from "./retrieval.js";
import { runEngine } from "./engine.js";
import { renderReport } from "./report.js";
import { canonicalJson } from "./util.js";

const args = process.argv.slice(2);
const replayIndex = args.indexOf("--replay");
const outIndex = args.indexOf("--out");
const noGdelt = args.includes("--no-gdelt");
const symbol = args.find((arg) => !arg.startsWith("--") && arg !== args[replayIndex + 1] && arg !== args[outIndex + 1]) ?? "7203";
const outDir = resolve(outIndex >= 0 ? args[outIndex + 1] : `spike/on-demand-reconstruction/runs/${symbol}`);

let input;
if (replayIndex >= 0) {
  input = JSON.parse(await readFile(resolve(args[replayIndex + 1]), "utf8"));
} else {
  const identity = await resolveIdentity(symbol);
  input = await retrieveLive(identity, buildSearchPlan(identity), { includeGdelt: !noGdelt });
}

const review = runEngine(input);
await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, "retrieved-input.json"), canonicalJson(input), "utf8");
await writeFile(resolve(outDir, "review.json"), canonicalJson(review), "utf8");
await writeFile(resolve(outDir, "report.md"), renderReport(review), "utf8");
console.log(renderReport(review));
console.log(`\nSaved: ${outDir}`);
