# RTL Gloss, Real Uyghur Keyboard, Continuous Learning, and Local Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the confirmed right-to-left word and morpheme annotations, a faithful Microsoft Uyghur keyboard, next-course continuation across every applicable unit, and editable offline learner profiles in both Ana Tilim and Uyghur Tili.

**Architecture:** Keep the international prototype as the shared source of truth. Add two focused browser modules for keyboard mapping and local avatar processing, keep rendering and navigation orchestration in the existing `app.js`, then copy the shared runtime into the domestic `site/` and rebuild `dist-cn/`. Every user-facing behavior is covered first by Node VM tests; final acceptance adds offline static checks and visual QA in the user's already-open browser.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node.js `assert`/`vm` tests, Canvas/FileReader browser APIs, localStorage, Tencent CloudBase static hosting.

## Global Constraints

- Unless the user explicitly names only the domestic or international edition, every product change is applied to both editions.
- Ana Tilim keeps optional authentication and cloud sync; Uyghur Tili keeps no login, registration, cloud sync, Supabase, Vercel, Google Fonts, jsDelivr, or external core runtime dependency.
- All Uyghur Tili runtime assets use relative local paths and `dist-cn/index.html` remains at the package root.
- Do not change lesson order, saved learning-progress semantics, human recordings, listening, dictation, handwriting, import/export, or the editions' existing configuration boundary.
- Do not use automatic online translation or automatic morpheme guessing; only explicit local glossary data may render.
- Preserve the current logo, colors, typography, cards, and responsive navigation.
- Do not bulk-delete files or directories.

---

## File Structure

- Create `prototype/uyghur-keyboard.js`: the single source for KLID `00010480` base/Shift mappings, target-to-keystroke expansion, and physical-key lookup.
- Create `prototype/local-profile.js`: local profile normalization, avatar-file validation, and offline 256×256 avatar conversion.
- Modify `prototype/index.html`: load the two modules before `app.js` and bump local cache versions for changed files.
- Modify `prototype/app.js`: consume the new modules; render continuation actions, RTL glosses, the keyboard, and local profile controls; handle click, keydown, and file-change events.
- Modify `prototype/styles.css`: implement centered RTL interlinear cards, nested morpheme direction, physical keyboard rows/Shift key, and local profile editor states.
- Modify `tests/sentence-glossary.test.mjs`: preserve explicit token and segment data guarantees.
- Modify `tests/unit-learning-experience.test.mjs`: verify rendering, navigation, physical keyboard input, and local profile persistence.
- Modify `tests/local-progress-transfer.test.mjs`: verify local profile survives export/import.
- Modify `scripts/check-project.mjs`: include any newly added focused test if it is not already discovered.
- Modify `Uyghur Tili/site/*`: copy only the shared runtime files changed above while preserving `site/app-config.js` and domestic-only configuration/content policy.
- Modify `Uyghur Tili/scripts/build-cn.mjs`: include `uyghur-keyboard.js` and `local-profile.js` in the static package.
- Modify `Uyghur Tili/tests/cn-static.test.mjs`: verify the new modules, behaviors, local profile, and offline boundary in `dist-cn`.
- Regenerate `Uyghur Tili/dist-cn/*`: CloudBase upload package.

---

### Task 1: Continue to the next course within every applicable unit

**Files:**
- Modify: `prototype/app.js:818-965,1822-1845,3204-3250,3729-3765,4016-4048,4145-4185,4545-4615,5250-5360`
- Test: `tests/unit-learning-experience.test.mjs:1835-1870,1900-2005`

**Interfaces:**
- Consumes: ordered `alphabetGroups`, `comboGroups`, `vocabGroups`, non-review `practiceGroups`, and each reading unit's `groups`.
- Produces: `nextCollectionItem(items, currentId)`, `nextVocabCourse(groupId, sectionId)`, and `renderContinueCourseButton(nextCourse)`; existing open actions consume the returned IDs.

- [ ] **Step 1: Write failing navigation/render tests**

Add assertions covering first, middle, and final courses:

