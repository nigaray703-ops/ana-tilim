import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { validateWebmBuffer } from "../tools/lib/webm-audio.mjs";

const manifestPath = "prototype/assets/audio/human/alphabet/manifest.json";
const comboManifestPath = "prototype/assets/audio/human/combos/manifest.json";
const vocabManifestPath = "prototype/assets/audio/human/vocab/manifest.json";
const practiceManifestPath = "prototype/assets/audio/human/practice/manifest.json";
const readingManifestPath = "prototype/assets/audio/human/reading/manifest.json";
const formExampleManifestPath = "prototype/assets/audio/human/form-examples/manifest.json";

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const comboManifest = JSON.parse(fs.readFileSync(comboManifestPath, "utf8"));
const vocabManifest = JSON.parse(fs.readFileSync(vocabManifestPath, "utf8"));
const practiceManifest = JSON.parse(fs.readFileSync(practiceManifestPath, "utf8"));
assert.ok(fs.existsSync(readingManifestPath), "reading human audio manifest should exist");
const readingManifest = JSON.parse(fs.readFileSync(readingManifestPath, "utf8"));
assert.ok(fs.existsSync(formExampleManifestPath), "form example human audio manifest should exist");
const formExampleManifest = fs.existsSync(formExampleManifestPath)
  ? JSON.parse(fs.readFileSync(formExampleManifestPath, "utf8"))
  : { items: [] };
const audioManifests = [
  { manifest, manifestPath },
  { manifest: comboManifest, manifestPath: comboManifestPath },
  { manifest: vocabManifest, manifestPath: vocabManifestPath },
  { manifest: practiceManifest, manifestPath: practiceManifestPath },
  { manifest: readingManifest, manifestPath: readingManifestPath },
  { manifest: formExampleManifest, manifestPath: formExampleManifestPath }
];

