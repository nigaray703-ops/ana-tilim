#!/usr/bin/env node
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  LOUDNESS_STANDARD,
  isIntegratedLoudnessWithinTolerance,
  normalizeWebmBuffer
} from "./lib/audio-loudness.mjs";
import { validateWebmBuffer } from "./lib/webm-audio.mjs";
import { buildRecordingCatalog } from "./recording-studio/catalog.mjs";

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function compareStrings(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function assertRegularDirectory(fsApi, candidate, label) {
  const stat = fsApi.lstatSync(candidate);
  assert.ok(!stat.isSymbolicLink() && stat.isDirectory(), `${label} must be a regular directory`);
}

function assertIsoTimestamp(value, label) {
  assert.equal(typeof value, "string", `${label} must be an ISO timestamp`);
  assert.equal(new Date(value).toISOString(), value, `${label} must be an ISO timestamp`);
}

function assertExactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields are invalid`);
}

function assertFiniteMeasurement(value, label) {
  assertExactKeys(value, ["integratedLufs", "truePeakDbtp", "lraLu", "thresholdLufs", "offsetLu"], label);
  assert.ok(Object.values(value).every(Number.isFinite), `${label} values must be finite`);
}

function assertSafeAudioFile(fsApi, audioRoot, candidate, label) {
  assert.ok(isInside(audioRoot, candidate), `${label} escapes the human-audio root`);
  let current = audioRoot;
  for (const segment of path.relative(audioRoot, candidate).split(path.sep)) {
    if (!segment) continue;
    current = path.join(current, segment);
    const stat = fsApi.lstatSync(current);
    assert.ok(!stat.isSymbolicLink(), `${label} must not traverse a symbolic link`);
  }
  const stat = fsApi.lstatSync(candidate);
  assert.ok(stat.isFile(), `${label} must be a regular file`);
  assert.ok(isInside(fsApi.realpathSync(audioRoot), fsApi.realpathSync(candidate)), `${label} escapes the real human-audio root`);
}

function listWebmFiles(fsApi, directory) {
  const files = [];
  function visit(current) {
    for (const entry of fsApi.readdirSync(current, { withFileTypes: true })) {
      const candidate = path.join(current, entry.name);
      const stat = fsApi.lstatSync(candidate);
      assert.ok(!stat.isSymbolicLink(), "human-audio inventory must not traverse symbolic links");
      if (stat.isDirectory()) visit(candidate);
      else if (stat.isFile() && entry.name.endsWith(".webm")) files.push(candidate);
    }
  }
  visit(directory);
  return files.sort();
}

export function createHumanAudioLoudnessBatch({
  projectRoot,
  workspaceRoot,
  ffmpegPath,
  fsApi = fs,
  catalog: providedCatalog,
  normalizeBuffer = ({ buffer }) => normalizeWebmBuffer({ buffer, ffmpegPath })
}) {
  assert.equal(typeof projectRoot, "string", "projectRoot is required");
  assert.equal(typeof workspaceRoot, "string", "workspaceRoot is required");
  assert.equal(typeof ffmpegPath, "string", "ffmpegPath is required");
  const normalizedProjectRoot = path.resolve(projectRoot);
  const normalizedWorkspaceRoot = path.resolve(workspaceRoot);
  const normalizedTemporaryRoot = path.resolve(os.tmpdir());
  const audioRoot = path.resolve(normalizedProjectRoot, "prototype/assets/audio/human");
  assertRegularDirectory(fsApi, audioRoot, "human-audio root");
  const catalog = providedCatalog || buildRecordingCatalog({ projectRoot: normalizedProjectRoot });

  function workspaceAnchor(candidate) {
    if (candidate === normalizedProjectRoot || isInside(normalizedProjectRoot, candidate)) return normalizedProjectRoot;
    if (candidate === normalizedTemporaryRoot || isInside(normalizedTemporaryRoot, candidate)) return normalizedTemporaryRoot;
    assert.fail("loudness workspace must be inside the project root or system temporary root");
  }

  function assertNoSymlinkFrom(anchor, candidate, label) {
    let current = anchor;
    const anchorStat = fsApi.lstatSync(anchor);
    assert.ok(!anchorStat.isSymbolicLink() && anchorStat.isDirectory(), `${label} trusted root must be a regular directory`);
    for (const segment of path.relative(anchor, candidate).split(path.sep)) {
      if (!segment) continue;
      current = path.join(current, segment);
      if (!fsApi.existsSync(current)) break;
      const stat = fsApi.lstatSync(current);
      assert.ok(!stat.isSymbolicLink(), `${label} must not traverse a symbolic link`);
    }
  }

  function ensureDirectory(candidate, label) {
    const resolved = path.resolve(candidate);
    const anchor = workspaceAnchor(resolved);
    assertNoSymlinkFrom(anchor, resolved, label);
    if (!fsApi.existsSync(resolved)) fsApi.mkdirSync(resolved, { recursive: true });
    assertNoSymlinkFrom(anchor, resolved, label);
    assertRegularDirectory(fsApi, resolved, label);
    assert.ok(resolved === anchor || isInside(fsApi.realpathSync(anchor), fsApi.realpathSync(resolved)), `${label} escapes its trusted root`);
    return resolved;
  }

  function writeExclusiveFile(candidate, contents, label) {
    const resolved = path.resolve(candidate);
    const parent = ensureDirectory(path.dirname(resolved), `${label} parent`);
    assert.equal(path.dirname(resolved), parent, `${label} parent changed`);
    assertNoSymlinkFrom(workspaceAnchor(resolved), resolved, label);
    let descriptor;
    try {
      descriptor = fsApi.openSync(resolved, "wx", 0o600);
      fsApi.writeFileSync(descriptor, contents);
      fsApi.fsyncSync(descriptor);
    } finally {
      if (descriptor !== undefined) fsApi.closeSync(descriptor);
    }
    return resolved;
  }

  function writeExclusiveJson(candidate, value, label) {
    return writeExclusiveFile(candidate, `${JSON.stringify(value, null, 2)}\n`, label);
  }

  function fsyncDirectory(directory) {
    const descriptor = fsApi.openSync(directory, "r");
    try {
      fsApi.fsyncSync(descriptor);
    } finally {
      fsApi.closeSync(descriptor);
    }
  }

  function replaceJsonAtomically(candidate, value, label) {
    const temporary = `${candidate}.tmp-${crypto.randomBytes(4).toString("hex")}`;
    writeExclusiveJson(temporary, value, `${label} temporary`);
    fsApi.renameSync(temporary, candidate);
    fsyncDirectory(path.dirname(candidate));
  }

  function buildInventory() {
    assert.ok(catalog && Array.isArray(catalog.targets), "recording catalog targets are required");
    const stableIds = new Set();
    const filesByPath = new Map();
    const targets = [];

    for (const target of catalog.targets) {
      assert.equal(typeof target?.stableId, "string", "recording target stable ID is required");
      assert.ok(!stableIds.has(target.stableId), `duplicate recording target: ${target.stableId}`);
      stableIds.add(target.stableId);
      const absolutePath = path.resolve(target.absoluteOutputPath);
      assertSafeAudioFile(fsApi, audioRoot, absolutePath, `recording target ${target.stableId}`);
      const relativePath = path.relative(normalizedProjectRoot, absolutePath);
      targets.push(Object.freeze({ stableId: target.stableId, relativePath }));
      if (!filesByPath.has(absolutePath)) {
        const buffer = fsApi.readFileSync(absolutePath);
        const validation = validateWebmBuffer(buffer);
        filesByPath.set(absolutePath, {
          relativePath,
          absolutePath,
          originalSha256: sha256(buffer),
          originalSize: validation.size,
          originalDurationMs: validation.durationMs,
          stableIds: []
        });
      }
      filesByPath.get(absolutePath).stableIds.push(target.stableId);
    }

    const represented = new Set(filesByPath.keys());
    const diskFiles = listWebmFiles(fsApi, audioRoot);
    assert.deepEqual(diskFiles, [...represented].sort(), "human-audio disk files must match the recording catalog exactly");
    const files = [...filesByPath.values()]
      .sort((left, right) => compareStrings(left.relativePath, right.relativePath))
      .map((item) => Object.freeze({ ...item, stableIds: Object.freeze([...item.stableIds].sort()) }));

    return Object.freeze({
      targets: Object.freeze(targets.sort((left, right) => compareStrings(left.stableId, right.stableId))),
      files: Object.freeze(files)
    });
  }

  function prepare({ batchId, createdAt = new Date().toISOString() }) {
    assert.equal(typeof batchId, "string", "loudness batch ID is required");
    assert.match(batchId, /^[A-Za-z0-9-]+$/u, "loudness batch ID is invalid");
    assertIsoTimestamp(createdAt, "loudness batch createdAt");
    const batchesRoot = ensureDirectory(path.join(normalizedWorkspaceRoot, "loudness-batches"), "loudness batches root");
    const batchRoot = path.join(batchesRoot, batchId);
    assert.equal(fsApi.existsSync(batchRoot), false, `loudness batch already exists: ${batchId}`);
    ensureDirectory(batchRoot, "loudness batch root");
    const inventory = buildInventory();
    const operations = [];

    try {
      for (const item of inventory.files) {
        const source = fsApi.readFileSync(item.absolutePath);
        assert.equal(sha256(source), item.originalSha256, `source changed before staging: ${item.relativePath}`);
        let normalized;
        try {
          normalized = normalizeBuffer({
            buffer: Buffer.from(source),
            ffmpegPath,
            relativePath: item.relativePath,
            stableIds: [...item.stableIds]
          });
        } catch (error) {
          assert.fail(`failed to normalize ${item.relativePath}: ${error.message}`);
        }
        assert.ok(normalized && Buffer.isBuffer(normalized.buffer), `normalizer returned no WebM for ${item.relativePath}`);
        assert.ok(normalized.report && normalized.report.configVersion === LOUDNESS_STANDARD.version, `normalizer report is invalid for ${item.relativePath}`);
        const outputValidation = validateWebmBuffer(normalized.buffer);
        const stagedRelativePath = path.join("staged", item.relativePath);
        const stagedPath = path.join(batchRoot, stagedRelativePath);
        writeExclusiveFile(stagedPath, normalized.buffer, `staged audio ${item.relativePath}`);
        const stagedBytes = fsApi.readFileSync(stagedPath);
        const outputSha256 = sha256(stagedBytes);
        assert.equal(outputSha256, sha256(normalized.buffer), `staged audio changed for ${item.relativePath}`);
        operations.push({
          relativePath: item.relativePath,
          stableIds: [...item.stableIds],
          originalSha256: item.originalSha256,
          originalSize: item.originalSize,
          originalDurationMs: item.originalDurationMs,
          stagedRelativePath,
          outputSha256,
          outputSize: outputValidation.size,
          outputDurationMs: outputValidation.durationMs,
          loudness: JSON.parse(JSON.stringify(normalized.report))
        });
      }

      const plan = {
        schemaVersion: 1,
        configVersion: LOUDNESS_STANDARD.version,
        batchId,
        createdAt,
        status: "prepared",
        projectRootHash: sha256(Buffer.from(normalizedProjectRoot)),
        targetCount: inventory.targets.length,
        physicalFileCount: inventory.files.length,
        operations
      };
      const report = {
        schemaVersion: 1,
        configVersion: LOUDNESS_STANDARD.version,
        batchId,
        createdAt,
        targetCount: plan.targetCount,
        physicalFileCount: plan.physicalFileCount,
        failures: [],
        operations: operations.map(({ relativePath, stableIds, originalSha256, outputSha256, originalDurationMs, outputDurationMs, loudness }) => ({
          relativePath, stableIds, originalSha256, outputSha256, originalDurationMs, outputDurationMs, loudness
        }))
      };
      writeExclusiveJson(path.join(batchRoot, "report.json"), report, "loudness batch report");
      const temporaryPlanPath = writeExclusiveJson(path.join(batchRoot, "plan.json.tmp"), plan, "temporary loudness plan");
      const planPath = path.join(batchRoot, "plan.json");
      fsApi.renameSync(temporaryPlanPath, planPath);
      return { planPath, plan: JSON.parse(JSON.stringify(plan)) };
    } catch (error) {
      const errorPath = path.join(batchRoot, "error.json");
      if (!fsApi.existsSync(errorPath)) {
        try {
          writeExclusiveJson(errorPath, {
            schemaVersion: 1,
            batchId,
            failedAt: new Date().toISOString(),
            message: String(error?.message || error)
          }, "loudness batch error");
        } catch {
          // Preserve the original staging failure even if the audit record cannot be written.
        }
      }
      throw error;
    }
  }

  function readPlan({ planPath }) {
    assert.equal(typeof planPath, "string", "loudness plan path is required");
    const resolvedPlanPath = path.resolve(planPath);
    assert.ok(isInside(normalizedWorkspaceRoot, resolvedPlanPath), "loudness plan escapes the workspace root");
    const workspaceRootStat = fsApi.lstatSync(normalizedWorkspaceRoot);
    assert.ok(!workspaceRootStat.isSymbolicLink() && workspaceRootStat.isDirectory(), "loudness workspace root must be a regular directory");
    assertNoSymlinkFrom(workspaceAnchor(resolvedPlanPath), resolvedPlanPath, "loudness plan");
    const planStat = fsApi.lstatSync(resolvedPlanPath);
    assert.ok(!planStat.isSymbolicLink() && planStat.isFile(), "loudness plan must be a regular file");
    let plan;
    try {
      plan = JSON.parse(fsApi.readFileSync(resolvedPlanPath, "utf8"));
    } catch (error) {
      assert.fail(`malformed loudness plan: ${error.message}`);
    }
    assertExactKeys(plan, [
      "schemaVersion", "configVersion", "batchId", "createdAt", "status", "projectRootHash",
      "targetCount", "physicalFileCount", "operations"
    ], "loudness plan");
    assert.equal(plan.schemaVersion, 1, "unsupported loudness plan schema");
    assert.equal(plan.configVersion, LOUDNESS_STANDARD.version, "loudness plan config version is invalid");
    assert.match(plan.batchId, /^[A-Za-z0-9-]+$/u, "loudness plan batch ID is invalid");
    assertIsoTimestamp(plan.createdAt, "loudness plan createdAt");
    assert.equal(plan.status, "prepared", "loudness plan is not prepared");
    assert.equal(plan.projectRootHash, sha256(Buffer.from(normalizedProjectRoot)), "loudness plan project root is stale");
    const batchRoot = path.resolve(normalizedWorkspaceRoot, "loudness-batches", plan.batchId);
    assert.equal(resolvedPlanPath, path.join(batchRoot, "plan.json"), "loudness plan path does not match its batch ID");
    assert.ok(Array.isArray(plan.operations), "loudness plan operations must be an array");

    const inventory = buildInventory();
    assert.equal(plan.targetCount, inventory.targets.length, "loudness plan target count is stale");
    assert.equal(plan.physicalFileCount, inventory.files.length, "loudness plan physical file count is stale");
    assert.equal(plan.operations.length, inventory.files.length, "loudness plan operations are incomplete");
    const relativePaths = plan.operations.map((operation) => operation?.relativePath);
    assert.deepEqual(relativePaths, [...relativePaths].sort(), "loudness plan operation order is invalid");
    assert.equal(new Set(relativePaths).size, relativePaths.length, "loudness plan has a duplicate operation path");
    const inventoryByPath = new Map(inventory.files.map((item) => [item.relativePath, item]));

    for (const operation of plan.operations) {
      assertExactKeys(operation, [
        "relativePath", "stableIds", "originalSha256", "originalSize", "originalDurationMs",
        "stagedRelativePath", "outputSha256", "outputSize", "outputDurationMs", "loudness"
      ], `loudness operation ${operation?.relativePath || "unknown"}`);
      const inventoryItem = inventoryByPath.get(operation.relativePath);
      assert.ok(inventoryItem, `loudness plan contains an unknown source: ${operation.relativePath}`);
      assert.deepEqual(operation.stableIds, inventoryItem.stableIds, `loudness stable IDs are stale for ${operation.relativePath}`);
      assert.equal(operation.originalSha256, inventoryItem.originalSha256, `source changed after staging: ${operation.relativePath}`);
      assert.equal(operation.originalSize, inventoryItem.originalSize, `source size changed after staging: ${operation.relativePath}`);
      assert.equal(operation.originalDurationMs, inventoryItem.originalDurationMs, `source duration changed after staging: ${operation.relativePath}`);
      assert.equal(operation.stagedRelativePath, path.join("staged", operation.relativePath), `loudness staged path is invalid for ${operation.relativePath}`);
      const stagedPath = path.resolve(batchRoot, operation.stagedRelativePath);
      assert.ok(isInside(batchRoot, stagedPath), `loudness staged path escapes its batch for ${operation.relativePath}`);
      assertNoSymlinkFrom(workspaceAnchor(stagedPath), stagedPath, `staged audio ${operation.relativePath}`);
      const stagedStat = fsApi.lstatSync(stagedPath);
      assert.ok(!stagedStat.isSymbolicLink() && stagedStat.isFile(), `staged audio is unsafe for ${operation.relativePath}`);
      const stagedBytes = fsApi.readFileSync(stagedPath);
      assert.equal(sha256(stagedBytes), operation.outputSha256, `staged audio has changed for ${operation.relativePath}`);
      const stagedValidation = validateWebmBuffer(stagedBytes);
      assert.equal(stagedValidation.size, operation.outputSize, `staged audio size is stale for ${operation.relativePath}`);
      assert.equal(stagedValidation.durationMs, operation.outputDurationMs, `staged audio duration is stale for ${operation.relativePath}`);
      assertExactKeys(operation.loudness, ["configVersion", "input", "output"], `loudness report ${operation.relativePath}`);
      assert.equal(operation.loudness.configVersion, LOUDNESS_STANDARD.version, `loudness report config is stale for ${operation.relativePath}`);
      assertFiniteMeasurement(operation.loudness.input, `input loudness ${operation.relativePath}`);
      assertFiniteMeasurement(operation.loudness.output, `output loudness ${operation.relativePath}`);
      assert.ok(
        isIntegratedLoudnessWithinTolerance(operation.loudness.output.integratedLufs),
        `staged audio loudness is outside tolerance for ${operation.relativePath}`
      );
      assert.ok(
        operation.loudness.output.truePeakDbtp <= LOUDNESS_STANDARD.truePeakDbtp,
        `staged audio true peak is too high for ${operation.relativePath}`
      );
    }
    return JSON.parse(JSON.stringify(plan));
  }

  function apply({ planPath, appliedAt = new Date().toISOString() }) {
    assertIsoTimestamp(appliedAt, "loudness batch appliedAt");
    const resolvedPlanPath = path.resolve(planPath);
    const batchRoot = path.dirname(resolvedPlanPath);
    const journalPath = path.join(batchRoot, "journal.json");
    assert.equal(fsApi.existsSync(journalPath), false, "loudness batch already has a journal");
    const plan = readPlan({ planPath: resolvedPlanPath });
    const journal = {
      schemaVersion: 1,
      configVersion: LOUDNESS_STANDARD.version,
      batchId: plan.batchId,
      planSha256: sha256(fsApi.readFileSync(resolvedPlanPath)),
      createdAt: new Date().toISOString(),
      status: "backing-up",
      backupRelativePaths: [],
      changedRelativePaths: [],
      appliedAt: null,
      recoveredAt: null,
      error: null
    };
    writeExclusiveJson(journalPath, journal, "loudness batch journal");

    try {
      for (const operation of plan.operations) {
        const sourcePath = path.resolve(normalizedProjectRoot, operation.relativePath);
        assertSafeAudioFile(fsApi, audioRoot, sourcePath, `source audio ${operation.relativePath}`);
        const source = fsApi.readFileSync(sourcePath);
        assert.equal(sha256(source), operation.originalSha256, `source changed before backup: ${operation.relativePath}`);
        const backupRelativePath = path.join("backups", operation.relativePath);
        const backupPath = path.join(batchRoot, backupRelativePath);
        writeExclusiveFile(backupPath, source, `backup audio ${operation.relativePath}`);
        assert.equal(sha256(fsApi.readFileSync(backupPath)), operation.originalSha256, `backup verification failed: ${operation.relativePath}`);
        journal.backupRelativePaths.push(backupRelativePath);
        replaceJsonAtomically(journalPath, journal, "loudness batch journal");
      }
    } catch (error) {
      journal.status = "backup-failed";
      journal.error = String(error?.message || error);
      replaceJsonAtomically(journalPath, journal, "loudness batch journal");
      throw error;
    }

    journal.status = "applying";
    replaceJsonAtomically(journalPath, journal, "loudness batch journal");
    let pendingTemporaryPath = null;
    try {
      for (const [index, operation] of plan.operations.entries()) {
        const sourcePath = path.resolve(normalizedProjectRoot, operation.relativePath);
        const sourceBefore = fsApi.readFileSync(sourcePath);
        assert.equal(sha256(sourceBefore), operation.originalSha256, `source changed before replacement: ${operation.relativePath}`);
        const stagedPath = path.resolve(batchRoot, operation.stagedRelativePath);
        const staged = fsApi.readFileSync(stagedPath);
        assert.equal(sha256(staged), operation.outputSha256, `staged audio changed before replacement: ${operation.relativePath}`);
        pendingTemporaryPath = path.join(
          path.dirname(sourcePath),
          `.${path.basename(sourcePath)}.loudness-replacement-${plan.batchId}-${index}.tmp`
        );
        writeExclusiveFile(pendingTemporaryPath, staged, `replacement audio ${operation.relativePath}`);
        assert.equal(sha256(fsApi.readFileSync(pendingTemporaryPath)), operation.outputSha256, `replacement temporary changed: ${operation.relativePath}`);
        fsApi.renameSync(pendingTemporaryPath, sourcePath);
        pendingTemporaryPath = null;
        fsyncDirectory(path.dirname(sourcePath));
        assert.equal(sha256(fsApi.readFileSync(sourcePath)), operation.outputSha256, `replacement verification failed: ${operation.relativePath}`);
        journal.changedRelativePaths.push(operation.relativePath);
        replaceJsonAtomically(journalPath, journal, "loudness batch journal");
      }
      journal.status = "applied";
      journal.appliedAt = appliedAt;
      journal.error = null;
      replaceJsonAtomically(journalPath, journal, "loudness batch journal");
      return {
        batchId: plan.batchId,
        status: journal.status,
        appliedAt,
        operations: plan.operations.map(({ relativePath, originalSha256, outputSha256 }) => ({ relativePath, originalSha256, outputSha256 }))
      };
    } catch (error) {
      if (pendingTemporaryPath && fsApi.existsSync(pendingTemporaryPath)) fsApi.unlinkSync(pendingTemporaryPath);
      let rollbackError = null;
      for (const relativePath of [...journal.changedRelativePaths].reverse()) {
        const operation = plan.operations.find((item) => item.relativePath === relativePath);
        const sourcePath = path.resolve(normalizedProjectRoot, relativePath);
        const backupPath = path.resolve(batchRoot, "backups", relativePath);
        try {
          const backup = fsApi.readFileSync(backupPath);
          assert.equal(sha256(backup), operation.originalSha256, `backup changed before recovery: ${relativePath}`);
          const restoreTemporary = path.join(
            path.dirname(sourcePath),
            `.${path.basename(sourcePath)}.loudness-restore-${plan.batchId}.tmp`
          );
          writeExclusiveFile(restoreTemporary, backup, `recovery audio ${relativePath}`);
          fsApi.renameSync(restoreTemporary, sourcePath);
          fsyncDirectory(path.dirname(sourcePath));
          assert.equal(sha256(fsApi.readFileSync(sourcePath)), operation.originalSha256, `recovery verification failed: ${relativePath}`);
          journal.changedRelativePaths = journal.changedRelativePaths.filter((item) => item !== relativePath);
          replaceJsonAtomically(journalPath, journal, "loudness batch journal");
        } catch (candidateError) {
          rollbackError = candidateError;
          break;
        }
      }
      journal.status = rollbackError ? "manual-recovery-required" : "recovered";
      journal.recoveredAt = rollbackError ? null : new Date().toISOString();
      journal.error = rollbackError
        ? `${String(error?.message || error)}; recovery failed: ${String(rollbackError?.message || rollbackError)}`
        : String(error?.message || error);
      replaceJsonAtomically(journalPath, journal, "loudness batch journal");
      if (rollbackError) throw new AggregateError([error, rollbackError], "loudness replacement and recovery failed");
      throw error;
    }
  }

  function recover({ planPath, recoveredAt = new Date().toISOString() }) {
    assertIsoTimestamp(recoveredAt, "loudness batch recoveredAt");
    const resolvedPlanPath = path.resolve(planPath);
    assert.ok(isInside(normalizedWorkspaceRoot, resolvedPlanPath), "loudness recovery plan escapes the workspace root");
    assertNoSymlinkFrom(workspaceAnchor(resolvedPlanPath), resolvedPlanPath, "loudness recovery plan");
    const planBytes = fsApi.readFileSync(resolvedPlanPath);
    let plan;
    try {
      plan = JSON.parse(planBytes.toString("utf8"));
    } catch (error) {
      assert.fail(`malformed loudness recovery plan: ${error.message}`);
    }
    assertExactKeys(plan, [
      "schemaVersion", "configVersion", "batchId", "createdAt", "status", "projectRootHash",
      "targetCount", "physicalFileCount", "operations"
    ], "loudness recovery plan");
    assert.equal(plan.schemaVersion, 1, "unsupported loudness recovery plan schema");
    assert.equal(plan.configVersion, LOUDNESS_STANDARD.version, "loudness recovery plan config version is invalid");
    assert.equal(plan.status, "prepared", "loudness recovery plan is not prepared");
    assert.equal(plan.projectRootHash, sha256(Buffer.from(normalizedProjectRoot)), "loudness recovery plan project root is stale");
    const batchRoot = path.resolve(normalizedWorkspaceRoot, "loudness-batches", plan.batchId);
    assert.equal(resolvedPlanPath, path.join(batchRoot, "plan.json"), "loudness recovery plan path is invalid");
    assert.ok(Array.isArray(plan.operations), "loudness recovery operations must be an array");
    assert.equal(new Set(plan.operations.map((item) => item.relativePath)).size, plan.operations.length, "loudness recovery plan has duplicate paths");

    const journalPath = path.join(batchRoot, "journal.json");
    assertNoSymlinkFrom(workspaceAnchor(journalPath), journalPath, "loudness recovery journal");
    let journal;
    try {
      journal = JSON.parse(fsApi.readFileSync(journalPath, "utf8"));
    } catch (error) {
      assert.fail(`malformed loudness recovery journal: ${error.message}`);
    }
    assertExactKeys(journal, [
      "schemaVersion", "configVersion", "batchId", "planSha256", "createdAt", "status",
      "backupRelativePaths", "changedRelativePaths", "appliedAt", "recoveredAt", "error"
    ], "loudness recovery journal");
    assert.equal(journal.schemaVersion, 1, "unsupported loudness recovery journal schema");
    assert.equal(journal.configVersion, LOUDNESS_STANDARD.version, "loudness recovery journal config is invalid");
    assert.equal(journal.batchId, plan.batchId, "loudness recovery journal batch is invalid");
    assert.equal(journal.planSha256, sha256(planBytes), "loudness recovery plan has changed");
    assertIsoTimestamp(journal.createdAt, "loudness recovery journal createdAt");
    assert.ok(["applying", "manual-recovery-required"].includes(journal.status), "loudness journal does not require recovery");
    assert.ok(Array.isArray(journal.backupRelativePaths), "loudness recovery backup paths must be an array");
    assert.ok(Array.isArray(journal.changedRelativePaths), "loudness recovery changed paths must be an array");
    assert.equal(new Set(journal.changedRelativePaths).size, journal.changedRelativePaths.length, "loudness recovery journal has duplicate changed paths");
    const operationsByPath = new Map(plan.operations.map((item) => [item.relativePath, item]));

    try {
      for (const operation of plan.operations) {
        const sourcePath = path.resolve(normalizedProjectRoot, operation.relativePath);
        assertSafeAudioFile(fsApi, audioRoot, sourcePath, `recovery source ${operation.relativePath}`);
        const sourceSha = sha256(fsApi.readFileSync(sourcePath));
        const changed = journal.changedRelativePaths.includes(operation.relativePath);
        assert.equal(
          sourceSha,
          changed ? operation.outputSha256 : operation.originalSha256,
          `source state does not match the recovery journal: ${operation.relativePath}`
        );
        const stagedPath = path.resolve(batchRoot, operation.stagedRelativePath);
        assert.ok(isInside(batchRoot, stagedPath), `recovery staged path escapes its batch: ${operation.relativePath}`);
        assert.equal(sha256(fsApi.readFileSync(stagedPath)), operation.outputSha256, `staged audio changed before recovery: ${operation.relativePath}`);
        if (changed) {
          const expectedBackupRelativePath = path.join("backups", operation.relativePath);
          assert.ok(journal.backupRelativePaths.includes(expectedBackupRelativePath), `recovery backup is missing from the journal: ${operation.relativePath}`);
          const backupPath = path.resolve(batchRoot, expectedBackupRelativePath);
          assert.ok(isInside(batchRoot, backupPath), `recovery backup path escapes its batch: ${operation.relativePath}`);
          assert.equal(sha256(fsApi.readFileSync(backupPath)), operation.originalSha256, `backup changed before recovery: ${operation.relativePath}`);
        }
      }

      for (const relativePath of [...journal.changedRelativePaths].reverse()) {
        const operation = operationsByPath.get(relativePath);
        assert.ok(operation, `recovery journal contains an unknown changed path: ${relativePath}`);
        const sourcePath = path.resolve(normalizedProjectRoot, relativePath);
        const backupPath = path.resolve(batchRoot, "backups", relativePath);
        const backup = fsApi.readFileSync(backupPath);
        const restoreTemporary = path.join(
          path.dirname(sourcePath),
          `.${path.basename(sourcePath)}.loudness-restore-${plan.batchId}.tmp`
        );
        writeExclusiveFile(restoreTemporary, backup, `restart recovery audio ${relativePath}`);
        fsApi.renameSync(restoreTemporary, sourcePath);
        fsyncDirectory(path.dirname(sourcePath));
        assert.equal(sha256(fsApi.readFileSync(sourcePath)), operation.originalSha256, `restart recovery verification failed: ${relativePath}`);
        journal.changedRelativePaths = journal.changedRelativePaths.filter((item) => item !== relativePath);
        replaceJsonAtomically(journalPath, journal, "loudness recovery journal");
      }
      journal.status = "recovered";
      journal.recoveredAt = recoveredAt;
      journal.error = null;
      replaceJsonAtomically(journalPath, journal, "loudness recovery journal");
      return { batchId: plan.batchId, status: journal.status, recoveredAt };
    } catch (error) {
      journal.status = "manual-recovery-required";
      journal.error = String(error?.message || error);
      replaceJsonAtomically(journalPath, journal, "loudness recovery journal");
      throw error;
    }
  }

  return Object.freeze({ buildInventory, prepare, readPlan, apply, recover });
}
