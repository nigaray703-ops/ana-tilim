#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateWebmBuffer } from "../tools/lib/webm-audio.mjs";

export const ALPHABET_AUDIO_FILES = Object.freeze([
  "assets/audio/human/alphabet/human_letter_01_b.webm",
  "assets/audio/human/alphabet/human_letter_02_p.webm",
  "assets/audio/human/alphabet/human_letter_03_t.webm",
  "assets/audio/human/alphabet/human_letter_04_n.webm",
  "assets/audio/human/alphabet/human_letter_05_j.webm",
  "assets/audio/human/alphabet/human_letter_06_ch.webm",
  "assets/audio/human/alphabet/human_letter_07_x.webm",
  "assets/audio/human/alphabet/human_letter_08_d.webm",
  "assets/audio/human/alphabet/human_letter_09_r.webm",
  "assets/audio/human/alphabet/human_letter_10_z.webm",
  "assets/audio/human/alphabet/human_letter_11_zh.webm",
  "assets/audio/human/alphabet/human_letter_12_s.webm",
  "assets/audio/human/alphabet/human_letter_13_sh.webm",
  "assets/audio/human/alphabet/human_letter_14_gh.webm",
  "assets/audio/human/alphabet/human_letter_15_f.webm",
  "assets/audio/human/alphabet/human_letter_16_q.webm",
  "assets/audio/human/alphabet/human_letter_17_k.webm",
  "assets/audio/human/alphabet/human_letter_18_g.webm",
  "assets/audio/human/alphabet/human_letter_19_ng.webm",
  "assets/audio/human/alphabet/human_letter_20_l.webm",
  "assets/audio/human/alphabet/human_letter_21_m.webm",
  "assets/audio/human/alphabet/human_letter_22_h.webm",
  "assets/audio/human/alphabet/human_letter_23_w_v.webm",
  "assets/audio/human/alphabet/human_letter_24_y.webm",
  "assets/audio/human/alphabet/human_letter_25_a.webm",
  "assets/audio/human/alphabet/human_letter_26_e.webm",
  "assets/audio/human/alphabet/human_letter_27_o.webm",
  "assets/audio/human/alphabet/human_letter_28_u.webm",
  "assets/audio/human/alphabet/human_letter_29_oe.webm",
  "assets/audio/human/alphabet/human_letter_30_ue.webm",
  "assets/audio/human/alphabet/human_letter_31_ee.webm",
  "assets/audio/human/alphabet/human_letter_32_i.webm"
]);

export const FINAL_AUDIO_FILES = Object.freeze([
  ...ALPHABET_AUDIO_FILES,
  "assets/audio/human/vocab/human_vocab_korushkunche.webm",
  "assets/audio/human/vocab/human_vocab_erzimeydu.webm",
  "assets/audio/human/reading/human_reading_grammar_person_verbs_2.webm",
  "assets/audio/human/reading/human_reading_grammar_person_verbs_3.webm",
  "assets/audio/human/reading/human_reading_grammar_possession_1.webm",
  "assets/audio/human/reading/human_reading_grammar_possession_2.webm",
  "assets/audio/human/reading/human_reading_grammar_possession_3.webm",
  "assets/audio/human/reading/human_reading_grammar_location_direction_1.webm",
  "assets/audio/human/reading/human_reading_grammar_location_direction_2.webm",
  "assets/audio/human/reading/human_reading_grammar_location_direction_3.webm",
  "assets/audio/human/reading/human_reading_grammar_basic_time_1.webm",
  "assets/audio/human/reading/human_reading_grammar_basic_time_2.webm",
  "assets/audio/human/reading/human_reading_grammar_basic_time_3.webm",
  "assets/audio/human/reading/human_reading_sentence_self_introduction_1.webm",
  "assets/audio/human/reading/human_reading_sentence_self_introduction_2.webm",
  "assets/audio/human/reading/human_reading_sentence_self_introduction_3.webm",
  "assets/audio/human/reading/human_reading_sentence_location_direction_1.webm",
  "assets/audio/human/reading/human_reading_sentence_location_direction_2.webm",
  "assets/audio/human/reading/human_reading_sentence_location_direction_3.webm",
  "assets/audio/human/reading/human_reading_sentence_location_direction_4.webm",
  "assets/audio/human/reading/human_reading_sentence_ability_preference_1.webm",
  "assets/audio/human/reading/human_reading_sentence_ability_preference_2.webm",
  "assets/audio/human/reading/human_reading_sentence_ability_preference_3.webm",
  "assets/audio/human/reading/human_reading_sentence_ability_preference_4.webm",
  "assets/audio/human/reading/human_reading_sentence_polite_reason_1.webm",
  "assets/audio/human/reading/human_reading_sentence_polite_reason_2.webm",
  "assets/audio/human/reading/human_reading_sentence_polite_reason_3.webm",
  "assets/audio/human/reading/human_reading_sentence_polite_reason_4.webm"
]);