```js
const comboFirstComplete = renderState("state.screen = 'comboComplete'; state.selectedComboGroupId = 'open-a'; state.currentComboItemId = 'ba'");
assert.match(comboFirstComplete, /继续学习本单元下一课程/);
assert.match(comboFirstComplete, /data-action="open-combo-group" data-id="soft-e"/);
clickDataset({ action: "open-combo-group", id: "soft-e" });
assert.equal(vm.runInContext("state.selectedComboGroupId", context), "soft-e");
assert.equal(vm.runInContext("state.currentComboItemId", context), "be-e");

const comboLastComplete = renderState("state.screen = 'comboComplete'; state.selectedComboGroupId = 'connection-breaks'; state.currentComboItemId = 'dada-connection'");
assert.doesNotMatch(comboLastComplete, /继续学习本单元下一课程/);

const vocabContinuation = JSON.parse(vm.runInContext(
  "JSON.stringify(nextVocabCourse(state.selectedVocabGroupId, currentVocabSection()?.id))",
  context
));
assert.ok(vocabContinuation.groupId && vocabContinuation.itemId);

const readingNext = renderState("state.screen = 'reading'; state.selectedReadingUnitId = 'dialogue-theater'; state.selectedReadingGroupId = 'dialogue-greeting'");
assert.match(readingNext, /继续学习本单元下一课程/);
assert.match(readingNext, /data-action="open-reading-group"/);
```

- [ ] **Step 2: Run the test and confirm the new cases fail**

Run: `node tests/unit-learning-experience.test.mjs`

Expected: FAIL because combo, vocabulary, practice, and reading screens do not yet expose the shared continuation behavior.

- [ ] **Step 3: Add collection and vocabulary continuation helpers**

Implement exact return shapes:

```js
function nextCollectionItem(items, currentId) {
  const index = items.findIndex((item) => item.id === currentId);
  return index >= 0 ? items[index + 1] || null : null;
}

function nextVocabCourse(groupId, sectionId) {
  const group = vocabGroups.find((item) => item.id === groupId) || vocabGroups[0];
  const sections = group.sections || [];
  const section = sections.find((item) => item.id === sectionId) || sections[0] || null;
  const nextSection = section ? nextCollectionItem(sections, section.id) : null;
  if (nextSection) {
    return { groupId: group.id, itemId: nextSection.itemIds[0] };
  }
  const nextGroup = nextCollectionItem(vocabGroups, group.id);
  return nextGroup ? { groupId: nextGroup.id, itemId: nextGroup.items[0].id } : null;
}
```

- [ ] **Step 4: Render and wire continuation buttons**

Use one data contract for every button:

```js
function renderContinueCourseButton({ action, id, unitId = "", itemId = "" } = {}) {
  if (!action || !id) return "";
  return `<button class="primary-button continue-course-button" data-action="${action}" data-id="${id}" data-unit-id="${unitId}" data-item-id="${itemId}" type="button">继续学习本单元下一课程</button>`;
}
```

Apply it to:

- alphabet completion with `open-group`;
- combo completion with `open-combo-group`;
- vocabulary completion with a new `open-vocab-course` action so the next section can start at `data-item-id`;
- non-review practice completion with `open-practice-group`, using `practiceGroups.filter(group => group.mode !== "review")`;
- the bottom of reading lessons with `open-reading-group` and `data-unit-id`.

Keep `renderUnitNextActions(...)` and the existing home/learning-path buttons after the continuation button. Do not render continuation for the final course.

- [ ] **Step 5: Run the focused test**

Run: `node tests/unit-learning-experience.test.mjs`

Expected: PASS, including direct entry into the next course's first item.

- [ ] **Step 6: Commit the independently working navigation change**

```bash
git add prototype/app.js tests/unit-learning-experience.test.mjs
git commit -m "feat: continue to the next course across units"
```

---

### Task 2: Render confirmed RTL word and morpheme annotations

**Files:**
- Modify: `prototype/app.js:3850-4150`
- Modify: `prototype/styles.css:1923-2015`
- Test: `tests/sentence-glossary.test.mjs:20-60`
- Test: `tests/unit-learning-experience.test.mjs` near reading and vocabulary render assertions

**Interfaces:**
- Consumes: `sentenceGlossary.glossSentence(value)` and `sentenceGlossary.glossToken(value)` with `segments: Array<{word, latin, meaning}>`.
- Produces: `renderGlossSegments(segments)`, `renderSentenceGlosses(value)`, and `renderVocabMorphemeBreakdown(value)` HTML with stable `data-gloss-word` and `data-morpheme` markers.

- [ ] **Step 1: Write failing RTL and omission tests**

