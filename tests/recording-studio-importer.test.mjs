import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createImportController } from "../tools/recording-studio/importer.mjs";
import { createRecordingWorkspace } from "../tools/recording-studio/workspace.mjs";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const referenceWebm = fs.readFileSync(path.join(repositoryRoot, "prototype/assets/audio/human/alphabet/human_letter_01_b.webm"));

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function textHash(target) {
  return sha256(JSON.stringify({ value: target.value, latin: target.latin, meaning: target.meaning, english: target.english }));
}

function changedWebm(offset) {
  const copy = Buffer.from(referenceWebm);
  copy[copy.length - offset] ^= 1;
  return copy;
}

function normalizeTake({ stableId, buffer }) {
  const normalized = Buffer.from(buffer);
  if (stableId === "alphabet:existing") normalized[normalized.length - 3] ^= 1;
  if (stableId === "vocab:created") normalized[normalized.length - 4] ^= 1;
  return {
    buffer: normalized,
    report: { configVersion: "ana-tilim-loudness-v2" }
  };
}

function makeTarget({ stableId, category, currentFile, absoluteOutputPath }) {
  const target = {
    stableId,
    category,
    currentFile,
    absoluteOutputPath,
    value: stableId,
    latin: `${stableId}-latin`,
    meaning: `${stableId}-meaning`,
    english: `${stableId}-english`,
    playable: true,
    initialStatus: "pending-review"
  };
  target.recordingTextHash = textHash(target);
  return target;
}

function createFixture({ fsApi, symlinkedExistingDirectory = false } = {}) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-import-project-"));
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-import-workspace-"));
  const audioRoot = path.join(projectRoot, "prototype/assets/audio/human");
  const paths = {
    existing: path.join(audioRoot, "alphabet/existing.webm"),
    created: path.join(audioRoot, "vocab/created.webm"),
    unchanged: path.join(audioRoot, "reading/unchanged.webm")
  };
  fs.mkdirSync(audioRoot, { recursive: true });
  if (symlinkedExistingDirectory) {
    const outside = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-import-outside-"));
    fs.symlinkSync(outside, path.join(audioRoot, "alphabet"));
  } else {
    fs.mkdirSync(path.dirname(paths.existing), { recursive: true });
  }
  for (const targetPath of [paths.created, paths.unchanged]) fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(paths.existing, referenceWebm);
  fs.writeFileSync(paths.unchanged, referenceWebm);

  const catalog = {
    schemaVersion: 1,
    targets: [
      makeTarget({ stableId: "alphabet:existing", category: "alphabet", currentFile: "existing.webm", absoluteOutputPath: paths.existing }),
      makeTarget({ stableId: "vocab:created", category: "vocab", currentFile: "created.webm", absoluteOutputPath: paths.created }),
      makeTarget({ stableId: "reading:unchanged", category: "reading", currentFile: "unchanged.webm", absoluteOutputPath: paths.unchanged })
    ]
  };
  const workspace = createRecordingWorkspace({ projectRoot, workspaceRoot, catalog, normalizeTake });
  workspace.loadState();
  const existingTake = workspace.saveTake({ stableId: "alphabet:existing", buffer: changedWebm(1), createdAt: "2026-08-10T01:00:00.000Z" });
  const createdTake = workspace.saveTake({ stableId: "vocab:created", buffer: changedWebm(2), createdAt: "2026-08-10T01:01:00.000Z" });
  const unchangedTake = workspace.saveTake({ stableId: "reading:unchanged", buffer: referenceWebm, createdAt: "2026-08-10T01:02:00.000Z" });
  workspace.approveTake({ stableId: "alphabet:existing", takeId: existingTake.id });
  workspace.approveTake({ stableId: "vocab:created", takeId: createdTake.id });
  workspace.approveTake({ stableId: "reading:unchanged", takeId: unchangedTake.id });
  const controller = createImportController({ projectRoot, workspaceRoot, catalog, workspace, ...(fsApi ? { fsApi } : {}) });
  return { projectRoot, workspaceRoot, audioRoot, paths, catalog, workspace, controller, takes: { existingTake, createdTake, unchangedTake } };
}

function bytesAt(targetPath) {
  return fs.existsSync(targetPath) ? fs.readFileSync(targetPath) : null;
}

function statePath(fixture) {
  return path.join(fixture.workspaceRoot, "state.json");
}

function snapshotWorkspaceTree(root) {
  const entries = [];
  function visit(current, relative) {
    const stat = fs.lstatSync(current);
    const entry = { relative, mode: stat.mode, type: stat.isSymbolicLink() ? "symlink" : stat.isDirectory() ? "directory" : "file" };
    if (stat.isSymbolicLink()) entry.link = fs.readlinkSync(current);
    if (stat.isFile()) entry.bytes = fs.readFileSync(current).toString("base64");
    entries.push(entry);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(current).sort()) visit(path.join(current, name), path.join(relative, name));
    }
  }
  visit(root, ".");
  return entries;
}

