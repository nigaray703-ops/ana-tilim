import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const indexHtml = fs.readFileSync("prototype/index.html", "utf8");
const courseDataGuidePath = "课程/00-课程数据编辑与审校说明.md";
const courseDataIntegrityTestPath = "tests/course-data-integrity.test.mjs";
const projectCheckScriptPath = "scripts/check-project.mjs";
const courseDataAggregatorPath = "prototype/course-data.js";
const i18nScriptPaths = [
  "prototype/i18n/ui-messages.js",
  "prototype/i18n/alphabet-en.js",
  "prototype/i18n/course-en.js",
  "prototype/i18n/runtime.js"
];
const courseDataScriptPaths = [
  "prototype/uly-transliteration.js",
  "prototype/course-data/alphabet-data.js",
  "prototype/course-data/combo-data.js",
  "prototype/course-data/vocab-data.js",
  "prototype/course-data/practice-data.js",
  "prototype/course-data/reading-data.js"
];
assert.ok(fs.existsSync(courseDataAggregatorPath), "course data aggregator should exist");
for (const scriptPath of courseDataScriptPaths) {
  assert.ok(fs.existsSync(scriptPath), `${scriptPath} should exist as a focused course data file`);
}
assert.ok(fs.existsSync(courseDataGuidePath), "course data editing guide should exist for non-technical review");
assert.ok(fs.existsSync(courseDataIntegrityTestPath), "course data integrity checker should exist");
assert.ok(fs.existsSync(projectCheckScriptPath), "one-command project check script should exist");
const courseDataSource = fs.readFileSync(courseDataAggregatorPath, "utf8");
const courseDataSources = Object.fromEntries(
  courseDataScriptPaths.map((scriptPath) => [scriptPath, fs.readFileSync(scriptPath, "utf8")])
);
const courseDataGuide = fs.readFileSync(courseDataGuidePath, "utf8");
const appSource = fs.readFileSync("prototype/app.js", "utf8");
const styleSource = fs.readFileSync("prototype/styles.css", "utf8");
assert.ok(!styleSource.includes("data-font-size"), "removed font-size mode should not leave unreachable CSS");
assert.ok(!appSource.includes("set-font-size"), "removed font-size mode should not leave an action handler");

const expectedVersionedAssets = [
  "./styles.css?v=20260729-password-auth",
  "./uly-transliteration.js?v=20260728-uly-transliteration",
  "./course-data/alphabet-data.js?v=20260728-uly-transliteration",
  "./course-data/combo-data.js?v=20260728-uly-transliteration",
  "./course-data/vocab-data.js?v=20260728-uly-transliteration",
  "./course-data/practice-data.js?v=20260728-learned-markers",
  "./course-data/reading-data.js?v=20260728-uly-transliteration",
  "./course-data.js?v=20260728-uly-transliteration",
  "./i18n/ui-messages.js?v=20260809-bilingual",
  "./i18n/alphabet-en.js?v=20260809-bilingual-alphabet",
  "./i18n/course-en.js?v=20260809-bilingual-alphabet",
  "./i18n/runtime.js?v=20260809-bilingual",
  "./audio-controller.js?v=20260728-uly-transliteration",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.8",
  "./cloud-config.js?v=20260728-cloud-sync",
  "./cloud-sync.js?v=20260729-password-auth",
  "./app.js?v=20260808-google-guest-auth"
];
const versionedAppAssets = [
  ...indexHtml.matchAll(
    /(?:href|src)="(?<url>(?:\.\/(?:styles\.css|uly-transliteration\.js|course-data\/[^"]+\.js|course-data\.js|i18n\/[^"]+\.js|audio-controller\.js|cloud-config\.js|cloud-sync\.js|app\.js)[^"]*|https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\.110\.8))"/g
  )
].map((match) => match.groups.url);
assert.deepEqual(
  versionedAppAssets,
  expectedVersionedAssets,
  "every prototype CSS, course-data, audio controller, and app asset should use the listening release cache version"
);
assert.ok(styleSource.includes("--content-max-width: 1120px;"), "prototype should define a tablet-friendly content width");
assert.ok(styleSource.includes("--nav-rail-width: 96px;"), "prototype should define a tablet side navigation width");
for (const phrase of [
  "prototype/course-data.js",
  "prototype/course-data/alphabet-data.js",
  "prototype/course-data/combo-data.js",
  "prototype/course-data/vocab-data.js",
  "prototype/course-data/practice-data.js",
  "prototype/course-data/reading-data.js",
  "alphabetGroups",
  "comboGroups",
  "vocabGroups",
  "practiceGroups",
  "readingUnits",
  "tests/course-data-integrity.test.mjs",
  "scripts/check-project.mjs",
  "待母语者审校",
  "音频待录"
]) {
  assert.ok(courseDataGuide.includes(phrase), `course data guide should mention ${phrase}`);
}
assert.ok(
  courseDataSource.includes("window.ANA_TILIM_COURSE"),
  "course data file should expose a stable window.ANA_TILIM_COURSE object"
);
for (const globalName of [
  "window.ANA_TILIM_ALPHABET",
  "window.ANA_TILIM_COMBOS",
  "window.ANA_TILIM_VOCAB",
  "window.ANA_TILIM_PRACTICE",
  "window.ANA_TILIM_READING"
]) {
  assert.ok(courseDataSource.includes(globalName), `course data aggregator should read ${globalName}`);
}
assert.ok(
  appSource.includes("window.ANA_TILIM_COURSE"),
  "app should read alphabet course content from the shared course data object"
);
assert.ok(
  /\.alphabet-strip\s*\{[^}]*justify-content:\s*center;/s.test(styleSource),
  "full alphabet directory should center wrapped letter pills"
);
const lessonStepStyle = styleSource.match(/^\.lesson-step\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(lessonStepStyle.includes("align-items: center;"), "learning unit cards should center their content vertically");
assert.ok(appSource.includes('class="lesson-step-copy"'), "learning unit rows should wrap title and subtitle in an alignable copy container");
const lessonStepCopyStyle = styleSource.match(/^\.lesson-step-copy\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(lessonStepCopyStyle.includes("text-align: left;"), "learning unit copy should be left aligned");
assert.ok(lessonStepCopyStyle.includes("align-items: baseline;"), "learning unit title and subtitle should share a baseline");
assert.ok(lessonStepCopyStyle.includes("grid-template-columns: minmax(220px, max-content) minmax(0, 1fr);"), "learning unit title and subtitle columns should align across rows");
const phoneStyle = styleSource.match(/@media \(max-width: 719px\)\s*\{(?<body>[\s\S]*?)\n\}/m)?.groups?.body || "";
const phoneLessonStepStyle = phoneStyle.match(/\.lesson-step\s*\{(?<body>[^}]*)\}/m)?.groups?.body || "";
assert.ok(
  phoneLessonStepStyle.includes("grid-template-columns: 34px minmax(0, 1fr);"),
  "phone learning unit cards should reserve one compact number column and one flexible copy column"
);
const phoneLessonStepCopyStyle = phoneStyle.match(/\.lesson-step-copy\s*\{(?<body>[^}]*)\}/m)?.groups?.body || "";
assert.ok(
  phoneLessonStepCopyStyle.includes("grid-template-columns: minmax(0, 1fr);"),
  "phone learning unit titles and subtitles should stack instead of squeezing the subtitle into a narrow column"
);
const phoneLessonTitleStyle = phoneStyle.match(/\.lesson-step strong\s*\{(?<body>[^}]*)\}/m)?.groups?.body || "";
assert.ok(
  phoneLessonTitleStyle.includes("white-space: normal;") &&
    phoneLessonTitleStyle.includes("text-overflow: clip;"),
  "phone learning unit titles should wrap cleanly instead of being clipped at larger text sizes"
);
const letterLibraryGridStyle = styleSource.match(/^\.letter-library-grid\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(
  letterLibraryGridStyle.includes("grid-template-columns: repeat(4, minmax(0, 1fr));"),
  "letter library should show four letters per row"
);
const homeCenterStyle = styleSource.match(/^\.home-center\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(homeCenterStyle.includes("width: min(100%, 390px);"), "home content should use a centered compact width");
assert.ok(homeCenterStyle.includes("min-height: calc(100svh - 320px);"), "home content should sit near the visual page center, not low on the page");
assert.ok(homeCenterStyle.includes("margin: 0 auto;"), "home content should be horizontally centered");
assert.ok(homeCenterStyle.includes("align-content: center;"), "home content should sit in the middle of the home page without stretching");
assert.ok(homeCenterStyle.includes("align-items: start;"), "home content should keep natural card heights while centered");
const homeCenterChildStyle = styleSource.match(/^\.home-center > \*\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(homeCenterChildStyle.includes("width: 100%;"), "home cards should fill the centered home column");
assert.ok(homeCenterChildStyle.includes("min-width: 0;"), "home cards should shrink within the phone content column");
const homeCenterGrandchildStyle = styleSource.match(/^\.home-center > \* > \*\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(homeCenterGrandchildStyle.includes("min-width: 0;"), "home card content should shrink without clipping long English copy");
const stepStateStyle = styleSource.match(/^\.step-state\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
for (const declaration of ["overflow: visible;", "text-overflow: clip;", "min-width: max-content;", "flex: 0 0 auto;"]) {
  assert.ok(stepStateStyle.includes(declaration), `status labels should include ${declaration}`);
}
const phoneShellStyle = styleSource.match(/^\.phone-shell\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(phoneShellStyle.includes("overflow: hidden;"), "phone shell should clip bottom navigation to the app frame");
const bottomNavStyle = styleSource.match(/^\.bottom-nav\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(bottomNavStyle.includes("position: absolute;"), "bottom navigation should stay inside the app frame instead of the browser viewport");
assert.ok(!bottomNavStyle.includes("position: fixed;"), "bottom navigation should not escape the app frame");
assert.ok(bottomNavStyle.includes("background: var(--cream);"), "bottom navigation background should be opaque so page cards do not bleed through");
assert.ok(styleSource.includes("@media (min-width: 720px)"), "prototype should include a tablet layout breakpoint");
const tabletMedia = styleSource.slice(styleSource.indexOf("@media (min-width: 720px)"));
assert.ok(tabletMedia.includes("width: min(100%, var(--content-max-width));"), "tablet layout should stop using the narrow phone shell width");
assert.ok(tabletMedia.includes("padding-left: calc(var(--nav-rail-width) + 28px);"), "tablet content should leave room for the side navigation rail");
assert.ok(tabletMedia.includes("width: var(--nav-rail-width);"), "tablet navigation should become a side rail");
assert.ok(tabletMedia.includes("grid-template-columns: 1fr;"), "tablet navigation should stack items vertically");
assert.ok(tabletMedia.includes(".profile-layout"), "profile screen should have a tablet-specific full-width layout");
assert.ok(tabletMedia.includes(".home-center"), "home screen should expand beyond the compact mobile column on tablet");
assert.ok(
  /\.path-list\s*\{\s*grid-template-columns:\s*1fr;/s.test(tabletMedia),
  "tablet learning unit list should show one unit per row"
);
assert.ok(
  /\.profile-layout\s*\{[^}]*grid-template-columns:\s*1fr;/s.test(tabletMedia),
  "tablet profile account and settings cards should stack across the full content width"
);
assert.ok(
  !tabletMedia.includes(".profile-stats-card"),
  "tablet layout should not retain the deleted expanded unit-progress column"
);
assert.ok(!appSource.includes("基础词组与主题词"), "old broad vocabulary unit title should be removed from the app");
assert.ok(courseDataSources["prototype/course-data/alphabet-data.js"].includes("alphabetGroups"), "unit one alphabet course data should live in the alphabet data file");
assert.ok(courseDataSources["prototype/course-data/combo-data.js"].includes("comboGroups"), "unit two combo course data should live in the combo data file");
assert.ok(
  !appSource.includes("const comboGroups = ["),
  "app should not define unit two combo content inline"
);
assert.ok(
  appSource.includes("comboGroups") && appSource.indexOf("comboGroups") < appSource.indexOf("const alphabetAudioByLetterId"),
  "app should read unit two combo content from the shared course data object"
);
assert.ok(courseDataSources["prototype/course-data/vocab-data.js"].includes("vocabGroups"), "unit three vocabulary course data should live in the vocab data file");
assert.ok(
  !appSource.includes("const vocabGroups = ["),
  "app should not define unit three vocabulary content inline"
);
assert.ok(
  appSource.includes("vocabGroups") && appSource.indexOf("vocabGroups") < appSource.indexOf("const alphabetAudioByLetterId"),
  "app should read unit three vocabulary content from the shared course data object"
);
assert.ok(courseDataSources["prototype/course-data/practice-data.js"].includes("practiceGroups"), "unit four practice course data should live in the practice data file");
assert.ok(
  !appSource.includes("const practiceGroups = ["),
  "app should not define unit four practice content inline"
);
assert.ok(
  appSource.includes("practiceGroups") && appSource.indexOf("practiceGroups") < appSource.indexOf("const alphabetAudioByLetterId"),
  "app should read unit four practice content from the shared course data object"
);
assert.ok(courseDataSources["prototype/course-data/reading-data.js"].includes("readingUnits"), "reading course data should live in the reading data file");
assert.ok(
  appSource.includes("readingUnits") && appSource.indexOf("readingUnits") < appSource.indexOf("const alphabetAudioByLetterId"),
  "app should read reading content from the shared course data object"
);
assert.ok(!appSource.includes('["recording", "录音"'), "bottom navigation should remove recording");
for (const removedRecorderToken of [
  "renderRecordingScreen",
  "MediaRecorder",
  "getUserMedia",
  "start-voice-recording",
  "import-voice-recording"
]) {
  assert.ok(!appSource.includes(removedRecorderToken), `app runtime should remove ${removedRecorderToken}`);
}
assert.ok(!appSource.includes('["writing", "练习"'), "bottom navigation should remove the empty practice area");
assert.ok(!appSource.includes('["writing", "书写"'), "bottom navigation should not label the full practice area as 书写");
assert.ok(appSource.includes("pointerdown"), "writing canvas should support direct pointer writing");
assert.ok(appSource.includes("clear-canvas"), "writing canvas should include a real clear action");
const htmlScriptOrder = [
  ...courseDataScriptPaths,
  courseDataAggregatorPath,
  ...i18nScriptPaths,
  "prototype/cloud-config.js",
  "prototype/cloud-sync.js",
  "prototype/app.js"
].map((scriptPath) => scriptPath.replace("prototype/", "./"));
for (let index = 0; index < htmlScriptOrder.length - 1; index += 1) {
  const currentScript = htmlScriptOrder[index];
  const nextScript = htmlScriptOrder[index + 1];
  assert.ok(
    indexHtml.indexOf(currentScript) >= 0 && indexHtml.indexOf(currentScript) < indexHtml.indexOf(nextScript),
    `${currentScript} should load before ${nextScript}`
  );
}

function makeElement(id) {
  return {
    id,
    innerHTML: "",
    textContent: "",
    dataset: {},
    classList: { add() {}, remove() {} },
    querySelector() {
      return null;
    },
    closest() {
      return null;
    },
    addEventListener() {}
  };
}

const app = makeElement("app");
const toast = makeElement("toast");
let clickHandler = null;
const storage = {};
const sessionStorageValues = {};
let storageWritesFail = false;
const playedAudioSources = [];
let audioPlayShouldReject = false;
const context = {
  console,
  document: {
    documentElement: { lang: "" },
    querySelector(selector) {
      if (selector === "#app") return app;
      if (selector === "#toast") return toast;
      return null;
    },
    addEventListener(eventName, handler) {
      if (eventName === "click") {
        clickHandler = handler;
      }
    }
  },
  window: {
    navigator: { languages: ["en-NZ"], language: "en-NZ" },
    setTimeout() {
      return 1;
    },
    clearTimeout() {},
    sessionStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(sessionStorageValues, key)
          ? sessionStorageValues[key]
          : null;
      },
      setItem(key, value) {
        sessionStorageValues[key] = String(value);
      },
      removeItem(key) {
        delete sessionStorageValues[key];
      }
    },
    localStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(storage, key) ? storage[key] : null;
      },
      setItem(key, value) {
        if (storageWritesFail) {
          throw new Error("localStorage write failed");
        }
        storage[key] = String(value);
      },
      removeItem(key) {
        delete storage[key];
      }
    }
  },
  Audio: function FakeAudio(src) {
    this.src = src;
    this.pause = () => {};
    this.play = () => {
      playedAudioSources.push(src);
      return audioPlayShouldReject ? Promise.reject(new Error("autoplay blocked")) : Promise.resolve();
    };
  }
};

context.globalThis = context;
vm.createContext(context);
for (const scriptPath of courseDataScriptPaths) {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), context, { filename: scriptPath });
}
vm.runInContext(fs.readFileSync(courseDataAggregatorPath, "utf8"), context, { filename: courseDataAggregatorPath });
for (const scriptPath of i18nScriptPaths) {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), context, { filename: scriptPath });
}
vm.runInContext(fs.readFileSync("prototype/cloud-config.js", "utf8"), context, { filename: "prototype/cloud-config.js" });
vm.runInContext(fs.readFileSync("prototype/cloud-sync.js", "utf8"), context, { filename: "prototype/cloud-sync.js" });
vm.runInContext(fs.readFileSync("prototype/app.js", "utf8"), context, { filename: "prototype/app.js" });

