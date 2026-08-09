# Unit 2 and Unit 4 Learning Maps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Unit 2 and Unit 4 intermediary pages with usable learning maps, add a two-mode Uyghur keyboard course, preserve existing progress, synchronize the domestic edition, and deploy both verified editions.

**Architecture:** Keep the existing shared static-app architecture and specialize `renderUnitDetail()` for the two stable unit IDs. Add fixed reviewed Uyghur keyboard lessons to the existing Latin-writing data module, extend the existing `latinWriting` progress scope with one stable stage, and reuse the existing screen keyboard and physical-key mapping. Unit 2 exposes four independent cards; Unit 4 exposes four prerequisite-gated cards while retaining its existing strict stage invariants.

**Tech Stack:** Static HTML/CSS/JavaScript, Supabase-compatible local/cloud progress JSON, Node.js VM tests, existing Browser plugin, Vercel for Ana Tilim, CloudBase static hosting for Uyghur Tili.

## Global Constraints

- Preserve both editions' unit order, branding, storage keys, authentication boundary, and hidden-unit policy.
- Do not add unreviewed Uyghur text or synthetic audio.
- Reuse only existing human audio whose stable content ID and visible text match.
- Unit 2 has four independent cards; Unit 4 has four ordered prerequisite-gated cards.
- Remove the generic `进入当前学习` intermediary control only from Unit 2 and Unit 4.
- Preserve all existing completion, mistake, writing, favorite, backup, import, and cloud records.
- Do not restore the removed writing self-evaluation card or add handwriting scoring.
- Domestic code is synchronized only through the existing allowlisted sync tool; preserve `site/app-config.js`, logo, manifest, offline boundary, and domestic-only configuration.
- Do not expose the feedback owner email, administrator UID, Resend key, webhook secret, database credentials, or other private backend values in frontend files or Git.
- Use a failing behavioral test before every production change.
- Never bulk-delete files or directories.

---

## File Structure

- Modify `prototype/course-data/latin-writing-data.js`: publish the fixed seven-item Uyghur keyboard lesson list and updated Unit 2 subtitle.
- Modify `prototype/app.js`: extend progress validation, render both learning maps, render the Uyghur keyboard screen, handle mode/input/navigation actions, and normalize return behavior.
- Modify `prototype/styles.css`: style single-column learning maps and the two-mode Uyghur keyboard without page overflow.
- Modify `prototype/progress-transfer.js`: validate the new nested keyboard progress shape during backup import/export.
- Modify `prototype/cloud-sync.js`: preserve and merge the new progress stage without accepting unknown fields or IDs.
- Modify `prototype/index.html`: update cache tokens after behavior changes.
- Modify `scripts/sync-cn-core.mjs`: normalize the same approved cache tokens in the domestic copy.
- Modify `tests/latin-writing-data.test.mjs`: lock the seven reviewed target strings and stable IDs.
- Modify `tests/unit-learning-experience.test.mjs`: exercise real Unit 2/4 entry, keyboard modes, progress, back routes, and scroll restoration.
- Modify `tests/local-progress-transfer.test.mjs`: cover legacy compatibility and malformed keyboard progress rejection.
- Modify `tests/cloud-sync.test.mjs`: cover ordered progress merge and invalid remote snapshot rejection.
- Modify `tests/full-content-render.test.mjs`: enumerate both maps, both keyboard modes, and all reviewed keyboard targets.
- Modify `tests/app-edition-config.test.mjs`: lock cache normalization and domestic parity behavior.
- Synchronize `../Uyghur Tili/site/*` through `scripts/sync-cn-core.mjs`; do not hand-copy or overwrite edition-specific files.
- Rebuild `../Uyghur Tili/dist-cn/*` with its existing `scripts/build-cn.mjs`.

---

### Task 1: Publish and validate the Uyghur keyboard course data

