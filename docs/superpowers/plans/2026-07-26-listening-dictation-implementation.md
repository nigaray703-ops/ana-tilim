# Listening Controls and Dictation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared 1×/0.75× playback, session-only looping, a persistent Latin-transliteration preference, letter dictation, and vocabulary dictation without adding a new bottom-navigation destination.

**Architecture:** A focused `audio-controller.js` owns mutable audio playback state while `app.js` remains responsible for rendering and course progress. Letter dictation extends the existing listening practice; vocabulary dictation is a focused screen entered from the active vocabulary group and reuses the existing Uyghur keyboard patterns.

**Tech Stack:** Plain browser JavaScript, HTML, CSS, Node `assert`/`vm` tests, current in-app Browser QA.

## Global Constraints

- Preserve all existing human audio files and manifests.
- Keep at least 464 full-content render states and 565 audio coverage targets.
- Use only `1` and `0.75` as accepted playback rates.
- Persist playback speed and Latin-transliteration visibility; never persist loop state.
- Do not reveal a dictation answer before a correct response.
- In point-position recognition choices, show only the candidate letter before selection; hide component breakdowns, Latin values, and pronunciation/meaning hints that reveal the answer.
- Randomize the virtual Uyghur keyboard once per new exercise item. Keep that order stable while the learner edits the same answer, never force the correct key into a fixed slot, and never highlight or name the correct key before input.
- Do not add a bottom-navigation item or a separate listening center.
- Use failing tests before every production change.
- If Git author identity is still unavailable, do not configure it implicitly; record commit steps as blocked.

---

### Task 1: Shared audio controller

**Files:**
- Create: `prototype/audio-controller.js`
- Create: `tests/audio-controller.test.mjs`
- Modify: `prototype/index.html`
- Modify: `scripts/check-project.mjs`
- Modify: `tests/unit-learning-experience.test.mjs`

**Interfaces:**
- Produces: `window.ANA_TILIM_AUDIO.createAudioController(options)`.
- Produces controller methods:
  - `play({ src, label, contentKey, autoplay }): boolean`
  - `setRate(value): 1 | 0.75`
  - `setLoop(enabled): boolean`
  - `stop({ resetLoop = true } = {}): void`
  - `snapshot(): { rate, loop, contentKey, playing }`
- Consumes: `options.AudioCtor`, `options.onStarted`, and `options.onError`.

- [ ] **Step 1: Write the failing controller test**

