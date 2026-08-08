# Ana Tilim Chinese and English Learning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete Chinese and English learning modes to the international Ana Tilim site, with system-language detection, a persistent manual switcher, locally bundled translations, and no regression to guest learning or Google cloud sync.

**Architecture:** Add a small browser-only i18n runtime with separate UI-message and course-content catalogs. Keep the existing Uyghur text, ULY, audio paths, IDs, learning state, and course ordering as the source of truth; apply English text to the same course objects by stable IDs so switching language never creates a second progress tree.

**Tech Stack:** Static HTML/CSS/JavaScript, browser `navigator.languages`, localStorage, existing Supabase preference snapshots, Node.js built-in assertions and VM test harnesses, Vercel static deployment

## Global Constraints

- The current phase supports exactly `zh` and `en`; no third interface language is added.
- A `zh-*` system language defaults to Chinese; English and every other system language default to English.
- A manual choice always overrides system detection and is remembered.
- The compact language control is visible only in the Home top-right, on the same horizontal row as the logo and `早上好 / Good morning`; Profile repeats the full language setting, and course-page top bars do not repeat the compact control.
- English mode covers navigation, authentication, settings, instructions, feedback, letter explanations, word meanings, and sentence translations—not only buttons.
- Uyghur text, ULY transliteration, human recordings, audio paths, course IDs, course order, progress IDs, guest access, and Google login remain unchanged.
- All translations ship locally. Do not add Google Translate, a runtime translation API, a CDN dependency, or a network requirement for core learning.
- The China static mirror is outside this plan and must not be changed.
- Chinese and English interfaces remain LTR; only Uyghur content elements remain RTL.
- Do not add a standalone file export/import UI. Preserve language through the existing local snapshot, guest backup, and cloud preference snapshot.
- Never batch-delete files or directories. Any cleanup must name one exact file at a time.

---

## File Map

**Create**

- `prototype/i18n/runtime.js` — language detection, explicit-language normalization, message lookup, interpolation, and course-language application.
- `prototype/i18n/ui-messages.js` — complete `zh` and `en` interface dictionaries using identical stable keys.
- `prototype/i18n/alphabet-en.js` — English alphabet groups, letter explanations, form labels, and form-example explanations.
- `prototype/i18n/combo-en.js` — English combination group and item teaching text.
- `prototype/i18n/vocab-en.js` — English vocabulary group, section, meaning, and note text.
- `prototype/i18n/practice-en.js` — English practice group text and mode templates used to derive all 128 practice items.
- `prototype/i18n/reading-en.js` — English reading unit, group, item meaning, lesson, pattern, and speaker text.
- `prototype/i18n/course-en.js` — combines the five focused English catalogs into one validated `window.ANA_TILIM_COURSE_EN` object.
- `tests/i18n-runtime.test.mjs` — language resolution, fallback, interpolation, and preference-reading tests.
- `tests/i18n-course-content.test.mjs` — stable-ID, catalog coverage, language-switch, and no-Chinese-in-English-render tests.

**Modify**

- `prototype/index.html` — load local i18n files before `app.js` and refresh cache versions.
- `prototype/app.js` — resolve initial language, persist/sync explicit choice, use `t()`, apply course language, render switchers, and preserve current learning state during switching.
- `prototype/styles.css` — responsive language control and long-English-copy wrapping.
- `prototype/course-data/alphabet-data.js` — add stable semantic IDs to form and form-example records.
- `tests/unit-learning-experience.test.mjs` — app preference, switcher, guest/Google, persistence, and localized-render contracts.
- `tests/full-content-render.test.mjs` — render all 464 states in both languages and reject Chinese learner copy in English mode.
- `tests/course-data-integrity.test.mjs` — assert the new form and form-example IDs are unique and stable.
- `scripts/check-project.mjs` — syntax-check all i18n files and run both new i18n test files.
- `README.md` — document Chinese/English behavior and the local translation architecture.

---

### Task 1: Build the language runtime and paired UI dictionaries

**Files:**
- Create: `prototype/i18n/runtime.js`
- Create: `prototype/i18n/ui-messages.js`
- Create: `tests/i18n-runtime.test.mjs`

**Interfaces:**
- Consumes: `window.ANA_TILIM_UI_MESSAGES`, `navigator.languages`, and serialized `ana-tilim-progress` JSON.
- Produces: `window.ANA_TILIM_I18N` with `resolveLanguage(explicitLanguage, languages)`, `readSavedLanguage(serializedProgress)`, `setLanguage(language)`, `getLanguage()`, and `t(key, params)`.
- `resolveLanguage()` returns only `"zh"` or `"en"`; `readSavedLanguage()` returns `"zh"`, `"en"`, or `null`.

- [ ] **Step 1: Write the failing runtime contract**

Create `tests/i18n-runtime.test.mjs` with direct VM loading and these exact assertions:

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const context = { console, window: {} };
context.globalThis = context;
vm.createContext(context);

