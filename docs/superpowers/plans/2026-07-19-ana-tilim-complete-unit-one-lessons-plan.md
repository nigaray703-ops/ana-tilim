# Ana Tilim Complete Unit One Lessons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the prototype for Unit 1 so every similar-letter group opens into a detailed lesson with smaller learning points.

**Architecture:** Keep the prototype as a static vanilla JavaScript app. Add reusable Unit 1 group data for all similar-letter groups, render a group lesson screen from that data, and make existing practice screens use the currently selected group and letter instead of hard-coded `ب`.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node syntax/runtime checks.

## Global Constraints

- All work stays inside `/Users/divenp/Documents/Ana Tilim`.
- Unit 1 remains `认识字母`.
- Unit 1 teaches letters only: shape, point/shape contrast, four forms, sound hints, recognition, and single-letter keyboard input.
- Unit 2 is still only a preview for combinations and word/phrase learning.
- All language-sensitive content remains `待母语者审校`.
- Do not introduce family/basic terms as Unit 1 answers.
- Preserve existing mobile-first prototype styling.

---

### Task 1: Unit 1 Group Data

**Files:**
- Modify: `prototype/app.js`

**Interfaces:**
- Produces: `alphabetGroups`, `letterDetails`, `currentGroup()`, `currentLetter()`.
- Consumes: existing `learningUnits`, `renderUnitDetail()`, and letter/practice screens.

- [x] **Step 1: Define complete Unit 1 groups**

Create data for these groups:

- `ب / پ / ت / ن`
- `ج / چ / خ`
- `د / ر / ز / ژ`
- `س / ش`
- `غ / ف / ق`
- `ك / گ / ڭ`
- `ل / م / ھ`
- `ۋ / ي`
- `元音 1：ئا / ئە`
- `元音 2：ئو / ئۇ / ئۆ / ئۈ`
- `元音 3：ئې / ئى`

- [x] **Step 2: Define letter details**

For every Unit 1 letter, include:

- letter
- latin
- type
- forms
- sound hint
- writing hint
- connection hint
- contrast hint

---

### Task 2: Group Lesson Navigation

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`

**Interfaces:**
- Consumes: `unitOneGroups` and selected group state.
- Produces: `renderGroupLesson()` and `open-group` event.

- [x] **Step 1: Make group cards clickable**

In Unit 1 detail, each group card should be a button that opens the group lesson.

- [x] **Step 2: Add group lesson screen**

The group lesson screen contains:

- top-left arrow back button
- group title and description
- group letter selector
- selected letter display
- four forms
- small learning points
- buttons for recognition, listening, keyboard

---

### Task 3: Dynamic Practice Screens

**Files:**
- Modify: `prototype/app.js`

**Interfaces:**
- Consumes: current group and selected letter.
- Produces: dynamic recognition, listening, keyboard, complete screens.

- [x] **Step 1: Recognition practice**

Use the currently selected group. The correct answer is the selected letter, and distractors come from the same group.

- [x] **Step 2: Listening practice**

Use the currently selected group and selected letter.

- [x] **Step 3: Keyboard practice**

Require input of the selected letter only.

---

### Task 4: Validation And Commit

**Files:**
- Inspect: `prototype/app.js`, `prototype/styles.css`

- [x] **Step 1: Syntax and whitespace**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check prototype/app.js
git diff --check
```

- [x] **Step 2: Runtime flow**

Run a local Node DOM-stub flow check:

- learning unit list renders
- Unit 1 detail renders
- each group opens
- each group can select at least one letter
- recognition and keyboard use the selected letter

- [ ] **Step 3: Commit**

Stage only prototype and plan files, then commit:

```bash
git add prototype/app.js prototype/styles.css docs/superpowers/plans/2026-07-19-ana-tilim-complete-unit-one-lessons-plan.md
git commit -m "Complete unit one lesson flow"
```
