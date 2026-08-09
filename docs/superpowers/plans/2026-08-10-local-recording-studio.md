# Local Recording Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立一个只在本机 Chrome 中运行、覆盖 527 个现有真人音频目标并可承接后续新增课程录音的工作台，支持搜索、筛选、多次录制、试听对比、退出续录、安全批准和可回滚导入。

**Architecture:** 工具放在 `tools/recording-studio/`，不进入学习站点静态目录。Node HTTP 服务只绑定 `127.0.0.1`，从五份现有 manifest 和课程数据生成稳定录音目录；浏览器通过同源 API 保存原始 WebM 到被 Git 忽略的 `recording-workspace/`。批准录音只更新工作区状态，显式“预览导入”后才执行备份、预检和原子替换；失败时恢复旧文件并保留失败产物，不批量删除任何文件。

**Tech Stack:** 原生 Node.js HTTP/文件系统 API、原生 HTML/CSS/JavaScript、Chrome `MediaRecorder`、WebM/EBML 校验、`node:test`/`assert` 风格测试、现有课程 VM loader 和 manifest。

## Global Constraints

- 服务必须只监听 `127.0.0.1`，不得监听 `0.0.0.0`，不得部署到 Vercel、国内站或任何公开地址。
- 工作区固定为仓库根目录 `recording-workspace/`，并加入 `.gitignore`；录音草稿、批准状态、备份和导入日志都不得提交。
- 稳定录音 ID 使用 `alphabet:<id>`、`combos:<id>`、`vocab:<id>`、`reading:<id>`、`form-examples:<id>`；显示名称或顺序变化不得改变 ID。
- 当前目录基线必须严格等于 527 项：字母 32、组合 34、词汇 203、阅读 164、写法例词 94。
- 负责人已明确要求 `alphabet:zhe`（`ژ`）与 `vocab:korushkunche`（`كۆرۈشكىچە`，回头见、再会）重新录制；新建工作区时这两项必须直接显示为“需要重录”，不能依赖人工再次标记。
- 其余 525 个当前目标在新工作区中必须显示为“待审听”，不能自动冒充发音已通过；只有负责人逐条试听后才能标记 `approved-current`，发现问题则进入 `needs-rerecord`。
- 每个目标显示维文、ULY、中文释义；存在英语释义时显示英语，没有时明确显示“暂无英语释义”，不得伪造翻译。
- 每个目标可以保存多个 take；录制新 take 不覆盖旧 take，也不自动批准。
- “批准 take”只改变工作区状态；“导入课程”必须经过独立预览和第二次确认。
- 导入前校验 WebM EBML 头、正数时长、最小字节数、稳定 ID、目标路径、录音文本哈希和重复目标。
- 导入前逐个备份已有目标文件；失败回滚不得批量删除。对于原先不存在的目标文件，把失败创建的文件移动到 `recording-workspace/failed-imports/`，不删除。
- 新版导入并试听确认后，允许负责人按单个稳定 ID 执行“确认新版并删除旧版备份”；每次只能删除一个已经验证且仍与导入日志匹配的明确备份文件，禁止批量清理和递归删除。
- 旧的 `prototype/re-record-audio.html` 与 `prototype/re-record-audio.js` 保留，不能删除或改成公开后台。
- 不读取 Gmail、不发送邮件、不处理用户反馈；该工作台仅用于本地课程音频制作。
- 所有测试命令使用：

```bash
NODE='/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
```

- 只暂存本计划列出的文件；不修改真实国内站，国内版验证只使用批准的隔离 scratch。

---

### Task 1: 抽取共享 WebM 校验器

**Files:**
- Create: `tools/lib/webm-audio.mjs`
- Create: `tests/webm-audio.test.mjs`
- Modify: `tools/import-form-example-audio.mjs:72-105`
- Modify: `tests/human-audio.test.mjs`
- Modify: `scripts/check-project.mjs`

**Interfaces:**
- `readWebmDurationMilliseconds(buffer: Buffer): number`
- `validateWebmBuffer(buffer: Buffer, options?): { size: number, durationMs: number, mimeType: "audio/webm" }`

