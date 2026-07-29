# 写法例词音频 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 复用已有单词音频，让有录音的写法例词可以点击播放，并把其余去重例词加入录音中心待录清单。

**Architecture:** 从 `letterDetails[*].formExamples` 派生一个按完整维吾尔语词形去重的例词目录。例词音频解析优先使用专用例词音频，其次使用词汇音频，最后使用组合音频；同一词的所有出现位置共享解析结果和录音目标。录音中心新增 `form-example` 分类，学习页只为真正可播放的例词渲染按钮。

**Tech Stack:** 原生 JavaScript、HTML/CSS、Node.js `node:test`/`assert` 风格检查、Codex Browser 本地页面验证。

## Global Constraints

- 例词总数按完整维吾尔语词形去重，当前基线为 126。
- 当前可复用音频基线为 32，待录基线为 94。
- 同一个例词只创建一个录音目标，并在所有字母页面复用。
- 不把待录例词加入第三单元正式词汇数据。
- 不拆分例词的阿拉伯文本节点，不破坏红色字母范围高亮。
- 静态例词不渲染禁用或空播放按钮。
- 浏览器录制结果只有加入项目音频目录并登记后才能用于课程播放。
- 保留工作区现有改动，只暂存本计划列出的文件；仓库未配置作者身份时不得修改全局 Git 配置。

---

### Task 1: 建立去重例词目录、音频解析和录音目标

**Files:**
- Modify: `prototype/app.js:39-115`
- Modify: `prototype/app.js:724-829`
- Modify: `tests/human-audio.test.mjs:218-270`

**Interfaces:**
- Consumes: `letterDetails`, `vocabAudioItems`, `comboAudioItems`, `createAudioItem(...)`, `recordingTargetFromAudio(...)`
- Produces: `formExampleItems`, `formExampleAudioForWord(value)`, `formExampleRecordingTargets()`, `stableFormExampleKey(value)`

- [ ] **Step 1: Write the failing audio coverage test**

Update the recording coverage section in `tests/human-audio.test.mjs`:

```js
const expectedRecordingCoverage = {
  alphabet: { total: 32, recorded: 32, pending: 0 },
  "form-example": { total: 126, recorded: 32, pending: 94 },
  combo: { total: 34, recorded: 34, pending: 0 },
  vocab: { total: 209, recorded: 209, pending: 0 },
  reading: { total: 164, recorded: 164, pending: 0 }
};

assert.deepEqual(
  recordingCategories.map((category) => category.id),
  ["alphabet", "form-example", "combo", "vocab", "reading"],
  "recording center should include the deduplicated form example category"
);
assert.equal(allRecordingTargets.length, 565, "recording center should list all 565 recording targets");
assert.equal(new Set(allRecordingTargets.map((item) => item.id)).size, 565, "recording target IDs should be unique");
assert.equal(allRecordingTargets.filter((item) => item.existingAudio).length, 471, "recording center should recognize 471 connected recordings");
assert.equal(allRecordingTargets.filter((item) => !item.existingAudio).length, 94, "recording center should list 94 pending form example recordings");

const formExampleTargets = recordingCategories.find((category) => category.id === "form-example").items;
assert.equal(new Set(formExampleTargets.map((item) => item.value)).size, 126, "form example recording targets should be unique by word");
assert.equal(formExampleTargets.find((item) => item.value === "ئانا").existingAudio, true, "ئانا should reuse a vocabulary recording");
assert.equal(formExampleTargets.find((item) => item.value === "قارا").existingAudio, true, "قارا should reuse a vocabulary recording");
assert.equal(formExampleTargets.find((item) => item.value === "ئالما").existingAudio, false, "ئالما should stay pending");
assert.equal(formExampleTargets.find((item) => item.value === "خەلقئارا").existingAudio, false, "خەلقئارا should stay pending");
assert.match(
  formExampleTargets.find((item) => item.value === "ئالما").fileBase,
  /^voice_form_example_[a-z0-9]+$/,
  "pending example recordings should use stable form-example filenames"
);
```

- [ ] **Step 2: Run the audio test and verify RED**

Run:

```bash
'/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' tests/human-audio.test.mjs
```

Expected: FAIL because `recordingCategoryData()` does not contain `form-example` and still reports 439 total targets.

- [ ] **Step 3: Implement stable keys and the unique form example catalog**

