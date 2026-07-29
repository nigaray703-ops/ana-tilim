# Ana Tilim Email Password Registration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add free email-password registration and login, persistent sessions, editable learner names, recoverable guest-progress backup, and first-unit initialization for newly registered users.

**Architecture:** Extend the existing `ANA_TILIM_CLOUD` controller with password-auth and profile-update methods while keeping Supabase credentials and session handling inside `cloud-sync.js`. Keep UI state, validation, guest backup, new-user initialization, and navigation in the existing static frontend. Reuse the current learning snapshot schema and cloud reconciliation path; only the registration path receives the explicit fresh-start behavior.

**Tech Stack:** Static HTML/CSS/JavaScript, Supabase Auth and Storage, Node.js built-in test runner, Vercel static deployment, Browser plugin QA.

## Global Constraints

- Keep guest learning and Google login available.
- Use Supabase email-password authentication; do not build custom username authentication.
- Do not require SMTP or email confirmation in this phase.
- Do not add password recovery in this phase.
- Passwords must be at least 8 characters and must never be stored by the application.
- A failed registration must not reset or overwrite guest learning data.
- A successful new registration must back up guest progress, initialize blank progress, and start at the first letter unit.
- Existing-account login must retain the current local/cloud merge behavior.
- Login and registration success must navigate to Home.
- Preserve all unrelated user edits in the dirty worktree.

---

### Task 1: Password Authentication Controller

**Files:**
- Modify: `prototype/cloud-sync.js`
- Test: `tests/cloud-sync.test.mjs`

**Interfaces:**
- Consumes: existing `ensureAuth()`, `reconcile()`, `setStatus()`, and `currentSession`.
- Produces:
  - `signUpWithPassword(email: string, password: string, displayName: string): Promise<{ session: object, user: object }>`
  - `signInWithPassword(email: string, password: string): Promise<object>`
  - `updateDisplayName(displayName: string): Promise<string>`
  - `profile(): { email: string, displayName: string, avatarUrl: string }`
  - an internal `skipNextSignedInReconcile: boolean` guard that prevents guest progress from uploading during new registration

- [ ] **Step 1: Write failing controller tests**

Add a fake Supabase auth client that records calls and assert:

```js
await controller.signUpWithPassword(
  "learner@example.com",
  "safe-pass-123",
  "Nigar"
);
assert.deepEqual(calls.at(-1), [
  "sign-up",
  {
    email: "learner@example.com",
    password: "safe-pass-123",
    options: { data: { full_name: "Nigar" } }
  }
]);

await controller.signInWithPassword("learner@example.com", "safe-pass-123");
assert.deepEqual(calls.at(-1), [
  "password-login",
  { email: "learner@example.com", password: "safe-pass-123" }
]);

await controller.updateDisplayName("Ana");
assert.equal(controller.profile().displayName, "Ana");
```

Also assert that `signUpWithPassword` throws when Supabase returns no session, so an email-confirmation configuration cannot be mistaken for a completed registration.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
'/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' --test tests/cloud-sync.test.mjs
```

Expected: FAIL because `signUpWithPassword`, `signInWithPassword`, and `updateDisplayName` are not defined.

- [ ] **Step 3: Implement the minimal controller methods**

Use Supabase Auth directly:

```js
async function signUpWithPassword(email, password, displayName) {
  setStatus({ phase: "registering", error: "" });
  skipNextSignedInReconcile = true;
  const result = await ensureAuth().signUp({
    email,
    password,
    options: { data: { full_name: displayName } }
  });
  if (result?.error) {
    skipNextSignedInReconcile = false;
    throw result.error;
  }
  if (!result?.data?.session) {
    skipNextSignedInReconcile = false;
    throw new Error("注册需要邮箱确认，请检查登录设置");
  }
  currentSession = result.data.session;
  setStatus({ phase: "signed-in", authEvent: "SIGNED_UP", error: "" });
  return result.data;
}

async function signInWithPassword(email, password) {
  setStatus({ phase: "signing-in", error: "" });
  const result = await ensureAuth().signInWithPassword({ email, password });
  if (result?.error) throw result.error;
  currentSession = result?.data?.session || null;
  setStatus({
    phase: currentSession ? "signed-in" : "ready",
    authEvent: currentSession ? "SIGNED_IN" : "",
    error: ""
  });
  if (currentSession) await reconcile();
  return currentSession;
}