```js
const schoolDialogue = renderState("state.screen = 'reading'; state.selectedReadingUnitId = 'dialogue-theater'; state.selectedReadingGroupId = 'dialogue-school'");
assert.match(schoolDialogue, /从右向左理解/);
assert.match(schoolDialogue, /class="gloss-direction"[^>]*>[^<]*←/);
assert.ok(schoolDialogue.indexOf('data-gloss-word="بۈگۈن"') < schoolDialogue.indexOf('data-gloss-word="دەرس"'));
assert.ok(schoolDialogue.indexOf('data-morpheme="بار"') < schoolDialogue.indexOf('data-morpheme="مۇ"'));

const guestDialogue = renderState("state.screen = 'reading'; state.selectedReadingUnitId = 'dialogue-theater'; state.selectedReadingGroupId = 'dialogue-guest'");
const thanksLine = guestDialogue.match(/رەھمەت\.[\s\S]*?<\/article>/)?.[0] || "";
assert.doesNotMatch(thanksLine, /sentence-gloss/);

const plainVocab = renderState("state.screen = 'vocab'; state.selectedVocabGroupId = 'greetings'; state.currentVocabItemId = 'rehmet'");
assert.doesNotMatch(plainVocab, /vocab-morpheme-breakdown/);
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `node tests/sentence-glossary.test.mjs`

Run: `node tests/unit-learning-experience.test.mjs`

Expected: the glossary data test stays green; the new rendering assertions fail against the old repeated panel and slash separators.

- [ ] **Step 3: Implement omission and RTL rendering rules**

Use explicit conditions:

```js
function renderSentenceGlosses(value) {
  const glosses = sentenceGlossary.glossSentence(value);
  const hasBreakdown = glosses.some((gloss) => gloss.segments?.length);
  if (!glosses.length || (glosses.length === 1 && !hasBreakdown)) return "";
  // render heading, direction cue, note, and word cards
}

function renderVocabMorphemeBreakdown(value) {
  const gloss = sentenceGlossary.glossToken(value);
  return gloss?.segments?.length
    ? `<div class="vocab-morpheme-breakdown">${renderGlossSegments(gloss.segments)}</div>`
    : "";
}
```

Render segment separators as `<span class="morpheme-direction" aria-hidden="true">←</span>` and keep source-array order unchanged. Add `dir="rtl"` to Uyghur rows, `dir="ltr"` to Latin/Chinese rows, `data-gloss-word`, and `data-morpheme` markers.

- [ ] **Step 4: Implement centered option-three styling**

Set `.sentence-gloss { text-align: center; }`, `.word-glosses { direction: rtl; justify-content: center; }`, `.word-gloss { direction: ltr; }`, and `.morpheme-glosses { direction: rtl; justify-content: center; }`. On narrow screens retain `flex-wrap: wrap` and `justify-content: center`; do not reverse DOM arrays in JavaScript.

- [ ] **Step 5: Run both focused tests**

Run: `node tests/sentence-glossary.test.mjs`

Run: `node tests/unit-learning-experience.test.mjs`

Expected: PASS; `بار` appears before `مۇ` in source and to its visual right via RTL flex direction, while `رەھمەت` has no redundant panel.

- [ ] **Step 6: Commit the independently working annotation change**

```bash
git add prototype/app.js prototype/styles.css tests/sentence-glossary.test.mjs tests/unit-learning-experience.test.mjs
git commit -m "feat: center rtl word and morpheme glosses"
```

---

### Task 3: Replace alphabet grids with a faithful Uyghur physical keyboard

**Files:**
- Create: `prototype/uyghur-keyboard.js`
- Modify: `prototype/index.html`
- Modify: `prototype/app.js:1-20,344-355,390-425,1430-1510,3130-3195,3645-3720,3940-4010,4320-4360,5590-5640`
- Modify: `prototype/styles.css:2329-2360` and responsive media sections
- Test: `tests/unit-learning-experience.test.mjs:45-75,320-350,1820-1840,1970-1990`

**Interfaces:**
- Produces from `uyghur-keyboard.js`: `window.ANA_TILIM_UYGHUR_KEYBOARD` with `rows`, `keyForCode(code, shifted)`, and `keystrokesForText(text)`.
- Consumes in `app.js`: `{ rows, keyForCode, keystrokesForText }`; maintains `state.keyboardShift: boolean`.

- [ ] **Step 1: Write failing module, DOM, Shift, and physical-key tests**

Capture a keydown handler in the VM test stub and assert exact mappings:

```js
let keydownHandler = null;
// document.addEventListener stores click and keydown handlers

