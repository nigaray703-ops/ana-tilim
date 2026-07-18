# Ana Tilim Clickable Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first static clickable webpage prototype for Ana Tilim that walks through the first learning loop from welcome screen to course completion.

**Architecture:** The prototype is a static `HTML + CSS + JavaScript` app inside `prototype/`. `index.html` owns the phone-frame shell and app mount point, `styles.css` owns visual design and responsive layout, and `app.js` owns screen data, state, rendering, and click interactions.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, local image asset copied from `资料/assets/image-1.png`.

## Global Constraints

- Keep all new prototype files inside `prototype/`.
- Use static `HTML + CSS + JavaScript`; no framework, package install, build step, or network dependency.
- Mobile-first layout; desktop view centers a phone-width experience.
- Bottom navigation labels: 首页、学习、书写、词库、我的。
- Prototype flow: welcome → home → learning path → letter → writing → picture vocabulary → listening choice → keyboard input → completion.
- Use example content: letter `ب`, forms `ب` / `بـ` / `ـبـ` / `ـب`, word `بالا`, Chinese meaning `孩子`, transliteration `bala`.
- Preserve RTL display for Uyghur text and keyboard input.
- Unimplemented features show a light toast instead of dead-ending.
- Do not implement login, cloud sync, real database, real uploaded audio, pronunciation scoring, handwriting recognition, PWA install config, or admin backend.

---

## File Structure

- Create: `prototype/index.html`
  - Document shell, metadata, font fallback, app root, toast root, script/style links.
- Create: `prototype/styles.css`
  - Design tokens, phone frame, cards, buttons, bottom navigation, RTL fields, practice feedback, responsive rules.
- Create: `prototype/app.js`
  - Data constants, app state, screen renderers, event delegation, virtual keyboard input, toast feedback.
- Create: `prototype/assets/logo.png`
  - Binary copy of `资料/assets/image-1.png`.

---

### Task 1: Prototype Shell and Asset

**Files:**
- Create: `prototype/index.html`
- Create: `prototype/assets/logo.png`

**Interfaces:**
- Produces: `#app` element for JavaScript rendering.
- Produces: `#toast` element for lightweight feedback messages.
- Consumes: `prototype/assets/logo.png` from CSS/HTML image paths.

- [ ] **Step 1: Create prototype directories and copy Logo**

Run:

```bash
mkdir -p prototype/assets
cp '资料/assets/image-1.png' prototype/assets/logo.png
```

Expected: `prototype/assets/logo.png` exists and opens as the Ana Tilim Logo.

- [ ] **Step 2: Create the HTML shell**

Create `prototype/index.html` with:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Ana Tilim Prototype</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <main class="phone-shell" aria-label="Ana Tilim clickable prototype">
      <section id="app" class="app-screen"></section>
      <div id="toast" class="toast" role="status" aria-live="polite"></div>
    </main>
    <script src="./app.js"></script>
  </body>
</html>
```

- [ ] **Step 3: Verify shell references**

Run:

```bash
test -f prototype/index.html
test -f prototype/assets/logo.png
```

Expected: both commands exit successfully.

---

### Task 2: Visual System and Layout CSS

**Files:**
- Create: `prototype/styles.css`

**Interfaces:**
- Consumes: classes emitted by `app.js`: `.view`, `.card`, `.primary-button`, `.bottom-nav`, `.uyghur`, `.choice-card`, `.keyboard-grid`, `.toast.show`.
- Produces: mobile-first layout where `.phone-shell` is max-width phone sized and centered on desktop.

- [ ] **Step 1: Define design tokens and page shell**

Create `prototype/styles.css` with CSS variables for:

```css
:root {
  --ink: #162657;
  --ink-soft: #4f5d85;
  --teal: #0e9bb1;
  --teal-soft: #dff6f7;
  --gold: #e7b95d;
  --cream: #fffaf0;
  --paper: #ffffff;
  --mint: #15a084;
  --coral: #d96c63;
  --line: rgba(22, 38, 87, 0.12);
  --shadow: 0 18px 42px rgba(22, 38, 87, 0.12);
}
```

Include global box sizing, body background, `.phone-shell`, `.app-screen`, and responsive centering.

- [ ] **Step 2: Add component styling**

Add styles for:

- Top brand mark and Logo image.
- Cards with restrained 8px radius.
- Primary and secondary buttons.
- Progress chips.
- Letter form grid.
- Drawing pad mock canvas.
- Choice cards and selected/correct/wrong states.
- RTL input field.
- Virtual keyboard.
- Bottom navigation.
- Toast.

- [ ] **Step 3: Verify stylesheet exists and is non-empty**

Run:

```bash
test -s prototype/styles.css
```

Expected: command exits successfully.

---

### Task 3: App Data, Screens, and Navigation

**Files:**
- Create: `prototype/app.js`

**Interfaces:**
- Consumes: `#app` and `#toast` from `index.html`.
- Produces: `navigate(screenName)` behavior through `data-action="go"` and `data-target="screenName"` attributes.
- Produces: `render()` that updates the visible screen from `state.screen`.

