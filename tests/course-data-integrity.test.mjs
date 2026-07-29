import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const courseDataScriptPaths = [
  "prototype/uly-transliteration.js",
  "prototype/course-data/alphabet-data.js",
  "prototype/course-data/combo-data.js",
  "prototype/course-data/vocab-data.js",
  "prototype/course-data/practice-data.js",
  "prototype/course-data/reading-data.js",
  "prototype/course-data.js"
];

const context = {
  console,
  window: {}
};
context.globalThis = context;
vm.createContext(context);

for (const scriptPath of courseDataScriptPaths) {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), context, { filename: scriptPath });
}

const courseData = context.window.ANA_TILIM_COURSE;
assert.ok(courseData, "course data should load from the focused data files");

const {
  alphabetLetters,
  letterDetails,
  alphabetGroups,
  alphabetAudioItems,
  comboGroups,
  vocabGroups,
  practiceGroups,
  readingUnits
} = courseData;

function assertText(value, label) {
  assert.equal(typeof value, "string", `${label} should be text`);
  assert.ok(value.trim().length > 0, `${label} should not be empty`);
}

function assertList(value, label) {
  assert.ok(Array.isArray(value), `${label} should be a list`);
  assert.ok(value.length > 0, `${label} should not be empty`);
}

function assertUnique(values, label) {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  assert.deepEqual([...duplicates], [], `${label} should not contain duplicate ids`);
}

