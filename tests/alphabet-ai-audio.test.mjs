import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const manifestPath = "prototype/assets/audio/ai-temp/alphabet/manifest.json";
const generatorPath = "audio-tools/generate-alphabet-ai-audio.mjs";

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
assert.equal(manifest.items.length, 32, "alphabet AI audio manifest should cover all 32 letters");
assert.equal(new Set(manifest.items.map((item) => item.file)).size, 32, "audio filenames should be unique");
assert.ok(
  manifest.items.every((item) => item.file.startsWith("ai_temp_letter_") && item.file.endsWith(".mp3")),
  "letter audio files should use the AI temporary mp3 naming rule"
);
assert.ok(
  manifest.items.every((item) => item.outputPath.startsWith("./assets/audio/ai-temp/alphabet/")),
  "letter audio output paths should stay in the AI temporary alphabet folder"
);
assert.ok(fs.readFileSync(generatorPath, "utf8").includes("OPENAI_API_KEY"), "generator should require an API key");

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
vm.runInContext(fs.readFileSync("prototype/app.js", "utf8"), context, { filename: "prototype/app.js" });
vm.runInContext("state.screen = 'group'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'; render();", context);

assert.ok(app.innerHTML.includes('data-action="play-audio"'), "letter page should render a real play action");
assert.ok(
  app.innerHTML.includes("./assets/audio/ai-temp/alphabet/ai_temp_letter_01_b.mp3"),
  "letter page should point to the first alphabet AI audio file"
);
assert.ok(app.innerHTML.includes("AI 临时音频"), "letter page should clearly label AI temporary audio");

console.log("alphabet AI audio checks passed");