- [ ] **Step 1: Write the failing shared-validator test**

Create `tests/webm-audio.test.mjs` with real manifest files plus malformed fixtures:

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import { readWebmDurationMilliseconds, validateWebmBuffer } from "../tools/lib/webm-audio.mjs";

const valid = fs.readFileSync("prototype/assets/audio/human/alphabet/human_letter_01_b.webm");
const result = validateWebmBuffer(valid);
assert.equal(result.mimeType, "audio/webm");
assert.equal(result.size, valid.length);
assert.ok(result.durationMs > 0);
assert.equal(readWebmDurationMilliseconds(valid), result.durationMs);

assert.throws(() => validateWebmBuffer(Buffer.from("not-webm")), /WebM header/);
assert.throws(() => validateWebmBuffer(valid.subarray(0, 100)), /4096 bytes/);
assert.throws(() => validateWebmBuffer(Buffer.concat([valid.subarray(0, 4), Buffer.alloc(5000)])), /duration/);
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
$NODE tests/webm-audio.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `tools/lib/webm-audio.mjs`.

- [ ] **Step 3: Implement the shared validator**

Create `tools/lib/webm-audio.mjs` using the existing EBML logic from `tools/import-form-example-audio.mjs`:

```js
import assert from "node:assert/strict";

function readEbmlVint(buffer, offset) {
  const firstByte = buffer[offset];
  let length = 1;
  let marker = 0x80;
  while (length <= 8 && !(firstByte & marker)) {
    length += 1;
    marker >>= 1;
  }
  assert.ok(length <= 8 && offset + length <= buffer.length, "WebM should contain a valid EBML integer");
  let value = firstByte & (marker - 1);
  for (let index = 1; index < length; index += 1) value = value * 256 + buffer[offset + index];
  return { length, value };
}

export function readWebmDurationMilliseconds(buffer) {
  const durationId = Buffer.from([0x44, 0x89]);
  const durationOffset = buffer.indexOf(durationId);
  assert.notEqual(durationOffset, -1, "WebM should contain a duration element");
  const size = readEbmlVint(buffer, durationOffset + durationId.length);
  const valueOffset = durationOffset + durationId.length + size.length;
  if (size.value === 4) return buffer.readFloatBE(valueOffset);
  if (size.value === 8) return buffer.readDoubleBE(valueOffset);
  assert.fail(`WebM duration should use 4 or 8 bytes, received ${size.value}`);
}

export function validateWebmBuffer(buffer, { minBytes = 4096 } = {}) {
  assert.ok(Buffer.isBuffer(buffer), "WebM input must be a Buffer");
  assert.ok(buffer.length > minBytes, `WebM should contain more than ${minBytes} bytes`);
  assert.deepEqual([...buffer.subarray(0, 4)], [0x1a, 0x45, 0xdf, 0xa3], "WebM header is invalid");
  const durationMs = readWebmDurationMilliseconds(buffer);
  assert.ok(Number.isFinite(durationMs) && durationMs > 0, "WebM duration must be positive");
  return { size: buffer.length, durationMs, mimeType: "audio/webm" };
}
```

- [ ] **Step 4: Replace duplicate parser usage**

Import the helper in `tools/import-form-example-audio.mjs` and `tests/human-audio.test.mjs`; remove only their duplicated EBML functions, not the surrounding import/manifest assertions.

- [ ] **Step 5: Add the test to project checks and run GREEN**

Run:

```bash
$NODE tests/webm-audio.test.mjs
$NODE tools/import-form-example-audio.mjs --check /private/tmp/ana-tilim-form-audio-fixture
$NODE tests/human-audio.test.mjs
$NODE scripts/check-project.mjs
```

Expected: all pass; project check includes the new validator test.

- [ ] **Step 6: Commit Task 1**

```bash
git add tools/lib/webm-audio.mjs tools/import-form-example-audio.mjs tests/webm-audio.test.mjs tests/human-audio.test.mjs scripts/check-project.mjs
git commit -m "refactor: share WebM audio validation"
```

