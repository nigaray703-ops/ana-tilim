const courseData = window.ANA_TILIM_COURSE;

if (!courseData) {
  throw new Error("Ana Tilim course data failed to load.");
}

const { alphabetLetters, letterDetails, alphabetGroups, alphabetAudioItems, comboGroups, vocabGroups, practiceGroups, readingUnits } = courseData;

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
    statusLabel: "真人音频",
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
    statusLabel: "真人音频",
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

const formExampleItems = buildFormExampleItems();
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
        latin: item.latin || "未提供转写",
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
    title: "第一单元：认识字母",
    subtitle: "32 个字母，相似分组",
    description: "先按截图顺序认识全部字母，学习时把看起来相似、容易混的字母放在一组。",
    bullets: ["认识字母形状", "区分点位和点数", "看四种形态", "练单字母键盘输入"],
    groups: alphabetGroups,
    actionTarget: "letter"
  },
  {
    id: "combos",
    title: "第二单元：基础组合",
    subtitle: "基础组合、三字母连接和断开规则",
    description: "先做两字母组合，再加入三字母和断开连接例子，比较同一个字母在词里的形态变化。",
    bullets: ["开口组合", "轻声组合", "三字母连接", "断开规则", "拆开再合上"],
    groups: basicComboGroups,
    actionTarget: "combo"
  },
  {
    id: "basic-phrases",
    title: "第三单元：日常用语与词汇",
    subtitle: "问候、人称代词、称呼、数字、动物等",
    description: "选择一个常用主题，点进去再一行一行学习词形。",
    bullets: ["主题小课", "一行一词", "词形辨认", "键盘输入"],
    groups: vocabGroups,
    actionTarget: "vocab"
  },
  ...readingUnits.map((unit) => ({
    ...unit,
    actionTarget: "reading"
  }))
];

