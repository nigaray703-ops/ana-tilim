import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { validateWebmBuffer } from "./lib/webm-audio.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const sourceArgument = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
const sourceDirectory = path.resolve(sourceArgument || path.join(os.homedir(), "Downloads"));
const checkOnly = process.argv.includes("--check");
const destinationDirectory = path.join(projectRoot, "prototype/assets/audio/human/form-examples");
const manifestPath = path.join(destinationDirectory, "manifest.json");

export function loadCourseData() {
  const context = { console, window: {} };
  context.globalThis = context;
  vm.createContext(context);

  for (const relativePath of [
    "prototype/uly-transliteration.js",
    "prototype/course-data/alphabet-data.js",
    "prototype/course-data/latin-writing-data.js",
    "prototype/course-data/combo-data.js",
    "prototype/course-data/syllable-data.js",
    "prototype/course-data/vocab-data.js",
    "prototype/course-data/practice-data.js",
    "prototype/course-data/reading-data.js",
    "prototype/course-data/afanti-data.js",
    "prototype/course-data/afanti-english-data.js",
    "prototype/afanti-content.js",
    "prototype/course-data.js"
  ]) {
    const absolutePath = path.join(projectRoot, relativePath);
    vm.runInContext(fs.readFileSync(absolutePath, "utf8"), context, { filename: absolutePath });
  }

  return context.window.ANA_TILIM_COURSE;
}

function stableFormExampleKey(value) {
  let hash = 2166136261;

  for (const char of value.normalize("NFC")) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function buildFormExampleItems(letterDetails) {
  const byValue = new Map();

  Object.entries(letterDetails).forEach(([letterId, letter]) => {
    (letter.formExamples || []).forEach((example) => {
      if (!example.word) return;

      const occurrence = { letterId, label: example.label };
      const current = byValue.get(example.word);

      if (current) {
        current.latin ||= example.latin || "";
        current.meaning ||= example.meaning || "";
        current.occurrences.push(occurrence);
        return;
      }

      const key = stableFormExampleKey(example.word);
      byValue.set(example.word, {
        id: `form-example-${key}`,
        key,
        value: example.word,
        latin: example.latin || "未提供转写",
        meaning: example.meaning || "写法例词",
        occurrences: [occurrence]
      });
    });
  });

  return [...byValue.values()];
}

function main() {
  const { letterDetails, comboGroups, vocabGroups } = loadCourseData();
  const reusableValues = new Set(
    [...comboGroups, ...vocabGroups].flatMap((group) => group.items.map((item) => item.value))
  );
  const dedicatedItems = buildFormExampleItems(letterDetails).filter((item) => !reusableValues.has(item.value));
  const expectedSourceFiles = new Set(dedicatedItems.map((item) => `voice_form_example_${item.key}.webm`));
  const availableSourceFiles = new Set(
    fs.readdirSync(sourceDirectory).filter((file) => /^voice_form_example_[a-z0-9]+\.webm$/.test(file))
  );
  const missingFiles = [...expectedSourceFiles].filter((file) => !availableSourceFiles.has(file));
  const unexpectedFiles = [...availableSourceFiles].filter((file) => !expectedSourceFiles.has(file));

  assert.equal(dedicatedItems.length, 94, "current course data should require 94 dedicated form example recordings");
  assert.deepEqual(missingFiles, [], `missing form example recordings: ${missingFiles.join(", ")}`);
  assert.deepEqual(unexpectedFiles, [], `unexpected form example recordings: ${unexpectedFiles.join(", ")}`);

  for (const sourceFile of expectedSourceFiles) {
    const sourcePath = path.join(sourceDirectory, sourceFile);
    const buffer = fs.readFileSync(sourcePath);
    validateWebmBuffer(buffer);
  }

  if (checkOnly) {
    console.log(`form example audio source check passed (${dedicatedItems.length} files)`);
    return;
  }

  fs.mkdirSync(destinationDirectory, { recursive: true });
  const manifestItems = dedicatedItems.map((item, index) => {
    const sourceFile = `voice_form_example_${item.key}.webm`;
    const file = `human_form_example_${item.key}.webm`;
    fs.copyFileSync(path.join(sourceDirectory, sourceFile), path.join(destinationDirectory, file));

    return {
      order: index + 1,
      id: item.id,
      key: item.key,
      value: item.value,
      latin: item.latin,
      meaning: item.meaning,
      occurrences: item.occurrences,
      sourceFile,
      file,
      outputPath: `./assets/audio/human/form-examples/${file}`,
      reviewStatus: "已接入",
      playable: true,
      statusLabel: "真人音频"
    };
  });

  const manifest = {
    title: "Ana Tilim Form Example Human Audio",
    status: "human_audio_connected",
    outputDirectory: "./assets/audio/human/form-examples/",
    instructions: "Human-recorded audio for the 94 form examples that do not reuse vocabulary or combo recordings.",
    items: manifestItems
  };

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`imported ${manifestItems.length} form example recordings`);
  console.log(`manifest: ${path.relative(projectRoot, manifestPath)}`);
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  main();
}