const supportedFormExampleLabels = new Set([
  "独立式",
  "简单独立式",
  "后连式",
  "简单后连式",
  "双连式",
  "隔音双连式",
  "前连式",
  "隔音前连式"
]);
const sourceBackedFormExampleWords = {
  aa: ["ئانا", "قارا", "ئالما", "خەلقئارا"],
  ae: ["ئەدەبىيات", "رەسىم", "مەن", "مەشئەل"],
  be: ["كىتاب", "بەش", "پۇتبول", "قەلب"],
  pe: ["كۆپ", "پارتا", "قالپاق", "يىپ"],
  te: ["ئات", "تاۋۇز", "خالتا", "ئىت"],
  nun: ["نان", "بانان", "ئەينەك", "تىيىن"],
  jim: ["تاج", "جۈمە", "بۆلجۈرگەن", "ئانكورېج"],
  che: ["چاچ", "چارچاش", "پايچىك", "ساندۋىچ"],
  khe: ["دەرەخ", "خوجايىن", "ئاشخانا", "بىخ"],
  dal: ["دادا", "چايدان"],
  re: ["رەڭ", "شىر"],
  ze: ["كۆز", "قىز"],
  zhe: ["ژۇرنال", "پارىژ"],
  sin: ["يولۋاس", "سىز", "سامساق", "قالتىس"],
  shin: ["تاش", "شار", "ئىشچى", "چىش"],
  ghayn: ["ئاياغ", "غاز", "يامغۇر", "تىغ"],
  fe: ["تېلېگراف", "فامىلە", "ئاسفالت", "گولف"],
  qaf: ["ئاق", "قول", "قەشقەر", "ئېيىق"],
  kaf: ["كۆك", "كابىنكا", "ئىككى", "ئىشىك"],
  gaf: ["بىئولوگ", "گىلەم", "ئۈلگە", "لېيپزىگ"],
  ng: ["يەڭ", "ياڭاق", "يىڭنە", "مىڭ"],
  lam: ["كۆل", "خەلق", "بىلىم", "پىل"],
  mim: ["قەلەم", "مۈشۈك", "مايمۇن", "تارىم"],
  he: ["ئابدۇللاھ", "ھەرە", "دېھقان", "تەنبىھ"],
  o: ["ئوت", "دورا", "قوغۇن", "گېئولوگىيە"],
  u: ["ئۇيغۇر", "دۇمباق", "پۇل", "مەسئۇلىيەت"],
  oe: ["ئۆي", "دۆلەت", "تۆگە", "قىزىلئۆڭگەچ"],
  ue: ["ئۈمىد", "ئۈزۈم", "گۈل", "نائۈمىد"],
  waw: ["ۋەتەن", "مېۋە"],
  ee: ["ئې چيەنچيۇ", "چېڭدې", "ئېتىز", "دېڭىز", "تېز", "مۈشۈكئېيىق", "چاڭجياجې", "چاڭئې"],
  ii: ["ئى نائومى", "مالاۋى", "ئىز", "پىڭۋىن", "چىرايلىق", "پېئىل", "قايسى", "مەنئى"],
  ye: ["قوي", "يىل", "كومپيۇتېر", "ناترىي"]
};
const sourceBackedVocabSpellings = {
  yaxshimusiz: { value: "ياخشىمۇسىز", latin: "yaxshimusiz" },
  rahmat: { value: "رەھمەت", latin: "rehmet" },
  assalamu: { value: "ئەسسالامۇ ئەلەيكۇم", latin: "essalamu eleykum" },
  waalaykum: { value: "ۋەئەلەيكۇم ئەسسالام", latin: "we'eleykum essalam" },
  korushkunche: { value: "كۆرۈشكىچە", latin: "körüshkiche" },
  "aile-family": { value: "ئائىلە", latin: "a'ile" },
  "ana-family": { value: "ئانا", latin: "ana" },
  "ata-family": { value: "ئاتا", latin: "ata" },
  "oghul-family": { value: "ئوغۇل", latin: "oghul" },
  "qiz-family": { value: "قىز", latin: "qiz" },
  biz: { value: "بىز", latin: "biz" },
  siz: { value: "سىز", latin: "siz" },
  nime: { value: "نېمە", latin: "nëme" },
  sixty: { value: "ئاتمىش", latin: "atmish" },
  "oy-home": { value: "ئۆي", latin: "öy" },
  "ishik-home": { value: "ئىشىك", latin: "ishik" },
  "dereze-home": { value: "دېرىزە", latin: "dërize" },
  "stol-home": { value: "ئۈستەل", latin: "üstel" },
  "qelem-home": { value: "قەلەم", latin: "qelem" },
  "depter-home": { value: "دەپتەر", latin: "depter" },
  "somka-home": { value: "سومكا", latin: "somka" },
  "orunduq-home": { value: "ئورۇندۇق", latin: "orunduq" },
  "saet-home": { value: "سائەت", latin: "sa'et" },
  "pul-home": { value: "پۇل", latin: "pul" },
  "qizil-color": { value: "قىزىل", latin: "qizil" },
  "kok-color": { value: "كۆك", latin: "kök" },
  "yeshil-color": { value: "يېشىل", latin: "yëshil" },
  "seriq-color": { value: "سېرىق", latin: "sëriq" },
  "qara-color": { value: "قارا", latin: "qara" },
  "aq-color": { value: "ئاق", latin: "aq" }
};
const vowelFormTargets = {
  aa: { initial: "ئا", base: "ا" },
  ae: { initial: "ئە", base: "ە" },
  o: { initial: "ئو", base: "و" },
  u: { initial: "ئۇ", base: "ۇ" },
  oe: { initial: "ئۆ", base: "ۆ" },
  ue: { initial: "ئۈ", base: "ۈ" },
  ee: { initial: "ئې", base: "ې" },
  ii: { initial: "ئى", base: "ى" }
};
const nonForwardJoiningCharacters = new Set(["ئ", "ا", "ە", "د", "ر", "ز", "ژ", "و", "ۇ", "ۆ", "ۈ", "ۋ"]);
const formExampleCharacters = new Set(Object.values(letterDetails).flatMap((letter) => [...letter.letter]));
for (const target of Object.values(vowelFormTargets)) {
  formExampleCharacters.add(target.base);
}

function canConnectForward(character) {
  return formExampleCharacters.has(character) && !nonForwardJoiningCharacters.has(character);
}

function acceptsConnection(character) {
  return formExampleCharacters.has(character) && character !== "ئ";
}

function formExampleTargetBase(letterId, letter) {
  return vowelFormTargets[letterId]?.base || letter.letter;
}

function formExamplePositions(word, target) {
  const indexes = [];
  let start = 0;

  while (true) {
    const index = word.indexOf(target, start);
    if (index === -1) break;
    indexes.push(index);
    start = index + target.length;
  }

  return indexes;
}

function hasMedialFormPosition(letterId, word, letter) {
  const target = formExampleTargetBase(letterId, letter);

  return formExamplePositions(word, target).some((index) => {
    const end = index + target.length;
    if (index <= 0 || end >= word.length) return false;

    const previous = word[index - 1];
    const next = word[end];
    if (!canConnectForward(previous) || !acceptsConnection(target[0])) return false;

    return canConnectForward(target[0]) ? acceptsConnection(next) : Boolean(next);
  });
}

function hasFinalFormPosition(letterId, word, letter) {
  const target = formExampleTargetBase(letterId, letter);

  return formExamplePositions(word, target).some((index) => {
    const end = index + target.length;
    return end === word.length && index > 0;
  });
}

