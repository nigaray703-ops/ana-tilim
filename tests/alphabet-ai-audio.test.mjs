import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const manifestPath = "prototype/assets/audio/ai-temp/alphabet/manifest.json";
const comboManifestPath = "prototype/assets/audio/ai-temp/combos/manifest.json";
const vocabManifestPath = "prototype/assets/audio/ai-temp/vocab/manifest.json";
const practiceManifestPath = "prototype/assets/audio/ai-temp/practice/manifest.json";
const generatorPath = "audio-tools/generate-alphabet-ai-audio.mjs";

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const comboManifest = JSON.parse(fs.readFileSync(comboManifestPath, "utf8"));
const vocabManifest = JSON.parse(fs.readFileSync(vocabManifestPath, "utf8"));
const practiceManifest = JSON.parse(fs.readFileSync(practiceManifestPath, "utf8"));
assert.equal(manifest.items.length, 32, "alphabet AI audio manifest should cover all 32 letters");
assert.equal(comboManifest.items.length, 20, "combo AI audio manifest should cover all unit two items");
assert.equal(vocabManifest.items.length, 18, "vocab AI audio manifest should cover all unit three items");
assert.equal(practiceManifest.items.length, 12, "practice AI audio manifest should cover all unit four items");
assert.equal(new Set(manifest.items.map((item) => item.file)).size, 32, "audio filenames should be unique");
assert.equal(new Set(comboManifest.items.map((item) => item.file)).size, 20, "combo audio filenames should be unique");
assert.equal(new Set(vocabManifest.items.map((item) => item.file)).size, 18, "vocab audio filenames should be unique");
assert.equal(new Set(practiceManifest.items.map((item) => item.file)).size, 12, "practice audio filenames should be unique");
assert.ok(
  manifest.items.every((item) => item.file.startsWith("ai_temp_letter_") && item.file.endsWith(".mp3")),
  "letter audio files should use the AI temporary mp3 naming rule"
);
assert.ok(
  manifest.items.every((item) => item.outputPath.startsWith("./assets/audio/ai-temp/alphabet/")),
  "letter audio output paths should stay in the AI temporary alphabet folder"
);
const generatorSource = fs.readFileSync(generatorPath, "utf8");
assert.ok(generatorSource.includes("OPENAI_API_KEY"), "generator should require an API key");
assert.ok(generatorSource.includes("--unit NAME"), "generator should support unit-scoped generation");
assert.ok(generatorSource.includes("combos/manifest.json"), "generator should include unit two audio manifest");
assert.ok(generatorSource.includes("vocab/manifest.json"), "generator should include unit three audio manifest");
assert.ok(generatorSource.includes("practice/manifest.json"), "generator should include unit four audio manifest");

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
    querySelector(selector) {
      if (selector === "#app") return app;
      if (selector === "#toast") return toast;
      return null;
    },
    addEventListener() {}
  },
  window: {
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
  "prototype/course-data/alphabet-data.js",
  "prototype/course-data/combo-data.js",
  "prototype/course-data/vocab-data.js",
  "prototype/course-data/practice-data.js"
]) {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), context, { filename: scriptPath });
}
vm.runInContext(fs.readFileSync("prototype/course-data.js", "utf8"), context, { filename: "prototype/course-data.js" });
vm.runInContext(fs.readFileSync("prototype/app.js", "utf8"), context, { filename: "prototype/app.js" });
vm.runInContext("state.screen = 'group'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'; render();", context);

assert.ok(app.innerHTML.includes('data-action="play-audio"'), "letter page should render a real play action");
assert.ok(
  app.innerHTML.includes("./assets/audio/ai-temp/alphabet/ai_temp_letter_01_b.mp3"),
  "letter page should point to the first alphabet AI audio file"
);
assert.ok(app.innerHTML.includes("AI 临时音频"), "letter page should clearly label AI temporary audio");

vm.runInContext("state.screen = 'combo'; state.selectedComboGroupId = 'open-a'; state.currentComboItemId = 'ba'; render();", context);
assert.ok(app.innerHTML.includes('data-action="play-audio"'), "combo page should render a play action");
assert.ok(
  app.innerHTML.includes("./assets/audio/ai-temp/combos/ai_temp_combo_ba.mp3"),
  "combo page should point to the first combo AI audio file"
);

vm.runInContext("state.screen = 'vocab'; state.selectedVocabGroupId = 'greetings'; state.currentVocabItemId = 'yaxshimusiz'; render();", context);
assert.ok(app.innerHTML.includes('data-action="play-audio"'), "vocab page should render a play action");
assert.ok(
  app.innerHTML.includes("./assets/audio/ai-temp/vocab/ai_temp_vocab_yaxshimusiz.mp3"),
  "vocab page should point to the first vocab AI audio file"
);

vm.runInContext("state.screen = 'practiceSession'; state.selectedPracticeGroupId = 'listening-loop'; state.currentPracticeItemId = 'practice-listen-be'; render();", context);
assert.ok(app.innerHTML.includes('data-action="play-audio"'), "practice page should render a play action");
assert.ok(
  app.innerHTML.includes("./assets/audio/ai-temp/practice/ai_temp_practice_listen_be.mp3"),
  "practice page should point to the first practice AI audio file"
);

console.log("alphabet AI audio checks passed");
