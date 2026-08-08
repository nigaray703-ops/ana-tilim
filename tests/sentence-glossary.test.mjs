import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const glossaryPath = "prototype/sentence-glossary.js";
const morphemesPath = "prototype/sentence-morphemes.js";

assert.ok(fs.existsSync(glossaryPath), "sentence glossary module should exist");
assert.ok(fs.existsSync(morphemesPath), "manual sentence morpheme module should exist");

const context = { window: {} };
vm.createContext(context);
for (const scriptPath of [
  "prototype/uly-transliteration.js",
  "prototype/course-data/reading-data.js",
  morphemesPath,
  glossaryPath
]) {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), context, { filename: scriptPath });
}

const readingUnits = context.window.ANA_TILIM_READING.readingUnits;
const glossary = context.window.ANA_TILIM_SENTENCE_GLOSSARY;
const morphemes = context.window.ANA_TILIM_SENTENCE_MORPHEMES;

assert.equal(typeof glossary?.glossSentence, "function", "sentence glossary should expose glossSentence");

let sentenceCount = 0;
let tokenCount = 0;
for (const unit of readingUnits) {
  for (const group of unit.groups) {
    for (const item of group.items) {
      const glosses = glossary.glossSentence(item.value);
      sentenceCount += 1;
      tokenCount += glosses.length;
      assert.ok(glosses.length > 0, `${item.id} should expose word glosses`);
      for (const gloss of glosses) {
        assert.ok(gloss.word, `${item.id} should preserve each Uyghur word`);
        assert.ok(gloss.latin, `${item.id} ${gloss.word} should expose local ULY transliteration`);
        assert.ok(gloss.meaning, `${item.id} ${gloss.word} should expose a Chinese reference meaning`);
        assert.equal(gloss.known, true, `${item.id} ${gloss.word} should use an explicit glossary entry`);
        assert.notEqual(gloss.meaning, "词义待补充", `${item.id} ${gloss.word} should not use a placeholder meaning`);
      }
    }
  }
}

const greeting = glossary.glossToken("ياخشىمۇسىز");
assert.deepEqual(
  JSON.parse(JSON.stringify(greeting.segments.map(({ word, meaning }) => [word, meaning]))),
  [
    ["ياخشى", "好、很好"],
    ["مۇ", "吗（疑问标记）"],
    ["سىز", "您（礼貌人称）"]
  ],
  "yaxshimusiz should explain yaxshi / mu / siz"
);

const kitabingiz = glossary.glossToken("كىتابىڭىز");
assert.deepEqual(
  JSON.parse(JSON.stringify(kitabingiz.segments.map(({ surface, base, meaning }) => [surface, base, meaning]))),
  [
    ["كىتاب", "كىتاب", "书"],
    ["ىڭىز", "ـىڭىز", "您的（第二人称礼貌或复数物主后缀）"]
  ],
  "kitabingiz should separate the noun stem and polite possessive suffix"
);
assert.equal(kitabingiz.formation.formula, "كىتاب + ـىڭىز → كىتابىڭىز");
assert.match(kitabingiz.formation.note, /词干末尾不变/);

const unsplit = glossary.glossToken("رەھمەت");
assert.deepEqual(JSON.parse(JSON.stringify(unsplit.segments)), [], "opaque words should remain whole");
assert.equal(unsplit.formation, null, "opaque words should not invent a formation explanation");

const curatedMorphologyWords = [
  "ئادەمنى", "ئادەمنىڭ", "ئاكام", "ئانام", "ئاۋازى", "ئاۋازىنى",
  "ئالدىدا", "ئالدىنى", "ئەتىگەندە", "ئەقىللىق", "ئورنىمدىن",
  "ئۆتكەننى", "ئۆزىنى", "ئۆگىنىشتىن", "ئۆيدە", "ئۆيگە", "ئۆيىمىز", "ئۆيىمىزدە",
  "بازاردا", "بازارغا", "بۇلۇتلۇق", "بۈگۈنگە", "بىرلىك", "بىزدە", "بىزنىڭ", "بىلىمنىڭ",
  "پايدىلىق", "تارىخنى", "تونۇشنىڭ", "تۇرمۇشنى", "تۇرمۇشىمۇ",
  "تىلدىكى", "تىلنىڭ", "تىلى", "تىلىم", "تىلىمنى", "تىلىنى", "تىلىنىمۇ",
  "چۈشتىن", "خەلقنى", "خەلقنىڭ", "دادام", "دادىڭىز", "دەرسى", "دوستلۇق", "دوستۇم", "دوستى",
  "دېرىزىدىن", "سەۋرنىڭ", "سۆزگە", "سۆزنى", "سۆزى", "سىزدە", "سىڭلىم", "شېرىنلىك",
  "قەلبىمگە", "قەيەردە", "قولدىن", "قۇدۇقنى", "كۆپنىڭ", "كۆرۈشنى",
  "كۆڭلىنى", "كۆڭۈلگە", "كۆڭۈلنى", "كۈچى", "كۈندە", "كۈنى",
  "كىتابىم", "مەكتەپكە", "مەندە", "مەنىگە", "مەنىنى", "مېنىڭ", "مېۋىسى", "نادانلىق", "نانمۇ",
  "ھەرپنى", "ھەقىقەتنى", "ۋەتەننى", "ياخشىمۇ", "ياخشىراق", "ياخشىلىقنى",
  "يازغۇچىنىڭ", "ياشتا", "ياشلارنىڭ", "ياشلىق", "يەردە",
  "يولدا", "يولمۇ", "يولنى", "يولنىڭ", "يولى", "يولىنى", "يۈرەكتىكى", "يۈرەكنى", "يۈزۈمنى"
];

for (const word of curatedMorphologyWords) {
  assert.ok(morphemes[word], `${word} should have a manually reviewed morphology record`);
}

for (const [word, record] of Object.entries(morphemes)) {
  assert.ok(record.segments.length >= 2, `${word} should contain at least a stem and one attached part`);
  assert.ok(record.formation.formula.endsWith(`→ ${word}`), `${word} formation should end with the actual surface word`);
  assert.ok(record.formation.note.trim(), `${word} should explain its connection behavior`);
  const runtimeGloss = glossary.glossToken(word);
  for (const segment of runtimeGloss.segments) {
    assert.ok(segment.surface && segment.base && segment.meaning, `${word} segment should be explicit`);
    assert.ok(segment.latin && segment.baseLatin, `${word} segment should have local ULY transliteration`);
  }
}

assert.equal(sentenceCount, 164, "all current reading sentences should be covered");
assert.ok(tokenCount > sentenceCount, "sentence glossing should expose individual words, not whole-sentence labels");

console.log(`sentence glossary checks passed (${sentenceCount} sentences, ${tokenCount} word tokens)`);
