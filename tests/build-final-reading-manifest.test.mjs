import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const modulePath = path.join(projectRoot, "tools/build-final-reading-manifest.mjs");

assert.ok(fs.existsSync(modulePath), "final reading manifest builder should exist");

const { buildFinalReadingManifest } = await import(modulePath);
const reviewContract = JSON.parse(fs.readFileSync(path.join(projectRoot, "课程/语法与基础句型/final-reading-additions.json"), "utf8"));
const currentManifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "prototype/assets/audio/human/reading/manifest.json"), "utf8"));
const baselineManifest = { ...currentManifest, items: currentManifest.items.slice(0, 164) };
const checked = [];
const nextManifest = buildFinalReadingManifest({
  projectRoot,
  reviewContract,
  currentManifest: baselineManifest,
  checkAudio(candidate) {
    checked.push(candidate);
    assert.ok(fs.existsSync(candidate.absolutePath), `${candidate.id} audio should exist before manifest publication`);
  }
});

assert.equal(baselineManifest.items.length, 164, "the builder test should exercise the original 164-row baseline");
assert.equal(nextManifest.items.length, 192);
assert.deepEqual(nextManifest.items.slice(0, 164).map((item) => ({ ...item, order: 0 })), baselineManifest.items.map((item) => ({ ...item, order: 0 })));
assert.deepEqual(nextManifest.items.map((item) => item.order), Array.from({ length: 192 }, (_, index) => index + 1));
assert.equal(new Set(nextManifest.items.map((item) => item.id)).size, 192);

const additions = nextManifest.items.slice(164);
assert.deepEqual(additions.map((item) => item.id), reviewContract.units.flatMap((unit) => unit.groups.flatMap((group) => group.items.map((item) => item.id))));
assert.equal(additions.find((item) => item.id === "grammar-person-verbs-1").file, "human_reading_grammar_word_order_1.webm");
assert.equal(additions.find((item) => item.id === "sentence-self-introduction-4").file, "human_reading_grammar_copula_2.webm");
assert.equal(additions.find((item) => item.id === "grammar-person-verbs-2").file, "human_reading_grammar_person_verbs_2.webm");
assert.equal(checked.length, 28, "every new logical reading row must validate its exact audio file");

const missingAudioContract = structuredClone(reviewContract);
assert.throws(
  () => buildFinalReadingManifest({
    projectRoot,
    reviewContract: missingAudioContract,
    currentManifest: baselineManifest,
    checkAudio(candidate) {
      if (candidate.id === "grammar-person-verbs-2") throw new Error("missing approved audio");
    }
  }),
  /missing approved audio/
);

const publishedManifest = buildFinalReadingManifest({
  projectRoot,
  reviewContract,
  currentManifest,
  checkAudio(candidate) {
    assert.ok(fs.existsSync(candidate.absolutePath), `${candidate.id} published audio should remain available`);
  }
});
assert.deepEqual(publishedManifest, currentManifest, "the builder should validate the published 192-row manifest idempotently");

console.log("final reading manifest builder checks passed");
