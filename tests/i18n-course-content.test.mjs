import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const scriptPaths = [
  "prototype/uly-transliteration.js",
  "prototype/course-data/alphabet-data.js",
  "prototype/course-data/combo-data.js",
  "prototype/course-data/vocab-data.js",
  "prototype/course-data/practice-data.js",
  "prototype/course-data/reading-data.js",
  "prototype/course-data.js",
  "prototype/i18n/ui-messages.js",
  "prototype/i18n/alphabet-en.js",
  "prototype/i18n/combo-en.js",
  "prototype/i18n/vocab-en.js",
  "prototype/i18n/course-en.js",
  "prototype/i18n/runtime.js"
];

for (const scriptPath of scriptPaths) {
  assert.ok(fs.existsSync(scriptPath), `${scriptPath} should exist`);
}

const context = { console, window: {} };
context.globalThis = context;
vm.createContext(context);

for (const scriptPath of scriptPaths) {
  vm.runInContext(fs.readFileSync(scriptPath, "utf8"), context, { filename: scriptPath });
}

const course = context.window.ANA_TILIM_COURSE;
const english = context.window.ANA_TILIM_COURSE_EN;
const i18n = context.window.ANA_TILIM_I18N;

assert.ok(course, "base course data should load");
assert.ok(english?.alphabet, "the focused English alphabet catalog should load");
assert.ok(english?.combos, "the focused English combination catalog should load");
assert.ok(english?.vocab, "the focused English vocabulary catalog should load");
assert.ok(i18n?.createCourseLocalizer, "the i18n runtime should create course localizers");
for (const catalogName of ["practice", "reading"]) {
  assert.deepEqual(
    Object.keys(english[catalogName] || {}),
    [],
    `${catalogName} may remain empty until its focused localization task`
  );
}

const detailFields = ["type", "cue", "connection", "soundHint", "writingHint", "example"];
const formFields = ["label"];
const exampleFields = ["label", "meaning", "noteTitle", "note"];
const comboGroupFields = ["title", "goal", "status"];
const comboItemFields = ["type", "rule", "hint", "review"];
const vocabGroupFields = ["title", "goal", "status"];
const alphabetEnglish = english.alphabet;
const comboEnglish = english.combos;
const vocabEnglish = english.vocab;

assert.equal(Object.keys(alphabetEnglish.letterDetails).length, 32);
assert.equal(Object.keys(alphabetEnglish.groups).length, 11);
assert.equal(Object.keys(comboEnglish.groups).length, 4);
assert.equal(Object.keys(comboEnglish.items).length, 34);
assert.equal(comboEnglish.groups["open-a"].title, "Open-vowel combinations: ا");
assert.equal(comboEnglish.items.ba.type, "Two-letter combination");
assert.equal(comboEnglish.items["dada-connection"].meaning, "Dad; a family form of address");
assert.equal(Object.keys(vocabEnglish.groups).length, 12);
assert.equal(
  Object.values(vocabEnglish.groups).reduce((count, group) => count + Object.keys(group.sections || {}).length, 0),
  28
);
assert.equal(Object.keys(vocabEnglish.items).length, 209);
assert.equal(vocabEnglish.groups.greetings.title, "Greetings");
assert.equal(vocabEnglish.items.yaxshimusiz.meaning, "Hello; how are you?");
assert.equal(vocabEnglish.items.men.meaning, "I; me");
assert.equal(vocabEnglish.items["ana-family"].meaning, "Mother; mum");
assert.equal(vocabEnglish.items.one.meaning, "One");

for (const group of course.comboGroups) {
  const translatedGroup = comboEnglish.groups[group.id];
  assert.ok(translatedGroup, `English combination groups should include ${group.id}`);
  for (const field of comboGroupFields) {
    assert.equal(typeof translatedGroup[field], "string", `English combination group ${group.id}.${field} should be text`);
    assert.ok(translatedGroup[field].trim(), `English combination group ${group.id}.${field} should not be empty`);
  }

  for (const item of group.items) {
    const translatedItem = comboEnglish.items[item.id];
    assert.ok(translatedItem, `English combination items should include ${item.id}`);
    for (const field of comboItemFields) {
      assert.equal(typeof translatedItem[field], "string", `English combination item ${item.id}.${field} should be text`);
      assert.ok(translatedItem[field].trim(), `English combination item ${item.id}.${field} should not be empty`);
    }
    if (Object.prototype.hasOwnProperty.call(item, "meaning")) {
      assert.equal(typeof translatedItem.meaning, "string", `English combination item ${item.id}.meaning should be text`);
      assert.ok(translatedItem.meaning.trim(), `English combination item ${item.id}.meaning should not be empty`);
    }
  }
}

