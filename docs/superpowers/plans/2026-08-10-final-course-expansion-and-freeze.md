# Final Course Expansion and Freeze Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不增加单元和底部导航的前提下，为语法入门新增 4 组 12 条、为基础句型新增 4 组 16 条，配齐严格对应的真人音频和五步练习，保证中途退出后续学，并在两版上线后正式冻结课程内容。

**Architecture:** 先在不被站点加载的审校目录中建立 28 条四语阅读内容、练习及一条词汇纠错合同；通过本地录音工作台录制、批准并导入 29 个 WebM 后，再一次性把批准数据、英语覆盖、manifest 和互动练习接入现有课程。新增组复用现有 `reading` 进度桶，使用有序 `completedIds` 派生当前五步，不新增持久化瞬时字段。共享实现通过安全同步脚本进入国内版，国内版继续隐藏名人名言、保持无登录/无外链；最终用内容冻结测试锁定两版单元、组数、条目数和音频数。

**Tech Stack:** 原生 JavaScript/HTML/CSS、现有静态 course-data/i18n 架构、现有 local/export/import/Supabase cloud progress、WebM manifests、本地录音工作台、Node.js VM/assert 测试、Vercel、CloudBase 静态托管。

## Global Constraints

- 本计划必须在 `2026-08-10-local-recording-studio.md` 的 Completion Gate 全部通过后执行。
- 本计划必须在 `2026-08-10-unit-2-4-learning-maps.md` 已集成且第二、第四单元回归全绿后执行；不得覆盖其四入口、返回、续学、书写和反馈修复。
- Global 仍为 12 个可见单元；CN 仍为 11 个可见单元，仅按既有配置隐藏 `famous-quotes`。
- 不新增“练习”底部导航，不新增第十三单元，不重排现有 12 个稳定 unit ID。
- 语法组从 6 增至 10，基础句型组从 8 增至 12；阅读条目从 164 增至 192。
- 负责人已明确移除词汇 `hayr`（`خەير / xeyr / 再见、告辞`）：课程数据、分组引用、词汇 manifest 和唯一文件 `prototype/assets/audio/human/vocab/human_vocab_hayr.webm` 必须一起移除；删除只允许针对这个明确文件执行一次，不得批量删除。最终词汇为 202 项，最终录音目录为 554 项。
- 负责人已明确把词汇 `marhaba`（当前 `مەرھابا / merhaba / 不客气、请`）更正为新稳定 ID `erzimaydu`、标准维文 `ئەرزىمەيدۇ`、ULY `erzimeydu`、中文“不客气、不用谢”、英文“You're welcome.”。新词先作为未发布待录目标，真人音频批准并导入后才原子替换课程与 manifest，最后逐个删除旧 `human_vocab_marhaba.webm`；不得先让无音频的新词进入正式课程。
- 负责人要求全量审听：最终 554 个正式目录目标都必须是 `approved-current` 或 `imported`，不得遗留 `pending-review`、`needs-rerecord`、无效或错文音频。程序负责全量文字、ID、路径、哈希和 WebM 接线验证，负责人通过本地工作台完成真人发音逐条听审。
- 新增 28 条必须逐条包含稳定 ID、维文、ULY、中文、英语、教学说明和审校状态；不得用机器翻译运行时生成。
- 新内容只允许使用课程已教词汇或在同卡中解释的新词；不得突然加入超出入门层级的长句和抽象语法术语。
- 每个新增组固定五步：规则、对比例句、识别、排序、补全；旧组保持当前读例句界面，不强行重写。
- 新组进度只写 `learningProgress.reading[groupId].completedIds` 和 `completed`；顺序固定为 `rule → compare → recognition → ordering → completion`。
- 退出、刷新、导出/导入和海外登录同步都从第一个未完成步骤恢复；瞬时选项不持久化。
- 新增 28 条发布前必须有对应真人 WebM；ID、可见维文和 manifest `value` 必须逐字一致。
- Global 和 CN 使用同一组课程文本与音频；只保留既有品牌、登录、云同步和名人名言可见性差异。
- 不把本地录音工作台、工作区、备份或批准日志部署到任何站点。
- 上线前执行完整自动化、两版桌面/390×844 浏览器 QA、音频播放抽查、刷新续学和线上缓存版本核对。
- 所有测试命令使用：

```bash
NODE='/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node'
```

- 删除任何文件时只能逐个明确路径处理；本计划没有批量删除步骤。

## Approved Stable IDs

新增语法组和条目：

```text
grammar-person-verbs
  grammar-person-verbs-1
  grammar-person-verbs-2
  grammar-person-verbs-3
grammar-possession
  grammar-possession-1
  grammar-possession-2
  grammar-possession-3
grammar-location-direction
  grammar-location-direction-1
  grammar-location-direction-2
  grammar-location-direction-3
grammar-basic-time
  grammar-basic-time-1
  grammar-basic-time-2
  grammar-basic-time-3
```

新增基础句型组和条目：

