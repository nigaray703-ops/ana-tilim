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
ai_temp_letter_03_b.mp3
ai_temp_combo_ba.mp3
ai_temp_word_rahmat.mp3
ai_temp_phrase_assalamu_alaykum.mp3
```

Future app paths should look like:

```text
./assets/audio/ai-temp/alphabet/ai_temp_letter_01_b.mp3
./assets/audio/ai-temp/ai_temp_word_rahmat.mp3
```

Unit 1 alphabet audio has its own package:

```text
prototype/assets/audio/ai-temp/alphabet/
prototype/assets/audio/ai-temp/alphabet/manifest.json
audio-tools/generate-alphabet-ai-audio.mjs
```
