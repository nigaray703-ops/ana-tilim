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

const indexPath = path.join(cnSiteRoot, "index.html");
const indexSource = fs.readFileSync(indexPath, "utf8");
const unitOrderScriptPattern = /<script\b[^>]*\bsrc=["']\.\/unit-order\.js(?:\?[^"']*)?["'][^>]*><\/script>/g;
const unitOrderScripts = indexSource.match(unitOrderScriptPattern) || [];
const appScriptPattern = /^([ \t]*)(<script\b[^>]*\bsrc=["']\.\/app\.js(?:\?[^"']*)?["'][^>]*><\/script>)/m;
const appScriptMatch = appScriptPattern.exec(indexSource);

if (!appScriptMatch) {
  throw new Error(`Cannot update ${indexPath}: app.js script tag not found.`);
}

const standardUnitOrderScript = '<script src="./unit-order.js?v=20260809-edition-unit-order"></script>';
let normalizedIndex = indexSource;
let indexUpdateMessage = "Index already loads unit-order.js";

if (unitOrderScripts.length === 0) {
  const insertion = `${appScriptMatch[1]}${standardUnitOrderScript}\n`;
  const updatedIndex = `${indexSource.slice(0, appScriptMatch.index)}${insertion}${indexSource.slice(appScriptMatch.index)}`;
  normalizedIndex = updatedIndex;
  indexUpdateMessage = "Updated index.html: added unit-order.js before app.js";
} else if (unitOrderScripts.length === 1 && indexSource.indexOf(unitOrderScripts[0]) > appScriptMatch.index) {
  const indexWithoutMisplacedScript = indexSource.replace(unitOrderScripts[0], "");
  const normalizedAppScriptMatch = appScriptPattern.exec(indexWithoutMisplacedScript);
  const insertion = `${normalizedAppScriptMatch[1]}${standardUnitOrderScript}\n`;
  normalizedIndex = `${indexWithoutMisplacedScript.slice(0, normalizedAppScriptMatch.index)}${insertion}${indexWithoutMisplacedScript.slice(normalizedAppScriptMatch.index)}`;
  indexUpdateMessage = "Updated index.html: moved unit-order.js before app.js";
} else if (unitOrderScripts.length > 1) {
  const indexWithoutDuplicateScripts = indexSource.replace(unitOrderScriptPattern, "");
  const normalizedAppScriptMatch = appScriptPattern.exec(indexWithoutDuplicateScripts);
  const normalizedInsertion = `${normalizedAppScriptMatch[1]}${standardUnitOrderScript}\n`;
  normalizedIndex = `${indexWithoutDuplicateScripts.slice(0, normalizedAppScriptMatch.index)}${normalizedInsertion}${indexWithoutDuplicateScripts.slice(normalizedAppScriptMatch.index)}`;
  indexUpdateMessage = "Updated index.html: normalized unit-order.js before app.js";
}

function preflightTargetPath(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.readFileSync(targetPath);
    fs.accessSync(targetPath, fs.constants.W_OK);
  }

  let existingParent = path.dirname(targetPath);
  while (!fs.existsSync(existingParent)) {
    const nextParent = path.dirname(existingParent);
    if (nextParent === existingParent) {
      throw new Error(`Cannot resolve a writable parent for ${targetPath}`);
    }
    existingParent = nextParent;
  }
  if (!fs.statSync(existingParent).isDirectory()) {
    throw new Error(`Cannot write ${targetPath}: ${existingParent} is not a directory.`);
  }
  fs.accessSync(existingParent, fs.constants.W_OK);
}

const copyJobs = EDITION_CORE_FILES.map((relativePath) => {
  const sourcePath = path.join(sourceRoot, relativePath);
  const targetPath = path.join(cnSiteRoot, relativePath);
  fs.readFileSync(sourcePath);
  preflightTargetPath(targetPath);
  return { relativePath, sourcePath, targetPath };
});

if (normalizedIndex !== indexSource) {
  fs.accessSync(indexPath, fs.constants.W_OK);
}

for (const { relativePath, sourcePath, targetPath } of copyJobs) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Copied ${relativePath}`);
}

if (normalizedIndex !== indexSource) {
  fs.writeFileSync(indexPath, normalizedIndex);
}
console.log(indexUpdateMessage);
