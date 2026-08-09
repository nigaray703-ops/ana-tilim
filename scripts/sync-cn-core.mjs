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
const latinKeyboardScriptPattern = /<script\b[^>]*\bsrc=["']\.\/latin-keyboard\.js(?:\?[^"']*)?["'][^>]*><\/script>/g;
const latinWritingScriptPattern = /^[ \t]*<script\b[^>]*\bsrc=["']\.\/course-data\/latin-writing-data\.js(?:\?[^"']*)?["'][^>]*><\/script>[ \t]*(?:\r?\n|$)/gm;
const syllableDataScriptPattern = /^[ \t]*<script\b[^>]*\bsrc=["']\.\/course-data\/syllable-data\.js(?:\?[^"']*)?["'][^>]*><\/script>[ \t]*(?:\r?\n|$)/gm;
const afantiDataScriptPattern = /^[ \t]*<script\b[^>]*\bsrc=["']\.\/course-data\/afanti-data\.js(?:\?[^"']*)?["'][^>]*><\/script>[ \t]*(?:\r?\n|$)/gm;
const afantiEnglishDataScriptPattern = /^[ \t]*<script\b[^>]*\bsrc=["']\.\/course-data\/afanti-english-data\.js(?:\?[^"']*)?["'][^>]*><\/script>[ \t]*(?:\r?\n|$)/gm;
const afantiContentScriptPattern = /^[ \t]*<script\b[^>]*\bsrc=["']\.\/afanti-content\.js(?:\?[^"']*)?["'][^>]*><\/script>[ \t]*(?:\r?\n|$)/gm;
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

const comboDataScriptPattern = /^([ \t]*)(<script\b[^>]*\bsrc=["']\.\/course-data\/combo-data\.js(?:\?[^"']*)?["'][^>]*><\/script>)[ \t]*(?:\r?\n|$)/m;
const indexWithoutSyllableScripts = normalizedIndex.replace(syllableDataScriptPattern, "");
const comboDataScriptMatch = comboDataScriptPattern.exec(indexWithoutSyllableScripts);
const courseDataMatchAfterSyllableRemoval = courseDataScriptPattern.exec(indexWithoutSyllableScripts);

if (!comboDataScriptMatch || !courseDataMatchAfterSyllableRemoval || comboDataScriptMatch.index > courseDataMatchAfterSyllableRemoval.index) {
  throw new Error(`Cannot update ${indexPath}: combo-data.js must load before course-data.js.`);
}

const standardSyllableDataScript = '<script src="./course-data/syllable-data.js?v=20260809-plan3-final-content"></script>';
const syllableInsertionIndex = comboDataScriptMatch.index + comboDataScriptMatch[0].length;
normalizedIndex = `${indexWithoutSyllableScripts.slice(0, syllableInsertionIndex)}${comboDataScriptMatch[1]}${standardSyllableDataScript}\n${indexWithoutSyllableScripts.slice(syllableInsertionIndex)}`;
indexUpdateMessages.push("Normalized index.html: syllable-data.js after combo-data.js");

const indexWithoutAfantiScripts = normalizedIndex
  .replace(afantiDataScriptPattern, "")
  .replace(afantiEnglishDataScriptPattern, "")
  .replace(afantiContentScriptPattern, "");
const courseDataMatchAfterAfantiRemoval = courseDataScriptPattern.exec(indexWithoutAfantiScripts);
if (!courseDataMatchAfterAfantiRemoval) {
  throw new Error(`Cannot update ${indexPath}: course-data.js script tag is required.`);
}
const afantiIndent = courseDataMatchAfterAfantiRemoval[0].match(/^[ \t]*/)?.[0] || "";
const standardAfantiScripts = [
  '<script src="./course-data/afanti-data.js?v=20260810-reviewed-afanti"></script>',
  '<script src="./afanti-content.js?v=20260810-reviewed-afanti"></script>'
].map((tag) => `${afantiIndent}${tag}\n`).join("");
normalizedIndex = `${indexWithoutAfantiScripts.slice(0, courseDataMatchAfterAfantiRemoval.index)}${standardAfantiScripts}${indexWithoutAfantiScripts.slice(courseDataMatchAfterAfantiRemoval.index)}`;
indexUpdateMessages.push("Normalized index.html: shared Afanti data and validator before course-data.js");

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