function formExampleMatchesPosition(letterId, letter, example) {
  if (example.label === "独立") {
    return example.word === letter.letter || example.word === formExampleTargetBase(letterId, letter);
  }

  if (example.label === "词首") {
    return example.word.startsWith(vowelFormTargets[letterId]?.initial || letter.letter);
  }

  if (example.label === "词中") {
    return hasMedialFormPosition(letterId, example.word, letter);
  }

  if (example.label === "词尾") {
    return hasFinalFormPosition(letterId, example.word, letter);
  }

  return false;
}

const sourceBackedTargetRanges = {
  "aa:简单独立式": [3, 1],
  "aa:前连式": [4, 1],
  "nun:独立式": [2, 1],
  "nun:后连式": [2, 1],
  "kaf:双连式": [2, 1],
  "ue:简单独立式": [3, 1],
  "ue:隔音前连式": [2, 2],
  "oe:隔音前连式": [5, 2],
  "ee:简单独立式": [4, 1],
  "ee:隔音双连式": [5, 2],
  "ee:隔音前连式": [3, 2],
  "ii:简单后连式": [4, 1],
  "ii:双连式": [1, 1],
  "ii:隔音双连式": [2, 2],
  "ii:隔音前连式": [3, 2]
};

function flattenGroupItems(groups) {
  return groups.flatMap((group) => group.items.map((item) => ({ ...item, groupId: group.id })));
}

function assertGroupShape(groups, label) {
  assertList(groups, `${label} groups`);
  assertUnique(groups.map((group) => group.id), `${label} group ids`);

  for (const group of groups) {
    assertText(group.id, `${label} group id`);
    assertText(group.title, `${label} group ${group.id} title`);
    assertText(group.goal, `${label} group ${group.id} goal`);
    assertText(group.status, `${label} group ${group.id} status`);
    if (label === "practice" && group.mode === "review") {
      assert.ok(Array.isArray(group.letters), `${label} group ${group.id} display items should be a list`);
      assert.ok(Array.isArray(group.items), `${label} group ${group.id} items should be a list`);
      assert.equal(
        group.letters.length,
        group.items.length,
        `${label} group ${group.id} display list should match item count`
      );
      continue;
    }

    assertList(group.letters, `${label} group ${group.id} display items`);
    assertList(group.items, `${label} group ${group.id} items`);
    assert.equal(
      group.letters.length,
      group.items.length,
      `${label} group ${group.id} display list should match item count`
    );
  }
}

function assertReadingUnit({ id, title, minGroups, maxGroups, expectedKind }) {
  const unit = readingUnits.find((item) => item.id === id);
  assert.ok(unit, `reading unit ${id} should exist`);
  assertText(unit.title, `reading unit ${id} title`);
  assert.ok(unit.title.includes(title), `reading unit ${id} should be titled ${title}`);
  assert.equal(unit.kind, "reading", `reading unit ${id} should use reading kind`);
  assert.equal(unit.readingKind, expectedKind, `reading unit ${id} should use ${expectedKind} reading kind`);
  assertList(unit.groups, `reading unit ${id} groups`);
  assert.ok(
    unit.groups.length >= minGroups && unit.groups.length <= maxGroups,
    `reading unit ${id} should include ${minGroups} to ${maxGroups} groups`
  );
  assertUnique(unit.groups.map((group) => group.id), `reading unit ${id} group ids`);
  return unit;
}

function assertManifestMatches(manifestPath, courseItems, label, { exact = true } = {}) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assertList(manifest.items, `${label} audio manifest items`);
  if (exact) {
    assert.equal(manifest.items.length, courseItems.length, `${label} audio manifest should match course item count`);
  } else {
    assert.ok(
      manifest.items.length <= courseItems.length,
      `${label} audio manifest should not include more items than the course data`
    );
  }
  assertUnique(manifest.items.map((item) => item.id || item.letterId), `${label} audio manifest ids`);
  assertUnique(manifest.items.map((item) => item.file), `${label} audio manifest filenames`);

  const courseById = Object.fromEntries(courseItems.map((item) => [item.id || item.letterId, item]));
  for (const audioItem of manifest.items) {
    const id = audioItem.id || audioItem.letterId;
    const courseItem = courseById[id];
    assert.ok(courseItem, `${label} audio item ${id} should point to an existing course item`);
    assert.equal(audioItem.value || audioItem.letter, courseItem.value || courseItem.letter, `${label} audio item ${id} value should match course data`);
    assert.equal(audioItem.latin, courseItem.latin, `${label} audio item ${id} latin should match course data`);
    assertText(audioItem.file, `${label} audio item ${id} file`);
    assert.ok(audioItem.file.endsWith(".webm"), `${label} audio item ${id} file should be webm`);
    assert.ok(audioItem.outputPath.endsWith(audioItem.file), `${label} audio item ${id} output path should include file name`);
    assert.equal(audioItem.reviewStatus, "已接入", `${label} audio item ${id} should be connected`);
  }
}

