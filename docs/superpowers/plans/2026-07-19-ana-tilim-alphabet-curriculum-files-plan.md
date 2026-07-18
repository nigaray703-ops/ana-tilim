# Ana Tilim Alphabet Curriculum Files Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the first human-readable curriculum files for Ana Tilim's alphabet-first learning stage.

**Architecture:** This task creates Markdown curriculum files under `课程/字母/`. `00-字母基础路线.md` defines the full 32-letter route and staged learning order. `01-第一组-ئا-ب-ل.md` defines the first three-letter group with teaching notes, shape tables, writing notes, keyboard exercises, and review status.

**Tech Stack:** Markdown content files only; no app code, no build step, no dependency install.

## Global Constraints

- Keep curriculum files inside `课程/字母/`.
- Do not modify the clickable prototype in `prototype/`.
- Use standard Uyghur as the main course line.
- Treat regional/family variants as variant metadata, not as primary answers.
- Mark language-sensitive content as `待母语者审校`.
- First content batch covers the route plus first group only: `ئا`、`ب`、`ل`.
- Include source/reference notes for the 32-letter alphabet and first-group shape assumptions.

---

### Task 1: Alphabet Route File

**Files:**
- Create: `课程/字母/00-字母基础路线.md`

**Interfaces:**
- Produces: a human-readable route that later curriculum files and app data can follow.
- Consumes: `docs/superpowers/specs/2026-07-19-ana-tilim-alphabet-foundation-design.md`.

- [ ] **Step 1: Create the directory**

Run:

```bash
mkdir -p '课程/字母'
```

Expected: `课程/字母` exists.

- [ ] **Step 2: Write the route file**

Create `课程/字母/00-字母基础路线.md` with:

- goal and standard-language principle
- full 32-letter directory
- staged groups from concept to vowels
- what each lesson should contain
- review rules
- source links

- [ ] **Step 3: Verify the route file exists**

Run:

```bash
test -s '课程/字母/00-字母基础路线.md'
```

Expected: command exits successfully.

---

### Task 2: First Group File

**Files:**
- Create: `课程/字母/01-第一组-ئا-ب-ل.md`

**Interfaces:**
- Consumes: route order from `课程/字母/00-字母基础路线.md`.
- Produces: first-group lesson content for `ئا`、`ب`、`ل`.

- [ ] **Step 1: Write first-group overview**

Create top sections covering:

- why this group comes first
- learning goals
- lesson order
- validation status

- [ ] **Step 2: Write letter sections**

For each of `ئا`、`ب`、`ل`, include:

- basic identity
- shape table
- connection rule
- sound hint
- writing hint
- keyboard exercise
- common confusion notes
- example use
- review status

- [ ] **Step 3: Verify first-group file exists**

Run:

```bash
test -s '课程/字母/01-第一组-ئا-ب-ل.md'
```

Expected: command exits successfully.

---

### Task 3: Content QA

**Files:**
- Inspect: `课程/字母/00-字母基础路线.md`
- Inspect: `课程/字母/01-第一组-ئا-ب-ل.md`

**Interfaces:**
- Consumes: created Markdown files.
- Produces: confidence that the files match the user-approved direction.

- [ ] **Step 1: Search for accidental placeholders**

Run:

```bash
rg -n 'T[O]D[O]|T[B]D|待[定]|未[确]定' '课程/字母'
```

Expected: no matches.

- [ ] **Step 2: Search for variant policy wording**

Run:

```bash
rg -n '标准维吾尔语|变体|待母语者审校' '课程/字母'
```

Expected: both files clearly mention standard Uyghur and review status.

- [ ] **Step 3: Final git status check**

Run:

```bash
git status --short
```

Expected: only intended curriculum and plan files are new or modified, aside from pre-existing untracked source-material files.
