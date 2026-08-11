# Units Six and Seven Five-Step Training Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all 22 topics in Units 6 and 7 use one resumable “规则 → 对比 → 辨认 → 排序 → 补全” flow without adding sentences or recordings.

**Architecture:** Keep the existing reading renderer and progress bucket, and add an explicit fixed `training` contract to each of the 14 legacy topics. Normalize only the exact legacy `{ completed: true }` shape into all five completed steps before semantic validation, while rejecting partial or out-of-order data. Reuse the current audio mapping and five-step UI for both editions.

**Tech Stack:** Plain JavaScript, DOM rendering, Node.js assertion/VM tests, existing edition sync and project-check scripts.

## Global Constraints

- Unit 6 remains exactly 10 topics and Unit 7 exactly 12 topics.
- Every topic uses exactly `rule / compare / recognition / ordering / completion`.
- Reuse only existing topic items, ULY, meanings, stable IDs and human-audio paths.
- Do not add a new practice navigation item or reset completed users.
- Wrong answers stay on the current step; correct answers unlock the next step.
- Global and CN editions share the implementation while retaining existing edition differences.

---

### Task 1: Lock all 22 training contracts

**Files:**
- Create: `tests/units-six-seven-training.test.mjs`
- Modify: `prototype/course-data/reading-data.js`
- Modify: `scripts/check-project.mjs`

**Interfaces:**
- Consumes: `window.ANA_TILIM_READING.readingUnits`
- Produces: each Unit 6/7 group has `training.steps`, `compareItemIds`, `recognition`, `ordering`, and `completion`

- [ ] **Step 1: Write the failing data test**

```js
assert.equal(grammarUnit.groups.length, 10);
assert.equal(sentenceUnit.groups.length, 12);
for (const group of [...grammarUnit.groups, ...sentenceUnit.groups]) {
  assert.deepEqual(group.training.steps, ["rule", "compare", "recognition", "ordering", "completion"]);
  assert.ok(group.training.compareItemIds.every((id) => group.items.some((item) => item.id === id)));
  const tokenById = new Map(group.training.ordering.tokens.map((token) => [token.id, token.value]));
  assert.equal(group.training.ordering.answerIds.map((id) => tokenById.get(id)).join(""), group.training.ordering.completedValue);
  assert.ok(group.items.some((item) => item.value === group.training.completion.completedValue));
}
```

- [ ] **Step 2: Run the data test and verify RED**

Run: `node tests/units-six-seven-training.test.mjs`

Expected: fail because `grammar-word-order` and the other 13 legacy groups have no `training` object.

- [ ] **Step 3: Add fixed per-topic training data**

```js
const legacyReadingTrainingByGroupId = Object.freeze({
  "grammar-word-order": {
    steps: ["rule", "compare", "recognition", "ordering", "completion"],
    compareItemIds: ["grammar-word-order-1", "grammar-word-order-3"],
    recognition: {
      promptZh: "哪一句表示“我喝茶”？",
      promptEn: "Which sentence means ‘I drink tea’ ?",
      options: [{ id: "a", itemId: "grammar-word-order-2" }, { id: "b", itemId: "grammar-word-order-3" }],
      answerId: "a"
    },
    ordering: {
      tokens: [{ id: "b", value: "كىتاب ئوقۇيمەن." }, { id: "a", value: "مەن " }],
      answerIds: ["a", "b"],
      completedValue: "مەن كىتاب ئوقۇيمەن."
    },
    completion: {
      promptZh: "补全“我读书”",
      promptEn: "Complete ‘I read a book’",
      options: [{ id: "a", value: "ئوقۇيمەن" }, { id: "b", value: "ئىچىمەن" }],
      answerId: "a",
      completedValue: "مەن كىتاب ئوقۇيمەن.",
      meaningZh: "我读书。",
      meaningEn: "I read a book."
    }
  }
});
```

Use this complete fixed mapping for the remaining literal contracts; `order` gives the target item and its exact two token strings, while `complete` gives the target item plus correct and wrong choices:

