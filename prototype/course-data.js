(() => {
  const uly = window.ANA_TILIM_ULY;
  const alphabetData = window.ANA_TILIM_ALPHABET;
  const latinWriting = window.ANA_TILIM_LATIN_WRITING;
  const comboData = window.ANA_TILIM_COMBOS;
  const syllableData = window.ANA_TILIM_SYLLABLE;
  const vocabData = window.ANA_TILIM_VOCAB;
  const practiceData = window.ANA_TILIM_PRACTICE;
  const readingData = window.ANA_TILIM_READING;
  const afantiData = window.ANA_TILIM_AFANTI_DATA;
  const afantiEnglish = window.ANA_TILIM_AFANTI_ENGLISH;
  const afantiContent = window.ANA_TILIM_AFANTI_CONTENT;
  const appConfig = window.ANA_TILIM_APP_CONFIG || {};

  if (!latinWriting) {
    throw new Error("Ana Tilim focused course data file ANA_TILIM_LATIN_WRITING failed to load.");
  }

  if (!syllableData) {
    throw new Error("Ana Tilim focused course data file ANA_TILIM_SYLLABLE failed to load.");
  }

  if (!afantiData || !afantiContent) {
    throw new Error("Ana Tilim focused Afanti course data files failed to load.");
  }

  if (!uly || !alphabetData || !comboData || !vocabData || !practiceData || !readingData) {
    throw new Error("Ana Tilim focused course data files failed to load.");
  }

  const hiddenUnitIds = new Set(appConfig.hiddenUnitIds || appConfig.hiddenReadingUnitIds || []);
  const readingUnits = readingData.readingUnits.filter((unit) => !hiddenUnitIds.has(unit.id));
  const edition = appConfig.edition || "global";
  const afantiStories = afantiContent.publishableStories(
    afantiData.stories,
    edition === "global" ? afantiEnglish?.byStoryId : null,
    { edition }
  );

  window.ANA_TILIM_COURSE = uly.normalizeCourseTransliterations({
    ...alphabetData,
    latinWriting,
    ...comboData,
    ...syllableData,
    ...vocabData,
    ...practiceData,
    ...readingData,
    readingUnits,
    afantiStories,
    afantiUnit: afantiData.unit
  });
})();
