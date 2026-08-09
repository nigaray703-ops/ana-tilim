import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { loadCourseData } from "../import-form-example-audio.mjs";

const CATEGORY_MANIFESTS = Object.freeze({
  alphabet: "prototype/assets/audio/human/alphabet/manifest.json",
  combos: "prototype/assets/audio/human/combos/manifest.json",
  vocab: "prototype/assets/audio/human/vocab/manifest.json",
  reading: "prototype/assets/audio/human/reading/manifest.json",
  "form-examples": "prototype/assets/audio/human/form-examples/manifest.json"
});

const CATEGORY_COUNTS = Object.freeze({
  alphabet: 32,
  combos: 34,
  vocab: 203,
  reading: 164,
  "form-examples": 94
});

const NEEDS_RERECORD_IDS = new Set(["alphabet:zhe", "vocab:korushkunche"]);
const MISSING_ENGLISH = "暂无英语释义";
const COURSE_PROJECT_ROOT = path.resolve(import.meta.dirname, "../..");
const COURSE_DATA_SCRIPTS = Object.freeze([
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
]);

function recordingTextHash({ value, latin, meaning, english }) {
  return crypto.createHash("sha256").update(JSON.stringify({ value, latin, meaning, english })).digest("hex");
}

function stableSourceId(category, item) {
  return category === "alphabet" ? item.letterId : item.id;
}

function formExampleKey(value) {
  let hash = 2166136261;

  for (const character of value.normalize("NFC")) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function buildFormExamples(course) {
  const byValue = new Map();

  for (const [letterId, letter] of Object.entries(course.letterDetails)) {
    for (const example of letter.formExamples || []) {
      if (!example.word) continue;

      const current = byValue.get(example.word);
      if (current) {
        current.latin ||= example.latin || "";
        current.meaning ||= example.meaning || "";
        current.occurrences.push({ letterId, formId: example.id, label: example.label });
        continue;
      }

      byValue.set(example.word, {
        id: `form-example-${formExampleKey(example.word)}`,
        value: example.word,
        latin: example.latin || "未提供转写",
        meaning: example.meaning || "写法例词",
        occurrences: [{ letterId, formId: example.id, label: example.label }]
      });
    }
  }

  const reusableValues = new Set(
    [...course.comboGroups, ...course.vocabGroups].flatMap((group) => group.items.map((item) => item.value))
  );
  return [...byValue.values()].filter((item) => !reusableValues.has(item.value));
}

function addSourceIndex(index, category, id, value) {
  assert.equal(typeof id, "string", `${category} source ID must be text`);
  assert.ok(!index.has(id), `duplicate ${category} source ID: ${id}`);
  index.set(id, value);
}

function sourceIndexes(course) {
  const indexes = {
    alphabet: new Map(),
    combos: new Map(),
    vocab: new Map(),
    reading: new Map(),
    "form-examples": new Map()
  };

  for (const item of course.alphabetAudioItems) {
    const letter = course.letterDetails[item.letterId];
    assert.ok(letter, `missing alphabet letter detail for ${item.letterId}`);
    addSourceIndex(indexes.alphabet, "alphabet", item.letterId, { source: letter, groupId: null, value: letter.letter, latin: letter.latin, meaning: letter.type });
  }
  for (const group of course.comboGroups) {
    for (const item of group.items) addSourceIndex(indexes.combos, "combos", item.id, { source: item, groupId: group.id, value: item.value, latin: item.latin, meaning: item.meaning || item.review });
  }
  for (const group of course.vocabGroups) {
    for (const item of group.items) addSourceIndex(indexes.vocab, "vocab", item.id, { source: item, groupId: group.id, value: item.value, latin: item.latin, meaning: item.meaning });
  }
  for (const unit of course.readingUnits) {
    for (const group of unit.groups) {
      for (const item of group.items) {
        addSourceIndex(indexes.reading, "reading", item.id, {
          source: item,
          unitId: unit.id,
          groupId: group.id,
          value: item.value,
          latin: item.latin,
          meaning: item.meaning,
          manifestLatin: item.pattern || item.speaker || unit.subtitle
        });
      }
    }
  }
  for (const item of buildFormExamples(course)) {
    addSourceIndex(indexes["form-examples"], "form-examples", item.id, { source: item, groupId: item.occurrences[0]?.letterId || null, value: item.value, latin: item.latin, meaning: item.meaning });
  }

  return indexes;
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

function assertNoSymlinkComponents(root, candidate) {
  const relative = path.relative(root, candidate);
  assert.ok(isInside(root, candidate), "output path escapes human-audio root");
  let current = root;
  assert.ok(!fs.lstatSync(current).isSymbolicLink(), "output path must not traverse a symbolic link");
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) break;
    assert.ok(!fs.lstatSync(current).isSymbolicLink(), "output path must not traverse a symbolic link");
  }
}

