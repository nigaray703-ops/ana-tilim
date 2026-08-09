(() => {
  const uly = window.ANA_TILIM_ULY;
  const alphabetData = window.ANA_TILIM_ALPHABET;
  const latinWriting = window.ANA_TILIM_LATIN_WRITING;
  const comboData = window.ANA_TILIM_COMBOS;
  const syllableData = window.ANA_TILIM_SYLLABLE;
  const vocabData = window.ANA_TILIM_VOCAB;
  const practiceData = window.ANA_TILIM_PRACTICE;
  const readingData = window.ANA_TILIM_READING;
  const appConfig = window.ANA_TILIM_APP_CONFIG || {};

  if (!latinWriting) {
    throw new Error("Ana Tilim focused course data file ANA_TILIM_LATIN_WRITING failed to load.");
  }

  if (!syllableData) {
    throw new Error("Ana Tilim focused course data file ANA_TILIM_SYLLABLE failed to load.");
  }

  if (!uly || !alphabetData || !comboData || !vocabData || !practiceData || !readingData) {
    throw new Error("Ana Tilim focused course data files failed to load.");
  }

  const hiddenUnitIds = new Set(appConfig.hiddenUnitIds || appConfig.hiddenReadingUnitIds || []);
  const readingUnits = readingData.readingUnits.filter((unit) => !hiddenUnitIds.has(unit.id));

  window.ANA_TILIM_COURSE = uly.normalizeCourseTransliterations({
    ...alphabetData,
    latinWriting,
    ...comboData,
    ...syllableData,
    ...vocabData,
    ...practiceData,
    ...readingData,
    readingUnits
  });
})();
