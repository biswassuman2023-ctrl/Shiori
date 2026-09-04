# Japanese learning platform

> **Learn Japanese from where you actually are.**

A learning platform built around a fixed curriculum ladder and a personalised
entry point into it:

```
Hiragana → Katakana → JLPT N5 → N4 → N3 → N2 → N1
```

The ladder is the same for everyone. Onboarding, a diagnostic and placement
decide _where you join it_; spaced repetition decides _what you review today_.

## Status

**One real lesson.** The foundation (repository, database schema, security
model, design tokens, routing skeleton) is in place, and the first vertical
slice is built: `/learn/hiragana/gojuon/a-i-u-e-o` — a real, database-backed
lesson teaching あいうえお, with practice, retry, progress persistence and SRS
card creation. Every other route still renders a placeholder.

Verified end-to-end against a real local Supabase/Postgres instance: schema,
seed data, the full lesson flow, progress persistence across reloads, and SRS
card creation and idempotency. `npm run test:e2e -- lesson.spec.ts` needs
`RUN_DB_DEPENDENT_E2E=1` and a seeded local stack; one of its four tests is a
known dev-mode-only flake (see docs/DEVELOPMENT.md "Known gaps") that does not
reproduce in a production build.

Next: everything else, one skill at a time — see
[docs/PRODUCT.md](docs/PRODUCT.md) ("Build order").

## Quick start

```bash
npm install
cp .env.example .env.local     # fill in the Supabase values
npm run dev                    # http://localhost:3000
```

For the database (needs Docker):

```bash
npm run db:start               # prints an API URL and anon key for .env.local
npm run db:reset               # apply every migration
npm run db:types               # generate src/types/database.generated.ts
```

Before committing:

```bash
npm run verify                 # format + lint + typecheck + test + build
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript 5.9 · Tailwind CSS v4 ·
Supabase (PostgreSQL 17, Auth, Storage) · Vitest · Playwright

## Documentation

`docs/` is the source of truth. Decisions live there; unmade decisions are
marked **TODO — DECISION REQUIRED** rather than quietly invented.

| Document                                      | Covers                               |
| --------------------------------------------- | ------------------------------------ |
| [PRODUCT.md](docs/PRODUCT.md)                 | The promise, scope, build order      |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)       | Stack, boundaries, layering          |
| [DATABASE.md](docs/DATABASE.md)               | Schema, content-item model, RLS      |
| [CURRICULUM.md](docs/CURRICULUM.md)           | The ladder and its structure         |
| [CONTENT-BIBLE.md](docs/CONTENT-BIBLE.md)     | Sourcing, licensing, authoring rules |
| [DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md)     | Tokens, personality, contrast data   |
| [LEARNING-ENGINE.md](docs/LEARNING-ENGINE.md) | Blocks, renderer registry, mastery   |
| [SRS.md](docs/SRS.md)                         | Review scheduling                    |
| [DIAGNOSTIC.md](docs/DIAGNOSTIC.md)           | Diagnostic and placement             |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md)         | Setup, conventions, scripts          |

## Two rules worth knowing before you write code

1. **Content is data, not code.** Lessons are database rows rendered through
   `src/content/registry.ts`. Nothing branches on a lesson slug.
2. **Row Level Security is the security boundary.** The frontend restricts what
   is shown; the database restricts what is possible.
