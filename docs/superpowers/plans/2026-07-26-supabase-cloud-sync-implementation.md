# Supabase Authentication and Automatic Cloud Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional Supabase-backed Google/email-OTP authentication and automatic local-first learning-data synchronization while preserving a fully usable local mode.

**Architecture:** A pinned Supabase browser client provides authentication and RLS-protected table access. A focused `cloud-sync.js` contains pure snapshot/merge functions and a debounced synchronization controller; `app.js` supplies normalized local snapshots, applies merged results, and renders non-interactive status.

**Tech Stack:** Plain browser JavaScript, `@supabase/supabase-js` 2.110.8 UMD build, Supabase Auth, Postgres JSONB, Row Level Security, Node `assert`/`vm` tests, in-app Browser QA.

## Global Constraints

- Google login is primary outside mainland China; email one-time code is the fallback.
- Local mode must always remain usable.
- Every learning mutation saves locally before any network request.
- Sync is automatic; do not add a manual “sync now” button.
- Never expose `service_role`, database passwords, or Google Client Secret.
- The browser may contain only Project URL and Supabase Publishable key.
- Progress merges must not make completed learning go backward.
- Preserve at least 464 render states and exactly 565 logical audio targets.
- Use failing tests before production changes.
- Live integration requires the user's Supabase Project URL and Publishable key, but no private credentials.
- If Git author identity is unavailable, do not configure it implicitly.

---

### Task 1: Cloud configuration and secure database schema

**Files:**
- Create: `prototype/cloud-config.js`
- Create: `prototype/supabase-schema.sql`
- Create: `tests/supabase-schema.test.mjs`
- Modify: `prototype/index.html`
- Modify: `scripts/check-project.mjs`
- Modify: `tests/unit-learning-experience.test.mjs`

**Interfaces:**
- Produces `window.ANA_TILIM_CLOUD_CONFIG`:
  - `supabaseUrl: string`
  - `supabasePublishableKey: string`
- Produces table `public.learning_backups`.

- [ ] **Step 1: Write the failing schema/config tests**

Assert:

- config exists and contains only the two allowed keys;
- source does not contain `service_role`, database password fields, or a Google secret value;
- SQL enables RLS;
- SQL has separate select/insert/update policies using `auth.uid() = user_id`;
- `user_id` is the primary key and references `auth.users(id)`.

Use source assertions for SQL security policy because no local Postgres instance is part of this repository.

- [ ] **Step 2: Run and verify missing files fail**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/supabase-schema.test.mjs
```

Expected: FAIL because config and SQL are absent.

- [ ] **Step 3: Add local-mode defaults**

Create:

```js
window.ANA_TILIM_CLOUD_CONFIG = Object.freeze({
  supabaseUrl: "",
  supabasePublishableKey: ""
});
```

Empty values intentionally mean local mode. During live integration, replace only these two values with the user's Project URL and Publishable key.

- [ ] **Step 4: Add the exact SQL schema**

Create a migration script containing:

```sql
create table if not exists public.learning_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  schema_version integer not null,
  payload jsonb not null,
  client_updated_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.learning_backups enable row level security;
grant select, insert, update on public.learning_backups to authenticated;

create policy "read own learning backup"
on public.learning_backups for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "insert own learning backup"
on public.learning_backups for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "update own learning backup"
on public.learning_backups for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
```

Include idempotent `drop policy if exists` statements before creating policies.

- [ ] **Step 5: Load the pinned client and config**

Before `cloud-sync.js` and `app.js`, add:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.8"></script>
<script src="./cloud-config.js?v=20260726-listening-offline-sync"></script>
```

The application must not fail when the external client cannot load; cloud initialization checks both `window.supabase?.createClient` and non-empty config.

Extend the asset contract to pin `cloud-config.js`, `cloud-sync.js`, and the Supabase CDN URL exactly; do not leave the SDK on a floating `@2` version.

- [ ] **Step 6: Add checks and run**

Add schema/config tests and syntax checks to `scripts/check-project.mjs`.

- [ ] **Step 7: Commit schema and configuration**

```bash
git add prototype/cloud-config.js prototype/supabase-schema.sql prototype/index.html tests/supabase-schema.test.mjs tests/unit-learning-experience.test.mjs scripts/check-project.mjs
git commit -m "feat: add secure cloud sync schema"
```

