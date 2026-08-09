import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const modulePaths = [
  "prototype/course-data/afanti-data.js",
  "prototype/course-data/afanti-english-data.js",
  "prototype/afanti-content.js"
];

for (const modulePath of modulePaths) {
  assert.ok(fs.existsSync(modulePath), `${modulePath} should exist`);
}

const context = { console, window: {} };
context.globalThis = context;
vm.createContext(context);
for (const modulePath of modulePaths) {
  vm.runInContext(fs.readFileSync(modulePath, "utf8"), context, { filename: modulePath });
}

const shared = context.window.ANA_TILIM_AFANTI_DATA;
const english = context.window.ANA_TILIM_AFANTI_ENGLISH;
const api = context.window.ANA_TILIM_AFANTI_CONTENT;
const storyIds = [
  "listen-before-judge",
  "fair-bowl-water",
  "unverified-words",
  "precious-time",
  "neighbors-tree",
  "wisdom-not-advantage"
];

assert.ok(shared, "shared Afanti data should load");
assert.ok(english, "global-only English Afanti data should load");
assert.ok(api, "Afanti publication validator should load");
assert.deepEqual(JSON.parse(JSON.stringify(shared.stories.map((story) => story.id))), storyIds);
assert.deepEqual(
  JSON.parse(JSON.stringify(shared.stories.map((story) => story.wordRange))),
  [[60, 80], [70, 90], [80, 100], [90, 110], [100, 130], [120, 150]]
);
assert.deepEqual(JSON.parse(JSON.stringify(shared.stories.map((story) => story.actualWordCount))), [63, 70, 85, 93, 107, 145]);
assert.deepEqual(
  JSON.parse(JSON.stringify(shared.stories.map((story) => story.title.zh))),
  ["先听完再判断", "公平的一碗水", "没有证据的话", "最珍贵的时间", "邻居们的一棵树", "聪明不是占便宜"],
  "course chooser titles should match the product-owner approved six-story list"
);
assert.ok(shared.stories.every((story) => story.noAudio === true), "all six stories should explicitly opt out of audio");
assert.ok(shared.stories.every((story) => story.uyghur?.paragraphs?.length > 0), "all six stories should include Uyghur paragraphs");
assert.ok(shared.stories.every((story) => story.latin?.paragraphs?.length === story.uyghur.paragraphs.length), "ULY paragraphs should align with Uyghur");
assert.ok(shared.stories.every((story) => story.zh?.paragraphs?.length === story.uyghur.paragraphs.length), "Chinese paragraphs should align with Uyghur");
assert.ok(shared.stories.every((story) => !Object.hasOwn(story, "en")), "shared stories must not embed global-only English");
assert.deepEqual(Object.keys(english.byStoryId), storyIds, "English data should cover the same six stable IDs in order");

for (const story of shared.stories) {
  assert.equal(story.sequence, storyIds.indexOf(story.id) + 1, `${story.id} should keep its approved sequence`);
  assert.equal(story.question.uyghur.choices.length, 3, `${story.id} should keep three comprehension choices`);
  assert.equal(new Set(story.question.uyghur.choices.map((choice) => choice.id)).size, 3, `${story.id} choice IDs should be unique`);
  assert.ok(story.question.uyghur.choices.some((choice) => choice.id === story.question.answerId), `${story.id} answerId should exist`);
  assert.deepEqual(
    [story.review.uyghurLanguage, story.review.translationMeaning, story.review.educationAndCulture, story.review.originality],
    ["approved", "approved", "approved", "approved"],
    `${story.id} should keep all four product-owner approvals`
  );
  assert.equal(story.review.reviewedBy, "user-product-owner-confirmation");
  assert.equal(story.review.reviewedAt, "2026-08-10");
}

const cnStories = api.publishableStories(shared.stories, null, { edition: "cn" });
const globalStories = api.publishableStories(shared.stories, english.byStoryId, { edition: "global" });
assert.equal(cnStories.length, 6, "domestic publication should accept all six shared stories without English");
assert.equal(globalStories.length, 6, "global publication should require and accept all six English stories");
assert.ok(cnStories.every((story) => !Object.hasOwn(story, "en")), "domestic publication must not add an empty English field");
assert.ok(globalStories.every((story) => story.en?.paragraphs?.length === story.uyghur.paragraphs.length), "global publication should attach aligned English");

const clone = (value) => JSON.parse(JSON.stringify(value));
const badAudio = clone(shared.stories);
badAudio[0].noAudio = false;
assert.throws(() => api.publishableStories(badAudio, null, { edition: "cn" }), /listen-before-judge.*noAudio/);
const badReview = clone(shared.stories);
badReview[1].review.translationMeaning = "pending";
assert.throws(() => api.publishableStories(badReview, null, { edition: "cn" }), /fair-bowl-water.*translationMeaning/);
const badChoice = clone(shared.stories);
badChoice[2].question.answerId = "missing";
assert.throws(() => api.publishableStories(badChoice, null, { edition: "cn" }), /unverified-words.*answerId/);
const badEnglish = clone(english.byStoryId);
delete badEnglish["precious-time"];
assert.throws(() => api.publishableStories(shared.stories, badEnglish, { edition: "global" }), /precious-time.*English/);

const widenedApprovedRange = clone(shared.stories);
widenedApprovedRange[0].wordRange = [0, 999];
assert.throws(
  () => api.publishableStories(widenedApprovedRange, null, { edition: "cn" }),
  /listen-before-judge.*wordRange/,
  "published stories must keep the approved word range for each stable ID"
);

const appendedAlignedParagraph = clone(shared.stories);
for (const language of ["uyghur", "latin", "zh"]) {
  appendedAlignedParagraph[0][language].paragraphs.push(
    language === "uyghur" ? "بۇ تەستىقلانمىغان قوشۇمچە ئابزاس." : "Unapproved extra paragraph."
  );
}
appendedAlignedParagraph[0].actualWordCount = appendedAlignedParagraph[0].uyghur.paragraphs
  .join(" ")
  .trim()
  .split(/\s+/u)
  .filter(Boolean).length;
assert.throws(
  () => api.publishableStories(appendedAlignedParagraph, null, { edition: "cn" }),
  /listen-before-judge.*paragraphs/,
  "published stories must keep the approved paragraph count for each stable ID"
);

const indexHtml = fs.readFileSync("prototype/index.html", "utf8");
const sharedDataIndex = indexHtml.indexOf("./course-data/afanti-data.js");
const englishDataIndex = indexHtml.indexOf("./course-data/afanti-english-data.js");
const validatorIndex = indexHtml.indexOf("./afanti-content.js");
const aggregatorIndex = indexHtml.indexOf("./course-data.js");
assert.ok(sharedDataIndex >= 0, "global index should load shared Afanti data");
assert.ok(englishDataIndex > sharedDataIndex, "global index should load English after shared Afanti data");
assert.ok(validatorIndex > englishDataIndex, "global index should load the Afanti validator after both data files");
assert.ok(aggregatorIndex > validatorIndex, "global index should load the course aggregator after Afanti validation dependencies");

const { EDITION_CORE_FILES } = await import("../scripts/edition-core-files.mjs");
assert.ok(EDITION_CORE_FILES.includes("course-data/afanti-data.js"), "domestic sync should include shared Afanti data");
assert.ok(EDITION_CORE_FILES.includes("afanti-content.js"), "domestic sync should include the shared validator");
assert.ok(!EDITION_CORE_FILES.includes("course-data/afanti-english-data.js"), "domestic sync must exclude global-only English data");

console.log("Afanti content checks passed");
