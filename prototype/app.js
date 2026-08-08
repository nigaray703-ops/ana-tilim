const courseData = window.ANA_TILIM_COURSE;

if (!courseData) {
  throw new Error("Ana Tilim course data failed to load.");
}

const { alphabetLetters, letterDetails, alphabetGroups, alphabetAudioItems, comboGroups, vocabGroups, practiceGroups, readingUnits } = courseData;
const i18n = window.ANA_TILIM_I18N;
const courseLocalizer = i18n.createCourseLocalizer(courseData, window.ANA_TILIM_COURSE_EN);
let serializedProgress = "";
try {
  serializedProgress = localStorageSafe()?.getItem("ana-tilim-progress") || "";
} catch {
  // Storage can be blocked by browser policy; guest learning must still start.
}
const savedLanguage = i18n.readSavedLanguage(serializedProgress);
const systemLanguages = window.navigator?.languages || [];
const systemFallbackLanguage = window.navigator?.language || "";
const initialInterfaceLanguage = i18n.resolveLanguage(savedLanguage, systemLanguages, systemFallbackLanguage);
i18n.setLanguage(initialInterfaceLanguage);
courseLocalizer.apply(initialInterfaceLanguage);
document.documentElement.lang = initialInterfaceLanguage;

function voiceFileBase(file) {
  return file.replace(/^human_/, "voice_").replace(/\.[^.]+$/, "");
}

function humanAudioFile(file) {
  return file.replace(/\.[^.]+$/, ".webm");
}

function connectVoiceAudio(audio, folder) {
  const file = humanAudioFile(audio.file);

  return {
    ...audio,
    file,
    playable: true,
    get statusLabel() { return i18n.t("audio.humanRecording"); },
    outputPath: `./assets/audio/human/${folder}/${file}`
  };
}

const alphabetVoiceAudioItems = alphabetAudioItems.map((item) => connectVoiceAudio(item, "alphabet"));
const alphabetAudioByLetterId = Object.fromEntries(alphabetVoiceAudioItems.map((item) => [item.letterId, item]));

function safeAudioId(id) {
  return id.replace(/^practice-/, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

const basicComboGroups = comboGroups;
const connectedComboAudioIds = new Set(comboGroups.flatMap((group) => group.items.map((item) => item.id)));

function createAudioItem({ folder, prefix, id, fileId = id, value, latin, order }) {
  const safeId = safeAudioId(fileId);
  const file = `human_${prefix}_${safeId}.webm`;

  return {
    id,
    order,
    value,
    latin,
    file,
    playable: true,
    get statusLabel() { return i18n.t("audio.humanRecording"); },
    outputPath: `./assets/audio/human/${folder}/${file}`
  };
}

function stableFormExampleKey(value) {
  let hash = 2166136261;

  for (const char of value.normalize("NFC")) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function buildFormExampleItems() {
  const byValue = new Map();

  Object.entries(letterDetails).forEach(([letterId, letter]) => {
    (letter.formExamples || []).forEach((example) => {
      if (!example.word) {
        return;
      }

      const current = byValue.get(example.word);
      const occurrence = { letterId, label: example.label };

      if (current) {
        current.latin ||= example.latin || "";
        current.meaning ||= example.meaning || "";
        current.occurrences.push(occurrence);
        return;
      }

      byValue.set(example.word, {
        id: `form-example-${stableFormExampleKey(example.word)}`,
        key: stableFormExampleKey(example.word),
        value: example.word,
        latin: example.latin || "",
        meaning: example.meaning || "",
        occurrences: [occurrence]
      });
    });
  });

  return [...byValue.values()];
}

let formExampleItems = buildFormExampleItems();
const comboAudioItems = comboGroups
  .flatMap((group) => group.items)
  .filter((item) => connectedComboAudioIds.has(item.id))
  .map((item, index) =>
    createAudioItem({
      folder: "combos",
      prefix: "combo",
      id: item.id,
      value: item.value,
      latin: item.latin,
      order: index + 1
    })
  );

const pendingVocabAudioIds = new Set();
const vocabAudioSourceIdByItemId = new Map([
  ["ten-tens", "ten"],
  ["yuz-body", "hundred"],
  ["may-food", "may-month"],
  ["beliq-food", "beliq-animal"]
]);
const vocabAudioItems = vocabGroups.flatMap((group) =>
  group.items.filter((item) => !pendingVocabAudioIds.has(item.id)).map((item, index) =>
    createAudioItem({
      folder: "vocab",
      prefix: "vocab",
      id: item.id,
      fileId: vocabAudioSourceIdByItemId.get(item.id) || item.id,
      value: item.value,
      latin: item.latin,
      order: index + 1
    })
  )
);

const practiceAudioItems = [];
const readingAudioItems = readingUnits
  .flatMap((unit) =>
    unit.groups.flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        audioLatin: item.pattern || item.speaker || unit.subtitle
      }))
    )
  )
  .map((item, index) =>
    createAudioItem({
      folder: "reading",
      prefix: "reading",
      id: item.id,
      value: item.value,
      latin: item.audioLatin,
      order: index + 1
    })
  );

const comboAudioByItemId = Object.fromEntries(comboAudioItems.map((item) => [item.id, item]));
const vocabAudioByItemId = Object.fromEntries(vocabAudioItems.map((item) => [item.id, item]));
const practiceAudioByItemId = Object.fromEntries(practiceAudioItems.map((item) => [item.id, item]));
const readingAudioByItemId = Object.fromEntries(readingAudioItems.map((item) => [item.id, item]));

function firstAudioByValue(items) {
  const result = new Map();

  items.forEach((item) => {
    if (!result.has(item.value)) {
      result.set(item.value, item);
    }
  });

  return result;
}

const vocabAudioByValue = firstAudioByValue(vocabAudioItems);
const comboAudioByValue = firstAudioByValue(comboAudioItems);
const connectedFormExampleAudioIds = new Set(
  formExampleItems
    .filter((item) => !vocabAudioByValue.has(item.value) && !comboAudioByValue.has(item.value))
    .map((item) => item.id)
);
const dedicatedFormExampleAudioByValue = new Map(
  formExampleItems
    .filter((item) => connectedFormExampleAudioIds.has(item.id))
    .map((item, index) => [
      item.value,
      createAudioItem({
        folder: "form-examples",
        prefix: "form_example",
        id: item.id,
        fileId: item.key,
        value: item.value,
        latin: item.latin || "",
        order: index + 1
      })
    ])
);

function formExampleAudioForWord(value) {
  return dedicatedFormExampleAudioByValue.get(value) || vocabAudioByValue.get(value) || comboAudioByValue.get(value) || null;
}

const letterAudioByShapeLatin = Object.fromEntries(
  Object.values(letterDetails)
    .map((letter) => [`${letter.letter}|${letter.latin}`, alphabetAudioByLetterId[letter.id]])
    .filter(([, audio]) => Boolean(audio))
);

const learningUnits = [
  {
    id: "letters",
    get title() { return t("alphabet.unitTitle"); },
    get subtitle() { return t("alphabet.unitSubtitle"); },
    get description() { return t("alphabet.unitDescription"); },
    get bullets() {
      return [
        t("alphabet.unitBulletShape"),
        t("alphabet.unitBulletDots"),
        t("alphabet.unitBulletForms"),
        t("alphabet.unitBulletKeyboard")
      ];
    },
    groups: alphabetGroups,
    actionTarget: "letter"
  },
  {
    id: "combos",
    get title() { return t("combo.unitTitle"); },
    get subtitle() { return t("combo.unitSubtitle"); },
    get description() { return t("combo.unitDescription"); },
    get bullets() {
      return [
        t("combo.unitBulletOpen"),
        t("combo.unitBulletSoft"),
        t("combo.unitBulletThree"),
        t("combo.unitBulletBreaks"),
        t("combo.unitBulletBuild")
      ];
    },
    groups: basicComboGroups,
    actionTarget: "combo"
  },
  {
    id: "basic-phrases",
    get title() { return t("vocab.unitTitle"); },
    get subtitle() { return t("vocab.unitSubtitle"); },
    get description() { return t("vocab.unitDescription"); },
    get bullets() {
      return [
        t("vocab.unitBulletTopics"),
        t("vocab.unitBulletRows"),
        t("vocab.unitBulletRecognition"),
        t("vocab.unitBulletKeyboard")
      ];
    },
    groups: vocabGroups,
    actionTarget: "vocab"
  },
  ...readingUnits.map((unit) => ({
    id: unit.id,
    kind: unit.kind,
    readingKind: unit.readingKind,
    get title() { return unit.title; },
    get subtitle() { return unit.subtitle; },
    get status() { return unit.status; },
    groups: unit.groups,
    actionTarget: "reading"
  }))
];

const unitExperience = {
  letters: {
    get recommended() { return t("alphabet.recommended"); },
    get steps() {
      return [
        t("alphabet.stepGroups"),
        t("alphabet.stepForms"),
        t("alphabet.stepPractice"),
        t("alphabet.stepComplete")
      ];
    },
    get reviewLabel() { return t("alphabet.reviewGroup"); },
    reviewTarget: "group",
    get nextLabel() { return t("alphabet.enterUnit2"); },
    nextUnitId: "combos"
  },
  combos: {
    get recommended() { return t("combo.recommended"); },
    get steps() {
      return [
        t("combo.stepTwo"),
        t("combo.stepThree"),
        t("combo.stepBreaks"),
        t("combo.stepPractice")
      ];
    },
    get reviewLabel() { return t("combo.review"); },
    reviewTarget: "combo",
    get nextLabel() { return t("combo.enterUnit3"); },
    nextUnitId: "basic-phrases"
  },
  "basic-phrases": {
    get recommended() { return t("vocab.recommended"); },
    get steps() {
      return [
        t("vocab.stepTopic"),
        t("vocab.stepWords"),
        t("vocab.stepRecognition"),
        t("vocab.stepKeyboard")
      ];
    },
    get reviewLabel() { return t("vocab.review"); },
    reviewTarget: "vocab",
    get nextLabel() { return t("vocab.enterUnit4"); },
    nextUnitId: "grammar-basics"
  },
  "grammar-basics": {
    get recommended() { return t("reading.grammarRecommended"); },
    get steps() {
      return [
        t("reading.grammarStepChoose"),
        t("reading.grammarStepPattern"),
        t("reading.grammarStepExample"),
        t("reading.grammarStepExplanation")
      ];
    },
    get reviewLabel() { return t("reading.grammarReview"); },
    reviewTarget: "reading",
    get nextLabel() { return t("reading.enterUnit5"); },
    nextUnitId: "sentence-patterns"
  },
  "sentence-patterns": {
    get recommended() { return t("reading.sentenceRecommended"); },
    get steps() {
      return [
        t("reading.sentenceStepChoose"),
        t("reading.sentenceStepRead"),
        t("reading.translationStep")
      ];
    },
    get reviewLabel() { return t("reading.sentenceReview"); },
    reviewTarget: "reading",
    get nextLabel() { return t("reading.enterUnit6"); },
    nextUnitId: "dialogue-theater"
  },
  "dialogue-theater": {
    get recommended() { return t("reading.dialogueRecommended"); },
    get steps() {
      return [
        t("reading.dialogueStepChoose"),
        t("reading.dialogueStepRead"),
        t("reading.translationStep")
      ];
    },
    get reviewLabel() { return t("reading.dialogueReview"); },
    reviewTarget: "reading",
    get nextLabel() { return t("reading.enterUnit7"); },
    nextUnitId: "short-stories"
  },
  "short-stories": {
    get recommended() { return t("reading.storyRecommended"); },
    get steps() {
      return [
        t("reading.storyStepChoose"),
        t("reading.storyStepRead"),
        t("reading.translationStep")
      ];
    },
    get reviewLabel() { return t("reading.storyReview"); },
    reviewTarget: "reading",
    get nextLabel() { return t("reading.enterUnit8"); },
    nextUnitId: "famous-quotes"
  },
  "famous-quotes": {
    get recommended() { return t("reading.quoteRecommended"); },
    get steps() {
      return [
        t("reading.quoteStepChoose"),
        t("reading.quoteStepRead"),
        t("reading.translationStep")
      ];
    },
    get reviewLabel() { return t("reading.quoteReview"); },
    reviewTarget: "reading",
    get nextLabel() { return t("reading.enterUnit9"); },
    nextUnitId: "uyghur-proverbs"
  },
  "uyghur-proverbs": {
    get recommended() { return t("reading.proverbRecommended"); },
    get steps() {
      return [
        t("reading.proverbStepChoose"),
        t("reading.proverbStepRead"),
        t("reading.translationStep")
      ];
    },
    get reviewLabel() { return t("reading.proverbReview"); },
    reviewTarget: "reading",
    get nextLabel() { return t("reading.backToPath"); },
    nextUnitId: "letters",
    nextTarget: "learn"
  }
};

const keyboardRows = [
  ["ق", "و", "ې", "ر", "ت"],
  ["ي", "ۇ", "ڭ", "ا", "س"],
  ["د", "ف", "گ", "ھ", "ج"],
  ["ك", "ل", "ز", "خ", "ب"]
];

const progressStorageKey = "ana-tilim-progress";
const guestBackupStorageKey = "ana-tilim-guest-progress-backup";
const t = i18n.t;
const DEFAULT_PREFERENCES = Object.freeze({
  audioAutoplay: false,
  dailyGoal: 10,
  learningReminder: false,
  showLatin: true,
  uiLanguage: null
});

function normalizePreferences(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    audioAutoplay: typeof source.audioAutoplay === "boolean" ? source.audioAutoplay : false,
    dailyGoal: [5, 10, 15].includes(source.dailyGoal) ? source.dailyGoal : 10,
    learningReminder: typeof source.learningReminder === "boolean" ? source.learningReminder : false,
    showLatin: typeof source.showLatin === "boolean" ? source.showLatin : true,
    uiLanguage: source.uiLanguage === "zh" || source.uiLanguage === "en" ? source.uiLanguage : null
  };
}

function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const letterLoopSteps = [
  { id: "viewed", label: "认识" },
  { id: "writing", label: "描摹" },
  { id: "recognition", label: "辨认听音" },
  { id: "keyboard", label: "键盘" }
];

const initialCloudTimestamp = new Date().toISOString();
const untouchedPreferenceTimestamp = "1970-01-01T00:00:00.000Z";

const state = {
  screen: "welcome",
  interfaceLanguage: initialInterfaceLanguage,
  selectedPicture: "",
  selectedListening: "",
  practiceAudioPlayed: false,
  keyboardValue: "",
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
  practiceSpoken: false,
  writingChecks: [],
  emailAuthExpanded: false,
  emailCodeSent: false,
  authMode: "login",
  authEmail: "",
  avatarUploading: false,
  learningProgress: {
    letters: {},
    combos: {},
    vocab: {},
    practice: {},
    reading: {}
  },
  mistakes: [],
  selectedUnitId: "letters",
  showGuide: true,
  writingStrokes: {},
  favorite: false,
  preferences: { ...DEFAULT_PREFERENCES },
  dailyActivity: { date: "", completedIds: [] },
  clearLearningConfirmation: false,
  modifiedAt: initialCloudTimestamp,
  preferencesUpdatedAt: untouchedPreferenceTimestamp,
  favoriteUpdatedAt: initialCloudTimestamp,
  syncDirty: false
};

hydrateLocalProgress();

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
let toastTimer = null;
let activeAudio = null;
let lastAutoplayKey = "";
let cloudSync = null;
let cloudStatus = { phase: "local", error: "" };

