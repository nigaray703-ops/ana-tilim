import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const indexHtml = fs.readFileSync("prototype/index.html", "utf8");
const courseDataGuidePath = "课程/00-课程数据编辑与审校说明.md";
const courseDataIntegrityTestPath = "tests/course-data-integrity.test.mjs";
const projectCheckScriptPath = "scripts/check-project.mjs";
const courseDataAggregatorPath = "prototype/course-data.js";
const unitOrderPath = "prototype/unit-order.js";
const uyghurKeyboardPath = "prototype/uyghur-keyboard.js";
const latinKeyboardPath = "prototype/latin-keyboard.js";
const courseDataScriptPaths = [
  "prototype/uly-transliteration.js",
  "prototype/course-data/alphabet-data.js",
  "prototype/course-data/latin-writing-data.js",
  "prototype/course-data/combo-data.js",
  "prototype/course-data/syllable-data.js",
  "prototype/course-data/vocab-data.js",
  "prototype/course-data/practice-data.js",
  "prototype/course-data/reading-data.js",
  "prototype/course-data/afanti-data.js",
  "prototype/course-data/afanti-english-data.js",
  "prototype/afanti-content.js"
];
assert.ok(fs.existsSync(courseDataAggregatorPath), "course data aggregator should exist");
assert.ok(fs.existsSync(unitOrderPath), "edition-aware unit order module should exist");
assert.ok(fs.existsSync(uyghurKeyboardPath), "focused Uyghur keyboard mapping module should exist");
assert.ok(fs.existsSync(latinKeyboardPath), "focused Latin keyboard module should exist");
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
const bottomNavSource = appSource.slice(
  appSource.indexOf("function bottomNav"),
  appSource.indexOf("function iconHome")
);
assert.deepEqual(
  [...bottomNavSource.matchAll(/\["([^"]+)", "([^"]+)"/g)].map((match) => match.slice(1, 3)),
  [["home", "首页"], ["library", "字母"], ["learn", "学习"], ["profile", "我的"]],
  "bottom navigation should expose exactly the four final learner destinations in order"
);

assert.ok(!styleSource.includes("data-font-size"), "removed font-size mode should not leave unreachable CSS");
assert.ok(!appSource.includes("set-font-size"), "removed font-size mode should not leave an action handler");

const expectedVersionedAssets = [
  "./styles.css?v=20260809-syllable-sentences",
  "./app-config.js?v=20260808-editions",
  "./uly-transliteration.js?v=20260728-uly-transliteration",
  "./course-data/alphabet-data.js?v=20260728-uly-transliteration",
  "./course-data/latin-writing-data.js?v=20260809-latin-writing",
  "./course-data/combo-data.js?v=20260728-uly-transliteration",
  "./course-data/syllable-data.js?v=20260809-plan3-final-content",
  "./course-data/vocab-data.js?v=20260728-uly-transliteration",
  "./course-data/practice-data.js?v=20260728-learned-markers",
  "./course-data/reading-data.js?v=20260728-uly-transliteration",
  "./course-data/afanti-data.js?v=20260810-reviewed-afanti",
  "./course-data/afanti-english-data.js?v=20260810-reviewed-afanti",
  "./afanti-content.js?v=20260810-reviewed-afanti",
  "./course-data.js?v=20260810-reviewed-afanti",
  "./uyghur-keyboard.js?v=20260809-phone-morphemes",
  "./latin-keyboard.js?v=20260809-latin-qwerty",
  "./sentence-morphemes.js?v=20260809-word-formation",
  "./sentence-glossary.js?v=20260809-word-formation",
  "./progress-transfer.js?v=20260809-syllable-review",
  "./audio-controller.js?v=20260728-uly-transliteration",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.8",
  "./cloud-config.js?v=20260728-cloud-sync",
  "./cloud-sync.js?v=20260809-syllable-review",
  "./app.js?v=20260809-plan3-stage-guard"
];
const versionedAppAssets = [
  ...indexHtml.matchAll(
    /(?:href|src)="(?<url>(?:\.\/(?:styles\.css|app-config\.js|uly-transliteration\.js|course-data\/[^"]+\.js|course-data\.js|afanti-content\.js|uyghur-keyboard\.js|latin-keyboard\.js|sentence-morphemes\.js|sentence-glossary\.js|progress-transfer\.js|audio-controller\.js|cloud-config\.js|cloud-sync\.js|app\.js)[^"]*|https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\.110\.8))"/g
  )
].map((match) => match.groups.url);
assert.deepEqual(
  versionedAppAssets,
  expectedVersionedAssets,
  "every prototype CSS, course-data, audio controller, and app asset should use its reviewed release cache version"
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
  "window.ANA_TILIM_READING",
  "window.ANA_TILIM_AFANTI_DATA",
  "window.ANA_TILIM_AFANTI_CONTENT"
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
const desktopWelcomeStyle = tabletMedia.match(/\.hero-content\.with-auth\s*\{(?<body>[^}]*)\}/)?.groups?.body || "";
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
  "prototype/app-config.js",
  ...courseDataScriptPaths,
  courseDataAggregatorPath,
  uyghurKeyboardPath,
  latinKeyboardPath,
  "prototype/sentence-glossary.js",
  "prototype/progress-transfer.js",
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
  const classes = new Set();
  const attributes = {};
  return {
    id,
    innerHTML: "",
    textContent: "",
    dataset: {},
    hidden: false,
    attributes,
    classList: {
      add(...names) { names.forEach((name) => classes.add(name)); },
      remove(...names) { names.forEach((name) => classes.delete(name)); },
      toggle(name, force) {
        const shouldAdd = force === undefined ? !classes.has(name) : Boolean(force);
        if (shouldAdd) classes.add(name);
        else classes.delete(name);
        return shouldAdd;
      },
      contains(name) { return classes.has(name); }
    },
    setAttribute(name, value) {
      attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null;
    },
    querySelector() {
      return null;
    },
    closest() {
      return null;
    },
    addEventListener() {}
  };
}

function makeWritingCanvas({ contextAvailable = true } = {}) {
  const listeners = {};
  const calls = [];
  const attributes = {};
  const drawingContext = {
    setTransform(...args) { calls.push(["setTransform", ...args]); },
    beginPath() { calls.push(["beginPath"]); },
    moveTo(...args) { calls.push(["moveTo", ...args]); },
    lineTo(...args) { calls.push(["lineTo", ...args]); },
    stroke() { calls.push(["stroke"]); },
    closePath() { calls.push(["closePath"]); },
    clearRect(...args) { calls.push(["clearRect", ...args]); }
  };
  const canvas = {
    dataset: { writingFallbackId: "latin-dictation-canvas-fallback" },
    hidden: false,
    width: 640,
    height: 360,
    listeners,
    calls,
    getContext(type) {
      assert.equal(type, "2d");
      return contextAvailable ? drawingContext : null;
    },
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 320, height: 180 };
    },
    addEventListener(eventName, handler) {
      listeners[eventName] = handler;
    },
    setAttribute(name, value) {
      attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null;
    },
    setPointerCapture() {},
    releasePointerCapture() {}
  };
  return canvas;
}

const app = makeElement("app");
let appHtmlValue = "";
let appHtmlWriteCount = 0;
Object.defineProperty(app, "innerHTML", {
  configurable: true,
  get() { return appHtmlValue; },
  set(value) {
    appHtmlValue = String(value);
    appHtmlWriteCount += 1;
  }
});
const toast = makeElement("toast");
const latinDictationAnswerRegion = makeElement("latin-dictation-answer-region");
latinDictationAnswerRegion.hidden = true;
const latinDictationCanvasFallback = makeElement("latin-dictation-canvas-fallback");
latinDictationCanvasFallback.hidden = true;
const latinWritingReferenceGlyph = makeElement("latin-writing-reference-glyph");
const latinWritingPanel = makeElement("latin-writing-panel");
const latinWritingGuide = makeElement("latin-writing-guide");
const latinWritingReferenceLabel = makeElement("latin-writing-reference-label");
const latinWritingFormCount = makeElement("latin-writing-form-count");
const latinWritingPad = makeElement("latin-writing-pad");
const latinWritingGuideToggle = makeElement("latin-writing-guide-toggle");
const latinWritingComparisonRegion = makeElement("latin-writing-comparison-region");
latinWritingComparisonRegion.hidden = true;
const latinWritingCanvasFallback = makeElement("latin-writing-canvas-fallback");
latinWritingCanvasFallback.hidden = true;
let latinWritingFormTabsForTest = [];
let latinWritingCanvasOnlyForTest = [];
let writingCanvasesForTest = [];
let clickHandler = null;
let keydownHandler = null;
let changeHandler = null;
const storage = {};
const sessionStorageValues = {};
let storageWritesFail = false;
let storageWriteFailurePredicate = null;
let progressStorageWriteCount = 0;
const playedAudioSources = [];
let audioPlayShouldReject = false;
let profileDisplayNameValue = "";
let profileDisplayNameFocused = false;
let authPanelToggleFocused = false;
let focusedSyllableSelector = "";
const context = {
  console,
  document: {
    querySelector(selector) {
      if (selector === "#app") return app;
      if (selector === "#toast") return toast;
      if (selector === '[data-action="toggle-auth-panel"]') {
        return {
          focus() {
            authPanelToggleFocused = true;
          }
        };
      }
      if (selector === "#profile-display-name") {
        return {
          get value() {
            return profileDisplayNameValue;
          },
          focus() {
            profileDisplayNameFocused = true;
          }
        };
      }
      if (
        [
          '[data-action="pick-syllable-rule-answer"][data-answer-id="answer"]',
          '[data-action="pick-syllable-rule-answer"][data-answer-id="distractor"]',
          '[data-action="pick-syllable-connection-answer"][data-answer-id="statement-correct"]',
          '[data-action="pick-syllable-connection-answer"][data-answer-id="statement-incorrect"]',
          "[data-syllable-feedback]",
          "[data-syllable-question]",
          "[data-syllable-connection-feedback]",
          "[data-syllable-connection-question]",
          "[data-syllable-review-empty]",
          '[data-syllable-review-bucket="connection"]',
          '[data-syllable-review-bucket="break"]'
        ].includes(selector)
      ) {
        return {
          focus() {
            focusedSyllableSelector = selector;
          }
        };
      }
      if (selector === "[data-latin-dictation-answer-region]") {
        return latinDictationAnswerRegion;
      }
      if (selector === "#latin-dictation-canvas-fallback") {
        return latinDictationCanvasFallback;
      }
      if (selector === "[data-latin-writing-reference-glyph]") return latinWritingReferenceGlyph;
      if (selector === "[data-latin-writing-panel]") return latinWritingPanel;
      if (selector === "[data-latin-writing-guide]") return latinWritingGuide;
      if (selector === "[data-latin-writing-reference-label]") return latinWritingReferenceLabel;
      if (selector === "[data-latin-writing-form-count]") return latinWritingFormCount;
      if (selector === "[data-latin-writing-pad]") return latinWritingPad;
      if (selector === "[data-latin-writing-guide-toggle]") return latinWritingGuideToggle;
      if (selector === "[data-latin-writing-comparison-region]") return latinWritingComparisonRegion;
      if (selector === "[data-latin-writing-canvas]") return writingCanvasesForTest[0] || null;
      if (selector === "#latin-writing-canvas-fallback") return latinWritingCanvasFallback;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === "[data-writing-canvas]") return writingCanvasesForTest;
      if (selector === "[data-latin-writing-form-tab]") return latinWritingFormTabsForTest;
      if (selector === "[data-latin-writing-canvas-only]") return latinWritingCanvasOnlyForTest;
      return [];
    },
    addEventListener(eventName, handler) {
      if (eventName === "click") {
        clickHandler = handler;
      }
      if (eventName === "keydown") {
        keydownHandler = handler;
      }
      if (eventName === "change") {
        changeHandler = handler;
      }
    }
  },
  window: {
    setTimeout() {
      return 1;
    },
    clearTimeout() {},
    requestAnimationFrame(callback) {
      callback();
      return 1;
    },
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
        if (storageWriteFailurePredicate?.(key, String(value))) {
          throw new Error("localStorage write failed");
        }
        if (key === "ana-tilim-progress") {
          progressStorageWriteCount += 1;
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
context.window.Audio = context.Audio;
context.__testPlayedAudioSources = playedAudioSources;
context.__testSentenceAudioInstances = [];
vm.createContext(context);
vm.runInContext(
  `window.Audio = function FakeAudioForVm(src) {
    this.src = src;
    this.playbackRate = 1;
    this.pauseCount = 0;
    this.pause = () => { this.pauseCount += 1; };
    this.play = () => {
      globalThis.__testPlayedAudioSources.push(src);
      globalThis.__testSentenceAudioInstances.push(this);
      return new Promise((resolve, reject) => {
        this.resolvePlayback = resolve;
        this.rejectPlayback = reject;
      });
    };
  };`,
  context
);
vm.runInContext(fs.readFileSync("prototype/app-config.js", "utf8"), context, { filename: "prototype/app-config.js" });
context.window.ANA_TILIM_APP_CONFIG = Object.freeze({
  ...context.window.ANA_TILIM_APP_CONFIG,
  hiddenUnitIds: []
});
for (const scriptPath of courseDataScriptPaths) {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), context, { filename: scriptPath });
}
vm.runInContext(fs.readFileSync(courseDataAggregatorPath, "utf8"), context, { filename: courseDataAggregatorPath });
vm.runInContext(fs.readFileSync(unitOrderPath, "utf8"), context, { filename: unitOrderPath });
vm.runInContext(fs.readFileSync(uyghurKeyboardPath, "utf8"), context, { filename: uyghurKeyboardPath });
vm.runInContext(fs.readFileSync(latinKeyboardPath, "utf8"), context, { filename: latinKeyboardPath });
vm.runInContext(fs.readFileSync("prototype/sentence-morphemes.js", "utf8"), context, { filename: "prototype/sentence-morphemes.js" });
vm.runInContext(fs.readFileSync("prototype/sentence-glossary.js", "utf8"), context, { filename: "prototype/sentence-glossary.js" });
vm.runInContext(fs.readFileSync("prototype/progress-transfer.js", "utf8"), context, { filename: "prototype/progress-transfer.js" });
vm.runInContext(fs.readFileSync("prototype/audio-controller.js", "utf8"), context, { filename: "prototype/audio-controller.js" });
vm.runInContext(fs.readFileSync("prototype/cloud-config.js", "utf8"), context, { filename: "prototype/cloud-config.js" });
vm.runInContext(fs.readFileSync("prototype/cloud-sync.js", "utf8"), context, { filename: "prototype/cloud-sync.js" });
vm.runInContext(fs.readFileSync("prototype/app.js", "utf8"), context, { filename: "prototype/app.js" });

assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(buildLocalProgressData().syllableMistakes ?? null)", context)),
  { connection: [], break: [] },
  "the real app should start with separate persisted connection and break mistake buckets"
);
const validSyllableMistakes = { connection: ["connection-01"], break: ["break-01"] };
assert.equal(
  vm.runInContext(`applyLocalProgressData(${JSON.stringify({ syllableMistakes: validSyllableMistakes })})`, context),
  true,
  "local hydration should accept approved syllable mistake IDs"
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.syllableMistakes)", context)),
  validSyllableMistakes,
  "local hydration should apply both syllable mistake buckets"
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(buildLocalProgressData().syllableMistakes)", context)),
  validSyllableMistakes,
  "local persistence should build both syllable mistake buckets"
);
vm.runInContext("applyLocalProgressData({})", context);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.syllableMistakes)", context)),
  { connection: [], break: [] },
  "legacy local progress without syllable mistakes should normalize to empty buckets"
);
const localStateBeforeInvalidSyllableMistakes = vm.runInContext("JSON.stringify(buildLocalProgressData())", context);
for (const [label, syllableMistakes, expectedError] of [
  ["unknown local syllable mistake ID", { connection: ["connection-99"], break: [] }, /syllableMistakes\.connection 包含未知 ID: connection-99/],
  ["connection ID in break bucket", { connection: [], break: ["connection-01"] }, /syllableMistakes\.break 的 connection-01 属于 connection 分类/]
]) {
  assert.throws(
    () => vm.runInContext(`applyLocalProgressData(${JSON.stringify({ syllableMistakes })})`, context),
    expectedError,
    label
  );
  assert.equal(
    vm.runInContext("JSON.stringify(buildLocalProgressData())", context),
    localStateBeforeInvalidSyllableMistakes,
    `${label} should not partially mutate local state`
  );
}

const currentRealExportText = vm.runInContext(
  "JSON.stringify(progressTransfer.createExportPayload(buildLocalProgressData(), { edition: appConfig.edition, brandName: appConfig.brandName }))",
  context
);
assert.doesNotThrow(
  () => vm.runInContext(`importLocalProgressText(${JSON.stringify(currentRealExportText)})`, context),
  "the app's current real export should pass both structural and course-derived semantic validation"
);
vm.runInContext("state.pendingProgressImport = null", context);

const globalUnits = JSON.parse(
  vm.runInContext("JSON.stringify(learningUnits.map(({ id, title }) => ({ id, title })))", context)
);
assert.deepEqual(globalUnits.map(({ id, title }) => [id, title]), [
  ["letters", "第一单元：认识字母"],
  ["latin-keyboard-writing", "第二单元：拉丁键盘与字母书写强化"],
  ["combos", "第三单元：基础组合"],
  ["syllable-training", "第四单元：拼读与音节训练营"],
  ["basic-phrases", "第五单元：日常用语与词汇"],
  ["grammar-basics", "第六单元：语法入门"],
  ["sentence-patterns", "第七单元：基础句型"],
  ["dialogue-theater", "第八单元：对话小剧场"],
  ["short-stories", "第九单元：小故事"],
  ["uyghur-proverbs", "第十单元：维吾尔谚语"],
  ["famous-quotes", "第十一单元：名人名言"]
]);

const learningProgressBeforeSyllableSummaryRegression = JSON.parse(
  vm.runInContext("JSON.stringify(state.learningProgress)", context)
);
vm.runInContext("delete state.learningProgress.syllableTraining", context);
assert.deepEqual(
  JSON.parse(
    vm.runInContext(
      "JSON.stringify(unitProgressSummaries().find((item) => item.label === '拼读与音节训练营'))",
      context
    )
  ),
  { unit: "第四单元", label: "拼读与音节训练营", completed: 0, total: 7 },
  "legacy progress without a syllable scope should keep every published training stage incomplete"
);
vm.runInContext(
  `state.learningProgress.syllableTraining = {
    "two-letter-warmup": { completed: true },
    "vowel-nucleus": { completed: true },
    "connection-errors": { completed: true },
    "unknown-stage": { completed: true }
  }`,
  context
);
assert.deepEqual(
  JSON.parse(
    vm.runInContext(
      "JSON.stringify(unitProgressSummaries().find((item) => item.label === '拼读与音节训练营'))",
      context
    )
  ),
  { unit: "第四单元", label: "拼读与音节训练营", completed: 3, total: 7 },
  "the training summary should count only the three published completed stages and ignore unknown progress"
);
vm.runInContext(
  `state.learningProgress.syllableTraining = {
    "two-letter-warmup": { completed: true },
    "vowel-nucleus": { completed: true },
    "single-consonant-boundary": { completed: true },
    "two-consonant-boundary": { completed: true },
    "suffix-boundary": { completed: true },
    "connection-errors": { completed: true },
    "sentence-reading": { completed: true }
  }`,
  context
);
assert.deepEqual(
  JSON.parse(
    vm.runInContext(
      "JSON.stringify(unitProgressSummaries().find((item) => item.label === '拼读与音节训练营'))",
      context
    )
  ),
  { unit: "第四单元", label: "拼读与音节训练营", completed: 7, total: 7 },
  "the published warmup, four rules, connection checks, and sentence reading should complete all seven stages"
);
vm.runInContext(
  `state.learningProgress = ${JSON.stringify(learningProgressBeforeSyllableSummaryRegression)}`,
  context
);

function createConfiguredAppVm(hiddenUnitIds, { includeLatinKeyboard = true } = {}) {
  const configuredApp = makeElement("configured-app");
  const configuredToast = makeElement("configured-toast");
  const configuredStorage = {};
  const configuredSessionStorage = {};
  const configuredContext = {
    console,
    document: {
      querySelector(selector) {
        if (selector === "#app") return configuredApp;
        if (selector === "#toast") return configuredToast;
        return null;
      },
      addEventListener() {}
    },
    window: {
      setTimeout() {
        return 1;
      },
      clearTimeout() {},
      requestAnimationFrame(callback) {
        callback();
        return 1;
      },
      localStorage: {
        getItem(key) {
          return Object.prototype.hasOwnProperty.call(configuredStorage, key) ? configuredStorage[key] : null;
        },
        setItem(key, value) {
          configuredStorage[key] = String(value);
        },
        removeItem(key) {
          delete configuredStorage[key];
        }
      },
      sessionStorage: {
        getItem(key) {
          return Object.prototype.hasOwnProperty.call(configuredSessionStorage, key)
            ? configuredSessionStorage[key]
            : null;
        },
        setItem(key, value) {
          configuredSessionStorage[key] = String(value);
        },
        removeItem(key) {
          delete configuredSessionStorage[key];
        }
      }
    },
    Audio: function FakeAudio(src) {
      this.src = src;
      this.pause = () => {};
      this.play = () => Promise.resolve();
    }
  };

  configuredContext.globalThis = configuredContext;
  vm.createContext(configuredContext);
  vm.runInContext(fs.readFileSync("prototype/app-config.js", "utf8"), configuredContext, {
    filename: "prototype/app-config.js"
  });
  configuredContext.window.ANA_TILIM_APP_CONFIG = Object.freeze({
    ...configuredContext.window.ANA_TILIM_APP_CONFIG,
    cloudEnabled: false,
    hiddenUnitIds
  });
  for (const scriptPath of courseDataScriptPaths) {
    vm.runInContext(fs.readFileSync(scriptPath, "utf8"), configuredContext, { filename: scriptPath });
  }
  for (const scriptPath of [
    courseDataAggregatorPath,
    unitOrderPath,
    uyghurKeyboardPath,
    ...(includeLatinKeyboard ? [latinKeyboardPath] : []),
    "prototype/sentence-morphemes.js",
    "prototype/sentence-glossary.js",
    "prototype/progress-transfer.js",
    "prototype/app.js"
  ]) {
    vm.runInContext(fs.readFileSync(scriptPath, "utf8"), configuredContext, { filename: scriptPath });
  }

  return {
    app: configuredApp,
    context: configuredContext,
    render(script) {
      vm.runInContext(`${script}; render();`, configuredContext);
      return configuredApp.innerHTML;
    }
  };
}

assert.throws(
  () => createConfiguredAppVm([], { includeLatinKeyboard: false }),
  /Learning data modules failed to load/,
  "the app should fail fast when its focused Latin keyboard dependency is missing"
);

const domesticApp = createConfiguredAppVm(["famous-quotes"]);
const domesticWelcomeHtml = domesticApp.render("state.screen = 'welcome'");
assert.match(
  domesticWelcomeHtml,
  /<button class="primary-button" data-action="continue-local"[^>]*>\s*开始学习\s*<\/button>/,
  "domestic guest learning should be the welcome screen primary action"
);
assert.ok(
  domesticWelcomeHtml.includes("学习记录保存在当前设备，可在‘我的’页面导出备份"),
  "domestic welcome should explain local storage and manual backup"
);
for (const cloudCopy of ["登录", "Google", "Supabase", "云同步"]) {
  assert.ok(!domesticWelcomeHtml.includes(cloudCopy), `domestic welcome should not include ${cloudCopy}`);
}
const domesticUnits = JSON.parse(
  vm.runInContext(
    "JSON.stringify(learningUnits.map(({ id, title }) => ({ id, title })))",
    domesticApp.context
  )
);
assert.deepEqual(domesticUnits.map(({ id, title }) => [id, title]), [
  ["letters", "第一单元：认识字母"],
  ["latin-keyboard-writing", "第二单元：拉丁键盘与字母书写强化"],
  ["combos", "第三单元：基础组合"],
  ["syllable-training", "第四单元：拼读与音节训练营"],
  ["basic-phrases", "第五单元：日常用语与词汇"],
  ["grammar-basics", "第六单元：语法入门"],
  ["sentence-patterns", "第七单元：基础句型"],
  ["dialogue-theater", "第八单元：对话小剧场"],
  ["short-stories", "第九单元：小故事"],
  ["uyghur-proverbs", "第十单元：维吾尔谚语"]
]);
const domesticLearningPath = domesticApp.render("state.screen = 'learn'");
assert.equal(
  (domesticLearningPath.match(/class="lesson-step"/g) || []).length,
  10,
  "domestic learning path should render only the ten visible course cards"
);
assert.ok(!domesticLearningPath.includes("名人名言"), "domestic learning path should hide famous quotes");
assert.ok(
  domesticLearningPath.indexOf("第九单元：小故事") < domesticLearningPath.indexOf("第十单元：维吾尔谚语"),
  "domestic learning path should keep visible cards in edition order"
);
assert.deepEqual(
  JSON.parse(
    vm.runInContext(
      "JSON.stringify(unitProgressSummaries().map(({ unit, label }) => [unit, label]))",
      domesticApp.context
    )
  ),
  [
    ["第一单元", "认识字母"],
    ["第二单元", "拉丁键盘与字母书写强化"],
    ["第三单元", "基础组合"],
    ["第四单元", "拼读与音节训练营"],
    ["第五单元", "日常用语与词汇"],
    ["第六单元", "语法入门"],
    ["第七单元", "基础句型"],
    ["第八单元", "对话小剧场"],
    ["第九单元", "小故事"],
    ["第十单元", "维吾尔谚语"]
  ],
  "domestic progress summaries should include only visible units"
);
const domesticProverbActions = vm.runInContext(
  "renderUnitNextActions('uyghur-proverbs')",
  domesticApp.context
);
assert.ok(domesticProverbActions.includes("回到学习路径"), "domestic proverb unit should be terminal");
assert.match(
  domesticProverbActions,
  /data-action="go"[^>]*data-target="learn"[^>]*>[\s\S]*?回到学习路径/,
  "domestic proverb terminal action should return to the learning path"
);
assert.ok(!domesticProverbActions.includes('data-id="famous-quotes"'), "domestic proverb unit should not navigate to hidden quotes");

const shiftedApp = createConfiguredAppVm(["letters"]);
assert.equal(
  vm.runInContext("unitNameForComboGroup()", shiftedApp.context),
  "第二单元",
  "combo labels should derive their ordinal from visible units"
);
assert.ok(
  shiftedApp.render("state.screen = 'comboComplete'").includes("第二单元完成"),
  "combo completion should render the visible combo ordinal"
);
assert.ok(
  shiftedApp.render("state.screen = 'vocab'").includes("第四单元：日常用语与词汇"),
  "vocabulary lesson should render its visible title"
);
assert.ok(
  shiftedApp.render("state.screen = 'vocabComplete'").includes("第四单元完成"),
  "vocabulary completion should render its visible ordinal"
);
assert.ok(
  shiftedApp.render(
    "state.screen = 'reading'; state.selectedReadingUnitId = 'grammar-basics'; state.selectedReadingGroupId = 'grammar-word-order'"
  ).includes("第五单元：语法入门"),
  "reading lesson should render its visible unit title"
);

assert.equal(
  vm.runInContext("currentUnitExperience('letters').recommended", context),
  "先复习字母分组，再进入下一单元。",
  "letter recommendation should not name a next unit that can move"
);
assert.equal(
  vm.runInContext("currentUnitExperience('letters').steps.at(-1)", context),
  "完成后进入下一单元",
  "letter steps should not name a next unit that can move"
);
assert.equal(
  vm.runInContext("currentUnitExperience('sentence-patterns').recommended", context),
  "把日常用语与词汇中学过的常用词放进短句里。",
  "sentence recommendation should not keep a stale vocabulary ordinal"
);
assert.equal(vm.runInContext("currentUnitExperience('short-stories').nextUnitId", context), "uyghur-proverbs");
assert.equal(vm.runInContext("currentUnitExperience('uyghur-proverbs').nextUnitId", context), "famous-quotes");
assert.equal(vm.runInContext("currentUnitExperience('famous-quotes').nextUnitId", context), null);
assert.equal(vm.runInContext("currentUnitExperience('famous-quotes').nextLabel", context), "回到学习路径");

assert.deepEqual(
  JSON.parse(
    vm.runInContext(
      "JSON.stringify(unitProgressSummaries().map(({ unit, label }) => [unit, label]))",
      context
    )
  ),
  [
    ["第一单元", "认识字母"],
    ["第二单元", "拉丁键盘与字母书写强化"],
    ["第三单元", "基础组合"],
    ["第四单元", "拼读与音节训练营"],
    ["第五单元", "日常用语与词汇"],
    ["第六单元", "语法入门"],
    ["第七单元", "基础句型"],
    ["第八单元", "对话小剧场"],
    ["第九单元", "小故事"],
    ["第十单元", "维吾尔谚语"],
    ["第十一单元", "名人名言"]
  ]
);