async function updateDisplayName(displayName) {
  const result = await ensureAuth().updateUser({
    data: { full_name: displayName }
  });
  if (result?.error) throw result.error;
  currentSession = { ...currentSession, user: result.data.user };
  setStatus({ phase: "signed-in", authEvent: "PROFILE_UPDATED", error: "" });
  return displayName;
}
```

In `onAuthStateChange`, consume the registration guard before the existing reconcile call:

```js
const shouldSkipReconcile =
  Boolean(currentSession) &&
  event === "SIGNED_IN" &&
  skipNextSignedInReconcile;
if (shouldSkipReconcile) skipNextSignedInReconcile = false;
if (currentSession && event === "SIGNED_IN" && !shouldSkipReconcile) {
  void reconcile();
}
```

Expose all three methods from the frozen controller return object.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run the command from Step 2.

Expected: PASS with `cloud snapshot, authentication, and sync controller checks passed`.

- [ ] **Step 5: Commit only Task 1 files**

```bash
git add prototype/cloud-sync.js tests/cloud-sync.test.mjs
git commit --only -m "Add email password auth controller" -- prototype/cloud-sync.js tests/cloud-sync.test.mjs
```

---

### Task 2: Recoverable Guest Backup and New-Account Initialization

**Files:**
- Modify: `prototype/app.js`
- Test: `tests/unit-learning-experience.test.mjs`

**Interfaces:**
- Consumes: `buildCloudSnapshot()`, `saveLocalProgress()`, `learningRecordSnapshot()`, and the existing default state values.
- Produces:
  - `guestBackupStorageKey = "ana-tilim-guest-progress-backup"`
  - `backupGuestProgress(): { ok: boolean, previousValue: string | null }`
  - `restoreGuestProgressBackup(previousValue: string | null): boolean`
  - `initializeNewLearnerProgress(): void`

- [ ] **Step 1: Write failing state tests**

Add assertions that:

```js
state.learningProgress.letters["dot-bone"] = { completed: true };
const backup = backupGuestProgress();
assert.equal(backup.ok, true);
assert.equal(
  JSON.parse(storage["ana-tilim-guest-progress-backup"])
    .learningProgress.letters["dot-bone"].completed,
  true
);

initializeNewLearnerProgress();
assert.equal(state.screen, "home");
assert.equal(state.selectedUnitId, "letters");
assert.equal(state.selectedGroupId, "dot-bone");
assert.deepEqual(state.learningProgress.letters, {});
assert.deepEqual(state.mistakes, []);
```

Add a storage-failure case and assert that `backupGuestProgress().ok` is `false` without changing learning progress. Add rollback assertions proving that a previous backup value is restored after a simulated failed registration.

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
'/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' --test tests/unit-learning-experience.test.mjs
```

Expected: FAIL because the backup and initialization functions are absent.

- [ ] **Step 3: Implement backup and fresh-start functions**

Back up the approved cloud snapshot plus navigation metadata before resetting:

```js
function backupGuestProgress() {
  const storage = localStorageSafe();
  if (!storage) return { ok: false, previousValue: null };
  const previousValue = storage.getItem(guestBackupStorageKey);
  try {
    storage.setItem(
      guestBackupStorageKey,
      JSON.stringify({
        backedUpAt: new Date().toISOString(),
        screen: state.screen,
        selectedUnitId: state.selectedUnitId,
        selectedGroupId: state.selectedGroupId,
        snapshot: buildCloudSnapshot()
      })
    );
    return { ok: true, previousValue };
  } catch {
    return { ok: false, previousValue };
  }
}

function restoreGuestProgressBackup(previousValue) {
  const storage = localStorageSafe();
  if (!storage) return false;
  try {
    if (previousValue === null) {
      storage.removeItem(guestBackupStorageKey);
    } else {
      storage.setItem(guestBackupStorageKey, previousValue);
    }
    return true;
  } catch {
    return false;
  }
}
```

Reset only learning fields and navigation:

