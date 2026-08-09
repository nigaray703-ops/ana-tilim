# Ana Tilim English layout, audio icon, and language selector design

Date: 2026-08-09
Status: approved direction, pending written-spec review

## Context

The international static build already supports Chinese and English. The English UI is functionally complete, but longer English labels can wrap or clip less gracefully than the shorter Chinese copy. Shared audio controls currently render the word `Play`, and the Profile language setting uses two side-by-side buttons. The requested refinement is to keep all English text readable, replace text play controls with a small speaker symbol across the site, and make the Profile language setting a right-aligned dropdown that can accept more languages later.

Work must start from the current production `origin/main` in an isolated worktree because the primary checkout contains unrelated in-progress user changes.

## Goals

1. Show complete, readable English text on desktop and mobile without horizontal page overflow.
2. Allow long English headings, card copy, status text, and button labels to wrap naturally; reduce font size only where needed.
3. Replace every shared text `Play`/`播放` audio button with the same local speaker icon while retaining localized accessible names and disabled states.
4. Render the Profile language setting as one horizontal row: label on the left, native dropdown on the right.
5. Keep the Home compact Chinese/English shortcut in its current top-right location.
6. Preserve all language detection, persistence, Google-user preference synchronization, lesson state, audio behavior, and Uyghur/ULY presentation.

## Non-goals

- Adding a third language in this release.
- Redesigning the visual identity, navigation, lesson structure, or course data.
- Changing Uyghur glyph sizes, Arabic-script direction, ULY values, or audio files.
- Adding an icon library, web font, translation API, or other external dependency.
- Changing the China static build or claiming mainland-China network availability.

## Design

### 1. English responsive text

Use language-aware CSS under `html[lang="en"]` plus existing mobile breakpoints. Keep the established typography hierarchy, but make the English layout resilient:

- meaningful copy may wrap and containers must grow vertically;
- remove ellipsis or `white-space: nowrap` from English controls where it can hide required words;
- use `min-width: 0`, `overflow-wrap: break-word`, and appropriate grid/flex shrink behavior on text-bearing children;
- use small `clamp()` reductions for long English page titles, card headings, navigation labels, action buttons, and settings rows only at narrow widths;
- preserve current Uyghur `.uyghur` sizing and direction rules;
- do not solve clipping with horizontal scrolling or a global English scale transform.

The acceptance rule is that meaningful English elements show their complete text at 1280-pixel desktop and 390 x 844 mobile, and `document.documentElement.scrollWidth === window.innerWidth` on mobile.

### 2. Shared speaker icon

Keep `renderAudioButton()` as the single source of shared audio controls. Replace its visible localized word with an inline local SVG speaker:

- no external icon package or network request;
- speaker SVG is decorative and uses `aria-hidden="true"`;
- the button retains a localized accessible name such as `Play ب` or `播放 ب`;
- the click target remains approximately 42 x 42 pixels for touch accessibility, with an approximately 18-pixel speaker glyph so it looks visually compact;
- playable, hover/focus, playing feedback, and disabled styling continue to use the existing teal/gray system;
- all screens that consume the shared component update together in both Chinese and English.

Audio words that intentionally use the Uyghur word itself as the clickable control remain unchanged; only the shared text `Play`/`播放` button becomes the speaker icon.

### 3. Profile language dropdown

Replace the Profile segmented language buttons with a native `<select>` inside the existing language setting block:

- label `Language`/`语言` stays on the left;
- select stays on the right on desktop and 390-pixel mobile;
- current options remain Chinese and English, using the existing localized option labels and stable values `zh` and `en`;
- the selected value always reflects the active saved language;
- `change` calls the existing language-preference path so local persistence, reload behavior, Google-user sync, and in-place rerender behavior stay unchanged;
- future languages require adding an option/catalog entry rather than redesigning the control;
- the Home compact selector remains unchanged.

The native select is preferred over a custom menu because it provides keyboard, screen-reader, mobile-picker, focus, and expanded-option behavior without a new dependency.

## State and error behavior

- A valid `zh` or `en` selection uses the existing `setLanguage()` flow.
- Unknown or unavailable values are ignored and must not corrupt the saved preference.
- If local storage or cloud synchronization is unavailable, the visible language still changes using the existing local-first behavior.
- Disabled or missing audio remains non-interactive and keeps its accessible disabled presentation.
- Layout changes must not reset the current screen, typed answer, selected choice, progress, or handwriting strokes.

## Testing

### Automated

- Assert the shared audio control contains a speaker SVG, contains no visible `Play` or `播放` word, and preserves localized `aria-label`, data attributes, disabled state, and click behavior.
- Assert the Profile contains one language select with `zh`/`en`, the correct selected value, and no Profile segmented switcher.
- Assert select changes persist and preserve the same mutable lesson state covered by the existing language tests.
- Keep complete Chinese/English message-key parity and the 928-state render audit green.
- Update production asset cache versions for every modified runtime/style asset and test exact script/style URLs.
- Run the complete `scripts/check-project.mjs` suite and `git diff --check`.

### Browser QA

Test local and production builds at 1280-pixel desktop and 390 x 844 mobile:

- Home, Profile, alphabet directory/detail, combinations, vocabulary, reading, practice, both keyboard surfaces, listening, writing, completion, and account panels in English;
- no clipped meaningful text, no unintended ellipsis, and no horizontal overflow;
- speaker icon appears on every shared audio button and audio still starts;
- screen-reader name remains localized and includes the audio target;
- Profile dropdown is left-label/right-control, changes language, persists after reload, and remains horizontal on mobile;
- Home compact language control is unchanged;
- page identity, meaningful DOM, framework-overlay absence, and console health pass.

Capture desktop and mobile screenshots outside the repository.

## Delivery

- Commit implementation on the isolated feature branch.
- Open a focused GitHub pull request against `main`, merge only after checks and browser QA pass, and preserve the public repository About metadata.
- Deploy only `prototype/` to the existing Vercel project.
- Verify the deployment is READY and `https://ana-tilim.vercel.app` points to it.
- Do not perform real Google OAuth or claim mainland-China accessibility as part of this visual refinement.
