# 阿凡提小故事 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在课程最后加入 6 篇逐步变难、无音频、理智且有教育意义的原创改编阿凡提故事；默认只显示维吾尔文，国内版可开拉丁文/中文，海外版额外可开英文。

**Architecture:** 维吾尔文、ULY 和中文进入共享 `afanti-data.js`；英文放入只由海外版加载的 `afanti-english-data.js`。发布验证器严格检查 6 篇、长度、翻译、审校状态、理解题和 `noAudio`。阿凡提使用独立阅读 screen、独立临时语言开关和独立进度 scope，不进入现有阅读音频清单。

**Tech Stack:** 原生 JavaScript、现有课程卡片/进度系统、IntersectionObserver 降级、Node.js `assert`/`vm` 测试、HTML/CSS。

## Global Constraints

- 依赖版本顺序计划；建议在拉丁与音节单元合并后执行，以一次性验证最终 11/12 单元。
- 六篇必须是“经典阿凡提精神＋课程原创教育性改编”，不得复制教材、现代出版物或网络文章。
- 每篇只突出一个主题；不得赞美欺骗、羞辱、残忍、报复、占便宜或权力压迫。
- 所有维吾尔文、ULY、中文和海外版英文必须经母语与含义审校后才写入发布数据。
- 单元明确 `noAudio: true`；不得显示音频、录音、占位或音频完成度。
- 语言开关只在本单元内保持，不修改全站 `showLatin` 偏好，也不持久化到云端。
- 不批量删除任何文件；只提交本计划的明确文件。

---

### Task 1: 建立六篇故事的原创写作与审校包

**Files:**
- Read: `/Users/nigarayaskar/Desktop/Nigarayyy/维吾尔语/chat_file_1040g3c8323k5f72q0o005o52folg8tovkartrmg_大众维语（上）.pdf`
- Read: `/Users/nigarayaskar/Desktop/Nigarayyy/维吾尔语/chat_file_1040g3c8323k5f72q0o0g5o52folg8tovbr82ub0_大众维语（下）.pdf`
- Create: `课程/阿凡提/阿凡提小故事原创与审校表.md`

- [ ] **Step 1: 用 PDF 阅读能力审计难度，不复制故事正文**

只记录教材中已出现的高频词、句长、转折/原因表达和适合的难度级别，逐条注明文件和 PDF 页码。不得复制连续课文；审计表明确“教材仅用于难度与词汇范围参考”。

- [ ] **Step 2: 按固定元数据建立六篇写作卡**

| ID | 主题 | 维吾尔文词数 |
|---|---|---|
| `listen-before-judge` | 先听完再判断 | 60–80 |
| `fair-bowl-water` | 公平的一碗水 | 70–90 |
| `unverified-words` | 没有证据的话 | 80–100 |
| `precious-time` | 最珍贵的时间 | 90–110 |
| `neighbors-tree` | 邻居们的一棵树 | 100–130 |
| `wisdom-not-advantage` | 聪明不是占便宜 | 120–150 |

每张卡包含维吾尔标题/正文、ULY、中文、海外版英文、唯一教育主题、理解题三个选项、正确选项、答题反馈、故事道理、目标词数和实际词数。

- [ ] **Step 3: 逐篇写原创短篇并进行相互重复检查**

前两篇只用短句和高频词；中间两篇加入时间、原因或转折；最后两篇可加入少量简单复句。六篇之间不得重复完整情节，也不得共享连续 8 个以上相同维吾尔词的模板段落。

- [ ] **Step 4: 做四层人工审校**

审校表为每篇保留四个独立结论：`uyghurLanguage`、`translationMeaning`、`educationAndCulture`、`originality`。每项必须记录审校人/用户确认标识、日期和 `approved`；任一项未批准时，该篇不能进入发布 JS。

- [ ] **Step 5: 人工内容关卡——向用户提交完整六篇文本**

暂停代码发布，让用户逐篇确认维吾尔文、译文、教育意义与文化表达。把修改意见落实到审校表后再次确认。未经明确确认不得把状态改为 `approved`，也不得用机器生成文本直接上线。

### Task 2: 创建共享故事数据、海外英文数据和发布验证器

