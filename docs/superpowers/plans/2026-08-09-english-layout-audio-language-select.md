# English Layout, Audio Icon, and Language Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every English learning screen readable on desktop and mobile, replace shared text play controls with an accessible speaker icon, and replace the Profile segmented language control with a future-ready right-aligned dropdown.

**Architecture:** Keep the existing local-first bilingual runtime and large static `app.js` structure. Change only the shared audio renderer, the Profile-only language renderer/change path, and targeted language-aware CSS; keep the Home compact switcher and all course data untouched. Protect the release with focused VM assertions, the existing 928-state render audit, desktop/mobile Browser QA, exact cache-version tests, and a production-only `prototype/` deployment.

**Tech Stack:** Static HTML/CSS/JavaScript, inline SVG, Node.js `node:test`-style assertion scripts, Codex Browser QA, GitHub PR, Vercel static deployment.

## Global Constraints

- Work only in `/Users/nigarayaskar/本地项目/03_学习与桌面宠物/Ana Tilim/.worktrees/english-layout-audio-language-select`; the primary checkout contains unrelated user changes.
- Do not add an icon library, web font, translation API, or network dependency.
- Do not change Uyghur glyph sizes, Arabic-script direction, ULY values, audio files, course data, lesson progress, authentication, or cloud-sync behavior.
- Keep the Home compact Chinese/English selector unchanged and confined to Home.
- The Profile language control is a native select with stable values `zh` and `en`, left label, and right control at desktop and 390 x 844 mobile.
- Shared audio buttons show only an inline speaker SVG; keep a roughly 42 x 42 pixel touch target, an approximately 18-pixel glyph, localized accessible name, and current disabled behavior.
- Meaningful English copy must not be ellipsized or clipped; containers may grow, and font reductions must be targeted rather than a global scale transform.
- Mobile acceptance: `document.documentElement.scrollWidth === window.innerWidth` at 390 x 844.
- Deploy only `prototype/`; preserve GitHub Public visibility and About metadata.
- Never use recursive or batch deletion. Remove only one exact generated file at a time.

---

### Task 1: Replace shared text play controls with a speaker icon

**Files:**
- Modify: `tests/unit-learning-experience.test.mjs:1095-1130`
- Modify: `prototype/app.js:1858-1873`
- Modify: `prototype/styles.css:2069-2085`

**Interfaces:**
- Consumes: existing `renderAudioButton({ audio, label, className })`, `t("audio.play")`, `data-action="play-audio"`, and `.play-dot` states.
- Produces: `speakerIcon(): string` and shared audio buttons whose visible child is `<svg class="speaker-icon">` while the existing localized `aria-label` and data attributes remain intact.

- [ ] **Step 1: Write the failing reusable-audio test**

Replace the old visible-text expectation with exact structural and accessibility assertions:

```js
includesAll(
  englishAudioChrome,
  [
    'aria-label="Play ب"',
    'class="speaker-icon"',
    'aria-hidden="true"',
    'data-action="play-audio"'
  ],
  "English reusable audio chrome"
);
assert.ok(!englishAudioChrome.includes(">Play</button>"));
setLanguage("zh");
const chineseSpeakerButton = vm.runInContext(
  `renderAudioButton({ audio: { playable: true, outputPath: "./test.webm" }, label: "ب" })`,
  context
);
assert.ok(chineseSpeakerButton.includes('aria-label="播放 ب"'));
assert.ok(!chineseSpeakerButton.includes(">播放</button>"));
setLanguage("en");
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: FAIL because `renderAudioButton()` still renders the visible word `Play` and has no `.speaker-icon` SVG.

- [ ] **Step 3: Implement the local speaker SVG**

Add a focused renderer near `renderAudioButton()` and use it as the only visible child:

```js
function speakerIcon() {
  return `
    <svg class="speaker-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 9v6h4l5 4V5L8 9H4"></path>
      <path d="M16 9.5a4 4 0 0 1 0 5"></path>
      <path d="M18.5 7a7 7 0 0 1 0 10"></path>
    </svg>
  `;
}