const keyboardRows = JSON.parse(vm.runInContext("JSON.stringify(uyghurKeyboard.rows)", context));
assert.deepEqual(keyboardRows[0].map((key) => key.value), ["چ", "ۋ", "ې", "ر", "ت", "ي", "ۇ", "ڭ", "و", "پ"]);
assert.deepEqual(keyboardRows[1].map((key) => key.value), ["ھ", "س", "د", "ا", "ە", "ى", "ق", "ك", "ل"]);
assert.deepEqual(keyboardRows[2].map((key) => key.value), ["ز", "ش", "غ", "ۈ", "ب", "ن", "م", "،", ".", "ئ"]);
assert.equal(vm.runInContext("uyghurKeyboard.keyForCode('KeyK', true).value", context), "ۆ");
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(uyghurKeyboard.keystrokesForText('ئە'))", context)),
  [{ code: "Slash", shifted: false, value: "ئ" }, { code: "KeyG", shifted: false, value: "ە" }]
);

const keyboardHtml = renderState("state.screen = 'keyboard'; state.selectedGroupId = 'vowels-basic'; state.currentLetterId = 'ae'; state.keyboardValue = ''");
assert.match(keyboardHtml, /class="uyghur-keyboard-row row-home"/);
assert.match(keyboardHtml, /data-physical-key="Q"/);
assert.match(keyboardHtml, /data-action="toggle-keyboard-shift"/);

keydownHandler({ code: "Slash", shiftKey: false, preventDefault() {} });
keydownHandler({ code: "KeyG", shiftKey: false, preventDefault() {} });
assert.equal(vm.runInContext("state.keyboardValue", context), "ئە");
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `node tests/unit-learning-experience.test.mjs`

Expected: FAIL because the focused module, real rows, Shift state, and keydown handler do not exist.

- [ ] **Step 3: Create the exact keyboard mapping module**

Define physical keys with normal and shifted values. The curriculum Shift mappings must be exact:

```js
const rows = [
  [
    ["KeyQ", "Q", "چ"], ["KeyW", "W", "ۋ"], ["KeyE", "E", "ې"], ["KeyR", "R", "ر"], ["KeyT", "T", "ت"],
    ["KeyY", "Y", "ي"], ["KeyU", "U", "ۇ"], ["KeyI", "I", "ڭ"], ["KeyO", "O", "و"], ["KeyP", "P", "پ"]
  ],
  [
    ["KeyA", "A", "ھ"], ["KeyS", "S", "س"], ["KeyD", "D", "د", "ژ"], ["KeyF", "F", "ا", "ف"],
    ["KeyG", "G", "ە", "گ"], ["KeyH", "H", "ى", "خ"], ["KeyJ", "J", "ق", "ج"], ["KeyK", "K", "ك", "ۆ"], ["KeyL", "L", "ل", "لا"]
  ],
  [
    ["KeyZ", "Z", "ز"], ["KeyX", "X", "ش"], ["KeyC", "C", "غ"], ["KeyV", "V", "ۈ"], ["KeyB", "B", "ب"],
    ["KeyN", "N", "ن"], ["KeyM", "M", "م"], ["Comma", ",", "،", ">"], ["Period", ".", ".", "<"], ["Slash", "/", "ئ", "؟"]
  ]
].map((row) => row.map(([code, physical, value, shiftedValue = ""]) => ({ code, physical, value, shiftedValue })));
```

Build an ordered value-to-keystroke index that prefers single unshifted outputs, then shifted outputs, and uses Unicode iteration so `ئە` expands to `ئ` then `ە`.

- [ ] **Step 4: Render a reusable physical keyboard**

Add `renderUyghurKeyboard({ targetValue, ariaLabel })` that emits three `.uyghur-keyboard-row` elements, physical-key labels, base/Shift glyphs, a sticky on-screen Shift key, Backspace, and Clear. Use `keystrokesForText(targetValue)` plus `state.keyboardValue` to determine the next physical key and existing `next-key`/`done-key` classes.

Replace the five-column and random keyboard grids in letter, combo, vocabulary, and standalone keyboard practice screens. Keep course-specific word/part shortcuts above the physical keyboard only where they teach structure; they must not replace the real keyboard.

- [ ] **Step 5: Share input logic between pointer and hardware keyboards**

