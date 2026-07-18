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
let clickHandler = null;
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
    clearTimeout() {}
  },
  Audio: function FakeAudio(src) {
    this.src = src;
    this.pause = () => {};
    this.play = () => Promise.resolve();
  }
};

context.globalThis = context;
vm.createContext(context);
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

includesAll(
  renderState("state.screen = 'home'"),
  ["今日下一步", "继续学习", "AI 临时音频"],
  "home screen"
);

for (const unitId of ["letters", "combos", "basic-phrases", "practice"]) {
  includesAll(
    renderState(`state.screen = 'unit'; state.selectedUnitId = '${unitId}'`),
    ["学习步骤", "进入当前学习"],
    `${unitId} unit screen`
  );
}

includesAll(
  renderState("state.screen = 'group'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'"),
  ["1 / 4", "上一个", "下一个", "AI 临时音频"],
  "letter lesson"
);
clickDataset({ action: "select-adjacent-letter", id: "pe" });
assert.equal(vm.runInContext("state.currentLetterId", context), "pe", "next letter button should switch letters");

includesAll(
  renderState("state.screen = 'combo'; state.selectedComboGroupId = 'open-a'; state.currentComboItemId = 'ba'"),
  ["1 / 6", "上一个", "下一个", "从右往左"],
  "combo lesson"
);
clickDataset({ action: "select-adjacent-combo", id: "pa" });
assert.equal(vm.runInContext("state.currentComboItemId", context), "pa", "next combo button should switch combos");

includesAll(
  renderState("state.screen = 'vocab'; state.selectedVocabGroupId = 'family'; state.currentVocabItemId = 'ana-family'"),
  ["1 / 4", "上一个", "下一个", "不设唯一答案"],
  "vocab lesson"
);
clickDataset({ action: "select-adjacent-vocab", id: "apa-family" });
assert.equal(vm.runInContext("state.currentVocabItemId", context), "apa-family", "next vocab button should switch words");

includesAll(
  renderState("state.screen = 'complete'"),
  ["复习本组", "进入第二单元"],
  "unit one complete"
);

includesAll(
  renderState("state.screen = 'comboComplete'"),
  ["复习组合", "进入第三单元"],
  "unit two complete"
);

includesAll(
  renderState("state.screen = 'vocabComplete'"),
  ["复习词形", "进入第四单元"],
  "unit three complete"
);

includesAll(
  renderState("state.screen = 'practiceComplete'"),
  ["再练一轮", "回到学习路径"],
  "unit four complete"
);

console.log("unit learning experience checks passed");