function renderAudioButton({ audio, label, className = "" }) {
  const canPlay = isAudioPlayable(audio);
  const classes = ["play-dot", className, canPlay ? "" : "disabled"].filter(Boolean).join(" ");
  return `
    <button class="${classes}" data-action="play-audio"
      data-audio-src="${canPlay ? audio.outputPath : ""}" data-audio-label="${label}"
      type="button" ${canPlay ? "" : "disabled"} aria-label="${t("audio.play")} ${label}">
      ${speakerIcon()}
    </button>`;
}
```

Add the local visual rule without shrinking the touch target:

```css
.play-dot .speaker-icon {
  width: 18px;
  height: 18px;
  fill: currentColor;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
```

- [ ] **Step 4: Run focused checks and verify GREEN**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check prototype/app.js
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
git diff --check
```

Expected: syntax exit 0, `unit learning experience checks passed`, and no whitespace errors.

- [ ] **Step 5: Commit the independently working audio control**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs
git commit -m "Replace play text with speaker icon"
```

---

### Task 2: Replace the Profile language buttons with a native dropdown

**Files:**
- Modify: `tests/unit-learning-experience.test.mjs:383-410,1015-1095`
- Modify: `prototype/app.js:2210-2220,4860-4870,5050-5065,5685-5725`
- Modify: `prototype/styles.css:98-150`

**Interfaces:**
- Consumes: existing `applyInterfaceLanguage(language, { explicit: true })`, `render()`, `showToast()`, `state.interfaceLanguage`, and Home `languageSwitcher(true)`.
- Produces: `profileLanguageSelect(): string`, `<select data-action="set-language-select">`, and a `change` branch that uses the same existing language-preference path.

- [ ] **Step 1: Extend the VM event harness and write failing Profile assertions**

Capture both registered document handlers and add a select-change helper:

```js
let clickHandler = null;
let changeHandler = null;
// in document.addEventListener:
if (eventName === "click") clickHandler = handler;
if (eventName === "change") changeHandler = handler;

function changeLanguageSelect(value) {
  assert.ok(changeHandler, "change handler should be registered");
  changeHandler({
    target: {
      value,
      dataset: { action: "set-language-select" }
    }
  });
}
```

Replace the Profile segmented-control expectations:

```js
const englishProfileHtml = renderState("state.screen = 'profile'");
includesAll(
  englishProfileHtml,
  [
    'class="profile-setting-block language-setting"',
    'id="profile-language-select"',
    'data-action="set-language-select"',
    '<option value="zh">Chinese</option>',
    '<option value="en" selected>English</option>'
  ],
  "English Profile language select"
);
assert.ok(!englishProfileHtml.includes('class="language-switcher "'));
assert.ok(englishHomeHtml.includes('class="language-switcher is-compact"'));
```

Add live state/persistence and invalid-value checks:

```js
vm.runInContext("state.screen = 'profile'; render();", context);
changeLanguageSelect("zh");
assert.equal(vm.runInContext("state.interfaceLanguage", context), "zh");
assert.equal(savedProgress().preferences.uiLanguage, "zh");
assert.equal(vm.runInContext("state.screen", context), "profile");
assert.ok(app.innerHTML.includes('<option value="zh" selected>'));
changeLanguageSelect("fr");
assert.equal(vm.runInContext("state.interfaceLanguage", context), "zh");
```

- [ ] **Step 2: Run the focused test and verify RED**

Run the bundled Node unit command. Expected: FAIL because Profile still renders two buttons and the change handler ignores language selects.

- [ ] **Step 3: Implement the Profile-only select**

Keep `languageSwitcher(true)` unchanged for Home and add:

```js
function profileLanguageSelect() {
  return `
    <select id="profile-language-select" class="language-select"
      data-action="set-language-select" aria-label="${t("language.label")}">
      ${["zh", "en"].map((language) => `
        <option value="${language}" ${state.interfaceLanguage === language ? "selected" : ""}>
          ${t(language === "zh" ? "language.chinese" : "language.english")}
        </option>`).join("")}
    </select>`;
}
```

Render a semantic left label/right control row:

```html
<div class="profile-setting-block language-setting">
  <label for="profile-language-select"><strong>${t("language.label")}</strong></label>
  ${profileLanguageSelect()}
</div>
```

At the start of the existing document `change` handler, before avatar handling, add:

```js
if (input?.dataset?.action === "set-language-select") {
  const language = input.value;
  if (language !== "zh" && language !== "en") return;
  applyInterfaceLanguage(language, { explicit: true });
  render();
  showToast(t("language.changed"));
  return;
}
```

Style the horizontal row and native select:

```css
.language-setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.language-setting label { min-width: 0; }

.language-select {
  flex: 0 0 auto;
  min-width: 150px;
  min-height: 44px;
  padding: 8px 34px 8px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--ink);
  background: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
}