function loadCourseData() {
  const dataContext = {
    console,
    window: {}
  };
  dataContext.globalThis = dataContext;
  vm.createContext(dataContext);

  for (const scriptPath of [
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
    vm.runInContext(fs.readFileSync(scriptPath, "utf8"), dataContext, { filename: scriptPath });
  }

  return dataContext.window.ANA_TILIM_COURSE;
}

const courseData = loadCourseData();
const comboItems = courseData.comboGroups.flatMap((group) => group.items);
const comboItemCount = comboItems.length;
const vocabItemCount = courseData.vocabGroups.flatMap((group) => group.items).length;
const comboManifestIds = new Set(comboManifest.items.map((item) => item.id));
const vocabManifestIds = new Set(vocabManifest.items.map((item) => item.id));
const vocabManifestAliases = vocabManifest.aliases || [];
const vocabRecordedIds = new Set([
  ...vocabManifest.items.map((item) => item.id),
  ...vocabManifestAliases.map((item) => item.id)
]);
const expectedVocabAudioAliases = [
  { id: "ten-tens", sourceId: "ten" },
  { id: "yuz-body", sourceId: "hundred" },
  { id: "may-food", sourceId: "may-month" },
  { id: "beliq-food", sourceId: "beliq-animal" }
];

assert.equal(manifest.items.length, 32, "human audio manifest should cover all 32 letters");
assert.equal(comboManifest.items.length, 34, "combo human audio manifest should cover all combo items");
assert.equal(comboItemCount - comboManifest.items.length, 0, "all combo examples should have connected recordings");
assert.ok(
  comboManifest.items.every((item) => comboItems.some((comboItem) => comboItem.id === item.id)),
  "combo manifest items should still point to active combo lessons"
);
assert.ok(comboItems.every((item) => comboManifestIds.has(item.id)), "every combo lesson should have connected audio");
assert.deepEqual(
  vocabManifestAliases,
  expectedVocabAudioAliases,
  "identical vocabulary spellings should reuse one retained human recording"
);
assert.equal(vocabItemCount - vocabRecordedIds.size, 0, "every vocabulary item should have connected audio");
assert.equal(practiceManifest.items.length, 0, "practice should reuse alphabet audio instead of duplicate files");
assert.equal(readingManifest.items.length, 164, "reading human audio manifest should cover every reading line");
assert.equal(formExampleManifest.items.length, 94, "form example human audio manifest should cover every newly recorded example");

function stableFormExampleKey(value) {
  let hash = 2166136261;
  for (const character of value.normalize("NFC")) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function sourceFormExamples(course) {
  const byValue = new Map();
  for (const letter of Object.values(course.letterDetails)) {
    for (const example of letter.formExamples || []) {
      if (!example.word) continue;
      const current = byValue.get(example.word);
      if (current) {
        current.latin ||= example.latin || "";
        continue;
      }
      byValue.set(example.word, { id: `form-example-${stableFormExampleKey(example.word)}`, latin: example.latin || "未提供转写" });
    }
  }
  const reusableValues = new Set([...course.comboGroups, ...course.vocabGroups].flatMap((group) => group.items.map((item) => item.value)));
  return [...byValue.entries()]
    .filter(([value]) => !reusableValues.has(value))
    .map(([, item]) => item);
}

const canonicalFormExamples = sourceFormExamples(courseData);
const canonicalFormLatinById = new Map(canonicalFormExamples.map((item) => [item.id, item.latin]));
const formLatinMismatches = formExampleManifest.items
  .filter((item) => canonicalFormLatinById.get(item.id) !== item.latin)
  .map((item) => ({ id: item.id, manifestLatin: item.latin, canonicalLatin: canonicalFormLatinById.get(item.id) }));
assert.equal(canonicalFormExamples.length, 94, "current course data should derive the same 94 dedicated form examples");
assert.deepEqual(formLatinMismatches, [], `form example manifest latin drift: ${JSON.stringify(formLatinMismatches)}`);
assert.equal(new Set(manifest.items.map((item) => item.file)).size, 32, "audio filenames should be unique");
assert.equal(new Set(comboManifest.items.map((item) => item.file)).size, comboManifest.items.length, "combo audio filenames should be unique");
assert.equal(new Set(vocabManifest.items.map((item) => item.file)).size, vocabManifest.items.length, "vocab audio filenames should be unique");
assert.equal(new Set(readingManifest.items.map((item) => item.file)).size, readingManifest.items.length, "reading audio filenames should be unique");
assert.equal(
  new Set(formExampleManifest.items.map((item) => item.file)).size,
  formExampleManifest.items.length,
  "form example audio filenames should be unique"
);
assert.ok(vocabManifestIds.has("korushkunche"), "corrected see-you vocabulary should use its new recording");
assert.ok(vocabManifestIds.has("polu-food"), "corrected polo vocabulary should use its new recording");
assert.ok(vocabManifestIds.has("dereze-home"), "window vocabulary should use its new recording");
assert.ok(vocabManifestIds.has("stol-home"), "corrected table vocabulary should use its new recording");
assert.equal(practiceManifest.status, "reuses_alphabet_human_audio", "practice manifest should document alphabet audio reuse");
assert.ok(
  manifest.items.every((item) => item.file.startsWith("human_letter_") && item.file.endsWith(".webm")),
  "letter audio files should use the connected human webm naming rule"
);
assert.ok(
  manifest.items.every((item) => item.outputPath.startsWith("./assets/audio/human/alphabet/")),
  "letter audio output paths should stay in the human alphabet folder"
);
for (const { manifest: audioManifest, manifestPath: audioManifestPath } of audioManifests) {
  const audioDirectory = audioManifestPath.slice(0, audioManifestPath.lastIndexOf("/") + 1);
  const directoryAudioFiles = fs.readdirSync(audioDirectory).filter((file) => file.endsWith(".webm")).sort();
  const manifestAudioFiles = audioManifest.items.map((item) => item.file).sort();
  assert.deepEqual(
    directoryAudioFiles,
    manifestAudioFiles,
    `${audioManifestPath} should list every retained WebM file and no deleted file`
  );
  for (const item of audioManifest.items) {
    const audioPath = `${audioDirectory}${item.file}`;
    assert.ok(fs.existsSync(audioPath), `${item.file} should exist`);
    assert.ok(fs.statSync(audioPath).size > 4096, `${item.file} should contain playable audio data`);
    const audioBuffer = fs.readFileSync(audioPath);
    try {
      validateWebmBuffer(audioBuffer);
    } catch (error) {
      assert.fail(`${item.file}: ${error.message}`);
    }
  }
}
function makeElement(id) {
  return {
    id,
    innerHTML: "",
    textContent: "",
    dataset: {},
    classList: { add() {}, remove() {} },
    querySelector() {
      return null;
    },
    closest() {
      return null;
    },
    addEventListener() {}
  };
}

const app = makeElement("app");
const toast = makeElement("toast");
const context = {
  console,
  document: {
    documentElement: { lang: "" },
    querySelector(selector) {
      if (selector === "#app") return app;
      if (selector === "#toast") return toast;
      return null;
    },
    addEventListener() {}
  },
  window: {
    navigator: { languages: ["en-NZ"], language: "en-NZ" },
    setTimeout() {
      return 1;
    },
    clearTimeout() {}
  },
  Audio: function FakeAudio(src) {
    this.src = src;
    this.play = () => Promise.resolve();
  }
};

context.globalThis = context;
vm.createContext(context);
for (const scriptPath of [
  "prototype/app-config.js",
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
  "prototype/afanti-content.js"
]) {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), context, { filename: scriptPath });
}
vm.runInContext(fs.readFileSync("prototype/course-data.js", "utf8"), context, { filename: "prototype/course-data.js" });
vm.runInContext(fs.readFileSync("prototype/unit-order.js", "utf8"), context, { filename: "prototype/unit-order.js" });
vm.runInContext(fs.readFileSync("prototype/uyghur-keyboard.js", "utf8"), context, { filename: "prototype/uyghur-keyboard.js" });
vm.runInContext(fs.readFileSync("prototype/latin-keyboard.js", "utf8"), context, { filename: "prototype/latin-keyboard.js" });
vm.runInContext(fs.readFileSync("prototype/sentence-morphemes.js", "utf8"), context, { filename: "prototype/sentence-morphemes.js" });
vm.runInContext(fs.readFileSync("prototype/sentence-glossary.js", "utf8"), context, { filename: "prototype/sentence-glossary.js" });
vm.runInContext(fs.readFileSync("prototype/progress-transfer.js", "utf8"), context, { filename: "prototype/progress-transfer.js" });
vm.runInContext(fs.readFileSync("prototype/feedback.js", "utf8"), context, { filename: "prototype/feedback.js" });
for (const scriptPath of [
  "prototype/i18n/ui-messages.js",
  "prototype/i18n/alphabet-en.js",
  "prototype/i18n/combo-en.js",
  "prototype/i18n/vocab-en.js",
  "prototype/i18n/practice-en.js",
  "prototype/i18n/reading-en.js",
  "prototype/i18n/course-en.js"
]) {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), context, { filename: scriptPath });
}
vm.runInContext(fs.readFileSync("prototype/i18n/runtime.js", "utf8"), context, { filename: "prototype/i18n/runtime.js" });
vm.runInContext(fs.readFileSync("prototype/app.js", "utf8"), context, { filename: "prototype/app.js" });

assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(syllableTraining.sentences.map((sentence) => [sentence.id, sentence.standard, sentence.latin, sentence.sourceReadingItemId, syllableSentenceSource(sentence).outputPath]))", context)),
  [
    ["syllable-sentence-01", "بۇ كىم؟", "Bu kim?", "sentence-who-what-1", "./assets/audio/human/reading/human_reading_sentence_who_what_1.webm"],
    ["syllable-sentence-02", "بۇ قەلەم.", "Bu qe-lem.", "sentence-this-that-1", "./assets/audio/human/reading/human_reading_sentence_this_that_1.webm"],
    ["syllable-sentence-03", "ئۇ دوختۇر.", "U dox-tur.", "sentence-i-you-3", "./assets/audio/human/reading/human_reading_sentence_i_you_3.webm"],
    ["syllable-sentence-04", "مەندە قەلەم بار.", "Men-de qe-lem bar.", "sentence-have-1", "./assets/audio/human/reading/human_reading_sentence_have_1.webm"],
    ["syllable-sentence-05", "مەن چاي ئىچىمەن.", "Men chay i-chi-men.", "sentence-like-need-3", "./assets/audio/human/reading/human_reading_sentence_like_need_3.webm"],
    ["syllable-sentence-06", "مەن ئانا تىلىمنى ياخشى كۆرىمەن.", "Men a-na ti-lim-ni yax-shi kö-ri-men.", "sentence-like-need-4", "./assets/audio/human/reading/human_reading_sentence_like_need_4.webm"]
  ],
  "sentence reading must retain the exact approved standard, ULY, source ID, and existing human recording path"
);

