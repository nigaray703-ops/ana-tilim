#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(rootDir, "prototype/assets/audio/ai-temp/alphabet/manifest.json");
const audioDir = path.join(rootDir, "prototype/assets/audio/ai-temp/alphabet");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const overwrite = args.includes("--overwrite");
const limitArgIndex = args.indexOf("--limit");
const limit = limitArgIndex >= 0 ? Number(args[limitArgIndex + 1]) : 0;

function usage() {
  return [
    "Usage:",
    "  node audio-tools/generate-alphabet-ai-audio.mjs --dry-run",
    "  OPENAI_API_KEY=... node audio-tools/generate-alphabet-ai-audio.mjs",
    "",
    "Options:",
    "  --dry-run     Print planned files without calling the API.",
    "  --overwrite   Regenerate files that already exist.",
    "  --limit N     Generate only the first N files for a small test."
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

async function createSpeech({ apiKey, item, manifest }) {
  const model = process.env.OPENAI_TTS_MODEL || manifest.model || "gpt-4o-mini-tts";
  const voice = process.env.OPENAI_TTS_VOICE || manifest.voice || "shimmer";
  const responseFormat = manifest.responseFormat || "mp3";
  const speed = Number(process.env.OPENAI_TTS_SPEED || manifest.speed || 0.88);
  const instructions = [
    manifest.instructions,
    `Target Uyghur letter: ${item.letter}`,
    `Latin cue for reviewer: ${item.pronunciationCue}`,
    "Do not read the Latin cue aloud unless it is the correct Standard Uyghur teaching pronunciation."
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      voice,
      input: item.ttsInput,
      instructions,
      response_format: responseFormat,
      speed
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI speech request failed for ${item.letter} (${item.file}): ${response.status} ${detail}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  if (args.includes("--help") || args.includes("-h")) {
    console.log(usage());
    return;
  }

  if (limitArgIndex >= 0 && (!Number.isInteger(limit) || limit <= 0)) {
    throw new Error("--limit must be a positive integer.");
  }

  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const items = limit > 0 ? manifest.items.slice(0, limit) : manifest.items;
  await fs.mkdir(audioDir, { recursive: true });

  if (dryRun) {
    for (const item of items) {
      console.log(`${String(item.order).padStart(2, "0")} ${item.letter} ${item.latin} -> ${item.outputPath}`);
    }
    console.log(`Dry run complete. Planned files: ${items.length}`);
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate AI temporary audio.\n\n" + usage());
  }

  for (const item of items) {
    const outputPath = path.join(audioDir, item.file);
    if (!overwrite && (await fileExists(outputPath))) {
      console.log(`skip existing ${item.file}`);
      continue;
    }

    console.log(`generate ${String(item.order).padStart(2, "0")} ${item.letter} ${item.latin}`);
    const audio = await createSpeech({ apiKey, item, manifest });
    await fs.writeFile(outputPath, audio);
  }

  console.log(`Alphabet AI temporary audio generation complete. Files checked: ${items.length}`);
  console.log("Reminder: these files are AI 临时音频 and still need human review.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
