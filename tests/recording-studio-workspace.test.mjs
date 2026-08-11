import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRecordingWorkspace } from "../tools/recording-studio/workspace.mjs";
import { buildRecordingCatalog } from "../tools/recording-studio/catalog.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const catalog = buildRecordingCatalog({ projectRoot });
const validWebm = fs.readFileSync(catalog.targets.find((target) => target.stableId === "alphabet:aa").absoluteOutputPath);

function createOptions({ catalogOverride = catalog, fsApi } = {}) {
  return {
    projectRoot,
    workspaceRoot: fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-recording-workspace-")),
    catalog: catalogOverride,
    ...(fsApi ? { fsApi } : {})
  };
}

function recordingTextHash(target) {
  return crypto.createHash("sha256").update(JSON.stringify({
    value: target.value,
    latin: target.latin,
    meaning: target.meaning,
    english: target.english
  })).digest("hex");
}

function writeRawState(options, state) {
  fs.writeFileSync(path.join(options.workspaceRoot, "state.json"), `${JSON.stringify(state, null, 2)}\n`);
}

function createApprovedTakeState() {
  const options = createOptions();
  const workspace = createRecordingWorkspace(options);
  const take = workspace.saveTake({ stableId: "alphabet:aa", buffer: validWebm });
  const state = workspace.loadState();
  state.targets["alphabet:aa"].status = "approved-take";
  state.targets["alphabet:aa"].approvedTakeId = take.id;
  return { options, state, take };
}

function snapshotTree(root) {
  const entries = [];
  function visit(current, relative) {
    const stat = fs.lstatSync(current);
    const record = { relative, mode: stat.mode, type: stat.isSymbolicLink() ? "symlink" : stat.isDirectory() ? "directory" : "file" };
    if (stat.isSymbolicLink()) record.link = fs.readlinkSync(current);
    if (stat.isFile()) record.bytes = fs.readFileSync(current).toString("base64");
    entries.push(record);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(current).sort()) visit(path.join(current, name), path.join(relative, name));
    }
  }
  visit(root, ".");
  return entries;
}

test("creates the exact expanded review baseline from the catalog and persists it", () => {
  const options = createOptions();
  const workspace = createRecordingWorkspace(options);
  const state = workspace.loadState();

  assert.equal(state.schemaVersion, 1);
  assert.equal(Object.keys(state.targets).length, 553);
  assert.equal(Object.values(state.targets).filter((target) => target.status === "pending-review").length, 524);
  assert.equal(Object.values(state.targets).filter((target) => target.status === "pending").length, 27);
  assert.equal(Object.values(state.targets).filter((target) => target.status === "needs-rerecord").length, 2);
  assert.equal(state.targets["alphabet:zhe"].status, "needs-rerecord");
  assert.equal(state.targets["vocab:korushkunche"].status, "needs-rerecord");
  workspace.markCurrentApproved({ stableId: "alphabet:aa" });
  const afterRestart = createRecordingWorkspace(options).loadState().targets;
  assert.equal(afterRestart["alphabet:aa"].status, "approved-current");
  assert.equal(afterRestart["alphabet:zhe"].status, "needs-rerecord");
});

