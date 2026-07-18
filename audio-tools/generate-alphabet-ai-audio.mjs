#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const audioRootDir = path.join(rootDir, "prototype/assets/audio/ai-temp");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const overwrite = args.includes("--overwrite");
const limitArgIndex = args.indexOf("--limit");
const limit = limitArgIndex >= 0 ? Number(args[limitArgIndex + 1]) : 0;
const unitArgIndex = args.indexOf("--unit");

const unitConfigs = [
  { id: "alphabet", title: "Unit 1 alphabet", manifestFile: "alphabet/manifest.json", targetField: "letter" },
  { id: "combos", title: "Unit 2 combos", manifestFile: "combos/manifest.json", targetField: "value" },
  { id: "vocab", title: "Unit 3 vocabulary", manifestFile: "vocab/manifest.json", targetField: "value" },
  { id: "practice", title: "Unit 4 practice", manifestFile: "practice/manifest.json", targetField: "value" }
];

function usage() {
  return [
    "Usage:",
    "  node audio-tools/generate-alphabet-ai-audio.mjs --dry-run",
    "  node audio-tools/generate-alphabet-ai-audio.mjs --dry-run --unit vocab --limit 2",
    "  OPENAI_API_KEY=... node audio-tools/generate-alphabet-ai-audio.mjs",
    "",
    "Options:",
    "  --dry-run     Print planned files without calling the API.",
    "  --overwrite   Regenerate files that already exist.",
    "  --limit N     Generate only the first N files per selected unit.",
    "  --unit NAME   Generate one unit: alphabet, combos, vocab, or practice. Defaults to all units."
  ].join("\n");
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function selectedUnits() {
  if (unitArgIndex < 0) {
    return unitConfigs;
  }

  const unitId = args[unitArgIndex + 1];
  const unit = unitConfigs.find((item) => item.id === unitId);
  if (!unit) {
    throw new Error(`Unknown --unit value: ${unitId || ""}.\n\n${usage()}`);
  }

  return [unit];
}

async function createSpeech({ apiKey, item, manifest, unit }) {
  const model = process.env.OPENAI_TTS_MODEL || manifest.model || "gpt-4o-mini-tts";
  const voice = process.env.OPENAI_TTS_VOICE || manifest.voice || "shimmer";
  const responseFormat = manifest.responseFormat || "mp3";
  const speed = Number(process.env.OPENAI_TTS_SPEED || manifest.speed || 0.88);
  const target = item.ttsInput || item[unit.targetField] || item.value || item.letter;
  const instructions = [
    manifest.instructions,
    `Target Uyghur text: ${target}`,
    item.latin ? `Latin cue for reviewer: ${item.latin}` : "",
    item.pronunciationCue ? `Pronunciation cue for reviewer: ${item.pronunciationCue}` : "",
    "Do not read the Latin cue aloud unless it is the correct Standard Uyghur teaching pronunciation."
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      voice,
      input: target,
      instructions,
      response_format: responseFormat,
      speed
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI speech request failed for ${target} (${item.file}): ${response.status} ${detail}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function processUnit({ unit, apiKey }) {
  const manifestPath = path.join(audioRootDir, unit.manifestFile);
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const items = limit > 0 ? manifest.items.slice(0, limit) : manifest.items;
  const outputDir = path.dirname(manifestPath);
  await fs.mkdir(outputDir, { recursive: true });

  if (dryRun) {
    console.log(`\n${unit.title}`);
    for (const item of items) {
      const target = item.ttsInput || item[unit.targetField] || item.value || item.letter;
      console.log(`${String(item.order).padStart(2, "0")} ${target} ${item.latin} -> ${item.outputPath}`);
    }
    console.log(`Dry run complete for ${unit.id}. Planned files: ${items.length}`);
    return;
  }

  for (const item of items) {
    const outputPath = path.join(outputDir, item.file);
    if (!overwrite && (await fileExists(outputPath))) {
      console.log(`skip existing ${item.file}`);
      continue;
    }

    const target = item.ttsInput || item[unit.targetField] || item.value || item.letter;
    console.log(`generate ${unit.id} ${String(item.order).padStart(2, "0")} ${target} ${item.latin}`);
    const audio = await createSpeech({ apiKey, item, manifest, unit });
    await fs.writeFile(outputPath, audio);
  }

  console.log(`${unit.title} AI temporary audio generation complete. Files checked: ${items.length}`);
}

async function main() {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return;
  }

  if (limitArgIndex >= 0 && (!Number.isInteger(limit) || limit <= 0)) {
    throw new Error("--limit must be a positive integer.");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!dryRun && !apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate AI temporary audio.\n\n" + usage());
  }

  for (const unit of selectedUnits()) {
    await processUnit({ unit, apiKey });
  }

  console.log("Reminder: these files are AI 临时音频 and still need human review.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
