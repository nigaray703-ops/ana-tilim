import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const courseDataScriptPaths = [
  "prototype/course-data/alphabet-data.js",
  "prototype/course-data/combo-data.js",
  "prototype/course-data/vocab-data.js",
  "prototype/course-data/practice-data.js",
  "prototype/course-data.js"
];

const context = {
  console,
  window: {}
};
context.globalThis = context;
vm.createContext(context);

for (const scriptPath of courseDataScriptPaths) {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), context, { filename: scriptPath });
}

const courseData = context.window.ANA_TILIM_COURSE;
assert.ok(courseData, "course data should load from the focused data files");

const {
  alphabetLetters,
  letterDetails,
  alphabetGroups,
  alphabetAudioItems,
  comboGroups,
  vocabGroups,
  practiceGroups
} = courseData;

function assertText(value, label) {
  assert.equal(typeof value, "string", `${label} should be text`);
  assert.ok(value.trim().length > 0, `${label} should not be empty`);
}

function assertList(value, label) {
  assert.ok(Array.isArray(value), `${label} should be a list`);
  assert.ok(value.length > 0, `${label} should not be empty`);
}

function assertUnique(values, label) {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  assert.deepEqual([...duplicates], [], `${label} should not contain duplicate ids`);
}

function flattenGroupItems(groups) {
  return groups.flatMap((group) => group.items.map((item) => ({ ...item, groupId: group.id })));
}

function assertGroupShape(groups, label) {
  assertList(groups, `${label} groups`);
  assertUnique(groups.map((group) => group.id), `${label} group ids`);

  for (const group of groups) {
    assertText(group.id, `${label} group id`);
    assertText(group.title, `${label} group ${group.id} title`);
    assertText(group.goal, `${label} group ${group.id} goal`);
    assertText(group.status, `${label} group ${group.id} status`);
    assertList(group.letters, `${label} group ${group.id} display items`);
    assertList(group.items, `${label} group ${group.id} items`);
    assert.equal(
      group.letters.length,
      group.items.length,
      `${label} group ${group.id} display list should match item count`
    );
  }
}

function assertManifestMatches(manifestPath, courseItems, label) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assertList(manifest.items, `${label} audio manifest items`);
  assert.equal(manifest.items.length, courseItems.length, `${label} audio manifest should match course item count`);
  assertUnique(manifest.items.map((item) => item.id || item.letterId), `${label} audio manifest ids`);
  assertUnique(manifest.items.map((item) => item.file), `${label} audio manifest filenames`);

  const courseById = Object.fromEntries(courseItems.map((item) => [item.id || item.letterId, item]));
  for (const audioItem of manifest.items) {
    const id = audioItem.id || audioItem.letterId;
    const courseItem = courseById[id];
    assert.ok(courseItem, `${label} audio item ${id} should point to an existing course item`);
    assert.equal(audioItem.value || audioItem.letter, courseItem.value || courseItem.letter, `${label} audio item ${id} value should match course data`);
    assert.equal(audioItem.latin, courseItem.latin, `${label} audio item ${id} latin should match course data`);
    assertText(audioItem.file, `${label} audio item ${id} file`);
    assert.ok(audioItem.file.endsWith(".mp3"), `${label} audio item ${id} file should be mp3`);
    assert.ok(audioItem.outputPath.endsWith(audioItem.file), `${label} audio item ${id} output path should include file name`);
    assert.equal(audioItem.reviewStatus, "待审听", `${label} audio item ${id} should stay in the review queue`);
  }
}

assertList(alphabetLetters, "alphabet letter list");
assert.equal(alphabetLetters.length, 32, "alphabet letter list should contain 32 standard letters");
for (const [index, letter] of alphabetLetters.entries()) {
  assertText(letter.letter, `alphabetLetters[${index}].letter`);
  assertText(letter.latin, `alphabetLetters[${index}].latin`);
  assertText(letter.type, `alphabetLetters[${index}].type`);
}

assert.equal(Object.keys(letterDetails).length, 32, "letter details should cover all 32 letters");
assertUnique(Object.values(letterDetails).map((letter) => letter.id), "letter detail ids");
for (const [key, letter] of Object.entries(letterDetails)) {
  assert.equal(letter.id, key, `letter detail key ${key} should match its id`);
  for (const field of ["letter", "latin", "type", "cue", "connection", "soundHint", "writingHint", "example"]) {
    assertText(letter[field], `letter detail ${key}.${field}`);
  }
  assert.equal(letter.forms.length, 4, `letter detail ${key} should include four writing forms`);
  for (const form of letter.forms) {
    assertText(form.label, `letter detail ${key} form label`);
    assertText(form.value, `letter detail ${key} form value`);
  }
}

assertList(alphabetGroups, "alphabet groups");
assertUnique(alphabetGroups.map((group) => group.id), "alphabet group ids");
const groupedLetterIds = alphabetGroups.flatMap((group) => group.letters.map((letter) => letter.id));
assert.equal(groupedLetterIds.length, 32, "alphabet groups should cover all 32 detailed letters");
assertUnique(groupedLetterIds, "alphabet grouped letter ids");
for (const letterId of groupedLetterIds) {
  assert.ok(letterDetails[letterId], `alphabet group letter ${letterId} should exist in letter details`);
}

