# Learner Settings and Interface Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove learner-facing recording and review-workflow UI while adding persistent, functional settings inside “我的”, removing the expanded 9-unit progress card, and preserving every connected audio file.

**Architecture:** Keep the existing data-driven, single-page prototype structure. Add a validated `preferences` object and daily activity snapshot to the existing local state, render settings inside the profile screen through focused helpers inside `prototype/app.js`, remove the expanded 9-unit progress card while retaining summary progress in the account card, and apply font size through an app-root data attribute plus safe targeted enlargement rules. Remove recorder runtime/UI code while retaining a renamed read-only audio coverage catalog for integrity tests; keep internal review metadata in course data but stop rendering it on learner screens.

**Tech Stack:** Vanilla JavaScript, HTML, CSS, Node.js `assert`/`vm` tests, localStorage, existing static audio manifests.

## Global Constraints

- Preserve every file under `prototype/assets/audio/` and every existing manifest and content-to-audio mapping.
- Keep the Uyghur font family as Times New Roman with exact `font-weight: 600`; the setting changes size only.
- Bottom navigation must contain exactly `首页`, `字母`, `学习`, `我的`, in that order.
- “我的” contains the full-width account card followed by settings; “学习偏好” is rendered only once.
- The expanded 9-unit learning-progress card is not rendered.
- Learner screens must not render `待审校`, `待母语者审校`, `待来源审校`, `已校对`, `待修改`, or `展示项`.
- Internal course-data review metadata may remain; normal learner UI must not expose an entry to internal audit tools.
- Defaults are `fontSize: "standard"`, `audioAutoplay: false`, `dailyGoal: 10`, and `learningReminder: false`.
- Learning reminders are in-app only; do not request browser notification permission.
- Clearing learning records preserves account identity and preferences.
- Do not add server sync, dependencies, speech synthesis, or browser push notifications.
- Preserve unrelated worktree changes. Stage and commit only files named by the current task.
- Do not invent Git author information. If Git identity is still unavailable, leave the task changes staged and report the blocked commit.

---

## File Structure

- Modify `prototype/app.js`: state validation and persistence, daily activity, navigation cleanup, learner-copy cleanup, settings rendering/actions, clear-data flow, autoplay coordination, and recorder runtime removal.
- Modify `prototype/styles.css`: four-item navigation, profile-embedded settings controls, full-width profile account layout, safe large-text mode, reminder and confirmation states, and deletion of recorder-only styles.
- Modify `prototype/index.html`: bump the static asset cache version after all code and style changes.
- Modify `tests/unit-learning-experience.test.mjs`: behavior and source assertions for preferences, settings, navigation, copy cleanup, clearing data, and autoplay.
- Modify `tests/full-content-render.test.mjs`: remove the recording screen from the learner render matrix and assert forbidden review copy never appears on learner screens.
- Modify `tests/human-audio.test.mjs`: validate the retained read-only audio coverage catalog independently of any recorder UI.
- Keep `tests/course-data-integrity.test.mjs` unchanged: internal review metadata remains valid course data.
- Keep all files under `prototype/assets/audio/` unchanged.

---

### Task 1: Add Validated Preferences and Daily Activity State

**Files:**
- Modify: `prototype/app.js:424-611`
- Test: `tests/unit-learning-experience.test.mjs:180-340`

**Interfaces:**
- Produces: `DEFAULT_PREFERENCES: Readonly<{fontSize: "standard", audioAutoplay: false, dailyGoal: 10, learningReminder: false}>`
- Produces: `normalizePreferences(value: unknown): {fontSize: "standard"|"large", audioAutoplay: boolean, dailyGoal: 5|10|15, learningReminder: boolean}`
- Produces: `localDayKey(date?: Date): string`
- Produces: `dailyActivitySnapshot(date?: Date): {date: string, completedIds: string[]}`
- Produces: `recordDailyActivity(activityId: string, date?: Date): void`
- Updates: `saveLocalProgress(): boolean`, returning `true` after a successful localStorage write and `false` when storage is unavailable or rejects the write
- Updates: `state.preferences` and `state.dailyActivity`
- Consumes: existing `localStorageSafe()`, `hydrateLocalProgress()`, `saveLocalProgress()`, and `markProgress(scope, id, step)`

- [ ] **Step 1: Write failing state-validation and persistence tests**

Add these assertions after the VM context is created in `tests/unit-learning-experience.test.mjs`:

```js
const defaultPreferences = JSON.parse(
  vm.runInContext("JSON.stringify(normalizePreferences(null))", context)
);
assert.deepEqual(defaultPreferences, {
  fontSize: "standard",
  audioAutoplay: false,
  dailyGoal: 10,
  learningReminder: false
});

const repairedPreferences = JSON.parse(
  vm.runInContext(
    `JSON.stringify(normalizePreferences({
      fontSize: "huge",
      audioAutoplay: 1,
      dailyGoal: 99,
      learningReminder: "yes"
    }))`,
    context
  )
);
assert.deepEqual(repairedPreferences, defaultPreferences, "invalid preference values should use defaults");

assert.equal(
  vm.runInContext("localDayKey(new Date(2026, 6, 26, 12, 0, 0))", context),
  "2026-07-26",
  "daily activity should use a stable local calendar key"
);

vm.runInContext(
  `
    state.preferences = {
      fontSize: "large",
      audioAutoplay: true,
      dailyGoal: 15,
      learningReminder: true
    };
    state.dailyActivity = { date: "2026-07-26", completedIds: ["letters:dot-bone:viewed"] };
    saveLocalProgress();
  `,
  context
);
assert.deepEqual(savedProgress().preferences, {
  fontSize: "large",
  audioAutoplay: true,
  dailyGoal: 15,
  learningReminder: true
});
assert.deepEqual(savedProgress().dailyActivity, {
  date: "2026-07-26",
  completedIds: ["letters:dot-bone:viewed"]
});
```

Add a uniqueness check for daily activity:

```js
vm.runInContext(
  `
    state.dailyActivity = { date: localDayKey(), completedIds: [] };
    recordDailyActivity("letters:dot-bone:viewed");
    recordDailyActivity("letters:dot-bone:viewed");
  `,
  context
);
assert.equal(
  vm.runInContext("dailyActivitySnapshot().completedIds.length", context),
  1,
  "the same activity should count once per day"
);
```

- [ ] **Step 2: Run the learning-experience test and verify it fails**

Run:

```bash
node tests/unit-learning-experience.test.mjs
```

Expected: FAIL because `normalizePreferences`, `localDayKey`, `dailyActivitySnapshot`, and `recordDailyActivity` do not exist.

- [ ] **Step 3: Implement the state helpers and persistence**

Add near `progressStorageKey` in `prototype/app.js`:

```js
const DEFAULT_PREFERENCES = Object.freeze({
  fontSize: "standard",
  audioAutoplay: false,
  dailyGoal: 10,
  learningReminder: false
});

function normalizePreferences(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    fontSize: source.fontSize === "large" ? "large" : "standard",
    audioAutoplay: typeof source.audioAutoplay === "boolean" ? source.audioAutoplay : false,
    dailyGoal: [5, 10, 15].includes(source.dailyGoal) ? source.dailyGoal : 10,
    learningReminder: typeof source.learningReminder === "boolean" ? source.learningReminder : false
  };
}

function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
```

Add to the initial `state`:

