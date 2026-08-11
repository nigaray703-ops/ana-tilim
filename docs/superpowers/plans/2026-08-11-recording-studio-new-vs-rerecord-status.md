# Recording Studio New vs Rerecord Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在本机录音工作台中把“需要新录制”和“需要重新录制”显示为两个独立、可筛选、可持久恢复的队列，同时保持现有 527 条审核数据不变。

**Architecture:** 保留持久化状态 ID `pending`，只把它的产品文案和 UI 分组明确为“需要新录制”；`needs-rerecord` 继续代表已有错误音频。前端使用固定状态定义生成摘要卡片和下拉菜单，并依据 `target.playable` 决定是否显示当前课程音频区；workspace 在任何状态文件读写前校验 `pending` 与不可播放目标的双向约束。第六、七单元的 29 个新增录音目标由既有最终课程扩充计划后续接入，本计划只完成可直接承接它们的工作台逻辑，不提前发布未审校课程内容。

**Tech Stack:** 原生 JavaScript/HTML/CSS、Node.js、`node:test`、现有录音工作区/同源 API、本机 Chrome。

## Global Constraints

- 保持当前 527 条目录基线为 525 条 `pending-review`、0 条 `pending`、2 条 `needs-rerecord`。
- 不迁移或重写现有 `recording-workspace/state.json`。
- `pending` 的界面名称固定为“需要新录制”；`needs-rerecord` 固定为“需要重新录制”。
- 新录制目标必须 `playable === false`，不得请求当前音频 API，也不得显示“当前音频正确”或“需要重新录制”。
- 已有音频目标继续支持播放旧版、标记正确、标记重新录制和多 take 对比。
- 不修改、删除、替换或生成任何正式 WebM 音频文件。
- 不把本机录音工作台、工作目录、备份或日志部署到国内版或海外版。
- 禁止批量或递归删除；本计划不包含任何删除动作。
- 所有代码改动必须先有可失败的行为测试，再做最小实现并运行完整专项测试。

---

### Task 1: Fixed status cards and separate filter queues

**Files:**
- Modify: `tools/recording-studio/public/index.html`
- Modify: `tools/recording-studio/public/styles.css`
- Modify: `tools/recording-studio/public/app.js`
- Modify: `tests/recording-studio-ui.test.mjs`

**Interfaces:**
- Consumes: `model.workspace.targets[stableId].status` and the existing `category-filter`, `status-filter`, and text search controls.
- Produces: fixed `STATUS_FILTERS`, `statusMatchesFilter(status, filterId)`, and buttons inside `#status-cards` with `data-status-filter`.

- [ ] **Step 1: Write the failing UI behavior test**

Add `status-cards` to the fake document fixture and assert the fixed product taxonomy:

```js
document.register("status-cards", "div");
await context.recordingStudio.ready;

assert.deepEqual(
  document.getElementById("status-filter").children.map((option) => option.textContent),
  ["全部状态", "待审核已有音频", "需要新录制", "需要重新录制", "已录制待采用", "已确认"]
);
assert.match(document.getElementById("status-cards").textContent, /需要新录制\s*0/);
assert.match(document.getElementById("status-cards").textContent, /需要重新录制\s*2/);
assert.match(document.getElementById("audit-summary").textContent, /待审核已有音频 525/);
```

Click the “需要重新录制” status card, keep `category-filter=vocab`, enter `korushkunche`, and assert the list contains exactly `vocab:korushkunche`. Click the selected status card again and assert it returns to `all` without mutating workspace state or calling any `/api/targets/` endpoint.

- [ ] **Step 2: Run the UI test to verify RED**

Run:

```bash
NODE="/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
"$NODE" --test tests/recording-studio-ui.test.mjs
```

Expected: FAIL because `status-cards` and the fixed “需要新录制” option do not exist.

- [ ] **Step 3: Implement fixed status definitions and cards**

In `index.html`, add one explicit container between the audit copy and filter controls:

```html
<div id="status-cards" class="status-cards" aria-label="录音任务状态"></div>
```

In `app.js`, replace data-derived status options with fixed definitions:

