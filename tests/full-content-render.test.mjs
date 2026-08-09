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
  "prototype/app-config.js",
  "prototype/uly-transliteration.js",
  "prototype/course-data/alphabet-data.js",
  "prototype/course-data/latin-writing-data.js",
  "prototype/course-data/combo-data.js",
  "prototype/course-data/syllable-data.js",
  "prototype/course-data/vocab-data.js",
  "prototype/course-data/practice-data.js",
  "prototype/course-data/reading-data.js",
  "prototype/course-data.js",
  "prototype/unit-order.js",
  "prototype/uyghur-keyboard.js",
  "prototype/latin-keyboard.js",
  "prototype/sentence-morphemes.js",
  "prototype/sentence-glossary.js",
  "prototype/progress-transfer.js",
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

renderState({ screen: "welcome", authPanelExpanded: false }, "collapsed welcome screen", "直接开始学习");
assert.ok(app.innerHTML.includes("可选：登录后跨设备同步"), "collapsed welcome should expose the optional sync disclosure");
assert.match(app.innerHTML, /id="welcome-auth-panel"[^>]*hidden/, "collapsed welcome should retain a hidden aria-controls target");
assert.ok(!app.innerHTML.includes('data-action="password-login"'), "collapsed welcome should not render a login submit");
renderState({ screen: "welcome", authPanelExpanded: true }, "expanded welcome screen", "登录并继续学习");
assert.doesNotMatch(app.innerHTML.match(/<[^>]+id="welcome-auth-panel"[^>]*>/)?.[0] || "", /hidden/, "expanded auth target should be visible");
assert.ok(
  app.innerHTML.indexOf('data-action="continue-local"') < app.innerHTML.indexOf('data-action="password-login"'),
  "expanded welcome should keep guest learning before authentication submits"
);
renderState({ screen: "home", mistakes: [] }, "empty memory review", "当前没有需要复习的错题");
assert.ok(!app.innerHTML.includes("后续登录版"), "empty memory review should not promise future reminder behavior");

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
  "latin-keyboard-writing",
  "combos",
  "syllable-training",
  "basic-phrases",
  ...courseData.readingUnits.map((unit) => unit.id)
]) {
  renderState({ screen: "unit", selectedUnitId: unitId }, `${unitId} unit`);
}

renderState(
  { screen: "latinKeyboardIntro", selectedUnitId: "latin-keyboard-writing", latinKeyboardValue: "" },
  "Latin QWERTY keyboard",
  "qwerty"
);
renderState(
  { screen: "latinLetterClasses", selectedUnitId: "latin-keyboard-writing" },
  "Latin letter classification",
  "8 个元音"
);
for (const [latinVowelComparisonIndex, comparison] of courseData.latinWriting.vowelComparisons.entries()) {
  renderState(
    { screen: "latinVowelCompare", selectedUnitId: "latin-keyboard-writing", latinVowelComparisonIndex },
    `Latin vowel comparison ${comparison.id}`,
    comparison.focus
  );
  assert.equal(
    (app.innerHTML.match(/class="latin-vowel-comparison-card"/g) || []).length,
    2,
    `Latin vowel comparison ${comparison.id} should render one pair at a time`
  );
}

const latinDictationLetterIds = [
  ...courseData.latinWriting.vowelLetterIds,
  ...courseData.latinWriting.consonantLetterIds
];
for (const [latinDictationIndex, letterId] of latinDictationLetterIds.entries()) {
  const letter = courseData.letterDetails[letterId];
  renderState(
    {
      screen: "latinDictation",
      selectedUnitId: "latin-keyboard-writing",
      latinDictationIndex,
      latinDictationRevealed: false,
      latinWritingForm: 0
    },
    `Latin dictation prompt ${letterId}`,
    letter.latin
  );
  assert.ok(!app.innerHTML.includes(letter.letter), `Latin dictation prompt ${letterId} should hide its answer glyph`);
  for (const form of letter.forms) {
    assert.ok(!app.innerHTML.includes(form.value), `Latin dictation prompt ${letterId} should hide form ${form.value}`);
  }

  renderState(
    {
      screen: "latinDictation",
      selectedUnitId: "latin-keyboard-writing",
      latinDictationIndex,
      latinDictationRevealed: true,
      latinWritingForm: 0
    },
    `Latin dictation answer ${letterId}`,
    letter.letter
  );
  for (const form of letter.forms) {
    assert.ok(app.innerHTML.includes(form.value), `Latin dictation answer ${letterId} should show real form ${form.value}`);
  }
}