---

### Task 2: Build the complete stable recording catalog

**Files:**
- Create: `tools/recording-studio/catalog.mjs`
- Create: `tests/recording-studio-catalog.test.mjs`
- Modify: `scripts/check-project.mjs`

**Interfaces:**

```js
export function buildRecordingCatalog({ projectRoot }): {
  schemaVersion: 1,
  generatedAt: string,
  targets: RecordingTarget[]
}
```

`RecordingTarget`:

```js
{
  stableId: "reading:sentence-this-that-1",
  category: "reading",
  sourceId: "sentence-this-that-1",
  groupId: "sentence-this-that",
  value: "بۇ قەلەم.",
  latin: "Bu qelem.",
  meaning: "这是笔。",
  english: "This is a pen.",
  currentFile: "human_reading_sentence_this_that_1.webm",
  outputPath: "./assets/audio/human/reading/human_reading_sentence_this_that_1.webm",
  absoluteOutputPath: path.join(projectRoot, "prototype/assets/audio/human/reading/human_reading_sentence_this_that_1.webm"),
  recordingTextHash: "sha256-hex",
  playable: true,
  initialStatus: "pending-review" | "needs-rerecord"
}
```

- [ ] **Step 1: Write the failing catalog contract**

Create `tests/recording-studio-catalog.test.mjs`:

```js
import assert from "node:assert/strict";
import path from "node:path";
import { buildRecordingCatalog } from "../tools/recording-studio/catalog.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const catalog = buildRecordingCatalog({ projectRoot });
assert.equal(catalog.schemaVersion, 1);
assert.equal(catalog.targets.length, 527);
assert.deepEqual(
  Object.fromEntries(["alphabet", "combos", "vocab", "reading", "form-examples"].map((category) => [category, catalog.targets.filter((item) => item.category === category).length])),
  { alphabet: 32, combos: 34, vocab: 203, reading: 164, "form-examples": 94 }
);
assert.equal(new Set(catalog.targets.map((item) => item.stableId)).size, 527);
for (const target of catalog.targets) {
  assert.match(target.stableId, /^(alphabet|combos|vocab|reading|form-examples):[a-z0-9-]+$/);
  assert.ok(target.value.trim());
  assert.ok(target.latin.trim());
  assert.ok(target.meaning.trim());
  assert.match(target.recordingTextHash, /^[a-f0-9]{64}$/);
  assert.ok(target.absoluteOutputPath.startsWith(path.join(projectRoot, "prototype/assets/audio/human") + path.sep));
}
assert.ok(catalog.targets.find((item) => item.stableId === "alphabet:aa"));
assert.ok(catalog.targets.find((item) => item.stableId === "form-examples:form-example-1bieeo2"));
assert.equal(catalog.targets.find((item) => item.stableId === "alphabet:zhe").initialStatus, "needs-rerecord");
assert.equal(catalog.targets.find((item) => item.stableId === "vocab:korushkunche").initialStatus, "needs-rerecord");
assert.equal(catalog.targets.filter((item) => item.initialStatus === "needs-rerecord").length, 2);
assert.equal(catalog.targets.filter((item) => item.initialStatus === "pending-review").length, 525);
```

- [ ] **Step 2: Run RED**

```bash
$NODE tests/recording-studio-catalog.test.mjs
```

Expected: `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement manifest loading and normalization**

`catalog.mjs` must import `loadCourseData()` from `tools/import-form-example-audio.mjs`, read the five manifest files, and build immutable targets:

```js
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loadCourseData } from "../import-form-example-audio.mjs";

const CATEGORY_MANIFESTS = Object.freeze({
  alphabet: "prototype/assets/audio/human/alphabet/manifest.json",
  combos: "prototype/assets/audio/human/combos/manifest.json",
  vocab: "prototype/assets/audio/human/vocab/manifest.json",
  reading: "prototype/assets/audio/human/reading/manifest.json",
  "form-examples": "prototype/assets/audio/human/form-examples/manifest.json"
});

