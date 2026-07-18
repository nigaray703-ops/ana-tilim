const courseData = window.ANA_TILIM_COURSE;

if (!courseData) {
  throw new Error("Ana Tilim course data failed to load.");
}

const { alphabetLetters, letterDetails, alphabetGroups, alphabetAudioItems, comboGroups, vocabGroups } = courseData;
const alphabetAudioByLetterId = Object.fromEntries(alphabetAudioItems.map((item) => [item.letterId, item]));

const practiceGroups = [
  {
    id: "listening-loop",
    kind: "practice",
    mode: "listen",
    title: "听音辨认",
    letters: ["ب", "با", "مەن"],
    goal: "用 AI 临时音频练辨认，真人音频上线后直接替换",
    status: "已开放",
    items: [
      {
        id: "practice-listen-be",
        type: "字母",
        value: "ب",
        latin: "b",
        label: "第一单元字母",
        hint: "下方一个点。当前用 AI 临时音频练听音，真人音频待录制。",
        parts: ["ب"],
        audioStatus: "AI 临时音频，真人音频待录制"
      },
      {
        id: "practice-listen-ba",
        type: "组合",
        value: "با",
        latin: "ba",
        label: "第二单元组合",
        hint: "由 ب 和 ا 连成，先听成一个整体。",
        parts: ["ب", "ا"],
        audioStatus: "AI 临时音频，真人音频待录制"
      },
      {
        id: "practice-listen-men",
        type: "词形",
        value: "مەن",
        latin: "men",
        label: "第三单元候选词",
        hint: "第三单元词义仍待审校，本题只练词形辨认。",
        parts: ["م", "ە", "ن"],
        audioStatus: "AI 临时音频，真人音频待录制"
      }
    ]
  },
  {
    id: "repeat-loop",
    kind: "practice",
    mode: "repeat",
    title: "跟读练习",
    letters: ["ئا", "نا", "رەھمەت"],
    goal: "看词形和转写提示，完成一轮跟读确认",
    status: "已开放",
    items: [
      {
        id: "practice-repeat-aa",
        type: "元音",
        value: "ئا",
        latin: "a",
        label: "第一单元元音",
        hint: "先看 ئ 和 ا 的组合，再跟读开口音提示。",
        parts: ["ئ", "ا"],
        audioStatus: "AI 临时音频，真人音频待录制"
      },
      {
        id: "practice-repeat-na",
        type: "组合",
        value: "نا",
        latin: "na",
        label: "第二单元组合",
        hint: "先读 ن，再接 ا，保持从右到左看词形。",
        parts: ["ن", "ا"],
        audioStatus: "AI 临时音频，真人音频待录制"
      },
      {
        id: "practice-repeat-rahmat",
        type: "词形",
        value: "رەھمەت",
        latin: "rehmet",
        label: "第三单元候选词",
        hint: "中文含义仍待审校，先练 رەھمەت 的词形和转写。",
        parts: ["رە", "ھمەت"],
        audioStatus: "AI 临时音频，真人音频待录制"
      }
    ]
  },
  {
    id: "writing-loop",
    kind: "practice",
    mode: "write",
    title: "书写、键盘",
    letters: ["ن", "مان", "ئانا"],
    goal: "先描摹，再用键盘输入同一个目标",
    status: "已开放",
    items: [
      {
        id: "practice-write-nun",
        type: "字母",
        value: "ن",
        latin: "n",
        label: "第一单元字母",
        hint: "上方一个点，和 ت 放在一起复习。",
        parts: ["ن"],
        audioStatus: "AI 临时音频，真人音频待录制"
      },
      {
        id: "practice-write-man",
        type: "组合",
        value: "مان",
        latin: "man",
        label: "第二单元三字母慢读",
        hint: "م + ا + ن，注意 ا 后面的连接变化。",
        parts: ["م", "ا", "ن"],
        audioStatus: "AI 临时音频，真人音频待录制"
      },
      {
        id: "practice-write-ana",
        type: "词形",
        value: "ئانا",
        latin: "ana",
        label: "第三单元候选称呼",
        hint: "家庭称呼不设唯一答案，先练 ئانا 的词形。",
        parts: ["ئا", "ن", "ا"],
        audioStatus: "AI 临时音频，真人音频待录制"
      }
    ]
  },
  {
    id: "review-loop",
    kind: "practice",
    mode: "review",
    title: "错题复习",
    letters: ["س", "سىز", "بەش"],
    goal: "把本轮结果整理成复习卡，后续接错题记录",
    status: "已开放",
    items: [
      {
        id: "practice-review-sin",
        type: "字母",
        value: "س",
        latin: "s",
        label: "第一单元易混字母",
        hint: "和 ش 对比，先看有没有上方三点。",
        parts: ["س"],
        audioStatus: "AI 临时音频，真人音频待录制"
      },
      {
        id: "practice-review-siz",
        type: "词形",
        value: "سىز",
        latin: "siz",
        label: "第三单元候选人称",
        hint: "和 سەن 同组比较，但不在这里考礼貌等级。",
        parts: ["س", "ى", "ز"],
        audioStatus: "AI 临时音频，真人音频待录制"
      },
      {
        id: "practice-review-five",
        type: "词形",
        value: "بەش",
        latin: "besh",
        label: "第三单元候选数字",
        hint: "数字词义仍待审校确认，先做词形回看。",
        parts: ["ب", "ە", "ش"],
        audioStatus: "AI 临时音频，真人音频待录制"
      }
    ]
  }
];

