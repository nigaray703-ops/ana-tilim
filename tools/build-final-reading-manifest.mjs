#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateWebmBuffer } from "./lib/webm-audio.mjs";

const EXPECTED_GROUPS = Object.freeze([
  ["grammar-person-verbs", 3],
  ["grammar-possession", 3],
  ["grammar-location-direction", 3],
  ["grammar-basic-time", 3],
  ["sentence-self-introduction", 4],
  ["sentence-location-direction", 4],
  ["sentence-ability-preference", 4],
  ["sentence-polite-reason", 4]
]);

function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function validateContract(reviewContract) {
  assert.equal(reviewContract?.schemaVersion, 1, "final reading contract schema drift");
  assert.equal(reviewContract.ownerDecision, "approved-topics", "final reading topics are not approved");
  const groups = reviewContract.units?.flatMap((unit) => unit.groups.map((group) => ({ ...group, unitId: unit.unitId }))) || [];
  assert.deepEqual(groups.map((group) => [group.id, group.items.length]), EXPECTED_GROUPS, "final reading group contract drift");
  assert.ok(groups.every((group) => group.reviewStatus === "approved"), "final reading group is not approved");
  assert.ok(groups.flatMap((group) => group.items).every((item) => item.reviewStatus === "approved"), "final reading item is not approved");
  return groups;
}

export function buildFinalReadingManifest({ projectRoot, reviewContract, currentManifest, checkAudio }) {
  assert.equal(typeof projectRoot, "string", "projectRoot is required");
  assert.ok(currentManifest && Array.isArray(currentManifest.items), "current reading manifest is required");
  assert.ok(
    [164, 192].includes(currentManifest.items.length),
    "final reading manifest builder requires the 164-row baseline or published 192-row manifest"
  );
  assert.equal(typeof checkAudio, "function", "checkAudio is required");
  const normalizedProjectRoot = path.resolve(projectRoot);
  const prototypeRoot = path.join(normalizedProjectRoot, "prototype");
  const audioRoot = path.join(prototypeRoot, "assets/audio/human/reading");
  const groups = validateContract(reviewContract);
  const baselineItems = currentManifest.items.slice(0, 164);
  const currentByStableId = new Map(baselineItems.map((item) => [`reading:${item.id}`, item]));
  const ids = new Set(baselineItems.map((item) => item.id));
  const appended = [];

  for (const group of groups) {
    for (const item of group.items) {
      assert.ok(!ids.has(item.id), `duplicate final reading ID: ${item.id}`);
      ids.add(item.id);
      let file = `human_reading_${item.id.replaceAll("-", "_")}.webm`;
      let outputPath = `./assets/audio/human/reading/${file}`;
      if (item.reuseAudioFromStableId) {
        const reused = currentByStableId.get(item.reuseAudioFromStableId);
        assert.ok(reused, `approved reused audio target is missing: ${item.reuseAudioFromStableId}`);
        assert.equal(reused.value.replace(/[.!?؟،,:;؛]+$/u, ""), item.value.replace(/[.!?؟،,:;؛]+$/u, ""), `approved reused audio text drift for ${item.id}`);
        file = reused.file;
        outputPath = reused.outputPath;
      }
      assert.equal(path.basename(file), file, `unsafe reading audio filename for ${item.id}`);
      assert.match(file, /^[a-z0-9_]+\.webm$/, `invalid reading audio filename for ${item.id}`);
      const absolutePath = path.resolve(prototypeRoot, outputPath);
      assert.ok(inside(audioRoot, absolutePath), `reading audio path escapes its directory for ${item.id}`);
      checkAudio({ id: item.id, file, outputPath, absolutePath, value: item.value });
      appended.push({
        order: 0,
        id: item.id,
        unitId: group.unitId,
        groupId: group.id,
        value: item.value,
        latin: item.latin,
        file,
        outputPath,
        reviewStatus: "已接入",
        playable: true,
        statusLabel: "真人音频"
      });
    }
  }

  const items = [...baselineItems.map((item) => ({ ...item })), ...appended]
    .map((item, index) => ({ ...item, order: index + 1 }));
  assert.equal(items.length, 192, "final reading manifest count drift");
  if (currentManifest.items.length === 192) {
    assert.deepEqual(items, currentManifest.items, "published final reading manifest drift");
  }
  return { ...currentManifest, items };
}

function strictAudioCheck(candidate) {
  const stat = fs.lstatSync(candidate.absolutePath);
  assert.ok(!stat.isSymbolicLink() && stat.isFile(), `${candidate.id} audio must be a regular file`);
  validateWebmBuffer(fs.readFileSync(candidate.absolutePath));
}

function runCli() {
  const mode = process.argv[2];
  assert.ok(mode === "--check" || mode === "--write", "use --check or --write");
  const projectRoot = path.resolve(import.meta.dirname, "..");
  const contractPath = path.join(projectRoot, "课程/语法与基础句型/final-reading-additions.json");
  const manifestPath = path.join(projectRoot, "prototype/assets/audio/human/reading/manifest.json");
  const reviewContract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  const currentManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const nextManifest = buildFinalReadingManifest({ projectRoot, reviewContract, currentManifest, checkAudio: strictAudioCheck });
  if (mode === "--write") {
    const temporary = `${manifestPath}.final-reading.tmp`;
    assert.equal(fs.existsSync(temporary), false, "final reading manifest temporary file already exists");
    fs.writeFileSync(temporary, `${JSON.stringify(nextManifest, null, 2)}\n`, { flag: "wx" });
    fs.renameSync(temporary, manifestPath);
  }
  console.log(`final reading manifest ${mode === "--write" ? "written" : "validated"}: ${nextManifest.items.length}`);
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) runCli();
