# Ana Tilim Complete Second Unit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the prototype for Unit 2 as a mixed lesson: letter combinations first, then a small audited-preview phrase section.

**Architecture:** Keep the prototype as a static vanilla JavaScript app. Add a separate `comboGroups` data model so Unit 2 does not overload Unit 1 letter groups, then add combo lesson, recognition, keyboard, and completion screens that read from the selected combo group and item. Course docs must state that basic phrase meanings are preview content and still require native-speaker review.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Markdown docs, Node syntax/runtime checks.

## Global Constraints

- All work stays inside `/Users/divenp/Documents/Ana Tilim`.
- Unit 2 uses the mixed approach selected by the user: combinations first, then a few basic phrase previews.
- Unit 2 phrase meanings are marked `待母语者审校` and are not treated as final quiz truth.
- Main answers follow standard Uyghur design; variants are shown separately and not mixed into final answers.
- Family/basic terms are introduced only as a light preview, not as the full family unit.
- Preserve the existing mobile-first visual system.

---

### Task 1: Second Unit Data

**Files:**
- Modify: `prototype/app.js`

**Interfaces:**
- Produces: `comboGroups`, `currentComboGroup()`, `currentComboItem()`, `allComboItems()`, `resetComboPracticeState()`.
- Consumes: existing `learningUnits`, `renderUnitDetail()`, and the click event dispatcher.

- [x] **Step 1: Define combo groups**

Add four groups:

- `open-a`: two-letter open combinations like `با`, `ما`, `نا`, `لا`.
- `soft-e`: two-letter combinations using `ە`, such as `بە`, `مە`, `نە`, `لە`.
- `three-step`: slow three-letter reading forms like `بال`, `مان`, `نان`, `تال`, marked as combination practice.
- `phrase-preview`: basic family/title preview forms `ئانا`, `ئاپا`, `ئاتا`, `دادا`, with meanings and variants marked for review.

- [x] **Step 2: Add state helpers**

Add selected combo group/item state and helper functions that mirror the Unit 1 letter helpers.

---

### Task 2: Unit 2 Navigation And Screens

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`

**Interfaces:**
- Consumes: `comboGroups`, selected combo state.
- Produces: `renderComboLesson()`, `renderComboRecognition()`, `renderComboKeyboard()`, `renderComboComplete()`, and `open-combo-group` click behavior.

- [x] **Step 1: Make Unit 2 cards clickable**

Update `renderGroupCard()` so Unit 2 groups open combo lessons while Unit 1 groups still open alphabet lessons.

- [x] **Step 2: Add combo lesson screen**

Screen must include:

- top-left arrow back button
- group title and Unit 2 subtitle
- group goal
- combo selector
- selected combo display
- split view showing letters/components
- small learning points
- actions for recognition and keyboard

- [x] **Step 3: Add combo practice screens**

Recognition uses the current group as choices. Keyboard requires the current combo item and provides whole-combo shortcut keys.

---

### Task 3: Course Documentation

**Files:**
- Create: `课程/字母/02-第二单元-组合与词组入门.md`
- Modify: `课程/字母/00-字母基础路线.md`
- Modify: `课程/字母/01-第一单元-认识字母.md`

**Interfaces:**
- Produces: curriculum source for Unit 2.

- [x] **Step 1: Create Unit 2 doc**

Document the mixed structure, groups, exercises, and review policy.

- [x] **Step 2: Update route docs**

Make the route docs say Unit 2 now has an initial mixed prototype.

---

### Task 4: Validation And Commit

**Files:**
- Inspect: `prototype/app.js`, `prototype/styles.css`, `课程/字母/*.md`

- [x] **Step 1: Syntax and whitespace**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check prototype/app.js
git diff --check
```

- [x] **Step 2: Runtime flow**

Run a local Node DOM-stub flow check:

- learning path renders
- Unit 2 detail renders
- each Unit 2 group opens
- recognition accepts the selected combo
- keyboard accepts the selected combo
- phrase preview shows `待母语者审校`

- [x] **Step 3: Commit**

Stage only related prototype/docs/plan files and commit:

```bash
git add prototype/app.js prototype/styles.css docs/superpowers/plans/2026-07-19-ana-tilim-complete-second-unit-plan.md "课程/字母/00-字母基础路线.md" "课程/字母/01-第一单元-认识字母.md" "课程/字母/02-第二单元-组合与词组入门.md"
git commit -m "Complete second unit lessons"
```