**Files:**
- Modify: `prototype/course-data/latin-writing-data.js`
- Modify: `tests/latin-writing-data.test.mjs`

**Interfaces:**
- Consumes: existing `keyboardLessons`, reviewed Unit 4 two-letter forms `با` and `بە`, and the current Unit 2 `unit` object.
- Produces: `ANA_TILIM_LATIN_WRITING.uyghurKeyboardLessons`, an immutable ordered array with `{ id, value, meaning, focus }` items.

- [ ] **Step 1: Write the failing data-contract test**

Add an exact assertion:

```js
assert.deepEqual(
  courseData.latinWriting.uyghurKeyboardLessons.map(({ id, value }) => [id, value]),
  [
    ["uyghur-keyboard-ba", "با"],
    ["uyghur-keyboard-be", "بە"],
    ["uyghur-keyboard-ana", "ئانا"],
    ["uyghur-keyboard-kitab", "كىتاب"],
    ["uyghur-keyboard-mewe", "مېۋە"],
    ["uyghur-keyboard-ana-til", "ئانا تىل"],
    ["uyghur-keyboard-mother-language", "مەن ئانا تىلىمنى ياخشى كۆرىمەن"]
  ]
);
assert.equal(new Set(courseData.latinWriting.uyghurKeyboardLessons.map((item) => item.id)).size, 7);
```

- [ ] **Step 2: Run the focused test and confirm the expected RED**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/latin-writing-data.test.mjs
```

Expected: FAIL because `uyghurKeyboardLessons` does not exist.

- [ ] **Step 3: Add the minimal immutable lesson list**

Publish exactly the seven reviewed rows above, with concise meanings/focus labels derived from existing visible course text. Update only the Unit 2 subtitle to `拉丁与维吾尔键盘、元辅音分类与 ULY 默写`.

- [ ] **Step 4: Run the focused test and syntax check**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/latin-writing-data.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check prototype/course-data/latin-writing-data.js
```

Expected: both PASS.

- [ ] **Step 5: Commit the data contract**

```bash
git add prototype/course-data/latin-writing-data.js tests/latin-writing-data.test.mjs
git commit -m "feat: add reviewed Uyghur keyboard lessons"
```

---

### Task 2: Extend the stable progress contract

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/progress-transfer.js`
- Modify: `prototype/cloud-sync.js`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/local-progress-transfer.test.mjs`
- Modify: `tests/cloud-sync.test.mjs`

**Interfaces:**
- Consumes: `latinWriting.uyghurKeyboardLessons` from Task 1.
- Produces: stable stage `latinWriting["uyghur-keyboard"]` with exact fields `{ completedIds: string[], completed?: true }`; expanded QWERTY legacy normalization without discarding existing `{ completed: true }` records.

- [ ] **Step 1: Write failing local and cloud semantic tests**

Cover all of these behaviors with real parser/apply paths:

```js
const validPrefix = {
  latinWriting: {
    "uyghur-keyboard": { completedIds: ["uyghur-keyboard-ba", "uyghur-keyboard-be"] }
  }
};
```

Assert that valid ordered prefixes round-trip, while unknown IDs, duplicate IDs, skipped order, unknown fields, and `completed: true` before seven IDs throw before state/storage/upsert mutation. Assert that a legacy payload with no `uyghur-keyboard` loads as `{}` and a legacy `qwerty: { completed: true }` remains complete.

