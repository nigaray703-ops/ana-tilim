# Offline Learning and Local Backup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the course installable and usable offline, let learners explicitly cache or remove all human audio, and provide validated JSON export/import without risking existing progress.

**Architecture:** A versioned Service Worker owns app-shell and runtime audio caches. A testable `offline-manager.js` wraps registration, deduplicated audio download, progress reporting, and deletion; `backup.js` owns versioned data selection and validation; `app.js` only renders status and dispatches user actions.

**Tech Stack:** Web App Manifest, Service Worker, Cache Storage, plain browser JavaScript, Node `assert`/`vm` tests, in-app Browser QA.

## Global Constraints

- Automatically cache the program and course text, but never automatically download all human audio.
- Download the existing 529 physical audio files once; preserve all 565 logical coverage targets and reuse relations.
- Removing offline audio must not remove progress, settings, app-shell cache, or cloud data.
- Invalid imported files must leave current data unchanged.
- The website must still run online if Service Worker or Cache Storage is unavailable.
- Do not add a bottom-navigation item.
- Use failing tests before every production change.
- If Git author identity is unavailable, do not configure it implicitly.

---

### Task 1: Installable app shell and Service Worker

**Files:**
- Create: `prototype/manifest.webmanifest`
- Create: `prototype/service-worker.js`
- Create: `prototype/assets/icon-192.png`
- Create: `prototype/assets/icon-512.png`
- Create: `tests/service-worker.test.mjs`
- Modify: `prototype/index.html`
- Modify: `scripts/check-project.mjs`
- Modify: `tests/unit-learning-experience.test.mjs`

**Interfaces:**
- Produces caches:
  - `ana-tilim-app-20260726-listening-offline-sync`
  - `ana-tilim-audio-20260726-listening-offline-sync`
- Produces `navigator.serviceWorker.register("./service-worker.js")`.

- [ ] **Step 1: Write a failing Service Worker test**

Create a VM harness that captures `install`, `activate`, and `fetch` handlers:

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const handlers = {};
const context = {
  self: {
    location: { origin: "http://127.0.0.1:4173" },
    addEventListener(name, handler) {
      handlers[name] = handler;
    },
    skipWaiting() {}
  },
  caches: {},
  fetch() {},
  URL,
  Request,
  Response
};
vm.createContext(context);
vm.runInContext(fs.readFileSync("prototype/service-worker.js", "utf8"), context);
assert.equal(typeof handlers.install, "function");
assert.equal(typeof handlers.activate, "function");
assert.equal(typeof handlers.fetch, "function");
assert.ok(
  fs.readFileSync("prototype/service-worker.js", "utf8").includes("ana-tilim-app-20260726-listening-offline-sync")
);
console.log("service worker checks passed");
```

- [ ] **Step 2: Run and verify the missing-file failure**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/service-worker.test.mjs
```

Expected: FAIL because the Service Worker is absent.

- [ ] **Step 3: Create the manifest**

Generate `prototype/assets/icon-192.png` and `prototype/assets/icon-512.png` from the existing 1254×1254 `prototype/assets/logo.png` without altering the logo artwork. Include:

```json
{
  "name": "Ana Tilim",
  "short_name": "Ana Tilim",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#fffaf0",
  "theme_color": "#0e9bb1",
  "lang": "zh-CN",
  "dir": "ltr"
}
```

- [ ] **Step 4: Implement versioned app-shell caching**

In `prototype/service-worker.js`:

- pre-cache `./`, `./index.html`, versioned CSS/JS, course-data scripts, audio controller/offline manager/backup scripts, manifest, and icons;
- delete only obsolete `ana-tilim-app-*` caches on activate;
- use network-first navigation with cached `index.html` fallback;
- use cache-first for versioned same-origin static assets;
- use cache-first for human audio but only cache an audio response after the user or page requests that file;
- never intercept Supabase API/auth requests.

- [ ] **Step 5: Register without blocking page startup**

Add the manifest link to `index.html` and register after scripts load:

```js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
```

Extend the asset-version contract test so `manifest.webmanifest`, `service-worker.js`, and all new first-party runtime scripts use `20260726-listening-offline-sync`.

- [ ] **Step 6: Add syntax/test checks and run**

Add `node --check prototype/service-worker.js` and `tests/service-worker.test.mjs` to `scripts/check-project.mjs`. Run the focused and complete checks.

- [ ] **Step 7: Commit the PWA shell**