const unitExperience = {
  letters: {
    recommended: "先复习第一单元字母分组，再进入组合。",
    steps: ["认识相似字母组", "看四种写法", "做辨认、听音、键盘", "完成后进入组合"],
    reviewLabel: "复习本组",
    reviewTarget: "group",
    nextLabel: "进入第二单元",
    nextUnitId: "combos"
  },
  combos: {
    recommended: "先练两字母组合，再看三字母连接和断开规则，从右往左拆分再合上。",
    steps: ["看两字母组合", "看三字母连接", "找断开字母", "做组合辨认和键盘输入"],
    reviewLabel: "复习组合",
    reviewTarget: "combo",
    nextLabel: "进入第三单元",
    nextUnitId: "basic-phrases"
  },
  "basic-phrases": {
    recommended: "按主题小课学日常用语和词汇，一行一行看词形。",
    steps: ["选择主题小课", "一行一行看词", "做词形辨认", "完成键盘输入"],
    reviewLabel: "复习主题词",
    reviewTarget: "vocab",
    nextLabel: "进入第四单元",
    nextUnitId: "grammar-basics"
  },
  "grammar-basics": {
    recommended: "先看最基础的语法规则，再读例句。",
    steps: ["选择语法点", "看句型模式", "读维语例句", "看中文说明"],
    reviewLabel: "复习语法",
    reviewTarget: "reading",
    nextLabel: "进入第五单元",
    nextUnitId: "sentence-patterns"
  },
  "sentence-patterns": {
    recommended: "把第三单元学过的常用词放进短句里。",
    steps: ["选择句型", "一行一行读短句", "看中文翻译"],
    reviewLabel: "复习句型",
    reviewTarget: "reading",
    nextLabel: "进入第六单元",
    nextUnitId: "dialogue-theater"
  },
  "dialogue-theater": {
    recommended: "读很短的双人日常对话。",
    steps: ["选择对话", "一句一句读", "看中文翻译"],
    reviewLabel: "复习对话",
    reviewTarget: "reading",
    nextLabel: "进入第七单元",
    nextUnitId: "short-stories"
  },
  "short-stories": {
    recommended: "读很短的小故事。",
    steps: ["选择故事", "一句一句读", "看中文翻译"],
    reviewLabel: "复习故事",
    reviewTarget: "reading",
    nextLabel: "进入第八单元",
    nextUnitId: "famous-quotes"
  },
  "famous-quotes": {
    recommended: "阅读名人短句，先理解句意，再听真人发音。",
    steps: ["选择人物", "读短句", "看中文翻译"],
    reviewLabel: "复习名言",
    reviewTarget: "reading",
    nextLabel: "进入第九单元",
    nextUnitId: "uyghur-proverbs"
  },
  "uyghur-proverbs": {
    recommended: "阅读常见谚语，先理解句意，再跟读真人发音。",
    steps: ["选择谚语", "读原文", "看中文翻译"],
    reviewLabel: "复习谚语",
    reviewTarget: "reading",
    nextLabel: "回到学习路径",
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
const i18n = window.ANA_TILIM_I18N;
const serializedProgress = window.localStorage?.getItem("ana-tilim-progress") || "";
const savedLanguage = i18n.readSavedLanguage(serializedProgress);
const systemLanguages = window.navigator?.languages || [window.navigator?.language].filter(Boolean);
const initialInterfaceLanguage = i18n.resolveLanguage(savedLanguage, systemLanguages);
i18n.setLanguage(initialInterfaceLanguage);
document.documentElement.lang = initialInterfaceLanguage;
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
  favorite: false,
  preferences: { ...DEFAULT_PREFERENCES },
  dailyActivity: { date: "", completedIds: [] },
  clearLearningConfirmation: false,
  modifiedAt: initialCloudTimestamp,
  preferencesUpdatedAt: initialCloudTimestamp,
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
  const effectiveLanguage = i18n.resolveLanguage(language, systemLanguages);
  state.interfaceLanguage = effectiveLanguage;
  i18n.setLanguage(effectiveLanguage);
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
  return "第二单元";
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
      categoryTitle: "字母",
      unit: "第一单元",
      groupTitle: groupForLetter(letter.id)?.title || "认识字母",
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
      categoryTitle: "例词",
      unit: "第一单元",
      groupTitle: "写法例词",
      value: item.value,
      latin: item.latin || "未提供转写",
      kind: item.meaning || "写法例词",
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
      categoryTitle: "组合",
      unit: unitNameForComboGroup(comboGroupForItem(item.id)?.id),
      groupTitle: comboGroupForItem(item.id)?.title || "组合与词组",
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
      categoryTitle: "词汇",
      unit: "第三单元",
      groupTitle: vocabGroupForItem(item.id)?.title || "日常词汇",
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
          categoryTitle: "句子",
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
    { id: "alphabet", title: "字母", items: alphabetAudioCoverageTargets() },
    { id: "form-example", title: "例词", items: formExampleAudioCoverageTargets() },
    { id: "combo", title: "组合", items: comboAudioCoverageTargets() },
    { id: "vocab", title: "词汇", items: vocabAudioCoverageTargets() },
    { id: "reading", title: "句子", items: readingAudioCoverageTargets() }
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
    { unit: "第一单元", label: "字母学习", completed: countCompleted("letters"), total: alphabetGroups.length },
    { unit: "第二单元", label: "基础组合", completed: countCompletedForIds("combos", basicComboIds), total: basicComboIds.length },
    { unit: "第三单元", label: "主题词汇", completed: countCompleted("vocab"), total: vocabGroups.length }
  ];

  const readingSummaries = readingUnits.map((unit) => {
    const [unitName, label = unit.title] = unit.title.split("：");
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
  return hasLearningActivity(scope, id)
    ? '<span class="learned-marker" aria-label="已学习">✓ 已学</span>'
    : "";
}

function renderLearningMap(summaries) {
  return `
    <article class="card learning-map-card">
      <div class="section-row">
        <div>
          <p class="caption">学习地图</p>
          <h2 class="section-title">按单元一步一步往前走</h2>
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
  return state.mistakes.map((mistake) => ({
    id: `mistake-${mistake.key}`,
    type: mistake.kindLabel,
    value: mistake.value,
    latin: mistake.latin,
    label: mistake.source,
    hint: `${mistake.note} ${mistake.help || ""} 错 ${mistake.attempts} 次。`,
    parts: [mistake.value],
    audio: audioForMistake(mistake),
    audioStatus: "复习错题"
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
    return `目标是 ${displayStandaloneLetterGlyph(target.letter)}，线索是 ${target.cue}。`;
  }

  return `目标是 ${displayStandaloneLetterGlyph(target.letter)}：${target.cue}；你选了 ${displayStandaloneLetterGlyph(picked.letter)}：${picked.cue}。先看点在上方还是下方，再看点数。`;
}

function oddLetterForCurrent() {
  const choices = currentGroupLetters();
  const index = Math.max(0, choices.findIndex((choice) => choice.id === currentLetter().id));

  return choices[index + 1] || choices[index - 1] || choices[0];
}

function itemMistakeFeedback(target, picked, label = "词形") {
  if (!picked) {
    return `目标${label}是 ${target.value}，先看 ${target.latin} 的转写提示。`;
  }

  return `目标${label}是 ${target.value}，你选了 ${picked.value}。先对照转写：${target.latin}。`;
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
    ? "已完成"
    : guide.isOffTrack
      ? "先删除错误部分"
      : `第 ${guide.completeCount + 1} 步：点击 ${guide.nextPart}`;
  const inputText = guide.currentValue ? `已输入 ${guide.currentValue}` : "已输入 未输入";
  const countText = guide.isComplete ? "已完成" : `还差 ${guide.remainingCount} 键`;

  return `
    <article class="card keyboard-guide-card">
      <div class="section-row">
        <div>
          <p class="caption">键盘步骤</p>
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
  { id: "shape", label: "主体稳定" },
  { id: "dots", label: "点位正确" },
  { id: "spacing", label: "连接清楚" }
];

function renderWritingCoach({ value, parts, hint, mode = "letter" }) {
  const partText = parts && parts.length > 1 ? parts.join(" → ") : value;
  const startText = mode === "letter" ? "先看主体轮廓，再决定点的位置。" : `拆分描摹：${partText}`;

  return `
    <article class="card writing-coach-card">
      <p class="caption">书写步骤</p>
      <div class="lesson-point-list">
        <div class="lesson-point"><strong>起笔</strong><span>${startText}</span></div>
        <div class="lesson-point"><strong>方向</strong><span>从右往左写，先主体后点位，最后检查连接。</span></div>
        <div class="lesson-point"><strong>自查</strong><span>${hint}</span></div>
      </div>
    </article>
  `;
}

function renderWritingComparison({ value, parts, forms = [] }) {
  const comparisonItems = forms.length
    ? forms.map((form) => ({ label: form.label, value: form.value }))
    : [
        { label: "整体", value },
        ...(parts || []).map((part, index) => ({ label: `部分 ${index + 1}`, value: part }))
      ];

  return `
    <article class="card writing-comparison-card">
      <div class="section-row">
        <div>
          <p class="caption">对比正确写法</p>
          <h2 class="section-title"><span class="uyghur">${displayStandaloneLetterGlyph(value)}</span></h2>
        </div>
        <span class="step-state">${comparisonItems.length} 项</span>
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

function renderWritingCanvas(value, label = "手写板") {
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
          <p class="caption">完成后评价</p>
          <h2 class="section-title">自查完成 ${checkedCount} / ${writingCheckOptions.length}</h2>
        </div>
        <span class="step-state">${checkedCount === writingCheckOptions.length ? "完成" : "自查"}</span>
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
                ${item.label}
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
    <div class="step-list" aria-label="学习步骤">
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
      aria-label="播放发音"
    >听</button>
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
      aria-label="播放 ${value}"
    >${value}</button>
  `;
}

function renderAudioFocus({ audio, label, title, hint, hideFile = false, hideCaption = false, className = "" }) {
  const canPlay = isAudioPlayable(audio);
  const audioInfo = canPlay ? (hideFile ? `${audio.statusLabel}。` : `${audio.statusLabel}：${audio.file}。`) : "";
  const caption = hideCaption ? "" : canPlay ? `${audioInfo}${hint}` : "音频待录，暂不播放。";
  const classes = ["letter-focus", "audio-focus", className].filter(Boolean).join(" ");

  return `
    <div class="${classes}">
      ${renderAudioButton({ audio, label, className: "letter-focus-play" })}
      <div>
        <strong class="audio-focus-title">${canPlay ? title : "音频待录"}</strong>
        ${caption ? `<p class="caption">${caption}</p>` : ""}
      </div>
    </div>
  `;
}

function renderAdjacentNav({ previous, next, action, previousLabel = "上一个", nextLabel = "下一个" }) {
  return `
    <div class="adjacent-nav" aria-label="前后切换">
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

  return `
    <article class="card next-action-card">
      <p class="caption">下一步建议</p>
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

    let isDrawing = false;

    function pointFor(event) {
      const bounds = canvas.getBoundingClientRect();
      return {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
      };
    }

    canvas.addEventListener("pointerdown", (event) => {
      const point = pointFor(event);
      isDrawing = true;
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
      context.lineTo(point.x, point.y);
      context.stroke();
      event.preventDefault();
    });

    function finishDrawing(event) {
      if (!isDrawing) {
        return;
      }
      isDrawing = false;
      canvas.releasePointerCapture?.(event.pointerId);
      context.closePath();
    }

    canvas.addEventListener("pointerup", finishDrawing);
    canvas.addEventListener("pointercancel", finishDrawing);
    canvas.addEventListener("pointerleave", finishDrawing);
  });
}

function clearWritingCanvases() {
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
    ["home", "首页", iconHome()],
    ["library", "字母", iconLibrary()],
    ["learn", "学习", iconBook()],
    ["profile", "我的", iconUser()]
  ];

  return `
    <nav class="bottom-nav" aria-label="主导航">
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
    local: "本地模式",
    ready: "本地模式",
    "signing-in": "正在登录",
    registering: "正在注册",
    "sending-code": "正在发送验证码",
    "code-sent": "验证码已发送",
    "verifying-code": "正在验证",
    "uploading-avatar": "正在上传头像",
    "signed-in": "已登录",
    syncing: "正在同步",
    synced: "已同步",
    "waiting-network": "当前离线，等待同步",
    "sync-error": "同步失败，将自动重试",
    "update-required": "应用版本过旧，请先更新",
    error: "登录失败，请重试"
  };
  return labels[cloudStatus.phase] || "本地模式";
}

function renderCloudAuthControls() {
  const accountEmail = cloudAccountEmail();
  if (accountEmail) {
    return `
      <div class="cloud-account-summary">
        <strong>${escapeHtml(accountEmail)}</strong>
        <small>${cloudStatusLabel()}</small>
      </div>
      <button class="secondary-button" data-action="cloud-sign-out" type="button">退出登录</button>
    `;
  }

  return `
    <div class="cloud-account-summary">
      <strong>本地游客模式</strong>
      <small>无需登录即可学习，进度保存在当前设备。</small>
    </div>
    <div class="auth-actions">
      <button class="primary-button" data-action="cloud-google-login" type="button">
        使用 Google 登录
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
    return { ok: false, message: "请输入昵称" };
  }
  if (mode === "register" && normalizedName.length > 40) {
    return { ok: false, message: "昵称不能超过 40 个字符" };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false, message: "请输入有效的邮箱地址" };
  }
  if (password.length < 8) {
    return { ok: false, message: "密码至少需要 8 个字符" };
  }
  if (mode === "register" && password !== confirmPassword) {
    return { ok: false, message: "两次输入的密码不一致" };
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
  if (message.includes("invalid login credentials")) return "邮箱或密码不正确";
  if (message.includes("already registered") || message.includes("already been registered")) {
    return "这个邮箱已经注册";
  }
  if (message.includes("email not confirmed")) return "请先完成邮箱确认";
  if (message.includes("注册需要邮箱确认")) return "注册需要邮箱确认，请检查登录设置";
  return mode === "register" ? "注册失败，请稍后重试" : "登录失败，请稍后重试";
}