let translatedVocabSectionCount = 0;
let translatedVocabItemCount = 0;
for (const group of course.vocabGroups) {
  const translatedGroup = vocabEnglish.groups[group.id];
  assert.ok(translatedGroup, `English vocabulary groups should include ${group.id}`);
  for (const field of vocabGroupFields) {
    assert.equal(typeof translatedGroup[field], "string", `English vocabulary group ${group.id}.${field} should be text`);
    assert.ok(translatedGroup[field].trim(), `English vocabulary group ${group.id}.${field} should not be empty`);
  }

  for (const section of group.sections) {
    const translatedSection = translatedGroup.sections?.[section.id];
    assert.ok(translatedSection, `English vocabulary group ${group.id} should include section ${section.id}`);
    assert.equal(typeof translatedSection.title, "string", `English vocabulary section ${group.id}.${section.id}.title should be text`);
    assert.ok(translatedSection.title.trim(), `English vocabulary section ${group.id}.${section.id}.title should not be empty`);
    translatedVocabSectionCount += 1;
  }

  for (const item of group.items) {
    const translatedItem = vocabEnglish.items[item.id];
    assert.ok(translatedItem, `English vocabulary items should include ${item.id}`);
    assert.equal(typeof translatedItem.meaning, "string", `English vocabulary item ${item.id}.meaning should be text`);
    assert.ok(translatedItem.meaning.trim(), `English vocabulary item ${item.id}.meaning should not be empty`);
    if (typeof item.tip === "string" && item.tip.trim()) {
      assert.equal(typeof translatedItem.note, "string", `English vocabulary item ${item.id}.note should cover its Chinese tip`);
      assert.ok(translatedItem.note.trim(), `English vocabulary item ${item.id}.note should not be empty`);
    }
    translatedVocabItemCount += 1;
  }
}

assert.equal(translatedVocabSectionCount, 28);
assert.equal(translatedVocabItemCount, 209);

let translatedFormCount = 0;
let translatedFormExampleCount = 0;
for (const [letterId, letter] of Object.entries(course.letterDetails)) {
  const translatedLetter = alphabetEnglish.letterDetails[letterId];
  assert.ok(translatedLetter, `English alphabet details should include ${letterId}`);
  for (const field of detailFields) {
    assert.equal(typeof translatedLetter[field], "string", `English ${letterId}.${field} should be text`);
    assert.ok(translatedLetter[field].trim(), `English ${letterId}.${field} should not be empty`);
  }

  for (const form of letter.forms) {
    const translatedForm = translatedLetter.forms?.[form.id];
    assert.ok(translatedForm, `English ${letterId} should include form ${form.id}`);
    for (const field of formFields) {
      assert.equal(typeof translatedForm[field], "string", `English ${letterId}.${form.id}.${field} should be text`);
      assert.ok(translatedForm[field].trim(), `English ${letterId}.${form.id}.${field} should not be empty`);
    }
    translatedFormCount += 1;
  }

  for (const example of letter.formExamples) {
    const translatedExample = translatedLetter.formExamples?.[example.id];
    assert.ok(translatedExample, `English ${letterId} should include form example ${example.id}`);
    for (const field of exampleFields) {
      if (Object.prototype.hasOwnProperty.call(example, field)) {
        assert.equal(typeof translatedExample[field], "string", `English ${example.id}.${field} should be text`);
        assert.ok(translatedExample[field].trim(), `English ${example.id}.${field} should not be empty`);
      }
    }
    translatedFormExampleCount += 1;
  }
}