```js
preferences: { ...DEFAULT_PREFERENCES },
dailyActivity: { date: "", completedIds: [] },
clearLearningConfirmation: false,
```

Add:

```js
function dailyActivitySnapshot(date = new Date()) {
  const dateKey = localDayKey(date);
  const saved = state.dailyActivity;
  if (!saved || saved.date !== dateKey || !Array.isArray(saved.completedIds)) {
    state.dailyActivity = { date: dateKey, completedIds: [] };
  }
  return state.dailyActivity;
}

function recordDailyActivity(activityId, date = new Date()) {
  if (!activityId) return;
  const activity = dailyActivitySnapshot(date);
  if (!activity.completedIds.includes(activityId)) {
    activity.completedIds.push(activityId);
  }
}
```

In `hydrateLocalProgress()`, normalize `saved.preferences` and validate `saved.dailyActivity`. In `saveLocalProgress()`, persist both fields.

Change `saveLocalProgress()` to report its result without changing existing callers:

```js
function saveLocalProgress() {
  const storage = localStorageSafe();
  if (!storage) {
    return false;
  }

  const saved = {
    screen: state.screen,
    appMode: state.appMode,
    currentLetterId: state.currentLetterId,
    selectedGroupId: state.selectedGroupId,
    currentComboItemId: state.currentComboItemId,
    selectedComboGroupId: state.selectedComboGroupId,
    currentVocabItemId: state.currentVocabItemId,
    selectedVocabGroupId: state.selectedVocabGroupId,
    currentPracticeItemId: state.currentPracticeItemId,
    selectedPracticeGroupId: state.selectedPracticeGroupId,
    selectedReadingUnitId: state.selectedReadingUnitId,
    selectedReadingGroupId: state.selectedReadingGroupId,
    selectedReviewItemId: state.selectedReviewItemId,
    reviewFilter: state.reviewFilter,
    recordingListMode: state.recordingListMode,
    selectedUnitId: state.selectedUnitId,
    mockSignedIn: state.mockSignedIn,
    mockUserEmail: state.mockUserEmail,
    selectedRecordingCategory: state.selectedRecordingCategory,
    selectedRecordingTargetId: state.selectedRecordingTargetId,
    favorite: state.favorite,
    reviewOverrides: state.reviewOverrides,
    voiceRecordingMarks: state.voiceRecordingMarks,
    learningProgress: state.learningProgress,
    mistakes: state.mistakes,
    writingChecks: state.writingChecks,
    preferences: state.preferences,
    dailyActivity: state.dailyActivity
  };

  try {
    storage.setItem(progressStorageKey, JSON.stringify(saved));
    return true;
  } catch {
    return false;
  }
}
```

Update `markProgress(scope, id, step)` so it records only newly completed actions:

```js
function markProgress(scope, id, step) {
  const progress = ensureProgress(scope, id);
  const wasComplete = progress[step] === true;
  progress[step] = true;
  if (!wasComplete) {
    recordDailyActivity(`${scope}:${id}:${step}`);
  }

  if (scope === "letters") {
    const finishedSteps = letterLoopSteps.every((item) => progress[item.id]);
    if (finishedSteps) {
      progress.completed = true;
    }
  } else if (scope === "practice" && step === "listen") {
    const group = practiceGroups.find((item) => item.id === id);
    if (group && practiceListeningRoundComplete(group)) {
      progress.completed = true;
    }
  } else if (["recognition", "keyboard", "build", "repeat", "write", "review", "completed"].includes(step)) {
    progress.completed = true;
  }
}
```

When `markPracticeListeningItemComplete(group, item)` adds a previously unseen item ID, also call:

```js
recordDailyActivity(`practice:${group.id}:listen:${item.id}`);
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
node tests/unit-learning-experience.test.mjs
node tests/course-data-integrity.test.mjs
```

Expected: both PASS.

- [ ] **Step 5: Commit the preference-state foundation**

```bash
git add prototype/app.js tests/unit-learning-experience.test.mjs
git commit -m "feat: persist learner preferences"
```

---

### Task 2: Remove Recorder UI and Runtime While Retaining Audio Coverage

**Files:**
- Modify: `prototype/app.js:800-1030`
- Modify: `prototype/app.js:1878-1955`
- Modify: `prototype/app.js:4480-5005`
- Modify: `prototype/app.js:5040-5615`
- Modify: `prototype/styles.css:2210-2460`
- Modify: `prototype/styles.css:2550-2650`
- Test: `tests/unit-learning-experience.test.mjs:280-650`
- Test: `tests/full-content-render.test.mjs:48-55`
- Test: `tests/human-audio.test.mjs:230-285`

**Interfaces:**
- Produces: `audioCoverageTarget(input): {id: string, categoryId: string, categoryTitle: string, unit: string, groupTitle: string, value: string, latin: string, kind: string, existingAudio: boolean, fileBase: string}`
- Produces: `audioCoverageCategories(): Array<{id: string, title: string, items: Array<{id: string, categoryId: string, categoryTitle: string, unit: string, groupTitle: string, value: string, latin: string, kind: string, existingAudio: boolean, fileBase: string}>}>`
- Produces: `allAudioCoverageTargets(): Array<{id: string, categoryId: string, categoryTitle: string, unit: string, groupTitle: string, value: string, latin: string, kind: string, existingAudio: boolean, fileBase: string}>`
- Preserves: each target’s `id`, `value`, `latin`, `fileBase`, and `existingAudio`
- Removes: all recorder state, MediaRecorder functions, recorder renderers, recorder actions, and recording-only styles
- Consumes: existing alphabet, form-example, combo, vocabulary, reading audio maps

- [ ] **Step 1: Replace recorder-behavior tests with removal and coverage tests**

In `tests/unit-learning-experience.test.mjs`:

1. Replace the old source assertion:

```js
assert.ok(appSource.includes('["recording", "录音"'), "bottom navigation should expose the recording area");
```

with:

```js
assert.ok(!appSource.includes('["recording", "录音"'), "bottom navigation should remove recording");
for (const removedRecorderToken of [
  "renderRecordingScreen",
  "MediaRecorder",
  "getUserMedia",
  "start-voice-recording",
  "import-voice-recording"
]) {
  assert.ok(!appSource.includes(removedRecorderToken), `app runtime should remove ${removedRecorderToken}`);
}
```

2. Delete the recorder screen interaction block that switches recording categories, marks local recordings, and tests re-recording.

3. Change the bottom navigation order check to:

```js
for (const target of ["home", "library", "learn", "profile"]) {
  const position = bottomNavHtml.indexOf(`data-target="${target}"`, lastNavPosition + 1);
  assert.ok(position > lastNavPosition, `bottom navigation should place ${target} in order`);
  lastNavPosition = position;
}
assert.equal(
  (bottomNavHtml.match(/class="nav-button/g) || []).length,
  4,
  "bottom navigation should contain exactly four actions"
);
assert.ok(!bottomNavHtml.includes('data-target="recording"'));
```

4. Add the stale-state test:

```js
renderState("state.screen = 'recording'");
assert.equal(vm.runInContext("state.screen", context), "home", "removed recording state should fall back to home");
assert.ok(app.innerHTML.includes("今日进度"), "stale recording state should render home");
assert.equal(savedProgress().screen, "home", "fallback should repair persisted screen state");
```

In `tests/full-content-render.test.mjs`, change:

