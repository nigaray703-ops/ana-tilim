import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const modulePath = "prototype/latin-keyboard.js";
assert.ok(fs.existsSync(modulePath), "focused Latin keyboard module should exist");

const context = { window: {} };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(modulePath, "utf8"), context, { filename: modulePath });

const api = context.window.ANA_TILIM_LATIN_KEYBOARD;
assert.ok(api, "Latin keyboard module should expose ANA_TILIM_LATIN_KEYBOARD");
assert.deepEqual(JSON.parse(JSON.stringify(api.ROWS)), ["qwertyuiop", "asdfghjkl", "zxcvbnm"]);
assert.deepEqual(JSON.parse(JSON.stringify(api.EXTENDED_KEYS)), ["ë", "ö", "ü"]);
assert.equal(Object.isFrozen(api), true, "Latin keyboard API should be immutable at its public boundary");
assert.equal(api.applyKey("", { key: "Q" }), "q");
assert.equal(
  "QWERTY".split("").reduce((value, key) => api.applyKey(value, { key }), ""),
  "qwerty"
);
assert.equal(api.applyKey("qwerty", { key: "Backspace" }), "qwert");
assert.equal(api.applyKey("q", { key: " " }), "q ");
assert.equal(api.applyKey("q", { key: "A", metaKey: true }), "q");
assert.equal(api.applyKey("q", { key: "A", ctrlKey: true }), "q");
assert.equal(api.applyKey("q", { key: "A", altKey: true }), "q");
assert.equal(api.applyKey("q", { key: "ë" }), "q", "extended letters should require an explicit extended key");
assert.equal(api.applyExtendedKey("k", "ë"), "kë");
assert.equal(api.applyExtendedKey("k", "ö"), "kö");
assert.equal(api.applyExtendedKey("k", "ü"), "kü");
assert.equal(api.applyExtendedKey("k", "ئ"), "k", "unknown extended keys should be ignored");

const outputs = [
  "QWERTY".split("").reduce((value, key) => api.applyKey(value, { key }), ""),
  api.applyKey("q", { key: " " }),
  ...api.EXTENDED_KEYS.map((key) => api.applyExtendedKey("k", key))
];
for (const output of outputs) {
  assert.doesNotMatch(output, /[\u0600-\u06ff]/u, "Latin keyboard output must not contain Arabic Unicode");
}

console.log("Latin keyboard checks passed");