const savedLanguageStorage = {
  "ana-tilim-progress": JSON.stringify({ preferences: { uiLanguage: "zh" } })
};
const savedLanguageContext = {
  ...context,
  document: {
    ...context.document,
    documentElement: { lang: "" },
    addEventListener() {}
  },
  window: {
    ...context.window,
    navigator: { languages: ["en-NZ"], language: "en-NZ" },
    localStorage: {
      getItem(key) {
        return Object.prototype.hasOwnProperty.call(savedLanguageStorage, key)
          ? savedLanguageStorage[key]
          : null;
      },
      setItem(key, value) {
        savedLanguageStorage[key] = String(value);
      },
      removeItem(key) {
        delete savedLanguageStorage[key];
      }
    }
  }
};
savedLanguageContext.globalThis = savedLanguageContext;
vm.createContext(savedLanguageContext);
for (const scriptPath of courseDataScriptPaths) {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), savedLanguageContext, { filename: scriptPath });
}
for (const scriptPath of [
  courseDataAggregatorPath,
  ...i18nScriptPaths,
  "prototype/cloud-config.js",
  "prototype/cloud-sync.js",
  "prototype/app.js"
]) {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), savedLanguageContext, { filename: scriptPath });
}
assert.equal(vm.runInContext("state.interfaceLanguage", savedLanguageContext), "zh");
assert.equal(savedLanguageContext.document.documentElement.lang, "zh");

const defaultPreferences = JSON.parse(
  vm.runInContext("JSON.stringify(normalizePreferences(null))", context)
);
assert.deepEqual(defaultPreferences, {
  audioAutoplay: false,
  dailyGoal: 10,
  learningReminder: false,
  showLatin: true,
  uiLanguage: null
});
assert.equal(vm.runInContext("state.interfaceLanguage", context), "en");
assert.equal(context.document.documentElement.lang, "en");
assert.equal(
  vm.runInContext('normalizePreferences({ uiLanguage: "zh" }).uiLanguage', context),
  "zh"
);
assert.equal(
  vm.runInContext('normalizePreferences({ uiLanguage: "fr" }).uiLanguage', context),
  null
);
assert.equal(
  vm.runInContext("buildCloudSnapshot().preferences.uiLanguage", context),
  null,
  "system detection must not become an uploaded explicit preference"
);
vm.runInContext(
  `
    state.syncDirty = false;
    applyInterfaceLanguage("zh", { explicit: false });
  `,
  context
);
assert.equal(vm.runInContext("state.interfaceLanguage", context), "zh");
assert.equal(vm.runInContext("state.preferences.uiLanguage", context), null);
assert.equal(vm.runInContext("state.syncDirty", context), false);
assert.equal(context.document.documentElement.lang, "zh");
assert.equal(context.window.ANA_TILIM_I18N.getLanguage(), "zh");
vm.runInContext(
  `
    globalThis.languageTestCloudSync = cloudSync;
    cloudSync = null;
    applyInterfaceLanguage("en", { explicit: true });
  `,
  context
);
assert.equal(vm.runInContext("state.preferences.uiLanguage", context), "en");
assert.equal(vm.runInContext("state.syncDirty", context), true);
assert.equal(JSON.parse(storage["ana-tilim-progress"]).preferences.uiLanguage, "en");
vm.runInContext(
  `
    cloudSync = globalThis.languageTestCloudSync;
    state.preferences = normalizePreferences(null);
    state.syncDirty = false;
    applyInterfaceLanguage("en", { explicit: false });
  `,
  context
);
delete storage["ana-tilim-progress"];

vm.runInContext("globalThis.preCloudTestState = JSON.stringify(state)", context);
const cloudSnapshotKeys = JSON.parse(
  vm.runInContext("JSON.stringify(Object.keys(buildCloudSnapshot()).sort())", context)
);
assert.deepEqual(cloudSnapshotKeys, [
  "dailyActivity",
  "favorite",
  "favoriteUpdatedAt",
  "learningProgress",
  "mistakes",
  "modifiedAt",
  "preferences",
  "preferencesUpdatedAt",
  "schemaVersion"
]);
assert.equal(
  vm.runInContext("'screen' in buildCloudSnapshot() || 'authEmail' in buildCloudSnapshot()", context),
  false,
  "cloud learning snapshot should exclude navigation and account fields"
);
vm.runInContext(
  `
    state.screen = "library";
    applyCloudSnapshot({
      schemaVersion: 1,
      modifiedAt: "2026-07-28T04:00:00.000Z",
      preferencesUpdatedAt: "2026-07-28T04:00:00.000Z",
      favoriteUpdatedAt: "2026-07-28T04:00:00.000Z",
      learningProgress: {
        letters: { "dot-bone": { completed: true } },
        combos: {},
        vocab: {},
        practice: {},
        reading: {}
      },
      mistakes: [],
      favorite: true,
      dailyActivity: { date: "2026-07-28", completedIds: ["letters:dot-bone:completed"] },
      preferences: { audioAutoplay: false, dailyGoal: 10, learningReminder: false, showLatin: true, uiLanguage: "zh" }
    });
  `,
  context
);
assert.equal(vm.runInContext("state.screen", context), "library", "cloud merge should preserve current page");
assert.equal(vm.runInContext("state.favorite", context), true);
assert.equal(vm.runInContext("state.preferences.uiLanguage", context), "zh");
assert.equal(vm.runInContext("state.interfaceLanguage", context), "zh");
assert.equal(context.document.documentElement.lang, "zh");
assert.equal(context.window.ANA_TILIM_I18N.getLanguage(), "zh");
assert.equal(vm.runInContext("buildCloudSnapshot().preferences.uiLanguage", context), "zh");
assert.equal(
  vm.runInContext("state.learningProgress.letters['dot-bone'].completed", context),
  true
);
vm.runInContext(
  `
    globalThis.originalCloudSync = cloudSync;
    globalThis.cloudScheduleCount = 0;
    cloudSync = {
      ...cloudSync,
      scheduleSync() { globalThis.cloudScheduleCount += 1; }
    };
    state.syncDirty = true;
    saveLocalProgress();
  `,
  context
);
assert.equal(
  vm.runInContext("globalThis.cloudScheduleCount", context),
  1,
  "a dirty local learning save should schedule one cloud sync"
);
vm.runInContext(
  "cloudSync = globalThis.originalCloudSync; Object.assign(state, JSON.parse(globalThis.preCloudTestState));",
  context
);

const repairedPreferences = JSON.parse(
  vm.runInContext(
    `JSON.stringify(normalizePreferences({
      audioAutoplay: 1,
      dailyGoal: 99,
      learningReminder: "yes",
      showLatin: "yes",
      uiLanguage: "fr"
    }))`,
    context
  )
);
assert.deepEqual(repairedPreferences, defaultPreferences, "invalid preference values should use defaults");
assert.equal(
  vm.runInContext("normalizePreferences({ fontSize: 'large' }).fontSize", context),
  undefined,
  "stale saved font-size preferences should be discarded"
);
assert.equal(
  vm.runInContext("normalizePreferences({ showLatin: false }).showLatin", context),
  false,
  "the learner should be able to persistently hide ULY"
);

storage["ana-tilim-progress"] = JSON.stringify({
  screen: "settings",
  mockSignedIn: true,
  mockUserEmail: "learner@anatilim.app",
  preferences: defaultPreferences
});
vm.runInContext("hydrateLocalProgress()", context);
assert.equal(
  vm.runInContext("state.screen", context),
  "profile",
  "a stale saved Settings screen should hydrate into My instead of a removed route"
);
delete storage["ana-tilim-progress"];
vm.runInContext("state.screen = 'welcome'", context);

assert.equal(
  vm.runInContext("localDayKey(new Date(2026, 6, 26, 12, 0, 0))", context),
  "2026-07-26",
  "daily activity should use a stable local calendar key"
);

vm.runInContext(
  `
    state.preferences = {
      audioAutoplay: true,
      dailyGoal: 15,
      learningReminder: true,
      showLatin: true,
      uiLanguage: "zh"
    };
    state.dailyActivity = { date: "2026-07-26", completedIds: ["letters:dot-bone:viewed"] };
    saveLocalProgress();
  `,
  context
);
assert.deepEqual(savedProgress().preferences, {
  audioAutoplay: true,
  dailyGoal: 15,
  learningReminder: true,
  showLatin: true,
  uiLanguage: "zh"
});
assert.deepEqual(savedProgress().dailyActivity, {
  date: "2026-07-26",
  completedIds: ["letters:dot-bone:viewed"]
});

vm.runInContext(
  `
    state.dailyActivity = { date: localDayKey(), completedIds: [] };
    recordDailyActivity("letters:dot-bone:viewed");
    recordDailyActivity("letters:dot-bone:viewed");
  `,
  context
);
assert.equal(
  vm.runInContext("dailyActivitySnapshot().completedIds.length", context),
  1,
  "the same activity should count once per day"
);

function renderState(script) {
  vm.runInContext(`${script}; render();`, context);
  return app.innerHTML;
}

function setLanguage(language) {
  vm.runInContext(`applyInterfaceLanguage(${JSON.stringify(language)}, { explicit: true }); render();`, context);
}

function assertLearnerCopyClean(screenName) {
  for (const phrase of ["待审校", "待母语者审校", "待来源审校", "已校对", "待修改", "展示项"]) {
    assert.ok(!app.innerHTML.includes(phrase), `${screenName} should hide ${phrase}`);
  }
}

function includesAll(html, phrases, screenName) {
  for (const phrase of phrases) {
    assert.ok(html.includes(phrase), `${screenName} should include ${phrase}`);
  }
}

function clickDataset(dataset) {
  assert.ok(clickHandler, "click handler should be registered");
  clickHandler({
    target: {
      closest(selector) {
        assert.equal(selector, "[data-action]");
        return { dataset };
      }
    }
  });
}

function savedProgress() {
  assert.ok(storage["ana-tilim-progress"], "local progress should be saved");
  return JSON.parse(storage["ana-tilim-progress"]);
}

