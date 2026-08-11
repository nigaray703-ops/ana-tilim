import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createHumanAudioLoudnessBatch } from "../tools/human-audio-loudness-batch.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const validWebm = fs.readFileSync(path.join(projectRoot, "prototype/assets/audio/human/alphabet/human_letter_01_b.webm"));
const alternateWebm = fs.readFileSync(path.join(projectRoot, "prototype/assets/audio/human/alphabet/human_letter_02_p.webm"));

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function createFixture() {
  const fixtureProjectRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-loudness-batch-project-"));
  const workspaceRoot = path.join(fixtureProjectRoot, "recording-workspace");
  const categoryRoot = path.join(fixtureProjectRoot, "prototype/assets/audio/human/alphabet");
  fs.mkdirSync(categoryRoot, { recursive: true });
  const firstPath = path.join(categoryRoot, "first.webm");
  const secondPath = path.join(categoryRoot, "second.webm");
  fs.writeFileSync(firstPath, validWebm);
  fs.writeFileSync(secondPath, validWebm);
  const catalog = {
    targets: [
      { stableId: "alphabet:first", absoluteOutputPath: firstPath },
      { stableId: "reading:reuses-first", absoluteOutputPath: firstPath },
      { stableId: "alphabet:second", absoluteOutputPath: secondPath }
    ]
  };
  return { fixtureProjectRoot, workspaceRoot, firstPath, secondPath, catalog };
}

function literalReport(integratedLufs) {
  return {
    configVersion: "ana-tilim-loudness-v1",
    input: { integratedLufs, truePeakDbtp: -4, lraLu: 1, thresholdLufs: -35, offsetLu: 0 },
    output: { integratedLufs: -18, truePeakDbtp: -1.5, lraLu: 1, thresholdLufs: -28, offsetLu: 0 }
  };
}

function prepareFixture(batchId) {
  const fixture = createFixture();
  const controller = createHumanAudioLoudnessBatch({
    projectRoot: fixture.fixtureProjectRoot,
    workspaceRoot: fixture.workspaceRoot,
    ffmpegPath: "/trusted/ffmpeg",
    catalog: fixture.catalog,
    normalizeBuffer: ({ buffer }) => ({ buffer: Buffer.from(buffer), report: literalReport(-22) })
  });
  const prepared = controller.prepare({ batchId, createdAt: "2026-08-12T01:00:00.000Z" });
  return { fixture, controller, prepared };
}

test("builds the exact 554-target to 552-physical-file human audio inventory", () => {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-loudness-inventory-"));
  const controller = createHumanAudioLoudnessBatch({
    projectRoot,
    workspaceRoot,
    ffmpegPath: "/unused/ffmpeg"
  });
  const inventory = controller.buildInventory();

  assert.equal(inventory.targets.length, 554);
  assert.equal(inventory.files.length, 552);
  assert.equal(new Set(inventory.targets.map((item) => item.stableId)).size, 554);
  assert.equal(new Set(inventory.files.map((item) => item.relativePath)).size, 552);
  assert.deepEqual([...inventory.files].map((item) => item.relativePath), [...inventory.files].map((item) => item.relativePath).sort());
  assert.ok(inventory.files.every((item) => item.relativePath.startsWith("prototype/assets/audio/human/")));
  assert.equal(inventory.files.reduce((sum, item) => sum + item.stableIds.length, 0), 554);
  assert.ok(inventory.files.every((item) => /^[a-f0-9]{64}$/u.test(item.originalSha256)));
});

