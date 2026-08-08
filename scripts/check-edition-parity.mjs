#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EDITION_CORE_FILES } from "./edition-core-files.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const sourceRoot = path.join(repoRoot, "prototype");
const cnSiteRoot = process.env.ANA_TILIM_CN_SITE
  ? path.resolve(process.env.ANA_TILIM_CN_SITE)
  : path.resolve(repoRoot, "..", "Uyghur Tili", "site");
const mismatches = [];

for (const relativePath of EDITION_CORE_FILES) {
  const sourcePath = path.join(sourceRoot, relativePath);
  const targetPath = path.join(cnSiteRoot, relativePath);
  const matches = fs.existsSync(sourcePath)
    && fs.existsSync(targetPath)
    && fs.readFileSync(sourcePath).equals(fs.readFileSync(targetPath));

  if (!matches) {
    mismatches.push({ relativePath, sourcePath, targetPath });
  }
}

if (mismatches.length > 0) {
  console.error("Edition core parity failed:");
  for (const { relativePath, sourcePath, targetPath } of mismatches) {
    console.error(`- ${relativePath}`);
    console.error(`  source: ${sourcePath}`);
    console.error(`  target: ${targetPath}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Edition core parity passed (${EDITION_CORE_FILES.length} files).`);
}
