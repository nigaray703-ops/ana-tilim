import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildRecordingCatalog } from "../tools/recording-studio/catalog.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const categories = ["alphabet", "combos", "vocab", "reading", "form-examples"];

function createManifestFixture({ category, mutate }) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-recording-catalog-"));
  const fixturePrototype = path.join(fixtureRoot, "prototype");
  const fixtureAudioRoot = path.join(fixtureRoot, "prototype/assets/audio/human");
  fs.mkdirSync(fixturePrototype);

  for (const file of ["uly-transliteration.js", "afanti-content.js", "course-data.js"]) {
    fs.symlinkSync(path.join(projectRoot, "prototype", file), path.join(fixturePrototype, file));
  }
  for (const directory of ["course-data", "i18n"]) {
    fs.symlinkSync(path.join(projectRoot, "prototype", directory), path.join(fixturePrototype, directory));
  }

  for (const currentCategory of categories) {
    const sourceManifest = path.join(projectRoot, "prototype/assets/audio/human", currentCategory, "manifest.json");
    const destinationDirectory = path.join(fixtureAudioRoot, currentCategory);
    const manifest = JSON.parse(fs.readFileSync(sourceManifest, "utf8"));
    if (currentCategory === category) mutate(manifest);
    fs.mkdirSync(destinationDirectory, { recursive: true });
    fs.writeFileSync(path.join(destinationDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  }

  return fixtureRoot;
}

test("builds the immutable source-bound 527-target catalog", () => {
  const catalog = buildRecordingCatalog({ projectRoot });

  assert.equal(catalog.schemaVersion, 1);
  assert.match(catalog.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(catalog.targets.length, 527);
  assert.deepEqual(
    Object.fromEntries(categories.map((category) => [category, catalog.targets.filter((item) => item.category === category).length])),
    { alphabet: 32, combos: 34, vocab: 203, reading: 164, "form-examples": 94 }
  );
  assert.equal(new Set(catalog.targets.map((item) => item.stableId)).size, 527);
  assert.ok(Object.isFrozen(catalog));
  assert.ok(Object.isFrozen(catalog.targets));

  for (const target of catalog.targets) {
    assert.match(target.stableId, /^(alphabet|combos|vocab|reading|form-examples):[a-z0-9-]+$/);
    assert.ok(target.value.trim());
    assert.ok(target.latin.trim());
    assert.ok(target.meaning.trim());
    assert.ok(target.english.trim());
    assert.match(target.recordingTextHash, /^[a-f0-9]{64}$/);
    assert.ok(Object.isFrozen(target));
    assert.ok(target.absoluteOutputPath.startsWith(path.join(projectRoot, "prototype/assets/audio/human") + path.sep));
  }

  assert.ok(catalog.targets.find((item) => item.stableId === "alphabet:aa"));
  assert.ok(catalog.targets.find((item) => item.stableId === "form-examples:form-example-1bieeo2"));
  assert.equal(catalog.targets.find((item) => item.stableId === "alphabet:aa").english, "Vowel");
  assert.equal(catalog.targets.find((item) => item.stableId === "vocab:korushkunche").english, "See you later; goodbye");
  assert.equal(catalog.targets.find((item) => item.stableId === "reading:grammar-copula-1").english, "This is a pen.");
  assert.equal(catalog.targets.find((item) => item.stableId === "alphabet:zhe").initialStatus, "needs-rerecord");
  assert.equal(catalog.targets.find((item) => item.stableId === "vocab:korushkunche").initialStatus, "needs-rerecord");
  assert.equal(catalog.targets.filter((item) => item.initialStatus === "needs-rerecord").length, 2);
  assert.equal(catalog.targets.filter((item) => item.initialStatus === "pending-review").length, 525);
});

test("fails closed when a manifest ID has no exact course-data join", () => {
  const fixtureRoot = createManifestFixture({
    category: "vocab",
    mutate(manifest) {
      manifest.items[0].id = "unknown-vocabulary";
    }
  });

  assert.throws(() => buildRecordingCatalog({ projectRoot: fixtureRoot }), /missing course-data join/);
});

test("binds a fixture manifest to the fixture course data rather than this checkout", () => {
  const fixtureRoot = createManifestFixture({ category: "vocab", mutate() {} });
  const fixtureCourseData = path.join(fixtureRoot, "prototype/course-data");
  fs.unlinkSync(fixtureCourseData);
  fs.mkdirSync(fixtureCourseData);
  for (const file of fs.readdirSync(path.join(projectRoot, "prototype/course-data"))) {
    const source = path.join(projectRoot, "prototype/course-data", file);
    const destination = path.join(fixtureCourseData, file);
    if (file === "vocab-data.js") fs.copyFileSync(source, destination);
    else fs.symlinkSync(source, destination);
  }
  const vocabDataPath = path.join(fixtureCourseData, "vocab-data.js");
  const vocabData = fs.readFileSync(vocabDataPath, "utf8").replace('"ياخشىمۇسىز"', '"夹具词汇"');
  assert.match(vocabData, /夹具词汇/);
  fs.writeFileSync(vocabDataPath, vocabData);

  assert.throws(() => buildRecordingCatalog({ projectRoot: fixtureRoot }), /value drift/);
});

test("fails closed when a manifest value drifts from its course-data source", () => {
  const fixtureRoot = createManifestFixture({
    category: "reading",
    mutate(manifest) {
      manifest.items[0].value = "漂移的录音文本";
    }
  });

  assert.throws(() => buildRecordingCatalog({ projectRoot: fixtureRoot }), /value drift/);
});

test("fails closed when a manifest latin value drifts from its course-data source", () => {
  const fixtureRoot = createManifestFixture({
    category: "combos",
    mutate(manifest) {
      manifest.items[0].latin = "drifted-latin";
    }
  });

  assert.throws(() => buildRecordingCatalog({ projectRoot: fixtureRoot }), /latin drift/);
});

test("fails closed when a form-example manifest latin value drifts", () => {
  const fixtureRoot = createManifestFixture({
    category: "form-examples",
    mutate(manifest) {
      manifest.items[0].latin = "drifted-latin";
    }
  });

  assert.throws(() => buildRecordingCatalog({ projectRoot: fixtureRoot }), /latin drift/);
});

test("fails closed when a manifest output path escapes the human-audio root", () => {
  const fixtureRoot = createManifestFixture({
    category: "alphabet",
    mutate(manifest) {
      manifest.items[0].outputPath = "./assets/audio/human/alphabet/../../outside.webm";
    }
  });

  assert.throws(() => buildRecordingCatalog({ projectRoot: fixtureRoot }), /output path escapes human-audio root/);
});

test("fails closed when a category manifest has duplicate stable IDs", () => {
  const fixtureRoot = createManifestFixture({
    category: "form-examples",
    mutate(manifest) {
      manifest.items.push({ ...manifest.items[0] });
    }
  });

  assert.throws(() => buildRecordingCatalog({ projectRoot: fixtureRoot }), /duplicate stable ID/);
});
