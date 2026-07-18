#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const node = process.execPath;

const checks = [
  {
    label: "syntax: audio generator",
    command: node,
    args: ["--check", "audio-tools/generate-alphabet-ai-audio.mjs"]
  },
  {
    label: "syntax: app",
    command: node,
    args: ["--check", "prototype/app.js"]
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
    label: "test: alphabet AI audio",
    command: node,
    args: ["tests/alphabet-ai-audio.test.mjs"]
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