const requiredGlobalMessageKeys = [
  "nav.home", "nav.alphabet", "nav.learn", "nav.profile",
  "language.label", "language.chinese", "language.english",
  "welcome.title", "welcome.subtitle", "welcome.continueGuest",
  "auth.guestTitle", "auth.guestDetail", "auth.google", "auth.signOut",
  "home.continue", "home.today", "home.progress",
  "settings.title", "settings.learning", "settings.audio", "settings.account",
  "settings.reminder", "settings.showLatin", "settings.autoplay",
  "common.back", "common.previous", "common.next", "common.cancel", "common.confirm",
  "audio.play", "audio.playing", "audio.unavailable", "audio.humanRecording",
  "error.storage", "error.cloud", "error.avatar", "progress.count"
];
for (const language of ["zh", "en"]) {
  context.window.ANA_TILIM_I18N.setLanguage(language);
  for (const key of requiredGlobalMessageKeys) {
    assert.ok(context.window.ANA_TILIM_I18N.t(key), `${language} should define ${key}`);
  }
}

setLanguage("zh");
vm.runInContext(
  `
    state.screen = "group";
    state.selectedUnitId = "letters";
    state.selectedGroupId = "dot-bone";
    state.currentLetterId = "pe";
    state.selectedPicture = "be";
    state.keyboardValue = "ب";
    render();
  `,
  context
);
const learningStateBeforeLanguageSwitch = vm.runInContext(
  `JSON.stringify({
    screen: state.screen,
    selectedUnitId: state.selectedUnitId,
    selectedGroupId: state.selectedGroupId,
    currentLetterId: state.currentLetterId,
    selectedPicture: state.selectedPicture,
    keyboardValue: state.keyboardValue
  })`,
  context
);
setLanguage("en");
assert.equal(
  vm.runInContext(
    `JSON.stringify({
      screen: state.screen,
      selectedUnitId: state.selectedUnitId,
      selectedGroupId: state.selectedGroupId,
      currentLetterId: state.currentLetterId,
      selectedPicture: state.selectedPicture,
      keyboardValue: state.keyboardValue
    })`,
    context
  ),
  learningStateBeforeLanguageSwitch,
  "manually switching from Chinese to the opposing English language should preserve the current learning state"
);
assert.equal(vm.runInContext("state.preferences.uiLanguage", context), "en");
assert.equal(savedProgress().preferences.uiLanguage, "en");

const englishWelcomeHtml = renderState("state.screen = 'welcome'");
includesAll(
  englishWelcomeHtml,
  ["Continue as guest", "Local guest mode", "Continue with Google"],
  "English welcome and guest authentication"
);
const englishHomeHtml = renderState("state.screen = 'home'");
includesAll(
  englishHomeHtml,
  ["Home", "Alphabet", "Learn", "Profile"],
  "English home navigation"
);
assert.deepEqual(
  ["Home", "Alphabet", "Learn", "Profile"].map((label) => englishHomeHtml.indexOf(label)),
  ["Home", "Alphabet", "Learn", "Profile"].map((label) => englishHomeHtml.indexOf(label)).toSorted((left, right) => left - right),
  "bottom navigation should keep Home, Alphabet, Learn, and Profile in order"
);
const englishProfileHtml = renderState("state.screen = 'profile'");
includesAll(
  englishProfileHtml,
  ["Learning preferences", "Chinese", "English"],
  "English profile settings"
);

const compactLanguageControl = vm.runInContext("languageSwitcher(true)", context);
assert.ok(compactLanguageControl.includes('aria-label="Language"'));
assert.equal(
  (compactLanguageControl.match(/data-action="set-language"/g) || []).length,
  2,
  "the compact language control should render exactly two language buttons"
);
assert.equal(
  (compactLanguageControl.match(/aria-pressed="true"/g) || []).length,
  1,
  "the compact language control should expose exactly one active language"
);
assert.ok(englishHomeHtml.includes(compactLanguageControl), "the Home greeting row should include the compact language control");
assert.ok(
  !renderState("state.screen = 'learn'").includes('class="language-switcher is-compact"'),
  "course and learning-path top bars should not repeat the compact language control"
);
assert.ok(!compactLanguageControl.includes("🇨🇳") && !compactLanguageControl.includes("🇬🇧"), "language controls should not use flag icons");

const languageSwitcherStyle = styleSource.match(/^\.language-switcher\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(languageSwitcherStyle.includes("width: max-content;"), "language controls should use intrinsic width");
const fullLanguageButtonStyle = styleSource.match(/^\.language-switcher:not\(\.is-compact\) button\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(fullLanguageButtonStyle.includes("min-height: 44px;"), "Profile language buttons should meet the 44px touch target");
assert.ok(
  /\.language-switcher button:focus-visible\s*\{[^}]*outline:/s.test(styleSource),
  "language buttons should expose a visible keyboard focus indicator"
);
const phoneLanguageStyle = styleSource.match(/@media \(max-width: 719px\)\s*\{(?<body>[\s\S]*?)\n\}/m)?.groups?.body || "";
assert.ok(
  /\.brand-lockup\s*\{[^}]*min-width:\s*0;/s.test(phoneLanguageStyle),
  "the Home brand lockup should be allowed to shrink at phone width"
);
assert.ok(
  phoneLanguageStyle.includes("overflow-wrap: anywhere;"),
  "long English headings and buttons should wrap safely on phones"
);
const phoneSectionTitleStyle = phoneLanguageStyle.match(/\.section-title:not\(\.unit-goal-text\)\s*\{(?<body>[^}]*)\}/m)?.groups?.body || "";
assert.ok(
  phoneSectionTitleStyle.includes("white-space: normal;") &&
    phoneSectionTitleStyle.includes("text-overflow: clip;") &&
    phoneSectionTitleStyle.includes("overflow-wrap: anywhere;"),
  "long English section headings should override the desktop ellipsis rule on phones"
);

setLanguage("zh");
vm.runInContext("state.screen = 'home'; render();", context);
clickDataset({ action: "set-language", language: "en" });
assert.equal(vm.runInContext("state.interfaceLanguage", context), "en", "the language control should switch the live interface");
assert.equal(savedProgress().preferences.uiLanguage, "en", "the language control should persist the explicit preference");
assert.ok(app.innerHTML.includes("Good morning"), "the language control should rerender the current screen");
assert.equal(toast.textContent, "Interface language changed to English", "the switch toast should use the newly selected language");
clickDataset({ action: "set-language", language: "fr" });
assert.equal(vm.runInContext("state.interfaceLanguage", context), "en", "unsupported language controls should be ignored");
assert.equal(toast.textContent, "Interface language changed to English", "an invalid language control should not show another toast");
assert.equal(vm.runInContext('playAudio("", "Lesson")', context), false);
assert.equal(toast.textContent, "No audio available", "audio errors should use the selected interface language");

const englishAudioChrome = vm.runInContext(
  `
    (() => {
      const audio = {
        playable: true,
        outputPath: "./test.webm",
        file: "test.webm",
        statusLabel: "真人音频"
      };
      return [
        renderAudioButton({ audio, label: "ب" }),
        renderAudioWord({ value: "ب", audio }),
        renderAudioFocus({ audio, label: "ب", title: "ب", hint: "", hideFile: true }),
        renderAudioFocus({ audio: null, label: "ب", title: "ب", hint: "" })
      ].join("");
    })()
  `,
  context
);
includesAll(
  englishAudioChrome,
  ['aria-label="Play ب"', ">Play</button>", "Human recording", "No audio available"],
  "English reusable audio chrome"
);
for (const chineseChrome of ['aria-label="播放', "播放发音", ">听</button>", "真人音频", "音频待录"]) {
  assert.ok(
    !englishAudioChrome.includes(chineseChrome),
    `English reusable audio chrome should not include ${chineseChrome}`
  );
}

vm.runInContext(
  `
    state.selectedUnitId = "letters";
    state.selectedGroupId = "dot-bone";
    state.currentLetterId = "be";
    state.selectedPicture = "pe";
    state.selectedListening = "pe";
    state.keyboardValue = "پ";
  `,
  context
);
assert.equal(
  vm.runInContext(`formExampleItems.find((item) => item.value === "كىتاب").meaning`, context),
  "book",
  "switching to English should rebuild derived form-example text"
);
const englishAlphabetScreens = {
  group: renderState("state.screen = 'group'"),
  letterWriting: renderState("state.screen = 'letterWriting'"),
  picture: renderState("state.screen = 'picture'"),
  listening: renderState("state.screen = 'listening'"),
  letterOdd: renderState("state.screen = 'letterOdd'"),
  letterSound: renderState("state.screen = 'letterSound'"),
  keyboard: renderState("state.screen = 'keyboard'")
};
includesAll(
  englishAlphabetScreens.group,
  ["Consonant", "One dot below", "Isolated form", "book", "Shape", "Connections", "Writing"],
  "English alphabet letter lesson"
);
for (const [screenName, html] of Object.entries(englishAlphabetScreens)) {
  assert.ok(
    !/[\u3400-\u9fff]/u.test(html),
    `English alphabet ${screenName} screen should not contain Chinese course or interface text`
  );
}

setLanguage("zh");
assert.equal(
  vm.runInContext(`formExampleItems.find((item) => item.value === "كىتاب").meaning`, context),
  "书",
  "switching back to Chinese should rebuild the original derived form-example text"
);
const restoredChineseAlphabetHtml = renderState("state.screen = 'group'");
includesAll(
  restoredChineseAlphabetHtml,
  ["辅音", "下方一个点", "独立式", "书", "认形", "连接", "书写"],
  "restored Chinese alphabet letter lesson"
);

setLanguage("zh");

vm.runInContext(
  `
    state.screen = "profile";
    state.learningProgress.letters["dot-bone"] = { completed: true };
    state.mistakes = [{ kind: "letter", targetId: "be" }];
  `,
  context
);
let guestBackup = vm.runInContext("backupGuestProgress()", context);
assert.equal(guestBackup.ok, true, "guest learning should be backed up before registration");
assert.equal(
  JSON.parse(storage["ana-tilim-guest-progress-backup"])
    .snapshot.learningProgress.letters["dot-bone"].completed,
  true
);
assert.equal(
  JSON.parse(storage["ana-tilim-guest-progress-backup"]).snapshot.preferences.uiLanguage,
  "zh"
);

storage["ana-tilim-guest-progress-backup"] = "previous-backup";
guestBackup = vm.runInContext("backupGuestProgress()", context);
assert.equal(guestBackup.previousValue, "previous-backup");
assert.equal(
  vm.runInContext(`restoreGuestProgressBackup("previous-backup")`, context),
  true
);
assert.equal(storage["ana-tilim-guest-progress-backup"], "previous-backup");

storageWritesFail = true;
const progressBeforeFailedBackup = vm.runInContext(
  "JSON.stringify(state.learningProgress)",
  context
);
const failedGuestBackup = vm.runInContext("backupGuestProgress()", context);
storageWritesFail = false;
assert.equal(failedGuestBackup.ok, false);
assert.equal(
  vm.runInContext("JSON.stringify(state.learningProgress)", context),
  progressBeforeFailedBackup,
  "failed backup must leave guest learning untouched"
);

vm.runInContext("initializeNewLearnerProgress()", context);
assert.equal(vm.runInContext("state.screen", context), "home");
assert.equal(vm.runInContext("state.selectedUnitId", context), "letters");
assert.equal(vm.runInContext("state.selectedGroupId", context), "dot-bone");
assert.equal(vm.runInContext("state.currentLetterId", context), "be");
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.learningProgress)", context)),
  { letters: {}, combos: {}, vocab: {}, practice: {}, reading: {} }
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.mistakes)", context)),
  []
);

const forbiddenInternationalAuthUi = [
  'role="tablist"',
  'id="password-auth-name"',
  'id="password-auth-email"',
  'id="password-auth-password"',
  'id="password-auth-confirm"',
  'data-action="password-login"',
  'data-action="password-register"',
  'data-action="show-email-login"',
  'data-action="request-email-otp"',
  'data-action="verify-email-otp"',
  'id="auth-email"',
  'id="auth-code"'
];

function assertGuestAndGoogleOnly(html, label) {
  includesAll(
    html,
    [
      "本地游客模式",
      "无需登录即可学习，进度保存在当前设备。",
      "使用 Google 登录"
    ],
    label
  );
  for (const forbidden of forbiddenInternationalAuthUi) {
    assert.ok(!html.includes(forbidden), `${label} should not render ${forbidden}`);
  }
}

const welcomeHtml = renderState("state.screen = 'welcome'");
assertGuestAndGoogleOnly(welcomeHtml, "international welcome authentication");
assert.ok(welcomeHtml.includes('data-action="continue-local"'));
assert.ok(welcomeHtml.includes("登录后自动同步"));

assert.deepEqual(
  JSON.parse(
    vm.runInContext(
      `JSON.stringify(validatePasswordAuthFields({
        mode: "register",
        displayName: "",
        email: "bad",
        password: "short",
        confirmPassword: "different"
      }))`,
      context
    )
  ),
  { ok: false, message: "请输入昵称" }
);
assert.deepEqual(
  JSON.parse(
    vm.runInContext(
      `JSON.stringify(validatePasswordAuthFields({
        mode: "register",
        displayName: "Nigar",
        email: "learner@example.com",
        password: "safe-pass-123",
        confirmPassword: "safe-pass-123"
      }))`,
      context
    )
  ),
  {
    ok: true,
    values: {
      displayName: "Nigar",
      email: "learner@example.com",
      password: "safe-pass-123"
    }
  }
);
assert.equal(
  vm.runInContext(
    `passwordAuthErrorMessage({ message: "Invalid login credentials" }, "login")`,
    context
  ),
  "邮箱或密码不正确"
);

clickDataset({ action: "continue-local" });
assert.equal(vm.runInContext("state.screen", context), "home", "local learning should enter without login");