test("prepares every unique file before publishing an immutable zero-source-write plan", () => {
  const fixture = createFixture();
  const before = new Map([
    [fixture.firstPath, fs.readFileSync(fixture.firstPath)],
    [fixture.secondPath, fs.readFileSync(fixture.secondPath)]
  ]);
  let normalized = 0;
  const controller = createHumanAudioLoudnessBatch({
    projectRoot: fixture.fixtureProjectRoot,
    workspaceRoot: fixture.workspaceRoot,
    ffmpegPath: "/trusted/ffmpeg",
    catalog: fixture.catalog,
    normalizeBuffer: ({ buffer }) => {
      normalized += 1;
      return { buffer: Buffer.from(buffer), report: literalReport(-20 - normalized) };
    }
  });

  const prepared = controller.prepare({ batchId: "fixture-success", createdAt: "2026-08-12T01:00:00.000Z" });

  assert.equal(normalized, 2);
  assert.equal(prepared.plan.targetCount, 3);
  assert.equal(prepared.plan.physicalFileCount, 2);
  assert.equal(prepared.plan.status, "prepared");
  assert.deepEqual(prepared.plan.operations.map((item) => item.stableIds.length), [2, 1]);
  assert.deepEqual(prepared.plan.operations.map((item) => item.originalSha256), [sha256(validWebm), sha256(validWebm)]);
  assert.ok(fs.existsSync(prepared.planPath));
  assert.ok(fs.existsSync(path.join(path.dirname(prepared.planPath), "report.json")));
  assert.equal(fs.readFileSync(fixture.firstPath).equals(before.get(fixture.firstPath)), true);
  assert.equal(fs.readFileSync(fixture.secondPath).equals(before.get(fixture.secondPath)), true);
  for (const operation of prepared.plan.operations) {
    const stagedPath = path.join(path.dirname(prepared.planPath), operation.stagedRelativePath);
    assert.equal(fs.readFileSync(stagedPath).equals(validWebm), true);
    assert.equal(operation.outputSha256, sha256(validWebm));
  }
});

test("a normalization failure leaves every source unchanged and never publishes a plan", () => {
  const fixture = createFixture();
  const beforeFirst = fs.readFileSync(fixture.firstPath);
  const beforeSecond = fs.readFileSync(fixture.secondPath);
  let normalized = 0;
  const controller = createHumanAudioLoudnessBatch({
    projectRoot: fixture.fixtureProjectRoot,
    workspaceRoot: fixture.workspaceRoot,
    ffmpegPath: "/trusted/ffmpeg",
    catalog: fixture.catalog,
    normalizeBuffer: ({ buffer }) => {
      normalized += 1;
      if (normalized === 2) throw new Error("fixture normalization failed");
      return { buffer: Buffer.from(buffer), report: literalReport(-24) };
    }
  });

  assert.throws(
    () => controller.prepare({ batchId: "fixture-failure", createdAt: "2026-08-12T01:00:00.000Z" }),
    /fixture normalization failed/
  );
  const batchRoot = path.join(fixture.workspaceRoot, "loudness-batches", "fixture-failure");
  assert.equal(fs.existsSync(path.join(batchRoot, "plan.json")), false);
  assert.ok(fs.existsSync(path.join(batchRoot, "error.json")));
  assert.equal(fs.readFileSync(fixture.firstPath).equals(beforeFirst), true);
  assert.equal(fs.readFileSync(fixture.secondPath).equals(beforeSecond), true);
});

test("readPlan accepts only the still-current source and staged bytes", () => {
  const valid = prepareFixture("fixture-read-valid");
  assert.deepEqual(valid.controller.readPlan({ planPath: valid.prepared.planPath }), valid.prepared.plan);

  const stagedTamper = prepareFixture("fixture-staged-tamper");
  const stagedPath = path.join(
    path.dirname(stagedTamper.prepared.planPath),
    stagedTamper.prepared.plan.operations[0].stagedRelativePath
  );
  fs.writeFileSync(stagedPath, alternateWebm);
  assert.throws(() => stagedTamper.controller.readPlan({ planPath: stagedTamper.prepared.planPath }), /staged audio has changed/);

  const sourceTamper = prepareFixture("fixture-source-tamper");
  fs.writeFileSync(sourceTamper.fixture.firstPath, alternateWebm);
  assert.throws(() => sourceTamper.controller.readPlan({ planPath: sourceTamper.prepared.planPath }), /source changed after staging/);
});

test("readPlan rejects config, ordering, duplicate, and path drift", () => {
  for (const [suffix, mutate, expected] of [
    ["config", (plan) => { plan.configVersion = "wrong-version"; }, /config version/],
    ["ordering", (plan) => { plan.operations.reverse(); }, /operation order/],
    ["duplicate", (plan) => { plan.operations[1] = JSON.parse(JSON.stringify(plan.operations[0])); }, /duplicate operation path/],
    ["path", (plan) => { plan.operations[0].stagedRelativePath = "staged/../../outside.webm"; }, /staged path/]
  ]) {
    const item = prepareFixture(`fixture-plan-${suffix}`);
    const plan = JSON.parse(fs.readFileSync(item.prepared.planPath, "utf8"));
    mutate(plan);
    fs.writeFileSync(item.prepared.planPath, `${JSON.stringify(plan, null, 2)}\n`);
    assert.throws(() => item.controller.readPlan({ planPath: item.prepared.planPath }), expected);
  }
});