for (const path of ["prototype/i18n/ui-messages.js", "prototype/i18n/runtime.js"]) {
  vm.runInContext(fs.readFileSync(path, "utf8"), context, { filename: path });
}

const api = context.window.ANA_TILIM_I18N;
assert.equal(api.resolveLanguage(null, ["zh-CN", "en-NZ"]), "zh");
assert.equal(api.resolveLanguage(null, ["en-NZ", "zh-CN"]), "en");
assert.equal(api.resolveLanguage(null, ["zh-TW"]), "zh");
assert.equal(api.resolveLanguage(null, ["en-US"]), "en");
assert.equal(api.resolveLanguage(null, ["fr-FR"]), "en");
assert.equal(api.resolveLanguage(null, []), "en");
assert.equal(api.resolveLanguage("en", ["zh-CN"]), "en");
assert.equal(api.resolveLanguage("zh", ["en-US"]), "zh");
assert.equal(api.resolveLanguage("de", ["zh-CN"]), "zh");
assert.equal(api.readSavedLanguage('{"preferences":{"uiLanguage":"en"}}'), "en");
assert.equal(api.readSavedLanguage("damaged"), null);

api.setLanguage("en");
assert.equal(api.getLanguage(), "en");
assert.equal(api.t("nav.home"), "Home");
assert.equal(api.t("progress.count", { completed: 3, total: 10 }), "3 of 10 complete");
assert.equal(api.t("missing.key"), "");
api.setLanguage("zh");
assert.equal(api.t("nav.home"), "首页");
```

- [ ] **Step 2: Run the test and verify the files are missing**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/i18n-runtime.test.mjs
```

Expected: FAIL because the runtime and dictionaries do not exist.

- [ ] **Step 3: Implement the minimal runtime**

Use this public shape in `prototype/i18n/runtime.js`:

```js
(() => {
  const messages = window.ANA_TILIM_UI_MESSAGES || { zh: {}, en: {} };
  let currentLanguage = "en";

  function supported(value) {
    return value === "zh" || value === "en" ? value : null;
  }

  function resolveLanguage(explicitLanguage, languages = []) {
    const explicit = supported(explicitLanguage);
    if (explicit) return explicit;
    const list = Array.isArray(languages) ? languages : [languages];
    const primaryLanguage = String(list[0] || "").toLowerCase();
    return primaryLanguage.startsWith("zh") ? "zh" : "en";
  }

  function readSavedLanguage(serializedProgress) {
    try {
      return supported(JSON.parse(serializedProgress || "{}").preferences?.uiLanguage);
    } catch {
      return null;
    }
  }

  function t(key, params = {}) {
    const template = messages[currentLanguage]?.[key] ?? messages.en?.[key];
    if (typeof template !== "string") {
      console.warn(`Missing Ana Tilim translation: ${key}`);
      return "";
    }
    return Object.entries(params).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template
    );
  }

  window.ANA_TILIM_I18N = {
    resolveLanguage,
    readSavedLanguage,
    setLanguage(language) { currentLanguage = supported(language) || "en"; },
    getLanguage() { return currentLanguage; },
    t
  };
})();
```

Start `ui-messages.js` with identical key sets and the exact keys exercised by this test:

```js
window.ANA_TILIM_UI_MESSAGES = {
  zh: { "nav.home": "首页", "progress.count": "已完成 {completed} / {total}" },
  en: { "nav.home": "Home", "progress.count": "{completed} of {total} complete" }
};
```

- [ ] **Step 4: Verify runtime behavior and syntax**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check prototype/i18n/ui-messages.js
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check prototype/i18n/runtime.js
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/i18n-runtime.test.mjs
```

Expected: all three commands exit 0.

- [ ] **Step 5: Commit the runtime foundation**

```bash
git add prototype/i18n/runtime.js prototype/i18n/ui-messages.js tests/i18n-runtime.test.mjs
git commit -m "Add bilingual language runtime"
```

### Task 2: Resolve, persist, back up, and sync the explicit language choice

**Files:**
- Modify: `prototype/index.html`
- Modify: `prototype/app.js:1-8,325-340,390-735`
- Modify: `tests/unit-learning-experience.test.mjs:1-390,420-660`

**Interfaces:**
- Consumes: the Task 1 `ANA_TILIM_I18N` API and existing `preferences` snapshot.
- Produces: `preferences.uiLanguage: "zh" | "en" | null`, `state.interfaceLanguage: "zh" | "en"`, and `applyInterfaceLanguage(language, { explicit })`.
- `null` means the user has never manually selected a language; it must not be uploaded merely because system detection ran.

- [ ] **Step 1: Add failing preference and startup tests**

Load `ui-messages.js` and `runtime.js` before `app.js` in the VM harness. Add `document.documentElement = { lang: "" }` and `window.navigator = { languages: ["en-NZ"], language: "en-NZ" }`. Assert:

```js
assert.deepEqual(defaultPreferences, {
  audioAutoplay: false,
  dailyGoal: 10,
  learningReminder: false,
  showLatin: true,
  uiLanguage: null
});
assert.equal(vm.runInContext("state.interfaceLanguage", context), "en");
assert.equal(context.document.documentElement.lang, "en");

