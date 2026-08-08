#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const node = process.execPath;

const checks = [
  {
    label: "syntax: edition config",
    command: node,
    args: ["--check", "prototype/app-config.js"]
  },
  {
    label: "syntax: unit order",
    command: node,
    args: ["--check", "prototype/unit-order.js"]
  },
  {
    label: "syntax: sentence morphemes",
    command: node,
    args: ["--check", "prototype/sentence-morphemes.js"]
  },
  {
    label: "syntax: sentence glossary",
    command: node,
    args: ["--check", "prototype/sentence-glossary.js"]
  },
  {
    label: "syntax: local progress transfer",
    command: node,
    args: ["--check", "prototype/progress-transfer.js"]
  },
  {
    label: "syntax: ULY transliteration",
    command: node,
    args: ["--check", "prototype/uly-transliteration.js"]
  },
  {
    label: "syntax: audio controller",
    command: node,
    args: ["--check", "prototype/audio-controller.js"]
  },
  {
    label: "syntax: cloud config",
    command: node,
    args: ["--check", "prototype/cloud-config.js"]
  },
  {
    label: "syntax: cloud sync",
    command: node,
    args: ["--check", "prototype/cloud-sync.js"]
  },
  {
    label: "syntax: app",
    command: node,
    args: ["--check", "prototype/app.js"]
  },
  {
    label: "syntax: re-recording queue utility",
    command: node,
    args: ["--check", "prototype/re-record-audio.js"]
  },
  {
    label: "syntax: course data aggregator",
    command: node,
    args: ["--check", "prototype/course-data.js"]
  },
  {
    label: "syntax: alphabet data",
    command: node,
    args: ["--check", "prototype/course-data/alphabet-data.js"]
  },
  {
    label: "syntax: combo data",
    command: node,
    args: ["--check", "prototype/course-data/combo-data.js"]
  },
  {
    label: "syntax: vocab data",
    command: node,
    args: ["--check", "prototype/course-data/vocab-data.js"]
  },
  {
    label: "syntax: practice data",
    command: node,
    args: ["--check", "prototype/course-data/practice-data.js"]
  },
  {
    label: "syntax: reading data",
    command: node,
    args: ["--check", "prototype/course-data/reading-data.js"]
  },
  {
    label: "test: ULY transliteration",
    command: node,
    args: ["tests/uly-transliteration.test.mjs"]
  },
  {
    label: "test: edition config",
    command: node,
    args: ["tests/app-edition-config.test.mjs"]
  },
  {
    label: "test: unit order",
    command: node,
    args: ["tests/unit-order.test.mjs"]
  },
  {
    label: "test: content policy",
    command: node,
    args: ["tests/content-policy.test.mjs"]
  },
  {
    label: "test: sentence glossary",
    command: node,
    args: ["tests/sentence-glossary.test.mjs"]
  },
  {
    label: "test: local progress transfer",
    command: node,
    args: ["tests/local-progress-transfer.test.mjs"]
  },
  {
    label: "test: audio controller",
    command: node,
    args: ["tests/audio-controller.test.mjs"]
  },
  {
    label: "test: Supabase schema and public config",
    command: node,
    args: ["tests/supabase-schema.test.mjs"]
  },
  {
    label: "test: cloud snapshot and sync controller",
    command: node,
    args: ["tests/cloud-sync.test.mjs"]
  },
  {
    label: "test: re-recording queue utility",
    command: node,
    args: ["tests/re-record-audio.test.mjs"]
  },
  {
    label: "test: course data integrity",
    command: node,
    args: ["tests/course-data-integrity.test.mjs"]
  },
  {
    label: "test: learning experience",
    command: node,
    args: ["tests/unit-learning-experience.test.mjs"]
  },
  {
    label: "test: human audio",
    command: node,
    args: ["tests/human-audio.test.mjs"]
  },
  {
    label: "test: full content render",
    command: node,
    args: ["tests/full-content-render.test.mjs"]
  },
  {
    label: "git: whitespace check",
    command: "git",
    args: ["diff", "--check"]
  }
];

console.log("Ana Tilim project checks");

for (const check of checks) {
  console.log(`\n> ${check.label}`);
  const result = spawnSync(check.command, check.args, { stdio: "inherit" });

  if (result.error) {
    console.error(`Unable to run "${check.label}": ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`Check failed: ${check.label}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nAll project checks passed.");