vm.runInContext("state.preferences = normalizePreferences(null)", context);
const profileHtml = renderState("state.screen = 'profile'");
assertGuestAndGoogleOnly(profileHtml, "international profile authentication");
assert.ok(profileHtml.includes("清除学习记录"));
includesAll(
  profileHtml,
  [
    "学习账号",
    "本地模式",
    "个人学习状态",
    "连续学习",
    "今日待复习",
    "总进度",
    "学习偏好",
    "学习提醒",
    "显示拉丁转写",
    "自动播放",
    "清除学习记录",
    "从相册选择头像"
  ],
  "profile account and settings"
);
assert.equal(
  (profileHtml.match(/学习偏好/g) || []).length,
  1,
  "My should show the learner-visible 学习偏好 heading exactly once"
);
assert.ok(!profileHtml.includes("字体大小"), "My should remove the font-size setting");
assert.ok(!profileHtml.includes("调整界面与学习内容字号"), "My should remove the font-size setting detail");
assert.ok(!profileHtml.includes("按 9 个学习单元查看完成情况"));
assert.ok(!renderState("state.screen = 'home'").includes("按 9 个学习单元查看完成情况"));
assert.ok(!profileHtml.includes("将在登录版开放"));
assert.match(
  profileHtml,
  /<input[^>]+id="profile-avatar-input"[^>]+type="file"[^>]+accept="image\/\*"[^>]*>/,
  "My should provide a photo-library compatible image picker"
);
assert.ok(
  !profileHtml.includes('capture="camera"'),
  "the avatar picker should not force the camera instead of the photo library"
);

vm.runInContext(
  `
    globalThis.savedCloudSyncForProfileTest = cloudSync;
    cloudSync = {
      session() {
        return {
          user: {
            id: "user-1",
            email: "learner@example.com",
            user_metadata: { full_name: "Nigar" }
          }
        };
      },
      profile() {
        return {
          email: "learner@example.com",
          displayName: "Nigar",
          avatarUrl: ""
        };
      }
    };
    cloudStatus = { phase: "signed-in", error: "" };
  `,
  context
);
const signedInProfileHtml = renderState("state.screen = 'profile'");
includesAll(signedInProfileHtml, ["learner@example.com", "退出登录"], "signed-in Google account");
assert.ok(!signedInProfileHtml.includes("使用 Google 登录"));
assert.match(
  signedInProfileHtml,
  /<input[^>]+id="profile-display-name"[^>]+maxlength="40"[^>]*>/,
  "signed-in learners should be able to edit their display name"
);
assert.match(
  signedInProfileHtml,
  /<button[^>]+data-action="save-display-name"[^>]*>[\s\S]*?保存名称[\s\S]*?<\/button>/,
  "signed-in learners should be able to save their display name"
);
assert.deepEqual(
  JSON.parse(vm.runInContext(`JSON.stringify(validateDisplayName("   "))`, context)),
  { ok: false, message: "请输入名称" }
);
assert.deepEqual(
  JSON.parse(vm.runInContext(`JSON.stringify(validateDisplayName(" Ana "))`, context)),
  { ok: true, value: "Ana" }
);
vm.runInContext(
  `
    cloudSync = globalThis.savedCloudSyncForProfileTest;
    cloudStatus = { phase: "local", error: "" };
  `,
  context
);

const staleSettingsHtml = renderState("state.screen = 'settings'");
assert.ok(staleSettingsHtml.includes("个人学习状态"), "a stale Settings route should render My");
assert.equal(vm.runInContext("state.screen", context), "profile", "render should normalize a stale Settings route to My");

vm.runInContext(
  `
    state.preferences = {
      audioAutoplay: true,
      dailyGoal: 15,
      learningReminder: true,
      showLatin: true
    };
    state.learningProgress = {
      letters: { "dot-bone": { completed: true } },
      combos: { "open-a": { completed: true } },
      vocab: { greetings: { completed: true } },
      practice: { "listening-loop": { completed: true } },
      reading: { "sentence-this-that": { completed: true } }
    };
    state.dailyActivity = {
      date: localDayKey(),
      completedIds: ["letters:dot-bone:viewed"]
    };
    state.mistakes = [{ key: "letter:be", targetId: "be" }];
    state.writingChecks = ["shape"];
    state.favorite = true;
    state.selectedPicture = "be";
    state.selectedListening = "practice-listen-be";
    state.practiceAudioPlayed = true;
    state.keyboardValue = "ب";
    state.practiceSpoken = true;
    state.currentLetterId = "pe";
    state.selectedGroupId = "tail-bowl";
    state.currentComboItemId = "ta";
    state.selectedComboGroupId = "open-e";
    state.currentVocabItemId = "rehmet";
    state.selectedVocabGroupId = "polite";
    state.currentPracticeItemId = "practice-listen-pe";
    state.selectedPracticeGroupId = "writing-loop";
    state.selectedReadingUnitId = "daily-dialogues";
    state.selectedReadingGroupId = "dialogue-greeting";
    state.selectedUnitId = "basic-phrases";
    state.screen = "profile";
    render();
  `,
  context
);

const populatedLearningRecord = vm.runInContext(
  `JSON.stringify({
    learningProgress: state.learningProgress,
    dailyActivity: state.dailyActivity,
    mistakes: state.mistakes,
    writingChecks: state.writingChecks,
    favorite: state.favorite,
    selectedPicture: state.selectedPicture,
    selectedListening: state.selectedListening,
    practiceAudioPlayed: state.practiceAudioPlayed,
    keyboardValue: state.keyboardValue,
    practiceSpoken: state.practiceSpoken,
    currentLetterId: state.currentLetterId,
    selectedGroupId: state.selectedGroupId,
    currentComboItemId: state.currentComboItemId,
    selectedComboGroupId: state.selectedComboGroupId,
    currentVocabItemId: state.currentVocabItemId,
    selectedVocabGroupId: state.selectedVocabGroupId,
    currentPracticeItemId: state.currentPracticeItemId,
    selectedPracticeGroupId: state.selectedPracticeGroupId,
    selectedReadingUnitId: state.selectedReadingUnitId,
    selectedReadingGroupId: state.selectedReadingGroupId,
    selectedUnitId: state.selectedUnitId
  })`,
  context
);

clickDataset({ action: "request-clear-learning" });
includesAll(app.innerHTML, ["确认清除学习记录", "取消", "确认清除"], "clear confirmation");
assert.equal(vm.runInContext("state.mistakes.length", context), 1, "request should not clear data");

clickDataset({ action: "cancel-clear-learning" });
assert.equal(vm.runInContext("state.mistakes.length", context), 1, "cancel should preserve data");
assert.ok(app.innerHTML.includes("清除学习记录"), "cancel should return to the clear-learning entry point");

storageWritesFail = true;
clickDataset({ action: "request-clear-learning" });
clickDataset({ action: "confirm-clear-learning" });
storageWritesFail = false;
assert.equal(
  vm.runInContext(
    `JSON.stringify({
      learningProgress: state.learningProgress,
      dailyActivity: state.dailyActivity,
      mistakes: state.mistakes,
      writingChecks: state.writingChecks,
      favorite: state.favorite,
      selectedPicture: state.selectedPicture,
      selectedListening: state.selectedListening,
      practiceAudioPlayed: state.practiceAudioPlayed,
      keyboardValue: state.keyboardValue,
      practiceSpoken: state.practiceSpoken,
      currentLetterId: state.currentLetterId,
      selectedGroupId: state.selectedGroupId,
      currentComboItemId: state.currentComboItemId,
      selectedComboGroupId: state.selectedComboGroupId,
      currentVocabItemId: state.currentVocabItemId,
      selectedVocabGroupId: state.selectedVocabGroupId,
      currentPracticeItemId: state.currentPracticeItemId,
      selectedPracticeGroupId: state.selectedPracticeGroupId,
      selectedReadingUnitId: state.selectedReadingUnitId,
      selectedReadingGroupId: state.selectedReadingGroupId,
      selectedUnitId: state.selectedUnitId
    })`,
    context
  ),
  populatedLearningRecord,
  "failed clearing should restore the complete learning-record snapshot"
);
assert.equal(
  vm.runInContext("state.clearLearningConfirmation", context),
  false,
  "failed clearing should close the confirmation"
);
assert.equal(toast.textContent, "清除失败，原记录已保留");

clickDataset({ action: "request-clear-learning" });
clickDataset({ action: "confirm-clear-learning" });
assert.equal(vm.runInContext("state.mistakes.length", context), 0);
assert.equal(vm.runInContext("state.writingChecks.length", context), 0);
assert.equal(vm.runInContext("state.favorite", context), false);
assert.equal(vm.runInContext("state.dailyActivity.completedIds.length", context), 0);
assert.equal(vm.runInContext("Object.keys(state.learningProgress.letters).length", context), 0);
assert.equal(vm.runInContext("Object.keys(state.learningProgress.combos).length", context), 0);
assert.equal(vm.runInContext("Object.keys(state.learningProgress.vocab).length", context), 0);
assert.equal(vm.runInContext("Object.keys(state.learningProgress.practice).length", context), 0);
assert.equal(vm.runInContext("Object.keys(state.learningProgress.reading).length", context), 0);
assert.equal(vm.runInContext("state.selectedPicture", context), "");
assert.equal(vm.runInContext("state.selectedListening", context), "");
assert.equal(vm.runInContext("state.practiceAudioPlayed", context), false);
assert.equal(vm.runInContext("state.keyboardValue", context), "");
assert.equal(vm.runInContext("state.practiceSpoken", context), false);
assert.equal(vm.runInContext("state.currentLetterId", context), "be");
assert.equal(vm.runInContext("state.selectedGroupId", context), "dot-bone");
assert.equal(vm.runInContext("state.currentComboItemId", context), "ba");
assert.equal(vm.runInContext("state.selectedComboGroupId", context), "open-a");
assert.equal(vm.runInContext("state.currentVocabItemId", context), "yaxshimusiz");
assert.equal(vm.runInContext("state.selectedVocabGroupId", context), "greetings");
assert.equal(vm.runInContext("state.currentPracticeItemId", context), "practice-listen-be");
assert.equal(vm.runInContext("state.selectedPracticeGroupId", context), "listening-loop");
assert.equal(vm.runInContext("state.selectedReadingUnitId", context), "sentence-patterns");
assert.equal(vm.runInContext("state.selectedReadingGroupId", context), "sentence-this-that");
assert.equal(vm.runInContext("state.selectedUnitId", context), "letters");
assert.equal(vm.runInContext("state.clearLearningConfirmation", context), false);
assert.equal(toast.textContent, "学习记录已清除");
assert.equal(savedProgress().mockSignedIn, undefined, "Supabase session should not be copied into local learning data");
assert.equal(savedProgress().mockUserEmail, undefined, "account email should not be copied into local learning data");
assert.deepEqual(savedProgress().preferences, {
  audioAutoplay: true,
  dailyGoal: 15,
  learningReminder: true,
  showLatin: true
});
vm.runInContext("state.preferences = normalizePreferences(null); saveLocalProgress(); render();", context);

playedAudioSources.length = 0;
vm.runInContext(
  `
    state.preferences.audioAutoplay = true;
    state.screen = "group";
    state.selectedGroupId = "dot-bone";
    state.currentLetterId = "be";
    render();
  `,
  context
);
assert.deepEqual(playedAudioSources, ["./assets/audio/human/alphabet/human_letter_01_b.webm"]);

vm.runInContext("render()", context);
assert.equal(playedAudioSources.length, 1, "ordinary rerender should not replay current content");

clickDataset({ action: "select-adjacent-letter", id: "pe" });
assert.equal(playedAudioSources.length, 2, "switching content should autoplay once");
assert.equal(playedAudioSources[1], "./assets/audio/human/alphabet/human_letter_02_p.webm");

vm.runInContext("state.screen = 'home'; render(); state.screen = 'group'; render();", context);
assert.equal(playedAudioSources.length, 3, "leaving and returning should allow autoplay again");

vm.runInContext(
  `
    state.screen = "combo";
    state.selectedComboGroupId = "open-a";
    state.currentComboItemId = "ba";
    render();
  `,
  context
);
assert.equal(
  playedAudioSources.at(-1),
  "./assets/audio/human/combos/human_combo_ba.webm",
  "current combo should autoplay its connected audio"
);

vm.runInContext(
  `
    state.screen = "vocab";
    state.selectedVocabGroupId = "greetings";
    state.currentVocabItemId = "yaxshimusiz";
    render();
  `,
  context
);
assert.equal(
  playedAudioSources.at(-1),
  "./assets/audio/human/vocab/human_vocab_yaxshimusiz.webm",
  "current vocabulary item should autoplay its connected audio"
);

vm.runInContext(
  `
    state.screen = "practiceSession";
    state.selectedPracticeGroupId = "listening-loop";
    state.currentPracticeItemId = "practice-listen-be";
    render();
  `,
  context
);
assert.equal(
  playedAudioSources.at(-1),
  "./assets/audio/human/alphabet/human_letter_01_b.webm",
  "current practice item should autoplay its connected audio"
);

vm.runInContext(
  `
    state.screen = "reading";
    state.selectedReadingUnitId = "sentence-patterns";
    state.selectedReadingGroupId = "sentence-this-that";
    render();
  `,
  context
);
assert.equal(
  playedAudioSources.at(-1),
  "./assets/audio/human/reading/human_reading_sentence_this_that_1.webm",
  "reading should autoplay only the first item in the current group"
);
const beforeReadingRerender = playedAudioSources.length;
vm.runInContext("render()", context);
assert.equal(
  playedAudioSources.length,
  beforeReadingRerender,
  "reading rerender should not start the remaining group recordings"
);

audioPlayShouldReject = true;
toast.textContent = "unchanged";
vm.runInContext(
  `
    state.screen = "group";
    state.selectedGroupId = "dot-bone";
    state.currentLetterId = "te";
    render();
  `,
  context
);
await Promise.resolve();
const afterBlockedAutoplay = playedAudioSources.length;
assert.equal(toast.textContent, "unchanged", "blocked autoplay should fail silently");
vm.runInContext("render()", context);
assert.equal(
  playedAudioSources.length,
  afterBlockedAutoplay,
  "blocked autoplay should not retry on an ordinary rerender"
);
audioPlayShouldReject = false;

