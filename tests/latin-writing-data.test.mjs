import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const latinWritingPath = "prototype/course-data/latin-writing-data.js";
assert.ok(fs.existsSync(latinWritingPath), "latin writing course data module should exist");

const expectedVowelIds = ["aa", "ae", "o", "u", "oe", "ue", "ee", "ii"];
const expectedConsonantIds = [
  "be", "pe", "te", "jim", "che", "khe", "dal", "re", "ze", "zhe", "sin", "shin",
  "ghayn", "fe", "qaf", "kaf", "gaf", "ng", "lam", "mim", "nun", "he", "waw", "ye"
];
const expectedComparisonIds = [
  ["aa", "ae"],
  ["o", "u"],
  ["oe", "ue"],
  ["ee", "ii"]
];
const expectedUnit = {
  id: "latin-keyboard-writing",
  name: "拉丁键盘与字母书写强化",
  subtitle: "普通 QWERTY、元辅音分类与 ULY 默写",
  description: "先认识普通拉丁键位，再按元音和辅音整理字母，最后看拉丁提示练习维吾尔字母书写。",
  bullets: ["普通 QWERTY", "8 个元音", "24 个辅音", "拉丁提示默写", "四种字形"]
};

function runScript(scriptPath, context) {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), context, { filename: scriptPath });
}

function makeContext() {
  const context = { console, window: {} };
  context.globalThis = context;
  vm.createContext(context);
  return context;
}

const focusedContext = makeContext();
runScript("prototype/course-data/alphabet-data.js", focusedContext);
runScript(latinWritingPath, focusedContext);

const data = focusedContext.window.ANA_TILIM_LATIN_WRITING;
assert.ok(data, "latin writing module should expose ANA_TILIM_LATIN_WRITING");
assert.equal(Object.isFrozen(data), true, "latin writing course data should be immutable at its public boundary");
assert.deepEqual(JSON.parse(JSON.stringify(data.vowelLetterIds)), expectedVowelIds);
assert.deepEqual(JSON.parse(JSON.stringify(data.consonantLetterIds)), expectedConsonantIds);
assert.equal(new Set([...data.vowelLetterIds, ...data.consonantLetterIds]).size, 32);
assert.deepEqual(
  JSON.parse(JSON.stringify(data.vowelComparisons.map((item) => item.letterIds))),
  expectedComparisonIds
);
assert.deepEqual(JSON.parse(JSON.stringify(data.unit)), expectedUnit);

const letterDetails = focusedContext.window.ANA_TILIM_ALPHABET.letterDetails;
for (const letterId of [...expectedVowelIds, ...expectedConsonantIds]) {
  assert.ok(letterDetails[letterId], `${letterId} should exist in the alphabet data`);
  assert.ok(
    Array.isArray(letterDetails[letterId].forms) && letterDetails[letterId].forms.length > 0,
    `${letterId} should keep its existing static form references`
  );
  for (const form of letterDetails[letterId].forms) {
    assert.equal(typeof form.label, "string", `${letterId} form label should be text`);
    assert.ok(form.label.trim(), `${letterId} form label should not be empty`);
    assert.equal(typeof form.value, "string", `${letterId} form value should be text`);
    assert.ok(form.value.trim(), `${letterId} form value should not be empty`);
  }
}

const focusedCoursePaths = [
  "prototype/uly-transliteration.js",
  "prototype/course-data/alphabet-data.js",
  "prototype/course-data/combo-data.js",
  "prototype/course-data/vocab-data.js",
  "prototype/course-data/practice-data.js",
  "prototype/course-data/reading-data.js"
];

const missingDependencyContext = makeContext();
for (const scriptPath of focusedCoursePaths) runScript(scriptPath, missingDependencyContext);
assert.throws(
  () => runScript("prototype/course-data.js", missingDependencyContext),
  /ANA_TILIM_LATIN_WRITING/,
  "course data aggregator should name a missing latin writing module"
);

