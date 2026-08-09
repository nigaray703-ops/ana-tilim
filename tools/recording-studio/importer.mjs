import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateWebmBuffer } from "../lib/webm-audio.mjs";

const HASH_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9-]+$/;
const PLAN_MAX_AGE_MS = 5 * 60 * 1000;

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function isInsideOrEqual(root, candidate) {
  return root === candidate || isInside(root, candidate);
}

function assertRegularDirectory(fsApi, directory, label) {
  const stat = fsApi.lstatSync(directory);
  assert.ok(!stat.isSymbolicLink(), `${label} must not be a symbolic link`);
  assert.ok(stat.isDirectory(), `${label} must be a directory`);
}

function safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function assertIsoTimestamp(value, label) {
  assert.equal(typeof value, "string", `${label} must be an ISO timestamp`);
  const parsed = new Date(value);
  assert.ok(Number.isFinite(parsed.getTime()), `${label} must be an ISO timestamp`);
  assert.equal(parsed.toISOString(), value, `${label} must be an ISO timestamp`);
}

export function createImportController({ projectRoot, workspaceRoot, catalog, workspace, fsApi = fs, now = () => new Date() }) {
  assert.equal(typeof projectRoot, "string", "projectRoot is required");
  assert.equal(typeof workspaceRoot, "string", "workspaceRoot is required");
  assert.ok(catalog && Array.isArray(catalog.targets), "recording catalog targets are required");
  assert.ok(workspace && typeof workspace === "object", "recording workspace is required");
  assert.equal(typeof now, "function", "clock is required");

  const normalizedProjectRoot = path.resolve(projectRoot);
  const normalizedWorkspaceRoot = path.resolve(workspaceRoot);
  const audioRoot = path.resolve(normalizedProjectRoot, "prototype/assets/audio/human");
  const temporaryRoot = path.resolve(os.tmpdir());
  const catalogById = new Map();
  let activePlan = null;

  for (const target of catalog.targets) {
    assert.equal(typeof target?.stableId, "string", "catalog target stable ID is required");
    assert.match(target.recordingTextHash, HASH_PATTERN, `catalog target hash is invalid for ${target.stableId}`);
    assert.ok(!catalogById.has(target.stableId), `duplicate catalog target: ${target.stableId}`);
    catalogById.set(target.stableId, target);
  }

  function lstatIfExists(candidate) {
    try {
      return fsApi.lstatSync(candidate);
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
  }

  function normalizeMacTemporaryAlias(candidate) {
    if (temporaryRoot.startsWith("/var/") && candidate.startsWith("/private/var/")) return `/var/${candidate.slice("/private/var/".length)}`;
    if (temporaryRoot.startsWith("/private/var/") && candidate.startsWith("/var/")) return `/private/var/${candidate.slice("/var/".length)}`;
    return candidate;
  }

  function trustedAnchor(candidate, label) {
    const inspectionCandidate = normalizeMacTemporaryAlias(candidate);
    if (isInsideOrEqual(normalizedProjectRoot, inspectionCandidate)) return { anchor: normalizedProjectRoot, inspectionCandidate };
    if (isInsideOrEqual(temporaryRoot, inspectionCandidate)) return { anchor: temporaryRoot, inspectionCandidate };
    assert.fail(`${label} must be inside the project root or the system temporary root`);
  }

  function assertNoSymlinkFrom(anchor, candidate, label) {
    assert.ok(isInsideOrEqual(anchor, candidate), `${label} escapes its controlled root`);
    assertRegularDirectory(fsApi, anchor, `${label} controlled root`);
    let current = anchor;
    for (const segment of path.relative(anchor, candidate).split(path.sep)) {
      if (!segment) continue;
      current = path.join(current, segment);
      const stat = lstatIfExists(current);
      if (!stat) break;
      assert.ok(!stat.isSymbolicLink(), `${label} must not traverse a symbolic link`);
    }
  }

  function assertWorkspacePath(candidate, label) {
    const resolved = path.resolve(candidate);
    assert.ok(isInsideOrEqual(normalizedWorkspaceRoot, resolved), `${label} escapes workspace root`);
    const { anchor, inspectionCandidate: inspectionWorkspaceRoot } = trustedAnchor(normalizedWorkspaceRoot, "workspace root");
    const inspectionResolved = normalizeMacTemporaryAlias(resolved);
    assert.ok(isInsideOrEqual(inspectionWorkspaceRoot, inspectionResolved), `${label} escapes workspace root`);
    assertNoSymlinkFrom(anchor, inspectionWorkspaceRoot, "workspace root");
    assertRegularDirectory(fsApi, normalizedWorkspaceRoot, "workspace root");
    assertNoSymlinkFrom(inspectionWorkspaceRoot, inspectionResolved, label);
    const stat = lstatIfExists(resolved);
    if (stat) {
      assert.ok(!stat.isSymbolicLink(), `${label} must not be a symbolic link`);
      assert.ok(isInsideOrEqual(fsApi.realpathSync(inspectionWorkspaceRoot), fsApi.realpathSync(resolved)), `${label} escapes workspace root after realpath resolution`);
    }
    return resolved;
  }

  function assertAudioTarget(target) {
    assert.equal(typeof target.category, "string", `recording target ${target.stableId} category is required`);
    assert.equal(typeof target.currentFile, "string", `recording target ${target.stableId} current file is required`);
    assert.equal(path.basename(target.currentFile), target.currentFile, `recording target ${target.stableId} current file is unsafe`);
    const expected = path.join(audioRoot, target.category, target.currentFile);
    const targetPath = path.resolve(target.absoluteOutputPath);
    assert.equal(targetPath, expected, `recording target ${target.stableId} output path does not match its category and current file`);
    assertNoSymlinkFrom(normalizedProjectRoot, audioRoot, "human-audio root");
    assertRegularDirectory(fsApi, audioRoot, "human-audio root");
    assertNoSymlinkFrom(audioRoot, targetPath, `recording target ${target.stableId} output path`);
    const parent = path.dirname(targetPath);
    assert.ok(fsApi.existsSync(parent), `recording target ${target.stableId} output directory is missing`);
    assertRegularDirectory(fsApi, parent, `recording target ${target.stableId} output directory`);
    assert.ok(isInsideOrEqual(fsApi.realpathSync(audioRoot), fsApi.realpathSync(parent)), `recording target ${target.stableId} output path escapes human-audio root`);
    fsApi.accessSync(parent, fs.constants.W_OK | fs.constants.X_OK);
    return targetPath;
  }

  function assertWorkspaceStatePath() {
    const destination = assertWorkspacePath(path.join(normalizedWorkspaceRoot, "state.json"), "workspace state file");
    const stat = lstatIfExists(destination);
    assert.ok(stat && !stat.isSymbolicLink() && stat.isFile(), "recording workspace state file is required");
    return destination;
  }

  function readStateSnapshot() {
    const destination = assertWorkspaceStatePath();
    const bytes = fsApi.readFileSync(destination);
    let state;
    try {
      state = JSON.parse(bytes.toString("utf8"));
    } catch (error) {
      assert.fail(`malformed recording workspace state: ${error.message}`);
    }
    assert.ok(state && typeof state === "object" && !Array.isArray(state), "recording workspace state must be an object");
    assert.ok(state.targets && typeof state.targets === "object" && !Array.isArray(state.targets), "recording workspace state targets must be an object");
    assert.equal(typeof workspace.readValidatedStateSnapshot, "function", "recording workspace must expose a strict snapshot validator");
    const validatedSnapshot = workspace.readValidatedStateSnapshot();
    assert.deepEqual(validatedSnapshot.contents, bytes, "strict workspace validation must match the state bytes selected for import");
    assert.deepEqual(validatedSnapshot.state, state, "strict workspace validation must match the state selected for import");
    return { destination, bytes, state };
  }

  function assertApprovedTake(target, targetState) {
    assert.equal(targetState.recordingTextHash, target.recordingTextHash, `stale recording text for ${target.stableId}`);
    assert.equal(targetState.status, "approved-take", `recording target ${target.stableId} is not an approved take`);
    assert.equal(typeof targetState.approvedTakeId, "string", `recording target ${target.stableId} approved take ID is required`);
    const take = targetState.takes?.find((candidate) => candidate.id === targetState.approvedTakeId);
    assert.ok(take, `recording target ${target.stableId} approved take is missing`);
    assert.match(take.sha256, HASH_PATTERN, `recording target ${target.stableId} approved take hash is invalid`);
    assert.equal(take.recordingTextHash, target.recordingTextHash, `stale recording text for ${target.stableId}`);
    const expectedRelativePath = path.join("takes", encodeURIComponent(target.stableId), `${take.id}.webm`);
    assert.equal(take.relativePath, expectedRelativePath, `recording target ${target.stableId} approved take path is unsafe`);
    const sourcePath = assertWorkspacePath(path.join(normalizedWorkspaceRoot, take.relativePath), `recording target ${target.stableId} approved take`);
    const sourceStat = lstatIfExists(sourcePath);
    assert.ok(sourceStat && !sourceStat.isSymbolicLink() && sourceStat.isFile(), `recording target ${target.stableId} approved take is missing`);
    const source = fsApi.readFileSync(sourcePath);
    validateWebmBuffer(source);
    assert.equal(sha256(source), take.sha256, `recording target ${target.stableId} approved take has changed`);
    return { take, sourcePath, replacementSha256: take.sha256 };
  }

  function createOperations(state) {
    const operations = [];
    for (const target of [...catalog.targets].sort((left, right) => left.stableId.localeCompare(right.stableId))) {
      const targetState = state.targets[target.stableId];
      assert.ok(targetState, `recording workspace target is missing: ${target.stableId}`);
      if (targetState.status !== "approved-take") continue;
      const approved = assertApprovedTake(target, targetState);
      const targetPath = assertAudioTarget(target);
      const targetStat = lstatIfExists(targetPath);
      assert.ok(!targetStat || (!targetStat.isSymbolicLink() && targetStat.isFile()), `recording target ${target.stableId} output file is unsafe`);
      const current = targetStat ? fsApi.readFileSync(targetPath) : null;
      const currentSha256 = current === null ? null : sha256(current);
      if (currentSha256 === approved.replacementSha256) continue;
      operations.push({
        stableId: target.stableId,
        approvedTakeId: approved.take.id,
        sourcePath: approved.sourcePath,
        targetPath,
        currentSha256,
        replacementSha256: approved.replacementSha256,
        recordingTextHash: target.recordingTextHash,
        targetExisted: current !== null
      });
    }
    return operations;
  }

  function preflight(plan) {
    const snapshot = readStateSnapshot();
    const operations = createOperations(snapshot.state);
    assert.deepEqual(operations, plan.operations, "import plan is stale or has changed");
    return { ...snapshot, operations };
  }

  function ensureWorkspaceDirectory(relativePath, label) {
    const directory = assertWorkspacePath(path.join(normalizedWorkspaceRoot, relativePath), label);
    if (!fsApi.existsSync(directory)) fsApi.mkdirSync(directory, { recursive: true });
    assertWorkspacePath(directory, label);
    assertRegularDirectory(fsApi, directory, label);
    return directory;
  }

  function writeNewFile(destination, bytes, label) {
    let descriptor;
    try {
      descriptor = fsApi.openSync(destination, "wx", 0o600);
      fsApi.writeFileSync(descriptor, bytes);
      fsApi.fsyncSync(descriptor);
    } finally {
      if (descriptor !== undefined) fsApi.closeSync(descriptor);
    }
  }

  function writeImmutableJson(destination, value, label) {
    writeNewFile(destination, Buffer.from(`${JSON.stringify(value, null, 2)}\n`), label);
  }

  function stageReplacement(operation, planId, temporaryPaths, changed) {
    const temporary = `${operation.targetPath}.ana-tilim-import-${planId}.tmp`;
    assertNoSymlinkFrom(audioRoot, temporary, `recording target ${operation.stableId} temporary replacement`);
    temporaryPaths.push(temporary);
    const source = fsApi.readFileSync(operation.sourcePath);
    validateWebmBuffer(source);
    assert.equal(sha256(source), operation.replacementSha256, `recording target ${operation.stableId} approved take has changed`);
    writeNewFile(temporary, source, `recording target ${operation.stableId} temporary replacement`);
    const staged = fsApi.readFileSync(temporary);
    validateWebmBuffer(staged);
    assert.equal(sha256(staged), operation.replacementSha256, `recording target ${operation.stableId} staged replacement has changed`);
    const currentStat = lstatIfExists(operation.targetPath);
    assert.equal(currentStat !== null, operation.targetExisted, `recording target ${operation.stableId} changed before replacement`);
    if (currentStat) {
      assert.ok(!currentStat.isSymbolicLink() && currentStat.isFile(), `recording target ${operation.stableId} output file is unsafe`);
      assert.equal(sha256(fsApi.readFileSync(operation.targetPath)), operation.currentSha256, `recording target ${operation.stableId} changed before replacement`);
    }
    fsApi.renameSync(temporary, operation.targetPath);
    changed.push(operation);
    assert.equal(sha256(fsApi.readFileSync(operation.targetPath)), operation.replacementSha256, `recording target ${operation.stableId} replacement did not persist`);
    temporaryPaths.splice(temporaryPaths.indexOf(temporary), 1);
  }

  function replaceWithExactBytes(destination, bytes, label) {
    const temporary = `${destination}.ana-tilim-rollback-${crypto.randomBytes(4).toString("hex")}.tmp`;
    assertNoSymlinkFrom(audioRoot, temporary, `${label} temporary`);
    let descriptor;
    try {
      descriptor = fsApi.openSync(temporary, "wx", 0o600);
      fsApi.writeFileSync(descriptor, bytes);
      fsApi.fsyncSync(descriptor);
    } finally {
      if (descriptor !== undefined) fsApi.closeSync(descriptor);
    }
    fsApi.renameSync(temporary, destination);
  }

  function moveToFailure(candidate, recoveryDirectory, name) {
    if (!fsApi.existsSync(candidate)) return;
    const destination = path.join(recoveryDirectory, name);
    assertWorkspacePath(destination, "failed import recovery file");
    fsApi.renameSync(candidate, destination);
  }

  function rollback({ operations, changed, temporaryPaths, stateDestination, stateBytes, importId, planId, error }) {
    const recoveryDirectory = ensureWorkspaceDirectory(path.join("failed-imports", planId, importId), "failed import recovery directory");
    for (const operation of [...changed].reverse()) {
      if (operation.targetExisted) {
        assert.ok(operation.backupPath, `recording target ${operation.stableId} backup is missing`);
        const backup = fsApi.readFileSync(operation.backupPath);
        assert.equal(sha256(backup), operation.currentSha256, `recording target ${operation.stableId} backup has changed`);
        replaceWithExactBytes(operation.targetPath, backup, `recording target ${operation.stableId} rollback`);
      } else {
        moveToFailure(operation.targetPath, recoveryDirectory, `${encodeURIComponent(operation.stableId)}.webm`);
      }
    }
    for (const temporary of temporaryPaths) {
      moveToFailure(temporary, recoveryDirectory, `${path.basename(temporary)}.recovered`);
    }
    fsApi.writeFileSync(stateDestination, stateBytes);
    const importsDirectory = ensureWorkspaceDirectory("imports", "import log directory");
    writeImmutableJson(path.join(importsDirectory, `${importId}.failed.json`), {
      schemaVersion: 1,
      status: "failed",
      importId,
      planId,
      failedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      operations: operations.map((operation) => ({ stableId: operation.stableId, targetPath: operation.targetPath }))
    }, "failed import log");
  }

  function writeImportedState(snapshot, operations, importId, temporaryPaths) {
    const nextState = clone(snapshot.state);
    for (const operation of operations) {
      const targetState = nextState.targets[operation.stableId];
      targetState.status = "imported";
      // Task 3 requires imported records to retain their selected take for restart validation and provenance.
      targetState.approvedTakeId = operation.approvedTakeId;
    }
    nextState.updatedAt = new Date().toISOString();
    const temporary = assertWorkspacePath(path.join(normalizedWorkspaceRoot, `.ana-tilim-import-state-${importId}.tmp`), "import state temporary file");
    temporaryPaths.push(temporary);
    writeNewFile(temporary, Buffer.from(`${JSON.stringify(nextState, null, 2)}\n`), "import state temporary file");
    fsApi.renameSync(temporary, snapshot.destination);
    temporaryPaths.splice(temporaryPaths.indexOf(temporary), 1);
  }

  function readSuccessfulImport(importId) {
    assert.equal(typeof importId, "string", "import ID is required");
    assert.match(importId, SAFE_ID_PATTERN, "import ID is invalid");
    const importsDirectory = assertWorkspacePath(path.join(normalizedWorkspaceRoot, "imports"), "import log directory");
    const logPath = assertWorkspacePath(path.join(importsDirectory, `${importId}.success.json`), "successful import log");
    const stat = lstatIfExists(logPath);
    assert.ok(stat && !stat.isSymbolicLink() && stat.isFile(), "matching successful import was not found");
    let log;
    try {
      log = JSON.parse(fsApi.readFileSync(logPath, "utf8"));
    } catch (error) {
      assert.fail(`malformed successful import log: ${error.message}`);
    }
    assert.equal(log?.schemaVersion, 1, "unsupported successful import log schema");
    assert.equal(log.status, "success", "matching successful import was not found");
    assert.equal(log.importId, importId, "successful import log identity does not match");
    assert.ok(Array.isArray(log.operations), "successful import log operations are required");
    return { importsDirectory, log };
  }

  return Object.freeze({
    previewImport() {
      const snapshot = readStateSnapshot();
      const operations = createOperations(snapshot.state);
      const planId = sha256(Buffer.from(JSON.stringify(operations)));
      const createdAt = now();
      assert.ok(createdAt instanceof Date && Number.isFinite(createdAt.getTime()), "clock must return a valid date");
      activePlan = { planId, createdAt: createdAt.toISOString(), operations, used: false };
      return clone({ planId, createdAt: activePlan.createdAt, operations });
    },

    applyImport({ planId }) {
      assert.equal(typeof planId, "string", "import plan ID is required");
      assert.ok(activePlan && activePlan.planId === planId && !activePlan.used, "import plan is unknown, stale, or replayed");
      const currentTime = now();
      assert.ok(currentTime instanceof Date && Number.isFinite(currentTime.getTime()), "clock must return a valid date");
      const elapsed = currentTime.getTime() - Date.parse(activePlan.createdAt);
      assert.ok(elapsed >= 0 && elapsed <= PLAN_MAX_AGE_MS, "import plan is expired or stale");
      const snapshot = preflight(activePlan);
      activePlan.used = true;
      const importId = `${safeTimestamp()}-${crypto.randomBytes(4).toString("hex")}`;
      const temporaryPaths = [];
      const changed = [];
      let operationsWithBackups = [];
      try {
        const backupRoot = ensureWorkspaceDirectory(path.join("backups", importId), "import backup directory");
        operationsWithBackups = snapshot.operations.map((operation) => ({ ...operation, backupPath: null, backupSha256: null }));
        for (const operation of operationsWithBackups) {
          if (operation.targetExisted) {
            const categoryDirectory = ensureWorkspaceDirectory(path.join("backups", importId, catalogById.get(operation.stableId).category), "import backup category directory");
            const backupPath = path.join(categoryDirectory, path.basename(operation.targetPath));
            assert.ok(isInside(backupRoot, backupPath), `recording target ${operation.stableId} backup path escapes import backup directory`);
            const current = fsApi.readFileSync(operation.targetPath);
            assert.equal(sha256(current), operation.currentSha256, `recording target ${operation.stableId} changed before backup`);
            writeNewFile(backupPath, current, `recording target ${operation.stableId} backup file`);
            operation.backupPath = backupPath;
            operation.backupSha256 = sha256(current);
          }
          stageReplacement(operation, planId, temporaryPaths, changed);
        }
        writeImportedState(snapshot, operationsWithBackups, importId, temporaryPaths);
        const importsDirectory = ensureWorkspaceDirectory("imports", "import log directory");
        const result = {
          schemaVersion: 1,
          status: "success",
          importId,
          planId,
          completedAt: new Date().toISOString(),
          operations: operationsWithBackups
        };
        writeImmutableJson(path.join(importsDirectory, `${importId}.success.json`), result, "successful import log");
        return clone(result);
      } catch (error) {
        rollback({
          operations: operationsWithBackups,
          changed,
          temporaryPaths,
          stateDestination: snapshot.destination,
          stateBytes: snapshot.bytes,
          importId,
          planId,
          error
        });
        throw error;
      }
    },

    finalizeReplacement({ importId, stableId }) {
      assert.equal(typeof stableId, "string", "recording target ID is required");
      const { importsDirectory, log } = readSuccessfulImport(importId);
      const operation = log.operations.find((candidate) => candidate.stableId === stableId);
      assert.ok(operation, `successful import does not include ${stableId}`);
      assert.ok(operation.targetExisted, `recording target ${stableId} has no replaced backup to finalize`);
      const finalizationPath = assertWorkspacePath(path.join(importsDirectory, `${importId}-${encodeURIComponent(stableId)}.finalized.json`), "import finalization log");
      const pendingPath = assertWorkspacePath(path.join(importsDirectory, `${importId}-${encodeURIComponent(stableId)}.finalizing.json`), "pending import finalization log");
      assert.equal(fsApi.existsSync(finalizationPath), false, `recording target ${stableId} replacement is already finalized`);
      const target = catalogById.get(stableId);
      assert.ok(target, `unknown recording target: ${stableId}`);
      const targetPath = assertAudioTarget(target);
      assert.equal(targetPath, operation.targetPath, `recording target ${stableId} successful import target does not match`);
      assert.match(operation.replacementSha256, HASH_PATTERN, `recording target ${stableId} successful import replacement hash is invalid`);
      assert.equal(sha256(fsApi.readFileSync(targetPath)), operation.replacementSha256, `recording target ${stableId} replacement has changed since import`);
      const backupRoot = assertWorkspacePath(path.join(normalizedWorkspaceRoot, "backups"), "import backup root");
      const backupPath = assertWorkspacePath(operation.backupPath, `recording target ${stableId} backup file`);
      assert.ok(isInside(backupRoot, backupPath), `recording target ${stableId} backup escapes import backup root`);
      const pendingStat = lstatIfExists(pendingPath);
      let pending = null;
      if (pendingStat) {
        assert.ok(!pendingStat.isSymbolicLink() && pendingStat.isFile(), `recording target ${stableId} pending finalization log is unsafe`);
        try {
          pending = JSON.parse(fsApi.readFileSync(pendingPath, "utf8"));
        } catch (error) {
          assert.fail(`malformed pending import finalization log: ${error.message}`);
        }
        assert.equal(pending?.schemaVersion, 1, "unsupported pending import finalization log schema");
        assert.equal(pending.status, "pending-finalization", "pending import finalization log status is invalid");
        assert.equal(pending.importId, importId, "pending import finalization log identity does not match");
        assert.equal(pending.stableId, stableId, "pending import finalization target does not match");
        assertIsoTimestamp(pending.finalizedAt, "pending import finalization timestamp");
        assert.equal(pending.backupPath, backupPath, "pending import finalization backup does not match");
        assert.equal(pending.replacementSha256, operation.replacementSha256, "pending import finalization replacement does not match");
        assert.equal(pending.backupSha256, operation.backupSha256, "pending import finalization backup hash does not match");
      }
      const backupStat = lstatIfExists(backupPath);
      assert.match(operation.backupSha256, HASH_PATTERN, `recording target ${stableId} backup hash is invalid`);
      const finalized = {
        schemaVersion: 1,
        importId,
        stableId,
        finalizedAt: pending?.finalizedAt ?? new Date().toISOString(),
        backupPath,
        replacementSha256: operation.replacementSha256,
        backupSha256: operation.backupSha256
      };
      if (!backupStat) {
        assert.ok(pending, `recording target ${stableId} backup is missing`);
        fsApi.renameSync(pendingPath, finalizationPath);
        return clone(finalized);
      }
      assert.ok(!backupStat.isSymbolicLink() && backupStat.isFile(), `recording target ${stableId} backup is unsafe`);
      assert.equal(sha256(fsApi.readFileSync(backupPath)), operation.backupSha256, `recording target ${stableId} backup has changed`);
      if (!pending) writeImmutableJson(pendingPath, { ...finalized, status: "pending-finalization" }, "pending import finalization log");
      fsApi.unlinkSync(backupPath);
      assert.equal(fsApi.existsSync(backupPath), false, `recording target ${stableId} backup was not finalized`);
      fsApi.renameSync(pendingPath, finalizationPath);
      return clone(finalized);
    }
  });
}
