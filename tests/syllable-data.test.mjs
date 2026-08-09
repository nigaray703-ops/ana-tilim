import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const modulePath = "prototype/course-data/syllable-data.js";
assert.ok(fs.existsSync(modulePath), "syllable training course data module should exist");

const context = { console, window: {} };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(modulePath, "utf8"), context, { filename: modulePath });

const api = context.window.ANA_TILIM_SYLLABLE;
assert.ok(api, "syllable module should expose ANA_TILIM_SYLLABLE");
assert.equal(typeof api.validateSyllableTraining, "function", "syllable module should expose its strict validator");

const data = api.syllableTraining;
assert.ok(data, "syllable module should expose reviewed training data");
assert.equal(Object.isFrozen(data), true, "syllable training data should be immutable at its public boundary");
assert.deepEqual(JSON.parse(JSON.stringify(data.unit)), {
  id: "syllable-training",
  name: "拼读与音节训练营",
  subtitle: "从两字母组合到短句分音节朗读",
  description: "先把两个字母稳定拼起来，再学习音节、连接与断开，最后回到完整短句。",
  bullets: ["两字母热身", "音节划分策略", "连接与断开", "短句拆分朗读"]
});
assert.deepEqual(
  JSON.parse(JSON.stringify(data.sections.map((section) => section.id))),
  ["two-letter-warmup", "syllable-rules", "connection-errors", "sentence-reading"]
);

const expectedWarmupSourceIds = ["ba", "pa", "ta", "na", "la", "ma", "be-e", "pe-e", "te-e", "ne-e"];
assert.deepEqual(
  JSON.parse(JSON.stringify(data.twoLetterItems.map((item) => item.sourceComboId))),
  expectedWarmupSourceIds
);
assert.equal(new Set(data.twoLetterItems.map((item) => item.id)).size, 10, "warmup ids should be unique");

const expectedRuleIds = [
  "vowel-nucleus",
  "single-consonant-boundary",
  "two-consonant-boundary",
  "suffix-boundary"
];
assert.deepEqual(JSON.parse(JSON.stringify(data.rules.map((rule) => rule.id))), expectedRuleIds);
assert.ok(data.rules.every((rule) => rule.exercises.length === 4), "every beginner strategy should have four immediate exercises");
assert.ok(
  data.rules.every((rule) => /\u8303围|\u4f8b\u5916|\u4e0d\u80fd|\u4e0d\u603b\u662f/u.test(`${rule.scope} ${rule.explanation}`)),
  "every strategy should disclose its learning scope or exceptions"
);
assert.equal(
  new Set(data.rules.flatMap((rule) => rule.exercises.map((exercise) => exercise.id))).size,
  16,
  "all rule exercise ids should be unique"
);

assert.equal(data.connectionItems.length, 12, "connection practice should contain six connection and six break judgments");
assert.equal(data.connectionItems.filter((item) => item.mistakeBucket === "connection").length, 6);
assert.equal(data.connectionItems.filter((item) => item.mistakeBucket === "break").length, 6);
assert.ok(
  data.connectionItems.every((item) => item.interaction === "statement-judgment"),
  "connection practice should use textual judgments"
);
assert.ok(
  data.connectionItems.every((item) => item.distractor.startsWith("错误判断：")),
  "connection distractors should be statements rather than fabricated glyphs"
);
const expectedConnectionStatements = [
  ["connection-01", "开头 ب 与后面的 ا 连接。", "statement-correct", "approved"],
  ["connection-02", "م 与 ا 之间应断开。", "statement-incorrect", "approved"],
  ["connection-03", "第一个 ن 与后面的 ا 连接。", "statement-correct", "approved"],
  ["connection-04", "ت 与 ا 之间应断开。", "statement-incorrect", "approved"],
  ["connection-05", "ب 与 ە 连接；ە 后不继续连接 ل。", "statement-correct", "approved"],
  ["connection-06", "ك 与 ە 之间应断开。", "statement-incorrect", "approved"],
  ["break-01", "د 后不继续连接后一个字母。", "statement-correct", "approved"],
  ["break-02", "ر 或 ە 后应继续连接。", "statement-incorrect", "approved"],
  ["break-03", "ى 后不继续连接最后的 ز。", "statement-correct", "approved"],
  ["break-04", "ۋ 和 ە 后都无需重启后面的字母。", "statement-incorrect", "approved"],
  ["break-05", "ۋ 后不继续连接后面的字母。", "statement-correct", "approved"],
  ["break-06", "ۆ 后应继续连接 گ。", "statement-incorrect", "approved"]
];
assert.deepEqual(
  JSON.parse(JSON.stringify(data.connectionItems.map((item) => [
    item.id,
    item.statement,
    item.expectedAnswer,
    item.statementReviewStatus
  ]))),
  expectedConnectionStatements,
  "every textual judgment should lock an independently reviewed learner statement and answer"
);
for (const bucketName of ["connection", "break"]) {
  const bucketItems = data.connectionItems.filter((item) => item.mistakeBucket === bucketName);
  assert.equal(bucketItems.filter((item) => item.expectedAnswer === "statement-correct").length, 3);
  assert.equal(bucketItems.filter((item) => item.expectedAnswer === "statement-incorrect").length, 3);
}

