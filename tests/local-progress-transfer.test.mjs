import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const modulePath = "prototype/progress-transfer.js";
assert.ok(fs.existsSync(modulePath), "local progress transfer module should exist");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(modulePath, "utf8"), context, { filename: modulePath });

const api = context.window.ANA_TILIM_PROGRESS_TRANSFER;
const sample = {
  screen: "home",
  learningProgress: {
    latinWriting: { qwerty: { completed: true } },
    letters: { "dot-bone": { completed: true } }
  },
  preferences: { showLatin: true }
};
assert.throws(
  () => api.createExportPayload(sample),
  /导出版本标识无效/,
  "exports should require a trusted cn or global edition"
);
const payload = JSON.parse(JSON.stringify(api.createExportPayload(sample, { edition: "cn", brandName: "Uyghur Tili" })));

assert.equal(payload.format, "uyghur-tili-local-progress");
assert.equal(payload.version, 1);
assert.equal(payload.edition, "cn");
assert.equal(payload.brandName, "Uyghur Tili");
assert.deepEqual(payload.data, sample);
assert.ok(!Number.isNaN(Date.parse(payload.exportedAt)), "export should include a valid timestamp");

const importedEnvelope = JSON.parse(
  JSON.stringify(api.parseImportPayload(JSON.stringify(payload), { expectedEdition: "cn" }))
);
assert.deepEqual(importedEnvelope, payload, "a same-edition import should return a cloned complete envelope");
importedEnvelope.data.screen = "library";
assert.equal(payload.data.screen, "home", "the parsed envelope should not share data with the source payload");

assert.throws(
  () =>
    api.parseImportPayload(
      JSON.stringify({ ...payload, brandName: "Trusted Backup", edition: "cn" }),
      { expectedEdition: "global" }
    ),
  /备份属于 Uyghur Tili 国内版，不能导入 Ana Tilim 海外版/,
  "cross-edition errors should use trusted edition names instead of payload brandName"
);
assert.throws(
  () => api.parseImportPayload(JSON.stringify({ ...payload, edition: "global" }), { expectedEdition: "cn" }),
  /备份属于 Ana Tilim 海外版，不能导入 Uyghur Tili 国内版/
);
assert.throws(() => api.parseImportPayload("not-json"), /文件不是有效的 JSON/);
assert.throws(
  () => api.parseImportPayload(JSON.stringify({ format: "other", version: 99, data: null, edition: "other" })),
  /不是 Uyghur Tili 学习记录/,
  "format should be validated before version, data, and edition"
);
assert.throws(
  () =>
    api.parseImportPayload(
      JSON.stringify({ format: "uyghur-tili-local-progress", version: 99, data: null, edition: "other" })
    ),
  /版本暂不支持/,
  "version should be validated before data and edition"
);
assert.throws(
  () =>
    api.parseImportPayload(
      JSON.stringify({ format: "uyghur-tili-local-progress", version: 1, edition: "other" })
    ),
  /学习数据缺失/,
  "data should be validated before edition"
);
assert.throws(
  () => api.parseImportPayload(JSON.stringify({ ...payload, edition: "local" }), { expectedEdition: "cn" }),
  /学习记录版本标识无效/,
  "edition should allow only cn or global"
);

const currentProgressData = {
  screen: "profile",
  currentLetterId: "be",
  selectedGroupId: "dot-bone",
  currentComboItemId: "ba",
  selectedComboGroupId: "open-a",
  currentVocabItemId: "yaxshimusiz",
  selectedVocabGroupId: "greetings",
  currentPracticeItemId: "practice-listen-be",
  selectedPracticeGroupId: "listening-loop",
  selectedReadingUnitId: "sentence-patterns",
  selectedReadingGroupId: "sentence-this-that",
  selectedUnitId: "letters",
  favorite: true,
  learningProgress: {
    latinWriting: { qwerty: { completed: true } },
    letters: { "dot-bone": { viewed: true, completed: true } },
    combos: {},
    syllableTraining: {
      "two-letter-warmup": {
        completedIds: [
          "warmup-ba", "warmup-pa", "warmup-ta", "warmup-na", "warmup-la",
          "warmup-ma", "warmup-be-e", "warmup-pe-e", "warmup-te-e", "warmup-ne-e"
        ],
        completed: true
      },
      "vowel-nucleus": { completedIds: ["vowel-nucleus-01"], completed: false }
    },
    vocab: {},
    practice: { "listening-loop": { listen: true, listenCompletedIds: ["practice-listen-be"] } },
    reading: {}
  },
  mistakes: [
    {
      key: "letter:be",
      kind: "letter",
      kindLabel: "字母",
      targetId: "be",
      pickedId: "pe",
      value: "ب",
      latin: "b",
      source: "第一单元错题",
      note: "目标是 ب，你选了 پ",
      help: "看下方点数。",
      attempts: 1,
      createdAt: "2026-08-09T00:00:00.000Z"
    }
  ],
  writingChecks: ["shape", "dots", "spacing"],
  localProfile: { displayName: "学习者 <一>", avatarDataUrl: "" },
  preferences: { audioAutoplay: false, dailyGoal: 10, learningReminder: false, showLatin: true },
  dailyActivity: { date: "2026-08-09", completedIds: ["letters:dot-bone:viewed"] },
  modifiedAt: "2026-08-09T00:00:00.000Z",
  preferencesUpdatedAt: "2026-08-09T00:00:00.000Z",
  favoriteUpdatedAt: "2026-08-09T00:00:00.000Z"
};
const currentGlobalPayload = JSON.parse(
  JSON.stringify(api.createExportPayload(currentProgressData, { edition: "global", brandName: "Ana Tilim" }))
);
assert.deepEqual(
  JSON.parse(JSON.stringify(api.parseImportPayload(JSON.stringify(currentGlobalPayload), { expectedEdition: "global" }))),
  currentGlobalPayload,
  "the current complete global export should round-trip without losing nested progress"
);
assert.deepEqual(
  JSON.parse(
    JSON.stringify(
      api.parseImportPayload(
        JSON.stringify({
          ...currentGlobalPayload,
          futureEnvelopeField: { retained: true },
          data: { ...currentGlobalPayload.data, futureDataField: { retained: true } }
        }),
        { expectedEdition: "global" }
      )
    )
  ).data.futureDataField,
  { retained: true },
  "unknown top-level v1 data fields should remain import-compatible and be ignored by the app"
);

