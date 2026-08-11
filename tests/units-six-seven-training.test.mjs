import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const projectRoot = path.resolve(import.meta.dirname, "..");
const context = { window: {} };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(projectRoot, "prototype/course-data/reading-data.js"), "utf8"), context);

const readingUnits = JSON.parse(JSON.stringify(context.window.ANA_TILIM_READING.readingUnits));
const grammarUnit = readingUnits.find((unit) => unit.id === "grammar-basics");
const sentenceUnit = readingUnits.find((unit) => unit.id === "sentence-patterns");
const expectedSteps = ["rule", "compare", "recognition", "ordering", "completion"];
const expectedGrammarIds = [
  "grammar-word-order",
  "grammar-copula",
  "grammar-negative-emes",
  "grammar-yes-no-mu",
  "grammar-question-words",
  "grammar-bar-yoq",
  "grammar-person-verbs",
  "grammar-possession",
  "grammar-location-direction",
  "grammar-basic-time"
];
const expectedSentenceIds = [
  "sentence-this-that",
  "sentence-who-what",
  "sentence-i-you",
  "sentence-have",
  "sentence-like-need",
  "sentence-time",
  "sentence-no",
  "sentence-question",
  "sentence-self-introduction",
  "sentence-location-direction",
  "sentence-ability-preference",
  "sentence-polite-reason"
];

assert.deepEqual(grammarUnit.groups.map((group) => group.id), expectedGrammarIds);
assert.deepEqual(sentenceUnit.groups.map((group) => group.id), expectedSentenceIds);

for (const group of [...grammarUnit.groups, ...sentenceUnit.groups]) {
  assert.ok(group.rule?.trim(), `${group.id} should explain its rule before practice`);
  assert.ok(group.training, `${group.id} should define fixed five-step training`);
  assert.deepEqual(group.training.steps, expectedSteps, `${group.id} should use the approved step order`);

  assert.equal(group.training.compareItemIds.length, 2, `${group.id} comparison should use two sentences`);
  assert.ok(
    group.training.compareItemIds.every((id) => group.items.some((item) => item.id === id)),
    `${group.id} comparison must stay inside its topic`
  );

  const recognition = group.training.recognition;
  assert.ok(recognition.promptZh.trim() && recognition.promptEn.trim(), `${group.id} recognition prompt should be bilingual`);
  assert.equal(recognition.options.length, 2, `${group.id} recognition should have two choices`);
  assert.equal(new Set(recognition.options.map((option) => option.id)).size, 2, `${group.id} recognition option IDs should be unique`);
  assert.ok(recognition.options.some((option) => option.id === recognition.answerId), `${group.id} recognition answer should be visible`);
  assert.ok(
    recognition.options.every((option) => group.items.some((item) => item.id === option.itemId)),
    `${group.id} recognition choices must stay inside its topic`
  );

  const ordering = group.training.ordering;
  const tokenById = new Map(ordering.tokens.map((token) => [token.id, token.value]));
  assert.equal(tokenById.size, ordering.tokens.length, `${group.id} ordering token IDs should be unique`);
  assert.deepEqual(
    [...ordering.answerIds].sort(),
    ordering.tokens.map((token) => token.id).sort(),
    `${group.id} ordering answer should use each visible token once`
  );
  assert.equal(
    ordering.answerIds.map((id) => tokenById.get(id)).join(""),
    ordering.completedValue,
    `${group.id} ordering should reconstruct one exact course sentence`
  );
  assert.ok(group.items.some((item) => item.value === ordering.completedValue), `${group.id} ordering result should exist in course data`);

  const completion = group.training.completion;
  assert.ok(completion.promptZh.trim() && completion.promptEn.trim(), `${group.id} completion prompt should be bilingual`);
  assert.equal(completion.options.length, 2, `${group.id} completion should have two choices`);
  assert.equal(new Set(completion.options.map((option) => option.id)).size, 2, `${group.id} completion option IDs should be unique`);
  assert.ok(completion.options.some((option) => option.id === completion.answerId), `${group.id} completion answer should be visible`);
  const completedItem = group.items.find((item) => item.value === completion.completedValue);
  assert.ok(completedItem, `${group.id} completion result should exist in course data`);
  assert.equal(completion.meaningZh, completedItem.meaning, `${group.id} completion Chinese meaning should match its sentence`);
  assert.ok(completion.meaningEn.trim(), `${group.id} completion English meaning should be present`);
}

console.log("units six and seven five-step training data checks passed");
