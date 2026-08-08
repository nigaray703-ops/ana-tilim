# 版本顺序、进度兼容与入口优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让国内版与海外版从同一稳定单元目录生成正确编号、顺序和下一课导航，同时保持旧进度不变，并完成已确认的游客入口与备份透明度优化。

**Architecture:** 新增一个无 DOM 依赖的单元顺序模块，负责版本过滤、动态编号和相邻单元计算；`app.js` 只保留课程内容与单元体验元数据，不再硬编码“第几单元”和下一单元。版本差异继续集中在 `app-config.js`，共享核心通过明确白名单同步并由自动检查防止漂移。备份导入先验证版本与结构，再经确认应用，失败不覆盖当前数据。

**Tech Stack:** 原生 JavaScript、浏览器 localStorage、Node.js `assert`/`vm` 测试、现有 Supabase 云同步边界、HTML/CSS。

## Global Constraints

- 不改写现有单元的课文、词汇、练习、音频或稳定 ID。
- 先检查并保留当前未提交修改；每次提交只暂存本计划列出的文件。
- 国内版不得加载 Supabase、登录或第三方认证脚本。
- 两个版本的品牌名、Logo、PWA 名称和 storage key 保持分离。
- 旧记录继续按稳定 ID 命中；显示编号不得进入进度主键。
- 不批量删除任何文件。

---

### Task 1: 建立版本感知的单元顺序模块

**Files:**
- Create: `prototype/unit-order.js`
- Create: `tests/unit-order.test.mjs`
- Modify: `scripts/check-project.mjs`
- Modify: `prototype/index.html:18-35`

- [ ] **Step 1: 写出失败测试，固定两版最终顺序**

```js
const catalog = [
  "letters", "latin-keyboard-writing", "combos", "syllable-training",
  "basic-phrases", "grammar-basics", "sentence-patterns", "dialogue-theater",
  "short-stories", "uyghur-proverbs", "famous-quotes", "afanti-stories"
].map((id) => ({ id }));

assert.deepEqual(api.buildVisibleUnits(catalog, { hiddenUnitIds: [] }).map((unit) => unit.id), catalog.map((unit) => unit.id));
assert.deepEqual(api.buildVisibleUnits(catalog, { hiddenUnitIds: ["famous-quotes"] }).map((unit) => unit.id), [
  "letters", "latin-keyboard-writing", "combos", "syllable-training",
  "basic-phrases", "grammar-basics", "sentence-patterns", "dialogue-theater",
  "short-stories", "uyghur-proverbs", "afanti-stories"
]);
assert.equal(api.nextUnitId("uyghur-proverbs", api.buildVisibleUnits(catalog, { hiddenUnitIds: [] })), "famous-quotes");
assert.equal(api.nextUnitId("uyghur-proverbs", api.buildVisibleUnits(catalog, { hiddenUnitIds: ["famous-quotes"] })), "afanti-stories");
assert.equal(api.nextUnitId("afanti-stories", api.buildVisibleUnits(catalog, { hiddenUnitIds: [] })), null);
```

- [ ] **Step 2: 运行测试并确认因模块不存在而失败**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-order.test.mjs`

Expected: FAIL，提示 `prototype/unit-order.js` 不存在或 `ANA_TILIM_UNIT_ORDER` 未定义。

- [ ] **Step 3: 实现稳定顺序、中文编号与末课返回规则**

```js
(() => {
  const ORDERED_IDS = Object.freeze([
    "letters", "latin-keyboard-writing", "combos", "syllable-training",
    "basic-phrases", "grammar-basics", "sentence-patterns", "dialogue-theater",
    "short-stories", "uyghur-proverbs", "famous-quotes", "afanti-stories"
  ]);
  const UNIT_NAMES = Object.freeze({
    letters: "认识字母",
    "latin-keyboard-writing": "拉丁键盘与字母书写强化",
    combos: "基础组合",
    "syllable-training": "拼读与音节训练营",
    "basic-phrases": "日常用语与词汇",
    "grammar-basics": "语法入门",
    "sentence-patterns": "基础句型",
    "dialogue-theater": "对话小剧场",
    "short-stories": "小故事",
    "uyghur-proverbs": "维吾尔谚语",
    "famous-quotes": "名人名言",
    "afanti-stories": "阿凡提小故事"
  });
  const NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];

  function buildVisibleUnits(catalog, config = {}) {
    const byId = new Map(catalog.map((unit) => [unit.id, unit]));
    const hidden = new Set(config.hiddenUnitIds || []);
    return ORDERED_IDS.filter((id) => byId.has(id) && !hidden.has(id)).map((id, index) => ({
      ...byId.get(id),
      title: `第${NUMERALS[index]}单元：${UNIT_NAMES[id]}`
    }));
  }

  function nextUnitId(currentId, visibleUnits) {
    const index = visibleUnits.findIndex((unit) => unit.id === currentId);
    return index >= 0 ? visibleUnits[index + 1]?.id || null : null;
  }

  window.ANA_TILIM_UNIT_ORDER = Object.freeze({ ORDERED_IDS, UNIT_NAMES, buildVisibleUnits, nextUnitId });
})();
```

- [ ] **Step 4: 把新脚本放在课程数据之后、`app.js` 之前加载，并加入总检查**

- [ ] **Step 5: 运行单测**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-order.test.mjs`