```text
sentence-self-introduction
  sentence-self-introduction-1
  sentence-self-introduction-2
  sentence-self-introduction-3
  sentence-self-introduction-4
sentence-location-direction
  sentence-location-direction-1
  sentence-location-direction-2
  sentence-location-direction-3
  sentence-location-direction-4
sentence-ability-preference
  sentence-ability-preference-1
  sentence-ability-preference-2
  sentence-ability-preference-3
  sentence-ability-preference-4
sentence-polite-reason
  sentence-polite-reason-1
  sentence-polite-reason-2
  sentence-polite-reason-3
  sentence-polite-reason-4
```

---

### Task 1: Create and review the final 28-item content contract

**Files:**
- Create: `课程/语法与基础句型/最终增补审校表.md`
- Create: `课程/语法与基础句型/final-reading-additions.json`
- Create: `tests/final-reading-additions.test.mjs`
- Modify: `prototype/course-data/vocab-data.js`
- Modify: `prototype/assets/audio/human/vocab/manifest.json`
- Modify: `tests/course-data-integrity.test.mjs`
- Modify: `tests/human-audio.test.mjs`
- Delete exactly: `prototype/assets/audio/human/vocab/human_vocab_hayr.webm`
- Modify: `scripts/check-project.mjs`

**JSON contract:**

```js
{
  schemaVersion: 1,
  ownerDecision: "approved-topics",
  releaseStatus: "pending-audio" | "approved",
  units: [
    {
      unitId: "grammar-basics",
      groups: [
        {
          id,
          titleZh,
          titleEn,
          ruleZh,
          ruleEn,
          reviewStatus,
          items: [{ id, value, latin, meaningZh, meaningEn, patternZh, patternEn, lessonZh, lessonEn, reviewStatus }],
          training: {
            steps: ["rule", "compare", "recognition", "ordering", "completion"],
            compareItemIds: [itemId1, itemId2],
            recognition: { promptZh, promptEn, options: [{ id, labelZh, labelEn }], answerId, feedbackZh, feedbackEn },
            ordering: { promptZh, promptEn, tokens: [{ id, value }], answerIds, completedValue },
            completion: { promptZh, promptEn, options: [{ id, value }], answerId, completedValue, meaningZh, meaningEn }
          }
        }
      ]
    }
  ]
}
```

- [ ] **Step 1: Write the failing review-contract test**

The test must assert the exact two units, eight group IDs, 28 item IDs and fixed counts from “Approved Stable IDs”. It must also assert:

```js
assert.deepEqual(group.training.steps, ["rule", "compare", "recognition", "ordering", "completion"]);
assert.equal(new Set(group.items.map((item) => item.value)).size, group.items.length);
assert.ok(group.items.every((item) => item.reviewStatus === "approved"));
assert.ok(group.items.every((item) => /^[A-Za-zËÖÜëöü ',.!?;:\-]+$/u.test(item.latin)));
assert.ok(group.items.every((item) => !/\p{Script=Arabic}/u.test(item.latin)));
assert.ok(group.items.every((item) => item.value.trim() && item.meaningZh.trim() && item.meaningEn.trim()));
assert.ok(group.training.compareItemIds.every((id) => group.items.some((item) => item.id === id)));
assert.equal(group.training.ordering.answerIds.length, group.training.ordering.tokens.length);
assert.equal(
  group.training.ordering.answerIds.map((id) => group.training.ordering.tokens.find((token) => token.id === id).value).join(""),
  group.training.ordering.completedValue
);
```

It must reject duplicate IDs, ULY with Arabic/Cyrillic text, missing translations, `pending` rows, answer IDs outside options, and an ordering result that does not exactly equal an approved item value.

The same RED must assert that `hayr` still exists in the current vocabulary rows/section/manifest/file. GREEN removes all four references and the one explicit WebM file, keeps `korushkunche`, renumbers manifest `order` contiguously, and leaves every unrelated vocabulary literal and audio byte unchanged.

The review JSON must also contain one independently frozen `vocabularyCorrections` row for `erzimaydu` with old ID/path, new ID/path, exact Uyghur/ULY/Chinese/English literals, `reviewStatus: "approved"`, and reliable-source notes. Task 1 does not yet alter the production `marhaba` row/file; it only approves the replacement contract and its future recording text.

- [ ] **Step 2: Run RED**

```bash
$NODE tests/final-reading-additions.test.mjs
```

Expected: FAIL because the approved review files do not exist.

- [ ] **Step 3: Draft the exact 28 rows**

Use the approved topic boundaries:

- 人称 + 动词变化：同一高频动作分别展示“我 / 你 / 他（她）”的形式；
- 领属：我的 / 你的 / 他（她）的；
- 方位方向：在…… / 到…… / 从……；
- 基础时间：现在 / 过去 / 将来意图；
- 自我介绍：姓名、年龄、来自哪里、身份；
- 位置方向：在哪里、去哪里、从哪里来、物体位置；
- 能力意愿偏好：会、想、喜欢、需要；
- 礼貌请求与原因：请、可以吗、因为、所以。

Every row must be an original short teaching sentence, not copied as a passage. Reuse current course vocabulary wherever possible. The审校表 must record, per row: logic check, Uyghur spelling/grammar check, ULY check, Chinese/English meaning check, level check, audio text, and reviewer decision.

