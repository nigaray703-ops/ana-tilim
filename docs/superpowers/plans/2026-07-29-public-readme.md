# Ana Tilim Public README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an accurate bilingual public README that introduces Ana Tilim, links to the verified live website, and documents local use and verification.

**Architecture:** Create one repository-level `README.md` that acts as both the GitHub landing page and the contributor quick-start guide. Reuse the existing logo and repository paths; do not change application code or add dependencies.

**Tech Stack:** GitHub-flavored Markdown, static HTML/CSS/JavaScript, Node.js project checks, Vercel, Supabase

## Global Constraints

- Lead with concise English and provide concise Chinese guidance.
- Use `https://ana-tilim.vercel.app/` as the only verified live website.
- Do not claim native iOS/Android applications or production readiness.
- Do not add unsupported CI, coverage, release, license, or deployment badges.
- Describe the Supabase browser key as publishable client configuration, not a secret.
- Keep all commands portable and free of machine-specific absolute paths.

---

### Task 1: Create and publish the repository README

**Files:**
- Create: `README.md`
- Verify: `prototype/assets/logo.png`
- Verify: `scripts/check-project.mjs`

**Interfaces:**
- Consumes: the existing static prototype, logo, test runner, review package, and verified Vercel deployment.
- Produces: a GitHub-rendered bilingual project landing page at repository root.

- [ ] **Step 1: Create the bilingual README**

Create `README.md` with:

- A centered `prototype/assets/logo.png` image and the titles `Ana Tilim` and `ئانا تىلىم`.
- A concise English description followed by its Chinese explanation.
- Prominent links to the live website and GitHub repository.
- Sections named `About / 项目介绍`, `What is included / 已实现内容`, `Try it online / 在线体验`, `Run locally / 本地运行`, `Verification / 项目检查`, `Repository structure / 项目结构`, `Data and privacy / 数据与隐私`, `Current status / 当前状态`, and `Contributing / 内容审校与贡献`.
- The local-start commands:

```bash
cd prototype
python3 -m http.server 4173
```

- The local URL `http://localhost:4173/`.
- The verification command:

```bash
node scripts/check-project.mjs
```

- A privacy statement that the public repository includes bundled human-language recordings, while local learning data stays in the browser unless the learner signs in and enables UID-scoped Supabase synchronization.
- A status statement that the project is a working mobile-first web prototype and is not yet a native iOS or Android application.
- A contribution pointer to `审校与音频准备包/` for language and audio corrections.

- [ ] **Step 2: Verify all README paths**

Run:

```bash
test -f README.md
test -f prototype/assets/logo.png
test -f scripts/check-project.mjs
test -d 审校与音频准备包
```

Expected: all commands exit with status 0.

- [ ] **Step 3: Verify the live website**

Run:

```bash
curl -fsSL https://ana-tilim.vercel.app/ | rg -q '<title>Ana Tilim</title>'
```

Expected: command exits with status 0.

- [ ] **Step 4: Run Markdown and project checks**

Run:

```bash
git diff --check
node scripts/check-project.mjs
```

Expected: no whitespace errors and `All project checks passed.`

- [ ] **Step 5: Review the final diff**

Run:

```bash
git status -sb
git diff -- README.md
```

Expected: only the planned README and implementation-plan changes are pending beyond the already committed design document.

- [ ] **Step 6: Commit the README and plan**

Run:

```bash
git add README.md docs/superpowers/plans/2026-07-29-public-readme.md
git commit -m "Add bilingual project README"
```

Expected: a new commit containing only the README and its implementation plan.

- [ ] **Step 7: Publish and merge**

Push `agent/add-public-readme`, open a pull request into `main`, verify the pull-request diff, merge it, and confirm that GitHub `main` renders the new README.

Expected: `README.md` is present on `https://github.com/nigaray703-ops/ana-tilim` and the local `main` commit matches `origin/main`.
