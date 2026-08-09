# International Guest and Google Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the international Ana Tilim UI expose only local guest learning and Google login while preserving local progress and signed-in cloud synchronization.

**Architecture:** Keep `renderCloudAuthControls()` as the shared welcome/profile authentication renderer. Replace only its signed-out markup with a guest explanation and Google button; keep the signed-in renderer, Google OAuth handler, local-progress flow, and lower-level password/OTP controller APIs unchanged.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner scripts, Supabase Google OAuth, Vercel static deployment

## Global Constraints

- The international Vercel build exposes only local guest learning and Google login.
- Keep `无需登录，直接开始学习`, local progress, `清除学习记录`, signed-in account summary, and `退出登录`.
- Do not render login/register tabs, display-name registration fields, email fields, password fields, password actions, or email-code actions while signed out.
- Do not change Supabase configuration, synchronization snapshots, merge rules, course content, navigation, or brand assets.
- Keep password and email-OTP methods in `prototype/cloud-sync.js` available internally but unreachable from the international UI.
- The simplified panel must fit desktop and 390 × 844 mobile viewports without horizontal overflow or clipped text.

---

### Task 1: Enforce the guest-and-Google render contract

**Files:**
- Modify: `tests/unit-learning-experience.test.mjs:581-705`
- Modify: `prototype/app.js:2089-2191`

**Interfaces:**
- Consumes: `cloudAccountEmail()`, `cloudStatusLabel()`, the existing `cloud-google-login` click action, and the signed-in account summary.
- Produces: `renderCloudAuthControls(): string`, whose signed-out result contains `data-action="cloud-google-login"` and no email/password/OTP controls.

- [ ] **Step 1: Replace the old signed-out render expectations with a failing guest-and-Google contract**

Keep the lower-level `validatePasswordAuthFields()` and `passwordAuthErrorMessage()` unit tests because the design intentionally retains the controller capability. Replace only the welcome/register/profile UI assertions with this contract:

```js
const forbiddenInternationalAuthUi = [
  'role="tablist"',
  'id="password-auth-name"',
  'id="password-auth-email"',
  'id="password-auth-password"',
  'id="password-auth-confirm"',
  'data-action="password-login"',
  'data-action="password-register"',
  'data-action="show-email-login"',
  'data-action="request-email-otp"',
  'data-action="verify-email-otp"',
  'id="auth-email"',
  'id="auth-code"'
];

function assertGuestAndGoogleOnly(html, label) {
  includesAll(
    html,
    [
      "本地游客模式",
      "无需登录即可学习，进度保存在当前设备。",
      "使用 Google 登录"
    ],
    label
  );
  for (const forbidden of forbiddenInternationalAuthUi) {
    assert.ok(!html.includes(forbidden), `${label} should not render ${forbidden}`);
  }
}

const welcomeHtml = renderState("state.screen = 'welcome'");
assertGuestAndGoogleOnly(welcomeHtml, "international welcome authentication");
assert.ok(welcomeHtml.includes('data-action="continue-local"'));
assert.ok(welcomeHtml.includes("登录后自动同步"));

vm.runInContext("state.preferences = normalizePreferences(null)", context);
const profileHtml = renderState("state.screen = 'profile'");
assertGuestAndGoogleOnly(profileHtml, "international profile authentication");
assert.ok(profileHtml.includes("清除学习记录"));
```

After the existing signed-in profile setup, add:

```js
includesAll(signedInProfileHtml, ["learner@example.com", "退出登录"], "signed-in Google account");
assert.ok(!signedInProfileHtml.includes("使用 Google 登录"));
```

- [ ] **Step 2: Run the focused test and verify it fails for the old form**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: FAIL because `本地游客模式` is absent and the old password/OTP controls are still rendered.

- [ ] **Step 3: Replace only the signed-out branch of `renderCloudAuthControls()`**

Keep the existing `if (accountEmail) { ... }` block unchanged. Replace everything after that block and before the function closes with:

```js
  return `
    <div class="cloud-account-summary">
      <strong>本地游客模式</strong>
      <small>无需登录即可学习，进度保存在当前设备。</small>
    </div>
    <div class="auth-actions">
      <button class="primary-button" data-action="cloud-google-login" type="button">
        使用 Google 登录
      </button>
    </div>
    <p class="caption auth-status-copy">${cloudStatusLabel()}</p>
  `;
```

Do not remove password/OTP validators, click-handler branches, `cloud-sync.js` methods, or stored state in this task.

- [ ] **Step 4: Run syntax and focused tests and verify they pass**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check prototype/app.js
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: both commands exit 0, and the learning-experience test reports success.

- [ ] **Step 5: Commit the render change**

