import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const cnSitePath = process.env.ANA_TILIM_CN_SITE
  ? path.resolve(process.env.ANA_TILIM_CN_SITE)
  : path.resolve(repoRoot, "..", "Uyghur Tili", "site");

function readConfig(configPath) {
  assert.ok(fs.existsSync(configPath), `edition config should exist: ${configPath}`);

  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(configPath, "utf8"), context, { filename: configPath });
  return JSON.parse(JSON.stringify(context.window.ANA_TILIM_APP_CONFIG));
}

assert.deepEqual(readConfig(path.join(repoRoot, "prototype", "app-config.js")), {
  edition: "global",
  brandName: "Ana Tilim",
  brandNameUyghur: "ئانا تىلىم",
  logoPath: "./assets/logo.png",
  cloudEnabled: true,
  hiddenUnitIds: [],
  afantiLanguages: ["latin", "zh", "en"],
  progressStorageKey: "ana-tilim-progress",
  backupStorageKey: "ana-tilim-guest-progress-backup"
});

assert.deepEqual(readConfig(path.join(cnSitePath, "app-config.js")), {
  edition: "cn",
  brandName: "Uyghur Tili",
  brandNameUyghur: "ئۇيغۇر تىلى",
  logoPath: "./assets/logo.png",
  cloudEnabled: false,
  hiddenUnitIds: ["famous-quotes"],
  afantiLanguages: ["latin", "zh"],
  progressStorageKey: "uyghur-tili-cn-progress",
  backupStorageKey: "uyghur-tili-cn-progress-backup"
});

function aggregateReadingUnits(appConfig) {
  const context = {
    window: {
      ANA_TILIM_APP_CONFIG: appConfig,
      ANA_TILIM_ULY: { normalizeCourseTransliterations: (course) => course },
      ANA_TILIM_ALPHABET: {},
      ANA_TILIM_LATIN_WRITING: {},
      ANA_TILIM_COMBOS: {},
      ANA_TILIM_SYLLABLE: {},
      ANA_TILIM_VOCAB: {},
      ANA_TILIM_PRACTICE: {},
      ANA_TILIM_READING: {
        readingUnits: [
          { id: "uyghur-proverbs", title: "维吾尔谚语" },
          { id: "famous-quotes", title: "名人名言" }
        ]
      },
      ANA_TILIM_AFANTI_DATA: { stories: [], unit: { id: "afanti-stories" } },
      ANA_TILIM_AFANTI_ENGLISH: { byStoryId: {} },
      ANA_TILIM_AFANTI_CONTENT: { publishableStories: () => [] }
    }
  };
  vm.createContext(context);
  const courseDataPath = path.join(repoRoot, "prototype", "course-data.js");
  vm.runInContext(fs.readFileSync(courseDataPath, "utf8"), context, { filename: courseDataPath });
  return JSON.parse(JSON.stringify(context.window.ANA_TILIM_COURSE.readingUnits));
}

assert.deepEqual(aggregateReadingUnits({ hiddenUnitIds: ["famous-quotes"] }), [
  { id: "uyghur-proverbs", title: "维吾尔谚语" }
]);
assert.deepEqual(aggregateReadingUnits({
  readingUnitTitleOverrides: { "uyghur-proverbs": "第八单元：维吾尔谚语" }
}), [
  { id: "uyghur-proverbs", title: "维吾尔谚语" },
  { id: "famous-quotes", title: "名人名言" }
]);
assert.deepEqual(aggregateReadingUnits({ hiddenReadingUnitIds: ["famous-quotes"] }), [
  { id: "uyghur-proverbs", title: "维吾尔谚语" }
]);