assert.equal(
  vm.runInContext('normalizePreferences({ uiLanguage: "zh" }).uiLanguage', context),
  "zh"
);
assert.equal(
  vm.runInContext('normalizePreferences({ uiLanguage: "fr" }).uiLanguage', context),
  null
);
```

Seed `ana-tilim-progress` with `preferences.uiLanguage = "zh"` before app load and assert that it overrides `en-NZ`. Also assert `buildCloudSnapshot().preferences.uiLanguage`, the guest-backup snapshot, and `applyCloudSnapshot()` all retain `"zh"`.

- [ ] **Step 2: Run the focused app test and verify failure**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: FAIL because `uiLanguage` and `state.interfaceLanguage` do not exist.

- [ ] **Step 3: Add language bootstrap and preference normalization**

Before app state is created, read the serialized progress once and resolve the effective language:

```js
const i18n = window.ANA_TILIM_I18N;
const serializedProgress = window.localStorage?.getItem("ana-tilim-progress") || "";
const savedLanguage = i18n.readSavedLanguage(serializedProgress);
const systemLanguages = window.navigator?.languages || [window.navigator?.language].filter(Boolean);
const initialInterfaceLanguage = i18n.resolveLanguage(savedLanguage, systemLanguages);
i18n.setLanguage(initialInterfaceLanguage);
```

Extend preferences exactly as follows:

```js
const DEFAULT_PREFERENCES = Object.freeze({
  audioAutoplay: false,
  dailyGoal: 10,
  learningReminder: false,
  showLatin: true,
  uiLanguage: null
});

uiLanguage: source.uiLanguage === "zh" || source.uiLanguage === "en" ? source.uiLanguage : null
```

Add `interfaceLanguage: initialInterfaceLanguage` to `state`. Updating this effective value must update the i18n runtime and `<html lang>`, while only a manual action writes `preferences.uiLanguage` and marks preferences dirty.

Load the Task 1 scripts in `prototype/index.html` after `course-data.js` and before `app.js` so the application can resolve language before its first render:

```html
<script src="./i18n/ui-messages.js?v=20260809-bilingual"></script>
<script src="./i18n/runtime.js?v=20260809-bilingual"></script>
```

Add both URLs to the exact `expectedVersionedAssets` list in `tests/unit-learning-experience.test.mjs` in the same order.

- [ ] **Step 4: Verify local, guest-backup, and cloud preference behavior**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check prototype/app.js
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/cloud-sync.test.mjs
```

Expected: all commands exit 0; existing cloud merge behavior remains unchanged because `preferences` is already timestamp-merged as one object.

- [ ] **Step 5: Commit preference lifecycle support**

```bash
git add prototype/index.html prototype/app.js tests/unit-learning-experience.test.mjs
git commit -m "Persist bilingual learning preference"
```

### Task 3: Localize global UI and add desktop/mobile language controls

**Files:**
- Modify: `prototype/i18n/ui-messages.js`
- Modify: `prototype/app.js:1912-2510,4475-4797,5440-5510`
- Modify: `prototype/styles.css:84-180,2298-2555,2670-2790`
- Modify: `tests/unit-learning-experience.test.mjs`

**Interfaces:**
- Consumes: `i18n.t()`, `state.interfaceLanguage`, and `setPreference()`.
- Produces: `languageSwitcher(compact): string`, `data-action="set-language"`, and `data-language="zh|en"`.
- Switching languages must rerender the current `state.screen` without changing any selected course/item IDs or answer fields.

- [ ] **Step 1: Add failing global-surface and state-preservation tests**

Add a helper:

```js
function setLanguage(language) {
  vm.runInContext(`applyInterfaceLanguage(${JSON.stringify(language)}, { explicit: true }); render();`, context);
}
```

Assert the English welcome, home, bottom navigation, profile, guest panel, and Google action contain:

```js
[
  "Continue as guest",
  "Home",
  "Alphabet",
  "Learn",
  "Profile",
  "Local guest mode",
  "Continue with Google",
  "Learning preferences",
  "Chinese",
  "English"
]
```

Before switching, set `state.screen`, `selectedUnitId`, `selectedGroupId`, `currentLetterId`, `selectedPicture`, and `keyboardValue`; after switching, assert every value is unchanged. Assert that the compact control has `aria-label="Language"`, two buttons, and one `aria-pressed="true"`. The compact control must render on Home in the same horizontal row as the logo and `早上好 / Good morning`, and it must not repeat on course-page top bars.

