import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  injectWebmDurationMilliseconds,
  LOUDNESS_STANDARD,
  normalizeWebmBuffer,
  parseLoudnormAnalysis,
  resolveFfmpegPath
} from "../tools/lib/audio-loudness.mjs";
import { readWebmDurationMilliseconds } from "../tools/lib/webm-audio.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const validWebm = fs.readFileSync(path.join(projectRoot, "prototype/assets/audio/human/alphabet/human_letter_01_b.webm"));

test("injects a real Info duration into a pipe-produced WebM without moving later elements", () => {
  const expectedDuration = readWebmDurationMilliseconds(validWebm);
  const durationOffset = validWebm.indexOf(Buffer.from([0x44, 0x89]));
  assert.ok(durationOffset > 0 && durationOffset < 1024, "fixture duration must be inside the WebM Info element");
  const withoutDuration = Buffer.from(validWebm);
  const durationValueBytes = withoutDuration[durationOffset + 2] & 0x7f;
  withoutDuration[durationOffset] = 0xec;
  withoutDuration[durationOffset + 1] = 0x80 | (durationValueBytes + 1);
  assert.throws(() => readWebmDurationMilliseconds(withoutDuration), /duration element/);
  const tracksId = Buffer.from([0x16, 0x54, 0xae, 0x6b]);
  const tracksOffset = withoutDuration.indexOf(tracksId);

  const repaired = injectWebmDurationMilliseconds(withoutDuration, expectedDuration);

  assert.equal(repaired.length, withoutDuration.length);
  assert.equal(repaired.indexOf(tracksId), tracksOffset);
  assert.equal(readWebmDurationMilliseconds(repaired), expectedDuration);
});

function loudnormJson({ integrated = -25, peak = -5, lra = 1, threshold = -35, offset = 0 } = {}) {
  return `{
    "input_i" : "${integrated}",
    "input_tp" : "${peak}",
    "input_lra" : "${lra}",
    "input_thresh" : "${threshold}",
    "target_offset" : "${offset}"
  }`;
}

test("uses the approved perceived-loudness standard and parses finite ffmpeg measurements", () => {
  assert.deepEqual(LOUDNESS_STANDARD, {
    version: "ana-tilim-loudness-v2",
    integratedLufs: -20,
    truePeakDbtp: -1.5,
    lraLu: 7,
    integratedToleranceLu: 1,
    durationToleranceMs: 100
  });

  const measurement = parseLoudnormAnalysis(`
    [Parsed_loudnorm_0 @ 0x123]
    {
      "input_i" : "-26.31",
      "input_tp" : "-5.42",
      "input_lra" : "1.20",
      "input_thresh" : "-36.80",
      "output_i" : "-20.02",
      "output_tp" : "-1.53",
      "output_lra" : "1.10",
      "output_thresh" : "-28.31",
      "target_offset" : "0.02"
    }
  `);

  assert.deepEqual(measurement, {
    integratedLufs: -26.31,
    truePeakDbtp: -5.42,
    lraLu: 1.2,
    thresholdLufs: -36.8,
    offsetLu: 0.02
  });
});

test("rejects missing, silent, and nonfinite loudnorm analysis", () => {
  assert.throws(() => parseLoudnormAnalysis("no loudnorm JSON here"), /loudnorm analysis is missing/);
  assert.throws(() => parseLoudnormAnalysis(`{
    "input_i" : "-inf",
    "input_tp" : "-4.2",
    "input_lra" : "0",
    "input_thresh" : "-70",
    "target_offset" : "0"
  }`), /finite loudness measurements/);
  assert.throws(() => parseLoudnormAnalysis(`{
    "input_i" : "NaN",
    "input_tp" : "-4.2",
    "input_lra" : "0",
    "input_thresh" : "-70",
    "target_offset" : "0"
  }`), /finite loudness measurements/);
});

test("resolves an explicit executable and requires loudnorm plus libopus", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ana-tilim-ffmpeg-resolution-"));
  const executable = path.join(directory, "ffmpeg");
  fs.writeFileSync(executable, "fixture");
  fs.chmodSync(executable, 0o755);
  const invocations = [];
  const spawnSync = (file, args) => {
    invocations.push([file, [...args]]);
    if (args.includes("-filters")) return { status: 0, stdout: " ..C loudnorm A->A EBU R128", stderr: "" };
    if (args.includes("-encoders")) return { status: 0, stdout: " A..... libopus Opus", stderr: "" };
    return { status: 0, stdout: "ffmpeg version fixture", stderr: "" };
  };

  assert.equal(resolveFfmpegPath({ env: { ANA_TILIM_FFMPEG: executable }, pathValue: "", fsApi: fs, spawnSync }), fs.realpathSync(executable));
  assert.deepEqual(invocations.map(([, args]) => args), [
    ["-hide_banner", "-version"],
    ["-hide_banner", "-filters"],
    ["-hide_banner", "-encoders"]
  ]);
  assert.throws(
    () => resolveFfmpegPath({ env: { ANA_TILIM_FFMPEG: executable }, pathValue: "", fsApi: fs, spawnSync: (file, args) => ({ status: 0, stdout: args.includes("-filters") ? "no filter" : "libopus", stderr: "" }) }),
    /loudnorm filter/
  );
  assert.throws(
    () => resolveFfmpegPath({ env: {}, pathValue: directory, fsApi: fs, spawnSync: (file, args) => ({ status: 0, stdout: args.includes("-encoders") ? "no encoder" : "loudnorm", stderr: "" }) }),
    /libopus encoder/
  );
  assert.throws(
    () => resolveFfmpegPath({ env: {}, pathValue: path.join(directory, "missing"), fsApi: fs, spawnSync }),
    /ffmpeg executable is required/
  );
});