const expectedCoreFiles = [
  "app.js",
  "styles.css",
  "uly-transliteration.js",
  "unit-order.js",
  "course-data.js",
  "course-data/alphabet-data.js",
  "course-data/latin-writing-data.js",
  "course-data/combo-data.js",
  "course-data/syllable-data.js",
  "course-data/vocab-data.js",
  "course-data/practice-data.js",
  "course-data/reading-data.js",
  "course-data/afanti-data.js",
  "afanti-content.js",
  "uyghur-keyboard.js",
  "latin-keyboard.js",
  "sentence-morphemes.js",
  "sentence-glossary.js",
  "progress-transfer.js",
  "audio-controller.js",
  "assets/portraits/mahmud-kashgari-wax.jpg"
];
const syncTargetPath = path.join(os.tmpdir(), "ana-tilim-cn-core-sync-test");
const excludedFiles = ["app-config.js", "manifest.webmanifest", "assets/logo.png"];
fs.mkdirSync(path.join(syncTargetPath, "assets"), { recursive: true });
for (const relativePath of excludedFiles) {
  const fixturePath = path.join(syncTargetPath, relativePath);
  fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
  fs.writeFileSync(fixturePath, `edition-specific fixture: ${relativePath}\n`);
}
const excludedBeforeSync = new Map(excludedFiles.map((relativePath) => [
  relativePath,
  fs.readFileSync(path.join(syncTargetPath, relativePath))
]));
const domesticIndexFixture = `<!doctype html>
<html>
  <head><link rel="stylesheet" href="./styles.css?v=old-syllable"></head>
  <body>
    <main data-domestic-marker="keep"></main>
    <script src="./course-data/alphabet-data.js?v=cn-alphabet"></script>
    <script src="./course-data/combo-data.js?v=cn-combo"></script>
    <script src="./course-data.js?v=cn-course"></script>
    <script src="./domestic-only.js?v=1"></script>
    <script src="./app.js?v=cn-app"></script>
  </body>
</html>
`;
fs.writeFileSync(path.join(syncTargetPath, "index.html"), domesticIndexFixture);

function runSync(targetPath) {
  return spawnSync(process.execPath, [path.join(repoRoot, "scripts", "sync-cn-core.mjs")], {
    cwd: repoRoot,
    env: { ...process.env, ANA_TILIM_CN_SITE: targetPath },
    encoding: "utf8"
  });
}

function assertCoreSyncPassed(syncResult) {
  assert.equal(syncResult.status, 0, syncResult.stderr || syncResult.stdout);
  assert.equal(
    syncResult.stdout.trim().split("\n").filter((line) => line.startsWith("Copied ")).length,
    expectedCoreFiles.length,
    "sync should copy only the explicit core allowlist"
  );
}

const firstSyncResult = runSync(syncTargetPath);
assertCoreSyncPassed(firstSyncResult);
for (const relativePath of expectedCoreFiles) {
  assert.ok(firstSyncResult.stdout.includes(relativePath), `sync output should name ${relativePath}`);
  assert.deepEqual(
    fs.readFileSync(path.join(syncTargetPath, relativePath)),
    fs.readFileSync(path.join(repoRoot, "prototype", relativePath)),
    `sync should copy ${relativePath} byte-for-byte`
  );
}
for (const [relativePath, before] of excludedBeforeSync) {
  assert.deepEqual(
    fs.readFileSync(path.join(syncTargetPath, relativePath)),
    before,
    `sync should leave edition-specific ${relativePath} unchanged`
  );
}

