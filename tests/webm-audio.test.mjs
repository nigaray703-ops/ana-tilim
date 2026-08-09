import assert from "node:assert/strict";
import fs from "node:fs";
import { readWebmDurationMilliseconds, validateWebmBuffer } from "../tools/lib/webm-audio.mjs";

const valid = fs.readFileSync("prototype/assets/audio/human/alphabet/human_letter_01_b.webm");
const result = validateWebmBuffer(valid);
assert.equal(result.mimeType, "audio/webm");
assert.equal(result.size, valid.length);
assert.ok(result.durationMs > 0);
assert.equal(readWebmDurationMilliseconds(valid), result.durationMs);

assert.throws(() => validateWebmBuffer(Buffer.from("not-webm")), /WebM header/);
assert.throws(() => validateWebmBuffer(valid.subarray(0, 100)), /4096 bytes/);
assert.throws(() => validateWebmBuffer(Buffer.concat([valid.subarray(0, 4), Buffer.alloc(5000)])), /duration/);