function recordingTextHash({ value, latin, meaning, english }) {
  return crypto.createHash("sha256").update(JSON.stringify({ value, latin, meaning, english })).digest("hex");
}

function stableSourceId(category, item) {
  if (category === "alphabet") return item.letterId;
  return item.id;
}

export function buildRecordingCatalog({ projectRoot }) {
  const course = loadCourseData();
  const targets = Object.entries(CATEGORY_MANIFESTS).flatMap(([category, relativeManifest]) => {
    const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, relativeManifest), "utf8"));
    return manifest.items.map((item) => normalizeTarget({ projectRoot, course, category, item }));
  });
  return Object.freeze({ schemaVersion: 1, generatedAt: new Date().toISOString(), targets: targets.map(Object.freeze) });
}
```

`normalizeTarget` must join by exact stable ID to `letterDetails`, `comboGroups`, `vocabGroups`, `readingUnits` and `formExamples`. It must reject missing joins, duplicate IDs, output paths outside `prototype/assets/audio/human`, or mismatched manifest `value`/`latin`.

- [ ] **Step 4: Add drift and path-escape negative tests**

Copy one manifest to a temp project fixture and mutate its ID, value and `outputPath` one at a time. Assert each build throws before returning any catalog.

- [ ] **Step 5: Run GREEN and full checks**

```bash
$NODE tests/recording-studio-catalog.test.mjs
$NODE tests/human-audio.test.mjs
$NODE scripts/check-project.mjs
```

- [ ] **Step 6: Commit Task 2**

```bash
git add tools/recording-studio/catalog.mjs tests/recording-studio-catalog.test.mjs scripts/check-project.mjs
git commit -m "feat: build complete recording catalog"
```

---

### Task 3: Persist recording state and multiple takes safely

**Files:**
- Create: `tools/recording-studio/workspace.mjs`
- Create: `tests/recording-studio-workspace.test.mjs`
- Modify: `.gitignore`
- Modify: `scripts/check-project.mjs`

**Interfaces:**

```js
export function createRecordingWorkspace({ projectRoot, workspaceRoot, catalog }) {
  return {
    loadState(),
    saveTake({ stableId, buffer, createdAt }),
    approveTake({ stableId, takeId }),
    markCurrentApproved({ stableId }),
    setTargetStatus({ stableId, status }),
    getTakePath({ stableId, takeId })
  };
}
```

- [ ] **Step 1: Write the failing persistence test**

Use `fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-recording-"))`. Assert:

```js
const first = workspace.saveTake({ stableId: "alphabet:aa", buffer: validWebm, createdAt: "2026-08-10T01:00:00.000Z" });
const second = workspace.saveTake({ stableId: "alphabet:aa", buffer: validWebm, createdAt: "2026-08-10T01:01:00.000Z" });
assert.notEqual(first.id, second.id);
assert.equal(workspace.loadState().targets["alphabet:aa"].takes.length, 2);
workspace.approveTake({ stableId: "alphabet:aa", takeId: second.id });
assert.equal(createRecordingWorkspace(options).loadState().targets["alphabet:aa"].approvedTakeId, second.id);
assert.ok(fs.existsSync(path.join(workspaceRoot, second.relativePath)));
assert.throws(() => workspace.saveTake({ stableId: "alphabet:unknown", buffer: validWebm }), /unknown recording target/);
assert.throws(() => workspace.approveTake({ stableId: "alphabet:aa", takeId: "take-from-another-target" }), /does not belong/);
```

- [ ] **Step 2: Run RED**

```bash
$NODE tests/recording-studio-workspace.test.mjs
```

- [ ] **Step 3: Implement atomic state storage**

Use this state contract:

```js
{
  schemaVersion: 1,
  updatedAt: "ISO timestamp",
  targets: {
    "alphabet:aa": {
      status: "pending" | "needs-rerecord" | "recorded" | "approved-current" | "approved-take" | "imported",
      approvedTakeId: null | "take-id",
      takes: [{ id, relativePath, createdAt, size, durationMs, recordingTextHash }]
    }
  }
}
```

