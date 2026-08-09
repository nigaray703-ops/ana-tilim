(() => {
  const REVIEWED_BY = "产品负责人验收标准 + 项目来源与数据校验";
  const REVIEWED_AT = "2026-08-09";

  const unit = {
    id: "syllable-training",
    name: "拼读与音节训练营",
    subtitle: "从两字母组合到短句分音节朗读",
    description: "先把两个字母稳定拼起来，再学习音节、连接与断开，最后回到完整短句。",
    bullets: ["两字母热身", "音节划分策略", "连接与断开", "短句拆分朗读"]
  };

  const sections = [
    { id: "two-letter-warmup", title: "两字母热身" },
    { id: "syllable-rules", title: "音节划分策略" },
    { id: "connection-errors", title: "连接与断开判断" },
    { id: "sentence-reading", title: "短句拆分朗读" }
  ];

  const twoLetterItems = [
    ["ba", "با", ["ب", "ا"], "ba", "human_combo_ba.webm"],
    ["pa", "پا", ["پ", "ا"], "pa", "human_combo_pa.webm"],
    ["ta", "تا", ["ت", "ا"], "ta", "human_combo_ta.webm"],
    ["na", "نا", ["ن", "ا"], "na", "human_combo_na.webm"],
    ["la", "لا", ["ل", "ا"], "la", "human_combo_la.webm"],
    ["ma", "ما", ["م", "ا"], "ma", "human_combo_ma.webm"],
    ["be-e", "بە", ["ب", "ە"], "be", "human_combo_be_e.webm"],
    ["pe-e", "پە", ["پ", "ە"], "pe", "human_combo_pe_e.webm"],
    ["te-e", "تە", ["ت", "ە"], "te", "human_combo_te_e.webm"],
    ["ne-e", "نە", ["ن", "ە"], "ne", "human_combo_ne_e.webm"]
  ].map(([sourceComboId, standard, parts, latin, audioFile]) => ({
    id: `warmup-${sourceComboId}`,
    sourceComboId,
    standard,
    parts,
    latin,
    audioPath: `./assets/audio/human/combos/${audioFile}`,
    reviewStatus: "approved"
  }));

  const rules = [
    {
      id: "vowel-nucleus",
      title: "先找元音中心",
      explanation: "学习时可先找每个读音小块中的元音，再看它前后有哪些辅音。这是帮助初学者找候选音节的方法，不能覆盖所有借词、缩合或语流变化。",
      scope: "入门范围：先在已验证的短组合和短句中寻找元音中心。",
      exercises: [
        ["vowel-nucleus-01", "با 有几个候选音节中心？", "1 个，中心是 ا。", "2 个。", "ba"],
        ["vowel-nucleus-02", "بە 有几个候选音节中心？", "1 个，中心是 ە。", "没有元音中心。", "be-e"],
        ["vowel-nucleus-03", "为 بۇ كىم؟ 选择候选拆分。", "بۇ | كىم؟", "ب | ۇكىم؟", "sentence-who-what-1"],
        ["vowel-nucleus-04", "为 بۇ قەلەم. 选择候选拆分。", "بۇ | قە-لەم.", "بۇ | قەل-ەم.", "sentence-this-that-1"]
      ]
    },
    {
      id: "single-consonant-boundary",
      title: "一个辅音时先尝试向后分",
      explanation: "当两个元音中心之间只有一个辅音时，可先尝试把该辅音放到后一个读音小块的开头。这是入门策略，不总是适用于所有词。",
      scope: "仅用于下列已核对例子，连写断点与音节边界需分开判断。",
      exercises: [
        ["single-consonant-boundary-01", "为 دادا 选择候选拆分。", "دا-دا", "داد-ا", "dada-connection"],
        ["single-consonant-boundary-02", "为 تۆگە 选择候选拆分。", "تۆ-گە", "تۆگ-ە", "toge-connection"],
        ["single-consonant-boundary-03", "为 ۋەتەن 选择候选拆分。", "ۋە-تەن", "ۋەت-ەن", "weten-connection"],
        ["single-consonant-boundary-04", "为句中 ئانا 选择候选拆分。", "ئا-نا", "ئان-ا", "sentence-like-need-4"]
      ]
    },
    {
      id: "two-consonant-boundary",
      title: "辅音群内部逐词判断",
      explanation: "当两个元音中心之间出现两个或更多辅音时，可先把边界候选放在辅音群内部。具体位置必须逐词核对，不能只按字符数量机械处理。",
      scope: "存在借词、词源和发音例外；ULY 的 sh 等双字符只代表一个维吾尔字母。",
      exercises: [
        ["two-consonant-boundary-01", "为句中 دوختۇر 选择候选拆分。", "دوخ-تۇر", "دو-ختۇر", "sentence-i-you-3"],
        ["two-consonant-boundary-02", "为句中 مەكتەپ 选择候选拆分。", "مەك-تەپ", "مە-كتەپ", "sentence-this-that-3"],
        ["two-consonant-boundary-03", "为句中 ياخشى 选择候选拆分。", "ياخ-شى", "يا-خشى", "sentence-like-need-4"],
        ["two-consonant-boundary-04", "为句中 دوستلۇق 选择候选拆分。", "دوست-لۇق", "دو-ستلۇق", "story-friend-5"]
      ]
    },
    {
      id: "suffix-boundary",
      title: "构词边界不等于音节边界",
      explanation: "学习者可以同时标出词干/后缀边界和读音音节边界，但两者不能自动视为完全相同。先看构词边界有助于理解词形，再按真实读音判断音节。",
      scope: "后缀边界不总是音节边界；下列只是受控入门例子。",
      exercises: [
        ["suffix-boundary-01", "分别标出 بازارغا 的候选构词和音节边界。", "بازار + غا；با-زار-غا", "只要见到后缀就等于一个音节。", "grammar-word-order-3"],
        ["suffix-boundary-02", "分别标出 كىتابمۇ 的候选构词和音节边界。", "كىتاب + مۇ；كى-تاب-مۇ", "把 مۇ 并入前一音节且不说明理由。", "grammar-yes-no-mu-1"],
        ["suffix-boundary-03", "分别标出 مەكتەپكە 的候选构词和音节边界。", "مەكتەپ + كە；مەك-تەپ-كە", "把构词边界当成唯一切分依据。", "story-my-day-4"],
        ["suffix-boundary-04", "比较 تىلىمنى 的两种候选边界。", "构词 تىل + ىم + نى；音节 تى-لىم-نى", "声称两种边界必须完全重合。", "sentence-like-need-4"]
      ]
    }
  ].map((rule) => ({
    ...rule,
    reviewStatus: "approved",
    exercises: rule.exercises.map(([id, prompt, answer, distractor, sourceId]) => ({
      id,
      prompt,
      answer,
      distractor,
      sourceId,
      reviewStatus: "approved"
    }))
  }));

  const connectionItems = [
    ["connection-01", "bal", "بال", "connection", "错误判断：ب 与 ا 之间应断开。", "开头 ب 与后面的 ا 连接；ا 后不继续连接 ل。"],
    ["connection-02", "man", "مان", "connection", "错误判断：م 与 ا 之间应断开。", "开头 م 与后面的 ا 连接；ا 后不继续连接 ن。"],
    ["connection-03", "nan", "نان", "connection", "错误判断：第一个 ن 与 ا 之间应断开。", "开头 ن 与 ا 连接；ا 后面的 ن 重新开始。"],
    ["connection-04", "tal", "تال", "connection", "错误判断：ت 与 ا 之间应断开。", "ت 与 ا 连接；ا 后面的 ل 重新开始。"],
    ["connection-05", "bel", "بەل", "connection", "错误判断：ب 与 ە 之间应断开。", "ب 与 ە 连接，但 ە 后不继续连接 ل。"],
    ["connection-06", "kel", "كەل", "connection", "错误判断：ك 与 ە 之间应断开。", "ك 与 ە 连接，但 ە 后面的 ل 重新开始。"],
    ["break-01", "dada-connection", "دادا", "break", "错误判断：د 和 ا 后都应继续连接后一个字母。", "د 和 ا 后不继续连接，所以中间会自然断开。"],
    ["break-02", "reng-connection", "رەڭ", "break", "错误判断：ر 或 ە 后应继续连接。", "ر 后不继续连接，ە 后也不继续连接，ڭ 重新开始。"],
    ["break-03", "qiz-connection", "قىز", "break", "错误判断：ى 后应继续连接 ز。", "ق 接 ى，而 ى 后不继续连接，最后的 ز 重新开始。"],
    ["break-04", "weten-connection", "ۋەتەن", "break", "错误判断：ۋ 和 ە 后都无需重启后面的字母。", "ۋ、ە 会使后面的字母重新开始。"],
    ["break-05", "mewe-connection", "مېۋە", "break", "错误判断：ې 和 ۋ 后都可继续连接。", "م 接 ې 后断开；ۋ 后也不继续连接。"],
    ["break-06", "toge-connection", "تۆگە", "break", "错误判断：ۆ 后应继续连接 گ。", "ت 接 ۆ，ۆ 后断开，再从 گ 开始。"]
  ].map(([id, sourceComboId, standard, mistakeBucket, distractor, explanation]) => ({
    id,
    sourceComboId,
    standard,
    interaction: "statement-judgment",
    mistakeBucket,
    distractor,
    explanation,
    reviewStatus: "approved"
  }));

  const sentenceRows = [
    ["syllable-sentence-01", "sentence-who-what-1", "بۇ كىم؟", "这是谁？", "Bu kim?", "human_reading_sentence_who_what_1.webm", [["بۇ", "Bu"], ["كىم؟", "kim?"]]],
    ["syllable-sentence-02", "sentence-this-that-1", "بۇ قەلەم.", "这是笔。", "Bu qe-lem.", "human_reading_sentence_this_that_1.webm", [["بۇ", "Bu"], ["قە", "qe"], ["لەم.", "lem."]]],
    ["syllable-sentence-03", "sentence-i-you-3", "ئۇ دوختۇر.", "他/她是医生。", "U dox-tur.", "human_reading_sentence_i_you_3.webm", [["ئۇ", "U"], ["دوخ", "dox"], ["تۇر.", "tur."]]],
    ["syllable-sentence-04", "sentence-have-1", "مەندە قەلەم بار.", "我有笔。", "Men-de qe-lem bar.", "human_reading_sentence_have_1.webm", [["مەن", "Men"], ["دە", "de"], ["قە", "qe"], ["لەم", "lem"], ["بار.", "bar."]]],
    ["syllable-sentence-05", "sentence-like-need-3", "مەن چاي ئىچىمەن.", "我喝茶。", "Men chay i-chi-men.", "human_reading_sentence_like_need_3.webm", [["مەن", "Men"], ["چاي", "chay"], ["ئى", "i"], ["چى", "chi"], ["مەن.", "men."]]],
    ["syllable-sentence-06", "sentence-like-need-4", "مەن ئانا تىلىمنى ياخشى كۆرىمەن.", "我喜欢我的母语。", "Men a-na ti-lim-ni yax-shi kö-ri-men.", "human_reading_sentence_like_need_4.webm", [["مەن", "Men"], ["ئا", "a"], ["نا", "na"], ["تى", "ti"], ["لىم", "lim"], ["نى", "ni"], ["ياخ", "yax"], ["شى", "shi"], ["كۆ", "kö"], ["رى", "ri"], ["مەن.", "men."]]]
  ];

  const sentences = sentenceRows.map(([id, sourceReadingItemId, standard, meaning, latin, audioFile, parts]) => ({
    id,
    sourceReadingItemId,
    standard,
    meaning,
    latin,
    audioPath: `./assets/audio/human/reading/${audioFile}`,
    wholeAudioStatus: "available",
    syllables: parts.map(([text, partLatin]) => ({
      text,
      latin: partLatin,
      startMs: null,
      endMs: null,
      segmentStatus: "unavailable",
      reviewStatus: "pending-listening"
    })),
    reviewStatus: "approved",
    reviewedBy: REVIEWED_BY,
    reviewedAt: REVIEWED_AT
  }));

  const review = {
    reviewStatus: "approved",
    reviewedBy: REVIEWED_BY,
    reviewedAt: REVIEWED_AT,
    criteria: ["逻辑通顺", "维吾尔文字与现有标准来源一致", "整句音频与稳定内容 ID 一致"],
    segmentTimingStatus: "pending-listening"
  };

  const EXPECTED_SENTENCE_SOURCE_IDS = [
    "sentence-who-what-1", "sentence-this-that-1", "sentence-i-you-3",
    "sentence-have-1", "sentence-like-need-3", "sentence-like-need-4"
  ];
  const EXPECTED_SENTENCE_SOURCES = new Set(EXPECTED_SENTENCE_SOURCE_IDS);
  const EXPECTED_SECTION_IDS = ["two-letter-warmup", "syllable-rules", "connection-errors", "sentence-reading"];
  const EXPECTED_WARMUP_SOURCES = ["ba", "pa", "ta", "na", "la", "ma", "be-e", "pe-e", "te-e", "ne-e"];
  const EXPECTED_WARMUP_IDS = EXPECTED_WARMUP_SOURCES.map((sourceId) => `warmup-${sourceId}`);
  const EXPECTED_RULE_IDS = ["vowel-nucleus", "single-consonant-boundary", "two-consonant-boundary", "suffix-boundary"];
  const EXPECTED_EXERCISE_IDS = EXPECTED_RULE_IDS.flatMap((ruleId) => [1, 2, 3, 4].map((index) => `${ruleId}-${String(index).padStart(2, "0")}`));
  const EXPECTED_CONNECTION_IDS = [
    "connection-01", "connection-02", "connection-03", "connection-04", "connection-05", "connection-06",
    "break-01", "break-02", "break-03", "break-04", "break-05", "break-06"
  ];
  const EXPECTED_SENTENCE_IDS = sentenceRows.map((row) => row[0]);
  const EXPECTED_CONNECTION_SOURCE_IDS = [
    "bal", "man", "nan", "tal", "bel", "kel",
    "dada-connection", "reng-connection", "qiz-connection", "weten-connection", "mewe-connection", "toge-connection"
  ];
  const EXPECTED_CRITERIA = ["逻辑通顺", "维吾尔文字与现有标准来源一致", "整句音频与稳定内容 ID 一致"];
  const UNSAFE_TEXT = /[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufb50-\ufdff\ufe70-\ufeff]/u;
  const isPlainObject = (value) => {
    if (!value || Object.prototype.toString.call(value) !== "[object Object]") return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === null || (Object.prototype.hasOwnProperty.call(prototype, "constructor") && prototype.constructor?.name === "Object");
  };

  function assertPlainObject(value, label) {
    if (!isPlainObject(value)) throw new TypeError(`${label} must be a plain object`);
  }

  function assertText(value, label) {
    if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} must be non-empty text`);
    if (UNSAFE_TEXT.test(value)) throw new TypeError(`${label} contains an unsafe character`);
  }

  function assertExactFields(value, fields, label) {
    const expected = [...fields].sort();
    const actual = Object.keys(value).sort();
    if (actual.length !== expected.length || actual.some((field, index) => field !== expected[index])) {
      throw new TypeError(`${label} contains an unexpected field`);
    }
  }

  function normalizedStandard(value) {
    return value.replace(/[\s.?\u061f\u060c]/gu, "");
  }

  function assertStringList(value, expected, label) {
    if (!Array.isArray(value) || value.length !== expected.length || value.some((item, index) => item !== expected[index])) {
      throw new TypeError(`${label} must match the published stable-id contract`);
    }
  }

  function validateSyllableTraining(value) {
    assertPlainObject(value, "syllable training data");
    assertExactFields(value, ["unit", "sections", "twoLetterItems", "rules", "connectionItems", "sentences", "review"], "syllable training data");
    for (const field of ["unit", "sections", "twoLetterItems", "rules", "connectionItems", "sentences", "review"]) {
      if (!(field in value)) throw new TypeError(`missing ${field}`);
    }
    if (!Array.isArray(value.sections) || !Array.isArray(value.twoLetterItems) || !Array.isArray(value.rules) || !Array.isArray(value.connectionItems) || !Array.isArray(value.sentences)) {
      throw new TypeError("syllable training collections must be arrays");
    }

    assertPlainObject(value.unit, "unit");
    assertExactFields(value.unit, ["id", "name", "subtitle", "description", "bullets"], "unit");
    for (const field of ["id", "name", "subtitle", "description"]) assertText(value.unit[field], `unit.${field}`);
    if (value.unit.id !== "syllable-training") throw new TypeError("unit.id must be syllable-training");
    if (!Array.isArray(value.unit.bullets) || value.unit.bullets.length !== 4) throw new TypeError("unit.bullets must contain four published sections");
    value.unit.bullets.forEach((bullet, index) => assertText(bullet, `unit.bullets[${index}]`));

    assertStringList(value.sections.map((section) => section?.id), EXPECTED_SECTION_IDS, "section ids");
    value.sections.forEach((section, index) => {
      assertPlainObject(section, `sections[${index}]`);
      assertExactFields(section, ["id", "title"], `sections[${index}]`);
      assertText(section.title, `sections[${index}].title`);
    });

    const publishedIds = [
      ...value.twoLetterItems.map((item) => item?.id),
      ...value.rules.flatMap((rule) => [rule?.id, ...(Array.isArray(rule?.exercises) ? rule.exercises.map((exercise) => exercise?.id) : [])]),
      ...value.connectionItems.map((item) => item?.id),
      ...value.sentences.map((sentence) => sentence?.id)
    ];
    const seenPublishedIds = new Set();
    for (const id of publishedIds) {
      if (seenPublishedIds.has(id)) throw new TypeError(`duplicate content id: ${id}`);
      seenPublishedIds.add(id);
    }

    assertStringList(value.twoLetterItems.map((item) => item?.sourceComboId), EXPECTED_WARMUP_SOURCES, "warmup source ids");
    assertStringList(value.twoLetterItems.map((item) => item?.id), EXPECTED_WARMUP_IDS, "warmup item ids");
    assertStringList(value.rules.map((rule) => rule?.id), EXPECTED_RULE_IDS, "rule ids");
    assertStringList(value.rules.flatMap((rule) => (Array.isArray(rule?.exercises) ? rule.exercises.map((exercise) => exercise?.id) : [])), EXPECTED_EXERCISE_IDS, "exercise ids");
    assertStringList(value.connectionItems.map((item) => item?.id), EXPECTED_CONNECTION_IDS, "connection item ids");
    assertStringList(value.connectionItems.map((item) => item?.sourceComboId), EXPECTED_CONNECTION_SOURCE_IDS, "connection source ids");
    assertStringList(value.sentences.map((sentence) => sentence?.id), EXPECTED_SENTENCE_IDS, "sentence ids");
    for (const sentence of value.sentences) {
      if (!EXPECTED_SENTENCE_SOURCES.has(sentence?.sourceReadingItemId)) {
        throw new TypeError(`${sentence?.id || "sentence"}.sourceReadingItemId is not reviewed`);
      }
    }
    assertStringList(value.sentences.map((sentence) => sentence?.sourceReadingItemId), EXPECTED_SENTENCE_SOURCE_IDS, "sentence source ids");

    const ids = new Set();
    function takeId(item, label) {
      assertPlainObject(item, label);
      assertText(item.id, `${label}.id`);
      if (ids.has(item.id)) throw new TypeError(`duplicate content id: ${item.id}`);
      ids.add(item.id);
    }

    value.twoLetterItems.forEach((item, index) => {
      takeId(item, `twoLetterItems[${index}]`);
      assertExactFields(item, ["id", "sourceComboId", "standard", "parts", "latin", "audioPath", "reviewStatus"], item.id);
      for (const field of ["sourceComboId", "standard", "latin", "audioPath"]) assertText(item[field], `${item.id}.${field}`);
      if (!Array.isArray(item.parts) || item.parts.length !== 2) throw new TypeError(`${item.id}.parts must contain two letters`);
      item.parts.forEach((part, partIndex) => assertText(part, `${item.id}.parts[${partIndex}]`));
      if (item.reviewStatus !== "approved") throw new TypeError(`${item.id}.reviewStatus must be approved`);
      if (!/^\.\/assets\/audio\/human\/combos\/human_combo_[a-z0-9_]+\.webm$/u.test(item.audioPath)) throw new TypeError(`${item.id}.audioPath is invalid`);
    });
    value.rules.forEach((rule, ruleIndex) => {
      takeId(rule, `rules[${ruleIndex}]`);
      assertExactFields(rule, ["id", "title", "explanation", "scope", "exercises", "reviewStatus"], rule.id);
      for (const field of ["title", "explanation", "scope"]) assertText(rule[field], `${rule.id}.${field}`);
      if (rule.reviewStatus !== "approved") throw new TypeError(`${rule.id}.reviewStatus must be approved`);
      if (!Array.isArray(rule.exercises) || rule.exercises.length !== 4) throw new TypeError(`${rule.id} must contain four approved exercises`);
      assertText(rule.explanation, `rules[${ruleIndex}].explanation`);
      assertText(rule.scope, `rules[${ruleIndex}].scope`);
      rule.exercises.forEach((exercise, exerciseIndex) => {
        takeId(exercise, `rules[${ruleIndex}].exercises[${exerciseIndex}]`);
        assertExactFields(exercise, ["id", "prompt", "answer", "distractor", "sourceId", "reviewStatus"], exercise.id);
        for (const field of ["prompt", "answer", "distractor", "sourceId"]) assertText(exercise[field], `${exercise.id}.${field}`);
        if (exercise.reviewStatus !== "approved") throw new TypeError(`${exercise.id}.reviewStatus must be approved`);
      });
    });
    value.connectionItems.forEach((item, index) => {
      takeId(item, `connectionItems[${index}]`);
      assertExactFields(item, ["id", "sourceComboId", "standard", "interaction", "mistakeBucket", "distractor", "explanation", "reviewStatus"], item.id);
      if (!new Set(["connection", "break"]).has(item.mistakeBucket)) throw new TypeError(`${item.id}.mistakeBucket is invalid`);
      if (item.interaction !== "statement-judgment") throw new TypeError(`${item.id}.interaction is invalid`);
      for (const field of ["sourceComboId", "standard", "distractor", "explanation"]) assertText(item[field], `${item.id}.${field}`);
      if (item.reviewStatus !== "approved") throw new TypeError(`${item.id}.reviewStatus must be approved`);
    });
    if (value.connectionItems.filter((item) => item.mistakeBucket === "connection").length !== 6 || value.connectionItems.filter((item) => item.mistakeBucket === "break").length !== 6) {
      throw new TypeError("connection items must keep six connection and six break judgments");
    }

    value.sentences.forEach((sentence, sentenceIndex) => {
      takeId(sentence, `sentences[${sentenceIndex}]`);
      assertExactFields(sentence, ["id", "sourceReadingItemId", "standard", "meaning", "latin", "audioPath", "wholeAudioStatus", "syllables", "reviewStatus", "reviewedBy", "reviewedAt"], sentence.id);
      if (!EXPECTED_SENTENCE_SOURCES.has(sentence.sourceReadingItemId)) throw new TypeError(`${sentence.id}.sourceReadingItemId is not reviewed`);
      for (const field of ["standard", "meaning", "latin", "audioPath", "reviewStatus", "reviewedBy", "reviewedAt"]) assertText(sentence[field], `${sentence.id}.${field}`);
      if (sentence.reviewStatus !== "approved" || sentence.wholeAudioStatus !== "available" || !Array.isArray(sentence.syllables) || !sentence.syllables.length) {
        throw new TypeError(`${sentence.id} is not publishable`);
      }
      if (sentence.reviewedBy !== REVIEWED_BY || sentence.reviewedAt !== REVIEWED_AT) throw new TypeError(`${sentence.id} review metadata must match the product-owner decision`);
      if (!/^\.\/assets\/audio\/human\/reading\/human_reading_[a-z0-9_]+\.webm$/u.test(sentence.audioPath)) throw new TypeError(`${sentence.id}.audioPath is invalid`);
      sentence.syllables.forEach((part, partIndex) => {
        assertPlainObject(part, `${sentence.id}.syllables[${partIndex}]`);
        assertExactFields(part, ["text", "latin", "startMs", "endMs", "segmentStatus", "reviewStatus"], `${sentence.id}.syllables[${partIndex}]`);
        assertText(part.text, `${sentence.id}.syllables[${partIndex}].text`);
        assertText(part.latin, `${sentence.id}.syllables[${partIndex}].latin`);
        if (part.segmentStatus !== "unavailable" || part.reviewStatus !== "pending-listening" || part.startMs !== null || part.endMs !== null) {
          throw new TypeError(`${sentence.id} segment must remain unavailable with null timestamps; timestamp values must remain null`);
        }
      });
      if (normalizedStandard(sentence.standard) !== normalizedStandard(sentence.syllables.map((part) => part.text).join(""))) {
        throw new TypeError(`${sentence.id} syllables must rejoin to the standard sentence`);
      }
    });
    if (value.sentences.flatMap((sentence) => sentence.syllables).length !== 29) throw new TypeError("sentences must keep 29 reviewed text segments");

    assertPlainObject(value.review, "review");
    assertExactFields(value.review, ["reviewStatus", "reviewedBy", "reviewedAt", "criteria", "segmentTimingStatus"], "review");
    if (value.review.reviewStatus !== "approved") throw new TypeError("review.reviewStatus must be approved");
    if (value.review.reviewedBy !== REVIEWED_BY) throw new TypeError("review.reviewedBy must match the product-owner decision");
    if (value.review.reviewedAt !== REVIEWED_AT) throw new TypeError("review.reviewedAt must match the product-owner decision");
    assertStringList(value.review.criteria, EXPECTED_CRITERIA, "review.criteria");
    if (value.review.segmentTimingStatus !== "pending-listening") throw new TypeError("review.segmentTimingStatus must remain pending-listening");
    return true;
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  const syllableTraining = { unit, sections, twoLetterItems, rules, connectionItems, sentences, review };
  validateSyllableTraining(syllableTraining);

  window.ANA_TILIM_SYLLABLE = Object.freeze({
    syllableTraining: deepFreeze(syllableTraining),
    validateSyllableTraining
  });
})();
