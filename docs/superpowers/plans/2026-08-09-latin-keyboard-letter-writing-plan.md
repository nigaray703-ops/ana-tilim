# 拉丁键盘与字母书写强化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在第一单元之后加入稳定 ID 为 `latin-keyboard-writing` 的新单元，教普通拉丁 QWERTY、8 个元音与 24 个辅音、ULY 提示默写，以及可在画布中同步切换的四种静态字形参考。

**Architecture:** 单元内容放入独立课程数据模块；普通拉丁键盘使用独立纯函数，绝不复用现有维吾尔键盘映射。`app.js` 复用现有卡片、画布、音频和进度基础设施，新增单元专属 screen/state。四种形式直接来自现有 `letterDetails.forms`，并通过“显示参考—隐藏参考—书写—揭晓对照”代替笔画动画。

**Tech Stack:** 原生 JavaScript、Canvas 2D、现有 ULY/真人字母音频、Node.js `assert`/`vm` 测试、HTML/CSS。

## Global Constraints

- 依赖先完成 `2026-08-09-edition-order-progress-plan.md`。
- 按实体键盘 `QWERTY` 必须得到 `qwerty`，不得输出维吾尔字母。
- 现有第一单元的维吾尔键盘、听音选择和课程内容保持不变。
- 字母分类必须严格为 8 个元音、24 个辅音、共 32 个不同 ID。
- 手写只做自我对照，不做自动识别或伪准确率。
- 本阶段不创建或显示笔画动画，也不暗示静态参考等同于逐笔教学。
- 不批量删除任何文件；提交时不得暂存用户现有无关改动。

---

### Task 1: 审核教材参考范围并固定课程数据契约

**Files:**
- Read: `/Users/nigarayaskar/Desktop/Nigarayyy/维吾尔语/chat_file_1040g3c8323k5f72q0o005o52folg8tovkartrmg_大众维语（上）.pdf`
- Read: `/Users/nigarayaskar/Desktop/Nigarayyy/维吾尔语/chat_file_1040g3c8323k5f72q0o0g5o52folg8tovbr82ub0_大众维语（下）.pdf`
- Create: `课程/字母/拉丁键盘与书写-教材参考审计.md`
- Create: `prototype/course-data/latin-writing-data.js`
- Create: `tests/latin-writing-data.test.mjs`
- Modify: `prototype/index.html:18-35`
- Modify: `prototype/course-data.js:1-32`
- Modify: `scripts/check-project.mjs`
- Modify: `scripts/edition-core-files.mjs`

- [ ] **Step 1: 使用 PDF 阅读能力定位字母分类、字形与书写相关页**

审计文档逐条记录“PDF 文件名、PDF 页码、可借鉴的教学节奏、可核对的四种字形、不可直接复制的正文”。静态形式仍以项目现有 `letterDetails.forms` 为唯一运行时来源，不从字体外形推断笔画。

- [ ] **Step 2: 先写失败的数据完整性测试**

```js
const vowels = ["aa", "ae", "o", "u", "oe", "ue", "ee", "ii"];
const consonants = [
  "be", "pe", "te", "jim", "che", "khe", "dal", "re", "ze", "zhe", "sin", "shin",
  "ghayn", "fe", "qaf", "kaf", "gaf", "ng", "lam", "mim", "nun", "he", "waw", "ye"
];
assert.deepEqual(data.vowelLetterIds, vowels);
assert.deepEqual(data.consonantLetterIds, consonants);
assert.equal(new Set([...vowels, ...consonants]).size, 32);
assert.deepEqual(data.vowelComparisons.map((item) => item.letterIds), [
  ["aa", "ae"], ["o", "u"], ["oe", "ue"], ["ee", "ii"]
]);
assert.equal(data.unit.id, "latin-keyboard-writing");
```

