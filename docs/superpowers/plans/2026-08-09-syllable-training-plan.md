# 拼读与音节训练营 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在基础组合之后加入稳定 ID 为 `syllable-training` 的新单元，以两字母热身、音节规则、连读/断读专项和短句分音节朗读形成逐级训练，并把两类错题分开保存。

**Architecture:** 单元内容和已审校音节/时间戳放在独立数据模块；短句只引用现有真人阅读音频的稳定 item ID，不复制音频文件。现有音频控制器增加可测试的片段播放能力。`app.js` 新增训练营专属 screen 和 progress scope，连接错题、断开错题使用两个独立 ID 列表持久化。

**Tech Stack:** 原生 JavaScript、现有 WebM 真人音频、HTML Audio API、Node.js `assert`/`vm` 测试、HTML/CSS。

## Global Constraints

- 依赖完成版本顺序计划；可与拉丁书写计划并行开发，但合并时 `syllable-training` 必须位于 `combos` 和 `basic-phrases` 之间。
- 不修改现有基础组合单元的数据；热身题只引用其稳定 item ID。
- 音节辅助标记不能改写标准维吾尔拼写。
- 逐音节片段必须有人工核听的 start/end 毫秒；没有时间戳时只显示慢速/正常整句，不伪造片段。
- 所有新规则、拆分与连接判断在发布前必须经过维吾尔语母语/教学审校。
- 连接错误和断开错误必须分开保存、分开复习。
- 不批量删除任何文件；提交时保留当前未提交改动。

---

### Task 1: 建立训练营数据契约与内容审校门

**Files:**
- Read: `/Users/nigarayaskar/Desktop/Nigarayyy/维吾尔语/chat_file_1040g3c8323k5f72q0o005o52folg8tovkartrmg_大众维语（上）.pdf`
- Read: `/Users/nigarayaskar/Desktop/Nigarayyy/维吾尔语/chat_file_1040g3c8323k5f72q0o0g5o52folg8tovbr82ub0_大众维语（下）.pdf`
- Create: `prototype/course-data/syllable-data.js`
- Create: `tests/syllable-data.test.mjs`
- Create: `课程/音节/拼读与音节训练营审校表.md`
- Modify: `prototype/index.html:18-35`
- Modify: `prototype/course-data.js:1-35`
- Modify: `scripts/check-project.mjs`
- Modify: `scripts/edition-core-files.mjs`

- [ ] **Step 0: 用 PDF 阅读能力核对拼读与音节教学节奏**

在审校表中记录教材涉及两字母组合、音节、连写/断写和短句跟读的文件名与 PDF 页码，只借鉴难度顺序和术语范围，不复制连续课文，也不把教材中未明确说明的规则自行补成“教材规则”。

- [ ] **Step 1: 写失败测试，固定单元层级和复用边界**

```js
assert.equal(data.unit.id, "syllable-training");
assert.deepEqual(data.sections.map((section) => section.id), [
  "two-letter-warmup", "syllable-rules", "connection-errors", "sentence-reading"
]);
assert.deepEqual(data.twoLetterItems.map((item) => item.sourceComboId), [
  "ba", "pa", "ta", "na", "la", "ma", "be-e", "pe-e", "te-e", "ne-e"
]);
assert.ok(data.rules.every((rule) => rule.exercises.length >= 3 && rule.exercises.length <= 5));
assert.ok(data.connectionItems.some((item) => item.mistakeBucket === "connection"));
assert.ok(data.connectionItems.some((item) => item.mistakeBucket === "break"));
assert.ok(data.sentences.every((item) => item.standard.replace(/[\s.؟،]/g, "") === item.syllables.map((part) => part.text).join("").replace(/[\s.؟،]/g, "")));
```

- [ ] **Step 2: 运行测试并确认模块不存在**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/syllable-data.test.mjs`

Expected: FAIL。

- [ ] **Step 3: 创建明确的数据 schema**

```js
const unit = {
  id: "syllable-training",
  name: "拼读与音节训练营",
  subtitle: "从两字母组合到短句分音节朗读",
  description: "先把两个字母稳定拼起来，再学习音节、连接与断开，最后回到完整短句。",
  bullets: ["两字母热身", "音节划分规则", "连读与断读", "短句拆分朗读"]
};

