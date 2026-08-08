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
  learningProgress: { letters: { "dot-bone": { completed: true } } },
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

console.log("local progress import and export checks passed");
