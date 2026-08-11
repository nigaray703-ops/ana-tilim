import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const projectRoot = path.resolve(import.meta.dirname, "..");
const contractPath = path.join(projectRoot, "课程/语法与基础句型/final-reading-additions.json");
const expectedGroups = [
  ["grammar-person-verbs", 3],
  ["grammar-possession", 3],
  ["grammar-location-direction", 3],
  ["grammar-basic-time", 3],
  ["sentence-self-introduction", 4],
  ["sentence-location-direction", 4],
  ["sentence-ability-preference", 4],
  ["sentence-polite-reason", 4]
];

assert.ok(fs.existsSync(contractPath), "final 28-item review contract should exist");
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
assert.equal(contract.schemaVersion, 1);
assert.equal(contract.ownerDecision, "approved-topics");
assert.equal(contract.releaseStatus, "approved");
assert.deepEqual(contract.units.map((unit) => unit.unitId), ["grammar-basics", "sentence-patterns"]);

const groups = contract.units.flatMap((unit) => unit.groups.map((group) => ({ ...group, unitId: unit.unitId })));
assert.deepEqual(groups.map((group) => [group.id, group.items.length]), expectedGroups);
const expectedItemIds = expectedGroups.flatMap(([groupId, count]) => Array.from({ length: count }, (_, index) => `${groupId}-${index + 1}`));
const items = groups.flatMap((group) => group.items.map((item) => ({ ...item, groupId: group.id, unitId: group.unitId })));
assert.deepEqual(items.map((item) => item.id), expectedItemIds);
assert.equal(new Set(items.map((item) => item.id)).size, 28);
assert.equal(new Set(items.map((item) => item.value)).size, 28, "every new recording sentence should be distinct");

const transliterationContext = { window: {} };
transliterationContext.globalThis = transliterationContext;
vm.createContext(transliterationContext);
vm.runInContext(fs.readFileSync(path.join(projectRoot, "prototype/uly-transliteration.js"), "utf8"), transliterationContext);
for (const group of groups) {
  assert.equal(group.reviewStatus, "approved");
  assert.deepEqual(group.training.steps, ["rule", "compare", "recognition", "ordering", "completion"]);
  assert.ok(group.training.compareItemIds.every((id) => group.items.some((item) => item.id === id)));
  assert.ok(group.training.recognition.options.some((option) => option.id === group.training.recognition.answerId));
  assert.ok(group.training.completion.options.some((option) => option.id === group.training.completion.answerId));
  assert.equal(group.training.ordering.answerIds.length, group.training.ordering.tokens.length);
  assert.deepEqual(
    [...group.training.ordering.answerIds].sort(),
    group.training.ordering.tokens.map((token) => token.id).sort(),
    `${group.id} ordering answer should use every visible token exactly once`
  );
  const tokenById = new Map(group.training.ordering.tokens.map((token) => [token.id, token.value]));
  assert.equal(
    group.training.ordering.answerIds.map((id) => tokenById.get(id)).join(""),
    group.training.ordering.completedValue
  );
}

for (const item of items) {
  assert.equal(item.reviewStatus, "approved");
  assert.ok(item.value.trim() && item.meaningZh.trim() && item.meaningEn.trim());
  assert.ok(item.patternZh.trim() && item.patternEn.trim() && item.lessonZh.trim() && item.lessonEn.trim());
  assert.match(item.latin, /^[A-Za-zËÖÜëöü ',.!?;:\-]+$/u);
  assert.doesNotMatch(item.latin, /\p{Script=Arabic}/u);
  const generated = transliterationContext.window.ANA_TILIM_ULY.transliterateUyghur(item.value, { sentenceCase: true });
  assert.equal(item.latin.toLocaleLowerCase("en"), generated.toLocaleLowerCase("en"), `${item.id} ULY should match the shared transliterator`);
}

assert.deepEqual(contract.vocabularyCorrections, [{
  oldId: "marhaba",
  oldFile: "human_vocab_marhaba.webm",
  id: "erzimaydu",
  value: "ئەرزىمەيدۇ",
  latin: "erzimeydu",
  meaningZh: "不客气、不用谢",
  meaningEn: "You're welcome.",
  file: "human_vocab_erzimeydu.webm",
  reviewStatus: "approved",
  sourceNote: "负责人纠正并要求重新录制；录音采用前不替换正式课程。"
}]);

const vocabSource = fs.readFileSync(path.join(projectRoot, "prototype/course-data/vocab-data.js"), "utf8");
const vocabManifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "prototype/assets/audio/human/vocab/manifest.json"), "utf8"));
assert.doesNotMatch(vocabSource, /["']hayr["']/);
assert.equal(vocabManifest.items.some((item) => item.id === "hayr"), false);
assert.equal(fs.existsSync(path.join(projectRoot, "prototype/assets/audio/human/vocab/human_vocab_hayr.webm")), false);
assert.deepEqual(vocabManifest.items.map((item) => item.order), Array.from({ length: vocabManifest.items.length }, (_, index) => index + 1));

console.log("final reading additions contract checks passed");