Extract `appendKeyboardValue(value)` from the current `data-action="key"` handler, use it for both click and keydown input, and add:

```js
document.addEventListener("keydown", (event) => {
  if (!keyboardInputScreenActive() || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.code === "Backspace") {
    event.preventDefault();
    state.keyboardValue = state.keyboardValue.slice(0, -1);
    render();
    return;
  }
  const mapped = uyghurKeyboard.keyForCode(event.code, event.shiftKey);
  if (!mapped?.value) return;
  event.preventDefault();
  appendKeyboardValue(mapped.value);
});
```

The on-screen Shift action toggles `state.keyboardShift`; after a shifted character click, reset it to `false`.

- [ ] **Step 6: Add physical keyboard CSS**

Use a horizontal keyboard container with three non-wrapping rows. Give top, home, and bottom rows offsets of `0`, `2.5%`, and `5%`; keycaps use `flex: 1 1 0`, a minimum touch height of 48px, and small corner physical-key labels. On screens narrower than the minimum keyboard width, allow horizontal scrolling inside the keyboard only; never reorder or wrap keys.

- [ ] **Step 7: Run focused tests**

Run: `node tests/unit-learning-experience.test.mjs`

Expected: PASS for base rows, Shift mappings, `ئە` two-step input, pointer input, and physical QWERTY input.

- [ ] **Step 8: Commit the independently working keyboard change**

```bash
git add prototype/uyghur-keyboard.js prototype/index.html prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs
git commit -m "feat: simulate the standard uyghur keyboard"
```

---

### Task 4: Add editable offline nickname and avatar profiles

**Files:**
- Create: `prototype/local-profile.js`
- Modify: `prototype/index.html`
- Modify: `prototype/app.js:390-425,470-635,4670-4895,5220-5255,5680-5740`
- Modify: `prototype/styles.css:2406-2475,2614-2645`
- Test: `tests/local-progress-transfer.test.mjs`
- Test: `tests/unit-learning-experience.test.mjs:680-775`

**Interfaces:**
- Produces from `local-profile.js`: `window.ANA_TILIM_LOCAL_PROFILE` with `normalize(value)`, `validateAvatarFile(file)`, and `createAvatarDataUrl(file, documentRef, ImageCtor)`.
- Consumes in `app.js`: `state.localProfile = { displayName: string, avatarDataUrl: string }`, persisted by `buildLocalProgressData()` and `hydrateLocalProgress()`.

- [ ] **Step 1: Write failing profile persistence and rendering tests**

```js
const normalized = JSON.parse(vm.runInContext(
  "JSON.stringify(localProfile.normalize({ displayName: '  Nigar  ', avatarDataUrl: 'data:image/jpeg;base64,abc' }))",
  context
));
assert.deepEqual(normalized, { displayName: "Nigar", avatarDataUrl: "data:image/jpeg;base64,abc" });

vm.runInContext("state.localProfile = { displayName: 'Nigar', avatarDataUrl: 'data:image/jpeg;base64,abc' }; saveLocalProgress()", context);
assert.deepEqual(JSON.parse(storage[progressStorageKey]).localProfile, {
  displayName: "Nigar",
  avatarDataUrl: "data:image/jpeg;base64,abc"
});

const localProfileHtml = renderState("cloudStatus = { phase: 'local', error: '' }; state.screen = 'profile'");
assert.match(localProfileHtml, /id="profile-avatar-input"/);
assert.match(localProfileHtml, /id="profile-display-name"/);
assert.match(localProfileHtml, /data-action="save-local-display-name"/);
assert.doesNotMatch(localProfileHtml, /profile-avatar-action disabled/);
```

Extend the transfer test so an export/import round trip preserves `localProfile` exactly.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `node tests/local-progress-transfer.test.mjs`

Run: `node tests/unit-learning-experience.test.mjs`

Expected: FAIL because no local profile module or saved state exists.

- [ ] **Step 3: Create local profile normalization and avatar conversion**

Implement these rules in `local-profile.js`:

```js
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const OUTPUT_SIZE = 256;

function normalize(value) {
  const source = value && typeof value === "object" ? value : {};
  const displayName = String(source.displayName || "").trim().slice(0, 40);
  const avatarDataUrl = /^data:image\/(?:jpeg|png|webp);base64,/i.test(String(source.avatarDataUrl || ""))
    ? String(source.avatarDataUrl)
    : "";
  return { displayName, avatarDataUrl };
}
```

