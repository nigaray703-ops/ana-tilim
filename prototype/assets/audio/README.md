# Ana Tilim Audio Folder

This folder contains the current prototype audio files.

Current status:

- Human-recorded `.webm` files are connected for all alphabet, form-example, combo, and reading lessons.
- Vocabulary audio is connected for every current lesson item, including the newly re-recorded `dereze-home` (窗户).
- The 94 form examples without reusable vocabulary or combo audio now use dedicated human recordings.
- The practice center reuses the 32 alphabet recordings instead of keeping duplicate practice audio.
- All retained playable audio lives under `human/`.
- Pronunciation can still be reviewed later, and individual files can be re-recorded if needed.

Audio folders:

```text
human/alphabet/
human/form-examples/
human/combos/
human/vocab/
human/practice/
human/reading/
```

Use relative paths from the prototype:

```text
./assets/audio/human/alphabet/human_letter_01_b.webm
./assets/audio/human/form-examples/human_form_example_1ctj8t0.webm
./assets/audio/human/combos/human_combo_ba.webm
./assets/audio/human/vocab/human_vocab_rahmat.webm
```

Each folder has a `manifest.json` that must stay in sync with the files.