const coverageCategories = JSON.parse(
  vm.runInContext("JSON.stringify(audioCoverageCategories())", context)
);
const expectedAudioCoverage = {
  alphabet: { total: 32, recorded: 32, pending: 0 },
  "form-example": { total: 126, recorded: 126, pending: 0 },
  combo: { total: 34, recorded: 34, pending: 0 },
  vocab: { total: 207, recorded: 207, pending: 0 },
  reading: { total: 164, recorded: 164, pending: 0 }
};
const allCoverageTargets = coverageCategories.flatMap((category) => category.items);

assert.deepEqual(
  coverageCategories.map((category) => category.id),
  ["alphabet", "form-example", "combo", "vocab", "reading"],
  "audio coverage catalog should include every content type that needs its own recording"
);
assert.equal(allCoverageTargets.length, 563, "audio coverage catalog should list all 563 retained audio targets");
assert.equal(new Set(allCoverageTargets.map((item) => item.id)).size, 563, "audio coverage target IDs should be unique");
assert.equal(allCoverageTargets.filter((item) => item.existingAudio).length, 563, "audio coverage catalog should recognize all 563 connected recordings");
assert.equal(allCoverageTargets.filter((item) => !item.existingAudio).length, 0, "audio coverage catalog should have no pending recordings");

const formExampleTargets = coverageCategories.find((category) => category.id === "form-example").items;
assert.equal(new Set(formExampleTargets.map((item) => item.value)).size, 126, "form example audio coverage targets should be unique by word");
assert.equal(formExampleTargets.find((item) => item.value === "ئانا").existingAudio, true, "ئانا should reuse a vocabulary recording");
assert.equal(formExampleTargets.find((item) => item.value === "قارا").existingAudio, true, "قارا should reuse a vocabulary recording");
assert.equal(formExampleTargets.find((item) => item.value === "ئالما").existingAudio, true, "ئالما should use its dedicated recording");
assert.equal(formExampleTargets.find((item) => item.value === "خەلقئارا").existingAudio, true, "خەلقئارا should use its dedicated recording");
assert.equal(
  formExampleTargets.find((item) => item.value === "مۈشۈكئېيىق").latin,
  "müshük'ëyiq",
  "replacement form examples should receive canonical ULY without inheriting unrelated spelling"
);
assert.equal(
  formExampleTargets.find((item) => item.value === "پېئىل").latin,
  "pë'il",
  "every replacement form example should receive canonical ULY"
);
assert.match(
  formExampleTargets.find((item) => item.value === "ئالما").fileBase,
  /^voice_form_example_[a-z0-9]+$/,
  "pending example recordings should use stable form-example filenames"
);
const nanFormExampleAudio = JSON.parse(vm.runInContext('JSON.stringify(formExampleAudioForWord("نان"))', context));
assert.equal(
  nanFormExampleAudio.outputPath,
  "./assets/audio/human/vocab/human_vocab_nan_food.webm",
  "form examples should prefer the vocabulary recording when the same spelling also exists in a combo"
);
const appleFormExampleAudio = JSON.parse(vm.runInContext('JSON.stringify(formExampleAudioForWord("ئالما"))', context));
assert.match(
  appleFormExampleAudio.outputPath,
  /^\.\/assets\/audio\/human\/form-examples\/human_form_example_[a-z0-9]+\.webm$/,
  "new example recordings should use the dedicated human form-example folder"
);
const dedicatedFormExampleIds = JSON.parse(
  vm.runInContext(
    "JSON.stringify(formExampleItems.filter((item) => !vocabAudioByValue.has(item.value) && !comboAudioByValue.has(item.value)).map((item) => item.id))",
    context
  )
);
assert.deepEqual(
  new Set(formExampleManifest.items.map((item) => item.id)),
  new Set(dedicatedFormExampleIds),
  "form example manifest should contain the complete dedicated recording set"
);