Write state to `recording-workspace/state.json.tmp`, `fsync`, then rename to `state.json`. Save takes under encoded stable IDs:

```js
const targetDirectory = path.join(workspaceRoot, "takes", encodeURIComponent(stableId));
const takeId = `${createdAt.replace(/[:.]/g, "-")}-${crypto.randomBytes(4).toString("hex")}`;
const relativePath = path.join("takes", encodeURIComponent(stableId), `${takeId}.webm`);
```

Validate WebM before creating the take file. Validate `recordingTextHash` against the current catalog before every state mutation.

- [ ] **Step 4: Add recovery and corruption tests**

Cover: missing state creates the schema with `alphabet:zhe` and `vocab:korushkunche` visibly derived as `needs-rerecord` and the other 525 targets as `pending-review`; `markCurrentApproved()` is the only way to turn an unmodified current file into `approved-current`; malformed JSON is rejected without overwrite; `needs-rerecord` and `approved-current` survive restart; stale catalog text hash makes prior approval/takes visible but unapprovable; a failed state rename leaves old `state.json` bytes unchanged.

- [ ] **Step 5: Ignore only the workspace root**

Append exactly:

```gitignore
/recording-workspace/
```

Do not ignore `tools/recording-studio/` or any course manifests.

- [ ] **Step 6: Run GREEN and commit**

```bash
$NODE tests/recording-studio-workspace.test.mjs
$NODE scripts/check-project.mjs
git check-ignore recording-workspace/state.json
git add .gitignore tools/recording-studio/workspace.mjs tests/recording-studio-workspace.test.mjs scripts/check-project.mjs
git commit -m "feat: persist recording studio takes"
```

---

### Task 4: Add previewed, backed-up and reversible import

**Files:**
- Create: `tools/recording-studio/importer.mjs`
- Create: `tests/recording-studio-importer.test.mjs`
- Modify: `scripts/check-project.mjs`

**Interfaces:**

```js
export function createImportController({ projectRoot, workspaceRoot, catalog, workspace }) {
  return {
    previewImport(): ImportPlan,
    applyImport({ planId }): ImportResult,
    finalizeReplacement({ importId, stableId }): FinalizeResult
  };
}
```

`ImportPlan` contains a SHA-256 `planId`, `createdAt`, and exact operations:

```js
{
  stableId,
  approvedTakeId,
  sourcePath,
  targetPath,
  currentSha256,
  replacementSha256,
  recordingTextHash,
  targetExisted
}
```

- [ ] **Step 1: Write the failing transaction tests**

The test fixture must include three targets: one unchanged current file, two approved replacement takes. Assert:

- `previewImport()` includes only approved takes whose replacement SHA differs from current.
- preview is read-only: no backup, target or state bytes change.
- applying a stale `planId` or a plan after target bytes changed throws before the first write.
- success writes backups and exact replacements, then marks only imported targets.
- injected failure on the second replacement restores the first target’s exact bytes and moves any newly created target into `failed-imports/`.
- no code path calls `rm`, recursive deletion, `rmSync`, or `rmdirSync`.
- `finalizeReplacement()` rejects unknown, failed, rolled-back or stale imports; after a successful replacement it deletes exactly one verified backup with `unlinkSync`, keeps the imported production file unchanged, and appends a finalization log.

- [ ] **Step 2: Run RED**

```bash
$NODE tests/recording-studio-importer.test.mjs
```

- [ ] **Step 3: Implement complete preflight before mutation**

Preflight must perform all reads and checks before creating backup directories:

```js
for (const operation of plan.operations) {
  assert.equal(catalogById.get(operation.stableId)?.recordingTextHash, operation.recordingTextHash);
  assert.equal(sha256(fs.readFileSync(operation.sourcePath)), operation.replacementSha256);
  assert.equal(operation.targetExisted ? sha256(fs.readFileSync(operation.targetPath)) : null, operation.currentSha256);
  assert.ok(isInsideAudioRoot(operation.targetPath));
  fs.accessSync(path.dirname(operation.targetPath), fs.constants.W_OK | fs.constants.X_OK);
}
```