const expectedSentenceSources = [
  "sentence-who-what-1",
  "sentence-this-that-1",
  "sentence-i-you-3",
  "sentence-have-1",
  "sentence-like-need-3",
  "sentence-like-need-4"
];
assert.deepEqual(
  JSON.parse(JSON.stringify(data.sentences.map((sentence) => sentence.sourceReadingItemId))),
  expectedSentenceSources
);
assert.equal(data.sentences.flatMap((sentence) => sentence.syllables).length, 29, "six sentences should contain 29 reviewed text segments");
for (const sentence of data.sentences) {
  assert.equal(sentence.reviewStatus, "approved", `${sentence.id} text should meet the accepted publication criteria`);
  assert.equal(sentence.reviewedBy, "产品负责人验收标准 + 项目来源与数据校验");
  assert.equal(sentence.reviewedAt, "2026-08-09");
  assert.equal(sentence.wholeAudioStatus, "available", `${sentence.id} should reuse an existing whole-sentence recording`);
  assert.match(sentence.audioPath, /^\.\/assets\/audio\/human\/reading\/human_reading_[a-z0-9_]+\.webm$/u);
  assert.equal(
    sentence.standard.replace(/[\s.?؟،]/gu, ""),
    sentence.syllables.map((part) => part.text).join("").replace(/[\s.?؟،]/gu, ""),
    `${sentence.id} syllable text should rejoin to the unchanged standard sentence`
  );
  for (const part of sentence.syllables) {
    assert.deepEqual(
      Object.keys(part).sort(),
      ["endMs", "latin", "reviewStatus", "segmentStatus", "startMs", "text"].sort(),
      `${sentence.id} segment fields should follow the strict schema`
    );
    assert.equal(part.startMs, null, `${sentence.id} should not guess a segment start`);
    assert.equal(part.endMs, null, `${sentence.id} should not guess a segment end`);
    assert.equal(part.segmentStatus, "unavailable", `${sentence.id} segment playback should stay disabled`);
    assert.equal(part.reviewStatus, "pending-listening", `${sentence.id} segment timing should await actual listening`);
  }
}

assert.equal(data.review.reviewStatus, "approved", "text publication should record the product-owner decision");
assert.equal(data.review.reviewedBy, "产品负责人验收标准 + 项目来源与数据校验");
assert.equal(data.review.segmentTimingStatus, "pending-listening");
assert.equal(/native|\u6bcd\u8bed\u5ba1\u6821\u4eba/u.test(data.review.reviewedBy), false, "metadata should not fabricate a native-review identity");

for (const item of data.twoLetterItems) {
  assert.ok(fs.existsSync(`prototype/${item.audioPath.slice(2)}`), `${item.id} should map to an existing human combo recording`);
}
for (const sentence of data.sentences) {
  assert.ok(fs.existsSync(`prototype/${sentence.audioPath.slice(2)}`), `${sentence.id} should map to an existing human sentence recording`);
}

function runScript(scriptPath, targetContext) {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), targetContext, { filename: scriptPath });
}

function createAggregateContext({ includeSyllable }) {
  const aggregateContext = { console, window: {} };
  aggregateContext.globalThis = aggregateContext;
  vm.createContext(aggregateContext);
  for (const scriptPath of [
    "prototype/uly-transliteration.js",
    "prototype/course-data/alphabet-data.js",
    "prototype/course-data/latin-writing-data.js",
    "prototype/course-data/combo-data.js"
  ]) runScript(scriptPath, aggregateContext);
  if (includeSyllable) runScript(modulePath, aggregateContext);
  for (const scriptPath of [
    "prototype/course-data/vocab-data.js",
    "prototype/course-data/practice-data.js",
    "prototype/course-data/reading-data.js"
  ]) runScript(scriptPath, aggregateContext);
  return aggregateContext;
}

