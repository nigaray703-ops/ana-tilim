import assert from "node:assert/strict";

const SEGMENT_ID = Buffer.from([0x18, 0x53, 0x80, 0x67]);
const SEEK_HEAD_ID = Buffer.from([0x11, 0x4d, 0x9b, 0x74]);
const SEEK_ID = Buffer.from([0x4d, 0xbb]);
const SEEK_TARGET_ID = Buffer.from([0x53, 0xab]);
const SEEK_POSITION_ID = Buffer.from([0x53, 0xac]);
const INFO_ID = Buffer.from([0x15, 0x49, 0xa9, 0x66]);
const DURATION_ID = Buffer.from([0x44, 0x89]);
const VOID_ID = Buffer.from([0xec]);

function readEbmlVint(buffer, offset) {
  const firstByte = buffer[offset];
  let length = 1;
  let marker = 0x80;

  while (length <= 8 && !(firstByte & marker)) {
    length += 1;
    marker >>= 1;
  }

  assert.ok(length <= 8 && offset + length <= buffer.length, "WebM should contain a valid EBML integer");

  let bigValue = BigInt(firstByte & (marker - 1));
  for (let index = 1; index < length; index += 1) bigValue = (bigValue << 8n) | BigInt(buffer[offset + index]);
  const unknown = bigValue === (1n << BigInt(length * 7)) - 1n;
  assert.ok(unknown || bigValue <= BigInt(Number.MAX_SAFE_INTEGER), "WebM element size is too large");
  return { length, value: unknown ? null : Number(bigValue), unknown };
}

function readEbmlIdLength(buffer, offset) {
  const firstByte = buffer[offset];
  let length = 1;
  let marker = 0x80;
  while (length <= 4 && !(firstByte & marker)) {
    length += 1;
    marker >>= 1;
  }
  assert.ok(length <= 4 && offset + length <= buffer.length, "WebM should contain a valid element ID");
  return length;
}

function sameId(buffer, element, expected) {
  return element.idLength === expected.length && buffer.subarray(element.offset, element.offset + element.idLength).equals(expected);
}

function readElement(buffer, offset, boundary) {
  const idLength = readEbmlIdLength(buffer, offset);
  const sizeOffset = offset + idLength;
  const size = readEbmlVint(buffer, sizeOffset);
  const dataOffset = sizeOffset + size.length;
  const dataEnd = size.unknown ? boundary : dataOffset + size.value;
  assert.ok(dataOffset <= dataEnd && dataEnd <= boundary, "WebM element exceeds its container");
  return { offset, idLength, sizeOffset, sizeLength: size.length, sizeValue: size.value, sizeUnknown: size.unknown, dataOffset, dataEnd };
}

function readChildren(buffer, start, end) {
  const children = [];
  let offset = start;
  while (offset < end) {
    const element = readElement(buffer, offset, end);
    children.push(element);
    if (element.sizeUnknown) break;
    assert.ok(element.dataEnd > offset, "WebM element must advance");
    offset = element.dataEnd;
  }
  return children;
}

function findInfoStructure(buffer) {
  let segment;
  let rootOffset = 0;
  while (rootOffset < buffer.length) {
    const root = readElement(buffer, rootOffset, buffer.length);
    if (sameId(buffer, root, SEGMENT_ID)) {
      segment = root;
      break;
    }
    assert.equal(root.sizeUnknown, false, "WebM root element must have a finite size before Segment");
    rootOffset = root.dataEnd;
  }
  assert.ok(segment, "WebM should contain a Segment element");
  const children = readChildren(buffer, segment.dataOffset, segment.dataEnd);
  const infoIndex = children.findIndex((element) => sameId(buffer, element, INFO_ID));
  assert.notEqual(infoIndex, -1, "WebM should contain an Info element");
  return { segment, children, info: children[infoIndex], previous: children[infoIndex - 1] };
}

function encodeEbmlSize(value, length) {
  assert.ok(Number.isSafeInteger(value) && value >= 0, "WebM element size must be a safe integer");
  const maximum = (1n << BigInt(length * 7)) - 2n;
  assert.ok(BigInt(value) <= maximum, "WebM element size no longer fits its encoded length");
  let encoded = BigInt(value);
  const output = Buffer.alloc(length);
  for (let index = length - 1; index >= 0; index -= 1) {
    output[index] = Number(encoded & 0xffn);
    encoded >>= 8n;
  }
  output[0] |= 1 << (8 - length);
  return output;
}

function readUnsigned(buffer, start, end) {
  let value = 0;
  for (let offset = start; offset < end; offset += 1) value = value * 256 + buffer[offset];
  assert.ok(Number.isSafeInteger(value), "WebM unsigned integer is too large");
  return value;
}

