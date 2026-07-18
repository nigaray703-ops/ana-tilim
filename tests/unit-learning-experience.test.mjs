import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const indexHtml = fs.readFileSync("prototype/index.html", "utf8");
const courseDataGuidePath = "课程/00-课程数据编辑与审校说明.md";
const courseDataIntegrityTestPath = "tests/course-data-integrity.test.mjs";
const projectCheckScriptPath = "scripts/check-project.mjs";
const courseDataAggregatorPath = "prototype/course-data.js";
const courseDataScriptPaths = [
  "prototype/course-data/alphabet-data.js",
  "prototype/course-data/combo-data.js",
  "prototype/course-data/vocab-data.js",
  "prototype/course-data/practice-data.js",
  "prototype/course-data/reading-data.js"
];
assert.ok(fs.existsSync(courseDataAggregatorPath), "course data aggregator should exist");
for (const scriptPath of courseDataScriptPaths) {
  assert.ok(fs.existsSync(scriptPath), `${scriptPath} should exist as a focused course data file`);
}
assert.ok(fs.existsSync(courseDataGuidePath), "course data editing guide should exist for non-technical review");
assert.ok(fs.existsSync(courseDataIntegrityTestPath), "course data integrity checker should exist");
assert.ok(fs.existsSync(projectCheckScriptPath), "one-command project check script should exist");
const courseDataSource = fs.readFileSync(courseDataAggregatorPath, "utf8");
const courseDataSources = Object.fromEntries(
  courseDataScriptPaths.map((scriptPath) => [scriptPath, fs.readFileSync(scriptPath, "utf8")])
);
const courseDataGuide = fs.readFileSync(courseDataGuidePath, "utf8");
const appSource = fs.readFileSync("prototype/app.js", "utf8");
const styleSource = fs.readFileSync("prototype/styles.css", "utf8");
for (const phrase of [
  "prototype/course-data.js",
  "prototype/course-data/alphabet-data.js",
  "prototype/course-data/combo-data.js",
  "prototype/course-data/vocab-data.js",
  "prototype/course-data/practice-data.js",
  "prototype/course-data/reading-data.js",
  "alphabetGroups",
  "comboGroups",
  "vocabGroups",
  "practiceGroups",
  "readingUnits",
  "tests/course-data-integrity.test.mjs",
  "scripts/check-project.mjs",
  "待母语者审校",
  "AI 临时音频"
]) {
  assert.ok(courseDataGuide.includes(phrase), `course data guide should mention ${phrase}`);
}
assert.ok(
  courseDataSource.includes("window.ANA_TILIM_COURSE"),
  "course data file should expose a stable window.ANA_TILIM_COURSE object"
);
for (const globalName of [
  "window.ANA_TILIM_ALPHABET",
  "window.ANA_TILIM_COMBOS",
  "window.ANA_TILIM_VOCAB",
  "window.ANA_TILIM_PRACTICE",
  "window.ANA_TILIM_READING"
]) {
  assert.ok(courseDataSource.includes(globalName), `course data aggregator should read ${globalName}`);
}
assert.ok(
  appSource.includes("window.ANA_TILIM_COURSE"),
  "app should read alphabet course content from the shared course data object"
);
assert.ok(
  /\.alphabet-strip\s*\{[^}]*justify-content:\s*center;/s.test(styleSource),
  "full alphabet directory should center wrapped letter pills"
);
const lessonStepStyle = styleSource.match(/^\.lesson-step\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(lessonStepStyle.includes("align-items: center;"), "learning unit cards should center their content vertically");
const letterLibraryGridStyle = styleSource.match(/^\.letter-library-grid\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(
  letterLibraryGridStyle.includes("grid-template-columns: repeat(4, minmax(0, 1fr));"),
  "letter library should show four letters per row"
);
const homeCenterStyle = styleSource.match(/^\.home-center\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(homeCenterStyle.includes("width: min(100%, 390px);"), "home content should use a centered compact width");
assert.ok(homeCenterStyle.includes("min-height: calc(100svh - 320px);"), "home content should sit near the visual page center, not low on the page");
assert.ok(homeCenterStyle.includes("margin: 0 auto;"), "home content should be horizontally centered");
assert.ok(homeCenterStyle.includes("align-content: center;"), "home content should sit in the middle of the home page without stretching");
assert.ok(homeCenterStyle.includes("align-items: start;"), "home content should keep natural card heights while centered");
const homeCenterChildStyle = styleSource.match(/^\.home-center > \*\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(homeCenterChildStyle.includes("width: 100%;"), "home cards should fill the centered home column");
const stepStateStyle = styleSource.match(/^\.step-state\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
for (const declaration of ["overflow: visible;", "text-overflow: clip;", "min-width: max-content;", "flex: 0 0 auto;"]) {
  assert.ok(stepStateStyle.includes(declaration), `status labels should include ${declaration}`);
}
assert.ok(!appSource.includes("基础词组与主题词"), "old broad vocabulary unit title should be removed from the app");
assert.ok(courseDataSources["prototype/course-data/alphabet-data.js"].includes("alphabetGroups"), "unit one alphabet course data should live in the alphabet data file");
assert.ok(courseDataSources["prototype/course-data/combo-data.js"].includes("comboGroups"), "unit two combo course data should live in the combo data file");
assert.ok(
  !appSource.includes("const comboGroups = ["),
  "app should not define unit two combo content inline"
);
assert.ok(
  appSource.includes("comboGroups") && appSource.indexOf("comboGroups") < appSource.indexOf("const alphabetAudioByLetterId"),
  "app should read unit two combo content from the shared course data object"
);
assert.ok(courseDataSources["prototype/course-data/vocab-data.js"].includes("vocabGroups"), "unit three vocabulary course data should live in the vocab data file");
assert.ok(
  !appSource.includes("const vocabGroups = ["),
  "app should not define unit three vocabulary content inline"
);
assert.ok(
  appSource.includes("vocabGroups") && appSource.indexOf("vocabGroups") < appSource.indexOf("const alphabetAudioByLetterId"),
  "app should read unit three vocabulary content from the shared course data object"
);
assert.ok(courseDataSources["prototype/course-data/practice-data.js"].includes("practiceGroups"), "unit four practice course data should live in the practice data file");
assert.ok(
  !appSource.includes("const practiceGroups = ["),
  "app should not define unit four practice content inline"
);
assert.ok(
  appSource.includes("practiceGroups") && appSource.indexOf("practiceGroups") < appSource.indexOf("const alphabetAudioByLetterId"),
  "app should read unit four practice content from the shared course data object"
);
assert.ok(courseDataSources["prototype/course-data/reading-data.js"].includes("readingUnits"), "reading course data should live in the reading data file");
assert.ok(
  appSource.includes("readingUnits") && appSource.indexOf("readingUnits") < appSource.indexOf("const alphabetAudioByLetterId"),
  "app should read reading content from the shared course data object"
);
assert.ok(appSource.includes('["writing", "练习"'), "bottom navigation should label the practice area as 练习");
assert.ok(!appSource.includes('["writing", "书写"'), "bottom navigation should not label the full practice area as 书写");
assert.ok(appSource.includes("pointerdown"), "writing canvas should support direct pointer writing");
assert.ok(appSource.includes("clear-canvas"), "writing canvas should include a real clear action");
const htmlScriptOrder = [...courseDataScriptPaths, courseDataAggregatorPath, "prototype/app.js"].map((scriptPath) =>
  scriptPath.replace("prototype/", "./")
);
for (let index = 0; index < htmlScriptOrder.length - 1; index += 1) {
  const currentScript = htmlScriptOrder[index];
  const nextScript = htmlScriptOrder[index + 1];
  assert.ok(
    indexHtml.indexOf(currentScript) >= 0 && indexHtml.indexOf(currentScript) < indexHtml.indexOf(nextScript),
    `${currentScript} should load before ${nextScript}`
  );
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
let clickHandler = null;
const storage = {};
const context = {
  console,
  document: {
    querySelector(selector) {
      if (selector === "#app") return app;
      if (selector === "#toast") return toast;
      return null;
    },
    addEventListener(eventName, handler) {
      if (eventName === "click") {
        clickHandler = handler;
      }
    }
  },
  window: {
    setTimeout() {
      return 1;
    },
    clearTimeout() {},
    localStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
      },
      setItem(key, value) {
        storage[key] = String(value);
      },
      removeItem(key) {
        delete storage[key];
      }
    }
  },
  Audio: function FakeAudio(src) {
    this.src = src;
    this.pause = () => {};
    this.play = () => Promise.resolve();
  }
};

context.globalThis = context;
vm.createContext(context);
for (const scriptPath of courseDataScriptPaths) {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), context, { filename: scriptPath });
}
vm.runInContext(fs.readFileSync(courseDataAggregatorPath, "utf8"), context, { filename: courseDataAggregatorPath });
vm.runInContext(fs.readFileSync("prototype/app.js", "utf8"), context, { filename: "prototype/app.js" });

function renderState(script) {
  vm.runInContext(`${script}; render();`, context);
  return app.innerHTML;
}

function includesAll(html, phrases, screenName) {
  for (const phrase of phrases) {
    assert.ok(html.includes(phrase), `${screenName} should include ${phrase}`);
  }
}

function clickDataset(dataset) {
  assert.ok(clickHandler, "click handler should be registered");
  clickHandler({
    target: {
      closest(selector) {
        assert.equal(selector, "[data-action]");
        return { dataset };
      }
    }
  });
}

function savedProgress() {
  assert.ok(storage["ana-tilim-progress"], "local progress should be saved");
  return JSON.parse(storage["ana-tilim-progress"]);
}

includesAll(
  renderState("state.screen = 'welcome'"),
  ["从字母、发音、书写到键盘输入，一步一步学会自己的母语。", "开始学习"],
  "welcome screen"
);
assert.ok(!app.innerHTML.includes("<br>"), "welcome screen should not force the hero copy onto manual line breaks");

includesAll(
  renderState("state.screen = 'home'"),
  ["今日进度", "第三单元 · 听说与书写", "继续学习", "today-progress-note", "home-center"],
  "home screen"
);
const bottomNavHtml = app.innerHTML.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || "";
let lastNavPosition = -1;
for (const target of ["home", "library", "learn", "writing", "profile"]) {
  const position = bottomNavHtml.indexOf(`data-target="${target}"`, lastNavPosition + 1);
  assert.ok(position > lastNavPosition, `bottom navigation should place ${target} in the requested order`);
  lastNavPosition = position;
}
assert.ok(!app.innerHTML.includes("今日下一步"), "home screen should remove the daily next-action explainer card");
assert.ok(!app.innerHTML.includes("next-action-card"), "home screen should not render the removed next-action card");
assert.ok(!app.innerHTML.includes("快速入口"), "home screen should remove the quick entry section");
assert.ok(!app.innerHTML.includes("quick-grid"), "home screen should not render quick entry buttons");
assert.ok(!app.innerHTML.includes("<br>"), "home screen should not force unit titles onto manual line breaks");
assert.ok(!app.innerHTML.includes("AI 临时音频 / 真人音频待录制"), "home audio note should use readable punctuation");

includesAll(
  renderState("state.screen = 'writing'"),
  ["练习中心", "强化训练", "本地错题", "practice-topic-row", "听音辨认", "跟读练习", "书写", "键盘", "错题复习"],
  "practice hub"
);
assert.ok(!app.innerHTML.includes("书写、键盘"), "practice hub should split writing and keyboard into separate entries");
for (const uyghurPreview of ["ب", "با", "مەن", "رەھمەت", "ئانا"]) {
  assert.ok(!app.innerHTML.includes(uyghurPreview), `practice hub should not show Uyghur preview ${uyghurPreview}`);
}

includesAll(
  renderState("state.screen = 'learn'"),
  [
    "第三单元：听说与书写强化",
    "第四单元：日常用语与词汇",
    "第五单元：对话小剧场",
    "第六单元：小故事",
    "第七单元：名人名言",
    "第八单元：维吾尔谚语",
    "问候、人称代词、称呼、数字、动物"
  ],
  "learning path with reading units"
);
assert.ok(!app.innerHTML.includes("基础词组与主题词"), "learning path should not show the removed vocabulary title");
assert.ok(!app.innerHTML.includes("选择训练组、完成一个目标、查看本轮结果"), "learning unit cards should not show the full step explanation");
assert.ok(!app.innerHTML.includes("完整字母目录"), "learning path should not duplicate the full alphabet table");
assert.ok(!app.innerHTML.includes("alphabet-strip"), "learning path should keep the large alphabet table in the alphabet tab only");

includesAll(
  renderState(`
    state.screen = 'home';
    state.learningProgress.letters = { 'dot-bone': { completed: true } };
    state.learningProgress.practice = { 'listening-loop': { completed: true } };
    state.mistakes = [{
      key: 'letter:be',
      kind: 'letter',
      kindLabel: '字母',
      targetId: 'be',
      pickedId: 'pe',
      value: 'ب',
      latin: 'b',
      source: '第一单元错题',
      note: '目标是 ب，你选了 پ',
      help: '看下方点数。',
      attempts: 1
    }];
  `),
  ["今日进度", "2 / 32", "需要复习 1 个", "继续错题复习"],
  "home progress summary"
);
assert.ok(!app.innerHTML.includes("学习地图"), "home screen should not show the learning map");
assert.ok(!app.innerHTML.includes("learning-map-card"), "home screen should remove the learning map card");

for (const unitId of ["letters", "combos", "practice"]) {
  renderState(`state.screen = 'unit'; state.selectedUnitId = '${unitId}'`);
  assert.ok(!app.innerHTML.includes("单元目标"), `${unitId} unit screen should not show the unit goal block`);
  assert.ok(!app.innerHTML.includes("学习步骤"), `${unitId} unit screen should not show the learning steps block`);
  assert.ok(!app.innerHTML.includes("按这个顺序走"), `${unitId} unit screen should remove optional step copy`);
  assert.ok(app.innerHTML.includes("path-list"), `${unitId} unit screen should keep the lesson entry list`);
}
includesAll(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'basic-phrases'"),
  ["vocab-topic-list", "问候", "人称代词", "称呼", "数字", "动物", "→"],
  "vocab unit topic directory"
);
assert.ok(!app.innerHTML.includes("ياخشىمۇسىز"), "vocab unit directory should not expand word pills");
assert.ok(!app.innerHTML.includes("先认识最常见"), "vocab unit directory should keep copy concise");
includesAll(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'dialogue-theater'"),
  ["reading-topic-list", "早上见面", "买东西", "问路", "→"],
  "dialogue unit topic directory"
);
includesAll(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'short-stories'"),
  ["reading-topic-list", "我的一天", "去市场", "我的母语", "→"],
  "short story unit topic directory"
);
includesAll(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'famous-quotes'"),
  ["reading-topic-list", "马赫穆德·喀什噶里", "阿不都热依木·吾提库尔", "10 条", "→"],
  "famous quote unit topic directory"
);
assert.ok(!app.innerHTML.includes("مەھمۇد قەشقىرى"), "famous quote directory should use Chinese names");
assert.ok(!app.innerHTML.includes("ئابدۇرېھىم ئۆتكۈر"), "famous quote directory should use Chinese names");
includesAll(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'uyghur-proverbs'"),
  ["reading-topic-list", "知识就是力量", "好话暖心", "10 条", "→"],
  "proverb unit topic directory"
);
assert.ok(!app.innerHTML.includes("بىلىم كۈچ"), "proverb directory should use Chinese titles");
assert.ok(!app.innerHTML.includes("ياخشى سۆز"), "proverb directory should use Chinese titles");

includesAll(
  renderState("state.screen = 'reading'; state.selectedReadingUnitId = 'dialogue-theater'; state.selectedReadingGroupId = 'dialogue-greeting'"),
  ["早上见面", "reading-line", "ياخشىمۇسىز؟", "你好，你好吗？"],
  "dialogue reading lesson"
);
includesAll(
  renderState("state.screen = 'reading'; state.selectedReadingUnitId = 'short-stories'; state.selectedReadingGroupId = 'story-my-day'"),
  ["我的一天", "reading-line", "مەن ئەتىگەندە ئورنىمدىن تۇرىمەن.", "我早上起床。"],
  "short story reading lesson"
);
includesAll(
  renderState("state.screen = 'reading'; state.selectedReadingUnitId = 'famous-quotes'; state.selectedReadingGroupId = 'quote-mahmud-kashgari'"),
  ["名人名言", "reading-meaning", "reading-lesson", "待来源审校", "语言是了解一个民族的钥匙。"],
  "famous quote reading lesson"
);
includesAll(
  renderState("state.screen = 'reading'; state.selectedReadingUnitId = 'uyghur-proverbs'; state.selectedReadingGroupId = 'proverb-bilim-kuch'"),
  ["维吾尔谚语", "reading-meaning", "reading-lesson", "知识就是力量。"],
  "proverb reading lesson"
);

includesAll(
  renderState("state.screen = 'review'"),
  ["审校看板", "回填、音频、重点项"],
  "review dashboard"
);
assert.ok(!app.innerHTML.includes("回填 / 音频 / 重点项"), "review dashboard should use readable punctuation in the subtitle");
assert.ok(!app.innerHTML.includes("家庭 / 基础称呼重点项"), "review priority note should avoid slash-separated Chinese words");

renderState("state.screen = 'profile'");
assert.ok(!app.innerHTML.includes("<strong>强化训练</strong>"), "profile should move practice progress into the practice tab");
assert.ok(!app.innerHTML.includes("<strong>本地错题</strong>"), "profile should move local mistakes into the practice tab");

includesAll(
  renderState("state.screen = 'library'"),
  ["字母库", "待审校", "letter-library-grid", "32 个字母"],
  "letter library"
);
assert.ok(!app.innerHTML.includes(" / 待审校"), "letter library should separate labels with punctuation");
assert.ok(!app.innerHTML.includes("word-row"), "letter library should not render a tall row for every letter");
assert.ok(!app.innerHTML.includes(">学习</button>"), "letter library should avoid repeated study buttons");
assert.equal((app.innerHTML.match(/data-action="select-letter"/g) || []).length, 32, "letter library should keep all letters directly selectable");
let lastAlphabetPosition = -1;
for (const letter of ["ئا", "ئە", "ب", "پ", "ت", "ج", "چ", "خ", "د", "ر", "ز", "ژ", "س", "ش", "غ", "ف", "ق", "ك", "گ", "ڭ", "ل", "م", "ن", "ھ", "ئو", "ئۇ", "ئۆ", "ئۈ", "ۋ", "ئې", "ئى", "ي"]) {
  const position = app.innerHTML.indexOf(`<span class="uyghur">${letter}</span>`, lastAlphabetPosition + 1);
  assert.ok(position > lastAlphabetPosition, `letter library should place ${letter} in screenshot order`);
  lastAlphabetPosition = position;
}

includesAll(
  renderState("state.screen = 'group'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'"),
  ["1 / 3", "上一个", "下一个", "AI 临时音频", "找不同", "读音选择"],
  "letter lesson"
);
clickDataset({ action: "select-adjacent-letter", id: "pe" });
assert.equal(vm.runInContext("state.currentLetterId", context), "pe", "next letter button should switch letters");

includesAll(
  renderState("state.screen = 'letterOdd'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'; state.selectedPicture = ''"),
  ["找不同", "目标 ب", "下方三个点"],
  "letter odd-one-out exercise"
);
clickDataset({ action: "pick-letter-odd", id: "pe" });
includesAll(app.innerHTML, ["找对了", "پ"], "correct odd-one-out feedback");

includesAll(
  renderState("state.screen = 'letterSound'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'; state.selectedListening = ''; state.mistakes = []"),
  ["读音选择", "选择正确字母", "b"],
  "letter sound-choice exercise"
);
clickDataset({ action: "pick-letter-sound", id: "pe" });
includesAll(app.innerHTML, ["目标是 ب", "你选了 پ"], "letter sound-choice mistake feedback");
assert.equal(vm.runInContext("state.mistakes[0].targetId", context), "be", "sound-choice mistake should enter review");

includesAll(
  renderState("state.screen = 'combo'; state.selectedComboGroupId = 'open-a'; state.currentComboItemId = 'ba'"),
  ["1 / 6", "上一个", "下一个", "从右往左", "拼接"],
  "combo lesson"
);
clickDataset({ action: "select-adjacent-combo", id: "pa" });
assert.equal(vm.runInContext("state.currentComboItemId", context), "pa", "next combo button should switch combos");

includesAll(
  renderState("state.screen = 'comboBuild'; state.selectedComboGroupId = 'open-a'; state.currentComboItemId = 'ba'; state.keyboardValue = ''"),
  ["组合拼接", "ب + ا", "当前拼接"],
  "combo build exercise"
);
clickDataset({ action: "build-part", key: "ب" });
clickDataset({ action: "build-part", key: "ا" });
includesAll(app.innerHTML, ["拼接正确", "با"], "combo build success feedback");
assert.equal(savedProgress().learningProgress.combos["open-a"].completed, true, "combo build completion should be saved locally");

includesAll(
  renderState("state.screen = 'vocab'; state.selectedVocabGroupId = 'family'; state.currentVocabItemId = 'ana-family'"),
  ["第四单元：日常用语与词汇", "本课词汇", "vocab-subgroup", "ئانا", "ana", "妈妈、母亲", "不设唯一答案"],
  "vocab lesson"
);
assert.ok(!app.innerHTML.includes("letter-focus"), "vocab lesson should not use the old large focus card");
assert.ok(!app.innerHTML.includes("中文预览"), "vocab lesson should avoid repeated explanation cards");

includesAll(
  renderState("state.screen = 'vocab'; state.selectedVocabGroupId = 'numbers'; state.currentVocabItemId = 'one'"),
  ["1-10", "整十数", "大数", "يىگىرمە", "ئون مىڭ", "يۈز مىليون"],
  "number vocabulary sections"
);
assert.ok(!app.innerHTML.includes("11-20"), "number vocabulary should not show the removed 11-20 section");
includesAll(
  renderState("state.screen = 'vocab'; state.selectedVocabGroupId = 'time'; state.currentVocabItemId = 'bugun'"),
  ["基础时间", "星期", "月份", "دۈشەنبە", "يانۋار"],
  "time vocabulary sections"
);
assert.ok(!app.innerHTML.includes("词库审校字段"), "learning mode should hide audit-only vocabulary fields");
clickDataset({ action: "set-app-mode", mode: "audit" });
includesAll(
  renderState("state.screen = 'vocab'; state.selectedVocabGroupId = 'family'; state.currentVocabItemId = 'ana-family'"),
  ["词库审校字段", "退出审校模式"],
  "vocab audit mode"
);
clickDataset({ action: "set-app-mode", mode: "learn" });
clickDataset({ action: "select-adjacent-vocab", id: "apa-family" });
assert.equal(vm.runInContext("state.currentVocabItemId", context), "apa-family", "next vocab button should switch words");

renderState("state.screen = 'picture'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'");
clickDataset({ action: "pick-picture", id: "pe" });
let mistakeSummary = vm.runInContext("state.mistakes.map((item) => item.targetId).join(',')", context);
assert.equal(mistakeSummary, "be", "wrong letter choice should create a review item");
includesAll(
  app.innerHTML,
  ["目标是 ب", "你选了 پ", "下方一个点", "下方三个点"],
  "letter mistake explanation"
);
includesAll(
  renderState("state.screen = 'practiceSession'; state.selectedPracticeGroupId = 'review-loop'; state.currentPracticeItemId = 'practice-review-sin'"),
  ["本轮错题", "ب", "目标是 ب", "看下方点数"],
  "dynamic mistake review"
);

renderState("state.screen = 'letterWriting'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'");
includesAll(
  app.innerHTML,
  ["书写步骤", "writing-canvas", "清空画布", "起笔", "方向", "对比正确写法", "完成后评价", "点位正确"],
  "letter writing coach"
);
clickDataset({ action: "toggle-writing-check", id: "dots" });
includesAll(app.innerHTML, ["自查完成 1 / 3"], "letter writing self check");
clickDataset({ action: "go", target: "picture" });
clickDataset({ action: "pick-picture", id: "be" });
clickDataset({ action: "go", target: "listening" });
clickDataset({ action: "pick-listening", id: "be" });
clickDataset({ action: "go", target: "keyboard" });
includesAll(app.innerHTML, ["键盘步骤", "第 1 步", "点击 ب", "还差 1 键"], "letter keyboard guide");
clickDataset({ action: "key", key: "ب" });
includesAll(app.innerHTML, ["已完成", "完成课程"], "completed letter keyboard guide");
clickDataset({ action: "go", target: "complete" });
includesAll(app.innerHTML, ["闭环完成", "4 / 4"], "completed letter loop");
assert.equal(savedProgress().learningProgress.letters["dot-bone"].completed, true, "completed loop should be saved locally");
assert.equal(savedProgress().mistakes.length, 1, "mistakes should be saved locally");

includesAll(
  renderState("state.screen = 'complete'"),
  ["下一步建议", "复习本组", "进入第二单元"],
  "unit one complete"
);
assert.ok(app.innerHTML.includes("ب / پ"), "unit one completion should separate learned letters with punctuation");

includesAll(
  renderState("state.screen = 'comboComplete'"),
  ["下一步建议", "复习组合", "进入第三单元"],
  "unit two complete"
);
assert.ok(app.innerHTML.includes("با / پا"), "unit two completion should separate learned combinations with punctuation");

includesAll(
  renderState("state.screen = 'comboKeyboard'; state.selectedComboGroupId = 'open-a'; state.currentComboItemId = 'ba'; state.keyboardValue = ''"),
  ["键盘步骤", "ب → ا", "点击 ب", "还差 2 键"],
  "combo keyboard guide"
);
clickDataset({ action: "key", key: "ب" });
includesAll(app.innerHTML, ["第 2 步", "点击 ا", "已输入 ب"], "combo keyboard guide after first key");

includesAll(
  renderState("state.screen = 'vocabKeyboard'; state.selectedVocabGroupId = 'family'; state.currentVocabItemId = 'ana-family'; state.keyboardValue = ''"),
  ["键盘步骤", "ئا → ن → ا", "点击 ئا", "还差 3 键"],
  "vocab keyboard guide"
);

includesAll(
  renderState("state.screen = 'practiceSession'; state.selectedPracticeGroupId = 'writing-loop'; state.currentPracticeItemId = 'practice-write-ana'; state.keyboardValue = ''"),
  ["手写板", "writing-canvas", "清空画布"],
  "practice writing canvas"
);
assert.ok(!app.innerHTML.includes("键盘步骤"), "practice writing entry should not show keyboard steps");
assert.ok(!app.innerHTML.includes("对比正确写法"), "practice writing entry should remove the duplicate comparison card");
assert.ok(!app.innerHTML.includes("完成后评价"), "practice writing entry should remove the duplicate self-check card");
clickDataset({ action: "go", target: "practiceComplete" });
assert.equal(savedProgress().learningProgress.practice["writing-loop"].completed, true, "practice writing should complete from the result action");

includesAll(
  renderState("state.screen = 'practiceSession'; state.selectedPracticeGroupId = 'keyboard-loop'; state.currentPracticeItemId = 'practice-keyboard-ana'; state.keyboardValue = ''"),
  ["键盘步骤", "ئا → ن → ا", "点击 ئا", "还差 3 键"],
  "practice keyboard guide"
);
assert.ok(!app.innerHTML.includes("对比正确写法"), "practice keyboard entry should not show writing comparison");
assert.ok(!app.innerHTML.includes("完成后评价"), "practice keyboard entry should not show writing self-check");

includesAll(
  renderState("state.screen = 'vocabComplete'"),
  ["下一步建议", "复习主题词", "进入第五单元"],
  "unit four vocabulary complete"
);

includesAll(
  renderState("state.screen = 'practiceComplete'"),
  ["下一步建议", "再练一轮", "进入第四单元"],
  "unit three practice complete"
);

console.log("unit learning experience checks passed");