- [ ] **Step 4: Review every row independently**

Review the literal维文 against the local教材 evidence and at least one reliable Uyghur grammar reference. Confirm ULY by the existing transliterator, then manually inspect apostrophes and ë/ö/ü. Confirm that Chinese and English express the same sentence rather than a looser paraphrase.

No row becomes `approved` merely because the schema passes. Record the actual corrections and final literal in the Markdown ledger. If a sentence remains uncertain, replace it with a simpler source-backed sentence; do not publish it as pending.

- [ ] **Step 5: Run GREEN and freeze the review artifact**

```bash
$NODE tests/final-reading-additions.test.mjs
$NODE tests/uly-transliteration.test.mjs
$NODE scripts/check-project.mjs
git diff --check
```

- [ ] **Step 6: Commit Task 1**

```bash
git add '课程/语法与基础句型/最终增补审校表.md' '课程/语法与基础句型/final-reading-additions.json' prototype/course-data/vocab-data.js prototype/assets/audio/human/vocab/manifest.json prototype/assets/audio/human/vocab/human_vocab_hayr.webm tests/final-reading-additions.test.mjs tests/course-data-integrity.test.mjs tests/human-audio.test.mjs scripts/check-project.mjs
git commit -m "content: approve final grammar and sentence additions"
```

---

### Task 2: Add the 28 reading targets and one approved vocabulary correction to the recording studio

**Files:**
- Modify: `tools/recording-studio/catalog.mjs`
- Create: `tools/build-final-reading-manifest.mjs`
- Modify: `tests/recording-studio-catalog.test.mjs`
- Create: `tests/build-final-reading-manifest.test.mjs`
- Modify: `scripts/check-project.mjs`

- [ ] **Step 1: Write the failing 555-target pending catalog test**

After loading the approved review contract, expect:

```js
assert.equal(catalog.targets.length, 555);
assert.equal(catalog.targets.filter((item) => item.category === "reading").length, 192);
assert.equal(catalog.targets.filter((item) => item.category === "reading" && !item.playable).length, 28);
assert.equal(catalog.targets.filter((item) => !item.playable).length, 29);
const correction = catalog.targets.find((item) => item.stableId === "vocab:erzimaydu");
assert.deepEqual(
  { value: correction.value, latin: correction.latin, meaning: correction.meaning, currentFile: correction.currentFile, playable: correction.playable },
  { value: "ئەرزىمەيدۇ", latin: "erzimeydu", meaning: "不客气、不用谢", currentFile: "human_vocab_erzimeydu.webm", playable: false }
);
const target = catalog.targets.find((item) => item.stableId === "reading:grammar-person-verbs-1");
assert.equal(target.source, "approved-final-additions");
assert.equal(target.currentFile, "human_reading_grammar_person_verbs_1.webm");
assert.equal(target.outputPath, "./assets/audio/human/reading/human_reading_grammar_person_verbs_1.webm");
assert.equal(target.playable, false);
```

- [ ] **Step 2: Run RED**

```bash
$NODE tests/recording-studio-catalog.test.mjs
```

Expected: after the approved `hayr` removal, catalog remains 526 and does not include the new stable IDs.

- [ ] **Step 3: Merge approved, unpublished targets into the studio only**

`catalog.mjs` must read `final-reading-additions.json`, require `ownerDecision === "approved-topics"` and all row reviews approved, append only reading IDs absent from the production reading manifest, and append the approved `vocab:erzimaydu` correction while `vocab:marhaba` remains available for old/new comparison. Reading filenames are:

```js
const file = `human_reading_${item.id.replaceAll("-", "_")}.webm`;
```

They remain `playable: false` until the target file exists and passes WebM validation. Do not load this JSON from `prototype/index.html`.

- [ ] **Step 4: Write the failing manifest-builder test**

`tools/build-final-reading-manifest.mjs` must export:

```js
export function buildFinalReadingManifest({ projectRoot, reviewContract, currentManifest, checkAudio })
```

The test must prove:

- it preserves all 164 current items byte-for-byte except final `order` normalization;
- it appends exactly 28 items in approved group/item order;
- it rejects missing, malformed, duplicate or wrong-text audio;
- `--check` is read-only;
- `--write` changes only the reading manifest after all 28 files validate.

- [ ] **Step 5: Implement the builder and run GREEN**

Each new manifest row must contain:

```js
{
  order,
  id: item.id,
  unitId,
  groupId,
  value: item.value,
  latin: item.latin,
  file,
  outputPath: `./assets/audio/human/reading/${file}`,
  reviewStatus: "已接入",
  playable: true,
  statusLabel: "真人音频"
}
```

Run:

```bash
$NODE tests/recording-studio-catalog.test.mjs
$NODE tests/build-final-reading-manifest.test.mjs
$NODE scripts/check-project.mjs
```

- [ ] **Step 6: Commit Task 2**

```bash
git add tools/recording-studio/catalog.mjs tools/build-final-reading-manifest.mjs tests/recording-studio-catalog.test.mjs tests/build-final-reading-manifest.test.mjs scripts/check-project.mjs
git commit -m "feat: queue final course recordings"
```

