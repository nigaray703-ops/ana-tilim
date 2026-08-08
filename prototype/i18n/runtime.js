(() => {
  const messages = window.ANA_TILIM_UI_MESSAGES || { zh: {}, en: {} };
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

  window.ANA_TILIM_I18N = {
    resolveLanguage,
    readSavedLanguage,
    setLanguage(language) { currentLanguage = supported(language) || "en"; },
    getLanguage() { return currentLanguage; },
    t
  };
})();