vm.runInContext(
  `
    state.preferences.audioAutoplay = false;
    state.currentLetterId = "se";
    render();
  `,
  context
);
assert.equal(
  playedAudioSources.length,
  afterBlockedAutoplay,
  "switching to new content should not play when autoplay is disabled"
);
const beforeManualPlay = playedAudioSources.length;
clickDataset({
  action: "play-audio",
  audioSrc: "./assets/audio/human/alphabet/human_letter_01_b.webm",
  audioLabel: "ب"
});
assert.equal(playedAudioSources.length, beforeManualPlay + 1, "manual playback should always work");

audioPlayShouldReject = true;
clickDataset({
  action: "play-audio",
  audioSrc: "./assets/audio/human/alphabet/human_letter_02_p.webm",
  audioLabel: "پ"
});
await Promise.resolve();
await Promise.resolve();
assert.equal(
  toast.textContent,
  "音频文件不能播放，请检查文件",
  "manual playback rejection should show the existing error feedback"
);
audioPlayShouldReject = false;

assert.ok(
  /profile-hero-card[\s\S]*学习账号[\s\S]*profile-settings-card/.test(profileHtml),
  "My should render the full-width settings card after the account overview"
);
assert.ok(!profileHtml.includes("每日目标"), "My should remove the daily-goal setting block");
assert.ok(styleSource.includes(".learned-marker"), "learned content should use a compact visual marker");
vm.runInContext(
  `
    state.screen = "profile";
    window.sessionStorage.setItem("ana-tilim-auth-redirect", "1");
    handleCloudStatus({ phase: "signed-in", authEvent: "", error: "" });
  `,
  context
);
assert.equal(
  vm.runInContext("state.screen", context),
  "home",
  "a completed Google OAuth redirect should automatically open the home screen"
);
assert.equal(
  sessionStorageValues["ana-tilim-auth-redirect"],
  undefined,
  "the one-time OAuth redirect marker should be cleared after it is handled"
);
vm.runInContext(
  `
    state.screen = "vocab";
    handleCloudStatus({ phase: "signed-in", authEvent: "SIGNED_IN", error: "" });
  `,
  context
);
assert.equal(
  vm.runInContext("state.screen", context),
  "vocab",
  "later signed-in notifications should not interrupt an active lesson"
);
assert.ok(
  !profileHtml.includes("profile-stats-card") && !profileHtml.includes("profile-unit-row"),
  "My should remove the expanded unit-progress card"
);
assert.ok(!profileHtml.includes("profile-metric-grid"), "profile metrics should be nested under the learning account card");
assert.ok(
  /profile-hero-card[\s\S]*学习账号[\s\S]*profile-account-metrics[\s\S]*连续学习[\s\S]*今日待复习[\s\S]*总进度/.test(profileHtml),
  "profile metrics should appear directly below the learning account section"
);
assert.ok(!profileHtml.includes("录音与上传"), "profile screen should no longer lead with recording/upload tooling");
assert.ok(!profileHtml.includes("我的录音"), "profile screen should move the recording center into its own nav tab");

clickDataset({ action: "toggle-audio-autoplay" });
assert.equal(savedProgress().preferences.audioAutoplay, true);

vm.runInContext(
  "state.dailyActivity = { date: localDayKey(), completedIds: [] }; state.preferences.dailyGoal = 15;",
  context
);
assert.ok(renderState("state.screen = 'home'").includes("0 / 15"));

clickDataset({ action: "toggle-learning-reminder" });
assert.equal(savedProgress().preferences.learningReminder, true);
includesAll(renderState("state.screen = 'home'"), ["今日学习提醒", "还差 15 个完成今日目标"], "home reminder");

clickDataset({ action: "toggle-latin-transliteration" });
assert.equal(savedProgress().preferences.showLatin, false, "ULY visibility should be saved");
assert.equal(app.dataset.showLatin, "false", "ULY visibility should apply to the app root");
assert.ok(
  !renderState("state.screen = 'group'; state.selectedGroupId = 'vowels-basic'; state.currentLetterId = 'aa'").includes(
    "latin-transliteration"
  ),
  "hiding ULY should remove transliteration markup without leaving placeholders"
);
clickDataset({ action: "toggle-latin-transliteration" });
assert.equal(savedProgress().preferences.showLatin, true, "ULY should be restorable");
assert.equal(app.dataset.showLatin, "true", "restored ULY visibility should apply to the app root");

vm.runInContext(
  `state.dailyActivity = {
    date: localDayKey(),
    completedIds: Array.from({ length: 15 }, (_, index) => "activity-" + index)
  }`,
  context
);
assert.ok(!renderState("state.screen = 'home'").includes("今日学习提醒"));