- [ ] **Step 2: Run the three focused suites and confirm RED**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/local-progress-transfer.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/cloud-sync.test.mjs
```

Expected: fail on unknown `uyghur-keyboard` stage or nested field validation.

- [ ] **Step 3: Implement ordered-prefix validation before mutation**

Extend `latinWritingStepIds` with `uyghur-keyboard`. Permit `completedIds` only for `qwerty` and `uyghur-keyboard`; keep the other stage entries limited to `{ completed: true }`. Validate each completed ID against the corresponding fixed lesson order and enforce:

```js
const fullyComplete = completedIds.length === expectedIds.length;
if (Boolean(entry.completed) !== fullyComplete) throw new TypeError("keyboard completion must match the full ordered prefix");
```

Normalize legacy `qwerty.completed === true` as complete without rewriting old stored bytes until the next ordinary save.

- [ ] **Step 4: Merge cloud prefixes deterministically**

For keyboard stages choose the longer valid ordered prefix; when lengths match, preserve `completed: true` only when the prefix is complete. Validate raw remote data before normalize, merge, local apply, local save, or upsert.

- [ ] **Step 5: Run focused suites and confirm GREEN**

Run the three commands from Step 2. Expected: all PASS.

- [ ] **Step 6: Commit the progress contract**

```bash
git add prototype/app.js prototype/progress-transfer.js prototype/cloud-sync.js tests/unit-learning-experience.test.mjs tests/local-progress-transfer.test.mjs tests/cloud-sync.test.mjs
git commit -m "feat: persist keyboard lesson progress"
```

---

### Task 3: Add the two-mode Uyghur keyboard screen

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

**Interfaces:**
- Consumes: `uyghurKeyboardLessons`, the existing `ANA_TILIM_UYGHUR_KEYBOARD`, `renderUyghurKeyboard()`, and Task 2 progress helpers.
- Produces: persisted screen ID `uyghurKeyboardWords`; actions `set-uyghur-keyboard-mode`, `uyghur-keyboard-key`, `uyghur-keyboard-backspace`, `uyghur-keyboard-space`, and `next-uyghur-keyboard-lesson`.

- [ ] **Step 1: Write the real interaction RED test**

From the actual Unit 2 route, open `uyghurKeyboardWords` and assert:

- seven fixed lessons exist in order;
- mode buttons are `onscreen` and `physical`;
- typing `با` through delegated screen-key clicks completes only lesson one;
- switching mode preserves the current value and does not rerender unrelated state;
- physical keydown uses the existing Uyghur mapping and does not change the Latin input buffer;
- next advances to the first incomplete lesson;
- final completion writes only the approved ordered IDs plus `completed: true`;
- the back button returns to Unit 2 map.

- [ ] **Step 2: Run the focused test and confirm RED**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: FAIL because `uyghurKeyboardWords` is not a registered screen.

- [ ] **Step 3: Implement minimal screen state and renderer**

Add transient state:

```js
uyghurKeyboardMode: "onscreen",
uyghurKeyboardValue: ""
```

Derive the lesson index from the first incomplete stable ID rather than persisting a mutable numeric index. Render the target Uyghur string, meaning, progress, mode controls, readonly RTL input, screen keyboard or physical-key guide, error feedback, and explicit next/back actions.

- [ ] **Step 4: Implement isolated input handling**

Screen clicks append only approved Uyghur characters. Physical keydown runs only when `state.screen === "uyghurKeyboardWords" && state.uyghurKeyboardMode === "physical"`; reuse the current keyboard mapping and keep all Latin/QWERTY branches unchanged.

- [ ] **Step 5: Add responsive CSS and full-render states**

Enumerate seven lessons × two modes × incomplete/complete representative states. Ensure 390px width has no page overflow and controls remain readable.

- [ ] **Step 6: Run focused and render suites**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/full-content-render.test.mjs
```

Expected: both PASS.

