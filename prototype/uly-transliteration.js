(() => {
  const ULY_CHARACTER_MAP = Object.freeze({
    ا: "a",
    ە: "e",
    ب: "b",
    پ: "p",
    ت: "t",
    ج: "j",
    چ: "ch",
    خ: "x",
    د: "d",
    ر: "r",
    ز: "z",
    ژ: "zh",
    س: "s",
    ش: "sh",
    غ: "gh",
    ف: "f",
    ق: "q",
    ك: "k",
    گ: "g",
    ڭ: "ng",
    ل: "l",
    م: "m",
    ن: "n",
    ھ: "h",
    و: "o",
    ۇ: "u",
    ۆ: "ö",
    ۈ: "ü",
    ۋ: "w",
    ې: "ë",
    ى: "i",
    ي: "y"
  });

  const ULY_VOWELS = new Set(["ا", "ە", "و", "ۇ", "ۆ", "ۈ", "ې", "ى"]);
  const WORD_BOUNDARIES = new Set([" ", "\t", "\n", "\r", "(", "[", "{", "«", "“", "\""]);
  const PUNCTUATION_MAP = Object.freeze({
    "،": ",",
    "؛": ";",
    "؟": "?"
  });
  const IGNORED_CHARACTERS = new Set(["ـ", "\u200c", "\u200d", "\u200e", "\u200f", "\ufeff"]);
  const ARABIC_DIACRITIC_PATTERN = /[\u064b-\u065f\u0670\u06d6-\u06ed]/u;

  function capitalizeSentences(value) {
    let shouldCapitalize = true;
    let result = "";

    for (const character of value) {
      if (shouldCapitalize && /[a-zëöü]/u.test(character)) {
        result += character.toLocaleUpperCase("en");
        shouldCapitalize = false;
        continue;
      }

      result += character;

      if (/[.!?]/u.test(character)) {
        shouldCapitalize = true;
      } else if (!/\s/u.test(character)) {
        shouldCapitalize = false;
      }
    }

    return result;
  }

  function transliterateUyghur(value, { sentenceCase = false } = {}) {
    if (typeof value !== "string" || value.length === 0) {
      return "";
    }

    let result = "";
    let atWordStart = true;

    for (let index = 0; index < value.length; index += 1) {
      const character = value[index];

      if (IGNORED_CHARACTERS.has(character) || ARABIC_DIACRITIC_PATTERN.test(character)) {
        continue;
      }

      if (character === "ئ") {
        const nextCharacter = value[index + 1] || "";
        if (!(atWordStart && ULY_VOWELS.has(nextCharacter))) {
          result += "'";
        }
        atWordStart = false;
        continue;
      }

      if (ULY_CHARACTER_MAP[character]) {
        result += ULY_CHARACTER_MAP[character];
        atWordStart = false;
        continue;
      }

      const punctuation = PUNCTUATION_MAP[character];
      result += punctuation || character;

      if (WORD_BOUNDARIES.has(character) || /[-—–/]/u.test(character)) {
        atWordStart = true;
      } else if (!/\s/u.test(character) && !punctuation) {
        atWordStart = false;
      } else if (/\s/u.test(character)) {
        atWordStart = true;
      }
    }

    const normalized = result
      .replace(/\s+([,.;!?])/gu, "$1")
      .replace(/[ \t]+/gu, " ")
      .trim();

    return sentenceCase ? capitalizeSentences(normalized) : normalized;
  }

  function normalizeItem(item, { sentenceCase = false } = {}) {
    if (!item || typeof item !== "object" || typeof item.value !== "string") {
      return;
    }

    item.latin = transliterateUyghur(item.value, { sentenceCase });
  }

  function normalizeLetter(letter) {
    if (!letter || typeof letter !== "object") {
      return;
    }

    if (typeof letter.letter === "string") {
      letter.latin = transliterateUyghur(letter.letter);
    }

    if (Array.isArray(letter.formExamples)) {
      for (const example of letter.formExamples) {
        if (example && typeof example.word === "string" && example.word.trim()) {
          example.latin = transliterateUyghur(example.word);
        }
      }
    }
  }

  function normalizeCourseTransliterations(course) {
    if (!course || typeof course !== "object") {
      return course;
    }

    for (const letter of course.alphabetLetters || []) {
      normalizeLetter(letter);
    }

    for (const letter of Object.values(course.letterDetails || {})) {
      normalizeLetter(letter);
    }

    for (const group of course.alphabetGroups || []) {
      for (const letter of group.letters || []) {
        normalizeLetter(letter);
      }
    }

    for (const group of course.comboGroups || []) {
      for (const item of group.items || []) {
        normalizeItem(item);
      }
    }

    for (const group of course.vocabGroups || []) {
      for (const item of group.items || []) {
        normalizeItem(item);
      }
    }

    for (const unit of course.readingUnits || []) {
      for (const group of unit.groups || []) {
        for (const item of group.items || []) {
          normalizeItem(item, { sentenceCase: true });
        }
      }
    }

    return course;
  }

  window.ANA_TILIM_ULY = Object.freeze({
    characterMap: ULY_CHARACTER_MAP,
    transliterateUyghur,
    normalizeCourseTransliterations
  });
})();
