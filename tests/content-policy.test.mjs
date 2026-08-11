import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("prototype/course-data/vocab-data.js", "utf8"), context, {
  filename: "prototype/course-data/vocab-data.js"
});

const vocabGroups = context.window.ANA_TILIM_VOCAB.vocabGroups;
const vocabItems = vocabGroups.flatMap((group) => group.items);
const bannedPattern = /assalamu|eleykum|waalaykum|ئەسسالام|ئەلەيكۇم/i;

assert.ok(!vocabItems.some((item) => [item.id, item.value, item.latin, item.meaning].some((value) => bannedPattern.test(String(value)))), "religious greeting entries should be removed without replacement");
assert.equal(vocabGroups.find((group) => group.id === "greetings")?.items.length, 12, "greetings should retain 12 entries after the approved xeyr removal");

console.log("content policy checks passed");