`validateAvatarFile(file)` rejects unknown MIME types and files larger than 5 MiB with Chinese error messages. `createAvatarDataUrl(...)` reads the file with `FileReader`, loads it into an image, center-crops the shortest dimension into a 256×256 canvas, and returns `canvas.toDataURL("image/jpeg", 0.82)`. GIF input is accepted as a source but stored as a static resized first frame.

- [ ] **Step 4: Persist and render local identity**

Initialize and hydrate `state.localProfile`, include it in `buildLocalProgressData()`, and preserve it when clearing learning records. Render the local profile whenever `!cloudAccountEmail()`, even if cloud capability exists. Reuse the existing avatar picker and name editor; fallback initials are `AT` for Ana Tilim and `UT` for Uyghur Tili.

Add `save-local-display-name` using existing `validateDisplayName`; save locally and toast “昵称已保存”. In the avatar change handler, upload to cloud only when signed in; otherwise convert locally, store in `state.localProfile.avatarDataUrl`, save, rerender, and toast “头像已保存到当前设备”.

- [ ] **Step 5: Run focused tests**

Run: `node tests/local-progress-transfer.test.mjs`

Run: `node tests/unit-learning-experience.test.mjs`

Expected: PASS for local edit controls, refresh hydration, clear-progress preservation, and export/import round trip; signed-in cloud profile tests remain unchanged.

- [ ] **Step 6: Commit the independently working local profile change**

```bash
git add prototype/local-profile.js prototype/index.html prototype/app.js prototype/styles.css tests/local-progress-transfer.test.mjs tests/unit-learning-experience.test.mjs
git commit -m "feat: save local learner profiles"
```

---

### Task 5: Reduce the pronunciation-choice audio panel to the Listen button

**Files:**
- Modify: `prototype/app.js:1780-1800,3070-3095`
- Modify: `prototype/styles.css:1080-1110`
- Test: `tests/unit-learning-experience.test.mjs:1680-1710`

**Interfaces:**
- Consumes: existing `renderAudioButton({ audio, label, className })` playback behavior.
- Produces: `renderAudioFocus({ ..., buttonOnly: boolean })`; letter pronunciation choice passes `buttonOnly: true`.

- [ ] **Step 1: Write the failing compact-audio assertion**

```js
const pronunciationChoice = renderState("state.screen = 'letterSound'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'dal'");
assert.match(pronunciationChoice, /audio-only-focus/);
assert.match(pronunciationChoice, />听<\/button>/);
for (const removedText of ["播放或查看读音", "真人音频：", "音频待录", "音频未生成时"]) {
  assert.ok(!pronunciationChoice.includes(removedText), `pronunciation choice should hide ${removedText}`);
}
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `node tests/unit-learning-experience.test.mjs`

Expected: FAIL because the current panel still renders a title and caption.

- [ ] **Step 3: Implement the button-only branch**

At the beginning of `renderAudioFocus`, after calculating `classes`, return this exact shape when `buttonOnly` is true:

```js
if (buttonOnly) {
  return `<div class="${classes} audio-only-focus">${renderAudioButton({ audio, label, className: "letter-focus-play" })}</div>`;
}
```

Pass `buttonOnly: true` only from `renderLetterSoundChoice()`. Other listening and practice audio panels retain their existing descriptive text.

- [ ] **Step 4: Center the only remaining control**

Add `.audio-only-focus { min-height: 82px; display: grid; place-items: center; }` and `.audio-only-focus .letter-focus-play { position: static; }`. Keep the existing button size and teal color.

- [ ] **Step 5: Run the focused test**

Run: `node tests/unit-learning-experience.test.mjs`

Expected: PASS; the pronunciation-choice panel contains only the Listen control, while other audio panels still include their appropriate copy.

- [ ] **Step 6: Commit the independently working audio simplification**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs
git commit -m "ui: simplify pronunciation choice audio"
```

---

### Task 6: Synchronize the domestic source and rebuild the offline CloudBase package

**Files:**
- Modify: `Uyghur Tili/site/index.html`
- Create: `Uyghur Tili/site/uyghur-keyboard.js`
- Create: `Uyghur Tili/site/local-profile.js`
- Modify: `Uyghur Tili/site/app.js`
- Modify: `Uyghur Tili/site/styles.css`
- Modify: `Uyghur Tili/scripts/build-cn.mjs`
- Modify: `Uyghur Tili/tests/cn-static.test.mjs`
- Regenerate: `Uyghur Tili/dist-cn/index.html`, `app.js`, `styles.css`, `uyghur-keyboard.js`, `local-profile.js`, and unchanged required local assets

