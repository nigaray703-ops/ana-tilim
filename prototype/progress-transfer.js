(() => {
  const FORMAT = "uyghur-tili-local-progress";
  const VERSION = 1;
  const EDITION_NAMES = Object.freeze({
    cn: "Uyghur Tili 国内版",
    global: "Ana Tilim 海外版"
  });
  const PROGRESS_SCOPES = Object.freeze(["latinWriting", "letters", "combos", "syllableTraining", "vocab", "practice", "reading"]);
  const PROGRESS_BOOLEAN_FIELDS = new Set([
    "viewed",
    "writing",
    "recognition",
    "keyboard",
    "build",
    "repeat",
    "write",
    "review",
    "listen",
    "completed"
  ]);
  const READING_TRAINING_PROGRESS_FIELDS = new Set(["rule", "compare", "ordering", "completion"]);
  const LATIN_WRITING_PROGRESS_FIELDS = Object.freeze({
    qwerty: new Set(["completed", "completedIds"]),
    "uyghur-keyboard": new Set(["completed", "completedIds"]),
    classification: new Set(["completed"]),
    "vowel-contrast": new Set(["completed", "completedIds"]),
    dictation: new Set(["completed", "completedIds"]),
    forms: new Set(["completed"])
  });
  const NAVIGATION_STRING_FIELDS = Object.freeze([
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
    "selectedUnitId"
  ]);

  function isPlainObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function requirePlainObject(value, path) {
    if (!isPlainObject(value)) {
      throw new Error(`${path} 必须是对象`);
    }
  }

  function requireString(value, path) {
    if (typeof value !== "string") {
      throw new Error(`${path} 必须是字符串`);
    }
  }

  function validateLearningProgress(value) {
    requirePlainObject(value, "learningProgress");
    for (const scope of Object.keys(value)) {
      if (!PROGRESS_SCOPES.includes(scope)) {
        throw new Error(`learningProgress 包含未知字段 ${scope}`);
      }
      const bucket = value[scope];
      requirePlainObject(bucket, `learningProgress.${scope}`);
      for (const [id, entry] of Object.entries(bucket)) {
        const entryPath = `learningProgress.${scope}.${id}`;
        requirePlainObject(entry, entryPath);
        for (const [field, fieldValue] of Object.entries(entry)) {
          const latinFields = scope === "latinWriting" ? LATIN_WRITING_PROGRESS_FIELDS[id] : null;
          if (latinFields && !latinFields.has(field)) {
            throw new Error(`${entryPath} 包含未知字段 ${field}`);
          }
          if (PROGRESS_BOOLEAN_FIELDS.has(field) || (scope === "reading" && READING_TRAINING_PROGRESS_FIELDS.has(field))) {
            if (typeof fieldValue !== "boolean") {
              throw new Error(`${entryPath}.${field} 必须是布尔值`);
            }
          } else if (["listenCompletedIds", "completedIds"].includes(field)) {
            if (!Array.isArray(fieldValue)) {
              throw new Error(`${entryPath}.${field} 必须是数组`);
            }
            fieldValue.forEach((item, index) => requireString(item, `${entryPath}.${field}[${index}]`));
            if (new Set(fieldValue).size !== fieldValue.length) {
              throw new Error(`${entryPath}.${field} 不能包含重复 ID`);
            }
          } else {
            throw new Error(`${entryPath} 包含未知字段 ${field}`);
          }
        }
      }
    }
  }

  function validateMistakes(value) {
    if (!Array.isArray(value)) {
      throw new Error("mistakes 必须是数组");
    }
    const requiredStringFields = [
      "key",
      "kind",
      "kindLabel",
      "targetId",
      "pickedId",
      "value",
      "latin",
      "source",
      "note",
      "createdAt"
    ];
    value.forEach((mistake, index) => {
      const mistakePath = `mistakes[${index}]`;
      requirePlainObject(mistake, mistakePath);
      requiredStringFields.forEach((field) => requireString(mistake[field], `${mistakePath}.${field}`));
      if (mistake.help !== undefined) {
        requireString(mistake.help, `${mistakePath}.help`);
      }
      if (!Number.isInteger(mistake.attempts) || mistake.attempts < 1) {
        throw new Error(`${mistakePath}.attempts 必须是正整数`);
      }
    });
  }

  function validateSyllableMistakes(value) {
    requirePlainObject(value, "syllableMistakes");
    const bucketNames = ["connection", "break"];
    for (const field of Object.keys(value)) {
      if (!bucketNames.includes(field)) {
        throw new Error(`syllableMistakes 包含未知字段 ${field}`);
      }
    }
    if (!bucketNames.every((field) => Object.prototype.hasOwnProperty.call(value, field))) {
      throw new Error("syllableMistakes 必须包含 connection 和 break");
    }
    for (const bucketName of bucketNames) {
      const ids = value[bucketName];
      if (!Array.isArray(ids)) {
        throw new Error(`syllableMistakes.${bucketName} 必须是数组`);
      }
      if (ids.length > 24) {
        throw new Error(`syllableMistakes.${bucketName} 最多保存 24 个 ID`);
      }
      ids.forEach((id, index) => requireString(id, `syllableMistakes.${bucketName}[${index}]`));
      if (new Set(ids).size !== ids.length) {
        throw new Error(`syllableMistakes.${bucketName} 不能包含重复 ID`);
      }
    }
    if (value.connection.some((id) => value.break.includes(id))) {
      throw new Error("syllableMistakes 的 ID 不能跨分类重复");
    }
  }

  function validateLocalProgressData(data) {
    NAVIGATION_STRING_FIELDS.forEach((field) => {
      if (data[field] !== undefined) requireString(data[field], field);
    });
    ["modifiedAt", "preferencesUpdatedAt", "favoriteUpdatedAt"].forEach((field) => {
      if (data[field] !== undefined) requireString(data[field], field);
    });
    if (data.favorite !== undefined && typeof data.favorite !== "boolean") {
      throw new Error("favorite 必须是布尔值");
    }
    if (data.learningProgress !== undefined) validateLearningProgress(data.learningProgress);
    if (data.mistakes !== undefined) validateMistakes(data.mistakes);
    if (data.syllableMistakes !== undefined) validateSyllableMistakes(data.syllableMistakes);

    if (data.writingChecks !== undefined) {
      if (!Array.isArray(data.writingChecks)) {
        throw new Error("writingChecks 必须是数组");
      }
      data.writingChecks.forEach((item, index) => requireString(item, `writingChecks[${index}]`));
    }

    if (data.localProfile !== undefined) {
      requirePlainObject(data.localProfile, "localProfile");
      ["displayName", "avatarDataUrl"].forEach((field) => {
        if (data.localProfile[field] !== undefined) {
          requireString(data.localProfile[field], `localProfile.${field}`);
        }
      });
    }

    if (data.preferences !== undefined) {
      requirePlainObject(data.preferences, "preferences");
      ["audioAutoplay", "learningReminder", "showLatin"].forEach((field) => {
        if (data.preferences[field] !== undefined && typeof data.preferences[field] !== "boolean") {
          throw new Error(`preferences.${field} 必须是布尔值`);
        }
      });
      if (data.preferences.dailyGoal !== undefined && ![5, 10, 15].includes(data.preferences.dailyGoal)) {
        throw new Error("preferences.dailyGoal 必须是 5、10 或 15");
      }
    }

    if (data.dailyActivity !== undefined) {
      requirePlainObject(data.dailyActivity, "dailyActivity");
      if (data.dailyActivity.date !== undefined) {
        requireString(data.dailyActivity.date, "dailyActivity.date");
      }
      if (data.dailyActivity.completedIds !== undefined) {
        if (!Array.isArray(data.dailyActivity.completedIds)) {
          throw new Error("dailyActivity.completedIds 必须是数组");
        }
        data.dailyActivity.completedIds.forEach((item, index) =>
          requireString(item, `dailyActivity.completedIds[${index}]`)
        );
      }
    }
  }

  function createExportPayload(data, metadata = {}) {
    if (!Object.prototype.hasOwnProperty.call(EDITION_NAMES, metadata.edition)) {
      throw new Error("导出版本标识无效");
    }
    return {
      format: FORMAT,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      edition: metadata.edition,
      brandName: metadata.brandName || "Uyghur Tili",
      data: JSON.parse(JSON.stringify(data || {}))
    };
  }

  function parseImportPayload(text, { expectedEdition } = {}) {
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error("文件不是有效的 JSON");
    }

    if (!payload || payload.format !== FORMAT) {
      throw new Error("这不是 Uyghur Tili 学习记录");
    }
    if (payload.version !== VERSION) {
      throw new Error("学习记录版本暂不支持");
    }
    if (!isPlainObject(payload.data)) {
      throw new Error("学习数据缺失");
    }
    if (!Object.prototype.hasOwnProperty.call(EDITION_NAMES, payload.edition)) {
      throw new Error("学习记录版本标识无效");
    }
    if (expectedEdition && !Object.prototype.hasOwnProperty.call(EDITION_NAMES, expectedEdition)) {
      throw new Error("当前应用版本标识无效");
    }
    if (expectedEdition && payload.edition !== expectedEdition) {
      throw new Error(`备份属于 ${EDITION_NAMES[payload.edition]}，不能导入 ${EDITION_NAMES[expectedEdition]}`);
    }
    validateLocalProgressData(payload.data);

    return JSON.parse(JSON.stringify(payload));
  }

  window.ANA_TILIM_PROGRESS_TRANSFER = Object.freeze({
    FORMAT,
    VERSION,
    createExportPayload,
    parseImportPayload,
    validateLearningProgress,
    validateSyllableMistakes
  });
})();