let latinWritingRealFormCount = 0;
for (const letterId of latinDictationLetterIds) {
  const letter = courseData.letterDetails[letterId];
  for (const [latinWritingForm, form] of letter.forms.entries()) {
    renderState(
      {
        screen: "latinWritingForms",
        selectedUnitId: "latin-keyboard-writing",
        latinWritingLetterId: letterId,
        latinWritingForm,
        latinWritingGuideVisible: true,
        latinWritingComparisonRevealed: false
      },
      `Latin writing form ${letterId} ${latinWritingForm}`,
      form.value
    );
    latinWritingRealFormCount += 1;
    assert.equal(
      (app.innerHTML.match(/data-latin-writing-form-tab/g) || []).length,
      letter.forms.length,
      `Latin writing ${letterId} should keep its exact real form count`
    );
    assert.equal(
      (app.innerHTML.match(/role="tab"[^>]*aria-selected="true"/g) || []).length,
      1,
      `Latin writing ${letterId} form ${latinWritingForm} should select exactly one tab`
    );
    for (const sourceForm of letter.forms) {
      assert.ok(app.innerHTML.includes(sourceForm.label), `Latin writing ${letterId} should show ${sourceForm.label}`);
      assert.ok(app.innerHTML.includes(sourceForm.value), `Latin writing ${letterId} should show ${sourceForm.value}`);
    }
  }
}
assert.equal(latinWritingRealFormCount, 126, "full UI audit should enumerate all audited 2/4/8 real letter forms");