- [ ] **Step 1: Define data and state**

Create top-level JavaScript constants:

```js
const course = {
  letter: "ب",
  forms: [
    { label: "独立", value: "ب" },
    { label: "词首", value: "بـ" },
    { label: "词中", value: "ـبـ" },
    { label: "词尾", value: "ـب" }
  ],
  word: "بالا",
  meaning: "孩子",
  transliteration: "bala",
  theme: "家庭 / 基础称呼"
};

const state = {
  screen: "welcome",
  selectedPicture: "",
  selectedListening: "",
  keyboardValue: "",
  showGuide: true,
  favorite: false
};
```

- [ ] **Step 2: Implement screen renderers**

Implement render functions for:

- `renderWelcome()`
- `renderHome()`
- `renderLearnPath()`
- `renderLetter()`
- `renderWriting()`
- `renderPicturePractice()`
- `renderListeningPractice()`
- `renderKeyboardPractice()`
- `renderComplete()`
- `renderLibrary()`
- `renderProfile()`

Each renderer returns an HTML string.

- [ ] **Step 3: Implement bottom navigation**

Add a shared `bottomNav(active)` function with fixed labels:

```js
[
  ["home", "首页"],
  ["learn", "学习"],
  ["writing", "书写"],
  ["library", "词库"],
  ["profile", "我的"]
]
```

Bottom navigation appears on main app screens, not the welcome screen.

- [ ] **Step 4: Implement event delegation**

Add one document click listener that handles:

- `data-action="go"`: set `state.screen` to `data-target`.
- `data-action="pick-picture"`: store answer and show feedback.
- `data-action="pick-listening"`: store answer and show feedback.
- `data-action="key"`: append Uyghur character to `state.keyboardValue`.
- `data-action="backspace"`: remove last character.
- `data-action="clear-input"`: clear keyboard input.
- `data-action="toggle-guide"`: toggle writing guide.
- `data-action="toggle-favorite"`: toggle favorite.
- `data-action="toast"`: show future-feature message.

- [ ] **Step 5: Verify no missing render path**

Run:

```bash
grep -n "function render" prototype/app.js
grep -n "case" prototype/app.js
```

Expected: every screen in the design has a renderer or switch case.

---

### Task 4: Interaction Polish and Validation

**Files:**
- Modify: `prototype/styles.css`
- Modify: `prototype/app.js`

**Interfaces:**
- Consumes: completed HTML/CSS/JS from earlier tasks.
- Produces: clickable end-to-end prototype with no blank screens.

- [ ] **Step 1: Manual flow check**

Open `prototype/index.html` in a browser and click:

```text
开始学习 → 继续学习 → 开始第一课 → 继续书写 → 完成描摹 → 继续练习 → 选择正确图片 → 继续听力 → 播放发音 → 选择正确答案 → 继续键盘 → click ب / ا / ل / ا → 完成课程
```

Expected: the completion page appears.

- [ ] **Step 2: Validate RTL input**

On keyboard page, click keys to produce:

```text
بالا
```

Expected: input field shows Uyghur text right-aligned and right-to-left.

- [ ] **Step 3: Validate bottom navigation**

Click:

```text
首页、学习、书写、词库、我的
```

Expected: each tab displays a real screen and does not produce a blank page.

- [ ] **Step 4: Validate responsive layout**

Inspect at widths:

```text
390px, 430px, 768px, 1280px
```

Expected: phone content stays readable; on desktop the app is centered instead of stretched.

- [ ] **Step 5: Final status check**

Run:

```bash
git status --short
```

Expected: only intentional project files are changed or untracked.
