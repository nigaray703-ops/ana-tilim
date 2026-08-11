# Perceived Loudness Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Normalize all 552 retained human WebM files and every future recording-studio take to one perceived-loudness standard without changing course IDs, recording text, or paths.

**Architecture:** A focused synchronous Node module owns the versioned EBU R128 configuration, strict `ffmpeg` discovery, piped two-pass `loudnorm` execution, and output verification without temporary take files. A separate batch controller builds the manifest-backed physical inventory, stages and validates all outputs, then applies them with per-file backups and a durable journal; the recording workspace reuses the same normalizer before persisting a take. The website continues to play normalized WebM/Opus files directly and gains no runtime gain table.

**Tech Stack:** Node.js ESM, `node:test`, local `ffmpeg` with `loudnorm`, WebM/Opus, existing recording catalog/workspace/importer/server, existing project check runner.

## Global Constraints

- Integrated loudness target is exactly `-20 LUFS`, selected after a read-only 552-file census showed this is the loudest common target that preserves the `-1.5 dBTP` release ceiling without audible compression of high-crest phonemes.
- Maximum true peak is exactly `-1.5 dBTP`.
- Loudness-range ceiling is exactly `20 LU`; the real inventory peaks at `8.7 LU`, so this keeps every approved recording on FFmpeg's linear path and avoids dynamic compression.
- Output stays WebM/Opus at the existing relative path and stable ID.
- The current inventory must resolve 554 recording targets to exactly 552 unique physical files under `prototype/assets/audio/human`.
- Analysis and staging must complete for all 552 files before any course audio replacement starts.
- A batch failure must never leave a partially normalized course tree; changed files are restored individually from exact backups.
- New recording-studio takes are normalized before they enter the take list, approval state, or import flow.
- Import preview remains zero-write and imports the exact normalized take SHA.
- No runtime browser gain table, course text change, new recording ID, content edit, denoising, speed change, or recursive/bulk deletion is allowed.
- `ffmpeg` is a free local tool only; the binary is never committed or deployed.
- Preserve the untracked user-owned `课程/审计报告/` directory and never stage it.

---

### Task 1: Versioned Loudness Engine

**Files:**
- Create: `tools/lib/audio-loudness.mjs`
- Create: `tests/audio-loudness.test.mjs`
- Modify: `scripts/check-project.mjs`

**Interfaces:**
- Produces: `LOUDNESS_STANDARD`, `resolveFfmpegPath({ env, pathValue, fsApi, spawnSync })`, `parseLoudnormAnalysis(stderr)`, and `normalizeWebmBuffer({ buffer, ffmpegPath, spawnSync })`.
- `normalizeWebmBuffer` returns `{ buffer: Buffer, report: { configVersion, input, output } }`, where each measurement has finite `integratedLufs`, `truePeakDbtp`, `lraLu`, and `thresholdLufs` values.

- [ ] **Step 1: Write the failing configuration and parser tests**

```js
import { LOUDNESS_STANDARD, parseLoudnormAnalysis } from "../tools/lib/audio-loudness.mjs";

assert.deepEqual(LOUDNESS_STANDARD, {
  version: "ana-tilim-loudness-v3",
  integratedLufs: -20,
  truePeakDbtp: -1.5,
  lraLu: 20,
  integratedToleranceLu: 1,
  durationToleranceMs: 100
});
assert.equal(parseLoudnormAnalysis(stderr).integratedLufs, -26.31);
assert.throws(() => parseLoudnormAnalysis('"input_i" : "-inf"'), /finite loudness/);
```

- [ ] **Step 2: Run the focused test and verify the module is missing**

Run: `BUNDLED_NODE=/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node; "$BUNDLED_NODE" --test tests/audio-loudness.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `tools/lib/audio-loudness.mjs`.

- [ ] **Step 3: Implement strict tool resolution and loudnorm parsing**

```js
export const LOUDNESS_STANDARD = Object.freeze({
  version: "ana-tilim-loudness-v3",
  integratedLufs: -20,
  truePeakDbtp: -1.5,
  lraLu: 20,
  integratedToleranceLu: 1,
  durationToleranceMs: 100
});