function writeUnsigned(buffer, start, end, value) {
  assert.ok(Number.isSafeInteger(value) && value >= 0, "WebM unsigned integer must be a safe integer");
  let remaining = value;
  for (let offset = end - 1; offset >= start; offset -= 1) {
    buffer[offset] = remaining & 0xff;
    remaining = Math.floor(remaining / 256);
  }
  assert.equal(remaining, 0, "WebM unsigned integer no longer fits its encoded length");
}

export function readWebmDurationMilliseconds(buffer) {
  let info;
  try {
    ({ info } = findInfoStructure(buffer));
  } catch {
    assert.fail("WebM should contain a duration element");
  }
  const duration = readChildren(buffer, info.dataOffset, info.dataEnd).find((element) => sameId(buffer, element, DURATION_ID));
  assert.ok(duration, "WebM should contain a duration element");
  if (duration.sizeValue === 4) return buffer.readFloatBE(duration.dataOffset);
  if (duration.sizeValue === 8) return buffer.readDoubleBE(duration.dataOffset);
  assert.fail(`WebM duration should use 4 or 8 bytes, received ${duration.sizeValue}`);
}

export function injectWebmDurationMilliseconds(buffer, durationMs) {
  assert.ok(Buffer.isBuffer(buffer), "WebM input must be a Buffer");
  assert.ok(Number.isFinite(durationMs) && durationMs > 0, "WebM duration must be positive");
  const structure = findInfoStructure(buffer);
  const existing = readChildren(buffer, structure.info.dataOffset, structure.info.dataEnd)
    .find((element) => sameId(buffer, element, DURATION_ID));
  if (existing) return Buffer.from(buffer);

  const durationElement = Buffer.alloc(11);
  DURATION_ID.copy(durationElement, 0);
  durationElement[2] = 0x88;
  durationElement.writeDoubleBE(durationMs, 3);
  const previous = structure.previous;
  assert.ok(previous && sameId(buffer, previous, VOID_ID) && !previous.sizeUnknown, "WebM Info must follow a finite Void element");
  assert.ok(previous.sizeValue >= durationElement.length, "WebM Void is too small for a duration element");
  assert.equal(previous.dataEnd, structure.info.offset, "WebM Void must be adjacent to Info");
  assert.equal(structure.info.sizeUnknown, false, "WebM Info must have a finite size");

  const output = Buffer.from(buffer);
  const newInfoOffset = structure.info.offset - durationElement.length;
  const newVoidSize = previous.sizeValue - durationElement.length;
  const newInfoSize = structure.info.sizeValue + durationElement.length;
  encodeEbmlSize(newVoidSize, previous.sizeLength).copy(output, previous.sizeOffset);
  buffer.subarray(structure.info.offset, structure.info.offset + structure.info.idLength).copy(output, newInfoOffset);
  encodeEbmlSize(newInfoSize, structure.info.sizeLength).copy(output, newInfoOffset + structure.info.idLength);
  const newInfoDataOffset = newInfoOffset + structure.info.idLength + structure.info.sizeLength;
  durationElement.copy(output, newInfoDataOffset);
  buffer.subarray(structure.info.dataOffset, structure.info.dataEnd).copy(output, newInfoDataOffset + durationElement.length);

  const oldInfoPosition = structure.info.offset - structure.segment.dataOffset;
  const newInfoPosition = newInfoOffset - structure.segment.dataOffset;
  const seekHead = structure.children.find((element) => sameId(buffer, element, SEEK_HEAD_ID));
  if (seekHead) {
    for (const seek of readChildren(buffer, seekHead.dataOffset, seekHead.dataEnd).filter((element) => sameId(buffer, element, SEEK_ID))) {
      const parts = readChildren(buffer, seek.dataOffset, seek.dataEnd);
      const target = parts.find((element) => sameId(buffer, element, SEEK_TARGET_ID));
      const position = parts.find((element) => sameId(buffer, element, SEEK_POSITION_ID));
      if (!target || !position || !buffer.subarray(target.dataOffset, target.dataEnd).equals(INFO_ID)) continue;
      assert.equal(readUnsigned(buffer, position.dataOffset, position.dataEnd), oldInfoPosition, "WebM Info seek position is inconsistent");
      writeUnsigned(output, position.dataOffset, position.dataEnd, newInfoPosition);
    }
  }
  return output;
}

export function validateWebmBuffer(buffer, { minBytes = 4096 } = {}) {
  assert.ok(Buffer.isBuffer(buffer), "WebM input must be a Buffer");
  assert.ok(buffer.length > minBytes, `WebM should contain more than ${minBytes} bytes`);
  assert.deepEqual([...buffer.subarray(0, 4)], [0x1a, 0x45, 0xdf, 0xa3], "WebM header is invalid");

  const durationMs = readWebmDurationMilliseconds(buffer);
  assert.ok(Number.isFinite(durationMs) && durationMs > 0, "WebM duration must be positive");
  return { size: buffer.length, durationMs, mimeType: "audio/webm" };
}