| group | compare | recognition prompt and answer item | order target and tokens | complete target / correct / wrong |
| --- | --- | --- | --- | --- |
| grammar-word-order | 1, 3 | 我喝茶 / item 2 | item 1 / `مەن ` + `كىتاب ئوقۇيمەن.` | item 1 / `ئوقۇيمەن` / `ئىچىمەن` |
| grammar-copula | 1, 3 | 我是学生 / item 2 | item 2 / `مەن ` + `ئوقۇغۇچى.` | item 2 / `ئوقۇغۇچى` / `دوختۇر` |
| grammar-negative-emes | 1, 2 | 他/她不是医生 / item 2 | item 1 / `بۇ كىتاب ` + `ئەمەس.` | item 1 / `ئەمەس` / `بار` |
| grammar-yes-no-mu | 1, 3 | 您有书吗 / item 3 | item 1 / `بۇ ` + `كىتابمۇ؟` | item 1 / `كىتابمۇ` / `كىتاب` |
| grammar-question-words | 1, 3 | 学校在哪里 / item 3 | item 2 / `بۇ ` + `نېمە؟` | item 1 / `كىم` / `نېمە` |
| grammar-bar-yoq | 1, 2 | 我没有笔 / item 2 | item 1 / `مەندە ` + `قەلەم بار.` | item 2 / `يوق` / `بار` |
| sentence-this-that | 1, 3 | 那是学校 / item 3 | item 1 / `بۇ ` + `قەلەم.` | item 2 / `كىتاب` / `مەكتەپ` |
| sentence-who-what | 1, 3 | 这是什么 / item 2 | item 3 / `مەكتەپ ` + `قەيەردە؟` | item 1 / `كىم` / `نېمە` |
| sentence-i-you | 1, 3 | 这是我的朋友 / item 4 | item 1 / `مەن ` + `ئوقۇغۇچى.` | item 2 / `مۇئەللىم` / `دوختۇر` |
| sentence-have | 1, 2 | 我们有馕 / item 4 | item 1 / `مەندە ` + `قەلەم بار.` | item 2 / `يوق` / `بار` |
| sentence-like-need | 1, 4 | 我要馕 / item 2 | item 3 / `مەن ` + `چاي ئىچىمەن.` | item 1 / `سۇ لازىم` / `نان لازىم` |
| sentence-time | 1, 2 | 现在八点 / item 4 | item 2 / `بۈگۈن ` + `دۈشەنبە.` | item 4 / `سەككىز` / `دۈشەنبە` |
| sentence-no | 1, 4 | 我不喝茶 / item 3 | item 1 / `بۇ كىتاب ` + `ئەمەس.` | item 2 / `يوق` / `ئەمەس` |
| sentence-question | 1, 3 | 他/她来吗 / item 4 | item 1 / `بۇ ` + `كىتابمۇ؟` | item 2 / `ياخشىمۇ` / `كىتابمۇ` |

For every row, set `meaningZh` and `meaningEn` to the target item’s existing Chinese and `prototype/i18n/reading-en.js` meanings. Attach the fixed object with `training: legacyReadingTrainingByGroupId[groupId]`; never derive questions from sentence text at render time.

- [ ] **Step 4: Run data, integrity and audio tests**

Run: `node tests/units-six-seven-training.test.mjs && node tests/course-data-integrity.test.mjs && node tests/human-audio.test.mjs`

Expected: all pass, with unchanged topic IDs and audio paths.

- [ ] **Step 5: Commit Task 1**

```bash
git add prototype/course-data/reading-data.js tests/units-six-seven-training.test.mjs scripts/check-project.mjs
git commit -m "feat: add five-step reading contracts"
```

### Task 2: Resume, compatibility, interaction behavior and redundant combo copy

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/i18n/ui-messages.js`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/local-progress-transfer.test.mjs`
- Modify: `tests/cloud-sync.test.mjs`

**Interfaces:**
- Consumes: fixed `group.training.steps`
- Produces: `normalizeLegacyReadingTrainingProgress(saved)` returning a cloned compatible snapshot; unchanged five-step delegated actions

- [ ] **Step 1: Write failing behavior and compatibility tests**

```js
clickDataset({ action: "open-reading-group", unitId: "grammar-basics", id: "grammar-word-order" });
assert.ok(app.innerHTML.includes('data-reading-training-step="rule"'));
clickDataset({ action: "continue-reading-training" });
assert.equal(state.learningProgress.reading["grammar-word-order"].rule, true);

const legacy = { learningProgress: { reading: { "grammar-word-order": { viewed: true, completed: true } } } };
applyLocalProgressData(legacy);
assert.deepEqual(state.learningProgress.reading["grammar-word-order"], {
  viewed: true, rule: true, compare: true, recognition: true, ordering: true, completion: true, completed: true
});
```

