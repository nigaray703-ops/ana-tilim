import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildRecordingCatalog } from "../tools/recording-studio/catalog.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const categories = ["alphabet", "combos", "vocab", "reading", "form-examples"];

function createManifestFixture({ category, mutate, redirectedAudioRoot }) {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-recording-catalog-"));
  const fixturePrototype = path.join(fixtureRoot, "prototype");
  fs.mkdirSync(fixturePrototype);

  const fixtureAudioRoot = redirectedAudioRoot || path.join(fixturePrototype, "assets/audio/human");
  if (redirectedAudioRoot) {
    const fixtureAssetsRoot = path.join(fixturePrototype, "assets/audio");
    fs.mkdirSync(fixtureAssetsRoot, { recursive: true });
    fs.symlinkSync(redirectedAudioRoot, path.join(fixtureAssetsRoot, "human"));
  }

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

  const additionsDirectory = path.join(fixtureRoot, "课程/语法与基础句型");
  fs.mkdirSync(additionsDirectory, { recursive: true });
  fs.copyFileSync(
    path.join(projectRoot, "课程/语法与基础句型/final-reading-additions.json"),
    path.join(additionsDirectory, "final-reading-additions.json")
  );

  return fixtureRoot;
}

function mutateFinalAdditions(fixtureRoot, mutate) {
  const contractPath = path.join(fixtureRoot, "课程/语法与基础句型/final-reading-additions.json");
  const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
  mutate(contract);
  fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`);
}

function makeFixtureCourseDataMutable(fixtureRoot, mutationsByFile) {
  const fixtureCourseData = path.join(fixtureRoot, "prototype/course-data");
  fs.unlinkSync(fixtureCourseData);
  fs.mkdirSync(fixtureCourseData);

  for (const file of fs.readdirSync(path.join(projectRoot, "prototype/course-data"))) {
    const source = path.join(projectRoot, "prototype/course-data", file);
    const destination = path.join(fixtureCourseData, file);
    const mutation = mutationsByFile[file];
    if (!mutation) {
      fs.symlinkSync(source, destination);
      continue;
    }
    fs.writeFileSync(destination, `${fs.readFileSync(source, "utf8")}\n${mutation}\n`);
  }
}

test("builds the immutable source-bound 555-target catalog including 29 first-time recordings", () => {
  const catalog = buildRecordingCatalog({ projectRoot });

  assert.equal(catalog.schemaVersion, 1);
  assert.match(catalog.generatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(catalog.targets.length, 555);
  assert.deepEqual(
    Object.fromEntries(categories.map((category) => [category, catalog.targets.filter((item) => item.category === category).length])),
    { alphabet: 32, combos: 34, vocab: 203, reading: 192, "form-examples": 94 }
  );
  assert.equal(new Set(catalog.targets.map((item) => item.stableId)).size, 555);
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
  assert.equal(catalog.targets.filter((item) => item.initialStatus === "pending-review").length, 524);
  assert.equal(catalog.targets.filter((item) => item.initialStatus === "pending").length, 29);

  const firstTimeTargets = catalog.targets.filter((item) => item.initialStatus === "pending");
  assert.ok(firstTimeTargets.every((item) => item.playable === false));
  assert.ok(firstTimeTargets.every((item) => fs.existsSync(item.absoluteOutputPath) === false));
  assert.deepEqual(
    Object.fromEntries(categories.map((category) => [category, firstTimeTargets.filter((item) => item.category === category).length])),
    { alphabet: 0, combos: 0, vocab: 1, reading: 28, "form-examples": 0 }
  );
  assert.deepEqual(
    firstTimeTargets.map((item) => item.stableId),
    [
      "reading:grammar-person-verbs-1", "reading:grammar-person-verbs-2", "reading:grammar-person-verbs-3",
      "reading:grammar-possession-1", "reading:grammar-possession-2", "reading:grammar-possession-3",
      "reading:grammar-location-direction-1", "reading:grammar-location-direction-2", "reading:grammar-location-direction-3",
      "reading:grammar-basic-time-1", "reading:grammar-basic-time-2", "reading:grammar-basic-time-3",
      "reading:sentence-self-introduction-1", "reading:sentence-self-introduction-2", "reading:sentence-self-introduction-3", "reading:sentence-self-introduction-4",
      "reading:sentence-location-direction-1", "reading:sentence-location-direction-2", "reading:sentence-location-direction-3", "reading:sentence-location-direction-4",
      "reading:sentence-ability-preference-1", "reading:sentence-ability-preference-2", "reading:sentence-ability-preference-3", "reading:sentence-ability-preference-4",
      "reading:sentence-polite-reason-1", "reading:sentence-polite-reason-2", "reading:sentence-polite-reason-3", "reading:sentence-polite-reason-4",
      "vocab:erzimaydu"
    ]
  );
  assert.equal(catalog.targets.find((item) => item.stableId === "vocab:erzimaydu").value, "ئەرزىمەيدۇ");
  assert.equal(catalog.targets.some((item) => item.stableId === "vocab:hayr"), false);
});

test("rejects any drift in the independently approved first-time recording contract", () => {
  const fixtureRoot = createManifestFixture({ category: "alphabet", mutate() {} });
  mutateFinalAdditions(fixtureRoot, (contract) => {
    contract.units[0].groups[0].items[0].meaningZh = "未经批准的文本";
  });

  assert.throws(() => buildRecordingCatalog({ projectRoot: fixtureRoot }), /approved first-time recording contract drift/);
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
  makeFixtureCourseDataMutable(fixtureRoot, {
    "vocab-data.js": 'window.ANA_TILIM_VOCAB.vocabGroups[0].items[0].value = "夹具词汇";'
  });

  assert.throws(() => buildRecordingCatalog({ projectRoot: fixtureRoot }), /value drift/);
});

test("rejects a human-audio root symlink before building the catalog", () => {
  const redirectedAudioRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-recording-audio-root-"));
  const fixtureRoot = createManifestFixture({ category: "alphabet", mutate() {}, redirectedAudioRoot });

  assert.throws(() => buildRecordingCatalog({ projectRoot: fixtureRoot }), /human-audio root must not be a symbolic link/);
});

test("rejects duplicate source IDs in every category before joining manifests", () => {
  const duplicateCases = [
    {
      category: "alphabet",
      file: "alphabet-data.js",
      id: "be",
      mutation: 'window.ANA_TILIM_ALPHABET.alphabetAudioItems.push({ ...window.ANA_TILIM_ALPHABET.alphabetAudioItems[0] });'
    },
    {
      category: "combos",
      file: "combo-data.js",
      id: "ba",
      mutation: 'window.ANA_TILIM_COMBOS.comboGroups[0].items.push({ ...window.ANA_TILIM_COMBOS.comboGroups[0].items[0] });'
    },
    {
      category: "vocab",
      file: "vocab-data.js",
      id: "yaxshimusiz",
      mutation: 'window.ANA_TILIM_VOCAB.vocabGroups[0].items.push({ ...window.ANA_TILIM_VOCAB.vocabGroups[0].items[0] });'
    },
    {
      category: "reading",
      file: "reading-data.js",
      id: "grammar-word-order-1",
      mutation: 'window.ANA_TILIM_READING.readingUnits[0].groups[0].items.push({ ...window.ANA_TILIM_READING.readingUnits[0].groups[0].items[0] });'
    },
    {
      category: "form-examples",
      file: "alphabet-data.js",
      id: "form-example-bho5rp",
      mutation: 'window.ANA_TILIM_ALPHABET.letterDetails.be.formExamples.push({ id: "be:fixture-one", label: "独立式", form: "ب", word: "test-6i05l5", latin: "fixture-one", meaning: "fixture one" }, { id: "be:fixture-two", label: "后连式", form: "بـ", word: "test-s4gpql", latin: "fixture-two", meaning: "fixture two" });'
    }
  ];

  for (const { category, file, id, mutation } of duplicateCases) {
    const fixtureRoot = createManifestFixture({ category: "alphabet", mutate() {} });
    makeFixtureCourseDataMutable(fixtureRoot, { [file]: mutation });
    assert.throws(() => buildRecordingCatalog({ projectRoot: fixtureRoot }), new RegExp(`duplicate ${category} source ID: ${id}`));
  }
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
