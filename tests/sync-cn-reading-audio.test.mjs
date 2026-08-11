import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(projectRoot, "scripts/sync-cn-final-audio.mjs");
assert.ok(fs.existsSync(modulePath), "domestic final-audio sync module should exist");

const { FINAL_AUDIO_FILES, syncCnFinalAudio } = await import(modulePath);
assert.equal(FINAL_AUDIO_FILES.length, 29, "domestic release should copy 26 new reading files, one new vocabulary file, and two corrected recordings");
assert.equal(new Set(FINAL_AUDIO_FILES).size, 29, "domestic final-audio allowlist should be unique");

const cnSiteRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-cn-final-audio-"));
const unrelatedPath = path.join(cnSiteRoot, "assets/audio/human/vocab/domestic-only.webm");
fs.mkdirSync(path.dirname(unrelatedPath), { recursive: true });
fs.writeFileSync(unrelatedPath, "domestic-only audio fixture\n");

const first = syncCnFinalAudio({ projectRoot, cnSiteRoot });
assert.equal(first.copied.length, 31, "sync should copy 29 audio files and two release manifests");
for (const relativePath of first.copied) {
  assert.deepEqual(
    fs.readFileSync(path.join(cnSiteRoot, relativePath)),
    fs.readFileSync(path.join(projectRoot, "prototype", relativePath)),
    `${relativePath} should copy byte-for-byte to the domestic site`
  );
}
assert.equal(fs.readFileSync(unrelatedPath, "utf8"), "domestic-only audio fixture\n", "audio sync must not alter unrelated domestic files");

const beforeSecondSync = new Map(first.copied.map((relativePath) => [relativePath, fs.readFileSync(path.join(cnSiteRoot, relativePath))]));
const second = syncCnFinalAudio({ projectRoot, cnSiteRoot });
assert.deepEqual(second.copied, first.copied, "repeated domestic audio sync should use the same exact allowlist");
for (const [relativePath, bytes] of beforeSecondSync) {
  assert.deepEqual(fs.readFileSync(path.join(cnSiteRoot, relativePath)), bytes, `${relativePath} should remain byte-identical after repeated sync`);
}

console.log("domestic final audio sync checks passed");