storage["ana-tilim-progress"] = JSON.stringify({
  selectedUnitId: "dialogue-theater",
  learningProgress: {
    letters: {},
    combos: {},
    vocab: {},
    practice: {},
    reading: { "dialogue-greeting": { completed: true } }
  }
});
vm.runInContext("hydrateLocalProgress()", context);
const savedSelectedUnitIdAfterLoad = vm.runInContext("state.selectedUnitId", context);
assert.equal(savedSelectedUnitIdAfterLoad, "dialogue-theater");
assert.equal(
  vm.runInContext("state.learningProgress.reading['dialogue-greeting'].completed", context),
  true,
  "legacy learning progress should remain attached to its stable lesson ID"
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.learningProgress.latinWriting)", context)),
  {},
  "legacy snapshots without Latin writing progress should receive an empty compatible scope"
);
delete storage["ana-tilim-progress"];
vm.runInContext("state.selectedUnitId = 'letters'; state.learningProgress = emptyLearningProgress()", context);

assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(window.ANA_TILIM_UYGHUR_KEYBOARD.rows.map((row) => row.map((key) => key.value)))", context)),
  [
    ["چ", "ۋ", "ې", "ر", "ت", "ي", "ۇ", "ڭ", "و", "پ"],
    ["ھ", "س", "د", "ا", "ە", "ى", "ق", "ك", "ل"],
    ["ز", "ش", "غ", "ۈ", "ب", "ن", "م", "،", ".", "ئ"]
  ],
  "Uyghur virtual keyboard should match the standard physical QWERTY rows"
);
assert.equal(vm.runInContext("window.ANA_TILIM_UYGHUR_KEYBOARD.keyForCode('KeyK', true).value", context), "ۆ");
assert.equal(vm.runInContext("window.ANA_TILIM_UYGHUR_KEYBOARD.keyForCode('Space', false)?.value", context), " ", "standard keyboard should map the physical Space key");
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(window.ANA_TILIM_UYGHUR_KEYBOARD.keystrokesForText('ئە'))", context)),
  [
    { code: "Slash", shifted: false, value: "ئ" },
    { code: "KeyG", shifted: false, value: "ە" }
  ],
  "keyboard guide should decompose a target into real physical keystrokes"
);
assert.equal(
  vm.runInContext("window.ANA_TILIM_UYGHUR_KEYBOARD.keystrokesForText('كۆپ رەھمەت').map((stroke) => stroke.value).join('')", context),
  "كۆپ رەھمەت",
  "the keyboard should type multi-word learning targets without dropping spaces"
);

const defaultPreferences = JSON.parse(
  vm.runInContext("JSON.stringify(normalizePreferences(null))", context)
);
assert.deepEqual(defaultPreferences, {
  audioAutoplay: false,
  dailyGoal: 10,
  learningReminder: false,
  showLatin: true
});

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
  "schemaVersion",
  "syllableMistakes"
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
        latinWriting: { qwerty: { completed: true } },
        letters: { "dot-bone": { completed: true } },
        combos: {},
        vocab: {},
        practice: {},
        reading: {}
      },
      mistakes: [],
      favorite: true,
      dailyActivity: { date: "2026-07-28", completedIds: ["letters:dot-bone:completed"] },
      preferences: { audioAutoplay: false, dailyGoal: 10, learningReminder: false, showLatin: true }
    });
  `,
  context
);
assert.equal(vm.runInContext("state.screen", context), "library", "cloud merge should preserve current page");
assert.equal(vm.runInContext("state.favorite", context), true);
assert.equal(
  vm.runInContext("state.learningProgress.letters['dot-bone'].completed", context),
  true
);
assert.equal(vm.runInContext("state.learningProgress.latinWriting.qwerty.completed", context), true);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.syllableMistakes)", context)),
  { connection: [], break: [] },
  "legacy cloud snapshots without syllable mistakes should apply empty compatible buckets"
);

const validCloudProgress = {
  latinWriting: { qwerty: { completed: true } },
  letters: {},
  combos: {},
  vocab: {},
  practice: {},
  reading: {}
};
const cloudSnapshotBase = {
  schemaVersion: 1,
  modifiedAt: "2026-07-28T05:00:00.000Z",
  preferencesUpdatedAt: "2026-07-28T05:00:00.000Z",
  favoriteUpdatedAt: "2026-07-28T05:00:00.000Z",
  mistakes: [],
  syllableMistakes: { connection: [], break: [] },
  favorite: false,
  dailyActivity: { date: "2026-07-28", completedIds: [] },
  preferences: {}
};
vm.runInContext(
  `applyCloudSnapshot(${JSON.stringify({
    ...cloudSnapshotBase,
    learningProgress: validCloudProgress,
    syllableMistakes: validSyllableMistakes
  })})`,
  context
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.syllableMistakes)", context)),
  validSyllableMistakes,
  "cloud apply should restore both validated syllable mistake buckets"
);
for (const [label, syllableMistakes, expectedError] of [
  ["unknown cloud syllable mistake ID", { connection: ["connection-99"], break: [] }, /syllableMistakes\.connection 包含未知 ID: connection-99/],
  ["cloud connection ID in break bucket", { connection: [], break: ["connection-01"] }, /syllableMistakes\.break 的 connection-01 属于 connection 分类/]
]) {
  assert.throws(
    () => vm.runInContext(`applyCloudSnapshot(${JSON.stringify({ ...cloudSnapshotBase, learningProgress: validCloudProgress, syllableMistakes })})`, context),
    expectedError,
    label
  );
  assert.deepEqual(
    JSON.parse(vm.runInContext("JSON.stringify(state.syllableMistakes)", context)),
    validSyllableMistakes,
    `${label} should not mutate the current syllable mistake buckets`
  );
}
const cloudStateBeforeInvalidProgress = vm.runInContext("JSON.stringify(state.learningProgress)", context);
for (const [label, learningProgress, expectedError] of [
  [
    "unknown cloud progress scope",
    { ...validCloudProgress, futureScope: {} },
    /learningProgress 包含未知字段 futureScope/
  ],
  [
    "unknown cloud Latin progress ID",
    { ...validCloudProgress, latinWriting: { futureStep: { completed: true } } },
    /learningProgress\.latinWriting 包含未知 ID: futureStep/
  ],
  [
    "unknown cloud Latin progress field",
    { ...validCloudProgress, latinWriting: { qwerty: { completed: true, score: 99 } } },
    /learningProgress\.latinWriting\.qwerty 包含未知字段 score/
  ]
]) {
  const invalidSnapshot = { ...cloudSnapshotBase, learningProgress };
  assert.throws(
    () => vm.runInContext(`applyCloudSnapshot(${JSON.stringify(invalidSnapshot)})`, context),
    expectedError,
    label
  );
  assert.equal(
    vm.runInContext("JSON.stringify(state.learningProgress)", context),
    cloudStateBeforeInvalidProgress,
    `${label} should not mutate local progress`
  );
}
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
      showLatin: "yes"
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
      showLatin: true
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
  showLatin: true
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

function pressPhysicalKey(key, overrides = {}) {
  assert.ok(keydownHandler, "keydown handler should be registered");
  keydownHandler({
    key,
    code: key === " " ? "Space" : key === "Backspace" ? "Backspace" : `Key${key.toUpperCase()}`,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    target: { matches() { return false; } },
    preventDefault() {},
    ...overrides
  });
}

function assertGuestActionPrecedesAuthSubmits(html, actions, label) {
  const guestIndex = html.indexOf('data-action="continue-local"');
  assert.ok(guestIndex >= 0, `${label} should keep the guest learning action`);
  for (const action of actions) {
    const authIndex = html.indexOf(`data-action="${action}"`);
    assert.ok(authIndex > guestIndex, `${label} should place continue-local before ${action}`);
  }
}

function triggerProgressImportFile(file) {
  assert.ok(changeHandler, "change handler should be registered");
  const input = {
    id: "progress-import-input",
    files: [file],
    value: "selected.json"
  };
  changeHandler({ target: input });
  return input;
}

async function selectProgressImport(text) {
  const input = triggerProgressImportFile({ text: () => Promise.resolve(text) });
  await new Promise((resolve) => setImmediate(resolve));
  return input;
}

function deferredProgressFile() {
  let resolveText;
  let rejectText;
  const textPromise = new Promise((resolve, reject) => {
    resolveText = resolve;
    rejectText = reject;
  });
  return {
    file: { text: () => textPromise },
    resolveText,
    rejectText
  };
}

async function flushProgressImport() {
  await new Promise((resolve) => setImmediate(resolve));
}

function savedProgress() {
  assert.ok(storage["ana-tilim-progress"], "local progress should be saved");
  return JSON.parse(storage["ana-tilim-progress"]);
}

vm.runInContext(
  `
    state.screen = "profile";
    state.learningProgress.letters["dot-bone"] = { completed: true };
    state.mistakes = [{ kind: "letter", targetId: "be" }];
    state.syllableMistakes = { connection: ["connection-01"], break: ["break-01"] };
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
assert.deepEqual(
  JSON.parse(storage["ana-tilim-guest-progress-backup"]).snapshot.syllableMistakes,
  validSyllableMistakes,
  "guest backup should preserve the two syllable mistake buckets"
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
  { latinWriting: {}, letters: {}, combos: {}, syllableTraining: {}, vocab: {}, practice: {}, reading: {} }
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.mistakes)", context)),
  []
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.syllableMistakes)", context)),
  { connection: [], break: [] },
  "new learner initialization should clear both syllable mistake buckets"
);

const collapsedWelcomeHtml = renderState("state.screen = 'welcome'; state.authPanelExpanded = false");
includesAll(
  collapsedWelcomeHtml,
  [
    "从字母、发音、书写到键盘输入，一步一步学会自己的母语。",
    "直接开始学习",
    "可选：登录后跨设备同步"
  ],
  "collapsed welcome screen"
);
assert.equal(
  vm.runInContext("state.authPanelExpanded", context),
  false,
  "overseas authentication should start collapsed"
);
assert.match(
  collapsedWelcomeHtml,
  /<button class="primary-button" data-action="continue-local"[^>]*>\s*直接开始学习\s*<\/button>/,
  "guest learning should be the welcome screen primary action"
);
vm.runInContext(
  `
    globalThis.cloudSyncBeforeSignedInCopyTest = cloudSync;
    cloudSync = { session() { return { user: { email: "restored@example.com" } }; } };
  `,
  context
);
const signedInWelcomeCopyHtml = renderState("state.screen = 'welcome'; state.authPanelExpanded = false");
includesAll(signedInWelcomeCopyHtml, ["继续学习", "查看同步状态"], "signed-in welcome copy");
assert.ok(!signedInWelcomeCopyHtml.includes("可选：登录后跨设备同步"), "signed-in welcome copy should not invite another login");
vm.runInContext("cloudSync = globalThis.cloudSyncBeforeSignedInCopyTest", context);
renderState("state.screen = 'welcome'; state.authPanelExpanded = false");
const collapsedAuthRegionTag = collapsedWelcomeHtml.match(/<[^>]+id="welcome-auth-panel"[^>]*>/)?.[0] || "";
assert.ok(collapsedAuthRegionTag.includes("hidden"), "collapsed auth control should keep a hidden aria-controls target in the DOM");
const authDisclosureButton = collapsedWelcomeHtml.match(/<button[\s\S]*?data-action="toggle-auth-panel"[\s\S]*?<\/button>/)?.[0] || "";
assert.ok(
  authDisclosureButton.includes('aria-controls="welcome-auth-panel"') &&
    authDisclosureButton.includes('type="button"'),
  "the auth disclosure should remain a native button with a valid controlled target"
);
assert.ok(
  !collapsedWelcomeHtml.includes('data-action="password-login"') &&
    !collapsedWelcomeHtml.includes('data-action="password-register"') &&
    !collapsedWelcomeHtml.includes('data-action="cloud-google-login"'),
  "collapsed welcome should not render authentication controls"
);
assert.ok(!app.innerHTML.includes("测试账号"), "welcome screen should not expose the removed mock account");
assert.ok(!app.innerHTML.includes("<br>"), "welcome screen should not force the hero copy onto manual line breaks");
assert.ok(
  app.innerHTML.includes('class="hero-content with-auth"'),
  "overseas welcome should use the centered layout with an auth panel"
);

authPanelToggleFocused = false;
clickDataset({ action: "toggle-auth-panel" });
assert.equal(vm.runInContext("state.authPanelExpanded", context), true, "the optional sync button should expand authentication");
assert.equal(authPanelToggleFocused, true, "expanding authentication should return focus to its disclosure button");
const expandedLoginHtml = app.innerHTML;
includesAll(
  expandedLoginHtml,
  ["登录", "注册", "邮箱", "密码", "登录并继续学习", "使用 Google 登录", "使用邮箱验证码", "登录后自动同步"],
  "expanded welcome authentication"
);
const expandedAuthRegionTag = expandedLoginHtml.match(/<[^>]+id="welcome-auth-panel"[^>]*>/)?.[0] || "";
assert.ok(expandedAuthRegionTag && !expandedAuthRegionTag.includes("hidden"), "expanded aria-controls target should be visible");
assert.ok(expandedLoginHtml.includes('type="password"'), "expanded welcome should provide password login");
assert.ok(
  expandedLoginHtml.includes('autocomplete="current-password"'),
  "login password should use current-password autocomplete"
);
assertGuestActionPrecedesAuthSubmits(
  expandedLoginHtml,
  ["password-login", "cloud-google-login"],
  "expanded login"
);

clickDataset({ action: "switch-auth-mode", mode: "register" });
const registerHtml = app.innerHTML;
includesAll(
  registerHtml,
  [
    "昵称",
    "确认密码",
    "注册并开始学习",
    "当前暂不支持邮件找回密码，请保存好密码"
  ],
  "registration form"
);
assert.ok(
  registerHtml.includes('autocomplete="new-password"'),
  "registration passwords should use new-password autocomplete"
);
assertGuestActionPrecedesAuthSubmits(
  registerHtml,
  ["password-register", "cloud-google-login"],
  "expanded registration"
);
clickDataset({ action: "show-email-login" });
assert.ok(app.innerHTML.includes('id="auth-email"'), "expanded authentication should keep email-code login operable");
assertGuestActionPrecedesAuthSubmits(
  app.innerHTML,
  ["password-register", "cloud-google-login", "request-email-otp"],
  "expanded email-code authentication"
);
authPanelToggleFocused = false;
clickDataset({ action: "toggle-auth-panel" });
assert.equal(vm.runInContext("state.authPanelExpanded", context), false, "the optional sync button should collapse authentication again");
assert.equal(authPanelToggleFocused, true, "collapsing authentication should return focus to its disclosure button");
assert.ok(!app.innerHTML.includes('id="auth-email"'), "collapsed authentication should leave no hidden form in the DOM");

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

vm.runInContext(
  `
    globalThis.cloudSyncBeforeSignedInWelcome = cloudSync;
    cloudSync = {
      session() {
        return { user: { email: "restored@example.com" } };
      }
    };
  `,
  context
);
const signedInWelcomeHtml = renderState("state.screen = 'welcome'; state.authPanelExpanded = false");
includesAll(signedInWelcomeHtml, ["继续学习", "查看同步状态"], "signed-in welcome screen");
assert.ok(!signedInWelcomeHtml.includes("可选：登录后跨设备同步"), "signed-in welcome should not invite another login");
assert.ok(!signedInWelcomeHtml.includes("直接开始学习"), "signed-in welcome should not describe the learner as a guest");
clickDataset({ action: "continue-local" });
assert.equal(vm.runInContext("state.screen", context), "home", "signed-in learning should continue to home");
assert.equal(toast.textContent, "继续学习，进度将自动同步", "signed-in welcome CTA should preserve cloud-sync meaning");

vm.runInContext("cloudSync = globalThis.cloudSyncBeforeSignedInWelcome", context);
renderState("state.screen = 'welcome'; state.authPanelExpanded = false");
clickDataset({ action: "continue-local" });
assert.equal(vm.runInContext("state.screen", context), "home", "local learning should enter without login");
assert.equal(toast.textContent, "已进入本地学习模式", "guest learning should retain its local-mode explanation");

assert.ok(
  desktopWelcomeStyle.includes("grid-template-columns: minmax(0, 1fr);") &&
    desktopWelcomeStyle.includes("width: min(100%, 620px);"),
  "desktop welcome should keep the guest CTA, disclosure, and authentication in one visual column"
);

vm.runInContext("state.preferences = normalizePreferences(null)", context);
const profileHtml = renderState("state.screen = 'profile'");
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
    "从相册选择头像",
    "使用 Google 登录",
    "使用邮箱验证码",
    "导出学习记录",
    "导入学习记录"
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
const emptyMemoryHtml = renderState("state.screen = 'home'; state.mistakes = []");
assert.ok(
  emptyMemoryHtml.includes("当前没有需要复习的错题"),
  "empty memory review should describe only the current state"
);
assert.ok(
  !emptyMemoryHtml.includes("后续登录版会按记忆状态生成每日复习队列"),
  "empty memory review should not promise a future reminder feature"
);
assert.match(
  profileHtml,
  /<input[^>]+id="profile-avatar-input"[^>]+type="file"[^>]+accept="image\/\*"[^>]*>/,
  "My should provide a photo-library compatible image picker"
);
assert.ok(
  !profileHtml.match(/id="profile-avatar-input"[^>]+disabled/),
  "local learners should be able to choose an avatar without signing in"
);
assert.ok(
  !profileHtml.includes('capture="camera"'),
  "the avatar picker should not force the camera instead of the photo library"
);

vm.runInContext(
  `
    state.localProfile = {
      displayName: "已保存昵称",
      avatarDataUrl: "data:image/png;base64,kept-avatar"
    };
  `,
  context
);
let localProfileHtml = renderState("state.screen = 'profile'");
assert.match(
  localProfileHtml,
  /data-action="edit-display-name"/,
  "local learners should edit their nickname from the profile heading"
);
assert.match(localProfileHtml, /aria-label="修改昵称"/, "the pencil action should have an accessible name");
assert.doesNotMatch(localProfileHtml, /id="profile-display-name"/, "the nickname input should stay hidden until requested");
assert.doesNotMatch(localProfileHtml, /class="profile-name-editor"/, "the settings card should not repeat the old nickname editor");
assert.doesNotMatch(
  localProfileHtml,
  /data-action="save-display-name"[^>]*>保存昵称/,
  "the settings card should not repeat the old nickname save button"
);

clickDataset({ action: "edit-display-name" });
assert.equal(profileDisplayNameFocused, true, "opening nickname editing should focus the inline input");
localProfileHtml = app.innerHTML;
assert.match(
  localProfileHtml,
  /id="profile-display-name"[^>]+value="已保存昵称"/,
  "inline nickname editing should preserve the current saved value"
);
assert.match(localProfileHtml, /data-action="cancel-display-name"/, "inline nickname editing should provide cancel");

clickDataset({ action: "cancel-display-name" });
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.localProfile)", context)),
  {
    displayName: "已保存昵称",
    avatarDataUrl: "data:image/png;base64,kept-avatar"
  },
  "canceling nickname editing should preserve the saved nickname and avatar"
);

profileDisplayNameFocused = false;
clickDataset({ action: "edit-display-name" });
profileDisplayNameValue = "  新昵称  ";
clickDataset({ action: "save-display-name" });
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.localProfile)", context)),
  {
    displayName: "新昵称",
    avatarDataUrl: "data:image/png;base64,kept-avatar"
  },
  "saving an inline nickname should preserve the existing avatar"
);
assert.deepEqual(savedProgress().localProfile, {
  displayName: "新昵称",
  avatarDataUrl: "data:image/png;base64,kept-avatar"
});
assert.doesNotMatch(app.innerHTML, /id="profile-display-name"/, "successful save should close the inline editor");

vm.runInContext(
  `
    globalThis.savedCloudSyncForProfileTest = cloudSync;
    cloudSync = {
      scheduleSync() {
        globalThis.importCloudScheduleCount += 1;
        if (globalThis.cloudScheduleFailuresRemaining > 0) {
          globalThis.cloudScheduleFailuresRemaining -= 1;
          throw new Error("cloud schedule failed");
        }
      },
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
    globalThis.importCloudScheduleCount = 0;
    globalThis.cloudScheduleFailuresRemaining = 0;
    cloudStatus = { phase: "signed-in", error: "" };
  `,
  context
);
const signedInProfileHtml = renderState("state.screen = 'profile'");
includesAll(
  signedInProfileHtml,
  ["学习记录会自动同步到云端。", "导出学习记录", "导入学习记录"],
  "signed-in profile cloud and manual transfer controls"
);

const storedBytesBeforeImport = '{ "screen": "home", "marker": "preserve exact bytes" }';
storage["ana-tilim-progress"] = storedBytesBeforeImport;
vm.runInContext(
  `
    state.currentLetterId = "te";
    state.selectedGroupId = "vowels-basic";
    state.currentComboItemId = "bala";
    state.selectedComboGroupId = "closed-syllables";
    state.currentVocabItemId = "ata";
    state.selectedVocabGroupId = "family";
    state.currentPracticeItemId = "practice-old";
    state.selectedPracticeGroupId = "review-loop";
    state.selectedReadingUnitId = "short-stories";
    state.selectedReadingGroupId = "story-old";
    state.selectedUnitId = "short-stories";
    state.favorite = true;
    state.mistakes = [{ kind: "old-mistake", targetId: "old" }];
    state.writingChecks = [{ id: "old-writing" }];
    state.localProfile = {
      displayName: "Old Local Name",
      avatarDataUrl: "data:image/png;base64,old-avatar"
    };
    state.preferences = {
      audioAutoplay: true,
      dailyGoal: 15,
      learningReminder: true,
      showLatin: false
    };
    state.dailyActivity = { date: "2026-08-08", completedIds: ["old-activity"] };
    state.modifiedAt = "2026-08-08T00:00:00.000Z";
    state.preferencesUpdatedAt = "2026-08-08T00:00:00.000Z";
    state.favoriteUpdatedAt = "2026-08-08T00:00:00.000Z";
    state.authMode = "register";
    state.authEmail = "keep-session@example.com";
  `,
  context
);
const importedProgress = {
  learningProgress: {
    latinWriting: { qwerty: { completed: true } },
    letters: { "dot-bone": { completed: true } },
    combos: {},
    vocab: {},
    practice: {},
    reading: {}
  }
};
const globalImportText = JSON.stringify({
  format: "uyghur-tili-local-progress",
  version: 1,
  exportedAt: "2026-08-09T01:02:03.000Z",
  edition: "global",
  brandName: "Forged Product Name",
  data: importedProgress
});

const selectedInput = await selectProgressImport(globalImportText);
assert.equal(selectedInput.value, "", "the selected filename should be cleared after parsing");
assert.equal(
  storage["ana-tilim-progress"],
  storedBytesBeforeImport,
  "selecting a valid file should not change the original storage bytes before confirmation"
);
assert.equal(vm.runInContext("state.pendingProgressImport.edition", context), "global");
includesAll(
  app.innerHTML,
  [
    "来源版本：Ana Tilim 海外版",
    "导出时间：2026-08-09T01:02:03.000Z",
    "手动导入会替换当前设备记录，并在登录状态下按现有同步规则上传",
    'data-action="cancel-import-progress"',
    'data-action="confirm-import-progress"'
  ],
  "manual import confirmation"
);
vm.runInContext("render()", context);
assert.equal(
  storage["ana-tilim-progress"],
  storedBytesBeforeImport,
  "ordinary rerenders while an import is pending should not bypass confirmation and rewrite storage"
);

clickDataset({ action: "cancel-import-progress" });
assert.equal(vm.runInContext("state.pendingProgressImport", context), null);
assert.equal(
  storage["ana-tilim-progress"],
  storedBytesBeforeImport,
  "canceling a pending import should preserve the original storage bytes"
);

await selectProgressImport("not-json");
assert.equal(vm.runInContext("state.pendingProgressImport", context), null);
assert.equal(
  storage["ana-tilim-progress"],
  storedBytesBeforeImport,
  "a malformed import should preserve the original storage bytes"
);
assert.equal(toast.textContent, "文件不是有效的 JSON");

const domesticImportText = JSON.stringify({
  format: "uyghur-tili-local-progress",
  version: 1,
  exportedAt: "2026-08-09T01:02:03.000Z",
  edition: "cn",
  brandName: "Ana Tilim 海外版",
  data: importedProgress
});
await selectProgressImport(domesticImportText);
assert.equal(vm.runInContext("state.pendingProgressImport", context), null);
assert.equal(
  storage["ana-tilim-progress"],
  storedBytesBeforeImport,
  "a cross-edition import should preserve the original storage bytes"
);
assert.equal(toast.textContent, "备份属于 Uyghur Tili 国内版，不能导入 Ana Tilim 海外版");

function importTextWithData(data) {
  return JSON.stringify({
    ...JSON.parse(globalImportText),
    exportedAt: "2026-08-09T01:02:04.000Z",
    data
  });
}

function importProgressDirect(text) {
  return vm.runInContext(`importLocalProgressText(${JSON.stringify(text)})`, context);
}