Reject symlinks in every target path component with `lstatSync`; resolve `realpath` of the nearest existing parent and require containment in `prototype/assets/audio/human`.

- [ ] **Step 4: Implement backup and rollback without deletion**

Backups live at:

```text
recording-workspace/backups/<ISO-safe-timestamp>/<category>/<filename>
```

Stage every replacement as a sibling `.ana-tilim-import-<planId>.tmp`, validate it again, then rename. On failure:

- restore each prior file from its backup;
- move any target that did not exist before into `recording-workspace/failed-imports/<planId>/`;
- move remaining temp files into the same failed-import folder;
- restore old workspace state bytes;
- write an immutable JSON failure log; do not delete files.

After the operator has played the imported production audio, `finalizeReplacement({ importId, stableId })` must re-check the exact replacement SHA, import log, backup path containment and symlink boundary, then remove only that one explicit backup with `unlinkSync`. There is no “finalize all” API.

- [ ] **Step 5: Run GREEN, full checks and commit**

```bash
$NODE tests/recording-studio-importer.test.mjs
$NODE tests/human-audio.test.mjs
$NODE scripts/check-project.mjs
git add tools/recording-studio/importer.mjs tests/recording-studio-importer.test.mjs scripts/check-project.mjs
git commit -m "feat: import approved recordings safely"
```

---

### Task 5: Expose a localhost-only HTTP API

**Files:**
- Create: `tools/recording-studio/server.mjs`
- Create: `tests/recording-studio-server.test.mjs`
- Modify: `scripts/check-project.mjs`

**Interfaces:**

```js
export async function createRecordingStudioServer({
  projectRoot,
  workspaceRoot = path.join(projectRoot, "recording-workspace"),
  host = "127.0.0.1",
  port = 4175,
  openBrowser = false
})
```

API:

- `GET /api/catalog`
- `GET /api/state`
- `GET /api/audio/current/:stableId`
- `GET /api/audio/take/:stableId/:takeId`
- `POST /api/takes/:stableId` with raw `audio/webm` body, max 20 MiB
- `POST /api/targets/:stableId/status` with `{ "status": "needs-rerecord" }` or `{ "status": "pending" }`
- `POST /api/targets/:stableId/approve` with `{ "takeId": "2026-08-10T01-00-00-000Z-a1b2c3d4" }`
- `POST /api/targets/:stableId/approve-current` with `{}`
- `POST /api/import/preview` with `{}`
- `POST /api/import/apply` with `{ "planId": "7c3a21b4427c66859adfb51c85c3cb94f8a5ae2d4fa3f698ad0bf8d637b621ca" }`
- `POST /api/import/finalize` with `{ "importId": "import-id", "stableId": "alphabet:zhe" }`

- [ ] **Step 1: Write server security and behavior tests**

Start with `port: 0`, assert the returned address uses `127.0.0.1`, and exercise every API. Include negative cases for:

- constructor called with `host: "0.0.0.0"` or `host: "::"`;
- invalid stable ID encoding and path traversal;
- wrong `Content-Type`;
- body over 20 MiB;
- non-local `Origin` header;
- unknown routes;
- import apply without a fresh preview plan.
- finalize without a matching successful import, finalize the same backup twice, or any request that implies more than one stable ID.

- [ ] **Step 2: Run RED**

```bash
$NODE tests/recording-studio-server.test.mjs
```

- [ ] **Step 3: Implement exact routing and JSON errors**

Return errors as:

```js
{ "error": { "code": "INVALID_RECORDING", "message": "录音文件无效，请重新录制。" } }
```

Never include absolute local paths or stack traces in HTTP responses. Serve static UI only from `tools/recording-studio/public/` using an extension allowlist (`.html`, `.css`, `.js`, `.svg`); reject dotfiles and `..` before resolving.

- [ ] **Step 4: Add shutdown and port-conflict coverage**