function resolveOutputPath({ projectRoot, category, item }) {
  assert.equal(typeof item.file, "string", "manifest current file must be a string");
  assert.equal(path.basename(item.file), item.file, "manifest current file must not contain a path");
  assert.match(item.file, /^[a-z0-9_]+\.webm$/, "manifest current file must be a WebM filename");
  assert.equal(typeof item.outputPath, "string", "manifest output path must be a string");

  const prototypeRoot = path.resolve(projectRoot, "prototype");
  const audioRoot = path.resolve(prototypeRoot, "assets/audio/human");
  const absoluteOutputPath = path.resolve(prototypeRoot, item.outputPath);
  const expectedOutputPath = path.join(audioRoot, category, item.file);

  assert.ok(isInside(audioRoot, absoluteOutputPath), "output path escapes human-audio root");
  assert.equal(absoluteOutputPath, expectedOutputPath, "manifest output path does not match its category and current file");
  assert.ok(!fs.lstatSync(audioRoot).isSymbolicLink(), "human-audio root must not be a symbolic link");
  assertNoSymlinkComponents(prototypeRoot, audioRoot);
  assertNoSymlinkComponents(audioRoot, absoluteOutputPath);
  assert.ok(isInside(fs.realpathSync(audioRoot), fs.realpathSync(path.dirname(absoluteOutputPath))), "output path escapes human-audio root after realpath resolution");
  return absoluteOutputPath;
}

function loadCourseDataAtProjectRoot(projectRoot) {
  if (fs.realpathSync(projectRoot) === fs.realpathSync(COURSE_PROJECT_ROOT)) return loadCourseData();

  const context = { console, window: {} };
  context.globalThis = context;
  vm.createContext(context);
  for (const relativePath of COURSE_DATA_SCRIPTS) {
    const absolutePath = path.join(projectRoot, relativePath);
    vm.runInContext(fs.readFileSync(absolutePath, "utf8"), context, { filename: absolutePath });
  }
  return context.window.ANA_TILIM_COURSE;
}

function loadApprovedEnglish(projectRoot) {
  const context = { console, window: {} };
  context.globalThis = context;
  vm.createContext(context);

  for (const relativePath of [
    ...COURSE_DATA_SCRIPTS,
    "prototype/i18n/alphabet-en.js",
    "prototype/i18n/combo-en.js",
    "prototype/i18n/vocab-en.js",
    "prototype/i18n/practice-en.js",
    "prototype/i18n/reading-en.js",
    "prototype/i18n/course-en.js"
  ]) {
    const absolutePath = path.join(projectRoot, relativePath);
    vm.runInContext(fs.readFileSync(absolutePath, "utf8"), context, { filename: absolutePath });
  }

  return context.window.ANA_TILIM_COURSE_EN;
}

function englishFor({ category, sourceId, source, englishCatalog }) {
  let approvedEnglish;
  if (category === "alphabet") approvedEnglish = englishCatalog.alphabet.letterDetails[sourceId]?.type;
  if (category === "combos") approvedEnglish = englishCatalog.combos.items[sourceId]?.meaning;
  if (category === "vocab") approvedEnglish = englishCatalog.vocab.items[sourceId]?.meaning;
  if (category === "reading") approvedEnglish = englishCatalog.reading.items[sourceId]?.meaning;
  if (category === "form-examples") {
    approvedEnglish = source.occurrences
      .map(({ letterId, formId }) => englishCatalog.alphabet.letterDetails[letterId]?.formExamples?.[formId]?.meaning)
      .find((candidate) => typeof candidate === "string" && candidate.trim());
  }

  for (const candidate of [approvedEnglish, source.english, source.en]) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return MISSING_ENGLISH;
}