---

### Task 3: Record, approve and import all 29 new human-audio files

**Files:**
- Generate through studio: `recording-workspace/takes/**` (ignored, never commit)
- Create through approved import: `prototype/assets/audio/human/reading/human_reading_grammar_*.webm`
- Create through approved import: `prototype/assets/audio/human/reading/human_reading_sentence_*.webm`
- Create through approved import: `prototype/assets/audio/human/vocab/human_vocab_erzimeydu.webm`
- Modify after validation: `prototype/assets/audio/human/reading/manifest.json`

- [ ] **Step 1: Start the studio and filter pending final-course items**

```bash
$NODE tools/start-recording-studio.mjs --port 4175
```

Use status `待录`; assert the UI shows exactly 29 additions: 28 reading sentences plus `vocab:erzimaydu`. Current production `vocab:marhaba` remains playable only for comparison and is not itself a pending target.

- [ ] **Step 2: Record and compare takes**

For every target:

1. read the fixed维文 exactly;
2. record at least one complete take;
3. listen to the take and compare it with visible text;
4. reject takes with missing syllables, clipped start/end, wrong sentence, excessive noise or incorrect target;
5. approve exactly one take.

The approved take’s `recordingTextHash` must still match the reviewed row.

- [ ] **Step 3: Preview all imports**

Preview must show 29 operations with unique stable IDs and replacement hashes: 28 inside `prototype/assets/audio/human/reading/` and one exact `prototype/assets/audio/human/vocab/human_vocab_erzimeydu.webm`. Because these are new targets, `targetExisted` must be false for every operation.

- [ ] **Step 4: Import and validate audio bytes**

Apply the fresh plan. Then run:

```bash
$NODE tools/build-final-reading-manifest.mjs --check
$NODE tools/build-final-reading-manifest.mjs --write
$NODE tests/webm-audio.test.mjs
$NODE tests/build-final-reading-manifest.test.mjs
```

- [ ] **Step 5: Verify exact 192-item manifest**

```bash
$NODE --input-type=module -e "import fs from 'node:fs'; const m=JSON.parse(fs.readFileSync('prototype/assets/audio/human/reading/manifest.json')); if(m.items.length!==192) process.exit(1); console.log('reading manifest 192');"
```

Check `git status --short` shows exactly 29 new WebM files plus the manifest, not `recording-workspace/`.

- [ ] **Step 6: Commit Task 3**

```bash
git add prototype/assets/audio/human/reading/manifest.json
git add prototype/assets/audio/human/reading/human_reading_grammar_person_verbs_*.webm
git add prototype/assets/audio/human/reading/human_reading_grammar_possession_*.webm
git add prototype/assets/audio/human/reading/human_reading_grammar_location_direction_*.webm
git add prototype/assets/audio/human/reading/human_reading_grammar_basic_time_*.webm
git add prototype/assets/audio/human/reading/human_reading_sentence_self_introduction_*.webm
git add prototype/assets/audio/human/reading/human_reading_sentence_location_direction_*.webm
git add prototype/assets/audio/human/reading/human_reading_sentence_ability_preference_*.webm
git add prototype/assets/audio/human/reading/human_reading_sentence_polite_reason_*.webm
git add prototype/assets/audio/human/vocab/human_vocab_erzimeydu.webm
git commit -m "content: add final grammar and sentence audio"
```

Before committing, inspect the staged file list and confirm only the approved 29 new filenames and the reading manifest are staged; do not use a broad asset-directory add if unrelated audio changes exist.

---

### Task 4: Integrate the approved groups and English content atomically

**Files:**
- Modify: `prototype/course-data/reading-data.js`
- Modify: `prototype/course-data/vocab-data.js`
- Modify: `prototype/i18n/reading-en.js`
- Modify: `prototype/course-data.js`
- Modify: `prototype/assets/audio/human/vocab/manifest.json`
- Delete exactly after new audio validation: `prototype/assets/audio/human/vocab/human_vocab_marhaba.webm`
- Modify: `tests/course-data-integrity.test.mjs`
- Modify: `tests/human-audio.test.mjs`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

- [ ] **Step 1: Write the failing course-data count and literal-binding tests**

Update exact expectations:

```js
assert.equal(readingItems.length, 192);
assert.equal(grammarUnit.groups.length, 10);
assert.equal(sentenceUnit.groups.length, 12);
assert.equal(readingManifest.items.length, 192);
```

Load `final-reading-additions.json` in the test and compare every approved production tuple field-by-field, not only IDs:

```js
for (const approvedGroup of approvedUnits.flatMap((unit) => unit.groups)) {
  const actualGroup = readingUnits.flatMap((unit) => unit.groups).find((group) => group.id === approvedGroup.id);
  assert.deepEqual(
    actualGroup.items.map(({ id, value, latin, meaning, pattern, lesson, reviewStatus }) => ({ id, value, latin, meaning, pattern, lesson, reviewStatus })),
    approvedGroup.items.map(toChineseRuntimeItem)
  );
  assert.deepEqual(actualGroup.training, approvedGroup.training);
}
```