for (const group of course.alphabetGroups) {
  const translatedGroup = alphabetEnglish.groups[group.id];
  assert.ok(translatedGroup, `English alphabet groups should include ${group.id}`);
  for (const field of ["title", "goal", "status"]) {
    assert.equal(typeof translatedGroup[field], "string", `English group ${group.id}.${field} should be text`);
    assert.ok(translatedGroup[field].trim(), `English group ${group.id}.${field} should not be empty`);
  }
}

assert.equal(translatedFormCount, 126);
assert.equal(translatedFormExampleCount, 126);

function translatableSnapshot() {
  return JSON.stringify({
    letterDetails: Object.fromEntries(
      Object.entries(course.letterDetails).map(([letterId, letter]) => [
        letterId,
        {
          ...Object.fromEntries(detailFields.map((field) => [field, letter[field]])),
          forms: letter.forms.map((form) => ({ id: form.id, label: form.label })),
          formExamples: letter.formExamples.map((example) => ({
            id: example.id,
            ...Object.fromEntries(
              exampleFields
                .filter((field) => Object.prototype.hasOwnProperty.call(example, field))
                .map((field) => [field, example[field]])
            )
          }))
        }
      ])
    ),
    groups: course.alphabetGroups.map((group) => ({
      id: group.id,
      title: group.title,
      goal: group.goal,
      status: group.status
    }))
  });
}

function protectedSnapshot() {
  return JSON.stringify({
    letters: Object.fromEntries(
      Object.entries(course.letterDetails).map(([letterId, letter]) => [
        letterId,
        {
          letter: letter.letter,
          latin: letter.latin,
          forms: letter.forms.map((form) => ({ id: form.id, value: form.value })),
          formExamples: letter.formExamples.map((example) => ({
            id: example.id,
            form: example.form,
            word: example.word,
            latin: example.latin,
            targetStart: example.targetStart,
            targetLength: example.targetLength
          }))
        }
      ])
    ),
    groupOrder: course.alphabetGroups.map((group) => ({
      id: group.id,
      letterIds: group.letters.map((letter) => letter.id)
    }))
  });
}

function comboTranslatableSnapshot() {
  return JSON.stringify(
    course.comboGroups.map((group) => ({
      id: group.id,
      ...Object.fromEntries(comboGroupFields.map((field) => [field, group[field]])),
      items: group.items.map((item) => ({
        id: item.id,
        ...Object.fromEntries(
          [...comboItemFields, "meaning"]
            .filter((field) => Object.prototype.hasOwnProperty.call(item, field))
            .map((field) => [field, item[field]])
        )
      }))
    }))
  );
}

function comboProtectedSnapshot() {
  return JSON.stringify(
    course.comboGroups.map((group) => ({
      id: group.id,
      letters: group.letters,
      items: group.items.map(({ id, value, latin, parts, prompt }) => ({ id, value, latin, parts, prompt }))
    }))
  );
}

function vocabTranslatableSnapshot() {
  return JSON.stringify(
    course.vocabGroups.map((group) => ({
      id: group.id,
      ...Object.fromEntries(vocabGroupFields.map((field) => [field, group[field]])),
      sections: group.sections.map(({ id, title }) => ({ id, title })),
      items: group.items.map(({ id, meaning, tip }) => ({ id, meaning, tip }))
    }))
  );
}

function vocabProtectedSnapshot() {
  return JSON.stringify(
    course.vocabGroups.map((group) => ({
      id: group.id,
      kind: group.kind,
      letters: group.letters,
      sections: group.sections.map(({ id, itemIds }) => ({ id, itemIds })),
      items: group.items.map(({ id, value, latin, parts }) => ({ id, value, latin, parts }))
    }))
  );
}

const originalChinese = translatableSnapshot();
const originalProtectedValues = protectedSnapshot();
const originalChineseCombos = comboTranslatableSnapshot();
const originalProtectedCombos = comboProtectedSnapshot();
const originalChineseVocab = vocabTranslatableSnapshot();
const originalProtectedVocab = vocabProtectedSnapshot();
const originalLetterDetails = course.letterDetails;
const originalGroups = course.alphabetGroups;
const originalBe = course.letterDetails.be;
const originalBeForms = originalBe.forms;
const originalBeExamples = originalBe.formExamples;
const originalVocabGroups = course.vocabGroups;
const originalGreetingGroup = course.vocabGroups[0];
const originalGreetingSections = originalGreetingGroup.sections;
const originalGreetingItems = originalGreetingGroup.items;
const originalYaxshimusiz = originalGreetingItems[0];

