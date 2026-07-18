# Ana Tilim Review Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-prototype review dashboard that lets the user inspect and locally backfill review and audio status for existing Unit 1-4 content.

**Architecture:** Add a derived review data layer in `prototype/app.js`, a `review` screen renderer, click handlers for filters and status updates, dashboard styles in `prototype/styles.css`, and a Markdown workflow document in the review/audio package. No backend, no new course vocabulary, no real audio files.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Markdown docs, Node syntax/runtime checks.

## Global Constraints

- All work stays inside `/Users/divenp/Documents/Ana Tilim`.
- Do not introduce new learning vocabulary.
- Keep Unit 3 meanings as preview until native-speaker review.
- Keep audio as `真人音频待录制` unless the user manually toggles the prototype state.
- Preserve the existing mobile-first visual system.
- Do not modify or submit user-provided untracked source materials.

---

### Task 1: Review Data Layer

**Files:**
- Modify: `prototype/app.js`

**Interfaces:**
- Produces: `reviewStatusOptions`, `audioStatusOptions`, `reviewBaseItems`, `reviewItemsWithOverrides()`, `filteredReviewItems()`, `currentReviewItem()`, `reviewCounts()`.
- Consumes: existing `alphabetLetters`, `comboGroups`, `vocabGroups`, and `practiceGroups`.

- [x] **Step 1: Add review status options**

Define the six review states and three audio states.

- [x] **Step 2: Derive review items**

Create review records from Unit 1-4 data, including priority flags for family/basic address terms.

- [x] **Step 3: Add state and helpers**

Add selected item, filter, and override state for local backfill interactions.

---

### Task 2: Review Dashboard UI

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`

**Interfaces:**
- Consumes: review helpers from Task 1.
- Produces: `renderReviewDashboard()`, review entry buttons, filter buttons, and backfill controls.

- [x] **Step 1: Add screen route and entry points**

Wire `review` into the screen map, home quick entry, and profile entry.

- [x] **Step 2: Add dashboard renderer**

Render summary metrics, filter buttons, selected item detail, status controls, audio controls, and item list.

- [x] **Step 3: Add click handlers**

Handle `set-review-filter`, `select-review-item`, `apply-review-status`, and `apply-audio-status`.

- [x] **Step 4: Add dashboard styles**

Style review chips, priority family rows, status controls, and compact item list.

---

### Task 3: Documentation

**Files:**
- Create: `审校与音频准备包/06-审校结果回填流程.md`
- Modify: `审校与音频准备包/00-使用说明.md`

**Interfaces:**
- Produces: human-readable workflow for using the dashboard and backfilling review results.

- [x] **Step 1: Create workflow document**

Explain how to use the dashboard, what each status means, and how to handle family terms and audio status.

- [x] **Step 2: Update package overview**

Add the new workflow document to the reading order.

---

### Task 4: Validation And Commit

**Files:**
- Inspect: `prototype/app.js`, `prototype/styles.css`, docs under `审校与音频准备包/`

- [x] **Step 1: Syntax and whitespace**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check prototype/app.js
git diff --check
```

- [x] **Step 2: DOM interaction flow**

Run a local Node DOM-stub flow check:

- home opens review dashboard
- profile opens review dashboard
- dashboard shows family priority and audio pending
- filter buttons update visible text
- review status updates selected item and counts
- audio status updates selected item
- learn path still renders

- [x] **Step 3: Rendered frontend check**

Attempted through the Browser plugin. Browser policy blocked direct `file://` navigation to the local prototype, so rendered Browser screenshot validation was not available. Validation continued with syntax, whitespace, and DOM interaction checks.

Use the Browser plugin when available; otherwise run a local static server plus Playwright screenshot/console check for the review dashboard.

- [x] **Step 4: Commit**

Stage only related files and commit:

```bash
git add prototype/app.js prototype/styles.css docs/superpowers/specs/2026-07-19-ana-tilim-review-dashboard-design.md docs/superpowers/plans/2026-07-19-ana-tilim-review-dashboard-plan.md "审校与音频准备包/00-使用说明.md" "审校与音频准备包/06-审校结果回填流程.md"
git commit -m "Add review dashboard workflow"
```