for (const category of coverageCategories) {
  const expected = expectedAudioCoverage[category.id];
  assert.equal(category.items.length, expected.total, `${category.title} should include every audio coverage target`);
  assert.equal(
    category.items.filter((item) => item.existingAudio).length,
    expected.recorded,
    `${category.title} should report the correct connected recording count`
  );
  assert.equal(
    category.items.filter((item) => !item.existingAudio).length,
    expected.pending,
    `${category.title} should report the correct pending recording count`
  );
}

for (const target of allCoverageTargets) {
  for (const field of ["id", "categoryId", "categoryTitle", "unit", "groupTitle", "value", "latin", "kind", "fileBase"]) {
    assert.ok(String(target[field] || "").trim(), `${target.id || "audio coverage target"} should include ${field}`);
  }
}

vm.runInContext("state.screen = 'group'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'; render();", context);

assert.ok(app.innerHTML.includes('data-action="play-audio"'), "letter page should render a real play action");
assert.ok(!app.innerHTML.includes('class="play-dot disabled"'), "letter page should enable connected human audio");
assert.ok(app.innerHTML.includes("letter-focus-play"), "letter page should keep the pronunciation audio control in the letter card");
assert.ok(app.innerHTML.includes("./assets/audio/human/alphabet/human_letter_01_b.webm"), "letter page should expose connected human audio");
assert.ok(!app.innerHTML.includes("可先接近理解为 b"), "letter page should hide the internal pronunciation hint");

vm.runInContext("state.screen = 'combo'; state.selectedComboGroupId = 'open-a'; state.currentComboItemId = 'ba'; render();", context);
assert.ok(app.innerHTML.includes('data-action="play-audio"'), "combo page should render a play action");
assert.ok(app.innerHTML.includes('aria-label="Play با"'), "combo page should localize reusable audio chrome in English mode");
assert.ok(!app.innerHTML.includes('aria-label="播放'), "combo page should not retain Chinese reusable audio chrome in English mode");
assert.ok(!app.innerHTML.includes(">听</button>"), "combo page should not retain the Chinese reusable play label in English mode");
assert.ok(
  app.innerHTML.includes("a human recording provides the target pronunciation"),
  "combo page should preserve course-domain human-audio guidance in English mode"
);
assert.ok(!app.innerHTML.includes("真人音频"), "combo page should not retain Chinese course-domain guidance in English mode");
assert.ok(app.innerHTML.includes("./assets/audio/human/combos/human_combo_ba.webm"), "combo page should expose connected human audio");

vm.runInContext("state.screen = 'combo'; state.selectedComboGroupId = 'connection-breaks'; state.currentComboItemId = 'dada-connection'; render();", context);
assert.ok(!app.innerHTML.includes('class="play-dot letter-focus-play disabled"'), "new combo recordings should enable playback");
assert.ok(app.innerHTML.includes("./assets/audio/human/combos/human_combo_dada_connection.webm"), "new combo recordings should use their connected audio file");