function safeAudioId(id) {
  return id.replace(/^practice-/, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function createAudioItem({ folder, prefix, id, value, latin, order }) {
  const safeId = safeAudioId(id);
  const file = `ai_temp_${prefix}_${safeId}.mp3`;

  return {
    id,
    order,
    value,
    latin,
    file,
    statusLabel: "AI 临时音频",
    outputPath: `./assets/audio/ai-temp/${folder}/${file}`
  };
}

const comboAudioItems = comboGroups.flatMap((group) =>
  group.items.map((item, index) =>
    createAudioItem({
      folder: "combos",
      prefix: "combo",
      id: item.id,
      value: item.value,
      latin: item.latin,
      order: index + 1
    })
  )
);

const vocabAudioItems = vocabGroups.flatMap((group) =>
  group.items.map((item, index) =>
    createAudioItem({
      folder: "vocab",
      prefix: "vocab",
      id: item.id,
      value: item.value,
      latin: item.latin,
      order: index + 1
    })
  )
);

const practiceAudioItems = practiceGroups.flatMap((group) =>
  group.items.map((item, index) =>
    createAudioItem({
      folder: "practice",
      prefix: "practice",
      id: item.id,
      value: item.value,
      latin: item.latin,
      order: index + 1
    })
  )
);

const comboAudioByItemId = Object.fromEntries(comboAudioItems.map((item) => [item.id, item]));
const vocabAudioByItemId = Object.fromEntries(vocabAudioItems.map((item) => [item.id, item]));
const practiceAudioByItemId = Object.fromEntries(practiceAudioItems.map((item) => [item.id, item]));

const learningUnits = [
  {
    id: "letters",
    title: "第一单元：认识字母",
    subtitle: "32 个字母，相似分组",
    status: "已完成",
    description: "先按截图顺序认识全部字母，学习时把看起来相似、容易混的字母放在一组。",
    bullets: ["认识字母形状", "区分点位和点数", "看四种形态", "练单字母键盘输入"],
    groups: alphabetGroups,
    actionTarget: "letter"
  },
  {
    id: "combos",
    title: "第二单元：组合与词组入门",
    subtitle: "字母连起来，词形预览",
    status: "已完成",
    description: "先做两字母和三字母组合，再加入少量基础称呼词形预览；含义和变体都标记为待母语者审校。",
    bullets: ["两字母组合", "三字母慢读", "词形预览", "键盘输入"],
    groups: comboGroups,
    actionTarget: "combo"
  },
  {
    id: "basic-phrases",
    title: "第三单元：基础词组与主题词",
    subtitle: "问候、人称、称呼、数字",
    status: "已完成",
    description: "进入真实词义前，先建立审校表：词形、中文预览、标准主词、变体和可考状态分开。",
    bullets: ["词库审校", "主题分组", "词形辨认", "键盘输入"],
    groups: vocabGroups,
    actionTarget: "vocab"
  },
  {
    id: "practice",
    title: "第四单元：听说与书写强化",
    subtitle: "听音、跟读、书写、复习",
    status: "进行中",
    description: "不加新词，把第一到三单元内容变成能听、能说、能写、能输入的复习闭环。",
    bullets: ["AI 临时音频", "跟读确认", "描摹输入", "复习结果"],
    groups: practiceGroups,
    actionTarget: "writing"
  }
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
    recommended: "把字母连起来，从右往左拆分组合。",
    steps: ["看两字母组合", "拆开再合上", "做组合辨认", "完成后进入词形"],
    reviewLabel: "复习组合",
    reviewTarget: "combo",
    nextLabel: "进入第三单元",
    nextUnitId: "basic-phrases"
  },
  "basic-phrases": {
    recommended: "只练词形，不急着把中文含义定死。",
    steps: ["选择主题词组", "看审校字段", "做词形辨认", "完成后进入强化训练"],
    reviewLabel: "复习词形",
    reviewTarget: "vocab",
    nextLabel: "进入第四单元",
    nextUnitId: "practice"
  },
  practice: {
    recommended: "不加新词，用听说写把前面内容走成闭环。",
    steps: ["选择训练组", "完成一个目标", "查看本轮结果", "回到路径继续复习"],
    reviewLabel: "再练一轮",
    reviewTarget: "practiceSession",
    nextLabel: "回到学习路径",
    nextUnitId: "letters"
  }
};

const reviewStatusOptions = [
  { id: "pending", label: "待审校", tone: "pending" },
  { id: "approved", label: "通过", tone: "good" },
  { id: "needs-edit", label: "需修改", tone: "bad" },
  { id: "display-only", label: "只展示不考核", tone: "warn" },
  { id: "variant", label: "变体保留", tone: "warn" },
  { id: "second-review", label: "待二审", tone: "pending" }
];

const audioStatusOptions = [
  { id: "audio-pending", label: "真人音频待录制" },
  { id: "audio-ai-temp", label: "AI 临时音频" },
  { id: "audio-recorded", label: "真人音频已录制" },
  { id: "audio-connected", label: "真人音频已接入" },
  { id: "audio-rerecord", label: "需重新录制" }
];

const reviewFilters = [
  { id: "all", label: "全部" },
  { id: "pending", label: "待审校" },
  { id: "needs-edit", label: "需修改" },
  { id: "display-only", label: "只展示不考核" },
  { id: "variant", label: "变体保留" },
  { id: "family", label: "家庭重点" },
  { id: "audio-pending", label: "音频待录" },
  { id: "audio-ai-temp", label: "AI 音频" },
  { id: "audio-rerecord", label: "需重录" }
];

const reviewBaseItems = [
  ...alphabetLetters.map((item, index) => ({
    id: `letter-${index + 1}`,
    unit: "第一单元",
    kind: item.type,
    theme: "认识字母",
    value: item.letter,
    latin: item.latin,
    meaning: "字母",
    reviewStatus: "pending",
    examPolicy: "可练字母辨认；发音提示需审校后再进入正式听音题。",
    audioStatus: "audio-ai-temp",
    priority: false,
    question: "字母顺序、转写、发音提示和连接说明是否适合标准维吾尔语？"
  })),
  ...comboGroups.flatMap((group) =>
    group.items.map((item) => {
      const isFamily = group.id === "phrase-preview";
      return {
        id: `combo-${item.id}`,
        unit: "第二单元",
        kind: item.type,
        theme: group.title,
        value: item.value,
        latin: item.latin,
        meaning: item.meaning || "组合练习",
        reviewStatus: isFamily ? "pending" : "display-only",
        examPolicy: isFamily ? "正式考核前不设唯一答案。" : "只做组合、拆分和输入；不考词义。",
        audioStatus: "audio-ai-temp",
        priority: isFamily,
        question: isFamily ? "请确认标准主词、家庭口语、地区说法和可接受答案。" : "请确认组合是否适合新手练习，是否保持只展示不考核。"
      };
    })
  ),
  ...vocabGroups.flatMap((group) =>
    group.items.map((item) => {
      const isFamily = group.id === "family";
      const isVariant = ["apa-family", "dada-family"].includes(item.id);
      return {
        id: `vocab-${item.id}`,
        unit: "第三单元",
        kind: "候选词条",
        theme: group.title,
        value: item.value,
        latin: item.latin,
        meaning: item.meaning,
        reviewStatus: isVariant ? "variant" : "pending",
        examPolicy: item.testPolicy,
        audioStatus: "audio-ai-temp",
        priority: isFamily,
        question: isFamily ? "家庭称呼必须确认标准主词、变体身份和是否可作为答案。" : `${item.standardNote} ${item.variantNote}`
      };
    })
  ),
  ...practiceGroups.flatMap((group) =>
    group.items.map((item) => ({
      id: `practice-${item.id}`,
      unit: "第四单元",
      kind: item.type,
      theme: group.title,
      value: item.value,
      latin: item.latin,
      meaning: item.label,
      reviewStatus: "display-only",
      examPolicy: "第四单元只复用前面内容做流程练习，不新增词义考核。",
      audioStatus: "audio-ai-temp",
      priority: item.value === "ئانا" || item.value === "سىز",
      question: item.hint
    }))
  )
];

const keyboardRows = [
  ["ق", "و", "ې", "ر", "ت"],
  ["ي", "ۇ", "ڭ", "ا", "س"],
  ["د", "ف", "گ", "ھ", "ج"],
  ["ك", "ل", "ز", "خ", "ب"]
];

const progressStorageKey = "ana-tilim-progress";
const letterLoopSteps = [
  { id: "viewed", label: "认识" },
  { id: "writing", label: "描摹" },
  { id: "recognition", label: "辨认听音" },
  { id: "keyboard", label: "键盘" }
];

const state = {
  screen: "welcome",
  appMode: "learn",
  selectedPicture: "",
  selectedListening: "",
  keyboardValue: "",
  currentLetterId: "be",
  selectedGroupId: "dot-bone",
  currentComboItemId: "ba",
  selectedComboGroupId: "open-a",
  currentVocabItemId: "yaxshimusiz",
  selectedVocabGroupId: "greetings",
  currentPracticeItemId: "practice-listen-be",
  selectedPracticeGroupId: "listening-loop",
  practiceSpoken: false,
  writingChecks: [],
  selectedReviewItemId: "vocab-ana-family",
  reviewFilter: "all",
  reviewOverrides: {},
  learningProgress: {
    letters: {},
    combos: {},
    vocab: {},
    practice: {}
  },
  mistakes: [],
  selectedUnitId: "letters",
  showGuide: true,
  favorite: false
};

hydrateLocalProgress();

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
let toastTimer = null;
let activeAudio = null;

function localStorageSafe() {
  try {
    return window && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
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

    const fields = [
      "screen",
      "appMode",
      "currentLetterId",
      "selectedGroupId",
      "currentComboItemId",
      "selectedComboGroupId",
      "currentVocabItemId",
      "selectedVocabGroupId",
      "currentPracticeItemId",
      "selectedPracticeGroupId",
      "selectedReviewItemId",
      "reviewFilter",
      "selectedUnitId"
    ];

    fields.forEach((field) => {
      if (typeof saved[field] === "string") {
        state[field] = saved[field];
      }
    });

    if (typeof saved.favorite === "boolean") {
      state.favorite = saved.favorite;
    }

    if (saved.reviewOverrides && typeof saved.reviewOverrides === "object") {
      state.reviewOverrides = saved.reviewOverrides;
    }

    if (saved.learningProgress && typeof saved.learningProgress === "object") {
      state.learningProgress = {
        letters: saved.learningProgress.letters || {},
        combos: saved.learningProgress.combos || {},
        vocab: saved.learningProgress.vocab || {},
        practice: saved.learningProgress.practice || {}
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
    return;
  }

  const saved = {
    screen: state.screen,
    appMode: state.appMode,
    currentLetterId: state.currentLetterId,
    selectedGroupId: state.selectedGroupId,
    currentComboItemId: state.currentComboItemId,
    selectedComboGroupId: state.selectedComboGroupId,
    currentVocabItemId: state.currentVocabItemId,
    selectedVocabGroupId: state.selectedVocabGroupId,
    currentPracticeItemId: state.currentPracticeItemId,
    selectedPracticeGroupId: state.selectedPracticeGroupId,
    selectedReviewItemId: state.selectedReviewItemId,
    reviewFilter: state.reviewFilter,
    selectedUnitId: state.selectedUnitId,
    favorite: state.favorite,
    reviewOverrides: state.reviewOverrides,
    learningProgress: state.learningProgress,
    mistakes: state.mistakes,
    writingChecks: state.writingChecks
  };

  try {
    storage.setItem(progressStorageKey, JSON.stringify(saved));
  } catch {
    // Local storage can fail in private or restricted contexts; the prototype still works in memory.
  }
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
  return alphabetGroups.flatMap((group) => group.letters);
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

function currentVocabGroup() {
  return vocabGroups.find((group) => group.id === state.selectedVocabGroupId) || vocabGroups[0];
}

function currentVocabItems() {
  return currentVocabGroup().items;
}

function currentVocabItem() {
  return currentVocabItems().find((item) => item.id === state.currentVocabItemId) || currentVocabItems()[0];
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
  return currentPracticeGroup().items;
}

function currentPracticeItem() {
  return currentPracticeItems().find((item) => item.id === state.currentPracticeItemId) || currentPracticeItems()[0];
}

function currentPracticeAudio() {
  return practiceAudioByItemId[currentPracticeItem().id] || null;
}

function practiceGroupForItem(itemId) {
  return practiceGroups.find((group) => group.items.some((item) => item.id === itemId));
}

function allPracticeItems() {
  return practiceGroups.flatMap((group) => group.items);
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
    return practiceAudioByItemId[mistake.targetId] || null;
  }

  return null;
}

function reviewStatusById(statusId) {
  return reviewStatusOptions.find((item) => item.id === statusId) || reviewStatusOptions[0];
}

function audioStatusById(statusId) {
  return audioStatusOptions.find((item) => item.id === statusId) || audioStatusOptions[0];
}

function reviewItemsWithOverrides() {
  return reviewBaseItems.map((item) => ({
    ...item,
    ...(state.reviewOverrides[item.id] || {})
  }));
}

function filteredReviewItems() {
  const items = reviewItemsWithOverrides();

  if (state.reviewFilter === "all") {
    return items;
  }

  if (state.reviewFilter === "family") {
    return items.filter((item) => item.priority);
  }

  if (state.reviewFilter.startsWith("audio-")) {
    return items.filter((item) => item.audioStatus === state.reviewFilter);
  }

  return items.filter((item) => item.reviewStatus === state.reviewFilter);
}

function currentReviewItem() {
  const items = reviewItemsWithOverrides();
  return items.find((item) => item.id === state.selectedReviewItemId) || items[0];
}

function reviewCounts() {
  const items = reviewItemsWithOverrides();

  return {
    total: items.length,
    pending: items.filter((item) => item.reviewStatus === "pending").length,
    needsEdit: items.filter((item) => item.reviewStatus === "needs-edit").length,
    family: items.filter((item) => item.priority).length,
    audioPending: items.filter((item) => item.audioStatus === "audio-pending").length,
    aiTemp: items.filter((item) => item.audioStatus === "audio-ai-temp").length,
    needsRerecord: items.filter((item) => item.audioStatus === "audio-rerecord").length
  };
}

function updateReviewItem(itemId, patch) {
  state.reviewOverrides[itemId] = {
    ...(state.reviewOverrides[itemId] || {}),
    ...patch
  };
}

function isAuditMode() {
  return state.appMode === "audit";
}

function modeActionButton(target = "") {
  return `
    <button
      class="ghost-button"
      data-action="set-app-mode"
      data-mode="${isAuditMode() ? "learn" : "audit"}"
      data-target="${target}"
      type="button"
    >
      ${isAuditMode() ? "退出审校模式" : "进入审校模式"}
    </button>
  `;
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
  progress[step] = true;

  if (scope === "letters") {
    const finishedSteps = letterLoopSteps.every((item) => progress[item.id]);
    if (finishedSteps) {
      progress.completed = true;
    }
  } else if (["recognition", "keyboard", "build", "listen", "repeat", "write", "review", "completed"].includes(step)) {
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

function unitProgressSummaries() {
  return [
    { unit: "第一单元", label: "字母闭环", completed: countCompleted("letters"), total: alphabetGroups.length },
    { unit: "第二单元", label: "组合输入", completed: countCompleted("combos"), total: comboGroups.length },
    { unit: "第三单元", label: "词形输入", completed: countCompleted("vocab"), total: vocabGroups.length },
    { unit: "第四单元", label: "强化训练", completed: countCompleted("practice"), total: practiceGroups.length }
  ];
}

function totalLearningProgress() {
  const summaries = unitProgressSummaries();
  const completed = summaries.reduce((sum, item) => sum + item.completed, 0);
  const total = summaries.reduce((sum, item) => sum + item.total, 0);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { summaries, completed, total, percent };
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

function renderLetterLoopCard(groupId = state.selectedGroupId) {
  const summary = letterLoopProgress(groupId);

  return `
    <article class="card loop-card">
      <div class="section-row">
        <div>
          <p class="caption">学习闭环</p>
          <h2 class="section-title">${summary.completed ? "闭环完成" : "按顺序走完一轮"}</h2>
        </div>
        <span class="step-state">${summary.completeCount} / ${summary.total}</span>
      </div>
      <div class="chip-row unit-goal-points">
        ${letterLoopSteps
          .map(
            (step) => `
              <span class="chip ${summary.progress[step.id] ? "done" : ""}">
                ${summary.progress[step.id] ? "✓ " : ""}${step.label}
              </span>
            `
          )
          .join("")}
      </div>
    </article>
  `;
}

function upsertMistake(mistake) {
  const key = `${mistake.kind}:${mistake.targetId}`;
  const existingIndex = state.mistakes.findIndex((item) => item.key === key);
  const nextMistake = {
    ...mistake,
    key,
    attempts: existingIndex >= 0 ? state.mistakes[existingIndex].attempts + 1 : 1
  };

  if (existingIndex >= 0) {
    state.mistakes.splice(existingIndex, 1, nextMistake);
  } else {
    state.mistakes.unshift(nextMistake);
  }

  state.mistakes = state.mistakes.slice(0, 24);
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
    note: picked ? `目标是 ${target.letter}，你选了 ${picked.letter}` : `需要复习 ${target.letter}`,
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
    return `目标是 ${target.letter}，线索是 ${target.cue}。`;
  }

  return `目标是 ${target.letter}：${target.cue}；你选了 ${picked.letter}：${picked.cue}。先看点在上方还是下方，再看点数。`;
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
          <h2 class="section-title"><span class="uyghur">${value}</span></h2>
        </div>
        <span class="step-state">${comparisonItems.length} 项</span>
      </div>
      <div class="writing-example-grid">
        ${comparisonItems
          .map(
            (item) => `
              <div class="writing-example">
                <span>${item.label}</span>
                <strong class="uyghur">${item.value}</strong>
              </div>
            `
          )
          .join("")}
      </div>
    </article>
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

function currentUnitExperience(unitId = currentUnit().id) {
  return unitExperience[unitId] || unitExperience.letters;
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

function renderAudioStrip({ audio, label, title, hint }) {
  return `
    <div class="audio-strip">
      <button
        class="play-dot"
        data-action="play-audio"
        data-audio-src="${audio ? audio.outputPath : ""}"
        data-audio-label="${label}"
        type="button"
        aria-label="播放发音"
      >听</button>
      <div>
        <strong>${title}</strong>
        <p class="caption">${audio ? `${audio.statusLabel}：${audio.file}。` : ""}${hint}</p>
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

  return `
    <article class="card next-action-card">
      <p class="caption">下一步建议</p>
      <div class="action-grid">
        <button class="secondary-button" data-action="go" data-target="${experience.reviewTarget}" type="button">
          ${experience.reviewLabel}
        </button>
        <button
          class="${primaryClass}"
          data-action="${nextUnit && unitId !== "practice" ? "open-unit" : "go"}"
          data-id="${nextUnit && unitId !== "practice" ? nextUnit.id : ""}"
          data-target="${unitId === "practice" ? "learn" : "unit"}"
          type="button"
        >
          ${experience.nextLabel}
        </button>
      </div>
    </article>
  `;
}

function render() {
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
    comboKeyboard: renderComboKeyboard,
    comboComplete: renderComboComplete,
    vocab: renderVocabLesson,
    vocabRecognition: renderVocabRecognition,
    vocabKeyboard: renderVocabKeyboard,
    vocabComplete: renderVocabComplete,
    practiceSession: renderPracticeSession,
    practiceComplete: renderPracticeComplete,
    review: renderReviewDashboard,
    library: renderLibrary,
    profile: renderProfile
  };

  const screenRenderer = screens[state.screen] || renderHome;
  app.innerHTML = screenRenderer();
  saveLocalProgress();
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
    ["learn", "学习", iconBook()],
    ["writing", "书写", iconPen()],
    ["library", "字母", iconLibrary()],
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

function renderWelcome() {
  return `
    <div class="hero view without-nav">
      <div>
        <img class="hero-logo" src="./assets/logo.png" alt="Ana Tilim logo" />
        <h1>Ana Tilim</h1>
        <div class="uyghur uyghur-title">ئانا تىلىم</div>
        <p class="hero-copy">
          从字母、发音、书写到键盘输入，一步一步学会自己的母语。
        </p>
        <button class="primary-button" data-action="go" data-target="home" type="button">
          开始学习
        </button>
      </div>
    </div>
  `;
}

function renderHome() {
  const counts = reviewCounts();
  const currentRecommendation = currentUnitExperience("practice");
  const progress = totalLearningProgress();
  const hasMistakes = state.mistakes.length > 0;
  const nextAction = hasMistakes
    ? {
        title: "先复习本轮错题",
        detail: `需要复习 ${state.mistakes.length} 个`,
        button: "继续错题复习",
        action: "open-practice-group",
        id: "review-loop",
        target: ""
      }
    : {
        title: "继续把四个单元串成一条复习线",
        detail: currentRecommendation.recommended,
        button: "继续学习",
        action: "go",
        id: "",
        target: "writing"
      };

  return screen(
    `
      ${topBar("早上好", "今天继续 8 分钟就很好")}

      <section class="stack wide-gap">
        <article class="card next-action-card">
          <p class="caption">今日下一步</p>
          <h2 class="section-title">${nextAction.title}</h2>
          <p class="muted">${nextAction.detail}</p>
          <div class="mini-unit-row">
            ${learningUnits
              .map((unit) => {
                const [unitName, unitTopic] = unit.title.split("：");
                return `<span><strong>${unitName}</strong><small> · ${unitTopic}</small></span>`;
              })
              .join("")}
          </div>
          <p class="caption">音频提醒：全部可听内容已接入 AI 临时音频路径；真人音频仍待录制。</p>
        </article>

        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">今日进度</p>
              <h2 class="section-title">第四单元 · 听说与书写</h2>
            </div>
            <span class="step-state">进行中</span>
          </div>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-fill" style="--value: ${progress.percent}%"></div>
          </div>
          <p class="caption">不加新词，先把字母、组合和候选词形放进听音、跟读、书写和复习闭环。</p>
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

        ${renderLearningMap(progress.summaries)}

        <div class="metric-grid" aria-label="今日学习概览">
          <div class="metric"><strong>${progress.completed} / ${progress.total}</strong><span>总进度</span></div>
          <div class="metric"><strong>${state.mistakes.length}</strong><span>本地错题</span></div>
          <div class="metric"><strong>${counts.pending}</strong><span>待审校</span></div>
        </div>

        <section>
          <div class="section-row">
            <h2 class="section-title">快速入口</h2>
            <button class="ghost-button" data-action="toast" type="button">设置目标</button>
          </div>
          <div class="quick-grid">
            <button class="quick-button" data-action="go" data-target="writing" type="button">
              <strong>练习听、说、写</strong><span> · 第四单元</span>
            </button>
            <button class="quick-button" data-action="open-practice-group" data-id="listening-loop" type="button">
              <strong>听音辨认</strong><span> · AI 临时</span>
            </button>
            <button class="quick-button" data-action="open-practice-group" data-id="repeat-loop" type="button">
              <strong>跟读练习</strong><span> · 先点完成</span>
            </button>
            <button class="quick-button" data-action="open-practice-group" data-id="writing-loop" type="button">
              <strong>书写输入</strong><span> · 描摹、键盘</span>
            </button>
            <button class="quick-button" data-action="open-practice-group" data-id="review-loop" type="button">
              <strong>继续错题复习</strong><span> · 本地记录</span>
            </button>
            <button class="quick-button" data-action="set-app-mode" data-mode="audit" data-target="review" type="button">
              <strong>审校看板</strong><span> · 回填状态</span>
            </button>
            <button class="quick-button" data-action="go" data-target="profile" type="button">
              <strong>项目状态</strong><span> · 我的页面</span>
            </button>
          </div>
        </section>
      </section>
    `,
    "home"
  );
}

function renderLearnPath() {
  return screen(
    `
      ${topBar("学习单元", "先认识字母，再进入组合、词组")}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">完整阶段</p>
              <h2 class="screen-title">${alphabetLetters.length} 个字母</h2>
            </div>
            <span class="step-state">待审校</span>
          </div>
          <p class="muted">Ana Tilim 按截图顺序展示字母，学习时把相似字母放在一起。第二单元开始加入组合、词组。</p>
          <div class="alphabet-strip" aria-label="完整字母目录">
            ${alphabetLetters
              .map(
                (item, index) => `
                  <span class="letter-pill ${["ب", "پ", "ت", "ن"].includes(item.letter) ? "active" : ""}">
                    <span class="uyghur">${item.letter}</span>
                    <small>${item.latin}</small>
                  </span>
                `
              )
              .join("")}
          </div>
        </article>

        <div class="path-list">
          ${learningUnits
            .map(
              (unit, index) => `
                <button class="lesson-step" data-action="open-unit" data-id="${unit.id}" type="button">
                  <span class="step-number">${index + 1}</span>
                  <span>
                    <strong>${unit.title}</strong>
                    <span class="caption">${unit.subtitle}</span>
                    <span class="caption">${currentUnitExperience(unit.id).steps.join("、")}</span>
                  </span>
                  <span class="step-state">${unit.status}</span>
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
          <span class="uyghur">${letter}</span>
          ${latin ? `<small>${latin}</small>` : ""}
        </span>
      `;
    })
    .join("");
}

function renderGroupCard(group) {
  const action = group.kind === "practice" ? "open-practice-group" : group.kind === "vocab" ? "open-vocab-group" : group.kind === "combo" ? "open-combo-group" : "open-group";
  const cardContent = `
    <div class="section-row">
      <strong>${group.title}</strong>
      <span class="step-state">${group.status}</span>
    </div>
    <p class="caption">${group.goal}</p>
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

function renderUnitDetail() {
  const unit = currentUnit();

  return screen(
    `
      ${topBar(
        unit.title,
        unit.subtitle,
        "",
        `<button class="back-button" data-action="go" data-target="learn" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">单元目标</p>
              <h2 class="section-title unit-goal-text">${unit.description}</h2>
            </div>
            <span class="step-state">${unit.status}</span>
          </div>
          <div class="chip-row unit-goal-points">
            ${unit.bullets.map((point) => `<span class="chip">${point}</span>`).join("")}
          </div>
        </article>

        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">学习步骤</p>
              <h2 class="section-title">按这个顺序走，不用一次学完</h2>
            </div>
            <span class="step-state">${unit.groups.length} 组</span>
          </div>
          ${renderStepList(unit.id)}
        </article>

        <div class="path-list">
          ${unit.groups.map((group) => renderGroupCard(group)).join("")}
        </div>

        <button class="primary-button" data-action="go" data-target="${unit.actionTarget}" type="button">
          进入当前学习
        </button>
        ${renderUnitNextActions(unit.id)}
      </section>
    `,
    "learn"
  );
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
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">本组目标</p>
              <h2 class="section-title unit-goal-text">${group.goal}</h2>
            </div>
            <span class="step-state">${group.status}</span>
          </div>
          <div class="chip-row unit-goal-points">
            <span class="chip">先认整体形状</span>
            <span class="chip">再看点位和点数</span>
            <span class="chip">比较四种写法</span>
            <span class="chip">只练单个字母</span>
          </div>
        </article>

        ${renderLetterLoopCard(group.id)}

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
                  <span class="uyghur">${item.letter}</span>
                  <small>${item.latin}</small>
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
          <div>
            <div class="uyghur letter-big">${letter.letter}</div>
            <p class="caption">${letter.type}，${letter.latin}</p>
          </div>
        </div>
        ${renderAudioStrip({
          audio,
          label: letter.letter,
          title: "发音提示",
          hint: letter.soundHint
        })}
        <div class="form-grid">
          ${letter.forms
            .map(
              (form) => `
                <div class="form-cell">
                  <span>${form.label}</span>
                  <strong class="uyghur">${form.value}</strong>
                </div>
              `
            )
            .join("")}
        </div>
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
        <article class="card">
          <p class="caption">点位对比</p>
          <div class="section-row">
            <strong class="uyghur word-big">${letter.letter}</strong>
            <div>
              <strong>先认字母，不急着学词组</strong>
              <p class="caption">${letter.example}</p>
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
              <h2 class="section-title">描摹 <span class="uyghur">${letter.letter}</span></h2>
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
        <div class="drawing-pad ${state.showGuide ? "" : "hide-guide"}" aria-label="书写画布示意">
          <span class="uyghur guide">${letter.letter}</span>
          <span class="stroke-line" aria-hidden="true"></span>
        </div>
        ${renderWritingComparison({
          value: letter.letter,
          parts: [letter.letter],
          forms: letter.forms
        })}
        <div class="tool-row">
          <button class="secondary-button" data-action="toast" type="button">撤销</button>
          <button class="secondary-button" data-action="toast" type="button">清除</button>
          <button class="secondary-button" data-action="toast" type="button">重做</button>
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
                  <span class="choice-art uyghur">${choice.letter}</span>
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
                  ? `答对了。${letter.letter} 的关键是 ${letter.cue}。`
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
        <div class="audio-strip">
          <button
            class="play-dot"
            data-action="play-audio"
            data-audio-src="${audio ? audio.outputPath : ""}"
            data-audio-label="${letter.letter}"
            type="button"
            aria-label="播放发音"
          >听</button>
          <div>
            <strong>播放：${letter.latin}</strong>
            <p class="caption">${audio ? `${audio.statusLabel}。` : ""}${letter.soundHint}</p>
          </div>
        </div>
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
                  <span class="choice-art uyghur">${choice.letter}</span>
                  <span>
                    <strong class="uyghur">${choice.letter}</strong>
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
            目标 ${letter.letter}，找出：${target.cue}
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
                  <span class="choice-art uyghur">${choice.letter}</span>
                  <span>
                    <strong>${choice.cue}</strong>
                    <span class="caption">${choice.type}，${choice.latin}</span>
                  </span>
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
                  ? `找对了：${target.letter} 是 ${target.cue}。`
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
        ${renderAudioStrip({
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
                  class="choice-card ${resultClass}"
                  data-action="pick-letter-sound"
                  data-id="${choice.id}"
                  type="button"
                >
                  <span class="choice-art uyghur">${choice.letter}</span>
                  <span>
                    <strong>${choice.latin}</strong>
                    <span class="caption">${choice.cue}</span>
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
                  ? `选对了：${letter.letter} 对应 ${letter.latin}。`
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
            <strong class="uyghur">${letter.letter}</strong>
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
                  ${item.letter}
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
                  ? "输入正确。你已经完成这条学习闭环。"
                  : `继续输入，目标字母是 ${letter.letter}。`
              }</div>`
            : `<div class="feedback">提示：点击 <span class="uyghur">${letter.letter}</span>。</div>`
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
  const groupLetters = group.letters.map((item) => item.letter).join(" / ");
  const loop = letterLoopProgress(group.id);
  const groupMistakes = state.mistakes.filter((item) => item.kind === "letter" && group.letters.some((letterItem) => letterItem.id === item.targetId)).length;

  return screen(
    `
      ${topBar("课程完成", "第一条学习闭环走通了")}
      <section class="stack">
        ${renderLetterLoopCard(group.id)}
        <article class="card">
          <p class="caption">本次学会</p>
          <h2 class="screen-title">
            <span class="uyghur">${groupLetters}</span>
          </h2>
          <p class="muted">你看了当前相似组字母、描摹了 ${letter.letter}、完成辨认，并用键盘输入了 ${letter.letter}。</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>${group.letters.length}</strong><span>字母</span></div>
          <div class="metric"><strong>${loop.completeCount} / ${loop.total}</strong><span>闭环</span></div>
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
          <small>${item.latin}</small>
        </button>
      `
    )
    .join("");
}

function renderComboParts(item) {
  return item.parts
    .map(
      (part, index) => `
        <span class="combo-part">
          <strong class="uyghur">${part}</strong>
          <small>${index + 1}</small>
        </span>
      `
    )
    .join("");
}

function renderComboLesson() {
  const group = currentComboGroup();
  const item = currentComboItem();
  const audio = currentComboAudio();
  const position = itemPosition(currentComboItems(), item.id);

  return screen(
    `
      ${topBar(
        group.title,
        "第二单元：组合与词组入门",
        "",
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">本组目标</p>
              <h2 class="section-title unit-goal-text">${group.goal}</h2>
            </div>
            <span class="step-state">${group.status}</span>
          </div>
          <div class="chip-row unit-goal-points">
            <span class="chip">从右往左读</span>
            <span class="chip">先拆开再合上</span>
            <span class="chip">只少量词形预览</span>
            <span class="chip">词义待审校</span>
          </div>
        </article>

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
          <div>
            <div class="uyghur letter-big combo-big">${item.value}</div>
            <p class="caption">${item.type}，${item.latin}</p>
          </div>
        </div>

        ${renderAudioStrip({
          audio,
          label: item.value,
          title: `播放：${item.latin}`,
          hint: "组合发音仍需母语者审听。"
        })}

        <article class="card">
          <p class="caption">拆开看</p>
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
                <p class="muted">${item.review}</p>
              </article>`
            : ""
        }

        <article class="card">
          <p class="caption">学习小点</p>
          <div class="lesson-point-list">
            <div class="lesson-point">
              <strong>怎么读</strong>
              <span>先用 ${item.latin} 做过渡提示，正式发音以后接真人音频。</span>
            </div>
            <div class="lesson-point">
              <strong>怎么看</strong>
              <span>${item.hint}</span>
            </div>
            ${
              isAuditMode()
                ? `<div class="lesson-point">
                    <strong>审校状态</strong>
                    <span>${item.review}</span>
                  </div>`
                : ""
            }
          </div>
        </article>

        <div class="action-grid">
          <button class="secondary-button" data-action="go" data-target="comboRecognition" type="button">
            辨认
          </button>
          <button class="secondary-button" data-action="go" data-target="comboBuild" type="button">
            拼接
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
  const prompt = item.meaning
    ? isAuditMode()
      ? `请选择 ${item.latin} 的词形（${item.meaning}：待审校）`
      : `请选择 ${item.latin} 的词形`
    : `哪一个读作 ${item.prompt}？`;

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
                    <span class="caption">${choice.meaning && isAuditMode() ? `${choice.meaning}，待审校` : choice.type}</span>
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
  const item = currentComboItem();
  const groupValues = group.items.map((choice) => choice.value).join(" / ");

  return screen(
    `
      ${topBar("第二单元完成", group.title)}
      <section class="stack">
        <article class="card">
          <p class="caption">本次练习</p>
          <h2 class="screen-title">
            <span class="uyghur">${groupValues}</span>
          </h2>
          <p class="muted">你拆分并输入了 ${item.value}。如果这一组有词义，它仍然需要母语者审校后才能进入正式考核。</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>${group.items.length}</strong><span>组合</span></div>
          <div class="metric"><strong>1</strong><span>输入</span></div>
          <div class="metric"><strong>审校</strong><span>词义</span></div>
        </div>
        ${renderUnitNextActions("combos")}
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
          <small>${item.latin}</small>
        </button>
      `
    )
    .join("");
}

function renderAuditRows(item) {
  const rows = [
    ["审校状态", item.reviewStatus],
    ["标准主词", item.standardNote],
    ["变体备注", item.variantNote],
    ["可接受答案", item.acceptableAnswer],
    ["考核方式", item.testPolicy],
    ["来源备注", item.sourceNote]
  ];

  return rows
    .map(
      ([label, value]) => `
        <div class="audit-row">
          <strong>${label}</strong>
          <span>${value}</span>
        </div>
      `
    )
    .join("");
}

function renderVocabLesson() {
  const group = currentVocabGroup();
  const item = currentVocabItem();
  const audio = currentVocabAudio();
  const longWordClass = item.value.length > 8 ? "long-text" : "";
  const position = itemPosition(currentVocabItems(), item.id);

  return screen(
    `
      ${topBar(
        group.title,
        "第三单元：基础词组与主题词",
        modeActionButton(),
        `<button class="back-button" data-action="go" data-target="unit" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card ${isAuditMode() ? "review-card" : ""}">
          <div class="section-row">
            <div>
              <p class="caption">${isAuditMode() ? "审校优先" : "词形学习"}</p>
              <h2 class="section-title unit-goal-text">${group.goal}</h2>
            </div>
            <span class="step-state">${group.status}</span>
          </div>
          <p class="muted">${
            isAuditMode()
              ? "本单元先练词形和输入，中文含义只是预览。正式答案要等母语者审校后再锁定。"
              : "先把词形看熟、听熟、输入熟。中文只做帮助理解，不急着背标准答案。"
          }</p>
        </article>

        <div class="alphabet-strip compact">
          ${renderVocabSelector(group.items, item.id)}
        </div>

        ${renderItemProgress(position.label, "当前词形在本主题的位置")}
        ${renderAdjacentNav({
          previous: position.previous,
          next: position.next,
          action: "select-adjacent-vocab"
        })}

        <div class="letter-focus">
          <div>
            <div class="uyghur letter-big vocab-big ${longWordClass}">${item.value}</div>
            <p class="caption">${item.theme}，${item.latin}</p>
          </div>
        </div>

        ${renderAudioStrip({
          audio,
          label: item.value,
          title: `播放：${item.latin}`,
          hint: "词形发音仍需母语者审听。"
        })}

        <article class="card">
          <p class="caption">中文预览</p>
          <h2 class="section-title">${item.meaning}</h2>
          <p class="muted">${item.tip} 现阶段只练词形，不设唯一答案。</p>
        </article>

        <article class="card">
          <p class="caption">拆开看</p>
          <div class="combo-parts" aria-label="词形拆分">
            ${renderComboParts(item)}
          </div>
        </article>

        ${
          isAuditMode()
            ? `<article class="card">
                <p class="caption">词库审校字段</p>
                <div class="audit-grid">
                  ${renderAuditRows(item)}
                </div>
              </article>`
            : ""
        }

        <div class="action-grid">
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
  const choices = currentVocabItems();
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
        <article class="card ${isAuditMode() ? "review-card" : ""}">
          <p class="caption">选择正确词形</p>
          <h2 class="section-title">请选择 ${item.latin} 的词形</h2>
          <p class="muted">${
            isAuditMode()
              ? `中文预览：${item.meaning}。${item.reviewStatus}，本题只确认词形。`
              : `中文预览：${item.meaning}。本题只确认词形。`
          }</p>
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
                    <span class="caption">${isAuditMode() ? `${choice.meaning}，${choice.reviewStatus}` : choice.meaning}</span>
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
                  ? `答对了。这里确认的是 ${item.value} 的词形，不是最终词义审校。`
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
        <article class="card ${isAuditMode() ? "review-card" : ""}">
          <p class="caption">请输入这个词形</p>
          <div class="section-row">
            <strong class="uyghur">${item.value}</strong>
            <span class="caption">${isAuditMode() ? item.reviewStatus : item.latin}</span>
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
  const groupValues = group.items.map((choice) => choice.value).join(" / ");

  return screen(
    `
      ${topBar("第三单元完成", group.title)}
      <section class="stack">
        <article class="card review-card">
          <p class="caption">本次练习</p>
          <h2 class="screen-title">
            <span class="uyghur">${groupValues}</span>
          </h2>
          <p class="muted">你辨认并输入了 ${item.value}。这个单元仍是审校前词库，后续要由母语者确认标准主词、变体和可考答案。</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>${group.items.length}</strong><span>词形</span></div>
          <div class="metric"><strong>1</strong><span>输入</span></div>
          <div class="metric"><strong>审校</strong><span>含义</span></div>
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

function renderPracticeModeCard(group, item) {
  if (group.mode === "listen") {
    return `
      <article class="card practice-mode-card">
        <p class="caption">听音流程</p>
        <p class="muted">${item.hint}</p>
      </article>
      ${renderPracticeChoices(group, item)}
    `;
  }

  if (group.mode === "repeat") {
    return `
      <article class="card practice-mode-card">
        <p class="caption">跟读步骤</p>
        <div class="lesson-point-list">
          <div class="lesson-point"><strong>看词形</strong><span class="uyghur">${item.value}</span></div>
          <div class="lesson-point"><strong>看提示</strong><span>${item.latin}，${item.hint}</span></div>
          <div class="lesson-point"><strong>轻声跟读</strong><span>${item.audioStatus}，正式版会替换成真人音频。</span></div>
        </div>
      </article>
      <button class="primary-button" data-action="mark-repeat" type="button">
        我已跟读
      </button>
      <div class="feedback ${state.practiceSpoken ? "good" : ""}">
        ${state.practiceSpoken ? "已记录本轮跟读。现在可以查看结果。" : "跟读不评分，先建立练习习惯。"}
      </div>
    `;
  }

  if (group.mode === "write") {
    const keyboardParts = item.parts;
    const inputKeys = [item.value, ...item.parts].filter((key, index, keys) => key && keys.indexOf(key) === index);
    const isCorrect = state.keyboardValue === item.value;
    const hasInput = state.keyboardValue.length > 0;

    return `
      <article class="card practice-mode-card">
        <p class="caption">先描摹，再输入</p>
        <div class="practice-drawing-pad ${state.showGuide ? "" : "hide-guide"}" aria-label="第四单元书写画布示意">
          <span class="uyghur guide">${item.value}</span>
        </div>
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
      ${renderWritingComparison({
        value: item.value,
        parts: item.parts
      })}
      <input
        class="rtl-input uyghur"
        value="${state.keyboardValue}"
        aria-label="第四单元维吾尔语输入框"
        readonly
        dir="rtl"
      />
      ${renderWritingSelfCheck()}
      ${renderKeyboardGuide(keyboardParts, item.value)}
      <div class="practice-key-row" aria-label="当前复习项快捷键">
        ${inputKeys
          .map(
            (key) => `
              <button class="key-button uyghur ${guidedKeyClass(key, keyboardParts, item.value)}" data-action="key" data-key="${key}" type="button">
                ${key}
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
              isCorrect ? "输入正确。本轮书写和键盘练习完成。" : `继续输入，目标是 ${item.value}。`
            }</div>`
          : `<div class="feedback">提示：可以先点完整词形 <span class="uyghur">${item.value}</span>，再逐步练拆分键。</div>`
      }
    `;
  }

  const reviewItems = mistakeReviewItems();
  const hasMistakes = reviewItems.length > 0;
  const items = hasMistakes ? reviewItems : group.items;

  return `
    <article class="card practice-mode-card">
      <p class="caption">${hasMistakes ? "本轮错题" : "本组复习卡"}</p>
      <div class="practice-review-list">
        ${items
          .map(
            (choice) => `
              <button
                class="practice-review-item ${choice.id === item.id ? "active" : ""}"
                data-action="${hasMistakes ? "toast" : "select-practice"}"
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
    <div class="feedback">${
      hasMistakes
        ? "这些错题已保存在本地，之后可以继续按错题频率安排复习。"
        : "答错的字母、组合和词形会自动进入这里。"
    }</div>
  `;
}

function renderPracticeHub() {
  return screen(
    `
      ${topBar("听说与书写强化", "第四单元：复习闭环")}
      <section class="stack">
        <article class="card review-card">
          <div class="section-row">
            <div>
              <p class="caption">本单元原则</p>
              <h2 class="section-title unit-goal-text">不加新词，只复习第一到三单元已经出现过的内容。</h2>
            </div>
            <span class="step-state">进行中</span>
          </div>
          <p class="muted">真实音频还没录制，所以听音和跟读先做流程；第三单元词义继续保持待母语者审校。</p>
        </article>

        <div class="metric-grid" aria-label="第四单元概览">
          <div class="metric"><strong>${practiceGroups.length}</strong><span>训练组</span></div>
          <div class="metric"><strong>${allPracticeItems().length}</strong><span>复习项</span></div>
          <div class="metric"><strong>${state.mistakes.length}</strong><span>本地错题</span></div>
        </div>

        <div class="path-list">
          ${practiceGroups.map((group) => renderGroupCard(group)).join("")}
        </div>

        <button class="secondary-button" data-action="go" data-target="learn" type="button">
          查看学习路径
        </button>
      </section>
    `,
    "writing"
  );
}

function renderPracticeSession() {
  const group = currentPracticeGroup();
  const dynamicReviewItems = group.mode === "review" ? mistakeReviewItems() : [];
  const item = dynamicReviewItems[0] || currentPracticeItem();
  const audio = item.audio || currentPracticeAudio();
  const longWordClass = item.value.length > 6 ? "long-text" : "";

  return screen(
    `
      ${topBar(
        group.title,
        "第四单元：听说与书写强化",
        "",
        `<button class="back-button" data-action="go" data-target="writing" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card">
          <div class="section-row">
            <div>
              <p class="caption">${item.label}</p>
              <h2 class="section-title unit-goal-text">${group.goal}</h2>
            </div>
            <span class="step-state">${group.status}</span>
          </div>
        </article>

        ${
          dynamicReviewItems.length
            ? ""
            : `<div class="alphabet-strip compact">
                ${renderPracticeSelector(group.items, item.id)}
              </div>`
        }

        <div class="letter-focus practice-target-card">
          <div>
            <div class="uyghur letter-big practice-big ${longWordClass}">${item.value}</div>
            <p class="caption">${item.type}，${item.latin}</p>
          </div>
        </div>

        ${renderAudioStrip({
          audio,
          label: item.value,
          title: `播放：${item.latin}`,
          hint: "第四单元使用 AI 临时音频测试听说流程，正式版仍需真人音频。"
        })}

        ${renderPracticeModeCard(group, item)}

        <div class="action-grid">
          <button class="secondary-button" data-action="go" data-target="writing" type="button">
            练习中心
          </button>
          <button class="primary-button" data-action="go" data-target="practiceComplete" type="button">
            查看结果
          </button>
        </div>
      </section>
    `,
    "writing"
  );
}

function renderPracticeComplete() {
  const group = currentPracticeGroup();
  const item = currentPracticeItem();
  const listened = group.mode === "listen" ? (state.selectedListening === item.id ? "已辨认" : "未选择") : "可选";
  const repeated = group.mode === "repeat" ? (state.practiceSpoken ? "已跟读" : "未跟读") : "可选";
  const typed = group.mode === "write" ? (state.keyboardValue === item.value ? "已输入" : "未完成") : "可选";

  return screen(
    `
      ${topBar("复习结果", group.title)}
      <section class="stack">
        <article class="card review-card">
          <p class="caption">本轮目标</p>
          <h2 class="screen-title"><span class="uyghur">${item.value}</span></h2>
          <p class="muted">本页只记录练习流程，不确认第三单元词义是否最终正确。</p>
        </article>
        <div class="metric-grid">
          <div class="metric"><strong>${group.items.length}</strong><span>本组项目</span></div>
          <div class="metric"><strong>AI</strong><span>临时音频</span></div>
          <div class="metric"><strong>${state.mistakes.length}</strong><span>本地错题</span></div>
        </div>
        <article class="card">
          <p class="caption">练习记录</p>
          <div class="audit-grid">
            <div class="audit-row"><strong>听音</strong><span>${listened}</span></div>
            <div class="audit-row"><strong>跟读</strong><span>${repeated}</span></div>
            <div class="audit-row"><strong>键盘</strong><span>${typed}</span></div>
            <div class="audit-row"><strong>备注</strong><span>${item.audioStatus}；正式版会替换为审听后的真人音频。</span></div>
          </div>
        </article>
        ${renderUnitNextActions("practice")}
      </section>
    `,
    "writing"
  );
}

function renderReviewStatusBadge(statusId) {
  const status = reviewStatusById(statusId);
  return `<span class="review-badge ${status.tone}">${status.label}</span>`;
}

function renderReviewDashboard() {
  if (!isAuditMode()) {
    return screen(
      `
        ${topBar(
          "审校看板",
          "回填、音频、重点项",
          "",
          `<button class="back-button" data-action="go" data-target="home" type="button" aria-label="返回">←</button>`
        )}
        <section class="stack">
          <article class="card">
            <div class="section-row">
              <div>
                <p class="caption">学习模式</p>
                <h2 class="section-title unit-goal-text">审校字段已隐藏，避免打断正常学习。</h2>
              </div>
              <span class="step-state">学习</span>
            </div>
            <p class="muted">进入审校模式后，才会显示词库回填、音频状态和重点项筛选。</p>
          </article>
          <button class="primary-button" data-action="set-app-mode" data-mode="audit" data-target="review" type="button">
            进入审校模式
          </button>
        </section>
      `,
      "profile"
    );
  }

  const counts = reviewCounts();
  const selected = currentReviewItem();
  const filtered = filteredReviewItems();
  const selectedStatus = reviewStatusById(selected.reviewStatus);
  const selectedAudio = audioStatusById(selected.audioStatus);

  return screen(
    `
      ${topBar(
        "审校看板",
        "回填、音频、重点项",
        modeActionButton("home"),
        `<button class="back-button" data-action="go" data-target="home" type="button" aria-label="返回">←</button>`
      )}
      <section class="stack">
        <article class="card review-card">
          <div class="section-row">
            <div>
              <p class="caption">本地回填流程</p>
              <h2 class="section-title unit-goal-text">先看哪些内容待审校，再把母语者反馈回填成统一状态。</h2>
            </div>
            <span class="step-state">草稿</span>
          </div>
          <p class="muted">这里的点击结果只保存在当前原型状态里。正式回填仍然要同步到审校表和课程文件。</p>
        </article>

        <div class="metric-grid review-metrics" aria-label="审校概览">
          <div class="metric"><strong>${counts.pending}</strong><span>待审校</span></div>
          <div class="metric"><strong>${counts.needsEdit}</strong><span>需修改</span></div>
          <div class="metric"><strong>${counts.family}</strong><span>家庭重点</span></div>
          <div class="metric"><strong>${counts.aiTemp}</strong><span>AI 临时</span></div>
          <div class="metric"><strong>${counts.audioPending}</strong><span>音频待录</span></div>
          <div class="metric"><strong>${counts.needsRerecord}</strong><span>需重录</span></div>
        </div>

        <div class="review-filter-row" aria-label="审校筛选">
          ${reviewFilters
            .map(
              (filter) => `
                <button
                  class="review-filter ${state.reviewFilter === filter.id ? "active" : ""}"
                  data-action="set-review-filter"
                  data-id="${filter.id}"
                  type="button"
                >
                  ${filter.label}
                </button>
              `
            )
            .join("")}
        </div>

        <article class="card ${selected.priority ? "priority-review-card" : ""}">
          <div class="section-row">
            <div>
              <p class="caption">${selected.unit}，${selected.kind}，${selected.theme}</p>
              <h2 class="screen-title review-word"><span class="uyghur">${selected.value}</span></h2>
              <p class="caption">${selected.latin}，${selected.meaning}</p>
            </div>
            ${renderReviewStatusBadge(selected.reviewStatus)}
          </div>
          <div class="audit-grid">
            <div class="audit-row"><strong>审校问题</strong><span>${selected.question}</span></div>
            <div class="audit-row"><strong>考核方式</strong><span>${selected.examPolicy}</span></div>
            <div class="audit-row"><strong>音频状态</strong><span>${selectedAudio.label}</span></div>
            <div class="audit-row"><strong>重点标记</strong><span>${selected.priority ? "家庭、基础称呼重点项：不设唯一答案" : "普通审校项"}</span></div>
          </div>
        </article>

        <article class="card">
          <p class="caption">回填审校结果</p>
          <div class="status-control-grid">
            ${reviewStatusOptions
              .map(
                (status) => `
                  <button
                    class="status-control ${selected.reviewStatus === status.id ? "active" : ""} ${status.tone}"
                    data-action="apply-review-status"
                    data-id="${status.id}"
                    type="button"
                  >
                    ${status.label}
                  </button>
                `
              )
              .join("")}
          </div>
        </article>

        <article class="card">
          <p class="caption">回填音频状态</p>
          <div class="status-control-grid audio-controls">
            ${audioStatusOptions
              .map(
                (status) => `
                  <button
                    class="status-control ${selected.audioStatus === status.id ? "active" : ""}"
                    data-action="apply-audio-status"
                    data-id="${status.id}"
                    type="button"
                  >
                    ${status.label}
                  </button>
                `
              )
              .join("")}
          </div>
        </article>

        <section class="stack">
          <div class="section-row">
            <h2 class="section-title">审校项目</h2>
            <span class="caption">${filtered.length} / ${counts.total}</span>
          </div>
          <div class="review-item-list">
            ${filtered
              .map(
                (item) => `
                  <button
                    class="review-item ${item.id === selected.id ? "active" : ""} ${item.priority ? "priority" : ""}"
                    data-action="select-review-item"
                    data-id="${item.id}"
                    type="button"
                  >
                    <span class="uyghur">${item.value}</span>
                    <span>
                      <strong>${item.unit} · ${item.theme}</strong>
                      <small>${item.latin}，${item.meaning}</small>
                    </span>
                    ${renderReviewStatusBadge(item.reviewStatus)}
                  </button>
                `
              )
              .join("")}
          </div>
        </section>
      </section>
    `,
    "profile"
  );
}

function renderLibrary() {
  return screen(
    `
      ${topBar("字母库", "第一单元全部字母")}
      <section class="stack">
        ${allUnitOneLetters()
          .map(
            (letter) => `
              <div class="word-row">
                <span>
                  <strong class="uyghur">${letter.letter}</strong>
                  <span class="caption">${letter.type}，${letter.latin}，待审校</span>
                </span>
                <button
                  class="ghost-button"
                  data-action="select-letter"
                  data-id="${letter.id}"
                  data-target="letter"
                  type="button"
                >
                  学习
                </button>
              </div>
            `
          )
          .join("")}
      </section>
    `,
    "library"
  );
}

function renderProfile() {
  const counts = reviewCounts();
  const completedLetterGroups = Object.values(state.learningProgress.letters).filter((item) => item.completed).length;
  const completedPracticeGroups = Object.values(state.learningProgress.practice).filter((item) => item.completed).length;

  return screen(
    `
      ${topBar("我的", "本地学习记录", modeActionButton("profile"))}
      <section class="stack">
        <article class="card">
          <h2 class="section-title">Ana Tilim 学习者</h2>
          <p class="muted">第一版不需要登录，学习进度、错题和审校回填会保存在这台设备的浏览器里。</p>
        </article>
        <div class="profile-row"><strong>当前模式</strong><span>${isAuditMode() ? "审校" : "学习"}</span></div>
        <div class="profile-row"><strong>字母闭环</strong><span>${completedLetterGroups} / ${alphabetGroups.length}</span></div>
        <div class="profile-row"><strong>已开放组合</strong><span>${allComboItems().length}</span></div>
        <div class="profile-row"><strong>候选词库</strong><span>${allVocabItems().length}</span></div>
        <div class="profile-row"><strong>强化训练</strong><span>${completedPracticeGroups} / ${practiceGroups.length}</span></div>
        <div class="profile-row"><strong>本地错题</strong><span>${state.mistakes.length}</span></div>
        <div class="profile-row"><strong>待审校</strong><span>${counts.pending}</span></div>
        <div class="profile-row"><strong>AI 临时音频</strong><span>${counts.aiTemp}</span></div>
        <div class="profile-row"><strong>音频待录</strong><span>${counts.audioPending}</span></div>
        <div class="profile-row"><strong>下一步</strong><span>真人音频</span></div>
        <button
          class="primary-button"
          data-action="${isAuditMode() ? "go" : "set-app-mode"}"
          data-mode="audit"
          data-target="review"
          type="button"
        >审校看板</button>
        <button class="secondary-button" data-action="toast" type="button">学习提醒</button>
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

function playAudio(src, label) {
  if (!src) {
    showToast("这个字母还没有音频文件");
    return;
  }

  if (activeAudio && typeof activeAudio.pause === "function") {
    activeAudio.pause();
  }

  activeAudio = new Audio(src);
  activeAudio
    .play()
    .then(() => {
      showToast(`${label || "字母"}：AI 临时音频`);
    })
    .catch(() => {
      showToast("音频文件还没生成或浏览器暂时不能播放");
    });
}

function goTo(target) {
  state.screen = target;
  render();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.action;

  if (action === "set-app-mode") {
    state.appMode = button.dataset.mode === "audit" ? "audit" : "learn";
    if (button.dataset.target) {
      state.screen = button.dataset.target;
    }
    render();
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
        (group.mode === "write" && state.keyboardValue === item.value);

      if (completedPractice) {
        markProgress("practice", state.selectedPracticeGroupId, group.mode);
      }
    }

    if (target === "combo") {
      state.selectedUnitId = "combos";
    }
    if (target === "vocab") {
      state.selectedUnitId = "basic-phrases";
    }
    if (target === "writing") {
      state.selectedUnitId = "practice";
    }
    if (["picture", "listening", "keyboard", "letterOdd", "letterSound", "comboRecognition", "comboBuild", "comboKeyboard", "vocabRecognition", "vocabKeyboard", "letterWriting"].includes(target)) {
      resetPracticeState();
    }
    goTo(target);
    return;
  }

  if (action === "open-unit") {
    state.selectedUnitId = button.dataset.id;
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
    state.selectedUnitId = "combos";
    state.selectedComboGroupId = group.id;
    state.currentComboItemId = group.items[0].id;
    resetComboPracticeState();
    goTo("combo");
    return;
  }

  if (action === "open-vocab-group") {
    const group = vocabGroups.find((item) => item.id === button.dataset.id) || vocabGroups[0];
    state.selectedUnitId = "basic-phrases";
    state.selectedVocabGroupId = group.id;
    state.currentVocabItemId = group.items[0].id;
    resetVocabPracticeState();
    goTo("vocab");
    return;
  }

  if (action === "open-practice-group") {
    const group = practiceGroups.find((item) => item.id === button.dataset.id) || practiceGroups[0];
    state.selectedUnitId = "practice";
    state.selectedPracticeGroupId = group.id;
    state.currentPracticeItemId = group.items[0].id;
    resetPracticeSessionState();
    goTo("practiceSession");
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
    const target = currentPracticeItem();
    const picked = currentPracticeItems().find((choice) => choice.id === button.dataset.id);
    if (picked && picked.id === target.id) {
      markProgress("practice", state.selectedPracticeGroupId, "listen");
    } else if (picked) {
      recordItemMistake("practice", target, picked, "第四单元错题");
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

  if (action === "set-review-filter") {
    state.reviewFilter = button.dataset.id;
    const firstFilteredItem = filteredReviewItems()[0];
    if (firstFilteredItem) {
      state.selectedReviewItemId = firstFilteredItem.id;
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

  if (action === "select-review-item") {
    state.selectedReviewItemId = button.dataset.id;
    render();
    return;
  }

  if (action === "apply-review-status") {
    updateReviewItem(state.selectedReviewItemId, { reviewStatus: button.dataset.id });
    render();
    return;
  }

  if (action === "apply-audio-status") {
    updateReviewItem(state.selectedReviewItemId, { audioStatus: button.dataset.id });
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
    state.keyboardValue += button.dataset.key;
    markCurrentLetterKeyboardIfCorrect();
    if (state.screen === "comboKeyboard" && state.keyboardValue === currentComboItem().value) {
      markProgress("combos", state.selectedComboGroupId, "keyboard");
    }
    if (state.screen === "vocabKeyboard" && state.keyboardValue === currentVocabItem().value) {
      markProgress("vocab", state.selectedVocabGroupId, "keyboard");
    }
    if (state.screen === "practiceSession" && currentPracticeGroup().mode === "write" && state.keyboardValue === currentPracticeItem().value) {
      markProgress("practice", state.selectedPracticeGroupId, "write");
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
    render();
    return;
  }

  if (action === "toggle-favorite") {
    state.favorite = !state.favorite;
    render();
    showToast(state.favorite ? "已加入收藏" : "已取消收藏");
    return;
  }

  if (action === "play-audio") {
    playAudio(button.dataset.audioSrc, button.dataset.audioLabel);
    return;
  }

  if (action === "toast") {
    showToast("这个功能会在正式版加入");
  }
});

render();