- [ ] **Step 3: 运行测试并确认数据模块不存在**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/latin-writing-data.test.mjs`

Expected: FAIL。

- [ ] **Step 4: 创建专注数据模块**

```js
(() => {
  const vowelLetterIds = ["aa", "ae", "o", "u", "oe", "ue", "ee", "ii"];
  const consonantLetterIds = [
    "be", "pe", "te", "jim", "che", "khe", "dal", "re", "ze", "zhe", "sin", "shin",
    "ghayn", "fe", "qaf", "kaf", "gaf", "ng", "lam", "mim", "nun", "he", "waw", "ye"
  ];
  const vowelComparisons = [
    { id: "a-e", letterIds: ["aa", "ae"], focus: "开口位置与字形符号" },
    { id: "o-u", letterIds: ["o", "u"], focus: "圆唇字形符号" },
    { id: "oe-ue", letterIds: ["oe", "ue"], focus: "ö 与 ü 的 ULY 符号和真人音频" },
    { id: "ee-ii", letterIds: ["ee", "ii"], focus: "ë 与 i 的字形和真人音频" }
  ];
  window.ANA_TILIM_LATIN_WRITING = Object.freeze({
    unit: {
      id: "latin-keyboard-writing",
      name: "拉丁键盘与字母书写强化",
      subtitle: "普通 QWERTY、元辅音分类与 ULY 默写",
      description: "先认识普通拉丁键位，再按元音和辅音整理字母，最后看拉丁提示练习维吾尔字母书写。",
      bullets: ["普通 QWERTY", "8 个元音", "24 个辅音", "拉丁提示默写", "四种字形"]
    },
    vowelLetterIds,
    consonantLetterIds,
    vowelComparisons
  });
})();
```

- [ ] **Step 5: 在 aggregator 中合并数据并把单元对象加入 catalog**

新脚本在 `alphabet-data.js` 后、`course-data.js` 前加载；`course-data.js` 缺少该模块时抛出明确错误。`app.js` 将 `latinWriting.unit` 映射为 `actionTarget: "latinKeyboardIntro"`。Plan 1 的顺序模块会自动把它放在 `letters` 与 `combos` 之间。

- [ ] **Step 6: 运行数据与顺序测试**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/latin-writing-data.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-order.test.mjs`

Expected: PASS；全球目录出现 10 个当前可用单元，国内目录出现 9 个，新增单元都排第二。

- [ ] **Step 7: 同步共享核心并提交**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/sync-cn-core.mjs
git add prototype/course-data/latin-writing-data.js prototype/course-data.js prototype/index.html tests/latin-writing-data.test.mjs scripts/check-project.mjs scripts/edition-core-files.mjs 课程/字母/拉丁键盘与书写-教材参考审计.md
git commit -m "feat: add latin writing course data"
```

### Task 2: 实现与维吾尔键盘完全隔离的普通 QWERTY

**Files:**
- Create: `prototype/latin-keyboard.js`
- Create: `tests/latin-keyboard.test.mjs`
- Modify: `prototype/index.html:25-35`
- Modify: `prototype/app.js:1-20,390-460,1525-1640,2119-2260,2765-2800,5155-5225`
- Modify: `prototype/styles.css`
- Modify: `scripts/check-project.mjs`
- Modify: `scripts/edition-core-files.mjs`

- [ ] **Step 1: 写失败测试，固定普通键、扩展键和修饰键行为**

```js
assert.equal(api.applyKey("", { key: "Q" }), "q");
assert.equal("QWERTY".split("").reduce((value, key) => api.applyKey(value, { key }), ""), "qwerty");
assert.equal(api.applyKey("qwerty", { key: "Backspace" }), "qwert");
assert.equal(api.applyKey("q", { key: " " }), "q ");
assert.equal(api.applyKey("q", { key: "A", metaKey: true }), "q");
assert.equal(api.applyExtendedKey("k", "ë"), "kë");
assert.equal(api.applyExtendedKey("k", "ö"), "kö");
assert.equal(api.applyExtendedKey("k", "ü"), "kü");
```

测试同时断言输出不含阿拉伯字母 Unicode 范围。

- [ ] **Step 2: 运行测试并确认模块不存在**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/latin-keyboard.test.mjs`

Expected: FAIL。

- [ ] **Step 3: 实现小型纯函数 API**

```js
(() => {
  const ROWS = Object.freeze(["qwertyuiop", "asdfghjkl", "zxcvbnm"]);
  const EXTENDED_KEYS = Object.freeze(["ë", "ö", "ü"]);
  function applyKey(value, event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return value;
    if (event.key === "Backspace") return Array.from(value).slice(0, -1).join("");
    if (event.key === " ") return `${value} `;
    return /^[a-z]$/i.test(event.key) ? `${value}${event.key.toLowerCase()}` : value;
  }
  function applyExtendedKey(value, key) {
    return EXTENDED_KEYS.includes(key) ? `${value}${key}` : value;
  }
  window.ANA_TILIM_LATIN_KEYBOARD = Object.freeze({ ROWS, EXTENDED_KEYS, applyKey, applyExtendedKey });
})();
```