Also assert the English runtime maps every new group and item to the approved English fields.

Assert the approved `erzimaydu` tuple replaces `marhaba` in the greetings group, section and manifest; keeps the production vocabulary count at 202; points to the newly validated `human_vocab_erzimeydu.webm`; and leaves no `marhaba` ID, literal, manifest path or file. The old file may be removed only after the new file passes shared WebM validation and exact text binding.

- [ ] **Step 2: Run RED**

```bash
$NODE tests/course-data-integrity.test.mjs
$NODE tests/human-audio.test.mjs
```

Expected: current counts are 164/6/8 and new IDs are absent.

- [ ] **Step 3: Append approved data without rewriting old groups**

Insert the four grammar groups after `grammar-bar-yoq`, and the four sentence groups after `sentence-question`. Copy literal values from the approved JSON; do not retype from memory. Each group keeps `training` exactly as reviewed.

- [ ] **Step 4: Add English overrides**

In `prototype/i18n/reading-en.js`, add eight group titles and all 28 item meanings/patterns/lessons. Add training prompt/feedback translations if the runtime uses keyed overrides; do not expose Chinese in English mode.

- [ ] **Step 5: Strengthen aggregator and manifest validation**

`prototype/course-data.js` must freeze/validate the new `training` object fields. `tests/course-data-integrity.test.mjs` must reject item value drift, group training drift, mismatched manifest `value`/ULY, a missing audio file, and unapproved review status.

- [ ] **Step 6: Run GREEN and commit**

```bash
$NODE tests/final-reading-additions.test.mjs
$NODE tests/course-data-integrity.test.mjs
$NODE tests/human-audio.test.mjs
$NODE tests/unit-learning-experience.test.mjs
$NODE tests/full-content-render.test.mjs
git diff --check
git add prototype/course-data/reading-data.js prototype/course-data/vocab-data.js prototype/i18n/reading-en.js prototype/course-data.js prototype/assets/audio/human/vocab/manifest.json prototype/assets/audio/human/vocab/human_vocab_marhaba.webm tests/course-data-integrity.test.mjs tests/human-audio.test.mjs tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: add final grammar and sentence content"
```

---

### Task 5: Build the five-step training flow for new groups

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `prototype/i18n/ui-messages.js`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

**Runtime step IDs:**

```js
const readingTrainingStepIds = Object.freeze(["rule", "compare", "recognition", "ordering", "completion"]);
```

**Transient state:**

```js
readingRecognitionAnswerId: "",
readingOrderTokenIds: [],
readingCompletionAnswerId: "",
readingTrainingSubmitted: false
```

- [ ] **Step 1: Write the failing real-interaction test**

Open `grammar-person-verbs` through the real delegated `open-reading-group` action and assert the first screen is the rule stage, not the old list. Exercise the real actions in this order:

```text
continue-reading-training
continue-reading-training
pick-reading-recognition → submit-reading-recognition
pick-reading-order-token × N → submit-reading-order
pick-reading-completion → submit-reading-completion
```

Verify wrong recognition/order/completion shows the approved feedback and does not mark that step. Correct answers mark only that step. After completion, render the group-complete summary and a real next-group button.

- [ ] **Step 2: Run RED**

```bash
$NODE tests/unit-learning-experience.test.mjs
```

Expected: the new group renders all examples at once and none of the training actions exist.

- [ ] **Step 3: Implement derived step selection**

```js
function readingTrainingProgress(group) {
  return state.learningProgress.reading?.[group.id] || {};
}

function currentReadingTrainingStep(group) {
  const completedIds = readingTrainingProgress(group).completedIds || [];
  return readingTrainingStepIds.find((id) => !completedIds.includes(id)) || "complete";
}
```

Only groups with a validated `training` object use this renderer. Existing grammar/sentence/dialogue/story/quote/proverb groups remain on `renderReadingLine`.

- [ ] **Step 4: Implement the five renderers**

- Rule: concise Chinese/English rule and one example with human-audio button.
- Compare: exactly two approved examples, each with维文、ULY、meaning and audio.
- Recognition: radio-like button options, submit, approved explanation, focus restoration.
- Ordering: selectable tokens with `aria-pressed`, current constructed sentence, reset and submit; wrong order remains editable.
- Completion: fixed sentence with one gap, answer choices, exact completed sentence and audio after success.

All learner-facing data must pass through `escapeHtml`; audio labels include the visible target sentence.

- [ ] **Step 5: Implement completion mutation**

```js
function completeReadingTrainingStep(groupId, stepId) {
  const progress = ensureProgress("reading", groupId);
  const completedIds = Array.isArray(progress.completedIds) ? progress.completedIds : [];
  const expectedIndex = completedIds.length;
  if (readingTrainingStepIds[expectedIndex] !== stepId) return false;
  progress.completedIds = [...completedIds, stepId];
  progress.completed = progress.completedIds.length === readingTrainingStepIds.length;
  recordDailyActivity(`reading:${groupId}:${stepId}`);
  markCloudDirty("learning");
  saveLocalProgress();
  return true;
}
```