vm.runInContext("state.screen = 'vocab'; state.selectedVocabGroupId = 'greetings'; state.currentVocabItemId = 'yaxshimusiz'; render();", context);
assert.ok(app.innerHTML.includes('data-action="play-audio"'), "vocab page should render a play action");
assert.ok(!app.innerHTML.includes("disabled"), "vocab page should enable connected human audio");
assert.ok(app.innerHTML.includes("./assets/audio/human/vocab/human_vocab_yaxshimusiz.webm"), "vocab page should expose connected human audio");

vm.runInContext("state.screen = 'vocab'; state.selectedVocabGroupId = 'greetings'; state.currentVocabItemId = 'korushkunche'; render();", context);
assert.ok(app.innerHTML.includes('class="audio-word-button uyghur"'), "corrected see-you vocabulary should be playable after re-recording");
assert.ok(app.innerHTML.includes("./assets/audio/human/vocab/human_vocab_korushkunche.webm"), "corrected see-you vocabulary should point to its new recording");

vm.runInContext("state.screen = 'vocab'; state.selectedVocabGroupId = 'home'; state.currentVocabItemId = 'dereze-home'; render();", context);
assert.ok(app.innerHTML.includes('class="audio-word-button uyghur"'), "window vocabulary should be playable after re-recording");
assert.ok(app.innerHTML.includes("./assets/audio/human/vocab/human_vocab_dereze_home.webm"), "window vocabulary should point to its new recording");

vm.runInContext("state.screen = 'vocab'; state.selectedVocabGroupId = 'home'; state.currentVocabItemId = 'stol-home'; render();", context);
assert.ok(app.innerHTML.includes('class="audio-word-button uyghur"'), "corrected table vocabulary should be playable after re-recording");
assert.ok(app.innerHTML.includes("./assets/audio/human/vocab/human_vocab_stol_home.webm"), "corrected table vocabulary should point to its new recording");

for (const { id, sourceId } of expectedVocabAudioAliases) {
  const groupId = courseData.vocabGroups.find((group) => group.items.some((item) => item.id === id))?.id;
  assert.ok(groupId, `${id} should belong to an active vocabulary group`);
  vm.runInContext(
    `state.screen = 'vocab'; state.selectedVocabGroupId = '${groupId}'; state.currentVocabItemId = '${id}'; render();`,
    context
  );
  assert.ok(
    app.innerHTML.includes(`./assets/audio/human/vocab/human_vocab_${sourceId.replaceAll("-", "_")}.webm`),
    `${id} should play the retained ${sourceId} recording`
  );
  assert.ok(
    !app.innerHTML.includes(`./assets/audio/human/vocab/human_vocab_${id.replaceAll("-", "_")}.webm`),
    `${id} should not reference its removed duplicate recording`
  );
}

vm.runInContext(
  "state.screen = 'reading'; state.selectedReadingUnitId = 'famous-quotes'; state.selectedReadingGroupId = 'quote-mahmud-kashgari'; render();",
  context
);
assert.equal((app.innerHTML.match(/data-action="play-audio"/g) || []).length, 3, "each displayed reading line should have a playback button");
assert.ok(
  app.innerHTML.includes("./assets/audio/human/reading/human_reading_quote_mahmud_kashgari_line_1.webm"),
  "reading lessons should expose the connected human recording"
);

vm.runInContext("state.screen = 'practiceSession'; state.selectedPracticeGroupId = 'listening-loop'; state.currentPracticeItemId = 'practice-listen-be'; render();", context);
assert.ok(app.innerHTML.includes('data-action="play-audio"'), "practice page should render a play action");
assert.ok(app.innerHTML.includes("Human recording"), "practice page should localize the reusable human-audio status in English mode");
assert.ok(app.innerHTML.includes("./assets/audio/human/alphabet/human_letter_01_b.webm"), "practice page should use alphabet audio instead of duplicate practice audio");

console.log("human audio checks passed");