const validPendingBeforeSemanticFailures = importProgressDirect(globalImportText);
const pendingBytesBeforeSemanticFailures = JSON.stringify(validPendingBeforeSemanticFailures);
const runtimeBytesBeforeSemanticFailures = vm.runInContext("JSON.stringify(buildLocalProgressData())", context);
const completeVowelNucleusIds = [
  "vowel-nucleus-01",
  "vowel-nucleus-02",
  "vowel-nucleus-03",
  "vowel-nucleus-04"
];
const completeWarmupProgress = {
  completedIds: [
    "warmup-ba", "warmup-pa", "warmup-ta", "warmup-na", "warmup-la",
    "warmup-ma", "warmup-be-e", "warmup-pe-e", "warmup-te-e", "warmup-ne-e"
  ],
  completed: true
};
const completeVowelNucleusProgress = { completedIds: completeVowelNucleusIds, completed: true };
const completeSingleConsonantProgress = {
  completedIds: [
    "single-consonant-boundary-01",
    "single-consonant-boundary-02",
    "single-consonant-boundary-03",
    "single-consonant-boundary-04"
  ],
  completed: true
};
const completeTwoConsonantProgress = {
  completedIds: [
    "two-consonant-boundary-01",
    "two-consonant-boundary-02",
    "two-consonant-boundary-03",
    "two-consonant-boundary-04"
  ],
  completed: true
};
const completeSuffixProgress = {
  completedIds: ["suffix-boundary-01", "suffix-boundary-02", "suffix-boundary-03", "suffix-boundary-04"],
  completed: true
};
const connectionStageIds = [
  "connection-01", "connection-02", "connection-03", "connection-04", "connection-05", "connection-06",
  "break-01", "break-02", "break-03", "break-04", "break-05", "break-06"
];
const completeRuleWithoutCompletion = {
  learningProgress: {
    syllableTraining: {
      "vowel-nucleus": { completedIds: completeVowelNucleusIds }
    }
  }
};
assert.throws(
  () => vm.runInContext(`applyLocalProgressData(${JSON.stringify(completeRuleWithoutCompletion)})`, context),
  /learningProgress\.syllableTraining\.vowel-nucleus 已提交全部题目，必须标记完成/,
  "local hydration must reject four submitted rule IDs without its completion flag"
);
assert.equal(
  vm.runInContext("JSON.stringify(buildLocalProgressData())", context),
  runtimeBytesBeforeSemanticFailures,
  "rejected local syllable progress must not partially mutate runtime data"
);
assert.throws(
  () => vm.runInContext(`validateCloudProgressSnapshot(${JSON.stringify(completeRuleWithoutCompletion)})`, context),
  /learningProgress\.syllableTraining\.vowel-nucleus 已提交全部题目，必须标记完成/,
  "cloud validation must reject four submitted rule IDs without its completion flag"
);
for (const [boundaryName, expression] of [
  ["local hydration", `applyLocalProgressData(${JSON.stringify({ learningProgress: { syllableTraining: { "vowel-nucleus": { completedIds: completeVowelNucleusIds, completed: false } } } })})`],
  ["cloud validation", `validateCloudProgressSnapshot(${JSON.stringify({ learningProgress: { syllableTraining: { "vowel-nucleus": { completedIds: completeVowelNucleusIds, completed: false } } } })})`]
]) {
  assert.throws(
    () => vm.runInContext(expression, context),
    /learningProgress\.syllableTraining\.vowel-nucleus 已提交全部题目，必须标记完成/,
    `${boundaryName} must reject four submitted rule IDs with an explicit false completion flag`
  );
}
const semanticInvalidCases = [
  ["screen", { screen: "unknown-screen" }, /未知页面 ID: unknown-screen/],
  ["current letter", { currentLetterId: "unknown-letter" }, /未知 currentLetterId: unknown-letter/],
  ["selected letter group", { selectedGroupId: "unknown-letter-group" }, /未知 selectedGroupId: unknown-letter-group/],
  ["current combo", { currentComboItemId: "unknown-combo" }, /未知 currentComboItemId: unknown-combo/],
  ["selected combo group", { selectedComboGroupId: "unknown-combo-group" }, /未知 selectedComboGroupId: unknown-combo-group/],
  ["current vocabulary item", { currentVocabItemId: "unknown-vocab" }, /未知 currentVocabItemId: unknown-vocab/],
  ["selected vocabulary group", { selectedVocabGroupId: "unknown-vocab-group" }, /未知 selectedVocabGroupId: unknown-vocab-group/],
  ["current practice item", { currentPracticeItemId: "unknown-practice" }, /未知 currentPracticeItemId: unknown-practice/],
  ["selected practice group", { selectedPracticeGroupId: "unknown-practice-group" }, /未知 selectedPracticeGroupId: unknown-practice-group/],
  ["selected reading unit", { selectedReadingUnitId: "unknown-reading-unit" }, /未知 selectedReadingUnitId: unknown-reading-unit/],
  ["selected reading group", { selectedReadingGroupId: "unknown-reading-group" }, /未知 selectedReadingGroupId: unknown-reading-group/],
  ["selected unit", { selectedUnitId: "unknown-unit" }, /未知 selectedUnitId: unknown-unit/],
  [
    "Latin writing progress key",
    { learningProgress: { latinWriting: { "unknown-latin-step": { completed: true } } } },
    /learningProgress\.latinWriting 包含未知 ID: unknown-latin-step/
  ],
  [
    "letter progress key",
    { learningProgress: { letters: { "unknown-letter-group": { completed: true } } } },
    /learningProgress\.letters 包含未知 ID: unknown-letter-group/
  ],
  [
    "combo progress key",
    { learningProgress: { combos: { "unknown-combo-group": { completed: true } } } },
    /learningProgress\.combos 包含未知 ID: unknown-combo-group/
  ],
  [
    "syllable progress key",
    { learningProgress: { syllableTraining: { "unknown-syllable-section": { completed: true } } } },
    /learningProgress\.syllableTraining 包含未知 ID: unknown-syllable-section/
  ],
  [
    "syllable submitted item key",
    { learningProgress: { syllableTraining: { "two-letter-warmup": { completedIds: ["warmup-unknown"] } } } },
    /learningProgress\.syllableTraining\.two-letter-warmup\.completedIds 包含未知 ID: warmup-unknown/
  ],
  [
    "premature syllable completion",
    { learningProgress: { syllableTraining: { "vowel-nucleus": { completedIds: ["vowel-nucleus-01"], completed: true } } } },
    /learningProgress\.syllableTraining\.vowel-nucleus 未提交全部题目，不能标记完成/
  ],
  [
    "complete syllable submissions missing completion",
    { learningProgress: { syllableTraining: { "vowel-nucleus": { completedIds: completeVowelNucleusIds } } } },
    /learningProgress\.syllableTraining\.vowel-nucleus 已提交全部题目，必须标记完成/
  ],
  [
    "complete syllable submissions with false completion",
    { learningProgress: { syllableTraining: { "vowel-nucleus": { completedIds: completeVowelNucleusIds, completed: false } } } },
    /learningProgress\.syllableTraining\.vowel-nucleus 已提交全部题目，必须标记完成/
  ],
  [
    "out-of-order syllable submission",
    { learningProgress: { syllableTraining: { "vowel-nucleus": { completedIds: ["vowel-nucleus-02"] } } } },
    /learningProgress\.syllableTraining\.vowel-nucleus\.completedIds 必须按课程顺序提交/
  ],
  [
    "rule progress before warmup completion",
    {
      learningProgress: {
        syllableTraining: {
          "two-letter-warmup": { completedIds: ["warmup-ba"] },
          "vowel-nucleus": { completedIds: ["vowel-nucleus-01"] }
        }
      }
    },
    /learningProgress\.syllableTraining 必须先完成 two-letter-warmup 才能记录 vowel-nucleus/
  ],
  [
    "rule two progress before rule one completion",
    {
      learningProgress: {
        syllableTraining: {
          "two-letter-warmup": completeWarmupProgress,
          "vowel-nucleus": { completedIds: ["vowel-nucleus-01"] },
          "single-consonant-boundary": { completedIds: ["single-consonant-boundary-01"] }
        }
      }
    },
    /learningProgress\.syllableTraining 必须先完成 vowel-nucleus 才能记录 single-consonant-boundary/
  ],
  [
    "rule three progress before rule two completion",
    {
      learningProgress: {
        syllableTraining: {
          "two-letter-warmup": completeWarmupProgress,
          "vowel-nucleus": completeVowelNucleusProgress,
          "single-consonant-boundary": { completedIds: ["single-consonant-boundary-01"] },
          "two-consonant-boundary": { completedIds: ["two-consonant-boundary-01"] }
        }
      }
    },
    /learningProgress\.syllableTraining 必须先完成 single-consonant-boundary 才能记录 two-consonant-boundary/
  ],
  [
    "rule four progress before rule three completion",
    {
      learningProgress: {
        syllableTraining: {
          "two-letter-warmup": completeWarmupProgress,
          "vowel-nucleus": completeVowelNucleusProgress,
          "single-consonant-boundary": completeSingleConsonantProgress,
          "two-consonant-boundary": { completedIds: ["two-consonant-boundary-01"] },
          "suffix-boundary": { completedIds: ["suffix-boundary-01"] }
        }
      }
    },
    /learningProgress\.syllableTraining 必须先完成 two-consonant-boundary 才能记录 suffix-boundary/
  ],
  [
    "connection progress before all rules complete",
    {
      learningProgress: {
        syllableTraining: {
          "two-letter-warmup": completeWarmupProgress,
          "vowel-nucleus": completeVowelNucleusProgress,
          "single-consonant-boundary": completeSingleConsonantProgress,
          "two-consonant-boundary": completeTwoConsonantProgress,
          "suffix-boundary": { completedIds: ["suffix-boundary-01"] },
          "connection-errors": { completedIds: ["connection-01"] }
        }
      }
    },
    /learningProgress\.syllableTraining 必须先完成 suffix-boundary 才能记录 connection-errors/
  ],
  [
    "out-of-order connection stage submission",
    { learningProgress: { syllableTraining: { "connection-errors": { completedIds: ["connection-02"] } } } },
    /learningProgress\.syllableTraining\.connection-errors\.completedIds 必须按课程顺序提交/
  ],
  [
    "premature connection stage completion",
    { learningProgress: { syllableTraining: { "connection-errors": { completedIds: ["connection-01"], completed: true } } } },
    /learningProgress\.syllableTraining\.connection-errors 未提交全部题目，不能标记完成/
  ],
  [
    "complete connection stage missing completion",
    { learningProgress: { syllableTraining: { "connection-errors": { completedIds: connectionStageIds } } } },
    /learningProgress\.syllableTraining\.connection-errors 已提交全部题目，必须标记完成/
  ],
  [
    "unknown imported syllable mistake",
    { syllableMistakes: { connection: ["connection-99"], break: [] } },
    /syllableMistakes\.connection 包含未知 ID: connection-99/
  ],
  [
    "imported connection mistake in break bucket",
    { syllableMistakes: { connection: [], break: ["connection-01"] } },
    /syllableMistakes\.break 的 connection-01 属于 connection 分类/
  ],
  [
    "vocabulary progress key",
    { learningProgress: { vocab: { "unknown-vocab-group": { completed: true } } } },
    /learningProgress\.vocab 包含未知 ID: unknown-vocab-group/
  ],
  [
    "practice progress key",
    { learningProgress: { practice: { "unknown-practice-group": { completed: true } } } },
    /learningProgress\.practice 包含未知 ID: unknown-practice-group/
  ],
  [
    "reading progress key",
    { learningProgress: { reading: { "unknown-reading-group": { completed: true } } } },
    /learningProgress\.reading 包含未知 ID: unknown-reading-group/
  ],
  [
    "mistake kind",
    {
      mistakes: [{
        key: "unknown:be", kind: "unknown", kindLabel: "字母", targetId: "be", pickedId: "", value: "ب",
        latin: "b", source: "错题", note: "note", help: "help", attempts: 1, createdAt: "2026-08-09T00:00:00.000Z"
      }]
    },
    /mistakes\[0\] 包含未知 kind: unknown/
  ],
  [
    "mistake key",
    {
      mistakes: [{
        key: "letter:pe", kind: "letter", kindLabel: "字母", targetId: "be", pickedId: "", value: "ب",
        latin: "b", source: "错题", note: "note", help: "help", attempts: 1, createdAt: "2026-08-09T00:00:00.000Z"
      }]
    },
    /mistakes\[0\] 的 key 与 kind\/targetId 不匹配/
  ],
  [
    "mistake target",
    {
      mistakes: [{
        key: "letter:unknown-letter", kind: "letter", kindLabel: "字母", targetId: "unknown-letter", pickedId: "", value: "ب",
        latin: "b", source: "错题", note: "note", help: "help", attempts: 1, createdAt: "2026-08-09T00:00:00.000Z"
      }]
    },
    /mistakes\[0\] 包含未知 targetId: unknown-letter/
  ],
  ["writing check", { writingChecks: ["shape", "unknown-check"] }, /writingChecks 包含未知 ID: unknown-check/],
  [
    "daily activity ID",
    { dailyActivity: { date: "2026-08-09", completedIds: ["letters:unknown-letter-group:viewed"] } },
    /dailyActivity\.completedIds 包含未知 ID: letters:unknown-letter-group:viewed/
  ]
];

for (const [label, data, expectedError] of semanticInvalidCases) {
  assert.throws(
    () => importProgressDirect(importTextWithData(data)),
    expectedError,
    `${label} should be rejected before preview`
  );
  assert.equal(storage["ana-tilim-progress"], storedBytesBeforeImport, `${label} rejection should preserve storage bytes`);
  assert.equal(
    vm.runInContext("JSON.stringify(buildLocalProgressData())", context),
    runtimeBytesBeforeSemanticFailures,
    `${label} rejection should preserve persisted runtime state`
  );
  assert.equal(
    vm.runInContext("JSON.stringify(state.pendingProgressImport)", context),
    pendingBytesBeforeSemanticFailures,
    `${label} rejection should preserve the previous pending preview`
  );
}
clickDataset({ action: "cancel-import-progress" });

await selectProgressImport(globalImportText);
assert.equal(
  storage["ana-tilim-progress"],
  storedBytesBeforeImport,
  "reselecting a valid import should still wait for confirmation"
);
clickDataset({ action: "confirm-import-progress" });
assert.equal(vm.runInContext("state.pendingProgressImport", context), null);
assert.equal(vm.runInContext("state.screen", context), "profile");
const replacedProgress = JSON.parse(storage["ana-tilim-progress"]);
assert.equal(
  replacedProgress.learningProgress.letters["dot-bone"].completed,
  true,
  "confirmation should replace local learning progress with the imported data"
);
assert.equal(
  replacedProgress.learningProgress.latinWriting.qwerty.completed,
  true,
  "confirmation should preserve a recognized Latin QWERTY completion"
);
assert.deepEqual(
  {
    currentLetterId: replacedProgress.currentLetterId,
    selectedGroupId: replacedProgress.selectedGroupId,
    currentComboItemId: replacedProgress.currentComboItemId,
    selectedComboGroupId: replacedProgress.selectedComboGroupId,
    currentVocabItemId: replacedProgress.currentVocabItemId,
    selectedVocabGroupId: replacedProgress.selectedVocabGroupId,
    currentPracticeItemId: replacedProgress.currentPracticeItemId,
    selectedPracticeGroupId: replacedProgress.selectedPracticeGroupId,
    selectedReadingUnitId: replacedProgress.selectedReadingUnitId,
    selectedReadingGroupId: replacedProgress.selectedReadingGroupId,
    selectedUnitId: replacedProgress.selectedUnitId
  },
  {
    currentLetterId: "be",
    selectedGroupId: "dot-bone",
    currentComboItemId: "ba",
    selectedComboGroupId: "open-a",
    currentVocabItemId: "yaxshimusiz",
    selectedVocabGroupId: "greetings",
    currentPracticeItemId: "practice-listen-be",
    selectedPracticeGroupId: "listening-loop",
    selectedReadingUnitId: "sentence-patterns",
    selectedReadingGroupId: "sentence-this-that",
    selectedUnitId: "letters"
  },
  "missing navigation fields should reset to clean learner defaults instead of preserving old positions"
);
assert.deepEqual(replacedProgress.mistakes, [], "missing mistakes should not preserve old records");
assert.deepEqual(replacedProgress.writingChecks, [], "missing writing checks should not preserve old records");
assert.equal(replacedProgress.favorite, false, "missing favorite should reset instead of preserving the old value");
assert.deepEqual(
  replacedProgress.localProfile,
  { displayName: "", avatarDataUrl: "" },
  "missing local profile should reset instead of preserving old device identity"
);
assert.deepEqual(
  replacedProgress.preferences,
  { audioAutoplay: false, dailyGoal: 10, learningReminder: false, showLatin: true },
  "missing preferences should use clean defaults"
);
assert.deepEqual(
  replacedProgress.dailyActivity,
  { date: "", completedIds: [] },
  "missing daily activity should reset instead of preserving old activity"
);
assert.notEqual(replacedProgress.modifiedAt, "2026-08-08T00:00:00.000Z");
assert.notEqual(replacedProgress.preferencesUpdatedAt, "2026-08-08T00:00:00.000Z");
assert.notEqual(replacedProgress.favoriteUpdatedAt, "2026-08-08T00:00:00.000Z");
assert.equal(vm.runInContext("state.authMode", context), "register", "import replacement should preserve auth mode");
assert.equal(
  vm.runInContext("state.authEmail", context),
  "keep-session@example.com",
  "import replacement should preserve in-memory auth session fields"
);
assert.equal(
  Object.prototype.hasOwnProperty.call(replacedProgress, "edition"),
  false,
  "confirmation should store envelope.data rather than nesting the envelope"
);
assert.equal(vm.runInContext("globalThis.importCloudScheduleCount", context), 1);
assert.equal(toast.textContent, "学习记录已导入");

const storageAfterConfirmedImport = storage["ana-tilim-progress"];
const slowImportText = JSON.stringify({
  ...JSON.parse(globalImportText),
  exportedAt: "2026-08-09T02:00:00.000Z"
});
const fastImportText = JSON.stringify({
  ...JSON.parse(globalImportText),
  exportedAt: "2026-08-09T03:00:00.000Z"
});

const slowFirstSelection = deferredProgressFile();
const fastSecondSelection = deferredProgressFile();
triggerProgressImportFile(slowFirstSelection.file);
triggerProgressImportFile(fastSecondSelection.file);
fastSecondSelection.resolveText(fastImportText);
await flushProgressImport();
assert.equal(
  vm.runInContext("state.pendingProgressImport.exportedAt", context),
  "2026-08-09T03:00:00.000Z",
  "the later fast selection should become the pending preview"
);
slowFirstSelection.resolveText(slowImportText);
await flushProgressImport();
assert.equal(
  vm.runInContext("state.pendingProgressImport.exportedAt", context),
  "2026-08-09T03:00:00.000Z",
  "a stale slow selection should not replace the newer preview"
);
assert.equal(
  storage["ana-tilim-progress"],
  storageAfterConfirmedImport,
  "overlapping file reads should not change confirmed storage"
);
clickDataset({ action: "cancel-import-progress" });

const staleErrorSelection = deferredProgressFile();
const newerSuccessSelection = deferredProgressFile();
triggerProgressImportFile(staleErrorSelection.file);
triggerProgressImportFile(newerSuccessSelection.file);
newerSuccessSelection.resolveText(fastImportText);
await flushProgressImport();
staleErrorSelection.rejectText(new Error("stale file read failed"));
await flushProgressImport();
assert.equal(
  vm.runInContext("state.pendingProgressImport.exportedAt", context),
  "2026-08-09T03:00:00.000Z",
  "a stale read error should not clear the newer successful preview"
);
assert.equal(toast.textContent, "请确认导入学习记录");
clickDataset({ action: "cancel-import-progress" });

await selectProgressImport(fastImportText);
assert.ok(app.innerHTML.includes('data-action="confirm-import-progress"'));
const writesBeforeSlowReplacement = progressStorageWriteCount;
const storageBeforeSlowReplacement = storage["ana-tilim-progress"];
const slowReplacementSelection = deferredProgressFile();
triggerProgressImportFile(slowReplacementSelection.file);
assert.equal(vm.runInContext("state.pendingProgressImport", context), null);
assert.ok(
  !app.innerHTML.includes('data-action="confirm-import-progress"'),
  "starting a new file read should immediately remove the stale confirmation action"
);
assert.equal(
  progressStorageWriteCount,
  writesBeforeSlowReplacement,
  "hiding the stale confirmation should not persist progress"
);
assert.equal(storage["ana-tilim-progress"], storageBeforeSlowReplacement);
slowReplacementSelection.resolveText(fastImportText);
await flushProgressImport();
clickDataset({ action: "cancel-import-progress" });

const canceledSelection = deferredProgressFile();
triggerProgressImportFile(canceledSelection.file);
clickDataset({ action: "cancel-import-progress" });
canceledSelection.resolveText(slowImportText);
await flushProgressImport();
assert.equal(
  vm.runInContext("state.pendingProgressImport", context),
  null,
  "canceling should invalidate an in-flight file read"
);
assert.equal(toast.textContent, "已取消导入");
assert.equal(storage["ana-tilim-progress"], storageAfterConfirmedImport);

const selectionFinishingAfterConfirm = deferredProgressFile();
triggerProgressImportFile(selectionFinishingAfterConfirm.file);
vm.runInContext(`importLocalProgressText(${JSON.stringify(fastImportText)}); render({ persist: false });`, context);
clickDataset({ action: "confirm-import-progress" });
const storageAfterSecondConfirmation = storage["ana-tilim-progress"];
selectionFinishingAfterConfirm.resolveText(slowImportText);
await flushProgressImport();
assert.equal(
  vm.runInContext("state.pendingProgressImport", context),
  null,
  "confirmation should invalidate any older in-flight file read"
);
assert.equal(
  storage["ana-tilim-progress"],
  storageAfterSecondConfirmation,
  "a file read finishing after confirmation should not rewrite confirmed storage"
);

await selectProgressImport(fastImportText);
const storageBeforeFailedImport = storage["ana-tilim-progress"];
const persistedStateBeforeFailedImport = vm.runInContext("JSON.stringify(buildLocalProgressData())", context);
storageWriteFailurePredicate = (key, value) =>
  key === "ana-tilim-progress" && JSON.parse(value).screen === "profile";
clickDataset({ action: "confirm-import-progress" });
storageWriteFailurePredicate = null;
assert.equal(
  toast.textContent,
  "导入失败，未能保存完整学习记录",
  "a failed final storage write should not report a successful import"
);
assert.equal(
  storage["ana-tilim-progress"],
  storageBeforeFailedImport,
  "a failed normalized write should preserve the exact previous storage bytes"
);
assert.equal(
  vm.runInContext("JSON.stringify(buildLocalProgressData())", context),
  persistedStateBeforeFailedImport,
  "a failed normalized write should restore the previous in-memory persisted state"
);
assert.equal(
  vm.runInContext("state.pendingProgressImport.exportedAt", context),
  "2026-08-09T03:00:00.000Z",
  "a failed final storage write should keep the parsed import available for retry"
);
clickDataset({ action: "confirm-import-progress" });
assert.equal(vm.runInContext("state.pendingProgressImport", context), null, "retry should clear pending after storage recovers");

await selectProgressImport(fastImportText);
const writesBeforeSingleConfirmation = progressStorageWriteCount;
const schedulesBeforeSingleConfirmation = vm.runInContext("globalThis.importCloudScheduleCount", context);
vm.runInContext("globalThis.cloudScheduleFailuresRemaining = 1", context);
clickDataset({ action: "confirm-import-progress" });
assert.equal(
  progressStorageWriteCount - writesBeforeSingleConfirmation,
  1,
  "one confirmation click should persist progress exactly once"
);
assert.equal(
  vm.runInContext("globalThis.importCloudScheduleCount", context) - schedulesBeforeSingleConfirmation,
  1,
  "one confirmation click should schedule cloud sync exactly once"
);
assert.equal(
  toast.textContent,
  "学习记录已导入",
  "a cloud scheduling exception should not misreport successful local persistence as an import failure"
);
assert.equal(vm.runInContext("state.pendingProgressImport", context), null);
assert.equal(JSON.parse(storage["ana-tilim-progress"]).screen, "profile");
assert.equal(
  vm.runInContext("state.syncDirty", context),
  true,
  "a failed cloud schedule should keep imported progress dirty for retry"
);
assert.equal(vm.runInContext("saveLocalProgress()", context), true, "local save should retry cloud scheduling after recovery");
assert.equal(vm.runInContext("state.syncDirty", context), false, "a successful retry should clear the dirty flag");

const hostileMistakeText = "<img src=x onerror=globalThis.hostileImportRan=true>";
const hostileProfileText = "<b>Profile</b>";
const hostileImportText = importTextWithData({
  screen: "practiceSession",
  selectedPracticeGroupId: "review-loop",
  currentPracticeItemId: "mistake-letter:be",
  mistakes: [
    {
      key: "letter:be",
      kind: "letter",
      kindLabel: hostileMistakeText,
      targetId: "be",
      pickedId: "pe",
      value: hostileMistakeText,
      latin: hostileMistakeText,
      source: hostileMistakeText,
      note: hostileMistakeText,
      help: hostileMistakeText,
      attempts: 1,
      createdAt: "2026-08-09T00:00:00.000Z"
    }
  ],
  localProfile: { displayName: hostileProfileText, avatarDataUrl: "" }
});
vm.runInContext(
  "globalThis.hostileImportRan = false; globalThis.hostileSavedCloudSync = cloudSync; cloudSync = null; cloudStatus = { phase: 'local', error: '' }",
  context
);
importProgressDirect(hostileImportText);
clickDataset({ action: "confirm-import-progress" });
assert.ok(app.innerHTML.includes("&lt;b&gt;Profile&lt;/b&gt;"), "imported profile markup should render as escaped literal text");
assert.doesNotMatch(app.innerHTML, /<b>Profile<\/b>/i, "imported profile markup must not create a real element");
vm.runInContext("state.screen = 'practiceSession'; render({ persist: false })", context);
assert.ok(app.innerHTML.includes("&lt;img src=x onerror=globalThis.hostileImportRan=true&gt;"), "imported mistake markup should render as escaped literal text");
assert.doesNotMatch(app.innerHTML, /<img\b[^>]*onerror/i, "imported mistake markup must not create an executable image tag");
assert.equal(vm.runInContext("globalThis.hostileImportRan", context), false, "hostile imported markup must not execute");
vm.runInContext(
  "cloudSync = globalThis.hostileSavedCloudSync; cloudStatus = { phase: 'signed-in', error: '' }; state.screen = 'profile'; state.profileNameEditing = false; render({ persist: false })",
  context
);
assert.match(
  signedInProfileHtml,
  /data-action="edit-display-name"/,
  "signed-in learners should edit their display name from the profile heading"
);
assert.doesNotMatch(signedInProfileHtml, /id="profile-display-name"/, "signed-in editor should stay collapsed by default");
clickDataset({ action: "edit-display-name" });
assert.match(app.innerHTML, /id="profile-display-name"[^>]+value="Nigar"/, "signed-in editing should prefill the cloud name");
assert.match(app.innerHTML, /data-action="save-display-name"[^>]*>[\s\S]*?保存/, "signed-in editing should provide save");
clickDataset({ action: "cancel-display-name" });
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
      latinWriting: {},
      letters: { "dot-bone": { completed: true } },
      combos: { "open-a": { completed: true } },
      syllableTraining: { "two-letter-warmup": { completedIds: ["warmup-ba"] } },
      vocab: { greetings: { completed: true } },
      practice: { "listening-loop": { completed: true } },
      reading: { "sentence-this-that": { completed: true } }
    };
    state.dailyActivity = {
      date: localDayKey(),
      completedIds: ["letters:dot-bone:viewed"]
    };
    state.mistakes = [{ key: "letter:be", targetId: "be" }];
    state.syllableMistakes = { connection: ["connection-01"], break: ["break-01"] };
    state.writingChecks = ["shape"];
    state.favorite = true;
    state.selectedPicture = "be";
    state.selectedListening = "practice-listen-be";
    state.practiceAudioPlayed = true;
    state.keyboardValue = "ب";
    state.syllableSectionId = "syllable-rules";
    state.syllableItemIndex = 7;
    state.syllableRuleId = "single-consonant-boundary";
    state.syllableAnswerId = "distractor";
    state.syllableShowStandard = true;
    state.syllableAnswerSubmitted = true;
    state.syllableConnectionAnswerId = "statement-correct";
    state.syllableConnectionSubmitted = true;
    state.syllableConnectionMode = "review-break";
    state.syllableConnectionReviewItemId = "break-01";
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
    syllableMistakes: state.syllableMistakes,
    writingChecks: state.writingChecks,
    favorite: state.favorite,
    selectedPicture: state.selectedPicture,
    selectedListening: state.selectedListening,
    practiceAudioPlayed: state.practiceAudioPlayed,
    keyboardValue: state.keyboardValue,
    syllableSectionId: state.syllableSectionId,
    syllableItemIndex: state.syllableItemIndex,
    syllableRuleId: state.syllableRuleId,
    syllableAnswerId: state.syllableAnswerId,
    syllableShowStandard: state.syllableShowStandard,
    syllableAnswerSubmitted: state.syllableAnswerSubmitted,
    syllableConnectionAnswerId: state.syllableConnectionAnswerId,
    syllableConnectionSubmitted: state.syllableConnectionSubmitted,
    syllableConnectionMode: state.syllableConnectionMode,
    syllableConnectionReviewItemId: state.syllableConnectionReviewItemId,
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
      syllableMistakes: state.syllableMistakes,
      writingChecks: state.writingChecks,
      favorite: state.favorite,
      selectedPicture: state.selectedPicture,
      selectedListening: state.selectedListening,
      practiceAudioPlayed: state.practiceAudioPlayed,
      keyboardValue: state.keyboardValue,
      syllableSectionId: state.syllableSectionId,
      syllableItemIndex: state.syllableItemIndex,
      syllableRuleId: state.syllableRuleId,
      syllableAnswerId: state.syllableAnswerId,
      syllableShowStandard: state.syllableShowStandard,
      syllableAnswerSubmitted: state.syllableAnswerSubmitted,
      syllableConnectionAnswerId: state.syllableConnectionAnswerId,
      syllableConnectionSubmitted: state.syllableConnectionSubmitted,
      syllableConnectionMode: state.syllableConnectionMode,
      syllableConnectionReviewItemId: state.syllableConnectionReviewItemId,
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
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.syllableMistakes)", context)),
  { connection: [], break: [] },
  "successful clear should empty both syllable mistake buckets"
);
assert.equal(vm.runInContext("state.writingChecks.length", context), 0);
assert.equal(vm.runInContext("state.favorite", context), false);
assert.equal(vm.runInContext("state.dailyActivity.completedIds.length", context), 0);
assert.equal(vm.runInContext("Object.keys(state.learningProgress.letters).length", context), 0);
assert.equal(vm.runInContext("Object.keys(state.learningProgress.combos).length", context), 0);
assert.equal(vm.runInContext("Object.keys(state.learningProgress.syllableTraining).length", context), 0);
assert.equal(vm.runInContext("Object.keys(state.learningProgress.vocab).length", context), 0);
assert.equal(vm.runInContext("Object.keys(state.learningProgress.practice).length", context), 0);
assert.equal(vm.runInContext("Object.keys(state.learningProgress.reading).length", context), 0);
assert.equal(vm.runInContext("state.selectedPicture", context), "");
assert.equal(vm.runInContext("state.selectedListening", context), "");
assert.equal(vm.runInContext("state.practiceAudioPlayed", context), false);
assert.equal(vm.runInContext("state.keyboardValue", context), "");
assert.equal(vm.runInContext("state.syllableSectionId", context), "two-letter-warmup");
assert.equal(vm.runInContext("state.syllableItemIndex", context), 0);
assert.equal(vm.runInContext("state.syllableRuleId", context), "vowel-nucleus");
assert.equal(vm.runInContext("state.syllableAnswerId", context), "");
assert.equal(vm.runInContext("state.syllableShowStandard", context), false);
assert.equal(vm.runInContext("state.syllableAnswerSubmitted", context), false);
assert.equal(vm.runInContext("state.syllableConnectionAnswerId", context), "");
assert.equal(vm.runInContext("state.syllableConnectionSubmitted", context), false);
assert.equal(vm.runInContext("state.syllableConnectionMode", context), "lesson");
assert.equal(vm.runInContext("state.syllableConnectionReviewItemId", context), "");
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
  /profile-hero-card[\s\S]*(?:学习账号|本地学习)[\s\S]*profile-settings-card/.test(profileHtml),
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
  /profile-hero-card[\s\S]*(?:学习账号|本地学习)[\s\S]*profile-account-metrics[\s\S]*连续学习[\s\S]*今日待复习[\s\S]*总进度/.test(profileHtml),
  "profile metrics should appear directly below the learning account section"
);
assert.ok(!profileHtml.includes("录音与上传"), "profile screen should no longer lead with recording/upload tooling");
assert.ok(!profileHtml.includes("我的录音"), "profile screen should move the recording center into its own nav tab");

clickDataset({ action: "toggle-audio-autoplay" });
assert.equal(savedProgress().preferences.audioAutoplay, true);