.language-select:focus-visible {
  outline: 3px solid rgba(14, 155, 177, 0.45);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Verify change behavior and state preservation**

Run the focused test. Extend the existing full mutable-state snapshot test to invoke `changeLanguageSelect("en")` from Profile after populating state, and assert the snapshot before/after is identical except `interfaceLanguage` and the saved preference. Expected: pass, handwriting stroke operations still redraw, and the Profile remains the active screen.

- [ ] **Step 5: Commit the Profile language control**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs
git commit -m "Use a Profile language dropdown"
```

---

### Task 3: Make English text complete and responsive

**Files:**
- Modify: `tests/unit-learning-experience.test.mjs:130-230,1045-1080`
- Modify: `prototype/styles.css:180-270,2720-2785`

**Interfaces:**
- Consumes: runtime-maintained `document.documentElement.lang`, existing component selectors, and current 719-pixel mobile breakpoint.
- Produces: `html[lang="en"]` layout overrides that wrap meaningful English text and use targeted mobile `clamp()` sizes without altering `.uyghur` rules.

- [ ] **Step 1: Write failing CSS-contract assertions**

Add exact checks for English-only wrapping and mobile typography:

```js
for (const selector of [
  ".brand-name",
  ".brand-subtitle",
  ".section-title",
  ".lesson-step strong",
  ".lesson-step .caption",
  ".profile-setting-row strong",
  ".profile-setting-row small",
  ".nav-button"
]) {
  assert.match(
    styleSource,
    new RegExp(`html\\[lang="en"\\][^{}]*${selector.replaceAll(".", "\\.")}[^{}]*\\{[^}]*white-space:\\s*normal;`, "s"),
    `${selector} should show complete English text`
  );
}
assert.match(styleSource, /html\[lang="en"\] \.primary-button[^{]*\{[^}]*font-size:\s*clamp\(/s);
assert.ok(!/html\[lang="en"\][^{]*\.uyghur/.test(styleSource));
```

- [ ] **Step 2: Run the focused test and verify RED**

Expected: FAIL because there are no explicit English language-aware completeness rules.

- [ ] **Step 3: Add the targeted English layout contract**

Add grouped rules after the shared text-overflow block:

```css
html[lang="en"] .brand-name,
html[lang="en"] .brand-subtitle,
html[lang="en"] .section-title,
html[lang="en"] .lesson-step strong,
html[lang="en"] .lesson-step .caption,
html[lang="en"] .profile-setting-row strong,
html[lang="en"] .profile-setting-row small,
html[lang="en"] .nav-button {
  min-width: 0;
  overflow: visible;
  overflow-wrap: break-word;
  text-overflow: clip;
  white-space: normal;
}
```

Inside `@media (max-width: 719px)`, add only English text sizing:

```css
html[lang="en"] .brand-name { font-size: clamp(14px, 4vw, 17px); }
html[lang="en"] .brand-subtitle { font-size: clamp(10px, 2.8vw, 11px); }
html[lang="en"] .section-title { font-size: clamp(16px, 4.6vw, 20px); }
html[lang="en"] .primary-button,
html[lang="en"] .secondary-button,
html[lang="en"] .danger-button,
html[lang="en"] .ghost-button { font-size: clamp(11px, 3.2vw, 13px); }
html[lang="en"] .nav-button { font-size: clamp(10px, 2.8vw, 12px); }
html[lang="en"] .language-select {
  min-width: min(148px, 46vw);
  font-size: 12px;
}
```

Do not add any `html[lang="en"] .uyghur` rule.

- [ ] **Step 4: Run a local browser clipping audit and refine only actual findings**

Serve `prototype/` over HTTP. In English at 390 x 844 and 1280 x 720, visit Home, Profile, alphabet, combinations, vocabulary, reading, practice, keyboard, listening, writing, and completion screens. For each screen evaluate:

```js
({
  pageOverflow: document.documentElement.scrollWidth - window.innerWidth,
  clipped: [...document.querySelectorAll(
    "h1,h2,h3,p,small,strong,button,label,.caption,.step-state,.nav-button"
  )].filter((element) => {
    const style = getComputedStyle(element);
    return (
      (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1) &&
      (style.overflow === "hidden" || style.textOverflow === "ellipsis")
    );
  }).map((element) => ({ text: element.textContent.trim(), className: element.className }))
})
```

Expected: `pageOverflow` is 0 and `clipped` is empty. If an actual component fails, add that exact text-bearing selector to the grouped English rule and its exact selector to the automated list; do not introduce global scaling.

- [ ] **Step 5: Run focused checks and commit**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
git diff --check
git add prototype/styles.css tests/unit-learning-experience.test.mjs
git commit -m "Improve responsive English text layout"
```

---

### Task 4: Integrate release cache keys and run the full suite

**Files:**
- Modify: `prototype/index.html:11,38`
- Modify: `tests/unit-learning-experience.test.mjs:58-120`

**Interfaces:**
- Consumes: completed `styles.css` and `app.js` changes.
- Produces: exact release URLs `styles.css?v=20260809-english-layout` and `app.js?v=20260809-english-layout`; unchanged scripts retain their current versions and order.

- [ ] **Step 1: Write the failing exact-asset assertions**

Update only the two modified asset expectations:

```js
"./styles.css?v=20260809-english-layout",
// unchanged ordered assets
"./app.js?v=20260809-english-layout"
```

Add stale-cache isolation:

```js
const previousEnglishUiCache = new Map([
  ["./styles.css?v=20260809-bilingual", { release: "before-english-layout" }],
  ["./app.js?v=20260809-bilingual-final", { release: "before-english-layout" }]
]);
for (const url of [
  "./styles.css?v=20260809-english-layout",
  "./app.js?v=20260809-english-layout"
]) {
  assert.ok(versionedAppAssets.includes(url));
  assert.equal(previousEnglishUiCache.get(url), undefined);
}
```

- [ ] **Step 2: Run the unit test and verify RED**

Expected: FAIL because production HTML still requests the previous style and app cache URLs.

- [ ] **Step 3: Update only the modified production URLs**

In `prototype/index.html`, change:

```html
<link rel="stylesheet" href="./styles.css?v=20260809-english-layout" />
<script src="./app.js?v=20260809-english-layout"></script>
```

Do not reorder or change any other local script or the existing Supabase client URL.

- [ ] **Step 4: Run the complete verification suite**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs
git diff --check
git status --short --branch
```

Expected: `All project checks passed`, `full content render checks passed (928 states)`, no whitespace errors, and only Task 4's two intended files are uncommitted.

- [ ] **Step 5: Commit the release integration**

```bash
git add prototype/index.html tests/unit-learning-experience.test.mjs
git commit -m "Integrate English layout release assets"
```

---

### Task 5: Browser QA, GitHub merge, and Vercel production verification

**Files:**
- Verify: `prototype/`
- Do not stage: `prototype/.env.local`, `prototype/.gitignore`, `prototype/.vercel/project.json`, `prototype/.vercel/README.txt`

**Interfaces:**
- Consumes: clean feature branch with Tasks 1-4 reviewed and green.
- Produces: merged GitHub PR and verified production deployment at `https://ana-tilim.vercel.app`.

- [ ] **Step 1: Run complete local desktop/mobile Browser QA**

Use the Browser plugin. The flow under test is: English app load -> navigate every major learning surface -> verify full text, speaker controls, Profile language select, persistence, and responsive layout without runtime errors.

At 1280 x 720 and 390 x 844 verify:

- meaningful DOM and no framework overlay;
- the clipping detector from Task 3 returns no elements;
- mobile `scrollWidth === innerWidth`;
- shared audio buttons contain only speaker SVG visually, have localized accessible names, and a human-audio sample starts;
- disabled audio remains disabled;
- Profile `Language` is left and the select is right on the same row;
- changing the select to Chinese rerenders Profile, persists after reload, and changing back to English works;
- the Home compact selector is unchanged;
- Uyghur letters and ULY display sizes/content are unchanged;
- console warnings/errors are 0.

Capture desktop Profile, mobile Profile, mobile English keyboard, and one audio lesson outside the repository.

- [ ] **Step 2: Re-run publication-scope verification**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs
git diff --check
git status --short --branch
git log --oneline origin/main..HEAD
```

Expected: green suite, clean worktree, and only the approved design/plan/UI implementation commits ahead.

- [ ] **Step 3: Publish through a focused GitHub PR**

Verify authenticated GitHub CLI access, push `agent/english-layout-audio-language-select`, and create a non-draft PR titled `Improve English layout and audio controls`. The PR body must describe complete English text, shared speaker icon accessibility, Profile dropdown extensibility, cache keys, automated tests, and desktop/mobile QA. Confirm Public visibility and existing About description/homepage before merge. Merge only when GitHub reports CLEAN/MERGEABLE and no check is failing.

- [ ] **Step 4: Deploy only `prototype/` to the existing Vercel project**

Use the already authenticated Vercel CLI from `prototype/`. Confirm target `production`, status `READY`, and alias `https://ana-tilim.vercel.app`. If Vercel creates metadata, delete only these exact files individually after confirming they are generated and untracked:

```text
prototype/.env.local
prototype/.gitignore
prototype/.vercel/project.json
prototype/.vercel/README.txt
```

- [ ] **Step 5: Repeat independent production QA**

Open `https://ana-tilim.vercel.app/?qa=english-layout-audio-language-select` and repeat desktop/mobile page identity, Profile layout, dropdown persistence, speaker icon/audio interaction, clipping detector, horizontal-overflow, and console checks. Confirm production HTML requests `styles.css?v=20260809-english-layout` and `app.js?v=20260809-english-layout` and uses no icon CDN.

- [ ] **Step 6: Report exact evidence**

Report the implementation commits, PR URL, merge SHA, Vercel deployment ID/status/alias, full suite including 928 states, local/production viewports and screenshots, clipping/overflow results, console results, Public/About verification, and the boundary that real Google OAuth/Supabase connectivity and mainland-China reachability were not exercised.