```js
const STATUS_FILTERS = Object.freeze([
  ["pending-review", "待审核已有音频"],
  ["pending", "需要新录制"],
  ["needs-rerecord", "需要重新录制"],
  ["recorded", "已录制待采用"],
  ["confirmed", "已确认"]
]);
const CONFIRMED_STATUSES = new Set(["approved-current", "approved-take", "imported"]);
function statusMatchesFilter(status, filterId) {
  if (filterId === "all") return true;
  if (filterId === "confirmed") return CONFIRMED_STATUSES.has(status);
  return status === filterId;
}
```

Use `statusMatchesFilter` in `filteredTargets()`. Render all fixed options every time, render one real `<button type="button">` per status card, set `aria-pressed` from `model.status`, and toggle the same filter back to `all`. `renderSummary()` must display all five counts, including zero.

In `styles.css`, use an auto-fitting status grid:

```css
.filter-panel { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, 700px); align-items: end; }
.status-cards { display: grid; grid-column: 1 / -1; grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 8px; width: 100%; }
.status-card { display: grid; gap: 2px; min-width: 0; text-align: left; }
.status-card[aria-pressed="true"] { border-color: #008d99; color: #003f49; background: #d9f6f8; }
@media (max-width: 959px) { .status-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 720px) { .filter-panel { grid-template-columns: 1fr; } }
@media (max-width: 520px) { .status-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
```

- [ ] **Step 4: Run UI GREEN and whitespace checks**

Run:

```bash
"$NODE" --test tests/recording-studio-ui.test.mjs
git diff --check
```

Expected: all UI tests pass and `git diff --check` exits 0.

- [ ] **Step 5: Commit status cards**

```bash
git add tools/recording-studio/public/index.html tools/recording-studio/public/styles.css tools/recording-studio/public/app.js tests/recording-studio-ui.test.mjs
git commit -m "feat: separate recording task queues"
```

---

### Task 2: Fail-closed nonplayable new targets

**Files:**
- Modify: `tools/recording-studio/workspace.mjs`
- Modify: `tools/recording-studio/public/app.js`
- Modify: `tests/recording-studio-workspace.test.mjs`
- Modify: `tests/recording-studio-ui.test.mjs`

**Interfaces:**
- Consumes: catalog target fields `stableId`, `playable`, `initialStatus`, `recordingTextHash`, and workspace state status.
- Produces: workspace invariant `initialStatus === "pending"` if and only if `playable === false`; UI detail branch that never calls `audioForCurrent()` for a nonplayable target.

- [ ] **Step 1: Write failing workspace invariant tests**

Clone one fixture catalog target and test both invalid combinations before state creation:

```js
const invalidNewTarget = structuredClone(catalog);
invalidNewTarget.targets[0].playable = false;
invalidNewTarget.targets[0].initialStatus = "pending-review";
assert.throws(
  () => createRecordingWorkspace({ projectRoot, workspaceRoot, catalog: invalidNewTarget }),
  /nonplayable target must start pending/
);

const invalidExistingTarget = structuredClone(catalog);
invalidExistingTarget.targets[0].playable = true;
invalidExistingTarget.targets[0].initialStatus = "pending";
assert.throws(
  () => createRecordingWorkspace({ projectRoot, workspaceRoot, catalog: invalidExistingTarget }),
  /pending target must be nonplayable/
);
```

Assert the rejected constructors do not create `workspaceRoot` or `state.json`.

- [ ] **Step 2: Write the failing nonplayable detail test**

Extend the UI fixture with one target:

```js
fixtureTarget("reading:new-grammar-1", {
  category: "reading",
  playable: false,
  initialStatus: "pending"
})
```

Select it and assert:

```js
assert.match(document.getElementById("target-detail").textContent, /这是新增内容，需要首次录制/);
assert.doesNotMatch(document.getElementById("target-detail").textContent, /当前课程音频正确|需要重新录制/);
assert.equal(document.getElementById("target-detail").querySelectorAll("audio").length, 0);
assert.equal(calls.some((call) => call.url.includes("/api/audio/current/reading%3Anew-grammar-1")), false);
```

After a saved take is added to its state fixture, assert only the take audio appears and “批准这条 take” remains usable.

- [ ] **Step 3: Run focused tests to verify RED**

Run:

```bash
"$NODE" --test tests/recording-studio-workspace.test.mjs tests/recording-studio-ui.test.mjs
```

