# Ana Tilim AI Temporary Audio Folder

This folder is reserved for AI-generated temporary audio files.

Rules:

- AI audio must be labeled `AI 临时音频`.
- AI audio must not be described as human-recorded audio.
- AI audio is only for internal playback, listening-flow, and follow-read testing.
- Final learner-facing pronunciation still needs standard Uyghur review and human recording.

Suggested filenames:

```text
alphabet/ai_temp_letter_01_b.mp3
combos/ai_temp_combo_ba.mp3
vocab/ai_temp_vocab_rahmat.mp3
practice/ai_temp_practice_listen_be.mp3
```

Future app paths should look like:

```text
./assets/audio/ai-temp/alphabet/ai_temp_letter_01_b.mp3
./assets/audio/ai-temp/combos/ai_temp_combo_ba.mp3
./assets/audio/ai-temp/vocab/ai_temp_vocab_rahmat.mp3
./assets/audio/ai-temp/practice/ai_temp_practice_listen_be.mp3
```

Each unit has its own manifest:

```text
prototype/assets/audio/ai-temp/alphabet/
prototype/assets/audio/ai-temp/alphabet/manifest.json
prototype/assets/audio/ai-temp/combos/manifest.json
prototype/assets/audio/ai-temp/vocab/manifest.json
prototype/assets/audio/ai-temp/practice/manifest.json
audio-tools/generate-alphabet-ai-audio.mjs
```
