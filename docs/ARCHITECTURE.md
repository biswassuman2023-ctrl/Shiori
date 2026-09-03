# Architecture

## Stack

| Layer     | Choice                                      |
| --------- | ------------------------------------------- |
| Framework | Next.js 16 (App Router, Turbopack)          |
| Language  | TypeScript 5.9 (strict)                     |
| UI        | React 19                                    |
| Styling   | Tailwind CSS v4 (CSS-first `@theme` tokens) |
| Database  | PostgreSQL 17 via Supabase                  |
| Auth      | Supabase Auth                               |
| Files     | Supabase Storage                            |
| Tests     | Vitest + Testing Library, Playwright        |

Deliberately **not** used: Redux, GraphQL, Express, a separate backend service,
microservices, Redis, Kubernetes. None of them has a demonstrated need. Adding
one is a decision to record here, with the need that prompted it.

## Shape of the system

```
Browser ──▶ Next.js (Server Components, Server Actions, Route Handlers)
                │
                └──▶ Supabase (Postgres + Auth + Storage)
                          │
                          └──▶ Row Level Security  ← the security boundary
```

There is no application server between Next.js and Postgres, and no service
layer that "protects" the database. **Row Level Security is the boundary.** The
frontend restricts what is _shown_; the database restricts what is _possible_.

## Content vs. state

The single most important boundary in the schema:

- **Content** — levels, units, lessons, kana, vocabulary, kanji, grammar,
  reading, listening, questions. Authored, versioned, published. Read-only to
  every learner. Written only by ingestion scripts holding the service-role key.
- **Learner state** — progress, mastery, SRS cards, reviews, attempts,
  placement. Written only by the learner it belongs to. Never touched by a
  content pipeline.

No table mixes the two. A learner cannot edit a lesson; an import cannot
overwrite someone's review history. See [DATABASE.md](./DATABASE.md).

## Content is data, not code

A lesson is a row. Its body is an ordered list of `lesson_content` blocks, each
naming a `block_type`. Rendering resolves `block_type` through the registry in
`src/content/registry.ts`.

This is forbidden, and the reason the registry exists:

```tsx
// ✗ never
if (lesson.slug === "n5-introduction") {
  return <N5Intro />;
}
```

Adding a lesson must never require a deploy. Adding a lesson _format_ means:
add a database enum value, add it to `LESSON_BLOCK_TYPES`, write a renderer,
register it. No page component changes. See
[LEARNING-ENGINE.md](./LEARNING-ENGINE.md).

## Directory structure

```
src/
  app/           Routes. Route groups separate marketing / auth / onboarding / app.
  components/    Shared React components. `ui/` holds design-system primitives.
  content/       The content ↔ renderer boundary (block registry).
  hooks/         Client-side React hooks.
  lib/           Framework-level plumbing: env validation, Supabase clients, utils.
  services/      Server-side data access. Routes call these; they never query directly.
  types/         Generated database types, domain types, content shapes.
  test/          Test setup.
supabase/
  migrations/    Ordered, append-only SQL migrations.
docs/            This directory. The source of truth for decisions.
tests/e2e/       Playwright specs.
```

Folders exist because something lives in them. There are no placeholder
directories.

## Layering rule

```
route (app/) → service (services/) → supabase client (lib/supabase/)
```

Routes may not build queries. Services may not import React components.
`lib/` may not import from `services/`. Keeping this one-directional is what
makes services testable without a route and routes readable without a query.

## Authentication

- `src/proxy.ts` runs on every non-asset request and refreshes the Supabase
  session cookie. Next.js 16 renamed this file convention from `middleware`;
  the behaviour is unchanged.
- Session refresh is **all** the proxy does. Route protection lives in the
  routes, where a redirect can carry context about where the learner was going.
- Server code always uses `supabase.auth.getUser()`, never `getSession()`.
  `getUser()` revalidates the token with the auth server; `getSession()` trusts
  a cookie the client can write.
- **TODO — DECISION REQUIRED:** route protection is not implemented. Which
  routes require a session, and where does an unauthenticated visitor land?

## Rendering

Server Components by default. `"use client"` is added when a component needs
state, effects, or event handlers — not by habit. Data is fetched in Server
Components through services; the browser Supabase client exists for
interactive, client-side reads and realtime, not for initial page data.

## State management

React state and URL state, and nothing else, until something demonstrably needs
more. A global store is a decision to record here, not a default.