vm.runInContext(
  "state.currentLetterId = 'be'; state.selectedGroupId = 'dot-bone'; state.dailyActivity = { date: localDayKey(), completedIds: [] }; state.preferences.dailyGoal = 15;",
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
    "第二单元：拉丁键盘与字母书写强化",
    "第四单元：拼读与音节训练营",
    "第五单元：日常用语与词汇",
    "第六单元：语法入门",
    "第七单元：基础句型",
    "第八单元：对话小剧场",
    "第九单元：小故事",
    "第十单元：维吾尔谚语",
    "第十一单元：名人名言",
    "问候、人称代词、称呼、数字、动物"
  ],
  "learning path with reading units"
);
assertLearnerCopyClean("learning path");
assert.ok(!app.innerHTML.includes("听说与书写强化"), "learning path should remove the old third practice unit");
assert.ok(!app.innerHTML.includes("第三单元：字母连接规律"), "learning path should remove the separate connection unit");
assert.equal((app.innerHTML.match(/class="lesson-step"/g) || []).length, 11, "learning path should show eleven learning units");
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
  ["第三单元：基础组合", "开口组合", "轻声组合", "连续连接：三字母", "连接会断开的字母"],
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
  readingValueStyle.includes('font-family: "Scheherazade New", "Noto Naskh Arabic", serif;') &&
    readingValueStyle.includes("font-weight: 600;"),
  "all reading sentences should use the bundled Scheherazade New semibold style"
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

renderState("state.screen = 'profile'; state.learningProgress = emptyLearningProgress(); state.mistakes = []; state.dailyActivity = { date: localDayKey(), completedIds: [] }");
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
    formExampleWordTextStyle.includes('font-family: "Scheherazade New", "Noto Naskh Arabic", serif;'),
  "letter form words should use the bundled Scheherazade New shape"
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
  ["读音选择", "选择正确字母", "b", "audio-focus", "audio-only-focus", "letter-focus-play", ">听</button>"],
  "letter sound-choice exercise"
);
for (const hiddenAudioText of ["播放或查看读音", "真人音频：", "音频待录", "音频未生成时"]) {
  assert.ok(!letterSoundChoiceHtml.includes(hiddenAudioText), `letter sound-choice should hide audio helper text ${hiddenAudioText}`);
}
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
  ["第三单元：基础组合", "连接会断开的字母", "1 / 6", "دادا", "拆开看", "实际连写形", "独立式写法", "在词首位置，但这个字母后面通常不继续连接", "不接前一个字母，后面也断开"],
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
  ["第五单元：日常用语与词汇", "本课词汇", "vocab-subgroup", "ئانا", 'class="latin-transliteration vocab-latin"', ">ana<", "妈妈、母亲", "点维语词播放；点右侧解释选择词"],
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

const pointRecognitionHtml = renderState("state.screen = 'picture'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'; state.selectedPicture = ''");
const pointRecognitionChoices = pointRecognitionHtml.match(/<div class="choice-grid">([\s\S]*?)<\/div>\s*<button class="primary-button"/)?.[1] || "";
assert.equal(
  (pointRecognitionChoices.match(/class="choice-card letter-only-choice"/g) || []).length,
  3,
  "point recognition should show every choice as a letter-only button"
);
for (const hiddenAnswer of ["<strong>", "class=\"caption\"", "class=\"step-state\"", ">选择<", "下方一个点", "下方三个点", "上方两个点", ">b<", ">p<", ">t<"]) {
  assert.ok(!pointRecognitionChoices.includes(hiddenAnswer), `point recognition choices should hide answer hint ${hiddenAnswer}`);
}
clickDataset({ action: "pick-picture", id: "pe" });
let mistakeSummary = vm.runInContext("state.mistakes.map((item) => item.targetId).join(',')", context);
assert.equal(mistakeSummary, "be", "wrong letter choice should create a review item");
includesAll(app.innerHTML, ["再看点位和点数"], "letter point-recognition retry feedback");
const pointRecognitionFeedback = app.innerHTML.match(/<div class="feedback bad">([\s\S]*?)<\/div>/)?.[1] || "";
for (const hiddenFeedback of ["目标是 ب", "你选了 پ", "下方一个点", "下方三个点"]) {
  assert.ok(!pointRecognitionFeedback.includes(hiddenFeedback), `point recognition feedback should hide answer hint ${hiddenFeedback}`);
}
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
includesAll(
  app.innerHTML,
  ['aria-label="维吾尔语标准键盘"', "uyghur-keyboard-row row-top", "uyghur-keyboard-row row-home", "uyghur-keyboard-row row-bottom", 'data-physical-key="Q"', 'data-action="toggle-keyboard-shift"'],
  "real Uyghur keyboard layout"
);
assert.ok(!app.innerHTML.includes('aria-label="本组字母快捷键"'), "real keyboard should replace the redundant group shortcut row");
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
  ["继续学习本单元下一课程", "下一步建议", "复习本组", "进入第二单元"],
  "unit one complete"
);
assert.ok(app.innerHTML.includes("ب / پ"), "unit one completion should separate learned letters with punctuation");
assert.ok(app.innerHTML.includes('data-action="open-group" data-id="curved"'), "completion should point to the next alphabet group");
clickDataset({ action: "open-group", id: "curved" });
assert.equal(vm.runInContext("state.selectedGroupId", context), "curved", "continue should enter the next alphabet group");
assert.equal(vm.runInContext("state.currentLetterId", context), "jim", "continue should start from the next group's first letter");
assert.equal(vm.runInContext("state.screen", context), "group", "continue should open the next lesson");
const lastAlphabetGroupComplete = renderState("state.screen = 'complete'; state.selectedGroupId = 'tail'; state.currentLetterId = 'waw'");
assert.ok(!lastAlphabetGroupComplete.includes("继续学习本单元下一课程"), "the last alphabet group should not show a nonexistent next lesson");

const comboCompleteHtml = renderState("state.screen = 'comboComplete'; state.selectedComboGroupId = 'open-a'; state.currentComboItemId = 'ba'");
includesAll(
  comboCompleteHtml,
  ["继续学习本单元下一课程", "下一步建议", "复习组合", "进入第四单元"],
  "unit two complete"
);
assert.ok(
  comboCompleteHtml.includes('data-action="open-combo-group" data-id="soft-e"'),
  "unit two completion should point to the next combination course"
);
clickDataset({ action: "open-combo-group", id: "soft-e" });
assert.equal(vm.runInContext("state.selectedComboGroupId", context), "soft-e", "combo continuation should open the next course");
assert.equal(vm.runInContext("state.currentComboItemId", context), "be-e", "combo continuation should start at the next course's first item");
const lastComboComplete = renderState("state.screen = 'comboComplete'; state.selectedComboGroupId = 'connection-breaks'; state.currentComboItemId = 'dada-connection'");
assert.ok(!lastComboComplete.includes("继续学习本单元下一课程"), "the last combo course should not show a nonexistent continuation");
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
  ["键盘步骤", "ئ → ا → ن → ا", "点击 ئ", "还差 4 键"],
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
  ["维吾尔语标准键盘", "键盘工具", "practice-target-card", "letter-focus-play", "data-key=\"ك\"", "删除", "بوشلۇق"],
  "practice standard keyboard"
);
assert.equal((app.innerHTML.match(/data-action="play-audio"/g) || []).length, 1, "practice keyboard should keep one listen button in the gradient target card");
assert.ok(!app.innerHTML.includes("audio-focus"), "practice keyboard should not show a separate audio strip below the target card");
assert.equal((app.innerHTML.match(/data-physical-key=/g) || []).length, 28, "practice keyboard should show 27 visible character keys plus the Space key");
for (const removedPhrase of ["键盘步骤", "点击 ك", "还差 1 键", "当前复习项快捷键", "done-key", "提示："]) {
  assert.ok(!app.innerHTML.includes(removedPhrase), `practice standard keyboard should remove ${removedPhrase}`);
}
clickDataset({ action: "key", key: "ب" });
assert.equal(vm.runInContext("state.mistakes.length", context), 1, "wrong practice keyboard key should enter local mistakes");
assert.equal(vm.runInContext("state.mistakes[0].targetId", context), "practice-keyboard-kaf", "practice keyboard mistake should track the target item");
assert.ok(!app.innerHTML.includes("未完成，请删除后重试。"), "practice random keyboard should not show wrong-input feedback");
renderState("state.screen = 'practiceSession'; state.selectedPracticeGroupId = 'keyboard-loop'; state.currentPracticeItemId = 'practice-keyboard-kaf'; state.keyboardValue = 'ك'");
assert.ok(!app.innerHTML.includes("输入正确。本轮键盘练习完成。"), "practice random keyboard should not show correct-input feedback");
assert.ok(!app.innerHTML.includes("对比正确写法"), "practice keyboard entry should not show writing comparison");
assert.ok(!app.innerHTML.includes("完成后评价"), "practice keyboard entry should not show writing self-check");

const visibleUnitIdsWithSyllableTraining = JSON.parse(
  vm.runInContext("JSON.stringify(learningUnits.map((unit) => unit.id))", context)
);
assert.equal(visibleUnitIdsWithSyllableTraining.length, 11, "global edition should expose the new syllable unit atomically");
assert.deepEqual(
  visibleUnitIdsWithSyllableTraining.slice(0, 5),
  ["letters", "latin-keyboard-writing", "combos", "syllable-training", "basic-phrases"],
  "syllable training should sit after combinations and before daily vocabulary"
);

const combosBeforeSyllableTraining = JSON.parse(
  vm.runInContext("JSON.stringify(state.learningProgress.combos)", context)
);
const syllableUnitHtml = renderState(
  "state.screen = 'unit'; state.selectedUnitId = 'syllable-training'; state.syllableItemIndex = 0; state.syllableShowStandard = false"
);
assert.match(
  syllableUnitHtml,
  /data-action="go"[^>]*data-target="syllableWarmup"[^>]*>\s*进入当前学习\s*<\/button>/,
  "the visible syllable unit should link to a real warmup screen"
);
assert.match(
  syllableUnitHtml,
  /data-action="go"[^>]*data-target="syllableReview"[^>]*>\s*复习连接与断开错题\s*<\/button>/,
  "the syllable unit detail should expose the real split mistake review entry"
);
clickDataset({ action: "go", target: "syllableReview" });
assert.equal(vm.runInContext("state.screen", context), "syllableReview", "the unit detail review entry should open the review screen");
assert.match(
  app.innerHTML,
  /data-action="go"[^>]*data-target="unit"[^>]*aria-label="返回"/,
  "review opened from the fourth-unit detail should return to that unit detail"
);
clickDataset({ action: "go", target: "unit" });
assert.equal(vm.runInContext("state.screen", context), "unit", "the fourth-unit review back button should restore the unit detail");
clickDataset({ action: "go", target: "syllableWarmup" });
assert.equal(vm.runInContext("state.screen", context), "syllableWarmup", "the syllable unit entry must not be dead");
includesAll(app.innerHTML, ["两字母热身", "warmup-ba", "ب", "ا", "合起来读", "1 / 10"], "syllable warmup parts");
assert.match(app.innerHTML, /data-target="unit"[^>]*aria-label="返回"/, "the warmup back button should return to the fourth-unit detail");
assert.match(app.innerHTML, /data-syllable-part="0"[\s\S]*?data-syllable-part="1"/, "warmup should expose the two source parts in order");
assert.doesNotMatch(app.innerHTML, /data-syllable-standard/, "warmup must hide the standard form before the learner combines it");
assert.doesNotMatch(app.innerHTML, /data-action="play-audio"/, "warmup must hide audio before the combine action");

clickDataset({ action: "combine-syllable-warmup" });
includesAll(
  app.innerHTML,
  [
    'data-syllable-standard="warmup-ba"',
    "با",
    "ba",
    'data-audio-src="./assets/audio/human/combos/human_combo_ba.webm"',
    "真人音频"
  ],
  "revealed syllable warmup"
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.learningProgress.syllableTraining['two-letter-warmup'])", context)),
  { completedIds: ["warmup-ba"] },
  "combining the first item should save only the source-backed warmup item"
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.learningProgress.combos)", context)),
  combosBeforeSyllableTraining,
  "syllable warmup progress must not mutate combination progress"
);

for (let index = 1; index < 10; index += 1) {
  clickDataset({ action: "next-syllable-warmup" });
  assert.equal(vm.runInContext("state.syllableItemIndex", context), index, `warmup should advance to item ${index + 1}`);
  assert.doesNotMatch(app.innerHTML, /data-syllable-standard/, "each next warmup should start with the answer hidden");
  clickDataset({ action: "combine-syllable-warmup" });
}
assert.equal(
  vm.runInContext("state.learningProgress.syllableTraining['two-letter-warmup'].completed", context),
  true,
  "all ten revealed source items should complete the warmup"
);
assert.equal(
  vm.runInContext("state.learningProgress.syllableTraining['two-letter-warmup'].completedIds.length", context),
  10,
  "warmup completion should retain all ten stable item IDs"
);
assert.match(
  app.innerHTML,
  /data-action="go"[^>]*data-target="syllableRules"[^>]*>\s*继续：音节划分策略\s*<\/button>/,
  "the final warmup should link to the real rule screen"
);

clickDataset({ action: "go", target: "syllableRules" });
assert.equal(vm.runInContext("state.screen", context), "syllableRules");
assert.match(app.innerHTML, /data-target="syllableWarmup"[^>]*aria-label="返回"/, "the rule back button should return to the warmup stage");
includesAll(
  app.innerHTML,
  ["音节划分策略", "先找元音中心", "入门范围", "با 有几个候选音节中心？", "1 / 4", "1 / 4 条规则"],
  "first syllable rule and its first exercise"
);
assert.ok(!app.innerHTML.includes("一个辅音时先尝试向后分"), "the next rule must remain locked until all four current exercises are submitted");
assert.equal((app.innerHTML.match(/data-action="pick-syllable-rule-answer"/g) || []).length, 2, "each exercise should offer one approved answer and one distractor");

focusedSyllableSelector = "";
clickDataset({ action: "pick-syllable-rule-answer", answerId: "answer" });
assert.equal(
  focusedSyllableSelector,
  '[data-action="pick-syllable-rule-answer"][data-answer-id="answer"]',
  "selecting a rule answer should restore focus to the selected option after render"
);
let syllableArrowPrevented = false;
keydownHandler({
  key: "ArrowDown",
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  target: {
    closest(selector) {
      assert.equal(selector, '[data-action="pick-syllable-rule-answer"]');
      return { dataset: { answerId: "answer" } };
    }
  },
  preventDefault() {
    syllableArrowPrevented = true;
  }
});
assert.equal(syllableArrowPrevented, true, "arrow navigation between rule answers should prevent page scrolling");
assert.equal(vm.runInContext("state.syllableAnswerId", context), "distractor", "ArrowDown should move to the next rule answer");
assert.equal(
  focusedSyllableSelector,
  '[data-action="pick-syllable-rule-answer"][data-answer-id="distractor"]',
  "keyboard answer navigation should restore focus to the new option"
);
clickDataset({ action: "submit-syllable-rule-answer" });
includesAll(app.innerHTML, ["再看一次规则", "这是帮助初学者找候选音节的方法", "继续下一题"], "wrong syllable answer feedback");
includesAll(
  app.innerHTML,
  ['data-syllable-question', 'tabindex="-1"', 'aria-labelledby="syllable-exercise-prompt-vowel-nucleus-01"', 'data-syllable-feedback'],
  "focusable syllable question and feedback regions"
);
assert.equal(focusedSyllableSelector, "[data-syllable-feedback]", "submitting a rule answer should focus its feedback");
includesAll(
  app.innerHTML,
  ['data-syllable-exercise-id="vowel-nucleus-01"', "با 有几个候选音节中心？", "1 / 4"],
  "submitted first syllable exercise feedback"
);
assert.match(
  app.innerHTML,
  /data-syllable-exercise-id="vowel-nucleus-01"[\s\S]*?<h2 class="section-title">1 \/ 4<\/h2>/,
  "submitted exercise one should keep its own 1 / 4 counter before Continue"
);
assert.ok(
  !app.innerHTML.includes("بە 有几个候选音节中心？"),
  "submitting exercise one must not replace its prompt with exercise two before Continue"
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.learningProgress.syllableTraining['vowel-nucleus'])", context)),
  { completedIds: ["vowel-nucleus-01"] },
  "a wrong submitted answer should count as submitted without falsely completing the rule"
);
clickDataset({ action: "next-syllable-rule-exercise" });
assert.ok(app.innerHTML.includes("بە 有几个候选音节中心？"), "the learner should be able to continue after a wrong answer");
assert.equal(focusedSyllableSelector, "[data-syllable-question]", "continuing should focus the next question region");

for (let exerciseIndex = 1; exerciseIndex < 4; exerciseIndex += 1) {
  clickDataset({ action: "pick-syllable-rule-answer", answerId: "answer" });
  clickDataset({ action: "submit-syllable-rule-answer" });
  if (exerciseIndex < 3) clickDataset({ action: "next-syllable-rule-exercise" });
}
assert.equal(
  vm.runInContext("state.learningProgress.syllableTraining['vowel-nucleus'].completed", context),
  true,
  "the rule should complete after all four submissions regardless of one wrong answer"
);
includesAll(app.innerHTML, ["4 / 4", "下一条规则"], "completed first syllable rule");
clickDataset({ action: "next-syllable-rule" });
includesAll(app.innerHTML, ["一个辅音时先尝试向后分", "仅用于下列已核对例子", "1 / 4", "2 / 4 条规则"], "second syllable rule");
assert.ok(!app.innerHTML.includes("辅音群内部逐词判断"), "the third rule must remain locked while the second rule is active");

const completedSyllablePrerequisites = {
  "two-letter-warmup": {
    completedIds: [
      "warmup-ba", "warmup-pa", "warmup-ta", "warmup-na", "warmup-la",
      "warmup-ma", "warmup-be-e", "warmup-pe-e", "warmup-te-e", "warmup-ne-e"
    ],
    completed: true
  },
  "vowel-nucleus": {
    completedIds: ["vowel-nucleus-01", "vowel-nucleus-02", "vowel-nucleus-03", "vowel-nucleus-04"],
    completed: true
  },
  "single-consonant-boundary": {
    completedIds: [
      "single-consonant-boundary-01", "single-consonant-boundary-02",
      "single-consonant-boundary-03", "single-consonant-boundary-04"
    ],
    completed: true
  },
  "two-consonant-boundary": {
    completedIds: [
      "two-consonant-boundary-01", "two-consonant-boundary-02",
      "two-consonant-boundary-03", "two-consonant-boundary-04"
    ],
    completed: true
  },
  "suffix-boundary": {
    completedIds: ["suffix-boundary-01", "suffix-boundary-02", "suffix-boundary-03", "suffix-boundary-04"],
    completed: true
  }
};

renderState(`
  state.learningProgress = emptyLearningProgress();
  state.syllableMistakes = { connection: [], break: [] };
  state.screen = "syllableReview";
  state.syllableConnectionMode = "lesson";
  state.syllableConnectionAnswerId = "";
  state.syllableConnectionSubmitted = false;
`);
assert.match(
  app.innerHTML,
  /data-action="go"[^>]*data-target="syllableWarmup"[^>]*aria-label="返回"/,
  "an empty review screen should return a fresh learner to the reachable warmup instead of the locked lesson"
);
clickDataset({ action: "go", target: "syllableConnections" });
assert.equal(
  vm.runInContext("state.screen", context),
  "syllableWarmup",
  "the real lesson route should normalize a fresh learner to the reachable warmup"
);
assert.equal(
  vm.runInContext("state.learningProgress.syllableTraining['connection-errors']", context),
  undefined,
  "a blocked lesson route must not create connection progress"
);

renderState(`
  state.learningProgress = emptyLearningProgress();
  state.syllableMistakes = { connection: [], break: [] };
  state.screen = "syllableConnections";
  state.syllableConnectionMode = "lesson";
  state.syllableConnectionAnswerId = "statement-correct";
  state.syllableConnectionSubmitted = false;
`);
assert.equal(
  vm.runInContext("state.screen", context),
  "syllableWarmup",
  "the connection renderer should normalize an unreachable persisted lesson screen"
);
assert.ok(!app.innerHTML.includes("连读与断读专项"), "the render gate should not expose locked connection content");
clickDataset({ action: "submit-syllable-connection-answer" });
assert.equal(
  vm.runInContext("state.screen", context),
  "syllableWarmup",
  "the submit handler should keep an unreachable lesson at the reachable prerequisite"
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.syllableMistakes)", context)),
  { connection: [], break: [] },
  "a blocked submit must not create a syllable mistake"
);
assert.equal(
  vm.runInContext("state.learningProgress.syllableTraining['connection-errors']", context),
  undefined,
  "a blocked submit must not create progress that hydration would reject"
);

const completedRulesWithoutWarmup = JSON.parse(JSON.stringify(completedSyllablePrerequisites));
delete completedRulesWithoutWarmup["two-letter-warmup"];
renderState(`
  state.learningProgress = emptyLearningProgress();
  state.learningProgress.syllableTraining = ${JSON.stringify(completedRulesWithoutWarmup)};
  state.syllableMistakes = { connection: [], break: [] };
  state.screen = "syllableConnections";
  state.syllableConnectionMode = "lesson";
  state.syllableConnectionAnswerId = "";
  state.syllableConnectionSubmitted = false;
`);
assert.equal(
  vm.runInContext("state.screen", context),
  "syllableWarmup",
  "the lesson gate should require the complete warmup-to-rules prefix, not isolated rule flags"
);

const unreachableConnectionSave = JSON.parse(
  vm.runInContext(
    `JSON.stringify({ ...buildLocalProgressData(), screen: "syllableConnections", learningProgress: emptyLearningProgress() })`,
    context
  )
);
assert.doesNotThrow(
  () => vm.runInContext(`validateImportedProgressIds(${JSON.stringify(unreachableConnectionSave)})`, context),
  "semantic ID validation should leave unreachable route normalization to the hydration boundary"
);
assert.equal(
  vm.runInContext(`applyLocalProgressData(${JSON.stringify(unreachableConnectionSave)})`, context),
  true,
  "direct hydration should normalize the same unreachable lesson screen"
);
assert.equal(vm.runInContext("state.screen", context), "syllableWarmup", "unreachable connection hydration should land on warmup");
assert.equal(
  vm.runInContext('applyLocalProgressData({ screen: "syllableConnections" })', context),
  true,
  "legacy hydration should normalize an unreachable lesson screen when learningProgress is omitted"
);
assert.equal(vm.runInContext("state.screen", context), "syllableWarmup", "legacy connection hydration should also land on warmup");

renderState(`
  state.learningProgress = emptyLearningProgress();
  state.syllableMistakes = { connection: ["connection-01"], break: [] };
  state.screen = "syllableReview";
  state.syllableConnectionMode = "lesson";
  state.syllableConnectionReviewItemId = "";
`);
clickDataset({ action: "review-syllable-mistakes", mistakeBucket: "connection" });
assert.equal(vm.runInContext("state.screen", context), "syllableConnections", "a real saved mistake should remain reviewable without lesson prerequisites");
assert.equal(vm.runInContext("state.syllableConnectionMode", context), "review-connection");
assert.ok(app.innerHTML.includes("错题复习 · 连接判断"), "the independent review mode should render its real approved item");
assert.equal(
  vm.runInContext("buildLocalProgressData().screen", context),
  "syllableReview",
  "saving an independent review item should persist the hydratable review index rather than a locked lesson route"
);

renderState(`
  state.screen = "syllableRules";
  state.syllableRuleId = "suffix-boundary";
  state.syllableAnswerId = "";
  state.syllableAnswerSubmitted = false;
  state.learningProgress = emptyLearningProgress();
  state.learningProgress.syllableTraining = ${JSON.stringify(completedSyllablePrerequisites)};
`);
assert.match(
  app.innerHTML,
  /data-action="go"[^>]*data-target="syllableConnections"[^>]*>\s*继续：连读与断读专项\s*<\/button>/,
  "finishing all four rule cards should continue to the real connection and break training"
);
clickDataset({ action: "go", target: "syllableConnections" });
assert.equal(vm.runInContext("state.screen", context), "syllableConnections", "the connection stage target should be a real screen");
assert.match(app.innerHTML, /data-target="syllableRules"[^>]*aria-label="返回"/, "the lesson connection back button should return to the rule stage");
includesAll(
  app.innerHTML,
  ["连读与断读专项", "بال", "开头 ب 与后面的 ا 连接。", "1 / 12"],
  "first approved textual connection judgment"
);
assert.ok(!app.innerHTML.includes("错误判断："), "the learner-facing statement must not reveal that the approved candidate is wrong");
assert.ok(
  !app.innerHTML.includes("开头 ب 与后面的 ا 连接；ا 后不继续连接 ل。"),
  "a connection explanation must stay hidden until the learner answers"
);
const genericMistakesBeforeSyllableJudgments = vm.runInContext("JSON.stringify(state.mistakes)", context);
focusedSyllableSelector = "";
clickDataset({ action: "pick-syllable-connection-answer", answerId: "statement-correct" });
assert.equal(
  vm.runInContext("state.syllableConnectionAnswerId", context),
  "statement-correct",
  "the real connection judgment option should select through delegated click handling"
);
assert.equal(
  focusedSyllableSelector,
  '[data-action="pick-syllable-connection-answer"][data-answer-id="statement-correct"]',
  "a connection option click should restore focus after rerender"
);
let syllableConnectionArrowPrevented = false;
keydownHandler({
  key: "ArrowDown",
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  target: {
    closest(selector) {
      assert.equal(selector, '[data-action="pick-syllable-connection-answer"]');
      return { dataset: { answerId: "statement-correct" } };
    }
  },
  preventDefault() {
    syllableConnectionArrowPrevented = true;
  }
});
assert.equal(syllableConnectionArrowPrevented, true, "arrow navigation between connection answers should prevent page scrolling");
assert.equal(vm.runInContext("state.syllableConnectionAnswerId", context), "statement-incorrect");
assert.equal(
  focusedSyllableSelector,
  '[data-action="pick-syllable-connection-answer"][data-answer-id="statement-incorrect"]',
  "connection keyboard navigation should focus the newly selected option"
);
assert.ok(
  !app.innerHTML.includes("开头 ب 与后面的 ا 连接；ا 后不继续连接 ل。"),
  "selecting without submitting must not reveal the approved explanation"
);
clickDataset({ action: "submit-syllable-connection-answer" });
includesAll(
  app.innerHTML,
  ["回答错误", "开头 ب 与后面的 ا 连接；ا 后不继续连接 ل。", "继续下一题"],
  "submitted wrong connection judgment feedback"
);
includesAll(
  app.innerHTML,
  ['data-syllable-connection-question', 'tabindex="-1"', 'aria-labelledby="syllable-connection-statement-connection-01"', 'data-syllable-connection-feedback'],
  "connection question and feedback should expose programmatic focus targets"
);
assert.equal(focusedSyllableSelector, "[data-syllable-connection-feedback]", "submitting a connection answer should focus its feedback");
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.syllableMistakes)", context)),
  { connection: ["connection-01"], break: [] },
  "a wrong connection judgment should enter only the connection mistake bucket"
);
assert.equal(
  vm.runInContext("JSON.stringify(state.mistakes)", context),
  genericMistakesBeforeSyllableJudgments,
  "syllable judgments must not write into generic mistakes"
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.learningProgress.syllableTraining['connection-errors'])", context)),
  { completedIds: ["connection-01"] },
  "the first submitted judgment should write only the connection stage progress"
);

