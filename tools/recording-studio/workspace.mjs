import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { validateWebmBuffer } from "../lib/webm-audio.mjs";

const STATE_SCHEMA_VERSION = 1;
const STATE_FILE = "state.json";
const TEMP_STATE_FILE = "state.json.tmp";
const TAKE_ID_PATTERN = /^[A-Za-z0-9-]+$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const ALL_STATUSES = new Set(["pending-review", "pending", "needs-rerecord", "recorded", "approved-current", "approved-take", "imported"]);
const MANUAL_STATUSES = new Set(["pending-review", "pending", "needs-rerecord"]);

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function assertIsoTimestamp(value, label) {
  assert.equal(typeof value, "string", `${label} must be an ISO timestamp`);
  assert.match(value, ISO_TIMESTAMP_PATTERN, `${label} must be an ISO timestamp`);
  assert.equal(new Date(value).toISOString(), value, `${label} must be an ISO timestamp`);
}

function assertRegularDirectory(fsApi, directory, label) {
  const stat = fsApi.lstatSync(directory);
  assert.ok(!stat.isSymbolicLink(), `${label} must not be a symbolic link`);
  assert.ok(stat.isDirectory(), `${label} must be a directory`);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createRecordingWorkspace({ projectRoot, workspaceRoot, catalog, fsApi = fs }) {
  assert.equal(typeof projectRoot, "string", "projectRoot is required");
  assert.equal(typeof workspaceRoot, "string", "workspaceRoot is required");
  assert.ok(catalog && Array.isArray(catalog.targets), "recording catalog targets are required");

  const normalizedProjectRoot = path.resolve(projectRoot);
  const normalizedWorkspaceRoot = path.resolve(workspaceRoot);
  const catalogById = new Map();

  for (const target of catalog.targets) {
    assert.equal(typeof target?.stableId, "string", "catalog target stable ID is required");
    assert.match(target.recordingTextHash, HASH_PATTERN, `catalog target hash is invalid for ${target.stableId}`);
    assert.ok(!catalogById.has(target.stableId), `duplicate catalog target: ${target.stableId}`);
    catalogById.set(target.stableId, target);
  }

  function ensureWorkspaceRoot() {
    if (!fsApi.existsSync(normalizedWorkspaceRoot)) fsApi.mkdirSync(normalizedWorkspaceRoot, { recursive: true });
    assertRegularDirectory(fsApi, normalizedWorkspaceRoot, "workspace root");
  }

  function resolveWorkspacePath(relativePath, label) {
    const candidate = path.resolve(normalizedWorkspaceRoot, relativePath);
    assert.ok(isInside(normalizedWorkspaceRoot, candidate), `${label} escapes workspace root`);
    return candidate;
  }

  function assertNoSymlinkWithinWorkspace(candidate, label) {
    assert.ok(candidate === normalizedWorkspaceRoot || isInside(normalizedWorkspaceRoot, candidate), `${label} escapes workspace root`);
    assertRegularDirectory(fsApi, normalizedWorkspaceRoot, "workspace root");
    const relative = path.relative(normalizedWorkspaceRoot, candidate);
    let current = normalizedWorkspaceRoot;
    for (const segment of relative.split(path.sep)) {
      if (!segment) continue;
      current = path.join(current, segment);
      if (!fsApi.existsSync(current)) break;
      const stat = fsApi.lstatSync(current);
      assert.ok(!stat.isSymbolicLink(), `${label} must not traverse a symbolic link`);
    }
  }

  function ensureDirectory(relativePath, label) {
    ensureWorkspaceRoot();
    const directory = resolveWorkspacePath(relativePath, label);
    if (!fsApi.existsSync(directory)) fsApi.mkdirSync(directory, { recursive: true });
    assertNoSymlinkWithinWorkspace(directory, label);
    assertRegularDirectory(fsApi, directory, label);
    return directory;
  }

  function statePath() {
    ensureWorkspaceRoot();
    const result = resolveWorkspacePath(STATE_FILE, "state file");
    assertNoSymlinkWithinWorkspace(result, "state file");
    return result;
  }

  function createInitialState() {
    const targets = {};
    for (const target of catalog.targets) {
      targets[target.stableId] = {
        status: target.initialStatus,
        approvedTakeId: null,
        recordingTextHash: target.recordingTextHash,
        takes: []
      };
    }
    return { schemaVersion: STATE_SCHEMA_VERSION, updatedAt: new Date().toISOString(), targets };
  }

  function expectedTakeRelativePath(stableId, takeId) {
    return path.join("takes", encodeURIComponent(stableId), `${takeId}.webm`);
  }

  function assertTake(stableId, take, index) {
    assert.ok(take && typeof take === "object", `take ${index} for ${stableId} must be an object`);
    assert.equal(typeof take.id, "string", `take ${index} for ${stableId} must have an ID`);
    assert.match(take.id, TAKE_ID_PATTERN, `take ${index} for ${stableId} has an invalid ID`);
    assert.equal(take.relativePath, expectedTakeRelativePath(stableId, take.id), `take ${take.id} for ${stableId} has an unsafe path`);
    assertIsoTimestamp(take.createdAt, `take ${take.id} createdAt`);
    assert.ok(Number.isSafeInteger(take.size) && take.size > 0, `take ${take.id} has an invalid size`);
    assert.ok(Number.isFinite(take.durationMs) && take.durationMs > 0, `take ${take.id} has an invalid duration`);
    assert.match(take.recordingTextHash, HASH_PATTERN, `take ${take.id} has an invalid text hash`);
    assert.match(take.sha256, HASH_PATTERN, `take ${take.id} has an invalid content hash`);
  }

  function validateState(state) {
    assert.ok(state && typeof state === "object" && !Array.isArray(state), "recording workspace state must be an object");
    assert.equal(state.schemaVersion, STATE_SCHEMA_VERSION, "unsupported recording workspace state schema");
    assertIsoTimestamp(state.updatedAt, "state updatedAt");
    assert.ok(state.targets && typeof state.targets === "object" && !Array.isArray(state.targets), "recording workspace state targets must be an object");
    assert.deepEqual(Object.keys(state.targets).sort(), [...catalogById.keys()].sort(), "recording workspace targets do not match the current catalog");

    for (const [stableId, target] of Object.entries(state.targets)) {
      assert.ok(target && typeof target === "object" && !Array.isArray(target), `state target ${stableId} must be an object`);
      assert.ok(ALL_STATUSES.has(target.status), `state target ${stableId} has an unsupported status`);
      assert.ok(target.approvedTakeId === null || (typeof target.approvedTakeId === "string" && TAKE_ID_PATTERN.test(target.approvedTakeId)), `state target ${stableId} has an invalid approved take ID`);
      assert.match(target.recordingTextHash, HASH_PATTERN, `state target ${stableId} has an invalid text hash`);
      assert.ok(Array.isArray(target.takes), `state target ${stableId} takes must be an array`);
      const takeIds = new Set();
      for (const [index, take] of target.takes.entries()) {
        assertTake(stableId, take, index);
        assert.ok(!takeIds.has(take.id), `state target ${stableId} has duplicate take ID ${take.id}`);
        takeIds.add(take.id);
      }
      if (target.approvedTakeId !== null) assert.ok(takeIds.has(target.approvedTakeId), `state target ${stableId} approved take is missing`);
    }
    return state;
  }

  function writeState(state) {
    validateState(state);
    const destination = statePath();
    const temporary = resolveWorkspacePath(TEMP_STATE_FILE, "temporary state file");
    assertNoSymlinkWithinWorkspace(temporary, "temporary state file");
    if (fsApi.existsSync(temporary)) {
      const temporaryStat = fsApi.lstatSync(temporary);
      assert.ok(!temporaryStat.isSymbolicLink() && temporaryStat.isFile(), "temporary state file must be a regular file");
      const abandoned = resolveWorkspacePath(
        `state.json.abandoned-${new Date().toISOString().replace(/[:.]/g, "-")}-${crypto.randomBytes(4).toString("hex")}.tmp`,
        "abandoned temporary state file"
      );
      fsApi.renameSync(temporary, abandoned);
    }
    const contents = `${JSON.stringify(state, null, 2)}\n`;
    let descriptor;
    try {
      descriptor = fsApi.openSync(temporary, "w", 0o600);
      fsApi.writeFileSync(descriptor, contents, "utf8");
      fsApi.fsyncSync(descriptor);
    } finally {
      if (descriptor !== undefined) fsApi.closeSync(descriptor);
    }
    fsApi.renameSync(temporary, destination);
    const workspaceDescriptor = fsApi.openSync(normalizedWorkspaceRoot, "r");
    try {
      fsApi.fsyncSync(workspaceDescriptor);
    } finally {
      fsApi.closeSync(workspaceDescriptor);
    }
  }

  function readState() {
    const file = statePath();
    if (!fsApi.existsSync(file)) {
      const initialState = createInitialState();
      writeState(initialState);
      return initialState;
    }
    let state;
    try {
      state = JSON.parse(fsApi.readFileSync(file, "utf8"));
    } catch (error) {
      assert.fail(`malformed recording workspace state: ${error.message}`);
    }
    return validateState(state);
  }

  function requireTarget(stableId) {
    assert.equal(typeof stableId, "string", "recording target ID is required");
    const target = catalogById.get(stableId);
    assert.ok(target, `unknown recording target: ${stableId}`);
    return target;
  }

  function requireCurrentText(state, stableId, catalogTarget) {
    const targetState = state.targets[stableId];
    assert.equal(targetState.recordingTextHash, catalogTarget.recordingTextHash, `stale recording text for ${stableId}`);
    return targetState;
  }

  function saveUpdatedState(state) {
    state.updatedAt = new Date().toISOString();
    writeState(state);
  }

  function safeTakePath(stableId, takeId) {
    assert.match(takeId, TAKE_ID_PATTERN, "take ID is invalid");
    const relativePath = expectedTakeRelativePath(stableId, takeId);
    const result = resolveWorkspacePath(relativePath, "take path");
    assertNoSymlinkWithinWorkspace(result, "take path");
    return { relativePath, absolutePath: result };
  }

  function assertCurrentAudioPath(stableId, currentPath, audioRoot) {
    assert.ok(isInside(audioRoot, currentPath), `recording target ${stableId} current audio escapes human-audio root`);
    let component = audioRoot;
    const rootStat = fsApi.lstatSync(component);
    assert.ok(!rootStat.isSymbolicLink() && rootStat.isDirectory(), `recording target ${stableId} current audio must not traverse a symbolic link`);
    for (const segment of path.relative(audioRoot, currentPath).split(path.sep)) {
      if (!segment) continue;
      component = path.join(component, segment);
      const stat = fsApi.lstatSync(component);
      assert.ok(!stat.isSymbolicLink(), `recording target ${stableId} current audio must not traverse a symbolic link`);
    }
    const currentStat = fsApi.lstatSync(currentPath);
    assert.ok(currentStat.isFile(), `recording target ${stableId} has no playable current audio`);
    assert.ok(isInside(fsApi.realpathSync(audioRoot), fsApi.realpathSync(currentPath)), `recording target ${stableId} current audio escapes human-audio root`);
  }

  function assertStoredTakeIsValid(stableId, take) {
    const { absolutePath } = safeTakePath(stableId, take.id);
    assert.ok(fsApi.existsSync(absolutePath), `take ${take.id} is missing for ${stableId}`);
    const stat = fsApi.lstatSync(absolutePath);
    assert.ok(!stat.isSymbolicLink() && stat.isFile(), `take ${take.id} is unsafe for ${stableId}`);
    const buffer = fsApi.readFileSync(absolutePath);
    const validation = validateWebmBuffer(buffer);
    assert.equal(validation.size, take.size, `take metadata does not match for ${take.id}`);
    assert.equal(validation.durationMs, take.durationMs, `take metadata does not match for ${take.id}`);
    assert.equal(crypto.createHash("sha256").update(buffer).digest("hex"), take.sha256, `take content hash does not match for ${take.id}`);
    return absolutePath;
  }

  function canSetManualStatus(from, to) {
    if (!MANUAL_STATUSES.has(to)) return false;
    if (["approved-current", "approved-take", "imported"].includes(from)) return to === "needs-rerecord";
    return ALL_STATUSES.has(from);
  }

  return Object.freeze({
    loadState() {
      return clone(readState());
    },

    saveTake({ stableId, buffer, createdAt = new Date().toISOString() }) {
      const catalogTarget = requireTarget(stableId);
      assertIsoTimestamp(createdAt, "take createdAt");
      const validation = validateWebmBuffer(buffer);
      const state = readState();
      const targetState = requireCurrentText(state, stableId, catalogTarget);
      const takeId = `${createdAt.replace(/[:.]/g, "-")}-${crypto.randomBytes(4).toString("hex")}`;
      const targetDirectory = ensureDirectory(path.join("takes", encodeURIComponent(stableId)), "take directory");
      const { relativePath, absolutePath } = safeTakePath(stableId, takeId);
      assert.equal(path.dirname(absolutePath), targetDirectory, "take path must remain in its target directory");

      let descriptor;
      try {
        descriptor = fsApi.openSync(absolutePath, "wx", 0o600);
        fsApi.writeFileSync(descriptor, buffer);
        fsApi.fsyncSync(descriptor);
      } finally {
        if (descriptor !== undefined) fsApi.closeSync(descriptor);
      }

      const take = {
        id: takeId,
        relativePath,
        createdAt,
        size: validation.size,
        durationMs: validation.durationMs,
        recordingTextHash: catalogTarget.recordingTextHash,
        sha256: crypto.createHash("sha256").update(buffer).digest("hex")
      };
      targetState.takes.push(take);
      if (!["approved-current", "approved-take", "imported"].includes(targetState.status)) targetState.status = "recorded";
      saveUpdatedState(state);
      return clone(take);
    },

    approveTake({ stableId, takeId }) {
      const catalogTarget = requireTarget(stableId);
      const state = readState();
      const targetState = requireCurrentText(state, stableId, catalogTarget);
      assert.notEqual(targetState.status, "imported", `invalid recording status transition from imported for ${stableId}`);
      const take = targetState.takes.find((item) => item.id === takeId);
      assert.ok(take, `take ${takeId} does not belong to ${stableId}`);
      assert.equal(take.recordingTextHash, catalogTarget.recordingTextHash, `stale recording text for ${stableId}`);
      assertStoredTakeIsValid(stableId, take);
      targetState.approvedTakeId = take.id;
      targetState.status = "approved-take";
      saveUpdatedState(state);
      return clone(targetState);
    },

    markCurrentApproved({ stableId }) {
      const catalogTarget = requireTarget(stableId);
      const state = readState();
      const targetState = requireCurrentText(state, stableId, catalogTarget);
      assert.notEqual(targetState.status, "imported", `invalid recording status transition from imported for ${stableId}`);
      assert.equal(catalogTarget.playable, true, `recording target ${stableId} has no playable current audio`);
      const currentPath = path.resolve(catalogTarget.absoluteOutputPath);
      const audioRoot = path.resolve(normalizedProjectRoot, "prototype/assets/audio/human");
      assertCurrentAudioPath(stableId, currentPath, audioRoot);
      validateWebmBuffer(fsApi.readFileSync(currentPath));
      targetState.approvedTakeId = null;
      targetState.status = "approved-current";
      saveUpdatedState(state);
      return clone(targetState);
    },

    setTargetStatus({ stableId, status }) {
      const catalogTarget = requireTarget(stableId);
      assert.ok(MANUAL_STATUSES.has(status), `unsupported recording status: ${status}`);
      const state = readState();
      const targetState = requireCurrentText(state, stableId, catalogTarget);
      assert.ok(canSetManualStatus(targetState.status, status), `invalid recording status transition from ${targetState.status} to ${status}`);
      if (status === "needs-rerecord") targetState.approvedTakeId = null;
      targetState.status = status;
      saveUpdatedState(state);
      return clone(targetState);
    },

    getTakePath({ stableId, takeId }) {
      requireTarget(stableId);
      const state = readState();
      const take = state.targets[stableId].takes.find((item) => item.id === takeId);
      assert.ok(take, `take ${takeId} does not belong to ${stableId}`);
      return assertStoredTakeIsValid(stableId, take);
    }
  });
}