- [ ] **Step 4: 添加 `latinKeyboardIntro` screen 和专属事件路由**

新增 `state.latinKeyboardValue`。实体 `keydown` 只在该 screen 调用 `ANA_TILIM_LATIN_KEYBOARD.applyKey`；现有维吾尔键盘 screen 继续调用 `ANA_TILIM_UYGHUR_KEYBOARD`。屏幕键盘显示三行 QWERTY、Backspace、Space 与单独的 `ë/ö/ü` 扩展行。

- [ ] **Step 5: 添加完成条件和进度**

目标字符串固定显示 `qwerty`；只有输入完全相等时标记 `learningProgress.latinWriting.qwerty.completed = true`。普通键输入区使用 `dir="ltr"`，维吾尔说明仍按页面方向正常布局。

- [ ] **Step 6: 运行单元和交互测试**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/latin-keyboard.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Expected: PASS；现有维吾尔键盘断言继续通过。

- [ ] **Step 7: 同步并提交**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/sync-cn-core.mjs
git add prototype/latin-keyboard.js prototype/index.html prototype/app.js prototype/styles.css tests/latin-keyboard.test.mjs tests/unit-learning-experience.test.mjs scripts/check-project.mjs scripts/edition-core-files.mjs
git commit -m "feat: teach literal latin qwerty input"
```

### Task 3: 渲染元音、辅音和元音辨认板块

**Files:**
- Modify: `prototype/app.js:1850-1920,2574-2725,2765-2800`
- Modify: `prototype/styles.css`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

- [ ] **Step 1: 写失败 UI 测试**

断言元音板块正好渲染 8 张字母卡、辅音板块 24 张；每张卡同时显示维吾尔字形与 ULY。四组元音比较每次只显示 2 个字母，并各自复用 `alphabetAudioByLetterId` 的真人字母音频。

- [ ] **Step 2: 运行测试并确认 screen 尚不存在**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Expected: FAIL。

- [ ] **Step 3: 增加 `latinLetterClasses` 与 `latinVowelCompare` screens**

用 `letterDetails[id]` 取 `letter`、`latin`、`cue`、`forms` 和现有音频，不复制第二套字母内容。元音比较使用 `vowelComparisons` 的四个固定 pair；全局“显示拉丁转写”偏好不隐藏本单元的 ULY，因为 ULY 是题目与教学目标本身。

- [ ] **Step 4: 接入单元步骤导航**

顺序固定为 QWERTY → 8/24 分类 → 元音比较 → 拉丁提示默写 → 书写参考。已完成标记使用稳定子步骤 `qwerty`、`classification`、`vowel-contrast`、`dictation`、`forms`。

- [ ] **Step 5: 运行测试并提交**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/full-content-render.test.mjs`

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: organize vowels and consonants"
```

### Task 4: 实现 ULY 提示默写和画布自我检查

**Files:**
- Modify: `prototype/app.js:390-460,1677-1765,2969-3020,5155-5225`
- Modify: `prototype/styles.css`
- Modify: `tests/unit-learning-experience.test.mjs`

- [ ] **Step 1: 写失败测试，确保揭晓前不泄露答案**

选择 `letterId: "oe"` 时，初始 HTML 必须含 `ö`，不得含答案 `ئۆ` 或任何该字母 forms；点击 `reveal-latin-dictation-answer` 后才出现标准字形、四种形式入口和“我自己比较，不是自动判分”的说明。

- [ ] **Step 2: 运行测试并确认当前画布流程会预先显示字形**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Expected: FAIL。

- [ ] **Step 3: 增加独立默写状态并复用现有 Canvas 事件**

新增 `latinDictationIndex`、`latinDictationRevealed`、`latinWritingForm`。进入下一题时清空画布并重置揭晓状态；不把笔迹序列化到进度或云端。按钮只记录“已练习/已查看答案”，不产生正确率。

- [ ] **Step 4: 加入无 Canvas 降级**

当 `getContext("2d")` 不可用，显示“当前浏览器不能自由书写，仍可查看标准字形和四种形式”，且揭晓、形式切换和下一题仍可用。

- [ ] **Step 5: 运行测试并提交**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs
git commit -m "feat: add self-check latin dictation"
```

### Task 5: 用四种静态形式和参考显隐代替笔画动画

**Files:**
- Modify: `prototype/app.js:1677-1765,2969-3020,5155-5225`
- Modify: `prototype/styles.css`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

- [ ] **Step 1: 写失败测试，固定四种形式和无动画边界**

