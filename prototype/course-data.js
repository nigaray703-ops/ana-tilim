(() => {
  const uly = window.ANA_TILIM_ULY;
  const alphabetData = window.ANA_TILIM_ALPHABET;
  const comboData = window.ANA_TILIM_COMBOS;
  const vocabData = window.ANA_TILIM_VOCAB;
  const practiceData = window.ANA_TILIM_PRACTICE;
  const readingData = window.ANA_TILIM_READING;
  const appConfig = window.ANA_TILIM_APP_CONFIG || {};

  if (!uly || !alphabetData || !comboData || !vocabData || !practiceData || !readingData) {
    throw new Error("Ana Tilim focused course data files failed to load.");
  }

  const hiddenUnitIds = new Set(appConfig.hiddenUnitIds || appConfig.hiddenReadingUnitIds || []);
  const readingUnits = readingData.readingUnits.filter((unit) => !hiddenUnitIds.has(unit.id));

  window.ANA_TILIM_COURSE = uly.normalizeCourseTransliterations({
    ...alphabetData,
    ...comboData,
    ...vocabData,
    ...practiceData,
    ...readingData,
    readingUnits
  });
})();