test("adds newly approved pending targets to an existing workspace without changing saved review decisions", () => {
  const retiredHayrTarget = Object.freeze({
    ...catalog.targets.find((target) => target.stableId === "vocab:xosh"),
    stableId: "vocab:hayr",
    sourceId: "hayr",
    value: "خەير",
    latin: "xeyr",
    meaning: "再见、告辞",
    english: "Goodbye",
    currentFile: "human_vocab_hayr.webm",
    outputPath: "./assets/audio/human/vocab/human_vocab_hayr.webm",
    absoluteOutputPath: path.join(projectRoot, "prototype/assets/audio/human/vocab/human_vocab_hayr.webm"),
    recordingTextHash: recordingTextHash({ value: "خەير", latin: "xeyr", meaning: "再见、告辞", english: "Goodbye" }),
    playable: true,
    initialStatus: "pending-review"
  });
  const legacyCatalog = {
    ...catalog,
    targets: [...catalog.targets.filter((target) => target.initialStatus !== "pending"), retiredHayrTarget]
  };
  const options = createOptions({ catalogOverride: legacyCatalog });
  const legacyWorkspace = createRecordingWorkspace(options);
  legacyWorkspace.loadState();
  legacyWorkspace.markCurrentApproved({ stableId: "alphabet:aa" });
  legacyWorkspace.setTargetStatus({ stableId: "alphabet:zhe", status: "needs-rerecord" });

  const expandedWorkspace = createRecordingWorkspace({ ...options, catalog });
  const expanded = expandedWorkspace.loadState();
  assert.equal(Object.keys(expanded.targets).length, 553);
  assert.equal(expanded.targets["alphabet:aa"].status, "approved-current");
  assert.equal(expanded.targets["alphabet:zhe"].status, "needs-rerecord");
  assert.equal(expanded.targets["reading:grammar-person-verbs-1"], undefined);
  assert.equal(expanded.targets["reading:grammar-person-verbs-2"].status, "pending");
  assert.equal(expanded.targets["vocab:erzimaydu"].status, "pending");
  assert.equal(expanded.targets["vocab:hayr"], undefined);

  const afterRestart = createRecordingWorkspace({ ...options, catalog }).loadState();
  assert.equal(Object.keys(afterRestart.targets).length, 553);
  assert.equal(afterRestart.targets["alphabet:aa"].status, "approved-current");
  assert.equal(afterRestart.targets["vocab:erzimaydu"].status, "pending");
});

test("retires exact duplicate first-time targets from the previous workspace only while they have no takes", () => {
  const source = catalog.targets.find((target) => target.stableId === "reading:grammar-person-verbs-2");
  const redundantTarget = Object.freeze({
    ...source,
    stableId: "reading:grammar-person-verbs-1",
    sourceId: "grammar-person-verbs-1",
    value: "مەن كىتاب ئوقۇيمەن.",
    latin: "Men kitab oquymen.",
    recordingTextHash: recordingTextHash({ value: "مەن كىتاب ئوقۇيمەن.", latin: "Men kitab oquymen.", meaning: source.meaning, english: source.english })
  });
  const previousCatalog = { ...catalog, targets: [...catalog.targets, redundantTarget] };
  const options = createOptions({ catalogOverride: previousCatalog });
  createRecordingWorkspace(options).loadState();

  const migrated = createRecordingWorkspace({ ...options, catalog }).loadState();
  assert.equal(migrated.targets[redundantTarget.stableId], undefined);
  assert.equal(Object.keys(migrated.targets).length, 553);

  const unsafeOptions = createOptions({ catalogOverride: previousCatalog });
  const unsafeWorkspace = createRecordingWorkspace(unsafeOptions);
  unsafeWorkspace.loadState();
  unsafeWorkspace.saveTake({ stableId: redundantTarget.stableId, buffer: validWebm });
  assert.throws(
    () => createRecordingWorkspace({ ...unsafeOptions, catalog }).loadState(),
    /retired recording target still contains learner work: reading:grammar-person-verbs-1/
  );
});

test("refuses to retire xeyr when its old workspace entry contains a take", () => {
  const current = catalog.targets.find((target) => target.stableId === "vocab:xosh");
  const retiredHayrTarget = Object.freeze({
    ...current,
    stableId: "vocab:hayr",
    sourceId: "hayr",
    recordingTextHash: recordingTextHash({ value: "خەير", latin: "xeyr", meaning: "再见、告辞", english: "Goodbye" }),
    initialStatus: "pending-review"
  });
  const legacyCatalog = { ...catalog, targets: [...catalog.targets.filter((target) => target.initialStatus !== "pending"), retiredHayrTarget] };
  const options = createOptions({ catalogOverride: legacyCatalog });
  const legacyWorkspace = createRecordingWorkspace(options);
  legacyWorkspace.loadState();
  legacyWorkspace.saveTake({ stableId: "vocab:hayr", buffer: validWebm });

  assert.throws(
    () => createRecordingWorkspace({ ...options, catalog }).loadState(),
    /retired recording target still contains learner work: vocab:hayr/
  );
});

test("locks first-time recording targets to the nonplayable pending contract before creating workspace state", () => {
  for (const [overrides, message] of [
    [{ playable: false, initialStatus: "pending-review" }, /nonplayable target must start pending/],
    [{ playable: true, initialStatus: "pending" }, /pending target must be nonplayable/]
  ]) {
    const workspaceRoot = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-recording-target-contract-")), "workspace");
    const invalidCatalog = {
      ...catalog,
      targets: catalog.targets.map((item) => item.stableId === "alphabet:aa" ? { ...item, ...overrides } : item)
    };

    assert.throws(
      () => createRecordingWorkspace({ projectRoot, workspaceRoot, catalog: invalidCatalog }),
      message
    );
    assert.equal(fs.existsSync(workspaceRoot), false);
  }
});

