(() => {
  const messages = window.ANA_TILIM_UI_MESSAGES || { zh: {}, en: {} };
  const originalsByCourse = new WeakMap();
  const detailFields = ["type", "cue", "connection", "soundHint", "writingHint", "example"];
  const exampleFields = ["label", "meaning", "noteTitle", "note"];
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

  function createCourseLocalizer(courseData, englishCatalog) {
    const original = captureCourse(courseData);
    const alphabetEnglish = englishCatalog?.alphabet || englishCatalog || {};
    const missing = missingAlphabetEnglish(courseData, alphabetEnglish);

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
