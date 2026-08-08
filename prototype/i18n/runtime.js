(() => {
  const messages = window.ANA_TILIM_UI_MESSAGES || { zh: {}, en: {} };
  const originalsByCourse = new WeakMap();
  const detailFields = ["type", "cue", "connection", "soundHint", "writingHint", "example"];
  const exampleFields = ["label", "meaning", "noteTitle", "note"];
  const comboGroupFields = ["title", "goal", "status"];
  const comboItemFields = ["type", "rule", "hint", "review", "meaning"];
  const vocabGroupFields = ["title", "goal", "status"];
  const practiceGroupFields = ["title", "goal", "status"];
  const practiceItemFields = ["type", "label", "hint", "audioStatus"];
  const readingUnitFields = ["title", "subtitle"];
  const readingGroupFields = ["title", "intro"];
  const readingItemFields = ["pattern", "speaker", "meaning", "lesson"];
  let currentLanguage = "en";

  function supported(value) {
    return value === "zh" || value === "en" ? value : null;
  }

  function resolveLanguage(explicitLanguage, languages = []) {
    const explicit = supported(explicitLanguage);
    if (explicit) return explicit;
    const list = Array.isArray(languages) ? languages : [languages];
    const primaryLanguage = String(list[0] || "").toLowerCase();
    return primaryLanguage.startsWith("zh") ? "zh" : "en";
  }

  function readSavedLanguage(serializedProgress) {
    try {
      return supported(JSON.parse(serializedProgress || "{}").preferences?.uiLanguage);
    } catch {
      return null;
    }
  }

  function t(key, params = {}) {
    const template = messages[currentLanguage]?.[key] ?? messages.en?.[key];
    if (typeof template !== "string") {
      console.warn(`Missing Ana Tilim translation: ${key}`);
      return "";
    }
    return Object.entries(params).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template
    );
  }

  function captureCourse(courseData) {
    const existing = originalsByCourse.get(courseData);
    if (existing) return existing;

    const original = {
      letterDetails: Object.fromEntries(
        Object.entries(courseData.letterDetails || {}).map(([letterId, letter]) => [
          letterId,
          {
            fields: Object.fromEntries(
              detailFields
                .filter((field) => Object.prototype.hasOwnProperty.call(letter, field))
                .map((field) => [field, letter[field]])
            ),
            forms: Object.fromEntries(
              (letter.forms || []).map((form) => [form.id, { label: form.label }])
            ),
            formExamples: Object.fromEntries(
              (letter.formExamples || []).map((example) => [
                example.id,
                Object.fromEntries(
                  exampleFields
                    .filter((field) => Object.prototype.hasOwnProperty.call(example, field))
                    .map((field) => [field, example[field]])
                )
              ])
            )
          }
        ])
      ),
      groups: Object.fromEntries(
        (courseData.alphabetGroups || []).map((group) => [
          group.id,
          { title: group.title, goal: group.goal, status: group.status }
        ])
      ),
      comboGroups: Object.fromEntries(
        (courseData.comboGroups || []).map((group) => [
          group.id,
          {
            fields: Object.fromEntries(comboGroupFields.map((field) => [field, group[field]])),
            items: Object.fromEntries(
              (group.items || []).map((item) => [
                item.id,
                Object.fromEntries(
                  comboItemFields
                    .filter((field) => Object.prototype.hasOwnProperty.call(item, field))
                    .map((field) => [field, item[field]])
                )
              ])
            )
          }
        ])
      ),
      vocabGroups: Object.fromEntries(
        (courseData.vocabGroups || []).map((group) => [
          group.id,
          {
            fields: Object.fromEntries(vocabGroupFields.map((field) => [field, group[field]])),
            sections: Object.fromEntries(
              (group.sections || []).map((section) => [section.id, { title: section.title }])
            ),
            items: Object.fromEntries(
              (group.items || []).map((item) => [
                item.id,
                { meaning: item.meaning, tip: item.tip }
              ])
            )
          }
        ])
      ),
      practiceGroups: Object.fromEntries(
        (courseData.practiceGroups || []).map((group) => [
          group.id,
          {
            fields: Object.fromEntries(practiceGroupFields.map((field) => [field, group[field]])),
            items: Object.fromEntries(
              (group.items || []).map((item) => [
                item.id,
                Object.fromEntries(practiceItemFields.map((field) => [field, item[field]]))
              ])
            )
          }
        ])
      ),
      readingUnits: Object.fromEntries(
        (courseData.readingUnits || []).map((unit) => [
          unit.id,
          {
            fields: Object.fromEntries(
              readingUnitFields
                .filter((field) => Object.prototype.hasOwnProperty.call(unit, field))
                .map((field) => [field, unit[field]])
            ),
            groups: Object.fromEntries(
              (unit.groups || []).map((group) => [
                group.id,
                {
                  fields: Object.fromEntries(
                    readingGroupFields
                      .filter((field) => Object.prototype.hasOwnProperty.call(group, field))
                      .map((field) => [field, group[field]])
                  ),
                  items: Object.fromEntries(
                    (group.items || []).map((item) => [
                      item.id,
                      Object.fromEntries(
                        readingItemFields
                          .filter((field) => Object.prototype.hasOwnProperty.call(item, field))
                          .map((field) => [field, item[field]])
                      )
                    ])
                  )
                }
              ])
            )
          }
        ])
      )
    };

    originalsByCourse.set(courseData, original);
    return original;
  }

  function setAvailableText(target, source, fields) {
    if (!target || !source) return;
    for (const field of fields) {
      if (typeof source[field] === "string") {
        target[field] = source[field];
      }
    }
  }

  function missingAlphabetEnglish(courseData, catalog) {
    const missing = [];
    for (const [letterId, letter] of Object.entries(courseData.letterDetails || {})) {
      const translatedLetter = catalog?.letterDetails?.[letterId];
      for (const field of detailFields) {
        if (Object.prototype.hasOwnProperty.call(letter, field) && typeof translatedLetter?.[field] !== "string") {
          missing.push(`alphabet.letterDetails.${letterId}.${field}`);
        }
      }
      for (const form of letter.forms || []) {
        if (typeof translatedLetter?.forms?.[form.id]?.label !== "string") {
          missing.push(`alphabet.letterDetails.${letterId}.forms.${form.id}.label`);
        }
      }
      for (const example of letter.formExamples || []) {
        for (const field of exampleFields) {
          if (
            Object.prototype.hasOwnProperty.call(example, field) &&
            typeof translatedLetter?.formExamples?.[example.id]?.[field] !== "string"
          ) {
            missing.push(`alphabet.letterDetails.${letterId}.formExamples.${example.id}.${field}`);
          }
        }
      }
    }
    for (const group of courseData.alphabetGroups || []) {
      for (const field of ["title", "goal", "status"]) {
        if (typeof catalog?.groups?.[group.id]?.[field] !== "string") {
          missing.push(`alphabet.groups.${group.id}.${field}`);
        }
      }
    }
    return missing;
  }

  function missingComboEnglish(courseData, catalog) {
    const missing = [];
    for (const group of courseData.comboGroups || []) {
      for (const field of comboGroupFields) {
        if (typeof catalog?.groups?.[group.id]?.[field] !== "string") {
          missing.push(`combos.groups.${group.id}.${field}`);
        }
      }
      for (const item of group.items || []) {
        for (const field of comboItemFields) {
          if (
            Object.prototype.hasOwnProperty.call(item, field) &&
            typeof catalog?.items?.[item.id]?.[field] !== "string"
          ) {
            missing.push(`combos.items.${item.id}.${field}`);
          }
        }
      }
    }
    return missing;
  }

  function missingVocabEnglish(courseData, catalog) {
    const missing = [];
    for (const group of courseData.vocabGroups || []) {
      const translatedGroup = catalog?.groups?.[group.id];
      for (const field of vocabGroupFields) {
        if (typeof translatedGroup?.[field] !== "string") {
          missing.push(`vocab.groups.${group.id}.${field}`);
        }
      }
      for (const section of group.sections || []) {
        if (typeof translatedGroup?.sections?.[section.id]?.title !== "string") {
          missing.push(`vocab.groups.${group.id}.sections.${section.id}.title`);
        }
      }
      for (const item of group.items || []) {
        if (typeof catalog?.items?.[item.id]?.meaning !== "string") {
          missing.push(`vocab.items.${item.id}.meaning`);
        }
        if (typeof item.tip === "string" && item.tip.trim() && typeof catalog?.items?.[item.id]?.note !== "string") {
          missing.push(`vocab.items.${item.id}.note`);
        }
      }
    }
    return missing;
  }

  function missingPracticeEnglish(courseData, catalog) {
    const missing = [];
    for (const group of courseData.practiceGroups || []) {
      for (const field of practiceGroupFields) {
        if (typeof catalog?.groups?.[group.id]?.[field] !== "string") {
          missing.push(`practice.groups.${group.id}.${field}`);
        }
      }
      if (group.mode !== "review") {
        for (const field of ["type", "label"]) {
          if (typeof catalog?.templates?.[group.mode]?.[field] !== "string") {
            missing.push(`practice.templates.${group.mode}.${field}`);
          }
        }
      }
    }
    if (typeof catalog?.audioStatus !== "string") {
      missing.push("practice.audioStatus");
    }
    return missing;
  }

  function missingReadingEnglish(courseData, catalog) {
    const missing = [];
    for (const unit of courseData.readingUnits || []) {
      const translatedUnit = catalog?.units?.[unit.id];
      for (const field of readingUnitFields) {
        if (
          typeof unit[field] === "string" &&
          unit[field].trim() &&
          typeof translatedUnit?.[field] !== "string"
        ) {
          missing.push(`reading.units.${unit.id}.${field}`);
        }
      }
      for (const group of unit.groups || []) {
        const translatedGroup = catalog?.groups?.[group.id];
        for (const field of readingGroupFields) {
          if (
            typeof group[field] === "string" &&
            group[field].trim() &&
            typeof translatedGroup?.[field] !== "string"
          ) {
            missing.push(`reading.groups.${group.id}.${field}`);
          }
        }
        for (const item of group.items || []) {
          const translatedItem = catalog?.items?.[item.id];
          for (const field of readingItemFields) {
            if (
              typeof item[field] === "string" &&
              item[field].trim() &&
              typeof translatedItem?.[field] !== "string"
            ) {
              missing.push(`reading.items.${item.id}.${field}`);
            }
          }
        }
      }
    }
    return missing;
  }

  function englishPracticeHint(mode, item, localizedLetter) {
    if (mode === "listen") return localizedLetter?.cue || localizedLetter?.soundHint || "";
    if (mode === "write") return localizedLetter?.writingHint || localizedLetter?.cue || "";
    if (mode === "keyboard") {
      return `Type ${item.value} only. First learn its keyboard position, then move on to combinations.`;
    }
    return localizedLetter?.soundHint || localizedLetter?.cue || "";
  }

  function createCourseLocalizer(courseData, englishCatalog) {
    const original = captureCourse(courseData);
    const alphabetEnglish = englishCatalog?.alphabet || englishCatalog || {};
    const comboEnglish = englishCatalog?.combos || {};
    const vocabEnglish = englishCatalog?.vocab || {};
    const practiceEnglish = englishCatalog?.practice || {};
    const readingEnglish = englishCatalog?.reading || {};
    const missing = [
      ...missingAlphabetEnglish(courseData, alphabetEnglish),
      ...missingComboEnglish(courseData, comboEnglish),
      ...missingVocabEnglish(courseData, vocabEnglish),
      ...missingPracticeEnglish(courseData, practiceEnglish),
      ...missingReadingEnglish(courseData, readingEnglish)
    ];

    function apply(language) {
      const useEnglish = language === "en";
      for (const [letterId, letter] of Object.entries(courseData.letterDetails || {})) {
        const source = useEnglish ? alphabetEnglish.letterDetails?.[letterId] : original.letterDetails[letterId];
        setAvailableText(letter, useEnglish ? source : source?.fields, detailFields);

        for (const form of letter.forms || []) {
          setAvailableText(
            form,
            useEnglish ? source?.forms?.[form.id] : original.letterDetails[letterId]?.forms?.[form.id],
            ["label"]
          );
        }
        for (const example of letter.formExamples || []) {
          setAvailableText(
            example,
            useEnglish
              ? source?.formExamples?.[example.id]
              : original.letterDetails[letterId]?.formExamples?.[example.id],
            exampleFields
          );
        }
      }

      for (const group of courseData.alphabetGroups || []) {
        setAvailableText(
          group,
          useEnglish ? alphabetEnglish.groups?.[group.id] : original.groups[group.id],
          ["title", "goal", "status"]
        );
      }

      for (const group of courseData.comboGroups || []) {
        const originalGroup = original.comboGroups[group.id];
        setAvailableText(
          group,
          useEnglish ? comboEnglish.groups?.[group.id] : originalGroup?.fields,
          comboGroupFields
        );
        for (const item of group.items || []) {
          setAvailableText(
            item,
            useEnglish ? comboEnglish.items?.[item.id] : originalGroup?.items?.[item.id],
            comboItemFields
          );
        }
      }

      for (const group of courseData.vocabGroups || []) {
        const originalGroup = original.vocabGroups[group.id];
        const translatedGroup = vocabEnglish.groups?.[group.id];
        setAvailableText(
          group,
          useEnglish ? translatedGroup : originalGroup?.fields,
          vocabGroupFields
        );
        for (const section of group.sections || []) {
          setAvailableText(
            section,
            useEnglish ? translatedGroup?.sections?.[section.id] : originalGroup?.sections?.[section.id],
            ["title"]
          );
        }
        for (const item of group.items || []) {
          if (useEnglish) {
            setAvailableText(item, vocabEnglish.items?.[item.id], ["meaning"]);
            if (typeof vocabEnglish.items?.[item.id]?.note === "string") {
              item.tip = vocabEnglish.items[item.id].note;
            }
          } else {
            setAvailableText(item, originalGroup?.items?.[item.id], ["meaning", "tip"]);
          }
        }
      }

      for (const group of courseData.practiceGroups || []) {
        const originalGroup = original.practiceGroups[group.id];
        setAvailableText(
          group,
          useEnglish ? practiceEnglish.groups?.[group.id] : originalGroup?.fields,
          practiceGroupFields
        );
        for (const item of group.items || []) {
          if (useEnglish) {
            const template = practiceEnglish.templates?.[group.mode];
            const localizedLetter = courseData.letterDetails?.[item.letterId];
            setAvailableText(item, template, ["type", "label"]);
            item.hint = englishPracticeHint(group.mode, item, localizedLetter);
            item.audioStatus = practiceEnglish.audioStatus;
          } else {
            setAvailableText(item, originalGroup?.items?.[item.id], practiceItemFields);
          }
        }
      }

      for (const unit of courseData.readingUnits || []) {
        const originalUnit = original.readingUnits[unit.id];
        setAvailableText(
          unit,
          useEnglish ? readingEnglish.units?.[unit.id] : originalUnit?.fields,
          readingUnitFields
        );
        for (const group of unit.groups || []) {
          const originalGroup = originalUnit?.groups?.[group.id];
          setAvailableText(
            group,
            useEnglish ? readingEnglish.groups?.[group.id] : originalGroup?.fields,
            readingGroupFields
          );
          for (const item of group.items || []) {
            setAvailableText(
              item,
              useEnglish ? readingEnglish.items?.[item.id] : originalGroup?.items?.[item.id],
              readingItemFields
            );
          }
        }
      }

      return useEnglish ? "en" : "zh";
    }

    return {
      apply,
      missingEnglish() { return [...missing]; }
    };
  }

  window.ANA_TILIM_I18N = {
    resolveLanguage,
    readSavedLanguage,
    setLanguage(language) { currentLanguage = supported(language) || "en"; },
    getLanguage() { return currentLanguage; },
    t,
    createCourseLocalizer
  };
})();
