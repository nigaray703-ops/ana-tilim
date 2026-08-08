# Inline Profile Name and Vocabulary Morphemes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move nickname editing into the profile heading and keep explicit vocabulary morpheme breakdowns beside their words without a duplicate bottom reference block in both editions.

**Architecture:** Keep the existing `localProfile` and cloud profile data contracts unchanged. Add a transient UI-only edit flag and a focused profile-heading renderer, then reuse the existing validation and persistence action. Continue using `sentenceGlossary.glossToken()` as the only source of morpheme segments and remove only the redundant vocabulary-page call to `renderSentenceGlosses()`.

**Tech Stack:** Static HTML, CSS, plain JavaScript, Node.js `assert`/`vm` tests, localStorage, existing Supabase cloud adapter for the overseas edition.

## Global Constraints

- Update both `Ana Tilim/prototype` and `Uyghur Tili/site` unless an edition is explicitly excluded.
- Preserve existing local nickname, avatar, learning progress, import/export data, and overseas cloud profile fields.
- Do not create a new storage key or migrate existing profile data.
- Only render morphemes from explicit `segments` data; do not infer unreviewed Uyghur morphology.
- Keep reading and dialogue sentence glosses unchanged.
- Keep all assets local and relative in the domestic CloudBase build.

---

### Task 1: Overseas inline nickname editor

**Files:**
- Modify: `prototype/app.js:380-425,4780-5005,5350-5405`
- Modify: `prototype/styles.css:2533-2636`
- Test: `tests/unit-learning-experience.test.mjs:720-810`

**Interfaces:**
- Consumes: `state.localProfile.displayName`, `cloudAccountProfile().displayName`, `validateDisplayName(value)`, `saveLocalProgress()`, and `cloudSync.updateDisplayName(value)`.
- Produces: `state.profileNameEditing: boolean` and `renderProfileNameControl(displayName): string`.

- [ ] **Step 1: Write failing profile-render and interaction tests**

Add assertions that the normal profile heading contains `data-action="edit-display-name"` and `aria-label="修改昵称"`, while `profile-display-name`, `保存昵称`, and the old settings editor are absent. Use the existing click harness to click the pencil, assert the input is prefilled with the current local nickname, click cancel, and confirm the stored nickname and avatar data URL are unchanged.

```js
vm.runInContext(`
  state.localProfile = {
    displayName: "已保存昵称",
    avatarDataUrl: "data:image/png;base64,kept-avatar"
  };
`, context);
let localProfileHtml = renderState("state.screen = 'profile'");
assert.match(localProfileHtml, /data-action="edit-display-name"/);
assert.match(localProfileHtml, /aria-label="修改昵称"/);
assert.doesNotMatch(localProfileHtml, /id="profile-display-name"/);
assert.doesNotMatch(localProfileHtml, /保存昵称/);

clickDataset({ action: "edit-display-name" });
localProfileHtml = renderState("state.screen = 'profile'");
assert.match(localProfileHtml, /id="profile-display-name"[^>]+value="已保存昵称"/);
assert.match(localProfileHtml, /data-action="cancel-display-name"/);

clickDataset({ action: "cancel-display-name" });
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.localProfile)", context)),
  {
    displayName: "已保存昵称",
    avatarDataUrl: "data:image/png;base64,kept-avatar"
  }
);
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: FAIL because the profile has no `edit-display-name` action and still renders the settings nickname editor.

- [ ] **Step 3: Implement the minimal profile-heading editor**

Add `profileNameEditing: false` beside other transient state flags. Replace `renderProfileNameEditor()` with `renderProfileNameControl(displayName)`:

```js
function renderProfileNameControl(displayName) {
  if (!state.profileNameEditing) {
    return `
      <div class="profile-name-heading">
        <h2 class="section-title">${escapeHtml(displayName)}</h2>
        <button class="profile-name-edit-button" data-action="edit-display-name" type="button" aria-label="修改昵称">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11-4-4L4 16v4Zm13.5-16.5 3 3" /></svg>
        </button>
      </div>`;
  }
  return `
    <div class="profile-name-inline-editor">
      <input id="profile-display-name" type="text" maxlength="40" autocomplete="name" value="${escapeHtml(displayName)}" aria-label="昵称" />
      <button class="profile-name-save" data-action="save-display-name" type="button">保存</button>
      <button class="profile-name-cancel" data-action="cancel-display-name" type="button">取消</button>
    </div>`;
}
```

Render this control in `renderProfileHero()`, remove both settings-panel calls to the old editor, and add click actions:

```js
if (action === "edit-display-name") {
  state.profileNameEditing = true;
  render();
  window.requestAnimationFrame(() => document.querySelector("#profile-display-name")?.focus());
  return;
}