const wrongSyllableJudgmentIndexes = new Set([1, 6]);
for (let itemIndex = 1; itemIndex < 12; itemIndex += 1) {
  clickDataset({ action: "next-syllable-connection" });
  if (itemIndex === 1) {
    assert.equal(focusedSyllableSelector, "[data-syllable-connection-question]", "Continue should focus the next connection question");
  }
  const expectedItem = JSON.parse(
    vm.runInContext(`JSON.stringify(syllableTraining.connectionItems[${itemIndex}])`, context)
  );
  includesAll(
    app.innerHTML,
    [expectedItem.standard, expectedItem.statement, `${itemIndex + 1} / 12`],
    `connection judgment ${expectedItem.id}`
  );
  assert.ok(!app.innerHTML.includes("错误判断："), `${expectedItem.id} should present a neutral statement without the answer label`);
  assert.ok(!app.innerHTML.includes(expectedItem.explanation), `${expectedItem.id} should hide its explanation before answer`);
  const selectedAnswer = wrongSyllableJudgmentIndexes.has(itemIndex)
    ? expectedItem.expectedAnswer === "statement-correct"
      ? "statement-incorrect"
      : "statement-correct"
    : expectedItem.expectedAnswer;
  clickDataset({
    action: "pick-syllable-connection-answer",
    answerId: selectedAnswer
  });
  clickDataset({ action: "submit-syllable-connection-answer" });
  assert.ok(
    app.innerHTML.includes(wrongSyllableJudgmentIndexes.has(itemIndex) ? "回答错误" : "回答正确"),
    `${expectedItem.id} should grade against its reviewed expected answer`
  );
  assert.ok(app.innerHTML.includes(expectedItem.explanation), `${expectedItem.id} should reveal its explanation only after submit`);
}
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.syllableMistakes)", context)),
  { connection: ["connection-01", "connection-02"], break: ["break-01"] },
  "wrong connection and break judgments should stay in independent stable-ID buckets"
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.learningProgress.syllableTraining['connection-errors'])", context)),
  {
    completedIds: [
      "connection-01", "connection-02", "connection-03", "connection-04", "connection-05", "connection-06",
      "break-01", "break-02", "break-03", "break-04", "break-05", "break-06"
    ],
    completed: true
  },
  "all twelve submitted judgments should complete the connection-errors stage regardless of wrong answers"
);
includesAll(app.innerHTML, ["12 / 12", "复习连接与断开错题"], "completed connection and break stage");
assert.equal(vm.runInContext("saveLocalProgress()", context), true, "split syllable mistakes should save locally");
assert.deepEqual(
  savedProgress().syllableMistakes,
  { connection: ["connection-01", "connection-02"], break: ["break-01"] },
  "local saved progress should retain both syllable mistake buckets"
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(buildCloudSnapshot().syllableMistakes)", context)),
  { connection: ["connection-01", "connection-02"], break: ["break-01"] },
  "cloud snapshot should retain both syllable mistake buckets"
);
assert.doesNotThrow(
  () => vm.runInContext(`applyLocalProgressData(${JSON.stringify(savedProgress())})`, context),
  "the just-saved complete syllable record should pass direct local hydration validation"
);
vm.runInContext("state.syllableMistakes = { connection: [], break: [] }; hydrateLocalProgress()", context);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.syllableMistakes)", context)),
  { connection: ["connection-01", "connection-02"], break: ["break-01"] },
  "hydrating the saved local record should restore both syllable mistake buckets"
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(unitProgressSummaries().find((item) => item.label === '拼读与音节训练营'))", context)),
  { unit: "第四单元", label: "拼读与音节训练营", completed: 6, total: 7 },
  "the visible unit summary should retain the uncompleted published sentence-reading stage"
);
clickDataset({ action: "go", target: "syllableReview" });
assert.equal(vm.runInContext("state.screen", context), "syllableReview", "the completed stage should open a real split review screen");
assert.match(app.innerHTML, /data-target="syllableConnections"[^>]*aria-label="返回"/, "review opened from the lesson should return to connection training");
includesAll(
  app.innerHTML,
  ["连接与断开错题复习", "连接错误", "2 道", "断开错误", "1 道", 'data-mistake-bucket="connection"', 'data-mistake-bucket="break"'],
  "separate connection and break review counts"
);
focusedSyllableSelector = "";
clickDataset({ action: "review-syllable-mistakes", mistakeBucket: "connection" });
assert.equal(vm.runInContext("state.screen", context), "syllableConnections", "connection review should reuse the real textual judgment screen");
assert.equal(vm.runInContext("state.syllableConnectionMode", context), "review-connection");
assert.match(app.innerHTML, /data-target="syllableReview"[^>]*aria-label="返回"/, "a mistake retry should return to the split review screen");
assert.equal(focusedSyllableSelector, "[data-syllable-connection-question]", "opening a split review bucket should focus its question");
includesAll(app.innerHTML, ["错题复习 · 连接判断", "بال", "开头 ب 与后面的 ا 连接。"], "first connection mistake retry");
assert.ok(!app.innerHTML.includes("开头 ب 与后面的 ا 连接；ا 后不继续连接 ل。"), "retry should also hide explanation before answer");
clickDataset({ action: "pick-syllable-connection-answer", answerId: "statement-correct" });
clickDataset({ action: "submit-syllable-connection-answer" });
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.syllableMistakes)", context)),
  { connection: ["connection-02"], break: ["break-01"] },
  "a correct retry should remove only that connection ID and leave the break bucket unchanged"
);
clickDataset({ action: "next-syllable-connection-review" });
includesAll(app.innerHTML, ["مان", "م 与 ا 之间应断开。"], "next connection mistake retry");
clickDataset({ action: "pick-syllable-connection-answer", answerId: "statement-correct" });
clickDataset({ action: "submit-syllable-connection-answer" });
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.syllableMistakes)", context)),
  { connection: ["connection-02"], break: ["break-01"] },
  "a repeated wrong retry should not duplicate the connection ID or touch the break bucket"
);
clickDataset({ action: "go", target: "syllableReview" });
focusedSyllableSelector = "";
clickDataset({ action: "clear-syllable-mistakes", mistakeBucket: "connection" });
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.syllableMistakes)", context)),
  { connection: [], break: ["break-01"] },
  "clearing connection review should not clear break review"
);
assert.equal(focusedSyllableSelector, '[data-syllable-review-bucket="connection"]', "clearing connection mistakes should focus that bucket's empty state");
includesAll(app.innerHTML, ["连接错误", "暂无连接错题", "断开错误", "1 道"], "compact connection empty state with break mistakes retained");
assert.ok(
  app.innerHTML.includes('class="syllable-review-empty-row" data-syllable-review-bucket="connection"'),
  "an empty bucket beside remaining mistakes should use the compact status row"
);
assert.equal(
  (app.innerHTML.match(/class="card syllable-review-card"/g) || []).length,
  1,
  "only the actionable mistake bucket should remain a full card"
);
assert.ok(!app.innerHTML.includes('data-action="review-syllable-mistakes" data-mistake-bucket="connection"'), "an empty connection bucket should not render a dead review entry");
focusedSyllableSelector = "";
clickDataset({ action: "clear-syllable-mistakes", mistakeBucket: "break" });
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.syllableMistakes)", context)),
  { connection: [], break: [] },
  "clearing break review should leave both buckets empty after connection is already empty"
);
assert.equal(focusedSyllableSelector, "[data-syllable-review-empty]", "clearing the final mistake should focus the unified empty state");
includesAll(
  app.innerHTML,
  [
    "当前没有连接或断开错题",
    "完成连接与断开练习后，答错的题目会自动出现在这里。",
    'data-action="go" data-target="syllableConnections"',
    "继续连接与断开练习"
  ],
  "fully empty review should provide one useful next step"
);
assert.equal((app.innerHTML.match(/data-syllable-review-empty/g) || []).length, 1, "fully empty review should render one unified empty state");
assert.ok(!app.innerHTML.includes("连接错误已清空"), "a fresh empty state should not claim that connection mistakes were cleared");
assert.ok(!app.innerHTML.includes("断开错误已清空"), "a fresh empty state should not claim that break mistakes were cleared");

const latinUnitHtml = renderState(
  "state.screen = 'unit'; state.selectedUnitId = 'latin-keyboard-writing'; state.latinKeyboardValue = ''"
);
assert.match(
  latinUnitHtml,
  /data-action="go"[^>]*data-target="latinKeyboardIntro"[^>]*>\s*进入当前学习\s*<\/button>/,
  "the visible Latin writing unit should link to its implemented keyboard screen"
);
clickDataset({ action: "go", target: "latinKeyboardIntro" });
assert.equal(vm.runInContext("state.screen", context), "latinKeyboardIntro", "the Task 1 unit entry should no longer be dead");
includesAll(
  app.innerHTML,
  ["普通拉丁 QWERTY", "目标", "qwerty", 'aria-label="普通拉丁 QWERTY 键盘"', 'dir="ltr"', "Backspace", "Space", "ë", "ö", "ü"],
  "Latin QWERTY screen"
);
assert.equal((app.innerHTML.match(/class="latin-keyboard-row"/g) || []).length, 3, "Latin keyboard should render three QWERTY rows");
assert.equal((app.innerHTML.match(/data-action="latin-key"/g) || []).length, 26, "Latin keyboard should render all 26 ordinary letters");
assert.doesNotMatch(app.innerHTML, /[\u0600-\u06ff]/u, "the isolated Latin keyboard screen should not render Arabic Unicode");
assert.doesNotMatch(app.innerHTML, /accuracy|准确率|得分|分数/i, "literal keyboard completion should not invent an accuracy score");

vm.runInContext("state.learningProgress.latinWriting = {}; state.latinKeyboardValue = ''; render()", context);
for (const key of "qwertx") clickDataset({ action: "latin-key", key });
assert.equal(vm.runInContext("state.latinKeyboardValue", context), "qwertx", "screen keys should type literal lowercase Latin letters");
assert.equal(
  vm.runInContext("state.learningProgress.latinWriting.qwerty?.completed", context),
  undefined,
  "a near match must not complete the QWERTY exercise"
);
clickDataset({ action: "latin-backspace" });
clickDataset({ action: "latin-key", key: "y" });
assert.equal(vm.runInContext("state.latinKeyboardValue", context), "qwerty");
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.learningProgress.latinWriting.qwerty)", context)),
  { completed: true },
  "an exact literal match should persist one completion flag and no fabricated score"
);
includesAll(app.innerHTML, ["输入完全一致", "返回本单元", "回到首页"], "Latin QWERTY success");
assert.match(
  app.innerHTML,
  /data-action="go"[^>]*data-target="latinLetterClasses"[^>]*>\s*继续：元辅音分类\s*<\/button>/,
  "QWERTY success should link to the real letter classification screen"
);
clickDataset({ action: "go", target: "latinLetterClasses" });
assert.equal(vm.runInContext("state.screen", context), "latinLetterClasses");
assert.equal(
  (app.innerHTML.match(/data-letter-class="vowel"/g) || []).length,
  8,
  "letter classification should render exactly eight vowel cards"
);
assert.equal(
  (app.innerHTML.match(/data-letter-class="consonant"/g) || []).length,
  24,
  "letter classification should render exactly twenty-four consonant cards"
);
assert.match(
  app.innerHTML,
  /data-letter-id="aa"[\s\S]*?data-audio-src="\.\/assets\/audio\/human\/alphabet\/human_letter_25_a\.webm"/,
  "classification should reuse the existing human alphabet audio mapping"
);
const classificationCards = [...app.innerHTML.matchAll(/<article\s+class="latin-letter-card"(?<attributes>[^>]*)>(?<body>[\s\S]*?)<\/article>/g)];
assert.equal(classificationCards.length, 32, "classification should render exactly 32 letter cards total");
const classificationIds = classificationCards.map((match) => match.groups.attributes.match(/data-letter-id="([^"]+)"/)?.[1]);
assert.equal(new Set(classificationIds).size, 32, "classification cards should use 32 unique letter IDs");
const classificationAudioLabels = [];
for (const [index, card] of classificationCards.entries()) {
  const letterId = classificationIds[index];
  const detail = context.window.ANA_TILIM_COURSE.letterDetails[letterId];
  const expectedAudioPath = vm.runInContext(`alphabetAudioByLetterId[${JSON.stringify(letterId)}].outputPath`, context);
  const audioLabel = card.groups.body.match(/class="[^"]*latin-letter-audio[^"]*"[\s\S]*?aria-label="([^"]+)"/)?.[1];
  assert.ok(detail, `classification card ${letterId} should resolve through letterDetails`);
  assert.equal(audioLabel, `播放 ${detail.letter}，ULY ${detail.latin}`, `classification audio ${letterId} should name its glyph and ULY target`);
  classificationAudioLabels.push(audioLabel);
  assert.ok(card.groups.attributes.includes('data-has-forms="true"'), `${letterId} should confirm existing letterDetails forms`);
  includesAll(card.groups.body, [detail.letter, detail.latin, detail.cue, `data-audio-src="${expectedAudioPath}"`], `classification card ${letterId}`);
  assert.ok(!card.groups.body.includes(detail.connection), `${letterId} should not duplicate connection prose on the compact card`);
  assert.ok(!card.groups.body.includes(detail.writingHint), `${letterId} should not duplicate writing prose on the compact card`);
}
assert.equal(new Set(classificationAudioLabels).size, 32, "classification audio controls should have 32 unique accessible names");
assert.match(
  vm.runInContext("renderAudioButton({ audio: null, label: 'x' })", context),
  /aria-label="播放发音"/,
  "existing renderAudioButton callers should retain the default accessible name"
);
vm.runInContext(
  `
    globalThis.savedEditorialAa = letterDetails.aa;
    globalThis.savedEditorialAaAudio = alphabetAudioByLetterId.aa;
    letterDetails.aa = {
      ...letterDetails.aa,
      id: 'aa" data-editorial-injected="true',
      letter: 'ئا<&"',
      latin: 'a<&"',
      cue: 'cue <img src=x> & "'
    };
    alphabetAudioByLetterId.aa = {
      ...alphabetAudioByLetterId.aa,
      outputPath: './letter" data-audio-injected="true'
    };
    state.screen = 'latinLetterClasses';
    render();
  `,
  context
);
const editorialClassificationCard = [...app.innerHTML.matchAll(/<article\s+class="latin-letter-card"(?<attributes>[^>]*)>(?<body>[\s\S]*?)<\/article>/g)][0];
assert.ok(
  editorialClassificationCard.groups.attributes.includes('data-letter-id="aa&quot; data-editorial-injected=&quot;true"'),
  "classification editorial IDs should stay inside their data attribute"
);
assert.doesNotMatch(editorialClassificationCard[0], /\sdata-editorial-injected="true"/, "classification IDs should not inject attributes");
includesAll(
  editorialClassificationCard.groups.body,
  [
    'data-audio-src="./letter&quot; data-audio-injected=&quot;true"',
    'data-audio-label="ئا&lt;&amp;&quot;"',
    'aria-label="播放 ئا&lt;&amp;&quot;，ULY a&lt;&amp;&quot;"',
    'ئا&lt;&amp;&quot;',
    'a&lt;&amp;&quot;',
    'cue &lt;img src=x&gt; &amp; &quot;'
  ],
  "escaped classification editorial card"
);
assert.doesNotMatch(editorialClassificationCard[0], /\sdata-audio-injected="true"/, "audio paths should not inject attributes");
assert.ok(!editorialClassificationCard[0].includes("&amp;lt;"), "classification content should be escaped exactly once");
vm.runInContext(
  "letterDetails.aa = globalThis.savedEditorialAa; alphabetAudioByLetterId.aa = globalThis.savedEditorialAaAudio; render()",
  context
);
assert.match(
  styleSource,
  /\.latin-letter-grid\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(auto-fit, minmax\(140px, 1fr\)\);/s,
  "classification cards should use a responsive auto-fitting grid"
);
assert.match(
  styleSource,
  /\.latin-vowel-comparison-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/s,
  "vowel comparison should keep the active pair in two balanced columns"
);
assert.match(
  styleSource,
  /@media \(max-width: 560px\)[\s\S]*?\.latin-vowel-comparison-grid\s*\{[^}]*grid-template-columns:\s*1fr;/s,
  "vowel comparison cards should stack on narrow phones"
);
vm.runInContext(
  "globalThis.savedClassificationAaAudio = alphabetAudioByLetterId.aa; delete alphabetAudioByLetterId.aa; state.screen = 'latinLetterClasses'; render()",
  context
);
const classificationAaWithoutAudio = app.innerHTML.match(/<article\s+class="latin-letter-card"[^>]*data-letter-id="aa"[^>]*>(?<body>[\s\S]*?)<\/article>/)?.groups?.body || "";
includesAll(
  classificationAaWithoutAudio,
  ["音频待录", 'data-audio-src=""', "disabled", 'aria-label="播放 ئا，ULY a"'],
  "classification missing-audio policy"
);
vm.runInContext("alphabetAudioByLetterId.aa = globalThis.savedClassificationAaAudio; render()", context);

renderState("state.screen = 'latinLetterClasses'; state.preferences.showLatin = false");
assert.equal(
  (app.innerHTML.match(/class="latin-letter-uly"/g) || []).length,
  32,
  "ULY teaching targets should remain visible when the global Latin preference is off"
);
for (const latin of context.window.ANA_TILIM_COURSE.latinWriting.vowelLetterIds.map((id) => context.window.ANA_TILIM_COURSE.letterDetails[id].latin)) {
  assert.ok(app.innerHTML.includes(`>${latin}</span>`), `classification should keep ULY ${latin} visible`);
}
vm.runInContext("state.preferences.showLatin = true; render()", context);
assert.match(
  app.innerHTML,
  /data-action="complete-latin-classification"[^>]*>\s*完成分类，开始元音辨认\s*<\/button>/,
  "classification should expose one explicit completion action"
);
clickDataset({ action: "complete-latin-classification" });
assert.equal(vm.runInContext("state.screen", context), "latinVowelCompare");
assert.equal(vm.runInContext("state.latinVowelComparisonIndex", context), 0);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.learningProgress.latinWriting.classification)", context)),
  { completed: true },
  "classification completion should persist only its completed boolean"
);
const expectedVowelComparisons = [
  { id: "a-e", letterIds: ["aa", "ae"], focus: "开口位置与字形符号" },
  { id: "o-u", letterIds: ["o", "u"], focus: "圆唇字形符号" },
  { id: "oe-ue", letterIds: ["oe", "ue"], focus: "ö 与 ü 的 ULY 符号和真人音频" },
  { id: "ee-ii", letterIds: ["ee", "ii"], focus: "ë 与 i 的字形和真人音频" }
];
for (const [comparisonIndex, expectedComparison] of expectedVowelComparisons.entries()) {
  renderState(`state.screen = 'latinVowelCompare'; state.latinVowelComparisonIndex = ${comparisonIndex}`);
  const comparisonCards = [...app.innerHTML.matchAll(/<article\s+class="latin-vowel-comparison-card"(?<attributes>[^>]*)>(?<body>[\s\S]*?)<\/article>/g)];
  assert.equal(comparisonCards.length, 2, `comparison ${expectedComparison.id} should render exactly two cards`);
  assert.deepEqual(
    comparisonCards.map((card) => card.groups.attributes.match(/data-letter-id="([^"]+)"/)?.[1]),
    expectedComparison.letterIds,
    `comparison ${expectedComparison.id} should render only its fixed pair`
  );
  for (const [cardIndex, card] of comparisonCards.entries()) {
    const letterId = expectedComparison.letterIds[cardIndex];
    const detail = context.window.ANA_TILIM_COURSE.letterDetails[letterId];
    const expectedAudioPath = vm.runInContext(`alphabetAudioByLetterId[${JSON.stringify(letterId)}].outputPath`, context);
    const audioLabel = card.groups.body.match(/class="[^"]*latin-letter-audio[^"]*"[\s\S]*?aria-label="([^"]+)"/)?.[1];
    assert.equal(audioLabel, `播放 ${detail.letter}，ULY ${detail.latin}`, `comparison audio ${letterId} should name its glyph and ULY target`);
    includesAll(
      card.groups.body,
      [detail.letter, detail.latin, expectedComparison.focus, `data-audio-src="${expectedAudioPath}"`],
      `vowel comparison card ${letterId}`
    );
  }
  const pairAudioLabels = comparisonCards.map(
    (card) => card.groups.body.match(/class="[^"]*latin-letter-audio[^"]*"[\s\S]*?aria-label="([^"]+)"/)?.[1]
  );
  assert.equal(new Set(pairAudioLabels).size, 2, `comparison ${expectedComparison.id} should expose two distinct audio names`);
}

const escapedComparisonCard = vm.runInContext(
  `typeof renderLatinVowelComparisonCard === "function"
    ? renderLatinVowelComparisonCard("aa", {
        id: 'a-e" data-pair-injected="true',
        focus: 'focus <img src=x> & "'
      })
    : ""`,
  context
);
assert.ok(
  escapedComparisonCard.includes('data-comparison-id="a-e&quot; data-pair-injected=&quot;true"'),
  "comparison editorial IDs should stay inside their data attributes"
);
assert.doesNotMatch(escapedComparisonCard, /\sdata-pair-injected="true"/, "comparison IDs should not inject attributes");
assert.ok(
  escapedComparisonCard.includes('辨认重点：focus &lt;img src=x&gt; &amp; &quot;'),
  "comparison focus should render as escaped editorial text"
);
assert.ok(!escapedComparisonCard.includes("&amp;lt;"), "comparison content should be escaped exactly once");

renderState("state.screen = 'latinVowelCompare'; state.latinVowelComparisonIndex = 0; state.preferences.showLatin = false");
assert.equal((app.innerHTML.match(/class="latin-letter-uly"/g) || []).length, 2, "vowel comparison ULY should ignore the global hide-Latin preference");
clickDataset({ action: "navigate-latin-vowel-comparison", direction: "previous" });
assert.equal(vm.runInContext("state.latinVowelComparisonIndex", context), 0, "previous should stay stable at the first pair");
clickDataset({ action: "navigate-latin-vowel-comparison", direction: "next" });
assert.equal(vm.runInContext("state.latinVowelComparisonIndex", context), 1, "next should advance one pair");
clickDataset({ action: "navigate-latin-vowel-comparison", direction: "previous" });
assert.equal(vm.runInContext("state.latinVowelComparisonIndex", context), 0, "previous should move back one pair");
vm.runInContext("state.latinVowelComparisonIndex = 3; state.preferences.showLatin = true; render()", context);
clickDataset({ action: "navigate-latin-vowel-comparison", direction: "next" });
assert.equal(vm.runInContext("state.latinVowelComparisonIndex", context), 3, "next should stay stable at the final pair");
assert.match(app.innerHTML, /data-action="complete-latin-vowel-comparison"/, "the final pair should expose one completion action");
for (const deadTarget of ["latinWritingForms", "dictation", "forms"]) {
  assert.ok(!app.innerHTML.includes(`data-target="${deadTarget}"`), `Task 3 should not link to unimplemented ${deadTarget}`);
}
clickDataset({ action: "complete-latin-vowel-comparison" });
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.learningProgress.latinWriting['vowel-contrast'])", context)),
  { completed: true },
  "vowel contrast completion should persist only its completed boolean"
);
assert.equal(vm.runInContext("state.screen", context), "latinDictation", "vowel comparison completion should enter the real dictation screen");
const oeDictationIndex = vm.runInContext(
  "[...latinWriting.vowelLetterIds, ...latinWriting.consonantLetterIds].indexOf('oe')",
  context
);
const oeDictationDetail = context.window.ANA_TILIM_COURSE.letterDetails.oe;
const hiddenOeDictationHtml = renderState(
  `state.screen = 'latinDictation'; state.latinDictationIndex = ${oeDictationIndex}; state.latinDictationRevealed = false; state.latinWritingForm = 0`
);
const hiddenOeDictationExercise = hiddenOeDictationHtml.match(
  /<section\s+class="stack latin-dictation"[^>]*data-latin-dictation-exercise[^>]*>(?<body>[\s\S]*?)<\/section>/
)?.groups?.body || "";
assert.ok(hiddenOeDictationExercise, "oe dictation should render a scoped exercise region");
includesAll(
  hiddenOeDictationExercise,
  [">ö<", 'data-writing-canvas', 'data-action="reveal-latin-dictation-answer"'],
  "hidden oe dictation prompt"
);
assert.ok(!hiddenOeDictationExercise.includes(oeDictationDetail.letter), "oe answer glyph must stay hidden before reveal");
for (const form of oeDictationDetail.forms) {
  assert.ok(!hiddenOeDictationExercise.includes(form.value), `oe form ${form.value} must stay hidden before reveal`);
}
assert.doesNotMatch(hiddenOeDictationExercise, /accuracy|准确率|得分|分数/i, "dictation should not invent scoring");
const hiddenOeAnswerRegionTag = hiddenOeDictationExercise.match(/<div\s+data-latin-dictation-answer-region[^>]*>/)?.[0] || "";
const dictationAnnouncementOrder = [];
let observedDictationAnswerHtml = "";
let observedDictationAnswerHidden = true;
Object.defineProperties(latinDictationAnswerRegion, {
  innerHTML: {
    configurable: true,
    get() { return observedDictationAnswerHtml; },
    set(value) {
      observedDictationAnswerHtml = String(value);
      dictationAnnouncementOrder.push(observedDictationAnswerHtml ? "answer:inserted" : "answer:empty");
    }
  },
  hidden: {
    configurable: true,
    get() { return observedDictationAnswerHidden; },
    set(value) {
      observedDictationAnswerHidden = Boolean(value);
      dictationAnnouncementOrder.push(`hidden:${observedDictationAnswerHidden}`);
    }
  }
});
latinDictationAnswerRegion.focus = () => dictationAnnouncementOrder.push("focus");
latinDictationAnswerRegion.innerHTML = "";
latinDictationAnswerRegion.hidden = true;
dictationAnnouncementOrder.length = 0;
const originalRequestAnimationFrame = context.window.requestAnimationFrame;
let queuedDictationAnnouncement = null;
context.window.requestAnimationFrame = (callback) => {
  dictationAnnouncementOrder.push("frame:scheduled");
  queuedDictationAnnouncement = callback;
  return 2;
};
const dictationAppHtmlBeforeReveal = app.innerHTML;
const progressWritesBeforeDictationReveal = progressStorageWriteCount;
clickDataset({ action: "reveal-latin-dictation-answer" });
assert.equal(vm.runInContext("state.latinDictationRevealed", context), true, "reveal should update only transient dictation state");
assert.equal(latinDictationAnswerRegion.hidden, false, "reveal should expose the answer region without replacing the live canvas");
assert.equal(latinDictationAnswerRegion.innerHTML, "", "reveal should first expose an empty live region before inserting its answer");
assert.equal(app.innerHTML, dictationAppHtmlBeforeReveal, "reveal should keep the root markup and live Canvas identity unchanged");
assert.equal(typeof queuedDictationAnnouncement, "function", "answer insertion should wait for the next animation frame");
assert.deepEqual(
  dictationAnnouncementOrder,
  ["hidden:false", "frame:scheduled"],
  "the empty live region should become visible before answer insertion is scheduled"
);
assert.equal(progressStorageWriteCount, progressWritesBeforeDictationReveal + 1, "reveal should persist its one completion update immediately");
assert.deepEqual(
  savedProgress().learningProgress.latinWriting.dictation,
  { completed: true },
  "dictation completion should be saved even while the polite announcement is queued"
);
assert.match(hiddenOeAnswerRegionTag, /\shidden(?:\s|>)/, "the unrevealed live answer region should start hidden");
assert.match(hiddenOeAnswerRegionTag, /aria-live="polite"/, "the real reveal click should announce the inserted answer politely");
assert.match(hiddenOeAnswerRegionTag, /aria-atomic="true"/, "the answer announcement should include the complete self-check region");
queuedDictationAnnouncement();
context.window.requestAnimationFrame = originalRequestAnimationFrame;
assert.deepEqual(
  dictationAnnouncementOrder,
  ["hidden:false", "frame:scheduled", "answer:inserted"],
  "the next frame should insert the complete answer without stealing focus"
);
assert.equal(app.innerHTML, dictationAppHtmlBeforeReveal, "answer insertion should still preserve the root and live Canvas");
includesAll(
  latinDictationAnswerRegion.innerHTML,
  [
    oeDictationDetail.letter,
    "字母形式参考",
    "我自己比较，不是自动判分",
    ...oeDictationDetail.forms.flatMap((form) => [form.label, form.value])
  ],
  "revealed oe dictation answer"
);
assert.equal(
  (latinDictationAnswerRegion.innerHTML.match(/class="latin-dictation-form"/g) || []).length,
  oeDictationDetail.forms.length,
  "dictation reveal should show the real source forms count instead of assuming four"
);
assert.doesNotMatch(latinDictationAnswerRegion.innerHTML, /data-target="latinWritingForms"|stroke|accuracy|准确率|得分|分数/i);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.learningProgress.latinWriting.dictation)", context)),
  { completed: true },
  "revealing the self-check should persist only one completion flag"
);
const dictationLocalSnapshot = JSON.parse(vm.runInContext("JSON.stringify(buildLocalProgressData())", context));
const dictationCloudSnapshot = JSON.parse(vm.runInContext("JSON.stringify(buildCloudSnapshot())", context));
for (const transientField of ["latinDictationIndex", "latinDictationRevealed", "latinWritingForm"]) {
  assert.equal(
    Object.hasOwn(dictationLocalSnapshot, transientField),
    false,
    `${transientField} should stay out of local export inputs`
  );
  assert.equal(
    Object.hasOwn(dictationCloudSnapshot, transientField),
    false,
    `${transientField} should stay out of cloud snapshots`
  );
}
assert.ok(
  !JSON.stringify([dictationLocalSnapshot, dictationCloudSnapshot]).includes("data-writing-canvas"),
  "dictation progress should never serialize canvas markup or strokes"
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(unitProgressSummaries().find((item) => item.label.includes('拉丁键盘与字母书写强化')))", context)),
  { unit: "第二单元", label: "拉丁键盘与字母书写强化", completed: 4, total: 5 },
  "revealed dictation should advance the five-step summary to four of five"
);