for (const letterId of ["dal", "oe", "ee"]) {
  const letter = courseData.letterDetails[letterId];
  const lastFormIndex = letter.forms.length - 1;
  renderState(
    {
      screen: "latinWritingForms",
      selectedUnitId: "latin-keyboard-writing",
      latinWritingLetterId: letterId,
      latinWritingForm: lastFormIndex,
      latinWritingGuideVisible: false,
      latinWritingComparisonRevealed: false
    },
    `Latin writing hidden guide ${letterId}`,
    letter.forms[lastFormIndex].value
  );
  assert.match(app.innerHTML, /writing-pad hide-guide/, `Latin writing ${letterId} should render a hidden-guide state`);

  renderState(
    {
      screen: "latinWritingForms",
      selectedUnitId: "latin-keyboard-writing",
      latinWritingLetterId: letterId,
      latinWritingForm: lastFormIndex,
      latinWritingGuideVisible: true,
      latinWritingComparisonRevealed: true
    },
    `Latin writing revealed comparison ${letterId}`,
    "不做自动判分"
  );
  assert.ok(
    app.innerHTML.includes(letter.forms[lastFormIndex].label),
    `Latin writing revealed comparison ${letterId} should use the selected real source label`
  );
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

for (const [syllableItemIndex, item] of courseData.syllableTraining.twoLetterItems.entries()) {
  renderState(
    {
      screen: "syllableWarmup",
      selectedUnitId: "syllable-training",
      syllableItemIndex,
      syllableShowStandard: false
    },
    `syllable warmup parts ${item.id}`,
    item.parts[0]
  );
  assert.ok(app.innerHTML.includes(item.parts[1]), `${item.id} should show both real source parts`);
  assert.ok(!app.innerHTML.includes("data-syllable-standard"), `${item.id} should hide its standard before combine`);
  assert.ok(!app.innerHTML.includes(item.audioPath), `${item.id} should hide its real audio before combine`);

  renderState(
    {
      screen: "syllableWarmup",
      selectedUnitId: "syllable-training",
      syllableItemIndex,
      syllableShowStandard: true
    },
    `syllable warmup revealed ${item.id}`,
    item.standard
  );
  assert.ok(app.innerHTML.includes(item.audioPath), `${item.id} should reveal its existing combo audio mapping`);
}

const completedWarmupForRuleRender = {
  completedIds: [
    "warmup-ba", "warmup-pa", "warmup-ta", "warmup-na", "warmup-la",
    "warmup-ma", "warmup-be-e", "warmup-pe-e", "warmup-te-e", "warmup-ne-e"
  ],
  completed: true
};
for (const [ruleIndex, rule] of courseData.syllableTraining.rules.entries()) {
  const completedEarlierRulesForRender = Object.fromEntries(
    courseData.syllableTraining.rules.slice(0, ruleIndex).map((earlierRule) => [
      earlierRule.id,
      { completedIds: earlierRule.exercises.map((item) => item.id), completed: true }
    ])
  );
  for (const [exerciseIndex, exercise] of rule.exercises.entries()) {
    renderState(
      {
        screen: "syllableRules",
        selectedUnitId: "syllable-training",
        syllableRuleId: rule.id,
        syllableAnswerId: "",
        syllableAnswerSubmitted: false,
        learningProgress: {
          latinWriting: {},
          letters: {},
          combos: {},
          syllableTraining: {
            "two-letter-warmup": completedWarmupForRuleRender,
            ...completedEarlierRulesForRender,
            [rule.id]: { completedIds: rule.exercises.slice(0, exerciseIndex).map((item) => item.id) }
          },
          vocab: {},
          practice: {},
          reading: {}
        }
      },
      `syllable rule ${ruleIndex + 1} exercise ${exercise.id}`,
      exercise.prompt
    );
    assert.ok(app.innerHTML.includes(rule.title), `${exercise.id} should remain directly under its own rule card`);
    assert.ok(app.innerHTML.includes(exercise.answer), `${exercise.id} should show its approved answer option`);
    assert.ok(app.innerHTML.includes(exercise.distractor), `${exercise.id} should show its approved distractor`);
    assert.ok(
      !app.innerHTML.includes(courseData.syllableTraining.rules[ruleIndex + 1]?.title || "__no_next_rule__"),
      `${exercise.id} should not expose a later locked rule`
    );
  }
}

const completedSyllableConnectionPrerequisites = {
  "two-letter-warmup": {
    completedIds: [
      "warmup-ba", "warmup-pa", "warmup-ta", "warmup-na", "warmup-la",
      "warmup-ma", "warmup-be-e", "warmup-pe-e", "warmup-te-e", "warmup-ne-e"
    ],
    completed: true
  },
  "vowel-nucleus": {
    completedIds: ["vowel-nucleus-01", "vowel-nucleus-02", "vowel-nucleus-03", "vowel-nucleus-04"],
    completed: true
  },
  "single-consonant-boundary": {
    completedIds: [
      "single-consonant-boundary-01", "single-consonant-boundary-02",
      "single-consonant-boundary-03", "single-consonant-boundary-04"
    ],
    completed: true
  },
  "two-consonant-boundary": {
    completedIds: [
      "two-consonant-boundary-01", "two-consonant-boundary-02",
      "two-consonant-boundary-03", "two-consonant-boundary-04"
    ],
    completed: true
  },
  "suffix-boundary": {
    completedIds: ["suffix-boundary-01", "suffix-boundary-02", "suffix-boundary-03", "suffix-boundary-04"],
    completed: true
  }
};

for (const [itemIndex, item] of courseData.syllableTraining.connectionItems.entries()) {
  const completedIdsBefore = courseData.syllableTraining.connectionItems
    .slice(0, itemIndex)
    .map((connectionItem) => connectionItem.id);
  renderState(
    {
      screen: "syllableConnections",
      selectedUnitId: "syllable-training",
      syllableConnectionMode: "lesson",
      syllableConnectionAnswerId: "",
      syllableConnectionSubmitted: false,
      learningProgress: {
        latinWriting: {}, letters: {}, combos: {},
        syllableTraining: {
          ...completedSyllableConnectionPrerequisites,
          "connection-errors": { completedIds: completedIdsBefore }
        },
        vocab: {}, practice: {}, reading: {}
      }
    },
    `syllable textual judgment ${item.id}`,
    item.statement
  );
  assert.ok(!app.innerHTML.includes("错误判断："), `${item.id} should not reveal the answer label`);
  assert.ok(!app.innerHTML.includes(item.explanation), `${item.id} should hide its explanation before submit`);

  const completedIdsAfter = [...completedIdsBefore, item.id];
  renderState(
    {
      screen: "syllableConnections",
      selectedUnitId: "syllable-training",
      syllableConnectionMode: "lesson",
      syllableConnectionAnswerId: item.expectedAnswer,
      syllableConnectionSubmitted: true,
      learningProgress: {
        latinWriting: {}, letters: {}, combos: {},
        syllableTraining: {
          ...completedSyllableConnectionPrerequisites,
          "connection-errors": {
            completedIds: completedIdsAfter,
            ...(itemIndex === courseData.syllableTraining.connectionItems.length - 1 ? { completed: true } : {})
          }
        },
        vocab: {}, practice: {}, reading: {}
      }
    },
    `submitted syllable textual judgment ${item.id}`,
    item.explanation
  );
}

for (const [label, syllableMistakes, expectedText] of [
  ["connection mistakes", { connection: ["connection-01"], break: [] }, "1 道"],
  ["break mistakes", { connection: [], break: ["break-01"] }, "1 道"],
  ["empty split review", { connection: [], break: [] }, "连接错误已清空"]
]) {
  renderState({ screen: "syllableReview", syllableMistakes }, `syllable review ${label}`, expectedText);
}

const completedSyllableSentencePrerequisites = {
  ...completedSyllableConnectionPrerequisites,
  "connection-errors": {
    completedIds: courseData.syllableTraining.connectionItems.map((item) => item.id),
    completed: true
  }
};
for (const [sentenceIndex, sentence] of courseData.syllableTraining.sentences.entries()) {
  const completedIdsBefore = courseData.syllableTraining.sentences.slice(0, sentenceIndex).map((item) => item.id);
  for (const syllableSentenceShowStandard of [false, true]) {
    renderState(
      {
        screen: "syllableSentences",
        selectedUnitId: "syllable-training",
        syllableSentenceIndex: sentenceIndex,
        syllableSentenceShowStandard,
        syllableSentenceAudioPlayed: false,
        learningProgress: {
          latinWriting: {}, letters: {}, combos: {},
          syllableTraining: {
            ...completedSyllableSentencePrerequisites,
            "sentence-reading": { completedIds: completedIdsBefore }
          },
          vocab: {}, practice: {}, reading: {}
        }
      },
      `syllable sentence ${sentence.id} ${syllableSentenceShowStandard ? "standard" : "helper"}`,
      syllableSentenceShowStandard ? sentence.standard : sentence.syllables[0].text
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

assert.equal(renderCount, 744, "full UI audit should render every retained main screen, syllable warmup/rule/judgment/review/sentence state, real 2/4/8 form state, lesson item, reading group, and practice item");

console.log(`full content render checks passed (${renderCount} states)`);