assertList(alphabetLetters, "alphabet letter list");
assert.equal(alphabetLetters.length, 32, "alphabet letter list should contain 32 standard letters");
for (const [index, letter] of alphabetLetters.entries()) {
  assertText(letter.letter, `alphabetLetters[${index}].letter`);
  assertText(letter.latin, `alphabetLetters[${index}].latin`);
  assertText(letter.type, `alphabetLetters[${index}].type`);
}

assert.equal(Object.keys(letterDetails).length, 32, "letter details should cover all 32 letters");
assertUnique(Object.values(letterDetails).map((letter) => letter.id), "letter detail ids");
for (const [key, letter] of Object.entries(letterDetails)) {
  assert.equal(letter.id, key, `letter detail key ${key} should match its id`);
  for (const field of ["letter", "latin", "type", "cue", "connection", "soundHint", "writingHint", "example"]) {
    assertText(letter[field], `letter detail ${key}.${field}`);
  }
  assert.ok([2, 4, 8].includes(letter.forms.length), `letter detail ${key} should include the complete 2, 4, or 8 writing forms`);
  for (const form of letter.forms) {
    assertText(form.label, `letter detail ${key} form label`);
    assertText(form.value, `letter detail ${key} form value`);
    assert.ok(supportedFormExampleLabels.has(form.label), `letter detail ${key} form label ${form.label} should follow the source table labels`);
  }
  if (letter.type === "辅音") {
    assert.ok(
      letter.soundHint.includes("辅音不能单独成音节") && letter.soundHint.includes("元音"),
      `letter detail ${key} should explain that consonants need a vowel when read`
    );
  }
  assert.ok(Array.isArray(letter.formExamples), `letter detail ${key} should include form examples`);
  assert.equal(letter.formExamples.length, letter.forms.length, `letter detail ${key} should include one example for each writing form`);
  assert.equal(
    letter.formExamples.map((example) => example.label).join("|"),
    letter.forms.map((form) => form.label).join("|"),
    `letter detail ${key} form examples should follow the form table order`
  );
  const formByLabel = Object.fromEntries(letter.forms.map((form) => [form.label, form.value]));
  for (const example of letter.formExamples) {
    assert.equal(example.form, formByLabel[example.label], `letter detail ${key} ${example.label} example should match the form table`);
    if (example.note) {
      assertText(example.note, `letter detail ${key} form example note`);
      if (example.noteType) {
        assert.ok(["rule", "rare"].includes(example.noteType), `letter detail ${key} form example note type should be supported`);
      }
      if (example.noteTitle) {
        assertText(example.noteTitle, `letter detail ${key} form example note title`);
      }
      assert.ok(!example.note.includes("可靠"), `letter detail ${key} should not expose internal placeholder wording`);
      assert.ok(!example.note.includes("先记字形"), `letter detail ${key} should not look like an unfinished placeholder`);
      continue;
    }
    assert.ok(!example.note, `letter detail ${key} ${example.label} should use a real example word`);
    for (const field of ["word", "meaning"]) {
      assertText(example[field], `letter detail ${key} form example ${field}`);
    }
    if (example.latin) {
      assertText(example.latin, `letter detail ${key} optional form example latin`);
    }
    const expectedTarget = example.form.replaceAll("ـ", "");
    assert.ok(Number.isInteger(example.targetStart), `letter detail ${key} ${example.label} should locate its red letter`);
    assert.equal(
      example.targetLength,
      expectedTarget.length,
      `letter detail ${key} ${example.label} should highlight the complete PDF letter form`
    );
    assert.equal(
      example.word.slice(example.targetStart, example.targetStart + example.targetLength),
      expectedTarget,
      `letter detail ${key} ${example.label} should highlight the matching letter inside the example word`
    );
    const expectedRange = sourceBackedTargetRanges[`${key}:${example.label}`];
    if (expectedRange) {
      assert.deepEqual(
        [example.targetStart, example.targetLength],
        expectedRange,
        `letter detail ${key} ${example.label} should match the red range shown in the specified alphabet PDF`
      );
    }
    if (example.label === "独立式" && letter.type === "辅音" && example.word === letter.letter) {
      assert.ok(
        example.meaning.includes("不单独成音节"),
        `letter detail ${key} isolated consonant example should not teach it as a standalone syllable`
      );
    }
    if (example.label === "独立式" && vowelFormTargets[key] && example.word === letter.letter) {
      assert.equal(
        example.meaning,
        `ئ + ${vowelFormTargets[key].base}`,
        `letter detail ${key} isolated vowel example should explain the hamza carrier composition`
      );
    }
  }
  if (sourceBackedFormExampleWords[key]) {
    const exampleWords = Array.from(letter.formExamples, (example) => example.word).filter(Boolean);
    assert.deepEqual(
      exampleWords,
      sourceBackedFormExampleWords[key],
      `letter detail ${key} should use only the example words from the specified alphabet PDF`
    );
  }
}