const REQUIRED_SENTENCE_FIELDS = Object.freeze([
  "id", "sourceReadingItemId", "standard", "syllables",
  "reviewStatus", "reviewedBy", "reviewedAt"
]);
const REQUIRED_SYLLABLE_FIELDS = Object.freeze(["text", "latin", "startMs", "endMs"]);
```

每条真实数据必须有唯一 ID、现有来源 ID、标准句、拆分结果和审校元数据；验证器逐项检查上述字段。

- [ ] **Step 4: 编写四条受控候选规则并建立审校表**

规则 ID 固定为：`vowel-nucleus`、`single-consonant-boundary`、`two-consonant-boundary`、`suffix-boundary`。审校表逐条列出中文说明、维吾尔例词、ULY、3–5 道题、例外范围和审校结论。只有 `reviewStatus: "approved"` 的规则进入 `data.rules`；其余保留在审校文档，不进入浏览器发布数据。

- [ ] **Step 5: 建立连接专项候选集**

从现有 `three-step` 和 `connection-breaks` 组合中选择至少 6 个正确连接和 6 个正确断开例子。每题保存 `standard`、`distractor`、`explanation`、`mistakeBucket` 和 `sourceComboId`；母语者确认前不写 `approved`。

- [ ] **Step 6: 建立 6 句逐步变难的短句候选集**

只选择已有真人阅读音频的稳定 ID；先用两词短句，再增加到短而完整的句子。审校表记录每句标准拼写、音节拆分、ULY、来源 item ID、音频路径与核听结论。时间戳字段只有在 Task 3 核听后加入。

- [ ] **Step 7: 人工内容关卡——审校规则、拆分和连接判断**

向用户提交审校表。任何未批准规则/题目/句子不进入发布数组。此关卡通过后，将批准数据逐条写入 `syllable-data.js`；不得使用“待补充”卡片占位。

- [ ] **Step 8: 合并数据、加入 catalog 和总检查**

在 `combo-data.js` 后加载 `syllable-data.js`。`course-data.js` 校验模块存在并导出 `syllableTraining`；`app.js` 加入 `actionTarget: "syllableWarmup"`。顺序测试扩展断言该单元处于第四位（两版相同）。

- [ ] **Step 9: 运行测试并提交**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/syllable-data.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/course-data-integrity.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-order.test.mjs`

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/sync-cn-core.mjs
git add prototype/course-data/syllable-data.js prototype/course-data.js prototype/index.html tests/syllable-data.test.mjs tests/course-data-integrity.test.mjs tests/unit-order.test.mjs scripts/check-project.mjs scripts/edition-core-files.mjs 课程/音节/拼读与音节训练营审校表.md
git commit -m "feat: add reviewed syllable training data"
```

### Task 2: 实现两字母热身和即时规则练习

**Files:**
- Modify: `prototype/app.js:390-460,866-1165,1788-2000,2119-2260,2765-2800,3361-3865,5155-5560`
- Modify: `prototype/styles.css`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

- [ ] **Step 1: 写失败交互测试**

断言热身只显示 10 个批准的两字母 item，且 `sourceComboId` 可以在现有 `comboGroups` 中找到；每道题先显示 `parts`，点击“合起来读”后显示标准组合与现有真人组合音频。规则卡后立即出现该规则自己的 3–5 题，不能先展示全部规则再集中测试。

- [ ] **Step 2: 运行测试并确认 screen 不存在**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Expected: FAIL。

- [ ] **Step 3: 新增训练营状态和 screen**

新增 `syllableSectionId`、`syllableItemIndex`、`syllableRuleId`、`syllableAnswerId`、`syllableShowStandard`。screens 固定为 `syllableWarmup`、`syllableRules`、`syllableConnections`、`syllableSentences`、`syllableReview`。状态切换时不修改原 `selectedComboGroupId` 或现有 combo 进度。

- [ ] **Step 4: 复用现有组合和音频映射**

```js
function sourceComboForSyllable(item) {
  return basicComboGroups.flatMap((group) => group.items).find((combo) => combo.id === item.sourceComboId) || null;
}
```

热身完成记在 `learningProgress.syllableTraining["two-letter-warmup"]`，不重复写入 `learningProgress.combos`。

- [ ] **Step 5: 实现规则题即时反馈**

答题后显示批准的解释；答错可以继续，完成条件是提交每条规则的全部题，不以一次全对作为通关门槛。

- [ ] **Step 6: 运行测试并提交**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/full-content-render.test.mjs`

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: add syllable warmup and rule practice"
```

### Task 3: 为现有音频增加经过核听的逐音节片段播放

**Files:**
- Modify: `prototype/audio-controller.js:1-70`
- Modify: `tests/audio-controller.test.mjs`
- Modify: `prototype/course-data/syllable-data.js`
- Modify: `课程/音节/拼读与音节训练营审校表.md`

- [ ] **Step 1: 写失败测试，固定片段边界、停止和播放速率**

```js
assert.equal(controller.playSegment({ src: "./sentence.webm", startMs: 420, endMs: 860, contentKey: "s1:2" }), true);
assert.equal(instances[0].currentTime, 0.42);
instances[0].dispatch("timeupdate", { currentTime: 0.87 });
assert.equal(instances[0].paused, true);
assert.equal(controller.playSegment({ src: "./sentence.webm", startMs: 900, endMs: 800 }), false);
```

补充断言：切换句子会停止旧片段；`setRate(0.75)` 用于慢速整句，逐音节默认 1.0；重复监听器会被清理。

- [ ] **Step 2: 运行测试并确认 `playSegment` 不存在**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/audio-controller.test.mjs`