---

### Task 2: Pure snapshot merge logic

**Files:**
- Create: `prototype/cloud-sync.js`
- Create: `tests/cloud-sync.test.mjs`
- Modify: `prototype/index.html`
- Modify: `scripts/check-project.mjs`
- Modify: `tests/unit-learning-experience.test.mjs`

**Interfaces:**
- Produces `window.ANA_TILIM_CLOUD`:
  - `SCHEMA_VERSION`
  - `normalizeSnapshot(value)`
  - `mergeSnapshots(localSnapshot, remoteSnapshot)`
  - `createCloudSync(options)`
- Snapshot:

```js
{
  schemaVersion: 1,
  modifiedAt: "ISO timestamp",
  preferencesUpdatedAt: "ISO timestamp",
  favoriteUpdatedAt: "ISO timestamp",
  learningProgress: { letters, combos, vocab, practice, reading },
  mistakes: [],
  favorite: false,
  dailyActivity: { date: "YYYY-MM-DD", completedIds: [] },
  preferences: {}
}
```

- [ ] **Step 1: Write failing merge tests**

Cover:

- local letter completion plus remote combo completion yields both;
- a remote older `completed: false` cannot undo local `completed: true`;
- nested completion ID arrays are unioned and deduplicated;
- mistakes dedupe on `kind|targetId|pickedId` and keep the newest 24;
- same-day daily completed IDs union;
- different-day daily activity keeps the newer date;
- preferences use `preferencesUpdatedAt`;
- favorite uses `favoriteUpdatedAt`;
- an unsupported future schema throws a typed `UnsupportedCloudSchemaError`.

- [ ] **Step 2: Run and verify missing global failure**

Expected: FAIL because `ANA_TILIM_CLOUD` is absent.

- [ ] **Step 3: Implement normalization**

Return a complete snapshot even when optional objects are absent. Reject non-object payloads and future schema versions. Do not preserve screen, current lesson, keyboard input, account email, or audio state.

- [ ] **Step 4: Implement monotonic progress merge**

Recursively merge progress records:

- booleans named `completed` use logical OR;
- arrays whose names end in `Ids` use stable union;
- other scalar step fields use the value from the snapshot with newer `modifiedAt`;
- preserve all known scope keys.

- [ ] **Step 5: Implement deterministic mistake merge**

Create:

```js
function mistakeKey(item) {
  return [item.kind, item.targetId, item.pickedId || ""].join("|");
}
```

Sort by `createdAt` descending when present, preserve stable input order otherwise, and cap at 24.

- [ ] **Step 6: Load and check**

Add:

```html
<script src="./cloud-sync.js?v=20260726-listening-offline-sync"></script>
```

before `app.js`. Add syntax and test entries to the project check.

Load `cloud-config.js` and `cloud-sync.js` before `app.js` in both VM render harnesses. Their empty config must exercise local mode without needing the external Supabase SDK.

- [ ] **Step 7: Run focused and complete tests**

Expected: all pure merge cases pass with no network.

- [ ] **Step 8: Commit merge logic**

```bash
git add prototype/cloud-sync.js prototype/index.html tests/cloud-sync.test.mjs tests/unit-learning-experience.test.mjs scripts/check-project.mjs
git commit -m "feat: add cloud snapshot merging"
```

---

### Task 3: Authentication controller with Google and email OTP

**Files:**
- Modify: `prototype/cloud-sync.js`
- Modify: `tests/cloud-sync.test.mjs`
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

**Interfaces:**
- `createCloudSync(options)` consumes:
  - `supabaseClient`
  - `getLocalSnapshot()`
  - `applyMergedSnapshot(snapshot)`
  - `saveMergedSnapshot()`
  - `onStatus(status)`
  - `now()`
  - `setTimeoutFn`
  - `clearTimeoutFn`
- Produces:
  - `start(): Promise<void>`
  - `signInWithGoogle(redirectTo): Promise<void>`
  - `requestEmailOtp(email): Promise<void>`
  - `verifyEmailOtp(email, token): Promise<void>`
  - `signOut(): Promise<void>`
  - `session(): object | null`
  - `status(): object`

