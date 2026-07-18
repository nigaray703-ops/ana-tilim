# Ana Tilim Alphabet AI Audio Generation Plan

## Goal

Prepare Unit 1 alphabet AI temporary audio so the user can review clear female-voice pronunciation files before any final human recording.

## Constraints

- AI audio must be labeled `AI 临时音频`.
- Do not claim AI audio is final standard pronunciation.
- Do not use macOS system voices for standard Uyghur audio because no Uyghur voice is available locally.
- Generated files need a TTS API key before actual audio can be produced.
- Keep the current lesson order and grouped alphabet structure.

## Steps

- [x] **Step 1: Verify local audio capability**

Checked local macOS voices and found no Uyghur voice. Checked common TTS API environment variables and found no available key in this workspace.

- [x] **Step 2: Add Unit 1 audio manifest**

Created `prototype/assets/audio/ai-temp/alphabet/manifest.json` with 32 first-unit alphabet audio targets, fixed filenames, output paths, voice settings, and review status.

- [x] **Step 3: Add generation script**

Created `audio-tools/generate-alphabet-ai-audio.mjs` using the OpenAI speech endpoint. It supports `--dry-run`, `--limit`, and `--overwrite`, and requires `OPENAI_API_KEY` for real generation.

- [x] **Step 4: Wire prototype playback**

Updated the first-unit letter lesson and listening practice audio buttons to use the planned AI temporary audio paths. Missing files show a clear toast instead of pretending playback exists.

- [x] **Step 5: Add review docs**

Added the alphabet AI audio folder README and first-unit Chinese review checklist.

- [ ] **Step 6: Generate actual MP3 files**

Blocked until a valid TTS API key is provided in the environment.

## Verification

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/alphabet-ai-audio.test.mjs
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check prototype/app.js
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node audio-tools/generate-alphabet-ai-audio.mjs --dry-run
git diff --check
```
