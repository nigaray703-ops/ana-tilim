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
      ANA_TILIM_COMBOS: {},
      ANA_TILIM_VOCAB: {},
      ANA_TILIM_PRACTICE: {},
      ANA_TILIM_READING: {
        readingUnits: [
          { id: "uyghur-proverbs", title: "维吾尔谚语" },
          { id: "famous-quotes", title: "名人名言" }
        ]
      }
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
  "course-data/combo-data.js",
  "course-data/vocab-data.js",
  "course-data/practice-data.js",
  "course-data/reading-data.js",
  "uyghur-keyboard.js",
  "sentence-morphemes.js",
  "sentence-glossary.js",
  "progress-transfer.js",
  "audio-controller.js"
];
const syncTargetPath = path.join(os.tmpdir(), "ana-tilim-cn-core-sync-test");
const excludedFiles = ["app-config.js", "index.html", "manifest.webmanifest", "assets/logo.png"];
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
const syncResult = spawnSync(process.execPath, [path.join(repoRoot, "scripts", "sync-cn-core.mjs")], {
  cwd: repoRoot,
  env: { ...process.env, ANA_TILIM_CN_SITE: syncTargetPath },
  encoding: "utf8"
});
assert.equal(syncResult.status, 0, syncResult.stderr || syncResult.stdout);
assert.equal(
  syncResult.stdout.trim().split("\n").filter(Boolean).length,
  expectedCoreFiles.length,
  "sync should copy only the explicit core allowlist"
);
for (const relativePath of expectedCoreFiles) {
  assert.ok(syncResult.stdout.includes(relativePath), `sync output should name ${relativePath}`);
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