const missingDependencyContext = createAggregateContext({ includeSyllable: false });
assert.throws(
  () => runScript("prototype/course-data.js", missingDependencyContext),
  /ANA_TILIM_SYLLABLE failed to load/,
  "the real course aggregator should reject a missing syllable module"
);

const aggregateContext = createAggregateContext({ includeSyllable: true });
runScript("prototype/course-data.js", aggregateContext);
assert.equal(
  aggregateContext.window.ANA_TILIM_COURSE.syllableTraining.unit.id,
  "syllable-training",
  "the real course aggregator should expose the reviewed syllable data"
);

const aggregateCourse = aggregateContext.window.ANA_TILIM_COURSE;
const comboEntries = aggregateCourse.comboGroups.flatMap((group) => group.items.map((item) => ({ ...item, groupId: group.id })));
const readingEntries = aggregateCourse.readingUnits.flatMap((unit) =>
  (unit.groups || []).flatMap((group) => (group.items || []).map((item) => ({ ...item, unitId: unit.id, groupId: group.id })))
);
const comboById = new Map(comboEntries.map((item) => [item.id, item]));
const readingById = new Map(readingEntries.map((item) => [item.id, item]));
const comboManifestById = new Map(
  JSON.parse(fs.readFileSync("prototype/assets/audio/human/combos/manifest.json", "utf8")).items.map((item) => [item.id, item])
);
const readingManifestById = new Map(
  JSON.parse(fs.readFileSync("prototype/assets/audio/human/reading/manifest.json", "utf8")).items.map((item) => [item.id, item])
);

function assertSourceBindings(candidate) {
  for (const item of candidate.twoLetterItems) {
    const source = comboById.get(item.sourceComboId);
    assert.ok(source, `${item.id} should resolve its real combo source`);
    assert.equal(item.standard, source.value, `${item.id} should preserve its real combo spelling`);
    assert.deepEqual([...item.parts], [...source.parts], `${item.id} should preserve its real combo parts`);
    assert.equal(item.latin, source.latin, `${item.id} should preserve its real combo ULY`);
    assert.equal(item.audioPath, comboManifestById.get(item.sourceComboId)?.outputPath, `${item.id} should use the exact manifest audio for its stable combo ID`);
  }

  for (const item of candidate.connectionItems) {
    const source = comboById.get(item.sourceComboId);
    assert.ok(source, `${item.id} should resolve its real combo source`);
    assert.equal(
      source.groupId,
      item.mistakeBucket === "connection" ? "three-step" : "connection-breaks",
      `${item.id} should stay in the correct connection source group`
    );
    assert.equal(item.standard, source.value, `${item.id} should preserve its real combo spelling`);
  }

  for (const rule of candidate.rules) {
    for (const exercise of rule.exercises) {
      const source = comboById.get(exercise.sourceId) || readingById.get(exercise.sourceId);
      assert.ok(source, `${exercise.id} should resolve its stable source ID`);
      const promptTargets = exercise.prompt.match(/[\u0620-\u06ff]+/gu) || [];
      assert.ok(promptTargets.length > 0, `${exercise.id} should name its Uyghur target in the prompt`);
      assert.ok(
        promptTargets.every((target) => source.value.includes(target)),
        `${exercise.id} target text should come from its stable source spelling`
      );
    }
  }

  for (const sentence of candidate.sentences) {
    const source = readingById.get(sentence.sourceReadingItemId);
    assert.ok(source, `${sentence.id} should resolve its real reading source`);
    assert.equal(sentence.standard, source.value, `${sentence.id} should preserve its real reading spelling`);
    assert.equal(sentence.meaning, source.meaning, `${sentence.id} should preserve its real reading meaning`);
    assert.equal(
      sentence.audioPath,
      readingManifestById.get(sentence.sourceReadingItemId)?.outputPath,
      `${sentence.id} should use the exact manifest audio for its stable reading ID`
    );
  }
}

