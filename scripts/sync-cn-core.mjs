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

for (const relativePath of EDITION_CORE_FILES) {
  const sourcePath = path.join(sourceRoot, relativePath);
  const targetPath = path.join(cnSiteRoot, relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Copied ${relativePath}`);
}

const indexPath = path.join(cnSiteRoot, "index.html");
const indexSource = fs.readFileSync(indexPath, "utf8");
const unitOrderScriptPattern = /<script\b[^>]*\bsrc=["']\.\/unit-order\.js(?:\?[^"']*)?["'][^>]*><\/script>/g;
const unitOrderScripts = indexSource.match(unitOrderScriptPattern) || [];
const appScriptMatch = /^([ \t]*)(<script\b[^>]*\bsrc=["']\.\/app\.js(?:\?[^"']*)?["'][^>]*><\/script>)/m.exec(
  indexSource
);

if (!appScriptMatch) {
  throw new Error(`Cannot update ${indexPath}: app.js script tag not found.`);
}

const standardUnitOrderScript = '<script src="./unit-order.js?v=20260809-edition-unit-order"></script>';
const insertion = `${appScriptMatch[1]}${standardUnitOrderScript}\n`;

if (unitOrderScripts.length === 0) {
  const updatedIndex = `${indexSource.slice(0, appScriptMatch.index)}${insertion}${indexSource.slice(appScriptMatch.index)}`;
  fs.writeFileSync(indexPath, updatedIndex);
  console.log("Updated index.html: added unit-order.js before app.js");
} else if (unitOrderScripts.length === 1 && indexSource.indexOf(unitOrderScripts[0]) > appScriptMatch.index) {
  const indexWithoutMisplacedScript = indexSource.replace(unitOrderScripts[0], "");
  const updatedIndex = `${indexWithoutMisplacedScript.slice(0, appScriptMatch.index)}${insertion}${indexWithoutMisplacedScript.slice(appScriptMatch.index)}`;
  fs.writeFileSync(indexPath, updatedIndex);
  console.log("Updated index.html: moved unit-order.js before app.js");
} else if (unitOrderScripts.length > 1) {
  const indexWithoutDuplicateScripts = indexSource.replace(unitOrderScriptPattern, "");
  const normalizedAppScriptMatch = /^([ \t]*)(<script\b[^>]*\bsrc=["']\.\/app\.js(?:\?[^"']*)?["'][^>]*><\/script>)/m.exec(
    indexWithoutDuplicateScripts
  );
  const normalizedInsertion = `${normalizedAppScriptMatch[1]}${standardUnitOrderScript}\n`;
  const updatedIndex = `${indexWithoutDuplicateScripts.slice(0, normalizedAppScriptMatch.index)}${normalizedInsertion}${indexWithoutDuplicateScripts.slice(normalizedAppScriptMatch.index)}`;
  fs.writeFileSync(indexPath, updatedIndex);
  console.log("Updated index.html: normalized unit-order.js before app.js");
} else {
  console.log("Index already loads unit-order.js");
}