if (action === "cancel-display-name") {
  state.profileNameEditing = false;
  render();
  return;
}
```

Set `state.profileNameEditing = false` only after a successful local or cloud save. Leave it open on validation or cloud failure.

- [ ] **Step 4: Add responsive accessible styling**

Add styles for `.profile-name-heading`, `.profile-name-edit-button`, `.profile-name-inline-editor`, `.profile-name-save`, and `.profile-name-cancel`. Keep the pencil button at least `32px` square, use `currentColor` SVG strokes, let the inline editor wrap on narrow screens, and keep the input width constrained by `minmax(0, 1fr)`.

- [ ] **Step 5: Run the test and verify GREEN**

Run the same unit test. Expected: `unit learning experience checks passed` with no warnings.

- [ ] **Step 6: Commit Task 1**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs
git commit -m "feat: edit profile name from the heading"
```

### Task 2: Vocabulary morphemes stay with each word

**Files:**
- Modify: `prototype/app.js:3865-3970,4210-4265`
- Test: `tests/unit-learning-experience.test.mjs`

**Interfaces:**
- Consumes: `sentenceGlossary.glossToken(value)` returning `{ word, latin, meaning, segments }` and `renderGlossSegments(segments)`.
- Produces: vocabulary rows with `.vocab-morpheme-breakdown` only when `segments.length > 0` and no vocabulary-level `.sentence-gloss` block.

- [ ] **Step 1: Write failing vocabulary layout tests**

Render the greetings vocabulary lesson with `yaxshimusiz` active. Assert that its row includes the explicit segments in source order and arrows, that a non-segmented word such as `yaxshi` has no nested breakdown, and that the vocabulary lesson contains no `逐词与词素参考` bottom block.

```js
const vocabHtml = renderState(`
  state.screen = "vocab";
  state.selectedVocabGroupId = "greetings";
  state.currentVocabItemId = "yaxshimusiz";
`);
assert.match(vocabHtml, /data-morpheme="ياخشى"[\s\S]+data-morpheme="مۇ"[\s\S]+data-morpheme="سىز"/);
assert.match(vocabHtml, /morpheme-direction[^>]*>[\s\S]*←/);
assert.doesNotMatch(vocabHtml, /逐词与词素参考/);
```

Add a glossary-driven loop that confirms every vocabulary item with explicit segments renders `.vocab-morpheme-breakdown`, without creating any segment heuristically for items whose glossary entry has no segments.

- [ ] **Step 2: Run the test and verify RED**

Run the unit test. Expected: FAIL because the active vocabulary item still adds `renderSentenceGlosses(item.value)` at the bottom.

- [ ] **Step 3: Remove only the redundant vocabulary footer**

Delete this line from `renderVocabLesson()`:

```js
${renderSentenceGlosses(item.value)}
```

Keep `renderVocabMorphemeBreakdown(item.value)` inside every `renderVocabRow()` and keep `renderSentenceGlosses()` unchanged for reading, grammar, dialogue, story, proverb, and quote screens.

- [ ] **Step 4: Run the test and verify GREEN**

Run the unit test. Expected: `unit learning experience checks passed`.