function normalizeTarget({ projectRoot, category, item, indexes, stableIds, englishCatalog }) {
  const sourceId = stableSourceId(category, item);
  assert.equal(typeof sourceId, "string", `${category} manifest item must have a stable source ID`);
  const stableId = `${category}:${sourceId}`;
  assert.ok(!stableIds.has(stableId), `duplicate stable ID: ${stableId}`);
  stableIds.add(stableId);

  const joined = indexes[category].get(sourceId);
  assert.ok(joined, `missing course-data join for ${stableId}`);
  assert.equal(item.value ?? item.recordingText, joined.value, `value drift for ${stableId}`);
  assert.equal(typeof item.latin, "string", `manifest latin must be text for ${stableId}`);
  const expectedManifestLatin = joined.manifestLatin ?? joined.latin;
  assert.equal(item.latin, expectedManifestLatin, `latin drift for ${stableId}`);
  if (joined.groupId && category !== "form-examples") assert.equal(item.groupId, joined.groupId, `group ID drift for ${stableId}`);
  if (joined.unitId) assert.equal(item.unitId, joined.unitId, `unit ID drift for ${stableId}`);

  const value = joined.value;
  const latin = joined.latin;
  const meaning = joined.meaning;
  const english = englishFor({ category, sourceId, source: joined.source, englishCatalog });
  assert.ok(typeof value === "string" && value.trim(), `missing source value for ${stableId}`);
  assert.ok(typeof latin === "string" && latin.trim(), `missing source latin for ${stableId}`);
  assert.ok(typeof meaning === "string" && meaning.trim(), `missing source meaning for ${stableId}`);
  assert.equal(item.playable, true, `manifest target must be playable for ${stableId}`);

  const absoluteOutputPath = resolveOutputPath({ projectRoot, category, item });
  return Object.freeze({
    stableId,
    category,
    sourceId,
    groupId: joined.groupId ?? item.groupId,
    value,
    latin,
    meaning,
    english,
    currentFile: item.file,
    outputPath: item.outputPath,
    absoluteOutputPath,
    recordingTextHash: recordingTextHash({ value, latin, meaning, english }),
    playable: item.playable,
    initialStatus: NEEDS_RERECORD_IDS.has(stableId) ? "needs-rerecord" : "pending-review"
  });
}

export function buildRecordingCatalog({ projectRoot }) {
  assert.equal(typeof projectRoot, "string", "projectRoot is required");
  const normalizedProjectRoot = path.resolve(projectRoot);
  const course = loadCourseDataAtProjectRoot(normalizedProjectRoot);
  const englishCatalog = loadApprovedEnglish(normalizedProjectRoot);
  const indexes = sourceIndexes(course);
  const stableIds = new Set();
  const targets = [];

  for (const [category, relativeManifest] of Object.entries(CATEGORY_MANIFESTS)) {
    const manifestPath = path.join(normalizedProjectRoot, relativeManifest);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    assert.ok(Array.isArray(manifest.items), `${category} manifest items must be an array`);
    const categoryStableIds = new Set();
    for (const item of manifest.items) {
      const stableId = `${category}:${stableSourceId(category, item)}`;
      assert.ok(!categoryStableIds.has(stableId), `duplicate stable ID: ${stableId}`);
      categoryStableIds.add(stableId);
    }
    assert.equal(manifest.items.length, CATEGORY_COUNTS[category], `${category} manifest count drift`);
    for (const item of manifest.items) targets.push(normalizeTarget({ projectRoot: normalizedProjectRoot, category, item, indexes, stableIds, englishCatalog }));
  }

  assert.equal(targets.length, 527, "recording catalog count drift");
  return Object.freeze({ schemaVersion: 1, generatedAt: new Date().toISOString(), targets: Object.freeze(targets) });
}