Do not use `markProgress("reading", group.id, "completed")` until all five ordered steps are complete.

- [ ] **Step 6: Add responsive and keyboard CSS**

Use a single-column training stack on all widths. Comparison may use two columns at desktop but must become one column below 720px. Tokens wrap; long维文 never overflows. Focus rings must remain visible. Do not add horizontal page scrolling.

- [ ] **Step 7: Expand full-render coverage to 854 states**

The existing 814-state audit gains eight default new-group renders and four additional stages for each of eight training groups: `814 + 8 + 32 = 854`. Assert every stage renders its expected stable group/step identity and no raw `undefined`/`[object Object]` appears.

- [ ] **Step 8: Run GREEN and commit**

```bash
$NODE tests/unit-learning-experience.test.mjs
$NODE tests/full-content-render.test.mjs
$NODE --check prototype/app.js
$NODE --check prototype/i18n/ui-messages.js
git diff --check
git add prototype/app.js prototype/styles.css prototype/i18n/ui-messages.js tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: add guided grammar and sentence practice"
```

---

### Task 6: Enforce resume, import and cloud progress semantics

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/progress-transfer.js`
- Modify: `prototype/cloud-sync.js`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/local-progress-transfer.test.mjs`
- Modify: `tests/cloud-sync.test.mjs`

- [ ] **Step 1: Write failing local resume tests**

Set `grammar-person-verbs.completedIds` to `['rule','compare']`, save, create a fresh VM, hydrate and assert:

- screen stays `reading`;
- selected unit/group stay `grammar-basics`/`grammar-person-verbs`;
- first visible stage is `recognition`;
- transient answers are empty;
- old reading groups with only `{ viewed: true }` still hydrate.

Repeat with four completed steps and assert resume at `completion`; with all five and `completed:true`, assert group summary.

- [ ] **Step 2: Write failing semantic rejection tests**

Local apply, import and cloud apply must all reject before mutation:

- unknown completed step;
- duplicate step;
- out-of-order prefix such as `['rule','recognition']`;
- `completed:true` with fewer than five IDs;
- five IDs with missing/false `completed`;
- training progress for an old non-training reading group using `completedIds`;
- selected training group whose unit ID does not own it.
- daily activity IDs for a training group whose step is not one of `rule`, `compare`, `recognition`, `ordering`, `completion`.

- [ ] **Step 3: Implement shared reading semantic validation**

In `progress-transfer.js`, keep generic shape validation. In `app.js`, add course-aware validation:

```js
function validateReadingProgressIds(bucket) {
  for (const [groupId, entry] of Object.entries(bucket || {})) {
    const group = readingUnits.flatMap((unit) => unit.groups).find((item) => item.id === groupId);
    if (!group) throw new Error(`learningProgress.reading 包含未知 ID: ${groupId}`);
    if (!group.training && entry.completedIds !== undefined) throw new Error(`${groupId} 不支持分步进度`);
    if (!group.training) continue;
    const completedIds = entry.completedIds || [];
    assertOrderedPrefix(completedIds, readingTrainingStepIds, `learningProgress.reading.${groupId}.completedIds`);
    if (Boolean(entry.completed) !== (completedIds.length === readingTrainingStepIds.length)) {
      throw new Error(`${groupId} 的 completed 必须与五步完成状态一致`);
    }
  }
}
```

Call it before local/cloud state mutation and before local save/cloud snapshot creation.

Extend the reading daily-activity allowlist to the five step IDs while preserving legacy `viewed` and `completed`. Validate `reading:<groupId>:<stepId>` against both the group’s stable ID and whether that group actually has guided training.

- [ ] **Step 4: Preserve ordered-prefix cloud merge**

Generic set union can create an invalid order. For training group `completedIds`, merge by choosing the longer valid prefix; if equal length but different values, reject. Validate raw remote before normalization/upsert and validate the merged snapshot before apply/save.

- [ ] **Step 5: Test atomic persistence and sync failures**

If validation or localStorage write fails, old bytes, runtime, `syncDirty` and selected step remain unchanged. If local save succeeds but cloud scheduling throws, local progress remains and `syncDirty=true` for later retry.

- [ ] **Step 6: Run GREEN and commit**

```bash
$NODE tests/local-progress-transfer.test.mjs
$NODE tests/cloud-sync.test.mjs
$NODE tests/unit-learning-experience.test.mjs
$NODE scripts/check-project.mjs
git diff --check
git add prototype/app.js prototype/progress-transfer.js prototype/cloud-sync.js tests/unit-learning-experience.test.mjs tests/local-progress-transfer.test.mjs tests/cloud-sync.test.mjs
git commit -m "fix: preserve guided reading progress"
```

---

### Task 7: Synchronize shared reading audio and lock cache versions

**Files:**
- Create: `scripts/sync-cn-reading-audio.mjs`
- Create: `tests/sync-cn-reading-audio.test.mjs`
- Modify: `prototype/index.html`
- Modify: `scripts/sync-cn-core.mjs`
- Modify: `tests/app-edition-config.test.mjs`
- Modify: `scripts/check-project.mjs`

