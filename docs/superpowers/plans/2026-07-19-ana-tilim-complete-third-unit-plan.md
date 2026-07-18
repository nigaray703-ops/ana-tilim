# Ana Tilim Complete Third Unit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Unit 3 as a conservative basic-phrases and theme-words prototype with audit-first vocabulary.

**Architecture:** Keep the static vanilla JavaScript prototype. Add `vocabGroups` separate from Unit 1 alphabet data and Unit 2 combo data, then add vocabulary lesson, recognition, keyboard, and completion screens that always show review status. Add a Markdown curriculum document and a vocabulary audit table so future native-speaker review has a clear place to happen.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Markdown docs, Node syntax/runtime checks.

## Global Constraints

- All work stays inside `/Users/divenp/Documents/Ana Tilim`.
- Unit 3 uses the conservative option selected by the user.
- Vocabulary terms are preview entries and remain `待母语者审校`.
- Do not treat Chinese meanings as final quiz truth.
- Standard Uyghur main terms, variants, acceptable answers, and non-tested notes must be separate.
- Preserve the existing mobile-first visual system.

---

### Task 1: Third Unit Data

**Files:**
- Modify: `prototype/app.js`

**Interfaces:**
- Produces: `vocabGroups`, `currentVocabGroup()`, `currentVocabItem()`, `allVocabItems()`, `vocabGroupForItem()`.
- Consumes: existing `learningUnits`, `renderGroupCard()`, and click dispatcher.

- [x] **Step 1: Define vocabulary groups**

Add four groups:

- greetings: `ياخشىمۇسىز`, `رەھمەت`, `خوش`, `ئەسسالامۇ ئەلەيكۇم`
- pronouns: `مەن`, `سىز`, `سەن`, `ئۇ`, `بىز`
- family: `ئانا`, `ئاپا`, `ئاتا`, `دادا`
- numbers: `بىر`, `ئىككى`, `ئۈچ`, `تۆت`, `بەش`

Each entry includes Uyghur form, Latin hint, Chinese preview, category, standard candidate note, variant note, acceptable-answer note, review status, source note, and whether it is testable now.

- [x] **Step 2: Add state helpers**

Add selected vocabulary group/item state and helpers that mirror Unit 2.

---

### Task 2: Unit 3 Navigation And Screens

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`

**Interfaces:**
- Consumes: `vocabGroups`, selected vocab state.
- Produces: `renderVocabLesson()`, `renderVocabRecognition()`, `renderVocabKeyboard()`, `renderVocabComplete()`, and `open-vocab-group` click behavior.

- [x] **Step 1: Make Unit 3 cards clickable**

Update `renderGroupCard()` to open vocabulary lessons for groups with `kind: "vocab"`.

- [x] **Step 2: Add vocabulary lesson screen**

Screen must include:

- top-left arrow back button
- group title and Unit 3 subtitle
- review warning
- vocabulary selector
- selected word display
- Chinese preview
- audit fields
- actions for recognition and keyboard

- [x] **Step 3: Add vocabulary practice screens**

Recognition uses current group choices, but labels the exercise as form recognition. Keyboard accepts the selected Uyghur form and keeps review status visible.

---

### Task 3: Course Documentation And Audit Table

**Files:**
- Create: `课程/字母/03-第三单元-基础词组与主题词.md`
- Create: `课程/词库/基础词库审校表.md`
- Modify: `课程/字母/00-字母基础路线.md`

**Interfaces:**
- Produces: source-of-truth draft for Unit 3 and future review.

- [x] **Step 1: Create Unit 3 doc**

Document the conservative structure, themes, practice types, and review policy.

- [x] **Step 2: Create audit table**

Create a Markdown table with all Unit 3 preview entries and audit fields.

- [x] **Step 3: Update route doc**

Mark Unit 3 as an audit-first prototype.

---

### Task 4: Validation And Commit

**Files:**
- Inspect: `prototype/app.js`, `prototype/styles.css`, `课程/字母/*.md`, `课程/词库/*.md`

- [x] **Step 1: Syntax and whitespace**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check prototype/app.js
git diff --check
```

- [x] **Step 2: Runtime flow**

Run a local Node DOM-stub flow check:

- Unit 3 detail renders
- each vocabulary group opens
- review status appears
- recognition accepts the selected form
- keyboard accepts the selected form
- profile shows vocabulary progress

- [x] **Step 3: Commit**

Stage only related prototype/docs/plan files and commit:

```bash
git add prototype/app.js prototype/styles.css docs/superpowers/plans/2026-07-19-ana-tilim-complete-third-unit-plan.md "课程/字母/00-字母基础路线.md" "课程/字母/03-第三单元-基础词组与主题词.md" "课程/词库/基础词库审校表.md"
git commit -m "Complete third unit lessons"
```
