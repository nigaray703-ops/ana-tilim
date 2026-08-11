import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { loadCourseData } from "../tools/import-form-example-audio.mjs";
import { validateWebmBuffer } from "../tools/lib/webm-audio.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const contract = JSON.parse(fs.readFileSync(path.join(projectRoot, "课程/语法与基础句型/final-reading-additions.json"), "utf8"));
assert.equal(contract.releaseStatus, "approved", "recorded and source-bound final content should be approved for release");
const readingManifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "prototype/assets/audio/human/reading/manifest.json"), "utf8"));
const vocabManifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "prototype/assets/audio/human/vocab/manifest.json"), "utf8"));
const course = loadCourseData();

const approvedGroups = contract.units.flatMap((unit) => unit.groups.map((group) => ({ ...group, unitId: unit.unitId })));
const actualGroups = new Map(course.readingUnits.flatMap((unit) => unit.groups.map((group) => [group.id, { ...group, unitId: unit.id }])));
const readingItems = course.readingUnits.flatMap((unit) => unit.groups.flatMap((group) => group.items));
assert.equal(readingItems.length, 192, "all 28 approved reading rows should be published");
assert.equal(course.readingUnits.find((unit) => unit.id === "grammar-basics").groups.length, 10);
assert.equal(course.readingUnits.find((unit) => unit.id === "sentence-patterns").groups.length, 12);
assert.equal(readingManifest.items.length, 192);

for (const approved of approvedGroups) {
  const actual = actualGroups.get(approved.id);
  assert.ok(actual, `missing approved reading group ${approved.id}`);
  assert.equal(actual.unitId, approved.unitId);
  assert.equal(actual.title, approved.titleZh);
  assert.equal(actual.rule, approved.ruleZh);
  assert.deepEqual(JSON.parse(JSON.stringify(actual.training)), approved.training);
  assert.deepEqual(
    JSON.parse(JSON.stringify(actual.items.map(({ id, value, meaning, pattern, lesson, reviewStatus }) => ({ id, value, meaning, pattern, lesson, reviewStatus })))),
    approved.items.map((item) => ({ id: item.id, value: item.value, meaning: item.meaningZh, pattern: item.patternZh, lesson: item.lessonZh, reviewStatus: item.reviewStatus }))
  );
  for (const [index, item] of actual.items.entries()) {
    assert.equal(item.latin.toLocaleLowerCase("en"), approved.items[index].latin.toLocaleLowerCase("en"));
  }
  for (const item of approved.items) {
    const manifestItem = readingManifest.items.find((candidate) => candidate.id === item.id);
    assert.ok(manifestItem, `missing reading manifest item ${item.id}`);
    assert.equal(manifestItem.value, item.value);
    assert.equal(manifestItem.latin, item.latin);
    const audioPath = path.join(projectRoot, "prototype", manifestItem.outputPath);
    validateWebmBuffer(fs.readFileSync(audioPath));
  }
}

const i18nContext = { window: {} };
i18nContext.globalThis = i18nContext;
vm.createContext(i18nContext);
vm.runInContext(fs.readFileSync(path.join(projectRoot, "prototype/i18n/reading-en.js"), "utf8"), i18nContext);
for (const approved of approvedGroups) {
  assert.equal(i18nContext.window.ANA_TILIM_READING_EN.groups[approved.id].title, approved.titleEn);
  for (const item of approved.items) {
    assert.deepEqual(JSON.parse(JSON.stringify(i18nContext.window.ANA_TILIM_READING_EN.items[item.id])), { pattern: item.patternEn, meaning: item.meaningEn, lesson: item.lessonEn });
  }
}

const correction = contract.vocabularyCorrections[0];
const vocabItems = course.vocabGroups.flatMap((group) => group.items);
assert.equal(vocabItems.length, 206, "the correction must replace one vocabulary row without deleting unrelated retained rows");
const correctedItem = vocabItems.find((item) => item.id === correction.id);
assert.deepEqual({ id: correctedItem.id, value: correctedItem.value, latin: correctedItem.latin, meaning: correctedItem.meaning }, { id: correction.id, value: correction.value, latin: correction.latin, meaning: correction.meaningZh });
assert.equal(vocabItems.some((item) => item.id === correction.oldId), false);
const correctionManifest = vocabManifest.items.find((item) => item.id === correction.id);
assert.ok(correctionManifest);
assert.equal(correctionManifest.value, correction.value);
assert.equal(correctionManifest.latin, correction.latin);
validateWebmBuffer(fs.readFileSync(path.join(projectRoot, "prototype", correctionManifest.outputPath)));
assert.equal(vocabManifest.items.some((item) => item.id === correction.oldId), false);
assert.equal(fs.existsSync(path.join(projectRoot, "prototype/assets/audio/human/vocab", correction.oldFile)), false);

console.log("final course content and audio integration checks passed");