function validateDisplayName(value) {
  const name = String(value || "").trim();
  if (!name) return { ok: false, message: "请输入名称" };
  if (name.length > 40) return { ok: false, message: "名称不能超过 40 个字符" };
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
            从字母、发音、书写到键盘输入，一步一步学会自己的母语。
          </p>
          <button class="ghost-button" data-action="continue-local" type="button">
            无需登录，直接开始学习
          </button>
        </div>

        <article class="card auth-panel">
          <div>
            <p class="caption">登录后自动同步</p>
            <h2 class="section-title">${accountEmail ? "学习记录已同步" : "保存你的学习进度"}</h2>
            <p class="muted">${accountEmail ? `已登录 ${escapeHtml(accountEmail)}` : "换设备也能继续学习；不登录不会影响课程使用。"}</p>
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
    button: "继续学习",
    action: "open-unit",
    id: unit.id,
    target: ""
  };

  return screen(
    `
      ${topBar("早上好", "今天继续 8 分钟就很好")}

      <section class="stack wide-gap home-center">
        <article class="card today-progress-card">
          <div class="section-row">
            <div>
              <p class="caption">今日进度</p>
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
                <strong>今日学习提醒</strong>
                <span>还差 ${today.goal - today.completed} 个完成今日目标</span>
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
      ${topBar("学习单元", "先认识字母，再学连接、词汇、句型和阅读")}
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
  if (group.mode === "listen") return "听音选择";
  if (group.mode === "repeat") return "跟读确认";
  if (group.mode === "write") return "手写板";
  if (group.mode === "keyboard") return "键盘输入";
  return "错题回看";
}

function practiceTopicCount(group) {
  return group.mode === "review" ? state.mistakes.length : group.items.length;
}

function practiceHubTopicTitle(group) {
  if (group.mode === "listen") return "听音练习";
  if (group.mode === "repeat") return "跟读练习";
  if (group.mode === "write") return "书写";
  if (group.mode === "keyboard") return "键盘练习";
  return "错题复习";
}

function renderPracticeTopicCard(group, action = "open-practice-group") {
  const title = practiceHubTopicTitle(group);

  return `
    <button
      class="practice-topic-row"
      data-action="${action}"
      data-id="${group.id}"
      type="button"
      aria-label="进入${title}"
    >
      <span>
        <strong>${title}</strong>
        <small>${practiceTopicLabel(group)} · ${practiceTopicCount(group)} 项</small>
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
      aria-label="进入${group.title}"
    >
      <span>
        <strong>${group.title}</strong>
        <small>${group.items.length} 个词</small>
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
    return `${group.items.length} 个语法点`;
  }

  if (unit.readingKind === "sentence") {
    return `${group.items.length} 个句型`;
  }

  if (unit.readingKind === "quote" || unit.readingKind === "proverb") {
    return `${group.items.length} 条`;
  }
  return `${group.items.length} 句`;
}