export function parseLoudnormAnalysis(stderr) {
  const matches = [...String(stderr).matchAll(/\{[\s\S]*?"input_i"[\s\S]*?\}/gu)];
  assert.ok(matches.length, "ffmpeg loudnorm analysis is missing");
  const raw = JSON.parse(matches.at(-1)[0]);
  const measurement = {
    integratedLufs: Number(raw.input_i ?? raw.output_i),
    truePeakDbtp: Number(raw.input_tp ?? raw.output_tp),
    lraLu: Number(raw.input_lra ?? raw.output_lra),
    thresholdLufs: Number(raw.input_thresh ?? raw.output_thresh),
    offsetLu: Number(raw.target_offset ?? 0)
  };
  assert.ok(Object.values(measurement).every(Number.isFinite), "ffmpeg must return finite loudness measurements");
  return measurement;
}
```

- [ ] **Step 4: Add RED tests for three piped passes and zero temporary audio files**

The fake `spawnSync` records exact argv and stdin bytes for analysis, normalization, and output verification while returning explicit `{ status, stdout, stderr }` results. Assert all inputs use `pipe:0`, the normalized WebM returns from `pipe:1`, and the second pass includes measured I/LRA/TP/threshold/offset, `linear=true`, `-c:a libopus`, `-map_metadata -1`, and the fixed targets. Inject failures in each pass and assert the filesystem is never called.

- [ ] **Step 5: Implement `normalizeWebmBuffer` with three fail-closed passes**

```js
const firstPass = `loudnorm=I=-20:TP=-1.8:LRA=20:print_format=json`;
const secondPass = [
  "loudnorm=I=-20:TP=-1.8:LRA=20",
  `measured_I=${input.integratedLufs}`,
  `measured_LRA=${input.lraLu}`,
  `measured_TP=${input.truePeakDbtp}`,
  `measured_thresh=${input.thresholdLufs}`,
  `offset=${input.offsetLu}`,
  "linear=true:print_format=json"
].join(":");
```

Pass the input buffer through `spawnSync` stdin, capture normalized WebM from stdout, and pass that buffer through stdin for verification. Set a fixed buffer ceiling above the 20 MiB upload limit. Validate input/output with `validateWebmBuffer`, verify duration drift is at most `max(100ms, inputDuration * 0.03)`, verify `abs(output.integratedLufs + 20) <= 1`, and verify `output.truePeakDbtp <= -1.5`.

- [ ] **Step 6: Run focused tests and wire them into the full checker**

Run: `"$BUNDLED_NODE" --test tests/audio-loudness.test.mjs`

Expected: PASS, including missing tool, unsupported `loudnorm`, non-zero exit, silent/nonfinite analysis, output peak, duration, WebM, symlink, and zero temporary audio-file cases.

Add to `scripts/check-project.mjs`:

```js
{
  label: "test: perceived audio loudness",
  command: nodePath,
  args: ["--test", "tests/audio-loudness.test.mjs"]
}
```

- [ ] **Step 7: Commit Task 1**

```bash
git add -- tools/lib/audio-loudness.mjs tests/audio-loudness.test.mjs scripts/check-project.mjs
git diff --cached --check
git commit -m "feat: add perceived loudness engine"
```

---

### Task 2: Manifest-Backed Batch Preparation

**Files:**
- Create: `tools/human-audio-loudness-batch.mjs`
- Create: `tests/human-audio-loudness-batch.test.mjs`
- Modify: `scripts/check-project.mjs`

**Interfaces:**
- Consumes: `LOUDNESS_STANDARD` and `normalizeWebmBuffer` from Task 1; `buildRecordingCatalog({ projectRoot })` from `tools/recording-studio/catalog.mjs`.
- Produces: `createHumanAudioLoudnessBatch({ projectRoot, workspaceRoot, ffmpegPath, fsApi, spawnSync })` with `prepare({ batchId })`, `apply({ planPath })`, and `readPlan({ planPath })`.
- A plan is schema version 1 and contains exactly 552 unique operations sorted by relative path, plus all 554 stable IDs and their physical-file association.

- [ ] **Step 1: Write the failing physical-inventory test**

```js
const controller = createHumanAudioLoudnessBatch(fixture);
const inventory = controller.buildInventory();
assert.equal(inventory.targets.length, 554);
assert.equal(inventory.files.length, 552);
assert.equal(new Set(inventory.files.map((item) => item.relativePath)).size, 552);
assert.ok(inventory.files.every((item) => item.relativePath.startsWith("prototype/assets/audio/human/")));
```

The fixture uses three logical targets and two physical files so the test also proves safe reuse deduplication.

- [ ] **Step 2: Run the test and verify the batch module is missing**

Run: `"$BUNDLED_NODE" --test tests/human-audio-loudness-batch.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `tools/human-audio-loudness-batch.mjs`.

- [ ] **Step 3: Implement strict inventory construction**

Resolve each catalog target's `absoluteOutputPath`, require it to be a regular non-symlink file within the real `prototype/assets/audio/human` root, group identical real paths, and reject target/path drift, traversal, duplicate path aliases, catalog omissions, or a WebM file on disk that is not represented by the recording catalog.