- [ ] **Step 2: Run the focused test and verify English surfaces are absent**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: FAIL on the first missing English surface.

- [ ] **Step 3: Complete the paired UI dictionary and replace global literals**

Use semantic keys grouped by responsibility, including these exact groups:

```js
"nav.home", "nav.alphabet", "nav.learn", "nav.profile",
"language.label", "language.chinese", "language.english",
"welcome.title", "welcome.subtitle", "welcome.continueGuest",
"auth.guestTitle", "auth.guestDetail", "auth.google", "auth.signOut",
"home.continue", "home.today", "home.progress",
"settings.title", "settings.learning", "settings.audio", "settings.account",
"settings.reminder", "settings.showLatin", "settings.autoplay",
"common.back", "common.previous", "common.next", "common.cancel", "common.confirm",
"audio.play", "audio.playing", "audio.unavailable", "audio.humanRecording",
"error.storage", "error.cloud", "error.avatar", "progress.count"
```

Move every learner-visible literal used by welcome, `topBar()`, `bottomNav()`, home, learning path, profile, settings, authentication, audio errors, storage errors, and toasts into the paired dictionaries. Keep internal IDs and data actions in English code identifiers; do not translate them.

- [ ] **Step 4: Render and handle the language controls**

Use one reusable renderer:

```js
function languageSwitcher(compact = false) {
  return `
    <div class="language-switcher ${compact ? "is-compact" : ""}" role="group" aria-label="${t("language.label")}">
      ${["zh", "en"].map((language) => `
        <button type="button" data-action="set-language" data-language="${language}"
          aria-pressed="${state.interfaceLanguage === language}">
          ${language === "zh" ? "中文" : "EN"}
        </button>`).join("")}
    </div>`;
}
```

Put the compact control only in the Home top-right, in the same horizontal row as the logo and `早上好 / Good morning`. Keep the full `中文 / English` setting in Profile and do not repeat the compact control on course-page `topBar()` rows. In the click handler, validate `button.dataset.language`, call `applyInterfaceLanguage(language, { explicit: true })`, save preferences, render, and show the toast in the newly selected language.

- [ ] **Step 5: Add responsive styles and verify global UI**

The control must use intrinsic width, 44px minimum touch height in Profile, visible keyboard focus, and no flag icons. At `max-width: 719px`, use compact labels and allow `.brand-lockup` to shrink with `min-width: 0`; long English headings and buttons must use `overflow-wrap: anywhere` without reducing body copy below the current readable minimum.

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
git diff --check
```

Expected: PASS and no whitespace errors.

- [ ] **Step 6: Commit the bilingual application shell**

```bash
git add prototype/i18n/ui-messages.js prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs
git commit -m "Add bilingual interface controls"
```

### Task 4: Add stable alphabet IDs and complete English alphabet learning

**Files:**
- Create: `prototype/i18n/alphabet-en.js`
- Create: `prototype/i18n/course-en.js`
- Create: `tests/i18n-course-content.test.mjs`
- Modify: `prototype/index.html`
- Modify: `prototype/i18n/runtime.js`
- Modify: `prototype/course-data/alphabet-data.js:1040-1180`
- Modify: `prototype/app.js:2281-3090`
- Modify: `tests/course-data-integrity.test.mjs`

**Interfaces:**
- Consumes: the existing 32 letter IDs and 11 alphabet group IDs.
- Produces: semantic form IDs `isolated`, `simple-isolated`, `right-joined`, `simple-right-joined`, `dual-joined`, `hamza-dual-joined`, `left-joined`, and `hamza-left-joined`; form-example IDs `${letterId}:${formId}`; `i18n.createCourseLocalizer(courseData, englishCatalog)`, which returns `{ apply(language), missingEnglish() }`.
- The English alphabet catalog covers 32 letter details, 11 groups, 126 active forms, and 126 active form examples.

- [ ] **Step 1: Add failing stable-ID and alphabet-coverage tests**

Assert that every form has an `id`, every form example has an `id`, IDs are unique within a letter, and each English entry covers these fields when present:

```js
const detailFields = ["type", "cue", "connection", "soundHint", "writingHint", "example"];
const formFields = ["label"];
const exampleFields = ["label", "meaning", "noteTitle", "note"];

assert.equal(Object.keys(english.alphabet.letterDetails).length, 32);
assert.equal(Object.keys(english.alphabet.groups).length, 11);
assert.equal(translatedFormCount, 126);
assert.equal(translatedFormExampleCount, 126);
```

Apply English and assert representative exact translations:

```js
assert.equal(course.letterDetails.be.type, "Consonant");
assert.equal(course.letterDetails.be.cue, "One dot below");
assert.equal(course.letterDetails.pe.cue, "Three dots below");
assert.equal(course.letterDetails.te.cue, "Two dots above");
assert.equal(course.letterDetails.be.forms[0].label, "Isolated form");
```

Apply Chinese again and assert the original Chinese strings return exactly.

- [ ] **Step 2: Run alphabet integrity tests and verify failure**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/course-data-integrity.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/i18n-course-content.test.mjs
```

