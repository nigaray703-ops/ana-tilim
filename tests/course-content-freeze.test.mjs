import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { loadCourseData } from "../tools/import-form-example-audio.mjs";
import { buildRecordingCatalog } from "../tools/recording-studio/catalog.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const freezePath = path.join(projectRoot, "课程/课程内容冻结清单.md");
assert.ok(fs.existsSync(freezePath), "the final course release should have a content freeze record");
const freeze = fs.readFileSync(freezePath, "utf8");
assert.match(freeze, /内容状态：\*\*已冻结\*\*/);

const course = loadCourseData();
assert.equal(course.alphabetLetters.length, 32);
assert.equal(Object.values(course.letterDetails).flatMap((detail) => detail.forms).length, 126);
assert.equal(course.comboGroups.flatMap((group) => group.items).length, 34);
assert.equal(course.vocabGroups.flatMap((group) => group.items).length, 206);
assert.equal(course.practiceGroups.flatMap((group) => group.items).length, 128);
assert.equal(course.readingUnits.flatMap((unit) => unit.groups.flatMap((group) => group.items)).length, 192);
assert.equal(course.afantiStories.length, 6);

const catalog = buildRecordingCatalog({ projectRoot });
assert.equal(catalog.targets.length, 554, "the frozen release should expose the complete deduplicated recording catalog");
assert.equal(catalog.targets.some((target) => target.stableId === "vocab:marhaba" || target.stableId === "vocab:xeyr"), false);
assert.ok(catalog.targets.some((target) => target.stableId === "vocab:erzimaydu"));

const finalContract = JSON.parse(fs.readFileSync(path.join(projectRoot, "课程/语法与基础句型/final-reading-additions.json"), "utf8"));
assert.equal(finalContract.releaseStatus, "approved");
assert.equal(JSON.stringify(finalContract).includes("pending-audio"), false);

for (const requiredStatement of ["12 个单元", "11 个单元", "554 个真人录音目标", "590 个课程内容绑定", "不冒充母语者"]) {
  assert.ok(freeze.includes(requiredStatement), `freeze record should state: ${requiredStatement}`);
}

console.log("final course content freeze checks passed");
