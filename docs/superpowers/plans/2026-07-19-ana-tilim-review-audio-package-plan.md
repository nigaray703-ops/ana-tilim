# Ana Tilim Review And Audio Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a local review and audio preparation package for Ana Tilim so a standard Uyghur reviewer and future speaker can check course content and record audio in a controlled order.

**Architecture:** Keep the app unchanged. Add Markdown package files under `审校与音频准备包/`, add an audio-folder README under `prototype/assets/audio/`, and link package expectations to existing curriculum scope. The package is document-first: it organizes existing Unit 1-4 content without introducing new vocabulary.

**Tech Stack:** Markdown docs, static project folders, shell validation, git.

## Global Constraints

- All work stays inside `/Users/divenp/Documents/Ana Tilim`.
- Do not introduce new learning vocabulary.
- Treat Unit 3 meanings as preview only until native-speaker review.
- Treat Unit 4 audio as `真人音频待录制`.
- Do not modify or submit user-provided untracked source materials.

---

### Task 1: Package Structure

**Files:**
- Create: `审校与音频准备包/00-使用说明.md`
- Create: `审校与音频准备包/01-给母语者的审校说明.md`
- Create: `审校与音频准备包/02-审校总表.md`
- Create: `审校与音频准备包/03-真人音频录制清单.md`
- Create: `审校与音频准备包/04-音频接入规则.md`
- Create: `审校与音频准备包/05-审校反馈记录模板.md`
- Create: `prototype/assets/audio/README.md`

**Interfaces:**
- Consumes: Unit 1-4 course docs and `prototype/app.js` data.
- Produces: human-readable review and recording package.

- [x] **Step 1: Add package overview**

Create a first-read document explaining file order and purpose.

- [x] **Step 2: Add reviewer instructions**

Create a document explaining standard Uyghur review rules, what to confirm, and what not to treat as final.

- [x] **Step 3: Add audit master table**

Create a table covering Unit 1 letters, Unit 2 combos, Unit 3 vocabulary, and Unit 4 practice/audio items.

- [x] **Step 4: Add audio recording list**

Create filenames, recording text, usage scope, and recording status.

- [x] **Step 5: Add audio integration rules**

Define future audio directory, filename rules, manifest shape, and app data fields.

- [x] **Step 6: Add feedback template**

Create a simple template for reviewer notes and decisions.

---

### Task 2: Validation And Commit

**Files:**
- Inspect: `审校与音频准备包/*.md`
- Inspect: `prototype/assets/audio/README.md`

- [x] **Step 1: File presence**

Run `find` to confirm every expected file exists.

- [x] **Step 2: Content checks**

Run `rg` to confirm key phrases exist: `待母语者审校`, `真人音频待录制`, `不设唯一答案`, `prototype/assets/audio`.

- [x] **Step 3: Whitespace check**

Run `git diff --check`.

- [x] **Step 4: Commit**

Stage only package and plan files, then commit:

```bash
git add docs/superpowers/plans/2026-07-19-ana-tilim-review-audio-package-plan.md "审校与音频准备包" prototype/assets/audio/README.md
git commit -m "Add review and audio preparation package"
```