```js
function initializeNewLearnerProgress() {
  state.screen = "home";
  state.selectedUnitId = "letters";
  state.selectedGroupId = "dot-bone";
  state.currentLetterId = "be";
  state.learningProgress = {
    letters: {},
    combos: {},
    vocab: {},
    practice: {},
    reading: {}
  };
  state.mistakes = [];
  state.favorite = false;
  state.dailyActivity = { date: "", completedIds: [] };
  markCloudDirty("learning");
  saveLocalProgress();
}
```

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run the command from Step 2.

Expected: PASS.

- [ ] **Step 5: Commit only Task 2 files**

```bash
git add prototype/app.js tests/unit-learning-experience.test.mjs
git commit --only -m "Preserve guest progress for new registration" -- prototype/app.js tests/unit-learning-experience.test.mjs
```

---

### Task 3: Login and Registration Interface

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `prototype/index.html`
- Test: `tests/unit-learning-experience.test.mjs`
- Test: `tests/full-content-render.test.mjs`

**Interfaces:**
- Consumes: Task 1 controller methods and Task 2 backup/reset functions.
- Produces:
  - `state.authMode: "login" | "register"`
  - form actions `show-password-auth`, `switch-auth-mode`, `password-login`, and `password-register`
  - input IDs `password-auth-name`, `password-auth-email`, `password-auth-password`, and `password-auth-confirm`

- [ ] **Step 1: Write failing rendered-interface tests**

Assert that the signed-out welcome and profile auth controls include:

```js
includesAll(authHtml, [
  "登录",
  "注册",
  "邮箱",
  "密码",
  "使用 Google 登录",
  "无需登录，直接开始学习"
]);
```

Switch `state.authMode` to `register` and assert:

```js
includesAll(registerHtml, [
  "昵称",
  "确认密码",
  "注册并开始学习",
  "当前暂不支持邮件找回密码，请保存好密码"
]);
```

Assert password fields use `autocomplete="current-password"` for login and `autocomplete="new-password"` for registration.

- [ ] **Step 2: Run focused render tests and confirm RED**

Run:

```bash
'/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' --test tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
```

Expected: FAIL because the password interface is not rendered.

- [ ] **Step 3: Implement the interface and validation**

Replace the expandable email-OTP-first presentation with a password-auth card containing login/register tabs. Keep email OTP as a secondary expandable option so the existing flow is not removed.

Validation rules:

```js
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!validEmail.test(email)) showToast("请输入有效的邮箱地址");
if (password.length < 8) showToast("密码至少需要 8 个字符");
if (mode === "register" && !displayName) showToast("请输入昵称");
if (mode === "register" && password !== confirmPassword) {
  showToast("两次输入的密码不一致");
}
```

Registration order must be:

```js
const backup = backupGuestProgress();
if (!backup.ok) throw new Error("游客进度备份失败");
try {
  const data = await cloudSync.signUpWithPassword(email, password, displayName);
  if (!data?.session) throw new Error("注册未完成");
  initializeNewLearnerProgress();
  cloudSync.scheduleSync(buildCloudSnapshot());
  state.screen = "home";
  render();
} catch (error) {
  restoreGuestProgressBackup(backup.previousValue);
  throw error;
}
```

To satisfy the “failed registration preserves guest progress” requirement, never call `initializeNewLearnerProgress()` until Supabase registration returns a session. Abort before registration if the backup cannot be written. If registration fails, restore the previous backup value and leave all learning state untouched.

Existing-account login must call only:

```js
await cloudSync.signInWithPassword(email, password);
state.screen = "home";
```

Map common Supabase errors to Chinese:

```js
function passwordAuthErrorMessage(error, mode) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("invalid login credentials")) return "邮箱或密码不正确";
  if (message.includes("already registered")) return "这个邮箱已经注册";
  if (message.includes("email not confirmed")) return "请先完成邮箱确认";
  return mode === "register" ? "注册失败，请稍后重试" : "登录失败，请稍后重试";
}
```

Update cache query strings for `styles.css`, `cloud-sync.js`, and `app.js` to `v=20260729-password-auth`.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run the command from Step 2.

Expected: both files PASS.

- [ ] **Step 5: Commit only Task 3 files**

```bash
git add prototype/app.js prototype/styles.css prototype/index.html tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit --only -m "Add registration and login interface" -- prototype/app.js prototype/styles.css prototype/index.html tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
```

---

