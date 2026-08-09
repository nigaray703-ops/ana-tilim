import assert from "node:assert/strict";

function readEbmlVint(buffer, offset) {
  const firstByte = buffer[offset];
  let length = 1;
  let marker = 0x80;

  while (length <= 8 && !(firstByte & marker)) {
    length += 1;
    marker >>= 1;
  }

  assert.ok(length <= 8 && offset + length <= buffer.length, "WebM should contain a valid EBML integer");

  let value = firstByte & (marker - 1);
  for (let index = 1; index < length; index += 1) value = value * 256 + buffer[offset + index];
  return { length, value };
}

export function readWebmDurationMilliseconds(buffer) {
  const durationId = Buffer.from([0x44, 0x89]);
  const durationOffset = buffer.indexOf(durationId);
  assert.notEqual(durationOffset, -1, "WebM should contain a duration element");

  const size = readEbmlVint(buffer, durationOffset + durationId.length);
  const valueOffset = durationOffset + durationId.length + size.length;
  if (size.value === 4) return buffer.readFloatBE(valueOffset);
  if (size.value === 8) return buffer.readDoubleBE(valueOffset);
  assert.fail(`WebM duration should use 4 or 8 bytes, received ${size.value}`);
}

export function validateWebmBuffer(buffer, { minBytes = 4096 } = {}) {
  assert.ok(Buffer.isBuffer(buffer), "WebM input must be a Buffer");
  assert.deepEqual([...buffer.subarray(0, 4)], [0x1a, 0x45, 0xdf, 0xa3], "WebM header is invalid");
  assert.ok(buffer.length > minBytes, `WebM should contain more than ${minBytes} bytes`);

  const durationMs = readWebmDurationMilliseconds(buffer);
  assert.ok(Number.isFinite(durationMs) && durationMs > 0, "WebM duration must be positive");
  return { size: buffer.length, durationMs, mimeType: "audio/webm" };
}