const standardLatinKeyboardScript = '<script src="./latin-keyboard.js?v=20260809-latin-qwerty"></script>';
const latinKeyboardScripts = normalizedIndex.match(latinKeyboardScriptPattern) || [];
const appMatchBeforeLatinKeyboard = appScriptPattern.exec(normalizedIndex);

if (latinKeyboardScripts.length === 0) {
  const insertion = `${appMatchBeforeLatinKeyboard[1]}${standardLatinKeyboardScript}\n`;
  normalizedIndex = `${normalizedIndex.slice(0, appMatchBeforeLatinKeyboard.index)}${insertion}${normalizedIndex.slice(appMatchBeforeLatinKeyboard.index)}`;
  indexUpdateMessages.push("Updated index.html: added latin-keyboard.js before app.js");
} else if (latinKeyboardScripts.length === 1 && normalizedIndex.indexOf(latinKeyboardScripts[0]) > appMatchBeforeLatinKeyboard.index) {
  const indexWithoutMisplacedScript = normalizedIndex.replace(latinKeyboardScripts[0], "");
  const appMatchAfterRemoval = appScriptPattern.exec(indexWithoutMisplacedScript);
  const insertion = `${appMatchAfterRemoval[1]}${standardLatinKeyboardScript}\n`;
  normalizedIndex = `${indexWithoutMisplacedScript.slice(0, appMatchAfterRemoval.index)}${insertion}${indexWithoutMisplacedScript.slice(appMatchAfterRemoval.index)}`;
  indexUpdateMessages.push("Updated index.html: moved latin-keyboard.js before app.js");
} else if (latinKeyboardScripts.length > 1) {
  const indexWithoutDuplicateScripts = normalizedIndex.replace(latinKeyboardScriptPattern, "");
  const appMatchAfterRemoval = appScriptPattern.exec(indexWithoutDuplicateScripts);
  const normalizedInsertion = `${appMatchAfterRemoval[1]}${standardLatinKeyboardScript}\n`;
  normalizedIndex = `${indexWithoutDuplicateScripts.slice(0, appMatchAfterRemoval.index)}${normalizedInsertion}${indexWithoutDuplicateScripts.slice(appMatchAfterRemoval.index)}`;
  indexUpdateMessages.push("Updated index.html: normalized latin-keyboard.js before app.js");
} else {
  indexUpdateMessages.push("Index already loads latin-keyboard.js");
}

const sharedCacheReferences = [
  {
    pattern: /(\bhref=["']\.\/styles\.css)(?:\?[^"']*)?(["'])/g,
    replacement: "$1?v=20260809-syllable-sentences$2",
    label: "styles.css"
  },
  {
    pattern: /(\bsrc=["']\.\/progress-transfer\.js)(?:\?[^"']*)?(["'])/g,
    replacement: "$1?v=20260809-syllable-review$2",
    label: "progress-transfer.js"
  },
  {
    pattern: /(\bsrc=["']\.\/course-data\.js)(?:\?[^"']*)?(["'])/g,
    replacement: "$1?v=20260810-reviewed-afanti$2",
    label: "course-data.js"
  },
  {
    pattern: /(\bsrc=["']\.\/app\.js)(?:\?[^"']*)?(["'])/g,
    replacement: "$1?v=20260809-plan3-stage-guard$2",
    label: "app.js"
  }
];

for (const { pattern, replacement, label } of sharedCacheReferences) {
  const updatedIndex = normalizedIndex.replace(pattern, replacement);
  if (updatedIndex !== normalizedIndex) {
    normalizedIndex = updatedIndex;
    indexUpdateMessages.push(`Normalized index.html cache token: ${label}`);
  }
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
