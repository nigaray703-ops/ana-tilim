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
const latinWritingScriptPattern = /<script\b[^>]*\bsrc=["']\.\/course-data\/latin-writing-data\.js(?:\?[^"']*)?["'][^>]*><\/script>/g;
const appScriptPattern = /^([ \t]*)(<script\b[^>]*\bsrc=["']\.\/app\.js(?:\?[^"']*)?["'][^>]*><\/script>)/m;
const appScriptMatch = appScriptPattern.exec(indexSource);

if (!appScriptMatch) {
  throw new Error(`Cannot update ${indexPath}: app.js script tag not found.`);
}

const alphabetDataScriptPattern = /^([ \t]*)(<script\b[^>]*\bsrc=["']\.\/course-data\/alphabet-data\.js(?:\?[^"']*)?["'][^>]*><\/script>)/m;
const courseDataScriptPattern = /^[ \t]*<script\b[^>]*\bsrc=["']\.\/course-data\.js(?:\?[^"']*)?["'][^>]*><\/script>/m;
const indexWithoutLatinWritingScripts = indexSource.replace(latinWritingScriptPattern, "");
const alphabetDataScriptMatch = alphabetDataScriptPattern.exec(indexWithoutLatinWritingScripts);
const courseDataScriptMatch = courseDataScriptPattern.exec(indexWithoutLatinWritingScripts);

if (!alphabetDataScriptMatch || !courseDataScriptMatch) {
  throw new Error(`Cannot update ${indexPath}: alphabet-data.js and course-data.js script tags are required.`);
}
if (alphabetDataScriptMatch.index > courseDataScriptMatch.index) {
  throw new Error(`Cannot update ${indexPath}: alphabet-data.js must load before course-data.js.`);
}

const standardLatinWritingScript = '<script src="./course-data/latin-writing-data.js?v=20260809-latin-writing"></script>';
const latinWritingInsertionIndex = alphabetDataScriptMatch.index + alphabetDataScriptMatch[0].length;
let normalizedIndex = `${indexWithoutLatinWritingScripts.slice(0, latinWritingInsertionIndex)}\n${alphabetDataScriptMatch[1]}${standardLatinWritingScript}${indexWithoutLatinWritingScripts.slice(latinWritingInsertionIndex)}`;
const indexUpdateMessages = ["Normalized index.html: latin-writing-data.js after alphabet-data.js"];

const standardUnitOrderScript = '<script src="./unit-order.js?v=20260809-edition-unit-order"></script>';
const unitOrderScripts = normalizedIndex.match(unitOrderScriptPattern) || [];
const normalizedAppScriptMatch = appScriptPattern.exec(normalizedIndex);

if (unitOrderScripts.length === 0) {
  const insertion = `${normalizedAppScriptMatch[1]}${standardUnitOrderScript}\n`;
  normalizedIndex = `${normalizedIndex.slice(0, normalizedAppScriptMatch.index)}${insertion}${normalizedIndex.slice(normalizedAppScriptMatch.index)}`;
  indexUpdateMessages.push("Updated index.html: added unit-order.js before app.js");
} else if (unitOrderScripts.length === 1 && normalizedIndex.indexOf(unitOrderScripts[0]) > normalizedAppScriptMatch.index) {
  const indexWithoutMisplacedScript = normalizedIndex.replace(unitOrderScripts[0], "");
  const appMatchAfterRemoval = appScriptPattern.exec(indexWithoutMisplacedScript);
  const insertion = `${appMatchAfterRemoval[1]}${standardUnitOrderScript}\n`;
  normalizedIndex = `${indexWithoutMisplacedScript.slice(0, appMatchAfterRemoval.index)}${insertion}${indexWithoutMisplacedScript.slice(appMatchAfterRemoval.index)}`;
  indexUpdateMessages.push("Updated index.html: moved unit-order.js before app.js");
} else if (unitOrderScripts.length > 1) {
  const indexWithoutDuplicateScripts = normalizedIndex.replace(unitOrderScriptPattern, "");
  const appMatchAfterRemoval = appScriptPattern.exec(indexWithoutDuplicateScripts);
  const normalizedInsertion = `${appMatchAfterRemoval[1]}${standardUnitOrderScript}\n`;
  normalizedIndex = `${indexWithoutDuplicateScripts.slice(0, appMatchAfterRemoval.index)}${normalizedInsertion}${indexWithoutDuplicateScripts.slice(appMatchAfterRemoval.index)}`;
  indexUpdateMessages.push("Updated index.html: normalized unit-order.js before app.js");
} else {
  indexUpdateMessages.push("Index already loads unit-order.js");
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
console.log(indexUpdateMessages.join("\n"));
