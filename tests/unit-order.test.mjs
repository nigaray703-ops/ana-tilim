import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const modulePath = "prototype/unit-order.js";
assert.ok(fs.existsSync(modulePath), "unit order module should exist");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(modulePath, "utf8"), context, { filename: modulePath });

const api = context.window.ANA_TILIM_UNIT_ORDER;
assert.ok(api, "ANA_TILIM_UNIT_ORDER should be defined");

const catalog = [
  "letters", "latin-keyboard-writing", "combos", "syllable-training",
  "basic-phrases", "grammar-basics", "sentence-patterns", "dialogue-theater",
  "short-stories", "uyghur-proverbs", "famous-quotes", "afanti-stories"
].map((id) => ({ id }));

const visibleUnitIds = (config) => JSON.parse(JSON.stringify(
  api.buildVisibleUnits(catalog, config).map((unit) => unit.id)
));

assert.deepEqual(visibleUnitIds({ hiddenUnitIds: [] }), catalog.map((unit) => unit.id));
assert.deepEqual(visibleUnitIds({ hiddenUnitIds: ["famous-quotes"] }), [
  "letters", "latin-keyboard-writing", "combos", "syllable-training",
  "basic-phrases", "grammar-basics", "sentence-patterns", "dialogue-theater",
  "short-stories", "uyghur-proverbs", "afanti-stories"
]);
assert.equal(api.nextUnitId("uyghur-proverbs", api.buildVisibleUnits(catalog, { hiddenUnitIds: [] })), "famous-quotes");
assert.equal(api.nextUnitId("uyghur-proverbs", api.buildVisibleUnits(catalog, { hiddenUnitIds: ["famous-quotes"] })), "afanti-stories");
assert.equal(api.nextUnitId("afanti-stories", api.buildVisibleUnits(catalog, { hiddenUnitIds: [] })), null);

console.log("unit order checks passed");