Expected: FAIL because workspace accepts mismatched playable/status pairs and the UI always renders current audio.

- [ ] **Step 4: Implement workspace and UI guards**

In the initial catalog validation loop of `createRecordingWorkspace`, add before `catalogById.set`:

```js
if (target.playable === false) {
  assert.equal(target.initialStatus, "pending", `nonplayable target must start pending: ${target.stableId}`);
} else {
  assert.equal(target.playable, true, `catalog target playable flag is invalid: ${target.stableId}`);
  assert.notEqual(target.initialStatus, "pending", `pending target must be nonplayable: ${target.stableId}`);
}
```

In `renderDetail()`, branch before the existing current-audio section:

```js
if (target.playable) {
  renderCurrentAudioSection(fragment, target);
} else {
  fragment.append(empty("这是新增内容，需要首次录制；批准并安全导入前不会进入正式课程。"));
}
```

Extract only the existing current-audio DOM block into `renderCurrentAudioSection`; do not change its playback, backup-finalization or audit handlers. Continue rendering the take section for both branches.

- [ ] **Step 5: Run focused GREEN and mutation boundary checks**

Run:

```bash
"$NODE" --test tests/recording-studio-workspace.test.mjs tests/recording-studio-ui.test.mjs
git diff --check
```

Expected: workspace and UI tests pass; current 527 baseline assertions remain 525 / 0 / 2.

- [ ] **Step 6: Commit nonplayable target support**

```bash
git add tools/recording-studio/workspace.mjs tools/recording-studio/public/app.js tests/recording-studio-workspace.test.mjs tests/recording-studio-ui.test.mjs
git commit -m "fix: guard first-time recording targets"
```

---

### Task 3: Full regression and browser handoff

**Files:**
- Modify only if an exact regression requires it: `tests/recording-studio-ui.test.mjs`
- Verify: `tools/recording-studio/public/index.html`
- Verify: `tools/recording-studio/public/styles.css`
- Verify: `tools/recording-studio/public/app.js`
- Verify: `tools/recording-studio/workspace.mjs`

**Interfaces:**
- Consumes: finished Task 1 and Task 2 behavior.
- Produces: fresh automated and browser evidence; no new production interface.

- [ ] **Step 1: Run all recording-studio focused suites**

```bash
"$NODE" --test tests/recording-studio-catalog.test.mjs
"$NODE" --test tests/recording-studio-workspace.test.mjs
"$NODE" --test tests/recording-studio-importer.test.mjs
"$NODE" --test tests/recording-studio-server.test.mjs
"$NODE" --test tests/start-recording-studio.test.mjs
"$NODE" --test tests/recording-studio-ui.test.mjs
```

Expected: every suite passes. The server and launcher suites require permission to bind only `127.0.0.1`.

- [ ] **Step 2: Run the approved-CN full project check**

```bash
ANA_TILIM_CN_SITE="$PWD/.superpowers/sdd/2026-08-09-edition-order-progress-plan/cn-site" "$NODE" scripts/check-project.mjs
```

Expected: edition parity 29 files, full render 832 states, all recording-studio suites pass, and output ends with `All project checks passed.`

- [ ] **Step 3: Verify the live local UI**

Start or reload `http://127.0.0.1:4175/` and inspect desktop plus 390×844:

- the five cards are visible and counts read 525 / 0 / 2 / 0 / 0 on a fresh baseline;
- clicking “需要新录制 0” shows the empty-result message without an error;
- clicking “需要重新录制 2” shows exactly `alphabet:zhe` and `vocab:korushkunche`;
- combining “需要重新录制”, category `vocab`, and search `korushkunche` shows one target;
- clearing the status filter restores the full 527 list;
- page `scrollWidth === clientWidth` on desktop and mobile;
- console has no warning or error;
- no microphone prompt is accepted and no recording/import mutation is performed during visual verification.

- [ ] **Step 4: Inspect exact scope and commit any test-only correction**

```bash
git status --short
git diff --check
git log -3 --oneline
```

Expected: only the planned studio UI, workspace and test files changed; no course data, manifest, WebM, CN site or deployment file is modified. If no correction was needed, do not create an empty commit.
