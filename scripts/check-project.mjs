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
    label: "syntax: edition core allowlist",
    command: node,
    args: ["--check", "scripts/edition-core-files.mjs"]
  },
  {
    label: "syntax: domestic core sync",
    command: node,
    args: ["--check", "scripts/sync-cn-core.mjs"]
  },
  {
    label: "syntax: edition parity",
    command: node,
    args: ["--check", "scripts/check-edition-parity.mjs"]
  },
  {
    label: "syntax: sentence morphemes",
    command: node,
    args: ["--check", "prototype/sentence-morphemes.js"]
  },
  {
    label: "syntax: Latin keyboard",
    command: node,
    args: ["--check", "prototype/latin-keyboard.js"]
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
    label: "syntax: feedback service",
    command: node,
    args: ["--check", "prototype/feedback.js"]
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
    label: "syntax: latin writing data",
    command: node,
    args: ["--check", "prototype/course-data/latin-writing-data.js"]
  },
  {
    label: "syntax: combo data",
    command: node,
    args: ["--check", "prototype/course-data/combo-data.js"]
  },
  {
    label: "syntax: syllable training data",
    command: node,
    args: ["--check", "prototype/course-data/syllable-data.js"]
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
    label: "syntax: shared Afanti data",
    command: node,
    args: ["--check", "prototype/course-data/afanti-data.js"]
  },
  {
    label: "syntax: global Afanti English data",
    command: node,
    args: ["--check", "prototype/course-data/afanti-english-data.js"]
  },
  {
    label: "syntax: Afanti content validator",
    command: node,
    args: ["--check", "prototype/afanti-content.js"]
  },
  {
    label: "syntax: i18n UI messages",
    command: node,
    args: ["--check", "prototype/i18n/ui-messages.js"]
  },
  {
    label: "syntax: i18n alphabet English",
    command: node,
    args: ["--check", "prototype/i18n/alphabet-en.js"]
  },
  {
    label: "syntax: i18n combinations English",
    command: node,
    args: ["--check", "prototype/i18n/combo-en.js"]
  },
  {
    label: "syntax: i18n vocabulary English",
    command: node,
    args: ["--check", "prototype/i18n/vocab-en.js"]
  },
  {
    label: "syntax: i18n practice English",
    command: node,
    args: ["--check", "prototype/i18n/practice-en.js"]
  },
  {
    label: "syntax: i18n reading English",
    command: node,
    args: ["--check", "prototype/i18n/reading-en.js"]
  },
  {
    label: "syntax: i18n course English",
    command: node,
    args: ["--check", "prototype/i18n/course-en.js"]
  },
  {
    label: "syntax: i18n runtime",
    command: node,
    args: ["--check", "prototype/i18n/runtime.js"]
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
    label: "check: edition core parity",
    command: node,
    args: ["scripts/check-edition-parity.mjs"]
  },
  {
    label: "test: unit order",
    command: node,
    args: ["tests/unit-order.test.mjs"]
  },
  {
    label: "test: latin writing course data",
    command: node,
    args: ["tests/latin-writing-data.test.mjs"]
  },
  {
    label: "test: syllable training course data",
    command: node,
    args: ["tests/syllable-data.test.mjs"]
  },
  {
    label: "test: reviewed Afanti content",
    command: node,
    args: ["tests/afanti-content.test.mjs"]
  },
  {
    label: "test: Latin keyboard",
    command: node,
    args: ["tests/latin-keyboard.test.mjs"]
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
    label: "test: anonymous feedback service",
    command: node,
    args: ["tests/feedback-service.test.mjs"]
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
  { label: "test: i18n runtime", command: node, args: ["tests/i18n-runtime.test.mjs"] },
  {
    label: "test: bilingual course content",
    command: node,
    args: ["tests/i18n-course-content.test.mjs"]
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
    label: "test: WebM audio validation",
    command: node,
    args: ["tests/webm-audio.test.mjs"]
  },
  {
    label: "test: recording studio catalog",
    command: node,
    args: ["tests/recording-studio-catalog.test.mjs"]
  },
  {
    label: "test: brand assets",
    command: node,
    args: ["tests/brand-assets.test.mjs"]
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