- [ ] **Step 5: Commit Task 2**

```bash
git add prototype/app.js tests/unit-learning-experience.test.mjs
git commit -m "feat: keep morpheme glosses with vocabulary rows"
```

### Task 3: Domestic edition parity and static build

**Files:**
- Modify: `../Uyghur Tili/site/app.js`
- Modify: `../Uyghur Tili/site/styles.css`
- Modify: `../Uyghur Tili/tests/cn-static.test.mjs`
- Rebuild: `../Uyghur Tili/dist-cn/`
- Update: `../Uyghur Tili/uyghur-tili-dist-cn.zip`

**Interfaces:**
- Consumes: the verified overseas profile and vocabulary behavior from Tasks 1 and 2.
- Produces: identical domestic UI behavior while keeping `appConfig.cloudEnabled === false` and all static asset paths relative.

- [ ] **Step 1: Write failing domestic static assertions**

Update `cn-static.test.mjs` to require the pencil action, cancel action, inline input markup, and vocabulary-row morphemes; require that the old `renderProfileNameEditor` and the vocabulary footer call are absent.

```js
assert.match(app, /data-action="edit-display-name"/);
assert.match(app, /data-action="cancel-display-name"/);
assert.doesNotMatch(profileHtml, /保存昵称/);
assert.match(app, /renderVocabMorphemeBreakdown\(item\.value\)/);
assert.doesNotMatch(vocabLessonBody, /renderSentenceGlosses\(item\.value\)/);
```

- [ ] **Step 2: Run the domestic test and verify RED**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/cn-static.test.mjs
```

Expected: FAIL because the domestic source still has the old profile editor and vocabulary footer.

- [ ] **Step 3: Apply the verified behavior to domestic source**

Apply the same focused `state`, renderer, actions, save-success flag, and CSS changes from Tasks 1 and 2 to `site/app.js` and `site/styles.css`. Do not copy overseas auth configuration or alter domestic `app-config.js`.

- [ ] **Step 4: Run domestic test and build**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/cn-static.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/build-cn.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/cn-static.test.mjs
```

Expected: all commands exit `0`; `dist-cn/index.html` exists and the static test reports all local audio targets.

- [ ] **Step 5: Refresh the upload archive**

From `Uyghur Tili/dist-cn`, run:

```bash
zip -qr ../uyghur-tili-dist-cn.zip .
```

Expected: exit `0` without deleting or recursively removing any project path.

### Task 4: Full verification and rendered interaction QA

**Files:**
- Verify only: `prototype/`, `tests/`, `../Uyghur Tili/site/`, `../Uyghur Tili/dist-cn/`

**Interfaces:**
- Consumes: completed Tasks 1-3.
- Produces: evidence for persistence, cancellation, avatar preservation, vocabulary placement, responsive layout, and console health.

- [ ] **Step 1: Run complete automated checks**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ../Uyghur\ Tili/tests/cn-static.test.mjs
```

Expected: `All project checks passed.` and the domestic static check passes.

- [ ] **Step 2: Verify local rendered profile flow in Browser**

The flow under test is: local domestic site → 我的 → click nickname pencil → edit and save → reload → saved nickname and existing avatar remain → click pencil and cancel → nickname remains unchanged.

Check page identity, non-blank content, framework overlay absence, console warnings/errors, mobile and desktop screenshots, focus after opening the editor, save persistence, cancel behavior, and absence of the old settings nickname editor.

- [ ] **Step 3: Verify vocabulary layout in Browser**

The flow under test is: 学习 → 第三单元 → 问候 → inspect decomposable and non-decomposable rows → confirm morphemes stay under the word and no bottom duplicate reference appears.

Check RTL order, left arrows, alignment, narrow-screen wrapping, and console health.

- [ ] **Step 4: Review the final diff without disturbing existing work**

```bash
git diff --check
git status --short
```

Expected: no whitespace errors. Report pre-existing unrelated modifications separately and do not reset, discard, or delete them.