```bash
git add prototype/manifest.webmanifest prototype/service-worker.js prototype/index.html prototype/assets/icon-192.png prototype/assets/icon-512.png tests/service-worker.test.mjs tests/unit-learning-experience.test.mjs scripts/check-project.mjs
git commit -m "feat: add offline app shell"
```

---

### Task 2: Deduplicated human-audio download manager

**Files:**
- Create: `prototype/offline-manager.js`
- Create: `tests/offline-manager.test.mjs`
- Modify: `prototype/index.html`
- Modify: `scripts/check-project.mjs`
- Modify: `tests/unit-learning-experience.test.mjs`

**Interfaces:**
- Produces `window.ANA_TILIM_OFFLINE.createOfflineManager(options)`.
- Controller methods:
  - `register(): Promise<{ supported, registered }>`
  - `status(): Promise<{ supported, downloaded, total, bytes, complete }>`
  - `downloadAll(urls): Promise<{ downloaded, total, failed }>`
  - `clearAudio(): Promise<void>`
  - `isAudioCached(url): Promise<boolean>`
- Options: `{ navigatorRef, cachesRef, fetchRef, cacheName, onProgress }`.

- [ ] **Step 1: Write failing manager tests**

Use in-memory fake Cache Storage and a fake fetch that records URLs. Pass:

```js
[
  "./assets/audio/human/alphabet/a.webm",
  "./assets/audio/human/alphabet/a.webm",
  "./assets/audio/human/vocab/b.webm"
]
```

Assert only two network requests, progressive callbacks `1/2` and `2/2`, repeated download causes zero new requests, and `clearAudio()` deletes only the audio cache.

- [ ] **Step 2: Run and verify the missing API failure**

Expected: FAIL because `ANA_TILIM_OFFLINE` is undefined.

- [ ] **Step 3: Implement the manager**

Normalize URLs against `location.href` for cache keys, but report project-relative labels to the UI. Download sequentially or with a maximum concurrency of four; do not start 529 simultaneous fetches.

Only cache successful responses:

```js
if (!response.ok && response.type !== "opaque") {
  throw new Error(`HTTP ${response.status}`);
}
await cache.put(request, response.clone());
```

Count response `content-length` when available; otherwise show file progress and label size as approximate.

- [ ] **Step 4: Load the manager before `app.js`**

Add:

```html
<script src="./offline-manager.js?v=20260726-listening-offline-sync"></script>
```

Add the exact URL to the versioned-asset assertion. Add syntax and focused tests to the complete check script.

- [ ] **Step 5: Run focused and complete checks**

Expected: deduplication, resume, status, and scoped deletion pass.

- [ ] **Step 6: Commit the manager**

```bash
git add prototype/offline-manager.js prototype/index.html tests/offline-manager.test.mjs tests/unit-learning-experience.test.mjs scripts/check-project.mjs
git commit -m "feat: add offline audio manager"
```

---

### Task 3: Offline-learning controls in “My”

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

**Interfaces:**
- Consumes: `allAudioCoverageTargets()` and `ANA_TILIM_OFFLINE.createOfflineManager`.
- Produces state:
  - `offlineStatus: "checking" | "ready" | "downloading" | "complete" | "error" | "unsupported"`
  - `offlineDownloaded: number`
  - `offlineTotal: number`
  - `offlineBytes: number`
- Produces actions: `download-offline-audio`, `request-clear-offline-audio`, `confirm-clear-offline-audio`.

- [ ] **Step 1: Add failing profile rendering tests**

Render profile and assert:

```text
离线学习
下载全部音频
约 15MB
```

Simulate download progress and assert the button becomes disabled and progress is announced with `aria-live`. Request deletion and assert a confirmation appears before `clearAudio()` is called.

- [ ] **Step 2: Run and verify missing UI**

Expected: FAIL because there is no offline-learning group.

- [ ] **Step 3: Build the deduplicated URL list**

Use:

```js
function allHumanAudioUrls() {
  return [...new Set(
    allAudioCoverageTargets()
      .map((item) => item.audio?.outputPath)
      .filter(Boolean)
  )];
}
```

Add a test asserting the result is 529 physical files while logical coverage remains 565.

- [ ] **Step 4: Add the profile controls**

Render status, downloaded/total, approximate bytes, download button, and deletion confirmation. Do not hide account or learning preferences.

- [ ] **Step 5: Distinguish offline-missing audio**

Before showing the generic playback failure toast, check `navigator.onLine` and `offlineManager.isAudioCached(src)`. Use:

```text
当前离线，这段音频尚未下载
```

for that case.

- [ ] **Step 6: Run focused and complete checks**

