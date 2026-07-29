# Ana Tilim Public README Design

## Goal

Create a trustworthy bilingual README for the public `nigaray703-ops/ana-tilim`
repository. It should help GitHub visitors understand the product quickly,
visit the verified Vercel deployment, and run and verify the current prototype.

## Audience and language

- Lead with concise English for public GitHub visitors.
- Follow each major explanation with concise Chinese guidance for the owner and
  Chinese-speaking contributors.
- Keep the project name in Latin and Uyghur script where appropriate.

## Content structure

1. Project title, Uyghur name, one-sentence positioning, and the existing logo.
2. A prominent live-demo link to `https://ana-tilim.vercel.app/`, verified to
   return HTTP 200 and identify itself as Ana Tilim.
3. Feature overview covering course content, ULY transliteration, human audio,
   learning activities, offline progress, authentication, and Supabase sync.
4. Privacy notice explaining that the repository and bundled human recordings
   are public, while users' learning data remains local or UID-scoped in
   Supabase according to the included schema.
5. Local quick start using a static HTTP server from the `prototype` directory.
6. Verification command: `node scripts/check-project.mjs`.
7. Compact repository structure guide.
8. Technology summary and current limitations.
9. Contribution guidance directing language and audio corrections through the
   review materials already in the repository.

## Accuracy rules

- Do not add badges for CI, coverage, releases, licenses, or deployments that do
  not exist.
- Do not claim native iOS/Android applications or production readiness.
- Use `https://ana-tilim.vercel.app/` as the only verified live website.
- Describe the Supabase browser key as a publishable client key, not a secret.
- Do not invent installation dependencies; the prototype is static HTML, CSS,
  and JavaScript served over HTTP.
- Keep commands portable and avoid machine-specific absolute paths.

## Visual treatment

- Use the existing `prototype/assets/logo.png` at the top.
- Use restrained headings, short paragraphs, and compact lists.
- Avoid large decorative badge rows and excessive emoji.

## Validation

- Run `git diff --check`.
- Run `node scripts/check-project.mjs`.
- Review all Markdown links and referenced paths locally.
- Confirm the README does not contain placeholder text or an unverified URL.
