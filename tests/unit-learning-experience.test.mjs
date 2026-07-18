import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const indexHtml = fs.readFileSync("prototype/index.html", "utf8");
assert.ok(fs.existsSync("prototype/course-data.js"), "alphabet course data should live in a standalone data file");
const courseDataSource = fs.readFileSync("prototype/course-data.js", "utf8");
const appSource = fs.readFileSync("prototype/app.js", "utf8");
assert.ok(
  courseDataSource.includes("window.ANA_TILIM_COURSE"),
  "course data file should expose a stable window.ANA_TILIM_COURSE object"
);
assert.ok(
  appSource.includes("window.ANA_TILIM_COURSE"),
  "app should read alphabet course content from the shared course data object"
);
assert.ok(courseDataSource.includes("comboGroups"), "unit two combo course data should live in the shared data file");
assert.ok(
  !appSource.includes("const comboGroups = ["),
  "app should not define unit two combo content inline"
);
assert.ok(
  appSource.includes("comboGroups") && appSource.indexOf("comboGroups") < appSource.indexOf("const alphabetAudioByLetterId"),
  "app should read unit two combo content from the shared course data object"
);
assert.ok(courseDataSource.includes("vocabGroups"), "unit three vocabulary course data should live in the shared data file");
assert.ok(
  !appSource.includes("const vocabGroups = ["),
  "app should not define unit three vocabulary content inline"
);
assert.ok(
  appSource.includes("vocabGroups") && appSource.indexOf("vocabGroups") < appSource.indexOf("const alphabetAudioByLetterId"),
  "app should read unit three vocabulary content from the shared course data object"
);
assert.ok(
  indexHtml.indexOf("course-data.js") >= 0 && indexHtml.indexOf("course-data.js") < indexHtml.indexOf("app.js"),
  "course data should load before the app script"
);

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
vm.runInContext(fs.readFileSync("prototype/course-data.js", "utf8"), context, { filename: "prototype/course-data.js" });
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
  ["今日下一步", "继续学习", "AI 临时音频"],
  "home screen"
);
assert.ok(!app.innerHTML.includes("<br>"), "home screen should not force unit titles onto manual line breaks");
assert.ok(!app.innerHTML.includes("AI 临时音频 / 真人音频待录制"), "home audio note should use readable punctuation");
assert.ok(app.innerHTML.includes("<strong>第一单元</strong><small> · 认识字母</small>"), "home unit labels should use a compact one-line label");
assert.ok(app.innerHTML.includes("<strong>听音辨认</strong><span> · AI 临时</span>"), "quick entry labels should stay readable on one line");

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
  ["学习地图", "1 / 11", "1 / 4", "需要复习 1 个", "继续错题复习"],
  "home progress map"
);

for (const unitId of ["letters", "combos", "basic-phrases", "practice"]) {
  includesAll(
    renderState(`state.screen = 'unit'; state.selectedUnitId = '${unitId}'`),
    ["学习步骤", "进入当前学习"],
    `${unitId} unit screen`
  );
}

includesAll(
  renderState("state.screen = 'review'"),
  ["审校看板", "回填、音频、重点项"],
  "review dashboard"
);
assert.ok(!app.innerHTML.includes("回填 / 音频 / 重点项"), "review dashboard should use readable punctuation in the subtitle");
assert.ok(!app.innerHTML.includes("家庭 / 基础称呼重点项"), "review priority note should avoid slash-separated Chinese words");

includesAll(
  renderState("state.screen = 'library'"),
  ["字母库", "待审校"],
  "letter library"
);
assert.ok(!app.innerHTML.includes(" / 待审校"), "letter library should separate labels with punctuation");

includesAll(
  renderState("state.screen = 'group'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'"),
  ["1 / 4", "上一个", "下一个", "AI 临时音频", "找不同", "读音选择"],
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
  ["1 / 4", "上一个", "下一个", "不设唯一答案"],
  "vocab lesson"
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
  ["书写步骤", "起笔", "方向", "对比正确写法", "完成后评价", "点位正确"],
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
  ["书写步骤", "拆分描摹", "完成后评价", "键盘步骤", "ئا → ن → ا", "点击 ئا", "还差 3 键"],
  "practice writing keyboard guide"
);

includesAll(
  renderState("state.screen = 'vocabComplete'"),
  ["下一步建议", "复习词形", "进入第四单元"],
  "unit three complete"
);

includesAll(
  renderState("state.screen = 'practiceComplete'"),
  ["下一步建议", "再练一轮", "回到学习路径"],
  "unit four complete"
);

console.log("unit learning experience checks passed");