**Files:**
- Create: `prototype/course-data/afanti-data.js`
- Create: `prototype/course-data/afanti-english-data.js`
- Create: `prototype/afanti-content.js`
- Create: `tests/afanti-content.test.mjs`
- Modify: `prototype/index.html:18-35`
- Modify: `../Uyghur Tili/site/index.html:18-35`
- Modify: `prototype/course-data.js:1-40`
- Modify: `scripts/check-project.mjs`
- Modify: `scripts/edition-core-files.mjs`

- [ ] **Step 1: 写失败测试，固定 6 篇、长度、语言和 no-audio 规则**

```js
assert.deepEqual(shared.stories.map((story) => story.id), [
  "listen-before-judge", "fair-bowl-water", "unverified-words",
  "precious-time", "neighbors-tree", "wisdom-not-advantage"
]);
assert.deepEqual(shared.stories.map((story) => story.wordRange), [
  [60, 80], [70, 90], [80, 100], [90, 110], [100, 130], [120, 150]
]);
assert.ok(shared.stories.every((story) => story.noAudio === true));
assert.ok(shared.stories.every((story) => story.uyghur && story.latin && story.zh));
assert.ok(shared.stories.every((story) => !Object.hasOwn(story, "en")));
assert.deepEqual(Object.keys(english.byStoryId), shared.stories.map((story) => story.id));
assert.deepEqual(api.publishableStories(shared.stories, null, { edition: "cn" }).length, 6);
assert.deepEqual(api.publishableStories(shared.stories, english.byStoryId, { edition: "global" }).length, 6);
```