Expected: 529 physical URLs, 565 logical targets, no profile duplication, and no regression in the four-item bottom navigation.

- [ ] **Step 7: Commit the offline UI**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: add offline audio controls"
```

---

### Task 4: Versioned JSON backup and restore

**Files:**
- Create: `prototype/backup.js`
- Create: `tests/backup.test.mjs`
- Modify: `prototype/index.html`
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `scripts/check-project.mjs`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

**Interfaces:**
- Produces `window.ANA_TILIM_BACKUP`:
  - `SCHEMA_VERSION`
  - `createBackup(source, now): object`
  - `parseBackup(text): { ok, backup?, summary?, error? }`
  - `downloadBackup(backup, documentRef, URLRef): void`
- Backup fields: `learningProgress`, `mistakes`, `favorite`, `dailyActivity`, `preferences`.

- [ ] **Step 1: Write failing pure backup tests**

Assert exported data excludes `mockUserEmail`, `screen`, `keyboardValue`, and audio. Assert the envelope contains:

```js
{
  app: "ana-tilim",
  schemaVersion: 1,
  exportedAt: "2026-07-26T00:00:00.000Z",
  data: { /* selected fields */ }
}
```

Assert malformed JSON, wrong `app`, unsupported version, missing progress, and non-array mistakes return `{ ok: false }`.

- [ ] **Step 2: Run and verify missing-file failure**

Expected: FAIL because `backup.js` is absent.

- [ ] **Step 3: Implement selection and validation**

Clone selected values through JSON serialization. `parseBackup()` must never throw to the click/change handler. Return a summary with completed-scope counts, mistake count, favorite state, and export date.

- [ ] **Step 4: Add export/import UI**

In “账号与数据” add:

- “导出学习备份” button;
- visually styled file input accepting `.json,application/json`;
- pending import summary;
- cancel/confirm controls.

Listen for `change` on the exact input ID. Read with `file.text()`, validate, and only store the pending validated object in state. Do not mutate learning state before confirmation.

Load `backup.js` before `app.js` in `index.html` and both VM render harnesses. Add its exact versioned URL to the asset assertion.

- [ ] **Step 5: Apply import safely**

On confirmation:

1. snapshot current persisted state;
2. replace only the five backup fields through existing normalizers;
3. save locally;
4. if save fails, restore the snapshot and show an error;
5. if save succeeds, clear pending import, render, and show success.

- [ ] **Step 6: Run backup, UI, and full checks**

Expected: invalid input has no side effect; successful import preserves current email and account session.

- [ ] **Step 7: Commit backup support**

```bash
git add prototype/backup.js prototype/index.html prototype/app.js prototype/styles.css tests/backup.test.mjs tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs scripts/check-project.mjs
git commit -m "feat: add local learning backups"
```

---

### Task 5: Offline rendered validation

**Files:**
- Modify only if QA finds a defect in files owned by Tasks 1–4.

**Interfaces:**
- Consumes the completed PWA, offline manager, and backup flows.
- Produces browser evidence and a clean final project check.

- [ ] **Step 1: Run the complete project check**

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs
```

- [ ] **Step 2: Validate PWA identity**

Using the in-app Browser at the existing local URL:

- confirm manifest loads;
- confirm Service Worker reaches `activated`;
- reload once under normal network;
- confirm the page is not blank and console is clean.

- [ ] **Step 3: Validate audio download lifecycle**

Test:

```text
我的 → 下载全部音频 → observe progress → reload → status remains complete
我的 → 删除离线音频 → cancel → cache remains
我的 → 删除离线音频 → confirm → progress returns to 0
```

Do not delete or modify source audio files; this only operates on browser caches.

- [ ] **Step 4: Validate offline behavior**

Use the Browser's supported network/offline capability if available. If it is unavailable, verify Cache Storage contents and document that network-disconnect simulation remains untested. Confirm cached page and cached audio work and uncached audio shows the offline-specific message.

- [ ] **Step 5: Validate backup lifecycle**

Export, inspect the JSON fields, import the same file, verify summary and confirmation, and verify email/settings preservation. Test an invalid JSON file outside the repository.

- [ ] **Step 6: Validate phone and tablet layout**

Check 390×844 and 952×998 with no overflow, clipped progress copy, covered confirmation controls, or bottom-navigation changes.

- [ ] **Step 7: Record the QA result**

If no defect is found, append the exact checked viewports, flows, and remaining offline-simulation limitation to the task report without changing production files. If a defect is found, add a failing regression test, make the smallest fix, rerun the complete check, stage only that regression test and its production fix, and commit with a focused message.
