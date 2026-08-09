const courseData = window.ANA_TILIM_COURSE;
const sentenceGlossary = window.ANA_TILIM_SENTENCE_GLOSSARY;
const progressTransfer = window.ANA_TILIM_PROGRESS_TRANSFER;
const uyghurKeyboard = window.ANA_TILIM_UYGHUR_KEYBOARD;
const latinKeyboard = window.ANA_TILIM_LATIN_KEYBOARD;
const unitOrder = window.ANA_TILIM_UNIT_ORDER;
const appConfig = Object.freeze({
  edition: "global",
  brandName: "Ana Tilim",
  brandNameUyghur: "ئانا تىلىم",
  logoPath: "./assets/logo.png",
  cloudEnabled: true,
  progressStorageKey: "ana-tilim-progress",
  backupStorageKey: "ana-tilim-guest-progress-backup",
  ...(window.ANA_TILIM_APP_CONFIG || {})
});

if (!courseData || !sentenceGlossary || !progressTransfer || !uyghurKeyboard || !latinKeyboard || !unitOrder) {
  throw new Error("Learning data modules failed to load.");
}

const {
  alphabetLetters,
  letterDetails,
  alphabetGroups,
  alphabetAudioItems,
  latinWriting,
  comboGroups,
  vocabGroups,
  practiceGroups,
  readingUnits
} = courseData;

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

const lettersUnit = {
  id: "letters",
  subtitle: "32 个字母，相似分组",
  description: "先按截图顺序认识全部字母，学习时把看起来相似、容易混的字母放在一组。",
  bullets: ["认识字母形状", "区分点位和点数", "看四种形态", "练单字母键盘输入"],
  groups: alphabetGroups,
  actionTarget: "letter"
};
const latinWritingUnit = {
  ...latinWriting.unit,
  groups: [],
  actionTarget: "latinKeyboardIntro"
};
const combosUnit = {
  id: "combos",
  subtitle: "基础组合、三字母连接和断开规则",
  description: "先做两字母组合，再加入三字母和断开连接例子，比较同一个字母在词里的形态变化。",
  bullets: ["开口组合", "轻声组合", "三字母连接", "断开规则", "拆开再合上"],
  groups: basicComboGroups,
  actionTarget: "combo"
};
const vocabUnit = {
  id: "basic-phrases",
  subtitle: "问候、人称代词、称呼、数字、动物等",
  description: "选择一个常用主题，点进去再一行一行学习词形。",
  bullets: ["主题小课", "一行一词", "词形辨认", "键盘输入"],
  groups: vocabGroups,
  actionTarget: "vocab"
};
const readingUnitCatalog = readingUnits.map(({ title: _title, ...unit }) => ({
  ...unit,
  actionTarget: "reading"
}));
const learningUnitCatalog = [lettersUnit, latinWritingUnit, combosUnit, vocabUnit, ...readingUnitCatalog];
const learningUnits = unitOrder.buildVisibleUnits(learningUnitCatalog, appConfig);
const persistedScreenIds = new Set([
  "welcome",
  "home",
  "learn",
  "unit",
  "latinKeyboardIntro",
  "latinLetterClasses",
  "latinVowelCompare",
  "latinDictation",
  "latinWritingForms",
  "letter",
  "group",
  "writing",
  "letterWriting",
  "picture",
  "listening",
  "letterOdd",
  "letterSound",
  "keyboard",
  "complete",
  "combo",
  "comboRecognition",
  "comboBuild",
  "comboWriting",
  "comboKeyboard",
  "comboComplete",
  "vocab",
  "vocabRecognition",
  "vocabKeyboard",
  "vocabComplete",
  "reading",
  "practiceSession",
  "practiceComplete",
  "library",
  "profile",
  "settings"
]);
const liveCanvasScreenIds = new Set([
  "letterWriting",
  "latinDictation",
  "latinWritingForms",
  "comboWriting"
]);
const latinWritingTabNavigationKeys = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);
const latinWritingStepIds = Object.freeze(["qwerty", "classification", "vowel-contrast", "dictation", "forms"]);
const stableProgressIds = Object.freeze({
  latinWriting: new Set(latinWritingStepIds),
  letters: new Set(alphabetGroups.map((group) => group.id)),
  combos: new Set(comboGroups.map((group) => group.id)),
  vocab: new Set(vocabGroups.map((group) => group.id)),
  practice: new Set(practiceGroups.map((group) => group.id)),
  reading: new Set(readingUnits.flatMap((unit) => unit.groups.map((group) => group.id)))
});
const stableNavigationIds = Object.freeze({
  currentLetterId: new Set(Object.keys(letterDetails)),
  selectedGroupId: stableProgressIds.letters,
  currentComboItemId: new Set(comboGroups.flatMap((group) => group.items.map((item) => item.id))),
  selectedComboGroupId: stableProgressIds.combos,
  currentVocabItemId: new Set(vocabGroups.flatMap((group) => group.items.map((item) => item.id))),
  selectedVocabGroupId: stableProgressIds.vocab,
  currentPracticeItemId: new Set(
    practiceGroups.filter((group) => group.mode !== "review").flatMap((group) => group.items.map((item) => item.id))
  ),
  selectedPracticeGroupId: stableProgressIds.practice,
  selectedReadingUnitId: new Set(readingUnits.map((unit) => unit.id)),
  selectedReadingGroupId: stableProgressIds.reading,
  selectedUnitId: new Set([...learningUnits.map((unit) => unit.id), "practice"])
});
const stableMistakeTargetIds = Object.freeze({
  letter: stableNavigationIds.currentLetterId,
  combo: stableNavigationIds.currentComboItemId,
  vocab: stableNavigationIds.currentVocabItemId,
  practice: stableNavigationIds.currentPracticeItemId
});
const stableWritingCheckIds = new Set(["shape", "dots", "spacing"]);
const dailyActivitySteps = Object.freeze({
  latinWriting: new Set(["completed"]),
  letters: new Set(["viewed", "writing", "recognition", "keyboard", "completed"]),
  combos: new Set(["viewed", "writing", "recognition", "build", "keyboard", "completed"]),
  vocab: new Set(["viewed", "recognition", "keyboard", "completed"]),
  practice: new Set(["viewed", "listen", "repeat", "write", "keyboard", "review", "completed"]),
  reading: new Set(["viewed", "completed"])
});

function learningUnitById(unitId) {
  return learningUnits.find((unit) => unit.id === unitId) || null;
}

function learningUnitTitle(unitId) {
  return learningUnitById(unitId)?.title || unitOrder.UNIT_NAMES[unitId] || "学习单元";
}

function learningUnitOrdinal(unitId) {
  const [ordinal, name] = learningUnitTitle(unitId).split("：");
  return name ? ordinal : "学习单元";
}

const unitExperience = {
  letters: {
    recommended: "先复习字母分组，再进入下一单元。",
    steps: ["认识相似字母组", "看四种写法", "做辨认、听音、键盘", "完成后进入下一单元"],
    reviewLabel: "复习本组",
    reviewTarget: "group"
  },
  "latin-keyboard-writing": {
    recommended: "先完成普通拉丁 QWERTY，再按顺序整理字母并练习书写。",
    steps: ["普通 QWERTY", "元音与辅音分类", "元音对比辨认", "ULY 提示默写", "书写形式参考"],
    reviewLabel: "练习 QWERTY",
    reviewTarget: "latinKeyboardIntro"
  },
  combos: {
    recommended: "先练两字母组合，再看三字母连接和断开规则，从右往左拆分再合上。",
    steps: ["看两字母组合", "看三字母连接", "找断开字母", "做组合辨认和键盘输入"],
    reviewLabel: "复习组合",
    reviewTarget: "combo"
  },
  "basic-phrases": {
    recommended: "按主题小课学日常用语和词汇，一行一行看词形。",
    steps: ["选择主题小课", "一行一行看词", "做词形辨认", "完成键盘输入"],
    reviewLabel: "复习主题词",
    reviewTarget: "vocab"
  },
  "grammar-basics": {
    recommended: "先看最基础的语法规则，再读例句。",
    steps: ["选择语法点", "看句型模式", "读维语例句", "看中文说明"],
    reviewLabel: "复习语法",
    reviewTarget: "reading"
  },
  "sentence-patterns": {
    recommended: "把日常用语与词汇中学过的常用词放进短句里。",
    steps: ["选择句型", "一行一行读短句", "看中文翻译"],
    reviewLabel: "复习句型",
    reviewTarget: "reading"
  },
  "dialogue-theater": {
    recommended: "读很短的双人日常对话。",
    steps: ["选择对话", "一句一句读", "看中文翻译"],
    reviewLabel: "复习对话",
    reviewTarget: "reading"
  },
  "short-stories": {
    recommended: "读很短的小故事。",
    steps: ["选择故事", "一句一句读", "看中文翻译"],
    reviewLabel: "复习故事",
    reviewTarget: "reading"
  },
  "famous-quotes": {
    recommended: "阅读名人短句，先理解句意，再听真人发音。",
    steps: ["选择人物", "读短句", "看中文翻译"],
    reviewLabel: "复习名言",
    reviewTarget: "reading"
  },
  "uyghur-proverbs": {
    recommended: "阅读常见谚语，先理解句意，再跟读真人发音。",
    steps: ["选择谚语", "读原文", "看中文翻译"],
    reviewLabel: "复习谚语",
    reviewTarget: "reading"
  }
};

const progressStorageKey = appConfig.progressStorageKey;
const guestBackupStorageKey = appConfig.backupStorageKey;
const DEFAULT_PREFERENCES = Object.freeze({
  audioAutoplay: false,
  dailyGoal: 10,
  learningReminder: false,
  showLatin: true
});