The returned object must expose `url`, `address`, and `close()`. A busy port must produce a Chinese terminal message and nonzero exit without falling back to a public host.

- [ ] **Step 5: Run GREEN and commit**

```bash
$NODE tests/recording-studio-server.test.mjs
$NODE scripts/check-project.mjs
git add tools/recording-studio/server.mjs tests/recording-studio-server.test.mjs scripts/check-project.mjs
git commit -m "feat: serve recording studio locally"
```

---

### Task 6: Build the Chrome recording and comparison interface

**Files:**
- Create: `tools/recording-studio/public/index.html`
- Create: `tools/recording-studio/public/styles.css`
- Create: `tools/recording-studio/public/app.js`
- Create: `tests/recording-studio-ui.test.mjs`
- Modify: `scripts/check-project.mjs`

**UI state contract:**

```js
const state = {
  catalog: [],
  workspace: null,
  selectedStableId: null,
  query: "",
  category: "all",
  status: "all",
  activeRecorder: null,
  recordingTargetId: null,
  previewPlan: null
};
```

- [ ] **Step 1: Write the failing DOM/VM test**

The harness must load the real `public/app.js` with fake `fetch`, `MediaRecorder`, `Audio`, `Blob`, and DOM. Assert:

- catalog renders all five categories and count summary;
- search matches维文、ULY、中文、英文和 stable ID;
- status filters distinguish current approved, take approved, recorded, imported and pending;
- clicking a row selects it without changing approval;
- current audio and every take have independent play controls;
- start/stop records immutable `recordingTargetId` even if a row click occurs while finalizing;
- a completed blob posts raw `audio/webm` to `/api/takes/<encoded stableId>`;
- a failed upload retains the local preview and allows retry;
- approving a take does not call import preview/apply;
- import apply is disabled until a successful fresh preview exists.

- [ ] **Step 2: Run RED**

```bash
$NODE tests/recording-studio-ui.test.mjs
```

- [ ] **Step 3: Implement the document structure**

Use one main landmark, one status region and clearly labelled controls:

```html
<header class="studio-header">
  <div><p class="eyebrow">Ana Tilim 本地工具</p><h1>音频录制工作台</h1></div>
  <p id="local-only-note">仅保存在这台电脑，不会自动上传或上线。</p>
</header>
<main>
  <section aria-labelledby="filter-title">
    <h2 id="filter-title">查找录音目标</h2>
    <label>搜索 <input id="target-search" type="search" autocomplete="off"></label>
    <label>分类 <select id="category-filter"></select></label>
    <label>状态 <select id="status-filter"></select></label>
  </section>
  <section class="studio-layout">
    <div id="target-list" role="list"></div>
    <article id="target-detail" aria-live="polite"></article>
  </section>
  <section id="import-panel" aria-labelledby="import-title">
    <h2 id="import-title">批准录音导入</h2>
    <button id="preview-import" type="button">预览导入</button>
    <div id="import-plan"></div>
    <button id="apply-import" type="button" disabled>确认导入</button>
  </section>
</main>
<div id="studio-status" role="status" aria-live="polite"></div>
```

- [ ] **Step 4: Implement recording lifecycle**

Use `MediaRecorder` only with supported WebM MIME types. Release tracks on stop, error and page unload. Disable target switching only while requesting/recording/finalizing, then restore focus to the recorded target. Do not auto-download files.

- [ ] **Step 5: Implement comparison and approval**

The target detail must show:

- fixed target text, ULY, Chinese and optional English;
- current course audio;
- take cards ordered newest first with duration, created time, play, approve;
- a visible `已批准当前音频` or `已批准 take N` state;
- an explicit “重新录一条” action that never removes old takes.

- [ ] **Step 6: Implement import preview**

The first click calls `/api/import/preview` and renders exact target count, filenames, old/new hashes, backup destination and changed text warnings. The second button says `确认导入 N 个批准录音`; after success it refreshes catalog/state and clears only the in-memory plan.

- [ ] **Step 7: Add accessibility and error regression tests**