const domesticIndexAfterFirstSync = fs.readFileSync(path.join(syncTargetPath, "index.html"), "utf8");
const secondSyncResult = runSync(syncTargetPath);
assertCoreSyncPassed(secondSyncResult);
const syncedDomesticIndex = fs.readFileSync(path.join(syncTargetPath, "index.html"), "utf8");
assert.equal(
  syncedDomesticIndex,
  domesticIndexAfterFirstSync,
  "a repeated sync should leave the normalized domestic index byte-identical"
);
const alphabetDataScriptIndex = syncedDomesticIndex.indexOf("./course-data/alphabet-data.js");
const latinWritingDataScriptIndex = syncedDomesticIndex.indexOf("./course-data/latin-writing-data.js");
const comboDataScriptIndex = syncedDomesticIndex.indexOf("./course-data/combo-data.js");
const syllableDataScriptIndex = syncedDomesticIndex.indexOf("./course-data/syllable-data.js");
const afantiDataScriptIndex = syncedDomesticIndex.indexOf("./course-data/afanti-data.js");
const afantiContentScriptIndex = syncedDomesticIndex.indexOf("./afanti-content.js");
const courseDataScriptIndex = syncedDomesticIndex.indexOf("./course-data.js");
const unitOrderScriptIndex = syncedDomesticIndex.indexOf("./unit-order.js");
const latinKeyboardScriptIndex = syncedDomesticIndex.indexOf("./latin-keyboard.js");
const appScriptIndex = syncedDomesticIndex.indexOf("./app.js");
assert.ok(
  alphabetDataScriptIndex >= 0
    && alphabetDataScriptIndex < latinWritingDataScriptIndex
    && latinWritingDataScriptIndex < comboDataScriptIndex
    && comboDataScriptIndex < syllableDataScriptIndex
    && syllableDataScriptIndex < afantiDataScriptIndex
    && afantiDataScriptIndex < afantiContentScriptIndex
    && afantiContentScriptIndex < courseDataScriptIndex
    && courseDataScriptIndex >= 0
    && courseDataScriptIndex < unitOrderScriptIndex
    && unitOrderScriptIndex < appScriptIndex
    && latinKeyboardScriptIndex >= 0
    && latinKeyboardScriptIndex < appScriptIndex,
  "domestic scripts should load course data, unit order, and the Latin keyboard before app"
);
assert.equal(
  [...syncedDomesticIndex.matchAll(/<script\s+[^>]*src=["']\.\/course-data\/latin-writing-data\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)].length,
  1,
  "repeated sync should leave exactly one domestic latin-writing-data script"
);
assert.equal(
  [...syncedDomesticIndex.matchAll(/<script\s+[^>]*src=["']\.\/course-data\/syllable-data\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)].length,
  1,
  "repeated sync should leave exactly one domestic syllable-data script"
);
assert.equal(
  [...syncedDomesticIndex.matchAll(/<script\s+[^>]*src=["']\.\/course-data\/afanti-data\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)].length,
  1,
  "repeated sync should leave exactly one domestic shared Afanti data script"
);
assert.equal(
  [...syncedDomesticIndex.matchAll(/<script\s+[^>]*src=["']\.\/afanti-content\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)].length,
  1,
  "repeated sync should leave exactly one domestic Afanti validator script"
);
assert.equal(syncedDomesticIndex.includes("afanti-english-data.js"), false, "domestic index must not load global-only Afanti English");
assert.equal(
  [...syncedDomesticIndex.matchAll(/<script\s+[^>]*src=["']\.\/latin-keyboard\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)].length,
  1,
  "repeated sync should leave exactly one domestic latin-keyboard script"
);
assert.equal(
  [...syncedDomesticIndex.matchAll(/<script\s+[^>]*src=["']\.\/unit-order\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)].length,
  1,
  "repeated sync should leave exactly one domestic unit-order script"
);
assert.ok(syncedDomesticIndex.includes('data-domestic-marker="keep"'), "sync should preserve domestic markup");
assert.ok(syncedDomesticIndex.includes("./domestic-only.js?v=1"), "sync should preserve domestic-only scripts");
const domesticScriptSources = [...syncedDomesticIndex.matchAll(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>/g)]
  .map((match) => match[1]);
assert.equal(
  domesticScriptSources.some((source) => /supabase|cloud|auth/i.test(source)),
  false,
  "sync should not introduce Supabase, cloud, or auth scripts"
);

const misplacedUnitOrderTargetPath = path.join(os.tmpdir(), "ana-tilim-cn-core-sync-misplaced-unit-order-test");
fs.mkdirSync(misplacedUnitOrderTargetPath, { recursive: true });
fs.writeFileSync(path.join(misplacedUnitOrderTargetPath, "index.html"), `<!doctype html>
<html>
  <body>
    <main data-misplaced-domestic-marker="keep"></main>
    <script src="./course-data/alphabet-data.js?v=cn-alphabet"></script>
    <script src="./course-data/combo-data.js?v=cn-combo"></script>
    <script src="./course-data.js?v=cn-course"></script>
    <script src="./app.js?v=cn-app"></script>
    <script src="./domestic-after-app.js?v=1"></script>
    <script src="./course-data/latin-writing-data.js?v=misplaced"></script>
    <script src="./course-data/syllable-data.js?v=misplaced"></script>
    <script src="./course-data/afanti-data.js?v=misplaced"></script>
    <script src="./course-data/afanti-english-data.js?v=misplaced"></script>
    <script src="./afanti-content.js?v=misplaced"></script>
    <script src="./unit-order.js?v=misplaced"></script>
    <script src="./latin-keyboard.js?v=misplaced"></script>
  </body>
</html>
`);
const misplacedUnitOrderSyncResult = runSync(misplacedUnitOrderTargetPath);
assertCoreSyncPassed(misplacedUnitOrderSyncResult);
const normalizedMisplacedIndex = fs.readFileSync(
  path.join(misplacedUnitOrderTargetPath, "index.html"),
  "utf8"
);
const normalizedMisplacedLatinWritingTags = [
  ...normalizedMisplacedIndex.matchAll(/<script\s+[^>]*src=["']\.\/course-data\/latin-writing-data\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)
];
const normalizedMisplacedUnitOrderTags = [
  ...normalizedMisplacedIndex.matchAll(/<script\s+[^>]*src=["']\.\/unit-order\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)
];
const normalizedMisplacedSyllableTags = [
  ...normalizedMisplacedIndex.matchAll(/<script\s+[^>]*src=["']\.\/course-data\/syllable-data\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)
];
const normalizedMisplacedLatinKeyboardTags = [
  ...normalizedMisplacedIndex.matchAll(/<script\s+[^>]*src=["']\.\/latin-keyboard\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)
];
const normalizedMisplacedAfantiDataTags = [
  ...normalizedMisplacedIndex.matchAll(/<script\s+[^>]*src=["']\.\/course-data\/afanti-data\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)
];
const normalizedMisplacedAfantiContentTags = [
  ...normalizedMisplacedIndex.matchAll(/<script\s+[^>]*src=["']\.\/afanti-content\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)
];
assert.equal(normalizedMisplacedLatinWritingTags.length, 1, "sync should keep one normalized latin-writing-data tag");
assert.equal(normalizedMisplacedSyllableTags.length, 1, "sync should keep one normalized syllable-data tag");
assert.equal(normalizedMisplacedUnitOrderTags.length, 1, "sync should keep one normalized unit-order tag");
assert.equal(normalizedMisplacedLatinKeyboardTags.length, 1, "sync should keep one normalized latin-keyboard tag");
assert.equal(normalizedMisplacedAfantiDataTags.length, 1, "sync should keep one normalized shared Afanti data tag");
assert.equal(normalizedMisplacedAfantiContentTags.length, 1, "sync should keep one normalized Afanti validator tag");
assert.equal(normalizedMisplacedIndex.includes("afanti-english-data.js"), false, "sync should remove a misplaced global-only English tag from domestic index");
assert.ok(
  normalizedMisplacedIndex.indexOf("./course-data/alphabet-data.js") < normalizedMisplacedIndex.indexOf("./course-data/latin-writing-data.js")
    && normalizedMisplacedIndex.indexOf("./course-data/latin-writing-data.js") < normalizedMisplacedIndex.indexOf("./course-data/combo-data.js")
    && normalizedMisplacedIndex.indexOf("./course-data/combo-data.js") < normalizedMisplacedIndex.indexOf("./course-data/syllable-data.js")
    && normalizedMisplacedIndex.indexOf("./course-data/syllable-data.js") < normalizedMisplacedIndex.indexOf("./course-data/afanti-data.js")
    && normalizedMisplacedIndex.indexOf("./course-data/afanti-data.js") < normalizedMisplacedIndex.indexOf("./afanti-content.js")
    && normalizedMisplacedIndex.indexOf("./afanti-content.js") < normalizedMisplacedIndex.indexOf("./course-data.js")
    && normalizedMisplacedIndex.indexOf("./course-data.js") < normalizedMisplacedIndex.indexOf("./unit-order.js")
    && normalizedMisplacedIndex.indexOf("./unit-order.js") < normalizedMisplacedIndex.indexOf("./app.js")
    && normalizedMisplacedIndex.indexOf("./latin-keyboard.js") < normalizedMisplacedIndex.indexOf("./app.js"),
  "sync should move misplaced strict dependencies before app.js"
);
assert.ok(
  normalizedMisplacedIndex.includes('data-misplaced-domestic-marker="keep"'),
  "sync should preserve misplaced-fixture domestic markup"
);
assert.ok(
  normalizedMisplacedIndex.includes("./domestic-after-app.js?v=1"),
  "sync should preserve misplaced-fixture domestic scripts"
);
const normalizedMisplacedScriptSources = [
  ...normalizedMisplacedIndex.matchAll(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>/g)
].map((match) => match[1]);
assert.equal(
  normalizedMisplacedScriptSources.some((source) => /supabase|cloud|auth/i.test(source)),
  false,
  "misplaced-tag normalization should not introduce Supabase, cloud, or auth scripts"
);

const duplicateUnitOrderTargetPath = path.join(os.tmpdir(), "ana-tilim-cn-core-sync-duplicate-unit-order-test");
fs.mkdirSync(duplicateUnitOrderTargetPath, { recursive: true });
fs.writeFileSync(path.join(duplicateUnitOrderTargetPath, "index.html"), `<!doctype html>
<html>
  <head><link rel="stylesheet" href="./styles.css?v=old-syllable"></head>
  <body>
    <main data-duplicate-domestic-marker="keep"></main>
    <script src="./course-data/alphabet-data.js?v=cn-alphabet"></script>
    <script src="./course-data/latin-writing-data.js?v=old-before"></script>
    <script src="./course-data/combo-data.js?v=cn-combo"></script>
    <script src="./course-data/syllable-data.js?v=old-before"></script>
    <script src="./course-data/afanti-data.js?v=old-before"></script>
    <script src="./afanti-content.js?v=old-before"></script>
    <script src="./course-data/reading-data.js?v=old-before"></script>
    <script src="./course-data.js?v=cn-course"></script>
    <script src="./unit-order.js?v=old-before"></script>
    <script src="./latin-keyboard.js?v=old-before"></script>
    <script src="./domestic-duplicate-fixture.js?v=1"></script>
    <script src="./progress-transfer.js?v=old-syllable"></script>
    <script src="./app.js?v=cn-app"></script>
    <script src="./course-data/latin-writing-data.js?v=old-after"></script>
    <script src="./course-data/syllable-data.js?v=old-after"></script>
    <script src="./course-data/afanti-data.js?v=old-after"></script>
    <script src="./course-data/afanti-english-data.js?v=old-after"></script>
    <script src="./afanti-content.js?v=old-after"></script>
    <script src="./unit-order.js?v=old-after"></script>
    <script src="./latin-keyboard.js?v=old-after"></script>
  </body>
</html>
`);
const duplicateUnitOrderSyncResult = runSync(duplicateUnitOrderTargetPath);
assertCoreSyncPassed(duplicateUnitOrderSyncResult);
const normalizedDuplicateIndex = fs.readFileSync(
  path.join(duplicateUnitOrderTargetPath, "index.html"),
  "utf8"
);
const normalizedDuplicateLatinWritingTags = [
  ...normalizedDuplicateIndex.matchAll(/<script\s+[^>]*src=["']\.\/course-data\/latin-writing-data\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)
];
const normalizedDuplicateUnitOrderTags = [
  ...normalizedDuplicateIndex.matchAll(/<script\s+[^>]*src=["']\.\/unit-order\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)
];
const normalizedDuplicateSyllableTags = [
  ...normalizedDuplicateIndex.matchAll(/<script\s+[^>]*src=["']\.\/course-data\/syllable-data\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)
];
const normalizedDuplicateLatinKeyboardTags = [
  ...normalizedDuplicateIndex.matchAll(/<script\s+[^>]*src=["']\.\/latin-keyboard\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)
];
const normalizedDuplicateAfantiDataTags = [
  ...normalizedDuplicateIndex.matchAll(/<script\s+[^>]*src=["']\.\/course-data\/afanti-data\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)
];
const normalizedDuplicateAfantiContentTags = [
  ...normalizedDuplicateIndex.matchAll(/<script\s+[^>]*src=["']\.\/afanti-content\.js(?:\?[^"']*)?["'][^>]*><\/script>/g)
];
assert.equal(normalizedDuplicateLatinWritingTags.length, 1, "sync should collapse duplicate latin-writing-data tags");
assert.equal(normalizedDuplicateSyllableTags.length, 1, "sync should collapse duplicate syllable-data tags");
assert.equal(normalizedDuplicateUnitOrderTags.length, 1, "sync should collapse duplicate unit-order tags");
assert.equal(normalizedDuplicateLatinKeyboardTags.length, 1, "sync should collapse duplicate latin-keyboard tags");
assert.equal(normalizedDuplicateAfantiDataTags.length, 1, "sync should collapse duplicate shared Afanti data tags");
assert.equal(normalizedDuplicateAfantiContentTags.length, 1, "sync should collapse duplicate Afanti validator tags");
assert.equal(
  normalizedDuplicateAfantiDataTags[0][0],
  '<script src="./course-data/afanti-data.js?v=20260810-afanti-layout"></script>',
  "duplicate normalization should use the approved Afanti chooser-title cache tag"
);
assert.equal(normalizedDuplicateIndex.includes("afanti-english-data.js"), false, "duplicate normalization should remove global-only English from domestic index");
assert.equal(
  normalizedDuplicateLatinWritingTags[0][0].trim(),
  '<script src="./course-data/latin-writing-data.js?v=20260810-qwerty-words"></script>',
  "duplicate normalization should use the standard latin-writing-data tag"
);
assert.equal(
  normalizedDuplicateSyllableTags[0][0].trim(),
  '<script src="./course-data/syllable-data.js?v=20260809-plan3-final-content"></script>',
  "duplicate normalization should use the standard syllable-data tag"
);
assert.equal(
  normalizedDuplicateLatinKeyboardTags[0][0],
  '<script src="./latin-keyboard.js?v=20260809-latin-qwerty"></script>',
  "duplicate normalization should use the standard latin-keyboard tag"
);
assert.equal(
  normalizedDuplicateUnitOrderTags[0][0],
  '<script src="./unit-order.js?v=20260809-edition-unit-order"></script>',
  "duplicate normalization should use the standard unit-order tag"
);
assert.ok(
  normalizedDuplicateIndex.includes('href="./styles.css?v=20260810-quote-profiles"'),
  "sync should cache-bust the copied quote-name UI styles"
);
assert.ok(
  normalizedDuplicateIndex.includes('src="./course-data/reading-data.js?v=20260810-quote-profiles"'),
  "sync should cache-bust the copied bilingual quote-name data"
);
assert.ok(
  normalizedDuplicateIndex.includes('src="./progress-transfer.js?v=20260809-syllable-review"'),
  "sync should cache-bust the copied split syllable mistake validator"
);
assert.ok(
  normalizedDuplicateIndex.includes('src="./app.js?v=20260810-quote-profiles"'),
  "sync should cache-bust the copied bilingual quote-name app"
);
assert.ok(
  normalizedDuplicateIndex.indexOf("./course-data/alphabet-data.js") < normalizedDuplicateIndex.indexOf("./course-data/latin-writing-data.js")
    && normalizedDuplicateIndex.indexOf("./course-data/latin-writing-data.js") < normalizedDuplicateIndex.indexOf("./course-data/combo-data.js")
    && normalizedDuplicateIndex.indexOf("./course-data/combo-data.js") < normalizedDuplicateIndex.indexOf("./course-data/syllable-data.js")
    && normalizedDuplicateIndex.indexOf("./course-data/syllable-data.js") < normalizedDuplicateIndex.indexOf("./course-data/afanti-data.js")
    && normalizedDuplicateIndex.indexOf("./course-data/afanti-data.js") < normalizedDuplicateIndex.indexOf("./afanti-content.js")
    && normalizedDuplicateIndex.indexOf("./afanti-content.js") < normalizedDuplicateIndex.indexOf("./course-data.js")
    && normalizedDuplicateIndex.indexOf("./course-data.js") < normalizedDuplicateIndex.indexOf("./unit-order.js")
    && normalizedDuplicateIndex.indexOf("./unit-order.js") < normalizedDuplicateIndex.indexOf("./app.js")
    && normalizedDuplicateIndex.indexOf("./latin-keyboard.js") < normalizedDuplicateIndex.indexOf("./app.js"),
  "duplicate normalization should place strict dependencies before app.js"
);
assert.ok(
  normalizedDuplicateIndex.includes('data-duplicate-domestic-marker="keep"')
    && normalizedDuplicateIndex.includes("./domestic-duplicate-fixture.js?v=1"),
  "duplicate normalization should preserve domestic content"
);

const missingAppTargetPath = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-cn-core-sync-missing-app-test-"));
const missingAppIndex = `<!doctype html>
<html>
  <body>
    <script src="./course-data.js?v=cn-course"></script>
  </body>
</html>
`;
const missingAppIndexPath = path.join(missingAppTargetPath, "index.html");
fs.writeFileSync(missingAppIndexPath, missingAppIndex);
const preseededMissingAppTargets = new Map([
  ["app.js", Buffer.from("domestic app bytes must survive failed preflight\n")],
  ["course-data/alphabet-data.js", Buffer.from("domestic alphabet bytes must survive failed preflight\n")]
]);
for (const [relativePath, bytes] of preseededMissingAppTargets) {
  const fixturePath = path.join(missingAppTargetPath, relativePath);
  fs.mkdirSync(path.dirname(fixturePath), { recursive: true });
  fs.writeFileSync(fixturePath, bytes);
}
const absentMissingAppTarget = path.join(missingAppTargetPath, "styles.css");
assert.equal(fs.existsSync(absentMissingAppTarget), false, "missing-app fixture should begin without styles.css");
const missingAppSyncResult = runSync(missingAppTargetPath);
assert.notEqual(missingAppSyncResult.status, 0, "sync should fail when the domestic app.js tag is missing");
assert.ok(
  `${missingAppSyncResult.stdout}${missingAppSyncResult.stderr}`.includes("app.js script tag"),
  "sync failure should clearly identify the missing app.js script tag"
);
assert.equal(
  fs.readFileSync(missingAppIndexPath, "utf8"),
  missingAppIndex,
  "failed sync should not guess or rewrite the domestic index"
);
for (const [relativePath, before] of preseededMissingAppTargets) {
  assert.equal(
    fs.readFileSync(path.join(missingAppTargetPath, relativePath)).equals(before),
    true,
    `failed sync preflight should preserve existing ${relativePath} bytes`
  );
}
assert.equal(
  fs.existsSync(absentMissingAppTarget),
  false,
  "failed sync preflight must not create a previously missing core target"
);

const blockedTargetPath = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-cn-core-sync-blocked-target-test-"));
fs.writeFileSync(path.join(blockedTargetPath, "index.html"), domesticIndexFixture);
const blockedTargetAppBytes = Buffer.from("domestic app survives a pre-detectable target conflict\n");
fs.writeFileSync(path.join(blockedTargetPath, "app.js"), blockedTargetAppBytes);
fs.writeFileSync(path.join(blockedTargetPath, "course-data"), "not a directory\n");
const blockedTargetSyncResult = runSync(blockedTargetPath);
assert.notEqual(blockedTargetSyncResult.status, 0, "sync should fail when a core target parent is not a directory");
assert.equal(
  fs.readFileSync(path.join(blockedTargetPath, "app.js")).equals(blockedTargetAppBytes),
  true,
  "target preflight failure should occur before overwriting an earlier core target"
);
assert.equal(
  fs.existsSync(path.join(blockedTargetPath, "styles.css")),
  false,
  "target preflight failure should occur before creating an earlier missing core target"
);

const parityScriptPath = path.join(repoRoot, "scripts", "check-edition-parity.mjs");
const mismatchRelativePath = "unit-order.js";
const mismatchTargetPath = path.join(syncTargetPath, mismatchRelativePath);
let mismatchResult;
try {
  fs.appendFileSync(mismatchTargetPath, "\n// parity test mismatch\n");
  mismatchResult = spawnSync(process.execPath, [parityScriptPath], {
    cwd: repoRoot,
    env: { ...process.env, ANA_TILIM_CN_SITE: syncTargetPath },
    encoding: "utf8"
  });
} finally {
  fs.copyFileSync(path.join(repoRoot, "prototype", mismatchRelativePath), mismatchTargetPath);
}
assert.notEqual(mismatchResult.status, 0, "parity should reject a changed core file");
assert.ok(
  `${mismatchResult.stdout}${mismatchResult.stderr}`.includes(mismatchRelativePath),
  "parity failure should name the changed core file"
);

const parityResult = spawnSync(process.execPath, [parityScriptPath], {
  cwd: repoRoot,
  env: { ...process.env, ANA_TILIM_CN_SITE: syncTargetPath },
  encoding: "utf8"
});
assert.equal(parityResult.status, 0, parityResult.stderr || parityResult.stdout);

const appSource = fs.readFileSync(path.join(repoRoot, "prototype", "app.js"), "utf8");
assert.ok(appSource.includes("window.ANA_TILIM_APP_CONFIG"), "app should read edition config");
assert.ok(appSource.includes("appConfig.cloudEnabled"), "cloud startup and auth UI should obey edition config");
assert.ok(appSource.includes("appConfig.brandName"), "visible brand should obey edition config");
assert.ok(appSource.includes("appConfig.progressStorageKey"), "local progress should use an edition-specific storage key");

console.log("app edition config checks passed");