function normalizePreferences(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    audioAutoplay: typeof source.audioAutoplay === "boolean" ? source.audioAutoplay : false,
    dailyGoal: [5, 10, 15].includes(source.dailyGoal) ? source.dailyGoal : 10,
    learningReminder: typeof source.learningReminder === "boolean" ? source.learningReminder : false,
    showLatin: typeof source.showLatin === "boolean" ? source.showLatin : true
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

function createDefaultLocalProgressState(timestamp = new Date().toISOString()) {
  return {
    screen: "welcome",
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
    selectedUnitId: "letters",
    favorite: false,
    learningProgress: emptyLearningProgress(),
    mistakes: [],
    writingChecks: [],
    localProfile: {
      displayName: "",
      avatarDataUrl: ""
    },
    preferences: { ...DEFAULT_PREFERENCES },
    dailyActivity: { date: "", completedIds: [] },
    modifiedAt: timestamp,
    preferencesUpdatedAt: timestamp,
    favoriteUpdatedAt: timestamp
  };
}

const localProgressFieldNames = Object.freeze(
  Object.keys(createDefaultLocalProgressState(initialCloudTimestamp))
);

const state = {
  ...createDefaultLocalProgressState(initialCloudTimestamp),
  selectedPicture: "",
  selectedListening: "",
  practiceAudioPlayed: false,
  keyboardValue: "",
  keyboardShift: false,
  latinKeyboardValue: "",
  latinVowelComparisonIndex: 0,
  latinDictationIndex: 0,
  latinDictationRevealed: false,
  latinWritingForm: 0,
  latinWritingLetterId: "aa",
  latinWritingGuideVisible: true,
  latinWritingComparisonRevealed: false,
  practiceSpoken: false,
  emailAuthExpanded: false,
  emailCodeSent: false,
  authPanelExpanded: false,
  authMode: "login",
  authEmail: "",
  avatarUploading: false,
  profileNameEditing: false,
  showGuide: true,
  clearLearningConfirmation: false,
  pendingProgressImport: null,
  syncDirty: false
};

hydrateLocalProgress();

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
let toastTimer = null;
let activeAudio = null;
let lastAutoplayKey = "";
let progressImportSelectionGeneration = 0;
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

function applyLocalProgressData(saved) {
  if (!saved || typeof saved !== "object") {
    return false;
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
      latinWriting: saved.learningProgress.latinWriting || {},
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

  if (saved.localProfile && typeof saved.localProfile === "object") {
    state.localProfile = {
      displayName: typeof saved.localProfile.displayName === "string" ? saved.localProfile.displayName.slice(0, 40) : "",
      avatarDataUrl:
        typeof saved.localProfile.avatarDataUrl === "string" && saved.localProfile.avatarDataUrl.startsWith("data:image/")
          ? saved.localProfile.avatarDataUrl
          : ""
    };
  }

  return true;
}

function hydrateLocalProgress() {
  const storage = localStorageSafe();
  if (!storage) {
    return;
  }

  try {
    applyLocalProgressData(JSON.parse(storage.getItem(progressStorageKey) || "{}"));
  } catch {
    // Ignore damaged local progress and keep the default starter state.
  }
}

function saveLocalProgress() {
  const storage = localStorageSafe();
  if (!storage) {
    return false;
  }

  const saved = buildLocalProgressData();

  try {
    storage.setItem(progressStorageKey, JSON.stringify(saved));
  } catch {
    return false;
  }

  if (state.syncDirty && typeof cloudSync?.scheduleSync === "function") {
    try {
      cloudSync.scheduleSync(buildCloudSnapshot());
      state.syncDirty = false;
    } catch {
      // Local persistence succeeded; keep syncDirty for the next cloud retry.
    }
  }

  return true;
}

function buildLocalProgressData() {
  return Object.fromEntries(
    localProgressFieldNames.map((field) => [field, state[field]])
  );
}

function resetPersistedLocalProgressState() {
  Object.assign(state, createDefaultLocalProgressState());
}

function exportLocalProgress() {
  const payload = progressTransfer.createExportPayload(buildLocalProgressData(), {
    edition: appConfig.edition,
    brandName: appConfig.brandName
  });
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `uyghur-tili-progress-${localDayKey()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importLocalProgressText(text) {
  const envelope = progressTransfer.parseImportPayload(text, { expectedEdition: appConfig.edition });
  validateImportedProgressIds(envelope.data);
  state.pendingProgressImport = envelope;
  return envelope;
}

function validateImportedProgressIds(saved) {
  if (saved.screen !== undefined && !persistedScreenIds.has(saved.screen)) {
    throw new Error(`学习数据包含未知页面 ID: ${saved.screen}`);
  }

  const importedMistakeIds = new Set(
    (saved.mistakes || []).map((mistake) => `mistake-${mistake.key}`)
  );
  for (const [field, allowedIds] of Object.entries(stableNavigationIds)) {
    const value = saved[field];
    if (value === undefined) continue;
    const isRecognizedPracticeReviewId =
      field === "currentPracticeItemId" && (value === "" || importedMistakeIds.has(value));
    if (!allowedIds.has(value) && !isRecognizedPracticeReviewId) {
      throw new Error(`学习数据包含未知 ${field}: ${value}`);
    }
  }

  for (const [scope, bucket] of Object.entries(saved.learningProgress || {})) {
    const allowedIds = stableProgressIds[scope];
    for (const id of Object.keys(bucket)) {
      if (!allowedIds.has(id)) {
        throw new Error(`learningProgress.${scope} 包含未知 ID: ${id}`);
      }
      const listenCompletedIds = bucket[id].listenCompletedIds;
      if (listenCompletedIds) {
        const group = practiceGroups.find((item) => item.id === id);
        const itemIds = new Set((group?.items || []).map((item) => item.id));
        const unknownItemId = listenCompletedIds.find((itemId) => !itemIds.has(itemId));
        if (unknownItemId) {
          throw new Error(`learningProgress.${scope}.${id}.listenCompletedIds 包含未知 ID: ${unknownItemId}`);
        }
      }
    }
  }

  (saved.mistakes || []).forEach((mistake, index) => {
    const allowedTargets = stableMistakeTargetIds[mistake.kind];
    if (!allowedTargets) {
      throw new Error(`mistakes[${index}] 包含未知 kind: ${mistake.kind}`);
    }
    if (mistake.key !== `${mistake.kind}:${mistake.targetId}`) {
      throw new Error(`mistakes[${index}] 的 key 与 kind/targetId 不匹配`);
    }
    if (!allowedTargets.has(mistake.targetId)) {
      throw new Error(`mistakes[${index}] 包含未知 targetId: ${mistake.targetId}`);
    }
  });

  const unknownWritingCheck = (saved.writingChecks || []).find((id) => !stableWritingCheckIds.has(id));
  if (unknownWritingCheck) {
    throw new Error(`writingChecks 包含未知 ID: ${unknownWritingCheck}`);
  }

  const unknownActivityId = (saved.dailyActivity?.completedIds || []).find(
    (activityId) => !isRecognizedDailyActivityId(activityId)
  );
  if (unknownActivityId) {
    throw new Error(`dailyActivity.completedIds 包含未知 ID: ${unknownActivityId}`);
  }
}

function isRecognizedDailyActivityId(activityId) {
  const parts = activityId.split(":");
  if (parts.length === 4) {
    const [scope, groupId, step, itemId] = parts;
    if (scope !== "practice" || step !== "listen" || !stableProgressIds.practice.has(groupId)) {
      return false;
    }
    const group = practiceGroups.find((item) => item.id === groupId);
    return Boolean(group?.items.some((item) => item.id === itemId));
  }
  if (parts.length !== 3) return false;
  const [scope, id, step] = parts;
  return Boolean(stableProgressIds[scope]?.has(id) && dailyActivitySteps[scope]?.has(step));
}

function confirmLocalProgressImport() {
  if (!localStorageSafe()) {
    throw new Error("当前浏览器不能保存学习记录");
  }
  if (!state.pendingProgressImport) {
    throw new Error("请先选择学习记录文件");
  }
  const previousProgressState = JSON.parse(JSON.stringify(buildLocalProgressData()));
  const previousSyncDirty = state.syncDirty;

  try {
    resetPersistedLocalProgressState();
    applyLocalProgressData(state.pendingProgressImport.data);
    state.screen = "profile";
    markCloudDirty("learning");
    markCloudDirty("preferences");
    markCloudDirty("favorite");
    if (!saveLocalProgress()) {
      throw new Error("导入失败，未能保存完整学习记录");
    }
  } catch (error) {
    Object.assign(state, previousProgressState);
    state.syncDirty = previousSyncDirty;
    throw error;
  }

  state.pendingProgressImport = null;
}

function progressEditionName(edition) {
  return {
    cn: "Uyghur Tili 国内版",
    global: "Ana Tilim 海外版"
  }[edition] || "未知版本";
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

function validateCloudProgressSnapshot(snapshot) {
  const learningProgress = snapshot?.learningProgress || {};
  progressTransfer.validateLearningProgress(learningProgress);
  validateImportedProgressIds({ learningProgress });
}

function applyCloudSnapshot(snapshot) {
  validateCloudProgressSnapshot(snapshot);
  const normalized = window.ANA_TILIM_CLOUD.normalizeSnapshot(snapshot);
  state.learningProgress = normalized.learningProgress;
  state.mistakes = normalized.mistakes;
  state.favorite = normalized.favorite;
  state.dailyActivity = normalized.dailyActivity;
  state.preferences = normalizePreferences(normalized.preferences);
  state.modifiedAt = normalized.modifiedAt;
  state.preferencesUpdatedAt = normalized.preferencesUpdatedAt;
  state.favoriteUpdatedAt = normalized.favoriteUpdatedAt;
  state.syncDirty = false;
}

function emptyLearningProgress() {
  return {
    latinWriting: {},
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
      latinKeyboardValue: state.latinKeyboardValue,
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
  state.latinKeyboardValue = "";
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

function nextCollectionItem(items, currentId) {
  const currentIndex = items.findIndex((item) => item.id === currentId);
  return currentIndex >= 0 ? items[currentIndex + 1] || null : null;
}

function nextAlphabetGroup(groupId) {
  return nextCollectionItem(alphabetGroups, groupId);
}

function nextComboGroup(groupId) {
  return nextCollectionItem(comboGroups, groupId);
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
  return learningUnitOrdinal("combos");
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

function nextVocabCourse(groupId, sectionId) {
  const group = vocabGroups.find((item) => item.id === groupId) || vocabGroups[0];
  const sections = group.sections || [];
  const section = sections.find((item) => item.id === sectionId) || sections[0] || null;
  const nextSection = section ? nextCollectionItem(sections, section.id) : null;
  if (nextSection) {
    return { groupId: group.id, itemId: nextSection.itemIds[0] };
  }

  const nextGroup = nextCollectionItem(vocabGroups, group.id);
  return nextGroup ? { groupId: nextGroup.id, itemId: nextGroup.items[0].id } : null;
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

function nextPracticeGroup(groupId) {
  const courseGroups = practiceGroups.filter((group) => group.mode !== "review");
  return nextCollectionItem(courseGroups, groupId);
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
      unit: learningUnitOrdinal("letters"),
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
      unit: learningUnitOrdinal("letters"),
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
      unit: learningUnitOrdinal("basic-phrases"),
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
          unit: learningUnitTitle(unit.id),
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
  const visibleReadingUnits = learningUnits.filter((unit) => unit.actionTarget === "reading");
  return visibleReadingUnits.find((unit) => unit.id === state.selectedReadingUnitId) || visibleReadingUnits[0];
}

function readingUnitForGroup(groupId) {
  const visibleReadingUnits = learningUnits.filter((unit) => unit.actionTarget === "reading");
  return visibleReadingUnits.find((unit) => unit.groups.some((group) => group.id === groupId)) || visibleReadingUnits[0];
}

function currentReadingGroup() {
  const unit = currentReadingUnit();
  return unit.groups.find((group) => group.id === state.selectedReadingGroupId) || unit.groups[0];
}

function nextReadingGroup(unitId, groupId) {
  const unit = learningUnitById(unitId) || currentReadingUnit();
  return nextCollectionItem(unit.groups, groupId);
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
  return learningUnits.map((unit) => {
    const [unitName, label = unit.title] = unit.title.split("：");
    let completed;
    let total;

    if (unit.id === "letters") {
      completed = countCompleted("letters");
      total = unit.groups.length;
    } else if (unit.id === "latin-keyboard-writing") {
      completed = countCompletedForIds("latinWriting", latinWritingStepIds);
      total = latinWritingStepIds.length;
    } else if (unit.id === "combos") {
      completed = countCompletedForIds("combos", basicComboIds);
      total = basicComboIds.length;
    } else if (unit.id === "basic-phrases") {
      completed = countCompleted("vocab");
      total = unit.groups.length;
    } else {
      completed = unit.groups.filter((group) => state.learningProgress.reading?.[group.id]?.completed).length;
      total = unit.groups.length;
    }

    return {
      unit: unitName,
      label,
      completed,
      total
    };
  });
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
    id: `mistake-${escapeHtml(mistake.key)}`,
    type: escapeHtml(mistake.kindLabel),
    value: escapeHtml(mistake.value),
    latin: escapeHtml(mistake.latin),
    label: escapeHtml(mistake.source),
    hint: escapeHtml(`${mistake.note} ${mistake.help || ""} 错 ${mistake.attempts} 次。`),
    parts: [escapeHtml(mistake.value)],
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
    source: `${learningUnitOrdinal("letters")}错题`,
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

function physicalKeyboardParts(targetValue) {
  const strokes = uyghurKeyboard.keystrokesForText(targetValue);
  const parts = strokes.map((stroke) => stroke.value);

  return parts.join("") === targetValue ? parts : Array.from(targetValue);
}

function keyboardPartLabel(part) {
  return part === " " ? "空格" : part;
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
  const nextStroke = nextPhysicalKeyboardStroke(targetValue);
  const needsShiftToggle = Boolean(nextStroke) && Boolean(state.keyboardShift) !== nextStroke.shifted;
  const nextPartLabel = keyboardPartLabel(guide.nextPart);
  const stepText = guide.isComplete
    ? "已完成"
    : guide.isOffTrack
      ? "先删除错误部分"
      : needsShiftToggle
        ? `第 ${guide.completeCount + 1} 步：先点击 Shift，再点击 ${nextPartLabel}`
        : `第 ${guide.completeCount + 1} 步：点击 ${nextPartLabel}`;
  const inputText = guide.currentValue ? `已输入 ${guide.currentValue}` : "已输入 未输入";
  const countText = guide.isComplete ? "已完成" : `还差 ${guide.remainingCount} 键`;

  return `
    <article class="card keyboard-guide-card">
      <div class="section-row">
        <div>
          <p class="caption">键盘步骤</p>
          <h2 class="section-title">
            <span class="uyghur">${parts.map(keyboardPartLabel).join(" → ")}</span>
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

function nextPhysicalKeyboardStroke(targetValue, currentValue = state.keyboardValue) {
  if (!targetValue.startsWith(currentValue)) return null;
  const strokes = uyghurKeyboard.keystrokesForText(targetValue);
  let consumed = "";

  for (const stroke of strokes) {
    if (consumed === currentValue) return stroke;
    consumed += stroke.value;
  }

  return null;
}

function renderUyghurKeyboard(targetValue = "") {
  const nextStroke = nextPhysicalKeyboardStroke(targetValue);
  const shiftMatchesNextStroke = Boolean(nextStroke) && Boolean(state.keyboardShift) === nextStroke.shifted;
  const needsShiftToggle = Boolean(nextStroke) && !shiftMatchesNextStroke;
  const isSpaceNext = shiftMatchesNextStroke && nextStroke?.code === "Space";
  const isComplete = Boolean(targetValue) && state.keyboardValue === targetValue;
  const [topRow, homeRow, physicalBottomRow] = uyghurKeyboard.rows;
  const bottomRow = physicalBottomRow.filter((key) =>
    ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Slash"].includes(key.code)
  );

  const renderLetterKey = (key) => {
    const output = state.keyboardShift && key.shiftedValue ? key.shiftedValue : key.value;
    const isNext = shiftMatchesNextStroke && nextStroke?.code === key.code;
    return `
      <button
        class="key-button uyghur physical-key ${isNext ? "next-key" : ""}"
        data-action="key"
        data-key="${escapeHtml(output)}"
        data-code="${key.code}"
        data-physical-key="${key.physical}"
        type="button"
        aria-label="${key.physical} 键，输入 ${escapeHtml(output)}"
      >
        <small>${key.physical}</small>
        <strong>${escapeHtml(output)}</strong>
      </button>
    `;
  };

  return `
    <div class="uyghur-keyboard" aria-label="维吾尔语标准键盘">
      <div class="uyghur-keyboard-row row-top">
        ${topRow.map(renderLetterKey).join("")}
      </div>
      <div class="uyghur-keyboard-row row-home">
        ${homeRow.map(renderLetterKey).join("")}
      </div>
      <div class="uyghur-keyboard-row row-bottom">
        <button class="key-button utility keyboard-shift ${state.keyboardShift ? "active" : ""} ${needsShiftToggle ? "next-key" : ""}" data-action="toggle-keyboard-shift" type="button" aria-label="Shift" aria-pressed="${state.keyboardShift}">⇧</button>
        ${bottomRow.map(renderLetterKey).join("")}
        <button class="key-button utility keyboard-backspace" data-action="backspace" type="button" aria-label="删除">⌫</button>
      </div>
      <div class="uyghur-keyboard-tools" aria-label="键盘工具">
        <button class="key-button utility keyboard-space uyghur ${isSpaceNext ? "next-key" : ""}" data-action="key" data-key=" " data-code="Space" data-physical-key="Space" type="button" aria-label="Space 键，输入空格">بوشلۇق</button>
      </div>
    </div>
  `;
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

function renderWritingCanvas(value, label = "手写板", options = {}) {
  const fallbackId = options.fallbackId || "";
  const fallbackMessage = options.fallbackMessage || "";
  const guideVisible = typeof options.guideVisible === "boolean" ? options.guideVisible : state.showGuide;
  const latinWritingHooks = options.latinWritingHooks === true;

  return `
    <div
      class="writing-pad ${guideVisible ? "" : "hide-guide"}"
      aria-label="${escapeHtml(label)}"
      ${latinWritingHooks ? "data-latin-writing-pad" : ""}
    >
      <span class="uyghur guide" ${latinWritingHooks ? "data-latin-writing-guide" : ""}>${escapeHtml(displayStandaloneLetterGlyph(value))}</span>
      <canvas
        class="writing-canvas"
        data-writing-canvas
        ${latinWritingHooks ? "data-latin-writing-canvas" : ""}
        ${latinWritingHooks ? 'data-writing-unavailable-selector="[data-latin-writing-canvas-only]"' : ""}
        ${fallbackId ? `data-writing-fallback-id="${escapeHtml(fallbackId)}"` : ""}
        width="640"
        height="360"
        aria-label="${escapeHtml(label)}"
      ></canvas>
      ${
        fallbackId && fallbackMessage
          ? `<p class="writing-canvas-fallback" id="${escapeHtml(fallbackId)}" hidden>${escapeHtml(fallbackMessage)}</p>`
          : ""
      }
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
  state.keyboardShift = false;
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
  return learningUnitById(state.selectedUnitId) || learningUnits[0];
}

function homeLearningUnit() {
  const hasCompletedLearning = totalLearningProgress().completed > 0;
  const hasMistakes = Array.isArray(state.mistakes) && state.mistakes.length > 0;
  return hasCompletedLearning || hasMistakes ? currentUnit() : learningUnits[0];
}

function currentUnitExperience(unitId = currentUnit().id) {
  const base = unitExperience[unitId] || unitExperience.letters;
  const nextId = unitOrder.nextUnitId(unitId, learningUnits);
  if (!nextId) {
    return { ...base, nextLabel: "回到学习路径", nextTarget: "learn", nextUnitId: null };
  }
  const next = learningUnits.find((unit) => unit.id === nextId);
  return {
    ...base,
    nextLabel: `进入${next.title.split("：")[0]}`,
    nextTarget: "unit",
    nextUnitId: nextId
  };
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

function renderAudioButton({ audio, label, className = "", accessibleLabel = "播放发音" }) {
  const canPlay = isAudioPlayable(audio);
  const classes = ["play-dot", className, canPlay ? "" : "disabled"].filter(Boolean).join(" ");

  return `
    <button
      class="${escapeHtml(classes)}"
      data-action="play-audio"
      data-audio-src="${escapeHtml(canPlay ? audio.outputPath : "")}"
      data-audio-label="${escapeHtml(label)}"
      type="button"
      ${canPlay ? "" : "disabled"}
      aria-label="${escapeHtml(accessibleLabel)}"
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

function renderAudioFocus({ audio, label, title, hint, hideFile = false, hideCaption = false, buttonOnly = false, className = "" }) {
  const canPlay = isAudioPlayable(audio);
  const audioInfo = canPlay ? (hideFile ? `${audio.statusLabel}。` : `${audio.statusLabel}：${audio.file}。`) : "";
  const caption = hideCaption ? "" : canPlay ? `${audioInfo}${hint}` : "音频待录，暂不播放。";
  const classes = ["letter-focus", "audio-focus", buttonOnly ? "audio-only-focus" : "", className].filter(Boolean).join(" ");

  if (buttonOnly) {
    return `
      <div class="${classes}">
        ${renderAudioButton({ audio, label, className: "letter-focus-play" })}
      </div>
    `;
  }

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

function renderContinueCourseButton(options = {}) {
  const { action, id, unitId = "", itemId = "" } = options || {};
  if (!action || !id) return "";
  const attributes = [
    `data-action="${action}"`,
    unitId ? `data-unit-id="${unitId}"` : "",
    `data-id="${id}"`,
    itemId ? `data-item-id="${itemId}"` : ""
  ]
    .filter(Boolean)
    .join(" ");

  return `<button class="primary-button continue-course-button" ${attributes} type="button">继续学习本单元下一课程</button>`;
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
    const fallbackId = canvas.dataset?.writingFallbackId || "";
    const fallback = fallbackId ? document.querySelector?.(`#${fallbackId}`) : null;
    const unavailableSelector = canvas.dataset?.writingUnavailableSelector || "";
    const canvasOnlyControls = unavailableSelector
      ? document.querySelectorAll?.(unavailableSelector) || []
      : [];
    if (!context || !canvas.getBoundingClientRect) {
      canvas.hidden = true;
      if (fallback) {
        fallback.hidden = false;
      }
      canvasOnlyControls.forEach((control) => {
        control.hidden = true;
      });
      return;
    }

    canvas.hidden = false;
    if (fallback) {
      fallback.hidden = true;
    }
    canvasOnlyControls.forEach((control) => {
      control.hidden = false;
    });

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

function render({ persist = true } = {}) {
  if (state.screen === "settings") {
    state.screen = "profile";
  }

  const screens = {
    welcome: renderWelcome,
    home: renderHome,
    learn: renderLearnPath,
    unit: renderUnitDetail,
    latinKeyboardIntro: renderLatinKeyboardIntro,
    latinLetterClasses: renderLatinLetterClasses,
    latinVowelCompare: renderLatinVowelCompare,
    latinDictation: renderLatinDictation,
    latinWritingForms: renderLatinWritingForms,
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
  if (persist && !state.pendingProgressImport) {
    saveLocalProgress();
  }
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
        <img class="brand-mark" src="${escapeHtml(appConfig.logoPath)}" alt="${escapeHtml(appConfig.brandName)} logo" />
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
  if (!appConfig.cloudEnabled) {
    return "";
  }

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

  const isRegistering = state.authMode === "register";
  return `
    <div class="password-auth-shell">
      <div class="auth-mode-tabs" role="tablist" aria-label="账号登录方式">
        <button
          class="auth-mode-tab ${isRegistering ? "" : "active"}"
          data-action="switch-auth-mode"
          data-mode="login"
          role="tab"
          aria-selected="${!isRegistering}"
          type="button"
        >登录</button>
        <button
          class="auth-mode-tab ${isRegistering ? "active" : ""}"
          data-action="switch-auth-mode"
          data-mode="register"
          role="tab"
          aria-selected="${isRegistering}"
          type="button"
        >注册</button>
      </div>
      <div class="password-auth-fields">
        ${
          isRegistering
            ? `
              <label class="auth-field">
                <span>昵称</span>
                <input id="password-auth-name" type="text" autocomplete="name" maxlength="40" placeholder="你的学习名称" />
              </label>
            `
            : ""
        }
        <label class="auth-field">
          <span>邮箱</span>
          <input id="password-auth-email" type="email" autocomplete="email" value="${escapeHtml(state.authEmail)}" placeholder="name@example.com" />
        </label>
        <label class="auth-field">
          <span>密码</span>
          <input id="password-auth-password" type="password" autocomplete="${isRegistering ? "new-password" : "current-password"}" minlength="8" placeholder="至少 8 个字符" />
        </label>
        ${
          isRegistering
            ? `
              <label class="auth-field">
                <span>确认密码</span>
                <input id="password-auth-confirm" type="password" autocomplete="new-password" minlength="8" placeholder="再次输入密码" />
              </label>
              <p class="auth-warning">当前暂不支持邮件找回密码，请保存好密码。</p>
            `
            : ""
        }
        <button class="primary-button" data-action="${isRegistering ? "password-register" : "password-login"}" type="button">
          ${isRegistering ? "注册并开始学习" : "登录并继续学习"}
        </button>
      </div>
    </div>
    <div class="auth-divider" aria-hidden="true"><span>其他方式</span></div>
    <div class="auth-actions">
      <button class="primary-button" data-action="cloud-google-login" type="button">
        使用 Google 登录
      </button>
      <button class="secondary-button" data-action="show-email-login" type="button">
        使用邮箱验证码
      </button>
    </div>
    ${
      state.emailAuthExpanded
        ? `
          <div class="email-auth-fields">
            <label class="auth-field">
              <span>邮箱</span>
              <input id="auth-email" type="email" autocomplete="email" value="${escapeHtml(state.authEmail)}" placeholder="name@example.com" />
            </label>
            ${
              state.emailCodeSent
                ? `
                  <label class="auth-field">
                    <span>6 位验证码</span>
                    <input id="auth-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" />
                  </label>
                  <button class="primary-button" data-action="verify-email-otp" type="button">确认登录</button>
                `
                : `<button class="primary-button" data-action="request-email-otp" type="button">发送验证码</button>`
            }
          </div>
        `
        : ""
    }
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
      <div class="hero-content ${appConfig.cloudEnabled ? "with-auth" : "local-only"}">
        <div class="hero-intro">
          <img class="hero-logo" src="${escapeHtml(appConfig.logoPath)}" alt="${escapeHtml(appConfig.brandName)} logo" />
          <h1>${escapeHtml(appConfig.brandName)}</h1>
          <div class="uyghur uyghur-title">${escapeHtml(appConfig.brandNameUyghur)}</div>
          <p class="hero-copy">
            从字母、发音、书写到键盘输入，一步一步学会自己的母语。
          </p>
          <button class="primary-button" data-action="continue-local" type="button">
            ${accountEmail ? "继续学习" : appConfig.cloudEnabled ? "直接开始学习" : "开始学习"}
          </button>
          ${
            appConfig.cloudEnabled
              ? ""
              : `<p class="caption local-backup-note">学习记录保存在当前设备，可在‘我的’页面导出备份</p>`
          }
        </div>

        ${
          appConfig.cloudEnabled
            ? `<div class="auth-disclosure">
                <button
                  class="secondary-button auth-panel-toggle"
                  data-action="toggle-auth-panel"
                  aria-expanded="${state.authPanelExpanded}"
                  aria-controls="welcome-auth-panel"
                  type="button"
                >${accountEmail ? "查看同步状态" : "可选：登录后跨设备同步"}</button>
                <div class="auth-panel-region" id="welcome-auth-panel" ${state.authPanelExpanded ? "" : "hidden"}>
                  ${
                    state.authPanelExpanded
                      ? `<article class="card auth-panel">
                          <div>
                            <p class="caption">登录后自动同步</p>
                            <h2 class="section-title">${accountEmail ? "学习记录已同步" : "保存你的学习进度"}</h2>
                            <p class="muted">${accountEmail ? `已登录 ${escapeHtml(accountEmail)}` : "换设备也能继续学习；不登录不会影响课程使用。"}</p>
                          </div>
                          ${renderCloudAuthControls()}
                        </article>`
                      : ""
                  }
                </div>
              </div>`
            : ""
        }
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
        learningUnitTitle("letters"),
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
                  class="${["choice-card", "letter-only-choice", resultClass].filter(Boolean).join(" ")}"
                  data-action="pick-picture"
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
                  ? "答对了。"
                  : "再看点位和点数，然后重新选择。"
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
          hint: "音频未生成时，先用转写提示做读音选择练习。",
          buttonOnly: true
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
  const keyboardParts = physicalKeyboardParts(letter.letter);

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
        ${renderUyghurKeyboard(letter.letter)}
        ${
          hasInput
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? "输入正确。你已经完成这一课。"
                  : `继续输入，目标字母是 ${displayStandaloneLetterGlyph(letter.letter)}。`
              }</div>`
            : `<div class="feedback">提示：按顺序点击 <span class="uyghur">${keyboardParts.map(keyboardPartLabel).join("、")}</span>，橙色键是下一步。</div>`
        }
        <button class="primary-button" data-action="go" data-target="complete" type="button" ${isCorrect ? "" : "disabled"}>
          完成课程
        </button>
      </section>
    `,
    "learn"
  );
}

function renderLatinKeyboardIntro() {
  const targetValue = "qwerty";
  const isComplete = state.latinKeyboardValue === targetValue;

  return screen(
    `
      ${topBar(
        "普通拉丁 QWERTY",
        learningUnitTitle("latin-keyboard-writing"),
        "",
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card latin-keyboard-target">
          <p class="caption">目标</p>
          <strong dir="ltr">${targetValue}</strong>
          <p>用普通拉丁键位按顺序输入；大写字母会按小写记录。</p>
        </article>
        <input
          class="latin-keyboard-input"
          value="${escapeHtml(state.latinKeyboardValue)}"
          aria-label="普通拉丁输入框"
          readonly
          dir="ltr"
        />
        <div class="latin-keyboard" aria-label="普通拉丁 QWERTY 键盘">
          ${latinKeyboard.ROWS.map(
            (row) => `
              <div class="latin-keyboard-row">
                ${Array.from(row)
                  .map(
                    (key) => `<button class="key-button" data-action="latin-key" data-key="${key}" type="button">${key.toUpperCase()}</button>`
                  )
                  .join("")}
              </div>
            `
          ).join("")}
          <div class="latin-keyboard-extended" aria-label="拉丁扩展键">
            ${latinKeyboard.EXTENDED_KEYS.map(
              (key) => `<button class="key-button" data-action="latin-extended-key" data-key="${key}" type="button">${key}</button>`
            ).join("")}
          </div>
          <div class="latin-keyboard-tools">
            <button class="key-button utility" data-action="latin-backspace" type="button" aria-label="Backspace">Backspace</button>
            <button class="key-button utility latin-keyboard-space" data-action="latin-space" type="button" aria-label="Space">Space</button>
          </div>
        </div>
        <div class="feedback ${isComplete ? "good" : ""}">
          ${isComplete ? "输入完全一致。普通拉丁 QWERTY 已完成。" : "只有输入完全等于 qwerty 时才会完成。"}
        </div>
        <div class="action-grid">
          <button class="secondary-button" data-action="go" data-target="unit" type="button">返回本单元</button>
          <button class="secondary-button" data-action="go" data-target="home" type="button">回到首页</button>
          ${isComplete ? `<button class="primary-button" data-action="go" data-target="latinLetterClasses" type="button">继续：元辅音分类</button>` : ""}
        </div>
      </section>
    `,
    "learn"
  );
}

function renderLatinTeachingTarget(value, className = "") {
  const classes = ["latin-letter-uly", className].filter(Boolean).join(" ");
  return `<span class="${escapeHtml(classes)}" dir="ltr">${escapeHtml(value)}</span>`;
}

function renderLatinLetterAudio(audio, label, accessibleLabel) {
  return `
    ${renderAudioButton({ audio, label, className: "latin-letter-audio", accessibleLabel })}
    ${isAudioPlayable(audio) ? "" : `<span class="latin-letter-audio-status">音频待录</span>`}
  `;
}

function renderLatinLetterCard(letterId, letterClass) {
  const letter = letterDetails[letterId];
  if (!letter) return "";
  const audio = alphabetAudioByLetterId[letterId] || null;

  return `
    <article
      class="latin-letter-card"
      data-letter-class="${escapeHtml(letterClass)}"
      data-letter-id="${escapeHtml(letter.id)}"
      data-has-forms="${Array.isArray(letter.forms) && letter.forms.length > 0}"
    >
      ${renderLatinLetterAudio(audio, letter.letter, `播放 ${letter.letter}，ULY ${letter.latin}`)}
      <strong class="uyghur latin-letter-glyph">${escapeHtml(letter.letter)}</strong>
      ${renderLatinTeachingTarget(letter.latin)}
      <p class="latin-letter-cue">${escapeHtml(letter.cue)}</p>
    </article>
  `;
}

function renderLatinVowelComparisonCard(letterId, comparison) {
  const letter = letterDetails[letterId];
  if (!letter) return "";
  const audio = alphabetAudioByLetterId[letterId] || null;

  return `
    <article class="latin-vowel-comparison-card" data-comparison-id="${escapeHtml(comparison.id)}" data-letter-id="${escapeHtml(letter.id)}">
      ${renderLatinLetterAudio(audio, letter.letter, `播放 ${letter.letter}，ULY ${letter.latin}`)}
      <strong class="uyghur latin-letter-glyph">${escapeHtml(letter.letter)}</strong>
      ${renderLatinTeachingTarget(letter.latin)}
      <p class="latin-vowel-focus">辨认重点：${escapeHtml(comparison.focus)}</p>
    </article>
  `;
}

function renderLatinLetterClasses() {
  return screen(
    `
      ${topBar(
        "元音和辅音",
        learningUnitTitle("latin-keyboard-writing"),
        "",
        `<button class="back-button" data-action="go" data-target="latinKeyboardIntro" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack latin-letter-classes">
        <section class="latin-letter-class-section" data-letter-section="vowel" aria-labelledby="latin-vowels-title">
          <div class="section-row">
            <div>
              <p class="caption">8 个元音</p>
              <h2 class="section-title" id="latin-vowels-title">元音</h2>
            </div>
            <span class="step-state">8 张</span>
          </div>
          <div class="latin-letter-grid">
            ${latinWriting.vowelLetterIds.map((letterId) => renderLatinLetterCard(letterId, "vowel")).join("")}
          </div>
        </section>
        <section class="latin-letter-class-section" data-letter-section="consonant" aria-labelledby="latin-consonants-title">
          <div class="section-row">
            <div>
              <p class="caption">24 个辅音</p>
              <h2 class="section-title" id="latin-consonants-title">辅音</h2>
            </div>
            <span class="step-state">24 张</span>
          </div>
          <div class="latin-letter-grid">
            ${latinWriting.consonantLetterIds.map((letterId) => renderLatinLetterCard(letterId, "consonant")).join("")}
          </div>
        </section>
        <button class="primary-button" data-action="complete-latin-classification" type="button">
          完成分类，开始元音辨认
        </button>
      </section>
    `,
    "learn"
  );
}

function renderLatinVowelCompare() {
  const comparisonCount = latinWriting.vowelComparisons.length;
  const comparisonIndex = Math.max(0, Math.min(comparisonCount - 1, state.latinVowelComparisonIndex));
  const comparison = latinWriting.vowelComparisons[comparisonIndex];
  const stageComplete = Boolean(state.learningProgress.latinWriting?.["vowel-contrast"]?.completed);

  return screen(
    `
      ${topBar(
        "元音辨认",
        learningUnitTitle("latin-keyboard-writing"),
        "",
        `<button class="back-button" data-action="go" data-target="latinLetterClasses" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack latin-vowel-compare" data-comparison-id="${escapeHtml(comparison.id)}">
        ${renderItemProgress(`${comparisonIndex + 1} / ${comparisonCount}`, "每次只比较一组元音")}
        <div class="latin-vowel-comparison-grid">
          ${comparison.letterIds
            .map((letterId) => renderLatinVowelComparisonCard(letterId, comparison))
            .join("")}
        </div>
        <div class="adjacent-nav" aria-label="元音比较前后切换">
          <button
            class="secondary-button"
            data-action="navigate-latin-vowel-comparison"
            data-direction="previous"
            type="button"
            ${comparisonIndex === 0 ? "disabled" : ""}
          >上一组</button>
          <button
            class="secondary-button"
            data-action="navigate-latin-vowel-comparison"
            data-direction="next"
            type="button"
            ${comparisonIndex === comparisonCount - 1 ? "disabled" : ""}
          >下一组</button>
        </div>
        ${
          comparisonIndex === comparisonCount - 1
            ? `<button class="primary-button" data-action="complete-latin-vowel-comparison" type="button">完成元音辨认</button>`
            : ""
        }
        ${
          stageComplete
            ? `<article class="card latin-stage-complete"><strong>本阶段完成</strong><p>已完成 QWERTY、元辅音分类和元音辨认。</p><button class="secondary-button" data-action="go" data-target="unit" type="button">返回本单元</button></article>`
            : ""
        }
      </section>
    `,
    "learn"
  );
}

const latinDictationLetterIds = Object.freeze([
  ...latinWriting.vowelLetterIds,
  ...latinWriting.consonantLetterIds
]);

function currentLatinDictationLetter() {
  const lastIndex = latinDictationLetterIds.length - 1;
  const index = Math.max(0, Math.min(lastIndex, state.latinDictationIndex));
  return letterDetails[latinDictationLetterIds[index]];
}

function renderLatinDictationAnswer(letter) {
  const forms = Array.isArray(letter.forms) ? letter.forms : [];

  return `
    <article class="latin-dictation-answer card" aria-label="默写自我检查">
      <p class="caption">标准字形</p>
      <strong class="uyghur latin-dictation-answer-glyph">${escapeHtml(letter.letter)}</strong>
      <p class="latin-dictation-self-check">我自己比较，不是自动判分</p>
      <div class="section-row">
        <h3>字母形式参考</h3>
        <span class="step-state">${forms.length} 项</span>
      </div>
      <div class="latin-dictation-forms">
        ${forms
          .map(
            (form) => `
              <div class="latin-dictation-form">
                <span>${escapeHtml(form.label)}</span>
                <strong class="uyghur">${escapeHtml(form.value)}</strong>
              </div>
            `
          )
          .join("")}
      </div>
      <button
        class="secondary-button"
        data-action="open-latin-writing-forms"
        data-letter-id="${escapeHtml(letter.id || "")}"
        type="button"
      >练习这个字母的全部形式</button>
    </article>
  `;
}

function revealLatinDictationAnswer() {
  const letter = currentLatinDictationLetter();
  state.latinDictationRevealed = true;
  markProgress("latinWriting", "dictation", "completed");

  const answerRegion = document.querySelector?.("[data-latin-dictation-answer-region]");
  if (answerRegion) {
    if (answerRegion.innerHTML) {
      answerRegion.innerHTML = "";
    }
    answerRegion.hidden = false;
    const insertAnswer = () => {
      answerRegion.innerHTML = renderLatinDictationAnswer(letter);
    };
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(insertAnswer);
    } else {
      window.setTimeout(insertAnswer, 0);
    }
    saveLocalProgress();
    return;
  }

  render();
}

function renderLatinDictation() {
  const letter = currentLatinDictationLetter();
  const lastIndex = latinDictationLetterIds.length - 1;
  const index = Math.max(0, Math.min(lastIndex, state.latinDictationIndex));

  return screen(
    `
      ${topBar(
        "ULY 提示默写",
        learningUnitTitle("latin-keyboard-writing"),
        "",
        `<button class="back-button" data-action="go" data-target="latinVowelCompare" type="button" aria-label="返回">←</button>`
      )}
      <section
        class="stack latin-dictation"
        data-latin-dictation-exercise
        data-letter-id="${escapeHtml(letter.id)}"
      >
        ${renderItemProgress(`${index + 1} / ${latinDictationLetterIds.length}`, "看 ULY 写维吾尔字母")}
        <article class="card latin-dictation-prompt">
          <p class="caption">ULY 提示</p>
          ${renderLatinTeachingTarget(letter.latin, "latin-dictation-uly")}
          <p>先在画布中自由书写，再揭晓标准字形进行自我比较。</p>
        </article>
        <article class="card latin-dictation-writing">
          <p class="caption">自由书写</p>
          ${renderWritingCanvas("", "ULY 默写手写板", {
            fallbackId: "latin-dictation-canvas-fallback",
            fallbackMessage: "当前浏览器不能自由书写，仍可查看标准字形和字母形式参考"
          })}
          <div class="action-grid">
            <button class="secondary-button" data-action="clear-canvas" type="button">清空画布</button>
            <button class="primary-button" data-action="reveal-latin-dictation-answer" type="button">揭晓标准字形</button>
          </div>
          <div
            data-latin-dictation-answer-region
            aria-live="polite"
            aria-atomic="true"
            ${state.latinDictationRevealed ? "" : "hidden"}
          >
            ${state.latinDictationRevealed ? renderLatinDictationAnswer(letter) : ""}
          </div>
        </article>
        <div class="action-grid latin-dictation-navigation">
          <button class="secondary-button" data-action="go" data-target="unit" type="button">返回本单元</button>
          <button class="primary-button" data-action="next-latin-dictation" type="button">下一题</button>
        </div>
      </section>
    `,
    "learn"
  );
}

function currentLatinWritingLetter() {
  const letterId = latinDictationLetterIds.includes(state.latinWritingLetterId)
    ? state.latinWritingLetterId
    : latinDictationLetterIds[0];
  return letterDetails[letterId];
}

function currentLatinWritingForm() {
  const letter = currentLatinWritingLetter();
  const forms = Array.isArray(letter.forms) ? letter.forms : [];
  const lastIndex = Math.max(0, forms.length - 1);
  const index = Math.max(0, Math.min(lastIndex, Number(state.latinWritingForm) || 0));
  return { letter, forms, index, form: forms[index] || { label: "", value: letter.letter } };
}

function renderLatinWritingComparison(letter, form) {
  return `
    <article class="latin-writing-comparison card" aria-label="字母形式自我对照">
      <p class="caption">标准形式 · <span data-latin-writing-comparison-label>${escapeHtml(form.label)}</span></p>
      <strong class="uyghur latin-writing-comparison-glyph" data-latin-writing-comparison-glyph>${escapeHtml(form.value)}</strong>
      <p>保留画布上的笔迹，自己对照形状与连接位置，不做自动判分。</p>
      <p class="caption">${escapeHtml(letter.writingHint)}</p>
    </article>
  `;
}

function updateLatinWritingFormView() {
  const { forms, index, form } = currentLatinWritingForm();
  state.latinWritingForm = index;

  const referenceGlyph = document.querySelector?.("[data-latin-writing-reference-glyph]");
  const guideGlyph = document.querySelector?.("[data-latin-writing-guide]");
  const referenceLabel = document.querySelector?.("[data-latin-writing-reference-label]");
  const formCount = document.querySelector?.("[data-latin-writing-form-count]");
  const canvas = document.querySelector?.("[data-latin-writing-canvas]");
  const panel = document.querySelector?.("[data-latin-writing-panel]");
  if (referenceGlyph) referenceGlyph.textContent = form.value;
  if (guideGlyph) guideGlyph.textContent = form.value;
  if (referenceLabel) referenceLabel.textContent = form.label;
  if (formCount) formCount.textContent = `${index + 1} / ${forms.length}`;
  canvas?.setAttribute?.("aria-label", `${form.label} 手写板`);
  panel?.setAttribute?.("aria-labelledby", `latin-writing-tab-${currentLatinWritingLetter().id}-${index}`);

  document.querySelectorAll?.("[data-latin-writing-form-tab]").forEach((tab, tabIndex) => {
    const selected = tabIndex === index;
    tab.setAttribute?.("aria-selected", selected ? "true" : "false");
    tab.setAttribute?.("tabindex", selected ? "0" : "-1");
    tab.classList?.toggle("active", selected);
  });

  if (state.latinWritingComparisonRevealed) {
    const comparisonRegion = document.querySelector?.("[data-latin-writing-comparison-region]");
    if (comparisonRegion) {
      const { letter } = currentLatinWritingForm();
      comparisonRegion.innerHTML = renderLatinWritingComparison(letter, form);
    }
  }
}

function toggleLatinWritingGuide() {
  state.latinWritingGuideVisible = !state.latinWritingGuideVisible;
  const pad = document.querySelector?.("[data-latin-writing-pad]");
  const guide = document.querySelector?.("[data-latin-writing-guide]");
  const button = document.querySelector?.("[data-latin-writing-guide-toggle]");
  pad?.classList?.toggle("hide-guide", !state.latinWritingGuideVisible);
  guide?.setAttribute?.("aria-hidden", state.latinWritingGuideVisible ? "false" : "true");
  if (button) {
    button.textContent = state.latinWritingGuideVisible ? "隐藏参考" : "显示参考";
    button.setAttribute?.("aria-pressed", state.latinWritingGuideVisible ? "true" : "false");
  }
}

function revealLatinWritingComparison() {
  state.latinWritingComparisonRevealed = true;
  markProgress("latinWriting", "forms", "completed");
  const comparisonRegion = document.querySelector?.("[data-latin-writing-comparison-region]");
  if (comparisonRegion) {
    if (comparisonRegion.innerHTML) {
      comparisonRegion.innerHTML = "";
    }
    comparisonRegion.hidden = false;
    const insertComparison = () => {
      const { letter, form } = currentLatinWritingForm();
      comparisonRegion.innerHTML = renderLatinWritingComparison(letter, form);
    };
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(insertComparison);
    } else {
      window.setTimeout(insertComparison, 0);
    }
    saveLocalProgress();
    return;
  }
  render();
}

function renderLatinWritingForms() {
  const { letter, forms, index, form } = currentLatinWritingForm();
  const panelId = `latin-writing-panel-${letter.id}`;

  return screen(
    `
      ${topBar(
        "字母形式书写参考",
        learningUnitTitle("latin-keyboard-writing"),
        "",
        `<button class="back-button" data-action="go" data-target="latinDictation" type="button" aria-label="返回默写题">←</button>`
      )}
      <section class="stack latin-writing-forms" data-latin-writing-forms data-letter-id="${escapeHtml(letter.id)}">
        <article class="card latin-writing-reference-card">
          <div class="section-row">
            <div>
              <p class="caption">ULY ${escapeHtml(letter.latin)}</p>
              <h2>${escapeHtml(letter.latin)} · ${forms.length} 项真实形式</h2>
            </div>
            <span class="step-state" data-latin-writing-form-count>${index + 1} / ${forms.length}</span>
          </div>
          <div class="latin-writing-form-tabs" role="tablist" aria-label="${escapeHtml(letter.latin)} 字母形式">
            ${forms
              .map(
                (item, formIndex) => `
                  <button
                    id="${escapeHtml(`latin-writing-tab-${letter.id}-${formIndex}`)}"
                    class="latin-writing-form-tab ${formIndex === index ? "active" : ""}"
                    data-action="select-latin-writing-form"
                    data-latin-writing-form-tab
                    data-form-index="${formIndex}"
                    role="tab"
                    aria-selected="${formIndex === index ? "true" : "false"}"
                    aria-controls="${escapeHtml(panelId)}"
                    aria-label="${escapeHtml(`${item.label} ${item.value}`)}"
                    tabindex="${formIndex === index ? "0" : "-1"}"
                    type="button"
                  >
                    <span>${escapeHtml(item.label)}</span>
                    <strong class="uyghur">${escapeHtml(item.value)}</strong>
                  </button>
                `
              )
              .join("")}
          </div>
          <div
            class="latin-writing-current-reference"
            id="${escapeHtml(panelId)}"
            role="tabpanel"
            aria-labelledby="${escapeHtml(`latin-writing-tab-${letter.id}-${index}`)}"
            data-latin-writing-panel
          >
            <span data-latin-writing-reference-label>${escapeHtml(form.label)}</span>
            <strong class="uyghur" data-latin-writing-reference-glyph>${escapeHtml(form.value)}</strong>
          </div>
          <p>${escapeHtml(letter.writingHint)}</p>
        </article>
        <article class="card latin-writing-practice-card">
          <p class="caption" data-latin-writing-canvas-only>自由书写</p>
          ${renderWritingCanvas(form.value, `${form.label} 手写板`, {
            fallbackId: "latin-writing-canvas-fallback",
            fallbackMessage: "当前浏览器不能自由书写，仍可切换真实字母形式并揭晓对照",
            guideVisible: state.latinWritingGuideVisible,
            latinWritingHooks: true
          })}
          <div class="action-grid latin-writing-controls">
            <button
              class="secondary-button"
              data-action="toggle-latin-writing-guide"
              data-latin-writing-guide-toggle
              data-latin-writing-canvas-only
              aria-pressed="${state.latinWritingGuideVisible ? "true" : "false"}"
              type="button"
            >${state.latinWritingGuideVisible ? "隐藏参考" : "显示参考"}</button>
            <button class="secondary-button" data-action="clear-latin-writing-canvas" data-latin-writing-canvas-only type="button">清空重写</button>
            <button class="primary-button" data-action="reveal-latin-writing-comparison" type="button">揭晓对照</button>
          </div>
          <div
            data-latin-writing-comparison-region
            aria-live="polite"
            aria-atomic="true"
            ${state.latinWritingComparisonRevealed ? "" : "hidden"}
          >${state.latinWritingComparisonRevealed ? renderLatinWritingComparison(letter, form) : ""}</div>
        </article>
        <button class="secondary-button" data-action="go" data-target="latinDictation" type="button">返回同一道默写题</button>
      </section>
    `,
    "learn"
  );
}

function renderComplete() {
  const group = currentGroup();
  const nextGroup = nextAlphabetGroup(group.id);
  const letter = currentLetter();
  const groupLetters = group.letters.map((item) => displayStandaloneLetterGlyph(item.letter)).join(" / ");
  const loop = letterLoopProgress(group.id);
  const groupMistakes = state.mistakes.filter((item) => item.kind === "letter" && group.letters.some((letterItem) => letterItem.id === item.targetId)).length;

  return screen(
    `
      ${topBar("课程完成", `${learningUnitOrdinal("letters")}完成`)}
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
        ${renderContinueCourseButton(nextGroup ? { action: "open-group", id: nextGroup.id } : null)}
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
  const keyboardParts = physicalKeyboardParts(item.value);

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
        ${renderUyghurKeyboard(item.value)}
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
  const nextGroup = nextComboGroup(group.id);
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
        ${renderContinueCourseButton(nextGroup ? { action: "open-combo-group", id: nextGroup.id } : null)}
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
      <div class="vocab-word-cell">
        ${renderAudioWord({ value: item.value, audio })}
      </div>
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

  return screen(
    `
      ${topBar(
        group.title,
        learningUnitTitle("basic-phrases"),
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
  const keyboardParts = physicalKeyboardParts(item.value);

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
        ${renderUyghurKeyboard(item.value)}
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
  const nextCourse = nextVocabCourse(group.id, section?.id);
  const groupValues = sectionItems.map((choice) => choice.value).join(" / ");

  return screen(
    `
      ${topBar(`${learningUnitOrdinal("basic-phrases")}完成`, group.title)}
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
        ${renderContinueCourseButton(
          nextCourse
            ? { action: "open-vocab-course", id: nextCourse.groupId, itemId: nextCourse.itemId }
            : null
        )}
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
          ${renderSentenceGlosses(item.value)}
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
        ${renderSentenceGlosses(item.value)}
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
        ${renderSentenceGlosses(item.value)}
      </div>
    </article>
  `;
}

function renderGlossSegments(segments, formation = null) {
  if (!segments?.length) return "";

  return `
    <div class="morpheme-breakdown">
      <div class="morpheme-glosses" aria-label="词素拆解" dir="rtl">
        ${segments
          .map(
            (segment) => `
              <span class="morpheme-gloss" data-morpheme="${escapeHtml(segment.word)}">
                <b class="uyghur" dir="rtl">${escapeHtml(segment.word)}</b>
                <small dir="ltr">${escapeHtml(segment.latin)}</small>
                <em dir="ltr">${escapeHtml(segment.meaning)}</em>
              </span>
            `
          )
          .join('<span class="morpheme-direction" aria-hidden="true">←</span>')}
      </div>
      ${
        formation
          ? `
            <div class="morpheme-formation">
              <b class="uyghur" dir="rtl">${escapeHtml(formation.formula)}</b>
              <small dir="ltr">${escapeHtml(formation.note)}</small>
            </div>
          `
          : ""
      }
    </div>
  `;
}

function renderSentenceGlosses(value) {
  const glosses = sentenceGlossary.glossSentence(value);
  const hasBreakdown = glosses.some((gloss) => gloss.segments?.length);
  if (!glosses.length || (glosses.length === 1 && !hasBreakdown)) return "";

  return `
    <details class="sentence-gloss" open>
      <summary>
        <span>逐词与词素参考</span>
        <span class="gloss-direction">从右向左理解 ←</span>
      </summary>
      <p>维语和汉语语序不同，下列词义用于理解结构，不表示逐字位置完全对应。</p>
      <div class="word-glosses" dir="rtl">
        ${glosses
          .map(
            (gloss) => `
              <span class="word-gloss ${gloss.formation ? "has-formation" : ""}" data-gloss-word="${escapeHtml(gloss.word)}">
                <b class="uyghur" dir="rtl">${escapeHtml(gloss.word)}</b>
                <small dir="ltr">${escapeHtml(gloss.latin)}</small>
                <em dir="ltr">${escapeHtml(gloss.meaning)}</em>
                ${renderGlossSegments(gloss.segments, gloss.formation)}
              </span>
            `
          )
          .join("")}
      </div>
    </details>
  `;
}

function renderReadingLesson() {
  const unit = currentReadingUnit();
  const group = currentReadingGroup();
  const nextGroup = nextReadingGroup(unit.id, group.id);

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
        ${renderContinueCourseButton(
          nextGroup ? { action: "open-reading-group", id: nextGroup.id, unitId: unit.id } : null
        )}
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
    return `
      <input
        class="rtl-input uyghur"
        value="${state.keyboardValue}"
        aria-label="字母练习维吾尔语输入框"
        readonly
        dir="rtl"
      />
      ${renderUyghurKeyboard(item.value)}
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
  const nextGroup = isReviewPractice ? null : nextPracticeGroup(group.id);
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
        ${renderContinueCourseButton(nextGroup ? { action: "open-practice-group", id: nextGroup.id } : null)}
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
      ${topBar("字母库", `${learningUnitOrdinal("letters")}全部字母`)}
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
  const usingCloudProfile = Boolean(appConfig.cloudEnabled && accountEmail);
  const avatarUrl = usingCloudProfile ? accountProfile.avatarUrl : state.localProfile.avatarDataUrl;
  const displayName =
    (usingCloudProfile ? accountProfile.displayName : state.localProfile.displayName) ||
    `${appConfig.brandName} 学习者`;
  const avatarContent = avatarUrl
    ? `<img src="${escapeHtml(avatarUrl)}" alt="学习头像" />`
    : `<span aria-hidden="true">${appConfig.brandName === "Ana Tilim" ? "AT" : "UT"}</span>`;

  return `
    <article class="card profile-hero-card">
      <div class="profile-identity">
        <div class="profile-avatar-picker">
          <div class="profile-avatar">${avatarContent}</div>
          <label class="profile-avatar-action">
            <input
              id="profile-avatar-input"
              type="file"
              accept="image/*"
              aria-label="从相册选择头像"
              ${state.avatarUploading ? "disabled" : ""}
            />
            <span>${state.avatarUploading ? "上传中…" : "选择头像"}</span>
          </label>
        </div>
        <div class="profile-account">
          <p class="caption">${usingCloudProfile ? "学习账号" : "本地学习"}</p>
          ${renderProfileNameControl(displayName)}
          <p class="muted">${usingCloudProfile ? escapeHtml(accountEmail) : "学习进度与个人资料保存在当前设备"}</p>
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
      <p class="caption">${
        usingCloudProfile
          ? "学习记录会自动同步到云端。"
          : appConfig.cloudEnabled
            ? "无需登录即可修改昵称和头像；登录后学习记录可跨设备同步。"
            : "可直接修改昵称和头像，并可使用导出功能备份学习记录。"
      }</p>
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
      <p class="muted">${
        hasReview
          ? appConfig.cloudEnabled
            ? "错题会优先进入复习队列，后续登录版会按间隔重复自动安排下次复习。"
            : "错题会优先进入本地复习队列。"
          : "当前没有需要复习的错题"
      }</p>
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

function renderProfileNameControl(displayName) {
  if (!state.profileNameEditing) {
    return `
      <div class="profile-name-heading">
        <h2 class="section-title">${escapeHtml(displayName)}</h2>
        <button class="profile-name-edit-button" data-action="edit-display-name" type="button" aria-label="修改昵称">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
            <path d="m13.5 6.5 4 4" />
          </svg>
        </button>
      </div>
    `;
  }

  return `
    <div class="profile-name-inline-editor">
      <input
        id="profile-display-name"
        type="text"
        maxlength="40"
        autocomplete="name"
        value="${escapeHtml(displayName)}"
        aria-label="昵称"
      />
      <button class="profile-name-save" data-action="save-display-name" type="button">保存</button>
      <button class="profile-name-cancel" data-action="cancel-display-name" type="button">取消</button>
    </div>
  `;
}

function renderSettingsPanel() {
  const preferences = state.preferences;
  const accountEmail = cloudAccountEmail();

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
        <h3 id="account-settings-title">${appConfig.cloudEnabled ? "账号与数据" : "本地数据"}</h3>
        ${
          appConfig.cloudEnabled
            ? `
        <div class="profile-setting-block profile-account-setting">
          <div>
            <strong>当前账号</strong>
            <small>${accountEmail ? escapeHtml(accountEmail) : "本地学习账号"}</small>
          </div>
          <span class="step-state">${cloudStatusLabel()}</span>
        </div>
        ${renderCloudAuthControls()}
        `
            : `
              <div class="profile-setting-block profile-account-setting">
                <div><strong>学习记录</strong><small>仅保存在当前浏览器</small></div>
                <span class="step-state">本地模式</span>
              </div>
            `
        }
        <div class="action-grid local-data-actions">
          <button class="secondary-button" data-action="export-progress" type="button">导出学习记录</button>
          <label class="secondary-button import-progress-button">
            <input id="progress-import-input" type="file" accept="application/json,.json" />
            <span>导入学习记录</span>
          </label>
        </div>
        ${
          state.pendingProgressImport
            ? `
              <div class="clear-learning-confirmation" role="alert">
                <strong>确认导入学习记录</strong>
                <p>来源版本：${progressEditionName(state.pendingProgressImport.edition)}</p>
                <p>导出时间：${escapeHtml(
                  typeof state.pendingProgressImport.exportedAt === "string"
                    ? state.pendingProgressImport.exportedAt
                    : "未提供"
                )}</p>
                <p>手动导入会替换当前设备记录，并在登录状态下按现有同步规则上传。</p>
                <div class="action-grid">
                  <button class="secondary-button" data-action="cancel-import-progress" type="button">取消</button>
                  <button class="primary-button" data-action="confirm-import-progress" type="button">确认导入</button>
                </div>
              </div>
            `
            : ""
        }
        ${
          state.clearLearningConfirmation
            ? `
              <div class="clear-learning-confirmation" role="alert">
                <strong>确认清除学习记录</strong>
                <p>将清除课程进度、今日记录、错题、收藏和最近学习位置；学习设置会保留。</p>
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
  const keepsLiveCanvas =
    liveCanvasScreenIds.has(state.screen) ||
    (state.screen === "practiceSession" && currentPracticeGroup().mode === "write");
  if (!completedOAuthRedirect && !completedEmailVerification && keepsLiveCanvas) {
    return;
  }
  render();
}

function appendKeyboardValue(value) {
  const previousKeyboardValue = state.keyboardValue;
  state.keyboardValue += value;
  state.keyboardShift = false;
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
        { id: `key-${value}`, value, latin: "键盘" },
        "练习中心错题"
      );
    }
  }
}

function updateLatinKeyboardValue(nextValue) {
  state.latinKeyboardValue = nextValue;
  if (state.latinKeyboardValue === "qwerty") {
    markProgress("latinWriting", "qwerty", "completed");
  }
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.action;

  if (action === "complete-latin-classification") {
    markProgress("latinWriting", "classification", "completed");
    state.latinVowelComparisonIndex = 0;
    goTo("latinVowelCompare");
    return;
  }

  if (action === "navigate-latin-vowel-comparison") {
    const direction = button.dataset.direction === "previous" ? -1 : 1;
    const lastIndex = latinWriting.vowelComparisons.length - 1;
    state.latinVowelComparisonIndex = Math.max(0, Math.min(lastIndex, state.latinVowelComparisonIndex + direction));
    render();
    return;
  }

  if (action === "complete-latin-vowel-comparison") {
    const lastIndex = latinWriting.vowelComparisons.length - 1;
    if (state.latinVowelComparisonIndex === lastIndex) {
      markProgress("latinWriting", "vowel-contrast", "completed");
      state.latinDictationIndex = 0;
      state.latinDictationRevealed = false;
      state.latinWritingForm = 0;
      goTo("latinDictation");
      return;
    }
    render();
    return;
  }

  if (action === "reveal-latin-dictation-answer") {
    revealLatinDictationAnswer();
    return;
  }

  if (action === "open-latin-writing-forms") {
    const currentLetter = currentLatinDictationLetter();
    const letterId = latinDictationLetterIds.includes(button.dataset.letterId)
      ? button.dataset.letterId
      : currentLetter.id;
    state.latinWritingLetterId = letterId;
    state.latinWritingForm = 0;
    state.latinWritingGuideVisible = true;
    state.latinWritingComparisonRevealed = false;
    goTo("latinWritingForms");
    return;
  }

  if (action === "select-latin-writing-form") {
    state.latinWritingForm = Number(button.dataset.formIndex) || 0;
    updateLatinWritingFormView();
    return;
  }

  if (action === "toggle-latin-writing-guide") {
    toggleLatinWritingGuide();
    return;
  }

  if (action === "clear-latin-writing-canvas") {
    clearWritingCanvases();
    return;
  }

  if (action === "reveal-latin-writing-comparison") {
    revealLatinWritingComparison();
    return;
  }

  if (action === "next-latin-dictation") {
    clearWritingCanvases();
    state.latinDictationIndex = (state.latinDictationIndex + 1) % latinDictationLetterIds.length;
    state.latinDictationRevealed = false;
    state.latinWritingForm = 0;
    render();
    return;
  }

  if (action === "latin-key") {
    updateLatinKeyboardValue(latinKeyboard.applyKey(state.latinKeyboardValue, { key: button.dataset.key || "" }));
    render();
    return;
  }

  if (action === "latin-extended-key") {
    updateLatinKeyboardValue(latinKeyboard.applyExtendedKey(state.latinKeyboardValue, button.dataset.key || ""));
    render();
    return;
  }

  if (action === "latin-backspace") {
    updateLatinKeyboardValue(latinKeyboard.applyKey(state.latinKeyboardValue, { key: "Backspace" }));
    render();
    return;
  }

  if (action === "latin-space") {
    updateLatinKeyboardValue(latinKeyboard.applyKey(state.latinKeyboardValue, { key: " " }));
    render();
    return;
  }

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

  if (action === "toggle-keyboard-shift") {
    state.keyboardShift = !state.keyboardShift;
    render();
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
    const continuingWithCloud = Boolean(cloudAccountEmail());
    state.screen = "home";
    saveLocalProgress();
    render();
    showToast(continuingWithCloud ? "继续学习，进度将自动同步" : "已进入本地学习模式");
    return;
  }

  if (action === "toggle-auth-panel") {
    state.authPanelExpanded = !state.authPanelExpanded;
    render();
    window.requestAnimationFrame(() => document.querySelector('[data-action="toggle-auth-panel"]')?.focus());
    return;
  }

  if (action === "export-progress") {
    try {
      exportLocalProgress();
      showToast("学习记录已导出");
    } catch {
      showToast("导出失败，请稍后重试");
    }
    return;
  }

  if (action === "cancel-import-progress") {
    progressImportSelectionGeneration += 1;
    state.pendingProgressImport = null;
    render({ persist: false });
    showToast("已取消导入");
    return;
  }

  if (action === "confirm-import-progress") {
    progressImportSelectionGeneration += 1;
    try {
      confirmLocalProgressImport();
      render({ persist: false });
      showToast("学习记录已导入");
    } catch (error) {
      showToast(error?.message || "导入失败，请检查文件");
    }
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
        showToast(`注册成功，从${learningUnitOrdinal("letters")}开始学习`);
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

  if (action === "edit-display-name") {
    state.profileNameEditing = true;
    render();
    window.requestAnimationFrame(() => document.querySelector("#profile-display-name")?.focus());
    return;
  }

  if (action === "cancel-display-name") {
    state.profileNameEditing = false;
    render();
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
    if (!cloudAccountEmail()) {
      state.localProfile.displayName = validation.value;
      state.profileNameEditing = false;
      saveLocalProgress();
      render();
      showToast("昵称已更新");
      return;
    }
    cloudSync
      ?.updateDisplayName(validation.value)
      .then(() => {
        state.profileNameEditing = false;
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
    if (target === "latinKeyboardIntro") {
      state.latinKeyboardValue = "";
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

  if (action === "open-vocab-course") {
    const group = vocabGroups.find((item) => item.id === button.dataset.id) || vocabGroups[0];
    const item = group.items.find((choice) => choice.id === button.dataset.itemId) || group.items[0];
    state.selectedUnitId = "basic-phrases";
    state.selectedVocabGroupId = group.id;
    state.currentVocabItemId = item.id;
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
    const unit = learningUnitById(button.dataset.unitId) || readingUnitForGroup(button.dataset.id);
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
      recordItemMistake("combo", target, picked, `${learningUnitOrdinal("combos")}错题`);
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
      recordItemMistake("vocab", target, picked, `${learningUnitOrdinal("basic-phrases")}错题`);
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
      recordItemMistake(
        "combo",
        target,
        { id: "build", value: state.keyboardValue, latin: "拼接" },
        `${learningUnitOrdinal("combos")}拼接错题`
      );
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
    appendKeyboardValue(button.dataset.key || "");
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

document.addEventListener("keydown", (event) => {
  if (state.screen === "latinWritingForms") {
    const tab = event.target?.closest?.("[data-latin-writing-form-tab]");
    if (tab && latinWritingTabNavigationKeys.has(event.key) && !event.ctrlKey && !event.altKey && !event.metaKey) {
      const { forms } = currentLatinWritingForm();
      const lastIndex = Math.max(0, forms.length - 1);
      const currentIndex = Math.max(0, Math.min(lastIndex, Number(tab.dataset.formIndex) || 0));
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? lastIndex
            : event.key === "ArrowLeft"
              ? (currentIndex - 1 + forms.length) % forms.length
              : (currentIndex + 1) % forms.length;
      event.preventDefault();
      state.latinWritingForm = nextIndex;
      updateLatinWritingFormView();
      document.querySelectorAll?.("[data-latin-writing-form-tab]")[nextIndex]?.focus?.();
      return;
    }
  }

  if (state.screen === "latinKeyboardIntro") {
    if (event.target?.matches?.("textarea, select, [contenteditable='true'], input:not([readonly])")) return;
    const nextValue = latinKeyboard.applyKey(state.latinKeyboardValue, event);
    if (nextValue === state.latinKeyboardValue) return;
    event.preventDefault();
    updateLatinKeyboardValue(nextValue);
    render();
    return;
  }

  const onKeyboardLesson =
    ["keyboard", "comboKeyboard", "vocabKeyboard"].includes(state.screen) ||
    (state.screen === "practiceSession" && currentPracticeGroup().mode === "keyboard");
  if (!onKeyboardLesson || event.ctrlKey || event.altKey || event.metaKey) return;
  if (event.target?.matches?.("input, textarea, select, [contenteditable='true']")) return;

  if (event.code === "Backspace") {
    event.preventDefault();
    state.keyboardValue = state.keyboardValue.slice(0, -1);
    render();
    return;
  }

  const mappedKey = uyghurKeyboard.keyForCode(event.code, event.shiftKey);
  if (!mappedKey) return;
  event.preventDefault();
  appendKeyboardValue(mappedKey.value);
  render();
});

function createLocalAvatarDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("头像读取失败"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("头像图片无法打开"));
      image.onload = () => {
        const size = Math.min(image.naturalWidth, image.naturalHeight);
        const sourceX = Math.max(0, (image.naturalWidth - size) / 2);
        const sourceY = Math.max(0, (image.naturalHeight - size) / 2);
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("当前浏览器无法处理头像"));
          return;
        }
        context.drawImage(image, sourceX, sourceY, size, size, 0, 0, 256, 256);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

document.addEventListener("change", (event) => {
  const input = event.target;
  if (input?.id === "progress-import-input") {
    const file = input.files?.[0];
    if (!file) return;
    const selectionGeneration = ++progressImportSelectionGeneration;
    state.pendingProgressImport = null;
    render({ persist: false });
    file
      .text()
      .then((text) => {
        if (selectionGeneration !== progressImportSelectionGeneration) return;
        importLocalProgressText(text);
        render({ persist: false });
        showToast("请确认导入学习记录");
      })
      .catch((error) => {
        if (selectionGeneration !== progressImportSelectionGeneration) return;
        state.pendingProgressImport = null;
        render({ persist: false });
        showToast(error?.message || "导入失败，请检查文件");
      });
    input.value = "";
    return;
  }
  if (input?.id !== "profile-avatar-input") return;

  const file = input.files?.[0];
  if (!file) return;
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
  if (!cloudAccountEmail()) {
    createLocalAvatarDataUrl(file)
      .then((avatarDataUrl) => {
        state.localProfile.avatarDataUrl = avatarDataUrl;
        state.avatarUploading = false;
        saveLocalProgress();
        render();
        showToast("头像已更新");
      })
      .catch((error) => {
        state.avatarUploading = false;
        render();
        showToast(error?.message || "头像处理失败");
      });
    return;
  }
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
  if (!appConfig.cloudEnabled) {
    cloudStatus = { phase: "local", error: "" };
    return;
  }
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
    validateSnapshot: validateCloudProgressSnapshot,
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