- [ ] **Step 2: 运行测试并确认模块不存在**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/afanti-content.test.mjs`

Expected: FAIL。

- [ ] **Step 3: 写入用户已批准的真实故事数据**

每篇使用固定字段契约：

```js
const REQUIRED_STORY_FIELDS = Object.freeze([
  "id", "sequence", "primaryTheme", "title", "uyghur", "latin", "zh",
  "wordRange", "noAudio", "question", "moral", "review"
]);
const REQUIRED_REVIEW_FIELDS = Object.freeze([
  "uyghurLanguage", "translationMeaning", "educationAndCulture",
  "originality", "reviewedBy", "reviewedAt"
]);
assert.ok(REQUIRED_STORY_FIELDS.every((field) => Object.hasOwn(story, field)));
assert.ok(REQUIRED_REVIEW_FIELDS.every((field) => Object.hasOwn(story.review, field)));
assert.equal(story.noAudio, true);
assert.match(story.review.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
```

标题、段落、题目、反馈和道理必须逐字取自 Task 1 已批准的审校表；代码阶段不重新生成或润色它们。

- [ ] **Step 4: 把英文严格隔离到海外脚本**

`afanti-english-data.js` 只导出 `byStoryId`，含每篇 English title、paragraphs、question、choices、feedback、moral。海外 `index.html` 在共享 Afanti 数据后加载它；国内 `index.html` 不包含该文件名，国内目录也不通过同步白名单接收该文件。

- [ ] **Step 5: 实现发布验证器**

`publishableStories(stories, englishByStoryId, config)` 依次验证：ID/顺序、实际维吾尔词数在范围内、三种共享语言段落数一致、理解题有 3 个不同 choice ID、answerId 存在、四项 review 均 approved、`noAudio === true`。海外版还要求完整英文；国内版不读取英文对象。任一故事不合格时抛出含 story ID 和字段名的错误，不静默发布 5/6 篇。

- [ ] **Step 6: 合并到课程 catalog**

`course-data.js` 使用验证器生成 `afantiStories` 和 `afantiUnit`；`app.js` 为单元设置 `actionTarget: "afantiStories"`。Plan 1 顺序模块把它放到最后。

- [ ] **Step 7: 运行数据测试并提交**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/afanti-content.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/course-data-integrity.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-order.test.mjs`

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/sync-cn-core.mjs
git add prototype/course-data/afanti-data.js prototype/course-data/afanti-english-data.js prototype/afanti-content.js prototype/course-data.js prototype/index.html tests/afanti-content.test.mjs tests/course-data-integrity.test.mjs tests/unit-order.test.mjs scripts/check-project.mjs scripts/edition-core-files.mjs 课程/阿凡提/阿凡提小故事原创与审校表.md
git commit -m "feat: add reviewed afanti story data"
```

国内版 `site/index.html` 在其仓库单独提交；确认它加载共享 `afanti-data.js` 与 `afanti-content.js`，但不加载 `afanti-english-data.js`。

### Task 3: 实现默认维吾尔文阅读和单元内语言开关

**Files:**
- Modify: `prototype/app.js:390-460,1788-2000,2119-2260,2705-2800,4153-4300,5155-5560`
- Modify: `prototype/styles.css`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

- [ ] **Step 1: 写失败 UI 测试，覆盖国内/海外开关差异**

进入故事时默认 HTML 只含维吾尔段落，辅助段落容器不渲染。国内版右上角只有“拉丁文”“中文”两个未按下开关，不含 `English`；海外版为 `Latin`、`中文`、`English` 三个独立开关。

- [ ] **Step 2: 运行测试并确认 screen 不存在**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Expected: FAIL。

- [ ] **Step 3: 新增阿凡提专属临时状态**

```js
const afantiUi = {
  selectedStoryId: "listen-before-judge",
  visibleLanguages: { latin: false, zh: false, en: false },
  answersByStoryId: {},
  moralsByStoryId: {}
};
```

只把完成进度持久化；`visibleLanguages`、当前展开的 moral 和临时答案选择不写 localStorage/cloud。离开单元后可以保留在当前 JS session，刷新后恢复全关闭。

- [ ] **Step 4: 渲染逐段对齐但可自然收拢的阅读布局**

每段维吾尔文始终显示；已开启语言紧邻该段显示，关闭时不输出空节点。维吾尔容器 `dir="rtl" lang="ug"`；Latin/English `dir="ltr"`，中文正常 LTR。开关位于故事标题右上，手机端允许换行但不覆盖标题。

- [ ] **Step 5: 限制开关集合来自版本配置**

只遍历 `appConfig.afantiLanguages`。即使 DOM 事件伪造 `toggle-afanti-language data-language="en"`，国内版也拒绝改变 `en` 状态。

- [ ] **Step 6: 运行测试和视觉检查**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/full-content-render.test.mjs`

在 1440×900 和 390×844 下切换每种语言，确认关闭后无空白列、RTL/LTR 不错位、长维吾尔字形不裁切。

- [ ] **Step 7: 提交本任务**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: add edition-aware afanti reading controls"
```

### Task 4: 实现“读到结尾＋提交理解题”的无分数完成流程

**Files:**
- Modify: `prototype/app.js:390-785,1250-1375,4153-4300,5155-5905`
- Modify: `prototype/styles.css`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/local-progress-transfer.test.mjs`
- Modify: `tests/cloud-sync.test.mjs`

- [ ] **Step 1: 写失败测试，固定完成条件**

```js
assert.equal(progress.completed, undefined);
markAfantiReachedEnd(storyId);
assert.equal(progress.completed, undefined);
submitAfantiAnswer(storyId, "b");
assert.equal(progress.completed, true);
```

再覆盖反向顺序：先答题、后到结尾也能完成；错误选项不阻止完成；页面不出现分数、百分比或“答错不能继续”。

- [ ] **Step 2: 运行测试并确认流程不存在**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Expected: FAIL。

- [ ] **Step 3: 实现结尾观察与无障碍降级**

故事正文末尾放置 sentinel；支持 IntersectionObserver 时，进入视口后设置 `reachedEnd`。不支持时显示明确按钮“我已读到故事结尾”，点击后设置同一状态。测试 VM 注入可控 observer，不用滚动像素猜测。

- [ ] **Step 4: 实现理解题与道理展开**

提交任一选项后显示已审校 feedback，并启用“查看故事道理”；道理默认折叠，点击后才展开。题目不累计分数。完成条件唯一为 `reachedEnd && answered`。

- [ ] **Step 5: 持久化最小完成状态**

只保存 `learningProgress.afanti[storyId] = { reachedEnd, answered, completed }`；不保存具体选择，避免把临时答题变成考试档案。加入本地导出、guest backup、云 snapshot 与清除学习记录的现有通用进度路径。

- [ ] **Step 6: 运行持久化测试并提交**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/local-progress-transfer.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/cloud-sync.test.mjs`

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/local-progress-transfer.test.mjs tests/cloud-sync.test.mjs
git commit -m "feat: complete afanti stories without scoring"
```

### Task 5: 把“无音频”变成明确数据政策而非缺失资源

**Files:**
- Modify: `prototype/app.js:140-180,1030-1140,1850-1927,4153-4300`
- Modify: `tests/human-audio.test.mjs`
- Modify: `tests/content-policy.test.mjs`
- Modify: `tests/afanti-content.test.mjs`

- [ ] **Step 1: 写失败测试，确保 Afanti 不进入音频目标**

断言 6 篇 `noAudio === true`，`audioCoverageTargets()` 中没有任何 `afanti-*` ID，故事页面不含 `play-audio`、`record`、`跟读`、`音频缺失` 或 audio completion 字段。

- [ ] **Step 2: 写教育内容结构测试**

断言六个固定主题各出现一次、每篇 review 四项均为 approved、每篇只有一个 `primaryTheme`、每篇问题 answerId 有效。关键词扫描不能替代人工审校；测试不得因故事以否定方式讨论“说谎/占便宜”而误判。

- [ ] **Step 3: 运行测试并确认当前音频代码会默认处理所有阅读项**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/human-audio.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/content-policy.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/afanti-content.test.mjs`

Expected: FAIL，直到 Afanti 被明确排除并通过内容验证。

- [ ] **Step 4: 保持 Afanti 在独立 kind/scope**

不得把 `afantiStories` 拼入现有 `readingUnits` 的音频 `.flatMap`；`audioCoverageTargets` 只处理已有 audio-bearing 数据。无音频不是 `playable: false`，而是整个 Afanti schema 要求 `noAudio: true` 且 UI 不请求 audio。

- [ ] **Step 5: 运行政策测试并提交**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/human-audio.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/content-policy.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/afanti-content.test.mjs`

```bash
git add prototype/app.js tests/human-audio.test.mjs tests/content-policy.test.mjs tests/afanti-content.test.mjs
git commit -m "test: enforce no-audio afanti policy"
```

### Task 6: 完成最终 11/12 单元、总进度与双版本验收

**Files:**
- Modify: `prototype/app.js:1258-1375,1952-1990,4785-5035`
- Modify: `tests/unit-order.test.mjs`
- Modify: `tests/course-data-integrity.test.mjs`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`
- Modify: `scripts/check-project.mjs`

- [ ] **Step 1: 固定最终课程清单**

国内版断言 11 个单元且 `uyghur-proverbs` 为第十、`afanti-stories` 为第十一；海外版断言 12 个且 `uyghur-proverbs` 第十、`famous-quotes` 第十一、`afanti-stories` 第十二。两版前十个 ID 完全一致。

- [ ] **Step 2: 把 6 篇纳入总进度，不加入音频分母**

Afanti 单元进度为完成故事数/6。整个课程最后单元完成后显示“回到学习路径”，`nextUnitId === null`，不得跳回 `letters` 假装下一课。

- [ ] **Step 3: 做双版本手动验收**

分别用本地 HTTP 打开海外 `prototype` 与国内 `../Uyghur Tili/site`：检查 11/12 顺序、默认只显示维吾尔文、国内无 English/登录/Supabase、海外 English/可选登录正常、六篇无任何音频 UI、导入导出仍正常。

- [ ] **Step 4: 运行全量检查**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/sync-cn-core.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs`

Expected: syntax、ULY、edition、content policy、progress transfer、audio、cloud、course integrity、learning experience、full render、parity 和 `git diff --check` 全部通过。

- [ ] **Step 5: 最终内容复核后提交**

```bash
git add prototype/app.js tests/unit-order.test.mjs tests/course-data-integrity.test.mjs tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs scripts/check-project.mjs
git commit -m "test: verify final edition course sequences"
```

## Plan 4 完成判定

- 六篇故事均经过四层审校，维吾尔文词数分别落在 60–80、70–90、80–100、90–110、100–130、120–150。
- 默认只显示维吾尔文；国内版只有拉丁文/中文，海外版额外 English，开关关闭后不留空白。
- 每篇只有一道理解题和一条作答后可展开的道理；无分数，任意作答不阻止继续。
- 完成条件是读到结尾并提交题目；没有任何音频按钮、资源请求或音频完成要求。
- 国内版最终 11 单元，海外版最终 12 单元；阿凡提始终为最后一单元。
- 国内版未接收英文故事脚本，海外版保留游客与可选云同步，全量检查通过。
