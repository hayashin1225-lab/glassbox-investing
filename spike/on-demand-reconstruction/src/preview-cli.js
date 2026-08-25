#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { renderPreview } from "./preview.js";

const [inputArg = "spike/on-demand-reconstruction/runs/7203/review.json", outputArg = "spike/on-demand-reconstruction/runs/7203/report.html"] = process.argv.slice(2);
const inputPath = resolve(inputArg);
const outputPath = resolve(outputArg);

let review;
try {
  review = JSON.parse(await readFile(inputPath, "utf8"));
} catch (error) {
  if (error.code === "ENOENT") {
    throw new Error(`Review input was not found: ${inputPath}. Run npm run spike:7203 first.`);
  }
  throw error;
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, renderPreview(review), "utf8");
console.log(`Glassbox Preview generated: ${outputPath}`);