Create `tests/audio-controller.test.mjs` with a fake audio class that records `src`, `playbackRate`, `loop`, `play()`, and `pause()`:

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const instances = [];
class FakeAudio {
  constructor(src) {
    this.src = src;
    this.playbackRate = 1;
    this.loop = false;
    this.paused = false;
    instances.push(this);
  }
  play() {
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

const context = { window: {}, globalThis: null };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync("prototype/audio-controller.js", "utf8"), context);

const controller = context.window.ANA_TILIM_AUDIO.createAudioController({ AudioCtor: FakeAudio });
assert.equal(controller.setRate(0.75), 0.75);
assert.equal(controller.play({ src: "./one.webm", label: "one", contentKey: "letter:one" }), true);
assert.equal(instances[0].playbackRate, 0.75);
assert.equal(controller.setLoop(true), true);
assert.equal(instances[0].loop, true);
controller.play({ src: "./two.webm", label: "two", contentKey: "letter:two" });
assert.equal(instances[0].paused, true);
assert.equal(instances[1].loop, false, "changing content must reset looping");
controller.stop();
assert.deepEqual(controller.snapshot(), {
  rate: 0.75,
  loop: false,
  contentKey: "",
  playing: false
});
console.log("audio controller checks passed");
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/audio-controller.test.mjs
```

Expected: FAIL because `prototype/audio-controller.js` does not exist.

- [ ] **Step 3: Implement the minimal controller**

Create an IIFE in `prototype/audio-controller.js`. Normalize rates with:

```js
function normalizeRate(value) {
  return Number(value) === 0.75 ? 0.75 : 1;
}
```

On every `play()`:

1. reject an empty `src` by returning `false`;
2. pause the previous audio;
3. reset loop when `contentKey` changes;
4. create a new audio object;
5. assign `playbackRate` and `loop`;
6. call `play()` and route promise success/failure to callbacks;
7. return `true` synchronously so existing click handlers keep working.

- [ ] **Step 4: Load the controller before `app.js`**

Add a versioned script to `prototype/index.html` immediately before `app.js`:

```html
<script src="./audio-controller.js?v=20260726-listening-offline-sync"></script>
```

In the same edit, change every existing first-party CSS, course-data, and app query string from `20260726-learner-settings` to `20260726-listening-offline-sync`. Replace `expectedVersionedAssets` in `tests/unit-learning-experience.test.mjs` with the exact new ordered list. Add syntax and test entries to `scripts/check-project.mjs`.

- [ ] **Step 5: Run the focused and complete checks**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/audio-controller.test.mjs
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs
```

Expected: both PASS.

- [ ] **Step 6: Commit the controller task**

```bash
git add prototype/audio-controller.js prototype/index.html tests/audio-controller.test.mjs tests/unit-learning-experience.test.mjs scripts/check-project.mjs
git commit -m "feat: add shared audio controller"
```

---

### Task 2: Playback preferences and compact controls

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

**Interfaces:**
- Consumes: `window.ANA_TILIM_AUDIO.createAudioController`.
- Produces preference fields:
  - `audioRate: 1 | 0.75`
  - `showLatin: boolean`
- Produces renderer: `renderAudioControls(): string`.

- [ ] **Step 1: Add failing preference and rendering assertions**

Extend the expected default preferences:

```js
assert.deepEqual(defaultPreferences, {
  fontSize: "standard",
  audioAutoplay: false,
  audioRate: 1,
  showLatin: true,
  dailyGoal: 10,
  learningReminder: false
});
```

Add invalid-value repair assertions for `audioRate: 2` and `showLatin: "yes"`. Render the profile and assert that it contains:

```text
播放速度
1×
0.75×
显示拉丁转写
```

Simulate `set-audio-rate` and `toggle-latin` clicks and assert saved preferences.

Render the existing `spot` practice for `ئا / ئە` and assert each unselected answer option contains only the candidate Uyghur letter plus the neutral selection action. Assert the markup does not contain `ئ + ا`, `ئ + ە`, `元音，a`, or `元音，e`.

- [ ] **Step 2: Run the test and verify it fails for missing fields**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: FAIL because `audioRate` and `showLatin` are absent.

- [ ] **Step 3: Extend preference normalization**

Update `DEFAULT_PREFERENCES` and `normalizePreferences()`:

```js
const DEFAULT_PREFERENCES = {
  fontSize: "standard",
  audioAutoplay: false,
  audioRate: 1,
  showLatin: true,
  dailyGoal: 10,
  learningReminder: false
};
```

Only accept `0.75` or `1` for `audioRate`, and only a real boolean for `showLatin`.

- [ ] **Step 4: Replace direct audio construction**

Create one controller after `activeAudio` is removed:

```js
const audioController = window.ANA_TILIM_AUDIO.createAudioController({
  AudioCtor: Audio,
  onStarted({ label, autoplay }) {
    if (!autoplay) showToast(`${label || "内容"}：播放中`);
  },
  onError({ autoplay }) {
    if (!autoplay) showToast("音频文件不能播放，请检查文件");
  }
});
audioController.setRate(state.preferences.audioRate);
```

Keep the public `playAudio(src, label, options)` wrapper, but delegate to the controller and pass a stable `contentKey`.

Update both VM harnesses to execute `prototype/audio-controller.js` before `prototype/app.js`. Extend their fake `Audio` objects with writable `playbackRate`, `loop`, and `pause()` so they exercise the real controller contract.

- [ ] **Step 5: Add settings and event actions**

In the audio settings group render:

- a segmented `播放速度` setting with values `1` and `0.75`;
- a `显示拉丁转写` toggle.

Add click actions:

```js
if (action === "set-audio-rate") {
  const rate = Number(button.dataset.value) === 0.75 ? 0.75 : 1;
  setPreference("audioRate", rate);
  audioController.setRate(rate);
  render();
  return;
}

if (action === "toggle-audio-loop") {
  const enabled = audioController.setLoop(!audioController.snapshot().loop);
  render();
  showToast(enabled ? "循环播放已开启" : "循环播放已关闭");
  return;
}
```

Add a compact control row near focus audio areas. Do not place a complete control row in every vocabulary list item.

In the same rendering pass, simplify point-position recognition answer choices so their pre-selection content contains only the candidate letter. Keep component breakdown, pronunciation, Latin transliteration, and meaning out of the option until the learner has answered; post-selection correctness feedback may identify the result without exposing another unanswered item.

- [ ] **Step 6: Stop audio on content navigation**

Call `audioController.stop()` in `goTo()` and in selection actions that change the current letter, combination, vocabulary item, practice item, or reading group.

- [ ] **Step 7: Run focused and complete checks**

Expected: preference, loop, navigation stop, 464+ render states, and 565 audio targets all pass.

- [ ] **Step 8: Commit the playback controls task**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: add listening playback controls"
```

---

### Task 3: Latin-transliteration visibility

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

**Interfaces:**
- Produces: `renderLatin(value, { force = false, tag = "span", className = "" } = {}): string`.
- Consumes: `state.preferences.showLatin`.

- [ ] **Step 1: Write failing behavior tests**

Render representative letter and vocabulary screens with `showLatin = false` and assert that visible markup does not include their Latin values. Then force a completed/correct result and assert the result includes:

```html
<span class="latin-transliteration latin-result">...</span>
```

Also assert Chinese meanings remain visible.

- [ ] **Step 2: Run and verify the expected leak**

Expected: FAIL because direct `${item.latin}` and `${letter.latin}` markup still leaks transliteration.

- [ ] **Step 3: Add one rendering helper**

Implement:

```js
function renderLatin(value, { force = false, tag = "span", className = "" } = {}) {
  if (!value || (!force && !state.preferences.showLatin)) return "";
  return `<${tag} class="latin-transliteration ${className}">${value}</${tag}>`;
}
```

Use it in learner-facing alphabet and vocabulary selectors, focus cards, lesson summaries, recognition choices, keyboard prompts, and dictation results. Do not alter manifest data, internal IDs, or audio labels required by tests.

- [ ] **Step 4: Add stable spacing styles**

Ensure containers collapse cleanly when the helper returns an empty string. Style `.latin-transliteration` without forcing a reserved height.

- [ ] **Step 5: Run all render states**

Run the full-content render test and inspect at least one letter and one vocabulary page with both preference values.

- [ ] **Step 6: Commit the transliteration task**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: add transliteration visibility setting"
```

---

### Task 4: Letter dictation mode

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

**Interfaces:**
- Produces state:
  - `listeningAnswerMode: "choice" | "dictation"`
  - `dictationValue: string`
  - `dictationResult: "" | "wrong" | "correct"`
  - a stable per-question shuffled keyboard order shared by existing keyboard practice and dictation
- Produces: `normalizeUyghurAnswer(value): string`.
- Uses existing `listening-loop` items and `markPracticeListeningItemComplete(group, item)`.

- [ ] **Step 1: Write failing interaction tests**

Start a `listening-loop` practice item, switch to dictation, play audio, and assert:

- no target value or Latin appears;
- the Uyghur keyboard appears;
- a wrong key leaves `dictationResult === "wrong"` and still hides the answer;
- deleting and entering the target produces `dictationResult === "correct"`;
- the item ID is appended once to `listenCompletedIds`.
- starting two new items can produce different keyboard orders under controlled random input, while rerendering the same item keeps its order unchanged;
- the correct key is not forced into the first slot and has no pre-answer highlight, “点击 …” hint, or other answer-revealing style.

- [ ] **Step 2: Run and verify the missing mode failure**

Expected: FAIL because the mode action and state do not exist.

- [ ] **Step 3: Add state reset boundaries**

Add the three answer fields and a stable keyboard-order field. Generate a Fisher–Yates shuffled copy when a new keyboard-practice or dictation target starts; do not reshuffle during rerenders or edits. Tests may inject/override randomness for deterministic assertions. Reset the order only at a real question boundary. `normalizeUyghurAnswer()` must trim whitespace and remove only zero-width formatting characters; it must not replace or transliterate Uyghur letters.

- [ ] **Step 4: Add the segmented mode control**

Render `选择 / 听写` only for `group.mode === "listen"`. Changing mode clears the previous answer but does not select a new target or mark progress.

- [ ] **Step 5: Reuse the existing keyboard**

Render the current Uyghur keyboard in the stored shuffled order with `data-action="dictation-key"`, plus delete and clear actions. Apply the same stable shuffled-order helper to the existing keyboard-input lesson. Before correctness is known, all ordinary keys use neutral styling and no instruction may name the next correct key. Check the answer after each edit:

```js
const correct = normalizeUyghurAnswer(state.dictationValue) === normalizeUyghurAnswer(item.value);
```

Wrong input shows “再听一次，继续修改。” Correct input reveals `item.value`, forced Latin output, and the existing next-audio action.

- [ ] **Step 6: Run focused, full-content, and audio tests**

Expected: PASS with no change to the 565 audio coverage targets.

- [ ] **Step 7: Commit letter dictation**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: add letter dictation mode"
```

---

### Task 5: Vocabulary dictation and rendered QA

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

**Interfaces:**
- Produces screen: `vocabDictation`.
- Produces progress at `learningProgress.practice["vocab-dictation:<groupId>"].dictationCompletedIds`.
- Reuses: `normalizeUyghurAnswer`, `renderLatin`, `vocabAudioByItemId`, and the existing Uyghur keyboard.

- [ ] **Step 1: Write failing vocabulary dictation tests**

Open vocabulary group `greetings`, trigger `open-vocab-dictation`, and assert:

- a target comes from the active group;
- audio is playable from the existing vocabulary manifest;
- Uyghur value, Latin, and Chinese meaning are hidden before success;
- a wrong full word does not reveal the answer;
- the correct full word reveals all three fields;
- only that item ID is saved;
- “下一个词” chooses an incomplete target.

- [ ] **Step 2: Run and verify the missing screen failure**

Expected: FAIL because `vocabDictation` is not a registered screen.

- [ ] **Step 3: Add a group-level entry and renderer**

Add “词汇听写” to the vocabulary group lesson actions. Implement `renderVocabDictation()` using the same focus audio card and keyboard behavior as letter dictation.

- [ ] **Step 4: Keep progress item-based**

Use:

```js
const progressId = `vocab-dictation:${state.selectedVocabGroupId}`;
const progress = ensureProgress("practice", progressId);
progress.dictationCompletedIds = [...new Set([...(progress.dictationCompletedIds || []), item.id])];
progress.completed = progress.dictationCompletedIds.length >= currentVocabGroup().items.length;
```

- [ ] **Step 5: Run the complete project check**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs
```

Expected: PASS; render-state count is at least 464 and audio coverage remains exactly 565.

- [ ] **Step 6: Validate the rendered flows**

Using the in-app Browser, test:

```text
字母 → 听音辨认 → 听写 → 播放 → 错误输入 → 重听 → 正确输入
第三单元 → 任一词汇组 → 词汇听写 → 播放 → 完整输入 → 下一个词
我的 → 播放速度/显示拉丁转写 → 刷新 → 设置仍保持
```

Check 390×844 and 952×998, console warnings/errors, answer leakage, button wrapping, bottom navigation, and horizontal overflow. Restore test preferences after QA.

- [ ] **Step 7: Commit the completed listening feature**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: add vocabulary dictation"
```