- [ ] **Step 4: Add RED tests for zero-write analysis and all-or-nothing staging**

Snapshot the fixture project tree before `prepare`. Inject a normalizer that succeeds for the first file and fails for the second. Assert every course byte and path is unchanged, no `plan.json` is published, and the failed batch records only an explicit error report under its batch workspace.

- [ ] **Step 5: Implement full staging and immutable plan publication**

For each source, record original SHA/size/duration, normalize to the matching relative path under `recording-workspace/loudness-batches/<batchId>/staged/`, and record output SHA/size/duration/input-output loudness. Only after all operations validate, atomically publish `plan.json` containing:

```js
{
  schemaVersion: 1,
  configVersion: "ana-tilim-loudness-v3",
  batchId,
  createdAt,
  status: "prepared",
  projectRootHash,
  targetCount: 554,
  physicalFileCount: 552,
  operations
}
```

- [ ] **Step 6: Add plan-integrity and stale-source tests**

Mutate one staged file, one original source, `batchId`, config version, operation order, duplicate a relative path, and replace a directory component with a symlink. `readPlan` and `apply` must reject each mutation before a course file is written.

- [ ] **Step 7: Run tests, wire the checker, and commit Task 2**

```bash
"$BUNDLED_NODE" --test tests/human-audio-loudness-batch.test.mjs
git add -- tools/human-audio-loudness-batch.mjs tests/human-audio-loudness-batch.test.mjs scripts/check-project.mjs
git diff --cached --check
git commit -m "feat: stage human audio loudness batches"
```

---

### Task 3: Atomic Batch Application and Recovery

**Files:**
- Modify: `tools/human-audio-loudness-batch.mjs`
- Modify: `tests/human-audio-loudness-batch.test.mjs`

**Interfaces:**
- Consumes: a still-valid prepared plan from Task 2.
- Produces: `apply({ planPath }) -> { batchId, status: "applied", appliedAt, operations }` and `recover({ planPath }) -> { batchId, status: "recovered", recoveredAt }`.
- Backups live at `recording-workspace/loudness-batches/<batchId>/backups/<original-relative-path>`; the journal is `journal.json` in the same batch root.

- [ ] **Step 1: Write the failing backup-before-first-write test**

Inject a backup write failure for operation 2. Assert operation 1's course file was never replaced, every source SHA remains original, and the journal status is `backup-failed`.

- [ ] **Step 2: Implement complete backup preflight**

Copy each original into the exact backup tree with exclusive creation, fsync the file, verify its SHA against `originalSha256`, and publish the journal only after all 552 backups verify. No replacement begins while any backup is absent or invalid.

- [ ] **Step 3: Write the failing middle-replacement rollback test**

Inject a rename failure on operation 2 after operation 1 has been replaced. Assert operation 1 is restored byte-for-byte from its exact backup, operation 2 and later files retain original SHA, and backups/journal remain present.

- [ ] **Step 4: Implement per-file atomic replacement and rollback**

For each operation, copy the staged bytes to an exclusive same-directory temporary file, fsync it, verify staged SHA, rename it over the source, fsync the source directory, and append the stable operation identity to the journal. On failure, restore only journaled files one at a time from verified backups, never recursively remove a path, and set journal status to `recovered` or `manual-recovery-required`.

- [ ] **Step 5: Add restart recovery, idempotency, and static deletion tests**

Prove a process restart can read an `applying` journal and recover changed files. Prove a second `apply` cannot reapply an applied plan. Source-scan the module and reject `rmSync`, `rmdirSync`, `rm -rf`, `Remove-Item -Recurse`, recursive deletion options, or wildcard deletion.

- [ ] **Step 6: Run tests and commit Task 3**

```bash
"$BUNDLED_NODE" --test tests/human-audio-loudness-batch.test.mjs
git add -- tools/human-audio-loudness-batch.mjs tests/human-audio-loudness-batch.test.mjs
git diff --cached --check
git commit -m "feat: apply loudness batches atomically"
```

---

### Task 4: Normalize Future Recording-Studio Takes

**Files:**
- Modify: `tools/recording-studio/workspace.mjs`
- Modify: `tools/recording-studio/server.mjs`
- Modify: `tools/recording-studio/public/app.js`
- Modify: `tests/recording-studio-workspace.test.mjs`
- Modify: `tests/recording-studio-server.test.mjs`
- Modify: `tests/recording-studio-ui.test.mjs`

