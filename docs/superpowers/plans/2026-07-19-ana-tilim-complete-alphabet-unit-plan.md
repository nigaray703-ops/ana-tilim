# Ana Tilim Complete Alphabet Unit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the alphabet-stage curriculum so Ana Tilim uses the screenshot alphabet order, teaches similar letters together, and reserves word/phrase learning for Unit 2.

**Architecture:** Keep course content as Markdown under `课程/字母/`. Make `00-字母基础路线.md` the canonical route, add one complete Unit 1 curriculum file for all 32 letters, and keep older group files as historical detailed drafts. Update the static prototype data/copy so the user-facing route follows the new unit structure.

**Tech Stack:** Markdown curriculum files, static HTML/CSS/vanilla JavaScript prototype, Node syntax/runtime checks.

## Global Constraints

- All files stay under `/Users/divenp/Documents/Ana Tilim`.
- Main alphabet order follows the user-provided screenshot: `ئا`, `ئە`, `ب`, `پ`, `ت`, `ج`, `چ`, `خ`, `د`, `ر`, `ز`, `ژ`, `س`, `ش`, `غ`, `ف`, `ق`, `ك`, `گ`, `ڭ`, `ل`, `م`, `ن`, `ھ`, `ئو`, `ئۇ`, `ئۆ`, `ئۈ`, `ۋ`, `ئې`, `ئى`, `ي`.
- Unit 1 is named `认识字母`.
- Unit 1 teaches letters only: shape, sound hint, point pattern, joining behavior, forms, keyboard, and recognition exercises.
- Similar letters are grouped together inside Unit 1, even when dot count differs or the letters are not adjacent in the screenshot order.
- The first active learning group is `ب / پ / ت / ن`.
- Unit 2 starts adding combinations and simple word/phrase learning, but detailed vocabulary remains outside this task.
- The prototype learning page shows multiple units. Clicking a unit opens a detail page with a back button and smaller learning points.
- Standard Uyghur is the main course line.
- All language-sensitive content remains marked `待母语者审校`.
- Family/basic terms are not introduced as Unit 1 answers.
- Do not delete existing first/second group drafts in this task.

---

### Task 1: Canonical Alphabet Route

**Files:**
- Modify: `课程/字母/00-字母基础路线.md`

**Interfaces:**
- Consumes: existing route file and user-provided screenshot order.
- Produces: canonical route used by later curriculum and prototype updates.

- [x] **Step 1: Replace old group model**

Rewrite `学习分组` into:

- `第一单元：认识字母`
- `第二单元：字母组合与词组入门`
- later units for theme vocabulary, listening/speaking, writing/keyboard.

- [x] **Step 2: Add similarity groups**

Inside Unit 1, define similarity groups:

- `ب / پ / ت / ن`
- `ج / چ / خ`
- `د / ر / ز / ژ`
- `س / ش`
- `غ / ف / ق`
- `ك / گ / ڭ`
- `ل / م / ھ`
- `ۋ / ي`
- `ئا / ئە / ئو / ئۇ / ئۆ / ئۈ / ئې / ئى`

- [x] **Step 3: Update status table**

Mark all 32 letters as `第一单元草稿已创建`.

---

### Task 2: Complete Unit 1 Curriculum File

**Files:**
- Create: `课程/字母/01-第一单元-认识字母.md`

**Interfaces:**
- Consumes: canonical route from Task 1.
- Produces: complete alphabet-stage draft for all 32 letters.

- [x] **Step 1: Add unit purpose and rules**

Include:

- Unit purpose
- Review status
- Standard Uyghur principle
- rule that Unit 1 does not teach family/basic terms
- screenshot order list

- [x] **Step 2: Add 32-letter reference table**

For every letter, include:

- order number
- letter
- latin
- type
- point/shape cue
- joining behavior
- four forms
- review status

- [x] **Step 3: Add group-by-similarity lessons**

For each similarity group, include:

- teaching goal
- key contrast
- recognition exercise
- writing/keyboard exercise
- review note

- [x] **Step 4: Add Unit 1 completion check**

Define what the user can do before Unit 2:

- recognize all 32 letters in the screenshot order
- explain basic point differences
- choose correct forms
- type individual letters
- identify which letters do not continue joining

---

### Task 3: Prototype Route Sync

**Files:**
- Modify: `prototype/app.js`
- Modify: `prototype/styles.css` only if needed

**Interfaces:**
- Consumes: new route naming and similarity groups.
- Produces: prototype learning path that matches `第一单元：认识字母`.

- [x] **Step 1: Update alphabet group data**

Update `alphabetGroups` so prototype groups match Unit 1 similarity groups and Unit 2 preview.

- [x] **Step 2: Update first visible lesson**

Change current first lesson from old `ئا / ب / ل` framing to the similar-letter group `ب / پ / ت / ن`.

- [x] **Step 3: Update copy**

Update home, learning path, completion, and profile copy so they say:

- `第一单元：认识字母`
- `第二单元开始加入组合 / 词组`
- `待母语者审校`

- [x] **Step 4: Add unit detail navigation**

Update the learning page so it shows multiple units. Each unit opens a detail page with:

- back button
- unit description
- smaller bullet points
- group cards for the unit content

---

### Task 4: Validation And Commit

**Files:**
- Inspect: all modified Markdown and prototype files.

**Interfaces:**
- Consumes: completed Tasks 1-3.
- Produces: verified local commit.

- [x] **Step 1: Markdown/content checks**

Run:

```bash
git diff --check
rg -n "妈妈|爸爸|母亲|父亲|正式词汇答案" 课程/字母/01-第一单元-认识字母.md 课程/字母/00-字母基础路线.md prototype/app.js
```

Expected:

- no whitespace errors
- no family/basic terms introduced as Unit 1 answers

- [x] **Step 2: Prototype syntax check**

Run:

```bash
/Users/divenp/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check prototype/app.js
```

Expected: exit code 0.

- [x] **Step 3: Runtime flow check**

Run the existing lightweight Node DOM-stub flow check against `prototype/app.js`.

Expected:

- home renders Unit 1
- learning path shows 32 letters
- first visible lesson shows `ب`, `پ`, `ت`, `ن`
- Unit 2 preview is present

- [x] **Step 4: Commit**

Stage only intended files and commit:

```bash
git add 课程/字母/00-字母基础路线.md 课程/字母/01-第一单元-认识字母.md prototype/app.js prototype/styles.css docs/superpowers/plans/2026-07-19-ana-tilim-complete-alphabet-unit-plan.md
git commit -m "Complete alphabet recognition unit"
```
