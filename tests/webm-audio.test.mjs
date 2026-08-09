import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { readWebmDurationMilliseconds, validateWebmBuffer } from "../tools/lib/webm-audio.mjs";

const projectRoot = process.cwd();
const valid = fs.readFileSync("prototype/assets/audio/human/alphabet/human_letter_01_b.webm");

function runNode(args, cwd = projectRoot) {
  return spawnSync(process.execPath, args, { cwd, encoding: "utf8" });
}

test("reports audio metadata for a valid WebM buffer", () => {
  const result = validateWebmBuffer(valid);
  assert.equal(result.mimeType, "audio/webm");
  assert.equal(result.size, valid.length);
  assert.ok(result.durationMs > 0);
  assert.equal(readWebmDurationMilliseconds(valid), result.durationMs);
});

test("rejects undersized buffers before checking their WebM header", () => {
  for (const buffer of [Buffer.alloc(0), Buffer.from("not-webm"), valid.subarray(0, 100)]) {
    assert.throws(() => validateWebmBuffer(buffer), /4096 bytes/);
  }
});

test("rejects oversized buffers with an invalid WebM header", () => {
  assert.throws(() => validateWebmBuffer(Buffer.alloc(5000)), /WebM header/);
});

test("rejects a WebM header without a duration", () => {
  assert.throws(() => validateWebmBuffer(Buffer.concat([valid.subarray(0, 4), Buffer.alloc(5000)])), /duration/);
});

test("form-example import check names the invalid source file", () => {
  const fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-webm-import-invalid-"));
  const sourceDirectory = path.join(projectRoot, "prototype/assets/audio/human/form-examples");

  for (const sourceFile of fs.readdirSync(sourceDirectory).filter((file) => file.endsWith(".webm"))) {
    const targetFile = sourceFile.replace("human_form_example_", "voice_form_example_");
    fs.copyFileSync(path.join(sourceDirectory, sourceFile), path.join(fixtureDirectory, targetFile));
  }
  fs.writeFileSync(path.join(fixtureDirectory, "voice_form_example_1bx69wn.webm"), Buffer.alloc(5000));

  const result = runNode([path.join(projectRoot, "tools/import-form-example-audio.mjs"), "--check", fixtureDirectory]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /voice_form_example_1bx69wn\.webm: WebM header/);
});

test("human-audio check names the invalid manifest file", () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-human-audio-invalid-"));
  const sourcePrototype = path.join(projectRoot, "prototype");
  const fixturePrototype = path.join(fixtureRoot, "prototype");
  fs.mkdirSync(fixturePrototype);

  for (const file of fs.readdirSync(sourcePrototype).filter((file) => file.endsWith(".js"))) {
    fs.symlinkSync(path.join(sourcePrototype, file), path.join(fixturePrototype, file));
  }
  for (const directory of ["course-data", "i18n"]) {
    fs.symlinkSync(path.join(sourcePrototype, directory), path.join(fixturePrototype, directory));
  }

  const sourceHumanAudio = path.join(sourcePrototype, "assets/audio/human");
  const fixtureHumanAudio = path.join(fixturePrototype, "assets/audio/human");
  fs.mkdirSync(fixtureHumanAudio, { recursive: true });
  for (const category of fs.readdirSync(sourceHumanAudio)) {
    const sourceCategory = path.join(sourceHumanAudio, category);
    const fixtureCategory = path.join(fixtureHumanAudio, category);
    if (category !== "alphabet") {
      fs.symlinkSync(sourceCategory, fixtureCategory);
      continue;
    }

    fs.mkdirSync(fixtureCategory);
    for (const file of fs.readdirSync(sourceCategory)) {
      const sourceFile = path.join(sourceCategory, file);
      const fixtureFile = path.join(fixtureCategory, file);
      if (file === "human_letter_01_b.webm") {
        fs.writeFileSync(fixtureFile, Buffer.alloc(5000));
      } else if (file.endsWith(".webm")) {
        fs.symlinkSync(sourceFile, fixtureFile);
      } else {
        fs.copyFileSync(sourceFile, fixtureFile);
      }
    }
  }

  const result = runNode([path.join(projectRoot, "tests/human-audio.test.mjs")], fixtureRoot);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /human_letter_01_b\.webm: WebM header/);
});