test("stores immutable validated takes and an approved take survives restart", () => {
  const options = createOptions();
  const workspace = createRecordingWorkspace(options);
  const first = workspace.saveTake({ stableId: "alphabet:aa", buffer: validWebm, createdAt: "2026-08-10T01:00:00.000Z" });
  const second = workspace.saveTake({ stableId: "alphabet:aa", buffer: validWebm, createdAt: "2026-08-10T01:01:00.000Z" });

  assert.notEqual(first.id, second.id);
  assert.equal(workspace.loadState().targets["alphabet:aa"].takes.length, 2);
  assert.ok(fs.existsSync(path.join(options.workspaceRoot, second.relativePath)));
  workspace.approveTake({ stableId: "alphabet:aa", takeId: second.id });

  const afterRestart = createRecordingWorkspace(options).loadState().targets["alphabet:aa"];
  assert.equal(afterRestart.status, "approved-take");
  assert.equal(afterRestart.approvedTakeId, second.id);
  assert.throws(() => workspace.approveTake({ stableId: "alphabet:aa", takeId: "take-from-another-target" }), /does not belong/);
  assert.throws(() => workspace.getTakePath({ stableId: "alphabet:be", takeId: second.id }), /does not belong/);
  assert.throws(() => workspace.saveTake({ stableId: "alphabet:unknown", buffer: validWebm }), /unknown recording target/);
});

test("validates WebM before creating any workspace file", () => {
  const options = createOptions();
  const neverCreatedRoot = path.join(options.workspaceRoot, "new-workspace");
  const workspace = createRecordingWorkspace({ ...options, workspaceRoot: neverCreatedRoot });

  assert.throws(() => workspace.saveTake({ stableId: "alphabet:aa", buffer: Buffer.from("not-webm") }), /4096 bytes/);
  assert.equal(fs.existsSync(neverCreatedRoot), false);
});

test("rejects a non-canonical take timestamp before creating state or audio", () => {
  const options = createOptions();
  const neverCreatedRoot = path.join(options.workspaceRoot, "invalid-timestamp-workspace");
  const workspace = createRecordingWorkspace({ ...options, workspaceRoot: neverCreatedRoot });

  assert.throws(
    () => workspace.saveTake({ stableId: "alphabet:aa", buffer: validWebm, createdAt: "2026-08-10 01:00:00Z" }),
    /ISO timestamp/
  );
  assert.equal(fs.existsSync(neverCreatedRoot), false);
});

test("only an explicitly selected playable current recording can be approved", () => {
  const options = createOptions();
  const workspace = createRecordingWorkspace(options);

  assert.throws(() => workspace.markCurrentApproved({ stableId: "alphabet:unknown" }), /unknown recording target/);
  workspace.markCurrentApproved({ stableId: "alphabet:aa" });
  const target = workspace.loadState().targets["alphabet:aa"];
  assert.equal(target.status, "approved-current");
  assert.equal(target.approvedTakeId, null);

  const unplayableCatalog = {
    ...catalog,
    targets: catalog.targets.map((item) => item.stableId === "alphabet:aa" ? { ...item, playable: false, initialStatus: "pending" } : item)
  };
  const unplayableWorkspace = createRecordingWorkspace(createOptions({ catalogOverride: unplayableCatalog }));
  assert.throws(() => unplayableWorkspace.markCurrentApproved({ stableId: "alphabet:aa" }), /playable current audio/);
});

test("rejects a current audio path that gains a symbolic-link ancestor after catalog creation", () => {
  const options = createOptions();
  const fixtureProjectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-recording-current-symlink-"));
  const audioRoot = path.join(fixtureProjectRoot, "prototype/assets/audio/human");
  const outsideDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-recording-outside-audio-"));
  const filename = "human_letter_01_b.webm";
  fs.mkdirSync(audioRoot, { recursive: true });
  fs.writeFileSync(path.join(outsideDirectory, filename), validWebm);
  fs.symlinkSync(outsideDirectory, path.join(audioRoot, "alphabet"));
  const redirectedCatalog = {
    ...catalog,
    targets: catalog.targets.map((item) => item.stableId === "alphabet:aa" ? {
      ...item,
      absoluteOutputPath: path.join(audioRoot, "alphabet", filename)
    } : item)
  };
  const workspace = createRecordingWorkspace({ ...options, projectRoot: fixtureProjectRoot, catalog: redirectedCatalog });

  assert.throws(() => workspace.markCurrentApproved({ stableId: "alphabet:aa" }), /current audio.*symbolic link/);
});