- [ ] **Step 7: Commit the keyboard screen**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: add two-mode Uyghur keyboard practice"
```

---

### Task 4: Replace Unit 2 and Unit 4 intermediary pages with learning maps

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

**Interfaces:**
- Consumes: existing `unit` screen, Unit 2 stage IDs, `reachableSyllableScreen()`, Unit 4 progress helpers, and Task 3 screen route.
- Produces: `renderLatinWritingUnitMap(unit)` and `renderSyllableTrainingUnitMap(unit)` specialized renderers.

- [ ] **Step 1: Write the Unit 2 map RED test**

Assert the real catalog click opens `screen === "unit"` with exactly four vertically ordered cards and no `进入当前学习` text. Assert exact targets:

```js
["latinKeyboardIntro", "uyghurKeyboardWords", "latinLetterClasses", "latinDictation"]
```

Assert card progress aggregates `classification + vowel-contrast` and `dictation + forms`, while all four cards remain independently enterable.

- [ ] **Step 2: Write the Unit 4 map RED test**

Assert the real catalog click opens exactly four cards for warmup/rules/connections/sentences, no intermediary control, and strict prerequisites. Completed prior stages remain reviewable; later stages show their unlock condition and cannot mutate state through click, direct route, hydration, import, or cloud apply.

- [ ] **Step 3: Run the focused test and confirm both RED failures**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: FAIL because `renderUnitDetail()` still emits `进入当前学习`.

- [ ] **Step 4: Implement the two specialized map renderers**

Branch before the generic unit detail body:

```js
if (unit.id === "latin-keyboard-writing") return renderLatinWritingUnitMap(unit);
if (unit.id === "syllable-training") return renderSyllableTrainingUnitMap(unit);
```

Use a shared card renderer for title, description, count, completion fraction, recommended/locked state, and target. Keep generic units unchanged.

- [ ] **Step 5: Normalize all child back routes**

For Unit 2 child screens and Unit 4 lesson screens, the top-left back action must set the correct `selectedUnitId` and return to `unit`. Keep explicit forward progression buttons inside completed lessons.

- [ ] **Step 6: Preserve scroll position by unit identity**

Keep `scrollViewKey()` keyed as `unit:<selectedUnitId>`. Add a regression that scrolls the Unit 2 or Unit 4 map, opens a child, returns, and restores the original scroll position; entering another unit must start from its own saved position.

- [ ] **Step 7: Run focused and full-render suites**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/full-content-render.test.mjs
```

Expected: both PASS and generic unit regressions remain unchanged.

