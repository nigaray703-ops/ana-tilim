const courseData = window.ANA_TILIM_COURSE;
const sentenceGlossary = window.ANA_TILIM_SENTENCE_GLOSSARY;
const progressTransfer = window.ANA_TILIM_PROGRESS_TRANSFER;
const uyghurKeyboard = window.ANA_TILIM_UYGHUR_KEYBOARD;
const latinKeyboard = window.ANA_TILIM_LATIN_KEYBOARD;
const unitOrder = window.ANA_TILIM_UNIT_ORDER;
const feedbackApi = window.ANA_TILIM_FEEDBACK;
const appConfig = Object.freeze({
  edition: "global",
  brandName: "Ana Tilim",
  brandNameUyghur: "ئانا تىلىم",
  logoPath: "./assets/logo.png",
  cloudEnabled: true,
  afantiLanguages: ["latin", "zh", "en"],
  progressStorageKey: "ana-tilim-progress",
  backupStorageKey: "ana-tilim-guest-progress-backup",
  ...(window.ANA_TILIM_APP_CONFIG || {})
});

if (!courseData || !sentenceGlossary || !progressTransfer || !uyghurKeyboard || !latinKeyboard || !unitOrder || !feedbackApi) {
  throw new Error("Learning data modules failed to load.");
}

const {
  alphabetLetters,
  letterDetails,
  alphabetGroups,
  alphabetAudioItems,
  latinWriting,
  comboGroups,
  syllableTraining,
  vocabGroups,
  practiceGroups,
  readingUnits,
  afantiStories,
  afantiUnit
} = courseData;
const i18n = window.ANA_TILIM_I18N;
if (!i18n) {
  throw new Error("Ana Tilim interface language module failed to load.");
}
const t = i18n.t;
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
const initialInterfaceLanguage = appConfig.edition === "cn"
  ? "zh"
  : i18n.resolveLanguage(savedLanguage, systemLanguages, systemFallbackLanguage);
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
  ["erzimaydu", "erzimeydu"],
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
      fileId: ({
        "grammar-person-verbs-1": "grammar-word-order-1",
        "sentence-self-introduction-4": "grammar-copula-2"
      })[item.id] || item.id,
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

const lettersUnit = {
  id: "letters",
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
};
const latinWritingUnit = {
  ...latinWriting.unit,
  groups: [],
  actionTarget: "latinKeyboardIntro"
};
const combosUnit = {
  id: "combos",
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
};
const syllableTrainingUnit = {
  ...syllableTraining.unit,
  groups: [],
  actionTarget: "syllableWarmup"
};
const vocabUnit = {
  id: "basic-phrases",
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
};
const readingUnitCatalog = readingUnits.map((unit) => ({
  id: unit.id,
  kind: unit.kind,
  readingKind: unit.readingKind,
  groups: unit.groups,
  actionTarget: "reading",
  get subtitle() { return unit.subtitle; },
  get description() { return unit.description; },
  get bullets() { return unit.bullets; },
  get status() { return unit.status; }
}));
const afantiUnitCatalog = {
  ...afantiUnit,
  groups: [],
  actionTarget: "afantiStories"
};
const learningUnitCatalog = [
  lettersUnit,
  latinWritingUnit,
  combosUnit,
  syllableTrainingUnit,
  vocabUnit,
  ...readingUnitCatalog,
  afantiUnitCatalog
];
const englishUnitNames = Object.freeze({
  letters: "Meet the alphabet",
  "latin-keyboard-writing": "Latin keyboards and letter writing",
  combos: "Basic combinations",
  "syllable-training": "Syllable reading workshop",
  "basic-phrases": "Everyday phrases and vocabulary",
  "grammar-basics": "Grammar basics",
  "sentence-patterns": "Basic sentence patterns",
  "dialogue-theater": "Mini dialogues",
  "short-stories": "Short stories",
  "uyghur-proverbs": "Uyghur proverbs",
  "famous-quotes": "Famous quotes",
  "afanti-stories": "Afanti stories"
});
const englishUnitDetails = Object.freeze({
  "latin-keyboard-writing": Object.freeze({
    subtitle: "Latin and Uyghur keyboards, vowel and consonant groups, and ULY dictation",
    description: "Build confidence with Latin keys, sort the Uyghur alphabet into vowels and consonants, then write Uyghur letters from ULY prompts.",
    bullets: Object.freeze(["Latin QWERTY", "Uyghur keyboard", "8 vowels and 24 consonants", "ULY-guided dictation", "Real letter forms"])
  }),
  "syllable-training": Object.freeze({
    subtitle: "From two-letter combinations to syllable reading in short sentences",
    description: "Join two letters reliably, practise introductory syllable strategies, compare joining and breaks, then return to complete short sentences.",
    bullets: Object.freeze(["Two-letter warm-up", "Syllable strategies", "Joining and breaks", "Split and read short sentences"])
  }),
  "afanti-stories": Object.freeze({
    subtitle: "Six increasingly challenging, thoughtful stories for reading without audio",
    description: "Read the Uyghur story first, open a support language only when needed, and answer one comprehension question for each story.",
    bullets: Object.freeze(["Uyghur-first reading", "Optional support language", "Comprehension choices", "A clear lesson from each story"])
  })
});
const learningUnits = unitOrder.buildVisibleUnits(learningUnitCatalog, appConfig).map((unit, index) => {
  const chineseTitle = unit.title;
  const sourceUnit = learningUnitCatalog.find((candidate) => candidate.id === unit.id) || unit;
  return {
    ...unit,
    get title() {
      return i18n.getLanguage() === "en"
        ? `Unit ${index + 1}: ${englishUnitNames[unit.id] || unitOrder.UNIT_NAMES[unit.id]}`
        : chineseTitle;
    },
    get subtitle() { return i18n.getLanguage() === "en" ? (englishUnitDetails[unit.id]?.subtitle || sourceUnit.subtitle) : sourceUnit.subtitle; },
    get description() { return i18n.getLanguage() === "en" ? (englishUnitDetails[unit.id]?.description || sourceUnit.description) : sourceUnit.description; },
    get bullets() { return i18n.getLanguage() === "en" ? (englishUnitDetails[unit.id]?.bullets || sourceUnit.bullets) : sourceUnit.bullets; },
    get status() { return sourceUnit.status; }
  };
});
const persistedScreenIds = new Set([
  "welcome",
  "home",
  "learn",
  "unit",
  "latinKeyboardIntro",
  "uyghurKeyboardWords",
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
  "syllableWarmup",
  "syllableRules",
  "syllableConnections",
  "syllableSentences",
  "syllableReview",
  "afantiStories",
  "vocab",
  "vocabRecognition",
  "vocabKeyboard",
  "vocabComplete",
  "reading",
  "practiceSession",
  "practiceComplete",
  "library",
  "profile",
  "feedback",
  "settings"
]);
const liveCanvasScreenIds = new Set([
  "letterWriting",
  "latinDictation",
  "latinWritingForms",
  "comboWriting"
]);
const latinWritingTabNavigationKeys = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);
const syllableRuleAnswerNavigationKeys = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]);
const latinWritingStepIds = Object.freeze([
  "qwerty",
  "uyghur-keyboard",
  "classification",
  "vowel-contrast",
  "dictation",
  "forms"
]);
const stableProgressIds = Object.freeze({
  latinWriting: new Set(latinWritingStepIds),
  letters: new Set(alphabetGroups.map((group) => group.id)),
  combos: new Set(comboGroups.map((group) => group.id)),
  syllableTraining: new Set([
    syllableTraining.sections[0].id,
    ...syllableTraining.rules.map((rule) => rule.id),
    syllableTraining.sections[2].id,
    syllableTraining.sections[3].id
  ]),
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
const stableSyllableMistakeIds = Object.freeze({
  connection: new Set(
    syllableTraining.connectionItems.filter((item) => item.mistakeBucket === "connection").map((item) => item.id)
  ),
  break: new Set(
    syllableTraining.connectionItems.filter((item) => item.mistakeBucket === "break").map((item) => item.id)
  )
});
const stableWritingCheckIds = new Set(["shape", "dots", "spacing"]);
const dailyActivitySteps = Object.freeze({
  latinWriting: new Set(["completed"]),
  letters: new Set(["viewed", "writing", "recognition", "keyboard", "completed"]),
  combos: new Set(["viewed", "writing", "recognition", "build", "keyboard", "completed"]),
  syllableTraining: new Set(["completed"]),
  vocab: new Set(["viewed", "recognition", "keyboard", "completed"]),
  practice: new Set(["viewed", "listen", "repeat", "write", "keyboard", "review", "completed"]),
  reading: new Set(["viewed", "rule", "compare", "recognition", "ordering", "completion", "completed"])
});

function learningUnitById(unitId) {
  return learningUnits.find((unit) => unit.id === unitId) || null;
}

function learningUnitTitle(unitId) {
  return learningUnitById(unitId)?.title || unitOrder.UNIT_NAMES[unitId] || "学习单元";
}

function learningUnitOrdinal(unitId) {
  const [ordinal, name] = learningUnitTitle(unitId).split(/[:：]/u);
  return name ? ordinal : "学习单元";
}

const unitExperience = {
  letters: {
    get recommended() { return t("alphabet.recommended"); },
    get steps() {
      return [t("alphabet.stepGroups"), t("alphabet.stepForms"), t("alphabet.stepPractice"), t("alphabet.stepComplete")];
    },
    get reviewLabel() { return t("alphabet.reviewGroup"); },
    reviewTarget: "group"
  },
  "latin-keyboard-writing": {
    get recommended() { return i18n.getLanguage() === "en" ? "Start with Latin QWERTY, then organise the alphabet and practise writing in a clear sequence." : "先完成普通拉丁 QWERTY，再按顺序整理字母并练习书写。"; },
    get steps() { return i18n.getLanguage() === "en" ? ["Latin QWERTY", "Vowels and consonants", "Vowel comparisons", "ULY-guided dictation", "Letter-form writing"] : ["普通 QWERTY", "元音与辅音分类", "元音对比辨认", "ULY 提示默写", "书写形式参考"]; },
    get reviewLabel() { return i18n.getLanguage() === "en" ? "Practise QWERTY" : "练习 QWERTY"; },
    reviewTarget: "latinKeyboardIntro"
  },
  combos: {
    get recommended() { return t("combo.recommended"); },
    get steps() { return [t("combo.stepTwo"), t("combo.stepThree"), t("combo.stepBreaks"), t("combo.stepPractice")]; },
    get reviewLabel() { return t("combo.review"); },
    reviewTarget: "combo"
  },
  "syllable-training": {
    get recommended() { return i18n.getLanguage() === "en" ? "Join real two-letter combinations, practise each introductory syllable strategy, then judge joining and breaks." : "先把真实两字母组合拼起来，再逐条练习入门音节划分策略，最后完成连接与断开判断。"; },
    get steps() { return i18n.getLanguage() === "en" ? ["Two-letter warm-up", "Find the vowel centre", "Judge consonant boundaries", "Separate word-building and syllable boundaries", "Joining and break judgements", "Review mistakes by type"] : ["两字母热身", "先找元音中心", "判断辅音边界", "区分构词与音节边界", "连接与断开判断", "分桶复习错题"]; },
    get reviewLabel() { return i18n.getLanguage() === "en" ? "Review joining and break mistakes" : "复习连接与断开错题"; },
    reviewTarget: "syllableReview"
  },
  "afanti-stories": {
    get recommended() { return i18n.getLanguage() === "en" ? "Read six Afanti stories in order as they become more challenging. Read Uyghur first and open a support language only when needed." : "按顺序阅读六篇逐步变难的阿凡提小故事，先读维吾尔文，需要时再打开辅助语言。"; },
    get steps() { return i18n.getLanguage() === "en" ? ["Read Uyghur first", "Open a support language when needed", "Understand the lesson in each story"] : ["默认阅读维吾尔文", "按需打开辅助语言", "逐篇理解故事道理"]; },
    get reviewLabel() { return i18n.getLanguage() === "en" ? "Read the six stories" : "阅读六篇故事"; },
    reviewTarget: "afantiStories"
  },
  "basic-phrases": {
    get recommended() { return t("vocab.recommended"); },
    get steps() { return [t("vocab.stepTopic"), t("vocab.stepWords"), t("vocab.stepRecognition"), t("vocab.stepKeyboard")]; },
    get reviewLabel() { return t("vocab.review"); },
    reviewTarget: "vocab"
  },
  "grammar-basics": {
    get recommended() { return t("reading.grammarRecommended"); },
    get steps() { return [t("reading.grammarStepChoose"), t("reading.grammarStepPattern"), t("reading.grammarStepExample"), t("reading.grammarStepExplanation")]; },
    get reviewLabel() { return t("reading.grammarReview"); },
    reviewTarget: "reading"
  },
  "sentence-patterns": {
    get recommended() { return t("reading.sentenceRecommended"); },
    get steps() { return [t("reading.sentenceStepChoose"), t("reading.sentenceStepRead"), t("reading.translationStep")]; },
    get reviewLabel() { return t("reading.sentenceReview"); },
    reviewTarget: "reading"
  },
  "dialogue-theater": {
    get recommended() { return t("reading.dialogueRecommended"); },
    get steps() { return [t("reading.dialogueStepChoose"), t("reading.dialogueStepRead"), t("reading.translationStep")]; },
    get reviewLabel() { return t("reading.dialogueReview"); },
    reviewTarget: "reading"
  },
  "short-stories": {
    get recommended() { return t("reading.storyRecommended"); },
    get steps() { return [t("reading.storyStepChoose"), t("reading.storyStepRead"), t("reading.translationStep")]; },
    get reviewLabel() { return t("reading.storyReview"); },
    reviewTarget: "reading"
  },
  "famous-quotes": {
    get recommended() { return t("reading.quoteRecommended"); },
    get steps() { return [t("reading.quoteStepChoose"), t("reading.quoteStepRead"), t("reading.translationStep")]; },
    get reviewLabel() { return t("reading.quoteReview"); },
    reviewTarget: "reading"
  },
  "uyghur-proverbs": {
    get recommended() { return t("reading.proverbRecommended"); },
    get steps() { return [t("reading.proverbStepChoose"), t("reading.proverbStepRead"), t("reading.translationStep")]; },
    get reviewLabel() { return t("reading.proverbReview"); },
    reviewTarget: "reading"
  }
};

const progressStorageKey = appConfig.progressStorageKey;
const guestBackupStorageKey = appConfig.backupStorageKey;
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

function normalizeSyllableMistakes(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    connection: Array.isArray(source.connection) ? [...source.connection].slice(0, 24) : [],
    break: Array.isArray(source.break) ? [...source.break].slice(0, 24) : []
  };
}

function validateSyllableMistakeIds(value) {
  if (value === undefined) return;
  progressTransfer.validateSyllableMistakes(value);
  for (const bucketName of ["connection", "break"]) {
    const otherBucketName = bucketName === "connection" ? "break" : "connection";
    for (const id of value[bucketName]) {
      if (stableSyllableMistakeIds[bucketName].has(id)) continue;
      if (stableSyllableMistakeIds[otherBucketName].has(id)) {
        throw new Error(`syllableMistakes.${bucketName} 的 ${id} 属于 ${otherBucketName} 分类`);
      }
      throw new Error(`syllableMistakes.${bucketName} 包含未知 ID: ${id}`);
    }
  }
}

function expectedSyllableCompletedIds(progressId) {
  if (progressId === syllableTraining.sections[0].id) {
    return syllableTraining.twoLetterItems.map((item) => item.id);
  }
  if (progressId === syllableTraining.sections[2].id) {
    return syllableTraining.connectionItems.map((item) => item.id);
  }
  if (progressId === syllableTraining.sections[3].id) {
    return syllableTraining.sentences.map((item) => item.id);
  }
  return (syllableTraining.rules.find((rule) => rule.id === progressId)?.exercises || []).map(
    (exercise) => exercise.id
  );
}

function expectedLatinWritingCompletedIds(progressId) {
  if (progressId === "qwerty") {
    return latinWriting.keyboardLessons.map((item) => item.id);
  }
  if (progressId === "uyghur-keyboard") {
    return latinWriting.uyghurKeyboardLessons.map((item) => item.id);
  }
  if (progressId === "vowel-contrast") {
    return latinWriting.vowelComparisons.map((item) => item.id);
  }
  if (progressId === "dictation") {
    return [...latinWriting.vowelLetterIds, ...latinWriting.consonantLetterIds];
  }
  return null;
}

function completedLatinWritingItemIds(progressId) {
  const entry = state.learningProgress.latinWriting?.[progressId];
  const expectedIds = expectedLatinWritingCompletedIds(progressId) || [];
  if (Array.isArray(entry?.completedIds)) return entry.completedIds;
  return entry?.completed === true ? expectedIds : [];
}

function firstIncompleteLatinWritingIndex(progressId) {
  const expectedIds = expectedLatinWritingCompletedIds(progressId) || [];
  const completedIds = completedLatinWritingItemIds(progressId);
  const nextIndex = expectedIds.findIndex((id) => !completedIds.includes(id));
  return nextIndex >= 0 ? nextIndex : Math.max(0, expectedIds.length - 1);
}

function submitLatinWritingItem(progressId, itemId) {
  const expectedIds = expectedLatinWritingCompletedIds(progressId) || [];
  const progress = ensureProgress("latinWriting", progressId);
  if (progress.completed === true && !Array.isArray(progress.completedIds)) return;
  const completedIds = Array.isArray(progress.completedIds) ? progress.completedIds : [];
  if (expectedIds[completedIds.length] !== itemId || completedIds.includes(itemId)) return;
  progress.completedIds = [...completedIds, itemId];
  markCloudDirty("learning");
  if (progress.completedIds.length === expectedIds.length) {
    progress.completed = true;
    recordDailyActivity(`latinWriting:${progressId}:completed`);
  }
}

function syllableStageComplete(progressId, learningProgress = state.learningProgress) {
  const entry = learningProgress?.syllableTraining?.[progressId];
  const expectedIds = expectedSyllableCompletedIds(progressId);
  return Boolean(
    entry?.completed === true &&
    Array.isArray(entry.completedIds) &&
    entry.completedIds.length === expectedIds.length &&
    entry.completedIds.every((id, index) => id === expectedIds[index])
  );
}

function syllableRulesPrerequisitesComplete(learningProgress = state.learningProgress) {
  return syllableStageComplete(syllableTraining.sections[0].id, learningProgress);
}

function syllableConnectionPrerequisitesComplete(learningProgress = state.learningProgress) {
  return Boolean(
    syllableRulesPrerequisitesComplete(learningProgress) &&
    syllableTraining.rules.every((rule) => syllableStageComplete(rule.id, learningProgress))
  );
}

function syllableSentencePrerequisitesComplete(learningProgress = state.learningProgress) {
  return Boolean(
    syllableConnectionPrerequisitesComplete(learningProgress) &&
    syllableStageComplete(syllableTraining.sections[2].id, learningProgress)
  );
}

function reachableSyllableTrainingScreen(learningProgress = state.learningProgress) {
  if (syllableSentencePrerequisitesComplete(learningProgress)) return "syllableSentences";
  if (syllableConnectionPrerequisitesComplete(learningProgress)) return "syllableConnections";
  return syllableRulesPrerequisitesComplete(learningProgress) ? "syllableRules" : "syllableWarmup";
}

function firstReachableSyllableRuleId(learningProgress = state.learningProgress) {
  return (
    syllableTraining.rules.find((rule) => !syllableStageComplete(rule.id, learningProgress)) ||
    syllableTraining.rules[syllableTraining.rules.length - 1]
  ).id;
}

function resetSyllableRuleInteraction() {
  state.syllableAnswerId = "";
  state.syllableAnswerSubmitted = false;
  state.syllableRuleCompletionNotice = null;
}

function normalizedPersistedSyllableScreen(screenId, learningProgress) {
  if (screenId === "syllableRules" && !syllableRulesPrerequisitesComplete(learningProgress)) {
    return reachableSyllableTrainingScreen(learningProgress);
  }
  if (screenId === "syllableConnections" && !syllableConnectionPrerequisitesComplete(learningProgress)) {
    return reachableSyllableTrainingScreen(learningProgress);
  }
  if (screenId === "syllableSentences" && !syllableSentencePrerequisitesComplete(learningProgress)) {
    return reachableSyllableTrainingScreen(learningProgress);
  }
  return screenId;
}

function syllableLearningPrefixIsValid(learningProgress = state.learningProgress) {
  try {
    progressTransfer.validateLearningProgress(learningProgress || {});
    validateImportedProgressIds({ learningProgress: learningProgress || {} });
    return true;
  } catch {
    return false;
  }
}

function normalizeActiveSyllableRoute() {
  const originalScreen = state.screen;
  if (originalScreen === "syllableConnections" && state.syllableConnectionMode !== "lesson") {
    if (syllableConnectionScreenIsReachable()) return true;
    state.screen = "syllableReview";
    state.syllableConnectionAnswerId = "";
    state.syllableConnectionSubmitted = false;
    state.syllableConnectionReviewItemId = "";
    return false;
  }
  if (
    ["syllableWarmup", "syllableRules", "syllableConnections", "syllableSentences"].includes(originalScreen) &&
    !syllableLearningPrefixIsValid()
  ) {
    state.screen = reachableSyllableTrainingScreen();
    state.syllableRuleId = firstReachableSyllableRuleId();
    resetSyllableRuleInteraction();
    if (originalScreen === "syllableConnections") {
      state.syllableConnectionMode = "lesson";
      state.syllableConnectionAnswerId = "";
      state.syllableConnectionSubmitted = false;
      state.syllableConnectionReviewItemId = "";
    }
    return false;
  }
  const normalizedScreen = normalizedPersistedSyllableScreen(originalScreen, state.learningProgress);
  if (normalizedScreen !== originalScreen) {
    state.screen = normalizedScreen;
    resetSyllableRuleInteraction();
    return false;
  }
  if (state.screen === "syllableRules") {
    const reachableRuleId = firstReachableSyllableRuleId();
    if (state.syllableRuleId !== reachableRuleId) {
      state.syllableRuleId = reachableRuleId;
      resetSyllableRuleInteraction();
      return false;
    }
  }
  if (state.screen === "syllableConnections" && !syllableConnectionScreenIsReachable()) {
    state.screen = reachableSyllableTrainingScreen();
    state.syllableConnectionMode = "lesson";
    state.syllableConnectionAnswerId = "";
    state.syllableConnectionSubmitted = false;
    state.syllableConnectionReviewItemId = "";
    return false;
  }
  return true;
}

function activeSyllableReviewBucket() {
  if (state.syllableConnectionMode === "review-connection") return "connection";
  if (state.syllableConnectionMode === "review-break") return "break";
  return "";
}

function activeSyllableReviewItemId() {
  const bucketName = activeSyllableReviewBucket();
  if (!bucketName) return "";
  return state.syllableConnectionReviewItemId || state.syllableMistakes[bucketName]?.[0] || "";
}

function syllableConnectionScreenIsReachable() {
  if (state.syllableConnectionMode === "lesson") {
    return syllableConnectionPrerequisitesComplete();
  }
  const bucketName = activeSyllableReviewBucket();
  const itemId = activeSyllableReviewItemId();
  return Boolean(
    bucketName &&
    stableSyllableMistakeIds[bucketName].has(itemId) &&
    (state.syllableMistakes[bucketName]?.includes(itemId) || state.syllableConnectionSubmitted)
  );
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
    syllableMistakes: { connection: [], break: [] },
    writingChecks: [],
    localProfile: {
      displayName: "",
      avatarDataUrl: ""
    },
    preferences: { ...DEFAULT_PREFERENCES },
    dailyActivity: { date: "", completedIds: [] },
    modifiedAt: timestamp,
    preferencesUpdatedAt: untouchedPreferenceTimestamp,
    favoriteUpdatedAt: timestamp
  };
}