assertList(alphabetGroups, "alphabet groups");
assertUnique(alphabetGroups.map((group) => group.id), "alphabet group ids");
const groupedLetterIds = alphabetGroups.flatMap((group) => group.letters.map((letter) => letter.id));
assert.equal(groupedLetterIds.length, 32, "alphabet groups should cover all 32 detailed letters");
assertUnique(groupedLetterIds, "alphabet grouped letter ids");
for (const letterId of groupedLetterIds) {
  assert.ok(letterDetails[letterId], `alphabet group letter ${letterId} should exist in letter details`);
}

assertUnique(alphabetAudioItems.map((item) => item.letterId), "alphabet audio letter ids");
assert.equal(alphabetAudioItems.length, 32, "alphabet audio data should cover all 32 letters");
for (const audioItem of alphabetAudioItems) {
  assert.ok(letterDetails[audioItem.letterId], `alphabet audio item ${audioItem.letterId} should point to a known letter`);
  assertText(audioItem.file, `alphabet audio ${audioItem.letterId} file`);
  assert.equal(audioItem.playable, true, `alphabet audio ${audioItem.letterId} should be playable after connection`);
  assert.equal(audioItem.statusLabel, "真人音频", `alphabet audio ${audioItem.letterId} should be marked as connected human audio`);
  assert.ok(
    audioItem.outputPath === `./assets/audio/human/alphabet/${audioItem.file}`,
    `alphabet audio ${audioItem.letterId} output path should match its file`
  );
}

assertGroupShape(comboGroups, "combo");
assertGroupShape(vocabGroups, "vocab");
assertGroupShape(practiceGroups, "practice");
const alphabetPracticeGroups = practiceGroups.filter((group) => group.mode !== "review");
assert.equal(alphabetPracticeGroups.length, 4, "practice center should keep four fixed alphabet training entries");
for (const group of alphabetPracticeGroups) {
  assert.equal(group.items.length, 32, `practice group ${group.id} should cover all 32 letters`);
  assert.equal(group.letters.length, 32, `practice group ${group.id} should show 32 letters`);
}
const dynamicReviewGroup = practiceGroups.find((group) => group.mode === "review");
assert.ok(dynamicReviewGroup, "practice center should include dynamic mistake review");
assert.equal(dynamicReviewGroup.items.length, 0, "mistake review should not include a fixed fallback item list");
assert.ok(practiceGroups.some((group) => group.mode === "write" && group.title === "书写"), "practice groups should include a standalone writing entry");
assert.ok(practiceGroups.some((group) => group.mode === "keyboard" && group.title === "键盘"), "practice groups should include a standalone keyboard entry");
assert.ok(!practiceGroups.some((group) => group.title.includes("书写、键盘")), "practice groups should not combine writing and keyboard in one title");
assertList(readingUnits, "reading units");
assert.equal(readingUnits.length, 6, "reading course should add units four through nine");
assert.equal(
  readingUnits.map((unit) => unit.id).join("|"),
  "grammar-basics|sentence-patterns|dialogue-theater|short-stories|famous-quotes|uyghur-proverbs",
  "reading units should place grammar immediately after vocabulary"
);