Add near the audio-map construction in `prototype/app.js`:

```js
function stableFormExampleKey(value) {
  let hash = 2166136261;
  for (const char of value.normalize("NFC")) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function buildFormExampleItems() {
  const byValue = new Map();

  Object.entries(letterDetails).forEach(([letterId, letter]) => {
    (letter.formExamples || []).forEach((example) => {
      if (!example.word) return;
      const current = byValue.get(example.word);
      const occurrence = { letterId, label: example.label };

      if (current) {
        current.latin ||= example.latin || "";
        current.meaning ||= example.meaning || "";
        current.occurrences.push(occurrence);
        return;
      }

      byValue.set(example.word, {
        id: `form-example-${stableFormExampleKey(example.word)}`,
        key: stableFormExampleKey(example.word),
        value: example.word,
        latin: example.latin || "",
        meaning: example.meaning || "",
        occurrences: [occurrence]
      });
    });
  });

  return [...byValue.values()];
}

const formExampleItems = buildFormExampleItems();
```

- [ ] **Step 4: Implement exact-value audio resolution**

Add lookup helpers after `comboAudioByItemId` and `vocabAudioByItemId`:

```js
function firstAudioByValue(items) {
  const result = new Map();
  items.forEach((item) => {
    if (!result.has(item.value)) result.set(item.value, item);
  });
  return result;
}

const vocabAudioByValue = firstAudioByValue(vocabAudioItems);
const comboAudioByValue = firstAudioByValue(comboAudioItems);
const connectedFormExampleAudioIds = new Set();

const dedicatedFormExampleAudioByValue = new Map(
  formExampleItems
    .filter((item) => connectedFormExampleAudioIds.has(item.id))
    .map((item, index) => [
      item.value,
      createAudioItem({
        folder: "form-examples",
        prefix: "form_example",
        id: item.id,
        fileId: item.key,
        value: item.value,
        latin: item.latin || "未提供转写",
        order: index + 1
      })
    ])
);

function formExampleAudioForWord(value) {
  return dedicatedFormExampleAudioByValue.get(value) || vocabAudioByValue.get(value) || comboAudioByValue.get(value) || null;
}
```

This gives future dedicated recordings priority without changing the 32 current reuse matches.

- [ ] **Step 5: Allow a recording target to override its download filename**

Change `recordingTargetFromAudio` to accept `fileBase = ""` and use it first:

```js
function recordingTargetFromAudio({ id, categoryId, categoryTitle, unit, groupTitle, value, latin, kind, audio, fileBase = "" }) {
  const fallbackId = id.startsWith(`${categoryId}-`) ? id.slice(categoryId.length + 1) : id;
  return {
    id,
    categoryId,
    categoryTitle,
    unit,
    groupTitle,
    value,
    latin,
    kind,
    existingAudio: Boolean(audio?.file || audio?.outputPath || audio?.src),
    fileBase: fileBase || (audio?.file ? voiceFileBase(audio.file) : `voice_${categoryId}_${safeAudioId(fallbackId)}`)
  };
}
```

- [ ] **Step 6: Add deduplicated form example recording targets**

Add:

```js
function formExampleRecordingTargets() {
  return formExampleItems.map((item) =>
    recordingTargetFromAudio({
      id: item.id,
      categoryId: "form-example",
      categoryTitle: "例词",
      unit: "第一单元",
      groupTitle: "写法例词",
      value: item.value,
      latin: item.latin || "未提供转写",
      kind: item.meaning || "写法例词",
      audio: formExampleAudioForWord(item.value),
      fileBase: `voice_form_example_${item.key}`
    })
  );
}
```

Insert the category directly after `alphabet`:

```js
function recordingCategoryData() {
  return [
    { id: "alphabet", title: "字母", items: alphabetRecordingTargets() },
    { id: "form-example", title: "例词", items: formExampleRecordingTargets() },
    { id: "combo", title: "组合", items: comboRecordingTargets() },
    { id: "vocab", title: "词汇", items: vocabRecordingTargets() },
    { id: "reading", title: "句子", items: readingRecordingTargets() }
  ];
}
```

- [ ] **Step 7: Run the audio test and verify GREEN**

Run:

```bash
'/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' tests/human-audio.test.mjs
```

Expected: `human audio checks passed`.

- [ ] **Step 8: Commit only Task 1 files**

