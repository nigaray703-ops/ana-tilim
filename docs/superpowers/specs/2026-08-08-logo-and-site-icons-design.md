# Ana Tilim Logo and Site Icons Design

## Goal

Replace the current Ana Tilim artwork with the user-provided new logo and add
browser, iOS home-screen, and installable-web-app icons derived from the same
brand mark. No authentication, course, language, or layout behavior changes are
part of this task.

## Source of truth

- Source file: `/Users/nigarayaskar/Desktop/1594A7E3-2D8A-4E75-92B1-9DD44769BEDB.png`
- Source dimensions: 1254 × 1254 pixels, RGB PNG.
- Preserve the supplied artwork exactly for the full logo. Do not redraw,
  regenerate, recolor, translate, or alter the visible text.
- Git history is the recovery path for the previous logo; do not create an
  extra backup asset in the deployed `prototype/` directory.

## Full logo

Replace `prototype/assets/logo.png` byte-for-byte with the supplied source
image. Existing application and README references continue to use the same
relative path, so the international deployment receives the new logo without
changing application behavior.

## Site icon crop

Derive the site icons deterministically from the upper blue, teal, and gold
book emblem only. Exclude the `Ana Tilim`, Uyghur, and `LEARN UYGHUR` text so the
mark remains recognizable at 16–32 pixels.

Use a square crop with restrained off-white padding around the complete emblem.
Do not use generative image editing because exact preservation of the supplied
brand artwork is more important than inventing detail.

Create these PNG assets under `prototype/assets/icons/`:

- `favicon-16.png` — 16 × 16
- `favicon-32.png` — 32 × 32
- `apple-touch-icon.png` — 180 × 180
- `icon-192.png` — 192 × 192
- `icon-512.png` — 512 × 512

All icons retain the source's off-white background. Do not declare them
`maskable`, because the crop has not been designed with a guaranteed mask-safe
zone.

## HTML and manifest integration

Update `prototype/index.html` to reference:

- the 16 × 16 and 32 × 32 PNG favicons;
- the 180 × 180 Apple Touch Icon;
- a new `prototype/manifest.webmanifest`.

The manifest uses:

- name: `Ana Tilim`
- short name: `Ana Tilim`
- start URL: `./`
- display: `standalone`
- background color: `#fbf7f0`
- theme color: `#0b2a55`
- the relative 192 × 192 and 512 × 512 icon paths.

Add matching `theme-color` metadata to `index.html`. All paths remain relative
so Vercel and future static mirrors can serve the same files.

## Validation

- Confirm the full logo hash matches the user-provided source hash.
- Confirm every icon is square and has the declared pixel dimensions.
- Confirm `index.html` and `manifest.webmanifest` contain only valid relative
  icon paths and every referenced file exists.
- Run `node scripts/check-project.mjs` and `git diff --check`.
- Serve `prototype/` over HTTP and visually inspect the welcome logo plus the
  favicon/manifest requests on desktop and mobile-sized viewports.