Expected: PASS，输出 `unit order checks passed`。

- [ ] **Step 6: 提交本任务**

```bash
git add prototype/unit-order.js prototype/index.html tests/unit-order.test.mjs scripts/check-project.mjs
git commit -m "feat: derive edition-aware unit order"
```

### Task 2: 让现有课程卡片、编号、进度摘要和下一课全部使用可见顺序

**Files:**
- Modify: `prototype/app.js:1-18,220-345,1258-1375,1788-1810,1952-1990,2548-2570`
- Modify: `tests/unit-learning-experience.test.mjs:1290-1455,1580-1610,2190-2230`

- [ ] **Step 1: 写失败测试，覆盖海外版/国内版编号和现有稳定 ID**

在测试 VM 中分别注入 `hiddenUnitIds: []` 与 `hiddenUnitIds: ["famous-quotes"]`，断言：

```js
assert.deepEqual(globalUnits.map(({ id, title }) => [id, title]), [
  ["letters", "第一单元：认识字母"],
  ["combos", "第二单元：基础组合"],
  ["basic-phrases", "第三单元：日常用语与词汇"],
  ["grammar-basics", "第四单元：语法入门"],
  ["sentence-patterns", "第五单元：基础句型"],
  ["dialogue-theater", "第六单元：对话小剧场"],
  ["short-stories", "第七单元：小故事"],
  ["uyghur-proverbs", "第八单元：维吾尔谚语"],
  ["famous-quotes", "第九单元：名人名言"]
]);
assert.equal(savedSelectedUnitIdAfterLoad, "dialogue-theater");
```

说明：三个新增单元的数据尚未加载时，模块只给当前已有单元连续编号；后续三份计划加入数据后，同一测试扩展为 11/12 单元。

- [ ] **Step 2: 运行测试并确认旧硬编码顺序失败**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Expected: FAIL，至少显示谚语/名言顺序或下一单元断言不一致。

- [ ] **Step 3: 把 `learningUnits` 拆成未编号 catalog，再交给顺序模块**

```js
const unitOrder = window.ANA_TILIM_UNIT_ORDER;
if (!courseData || !sentenceGlossary || !progressTransfer || !uyghurKeyboard || !unitOrder) {
  throw new Error("Learning data modules failed to load.");
}

const learningUnitCatalog = [lettersUnit, combosUnit, vocabUnit, ...readingUnitCatalog];
const learningUnits = unitOrder.buildVisibleUnits(learningUnitCatalog, appConfig);
```

旧单元对象保留 `id`、`subtitle`、`description`、`bullets`、`groups`、`actionTarget`；移除对象里的手写编号，但不改其课程内容。

- [ ] **Step 4: 把 `unitExperience` 改成只存本单元体验，运行时计算下一单元**

```js
function currentUnitExperience(unitId) {
  const base = unitExperience[unitId] || unitExperience.letters;
  const nextId = unitOrder.nextUnitId(unitId, learningUnits);
  if (!nextId) return { ...base, nextLabel: "回到学习路径", nextTarget: "learn", nextUnitId: null };
  const next = learningUnits.find((unit) => unit.id === nextId);
  return { ...base, nextLabel: `进入${next.title.split("：")[0]}`, nextTarget: "unit", nextUnitId: nextId };
}
```

删除 `readingUnits.forEach` 对下一课的二次改写。阿凡提最后一课的 `nextUnitId` 为 `null`，不得跳回第一单元。

- [ ] **Step 5: 从 `learningUnits` 生成进度摘要的显示编号**

保留现有 scope/ID 计数逻辑，但用 `unit.title.split("：")` 生成显示标签；新单元未出现前不虚增进度分母。

- [ ] **Step 6: 验证旧进度按 ID 恢复**

补充一个保存 `selectedUnitId: "dialogue-theater"` 和已有 `learningProgress` 的旧快照，调用 `loadState()` 后断言选中 ID 与完成状态不变。