includesAll(
  renderState(`
    state.screen = 'home';
    state.selectedUnitId = 'dialogue-theater';
    state.learningProgress = emptyLearningProgress();
    state.learningProgress.reading['dialogue-greetings'] = { viewed: true };
    state.mistakes = [];
    state.dailyActivity = { date: localDayKey(), completedIds: [] };
  `),
  ["今日进度", "第一单元 · 认识字母", "继续学习", "today-progress-note", "记忆练习", "去字母练习", "home-center"],
  "blank new learner home screen"
);
assertLearnerCopyClean("home screen");
assert.ok(!app.innerHTML.includes("第三单元 · 听说与书写"), "home should not lead learners back to the removed practice unit");
assert.ok(!app.innerHTML.includes("继续错题复习"), "home progress card should not duplicate the memory review action");
assert.ok(!app.innerHTML.includes("今日学习概览"), "home should remove the duplicate overview metrics");
assert.ok(!app.innerHTML.includes("全站练习中心"), "home should remove the duplicate practice overview card");
assert.ok(
  /today-progress-card[\s\S]*今日进度[\s\S]*profile-memory-card[\s\S]*记忆练习/.test(app.innerHTML),
  "home memory practice should sit directly under the daily progress card"
);
assert.ok(!app.innerHTML.includes("practice-hub-intro-card"), "home should not render the removed duplicate practice overview card");
includesAll(
  renderState("state.screen = 'home'; state.mistakes = [{ source: 'practice', targetId: 'be', label: '错题' }]"),
  ["记忆练习", "先复习今天容易忘的内容", "开始今日复习"],
  "home memory review state"
);
const bottomNavHtml = app.innerHTML.match(/<nav class="bottom-nav"[\s\S]*?<\/nav>/)?.[0] || "";
let lastNavPosition = -1;
for (const target of ["home", "library", "learn", "profile"]) {
  const position = bottomNavHtml.indexOf(`data-target="${target}"`, lastNavPosition + 1);
  assert.ok(position > lastNavPosition, `bottom navigation should place ${target} in order`);
  lastNavPosition = position;
}
assert.equal(
  (bottomNavHtml.match(/class="nav-button/g) || []).length,
  4,
  "bottom navigation should contain exactly four actions"
);
assert.ok(!bottomNavHtml.includes('data-target="settings"'), "bottom navigation should remove the separate Settings action");
assert.ok(!bottomNavHtml.includes('data-target="recording"'));
assert.ok(!bottomNavHtml.includes('data-target="writing"'), "bottom navigation should remove the empty practice tab");
assert.ok(!app.innerHTML.includes("今日下一步"), "home screen should remove the daily next-action explainer card");
assert.ok(!app.innerHTML.includes("next-action-card"), "home screen should not render the removed next-action card");
assert.ok(!app.innerHTML.includes("快速入口"), "home screen should remove the quick entry section");
assert.ok(!app.innerHTML.includes("quick-grid"), "home screen should not render quick entry buttons");
assert.ok(!app.innerHTML.includes("<br>"), "home screen should not force unit titles onto manual line breaks");
assert.ok(!app.innerHTML.includes("真人音频 / 音频待录"), "home audio note should use readable punctuation");

includesAll(
  renderState("state.screen = 'writing'; state.mistakes = []"),
  ["练习已整理", "入口已移动到首页和字母", "回到首页", "去字母练习"],
  "removed practice tab fallback"
);
assert.ok(!app.innerHTML.includes("错题复习"), "removed practice tab should not keep the old review row");
assert.ok(!app.innerHTML.includes("查看学习路径"), "removed practice tab should not keep the old learning-path button");

includesAll(
  renderState("state.screen = 'learn'"),
  [
    "第三单元：日常用语与词汇",
    "第四单元：语法入门",
    "第五单元：基础句型",
    "第六单元：对话小剧场",
    "第七单元：小故事",
    "第八单元：名人名言",
    "第九单元：维吾尔谚语",
    "问候、人称代词、称呼、数字、动物"
  ],
  "learning path with reading units"
);
assertLearnerCopyClean("learning path");
assert.ok(!app.innerHTML.includes("听说与书写强化"), "learning path should remove the old third practice unit");
assert.ok(!app.innerHTML.includes("第三单元：字母连接规律"), "learning path should remove the separate connection unit");
assert.equal((app.innerHTML.match(/class="lesson-step"/g) || []).length, 9, "learning path should show nine learning units");
assert.ok(!app.innerHTML.includes("基础词组与主题词"), "learning path should not show the removed vocabulary title");
assert.ok(!app.innerHTML.includes("选择训练组、完成一个目标、查看本轮结果"), "learning unit cards should not show the full step explanation");
assert.ok(!app.innerHTML.includes("完整字母目录"), "learning path should not duplicate the full alphabet table");
assert.ok(!app.innerHTML.includes("alphabet-strip"), "learning path should keep the large alphabet table in the alphabet tab only");

includesAll(
  renderState(`
    state.screen = 'home';
    state.selectedUnitId = 'letters';
    state.learningProgress.letters = { 'dot-bone': { completed: true } };
    state.learningProgress.practice = { 'listening-loop': { completed: true } };
    state.mistakes = [{
      key: 'letter:be',
      kind: 'letter',
      kindLabel: '字母',
      targetId: 'be',
      pickedId: 'pe',
      value: 'ب',
      latin: 'b',
      source: '第一单元错题',
      note: '目标是 ب，你选了 پ',
      help: '看下方点数。',
      attempts: 1
    }];
  `),
  ["今日进度", "第一单元 · 认识字母", "先复习今天容易忘的内容", "开始今日复习"],
  "home progress summary"
);
assert.ok(!app.innerHTML.includes("学习地图"), "home screen should not show the learning map");
assert.ok(!app.innerHTML.includes("learning-map-card"), "home screen should remove the learning map card");

for (const unitId of ["letters", "combos"]) {
  renderState(`state.screen = 'unit'; state.selectedUnitId = '${unitId}'`);
  assert.ok(!app.innerHTML.includes("单元目标"), `${unitId} unit screen should not show the unit goal block`);
  assert.ok(!app.innerHTML.includes("学习步骤"), `${unitId} unit screen should not show the learning steps block`);
  assert.ok(!app.innerHTML.includes("按这个顺序走"), `${unitId} unit screen should remove optional step copy`);
  assert.ok(app.innerHTML.includes("path-list"), `${unitId} unit screen should keep the lesson entry list`);
}
includesAll(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'combos'"),
  ["第二单元：基础组合", "开口组合", "轻声组合", "连续连接：三字母", "连接会断开的字母"],
  "second unit merged connection groups"
);
assert.ok(!app.innerHTML.includes("基础称呼预览"), "second unit should remove the duplicate family preview group");
includesAll(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'basic-phrases'"),
  ["vocab-topic-list", "问候", "人称代词", "称呼", "数字", "动物", "→"],
  "vocab unit topic directory"
);
assert.ok(!app.innerHTML.includes("ياخشىمۇسىز"), "vocab unit directory should not expand word pills");
assert.ok(!app.innerHTML.includes("先认识最常见"), "vocab unit directory should keep copy concise");
includesAll(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'grammar-basics'"),
  ["reading-topic-list", "主语 + 宾语 + 动词", "A 是 B", "不是", "有 / 没有", "个语法点", "→"],
  "grammar unit topic directory"
);
includesAll(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'sentence-patterns'"),
  ["reading-topic-list", "这是…… / 那是……", "谁？什么？哪里？", "时间和日期", "个句型", "→"],
  "basic sentence unit topic directory"
);
includesAll(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'dialogue-theater'"),
  ["reading-topic-list", "早上见面", "买东西", "问路", "→"],
  "dialogue unit topic directory"
);
includesAll(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'short-stories'"),
  ["reading-topic-list", "我的一天", "去市场", "我的母语", "→"],
  "short story unit topic directory"
);
includesAll(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'famous-quotes'"),
  ["reading-topic-list", "马赫穆德·喀什噶里", "阿不都热依木·吾提库尔", "10 位", "3 条", "→"],
  "famous quote unit topic directory"
);
assert.ok(!app.innerHTML.includes("مەھمۇد قەشقىرى"), "famous quote directory should use Chinese names");
assert.ok(!app.innerHTML.includes("ئابدۇرېھىم ئۆتكۈر"), "famous quote directory should use Chinese names");
includesAll(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'uyghur-proverbs'"),
  ["reading-topic-list", "知识就是力量", "好话暖心", "10 个主题", "3 条", "→"],
  "proverb unit topic directory"
);
assert.ok(!app.innerHTML.includes("بىلىم كۈچ"), "proverb directory should use Chinese titles");
assert.ok(!app.innerHTML.includes("ياخشى سۆز"), "proverb directory should use Chinese titles");
assert.ok(!app.innerHTML.includes("看含义"), "reading unit copy should not use the removed meaning wording");

includesAll(
  renderState("state.screen = 'reading'; state.selectedReadingUnitId = 'grammar-basics'; state.selectedReadingGroupId = 'grammar-word-order'"),
  ["语法入门", "主语 + 宾语 + 动词", "grammar-pattern", "谁 + 什么 + 做什么", "مەن كىتاب ئوقۇيمەن.", "动词通常放在句末"],
  "grammar reading lesson"
);
const grammarReadingLineStyle = styleSource.match(/^\.grammar-reading-line\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(grammarReadingLineStyle.includes("background: var(--paper);"), "grammar sentence cards should use a white background");
assert.ok(!grammarReadingLineStyle.includes("linear-gradient"), "grammar sentence cards should not keep the blue gradient background");
const readingValueStyle = styleSource.match(/^\.reading-value\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(
  readingValueStyle.includes('font-family: "Times New Roman", Arial, sans-serif;') &&
    readingValueStyle.includes("font-weight: 600;"),
  "all reading sentences should use the selected Times New Roman semibold style"
);
const latinTransliterationStyle =
  styleSource.match(/^\.latin-transliteration\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
for (const declaration of [
  "color: var(--ink-soft);",
  "font-weight: 400;",
  "direction: ltr;",
  "unicode-bidi: isolate;"
]) {
  assert.ok(
    latinTransliterationStyle.includes(declaration),
    `ULY transliteration should include ${declaration}`
  );
}
assert.ok(
  /\.form-example-latin\s*\{[^}]*font-size:\s*14px;/s.test(styleSource),
  "form-example ULY should use the selected 14px visual treatment"
);
includesAll(
  renderState("state.screen = 'reading'; state.selectedReadingUnitId = 'sentence-patterns'; state.selectedReadingGroupId = 'sentence-this-that'"),
  ["基础句型", "reading-line", "بۇ قەلەم.", "Bu qelem.", "这是笔。", "بۇ كىتاب.", "Bu kitab.", "这是书。", 'dir="ltr"'],
  "basic sentence reading lesson"
);
includesAll(
  renderState("state.screen = 'reading'; state.selectedReadingUnitId = 'dialogue-theater'; state.selectedReadingGroupId = 'dialogue-greeting'"),
  ["早上见面", "reading-line", "ياخشىمۇسىز؟", "你好，你好吗？"],
  "dialogue reading lesson"
);
includesAll(
  renderState("state.screen = 'reading'; state.selectedReadingUnitId = 'short-stories'; state.selectedReadingGroupId = 'story-my-day'"),
  ["我的一天", "reading-line", "مەن ئەتىگەندە ئورنىمدىن تۇرىمەن.", "我早上起床。"],
  "short story reading lesson"
);
includesAll(
  renderState("state.screen = 'reading'; state.selectedReadingUnitId = 'famous-quotes'; state.selectedReadingGroupId = 'quote-mahmud-kashgari'"),
  ["名人名言", "人物介绍", "11 世纪", "reading-meaning", "语言是了解一个民族的钥匙。", "词典也能保存民族的记忆。", "学习语言，就是学习看世界的方法。"],
  "famous quote reading lesson"
);
assertLearnerCopyClean("famous quote reading lesson");
assert.ok(!app.innerHTML.includes("reading-lesson"), "famous quote reading lesson should not show the meaning/lesson section");
const unifiedQuoteHtml = renderState(
  "state.screen = 'reading'; state.selectedReadingUnitId = 'famous-quotes'; state.selectedReadingGroupId = 'quote-abdurehim-otkur'"
);
assert.ok(
  unifiedQuoteHtml.includes('class="uyghur reading-value">ئەسلىمە يوقالمىسا، يولمۇ يوقالمايدۇ.</div>'),
  "the affected quote should use the same reading sentence class as its neighbors"
);
assert.equal(
  (unifiedQuoteHtml.match(/class="uyghur reading-value"/g) || []).length,
  3,
  "all three quote sentences should use the same reading sentence class"
);
assert.ok(!unifiedQuoteHtml.includes("clear-medial-mim"), "the quote lesson should not use a sentence-specific font override");
includesAll(
  renderState("state.screen = 'reading'; state.selectedReadingUnitId = 'uyghur-proverbs'; state.selectedReadingGroupId = 'proverb-bilim-kuch'"),
  ["维吾尔谚语", "reading-meaning", "知识就是力量。", "学到的东西不会丢。", "不学的人，路会变窄。"],
  "proverb reading lesson"
);
assertLearnerCopyClean("proverb reading lesson");
assert.ok(!app.innerHTML.includes("reading-lesson"), "proverb reading lesson should not show the meaning/lesson section");
const unifiedProverbHtml = renderState(
  "state.screen = 'reading'; state.selectedReadingUnitId = 'uyghur-proverbs'; state.selectedReadingGroupId = 'proverb-emgek'"
);
assert.ok(
  unifiedProverbHtml.includes('class="uyghur reading-value">تېرىقماي ھوسۇل بولماس.</div>'),
  "the affected proverb should use the same reading sentence class as its neighbors"
);
assert.equal(
  (unifiedProverbHtml.match(/class="uyghur reading-value"/g) || []).length,
  3,
  "all three proverb sentences should use the same reading sentence class"
);
assert.ok(!unifiedProverbHtml.includes("clear-medial-mim"), "the proverb lesson should not use a sentence-specific font override");
assert.ok(!styleSource.includes(".reading-value.clear-medial-mim"), "reading sentences should not define a special-case font");

renderState("state.screen = 'profile'");
assert.ok(!app.innerHTML.includes("<strong>强化训练</strong>"), "profile should move practice progress into the practice tab");
assert.ok(!app.innerHTML.includes("<strong>本地错题</strong>"), "profile should move local mistakes into the practice tab");
assert.ok(!app.innerHTML.includes("录音工具"), "profile should not keep a duplicate recording tools drawer");

renderState("state.screen = 'recording'");
assert.equal(vm.runInContext("state.screen", context), "home", "removed recording state should fall back to home");
assert.ok(app.innerHTML.includes("今日进度"), "stale recording state should render home");
assert.equal(savedProgress().screen, "home", "fallback should repair persisted screen state");

includesAll(
  renderState("state.screen = 'library'"),
  ["字母库", "letter-library-grid", "32 个字母"],
  "letter library"
);
assertLearnerCopyClean("letter library");
assert.ok(!app.innerHTML.includes("word-row"), "letter library should not render a tall row for every letter");
assert.ok(!app.innerHTML.includes(">学习</button>"), "letter library should avoid repeated study buttons");
assert.equal((app.innerHTML.match(/data-action="select-letter"/g) || []).length, 32, "letter library should keep all letters directly selectable");
let lastAlphabetPosition = -1;
for (const letter of ["ئا", "ئە", "ب", "پ", "ت", "ج", "چ", "خ", "د", "ر", "ز", "ژ", "س", "ش", "غ", "ف", "ق", "ك", "گ", "ڭ", "ل", "م", "ن", "ھ", "ئو", "ئۇ", "ئۆ", "ئۈ", "ۋ", "ئې", "ئى", "ي"]) {
  const marker = `<span class="uyghur">${letter}</span>`;
  const position = app.innerHTML.indexOf(marker, lastAlphabetPosition + 1);
  assert.ok(position > lastAlphabetPosition, `letter library should place ${letter} in screenshot order`);
  lastAlphabetPosition = position;
}

clickDataset({ action: "open-vocab-group", id: "greetings" });
assert.equal(
  vm.runInContext("state.learningProgress.vocab.greetings.viewed", context),
  true,
  "opening learning content should remember it as viewed"
);
vm.runInContext(
  `
    state.learningProgress.letters["dot-bone"] = { viewed: true };
    state.learningProgress.combos["open-a"] = { viewed: true };
    state.learningProgress.practice["repeat-loop"] = { viewed: true };
    state.learningProgress.reading["sentence-this-that"] = { viewed: true };
  `,
  context
);
assert.ok(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'letters'").includes("已学"),
  "viewed alphabet content should show a learned marker"
);
assert.ok(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'combos'").includes("已学"),
  "viewed combination content should show a learned marker"
);
assert.ok(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'basic-phrases'").includes("已学"),
  "viewed vocabulary content should show a learned marker"
);
assert.ok(
  renderState("state.screen = 'library'").includes("已学"),
  "viewed practice content should show a learned marker"
);
assert.ok(
  renderState("state.screen = 'unit'; state.selectedUnitId = 'sentence-patterns'").includes("已学"),
  "viewed reading content should show a learned marker"
);

const letterLessonHtml = renderState("state.screen = 'group'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'");
includesAll(
  letterLessonHtml,
  ["1 / 3", "上一个", "下一个", "letter-focus-play", "写法例词", "4 种位置写法", "بەش", "پۇتبول", "قەلب", "找不同", "读音选择"],
  "letter lesson"
);
assertLearnerCopyClean("letter lesson");
assert.ok(letterLessonHtml.includes('class="play-dot letter-focus-play"'), "letter lesson should put the listen button in the gradient letter card");
assert.ok(letterLessonHtml.includes("./assets/audio/human/alphabet/human_letter_01_b.webm"), "letter lesson should keep the playable human audio source");
assert.ok(!letterLessonHtml.includes('<div class="audio-strip">'), "letter lesson should remove the separate pronunciation strip");
for (const hiddenAudioHint of ["可先接近理解为 b", "正式版以真人音频为准"]) {
  assert.ok(!app.innerHTML.includes(hiddenAudioHint), `letter lesson should hide internal pronunciation hint ${hiddenAudioHint}`);
}
assert.ok(!app.innerHTML.includes("先认字母，不急着学词组"), "letter lesson should replace the old point card with form examples");
clickDataset({ action: "select-adjacent-letter", id: "pe" });
assert.equal(vm.runInContext("state.currentLetterId", context), "pe", "next letter button should switch letters");

const aaLetterLessonHtml = renderState("state.screen = 'group'; state.selectedGroupId = 'vowels-basic'; state.currentLetterId = 'aa'");
includesAll(
  aaLetterLessonHtml,
  ["ئا", "独立式", "简单独立式", "前连式", "隔音前连式", "ئالما", "قارا", "خەلقئارا", "词首元音要带 ئ"],
  "aa vowel writing forms"
);
includesAll(
  aaLetterLessonHtml,
  ['class="latin-transliteration form-example-latin"', ">ana<", ">qara<", ">alma<", ">xelq'ara<"],
  "aa vowel ULY form examples"
);
assert.equal(
  (aaLetterLessonHtml.match(/class="uyghur form-example-word-text form-example-audio-word"/g) || []).length,
  4,
  "all four form example words should be playable after recording completion"
);
assert.ok(
  aaLetterLessonHtml.includes('data-audio-src="./assets/audio/human/vocab/human_vocab_ana_family.webm"') &&
    aaLetterLessonHtml.includes('aria-label="播放 ئانا"'),
  "ئانا should reuse its vocabulary recording"
);
assert.ok(
  aaLetterLessonHtml.includes('data-audio-src="./assets/audio/human/vocab/human_vocab_qara_color.webm"') &&
    aaLetterLessonHtml.includes('aria-label="播放 قارا"'),
  "قارا should reuse its vocabulary recording"
);
assert.ok(
  /<button class="uyghur form-example-word-text form-example-audio-word"[^>]*data-form-target-start="4" data-form-target-length="1"[^>]*aria-label="播放 ئالما">ئالما<\/button>/.test(
    aaLetterLessonHtml
  ),
  "playable apple example should keep one uninterrupted text node while marking its final alif range"
);
assert.ok(aaLetterLessonHtml.includes('aria-label="播放 خەلقئارا"'), "خەلقئارا should expose its dedicated recording");
assert.ok(
  !aaLetterLessonHtml.includes("form-example-target-overlay") &&
    !aaLetterLessonHtml.includes("form-example-target") &&
    appSource.includes("range.getBoundingClientRect()") &&
    appSource.includes("backgroundImage"),
  "letter form examples should color a measured range inside one shaped word without duplicate or split text"
);
assert.ok(
  /\.form-example-word-text\.is-highlight-ready\s*\{[^}]*color:\s*transparent;[^}]*background-clip:\s*text;[^}]*\}/.test(
    styleSource
  ),
  "letter form words should reveal the black and PDF-red gradient through the complete shaped text"
);
const formExampleWordTextStyle = styleSource.match(/\.form-example-word \.form-example-word-text\s*\{[^}]*\}/)?.[0] || "";
assert.ok(
  formExampleWordTextStyle.includes("font-size: 28px;") &&
    formExampleWordTextStyle.includes("font-weight: 500;") &&
    formExampleWordTextStyle.includes("color: #000;") &&
    formExampleWordTextStyle.includes('font-family: Arial, "Times New Roman",'),
  "letter form words should use the PDF-like Arial shape that keeps medial mim visible"
);
const formExampleAudioWordStyle = styleSource.match(/\.form-example-audio-word\s*\{[^}]*\}/)?.[0] || "";
assert.ok(
  formExampleAudioWordStyle.includes("cursor: pointer;") && formExampleAudioWordStyle.includes("background: transparent;"),
  "playable form example words should look like words while remaining discoverably clickable"
);
renderState("state.screen = 'group'; state.selectedGroupId = 'vowels-basic'; state.currentLetterId = 'aa'");
clickDataset({
  action: "play-audio",
  audioSrc: "./assets/audio/human/vocab/human_vocab_ana_family.webm",
  audioLabel: "ئانا"
});
await Promise.resolve();
assert.equal(toast.textContent, "ئانا：播放中", "clicking an existing form example recording should play it");
assert.ok(!aaLetterLessonHtml.includes("单独写"), "aa vowel lesson should not imply that the hamza carrier is practiced alone");

const aeLetterLessonHtml = renderState("state.screen = 'group'; state.selectedGroupId = 'vowels-basic'; state.currentLetterId = 'ae'");
includesAll(
  aeLetterLessonHtml,
  ["ئە", "独立式", "简单独立式", "前连式", "隔音前连式", "ئەدەبىيات", "رەسىم", "مەن", "مەشئەل", "词首元音要带 ئ"],
  "ae vowel writing forms"
);
assert.ok(!aeLetterLessonHtml.includes("单独写"), "ae vowel lesson should not imply that the hamza carrier is practiced alone");