Expected: both fail because stable form IDs and the English catalog do not exist.

- [ ] **Step 3: Add stable IDs without changing course order or glyphs**

Map the existing semantic form definitions to the eight exact IDs above. When creating `letter.forms` and `letterFormExamples`, copy the same `form.id` into the matching form example. Preserve all current `value`, `word`, `latin`, `targetStart`, `targetLength`, and audio lookup behavior.

- [ ] **Step 4: Create the complete alphabet English catalog**

Key every record by existing letter/group ID and the new form/form-example ID. Use concise learner English, not word-for-word machine phrasing. Preserve ULY spellings and Uyghur glyphs. Required terminology is:

```js
{
  vowel: "Vowel",
  consonant: "Consonant",
  isolated: "Isolated form",
  simpleIsolated: "Simple isolated form",
  rightJoined: "Right-joined form",
  dualJoined: "Dual-joined form",
  leftJoined: "Left-joined form"
}
```

Translate every group title/goal/status, every detail field, every active form label, and every form-example meaning/rule. Do not translate `letter`, `latin`, `value`, `word`, filenames, or target indexes.

- [ ] **Step 5: Apply and restore course text in place**

`course-en.js` combines focused catalogs. `runtime.js` must capture the original Chinese translatable fields once, then mutate only approved text fields on `apply("en")` and restore the captured values on `apply("zh")`. It must never replace arrays or objects holding progress/audio references.

In `app.js`, use `let formExampleItems = buildFormExampleItems()` and rebuild that derived text list after every language switch. Replace alphabet-page interface literals with UI keys, but continue reading course explanations from the localized course objects.

Load `alphabet-en.js` and `course-en.js` after the base course data and before `runtime.js`; update the expected resource list in the learning-experience test in the same change. `course-en.js` must accept the remaining focused catalogs as empty objects until their tasks add them.

- [ ] **Step 6: Verify alphabet learning in both languages**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/course-data-integrity.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/i18n-course-content.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: all commands exit 0; English alphabet screens contain no CJK characters, and returning to Chinese restores the original text.

- [ ] **Step 7: Commit alphabet localization**

```bash
git add prototype/index.html prototype/course-data/alphabet-data.js prototype/i18n/alphabet-en.js prototype/i18n/course-en.js prototype/i18n/runtime.js prototype/app.js tests/course-data-integrity.test.mjs tests/i18n-course-content.test.mjs tests/unit-learning-experience.test.mjs
git commit -m "Add complete English alphabet learning"
```

### Task 5: Complete English combination learning

**Files:**
- Create: `prototype/i18n/combo-en.js`
- Modify: `prototype/index.html`
- Modify: `prototype/i18n/course-en.js`
- Modify: `prototype/app.js:3093-3610`
- Modify: `tests/i18n-course-content.test.mjs`
- Modify: `tests/unit-learning-experience.test.mjs`

**Interfaces:**
- Consumes: 4 existing combination group IDs and 34 existing item IDs.
- Produces: `english.combos.groups[groupId]` and `english.combos.items[itemId]` with complete localized teaching fields.

- [ ] **Step 1: Add failing combination coverage and render tests**

Require exactly 4 groups and 34 items. Each group must provide `title`, `goal`, and `status`; each item must provide `type`, `rule`, `hint`, `review`, and `meaning` when the Chinese source has a meaning. Assert:

```js
assert.equal(english.combos.groups["open-a"].title, "Open-vowel combinations: ا");
assert.equal(english.combos.items.ba.type, "Two-letter combination");
assert.equal(english.combos.items["dada-connection"].meaning, "Dad; a family form of address");
```

Render the combination lesson, recognition, building, writing, keyboard, and completion screens in English and reject CJK learner copy.

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/i18n-course-content.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: FAIL because the combination catalog and English render strings are missing.

- [ ] **Step 3: Add all 4 group and 34 item translations**

Translate only teaching text. Keep `id`, `value`, `latin`, `parts`, and `prompt` unchanged because these are the Uyghur/ULY learning targets. Use consistent connection terms: `connects to the following letter`, `does not connect forward`, `initial form`, `medial form`, and `final form`.

Load `combo-en.js` immediately after `alphabet-en.js` and before `course-en.js`, and add that exact URL to the expected resource list.

- [ ] **Step 4: Localize all combination renderers and verify**

Move combination-specific headings, instructions, choice prompts, keyboard actions, completion feedback, and next-step actions into `ui-messages.js`. Register `combo-en.js` in `course-en.js`, then run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/i18n-course-content.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: PASS for every combination assertion in both languages.

- [ ] **Step 5: Commit combination localization**