test("rejects malformed state without overwriting it", () => {
  const options = createOptions();
  const statePath = path.join(options.workspaceRoot, "state.json");
  const malformed = "{not valid JSON";
  fs.writeFileSync(statePath, malformed);

  assert.throws(() => createRecordingWorkspace(options).loadState(), /malformed recording workspace state/);
  assert.equal(fs.readFileSync(statePath, "utf8"), malformed);
});

test("reads a strict snapshot without recovering a pending rollback journal or writing anything", () => {
  const options = createOptions();
  const workspace = createRecordingWorkspace(options);
  const take = workspace.saveTake({ stableId: "alphabet:aa", buffer: validWebm, createdAt: "2026-08-10T01:00:00.000Z" });
  const state = workspace.loadState();
  state.targets["alphabet:aa"].status = "pending-review";
  state.targets["alphabet:aa"].approvedTakeId = null;
  state.targets["alphabet:aa"].takes = [];
  writeRawState(options, state);
  const recoveryDirectory = path.join(options.workspaceRoot, "recovery");
  fs.mkdirSync(recoveryDirectory, { recursive: true });
  fs.writeFileSync(path.join(recoveryDirectory, `rollback-${take.id}.json`), `${JSON.stringify({
    schemaVersion: 1,
    stableId: "alphabet:aa",
    takeId: take.id,
    relativePath: take.relativePath,
    sha256: take.sha256,
    createdAt: "2026-08-10T01:00:01.000Z"
  }, null, 2)}\n`);
  const before = snapshotTree(options.workspaceRoot);

  const snapshot = workspace.readValidatedStateSnapshot();

  assert.deepEqual(snapshot.contents, fs.readFileSync(path.join(options.workspaceRoot, "state.json")));
  assert.deepEqual(snapshot.state, state);
  assert.deepEqual(snapshotTree(options.workspaceRoot), before);
});

test("strict snapshot validator never calls workspace mutation APIs", () => {
  const options = createOptions();
  createRecordingWorkspace(options).loadState();
  const forbiddenFs = Object.assign(Object.create(fs), {
    mkdirSync() { throw new Error("strict snapshot must not create directories"); },
    writeFileSync() { throw new Error("strict snapshot must not write files"); },
    renameSync() { throw new Error("strict snapshot must not rename files"); },
    unlinkSync() { throw new Error("strict snapshot must not unlink files"); }
  });

  const snapshot = createRecordingWorkspace({ ...options, fsApi: forbiddenFs }).readValidatedStateSnapshot();

  assert.equal(snapshot.state.schemaVersion, 1);
});

test("keeps stale state visible but rejects every current mutation", () => {
  const options = createOptions();
  const workspace = createRecordingWorkspace(options);
  workspace.markCurrentApproved({ stableId: "alphabet:aa" });
  const changedCatalog = {
    ...catalog,
    targets: catalog.targets.map((item) => item.stableId === "alphabet:aa" ? { ...item, value: `${item.value}（变更）`, recordingTextHash: "" } : item)
  };
  const changedTarget = changedCatalog.targets.find((item) => item.stableId === "alphabet:aa");
  changedTarget.recordingTextHash = recordingTextHash(changedTarget);
  const staleWorkspace = createRecordingWorkspace({ ...options, catalog: changedCatalog });

  assert.equal(staleWorkspace.loadState().targets["alphabet:aa"].status, "approved-current");
  assert.throws(() => staleWorkspace.saveTake({ stableId: "alphabet:aa", buffer: validWebm }), /stale recording text/);
  assert.throws(() => staleWorkspace.approveTake({ stableId: "alphabet:aa", takeId: "anything" }), /stale recording text/);
  assert.throws(() => staleWorkspace.markCurrentApproved({ stableId: "alphabet:aa" }), /stale recording text/);
  assert.throws(() => staleWorkspace.setTargetStatus({ stableId: "alphabet:aa", status: "needs-rerecord" }), /stale recording text/);
});