Expected: FAIL。

- [ ] **Step 3: 实现片段播放而不破坏现有 `play` API**

`playSegment` 校验 `0 <= startMs < endMs`，创建音频后设置 `currentTime = startMs / 1000`，监听 `timeupdate`，到达 end 时 `pause()` 并将 `playing` 设为 false。`stop()` 和下一次 `play()` 都移除旧监听器。

- [ ] **Step 4: 对 6 句音频逐句核听时间戳**

使用浏览器音频或波形工具，逐个记录每个音节的 start/end 毫秒；相邻片段不得反序或重叠超过 40ms，最后一个 end 不得超过文件 duration。审校表记录核听日期与核听人。

- [ ] **Step 5: 增加数据完整性测试**

对每句断言所有时间戳有限、递增、`endMs > startMs`，并且每个 `sourceReadingItemId` 能解析到现有 `readingAudioByItemId`。没有完成核听的句子不显示逐音节按钮，但仍可慢速/正常播放完整已有音频。

- [ ] **Step 6: 运行测试并提交**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/audio-controller.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/syllable-data.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/human-audio.test.mjs`

```bash
git add prototype/audio-controller.js prototype/course-data/syllable-data.js tests/audio-controller.test.mjs tests/syllable-data.test.mjs 课程/音节/拼读与音节训练营审校表.md
git commit -m "feat: play reviewed syllable audio segments"
```

### Task 4: 实现连读/断读专项和分桶错题复习

**Files:**
- Modify: `prototype/app.js:390-785,1200-1290,4300-4720,5155-5560`
- Modify: `prototype/styles.css`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/cloud-sync.test.mjs`

- [ ] **Step 1: 写失败测试，证明两类错题独立**

```js
assert.deepEqual(state.syllableMistakes, { connection: [], break: [] });
// 答错一个 connection 和一个 break 后
assert.deepEqual(state.syllableMistakes.connection, ["connect-question-id"]);
assert.deepEqual(state.syllableMistakes.break, ["break-question-id"]);
```

保存、重载、本地备份、游客转登录备份和云端 snapshot 后仍应保留两个 bucket；旧 snapshot 缺失该字段时归一化为空 bucket。

- [ ] **Step 2: 运行测试并确认当前 state 没有独立 bucket**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/cloud-sync.test.mjs`

Expected: FAIL。

- [ ] **Step 3: 添加归一化和持久化**

```js
function normalizeSyllableMistakes(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    connection: [...new Set(Array.isArray(source.connection) ? source.connection.filter((id) => typeof id === "string") : [])].slice(0, 24),
    break: [...new Set(Array.isArray(source.break) ? source.break.filter((id) => typeof id === "string") : [])].slice(0, 24)
  };
}
```

把 `syllableMistakes` 加入本地保存、导出、guest backup、cloud snapshot 和清除学习记录；不混入现有通用 `mistakes`。

- [ ] **Step 4: 构建正确/错误对比题和两类复习入口**

每题只在作答后显示 explanation。训练营复习页分别显示“连接错误”和“断开错误”的数量与入口；某 bucket 清空时只显示该类已完成，不影响另一类。

- [ ] **Step 5: 运行持久化与交互测试**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/local-progress-transfer.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/cloud-sync.test.mjs`