```js
for (const screen of ["welcome", "home", "learn", "writing", "review", "library", "recording", "profile"])
```

to:

```js
for (const screen of ["welcome", "home", "learn", "writing", "review", "library", "profile"])
```

and update the expected render total from `466` to `465`.

In `tests/human-audio.test.mjs`, replace calls to `recordingCategoryData()` with:

```js
const coverageCategories = JSON.parse(
  vm.runInContext("JSON.stringify(audioCoverageCategories())", context)
);
const allCoverageTargets = coverageCategories.flatMap((category) => category.items);
```

Keep the exact totals `32 + 126 + 34 + 209 + 164 = 565`, but update assertion messages from “recording center” to “audio coverage catalog”.

- [ ] **Step 2: Run focused tests and verify they fail**

Run:

```bash
node tests/unit-learning-experience.test.mjs
node tests/full-content-render.test.mjs
node tests/human-audio.test.mjs
```

Expected: FAIL because the recording navigation/runtime still exists and `audioCoverageCategories()` is not defined.

- [ ] **Step 3: Rename the read-only audio coverage helpers**

In `prototype/app.js`, rename only the data-only catalog functions:

```js
recordingTargetFromAudio       -> audioCoverageTarget
alphabetRecordingTargets      -> alphabetAudioCoverageTargets
formExampleRecordingTargets   -> formExampleAudioCoverageTargets
comboRecordingTargets         -> comboAudioCoverageTargets
vocabRecordingTargets         -> vocabAudioCoverageTargets
readingRecordingTargets       -> readingAudioCoverageTargets
recordingCategoryData         -> audioCoverageCategories
allRecordingTargets           -> allAudioCoverageTargets
```

Delete the unused `practiceRecordingTargets()` helper because practice audio is not one of the five catalog categories and the recorder UI that used it is being removed.

The public catalog should end as:

```js
function audioCoverageCategories() {
  return [
    { id: "alphabet", title: "字母", items: alphabetAudioCoverageTargets() },
    { id: "form-example", title: "例词", items: formExampleAudioCoverageTargets() },
    { id: "combo", title: "组合", items: comboAudioCoverageTargets() },
    { id: "vocab", title: "词汇", items: vocabAudioCoverageTargets() },
    { id: "reading", title: "句子", items: readingAudioCoverageTargets() }
  ];
}

function allAudioCoverageTargets() {
  return audioCoverageCategories().flatMap((category) => category.items);
}
```

Do not change any audio path, ID, value, Latin field, hash, or expected total.

- [ ] **Step 4: Remove recorder state, UI, actions, and styles**

Remove from `state`:

```js
recordingListMode
selectedRecordingCategory
selectedRecordingTargetId
recordingStatus
recordingDraftUrl
recordingDraftName
recordingDraftSize
recordingDraftType
voiceRecordingMarks
```

Remove those fields from hydration and saving. Remove global recorder variables and every function that depends on local recording marks, pending queues, streams, drafts, `MediaRecorder`, upload, download, or re-recording.

Remove `recording: renderRecordingScreen` from `screens`, and change `bottomNav()` to:

```js
const items = [
  ["home", "首页", iconHome()],
  ["library", "字母", iconLibrary()],
  ["learn", "学习", iconBook()],
  ["profile", "我的", iconUser()]
];
```

Delete recorder action branches and the document `change` handler for `import-voice-recording`.

Normalize an unknown/stale screen before rendering:

```js
const screenRenderer = screens[state.screen];
if (!screenRenderer) {
  state.screen = "home";
}
app.innerHTML = (screens[state.screen] || renderHome)();
```

In `prototype/styles.css`, change:

```css
.bottom-nav {
  grid-template-columns: repeat(4, 1fr);
}
```

Delete selectors used only by recorder cards, mode controls, target lists, panels, uploads, previews, and recorder tablet layout. Keep shared `.profile-*`, `.audio-*`, button, and playback styles.

- [ ] **Step 5: Run focused tests**

Run:

```bash
node tests/unit-learning-experience.test.mjs
node tests/full-content-render.test.mjs
node tests/human-audio.test.mjs
```

Expected: all PASS; human audio still reports 565 connected targets.

- [ ] **Step 6: Confirm audio files were not touched**

Run:

```bash
git status --short -- prototype/assets/audio
```

Expected: no new changes caused by this task.