- [ ] **Step 1: Write the failing domestic-audio sync test**

Build an isolated CN fixture with existing 164 reading files. Assert the new script:

- preflights the source manifest and all 192 source files before any write;
- preflights target path containment, rejects symlinks and requires `W_OK | X_OK` on the nearest existing parent;
- copies exactly the manifest plus 192 listed audio files, one explicit path at a time;
- never deletes extra domestic files;
- produces byte-identical source/target SHA-256 for every listed file;
- a second run is byte-identical;
- injected missing source leaves all target bytes unchanged.

- [ ] **Step 2: Run RED**

```bash
$NODE tests/sync-cn-reading-audio.test.mjs
```

- [ ] **Step 3: Implement safe manifest-driven synchronization**

The script reads only `prototype/assets/audio/human/reading/manifest.json`, resolves each `outputPath`, preflights all jobs, then copies. It must not recursively traverse or delete directories.

- [ ] **Step 4: Update cache tokens**

Use one release token consistently in `prototype/index.html` and `scripts/sync-cn-core.mjs`:

```text
20260810-final-course-freeze
```

Update at least `reading-data.js`, `reading-en.js`, `styles.css`, `progress-transfer.js`, `cloud-sync.js`, `course-data.js`, and `app.js`. The edition test must cover missing, misplaced, duplicate tags and second-run byte identity.

- [ ] **Step 5: Run focused GREEN**

```bash
$NODE tests/sync-cn-reading-audio.test.mjs
ANA_TILIM_CN_SITE='/private/tmp/ana-tilim-final-course-cn-site' $NODE tests/app-edition-config.test.mjs
$NODE scripts/check-project.mjs
```

- [ ] **Step 6: Commit Task 7**

```bash
git add scripts/sync-cn-reading-audio.mjs tests/sync-cn-reading-audio.test.mjs prototype/index.html scripts/sync-cn-core.mjs tests/app-edition-config.test.mjs scripts/check-project.mjs
git commit -m "build: synchronize final reading audio"
```

---

### Task 8: Freeze the course contract

**Files:**
- Create: `docs/course-content-freeze.md`
- Create: `tests/course-content-freeze.test.mjs`
- Modify: `README.md`
- Modify: `scripts/check-project.mjs`

- [ ] **Step 1: Write the failing freeze test**

Lock these post-release invariants:

```js
assert.deepEqual(globalVisibleUnitIds, [
  "letters", "latin-keyboard-writing", "combos", "syllable-training", "basic-phrases",
  "grammar-basics", "sentence-patterns", "dialogue-theater", "short-stories",
  "uyghur-proverbs", "famous-quotes", "afanti-stories"
]);
assert.deepEqual(cnVisibleUnitIds, globalVisibleUnitIds.filter((id) => id !== "famous-quotes"));
assert.equal(grammarUnit.groups.length, 10);
assert.equal(sentenceUnit.groups.length, 12);
assert.equal(readingItems.length, 192);
assert.equal(vocabItems.length, 202);
assert.equal(allStudioTargets.length, 554);
assert.equal(allStudioTargets.filter((item) => item.playable).length, 554);
assert.equal(allStudioTargets.filter((item) => ["pending-review", "needs-rerecord"].includes(item.status)).length, 0);
```

Also assert no production course item has `pending`/`待母语者审校`, no manifest item is missing, and all eight new groups contain the five exact training steps.

- [ ] **Step 2: Run RED**

```bash
$NODE tests/course-content-freeze.test.mjs
```

- [ ] **Step 3: Document the freeze boundary**

`docs/course-content-freeze.md` must state:

- freeze date and release token;
- exact Global/CN unit IDs and counts;
- exact content/audio counts;
- the eight final added groups;
- future allowed changes: bug, typo, translation, audio replacement, accessibility, layout, progress compatibility, security and infrastructure repair;
- future disallowed default changes: new unit, new group, new exercise type, new navigation, broad rewrite;
- an explicit V2 design/spec and owner approval is required to reopen content expansion.

- [ ] **Step 4: Add a concise README status**

State that the curriculum is content-complete for V1 and future maintenance focuses on corrections and reliability. Do not claim that every language sentence was reviewed by a native speaker unless the ledger proves it.

- [ ] **Step 5: Run GREEN and commit**

```bash
$NODE tests/course-content-freeze.test.mjs
$NODE scripts/check-project.mjs
git diff --check
git add docs/course-content-freeze.md tests/course-content-freeze.test.mjs README.md scripts/check-project.mjs
git commit -m "docs: freeze the completed V1 course"
```

---

### Task 9: Full two-edition QA, publication and production deployment

**Files:**
- Sync: `/Users/nigarayaskar/本地项目/03_学习与桌面宠物/Uyghur Tili/site/`
- Rebuild: `/Users/nigarayaskar/本地项目/03_学习与桌面宠物/Uyghur Tili/dist-cn/`
- Verify only: `prototype/`, domestic `site/`, domestic `dist-cn/`, deployed sites

- [ ] **Step 1: Run final local checks on a clean tracked worktree**

