# Ana Tilim Prototype Alphabet Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the static clickable prototype so the learning path reflects the alphabet-first curriculum route and first group `ئا`、`ب`、`ل`.

**Architecture:** Keep the prototype as a static `HTML + CSS + JavaScript` app. Add alphabet-route data and first-group letter data in `prototype/app.js`, render the learning path from that data, and let the letter page switch between the three first-group letters without changing pages.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node syntax/runtime checks. Browser screenshot QA should be added when local URL policy permits.

## Global Constraints

- Do not create a framework app or install dependencies.
- Keep edits inside `prototype/app.js`, `prototype/styles.css`, and this plan file.
- Do not change the human curriculum files under `课程/字母/`.
- Keep standard Uyghur as the main course line.
- Keep `بالا` as a letter-combination example, not a formal family vocabulary lesson.
- Keep the existing end-to-end prototype flow working from welcome screen to completion.
- Preserve mobile-first layout and desktop phone-frame centering.

---

### Task 1: Alphabet Route Data

**Files:**
- Modify: `prototype/app.js`

**Interfaces:**
- Produces: `alphabetLetters`, `alphabetGroups`, `firstGroupLetters`, and `currentLetter()` data helpers.
- Consumes: existing render functions and state object.

- [x] **Step 1: Add route data**

Add constants for:

- `alphabetLetters`: 32 entries with `letter`, `latin`, and `type`.
- `alphabetGroups`: route groups matching `课程/字母/00-字母基础路线.md`.
- `firstGroupLetters`: detailed entries for `ئا`、`ب`、`ل` with shape tables and teaching notes.

- [x] **Step 2: Add state**

Add `currentLetterId: "aa"` to `state`.

- [x] **Step 3: Add helpers**

Add:

```js
function currentLetter() {
  return firstGroupLetters.find((letter) => letter.id === state.currentLetterId) || firstGroupLetters[0];
}
```

---

### Task 2: Learning Path Route UI

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`

**Interfaces:**
- Consumes: `alphabetLetters` and `alphabetGroups`.
- Produces: learning path page that shows the alphabet-first route, first-group progress, and future groups.

- [x] **Step 1: Update home copy**

Change the home progress card so it says the user is learning the alphabet foundation and first group, not `ب` plus a word.

- [x] **Step 2: Update `renderLearnPath()`**

Render:

- A route summary card: 32 letters, first group `ئا ب ل`, review status.
- First-group active card with a button to open letter page.
- Future group cards marked `排队中`.
- A note that family/basic terms come after the alphabet stage.

- [x] **Step 3: Add CSS**

Add styles for:

- `.alphabet-strip`
- `.letter-pill`
- `.group-card`
- `.group-card.locked`

---

### Task 3: First-Group Letter Switching

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`

**Interfaces:**
- Consumes: `firstGroupLetters` and `currentLetter()`.
- Produces: letter page with selectable `ئا`、`ب`、`ل` tabs.

- [x] **Step 1: Update `renderLetter()`**

Render:

- first-group selector buttons
- current letter large display
- shape table from current letter data
- connection note
- sound hint
- writing hint
- example note

- [x] **Step 2: Update writing page**

Keep writing practice focused on `ب`, and explain that the first writing demo starts with `ب` because its dot and baseline are clear.

- [x] **Step 3: Add event handler**

Add `data-action="select-letter"` to update `state.currentLetterId` and rerender.

---

### Task 4: Validation

**Files:**
- Inspect: `prototype/app.js`
- Inspect: `prototype/styles.css`

**Interfaces:**
- Consumes: updated prototype.
- Produces: verified clickable route and documented browser limitation.

- [x] **Step 1: Syntax check**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check prototype/app.js
```

Expected: command exits successfully.

- [x] **Step 2: Runtime interaction check**

Attempt Codex in-app Browser first. The Browser tool rejected the local `file://` page because of URL policy, so the verification used a lightweight Node DOM stub to execute `prototype/app.js` and simulate:

```text
开始学习 → 继续学习 → 开始第一组 → select ئا / ب / ل → 继续书写 → 完成描摹 → 继续听力/键盘 path → 完成课程
```

Expected:

- learning path shows `32`
- first-group selector shows `ئا`、`ب`、`ل`
- switching letters changes the large letter display
- existing completion flow still works

- [x] **Step 3: Browser limitation recorded**

Screenshot capture was not performed because the available Browser surface blocks `file://` pages. Remaining visual QA to perform manually or through a permitted local URL:

- mobile learning path
- mobile letter page
- desktop learning path

Expected: no obvious clipping, overlap, blank screens, or broken RTL rendering.

- [x] **Step 4: Final git status**

Run:

```bash
git status --short
```

Expected: only intended files are modified or untracked, aside from pre-existing untracked source-material files.