test("uses strict review transitions without silently downgrading an approval", () => {
  const options = createOptions();
  const workspace = createRecordingWorkspace(options);
  const take = workspace.saveTake({ stableId: "alphabet:aa", buffer: validWebm });
  workspace.approveTake({ stableId: "alphabet:aa", takeId: take.id });
  workspace.saveTake({ stableId: "alphabet:aa", buffer: validWebm });

  assert.equal(workspace.loadState().targets["alphabet:aa"].status, "approved-take");
  assert.throws(() => workspace.setTargetStatus({ stableId: "alphabet:aa", status: "approved-take" }), /unsupported recording status/);
  assert.throws(() => workspace.setTargetStatus({ stableId: "alphabet:aa", status: "pending" }), /invalid recording status transition/);
  workspace.setTargetStatus({ stableId: "alphabet:aa", status: "needs-rerecord" });
  const afterExplicitRerecord = workspace.loadState().targets["alphabet:aa"];
  assert.equal(afterExplicitRerecord.status, "needs-rerecord");
  assert.equal(afterExplicitRerecord.approvedTakeId, null);
});

test("refuses a take whose validated bytes were replaced after saving", () => {
  const options = createOptions();
  const workspace = createRecordingWorkspace(options);
  const take = workspace.saveTake({ stableId: "alphabet:aa", buffer: validWebm });
  const takePath = path.join(options.workspaceRoot, take.relativePath);
  fs.writeFileSync(takePath, Buffer.concat([validWebm, Buffer.from([0]) ]));

  assert.throws(() => workspace.getTakePath({ stableId: "alphabet:aa", takeId: take.id }), /take metadata does not match/);
});

test("refuses a same-length take mutation even when WebM metadata still parses", () => {
  const options = createOptions();
  const workspace = createRecordingWorkspace(options);
  const take = workspace.saveTake({ stableId: "alphabet:aa", buffer: validWebm });
  const takePath = path.join(options.workspaceRoot, take.relativePath);
  const mutated = Buffer.from(validWebm);
  mutated[mutated.length - 1] ^= 1;
  fs.writeFileSync(takePath, mutated);

  assert.throws(() => workspace.getTakePath({ stableId: "alphabet:aa", takeId: take.id }), /take content hash does not match/);
});

test("a failed atomic rename preserves the exact previous state bytes", () => {
  const options = createOptions();
  const workspace = createRecordingWorkspace(options);
  workspace.loadState();
  const statePath = path.join(options.workspaceRoot, "state.json");
  const before = fs.readFileSync(statePath);
  const failingFs = Object.assign(Object.create(fs), {
    renameSync() {
      throw new Error("injected state rename failure");
    }
  });
  const failingWorkspace = createRecordingWorkspace({ ...options, fsApi: failingFs });

  assert.throws(() => failingWorkspace.setTargetStatus({ stableId: "alphabet:aa", status: "needs-rerecord" }), /injected state rename failure/);
  assert.deepEqual(fs.readFileSync(statePath), before);
});

test("recovers a failed atomic state temporary file on a later normal mutation", () => {
  const options = createOptions();
  const workspace = createRecordingWorkspace(options);
  workspace.loadState();
  const statePath = path.join(options.workspaceRoot, "state.json");
  const failingFs = Object.assign(Object.create(fs), {
    renameSync(source, destination) {
      if (destination === statePath) throw new Error("injected state rename failure");
      return fs.renameSync(source, destination);
    }
  });
  assert.throws(
    () => createRecordingWorkspace({ ...options, fsApi: failingFs }).setTargetStatus({ stableId: "alphabet:aa", status: "needs-rerecord" }),
    /injected state rename failure/
  );
  assert.ok(fs.existsSync(path.join(options.workspaceRoot, "state.json.tmp")));

  createRecordingWorkspace(options).setTargetStatus({ stableId: "alphabet:aa", status: "needs-rerecord" });
  assert.equal(createRecordingWorkspace(options).loadState().targets["alphabet:aa"].status, "needs-rerecord");
  assert.equal(fs.existsSync(path.join(options.workspaceRoot, "state.json.tmp")), false);
  assert.ok(fs.readdirSync(options.workspaceRoot).some((file) => /^state\.json\.abandoned-[A-Za-z0-9-]+\.tmp$/.test(file)));
});

