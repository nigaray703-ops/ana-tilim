# Ana Tilim Complete Fourth Unit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Unit 4 as a no-new-vocabulary listening, speaking, writing, and review loop that reuses material from Units 1-3.

**Architecture:** Keep the static vanilla JavaScript prototype. Add a `practiceGroups` data layer for Unit 4, route the bottom writing tab to a practice hub, preserve the existing single-letter tracing page as `letterWriting`, and add one generic practice session screen plus a result screen. Add a curriculum document and update the route document so future audio and native-speaker review work has a clear place.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Markdown docs, Node syntax/runtime checks.

## Global Constraints

- All work stays inside `/Users/divenp/Documents/Ana Tilim`.
- Unit 4 does not introduce new vocabulary.
- Unit 4 may use audio buttons, but real audio remains `真人音频待录制`.
- Third-unit meanings remain `待母语者审校`; Unit 4 practices form, input, and routine, not final vocabulary truth.
- Existing first-unit letter tracing remains available from letter detail pages.
- Preserve the existing mobile-first visual system.

---

### Task 1: Fourth Unit Data And Navigation

**Files:**
- Modify: `prototype/app.js`

**Interfaces:**
- Produces: `practiceGroups`, `currentPracticeGroup()`, `currentPracticeItems()`, `currentPracticeItem()`, `practiceGroupForItem()`, `resetPracticeSessionState()`.
- Consumes: existing `learningUnits`, `renderGroupCard()`, bottom navigation, and click dispatcher.

- [x] **Step 1: Define practice groups**

Add four Unit 4 groups:

- `listening-loop`: listen and choose from existing letters, combos, and words
- `repeat-loop`: shadow-reading routine from existing forms
- `writing-loop`: tracing plus keyboard input from existing forms
- `review-loop`: result and weak-point review from existing forms

Each practice item includes `id`, `type`, `value`, `latin`, `label`, `hint`, `parts`, and `audioStatus`.

- [x] **Step 2: Update Unit 4 metadata**

Mark Unit 3 as complete and Unit 4 as in progress. Unit 4 cards use `kind: "practice"` and `actionTarget: "writing"`.

- [x] **Step 3: Wire navigation**

Bottom nav `writing` opens the Unit 4 hub. Letter detail `描摹` opens `letterWriting`. Group cards with `kind: "practice"` open the selected practice session.

---

### Task 2: Fourth Unit Screens

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`

**Interfaces:**
- Consumes: `practiceGroups`, selected practice state.
- Produces: `renderPracticeHub()`, `renderPracticeSession()`, `renderPracticeComplete()`, `renderPracticeSelector()`, `renderPracticeModeCard()`, `renderPracticeChoices()`.

- [x] **Step 1: Add practice hub**

The hub shows:

- Unit 4 title
- no-new-word notice
- four practice group cards
- metrics for practice groups, review items, and audio status

- [x] **Step 2: Add generic session screen**

The screen changes copy and controls by group mode:

- listening: audio placeholder and form choices
- speaking: target form, pronunciation hint, and `我已跟读`
- writing: tracing pad plus keyboard input
- review: weak-point checklist and result preparation

- [x] **Step 3: Add result screen**

The result screen summarizes current group items, selected item, listening selection, follow-read state, and keyboard state without claiming final language correctness.

- [x] **Step 4: Add responsive styles**

Add compact practice cards and mode panels that keep long Uyghur text inside its container.

---

### Task 3: Course Documentation

**Files:**
- Create: `课程/字母/04-第四单元-听说与书写强化.md`
- Modify: `课程/字母/00-字母基础路线.md`

**Interfaces:**
- Produces: written Unit 4 course draft.

- [x] **Step 1: Create Unit 4 doc**

Document the four practice loops, no-new-word rule, audio placeholder policy, and completion standard.

- [x] **Step 2: Update route doc**

Replace the short Unit 4 placeholder with the implemented structure.

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

Run a Node DOM-stub flow check:

- home shows Unit 4 as current
- Unit 4 detail renders all practice groups
- each practice group opens
- listening selection works
- speaking mark works
- writing input validates
- result screen renders
- old letter tracing route still renders

- [x] **Step 3: Commit**

Stage only related prototype/docs/plan files and commit:

```bash
git add prototype/app.js prototype/styles.css docs/superpowers/plans/2026-07-19-ana-tilim-complete-fourth-unit-plan.md "课程/字母/00-字母基础路线.md" "课程/字母/04-第四单元-听说与书写强化.md"
git commit -m "Complete fourth unit practice loop"
```