- [ ] **Step 8: Commit the maps and navigation**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: add direct unit learning maps"
```

---

### Task 5: Cache normalization, domestic sync, and complete verification

**Files:**
- Modify: `prototype/index.html`
- Modify: `scripts/sync-cn-core.mjs`
- Modify: `tests/app-edition-config.test.mjs`
- Synchronize: `/Users/nigarayaskar/本地项目/03_学习与桌面宠物/Uyghur Tili/site/*`
- Rebuild: `/Users/nigarayaskar/本地项目/03_学习与桌面宠物/Uyghur Tili/dist-cn/*`

**Interfaces:**
- Consumes: final shared core from Tasks 1–4.
- Produces: byte-stable domestic script normalization and verified edition parity.

- [ ] **Step 1: Write the cache-token RED test**

Expect normalized tags to use a single approved token such as:

```html
<script src="./course-data/latin-writing-data.js?v=20260810-unit-learning-maps"></script>
<script src="./app.js?v=20260810-unit-learning-maps"></script>
```

Also assert repeated sync leaves the domestic `index.html` byte-identical and preserves edition-specific files.

- [ ] **Step 2: Run edition test and confirm RED**

Run against the approved ignored scratch site first:

```bash
ANA_TILIM_CN_SITE="/Users/nigarayaskar/本地项目/03_学习与桌面宠物/Ana Tilim/.worktrees/course-expansion-sdd/.superpowers/sdd/2026-08-09-edition-order-progress-plan/cn-site" /Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/app-edition-config.test.mjs
```

Expected: FAIL on the old cache token.

- [ ] **Step 3: Update canonical cache tokens and run scratch sync twice**

Update only the Latin-writing/app/style tokens required by changed files. Run `scripts/sync-cn-core.mjs` twice against the scratch path and compare the second-run index hash to the first.

- [ ] **Step 4: Run the complete project check**

```bash
ANA_TILIM_CN_SITE="/Users/nigarayaskar/本地项目/03_学习与桌面宠物/Ana Tilim/.worktrees/course-expansion-sdd/.superpowers/sdd/2026-08-09-edition-order-progress-plan/cn-site" /Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs
git diff --check
```

Expected: edition parity, all focused suites, full render states, schema/feedback suites, syntax, and whitespace checks PASS.

- [ ] **Step 5: Synchronize the real domestic site**

Run the same allowlisted tool with:

```bash
ANA_TILIM_CN_SITE="/Users/nigarayaskar/本地项目/03_学习与桌面宠物/Uyghur Tili/site" /Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/sync-cn-core.mjs
```

Verify `site/app-config.js`, `site/manifest.webmanifest`, and `site/assets/logo.png` are unchanged. Then rebuild from the Uyghur Tili project with its existing build script and run its static test suite.

- [ ] **Step 6: Commit the cache/sync contract**

```bash
git add prototype/index.html scripts/sync-cn-core.mjs tests/app-edition-config.test.mjs
git commit -m "chore: refresh unit map cache tokens"
```

Do not force-add the separate Uyghur Tili project into the Ana Tilim repository.

---

### Task 6: Browser QA, backend notification closure, and production deployment

**Files:**
- Verify only: `prototype/*`, domestic `site/*`, domestic `dist-cn/*`, Supabase feedback tables/function/webhook, and production URLs.

**Interfaces:**
- Consumes: all verified commits from Tasks 1–5 and the already-created `user_feedback` / `feedback_admins` RLS schema.
- Produces: deployed Ana Tilim and Uyghur Tili builds plus verified private feedback delivery.

- [ ] **Step 1: Run local Browser QA for both editions**

Use the Browser plugin on local HTTP servers, not `file://`. Check 1440×900 and 390×844 for:

- Unit 2 four-card map and all return paths;
- Latin QWERTY and both Uyghur keyboard modes;
- Unit 4 four-card lock/unlock/review behavior;
- scroll restoration;
- no blank page, overlay, relevant console errors, overlap, clipping, or page-level horizontal overflow.

- [ ] **Step 2: Finish private feedback notification configuration**

Use the owner-authorized Supabase project. Create or use a Resend account owned by `nigaray703@gmail.com`, store `RESEND_API_KEY`, `FEEDBACK_OWNER_EMAIL`, and a generated `FEEDBACK_WEBHOOK_SECRET` only as Supabase Edge Function secrets, deploy `feedback-notify` without browser JWT verification, and configure a private insert webhook with the same secret header. Never print or commit secret values.

- [ ] **Step 3: Verify feedback without exposing private records**

Submit one clearly labeled test feedback from the public form, verify a new row exists, verify the owner Gmail receives one notification, verify a non-admin session cannot select rows, and verify the owner session can view/update status. Mark or remove only the single labeled test row through an explicit row action; do not bulk-delete feedback.

- [ ] **Step 4: Push the verified Ana Tilim branch and deploy the existing Vercel project**

Push the current branch/approved integration path to `origin` without rewriting history. Deploy only `prototype/` to the existing Ana Tilim production project and preserve:

```text
https://ana-tilim.vercel.app/
```

- [ ] **Step 5: Deploy the rebuilt domestic package**

Upload the contents of `Uyghur Tili/dist-cn/` to the existing free CloudBase static environment `uyghur-tili-d4gv9odyhe312c9c5`, keeping `index.html` at the hosting root. Do not enable a paid plan or create a second environment.

- [ ] **Step 6: Run production Browser QA**

Hard-refresh each live site and repeat the desktop/mobile target flows, edition title/config checks, feedback form availability, console check, and horizontal-overflow check. Record verified URLs and any remaining limitation.

- [ ] **Step 7: Final repository check**

```bash
git status --short
git log --oneline -8
```

Expected: tracked worktree clean, no credentials in diff/history, all intended commits present, and no unrelated user files modified.