test("normalizes and verifies WebM through three pipe-only ffmpeg passes", () => {
  const calls = [];
  let analysisCount = 0;
  const spawnSync = (file, args, options) => {
    calls.push({ file, args: [...args], input: Buffer.from(options.input) });
    if (args.at(-1) === "pipe:1") return { status: 0, stdout: Buffer.from(validWebm), stderr: Buffer.from(loudnormJson()) };
    analysisCount += 1;
    const stderr = analysisCount === 1
      ? loudnormJson({ integrated: -26.31, peak: -5.42, lra: 1.2, threshold: -36.8, offset: 0.02 })
      : loudnormJson({ integrated: -20.02, peak: -1.53, lra: 1.1, threshold: -30.3, offset: 0 });
    return { status: 0, stdout: Buffer.alloc(0), stderr: Buffer.from(stderr) };
  };

  const result = normalizeWebmBuffer({ buffer: validWebm, ffmpegPath: "/trusted/ffmpeg", spawnSync });

  assert.equal(result.buffer.equals(validWebm), true);
  assert.deepEqual(result.report, {
    configVersion: "ana-tilim-loudness-v2",
    input: { integratedLufs: -26.31, truePeakDbtp: -5.42, lraLu: 1.2, thresholdLufs: -36.8, offsetLu: 0.02 },
    output: { integratedLufs: -20.02, truePeakDbtp: -1.53, lraLu: 1.1, thresholdLufs: -30.3, offsetLu: 0 }
  });
  assert.equal(calls.length, 3);
  assert.ok(calls.every((call) => call.args.includes("pipe:0")));
  assert.ok(calls.every((call) => call.input.length > 4096));
  assert.equal(calls[0].input.equals(validWebm), true);
  assert.equal(calls[1].input.equals(validWebm), true);
  assert.equal(calls[2].input.equals(validWebm), true);
  assert.ok(calls[1].args.includes("-map_metadata"));
  assert.ok(calls[1].args.includes("-1"));
  assert.deepEqual(calls[1].args.slice(calls[1].args.indexOf("-fflags"), calls[1].args.indexOf("-fflags") + 2), ["-fflags", "+bitexact"]);
  assert.ok(calls[1].args.includes("libopus"));
  const filter = calls[1].args[calls[1].args.indexOf("-af") + 1];
  for (const literal of [
    "I=-20", "TP=-1.8", "LRA=7", "measured_I=-26.31", "measured_LRA=1.2",
    "measured_TP=-5.42", "measured_thresh=-36.8", "offset=0.02", "linear=true"
  ]) assert.match(filter, new RegExp(literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(calls[0].args[calls[0].args.indexOf("-af") + 1], /TP=-1\.8/);
  assert.match(calls[2].args[calls[2].args.indexOf("-af") + 1], /TP=-1\.5/);
});

test("fails closed on ffmpeg errors and out-of-standard output", () => {
  assert.throws(
    () => normalizeWebmBuffer({
      buffer: validWebm,
      ffmpegPath: "/trusted/ffmpeg",
      spawnSync: () => ({ status: 9, stdout: Buffer.alloc(0), stderr: Buffer.from("decoder failed") })
    }),
    /ffmpeg analysis failed.*decoder failed/
  );

  let count = 0;
  assert.throws(
    () => normalizeWebmBuffer({
      buffer: validWebm,
      ffmpegPath: "/trusted/ffmpeg",
      spawnSync: (file, args) => {
        count += 1;
        if (args.at(-1) === "pipe:1") return { status: 0, stdout: Buffer.from(validWebm), stderr: Buffer.alloc(0) };
        return { status: 0, stdout: Buffer.alloc(0), stderr: Buffer.from(count === 1 ? loudnormJson() : loudnormJson({ integrated: -15.8, peak: -1.1 })) };
      }
    }),
    /outside the integrated loudness tolerance/
  );
});