- [ ] **Step 7: 运行回归测试**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Expected: PASS。

- [ ] **Step 8: 提交本任务**

```bash
git add prototype/app.js tests/unit-learning-experience.test.mjs
git commit -m "refactor: compute unit navigation from visible order"
```

### Task 3: 集中版本配置并阻止国内外共享核心漂移

**Files:**
- Modify: `prototype/app-config.js`
- Modify: `../Uyghur Tili/site/app-config.js`
- Modify: `prototype/course-data.js:1-30`
- Modify: `tests/app-edition-config.test.mjs`
- Create: `scripts/edition-core-files.mjs`
- Create: `scripts/sync-cn-core.mjs`
- Create: `scripts/check-edition-parity.mjs`
- Modify: `scripts/check-project.mjs`

- [ ] **Step 1: 写失败测试，固定允许的版本差异**

海外版配置必须包含：

```js
const globalEditionConfig = {
  edition: "global",
  cloudEnabled: true,
  hiddenUnitIds: [],
  afantiLanguages: ["latin", "zh", "en"],
  progressStorageKey: "ana-tilim-progress",
  backupStorageKey: "ana-tilim-guest-progress-backup"
};
```

国内版配置必须包含：

```js
const cnEditionConfig = {
  edition: "cn",
  cloudEnabled: false,
  hiddenUnitIds: ["famous-quotes"],
  afantiLanguages: ["latin", "zh"],
  progressStorageKey: "uyghur-tili-cn-progress",
  backupStorageKey: "uyghur-tili-cn-progress-backup"
};
```

- [ ] **Step 2: 运行测试并确认新字段缺失**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/app-edition-config.test.mjs`

Expected: FAIL，显示 `hiddenUnitIds` 或 `afantiLanguages` 不匹配。

- [ ] **Step 3: 更新两版配置并让课程过滤使用 `hiddenUnitIds`**

删除仅针对阅读单元的 `readingUnitTitleOverrides`；显示编号由 `unit-order.js` 统一生成。保留读取旧 `hiddenReadingUnitIds` 的兼容回退一个发布周期：

```js
const hiddenUnitIds = new Set(appConfig.hiddenUnitIds || appConfig.hiddenReadingUnitIds || []);
```

- [ ] **Step 4: 建立共享核心白名单和安全同步脚本**

`edition-core-files.mjs` 初始白名单：`app.js`、`styles.css`、`uly-transliteration.js`、`unit-order.js`、`course-data.js`、`course-data/alphabet-data.js`、`course-data/combo-data.js`、`course-data/vocab-data.js`、`course-data/practice-data.js`、`course-data/reading-data.js`、`uyghur-keyboard.js`、`sentence-morphemes.js`、`sentence-glossary.js`、`progress-transfer.js`、`audio-controller.js`。名单必须逐个写明文件，不能使用 glob；后续计划逐个加入共享新模块，海外独有的 `afanti-english-data.js` 永不进入白名单。同步脚本只逐个 `copyFileSync` 白名单文件并创建所需父目录，不删除目标目录中的任何文件；明确排除 `app-config.js`、Logo、manifest、index 中的云脚本差异。

- [ ] **Step 5: 添加只读 parity 检查**

`check-edition-parity.mjs` 对白名单逐个比较字节内容，任何意外差异列出明确路径并以非零码退出。

- [ ] **Step 6: 先同步一次，再运行配置和 parity 测试**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/sync-cn-core.mjs`

Expected: 输出逐个复制的白名单文件，不删除任何文件。

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/app-edition-config.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-edition-parity.mjs`

Expected: PASS。

- [ ] **Step 7: 提交本任务**

```bash
git add prototype/app-config.js prototype/course-data.js tests/app-edition-config.test.mjs scripts/edition-core-files.mjs scripts/sync-cn-core.mjs scripts/check-edition-parity.mjs scripts/check-project.mjs
git commit -m "build: enforce edition configuration boundaries"
```

国内版目录若属于独立仓库，则在其仓库中单独提交 `site/app-config.js` 与同步后的共享文件；不得把两个仓库混在同一个提交命令中。

### Task 4: 强化备份版本验证，失败不覆盖当前记录

**Files:**
- Modify: `prototype/progress-transfer.js:1-42`
- Modify: `prototype/app.js:480-785,612-640,4943-5030,5889-5905`
- Modify: `tests/local-progress-transfer.test.mjs`
- Modify: `tests/unit-learning-experience.test.mjs`

- [ ] **Step 1: 写失败测试，覆盖同版导入、跨版拒绝与原数据保留**

```js
const envelope = api.parseImportPayload(JSON.stringify(payload), { expectedEdition: "cn" });
assert.equal(envelope.edition, "cn");
assert.deepEqual(envelope.data, sample);
assert.throws(
  () => api.parseImportPayload(JSON.stringify(payload), { expectedEdition: "global" }),
  /备份属于 Uyghur Tili 国内版，不能导入 Ana Tilim 海外版/
);
```

应用层测试先写入当前 storage，选择跨版本文件后断言原 JSON 字节不变。

- [ ] **Step 2: 运行测试并确认当前解析器不验证版本**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/local-progress-transfer.test.mjs`