```bash
git add prototype/app.js tests/unit-learning-experience.test.mjs
git commit -m "Show only guest and Google authentication"
```

### Task 2: Refresh the deployed JavaScript URL and run the full suite

**Files:**
- Modify: `tests/unit-learning-experience.test.mjs:40-65`
- Modify: `prototype/index.html:24`

**Interfaces:**
- Consumes: `prototype/app.js` from Task 1.
- Produces: the cache-busted international bundle URL `./app.js?v=20260808-google-guest-auth` in both the page and its resource-integrity test.

- [ ] **Step 1: Change the expected app bundle URL in the resource test**

Replace the expected `./app.js?v=20260729-password-auth-4` entry with:

```js
"./app.js?v=20260808-google-guest-auth"
```

- [ ] **Step 2: Run the focused test and verify the cache contract fails**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
```

Expected: FAIL because `prototype/index.html` still references the old app query string.

- [ ] **Step 3: Update the app script reference in `prototype/index.html`**

Use the exact tag:

```html
<script src="./app.js?v=20260808-google-guest-auth"></script>
```

No other stylesheet or script version changes are required.

- [ ] **Step 4: Run focused and full project checks**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/unit-learning-experience.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs
git diff --check
```

Expected: all commands exit 0 and `scripts/check-project.mjs` ends with `All project checks passed.`

- [ ] **Step 5: Commit the cache-safe page integration**

```bash
git add prototype/index.html tests/unit-learning-experience.test.mjs
git commit -m "Refresh international authentication bundle"
```

### Task 3: Publish and verify the international production site

**Files:**
- Verify only: `prototype/`
- Local generated files that must never be staged: `prototype/.env.local`, `prototype/.gitignore`, `prototype/.vercel/project.json`, `prototype/.vercel/README.txt`

**Interfaces:**
- Consumes: the green branch from Tasks 1 and 2.
- Produces: a merged GitHub PR and a `READY` Vercel production deployment at `https://ana-tilim.vercel.app`.

- [ ] **Step 1: Verify the exact branch before publication**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs
git status --short --branch
git log --oneline origin/main..HEAD
```

Expected: the suite is green, the worktree is clean, and only the design plus authentication implementation commits are ahead of `origin/main`.

- [ ] **Step 2: Push the feature branch and create a ready PR to `main`**

Run:

```bash
git push -u origin agent/google-guest-auth-only
```

Create a non-draft PR titled `Show only guest and Google authentication`, describing the removed UI, preserved guest/cloud behavior, and checks. Confirm it is mergeable, then squash-merge it into `main`. Do not delete the local worktree or unrelated branches.

- [ ] **Step 3: Link and deploy only the static prototype directory**

From `prototype/`, run the authenticated Vercel CLI 58.7.1 entrypoint:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /Users/nigarayaskar/Library/Caches/pnpm/dlx/b9a83329160104a473f0a6c223de2021/msk7s615-10de/node_modules/vercel/dist/index.js link --yes --project ana-tilim
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node /Users/nigarayaskar/Library/Caches/pnpm/dlx/b9a83329160104a473f0a6c223de2021/msk7s615-10de/node_modules/vercel/dist/index.js deploy --prod --yes
```

Expected: `nigarayyy/ana-tilim` is linked, the deployment reaches `READY`, and `https://ana-tilim.vercel.app` serves the new app query string.

- [ ] **Step 4: Verify the production UI in a real browser**

At desktop and 390 × 844 viewports:

1. Load `https://ana-tilim.vercel.app` with a cache-busting query.
2. Confirm title `Ana Tilim`, meaningful non-empty DOM, no framework error overlay, and no relevant console errors or warnings.
3. Open `我的`.
4. Confirm `本地游客模式`, `无需登录即可学习，进度保存在当前设备。`, `使用 Google 登录`, and `清除学习记录` are visible.
5. Confirm no login/register tablist, email textbox, password textbox, password login/registration action, or email-code action exists in the DOM.
6. Confirm `document.documentElement.scrollWidth === window.innerWidth` at 390 × 844.
7. Return to `首页`, click `继续学习`, and confirm `第一单元：认识字母` renders without console errors.
8. Capture desktop and mobile screenshots outside the repository.

- [ ] **Step 5: Remove only Vercel-generated local files and recheck the repository**

Delete each generated file as an individual explicit path; do not recursively delete the `.vercel` directory:

```bash
rm prototype/.env.local
rm prototype/.gitignore
rm prototype/.vercel/project.json
rm prototype/.vercel/README.txt
```

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs
git status --short --branch
```

Expected: all checks pass and no generated credentials, deployment metadata, or source changes remain in the worktree.