const wawLetterLessonHtml = renderState("state.screen = 'group'; state.selectedGroupId = 'tail'; state.currentLetterId = 'waw'");
includesAll(wawLetterLessonHtml, ["2 种位置写法", "前连式", "ـۋ", "ۋەتەن", "مېۋە", "水果"], "waw letter form example");
assert.ok(!wawLetterLessonHtml.includes("例词待补"), "waw letter lesson should use a real final-form word");
assert.ok(!wawLetterLessonHtml.includes("入门常用词里可靠词尾例词少见，先记字形。"), "letter lesson should hide long internal form-example notes");
const wawRepeatPracticeHtml = renderState(
  "state.screen = 'practiceSession'; state.selectedPracticeGroupId = 'repeat-loop'; state.currentPracticeItemId = 'practice-repeat-waw'"
);
includesAll(
  wawRepeatPracticeHtml,
  ["human_letter_23_w_v.webm"],
  "waw repeat-practice audio"
);
const wawKeyboardPracticeHtml = renderState(
  "state.screen = 'practiceSession'; state.selectedPracticeGroupId = 'keyboard-loop'; state.currentPracticeItemId = 'practice-keyboard-waw'"
);
includesAll(
  wawKeyboardPracticeHtml,
  ["human_letter_23_w_v.webm"],
  "waw keyboard-practice audio"
);

const zheLetterLessonHtml = renderState("state.screen = 'group'; state.selectedGroupId = 'breakers'; state.currentLetterId = 'zhe'");
includesAll(zheLetterLessonHtml, ["2 种位置写法", "前连式", "ـژ", "ژۇرنال", "پارىژ", "巴黎"], "zhe letter form example");
assert.ok(!zheLetterLessonHtml.includes("例词待补"), "zhe letter lesson should use a real final-form word");
assert.ok(!zheLetterLessonHtml.includes("可靠常用词尾例词少见，先记字形。"), "letter lesson should hide zhe internal form-example notes");

const ngLetterLessonHtml = renderState("state.screen = 'group'; state.selectedGroupId = 'k-family'; state.currentLetterId = 'ng'");
includesAll(
  ngLetterLessonHtml,
  ["4 种位置写法", "后连式", "ڭـ", "يەڭ", "ياڭاق", "يىڭنە", "مىڭ"],
  "ng letter form examples"
);
assert.ok(!ngLetterLessonHtml.includes("例词待补"), "ng initial exception should not look like a missing example");
assert.ok(!ngLetterLessonHtml.includes("先记字形"), "ng initial exception should not look like a missing example placeholder");
assert.ok(!ngLetterLessonHtml.includes("现代维语常用词中不作词首。"), "ng initial exception should hide the internal data note");

const oeLetterLessonHtml = renderState("state.screen = 'group'; state.selectedGroupId = 'vowels-round'; state.currentLetterId = 'oe'");
includesAll(
  oeLetterLessonHtml,
  ["4 种位置写法", "简单独立式", "前连式", "隔音前连式", "دۆلەت", "ئۆي", "تۆگە"],
  "oe letter final-position rarity"
);
assert.ok(!oeLetterLessonHtml.includes("例词待补"), "oe final rarity should not look like a missing example");
assert.ok(!oeLetterLessonHtml.includes("先记字形"), "oe final rarity should not look like a missing example placeholder");
assert.ok(!oeLetterLessonHtml.includes("入门常用词里可靠词尾例词少见，先记字形。"), "oe final rarity should hide the internal data note");

const eeLetterLessonHtml = renderState("state.screen = 'group'; state.selectedGroupId = 'tail'; state.currentLetterId = 'ee'");
includesAll(
  eeLetterLessonHtml,
  [
    "ئې",
    "8 种位置写法",
    "简单独立式",
    "简单后连式",
    "隔音双连式",
    "隔音前连式",
    "ئې چيەنچيۇ",
    "چېڭدې",
    "ئېتىز",
    "دېڭىز",
    "تېز",
    "مۈشۈكئېيىق",
    "چاڭجياجې",
    "چاڭئې"
  ],
  "ee complete writing forms"
);
assert.ok(eeLetterLessonHtml.includes("ئې"), "ee standalone display should use the standard ئې spelling");
assert.ok(!eeLetterLessonHtml.includes("ئ\u200cې"), "ee standalone display should not split the letter with a non-joining character");
assert.ok(!eeLetterLessonHtml.includes("ئي"), "ee letter should not use the i-shaped carrier spelling");
assert.ok(!eeLetterLessonHtml.includes("原表未列例词"), "verified supplemental words should replace the old PDF placeholder");

const savedEeSeparatedMedialExample = vm.runInContext("JSON.stringify(letterDetails.ee.formExamples[5])", context);
vm.runInContext(
  `letterDetails.ee.formExamples[5] = { label: "隔音双连式", form: "ـئېـ", word: "" }`,
  context
);
const noExampleLetterLessonHtml = renderState(
  "state.screen = 'group'; state.selectedGroupId = 'tail'; state.currentLetterId = 'ee'"
);
assert.ok(
  noExampleLetterLessonHtml.includes('<small class="form-example-empty">无例词</small>'),
  "a writing position without a verified word should show the compact 无例词 fallback"
);
const formExampleEmptyStyle = styleSource.match(/\.form-example-word \.form-example-empty\s*\{[^}]*\}/)?.[0] || "";
assert.ok(
  formExampleEmptyStyle.includes("font-size: 13px;"),
  "the 无例词 fallback should stay visibly smaller than a 28px example word"
);
vm.runInContext(`letterDetails.ee.formExamples[5] = ${savedEeSeparatedMedialExample}`, context);

const letterOddHtml = renderState("state.screen = 'letterOdd'; state.selectedGroupId = 'vowels-basic'; state.currentLetterId = 'aa'; state.selectedPicture = ''");
const letterOddChoiceGrid = letterOddHtml.match(/<div class="choice-grid">[\s\S]*?<\/div>/)?.[0] || "";
includesAll(
  letterOddHtml,
  ["找不同", "目标 ئا", "ئ + ە"],
  "letter odd-one-out exercise"
);
includesAll(letterOddChoiceGrid, ["ئا", "ئە", "选择"], "letter odd-one-out choice labels");
for (const answerHint of ["ئ + ا", "ئ + ە", "元音，a", "元音，e"]) {
  assert.ok(!letterOddChoiceGrid.includes(answerHint), `letter odd-one-out options should hide answer hint ${answerHint}`);
}
clickDataset({ action: "pick-letter-odd", id: "ae" });
includesAll(app.innerHTML, ["找对了", "ئە"], "correct odd-one-out feedback");

const listeningPracticeHtml = renderState("state.screen = 'listening'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'; state.selectedListening = ''");
includesAll(
  listeningPracticeHtml,
  ["听音选择", "audio-focus", "letter-focus-play", "./assets/audio/human/alphabet/human_letter_01_b.webm"],
  "letter listening audio focus"
);
assert.ok(!listeningPracticeHtml.includes('<div class="audio-strip">'), "letter listening should put the listen button in the gradient card");
assert.ok(!listeningPracticeHtml.includes("播放：b"), "letter listening should not reveal the latin answer before choosing");

const letterSoundChoiceHtml = renderState(
  "state.screen = 'letterSound'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'; state.selectedListening = ''; state.mistakes = []"
);
includesAll(
  letterSoundChoiceHtml,
  ["读音选择", "选择正确字母", "b", "audio-focus", "letter-focus-play"],
  "letter sound-choice exercise"
);
assert.ok(!app.innerHTML.includes('<div class="audio-strip">'), "letter sound-choice should put the listen button in the gradient card");
const letterSoundChoiceGrid = letterSoundChoiceHtml.match(/<div class="choice-grid">([\s\S]*?)<\/div>\s*<button class="primary-button"/)?.[1] || "";
assert.equal(
  (letterSoundChoiceGrid.match(/class="choice-card letter-only-choice"/g) || []).length,
  3,
  "sound-choice options should render every group letter as a letter-only button"
);
assert.equal(
  (letterSoundChoiceGrid.match(/class="choice-art uyghur"/g) || []).length,
  3,
  "sound-choice options should keep all three visible letters"
);
for (const hiddenAnswer of ["<strong>", "class=\"caption\"", "class=\"step-state\"", ">选择<", "下方一个点", "下方三个点", "上方两个点"]) {
  assert.ok(!letterSoundChoiceGrid.includes(hiddenAnswer), `sound-choice options should hide answer hint ${hiddenAnswer}`);
}
clickDataset({ action: "pick-letter-sound", id: "pe" });
includesAll(app.innerHTML, ["目标是 ب", "你选了 پ"], "letter sound-choice mistake feedback");
assert.equal(vm.runInContext("state.mistakes[0].targetId", context), "be", "sound-choice mistake should enter review");

includesAll(
  renderState("state.screen = 'combo'; state.selectedComboGroupId = 'open-a'; state.currentComboItemId = 'ba'"),
  ["1 / 10", "上一个", "下一个", "letter-focus-play", "从右往左", "拆开看", "实际连写形", "بـ", "后连式写法", "ـا", "前连式写法", "接后一个字母", "接前一个字母", "拼接", "书写", "键盘", 'class="latin-transliteration combo-latin"', ">ba<"],
  "combo lesson"
);
assert.ok(!app.innerHTML.includes("本组目标"), "combo lesson should remove the optional group goal card");
assert.ok(!app.innerHTML.includes('<div class="audio-strip">'), "combo lesson should put the listen button in the gradient card");
clickDataset({ action: "select-adjacent-combo", id: "pa" });
assert.equal(vm.runInContext("state.currentComboItemId", context), "pa", "next combo button should switch combos");

includesAll(
  renderState("state.screen = 'combo'; state.selectedComboGroupId = 'connection-breaks'; state.currentComboItemId = 'dada-connection'"),
  ["第二单元：基础组合", "连接会断开的字母", "1 / 6", "دادا", "拆开看", "实际连写形", "独立式写法", "在词首位置，但这个字母后面通常不继续连接", "不接前一个字母，后面也断开"],
  "connection lesson"
);
assert.ok(!app.innerHTML.includes("第三单元：字母连接规律"), "connection groups should render inside the second unit");

includesAll(
  renderState("state.screen = 'comboBuild'; state.selectedComboGroupId = 'open-a'; state.currentComboItemId = 'ba'; state.keyboardValue = ''"),
  ["组合拼接", "ب + ا", "当前拼接"],
  "combo build exercise"
);
clickDataset({ action: "build-part", key: "ب" });
clickDataset({ action: "build-part", key: "ا" });
includesAll(app.innerHTML, ["拼接正确", "با"], "combo build success feedback");
assert.equal(savedProgress().learningProgress.combos["open-a"].completed, true, "combo build completion should be saved locally");

includesAll(
  renderState("state.screen = 'vocab'; state.selectedVocabGroupId = 'family'; state.currentVocabItemId = 'ana-family'"),
  ["第三单元：日常用语与词汇", "本课词汇", "vocab-subgroup", "ئانا", 'class="latin-transliteration vocab-latin"', ">ana<", "妈妈、母亲", "点维语词播放；点右侧解释选择词"],
  "vocab lesson"
);
assertLearnerCopyClean("vocab lesson");
assert.ok(
  !renderState("state.screen = 'vocab'").includes("进入审校模式"),
  "learner vocabulary screen should not expose audit mode"
);
assert.ok(!app.innerHTML.includes("letter-focus"), "vocab lesson should not use the old large focus card");
assert.ok(!app.innerHTML.includes("中文预览"), "vocab lesson should avoid repeated explanation cards");
assert.ok(!app.innerHTML.includes("点一行选择词"), "vocab lesson should not keep the old row-click instruction");
const audioVocabHtml = renderState("state.screen = 'vocab'; state.selectedVocabGroupId = 'greetings'; state.currentVocabItemId = 'yaxshimusiz'");
includesAll(
  audioVocabHtml,
  ['audio-word-button uyghur', 'data-action="play-audio"', 'data-audio-label="ياخشىمۇسىز"', "./assets/audio/human/vocab/human_vocab_yaxshimusiz.webm"],
  "clickable audio vocabulary word"
);
clickDataset({ action: "play-audio", audioSrc: "./assets/audio/human/vocab/human_vocab_yaxshimusiz.webm", audioLabel: "ياخشىمۇسىز" });
await Promise.resolve();
assert.equal(toast.textContent, "ياخشىمۇسىز：播放中", "clicking an audio vocabulary word should play it");

includesAll(
  renderState("state.screen = 'vocab'; state.selectedVocabGroupId = 'numbers'; state.currentVocabItemId = 'one'"),
  ["1-10", "整十数", "大数", "يىگىرمە", "ئون مىڭ", "يۈز مىليون"],
  "number vocabulary sections"
);
assert.ok(!app.innerHTML.includes("11-20"), "number vocabulary should not show the removed 11-20 section");
includesAll(
  renderState("state.screen = 'vocab'; state.selectedVocabGroupId = 'time'; state.currentVocabItemId = 'bugun'"),
  ["基础时间", "星期", "月份", "دۈشەنبە", "يانۋار"],
  "time vocabulary sections"
);
assert.ok(!app.innerHTML.includes("词库审校字段"), "learning mode should hide audit-only vocabulary fields");
clickDataset({ action: "select-adjacent-vocab", id: "apa-family" });
assert.equal(vm.runInContext("state.currentVocabItemId", context), "apa-family", "next vocab button should switch words");