const localProgressFieldNames = Object.freeze(
  Object.keys(createDefaultLocalProgressState(initialCloudTimestamp))
);

const state = {
  ...createDefaultLocalProgressState(initialCloudTimestamp),
  interfaceLanguage: initialInterfaceLanguage,
  selectedPicture: "",
  selectedListening: "",
  practiceAudioPlayed: false,
  keyboardValue: "",
  keyboardShift: false,
  latinKeyboardValue: "",
  latinKeyboardLessonIndex: 0,
  uyghurKeyboardMode: "onscreen",
  uyghurKeyboardValue: "",
  latinVowelComparisonIndex: 0,
  latinDictationIndex: 0,
  latinDictationRevealed: false,
  letterWritingFormIndex: 0,
  latinWritingForm: 0,
  latinWritingLetterId: "aa",
  latinWritingGuideVisible: true,
  latinWritingComparisonRevealed: false,
  syllableSectionId: "two-letter-warmup",
  syllableItemIndex: 0,
  syllableRuleId: syllableTraining.rules[0].id,
  syllableAnswerId: "",
  syllableShowStandard: false,
  syllableAnswerSubmitted: false,
  syllableRuleCompletionNotice: null,
  syllableConnectionAnswerId: "",
  syllableConnectionSubmitted: false,
  syllableConnectionMode: "lesson",
  syllableConnectionReviewItemId: "",
  syllableReviewReturnTarget: "",
  syllableSentenceIndex: 0,
  syllableSentenceShowStandard: false,
  syllableSentenceHelperViewed: false,
  syllableSentenceAudioPlayed: false,
  readingTrainingStepIndex: 0,
  readingTrainingChoiceId: "",
  readingOrderingIds: [],
  readingTrainingFeedback: "",
  selectedAfantiStoryId: afantiStories[0]?.id || "",
  afantiVisibleLanguages: { latin: false, zh: false, en: false },
  practiceSpoken: false,
  emailAuthExpanded: false,
  emailCodeSent: false,
  authPanelExpanded: false,
  authMode: "login",
  authEmail: "",
  avatarUploading: false,
  profileNameEditing: false,
  feedbackDraft: { category: "display", message: "", contact: "" },
  feedbackSubmitPhase: "idle",
  feedbackSubmitMessage: "",
  feedbackAdminPhase: "idle",
  feedbackAdminUserId: "",
  feedbackRecords: [],
  showGuide: true,
  writingStrokes: {},
  clearLearningConfirmation: false,
  pendingProgressImport: null,
  syncDirty: false
};

hydrateLocalProgress();

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
const viewScrollPositions = new Map();
let renderedScrollViewKey = "";
let toastTimer = null;
let activeAudio = null;
let lastAutoplayKey = "";
let progressImportSelectionGeneration = 0;
let cloudSync = null;
let cloudStatus = { phase: "local", error: "" };
let sharedSupabaseClient = null;
let feedbackClient = null;
const syllableSentenceAudioController = window.ANA_TILIM_AUDIO?.createAudioController({
  onStarted: ({ contentKey }) => {
    const sentenceId = contentKey?.replace("syllable-sentence:", "");
    if (state.screen !== "syllableSentences" || currentSyllableSentence()?.id !== sentenceId) return;
    state.syllableSentenceAudioPlayed = true;
    state.syllableSentencePlaybackStatus = "真人整句音频播放中";
    render();
  },
  onError: () => {
    if (state.screen !== "syllableSentences") return;
    state.syllableSentencePlaybackStatus = "音频未能启动，请重试";
    render();
  }
});

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

  if (saved.learningProgress && typeof saved.learningProgress === "object") {
    progressTransfer.validateLearningProgress(saved.learningProgress);
  }
  validateImportedProgressIds(saved);
  const normalizedSavedScreen = normalizedPersistedSyllableScreen(saved.screen, saved.learningProgress);
  const normalizedSaved = {
    ...saved,
    screen: normalizedSavedScreen
  };
  const previousSyllableSentenceId = activeSyllableSentenceId();

  state.preferences = normalizePreferences(normalizedSaved.preferences);
  state.syllableMistakes = normalizeSyllableMistakes(normalizedSaved.syllableMistakes);

  if (
    normalizedSaved.dailyActivity &&
    typeof normalizedSaved.dailyActivity === "object" &&
    typeof normalizedSaved.dailyActivity.date === "string" &&
    Array.isArray(normalizedSaved.dailyActivity.completedIds)
  ) {
    state.dailyActivity = {
      date: normalizedSaved.dailyActivity.date,
      completedIds: normalizedSaved.dailyActivity.completedIds.filter((id) => typeof id === "string")
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
    if (typeof normalizedSaved[field] === "string") {
      state[field] = normalizedSaved[field];
    }
  });
  if (state.screen === "settings") {
    state.screen = "profile";
  }

  if (typeof normalizedSaved.favorite === "boolean") {
    state.favorite = normalizedSaved.favorite;
  }

  if (normalizedSaved.learningProgress && typeof normalizedSaved.learningProgress === "object") {
    state.learningProgress = {
      latinWriting: normalizedSaved.learningProgress.latinWriting || {},
      letters: normalizedSaved.learningProgress.letters || {},
      combos: normalizedSaved.learningProgress.combos || {},
      syllableTraining: normalizedSaved.learningProgress.syllableTraining || {},
      vocab: normalizedSaved.learningProgress.vocab || {},
      practice: normalizedSaved.learningProgress.practice || {},
      reading: normalizedSaved.learningProgress.reading || {}
    };
  }

  if (Array.isArray(normalizedSaved.mistakes)) {
    state.mistakes = normalizedSaved.mistakes.slice(0, 24);
  }

  if (Array.isArray(normalizedSaved.writingChecks)) {
    state.writingChecks = normalizedSaved.writingChecks.slice(0, 3);
  }

  if (normalizedSaved.localProfile && typeof normalizedSaved.localProfile === "object") {
    state.localProfile = {
      displayName: typeof normalizedSaved.localProfile.displayName === "string" ? normalizedSaved.localProfile.displayName.slice(0, 40) : "",
      avatarDataUrl:
        typeof normalizedSaved.localProfile.avatarDataUrl === "string" && normalizedSaved.localProfile.avatarDataUrl.startsWith("data:image/")
          ? normalizedSaved.localProfile.avatarDataUrl
          : ""
    };
  }

  if (normalizedSavedScreen !== saved.screen) {
    state.syllableRuleId = firstReachableSyllableRuleId();
  }
  resetSyllableRuleInteraction();
  restoreHydratedLessonPosition();
  normalizeActiveSyllableRoute();
  reconcileSyllableSentenceProgressChange(previousSyllableSentenceId);
  return true;
}

function restoreHydratedLessonPosition() {
  if (state.screen === "latinKeyboardIntro") {
    state.latinKeyboardLessonIndex = latinKeyboardResumeIndex();
    state.latinKeyboardValue = "";
    return;
  }
  if (state.screen === "uyghurKeyboardWords") {
    state.uyghurKeyboardValue = "";
    state.keyboardShift = false;
    return;
  }
  if (state.screen === "latinVowelCompare") {
    state.latinVowelComparisonIndex = firstIncompleteLatinWritingIndex("vowel-contrast");
    return;
  }
  if (state.screen === "latinDictation") {
    state.latinDictationIndex = firstIncompleteLatinWritingIndex("dictation");
    state.latinDictationRevealed = false;
    state.latinWritingForm = 0;
    return;
  }
  if (state.screen === "syllableWarmup") {
    state.syllableItemIndex = syllableWarmupResumeIndex();
    state.syllableShowStandard = false;
    return;
  }
  if (state.screen === "reading") {
    resetReadingTrainingState(currentReadingGroup());
  }
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
    validatePersistedLocalProgressData(saved);
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
    localProgressFieldNames.map((field) => [
      field,
      field === "screen" && state.screen === "syllableConnections" && state.syllableConnectionMode !== "lesson"
        ? "syllableReview"
        : state[field]
    ])
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
  const normalizedEnvelope = {
    ...envelope,
    data: {
      ...envelope.data,
      screen: normalizedPersistedSyllableScreen(envelope.data.screen, envelope.data.learningProgress)
    }
  };
  state.pendingProgressImport = normalizedEnvelope;
  return normalizedEnvelope;
}

