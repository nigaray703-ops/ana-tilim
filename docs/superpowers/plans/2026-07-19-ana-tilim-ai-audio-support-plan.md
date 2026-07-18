# Ana Tilim AI Audio Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AI temporary audio as an explicit, honest audio state in the prototype and documentation without treating AI audio as human-recorded final pronunciation.

**Architecture:** Update the existing review dashboard audio state model, filters, counts, and docs. Add an AI temp audio folder README and document naming rules for AI-generated temporary audio files. Do not generate actual audio files in this task.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Markdown docs, Node syntax/runtime checks.

## Global Constraints

- All work stays inside `/Users/divenp/Documents/Ana Tilim`.
- Do not generate or add actual audio files in this task.
- AI audio must be labeled `AI 临时音频`.
- AI audio must not be described as `真人音频`.
- Final listening and pronunciation content still requires standard Uyghur review.
- Do not modify or submit user-provided untracked source materials.

---

### Task 1: Prototype Audio Status Model

**Files:**
- Modify: `prototype/app.js`

**Interfaces:**
- Modifies: `audioStatusOptions`, `reviewFilters`, `filteredReviewItems()`, `reviewCounts()`, `renderReviewDashboard()`, `renderProfile()`.

- [x] **Step 1: Add AI audio states**

Add `audio-ai-temp` and `audio-rerecord`, and rename human states clearly.

- [x] **Step 2: Add filters and counts**

Add filters for AI temporary audio and needs re-recording. Add counts to review metrics and profile.

- [x] **Step 3: Keep status controls working**

Ensure the dashboard can apply every audio status to the selected review item.

---

### Task 2: Documentation And Folder Rules

**Files:**
- Modify: `审校与音频准备包/00-使用说明.md`
- Modify: `审校与音频准备包/01-给母语者的审校说明.md`
- Modify: `审校与音频准备包/03-真人音频录制清单.md`
- Modify: `审校与音频准备包/04-音频接入规则.md`
- Modify: `审校与音频准备包/05-审校反馈记录模板.md`
- Modify: `审校与音频准备包/06-审校结果回填流程.md`
- Modify: `prototype/assets/audio/README.md`
- Create: `prototype/assets/audio/ai-temp/README.md`

**Interfaces:**
- Produces: clear AI temp audio policy and future folder expectations.

- [x] **Step 1: Update package overview**

Explain that AI audio is allowed only as temporary audio.

- [x] **Step 2: Update recording and integration docs**

Add AI naming, folder, status, and replacement rules.

- [x] **Step 3: Add AI temp folder README**

Reserve `prototype/assets/audio/ai-temp/` for future temporary AI files.

---

### Task 3: Validation And Commit

**Files:**
- Inspect: `prototype/app.js`, docs, and audio README files.

- [x] **Step 1: Syntax and whitespace**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check prototype/app.js
git diff --check
```

- [x] **Step 2: DOM interaction flow**

Run a local Node DOM-stub flow check:

- dashboard shows `AI 临时音频`
- applying AI audio status updates selected item
- AI filter shows the selected item
- applying re-record status updates selected item
- profile shows AI audio count

- [x] **Step 3: Commit**

Stage only related files and commit:

```bash
git add prototype/app.js docs/superpowers/plans/2026-07-19-ana-tilim-ai-audio-support-plan.md "审校与音频准备包/00-使用说明.md" "审校与音频准备包/01-给母语者的审校说明.md" "审校与音频准备包/03-真人音频录制清单.md" "审校与音频准备包/04-音频接入规则.md" "审校与音频准备包/05-审校反馈记录模板.md" "审校与音频准备包/06-审校结果回填流程.md" prototype/assets/audio/README.md prototype/assets/audio/ai-temp/README.md
git commit -m "Add AI temporary audio support"
```