function renderReadingTopicCard(unit, group) {
  return `
    <button
      class="reading-topic-row"
      data-action="open-reading-group"
      data-unit-id="${unit.id}"
      data-id="${group.id}"
      type="button"
      aria-label="进入${group.title}"
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
        `<button class="back-button" data-action="go" data-target="learn" type="button" aria-label="返回">←</button>`
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
        `<button class="back-button" data-action="go" data-target="learn" type="button" aria-label="返回">←</button>`
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
      ? `<button class="primary-button" data-action="open-group" data-id="${firstGroup.id}" type="button">进入当前学习</button>`
      : unit.actionTarget === "combo" && firstGroup
        ? `<button class="primary-button" data-action="open-combo-group" data-id="${firstGroup.id}" type="button">进入当前学习</button>`
        : `<button class="primary-button" data-action="go" data-target="${unit.actionTarget}" type="button">进入当前学习</button>`;

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
        `<button class="back-button" data-action="go" data-target="learn" type="button" aria-label="返回">←</button>`
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

  return `<button class="uyghur form-example-word-text form-example-audio-word" data-action="play-audio" data-audio-src="${audio.outputPath}" data-audio-label="${example.word}"${targetDataAttributes} type="button" aria-label="播放 ${example.word}">${example.word}</button>`;
}

function renderLetterFormExamples(letter) {
  if (!Array.isArray(letter.formExamples) || letter.formExamples.length === 0) {
    return "";
  }

  return `
        <article class="card letter-form-example-card">
          <div class="section-row">
            <div>
              <p class="caption">写法例词</p>
              <h2 class="section-title">${letter.formExamples.length} 种位置写法</h2>
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
                          <strong class="form-example-rule">${example.noteTitle || "书写规则"}</strong>
                          <small class="form-example-note">${example.note || ""}</small>
                        `
                        : '<small class="form-example-empty">无例词</small>'
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
        "第一单元：认识字母",
        `<button class="icon-button" data-action="toggle-favorite" type="button" aria-label="收藏">${state.favorite ? "★" : "☆"}</button>`,
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回">←</button>`
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

        ${renderItemProgress(position.label, "当前字母在本组的位置")}
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
          <p class="caption">学习小点</p>
          <div class="lesson-point-list">
            <div class="lesson-point">
              <strong>认形</strong>
              <span>${letter.cue}</span>
            </div>
            <div class="lesson-point">
              <strong>连接</strong>
              <span>${letter.connection}</span>
            </div>
            <div class="lesson-point">
              <strong>书写</strong>
              <span>${letter.writingHint}</span>
            </div>
          </div>
        </article>
        <div class="action-grid">
          <button class="secondary-button" data-action="go" data-target="letterWriting" type="button">
            描摹
          </button>
          <button class="secondary-button" data-action="go" data-target="picture" type="button">
            辨认
          </button>
          <button class="secondary-button" data-action="go" data-target="letterOdd" type="button">
            找不同
          </button>
          <button class="secondary-button" data-action="go" data-target="letterSound" type="button">
            读音选择
          </button>
          <button class="secondary-button" data-action="go" data-target="listening" type="button">
            听音
          </button>
          <button class="primary-button" data-action="go" data-target="keyboard" type="button">
            键盘
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
        "书写练习",
        "先描摹，再自己写",
        "",
        `<button class="back-button" data-action="go" data-target="group" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">目标字母</p>
              <h2 class="section-title">描摹 <span class="uyghur">${displayStandaloneLetterGlyph(letter.letter)}</span></h2>
            </div>
            <button class="ghost-button" data-action="toggle-guide" type="button">
              ${state.showGuide ? "隐藏参考" : "显示参考"}
            </button>
          </div>
        </article>
        ${renderWritingCoach({
          value: letter.letter,
          parts: [letter.letter],
          hint: letter.writingHint,
          mode: "letter"
        })}
        ${renderWritingCanvas(letter.letter, "字母手写板")}
        ${renderWritingComparison({
          value: letter.letter,
          parts: [letter.letter],
          forms: letter.forms
        })}
        <div class="tool-row">
          <button class="secondary-button" data-action="clear-canvas" type="button">清空画布</button>
          <button class="secondary-button" data-action="toggle-guide" type="button">
            ${state.showGuide ? "隐藏参考" : "显示参考"}
          </button>
        </div>
        ${renderWritingSelfCheck()}
        <div class="feedback">
          ${letter.writingHint}
        </div>
        <button class="primary-button" data-action="go" data-target="picture" type="button">
          完成描摹
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
        "点位辨认",
        currentGroup().title,
        "",
        `<button class="back-button" data-action="go" data-target="group" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">选择正确字母</p>
          <h2 class="section-title">
            哪一个符合：${letter.cue}？
          </h2>
        </article>
        <div class="choice-grid">
          ${choices
            .map((choice) => {
              const selected = state.selectedPicture === choice.id;
              const correctChoice = choice.id === letter.id;
              const resultClass = selected ? (correctChoice ? "correct" : "wrong") : "";
              return `
                <button
                  class="choice-card ${resultClass}"
                  data-action="pick-picture"
                  data-id="${choice.id}"
                  type="button"
                >
                  <span class="choice-art uyghur">${displayStandaloneLetterGlyph(choice.letter)}</span>
                  <span>
                    <strong>${choice.cue}</strong>
                    <span class="caption">${choice.type}，${choice.latin}</span>
                  </span>
                  <span class="step-state">${selected ? (correctChoice ? "正确" : "再想想") : "选择"}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? `答对了。${displayStandaloneLetterGlyph(letter.letter)} 的关键是 ${letter.cue}。`
                  : letterMistakeFeedback(letter, picked)
              }</div>`
            : ""
        }
        <button class="primary-button" data-action="go" data-target="listening" type="button">
          继续听力
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
        "听音选择",
        currentGroup().title,
        "",
        `<button class="back-button" data-action="go" data-target="group" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        ${renderAudioFocus({
          audio,
          label: "听音练习",
          title: "听音练习",
          hint: "先听声音，再从下面选择。",
          hideFile: true
        })}
        <div class="choice-grid">
          ${choices
            .map((choice) => {
              const selected = state.selectedListening === choice.id;
              const correctChoice = choice.id === letter.id;
              const resultClass = selected ? (correctChoice ? "correct" : "wrong") : "";
              return `
                <button
                  class="choice-card ${resultClass}"
                  data-action="pick-listening"
                  data-id="${choice.id}"
                  type="button"
                >
                  <span class="choice-art uyghur">${displayStandaloneLetterGlyph(choice.letter)}</span>
                  <span>
                    <strong class="uyghur">${displayStandaloneLetterGlyph(choice.letter)}</strong>
                    <span class="caption">字母，${choice.latin}</span>
                  </span>
                  <span class="step-state">${selected ? (correctChoice ? "正确" : "再听") : "选择"}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? "听对了。下一步用键盘输入这个字母。"
                  : letterMistakeFeedback(letter, picked)
              }</div>`
            : ""
        }
        <button class="primary-button" data-action="go" data-target="keyboard" type="button">
          继续键盘
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
        "找不同",
        currentGroup().title,
        "",
        `<button class="back-button" data-action="go" data-target="group" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">相似字母对比</p>
          <h2 class="section-title">
            目标 ${displayStandaloneLetterGlyph(letter.letter)}，找出：${target.cue}
          </h2>
          <p class="muted">先看点在上面还是下面，再看点数。这个题型专门练容易混的字母。</p>
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
                  <span class="step-state">${selected ? (correctChoice ? "正确" : "再看") : "选择"}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? `找对了：${displayStandaloneLetterGlyph(target.letter)} 是 ${target.cue}。`
                  : letterMistakeFeedback(target, picked)
              }</div>`
            : ""
        }
        <button class="primary-button" data-action="go" data-target="letterSound" type="button">
          继续读音选择
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
        "读音选择",
        currentGroup().title,
        "",
        `<button class="back-button" data-action="go" data-target="group" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        ${renderAudioFocus({
          audio,
          label: letter.letter,
          title: `播放或查看读音：${letter.latin}`,
          hint: "音频未生成时，先用转写提示做读音选择练习。"
        })}
        <article class="card">
          <p class="caption">选择正确字母</p>
          <h2 class="section-title">哪一个读作 ${letter.latin}？</h2>
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
                  ? `选对了：${displayStandaloneLetterGlyph(letter.letter)} 对应 ${letter.latin}。`
                  : letterMistakeFeedback(letter, picked)
              }</div>`
            : ""
        }
        <button class="primary-button" data-action="go" data-target="keyboard" type="button">
          继续键盘
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
        "键盘输入",
        currentGroup().title,
        "",
        `<button class="back-button" data-action="go" data-target="group" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">请输入这个字母</p>
          <div class="section-row">
            <strong class="uyghur">${displayStandaloneLetterGlyph(letter.letter)}</strong>
            <span class="caption">${letter.latin}</span>
          </div>
        </article>
        <input
          class="rtl-input uyghur"
          value="${state.keyboardValue}"
          aria-label="维吾尔语输入框"
          readonly
          dir="rtl"
        />
        ${renderKeyboardGuide(keyboardParts, letter.letter)}
        <div class="practice-key-row" aria-label="本组字母快捷键">
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
        <div class="keyboard-grid" aria-label="维吾尔语虚拟键盘">
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
          <button class="key-button utility" data-action="backspace" type="button">删除</button>
          <button class="key-button utility" data-action="clear-input" type="button">清空</button>
        </div>
        ${
          hasInput
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? "输入正确。你已经完成这一课。"
                  : `继续输入，目标字母是 ${displayStandaloneLetterGlyph(letter.letter)}。`
              }</div>`
            : `<div class="feedback">提示：点击 <span class="uyghur">${displayStandaloneLetterGlyph(letter.letter)}</span>。</div>`
        }
        <button class="primary-button" data-action="go" data-target="complete" type="button">
          完成课程
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
      ${topBar("课程完成", "第一单元完成")}
      <section class="stack">
        <article class="card">
          <p class="caption">本次学会</p>
          <h2 class="screen-title">
            <span class="uyghur">${groupLetters}</span>
          </h2>
          <p class="muted">你看了当前相似组字母、描摹了 ${displayStandaloneLetterGlyph(letter.letter)}、完成辨认，并用键盘输入了 ${displayStandaloneLetterGlyph(letter.letter)}。</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>${group.letters.length}</strong><span>字母</span></div>
          <div class="metric"><strong>${loop.completeCount} / ${loop.total}</strong><span>完成进度</span></div>
          <div class="metric"><strong>${groupMistakes}</strong><span>本组错题</span></div>
        </div>
        ${renderUnitNextActions("letters")}
        <button class="secondary-button" data-action="go" data-target="home" type="button">
          回到首页
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

function comboPartFormValue(part, label) {
  const letter = comboLetterDetail(part);
  if (!letter) {
    return part;
  }

  if (comboBareLetterIds[part] && label === "独立式") {
    return part;
  }

  return letter.forms.find((form) => form.label === label)?.value || part;
}

function comboPartDetail(item, index) {
  const part = item.parts[index];
  const previous = item.parts[index - 1];
  const next = item.parts[index + 1];
  const connectsPrevious = Boolean(previous) && comboPartConnectsForward(previous) && comboPartAcceptsConnection(part);
  const connectsNext = Boolean(next) && comboPartConnectsForward(part) && comboPartAcceptsConnection(next);
  let label = "独立式";

  if (connectsPrevious && connectsNext) {
    label = "双连式";
  } else if (connectsPrevious) {
    label = "前连式";
  } else if (connectsNext) {
    label = "后连式";
  }

  let connection = "不接前一个字母，后面也断开。";
  if (connectsPrevious && connectsNext) {
    connection = "接前一个字母，也接后一个字母。";
  } else if (connectsPrevious) {
    connection = "接前一个字母，不再接后面。";
  } else if (connectsNext) {
    connection = "不接前面，接后一个字母。";
  } else if (index === 0 && item.parts.length > 1) {
    connection = "在词首位置，但这个字母后面通常不继续连接。";
  }

  return {
    part,
    label,
    form: comboPartFormValue(part, label),
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
          <span class="combo-part-index">第 ${index + 1} 个字母</span>
          <span class="combo-part-flow">
            <span class="combo-part-source">
              <strong class="uyghur">${detail.part}</strong>
              <small>原字母</small>
            </span>
            <span class="combo-part-arrow" aria-hidden="true">→</span>
            <span class="combo-part-form">
              <strong class="uyghur">${detail.form}</strong>
              <small>${detail.label}写法</small>
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
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <div class="alphabet-strip compact">
          ${renderComboSelector(group.items, item.id)}
        </div>

        ${renderItemProgress(position.label, "当前组合在本组的位置")}
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
          <p class="caption">拆开看</p>
          <h2 class="section-title">实际连写形</h2>
          <div class="combo-parts" aria-label="组合拆分">
            ${renderComboParts(item)}
          </div>
          <p class="muted">从右往左：${item.rule}</p>
        </article>

        ${
          item.meaning
            ? `<article class="card review-card">
                <p class="caption">词义预览</p>
                <h2 class="section-title">${item.meaning}</h2>
              </article>`
            : ""
        }

        <article class="card">
          <p class="caption">学习小点</p>
          <div class="lesson-point-list">
            <div class="lesson-point">
              <strong>怎么读</strong>
              <span>${
                state.preferences.showLatin
                  ? `先用 ${item.latin} 做过渡提示，正式发音以后接真人音频。`
                  : "先听真人音频，再跟着音频练习发音。"
              }</span>
            </div>
            <div class="lesson-point">
              <strong>怎么看</strong>
              <span>${item.hint}</span>
            </div>
          </div>
        </article>

        <div class="action-grid">
          <button class="secondary-button" data-action="go" data-target="comboRecognition" type="button">
            辨认
          </button>
          <button class="secondary-button" data-action="go" data-target="comboBuild" type="button">
            拼接
          </button>
          <button class="secondary-button" data-action="go" data-target="comboWriting" type="button">
            书写
          </button>
          <button class="primary-button" data-action="go" data-target="comboKeyboard" type="button">
            键盘
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
  const prompt = item.meaning ? `请选择 ${item.latin} 的词形` : `哪一个读作 ${item.prompt}？`;

  return screen(
    `
      ${topBar(
        "组合辨认",
        group.title,
        "",
        `<button class="back-button" data-action="go" data-target="combo" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">选择正确组合</p>
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
                  <span class="step-state">${selected ? (correctChoice ? "正确" : "再想想") : "选择"}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? `答对了。${item.value} 现在只作为 ${item.type} 学习。`
                  : itemMistakeFeedback(item, picked, "组合")
              }</div>`
            : ""
        }
        <button class="primary-button" data-action="go" data-target="comboKeyboard" type="button">
          继续键盘
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
        "组合拼接",
        group.title,
        "",
        `<button class="back-button" data-action="go" data-target="combo" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">从部分拼成整体</p>
          <h2 class="section-title">
            <span class="uyghur">${item.parts.join(" + ")}</span>
          </h2>
          <p class="muted">按顺序点击下面的部分，拼成 <span class="uyghur">${item.value}</span>。先理解结构，再进入键盘输入。</p>
        </article>
        <article class="card">
          <p class="caption">当前拼接</p>
          <div class="letter-focus compact-focus">
            <div>
              <div class="uyghur letter-big combo-big">${state.keyboardValue || "…"}</div>
              <p class="caption">目标：${item.latin}</p>
            </div>
          </div>
        </article>
        <div class="practice-key-row" aria-label="组合拼接按钮">
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
          <button class="secondary-button" data-action="backspace" type="button">删除</button>
          <button class="secondary-button" data-action="clear-input" type="button">清空</button>
        </div>
        ${
          hasInput
            ? `<div class="feedback ${isCorrect ? "good" : isOffTrack ? "bad" : ""}">${
                isCorrect
                  ? `拼接正确：${item.value}。`
                  : isOffTrack
                    ? itemMistakeFeedback(item, { value: state.keyboardValue }, "组合")
                    : `继续拼接，目标是 ${item.value}。`
              }</div>`
            : `<div class="feedback">先点 <span class="uyghur">${item.parts[0]}</span>，再继续点后面的部分。</div>`
        }
        <button class="primary-button" data-action="go" data-target="comboKeyboard" type="button">
          继续键盘
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
        "组合书写",
        group.title,
        "",
        `<button class="back-button" data-action="go" data-target="combo" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">目标组合</p>
              <h2 class="section-title"><span class="uyghur">${item.value}</span></h2>
            </div>
            <button class="ghost-button" data-action="toggle-guide" type="button">
              ${state.showGuide ? "隐藏参考" : "显示参考"}
            </button>
          </div>
          <p class="muted">${item.latin}。先看整体，再按拆分顺序写。</p>
        </article>
        ${renderWritingCoach({
          value: item.value,
          parts: item.parts,
          hint: item.hint,
          mode: "word"
        })}
        ${renderWritingCanvas(item.value, `${unit.title}手写板`)}
        <div class="tool-row">
          <button class="secondary-button" data-action="clear-canvas" type="button">清空画布</button>
          <button class="secondary-button" data-action="toggle-guide" type="button">
            ${state.showGuide ? "隐藏参考" : "显示参考"}
          </button>
        </div>
        <div class="feedback">写完可以清空重写，也可以继续做键盘输入。</div>
        <button class="primary-button" data-action="go" data-target="comboKeyboard" type="button">
          继续键盘
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
        "组合键盘",
        group.title,
        "",
        `<button class="back-button" data-action="go" data-target="combo" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">请输入这个组合</p>
          <div class="section-row">
            <strong class="uyghur">${item.value}</strong>
            <span class="caption">${item.latin}</span>
          </div>
        </article>
        <input
          class="rtl-input uyghur"
          value="${state.keyboardValue}"
          aria-label="维吾尔语组合输入框"
          readonly
          dir="rtl"
        />
        ${renderKeyboardGuide(keyboardParts, item.value)}
        <div class="practice-key-row" aria-label="本组组合快捷键">
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
        <div class="practice-key-row" aria-label="当前组合拆分键">
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
        <div class="keyboard-grid" aria-label="维吾尔语虚拟键盘">
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
          <button class="key-button utility" data-action="backspace" type="button">删除</button>
          <button class="key-button utility" data-action="clear-input" type="button">清空</button>
        </div>
        ${
          hasInput
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? "输入正确。你已经完成这组组合练习。"
                  : `继续输入，目标组合是 ${item.value}。`
              }</div>`
            : `<div class="feedback">提示：可以直接点击 <span class="uyghur">${item.value}</span>，也可以按拆分键慢慢输入。</div>`
        }
        <button class="primary-button" data-action="go" data-target="comboComplete" type="button">
          完成这一组
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
      ${topBar(`${unitNameForComboGroup(group.id)}完成`, group.title)}
      <section class="stack">
        <article class="card">
          <p class="caption">本次练习</p>
          <h2 class="screen-title">
            <span class="uyghur">${groupValues}</span>
          </h2>
          <p class="muted">你拆分并输入了 ${item.value}。继续复习这一组，熟悉字母连接和断开规律。</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>${group.items.length}</strong><span>组合</span></div>
          <div class="metric"><strong>1</strong><span>输入</span></div>
          <div class="metric"><strong>词形</strong><span>理解</span></div>
        </div>
        ${renderUnitNextActions(unit.id)}
        <button class="secondary-button" data-action="go" data-target="learn" type="button">
          学习路径
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
    <div class="vocab-row-list" aria-label="本课词汇">
      ${
        group.sections?.length
          ? group.sections
              .map((section) => {
                const sectionItems = section.itemIds.map((itemId) => itemsById[itemId]).filter(Boolean);
                return `
                  <section class="vocab-subgroup">
                    <div class="vocab-subgroup-title">
                      <strong>${section.title}</strong>
                      <small>${sectionItems.length} 个词</small>
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
        "第三单元：日常用语与词汇",
        "",
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card vocab-lesson-card">
          <div class="section-row">
            <div>
              <p class="caption">本课词汇</p>
              <h2 class="section-title unit-goal-text">${group.title} · ${group.items.length} 个词</h2>
              ${section ? `<p class="caption">${section.title}</p>` : ""}
            </div>
          </div>
          <p class="muted compact-note">点维语词播放；点右侧解释选择词。中文仅预览，不设唯一答案。</p>
          ${renderVocabRows(group, item.id)}
        </article>

        <div class="item-progress">
          <span class="step-state">${position.label}</span>
          <strong>当前：${state.preferences.showLatin ? `${item.latin} · ` : ""}${item.meaning}</strong>
        </div>

        <div class="action-grid vocab-action-grid">
          <button class="secondary-button" data-action="go" data-target="vocabRecognition" type="button">
            辨认
          </button>
          <button class="primary-button" data-action="go" data-target="vocabKeyboard" type="button">
            键盘
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
        "词形辨认",
        group.title,
        "",
        `<button class="back-button" data-action="go" data-target="vocab" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">选择正确词形</p>
          <h2 class="section-title">请选择 ${item.latin} 的词形</h2>
          <p class="muted">中文预览：${item.meaning}。本题只确认词形。</p>
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
                  <span class="step-state">${selected ? (correctChoice ? "正确" : "再想想") : "选择"}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        ${
          hasPicked
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? `答对了。这里确认的是 ${item.value} 的词形。`
                  : itemMistakeFeedback(item, picked, "词形")
              }</div>`
            : ""
        }
        <button class="primary-button" data-action="go" data-target="vocabKeyboard" type="button">
          继续键盘
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
        "词形键盘",
        group.title,
        "",
        `<button class="back-button" data-action="go" data-target="vocab" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <p class="caption">请输入这个词形</p>
          <div class="section-row">
            <strong class="uyghur">${item.value}</strong>
            <span class="caption">${item.latin}</span>
          </div>
        </article>
        <input
          class="rtl-input uyghur"
          value="${state.keyboardValue}"
          aria-label="维吾尔语词形输入框"
          readonly
          dir="rtl"
        />
        ${renderKeyboardGuide(keyboardParts, item.value)}
        <div class="practice-key-row" aria-label="本组词形快捷键">
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
        <div class="practice-key-row" aria-label="当前词形拆分键">
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
          <button class="secondary-button" data-action="backspace" type="button">删除</button>
          <button class="secondary-button" data-action="clear-input" type="button">清空</button>
        </div>
        ${
          hasInput
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? "输入正确。这个词形已完成本轮练习。"
                  : `继续输入，目标词形是 ${item.value}。`
              }</div>`
            : `<div class="feedback">提示：可以直接点击 <span class="uyghur">${item.value}</span>，也可以按拆分键慢慢输入。</div>`
        }
        <button class="primary-button" data-action="go" data-target="vocabComplete" type="button">
          完成这一组
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
      ${topBar("第三单元完成", group.title)}
      <section class="stack">
        <article class="card review-card">
          <p class="caption">本次练习</p>
          <h2 class="screen-title">
            <span class="uyghur">${groupValues}</span>
          </h2>
          <p class="muted">你辨认并输入了 ${item.value}。可以回到学习路径选择下一组内容。</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>${sectionItems.length}</strong><span>${section ? section.title : "词形"}</span></div>
          <div class="metric"><strong>1</strong><span>输入</span></div>
          <div class="metric"><strong>词义</strong><span>理解</span></div>
        </div>
        ${renderUnitNextActions("basic-phrases")}
        <button class="secondary-button" data-action="go" data-target="learn" type="button">
          学习路径
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
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        ${
          unit.readingKind === "quote" && group.intro
            ? `<article class="card reading-intro-card">
                <p class="caption">人物介绍</p>
                <p class="reading-intro-text">${group.intro}</p>
              </article>`
            : ""
        }
        <div class="reading-list ${unit.readingKind}">
          ${group.items.map((item) => renderReadingLine(unit, item)).join("")}
        </div>
        <button class="secondary-button" data-action="go" data-target="unit" type="button">
          返回小课
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
                <span class="caption">${choice.type}，${choice.latin}</span>
              </span>
              <span class="step-state">${selected ? (correctChoice ? "正确" : "再听") : "选择"}</span>
            </button>
          `;
        })
        .join("")}
    </div>
    ${
      hasPicked
        ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
            isCorrect
              ? `辨认正确。本轮确认的是 ${item.value} 的词形。`
              : itemMistakeFeedback(item, picked, "练习目标")
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
      <p class="caption">选择字母</p>
      <h2 class="section-title unit-goal-text">从 32 个字母里选择你听到的字母</h2>
      <div class="alphabet-strip compact listening-choice-strip" aria-label="32 个字母选择">
        ${group.items
          .map((choice) => {
            const selected = state.selectedListening === choice.id;
            const choiceClass = selected ? (choice.id === item.id ? "active" : "wrong") : "";
            return `
              <button
                class="letter-pill button-pill ${choiceClass}"
                data-action="pick-practice"
                data-id="${choice.id}"
                type="button"
                aria-label="选择 ${choice.latin}"
              >
                <span class="uyghur">${choice.value}</span>
                <small>${choice.latin}</small>
              </button>
            `;
          })
          .join("")}
      </div>
    </article>
    ${
      hasPicked
        ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
            isCorrect ? `辨认正确。已完成 ${completedCount} / ${group.items.length}。` : "再听一次，再选。"
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
        <p class="caption">跟读步骤</p>
        <div class="lesson-point-list">
          <div class="lesson-point"><strong>看词形</strong><span class="uyghur">${item.value}</span></div>
          <div class="lesson-point"><strong>看提示</strong><span>${item.latin}，${item.hint}</span></div>
          <div class="lesson-point"><strong>轻声跟读</strong><span>${item.audioStatus}。</span></div>
        </div>
      </article>
    `;
  }

  if (group.mode === "write") {
    return `
      <article class="card practice-mode-card">
        <div class="section-row">
          <p class="caption">手写板</p>
          <button class="ghost-button" data-action="clear-canvas" type="button">清空画布</button>
        </div>
        ${renderWritingCanvas(item.value, "字母练习手写板")}
        <button class="ghost-button" data-action="toggle-guide" type="button">
          ${state.showGuide ? "隐藏参考" : "显示参考"}
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
        aria-label="字母练习维吾尔语输入框"
        readonly
        dir="rtl"
      />
      <div class="keyboard-grid random-keyboard-grid" aria-label="随机字母键盘">
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
      <div class="keyboard-utility-row" aria-label="键盘工具">
        <button class="key-button utility" data-action="backspace" type="button">删除</button>
        <button class="key-button utility" data-action="clear-input" type="button">清空</button>
      </div>
    `;
  }

  const reviewItems = mistakeReviewItems();
  if (!reviewItems.length) {
    return `
      <article class="card practice-mode-card">
        <p class="caption">暂无错题</p>
        <h2 class="section-title">练习答错后会自动进入这里</h2>
        <p class="muted">先去听音辨认、跟读、书写或键盘练习。答错的字母会保存在本地错题里。</p>
      </article>
      <div class="feedback">当前没有需要复习的错题。</div>
    `;
  }

  return `
    <article class="card practice-mode-card">
      <p class="caption">本轮错题</p>
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
    <div class="feedback">这些错题已保存在本地，之后可以继续按错题频率安排复习。</div>
  `;
}

function renderPracticeHub() {
  return screen(
    `
      ${topBar("练习已整理", "入口已移动到首页和字母")}
      <section class="stack">
        <article class="card">
          <p class="caption">练习入口</p>
          <h2 class="section-title">今日复习在首页，字母练习在字母页</h2>
          <div class="action-grid">
            <button class="primary-button" data-action="go" data-target="home" type="button">回到首页</button>
            <button class="secondary-button" data-action="go" data-target="library" type="button">去字母练习</button>
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
          isReviewPractice ? "首页：今日复习" : "字母：专项练习",
          "",
          `<button class="back-button" data-action="go" data-target="${practiceBackTarget}" type="button" aria-label="返回">←</button>`
        )}
        <section class="stack">
          ${renderPracticeModeCard(group, null)}
          <button class="primary-button" data-action="go" data-target="${practiceBackTarget}" type="button">
            ${isReviewPractice ? "返回首页" : "返回字母练习"}
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
    label: isListeningPractice ? "听音练习" : item.value,
    title: isListeningPractice ? "听音练习" : `播放：${item.latin}`,
    hint: isListeningPractice
      ? "先听声音，再从 32 个字母里选择。"
      : "音频待录，暂不播放。",
    hideFile: isListeningPractice
  });
  const practiceTargetCard = (withAudio = false) => `
    <div class="letter-focus practice-target-card">
      ${
        withAudio
          ? renderAudioButton({
              audio,
              label: isListeningPractice ? "听音练习" : item.value,
              className: "letter-focus-play"
            })
          : ""
      }
      <div>
        <div class="uyghur letter-big practice-big ${longWordClass}">${item.value}</div>
        <p class="caption">${item.type}，${item.latin}</p>
      </div>
    </div>
  `;

  return screen(
    `
      ${topBar(
        group.title,
        isReviewPractice ? "首页：今日复习" : "字母：专项练习",
        "",
        `<button class="back-button" data-action="go" data-target="${practiceBackTarget}" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">${item.label}</p>
              <h2 class="section-title unit-goal-text">${group.goal}</h2>
            </div>
            <span class="step-state">${
              isListeningPractice ? `${listeningCompletedCount} / ${group.items.length}` : isReviewPractice ? `${reviewItems.length} 项` : group.status
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
                  返回字母练习
                </button>`
              : `<div class="action-grid">
                <button class="secondary-button" data-action="go" data-target="${practiceBackTarget}" type="button">
                  ${isReviewPractice ? "返回首页" : "返回字母练习"}
                </button>
                ${
                  isListeningPractice && !listeningRoundComplete
                    ? `<button class="primary-button" data-action="next-practice-audio" type="button">
                        下一个音频
                      </button>`
                    : `<button class="primary-button" data-action="go" data-target="practiceComplete" type="button">
                        查看结果
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
        ${topBar("复习结果", group.title)}
        <section class="stack">
          <article class="card review-card">
            <p class="caption">暂无错题</p>
            <h2 class="section-title">还没有需要复习的内容</h2>
            <p class="muted">练习中答错的字母会自动进入本地错题。</p>
          </article>
          <button class="primary-button" data-action="go" data-target="${isReviewPractice ? "home" : "library"}" type="button">
            ${isReviewPractice ? "返回首页" : "返回字母练习"}
          </button>
        </section>
      `,
      "writing"
    );
  }

  const listened =
    group.mode === "listen" ? `已完成 ${practiceListeningCompletedCount(group)} / ${group.items.length}` : "可选";
  const repeated = group.mode === "repeat" ? (state.practiceSpoken ? "已跟读" : "未跟读") : "可选";
  const written = group.mode === "write" ? "已练习" : "可选";
  const typed = group.mode === "keyboard" ? (state.keyboardValue === item.value ? "已输入" : "未完成") : "可选";

  return screen(
    `
      ${topBar("复习结果", group.title)}
      <section class="stack">
        <article class="card review-card">
          <p class="caption">本轮目标</p>
          <h2 class="screen-title"><span class="uyghur">${item.value}</span></h2>
          <p class="muted">本页只记录练习流程，不确认主题词义是否最终正确。</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>${group.items.length}</strong><span>本组项目</span></div>
          <div class="metric"><strong>待录</strong><span>音频</span></div>
          <div class="metric"><strong>${state.mistakes.length}</strong><span>本地错题</span></div>
        </div>
        <article class="card">
          <p class="caption">练习记录</p>
          <div class="audit-grid">
            <div class="audit-row"><strong>听音</strong><span>${listened}</span></div>
            <div class="audit-row"><strong>跟读</strong><span>${repeated}</span></div>
            <div class="audit-row"><strong>书写</strong><span>${written}</span></div>
            <div class="audit-row"><strong>键盘</strong><span>${typed}</span></div>
            <div class="audit-row"><strong>备注</strong><span>${item.audioStatus}。</span></div>
          </div>
        </article>
        <article class="card next-action-card">
          <p class="caption">下一步建议</p>
          <div class="action-grid">
            <button class="secondary-button" data-action="open-practice-group" data-id="${group.id}" type="button">
              再练一轮
            </button>
            <button class="primary-button" data-action="go" data-target="${isReviewPractice ? "home" : "library"}" type="button">
              ${isReviewPractice ? "返回首页" : "返回字母练习"}
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
      ${topBar("字母库", "第一单元全部字母")}
      <section class="stack">
        <article class="card compact-library-card">
          <div class="section-row">
            <div>
              <p class="caption">完整字母表</p>
              <h2 class="section-title">32 个字母</h2>
            </div>
          </div>
        </article>

        <article class="card">
          <div class="letter-library-grid" aria-label="字母库紧凑目录">
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
              <p class="caption">字母练习</p>
              <h2 class="section-title">听、读、写、键盘</h2>
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
  const displayName = accountProfile.displayName || "Ana Tilim 学习者";
  const avatarContent = avatarUrl
    ? `<img src="${escapeHtml(avatarUrl)}" alt="学习头像" />`
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
              aria-label="从相册选择头像"
              ${accountEmail && !state.avatarUploading ? "" : "disabled"}
            />
            <span>${state.avatarUploading ? "上传中…" : "选择头像"}</span>
          </label>
        </div>
        <div class="profile-account">
          <p class="caption">学习账号</p>
          <h2 class="section-title">${escapeHtml(displayName)}</h2>
          <p class="muted">${accountEmail ? escapeHtml(accountEmail) : "无需登录也可学习"}</p>
        </div>
        <span class="step-state profile-status">${cloudStatusLabel()}</span>
      </div>
      <div class="metric-grid profile-account-metrics" aria-label="个人学习概览">
        <div class="metric"><strong>${streakDays}</strong><span>连续学习</span></div>
        <div class="metric"><strong>${reviewCount}</strong><span>今日待复习</span></div>
        <div class="metric"><strong>${progress.completed} / ${progress.total}</strong><span>总进度</span></div>
      </div>
      <div class="profile-progress-row">
        <span>个人学习状态</span>
        <strong>${progress.percent}%</strong>
      </div>
      <div class="progress-track" aria-hidden="true">
        <div class="progress-fill" style="--value: ${progress.percent}%"></div>
      </div>
      <p class="caption">${accountEmail ? "学习记录会自动同步到云端。" : "登录后可自动保存并跨设备同步学习记录。"}</p>
    </article>
  `;
}

function renderProfileMemoryCard(reviewCount) {
  const hasReview = reviewCount > 0;
  return `
    <article class="card profile-memory-card">
      <div class="section-row">
        <div>
          <p class="caption">记忆练习</p>
          <h2 class="section-title">${hasReview ? "先复习今天容易忘的内容" : "今天可以继续巩固基础内容"}</h2>
        </div>
        <span class="step-state">${reviewCount} 项</span>
      </div>
      <p class="muted">${hasReview ? "错题会优先进入复习队列，后续登录版会按间隔重复自动安排下次复习。" : "当前没有待复习错题，后续登录版会按记忆状态生成每日复习队列。"}</p>
      <button
        class="primary-button"
        data-action="${hasReview ? "open-practice-group" : "go"}"
        data-id="${hasReview ? "review-loop" : ""}"
        data-target="${hasReview ? "" : "library"}"
        type="button"
      >
        ${hasReview ? "开始今日复习" : "去字母练习"}
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
        <p class="caption">设置</p>
        <h2 class="section-title" id="learning-preferences-title">学习偏好</h2>
      </div>

      <section class="profile-setting-group" aria-labelledby="learning-preferences-title">
        ${renderToggleSetting({
          label: "学习提醒",
          detail: "未完成目标时在首页提醒",
          action: "toggle-learning-reminder",
          checked: preferences.learningReminder
        })}
        ${renderToggleSetting({
          label: "显示拉丁转写",
          detail: "在字母、词语和句子下显示 ULY 读法",
          action: "toggle-latin-transliteration",
          checked: preferences.showLatin
        })}
      </section>

      <section class="profile-setting-group" aria-labelledby="audio-preferences-title">
        <h3 id="audio-preferences-title">音频</h3>
        ${renderToggleSetting({
          label: "自动播放",
          detail: "进入或切换学习内容时播放一次",
          action: "toggle-audio-autoplay",
          checked: preferences.audioAutoplay
        })}
      </section>

      <section class="profile-setting-group" aria-labelledby="account-settings-title">
        <h3 id="account-settings-title">账号与数据</h3>
        <div class="profile-setting-block profile-account-setting">
          <div>
            <strong>当前账号</strong>
            <small>${accountEmail ? escapeHtml(accountEmail) : "本地学习账号"}</small>
          </div>
          <span class="step-state">${cloudStatusLabel()}</span>
        </div>
        ${
          accountEmail
            ? `
              <div class="profile-name-editor">
                <label class="auth-field" for="profile-display-name">
                  <span>学习名称</span>
                  <input
                    id="profile-display-name"
                    type="text"
                    maxlength="40"
                    autocomplete="name"
                    value="${escapeHtml(accountProfile.displayName || "Ana Tilim 学习者")}"
                  />
                </label>
                <button class="secondary-button" data-action="save-display-name" type="button">保存名称</button>
              </div>
            `
            : ""
        }
        ${renderCloudAuthControls()}
        ${
          state.clearLearningConfirmation
            ? `
              <div class="clear-learning-confirmation" role="alert">
                <strong>确认清除学习记录</strong>
                <p>将清除课程进度、今日记录、错题、收藏和最近学习位置；账号与设置会保留。</p>
                <div class="action-grid">
                  <button class="secondary-button" data-action="cancel-clear-learning" type="button">取消</button>
                  <button class="danger-button" data-action="confirm-clear-learning" type="button">确认清除</button>
                </div>
              </div>
            `
            : `
              <button class="danger-button" data-action="request-clear-learning" type="button">
                清除学习记录
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
      ${topBar("我的", "个人学习状态")}
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
      showToast("暂无可播放音频");
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
        showToast(`${label || "内容"}：播放中`);
      }
    })
    .catch(() => {
      if (!autoplay) {
        showToast("音频文件不能播放，请检查文件");
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

  if (action === "toggle-learning-reminder") {
    setPreference("learningReminder", !state.preferences.learningReminder);
    render();
    showToast(state.preferences.learningReminder ? "学习提醒已开启" : "学习提醒已关闭");
    return;
  }

  if (action === "toggle-latin-transliteration") {
    setPreference("showLatin", !state.preferences.showLatin);
    render();
    showToast(state.preferences.showLatin ? "拉丁转写已显示" : "拉丁转写已隐藏");
    return;
  }

  if (action === "toggle-audio-autoplay") {
    setPreference("audioAutoplay", !state.preferences.audioAutoplay);
    render();
    showToast(state.preferences.audioAutoplay ? "自动播放已开启" : "自动播放已关闭");
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
      showToast("清除失败，原记录已保留");
      return;
    }
    render();
    showToast("学习记录已清除");
    return;
  }

  if (action === "continue-local") {
    state.screen = "home";
    saveLocalProgress();
    render();
    showToast("已进入本地学习模式");
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
        showToast("登录成功，学习记录将自动同步");
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
      showToast("游客进度备份失败，请稍后重试");
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
        showToast("注册成功，从第一单元开始学习");
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
        showToast("Google 登录暂时不可用，请稍后重试");
      });
    return;
  }

  if (action === "request-email-otp") {
    const email = document.querySelector("#auth-email")?.value?.trim() || "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("请输入有效的邮箱地址");
      return;
    }
    state.authEmail = email;
    cloudSync
      ?.requestEmailOtp(email)
      .then(() => {
        state.emailCodeSent = true;
        render();
        showToast("验证码已发送，请检查邮箱");
      })
      .catch(() => showToast("验证码发送失败，请稍后重试"));
    return;
  }

  if (action === "verify-email-otp") {
    const code = document.querySelector("#auth-code")?.value?.trim() || "";
    if (!/^\d{6}$/.test(code)) {
      showToast("请输入 6 位验证码");
      return;
    }
    cloudSync
      ?.verifyEmailOtp(state.authEmail, code)
      .then(() => {
        state.emailCodeSent = false;
        state.emailAuthExpanded = false;
        render();
        showToast("登录成功，学习记录将自动同步");
      })
      .catch(() => showToast("验证码不正确或已过期"));
    return;
  }

  if (action === "cloud-sign-out") {
    cloudSync
      ?.signOut()
      .then(() => {
        render();
        showToast("已退出登录，本地学习记录仍然保留");
      })
      .catch(() => showToast("退出登录失败，请稍后重试"));
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
        showToast("名称已更新");
      })
      .catch(() => showToast("名称保存失败，请稍后重试"));
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
    showToast(state.favorite ? "已加入收藏" : "已取消收藏");
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
    showToast("这个功能会在正式版加入");
  }
});

document.addEventListener("change", (event) => {
  const input = event.target;
  if (input?.id !== "profile-avatar-input") return;

  const file = input.files?.[0];
  if (!file) return;
  if (!cloudAccountEmail()) {
    showToast("请先登录后再更换头像");
    return;
  }
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
    showToast("请选择 JPG、PNG、WebP 或 GIF 图片");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast("头像图片不能超过 5MB");
    return;
  }

  state.avatarUploading = true;
  render();
  cloudSync
    ?.uploadAvatar(file)
    .then(() => {
      state.avatarUploading = false;
      render();
      showToast("头像已更新");
    })
    .catch(() => {
      state.avatarUploading = false;
      render();
      showToast("头像上传失败，请稍后重试");
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
    cloudStatus = { phase: "error", error: "登录服务暂时不可用" };
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
