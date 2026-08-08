import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const modulePath = "prototype/uly-transliteration.js";
assert.ok(fs.existsSync(modulePath), "ULY transliteration module should exist");

const context = {
  console,
  window: {}
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(modulePath, "utf8"), context, { filename: modulePath });

const uly = context.window.ANA_TILIM_ULY;
assert.ok(uly, "ULY transliteration module should expose a stable browser global");
assert.equal(typeof uly.transliterateUyghur, "function", "ULY module should expose transliterateUyghur");
assert.equal(
  typeof uly.normalizeCourseTransliterations,
  "function",
  "ULY module should expose normalizeCourseTransliterations"
);

const wordCases = new Map([
  ["خ", "x"],
  ["چ", "ch"],
  ["ش", "sh"],
  ["غ", "gh"],
  ["ڭ", "ng"],
  ["ې", "ë"],
  ["ۆ", "ö"],
  ["ۈ", "ü"],
  ["ۋ", "w"],
  ["ئالما", "alma"],
  ["ئائىلە", "a'ile"],
  ["خەلقئارا", "xelq'ara"],
  ["سۇس كۆك", "sus kök"],
  ["مېۋە", "mëwe"],
  ["سائەت", "sa'et"],
  ["ياخشىمۇسىز", "yaxshimusiz"]
]);

for (const [source, expected] of wordCases) {
  assert.equal(uly.transliterateUyghur(source), expected, `${source} should transliterate as ${expected}`);
}

assert.equal(
  uly.transliterateUyghur("سالام، قانداق ئەھۋالىڭىز؟", { sentenceCase: true }),
  "Salam, qandaq ehwalingiz?",
  "sentence transliteration should convert punctuation and capitalize the first Latin letter"
);
assert.equal(
  uly.transliterateUyghur("بىز پەمىدۇر ۋە بەرەڭگە ئالدۇق.", { sentenceCase: true }),
  "Biz pemidur we berengge alduq.",
  "sentence transliteration should preserve spaces and use Latin punctuation"
);

const originalAudio = Object.freeze({
  id: "audio-fixture",
  outputPath: "prototype/audio/human/fixture.webm"
});
const course = {
  alphabetLetters: [{ id: "khe", letter: "خ", latin: "old" }],
  letterDetails: {
    aa: {
      id: "aa",
      letter: "ئا",
      latin: "old",
      formExamples: [{ word: "ئالما", meaning: "苹果" }]
    }
  },
  alphabetGroups: [],
  alphabetAudioItems: [originalAudio],
  comboGroups: [{ id: "combo", items: [{ id: "sa", value: "سا", latin: "old" }] }],
  vocabGroups: [{ id: "vocab", items: [{ id: "apple", value: "ئالما", latin: "old" }] }],
  practiceGroups: [],
  readingUnits: [
    {
      id: "reading",
      groups: [
        {
          id: "reading-group",
          items: [{ id: "sentence", value: "بۇ ئالما.", meaning: "这是苹果。" }]
        }
      ]
    }
  ]
};

uly.normalizeCourseTransliterations(course);

assert.equal(course.alphabetLetters[0].latin, "x", "course letters should use canonical ULY");
assert.equal(course.letterDetails.aa.latin, "a", "vowel letters should omit the initial hamza");
assert.equal(course.letterDetails.aa.formExamples[0].latin, "alma", "form examples should gain ULY");
assert.equal(course.comboGroups[0].items[0].latin, "sa", "combos should gain canonical ULY");
assert.equal(course.vocabGroups[0].items[0].latin, "alma", "vocabulary should gain canonical ULY");
assert.equal(
  course.readingUnits[0].groups[0].items[0].latin,
  "Bu alma.",
  "reading items should gain sentence-case ULY"
);
assert.equal(
  course.alphabetAudioItems[0],
  originalAudio,
  "normalizing transliteration must not replace audio item objects"
);
assert.equal(
  course.alphabetAudioItems[0].outputPath,
  "prototype/audio/human/fixture.webm",
  "normalizing transliteration must not change audio paths"
);

console.log("ULY transliteration checks passed");
