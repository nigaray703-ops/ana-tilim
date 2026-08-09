import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

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

function readEbmlVint(buffer, offset) {
  const firstByte = buffer[offset];
  let length = 1;
  let marker = 0x80;

  while (length <= 8 && !(firstByte & marker)) {
    length += 1;
    marker >>= 1;
  }

  assert.ok(length <= 8 && offset + length <= buffer.length, "WebM should contain a valid EBML variable-length integer");

  let value = firstByte & (marker - 1);
  for (let index = 1; index < length; index += 1) {
    value = value * 256 + buffer[offset + index];
  }

  return { length, value };
}

function readWebmDurationMilliseconds(buffer) {
  const durationId = Buffer.from([0x44, 0x89]);
  const durationOffset = buffer.indexOf(durationId);
  assert.notEqual(durationOffset, -1, "WebM should contain a duration element");

  const durationSize = readEbmlVint(buffer, durationOffset + durationId.length);
  const valueOffset = durationOffset + durationId.length + durationSize.length;

  if (durationSize.value === 4) return buffer.readFloatBE(valueOffset);
  if (durationSize.value === 8) return buffer.readDoubleBE(valueOffset);
  assert.fail(`WebM duration should use a 4-byte or 8-byte float, received ${durationSize.value} bytes`);
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
    assert.ok(buffer.length > 4096, `${sourceFile} should contain playable audio data`);
    assert.deepEqual([...buffer.subarray(0, 4)], [0x1a, 0x45, 0xdf, 0xa3], `${sourceFile} should have a valid WebM header`);
    assert.ok(Number.isFinite(readWebmDurationMilliseconds(buffer)) && readWebmDurationMilliseconds(buffer) > 0, `${sourceFile} should have a positive duration`);
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