- [ ] **Step 7: Commit recorder removal**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs tests/human-audio.test.mjs
git commit -m "refactor: remove completed recording workspace"
```

---

### Task 3: Remove Internal Review Copy from Learner Screens

**Files:**
- Modify: `prototype/app.js:280-420`
- Modify: `prototype/app.js:2048-2380`
- Modify: `prototype/app.js:3150-3775`
- Modify: `prototype/app.js:4415-4460`
- Test: `tests/unit-learning-experience.test.mjs:500-950`
- Test: `tests/full-content-render.test.mjs`

**Interfaces:**
- Preserves: review fields in `prototype/course-data/*.js`
- Removes: internal audit screen routing, audit-mode actions, and audit-only runtime state from the learner prototype
- Removes from learner HTML: the six forbidden status strings listed in Global Constraints
- Replaces: review-oriented recommendation text with neutral learning guidance

- [ ] **Step 1: Write the learner-copy audit tests**

In `tests/full-content-render.test.mjs`, add:

```js
const forbiddenLearnerCopy = [
  "待审校",
  "待母语者审校",
  "待来源审校",
  "已校对",
  "待修改",
  "展示项"
];

function assertLearnerCopyClean(label) {
  for (const phrase of forbiddenLearnerCopy) {
    assert.ok(!app.innerHTML.includes(phrase), `${label} should hide ${phrase}`);
  }
}
```

Call `assertLearnerCopyClean(label)` inside every `renderState()` call.

Change the main screen render matrix from:

```js
["welcome", "home", "learn", "writing", "review", "library", "profile"]
```

to:

```js
["welcome", "home", "learn", "writing", "library", "profile"]
```

Update the final render count from `465` to `464`.

In `tests/unit-learning-experience.test.mjs`:

- Remove positive expectations for `待审校` and `待来源审校`.
- Add representative assertions after rendering home, learn, library, letter, vocabulary, quote, and proverb screens:

```js
for (const phrase of ["待审校", "待母语者审校", "待来源审校", "已校对", "待修改", "展示项"]) {
  assert.ok(!app.innerHTML.includes(phrase), `learner screen should hide ${phrase}`);
}
```

- Add:

```js
assert.ok(
  !renderState("state.screen = 'vocab'").includes("进入审校模式"),
  "learner vocabulary screen should not expose audit mode"
);
```

- Delete the existing test block that clicks `set-app-mode`, enters vocabulary audit mode, and exits audit mode; the learner prototype no longer has that feature.

- [ ] **Step 2: Run the copy tests and verify they fail**

Run:

```bash
node tests/unit-learning-experience.test.mjs
node tests/full-content-render.test.mjs
```

Expected: FAIL on existing learner-visible status badges and reading captions.

- [ ] **Step 3: Remove status rendering from learner components**

Make these exact renderer changes in `prototype/app.js`:

- `renderLearnPath()`: omit unit audit/status badges; retain unit number, title, subtitle, and progress/action copy.
- `renderGroupCard()`: remove `<span class="step-state">${group.status}</span>`.
- `renderLetterFormExamples()`: remove `<span class="step-state">已校对</span>`.
- `renderReadingLine()`: for quote/proverb cards, remove `<p class="caption">${item.reviewStatus}</p>`.
- `renderLibrary()`: remove the `待审校` badge.
- Learner vocabulary screens: remove the `modeActionButton()` call.
- Any learner-only template that interpolates `item.reviewStatus`, `choice.reviewStatus`, `unit.status`, or `group.status`: remove that interpolation or replace it with neutral instructional copy.

The cleaned group-card header must be:

```js
const cardContent = `
  <div class="section-row">
    <strong>${group.title}</strong>
  </div>
  <div class="alphabet-strip compact">
    ${renderLetterPills(group.letters)}
  </div>
`;
```

The cleaned quote/proverb branch must be:

```js
if (unit.readingKind === "quote" || unit.readingKind === "proverb") {
  return `
    <article class="card reading-line reading-feature-line">
      ${audioButton}
      <div class="uyghur reading-value">${item.value}</div>
      <p class="reading-meaning">${item.meaning}</p>
    </article>
  `;
}
```

The letter form-example header must contain only:

```html
<div>
  <p class="caption">写法例词</p>
  <h2 class="section-title">${letter.formExamples.length} 种位置写法</h2>
</div>
```

Remove `review: renderReviewDashboard` from `screens`. Delete the learner prototype’s audit-only runtime pieces:

```text
state.appMode
state.selectedReviewItemId
state.reviewFilter
state.reviewOverrides
reviewStatusOptions
audioStatusOptions
reviewFilters
reviewBaseItems
isAuditMode()
modeActionButton()
reviewStatusById()
audioStatusById()
reviewItemsWithOverrides()
filteredReviewItems()
currentReviewItem()
reviewCounts()
updateReviewItem()
renderReviewStatusBadge()
renderReviewDashboard()
set-app-mode action
set-review-filter action
select-review-item action
apply-review-status action
```

Also remove their hydration and persistence fields. Keep all `reviewStatus` fields in `prototype/course-data/*.js`; `tests/course-data-integrity.test.mjs` continues to validate them.

- [ ] **Step 4: Rewrite review-oriented learner recommendations**

Replace:

```js
"看名人短句，先按待审校学习版阅读。"
"看常见谚语，先按待审校学习版阅读。"
```

with:

```js
"阅读名人短句，先理解句意，再听真人发音。"
"阅读常见谚语，先理解句意，再跟读真人发音。"
```

Remove parenthetical learner prompts such as `（含义：待审校）`; use the item meaning only when it is needed for the exercise.

- [ ] **Step 5: Run data and rendering tests**

Run:

```bash
node tests/course-data-integrity.test.mjs
node tests/unit-learning-experience.test.mjs
node tests/full-content-render.test.mjs
```

Expected: all PASS. The data-integrity test continues to validate internal review metadata, while rendered learner HTML contains none of the forbidden strings.

- [ ] **Step 6: Commit learner-copy cleanup**

```bash
git add prototype/app.js tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "fix: hide internal review labels from learners"
```

---

### Task 4: Build Dedicated Settings Screen and Home Goal Feedback

**User revision (approved after the first Task 4 review):** “设置” is a fifth bottom-navigation item immediately after “我的”. This revision supersedes every earlier Task 4 reference to settings being embedded in the profile page or to a four-item final navigation. The unsafe generic `.uyghur { font-size: 1.12em; }` large-font rule is also superseded; large mode must never reduce an element’s existing computed size.

**Files:**
- Modify: `prototype/app.js:1878-1920`
- Modify: `prototype/app.js:2048-2095`
- Modify: `prototype/app.js:4690-4840`
- Modify: `prototype/app.js:5050-5095`
- Modify: `prototype/styles.css:1-110`
- Modify: `prototype/styles.css:2140-2290`
- Test: `tests/unit-learning-experience.test.mjs:280-380`
- Test: `tests/full-content-render.test.mjs`

**Interfaces:**
- Produces: `renderSegmentedSetting({label, detail, action, value, options}): string`
- Produces: `renderToggleSetting({label, detail, action, checked}): string`
- Produces: `setPreference(key: "fontSize"|"audioAutoplay"|"dailyGoal"|"learningReminder", value: unknown): void`
- Produces: `applyPreferencesToRoot(): void`
- Produces: `todayGoalProgress(): {completed: number, goal: 5|10|15, percent: number, complete: boolean}`
- Consumes: Task 1 `normalizePreferences()` and `dailyActivitySnapshot()`

- [ ] **Step 1: Write failing settings-screen and home setting tests**

Replace the old placeholder setting expectations in `tests/unit-learning-experience.test.mjs` with:

```js
const settingsHtml = renderState("state.screen = 'settings'");
includesAll(
  settingsHtml,
  [
    "学习偏好",
    "字体大小",
    "标准",
    "大",
    "每日目标",
    "5 个",
    "10 个",
    "15 个",
    "学习提醒",
    "音频",
    "自动播放",
    "账号与数据",
    "当前账号",
    "learner@anatilim.app",
    "退出登录"
  ],
  "functional settings screen"
);
assert.ok(!settingsHtml.includes("将在登录版开放"));
assert.ok(profileHtml.includes("按 9 个学习单元查看完成情况"));
assert.ok(!profileHtml.includes("字体大小"), "profile should no longer contain settings controls");

const settingsNavHtml = settingsHtml.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || "";
let revisedNavPosition = -1;
for (const target of ["home", "library", "learn", "profile", "settings"]) {
  const position = settingsNavHtml.indexOf(`data-target="${target}"`, revisedNavPosition + 1);
  assert.ok(position > revisedNavPosition, `bottom navigation should place ${target} in order`);
  revisedNavPosition = position;
}
assert.equal((settingsNavHtml.match(/class="nav-button/g) || []).length, 5);
```

In `tests/full-content-render.test.mjs`, add `"settings"` after `"profile"` in the main screen matrix and update the expected total from `464` to `465`.

Add action tests:

```js
clickDataset({ action: "set-font-size", value: "large" });
assert.equal(savedProgress().preferences.fontSize, "large");
assert.equal(app.dataset.fontSize, "large", "large text should apply to the app root");

clickDataset({ action: "set-daily-goal", value: "15" });
assert.equal(savedProgress().preferences.dailyGoal, 15);
assert.ok(renderState("state.screen = 'home'").includes("0 / 15"));

clickDataset({ action: "toggle-learning-reminder" });
assert.equal(savedProgress().preferences.learningReminder, true);
includesAll(renderState("state.screen = 'home'"), ["今日学习提醒", "还差 15 个完成今日目标"], "home reminder");

vm.runInContext(
  `state.dailyActivity = {
    date: localDayKey(),
    completedIds: Array.from({ length: 15 }, (_, index) => "activity-" + index)
  }`,
  context
);
assert.ok(!renderState("state.screen = 'home'").includes("今日学习提醒"));
```

- [ ] **Step 2: Run the learning-experience test and verify it fails**

Run:

```bash
node tests/unit-learning-experience.test.mjs
```

Expected: FAIL because there is no dedicated settings screen, navigation still has four items, and the home card does not use daily goals.

- [ ] **Step 3: Implement preference application and daily goal calculation**

Add:

```js
function setPreference(key, value) {
  state.preferences = normalizePreferences({
    ...state.preferences,
    [key]: value
  });
  saveLocalProgress();
}

function applyPreferencesToRoot() {
  app.dataset.fontSize = state.preferences.fontSize;
}

function todayGoalProgress() {
  const completed = dailyActivitySnapshot().completedIds.length;
  const goal = state.preferences.dailyGoal;
  return {
    completed,
    goal,
    percent: Math.min(100, Math.round((completed / goal) * 100)),
    complete: completed >= goal
  };
}
```

Call `applyPreferencesToRoot()` on every `render()` after selecting a valid screen and before or after assigning `app.innerHTML`.

- [ ] **Step 4: Move real controls to a dedicated settings screen**

Use semantic buttons with `aria-pressed`:

```js
function renderSegmentedSetting({ label, detail, action, value, options }) {
  return `
    <div class="profile-setting-block">
      <div>
        <strong>${label}</strong>
        <small>${detail}</small>
      </div>
      <div class="setting-segments" role="group" aria-label="${label}">
        ${options.map((option) => `
          <button
            class="setting-segment ${String(value) === String(option.value) ? "active" : ""}"
            data-action="${action}"
            data-value="${option.value}"
            aria-pressed="${String(value) === String(option.value)}"
            type="button"
          >${option.label}</button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderToggleSetting({ label, detail, action, checked }) {
  return `
    <button class="profile-setting-block setting-toggle-row" data-action="${action}" type="button" aria-pressed="${checked}">
      <span><strong>${label}</strong><small>${detail}</small></span>
      <span class="setting-switch ${checked ? "active" : ""}" aria-hidden="true"><i></i></span>
    </button>
  `;
}
```

Build `renderSettingsPanel()` from three visible groups:

1. `学习偏好`: font size, daily goal, learning reminder.
2. `音频`: autoplay toggle.
3. `账号与数据`: read-only email and logout. Task 5 adds the working clear-record confirmation to this group.

Use these exact option definitions and actions:

```js
function renderSettingsPanel() {
  const preferences = state.preferences;

  return `
    <article class="card profile-settings-card">
      <div>
        <p class="caption">设置</p>
        <h2 class="section-title">学习偏好</h2>
      </div>

      <section class="profile-setting-group" aria-labelledby="learning-preferences-title">
        <h3 id="learning-preferences-title">学习偏好</h3>
        ${renderSegmentedSetting({
          label: "字体大小",
          detail: "调整界面与学习内容字号",
          action: "set-font-size",
          value: preferences.fontSize,
          options: [
            { value: "standard", label: "标准" },
            { value: "large", label: "大" }
          ]
        })}
        ${renderSegmentedSetting({
          label: "每日目标",
          detail: "每天计划完成的学习活动",
          action: "set-daily-goal",
          value: preferences.dailyGoal,
          options: [
            { value: 5, label: "5 个" },
            { value: 10, label: "10 个" },
            { value: 15, label: "15 个" }
          ]
        })}
        ${renderToggleSetting({
          label: "学习提醒",
          detail: "未完成目标时在首页提醒",
          action: "toggle-learning-reminder",
          checked: preferences.learningReminder
        })}
      </section>

      <section class="profile-setting-group" aria-labelledby="audio-preferences-title">
        <h3 id="audio-preferences-title">音频</h3>
        ${renderToggleSetting({
          label: "自动播放",
          detail: "进入或切换学习内容时播放一次",
          action: "toggle-audio-autoplay",
          checked: preferences.audioAutoplay
        })}
      </section>

      <section class="profile-setting-group" aria-labelledby="account-settings-title">
        <h3 id="account-settings-title">账号与数据</h3>
        <div class="profile-setting-block profile-account-setting">
          <div>
            <strong>当前账号</strong>
            <small>${state.mockUserEmail || "本地学习账号"}</small>
          </div>
        </div>
        <button class="secondary-button profile-logout-button" data-action="profile-logout" type="button">
          退出登录
        </button>
      </section>
    </article>
  `;
}
```

Add the screen renderer:

```js
function renderSettings() {
  return screen(
    `
      ${topBar("设置", "学习偏好与账号数据")}
      <section class="stack wide-gap settings-layout">
        ${renderSettingsPanel()}
      </section>
    `,
    "settings"
  );
}
```

Add `settings: renderSettings` to `screens`. Add the fifth navigation item immediately after profile:

```js
const items = [
  ["home", "首页", iconHome()],
  ["library", "字母", iconLibrary()],
  ["learn", "学习", iconBook()],
  ["profile", "我的", iconUser()],
  ["settings", "设置", iconSettings()]
];
```

Create `iconSettings()` using the existing inline SVG icon style. Remove `${renderProfileSettings()}` from `renderProfile()` so “我的” retains only account summary and learning progress.

Change `renderProfileUnitStats()` to use:

```js
<h2 class="section-title">按 ${summaries.length} 个学习单元查看完成情况</h2>
```

- [ ] **Step 5: Update home progress and reminder rendering**

In `renderHome()`, use `todayGoalProgress()` for the progress count, percentage, and reminder:

```js
const today = todayGoalProgress();
```

Render:

```html
<span class="step-state">${today.completed} / ${today.goal}</span>
<div class="progress-fill" style="--value: ${today.percent}%"></div>
```

When `state.preferences.learningReminder && !today.complete`, render:

```html
<aside class="card learning-reminder-card" role="status">
  <strong>今日学习提醒</strong>
  <span>还差 ${today.goal - today.completed} 个完成今日目标</span>
</aside>
```

- [ ] **Step 6: Add settings and large-text styles**

Add to `prototype/styles.css`:

```css
.app-screen[data-font-size="large"] {
  font-size: 1.1em;
}

.profile-setting-group,
.profile-setting-block {
  display: grid;
  gap: 10px;
}

.profile-setting-block {
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.74);
}

.profile-setting-block > div:first-child,
.profile-setting-block > span:first-child {
  display: grid;
  gap: 4px;
}

.setting-segments {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 6px;
}

.setting-segment {
  min-height: 38px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--ink);
  background: var(--paper);
}

.setting-segment.active {
  border-color: rgba(14, 155, 177, 0.45);
  background: var(--teal-soft);
  font-weight: 800;
}

.setting-toggle-row {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  width: 100%;
  color: inherit;
  text-align: left;
}

.setting-switch {
  position: relative;
  width: 44px;
  height: 26px;
  border-radius: 999px;
  background: rgba(79, 93, 133, 0.22);
}

.setting-switch i {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--paper);
  transition: transform 160ms ease;
}

.setting-switch.active {
  background: var(--teal);
}

.setting-switch.active i {
  transform: translateX(18px);
}
```

Do not add a generic `.app-screen[data-font-size="large"] .uyghur` font-size rule: it overrides fixed component sizes and can make 54px/28px/24px content smaller. Preserve existing `.uyghur` font families and `font-weight: 600`, then add explicit large-mode sizes for representative fixed-size content with values strictly greater than their standard declarations. At minimum cover `.letter-big`, `.combo-big`, `.reading-value`, and `.form-example-word .form-example-word-text`. Add source-level regression assertions proving the unsafe generic selector is absent and each large-mode value is greater than its standard value.

- [ ] **Step 7: Wire settings actions**

Replace the `profile-setting` placeholder action with:

```js
if (action === "set-font-size") {
  setPreference("fontSize", button.dataset.value === "large" ? "large" : "standard");
  render();
  showToast("字体大小已更新");
  return;
}

if (action === "set-daily-goal") {
  setPreference("dailyGoal", Number(button.dataset.value));
  render();
  showToast("每日目标已更新");
  return;
}

if (action === "toggle-learning-reminder") {
  setPreference("learningReminder", !state.preferences.learningReminder);
  render();
  showToast(state.preferences.learningReminder ? "学习提醒已开启" : "学习提醒已关闭");
  return;
}

if (action === "toggle-audio-autoplay") {
  setPreference("audioAutoplay", !state.preferences.audioAutoplay);
  render();
  showToast(state.preferences.audioAutoplay ? "自动播放已开启" : "自动播放已关闭");
  return;
}
```

- [ ] **Step 8: Run focused tests**

Run:

```bash
node tests/unit-learning-experience.test.mjs
node tests/full-content-render.test.mjs
```

Expected: both PASS.

- [ ] **Step 9: Commit functional settings UI**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: add dedicated learner settings"
```

---

### Task 5: Add Safe Learning-Record Clearing

**Files:**
- Modify: `prototype/app.js:440-475`
- Modify: `prototype/app.js:4779-4815`
- Modify: `prototype/app.js:5060-5100`
- Modify: `prototype/styles.css:2140-2290`
- Test: `tests/unit-learning-experience.test.mjs:280-380`

**Interfaces:**
- Produces: `emptyLearningProgress(): {letters: {}, combos: {}, vocab: {}, practice: {}, reading: {}}`
- Produces: `learningRecordSnapshot(): object`
- Produces: `restoreLearningRecordSnapshot(snapshot: object): void`
- Produces: `clearLearningRecords(): void`
- Preserves: `state.preferences`, `state.mockSignedIn`, `state.mockUserEmail`, and internal course data
- Clears: learning progress, daily activity, mistakes, writing checks, favorite, recent content selections, and practice state
- Consumes: existing defaults for initial selected group/item IDs

- [ ] **Step 1: Write failing confirmation and preservation tests**

Extend the test localStorage fake with a controllable write failure:

```js
let storageWritesFail = false;

// Inside window.localStorage.setItem:
setItem(key, value) {
  if (storageWritesFail) {
    throw new Error("localStorage write failed");
  }
  storage[key] = String(value);
}
```

Add:

```js
vm.runInContext(
  `
    state.preferences = {
      fontSize: "large",
      audioAutoplay: true,
      dailyGoal: 15,
      learningReminder: true
    };
    state.mockSignedIn = true;
    state.mockUserEmail = "learner@anatilim.app";
    state.learningProgress.letters["dot-bone"] = { completed: true };
    state.dailyActivity = { date: localDayKey(), completedIds: ["letters:dot-bone:viewed"] };
    state.mistakes = [{ key: "letter:be", targetId: "be" }];
    state.writingChecks = ["shape"];
    state.favorite = true;
    state.screen = "settings";
    render();
  `,
  context
);

clickDataset({ action: "request-clear-learning" });
includesAll(app.innerHTML, ["确认清除学习记录", "取消", "确认清除"], "clear confirmation");
assert.equal(vm.runInContext("state.mistakes.length", context), 1, "request should not clear data");

clickDataset({ action: "cancel-clear-learning" });
assert.equal(vm.runInContext("state.mistakes.length", context), 1, "cancel should preserve data");

storageWritesFail = true;
clickDataset({ action: "request-clear-learning" });
clickDataset({ action: "confirm-clear-learning" });
storageWritesFail = false;
assert.equal(vm.runInContext("state.mistakes.length", context), 1, "failed clearing should restore mistakes");
assert.equal(vm.runInContext("state.favorite", context), true, "failed clearing should restore favorite");
assert.equal(toast.textContent, "清除失败，原记录已保留");

clickDataset({ action: "request-clear-learning" });
clickDataset({ action: "confirm-clear-learning" });
assert.equal(vm.runInContext("state.mistakes.length", context), 0);
assert.equal(vm.runInContext("state.favorite", context), false);
assert.equal(
  vm.runInContext("Object.keys(state.learningProgress.letters).length", context),
  0
);
assert.equal(savedProgress().mockUserEmail, "learner@anatilim.app");
assert.deepEqual(savedProgress().preferences, {
  fontSize: "large",
  audioAutoplay: true,
  dailyGoal: 15,
  learningReminder: true
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
node tests/unit-learning-experience.test.mjs
```

Expected: FAIL because the clear confirmation actions and clearing helper do not exist.

- [ ] **Step 3: Implement exact clearing behavior**

Add:

```js
function emptyLearningProgress() {
  return {
    letters: {},
    combos: {},
    vocab: {},
    practice: {},
    reading: {}
  };
}

function learningRecordSnapshot() {
  return JSON.parse(JSON.stringify({
    learningProgress: state.learningProgress,
    dailyActivity: state.dailyActivity,
    mistakes: state.mistakes,
    writingChecks: state.writingChecks,
    favorite: state.favorite,
    selectedPicture: state.selectedPicture,
    selectedListening: state.selectedListening,
    practiceAudioPlayed: state.practiceAudioPlayed,
    keyboardValue: state.keyboardValue,
    practiceSpoken: state.practiceSpoken,
    currentLetterId: state.currentLetterId,
    selectedGroupId: state.selectedGroupId,
    currentComboItemId: state.currentComboItemId,
    selectedComboGroupId: state.selectedComboGroupId,
    currentVocabItemId: state.currentVocabItemId,
    selectedVocabGroupId: state.selectedVocabGroupId,
    currentPracticeItemId: state.currentPracticeItemId,
    selectedPracticeGroupId: state.selectedPracticeGroupId,
    selectedReadingUnitId: state.selectedReadingUnitId,
    selectedReadingGroupId: state.selectedReadingGroupId,
    selectedUnitId: state.selectedUnitId
  }));
}

function restoreLearningRecordSnapshot(snapshot) {
  Object.assign(state, snapshot);
}

function clearLearningRecords() {
  state.learningProgress = emptyLearningProgress();
  state.dailyActivity = { date: localDayKey(), completedIds: [] };
  state.mistakes = [];
  state.writingChecks = [];
  state.favorite = false;
  state.selectedPicture = "";
  state.selectedListening = "";
  state.practiceAudioPlayed = false;
  state.keyboardValue = "";
  state.practiceSpoken = false;
  state.currentLetterId = "be";
  state.selectedGroupId = "dot-bone";
  state.currentComboItemId = "ba";
  state.selectedComboGroupId = "open-a";
  state.currentVocabItemId = "yaxshimusiz";
  state.selectedVocabGroupId = "greetings";
  state.currentPracticeItemId = "practice-listen-be";
  state.selectedPracticeGroupId = "listening-loop";
  state.selectedReadingUnitId = "sentence-patterns";
  state.selectedReadingGroupId = "sentence-this-that";
  state.selectedUnitId = "letters";
  state.clearLearningConfirmation = false;
}
```

Do not modify `state.preferences`, `state.mockSignedIn`, `state.mockUserEmail`, or audio maps.

- [ ] **Step 4: Render inline confirmation and add actions**

In the dedicated settings screen’s `账号与数据` section from Task 4, insert this block between the current-account row and logout button:

```js
${
  state.clearLearningConfirmation
    ? `
      <div class="clear-learning-confirmation" role="alert">
        <strong>确认清除学习记录</strong>
        <p>将清除课程进度、今日记录、错题、收藏和最近学习位置；账号与设置会保留。</p>
        <div class="action-grid">
          <button class="secondary-button" data-action="cancel-clear-learning" type="button">取消</button>
          <button class="danger-button" data-action="confirm-clear-learning" type="button">确认清除</button>
        </div>
      </div>
    `
    : `
      <button class="danger-button" data-action="request-clear-learning" type="button">
        清除学习记录
      </button>
    `
}
```

Add handlers:

```js
if (action === "request-clear-learning") {
  state.clearLearningConfirmation = true;
  render();
  return;
}

if (action === "cancel-clear-learning") {
  state.clearLearningConfirmation = false;
  render();
  return;
}

if (action === "confirm-clear-learning") {
  const previousRecords = learningRecordSnapshot();
  clearLearningRecords();
  if (!saveLocalProgress()) {
    restoreLearningRecordSnapshot(previousRecords);
    state.clearLearningConfirmation = false;
    render();
    showToast("清除失败，原记录已保留");
    return;
  }
  render();
  showToast("学习记录已清除");
  return;
}
```

Add `.danger-button` and `.clear-learning-confirmation` styles using existing coral variables.

- [ ] **Step 5: Run focused tests**

Run:

```bash
node tests/unit-learning-experience.test.mjs
node tests/full-content-render.test.mjs
```

Expected: both PASS.

- [ ] **Step 6: Commit safe data clearing**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs
git commit -m "feat: clear learning records safely"
```

---

### Task 6: Add One-Shot Audio Autoplay

**Files:**
- Modify: `prototype/app.js:480-490`
- Modify: `prototype/app.js:635-810`
- Modify: `prototype/app.js:1878-1920`
- Modify: `prototype/app.js:5015-5040`
- Test: `tests/unit-learning-experience.test.mjs:180-270`
- Test: `tests/unit-learning-experience.test.mjs:850-920`

**Interfaces:**
- Produces: `currentAutoplayEntry(): null | {key: string, src: string, label: string}`
- Produces: `syncAudioAutoplay(): void`
- Updates: module-local `lastAutoplayKey: string`
- Extends: `playAudio(src, label, options?: {autoplay?: boolean}): boolean`
- Consumes: `state.preferences.audioAutoplay` and current letter/combo/vocab/practice/reading audio helpers

- [ ] **Step 1: Instrument the fake Audio object and write failing autoplay tests**

In `tests/unit-learning-experience.test.mjs`, before `context`, add:

```js
const playedAudioSources = [];
```

Change the fake Audio implementation to:

```js
Audio: function FakeAudio(src) {
  this.src = src;
  this.pause = () => {};
  this.play = () => {
    playedAudioSources.push(src);
    return Promise.resolve();
  };
}
```

Add:

```js
playedAudioSources.length = 0;
vm.runInContext(
  `
    state.preferences.audioAutoplay = true;
    state.screen = "group";
    state.selectedGroupId = "dot-bone";
    state.currentLetterId = "be";
    render();
  `,
  context
);
assert.deepEqual(playedAudioSources, ["./assets/audio/human/alphabet/human_letter_01_b.webm"]);

vm.runInContext("render()", context);
assert.equal(playedAudioSources.length, 1, "ordinary rerender should not replay current content");

clickDataset({ action: "select-adjacent-letter", id: "pe" });
assert.equal(playedAudioSources.length, 2, "switching content should autoplay once");
assert.equal(playedAudioSources[1], "./assets/audio/human/alphabet/human_letter_02_p.webm");

vm.runInContext("state.screen = 'home'; render(); state.screen = 'group'; render();", context);
assert.equal(playedAudioSources.length, 3, "leaving and returning should allow autoplay again");

vm.runInContext("state.preferences.audioAutoplay = false; render()", context);
const beforeManualPlay = playedAudioSources.length;
clickDataset({
  action: "play-audio",
  audioSrc: "./assets/audio/human/alphabet/human_letter_01_b.webm",
  audioLabel: "ب"
});
assert.equal(playedAudioSources.length, beforeManualPlay + 1, "manual playback should always work");
```

Also add one representative combo, vocabulary, and reading-group autoplay assertion by assigning the matching screen and selected item/group, calling `render()`, and checking the exact connected source.

- [ ] **Step 2: Run the learning-experience test and verify it fails**

Run:

```bash
node tests/unit-learning-experience.test.mjs
```

Expected: FAIL because rendering does not trigger autoplay.

- [ ] **Step 3: Implement current-content audio resolution**

Add:

```js
let lastAutoplayKey = "";

function currentAutoplayEntry() {
  if (state.screen === "group" || state.screen === "letter") {
    const audio = currentLetterAudio();
    return audio?.outputPath
      ? { key: `letter:${currentLetter().id}`, src: audio.outputPath, label: currentLetter().letter }
      : null;
  }

  if (state.screen === "combo") {
    const audio = currentComboAudio();
    return audio?.outputPath
      ? { key: `combo:${currentComboItem().id}`, src: audio.outputPath, label: currentComboItem().value }
      : null;
  }

  if (state.screen === "vocab") {
    const audio = currentVocabAudio();
    return audio?.outputPath
      ? { key: `vocab:${currentVocabItem().id}`, src: audio.outputPath, label: currentVocabItem().value }
      : null;
  }

  if (state.screen === "practiceSession") {
    const item = currentPracticeItem();
    const audio = currentPracticeAudio();
    return item && audio?.outputPath
      ? { key: `practice:${item.id}`, src: audio.outputPath, label: item.value }
      : null;
  }

  if (state.screen === "reading") {
    const item = currentReadingGroup().items[0];
    const audio = item ? readingAudioByItemId[item.id] : null;
    return item && audio?.outputPath
      ? { key: `reading:${item.id}`, src: audio.outputPath, label: item.value }
      : null;
  }

  return null;
}
```

Writing-form example words remain directly playable through their existing buttons; entering a letter screen autoplays the primary letter once and must never start four example recordings in sequence.

- [ ] **Step 4: Implement guarded autoplay and silent browser-policy failure**

Add:

```js
function syncAudioAutoplay() {
  const entry = currentAutoplayEntry();
  if (!state.preferences.audioAutoplay || !entry) {
    lastAutoplayKey = "";
    return;
  }
  if (entry.key === lastAutoplayKey) return;
  lastAutoplayKey = entry.key;
  playAudio(entry.src, entry.label, { autoplay: true });
}
```

Extend playback:

```js
function playAudio(src, label, { autoplay = false } = {}) {
  if (!src) {
    if (!autoplay) showToast("暂无可播放音频");
    return false;
  }
  if (activeAudio && typeof activeAudio.pause === "function") {
    activeAudio.pause();
  }
  activeAudio = new Audio(src);
  activeAudio
    .play()
    .then(() => {
      if (!autoplay) showToast(`${label || "内容"}：播放中`);
    })
    .catch(() => {
      if (!autoplay) showToast("音频文件不能播放，请检查文件");
    });
  return true;
}
```

Call `syncAudioAutoplay()` at the end of `render()` after HTML, highlighting, canvas initialization, root preferences, and persistence are complete.

- [ ] **Step 5: Run audio and UI tests**

Run:

```bash
node tests/unit-learning-experience.test.mjs
node tests/human-audio.test.mjs
node tests/full-content-render.test.mjs
```

Expected: all PASS. Autoplay is one-shot per active content key; manual playback remains unchanged.

- [ ] **Step 6: Commit autoplay**

```bash
git add prototype/app.js tests/unit-learning-experience.test.mjs
git commit -m "feat: autoplay active lesson audio"
```

---

### Task 7: Bump Assets, Run Full Verification, and Perform Browser QA

**Files:**
- Modify: `prototype/index.html:7-17`
- Modify: `tests/unit-learning-experience.test.mjs:25-30`
- Verify: `prototype/assets/audio/**`
- Verify: all files changed in Tasks 1-6

**Interfaces:**
- Produces: one cache version `20260726-learner-settings` used by every prototype CSS/data/app URL
- Consumes: all behavior and styles from Tasks 1-6

- [ ] **Step 1: Write the failing asset-version assertion**

Change the test assertion to:

```js
assert.ok(
  indexHtml.includes("?v=20260726-learner-settings"),
  "prototype should load the learner settings release assets"
);
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
node tests/unit-learning-experience.test.mjs
```

Expected: FAIL because `prototype/index.html` still uses `20260726-letter-sound-choices`.

- [ ] **Step 3: Update every prototype asset URL**

In `prototype/index.html`, replace every occurrence of:

```text
20260726-letter-sound-choices
```

with:

```text
20260726-learner-settings
```

Do not change script ordering.

- [ ] **Step 4: Scan learner source and rendered behavior**

Run:

```bash
rg -n '待审校|待母语者审校|待来源审校|已校对|待修改|展示项' prototype/app.js
rg -n 'MediaRecorder|getUserMedia|start-voice-recording|import-voice-recording|renderRecordingScreen' prototype/app.js
```

Expected:

- Review words may appear only inside non-rendered metadata declarations, never in learner renderers, routes, controls, or recommendations.
- Recorder runtime tokens return no matches.

- [ ] **Step 5: Run the complete project check**

Run:

```bash
node scripts/check-project.mjs
```

Expected final line:

```text
All project checks passed.
```

The human-audio check must still validate all 565 connected targets and no missing files.

- [ ] **Step 6: Perform browser QA at phone and tablet sizes**

Using the running prototype at `http://127.0.0.1:4173/prototype/?refresh=learner-settings`:

1. Confirm the navigation has only `首页`, `字母`, `学习`, `我的`, `设置`, with “设置” immediately after “我的”.
2. Open “设置”; change font to `大`, daily goal to `15`, enable reminder, and enable autoplay.
3. Refresh; confirm those four settings remain selected.
4. Return home; confirm `今日进度` uses `/ 15` and shows the reminder while incomplete.
5. Open a letter, switch to the next letter, and confirm one audio playback occurs per selection without repeated playback during unrelated rerenders.
6. Manually click a form-example word and confirm its connected audio still plays.
7. Check representative learn, library, quote, proverb, and form-example pages for forbidden review copy.
8. Open “设置”; request clear, cancel, and confirm the data remains. Request again and confirm; verify progress, mistakes, favorite, and recent position clear while email and settings remain.
9. Confirm there is no empty recorder page or microphone permission request.
10. Check the browser console; expected result is zero errors and zero warnings caused by the changes.

- [ ] **Step 7: Inspect the final diff for scope**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected:

- No whitespace errors.
- No audio asset deletion or modification.
- No unrelated user file is staged by these tasks.

- [ ] **Step 8: Commit the verified release**

```bash
git add prototype/index.html tests/unit-learning-experience.test.mjs
git commit -m "chore: verify learner settings release"
```

If Git author identity remains unconfigured, do not create a temporary identity. Leave only the task files staged and report the commit blocker.

---

### Task 8: Move Settings Into “我的” and Remove Expanded Unit Progress

**Latest user revision:** The browser-annotated layout request supersedes Task 4’s
dedicated fifth Settings navigation. The final navigation has four items:
`首页 / 字母 / 学习 / 我的`. Settings belong inside “我的”; the expanded 9-unit
progress card is removed; the account card spans the full profile content width.

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Test: `tests/unit-learning-experience.test.mjs`
- Test: `tests/full-content-render.test.mjs`

**Interfaces and final structure:**
- `bottomNav()` renders exactly four actions and no `settings` action.
- `renderProfile()` renders the full-width account/summary card, then the settings
  card; it does not render the 9-unit progress card.
- `renderHome()` remains focused on the existing daily goal and learning content;
  it does not render the expanded unit-progress card.
- The settings card renders exactly one learner-visible “学习偏好” heading.
- Existing preference actions, clearing confirmation, persistence, autoplay,
  account preservation, and logout behavior remain unchanged.
- A stale locally persisted `screen: "settings"` safely resolves to `profile`
  rather than a blank or hidden screen.

- [ ] **Step 1: Add failing final-layout tests**

Assert:

```js
const navSource = sourceSlice("function bottomNav", "function iconHome");
assert.deepEqual(
  [...navSource.matchAll(/\[\"([^\"]+)\", \"([^\"]+)\"/g)].map((match) => match.slice(1, 3)),
  [["home", "首页"], ["library", "字母"], ["learn", "学习"], ["profile", "我的"]]
);

const profileHtml = renderState("state.screen = 'profile'");
assert.equal((profileHtml.match(/学习偏好/g) || []).length, 1);
includesAll(profileHtml, ["字体大小", "每日目标", "学习提醒", "自动播放", "清除学习记录"]);
assert.ok(!profileHtml.includes("按 9 个学习单元查看完成情况"));
assert.ok(!renderState("state.screen = 'home'").includes("按 9 个学习单元查看完成情况"));
```

Add a stale-state assertion that a saved `settings` screen hydrates/renders as
`profile`.

- [ ] **Step 2: Run the unit test and verify RED**

Expected: FAIL because the fifth Settings navigation and dedicated screen still
exist, the expanded progress card is still on “我的”, and “学习偏好” is duplicated.

- [ ] **Step 3: Refactor render helpers without changing behavior**

- Remove the expanded unit-progress renderer from learner output.
- Render `renderSettingsPanel()` after the account card inside profile.
- Remove the redundant caption or heading so “学习偏好” appears exactly once.
- Remove the dedicated Settings nav item/route/screen renderer.
- Normalize stale `settings` state to `profile`.

- [ ] **Step 4: Update layout CSS**

- Change bottom navigation columns back to four equal columns.
- Make the profile account card/container span the entire content width.
- Stack the settings card beneath it.
- Remove layout rules used only by the deleted expanded progress column when safe.
- Remove only selectors that are exclusively tied to the deleted dedicated
  settings page.

- [ ] **Step 5: Run verification**

```bash
node tests/unit-learning-experience.test.mjs
node tests/full-content-render.test.mjs
node tests/human-audio.test.mjs
node scripts/check-project.mjs
git diff --check -- prototype/app.js prototype/styles.css \
  tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
```

Expected: all pass; 565 audio targets remain connected. The full-content count may
decrease by one because the independent Settings screen is intentionally removed.

- [ ] **Step 6: Browser QA**

At phone and tablet widths:

1. Confirm four navigation items in the exact final order.
2. Confirm no page shows the expanded 9-unit progress card.
3. Confirm “我的” shows a full-width account card followed by the settings card.
4. Confirm “学习偏好” appears exactly once.
5. Re-run persistence, autoplay, clear-record cancel/confirm, no-review-copy, and
   no-recorder checks.