Also assert local import and cloud apply reject skipped steps before mutating state, and assert a partial topic resumes at the first incomplete step.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `node --test tests/unit-learning-experience.test.mjs tests/local-progress-transfer.test.mjs tests/cloud-sync.test.mjs`

Expected: legacy topics render the old reading list and exact legacy completion fails semantic validation.

- [ ] **Step 3: Implement exact legacy normalization**

```js
function normalizeLegacyReadingTrainingProgress(saved) {
  const normalized = structuredClone(saved);
  for (const [groupId, progress] of Object.entries(normalized.learningProgress?.reading || {})) {
    const group = readingGroupsById.get(groupId);
    const steps = group?.training?.steps || [];
    const presentSteps = steps.filter((stepId) => Object.hasOwn(progress, stepId));
    if (steps.length && progress.completed === true && presentSteps.length === 0) {
      steps.forEach((stepId) => { progress[stepId] = true; });
    }
  }
  return normalized;
}
```

Use this clone before local hydration, staged import and cloud apply validation. Preserve strict ordered-step validation for every other shape.

- [ ] **Step 4: Remove the redundant combo learning-points card**

```js
assert.doesNotMatch(renderedCombo, /学习小点|怎么读|怎么来看/);
assert.match(renderedCombo, /实际连写形|拆开看|播放/);
```

Remove only the combo page’s duplicated “学习小点” card and its unused message keys. Keep the existing human-audio button, ULY, actual joined forms, connection explanation and meaning preview. Do not remove rule, feedback or operating instructions from other lesson types.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `node --test tests/unit-learning-experience.test.mjs tests/local-progress-transfer.test.mjs tests/cloud-sync.test.mjs`

Expected: old and new topics share the same five-step UI; exact legacy completed data migrates; invalid order remains fail-closed.

- [ ] **Step 6: Commit Task 2**

```bash
git add prototype/app.js prototype/i18n/ui-messages.js tests/unit-learning-experience.test.mjs tests/local-progress-transfer.test.mjs tests/cloud-sync.test.mjs
git commit -m "feat: unify reading lesson progression"
```

### Task 3: Render matrix, edition sync and release verification

**Files:**
- Modify: `tests/full-content-render.test.mjs`
- Modify: `prototype/index.html`
- Modify: `scripts/sync-cn-core.mjs`
- Modify: `tests/app-edition-config.test.mjs`

**Interfaces:**
- Consumes: 22 groups × 5 fixed training states
- Produces: deterministic Global/CN cache tokens and full render coverage

- [ ] **Step 1: Make the render and cache tests fail**

Require every Unit 6/7 group to render all five states and update the expected reading-data/app cache token to `20260812-five-step-reading`.

- [ ] **Step 2: Run render and edition tests for RED**

Run: `node tests/full-content-render.test.mjs && ANA_TILIM_CN_SITE=.superpowers/sdd/2026-08-09-edition-order-progress-plan/cn-site node tests/app-edition-config.test.mjs`

Expected: render count and cache-token assertions fail before production token updates.

- [ ] **Step 3: Update cache tokens and sync normalization**

```html
<script src="./course-data/reading-data.js?v=20260812-five-step-reading"></script>
<script src="./app.js?v=20260812-five-step-reading"></script>
```

Update only the corresponding literal token rules in `scripts/sync-cn-core.mjs`.

- [ ] **Step 4: Run full project and browser verification**

Run: `ANA_TILIM_CN_SITE=.superpowers/sdd/2026-08-09-edition-order-progress-plan/cn-site node scripts/check-project.mjs`

Browser checks: old grammar topic, old sentence topic, wrong/correct answers, refresh resume, next-topic CTA, desktop and 390px widths, audio playback, zero page overflow.

- [ ] **Step 5: Sync and deploy both editions**

Run the existing safe CN core sync against the real CN site only after the scratch parity check. Deploy the Global Vercel site and CN CloudBase site with the repository’s existing commands, then repeat production smoke checks on both URLs.

- [ ] **Step 6: Commit release integration**

```bash
git add tests/full-content-render.test.mjs prototype/index.html scripts/sync-cn-core.mjs tests/app-edition-config.test.mjs
git commit -m "test: verify five-step reading release"
```
