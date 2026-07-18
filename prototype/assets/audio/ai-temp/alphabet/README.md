# Unit 1 Alphabet AI Temporary Audio

This folder is for first-unit alphabet AI temporary audio only.

Current status:

- Files are not committed until generated.
- Generated files must stay labeled `AI 临时音频`.
- These files are for internal checking and playback-flow testing.
- Standard Uyghur pronunciation still needs human review before final release.

Generate with:

```bash
node audio-tools/generate-alphabet-ai-audio.mjs --dry-run
OPENAI_API_KEY=... node audio-tools/generate-alphabet-ai-audio.mjs
```

Recommended first check:

```bash
OPENAI_API_KEY=... node audio-tools/generate-alphabet-ai-audio.mjs --limit 4
```

Expected files:

```text
ai_temp_letter_01_b.mp3
ai_temp_letter_02_p.mp3
ai_temp_letter_03_t.mp3
ai_temp_letter_04_n.mp3
...
ai_temp_letter_32_i.mp3
```

Review rule:

If a letter sounds wrong, unclear, too robotic, or not standard enough, mark it `需重新录制` in the review dashboard.
