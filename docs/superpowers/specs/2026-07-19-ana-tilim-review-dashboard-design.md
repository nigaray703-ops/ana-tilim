# Ana Tilim Review Dashboard Design

## Goal

Build a local review dashboard inside the Ana Tilim prototype so the project can track review status, family-name priority items, and audio readiness without adding new course content.

## Approved Direction

The user approved the next step after this design was proposed:

- add unified review status fields
- add a review dashboard page
- highlight family/basic address terms
- expose audio recording and integration status

## Scope

In scope:

- Derive review items from existing Unit 1-4 content.
- Support review states: `待审校`, `通过`, `需修改`, `只展示不考核`, `变体保留`, `待二审`.
- Support audio states: `真人音频待录制`, `已录制`, `已接入`.
- Let the user click status buttons in the prototype to simulate backfilling review results.
- Keep changes local to the static prototype and Markdown docs.

Out of scope:

- No new vocabulary.
- No backend.
- No real audio files.
- No permanent export format beyond the existing Markdown package.

## Interface

Entry points:

- Home quick entry: `审校看板`
- Profile page button: `审校看板`

Dashboard sections:

- Summary metrics for pending review, needs-edit items, family priority, and audio pending.
- Filter buttons for all, pending, needs edit, display-only, variants, family priority, and audio pending.
- Selected item detail with Uyghur text, unit, type, review question, exam policy, review status, and audio status.
- Review status buttons to backfill the selected item.
- Audio status buttons to backfill the selected item.
- Clickable item list.

## Data Model

Each review item has:

- `id`
- `unit`
- `kind`
- `theme`
- `value`
- `latin`
- `meaning`
- `reviewStatus`
- `examPolicy`
- `audioStatus`
- `priority`
- `question`

The prototype stores user interactions in in-memory state. A later version can save this state to a file, localStorage, or a proper database.

## Validation

Validation must prove:

- the dashboard opens from home
- profile entry opens the dashboard
- filter buttons change visible items
- review status buttons update counts and selected item text
- audio status buttons update selected item text
- family terms are visible as priority items
- existing learning paths still render
