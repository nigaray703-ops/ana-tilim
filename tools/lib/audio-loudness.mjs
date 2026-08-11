import assert from "node:assert/strict";
import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { injectWebmDurationMilliseconds, validateWebmBuffer } from "./webm-audio.mjs";

export { injectWebmDurationMilliseconds } from "./webm-audio.mjs";

const MAX_PROCESS_BUFFER_BYTES = 64 * 1024 * 1024;
const ENCODING_TRUE_PEAK_DBTP = -1.8;

export const LOUDNESS_STANDARD = Object.freeze({
  version: "ana-tilim-loudness-v3",
  integratedLufs: -20,
  truePeakDbtp: -1.5,
  lraLu: 20,
  integratedToleranceLu: 1,
  durationToleranceMs: 100
});

export function parseLoudnormAnalysis(stderr) {
  const matches = [...String(stderr).matchAll(/\{[\s\S]*?"input_i"[\s\S]*?\}/gu)];
  assert.ok(matches.length > 0, "ffmpeg loudnorm analysis is missing");
  const raw = JSON.parse(matches.at(-1)[0]);
  const measurement = {
    integratedLufs: Number(raw.input_i),
    truePeakDbtp: Number(raw.input_tp),
    lraLu: Number(raw.input_lra),
    thresholdLufs: Number(raw.input_thresh),
    offsetLu: Number(raw.target_offset)
  };
  assert.ok(
    Object.values(measurement).every(Number.isFinite),
    "ffmpeg must return finite loudness measurements"
  );
  return measurement;
}

function assertExecutable(candidate, fsApi) {
  const resolved = fsApi.realpathSync(candidate);
  const stat = fsApi.statSync(resolved);
  assert.ok(stat.isFile(), "ffmpeg executable must be a regular file");
  fsApi.accessSync(resolved, fs.constants.X_OK);
  return resolved;
}

function runProcess(spawnSync, executable, args, options, label) {
  const result = spawnSync(executable, args, {
    encoding: null,
    maxBuffer: MAX_PROCESS_BUFFER_BYTES,
    ...options
  });
  if (result?.error) assert.fail(`${label} failed: ${result.error.message}`);
  const status = result?.status;
  const stderr = Buffer.isBuffer(result?.stderr) ? result.stderr.toString("utf8") : String(result?.stderr ?? "");
  assert.equal(status, 0, `${label} failed${stderr.trim() ? `: ${stderr.trim()}` : ""}`);
  return {
    stdout: Buffer.isBuffer(result?.stdout) ? result.stdout : Buffer.from(result?.stdout ?? ""),
    stderr
  };
}

export function resolveFfmpegPath({
  env = process.env,
  pathValue = env.PATH || "",
  fsApi = fs,
  spawnSync = childProcess.spawnSync
} = {}) {
  const explicit = env.ANA_TILIM_FFMPEG;
  let executable;
  try {
    if (explicit) {
      assert.ok(path.isAbsolute(explicit), "ANA_TILIM_FFMPEG must be an absolute path");
      executable = assertExecutable(explicit, fsApi);
    } else {
      for (const directory of String(pathValue).split(path.delimiter)) {
        if (!directory) continue;
        const candidate = path.join(directory, "ffmpeg");
        if (!fsApi.existsSync(candidate)) continue;
        executable = assertExecutable(candidate, fsApi);
        break;
      }
    }
  } catch (error) {
    assert.fail(`ffmpeg executable is required: ${error.message}`);
  }
  assert.ok(executable, "ffmpeg executable is required");

  const version = runProcess(spawnSync, executable, ["-hide_banner", "-version"], {}, "ffmpeg version check");
  assert.ok(version.stdout.length > 0 || version.stderr.length > 0, "ffmpeg version output is required");
  const filters = runProcess(spawnSync, executable, ["-hide_banner", "-filters"], {}, "ffmpeg filter check");
  assert.match(`${filters.stdout.toString("utf8")}\n${filters.stderr}`, /\bloudnorm\b/u, "ffmpeg loudnorm filter is required");
  const encoders = runProcess(spawnSync, executable, ["-hide_banner", "-encoders"], {}, "ffmpeg encoder check");
  assert.match(`${encoders.stdout.toString("utf8")}\n${encoders.stderr}`, /\blibopus\b/u, "ffmpeg libopus encoder is required");
  return executable;
}

function analysisArgs(truePeakDbtp = LOUDNESS_STANDARD.truePeakDbtp) {
  return [
    "-hide_banner", "-nostdin", "-i", "pipe:0",
    "-af", `loudnorm=I=${LOUDNESS_STANDARD.integratedLufs}:TP=${truePeakDbtp}:LRA=${LOUDNESS_STANDARD.lraLu}:print_format=json`,
    "-f", "null", "-"
  ];
}

function normalizationArgs(input) {
  const filter = [
    `loudnorm=I=${LOUDNESS_STANDARD.integratedLufs}:TP=${ENCODING_TRUE_PEAK_DBTP}:LRA=${LOUDNESS_STANDARD.lraLu}`,
    `measured_I=${input.integratedLufs}`,
    `measured_LRA=${input.lraLu}`,
    `measured_TP=${input.truePeakDbtp}`,
    `measured_thresh=${input.thresholdLufs}`,
    `offset=${input.offsetLu}`,
    "linear=true",
    "print_format=json"
  ].join(":");
  return [
    "-hide_banner", "-nostdin", "-i", "pipe:0",
    "-map_metadata", "-1",
    "-fflags", "+bitexact",
    "-af", filter,
    "-c:a", "libopus", "-b:a", "64k", "-vbr", "on", "-application", "voip",
    "-f", "webm", "pipe:1"
  ];
}

export function normalizeWebmBuffer({
  buffer,
  ffmpegPath,
  spawnSync = childProcess.spawnSync
}) {
  assert.ok(path.isAbsolute(ffmpegPath), "ffmpeg path must be absolute");
  const inputValidation = validateWebmBuffer(buffer);
  const firstPass = runProcess(spawnSync, ffmpegPath, analysisArgs(ENCODING_TRUE_PEAK_DBTP), { input: buffer }, "ffmpeg analysis");
  const input = parseLoudnormAnalysis(firstPass.stderr);
  const normalization = runProcess(spawnSync, ffmpegPath, normalizationArgs(input), { input: buffer }, "ffmpeg normalization");
  const outputBuffer = injectWebmDurationMilliseconds(normalization.stdout, inputValidation.durationMs);
  const outputValidation = validateWebmBuffer(outputBuffer);
  const verification = runProcess(spawnSync, ffmpegPath, analysisArgs(), { input: outputBuffer }, "ffmpeg output verification");
  const output = parseLoudnormAnalysis(verification.stderr);

  const durationDifference = Math.abs(outputValidation.durationMs - inputValidation.durationMs);
  const durationTolerance = Math.max(
    LOUDNESS_STANDARD.durationToleranceMs,
    inputValidation.durationMs * 0.03
  );
  assert.ok(durationDifference <= durationTolerance, "normalized WebM duration drift exceeds the allowed tolerance");
  assert.ok(
    Math.abs(output.integratedLufs - LOUDNESS_STANDARD.integratedLufs) <= LOUDNESS_STANDARD.integratedToleranceLu,
    "normalized WebM is outside the integrated loudness tolerance"
  );
  assert.ok(
    output.truePeakDbtp <= LOUDNESS_STANDARD.truePeakDbtp,
    "normalized WebM true peak exceeds the approved maximum"
  );

  return {
    buffer: Buffer.from(outputBuffer),
    report: {
      configVersion: LOUDNESS_STANDARD.version,
      input,
      output
    }
  };
}