- [ ] **Step 1: Write failing controller tests with a small fake client**

The fake exposes `auth.getSession`, `auth.onAuthStateChange`, `auth.signInWithOAuth`, `auth.signInWithOtp`, `auth.verifyOtp`, and `auth.signOut`.

Assert:

```js
signInWithOAuth({
  provider: "google",
  options: { redirectTo: "http://127.0.0.1:4173/prototype/" }
});
```

Assert email request uses `signInWithOtp({ email, options: { shouldCreateUser: true } })` and verification uses `verifyOtp({ email, token, type: "email" })`.

Assert missing client/config returns local mode and does not throw.

- [ ] **Step 2: Run and verify missing methods fail**

Expected: FAIL because authentication methods are not implemented.

- [ ] **Step 3: Implement auth state handling**

Subscribe to `onAuthStateChange`; on `SIGNED_IN`, store the session and start reconciliation; on `SIGNED_OUT`, clear only the cloud session/status and leave local learning data intact.

- [ ] **Step 4: Replace mock account actions**

In profile:

- local mode shows “使用 Google 登录” and “使用邮箱验证码”;
- email flow has an email field, “发送验证码”, code field, and “确认登录”;
- authenticated mode shows verified account email and “退出登录”;
- login error copy is concise and does not expose raw tokens or responses.

Do not show email OTP fields until the learner chooses that option.

- [ ] **Step 5: Add click/input handling**

Use existing event delegation for buttons. Add narrowly scoped input reads by stable element IDs when requesting/verifying OTP. Do not store OTP in `state` or localStorage.

- [ ] **Step 6: Document Supabase dashboard setup**

Add a non-learner section to the SQL/setup document explaining:

- enable Google provider and configure its Client ID/Secret only in Supabase Dashboard;
- add the local and deployed redirect URLs;
- edit the email OTP template to include `{{ .Token }}` for code entry;
- execute `supabase-schema.sql`;
- paste only Project URL and Publishable key into `cloud-config.js`.

- [ ] **Step 7: Run focused and complete checks**

Expected: local mode, Google action, email OTP action, and sign-out preservation pass in tests.

- [ ] **Step 8: Commit authentication**

```bash
git add prototype/cloud-sync.js prototype/app.js prototype/styles.css prototype/supabase-schema.sql tests/cloud-sync.test.mjs tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: add Supabase authentication"
```

---

### Task 4: Debounced automatic synchronization

**Files:**
- Modify: `prototype/cloud-sync.js`
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css`
- Modify: `tests/cloud-sync.test.mjs`
- Modify: `tests/unit-learning-experience.test.mjs`
- Modify: `tests/full-content-render.test.mjs`

**Interfaces:**
- Adds controller methods:
  - `scheduleSync(snapshot): void`
  - `syncNow(): Promise<void>` for internal controller use only
  - `handleOnline(): Promise<void>`
- `syncNow()` is not exposed as a learner button.

- [ ] **Step 1: Write failing controller tests**

Assert:

- three local saves inside 1.5 seconds schedule one upsert;
- offline schedule emits `waiting-network` and performs no request;
- `handleOnline()` retries pending work;
- remote read failure leaves local data unchanged;
- remote future schema emits `update-required` and performs no upsert;
- successful reconciliation applies the merged snapshot locally before cloud upsert;
- row payload contains only the approved snapshot fields.

- [ ] **Step 2: Run and verify missing scheduling failure**

Expected: FAIL because `scheduleSync` is missing.

- [ ] **Step 3: Implement table read/upsert**

Read:

```js
supabaseClient
  .from("learning_backups")
  .select("schema_version,payload,client_updated_at,updated_at")
  .eq("user_id", user.id)
  .maybeSingle();