**Interfaces:**
- Consumes: verified shared runtime from Tasks 1–5 plus domestic `app-config.js`.
- Produces: a fully local `dist-cn/` with `index.html` at its root.

- [ ] **Step 1: Add failing domestic package tests**

```js
assert.ok(fs.existsSync(path.join(distRoot, "uyghur-keyboard.js")));
assert.ok(fs.existsSync(path.join(distRoot, "local-profile.js")));
assert.match(indexHtml, /\.\/uyghur-keyboard\.js\?v=/);
assert.match(indexHtml, /\.\/local-profile\.js\?v=/);

vm.runInContext("state.screen = 'keyboard'; state.selectedGroupId = 'vowels-basic'; state.currentLetterId = 'ae'; render();", context);
assert.match(app.innerHTML, /uyghur-keyboard-row/);

vm.runInContext("state.screen = 'profile'; state.localProfile = { displayName: '本地学习者', avatarDataUrl: '' }; render();", context);
assert.match(app.innerHTML, /本地学习者/);
assert.match(app.innerHTML, /save-local-display-name/);
```

- [ ] **Step 2: Run the domestic test and confirm failure**

Run from `Uyghur Tili`: `node tests/cn-static.test.mjs`

Expected: FAIL because the two new local modules and behaviors are not packaged yet.

- [ ] **Step 3: Copy shared runtime without overwriting domestic configuration**

Copy `prototype/app.js`, `prototype/styles.css`, `prototype/uyghur-keyboard.js`, and `prototype/local-profile.js` into `Uyghur Tili/site/`. Update the domestic `site/index.html` script list to load both modules before `app.js`; preserve the domestic title, logo, app config, lack of cloud scripts, and hidden famous-quotes policy.

- [ ] **Step 4: Extend the build input list and regenerate**

Add `"uyghur-keyboard.js"` and `"local-profile.js"` to `rootFiles` in `scripts/build-cn.mjs`. Run:

`node scripts/build-cn.mjs`

Expected: `Uyghur Tili CloudBase build created at .../Uyghur Tili/dist-cn` and `dist-cn/index.html` exists.

- [ ] **Step 5: Run the complete automated verification**

Run from Ana Tilim: `node scripts/check-project.mjs`

Run from Uyghur Tili: `node tests/cn-static.test.mjs`

Run from Ana Tilim: `git diff --check`

Expected: all commands exit 0; the domestic test finds no external runtime URL or cloud/login UI.

- [ ] **Step 6: Perform browser QA in the user's existing browser**

At the existing local preview, verify desktop and narrow widths for:

1. school dialogue centered RTL glosses and `بار ← مۇ` visual order;
2. the single `رەھمەت` line with no redundant gloss panel;
3. a multi-step `ئە` keyboard lesson and a Shift-letter lesson such as `ۆ`;
4. pointer input and physical keyboard input;
5. next-course buttons in alphabet, combo, vocabulary, practice, and reading paths;
6. local nickname/avatar edit, reload persistence, and no login UI in Uyghur Tili;
7. the pronunciation-choice audio panel containing only the round “听” button.

Capture screenshots at the same viewport as the approved/source state and compare spacing, cropping, type, borders, and responsive overflow before accepting.

- [ ] **Step 7: Commit the domestic source/build/test update**

```bash
git add prototype/index.html scripts/check-project.mjs tests Uyghur\ Tili/site Uyghur\ Tili/scripts/build-cn.mjs Uyghur\ Tili/tests/cn-static.test.mjs Uyghur\ Tili/dist-cn
git commit -m "build: refresh the uyghur tili cloudbase package"
```

If `Uyghur Tili` is outside the Ana Tilim Git worktree, do not force-add it to the Ana repository; report it as a separately updated local project instead.

- [ ] **Step 8: Upload and verify CloudBase**

In the existing CloudBase environment `uyghur-tili-d4gv9odyhe312c9c5`, upload the contents of `dist-cn/` so `index.html` is at the static-hosting root. Do not enable a paid plan. After upload completes, open the CloudBase public domain, hard-refresh once, and repeat the core offline learning checks before reporting the production URL.