const dictationDrawingCanvas = makeWritingCanvas();
writingCanvasesForTest = [dictationDrawingCanvas];
renderState(
  `state.screen = 'latinDictation'; state.latinDictationIndex = ${oeDictationIndex}; state.latinDictationRevealed = false; state.latinWritingForm = 0`
);
for (const eventName of ["pointerdown", "pointermove", "pointerup", "pointercancel", "pointerleave"]) {
  assert.equal(typeof dictationDrawingCanvas.listeners[eventName], "function", `dictation canvas should reuse ${eventName} writing support`);
}
let dictationPointerPrevented = 0;
dictationDrawingCanvas.listeners.pointerdown({
  clientX: 12,
  clientY: 20,
  pointerId: 1,
  preventDefault() { dictationPointerPrevented += 1; }
});
dictationDrawingCanvas.listeners.pointermove({
  clientX: 42,
  clientY: 60,
  pointerId: 1,
  preventDefault() { dictationPointerPrevented += 1; }
});
dictationDrawingCanvas.listeners.pointerup({ pointerId: 1 });
assert.deepEqual(
  dictationDrawingCanvas.calls.filter(([name]) => ["beginPath", "moveTo", "lineTo", "stroke", "closePath"].includes(name)).map(([name]) => name),
  ["beginPath", "moveTo", "lineTo", "stroke", "closePath"],
  "dictation should draw through the existing pointer canvas pipeline"
);
assert.equal(dictationPointerPrevented, 2, "drawing pointer gestures should prevent page scrolling");
assert.equal(
  (appSource.match(/addEventListener\("pointerdown"/g) || []).length,
  1,
  "dictation must reuse the one shared canvas event implementation"
);

vm.runInContext("state.latinDictationRevealed = true; state.latinWritingForm = 7", context);
clickDataset({ action: "next-latin-dictation" });
assert.equal(vm.runInContext("state.latinDictationIndex", context), oeDictationIndex + 1, "next should advance to the following stable letter ID");
assert.equal(vm.runInContext("state.latinDictationRevealed", context), false, "next should hide the previous answer");
assert.equal(vm.runInContext("state.latinWritingForm", context), 0, "next should reset the reserved form state without assuming a fixed forms count");
assert.ok(
  dictationDrawingCanvas.calls.some(([name]) => name === "clearRect"),
  "next should clear the current live canvas before rendering the following prompt"
);
includesAll(app.innerHTML, [">ü<", 'data-action="reveal-latin-dictation-answer"'], "next dictation prompt");
assert.ok(!app.innerHTML.includes(oeDictationDetail.letter), "next prompt should not retain the previous revealed glyph");

const unavailableDictationCanvas = makeWritingCanvas({ contextAvailable: false });
writingCanvasesForTest = [unavailableDictationCanvas];
latinDictationCanvasFallback.hidden = true;
unavailableDictationCanvas.hidden = false;
const unavailableDictationHtml = renderState(
  `state.screen = 'latinDictation'; state.latinDictationIndex = ${oeDictationIndex}; state.latinDictationRevealed = false; state.latinWritingForm = 0`
);
assert.equal(unavailableDictationCanvas.hidden, true, "an unavailable Canvas should hide only the unusable drawing surface");
assert.equal(latinDictationCanvasFallback.hidden, false, "an unavailable Canvas should expose its accurate fallback message");
includesAll(
  unavailableDictationHtml,
  [
    "当前浏览器不能自由书写，仍可查看标准字形和字母形式参考",
    'data-action="reveal-latin-dictation-answer"',
    'data-action="next-latin-dictation"',
    'data-target="unit"'
  ],
  "Canvas unavailable dictation fallback"
);
latinDictationAnswerRegion.innerHTML = "";
latinDictationAnswerRegion.hidden = true;
clickDataset({ action: "reveal-latin-dictation-answer" });
assert.equal(latinDictationAnswerRegion.hidden, false, "answer reveal should remain usable without Canvas");
writingCanvasesForTest = [];

const escapedLatinDictationAnswer = vm.runInContext(
  `renderLatinDictationAnswer({
    id: 'oe" data-letter-injected="true',
    letter: 'ئۆ<&"',
    forms: [{ label: 'form" data-form-injected="true', value: 'ـۆ<&"' }]
  })`,
  context
);
includesAll(
  escapedLatinDictationAnswer,
  [
    'ئۆ&lt;&amp;&quot;',
    'data-letter-id="oe&quot; data-letter-injected=&quot;true"',
    'form&quot; data-form-injected=&quot;true',
    'ـۆ&lt;&amp;&quot;'
  ],
  "escaped dictation answer"
);
assert.doesNotMatch(escapedLatinDictationAnswer, /\sdata-form-injected="true"/, "dictation form labels should not inject attributes");
assert.doesNotMatch(escapedLatinDictationAnswer, /\sdata-letter-injected="true"/, "dictation letter IDs should not inject attributes");
assert.ok(!escapedLatinDictationAnswer.includes("&amp;lt;"), "dictation answer fields should be escaped exactly once");

assert.match(
  styleSource,
  /\.latin-dictation-prompt\s*\{[^}]*text-align:\s*center;/s,
  "dictation ULY prompt should have a focused centered treatment"
);
assert.match(
  styleSource,
  /\.latin-dictation-forms\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(auto-fit, minmax\(120px, 1fr\)\);/s,
  "real source forms should use a responsive grid"
);
assert.match(
  styleSource,
  /\.writing-canvas-fallback\s*\{[^}]*z-index:\s*3;[^}]*text-align:\s*center;/s,
  "Canvas fallback should remain readable above the writing pad background"
);
assert.match(
  styleSource,
  /@media \(max-width: 560px\)[\s\S]*?\.latin-dictation-navigation\s*\{[^}]*grid-template-columns:\s*1fr;/s,
  "dictation navigation should stack on narrow phones"
);
assert.match(
  styleSource,
  /\.latin-writing-forms\s*\{[^}]*min-width:\s*0;[^}]*overflow-x:\s*clip;/s,
  "the forms page should contain its own horizontal layout"
);
assert.match(
  styleSource,
  /\.latin-writing-form-tabs\s*\{[^}]*max-width:\s*100%;[^}]*overflow-x:\s*auto;/s,
  "real form tabs should scroll only inside their own container"
);
assert.match(
  styleSource,
  /\.latin-writing-form-tab\s*\{[^}]*flex:\s*0 0 auto;[^}]*min-width:\s*min\(150px, 72vw\);/s,
  "2/4/8 real form tabs should remain readable without widening the page"
);
assert.match(
  styleSource,
  /\.latin-keyboard\s*\{[^}]*width:\s*100%;[^}]*overflow:\s*hidden;[^}]*direction:\s*ltr;/s,
  "the literal QWERTY keyboard should contain its rows and retain LTR direction on RTL-capable pages"
);
assert.match(
  styleSource,
  /\.latin-keyboard \.key-button\s*\{[^}]*flex:\s*1 1 0;[^}]*min-width:\s*0;/s,
  "ordinary and explicit extended Latin keys should be allowed to shrink inside the mobile viewport"
);
assert.match(
  styleSource,
  /\.writing-canvas\s*\{[^}]*inset:\s*0;[^}]*width:\s*100%;[^}]*height:\s*100%;/s,
  "live writing canvases should stay contained by their writing pads instead of covering controls"
);
assert.match(
  styleSource,
  /\.phone-shell\s*\{[^}]*width:\s*100%;[^}]*overflow:\s*hidden;/s,
  "the app shell should prevent page-level horizontal scrolling"
);
assert.match(
  styleSource,
  /\.syllable-parts\s*\{[^}]*display:\s*flex;[^}]*justify-content:\s*center;[^}]*max-width:\s*100%;/s,
  "two-letter parts should stay centered and contained on mobile"
);
assert.match(
  styleSource,
  /\.syllable-rule-options\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/s,
  "rule answer choices should use a balanced two-column layout when space permits"
);
assert.match(
  styleSource,
  /@media \(max-width: 560px\)[\s\S]*?\.syllable-rule-options\s*\{[^}]*grid-template-columns:\s*1fr;/s,
  "rule answer choices should stack on narrow phones"
);
assert.match(
  styleSource,
  /@media \(max-width: 560px\)[\s\S]*?\.latin-writing-controls\s*\{[^}]*grid-template-columns:\s*1fr;/s,
  "forms controls should stack on narrow phones"
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(Object.keys(state.learningProgress.latinWriting).sort())", context)),
  ["classification", "dictation", "qwerty", "vowel-contrast"],
  "Task 4 should add only the dictation stable step"
);
const allStableLatinSteps = {
  qwerty: { completed: true },
  classification: { completed: true },
  "vowel-contrast": { completed: true },
  dictation: { completed: true },
  forms: { completed: true }
};
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(latinWritingStepIds)", context)),
  ["qwerty", "classification", "vowel-contrast", "dictation", "forms"],
  "the Latin writing unit should expose exactly five stable progress IDs in course order"
);
vm.runInContext(
  `globalThis.progressBeforeLegacyLatinRestore = JSON.stringify(state.learningProgress);
   applyLocalProgressData({
     learningProgress: {
       letters: { "dot-bone": { completed: true } },
       combos: { "open-a": { completed: true } },
       vocab: { greetings: { completed: true } },
       practice: { "writing-loop": { completed: true } },
       reading: { "dialogue-greeting": { completed: true } }
     }
   });`,
  context
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.learningProgress.latinWriting)", context)),
  {},
  "legacy progress without latinWriting should normalize to an empty Latin scope"
);
for (const [scope, id] of [
  ["letters", "dot-bone"],
  ["combos", "open-a"],
  ["vocab", "greetings"],
  ["practice", "writing-loop"],
  ["reading", "dialogue-greeting"]
]) {
  assert.equal(
    vm.runInContext(`state.learningProgress[${JSON.stringify(scope)}][${JSON.stringify(id)}].completed`, context),
    true,
    `legacy normalization should preserve the existing ${scope} scope`
  );
}
vm.runInContext(
  "state.learningProgress = JSON.parse(globalThis.progressBeforeLegacyLatinRestore)",
  context
);
assert.doesNotThrow(
  () => vm.runInContext(
    `validateImportedProgressIds({
      learningProgress: { latinWriting: ${JSON.stringify(allStableLatinSteps)} },
      dailyActivity: {
        date: "2026-08-09",
        completedIds: ${JSON.stringify(Object.keys(allStableLatinSteps).map((id) => `latinWriting:${id}:completed`))}
      }
    })`,
    context
  ),
  "backup and cloud semantic validation should accept all five planned stable Latin step IDs"
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(unitProgressSummaries().find((item) => item.label.includes('拉丁键盘与字母书写强化')))", context)),
  { unit: "第二单元", label: "拉丁键盘与字母书写强化", completed: 4, total: 5 },
  "the course progress summary should include the completed dictation step and retain a five-step denominator"
);

assert.equal(
  vm.runInContext("persistedScreenIds.has('latinWritingForms')", context),
  true,
  "the real letter-form reference should be a stable persisted screen"
);
const realFormRepresentativeIds = ["dal", "oe", "ee"];
for (const letterId of realFormRepresentativeIds) {
  const detail = context.window.ANA_TILIM_COURSE.letterDetails[letterId];
  const expectedCount = letterId === "dal" ? 2 : letterId === "oe" ? 4 : 8;
  assert.equal(detail.forms.length, expectedCount, `${letterId} should retain its audited real form count`);
  const formsHtml = renderState(
    `state.screen = 'latinWritingForms'; state.latinWritingLetterId = '${letterId}'; state.latinWritingForm = 0; state.latinWritingGuideVisible = true; state.latinWritingComparisonRevealed = false`
  );
  assert.equal(
    (formsHtml.match(/data-latin-writing-form-tab/g) || []).length,
    detail.forms.length,
    `${letterId} should render one tab for every real source form`
  );
  for (const form of detail.forms) {
    includesAll(formsHtml, [form.label, form.value], `${letterId} real form reference`);
  }
  assert.ok(
    formsHtml.includes(`<h2>${detail.latin} · ${detail.forms.length} 项真实形式</h2>`),
    `${letterId} learner heading should use its ULY label instead of an internal ID`
  );
  assert.match(formsHtml, /role="tablist"/, `${letterId} forms should expose a tablist`);
  assert.match(formsHtml, /role="tab"[^>]*aria-selected="true"/, `${letterId} should expose one selected form tab`);
  for (const [formIndex] of detail.forms.entries()) {
    const tabTag = formsHtml.match(
      new RegExp(`<button[^>]*id="latin-writing-tab-${letterId}-${formIndex}"[^>]*>`)
    )?.[0] || "";
    assert.ok(tabTag, `${letterId} form ${formIndex} should have a stable controlled tab ID`);
    assert.match(tabTag, new RegExp(`aria-controls="latin-writing-panel-${letterId}"`));
    assert.match(tabTag, new RegExp(`tabindex="${formIndex === 0 ? "0" : "-1"}"`));
  }
  const panelTag = formsHtml.match(/<div\s+class="latin-writing-current-reference"[^>]*>/)?.[0] || "";
  assert.match(panelTag, new RegExp(`id="latin-writing-panel-${letterId}"`), `${letterId} should expose a controlled tabpanel ID`);
  assert.match(panelTag, new RegExp(`aria-labelledby="latin-writing-tab-${letterId}-0"`), `${letterId} panel should name its selected tab`);
  assert.doesNotMatch(formsHtml, /data-audio|audio-button|data-action="play-audio"/i, `${letterId} forms should not add audio controls`);
  assert.doesNotMatch(formsHtml, /stroke-player|data-action="(?:play|pause|replay)-stroke|(?:播放|暂停|重播|逐笔)笔画/i);
}
assert.doesNotMatch(
  renderState("state.screen = 'latinWritingForms'; state.latinWritingLetterId = 'dal'; state.latinWritingForm = 0"),
  />\s*(?:后连式|双连式|简单独立式)\s*</,
  "a two-form letter must not invent generic form tabs"
);
const escapedLatinWritingComparison = vm.runInContext(
  `renderLatinWritingComparison(
    { writingHint: 'hint <img src=x> & "' },
    { label: 'form" data-form-injected="true', value: 'ـۆ<&"' }
  )`,
  context
);
includesAll(
  escapedLatinWritingComparison,
  [
    'form&quot; data-form-injected=&quot;true',
    'ـۆ&lt;&amp;&quot;',
    'hint &lt;img src=x&gt; &amp; &quot;'
  ],
  "escaped Latin writing comparison"
);
assert.doesNotMatch(escapedLatinWritingComparison, /\sdata-form-injected="true"/, "form comparison data should not inject attributes");
assert.ok(!escapedLatinWritingComparison.includes("&amp;lt;"), "form comparison fields should be escaped exactly once");
const oeDictationAnswerWithFormsEntry = vm.runInContext(
  "renderLatinDictationAnswer(letterDetails.oe)",
  context
);
assert.match(
  oeDictationAnswerWithFormsEntry,
  /data-action="open-latin-writing-forms"[^>]*data-letter-id="oe"/,
  "a revealed dictation answer should expose a real entry for its current letter"
);
renderState(
  `state.screen = 'latinDictation'; state.latinDictationIndex = ${oeDictationIndex}; state.latinDictationRevealed = true; state.latinWritingForm = 7`
);
clickDataset({ action: "open-latin-writing-forms", letterId: "oe" });
assert.equal(vm.runInContext("state.screen", context), "latinWritingForms", "the dictation entry should open the real forms screen");
assert.equal(vm.runInContext("state.latinWritingLetterId", context), "oe", "the forms screen should keep the current dictation letter ID");
assert.equal(vm.runInContext("state.latinWritingForm", context), 0, "opening a letter should select its first real form");
assert.equal(vm.runInContext("state.latinWritingGuideVisible", context), true, "a new forms session should start with the guide visible");
assert.equal(vm.runInContext("state.latinWritingComparisonRevealed", context), false, "a new forms session should not pre-reveal comparison");
clickDataset({ action: "go", target: "latinDictation" });
assert.equal(vm.runInContext("state.screen", context), "latinDictation", "back should return to the same dictation question");
assert.equal(vm.runInContext("state.latinDictationIndex", context), oeDictationIndex, "returning should preserve the dictation question index");
const formsLocalSnapshot = JSON.parse(vm.runInContext("JSON.stringify(buildLocalProgressData())", context));
const formsCloudSnapshot = JSON.parse(vm.runInContext("JSON.stringify(buildCloudSnapshot())", context));
for (const transientField of [
  "latinWritingLetterId",
  "latinWritingForm",
  "latinWritingGuideVisible",
  "latinWritingComparisonRevealed"
]) {
  assert.equal(Object.hasOwn(formsLocalSnapshot, transientField), false, `${transientField} should stay out of local progress`);
  assert.equal(Object.hasOwn(formsCloudSnapshot, transientField), false, `${transientField} should stay out of cloud progress`);
}

const oeWritingCanvas = makeWritingCanvas();
oeWritingCanvas.dataset.writingFallbackId = "latin-writing-canvas-fallback";
writingCanvasesForTest = [oeWritingCanvas];
let focusedLatinWritingTabIndex = -1;
latinWritingFormTabsForTest = oeDictationDetail.forms.map((_, formIndex) => {
  const tab = makeElement(`latin-writing-form-${formIndex}`);
  tab.dataset.formIndex = String(formIndex);
  tab.closest = (selector) => selector === "[data-latin-writing-form-tab]" ? tab : null;
  tab.focus = () => {
    focusedLatinWritingTabIndex = formIndex;
  };
  return tab;
});
const oeFormsHtml = renderState(
  "state.screen = 'latinWritingForms'; state.latinWritingLetterId = 'oe'; state.latinWritingForm = 0; state.latinWritingGuideVisible = true; state.latinWritingComparisonRevealed = false"
);
includesAll(
  oeFormsHtml,
  [
    "data-writing-canvas",
    "data-latin-writing-guide",
    'data-action="toggle-latin-writing-guide"',
    'data-action="clear-latin-writing-canvas"',
    'data-action="reveal-latin-writing-comparison"'
  ],
  "oe same-canvas form practice"
);
function pressLatinWritingTabKey(key, tabIndex) {
  let prevented = 0;
  keydownHandler({
    key,
    code: key,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    target: latinWritingFormTabsForTest[tabIndex],
    preventDefault() { prevented += 1; }
  });
  assert.equal(prevented, 1, `${key} should prevent default tab-container scrolling`);
}
const oeFormsHtmlBeforeKeyboardNavigation = app.innerHTML;
const oeClearCallsBeforeKeyboardNavigation = oeWritingCanvas.calls.filter(([name]) => name === "clearRect").length;
pressLatinWritingTabKey("ArrowRight", 0);
assert.equal(vm.runInContext("state.latinWritingForm", context), 1, "ArrowRight should select the next real form");
assert.equal(focusedLatinWritingTabIndex, 1, "ArrowRight should focus the newly selected real form tab");
assert.equal(
  latinWritingPanel.getAttribute("aria-labelledby"),
  "latin-writing-tab-oe-1",
  "keyboard selection should keep the tabpanel associated with the selected real form"
);
pressLatinWritingTabKey("End", 1);
assert.equal(vm.runInContext("state.latinWritingForm", context), oeDictationDetail.forms.length - 1, "End should select the last real form");
assert.equal(focusedLatinWritingTabIndex, oeDictationDetail.forms.length - 1, "End should focus the last real form tab");
pressLatinWritingTabKey("ArrowRight", oeDictationDetail.forms.length - 1);
assert.equal(vm.runInContext("state.latinWritingForm", context), 0, "ArrowRight should wrap from the final real form to the first");
pressLatinWritingTabKey("ArrowLeft", 0);
assert.equal(vm.runInContext("state.latinWritingForm", context), oeDictationDetail.forms.length - 1, "ArrowLeft should wrap from the first real form to the final form");
pressLatinWritingTabKey("Home", oeDictationDetail.forms.length - 1);
assert.equal(vm.runInContext("state.latinWritingForm", context), 0, "Home should select the first real form");
assert.equal(focusedLatinWritingTabIndex, 0, "Home should focus the first real form tab");
assert.equal(app.innerHTML, oeFormsHtmlBeforeKeyboardNavigation, "tab keyboard navigation must preserve the root and live Canvas");
assert.equal(
  oeWritingCanvas.calls.filter(([name]) => name === "clearRect").length,
  oeClearCallsBeforeKeyboardNavigation,
  "tab keyboard navigation must preserve learner strokes"
);
oeWritingCanvas.listeners.pointerdown({
  clientX: 10,
  clientY: 12,
  pointerId: 3,
  preventDefault() {}
});
oeWritingCanvas.listeners.pointermove({
  clientX: 40,
  clientY: 52,
  pointerId: 3,
  preventDefault() {}
});
oeWritingCanvas.listeners.pointerup({ pointerId: 3 });
const oeFormsAppHtmlBeforeSwitch = app.innerHTML;
const oeClearCallsBeforeSwitch = oeWritingCanvas.calls.filter(([name]) => name === "clearRect").length;
clickDataset({ action: "select-latin-writing-form", formIndex: "2" });
assert.equal(vm.runInContext("state.latinWritingForm", context), 2, "a real source form tab should update the selected index");
assert.equal(app.innerHTML, oeFormsAppHtmlBeforeSwitch, "switching forms must not replace the root or live Canvas DOM");
assert.equal(writingCanvasesForTest[0], oeWritingCanvas, "switching forms should preserve the same Canvas object");
assert.equal(latinWritingReferenceGlyph.textContent, oeDictationDetail.forms[2].value, "large reference should follow the selected source form");
assert.equal(latinWritingGuide.textContent, oeDictationDetail.forms[2].value, "faint Canvas guide should follow the selected source form");
assert.equal(
  oeWritingCanvas.getAttribute("aria-label"),
  `${oeDictationDetail.forms[2].label} 手写板`,
  "the live Canvas accessible name should follow the selected source form"
);
assert.equal(latinWritingReferenceLabel.textContent, oeDictationDetail.forms[2].label, "source form label should follow the selected tab");
assert.equal(latinWritingFormCount.textContent, `3 / ${oeDictationDetail.forms.length}`, "form position should update locally");
assert.equal(latinWritingFormTabsForTest[2].getAttribute("aria-selected"), "true", "selected tab should expose aria-selected true");
assert.equal(latinWritingFormTabsForTest[0].getAttribute("aria-selected"), "false", "previous tab should expose aria-selected false");
assert.equal(
  oeWritingCanvas.calls.filter(([name]) => name === "clearRect").length,
  oeClearCallsBeforeSwitch,
  "switching a form must preserve existing strokes"
);
vm.runInContext("state.latinWritingForm = 99", context);
clickDataset({ action: "select-latin-writing-form", formIndex: "99" });
assert.equal(vm.runInContext("state.latinWritingForm", context), oeDictationDetail.forms.length - 1, "selected form index should clamp to real forms");

const oeFormsHtmlBeforeGuideToggle = app.innerHTML;
const oeClearCallsBeforeGuideToggle = oeWritingCanvas.calls.filter(([name]) => name === "clearRect").length;
clickDataset({ action: "toggle-latin-writing-guide" });
assert.equal(vm.runInContext("state.latinWritingGuideVisible", context), false, "guide toggle should hide only the faint reference");
assert.equal(app.innerHTML, oeFormsHtmlBeforeGuideToggle, "guide toggle should preserve the root and live Canvas");
assert.equal(latinWritingPad.classList.contains("hide-guide"), true, "guide toggle should hide the Canvas underlay locally");
assert.equal(latinWritingGuideToggle.textContent, "显示参考", "guide control should describe the next available action");
assert.equal(latinWritingGuideToggle.getAttribute("aria-pressed"), "false", "hidden guide should expose aria-pressed false");
assert.equal(
  oeWritingCanvas.calls.filter(([name]) => name === "clearRect").length,
  oeClearCallsBeforeGuideToggle,
  "hiding a guide must not clear learner strokes"
);
clickDataset({ action: "toggle-latin-writing-guide" });
assert.equal(vm.runInContext("state.latinWritingGuideVisible", context), true, "guide should be restorable without redrawing the screen");
assert.equal(latinWritingPad.classList.contains("hide-guide"), false, "restored guide should remove the local hidden class");
clickDataset({ action: "clear-latin-writing-canvas" });
assert.equal(
  oeWritingCanvas.calls.filter(([name]) => name === "clearRect").length,
  oeClearCallsBeforeGuideToggle + 1,
  "clear rewrite should be the one form control that clears strokes"
);

const latinWritingAnnouncementOrder = [];
let observedLatinWritingComparisonHtml = "";
let observedLatinWritingComparisonHidden = true;
Object.defineProperties(latinWritingComparisonRegion, {
  innerHTML: {
    configurable: true,
    get() { return observedLatinWritingComparisonHtml; },
    set(value) {
      observedLatinWritingComparisonHtml = String(value);
      latinWritingAnnouncementOrder.push(observedLatinWritingComparisonHtml ? "comparison:inserted" : "comparison:empty");
    }
  },
  hidden: {
    configurable: true,
    get() { return observedLatinWritingComparisonHidden; },
    set(value) {
      observedLatinWritingComparisonHidden = Boolean(value);
      latinWritingAnnouncementOrder.push(`hidden:${observedLatinWritingComparisonHidden}`);
    }
  }
});
latinWritingComparisonRegion.innerHTML = "";
latinWritingComparisonRegion.hidden = true;
latinWritingAnnouncementOrder.length = 0;
let queuedLatinWritingAnnouncement = null;
context.window.requestAnimationFrame = (callback) => {
  latinWritingAnnouncementOrder.push("frame:scheduled");
  queuedLatinWritingAnnouncement = callback;
  return 3;
};
const formsProgressWritesBeforeReveal = progressStorageWriteCount;
const oeFormsHtmlBeforeReveal = app.innerHTML;
clickDataset({ action: "reveal-latin-writing-comparison" });
assert.equal(vm.runInContext("state.latinWritingComparisonRevealed", context), true, "comparison reveal should update only transient state");
assert.equal(latinWritingComparisonRegion.hidden, false, "comparison should expose its empty live region first");
assert.equal(latinWritingComparisonRegion.innerHTML, "", "comparison answer should wait for the next frame");
assert.equal(app.innerHTML, oeFormsHtmlBeforeReveal, "comparison reveal must preserve the live Canvas and strokes");
assert.deepEqual(latinWritingAnnouncementOrder, ["hidden:false", "frame:scheduled"], "comparison should announce after exposure");
assert.equal(typeof queuedLatinWritingAnnouncement, "function", "comparison insertion should be scheduled");
assert.equal(progressStorageWriteCount, formsProgressWritesBeforeReveal + 1, "forms completion should save once immediately");
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.learningProgress.latinWriting.forms)", context)),
  { completed: true },
  "forms practice should record only a completed boolean"
);
queuedLatinWritingAnnouncement();
context.window.requestAnimationFrame = originalRequestAnimationFrame;
includesAll(
  latinWritingComparisonRegion.innerHTML,
  [oeDictationDetail.forms.at(-1).label, oeDictationDetail.forms.at(-1).value, "不做自动判分"],
  "revealed live form comparison"
);
assert.deepEqual(
  latinWritingAnnouncementOrder,
  ["hidden:false", "frame:scheduled", "comparison:inserted"],
  "the full comparison should be inserted in the exposed live region"
);
assert.doesNotMatch(latinWritingComparisonRegion.innerHTML, /正确|错误|accuracy|准确率|得分|分数|stroke/i);
const comparisonHtmlBeforeFormSwitch = app.innerHTML;
clickDataset({ action: "select-latin-writing-form", formIndex: "1" });
assert.equal(app.innerHTML, comparisonHtmlBeforeFormSwitch, "revealed comparison form switching should still preserve Canvas identity");
includesAll(
  latinWritingComparisonRegion.innerHTML,
  [oeDictationDetail.forms[1].label, oeDictationDetail.forms[1].value],
  "synchronized revealed form comparison"
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(unitProgressSummaries().find((item) => item.label.includes('拉丁键盘与字母书写强化')))", context)),
  { unit: "第二单元", label: "拉丁键盘与字母书写强化", completed: 5, total: 5 },
  "revealing the forms comparison should complete the fifth stable step"
);
const completedLatinNextActions = vm.runInContext(
  "renderUnitNextActions('latin-keyboard-writing')",
  context
);
assert.match(
  completedLatinNextActions,
  /data-action="open-unit"[^>]*data-id="combos"[^>]*>[^<]*进入第三单元/,
  "a completed Latin writing unit should route to the edition-aware next unit, combos"
);

oeWritingCanvas.listeners.pointerdown({
  clientX: 18,
  clientY: 20,
  pointerId: 4,
  preventDefault() {}
});
oeWritingCanvas.listeners.pointermove({
  clientX: 64,
  clientY: 72,
  pointerId: 4,
  preventDefault() {}
});
oeWritingCanvas.listeners.pointerup({ pointerId: 4 });
const formsCanvasIdentityBeforeCloudStatus = writingCanvasesForTest[0];
const formsPointerHandlerBeforeCloudStatus = oeWritingCanvas.listeners.pointerdown;
const formsCanvasCallsBeforeCloudStatus = oeWritingCanvas.calls.length;
const formsHtmlBeforeCloudStatus = app.innerHTML;
const formsAppWritesBeforeCloudStatus = appHtmlWriteCount;
vm.runInContext("cloudStatus = { phase: 'signed-in', error: '' }", context);
for (const phase of ["syncing", "synced"]) {
  vm.runInContext(`handleCloudStatus({ phase: '${phase}', authEvent: '', error: '' })`, context);
  assert.equal(vm.runInContext("cloudStatus.phase", context), phase, `${phase} should still update the internal cloud status`);
}
assert.equal(
  appHtmlWriteCount,
  formsAppWritesBeforeCloudStatus,
  "status-only cloud updates must not replace the active Latin forms Canvas DOM"
);
assert.equal(app.innerHTML, formsHtmlBeforeCloudStatus, "status-only cloud updates should keep forms root HTML untouched");
assert.equal(writingCanvasesForTest[0], formsCanvasIdentityBeforeCloudStatus, "status-only cloud updates should retain the same forms Canvas object");
assert.equal(oeWritingCanvas.listeners.pointerdown, formsPointerHandlerBeforeCloudStatus, "status-only cloud updates should not rebind Canvas pointer handlers");
assert.equal(oeWritingCanvas.calls.length, formsCanvasCallsBeforeCloudStatus, "status-only cloud updates should preserve existing form strokes");

vm.runInContext("window.sessionStorage.setItem('ana-tilim-auth-redirect', '1'); state.screen = 'latinWritingForms'", context);
const formsAppWritesBeforeForcedOauthRedirect = appHtmlWriteCount;
vm.runInContext("handleCloudStatus({ phase: 'signed-in', authEvent: '', error: '' })", context);
assert.equal(vm.runInContext("state.screen", context), "home", "a forced OAuth redirect should still leave the live Canvas screen");
assert.equal(appHtmlWriteCount, formsAppWritesBeforeForcedOauthRedirect + 1, "a forced OAuth redirect should still render its home destination");