test("preview is read-only and lists only changed approved takes", () => {
  const fixture = createFixture();
  const before = {
    state: fs.readFileSync(statePath(fixture)),
    existing: bytesAt(fixture.paths.existing),
    created: bytesAt(fixture.paths.created),
    unchanged: bytesAt(fixture.paths.unchanged)
  };

  const plan = fixture.controller.previewImport();

  assert.match(plan.planId, /^[a-f0-9]{64}$/);
  assert.match(plan.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(plan.operations.map((operation) => operation.stableId), ["alphabet:existing", "vocab:created"]);
  assert.deepEqual(fs.readFileSync(statePath(fixture)), before.state);
  assert.deepEqual(bytesAt(fixture.paths.existing), before.existing);
  assert.deepEqual(bytesAt(fixture.paths.created), before.created);
  assert.deepEqual(bytesAt(fixture.paths.unchanged), before.unchanged);
  assert.equal(fs.existsSync(path.join(fixture.workspaceRoot, "backups")), false);
});

test("accepts the macOS /var and /private/var aliases for an existing validated workspace", () => {
  const fixture = createFixture();
  const alternateRoot = fixture.workspaceRoot.startsWith("/var/")
    ? `/private${fixture.workspaceRoot}`
    : fixture.workspaceRoot.startsWith("/private/var/")
      ? fixture.workspaceRoot.slice("/private".length)
      : null;
  assert.ok(alternateRoot, "test host must expose a macOS temporary-directory alias");
  const alternateWorkspace = createRecordingWorkspace({ projectRoot: fixture.projectRoot, workspaceRoot: alternateRoot, catalog: fixture.catalog, normalizeTake });
  const controller = createImportController({ projectRoot: fixture.projectRoot, workspaceRoot: alternateRoot, catalog: fixture.catalog, workspace: alternateWorkspace });

  assert.deepEqual(controller.previewImport().operations.map((operation) => operation.stableId), ["alphabet:existing", "vocab:created"]);
});

test("strict Task 3 state validation rejects malformed approved takes before any preview write", () => {
  const cases = [
    {
      label: "missing duration",
      mutate(state) { delete state.targets["alphabet:existing"].takes[0].durationMs; },
      expected: /invalid duration/
    },
    {
      label: "invalid approval linkage",
      mutate(state) { state.targets["alphabet:existing"].approvedTakeId = null; },
      expected: /approved take ID/
    }
  ];
  for (const testCase of cases) {
    const fixture = createFixture();
    const file = statePath(fixture);
    const state = JSON.parse(fs.readFileSync(file, "utf8"));
    testCase.mutate(state);
    fs.writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`);
    const before = fs.readFileSync(file);

    assert.throws(() => fixture.controller.previewImport(), testCase.expected, testCase.label);
    assert.deepEqual(fs.readFileSync(file), before, `${testCase.label} state bytes must remain unchanged`);
    assert.equal(fs.existsSync(path.join(fixture.workspaceRoot, "backups")), false);
  }
});

test("preview leaves a valid pending Task 3 rollback journal and orphan take completely untouched", () => {
  const fixture = createFixture();
  const state = JSON.parse(fs.readFileSync(statePath(fixture), "utf8"));
  state.targets["alphabet:existing"].status = "pending-review";
  state.targets["alphabet:existing"].approvedTakeId = null;
  state.targets["alphabet:existing"].takes = [];
  fs.writeFileSync(statePath(fixture), `${JSON.stringify(state, null, 2)}\n`);
  const take = fixture.takes.existingTake;
  const recoveryDirectory = path.join(fixture.workspaceRoot, "recovery");
  fs.mkdirSync(recoveryDirectory, { recursive: true });
  fs.writeFileSync(path.join(recoveryDirectory, `rollback-${take.id}.json`), `${JSON.stringify({
    schemaVersion: 1,
    stableId: "alphabet:existing",
    takeId: take.id,
    relativePath: take.relativePath,
    sha256: take.sha256,
    createdAt: "2026-08-10T01:00:01.000Z"
  }, null, 2)}\n`);
  const before = snapshotWorkspaceTree(fixture.workspaceRoot);
  const beforeState = fs.readFileSync(statePath(fixture));
  const beforeTargets = { existing: bytesAt(fixture.paths.existing), created: bytesAt(fixture.paths.created), unchanged: bytesAt(fixture.paths.unchanged) };

  fixture.controller.previewImport();

  assert.deepEqual(snapshotWorkspaceTree(fixture.workspaceRoot), before);
  assert.deepEqual(fs.readFileSync(statePath(fixture)), beforeState);
  assert.deepEqual(bytesAt(fixture.paths.existing), beforeTargets.existing);
  assert.deepEqual(bytesAt(fixture.paths.created), beforeTargets.created);
  assert.deepEqual(bytesAt(fixture.paths.unchanged), beforeTargets.unchanged);
});

test("rejects stale plans and every changed preflight input before writing", () => {
  const fixture = createFixture();
  const plan = fixture.controller.previewImport();
  const beforeState = fs.readFileSync(statePath(fixture));
  fs.writeFileSync(fixture.paths.existing, changedWebm(3));

  assert.throws(() => fixture.controller.applyImport({ planId: plan.planId }), /target.*changed|stale/i);
  assert.deepEqual(fs.readFileSync(statePath(fixture)), beforeState);
  assert.equal(fs.existsSync(path.join(fixture.workspaceRoot, "backups")), false);
  assert.throws(() => fixture.controller.applyImport({ planId: plan.planId }), /unknown|stale|replayed/i);
  assert.throws(() => fixture.controller.applyImport({ planId: "0".repeat(64) }), /unknown|stale/i);
});

test("rejects changed approved-take bytes and catalog text before backup creation", () => {
  const fixture = createFixture();
  const plan = fixture.controller.previewImport();
  const takePath = path.join(fixture.workspaceRoot, fixture.takes.existingTake.relativePath);
  fs.writeFileSync(takePath, changedWebm(4));

  assert.throws(() => fixture.controller.applyImport({ planId: plan.planId }), /take content hash does not match|approved take has changed/i);
  assert.equal(fs.existsSync(path.join(fixture.workspaceRoot, "backups")), false);

  const catalogFixture = createFixture();
  const catalogPlan = catalogFixture.controller.previewImport();
  catalogFixture.catalog.targets.find((target) => target.stableId === "alphabet:existing").recordingTextHash = "0".repeat(64);
  assert.throws(() => catalogFixture.controller.applyImport({ planId: catalogPlan.planId }), /stale recording text/i);
  assert.equal(fs.existsSync(path.join(catalogFixture.workspaceRoot, "backups")), false);
});

test("imports exact replacements with exact backups and a restart-readable imported state", () => {
  const fixture = createFixture();
  const plan = fixture.controller.previewImport();
  const oldExisting = bytesAt(fixture.paths.existing);
  const result = fixture.controller.applyImport({ planId: plan.planId });

  assert.match(result.importId, /^[A-Za-z0-9-]+$/);
  assert.deepEqual(bytesAt(fixture.paths.existing), fs.readFileSync(fixture.workspace.getTakePath({ stableId: "alphabet:existing", takeId: fixture.takes.existingTake.id })));
  assert.deepEqual(bytesAt(fixture.paths.created), fs.readFileSync(fixture.workspace.getTakePath({ stableId: "vocab:created", takeId: fixture.takes.createdTake.id })));
  assert.deepEqual(bytesAt(fixture.paths.unchanged), referenceWebm);
  assert.equal(result.operations.length, 2);
  const existingOperation = result.operations.find((operation) => operation.stableId === "alphabet:existing");
  assert.deepEqual(fs.readFileSync(existingOperation.backupPath), oldExisting);
  assert.equal(sha256(fs.readFileSync(existingOperation.backupPath)), existingOperation.currentSha256);
  const loaded = createRecordingWorkspace({ projectRoot: fixture.projectRoot, workspaceRoot: fixture.workspaceRoot, catalog: fixture.catalog, normalizeTake }).loadState();
  assert.equal(loaded.targets["alphabet:existing"].status, "imported");
  assert.equal(loaded.targets["vocab:created"].status, "imported");
  assert.equal(loaded.targets["reading:unchanged"].status, "approved-take");
  assert.equal(loaded.targets["alphabet:existing"].approvedTakeId, fixture.takes.existingTake.id);
  assert.ok(fs.existsSync(path.join(fixture.workspaceRoot, "imports", `${result.importId}.success.json`)));
});

test("a second replacement failure restores prior bytes, state, and recovery evidence", () => {
  const initial = createFixture();
  const oldExisting = bytesAt(initial.paths.existing);
  const beforeState = fs.readFileSync(statePath(initial));
  const failingFs = Object.assign(Object.create(fs), {
    renameSync(source, destination) {
      if (destination === initial.paths.created && source.includes(".ana-tilim-import-")) throw new Error("injected second replacement failure");
      return fs.renameSync(source, destination);
    }
  });
  const fixture = { ...initial, controller: createImportController({ projectRoot: initial.projectRoot, workspaceRoot: initial.workspaceRoot, catalog: initial.catalog, workspace: initial.workspace, fsApi: failingFs }) };
  const plan = fixture.controller.previewImport();

  assert.throws(() => fixture.controller.applyImport({ planId: plan.planId }), /injected second replacement failure/);
  assert.deepEqual(bytesAt(fixture.paths.existing), oldExisting);
  assert.equal(bytesAt(fixture.paths.created), null);
  assert.deepEqual(fs.readFileSync(statePath(fixture)), beforeState);
  const recoveryRoot = path.join(fixture.workspaceRoot, "failed-imports", plan.planId);
  assert.ok(fs.existsSync(recoveryRoot));
  assert.ok(fs.readdirSync(recoveryRoot).length >= 1);
  assert.ok(fs.readdirSync(path.join(fixture.workspaceRoot, "imports")).some((file) => file.endsWith(".failed.json")));
});

test("a post-rename validation failure still restores the replacement that reached production", () => {
  const initial = createFixture();
  const oldExisting = bytesAt(initial.paths.existing);
  const beforeState = fs.readFileSync(statePath(initial));
  let existingWasRenamed = false;
  const failingFs = Object.assign(Object.create(fs), {
    renameSync(source, destination) {
      if (destination === initial.paths.existing && source.includes(".ana-tilim-import-")) existingWasRenamed = true;
      return fs.renameSync(source, destination);
    },
    readFileSync(targetPath, ...rest) {
      if (existingWasRenamed && targetPath === initial.paths.existing) throw new Error("injected post-rename validation failure");
      return fs.readFileSync(targetPath, ...rest);
    }
  });
  const controller = createImportController({ projectRoot: initial.projectRoot, workspaceRoot: initial.workspaceRoot, catalog: initial.catalog, workspace: initial.workspace, fsApi: failingFs });
  const plan = controller.previewImport();

  assert.throws(() => controller.applyImport({ planId: plan.planId }), /injected post-rename validation failure/);
  assert.deepEqual(bytesAt(initial.paths.existing), oldExisting);
  assert.equal(bytesAt(initial.paths.created), null);
  assert.deepEqual(fs.readFileSync(statePath(initial)), beforeState);
});

test("an expired plan is rejected before backup creation", () => {
  const fixture = createFixture();
  let now = new Date("2026-08-10T01:00:00.000Z");
  const controller = createImportController({
    projectRoot: fixture.projectRoot,
    workspaceRoot: fixture.workspaceRoot,
    catalog: fixture.catalog,
    workspace: fixture.workspace,
    now: () => now
  });
  const plan = controller.previewImport();
  now = new Date("2026-08-10T01:10:01.000Z");

  assert.throws(() => controller.applyImport({ planId: plan.planId }), /expired|stale/i);
  assert.equal(fs.existsSync(path.join(fixture.workspaceRoot, "backups")), false);
});

test("a plan from the future is rejected before backup creation", () => {
  const fixture = createFixture();
  let now = new Date("2026-08-10T01:00:00.000Z");
  const controller = createImportController({
    projectRoot: fixture.projectRoot,
    workspaceRoot: fixture.workspaceRoot,
    catalog: fixture.catalog,
    workspace: fixture.workspace,
    now: () => now
  });
  const plan = controller.previewImport();
  now = new Date("2026-08-10T00:59:59.999Z");

  assert.throws(() => controller.applyImport({ planId: plan.planId }), /expired|stale/i);
  assert.equal(fs.existsSync(path.join(fixture.workspaceRoot, "backups")), false);
});

test("repeated failed attempts preserve separate recovery evidence for the same deterministic plan", () => {
  const fixture = createFixture();
  const failingFs = Object.assign(Object.create(fs), {
    renameSync(source, destination) {
      if (destination === fixture.paths.created && source.includes(".ana-tilim-import-")) throw new Error("injected repeated replacement failure");
      return fs.renameSync(source, destination);
    }
  });
  const first = createImportController({ projectRoot: fixture.projectRoot, workspaceRoot: fixture.workspaceRoot, catalog: fixture.catalog, workspace: fixture.workspace, fsApi: failingFs });
  const firstPlan = first.previewImport();
  assert.throws(() => first.applyImport({ planId: firstPlan.planId }), /injected repeated replacement failure/);
  const recoveryRoot = path.join(fixture.workspaceRoot, "failed-imports", firstPlan.planId);
  const firstFiles = fs.readdirSync(recoveryRoot).sort();

  const second = createImportController({ projectRoot: fixture.projectRoot, workspaceRoot: fixture.workspaceRoot, catalog: fixture.catalog, workspace: fixture.workspace, fsApi: failingFs });
  const secondPlan = second.previewImport();
  assert.equal(secondPlan.planId, firstPlan.planId);
  assert.throws(() => second.applyImport({ planId: secondPlan.planId }), /injected repeated replacement failure/);
  const secondFiles = fs.readdirSync(recoveryRoot).sort();
  assert.ok(secondFiles.length > firstFiles.length);
  for (const file of firstFiles) assert.ok(secondFiles.includes(file));
});

test("a target created after preflight is never overwritten by an approved take", () => {
  const initial = createFixture();
  const injectedExisting = changedWebm(6);
  let stagedCreated = false;
  const racingFs = Object.assign(Object.create(fs), {
    openSync(targetPath, flags, ...rest) {
      if (typeof targetPath === "string" && targetPath.includes("created.webm.ana-tilim-import-") && flags === "wx" && !stagedCreated) {
        stagedCreated = true;
        fs.writeFileSync(initial.paths.created, injectedExisting);
      }
      return fs.openSync(targetPath, flags, ...rest);
    }
  });
  const controller = createImportController({ projectRoot: initial.projectRoot, workspaceRoot: initial.workspaceRoot, catalog: initial.catalog, workspace: initial.workspace, fsApi: racingFs });
  const plan = controller.previewImport();

  assert.throws(() => controller.applyImport({ planId: plan.planId }), /target.*changed|stale/i);
  assert.deepEqual(bytesAt(initial.paths.created), injectedExisting);
});

test("a state-rename failure restores replacements and exact original state bytes", () => {
  const initial = createFixture();
  const oldExisting = bytesAt(initial.paths.existing);
  const beforeState = fs.readFileSync(statePath(initial));
  const failingFs = Object.assign(Object.create(fs), {
    renameSync(source, destination) {
      if (destination === statePath(initial)) throw new Error("injected import state rename failure");
      return fs.renameSync(source, destination);
    }
  });
  const controller = createImportController({ projectRoot: initial.projectRoot, workspaceRoot: initial.workspaceRoot, catalog: initial.catalog, workspace: initial.workspace, fsApi: failingFs });
  const plan = controller.previewImport();

  assert.throws(() => controller.applyImport({ planId: plan.planId }), /injected import state rename failure/);
  assert.deepEqual(bytesAt(initial.paths.existing), oldExisting);
  assert.equal(bytesAt(initial.paths.created), null);
  assert.deepEqual(fs.readFileSync(statePath(initial)), beforeState);
});

test("a staged-write failure leaves production and state unchanged while preserving the staged file", () => {
  const initial = createFixture();
  const beforeState = fs.readFileSync(statePath(initial));
  const beforeExisting = bytesAt(initial.paths.existing);
  let failingDescriptor;
  const failingFs = Object.assign(Object.create(fs), {
    openSync(targetPath, flags, ...rest) {
      const descriptor = fs.openSync(targetPath, flags, ...rest);
      if (typeof targetPath === "string" && targetPath.includes(".ana-tilim-import-") && flags === "wx") failingDescriptor = descriptor;
      return descriptor;
    },
    writeFileSync(target, ...rest) {
      if (target === failingDescriptor) throw new Error("injected staged write failure");
      return fs.writeFileSync(target, ...rest);
    }
  });
  const controller = createImportController({ projectRoot: initial.projectRoot, workspaceRoot: initial.workspaceRoot, catalog: initial.catalog, workspace: initial.workspace, fsApi: failingFs });
  const plan = controller.previewImport();

  assert.throws(() => controller.applyImport({ planId: plan.planId }), /injected staged write failure/);
  assert.deepEqual(bytesAt(initial.paths.existing), beforeExisting);
  assert.equal(bytesAt(initial.paths.created), null);
  assert.deepEqual(fs.readFileSync(statePath(initial)), beforeState);
  assert.ok(fs.readdirSync(path.join(initial.workspaceRoot, "failed-imports", plan.planId)).length >= 1);
});

test("rejects workspace and take symbolic links plus an unwritable target directory before mutation", () => {
  const takeFixture = createFixture();
  const takePath = path.join(takeFixture.workspaceRoot, takeFixture.takes.existingTake.relativePath);
  const preservedTake = `${takePath}.preserved`;
  fs.renameSync(takePath, preservedTake);
  fs.symlinkSync(preservedTake, takePath);
  assert.throws(() => takeFixture.controller.previewImport(), /symbolic link/i);
  assert.equal(fs.existsSync(path.join(takeFixture.workspaceRoot, "backups")), false);

  const workspaceFixture = createFixture();
  const linkParent = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-import-workspace-link-"));
  const linked = path.join(linkParent, "linked");
  fs.symlinkSync(workspaceFixture.workspaceRoot, linked);
  const unsafeWorkspace = createImportController({ projectRoot: workspaceFixture.projectRoot, workspaceRoot: path.join(linked, "nested"), catalog: workspaceFixture.catalog, workspace: workspaceFixture.workspace });
  assert.throws(() => unsafeWorkspace.previewImport(), /symbolic link/i);

  const targetFixture = createFixture();
  const preservedTarget = `${targetFixture.paths.existing}.preserved`;
  fs.renameSync(targetFixture.paths.existing, preservedTarget);
  fs.symlinkSync(preservedTarget, targetFixture.paths.existing);
  assert.throws(() => targetFixture.controller.previewImport(), /symbolic link/i);
  assert.equal(fs.existsSync(path.join(targetFixture.workspaceRoot, "backups")), false);

  const permissionFixture = createFixture();
  const failingFs = Object.assign(Object.create(fs), {
    accessSync(candidate, mode) {
      if (candidate === path.dirname(permissionFixture.paths.existing)) {
        const error = new Error("injected permission failure");
        error.code = "EACCES";
        throw error;
      }
      return fs.accessSync(candidate, mode);
    }
  });
  const permissionController = createImportController({ projectRoot: permissionFixture.projectRoot, workspaceRoot: permissionFixture.workspaceRoot, catalog: permissionFixture.catalog, workspace: permissionFixture.workspace, fsApi: failingFs });
  assert.throws(() => permissionController.previewImport(), /injected permission failure/);
  assert.equal(fs.existsSync(path.join(permissionFixture.workspaceRoot, "backups")), false);
});

test("rejects an output symlink before backup creation", () => {
  const fixture = createFixture({ symlinkedExistingDirectory: true });

  assert.throws(() => fixture.controller.previewImport(), /symbolic link/i);
  assert.equal(fs.existsSync(path.join(fixture.workspaceRoot, "backups")), false);
});

test("finalization verifies one successful replacement and unlinks exactly one backup", () => {
  let unlinks = 0;
  const countingFs = Object.assign(Object.create(fs), {
    unlinkSync(targetPath) {
      unlinks += 1;
      return fs.unlinkSync(targetPath);
    }
  });
  const fixture = createFixture({ fsApi: countingFs });
  const plan = fixture.controller.previewImport();
  const result = fixture.controller.applyImport({ planId: plan.planId });
  const operation = result.operations.find((item) => item.stableId === "alphabet:existing");
  const beforeProduction = bytesAt(fixture.paths.existing);

  assert.throws(() => fixture.controller.finalizeReplacement({ importId: "unknown", stableId: "alphabet:existing" }), /unknown|successful import/i);
  assert.throws(() => fixture.controller.finalizeReplacement({ importId: result.importId, stableId: "reading:unchanged" }), /does not include/i);
  const finalized = fixture.controller.finalizeReplacement({ importId: result.importId, stableId: "alphabet:existing" });
  assert.equal(finalized.stableId, "alphabet:existing");
  assert.equal(unlinks, 1);
  assert.equal(fs.existsSync(operation.backupPath), false);
  assert.deepEqual(bytesAt(fixture.paths.existing), beforeProduction);
  assert.throws(() => fixture.controller.finalizeReplacement({ importId: result.importId, stableId: "alphabet:existing" }), /finalized|backup/i);
  assert.equal(unlinks, 1);
});

test("finalization rejects a replacement changed after a successful import without deleting its backup", () => {
  let unlinks = 0;
  const countingFs = Object.assign(Object.create(fs), {
    unlinkSync(targetPath) {
      unlinks += 1;
      return fs.unlinkSync(targetPath);
    }
  });
  const fixture = createFixture({ fsApi: countingFs });
  const result = fixture.controller.applyImport({ planId: fixture.controller.previewImport().planId });
  const operation = result.operations.find((item) => item.stableId === "alphabet:existing");
  fs.writeFileSync(fixture.paths.existing, changedWebm(5));

  assert.throws(() => fixture.controller.finalizeReplacement({ importId: result.importId, stableId: "alphabet:existing" }), /replacement has changed/i);
  assert.equal(unlinks, 0);
  assert.equal(fs.existsSync(operation.backupPath), true);
});

test("finalization rejects failed, malformed, missing, tampered, and symbolic-link backup cases", () => {
  const failedFixture = createFixture();
  const failingFs = Object.assign(Object.create(fs), {
    renameSync(source, destination) {
      if (destination === failedFixture.paths.created && source.includes(".ana-tilim-import-")) throw new Error("injected failed import");
      return fs.renameSync(source, destination);
    }
  });
  const failedController = createImportController({ projectRoot: failedFixture.projectRoot, workspaceRoot: failedFixture.workspaceRoot, catalog: failedFixture.catalog, workspace: failedFixture.workspace, fsApi: failingFs });
  assert.throws(() => failedController.applyImport({ planId: failedController.previewImport().planId }), /injected failed import/);
  const failedImportId = fs.readdirSync(path.join(failedFixture.workspaceRoot, "imports")).find((file) => file.endsWith(".failed.json")).replace(/\.failed\.json$/, "");
  assert.throws(() => failedController.finalizeReplacement({ importId: failedImportId, stableId: "alphabet:existing" }), /successful import/i);
  assert.throws(() => failedController.finalizeReplacement({ importId: "../invalid", stableId: "alphabet:existing" }), /invalid/i);

  const missingFixture = createFixture();
  const missingResult = missingFixture.controller.applyImport({ planId: missingFixture.controller.previewImport().planId });
  const missingOperation = missingResult.operations.find((item) => item.stableId === "alphabet:existing");
  fs.renameSync(missingOperation.backupPath, `${missingOperation.backupPath}.preserved`);
  assert.throws(() => missingFixture.controller.finalizeReplacement({ importId: missingResult.importId, stableId: "alphabet:existing" }), /backup is missing/i);

  const tamperedFixture = createFixture();
  const tamperedResult = tamperedFixture.controller.applyImport({ planId: tamperedFixture.controller.previewImport().planId });
  const tamperedOperation = tamperedResult.operations.find((item) => item.stableId === "alphabet:existing");
  fs.writeFileSync(tamperedOperation.backupPath, changedWebm(7));
  assert.throws(() => tamperedFixture.controller.finalizeReplacement({ importId: tamperedResult.importId, stableId: "alphabet:existing" }), /backup has changed/i);

  const symlinkFixture = createFixture();
  const symlinkResult = symlinkFixture.controller.applyImport({ planId: symlinkFixture.controller.previewImport().planId });
  const symlinkOperation = symlinkResult.operations.find((item) => item.stableId === "alphabet:existing");
  const preservedBackup = `${symlinkOperation.backupPath}.preserved`;
  fs.renameSync(symlinkOperation.backupPath, preservedBackup);
  fs.symlinkSync(preservedBackup, symlinkOperation.backupPath);
  assert.throws(() => symlinkFixture.controller.finalizeReplacement({ importId: symlinkResult.importId, stableId: "alphabet:existing" }), /symbolic link|backup is missing/i);
});

test("a finalization-log reservation failure keeps the verified backup and records no unlink", () => {
  let unlinks = 0;
  const initial = createFixture();
  const reservingFs = Object.assign(Object.create(fs), {
    openSync(targetPath, flags, ...rest) {
      if (typeof targetPath === "string" && targetPath.endsWith(".finalizing.json") && flags === "wx") throw new Error("injected finalization log reservation failure");
      return fs.openSync(targetPath, flags, ...rest);
    },
    unlinkSync(targetPath) {
      unlinks += 1;
      return fs.unlinkSync(targetPath);
    }
  });
  const controller = createImportController({ projectRoot: initial.projectRoot, workspaceRoot: initial.workspaceRoot, catalog: initial.catalog, workspace: initial.workspace, fsApi: reservingFs });
  const result = controller.applyImport({ planId: controller.previewImport().planId });
  const operation = result.operations.find((item) => item.stableId === "alphabet:existing");

  assert.throws(() => controller.finalizeReplacement({ importId: result.importId, stableId: "alphabet:existing" }), /injected finalization log reservation failure/);
  assert.equal(unlinks, 0);
  assert.equal(fs.existsSync(operation.backupPath), true);
  assert.equal(fs.existsSync(path.join(initial.workspaceRoot, "imports", `${result.importId}-${encodeURIComponent("alphabet:existing")}.finalized.json`)), false);
});

test("a post-unlink finalization rename failure recovers without a second unlink", () => {
  let unlinks = 0;
  let failFinalizationRename = true;
  const initial = createFixture();
  const recoveringFs = Object.assign(Object.create(fs), {
    renameSync(source, destination) {
      if (failFinalizationRename && typeof source === "string" && source.endsWith(".finalizing.json") && destination.endsWith(".finalized.json")) {
        failFinalizationRename = false;
        throw new Error("injected finalization promotion failure");
      }
      return fs.renameSync(source, destination);
    },
    unlinkSync(targetPath) {
      unlinks += 1;
      return fs.unlinkSync(targetPath);
    }
  });
  const controller = createImportController({ projectRoot: initial.projectRoot, workspaceRoot: initial.workspaceRoot, catalog: initial.catalog, workspace: initial.workspace, fsApi: recoveringFs });
  const result = controller.applyImport({ planId: controller.previewImport().planId });
  const operation = result.operations.find((item) => item.stableId === "alphabet:existing");
  const importsRoot = path.join(initial.workspaceRoot, "imports");
  const encodedId = encodeURIComponent("alphabet:existing");

  assert.throws(() => controller.finalizeReplacement({ importId: result.importId, stableId: "alphabet:existing" }), /injected finalization promotion failure/);
  assert.equal(unlinks, 1);
  assert.equal(fs.existsSync(operation.backupPath), false);
  assert.equal(fs.existsSync(path.join(importsRoot, `${result.importId}-${encodedId}.finalizing.json`)), true);

  const recovered = controller.finalizeReplacement({ importId: result.importId, stableId: "alphabet:existing" });
  assert.equal(recovered.stableId, "alphabet:existing");
  assert.equal(unlinks, 1);
  assert.equal(fs.existsSync(path.join(importsRoot, `${result.importId}-${encodedId}.finalizing.json`)), false);
  assert.equal(fs.existsSync(path.join(importsRoot, `${result.importId}-${encodedId}.finalized.json`)), true);
});

test("a pending finalization with its backup intact resumes only after full validation", () => {
  let failUnlink = true;
  const initial = createFixture();
  const pausingFs = Object.assign(Object.create(fs), {
    unlinkSync(targetPath) {
      if (failUnlink) {
        failUnlink = false;
        throw new Error("injected pending finalization unlink failure");
      }
      return fs.unlinkSync(targetPath);
    }
  });
  const controller = createImportController({ projectRoot: initial.projectRoot, workspaceRoot: initial.workspaceRoot, catalog: initial.catalog, workspace: initial.workspace, fsApi: pausingFs });
  const result = controller.applyImport({ planId: controller.previewImport().planId });
  const operation = result.operations.find((item) => item.stableId === "alphabet:existing");

  assert.throws(() => controller.finalizeReplacement({ importId: result.importId, stableId: "alphabet:existing" }), /injected pending finalization unlink failure/);
  assert.equal(fs.existsSync(operation.backupPath), true);
  const resumed = controller.finalizeReplacement({ importId: result.importId, stableId: "alphabet:existing" });
  assert.equal(resumed.stableId, "alphabet:existing");
  assert.equal(fs.existsSync(operation.backupPath), false);
});

test("a malformed pending finalization timestamp is rejected before any unlink", () => {
  let failUnlink = true;
  let unlinks = 0;
  const initial = createFixture();
  const pausingFs = Object.assign(Object.create(fs), {
    unlinkSync(targetPath) {
      unlinks += 1;
      if (failUnlink) {
        failUnlink = false;
        throw new Error("injected pending timestamp setup failure");
      }
      return fs.unlinkSync(targetPath);
    }
  });
  const controller = createImportController({ projectRoot: initial.projectRoot, workspaceRoot: initial.workspaceRoot, catalog: initial.catalog, workspace: initial.workspace, fsApi: pausingFs });
  const result = controller.applyImport({ planId: controller.previewImport().planId });
  const operation = result.operations.find((item) => item.stableId === "alphabet:existing");
  const pendingPath = path.join(initial.workspaceRoot, "imports", `${result.importId}-${encodeURIComponent("alphabet:existing")}.finalizing.json`);
  assert.throws(() => controller.finalizeReplacement({ importId: result.importId, stableId: "alphabet:existing" }), /injected pending timestamp setup failure/);
  const pending = JSON.parse(fs.readFileSync(pendingPath, "utf8"));
  pending.finalizedAt = "not-an-iso-timestamp";
  fs.writeFileSync(pendingPath, `${JSON.stringify(pending, null, 2)}\n`);

  assert.throws(() => controller.finalizeReplacement({ importId: result.importId, stableId: "alphabet:existing" }), /ISO timestamp/i);
  assert.equal(unlinks, 1);
  assert.equal(fs.existsSync(operation.backupPath), true);
});

test("importer has no bulk or recursive deletion path", () => {
  const source = fs.readFileSync(path.join(repositoryRoot, "tools/recording-studio/importer.mjs"), "utf8");
  assert.doesNotMatch(source, /\.(?:rm|rmSync|rmdirSync)\s*\(/);
  assert.doesNotMatch(source, /(?:glob|wildcard|recursive)\s*(?:delete|remov)/i);
  assert.equal((source.match(/\.unlinkSync\s*\(/g) || []).length, 1);
});