**Interfaces:**
- Consumes: `normalizeWebmBuffer` and `LOUDNESS_STANDARD` from Task 1.
- `createRecordingWorkspace` gains injectable `normalizeTake`, defaulting to the production loudness normalizer.
- `saveTake` validates raw WebM, normalizes it, validates normalized WebM, and only then reads or mutates workspace state.
- Import-preview API adds `loudnessStandard: { version, integratedLufs, truePeakDbtp, lraLu }` without exposing local paths.

- [ ] **Step 1: Write the failing normalized-take persistence test**

```js
const normalizedBytes = Buffer.from(validNormalizedWebm);
const workspace = createRecordingWorkspace({
  ...options,
  normalizeTake: ({ buffer }) => ({ buffer: normalizedBytes, report })
});
const take = workspace.saveTake({ stableId: "alphabet:aa", buffer: rawBytes });
assert.equal(fs.readFileSync(path.join(options.workspaceRoot, take.relativePath)).equals(normalizedBytes), true);
assert.equal(take.sha256, sha256(normalizedBytes));
```

- [ ] **Step 2: Run the workspace test and verify it stores raw bytes**

Run: `"$BUNDLED_NODE" --test tests/recording-studio-workspace.test.mjs`

Expected: FAIL because `saveTake` currently validates and persists the uploaded buffer directly.

- [ ] **Step 3: Implement pre-state normalization with atomic failure behavior**

Call `validateWebmBuffer(buffer)`, then `normalizeTake({ buffer, stableId })`, then validate the returned buffer. Only after those calls succeed may `readState()`, `ensureDirectory`, or `writeState` run. Existing workspace tests inject a deterministic passthrough normalizer; dedicated tests prove the production default is selected when none is injected.

- [ ] **Step 4: Add failure and exact-SHA regressions**

Throw from `normalizeTake` after it has inspected the raw buffer. Assert the workspace tree, state bytes, take count, approved state, and course audio are unchanged. Approve and import a normalized test take and assert importer preview/application use the normalized SHA and bytes, never the raw upload SHA.

- [ ] **Step 5: Add the loudness standard to preview and UI**

Extend `publicPlan` with:

```js
loudnessStandard: {
  version: LOUDNESS_STANDARD.version,
  integratedLufs: -20,
  truePeakDbtp: -1.5,
  lraLu: 20
}
```

Render the exact text `感知响度：-20 LUFS · 真峰值不高于 -1.5 dBTP` next to import details. Keep preview zero-write and preserve all current focus, retry, immutable-target, and playback-before-finalize gates.

- [ ] **Step 6: Run recording-studio suites and commit Task 4**

```bash
"$BUNDLED_NODE" --test tests/recording-studio-workspace.test.mjs tests/recording-studio-importer.test.mjs tests/recording-studio-server.test.mjs tests/recording-studio-ui.test.mjs
git add -- tools/recording-studio/workspace.mjs tools/recording-studio/server.mjs tools/recording-studio/public/app.js tests/recording-studio-workspace.test.mjs tests/recording-studio-server.test.mjs tests/recording-studio-ui.test.mjs
git diff --cached --check
git commit -m "feat: normalize future recording takes"
```

---

### Task 5: Real Tool Gate and Full 552-File Batch

**Files:**
- Modify: `prototype/assets/audio/human/**/*.webm` (exact 552-file inventory from the prepared plan)
- Create outside Git: `recording-workspace/loudness-batches/<batchId>/plan.json`
- Create outside Git: `recording-workspace/loudness-batches/<batchId>/journal.json`
- Create outside Git: `recording-workspace/loudness-batches/<batchId>/report.json`

**Interfaces:**
- Consumes: Tasks 1-4 and a locally installed `ffmpeg` supporting `loudnorm` and `libopus`.
- Produces: normalized source audio and an auditable applied batch whose backups remain outside Git.

- [ ] **Step 1: Resolve or install the local free tool with separate authorization**

Run read-only discovery first:

```bash
command -v ffmpeg
ffmpeg -hide_banner -filters
ffmpeg -hide_banner -encoders
```

Require `loudnorm` and `libopus`. If absent, request approval for one narrowly scoped local installation; do not modify course audio during installation.

- [ ] **Step 2: Run real engine integration fixtures**

Use copied WebM fixtures representing over-loud, quiet, and near-target inputs. Verify actual output WebM/Opus, duration, integrated loudness tolerance, true peak, repeatability, and absence of temporary take files before touching the 552 source files.

- [ ] **Step 3: Prepare the real batch without source writes**

```bash
ANA_TILIM_FFMPEG=/absolute/path/to/ffmpeg "$BUNDLED_NODE" tools/human-audio-loudness-batch.mjs prepare --project-root "$PWD" --workspace-root "$PWD/recording-workspace" --batch-id 2026-08-12-human-audio-v1
```