function envelopeWithData(data) {
  return JSON.stringify({
    format: "uyghur-tili-local-progress",
    version: 1,
    exportedAt: "2026-08-09T00:00:00.000Z",
    edition: "global",
    brandName: "Untrusted display brand",
    data
  });
}

const malformedNestedCases = [
  [
    "unknown progress scopes remain rejected",
    { learningProgress: { futureScope: {} } },
    /learningProgress 包含未知字段 futureScope/
  ],
  [
    "a learning progress bucket must be a plain object",
    { learningProgress: { letters: "bad" } },
    /learningProgress\.letters 必须是对象/
  ],
  [
    "a learning progress entry must be a plain object",
    { learningProgress: { letters: { "dot-bone": [] } } },
    /learningProgress\.letters\.dot-bone 必须是对象/
  ],
  [
    "a progress step must be boolean",
    { learningProgress: { letters: { "dot-bone": { completed: "yes" } } } },
    /learningProgress\.letters\.dot-bone\.completed 必须是布尔值/
  ],
  [
    "a progress entry must reject unknown value keys",
    { learningProgress: { letters: { "dot-bone": { futureHtml: "<img onerror=1>" } } } },
    /learningProgress\.letters\.dot-bone 包含未知字段 futureHtml/
  ],
  [
    "syllable submitted IDs must be an array",
    { learningProgress: { syllableTraining: { "two-letter-warmup": { completedIds: "warmup-ba" } } } },
    /learningProgress\.syllableTraining\.two-letter-warmup\.completedIds 必须是数组/
  ],
  [
    "syllable submitted IDs must be unique",
    { learningProgress: { syllableTraining: { "two-letter-warmup": { completedIds: ["warmup-ba", "warmup-ba"] } } } },
    /learningProgress\.syllableTraining\.two-letter-warmup\.completedIds 不能包含重复 ID/
  ],
  ["mistakes must be an array", { mistakes: {} }, /mistakes 必须是数组/],
  [
    "mistake display values must be strings",
    { mistakes: [{ ...currentProgressData.mistakes[0], value: { html: "<img onerror=1>" } }] },
    /mistakes\[0\]\.value 必须是字符串/
  ],
  ["writing checks must be an array", { writingChecks: "shape" }, /writingChecks 必须是数组/],
  ["writing check values must be strings", { writingChecks: ["shape", {}] }, /writingChecks\[1\] 必须是字符串/],
  ["the local profile must be a plain object", { localProfile: [] }, /localProfile 必须是对象/],
  ["the local display name must be a string", { localProfile: { displayName: 42 } }, /localProfile\.displayName 必须是字符串/],
  ["preferences must be a plain object", { preferences: [] }, /preferences 必须是对象/],
  ["preference booleans must stay boolean", { preferences: { showLatin: "yes" } }, /preferences\.showLatin 必须是布尔值/],
  ["daily goals must use a supported number", { preferences: { dailyGoal: 7 } }, /preferences\.dailyGoal 必须是 5、10 或 15/],
  ["daily activity must be a plain object", { dailyActivity: [] }, /dailyActivity 必须是对象/],
  ["daily completed IDs must be an array", { dailyActivity: { date: "", completedIds: "bad" } }, /dailyActivity\.completedIds 必须是数组/],
  ["daily completed IDs must be strings", { dailyActivity: { date: "", completedIds: [false] } }, /dailyActivity\.completedIds\[0\] 必须是字符串/]
];

for (const [label, data, expectedError] of malformedNestedCases) {
  assert.throws(
    () => api.parseImportPayload(envelopeWithData(data), { expectedEdition: "global" }),
    expectedError,
    label
  );
}

for (const field of [
  "screen",
  "currentLetterId",
  "selectedGroupId",
  "currentComboItemId",
  "selectedComboGroupId",
  "currentVocabItemId",
  "selectedVocabGroupId",
  "currentPracticeItemId",
  "selectedPracticeGroupId",
  "selectedReadingUnitId",
  "selectedReadingGroupId",
  "selectedUnitId"
]) {
  assert.throws(
    () => api.parseImportPayload(envelopeWithData({ [field]: 42 }), { expectedEdition: "global" }),
    new RegExp(`${field} 必须是字符串`),
    `${field} should reject a non-string navigation value`
  );
}

assert.deepEqual(
  JSON.parse(JSON.stringify(api.parseImportPayload(envelopeWithData({}), { expectedEdition: "global" }).data)),
  {},
  "a legal partial v1 backup should keep missing fields compatible with clean app defaults"
);

console.log("local progress import and export checks passed");