assert.doesNotThrow(() => assertSourceBindings(data), "published syllable data should remain bound to the real course and audio sources");
const driftedSourceCopy = JSON.parse(JSON.stringify(data));
driftedSourceCopy.sentences[0].standard = driftedSourceCopy.sentences[1].standard;
assert.throws(
  () => assertSourceBindings(driftedSourceCopy),
  /should preserve its real reading spelling/,
  "the source-binding regression should detect a plausible copy/paste drift"
);

const indexHtml = fs.readFileSync("prototype/index.html", "utf8");
const comboScriptIndex = indexHtml.indexOf("./course-data/combo-data.js");
const syllableScriptIndex = indexHtml.indexOf("./course-data/syllable-data.js");
const vocabScriptIndex = indexHtml.indexOf("./course-data/vocab-data.js");
const aggregatorScriptIndex = indexHtml.indexOf("./course-data.js");
assert.ok(
  comboScriptIndex >= 0
    && comboScriptIndex < syllableScriptIndex
    && syllableScriptIndex < vocabScriptIndex
    && vocabScriptIndex < aggregatorScriptIndex,
  "the browser should load syllable data after combos and before downstream data and aggregation"
);

function cloneData() {
  return JSON.parse(JSON.stringify(data));
}

assert.doesNotThrow(() => api.validateSyllableTraining(cloneData()), "the published data should satisfy its own validator");

const duplicateIds = cloneData();
duplicateIds.rules[1].exercises[0].id = duplicateIds.rules[0].exercises[0].id;
assert.throws(
  () => api.validateSyllableTraining(duplicateIds),
  /duplicate.*id/i,
  "validator should reject duplicate content ids"
);

const mismatchedSplit = cloneData();
mismatchedSplit.sentences[0].syllables[0].text = "不匹配";
assert.throws(
  () => api.validateSyllableTraining(mismatchedSplit),
  /rejoin|standard/i,
  "validator should reject a sentence whose segments no longer rejoin to its standard spelling"
);

const mismatchedSource = cloneData();
mismatchedSource.sentences[0].sourceReadingItemId = "sentence-unknown";
assert.throws(
  () => api.validateSyllableTraining(mismatchedSource),
  /sourceReadingItemId/i,
  "validator should reject a sentence source outside the reviewed stable-id contract"
);

const unsafePresentation = cloneData();
unsafePresentation.connectionItems[0].statement += "\u200d";
assert.throws(
  () => api.validateSyllableTraining(unsafePresentation),
  /unsafe.*character/i,
  "validator should reject hidden or presentation characters in textual judgments"
);

const invalidExpectedAnswer = cloneData();
invalidExpectedAnswer.connectionItems[0].expectedAnswer = "always-false";
assert.throws(
  () => api.validateSyllableTraining(invalidExpectedAnswer),
  /connection-01\.expectedAnswer is invalid/i,
  "validator should reject an answer outside the reviewed two-option contract"
);

const driftedApprovedStatement = cloneData();
driftedApprovedStatement.connectionItems[0].statement = "开头 ب 与后面的 ا 应断开。";
assert.throws(
  () => api.validateSyllableTraining(driftedApprovedStatement),
  /connection-01 must match the published statement contract/i,
  "validator should reject a plausible but unreviewed learner-facing statement"
);

const imbalancedExpectedAnswers = cloneData();
imbalancedExpectedAnswers.connectionItems[0].expectedAnswer = "statement-incorrect";
assert.throws(
  () => api.validateSyllableTraining(imbalancedExpectedAnswers),
  /connection items must keep three correct and three incorrect statements per bucket/i,
  "validator should reject an answer flip that breaks the reviewed three-to-three bucket balance"
);

const balancedButFlippedExpectedAnswers = cloneData();
balancedButFlippedExpectedAnswers.connectionItems[0].expectedAnswer = "statement-incorrect";
balancedButFlippedExpectedAnswers.connectionItems[1].expectedAnswer = "statement-correct";
assert.throws(
  () => api.validateSyllableTraining(balancedButFlippedExpectedAnswers),
  /connection-01 must match the published statement contract/i,
  "validator should reject answer swaps even when the overall bucket balance still looks valid"
);

const unapprovedStatement = cloneData();
unapprovedStatement.connectionItems[0].statementReviewStatus = "pending";
assert.throws(
  () => api.validateSyllableTraining(unapprovedStatement),
  /connection-01\.statementReviewStatus must be approved/i,
  "validator should reject a learner-facing statement that has not met the publication decision"
);