Snapshot all 552 original SHAs before the command and compare them after it. Expected: all original SHAs remain identical; plan reports 554 targets, 552 files, zero failures, and 552 validated staged outputs.

- [ ] **Step 4: Review objective outliers before application**

Read `report.json` and reject the batch if it contains nonfinite values, silence, duration drift, output outside `-20 ± 1 LUFS`, true peak above `-1.5 dBTP`, missing target, or an unrepresented disk file. Record minimum, median, maximum, and the new `غ` measurement without changing speech content.

- [ ] **Step 5: Apply the reviewed batch atomically**

```bash
ANA_TILIM_FFMPEG=/absolute/path/to/ffmpeg "$BUNDLED_NODE" tools/human-audio-loudness-batch.mjs apply --project-root "$PWD" --workspace-root "$PWD/recording-workspace" --plan "$PWD/recording-workspace/loudness-batches/2026-08-12-human-audio-v1/plan.json"
```

Expected: journal status `applied`; all 552 current SHAs equal their planned output SHAs; all 552 verified backups equal the original SHAs.

- [ ] **Step 6: Run audio and full project verification**

```bash
"$BUNDLED_NODE" --test tests/audio-loudness.test.mjs tests/human-audio-loudness-batch.test.mjs tests/webm-audio.test.mjs tests/human-audio.test.mjs tests/recording-studio-catalog.test.mjs tests/recording-studio-workspace.test.mjs tests/recording-studio-importer.test.mjs tests/recording-studio-server.test.mjs tests/recording-studio-ui.test.mjs
ANA_TILIM_CN_SITE=/absolute/approved/cn-scratch "$BUNDLED_NODE" scripts/check-project.mjs
```

Expected: 552 physical WebM files, 554 recording targets, all course-audio mappings valid, edition parity passes, render checks pass, and `All project checks passed.`

- [ ] **Step 7: Commit only the planned audio set**

```bash
git add -- prototype/assets/audio/human
git diff --cached --check
git diff --cached --name-only | wc -l
git commit -m "feat: normalize human audio loudness"
```

Expected: exactly the 552 planned WebM paths are staged; `recording-workspace/`, backups, batch reports, and `课程/审计报告/` are absent from the commit.

---

### Task 6: Loudness Release Gate Before Unit 6/7 Work

**Files:**
- Modify: `tests/human-audio.test.mjs`
- Modify: `tests/recording-studio-catalog.test.mjs`
- No deployment or domestic-site write in this task.

**Interfaces:**
- Consumes: normalized audio commit and applied batch report.
- Produces: a frozen verification record that permits the separate Unit 6/7 implementation plan to begin.

- [ ] **Step 1: Add persistent source-level loudness coverage**

Assert the catalog still resolves all 554 recording targets and all 552 physical files. Add a release-only branch gated by `ANA_TILIM_FFMPEG`: it analyzes every unique physical file, requires finite measurements, `abs(integratedLufs + 20) <= 1`, and `truePeakDbtp <= -1.5`. Without that explicit environment variable, the test retains its existing WebM, path, manifest, and course-binding checks and never invokes a local binary.

- [ ] **Step 2: Verify representative browser playback**

Serve the project over loopback and play representative alphabet, form-example, combo, vocabulary, short sentence, long reading, and the new `غ` file. Confirm no console errors, no clipped audio controls, and no unusually loud or quiet transition in the fixed sample sequence.

- [ ] **Step 3: Verify future-take failure and success paths in the real studio**

With a valid tool path, save one isolated fixture take and verify normalized SHA/measurements before approval. With an invalid tool path, retry another isolated upload and verify no new take/state/course file. Do not record or delete user audio during this verification.

- [ ] **Step 4: Run the final fresh full check and freeze scope**

Run the full project checker with the approved ignored CN scratch, `git diff --check`, `git status --short`, and `git log --oneline`. Confirm only intended source/tests and 552 WebM files changed; preserve all ignored reports and backups.

- [ ] **Step 5: Commit any test-only release gate change**

```bash
git add -- tests/human-audio.test.mjs tests/recording-studio-catalog.test.mjs
git diff --cached --check
git commit -m "test: lock human audio loudness coverage"
```

Expected: the two tests contain the persistent 554-target/552-file contract and the explicit release-only full loudness measurement gate; commit only those exact test changes.

After this task passes, execute the separate approved Unit 6/7 five-step plan. Domestic synchronization and both deployments remain later release steps, after Unit 6/7 and the final combined checks, matching the user's fixed order.
