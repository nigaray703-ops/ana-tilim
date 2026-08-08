# Ana Tilim Logo and Site Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the deployed Ana Tilim logo with the user-provided artwork and add verified browser, Apple Touch, and PWA icons derived from its emblem.

**Architecture:** Preserve the supplied 1254 × 1254 PNG exactly as `prototype/assets/logo.png`. Generate icon variants from one deterministic square crop of that file, reference them through relative URLs in `prototype/index.html` and a new web manifest, and add a focused automated asset test to prevent broken icon paths or dimensions.

**Tech Stack:** Static HTML, Web App Manifest, PNG, Python Pillow for deterministic crop/resize, Node.js tests

## Global Constraints

- Preserve the user-provided full logo exactly; do not redraw, recolor, translate, or alter visible text.
- Crop only the upper blue, teal, and gold book emblem for site icons.
- Keep the off-white background and do not declare the icons `maskable`.
- Use only relative asset paths.
- Do not change authentication, courses, languages, layout, or other application behavior.

---

### Task 1: Add brand-asset validation

**Files:**
- Create: `tests/brand-assets.test.mjs`
- Modify: `scripts/check-project.mjs`

**Interfaces:**
- Consumes: `prototype/index.html`, `prototype/manifest.webmanifest`, `prototype/assets/logo.png`, and files under `prototype/assets/icons/`.
- Produces: a Node.js check that exits nonzero when a referenced brand asset is missing, external, malformed, or has the wrong PNG dimensions.

- [ ] **Step 1: Write the failing brand-asset test**

Create `tests/brand-assets.test.mjs`. It must:

- parse `prototype/manifest.webmanifest` as JSON;
- assert `start_url === "./"`, `display === "standalone"`, and icon sources are relative;
- assert `index.html` references `./assets/icons/favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png`, and `./manifest.webmanifest`;
- read PNG IHDR width/height values at byte offsets 16 and 20;
- assert dimensions for the full logo and all five generated icon files;
- print `brand asset checks passed` only after every assertion succeeds.

- [ ] **Step 2: Add the test to the project check runner**

Add this entry before the Git whitespace check in `scripts/check-project.mjs`:

```js
{
  label: "test: brand assets",
  command: node,
  args: ["tests/brand-assets.test.mjs"]
}
```

- [ ] **Step 3: Run the new test and verify it fails**

Run:

```bash
node tests/brand-assets.test.mjs
```

Expected: failure because the manifest and icon variants do not exist yet.

### Task 2: Replace the logo and generate icon variants

**Files:**
- Modify: `prototype/assets/logo.png`
- Create: `prototype/assets/icons/favicon-16.png`
- Create: `prototype/assets/icons/favicon-32.png`
- Create: `prototype/assets/icons/apple-touch-icon.png`
- Create: `prototype/assets/icons/icon-192.png`
- Create: `prototype/assets/icons/icon-512.png`

**Interfaces:**
- Consumes: `/Users/nigarayaskar/Desktop/1594A7E3-2D8A-4E75-92B1-9DD44769BEDB.png`.
- Produces: one exact full-logo replacement and five square icon assets consumed by Task 3.

- [ ] **Step 1: Replace the full logo exactly**

Copy the supplied source over `prototype/assets/logo.png`, then compare SHA-256 hashes.

Expected source and destination hash:

```text
291001d9b3c71018b4d9be811968bda8605affb489bb015862fdbaf4cfebb2d9
```

- [ ] **Step 2: Generate the site icons deterministically**

Use Pillow to crop `(287, 80, 967, 760)` from the replaced 1254 × 1254 logo. This is a 680 × 680 square centered on the upper emblem with off-white padding and excludes the lettering below it. Resize the crop with `Image.Resampling.LANCZOS` to 16, 32, 180, 192, and 512 pixels and save optimized RGB PNGs under `prototype/assets/icons/` using the filenames in the design.

- [ ] **Step 3: Inspect the icon artwork**

Open the 512 × 512 result at original detail and confirm:

- the complete book emblem is visible;
- no `Ana Tilim`, Uyghur, or `LEARN UYGHUR` text remains;
- padding is balanced and no edge is clipped;
- the 32 × 32 result remains recognizable.

### Task 3: Integrate favicon, Apple Touch Icon, and web manifest

**Files:**
- Modify: `prototype/index.html`
- Create: `prototype/manifest.webmanifest`

**Interfaces:**
- Consumes: the five icon files created by Task 2.
- Produces: browser and installable-web-app metadata using only relative URLs.

- [ ] **Step 1: Create the web manifest**

Create `prototype/manifest.webmanifest` with the exact fields from the design:

```json
{
  "name": "Ana Tilim",
  "short_name": "Ana Tilim",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#fbf7f0",
  "theme_color": "#0b2a55",
  "icons": [
    {
      "src": "./assets/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "./assets/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ]
}
```

- [ ] **Step 2: Add head metadata**

Add relative favicon, Apple Touch Icon, manifest, and `theme-color` tags immediately after the `<title>` in `prototype/index.html`.

- [ ] **Step 3: Run focused and full checks**

Run:

```bash
node tests/brand-assets.test.mjs
node scripts/check-project.mjs
git diff --check
```

Expected: `brand asset checks passed`, `All project checks passed.`, and no whitespace errors.

- [ ] **Step 4: Serve and visually inspect**

Serve `prototype/` at `http://127.0.0.1:4173/`. Verify the welcome screen at desktop and 390 × 844 mobile viewport widths, then request the manifest and every icon URL over HTTP and confirm status 200 with PNG or manifest MIME types.

- [ ] **Step 5: Commit the implementation**

Stage only the logo, icon assets, manifest, HTML integration, test, check-runner update, and this implementation plan. Commit with:

```bash
git commit -m "Update Ana Tilim logo and site icons"
```