assertUnique(alphabetAudioItems.map((item) => item.letterId), "alphabet audio letter ids");
assert.equal(alphabetAudioItems.length, 32, "alphabet audio data should cover all 32 letters");
for (const audioItem of alphabetAudioItems) {
  assert.ok(letterDetails[audioItem.letterId], `alphabet audio item ${audioItem.letterId} should point to a known letter`);
  assertText(audioItem.file, `alphabet audio ${audioItem.letterId} file`);
  assert.equal(audioItem.statusLabel, "AI 临时音频", `alphabet audio ${audioItem.letterId} should stay marked as temporary AI audio`);
  assert.ok(
    audioItem.outputPath === `./assets/audio/ai-temp/alphabet/${audioItem.file}`,
    `alphabet audio ${audioItem.letterId} output path should match its file`
  );
}

assertGroupShape(comboGroups, "combo");
assertGroupShape(vocabGroups, "vocab");
assertGroupShape(practiceGroups, "practice");

const comboItems = flattenGroupItems(comboGroups);
const vocabItems = flattenGroupItems(vocabGroups);
const practiceItems = flattenGroupItems(practiceGroups);
assertUnique(comboItems.map((item) => item.id), "combo item ids");
assertUnique(vocabItems.map((item) => item.id), "vocab item ids");
assertUnique(practiceItems.map((item) => item.id), "practice item ids");
assertUnique(
  [...Object.values(letterDetails).map((letter) => letter.id), ...comboItems, ...vocabItems, ...practiceItems].map(
    (item) => (typeof item === "string" ? item : item.id)
  ),
  "all learning item ids"
);

const vocabGroupById = Object.fromEntries(vocabGroups.map((group) => [group.id, group]));

function assertVocabTopic({ id, minItems, requiredMeanings, requiredValues = [] }) {
  const group = vocabGroupById[id];
  assert.ok(group, `vocab group ${id} should exist`);
  assert.ok(group.items.length >= minItems, `vocab group ${id} should include at least ${minItems} daily words`);

  for (const requiredValue of requiredValues) {
    assert.ok(
      group.items.some((item) => item.value === requiredValue),
      `vocab group ${id} should include ${requiredValue}`
    );
  }

  for (const requiredMeaning of requiredMeanings) {
    assert.ok(
      group.items.some((item) => item.meaning.includes(requiredMeaning)),
      `vocab group ${id} should include a word meaning ${requiredMeaning}`
    );
  }
}

assertVocabTopic({
  id: "family",
  minItems: 10,
  requiredMeanings: ["家庭", "儿子", "女儿", "哥哥", "弟弟"]
});
assertVocabTopic({
  id: "numbers",
  minItems: 10,
  requiredValues: ["ئون"],
  requiredMeanings: ["一", "五", "十"]
});
assertVocabTopic({
  id: "animals",
  minItems: 6,
  requiredMeanings: ["狗", "猫", "鱼", "鸟", "牛", "羊"]
});
assertVocabTopic({
  id: "vegetables",
  minItems: 6,
  requiredMeanings: ["番茄", "洋葱", "土豆", "胡萝卜", "大蒜", "黄瓜"]
});
assert.ok(vocabGroups.length >= 10 && vocabGroups.length <= 15, "vocab should include 10 to 15 compact daily topics");
for (const group of vocabGroups) {
  assert.ok(
    group.items.length >= 15 && group.items.length <= 20,
    `vocab group ${group.id} should include 15 to 20 words`
  );
}

for (const item of comboItems) {
  for (const field of ["id", "value", "latin", "type", "prompt", "rule", "hint", "review"]) {
    assertText(item[field], `combo item ${item.id}.${field}`);
  }
  assertList(item.parts, `combo item ${item.id}.parts`);
}

for (const item of vocabItems) {
  for (const field of [
    "id",
    "value",
    "latin",
    "meaning",
    "theme",
    "standardNote",
    "variantNote",
    "acceptableAnswer",
    "testPolicy",
    "reviewStatus",
    "sourceNote",
    "tip"
  ]) {
    assertText(item[field], `vocab item ${item.id}.${field}`);
  }
  assertList(item.parts, `vocab item ${item.id}.parts`);
  assert.equal(item.reviewStatus, "待母语者审校", `vocab item ${item.id} should remain explicitly queued for review`);
}

for (const item of practiceItems) {
  for (const field of ["id", "type", "value", "latin", "label", "hint", "audioStatus"]) {
    assertText(item[field], `practice item ${item.id}.${field}`);
  }
  assertList(item.parts, `practice item ${item.id}.parts`);
  assert.ok(item.audioStatus.includes("AI 临时音频"), `practice item ${item.id} should disclose temporary AI audio`);
}

assertManifestMatches("prototype/assets/audio/ai-temp/alphabet/manifest.json", alphabetAudioItems.map((item) => ({
  id: item.letterId,
  letterId: item.letterId,
  value: letterDetails[item.letterId].letter,
  letter: letterDetails[item.letterId].letter,
  latin: letterDetails[item.letterId].latin
})), "alphabet");
assertManifestMatches("prototype/assets/audio/ai-temp/combos/manifest.json", comboItems, "combo");
assertManifestMatches("prototype/assets/audio/ai-temp/vocab/manifest.json", vocabItems, "vocab");
assertManifestMatches("prototype/assets/audio/ai-temp/practice/manifest.json", practiceItems, "practice");

console.log("course data integrity checks passed");