const localizer = i18n.createCourseLocalizer(course, english);
assert.deepEqual(Array.from(localizer.missingEnglish()), []);

localizer.apply("en");
assert.equal(course.letterDetails.be.type, "Consonant");
assert.equal(course.letterDetails.be.cue, "One dot below");
assert.equal(course.letterDetails.pe.cue, "Three dots below");
assert.equal(course.letterDetails.te.cue, "Two dots above");
assert.equal(course.letterDetails.be.forms[0].label, "Isolated form");
assert.equal(course.letterDetails.be.formExamples[0].meaning, "book");
assert.equal(course.comboGroups[0].title, "Open-vowel combinations: ا");
assert.equal(course.comboGroups[0].items[0].type, "Two-letter combination");
assert.equal(course.comboGroups[3].items[0].meaning, "Dad; a family form of address");
assert.equal(course.vocabGroups[0].title, "Greetings");
assert.equal(course.vocabGroups[0].sections[0].title, "Everyday greetings");
assert.equal(course.vocabGroups[0].items[0].meaning, "Hello; how are you?");
assert.equal(course.vocabGroups[0].items[0].tip, "Break it into three parts: ياخشى, مۇ, and سىز.");
assert.strictEqual(course.letterDetails, originalLetterDetails, "localization should preserve the detail map");
assert.strictEqual(course.alphabetGroups, originalGroups, "localization should preserve the group array");
assert.strictEqual(course.letterDetails.be, originalBe, "localization should preserve letter objects");
assert.strictEqual(course.letterDetails.be.forms, originalBeForms, "localization should preserve form arrays");
assert.strictEqual(course.letterDetails.be.formExamples, originalBeExamples, "localization should preserve example arrays");
assert.strictEqual(course.vocabGroups, originalVocabGroups, "localization should preserve the vocabulary group array");
assert.strictEqual(course.vocabGroups[0], originalGreetingGroup, "localization should preserve vocabulary group objects");
assert.strictEqual(course.vocabGroups[0].sections, originalGreetingSections, "localization should preserve vocabulary section arrays");
assert.strictEqual(course.vocabGroups[0].items, originalGreetingItems, "localization should preserve vocabulary item arrays");
assert.strictEqual(course.vocabGroups[0].items[0], originalYaxshimusiz, "localization should preserve vocabulary item objects");
assert.equal(protectedSnapshot(), originalProtectedValues, "localization should not change glyphs, ULY, form values, words, targets, ids, or order");
assert.equal(comboProtectedSnapshot(), originalProtectedCombos, "localization should not change combination ids, order, Uyghur, ULY, parts, or prompts");
assert.equal(vocabProtectedSnapshot(), originalProtectedVocab, "localization should not change vocabulary ids, order, Uyghur, ULY, parts, or section membership");
assert.ok(!/[\u3400-\u9fff]/u.test(translatableSnapshot()), "English alphabet course text should not contain CJK characters");
assert.ok(!/[\u3400-\u9fff]/u.test(comboTranslatableSnapshot()), "English combination course text should not contain CJK characters");
assert.ok(!/[\u3400-\u9fff]/u.test(vocabTranslatableSnapshot()), "English vocabulary course text should not contain CJK characters");

localizer.apply("zh");
assert.equal(translatableSnapshot(), originalChinese, "returning to Chinese should restore every original alphabet string exactly");
assert.equal(protectedSnapshot(), originalProtectedValues, "returning to Chinese should preserve protected course values");
assert.equal(comboTranslatableSnapshot(), originalChineseCombos, "returning to Chinese should restore every original combination string exactly");
assert.equal(comboProtectedSnapshot(), originalProtectedCombos, "returning to Chinese should preserve protected combination values");
assert.equal(vocabTranslatableSnapshot(), originalChineseVocab, "returning to Chinese should restore every original vocabulary string exactly");
assert.equal(vocabProtectedSnapshot(), originalProtectedVocab, "returning to Chinese should preserve protected vocabulary values");

console.log("English alphabet, combination, and vocabulary catalogs and in-place localization checks passed");