const RELEASE_FILES = Object.freeze([
  ...FINAL_AUDIO_FILES,
  "assets/audio/human/alphabet/manifest.json",
  "assets/audio/human/reading/manifest.json",
  "assets/audio/human/vocab/manifest.json"
]);

function inside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function assertNoExistingSymlink(root, candidate, label) {
  assert.ok(candidate === root || inside(root, candidate), `${label} escapes its root`);
  let current = root;
  for (const segment of path.relative(root, candidate).split(path.sep)) {
    if (!segment) continue;
    current = path.join(current, segment);
    if (!fs.existsSync(current)) break;
    assert.ok(!fs.lstatSync(current).isSymbolicLink(), `${label} must not traverse a symbolic link`);
  }
}

export function syncCnFinalAudio({ projectRoot, cnSiteRoot }) {
  const normalizedProjectRoot = path.resolve(projectRoot);
  const sourceRoot = path.join(normalizedProjectRoot, "prototype");
  const normalizedCnSiteRoot = path.resolve(cnSiteRoot);
  assert.ok(fs.existsSync(normalizedCnSiteRoot), "domestic site root must exist");
  assert.ok(!fs.lstatSync(normalizedCnSiteRoot).isSymbolicLink() && fs.statSync(normalizedCnSiteRoot).isDirectory(), "domestic site root must be a regular directory");
  fs.accessSync(normalizedCnSiteRoot, fs.constants.W_OK | fs.constants.X_OK);

  const jobs = RELEASE_FILES.map((relativePath) => {
    assert.ok(!path.isAbsolute(relativePath) && !relativePath.split(path.sep).includes(".."), `unsafe final audio path: ${relativePath}`);
    const sourcePath = path.resolve(sourceRoot, relativePath);
    const targetPath = path.resolve(normalizedCnSiteRoot, relativePath);
    assert.ok(inside(sourceRoot, sourcePath), `final audio source escapes prototype: ${relativePath}`);
    assert.ok(inside(normalizedCnSiteRoot, targetPath), `final audio target escapes domestic site: ${relativePath}`);
    assertNoExistingSymlink(sourceRoot, sourcePath, `source ${relativePath}`);
    assertNoExistingSymlink(normalizedCnSiteRoot, targetPath, `target ${relativePath}`);
    const sourceStat = fs.lstatSync(sourcePath);
    assert.ok(!sourceStat.isSymbolicLink() && sourceStat.isFile(), `final audio source must be a regular file: ${relativePath}`);
    if (relativePath.endsWith(".webm")) validateWebmBuffer(fs.readFileSync(sourcePath));
    return { relativePath, sourcePath, targetPath };
  });

  for (const job of jobs) {
    fs.mkdirSync(path.dirname(job.targetPath), { recursive: true });
    assertNoExistingSymlink(normalizedCnSiteRoot, path.dirname(job.targetPath), `target parent ${job.relativePath}`);
    fs.copyFileSync(job.sourcePath, job.targetPath);
  }
  return { copied: jobs.map((job) => job.relativePath) };
}

function runCli() {
  const projectRoot = fileURLToPath(new URL("..", import.meta.url));
  const cnSiteRoot = process.env.ANA_TILIM_CN_SITE
    ? path.resolve(process.env.ANA_TILIM_CN_SITE)
    : path.resolve(projectRoot, "..", "Uyghur Tili", "site");
  const result = syncCnFinalAudio({ projectRoot, cnSiteRoot });
  console.log(`Copied ${result.copied.length} final audio release files to ${cnSiteRoot}`);
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) runCli();