const aggregateContext = makeContext();
for (const scriptPath of focusedCoursePaths) runScript(scriptPath, aggregateContext);
runScript(latinWritingPath, aggregateContext);
runScript("prototype/course-data.js", aggregateContext);
assert.deepEqual(
  JSON.parse(JSON.stringify(aggregateContext.window.ANA_TILIM_COURSE.latinWriting)),
  JSON.parse(JSON.stringify(data)),
  "course data aggregator should expose the focused latin writing data"
);

const indexHtml = fs.readFileSync("prototype/index.html", "utf8");
const alphabetScriptIndex = indexHtml.indexOf("./course-data/alphabet-data.js");
const latinWritingScriptIndex = indexHtml.indexOf("./course-data/latin-writing-data.js");
const aggregatorScriptIndex = indexHtml.indexOf("./course-data.js");
assert.ok(
  alphabetScriptIndex >= 0
    && alphabetScriptIndex < latinWritingScriptIndex
    && latinWritingScriptIndex < aggregatorScriptIndex,
  "latin writing data should load after alphabet data and before the course aggregator"
);

const app = {
  innerHTML: "",
  textContent: "",
  dataset: {},
  classList: { add() {}, remove() {} },
  querySelector() { return null; },
  closest() { return null; },
  addEventListener() {}
};
const toast = { ...app };
const appContext = {
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
    setTimeout() { return 1; },
    clearTimeout() {}
  },
  Audio: function FakeAudio() {
    this.pause = () => {};
    this.play = () => Promise.resolve();
  }
};
appContext.globalThis = appContext;
vm.createContext(appContext);
for (const scriptPath of [
  "prototype/app-config.js",
  ...focusedCoursePaths,
  latinWritingPath,
  "prototype/course-data.js",
  "prototype/unit-order.js",
  "prototype/uyghur-keyboard.js",
  "prototype/sentence-morphemes.js",
  "prototype/sentence-glossary.js",
  "prototype/progress-transfer.js",
  "prototype/cloud-config.js",
  "prototype/cloud-sync.js",
  "prototype/app.js"
]) {
  runScript(scriptPath, appContext);
}

const catalogUnit = JSON.parse(vm.runInContext(
  "JSON.stringify(learningUnitCatalog.find((unit) => unit.id === 'latin-keyboard-writing'))",
  appContext
));
assert.equal(catalogUnit.actionTarget, "latinKeyboardIntro");
assert.deepEqual(catalogUnit.groups, [], "Task 1 catalog unit should preserve the existing groups list invariant");
assert.equal(catalogUnit.title, undefined, "unit titles should remain the order module's responsibility");
assert.equal(
  JSON.parse(vm.runInContext("JSON.stringify(learningUnits.map((unit) => unit.id))", appContext))[1],
  "latin-keyboard-writing",
  "the app catalog should place the latin writing unit after letters"
);
assert.doesNotThrow(
  () => vm.runInContext("unitProgressSummaries()", appContext),
  "progress summaries should accept the Task 1 catalog shape before the interactive screen exists"
);

const audioImportTool = await import("../tools/import-form-example-audio.mjs");
assert.equal(
  typeof audioImportTool.loadCourseData,
  "function",
  "form example audio tool should expose its real course loader for side-effect-free verification"
);
const audioToolCourse = audioImportTool.loadCourseData();
assert.equal(
  audioToolCourse.latinWriting.unit.id,
  "latin-keyboard-writing",
  "form example audio tool should load the strict latin writing dependency"
);
assert.ok(audioToolCourse.letterDetails.aa, "form example audio tool should still load alphabet form examples");
assert.ok(audioToolCourse.comboGroups.length > 0, "form example audio tool should still load combo reuse data");
assert.ok(audioToolCourse.vocabGroups.length > 0, "form example audio tool should still load vocabulary reuse data");

console.log("latin writing course data checks passed");
