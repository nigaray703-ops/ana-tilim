import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

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
  "prototype/uly-transliteration.js",
  "prototype/course-data/alphabet-data.js",
  "prototype/course-data/combo-data.js",
  "prototype/course-data/vocab-data.js",
  "prototype/course-data/practice-data.js",
  "prototype/course-data/reading-data.js",
  "prototype/course-data.js",
  "prototype/i18n/ui-messages.js",
  "prototype/i18n/runtime.js",
  "prototype/cloud-config.js",
  "prototype/cloud-sync.js",
  "prototype/app.js"
]) {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), context, { filename: scriptPath });
}

const courseData = context.window.ANA_TILIM_COURSE;
let renderCount = 0;
const forbiddenLearnerCopy = [
  "待审校",
  "待母语者审校",
  "待来源审校",
  "已校对",
  "待修改",
  "展示项"
];

function assertLearnerCopyClean(label) {
  for (const phrase of forbiddenLearnerCopy) {
    assert.ok(!app.innerHTML.includes(phrase), `${label} should hide ${phrase}`);
  }
}

function renderState(assignments, label, expectedText = "") {
  const assignmentScript = Object.entries(assignments)
    .map(([key, value]) => `state.${key} = ${JSON.stringify(value)};`)
    .join("");
  vm.runInContext(`${assignmentScript}render();`, context);
  renderCount += 1;

  assert.ok(app.innerHTML.trim(), `${label} should render content`);
  assert.doesNotMatch(app.innerHTML, />\s*(?:undefined|null|NaN)\s*</, `${label} should not expose missing values`);
  assertLearnerCopyClean(label);
  if (expectedText) {
    assert.ok(app.innerHTML.includes(expectedText), `${label} should include ${expectedText}`);
  }
}

for (const screen of ["welcome", "home", "learn", "writing", "library", "profile"]) {
  renderState({ screen }, `${screen} screen`);
}

assert.equal(
  vm.runInContext("typeof handleCloudStatus === 'function'", context),
  true,
  "the learner UI should handle authentication status changes"
);
vm.runInContext(
  "state.screen = 'profile'; cloudStatus = { phase: 'verifying-code' }; handleCloudStatus({ phase: 'signed-in', authEvent: 'SIGNED_IN', error: '' });",
  context
);
assert.equal(
  vm.runInContext("state.screen", context),
  "home",
  "successful login should automatically open the home screen"
);

for (const unitId of [
  "letters",
  "combos",
  "basic-phrases",
  ...courseData.readingUnits.map((unit) => unit.id)
]) {
  renderState({ screen: "unit", selectedUnitId: unitId }, `${unitId} unit`);
}

for (const group of courseData.alphabetGroups) {
  for (const letter of group.letters) {
    renderState(
      { screen: "group", selectedGroupId: group.id, currentLetterId: letter.id },
      `letter ${letter.id}`,
      courseData.letterDetails[letter.id].letter
    );
  }
}

for (const group of courseData.comboGroups) {
  for (const item of group.items) {
    renderState(
      { screen: "combo", selectedComboGroupId: group.id, currentComboItemId: item.id },
      `combo ${item.id}`,
      item.value
    );
  }
}

for (const group of courseData.vocabGroups) {
  for (const item of group.items) {
    renderState(
      { screen: "vocab", selectedVocabGroupId: group.id, currentVocabItemId: item.id },
      `vocabulary ${item.id}`,
      item.value
    );
  }
}

for (const unit of courseData.readingUnits) {
  for (const group of unit.groups) {
    renderState(
      { screen: "reading", selectedReadingUnitId: unit.id, selectedReadingGroupId: group.id },
      `reading group ${group.id}`
    );
    for (const item of group.items) {
      assert.ok(app.innerHTML.includes(item.value), `reading group ${group.id} should render ${item.id}`);
    }
  }
}

for (const group of courseData.practiceGroups.filter((item) => item.mode !== "review")) {
  for (const item of group.items) {
    renderState(
      { screen: "practiceSession", selectedPracticeGroupId: group.id, currentPracticeItemId: item.id },
      `practice ${item.id}`,
      group.mode === "listen" ? "" : item.value
    );
  }
}

assert.equal(renderCount, 464, "full UI audit should render every main screen, unit, lesson item, reading group, and practice item");

console.log(`full content render checks passed (${renderCount} states)`);