```bash
git add -- prototype/app.js tests/human-audio.test.mjs
git commit -m "feat: add form example recording targets"
```

If Git author identity is still missing, do not change global configuration; leave the Task 1 files unstaged and report the commit blocker.

---

### Task 2: Connect existing audio to clickable form example words

**Files:**
- Modify: `prototype/app.js:2238-2285`
- Modify: `prototype/styles.css:1315-1370`
- Modify: `tests/unit-learning-experience.test.mjs:650-705`

**Interfaces:**
- Consumes: `formExampleAudioForWord(value)`, `isAudioPlayable(audio)`, the existing `play-audio` action
- Produces: playable `.form-example-audio-word` buttons that retain `.form-example-word-text` and range data

- [ ] **Step 1: Write failing rendering and interaction tests**

Extend the `aaLetterLessonHtml` assertions:

```js
assert.ok(
  aaLetterLessonHtml.includes('class="uyghur form-example-word-text form-example-audio-word"') &&
    aaLetterLessonHtml.includes('data-audio-src="./assets/audio/human/vocab/human_vocab_ana_family.webm"') &&
    aaLetterLessonHtml.includes('aria-label="播放 ئانا"'),
  "ئانا should be a playable form example word"
);
assert.ok(
  aaLetterLessonHtml.includes('data-audio-src="./assets/audio/human/vocab/human_vocab_qara_color.webm"') &&
    aaLetterLessonHtml.includes('aria-label="播放 قارا"'),
  "قارا should be a playable form example word"
);
assert.ok(
  /<strong class="uyghur form-example-word-text" aria-label="ئالما"[^>]*>ئالما<\/strong>/.test(aaLetterLessonHtml),
  "ئالما should remain a static form example until its audio is recorded"
);
assert.ok(!aaLetterLessonHtml.includes('aria-label="播放 ئالما"'), "ئالما should not expose an invalid audio action");
assert.ok(!aaLetterLessonHtml.includes('aria-label="播放 خەلقئارا"'), "خەلقئارا should not expose an invalid audio action");
```

Add an interaction check:

```js
renderState("state.screen = 'group'; state.selectedGroupId = 'vowels-basic'; state.currentLetterId = 'aa'");
clickDataset({
  action: "play-audio",
  audioSrc: "./assets/audio/human/vocab/human_vocab_ana_family.webm",
  audioLabel: "ئانا"
});
await Promise.resolve();
assert.equal(toast.textContent, "ئانا：播放中", "clicking an existing form example audio should play it");
```

Change the style assertion to require `.form-example-word .form-example-word-text` and add:

```js
const formExampleAudioWordStyle = styleSource.match(/\.form-example-audio-word\s*\{[^}]*\}/)?.[0] || "";
assert.ok(
  formExampleAudioWordStyle.includes("cursor: pointer;") &&
    formExampleAudioWordStyle.includes("background: transparent;"),
  "playable form example words should keep a lightweight button style"
);
```

- [ ] **Step 2: Run the learning experience test and verify RED**

Run:

```bash
'/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' tests/unit-learning-experience.test.mjs
```

Expected: FAIL because `ئانا` and `قارا` are still rendered as `<strong>` elements without audio attributes.

- [ ] **Step 3: Render a playable button only when audio exists**

Replace `renderFormExampleWord` with:

```js
function formExampleTargetDataAttributes(example) {
  if (!Number.isInteger(example.targetStart) || !Number.isInteger(example.targetLength)) return "";
  return ` data-form-target-start="${example.targetStart}" data-form-target-length="${example.targetLength}"`;
}

function renderFormExampleWord(example) {
  const audio = formExampleAudioForWord(example.word);
  const targetDataAttributes = formExampleTargetDataAttributes(example);

  if (!isAudioPlayable(audio)) {
    return `<strong class="uyghur form-example-word-text" aria-label="${example.word}"${targetDataAttributes}>${example.word}</strong>`;
  }

  return `
    <button
      class="uyghur form-example-word-text form-example-audio-word"
      data-action="play-audio"
      data-audio-src="${audio.outputPath}"
      data-audio-label="${example.word}"
      ${targetDataAttributes}
      type="button"
      aria-label="播放 ${example.word}"
    >${example.word}</button>
  `;
}
```

The helper omits range attributes rather than emitting `undefined`; the existing integrity test still enforces a valid target range for every non-empty form example.