Cover keyboard focus, `aria-current`, unique audio labels, microphone denial, unsupported MediaRecorder, empty take, stale take, stale plan, and reload restoring the selected pending target from workspace state.

- [ ] **Step 8: Run GREEN and commit**

```bash
$NODE tests/recording-studio-ui.test.mjs
$NODE tests/recording-studio-server.test.mjs
$NODE scripts/check-project.mjs
git add tools/recording-studio/public/index.html tools/recording-studio/public/styles.css tools/recording-studio/public/app.js tests/recording-studio-ui.test.mjs scripts/check-project.mjs
git commit -m "feat: add recording studio interface"
```

---

### Task 7: Add the launcher, operator guide and end-to-end verification

**Files:**
- Create: `tools/start-recording-studio.mjs`
- Create: `docs/recording-studio.md`
- Create: `tests/start-recording-studio.test.mjs`
- Modify: `scripts/check-project.mjs`

- [ ] **Step 1: Write the failing launcher test**

Import the launcher without side effects, start with `--no-open --port 0`, and assert:

- printed URL starts `http://127.0.0.1:`;
- child browser opening is skipped under `--no-open`;
- default open command on macOS is exactly `open -a "Google Chrome" <local-url>`;
- SIGINT closes the HTTP server without deleting drafts;
- a restart loads the same target state and take list.

- [ ] **Step 2: Run RED**

```bash
$NODE tests/start-recording-studio.test.mjs
```

- [ ] **Step 3: Implement a safe launcher**

`tools/start-recording-studio.mjs` must export `main(args, dependencies)` and only execute when run directly. Default port is 4175. It may open Chrome only after the server is listening; failing to open Chrome leaves the server running and prints the URL for manual opening.

- [ ] **Step 4: Write the operator guide**

`docs/recording-studio.md` must describe exactly:

1. start command;
2. microphone permission;
3. category/search/status filters;
4. record multiple takes;
5. compare current and takes;
6. approve one take or keep current;
7. preview import;
8. confirm import;
9. where drafts/backups/logs live;
10. how to stop the server;
11. that importing is not deployment;
12. how final course expansion will add new pending targets.

- [ ] **Step 5: Run automated verification**

```bash
$NODE tests/start-recording-studio.test.mjs
$NODE tests/recording-studio-catalog.test.mjs
$NODE tests/recording-studio-workspace.test.mjs
$NODE tests/recording-studio-importer.test.mjs
$NODE tests/recording-studio-server.test.mjs
$NODE tests/recording-studio-ui.test.mjs
$NODE scripts/check-project.mjs
git diff --check
```

- [ ] **Step 6: Run real Chrome QA**

Start:

```bash
$NODE tools/start-recording-studio.mjs --port 4175
```

Verify in Chrome at desktop and 390×844:

- page loads only from `127.0.0.1` and console has no errors;
- catalog totals 527 and filters/search work;
- record two takes for one target, reload, and confirm both remain;
- compare current and both takes;
- approve one take, reload, and confirm approval remains;
- preview import without applying and confirm target bytes remain unchanged;
- perform a fixture import, verify backup and target hashes, then use fixture-only rollback fault to verify exact restoration;
- no page-level horizontal overflow; long维文/ULY/Chinese/English labels wrap safely;
- closing and reopening Chrome resumes unfinished status.

- [ ] **Step 7: Final scope audit and commit**

Confirm `git status --short` does not include `recording-workspace/` and does not include any production audio file changed during fixture QA.

```bash
git add tools/start-recording-studio.mjs docs/recording-studio.md tests/start-recording-studio.test.mjs scripts/check-project.mjs
git commit -m "docs: finish local recording studio workflow"
```

## Completion Gate

Do not start the final course expansion plan until all of the following are true:

- the studio shows exactly 527 current targets;
- multiple takes and approvals survive browser/server restart;
- a real WebM take passes shared validation;
- import preview is read-only;
- success creates recoverable backups;
- injected failure restores exact old bytes;
- the studio never listens on a public interface;
- `recording-workspace/` is ignored and absent from Git;
- full project checks remain green.