renderState("state.screen = 'latinWritingForms'; state.latinWritingLetterId = 'oe'");
vm.runInContext("cloudStatus = { phase: 'verifying-code', error: '' }", context);
const formsAppWritesBeforeEmailVerification = appHtmlWriteCount;
vm.runInContext("handleCloudStatus({ phase: 'signed-in', authEvent: 'SIGNED_IN', error: '' })", context);
assert.equal(vm.runInContext("state.screen", context), "home", "completed email verification should still leave the live Canvas screen");
assert.equal(appHtmlWriteCount, formsAppWritesBeforeEmailVerification + 1, "completed email verification should still render its home destination");

const dictationStatusCanvas = makeWritingCanvas();
writingCanvasesForTest = [dictationStatusCanvas];
renderState(
  `state.screen = 'latinDictation'; state.latinDictationIndex = ${oeDictationIndex}; state.latinDictationRevealed = false`
);
dictationStatusCanvas.listeners.pointerdown({
  clientX: 22,
  clientY: 26,
  pointerId: 5,
  preventDefault() {}
});
dictationStatusCanvas.listeners.pointermove({
  clientX: 54,
  clientY: 62,
  pointerId: 5,
  preventDefault() {}
});
dictationStatusCanvas.listeners.pointerup({ pointerId: 5 });
const dictationAppWritesBeforeCloudStatus = appHtmlWriteCount;
const dictationCanvasCallsBeforeCloudStatus = dictationStatusCanvas.calls.length;
vm.runInContext("handleCloudStatus({ phase: 'syncing', authEvent: '', error: '' })", context);
assert.equal(appHtmlWriteCount, dictationAppWritesBeforeCloudStatus, "Task 4 dictation Canvas should also survive status-only cloud updates");
assert.equal(dictationStatusCanvas.calls.length, dictationCanvasCallsBeforeCloudStatus, "dictation strokes should survive status-only cloud updates");

const liveCanvasStatusMatrix = [
  {
    label: "letterWriting",
    setup: "state.screen = 'letterWriting'; state.selectedGroupId = 'dot-bone'; state.currentLetterId = 'be'"
  },
  {
    label: "latinDictation",
    setup: `state.screen = 'latinDictation'; state.latinDictationIndex = ${oeDictationIndex}; state.latinDictationRevealed = false`
  },
  {
    label: "latinWritingForms",
    setup: "state.screen = 'latinWritingForms'; state.latinWritingLetterId = 'oe'; state.latinWritingForm = 0; state.latinWritingGuideVisible = true; state.latinWritingComparisonRevealed = false"
  },
  {
    label: "comboWriting",
    setup: "state.screen = 'comboWriting'; state.selectedComboGroupId = 'open-a'; state.currentComboItemId = 'ba'"
  },
  {
    label: "write-mode practiceSession",
    setup: "state.screen = 'practiceSession'; state.selectedPracticeGroupId = 'writing-loop'; state.currentPracticeItemId = 'practice-write-be'"
  }
];
for (const [matrixIndex, entry] of liveCanvasStatusMatrix.entries()) {
  const canvas = makeWritingCanvas();
  writingCanvasesForTest = [canvas];
  renderState(entry.setup);
  assert.equal(typeof canvas.listeners.pointerdown, "function", `${entry.label} should bind the shared Canvas pointer pipeline`);
  canvas.listeners.pointerdown({
    clientX: 12 + matrixIndex,
    clientY: 16 + matrixIndex,
    pointerId: 20 + matrixIndex,
    preventDefault() {}
  });
  canvas.listeners.pointermove({
    clientX: 48 + matrixIndex,
    clientY: 58 + matrixIndex,
    pointerId: 20 + matrixIndex,
    preventDefault() {}
  });
  canvas.listeners.pointerup({ pointerId: 20 + matrixIndex });

  const rootHtmlBeforeStatus = app.innerHTML;
  const rootWritesBeforeStatus = appHtmlWriteCount;
  const pointerHandlerBeforeStatus = canvas.listeners.pointerdown;
  const canvasCallsBeforeStatus = canvas.calls.length;
  for (const phase of ["syncing", "synced"]) {
    vm.runInContext(`handleCloudStatus({ phase: ${JSON.stringify(phase)}, authEvent: '', error: '' })`, context);
  }
  assert.equal(appHtmlWriteCount, rootWritesBeforeStatus, `${entry.label} status-only updates should not rerender its root`);
  assert.equal(app.innerHTML, rootHtmlBeforeStatus, `${entry.label} status-only updates should preserve its root HTML`);
  assert.equal(writingCanvasesForTest[0], canvas, `${entry.label} status-only updates should retain the same Canvas object`);
  assert.equal(canvas.listeners.pointerdown, pointerHandlerBeforeStatus, `${entry.label} status-only updates should retain pointer handlers`);
  assert.equal(canvas.calls.length, canvasCallsBeforeStatus, `${entry.label} status-only updates should preserve learner strokes`);
}

writingCanvasesForTest = [];
renderState("state.screen = 'vocab'");
const ordinaryScreenWritesBeforeCloudStatus = appHtmlWriteCount;
vm.runInContext("handleCloudStatus({ phase: 'synced', authEvent: '', error: '' })", context);
assert.equal(appHtmlWriteCount, ordinaryScreenWritesBeforeCloudStatus + 1, "ordinary screens should retain the existing cloud-status rerender behavior");

const unavailableLatinWritingCanvas = makeWritingCanvas({ contextAvailable: false });
unavailableLatinWritingCanvas.dataset.writingFallbackId = "latin-writing-canvas-fallback";
unavailableLatinWritingCanvas.dataset.writingUnavailableSelector = "[data-latin-writing-canvas-only]";
const canvasOnlyCaption = makeElement("latin-writing-canvas-caption");
const canvasOnlyGuideButton = makeElement("latin-writing-guide-button");
const canvasOnlyClearButton = makeElement("latin-writing-clear-button");
latinWritingCanvasOnlyForTest = [canvasOnlyCaption, canvasOnlyGuideButton, canvasOnlyClearButton];
writingCanvasesForTest = [unavailableLatinWritingCanvas];
latinWritingCanvasFallback.hidden = true;
const unavailableLatinWritingHtml = renderState(
  "state.screen = 'latinWritingForms'; state.latinWritingLetterId = 'ee'; state.latinWritingForm = 7; state.latinWritingGuideVisible = true; state.latinWritingComparisonRevealed = false"
);
assert.equal(unavailableLatinWritingCanvas.hidden, true, "unavailable forms Canvas should hide only the unusable drawing surface");
assert.equal(latinWritingCanvasFallback.hidden, false, "unavailable forms Canvas should show accurate neutral fallback copy");
assert.ok(latinWritingCanvasOnlyForTest.every((control) => control.hidden), "free-writing and clear controls should hide without Canvas");
includesAll(
  unavailableLatinWritingHtml,
  [
    ...context.window.ANA_TILIM_COURSE.letterDetails.ee.forms.flatMap((form) => [form.label, form.value]),
    context.window.ANA_TILIM_COURSE.letterDetails.ee.writingHint,
    "当前浏览器不能自由书写，仍可切换真实字母形式并揭晓对照",
    'data-action="reveal-latin-writing-comparison"',
    'data-target="latinDictation"'
  ],
  "no-Canvas real forms reference"
);
writingCanvasesForTest = [];
latinWritingCanvasOnlyForTest = [];

vm.runInContext("state.showGuide = false; state.latinWritingGuideVisible = true", context);
assert.match(vm.runInContext("renderWritingCanvas('ب')", context), /writing-pad hide-guide/, "old first-unit Canvas should retain showGuide semantics");
vm.runInContext("state.showGuide = true; state.latinWritingGuideVisible = false", context);
assert.doesNotMatch(vm.runInContext("renderWritingCanvas('ب')", context), /writing-pad hide-guide/, "Latin guide state must not leak into old Canvas screens");
vm.runInContext("state.showGuide = true", context);
vm.runInContext("state.preferences.showLatin = true; state.screen = 'latinKeyboardIntro'; render()", context);

vm.runInContext("state.latinKeyboardValue = ''; render()", context);
clickDataset({ action: "latin-key", key: "q" });
clickDataset({ action: "latin-extended-key", key: "ë" });
clickDataset({ action: "latin-space" });
clickDataset({ action: "latin-backspace" });
assert.equal(vm.runInContext("state.latinKeyboardValue", context), "që", "extended, Space, and Backspace screen keys should stay literal");
assert.doesNotMatch(vm.runInContext("state.latinKeyboardValue", context), /[\u0600-\u06ff]/u);

vm.runInContext("state.learningProgress.latinWriting = {}; state.latinKeyboardValue = ''; render()", context);
pressPhysicalKey("A", { metaKey: true });
pressPhysicalKey("A", { ctrlKey: true });
pressPhysicalKey("A", { altKey: true });
assert.equal(vm.runInContext("state.latinKeyboardValue", context), "", "physical modifiers should be ignored on the Latin screen");
pressPhysicalKey("Q", {
  target: {
    matches(selector) {
      if (selector.includes("input:not([readonly])")) return false;
      return selector.split(",").some((part) => part.trim() === "input");
    }
  }
});
assert.equal(
  vm.runInContext("state.latinKeyboardValue", context),
  "q",
  "physical Latin input should still work when the readonly LTR display has focus"
);
vm.runInContext("state.latinKeyboardValue = ''; render()", context);
for (const key of "QWERTY") pressPhysicalKey(key);
assert.equal(vm.runInContext("state.latinKeyboardValue", context), "qwerty", "physical QWERTY should stay literal Latin");
pressPhysicalKey(" ");
pressPhysicalKey("Backspace");
assert.equal(vm.runInContext("state.latinKeyboardValue", context), "qwerty", "physical Space and Backspace should use the Latin API");
assert.equal(vm.runInContext("state.learningProgress.latinWriting.qwerty.completed", context), true);
assert.doesNotMatch(vm.runInContext("state.latinKeyboardValue", context), /[\u0600-\u06ff]/u);
vm.runInContext(
  "state.learningProgress = emptyLearningProgress(); state.learningProgress.latinWriting.qwerty = { completed: true }; state.dailyActivity = { date: localDayKey(), completedIds: ['latinWriting:qwerty:completed'] }",
  context
);
const completedLatinExportText = vm.runInContext(
  "JSON.stringify(progressTransfer.createExportPayload(buildLocalProgressData(), { edition: appConfig.edition, brandName: appConfig.brandName }))",
  context
);
const completedLatinImport = importProgressDirect(completedLatinExportText);
assert.equal(
  completedLatinImport.data.learningProgress.latinWriting.qwerty.completed,
  true,
  "the current real app export should round-trip Latin QWERTY completion through semantic validation"
);
vm.runInContext("state.pendingProgressImport = null", context);

renderState("state.screen = 'keyboard'; state.selectedGroupId = 'vowels-basic'; state.currentLetterId = 'ae'; state.keyboardValue = ''");
assert.ok(app.innerHTML.includes('data-physical-key="Space"'), "the virtual keyboard should display a real Space key");
assert.ok(app.innerHTML.includes(">بوشلۇق</button>"), "the Space key should use the real Uyghur phone-keyboard label");
assert.match(app.innerHTML, /class="key-button utility keyboard-shift/, "the phone keyboard should place a Shift key beside the third letter row");
assert.match(app.innerHTML, /data-action="backspace"[^>]*aria-label="删除"/, "the phone keyboard should place a labelled Backspace key beside the third letter row");
assert.match(app.innerHTML, /data-action="key"[^>]*data-key="ئ"/, "the teaching keyboard should keep a visible Hamza key");
assert.doesNotMatch(app.innerHTML, />يوللا<\/button>/, "the learning keyboard should omit the phone submit key");
assert.doesNotMatch(app.innerHTML, />123<\/button>/, "the learning keyboard should omit the numeric-layer context key");
assert.doesNotMatch(app.innerHTML, /aria-label="表情键（仅展示）"/, "the learning keyboard should omit the emoji context key");
assert.match(app.innerHTML, /data-action="go"[^>]*data-target="complete"[^>]*disabled[^>]*>\s*完成课程\s*<\/button>/, "the site-style completion button should remain disabled before the target is complete");
assert.doesNotMatch(styleSource, /\.uyghur-keyboard\s*\{[^}]*overflow-x:\s*auto/, "the phone keyboard should not require horizontal scrolling");
assert.doesNotMatch(styleSource, /\.uyghur-keyboard\s*\{[^}]*background:\s*#242529/s, "the learning keyboard should not use the dark phone shell");
assert.match(styleSource, /\.uyghur-keyboard\s*\{[^}]*background:\s*linear-gradient/s, "the learning keyboard should use the site's light surface treatment");
assert.match(styleSource, /\.uyghur-keyboard \.key-button\.next-key\s*\{[^}]*background:\s*#fff0c8/s, "the next connection key should use the gold guided state");
assert.match(styleSource, /\.uyghur-keyboard \.keyboard-shift\.active\s*\{[^}]*background:\s*var\(--mint\)/s, "the pressed Shift key should use the site's mint active state");
assert.match(styleSource, /@font-face\s*\{[^}]*font-family:\s*"Scheherazade New"[^}]*ScheherazadeNew-Regular\.woff2/s, "the prototype should self-host the regular Uyghur font");
assert.match(styleSource, /@font-face\s*\{[^}]*font-family:\s*"Scheherazade New"[^}]*ScheherazadeNew-Bold\.woff2/s, "the prototype should self-host the bold Uyghur font");
assert.match(styleSource, /\.uyghur\s*\{[^}]*font-family:\s*"Scheherazade New"/s, "all Uyghur text should prefer the bundled Scheherazade New font");
assert.match(styleSource, /\.form-example-word \.form-example-word-text\s*\{[^}]*font-family:\s*"Scheherazade New"/s, "connected example words should use the same bundled Uyghur font");
assert.ok(app.innerHTML.includes("还差 2 键"), "compound Uyghur letters should count real physical keystrokes");
assert.ok(app.innerHTML.includes("第 1 步：点击 ئ"), "compound Uyghur letters should guide the hamza carrier first");
assert.ok(!app.innerHTML.includes("第 1 步：点击 ئە"), "the keyboard guide must not ask for a combined glyph that is not a physical key");
assert.ok(app.innerHTML.includes("按顺序点击"), "compound Uyghur letters should explain the physical key sequence");
renderState("state.screen = 'keyboard'; state.selectedGroupId = 'vowels-basic'; state.currentLetterId = 'ae'; state.keyboardValue = 'ئ'");
assert.ok(app.innerHTML.includes("还差 1 键"), "the guide should count the remaining physical key after the first stroke");
assert.ok(app.innerHTML.includes("第 2 步：点击 ە"), "the guide should advance to the vowel key after hamza");
renderState("state.screen = 'keyboard'; state.selectedGroupId = 'vowels-basic'; state.currentLetterId = 'ae'; state.keyboardValue = 'ئە'");
assert.match(app.innerHTML, /data-action="go"[^>]*data-target="complete"(?![^>]*disabled)[^>]*>\s*完成课程\s*<\/button>/, "the site-style completion button should become enabled after the target is complete");
renderState("state.screen = 'keyboard'; state.selectedGroupId = 'vowels-basic'; state.currentLetterId = 'ae'; state.keyboardValue = ''; state.keyboardShift = true");
assert.ok(app.innerHTML.includes("keyboard-shift active next-key"), "Shift should be highlighted when it must be turned off for the next key");
assert.ok(!/physical-key next-key[^>]*data-code="Slash"/.test(app.innerHTML), "a physical key must not be highlighted while Shift would output the wrong character");
renderState("state.screen = 'keyboard'; state.selectedGroupId = 'vowels-basic'; state.currentLetterId = 'ae'; state.keyboardValue = ''; state.keyboardShift = false");
keydownHandler({
  code: "Slash",
  key: "/",
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  target: { matches() { return false; } },
  preventDefault() {}
});
keydownHandler({
  code: "KeyG",
  key: "g",
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  target: { matches() { return false; } },
  preventDefault() {}
});
assert.equal(vm.runInContext("state.keyboardValue", context), "ئە", "physical keyboard keys should type the mapped Uyghur target");
assert.equal(
  vm.runInContext("state.latinKeyboardValue", context),
  "qwerty",
  "the existing Uyghur keyboard screen should not mutate isolated Latin keyboard state"
);

includesAll(
  renderState("state.screen = 'vocabComplete'"),
  ["下一步建议", "复习主题词", "进入第六单元"],
  "unit three vocabulary complete"
);

includesAll(
  renderState("state.screen = 'practiceComplete'; state.selectedPracticeGroupId = 'listening-loop'; state.currentPracticeItemId = 'practice-listen-be'"),
  ["继续学习本单元下一课程", "下一步建议", "再练一轮", "返回字母练习"],
  "letter practice complete"
);
assert.ok(
  app.innerHTML.includes('data-action="open-practice-group" data-id="repeat-loop"'),
  "practice completion should point to the next formal practice course"
);
const lastPracticeComplete = renderState("state.screen = 'practiceComplete'; state.selectedPracticeGroupId = 'keyboard-loop'; state.currentPracticeItemId = 'practice-keyboard-kaf'");
assert.ok(!lastPracticeComplete.includes("继续学习本单元下一课程"), "the last formal practice course should not continue into the dynamic mistake review");

const vocabCourseComplete = renderState("state.screen = 'vocabComplete'; state.selectedVocabGroupId = 'greetings'; state.currentVocabItemId = 'yaxshimusiz'");
assert.ok(vocabCourseComplete.includes("继续学习本单元下一课程"), "vocabulary completion should continue to the next section");
assert.ok(
  vocabCourseComplete.includes('data-action="open-vocab-course" data-id="greetings" data-item-id="rahmat"'),
  "vocabulary continuation should point to the next section's first item"
);
clickDataset({ action: "open-vocab-course", id: "greetings", itemId: "rahmat" });
assert.equal(vm.runInContext("state.selectedVocabGroupId", context), "greetings", "vocabulary continuation should preserve the topic when another section exists");
assert.equal(vm.runInContext("state.currentVocabItemId", context), "rahmat", "vocabulary continuation should start at the next section's first item");

const readingCourse = renderState("state.screen = 'reading'; state.selectedReadingUnitId = 'dialogue-theater'; state.selectedReadingGroupId = 'dialogue-greeting'");
assert.ok(readingCourse.includes("继续学习本单元下一课程"), "reading lessons should continue within the same unit");
assert.ok(
  readingCourse.includes('data-action="open-reading-group" data-unit-id="dialogue-theater" data-id="dialogue-family"'),
  "reading continuation should point to the next lesson in the same unit"
);
const lastReadingCourse = renderState("state.screen = 'reading'; state.selectedReadingUnitId = 'dialogue-theater'; state.selectedReadingGroupId = 'dialogue-guest'");
assert.ok(!lastReadingCourse.includes("继续学习本单元下一课程"), "the last reading lesson should not show a nonexistent continuation");

const schoolGloss = vm.runInContext("renderSentenceGlosses('بۈگۈن دەرس بارمۇ؟')", context);
includesAll(
  schoolGloss,
  ["从右向左理解", "gloss-direction", 'data-gloss-word="بۈگۈن"', 'data-gloss-word="دەرس"', 'data-gloss-word="بارمۇ"'],
  "centered rtl sentence gloss"
);
assert.ok(
  schoolGloss.indexOf('data-gloss-word="بۈگۈن"') < schoolGloss.indexOf('data-gloss-word="دەرس"') &&
    schoolGloss.indexOf('data-gloss-word="دەرس"') < schoolGloss.indexOf('data-gloss-word="بارمۇ"'),
  "sentence gloss source order should match the original Uyghur sentence"
);
assert.ok(
  schoolGloss.indexOf('data-morpheme="بار"') < schoolGloss.indexOf('data-morpheme="مۇ"'),
  "morpheme source order should keep the root before the suffix"
);
assert.ok(schoolGloss.includes('class="morpheme-direction"'), "morpheme breakdown should use a right-to-left direction arrow");
const kitabingizGloss = vm.runInContext("renderSentenceGlosses('كىتابىڭىز بارمۇ؟')", context);
includesAll(
  kitabingizGloss,
  ["كىتاب + ـىڭىز → كىتابىڭىز", "词干末尾不变", "您的（第二人称礼貌或复数物主后缀）"],
  "word-local possessive formation"
);
assert.equal(vm.runInContext("renderSentenceGlosses('رەھمەت.')", context), "", "a single indivisible word should not repeat its meaning in a gloss panel");
const inlineVocabGlosses = renderState(
  "state.screen = 'vocab'; state.selectedVocabGroupId = 'greetings'; state.currentVocabItemId = 'yaxshimusiz'"
);
assert.doesNotMatch(
  inlineVocabGlosses,
  /class="vocab-morpheme-breakdown"|data-morpheme=/,
  "vocabulary rows should not show morpheme breakdowns"
);
assert.doesNotMatch(
  inlineVocabGlosses,
  /逐词与词素参考/,
  "vocabulary lessons should not repeat the active word in a bottom gloss panel"
);
const vocabGroupIds = JSON.parse(vm.runInContext("JSON.stringify(vocabGroups.map((group) => group.id))", context));
for (const groupId of vocabGroupIds) {
  const vocabLessonHtml = renderState(
    `state.screen = 'vocab'; state.selectedVocabGroupId = ${JSON.stringify(groupId)}; state.currentVocabItemId = vocabGroups.find((group) => group.id === ${JSON.stringify(groupId)}).items[0].id`
  );
  assert.doesNotMatch(
    vocabLessonHtml,
    /class="item-progress"/,
    `${groupId} vocabulary lesson should not show a redundant current-item status bar`
  );
  assert.doesNotMatch(
    vocabLessonHtml,
    /class="vocab-morpheme-breakdown"|data-morpheme=/,
    `${groupId} vocabulary lesson should not show morpheme breakdowns`
  );
}
const wordGlossStyle = styleSource.match(/^\.word-glosses\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(wordGlossStyle.includes("direction: rtl;"), "word glosses should begin at the right edge");
assert.ok(wordGlossStyle.includes("justify-content: center;"), "word glosses should be centered");
const morphemeGlossStyle = styleSource.match(/^\.morpheme-glosses\s*\{(?<body>[^}]*)\}/ms)?.groups?.body || "";
assert.ok(morphemeGlossStyle.includes("direction: rtl;"), "morpheme breakdowns should run from right to left");

const freshSentenceFallbackHtml = renderState(`
  state.screen = "syllableSentences";
  state.selectedUnitId = "syllable-training";
  state.learningProgress = { latinWriting: {}, letters: {}, combos: {}, syllableTraining: {}, vocab: {}, practice: {}, reading: {} };
`);
assert.equal(
  vm.runInContext("state.screen", context),
  "syllableWarmup",
  "a fresh sentence route must resolve to the first reachable syllable-training screen"
);
assert.match(
  freshSentenceFallbackHtml,
  /两字母热身/,
  "a fresh sentence route must render the matching warmup content, not the rules screen"
);
const freshSentenceProgressBeforeAction = vm.runInContext("JSON.stringify(state.learningProgress)", context);
clickDataset({ action: "show-standard-sentence" });
assert.equal(
  vm.runInContext("JSON.stringify(state.learningProgress)", context),
  freshSentenceProgressBeforeAction,
  "an unreachable sentence action must route to its prerequisite without writing progress"
);

const syllableTrainingData = context.window.ANA_TILIM_COURSE.syllableTraining;
const sentenceReadingPrerequisite = {
  "two-letter-warmup": { completedIds: syllableTrainingData.twoLetterItems.map((item) => item.id), completed: true },
  ...Object.fromEntries(syllableTrainingData.rules.map((rule) => [
    rule.id,
    { completedIds: rule.exercises.map((item) => item.id), completed: true }
  ])),
  "connection-errors": { completedIds: syllableTrainingData.connectionItems.map((item) => item.id), completed: true }
};
const firstSyllableSentence = syllableTrainingData.sentences[0];
function renderedStandardSentenceText(sentenceId) {
  const markerIndex = app.innerHTML.indexOf(`data-syllable-standard-sentence="${sentenceId}"`);
  assert.notEqual(markerIndex, -1, `${sentenceId} standard layer should be present`);
  const textStart = app.innerHTML.indexOf(">", markerIndex) + 1;
  const textEnd = app.innerHTML.indexOf("</div>", textStart);
  return app.innerHTML.slice(textStart, textEnd);
}
vm.runInContext("state.syllableSentenceIndex = 5", context);
assert.equal(
  vm.runInContext("currentSyllableSentence().id", context),
  firstSyllableSentence.id,
  "sentence reading must resume the first incomplete sentence instead of honoring a stale later index"
);
const syllableSentenceHtml = renderState(`
  state.screen = "syllableSentences";
  state.selectedUnitId = "syllable-training";
  state.learningProgress = { latinWriting: {}, letters: {}, combos: {}, syllableTraining: ${JSON.stringify(sentenceReadingPrerequisite)}, vocab: {}, practice: {}, reading: {} };
  state.syllableSentenceIndex = 0;
  state.syllableSentenceShowStandard = false;
`);
assert.match(syllableSentenceHtml, new RegExp(`data-syllable-sentence-id="${firstSyllableSentence.id}"`), "the first unlocked sentence should render its stable sentence ID");
assert.match(syllableSentenceHtml, /data-target="syllableConnections"[^>]*aria-label="返回"/, "the sentence back button should return to connection training");
assert.match(syllableSentenceHtml, /data-action="show-standard-sentence"/, "sentence reading should let the learner view the exact standard layer");
assert.equal((syllableSentenceHtml.match(/data-syllable-sentence-chip/g) || []).length, firstSyllableSentence.syllables.length, "the helper layer should keep one DOM chip per approved syllable");
assert.match(syllableSentenceHtml, /data-action="play-syllable-part"[^>]*disabled/, "unlistened syllable segments must stay visibly disabled");
assert.ok(syllableSentenceHtml.includes("待核听/暂不可用"), "disabled segments should explain that timing is unavailable");
assert.ok(syllableSentenceHtml.includes('data-action="play-syllable-sentence" data-rate="0.75"'), "sentence reading should expose a 0.75 slow whole-sentence mode");
assert.ok(syllableSentenceHtml.includes('data-action="play-syllable-sentence" data-rate="1"'), "sentence reading should expose a normal whole-sentence mode");
assert.equal(
  vm.runInContext(`syllableSentenceSource(syllableTraining.sentences[0]).outputPath`, context),
  firstSyllableSentence.audioPath,
  "the sentence must resolve to the existing reviewed reading audio path"
);

clickDataset({ action: "show-standard-sentence" });
assert.equal(renderedStandardSentenceText(firstSyllableSentence.id), firstSyllableSentence.standard, "the standard layer must copy the exact approved sentence without inserted separators");
const sentenceAudioStartIndex = playedAudioSources.length;
clickDataset({ action: "play-syllable-sentence", rate: "0.75" });
const sentenceAudioInstance = vm.runInContext("__testSentenceAudioInstances.at(-1)", context);
sentenceAudioInstance.resolvePlayback();
await Promise.resolve();
await Promise.resolve();
assert.equal(
  playedAudioSources[sentenceAudioStartIndex],
  firstSyllableSentence.audioPath,
  "slow sentence mode must start the exact reviewed human whole-sentence recording"
);
assert.equal(
  vm.runInContext("currentSyllableSentence().id", context),
  firstSyllableSentence.id,
  "a successful audio start must keep the visible sentence stable until the learner explicitly continues"
);
assert.equal(sentenceAudioInstance.playbackRate, 0.75, "slow sentence mode must set the real controller audio rate to 0.75");
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(syllableSentenceAudioController.snapshot())", context)),
  { rate: 0.75, loop: false, contentKey: `syllable-sentence:${firstSyllableSentence.id}`, playing: true },
  "a successful slow start must retain the current stable sentence content key"
);
assert.equal(sentenceAudioInstance.pauseCount, 0, "the active sentence must not be paused before explicit continue");
assert.match(app.innerHTML, /data-action="continue-syllable-sentence"[^>]*>继续下一句</, "only the three completed requirements should reveal an explicit continue action");
vm.runInContext("handleCloudStatus({ phase: 'syncing', authEvent: '', error: '' })", context);
assert.match(app.innerHTML, /data-action="continue-syllable-sentence"/, "a cloud-status-only render must preserve the current sentence readiness");
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify({ helper: state.syllableSentenceHelperViewed, standard: state.syllableSentenceShowStandard, audio: state.syllableSentenceAudioPlayed })", context)),
  { helper: true, standard: true, audio: true },
  "a status-only render must not erase helper, standard, or successful audio evidence"
);
clickDataset({ action: "continue-syllable-sentence" });
assert.equal(sentenceAudioInstance.pauseCount, 1, "explicit continue must stop the active whole-sentence audio exactly once");
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.learningProgress.syllableTraining['sentence-reading'].completedIds)", context)),
  [firstSyllableSentence.id],
  "continue, rather than onStarted, must submit the stable sentence"
);
assert.equal(vm.runInContext("currentSyllableSentence().id", context), syllableTrainingData.sentences[1].id, "continue must reveal the next stable sentence");