Expected: PASS。

- [ ] **Step 6: 提交本任务**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/local-progress-transfer.test.mjs tests/cloud-sync.test.mjs
git commit -m "feat: separate connection and break mistakes"
```

### Task 5: 完成短句拆分、标准拼写切换和三种音频模式

**Files:**
- Modify: `prototype/app.js:1850-1927,4153-4300,5155-5560`
- Modify: `prototype/styles.css`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/human-audio.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

- [ ] **Step 1: 写失败 UI 测试**

默认显示按音节分开的辅助层；点击 `show-standard-sentence` 后显示完全等于数据 `standard` 的正常书写，不向标准字符串插入连字符、空格或颜色标记。每句提供“逐音节”“慢速整句”“正常整句”；只有时间戳完整时启用逐音节。

- [ ] **Step 2: 运行测试并确认 screen 尚未实现**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Expected: FAIL。

- [ ] **Step 3: 实现句子两层显示**

辅助层把每个音节放进独立 span，但复制/标准层直接使用 `sentence.standard`。维吾尔文本容器 `dir="rtl"`，ULY 控件与音频按钮保持 LTR，不把 DOM 顺序反向拼接。

- [ ] **Step 4: 接入三种音频动作**

`play-syllable-part` 调用 `audioController.playSegment`；慢速整句先 `setRate(0.75)` 再调用现有 `play`；正常整句先 `setRate(1)`。切换句子前 `stop()`，避免上一句片段继续播放。

- [ ] **Step 5: 完成条件和下一课**

每句至少查看过辅助层、标准层并播放过任一可用音频模式后标记完成；不得要求逐音节时间戳存在才通关。全部四板块完成后，下一课由顺序模块指向 `basic-phrases`。

- [ ] **Step 6: 运行全量测试与视觉检查**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/sync-cn-core.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs`

在 1440×900 与 390×844 下确认：音节 chips 不制造页面横向滚动，标准句字形不被切断，三个按钮可换行，播放切换不会重叠。

- [ ] **Step 7: 提交本任务**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/human-audio.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: add syllable sentence reading modes"
```

### Task 6: 收口总进度与版本回归

**Files:**
- Modify: `prototype/app.js:1258-1375,4785-5035`
- Modify: `tests/course-data-integrity.test.mjs`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `scripts/check-project.mjs`

- [ ] **Step 1: 加入四板块进度摘要**

总进度分母取当前发布数据的热身、规则、连接专项和短句完成项，不为未审校/未发布内容虚增。旧记录没有 scope 时显示 0，不影响现有单元百分比。

- [ ] **Step 2: 扩展两版最终顺序测试**

国内版当前含本单元的目录中 `syllable-training` 为第四；海外版相同。现有 `combos` 和 `basic-phrases` ID 不变，完成组合后的下一课指向本单元，完成本单元后指向日常用语。

- [ ] **Step 3: 运行全量检查**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/sync-cn-core.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs`

Expected: 课程数据、音频、云同步、渲染、版本 parity 与 `git diff --check` 全部通过。

- [ ] **Step 4: 提交回归收口**

```bash
git add prototype/app.js tests/course-data-integrity.test.mjs tests/unit-learning-experience.test.mjs scripts/check-project.mjs
git commit -m "test: verify syllable training progression"
```

## Plan 3 完成判定

- `syllable-training` 在两版均为第四单元，旧单元内容和稳定 ID 未改。
- 热身引用现有两字母组合；每条已发布规则有 3–5 道即时练习。
- 连接/断开题经过审校，错题在本地、备份与云 snapshot 中分桶保存。
- 短句可在音节辅助与标准拼写间切换；标准句字符串没有被教学分隔符改写。
- 逐音节只使用核听时间戳，慢速为 0.75、正常为 1.0，并复用现有真人音频。
- 国内外共享核心和全量检查通过。
