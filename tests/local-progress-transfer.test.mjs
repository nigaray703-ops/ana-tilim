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
const payload = JSON.parse(JSON.stringify(api.createExportPayload(sample, { edition: "cn", brandName: "Uyghur Tili" })));

assert.equal(payload.format, "uyghur-tili-local-progress");
assert.equal(payload.version, 1);
assert.equal(payload.edition, "cn");
assert.equal(payload.brandName, "Uyghur Tili");
assert.deepEqual(payload.data, sample);
assert.ok(!Number.isNaN(Date.parse(payload.exportedAt)), "export should include a valid timestamp");

assert.deepEqual(
  JSON.parse(JSON.stringify(api.parseImportPayload(JSON.stringify(payload)))),
  sample,
  "a valid export should round-trip"
);
assert.throws(() => api.parseImportPayload("not-json"), /文件不是有效的 JSON/);
assert.throws(() => api.parseImportPayload(JSON.stringify({ format: "other", data: {} })), /不是 Uyghur Tili 学习记录/);
assert.throws(() => api.parseImportPayload(JSON.stringify({ format: "uyghur-tili-local-progress", version: 99, data: {} })), /版本暂不支持/);
assert.throws(() => api.parseImportPayload(JSON.stringify({ format: "uyghur-tili-local-progress", version: 1 })), /学习数据缺失/);

console.log("local progress import and export checks passed");
