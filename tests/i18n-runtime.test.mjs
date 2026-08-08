import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const context = { console, window: {} };
context.globalThis = context;
vm.createContext(context);

for (const path of ["prototype/i18n/ui-messages.js", "prototype/i18n/runtime.js"]) {
  vm.runInContext(fs.readFileSync(path, "utf8"), context, { filename: path });
}

const api = context.window.ANA_TILIM_I18N;
const messageCatalogs = context.window.ANA_TILIM_UI_MESSAGES;
assert.deepEqual(
  Object.keys(messageCatalogs.zh).sort(),
  Object.keys(messageCatalogs.en).sort(),
  "Chinese and English UI catalogs should expose exactly the same keys"
);
for (const [language, catalog] of Object.entries(messageCatalogs)) {
  for (const [key, value] of Object.entries(catalog)) {
    assert.equal(typeof value, "string", `${language}.${key} should be a string`);
    assert.ok(value.trim(), `${language}.${key} should not be empty`);
  }
}
assert.equal(api.resolveLanguage(null, ["zh-CN", "en-NZ"]), "zh");
assert.equal(api.resolveLanguage(null, ["en-NZ", "zh-CN"]), "en");
assert.equal(api.resolveLanguage(null, ["zh-TW"]), "zh");
assert.equal(api.resolveLanguage(null, ["en-US"]), "en");
assert.equal(api.resolveLanguage(null, ["fr-FR"]), "en");
assert.equal(api.resolveLanguage(null, []), "en");
assert.equal(
  api.resolveLanguage(null, [], "zh-CN"),
  "zh",
  "an empty navigator.languages list should fall back to navigator.language"
);
assert.equal(api.resolveLanguage("en", ["zh-CN"]), "en");
assert.equal(api.resolveLanguage("zh", ["en-US"]), "zh");
assert.equal(api.resolveLanguage("de", ["zh-CN"]), "zh");
assert.equal(api.readSavedLanguage('{"preferences":{"uiLanguage":"en"}}'), "en");
assert.equal(api.readSavedLanguage("damaged"), null);

api.setLanguage("en");
assert.equal(api.getLanguage(), "en");
assert.equal(api.t("nav.home"), "Home");
assert.equal(api.t("progress.count", { completed: 3, total: 10 }), "3 of 10 complete");
assert.equal(api.t("missing.key"), "");
api.setLanguage("zh");
assert.equal(api.t("nav.home"), "首页");