test("refuses a symbolic-link workspace root before reading or writing state", () => {
  const options = createOptions();
  const realRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-recording-real-root-"));
  const symlinkRoot = path.join(options.workspaceRoot, "linked-workspace");
  fs.symlinkSync(realRoot, symlinkRoot);

  assert.throws(() => createRecordingWorkspace({ ...options, workspaceRoot: symlinkRoot }).loadState(), /workspace root.*symbolic link/);
});

test("refuses a workspace root beneath a symbolic-link ancestor without writing through it", () => {
  const options = createOptions();
  const linkParent = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-recording-workspace-link-parent-"));
  const outsideDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-recording-workspace-link-outside-"));
  const linkedDirectory = path.join(linkParent, "controlled-link");
  const workspaceRoot = path.join(linkedDirectory, "nested", "recording-workspace");
  fs.symlinkSync(outsideDirectory, linkedDirectory);

  assert.throws(
    () => createRecordingWorkspace({ ...options, workspaceRoot }).loadState(),
    /workspace root.*symbolic link/
  );
  assert.equal(fs.existsSync(path.join(outsideDirectory, "nested", "recording-workspace", "state.json")), false);
});

test("accepts the macOS /var and /private/var aliases for the same temporary workspace", () => {
  const options = createOptions();
  const alternateRoot = options.workspaceRoot.startsWith("/var/")
    ? `/private${options.workspaceRoot}`
    : options.workspaceRoot.startsWith("/private/var/")
      ? options.workspaceRoot.slice("/private".length)
      : null;
  assert.ok(alternateRoot, "test host must expose a macOS temporary-directory alias");

  const state = createRecordingWorkspace({ ...options, workspaceRoot: alternateRoot }).loadState();
  assert.equal(state.targets["alphabet:aa"].status, "pending-review");
  assert.ok(fs.existsSync(path.join(options.workspaceRoot, "state.json")));
});

test("refuses a current audio root beneath a symbolic-link project ancestor", () => {
  const options = createOptions();
  const fixtureProjectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-recording-project-link-"));
  const outsidePrototype = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-recording-prototype-outside-"));
  const outsideAudioRoot = path.join(outsidePrototype, "assets/audio/human/alphabet");
  const filename = "human_letter_01_b.webm";
  fs.mkdirSync(outsideAudioRoot, { recursive: true });
  fs.writeFileSync(path.join(outsideAudioRoot, filename), validWebm);
  fs.symlinkSync(outsidePrototype, path.join(fixtureProjectRoot, "prototype"));
  const redirectedCatalog = {
    ...catalog,
    targets: catalog.targets.map((item) => item.stableId === "alphabet:aa" ? {
      ...item,
      absoluteOutputPath: path.join(fixtureProjectRoot, "prototype/assets/audio/human/alphabet", filename)
    } : item)
  };
  const workspace = createRecordingWorkspace({ ...options, projectRoot: fixtureProjectRoot, catalog: redirectedCatalog });

  assert.throws(() => workspace.markCurrentApproved({ stableId: "alphabet:aa" }), /current audio.*symbolic link/);
});

test("rolls back the one newly created take when its atomic state save fails", () => {
  const options = createOptions();
  const workspace = createRecordingWorkspace(options);
  workspace.loadState();
  const statePath = path.join(options.workspaceRoot, "state.json");
  const before = fs.readFileSync(statePath);
  const failingFs = Object.assign(Object.create(fs), {
    renameSync(source, destination) {
      if (destination === statePath) throw new Error("injected state rename failure");
      return fs.renameSync(source, destination);
    }
  });

  assert.throws(
    () => createRecordingWorkspace({ ...options, fsApi: failingFs }).saveTake({ stableId: "alphabet:aa", buffer: validWebm }),
    /injected state rename failure/
  );
  assert.deepEqual(fs.readFileSync(statePath), before);
  const takeDirectory = path.join(options.workspaceRoot, "takes", encodeURIComponent("alphabet:aa"));
  assert.deepEqual(fs.existsSync(takeDirectory) ? fs.readdirSync(takeDirectory) : [], []);
  assert.equal(createRecordingWorkspace(options).loadState().targets["alphabet:aa"].takes.length, 0);
  createRecordingWorkspace(options).saveTake({ stableId: "alphabet:aa", buffer: validWebm });
  assert.equal(createRecordingWorkspace(options).loadState().targets["alphabet:aa"].takes.length, 1);
});