renderState("state.screen = 'picture'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'");
clickDataset({ action: "pick-picture", id: "pe" });
let mistakeSummary = vm.runInContext("state.mistakes.map((item) => item.targetId).join(',')", context);
assert.equal(mistakeSummary, "be", "wrong letter choice should create a review item");
includesAll(
  app.innerHTML,
  ["目标是 ب", "你选了 پ", "下方一个点", "下方三个点"],
  "letter mistake explanation"
);
renderState("state.screen = 'letterSound'; state.selectedGroupId = 'vowels-basic'; state.currentLetterId = 'aa'; state.selectedListening = ''");
clickDataset({ action: "pick-letter-sound", id: "ae" });
const reviewMistakeIds = vm.runInContext("mistakeReviewItems().map((item) => item.id)", context);
assert.equal(reviewMistakeIds.length, 2, "review practice should automatically collect previous learning mistakes");
includesAll(
  renderState(`state.screen = 'practiceSession'; state.selectedPracticeGroupId = 'review-loop'; state.currentPracticeItemId = '${reviewMistakeIds[1]}'`),
  ["本轮错题", "ب", "目标是 ب", "看下方点数", "上一个", "下一个", "letter-focus-play"],
  "dynamic mistake review"
);
assert.equal((app.innerHTML.match(/data-action="play-audio"/g) || []).length, 1, "mistake review should keep one listen button in the gradient target card");
assert.ok(!app.innerHTML.includes("audio-focus"), "mistake review should not show a separate audio strip below the target card");
clickDataset({ action: "select-practice", id: reviewMistakeIds[0] });
assert.equal(vm.runInContext("state.currentPracticeItemId", context), reviewMistakeIds[0], "mistake review should switch to another saved mistake");
includesAll(app.innerHTML, ["ئا", "目标是 ئا", "你选了 ئە"], "dynamic mistake review next item");

renderState("state.screen = 'letterWriting'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'");
includesAll(
  app.innerHTML,
  ["书写步骤", "writing-canvas", "清空画布", "起笔", "方向", "对比正确写法", "完成后评价", "点位正确"],
  "letter writing coach"
);
clickDataset({ action: "toggle-writing-check", id: "dots" });
includesAll(app.innerHTML, ["自查完成 1 / 3"], "letter writing self check");
clickDataset({ action: "go", target: "picture" });
clickDataset({ action: "pick-picture", id: "be" });
clickDataset({ action: "go", target: "listening" });
clickDataset({ action: "pick-listening", id: "be" });
clickDataset({ action: "go", target: "keyboard" });
includesAll(app.innerHTML, ["键盘步骤", "第 1 步", "点击 ب", "还差 1 键"], "letter keyboard guide");
clickDataset({ action: "key", key: "ب" });
includesAll(app.innerHTML, ["已完成", "完成课程"], "completed letter keyboard guide");
clickDataset({ action: "go", target: "complete" });
includesAll(app.innerHTML, ["课程完成", "第一单元完成", "4 / 4", "完成进度"], "completed letter progress");
assert.ok(!app.innerHTML.includes("学习闭环"), "completed letter page should remove the learning-loop card");
assert.ok(!app.innerHTML.includes("闭环完成"), "completed letter page should not show the old loop completion title");
assert.equal(savedProgress().learningProgress.letters["dot-bone"].completed, true, "completed loop should be saved locally");
assert.equal(savedProgress().mistakes.length, 2, "mistakes should be saved locally");

includesAll(
  renderState("state.screen = 'complete'"),
  ["下一步建议", "复习本组", "进入第二单元"],
  "unit one complete"
);
assert.ok(app.innerHTML.includes("ب / پ"), "unit one completion should separate learned letters with punctuation");

const comboCompleteHtml = renderState("state.screen = 'comboComplete'");
includesAll(
  comboCompleteHtml,
  ["下一步建议", "复习组合", "进入第三单元"],
  "unit two complete"
);
assert.ok(comboCompleteHtml.includes("با / پا"), "unit two completion should separate learned combinations with punctuation");
assert.ok(
  !comboCompleteHtml.includes("如果这一组有词义，它仍然需要母语者审校后才能进入正式考核。"),
  "unit two completion should not expose the internal review requirement"
);
assert.ok(
  !comboCompleteHtml.includes("<strong>审校</strong><span>词义</span>"),
  "unit two completion metrics should use neutral learning feedback"
);
includesAll(
  comboCompleteHtml,
  [
    "你拆分并输入了 با。继续复习这一组，熟悉字母连接和断开规律。",
    "<strong>词形</strong><span>理解</span>"
  ],
  "unit two neutral completion feedback"
);

includesAll(
  renderState("state.screen = 'comboWriting'; state.selectedComboGroupId = 'open-a'; state.currentComboItemId = 'ba'"),
  ["组合书写", "目标组合", "writing-canvas", "清空画布", "继续键盘"],
  "combo writing canvas"
);
assert.ok(!app.innerHTML.includes("本组目标"), "combo writing should not bring back the group goal card");
clickDataset({ action: "go", target: "comboKeyboard" });
assert.equal(savedProgress().learningProgress.combos["open-a"].writing, true, "combo writing completion should be saved locally");

includesAll(
  renderState("state.screen = 'comboKeyboard'; state.selectedComboGroupId = 'open-a'; state.currentComboItemId = 'ba'; state.keyboardValue = ''"),
  ["键盘步骤", "ب → ا", "点击 ب", "还差 2 键"],
  "combo keyboard guide"
);
clickDataset({ action: "key", key: "ب" });
includesAll(app.innerHTML, ["第 2 步", "点击 ا", "已输入 ب"], "combo keyboard guide after first key");

includesAll(
  renderState("state.screen = 'vocabKeyboard'; state.selectedVocabGroupId = 'family'; state.currentVocabItemId = 'ana-family'; state.keyboardValue = ''"),
  ["键盘步骤", "ئا → ن → ا", "点击 ئا", "还差 3 键"],
  "vocab keyboard guide"
);

vm.runInContext("Math.random = () => 0.5; state.learningProgress.practice = {}; state.selectedPracticeGroupId = 'keyboard-loop';", context);
clickDataset({ action: "open-practice-group", id: "listening-loop" });
const randomListeningTargetId = vm.runInContext("state.currentPracticeItemId", context);
const expectedRandomListeningTargetId = vm.runInContext(
  "practiceGroups.find((group) => group.id === 'listening-loop').items[Math.floor(0.5 * 32)].id",
  context
);
assert.equal(randomListeningTargetId, expectedRandomListeningTargetId, "practice listening should start from a random letter audio");

includesAll(app.innerHTML, ["真人音频", "听音后，从 32 个字母里选择正确字母", "audio-focus", "letter-focus-play", "0 / 32"], "practice listening lesson");
assert.ok(!app.innerHTML.includes('<div class="audio-strip">'), "practice listening should put the listen button in the gradient card");
assert.ok(!app.innerHTML.includes("听音流程"), "practice listening should remove the extra listening flow card");
assert.ok(!app.innerHTML.includes("先播放音频"), "practice listening should remove the extra pre-audio instruction card");
assert.ok(!app.innerHTML.includes("播放：b"), "practice listening should not reveal latin in the audio title before choosing");
assert.ok(!app.innerHTML.includes("human_practice_listen_be"), "practice listening should not use duplicate practice audio");
assert.ok(!app.innerHTML.includes('class="play-dot disabled"'), "practice listening should enable connected audio");
assert.ok(!app.innerHTML.includes("practice-target-card"), "practice listening should not reveal the correct letter before choosing");
assert.ok(!app.innerHTML.includes('data-action="pick-practice"'), "practice listening should wait for audio before showing choices");
clickDataset({ action: "play-audio", audioSrc: "./assets/audio/human/alphabet/human_letter_01_b.webm", audioLabel: "听音练习" });
assert.equal(vm.runInContext("state.practiceAudioPlayed", context), true, "practice listening should open choices after connected audio plays");
assert.equal(vm.runInContext("state.selectedListening", context), "", "practice listening should not answer automatically after audio playback");
assert.equal(savedProgress().learningProgress.practice["listening-loop"]?.completed, undefined, "practice listening should not save progress before choosing correctly");
assert.equal((app.innerHTML.match(/data-action="pick-practice"/g) || []).length, 32, "practice listening should support choices after connected audio is played");
assert.ok(!app.innerHTML.includes("practice-target-card"), "practice listening should still hide the answer before choosing");
const wrongListeningChoiceId = vm.runInContext("currentPracticeItems().find((item) => item.id !== state.currentPracticeItemId).id", context);
clickDataset({ action: "pick-practice", id: wrongListeningChoiceId });
assert.equal(vm.runInContext("state.selectedListening", context), wrongListeningChoiceId, "practice listening should store a wrong picked letter");
assert.equal(vm.runInContext("state.mistakes[0].targetId", context), randomListeningTargetId, "wrong practice listening choice should enter local mistakes");
assert.ok(!app.innerHTML.includes("practice-target-card"), "practice listening should still hide the answer after a wrong choice");
assert.ok(app.innerHTML.includes("再听一次，再选。"), "practice listening should ask the learner to retry after a wrong choice");
clickDataset({ action: "pick-practice", id: randomListeningTargetId });
assert.equal(savedProgress().learningProgress.practice["listening-loop"].completed, undefined, "practice listening should not complete the whole 32-letter round after one correct answer");
assert.deepEqual(
  savedProgress().learningProgress.practice["listening-loop"].listenCompletedIds,
  [randomListeningTargetId],
  "practice listening should save the completed letter audio"
);
includesAll(app.innerHTML, ["辨认正确", "1 / 32", "下一个音频"], "practice listening correct answer");
assert.ok(app.innerHTML.includes("practice-target-card"), "practice listening should reveal the correct letter after the correct choice");
vm.runInContext("Math.random = () => 0;", context);
clickDataset({ action: "next-practice-audio" });
assert.notEqual(vm.runInContext("state.currentPracticeItemId", context), randomListeningTargetId, "next practice audio should choose an uncompleted letter");
assert.equal(vm.runInContext("state.practiceAudioPlayed", context), false, "next practice audio should require playing the new sound before choices appear");
assert.equal(vm.runInContext("state.selectedListening", context), "", "next practice audio should clear the previous answer");

includesAll(
  renderState("state.screen = 'practiceSession'; state.selectedPracticeGroupId = 'repeat-loop'; state.currentPracticeItemId = 'practice-repeat-aa'"),
  ["跟读步骤", "看词形", "看提示", "轻声跟读", "letter-focus-play"],
  "practice repeat lesson"
);
assert.ok(!app.innerHTML.includes('<div class="audio-strip">'), "practice repeat should put the listen button in the gradient card");
for (const removedPhrase of ["我已跟读", "跟读不评分", "练习中心", "查看结果"]) {
  assert.ok(!app.innerHTML.includes(removedPhrase), `practice repeat lesson should remove ${removedPhrase}`);
}

includesAll(
  renderState("state.screen = 'practiceSession'; state.selectedPracticeGroupId = 'writing-loop'; state.currentPracticeItemId = 'practice-write-be'; state.keyboardValue = ''"),
  ["手写板", "writing-canvas", "清空画布"],
  "practice writing canvas"
);
assert.ok(!app.innerHTML.includes("practice-target-card"), "practice writing entry should remove the duplicate target card");
assert.ok(!app.innerHTML.includes('data-action="play-audio"'), "practice writing entry should remove the duplicate audio strip");
assert.ok(!app.innerHTML.includes("播放：b"), "practice writing entry should not show the duplicate audio title");
assert.ok(!app.innerHTML.includes("写完后可以清空重写"), "practice writing entry should remove the extra completion hint");
assert.ok(!app.innerHTML.includes("键盘步骤"), "practice writing entry should not show keyboard steps");
assert.ok(!app.innerHTML.includes("对比正确写法"), "practice writing entry should remove the duplicate comparison card");
assert.ok(!app.innerHTML.includes("完成后评价"), "practice writing entry should remove the duplicate self-check card");
clickDataset({ action: "go", target: "practiceComplete" });
assert.equal(savedProgress().learningProgress.practice["writing-loop"].completed, true, "practice writing should complete from the result action");

includesAll(
  renderState("state.screen = 'practiceSession'; state.selectedPracticeGroupId = 'keyboard-loop'; state.currentPracticeItemId = 'practice-keyboard-kaf'; state.keyboardValue = ''; state.mistakes = []"),
  ["随机字母键盘", "键盘工具", "practice-target-card", "letter-focus-play", "data-key=\"ك\"", "删除", "清空"],
  "practice random keyboard"
);
assert.equal((app.innerHTML.match(/data-action="play-audio"/g) || []).length, 1, "practice keyboard should keep one listen button in the gradient target card");
assert.ok(!app.innerHTML.includes("audio-focus"), "practice keyboard should not show a separate audio strip below the target card");
assert.equal((app.innerHTML.match(/data-action="key"/g) || []).length, 25, "practice keyboard should show 25 random letter keys");
for (const removedPhrase of ["键盘步骤", "点击 ك", "还差 1 键", "当前复习项快捷键", "next-key", "done-key", "提示："]) {
  assert.ok(!app.innerHTML.includes(removedPhrase), `practice random keyboard should remove ${removedPhrase}`);
}
clickDataset({ action: "key", key: "ب" });
assert.equal(vm.runInContext("state.mistakes.length", context), 1, "wrong practice keyboard key should enter local mistakes");
assert.equal(vm.runInContext("state.mistakes[0].targetId", context), "practice-keyboard-kaf", "practice keyboard mistake should track the target item");
assert.ok(!app.innerHTML.includes("未完成，请删除后重试。"), "practice random keyboard should not show wrong-input feedback");
renderState("state.screen = 'practiceSession'; state.selectedPracticeGroupId = 'keyboard-loop'; state.currentPracticeItemId = 'practice-keyboard-kaf'; state.keyboardValue = 'ك'");
assert.ok(!app.innerHTML.includes("输入正确。本轮键盘练习完成。"), "practice random keyboard should not show correct-input feedback");
assert.ok(!app.innerHTML.includes("对比正确写法"), "practice keyboard entry should not show writing comparison");
assert.ok(!app.innerHTML.includes("完成后评价"), "practice keyboard entry should not show writing self-check");

includesAll(
  renderState("state.screen = 'vocabComplete'"),
  ["下一步建议", "复习主题词", "进入第四单元"],
  "unit three vocabulary complete"
);

includesAll(
  renderState("state.screen = 'practiceComplete'"),
  ["下一步建议", "再练一轮", "返回字母练习"],
  "letter practice complete"
);

console.log("unit learning experience checks passed");