```

Upsert:

```js
supabaseClient.from("learning_backups").upsert({
  user_id: user.id,
  schema_version: snapshot.schemaVersion,
  payload: snapshot,
  client_updated_at: snapshot.modifiedAt
});
```

Rely on the authenticated session and RLS; never add a user ID taken from arbitrary page input.

- [ ] **Step 4: Add a 1.5-second debounce**

Add `state.syncDirty` as transient, non-persisted state. Learning, mistake, daily-activity, preference, and favorite mutation helpers set it to `true`; navigation-only saves do not. After a successful `saveLocalProgress()`, call `cloudSync.scheduleSync(buildCloudSnapshot())` only when `syncDirty` is true, then clear it after the controller accepts the snapshot. The controller owns the timer and pending flag. Applying a merged cloud snapshot saves locally with scheduling suppressed so it cannot recurse.

- [ ] **Step 5: Track field timestamps**

Add persisted `modifiedAt`, `preferencesUpdatedAt`, and `favoriteUpdatedAt`. Update:

- `modifiedAt` for any learning, mistake, or daily-activity mutation;
- `preferencesUpdatedAt` for preference actions;
- `favoriteUpdatedAt` for favorite actions.

Normalize absent timestamps for existing users without discarding their data.

- [ ] **Step 6: Render passive sync status**

In the profile account/data section render:

```text
本地模式
正在登录
正在同步
已同步 · HH:MM
当前离线，等待同步
同步失败，将自动重试
应用版本过旧，请先更新
```

There is no manual-sync button.

- [ ] **Step 7: Run focused and complete checks**

Expected: local persistence still succeeds when every fake cloud request fails.

- [ ] **Step 8: Commit automatic sync**

```bash
git add prototype/cloud-sync.js prototype/app.js prototype/styles.css tests/cloud-sync.test.mjs tests/unit-learning-experience.test.mjs tests/full-content-render.test.mjs
git commit -m "feat: add automatic learning sync"
```

---

### Task 5: Live Supabase setup and end-to-end validation

**Files:**
- Modify: `prototype/cloud-config.js` with the user's Project URL and Publishable key.
- Modify only proven defects found during live QA.

**Interfaces:**
- Consumes the user's non-secret Supabase Project URL and Publishable key.
- Consumes the dashboard configuration and `supabase-schema.sql`.
- Produces verified Google, email OTP, automatic upload, and restore flows.

- [ ] **Step 1: Obtain only the two allowed browser values**

Ask the user for:

```text
Project URL
Publishable key
```

Explicitly reject or redact any supplied `service_role`, database password, or Google Client Secret.

- [ ] **Step 2: Confirm dashboard prerequisites**

The user or authorized operator must:

- run `prototype/supabase-schema.sql`;
- enable Google provider;
- configure Google Client ID/Secret in Supabase Dashboard;
- add the local/deployed redirect URLs;
- configure the email OTP template.

Do not attempt live auth until these are confirmed.

- [ ] **Step 3: Run the complete local test suite**

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/check-project.mjs
```

- [ ] **Step 4: Validate local mode first**

Temporarily use empty config, reload, confirm the entire course works and “本地模式” is shown without console errors.

- [ ] **Step 5: Validate Google login**

Restore the approved config, click Google login, and stop for user interaction if the browser requires selecting an account or entering credentials. After the user completes authentication, verify the profile email and an initial `learning_backups` row.

- [ ] **Step 6: Validate email OTP fallback**

Use a test email account supplied by the user. Send a code, let the user retrieve it, verify it, and confirm the same automatic sync behavior. Never read or transmit a code without explicit user authorization.

- [ ] **Step 7: Validate two-device semantics**

Use two isolated browser storage contexts if the Browser capability supports them; otherwise use export/import fixtures plus controller tests and document the limitation. Verify:

1. device A completes a letter;
2. device B completes a vocabulary item;
3. both reconnect;
4. the merged cloud row and both local snapshots contain both completions.

- [ ] **Step 8: Validate offline recovery**

Disconnect or simulate offline, complete learning locally, reconnect, and verify one debounced upload and “已同步” status.

- [ ] **Step 9: Run security and regression checks**

Confirm:

- network requests contain the Publishable key but no private key;
- RLS denies reading another arbitrary `user_id`;
- no session token appears in learner text or logs;
- 390×844 and 952×998 layouts remain clean;
- 464+ states and 565 audio targets pass;
- console has no relevant warnings/errors.

- [ ] **Step 10: Commit live configuration only if the user wants it tracked**

The Publishable key is intended for frontend use, but ask whether the user wants `cloud-config.js` committed or supplied only at deployment time. Never commit private credentials.
