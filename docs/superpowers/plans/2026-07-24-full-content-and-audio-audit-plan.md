# Full Content and Audio Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify every course item and recording target, remove only audio files that are provably unreferenced, and leave repeatable tests that prevent missing or orphaned audio.

**Architecture:** Treat the five focused course-data files as the source of truth, derive every required recording target from the same data used by the recording screen, and compare those targets with the four human-audio manifests and the files on disk. Use automated integrity tests for exact set comparisons, then use the in-app browser to verify that every unit and recording category renders without missing content.

**Tech Stack:** Plain JavaScript, Node.js built-in test/assert/fs/vm modules, static HTML/CSS, WebM audio, JSON manifests.

## Global Constraints

- Preserve all unrelated dirty-worktree changes.
- Keep human recordings only; do not restore deleted AI-audio tooling or temporary AI folders.
- Practice exercises reuse alphabet recordings and must not have duplicate practice audio files.
- Delete an audio file only when it is absent from the active course data, the recording target set, and every human-audio manifest.
- Do not commit, push, or create a pull request unless the user asks.

---

### Task 1: Establish the Complete Content and Audio Inventory

**Files:**
- Read: `prototype/course-data/alphabet-data.js`
- Read: `prototype/course-data/combo-data.js`
- Read: `prototype/course-data/vocab-data.js`
- Read: `prototype/course-data/practice-data.js`
- Read: `prototype/course-data/reading-data.js`
- Read: `prototype/assets/audio/human/*/manifest.json`
- Read: `prototype/app.js`

**Interfaces:**
- Consumes: `window.ANA_TILIM_COURSE`, the four manifest `items` arrays, and `recordingCategoryData()`.
- Produces: Exact counts and ID/file sets for letters, combinations, vocabulary, practice reuse, reading sentences, recorded targets, pending targets, missing files, and orphan files.

- [ ] **Step 1: Run the current complete project check**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs
```

Expected: The existing syntax and integrity checks pass before new audit assertions are added.

- [ ] **Step 2: Enumerate every WebM file and manifest item**

Run a read-only Node audit that compares each category directory with its manifest and prints missing, unlisted, duplicate-hash, and undersized files.

Expected: A deterministic report with explicit absolute or workspace-relative file paths.

- [ ] **Step 3: Derive all recording targets from course data**

Evaluate `recordingCategoryData()` in the same VM harness used by `tests/human-audio.test.mjs`.

Expected: Four categories—alphabet, combo, vocab, and reading—with no duplicate target IDs and no empty recording text.

### Task 2: Add Exact Audio Coverage Regression Tests

**Files:**
- Modify: `tests/human-audio.test.mjs`
- Test: `tests/human-audio.test.mjs`

**Interfaces:**
- Consumes: Manifest files, audio directories, active course IDs, and `recordingCategoryData()`.
- Produces: Assertions that reject missing recordings, orphan files, duplicate filenames, stale manifest IDs, and omitted pending recording targets.

- [ ] **Step 1: Write a failing orphan-audio assertion**

Add an exact set comparison between each manifest’s `.webm` filenames and the `.webm` files in its directory:

```js
assert.deepEqual(
  directoryAudioFiles,
  manifestAudioFiles,
  `${category} audio directory should contain exactly the files listed in its manifest`
);
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/human-audio.test.mjs
```

Expected: FAIL listing only genuinely unreferenced audio files, if any exist.

- [ ] **Step 3: Add recording-target coverage assertions**

Assert that every active letter, combination, vocabulary item, and reading item appears exactly once in the recording categories, and that practice files remain empty because practice reuses alphabet audio.

- [ ] **Step 4: Re-run the focused test**

Expected: It remains red only for confirmed inventory mismatches, not because of malformed test setup.

### Task 3: Remove Confirmed Redundant Audio and Repair Metadata

**Files:**
- Delete only: Explicit `.webm` paths reported as unreferenced by Task 2.
- Modify if required: `prototype/assets/audio/human/*/manifest.json`
- Modify if required: `prototype/course-data/*.js`
- Modify if required: `prototype/app.js`

**Interfaces:**
- Consumes: The failing exact-set and recording-coverage assertions.
- Produces: A one-to-one relationship between active recorded items, manifests, and files.

- [ ] **Step 1: Resolve each mismatch**

For every reported path, verify it is absent from all course data, recording targets, manifests, and rendered audio URLs. Delete only files that satisfy all four checks; otherwise repair the stale manifest or mapping instead.

- [ ] **Step 2: Run the focused test**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/human-audio.test.mjs
```

Expected: PASS with all manifest/file/target sets aligned.

- [ ] **Step 3: Inspect retained file integrity**

Check every retained `.webm` has a WebM/Matroska signature, is larger than 4096 bytes, and can load audio metadata in the browser.

Expected: No zero-duration, unreadable, or truncated retained files.

### Task 4: Verify All Course and Recording Screens

**Files:**
- Read through browser: `prototype/index.html`
- Test: `tests/unit-learning-experience.test.mjs`
- Test: `tests/course-data-integrity.test.mjs`

**Interfaces:**
- Consumes: The rendered learning path, every lesson group, every item detail, and every recording category/mode.
- Produces: A browser audit report with page/item counts, missing text, disabled audio counts, visual overflow, and runtime errors.

- [ ] **Step 1: Audit every content route**

Navigate through the nine units and enumerate all group/item screens. Check for `undefined`, `null`, placeholder copy, empty fields, duplicate IDs, horizontal overflow, and missing buttons.

- [ ] **Step 2: Audit the recording center**

Verify category totals, recorded/pending totals, first and last targets, and that every pending item has a deterministic download filename.

- [ ] **Step 3: Sample-play retained audio**

Load metadata for every retained WebM and play representative files from alphabet, combo, and vocabulary categories.

Expected: Metadata loads for all retained files; representative play controls are enabled.

### Task 5: Final Verification

**Files:**
- Verify: `prototype/`
- Verify: `tests/`
- Verify: `scripts/check-project.mjs`

**Interfaces:**
- Consumes: All changes from Tasks 1–4.
- Produces: Fresh evidence that content, audio coverage, orphan detection, browser rendering, and project checks all pass.

- [ ] **Step 1: Run all automated tests**

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test tests/*.test.mjs
```

Expected: All test files pass with zero failures.

- [ ] **Step 2: Run the complete project check**

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs
```

Expected: `All project checks passed.`

- [ ] **Step 3: Re-run the orphan and missing-file inventory**

Expected: Zero missing manifest files, zero unlisted WebM files, zero duplicate target IDs, and zero duplicate practice audio files.