function validateImportedProgressIds(saved) {
  if (saved.screen !== undefined && !persistedScreenIds.has(saved.screen)) {
    throw new Error(`学习数据包含未知页面 ID: ${saved.screen}`);
  }
  validateSyllableMistakeIds(saved.syllableMistakes);

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
      const completedIds = bucket[id].completedIds;
      if (completedIds) {
        const expectedCompletedIds = scope === "syllableTraining"
          ? expectedSyllableCompletedIds(id)
          : scope === "latinWriting"
            ? expectedLatinWritingCompletedIds(id)
            : null;
        const allowedCompletedIds = expectedCompletedIds ? new Set(expectedCompletedIds) : null;
        const unknownItemId = completedIds.find((itemId) => !allowedCompletedIds?.has(itemId));
        if (!allowedCompletedIds || unknownItemId) {
          throw new Error(`learningProgress.${scope}.${id}.completedIds 包含未知 ID: ${unknownItemId || completedIds[0]}`);
        }
        if (new Set(completedIds).size !== completedIds.length) {
          throw new Error(`learningProgress.${scope}.${id}.completedIds 包含重复 ID`);
        }
        if (completedIds.some((itemId, index) => itemId !== expectedCompletedIds[index])) {
          throw new Error(`learningProgress.${scope}.${id}.completedIds 必须按课程顺序提交`);
        }
      }
      if (scope === "syllableTraining" && bucket[id].completed === true) {
        const expectedSubmittedCount = expectedSyllableCompletedIds(id).length;
        if (!Array.isArray(completedIds) || completedIds.length !== expectedSubmittedCount) {
          throw new Error(`learningProgress.${scope}.${id} 未提交全部题目，不能标记完成`);
        }
      }
      if (scope === "syllableTraining") {
        const expectedSubmittedCount = expectedSyllableCompletedIds(id).length;
        if (Array.isArray(completedIds) && completedIds.length === expectedSubmittedCount && bucket[id].completed !== true) {
          throw new Error(`learningProgress.${scope}.${id} 已提交全部题目，必须标记完成`);
        }
      }
      if (scope === "reading") {
        const group = readingUnits.flatMap((unit) => unit.groups).find((candidate) => candidate.id === id);
        const trainingSteps = group?.training?.steps || [];
        if (trainingSteps.length) {
          const allowedFields = new Set(["viewed", ...trainingSteps, "completed"]);
          const unknownField = Object.keys(bucket[id]).find((field) => !allowedFields.has(field));
          if (unknownField) {
            throw new Error(`learningProgress.reading.${id} 包含未知字段 ${unknownField}`);
          }
          let foundIncomplete = false;
          for (const stepId of trainingSteps) {
            if (bucket[id][stepId] !== true) foundIncomplete = true;
            if (foundIncomplete && bucket[id][stepId] === true) {
              throw new Error(`learningProgress.reading.${id} 必须按训练顺序完成 ${stepId}`);
            }
          }
          const allComplete = trainingSteps.every((stepId) => bucket[id][stepId] === true);
          if (Boolean(bucket[id].completed) !== allComplete) {
            throw new Error(`learningProgress.reading.${id} 的完成状态与五步训练不一致`);
          }
        }
      }
      const expectedLatinIds = scope === "latinWriting" ? expectedLatinWritingCompletedIds(id) : null;
      if (expectedLatinIds) {
        const allowsLegacyCompletion = ["qwerty", "vowel-contrast", "dictation"].includes(id);
        const isLegacyCompletion = allowsLegacyCompletion && bucket[id].completed === true && completedIds === undefined;
        const isFullyComplete = Array.isArray(completedIds) && completedIds.length === expectedLatinIds.length;
        const progressKind = ["qwerty", "uyghur-keyboard"].includes(id) ? "键盘练习" : "练习";
        if (!isLegacyCompletion && bucket[id].completed === true && !isFullyComplete) {
          throw new Error(`learningProgress.${scope}.${id} 未完成全部${progressKind}，不能标记完成`);
        }
        if (isFullyComplete && bucket[id].completed !== true) {
          throw new Error(`learningProgress.${scope}.${id} 已完成全部${progressKind}，必须标记完成`);
        }
      }
    }
  }

  const syllableProgress = saved.learningProgress?.syllableTraining;
  if (syllableProgress && typeof syllableProgress === "object") {
    const orderedStageIds = [
      syllableTraining.sections[0].id,
      ...syllableTraining.rules.map((rule) => rule.id),
      syllableTraining.sections[2].id,
      syllableTraining.sections[3].id
    ];
    for (let index = 1; index < orderedStageIds.length; index += 1) {
      const currentId = orderedStageIds[index];
      const previousId = orderedStageIds[index - 1];
      const currentEntry = syllableProgress[currentId];
      const hasCurrentProgress =
        currentEntry &&
        Object.values(currentEntry).some(
          (value) => value === true || (Array.isArray(value) && value.length > 0)
        );
      if (hasCurrentProgress && syllableProgress[previousId]?.completed !== true) {
        throw new Error(`learningProgress.syllableTraining 必须先完成 ${previousId} 才能记录 ${currentId}`);
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

function validatePersistedLocalProgressData(saved) {
  progressTransfer.validateLearningProgress(saved.learningProgress || {});
  validateImportedProgressIds(saved);
  const normalizedScreen = normalizedPersistedSyllableScreen(saved.screen, saved.learningProgress);
  if (normalizedScreen !== saved.screen) {
    throw new Error(`${saved.screen} 不是当前可达的音节训练页面`);
  }
  return true;
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
  const previousSyllableSentenceId = activeSyllableSentenceId();

  try {
    resetPersistedLocalProgressState();
    applyLocalProgressData(state.pendingProgressImport.data);
    state.screen = "profile";
    reconcileSyllableSentenceProgressChange(previousSyllableSentenceId);
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
  const snapshot = {
    schemaVersion: window.ANA_TILIM_CLOUD?.SCHEMA_VERSION || 1,
    modifiedAt: state.modifiedAt,
    preferencesUpdatedAt: state.preferencesUpdatedAt,
    favoriteUpdatedAt: state.favoriteUpdatedAt,
    learningProgress: state.learningProgress,
    mistakes: state.mistakes,
    syllableMistakes: state.syllableMistakes,
    favorite: state.favorite,
    dailyActivity: state.dailyActivity,
    preferences: state.preferences
  };
  validateCloudProgressSnapshot(snapshot);
  return snapshot;
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
  validateImportedProgressIds({ learningProgress, syllableMistakes: snapshot?.syllableMistakes });
}

function applyCloudSnapshot(snapshot) {
  validateCloudProgressSnapshot(snapshot);
  const previousSyllableSentenceId = activeSyllableSentenceId();
  const normalized = window.ANA_TILIM_CLOUD.normalizeSnapshot(snapshot);
  state.learningProgress = normalized.learningProgress;
  state.mistakes = normalized.mistakes;
  state.syllableMistakes = normalizeSyllableMistakes(normalized.syllableMistakes);
  state.favorite = normalized.favorite;
  state.dailyActivity = normalized.dailyActivity;
  state.preferences = normalizePreferences(normalized.preferences);
  applyInterfaceLanguage(state.preferences.uiLanguage, { explicit: false });
  state.modifiedAt = normalized.modifiedAt;
  state.preferencesUpdatedAt = normalized.preferencesUpdatedAt;
  state.favoriteUpdatedAt = normalized.favoriteUpdatedAt;
  state.syncDirty = false;
  reconcileSyllableSentenceProgressChange(previousSyllableSentenceId);
}

function emptyLearningProgress() {
  return {
    latinWriting: {},
    letters: {},
    combos: {},
    syllableTraining: {},
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
      syllableMistakes: state.syllableMistakes,
      writingChecks: state.writingChecks,
      writingStrokes: state.writingStrokes,
      favorite: state.favorite,
      selectedPicture: state.selectedPicture,
      selectedListening: state.selectedListening,
      practiceAudioPlayed: state.practiceAudioPlayed,
      keyboardValue: state.keyboardValue,
      latinKeyboardValue: state.latinKeyboardValue,
      latinKeyboardLessonIndex: state.latinKeyboardLessonIndex,
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
  state.syllableMistakes = { connection: [], break: [] };
  state.writingChecks = [];
  state.writingStrokes = {};
  state.favorite = false;
  state.selectedPicture = "";
  state.selectedListening = "";
  state.practiceAudioPlayed = false;
  state.keyboardValue = "";
  state.latinKeyboardValue = "";
  state.latinKeyboardLessonIndex = 0;
  state.syllableSectionId = "two-letter-warmup";
  state.syllableItemIndex = 0;
  state.syllableRuleId = syllableTraining.rules[0].id;
  state.syllableAnswerId = "";
  state.syllableShowStandard = false;
  state.syllableAnswerSubmitted = false;
  state.syllableConnectionAnswerId = "";
  state.syllableConnectionSubmitted = false;
  state.syllableConnectionMode = "lesson";
  state.syllableConnectionReviewItemId = "";
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
  const effectiveLanguage = appConfig.edition === "cn"
    ? "zh"
    : i18n.resolveLanguage(language, systemLanguages, systemFallbackLanguage);
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
      categoryTitle: t("audio.categoryAlphabet"),
      unit: learningUnitOrdinal("letters"),
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
      unit: learningUnitOrdinal("letters"),
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
      unit: learningUnitOrdinal("basic-phrases"),
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
  } else if (scope === "reading" && step === "completion") {
    progress.completed = true;
    recordDailyActivity(`${scope}:${id}:completed`);
  } else if (scope === "practice" && step === "listen") {
    const group = practiceGroups.find((item) => item.id === id);
    if (group && practiceListeningRoundComplete(group)) {
      progress.completed = true;
    }
  } else if (scope !== "reading" && ["recognition", "keyboard", "build", "repeat", "write", "review", "completed"].includes(step)) {
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
    const [unitName, label = unit.title] = unit.title.split(/[:：]\s*/u);
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
    } else if (unit.id === "syllable-training") {
      const syllableProgressIds = [
        syllableTraining.sections[0].id,
        ...syllableTraining.rules.map((rule) => rule.id),
        syllableTraining.sections[2].id,
        syllableTraining.sections[3].id
      ];
      completed = countCompletedForIds("syllableTraining", syllableProgressIds);
      total = syllableProgressIds.length;
    } else if (unit.id === "basic-phrases") {
      completed = countCompleted("vocab");
      total = unit.groups.length;
    } else if (unit.id === "afanti-stories") {
      completed = countCompletedForIds("afanti", afantiStories.map((story) => story.id));
      total = afantiStories.length;
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
    id: `mistake-${escapeHtml(mistake.key)}`,
    type: escapeHtml(useEnglish ? t("practice.reviewType") : mistake.kindLabel),
    value: escapeHtml(mistake.value),
    latin: escapeHtml(mistake.latin),
    label: escapeHtml(useEnglish ? t("practice.reviewLabel") : mistake.source),
    hint: escapeHtml(
      useEnglish
        ? t("practice.reviewHint", { count: mistake.attempts })
        : `${mistake.note} ${mistake.help || ""} 错 ${mistake.attempts} 次。`
    ),
    parts: [escapeHtml(mistake.value)],
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

function physicalKeyboardParts(targetValue) {
  const strokes = uyghurKeyboard.keystrokesForText(targetValue);
  const parts = strokes.map((stroke) => stroke.value);

  return parts.join("") === targetValue ? parts : Array.from(targetValue);
}

function keyboardPartLabel(part) {
  return part === " " ? t("keyboard.space") : part;
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

function renderKeyboardGuide(parts, targetValue, currentValue = state.keyboardValue) {
  const guide = keyboardGuideState(parts, targetValue, currentValue);
  const nextStroke = nextPhysicalKeyboardStroke(targetValue, currentValue);
  const needsShiftToggle = Boolean(nextStroke) && Boolean(state.keyboardShift) !== nextStroke.shifted;
  const nextPartLabel = keyboardPartLabel(guide.nextPart);
  const stepText = guide.isComplete
    ? t("keyboard.complete")
    : guide.isOffTrack
      ? t("keyboard.removeWrong")
      : needsShiftToggle
        ? t("keyboard.nextStep", { step: guide.completeCount + 1, key: `Shift → ${nextPartLabel}` })
        : t("keyboard.nextStep", { step: guide.completeCount + 1, key: nextPartLabel });
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

function renderUyghurKeyboard(targetValue = "", options = {}) {
  const currentValue = typeof options.currentValue === "string" ? options.currentValue : state.keyboardValue;
  const keyAction = options.keyAction || "key";
  const backspaceAction = options.backspaceAction || "backspace";
  const nextStroke = nextPhysicalKeyboardStroke(targetValue, currentValue);
  const shiftMatchesNextStroke = Boolean(nextStroke) && Boolean(state.keyboardShift) === nextStroke.shifted;
  const needsShiftToggle = Boolean(nextStroke) && !shiftMatchesNextStroke;
  const isSpaceNext = shiftMatchesNextStroke && nextStroke?.code === "Space";
  const isComplete = Boolean(targetValue) && currentValue === targetValue;
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
        data-action="${escapeHtml(keyAction)}"
        data-key="${escapeHtml(output)}"
        data-code="${key.code}"
        data-physical-key="${key.physical}"
        type="button"
        aria-label="${t("keyboard.keyAria", { key: key.physical, value: escapeHtml(output) })}"
      >
        <small>${key.physical}</small>
        <strong>${escapeHtml(output)}</strong>
      </button>
    `;
  };

  return `
    <div class="uyghur-keyboard" aria-label="${t("keyboard.aria")}">
      <div class="uyghur-keyboard-row row-top">
        ${topRow.map(renderLetterKey).join("")}
      </div>
      <div class="uyghur-keyboard-row row-home">
        ${homeRow.map(renderLetterKey).join("")}
      </div>
      <div class="uyghur-keyboard-row row-bottom">
        <button class="key-button utility keyboard-shift ${state.keyboardShift ? "active" : ""} ${needsShiftToggle ? "next-key" : ""}" data-action="toggle-keyboard-shift" type="button" aria-label="Shift" aria-pressed="${state.keyboardShift}">⇧</button>
        ${bottomRow.map(renderLetterKey).join("")}
        <button class="key-button utility keyboard-backspace" data-action="${escapeHtml(backspaceAction)}" type="button" aria-label="${t("keyboard.backspace")}">⌫</button>
      </div>
      <div class="uyghur-keyboard-tools" aria-label="${t("keyboard.toolsAria")}">
        <button class="key-button utility keyboard-space uyghur ${isSpaceNext ? "next-key" : ""}" data-action="${escapeHtml(keyAction)}" data-key=" " data-code="Space" data-physical-key="Space" type="button" aria-label="${t("keyboard.spaceAria")}">بوشلۇق</button>
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

function renderWritingComparison({ value, parts, forms = [], selectedIndex = 0 }) {
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
          <p class="caption">${t("writing.chooseForm")}</p>
          <h2 class="section-title"><span class="uyghur">${displayStandaloneLetterGlyph(value)}</span></h2>
        </div>
        <span class="step-state">${t("writing.itemCount", { count: comparisonItems.length })}</span>
      </div>
      <div class="writing-form-selector" role="group" aria-label="${t("writing.selectFormAria")}">
        ${comparisonItems
          .map(
            (item, index) => `
              <button
                class="writing-form-option ${index === selectedIndex ? "active" : ""}"
                data-action="select-letter-writing-form"
                data-letter-writing-form-option
                data-form-index="${index}"
                type="button"
                aria-pressed="${index === selectedIndex}"
              >
                <span>${escapeHtml(item.label)}</span>
                <strong class="uyghur">${escapeHtml(displayLetterFormGlyph(item.value))}</strong>
              </button>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function activeLetterWritingDetail() {
  if (state.screen === "practiceSession" && currentPracticeGroup().mode === "write") {
    return letterDetails[currentPracticeItem()?.letterId] || currentLetter();
  }
  return currentLetter();
}

function renderWritingCanvas(value, label = "手写板", options = {}) {
  const fallbackId = options.fallbackId || "";
  const fallbackMessage = options.fallbackMessage || "";
  const guideVisible = typeof options.guideVisible === "boolean" ? options.guideVisible : state.showGuide;
  const latinWritingHooks = options.latinWritingHooks === true;
  const letterWritingHooks = options.letterWritingHooks === true;
  const guideGlyph = letterWritingHooks ? displayLetterFormGlyph(value) : displayStandaloneLetterGlyph(value);

  return `
    <div
      class="writing-pad ${guideVisible ? "" : "hide-guide"}"
      aria-label="${escapeHtml(label)}"
      ${latinWritingHooks ? "data-latin-writing-pad" : ""}
      ${letterWritingHooks ? "data-letter-writing-pad" : ""}
    >
      <span
        class="uyghur guide"
        ${latinWritingHooks ? "data-latin-writing-guide" : ""}
        ${letterWritingHooks ? "data-letter-writing-guide" : ""}
      >${escapeHtml(guideGlyph)}</span>
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

function resetPracticeState() {
  state.selectedPicture = "";
  state.selectedListening = "";
  state.practiceAudioPlayed = false;
  state.keyboardValue = "";
  state.keyboardShift = false;
  state.letterWritingFormIndex = 0;
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
  const nextOrdinal = next.title.split(/[:：]/u)[0];
  return {
    ...base,
    nextLabel: i18n.getLanguage() === "en" ? `Enter ${nextOrdinal}` : `进入${nextOrdinal}`,
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

function speakerIcon() {
  return `
    <svg class="speaker-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 9v6h4l5 4V5L8 9H4"></path>
      <path d="M16 9.5a4 4 0 0 1 0 5"></path>
      <path d="M18.5 7a7 7 0 0 1 0 10"></path>
    </svg>
  `;
}

function renderAudioButton({ audio, label, className = "", accessibleLabel = "" }) {
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
      aria-label="${escapeHtml(accessibleLabel || `${t("audio.play")} ${label}`)}"
    >${speakerIcon()}</button>
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

function renderAudioFocus({ audio, label, title, hint, hideFile = false, hideCaption = false, buttonOnly = false, className = "" }) {
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

  return `<button class="primary-button continue-course-button" ${attributes} type="button">${t("common.continueUnitCourse")}</button>`;
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

function render({ persist = true } = {}) {
  if (!normalizeActiveSyllableRoute()) {
    persist = false;
  }
  if (state.screen === "settings") {
    state.screen = "profile";
  }

  const screens = {
    welcome: renderWelcome,
    home: renderHome,
    learn: renderLearnPath,
    unit: renderUnitDetail,
    latinKeyboardIntro: renderLatinKeyboardIntro,
    uyghurKeyboardWords: renderUyghurKeyboardWords,
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
    syllableWarmup: renderSyllableWarmup,
    syllableRules: renderSyllableRules,
    syllableConnections: renderSyllableConnections,
    syllableSentences: renderSyllableSentences,
    syllableReview: renderSyllableReview,
    afantiStories: renderAfantiStories,
    vocab: renderVocabLesson,
    vocabRecognition: renderVocabRecognition,
    vocabKeyboard: renderVocabKeyboard,
    vocabComplete: renderVocabComplete,
    reading: renderReadingLesson,
    practiceSession: renderPracticeSession,
    practiceComplete: renderPracticeComplete,
    library: renderLibrary,
    profile: renderProfile,
    feedback: renderFeedback
  };

  const screenRenderer = screens[state.screen];
  if (!screenRenderer) {
    state.screen = "home";
  }
  const nextScrollViewKey = scrollViewKey();
  const scrollViewChanged = Boolean(
    renderedScrollViewKey && renderedScrollViewKey !== nextScrollViewKey
  );
  if (scrollViewChanged) {
    viewScrollPositions.set(renderedScrollViewKey, app.scrollTop || 0);
  }
  applyPreferencesToRoot();
  app.innerHTML = (screens[state.screen] || renderHome)();
  renderedScrollViewKey = nextScrollViewKey;
  if (scrollViewChanged) {
    const restoredScrollTop = viewScrollPositions.get(nextScrollViewKey) || 0;
    const restoreScrollPosition = () => {
      if (scrollViewKey() === nextScrollViewKey) {
        app.scrollTop = restoredScrollTop;
      }
    };
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(restoreScrollPosition);
    } else {
      restoreScrollPosition();
    }
  }
  initializeFormExampleHighlights();
  initializeWritingCanvases();
  if (persist && !state.pendingProgressImport) {
    saveLocalProgress();
  }
  syncAudioAutoplay();
}

function scrollViewKey() {
  let viewContext = "";
  if (state.screen === "unit") {
    viewContext = state.selectedUnitId;
  } else if (state.screen === "group") {
    viewContext = state.selectedGroupId;
  } else if (
    ["letter", "letterWriting", "picture", "listening", "letterOdd", "letterSound", "keyboard", "complete"].includes(
      state.screen
    )
  ) {
    viewContext = `${state.selectedGroupId}:${state.currentLetterId}`;
  } else if (["combo", "comboRecognition", "comboBuild", "comboWriting", "comboKeyboard", "comboComplete"].includes(state.screen)) {
    viewContext = `${state.selectedComboGroupId}:${state.currentComboItemId}`;
  } else if (["vocab", "vocabRecognition", "vocabKeyboard", "vocabComplete"].includes(state.screen)) {
    viewContext = `${state.selectedVocabGroupId}:${state.currentVocabItemId}`;
  } else if (["practiceSession", "practiceComplete"].includes(state.screen)) {
    viewContext = `${state.selectedPracticeGroupId}:${state.currentPracticeItemId}`;
  } else if (state.screen === "reading") {
    viewContext = `${state.selectedReadingUnitId}:${state.selectedReadingGroupId}`;
  } else if (state.screen === "afantiStories") {
    viewContext = state.selectedAfantiStoryId;
  } else if (state.screen === "latinWritingForms") {
    viewContext = state.latinWritingLetterId;
  }
  return `${state.screen}:${viewContext}`;
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
  if (appConfig.edition === "cn") return "";
  return `
    <div class="language-switcher ${compact ? "is-compact" : ""}" role="group" aria-label="${t("language.label")}">
      ${["zh", "en"].map((language) => `
        <button type="button" data-action="set-language" data-language="${language}"
          aria-pressed="${state.interfaceLanguage === language}">${compact ? (language === "zh" ? "中文" : "EN") : t(language === "zh" ? "language.chinese" : "language.english")}</button>`).join("")}
    </div>`;
}

function profileLanguageSelect() {
  if (appConfig.edition === "cn") return "";
  return `
    <select id="profile-language-select" class="language-select"
      data-action="set-language-select" aria-label="${t("language.label")}">
      ${["zh", "en"].map((language) => `
        <option value="${language}"${state.interfaceLanguage === language ? " selected" : ""}>${t(language === "zh" ? "language.chinese" : "language.english")}</option>`).join("")}
    </select>`;
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

function cloudAccountUserId() {
  return cloudSync?.session()?.user?.id || "";
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
      <button class="secondary-button" data-action="cloud-sign-out" type="button">${t("auth.signOut")}</button>
    `;
  }

  const isRegistering = state.authMode === "register";
  return `
    <div class="password-auth-shell">
      <div class="auth-mode-tabs" role="tablist" aria-label="${t("auth.modeAria")}">
        <button class="auth-mode-tab ${isRegistering ? "" : "active"}" data-action="switch-auth-mode" data-mode="login" role="tab" aria-selected="${!isRegistering}" type="button">${t("auth.loginTab")}</button>
        <button class="auth-mode-tab ${isRegistering ? "active" : ""}" data-action="switch-auth-mode" data-mode="register" role="tab" aria-selected="${isRegistering}" type="button">${t("auth.registerTab")}</button>
      </div>
      <div class="password-auth-fields">
        ${
          isRegistering
            ? `<label class="auth-field"><span>${t("auth.nickname")}</span><input id="password-auth-name" type="text" autocomplete="name" maxlength="40" placeholder="${t("auth.nicknamePlaceholder")}" /></label>`
            : ""
        }
        <label class="auth-field"><span>${t("auth.email")}</span><input id="password-auth-email" type="email" autocomplete="email" value="${escapeHtml(state.authEmail)}" placeholder="name@example.com" /></label>
        <label class="auth-field"><span>${t("auth.password")}</span><input id="password-auth-password" type="password" autocomplete="${isRegistering ? "new-password" : "current-password"}" minlength="8" placeholder="${t("auth.passwordPlaceholder")}" /></label>
        ${
          isRegistering
            ? `<label class="auth-field"><span>${t("auth.confirmPassword")}</span><input id="password-auth-confirm" type="password" autocomplete="new-password" minlength="8" placeholder="${t("auth.confirmPasswordPlaceholder")}" /></label><p class="auth-warning">${t("auth.passwordWarning")}</p>`
            : ""
        }
        <button class="primary-button" data-action="${isRegistering ? "password-register" : "password-login"}" type="button">${isRegistering ? t("auth.registerSubmit") : t("auth.loginSubmit")}</button>
      </div>
    </div>
    <div class="auth-divider" aria-hidden="true"><span>${t("auth.otherMethods")}</span></div>
    <div class="auth-actions">
      <button class="primary-button" data-action="cloud-google-login" type="button">${t("auth.google")}</button>
      <button class="secondary-button" data-action="show-email-login" type="button">${t("auth.emailOtp")}</button>
    </div>
    ${
      state.emailAuthExpanded
        ? `<div class="email-auth-fields">
            <label class="auth-field"><span>${t("auth.email")}</span><input id="auth-email" type="email" autocomplete="email" value="${escapeHtml(state.authEmail)}" placeholder="name@example.com" /></label>
            ${
              state.emailCodeSent
                ? `<label class="auth-field"><span>${t("auth.codeLabel")}</span><input id="auth-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" /></label><button class="primary-button" data-action="verify-email-otp" type="button">${t("auth.verifyCode")}</button>`
                : `<button class="primary-button" data-action="request-email-otp" type="button">${t("auth.sendCode")}</button>`
            }
          </div>`
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
      <div class="hero-content ${appConfig.cloudEnabled ? "with-auth" : "local-only"}">
        <div class="hero-intro">
          <img class="hero-logo" src="${escapeHtml(appConfig.logoPath)}" alt="${escapeHtml(appConfig.brandName)} logo" />
          <h1>${escapeHtml(appConfig.brandName)}</h1>
          <div class="uyghur uyghur-title">${escapeHtml(appConfig.brandNameUyghur)}</div>
          <p class="hero-copy">
            ${t("welcome.title")}
          </p>
          <button class="primary-button" data-action="continue-local" type="button">
            ${accountEmail ? t("home.continue") : appConfig.cloudEnabled ? t("welcome.continueGuest") : "直接开始学习"}
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
                >${accountEmail ? t("welcome.viewSyncStatus") : t("welcome.optionalSync")}</button>
                <div class="auth-panel-region" id="welcome-auth-panel" ${state.authPanelExpanded ? "" : "hidden"}>
                  ${
                    state.authPanelExpanded
                      ? `<article class="card auth-panel">
                          <div>
                            <p class="caption">${t("welcome.subtitle")}</p>
                            <h2 class="section-title">${accountEmail ? t("welcome.synced") : t("welcome.saveProgress")}</h2>
                            <p class="muted">${accountEmail ? t("welcome.signedInAs", { email: escapeHtml(accountEmail) }) : t("welcome.syncDetail")}</p>
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
  const uyghurName =
    unit.readingKind === "quote" && typeof group.titleUyghur === "string"
      ? `<span class="reading-topic-uyghur-name" lang="ug" dir="rtl">${escapeHtml(group.titleUyghur)}</span>`
      : "";
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
        <span class="reading-topic-name-line">
          <strong>${group.title}</strong>
          ${uyghurName}
        </span>
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

function renderAfantiUnitDetail(unit) {
  const english = i18n.getLanguage() === "en";
  return screen(
    `
      ${topBar(
        unit.title,
        unit.subtitle,
        "",
        `<button class="back-button" data-action="go" data-target="learn" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        <div class="reading-topic-list afanti-topic-list">
          ${afantiStories
            .map(
              (story) => `
                <button
                  class="reading-topic-row afanti-topic-row"
                  data-action="open-afanti-story"
                  data-id="${escapeHtml(story.id)}"
                  type="button"
                  aria-label="${english ? "Open " : "进入"}${escapeHtml(english ? story.en.title : story.title.zh)}"
                >
                  <span>
                    <strong>${escapeHtml(english ? story.en.title : story.title.zh)}</strong>
                    <small><span lang="ug" dir="rtl">${escapeHtml(story.title.uyghur)}</span> · ${story.actualWordCount} ${english ? "words" : "词"}</small>
                  </span>
                  <span class="topic-end">
                    <span class="topic-arrow" aria-hidden="true">→</span>
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

function renderUnitLearningMapCard({
  unitId,
  target,
  title,
  description,
  progressText,
  complete = false,
  locked = false,
  lockText = "",
  recommended = false,
  extra = ""
}) {
  const english = i18n.getLanguage() === "en";
  return `
    <article
      class="card unit-learning-map-card${complete ? " is-complete" : ""}${recommended ? " is-recommended" : ""}${locked ? " is-locked" : ""}"
      data-unit-map-target="${escapeHtml(target)}"
      data-unit-map-locked="${locked}"
    >
      <div class="unit-learning-map-copy">
        <div class="section-row">
          <div>
            <p class="caption">${recommended ? (english ? "Recommended next" : "推荐继续") : complete ? (english ? "Complete · ready to review" : "已完成 · 可复习") : locked ? (english ? "Locked" : "尚未解锁") : (english ? "Open directly" : "可直接进入")}</p>
            <h2 class="section-title">${escapeHtml(title)}</h2>
          </div>
          <span class="step-state">${escapeHtml(progressText)}</span>
        </div>
        <p class="muted">${escapeHtml(locked ? lockText : description)}</p>
      </div>
      <div class="unit-learning-map-actions">
        <button
          class="${recommended ? "primary-button" : "secondary-button"}"
          data-action="open-unit-stage"
          data-unit-id="${escapeHtml(unitId)}"
          data-target="${escapeHtml(target)}"
          type="button"
          ${locked ? "disabled" : ""}
        >${complete ? (english ? "Study again" : "再次学习") : recommended ? (english ? "Continue learning" : "继续学习") : (english ? "Open lesson" : "进入学习")}</button>
        ${extra}
      </div>
    </article>
  `;
}

function completedLatinKeyboardLessonIds() {
  const entry = state.learningProgress.latinWriting?.qwerty;
  if (Array.isArray(entry?.completedIds)) return entry.completedIds;
  return entry?.completed === true ? latinWriting.keyboardLessons.map((item) => item.id) : [];
}

function latinKeyboardResumeIndex() {
  const completedIds = completedLatinKeyboardLessonIds();
  const nextIndex = latinWriting.keyboardLessons.findIndex((item) => !completedIds.includes(item.id));
  return nextIndex >= 0 ? nextIndex : latinWriting.keyboardLessons.length - 1;
}

function syllableWarmupResumeIndex() {
  const completedIds = completedSyllableItemIds(syllableTraining.sections[0].id);
  const nextIndex = syllableTraining.twoLetterItems.findIndex((item) => !completedIds.includes(item.id));
  return nextIndex >= 0 ? nextIndex : syllableTraining.twoLetterItems.length - 1;
}

function renderLatinWritingUnitMap(unit) {
  const english = i18n.getLanguage() === "en";
  const qwertyIds = completedLatinKeyboardLessonIds();
  const uyghurIds = completedUyghurKeyboardLessonIds();
  const classificationComplete = Boolean(state.learningProgress.latinWriting?.classification?.completed);
  const contrastComplete = Boolean(state.learningProgress.latinWriting?.["vowel-contrast"]?.completed);
  const dictationComplete = Boolean(state.learningProgress.latinWriting?.dictation?.completed);
  const formsComplete = Boolean(state.learningProgress.latinWriting?.forms?.completed);
  const dictationIds = completedLatinWritingItemIds("dictation");
  const cards = [
    {
      target: "latinKeyboardIntro",
      title: english ? "Latin keyboard" : "拉丁键盘",
      description: english ? "Practise Latin QWERTY and ULY input through common words, phrases, and a complete sentence." : "从常用词到词组和短句，练习普通 QWERTY 与 ULY 输入。",
      progressText: `${qwertyIds.length} / ${latinWriting.keyboardLessons.length}`,
      complete: qwertyIds.length === latinWriting.keyboardLessons.length
    },
    {
      target: "uyghurKeyboardWords",
      title: english ? "Uyghur keyboard" : "维吾尔语键盘",
      description: english ? "Switch between the on-screen and physical keyboard, progressing from two-letter combinations to a complete sentence." : "可切换屏幕键盘和实体键盘，从两字母组合练到完整短句。",
      progressText: `${uyghurIds.length} / ${latinWriting.uyghurKeyboardLessons.length}`,
      complete: uyghurIds.length === latinWriting.uyghurKeyboardLessons.length
    },
    {
      target: "latinLetterClasses",
      title: english ? "Vowels and consonants" : "元辅音分类",
      description: english ? "Organise 8 vowels and 24 consonants, then compare four easily confused vowel pairs." : "整理 8 个元音和 24 个辅音，再完成四组容易混淆的元音对比。",
      progressText: `${Number(classificationComplete) + Number(contrastComplete)} / 2`,
      complete: classificationComplete && contrastComplete
    },
    {
      target: "latinDictation",
      title: english ? "ULY dictation" : "ULY 默写",
      description: english ? "Write Uyghur letters from ULY prompts, then switch among real letter forms for tracing." : "根据 ULY 提示默写维吾尔字母，并切换真实字母形式进行临摹。",
      progressText: `${dictationIds.length} / ${latinDictationLetterIds.length}${english ? " letters" : " 个字母"}${formsComplete ? (english ? " · forms practised" : " · 形式已练") : ""}`,
      complete: dictationComplete && formsComplete
    }
  ];
  const recommendedIndex = Math.max(0, cards.findIndex((card) => !card.complete));

  return screen(
    `
      ${topBar(
        unit.title,
        unit.subtitle,
        "",
        `<button class="back-button" data-action="go" data-target="learn" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack unit-learning-map" aria-label="${english ? "Unit 2 learning map" : "第二单元学习地图"}">
        ${cards.map((card, index) => renderUnitLearningMapCard({
          ...card,
          unitId: unit.id,
          recommended: index === recommendedIndex
        })).join("")}
      </section>
    `,
    "learn"
  );
}

function syllableMapStageProgress(progressId) {
  const expectedIds = expectedSyllableCompletedIds(progressId);
  const completedIds = state.learningProgress.syllableTraining?.[progressId]?.completedIds;
  return {
    completed: syllableStageComplete(progressId),
    count: Array.isArray(completedIds) ? completedIds.length : 0,
    total: expectedIds.length
  };
}

function syllableUnitStageIsUnlocked(target) {
  if (target === "syllableWarmup") return true;
  if (target === "syllableRules") return syllableRulesPrerequisitesComplete();
  if (target === "syllableConnections") return syllableConnectionPrerequisitesComplete();
  if (target === "syllableSentences") return syllableSentencePrerequisitesComplete();
  return false;
}

function renderSyllableTrainingUnitMap(unit) {
  const english = i18n.getLanguage() === "en";
  const warmupId = syllableTraining.sections[0].id;
  const connectionId = syllableTraining.sections[2].id;
  const sentenceId = syllableTraining.sections[3].id;
  const warmup = syllableMapStageProgress(warmupId);
  const ruleCount = syllableTraining.rules.filter((rule) => syllableStageComplete(rule.id)).length;
  const rulesComplete = ruleCount === syllableTraining.rules.length;
  const connections = syllableMapStageProgress(connectionId);
  const sentences = syllableMapStageProgress(sentenceId);
  const reachableTarget = reachableSyllableTrainingScreen();
  const reviewCount = state.syllableMistakes.connection.length + state.syllableMistakes.break.length;
  const cards = [
    {
      target: "syllableWarmup",
      title: english ? "Two-letter warm-up" : "两字母热身",
      description: english ? "Separate 10 real two-letter combinations, then join and read them." : "把 10 组真实两字母组合先拆开看，再合起来读。",
      progressText: `${warmup.count} / ${warmup.total}`,
      complete: warmup.completed,
      locked: false
    },
    {
      target: "syllableRules",
      title: english ? "Syllable strategies" : "音节划分规则",
      description: english ? "Learn four introductory strategies and complete four judgements for each strategy." : "逐条学习 4 个入门策略，并完成每条规则的 4 道判断。",
      progressText: `${ruleCount} / ${syllableTraining.rules.length}`,
      complete: rulesComplete,
      locked: !syllableRulesPrerequisitesComplete(),
      lockText: english ? "Complete the two-letter warm-up to unlock" : "完成两字母热身后解锁"
    },
    {
      target: "syllableConnections",
      title: english ? "Joining and breaks" : "连接与断开",
      description: english ? "Complete 12 joining and break judgements. Mistakes are saved separately for focused review." : "完成 12 道连接与断开判断，错题分别保存并可专项复习。",
      progressText: `${connections.count} / ${connections.total}`,
      complete: connections.completed,
      locked: !syllableConnectionPrerequisitesComplete(),
      lockText: english ? "Complete all four syllable strategies to unlock" : "完成 4 条音节划分规则后解锁",
      extra: !connections.completed && reviewCount === 0
        ? ""
        : `<button class="ghost-button" data-action="go" data-target="syllableReview" type="button">${reviewCount ? (english ? `Review ${reviewCount} mistakes` : `复习 ${reviewCount} 道错题`) : (english ? "Open mistake review" : "查看错题复习")}</button>`
    },
    {
      target: "syllableSentences",
      title: english ? "Syllable reading in short sentences" : "短句分音节朗读",
      description: english ? "Use the existing human-recorded sentence audio to complete six increasingly challenging syllable-reading sentences." : "用已有真人整句音频完成 6 句逐步变难的分音节朗读。",
      progressText: `${sentences.count} / ${sentences.total}`,
      complete: sentences.completed,
      locked: !syllableSentencePrerequisitesComplete(),
      lockText: english ? "Complete the joining and break judgements to unlock" : "完成连接与断开判断后解锁"
    }
  ];

  return screen(
    `
      ${topBar(
        unit.title,
        unit.subtitle,
        "",
        `<button class="back-button" data-action="go" data-target="learn" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack unit-learning-map" aria-label="${english ? "Unit 4 learning map" : "第四单元学习地图"}">
        ${cards.map((card) => renderUnitLearningMapCard({
          ...card,
          unitId: unit.id,
          recommended: !card.locked && card.target === reachableTarget
        })).join("")}
      </section>
    `,
    "learn"
  );
}

function renderUnitDetail() {
  const unit = currentUnit();
  if (unit.id === "latin-keyboard-writing") {
    return renderLatinWritingUnitMap(unit);
  }
  if (unit.id === "syllable-training") {
    return renderSyllableTrainingUnitMap(unit);
  }
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

  if (unit.kind === "afanti") {
    return renderAfantiUnitDetail(unit);
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

const afantiLanguageDefinitions = Object.freeze({
  latin: Object.freeze({ label: "Latin", className: "afanti-latin", lang: "ug-Latn" }),
  zh: Object.freeze({ label: "中文", className: "afanti-zh", lang: "zh-CN" }),
  en: Object.freeze({ label: "English", className: "afanti-en", lang: "en" })
});

function availableAfantiLanguages() {
  const configured = Array.isArray(appConfig.afantiLanguages) ? appConfig.afantiLanguages : [];
  return configured.filter(
    (language, index) =>
      Object.hasOwn(afantiLanguageDefinitions, language) && configured.indexOf(language) === index
  );
}

function currentAfantiStory() {
  const selected = afantiStories.find((story) => story.id === state.selectedAfantiStoryId);
  if (selected) return selected;
  state.selectedAfantiStoryId = afantiStories[0]?.id || "";
  return afantiStories[0] || null;
}

function afantiParagraphsForLanguage(story, language) {
  if (language === "en") return story.en?.paragraphs || [];
  return story[language]?.paragraphs || [];
}

function renderAfantiLanguageSwitches() {
  return `
    <div class="afanti-language-switches" role="group" aria-label="辅助语言显示">
      ${availableAfantiLanguages()
        .map((language) => {
          const definition = afantiLanguageDefinitions[language];
          const visible = state.afantiVisibleLanguages[language] === true;
          return `
            <button
              class="afanti-language-toggle${visible ? " is-active" : ""}"
              data-action="toggle-afanti-language"
              data-language="${escapeHtml(language)}"
              type="button"
              aria-pressed="${visible}"
            >
              ${escapeHtml(definition.label)}
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderAfantiParagraph(story, paragraph, index) {
  const translations = availableAfantiLanguages()
    .filter((language) => state.afantiVisibleLanguages[language] === true)
    .map((language) => {
      const definition = afantiLanguageDefinitions[language];
      const translatedParagraph = afantiParagraphsForLanguage(story, language)[index];
      if (!translatedParagraph) return "";
      return `<p class="afanti-translation ${definition.className}" lang="${definition.lang}" dir="ltr">${escapeHtml(translatedParagraph)}</p>`;
    })
    .join("");

  return `
    <article class="card afanti-paragraph-card" data-afanti-paragraph="${index + 1}">
      <p class="uyghur afanti-uyghur" lang="ug" dir="rtl">${escapeHtml(paragraph)}</p>
      ${translations}
    </article>
  `;
}

function renderAfantiStories() {
  const story = currentAfantiStory();
  if (!story) {
    return screen(
      `${topBar("阿凡提小故事", "故事内容暂不可用", "", `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回">←</button>`)}
       <article class="card"><p>故事内容暂不可用。</p></article>`,
      "learn"
    );
  }

  const storyIndex = afantiStories.findIndex((item) => item.id === story.id);
  const previousStory = storyIndex > 0 ? afantiStories[storyIndex - 1] : null;
  const nextStory = storyIndex < afantiStories.length - 1 ? afantiStories[storyIndex + 1] : null;

  return screen(
    `
      ${topBar(
        escapeHtml(story.title.uyghur),
        `第 ${story.sequence} / ${afantiStories.length} 篇 · 阿凡提小故事`,
        renderAfantiLanguageSwitches(),
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回本单元">←</button>`
      )}
      <section class="afanti-reading-layout">
        ${state.afantiVisibleLanguages.zh === true ? `<p class="caption afanti-theme">${escapeHtml(story.primaryTheme)}</p>` : ""}
        <div class="afanti-paragraphs">
          ${story.uyghur.paragraphs
            .map((paragraph, index) => renderAfantiParagraph(story, paragraph, index))
            .join("")}
        </div>
        <div class="afanti-story-actions">
          <button
            class="secondary-button"
            data-action="select-afanti-story"
            data-id="${escapeHtml(previousStory?.id || "")}"
            type="button"
            ${previousStory ? "" : "disabled"}
          >上一篇</button>
          <button class="secondary-button" data-action="go" data-target="unit" type="button">返回故事列表</button>
          <button
            class="primary-button"
            data-action="select-afanti-story"
            data-id="${escapeHtml(nextStory?.id || "")}"
            type="button"
            ${nextStory ? "" : "disabled"}
          >下一篇</button>
        </div>
      </section>
    `,
    "learn"
  );
}

function currentSyllableWarmupItem() {
  const lastIndex = syllableTraining.twoLetterItems.length - 1;
  state.syllableItemIndex = Math.max(0, Math.min(lastIndex, Number(state.syllableItemIndex) || 0));
  return syllableTraining.twoLetterItems[state.syllableItemIndex];
}

function syllableWarmupSource(item) {
  const source = basicComboGroups
    .flatMap((group) => group.items)
    .find((combo) => combo.id === item.sourceComboId);
  const audio = comboAudioByItemId[item.sourceComboId];
  if (
    !source ||
    source.value !== item.standard ||
    source.latin !== item.latin ||
    !audio ||
    audio.outputPath !== item.audioPath
  ) {
    throw new Error(`Syllable warmup source mismatch: ${item.id}`);
  }
  return { source, audio };
}

function completedSyllableItemIds(progressId) {
  const progress = state.learningProgress?.syllableTraining?.[progressId];
  return Array.isArray(progress?.completedIds) ? progress.completedIds : [];
}

function submitSyllableItem(progressId, itemId, expectedIds) {
  const progress = ensureProgress("syllableTraining", progressId);
  const completedIds = completedSyllableItemIds(progressId);
  if (!completedIds.includes(itemId)) {
    progress.completedIds = [...completedIds, itemId];
    markCloudDirty("learning");
  }
  if (expectedIds.every((id) => progress.completedIds.includes(id))) {
    markProgress("syllableTraining", progressId, "completed");
  }
}

function renderSyllableWarmup() {
  const item = currentSyllableWarmupItem();
  const { audio } = syllableWarmupSource(item);
  const position = `${state.syllableItemIndex + 1} / ${syllableTraining.twoLetterItems.length}`;
  const isLast = state.syllableItemIndex === syllableTraining.twoLetterItems.length - 1;
  const revealed = state.syllableShowStandard;

  return screen(
    `
      ${topBar(
        "两字母热身",
        "先看两个部件，再自己合起来读",
        "",
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回">&larr;</button>`
      )}
      <section class="stack syllable-training-screen" data-syllable-warmup-id="${escapeHtml(item.id)}">
        ${renderItemProgress(position, "真实两字母组合")}
        <article class="card syllable-warmup-card">
          <p class="caption">从右往左看字母</p>
          <div class="syllable-parts" dir="rtl" aria-label="两个字母部件">
            ${item.parts
              .map(
                (part, index) =>
                  `<span class="uyghur syllable-part" data-syllable-part="${index}">${escapeHtml(part)}</span>`
              )
              .join('<span class="syllable-plus" aria-hidden="true"> + </span>')}
          </div>
          ${
            revealed
              ? `
                <div class="syllable-standard" data-syllable-standard="${escapeHtml(item.id)}">
                  <strong class="uyghur" dir="rtl">${escapeHtml(item.standard)}</strong>
                  ${renderLatinTransliteration(item.latin, "syllable-latin")}
                </div>
                <div class="syllable-audio-row">
                  ${renderAudioButton({
                    audio,
                    label: item.standard,
                    accessibleLabel: `播放 ${item.standard}，ULY ${item.latin}`
                  })}
                  <span>真人音频</span>
                </div>
              `
              : `
                <button class="primary-button" data-action="combine-syllable-warmup" type="button">合起来读</button>
              `
          }
        </article>
        ${
          revealed
            ? isLast
              ? '<button class="primary-button" data-action="go" data-target="syllableRules" type="button">继续：音节划分策略</button>'
              : '<button class="primary-button" data-action="next-syllable-warmup" type="button">下一个组合</button>'
            : ""
        }
      </section>
    `,
    "learn"
  );
}

function currentSyllableRule() {
  return syllableTraining.rules.find((rule) => rule.id === state.syllableRuleId) || syllableTraining.rules[0];
}

function syllableRuleExercise(rule) {
  const submittedIds = completedSyllableItemIds(rule.id);
  const currentIndex = state.syllableAnswerSubmitted
    ? Math.max(0, submittedIds.length - 1)
    : submittedIds.length;
  return rule.exercises[Math.min(currentIndex, rule.exercises.length - 1)];
}

function focusSyllableRuleElement(selector) {
  const focusElement = () => document.querySelector?.(selector)?.focus?.();
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(focusElement);
  } else {
    focusElement();
  }
}

function renderSyllableRules() {
  const rule = currentSyllableRule();
  const ruleIndex = syllableTraining.rules.findIndex((item) => item.id === rule.id);
  const submittedIds = completedSyllableItemIds(rule.id);
  const submittedCount = submittedIds.length;
  const exercise = syllableRuleExercise(rule);
  const ruleComplete = submittedCount === rule.exercises.length;
  const isLastRule = ruleIndex === syllableTraining.rules.length - 1;
  const selectedAnswer = state.syllableAnswerId;
  const displayedExerciseNumber = state.syllableAnswerSubmitted
    ? Math.max(1, submittedCount)
    : Math.min(submittedCount + 1, rule.exercises.length);

  return screen(
    `
      ${topBar(
        "音节划分策略",
        "每条规则紧接着练 4 题",
        "",
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回本单元">&larr;</button>`
      )}
      <section class="stack syllable-training-screen" data-syllable-rule-id="${escapeHtml(rule.id)}">
        ${
          state.syllableRuleCompletionNotice
            ? `
              <article class="card syllable-exercise-card">
                <div class="feedback ${state.syllableRuleCompletionNotice.correct ? "good" : "bad"}" data-syllable-feedback role="status" tabindex="-1">
                  <strong>${state.syllableRuleCompletionNotice.correct ? "判断正确" : "再看一次规则"}</strong>
                  <p>${escapeHtml(state.syllableRuleCompletionNotice.explanation)}</p>
                </div>
                <div class="feedback good" role="status"><strong>4 / 4</strong><p>本条规则的题目已全部提交。</p></div>
                <button class="primary-button" data-action="next-syllable-rule" type="button">下一条规则</button>
              </article>
            `
            : ""
        }
        ${renderItemProgress(`${ruleIndex + 1} / ${syllableTraining.rules.length} 条规则`, "按顺序完成当前规则")}
        <article class="card syllable-rule-card">
          <p class="caption">入门策略</p>
          <h2 class="section-title">${escapeHtml(rule.title)}</h2>
          <p>${escapeHtml(rule.explanation)}</p>
          <p class="syllable-rule-scope">${escapeHtml(rule.scope)}</p>
        </article>
        <article
          class="card syllable-exercise-card"
          data-syllable-exercise-id="${escapeHtml(exercise.id)}"
          data-syllable-question
          tabindex="-1"
          aria-labelledby="syllable-exercise-prompt-${escapeHtml(exercise.id)}"
        >
          <div class="section-row">
            <div>
              <p class="caption">当前规则练习</p>
              <h2 class="section-title">${displayedExerciseNumber} / ${rule.exercises.length}</h2>
            </div>
          </div>
          <p class="syllable-exercise-prompt" id="syllable-exercise-prompt-${escapeHtml(exercise.id)}">${escapeHtml(exercise.prompt)}</p>
          ${
            !ruleComplete && !state.syllableAnswerSubmitted
              ? `
                <div class="syllable-rule-options">
                  ${[
                    ["answer", exercise.answer],
                    ["distractor", exercise.distractor]
                  ]
                    .map(
                      ([answerId, label]) => `
                        <button
                          class="option-button ${selectedAnswer === answerId ? "selected" : ""}"
                          data-action="pick-syllable-rule-answer"
                          data-answer-id="${answerId}"
                          type="button"
                          aria-pressed="${selectedAnswer === answerId}"
                        >${escapeHtml(label)}</button>
                      `
                    )
                    .join("")}
                </div>
                <button class="primary-button" data-action="submit-syllable-rule-answer" type="button" ${selectedAnswer ? "" : "disabled"}>提交本题</button>
              `
              : ""
          }
          ${
            state.syllableAnswerSubmitted
              ? `
                <div class="feedback ${selectedAnswer === "answer" ? "good" : "bad"}" data-syllable-feedback role="status" tabindex="-1">
                  <strong>${selectedAnswer === "answer" ? "判断正确" : "再看一次规则"}</strong>
                  <p>${escapeHtml(rule.explanation)}</p>
                </div>
              `
              : ""
          }
          ${
            state.syllableAnswerSubmitted && !ruleComplete
              ? '<button class="primary-button" data-action="next-syllable-rule-exercise" type="button">继续下一题</button>'
              : ""
          }
          ${
            ruleComplete
              ? `
                <div class="feedback good" role="status"><strong>${submittedCount} / ${rule.exercises.length}</strong><p>本条规则的题目已全部提交。</p></div>
                ${
                  isLastRule
                    ? '<button class="primary-button" data-action="go" data-target="syllableConnections" type="button">继续：连读与断读专项</button>'
                    : '<button class="primary-button" data-action="next-syllable-rule" type="button">下一条规则</button>'
                }
              `
              : ""
          }
        </article>
      </section>
    `,
    "learn"
  );
}

function completedSyllableConnectionIds() {
  return completedSyllableItemIds(syllableTraining.sections[2].id);
}

function currentSyllableConnectionItem() {
  if (state.syllableConnectionMode !== "lesson") {
    const reviewBucket = state.syllableConnectionMode === "review-break" ? "break" : "connection";
    const reviewItemId = state.syllableConnectionReviewItemId || state.syllableMistakes[reviewBucket][0];
    return (
      syllableTraining.connectionItems.find((item) => item.id === reviewItemId) ||
      syllableTraining.connectionItems.find((item) => item.mistakeBucket === reviewBucket)
    );
  }
  const completedIds = completedSyllableConnectionIds();
  const currentIndex = state.syllableConnectionSubmitted
    ? Math.max(0, completedIds.length - 1)
    : Math.min(completedIds.length, syllableTraining.connectionItems.length - 1);
  return syllableTraining.connectionItems[currentIndex];
}

function updateSyllableMistake(item, isCorrect) {
  const bucketName = item.mistakeBucket;
  const currentIds = state.syllableMistakes[bucketName];
  const nextIds = isCorrect
    ? currentIds.filter((id) => id !== item.id)
    : currentIds.includes(item.id)
      ? currentIds
      : [...currentIds, item.id].slice(-24);
  if (nextIds.length !== currentIds.length || nextIds.some((id, index) => id !== currentIds[index])) {
    state.syllableMistakes = { ...state.syllableMistakes, [bucketName]: nextIds };
    markCloudDirty("learning");
  }
}

function learnerSyllableConnectionStatement(item) {
  return item.statement;
}

function renderSyllableConnections() {
  if (!syllableConnectionScreenIsReachable()) {
    const fallbackScreen = reachableSyllableTrainingScreen();
    state.screen = fallbackScreen;
    return fallbackScreen === "syllableWarmup" ? renderSyllableWarmup() : renderSyllableRules();
  }
  const item = currentSyllableConnectionItem();
  const completedIds = completedSyllableConnectionIds();
  const completed = completedIds.length === syllableTraining.connectionItems.length;
  const displayedNumber = state.syllableConnectionSubmitted
    ? Math.max(1, completedIds.length)
    : Math.min(completedIds.length + 1, syllableTraining.connectionItems.length);
  const bucketLabel = item.mistakeBucket === "connection" ? "连接判断" : "断开判断";
  const isReview = state.syllableConnectionMode !== "lesson";
  const submittedIsCorrect = state.syllableConnectionAnswerId === item.expectedAnswer;

  return screen(
    `
      ${topBar(
        "连读与断读专项",
        "阅读文字判断，不使用伪造字形",
        "",
        `<button class="back-button" data-action="go" data-target="${isReview ? "syllableReview" : "unit"}" type="button" aria-label="${isReview ? "返回错题复习" : "返回本单元"}">&larr;</button>`
      )}
      <section class="stack syllable-training-screen" data-syllable-connection-id="${escapeHtml(item.id)}">
        ${renderItemProgress(isReview ? `错题复习 · ${bucketLabel}` : `${displayedNumber} / ${syllableTraining.connectionItems.length}`, bucketLabel)}
        <article
          class="card syllable-connection-card"
          data-syllable-connection-question
          tabindex="-1"
          aria-labelledby="syllable-connection-statement-${escapeHtml(item.id)}"
        >
          <p class="caption">${bucketLabel}</p>
          <h2 class="section-title uyghur" dir="rtl">${escapeHtml(item.standard)}</h2>
          <p class="syllable-connection-statement" id="syllable-connection-statement-${escapeHtml(item.id)}">${escapeHtml(learnerSyllableConnectionStatement(item))}</p>
          ${
            (!completed || isReview) && !state.syllableConnectionSubmitted
              ? `
                <div class="syllable-rule-options" aria-label="判断这个说法">
                  <button class="option-button ${state.syllableConnectionAnswerId === "statement-correct" ? "selected" : ""}" data-action="pick-syllable-connection-answer" data-answer-id="statement-correct" type="button" aria-pressed="${state.syllableConnectionAnswerId === "statement-correct"}">这个判断正确</button>
                  <button class="option-button ${state.syllableConnectionAnswerId === "statement-incorrect" ? "selected" : ""}" data-action="pick-syllable-connection-answer" data-answer-id="statement-incorrect" type="button" aria-pressed="${state.syllableConnectionAnswerId === "statement-incorrect"}">这个判断错误</button>
                </div>
                <button class="primary-button" data-action="submit-syllable-connection-answer" type="button" ${state.syllableConnectionAnswerId ? "" : "disabled"}>提交判断</button>
              `
              : ""
          }
          ${
            state.syllableConnectionSubmitted
              ? `
                <div class="feedback ${submittedIsCorrect ? "good" : "bad"}" data-syllable-connection-feedback role="status" tabindex="-1">
                  <strong>${submittedIsCorrect ? "回答正确" : "回答错误"}</strong>
                  <p>${escapeHtml(item.explanation)}</p>
                </div>
              `
              : ""
          }
          ${
            state.syllableConnectionSubmitted
              ? isReview
                ? '<button class="primary-button" data-action="next-syllable-connection-review" type="button">继续复习</button>'
                : completed
                  ? '<div class="action-grid"><button class="secondary-button" data-action="go" data-target="syllableReview" type="button">复习连接与断开错题</button><button class="primary-button" data-action="go" data-target="syllableSentences" type="button">继续：短句拼读</button></div>'
                  : '<button class="primary-button" data-action="next-syllable-connection" type="button">继续下一题</button>'
              : completed && !isReview
              ? '<div class="action-grid"><button class="secondary-button" data-action="go" data-target="syllableReview" type="button">复习连接与断开错题</button><button class="primary-button" data-action="go" data-target="syllableSentences" type="button">继续：短句拼读</button></div>'
                : ""
          }
        </article>
      </section>
    `,
    "learn"
  );
}

function renderSyllableReviewBucket(bucketName, label) {
  const ids = state.syllableMistakes[bucketName];
  if (!ids.length) {
    return `
      <div class="syllable-review-empty-row" data-syllable-review-bucket="${bucketName}" tabindex="-1">
        <div>
          <p class="caption">专项错题</p>
          <h2 class="section-title">${label}</h2>
        </div>
        <div class="syllable-review-empty-summary">
          <span class="step-state">0 道</span>
          <span>暂无${label.replace("错误", "")}错题</span>
        </div>
      </div>
    `;
  }
  return `
    <article class="card syllable-review-card" data-syllable-review-bucket="${bucketName}" tabindex="-1">
      <div class="section-row">
        <div>
          <p class="caption">专项错题</p>
          <h2 class="section-title">${label}</h2>
        </div>
        <span class="step-state">${ids.length} 道</span>
      </div>
      <div class="action-grid">
        <button class="primary-button" data-action="review-syllable-mistakes" data-mistake-bucket="${bucketName}" type="button">进入复习</button>
        <button class="secondary-button" data-action="clear-syllable-mistakes" data-mistake-bucket="${bucketName}" type="button">清空本类</button>
      </div>
    </article>
  `;
}

function syllableReviewFocusTarget(bucketName) {
  const allEmpty = state.syllableMistakes.connection.length === 0 && state.syllableMistakes.break.length === 0;
  return allEmpty ? "[data-syllable-review-empty]" : `[data-syllable-review-bucket="${bucketName}"]`;
}

function renderSyllableReview() {
  const backTarget = ["unit", "syllableConnections"].includes(state.syllableReviewReturnTarget)
    ? state.syllableReviewReturnTarget
    : syllableConnectionPrerequisitesComplete()
      ? "syllableConnections"
      : reachableSyllableTrainingScreen();
  const allEmpty = state.syllableMistakes.connection.length === 0 && state.syllableMistakes.break.length === 0;
  return screen(
    `
      ${topBar(
        "连接与断开错题复习",
        "两类错题分别保存、分别处理",
        "",
        `<button class="back-button" data-action="go" data-target="${backTarget}" type="button" aria-label="返回">&larr;</button>`
      )}
      <section class="stack syllable-training-screen">
        ${
          allEmpty
            ? `
              <article class="card syllable-review-empty-card" data-syllable-review-empty tabindex="-1">
                <p class="caption">专项错题</p>
                <h2 class="section-title">当前没有连接或断开错题</h2>
                <p>完成连接与断开练习后，答错的题目会自动出现在这里。</p>
                <button class="primary-button" data-action="go" data-target="${backTarget}" type="button">${
                  backTarget === "unit"
                    ? "返回本单元"
                    : backTarget === "syllableConnections"
                      ? "继续连接与断开练习"
                      : "返回当前训练"
                }</button>
              </article>
            `
            : `
              ${renderSyllableReviewBucket("connection", "连接错误")}
              ${renderSyllableReviewBucket("break", "断开错误")}
            `
        }
      </section>
    `,
    "learn"
  );
}

function completedSyllableSentenceIds() {
  return completedSyllableItemIds(syllableTraining.sections[3].id);
}

function currentSyllableSentence() {
  const completedIds = completedSyllableSentenceIds();
  const firstIncompleteIndex = syllableTraining.sentences.findIndex((item) => !completedIds.includes(item.id));
  const lastIndex = syllableTraining.sentences.length - 1;
  const index = firstIncompleteIndex >= 0 ? firstIncompleteIndex : lastIndex;
  state.syllableSentenceIndex = index;
  return syllableTraining.sentences[index];
}

function activeSyllableSentenceId() {
  if (state.screen !== "syllableSentences" || !syllableSentencePrerequisitesComplete()) return "";
  return currentSyllableSentence()?.id || "";
}

function resetSyllableSentenceTransientState() {
  state.syllableSentenceShowStandard = false;
  state.syllableSentenceHelperViewed = false;
  state.syllableSentenceAudioPlayed = false;
  state.syllableSentencePlaybackStatus = "";
}

function reconcileSyllableSentenceProgressChange(previousSentenceId) {
  if (!previousSentenceId || activeSyllableSentenceId() === previousSentenceId) return false;
  syllableSentenceAudioController?.stop();
  resetSyllableSentenceTransientState();
  return true;
}

function syllableSentenceSource(sentence) {
  const sourceAudio = readingAudioByItemId[sentence.sourceReadingItemId];
  const sourceItem = readingUnits.flatMap((unit) => unit.groups.flatMap((group) => group.items)).find((item) => item.id === sentence.sourceReadingItemId);
  if (!sourceAudio || !sourceItem || sourceItem.value !== sentence.standard || sourceAudio.outputPath !== sentence.audioPath) {
    throw new Error(`Syllable sentence source mismatch: ${sentence.id}`);
  }
  return sourceAudio;
}

function syllableSentenceReadyToContinue() {
  return state.syllableSentenceHelperViewed && state.syllableSentenceShowStandard && state.syllableSentenceAudioPlayed;
}

function continueCurrentSyllableSentence() {
  const sentence = currentSyllableSentence();
  if (!syllableSentenceReadyToContinue()) return false;
  syllableSentenceAudioController?.stop();
  submitSyllableItem(
    syllableTraining.sections[3].id,
    sentence.id,
    syllableTraining.sentences.map((item) => item.id)
  );
  resetSyllableSentenceTransientState();
  return true;
}

function renderReachableSyllableTrainingScreen(screenId) {
  if (screenId === "syllableWarmup") return renderSyllableWarmup();
  if (screenId === "syllableConnections") return renderSyllableConnections();
  return renderSyllableRules();
}

function renderSyllableSentences() {
  if (!syllableSentencePrerequisitesComplete()) {
    const fallbackScreen = reachableSyllableTrainingScreen();
    state.screen = fallbackScreen;
    return renderReachableSyllableTrainingScreen(fallbackScreen);
  }
  const sentence = currentSyllableSentence();
  const audio = syllableSentenceSource(sentence);
  const completedIds = completedSyllableSentenceIds();
  const completed = completedIds.length === syllableTraining.sentences.length;
  const nextUnitId = unitOrder.nextUnitId("syllable-training", learningUnits);
  state.syllableSentenceHelperViewed = true;
  const readyToContinue = !completed && syllableSentenceReadyToContinue();

  return screen(
    `
      ${topBar("短句拼读", "先看辅助音节，再切换标准拼写并听真人整句", "", `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回本单元">&larr;</button>`)}
      <section class="stack syllable-training-screen" data-syllable-sentence-id="${escapeHtml(sentence.id)}">
        ${renderItemProgress(`${Math.min(completedIds.length + 1, syllableTraining.sentences.length)} / ${syllableTraining.sentences.length}`, "短句阅读")}
        <article class="card syllable-sentence-card">
          <p class="caption">${escapeHtml(sentence.meaning)}</p>
          ${
            state.syllableSentenceShowStandard
              ? `<div class="syllable-sentence-standard uyghur" data-syllable-standard-sentence="${escapeHtml(sentence.id)}" dir="rtl">${escapeHtml(sentence.standard)}</div>`
              : `<div class="syllable-sentence-chips" dir="rtl" aria-label="按音节拆分的辅助读法">${sentence.syllables.map((part) => `<span class="uyghur syllable-sentence-chip" data-syllable-sentence-chip>${escapeHtml(part.text)}</span>`).join("")}</div>`
          }
          <div class="syllable-sentence-controls" dir="ltr">
            <button class="secondary-button" data-action="show-standard-sentence" type="button">${state.syllableSentenceShowStandard ? "已查看标准拼写" : "查看标准拼写"}</button>
            <button class="secondary-button" data-action="play-syllable-part" type="button" disabled aria-describedby="syllable-segment-unavailable">逐音节</button>
            <button class="secondary-button" data-action="play-syllable-sentence" data-rate="0.75" type="button" aria-label="慢速播放整句，ULY ${escapeHtml(sentence.latin)}">慢速整句 0.75×</button>
            <button class="primary-button" data-action="play-syllable-sentence" data-rate="1" type="button" aria-label="正常播放整句，ULY ${escapeHtml(sentence.latin)}">正常整句 1.0×</button>
          </div>
          <p class="caption" id="syllable-segment-unavailable">逐音节：待核听/暂不可用。当前只有已核对的真人整句音频。</p>
          <p class="syllable-sentence-latin" dir="ltr">${escapeHtml(sentence.latin)}</p>
          <p class="feedback" data-syllable-sentence-status role="status" tabindex="-1">${escapeHtml(state.syllableSentencePlaybackStatus || "请先查看两种文字层，再播放任一整句模式。")}</p>
        </article>
        ${
          readyToContinue
            ? `<button class="primary-button" data-action="continue-syllable-sentence" type="button">${completedIds.length === syllableTraining.sentences.length - 1 ? "完成短句训练" : "继续下一句"}</button>`
            : completed
            ? `<button class="primary-button" data-action="open-unit" data-id="${escapeHtml(nextUnitId || "basic-phrases")}" type="button">继续：${escapeHtml(learningUnitTitle(nextUnitId || "basic-phrases"))}</button>`
            : ""
        }
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
        learningUnitTitle("letters"),
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
          <div class="letter-focus-copy">
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
  const selectedFormIndex = Math.max(0, Math.min(state.letterWritingFormIndex, letter.forms.length - 1));
  const selectedForm = letter.forms[selectedFormIndex] || letter.forms[0];
  state.letterWritingFormIndex = selectedFormIndex;

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
              <h2 class="section-title writing-target-heading">
                <span class="uyghur writing-target-letter" lang="ug" dir="rtl" data-letter-writing-target-letter>${escapeHtml(letter.letter)}</span>
                ${renderLatinTransliteration(letter.latin, "letter-writing-target-latin")}
              </h2>
              <p class="muted writing-target-form-label">${t("alphabet.currentTracing", { form: `<strong data-letter-writing-target-label>${escapeHtml(selectedForm.label)}</strong>` })}</p>
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
        ${renderWritingCanvas(selectedForm.value, t("alphabet.handwritingPad", { form: selectedForm.label }), {
          letterWritingHooks: true
        })}
        ${renderWritingComparison({
          value: letter.letter,
          parts: [letter.letter],
          forms: letter.forms,
          selectedIndex: selectedFormIndex
        })}
        <div class="tool-row">
          <button class="secondary-button" data-action="clear-canvas" type="button">${t("alphabet.clearCanvas")}</button>
          <button class="secondary-button" data-action="toggle-guide" type="button">
            ${state.showGuide ? t("alphabet.hideGuide") : t("alphabet.showGuide")}
          </button>
        </div>
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
          hint: t("alphabet.soundHint"),
          buttonOnly: true
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
                  : t("alphabet.soundMistakePicked", {
                      target: displayStandaloneLetterGlyph(letter.letter),
                      picked: displayStandaloneLetterGlyph(picked?.letter || "")
                    })
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
  const keyboardParts = physicalKeyboardParts(letter.letter);

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
        ${renderUyghurKeyboard(letter.letter)}
        ${
          hasInput
            ? `<div class="feedback ${isCorrect ? "good" : "bad"}">${
                isCorrect
                  ? t("alphabet.keyboardCorrect")
                  : t("alphabet.keyboardContinue", { letter: displayStandaloneLetterGlyph(letter.letter) })
              }</div>`
            : `<div class="feedback">${t("keyboard.inputHint", { keys: `<span class="uyghur">${keyboardParts.map(keyboardPartLabel).join("、")}</span>` })}</div>`
        }
        <button class="primary-button" data-action="go" data-target="complete" type="button" ${isCorrect ? "" : "disabled"}>
          ${t("alphabet.finishCourse")}
        </button>
      </section>
    `,
    "learn"
  );
}

function renderLatinKeyboardIntro() {
  const lessons = latinWriting.keyboardLessons;
  const lessonIndex = Math.max(0, Math.min(lessons.length - 1, state.latinKeyboardLessonIndex));
  const lesson = lessons[lessonIndex];
  const targetValue = lesson.latin;
  const isComplete = state.latinKeyboardValue === targetValue;
  const isFinalLesson = lessonIndex === lessons.length - 1;
  const isPrefix = targetValue.startsWith(state.latinKeyboardValue);
  const expectedKey = isPrefix ? targetValue[state.latinKeyboardValue.length] || "" : "Backspace";
  const keyClass = (key) => key === expectedKey ? " next-key" : "";

  return screen(
    `
      ${topBar(
        "QWERTY 词语训练",
        learningUnitTitle("latin-keyboard-writing"),
        "",
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card latin-keyboard-target">
          <div class="section-row">
            <p class="caption">第 ${lessonIndex + 1} / ${lessons.length} 关 · ${escapeHtml(lesson.focus)}</p>
            <span class="progress-pill">${lessonIndex + 1} / ${lessons.length}</span>
          </div>
          <strong class="uyghur latin-keyboard-word" lang="ug" dir="rtl">${escapeHtml(lesson.value)}</strong>
          <p class="latin-keyboard-meaning">${escapeHtml(lesson.meaning)}</p>
          <div class="latin-keyboard-copy-target" dir="ltr">
            <span>照着 ULY 输入</span>
            <strong>${escapeHtml(targetValue)}</strong>
          </div>
          <p class="muted">用普通拉丁键位输入；大写会按小写记录，空格与 ë / ö / ü 使用下方对应键。</p>
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
                    (key) => `<button class="key-button${keyClass(key)}" data-action="latin-key" data-key="${key}" type="button">${key.toUpperCase()}</button>`
                  )
                  .join("")}
              </div>
            `
          ).join("")}
          <div class="latin-keyboard-extended" aria-label="拉丁扩展键">
            ${latinKeyboard.EXTENDED_KEYS.map(
              (key) => `<button class="key-button${keyClass(key)}" data-action="latin-extended-key" data-key="${key}" type="button">${key}</button>`
            ).join("")}
          </div>
          <div class="latin-keyboard-tools">
            <button class="key-button utility${keyClass("Backspace")}" data-action="latin-backspace" type="button" aria-label="Backspace">Backspace</button>
            <button class="key-button utility latin-keyboard-space${keyClass(" ")}" data-action="latin-space" type="button" aria-label="Space">Space</button>
          </div>
        </div>
        <div class="feedback ${isComplete ? "good" : isPrefix ? "" : "bad"}">
          ${
            isComplete
              ? isFinalLesson
                ? "输入正确，7 关全部完成。"
                : `输入正确：${escapeHtml(targetValue)}。可以继续下一关。`
              : isPrefix
                ? `下一键：${expectedKey === " " ? "Space" : escapeHtml(expectedKey.toUpperCase())}`
                : "当前输入和目标不一致，请按 Backspace 回退后继续。"
          }
        </div>
        <div class="action-grid">
          <button class="secondary-button" data-action="go" data-target="unit" type="button">返回本单元</button>
          <button class="secondary-button" data-action="go" data-target="home" type="button">回到首页</button>
          ${isComplete && !isFinalLesson ? `<button class="primary-button" data-action="next-latin-keyboard-lesson" type="button">下一关：${escapeHtml(lessons[lessonIndex + 1].latin)}</button>` : ""}
          ${isComplete && isFinalLesson ? `<button class="primary-button" data-action="go" data-target="latinLetterClasses" type="button">继续：元辅音分类</button>` : ""}
        </div>
      </section>
    `,
    "learn"
  );
}

function completedUyghurKeyboardLessonIds() {
  const ids = state.learningProgress.latinWriting?.["uyghur-keyboard"]?.completedIds;
  return Array.isArray(ids) ? ids : [];
}

function currentUyghurKeyboardLesson() {
  const lessons = latinWriting.uyghurKeyboardLessons;
  const completedIds = completedUyghurKeyboardLessonIds();
  const lastCompletedLesson = lessons.find((item) => item.id === completedIds[completedIds.length - 1]);
  if (lastCompletedLesson && state.uyghurKeyboardValue === lastCompletedLesson.value) {
    return lastCompletedLesson;
  }
  return lessons.find((item) => !completedIds.includes(item.id)) || lessons[lessons.length - 1];
}

function recordUyghurKeyboardLessonCompletion(lesson) {
  const lessons = latinWriting.uyghurKeyboardLessons;
  const expectedIds = lessons.map((item) => item.id);
  const progress = ensureProgress("latinWriting", "uyghur-keyboard");
  const completedIds = Array.isArray(progress.completedIds) ? progress.completedIds : [];
  if (expectedIds[completedIds.length] !== lesson.id || completedIds.includes(lesson.id)) return;
  progress.completedIds = [...completedIds, lesson.id];
  if (progress.completedIds.length === expectedIds.length) {
    progress.completed = true;
    recordDailyActivity("latinWriting:uyghur-keyboard:completed");
  }
}

function appendUyghurKeyboardLessonValue(value) {
  const lesson = currentUyghurKeyboardLesson();
  if (!lesson || state.uyghurKeyboardValue === lesson.value) return;
  state.uyghurKeyboardValue += value;
  if (state.uyghurKeyboardValue === lesson.value) {
    recordUyghurKeyboardLessonCompletion(lesson);
  }
}

function renderUyghurKeyboardWords() {
  const lessons = latinWriting.uyghurKeyboardLessons;
  const lesson = currentUyghurKeyboardLesson();
  const lessonIndex = Math.max(0, lessons.findIndex((item) => item.id === lesson.id));
  const completedIds = completedUyghurKeyboardLessonIds();
  const isComplete = state.uyghurKeyboardValue === lesson.value;
  const isFinalLesson = lessonIndex === lessons.length - 1;
  const isPrefix = lesson.value.startsWith(state.uyghurKeyboardValue);
  const physicalStrokes = uyghurKeyboard.keystrokesForText(lesson.value);
  const keyboardParts = Array.from(lesson.value);

  return screen(
    `
      ${topBar(
        "维吾尔语键盘",
        learningUnitTitle("latin-keyboard-writing"),
        "",
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回第二单元">←</button>`
      )}
      <section class="stack uyghur-keyboard-course">
        <article class="card latin-keyboard-target">
          <div class="section-row">
            <p class="caption">第 ${lessonIndex + 1} / ${lessons.length} 关 · ${escapeHtml(lesson.focus)}</p>
            <span class="progress-pill">已完成 ${completedIds.length} / ${lessons.length}</span>
          </div>
          <strong class="uyghur uyghur-keyboard-target-word" lang="ug" dir="rtl">${escapeHtml(lesson.value)}</strong>
          <p class="latin-keyboard-meaning">${escapeHtml(lesson.meaning)}</p>
          <p class="muted">先看目标，再选择屏幕键盘或实体键盘完成输入。</p>
        </article>
        <div class="uyghur-keyboard-mode-switch" role="group" aria-label="维吾尔语键盘模式">
          <button
            class="${state.uyghurKeyboardMode === "onscreen" ? "primary-button" : "secondary-button"}"
            data-action="set-uyghur-keyboard-mode"
            data-mode="onscreen"
            type="button"
            aria-pressed="${state.uyghurKeyboardMode === "onscreen"}"
          >屏幕键盘</button>
          <button
            class="${state.uyghurKeyboardMode === "physical" ? "primary-button" : "secondary-button"}"
            data-action="set-uyghur-keyboard-mode"
            data-mode="physical"
            type="button"
            aria-pressed="${state.uyghurKeyboardMode === "physical"}"
          >实体键盘</button>
        </div>
        <input
          class="rtl-input uyghur uyghur-keyboard-course-input"
          value="${escapeHtml(state.uyghurKeyboardValue)}"
          aria-label="维吾尔语课程输入框"
          readonly
          dir="rtl"
        />
        ${state.uyghurKeyboardMode === "onscreen"
          ? renderUyghurKeyboard(lesson.value, {
              currentValue: state.uyghurKeyboardValue,
              keyAction: "uyghur-keyboard-key",
              backspaceAction: "uyghur-keyboard-backspace"
            })
          : `
            ${renderKeyboardGuide(keyboardParts, lesson.value, state.uyghurKeyboardValue)}
            <article class="card uyghur-physical-key-guide" aria-label="实体键盘按键顺序">
              <p class="caption">实体键盘按键顺序</p>
              <div class="uyghur-physical-key-row" dir="ltr">
                ${physicalStrokes.map((stroke) => `<kbd>${stroke.shifted ? "Shift + " : ""}${escapeHtml(stroke.code === "Space" ? "Space" : stroke.code.replace(/^Key/, ""))}</kbd>`).join("")}
              </div>
            </article>
          `}
        <div class="feedback ${isComplete ? "good" : isPrefix ? "" : "bad"}" role="status">
          ${isComplete
            ? isFinalLesson
              ? "输入正确，7 关全部完成。"
              : "输入正确，可以继续下一关。"
            : isPrefix
              ? "继续输入目标文字。"
              : "当前输入和目标不一致，请删除错误部分后继续。"}
        </div>
        <div class="action-grid">
          <button class="secondary-button" data-action="go" data-target="unit" type="button">返回本单元</button>
          ${isComplete && !isFinalLesson ? `<button class="primary-button" data-action="next-uyghur-keyboard-lesson" type="button">下一关</button>` : ""}
          ${isComplete && isFinalLesson ? `<button class="primary-button" data-action="go" data-target="unit" type="button">完成并返回本单元</button>` : ""}
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
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回本单元">←</button>`
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
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回本单元">←</button>`
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
  submitLatinWritingItem("dictation", letter.id);

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
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回本单元">←</button>`
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
          <button class="primary-button" data-action="next-latin-dictation" type="button">${state.learningProgress.latinWriting?.dictation?.completed === true ? "完成并返回本单元" : "下一题"}</button>
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
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回本单元">←</button>`
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
      ${topBar(t("alphabet.completeTitle"), t("common.unitComplete", { unit: learningUnitOrdinal("letters") }))}
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
        ${renderContinueCourseButton(nextGroup ? { action: "open-group", id: nextGroup.id } : null)}
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
  const keyboardParts = physicalKeyboardParts(item.value);

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
        ${renderUyghurKeyboard(item.value)}
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
  const nextGroup = nextComboGroup(group.id);
  const groupValues = group.items.map((choice) => choice.value).join(" / ");

  return screen(
    `
      ${topBar(t("common.unitComplete", { unit: learningUnitOrdinal(unit.id) }), group.title)}
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
        ${renderContinueCourseButton(nextGroup ? { action: "open-combo-group", id: nextGroup.id } : null)}
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

  return screen(
    `
      ${topBar(
        group.title,
        learningUnitTitle("basic-phrases"),
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
  const keyboardParts = physicalKeyboardParts(item.value);

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
        ${renderUyghurKeyboard(item.value)}
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
  const nextCourse = nextVocabCourse(group.id, section?.id);
  const groupValues = sectionItems.map((choice) => choice.value).join(" / ");

  return screen(
    `
      ${topBar(t("common.unitComplete", { unit: learningUnitOrdinal("basic-phrases") }), group.title)}
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
        ${renderContinueCourseButton(
          nextCourse
            ? { action: "open-vocab-course", id: nextCourse.groupId, itemId: nextCourse.itemId }
            : null
        )}
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

function readingTrainingSteps(group = currentReadingGroup()) {
  return Array.isArray(group?.training?.steps) ? group.training.steps : [];
}

function readingTrainingProgress(group = currentReadingGroup()) {
  return state.learningProgress.reading?.[group.id] || {};
}

function readingTrainingResumeIndex(group = currentReadingGroup()) {
  const steps = readingTrainingSteps(group);
  const progress = readingTrainingProgress(group);
  const firstIncomplete = steps.findIndex((stepId) => progress[stepId] !== true);
  return firstIncomplete >= 0 ? firstIncomplete : Math.max(0, steps.length - 1);
}

function resetReadingTrainingState(group = currentReadingGroup()) {
  state.readingTrainingStepIndex = readingTrainingResumeIndex(group);
  state.readingTrainingChoiceId = "";
  state.readingOrderingIds = [];
  state.readingTrainingFeedback = "";
}

function localizedTrainingText(training, field) {
  const suffix = i18n.getLanguage() === "en" ? "En" : "Zh";
  return training?.[`${field}${suffix}`] || "";
}

function renderReadingTrainingProgress(group) {
  const labels = i18n.getLanguage() === "en"
    ? { rule: "Rule", compare: "Compare", recognition: "Recognise", ordering: "Order", completion: "Complete" }
    : { rule: "规则", compare: "对比", recognition: "辨认", ordering: "排序", completion: "补全" };
  const progress = readingTrainingProgress(group);
  return `<ol class="reading-training-progress">${readingTrainingSteps(group).map((stepId, index) => `
    <li class="${index === state.readingTrainingStepIndex ? "active" : ""} ${progress[stepId] ? "done" : ""}">
      <span>${index + 1}</span><strong>${labels[stepId]}</strong>
    </li>`).join("")}</ol>`;
}

function renderReadingTraining(group, unit) {
  const training = group.training;
  const steps = readingTrainingSteps(group);
  const stepId = steps[Math.min(state.readingTrainingStepIndex, steps.length - 1)] || "rule";
  const progress = readingTrainingProgress(group);
  const english = i18n.getLanguage() === "en";
  let content = "";
  let canContinue = false;

  if (stepId === "rule") {
    content = `<article class="card reading-training-card"><p class="caption">${english ? "Rule" : "先看规则"}</p><h2>${escapeHtml(group.rule)}</h2>${group.items.map((item) => renderReadingLine(unit, item)).join("")}</article>`;
    canContinue = true;
  } else if (stepId === "compare") {
    const compareItems = training.compareItemIds.map((id) => group.items.find((item) => item.id === id)).filter(Boolean);
    content = `<article class="card reading-training-card"><p class="caption">${english ? "Compare" : "对比句子"}</p><div class="reading-training-compare">${compareItems.map((item) => renderReadingLine(unit, item)).join("")}</div></article>`;
    canContinue = true;
  } else if (stepId === "recognition") {
    const exercise = training.recognition;
    content = `<article class="card reading-training-card"><p class="caption">${english ? "Recognise" : "辨认意思"}</p><h2>${escapeHtml(localizedTrainingText(exercise, "prompt"))}</h2><div class="reading-training-options">${exercise.options.map((option) => {
      const item = group.items.find((candidate) => candidate.id === option.itemId);
      return `<button class="choice-card ${state.readingTrainingChoiceId === option.id ? "selected" : ""}" data-action="pick-reading-training-answer" data-answer-id="${escapeHtml(option.id)}" type="button"><span class="uyghur">${escapeHtml(item?.value || "")}</span><small dir="ltr">${escapeHtml(item?.latin || "")}</small></button>`;
    }).join("")}</div>${state.readingTrainingFeedback ? `<p class="feedback ${progress.recognition ? "good" : "bad"}" role="status">${escapeHtml(state.readingTrainingFeedback)}</p>` : ""}</article>`;
    canContinue = progress.recognition === true;
  } else if (stepId === "ordering") {
    const exercise = training.ordering;
    const chosen = state.readingOrderingIds;
    content = `<article class="card reading-training-card"><p class="caption">${english ? "Build the sentence" : "按顺序组成句子"}</p><div class="reading-order-result uyghur" dir="rtl">${chosen.map((id) => escapeHtml(exercise.tokens.find((token) => token.id === id)?.value || "")).join("") || (english ? "Choose the parts below" : "点击下方词块")}</div><div class="reading-training-options">${exercise.tokens.map((token) => `<button class="choice-card" data-action="pick-reading-order-token" data-token-id="${escapeHtml(token.id)}" type="button" ${chosen.includes(token.id) ? "disabled" : ""}><span class="uyghur">${escapeHtml(token.value)}</span></button>`).join("")}</div>${state.readingTrainingFeedback ? `<p class="feedback ${progress.ordering ? "good" : "bad"}" role="status">${escapeHtml(state.readingTrainingFeedback)}</p>` : ""}${chosen.length ? `<button class="secondary-button" data-action="reset-reading-order" type="button">${english ? "Reset" : "重新排序"}</button>` : ""}</article>`;
    canContinue = progress.ordering === true;
  } else {
    const exercise = training.completion;
    content = `<article class="card reading-training-card"><p class="caption">${english ? "Complete" : "补全句子"}</p><h2>${escapeHtml(localizedTrainingText(exercise, "prompt"))}</h2><div class="reading-training-options">${exercise.options.map((option) => `<button class="choice-card ${state.readingTrainingChoiceId === option.id ? "selected" : ""}" data-action="pick-reading-completion" data-answer-id="${escapeHtml(option.id)}" type="button"><span class="uyghur">${escapeHtml(option.value)}</span></button>`).join("")}</div>${state.readingTrainingFeedback ? `<p class="feedback ${progress.completion ? "good" : "bad"}" role="status">${escapeHtml(state.readingTrainingFeedback)}</p>` : ""}${progress.completion ? `<div class="reading-training-finished"><div class="uyghur">${escapeHtml(exercise.completedValue)}</div><p>${escapeHtml(localizedTrainingText(exercise, "meaning"))}</p></div>` : ""}</article>`;
  }

  return `<div class="reading-training" data-reading-training-step="${stepId}">${renderReadingTrainingProgress(group)}${content}${canContinue && stepId !== "completion" ? `<button class="primary-button" data-action="continue-reading-training" type="button">${english ? "Continue" : "继续下一步"}</button>` : ""}</div>`;
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
  if (i18n.getLanguage() === "en") return "";
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
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="${t("common.back")}">←</button>`
      )}
      <section class="stack">
        ${group.training ? renderReadingTraining(group, unit) : `<div class="reading-list ${unit.readingKind}">${group.items.map((item) => renderReadingLine(unit, item)).join("")}</div>`}
        ${!group.training || readingTrainingProgress(group).completion === true ? renderContinueCourseButton(
          nextGroup ? { action: "open-reading-group", id: nextGroup.id, unitId: unit.id } : null
        ) : ""}
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
    const letter = letterDetails[item.letterId];
    const forms = Array.isArray(letter?.forms) && letter.forms.length ? letter.forms : [];
    const selectedFormIndex = Math.max(0, Math.min(state.letterWritingFormIndex, forms.length - 1));
    const selectedForm = forms[selectedFormIndex] || { label: "独立式", value: item.value };
    state.letterWritingFormIndex = selectedFormIndex;
    return `
      <article class="card practice-mode-card">
        <div class="section-row">
          <div>
            <p class="caption">${t("practice.writingPad")} · ${t("alphabet.currentTracing", { form: escapeHtml(selectedForm.label) })}</p>
            <strong class="uyghur practice-writing-target-glyph" data-practice-writing-target-glyph>${escapeHtml(displayLetterFormGlyph(selectedForm.value))}</strong>
            <span class="caption" data-letter-writing-target-label>${escapeHtml(selectedForm.label)}</span>
          </div>
          <button class="ghost-button" data-action="clear-canvas" type="button">${t("practice.clearPad")}</button>
        </div>
        ${renderWritingCanvas(selectedForm.value, t("alphabet.handwritingPad", { form: selectedForm.label }), { letterWritingHooks: true })}
        <button class="ghost-button" data-action="toggle-guide" type="button">
          ${state.showGuide ? t("practice.hideGuide") : t("practice.showGuide")}
        </button>
      </article>
      ${renderWritingComparison({
        value: item.value,
        parts: item.parts,
        forms,
        selectedIndex: selectedFormIndex
      })}
      ${renderWritingCoach({
        value: item.value,
        parts: item.parts,
        hint: item.hint,
        mode: "letter"
      })}
    `;
  }

  if (group.mode === "keyboard") {
    return `
      <input
        class="rtl-input uyghur"
        value="${state.keyboardValue}"
        aria-label="${t("practice.keyboardAria")}"
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
  const nextGroup = isReviewPractice ? null : nextPracticeGroup(group.id);
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
        ${renderContinueCourseButton(nextGroup ? { action: "open-practice-group", id: nextGroup.id } : null)}
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
  const usingCloudProfile = Boolean(appConfig.cloudEnabled && accountEmail);
  const avatarUrl = usingCloudProfile ? accountProfile.avatarUrl : state.localProfile.avatarDataUrl;
  const displayName =
    (usingCloudProfile ? accountProfile.displayName : state.localProfile.displayName) ||
    t("profile.defaultLearner", { brand: appConfig.brandName });
  const avatarContent = avatarUrl
    ? `<img src="${escapeHtml(avatarUrl)}" alt="${t("profile.avatarAlt")}" />`
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
              aria-label="${t("profile.chooseAvatarAria")}"
              ${state.avatarUploading ? "disabled" : ""}
            />
            <span>${state.avatarUploading ? t("profile.uploading") : t("profile.chooseAvatar")}</span>
          </label>
        </div>
        <div class="profile-account">
          <p class="caption">${usingCloudProfile ? t("profile.account") : t("profile.localLearning")}</p>
          ${renderProfileNameControl(displayName)}
          <p class="muted">${usingCloudProfile ? escapeHtml(accountEmail) : t(appConfig.cloudEnabled ? "profile.guestDetail" : "profile.localDetail")}</p>
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
      <p class="caption">${
        usingCloudProfile
          ? t("profile.cloudSync")
          : appConfig.cloudEnabled
            ? t("profile.cloudPrompt")
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
          <p class="caption">${t("profile.memory")}</p>
          <h2 class="section-title">${hasReview ? t("profile.reviewHeading") : t("profile.foundationHeading")}</h2>
        </div>
        <span class="step-state">${t("profile.reviewCount", { count: reviewCount })}</span>
      </div>
      <p class="muted">${
        hasReview
          ? appConfig.cloudEnabled
            ? t("profile.reviewDetail")
            : "错题会优先进入本地复习队列。"
          : t("profile.foundationDetail")
      }</p>
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

function renderProfileNameControl(displayName) {
  if (!state.profileNameEditing) {
    return `
      <div class="profile-name-heading">
        <h2 class="section-title">${escapeHtml(displayName)}</h2>
        <button class="profile-name-edit-button" data-action="edit-display-name" type="button" aria-label="${t("profile.editName")}">
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
        aria-label="${t("profile.name")}"
      />
      <button class="profile-name-save" data-action="save-display-name" type="button">${t("profile.saveName")}</button>
      <button class="profile-name-cancel" data-action="cancel-display-name" type="button">${t("profile.cancelName")}</button>
    </div>
  `;
}

function renderSettingsPanel() {
  const preferences = state.preferences;
  const accountEmail = cloudAccountEmail();

  return `
    <article class="card profile-settings-card">
      <div>
        <p class="caption">${t("settings.title")}</p>
        <h2 class="section-title" id="learning-preferences-title">${t("settings.learning")}</h2>
      </div>

      <section class="profile-setting-group" aria-labelledby="learning-preferences-title">
        ${
          appConfig.edition === "cn"
            ? ""
            : `<div class="profile-setting-block language-setting">
                <label for="profile-language-select"><strong>${t("language.label")}</strong></label>
                ${profileLanguageSelect()}
              </div>`
        }
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
        <h3 id="account-settings-title">${appConfig.cloudEnabled ? t("settings.account") : "本地数据"}</h3>
        ${
          appConfig.cloudEnabled
            ? `
        <div class="profile-setting-block profile-account-setting">
          <div>
            <strong>${t("settings.currentAccount")}</strong>
            <small>${accountEmail ? escapeHtml(accountEmail) : t("settings.localAccount")}</small>
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
          <button class="secondary-button" data-action="export-progress" type="button">${t("profile.exportProgress")}</button>
          <label class="secondary-button import-progress-button">
            <input id="progress-import-input" type="file" accept="application/json,.json" />
            <span>${t("profile.importProgress")}</span>
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

      <section class="profile-setting-group" aria-labelledby="help-feedback-title">
        <h3 id="help-feedback-title">${t("profile.helpFeedback")}</h3>
        <button class="profile-setting-block feedback-entry-row" data-action="go" data-target="feedback" type="button">
          <span><strong>${t("profile.feedback")}</strong><small>${t("profile.feedbackDetail")}</small></span>
          <span aria-hidden="true">→</span>
        </button>
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

function feedbackCategoryLabel(category) {
  return {
    content: t("feedback.categoryContent"),
    audio: t("feedback.categoryAudio"),
    display: t("feedback.categoryDisplay"),
    account: t("feedback.categoryAccount"),
    other: t("feedback.categoryOther")
  }[category] || t("feedback.categoryOther");
}

function feedbackStatusLabel(status) {
  return {
    new: t("feedback.statusNew"),
    reviewed: t("feedback.statusReviewed"),
    resolved: t("feedback.statusResolved")
  }[status] || t("feedback.statusNew");
}

function renderFeedbackRecord(record) {
  const createdAt = typeof record.created_at === "string" ? record.created_at.replace("T", " ").slice(0, 16) : t("feedback.timeUnavailable");
  const editionLabel = record.edition === "cn" ? t("feedback.editionCn") : t("feedback.editionGlobal");
  return `
    <article class="card feedback-record-card">
      <div class="section-row">
        <div>
          <p class="caption">${escapeHtml(editionLabel)} · ${escapeHtml(feedbackCategoryLabel(record.category))}</p>
          <h3>${escapeHtml(feedbackStatusLabel(record.status))}</h3>
        </div>
        <span class="step-state">${escapeHtml(createdAt)}</span>
      </div>
      <p class="feedback-record-message">${escapeHtml(record.message)}</p>
      <p class="muted">${escapeHtml(t("feedback.contactLine", { contact: record.contact || t("feedback.notProvided") }))}</p>
      <div class="feedback-status-actions" role="group" aria-label="${escapeHtml(t("feedback.statusGroup"))}">
        ${["new", "reviewed", "resolved"].map((status) => `
          <button
            class="setting-segment ${record.status === status ? "active" : ""}"
            data-action="update-feedback-status"
            data-id="${escapeHtml(record.id)}"
            data-status="${status}"
            aria-pressed="${record.status === status}"
            type="button"
          >${feedbackStatusLabel(status)}</button>
        `).join("")}
      </div>
    </article>
  `;
}

function renderFeedback() {
  const draft = state.feedbackDraft;
  const accountEmail = cloudAccountEmail();
  const authorizedAdminView = Boolean(
    state.feedbackAdminPhase === "allowed" &&
    state.feedbackAdminUserId &&
    state.feedbackAdminUserId === cloudAccountUserId()
  );
  const categoryOptions = [
    ["content", t("feedback.categoryContent")],
    ["audio", t("feedback.categoryAudio")],
    ["display", t("feedback.categoryDisplay")],
    ["account", t("feedback.categoryAccount")],
    ["other", t("feedback.categoryOther")]
  ];
  const submitStatus = state.feedbackSubmitMessage
    ? `<p class="feedback-submit-status ${state.feedbackSubmitPhase}" role="status">${escapeHtml(state.feedbackSubmitMessage)}</p>`
    : "";
  const adminPanel = !accountEmail
    ? ""
    : `
      <article class="card feedback-admin-card">
        <div class="section-row">
          <div><p class="caption">${t("feedback.privateAdmin")}</p><h2 class="section-title">${t("feedback.records")}</h2></div>
          <span class="step-state">${t("feedback.authorizedOnly")}</span>
        </div>
        <p class="muted">${t("feedback.adminDetail")}</p>
        <button class="secondary-button" data-action="load-feedback-records" type="button" ${state.feedbackAdminPhase === "loading" ? "disabled" : ""}>
          ${state.feedbackAdminPhase === "loading" ? t("feedback.checkingAccess") : t("feedback.viewRecords")}
        </button>
        ${state.feedbackAdminPhase === "denied" ? `<p class="feedback-submit-status error" role="status">${t("feedback.accessDenied")}</p>` : ""}
        ${state.feedbackAdminPhase === "error" ? `<p class="feedback-submit-status error" role="status">${t("feedback.recordsUnavailable")}</p>` : ""}
      </article>
      ${authorizedAdminView
        ? `<section class="stack feedback-record-list" aria-label="${escapeHtml(t("feedback.privateRecords"))}">
            ${state.feedbackRecords.length ? state.feedbackRecords.map(renderFeedbackRecord).join("") : `<article class="card"><p class="muted">${t("feedback.noRecords")}</p></article>`}
          </section>`
        : ""}
    `;

  return screen(
    `
      ${topBar(t("feedback.title"), t("feedback.subtitle"), "", `<button class="back-button" data-action="go" data-target="profile" type="button" aria-label="${escapeHtml(t("feedback.backAria"))}">←</button>`)}
      <section class="stack wide-gap feedback-layout">
        <article class="card feedback-form-card">
          <div>
            <p class="caption">${t("feedback.caption")}</p>
            <h2 class="section-title">${t("feedback.heading")}</h2>
            <p class="muted">${t("feedback.description")}</p>
          </div>
          <div class="feedback-field-grid">
            <label class="feedback-field">
              <span>${t("feedback.type")}</span>
              <select id="feedback-category">
                ${categoryOptions.map(([value, label]) => `<option value="${value}" ${draft.category === value ? "selected" : ""}>${label}</option>`).join("")}
              </select>
            </label>
            <label class="feedback-field">
              <span>${t("feedback.details")}</span>
              <textarea id="feedback-message" maxlength="2000" rows="7" placeholder="${escapeHtml(t("feedback.detailsPlaceholder"))}">${escapeHtml(draft.message)}</textarea>
              <small>${t("feedback.range")}</small>
            </label>
            <label class="feedback-field">
              <span>${t("feedback.optionalContact")}</span>
              <input id="feedback-contact" type="text" maxlength="120" value="${escapeHtml(draft.contact)}" placeholder="${escapeHtml(t("feedback.contactPlaceholder"))}" />
            </label>
          </div>
          ${submitStatus}
          <button class="primary-button" data-action="submit-feedback" type="button" ${state.feedbackSubmitPhase === "sending" ? "disabled" : ""}>
            ${state.feedbackSubmitPhase === "sending" ? t("feedback.submitting") : t("feedback.submit")}
          </button>
        </article>
        ${adminPanel}
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
  if (target === "syllableReview") {
    if (state.screen === "unit" && state.selectedUnitId === "syllable-training") {
      state.syllableReviewReturnTarget = "unit";
    } else if (state.screen === "syllableConnections" && state.syllableConnectionMode === "lesson") {
      state.syllableReviewReturnTarget = "syllableConnections";
    }
  } else if (
    state.screen === "syllableReview" &&
    !(target === "syllableConnections" && state.syllableConnectionMode !== "lesson")
  ) {
    state.syllableReviewReturnTarget = "";
  }
  if (state.screen === "syllableSentences" && target !== "syllableSentences") {
    syllableSentenceAudioController?.stop();
  }
  state.screen = target;
  render({ persist: normalizeActiveSyllableRoute() });
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
  const lessonIndex = Math.max(0, Math.min(latinWriting.keyboardLessons.length - 1, state.latinKeyboardLessonIndex));
  const lesson = latinWriting.keyboardLessons[lessonIndex];
  if (state.latinKeyboardValue === lesson.latin) {
    const progress = ensureProgress("latinWriting", "qwerty");
    if (!(progress.completed === true && !Array.isArray(progress.completedIds))) {
      const completedIds = Array.isArray(progress.completedIds) ? progress.completedIds : [];
      const expectedIds = latinWriting.keyboardLessons.map((item) => item.id);
      if (expectedIds[completedIds.length] === lesson.id && !completedIds.includes(lesson.id)) {
        progress.completedIds = [...completedIds, lesson.id];
      }
      if (progress.completedIds?.length === expectedIds.length) {
        progress.completed = true;
        recordDailyActivity("latinWriting:qwerty:completed");
      }
    }
  }
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const guardedSyllableActionScreen = {
    "combine-syllable-warmup": "syllableWarmup",
    "next-syllable-warmup": "syllableWarmup",
    "pick-syllable-rule-answer": "syllableRules",
    "submit-syllable-rule-answer": "syllableRules",
    "next-syllable-rule-exercise": "syllableRules",
    "next-syllable-rule": "syllableRules",
    "pick-syllable-connection-answer": "syllableConnections",
    "submit-syllable-connection-answer": "syllableConnections",
    "next-syllable-connection": "syllableConnections",
    "show-standard-sentence": "syllableSentences",
    "play-syllable-sentence": "syllableSentences",
    "continue-syllable-sentence": "syllableSentences",
    "review-syllable-mistakes": "syllableReview",
    "next-syllable-connection-review": "syllableConnections",
    "clear-syllable-mistakes": "syllableReview"
  }[action];
  if (
    guardedSyllableActionScreen &&
    (state.screen !== guardedSyllableActionScreen || !normalizeActiveSyllableRoute())
  ) {
    render({ persist: false });
    return;
  }

  if (action === "submit-feedback") {
    let normalizedDraft;
    try {
      normalizedDraft = feedbackApi.validateFeedback({
        category: document.querySelector("#feedback-category")?.value || "",
        message: document.querySelector("#feedback-message")?.value || "",
        contact: document.querySelector("#feedback-contact")?.value || ""
      });
    } catch (error) {
      state.feedbackSubmitPhase = "error";
      state.feedbackSubmitMessage = i18n.getLanguage() === "en"
        ? t("feedback.checkContent")
        : error?.message || t("feedback.checkContent");
      render({ persist: false });
      return;
    }
    state.feedbackDraft = normalizedDraft;
    state.feedbackSubmitPhase = "sending";
    state.feedbackSubmitMessage = t("feedback.submittingPrivate");
    render({ persist: false });
    Promise.resolve()
      .then(() => {
        if (!feedbackClient) throw new Error(t("feedback.serviceUnavailable"));
        return feedbackClient.submit(normalizedDraft);
      })
      .then(() => {
        state.feedbackDraft = { category: normalizedDraft.category, message: "", contact: "" };
        state.feedbackSubmitPhase = "success";
        state.feedbackSubmitMessage = t("feedback.received");
        render({ persist: false });
      })
      .catch((error) => {
        state.feedbackSubmitPhase = "error";
        state.feedbackSubmitMessage = error?.message || t("feedback.submitFailed");
        render({ persist: false });
      });
    return;
  }

  if (action === "load-feedback-records") {
    if (!cloudAccountEmail() || !feedbackClient) {
      state.feedbackAdminPhase = "denied";
      state.feedbackAdminUserId = "";
      state.feedbackRecords = [];
      render({ persist: false });
      return;
    }
    state.feedbackAdminPhase = "loading";
    render({ persist: false });
    feedbackClient.isAdmin()
      .then((allowed) => {
        if (!allowed) {
          state.feedbackAdminPhase = "denied";
          state.feedbackAdminUserId = "";
          state.feedbackRecords = [];
          return [];
        }
        return feedbackClient.list().then((records) => {
          state.feedbackAdminPhase = "allowed";
          state.feedbackAdminUserId = cloudAccountUserId();
          state.feedbackRecords = records;
          return records;
        });
      })
      .then(() => render({ persist: false }))
      .catch(() => {
        state.feedbackAdminPhase = "error";
        state.feedbackAdminUserId = "";
        state.feedbackRecords = [];
        render({ persist: false });
      });
    return;
  }

  if (action === "update-feedback-status") {
    if (
      state.feedbackAdminPhase !== "allowed" ||
      !state.feedbackAdminUserId ||
      state.feedbackAdminUserId !== cloudAccountUserId() ||
      !feedbackClient
    ) return;
    const id = button.dataset.id || "";
    const status = button.dataset.status || "";
    feedbackClient.updateStatus(id, status)
      .then(() => {
        state.feedbackRecords = state.feedbackRecords.map((record) =>
          record.id === id ? { ...record, status } : record
        );
        render({ persist: false });
      })
      .catch(() => showToast("状态保存失败，请稍后重试"));
    return;
  }

  if (action === "toggle-afanti-language") {
    const language = button.dataset.language;
    if (state.screen !== "afantiStories" || !availableAfantiLanguages().includes(language)) return;
    state.afantiVisibleLanguages[language] = state.afantiVisibleLanguages[language] !== true;
    render();
    return;
  }

  if (action === "select-afanti-story") {
    const story = afantiStories.find((item) => item.id === button.dataset.id);
    if (state.screen !== "afantiStories" || !story) return;
    state.selectedAfantiStoryId = story.id;
    render();
    return;
  }

  if (action === "open-afanti-story") {
    const story = afantiStories.find((item) => item.id === button.dataset.id);
    if (!story) return;
    state.selectedUnitId = "afanti-stories";
    state.selectedAfantiStoryId = story.id;
    goTo("afantiStories");
    return;
  }

  if (action === "combine-syllable-warmup") {
    const item = currentSyllableWarmupItem();
    submitSyllableItem(
      syllableTraining.sections[0].id,
      item.id,
      syllableTraining.twoLetterItems.map((warmupItem) => warmupItem.id)
    );
    state.syllableShowStandard = true;
    render();
    return;
  }

  if (action === "next-syllable-warmup") {
    if (!state.syllableShowStandard) return;
    state.syllableItemIndex = Math.min(state.syllableItemIndex + 1, syllableTraining.twoLetterItems.length - 1);
    state.syllableShowStandard = false;
    render();
    return;
  }

  if (action === "pick-syllable-rule-answer") {
    if (!["answer", "distractor"].includes(button.dataset.answerId) || state.syllableAnswerSubmitted) return;
    state.syllableRuleCompletionNotice = null;
    state.syllableAnswerId = button.dataset.answerId;
    render();
    focusSyllableRuleElement(
      `[data-action="pick-syllable-rule-answer"][data-answer-id="${state.syllableAnswerId}"]`
    );
    return;
  }

  if (action === "submit-syllable-rule-answer") {
    if (!["answer", "distractor"].includes(state.syllableAnswerId) || state.syllableAnswerSubmitted) return;
    const rule = currentSyllableRule();
    const exercise = syllableRuleExercise(rule);
    const selectedAnswer = state.syllableAnswerId;
    submitSyllableItem(rule.id, exercise.id, rule.exercises.map((item) => item.id));
    const ruleComplete = syllableStageComplete(rule.id);
    const ruleIndex = syllableTraining.rules.findIndex((item) => item.id === rule.id);
    const nextRule = syllableTraining.rules[ruleIndex + 1];
    if (ruleComplete && nextRule) {
      state.syllableRuleId = nextRule.id;
      state.syllableAnswerId = "";
      state.syllableAnswerSubmitted = false;
      state.syllableRuleCompletionNotice = {
        correct: selectedAnswer === "answer",
        explanation: rule.explanation
      };
      render();
      focusSyllableRuleElement("[data-syllable-feedback]");
      return;
    }
    state.syllableAnswerSubmitted = true;
    render();
    focusSyllableRuleElement("[data-syllable-feedback]");
    return;
  }

  if (action === "next-syllable-rule-exercise") {
    if (!state.syllableAnswerSubmitted || completedSyllableItemIds(currentSyllableRule().id).length >= 4) return;
    state.syllableAnswerId = "";
    state.syllableAnswerSubmitted = false;
    render();
    focusSyllableRuleElement("[data-syllable-question]");
    return;
  }

  if (action === "next-syllable-rule") {
    if (state.syllableRuleCompletionNotice) {
      state.syllableRuleCompletionNotice = null;
      render();
      focusSyllableRuleElement("[data-syllable-question]");
      return;
    }
    const rule = currentSyllableRule();
    if (!state.learningProgress.syllableTraining[rule.id]?.completed) return;
    const ruleIndex = syllableTraining.rules.findIndex((item) => item.id === rule.id);
    const nextRule = syllableTraining.rules[ruleIndex + 1];
    if (!nextRule) return;
    state.syllableRuleId = nextRule.id;
    state.syllableAnswerId = "";
    state.syllableAnswerSubmitted = false;
    render();
    focusSyllableRuleElement("[data-syllable-question]");
    return;
  }

  if (action === "pick-syllable-connection-answer") {
    if (
      !["statement-correct", "statement-incorrect"].includes(button.dataset.answerId) ||
      state.syllableConnectionSubmitted
    ) return;
    state.syllableConnectionAnswerId = button.dataset.answerId;
    render();
    focusSyllableRuleElement(
      `[data-action="pick-syllable-connection-answer"][data-answer-id="${state.syllableConnectionAnswerId}"]`
    );
    return;
  }

  if (action === "submit-syllable-connection-answer") {
    if (!syllableConnectionScreenIsReachable()) {
      goTo("syllableConnections");
      return;
    }
    if (
      !["statement-correct", "statement-incorrect"].includes(state.syllableConnectionAnswerId) ||
      state.syllableConnectionSubmitted
    ) return;
    const item = currentSyllableConnectionItem();
    const isCorrect = state.syllableConnectionAnswerId === item.expectedAnswer;
    updateSyllableMistake(item, isCorrect);
    if (state.syllableConnectionMode === "lesson") {
      submitSyllableItem(
        syllableTraining.sections[2].id,
        item.id,
        syllableTraining.connectionItems.map((connectionItem) => connectionItem.id)
      );
    }
    state.syllableConnectionSubmitted = true;
    render();
    focusSyllableRuleElement("[data-syllable-connection-feedback]");
    return;
  }

  if (action === "next-syllable-connection") {
    if (
      state.syllableConnectionMode !== "lesson" ||
      !state.syllableConnectionSubmitted ||
      completedSyllableConnectionIds().length >= syllableTraining.connectionItems.length
    ) return;
    state.syllableConnectionAnswerId = "";
    state.syllableConnectionSubmitted = false;
    render();
    focusSyllableRuleElement("[data-syllable-connection-question]");
    return;
  }

  if (action === "show-standard-sentence") {
    if (!syllableSentencePrerequisitesComplete()) {
      goTo("syllableSentences");
      return;
    }
    state.syllableSentenceShowStandard = true;
    render();
    focusSyllableRuleElement("[data-syllable-sentence-status]");
    return;
  }

  if (action === "play-syllable-sentence") {
    if (!syllableSentencePrerequisitesComplete()) {
      goTo("syllableSentences");
      return;
    }
    const rate = Number(button.dataset.rate) === 0.75 ? 0.75 : 1;
    const sentence = currentSyllableSentence();
    const audio = syllableSentenceSource(sentence);
    if (!syllableSentenceAudioController || !audio?.outputPath) {
      state.syllableSentencePlaybackStatus = "当前浏览器不能启动真人音频";
      render();
      return;
    }
    syllableSentenceAudioController.stop();
    syllableSentenceAudioController.setRate(rate);
    state.syllableSentencePlaybackStatus = rate === 0.75 ? "正在启动慢速真人整句音频" : "正在启动正常真人整句音频";
    syllableSentenceAudioController.play({
      src: audio.outputPath,
      label: sentence.standard,
      contentKey: `syllable-sentence:${sentence.id}`
    });
    render();
    return;
  }

  if (action === "continue-syllable-sentence") {
    if (!syllableSentencePrerequisitesComplete()) {
      goTo("syllableSentences");
      return;
    }
    if (!continueCurrentSyllableSentence()) return;
    render();
    focusSyllableRuleElement("[data-syllable-sentence-status]");
    return;
  }

  if (action === "review-syllable-mistakes") {
    const bucketName = button.dataset.mistakeBucket;
    if (!["connection", "break"].includes(bucketName) || state.syllableMistakes[bucketName].length === 0) return;
    state.syllableConnectionMode = `review-${bucketName}`;
    state.syllableConnectionReviewItemId = state.syllableMistakes[bucketName][0];
    state.syllableConnectionAnswerId = "";
    state.syllableConnectionSubmitted = false;
    goTo("syllableConnections");
    focusSyllableRuleElement("[data-syllable-connection-question]");
    return;
  }

  if (action === "next-syllable-connection-review") {
    if (state.syllableConnectionMode === "lesson" || !state.syllableConnectionSubmitted) return;
    const bucketName = state.syllableConnectionMode === "review-break" ? "break" : "connection";
    const nextItemId = state.syllableMistakes[bucketName][0] || "";
    state.syllableConnectionAnswerId = "";
    state.syllableConnectionSubmitted = false;
    state.syllableConnectionReviewItemId = nextItemId;
    if (!nextItemId) {
      goTo("syllableReview");
      focusSyllableRuleElement(syllableReviewFocusTarget(bucketName));
      return;
    }
    render();
    focusSyllableRuleElement("[data-syllable-connection-question]");
    return;
  }

  if (action === "clear-syllable-mistakes") {
    const bucketName = button.dataset.mistakeBucket;
    if (!["connection", "break"].includes(bucketName)) return;
    if (state.syllableMistakes[bucketName].length > 0) {
      state.syllableMistakes = { ...state.syllableMistakes, [bucketName]: [] };
      markCloudDirty("learning");
    }
    render();
    focusSyllableRuleElement(syllableReviewFocusTarget(bucketName));
    return;
  }

  if (action === "complete-latin-classification") {
    markProgress("latinWriting", "classification", "completed");
    state.latinVowelComparisonIndex = firstIncompleteLatinWritingIndex("vowel-contrast");
    goTo("latinVowelCompare");
    return;
  }

  if (action === "navigate-latin-vowel-comparison") {
    const direction = button.dataset.direction === "previous" ? -1 : 1;
    const lastIndex = latinWriting.vowelComparisons.length - 1;
    if (direction > 0) {
      submitLatinWritingItem("vowel-contrast", latinWriting.vowelComparisons[state.latinVowelComparisonIndex]?.id);
    }
    state.latinVowelComparisonIndex = Math.max(0, Math.min(lastIndex, state.latinVowelComparisonIndex + direction));
    render();
    return;
  }

  if (action === "complete-latin-vowel-comparison") {
    const lastIndex = latinWriting.vowelComparisons.length - 1;
    if (state.latinVowelComparisonIndex === lastIndex) {
      submitLatinWritingItem("vowel-contrast", latinWriting.vowelComparisons[lastIndex].id);
      if (state.learningProgress.latinWriting?.["vowel-contrast"]?.completed !== true) {
        render();
        return;
      }
      state.latinDictationIndex = firstIncompleteLatinWritingIndex("dictation");
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
    if (state.learningProgress.latinWriting?.dictation?.completed === true) {
      goTo("unit");
      return;
    }
    state.latinDictationIndex = firstIncompleteLatinWritingIndex("dictation");
    state.latinDictationRevealed = false;
    state.latinWritingForm = 0;
    render();
    return;
  }

  if (action === "set-uyghur-keyboard-mode") {
    if (!["onscreen", "physical"].includes(button.dataset.mode)) return;
    state.uyghurKeyboardMode = button.dataset.mode;
    render();
    return;
  }

  if (action === "uyghur-keyboard-key") {
    appendUyghurKeyboardLessonValue(button.dataset.key || "");
    state.keyboardShift = false;
    render();
    return;
  }

  if (action === "uyghur-keyboard-backspace") {
    state.uyghurKeyboardValue = state.uyghurKeyboardValue.slice(0, -1);
    render();
    return;
  }

  if (action === "next-uyghur-keyboard-lesson") {
    const lesson = currentUyghurKeyboardLesson();
    if (state.uyghurKeyboardValue !== lesson.value) return;
    state.uyghurKeyboardValue = "";
    state.keyboardShift = false;
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

  if (action === "next-latin-keyboard-lesson") {
    const lessonIndex = Math.max(0, Math.min(latinWriting.keyboardLessons.length - 1, state.latinKeyboardLessonIndex));
    if (state.latinKeyboardValue !== latinWriting.keyboardLessons[lessonIndex].latin) return;
    state.latinKeyboardLessonIndex = Math.min(latinWriting.keyboardLessons.length - 1, lessonIndex + 1);
    state.latinKeyboardValue = "";
    render();
    return;
  }

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
      showToast(t("error.storage"));
      return;
    }
    render();
    showToast(t("toast.recordsCleared"));
    return;
  }

  if (action === "continue-local") {
    const continuingWithCloud = Boolean(cloudAccountEmail());
    state.screen = "home";
    saveLocalProgress();
    render();
    showToast(continuingWithCloud ? t("toast.continueCloud") : t("toast.localMode"));
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
    if (target === "latinKeyboardIntro") {
      state.latinKeyboardValue = "";
      state.latinKeyboardLessonIndex = latinKeyboardResumeIndex();
    }
    if (target === "syllableWarmup") {
      state.syllableSectionId = syllableTraining.sections[0].id;
      state.syllableItemIndex = syllableWarmupResumeIndex();
      state.syllableShowStandard = false;
    }
    if (target === "syllableRules") {
      state.syllableSectionId = syllableTraining.sections[1].id;
      state.syllableRuleId = firstReachableSyllableRuleId();
      state.syllableAnswerId = "";
      state.syllableAnswerSubmitted = false;
    }
    if (target === "syllableConnections") {
      state.syllableSectionId = syllableTraining.sections[2].id;
      state.syllableConnectionMode = "lesson";
      state.syllableConnectionAnswerId = "";
      state.syllableConnectionSubmitted = false;
      state.syllableConnectionReviewItemId = "";
    }
    if (target === "syllableSentences") {
      const firstIncompleteIndex = syllableTraining.sentences.findIndex(
        (item) => !completedSyllableSentenceIds().includes(item.id)
      );
      state.syllableSectionId = syllableTraining.sections[3].id;
      state.syllableSentenceIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex : syllableTraining.sentences.length - 1;
      state.syllableSentenceShowStandard = false;
      state.syllableSentenceHelperViewed = false;
      state.syllableSentenceAudioPlayed = false;
      state.syllableSentencePlaybackStatus = "";
      syllableSentenceAudioController?.stop();
    }
    if (target === "afantiStories") {
      state.selectedUnitId = "afanti-stories";
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

  if (action === "open-unit-stage") {
    const unitId = button.dataset.unitId;
    const target = button.dataset.target;
    const latinTargets = new Set(["latinKeyboardIntro", "uyghurKeyboardWords", "latinLetterClasses", "latinDictation"]);
    const syllableTargets = new Set(["syllableWarmup", "syllableRules", "syllableConnections", "syllableSentences"]);
    if (unitId === "latin-keyboard-writing" && latinTargets.has(target)) {
      state.selectedUnitId = unitId;
      let resolvedTarget = target;
      if (target === "latinKeyboardIntro") {
        state.latinKeyboardLessonIndex = latinKeyboardResumeIndex();
        state.latinKeyboardValue = "";
      } else if (target === "uyghurKeyboardWords") {
        state.uyghurKeyboardValue = "";
        state.keyboardShift = false;
      } else if (target === "latinLetterClasses" && state.learningProgress.latinWriting?.classification?.completed === true) {
        state.latinVowelComparisonIndex = firstIncompleteLatinWritingIndex("vowel-contrast");
        resolvedTarget = "latinVowelCompare";
      } else if (target === "latinDictation") {
        state.latinDictationIndex = firstIncompleteLatinWritingIndex("dictation");
        state.latinDictationRevealed = false;
      }
      goTo(resolvedTarget);
      return;
    }
    if (unitId === "syllable-training" && syllableTargets.has(target)) {
      state.selectedUnitId = unitId;
      if (!syllableUnitStageIsUnlocked(target)) {
        render({ persist: false });
        return;
      }
      if (target === "syllableWarmup") {
        state.syllableSectionId = syllableTraining.sections[0].id;
        state.syllableItemIndex = syllableWarmupResumeIndex();
        state.syllableShowStandard = false;
      } else if (target === "syllableRules") {
        state.syllableSectionId = syllableTraining.sections[1].id;
        state.syllableRuleId = firstReachableSyllableRuleId();
        resetSyllableRuleInteraction();
      } else if (target === "syllableConnections") {
        state.syllableSectionId = syllableTraining.sections[2].id;
        state.syllableConnectionMode = "lesson";
        state.syllableConnectionAnswerId = "";
        state.syllableConnectionSubmitted = false;
      } else if (target === "syllableSentences") {
        const firstIncompleteIndex = syllableTraining.sentences.findIndex(
          (item) => !completedSyllableSentenceIds().includes(item.id)
        );
        state.syllableSectionId = syllableTraining.sections[3].id;
        state.syllableSentenceIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex : syllableTraining.sentences.length - 1;
        state.syllableSentenceShowStandard = false;
        state.syllableSentenceHelperViewed = false;
        state.syllableSentenceAudioPlayed = false;
        state.syllableSentencePlaybackStatus = "";
        syllableSentenceAudioController?.stop();
      }
      goTo(target);
    }
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
    resetReadingTrainingState(group);
    goTo("reading");
    return;
  }

  if (action === "continue-reading-training") {
    const group = currentReadingGroup();
    const steps = readingTrainingSteps(group);
    const stepId = steps[state.readingTrainingStepIndex];
    if (["rule", "compare"].includes(stepId)) markProgress("reading", group.id, stepId);
    if (readingTrainingProgress(group)[stepId] !== true) return;
    state.readingTrainingStepIndex = Math.min(state.readingTrainingStepIndex + 1, steps.length - 1);
    state.readingTrainingChoiceId = "";
    state.readingOrderingIds = [];
    state.readingTrainingFeedback = "";
    saveLocalProgress();
    render();
    return;
  }

  if (action === "pick-reading-training-answer") {
    const group = currentReadingGroup();
    const answerId = button.dataset.answerId;
    state.readingTrainingChoiceId = answerId;
    if (answerId === group.training?.recognition?.answerId) {
      markProgress("reading", group.id, "recognition");
      state.readingTrainingFeedback = i18n.getLanguage() === "en" ? "Correct." : "正确，可以继续。";
      saveLocalProgress();
    } else {
      state.readingTrainingFeedback = i18n.getLanguage() === "en" ? "Try again." : "再看一遍句意后重试。";
    }
    render();
    return;
  }

  if (action === "pick-reading-order-token") {
    const group = currentReadingGroup();
    const exercise = group.training?.ordering;
    const tokenId = button.dataset.tokenId;
    if (!exercise || state.readingOrderingIds.includes(tokenId)) return;
    state.readingOrderingIds.push(tokenId);
    if (state.readingOrderingIds.length === exercise.answerIds.length) {
      const correct = state.readingOrderingIds.every((id, index) => id === exercise.answerIds[index]);
      state.readingTrainingFeedback = correct
        ? (i18n.getLanguage() === "en" ? "Correct sentence order." : "顺序正确，可以继续。")
        : (i18n.getLanguage() === "en" ? "That order is not correct. Reset and try again." : "顺序不对，请重新排列。");
      if (correct) {
        markProgress("reading", group.id, "ordering");
        saveLocalProgress();
      }
    }
    render();
    return;
  }

  if (action === "reset-reading-order") {
    state.readingOrderingIds = [];
    state.readingTrainingFeedback = "";
    render();
    return;
  }

  if (action === "pick-reading-completion") {
    const group = currentReadingGroup();
    const answerId = button.dataset.answerId;
    state.readingTrainingChoiceId = answerId;
    if (answerId === group.training?.completion?.answerId) {
      markProgress("reading", group.id, "completion");
      state.readingTrainingFeedback = i18n.getLanguage() === "en" ? "Completed." : "本课五步练习已完成。";
      saveLocalProgress();
    } else {
      state.readingTrainingFeedback = i18n.getLanguage() === "en" ? "Try again." : "再看一遍完整句后重试。";
    }
    render();
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

  if (action === "select-letter-writing-form") {
    const forms = activeLetterWritingDetail().forms;
    const requestedIndex = Number.parseInt(button.dataset.formIndex || "0", 10);
    const nextIndex = Number.isInteger(requestedIndex)
      ? Math.max(0, Math.min(requestedIndex, forms.length - 1))
      : 0;
    const nextForm = forms[nextIndex] || forms[0];
    state.letterWritingFormIndex = nextIndex;
    const guide = document.querySelector("[data-letter-writing-guide]");
    if (guide) {
      guide.textContent = displayLetterFormGlyph(nextForm.value);
    }
    const targetLabel = document.querySelector("[data-letter-writing-target-label]");
    if (targetLabel) {
      targetLabel.textContent = nextForm.label;
    }
    const practiceTargetGlyph = document.querySelector("[data-practice-writing-target-glyph]");
    if (practiceTargetGlyph) {
      practiceTargetGlyph.textContent = displayLetterFormGlyph(nextForm.value);
    }
    document.querySelectorAll("[data-letter-writing-form-option]").forEach((option) => {
      const selected = Number.parseInt(option.dataset.formIndex || "-1", 10) === nextIndex;
      option.classList.toggle("active", selected);
      option.setAttribute("aria-pressed", String(selected));
    });
    document.querySelectorAll("[data-writing-canvas]").forEach((canvas) => {
      canvas.setAttribute("aria-label", `${nextForm.label} 字母手写板`);
    });
    const writingPad = document.querySelector("[data-letter-writing-pad]");
    if (writingPad) {
      writingPad.setAttribute("aria-label", `${nextForm.label} 字母手写板`);
    }
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

document.addEventListener("keydown", (event) => {
  if (
    ["syllableRules", "syllableConnections", "syllableSentences"].includes(state.screen) &&
    !normalizeActiveSyllableRoute()
  ) {
    render({ persist: false });
    return;
  }
  if (state.screen === "syllableRules") {
    const option = event.target?.closest?.('[data-action="pick-syllable-rule-answer"]');
    if (
      option &&
      syllableRuleAnswerNavigationKeys.has(event.key) &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey &&
      !state.syllableAnswerSubmitted
    ) {
      const answerIds = ["answer", "distractor"];
      const currentIndex = Math.max(0, answerIds.indexOf(option.dataset.answerId));
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? answerIds.length - 1
            : ["ArrowLeft", "ArrowUp"].includes(event.key)
              ? (currentIndex - 1 + answerIds.length) % answerIds.length
              : (currentIndex + 1) % answerIds.length;
      event.preventDefault();
      state.syllableAnswerId = answerIds[nextIndex];
      render();
      focusSyllableRuleElement(
        `[data-action="pick-syllable-rule-answer"][data-answer-id="${state.syllableAnswerId}"]`
      );
      return;
    }
  }

  if (state.screen === "syllableConnections") {
    const option = event.target?.closest?.('[data-action="pick-syllable-connection-answer"]');
    if (
      option &&
      syllableRuleAnswerNavigationKeys.has(event.key) &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.metaKey &&
      !state.syllableConnectionSubmitted
    ) {
      const answerIds = ["statement-correct", "statement-incorrect"];
      const currentIndex = Math.max(0, answerIds.indexOf(option.dataset.answerId));
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? answerIds.length - 1
            : ["ArrowLeft", "ArrowUp"].includes(event.key)
              ? (currentIndex - 1 + answerIds.length) % answerIds.length
              : (currentIndex + 1) % answerIds.length;
      event.preventDefault();
      state.syllableConnectionAnswerId = answerIds[nextIndex];
      render();
      focusSyllableRuleElement(
        `[data-action="pick-syllable-connection-answer"][data-answer-id="${state.syllableConnectionAnswerId}"]`
      );
      return;
    }
  }

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

  if (state.screen === "uyghurKeyboardWords" && state.uyghurKeyboardMode === "physical") {
    if (event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.target?.matches?.("textarea, select, [contenteditable='true'], input:not([readonly])")) return;
    if (event.code === "Backspace") {
      event.preventDefault();
      state.uyghurKeyboardValue = state.uyghurKeyboardValue.slice(0, -1);
      render();
      return;
    }
    const mappedKey = uyghurKeyboard.keyForCode(event.code, event.shiftKey);
    if (!mappedKey) return;
    event.preventDefault();
    appendUyghurKeyboardLessonValue(mappedKey.value);
    render();
    return;
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
  if (input?.dataset?.action === "set-language-select") {
    const language = input.value;
    if (language !== "zh" && language !== "en") return;
    applyInterfaceLanguage(language, { explicit: true });
    render();
    showToast(t("language.changed"));
    return;
  }
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
    showToast(t("toast.avatarType"));
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast(t("toast.avatarSize"));
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
      showToast(t("toast.avatarUpdated"));
    })
    .catch(() => {
      state.avatarUploading = false;
      render();
      showToast(t("error.avatar"));
    });
});

function configuredSupabaseClient() {
  if (sharedSupabaseClient) return sharedSupabaseClient;
  const config = window.ANA_TILIM_CLOUD_CONFIG || {};
  if (
    config.supabaseUrl &&
    config.supabasePublishableKey &&
    typeof window.supabase?.createClient === "function"
  ) {
    sharedSupabaseClient = window.supabase.createClient(
      config.supabaseUrl,
      config.supabasePublishableKey
    );
  }
  return sharedSupabaseClient;
}

function initializeFeedbackService() {
  feedbackClient = feedbackApi.createFeedbackClient({
    supabaseClient: configuredSupabaseClient(),
    edition: appConfig.edition,
    appVersion: "20260810-feedback"
  });
}

function initializeCloudAuthentication() {
  if (!appConfig.cloudEnabled) {
    cloudStatus = { phase: "local", error: "" };
    return;
  }
  const cloudApi = window.ANA_TILIM_CLOUD;
  if (!cloudApi?.createCloudSync) {
    cloudStatus = { phase: "local", error: "" };
    return;
  }

  const supabaseClient = configuredSupabaseClient();

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
    cloudStatus = { phase: "error", error: t("error.cloud") };
    render();
  });
  if (typeof window.addEventListener === "function") {
    window.addEventListener("online", () => {
      cloudSync.handleOnline().catch(() => {});
    });
  }
}

initializeFeedbackService();
initializeCloudAuthentication();
render();