### Task 4: Editable Learner Name

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Test: `tests/unit-learning-experience.test.mjs`
- Test: `tests/cloud-sync.test.mjs`

**Interfaces:**
- Consumes: `cloudSync.profile()` and `cloudSync.updateDisplayName(displayName)`.
- Produces: profile action `save-display-name` and input ID `profile-display-name`.

- [ ] **Step 1: Write failing profile tests**

For a signed-in profile, assert rendered HTML contains:

```html
<input id="profile-display-name" maxlength="40" />
<button data-action="save-display-name">保存名称</button>
```

Assert blank names are rejected and a valid name calls `updateDisplayName("New Name")`.

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```bash
'/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' --test tests/cloud-sync.test.mjs tests/unit-learning-experience.test.mjs
```

Expected: FAIL because profile-name editing is absent.

- [ ] **Step 3: Implement profile-name editing**

Render the input only for authenticated users. Trim the name, require 1–40 characters, call `updateDisplayName`, rerender the profile heading, and show `名称已更新`. On failure, keep the current displayed name and show `名称保存失败，请稍后重试`.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run the command from Step 2.

Expected: both files PASS.

- [ ] **Step 5: Commit only Task 4 files**

```bash
git add prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/cloud-sync.test.mjs
git commit --only -m "Allow learners to edit profile name" -- prototype/app.js prototype/styles.css tests/unit-learning-experience.test.mjs tests/cloud-sync.test.mjs
```

---

### Task 5: Supabase Configuration, Full Verification, and Vercel Deployment

**Files:**
- Verify: `prototype/cloud-config.js`
- Verify: `prototype/supabase-schema.sql`
- Verify: all files under `tests/`

**Interfaces:**
- Consumes: completed static frontend and existing Supabase/Vercel projects.
- Produces: live deployment at `https://ana-tilim.vercel.app/`.

- [ ] **Step 1: Run the complete local verification suite**

Run:

```bash
'/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' --test tests/*.test.mjs
'/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node' scripts/check-project.mjs
git diff --check
```

Expected: 9 test files pass, project checks end with `All project checks passed.`, and `git diff --check` prints no errors.

- [ ] **Step 2: Perform local Browser QA**

Start:

```bash
python3 -m http.server 4173 --directory '/Users/nigarayaskar/本地项目/Ana Tilim'
```

The flow under test is:

```text
Welcome -> open password auth -> switch to Register -> validate fields ->
switch to Login -> visit My -> verify profile controls
```

Required evidence:

- URL and title identify Ana Tilim.
- DOM contains meaningful login and registration controls.
- No framework overlay.
- No relevant console errors or warnings.
- Screenshot shows the final desktop layout.
- At least one validation error and one tab switch are exercised.

- [ ] **Step 3: Configure Supabase password registration**

In Supabase Authentication settings:

- Enable Email provider.
- Enable new-user signups.
- Disable “Confirm email” for this phase.
- Keep Google enabled.
- Do not expose or copy private keys into source files.

Verify with the dashboard that Email is enabled and confirmation is disabled.

- [ ] **Step 4: Deploy the exact frontend source to the existing Vercel project**

Deploy the `prototype/` directory to the existing Ana Tilim production project. Do not create a second Vercel project. Preserve the current production URL:

```text
https://ana-tilim.vercel.app/
```

- [ ] **Step 5: Run production Browser QA**

The flow under test is:

```text
Live site -> Register -> create a disposable test account ->
automatic Home redirect -> My -> confirm 0 / 73 and first-unit start ->
refresh -> session remains signed in -> update name -> choose avatar
```

Use a disposable test email owned by the user; do not invent or use another person’s email. If no safe test email is available, verify the registration form and Supabase configuration but report real end-to-end registration as untested.

Required checks:

- Live URL and title are correct.
- Password registration UI is visible.
- Registration enters Home only when a real session exists.
- New account has blank progress and first-unit navigation.
- Refresh restores the session.
- Existing Google login and guest learning remain visible.
- No relevant browser console errors.

- [ ] **Step 6: Final verification report**

Report separately:

- implemented and automated-test verified;
- browser-render verified;
- Supabase configuration verified;
- production deployed;
- real registration tested or explicitly untested;
- any security or delivery limitations, including the absence of password recovery.
