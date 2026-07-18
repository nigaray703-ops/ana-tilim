# Ana Tilim Unit Learning Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Polish the existing four-unit Ana Tilim prototype so zero-beginner learners always know what to do next, can move through items, and receive gentle review guidance.

**Architecture:** Keep the static vanilla JavaScript prototype. Add small data helpers in `prototype/app.js` for unit steps, item position, previous/next item navigation, and next-unit routing. Add compact UI styles in `prototype/styles.css` and a Node rendering test that exercises the key screens without requiring a browser.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node.js ESM tests.

## Global Constraints

- Do not add a fifth unit.
- Do not add large new vocabulary sets.
- Do not generate audio files.
- Do not mark `待母语者审校` content as final standard content.
- Keep all back buttons as symbols, not text.
- Keep AI audio labeled `AI 临时音频`.
- Do not touch the original Word document, `资料/`, or unrelated `.DS_Store` files.

---

### Task 1: Learning Experience Rendering Test

**Files:**
- Create: `tests/unit-learning-experience.test.mjs`

**Interfaces:**
- Consumes: existing global render functions and state from `prototype/app.js`.
- Produces: a reusable smoke test proving the four-unit polish renders.

- [x] **Step 1: Write the failing test**

Create a Node VM test that renders:

- home screen
- unit detail screen
- letter screen
- combo screen
- vocab screen
- practice completion screen

Expected phrases:

- `今日下一步`
- `学习步骤`
- `上一个`
- `下一个`
- `进入第二单元`
- `进入第三单元`
- `进入第四单元`
- `再练一轮`
- `AI 临时音频`
- `不设唯一答案`

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: FAIL before implementation because the new experience phrases and navigation actions do not exist yet.

### Task 2: Add Experience Helpers And Data

**Files:**
- Modify: `prototype/app.js`

**Interfaces:**
- Produces: `unitSteps`, `unitNextActions`, `itemPosition()`, `adjacentItem()`, and `renderStepList()`.

- [x] **Step 1: Implement helper data**

Add compact per-unit step arrays and next-unit routing data.

- [x] **Step 2: Implement item navigation helpers**

Add helpers that find current index, previous item, next item, and readable progress labels.

### Task 3: Polish Unit Screens

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`

**Interfaces:**
- Consumes: helpers from Task 2.
- Produces: visible steps, next action cards, and clearer home recommendation.

- [x] **Step 1: Update home screen**

Add `今日下一步`, current recommendation, unit status row, and audio note.

- [x] **Step 2: Update learning path and unit detail**

Render step lists and next-action cards for every unit.

- [x] **Step 3: Add compact styles**

Add styles for step lists, progress rows, adjacent navigation, and next-action cards.

### Task 4: Add Item Previous/Next Navigation

**Files:**
- Modify: `prototype/app.js`

**Interfaces:**
- Consumes: `adjacentItem()`.
- Produces: `select-adjacent-letter`, `select-adjacent-combo`, and `select-adjacent-vocab` actions.

- [x] **Step 1: Add letter navigation**

Show current group position and previous/next letter buttons.

- [x] **Step 2: Add combo navigation**

Show current group position and previous/next combo buttons.

- [x] **Step 3: Add vocab navigation**

Show current theme position and previous/next word buttons.

- [x] **Step 4: Add click handlers**

Switch current item and reset the relevant local practice state.

### Task 5: Improve Completion And Feedback

**Files:**
- Modify: `prototype/app.js`

**Interfaces:**
- Produces: unit completion next-actions and gentler wrong-answer guidance.

- [x] **Step 1: Update Unit 1 completion**

Add `复习本组` and `进入第二单元`.

- [x] **Step 2: Update Unit 2 completion**

Add `复习组合` and `进入第三单元`.

- [x] **Step 3: Update Unit 3 completion**

Add `复习词形` and `进入第四单元`.

- [x] **Step 4: Update Unit 4 completion**

Add `再练一轮` and `回到学习路径`.

- [x] **Step 5: Update wrong-answer feedback**

Add gentle copy that points back to the current group/theme.

### Task 6: Verify And Commit

**Files:**
- Modify: plan checkboxes in this file.

**Interfaces:**
- Produces: committed implementation.

- [x] **Step 1: Run tests**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/alphabet-ai-audio.test.mjs
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check prototype/app.js
git diff --check
```

- [x] **Step 2: Commit**

Commit message:

```bash
git commit -m "Polish unit learning experience"
```