function localStorageSafe() {
  try {
    return window && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

function dailyActivitySnapshot(date = new Date()) {
  const dateKey = localDayKey(date);
  const saved = state.dailyActivity;
  if (!saved || saved.date !== dateKey || !Array.isArray(saved.completedIds)) {
    state.dailyActivity = { date: dateKey, completedIds: [] };
  }
  return state.dailyActivity;
}

function todayGoalProgress() {
  const completed = dailyActivitySnapshot().completedIds.length;
  const goal = state.preferences.dailyGoal;
  return {
    completed,
    goal,
    percent: Math.min(100, Math.round((completed / goal) * 100)),
    complete: completed >= goal
  };
}

function recordDailyActivity(activityId, date = new Date()) {
  if (!activityId) return;
  const activity = dailyActivitySnapshot(date);
  if (!activity.completedIds.includes(activityId)) {
    activity.completedIds.push(activityId);
    markCloudDirty("learning");
  }
}

function hydrateLocalProgress() {
  const storage = localStorageSafe();
  if (!storage) {
    return;
  }

  try {
    const saved = JSON.parse(storage.getItem(progressStorageKey) || "{}");
    if (!saved || typeof saved !== "object") {
      return;
    }

    state.preferences = normalizePreferences(saved.preferences);

    if (
      saved.dailyActivity &&
      typeof saved.dailyActivity === "object" &&
      typeof saved.dailyActivity.date === "string" &&
      Array.isArray(saved.dailyActivity.completedIds)
    ) {
      state.dailyActivity = {
        date: saved.dailyActivity.date,
        completedIds: saved.dailyActivity.completedIds.filter((id) => typeof id === "string")
      };
    }

    const fields = [
      "screen",
      "currentLetterId",
      "selectedGroupId",
      "currentComboItemId",
      "selectedComboGroupId",
      "currentVocabItemId",
      "selectedVocabGroupId",
      "currentPracticeItemId",
      "selectedPracticeGroupId",
      "selectedReadingUnitId",
      "selectedReadingGroupId",
      "selectedUnitId",
      "modifiedAt",
      "preferencesUpdatedAt",
      "favoriteUpdatedAt"
    ];

    fields.forEach((field) => {
      if (typeof saved[field] === "string") {
        state[field] = saved[field];
      }
    });
    if (state.screen === "settings") {
      state.screen = "profile";
    }

    if (typeof saved.favorite === "boolean") {
      state.favorite = saved.favorite;
    }

    if (saved.learningProgress && typeof saved.learningProgress === "object") {
      state.learningProgress = {
        letters: saved.learningProgress.letters || {},
        combos: saved.learningProgress.combos || {},
        vocab: saved.learningProgress.vocab || {},
        practice: saved.learningProgress.practice || {},
        reading: saved.learningProgress.reading || {}
      };
    }

    if (Array.isArray(saved.mistakes)) {
      state.mistakes = saved.mistakes.slice(0, 24);
    }

    if (Array.isArray(saved.writingChecks)) {
      state.writingChecks = saved.writingChecks.slice(0, 3);
    }
  } catch {
    // Ignore damaged local progress and keep the default starter state.
  }
}

function saveLocalProgress() {
  const storage = localStorageSafe();
  if (!storage) {
    return false;
  }

  const saved = {
    screen: state.screen,
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
    selectedUnitId: state.selectedUnitId,
    favorite: state.favorite,
    learningProgress: state.learningProgress,
    mistakes: state.mistakes,
    writingChecks: state.writingChecks,
    preferences: state.preferences,
    dailyActivity: state.dailyActivity,
    modifiedAt: state.modifiedAt,
    preferencesUpdatedAt: state.preferencesUpdatedAt,
    favoriteUpdatedAt: state.favoriteUpdatedAt
  };

  try {
    storage.setItem(progressStorageKey, JSON.stringify(saved));
    if (state.syncDirty && typeof cloudSync?.scheduleSync === "function") {
      cloudSync.scheduleSync(buildCloudSnapshot());
      state.syncDirty = false;
    }
    return true;
  } catch {
    return false;
  }
}

function markCloudDirty(kind = "learning") {
  const timestamp = new Date().toISOString();
  state.syncDirty = true;
  if (kind === "preferences") {
    state.preferencesUpdatedAt = timestamp;
  } else if (kind === "favorite") {
    state.favoriteUpdatedAt = timestamp;
  } else {
    state.modifiedAt = timestamp;
  }
}

function buildCloudSnapshot() {
  return {
    schemaVersion: window.ANA_TILIM_CLOUD?.SCHEMA_VERSION || 1,
    modifiedAt: state.modifiedAt,
    preferencesUpdatedAt: state.preferencesUpdatedAt,
    favoriteUpdatedAt: state.favoriteUpdatedAt,
    learningProgress: state.learningProgress,
    mistakes: state.mistakes,
    favorite: state.favorite,
    dailyActivity: state.dailyActivity,
    preferences: state.preferences
  };
}

function backupGuestProgress() {
  const storage = localStorageSafe();
  if (!storage) {
    return { ok: false, previousValue: null };
  }
  const previousValue = storage.getItem(guestBackupStorageKey);
  try {
    storage.setItem(
      guestBackupStorageKey,
      JSON.stringify({
        backedUpAt: new Date().toISOString(),
        screen: state.screen,
        selectedUnitId: state.selectedUnitId,
        selectedGroupId: state.selectedGroupId,
        snapshot: buildCloudSnapshot()
      })
    );
    return { ok: true, previousValue };
  } catch {
    return { ok: false, previousValue };
  }
}

function restoreGuestProgressBackup(previousValue) {
  const storage = localStorageSafe();
  if (!storage) return false;
  try {
    if (previousValue === null) {
      storage.removeItem(guestBackupStorageKey);
    } else {
      storage.setItem(guestBackupStorageKey, previousValue);
    }
    return true;
  } catch {
    return false;
  }
}

function initializeNewLearnerProgress() {
  state.screen = "home";
  clearLearningRecords();
  saveLocalProgress();
}

function applyCloudSnapshot(snapshot) {
  const normalized = window.ANA_TILIM_CLOUD.normalizeSnapshot(snapshot);
  state.learningProgress = normalized.learningProgress;
  state.mistakes = normalized.mistakes;
  state.favorite = normalized.favorite;
  state.dailyActivity = normalized.dailyActivity;
  state.preferences = normalizePreferences(normalized.preferences);
  applyInterfaceLanguage(state.preferences.uiLanguage, { explicit: false });
  state.modifiedAt = normalized.modifiedAt;
  state.preferencesUpdatedAt = normalized.preferencesUpdatedAt;
  state.favoriteUpdatedAt = normalized.favoriteUpdatedAt;
  state.syncDirty = false;
}

function emptyLearningProgress() {
  return {
    letters: {},
    combos: {},
    vocab: {},
    practice: {},
    reading: {}
  };
}

function learningRecordSnapshot() {
  return JSON.parse(
    JSON.stringify({
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
    })
  );
}

function restoreLearningRecordSnapshot(snapshot) {
  Object.assign(state, snapshot);
}

function clearLearningRecords() {
  state.learningProgress = emptyLearningProgress();
  state.dailyActivity = { date: localDayKey(), completedIds: [] };
  state.mistakes = [];
  state.writingChecks = [];
  state.favorite = false;
  state.selectedPicture = "";
  state.selectedListening = "";
  state.practiceAudioPlayed = false;
  state.keyboardValue = "";
  state.practiceSpoken = false;
  state.currentLetterId = "be";
  state.selectedGroupId = "dot-bone";
  state.currentComboItemId = "ba";
  state.selectedComboGroupId = "open-a";
  state.currentVocabItemId = "yaxshimusiz";
  state.selectedVocabGroupId = "greetings";
  state.currentPracticeItemId = "practice-listen-be";
  state.selectedPracticeGroupId = "listening-loop";
  state.selectedReadingUnitId = "sentence-patterns";
  state.selectedReadingGroupId = "sentence-this-that";
  state.selectedUnitId = "letters";
  state.clearLearningConfirmation = false;
  markCloudDirty("learning");
  markCloudDirty("favorite");
}

function setPreference(key, value) {
  state.preferences = normalizePreferences({
    ...state.preferences,
    [key]: value
  });
  markCloudDirty("preferences");
  saveLocalProgress();
}

function applyInterfaceLanguage(language, { explicit = false } = {}) {
  const effectiveLanguage = i18n.resolveLanguage(language, systemLanguages, systemFallbackLanguage);
  state.interfaceLanguage = effectiveLanguage;
  i18n.setLanguage(effectiveLanguage);
  courseLocalizer.apply(effectiveLanguage);
  formExampleItems = buildFormExampleItems();
  document.documentElement.lang = effectiveLanguage;

  if (explicit) {
    state.preferences = normalizePreferences({
      ...state.preferences,
      uiLanguage: effectiveLanguage
    });
    markCloudDirty("preferences");
    saveLocalProgress();
  }

  return effectiveLanguage;
}

function applyPreferencesToRoot() {
  delete app.dataset.fontSize;
  app.dataset.showLatin = String(state.preferences.showLatin);
}

function currentLetter() {
  return currentGroupLetters().find((letter) => letter.id === state.currentLetterId) || currentGroupLetters()[0];
}

function currentLetterAudio() {
  return alphabetAudioByLetterId[currentLetter().id] || null;
}

function currentGroup() {
  return alphabetGroups.find((group) => group.id === state.selectedGroupId) || alphabetGroups[0];
}

function currentGroupLetters() {
  return currentGroup().letters;
}

function allUnitOneLetters() {
  const detailByLetter = Object.fromEntries(Object.values(letterDetails).map((letter) => [`${letter.letter}|${letter.latin}`, letter]));
  return alphabetLetters.map((letter) => detailByLetter[`${letter.letter}|${letter.latin}`]).filter(Boolean);
}

function groupForLetter(letterId) {
  return alphabetGroups.find((group) => group.letters.some((letter) => letter.id === letterId));
}

function currentComboGroup() {
  return comboGroups.find((group) => group.id === state.selectedComboGroupId) || comboGroups[0];
}

function currentComboItems() {
  return currentComboGroup().items;
}

function currentComboItem() {
  return currentComboItems().find((item) => item.id === state.currentComboItemId) || currentComboItems()[0];
}

function currentComboAudio() {
  return comboAudioByItemId[currentComboItem().id] || null;
}

function comboGroupForItem(itemId) {
  return comboGroups.find((group) => group.items.some((item) => item.id === itemId));
}

function allComboItems() {
  return comboGroups.flatMap((group) => group.items);
}

function unitIdForComboGroup() {
  return "combos";
}

function unitNameForComboGroup() {
  return t("combo.unitName");
}

function currentComboUnit() {
  const unitId = unitIdForComboGroup(currentComboGroup().id);
  return learningUnits.find((unit) => unit.id === unitId) || learningUnits[1];
}

function currentVocabGroup() {
  return vocabGroups.find((group) => group.id === state.selectedVocabGroupId) || vocabGroups[0];
}

function currentVocabItems() {
  return currentVocabGroup().items;
}

function currentVocabItem() {
  return currentVocabItems().find((item) => item.id === state.currentVocabItemId) || currentVocabItems()[0];
}

function currentVocabSection() {
  const group = currentVocabGroup();
  const itemId = currentVocabItem().id;
  return group.sections?.find((section) => section.itemIds.includes(itemId)) || group.sections?.[0] || null;
}

function currentVocabSectionItems() {
  const group = currentVocabGroup();
  const section = currentVocabSection();
  if (!section) {
    return group.items;
  }
  const itemsById = Object.fromEntries(group.items.map((item) => [item.id, item]));
  return section.itemIds.map((itemId) => itemsById[itemId]).filter(Boolean);
}

function currentVocabAudio() {
  return vocabAudioByItemId[currentVocabItem().id] || null;
}

function vocabGroupForItem(itemId) {
  return vocabGroups.find((group) => group.items.some((item) => item.id === itemId));
}

function allVocabItems() {
  return vocabGroups.flatMap((group) => group.items);
}

function currentPracticeGroup() {
  return practiceGroups.find((group) => group.id === state.selectedPracticeGroupId) || practiceGroups[0];
}

function currentPracticeItems() {
  const group = currentPracticeGroup();
  if (group.mode === "review") {
    return mistakeReviewItems();
  }

  return group.items;
}

function currentPracticeItem() {
  return currentPracticeItems().find((item) => item.id === state.currentPracticeItemId) || currentPracticeItems()[0];
}

function practiceListeningCompletedIds(group = currentPracticeGroup()) {
  const knownIds = new Set((group?.items || []).map((item) => item.id));
  const savedIds = state.learningProgress.practice[group?.id]?.listenCompletedIds || [];

  return Array.isArray(savedIds) ? savedIds.filter((id) => knownIds.has(id)) : [];
}

function ensurePracticeListeningProgress(group = currentPracticeGroup()) {
  const progress = ensureProgress("practice", group.id);
  progress.listenCompletedIds = practiceListeningCompletedIds(group);

  return progress;
}

function practiceListeningCompletedCount(group = currentPracticeGroup()) {
  return practiceListeningCompletedIds(group).length;
}

function practiceListeningRoundComplete(group = currentPracticeGroup()) {
  return practiceListeningCompletedCount(group) >= group.items.length;
}

function randomPracticeListeningItem(group = currentPracticeGroup()) {
  const completedIds = new Set(practiceListeningCompletedIds(group));
  const remainingItems = group.items.filter((item) => !completedIds.has(item.id));
  const pool = remainingItems.length ? remainingItems : group.items;
  const index = Math.min(pool.length - 1, Math.floor(Math.random() * pool.length));

  return pool[index] || group.items[0];
}

function selectRandomPracticeListeningItem(group = currentPracticeGroup()) {
  const item = randomPracticeListeningItem(group);
  state.currentPracticeItemId = item?.id || "";
  resetPracticeSessionState();
}

function markPracticeListeningItemComplete(group, item) {
  const progress = ensurePracticeListeningProgress(group);

  if (!progress.listenCompletedIds.includes(item.id)) {
    progress.listenCompletedIds.push(item.id);
    recordDailyActivity(`practice:${group.id}:listen:${item.id}`);
  }

  progress.listen = true;

  if (progress.listenCompletedIds.length >= group.items.length) {
    progress.completed = true;
  } else {
    delete progress.completed;
  }
}

function letterAudioForPracticeItem(item) {
  return item
    ? alphabetAudioByLetterId[item.letterId] ||
        letterAudioByShapeLatin[`${item.value}|${item.latin}`] ||
        null
    : null;
}

function currentPracticeAudio() {
  const item = currentPracticeItem();
  if (!item) {
    return null;
  }

  return item.audio || letterAudioForPracticeItem(item) || practiceAudioByItemId[item.id] || null;
}

function practiceGroupForItem(itemId) {
  return practiceGroups.find((group) => group.items.some((item) => item.id === itemId));
}

function allPracticeItems() {
  return practiceGroups.filter((group) => group.mode !== "review").flatMap((group) => group.items);
}

function audioCoverageTarget({ id, categoryId, categoryTitle, unit, groupTitle, value, latin, kind, audio, fileBase = "" }) {
  const fallbackId = id.startsWith(`${categoryId}-`) ? id.slice(categoryId.length + 1) : id;
  return {
    id,
    categoryId,
    categoryTitle,
    unit,
    groupTitle,
    value,
    latin,
    kind,
    existingAudio: Boolean(audio?.file || audio?.outputPath || audio?.src),
    fileBase: fileBase || (audio?.file ? voiceFileBase(audio.file) : `voice_${categoryId}_${safeAudioId(fallbackId)}`)
  };
}

function alphabetAudioCoverageTargets() {
  return allUnitOneLetters().map((letter) =>
    audioCoverageTarget({
      id: `alphabet-${letter.id}`,
      categoryId: "alphabet",
      categoryTitle: t("audio.categoryAlphabet"),
      unit: t("audio.unit1"),
      groupTitle: groupForLetter(letter.id)?.title || t("audio.alphabetGroupFallback"),
      value: letter.letter,
      latin: letter.latin,
      kind: letter.type,
      audio: alphabetAudioByLetterId[letter.id]
    })
  );
}

function formExampleAudioCoverageTargets() {
  return formExampleItems.map((item) =>
    audioCoverageTarget({
      id: item.id,
      categoryId: "form-example",
      categoryTitle: t("audio.categoryFormExamples"),
      unit: t("audio.unit1"),
      groupTitle: t("audio.formExamplesFallback"),
      value: item.value,
      latin: item.latin || t("audio.noTransliteration"),
      kind: item.meaning || t("audio.formExamplesFallback"),
      audio: formExampleAudioForWord(item.value),
      fileBase: `voice_form_example_${item.key}`
    })
  );
}

function comboAudioCoverageTargets() {
  return allComboItems().map((item) =>
    audioCoverageTarget({
      id: `combo-${item.id}`,
      categoryId: "combo",
      categoryTitle: t("audio.categoryCombinations"),
      unit: unitNameForComboGroup(comboGroupForItem(item.id)?.id),
      groupTitle: comboGroupForItem(item.id)?.title || t("audio.combinationGroupFallback"),
      value: item.value,
      latin: item.latin,
      kind: item.type,
      audio: comboAudioByItemId[item.id]
    })
  );
}

function vocabAudioCoverageTargets() {
  return allVocabItems().map((item) =>
    audioCoverageTarget({
      id: `vocab-${item.id}`,
      categoryId: "vocab",
      categoryTitle: t("audio.categoryVocabulary"),
      unit: t("audio.unit3"),
      groupTitle: vocabGroupForItem(item.id)?.title || t("audio.vocabularyGroupFallback"),
      value: item.value,
      latin: item.latin,
      kind: item.meaning,
      audio: vocabAudioByItemId[item.id]
    })
  );
}

function readingAudioCoverageTargets() {
  return readingUnits.flatMap((unit) =>
    unit.groups.flatMap((group) =>
      group.items.map((item) =>
        audioCoverageTarget({
          id: `reading-${item.id}`,
          categoryId: "reading",
          categoryTitle: t("audio.categorySentences"),
          unit: unit.title,
          groupTitle: group.title,
          value: item.value,
          latin: item.pattern || item.speaker || unit.subtitle,
          kind: item.meaning,
          audio: readingAudioByItemId[item.id]
        })
      )
    )
  );
}

function audioCoverageCategories() {
  return [
    { id: "alphabet", title: t("audio.categoryAlphabet"), items: alphabetAudioCoverageTargets() },
    { id: "form-example", title: t("audio.categoryFormExamples"), items: formExampleAudioCoverageTargets() },
    { id: "combo", title: t("audio.categoryCombinations"), items: comboAudioCoverageTargets() },
    { id: "vocab", title: t("audio.categoryVocabulary"), items: vocabAudioCoverageTargets() },
    { id: "reading", title: t("audio.categorySentences"), items: readingAudioCoverageTargets() }
  ];
}

function allAudioCoverageTargets() {
  return audioCoverageCategories().flatMap((category) => category.items);
}

function currentReadingUnit() {
  return readingUnits.find((unit) => unit.id === state.selectedReadingUnitId) || readingUnits[0];
}

function readingUnitForGroup(groupId) {
  return readingUnits.find((unit) => unit.groups.some((group) => group.id === groupId)) || readingUnits[0];
}

function currentReadingGroup() {
  const unit = currentReadingUnit();
  return unit.groups.find((group) => group.id === state.selectedReadingGroupId) || unit.groups[0];
}

function currentAutoplayEntry() {
  if (state.screen === "group" || state.screen === "letter") {
    const letter = currentLetter();
    const audio = currentLetterAudio();
    return letter && audio?.outputPath
      ? { key: `letter:${letter.id}`, src: audio.outputPath, label: letter.letter }
      : null;
  }

  if (state.screen === "combo") {
    const item = currentComboItem();
    const audio = currentComboAudio();
    return item && audio?.outputPath
      ? { key: `combo:${item.id}`, src: audio.outputPath, label: item.value }
      : null;
  }

  if (state.screen === "vocab") {
    const item = currentVocabItem();
    const audio = currentVocabAudio();
    return item && audio?.outputPath
      ? { key: `vocab:${item.id}`, src: audio.outputPath, label: item.value }
      : null;
  }

  if (state.screen === "practiceSession") {
    const item = currentPracticeItem();
    const audio = currentPracticeAudio();
    return item && audio?.outputPath
      ? { key: `practice:${item.id}`, src: audio.outputPath, label: item.value }
      : null;
  }

  if (state.screen === "reading") {
    const item = currentReadingGroup().items[0];
    const audio = item ? readingAudioByItemId[item.id] : null;
    return item && audio?.outputPath
      ? { key: `reading:${item.id}`, src: audio.outputPath, label: item.value }
      : null;
  }

  return null;
}

function syncAudioAutoplay() {
  const entry = currentAutoplayEntry();
  if (!state.preferences.audioAutoplay || !entry) {
    lastAutoplayKey = "";
    return;
  }
  if (entry.key === lastAutoplayKey) {
    return;
  }

  lastAutoplayKey = entry.key;
  playAudio(entry.src, entry.label, { autoplay: true });
}

function audioForMistake(mistake) {
  if (mistake.kind === "letter") {
    return alphabetAudioByLetterId[mistake.targetId] || null;
  }

  if (mistake.kind === "combo") {
    return comboAudioByItemId[mistake.targetId] || null;
  }

  if (mistake.kind === "vocab") {
    return vocabAudioByItemId[mistake.targetId] || null;
  }

  if (mistake.kind === "practice") {
    const practiceItem = allPracticeItems().find((item) => item.id === mistake.targetId);
    return letterAudioForPracticeItem(practiceItem) || practiceAudioByItemId[mistake.targetId] || null;
  }

  return null;
}

function ensureProgress(scope, id) {
  if (!state.learningProgress[scope]) {
    state.learningProgress[scope] = {};
  }

  if (!state.learningProgress[scope][id]) {
    state.learningProgress[scope][id] = {};
  }

  return state.learningProgress[scope][id];
}

function markProgress(scope, id, step) {
  const progress = ensureProgress(scope, id);
  const wasComplete = progress[step] === true;
  progress[step] = true;
  if (!wasComplete) {
    recordDailyActivity(`${scope}:${id}:${step}`);
  }

  if (scope === "letters") {
    const finishedSteps = letterLoopSteps.every((item) => progress[item.id]);
    if (finishedSteps) {
      progress.completed = true;
    }
  } else if (scope === "practice" && step === "listen") {
    const group = practiceGroups.find((item) => item.id === id);
    if (group && practiceListeningRoundComplete(group)) {
      progress.completed = true;
    }
  } else if (["recognition", "keyboard", "build", "repeat", "write", "review", "completed"].includes(step)) {
    progress.completed = true;
  }
}

function markCurrentLetterViewed() {
  markProgress("letters", state.selectedGroupId, "viewed");
}

function markCurrentLetterRecognition() {
  markProgress("letters", state.selectedGroupId, "recognition");
}

function markCurrentLetterKeyboardIfCorrect() {
  if (state.screen === "keyboard" && state.keyboardValue === currentLetter().letter) {
    markProgress("letters", state.selectedGroupId, "keyboard");
  }
}

function countCompleted(scope) {
  return Object.values(state.learningProgress[scope] || {}).filter((item) => item && item.completed).length;
}

function countCompletedForIds(scope, ids) {
  return ids.filter((id) => state.learningProgress[scope]?.[id]?.completed).length;
}

function unitProgressSummaries() {
  const basicComboIds = basicComboGroups.map((group) => group.id);
  const coreSummaries = [
    { unit: t("progress.unit1"), label: t("progress.alphabet"), completed: countCompleted("letters"), total: alphabetGroups.length },
    { unit: t("progress.unit2"), label: t("progress.combinations"), completed: countCompletedForIds("combos", basicComboIds), total: basicComboIds.length },
    { unit: t("progress.unit3"), label: t("progress.vocabulary"), completed: countCompleted("vocab"), total: vocabGroups.length }
  ];

  const readingSummaries = readingUnits.map((unit) => {
    const [unitName, label = unit.title] = unit.title.split(/[:：]\s*/u);
    const completed = unit.groups.filter((group) => state.learningProgress.reading?.[group.id]?.completed).length;

    return {
      unit: unitName,
      label,
      completed,
      total: unit.groups.length
    };
  });

  return [...coreSummaries, ...readingSummaries];
}

function totalLearningProgress() {
  const summaries = unitProgressSummaries();
  const completed = summaries.reduce((sum, item) => sum + item.completed, 0);
  const total = summaries.reduce((sum, item) => sum + item.total, 0);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { summaries, completed, total, percent };
}

function hasLearningActivity(scope, id) {
  const progress = state.learningProgress[scope]?.[id];
  if (!progress || typeof progress !== "object") {
    return false;
  }

  return Object.values(progress).some(
    (value) => value === true || (Array.isArray(value) && value.length > 0)
  );
}

function renderLearnedMarker(scope, id) {
  if (!hasLearningActivity(scope, id)) {
    return "";
  }
  return `<span class="learned-marker" aria-label="${t("vocab.learnedAria")}">✓ ${t("vocab.learned")}</span>`;
}

function renderLearningMap(summaries) {
  return `
    <article class="card learning-map-card">
      <div class="section-row">
        <div>
          <p class="caption">${t("progress.map")}</p>
          <h2 class="section-title">${t("progress.mapDetail")}</h2>
        </div>
        <span class="step-state">${summaries.reduce((sum, item) => sum + item.completed, 0)} / ${summaries.reduce((sum, item) => sum + item.total, 0)}</span>
      </div>
      <div class="learning-map-list">
        ${summaries
          .map(
            (item) => `
              <div class="learning-map-row">
                <span>
                  <strong>${item.unit}</strong>
                  <small>${item.label}</small>
                </span>
                <span class="step-state">${item.completed} / ${item.total}</span>
              </div>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function letterLoopProgress(groupId = state.selectedGroupId) {
  const progress = ensureProgress("letters", groupId);
  const completeCount = letterLoopSteps.filter((step) => progress[step.id]).length;

  return {
    progress,
    completeCount,
    total: letterLoopSteps.length,
    completed: Boolean(progress.completed)
  };
}

function upsertMistake(mistake) {
  const key = `${mistake.kind}:${mistake.targetId}`;
  const existingIndex = state.mistakes.findIndex((item) => item.key === key);
  const nextMistake = {
    ...mistake,
    key,
    attempts: existingIndex >= 0 ? state.mistakes[existingIndex].attempts + 1 : 1,
    createdAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    state.mistakes.splice(existingIndex, 1, nextMistake);
  } else {
    state.mistakes.unshift(nextMistake);
  }

  state.mistakes = state.mistakes.slice(0, 24);
  markCloudDirty("learning");
}

function mistakeReviewItems() {
  const useEnglish = i18n.getLanguage() === "en";
  return state.mistakes.map((mistake) => ({
    id: `mistake-${mistake.key}`,
    type: useEnglish ? t("practice.reviewType") : mistake.kindLabel,
    value: mistake.value,
    latin: mistake.latin,
    label: useEnglish ? t("practice.reviewLabel") : mistake.source,
    hint: useEnglish
      ? t("practice.reviewHint", { count: mistake.attempts })
      : `${mistake.note} ${mistake.help || ""} 错 ${mistake.attempts} 次。`,
    parts: [mistake.value],
    audio: audioForMistake(mistake),
    audioStatus: useEnglish ? t("practice.reviewAudio") : "复习错题"
  }));
}

function recordLetterMistake(kind, target, picked) {
  upsertMistake({
    kind,
    kindLabel: "字母",
    targetId: target.id,
    pickedId: picked ? picked.id : "",
    value: target.letter,
    latin: target.latin,
    source: "第一单元错题",
    note: picked
      ? `目标是 ${displayStandaloneLetterGlyph(target.letter)}，你选了 ${displayStandaloneLetterGlyph(picked.letter)}`
      : `需要复习 ${displayStandaloneLetterGlyph(target.letter)}`,
    help: picked ? `目标线索：${target.cue}；你选的线索：${picked.cue}。看下方点数。` : target.cue
  });
}

function recordItemMistake(kind, target, picked, source) {
  const kindLabels = {
    combo: "组合",
    vocab: "词形",
    practice: "练习"
  };

  upsertMistake({
    kind,
    kindLabel: kindLabels[kind] || "词形",
    targetId: target.id,
    pickedId: picked ? picked.id : "",
    value: target.value,
    latin: target.latin,
    source,
    note: picked ? `目标是 ${target.value}，你选了 ${picked.value}` : `需要复习 ${target.value}`,
    help: target.hint || target.tip || target.rule || "先看词形，再看转写提示。"
  });
}

function letterMistakeFeedback(target, picked) {
  if (!picked) {
    return t("alphabet.mistakeMissing", {
      target: displayStandaloneLetterGlyph(target.letter),
      targetCue: target.cue
    });
  }

  return t("alphabet.mistakePicked", {
    target: displayStandaloneLetterGlyph(target.letter),
    targetCue: target.cue,
    picked: displayStandaloneLetterGlyph(picked.letter),
    pickedCue: picked.cue
  });
}

function oddLetterForCurrent() {
  const choices = currentGroupLetters();
  const index = Math.max(0, choices.findIndex((choice) => choice.id === currentLetter().id));

  return choices[index + 1] || choices[index - 1] || choices[0];
}

function itemMistakeFeedback(target, picked, label = t("practice.choiceTarget")) {
  if (!picked) {
    return t("practice.mistakeMissing", { label, target: target.value, latin: target.latin });
  }

  return t("practice.mistakePicked", {
    label,
    target: target.value,
    picked: picked.value,
    latin: target.latin
  });
}

function comboMistakeFeedback(target, picked) {
  if (!picked) {
    return t("combo.mistakeMissing", { target: target.value, latin: target.latin });
  }

  return t("combo.mistakePicked", {
    target: target.value,
    picked: picked.value,
    latin: target.latin
  });
}

function vocabMistakeFeedback(target, picked) {
  if (!picked) {
    return t("vocab.mistakeMissing", { target: target.value, latin: target.latin });
  }

  return t("vocab.mistakePicked", {
    target: target.value,
    picked: picked.value,
    latin: target.latin
  });
}

function keyboardGuideState(parts, targetValue, currentValue = state.keyboardValue) {
  let remaining = currentValue;
  let completeCount = 0;

  for (const part of parts) {
    if (!remaining.startsWith(part)) {
      break;
    }

    completeCount += 1;
    remaining = remaining.slice(part.length);
  }

  const isComplete = currentValue === targetValue;
  const isOffTrack = currentValue.length > 0 && !targetValue.startsWith(currentValue);
  const nextPart = isComplete || isOffTrack ? "" : parts[completeCount] || "";

  return {
    parts,
    targetValue,
    currentValue,
    completeCount,
    nextPart,
    isComplete,
    isOffTrack,
    remainingCount: Math.max(parts.length - completeCount, 0)
  };
}

function renderKeyboardGuide(parts, targetValue) {
  const guide = keyboardGuideState(parts, targetValue);
  const stepText = guide.isComplete
    ? t("keyboard.complete")
    : guide.isOffTrack
      ? t("keyboard.removeWrong")
      : t("keyboard.nextStep", { step: guide.completeCount + 1, key: guide.nextPart });
  const inputText = guide.currentValue
    ? t("keyboard.entered", { value: guide.currentValue })
    : t("keyboard.notEntered");
  const countText = guide.isComplete
    ? t("keyboard.complete")
    : t("keyboard.keysRemaining", { count: guide.remainingCount });

  return `
    <article class="card keyboard-guide-card">
      <div class="section-row">
        <div>
          <p class="caption">${t("keyboard.steps")}</p>
          <h2 class="section-title">
            <span class="uyghur">${parts.join(" → ")}</span>
          </h2>
        </div>
        <span class="step-state">${countText}</span>
      </div>
      <div class="keyboard-guide-current">
        <span>${inputText}</span>
        <strong>${stepText}</strong>
      </div>
    </article>
  `;
}

function guidedKeyClass(key, parts, targetValue) {
  const guide = keyboardGuideState(parts, targetValue);

  if (guide.nextPart && key === guide.nextPart) {
    return "next-key";
  }

  if (guide.isComplete && key === targetValue) {
    return "done-key";
  }

  return "";
}

function seededNumber(seedText) {
  let seed = 2166136261;
  for (const char of seedText) {
    seed ^= char.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }

  return seed >>> 0;
}

function seededShuffle(items, seedText) {
  const result = [...items];
  let seed = seededNumber(seedText) || 1;

  for (let index = result.length - 1; index > 0; index -= 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function practiceKeyboardChoices(item) {
  const letterKeys = alphabetLetters.map((letter) => letter.letter).filter(Boolean);
  const choices = seededShuffle(
    letterKeys.filter((letter) => letter !== item.value),
    item.id
  ).slice(0, 24);
  const targetIndex = seededNumber(`${item.id}:target`) % 25;
  choices.splice(targetIndex, 0, item.value);

  return choices;
}

const writingCheckOptions = [
  { id: "shape", labelKey: "writing.shapeStable" },
  { id: "dots", labelKey: "writing.dotsCorrect" },
  { id: "spacing", labelKey: "writing.connectionsClear" }
];

function renderWritingCoach({ value, parts, hint, mode = "letter" }) {
  const partText = parts && parts.length > 1 ? parts.join(" → ") : value;
  const startText = mode === "letter"
    ? t("writing.letterStart")
    : t("writing.splitStart", { parts: partText });

  return `
    <article class="card writing-coach-card">
      <p class="caption">${t("writing.steps")}</p>
      <div class="lesson-point-list">
        <div class="lesson-point"><strong>${t("writing.start")}</strong><span>${startText}</span></div>
        <div class="lesson-point"><strong>${t("writing.direction")}</strong><span>${t("writing.directionDetail")}</span></div>
        <div class="lesson-point"><strong>${t("writing.selfCheck")}</strong><span>${hint}</span></div>
      </div>
    </article>
  `;
}

function renderWritingComparison({ value, parts, forms = [] }) {
  const comparisonItems = forms.length
    ? forms.map((form) => ({ label: form.label, value: form.value }))
    : [
        { label: t("writing.whole"), value },
        ...(parts || []).map((part, index) => ({ label: t("writing.part", { count: index + 1 }), value: part }))
      ];

  return `
    <article class="card writing-comparison-card">
      <div class="section-row">
        <div>
          <p class="caption">${t("writing.compare")}</p>
          <h2 class="section-title"><span class="uyghur">${displayStandaloneLetterGlyph(value)}</span></h2>
        </div>
        <span class="step-state">${t("writing.itemCount", { count: comparisonItems.length })}</span>
      </div>
      <div class="writing-example-grid">
        ${comparisonItems
          .map(
            (item) => `
              <div class="writing-example">
                <span>${item.label}</span>
                <strong class="uyghur">${displayLetterFormGlyph(item.value)}</strong>
              </div>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function renderWritingCanvas(value, label = t("alphabet.canvas")) {
  return `
    <div class="writing-pad ${state.showGuide ? "" : "hide-guide"}" aria-label="${label}">
      <span class="uyghur guide">${displayStandaloneLetterGlyph(value)}</span>
      <canvas class="writing-canvas" data-writing-canvas width="640" height="360"></canvas>
    </div>
  `;
}

function renderWritingSelfCheck() {
  const checkedCount = writingCheckOptions.filter((item) => state.writingChecks.includes(item.id)).length;

  return `
    <article class="card writing-self-check-card">
      <div class="section-row">
        <div>
          <p class="caption">${t("writing.reviewCaption")}</p>
          <h2 class="section-title">${t("writing.reviewProgress", { completed: checkedCount, total: writingCheckOptions.length })}</h2>
        </div>
        <span class="step-state">${checkedCount === writingCheckOptions.length ? t("writing.complete") : t("writing.selfCheck")}</span>
      </div>
      <div class="writing-check-grid">
        ${writingCheckOptions
          .map(
            (item) => `
              <button
                class="writing-check ${state.writingChecks.includes(item.id) ? "active" : ""}"
                data-action="toggle-writing-check"
                data-id="${item.id}"
                type="button"
              >
                ${t(item.labelKey)}
              </button>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function resetPracticeState() {
  state.selectedPicture = "";
  state.selectedListening = "";
  state.practiceAudioPlayed = false;
  state.keyboardValue = "";
  state.writingChecks = [];
}

function resetComboPracticeState() {
  resetPracticeState();
}

function resetVocabPracticeState() {
  resetPracticeState();
}

function resetPracticeSessionState() {
  resetPracticeState();
  state.practiceSpoken = false;
}

function currentUnit() {
  return learningUnits.find((unit) => unit.id === state.selectedUnitId) || learningUnits[0];
}

function homeLearningUnit() {
  const hasCompletedLearning = totalLearningProgress().completed > 0;
  const hasMistakes = Array.isArray(state.mistakes) && state.mistakes.length > 0;
  return hasCompletedLearning || hasMistakes ? currentUnit() : learningUnits[0];
}

function currentUnitExperience(unitId = currentUnit().id) {
  return unitExperience[unitId] || unitExperience.letters;
}

function displayStandaloneLetterGlyph(value) {
  return value;
}

function displayLetterFormGlyph(value) {
  return value;
}

function itemPosition(items, currentId) {
  const index = Math.max(0, items.findIndex((item) => item.id === currentId));
  const total = items.length;

  return {
    index,
    total,
    label: `${index + 1} / ${total}`,
    previous: index > 0 ? items[index - 1] : null,
    next: index < total - 1 ? items[index + 1] : null
  };
}

function renderStepList(unitId) {
  const experience = currentUnitExperience(unitId);

  return `
    <div class="step-list" aria-label="${t("reading.stepsAria")}">
      ${experience.steps
        .map(
          (step, index) => `
            <div class="step-item">
              <span>${index + 1}</span>
              <strong>${step}</strong>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderItemProgress(label, description) {
  return `
    <div class="item-progress">
      <span class="step-state">${label}</span>
      <strong>${description}</strong>
    </div>
  `;
}

function renderLatinTransliteration(value, className = "") {
  if (!state.preferences.showLatin || typeof value !== "string" || !value.trim()) {
    return "";
  }

  const classes = ["latin-transliteration", className].filter(Boolean).join(" ");
  return `<span class="${classes}" dir="ltr">${value}</span>`;
}

function isAudioPlayable(audio) {
  return Boolean(audio && audio.playable && audio.outputPath);
}

function renderAudioButton({ audio, label, className = "" }) {
  const canPlay = isAudioPlayable(audio);
  const classes = ["play-dot", className, canPlay ? "" : "disabled"].filter(Boolean).join(" ");

  return `
    <button
      class="${classes}"
      data-action="play-audio"
      data-audio-src="${canPlay ? audio.outputPath : ""}"
      data-audio-label="${label}"
      type="button"
      ${canPlay ? "" : "disabled"}
      aria-label="${t("audio.play")} ${label}"
    >${t("audio.play")}</button>
  `;
}

function renderAudioWord({ value, audio, className = "" }) {
  const canPlay = isAudioPlayable(audio);
  const classes = [canPlay ? "audio-word-button" : "audio-word-static", "uyghur", className].filter(Boolean).join(" ");

  if (!canPlay) {
    return `<span class="${classes}">${value}</span>`;
  }

  return `
    <button
      class="${classes}"
      data-action="play-audio"
      data-audio-src="${audio.outputPath}"
      data-audio-label="${value}"
      type="button"
      aria-label="${t("audio.play")} ${value}"
    >${value}</button>
  `;
}

function renderAudioFocus({ audio, label, title, hint, hideFile = false, hideCaption = false, className = "" }) {
  const canPlay = isAudioPlayable(audio);
  const audioStatusLabel = t("audio.humanRecording");
  const audioInfo = canPlay
    ? state.interfaceLanguage === "zh"
      ? hideFile
        ? `${audioStatusLabel}。`
        : `${audioStatusLabel}：${audio.file}。`
      : hideFile
        ? `${audioStatusLabel}. `
        : `${audioStatusLabel}: ${audio.file}. `
    : "";
  const caption = hideCaption ? "" : canPlay ? `${audioInfo}${hint}` : t("audio.unavailable");
  const classes = ["letter-focus", "audio-focus", className].filter(Boolean).join(" ");

  return `
    <div class="${classes}">
      ${renderAudioButton({ audio, label, className: "letter-focus-play" })}
      <div>
        <strong class="audio-focus-title">${canPlay ? title : t("audio.unavailable")}</strong>
        ${caption ? `<p class="caption">${caption}</p>` : ""}
      </div>
    </div>
  `;
}

function renderAdjacentNav({ previous, next, action, previousLabel = t("common.previous"), nextLabel = t("common.next") }) {
  return `
    <div class="adjacent-nav" aria-label="${t("common.adjacent")}">
      <button
        class="secondary-button"
        data-action="${action}"
        data-id="${previous ? previous.id : ""}"
        type="button"
        ${previous ? "" : "disabled"}
      >
        ${previousLabel}
      </button>
      <button
        class="secondary-button"
        data-action="${action}"
        data-id="${next ? next.id : ""}"
        type="button"
        ${next ? "" : "disabled"}
      >
        ${nextLabel}
      </button>
    </div>
  `;
}

function renderUnitNextActions(unitId, primaryClass = "primary-button") {
  const experience = currentUnitExperience(unitId);
  const nextUnit = learningUnits.find((unit) => unit.id === experience.nextUnitId);
  const shouldOpenNextUnit = Boolean(nextUnit) && experience.nextTarget !== "learn";
  const caption = unitId === "letters"
    ? t("alphabet.nextStep")
    : unitId === "combos"
      ? t("combo.nextStep")
      : unitId === "basic-phrases"
        ? t("vocab.nextStep")
        : t("reading.nextStep");

  return `
    <article class="card next-action-card">
      <p class="caption">${caption}</p>
      <div class="action-grid">
        <button class="secondary-button" data-action="go" data-target="${experience.reviewTarget}" type="button">
          ${experience.reviewLabel}
        </button>
        <button
          class="${primaryClass}"
          data-action="${shouldOpenNextUnit ? "open-unit" : "go"}"
          data-id="${shouldOpenNextUnit ? nextUnit.id : ""}"
          data-target="${experience.nextTarget || "unit"}"
          type="button"
        >
          ${experience.nextLabel}
        </button>
      </div>
    </article>
  `;
}

function writingSurfaceKey() {
  if (state.screen === "letterWriting") {
    return `letter:${state.currentLetterId}`;
  }
  if (state.screen === "comboWriting") {
    return `combo:${state.currentComboItemId}`;
  }
  if (state.screen === "practiceSession") {
    return `practice:${state.currentPracticeItemId}`;
  }
  return "";
}

function initializeWritingCanvases() {
  if (!document.querySelectorAll) {
    return;
  }

  document.querySelectorAll("[data-writing-canvas]").forEach((canvas) => {
    const context = canvas.getContext && canvas.getContext("2d");
    if (!context || !canvas.getBoundingClientRect) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width * ratio));
    const height = Math.max(1, Math.floor(rect.height * ratio));
    canvas.width = width;
    canvas.height = height;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 8;
    context.strokeStyle = "#162657";

    const surfaceKey = writingSurfaceKey();
    const savedStrokes = surfaceKey ? state.writingStrokes[surfaceKey] || [] : [];
    savedStrokes.forEach((stroke) => {
      if (!Array.isArray(stroke) || !stroke.length) {
        return;
      }
      context.beginPath();
      context.moveTo(stroke[0].x * rect.width, stroke[0].y * rect.height);
      stroke.slice(1).forEach((point) => {
        context.lineTo(point.x * rect.width, point.y * rect.height);
      });
      if (stroke.length > 1) {
        context.stroke();
      }
      context.closePath();
    });

    let isDrawing = false;
    let activeStroke = null;

    function pointFor(event) {
      const bounds = canvas.getBoundingClientRect();
      return {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
        normalized: {
          x: bounds.width > 0 ? (event.clientX - bounds.left) / bounds.width : 0,
          y: bounds.height > 0 ? (event.clientY - bounds.top) / bounds.height : 0
        }
      };
    }

    canvas.addEventListener("pointerdown", (event) => {
      const point = pointFor(event);
      isDrawing = true;
      activeStroke = [point.normalized];
      if (surfaceKey) {
        state.writingStrokes[surfaceKey] = [
          ...(state.writingStrokes[surfaceKey] || []),
          activeStroke
        ];
      }
      canvas.setPointerCapture?.(event.pointerId);
      context.beginPath();
      context.moveTo(point.x, point.y);
      event.preventDefault();
    });

    canvas.addEventListener("pointermove", (event) => {
      if (!isDrawing) {
        return;
      }
      const point = pointFor(event);
      activeStroke?.push(point.normalized);
      context.lineTo(point.x, point.y);
      context.stroke();
      event.preventDefault();
    });

    function finishDrawing(event) {
      if (!isDrawing) {
        return;
      }
      isDrawing = false;
      activeStroke = null;
      canvas.releasePointerCapture?.(event.pointerId);
      context.closePath();
    }

    canvas.addEventListener("pointerup", finishDrawing);
    canvas.addEventListener("pointercancel", finishDrawing);
    canvas.addEventListener("pointerleave", finishDrawing);
  });
}

function clearWritingCanvases() {
  const surfaceKey = writingSurfaceKey();
  if (surfaceKey) {
    delete state.writingStrokes[surfaceKey];
  }
  if (!document.querySelectorAll) {
    return;
  }

  document.querySelectorAll("[data-writing-canvas]").forEach((canvas) => {
    const context = canvas.getContext && canvas.getContext("2d");
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  });
}

function initializeFormExampleHighlights() {
  if (!document.querySelectorAll || !document.createRange) {
    return;
  }

  document.querySelectorAll("[data-form-target-start]").forEach((element) => {
    const textNode = element.firstChild;
    const start = Number(element.dataset.formTargetStart);
    const length = Number(element.dataset.formTargetLength || 1);
    const textLength = textNode?.textContent?.length || 0;

    if (
      !textNode ||
      !Number.isInteger(start) ||
      !Number.isInteger(length) ||
      start < 0 ||
      length < 1 ||
      start + length > textLength
    ) {
      return;
    }

    const range = document.createRange();
    range.setStart(textNode, start);
    range.setEnd(textNode, start + length);
    const wordBounds = element.getBoundingClientRect();
    const targetBounds = range.getBoundingClientRect();

    if (wordBounds.width <= 0 || targetBounds.width <= 0) {
      return;
    }

    const targetLeft = Math.max(
      0,
      Math.min(100, ((targetBounds.left - wordBounds.left) / wordBounds.width) * 100)
    );
    const targetRight = Math.max(
      targetLeft,
      Math.min(100, ((targetBounds.right - wordBounds.left) / wordBounds.width) * 100)
    );

    element.style.backgroundImage = `linear-gradient(90deg, #000 0%, #000 ${targetLeft}%, #e60012 ${targetLeft}%, #e60012 ${targetRight}%, #000 ${targetRight}%, #000 100%)`;
    element.classList.add("is-highlight-ready");
  });
}

function render() {
  if (state.screen === "settings") {
    state.screen = "profile";
  }

  const screens = {
    welcome: renderWelcome,
    home: renderHome,
    learn: renderLearnPath,
    unit: renderUnitDetail,
    letter: renderGroupLesson,
    group: renderGroupLesson,
    writing: renderPracticeHub,
    letterWriting: renderLetterWriting,
    picture: renderPicturePractice,
    listening: renderListeningPractice,
    letterOdd: renderLetterOddPractice,
    letterSound: renderLetterSoundChoice,
    keyboard: renderKeyboardPractice,
    complete: renderComplete,
    combo: renderComboLesson,
    comboRecognition: renderComboRecognition,
    comboBuild: renderComboBuild,
    comboWriting: renderComboWriting,
    comboKeyboard: renderComboKeyboard,
    comboComplete: renderComboComplete,
    vocab: renderVocabLesson,
    vocabRecognition: renderVocabRecognition,
    vocabKeyboard: renderVocabKeyboard,
    vocabComplete: renderVocabComplete,
    reading: renderReadingLesson,
    practiceSession: renderPracticeSession,
    practiceComplete: renderPracticeComplete,
    library: renderLibrary,
    profile: renderProfile
  };

  const screenRenderer = screens[state.screen];
  if (!screenRenderer) {
    state.screen = "home";
  }
  applyPreferencesToRoot();
  app.innerHTML = (screens[state.screen] || renderHome)();
  initializeFormExampleHighlights();
  initializeWritingCanvases();
  saveLocalProgress();
  syncAudioAutoplay();
}

function screen(content, active = "home") {
  return `
    <div class="view">
      ${content}
      ${bottomNav(active)}
    </div>
  `;
}

function languageSwitcher(compact = false) {
  return `
    <div class="language-switcher ${compact ? "is-compact" : ""}" role="group" aria-label="${t("language.label")}">
      ${["zh", "en"].map((language) => `
        <button type="button" data-action="set-language" data-language="${language}"
          aria-pressed="${state.interfaceLanguage === language}">${compact ? (language === "zh" ? "中文" : "EN") : t(language === "zh" ? "language.chinese" : "language.english")}</button>`).join("")}
    </div>`;
}

function topBar(title, subtitle, action = "", leading = "") {
  return `
    <header class="top-row">
      ${leading}
      <div class="brand-lockup">
        <img class="brand-mark" src="./assets/logo.png" alt="Ana Tilim logo" />
        <div>
          <h1 class="brand-name">${title}</h1>
          <p class="brand-subtitle">${subtitle}</p>
        </div>
      </div>
      ${action}
    </header>
  `;
}

function bottomNav(active) {
  const items = [
    ["home", t("nav.home"), iconHome()],
    ["library", t("nav.alphabet"), iconLibrary()],
    ["learn", t("nav.learn"), iconBook()],
    ["profile", t("nav.profile"), iconUser()]
  ];

  return `
    <nav class="bottom-nav" aria-label="${t("nav.label")}">
      ${items
        .map(
          ([target, label, icon]) => `
            <button
              class="nav-button ${active === target ? "active" : ""}"
              data-action="go"
              data-target="${target}"
              type="button"
            >
              <span class="nav-icon" aria-hidden="true">${icon}</span>
              ${label}
            </button>
          `
        )
        .join("")}
    </nav>
  `;
}

function iconHome() {
  return `<svg viewBox="0 0 24 24"><path d="M4 10.8 12 4l8 6.8"/><path d="M6.5 10.5V20h11v-9.5"/><path d="M10 20v-5h4v5"/></svg>`;
}

function iconBook() {
  return `<svg viewBox="0 0 24 24"><path d="M5 5.5c2.2-.9 4.4-.7 7 1v13c-2.6-1.7-4.8-1.9-7-1z"/><path d="M12 6.5c2.6-1.7 4.8-1.9 7-1v12.5c-2.2-.9-4.4-.7-7 1"/></svg>`;
}

function iconPen() {
  return `<svg viewBox="0 0 24 24"><path d="m4 20 4.5-1 10-10a2.2 2.2 0 0 0-3.1-3.1l-10 10z"/><path d="m14 7 3 3"/><path d="M4 20h6"/></svg>`;
}

function iconLibrary() {
  return `<svg viewBox="0 0 24 24"><path d="M5 5h12a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2z"/><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H19"/><path d="M9 8h6"/></svg>`;
}

function iconUser() {
  return `<svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>`;
}

function iconBell() {
  return `<svg viewBox="0 0 24 24"><path d="M6.5 10.5a5.5 5.5 0 0 1 11 0c0 5 2 5.5 2 7H4.5c0-1.5 2-2 2-7"/><path d="M10 20a2.2 2.2 0 0 0 4 0"/></svg>`;
}

function iconAudio() {
  return `<svg viewBox="0 0 24 24"><path d="M5 10v4h3l5 4V6l-5 4z"/><path d="M16 9.5a4 4 0 0 1 0 5"/><path d="M18.5 7a7 7 0 0 1 0 10"/></svg>`;
}

function iconShield() {
  return `<svg viewBox="0 0 24 24"><path d="M12 3.8 19 6v5.2c0 4.4-2.8 7.4-7 9-4.2-1.6-7-4.6-7-9V6z"/><path d="m9 12 2 2 4-5"/></svg>`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cloudAccountEmail() {
  return cloudSync?.session()?.user?.email || "";
}

function cloudAccountProfile() {
  return cloudSync?.profile?.() || {
    email: cloudAccountEmail(),
    displayName: "",
    avatarUrl: ""
  };
}

function cloudStatusLabel() {
  const labels = {
    local: t("auth.local"),
    ready: t("auth.local"),
    "signing-in": t("auth.signingIn"),
    registering: t("auth.registering"),
    "sending-code": t("auth.sendingCode"),
    "code-sent": t("auth.codeSent"),
    "verifying-code": t("auth.verifying"),
    "uploading-avatar": t("auth.uploadingAvatar"),
    "signed-in": t("auth.signedIn"),
    syncing: t("auth.syncing"),
    synced: t("auth.synced"),
    "waiting-network": t("auth.offline"),
    "sync-error": t("auth.syncError"),
    "update-required": t("auth.updateRequired"),
    error: t("auth.loginError")
  };
  return labels[cloudStatus.phase] || t("auth.local");
}

function renderCloudAuthControls() {
  const accountEmail = cloudAccountEmail();
  if (accountEmail) {
    return `
      <div class="cloud-account-summary">
        <strong>${escapeHtml(accountEmail)}</strong>
        <small>${cloudStatusLabel()}</small>
      </div>
      <button class="secondary-button" data-action="cloud-sign-out" type="button">${t("auth.signOut")}</button>
    `;
  }

  return `
    <div class="cloud-account-summary">
      <strong>${t("auth.guestTitle")}</strong>
      <small>${t("auth.guestDetail")}</small>
    </div>
    <div class="auth-actions">
      <button class="primary-button" data-action="cloud-google-login" type="button">
        ${t("auth.google")}
      </button>
    </div>
    <p class="caption auth-status-copy">${cloudStatusLabel()}</p>
  `;
}

function validatePasswordAuthFields({
  mode,
  displayName = "",
  email = "",
  password = "",
  confirmPassword = ""
}) {
  const normalizedName = displayName.trim();
  const normalizedEmail = email.trim();
  if (mode === "register" && !normalizedName) {
    return { ok: false, message: t("auth.invalidNickname") };
  }
  if (mode === "register" && normalizedName.length > 40) {
    return { ok: false, message: t("auth.nicknameTooLong") };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false, message: t("auth.invalidEmail") };
  }
  if (password.length < 8) {
    return { ok: false, message: t("auth.shortPassword") };
  }
  if (mode === "register" && password !== confirmPassword) {
    return { ok: false, message: t("auth.passwordMismatch") };
  }
  return {
    ok: true,
    values: {
      displayName: normalizedName,
      email: normalizedEmail,
      password
    }
  };
}

function passwordAuthErrorMessage(error, mode) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("invalid login credentials")) return t("auth.invalidCredentials");
  if (message.includes("already registered") || message.includes("already been registered")) {
    return t("auth.alreadyRegistered");
  }
  if (message.includes("email not confirmed")) return t("auth.emailNotConfirmed");
  if (message.includes("注册需要邮箱确认")) return t("auth.confirmationRequired");
  return mode === "register" ? t("auth.registerError") : t("auth.loginError");
}

function validateDisplayName(value) {
  const name = String(value || "").trim();
  if (!name) return { ok: false, message: t("auth.nameRequired") };
  if (name.length > 40) return { ok: false, message: t("auth.nameTooLong") };
  return { ok: true, value: name };
}

function renderWelcome() {
  const accountEmail = cloudAccountEmail();
  return `
    <div class="hero view without-nav">
      <div class="hero-content">
        <div class="hero-intro">
          <img class="hero-logo" src="./assets/logo.png" alt="Ana Tilim logo" />
          <h1>Ana Tilim</h1>
          <div class="uyghur uyghur-title">ئانا تىلىم</div>
          <p class="hero-copy">
            ${t("welcome.title")}
          </p>
          <button class="ghost-button" data-action="continue-local" type="button">
            ${t("welcome.continueGuest")}
          </button>
        </div>

        <article class="card auth-panel">
          <div>
            <p class="caption">${t("welcome.subtitle")}</p>
            <h2 class="section-title">${accountEmail ? t("welcome.synced") : t("welcome.saveProgress")}</h2>
            <p class="muted">${accountEmail ? t("welcome.signedInAs", { email: escapeHtml(accountEmail) }) : t("welcome.syncDetail")}</p>
          </div>
          ${renderCloudAuthControls()}
        </article>
      </div>
    </div>
  `;
}

function renderHome() {
  const unit = homeLearningUnit();
  const currentRecommendation = currentUnitExperience(unit.id);
  const today = todayGoalProgress();
  const nextAction = {
    detail: currentRecommendation.recommended,
    button: t("home.continue"),
    action: "open-unit",
    id: unit.id,
    target: ""
  };

  return screen(
    `
      ${topBar(t("home.greeting"), t("home.subtitle"), languageSwitcher(true))}

      <section class="stack wide-gap home-center">
        <article class="card today-progress-card">
          <div class="section-row">
            <div>
              <p class="caption">${t("home.progress")}</p>
              <h2 class="section-title">${unit.title.replace("：", " · ")}</h2>
            </div>
            <span class="step-state">${today.completed} / ${today.goal}</span>
          </div>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" style="--value: ${today.percent}%"></div>
          </div>
          <p class="caption today-progress-note">${nextAction.detail}</p>
          <button
            class="primary-button"
            data-action="${nextAction.action}"
            data-id="${nextAction.id}"
            data-target="${nextAction.target}"
            type="button"
          >
            ${nextAction.button}
          </button>
        </article>

        ${
          state.preferences.learningReminder && !today.complete
            ? `
              <aside class="card learning-reminder-card" role="status">
                <strong>${t("home.reminder")}</strong>
                <span>${t("home.remaining", { count: today.goal - today.completed })}</span>
              </aside>
            `
            : ""
        }

        ${renderProfileMemoryCard(state.mistakes.length)}
      </section>
    `,
    "home"
  );
}

function renderLearnPath() {
  return screen(
    `
      ${topBar(t("learn.title"), t("learn.subtitle"))}
      <section class="stack">
        <div class="path-list">
          ${learningUnits
            .map(
              (unit, index) => `
                <button class="lesson-step" data-action="open-unit" data-id="${unit.id}" type="button">
                  <span class="step-number">${index + 1}</span>
                  <span class="lesson-step-copy">
                    <strong>${unit.title}</strong>
                    <span class="caption">${unit.subtitle}</span>
                  </span>
                </button>
              `
            )
            .join("")}
        </div>
      </section>
    `,
    "learn"
  );
}

function renderLetterPills(items, activeId = "") {
  return items
    .map((item) => {
      const letter = typeof item === "string" ? item : item.letter;
      const latin = typeof item === "string" ? "" : item.latin;
      const id = typeof item === "string" ? "" : item.id;

      return `
        <span class="letter-pill ${id && id === activeId ? "active" : ""}">
          <span class="uyghur">${displayStandaloneLetterGlyph(letter)}</span>
          ${renderLatinTransliteration(latin, "selector-latin")}
        </span>
      `;
    })
    .join("");
}

function renderGroupCard(group) {
  const action = group.kind === "practice" ? "open-practice-group" : group.kind === "vocab" ? "open-vocab-group" : group.kind === "combo" ? "open-combo-group" : "open-group";
  if (group.kind === "practice") {
    return renderPracticeTopicCard(group, action);
  }
  if (group.kind === "vocab") {
    return renderVocabTopicCard(group, action);
  }

  const cardContent = `
    <div class="section-row">
      <strong>${group.title}</strong>
      ${renderLearnedMarker(group.kind === "combo" ? "combos" : "letters", group.id)}
    </div>
    <div class="alphabet-strip compact">
      ${renderLetterPills(group.letters)}
    </div>
  `;

  if (!group.id) {
    return `<article class="group-card">${cardContent}</article>`;
  }

  return `
    <button
      class="group-card group-card-button"
      data-action="${action}"
      data-id="${group.id}"
      type="button"
    >
      ${cardContent}
    </button>
  `;
}

function practiceTopicLabel(group) {
  if (group.mode === "listen") return t("practice.topicListenLabel");
  if (group.mode === "repeat") return t("practice.topicRepeatLabel");
  if (group.mode === "write") return t("practice.topicWriteLabel");
  if (group.mode === "keyboard") return t("practice.topicKeyboardLabel");
  return t("practice.topicReviewLabel");
}

function practiceTopicCount(group) {
  return group.mode === "review" ? state.mistakes.length : group.items.length;
}

function practiceHubTopicTitle(group) {
  if (group.mode === "listen") return t("practice.topicListenTitle");
  if (group.mode === "repeat") return t("practice.topicRepeatTitle");
  if (group.mode === "write") return t("practice.topicWriteTitle");
  if (group.mode === "keyboard") return t("practice.topicKeyboardTitle");
  return t("practice.topicReviewTitle");
}

function renderPracticeTopicCard(group, action = "open-practice-group") {
  const title = practiceHubTopicTitle(group);

  return `
    <button
      class="practice-topic-row"
      data-action="${action}"
      data-id="${group.id}"
      type="button"
      aria-label="${t("practice.openAria", { title })}"
    >
      <span>
        <strong>${title}</strong>
        <small>${t("practice.topicCount", { label: practiceTopicLabel(group), count: practiceTopicCount(group) })}</small>
      </span>
      <span class="topic-end">
        ${renderLearnedMarker("practice", group.id)}
        <span class="topic-arrow" aria-hidden="true">→</span>
      </span>
    </button>
  `;
}

function renderVocabTopicCard(group, action = "open-vocab-group") {
  return `
    <button
      class="vocab-topic-row"
      data-action="${action}"
      data-id="${group.id}"
      type="button"
      aria-label="${t("vocab.openTopic", { title: group.title })}"
    >
      <span>
        <strong>${group.title}</strong>
        <small>${t("vocab.wordCount", { count: group.items.length })}</small>
      </span>
      <span class="topic-end">
        ${renderLearnedMarker("vocab", group.id)}
        <span class="topic-arrow" aria-hidden="true">→</span>
      </span>
    </button>
  `;
}

function readingGroupCountLabel(unit, group) {
  if (unit.readingKind === "grammar") {
    return t("reading.grammarCount", { count: group.items.length });
  }

  if (unit.readingKind === "sentence") {
    return t("reading.patternCount", { count: group.items.length });
  }

  if (unit.readingKind === "quote" || unit.readingKind === "proverb") {
    return t("reading.entryCount", { count: group.items.length });
  }
  return t("reading.lineCount", { count: group.items.length });
}

function renderReadingTopicCard(unit, group) {
  return `
    <button
      class="reading-topic-row"
      data-action="open-reading-group"
      data-unit-id="${unit.id}"
      data-id="${group.id}"
      type="button"
      aria-label="${t("reading.openTopic", { title: group.title })}"
    >
      <span>
        <strong>${group.title}</strong>
        <small>${readingGroupCountLabel(unit, group)}</small>
      </span>
      <span class="topic-end">
        ${renderLearnedMarker("reading", group.id)}
        <span class="topic-arrow" aria-hidden="true">→</span>
      </span>
    </button>
  `;
}

function renderVocabUnitDetail(unit) {
  return screen(
    `
      ${topBar(
        unit.title,
        unit.subtitle,
        "",
        `<button class="back-button" data-action="go" data-target="learn" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <div class="vocab-topic-list">
          ${unit.groups.map((group) => renderVocabTopicCard(group)).join("")}
        </div>
      </section>
    `,
    "learn"
  );
}

function renderReadingUnitDetail(unit) {
  return screen(
    `
      ${topBar(
        unit.title,
        unit.subtitle,
        "",
        `<button class="back-button" data-action="go" data-target="learn" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <div class="reading-topic-list">
          ${unit.groups.map((group) => renderReadingTopicCard(unit, group)).join("")}
        </div>
      </section>
    `,
    "learn"
  );
}

function renderUnitDetail() {
  const unit = currentUnit();
  const firstGroup = unit.groups?.[0];
  const primaryButton =
    unit.actionTarget === "letter" && firstGroup
      ? `<button class="primary-button" data-action="open-group" data-id="${firstGroup.id}" type="button">${t("alphabet.startCurrent")}</button>`
      : unit.actionTarget === "combo" && firstGroup
        ? `<button class="primary-button" data-action="open-combo-group" data-id="${firstGroup.id}" type="button">${t("common.startCurrent")}</button>`
        : `<button class="primary-button" data-action="go" data-target="${unit.actionTarget}" type="button">${t("common.startCurrent")}</button>`;

  if (unit.id === "basic-phrases") {
    return renderVocabUnitDetail(unit);
  }

  if (unit.kind === "reading") {
    return renderReadingUnitDetail(unit);
  }

  return screen(
    `
      ${topBar(
        unit.title,
        unit.subtitle,
        "",
        `<button class="back-button" data-action="go" data-target="learn" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <div class="path-list">
          ${unit.groups.map((group) => renderGroupCard(group)).join("")}
        </div>

        ${primaryButton}
        ${renderUnitNextActions(unit.id)}
      </section>
    `,
    "learn"
  );
}

function renderFormExampleWord(example) {
  const targetDataAttributes =
    Number.isInteger(example.targetStart) && Number.isInteger(example.targetLength)
      ? ` data-form-target-start="${example.targetStart}" data-form-target-length="${example.targetLength}"`
      : "";
  const audio = formExampleAudioForWord(example.word);

  if (!isAudioPlayable(audio)) {
    return `<strong class="uyghur form-example-word-text" aria-label="${example.word}"${targetDataAttributes}>${example.word}</strong>`;
  }

  return `<button class="uyghur form-example-word-text form-example-audio-word" data-action="play-audio" data-audio-src="${audio.outputPath}" data-audio-label="${example.word}"${targetDataAttributes} type="button" aria-label="${t("audio.play")} ${example.word}">${example.word}</button>`;
}

function renderLetterFormExamples(letter) {
  if (!Array.isArray(letter.formExamples) || letter.formExamples.length === 0) {
    return "";
  }

  return `
        <article class="card letter-form-example-card">
          <div class="section-row">
            <div>
              <p class="caption">${t("alphabet.formExamples")}</p>
              <h2 class="section-title">${t("alphabet.formCount", { count: letter.formExamples.length })}</h2>
            </div>
          </div>
      <div class="letter-form-example-grid">
        ${letter.formExamples
          .map(
            (example) => `
              <div class="letter-form-example">
                <div class="form-example-shape">
                  <span>${example.label}</span>
                  <strong class="uyghur">${displayLetterFormGlyph(example.form)}</strong>
                </div>
                <div class="form-example-word">
                  ${
                    example.word
                      ? `
                        ${renderFormExampleWord(example)}
                        ${renderLatinTransliteration(example.latin, "form-example-latin")}
                        <small>${example.meaning}</small>
                      `
                      : example.noteType === "rule"
                        ? `
                          <strong class="form-example-rule">${example.noteTitle || t("alphabet.writingRule")}</strong>
                          <small class="form-example-note">${example.note || ""}</small>
                        `
                        : `<small class="form-example-empty">${t("alphabet.noExample")}</small>`
                  }
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function renderGroupLesson() {
  const group = currentGroup();
  const letter = currentLetter();
  const audio = currentLetterAudio();
  const position = itemPosition(currentGroupLetters(), letter.id);

  return screen(
    `
      ${topBar(
        group.title,
        t("alphabet.unitTitle"),
        `<button class="icon-button" data-action="toggle-favorite" type="button" aria-label="${t("alphabet.favorite")}">${state.favorite ? "★" : "☆"}</button>`,
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <div class="alphabet-strip compact">
          ${currentGroupLetters()
            .map(
              (item) => `
                <button
                  class="letter-pill button-pill ${item.id === letter.id ? "active" : ""}"
                  data-action="select-letter"
                  data-id="${item.id}"
                  type="button"
                >
                  <span class="uyghur">${displayStandaloneLetterGlyph(item.letter)}</span>
                  ${renderLatinTransliteration(item.latin, "selector-latin")}
                </button>
              `
            )
            .join("")}
        </div>

        ${renderItemProgress(position.label, t("alphabet.currentPosition"))}
        ${renderAdjacentNav({
          previous: position.previous,
          next: position.next,
          action: "select-adjacent-letter"
        })}

        <div class="letter-focus">
          ${renderAudioButton({ audio, label: letter.letter, className: "letter-focus-play" })}
          <div>
            <div class="uyghur letter-big">${displayStandaloneLetterGlyph(letter.letter)}</div>
            <p class="caption">${letter.type}</p>
            ${renderLatinTransliteration(letter.latin, "letter-focus-latin")}
          </div>
        </div>
        <div class="form-grid">
          ${letter.forms
            .map(
              (form) => `
                <div class="form-cell">
                  <span>${form.label}</span>
                  <strong class="uyghur">${displayLetterFormGlyph(form.value)}</strong>
                </div>
              `
            )
            .join("")}
        </div>
        ${renderLetterFormExamples(letter)}
        <article class="card">
          <p class="caption">${t("alphabet.learningPoints")}</p>
          <div class="lesson-point-list">
            <div class="lesson-point">
              <strong>${t("alphabet.shape")}</strong>
              <span>${letter.cue}</span>
            </div>
            <div class="lesson-point">
              <strong>${t("alphabet.connections")}</strong>
              <span>${letter.connection}</span>
            </div>
            <div class="lesson-point">
              <strong>${t("alphabet.writing")}</strong>
              <span>${letter.writingHint}</span>
            </div>
          </div>
        </article>
        <div class="action-grid">
          <button class="secondary-button" data-action="go" data-target="letterWriting" type="button">
            ${t("alphabet.trace")}
          </button>
          <button class="secondary-button" data-action="go" data-target="picture" type="button">
            ${t("alphabet.recognize")}
          </button>
          <button class="secondary-button" data-action="go" data-target="letterOdd" type="button">
            ${t("alphabet.findDifferent")}
          </button>
          <button class="secondary-button" data-action="go" data-target="letterSound" type="button">
            ${t("alphabet.soundChoice")}
          </button>
          <button class="secondary-button" data-action="go" data-target="listening" type="button">
            ${t("alphabet.listen")}
          </button>
          <button class="primary-button" data-action="go" data-target="keyboard" type="button">
            ${t("alphabet.keyboard")}
          </button>
        </div>
      </section>
    `,
    "learn"
  );
}

function renderLetterWriting() {
  const letter = currentLetter();

  return screen(
    `
      ${topBar(
        t("alphabet.writingTitle"),
        t("alphabet.writingSubtitle"),
        "",
        `<button class="back-button" data-action="go" data-target="group" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">${t("alphabet.targetLetter")}</p>
              <h2 class="section-title">${t("alphabet.traceLetter")} <span class="uyghur">${displayStandaloneLetterGlyph(letter.letter)}</span></h2>
            </div>
            <button class="ghost-button" data-action="toggle-guide" type="button">
              ${state.showGuide ? t("alphabet.hideGuide") : t("alphabet.showGuide")}
            </button>
          </div>
        </article>
        ${renderWritingCoach({
          value: letter.letter,
          parts: [letter.letter],
          hint: letter.writingHint,
          mode: "letter"
        })}
        ${renderWritingCanvas(letter.letter, t("alphabet.canvas"))}
        ${renderWritingComparison({
          value: letter.letter,
          parts: [letter.letter],
          forms: letter.forms
        })}
        <div class="tool-row">
          <button class="secondary-button" data-action="clear-canvas" type="button">${t("alphabet.clearCanvas")}</button>
          <button class="secondary-button" data-action="toggle-guide" type="button">
            ${state.showGuide ? t("alphabet.hideGuide") : t("alphabet.showGuide")}
          </button>
        </div>
        ${renderWritingSelfCheck()}
        <div class="feedback">
          ${letter.writingHint}
        </div>
        <button class="primary-button" data-action="go" data-target="picture" type="button">
          ${t("alphabet.finishTracing")}
        </button>
      </section>
    `,
    "writing"
  );
}

function renderPicturePractice() {
  const letter = currentLetter();
  const choices = currentGroupLetters();
  const hasPicked = Boolean(state.selectedPicture);
  const picked = choices.find((choice) => choice.id === state.selectedPicture);
  const isCorrect = picked && picked.id === letter.id;

  return screen(
    `
      ${topBar(
        t("alphabet.recognitionTitle"),
        currentGroup().title,
        "",
        `<button class="back-button" data-action="go" data-target="group" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">${t("alphabet.chooseLetter")}</p>
          <h2 class="section-title">
            ${t("alphabet.cueQuestion", { cue: letter.cue })}
          </h2>
        </article>
        <div class="choice-grid">
          ${choices
            .map((choice, index) => {
              const selected = state.selectedPicture === choice.id;
              const correctChoice = choice.id === letter.id;
              const resultClass = selected ? (correctChoice ? "correct" : "wrong") : "";
              return `
                <button
                  class="${["choice-card", "letter-only-choice", resultClass].filter(Boolean).join(" ")}"
                  data-action="pick-picture"
                  data-id="${choice.id}"
                  type="button"
                  aria-label="${t("alphabet.choiceAria", {
                    count: index + 1,
                    letter: displayStandaloneLetterGlyph(choice.letter)
                  })}"
                >
                  <span class="choice-art uyghur">${displayStandaloneLetterGlyph(choice.letter)}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? t("alphabet.cueCorrect", { letter: displayStandaloneLetterGlyph(letter.letter), cue: letter.cue })
                  : letterMistakeFeedback(letter, picked)
              }</div>`
            : ""
        }
        <button class="primary-button" data-action="go" data-target="listening" type="button">
          ${t("alphabet.continueListening")}
        </button>
      </section>
    `,
    "learn"
  );
}

function renderListeningPractice() {
  const letter = currentLetter();
  const audio = currentLetterAudio();
  const choices = currentGroupLetters();
  const hasPicked = Boolean(state.selectedListening);
  const picked = choices.find((choice) => choice.id === state.selectedListening);
  const isCorrect = picked && picked.id === letter.id;

  return screen(
    `
      ${topBar(
        t("alphabet.listeningTitle"),
        currentGroup().title,
        "",
        `<button class="back-button" data-action="go" data-target="group" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        ${renderAudioFocus({
          audio,
          label: t("alphabet.listeningExercise"),
          title: t("alphabet.listeningExercise"),
          hint: t("alphabet.listeningHint"),
          hideFile: true
        })}
        <div class="choice-grid">
          ${choices
            .map((choice, index) => {
              const selected = state.selectedListening === choice.id;
              const correctChoice = choice.id === letter.id;
              const resultClass = selected ? (correctChoice ? "correct" : "wrong") : "";
              return `
                <button
                  class="${["choice-card", "letter-only-choice", resultClass].filter(Boolean).join(" ")}"
                  data-action="pick-listening"
                  data-id="${choice.id}"
                  type="button"
                  aria-label="${t("alphabet.choiceAria", {
                    count: index + 1,
                    letter: displayStandaloneLetterGlyph(choice.letter)
                  })}"
                >
                  <span class="choice-art uyghur">${displayStandaloneLetterGlyph(choice.letter)}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? t("alphabet.listeningCorrect")
                  : letterMistakeFeedback(letter, picked)
              }</div>`
            : ""
        }
        <button class="primary-button" data-action="go" data-target="keyboard" type="button">
          ${t("alphabet.continueKeyboard")}
        </button>
      </section>
    `,
    "learn"
  );
}

function renderLetterOddPractice() {
  const letter = currentLetter();
  const target = oddLetterForCurrent();
  const choices = currentGroupLetters();
  const hasPicked = Boolean(state.selectedPicture);
  const picked = choices.find((choice) => choice.id === state.selectedPicture);
  const isCorrect = picked && picked.id === target.id;

  return screen(
    `
      ${topBar(
        t("alphabet.findDifferent"),
        currentGroup().title,
        "",
        `<button class="back-button" data-action="go" data-target="group" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">${t("alphabet.oddCompare")}</p>
          <h2 class="section-title">
            ${t("alphabet.oddPrompt", { letter: displayStandaloneLetterGlyph(letter.letter), cue: target.cue })}
          </h2>
          <p class="muted">${t("alphabet.oddHint")}</p>
        </article>
        <div class="choice-grid">
          ${choices
            .map((choice) => {
              const selected = state.selectedPicture === choice.id;
              const correctChoice = choice.id === target.id;
              const resultClass = selected ? (correctChoice ? "correct" : "wrong") : "";
              return `
                <button
                  class="choice-card ${resultClass}"
                  data-action="pick-letter-odd"
                  data-id="${choice.id}"
                  type="button"
                >
                  <span class="choice-art uyghur">${displayStandaloneLetterGlyph(choice.letter)}</span>
                  <span class="step-state">${selected ? (correctChoice ? t("alphabet.correct") : t("alphabet.lookAgain")) : t("alphabet.choose")}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? t("alphabet.oddCorrect", { letter: displayStandaloneLetterGlyph(target.letter), cue: target.cue })
                  : letterMistakeFeedback(target, picked)
              }</div>`
            : ""
        }
        <button class="primary-button" data-action="go" data-target="letterSound" type="button">
          ${t("alphabet.continueSoundChoice")}
        </button>
      </section>
    `,
    "learn"
  );
}

function renderLetterSoundChoice() {
  const letter = currentLetter();
  const audio = currentLetterAudio();
  const choices = currentGroupLetters();
  const hasPicked = Boolean(state.selectedListening);
  const picked = choices.find((choice) => choice.id === state.selectedListening);
  const isCorrect = picked && picked.id === letter.id;

  return screen(
    `
      ${topBar(
        t("alphabet.soundTitle"),
        currentGroup().title,
        "",
        `<button class="back-button" data-action="go" data-target="group" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        ${renderAudioFocus({
          audio,
          label: letter.letter,
          title: t("alphabet.playSound", { latin: letter.latin }),
          hint: t("alphabet.soundHint")
        })}
        <article class="card">
          <p class="caption">${t("alphabet.chooseLetter")}</p>
          <h2 class="section-title">${t("alphabet.soundQuestion", { latin: letter.latin })}</h2>
        </article>
        <div class="choice-grid">
          ${choices
            .map((choice) => {
              const selected = state.selectedListening === choice.id;
              const correctChoice = choice.id === letter.id;
              const resultClass = selected ? (correctChoice ? "correct" : "wrong") : "";
              return `
                <button
                  class="${["choice-card", "letter-only-choice", resultClass].filter(Boolean).join(" ")}"
                  data-action="pick-letter-sound"
                  data-id="${choice.id}"
                  type="button"
                  aria-label="${displayStandaloneLetterGlyph(choice.letter)}"
                >
                  <span class="choice-art uyghur">${displayStandaloneLetterGlyph(choice.letter)}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? t("alphabet.soundCorrect", { letter: displayStandaloneLetterGlyph(letter.letter), latin: letter.latin })
                  : letterMistakeFeedback(letter, picked)
              }</div>`
            : ""
        }
        <button class="primary-button" data-action="go" data-target="keyboard" type="button">
          ${t("alphabet.continueKeyboard")}
        </button>
      </section>
    `,
    "learn"
  );
}

function renderKeyboardPractice() {
  const letter = currentLetter();
  const isCorrect = state.keyboardValue === letter.letter;
  const hasInput = state.keyboardValue.length > 0;
  const keyboardParts = [letter.letter];

  return screen(
    `
      ${topBar(
        t("alphabet.keyboardTitle"),
        currentGroup().title,
        "",
        `<button class="back-button" data-action="go" data-target="group" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">${t("alphabet.keyboardPrompt")}</p>
          <div class="section-row">
            <strong class="uyghur">${displayStandaloneLetterGlyph(letter.letter)}</strong>
            <span class="caption">${letter.latin}</span>
          </div>
        </article>
        <input
          class="rtl-input uyghur"
          value="${state.keyboardValue}"
          aria-label="${t("alphabet.inputAria")}"
          readonly
          dir="rtl"
        />
        ${renderKeyboardGuide(keyboardParts, letter.letter)}
        <div class="practice-key-row" aria-label="${t("alphabet.groupKeysAria")}">
          ${currentGroupLetters()
            .map(
              (item) => `
                <button class="key-button uyghur ${guidedKeyClass(item.letter, keyboardParts, letter.letter)}" data-action="key" data-key="${item.letter}" type="button">
                  ${displayStandaloneLetterGlyph(item.letter)}
                </button>
              `
            )
            .join("")}
        </div>
        <div class="keyboard-grid" aria-label="${t("alphabet.keyboardAria")}">
          ${keyboardRows
            .flat()
            .map(
              (key) => `
                <button class="key-button uyghur ${guidedKeyClass(key, keyboardParts, letter.letter)}" data-action="key" data-key="${key}" type="button">
                  ${key}
                </button>
              `
            )
            .join("")}
          <button class="key-button utility" data-action="backspace" type="button">${t("alphabet.backspace")}</button>
          <button class="key-button utility" data-action="clear-input" type="button">${t("alphabet.clearInput")}</button>
        </div>
        ${
          hasInput
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? t("alphabet.keyboardCorrect")
                  : t("alphabet.keyboardContinue", { letter: displayStandaloneLetterGlyph(letter.letter) })
              }</div>`
            : `<div class="feedback">${t("alphabet.keyboardTip", { letter: `<span class="uyghur">${displayStandaloneLetterGlyph(letter.letter)}</span>` })}</div>`
        }
        <button class="primary-button" data-action="go" data-target="complete" type="button">
          ${t("alphabet.finishCourse")}
        </button>
      </section>
    `,
    "learn"
  );
}

function renderComplete() {
  const group = currentGroup();
  const letter = currentLetter();
  const groupLetters = group.letters.map((item) => displayStandaloneLetterGlyph(item.letter)).join(" / ");
  const loop = letterLoopProgress(group.id);
  const groupMistakes = state.mistakes.filter((item) => item.kind === "letter" && group.letters.some((letterItem) => letterItem.id === item.targetId)).length;

  return screen(
    `
      ${topBar(t("alphabet.completeTitle"), t("alphabet.completeSubtitle"))}
      <section class="stack">
        <article class="card">
          <p class="caption">${t("alphabet.completeLearned")}</p>
          <h2 class="screen-title">
            <span class="uyghur">${groupLetters}</span>
          </h2>
          <p class="muted">${t("alphabet.completeSummary", { letter: displayStandaloneLetterGlyph(letter.letter) })}</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>${group.letters.length}</strong><span>${t("alphabet.completeLetters")}</span></div>
          <div class="metric"><strong>${loop.completeCount} / ${loop.total}</strong><span>${t("alphabet.completeProgress")}</span></div>
          <div class="metric"><strong>${groupMistakes}</strong><span>${t("alphabet.completeMistakes")}</span></div>
        </div>
        ${renderUnitNextActions("letters")}
        <button class="secondary-button" data-action="go" data-target="home" type="button">
          ${t("alphabet.backHome")}
        </button>
      </section>
    `,
    "learn"
  );
}

function renderComboSelector(items, activeId) {
  return items
    .map(
      (item) => `
        <button
          class="letter-pill button-pill ${item.id === activeId ? "active" : ""}"
          data-action="select-combo"
          data-id="${item.id}"
          type="button"
        >
          <span class="uyghur">${item.value}</span>
          ${renderLatinTransliteration(item.latin, "selector-latin")}
        </button>
      `
    )
    .join("");
}

const comboBareLetterIds = {
  ا: "aa",
  ە: "ae",
  و: "o",
  ۇ: "u",
  ۆ: "oe",
  ۈ: "ue",
  ې: "ee",
  ى: "ii"
};
const comboNonForwardJoiningCharacters = new Set(["ئ", "ا", "ە", "د", "ر", "ز", "ژ", "و", "ۇ", "ۆ", "ۈ", "ۋ"]);

function comboPartBaseCharacter(part) {
  if (comboBareLetterIds[part]) {
    return part;
  }

  if (part.startsWith("ئ") && part.length > 1) {
    return part[1];
  }

  return part[0];
}

function comboLetterDetail(part) {
  return letterDetails[comboBareLetterIds[part]] || Object.values(letterDetails).find((letter) => letter.letter === part) || null;
}

function comboPartAcceptsConnection(part) {
  return Boolean(comboLetterDetail(part)) && comboPartBaseCharacter(part) !== "ئ";
}

function comboPartConnectsForward(part) {
  return Boolean(comboLetterDetail(part)) && !comboNonForwardJoiningCharacters.has(comboPartBaseCharacter(part));
}

function comboPartFormValue(part, formId) {
  const letter = comboLetterDetail(part);
  if (!letter) {
    return part;
  }

  if (comboBareLetterIds[part] && formId === "isolated") {
    return part;
  }

  return letter.forms.find((form) => form.id === formId)?.value || part;
}

function comboPartDetail(item, index) {
  const part = item.parts[index];
  const previous = item.parts[index - 1];
  const next = item.parts[index + 1];
  const connectsPrevious = Boolean(previous) && comboPartConnectsForward(previous) && comboPartAcceptsConnection(part);
  const connectsNext = Boolean(next) && comboPartConnectsForward(part) && comboPartAcceptsConnection(next);
  let formId = "isolated";
  let label = t("combo.formIsolated");

  if (connectsPrevious && connectsNext) {
    formId = "dual-joined";
    label = t("combo.formMedial");
  } else if (connectsPrevious) {
    formId = "left-joined";
    label = t("combo.formFinal");
  } else if (connectsNext) {
    formId = "right-joined";
    label = t("combo.formInitial");
  }

  let connection = t("combo.connectionNeither");
  if (connectsPrevious && connectsNext) {
    connection = t("combo.connectionBoth");
  } else if (connectsPrevious) {
    connection = t("combo.connectionPrevious");
  } else if (connectsNext) {
    connection = t("combo.connectionNext");
  } else if (index === 0 && item.parts.length > 1) {
    connection = t("combo.connectionInitialBreak");
  }

  return {
    part,
    label,
    form: comboPartFormValue(part, formId),
    connection
  };
}

function renderComboParts(item) {
  return item.parts
    .map(
      (part, index) => {
        const detail = comboPartDetail(item, index);
        return `
        <span class="combo-part">
          <span class="combo-part-index">${t("combo.partIndex", { count: index + 1 })}</span>
          <span class="combo-part-flow">
            <span class="combo-part-source">
              <strong class="uyghur">${detail.part}</strong>
              <small>${t("combo.sourceLetter")}</small>
            </span>
            <span class="combo-part-arrow" aria-hidden="true">→</span>
            <span class="combo-part-form">
              <strong class="uyghur">${detail.form}</strong>
              <small>${t("combo.formWriting", { form: detail.label })}</small>
            </span>
          </span>
          <small class="combo-part-note">${detail.connection}</small>
        </span>
      `;
      }
    )
    .join("");
}

function renderComboLesson() {
  const group = currentComboGroup();
  const unit = currentComboUnit();
  const item = currentComboItem();
  const audio = currentComboAudio();
  const position = itemPosition(currentComboItems(), item.id);

  return screen(
    `
      ${topBar(
        group.title,
        unit.title,
        "",
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <div class="alphabet-strip compact">
          ${renderComboSelector(group.items, item.id)}
        </div>

        ${renderItemProgress(position.label, t("combo.position"))}
        ${renderAdjacentNav({
          previous: position.previous,
          next: position.next,
          action: "select-adjacent-combo"
        })}

        <div class="letter-focus">
          ${renderAudioButton({ audio, label: item.value, className: "letter-focus-play" })}
          <div>
            <div class="uyghur letter-big combo-big">${item.value}</div>
            <p class="caption">${item.type}</p>
            ${renderLatinTransliteration(item.latin, "combo-latin")}
          </div>
        </div>

        <article class="card">
          <p class="caption">${t("combo.breakDown")}</p>
          <h2 class="section-title">${t("combo.connectedForm")}</h2>
          <div class="combo-parts" aria-label="${t("combo.partsAria")}">
            ${renderComboParts(item)}
          </div>
          <p class="caption">${t("combo.readDirection")}</p>
          <p class="muted">${item.rule}</p>
        </article>

        ${
          item.meaning
            ? `<article class="card review-card">
                <p class="caption">${t("combo.meaningPreview")}</p>
                <h2 class="section-title">${item.meaning}</h2>
              </article>`
            : ""
        }

        <article class="card">
          <p class="caption">${t("combo.learningPoints")}</p>
          <div class="lesson-point-list">
            <div class="lesson-point">
              <strong>${t("combo.howToRead")}</strong>
              <span>${
                state.preferences.showLatin
                  ? t("combo.readWithLatin", { latin: item.latin })
                  : t("combo.readWithAudio")
              }</span>
            </div>
            <div class="lesson-point">
              <strong>${t("combo.howToSee")}</strong>
              <span>${item.hint}</span>
            </div>
          </div>
        </article>

        <div class="action-grid">
          <button class="secondary-button" data-action="go" data-target="comboRecognition" type="button">
            ${t("combo.recognize")}
          </button>
          <button class="secondary-button" data-action="go" data-target="comboBuild" type="button">
            ${t("combo.build")}
          </button>
          <button class="secondary-button" data-action="go" data-target="comboWriting" type="button">
            ${t("combo.writing")}
          </button>
          <button class="primary-button" data-action="go" data-target="comboKeyboard" type="button">
            ${t("combo.keyboard")}
          </button>
        </div>
      </section>
    `,
    "learn"
  );
}

function renderComboRecognition() {
  const group = currentComboGroup();
  const item = currentComboItem();
  const choices = currentComboItems();
  const hasPicked = Boolean(state.selectedPicture);
  const picked = choices.find((choice) => choice.id === state.selectedPicture);
  const isCorrect = picked && picked.id === item.id;
  const prompt = item.meaning
    ? t("combo.chooseMeaning", { latin: item.latin })
    : t("combo.chooseReading", { prompt: item.prompt });

  return screen(
    `
      ${topBar(
        t("combo.recognitionTitle"),
        group.title,
        "",
        `<button class="back-button" data-action="go" data-target="combo" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">${t("combo.chooseCorrect")}</p>
          <h2 class="section-title">${prompt}</h2>
        </article>
        <div class="choice-grid">
          ${choices
            .map((choice) => {
              const selected = state.selectedPicture === choice.id;
              const correctChoice = choice.id === item.id;
              const resultClass = selected ? (correctChoice ? "correct" : "wrong") : "";
              return `
                <button
                  class="choice-card ${resultClass}"
                  data-action="pick-combo"
                  data-id="${choice.id}"
                  type="button"
                >
                  <span class="choice-art uyghur">${choice.value}</span>
                  <span>
                    <strong>${choice.latin}</strong>
                    <span class="caption">${choice.type}</span>
                  </span>
                  <span class="step-state">${selected ? (correctChoice ? t("combo.correct") : t("combo.tryAgain")) : t("combo.choose")}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? t("combo.recognitionCorrect", { value: item.value, type: item.type })
                  : comboMistakeFeedback(item, picked)
              }</div>`
            : ""
        }
        <button class="primary-button" data-action="go" data-target="comboKeyboard" type="button">
          ${t("combo.continueKeyboard")}
        </button>
      </section>
    `,
    "learn"
  );
}

function renderComboBuild() {
  const group = currentComboGroup();
  const item = currentComboItem();
  const hasInput = state.keyboardValue.length > 0;
  const isCorrect = state.keyboardValue === item.value;
  const isOffTrack = hasInput && !item.value.startsWith(state.keyboardValue);

  return screen(
    `
      ${topBar(
        t("combo.buildTitle"),
        group.title,
        "",
        `<button class="back-button" data-action="go" data-target="combo" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">${t("combo.buildWhole")}</p>
          <h2 class="section-title">
            <span class="uyghur">${item.parts.join(" + ")}</span>
          </h2>
          <p class="muted">${t("combo.buildInstruction", { value: `<span class="uyghur">${item.value}</span>` })}</p>
        </article>
        <article class="card">
          <p class="caption">${t("combo.currentBuild")}</p>
          <div class="letter-focus compact-focus">
            <div>
              <div class="uyghur letter-big combo-big">${state.keyboardValue || "…"}</div>
              <p class="caption">${t("combo.targetLatin", { latin: item.latin })}</p>
            </div>
          </div>
        </article>
        <div class="practice-key-row" aria-label="${t("combo.buildAria")}">
          ${item.parts
            .map(
              (part) => `
                <button class="key-button uyghur" data-action="build-part" data-key="${part}" type="button">
                  ${part}
                </button>
              `
            )
            .join("")}
        </div>
        <div class="tool-row">
          <button class="secondary-button" data-action="backspace" type="button">${t("combo.backspace")}</button>
          <button class="secondary-button" data-action="clear-input" type="button">${t("combo.clear")}</button>
        </div>
        ${
          hasInput
            ? `<div class="feedback ${isCorrect ? "good" : isOffTrack ? "bad" : ""}">${
                isCorrect
                  ? t("combo.buildCorrect", { value: item.value })
                  : isOffTrack
                    ? comboMistakeFeedback(item, { value: state.keyboardValue })
                    : t("combo.buildContinue", { value: item.value })
              }</div>`
            : `<div class="feedback">${t("combo.buildStart", { part: `<span class="uyghur">${item.parts[0]}</span>` })}</div>`
        }
        <button class="primary-button" data-action="go" data-target="comboKeyboard" type="button">
          ${t("combo.continueKeyboard")}
        </button>
      </section>
    `,
    "learn"
  );
}

function renderComboWriting() {
  const group = currentComboGroup();
  const unit = currentComboUnit();
  const item = currentComboItem();

  return screen(
    `
      ${topBar(
        t("combo.writingTitle"),
        group.title,
        "",
        `<button class="back-button" data-action="go" data-target="combo" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">${t("combo.targetCombination")}</p>
              <h2 class="section-title"><span class="uyghur">${item.value}</span></h2>
            </div>
            <button class="ghost-button" data-action="toggle-guide" type="button">
              ${state.showGuide ? t("combo.hideGuide") : t("combo.showGuide")}
            </button>
          </div>
          <p class="muted">${t("combo.writingInstruction", { latin: item.latin })}</p>
        </article>
        ${renderWritingCoach({
          value: item.value,
          parts: item.parts,
          hint: item.hint,
          mode: "word"
        })}
        ${renderWritingCanvas(item.value, t("combo.canvasAria", { unit: unit.title }))}
        <div class="tool-row">
          <button class="secondary-button" data-action="clear-canvas" type="button">${t("combo.clearCanvas")}</button>
          <button class="secondary-button" data-action="toggle-guide" type="button">
            ${state.showGuide ? t("combo.hideGuide") : t("combo.showGuide")}
          </button>
        </div>
        <div class="feedback">${t("combo.writingFeedback")}</div>
        <button class="primary-button" data-action="go" data-target="comboKeyboard" type="button">
          ${t("combo.continueKeyboard")}
        </button>
      </section>
    `,
    "writing"
  );
}

function renderComboKeyboard() {
  const group = currentComboGroup();
  const item = currentComboItem();
  const isCorrect = state.keyboardValue === item.value;
  const hasInput = state.keyboardValue.length > 0;
  const keyboardParts = item.parts;

  return screen(
    `
      ${topBar(
        t("combo.keyboardTitle"),
        group.title,
        "",
        `<button class="back-button" data-action="go" data-target="combo" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">${t("combo.keyboardPrompt")}</p>
          <div class="section-row">
            <strong class="uyghur">${item.value}</strong>
            <span class="caption">${item.latin}</span>
          </div>
        </article>
        <input
          class="rtl-input uyghur"
          value="${state.keyboardValue}"
          aria-label="${t("combo.inputAria")}"
          readonly
          dir="rtl"
        />
        ${renderKeyboardGuide(keyboardParts, item.value)}
        <div class="practice-key-row" aria-label="${t("combo.groupKeysAria")}">
          ${group.items
            .map(
              (choice) => `
                <button class="key-button uyghur" data-action="key" data-key="${choice.value}" type="button">
                  ${choice.value}
                </button>
              `
            )
            .join("")}
        </div>
        <div class="practice-key-row" aria-label="${t("combo.partKeysAria")}">
          ${item.parts
            .map(
              (part) => `
                <button class="key-button uyghur ${guidedKeyClass(part, keyboardParts, item.value)}" data-action="key" data-key="${part}" type="button">
                  ${part}
                </button>
              `
            )
            .join("")}
        </div>
        <div class="keyboard-grid" aria-label="${t("combo.keyboardAria")}">
          ${keyboardRows
            .flat()
            .map(
              (key) => `
                <button class="key-button uyghur ${guidedKeyClass(key, keyboardParts, item.value)}" data-action="key" data-key="${key}" type="button">
                  ${key}
                </button>
              `
            )
            .join("")}
          <button class="key-button utility" data-action="backspace" type="button">${t("combo.backspace")}</button>
          <button class="key-button utility" data-action="clear-input" type="button">${t("combo.clear")}</button>
        </div>
        ${
          hasInput
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? t("combo.keyboardCorrect")
                  : t("combo.keyboardContinue", { value: item.value })
              }</div>`
            : `<div class="feedback">${t("combo.keyboardTip", { value: `<span class="uyghur">${item.value}</span>` })}</div>`
        }
        <button class="primary-button" data-action="go" data-target="comboComplete" type="button">
          ${t("combo.finishGroup")}
        </button>
      </section>
    `,
    "learn"
  );
}

function renderComboComplete() {
  const group = currentComboGroup();
  const unit = currentComboUnit();
  const item = currentComboItem();
  const groupValues = group.items.map((choice) => choice.value).join(" / ");

  return screen(
    `
      ${topBar(t("combo.completeTitle"), group.title)}
      <section class="stack">
        <article class="card">
          <p class="caption">${t("combo.completePractice")}</p>
          <h2 class="screen-title">
            <span class="uyghur">${groupValues}</span>
          </h2>
          <p class="muted">${t("combo.completeSummary", { value: item.value })}</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>${group.items.length}</strong><span>${t("combo.completeCombinations")}</span></div>
          <div class="metric"><strong>1</strong><span>${t("combo.completeInput")}</span></div>
          <div class="metric"><strong>${t("combo.completeWordForm")}</strong><span>${t("combo.completeUnderstanding")}</span></div>
        </div>
        ${renderUnitNextActions(unit.id)}
        <button class="secondary-button" data-action="go" data-target="learn" type="button">
          ${t("combo.learningPath")}
        </button>
      </section>
    `,
    "learn"
  );
}

function renderVocabSelector(items, activeId) {
  return items
    .map(
      (item) => `
        <button
          class="letter-pill button-pill ${item.id === activeId ? "active" : ""}"
          data-action="select-vocab"
          data-id="${item.id}"
          type="button"
        >
          <span class="uyghur">${item.value}</span>
          ${renderLatinTransliteration(item.latin, "selector-latin")}
        </button>
      `
    )
    .join("");
}

function renderVocabRow(item, activeId) {
  const audio = vocabAudioByItemId[item.id] || null;

  return `
    <div
      class="vocab-row ${item.id === activeId ? "active" : ""}"
      ${item.id === activeId ? `aria-current="true"` : ""}
    >
      ${renderAudioWord({ value: item.value, audio })}
      <button
        class="vocab-row-main"
        data-action="select-vocab"
        data-id="${item.id}"
        type="button"
      >
        ${renderLatinTransliteration(item.latin, "vocab-latin")}
        <small>${item.meaning}</small>
      </button>
    </div>
  `;
}

function renderVocabRows(group, activeId) {
  const itemsById = Object.fromEntries(group.items.map((item) => [item.id, item]));

  return `
    <div class="vocab-row-list" aria-label="${t("vocab.rowsAria")}">
      ${
        group.sections?.length
          ? group.sections
              .map((section) => {
                const sectionItems = section.itemIds.map((itemId) => itemsById[itemId]).filter(Boolean);
                return `
                  <section class="vocab-subgroup">
                    <div class="vocab-subgroup-title">
                      <strong>${section.title}</strong>
                      <small>${t("vocab.wordCount", { count: sectionItems.length })}</small>
                    </div>
                    ${sectionItems.map((item) => renderVocabRow(item, activeId)).join("")}
                  </section>
                `;
              })
              .join("")
          : group.items.map((item) => renderVocabRow(item, activeId)).join("")
      }
    </div>
  `;
}

function renderVocabLesson() {
  const group = currentVocabGroup();
  const item = currentVocabItem();
  const section = currentVocabSection();
  const sectionItems = currentVocabSectionItems();
  const position = itemPosition(sectionItems, item.id);

  return screen(
    `
      ${topBar(
        group.title,
        t("vocab.unitTitle"),
        "",
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <article class="card vocab-lesson-card">
          <div class="section-row">
            <div>
              <p class="caption">${t("vocab.lessonWords")}</p>
              <h2 class="section-title unit-goal-text">${group.title} · ${t("vocab.wordCount", { count: group.items.length })}</h2>
              ${section ? `<p class="caption">${section.title}</p>` : ""}
            </div>
          </div>
          <p class="muted compact-note">${t("vocab.lessonInstruction")}</p>
          ${renderVocabRows(group, item.id)}
        </article>

        <div class="item-progress">
          <span class="step-state">${position.label}</span>
          <strong>${t("vocab.current", { value: `${state.preferences.showLatin ? `${item.latin} · ` : ""}${item.meaning}` })}</strong>
        </div>

        <div class="action-grid vocab-action-grid">
          <button class="secondary-button" data-action="go" data-target="vocabRecognition" type="button">
            ${t("vocab.recognition")}
          </button>
          <button class="primary-button" data-action="go" data-target="vocabKeyboard" type="button">
            ${t("vocab.keyboard")}
          </button>
        </div>
      </section>
    `,
    "learn"
  );
}

function renderVocabRecognition() {
  const group = currentVocabGroup();
  const item = currentVocabItem();
  const choices = currentVocabSectionItems();
  const hasPicked = Boolean(state.selectedPicture);
  const picked = choices.find((choice) => choice.id === state.selectedPicture);
  const isCorrect = picked && picked.id === item.id;

  return screen(
    `
      ${topBar(
        t("vocab.recognitionTitle"),
        group.title,
        "",
        `<button class="back-button" data-action="go" data-target="vocab" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">${t("vocab.chooseWordForm")}</p>
          <h2 class="section-title">${t("vocab.choosePrompt", { latin: item.latin })}</h2>
          <p class="muted">${t("vocab.meaningPreview", { meaning: item.meaning })}</p>
        </article>
        <div class="choice-grid">
          ${choices
            .map((choice) => {
              const selected = state.selectedPicture === choice.id;
              const correctChoice = choice.id === item.id;
              const resultClass = selected ? (correctChoice ? "correct" : "wrong") : "";
              return `
                <button
                  class="choice-card vocab-choice ${resultClass}"
                  data-action="pick-vocab"
                  data-id="${choice.id}"
                  type="button"
                >
                  <span class="choice-art choice-art-wide uyghur">${choice.value}</span>
                  <span>
                    <strong>${choice.latin}</strong>
                    <span class="caption">${choice.meaning}</span>
                  </span>
                  <span class="step-state">${selected ? (correctChoice ? t("vocab.correct") : t("vocab.tryAgain")) : t("vocab.choose")}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? t("vocab.recognitionCorrect", { value: item.value })
                  : vocabMistakeFeedback(item, picked)
              }</div>`
            : ""
        }
        <button class="primary-button" data-action="go" data-target="vocabKeyboard" type="button">
          ${t("vocab.continueKeyboard")}
        </button>
      </section>
    `,
    "learn"
  );
}

function renderVocabKeyboard() {
  const group = currentVocabGroup();
  const item = currentVocabItem();
  const sectionItems = currentVocabSectionItems();
  const isCorrect = state.keyboardValue === item.value;
  const hasInput = state.keyboardValue.length > 0;
  const keyboardParts = item.parts;

  return screen(
    `
      ${topBar(
        t("vocab.keyboardTitle"),
        group.title,
        "",
        `<button class="back-button" data-action="go" data-target="vocab" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">${t("vocab.keyboardPrompt")}</p>
          <div class="section-row">
            <strong class="uyghur">${item.value}</strong>
            <span class="caption">${item.latin}</span>
          </div>
        </article>
        <input
          class="rtl-input uyghur"
          value="${state.keyboardValue}"
          aria-label="${t("vocab.inputAria")}"
          readonly
          dir="rtl"
        />
        ${renderKeyboardGuide(keyboardParts, item.value)}
        <div class="practice-key-row" aria-label="${t("vocab.groupKeysAria")}">
          ${sectionItems
            .map(
              (choice) => `
                <button class="key-button uyghur" data-action="key" data-key="${choice.value}" type="button">
                  ${choice.value}
                </button>
              `
            )
            .join("")}
        </div>
        <div class="practice-key-row" aria-label="${t("vocab.partKeysAria")}">
          ${item.parts
            .map(
              (part) => `
                <button class="key-button uyghur ${guidedKeyClass(part, keyboardParts, item.value)}" data-action="key" data-key="${part}" type="button">
                  ${part}
                </button>
              `
            )
            .join("")}
        </div>
        <div class="tool-row">
          <button class="secondary-button" data-action="backspace" type="button">${t("vocab.backspace")}</button>
          <button class="secondary-button" data-action="clear-input" type="button">${t("vocab.clear")}</button>
        </div>
        ${
          hasInput
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? t("vocab.keyboardCorrect")
                  : t("vocab.keyboardContinue", { value: item.value })
              }</div>`
            : `<div class="feedback">${t("vocab.keyboardTip", { value: `<span class="uyghur">${item.value}</span>` })}</div>`
        }
        <button class="primary-button" data-action="go" data-target="vocabComplete" type="button">
          ${t("vocab.finishGroup")}
        </button>
      </section>
    `,
    "learn"
  );
}

function renderVocabComplete() {
  const group = currentVocabGroup();
  const item = currentVocabItem();
  const section = currentVocabSection();
  const sectionItems = currentVocabSectionItems();
  const groupValues = sectionItems.map((choice) => choice.value).join(" / ");

  return screen(
    `
      ${topBar(t("vocab.completeTitle"), group.title)}
      <section class="stack">
        <article class="card review-card">
          <p class="caption">${t("vocab.completePractice")}</p>
          <h2 class="screen-title">
            <span class="uyghur">${groupValues}</span>
          </h2>
          <p class="muted">${t("vocab.completeSummary", { value: item.value })}</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>${sectionItems.length}</strong><span>${section ? section.title : t("vocab.completeWordForms")}</span></div>
          <div class="metric"><strong>1</strong><span>${t("vocab.completeInput")}</span></div>
          <div class="metric"><strong>${t("vocab.completeMeaning")}</strong><span>${t("vocab.completeUnderstanding")}</span></div>
        </div>
        ${renderUnitNextActions("basic-phrases")}
        <button class="secondary-button" data-action="go" data-target="learn" type="button">
          ${t("vocab.learningPath")}
        </button>
      </section>
    `,
    "learn"
  );
}

function renderReadingLine(unit, item) {
  const audio = readingAudioByItemId[item.id] || null;
  const audioButton = renderAudioButton({
    audio,
    label: item.value,
    className: "reading-line-play"
  });

  if (unit.readingKind === "grammar") {
    return `
      <article class="reading-line grammar-reading-line">
        ${audioButton}
        <div>
          <p class="caption grammar-pattern">${item.pattern}</p>
          <div class="uyghur reading-value">${item.value}</div>
          ${renderLatinTransliteration(item.latin, "reading-latin")}
          <p class="reading-meaning">${item.meaning}</p>
          <p class="grammar-lesson">${item.lesson}</p>
        </div>
      </article>
    `;
  }

  if (unit.readingKind === "quote" || unit.readingKind === "proverb") {
    return `
      <article class="card reading-line reading-feature-line">
        ${audioButton}
        <div class="uyghur reading-value">${item.value}</div>
        ${renderLatinTransliteration(item.latin, "reading-latin")}
        <p class="reading-meaning">${item.meaning}</p>
      </article>
    `;
  }

  return `
    <article class="reading-line">
      ${audioButton}
      ${item.speaker ? `<span class="speaker-badge">${item.speaker}</span>` : ""}
      <div>
        <div class="uyghur reading-value">${item.value}</div>
        ${renderLatinTransliteration(item.latin, "reading-latin")}
        <p class="reading-meaning">${item.meaning}</p>
      </div>
    </article>
  `;
}

function renderReadingLesson() {
  const unit = currentReadingUnit();
  const group = currentReadingGroup();

  return screen(
    `
      ${topBar(
        group.title,
        unit.title,
        "",
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        ${
          unit.readingKind === "quote" && group.intro
            ? `<article class="card reading-intro-card">
                <p class="caption">${t("reading.personIntro")}</p>
                <p class="reading-intro-text">${group.intro}</p>
              </article>`
            : ""
        }
        <div class="reading-list ${unit.readingKind}">
          ${group.items.map((item) => renderReadingLine(unit, item)).join("")}
        </div>
        <button class="secondary-button" data-action="go" data-target="unit" type="button">
          ${t("reading.backToLessons")}
        </button>
      </section>
    `,
    "learn"
  );
}

function renderPracticeSelector(items, activeId) {
  return items
    .map(
      (item) => `
        <button
          class="letter-pill button-pill ${item.id === activeId ? "active" : ""}"
          data-action="select-practice"
          data-id="${item.id}"
          type="button"
        >
          <span class="uyghur">${item.value}</span>
          <small>${item.latin}</small>
        </button>
      `
    )
    .join("");
}

function renderPracticeChoices(group, item) {
  const hasPicked = Boolean(state.selectedListening);
  const picked = group.items.find((choice) => choice.id === state.selectedListening);
  const isCorrect = picked && picked.id === item.id;

  return `
    <div class="choice-grid">
      ${group.items
        .map((choice) => {
          const selected = state.selectedListening === choice.id;
          const correctChoice = choice.id === item.id;
          const resultClass = selected ? (correctChoice ? "correct" : "wrong") : "";
          return `
            <button
              class="choice-card vocab-choice ${resultClass}"
              data-action="pick-practice"
              data-id="${choice.id}"
              type="button"
            >
              <span class="choice-art choice-art-wide uyghur">${choice.value}</span>
              <span>
                <strong>${choice.label}</strong>
                <span class="caption">${t("practice.typeWithLatin", { type: choice.type, latin: choice.latin })}</span>
              </span>
              <span class="step-state">${selected ? (correctChoice ? t("practice.correct") : t("practice.listenAgain")) : t("practice.choose")}</span>
            </button>
          `;
        })
        .join("")}
    </div>
    ${
      hasPicked
        ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
            isCorrect
              ? t("practice.choiceCorrect", { letter: item.value })
              : itemMistakeFeedback(item, picked, t("practice.choiceTarget"))
          }</div>`
        : ""
    }
  `;
}

function renderPracticeListeningChoices(group, item) {
  if (!state.practiceAudioPlayed) {
    return "";
  }

  const hasPicked = Boolean(state.selectedListening);
  const isCorrect = state.selectedListening === item.id;
  const completedCount = practiceListeningCompletedCount(group);

  return `
    <article class="card practice-mode-card">
      <p class="caption">${t("practice.chooseLetter")}</p>
      <h2 class="section-title unit-goal-text">${t("practice.listenInstruction")}</h2>
      <div class="alphabet-strip compact listening-choice-strip" aria-label="${t("practice.choicesAria")}">
        ${group.items
          .map((choice, index) => {
            const selected = state.selectedListening === choice.id;
            const choiceClass = selected ? (choice.id === item.id ? "active" : "wrong") : "";
            return `
              <button
                class="letter-pill button-pill ${choiceClass}"
                data-action="pick-practice"
                data-id="${choice.id}"
                type="button"
                aria-label="${t("practice.choiceAria", { count: index + 1, letter: choice.value })}"
              >
                <span class="uyghur">${choice.value}</span>
              </button>
            `;
          })
          .join("")}
      </div>
    </article>
    ${
      hasPicked
        ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
            isCorrect
              ? t("practice.listenCorrect", { completed: completedCount, total: group.items.length })
              : t("practice.listenRetry")
          }</div>`
        : ""
    }
  `;
}

function renderPracticeModeCard(group, item) {
  if (group.mode === "listen") {
    return renderPracticeListeningChoices(group, item);
  }

  if (group.mode === "repeat") {
    return `
      <article class="card practice-mode-card">
        <p class="caption">${t("practice.repeatSteps")}</p>
        <div class="lesson-point-list">
          <div class="lesson-point"><strong>${t("practice.lookLetter")}</strong><span class="uyghur">${item.value}</span></div>
          <div class="lesson-point"><strong>${t("practice.readHint")}</strong><span>${item.latin}, ${item.hint}</span></div>
          <div class="lesson-point"><strong>${t("practice.repeatSoftly")}</strong><span>${t("practice.audioStatusSentence", { status: item.audioStatus })}</span></div>
        </div>
      </article>
    `;
  }

  if (group.mode === "write") {
    return `
      <article class="card practice-mode-card">
        <div class="section-row">
          <p class="caption">${t("practice.writingPad")}</p>
          <button class="ghost-button" data-action="clear-canvas" type="button">${t("practice.clearPad")}</button>
        </div>
        ${renderWritingCanvas(item.value, t("practice.canvasAria"))}
        <button class="ghost-button" data-action="toggle-guide" type="button">
          ${state.showGuide ? t("practice.hideGuide") : t("practice.showGuide")}
        </button>
      </article>
      ${renderWritingCoach({
        value: item.value,
        parts: item.parts,
        hint: item.hint,
        mode: "word"
      })}
    `;
  }

  if (group.mode === "keyboard") {
    const keyboardChoices = practiceKeyboardChoices(item);

    return `
      <input
        class="rtl-input uyghur"
        value="${state.keyboardValue}"
        aria-label="${t("practice.keyboardAria")}"
        readonly
        dir="rtl"
      />
      <div class="keyboard-grid random-keyboard-grid" aria-label="${t("practice.randomKeyboardAria")}">
        ${keyboardChoices
          .map(
            (key) => `
              <button class="key-button uyghur" data-action="key" data-key="${key}" type="button">
                ${key}
              </button>
            `
          )
          .join("")}
      </div>
      <div class="keyboard-utility-row" aria-label="${t("practice.keyboardTools")}">
        <button class="key-button utility" data-action="backspace" type="button">${t("practice.backspace")}</button>
        <button class="key-button utility" data-action="clear-input" type="button">${t("practice.clear")}</button>
      </div>
    `;
  }

  const reviewItems = mistakeReviewItems();
  if (!reviewItems.length) {
    return `
      <article class="card practice-mode-card">
        <p class="caption">${t("practice.noMistakes")}</p>
        <h2 class="section-title">${t("practice.noMistakesTitle")}</h2>
        <p class="muted">${t("practice.noMistakesDetail")}</p>
      </article>
      <div class="feedback">${t("practice.noMistakesFeedback")}</div>
    `;
  }

  return `
    <article class="card practice-mode-card">
      <p class="caption">${t("practice.mistakesRound")}</p>
      <div class="practice-review-list">
        ${reviewItems
          .map(
            (choice) => `
              <button
                class="practice-review-item ${choice.id === item.id ? "active" : ""}"
                data-action="select-practice"
                data-id="${choice.id}"
                type="button"
              >
                <span class="uyghur">${choice.value}</span>
                <span>
                  <strong>${choice.label}</strong>
                  <small>${choice.hint}</small>
                </span>
              </button>
            `
          )
          .join("")}
      </div>
    </article>
    <div class="feedback">${t("practice.reviewSaved")}</div>
  `;
}

function renderPracticeHub() {
  return screen(
    `
      ${topBar(t("practice.hubTitle"), t("practice.hubSubtitle"))}
      <section class="stack">
        <article class="card">
          <p class="caption">${t("practice.hubEntry")}</p>
          <h2 class="section-title">${t("practice.hubDetail")}</h2>
          <div class="action-grid">
            <button class="primary-button" data-action="go" data-target="home" type="button">${t("practice.hubBackHome")}</button>
            <button class="secondary-button" data-action="go" data-target="library" type="button">${t("practice.goAlphabet")}</button>
          </div>
        </article>
      </section>
    `,
    "home"
  );
}

function renderPracticeSession() {
  const group = currentPracticeGroup();
  const isReviewPractice = group.mode === "review";
  const practiceBackTarget = isReviewPractice ? "home" : "library";
  const reviewItems = isReviewPractice ? mistakeReviewItems() : [];
  const item = currentPracticeItem();
  if (!item) {
    return screen(
      `
        ${topBar(
          group.title,
          isReviewPractice ? t("practice.reviewSubtitle") : t("practice.alphabetSubtitle"),
          "",
          `<button class="back-button" data-action="go" data-target="${practiceBackTarget}" type="button" aria-label="${t("common.back")}">←</button>`
        )}
        <section class="stack">
          ${renderPracticeModeCard(group, null)}
          <button class="primary-button" data-action="go" data-target="${practiceBackTarget}" type="button">
            ${isReviewPractice ? t("practice.backHome") : t("practice.backAlphabet")}
          </button>
        </section>
      `,
      "writing"
    );
  }

  const audio = item.audio || currentPracticeAudio();
  const longWordClass = item.value.length > 6 ? "long-text" : "";
  const isListeningPractice = group.mode === "listen";
  const isWritingPractice = group.mode === "write";
  const listeningAnsweredCorrect = isListeningPractice && state.selectedListening === item.id;
  const listeningCompletedCount = isListeningPractice ? practiceListeningCompletedCount(group) : 0;
  const listeningRoundComplete = isListeningPractice && practiceListeningRoundComplete(group);
  const reviewPosition = isReviewPractice ? itemPosition(reviewItems, item.id) : null;
  const showPracticeSelector = !isReviewPractice && !isListeningPractice;
  const showPracticeTarget = (!isListeningPractice || listeningAnsweredCorrect) && !isWritingPractice;
  const showPracticeAudio = !isWritingPractice;
  const showSeparatePracticeAudio = isListeningPractice && showPracticeAudio && !showPracticeTarget;
  const practiceAudioFocus = renderAudioFocus({
    audio,
    label: isListeningPractice ? t("practice.listeningPractice") : item.value,
    title: isListeningPractice ? t("practice.listeningPractice") : t("practice.playLetter", { latin: item.latin }),
    hint: isListeningPractice
      ? t("practice.listenFirst")
      : t("practice.audioPending"),
    hideFile: isListeningPractice
  });
  const practiceTargetCard = (withAudio = false) => `
    <div class="letter-focus practice-target-card">
      ${
        withAudio
          ? renderAudioButton({
              audio,
              label: isListeningPractice ? t("practice.listeningPractice") : item.value,
              className: "letter-focus-play"
            })
          : ""
      }
      <div>
        <div class="uyghur letter-big practice-big ${longWordClass}">${item.value}</div>
        <p class="caption">${t("practice.typeWithLatin", { type: item.type, latin: item.latin })}</p>
      </div>
    </div>
  `;

  return screen(
    `
      ${topBar(
        group.title,
        isReviewPractice ? t("practice.reviewSubtitle") : t("practice.alphabetSubtitle"),
        "",
        `<button class="back-button" data-action="go" data-target="${practiceBackTarget}" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">${item.label}</p>
              <h2 class="section-title unit-goal-text">${group.goal}</h2>
            </div>
            <span class="step-state">${
              isListeningPractice
                ? `${listeningCompletedCount} / ${group.items.length}`
                : isReviewPractice
                  ? t("practice.itemCount", { count: reviewItems.length })
                  : group.status
            }</span>
          </div>
        </article>

        ${showPracticeSelector ? `<div class="alphabet-strip compact">
                ${renderPracticeSelector(group.items, item.id)}
              </div>` : ""}

        ${!isListeningPractice && showPracticeTarget ? practiceTargetCard(showPracticeAudio) : ""}

        ${showSeparatePracticeAudio ? practiceAudioFocus : ""}

        ${isListeningPractice && showPracticeTarget ? practiceTargetCard(showPracticeAudio) : ""}

        ${
          isReviewPractice && reviewPosition && reviewItems.length > 1
            ? renderAdjacentNav({
                previous: reviewPosition.previous,
                next: reviewPosition.next,
                action: "select-practice"
              })
            : ""
        }

        ${renderPracticeModeCard(group, item)}

        ${
          group.mode === "repeat"
            ? ""
            : isListeningPractice && !listeningAnsweredCorrect
              ? `<button class="secondary-button" data-action="go" data-target="${practiceBackTarget}" type="button">
                  ${t("practice.backAlphabet")}
                </button>`
              : `<div class="action-grid">
                <button class="secondary-button" data-action="go" data-target="${practiceBackTarget}" type="button">
                  ${isReviewPractice ? t("practice.backHome") : t("practice.backAlphabet")}
                </button>
                ${
                  isListeningPractice && !listeningRoundComplete
                    ? `<button class="primary-button" data-action="next-practice-audio" type="button">
                        ${t("practice.nextAudio")}
                      </button>`
                    : `<button class="primary-button" data-action="go" data-target="practiceComplete" type="button">
                        ${t("practice.viewResults")}
                      </button>`
                }
              </div>`
        }
      </section>
    `,
    "writing"
  );
}

function renderPracticeComplete() {
  const group = currentPracticeGroup();
  const isReviewPractice = group.mode === "review";
  const item = currentPracticeItem();
  if (!item) {
    return screen(
      `
        ${topBar(t("practice.results"), group.title)}
        <section class="stack">
          <article class="card review-card">
            <p class="caption">${t("practice.noMistakes")}</p>
            <h2 class="section-title">${t("practice.noReviewTitle")}</h2>
            <p class="muted">${t("practice.noReviewDetail")}</p>
          </article>
          <button class="primary-button" data-action="go" data-target="${isReviewPractice ? "home" : "library"}" type="button">
            ${isReviewPractice ? t("practice.backHome") : t("practice.backAlphabet")}
          </button>
        </section>
      `,
      "writing"
    );
  }

  const listened =
    group.mode === "listen"
      ? t("practice.completedCount", { completed: practiceListeningCompletedCount(group), total: group.items.length })
      : t("practice.optional");
  const repeated = group.mode === "repeat"
    ? (state.practiceSpoken ? t("practice.repeated") : t("practice.notRepeated"))
    : t("practice.optional");
  const written = group.mode === "write" ? t("practice.practiced") : t("practice.optional");
  const typed = group.mode === "keyboard"
    ? (state.keyboardValue === item.value ? t("practice.entered") : t("practice.notComplete"))
    : t("practice.optional");

  return screen(
    `
      ${topBar(t("practice.results"), group.title)}
      <section class="stack">
        <article class="card review-card">
          <p class="caption">${t("practice.roundTarget")}</p>
          <h2 class="screen-title"><span class="uyghur">${item.value}</span></h2>
          <p class="muted">${t("practice.scopeNote")}</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>${group.items.length}</strong><span>${t("practice.groupItems")}</span></div>
          <div class="metric"><strong>${t("practice.recorded")}</strong><span>${t("practice.audio")}</span></div>
          <div class="metric"><strong>${state.mistakes.length}</strong><span>${t("practice.localMistakes")}</span></div>
        </div>
        <article class="card">
          <p class="caption">${t("practice.record")}</p>
          <div class="audit-grid">
            <div class="audit-row"><strong>${t("practice.listening")}</strong><span>${listened}</span></div>
            <div class="audit-row"><strong>${t("practice.repeat")}</strong><span>${repeated}</span></div>
            <div class="audit-row"><strong>${t("practice.writing")}</strong><span>${written}</span></div>
            <div class="audit-row"><strong>${t("practice.keyboard")}</strong><span>${typed}</span></div>
            <div class="audit-row"><strong>${t("practice.note")}</strong><span>${t("practice.audioStatusSentence", { status: item.audioStatus })}</span></div>
          </div>
        </article>
        <article class="card next-action-card">
          <p class="caption">${t("practice.nextStep")}</p>
          <div class="action-grid">
            <button class="secondary-button" data-action="open-practice-group" data-id="${group.id}" type="button">
              ${t("practice.tryAgain")}
            </button>
            <button class="primary-button" data-action="go" data-target="${isReviewPractice ? "home" : "library"}" type="button">
              ${isReviewPractice ? t("practice.backHome") : t("practice.backAlphabet")}
            </button>
          </div>
        </article>
      </section>
    `,
    "writing"
  );
}

function renderLibrary() {
  return screen(
    `
      ${topBar(t("library.title"), t("library.subtitle"))}
      <section class="stack">
        <article class="card compact-library-card">
          <div class="section-row">
            <div>
              <p class="caption">${t("library.fullAlphabet")}</p>
              <h2 class="section-title">${t("library.letterCount")}</h2>
            </div>
          </div>
        </article>

        <article class="card">
          <div class="letter-library-grid" aria-label="${t("library.directory")}">
            ${allUnitOneLetters()
              .map(
                (letter) => `
                  <button
                    class="letter-library-pill"
                    data-action="select-letter"
                    data-id="${letter.id}"
                    data-target="letter"
                    type="button"
                    aria-label="${letter.latin}"
                  >
                    <span class="uyghur">${displayStandaloneLetterGlyph(letter.letter)}</span>
                    <small>${letter.latin}</small>
                  </button>
                `
              )
              .join("")}
          </div>
        </article>

        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">${t("library.practice")}</p>
              <h2 class="section-title">${t("library.practiceModes")}</h2>
            </div>
          </div>
          <div class="path-list">
            ${practiceGroups
              .filter((group) => group.mode !== "review")
              .map((group) => renderPracticeTopicCard(group))
              .join("")}
          </div>
        </article>
      </section>
    `,
    "library"
  );
}

function profileStreakDays(progress) {
  return progress.completed > 0 ? 1 : 0;
}

function renderProfileHero(progress, reviewCount) {
  const streakDays = profileStreakDays(progress);
  const accountEmail = cloudAccountEmail();
  const accountProfile = cloudAccountProfile();
  const avatarUrl = accountProfile.avatarUrl;
  const displayName = accountProfile.displayName || t("profile.learner");
  const avatarContent = avatarUrl
    ? `<img src="${escapeHtml(avatarUrl)}" alt="${t("profile.avatarAlt")}" />`
    : `<span aria-hidden="true">AT</span>`;

  return `
    <article class="card profile-hero-card">
      <div class="profile-identity">
        <div class="profile-avatar-picker">
          <div class="profile-avatar">${avatarContent}</div>
          <label class="profile-avatar-action ${accountEmail ? "" : "disabled"}">
            <input
              id="profile-avatar-input"
              type="file"
              accept="image/*"
              aria-label="${t("profile.chooseAvatarAria")}"
              ${accountEmail && !state.avatarUploading ? "" : "disabled"}
            />
            <span>${state.avatarUploading ? t("profile.uploading") : t("profile.chooseAvatar")}</span>
          </label>
        </div>
        <div class="profile-account">
          <p class="caption">${t("profile.account")}</p>
          <h2 class="section-title">${escapeHtml(displayName)}</h2>
          <p class="muted">${accountEmail ? escapeHtml(accountEmail) : t("profile.guestDetail")}</p>
        </div>
        <span class="step-state profile-status">${cloudStatusLabel()}</span>
      </div>
      <div class="metric-grid profile-account-metrics" aria-label="${t("profile.overview")}">
        <div class="metric"><strong>${streakDays}</strong><span>${t("profile.streak")}</span></div>
        <div class="metric"><strong>${reviewCount}</strong><span>${t("profile.reviewToday")}</span></div>
        <div class="metric"><strong>${progress.completed} / ${progress.total}</strong><span>${t("profile.totalProgress")}</span></div>
      </div>
      <div class="profile-progress-row">
        <span>${t("profile.status")}</span>
        <strong>${progress.percent}%</strong>
      </div>
      <div class="progress-track" aria-hidden="true">
        <div class="progress-fill" style="--value: ${progress.percent}%"></div>
      </div>
      <p class="caption">${accountEmail ? t("profile.cloudSync") : t("profile.cloudPrompt")}</p>
    </article>
  `;
}

function renderProfileMemoryCard(reviewCount) {
  const hasReview = reviewCount > 0;
  return `
    <article class="card profile-memory-card">
      <div class="section-row">
        <div>
          <p class="caption">${t("profile.memory")}</p>
          <h2 class="section-title">${hasReview ? t("profile.reviewHeading") : t("profile.foundationHeading")}</h2>
        </div>
        <span class="step-state">${t("profile.reviewCount", { count: reviewCount })}</span>
      </div>
      <p class="muted">${hasReview ? t("profile.reviewDetail") : t("profile.foundationDetail")}</p>
      <button
        class="primary-button"
        data-action="${hasReview ? "open-practice-group" : "go"}"
        data-id="${hasReview ? "review-loop" : ""}"
        data-target="${hasReview ? "" : "library"}"
        type="button"
      >
        ${hasReview ? t("profile.startReview") : t("profile.goAlphabet")}
      </button>
    </article>
  `;
}

function renderSegmentedSetting({ label, detail, action, value, options }) {
  return `
    <div class="profile-setting-block">
      <div>
        <strong>${label}</strong>
        <small>${detail}</small>
      </div>
      <div class="setting-segments" role="group" aria-label="${label}">
        ${options
          .map(
            (option) => `
              <button
                class="setting-segment ${String(value) === String(option.value) ? "active" : ""}"
                data-action="${action}"
                data-value="${option.value}"
                aria-pressed="${String(value) === String(option.value)}"
                type="button"
              >${option.label}</button>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderToggleSetting({ label, detail, action, checked }) {
  return `
    <button class="profile-setting-block setting-toggle-row" data-action="${action}" type="button" aria-pressed="${checked}">
      <span><strong>${label}</strong><small>${detail}</small></span>
      <span class="setting-switch ${checked ? "active" : ""}" aria-hidden="true"><i></i></span>
    </button>
  `;
}

function renderSettingsPanel() {
  const preferences = state.preferences;
  const accountEmail = cloudAccountEmail();
  const accountProfile = cloudAccountProfile();

  return `
    <article class="card profile-settings-card">
      <div>
        <p class="caption">${t("settings.title")}</p>
        <h2 class="section-title" id="learning-preferences-title">${t("settings.learning")}</h2>
      </div>

      <section class="profile-setting-group" aria-labelledby="learning-preferences-title">
        <div class="profile-setting-block language-setting">
          <strong>${t("language.label")}</strong>
          ${languageSwitcher()}
        </div>
        ${renderToggleSetting({
          label: t("settings.reminder"),
          detail: t("settings.reminderDetail"),
          action: "toggle-learning-reminder",
          checked: preferences.learningReminder
        })}
        ${renderToggleSetting({
          label: t("settings.showLatin"),
          detail: t("settings.showLatinDetail"),
          action: "toggle-latin-transliteration",
          checked: preferences.showLatin
        })}
      </section>

      <section class="profile-setting-group" aria-labelledby="audio-preferences-title">
        <h3 id="audio-preferences-title">${t("settings.audio")}</h3>
        ${renderToggleSetting({
          label: t("settings.autoplay"),
          detail: t("settings.autoplayDetail"),
          action: "toggle-audio-autoplay",
          checked: preferences.audioAutoplay
        })}
      </section>

      <section class="profile-setting-group" aria-labelledby="account-settings-title">
        <h3 id="account-settings-title">${t("settings.account")}</h3>
        <div class="profile-setting-block profile-account-setting">
          <div>
            <strong>${t("settings.currentAccount")}</strong>
            <small>${accountEmail ? escapeHtml(accountEmail) : t("settings.localAccount")}</small>
          </div>
          <span class="step-state">${cloudStatusLabel()}</span>
        </div>
        ${
          accountEmail
            ? `
              <div class="profile-name-editor">
                <label class="auth-field" for="profile-display-name">
                  <span>${t("settings.learningName")}</span>
                  <input
                    id="profile-display-name"
                    type="text"
                    maxlength="40"
                    autocomplete="name"
                    value="${escapeHtml(accountProfile.displayName || t("profile.learner"))}"
                  />
                </label>
                <button class="secondary-button" data-action="save-display-name" type="button">${t("settings.saveName")}</button>
              </div>
            `
            : ""
        }
        ${renderCloudAuthControls()}
        ${
          state.clearLearningConfirmation
            ? `
              <div class="clear-learning-confirmation" role="alert">
                <strong>${t("settings.clearTitle")}</strong>
                <p>${t("settings.clearDetail")}</p>
                <div class="action-grid">
                  <button class="secondary-button" data-action="cancel-clear-learning" type="button">${t("common.cancel")}</button>
                  <button class="danger-button" data-action="confirm-clear-learning" type="button">${t("settings.clearConfirm")}</button>
                </div>
              </div>
            `
            : `
              <button class="danger-button" data-action="request-clear-learning" type="button">
                ${t("settings.clear")}
              </button>
            `
        }
      </section>
    </article>
  `;
}

function renderProfile() {
  const progress = totalLearningProgress();
  const reviewCount = state.mistakes.length;

  return screen(
    `
      ${topBar(t("profile.title"), t("profile.subtitle"))}
      <section class="stack wide-gap profile-layout">
        ${renderProfileHero(progress, reviewCount)}
        ${renderSettingsPanel()}
      </section>
    `,
    "profile"
  );
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function playAudio(src, label, { autoplay = false } = {}) {
  if (!src) {
    if (!autoplay) {
      showToast(t("audio.unavailable"));
    }
    return false;
  }

  if (activeAudio && typeof activeAudio.pause === "function") {
    activeAudio.pause();
  }
  activeAudio = new Audio(src);
  activeAudio
    .play()
    .then(() => {
      if (!autoplay) {
        showToast(t("audio.playing", { label: label || t("common.content") }));
      }
    })
    .catch(() => {
      if (!autoplay) {
        showToast(t("audio.fileError"));
      }
    });
  return true;
}

function goTo(target) {
  state.screen = target;
  render();
}

const authRedirectStorageKey = "ana-tilim-auth-redirect";

function setAuthRedirectPending(pending) {
  try {
    if (!window.sessionStorage) return;
    if (pending) {
      window.sessionStorage.setItem(authRedirectStorageKey, "1");
    } else {
      window.sessionStorage.removeItem(authRedirectStorageKey);
    }
  } catch {
    // Continue without the one-time redirect hint when session storage is unavailable.
  }
}

function authRedirectPending() {
  try {
    return window.sessionStorage?.getItem(authRedirectStorageKey) === "1";
  } catch {
    return false;
  }
}

function handleCloudStatus(nextStatus) {
  const previousPhase = cloudStatus.phase;
  cloudStatus = nextStatus;
  const completedOAuthRedirect =
    nextStatus.phase === "signed-in" && authRedirectPending();
  const completedEmailVerification =
    previousPhase === "verifying-code" && nextStatus.phase === "signed-in";
  if (completedOAuthRedirect || completedEmailVerification) {
    setAuthRedirectPending(false);
    state.screen = "home";
    state.emailAuthExpanded = false;
    state.emailCodeSent = false;
    state.authEmail = "";
  }
  render();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.action;

  if (action === "set-language") {
    const language = button.dataset.language;
    if (language !== "zh" && language !== "en") {
      return;
    }
    applyInterfaceLanguage(language, { explicit: true });
    render();
    showToast(t("language.changed"));
    return;
  }

  if (action === "toggle-learning-reminder") {
    setPreference("learningReminder", !state.preferences.learningReminder);
    render();
    showToast(t(state.preferences.learningReminder ? "toast.reminderOn" : "toast.reminderOff"));
    return;
  }

  if (action === "toggle-latin-transliteration") {
    setPreference("showLatin", !state.preferences.showLatin);
    render();
    showToast(t(state.preferences.showLatin ? "toast.latinOn" : "toast.latinOff"));
    return;
  }

  if (action === "toggle-audio-autoplay") {
    setPreference("audioAutoplay", !state.preferences.audioAutoplay);
    render();
    showToast(t(state.preferences.audioAutoplay ? "toast.autoplayOn" : "toast.autoplayOff"));
    return;
  }

  if (action === "request-clear-learning") {
    state.clearLearningConfirmation = true;
    render();
    return;
  }

  if (action === "cancel-clear-learning") {
    state.clearLearningConfirmation = false;
    render();
    return;
  }

  if (action === "confirm-clear-learning") {
    const previousRecords = learningRecordSnapshot();
    clearLearningRecords();
    if (!saveLocalProgress()) {
      restoreLearningRecordSnapshot(previousRecords);
      state.clearLearningConfirmation = false;
      render();
      showToast(t("error.storage"));
      return;
    }
    render();
    showToast(t("toast.recordsCleared"));
    return;
  }

  if (action === "continue-local") {
    state.screen = "home";
    saveLocalProgress();
    render();
    showToast(t("toast.localMode"));
    return;
  }

  if (action === "show-email-login") {
    state.emailAuthExpanded = !state.emailAuthExpanded;
    render();
    return;
  }

  if (action === "switch-auth-mode") {
    const email = document.querySelector("#password-auth-email")?.value?.trim() || "";
    if (email) state.authEmail = email;
    state.authMode = button.dataset.mode === "register" ? "register" : "login";
    state.emailAuthExpanded = false;
    render();
    return;
  }

  if (action === "password-login") {
    const validation = validatePasswordAuthFields({
      mode: "login",
      email: document.querySelector("#password-auth-email")?.value || "",
      password: document.querySelector("#password-auth-password")?.value || ""
    });
    if (!validation.ok) {
      showToast(validation.message);
      return;
    }
    state.authEmail = validation.values.email;
    cloudSync
      ?.signInWithPassword(validation.values.email, validation.values.password)
      .then(() => {
        state.screen = "home";
        state.authEmail = "";
        render();
        showToast(t("toast.loginSuccess"));
      })
      .catch((error) => showToast(passwordAuthErrorMessage(error, "login")));
    return;
  }

  if (action === "password-register") {
    const validation = validatePasswordAuthFields({
      mode: "register",
      displayName: document.querySelector("#password-auth-name")?.value || "",
      email: document.querySelector("#password-auth-email")?.value || "",
      password: document.querySelector("#password-auth-password")?.value || "",
      confirmPassword: document.querySelector("#password-auth-confirm")?.value || ""
    });
    if (!validation.ok) {
      showToast(validation.message);
      return;
    }
    const backup = backupGuestProgress();
    if (!backup.ok) {
      showToast(t("toast.guestBackupError"));
      return;
    }
    state.authEmail = validation.values.email;
    cloudSync
      ?.signUpWithPassword(
        validation.values.email,
        validation.values.password,
        validation.values.displayName
      )
      .then((data) => {
        if (!data?.session) throw new Error("注册未完成");
        initializeNewLearnerProgress();
        cloudSync.scheduleSync(buildCloudSnapshot());
        state.screen = "home";
        state.authMode = "login";
        state.authEmail = "";
        render();
        showToast(t("toast.registerSuccess"));
      })
      .catch((error) => {
        restoreGuestProgressBackup(backup.previousValue);
        showToast(passwordAuthErrorMessage(error, "register"));
      });
    return;
  }

  if (action === "cloud-google-login") {
    const redirectTo = window.location?.origin
      ? `${window.location.origin}${window.location.pathname}`
      : "";
    setAuthRedirectPending(true);
    cloudSync
      ?.signInWithGoogle(redirectTo)
      .catch(() => {
        setAuthRedirectPending(false);
        showToast(t("toast.googleError"));
      });
    return;
  }

  if (action === "request-email-otp") {
    const email = document.querySelector("#auth-email")?.value?.trim() || "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast(t("auth.invalidEmail"));
      return;
    }
    state.authEmail = email;
    cloudSync
      ?.requestEmailOtp(email)
      .then(() => {
        state.emailCodeSent = true;
        render();
        showToast(t("toast.codeSent"));
      })
      .catch(() => showToast(t("toast.codeError")));
    return;
  }

  if (action === "verify-email-otp") {
    const code = document.querySelector("#auth-code")?.value?.trim() || "";
    if (!/^\d{6}$/.test(code)) {
      showToast(t("toast.invalidCode"));
      return;
    }
    cloudSync
      ?.verifyEmailOtp(state.authEmail, code)
      .then(() => {
        state.emailCodeSent = false;
        state.emailAuthExpanded = false;
        render();
        showToast(t("toast.loginSuccess"));
      })
      .catch(() => showToast(t("toast.expiredCode")));
    return;
  }

  if (action === "cloud-sign-out") {
    cloudSync
      ?.signOut()
      .then(() => {
        render();
        showToast(t("toast.signedOut"));
      })
      .catch(() => showToast(t("toast.signOutError")));
    return;
  }

  if (action === "save-display-name") {
    const validation = validateDisplayName(
      document.querySelector("#profile-display-name")?.value || ""
    );
    if (!validation.ok) {
      showToast(validation.message);
      return;
    }
    cloudSync
      ?.updateDisplayName(validation.value)
      .then(() => {
        render();
        showToast(t("toast.nameUpdated"));
      })
      .catch(() => showToast(t("toast.nameError")));
    return;
  }

  if (action === "go") {
    const target = button.dataset.target;

    if (state.screen === "group" && ["letterWriting", "picture", "listening", "keyboard"].includes(target)) {
      markCurrentLetterViewed();
    }

    if (state.screen === "letterWriting" && target === "picture") {
      markCurrentLetterViewed();
      markProgress("letters", state.selectedGroupId, "writing");
    }

    if (state.screen === "keyboard" && target === "complete") {
      markCurrentLetterViewed();
      markCurrentLetterKeyboardIfCorrect();
    }

    if (state.screen === "comboKeyboard" && target === "comboComplete" && state.keyboardValue === currentComboItem().value) {
      markProgress("combos", state.selectedComboGroupId, "keyboard");
    }

    if (state.screen === "comboWriting" && target === "comboKeyboard") {
      markProgress("combos", state.selectedComboGroupId, "writing");
    }

    if (state.screen === "vocabKeyboard" && target === "vocabComplete" && state.keyboardValue === currentVocabItem().value) {
      markProgress("vocab", state.selectedVocabGroupId, "keyboard");
    }

    if (state.screen === "practiceSession" && target === "practiceComplete") {
      const group = currentPracticeGroup();
      const item = currentPracticeItem();
      const completedPractice =
        group.mode === "review" ||
        (group.mode === "listen" && state.selectedListening === item.id) ||
        (group.mode === "repeat" && state.practiceSpoken) ||
        group.mode === "write" ||
        (group.mode === "keyboard" && state.keyboardValue === item.value);

      if (completedPractice) {
        markProgress("practice", state.selectedPracticeGroupId, group.mode);
      }
    }

    if (target === "combo") {
      state.selectedUnitId = unitIdForComboGroup(state.selectedComboGroupId);
    }
    if (target === "vocab") {
      state.selectedUnitId = "basic-phrases";
    }
    if (["picture", "listening", "keyboard", "letterOdd", "letterSound", "comboRecognition", "comboBuild", "comboWriting", "comboKeyboard", "vocabRecognition", "vocabKeyboard", "letterWriting"].includes(target)) {
      resetPracticeState();
    }
    goTo(target);
    return;
  }

  if (action === "open-unit") {
    state.selectedUnitId = button.dataset.id;
    const unit = learningUnits.find((item) => item.id === button.dataset.id);
    if (unit?.kind === "reading") {
      state.selectedReadingUnitId = unit.id;
      state.selectedReadingGroupId = unit.groups[0]?.id || state.selectedReadingGroupId;
    }
    goTo("unit");
    return;
  }

  if (action === "open-group") {
    const group = alphabetGroups.find((item) => item.id === button.dataset.id) || alphabetGroups[0];
    state.selectedUnitId = "letters";
    state.selectedGroupId = group.id;
    state.currentLetterId = group.letters[0].id;
    resetPracticeState();
    goTo("group");
    return;
  }

  if (action === "open-combo-group") {
    const group = comboGroups.find((item) => item.id === button.dataset.id) || comboGroups[0];
    state.selectedUnitId = unitIdForComboGroup(group.id);
    state.selectedComboGroupId = group.id;
    state.currentComboItemId = group.items[0].id;
    markProgress("combos", group.id, "viewed");
    resetComboPracticeState();
    goTo("combo");
    return;
  }

  if (action === "open-vocab-group") {
    const group = vocabGroups.find((item) => item.id === button.dataset.id) || vocabGroups[0];
    state.selectedUnitId = "basic-phrases";
    state.selectedVocabGroupId = group.id;
    state.currentVocabItemId = group.items[0].id;
    markProgress("vocab", group.id, "viewed");
    resetVocabPracticeState();
    goTo("vocab");
    return;
  }

  if (action === "open-practice-group") {
    const group = practiceGroups.find((item) => item.id === button.dataset.id) || practiceGroups[0];
    const reviewItems = group.mode === "review" ? mistakeReviewItems() : [];
    state.selectedUnitId = "practice";
    state.selectedPracticeGroupId = group.id;
    state.currentPracticeItemId =
      group.mode === "review"
        ? reviewItems[0]?.id || ""
        : group.mode === "listen"
          ? randomPracticeListeningItem(group)?.id || ""
          : group.items[0].id;
    if (group.mode !== "review") {
      markProgress("practice", group.id, "viewed");
    }
    resetPracticeSessionState();
    goTo("practiceSession");
    return;
  }

  if (action === "open-reading-group") {
    const unit = readingUnits.find((item) => item.id === button.dataset.unitId) || readingUnitForGroup(button.dataset.id);
    const group = unit.groups.find((item) => item.id === button.dataset.id) || unit.groups[0];
    state.selectedUnitId = unit.id;
    state.selectedReadingUnitId = unit.id;
    state.selectedReadingGroupId = group.id;
    markProgress("reading", group.id, "viewed");
    goTo("reading");
    return;
  }

  if (action === "pick-picture") {
    state.selectedPicture = button.dataset.id;
    const target = currentLetter();
    const picked = currentGroupLetters().find((choice) => choice.id === button.dataset.id);
    if (picked && picked.id === target.id) {
      markCurrentLetterRecognition();
    } else if (picked) {
      recordLetterMistake("letter", target, picked);
    }
    render();
    return;
  }

  if (action === "pick-listening") {
    state.selectedListening = button.dataset.id;
    const target = currentLetter();
    const picked = currentGroupLetters().find((choice) => choice.id === button.dataset.id);
    if (picked && picked.id === target.id) {
      markCurrentLetterRecognition();
    } else if (picked) {
      recordLetterMistake("letter", target, picked);
    }
    render();
    return;
  }

  if (action === "pick-letter-odd") {
    state.selectedPicture = button.dataset.id;
    const target = oddLetterForCurrent();
    const picked = currentGroupLetters().find((choice) => choice.id === button.dataset.id);
    if (picked && picked.id === target.id) {
      markCurrentLetterRecognition();
    } else if (picked) {
      recordLetterMistake("letter", target, picked);
    }
    render();
    return;
  }

  if (action === "pick-letter-sound") {
    state.selectedListening = button.dataset.id;
    const target = currentLetter();
    const picked = currentGroupLetters().find((choice) => choice.id === button.dataset.id);
    if (picked && picked.id === target.id) {
      markCurrentLetterRecognition();
    } else if (picked) {
      recordLetterMistake("letter", target, picked);
    }
    render();
    return;
  }

  if (action === "pick-combo") {
    state.selectedPicture = button.dataset.id;
    const target = currentComboItem();
    const picked = currentComboItems().find((choice) => choice.id === button.dataset.id);
    if (picked && picked.id === target.id) {
      markProgress("combos", state.selectedComboGroupId, "recognition");
    } else if (picked) {
      recordItemMistake("combo", target, picked, "第二单元错题");
    }
    render();
    return;
  }

  if (action === "pick-vocab") {
    state.selectedPicture = button.dataset.id;
    const target = currentVocabItem();
    const picked = currentVocabItems().find((choice) => choice.id === button.dataset.id);
    if (picked && picked.id === target.id) {
      markProgress("vocab", state.selectedVocabGroupId, "recognition");
    } else if (picked) {
      recordItemMistake("vocab", target, picked, "第三单元错题");
    }
    render();
    return;
  }

  if (action === "pick-practice") {
    state.selectedListening = button.dataset.id;
    const group = currentPracticeGroup();
    const target = currentPracticeItem();
    const picked = currentPracticeItems().find((choice) => choice.id === button.dataset.id);
    if (picked && picked.id === target.id) {
      if (group.mode === "listen") {
        markPracticeListeningItemComplete(group, target);
      } else {
        markProgress("practice", state.selectedPracticeGroupId, group.mode);
      }
    } else if (picked) {
      recordItemMistake("practice", target, picked, "练习中心错题");
    }
    render();
    return;
  }

  if (action === "next-practice-audio") {
    const group = currentPracticeGroup();
    if (group.mode === "listen") {
      selectRandomPracticeListeningItem(group);
    }
    render();
    return;
  }

  if (action === "build-part") {
    state.keyboardValue += button.dataset.key;
    const target = currentComboItem();
    if (state.keyboardValue === target.value) {
      markProgress("combos", state.selectedComboGroupId, "build");
    } else if (!target.value.startsWith(state.keyboardValue)) {
      recordItemMistake("combo", target, { id: "build", value: state.keyboardValue, latin: "拼接" }, "第二单元拼接错题");
    }
    render();
    return;
  }

  if (action === "select-letter") {
    const group = groupForLetter(button.dataset.id);
    if (group) {
      state.selectedGroupId = group.id;
    }
    state.currentLetterId = button.dataset.id;
    resetPracticeState();
    if (button.dataset.target) {
      state.screen = button.dataset.target;
    }
    render();
    return;
  }

  if (action === "select-adjacent-letter") {
    if (!button.dataset.id) {
      return;
    }
    const group = groupForLetter(button.dataset.id);
    if (group) {
      state.selectedGroupId = group.id;
    }
    state.currentLetterId = button.dataset.id;
    resetPracticeState();
    render();
    return;
  }

  if (action === "select-combo") {
    const group = comboGroupForItem(button.dataset.id);
    if (group) {
      state.selectedComboGroupId = group.id;
    }
    state.currentComboItemId = button.dataset.id;
    resetComboPracticeState();
    render();
    return;
  }

  if (action === "select-adjacent-combo") {
    if (!button.dataset.id) {
      return;
    }
    const group = comboGroupForItem(button.dataset.id);
    if (group) {
      state.selectedComboGroupId = group.id;
    }
    state.currentComboItemId = button.dataset.id;
    resetComboPracticeState();
    render();
    return;
  }

  if (action === "select-vocab") {
    const group = vocabGroupForItem(button.dataset.id);
    if (group) {
      state.selectedVocabGroupId = group.id;
    }
    state.currentVocabItemId = button.dataset.id;
    resetVocabPracticeState();
    render();
    return;
  }

  if (action === "select-adjacent-vocab") {
    if (!button.dataset.id) {
      return;
    }
    const group = vocabGroupForItem(button.dataset.id);
    if (group) {
      state.selectedVocabGroupId = group.id;
    }
    state.currentVocabItemId = button.dataset.id;
    resetVocabPracticeState();
    render();
    return;
  }

  if (action === "select-practice") {
    const group = practiceGroupForItem(button.dataset.id);
    if (group) {
      state.selectedPracticeGroupId = group.id;
    }
    state.currentPracticeItemId = button.dataset.id;
    resetPracticeSessionState();
    render();
    return;
  }

  if (action === "mark-repeat") {
    state.practiceSpoken = true;
    markProgress("practice", state.selectedPracticeGroupId, "repeat");
    render();
    return;
  }

  if (action === "key") {
    const previousKeyboardValue = state.keyboardValue;
    state.keyboardValue += button.dataset.key;
    markCurrentLetterKeyboardIfCorrect();
    if (state.screen === "comboKeyboard" && state.keyboardValue === currentComboItem().value) {
      markProgress("combos", state.selectedComboGroupId, "keyboard");
    }
    if (state.screen === "vocabKeyboard" && state.keyboardValue === currentVocabItem().value) {
      markProgress("vocab", state.selectedVocabGroupId, "keyboard");
    }
    if (state.screen === "practiceSession" && currentPracticeGroup().mode === "keyboard") {
      const target = currentPracticeItem();
      if (state.keyboardValue === target.value) {
        markProgress("practice", state.selectedPracticeGroupId, "keyboard");
      } else if (!previousKeyboardValue) {
        recordItemMistake(
          "practice",
          target,
          { id: `key-${button.dataset.key}`, value: button.dataset.key, latin: "键盘" },
          "练习中心错题"
        );
      }
    }
    render();
    return;
  }

  if (action === "backspace") {
    state.keyboardValue = state.keyboardValue.slice(0, -1);
    render();
    return;
  }

  if (action === "clear-input") {
    state.keyboardValue = "";
    render();
    return;
  }

  if (action === "clear-canvas") {
    clearWritingCanvases();
    return;
  }

  if (action === "toggle-guide") {
    state.showGuide = !state.showGuide;
    render();
    return;
  }

  if (action === "toggle-writing-check") {
    const checkId = button.dataset.id;
    if (state.writingChecks.includes(checkId)) {
      state.writingChecks = state.writingChecks.filter((item) => item !== checkId);
    } else {
      state.writingChecks = [...state.writingChecks, checkId].slice(0, writingCheckOptions.length);
    }
    if (
      state.screen === "practiceSession" &&
      currentPracticeGroup().mode === "write" &&
      writingCheckOptions.every((item) => state.writingChecks.includes(item.id))
    ) {
      markProgress("practice", state.selectedPracticeGroupId, "write");
    }
    render();
    return;
  }

  if (action === "toggle-favorite") {
    state.favorite = !state.favorite;
    markCloudDirty("favorite");
    render();
    showToast(t(state.favorite ? "toast.favoriteOn" : "toast.favoriteOff"));
    return;
  }

  if (action === "play-audio") {
    const audioStarted = playAudio(button.dataset.audioSrc, button.dataset.audioLabel);
    if (audioStarted && state.screen === "practiceSession" && currentPracticeGroup().mode === "listen") {
      state.practiceAudioPlayed = true;
      render();
    }
    return;
  }

  if (action === "toast") {
    showToast(t("toast.comingSoon"));
  }
});

document.addEventListener("change", (event) => {
  const input = event.target;
  if (input?.id !== "profile-avatar-input") return;

  const file = input.files?.[0];
  if (!file) return;
  if (!cloudAccountEmail()) {
    showToast(t("toast.avatarLogin"));
    return;
  }
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
    showToast(t("toast.avatarType"));
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast(t("toast.avatarSize"));
    return;
  }

  state.avatarUploading = true;
  render();
  cloudSync
    ?.uploadAvatar(file)
    .then(() => {
      state.avatarUploading = false;
      render();
      showToast(t("toast.avatarUpdated"));
    })
    .catch(() => {
      state.avatarUploading = false;
      render();
      showToast(t("error.avatar"));
    });
});

function initializeCloudAuthentication() {
  const cloudApi = window.ANA_TILIM_CLOUD;
  const config = window.ANA_TILIM_CLOUD_CONFIG || {};
  if (!cloudApi?.createCloudSync) {
    cloudStatus = { phase: "local", error: "" };
    return;
  }

  let supabaseClient = null;
  if (
    config.supabaseUrl &&
    config.supabasePublishableKey &&
    typeof window.supabase?.createClient === "function"
  ) {
    supabaseClient = window.supabase.createClient(
      config.supabaseUrl,
      config.supabasePublishableKey
    );
  }

  cloudSync = cloudApi.createCloudSync({
    supabaseClient,
    getLocalSnapshot: buildCloudSnapshot,
    applyMergedSnapshot: applyCloudSnapshot,
    saveMergedSnapshot() {
      saveLocalProgress();
    },
    onStatus(nextStatus) {
      handleCloudStatus(nextStatus);
    }
  });
  cloudStatus = cloudSync.status();
  cloudSync.start().catch(() => {
    cloudStatus = { phase: "error", error: t("error.cloud") };
    render();
  });
  if (typeof window.addEventListener === "function") {
    window.addEventListener("online", () => {
      cloudSync.handleOnline().catch(() => {});
    });
  }
}

initializeCloudAuthentication();
render();