clickDataset({ action: "show-standard-sentence" });
clickDataset({ action: "play-syllable-sentence", rate: "1" });
const rejectedSentenceAudio = vm.runInContext("__testSentenceAudioInstances.at(-1)", context);
assert.equal(rejectedSentenceAudio.playbackRate, 1, "normal sentence mode must set the real controller audio rate to 1");
rejectedSentenceAudio.rejectPlayback(new Error("autoplay blocked"));
await Promise.resolve();
await Promise.resolve();
assert.match(app.innerHTML, /音频未能启动，请重试/, "a rejected real Audio play must show retry feedback");
assert.doesNotMatch(app.innerHTML, /data-action="continue-syllable-sentence"/, "a failed real Audio play must not unlock continue");
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.learningProgress.syllableTraining['sentence-reading'].completedIds)", context)),
  [firstSyllableSentence.id],
  "a failed real Audio play must not submit a sentence"
);
clickDataset({ action: "play-syllable-sentence", rate: "1" });
const staleSentenceAudio = vm.runInContext("__testSentenceAudioInstances.at(-1)", context);
clickDataset({ action: "play-syllable-sentence", rate: "0.75" });
const currentSentenceAudio = vm.runInContext("__testSentenceAudioInstances.at(-1)", context);
assert.equal(staleSentenceAudio.pauseCount, 1, "starting a replacement mode must stop the prior pending sentence audio");
staleSentenceAudio.resolvePlayback();
await Promise.resolve();
await Promise.resolve();
assert.doesNotMatch(app.innerHTML, /data-action="continue-syllable-sentence"/, "a stale late start callback must not unlock the current sentence");
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(syllableSentenceAudioController.snapshot())", context)),
  { rate: 0.75, loop: false, contentKey: `syllable-sentence:${syllableTrainingData.sentences[1].id}`, playing: true },
  "a stale late callback must leave the replacement sentence content key active"
);
currentSentenceAudio.resolvePlayback();
await Promise.resolve();
await Promise.resolve();
assert.match(app.innerHTML, /data-action="continue-syllable-sentence"/, "a successful retry must unlock continue without changing sentence");
clickDataset({ action: "continue-syllable-sentence" });
assert.equal(currentSentenceAudio.pauseCount, 1, "continue must stop the replacement active audio before advancing");

renderState(`
  state.screen = "syllableSentences";
  state.selectedUnitId = "syllable-training";
  state.learningProgress = { latinWriting: {}, letters: {}, combos: {}, syllableTraining: ${JSON.stringify(sentenceReadingPrerequisite)}, vocab: {}, practice: {}, reading: {} };
  state.syllableSentenceIndex = 0;
  state.syllableSentenceShowStandard = false;
  state.syllableSentenceAudioPlayed = false;
  state.syllableSentencePlaybackStatus = "";
  state.dailyActivity = { date: localDayKey(), completedIds: [] };
`);
assert.doesNotMatch(appSource, /playSegment/, "sentence reading must never call an unavailable segment API");
for (const [index, sentence] of syllableTrainingData.sentences.entries()) {
  const helperHtml = app.innerHTML;
  const chipTexts = Array.from(helperHtml.matchAll(/data-syllable-sentence-chip>([^<]*)<\/span>/g), (match) => match[1]);
  assert.deepEqual(chipTexts, Array.from(sentence.syllables, (part) => part.text), `${sentence.id} helper chips must preserve approved text and DOM order`);
  assert.match(helperHtml, /class="syllable-sentence-chips" dir="rtl"/, `${sentence.id} helper chips must be RTL`);
  assert.match(helperHtml, /class="syllable-sentence-controls" dir="ltr"/, `${sentence.id} controls must be LTR`);
  assert.match(helperHtml, /class="syllable-sentence-latin" dir="ltr"/, `${sentence.id} ULY must be LTR`);
  assert.doesNotMatch(helperHtml, /data-action="continue-syllable-sentence"/, `${sentence.id} must not continue before standard and audio requirements`);
  clickDataset({ action: "show-standard-sentence" });
  assert.equal(renderedStandardSentenceText(sentence.id), sentence.standard, `${sentence.id} standard layer must be exact and contain no inserted separator spans`);
  assert.doesNotMatch(app.innerHTML, /data-action="continue-syllable-sentence"/, `${sentence.id} must not continue before successful audio`);
  clickDataset({ action: "play-syllable-sentence", rate: index % 2 ? "1" : "0.75" });
  const loopSentenceAudio = vm.runInContext("__testSentenceAudioInstances.at(-1)", context);
  assert.equal(loopSentenceAudio.src, sentence.audioPath, `${sentence.id} must play its exact reviewed reading audio path`);
  assert.equal(loopSentenceAudio.playbackRate, index % 2 ? 1 : 0.75, `${sentence.id} must apply its selected whole-sentence rate`);
  loopSentenceAudio.resolvePlayback();
  await Promise.resolve();
  await Promise.resolve();
  assert.match(app.innerHTML, /data-action="continue-syllable-sentence"/, `${sentence.id} successful whole-sentence audio must unlock continue`);
  assert.equal(vm.runInContext("currentSyllableSentence().id", context), sentence.id, `${sentence.id} must remain visible until its explicit continue`);
  clickDataset({ action: "continue-syllable-sentence" });
  assert.equal(loopSentenceAudio.pauseCount, 1, `${sentence.id} continue must stop active audio`);
  const loopProgress = JSON.parse(vm.runInContext("JSON.stringify(state.learningProgress.syllableTraining['sentence-reading'])", context));
  assert.deepEqual(loopProgress.completedIds, Array.from(syllableTrainingData.sentences).slice(0, index + 1).map((item) => item.id), `${sentence.id} must append ordered sentence progress only on continue`);
  assert.equal(loopProgress.completed === true, index === syllableTrainingData.sentences.length - 1, `${sentence.id} may set completed only after the final sentence`);
}
assert.match(app.innerHTML, /data-action="open-unit" data-id="basic-phrases"/, "finishing all six sentences must expose the existing basic-phrases CTA");
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(state.dailyActivity.completedIds)", context)),
  ["syllableTraining:sentence-reading:completed"],
  "the final sentence stage must extend the existing daily completed-stage ID convention"
);
clickDataset({ action: "open-unit", id: "basic-phrases" });
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify({ screen: state.screen, unit: state.selectedUnitId })", context)),
  { screen: "unit", unit: "basic-phrases" },
  "the final sentence CTA must use the existing unit route"
);

renderState(`
  state.screen = "syllableSentences";
  state.selectedUnitId = "syllable-training";
  state.learningProgress = { latinWriting: {}, letters: {}, combos: {}, syllableTraining: ${JSON.stringify(sentenceReadingPrerequisite)}, vocab: {}, practice: {}, reading: {} };
  state.syllableSentenceShowStandard = false;
  state.syllableSentenceAudioPlayed = false;
  state.syllableSentencePlaybackStatus = "";
`);
clickDataset({ action: "show-standard-sentence" });
clickDataset({ action: "play-syllable-sentence", rate: "0.75" });
const cloudAdvanceAudio = vm.runInContext("__testSentenceAudioInstances.at(-1)", context);
cloudAdvanceAudio.resolvePlayback();
await Promise.resolve();
await Promise.resolve();
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify(syllableSentenceAudioController.snapshot())", context)),
  { rate: 0.75, loop: false, contentKey: `syllable-sentence:${firstSyllableSentence.id}`, playing: true },
  "a cloud merge race starts with the first sentence actively playing"
);
const cloudSentencePrefixProgress = {
  latinWriting: {}, letters: {}, combos: {},
  syllableTraining: { ...sentenceReadingPrerequisite, "sentence-reading": { completedIds: [firstSyllableSentence.id] } },
  vocab: {}, practice: {}, reading: {}
};
vm.runInContext(`applyCloudSnapshot(${JSON.stringify({ ...cloudSnapshotBase, learningProgress: cloudSentencePrefixProgress })}); handleCloudStatus({ phase: "synced", authEvent: "", error: "" });`, context);
assert.equal(vm.runInContext("currentSyllableSentence().id", context), syllableTrainingData.sentences[1].id, "a legal remote sentence prefix must move the rendered sentence to the next stable ID");
assert.equal(cloudAdvanceAudio.pauseCount, 1, "a cloud merge that changes the active sentence must stop its prior audio before render");
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify({ standard: state.syllableSentenceShowStandard, audio: state.syllableSentenceAudioPlayed, status: state.syllableSentencePlaybackStatus })", context)),
  { standard: false, audio: false, status: "" },
  "a cloud-driven sentence change must reset the prior sentence transient evidence"
);

renderState(`
  state.screen = "syllableSentences";
  state.selectedUnitId = "syllable-training";
  state.learningProgress = { latinWriting: {}, letters: {}, combos: {}, syllableTraining: ${JSON.stringify(sentenceReadingPrerequisite)}, vocab: {}, practice: {}, reading: {} };
  state.syllableSentenceShowStandard = false;
  state.syllableSentenceAudioPlayed = false;
  state.syllableSentencePlaybackStatus = "";
`);
clickDataset({ action: "show-standard-sentence" });
clickDataset({ action: "play-syllable-sentence", rate: "1" });
const cloudSameSentenceAudio = vm.runInContext("__testSentenceAudioInstances.at(-1)", context);
cloudSameSentenceAudio.resolvePlayback();
await Promise.resolve();
await Promise.resolve();
vm.runInContext(`applyCloudSnapshot(${JSON.stringify({ ...cloudSnapshotBase, learningProgress: { latinWriting: {}, letters: {}, combos: {}, syllableTraining: sentenceReadingPrerequisite, vocab: {}, practice: {}, reading: {} } })}); handleCloudStatus({ phase: "synced", authEvent: "", error: "" });`, context);
assert.equal(cloudSameSentenceAudio.pauseCount, 0, "a cloud merge that keeps the same sentence must not interrupt active audio");
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify({ helper: state.syllableSentenceHelperViewed, standard: state.syllableSentenceShowStandard, audio: state.syllableSentenceAudioPlayed })", context)),
  { helper: true, standard: true, audio: true },
  "a same-sentence cloud render must preserve helper, standard, and successful audio evidence"
);

renderState(`
  state.screen = "syllableSentences";
  state.selectedUnitId = "syllable-training";
  state.learningProgress = { latinWriting: {}, letters: {}, combos: {}, syllableTraining: ${JSON.stringify(sentenceReadingPrerequisite)}, vocab: {}, practice: {}, reading: {} };
  state.syllableSentenceShowStandard = false;
  state.syllableSentenceAudioPlayed = false;
  state.syllableSentencePlaybackStatus = "";
`);
clickDataset({ action: "show-standard-sentence" });
clickDataset({ action: "play-syllable-sentence", rate: "1" });
const localAdvanceAudio = vm.runInContext("__testSentenceAudioInstances.at(-1)", context);
localAdvanceAudio.resolvePlayback();
await Promise.resolve();
await Promise.resolve();
assert.equal(
  vm.runInContext(`applyLocalProgressData(${JSON.stringify({ screen: "syllableSentences", learningProgress: cloudSentencePrefixProgress })})`, context),
  true,
  "a valid local/import-style sentence prefix should apply"
);
assert.equal(localAdvanceAudio.pauseCount, 1, "a local/import-style sentence change must also stop its prior active audio");
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify({ standard: state.syllableSentenceShowStandard, audio: state.syllableSentenceAudioPlayed, status: state.syllableSentencePlaybackStatus })", context)),
  { standard: false, audio: false, status: "" },
  "a local/import-style sentence change must reset transient evidence before its next render"
);

renderState(`
  state.screen = "syllableSentences";
  state.selectedUnitId = "syllable-training";
  state.learningProgress = { latinWriting: {}, letters: {}, combos: {}, syllableTraining: ${JSON.stringify(sentenceReadingPrerequisite)}, vocab: {}, practice: {}, reading: {} };
  state.syllableSentenceShowStandard = false;
  state.syllableSentenceAudioPlayed = false;
  state.syllableSentencePlaybackStatus = "";
`);
clickDataset({ action: "show-standard-sentence" });
clickDataset({ action: "play-syllable-sentence", rate: "1" });
const confirmedImportAudio = vm.runInContext("__testSentenceAudioInstances.at(-1)", context);
confirmedImportAudio.resolvePlayback();
await Promise.resolve();
await Promise.resolve();
vm.runInContext(`state.pendingProgressImport = { data: ${JSON.stringify({ screen: "syllableSentences", learningProgress: cloudSentencePrefixProgress })} }; confirmLocalProgressImport();`, context);
assert.equal(confirmedImportAudio.pauseCount, 1, "confirming an import from sentence reading must stop the prior active audio before leaving the screen");
assert.equal(vm.runInContext("state.screen", context), "profile", "a confirmed import retains its existing profile destination");

renderState(`
  state.screen = "syllableSentences";
  state.selectedUnitId = "syllable-training";
  state.learningProgress = { latinWriting: {}, letters: {}, combos: {}, syllableTraining: ${JSON.stringify(sentenceReadingPrerequisite)}, vocab: {}, practice: {}, reading: {} };
  state.syllableSentenceShowStandard = false;
  state.syllableSentenceAudioPlayed = false;
  state.syllableSentencePlaybackStatus = "";
`);
clickDataset({ action: "show-standard-sentence" });
clickDataset({ action: "play-syllable-sentence", rate: "0.75" });
const cloudUnreachableAudio = vm.runInContext("__testSentenceAudioInstances.at(-1)", context);
cloudUnreachableAudio.resolvePlayback();
await Promise.resolve();
await Promise.resolve();
vm.runInContext(`applyCloudSnapshot(${JSON.stringify({ ...cloudSnapshotBase, learningProgress: { latinWriting: {}, letters: {}, combos: {}, syllableTraining: {}, vocab: {}, practice: {}, reading: {} } })}); handleCloudStatus({ phase: "synced", authEvent: "", error: "" });`, context);
assert.equal(cloudUnreachableAudio.pauseCount, 1, "a cloud merge that makes the sentence screen unreachable must stop active audio");
assert.equal(vm.runInContext("state.screen", context), "syllableWarmup", "an unreachable cloud sentence screen must render its prerequisite fallback");

const legacySentenceStageProgress = {
  latinWriting: {}, letters: {}, combos: {}, syllableTraining: sentenceReadingPrerequisite, vocab: {}, practice: {}, reading: {}
};
assert.doesNotThrow(
  () => vm.runInContext(`validateImportedProgressIds(${JSON.stringify({ learningProgress: legacySentenceStageProgress })})`, context),
  "legacy progress without the new sentence-reading stage must remain compatible"
);
const invalidSentenceScreenProgress = { latinWriting: {}, letters: {}, combos: {}, syllableTraining: {}, vocab: {}, practice: {}, reading: {} };
assert.equal(
  vm.runInContext(`applyLocalProgressData(${JSON.stringify({ screen: "syllableSentences", learningProgress: invalidSentenceScreenProgress })})`, context),
  true,
  "local progress must normalize an unreachable sentence-reading screen"
);
assert.equal(vm.runInContext("state.screen", context), "syllableWarmup", "invalid local sentence routes must normalize to warmup");
assert.equal(vm.runInContext("JSON.stringify(state.learningProgress)", context), JSON.stringify(invalidSentenceScreenProgress), "sentence route normalization must not invent progress");
const invalidSentenceImport = JSON.parse(vm.runInContext("JSON.stringify(progressTransfer.createExportPayload(buildLocalProgressData(), { edition: appConfig.edition, brandName: appConfig.brandName }))", context));
invalidSentenceImport.data.screen = "syllableSentences";
invalidSentenceImport.data.learningProgress = invalidSentenceScreenProgress;
const normalizedSentenceImport = vm.runInContext(
  `importLocalProgressText(${JSON.stringify(JSON.stringify(invalidSentenceImport))})`,
  context
);
assert.equal(normalizedSentenceImport.data.screen, "syllableWarmup", "import must normalize an unreachable sentence-reading screen before staging");
assert.equal(vm.runInContext("state.pendingProgressImport.data.screen", context), "syllableWarmup", "the staged import must contain only its reachable route");
vm.runInContext("state.pendingProgressImport = null", context);
const cloudProgressBeforeInvalidSentenceScreen = vm.runInContext("JSON.stringify(state.learningProgress)", context);
const invalidSentenceCloudProgress = {
  ...invalidSentenceScreenProgress,
  syllableTraining: { "sentence-reading": { completedIds: [firstSyllableSentence.id] } }
};
assert.throws(
  () => vm.runInContext(`applyCloudSnapshot(${JSON.stringify({ ...cloudSnapshotBase, learningProgress: invalidSentenceCloudProgress })})`, context),
  /必须先完成 connection-errors 才能记录 sentence-reading/,
  "cloud validation must reject sentence progress ahead of its required connection stage"
);
assert.equal(vm.runInContext("JSON.stringify(state.learningProgress)", context), cloudProgressBeforeInvalidSentenceScreen, "invalid sentence cloud payload must not mutate progress before rejection");

const approvedWarmupStage = {
  "two-letter-warmup": {
    completedIds: [
      "warmup-ba", "warmup-pa", "warmup-ta", "warmup-na", "warmup-la",
      "warmup-ma", "warmup-be-e", "warmup-pe-e", "warmup-te-e", "warmup-ne-e"
    ],
    completed: true
  }
};
const emptySyllableLearningProgress = {
  latinWriting: {}, letters: {}, combos: {}, syllableTraining: {}, vocab: {}, practice: {}, reading: {}
};

const writesBeforeBlockedRuleRender = progressStorageWriteCount;
const progressBeforeBlockedRuleRender = JSON.stringify(emptySyllableLearningProgress);
vm.runInContext(`
  state.screen = "syllableRules";
  state.selectedUnitId = "syllable-training";
  state.syllableRuleId = "suffix-boundary";
  state.syllableAnswerId = "answer";
  state.syllableAnswerSubmitted = false;
  state.learningProgress = ${progressBeforeBlockedRuleRender};
  render();
`, context);
assert.equal(vm.runInContext("state.screen", context), "syllableWarmup", "render must normalize a rule-only runtime to the reachable warmup");
assert.match(app.innerHTML, /两字母热身/, "a blocked rule render must show the reachable warmup identity");
assert.equal(vm.runInContext("JSON.stringify(state.learningProgress)", context), progressBeforeBlockedRuleRender, "a blocked rule render must not create progress");
assert.equal(progressStorageWriteCount, writesBeforeBlockedRuleRender, "a blocked rule render must not write local storage");

const writesBeforeBlockedRuleGo = progressStorageWriteCount;
vm.runInContext(`state.screen = "unit"; state.learningProgress = ${progressBeforeBlockedRuleRender}; goTo("syllableRules")`, context);
assert.equal(vm.runInContext("state.screen", context), "syllableWarmup", "goTo must normalize an unreachable rule route");
assert.equal(progressStorageWriteCount, writesBeforeBlockedRuleGo, "a blocked rule route must not persist");

const writesBeforeBlockedDelegatedAction = progressStorageWriteCount;
vm.runInContext(`
  state.screen = "syllableRules";
  state.learningProgress = ${progressBeforeBlockedRuleRender};
  state.syllableRuleId = "vowel-nucleus";
  state.syllableAnswerId = "";
  state.syllableAnswerSubmitted = false;
`, context);
clickDataset({ action: "pick-syllable-rule-answer", answerId: "answer" });
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify({ screen: state.screen, answer: state.syllableAnswerId, progress: state.learningProgress })", context)),
  { screen: "syllableWarmup", answer: "", progress: emptySyllableLearningProgress },
  "a stale delegated rule pick must normalize without mutating answer or progress"
);
assert.equal(progressStorageWriteCount, writesBeforeBlockedDelegatedAction, "a blocked delegated rule action must not persist");

vm.runInContext(`
  state.screen = "syllableRules";
  state.learningProgress = ${progressBeforeBlockedRuleRender};
  state.syllableRuleId = "vowel-nucleus";
  state.syllableAnswerId = "answer";
  state.syllableAnswerSubmitted = false;
`, context);
const writesBeforeBlockedSubmit = progressStorageWriteCount;
clickDataset({ action: "submit-syllable-rule-answer" });
assert.equal(vm.runInContext("state.screen", context), "syllableWarmup", "a stale delegated submit must normalize to warmup");
assert.equal(vm.runInContext("JSON.stringify(state.learningProgress)", context), progressBeforeBlockedRuleRender, "a blocked submit must not add the first exercise");
assert.equal(progressStorageWriteCount, writesBeforeBlockedSubmit, "a blocked submit must not persist");

vm.runInContext(`
  state.screen = "syllableRules";
  state.learningProgress = ${progressBeforeBlockedRuleRender};
  state.syllableRuleId = "vowel-nucleus";
  state.syllableAnswerId = "answer";
  state.syllableAnswerSubmitted = false;
`, context);
let blockedRuleKeyPrevented = false;
const writesBeforeBlockedKey = progressStorageWriteCount;
keydownHandler({
  key: "ArrowDown", ctrlKey: false, altKey: false, metaKey: false,
  target: { closest() { return { dataset: { answerId: "answer" } }; } },
  preventDefault() { blockedRuleKeyPrevented = true; }
});
assert.equal(blockedRuleKeyPrevented, false, "an unreachable rule keyboard event must not be consumed as a valid answer action");
assert.equal(vm.runInContext("state.screen", context), "syllableWarmup", "an unreachable rule keyboard event must normalize to warmup");
assert.equal(vm.runInContext("JSON.stringify(state.learningProgress)", context), progressBeforeBlockedRuleRender, "a blocked rule keyboard event must not mutate progress");
assert.equal(progressStorageWriteCount, writesBeforeBlockedKey, "a blocked rule keyboard event must not persist");

const validWarmupOnlyProgress = { ...emptySyllableLearningProgress, syllableTraining: approvedWarmupStage };
const writesBeforeRuleIdentityRepair = progressStorageWriteCount;
vm.runInContext(`
  state.screen = "syllableRules";
  state.learningProgress = ${JSON.stringify(validWarmupOnlyProgress)};
  state.syllableRuleId = "suffix-boundary";
  state.syllableAnswerId = "distractor";
  state.syllableAnswerSubmitted = true;
  render();
`, context);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify({ screen: state.screen, ruleId: state.syllableRuleId, answer: state.syllableAnswerId, submitted: state.syllableAnswerSubmitted })", context)),
  { screen: "syllableRules", ruleId: "vowel-nucleus", answer: "", submitted: false },
  "rules must normalize to the first incomplete rule and clear stale answer evidence"
);
assert.match(app.innerHTML, /data-syllable-rule-id="vowel-nucleus"/, "rule normalization must render the first incomplete rule identity");
assert.equal(progressStorageWriteCount, writesBeforeRuleIdentityRepair, "repairing a stale rule identity must not persist during the blocked render");

const secondRuleReachableProgress = {
  ...validWarmupOnlyProgress,
  syllableTraining: { ...approvedWarmupStage, "vowel-nucleus": completeVowelNucleusProgress }
};
vm.runInContext(`
  state.screen = "syllableRules";
  state.learningProgress = ${JSON.stringify(secondRuleReachableProgress)};
  state.syllableRuleId = "vowel-nucleus";
  state.syllableAnswerId = "answer";
  state.syllableAnswerSubmitted = true;
  render();
`, context);
assert.equal(vm.runInContext("state.syllableRuleId", context), "single-consonant-boundary", "a forged submitted transient must not keep a completed rule active");

vm.runInContext(`
  state.screen = "syllableRules";
  state.learningProgress = ${JSON.stringify(secondRuleReachableProgress)};
  state.syllableRuleId = "suffix-boundary";
  state.syllableAnswerId = "answer";
  state.syllableAnswerSubmitted = false;
  render();
`, context);
assert.equal(vm.runInContext("state.syllableRuleId", context), "single-consonant-boundary", "a legal prefix must normalize to its first incomplete rule");
assert.match(app.innerHTML, /data-syllable-rule-id="single-consonant-boundary"/, "the rendered identity must match the first incomplete rule");

const everyRuleCompleteProgress = {
  ...validWarmupOnlyProgress,
  syllableTraining: {
    ...approvedWarmupStage,
    "vowel-nucleus": completeVowelNucleusProgress,
    "single-consonant-boundary": completeSingleConsonantProgress,
    "two-consonant-boundary": completeTwoConsonantProgress,
    "suffix-boundary": completeSuffixProgress
  }
};
vm.runInContext(`
  state.screen = "syllableRules";
  state.learningProgress = ${JSON.stringify(everyRuleCompleteProgress)};
  state.syllableRuleId = "vowel-nucleus";
  state.syllableAnswerId = "";
  state.syllableAnswerSubmitted = false;
  render();
`, context);
assert.equal(vm.runInContext("state.syllableRuleId", context), "suffix-boundary", "an all-complete rule route may retain only the final rule and its CTA");
assert.match(app.innerHTML, /data-target="syllableConnections"/, "the all-complete final rule must retain its connection-stage CTA");

vm.runInContext(`
  state.screen = "home";
  state.learningProgress = ${progressBeforeBlockedRuleRender};
  state.syllableRuleId = "suffix-boundary";
  state.syllableAnswerId = "answer";
`, context);
const writesBeforeDirectHydration = progressStorageWriteCount;
assert.equal(
  vm.runInContext(`applyLocalProgressData(${JSON.stringify({ screen: "syllableRules", learningProgress: emptySyllableLearningProgress })})`, context),
  true,
  "direct hydration should accept structurally valid data after normalizing its unreachable route"
);
assert.deepEqual(
  JSON.parse(vm.runInContext("JSON.stringify({ screen: state.screen, ruleId: state.syllableRuleId, answer: state.syllableAnswerId, progress: state.learningProgress })", context)),
  { screen: "syllableWarmup", ruleId: "vowel-nucleus", answer: "", progress: emptySyllableLearningProgress },
  "direct hydration must normalize an unreachable rule route and transient rule identity without progress writes"
);
assert.equal(progressStorageWriteCount, writesBeforeDirectHydration, "direct hydration normalization must not write storage");

const blockedRuleImport = JSON.parse(vm.runInContext("JSON.stringify(progressTransfer.createExportPayload(buildLocalProgressData(), { edition: appConfig.edition, brandName: appConfig.brandName }))", context));
blockedRuleImport.data.screen = "syllableRules";
blockedRuleImport.data.learningProgress = emptySyllableLearningProgress;
const writesBeforeBlockedRuleImport = progressStorageWriteCount;
const normalizedRuleImport = vm.runInContext(`importLocalProgressText(${JSON.stringify(JSON.stringify(blockedRuleImport))})`, context);
assert.equal(normalizedRuleImport.data.screen, "syllableWarmup", "import preview must normalize an unreachable rule route before staging it");
assert.equal(progressStorageWriteCount, writesBeforeBlockedRuleImport, "import route normalization must not write storage");
vm.runInContext("state.pendingProgressImport = null", context);

const invalidLaterRulePrefix = {
  ...validWarmupOnlyProgress,
  syllableTraining: {
    ...approvedWarmupStage,
    "single-consonant-boundary": { completedIds: ["single-consonant-boundary-01"] }
  }
};
const invalidLaterRulePrefixBytes = JSON.stringify(invalidLaterRulePrefix);
const writesBeforeInvalidPrefixRender = progressStorageWriteCount;
vm.runInContext(`
  state.screen = "syllableRules";
  state.learningProgress = ${invalidLaterRulePrefixBytes};
  state.syllableRuleId = "vowel-nucleus";
  state.syllableAnswerId = "";
  state.syllableAnswerSubmitted = false;
  render();
`, context);
assert.equal(vm.runInContext("state.screen", context), "syllableRules", "an invalid later prefix should normalize to the reachable first rule screen");
assert.equal(vm.runInContext("JSON.stringify(state.learningProgress)", context), invalidLaterRulePrefixBytes, "a blocked invalid-prefix render must not ensure or create an empty rule progress entry");
assert.equal(progressStorageWriteCount, writesBeforeInvalidPrefixRender, "a blocked invalid-prefix render must not persist");

vm.runInContext(`
  state.screen = "home";
  state.learningProgress = ${JSON.stringify({
    ...emptySyllableLearningProgress,
    syllableTraining: { "vowel-nucleus": { completedIds: ["vowel-nucleus-01"] } }
  })};
  state.syncDirty = true;
  globalThis.invalidSaveScheduleCount = 0;
  globalThis.cloudBeforeInvalidSave = cloudSync;
  cloudSync = { ...cloudSync, scheduleSync() { globalThis.invalidSaveScheduleCount += 1; } };
`, context);
storage["ana-tilim-progress"] = "preserved-old-bytes";
const invalidRuntimeBeforeSave = vm.runInContext("JSON.stringify(state.learningProgress)", context);
assert.equal(vm.runInContext("saveLocalProgress()", context), false, "saveLocalProgress must reject a semantically invalid runtime before storage or cloud work");
assert.equal(storage["ana-tilim-progress"], "preserved-old-bytes", "an invalid save must preserve the previous local bytes");
assert.equal(vm.runInContext("JSON.stringify(state.learningProgress)", context), invalidRuntimeBeforeSave, "an invalid save must not partially rewrite runtime progress");
assert.equal(vm.runInContext("globalThis.invalidSaveScheduleCount", context), 0, "an invalid save must not schedule cloud sync");
assert.equal(vm.runInContext("state.syncDirty", context), true, "an invalid save must keep syncDirty for a later valid retry");
assert.throws(
  () => vm.runInContext("buildCloudSnapshot()", context),
  /must first complete|\u5fc5\u987b\u5148\u5b8c\u6210/,
  "buildCloudSnapshot must reject an invalid syllable prefix before it can be uploaded"
);
vm.runInContext("cloudSync = globalThis.cloudBeforeInvalidSave", context);

console.log("unit learning experience checks passed");