```bash
git add prototype/index.html prototype/i18n/combo-en.js prototype/i18n/course-en.js prototype/i18n/ui-messages.js prototype/app.js tests/i18n-course-content.test.mjs tests/unit-learning-experience.test.mjs
git commit -m "Add English combination lessons"
```

### Task 6: Complete English vocabulary learning

**Files:**
- Create: `prototype/i18n/vocab-en.js`
- Modify: `prototype/index.html`
- Modify: `prototype/i18n/course-en.js`
- Modify: `prototype/app.js:3611-3897`
- Modify: `tests/i18n-course-content.test.mjs`
- Modify: `tests/unit-learning-experience.test.mjs`

**Interfaces:**
- Consumes: 12 vocabulary group IDs, 28 section IDs, and 209 item IDs.
- Produces: English `title`, `goal`, `status`, section `title`, item `meaning`, and optional item `note` mapped by stable IDs.

- [ ] **Step 1: Add failing vocabulary coverage tests**

Require exact counts `12`, `28`, and `209`. Assert representative learner translations:

```js
assert.equal(english.vocab.groups.greetings.title, "Greetings");
assert.equal(english.vocab.items.yaxshimusiz.meaning, "Hello; how are you?");
assert.equal(english.vocab.items.men.meaning, "I; me");
assert.equal(english.vocab.items["ana-family"].meaning, "Mother; mum");
assert.equal(english.vocab.items.one.meaning, "One");
```

Every non-empty Chinese `note` requires a non-empty English `note`. Render vocabulary lesson, recognition, keyboard, and completion screens in English and reject CJK learner copy.

- [ ] **Step 2: Run tests and verify the missing catalog failure**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/i18n-course-content.test.mjs
```

Expected: FAIL on the missing vocabulary domain.

- [ ] **Step 3: Add the complete 209-item English vocabulary catalog**

Translate meanings as concise learner glosses, retaining multiple senses when the Chinese source distinguishes them. Do not alter Uyghur spelling or ULY. Key duplicate surface forms by their existing distinct IDs, including `ten-tens`, `yuz-body`, `may-food`, and `beliq-food`, so each meaning remains context-specific.

Load `vocab-en.js` after `combo-en.js` and before `course-en.js`, and update the expected resource list.

- [ ] **Step 4: Localize vocabulary UI and verify both languages**

Move vocabulary-specific prompts, current-item labels, recognition instructions, keyboard actions, result feedback, and next-step copy into the paired UI dictionary. Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/i18n-course-content.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: PASS; English mode renders English meanings for every vocabulary item while Chinese mode remains byte-for-byte equivalent for source meanings.

- [ ] **Step 5: Commit vocabulary localization**

```bash
git add prototype/index.html prototype/i18n/vocab-en.js prototype/i18n/course-en.js prototype/i18n/ui-messages.js prototype/app.js tests/i18n-course-content.test.mjs tests/unit-learning-experience.test.mjs
git commit -m "Add English vocabulary learning"
```

### Task 7: Complete English practice modes without duplicating 128 generated items

**Files:**
- Create: `prototype/i18n/practice-en.js`
- Modify: `prototype/index.html`
- Modify: `prototype/i18n/course-en.js`
- Modify: `prototype/i18n/runtime.js`
- Modify: `prototype/app.js:3978-4414`
- Modify: `tests/i18n-course-content.test.mjs`
- Modify: `tests/unit-learning-experience.test.mjs`

**Interfaces:**
- Consumes: 5 practice group IDs, four modes (`listen`, `repeat`, `write`, `keyboard`), 32 `letterId` values per learning mode, and the localized alphabet details.
- Produces: 5 translated group records and deterministic English `type`, `label`, `hint`, and `audioStatus` for all 128 generated learning items.

- [ ] **Step 1: Add failing practice derivation and render tests**

Require 5 groups and 128 non-review items after English application. Assert:

```js
assert.equal(english.practice.groups["listening-loop"].title, "Sound recognition");
assert.equal(english.practice.groups["repeat-loop"].title, "Repeat aloud");
assert.equal(english.practice.groups["writing-loop"].title, "Writing");
assert.equal(english.practice.groups["keyboard-loop"].title, "Keyboard");
assert.equal(localizedListeningBe.label, "Listening letter");
assert.match(localizedWritingBe.hint, /dot below/i);
```

Render listen, repeat, write, keyboard, review, and completion states in English. Assert the point-identification mode shows only answer letters and no answer-revealing hint text, preserving the previously requested behavior.

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/i18n-course-content.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: FAIL because practice text is still Chinese.

- [ ] **Step 3: Add group translations and four exact item templates**

Use one catalog record per group plus these semantic template keys instead of 128 copied records:

```js
{
  listen: { type: "Letter", label: "Listening letter" },
  repeat: { type: "Letter", label: "Letter to repeat" },
  write: { type: "Letter", label: "Letter to write" },
  keyboard: { type: "Letter", label: "Keyboard letter" }
}
```

Derive `hint` from the localized letter `soundHint`, `cue`, or `writingHint` according to mode. For keyboard mode use `Type {letter} only. First learn its keyboard position, then move on to combinations.` Keep IDs, target letters, audio files, scoring, and progress keys unchanged.

Load `practice-en.js` after `vocab-en.js` and before `course-en.js`, and update the expected resource list.

- [ ] **Step 4: Localize practice UI and verify**

Move all practice-mode instructions, progress counters, play/repeat actions, canvas controls, keyboard controls, correctness feedback, completion text, and next-step actions into `ui-messages.js`. Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/i18n-course-content.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: PASS with all 128 items derived and no duplicated translation records.

- [ ] **Step 5: Commit practice localization**

```bash
git add prototype/index.html prototype/i18n/practice-en.js prototype/i18n/course-en.js prototype/i18n/runtime.js prototype/i18n/ui-messages.js prototype/app.js tests/i18n-course-content.test.mjs tests/unit-learning-experience.test.mjs
git commit -m "Add English practice modes"
```

### Task 8: Complete English reading content and enforce full-site coverage

**Files:**
- Create: `prototype/i18n/reading-en.js`
- Modify: `prototype/index.html`
- Modify: `prototype/i18n/course-en.js`
- Modify: `prototype/app.js:3898-3977`
- Modify: `tests/i18n-course-content.test.mjs`
- Modify: `tests/full-content-render.test.mjs`
- Modify: `tests/unit-learning-experience.test.mjs`

**Interfaces:**
- Consumes: 6 reading unit IDs, 46 group IDs, and 164 item IDs.
- Produces: full English reading unit/group/item text and a two-language 928-state render audit.

- [ ] **Step 1: Add failing reading coverage and full-render tests**

Require exact counts `6`, `46`, and `164`. For each source field among `title`, `subtitle`, `pattern`, `speaker`, `meaning`, and `lesson`, require a non-empty English value when the source is non-empty. Assert representative text:

```js
assert.equal(english.reading.units["grammar-basics"].title, "Unit 4: Grammar basics");
assert.equal(english.reading.groups["grammar-word-order"].title, "Subject + object + verb");
assert.equal(english.reading.items["grammar-word-order-1"].meaning, "I read a book.");
```

Update the render audit to run the current 464-state traversal once with `zh` and once with `en`, for 928 total renders. The language selector intentionally shows the language self-name `中文`, so remove only that exact button text before checking the rest of the learner UI:

```js
assert.doesNotMatch(
  app.innerHTML.replaceAll(">中文<", "><"),
  /[\u3400-\u9fff]/u,
  `${label} should not expose Chinese learner copy in English mode`
);
```

- [ ] **Step 2: Run coverage and render tests and verify failure**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/i18n-course-content.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/full-content-render.test.mjs
```