```bash
$NODE tests/final-reading-additions.test.mjs
$NODE tests/course-data-integrity.test.mjs
$NODE tests/human-audio.test.mjs
$NODE tests/unit-learning-experience.test.mjs
$NODE tests/local-progress-transfer.test.mjs
$NODE tests/cloud-sync.test.mjs
$NODE tests/full-content-render.test.mjs
$NODE tests/course-content-freeze.test.mjs
$NODE scripts/check-project.mjs
git diff --check
git status --short
```

Expected: full-render reports exactly 854 states; all 554 studio targets are playable; no ignored recording workspace is staged.

- [ ] **Step 2: Synchronize and rebuild the domestic edition**

```bash
ANA_TILIM_CN_SITE='/Users/nigarayaskar/本地项目/03_学习与桌面宠物/Uyghur Tili/site' $NODE scripts/sync-cn-core.mjs
ANA_TILIM_CN_SITE='/Users/nigarayaskar/本地项目/03_学习与桌面宠物/Uyghur Tili/site' $NODE scripts/sync-cn-reading-audio.mjs
cd '/Users/nigarayaskar/本地项目/03_学习与桌面宠物/Uyghur Tili'
$NODE scripts/build-cn.mjs
$NODE tests/cn-static.test.mjs
```

Verify domestic `site/app-config.js`, brand/logo/PWA config, no-login boundary and hidden `famous-quotes` are unchanged. Verify `dist-cn` has 192 readable reading WebM files and all references are relative/local.

- [ ] **Step 3: Run local Browser QA for both editions**

Serve `prototype/` and domestic `dist-cn/` over separate localhost ports. At 1440×900 and 390×844 verify:

- grammar list has 10 vertical groups; sentence list has 12;
- each of eight new groups follows rule → compare → recognition → ordering → completion;
- wrong answers show clear feedback and allow retry;
- each added sentence plays its exact human audio;
- exit after two/three/four steps, reload, and resume at the first incomplete step;
- after all five steps, progress summary increases once and next-group action is correct;
- Global language switching shows complete English content;
- CN has no English switch, cloud/auth scripts or famous quotes;
- page-level horizontal overflow is zero and console has no error/warn caused by the release.

- [ ] **Step 4: Publish the verified branch**

Review `git log`, `git diff origin/main..HEAD --stat`, staged secrets and ignored paths. Push the reviewed branch to `origin`, open/update the existing PR, wait for checks, then merge without rewriting history. Do not publish `recording-workspace/`, local backups, `.env`, Vercel metadata or Supabase secrets.

- [ ] **Step 5: Deploy Global to the existing Vercel project**

From `prototype/`, use the already authenticated Vercel CLI:

```bash
vercel deploy --prod --yes
```

Confirm status `READY` and production alias remains:

```text
https://ana-tilim.vercel.app/
```

Do not create a second project or enable paid features.

- [ ] **Step 6: Deploy domestic dist-cn to the existing CloudBase environment**

From the domestic project:

```bash
tcb hosting deploy ./dist-cn -e uyghur-tili-d4gv9odyhe312c9c5 --concurrency 10 --retry-count 5
```

Keep `dist-cn/index.html` at hosting root. Do not create a second environment or enable a paid plan.

- [ ] **Step 7: Verify both live sites with cache-busting URLs**

Load both production URLs with `?v=20260810-final-course-freeze`. Repeat the eight-group flow at desktop/mobile, play at least one new audio from every group, refresh mid-progress, verify Global optional auth/guest behavior, verify CN local-only behavior, and confirm the new cache token is served.

Confirm the final studio/catalog audit has 554/554 targets marked `approved-current` or `imported`, including corrected `alphabet:zhe`, `vocab:korushkunche` and `vocab:erzimaydu`. Verify neither `hayr` nor `marhaba` survives in course data, manifests, referenced assets or deployed files.

- [ ] **Step 8: Final release report**

Report:

- merged commit and PR;
- Vercel deployment ID/status/URL;
- CloudBase deployment result/URL;
- Global 12 and CN 11 unit lists;
- grammar 10, sentence 12, vocab 202, reading 192, audio 554;
- 854 render states and full-suite result;
- desktop/mobile overflow and console results;
- resume/import/cloud results;
- the content-freeze boundary and the fact that the recording studio remains local-only.

## Completion Gate

The V1 course is complete and frozen only when:

- all 28 content rows are approved and match production literals;
- the `erzimaydu` vocabulary correction is approved and atomically replaces `marhaba` only after its new audio is validated;
- all 29 new human recordings are connected and match visible text;
- all retained current recordings were explicitly audited, and every pronunciation issue discovered during that audit was re-recorded before release;
- all eight new groups complete and resume through five ordered steps;
- local/export/import/cloud progress remains backward compatible;
- Global/CN unit counts and edition boundaries are intact;
- domestic source, build and audio hashes match the approved shared source;
- both live deployments pass desktop/mobile QA;
- `tests/course-content-freeze.test.mjs` passes on the released commit;
- recording drafts/backups never appear in Git or deployed artifacts.
