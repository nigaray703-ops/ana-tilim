(() => {
  const STORY_IDS = Object.freeze([
    "listen-before-judge",
    "fair-bowl-water",
    "unverified-words",
    "precious-time",
    "neighbors-tree",
    "wisdom-not-advantage"
  ]);
  const APPROVED_WORD_RANGES = Object.freeze([
    Object.freeze([60, 80]),
    Object.freeze([70, 90]),
    Object.freeze([80, 100]),
    Object.freeze([90, 110]),
    Object.freeze([100, 130]),
    Object.freeze([120, 150])
  ]);
  const APPROVED_PARAGRAPH_COUNTS = Object.freeze([3, 3, 3, 3, 3, 4]);
  const STORY_FIELDS = Object.freeze([
    "id", "sequence", "primaryTheme", "title", "uyghur", "latin", "zh",
    "wordRange", "actualWordCount", "noAudio", "question", "moral", "review"
  ]);
  const REVIEW_FIELDS = Object.freeze([
    "uyghurLanguage", "translationMeaning", "educationAndCulture",
    "originality", "reviewedBy", "reviewedAt"
  ]);

  function fail(storyId, field, detail = "不符合发布要求") {
    throw new Error(`Afanti story ${storyId || "unknown"} ${field}: ${detail}`);
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function requireExactFields(value, fields, storyId, label) {
    if (!isPlainObject(value)) fail(storyId, label, "必须是对象");
    const keys = Object.keys(value).sort();
    const expected = [...fields].sort();
    if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
      fail(storyId, label, "字段不完整或包含未知字段");
    }
  }

  function requireText(value, storyId, label) {
    if (typeof value !== "string" || !value.trim()) fail(storyId, label, "必须是非空文字");
  }

  function requireParagraphs(value, storyId, label, expectedLength) {
    if (!isPlainObject(value) || Object.keys(value).length !== 1 || !Array.isArray(value.paragraphs)) {
      fail(storyId, label, "必须只包含 paragraphs");
    }
    if (!value.paragraphs.length || (expectedLength != null && value.paragraphs.length !== expectedLength)) {
      fail(storyId, `${label}.paragraphs`, "段落数量不匹配");
    }
    value.paragraphs.forEach((paragraph, index) => requireText(paragraph, storyId, `${label}.paragraphs[${index}]`));
  }

  function requireChoices(value, storyId, label, answerId) {
    if (!Array.isArray(value) || value.length !== 3) fail(storyId, label, "必须有三个选项");
    const ids = value.map((choice, index) => {
      if (!isPlainObject(choice) || Object.keys(choice).sort().join(",") !== "id,text") {
        fail(storyId, `${label}[${index}]`, "选项字段不正确");
      }
      requireText(choice.id, storyId, `${label}[${index}].id`);
      requireText(choice.text, storyId, `${label}[${index}].text`);
      return choice.id;
    });
    if (new Set(ids).size !== 3) fail(storyId, label, "选项 ID 必须互不重复");
    if (!ids.includes(answerId)) fail(storyId, "question.answerId", "必须指向现有选项");
  }

  function requireQuestionLanguage(value, storyId, label, answerId) {
    requireExactFields(value, ["prompt", "choices", "correctFeedback", "retryFeedback"], storyId, label);
    requireText(value.prompt, storyId, `${label}.prompt`);
    requireText(value.correctFeedback, storyId, `${label}.correctFeedback`);
    requireText(value.retryFeedback, storyId, `${label}.retryFeedback`);
    requireChoices(value.choices, storyId, `${label}.choices`, answerId);
  }

  function validateSharedStory(story, expectedId, expectedSequence) {
    const storyId = story?.id || expectedId;
    requireExactFields(story, STORY_FIELDS, storyId, "fields");
    if (story.id !== expectedId) fail(storyId, "id", `预期 ${expectedId}`);
    if (story.sequence !== expectedSequence) fail(storyId, "sequence");
    requireText(story.primaryTheme, storyId, "primaryTheme");
    requireExactFields(story.title, ["uyghur", "latin", "zh"], storyId, "title");
    Object.entries(story.title).forEach(([language, value]) => requireText(value, storyId, `title.${language}`));

    requireParagraphs(story.uyghur, storyId, "uyghur");
    const paragraphCount = story.uyghur.paragraphs.length;
    if (paragraphCount !== APPROVED_PARAGRAPH_COUNTS[expectedSequence - 1]) {
      fail(storyId, "paragraphs", "段落数量与批准版本不一致");
    }
    requireParagraphs(story.latin, storyId, "latin", paragraphCount);
    requireParagraphs(story.zh, storyId, "zh", paragraphCount);

    if (!Array.isArray(story.wordRange) || story.wordRange.length !== 2 || !story.wordRange.every(Number.isInteger)) {
      fail(storyId, "wordRange");
    }
    const approvedRange = APPROVED_WORD_RANGES[expectedSequence - 1];
    if (story.wordRange[0] !== approvedRange[0] || story.wordRange[1] !== approvedRange[1]) {
      fail(storyId, "wordRange", "与批准范围不一致");
    }
    const actualWordCount = story.uyghur.paragraphs.join(" ").trim().split(/\s+/u).filter(Boolean).length;
    if (story.actualWordCount !== actualWordCount) fail(storyId, "actualWordCount", `预期 ${actualWordCount}`);
    if (actualWordCount < story.wordRange[0] || actualWordCount > story.wordRange[1]) fail(storyId, "wordRange");
    if (story.noAudio !== true) fail(storyId, "noAudio", "必须为 true");

    requireExactFields(story.question, ["answerId", "uyghur", "latin", "zh"], storyId, "question");
    requireText(story.question.answerId, storyId, "question.answerId");
    for (const language of ["uyghur", "latin", "zh"]) {
      requireQuestionLanguage(story.question[language], storyId, `question.${language}`, story.question.answerId);
    }

    requireExactFields(story.moral, ["uyghur", "latin", "zh"], storyId, "moral");
    Object.entries(story.moral).forEach(([language, value]) => requireText(value, storyId, `moral.${language}`));

    requireExactFields(story.review, REVIEW_FIELDS, storyId, "review");
    for (const field of REVIEW_FIELDS.slice(0, 4)) {
      if (story.review[field] !== "approved") fail(storyId, field, "必须已批准");
    }
    if (story.review.reviewedBy !== "user-product-owner-confirmation") fail(storyId, "reviewedBy");
    if (story.review.reviewedAt !== "2026-08-10") fail(storyId, "reviewedAt");
  }

  function validateEnglish(value, story, storyId) {
    requireExactFields(value, ["title", "paragraphs", "question", "moral"], storyId, "English");
    requireText(value.title, storyId, "English.title");
    if (!Array.isArray(value.paragraphs) || value.paragraphs.length !== story.uyghur.paragraphs.length) {
      fail(storyId, "English.paragraphs", "段落数量不匹配");
    }
    value.paragraphs.forEach((paragraph, index) => requireText(paragraph, storyId, `English.paragraphs[${index}]`));
    requireQuestionLanguage(value.question, storyId, "English.question", story.question.answerId);
    requireText(value.moral, storyId, "English.moral");
  }

  function publishableStories(stories, englishByStoryId, config = {}) {
    if (!Array.isArray(stories) || stories.length !== STORY_IDS.length) {
      fail("", "stories", "必须完整包含六篇");
    }
    stories.forEach((story, index) => validateSharedStory(story, STORY_IDS[index], index + 1));

    if (config.edition === "global") {
      if (!isPlainObject(englishByStoryId)) fail("", "English", "海外版必须加载英文数据");
      const englishIds = Object.keys(englishByStoryId);
      const missingEnglishId = STORY_IDS.find((id) => !Object.hasOwn(englishByStoryId, id));
      if (missingEnglishId) fail(missingEnglishId, "English", "缺少海外版英文数据");
      if (englishIds.length !== STORY_IDS.length || englishIds.some((id, index) => id !== STORY_IDS[index])) {
        fail("", "English", "必须与六篇稳定 ID 完全对应");
      }
      return stories.map((story) => {
        validateEnglish(englishByStoryId[story.id], story, story.id);
        return { ...story, en: englishByStoryId[story.id] };
      });
    }

    if (config.edition !== "cn") fail("", "edition", "仅支持 cn 或 global");
    return stories.map((story) => ({ ...story }));
  }

  window.ANA_TILIM_AFANTI_CONTENT = Object.freeze({
    publishableStories
  });
})();