Expected: FAIL on missing reading translations and remaining Chinese UI strings.

- [ ] **Step 3: Add all reading translations by stable ID**

Translate teaching meaning, grammar explanation, title, subtitle, pattern, and speaker labels while preserving the original Uyghur `value`, ULY, IDs, and audio mappings. Use natural international English and retain neutral `he/she` wording wherever the source explains that Uyghur third person is not gendered.

Load `reading-en.js` after `practice-en.js` and before `course-en.js`, and update the expected resource list.

- [ ] **Step 4: Remove every remaining learner-visible Chinese literal from English renders**

Move the remaining reading, completion, next-unit, lesson-progress, error, audio, canvas, and fallback copy into `ui-messages.js`. Internal Chinese comparison values used only for source-data logic may remain in code, but no CJK text may appear in `app.innerHTML` during the English 464-state audit.

- [ ] **Step 5: Run complete bilingual rendering and focused regression tests**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/i18n-course-content.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/full-content-render.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: all commands exit 0 and the full-content test reports 928 rendered states.

- [ ] **Step 6: Commit reading and coverage enforcement**

```bash
git add prototype/index.html prototype/i18n/reading-en.js prototype/i18n/course-en.js prototype/i18n/ui-messages.js prototype/app.js tests/i18n-course-content.test.mjs tests/full-content-render.test.mjs tests/unit-learning-experience.test.mjs
git commit -m "Complete English course coverage"
```

### Task 9: Integrate static assets, document behavior, and run the complete suite

**Files:**
- Modify: `prototype/index.html`
- Modify: `scripts/check-project.mjs`
- Modify: `README.md`
- Verify: every file listed in the File Map

**Interfaces:**
- Consumes: all green i18n tasks.
- Produces: cache-busted static script order, one-command validation, and user-facing bilingual documentation.

- [ ] **Step 1: Add failing script-order and project-check assertions**

Update the resource list in `tests/unit-learning-experience.test.mjs` to require this order after `course-data.js` and before `audio-controller.js`:

```text
./i18n/ui-messages.js?v=20260809-bilingual
./i18n/alphabet-en.js?v=20260809-bilingual
./i18n/combo-en.js?v=20260809-bilingual
./i18n/vocab-en.js?v=20260809-bilingual
./i18n/practice-en.js?v=20260809-bilingual
./i18n/reading-en.js?v=20260809-bilingual
./i18n/course-en.js?v=20260809-bilingual
./i18n/runtime.js?v=20260809-bilingual
```

Require `styles.css?v=20260809-bilingual` and `app.js?v=20260809-bilingual`. Run the learning-experience test and confirm it fails against old asset URLs.

- [ ] **Step 2: Update HTML and one-command project checks**

Add the exact local script tags in the required order. Extend `scripts/check-project.mjs` with syntax entries for all eight i18n scripts and test entries for:

```js
{ label: "test: i18n runtime", command: node, args: ["tests/i18n-runtime.test.mjs"] },
{ label: "test: bilingual course content", command: node, args: ["tests/i18n-course-content.test.mjs"] }
```

Do not change or remove the Supabase script in the international build.

- [ ] **Step 3: Document the exact language behavior**

Add a README section stating:

- Chinese systems initially use Chinese.
- Every non-Chinese system initially uses English.
- The header and Profile provide a manual switch.
- A manual choice is saved locally and syncs for Google users as a preference.
- Uyghur content and audio are shared by both modes.
- All learning translations are local; no live translation service is used.
- Other interface languages remain future work.

- [ ] **Step 4: Run syntax, focused, and full project checks**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check prototype/app.js
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/i18n-runtime.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/i18n-course-content.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/full-content-render.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs
git diff --check
```

Expected: all commands exit 0 and `scripts/check-project.mjs` ends with `All project checks passed.`

- [ ] **Step 5: Commit static integration and documentation**

```bash
git add prototype/index.html scripts/check-project.mjs README.md tests/unit-learning-experience.test.mjs
git commit -m "Integrate bilingual international build"
```

### Task 10: Browser QA, GitHub publication, and Vercel production verification

**Files:**
- Verify only: `prototype/`
- Do not stage: `prototype/.env.local`, `prototype/.gitignore`, `prototype/.vercel/project.json`, `prototype/.vercel/README.txt`

**Interfaces:**
- Consumes: a clean, green feature branch.
- Produces: a merged GitHub PR and a verified production deployment at `https://ana-tilim.vercel.app`.

- [ ] **Step 1: Run local desktop and mobile browser QA**

Serve `prototype/` over HTTP and test at desktop and 390 × 844 mobile sizes. Verify:

1. `zh-CN` fresh storage opens Chinese; `en-NZ` fresh storage opens English.
2. `fr-FR` fresh storage falls back to English.
3. Header switcher and Profile switcher agree and persist after reload.
4. Switching on an in-progress exercise preserves the current screen, selected item, typed answer, and progress.
5. Guest mode and Google login are the only signed-out account paths.
6. Home, 32 letters, human audio, repeat, handwriting, keyboard, listening, dictation, vocabulary, combinations, and reading work in both languages.
7. English mode contains no visible Chinese explanation or internal translation key.
8. Mobile has no horizontal overflow: `document.documentElement.scrollWidth === window.innerWidth`.
9. No relevant console error occurs; a blocked Google popup is not treated as a core-learning failure.

Capture desktop and mobile screenshots outside the repository.

- [ ] **Step 2: Verify the exact publication scope**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs
git status --short --branch
git log --oneline origin/main..HEAD
```

Expected: green suite, clean worktree, and only the bilingual design/plan/implementation commits ahead of `origin/main`.

- [ ] **Step 3: Push, open a PR, and merge only after checks pass**

Push the bilingual feature branch, create a non-draft PR titled `Add Chinese and English learning modes`, include the system-detection rule, manual override, local catalogs, course coverage counts, and test results, then merge to `main` after GitHub checks are green. Preserve GitHub About metadata and the public repository setting.

- [ ] **Step 4: Deploy only `prototype/` to the existing Vercel project**

Link the existing `ana-tilim` project and deploy `prototype/` to production using the already authenticated Vercel CLI. Confirm the deployment reaches `READY` and the production alias remains `https://ana-tilim.vercel.app`.

- [ ] **Step 5: Verify production behavior independently**

Load production with a cache-busting query at desktop and mobile sizes. Repeat language detection, manual persistence, guest/Google UI, one alphabet lesson, one vocabulary lesson, one listening exercise, and one reading lesson. Confirm the deployed HTML serves the `20260809-bilingual` local assets and that no English learning screen depends on a translation API.

- [ ] **Step 6: Clean only exact generated files and report evidence**

If Vercel creates local files, remove only each exact generated file individually; never recursively delete `.vercel`. Re-run `git status --short --branch`. Report the PR URL, merge commit, Vercel deployment ID, production URL, automated test results, desktop/mobile QA, and any function that still requires Supabase or Google connectivity.