- [ ] **Step 4: Preserve form word typography for both strong and button elements**

Change:

```css
.form-example-word strong {
```

to:

```css
.form-example-word .form-example-word-text {
```

Add:

```css
.form-example-audio-word {
  appearance: none;
  padding: 0 0 2px;
  border: 0;
  border-bottom: 1px dotted rgba(14, 155, 177, 0.68);
  color: #000;
  background: transparent;
  cursor: pointer;
}

.form-example-audio-word:hover,
.form-example-audio-word:focus-visible {
  border-bottom-color: var(--teal);
  outline: 2px solid rgba(14, 155, 177, 0.28);
  outline-offset: 3px;
}
```

Keep `.form-example-word-text.is-highlight-ready` unchanged so its measured text gradient still controls the black/red glyph coloring.

- [ ] **Step 5: Run the learning experience test and verify GREEN**

Run:

```bash
'/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' tests/unit-learning-experience.test.mjs
```

Expected: `unit learning experience checks passed`.

- [ ] **Step 6: Commit only Task 2 files**

```bash
git add -- prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs
git commit -m "feat: play audio from form example words"
```

If Git author identity is still missing, do not change global configuration; leave the Task 2 files unstaged and report the commit blocker.

---

### Task 3: Verify the recording workflow, refresh assets, and run full QA

**Files:**
- Modify: `prototype/index.html:7-20`
- Modify: `tests/unit-learning-experience.test.mjs:29-34`
- Verify: `prototype/app.js`
- Verify: `prototype/styles.css`
- Verify: `tests/human-audio.test.mjs`

**Interfaces:**
- Consumes: completed Task 1 and Task 2 behavior
- Produces: refreshed browser assets and evidence that the 94-item recording queue and clickable audio work

- [ ] **Step 1: Write the failing asset-version assertion**

Change the expected asset query in `tests/unit-learning-experience.test.mjs`:

```js
assert.ok(
  indexHtml.includes("?v=20260726-form-example-audio"),
  "prototype should bump its asset version after connecting form example audio"
);
```

- [ ] **Step 2: Run the learning experience test and verify RED**

Run:

```bash
'/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' tests/unit-learning-experience.test.mjs
```

Expected: FAIL because `prototype/index.html` still uses `?v=20260726-times-semibold`.

- [ ] **Step 3: Update every prototype asset query**

Change all eight stylesheet/script query strings in `prototype/index.html` from:

```html
?v=20260726-times-semibold
```

to:

```html
?v=20260726-form-example-audio
```

- [ ] **Step 4: Run the targeted tests**

Run:

```bash
'/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' tests/human-audio.test.mjs
'/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' tests/unit-learning-experience.test.mjs
```

Expected: both tests pass with no warnings.

- [ ] **Step 5: Run the complete project check**

Run:

```bash
'/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' scripts/check-project.mjs
```

Expected:

```text
course data integrity checks passed
unit learning experience checks passed
human audio checks passed
full content render checks passed (466 states)
All project checks passed.
```

- [ ] **Step 6: Validate the rendered target flow with Codex Browser**

The flow under test is: `字母 ئا 学习页 -> 点击已有音频例词 -> 播放提示 -> 录音页例词分类 -> 94 个待录目标可选`.

Use the existing Browser binding and tab:

```js
await tab.reload();
await tab.url();
await tab.title();
await tab.playwright.domSnapshot();
await tab.dev.logs({ levels: ["error", "warn"], limit: 50 });
```

Then verify:

- 字母 `ئا` 页显示 4 个例词；
- `ئانا`、`قارا` 各有一个唯一播放按钮；
- 点击 `ئانا` 后出现 `ئانا：播放中`；
- `ئالما`、`خەلقئارا` 没有播放按钮；
- 录音页存在唯一的“例词 · 94”待录分类；
- 选择例词分类后能看到并唯一选择 `ئالما` 和 `خەلقئارا`；
- 页面没有框架错误层或相关控制台错误；
- 截图中例词红色高亮、连写、卡片布局均正常。

- [ ] **Step 7: Commit the asset refresh and final test updates**

```bash
git add -- prototype/index.html tests/unit-learning-experience.test.mjs
git commit -m "test: verify form example audio workflow"
```

If Git author identity is still missing, do not change global configuration; leave the Task 3 files unstaged and report the commit blocker.