const comboItems = flattenGroupItems(comboGroups);
const vocabItems = flattenGroupItems(vocabGroups);
const practiceItems = flattenGroupItems(practiceGroups);
const readingItems = readingUnits.flatMap((unit) =>
  unit.groups.flatMap((group) => group.items.map((item) => ({ ...item, unitId: unit.id, groupId: group.id, readingKind: unit.readingKind })))
);
const vocabById = Object.fromEntries(vocabItems.map((item) => [item.id, item]));
const formExampleItems = Object.values(letterDetails).flatMap((letter) =>
  letter.formExamples.filter((example) => example.word)
);

assert.equal(comboItems.length, 34, "all 34 basic combinations should be available for ULY review");
assert.equal(vocabItems.length, 209, "all 209 vocabulary items should be available for ULY review");
assert.equal(readingItems.length, 164, "all 164 reading items should be available for ULY review");

for (const [label, items] of [
  ["combination", comboItems],
  ["vocabulary", vocabItems],
  ["reading", readingItems],
  ["form example", formExampleItems]
]) {
  for (const item of items) {
    assertText(item.latin, `${label} ${item.id || item.word} ULY`);
    assert.match(
      item.latin,
      /^[A-Za-zËÖÜëöü ',.!?;\-]+$/u,
      `${label} ${item.id || item.word} ULY should use only the approved ULY alphabet and Latin punctuation`
    );
    assert.doesNotMatch(item.latin, /\p{Script=Arabic}/u, `${label} ${item.id || item.word} ULY should not contain Arabic text`);
    assert.doesNotMatch(item.latin, /\p{Script=Cyrillic}/u, `${label} ${item.id || item.word} ULY should not contain Cyrillic text`);
  }
}

const canonicalUlyFixtures = new Map([
  ["ئائىلە", "a'ile"],
  ["ئەسسالامۇ ئەلەيكۇم", "essalamu eleykum"],
  ["مېۋە", "mëwe"],
  ["سائەت", "sa'et"],
  ["خەلقئارا", "xelq'ara"]
]);
for (const [value, expectedLatin] of canonicalUlyFixtures) {
  const item = [...vocabItems, ...comboItems, ...formExampleItems].find(
    (candidate) => (candidate.value || candidate.word) === value
  );
  assert.ok(item, `canonical ULY fixture ${value} should exist in course data`);
  assert.equal(item.latin, expectedLatin, `${value} should use canonical ULY ${expectedLatin}`);
}
for (const item of [...comboItems, ...vocabItems, ...practiceItems, ...readingItems]) {
  assert.doesNotMatch(
    item.value,
    /\p{Script=Cyrillic}/u,
    `${item.id} should not mix Cyrillic letters into Uyghur Arabic text`
  );
}
assert.equal(
  readingItems.find((item) => item.id === "story-market-3")?.value,
  "بىز پەمىدۇر ۋە بەرەڭگە ئالدۇق.",
  "market story should write alduq entirely with Uyghur Arabic letters"
);
for (const [id, expected] of Object.entries(sourceBackedVocabSpellings)) {
  const item = vocabById[id];
  assert.ok(item, `source-backed vocab item ${id} should exist`);
  assert.equal(item.value, expected.value, `source-backed vocab item ${id} should use the checked Uyghur spelling`);
  assert.equal(item.latin, expected.latin, `source-backed vocab item ${id} should use the checked Latin transliteration`);
}
assertUnique(comboItems.map((item) => item.id), "combo item ids");
assertUnique(vocabItems.map((item) => item.id), "vocab item ids");
assertUnique(practiceItems.map((item) => item.id), "practice item ids");
assertUnique(readingItems.map((item) => item.id), "reading item ids");
assertUnique(
  [...Object.values(letterDetails).map((letter) => letter.id), ...comboItems, ...vocabItems, ...practiceItems, ...readingItems].map(
    (item) => (typeof item === "string" ? item : item.id)
  ),
  "all learning item ids"
);

const grammarUnit = assertReadingUnit({ id: "grammar-basics", title: "语法入门", minGroups: 6, maxGroups: 6, expectedKind: "grammar" });
const sentenceUnit = assertReadingUnit({ id: "sentence-patterns", title: "基础句型", minGroups: 6, maxGroups: 10, expectedKind: "sentence" });
const dialogueUnit = assertReadingUnit({ id: "dialogue-theater", title: "对话小剧场", minGroups: 5, maxGroups: 8, expectedKind: "dialogue" });
const storyUnit = assertReadingUnit({ id: "short-stories", title: "小故事", minGroups: 5, maxGroups: 8, expectedKind: "story" });
const quoteUnit = assertReadingUnit({ id: "famous-quotes", title: "名人名言", minGroups: 10, maxGroups: 10, expectedKind: "quote" });
const proverbUnit = assertReadingUnit({ id: "uyghur-proverbs", title: "维吾尔谚语", minGroups: 10, maxGroups: 10, expectedKind: "proverb" });

for (const group of [...grammarUnit.groups, ...sentenceUnit.groups, ...dialogueUnit.groups, ...storyUnit.groups, ...quoteUnit.groups, ...proverbUnit.groups]) {
  assertText(group.id, `reading group ${group.id} id`);
  assertText(group.title, `reading group ${group.id} title`);
  assertList(group.items, `reading group ${group.id} items`);
}

for (const group of grammarUnit.groups) {
  assert.ok(group.items.length >= 2 && group.items.length <= 3, `grammar group ${group.id} should stay compact`);
  for (const item of group.items) {
    for (const field of ["id", "pattern", "value", "meaning", "lesson", "reviewStatus"]) {
      assertText(item[field], `grammar item ${item.id}.${field}`);
    }
  }
}

for (const group of sentenceUnit.groups) {
  assert.ok(group.items.length >= 3 && group.items.length <= 5, `sentence group ${group.id} should stay compact`);
  for (const item of group.items) {
    for (const field of ["id", "value", "meaning", "reviewStatus"]) {
      assertText(item[field], `sentence item ${item.id}.${field}`);
    }
  }
}

for (const group of quoteUnit.groups) {
  assertText(group.intro, `quote group ${group.id}.intro`);
  assert.equal(group.items.length, 3, `quote group ${group.id} should include three short quotes`);
}

for (const group of proverbUnit.groups) {
  assert.equal(group.items.length, 3, `proverb group ${group.id} should include three short proverbs`);
}

for (const group of dialogueUnit.groups) {
  assert.ok(group.items.length >= 4 && group.items.length <= 6, `dialogue ${group.id} should stay very short`);
  for (const item of group.items) {
    for (const field of ["id", "speaker", "value", "meaning"]) {
      assertText(item[field], `dialogue item ${item.id}.${field}`);
    }
  }
}

for (const group of storyUnit.groups) {
  assert.ok(group.items.length >= 5 && group.items.length <= 8, `story ${group.id} should stay very short`);
  for (const item of group.items) {
    for (const field of ["id", "value", "meaning"]) {
      assertText(item[field], `story item ${item.id}.${field}`);
    }
  }
}

for (const item of [...quoteUnit.groups, ...proverbUnit.groups].flatMap((group) => group.items)) {
  for (const field of ["id", "value", "meaning", "lesson"]) {
    assertText(item[field], `quote/proverb item ${item.id}.${field}`);
  }
  assertText(item.reviewStatus, `quote/proverb item ${item.id}.reviewStatus`);
}

const vocabGroupById = Object.fromEntries(vocabGroups.map((group) => [group.id, group]));

function assertVocabTopic({ id, minItems, requiredMeanings, requiredValues = [] }) {
  const group = vocabGroupById[id];
  assert.ok(group, `vocab group ${id} should exist`);
  assert.ok(group.items.length >= minItems, `vocab group ${id} should include at least ${minItems} daily words`);

  for (const requiredValue of requiredValues) {
    assert.ok(
      group.items.some((item) => item.value === requiredValue),
      `vocab group ${id} should include ${requiredValue}`
    );
  }

  for (const requiredMeaning of requiredMeanings) {
    assert.ok(
      group.items.some((item) => item.meaning.includes(requiredMeaning)),
      `vocab group ${id} should include a word meaning ${requiredMeaning}`
    );
  }
}

assertVocabTopic({
  id: "family",
  minItems: 10,
  requiredMeanings: ["家庭", "儿子", "女儿", "哥哥", "弟弟"]
});
assertVocabTopic({
  id: "numbers",
  minItems: 10,
  requiredValues: ["ئون"],
  requiredMeanings: ["一", "五", "十"]
});
assertVocabTopic({
  id: "animals",
  minItems: 6,
  requiredMeanings: ["狗", "猫", "鱼", "鸟", "牛", "羊"]
});
assertVocabTopic({
  id: "vegetables",
  minItems: 6,
  requiredMeanings: ["番茄", "洋葱", "土豆", "胡萝卜", "大蒜", "黄瓜"]
});
assert.ok(vocabGroups.length >= 10 && vocabGroups.length <= 15, "vocab should include 10 to 15 compact daily topics");
for (const group of vocabGroups) {
  assert.ok(
    group.items.length >= 15 && group.items.length <= 45,
    `vocab group ${group.id} should include at least 15 words without becoming too large`
  );
  assertList(group.sections, `vocab group ${group.id} sections`);
  assert.ok(group.sections.length >= 2, `vocab group ${group.id} should be divided into smaller sections`);

  const sectionItemIds = group.sections.flatMap((section) => {
    assertText(section.id, `vocab group ${group.id} section id`);
    assertText(section.title, `vocab group ${group.id} section title`);
    assertList(section.itemIds, `vocab group ${group.id} section item ids`);
    return section.itemIds;
  });

  assertUnique(sectionItemIds, `vocab group ${group.id} section item ids`);
  assert.equal(
    [...sectionItemIds].sort().join("|"),
    group.items.map((item) => item.id).sort().join("|"),
    `vocab group ${group.id} sections should cover every word exactly once`
  );
}
const numberSectionTitles = vocabGroupById.numbers.sections.map((section) => section.title);
for (const title of ["1-10", "整十数", "大数"]) {
  assert.ok(numberSectionTitles.includes(title), `numbers should include ${title} section`);
}
assert.ok(!numberSectionTitles.includes("11-20"), "numbers should not include an 11-20 section");
assert.ok(
  !vocabGroupById.numbers.items.some((item) => /^十[一二三四五六七八九]$/.test(item.meaning)),
  "numbers should remove 11-19 words"
);
assert.ok(
  vocabGroupById.numbers.sections.some((section) => section.title === "整十数" && section.itemIds.includes("twenty")),
  "twenty should move into the tens section"
);
assert.ok(
  vocabGroupById.numbers.items.some((item) => item.meaning.includes("亿")),
  "numbers should include a large-number word for 亿"
);
const timeSectionTitles = vocabGroupById.time.sections.map((section) => section.title);
for (const title of ["基础时间", "星期", "月份"]) {
  assert.ok(timeSectionTitles.includes(title), `time should include ${title} section`);
}

for (const item of comboItems) {
  for (const field of ["id", "value", "latin", "type", "prompt", "rule", "hint", "review"]) {
    assertText(item[field], `combo item ${item.id}.${field}`);
  }
  assertList(item.parts, `combo item ${item.id}.parts`);
}

for (const item of vocabItems) {
  for (const field of [
    "id",
    "value",
    "latin",
    "meaning",
    "theme",
    "standardNote",
    "variantNote",
    "acceptableAnswer",
    "testPolicy",
    "reviewStatus",
    "sourceNote",
    "tip"
  ]) {
    assertText(item[field], `vocab item ${item.id}.${field}`);
  }
  assertList(item.parts, `vocab item ${item.id}.parts`);
  assert.equal(item.reviewStatus, "待母语者审校", `vocab item ${item.id} should remain explicitly queued for review`);
}

for (const item of practiceItems) {
  for (const field of ["id", "type", "value", "latin", "label", "hint", "audioStatus"]) {
    assertText(item[field], `practice item ${item.id}.${field}`);
  }
  assertList(item.parts, `practice item ${item.id}.parts`);
  assert.ok(item.audioStatus.includes("复用字母真人音频"), `practice item ${item.id} should disclose alphabet audio reuse`);
}

assertManifestMatches("prototype/assets/audio/human/alphabet/manifest.json", alphabetAudioItems.map((item) => ({
  id: item.letterId,
  letterId: item.letterId,
  value: letterDetails[item.letterId].letter,
  letter: letterDetails[item.letterId].letter,
  latin: letterDetails[item.letterId].latin
})), "alphabet");
assertManifestMatches("prototype/assets/audio/human/combos/manifest.json", comboItems, "combo", { exact: false });
assertManifestMatches("prototype/assets/audio/human/vocab/manifest.json", vocabItems, "vocab", { exact: false });
const readingAudioCourseItems = readingUnits.flatMap((unit) =>
  unit.groups.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      latin: item.pattern || item.speaker || unit.subtitle
    }))
  )
);
assertManifestMatches("prototype/assets/audio/human/reading/manifest.json", readingAudioCourseItems, "reading");
const practiceAudioManifest = JSON.parse(fs.readFileSync("prototype/assets/audio/human/practice/manifest.json", "utf8"));
assert.equal(practiceAudioManifest.status, "reuses_alphabet_human_audio", "practice audio manifest should document alphabet audio reuse");
assert.equal(practiceAudioManifest.items.length, 0, "practice audio manifest should not duplicate alphabet audio files");

console.log("course data integrity checks passed");