Expected: FAIL。

- [ ] **Step 3: 让解析器返回经过克隆的 envelope**

验证顺序固定为 JSON、format、version、data、edition；`edition` 只允许 `cn` 或 `global`。错误消息由 edition 映射生成，不依赖备份中的可伪造 brandName。

- [ ] **Step 4: 导入先进入预览确认，不直接写 storage**

新增 `state.pendingProgressImport`。文件选择只解析并显示来源版本、导出时间与“将替换当前设备学习记录”；用户点击 `confirm-import-progress` 后才调用 `storage.setItem` 和 `loadState()`。取消或任何解析错误都保留当前记录。

- [ ] **Step 5: 海外版游客和登录用户都显示手动导出/导入入口**

把 `local-data-actions` 移出 `cloudEnabled` 的条件分支。登录状态仍显示云同步说明；导入确认文案明确说明“手动导入会替换当前设备记录，并在登录状态下按现有同步规则上传”。

- [ ] **Step 6: 运行单测**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/local-progress-transfer.test.mjs`

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Expected: PASS。

- [ ] **Step 7: 提交本任务**

```bash
git add prototype/progress-transfer.js prototype/app.js tests/local-progress-transfer.test.mjs tests/unit-learning-experience.test.mjs
git commit -m "feat: validate and confirm progress imports"
```

### Task 5: 优化首次进入层级和数据透明文案

**Files:**
- Modify: `prototype/app.js:2296-2405,2456-2485,4943-5030`
- Modify: `prototype/styles.css:1-450,3000-3275`
- Modify: `tests/unit-learning-experience.test.mjs:650-745`
- Modify: `tests/full-content-render.test.mjs`

- [ ] **Step 1: 写失败测试，固定入口优先级与版本文案**

海外版欢迎页断言 `continue-local` 使用 `primary-button` 且出现在认证提交按钮之前；认证区默认折叠，折叠按钮说明“可选：登录后跨设备同步”。国内版断言出现“学习记录保存在当前设备，可在‘我的’页面导出备份”，且 HTML 不含登录、Google、Supabase 文案。

- [ ] **Step 2: 运行测试并确认当前游客入口仍是次要按钮**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs`

Expected: FAIL。

- [ ] **Step 3: 实现明确的游客主入口和可选登录折叠区**

增加 `state.authPanelExpanded`，海外版默认 `false`。主按钮使用 `primary-button`；可选登录按钮只切换认证卡，不改变课程进入逻辑。已有登录、注册、Google 和验证码行为不删除。

- [ ] **Step 4: 添加国内版本地保存说明与无错题中性文案**

国内欢迎页在开始按钮附近展示本地保存说明。把无错题状态限定为“当前没有需要复习的错题”，不承诺未来提醒功能。

- [ ] **Step 5: 做桌面与手机视觉检查**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 -m http.server 4173 --directory prototype`

在 1440×900、390×844 下分别检查：主 CTA 首屏可见；折叠登录展开后无横向滚动；国内版说明不挤压按钮；RTL 字形不裁切。结束服务后只停止该明确进程，不删除文件。

- [ ] **Step 6: 运行全量检查**

Run: `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs`

Expected: 所有 syntax、course、audio、cloud、render 和 parity 检查通过，最后 `git diff --check` 通过。

- [ ] **Step 7: 提交本任务**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: prioritize guest learning and explain backups"
```

## Plan 1 完成判定

- 国内版当前已有单元与海外版当前已有单元从同一目录连续编号；后续新单元插入后无需再改旧标题。
- 旧进度按稳定 ID 恢复，跨版本备份在写入前被拒绝。
- 海外版游客入口是主要操作，登录/注册仍可用；国内版不出现任何云端入口。
- 共享核心 parity 检查进入 `check-project.mjs`，两版允许差异只来自配置、品牌资源、manifest 与明确的入口脚本。
- `/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs` 全部通过，且只提交本计划涉及文件。