```js
const formKeys = ["independent", "initial", "medial", "final"];
assert.deepEqual(formKeys.map((key) => formGlyph(letterDetails.oe, key)), ["ئۆ", "ئۆ", "ـۆ", "ـۆ"]);
assert.equal(state.latinWritingLetterId, "oe");
assert.equal(state.latinWritingFormKey, "independent");
```

依次点击四个形式开关后，断言 letter ID 始终为 `oe`，参考字形与淡色画布底图同步变化。页面源码和 HTML 都不得出现 stroke player、播放、暂停、重播或逐笔按钮。

- [ ] **Step 2: 实现稳定形式键到现有 forms 数组的映射**

```js
const LETTER_FORM_KEYS = Object.freeze(["independent", "initial", "medial", "final"]);
function formGlyph(letter, formKey) {
  const index = LETTER_FORM_KEYS.indexOf(formKey);
  return letter.forms[index >= 0 ? index : 0].value;
}
```

形式按钮标签继续使用“独立形、词首形、词中形、词尾形”；切换只更新 `state.latinWritingFormKey`，不更换题目、不清除学习者已经画出的线条。

- [ ] **Step 3: 实现参考显隐和淡色描摹底图**

新增 `state.latinWritingGuideVisible`，默认 `true`。显示参考时，画布下层以低对比度渲染当前 `formGlyph`；隐藏参考时只隐藏底图，不清除用户笔迹。按钮固定为“隐藏参考 / 显示参考”“清空重写”“揭晓对照”。

- [ ] **Step 4: 完成观察—隐藏—书写—比较循环**

揭晓区域并排显示当前标准字形与用户画布，不产生正确/错误或百分比。切换四种形式时揭晓区、上方大字和画布底图同步；用户可以选择保留笔迹进行形态比较，或点击“清空重写”。

- [ ] **Step 5: 保留无 Canvas 降级**

Canvas 不可用时仍显示四个形式按钮、大号标准字形和该字母现有 `writingHint`；隐藏自由书写与清空按钮，不显示功能缺失占位。

- [ ] **Step 6: 运行测试、同步并提交**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/full-content-render.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs`

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/sync-cn-core.mjs
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: add static four-form writing reference"
```

### Task 6: 完成进度、响应式和双版本回归

**Files:**
- Modify: `prototype/app.js:1258-1375,4785-5035`
- Modify: `prototype/styles.css:3000-3275`
- Modify: `tests/course-data-integrity.test.mjs`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`
- Modify: `scripts/check-project.mjs`

- [ ] **Step 1: 把本单元 5 个子步骤加入总进度**

总分母使用实际子步骤数 5；旧进度没有 `latinWriting` scope 时归一化为空对象，不改变已有 scope。完成本单元后下一课由顺序模块指向 `combos`。

- [ ] **Step 2: 增加桌面和手机回归断言**

测试必须覆盖 LTR 输入不被 RTL 反转、扩展键不溢出、32 张分类卡可访问、画布按钮不遮挡、形式 tabs 可横向适配但页面本身无横向滚动。

- [ ] **Step 3: 启动本地页面人工检查**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m http.server 4173 --directory prototype`

在 1440×900 和 390×844 下完成 QWERTY 输入、扩展键、元音比较、默写揭晓、四种形式切换、参考显隐和 Canvas 降级检查；同时回归第一单元现有字母听音选择题与维吾尔键盘。

- [ ] **Step 4: 运行双版本与全量检查**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/sync-cn-core.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs`

Expected: 国内版与海外版共享功能一致；现有第一单元维吾尔键盘测试不变；所有检查通过。

- [ ] **Step 5: 提交回归收口**

```bash
git add prototype/app.js prototype/styles.css tests/course-data-integrity.test.mjs tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs scripts/check-project.mjs
git commit -m "test: verify latin writing unit end to end"
```

## Plan 2 完成判定

- 新单元稳定 ID 为 `latin-keyboard-writing`，两版均处于第二单元。
- `QWERTY` 实体输入和屏幕输入都显示 `qwerty`；`ë/ö/ü` 只能由明确扩展键补充。
- 8 元音与 24 辅音无重复、无遗漏；元音按四组比较并复用现有真人字母音频。
- 默写揭晓前不泄露答案，画布不伪装自动识别。
- 四种形式可在同一画布中切换，标准大字和淡色描摹底图同步；页面没有笔画动画或逐笔教学承诺。
- 两版 parity 与全量测试通过。
