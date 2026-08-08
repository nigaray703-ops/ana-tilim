(() => {
  if (!window.ANA_TILIM_ALPHABET_EN) {
    throw new Error("Ana Tilim English alphabet catalog failed to load.");
  }
  if (!window.ANA_TILIM_COMBOS_EN) {
    throw new Error("Ana Tilim English combination catalog failed to load.");
  }
  if (!window.ANA_TILIM_VOCAB_EN) {
    throw new Error("Ana Tilim English vocabulary catalog failed to load.");
  }

  window.ANA_TILIM_COURSE_EN = {
    alphabet: window.ANA_TILIM_ALPHABET_EN,
    combos: window.ANA_TILIM_COMBOS_EN,
    vocab: window.ANA_TILIM_VOCAB_EN,
    practice: window.ANA_TILIM_PRACTICE_EN || {},
    reading: window.ANA_TILIM_READING_EN || {}
  };
})();