const unreviewedTimestamp = cloneData();
unreviewedTimestamp.sentences[0].syllables[0].startMs = 0;
unreviewedTimestamp.sentences[0].syllables[0].endMs = 120;
assert.throws(
  () => api.validateSyllableTraining(unreviewedTimestamp),
  /timestamp.*null/i,
  "validator should reject non-null timestamps while segment review is pending"
);

const unexpectedField = cloneData();
unexpectedField.sentences[0].syllables[0].guessedDuration = 120;
assert.throws(
  () => api.validateSyllableTraining(unexpectedField),
  /unexpected.*field/i,
  "validator should reject fields outside the strict segment schema"
);

const unexpectedTopLevel = cloneData();
unexpectedTopLevel.futureSection = {};
assert.throws(
  () => api.validateSyllableTraining(unexpectedTopLevel),
  /syllable training data contains an unexpected field/i,
  "validator should reject top-level fields outside the published schema"
);

const missingWarmupAudio = cloneData();
missingWarmupAudio.twoLetterItems[0].audioPath = "";
assert.throws(
  () => api.validateSyllableTraining(missingWarmupAudio),
  /warmup-ba\.audioPath must be non-empty text/i,
  "validator should reject a warmup without its stable human recording"
);

const unapprovedExercise = cloneData();
unapprovedExercise.rules[0].exercises[0].reviewStatus = "pending";
assert.throws(
  () => api.validateSyllableTraining(unapprovedExercise),
  /vowel-nucleus-01\.reviewStatus must be approved/i,
  "validator should reject an unapproved rule exercise"
);

const unapprovedConnection = cloneData();
unapprovedConnection.connectionItems[0].reviewStatus = "pending";
assert.throws(
  () => api.validateSyllableTraining(unapprovedConnection),
  /connection-01\.reviewStatus must be approved/i,
  "validator should reject an unapproved connection judgment"
);

const fabricatedReviewer = cloneData();
fabricatedReviewer.review.reviewedBy = "native reviewer";
assert.throws(
  () => api.validateSyllableTraining(fabricatedReviewer),
  /review\.reviewedBy must match the product-owner decision/i,
  "validator should reject a fabricated reviewer identity"
);

const prematureSegment = cloneData();
prematureSegment.sentences[0].syllables[0].segmentStatus = "available";
prematureSegment.sentences[0].syllables[0].reviewStatus = "approved";
prematureSegment.sentences[0].syllables[0].startMs = 0;
prematureSegment.sentences[0].syllables[0].endMs = 120;
assert.throws(
  () => api.validateSyllableTraining(prematureSegment),
  /segment must remain unavailable with null timestamps/i,
  "validator should reject timestamps that have not passed the independent listening gate"
);

const renamedWarmup = cloneData();
renamedWarmup.twoLetterItems[0].id = "warmup-renamed";
assert.throws(
  () => api.validateSyllableTraining(renamedWarmup),
  /warmup item ids must match the published stable-id contract/i,
  "validator should preserve every published warmup item ID"
);

const renamedExercise = cloneData();
renamedExercise.rules[0].exercises[0].id = "exercise-renamed";
assert.throws(
  () => api.validateSyllableTraining(renamedExercise),
  /exercise ids must match the published stable-id contract/i,
  "validator should preserve all sixteen published exercise IDs"
);

const remappedConnection = cloneData();
remappedConnection.connectionItems[0].sourceComboId = "man";
remappedConnection.connectionItems[0].standard = "مان";
assert.throws(
  () => api.validateSyllableTraining(remappedConnection),
  /connection source ids must match the published stable-id contract/i,
  "validator should not silently remap a judgment to another real combo"
);

const remappedSentence = cloneData();
Object.assign(remappedSentence.sentences[0], {
  sourceReadingItemId: remappedSentence.sentences[1].sourceReadingItemId,
  standard: remappedSentence.sentences[1].standard,
  meaning: remappedSentence.sentences[1].meaning,
  latin: remappedSentence.sentences[1].latin,
  audioPath: remappedSentence.sentences[1].audioPath,
  syllables: remappedSentence.sentences[1].syllables
});
assert.throws(
  () => api.validateSyllableTraining(remappedSentence),
  /sentence source ids must match the published stable-id contract/i,
  "validator should not silently remap a stable sentence item ID"
);

console.log("syllable training course data checks passed");