test("journals a take rollback that cannot be unlinked and recovers it on restart", () => {
  const options = createOptions();
  const workspace = createRecordingWorkspace(options);
  workspace.loadState();
  const statePath = path.join(options.workspaceRoot, "state.json");
  const before = fs.readFileSync(statePath);
  const failingFs = Object.assign(Object.create(fs), {
    renameSync(source, destination) {
      if (destination === statePath) throw new Error("injected state rename failure");
      return fs.renameSync(source, destination);
    },
    unlinkSync() {
      throw new Error("injected take unlink failure");
    }
  });

  assert.throws(
    () => createRecordingWorkspace({ ...options, fsApi: failingFs }).saveTake({ stableId: "alphabet:aa", buffer: validWebm }),
    /injected state rename failure/
  );
  assert.deepEqual(fs.readFileSync(statePath), before);
  const recoveryDirectory = path.join(options.workspaceRoot, "recovery");
  assert.equal(fs.readdirSync(recoveryDirectory).filter((file) => file.endsWith(".json")).length, 1);

  assert.equal(createRecordingWorkspace(options).loadState().targets["alphabet:aa"].takes.length, 0);
  assert.equal(fs.readdirSync(recoveryDirectory).filter((file) => file.endsWith(".json")).length, 0);
  assert.ok(fs.readdirSync(recoveryDirectory).some((file) => file.endsWith(".recovered")));
});

test("load rejects an approved take without its exact selected take", () => {
  const { options, state } = createApprovedTakeState();
  state.targets["alphabet:aa"].approvedTakeId = null;
  writeRawState(options, state);

  assert.throws(() => createRecordingWorkspace(options).loadState(), /approved take ID/);
});

test("load rejects approval IDs attached to unapproved statuses", () => {
  const { options, state } = createApprovedTakeState();
  state.targets["alphabet:aa"].status = "pending-review";
  writeRawState(options, state);

  assert.throws(() => createRecordingWorkspace(options).loadState(), /pending-review must not retain an approved take/);
});

test("load rejects an approved-current target that retains a take selection", () => {
  const { options, state } = createApprovedTakeState();
  state.targets["alphabet:aa"].status = "approved-current";
  writeRawState(options, state);

  assert.throws(() => createRecordingWorkspace(options).loadState(), /approved-current must not retain an approved take/);
});

test("load revalidates approved-current audio instead of trusting raw state", () => {
  const options = createOptions();
  const fixtureProjectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-recording-approved-current-"));
  const audioDirectory = path.join(fixtureProjectRoot, "prototype/assets/audio/human/alphabet");
  const filename = "human_letter_01_b.webm";
  fs.mkdirSync(audioDirectory, { recursive: true });
  const redirectedCatalog = {
    ...catalog,
    targets: catalog.targets.map((item) => item.stableId === "alphabet:aa" ? {
      ...item,
      absoluteOutputPath: path.join(audioDirectory, filename)
    } : item)
  };
  fs.writeFileSync(path.join(audioDirectory, filename), validWebm);
  const workspace = createRecordingWorkspace({ ...options, projectRoot: fixtureProjectRoot, catalog: redirectedCatalog });
  workspace.markCurrentApproved({ stableId: "alphabet:aa" });
  fs.writeFileSync(path.join(audioDirectory, filename), Buffer.alloc(5000));

  assert.throws(
    () => createRecordingWorkspace({ ...options, projectRoot: fixtureProjectRoot, catalog: redirectedCatalog }).loadState(),
    /WebM header/
  );
});

test("load rejects an approved take with stale text or tampered audio", () => {
  const stale = createApprovedTakeState();
  stale.state.targets["alphabet:aa"].takes[0].recordingTextHash = "0".repeat(64);
  writeRawState(stale.options, stale.state);
  assert.throws(() => createRecordingWorkspace(stale.options).loadState(), /approved take.*stale recording text/);

  const tampered = createApprovedTakeState();
  const takePath = path.join(tampered.options.workspaceRoot, tampered.take.relativePath);
  const modified = Buffer.from(validWebm);
  modified[modified.length - 1] ^= 1;
  fs.writeFileSync(takePath, modified);
  writeRawState(tampered.options, tampered.state);
  assert.throws(() => createRecordingWorkspace(tampered.options).loadState(), /take content hash does not match/);
});
